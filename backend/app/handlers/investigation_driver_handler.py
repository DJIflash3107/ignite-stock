from uuid import UUID

from fastapi.responses import JSONResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.responses import empty_response, list_response, success_response
from app.helpers.schemas import (
    InvestigationDriverCreate,
    InvestigationDriverRead,
    InvestigationDriverUpdate,
    PaginationParams,
)
from app.services import investigation_driver_service
from app.services.base import payload


async def list_investigation_drivers(
    db: AsyncSession,
    pagination: PaginationParams,
) -> JSONResponse:
    items, total = await investigation_driver_service.list_investigation_drivers(
        db,
        pagination.limit,
        pagination.offset,
    )
    data = [InvestigationDriverRead.model_validate(item) for item in items]
    return list_response(
        "investigation drivers retrieved",
        "investigation_drivers",
        data,
        total,
        pagination.limit,
        pagination.offset,
    )


async def get_investigation_driver(
    db: AsyncSession,
    item_id: UUID,
) -> JSONResponse:
    item = await investigation_driver_service.get_investigation_driver(db, item_id)
    data = InvestigationDriverRead.model_validate(item)
    return success_response(
        "investigation driver retrieved",
        "investigation_driver",
        data,
    )


async def create_investigation_driver(
    db: AsyncSession,
    schema: InvestigationDriverCreate,
) -> JSONResponse:
    body = payload(schema)
    item = await investigation_driver_service.create_investigation_driver(db, body)
    data = InvestigationDriverRead.model_validate(item)
    return success_response(
        "investigation driver created",
        "investigation_driver",
        data,
        201,
    )


async def update_investigation_driver(
    db: AsyncSession,
    item_id: UUID,
    schema: InvestigationDriverUpdate,
) -> JSONResponse:
    body = payload(schema)
    item = await investigation_driver_service.update_investigation_driver(
        db,
        item_id,
        body,
    )
    data = InvestigationDriverRead.model_validate(item)
    return success_response(
        "investigation driver updated",
        "investigation_driver",
        data,
    )


async def delete_investigation_driver(
    db: AsyncSession,
    item_id: UUID,
) -> Response:
    await investigation_driver_service.delete_investigation_driver(db, item_id)
    return empty_response()
