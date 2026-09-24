"""Handler for Agent Chat conversational endpoints and user conversation history."""

import json
import logging
from uuid import UUID

from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import StreamingResponse

from app.helpers.responses import list_response, success_response
from app.helpers.schemas import (
    AgentChatRequest,
    ConversationRead,
    MessageRead,
    PaginationParams,
)
from app.models.user import User
from app.services import agent_chat_service

logger = logging.getLogger("ignite_stock.agent_chat")


async def chat(
    db: AsyncSession,
    request: AgentChatRequest,
    current_user: User | None = None,
) -> JSONResponse | StreamingResponse:
    """Coordinate Agent Chat execution with conversation persistence (JSON or SSE stream)."""
    user_id = current_user.id if current_user else None

    if request.stream:
        async def event_generator():
            try:
                async for event in agent_chat_service.run_chat_stream(db, user_id, request):
                    event_type = event.get("event", "message")
                    payload = json.dumps(event.get("data", {}), default=str)
                    yield f"event: {event_type}\ndata: {payload}\n\n"
            except Exception as exc:
                logger.exception("Error in chat SSE stream: %s", exc)
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

    result = await agent_chat_service.run_chat(db=db, user_id=user_id, request=request)
    return success_response("chat response generated", "chat", result, 200)


async def list_conversations(
    db: AsyncSession,
    current_user: User,
    pagination: PaginationParams,
    investigation_id: UUID | None = None,
) -> JSONResponse:
    """Retrieve paginated conversations belonging to current_user."""
    items, total = await agent_chat_service.list_user_conversations(
        db,
        current_user.id,
        pagination.limit,
        pagination.offset,
        investigation_id,
    )
    data = [ConversationRead.model_validate(item) for item in items]
    return list_response(
        "conversations retrieved",
        "conversations",
        data,
        total,
        pagination.limit,
        pagination.offset,
    )


async def get_conversation(
    db: AsyncSession,
    current_user: User,
    conversation_id: UUID,
) -> JSONResponse:
    """Retrieve a single conversation ensuring current_user ownership."""
    item = await agent_chat_service.get_user_conversation(db, current_user.id, conversation_id)
    data = ConversationRead.model_validate(item)
    return success_response("conversation retrieved", "conversation", data)


async def get_conversation_messages(
    db: AsyncSession,
    current_user: User,
    conversation_id: UUID,
    pagination: PaginationParams,
) -> JSONResponse:
    """Retrieve paginated messages for a conversation ensuring current_user ownership."""
    items, total = await agent_chat_service.get_conversation_messages(
        db,
        current_user.id,
        conversation_id,
        pagination.limit,
        pagination.offset,
    )
    data = [MessageRead.model_validate(item) for item in items]
    return list_response(
        "messages retrieved",
        "messages",
        data,
        total,
        pagination.limit,
        pagination.offset,
    )
