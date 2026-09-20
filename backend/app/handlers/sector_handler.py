from uuid import UUID

from fastapi.responses import JSONResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.responses import empty_response, list_response, success_response
from app.helpers.schemas import PaginationParams, SectorCreate, SectorRead, SectorUpdate
from app.services import sector_service, sectors_service
from app.services.base import payload


async def list_external_subsectors() -> JSONResponse:
    data = await sectors_service.list_subsectors()
    return success_response("subsectors retrieved", "subsectors", data)


async def list_sectors(
    db: AsyncSession,
    pagination: PaginationParams,
) -> JSONResponse:
    items, total = await sector_service.list_sectors(
        db,
        pagination.limit,
        pagination.offset,
    )
    data = [SectorRead.model_validate(item) for item in items]
    return list_response(
        "sectors retrieved",
        "sectors",
        data,
        total,
        pagination.limit,
        pagination.offset,
    )


async def get_sector(db: AsyncSession, sector_id: UUID) -> JSONResponse:
    sector = await sector_service.get_sector(db, sector_id)
    data = SectorRead.model_validate(sector)
    return success_response("sector retrieved", "sector", data)


async def create_sector(
    db: AsyncSession,
    schema: SectorCreate,
) -> JSONResponse:
    body = payload(schema)
    sector = await sector_service.create_sector(db, body)
    data = SectorRead.model_validate(sector)
    return success_response("sector created", "sector", data, 201)


async def update_sector(
    db: AsyncSession,
    sector_id: UUID,
    schema: SectorUpdate,
) -> JSONResponse:
    body = payload(schema)
    sector = await sector_service.update_sector(db, sector_id, body)
    data = SectorRead.model_validate(sector)
    return success_response("sector updated", "sector", data)


async def delete_sector(db: AsyncSession, sector_id: UUID) -> Response:
    await sector_service.delete_sector(db, sector_id)
    return empty_response()
