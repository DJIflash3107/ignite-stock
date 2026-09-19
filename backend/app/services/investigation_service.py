from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.exceptions import ConflictError, DatabaseError, NotFoundError
from app.models.investigation import Investigation


async def list_investigations(
    db: AsyncSession,
    limit: int,
    offset: int,
) -> tuple[list[Investigation], int]:
    try:
        query = select(Investigation).limit(limit).offset(offset)
        count_query = select(func.count()).select_from(Investigation)
        items = (await db.execute(query)).scalars().all()
        total = (await db.execute(count_query)).scalar_one()
        return list(items), total
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc


async def get_investigation(
    db: AsyncSession,
    item_id: UUID,
) -> Investigation:
    try:
        item = await db.get(Investigation, item_id)
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc

    if item is None:
        raise NotFoundError("investigation")
    return item


async def create_investigation(
    db: AsyncSession,
    data: dict,
) -> Investigation:
    item = Investigation(**data)
    db.add(item)
    try:
        await db.commit()
        await db.refresh(item)
        return item
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("investigation") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def update_investigation(
    db: AsyncSession,
    item_id: UUID,
    data: dict,
) -> Investigation:
    item = await get_investigation(db, item_id)
    for key, value in data.items():
        setattr(item, key, value)

    try:
        await db.commit()
        await db.refresh(item)
        return item
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("investigation") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def delete_investigation(db: AsyncSession, item_id: UUID) -> None:
    item = await get_investigation(db, item_id)
    try:
        await db.delete(item)
        await db.commit()
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc
