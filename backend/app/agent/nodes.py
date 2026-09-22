"""Graph node implementations for the AI Investigation Agent."""

import asyncio
from datetime import date, datetime
import json
import logging
import re
from typing import Any

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from app.agent.prompts import (
    INTENT_DETECTION_SYSTEM_PROMPT,
    INVESTIGATION_PLANNING_SYSTEM_PROMPT,
    RESPONSE_GENERATION_SYSTEM_PROMPT,
)
from app.agent.state import InvestigationState
from app.agent.tools import AVAILABLE_TOOLS, execute_tool_safely
from app.configs.settings import get_settings
from app.helpers.exceptions import AgentConfigurationError
from app.models.enums import (
    ConfidenceLevel,
    DriverType,
    EvidenceAlignment,
    EvidenceType,
    ImpactLevel,
)

logger = logging.getLogger("ignite_stock.agent")


def _get_llm(temperature: float | None = None) -> ChatOpenAI:
    settings = get_settings()
    api_key = settings.openai_api_key
    if not api_key:
        raise AgentConfigurationError("OPENAI_API_KEY is not configured in environment")
    kwargs: dict[str, Any] = {
        "model": settings.agent_llm_model,
        "temperature": temperature if temperature is not None else settings.agent_llm_temperature,
        "api_key": api_key,
    }
    if settings.openai_base_url:
        kwargs["base_url"] = settings.openai_base_url
    return ChatOpenAI(**kwargs)


def _extract_json(text: str) -> dict[str, Any]:
    """Parse JSON from model output, handling optional markdown code fences."""
    cleaned = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    if match:
        cleaned = match.group(1).strip()
    return json.loads(cleaned)


async def detect_intent(state: InvestigationState) -> dict[str, Any]:
    """Analyze the user's question and conversation history to determine structured intent."""
    question = state.get("question", "")
    history = state.get("conversation_history", [])
    explicit_ticker = state.get("company_ticker")
    explicit_date = state.get("target_date")
    index_code = state.get("index_code", "IHSG")

    history_text = ""
    if history:
        history_text = "\nConversation History:\n" + "\n".join(
            f"- {msg.get('role', 'user').upper()}: {msg.get('content', '')}"
            for msg in history
        )

    prompt = (
        f"User Inquiry: {question}\n"
        f"Explicit Ticker: {explicit_ticker or 'Not provided'}\n"
        f"Explicit Date: {explicit_date or 'Not provided'}\n"
        f"Benchmark Index: {index_code}\n"
        f"{history_text}\n\n"
        "Extract the structured intent JSON."
    )

    try:
        llm = _get_llm(temperature=0.0)
        messages = [
            SystemMessage(content=INTENT_DETECTION_SYSTEM_PROMPT),
            HumanMessage(content=prompt),
        ]
        response = await llm.ainvoke(messages)
        intent = _extract_json(response.content if isinstance(response, AIMessage) else str(response))
    except Exception as exc:
        logger.warning("Intent detection LLM invocation failed: %s. Using heuristic fallback.", exc)
        # Fallback heuristic
        ticker_match = re.search(r"\b([A-Z]{4})\b", question)
        detected_ticker = explicit_ticker or (ticker_match.group(1) if ticker_match else None)
        intent = {
            "company_ticker": detected_ticker,
            "target_date": explicit_date or date.today().isoformat(),
            "index_code": index_code,
            "investigation_type": "company" if detected_ticker else "market",
            "focus_areas": ["price_action", "market_context", "sector_peers", "news"],
            "rationale": "Heuristic fallback intent extraction",
        }

    # Ensure explicit inputs override LLM if provided
    if explicit_ticker:
        intent["company_ticker"] = explicit_ticker
    if explicit_date:
        intent["target_date"] = explicit_date
    if not intent.get("target_date"):
        intent["target_date"] = date.today().isoformat()
    if not intent.get("index_code"):
        intent["index_code"] = index_code

    return {"intent": intent}


async def plan_investigation(state: InvestigationState) -> dict[str, Any]:
    """Dynamically select required tools based on intent and question."""
    intent = state.get("intent", {})
    ticker = intent.get("company_ticker")
    target_date = intent.get("target_date") or date.today().isoformat()
    index_code = intent.get("index_code") or "IHSG"
    question = state.get("question", "")

    prompt = (
        f"User Question: {question}\n"
        f"Detected Intent: {json.dumps(intent)}\n\n"
        "Select the appropriate tools and parameters to investigate."
    )

    plan: list[dict[str, Any]] = []

    try:
        llm = _get_llm(temperature=0.0)
        messages = [
            SystemMessage(content=INVESTIGATION_PLANNING_SYSTEM_PROMPT),
            HumanMessage(content=prompt),
        ]
        response = await llm.ainvoke(messages)
        parsed = _extract_json(response.content if isinstance(response, AIMessage) else str(response))
        candidate_tools = parsed.get("tools", [])
        for tool in candidate_tools:
            name = tool.get("tool_name")
            args = tool.get("arguments", {})
            if name in AVAILABLE_TOOLS:
                # Sanitize arguments
                if "symbol" in args and not args["symbol"] and ticker:
                    args["symbol"] = ticker
                if "target_date" in args and not args["target_date"]:
                    args["target_date"] = target_date
                plan.append({
                    "tool_name": name,
                    "arguments": args,
                    "rationale": tool.get("rationale", ""),
                })
    except Exception as exc:
        logger.warning("Investigation planning LLM invocation failed: %s. Using default plan.", exc)

    # Fallback to standard comprehensive plan if LLM failed or generated empty plan
    if not plan and ticker:
        plan = [
            {
                "tool_name": "get_stock_movement",
                "arguments": {"symbol": ticker, "target_date": target_date},
                "rationale": "Analyze price action and volume profile",
            },
            {
                "tool_name": "get_market_context",
                "arguments": {"target_date": target_date, "index_code": index_code},
                "rationale": "Assess benchmark market alignment",
            },
            {
                "tool_name": "get_sector_context",
                "arguments": {"symbol": ticker},
                "rationale": "Assess sector performance alignment",
            },
            {
                "tool_name": "get_peer_movements",
                "arguments": {"symbol": ticker, "target_date": target_date, "limit": 5},
                "rationale": "Compare against peer cohort",
            },
            {
                "tool_name": "get_company_news",
                "arguments": {"symbol": ticker, "limit": 10},
                "rationale": "Identify recent news catalysts",
            },
            {
                "tool_name": "get_company_filings",
                "arguments": {"symbol": ticker, "limit": 10},
                "rationale": "Identify regulatory disclosure catalysts",
            },
        ]
    elif not plan and not ticker:
        plan = [
            {
                "tool_name": "get_market_context",
                "arguments": {"target_date": target_date, "index_code": index_code},
                "rationale": "Assess overall market performance",
            },
        ]

    return {"plan": plan}


async def execute_tools(state: InvestigationState) -> dict[str, Any]:
    """Execute planned tools concurrently, capturing execution time and recording results."""
    plan = state.get("plan", [])
    tool_results: dict[str, Any] = {}
    tool_call_records: list[dict[str, Any]] = []

    # If get_stock_movement is in the plan, run it first to get stock_return for dependent tools
    stock_tool = next((t for t in plan if t["tool_name"] == "get_stock_movement"), None)
    other_tools = [t for t in plan if t["tool_name"] != "get_stock_movement"]

    stock_return: float | None = None
    if stock_tool:
        status, result, duration_ms = await execute_tool_safely(
            stock_tool["tool_name"], stock_tool["arguments"]
        )
        tool_results[stock_tool["tool_name"]] = result
        tool_call_records.append({
            "tool_name": stock_tool["tool_name"],
            "arguments": stock_tool["arguments"],
            "result": result,
            "status": status,
            "execution_time_ms": duration_ms,
        })
        if status == "completed" and "stock_return" in result:
            stock_return = result["stock_return"]

    # Inject stock_return into context tools if applicable
    for t in other_tools:
        name = t["tool_name"]
        args = t["arguments"]
        if name in ("get_market_context", "get_sector_context", "get_peer_movements") and stock_return is not None:
            if "stock_return" not in args:
                args["stock_return"] = stock_return

    # Run remaining tools concurrently
    tasks = [
        execute_tool_safely(t["tool_name"], t["arguments"])
        for t in other_tools
    ]
    results = await asyncio.gather(*tasks)

    for tool_spec, (status, result, duration_ms) in zip(other_tools, results):
        tool_results[tool_spec["tool_name"]] = result
        tool_call_records.append({
            "tool_name": tool_spec["tool_name"],
            "arguments": tool_spec["arguments"],
            "result": result,
            "status": status,
            "execution_time_ms": duration_ms,
        })

    return {
        "tool_results": tool_results,
        "tool_call_records": tool_call_records,
    }


async def process_evidence(state: InvestigationState) -> dict[str, Any]:
    """Process raw tool results into structured EvidenceItem and InvestigationDriver specs.

    Uses deterministic classification and alignment algorithms with zero LLM hallucination.
    """
    tool_results = state.get("tool_results", {})
    intent = state.get("intent", {})
    ticker = intent.get("company_ticker") or "STOCK"

    evidence_items: list[dict[str, Any]] = []
    candidate_drivers: list[dict[str, Any]] = []

    # 1. Stock Price & Volume Evidence
    stock_res = tool_results.get("get_stock_movement", {})
    stock_return = stock_res.get("stock_return", 0.0)
    volume_ratio = stock_res.get("volume_ratio", 1.0)
    direction = stock_res.get("direction", "flat")
    close_price = stock_res.get("close_price")
    actual_trade_date = stock_res.get("actual_trade_date")

    if stock_res and "stock_return" in stock_res:
        vol_desc = "unusual volume spike" if volume_ratio >= 1.5 else ("subdued volume" if volume_ratio < 0.8 else "normal volume")
        evidence_items.append({
            "evidence_type": EvidenceType.PRICE,
            "title": f"{ticker} Daily Price Action & Volume",
            "description": (
                f"{ticker} moved {stock_res.get('return_pct')} to IDR {close_price:,.0f} "
                f"with {volume_ratio:.2f}x its 20-day average volume ({vol_desc})."
            ) if close_price else f"{ticker} moved {stock_res.get('return_pct')}.",
            "data": stock_res,
            "source_type": "sectors_api_stock_daily",
            "source_reference": f"/stocks/{ticker}/daily",
            "alignment": EvidenceAlignment.NEUTRAL,
            "driver_key": "volume_anomaly" if volume_ratio >= 1.5 else None,
        })

        if volume_ratio >= 1.5:
            candidate_drivers.append({
                "key": "volume_anomaly",
                "driver_type": DriverType.VOLUME,
                "title": f"Abnormal Trading Volume ({volume_ratio:.2f}x 20-Day Average)",
                "description": f"Trading volume spiked significantly to {volume_ratio:.2f} times the 20-day baseline, indicating institutional repositioning or elevated liquidity participation.",
                "confidence": ConfidenceLevel.HIGH if volume_ratio >= 2.5 else ConfidenceLevel.MEDIUM,
                "impact_level": ImpactLevel.HIGH if volume_ratio >= 2.5 else ImpactLevel.MEDIUM,
                "rank": 2,
            })

    # 2. Market Context Evidence
    market_res = tool_results.get("get_market_context", {})
    if market_res and "index_return" in market_res:
        idx_ret_pct = market_res.get("index_return_pct", "0.00%")
        alignment = EvidenceAlignment(market_res.get("alignment", EvidenceAlignment.NEUTRAL.value))
        idx_code = market_res.get("index_code", "IHSG")

        evidence_items.append({
            "evidence_type": EvidenceType.MARKET,
            "title": f"Benchmark Index Context ({idx_code})",
            "description": f"The benchmark index {idx_code} closed at {idx_ret_pct}. The stock's movement alignment with broader market was classified as {alignment.value}.",
            "data": market_res,
            "source_type": "sectors_api_index_daily",
            "source_reference": f"/indices/{idx_code}/daily",
            "alignment": alignment,
            "driver_key": "market_trend" if alignment == EvidenceAlignment.SUPPORTING else None,
        })

        if alignment == EvidenceAlignment.SUPPORTING and abs(market_res.get("index_return", 0.0)) >= 0.005:
            candidate_drivers.append({
                "key": "market_trend",
                "driver_type": DriverType.MARKET,
                "title": f"Broad Market Momentum ({idx_code} {idx_ret_pct})",
                "description": f"Stock movement aligned strongly with general market direction as {idx_code} moved {idx_ret_pct}.",
                "confidence": ConfidenceLevel.MEDIUM,
                "impact_level": ImpactLevel.MEDIUM,
                "rank": 3,
            })

    # 3. Sector Context Evidence
    sector_res = tool_results.get("get_sector_context", {})
    if sector_res and "sub_sector" in sector_res:
        sec_name = sector_res.get("sub_sector")
        alignment = EvidenceAlignment(sector_res.get("alignment", EvidenceAlignment.NEUTRAL.value))
        c1d = sector_res.get("mcap_change_1d")
        c1d_str = f"{c1d * 100:+.2f}%" if c1d is not None else "N/A"

        evidence_items.append({
            "evidence_type": EvidenceType.OTHER,
            "title": f"Subsector Context ({sec_name})",
            "description": f"Subsector {sec_name} market cap changed by {c1d_str} (alignment: {alignment.value}).",
            "data": sector_res,
            "source_type": "sectors_api_subsector_report",
            "source_reference": f"/subsectors/{sec_name}",
            "alignment": alignment,
            "driver_key": "sector_rotation" if alignment == EvidenceAlignment.SUPPORTING else None,
        })

        if alignment == EvidenceAlignment.SUPPORTING:
            candidate_drivers.append({
                "key": "sector_rotation",
                "driver_type": DriverType.SECTOR,
                "title": f"Subsector Momentum in {sec_name}",
                "description": f"Subsector {sec_name} exhibited synchronized market cap changes ({c1d_str}) consistent with the stock's direction.",
                "confidence": ConfidenceLevel.MEDIUM,
                "impact_level": ImpactLevel.MEDIUM,
                "rank": 4,
            })

    # 4. Peer Movements Evidence
    peer_res = tool_results.get("get_peer_movements", {})
    if peer_res and peer_res.get("peer_returns"):
        alignment = EvidenceAlignment(peer_res.get("alignment", EvidenceAlignment.NEUTRAL.value))
        peer_list = peer_res.get("peer_returns", [])
        peer_summary = ", ".join(f"{p['symbol']} ({p['return_pct']})" for p in peer_list[:3])

        evidence_items.append({
            "evidence_type": EvidenceType.OTHER,
            "title": f"Peer Cohort Performance",
            "description": f"Key peers moved: {peer_summary}. Overall cohort alignment was {alignment.value}.",
            "data": peer_res,
            "source_type": "sectors_api_company_peers",
            "source_reference": f"/companies/{ticker}/peers",
            "alignment": alignment,
            "driver_key": None,
        })

    # 5. News Articles Evidence
    news_res = tool_results.get("get_company_news", {})
    articles = news_res.get("articles", []) if news_res else []
    for idx, art in enumerate(articles[:5]):
        evidence_items.append({
            "evidence_type": EvidenceType.NEWS,
            "title": art.get("title", f"{ticker} News"),
            "description": f"Verified news disclosure published on {art.get('publish_date')}.",
            "data": art,
            "source_type": "sectors_api_company_news",
            "source_reference": art.get("url"),
            "alignment": EvidenceAlignment.SUPPORTING if direction != "flat" else EvidenceAlignment.NEUTRAL,
            "driver_key": "news_catalyst" if idx == 0 else None,
        })

    if articles:
        top_art = articles[0]
        candidate_drivers.append({
            "key": "news_catalyst",
            "driver_type": DriverType.NEWS,
            "title": f"News Catalyst: {top_art.get('title', 'Corporate News')[:80]}",
            "description": f"Recent media and market reporting around {ticker} may have driven investor sentiment.",
            "confidence": ConfidenceLevel.MEDIUM,
            "impact_level": ImpactLevel.MEDIUM,
            "rank": 1,
        })

    # 6. Company Filings Evidence
    filings_res = tool_results.get("get_company_filings", {})
    filings = filings_res.get("filings", []) if filings_res else []
    for idx, fl in enumerate(filings[:3]):
        evidence_items.append({
            "evidence_type": EvidenceType.FILING,
            "title": fl.get("title", f"{ticker} Regulatory Filing"),
            "description": f"Regulatory filing of type '{fl.get('filing_type')}' submitted on {fl.get('filing_date')}.",
            "data": fl,
            "source_type": "sectors_api_company_filings",
            "source_reference": fl.get("url"),
            "alignment": EvidenceAlignment.NEUTRAL,
            "driver_key": "corporate_action" if idx == 0 and "dividen" in fl.get("title", "").lower() else None,
        })

    # 7. Financials & Valuation Evidence
    fin_res = tool_results.get("get_company_financials", {})
    if fin_res and fin_res.get("valuation"):
        evidence_items.append({
            "evidence_type": EvidenceType.FINANCIAL,
            "title": f"{ticker} Valuation Multiples & Fundamentals",
            "description": f"Valuation overview: {json.dumps(fin_res.get('valuation', {}))}",
            "data": fin_res,
            "source_type": "sectors_api_company_report",
            "source_reference": f"/companies/{ticker}/report",
            "alignment": EvidenceAlignment.NEUTRAL,
            "driver_key": None,
        })

    # Fallback driver if no catalysts identified
    if not candidate_drivers:
        candidate_drivers.append({
            "key": "no_clear_catalyst",
            "driver_type": DriverType.OTHER,
            "title": "No Distinct External Catalyst Identified",
            "description": f"{ticker} movement occurred without specific corporate announcements, earnings reports, or regulatory filings.",
            "confidence": ConfidenceLevel.LOW,
            "impact_level": ImpactLevel.LOW,
            "rank": 1,
        })

    # Sort drivers by rank
    candidate_drivers.sort(key=lambda d: d.get("rank", 99))

    # Evaluate Overall Confidence
    supporting_count = sum(1 for e in evidence_items if e.get("alignment") == EvidenceAlignment.SUPPORTING)
    contradictory_count = sum(1 for e in evidence_items if e.get("alignment") == EvidenceAlignment.CONTRADICTORY)

    has_news_evidence = any(e.get("evidence_type") == EvidenceType.NEWS for e in evidence_items)
    has_volume_evidence = volume_ratio >= 1.5

    if candidate_drivers[0].get("key") == "no_clear_catalyst":
        overall_confidence = ConfidenceLevel.LOW.value
    elif (has_news_evidence and has_volume_evidence) or (supporting_count >= 2 and volume_ratio >= 1.5):
        overall_confidence = ConfidenceLevel.HIGH.value
    elif supporting_count > contradictory_count:
        overall_confidence = ConfidenceLevel.MEDIUM.value
    else:
        overall_confidence = ConfidenceLevel.LOW.value

    return {
        "evidence_items": evidence_items,
        "drivers": candidate_drivers,
        "overall_confidence": overall_confidence,
    }


async def generate_response(state: InvestigationState) -> dict[str, Any]:
    """Generate final narrative summary synthesized strictly from verified evidence."""
    intent = state.get("intent", {})
    ticker = intent.get("company_ticker") or "the analyzed asset"
    date_str = intent.get("target_date") or date.today().isoformat()
    question = state.get("question", "")
    evidence_items = state.get("evidence_items", [])
    drivers = state.get("drivers", [])
    confidence = state.get("overall_confidence", "medium")

    # Format structured evidence for LLM prompt
    evidence_text = "\n".join(
        f"- [{e.get('evidence_type', '').upper()} | {e.get('alignment', '')}] {e.get('title')}: {e.get('description')}"
        for e in evidence_items
    )
    drivers_text = "\n".join(
        f"- [Driver #{d.get('rank', 1)} | {d.get('impact_level', '').upper()}] {d.get('title')}: {d.get('description')}"
        for d in drivers
    )

    prompt = (
        f"Inquiry: {question}\n"
        f"Subject: {ticker}\n"
        f"Date: {date_str}\n"
        f"Overall Confidence Assessment: {confidence.upper()}\n\n"
        f"Identified Catalysts and Drivers:\n{drivers_text}\n\n"
        f"Verified Evidence Records:\n{evidence_text}\n\n"
        "Synthesize a professional equity research investigation report adhering strictly to the facts."
    )

    try:
        llm = _get_llm(temperature=0.2)
        messages = [
            SystemMessage(content=RESPONSE_GENERATION_SYSTEM_PROMPT),
            HumanMessage(content=prompt),
        ]
        response = await llm.ainvoke(messages)
        summary = response.content if isinstance(response, AIMessage) else str(response)
    except Exception as exc:
        logger.warning("Response generation LLM invocation failed: %s. Using deterministic summary.", exc)
        # Deterministic summary fallback
        driver_titles = ", ".join(d.get("title", "") for d in drivers[:2])
        summary = (
            f"Investigation for {ticker} on {date_str}: "
            f"Evaluated {len(evidence_items)} evidence item(s). "
            f"Primary identified catalyst(s): {driver_titles}. "
            f"Overall assessment confidence: {confidence.upper()}."
        )

    return {"summary": summary}
