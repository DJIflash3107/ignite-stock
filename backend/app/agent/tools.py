"""Investigation agent tools backed by Sectors Financial API services.

All metrics are calculated deterministically with Decimal precision.
Failed tool calls record errors without fabricating data.
"""

import asyncio
from datetime import date, datetime, timedelta
from decimal import Decimal
import logging
import time
from typing import Any

from app.helpers.exceptions import AppError, SectorsInvalidResponseError
from app.models.enums import EvidenceAlignment, ToolCallStatus
from app.services.sectors_service import (
    get_company_filings,
    get_company_news,
    get_company_report,
    get_index_daily_range,
    get_stock_daily,
    get_subsector_report,
)

logger = logging.getLogger("ignite_stock.agent")


def _to_decimal(value: Any) -> Decimal | None:
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except (TypeError, ValueError):
        return None


def _find_target_and_prev_quote(
    quotes: list[dict[str, Any]],
    target_date: date,
) -> tuple[dict[str, Any], dict[str, Any] | None, date]:
    valid_quotes = [q for q in quotes if isinstance(q, dict) and "date" in q and ("close" in q or "price" in q)]
    if not valid_quotes:
        raise SectorsInvalidResponseError("No valid price quotes returned")

    valid_quotes.sort(key=lambda x: str(x["date"]))
    target_str = target_date.isoformat()

    target_idx = None
    for i, q in enumerate(valid_quotes):
        q_date_str = str(q["date"])
        if q_date_str == target_str:
            target_idx = i
            break
        elif q_date_str < target_str:
            target_idx = i

    if target_idx is None:
        raise SectorsInvalidResponseError(f"No trading data found on or before target date {target_str}")

    target_row = valid_quotes[target_idx]
    actual_date = date.fromisoformat(str(target_row["date"]))
    prev_row = valid_quotes[target_idx - 1] if target_idx > 0 else None
    return target_row, prev_row, actual_date


async def tool_get_stock_movement(
    symbol: str,
    target_date: str,
) -> dict[str, Any]:
    """Retrieve stock price movement, returns, and volume profile for a symbol."""
    tgt_date = date.fromisoformat(target_date) if isinstance(target_date, str) else target_date
    history_start = tgt_date - timedelta(days=35)

    quotes = await get_stock_daily(symbol, history_start, tgt_date)
    target_quote, prev_quote, actual_trade_date = _find_target_and_prev_quote(quotes, tgt_date)

    close_price = _to_decimal(target_quote.get("close"))
    prev_close_price = _to_decimal(prev_quote.get("close")) if prev_quote else None

    if close_price is None or prev_close_price is None or prev_close_price == 0:
        stock_return = Decimal("0")
        nominal_change = Decimal("0")
    else:
        stock_return = (close_price - prev_close_price) / prev_close_price
        nominal_change = close_price - prev_close_price

    volume = _to_decimal(target_quote.get("volume")) or Decimal("0")

    # 20-day historical volume average
    target_date_str = str(target_quote["date"])
    prior_quotes = [q for q in quotes if str(q.get("date", "")) < target_date_str]
    prior_volumes = [
        _to_decimal(q.get("volume"))
        for q in prior_quotes[-20:]
        if _to_decimal(q.get("volume")) is not None
    ]
    avg_volume = sum(prior_volumes) / Decimal(len(prior_volumes)) if prior_volumes else volume
    volume_ratio = volume / avg_volume if avg_volume > 0 else Decimal("1")

    direction = "up" if stock_return > Decimal("0.002") else ("down" if stock_return < Decimal("-0.002") else "flat")

    return {
        "symbol": symbol.upper(),
        "actual_trade_date": actual_trade_date.isoformat(),
        "target_date_requested": tgt_date.isoformat(),
        "close_price": float(close_price) if close_price else None,
        "prev_close_price": float(prev_close_price) if prev_close_price else None,
        "nominal_change": float(nominal_change),
        "stock_return": float(stock_return),
        "return_pct": f"{float(stock_return) * 100:+.2f}%",
        "volume": float(volume),
        "avg_volume_20d": float(avg_volume),
        "volume_ratio": float(volume_ratio),
        "is_volume_spike": bool(volume_ratio >= Decimal("1.5")),
        "direction": direction,
    }


async def tool_get_market_context(
    target_date: str,
    index_code: str = "IHSG",
    stock_return: float | None = None,
) -> dict[str, Any]:
    """Retrieve benchmark index performance and compare against stock return."""
    tgt_date = date.fromisoformat(target_date) if isinstance(target_date, str) else target_date
    history_start = tgt_date - timedelta(days=35)

    index_quotes = await get_index_daily_range(index_code, history_start, tgt_date)
    target_idx, prev_idx, actual_date = _find_target_and_prev_quote(index_quotes, tgt_date)

    idx_price = _to_decimal(target_idx.get("price"))
    prev_idx_price = _to_decimal(prev_idx.get("price")) if prev_idx else None

    if idx_price is not None and prev_idx_price is not None and prev_idx_price > 0:
        index_return = (idx_price - prev_idx_price) / prev_idx_price
    else:
        index_return = Decimal("0")

    idx_ret_float = float(index_return)
    relative_return = (stock_return - idx_ret_float) if stock_return is not None else None

    # Alignment
    if stock_return is None or abs(idx_ret_float) < 0.001 or abs(stock_return) < 0.002:
        alignment = EvidenceAlignment.NEUTRAL.value
    elif (stock_return > 0 and idx_ret_float > 0) or (stock_return < 0 and idx_ret_float < 0):
        alignment = EvidenceAlignment.SUPPORTING.value
    else:
        alignment = EvidenceAlignment.CONTRADICTORY.value

    return {
        "index_code": index_code.upper(),
        "actual_date": actual_date.isoformat(),
        "index_price": float(idx_price) if idx_price else None,
        "prev_index_price": float(prev_idx_price) if prev_idx_price else None,
        "index_return": idx_ret_float,
        "index_return_pct": f"{idx_ret_float * 100:+.2f}%",
        "relative_return": relative_return,
        "relative_return_pct": f"{relative_return * 100:+.2f}%" if relative_return is not None else None,
        "alignment": alignment,
    }


async def tool_get_sector_context(
    symbol: str | None = None,
    sub_sector: str | None = None,
    stock_return: float | None = None,
) -> dict[str, Any]:
    """Retrieve subsector market cap changes and calculate sector alignment."""
    resolved_subsector = sub_sector

    if not resolved_subsector and symbol:
        report = await get_company_report(symbol, "overview")
        overview = report.get("overview", {}) if isinstance(report, dict) else {}
        resolved_subsector = overview.get("sub_sector")

    if not resolved_subsector:
        raise SectorsInvalidResponseError("Subsector could not be identified for the stock")

    subsector_data = await get_subsector_report(resolved_subsector, "market_cap")
    mcap = subsector_data.get("market_cap", {})
    summary = mcap.get("mcap_summary", {}) if isinstance(mcap, dict) else {}
    changes = summary.get("mcap_change", {}) if isinstance(summary, dict) else {}

    change_1d = _to_decimal(changes.get("1d"))
    change_1w = _to_decimal(changes.get("1w"))

    # Alignment with 1d or 1w change
    ref_change = change_1d if change_1d is not None else change_1w
    ref_change_float = float(ref_change) if ref_change is not None else None

    if stock_return is None or ref_change_float is None or abs(ref_change_float) < 0.001 or abs(stock_return) < 0.002:
        alignment = EvidenceAlignment.NEUTRAL.value
    elif (stock_return > 0 and ref_change_float > 0) or (stock_return < 0 and ref_change_float < 0):
        alignment = EvidenceAlignment.SUPPORTING.value
    else:
        alignment = EvidenceAlignment.CONTRADICTORY.value

    return {
        "sub_sector": resolved_subsector,
        "mcap_change_1d": float(change_1d) if change_1d is not None else None,
        "mcap_change_1w": float(change_1w) if change_1w is not None else None,
        "alignment": alignment,
        "raw_summary": summary,
    }


async def tool_get_peer_movements(
    symbol: str,
    target_date: str,
    limit: int = 5,
    stock_return: float | None = None,
) -> dict[str, Any]:
    """Retrieve peer company returns and evaluate peer cohort movement."""
    tgt_date = date.fromisoformat(target_date) if isinstance(target_date, str) else target_date
    report = await get_company_report(symbol, "peers")
    peers_list = report.get("peers", []) if isinstance(report, dict) else []

    top_peers = peers_list[:limit] if isinstance(peers_list, list) else []
    if not top_peers:
        return {
            "symbol": symbol.upper(),
            "peer_returns": [],
            "supporting_count": 0,
            "contradicting_count": 0,
            "alignment": EvidenceAlignment.NEUTRAL.value,
        }

    peer_tasks = []
    peer_symbols = []
    for p in top_peers:
        if isinstance(p, dict) and "symbol" in p:
            p_sym = str(p["symbol"]).replace(".JK", "").strip()
            peer_symbols.append(p_sym)
            peer_tasks.append(get_stock_daily(p_sym, tgt_date - timedelta(days=7), tgt_date))

    peer_results = await asyncio.gather(*peer_tasks, return_exceptions=True)

    peer_returns: list[dict[str, Any]] = []
    supporting_count = 0
    contradicting_count = 0

    for p_sym, res in zip(peer_symbols, peer_results):
        if isinstance(res, list) and res:
            try:
                p_target, p_prev, _ = _find_target_and_prev_quote(res, tgt_date)
                p_close = _to_decimal(p_target.get("close"))
                p_pclose = _to_decimal(p_prev.get("close")) if p_prev else None
                if p_close and p_pclose and p_pclose > 0:
                    p_ret = (p_close - p_pclose) / p_pclose
                    p_ret_float = float(p_ret)
                    peer_returns.append({
                        "symbol": p_sym,
                        "close_price": float(p_close),
                        "return": p_ret_float,
                        "return_pct": f"{p_ret_float * 100:+.2f}%",
                    })

                    if stock_return is not None and abs(stock_return) >= 0.002:
                        if (stock_return > 0 and p_ret_float > 0.001) or (stock_return < 0 and p_ret_float < -0.001):
                            supporting_count += 1
                        elif (stock_return > 0 and p_ret_float < -0.001) or (stock_return < 0 and p_ret_float > 0.001):
                            contradicting_count += 1
            except Exception:
                continue

    if peer_returns and supporting_count > contradicting_count:
        alignment = EvidenceAlignment.SUPPORTING.value
    elif peer_returns and contradicting_count > supporting_count:
        alignment = EvidenceAlignment.CONTRADICTORY.value
    else:
        alignment = EvidenceAlignment.NEUTRAL.value

    return {
        "symbol": symbol.upper(),
        "peer_returns": peer_returns,
        "supporting_count": supporting_count,
        "contradicting_count": contradicting_count,
        "alignment": alignment,
    }


async def tool_get_company_news(
    symbol: str,
    target_date: str | None = None,
    limit: int = 10,
) -> dict[str, Any]:
    """Retrieve recent verified news articles for a company."""
    raw_news = await get_company_news(symbol, limit=limit)
    news_items: list[dict[str, Any]] = []

    if isinstance(raw_news, list):
        for item in raw_news:
            if isinstance(item, dict):
                news_items.append({
                    "title": item.get("title") or item.get("headline", ""),
                    "url": item.get("url") or item.get("link", ""),
                    "publish_date": item.get("publish_date") or item.get("timestamp") or item.get("date", ""),
                    "sentiment": item.get("sentiment"),
                    "source": item.get("source") or item.get("publisher", ""),
                })

    return {
        "symbol": symbol.upper(),
        "news_count": len(news_items),
        "articles": news_items,
    }


async def tool_get_company_filings(
    symbol: str,
    target_date: str | None = None,
    limit: int = 10,
) -> dict[str, Any]:
    """Retrieve regulatory filings and corporate disclosures for a company."""
    raw_filings = await get_company_filings(symbol, limit=limit)
    filing_items: list[dict[str, Any]] = []

    if isinstance(raw_filings, list):
        for item in raw_filings:
            if isinstance(item, dict):
                filing_items.append({
                    "title": item.get("title") or item.get("description", ""),
                    "filing_date": item.get("date") or item.get("filing_date") or item.get("timestamp", ""),
                    "filing_type": item.get("type") or item.get("filing_type", ""),
                    "url": item.get("url") or item.get("link", ""),
                })

    return {
        "symbol": symbol.upper(),
        "filings_count": len(filing_items),
        "filings": filing_items,
    }


async def tool_get_company_financials(
    symbol: str,
) -> dict[str, Any]:
    """Retrieve company financial overview, valuation multiples, and fundamental metrics."""
    report = await get_company_report(symbol, "overview,valuation,financials")
    overview = report.get("overview", {}) if isinstance(report, dict) else {}
    valuation = report.get("valuation", {}) if isinstance(report, dict) else {}
    financials = report.get("financials", {}) if isinstance(report, dict) else {}

    return {
        "symbol": symbol.upper(),
        "company_name": overview.get("company_name"),
        "sub_sector": overview.get("sub_sector"),
        "market_cap": overview.get("market_cap"),
        "valuation": valuation,
        "financials": financials,
    }


AVAILABLE_TOOLS = {
    "get_stock_movement": tool_get_stock_movement,
    "get_market_context": tool_get_market_context,
    "get_sector_context": tool_get_sector_context,
    "get_peer_movements": tool_get_peer_movements,
    "get_company_news": tool_get_company_news,
    "get_company_filings": tool_get_company_filings,
    "get_company_financials": tool_get_company_financials,
}


async def execute_tool_safely(
    tool_name: str,
    arguments: dict[str, Any],
) -> tuple[str, dict[str, Any], int]:
    """Execute a tool with timing, exception handling, and error recording.

    Returns:
        (status, result_dict, execution_time_ms)
    """
    fn = AVAILABLE_TOOLS.get(tool_name)
    if not fn:
        return (
            ToolCallStatus.FAILED.value,
            {"error": f"Tool '{tool_name}' is not registered", "error_code": 40404},
            0,
        )

    start_time = time.monotonic()
    try:
        result = await fn(**arguments)
        duration_ms = int((time.monotonic() - start_time) * 1000)
        return ToolCallStatus.COMPLETED.value, result, duration_ms
    except AppError as exc:
        duration_ms = int((time.monotonic() - start_time) * 1000)
        logger.warning("Tool %s failed with AppError: %s", tool_name, exc.message)
        return (
            ToolCallStatus.FAILED.value,
            {"error": exc.message, "error_code": exc.code, "details": exc.details},
            duration_ms,
        )
    except Exception as exc:
        duration_ms = int((time.monotonic() - start_time) * 1000)
        logger.exception("Tool %s failed unexpectedly: %s", tool_name, exc)
        return (
            ToolCallStatus.FAILED.value,
            {"error": str(exc), "error_code": 50000},
            duration_ms,
        )
