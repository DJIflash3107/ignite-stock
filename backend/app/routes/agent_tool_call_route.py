from uuid import UUID
from fastapi import APIRouter, Depends
from app.helpers.dependencies import DbSession, get_current_user
from app.helpers.schemas import (
    PaginationParams,
    AgentToolCallCreate,
    AgentToolCallUpdate,
)
from app.handlers.agent_tool_call_handler import (
    list_agent_tool_calls,
    get_agent_tool_call,
    create_agent_tool_call,
    update_agent_tool_call,
    delete_agent_tool_call,
)

router = APIRouter(
    prefix="/agent-tool-calls",
    tags=["agent_tool_calls"],
    dependencies=[Depends(get_current_user)],
)


@router.post("", status_code=201)
async def create(schema: AgentToolCallCreate, db: DbSession):
    return await create_agent_tool_call(db, schema)


@router.get("")
async def list_(db: DbSession, pagination: PaginationParams = Depends()):
    return await list_agent_tool_calls(db, pagination)


@router.get("/{item_id}")
async def get(item_id: UUID, db: DbSession):
    return await get_agent_tool_call(db, item_id)


@router.patch("/{item_id}")
async def update(item_id: UUID, schema: AgentToolCallUpdate, db: DbSession):
    return await update_agent_tool_call(db, item_id, schema)


@router.delete("/{item_id}", status_code=204)
async def delete(item_id: UUID, db: DbSession):
    return await delete_agent_tool_call(db, item_id)
