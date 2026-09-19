from uuid import UUID
from fastapi import APIRouter, Depends
from app.helpers.dependencies import DbSession, get_current_user
from app.helpers.schemas import PaginationParams, CompanyCreate, CompanyUpdate
from app.handlers.company_handler import (
    list_companies,
    get_company,
    create_company,
    update_company,
    delete_company,
)

router = APIRouter(
    prefix="/companies", tags=["companies"], dependencies=[Depends(get_current_user)]
)


@router.post("", status_code=201)
async def create(schema: CompanyCreate, db: DbSession):
    return await create_company(db, schema)


@router.get("")
async def list_(db: DbSession, pagination: PaginationParams = Depends()):
    return await list_companies(db, pagination)


@router.get("/{company_id}")
async def get(company_id: UUID, db: DbSession):
    return await get_company(db, company_id)


@router.patch("/{company_id}")
async def update(company_id: UUID, schema: CompanyUpdate, db: DbSession):
    return await update_company(db, company_id, schema)


@router.delete("/{company_id}", status_code=204)
async def delete(company_id: UUID, db: DbSession):
    return await delete_company(db, company_id)
