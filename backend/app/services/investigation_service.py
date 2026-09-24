from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.helpers.exceptions import ConflictError, DatabaseError, NotFoundError
from app.models.investigation import Investigation


async def list_investigations(
    db: AsyncSession,
    limit: int,
    offset: int,
    user_id: UUID | None = None,
    search: str | None = None,
    investigation_type: str | None = None,
) -> tuple[list[Investigation], int]:
    conditions = []
    if user_id is not None:
        conditions.append(Investigation.user_id == user_id)
    if search and search.strip():
        pattern = f"%{search.strip()}%"
        conditions.append(
            or_(
                Investigation.company_ticker.ilike(pattern),
                Investigation.index_code.ilike(pattern),
                Investigation.question.ilike(pattern),
            )
        )
    if investigation_type:
        conditions.append(Investigation.investigation_type == investigation_type)

    try:
        query = (
            select(Investigation)
            .where(*conditions)
            .order_by(Investigation.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        count_query = (
            select(func.count()).select_from(Investigation).where(*conditions)
        )
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


async def get_investigation_with_details(
    db: AsyncSession,
    item_id: UUID,
) -> Investigation:
    try:
        query = (
            select(Investigation)
            .options(
                selectinload(Investigation.drivers),
                selectinload(Investigation.evidence_items),
            )
            .where(Investigation.id == item_id)
        )
        item = (await db.execute(query)).scalar_one_or_none()
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
