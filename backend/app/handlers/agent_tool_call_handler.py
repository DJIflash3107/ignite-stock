from uuid import UUID

from fastapi.responses import JSONResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.responses import empty_response, list_response, success_response
from app.helpers.schemas import (
    AgentToolCallCreate,
    AgentToolCallRead,
    AgentToolCallUpdate,
    PaginationParams,
)
from app.services import agent_tool_call_service
from app.services.base import payload


async def list_agent_tool_calls(
    db: AsyncSession,
    pagination: PaginationParams,
) -> JSONResponse:
    items, total = await agent_tool_call_service.list_agent_tool_calls(
        db,
        pagination.limit,
        pagination.offset,
    )
    data = [AgentToolCallRead.model_validate(item) for item in items]
    return list_response(
        "agent tool calls retrieved",
        "agent_tool_calls",
        data,
        total,
        pagination.limit,
        pagination.offset,
    )


async def get_agent_tool_call(
    db: AsyncSession,
    item_id: UUID,
) -> JSONResponse:
    item = await agent_tool_call_service.get_agent_tool_call(db, item_id)
    data = AgentToolCallRead.model_validate(item)
    return success_response("agent tool call retrieved", "agent_tool_call", data)


async def create_agent_tool_call(
    db: AsyncSession,
    schema: AgentToolCallCreate,
) -> JSONResponse:
    body = payload(schema)
    item = await agent_tool_call_service.create_agent_tool_call(db, body)
    data = AgentToolCallRead.model_validate(item)
    return success_response("agent tool call created", "agent_tool_call", data, 201)


async def update_agent_tool_call(
    db: AsyncSession,
    item_id: UUID,
    schema: AgentToolCallUpdate,
) -> JSONResponse:
    body = payload(schema)
    item = await agent_tool_call_service.update_agent_tool_call(db, item_id, body)
    data = AgentToolCallRead.model_validate(item)
    return success_response("agent tool call updated", "agent_tool_call", data)


async def delete_agent_tool_call(db: AsyncSession, item_id: UUID) -> Response:
    await agent_tool_call_service.delete_agent_tool_call(db, item_id)
    return empty_response()
