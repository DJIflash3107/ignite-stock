from datetime import date
from typing import Any

import httpx

from app.configs.settings import get_settings
from app.helpers.exceptions import (
    SectorsConfigurationError,
    SectorsConnectionError,
    SectorsInvalidResponseError,
    SectorsRateLimitError,
    SectorsTimeoutError,
    SectorsUpstreamError,
)

SUBSECTORS_PATH = "/v2/subsectors/"
IDX_TOTAL_PATH = "/v2/idx-total/"
INDEX_DAILY_PATH = "/v2/index-daily/"
TOP_CHANGES_PATH = "/v2/companies/top-changes/"
SUBSECTOR_REPORT_PATH = "/v2/subsector/report/{sub_sector}/"
COMPANY_REPORT_PATH = "/v2/company/report/{symbol}/"


def _upstream_error(response: httpx.Response) -> str | None:
    try:
        payload = response.json()
    except ValueError:
        return None
    if not isinstance(payload, dict):
        return None
    error = payload.get("message") or payload.get("error")
    return error if isinstance(error, str) else None


async def _request_json(
    path: str,
    params: dict[str, str | int] | None = None,
) -> Any:
    settings = get_settings()
    api_key = settings.sectors_api_key.strip() if settings.sectors_api_key else ""
    if not api_key:
        raise SectorsConfigurationError()

    url = f"{settings.sectors_api_base_url.rstrip('/')}/{path.lstrip('/')}"
    try:
        async with httpx.AsyncClient(timeout=settings.sectors_api_timeout_seconds) as client:
            response = await client.get(url, headers={"Authorization": api_key}, params=params)
    except httpx.TimeoutException as exc:
        raise SectorsTimeoutError() from exc
    except httpx.RequestError as exc:
        raise SectorsConnectionError() from exc

    if response.status_code == 429:
        raise SectorsRateLimitError()
    if response.status_code < 200 or response.status_code >= 300:
        status = response.status_code
        if status in (401, 403):
            message = "Sectors API authentication failed"
        elif status == 400:
            message = "Sectors API rejected the request"
        elif status == 404:
            message = "Sectors API resource not found"
        elif status >= 500:
            message = "Sectors API service failed"
        else:
            message = "Sectors API request failed"
        raise SectorsUpstreamError(message, status, _upstream_error(response))

    try:
        return response.json()
    except ValueError as exc:
        raise SectorsInvalidResponseError("Sectors API returned invalid JSON") from exc


async def fetch_subsectors() -> list[dict[str, Any]]:
    payload = await _request_json(SUBSECTORS_PATH)
    if not isinstance(payload, list):
        raise SectorsInvalidResponseError("Sectors API returned an invalid subsectors list")
    return payload


async def fetch_idx_total(start: date, end: date) -> list[dict[str, Any]]:
    payload = await _request_json(
        IDX_TOTAL_PATH,
        {"start": start.isoformat(), "end": end.isoformat()},
    )
    if not isinstance(payload, list):
        raise SectorsInvalidResponseError("Sectors API returned an invalid IDX market-cap series")
    return payload


async def fetch_index_daily(
    date_value: date | None = None,
) -> list[dict[str, Any]]:
    # Full-universe endpoint supports only `date`; it defaults to latest trading day.
    params = {"date": date_value.isoformat()} if date_value else None
    payload = await _request_json(INDEX_DAILY_PATH, params)
    if not isinstance(payload, list):
        raise SectorsInvalidResponseError("Sectors API returned an invalid index series")
    return payload


async def fetch_top_changes(
    periods: str,
    classifications: str,
    n_stock: int,
    sub_sector: str | None = None,
    min_mcap_billion: int | None = None,
) -> dict[str, Any]:
    params: dict[str, str | int] = {
        "periods": periods,
        "classifications": classifications,
        "n_stock": n_stock,
    }
    if sub_sector:
        params["sub_sector"] = sub_sector
    if min_mcap_billion is not None:
        params["min_mcap_billion"] = min_mcap_billion
    payload = await _request_json(TOP_CHANGES_PATH, params)
    if not isinstance(payload, dict):
        raise SectorsInvalidResponseError("Sectors API returned an invalid movers payload")
    return payload


async def fetch_subsector_report(sub_sector: str, sections: str) -> dict[str, Any]:
    payload = await _request_json(
        SUBSECTOR_REPORT_PATH.format(sub_sector=sub_sector),
        {"sections": sections},
    )
    if not isinstance(payload, dict):
        raise SectorsInvalidResponseError("Sectors API returned an invalid subsector report")
    return payload


async def fetch_company_report(symbol: str, sections: str) -> dict[str, Any]:
    payload = await _request_json(
        COMPANY_REPORT_PATH.format(symbol=symbol),
        {"sections": sections},
    )
    if not isinstance(payload, dict):
        raise SectorsInvalidResponseError("Sectors API returned an invalid company report")
    return payload
