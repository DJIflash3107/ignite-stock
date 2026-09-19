from uuid import UUID

from fastapi.responses import JSONResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.responses import empty_response, list_response, success_response
from app.helpers.schemas import (
    ConversationCreate,
    ConversationRead,
    ConversationUpdate,
    PaginationParams,
)
from app.services import conversation_service
from app.services.base import payload


async def list_conversations(
    db: AsyncSession,
    pagination: PaginationParams,
) -> JSONResponse:
    items, total = await conversation_service.list_conversations(
        db,
        pagination.limit,
        pagination.offset,
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
    item_id: UUID,
) -> JSONResponse:
    item = await conversation_service.get_conversation(db, item_id)
    data = ConversationRead.model_validate(item)
    return success_response("conversation retrieved", "conversation", data)


async def create_conversation(
    db: AsyncSession,
    schema: ConversationCreate,
) -> JSONResponse:
    body = payload(schema)
    item = await conversation_service.create_conversation(db, body)
    data = ConversationRead.model_validate(item)
    return success_response("conversation created", "conversation", data, 201)


async def update_conversation(
    db: AsyncSession,
    item_id: UUID,
    schema: ConversationUpdate,
) -> JSONResponse:
    body = payload(schema)
    item = await conversation_service.update_conversation(db, item_id, body)
    data = ConversationRead.model_validate(item)
    return success_response("conversation updated", "conversation", data)


async def delete_conversation(db: AsyncSession, item_id: UUID) -> Response:
    await conversation_service.delete_conversation(db, item_id)
    return empty_response()
