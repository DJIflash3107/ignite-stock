import asyncio
import time
from collections.abc import Awaitable, Callable
from datetime import date
from typing import Any, TypeVar

from app.configs.settings import get_settings
from app.helpers.exceptions import SectorsInvalidResponseError
from app.helpers.schemas import SectorsSubsectorRead
from app.services.sectors_api_client import (
    fetch_close_page,
    fetch_company_filings,
    fetch_company_financials,
    fetch_company_news,
    fetch_company_report,
    fetch_companies_page,
    fetch_daily,
    fetch_idx_total,
    fetch_index_daily,
    fetch_index_daily_history,
    fetch_subsector_report,
    fetch_subsectors,
    fetch_top_changes,
    index_membership_filter,
)

T = TypeVar("T")
_cache: dict[str, tuple[float, Any]] = {}
_cache_lock = asyncio.Lock()


async def _cached(key: str, fetcher: Callable[[], Awaitable[T]]) -> T:
    settings = get_settings()
    cached = _cache.get(key)
    if cached and time.monotonic() - cached[0] < settings.sectors_api_cache_ttl_seconds:
        return cached[1]
    async with _cache_lock:
        cached = _cache.get(key)
        if cached and time.monotonic() - cached[0] < settings.sectors_api_cache_ttl_seconds:
            return cached[1]
        value = await fetcher()
        if settings.sectors_api_cache_ttl_seconds > 0:
            _cache[key] = (time.monotonic(), value)
        return value


def _cache_key(name: str, **params: Any) -> str:
    return "|".join([name, *(f"{key}={params[key]}" for key in sorted(params))])


def _normalize_subsectors(payload: list[dict[str, Any]]) -> list[SectorsSubsectorRead]:
    normalized: list[SectorsSubsectorRead] = []
    for index, item in enumerate(payload):
        if not isinstance(item, dict):
            raise SectorsInvalidResponseError(
                f"Sectors API returned invalid subsector item at index {index}"
            )
        try:
            normalized.append(SectorsSubsectorRead.model_validate(item))
        except ValueError as exc:
            raise SectorsInvalidResponseError(
                f"Sectors API returned invalid subsector item at index {index}"
            ) from exc
    return normalized


async def async_normalize_subsectors() -> list[SectorsSubsectorRead]:
    return _normalize_subsectors(await fetch_subsectors())


async def list_subsectors() -> list[SectorsSubsectorRead]:
    return await _cached("subsectors", async_normalize_subsectors)


async def _get_close_page(date_value: date, offset: int, limit: int) -> dict[str, Any]:
    return await fetch_close_page(date_value, offset=offset, limit=limit)


async def get_close_universe(
    date_value: date,
    required_symbols: set[str] | None = None,
) -> list[dict[str, Any]]:
    settings = get_settings()
    limit = settings.sectors_close_page_limit
    required = {
        symbol.strip().upper().removesuffix(".JK")
        for symbol in (required_symbols or set())
    }
    pages: list[dict[str, Any]] = []
    seen: set[str] = set()
    offset = 0
    total_count: int | None = None
    page_count = 0
    has_next = True

    while has_next:
        if page_count >= settings.sectors_close_max_pages:
            if required and not required.issubset(seen):
                raise SectorsInvalidResponseError(
                    "Sectors API close pagination limit reached before required symbols were found"
                )
            break
        page = await _cached(
            _cache_key("close", date=date_value.isoformat(), offset=offset, limit=limit),
            lambda offset=offset: _get_close_page(date_value, offset, limit),
        )
        page_count += 1
        rows = page.get("results")
        pagination = page.get("pagination")
        if not isinstance(rows, list) or not isinstance(pagination, dict):
            raise SectorsInvalidResponseError(
                "Sectors API returned an invalid full-universe close page"
            )
        if any(not isinstance(row, dict) for row in rows):
            raise SectorsInvalidResponseError(
                "Sectors API returned an invalid full-universe close row"
            )

        page_total = pagination.get("total_count")
        has_next = pagination.get("has_next")
        next_offset = pagination.get("next_offset")
        if (
            not isinstance(page_total, int)
            or page_total < len(rows)
            or not isinstance(has_next, bool)
        ):
            raise SectorsInvalidResponseError(
                "Sectors API returned invalid full-universe close pagination"
            )
        if total_count is None:
            total_count = page_total
        elif total_count != page_total:
            raise SectorsInvalidResponseError(
                "Sectors API returned inconsistent full-universe close totals"
            )

        for row in rows:
            symbol = row.get("symbol")
            if not isinstance(symbol, str) or not symbol.strip():
                raise SectorsInvalidResponseError(
                    "Sectors API returned a close row without symbol"
                )
            normalized = symbol.strip().upper().removesuffix(".JK")
            if normalized in seen:
                raise SectorsInvalidResponseError(
                    f"Sectors API returned duplicate close symbol {normalized}"
                )
            seen.add(normalized)
            pages.append(row)

        if required and required.issubset(seen):
            break
        if not has_next:
            break
        if (
            not isinstance(next_offset, int)
            or next_offset <= offset
            or next_offset >= page_total
        ):
            raise SectorsInvalidResponseError(
                "Sectors API returned invalid full-universe close pagination"
            )
        offset = next_offset

    if required and not required.issubset(seen):
        raise SectorsInvalidResponseError(
            "Sectors API returned incomplete full-universe close data for required symbols"
        )
    if not required and total_count is not None and len(pages) != total_count:
        raise SectorsInvalidResponseError(
            "Sectors API returned incomplete full-universe close data"
        )
    return pages


async def get_close_snapshots(
    start: date,
    end: date,
    required_symbols: set[str],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    start_rows = await get_close_universe(start, required_symbols)
    end_rows = await get_close_universe(end, required_symbols)
    return start_rows, end_rows


async def get_daily(symbol: str, start: date, end: date) -> list[dict[str, Any]]:
    normalized = symbol.strip().upper()
    if not normalized or not normalized.replace(".", "").isalnum():
        raise SectorsInvalidResponseError("Sectors API requires a valid ticker")
    return await _cached(
        _cache_key("daily", symbol=normalized, start=start.isoformat(), end=end.isoformat()),
        lambda: fetch_daily(normalized, start, end),
    )


async def get_idx_total(start: date, end: date) -> list[dict[str, Any]]:
    return await _cached(
        _cache_key("idx-total", start=start.isoformat(), end=end.isoformat()),
        lambda: fetch_idx_total(start, end),
    )


async def get_index_daily(date_value: date | None = None) -> list[dict[str, Any]]:
    return await _cached(
        _cache_key("index-daily", date=date_value.isoformat() if date_value else ""),
        lambda: fetch_index_daily(date_value),
    )


async def get_index_daily_history(
    index_code: str,
    start: date,
    end: date,
) -> list[dict[str, Any]]:
    normalized = index_code.strip().lower()
    if not normalized or not normalized.replace("-", "").isalnum():
        raise SectorsInvalidResponseError("Sectors API requires a valid index code")
    return await _cached(
        _cache_key(
            "index-daily-history",
            index_code=normalized,
            start=start.isoformat(),
            end=end.isoformat(),
        ),
        lambda: fetch_index_daily_history(normalized, start, end),
    )


async def get_top_changes(
    periods: str,
    classifications: str,
    n_stock: int,
    sub_sector: str | None = None,
    min_mcap_billion: int | None = None,
) -> dict[str, Any]:
    return await _cached(
        _cache_key(
            "top-changes",
            periods=periods,
            classifications=classifications,
            n_stock=n_stock,
            sub_sector=sub_sector or "",
            min_mcap_billion=min_mcap_billion if min_mcap_billion is not None else "",
        ),
        lambda: fetch_top_changes(
            periods, classifications, n_stock, sub_sector, min_mcap_billion
        ),
    )


async def get_subsector_report(sub_sector: str, sections: str) -> dict[str, Any]:
    normalized = sub_sector.strip().lower()
    if not normalized:
        raise SectorsInvalidResponseError("Sectors API requires a non-empty subsector")
    return await _cached(
        _cache_key("subsector-report", sub_sector=normalized, sections=sections),
        lambda: fetch_subsector_report(normalized, sections),
    )


async def get_company_report(symbol: str, sections: str) -> dict[str, Any]:
    normalized = symbol.strip().upper()
    if not normalized:
        raise SectorsInvalidResponseError("Sectors API requires a non-empty ticker")
    return await _cached(
        _cache_key("company-report", symbol=normalized, sections=sections),
        lambda: fetch_company_report(normalized, sections),
    )


def _validate_company_rows(payload: dict[str, Any]) -> list[dict[str, Any]]:
    results = payload.get("results")
    if not isinstance(results, list):
        raise SectorsInvalidResponseError("Sectors API returned invalid companies data")
    if any(not isinstance(row, dict) for row in results):
        raise SectorsInvalidResponseError("Sectors API returned invalid company item")
    pagination = payload.get("pagination")
    if isinstance(pagination, dict) and pagination.get("has_next"):
        raise SectorsInvalidResponseError(
            "Sectors API returned more companies than bounded impact analysis supports"
        )
    return results


async def get_companies_by_where(where: str, *, limit: int = 200) -> list[dict[str, Any]]:
    if not where.strip() or any(char in where for char in "\r\n"):
        raise SectorsInvalidResponseError("Sectors API requires a valid company filter")
    if not isinstance(limit, int) or not 1 <= limit <= 200:
        raise ValueError("limit must be between 1 and 200")
    payload = await _cached(
        _cache_key("companies-where", where=where, limit=limit),
        lambda: fetch_companies_page(limit=limit, where=where),
    )
    return _validate_company_rows(payload)


async def get_companies(index_codes: tuple[str, ...], *, limit: int = 200) -> list[dict[str, Any]]:
    normalized = tuple(dict.fromkeys(code.strip().upper() for code in index_codes if code.strip()))
    if not normalized:
        raise SectorsInvalidResponseError("At least one index code is required")
    return await get_companies_by_where(index_membership_filter(normalized), limit=limit)


async def get_companies_by_sub_sector(sub_sector: str, *, limit: int = 200) -> list[dict[str, Any]]:
    normalized = sub_sector.strip()
    if not normalized or any(char in normalized for char in "'\"\\\r\n"):
        raise SectorsInvalidResponseError("Sectors API requires a valid subsector")
    return await get_companies_by_where(f"sub_sector = '{normalized}'", limit=limit)


async def get_company_news(symbol: str, *, limit: int = 20) -> Any:
    normalized = symbol.strip().upper()
    if not normalized or not normalized.replace(".", "").isalnum():
        raise SectorsInvalidResponseError("Sectors API requires a valid ticker")
    return await _cached(
        _cache_key("company-news", symbol=normalized, limit=limit),
        lambda: fetch_company_news(normalized, limit=limit),
    )


async def get_company_filings(symbol: str, *, limit: int = 20) -> Any:
    normalized = symbol.strip().upper()
    if not normalized or not normalized.replace(".", "").isalnum():
        raise SectorsInvalidResponseError("Sectors API requires a valid ticker")
    return await _cached(
        _cache_key("company-filings", symbol=normalized, limit=limit),
        lambda: fetch_company_filings(normalized, limit=limit),
    )


async def get_company_financials(symbol: str, *, sections: str = "") -> Any:
    normalized = symbol.strip().upper()
    if not normalized or not normalized.replace(".", "").isalnum():
        raise SectorsInvalidResponseError("Sectors API requires a valid ticker")
    return await _cached(
        _cache_key("company-financials", symbol=normalized, sections=sections),
        lambda: fetch_company_financials(normalized, sections=sections),
    )


def clear_subsectors_cache() -> None:
    _cache.clear()


def clear_cache() -> None:
    _cache.clear()
