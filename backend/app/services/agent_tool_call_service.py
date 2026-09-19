from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.exceptions import ConflictError, DatabaseError, NotFoundError
from app.models.agent_tool_call import AgentToolCall


async def list_agent_tool_calls(
    db: AsyncSession,
    limit: int,
    offset: int,
) -> tuple[list[AgentToolCall], int]:
    try:
        query = select(AgentToolCall).limit(limit).offset(offset)
        count_query = select(func.count()).select_from(AgentToolCall)
        items = (await db.execute(query)).scalars().all()
        total = (await db.execute(count_query)).scalar_one()
        return list(items), total
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc


async def get_agent_tool_call(
    db: AsyncSession,
    item_id: UUID,
) -> AgentToolCall:
    try:
        item = await db.get(AgentToolCall, item_id)
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc

    if item is None:
        raise NotFoundError("agent tool call")
    return item


async def create_agent_tool_call(
    db: AsyncSession,
    data: dict,
) -> AgentToolCall:
    item = AgentToolCall(**data)
    db.add(item)
    try:
        await db.commit()
        await db.refresh(item)
        return item
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("agent tool call") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def update_agent_tool_call(
    db: AsyncSession,
    item_id: UUID,
    data: dict,
) -> AgentToolCall:
    item = await get_agent_tool_call(db, item_id)
    for key, value in data.items():
        setattr(item, key, value)

    try:
        await db.commit()
        await db.refresh(item)
        return item
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("agent tool call") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def delete_agent_tool_call(db: AsyncSession, item_id: UUID) -> None:
    item = await get_agent_tool_call(db, item_id)
    try:
        await db.delete(item)
        await db.commit()
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc
