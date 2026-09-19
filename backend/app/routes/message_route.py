from uuid import UUID
from fastapi import APIRouter, Depends
from app.helpers.dependencies import DbSession, get_current_user
from app.helpers.schemas import PaginationParams, MessageCreate, MessageUpdate
from app.handlers.message_handler import (
    list_messages,
    get_message,
    create_message,
    update_message,
    delete_message,
)

router = APIRouter(
    prefix="/messages", tags=["messages"], dependencies=[Depends(get_current_user)]
)


@router.post("", status_code=201)
async def create(schema: MessageCreate, db: DbSession):
    return await create_message(db, schema)


@router.get("")
async def list_(db: DbSession, pagination: PaginationParams = Depends()):
    return await list_messages(db, pagination)


@router.get("/{item_id}")
async def get(item_id: UUID, db: DbSession):
    return await get_message(db, item_id)


@router.patch("/{item_id}")
async def update(item_id: UUID, schema: MessageUpdate, db: DbSession):
    return await update_message(db, item_id, schema)


@router.delete("/{item_id}", status_code=204)
async def delete(item_id: UUID, db: DbSession):
    return await delete_message(db, item_id)
