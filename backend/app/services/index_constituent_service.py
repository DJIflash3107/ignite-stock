from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.exceptions import ConflictError, DatabaseError, NotFoundError
from app.models.index_constituent import IndexConstituent


async def list_index_constituents(
    db: AsyncSession,
    limit: int,
    offset: int,
) -> tuple[list[IndexConstituent], int]:
    try:
        query = select(IndexConstituent).limit(limit).offset(offset)
        count_query = select(func.count()).select_from(IndexConstituent)
        items = (await db.execute(query)).scalars().all()
        total = (await db.execute(count_query)).scalar_one()
        return list(items), total
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc


async def get_index_constituent(
    db: AsyncSession,
    item_id: UUID,
) -> IndexConstituent:
    try:
        item = await db.get(IndexConstituent, item_id)
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc

    if item is None:
        raise NotFoundError("index constituent")
    return item


async def create_index_constituent(
    db: AsyncSession,
    data: dict,
) -> IndexConstituent:
    item = IndexConstituent(**data)
    db.add(item)
    try:
        await db.commit()
        await db.refresh(item)
        return item
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("index constituent") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def update_index_constituent(
    db: AsyncSession,
    item_id: UUID,
    data: dict,
) -> IndexConstituent:
    item = await get_index_constituent(db, item_id)
    for key, value in data.items():
        setattr(item, key, value)

    try:
        await db.commit()
        await db.refresh(item)
        return item
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("index constituent") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def delete_index_constituent(db: AsyncSession, item_id: UUID) -> None:
    item = await get_index_constituent(db, item_id)
    try:
        await db.delete(item)
        await db.commit()
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc
