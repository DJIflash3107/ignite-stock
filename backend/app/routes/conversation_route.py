from uuid import UUID
from fastapi import APIRouter, Depends
from app.helpers.dependencies import CurrentUser, DbSession, get_current_user
from app.helpers.schemas import PaginationParams, ConversationCreate, ConversationUpdate
from app.handlers import agent_chat_handler
from app.handlers.conversation_handler import (
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
async def create(schema: ConversationCreate, db: DbSession, current_user: CurrentUser):
    if schema.user_id is None and current_user:
        schema.user_id = current_user.id
    return await create_conversation(db, schema)


@router.get("")
async def list_(
    db: DbSession,
    current_user: CurrentUser,
    pagination: PaginationParams = Depends(),
):
    return await agent_chat_handler.list_conversations(db, current_user, pagination)


@router.get("/{item_id}")
async def get(
    item_id: UUID,
    db: DbSession,
    current_user: CurrentUser,
):
    return await agent_chat_handler.get_conversation(db, current_user, item_id)


@router.get("/{item_id}/messages")
async def get_messages(
    item_id: UUID,
    db: DbSession,
    current_user: CurrentUser,
    pagination: PaginationParams = Depends(),
):
    return await agent_chat_handler.get_conversation_messages(
        db, current_user, item_id, pagination
    )


@router.patch("/{item_id}")
async def update(item_id: UUID, schema: ConversationUpdate, db: DbSession):
    return await update_conversation(db, item_id, schema)


@router.delete("/{item_id}", status_code=204)
async def delete(item_id: UUID, db: DbSession):
    return await delete_conversation(db, item_id)

