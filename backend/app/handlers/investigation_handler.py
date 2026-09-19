from uuid import UUID

from fastapi.responses import JSONResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.responses import empty_response, list_response, success_response
from app.helpers.schemas import (
    InvestigationCreate,
    InvestigationRead,
    InvestigationUpdate,
    PaginationParams,
)
from app.services import investigation_service
from app.services.base import payload


async def list_investigations(
    db: AsyncSession,
    pagination: PaginationParams,
) -> JSONResponse:
    items, total = await investigation_service.list_investigations(
        db,
        pagination.limit,
        pagination.offset,
    )
    data = [InvestigationRead.model_validate(item) for item in items]
    return list_response(
        "investigations retrieved",
        "investigations",
        data,
        total,
        pagination.limit,
        pagination.offset,
    )


async def get_investigation(
    db: AsyncSession,
    item_id: UUID,
) -> JSONResponse:
    item = await investigation_service.get_investigation(db, item_id)
    data = InvestigationRead.model_validate(item)
    return success_response("investigation retrieved", "investigation", data)


async def create_investigation(
    db: AsyncSession,
    schema: InvestigationCreate,
) -> JSONResponse:
    body = payload(schema)
    item = await investigation_service.create_investigation(db, body)
    data = InvestigationRead.model_validate(item)
    return success_response("investigation created", "investigation", data, 201)


async def update_investigation(
    db: AsyncSession,
    item_id: UUID,
    schema: InvestigationUpdate,
) -> JSONResponse:
    body = payload(schema)
    item = await investigation_service.update_investigation(db, item_id, body)
    data = InvestigationRead.model_validate(item)
    return success_response("investigation updated", "investigation", data)


async def delete_investigation(db: AsyncSession, item_id: UUID) -> Response:
    await investigation_service.delete_investigation(db, item_id)
    return empty_response()
