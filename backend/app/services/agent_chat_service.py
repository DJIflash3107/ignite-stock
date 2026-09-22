"""Service layer for Agent Chat orchestration and conversation management."""

import logging
from typing import Any, AsyncGenerator
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.graph import run_agent, run_agent_stream
from app.helpers.exceptions import DatabaseError, NotFoundError
from app.helpers.schemas import (
    AgentChatRequest,
    AgentChatResponse,
    AgentInvestigateRequest,
)
from app.models.conversation import Conversation
from app.models.enums import MessageRole
from app.models.message import Message

logger = logging.getLogger("ignite_stock.agent_chat")


async def get_or_create_conversation(
    db: AsyncSession,
    user_id: UUID | None,
    conversation_id: UUID | None = None,
    initial_title: str | None = None,
) -> Conversation:
    """Retrieve an existing conversation verifying ownership, or create a new one."""
    if conversation_id:
        return await get_user_conversation(db, user_id, conversation_id)

    title = (initial_title or "New Conversation")[:80].strip()
    conv = Conversation(
        user_id=user_id,
        title=title,
    )
    db.add(conv)
    try:
        await db.commit()
        await db.refresh(conv)
        return conv
    except SQLAlchemyError as exc:
        await db.rollback()
        logger.exception("Failed to create conversation: %s", exc)
        raise DatabaseError("Failed to create conversation") from exc


async def list_user_conversations(
    db: AsyncSession,
    user_id: UUID | None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Conversation], int]:
    """Retrieve paginated conversations belonging to the specified user."""
    try:
        query = select(Conversation)
        count_query = select(func.count()).select_from(Conversation)
        if user_id is not None:
            query = query.where(Conversation.user_id == user_id)
            count_query = count_query.where(Conversation.user_id == user_id)
        query = query.order_by(Conversation.updated_at.desc()).limit(limit).offset(offset)
        items = (await db.execute(query)).scalars().all()
        total = (await db.execute(count_query)).scalar_one()
        return list(items), total
    except SQLAlchemyError as exc:
        logger.exception("Failed to list user conversations: %s", exc)
        raise DatabaseError("Failed to list conversations") from exc


async def get_user_conversation(
    db: AsyncSession,
    user_id: UUID | None,
    conversation_id: UUID,
) -> Conversation:
    """Fetch a single conversation owned by user_id. Raises NotFoundError if absent or unowned."""
    try:
        query = select(Conversation).where(Conversation.id == conversation_id)
        if user_id is not None:
            query = query.where(Conversation.user_id == user_id)
        conv = (await db.execute(query)).scalar_one_or_none()
    except SQLAlchemyError as exc:
        logger.exception("Failed to fetch conversation %s: %s", conversation_id, exc)
        raise DatabaseError("Failed to get conversation") from exc

    if conv is None:
        raise NotFoundError("conversation")
    return conv


async def get_conversation_messages(
    db: AsyncSession,
    user_id: UUID | None,
    conversation_id: UUID,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Message], int]:
    """Fetch paginated messages for a conversation after verifying user ownership."""
    await get_user_conversation(db, user_id, conversation_id)

    try:
        query = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .limit(limit)
            .offset(offset)
        )
        count_query = (
            select(func.count())
            .select_from(Message)
            .where(Message.conversation_id == conversation_id)
        )
        items = (await db.execute(query)).scalars().all()
        total = (await db.execute(count_query)).scalar_one()
        return list(items), total
    except SQLAlchemyError as exc:
        logger.exception("Failed to fetch messages for conversation %s: %s", conversation_id, exc)
        raise DatabaseError("Failed to fetch messages") from exc


async def run_chat(
    db: AsyncSession,
    user_id: UUID | None,
    request: AgentChatRequest,
) -> AgentChatResponse:
    """Orchestrate synchronous chat execution via the LangGraph agent."""
    conv = await get_or_create_conversation(
        db=db,
        user_id=user_id,
        conversation_id=request.conversation_id,
        initial_title=request.message,
    )
    conversation_id = conv.id

    investigate_request = AgentInvestigateRequest(
        question=request.message,
        conversation_id=conversation_id,
        company_ticker=request.company_ticker,
        target_date=request.target_date,
        index_code=request.index_code,
        stream=False,
    )

    investigation_response = await run_agent(
        db=db,
        request=investigate_request,
        user_id=user_id,
    )

    # Link conversation with investigation if not yet set
    try:
        conv_fresh = await db.get(Conversation, conversation_id)
        if conv_fresh and conv_fresh.investigation_id != investigation_response.id:
            conv_fresh.investigation_id = investigation_response.id
            await db.commit()
    except SQLAlchemyError:
        logger.warning("Could not update investigation_id on conversation %s", conversation_id)

    # Fetch the assistant message ID created during investigation persistence
    msg_query = (
        select(Message.id)
        .where(
            Message.conversation_id == conversation_id,
            Message.role == MessageRole.ASSISTANT.value,
        )
        .order_by(Message.created_at.desc())
        .limit(1)
    )
    assistant_msg_id = (await db.execute(msg_query)).scalar_one_or_none()

    return AgentChatResponse(
        conversation_id=conversation_id,
        message_id=assistant_msg_id,
        assistant_message=investigation_response.summary or "Investigation completed.",
        investigation=investigation_response,
        tool_calls=investigation_response.agent_tool_calls,
    )


async def run_chat_stream(
    db: AsyncSession,
    user_id: UUID | None,
    request: AgentChatRequest,
) -> AsyncGenerator[dict[str, Any], None]:
    """Orchestrate streaming chat execution yielding intermediate SSE events."""
    conv = await get_or_create_conversation(
        db=db,
        user_id=user_id,
        conversation_id=request.conversation_id,
        initial_title=request.message,
    )
    conversation_id = conv.id

    yield {
        "event": "conversation_resolved",
        "data": {
            "conversation_id": str(conversation_id),
            "title": conv.title,
        },
    }

    investigate_request = AgentInvestigateRequest(
        question=request.message,
        conversation_id=conversation_id,
        company_ticker=request.company_ticker,
        target_date=request.target_date,
        index_code=request.index_code,
        stream=True,
    )

    async for event in run_agent_stream(db=db, request=investigate_request, user_id=user_id):
        # Update conversation link if completed event contains investigation
        if event.get("event") == "completed":
            inv_data = event.get("data", {}).get("investigation", {})
            inv_id_str = inv_data.get("id")
            if inv_id_str:
                try:
                    conv_fresh = await db.get(Conversation, conversation_id)
                    if conv_fresh:
                        conv_fresh.investigation_id = UUID(inv_id_str)
                        await db.commit()
                except (SQLAlchemyError, ValueError):
                    pass
        yield event
