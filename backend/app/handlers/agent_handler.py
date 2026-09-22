"""Agent handler for processing AI-driven stock investigations."""

import json
import logging
from typing import Any

from fastapi.responses import JSONResponse
from starlette.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.graph import run_agent, run_agent_stream
from app.helpers.responses import success_response
from app.helpers.schemas import AgentInvestigateRequest
from app.models.user import User

logger = logging.getLogger("ignite_stock.agent")


async def investigate(
    db: AsyncSession,
    request: AgentInvestigateRequest,
    current_user: User | None = None,
) -> JSONResponse | StreamingResponse:
    """Coordinate AI Investigation Agent execution (either one-shot or SSE streaming)."""
    user_id = current_user.id if current_user else None

    if request.stream:
        async def event_generator():
            try:
                async for event in run_agent_stream(db, request, user_id):
                    event_type = event.get("event", "message")
                    payload = json.dumps(event.get("data", {}), default=str)
                    yield f"event: {event_type}\ndata: {payload}\n\n"
            except Exception as exc:
                logger.exception("Error in investigation SSE stream: %s", exc)
                error_payload = json.dumps({"error": str(exc), "status": "failed"})
                yield f"event: error\ndata: {error_payload}\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    result = await run_agent(db=db, request=request, user_id=user_id)
    return success_response("investigation completed", "investigation", result, 201)
