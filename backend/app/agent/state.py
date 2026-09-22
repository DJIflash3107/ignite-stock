"""Agent state definition for LangGraph investigation workflow."""

from typing import Any, TypedDict


class InvestigationState(TypedDict, total=False):
    # Request inputs
    question: str
    user_id: str | None
    conversation_id: str | None
    company_ticker: str | None
    target_date: str | None
    index_code: str

    # Conversation history context
    conversation_history: list[dict[str, str]]

    # Step 1: Intent detection
    intent: dict[str, Any]

    # Step 2: Investigation planning
    plan: list[dict[str, Any]]

    # Step 3: Tool execution results & records
    tool_results: dict[str, Any]
    tool_call_records: list[dict[str, Any]]

    # Step 4: Evidence processing & driver synthesis
    evidence_items: list[dict[str, Any]]
    drivers: list[dict[str, Any]]
    overall_confidence: str

    # Step 5: Response generation
    summary: str

    # Execution tracking & persistence
    investigation_id: str | None
    errors: list[dict[str, Any]]
