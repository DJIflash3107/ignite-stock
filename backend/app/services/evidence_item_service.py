from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.exceptions import ConflictError, DatabaseError, NotFoundError
from app.models.evidence_item import EvidenceItem


async def list_evidence_items(
    db: AsyncSession,
    limit: int,
    offset: int,
) -> tuple[list[EvidenceItem], int]:
    try:
        query = select(EvidenceItem).limit(limit).offset(offset)
        count_query = select(func.count()).select_from(EvidenceItem)
        items = (await db.execute(query)).scalars().all()
        total = (await db.execute(count_query)).scalar_one()
        return list(items), total
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc


async def get_evidence_item(db: AsyncSession, item_id: UUID) -> EvidenceItem:
    try:
        item = await db.get(EvidenceItem, item_id)
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc

    if item is None:
        raise NotFoundError("evidence item")
    return item


async def create_evidence_item(db: AsyncSession, data: dict) -> EvidenceItem:
    item = EvidenceItem(**data)
    db.add(item)
    try:
        await db.commit()
        await db.refresh(item)
        return item
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("evidence item") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def update_evidence_item(
    db: AsyncSession,
    item_id: UUID,
    data: dict,
) -> EvidenceItem:
    item = await get_evidence_item(db, item_id)
    for key, value in data.items():
        setattr(item, key, value)

    try:
        await db.commit()
        await db.refresh(item)
        return item
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("evidence item") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def delete_evidence_item(db: AsyncSession, item_id: UUID) -> None:
    item = await get_evidence_item(db, item_id)
    try:
        await db.delete(item)
        await db.commit()
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc
