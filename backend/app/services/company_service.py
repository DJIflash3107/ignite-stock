from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.exceptions import ConflictError, DatabaseError, NotFoundError
from app.models.company import Company


async def list_companies(
    db: AsyncSession,
    limit: int,
    offset: int,
) -> tuple[list[Company], int]:
    try:
        query = select(Company).limit(limit).offset(offset)
        count_query = select(func.count()).select_from(Company)
        items = (await db.execute(query)).scalars().all()
        total = (await db.execute(count_query)).scalar_one()
        return list(items), total
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc


async def get_company(db: AsyncSession, company_id: UUID) -> Company:
    try:
        company = await db.get(Company, company_id)
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc

    if company is None:
        raise NotFoundError("company")
    return company


async def create_company(db: AsyncSession, data: dict) -> Company:
    company = Company(**data)
    db.add(company)
    try:
        await db.commit()
        await db.refresh(company)
        return company
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("company") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def update_company(
    db: AsyncSession,
    company_id: UUID,
    data: dict,
) -> Company:
    company = await get_company(db, company_id)
    for key, value in data.items():
        setattr(company, key, value)

    try:
        await db.commit()
        await db.refresh(company)
        return company
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("company") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def delete_company(db: AsyncSession, company_id: UUID) -> None:
    company = await get_company(db, company_id)
    try:
        await db.delete(company)
        await db.commit()
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc
