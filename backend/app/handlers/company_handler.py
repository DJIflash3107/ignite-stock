from uuid import UUID

from fastapi.responses import JSONResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.responses import empty_response, list_response, success_response
from app.helpers.schemas import CompanyCreate, CompanyRead, CompanyUpdate, PaginationParams
from app.services import company_service
from app.services.base import payload


async def list_companies(
    db: AsyncSession,
    pagination: PaginationParams,
) -> JSONResponse:
    items, total = await company_service.list_companies(
        db,
        pagination.limit,
        pagination.offset,
    )
    data = [CompanyRead.model_validate(item) for item in items]
    return list_response(
        "companies retrieved",
        "companies",
        data,
        total,
        pagination.limit,
        pagination.offset,
    )


async def get_company(db: AsyncSession, company_id: UUID) -> JSONResponse:
    company = await company_service.get_company(db, company_id)
    data = CompanyRead.model_validate(company)
    return success_response("company retrieved", "company", data)


async def create_company(
    db: AsyncSession,
    schema: CompanyCreate,
) -> JSONResponse:
    body = payload(schema)
    company = await company_service.create_company(db, body)
    data = CompanyRead.model_validate(company)
    return success_response("company created", "company", data, 201)


async def update_company(
    db: AsyncSession,
    company_id: UUID,
    schema: CompanyUpdate,
) -> JSONResponse:
    body = payload(schema)
    company = await company_service.update_company(db, company_id, body)
    data = CompanyRead.model_validate(company)
    return success_response("company updated", "company", data)


async def delete_company(db: AsyncSession, company_id: UUID) -> Response:
    await company_service.delete_company(db, company_id)
    return empty_response()
