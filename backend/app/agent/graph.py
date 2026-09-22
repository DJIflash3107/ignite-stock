"""LangGraph workflow assembly and execution entry points for the AI Investigation Agent."""

import asyncio
from collections.abc import AsyncGenerator
from datetime import date
import json
import logging
from typing import Any
from uuid import UUID

from langgraph.graph import END, START, StateGraph
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.agent.nodes import (
    detect_intent,
    execute_tools,
    generate_response,
    plan_investigation,
    process_evidence,
)
from app.agent.state import InvestigationState
from app.helpers.exceptions import DatabaseError, NotFoundError
from app.helpers.schemas import (
    AgentInvestigateRequest,
    AgentInvestigateResponse,
    AgentToolCallRead,
    EvidenceItemRead,
    InvestigationDetailRead,
    InvestigationDriverRead,
    InvestigationRead,
)
from app.models.agent_tool_call import AgentToolCall
from app.models.base import utc_now
from app.models.conversation import Conversation
from app.models.enums import (
    ConfidenceLevel,
    DriverType,
    EvidenceAlignment,
    EvidenceType,
    ImpactLevel,
    InvestigationStatus,
    InvestigationType,
    MessageRole,
)
from app.models.evidence_item import EvidenceItem
from app.models.investigation import Investigation
from app.models.investigation_driver import InvestigationDriver
from app.models.message import Message

logger = logging.getLogger("ignite_stock.agent")


def build_investigation_graph():
    """Construct and compile the state graph workflow."""
    workflow = StateGraph(InvestigationState)

    workflow.add_node("detect_intent", detect_intent)
    workflow.add_node("plan_investigation", plan_investigation)
    workflow.add_node("execute_tools", execute_tools)
    workflow.add_node("process_evidence", process_evidence)
    workflow.add_node("generate_response", generate_response)

    workflow.add_edge(START, "detect_intent")
    workflow.add_edge("detect_intent", "plan_investigation")
    workflow.add_edge("plan_investigation", "execute_tools")
    workflow.add_edge("execute_tools", "process_evidence")
    workflow.add_edge("process_evidence", "generate_response")
    workflow.add_edge("generate_response", END)

    return workflow.compile()


investigation_graph = build_investigation_graph()


async def _load_conversation_context(
    db: AsyncSession,
    conversation_id: UUID | None,
) -> list[dict[str, str]]:
    """Retrieve preceding messages from the conversation for contextual grounding."""
    if not conversation_id:
        return []

    try:
        query = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .limit(20)
        )
        items = (await db.execute(query)).scalars().all()
        return [{"role": m.role, "content": m.content} for m in items]
    except SQLAlchemyError as exc:
        logger.warning("Failed to fetch conversation history: %s", exc)
        return []


async def _persist_investigation(
    db: AsyncSession,
    state: InvestigationState,
    user_id: UUID | None,
    conversation_id: UUID | None,
) -> AgentInvestigateResponse:
    """Atomically persist Investigation, Drivers, EvidenceItems, AgentToolCalls, and Messages."""
    intent = state.get("intent", {})
    ticker = intent.get("company_ticker")
    index_code = intent.get("index_code") or "IHSG"
    question = state.get("question", "")
    target_date_str = intent.get("target_date")
    target_date = date.fromisoformat(target_date_str) if target_date_str else date.today()
    summary = state.get("summary")
    confidence_str = state.get("overall_confidence", "medium").lower()

    try:
        overall_confidence = ConfidenceLevel(confidence_str)
    except ValueError:
        overall_confidence = ConfidenceLevel.MEDIUM

    try:
        # 1. Ensure conversation exists if ID is provided
        if conversation_id:
            conv = await db.get(Conversation, conversation_id)
            if not conv:
                conv = Conversation(
                    id=conversation_id,
                    user_id=user_id,
                    title=question[:80],
                )
                db.add(conv)
                await db.flush()

        # 2. Create Investigation record
        investigation = Investigation(
            user_id=user_id,
            company_ticker=ticker,
            index_code=index_code,
            investigation_type=InvestigationType.COMPANY if ticker else InvestigationType.MARKET,
            question=question,
            target_date=target_date,
            status=InvestigationStatus.COMPLETED,
            summary=summary,
            overall_confidence=overall_confidence,
            completed_at=utc_now(),
        )
        db.add(investigation)
        await db.flush()

        # 3. Create Drivers
        driver_map: dict[str, InvestigationDriver] = {}
        candidate_drivers = state.get("drivers", [])
        driver_models: list[InvestigationDriver] = []

        for cd in candidate_drivers:
            d_type = cd.get("driver_type")
            if isinstance(d_type, str):
                try:
                    d_type = DriverType(d_type)
                except ValueError:
                    d_type = DriverType.NO_CLEAR_CATALYST

            conf = cd.get("confidence")
            if isinstance(conf, str):
                try:
                    conf = ConfidenceLevel(conf)
                except ValueError:
                    conf = ConfidenceLevel.MEDIUM

            impact = cd.get("impact_level")
            if isinstance(impact, str):
                try:
                    impact = ImpactLevel(impact)
                except ValueError:
                    impact = ImpactLevel.MEDIUM

            driver_model = InvestigationDriver(
                investigation_id=investigation.id,
                driver_type=d_type,
                title=cd.get("title", "Market Driver"),
                description=cd.get("description", ""),
                confidence=conf,
                impact_level=impact,
                rank=cd.get("rank", 1),
            )
            db.add(driver_model)
            driver_models.append(driver_model)
            driver_map[cd.get("key", "")] = driver_model

        await db.flush()

        # 4. Create Evidence Items
        evidence_specs = state.get("evidence_items", [])
        for es in evidence_specs:
            d_key = es.get("driver_key")
            assigned_driver = driver_map.get(d_key) if d_key else (driver_models[0] if driver_models else None)

            ev_type = es.get("evidence_type")
            if isinstance(ev_type, str):
                try:
                    ev_type = EvidenceType(ev_type)
                except ValueError:
                    ev_type = EvidenceType.OTHER

            align = es.get("alignment")
            if isinstance(align, str):
                try:
                    align = EvidenceAlignment(align)
                except ValueError:
                    align = EvidenceAlignment.NEUTRAL

            evidence_model = EvidenceItem(
                investigation_id=investigation.id,
                driver_id=assigned_driver.id if assigned_driver else None,
                evidence_type=ev_type,
                title=es.get("title", "Evidence"),
                description=es.get("description", ""),
                data=es.get("data", {}),
                source_type=es.get("source_type", "sectors_api"),
                source_reference=es.get("source_reference"),
                alignment=align,
                observed_at=utc_now(),
            )
            db.add(evidence_model)

        # 5. Persist AgentToolCalls
        tool_records = state.get("tool_call_records", [])
        tool_call_models: list[AgentToolCall] = []
        for tr in tool_records:
            tc = AgentToolCall(
                conversation_id=conversation_id,
                investigation_id=investigation.id,
                tool_name=tr.get("tool_name", "unknown"),
                arguments=tr.get("arguments", {}),
                result=tr.get("result", {}),
                status=tr.get("status", "completed"),
                execution_time_ms=tr.get("execution_time_ms"),
            )
            db.add(tc)
            tool_call_models.append(tc)

        # 6. Save Messages if conversation is active
        if conversation_id:
            user_msg = Message(
                conversation_id=conversation_id,
                role=MessageRole.USER.value,
                content=question,
                meta_data={"investigation_id": str(investigation.id)},
            )
            agent_msg = Message(
                conversation_id=conversation_id,
                role=MessageRole.ASSISTANT.value,
                content=summary or "Investigation completed.",
                meta_data={
                    "investigation_id": str(investigation.id),
                    "confidence": overall_confidence.value,
                    "ticker": ticker,
                },
            )
            db.add(user_msg)
            db.add(agent_msg)

        await db.commit()

        # 7. Reload with relationships
        query = (
            select(Investigation)
            .options(
                selectinload(Investigation.drivers),
                selectinload(Investigation.evidence_items),
                selectinload(Investigation.tool_calls),
            )
            .where(Investigation.id == investigation.id)
        )
        saved = (await db.execute(query)).scalar_one()

        drivers_read = [
            InvestigationDriverRead.model_validate(d)
            for d in sorted(saved.drivers, key=lambda x: x.rank)
        ]
        evidence_read = [
            EvidenceItemRead.model_validate(e)
            for e in saved.evidence_items
        ]
        tool_calls_read = [
            AgentToolCallRead.model_validate(tc)
            for tc in saved.tool_calls
        ]
        investigation_read = InvestigationRead.model_validate(saved)

        return AgentInvestigateResponse(
            **investigation_read.model_dump(),
            drivers=drivers_read,
            evidence_items=evidence_read,
            agent_tool_calls=tool_calls_read,
            conversation_id=conversation_id,
        )

    except SQLAlchemyError as exc:
        await db.rollback()
        logger.exception("Failed to persist investigation details: %s", exc)
        raise DatabaseError("Failed to store investigation findings") from exc


async def run_agent(
    db: AsyncSession,
    request: AgentInvestigateRequest,
    user_id: UUID | None = None,
) -> AgentInvestigateResponse:
    """Execute the full investigation agent workflow synchronously and return the result."""
    history = await _load_conversation_context(db, request.conversation_id)

    initial_state: InvestigationState = {
        "question": request.question,
        "user_id": str(user_id) if user_id else None,
        "conversation_id": str(request.conversation_id) if request.conversation_id else None,
        "company_ticker": request.company_ticker,
        "target_date": request.target_date.isoformat() if request.target_date else None,
        "index_code": request.index_code,
        "conversation_history": history,
        "tool_results": {},
        "tool_call_records": [],
        "evidence_items": [],
        "drivers": [],
        "errors": [],
    }

    final_state = await investigation_graph.ainvoke(initial_state)
    return await _persist_investigation(db, final_state, user_id, request.conversation_id)


async def run_agent_stream(
    db: AsyncSession,
    request: AgentInvestigateRequest,
    user_id: UUID | None = None,
) -> AsyncGenerator[dict[str, Any], None]:
    """Execute the investigation workflow step-by-step, streaming intermediate SSE events."""
    history = await _load_conversation_context(db, request.conversation_id)

    state: InvestigationState = {
        "question": request.question,
        "user_id": str(user_id) if user_id else None,
        "conversation_id": str(request.conversation_id) if request.conversation_id else None,
        "company_ticker": request.company_ticker,
        "target_date": request.target_date.isoformat() if request.target_date else None,
        "index_code": request.index_code,
        "conversation_history": history,
        "tool_results": {},
        "tool_call_records": [],
        "evidence_items": [],
        "drivers": [],
        "errors": [],
    }

    yield {
        "event": "start",
        "data": {
            "status": "started",
            "question": request.question,
            "conversation_id": str(request.conversation_id) if request.conversation_id else None,
        },
    }

    # Step 1: Detect intent
    intent_output = await detect_intent(state)
    state.update(intent_output)
    yield {
        "event": "intent_detected",
        "data": {
            "node": "detect_intent",
            "intent": state.get("intent"),
        },
    }

    # Step 2: Plan investigation
    plan_output = await plan_investigation(state)
    state.update(plan_output)
    yield {
        "event": "plan_created",
        "data": {
            "node": "plan_investigation",
            "plan": state.get("plan"),
        },
    }

    # Step 3: Execute tools with per-tool notifications
    plan = state.get("plan", [])
    for tool_spec in plan:
        yield {
            "event": "tool_started",
            "data": {
                "tool_name": tool_spec["tool_name"],
                "arguments": tool_spec.get("arguments", {}),
                "rationale": tool_spec.get("rationale", ""),
            },
        }

    tools_output = await execute_tools(state)
    state.update(tools_output)

    for record in state.get("tool_call_records", []):
        yield {
            "event": "tool_completed",
            "data": {
                "tool_name": record.get("tool_name"),
                "status": record.get("status"),
                "execution_time_ms": record.get("execution_time_ms"),
            },
        }

    # Step 4: Process evidence
    evidence_output = await process_evidence(state)
    state.update(evidence_output)
    yield {
        "event": "evidence_processed",
        "data": {
            "node": "process_evidence",
            "drivers_count": len(state.get("drivers", [])),
            "evidence_count": len(state.get("evidence_items", [])),
            "overall_confidence": state.get("overall_confidence"),
            "drivers": state.get("drivers"),
        },
    }

    # Step 5: Generate response
    response_output = await generate_response(state)
    state.update(response_output)
    yield {
        "event": "response_generated",
        "data": {
            "node": "generate_response",
            "summary": state.get("summary"),
        },
    }

    # Step 6: Persist
    persisted = await _persist_investigation(db, state, user_id, request.conversation_id)
    yield {
        "event": "completed",
        "data": {
            "investigation": persisted.model_dump(mode="json"),
        },
    }
