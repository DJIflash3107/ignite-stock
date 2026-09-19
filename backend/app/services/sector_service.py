from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.exceptions import ConflictError, DatabaseError, NotFoundError
from app.models.sector import Sector


async def list_sectors(
    db: AsyncSession,
    limit: int,
    offset: int,
) -> tuple[list[Sector], int]:
    try:
        query = select(Sector).limit(limit).offset(offset)
        count_query = select(func.count()).select_from(Sector)
        items = (await db.execute(query)).scalars().all()
        total = (await db.execute(count_query)).scalar_one()
        return list(items), total
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc


async def get_sector(db: AsyncSession, sector_id: UUID) -> Sector:
    try:
        sector = await db.get(Sector, sector_id)
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc

    if sector is None:
        raise NotFoundError("sector")
    return sector


async def create_sector(db: AsyncSession, data: dict) -> Sector:
    sector = Sector(**data)
    db.add(sector)
    try:
        await db.commit()
        await db.refresh(sector)
        return sector
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("sector") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def update_sector(
    db: AsyncSession,
    sector_id: UUID,
    data: dict,
) -> Sector:
    sector = await get_sector(db, sector_id)
    for key, value in data.items():
        setattr(sector, key, value)

    try:
        await db.commit()
        await db.refresh(sector)
        return sector
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("sector") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def delete_sector(db: AsyncSession, sector_id: UUID) -> None:
    sector = await get_sector(db, sector_id)
    try:
        await db.delete(sector)
        await db.commit()
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc
