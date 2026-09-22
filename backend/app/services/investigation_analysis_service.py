import asyncio
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from app.helpers.exceptions import DatabaseError, NotFoundError, SectorsInvalidResponseError, ValidationAppError
from app.helpers.schemas import (
    EvidenceItemRead,
    InvestigationAnalyzeRequest,
    InvestigationDetailRead,
    InvestigationDriverRead,
    InvestigationRead,
)
from app.models.base import utc_now
from app.models.enums import (
    ConfidenceLevel,
    DriverType,
    EvidenceAlignment,
    EvidenceType,
    ImpactLevel,
    InvestigationStatus,
    InvestigationType,
)
from app.models.evidence_item import EvidenceItem
from app.models.investigation import Investigation
from app.models.investigation_driver import InvestigationDriver
from app.services.sectors_service import (
    get_company_filings,
    get_company_news,
    get_company_report,
    get_corporate_actions,
    get_index_daily_range,
    get_stock_daily,
    get_subsector_report,
)


def _to_decimal(value: Any) -> Decimal | None:
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except (TypeError, ValueError):
        return None


def _change(first: Decimal, last: Decimal) -> Decimal | None:
    if first == 0:
        return None
    return (last - first) / first


def _find_target_and_prev_quote(
    quotes: list[dict[str, Any]],
    target_date: date,
) -> tuple[dict[str, Any], dict[str, Any] | None, date]:
    # Sort quotes chronologically by date
    valid_quotes = [q for q in quotes if isinstance(q, dict) and "date" in q and "close" in q]
    if not valid_quotes:
        raise SectorsInvalidResponseError("No valid price quotes returned for symbol")

    valid_quotes.sort(key=lambda x: str(x["date"]))

    target_str = target_date.isoformat()
    # Find exact match or most recent date <= target_date
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


async def run_investigation_analysis(
    db: AsyncSession,
    request: InvestigationAnalyzeRequest,
    user_id: UUID | None = None,
) -> InvestigationDetailRead:
    ticker = request.company_ticker
    target_date = request.target_date
    index_code = request.index_code
    peer_limit = request.peer_limit
    news_limit = request.news_limit
    filings_limit = request.filings_limit

    # 1. Date window for price data (35 calendar days to ensure ~20 trading days)
    history_start = target_date - timedelta(days=35)

    # 2. Gather data concurrently from Sectors V2 API
    (
        stock_quotes,
        index_quotes,
        company_report,
        news_items,
        filings_items,
        corp_actions,
    ) = await asyncio.gather(
        get_stock_daily(ticker, history_start, target_date),
        get_index_daily_range(index_code, history_start, target_date),
        get_company_report(ticker, "overview,valuation,peers,financials"),
        get_company_news(ticker, limit=news_limit),
        get_company_filings(ticker, limit=filings_limit),
        get_corporate_actions(ticker),
    )

    # 3. Analyze Stock Movement
    target_quote, prev_quote, actual_trade_date = _find_target_and_prev_quote(stock_quotes, target_date)
    close_price = _to_decimal(target_quote.get("close"))
    prev_close_price = _to_decimal(prev_quote.get("close")) if prev_quote else None

    if close_price is None or prev_close_price is None or prev_close_price == 0:
        stock_return = Decimal("0")
    else:
        stock_return = (close_price - prev_close_price) / prev_close_price

    volume = _to_decimal(target_quote.get("volume")) or Decimal("0")

    # Calculate average volume over preceding trading days
    target_quote_date = str(target_quote["date"])
    prior_quotes = [q for q in stock_quotes if str(q.get("date", "")) < target_quote_date]
    prior_volumes = [
        _to_decimal(q.get("volume"))
        for q in prior_quotes[-20:]
        if _to_decimal(q.get("volume")) is not None
    ]
    avg_volume = sum(prior_volumes) / Decimal(len(prior_volumes)) if prior_volumes else volume
    volume_ratio = volume / avg_volume if avg_volume > 0 else Decimal("1")

    # Movement direction
    is_up = stock_return > Decimal("0.002")
    is_down = stock_return < Decimal("-0.002")
    is_flat = not is_up and not is_down

    # 4. Market Context (Index)
    index_return = Decimal("0")
    if index_quotes:
        try:
            target_idx_quote, prev_idx_quote, _ = _find_target_and_prev_quote(index_quotes, actual_trade_date)
            idx_price = _to_decimal(target_idx_quote.get("price"))
            prev_idx_price = _to_decimal(prev_idx_quote.get("price")) if prev_idx_quote else None
            if idx_price is not None and prev_idx_price is not None and prev_idx_price > 0:
                index_return = (idx_price - prev_idx_price) / prev_idx_price
        except SectorsInvalidResponseError:
            index_return = Decimal("0")

    relative_to_market = stock_return - index_return

    # Market alignment
    if is_flat or abs(index_return) < Decimal("0.001"):
        market_alignment = EvidenceAlignment.NEUTRAL
    elif (is_up and index_return > 0) or (is_down and index_return < 0):
        market_alignment = EvidenceAlignment.SUPPORTING
    else:
        market_alignment = EvidenceAlignment.CONTRADICTORY

    # 5. Sector Context & Peer Movement
    overview = company_report.get("overview", {}) if isinstance(company_report, dict) else {}
    peers = company_report.get("peers", []) if isinstance(company_report, dict) else []
    financials = company_report.get("financials", {}) if isinstance(company_report, dict) else {}
    valuation = company_report.get("valuation", {}) if isinstance(company_report, dict) else {}

    sub_sector = overview.get("sub_sector") if isinstance(overview, dict) else None
    sector_change: Decimal | None = None

    if isinstance(sub_sector, str) and sub_sector.strip():
        try:
            subsector_report = await get_subsector_report(sub_sector.strip().lower(), "market_cap")
            mcap = subsector_report.get("market_cap", {})
            summary = mcap.get("mcap_summary", {}) if isinstance(mcap, dict) else {}
            changes = summary.get("mcap_change", {}) if isinstance(summary, dict) else {}
            s_val = changes.get("1d") or changes.get("1w")
            if s_val is not None:
                sector_change = _to_decimal(s_val)
        except Exception:
            sector_change = None

    if sector_change is None or is_flat or abs(sector_change) < Decimal("0.001"):
        sector_alignment = EvidenceAlignment.NEUTRAL
    elif (is_up and sector_change > 0) or (is_down and sector_change < 0):
        sector_alignment = EvidenceAlignment.SUPPORTING
    else:
        sector_alignment = EvidenceAlignment.CONTRADICTORY

    # Peer movement
    peer_returns: list[tuple[str, Decimal]] = []
    top_peers = peers[:peer_limit] if isinstance(peers, list) else []
    if top_peers:
        peer_tasks = []
        peer_tickers = []
        for p in top_peers:
            if isinstance(p, dict) and "symbol" in p:
                p_ticker = str(p["symbol"]).replace(".JK", "").strip()
                peer_tickers.append(p_ticker)
                peer_tasks.append(get_stock_daily(p_ticker, actual_trade_date - timedelta(days=7), actual_trade_date))

        if peer_tasks:
            peer_results = await asyncio.gather(*peer_tasks, return_exceptions=True)
            for p_sym, res in zip(peer_tickers, peer_results):
                if isinstance(res, list) and res:
                    try:
                        p_target, p_prev, _ = _find_target_and_prev_quote(res, actual_trade_date)
                        p_close = _to_decimal(p_target.get("close"))
                        p_pclose = _to_decimal(p_prev.get("close")) if p_prev else None
                        if p_close and p_pclose and p_pclose > 0:
                            p_ret = (p_close - p_pclose) / p_pclose
                            peer_returns.append((p_sym, p_ret))
                    except Exception:
                        continue

    supporting_peers_count = 0
    contradicting_peers_count = 0
    for _, p_ret in peer_returns:
        if (is_up and p_ret > Decimal("0.001")) or (is_down and p_ret < Decimal("-0.001")):
            supporting_peers_count += 1
        elif (is_up and p_ret < Decimal("-0.001")) or (is_down and p_ret > Decimal("0.001")):
            contradicting_peers_count += 1

    if peer_returns and supporting_peers_count > contradicting_peers_count:
        peer_alignment = EvidenceAlignment.SUPPORTING
    elif peer_returns and contradicting_peers_count > supporting_peers_count:
        peer_alignment = EvidenceAlignment.CONTRADICTORY
    else:
        peer_alignment = EvidenceAlignment.NEUTRAL

    # 6. News Analysis
    relevant_news: list[dict[str, Any]] = []
    if isinstance(news_items, list):
        for item in news_items:
            if not isinstance(item, dict):
                continue
            ts_str = item.get("timestamp") or item.get("publish_date") or item.get("date")
            if ts_str:
                try:
                    item_dt = datetime.fromisoformat(str(ts_str).replace("Z", "+00:00"))
                    item_date = item_dt.date()
                    if abs((item_date - actual_trade_date).days) <= 3:
                        relevant_news.append(item)
                except Exception:
                    relevant_news.append(item)
            else:
                relevant_news.append(item)

    # 7. Filings Analysis
    relevant_filings: list[dict[str, Any]] = []
    if isinstance(filings_items, list):
        for item in filings_items:
            if not isinstance(item, dict):
                continue
            ts_str = item.get("timestamp") or item.get("date")
            if ts_str:
                try:
                    item_dt = datetime.fromisoformat(str(ts_str).replace("Z", "+00:00"))
                    item_date = item_dt.date()
                    if abs((item_date - actual_trade_date).days) <= 5:
                        relevant_filings.append(item)
                except Exception:
                    relevant_filings.append(item)
            else:
                relevant_filings.append(item)

    # 8. Corporate Actions Analysis
    matched_corp_actions: list[dict[str, Any]] = []
    if isinstance(corp_actions, dict):
        ca_dict = corp_actions.get("corporate_actions", {})
        if isinstance(ca_dict, dict):
            for ca_category, ca_list in ca_dict.items():
                if isinstance(ca_list, list):
                    for ca_item in ca_list:
                        if not isinstance(ca_item, dict):
                            continue
                        for d_key in ("ex_date", "payment_date", "agm_date", "date"):
                            d_val = ca_item.get(d_key)
                            if d_val:
                                try:
                                    ca_date = date.fromisoformat(str(d_val))
                                    if abs((ca_date - actual_trade_date).days) <= 3:
                                        matched_corp_actions.append({
                                            "category": ca_category,
                                            "date_key": d_key,
                                            "date_val": d_val,
                                            "details": ca_item,
                                        })
                                        break
                                except Exception:
                                    continue

    # 9. Financial Metrics
    eps = financials.get("eps") if isinstance(financials, dict) else None
    yoy_earnings = financials.get("yoy_quarter_earnings_growth") if isinstance(financials, dict) else None
    yoy_revenue = financials.get("yoy_quarter_revenue_growth") if isinstance(financials, dict) else None
    pe_ratio = valuation.get("pe_ratio") if isinstance(valuation, dict) else None
    pbv_ratio = valuation.get("pbv_ratio") if isinstance(valuation, dict) else None

    # Determine financial alignment
    earnings_dec = _to_decimal(yoy_earnings)
    if earnings_dec is not None:
        if (is_up and earnings_dec > Decimal("0.05")) or (is_down and earnings_dec < Decimal("-0.05")):
            financial_alignment = EvidenceAlignment.SUPPORTING
        elif (is_up and earnings_dec < Decimal("-0.05")) or (is_down and earnings_dec > Decimal("0.05")):
            financial_alignment = EvidenceAlignment.CONTRADICTORY
        else:
            financial_alignment = EvidenceAlignment.NEUTRAL
    else:
        financial_alignment = EvidenceAlignment.NEUTRAL

    # 10. Synthesize Drivers & Evidence Items
    candidate_drivers: list[dict[str, Any]] = []
    all_evidence_specs: list[dict[str, Any]] = []

    # Evidence A: Stock Price & Volume
    price_evidence = {
        "evidence_type": EvidenceType.PRICE,
        "title": f"{ticker} Price Action & Volume Profile",
        "description": (
            f"{ticker} traded at {close_price} ({stock_return:+.2%}) on {actual_trade_date} "
            f"with trading volume of {volume:,.0f} ({volume_ratio:.2f}x 20-day average volume)."
        ),
        "data": {
            "close_price": float(close_price),
            "prev_close": float(prev_close_price) if prev_close_price else None,
            "return": float(stock_return),
            "volume": float(volume),
            "avg_volume": float(avg_volume),
            "volume_ratio": float(volume_ratio),
            "actual_trade_date": actual_trade_date.isoformat(),
        },
        "source_type": "sectors_v2_stock_daily",
        "source_reference": f"/v2/daily/{ticker}/",
        "alignment": EvidenceAlignment.SUPPORTING if not is_flat else EvidenceAlignment.NEUTRAL,
        "observed_at": datetime.combine(actual_trade_date, datetime.min.time()),
        "driver_key": "volume_price" if volume_ratio >= Decimal("1.5") or abs(stock_return) >= Decimal("0.02") else None,
    }
    all_evidence_specs.append(price_evidence)

    # Evidence B: Market Context
    market_evidence = {
        "evidence_type": EvidenceType.MARKET,
        "title": f"{index_code} Benchmark Performance",
        "description": (
            f"The benchmark index {index_code} changed {index_return:+.2%} on {actual_trade_date}. "
            f"{ticker} recorded a relative performance of {relative_to_market:+.2%} against the index."
        ),
        "data": {
            "index_code": index_code,
            "index_return": float(index_return),
            "relative_performance": float(relative_to_market),
        },
        "source_type": "sectors_v2_index_daily",
        "source_reference": f"/v2/index-daily/{index_code}/",
        "alignment": market_alignment,
        "observed_at": datetime.combine(actual_trade_date, datetime.min.time()),
        "driver_key": "market" if abs(index_return) >= Decimal("0.01") and market_alignment == EvidenceAlignment.SUPPORTING else None,
    }
    all_evidence_specs.append(market_evidence)

    # Evidence C: Sector Context
    if sub_sector:
        sector_evidence = {
            "evidence_type": EvidenceType.OTHER,
            "title": f"Subsector Context: {sub_sector}",
            "description": (
                f"Company belongs to subsector '{sub_sector}'. "
                + (f"Subsector change was {sector_change:+.2%}." if sector_change is not None else "Subsector data observed.")
            ),
            "data": {
                "sub_sector": sub_sector,
                "sector_change": float(sector_change) if sector_change is not None else None,
            },
            "source_type": "sectors_v2_subsector_report",
            "source_reference": f"/v2/subsector/report/{sub_sector.lower()}/",
            "alignment": sector_alignment,
            "observed_at": datetime.combine(actual_trade_date, datetime.min.time()),
            "driver_key": "sector" if sector_alignment == EvidenceAlignment.SUPPORTING and sector_change is not None and abs(sector_change) >= Decimal("0.01") else None,
        }
        all_evidence_specs.append(sector_evidence)

    # Evidence D: Peer Performance
    if peer_returns:
        peer_summary_str = ", ".join(f"{sym}: {ret:+.2%}" for sym, ret in peer_returns[:5])
        peers_evidence = {
            "evidence_type": EvidenceType.PRICE,
            "title": f"Industry Peer Co-Movement ({len(peer_returns)} peers)",
            "description": f"Peer price action on {actual_trade_date}: {peer_summary_str}.",
            "data": {
                "peers": [{"symbol": sym, "return": float(ret)} for sym, ret in peer_returns],
                "supporting_peers_count": supporting_peers_count,
                "contradicting_peers_count": contradicting_peers_count,
            },
            "source_type": "sectors_v2_peer_analysis",
            "source_reference": "/v2/company/report/{symbol}/?sections=peers",
            "alignment": peer_alignment,
            "observed_at": datetime.combine(actual_trade_date, datetime.min.time()),
            "driver_key": "sector" if peer_alignment == EvidenceAlignment.SUPPORTING and supporting_peers_count >= 2 else None,
        }
        all_evidence_specs.append(peers_evidence)

    # Evidence E: Corporate Actions
    if matched_corp_actions:
        for ca in matched_corp_actions:
            cat = ca["category"]
            details = ca["details"]
            ca_evidence = {
                "evidence_type": EvidenceType.OTHER,
                "title": f"Corporate Action: {cat.replace('_', ' ').title()}",
                "description": (
                    f"Identified {cat} action with {ca['date_key']} on {ca['date_val']}: {details}"
                ),
                "data": details,
                "source_type": "sectors_v2_corporate_actions",
                "source_reference": f"/v2/company/corporate-actions/{ticker}/",
                "alignment": EvidenceAlignment.SUPPORTING,
                "observed_at": datetime.combine(actual_trade_date, datetime.min.time()),
                "driver_key": "corporate_action",
            }
            all_evidence_specs.append(ca_evidence)

    # Evidence F: Relevant News
    for news in relevant_news[:5]:
        title = news.get("title", "News Release")
        body = news.get("body", "")
        source_url = news.get("source")
        tags = news.get("tags") or []

        # Tag-based alignment heuristics
        is_news_bullish = any(t.lower() in ("bullish", "profit surge", "dividend", "expansion") for t in tags)
        is_news_bearish = any(t.lower() in ("bearish", "loss", "decline", "penalty", "lawsuit") for t in tags)

        if (is_up and is_news_bullish) or (is_down and is_news_bearish):
            news_align = EvidenceAlignment.SUPPORTING
        elif (is_up and is_news_bearish) or (is_down and is_news_bullish):
            news_align = EvidenceAlignment.CONTRADICTORY
        else:
            news_align = EvidenceAlignment.NEUTRAL

        news_evidence = {
            "evidence_type": EvidenceType.NEWS,
            "title": f"News: {title[:120]}",
            "description": body[:300] if body else title,
            "data": {
                "title": title,
                "source": source_url,
                "timestamp": news.get("timestamp"),
                "tags": tags,
            },
            "source_type": "sectors_v2_news",
            "source_reference": source_url or "/v2/news/",
            "alignment": news_align,
            "observed_at": datetime.combine(actual_trade_date, datetime.min.time()),
            "driver_key": "news" if news_align == EvidenceAlignment.SUPPORTING else None,
        }
        all_evidence_specs.append(news_evidence)

    # Evidence G: Relevant Filings
    for filing in relevant_filings[:5]:
        f_title = filing.get("title", "Regulatory Filing")
        f_body = filing.get("body", "")
        f_source = filing.get("source")
        tx_type = filing.get("transaction_type")

        if tx_type == "buy":
            filing_align = EvidenceAlignment.SUPPORTING if is_up else EvidenceAlignment.CONTRADICTORY
        elif tx_type == "sell":
            filing_align = EvidenceAlignment.SUPPORTING if is_down else EvidenceAlignment.CONTRADICTORY
        else:
            filing_align = EvidenceAlignment.NEUTRAL

        filing_evidence = {
            "evidence_type": EvidenceType.FILING,
            "title": f"Filing: {f_title[:120]}",
            "description": f_body[:300] if f_body else f_title,
            "data": {
                "title": f_title,
                "source": f_source,
                "timestamp": filing.get("timestamp"),
                "transaction_type": tx_type,
                "holder_name": filing.get("holder_name"),
                "transaction_value": filing.get("transaction_value"),
            },
            "source_type": "sectors_v2_filings",
            "source_reference": f_source or "/v2/filings/",
            "alignment": filing_align,
            "observed_at": datetime.combine(actual_trade_date, datetime.min.time()),
            "driver_key": "filing" if filing_align == EvidenceAlignment.SUPPORTING else None,
        }
        all_evidence_specs.append(filing_evidence)

    # Evidence H: Financial Fundamentals
    if financials:
        fin_evidence = {
            "evidence_type": EvidenceType.FINANCIAL,
            "title": f"{ticker} Fundamental & Valuation Profile",
            "description": (
                f"TTM EPS: {eps}. YoY Quarter Earnings Growth: {yoy_earnings}. "
                f"YoY Quarter Revenue Growth: {yoy_revenue}. P/E: {pe_ratio}, P/B: {pbv_ratio}."
            ),
            "data": {
                "eps": eps,
                "yoy_quarter_earnings_growth": yoy_earnings,
                "yoy_quarter_revenue_growth": yoy_revenue,
                "pe_ratio": pe_ratio,
                "pbv_ratio": pbv_ratio,
            },
            "source_type": "sectors_v2_financials",
            "source_reference": f"/v2/company/report/{ticker}/?sections=financials,valuation",
            "alignment": financial_alignment,
            "observed_at": datetime.combine(actual_trade_date, datetime.min.time()),
            "driver_key": "fundamental" if financial_alignment == EvidenceAlignment.SUPPORTING and abs(earnings_dec or 0) >= Decimal("0.10") else None,
        }
        all_evidence_specs.append(fin_evidence)

    # 11. Drivers Generation based on Evidence Keys
    has_ca_evidence = any(e.get("driver_key") == "corporate_action" for e in all_evidence_specs)
    has_news_evidence = any(e.get("driver_key") == "news" for e in all_evidence_specs)
    has_filing_evidence = any(e.get("driver_key") == "filing" for e in all_evidence_specs)
    has_volume_evidence = any(e.get("driver_key") == "volume_price" for e in all_evidence_specs)
    has_sector_evidence = any(e.get("driver_key") == "sector" for e in all_evidence_specs)
    has_market_evidence = any(e.get("driver_key") == "market" for e in all_evidence_specs)
    has_fundamental_evidence = any(e.get("driver_key") == "fundamental" for e in all_evidence_specs)

    rank = 1

    if has_ca_evidence:
        candidate_drivers.append({
            "key": "corporate_action",
            "driver_type": DriverType.CORPORATE_ACTION,
            "title": "Corporate Action Catalyst",
            "description": f"Scheduled corporate action event coincided with the trading session on {actual_trade_date}.",
            "confidence": ConfidenceLevel.HIGH,
            "impact_level": ImpactLevel.HIGH,
            "rank": rank,
        })
        rank += 1

    if has_news_evidence or has_filing_evidence:
        candidate_drivers.append({
            "key": "news_filing",
            "driver_type": DriverType.NEWS if has_news_evidence else DriverType.OTHER,
            "title": "Disclosures & Public Information Catalyst",
            "description": f"Material news coverage or official regulatory filings were disclosed around {actual_trade_date}.",
            "confidence": ConfidenceLevel.HIGH if (has_news_evidence and has_volume_evidence) else ConfidenceLevel.MEDIUM,
            "impact_level": ImpactLevel.HIGH if has_volume_evidence else ImpactLevel.MEDIUM,
            "rank": rank,
        })
        rank += 1

    if has_volume_evidence:
        candidate_drivers.append({
            "key": "volume_price",
            "driver_type": DriverType.VOLUME if volume_ratio >= Decimal("1.5") else DriverType.PRICE,
            "title": "Abnormal Trading Volume & Price Momentum",
            "description": (
                f"Trading volume surged to {volume_ratio:.2f}x the 20-day historical average with "
                f"a daily return of {stock_return:+.2%}."
            ),
            "confidence": ConfidenceLevel.HIGH if (has_news_evidence or has_sector_evidence) else ConfidenceLevel.MEDIUM,
            "impact_level": ImpactLevel.HIGH if volume_ratio >= Decimal("2.0") else ImpactLevel.MEDIUM,
            "rank": rank,
        })
        rank += 1

    if has_sector_evidence:
        candidate_drivers.append({
            "key": "sector",
            "driver_type": DriverType.SECTOR,
            "title": "Sector & Peer Co-Movement",
            "description": f"Price movement aligned with peer group trends in the {sub_sector or 'industry'} sector.",
            "confidence": ConfidenceLevel.MEDIUM,
            "impact_level": ImpactLevel.MEDIUM,
            "rank": rank,
        })
        rank += 1

    if has_market_evidence:
        candidate_drivers.append({
            "key": "market",
            "driver_type": DriverType.MARKET,
            "title": f"Broader {index_code} Market Flow",
            "description": f"Macro market movement ({index_return:+.2%}) provided tailwinds/headwinds for {ticker}.",
            "confidence": ConfidenceLevel.MEDIUM,
            "impact_level": ImpactLevel.LOW if abs(relative_to_market) > Decimal("0.02") else ImpactLevel.MEDIUM,
            "rank": rank,
        })
        rank += 1

    if has_fundamental_evidence:
        candidate_drivers.append({
            "key": "fundamental",
            "driver_type": DriverType.FUNDAMENTAL,
            "title": "Earnings Growth & Fundamentals Alignment",
            "description": f"Company's reported quarterly earnings growth ({yoy_earnings}) supported valuation.",
            "confidence": ConfidenceLevel.MEDIUM,
            "impact_level": ImpactLevel.MEDIUM,
            "rank": rank,
        })
        rank += 1

    # Fallback: No clear catalyst detected
    if not candidate_drivers:
        candidate_drivers.append({
            "key": "no_clear_catalyst",
            "driver_type": DriverType.OTHER,
            "title": "No Clear Catalyst Detected",
            "description": (
                f"Comprehensive examination of filings, news, corporate actions, and volume patterns "
                f"identified no single dominant catalyst for the {stock_return:+.2%} move on {actual_trade_date}. "
                "Movement appears driven by routine secondary market liquidity and order flow."
            ),
            "confidence": ConfidenceLevel.LOW,
            "impact_level": ImpactLevel.LOW,
            "rank": 1,
        })

    # 12. Confidence Determination
    supporting_count = sum(1 for e in all_evidence_specs if e["alignment"] == EvidenceAlignment.SUPPORTING)
    contradictory_count = sum(1 for e in all_evidence_specs if e["alignment"] == EvidenceAlignment.CONTRADICTORY)

    if candidate_drivers[0]["title"] == "No Clear Catalyst Detected":
        overall_confidence = ConfidenceLevel.LOW
    elif has_ca_evidence or (has_news_evidence and has_volume_evidence):
        overall_confidence = ConfidenceLevel.HIGH
    elif supporting_count > contradictory_count:
        overall_confidence = ConfidenceLevel.MEDIUM
    else:
        overall_confidence = ConfidenceLevel.LOW

    # 13. Summary String
    driver_titles = ", ".join(d["title"] for d in candidate_drivers[:3])
    summary = (
        f"On {actual_trade_date}, {ticker} closed at IDR {close_price:,.0f} ({stock_return:+.2%}) "
        f"with volume of {volume:,.0f} ({volume_ratio:.2f}x 20-day average). "
        f"Primary identified driver(s): {driver_titles}. "
        f"Aggregated {supporting_count} supporting, {contradictory_count} contradictory, and "
        f"{len(all_evidence_specs) - supporting_count - contradictory_count} neutral evidence item(s). "
        f"Overall assessment confidence: {overall_confidence.value.upper()}."
    )

    question = request.question or f"What drove {ticker} stock movement on {actual_trade_date}?"

    # 14. Persistence to Database (Atomic Transaction)
    try:
        investigation = Investigation(
            user_id=user_id,
            company_ticker=ticker,
            index_code=index_code,
            investigation_type=InvestigationType.COMPANY,
            question=question,
            target_date=actual_trade_date,
            status=InvestigationStatus.COMPLETED,
            summary=summary,
            overall_confidence=overall_confidence,
            completed_at=utc_now(),
        )
        db.add(investigation)
        await db.flush()

        driver_models: list[InvestigationDriver] = []
        driver_map: dict[str, InvestigationDriver] = {}

        for cd in candidate_drivers:
            d_model = InvestigationDriver(
                investigation_id=investigation.id,
                driver_type=cd["driver_type"],
                title=cd["title"],
                description=cd["description"],
                confidence=cd["confidence"],
                impact_level=cd["impact_level"],
                rank=cd["rank"],
            )
            db.add(d_model)
            driver_models.append(d_model)
            driver_map[cd["key"]] = d_model

        await db.flush()

        evidence_models: list[EvidenceItem] = []
        for es in all_evidence_specs:
            d_key = es.get("driver_key")
            assigned_driver = driver_map.get(d_key) if d_key else (driver_models[0] if candidate_drivers[0]["key"] == "no_clear_catalyst" else None)
            e_model = EvidenceItem(
                investigation_id=investigation.id,
                driver_id=assigned_driver.id if assigned_driver else None,
                evidence_type=es["evidence_type"],
                title=es["title"],
                description=es["description"],
                data=es["data"],
                source_type=es["source_type"],
                source_reference=es.get("source_reference"),
                alignment=es.get("alignment"),
                observed_at=es.get("observed_at"),
            )
            db.add(e_model)
            evidence_models.append(e_model)

        await db.commit()

        # Re-fetch with relationships loaded cleanly
        query = (
            select(Investigation)
            .options(
                selectinload(Investigation.drivers),
                selectinload(Investigation.evidence_items),
            )
            .where(Investigation.id == investigation.id)
        )
        saved_investigation = (await db.execute(query)).scalar_one()

        drivers_read = [
            InvestigationDriverRead.model_validate(d)
            for d in sorted(saved_investigation.drivers, key=lambda x: x.rank)
        ]
        evidence_read = [
            EvidenceItemRead.model_validate(e)
            for e in saved_investigation.evidence_items
        ]

        investigation_read = InvestigationRead.model_validate(saved_investigation)
        return InvestigationDetailRead(
            **investigation_read.model_dump(),
            drivers=drivers_read,
            evidence_items=evidence_read,
        )

    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc
