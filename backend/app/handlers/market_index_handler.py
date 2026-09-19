from uuid import UUID

from fastapi.responses import JSONResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.responses import empty_response, list_response, success_response
from app.helpers.schemas import IndexCreate, IndexRead, IndexUpdate, PaginationParams
from app.services import market_index_service
from app.services.base import payload


async def list_indices(
    db: AsyncSession,
    pagination: PaginationParams,
) -> JSONResponse:
    items, total = await market_index_service.list_indices(
        db,
        pagination.limit,
        pagination.offset,
    )
    data = [IndexRead.model_validate(item) for item in items]
    return list_response(
        "indices retrieved",
        "indices",
        data,
        total,
        pagination.limit,
        pagination.offset,
    )


async def get_index(db: AsyncSession, index_id: UUID) -> JSONResponse:
    index = await market_index_service.get_index(db, index_id)
    data = IndexRead.model_validate(index)
    return success_response("index retrieved", "index", data)


async def create_index(
    db: AsyncSession,
    schema: IndexCreate,
) -> JSONResponse:
    body = payload(schema)
    index = await market_index_service.create_index(db, body)
    data = IndexRead.model_validate(index)
    return success_response("index created", "index", data, 201)


async def update_index(
    db: AsyncSession,
    index_id: UUID,
    schema: IndexUpdate,
) -> JSONResponse:
    body = payload(schema)
    index = await market_index_service.update_index(db, index_id, body)
    data = IndexRead.model_validate(index)
    return success_response("index updated", "index", data)


async def delete_index(db: AsyncSession, index_id: UUID) -> Response:
    await market_index_service.delete_index(db, index_id)
    return empty_response()
