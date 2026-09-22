from datetime import date
from decimal import Decimal
from typing import Any

from pydantic import ValidationError

from app.helpers.exceptions import SectorsInvalidResponseError, ValidationAppError
from app.helpers.schemas import (
    CompanyImpactRead,
    CompanyMarketContextRead,
    ImpactContributorRead,
    ImpactStatusRead,
    IndexCloseRead,
    MarketCapPointRead,
    MarketImpactQuery,
    MarketImpactRead,
    MarketMoverRead,
    MarketMoversQuery,
    MarketOverviewQuery,
    MarketOverviewRead,
    SectorPerformanceRead,
)
from app.services.sectors_service import (
    get_close_snapshots,
    get_companies_by_sub_sector,
    get_company_report,
    get_daily,
    get_idx_total,
    get_index_daily,
    get_index_daily_history,
    get_subsector_report,
    get_top_changes,
)

CONTRIBUTION_METHOD = "Sectors V2 bounded aggregate data; no official weights"
UNAVAILABLE_WEIGHT_STATUS = "unavailable_no_weight_data"


def _required(item: dict[str, Any], key: str, index: int | None = None) -> Any:
    if key not in item:
        suffix = f" at index {index}" if index is not None else ""
        raise SectorsInvalidResponseError(f"Sectors API response missing {key}{suffix}")
    return item[key]


def _change(first: Decimal, last: Decimal) -> Decimal:
    if first <= 0:
        raise SectorsInvalidResponseError("Sectors API returned a zero or negative return base")
    return (last - first) / first


def _normalized_ticker(ticker: str) -> str:
    normalized = ticker.strip().upper()
    if not normalized or not normalized.replace(".", "").isalnum():
        raise ValidationAppError({"ticker": "ticker must contain only letters, numbers, or a dot"})
    return normalized


def _date_value(value: Any, label: str, index: int) -> date:
    try:
        return date.fromisoformat(str(value))
    except (TypeError, ValueError) as exc:
        raise SectorsInvalidResponseError(
            f"Sectors API returned invalid {label} at index {index}"
        ) from exc


def _decimal_value(
    value: Any,
    label: str,
    index: int,
    *,
    positive: bool = False,
) -> Decimal:
    try:
        parsed = Decimal(str(value))
    except (TypeError, ValueError) as exc:
        raise SectorsInvalidResponseError(
            f"Sectors API returned invalid {label} at index {index}"
        ) from exc
    if not parsed.is_finite() or (positive and parsed <= 0):
        raise SectorsInvalidResponseError(
            f"Sectors API returned invalid {label} at index {index}"
        )
    return parsed


def _return_from_rows(
    rows: list[dict[str, Any]],
    value_key: str,
    label: str,
) -> tuple[Decimal, date, date]:
    points: list[tuple[date, Decimal]] = []
    for index, row in enumerate(rows):
        if not isinstance(row, dict):
            raise SectorsInvalidResponseError(f"Invalid {label} row at index {index}")
        points.append(
            (
                _date_value(_required(row, "date", index), "date", index),
                _decimal_value(
                    _required(row, value_key, index), label, index, positive=True
                ),
            )
        )
    points.sort(key=lambda item: item[0])
    if len(points) < 2:
        raise SectorsInvalidResponseError(f"Sectors API returned insufficient {label} data")
    first_date, first_value = points[0]
    last_date, last_value = points[-1]
    return _change(first_value, last_value), first_date, last_date


def _row_symbol(row: dict[str, Any], index: int) -> str:
    value = row.get("symbol") or row.get("ticker")
    if not isinstance(value, str) or not value.strip():
        raise SectorsInvalidResponseError(
            f"Sectors API response missing symbol at index {index}"
        )
    return value.strip().upper().removesuffix(".JK")


def _row_name(row: dict[str, Any]) -> str | None:
    value = row.get("company_name") or row.get("name")
    return value.strip() if isinstance(value, str) and value.strip() else None


def _company_return(rows: list[dict[str, Any]]) -> Decimal:
    points: list[tuple[date, Decimal]] = []
    for index, row in enumerate(rows):
        if not isinstance(row, dict):
            raise SectorsInvalidResponseError(f"Invalid company daily row at index {index}")
        points.append(
            (
                _date_value(_required(row, "date", index), "date", index),
                _decimal_value(
                    _required(row, "close", index), "close", index, positive=True
                ),
            )
        )
    points.sort(key=lambda item: item[0])
    if len(points) < 2:
        raise SectorsInvalidResponseError("Sectors API returned insufficient company daily data")
    return _change(points[0][1], points[-1][1])


def _relative(value: Decimal, benchmark: Decimal) -> Decimal:
    return value - benchmark


def _sort_contributors(
    contributors: list[ImpactContributorRead], limit: int
) -> list[ImpactContributorRead]:
    def sort_key(item: ImpactContributorRead) -> tuple[int, Decimal, str]:
        contribution = item.estimated_market_contribution
        if contribution is None:
            return (1, Decimal("0"), item.ticker)
        return (0, -abs(Decimal(str(contribution))), item.ticker)

    return sorted(contributors, key=sort_key)[:limit]


def _impact_status() -> ImpactStatusRead:
    return ImpactStatusRead(
        market_contribution=UNAVAILABLE_WEIGHT_STATUS,
        sector_contribution=UNAVAILABLE_WEIGHT_STATUS,
        method=CONTRIBUTION_METHOD,
    )


def _change_value(value: Any, label: str) -> float | None:
    if value is None:
        return None
    try:
        parsed = Decimal(str(value))
    except (TypeError, ValueError) as exc:
        raise SectorsInvalidResponseError(f"Sectors API returned invalid {label}") from exc
    if not parsed.is_finite():
        raise SectorsInvalidResponseError(f"Sectors API returned invalid {label}")
    return float(parsed)


def _contributors_from_movers(payload: dict[str, Any]) -> list[ImpactContributorRead]:
    contributors: list[ImpactContributorRead] = []
    for classification in ("top_gainers", "top_losers"):
        period_rows = payload.get(classification)
        if not isinstance(period_rows, dict):
            continue
        rows = period_rows.get("1d")
        if not isinstance(rows, list):
            continue
        for index, row in enumerate(rows):
            if not isinstance(row, dict):
                raise SectorsInvalidResponseError(f"Invalid mover at index {index}")
            contributors.append(
                ImpactContributorRead(
                    ticker=_row_symbol(row, index),
                    company_name=_row_name(row),
                    stock_return=_change_value(row.get("price_change"), "price change"),
                    contribution_status=UNAVAILABLE_WEIGHT_STATUS,
                )
            )
    return contributors


def _subsector_report_data(
    report: dict[str, Any],
) -> tuple[Decimal | None, list[ImpactContributorRead]]:
    market_cap = report.get("market_cap")
    summary = market_cap.get("mcap_summary") if isinstance(market_cap, dict) else None
    changes = summary.get("mcap_change") if isinstance(summary, dict) else None
    sector_return: Decimal | None = None
    if isinstance(changes, dict) and changes.get("1w") is not None:
        sector_return = _decimal_value(changes["1w"], "sector return", 0)

    contributors: list[ImpactContributorRead] = []
    companies = report.get("companies")
    top_changes = companies.get("top_change_companies") if isinstance(companies, dict) else None
    if isinstance(top_changes, dict):
        for ticker, row in top_changes.items():
            if not isinstance(row, dict):
                continue
            change = row.get("1mth")
            if change is None:
                change = row.get("1yr")
            contributors.append(
                ImpactContributorRead(
                    ticker=str(ticker).upper().removesuffix(".JK"),
                    company_name=_row_name(row),
                    stock_return=_change_value(change, "company change"),
                    contribution_status=UNAVAILABLE_WEIGHT_STATUS,
                )
            )
    return sector_return, contributors


async def get_market_overview(query: MarketOverviewQuery) -> MarketOverviewRead:
    start, end = query.resolved_dates()
    market_rows = await get_idx_total(start, end)
    normalized_market: list[MarketCapPointRead] = []
    for index, row in enumerate(market_rows):
        if not isinstance(row, dict):
            raise SectorsInvalidResponseError(f"Invalid IDX market row at index {index}")
        try:
            normalized_market.append(
                MarketCapPointRead(
                    date=_required(row, "date", index),
                    idx_total_market_cap=_required(row, "idx_total_market_cap", index),
                )
            )
        except (ValidationError, TypeError, ValueError) as exc:
            raise SectorsInvalidResponseError(
                f"Invalid IDX market row at index {index}"
            ) from exc
    normalized_market.sort(key=lambda row: row.date)
    if not normalized_market:
        raise SectorsInvalidResponseError("Sectors API returned no IDX market-cap data")
    first = normalized_market[0].idx_total_market_cap
    last = normalized_market[-1].idx_total_market_cap
    market_change = {"absolute": last - first, "percentage": _change(first, last)}

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
            normalized_index.append(
                IndexCloseRead(
                    index_code=_required(row, "index_code", index),
                    date=_required(row, "date", index),
                    price=_required(row, "price", index),
                )
            )
        except (ValidationError, TypeError, ValueError) as exc:
            raise SectorsInvalidResponseError(f"Invalid index row at index {index}") from exc
    return MarketOverviewRead(
        start=start,
        end=end,
        market_cap_series=normalized_market,
        market_cap_change=market_change,
        index_series=normalized_index,
    )


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
                movers.append(
                    MarketMoverRead(
                        classification=classification,
                        period=query.period,
                        ticker=_required(row, "symbol", index),
                        company_name=_required(row, "name", index),
                        price_change=_required(row, "price_change", index),
                        last_close_price=_required(row, "last_close_price", index),
                        latest_close_date=_required(row, "latest_close_date", index),
                    )
                )
            except (ValidationError, TypeError, ValueError) as exc:
                raise SectorsInvalidResponseError(
                    f"Invalid mover at index {index}"
                ) from exc
    return movers


async def get_sector_performance(sector_code: str) -> SectorPerformanceRead:
    normalized_code = sector_code.strip().lower()
    if not normalized_code or not normalized_code.replace("-", "").isalnum():
        raise ValidationAppError(
            {"sector_code": "sector_code must contain only letters, numbers, or hyphens"}
        )
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
        raise SectorsInvalidResponseError(
            "Sectors API returned invalid sector performance data"
        ) from exc


async def get_company_market_context(
    ticker: str,
    peer_limit: int = 5,
) -> CompanyMarketContextRead:
    normalized_ticker = _normalized_ticker(ticker)
    if peer_limit < 1 or peer_limit > 20:
        raise ValidationAppError({"peer_limit": "peer_limit must be between 1 and 20"})
    report = await get_company_report(normalized_ticker, "overview,valuation,peers")
    overview = report.get("overview")
    valuation = report.get("valuation")
    peers = report.get("peers")
    if not isinstance(overview, dict) or not isinstance(valuation, dict) or not isinstance(peers, list):
        raise SectorsInvalidResponseError("Sectors API returned incomplete company context")

    company_change = _change_value(overview.get("daily_close_change"), "company change")
    end = date.today()
    start = end.replace(day=1)
    market_rows = await get_idx_total(start, end)
    market_change = None
    if len(market_rows) >= 2:
        if not isinstance(market_rows[0], dict) or not isinstance(market_rows[-1], dict):
            raise SectorsInvalidResponseError("Invalid IDX market-cap row")
        first = _decimal_value(_required(market_rows[0], "idx_total_market_cap"), "market cap", 0)
        last = _decimal_value(_required(market_rows[-1], "idx_total_market_cap"), "market cap", len(market_rows) - 1)
        market_change = _change(first, last)

    sector_change = None
    sub_sector = overview.get("sub_sector")
    if isinstance(sub_sector, str) and sub_sector:
        sector_report = await get_subsector_report(sub_sector.lower(), "market_cap")
        market_cap = sector_report.get("market_cap")
        summary = market_cap.get("mcap_summary") if isinstance(market_cap, dict) else None
        changes = summary.get("mcap_change") if isinstance(summary, dict) else None
        if isinstance(changes, dict):
            sector_change = _change_value(changes.get("1w"), "sector change")

    normalized_peers: list[dict[str, Any]] = []
    for index, peer in enumerate(peers[:peer_limit]):
        if not isinstance(peer, dict):
            raise SectorsInvalidResponseError(f"Invalid peer at index {index}")
        normalized_peers.append(peer)
    return CompanyMarketContextRead(
        ticker=report.get("symbol", normalized_ticker),
        company_name=_required(report, "company_name"),
        overview=overview,
        valuation=valuation,
        market_comparison={"company_change": company_change, "market_change": market_change},
        sector_comparison={"company_change": company_change, "sector_change": sector_change},
        peers=normalized_peers,
    )


async def _index_return(index_code: str, start: date, end: date) -> Decimal:
    rows = await get_index_daily_history(index_code, start, end)
    result, _, _ = _return_from_rows(rows, "price", "index")
    return result


async def _market_contributors() -> list[ImpactContributorRead]:
    payload = await get_top_changes("1d", "top_gainers,top_losers", 10)
    return _contributors_from_movers(payload)


async def _sector_impact(sub_sector: str) -> tuple[Decimal | None, list[ImpactContributorRead]]:
    report = await get_subsector_report(sub_sector, "market_cap,companies")
    return _subsector_report_data(report)


async def get_market_impact(query: MarketImpactQuery) -> MarketImpactRead:
    start, end = query.resolved_dates()
    index_return = await _index_return(query.index_code, start, end)
    if query.sub_sector:
        sector_return, contributors = await _sector_impact(query.sub_sector)
    else:
        sector_return = index_return
        contributors = await _market_contributors()

    return MarketImpactRead(
        start=start,
        end=end,
        index_code=query.index_code,
        index_return=float(index_return),
        sector_code=query.sub_sector,
        sector_return=float(sector_return) if sector_return is not None else None,
        relative_performance=(
            float(_relative(sector_return, index_return))
            if sector_return is not None
            else None
        ),
        contribution_method=CONTRIBUTION_METHOD,
        contribution_status=_impact_status(),
        major_contributors=_sort_contributors(contributors, query.contributor_limit),
    )


async def get_company_impact(
    ticker: str,
    query: MarketImpactQuery,
) -> CompanyImpactRead:
    normalized_ticker = _normalized_ticker(ticker)
    start, end = query.resolved_dates()
    report = await get_company_report(normalized_ticker, "overview")
    overview = report.get("overview")
    if not isinstance(overview, dict):
        raise SectorsInvalidResponseError("Sectors API returned incomplete company overview")
    sub_sector = overview.get("sub_sector")
    if not isinstance(sub_sector, str) or not sub_sector.strip():
        raise SectorsInvalidResponseError("Sectors API returned no company subsector")

    stock_return = _company_return(await get_daily(normalized_ticker, start, end))
    index_return = await _index_return(query.index_code, start, end)
    # Company impact already has requested ticker history. Sector report supplies
    # sector return and bounded contributors; avoid loading every sector close page.
    sector_return, contributors = await _sector_impact(sub_sector.lower())
    if sector_return is None:
        raise SectorsInvalidResponseError("Sectors API returned no sector return data")

    return CompanyImpactRead(
        start=start,
        end=end,
        ticker=normalized_ticker,
        company_name=_required(report, "company_name"),
        sub_sector=sub_sector,
        stock_return=float(stock_return),
        index_code=query.index_code,
        index_return=float(index_return),
        sector_return=float(sector_return),
        relative_to_market=float(_relative(stock_return, index_return)),
        relative_to_sector=float(_relative(stock_return, sector_return)),
        estimated_market_contribution=None,
        estimated_sector_contribution=None,
        contribution_status=_impact_status(),
        contribution_method=CONTRIBUTION_METHOD,
        major_contributors=_sort_contributors(contributors, query.contributor_limit),
    )
