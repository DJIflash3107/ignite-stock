from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.exceptions import ConflictError, DatabaseError, NotFoundError
from app.models.market_index import MarketIndex


async def list_indices(
    db: AsyncSession,
    limit: int,
    offset: int,
) -> tuple[list[MarketIndex], int]:
    try:
        query = select(MarketIndex).limit(limit).offset(offset)
        count_query = select(func.count()).select_from(MarketIndex)
        items = (await db.execute(query)).scalars().all()
        total = (await db.execute(count_query)).scalar_one()
        return list(items), total
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc


async def get_index(db: AsyncSession, index_id: UUID) -> MarketIndex:
    try:
        index = await db.get(MarketIndex, index_id)
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc

    if index is None:
        raise NotFoundError("index")
    return index


async def create_index(db: AsyncSession, data: dict) -> MarketIndex:
    index = MarketIndex(**data)
    db.add(index)
    try:
        await db.commit()
        await db.refresh(index)
        return index
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("index") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def update_index(
    db: AsyncSession,
    index_id: UUID,
    data: dict,
) -> MarketIndex:
    index = await get_index(db, index_id)
    for key, value in data.items():
        setattr(index, key, value)

    try:
        await db.commit()
        await db.refresh(index)
        return index
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("index") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def delete_index(db: AsyncSession, index_id: UUID) -> None:
    index = await get_index(db, index_id)
    try:
        await db.delete(index)
        await db.commit()
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc
