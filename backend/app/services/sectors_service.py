import asyncio
import time
from collections.abc import Awaitable, Callable
from datetime import date
from typing import Any, TypeVar

from app.configs.settings import get_settings
from app.helpers.exceptions import SectorsInvalidResponseError
from app.helpers.schemas import SectorsSubsectorRead
from app.services.sectors_api_client import (
    fetch_company_filings,
    fetch_company_financials,
    fetch_company_news,
    fetch_company_report,
    fetch_companies_page,
    fetch_corporate_actions,
    fetch_idx_total,
    fetch_index_daily,
    fetch_index_daily_range,
    fetch_stock_daily,
    fetch_subsector_report,
    fetch_subsectors,
    fetch_top_changes,
    index_membership_filter,
)

T = TypeVar("T")
_cache: dict[str, tuple[float, Any]] = {}
_cache_locks: dict[asyncio.AbstractEventLoop, asyncio.Lock] = {}


def _get_cache_lock() -> asyncio.Lock:
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.Lock()
    if loop not in _cache_locks:
        _cache_locks[loop] = asyncio.Lock()
    return _cache_locks[loop]


async def _cached(key: str, fetcher: Callable[[], Awaitable[T]]) -> T:
    settings = get_settings()
    cached = _cache.get(key)
    if cached and time.monotonic() - cached[0] < settings.sectors_api_cache_ttl_seconds:
        return cached[1]
    async with _get_cache_lock():
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


async def get_stock_daily(symbol: str, start: date, end: date) -> list[dict[str, Any]]:
    normalized = symbol.strip().upper()
    if not normalized or not normalized.replace(".", "").isalnum():
        raise SectorsInvalidResponseError("Sectors API requires a valid ticker")
    if start > end:
        raise SectorsInvalidResponseError("start date must be before or equal to end date")
    return await _cached(
        _cache_key("stock-daily", symbol=normalized, start=start.isoformat(), end=end.isoformat()),
        lambda: fetch_stock_daily(normalized, start, end),
    )


async def get_index_daily_range(index_code: str, start: date, end: date) -> list[dict[str, Any]]:
    normalized = index_code.strip().lower()
    if not normalized:
        raise SectorsInvalidResponseError("Sectors API requires a valid index code")
    if start > end:
        raise SectorsInvalidResponseError("start date must be before or equal to end date")
    return await _cached(
        _cache_key("index-daily-range", index_code=normalized, start=start.isoformat(), end=end.isoformat()),
        lambda: fetch_index_daily_range(normalized, start, end),
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


async def get_companies(index_codes: tuple[str, ...], *, limit: int = 200) -> list[dict[str, Any]]:
    normalized = tuple(dict.fromkeys(code.strip().upper() for code in index_codes if code.strip()))
    if not normalized:
        raise SectorsInvalidResponseError("At least one index code is required")
    payload = await _cached(
        _cache_key("companies", indices=normalized, limit=limit),
        lambda: fetch_companies_page(
            limit=limit,
            where=index_membership_filter(normalized),
        ),
    )
    results = payload.get("results")
    if not isinstance(results, list):
        raise SectorsInvalidResponseError("Sectors API returned invalid companies data")
    if any(not isinstance(row, dict) for row in results):
        raise SectorsInvalidResponseError("Sectors API returned invalid company item")
    return results


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


async def get_corporate_actions(symbol: str, *, exact_tx_date: str | None = None) -> Any:
    normalized = symbol.strip().upper()
    if not normalized or not normalized.replace(".", "").isalnum():
        raise SectorsInvalidResponseError("Sectors API requires a valid ticker")
    return await _cached(
        _cache_key("company-corporate-actions", symbol=normalized, exact_tx_date=exact_tx_date or ""),
        lambda: fetch_corporate_actions(normalized, exact_tx_date=exact_tx_date),
    )


def clear_subsectors_cache() -> None:
    _cache.clear()


def clear_cache() -> None:
    _cache.clear()
