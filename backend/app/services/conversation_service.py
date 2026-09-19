from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.exceptions import ConflictError, DatabaseError, NotFoundError
from app.models.conversation import Conversation


async def list_conversations(
    db: AsyncSession,
    limit: int,
    offset: int,
) -> tuple[list[Conversation], int]:
    try:
        query = select(Conversation).limit(limit).offset(offset)
        count_query = select(func.count()).select_from(Conversation)
        items = (await db.execute(query)).scalars().all()
        total = (await db.execute(count_query)).scalar_one()
        return list(items), total
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc


async def get_conversation(db: AsyncSession, item_id: UUID) -> Conversation:
    try:
        item = await db.get(Conversation, item_id)
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc

    if item is None:
        raise NotFoundError("conversation")
    return item


async def create_conversation(db: AsyncSession, data: dict) -> Conversation:
    item = Conversation(**data)
    db.add(item)
    try:
        await db.commit()
        await db.refresh(item)
        return item
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("conversation") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def update_conversation(
    db: AsyncSession,
    item_id: UUID,
    data: dict,
) -> Conversation:
    item = await get_conversation(db, item_id)
    for key, value in data.items():
        setattr(item, key, value)

    try:
        await db.commit()
        await db.refresh(item)
        return item
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("conversation") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def delete_conversation(db: AsyncSession, item_id: UUID) -> None:
    item = await get_conversation(db, item_id)
    try:
        await db.delete(item)
        await db.commit()
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc
