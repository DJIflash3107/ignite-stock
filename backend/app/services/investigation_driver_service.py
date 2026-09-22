from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.exceptions import ConflictError, DatabaseError, NotFoundError
from app.models.investigation_driver import InvestigationDriver


async def list_investigation_drivers(
    db: AsyncSession,
    limit: int,
    offset: int,
) -> tuple[list[InvestigationDriver], int]:
    try:
        query = select(InvestigationDriver).limit(limit).offset(offset)
        count_query = select(func.count()).select_from(InvestigationDriver)
        items = (await db.execute(query)).scalars().all()
        total = (await db.execute(count_query)).scalar_one()
        return list(items), total
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc


async def list_drivers_for_investigation(
    db: AsyncSession,
    investigation_id: UUID,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[InvestigationDriver], int]:
    try:
        query = (
            select(InvestigationDriver)
            .where(InvestigationDriver.investigation_id == investigation_id)
            .order_by(InvestigationDriver.rank.asc())
            .limit(limit)
            .offset(offset)
        )
        count_query = (
            select(func.count())
            .select_from(InvestigationDriver)
            .where(InvestigationDriver.investigation_id == investigation_id)
        )
        items = (await db.execute(query)).scalars().all()
        total = (await db.execute(count_query)).scalar_one()
        return list(items), total
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc


async def get_investigation_driver(
    db: AsyncSession,
    item_id: UUID,
) -> InvestigationDriver:
    try:
        item = await db.get(InvestigationDriver, item_id)
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc

    if item is None:
        raise NotFoundError("investigation driver")
    return item


async def create_investigation_driver(
    db: AsyncSession,
    data: dict,
) -> InvestigationDriver:
    item = InvestigationDriver(**data)
    db.add(item)
    try:
        await db.commit()
        await db.refresh(item)
        return item
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("investigation driver") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def update_investigation_driver(
    db: AsyncSession,
    item_id: UUID,
    data: dict,
) -> InvestigationDriver:
    item = await get_investigation_driver(db, item_id)
    for key, value in data.items():
        setattr(item, key, value)

    try:
        await db.commit()
        await db.refresh(item)
        return item
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("investigation driver") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def delete_investigation_driver(db: AsyncSession, item_id: UUID) -> None:
    item = await get_investigation_driver(db, item_id)
    try:
        await db.delete(item)
        await db.commit()
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc
