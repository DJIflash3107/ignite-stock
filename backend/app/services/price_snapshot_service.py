from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.exceptions import ConflictError, DatabaseError, NotFoundError
from app.models.price_snapshot import PriceSnapshot


async def list_price_snapshots(
    db: AsyncSession,
    limit: int,
    offset: int,
) -> tuple[list[PriceSnapshot], int]:
    try:
        query = select(PriceSnapshot).limit(limit).offset(offset)
        count_query = select(func.count()).select_from(PriceSnapshot)
        items = (await db.execute(query)).scalars().all()
        total = (await db.execute(count_query)).scalar_one()
        return list(items), total
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc


async def get_price_snapshot(
    db: AsyncSession,
    item_id: UUID,
) -> PriceSnapshot:
    try:
        item = await db.get(PriceSnapshot, item_id)
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc

    if item is None:
        raise NotFoundError("price snapshot")
    return item


async def create_price_snapshot(
    db: AsyncSession,
    data: dict,
) -> PriceSnapshot:
    item = PriceSnapshot(**data)
    db.add(item)
    try:
        await db.commit()
        await db.refresh(item)
        return item
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("price snapshot") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def update_price_snapshot(
    db: AsyncSession,
    item_id: UUID,
    data: dict,
) -> PriceSnapshot:
    item = await get_price_snapshot(db, item_id)
    for key, value in data.items():
        setattr(item, key, value)

    try:
        await db.commit()
        await db.refresh(item)
        return item
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("price snapshot") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def delete_price_snapshot(db: AsyncSession, item_id: UUID) -> None:
    item = await get_price_snapshot(db, item_id)
    try:
        await db.delete(item)
        await db.commit()
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc
