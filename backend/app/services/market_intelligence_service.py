from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import ValidationError

from app.helpers.exceptions import SectorsInvalidResponseError, ValidationAppError
from app.helpers.schemas import (
    CompanyMarketContextRead,
    IndexCloseRead,
    MarketCapPointRead,
    MarketMoverRead,
    MarketOverviewQuery,
    MarketOverviewRead,
    MarketMoversQuery,
    SectorPerformanceRead,
)
from app.services.sector_service import get_sector_by_id
from app.services.sectors_service import (
    get_company_report,
    get_idx_total,
    get_index_daily,
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


async def get_sector_performance(db, sector_id: UUID) -> SectorPerformanceRead:
    sector = await get_sector_by_id(db, sector_id)
    report = await get_subsector_report(
        sector.code,
        "statistics,market_cap,stability,growth,companies",
    )
    try:
        return SectorPerformanceRead(
            sector_id=sector.id,
            sector_code=sector.code,
            sector_name=sector.name,
            subsector=_required(report, "sub_sector"),
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