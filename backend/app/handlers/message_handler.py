from uuid import UUID

from fastapi.responses import JSONResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.responses import empty_response, list_response, success_response
from app.helpers.schemas import MessageCreate, MessageRead, MessageUpdate, PaginationParams
from app.services import message_service
from app.services.base import payload


async def list_messages(
    db: AsyncSession,
    pagination: PaginationParams,
) -> JSONResponse:
    items, total = await message_service.list_messages(
        db,
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


async def get_message(db: AsyncSession, item_id: UUID) -> JSONResponse:
    item = await message_service.get_message(db, item_id)
    data = MessageRead.model_validate(item)
    return success_response("message retrieved", "message", data)


async def create_message(
    db: AsyncSession,
    schema: MessageCreate,
) -> JSONResponse:
    body = payload(schema)
    item = await message_service.create_message(db, body)
    data = MessageRead.model_validate(item)
    return success_response("message created", "message", data, 201)


async def update_message(
    db: AsyncSession,
    item_id: UUID,
    schema: MessageUpdate,
) -> JSONResponse:
    body = payload(schema)
    item = await message_service.update_message(db, item_id, body)
    data = MessageRead.model_validate(item)
    return success_response("message updated", "message", data)


async def delete_message(db: AsyncSession, item_id: UUID) -> Response:
    await message_service.delete_message(db, item_id)
    return empty_response()
