from uuid import UUID
from fastapi import APIRouter, Depends
from app.helpers.dependencies import DbSession, get_current_user
from app.helpers.schemas import PaginationParams, ConversationCreate, ConversationUpdate
from app.handlers.conversation_handler import (
    list_conversations,
    get_conversation,
    create_conversation,
    update_conversation,
    delete_conversation,
)

router = APIRouter(
    prefix="/conversations",
    tags=["conversations"],
    dependencies=[Depends(get_current_user)],
)


@router.post("", status_code=201)
async def create(schema: ConversationCreate, db: DbSession):
    return await create_conversation(db, schema)


@router.get("")
async def list_(db: DbSession, pagination: PaginationParams = Depends()):
    return await list_conversations(db, pagination)


@router.get("/{item_id}")
async def get(item_id: UUID, db: DbSession):
    return await get_conversation(db, item_id)


@router.patch("/{item_id}")
async def update(item_id: UUID, schema: ConversationUpdate, db: DbSession):
    return await update_conversation(db, item_id, schema)


@router.delete("/{item_id}", status_code=204)
async def delete(item_id: UUID, db: DbSession):
    return await delete_conversation(db, item_id)
