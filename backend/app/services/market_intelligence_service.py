import asyncio
from datetime import date
from decimal import Decimal

from pydantic import ValidationError

from app.helpers.exceptions import SectorsInvalidResponseError, ValidationAppError
from app.helpers.schemas import (
    CompanyImpactQuery,
    CompanyImpactRead,
    CompanyMarketContextRead,
    IndexCloseRead,
    MarketCapPointRead,
    MarketImpactQuery,
    MarketImpactRead,
    MarketMoverRead,
    MarketOverviewQuery,
    MarketOverviewRead,
    MarketMoversQuery,
    SectorPerformanceRead,
    StockContributorRead,
)
from app.services.sectors_service import (
    get_company_report,
    get_idx_total,
    get_index_daily,
    get_index_daily_range,
    get_stock_daily,
    get_subsector_report,
    get_top_changes,
)


def _required(item: dict, key: str, index: int | None = None):
    if key not in item:
        suffix = f" at index {index}" if index is not None else ""
        raise SectorsInvalidResponseError(f"Sectors API response missing {key}{suffix}")
    return item[key]


def _change(first: Decimal, last: Decimal) -> Decimal | None:
    if first == 0:
        return None
    return (last - first) / first


async def get_market_overview(query: MarketOverviewQuery) -> MarketOverviewRead:
    start, end = query.resolved_dates()
    market_rows = await get_idx_total(start, end)
    normalized_market: list[MarketCapPointRead] = []
    for index, row in enumerate(market_rows):
        if not isinstance(row, dict):
            raise SectorsInvalidResponseError(f"Invalid IDX market row at index {index}")
        try:
            normalized_market.append(MarketCapPointRead(
                date=_required(row, "date", index),
                idx_total_market_cap=_required(row, "idx_total_market_cap", index),
            ))
        except (ValidationError, TypeError, ValueError) as exc:
            raise SectorsInvalidResponseError(f"Invalid IDX market row at index {index}") from exc

    normalized_market.sort(key=lambda row: row.date)
    if not normalized_market:
        raise SectorsInvalidResponseError("Sectors API returned no IDX market-cap data")
    first = normalized_market[0].idx_total_market_cap
    if first < 0:
        raise SectorsInvalidResponseError("Sectors API returned invalid IDX market-cap data")
    last = normalized_market[-1].idx_total_market_cap
    if last < 0:
        raise SectorsInvalidResponseError("Sectors API returned invalid IDX market-cap data")
    market_change = {
        "absolute": last - first,
        "percentage": _change(first, last),
    }
    # Sectors full-universe endpoint accepts only one trading-day query: date.
    # Keep overview range for IDX market-cap history, but request latest index closes
    # for range end and filter optional index_code locally.
    index_rows = await get_index_daily(date_value=end)
    if query.index_code:
        index_rows = [
            row
            for row in index_rows
            if isinstance(row, dict) and row.get("index_code") == query.index_code
        ]
        if not index_rows:
            raise SectorsInvalidResponseError(
                f"Sectors API returned no data for index {query.index_code}"
            )
    normalized_index: list[IndexCloseRead] = []
    for index, row in enumerate(index_rows):
        if not isinstance(row, dict):
            raise SectorsInvalidResponseError(f"Invalid index row at index {index}")
        try:
            normalized_index.append(IndexCloseRead(
                index_code=_required(row, "index_code", index),
                date=_required(row, "date", index),
                price=_required(row, "price", index),
            ))
        except (ValidationError, TypeError, ValueError) as exc:
            raise SectorsInvalidResponseError(f"Invalid index row at index {index}") from exc
    try:
        return MarketOverviewRead(
            start=start,
            end=end,
            market_cap_series=normalized_market,
            market_cap_change=market_change,
            index_series=normalized_index,
        )
    except (ValidationError, TypeError, ValueError) as exc:
        raise SectorsInvalidResponseError("Sectors API returned invalid market overview data") from exc


async def get_market_movers(query: MarketMoversQuery) -> list[MarketMoverRead]:
    payload = await get_top_changes(
        query.period,
        query.classification,
        query.limit,
        query.sub_sector,
        query.min_mcap_billion,
    )
    movers: list[MarketMoverRead] = []
    for classification in query.classification.split(","):
        period_rows = payload.get(classification)
        if not isinstance(period_rows, dict):
            raise SectorsInvalidResponseError(f"Sectors API response missing {classification}")
        rows = period_rows.get(query.period)
        if not isinstance(rows, list):
            raise SectorsInvalidResponseError(
                f"Sectors API response missing {classification} {query.period} movers"
            )
        for index, row in enumerate(rows):
            if not isinstance(row, dict):
                raise SectorsInvalidResponseError(f"Invalid mover at index {index}")
            try:
                movers.append(MarketMoverRead(
                    classification=classification,
                    period=query.period,
                    ticker=_required(row, "symbol", index),
                    company_name=_required(row, "name", index),
                    price_change=_required(row, "price_change", index),
                    last_close_price=_required(row, "last_close_price", index),
                    latest_close_date=_required(row, "latest_close_date", index),
                ))
            except (ValidationError, TypeError, ValueError) as exc:
                raise SectorsInvalidResponseError(f"Invalid mover at index {index}") from exc
    return movers


async def get_sector_performance(sector_code: str) -> SectorPerformanceRead:
    normalized_code = sector_code.strip().lower()
    if not normalized_code or not normalized_code.replace("-", "").isalnum():
        raise ValidationAppError({"sector_code": "sector_code must contain only letters, numbers, or hyphens"})
    report = await get_subsector_report(
        normalized_code,
        "statistics,market_cap,stability,growth,companies",
    )
    try:
        sector_name = report.get("sector", normalized_code)
        if not isinstance(sector_name, str) or not sector_name.strip():
            raise SectorsInvalidResponseError("Sectors API returned invalid sector name")
        return SectorPerformanceRead(
            sector_code=normalized_code,
            sector_name=sector_name,
            subsector=_required(report, "sub_sector", None),
            report=report,
        )
    except (ValidationError, TypeError, ValueError) as exc:
        raise SectorsInvalidResponseError("Sectors API returned invalid sector performance data") from exc


async def get_company_market_context(
    ticker: str,
    peer_limit: int = 5,
) -> CompanyMarketContextRead:
    normalized_ticker = ticker.strip().upper()
    if not normalized_ticker or not normalized_ticker.replace(".", "").isalnum():
        raise ValidationAppError({"ticker": "ticker must contain only letters, numbers, or a dot"})
    if peer_limit < 1 or peer_limit > 20:
        raise ValidationAppError({"peer_limit": "peer_limit must be between 1 and 20"})
    report = await get_company_report(normalized_ticker, "overview,valuation,peers")
    overview = report.get("overview")
    valuation = report.get("valuation")
    peers = report.get("peers")
    if not isinstance(overview, dict) or not isinstance(valuation, dict) or not isinstance(peers, list):
        raise SectorsInvalidResponseError("Sectors API returned incomplete company context")

    company_change = overview.get("daily_close_change")
    if company_change is not None:
        try:
            company_change = Decimal(str(company_change))
        except (TypeError, ValueError) as exc:
            raise SectorsInvalidResponseError("Sectors API returned invalid company change data") from exc
    end = date.today()
    start = end.replace(day=1)
    market_rows = await get_idx_total(start, end)
    market_change = None
    if len(market_rows) >= 2:
        first_row = market_rows[0]
        last_row = market_rows[-1]
        if not isinstance(first_row, dict) or not isinstance(last_row, dict):
            raise SectorsInvalidResponseError("Invalid IDX market-cap row")
        try:
            first = Decimal(str(_required(first_row, "idx_total_market_cap")))
            last = Decimal(str(_required(last_row, "idx_total_market_cap")))
        except (TypeError, ValueError) as exc:
            raise SectorsInvalidResponseError("Sectors API returned invalid market-cap data") from exc
        market_change = _change(first, last)
    sector_change = None
    sub_sector = overview.get("sub_sector")
    if isinstance(sub_sector, str) and sub_sector:
        sector_report = await get_subsector_report(sub_sector.lower(), "market_cap")
        mcap = sector_report.get("market_cap")
        if not isinstance(mcap, dict):
            raise SectorsInvalidResponseError("Sectors API returned invalid sector market-cap data")
        summary = mcap.get("mcap_summary")
        if not isinstance(summary, dict):
            raise SectorsInvalidResponseError("Sectors API returned incomplete sector market-cap data")
        changes = summary.get("mcap_change")
        if not isinstance(changes, dict):
            raise SectorsInvalidResponseError("Sectors API returned incomplete sector change data")
        sector_change = changes.get("1w")
        if sector_change is not None:
            try:
                sector_change = Decimal(str(sector_change))
            except (TypeError, ValueError) as exc:
                raise SectorsInvalidResponseError("Sectors API returned invalid sector change data") from exc

    normalized_peers: list[dict] = []
    for index, peer in enumerate(peers[:peer_limit]):
        if not isinstance(peer, dict):
            raise SectorsInvalidResponseError(f"Invalid peer at index {index}")
        normalized_peers.append(peer)
    try:
        return CompanyMarketContextRead(
            ticker=report.get("symbol", normalized_ticker),
            company_name=_required(report, "company_name"),
            overview=overview,
            valuation=valuation,
            market_comparison={"company_change": company_change, "market_change": market_change},
            sector_comparison={"company_change": company_change, "sector_change": sector_change},
            peers=normalized_peers,
        )
    except (ValidationError, TypeError, ValueError) as exc:
        raise SectorsInvalidResponseError("Sectors API returned invalid company context data") from exc


async def get_market_impact(query: MarketImpactQuery) -> MarketImpactRead:
    start, end = query.resolved_dates()
    index_task = get_index_daily_range(query.index_code, start, end)
    idx_total_task = get_idx_total(start, end)
    movers_task = get_top_changes("1d", "top_gainers,top_losers", query.limit)

    index_rows, idx_total_rows, top_changes = await asyncio.gather(
        index_task, idx_total_task, movers_task
    )

    if not isinstance(index_rows, list):
        raise SectorsInvalidResponseError("Sectors API returned an invalid index series")
    if not isinstance(idx_total_rows, list):
        raise SectorsInvalidResponseError("Sectors API returned an invalid IDX market-cap series")
    if not isinstance(top_changes, dict):
        raise SectorsInvalidResponseError("Sectors API returned invalid movers payload")

    # Process index series
    sorted_index_rows = sorted(index_rows, key=lambda r: r.get("date", ""))
    index_return: float | None = None
    if len(sorted_index_rows) >= 2:
        first_price = Decimal(str(_required(sorted_index_rows[0], "price", 0)))
        last_price = Decimal(str(_required(sorted_index_rows[-1], "price", len(sorted_index_rows) - 1)))
        chg = _change(first_price, last_price)
        index_return = float(chg) if chg is not None else None
    elif len(sorted_index_rows) == 1:
        index_return = 0.0

    # Process market-cap series
    sorted_mcap_rows = sorted(idx_total_rows, key=lambda r: r.get("date", ""))
    if not sorted_mcap_rows:
        raise SectorsInvalidResponseError("Sectors API returned no IDX market-cap data")

    market_return: float | None = None
    last_mcap = Decimal(str(_required(sorted_mcap_rows[-1], "idx_total_market_cap", len(sorted_mcap_rows) - 1)))
    if len(sorted_mcap_rows) >= 2:
        first_mcap = Decimal(str(_required(sorted_mcap_rows[0], "idx_total_market_cap", 0)))
        chg = _change(first_mcap, last_mcap)
        market_return = float(chg) if chg is not None else None
    elif len(sorted_mcap_rows) == 1:
        market_return = 0.0

    relative_performance: float | None = None
    if index_return is not None and market_return is not None:
        relative_performance = index_return - market_return

    # Process top contributors
    gainers = top_changes.get("top_gainers", {}).get("1d", []) if isinstance(top_changes.get("top_gainers"), dict) else []
    losers = top_changes.get("top_losers", {}).get("1d", []) if isinstance(top_changes.get("top_losers"), dict) else []

    seen_symbols: set[str] = set()
    candidate_movers: list[dict] = []
    for item in list(gainers) + list(losers):
        if isinstance(item, dict) and item.get("symbol"):
            sym = str(item["symbol"]).strip()
            if sym and sym not in seen_symbols:
                seen_symbols.add(sym)
                candidate_movers.append(item)

    report_tasks = [
        get_company_report(item["symbol"], "overview")
        for item in candidate_movers
    ]
    reports = await asyncio.gather(*report_tasks, return_exceptions=True)

    contributors: list[StockContributorRead] = []
    for mover, rep in zip(candidate_movers, reports):
        if isinstance(rep, Exception) or not isinstance(rep, dict):
            continue
        overview = rep.get("overview")
        if not isinstance(overview, dict):
            continue
        mcap_val = overview.get("market_cap")
        if mcap_val is None or mcap_val <= 0:
            continue
        try:
            stock_mcap = Decimal(str(mcap_val))
            price_change = Decimal(str(_required(mover, "price_change")))
            estimated_weight = (stock_mcap / last_mcap) if last_mcap > 0 else Decimal(0)
            estimated_contribution = estimated_weight * price_change
            contributors.append(
                StockContributorRead(
                    ticker=str(mover["symbol"]),
                    company_name=str(mover.get("name") or rep.get("company_name", mover["symbol"])),
                    price_change=float(price_change),
                    market_cap=float(stock_mcap),
                    estimated_weight=float(estimated_weight),
                    estimated_contribution=float(estimated_contribution),
                )
            )
        except (TypeError, ValueError, ValidationError):
            continue

    contributors.sort(key=lambda c: abs(c.estimated_contribution), reverse=True)
    top_contributors = contributors[:query.limit]

    try:
        return MarketImpactRead(
            start=start,
            end=end,
            index_code=query.index_code,
            index_return=index_return,
            market_return=market_return,
            relative_performance=relative_performance,
            weight_source="estimated_market_cap_share",
            top_contributors=top_contributors,
        )
    except (ValidationError, TypeError, ValueError) as exc:
        raise SectorsInvalidResponseError("Failed to construct market impact read") from exc


async def get_company_impact(ticker: str, query: CompanyImpactQuery) -> CompanyImpactRead:
    normalized_ticker = ticker.strip().upper()
    if not normalized_ticker or not normalized_ticker.replace(".", "").isalnum():
        raise ValidationAppError({"ticker": "ticker must contain only letters, numbers, or a dot"})

    start, end = query.resolved_dates()

    stock_task = get_stock_daily(normalized_ticker, start, end)
    index_task = get_index_daily_range(query.index_code, start, end)
    idx_total_task = get_idx_total(start, end)
    report_task = get_company_report(normalized_ticker, "overview,peers")

    stock_rows, index_rows, idx_total_rows, company_report = await asyncio.gather(
        stock_task, index_task, idx_total_task, report_task
    )

    if not isinstance(stock_rows, list) or not stock_rows:
        raise SectorsInvalidResponseError(f"Sectors API returned no daily data for {normalized_ticker}")
    if not isinstance(index_rows, list):
        raise SectorsInvalidResponseError(f"Sectors API returned an invalid index series for {query.index_code}")
    if not isinstance(idx_total_rows, list) or not idx_total_rows:
        raise SectorsInvalidResponseError("Sectors API returned no IDX market-cap data")
    if not isinstance(company_report, dict):
        raise SectorsInvalidResponseError("Sectors API returned invalid company report")

    overview = company_report.get("overview")
    if not isinstance(overview, dict):
        raise SectorsInvalidResponseError("Sectors API returned invalid company overview")

    # Stock return
    sorted_stock_rows = sorted(stock_rows, key=lambda r: r.get("date", ""))
    first_close = Decimal(str(_required(sorted_stock_rows[0], "close", 0)))
    last_close = Decimal(str(_required(sorted_stock_rows[-1], "close", len(sorted_stock_rows) - 1)))
    stock_return_dec = _change(first_close, last_close) if len(sorted_stock_rows) >= 2 else Decimal(0)
    stock_return = float(stock_return_dec) if stock_return_dec is not None else 0.0

    # Index return
    sorted_index_rows = sorted(index_rows, key=lambda r: r.get("date", ""))
    index_return: float | None = None
    if len(sorted_index_rows) >= 2:
        first_index = Decimal(str(_required(sorted_index_rows[0], "price", 0)))
        last_index = Decimal(str(_required(sorted_index_rows[-1], "price", len(sorted_index_rows) - 1)))
        chg = _change(first_index, last_index)
        index_return = float(chg) if chg is not None else None
    elif len(sorted_index_rows) == 1:
        index_return = 0.0

    # Market return
    sorted_mcap_rows = sorted(idx_total_rows, key=lambda r: r.get("date", ""))
    last_mcap = Decimal(str(_required(sorted_mcap_rows[-1], "idx_total_market_cap", len(sorted_mcap_rows) - 1)))
    market_return: float | None = None
    if len(sorted_mcap_rows) >= 2:
        first_mcap = Decimal(str(_required(sorted_mcap_rows[0], "idx_total_market_cap", 0)))
        chg = _change(first_mcap, last_mcap)
        market_return = float(chg) if chg is not None else None
    elif len(sorted_mcap_rows) == 1:
        market_return = 0.0

    # Sector return (from subsector report mcap_change)
    sub_sector = overview.get("sub_sector")
    sector_return: float | None = None
    if isinstance(sub_sector, str) and sub_sector.strip():
        sector_report = await get_subsector_report(sub_sector.strip().lower(), "market_cap")
        mcap = sector_report.get("market_cap")
        if isinstance(mcap, dict):
            summary = mcap.get("mcap_summary")
            if isinstance(summary, dict):
                changes = summary.get("mcap_change")
                if isinstance(changes, dict):
                    range_days = (end - start).days
                    if range_days > 180 and "1y" in changes:
                        raw_change = changes.get("1y")
                    elif range_days > 60 and "ytd" in changes:
                        raw_change = changes.get("ytd")
                    else:
                        raw_change = changes.get("1w")
                    if raw_change is not None:
                        try:
                            sector_return = float(Decimal(str(raw_change)))
                        except (TypeError, ValueError):
                            sector_return = None

    # Relative performance
    relative_to_index = (stock_return - index_return) if (stock_return is not None and index_return is not None) else None
    relative_to_sector = (stock_return - sector_return) if (stock_return is not None and sector_return is not None) else None

    # Estimated weight and contribution
    stock_mcap_val = sorted_stock_rows[-1].get("market_cap") or overview.get("market_cap")
    estimated_weight: float | None = None
    estimated_contribution: float | None = None
    if stock_mcap_val is not None and stock_mcap_val > 0 and last_mcap > 0:
        stock_mcap = Decimal(str(stock_mcap_val))
        est_w = stock_mcap / last_mcap
        estimated_weight = float(est_w)
        if stock_return is not None:
            estimated_contribution = float(est_w * Decimal(str(stock_return)))

    peers = company_report.get("peers")
    normalized_peers = [p for p in peers if isinstance(p, dict)] if isinstance(peers, list) else []

    try:
        return CompanyImpactRead(
            ticker=company_report.get("symbol", normalized_ticker),
            company_name=_required(company_report, "company_name"),
            sub_sector=sub_sector if isinstance(sub_sector, str) else None,
            start=start,
            end=end,
            index_code=query.index_code,
            stock_return=stock_return,
            index_return=index_return,
            market_return=market_return,
            sector_return=sector_return,
            relative_to_index=relative_to_index,
            relative_to_sector=relative_to_sector,
            estimated_weight=estimated_weight,
            estimated_contribution=estimated_contribution,
            weight_source="estimated_market_cap_share",
            peers=normalized_peers,
        )
    except (ValidationError, TypeError, ValueError) as exc:
        raise SectorsInvalidResponseError("Failed to construct company impact read") from exc