from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.exceptions import ConflictError, DatabaseError, NotFoundError
from app.models.message import Message


async def list_messages(
    db: AsyncSession,
    limit: int,
    offset: int,
) -> tuple[list[Message], int]:
    try:
        query = select(Message).limit(limit).offset(offset)
        count_query = select(func.count()).select_from(Message)
        items = (await db.execute(query)).scalars().all()
        total = (await db.execute(count_query)).scalar_one()
        return list(items), total
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc


async def get_message(db: AsyncSession, item_id: UUID) -> Message:
    try:
        item = await db.get(Message, item_id)
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc

    if item is None:
        raise NotFoundError("message")
    return item


async def create_message(db: AsyncSession, data: dict) -> Message:
    item = Message(**data)
    db.add(item)
    try:
        await db.commit()
        await db.refresh(item)
        return item
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("message") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def update_message(
    db: AsyncSession,
    item_id: UUID,
    data: dict,
) -> Message:
    item = await get_message(db, item_id)
    for key, value in data.items():
        setattr(item, key, value)

    try:
        await db.commit()
        await db.refresh(item)
        return item
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("message") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def delete_message(db: AsyncSession, item_id: UUID) -> None:
    item = await get_message(db, item_id)
    try:
        await db.delete(item)
        await db.commit()
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc
