from uuid import UUID

from fastapi.responses import JSONResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.responses import empty_response, list_response, success_response
from app.helpers.schemas import (
    IndexConstituentCreate,
    IndexConstituentRead,
    IndexConstituentUpdate,
    PaginationParams,
)
from app.services import index_constituent_service
from app.services.base import payload


async def list_index_constituents(
    db: AsyncSession,
    pagination: PaginationParams,
) -> JSONResponse:
    items, total = await index_constituent_service.list_index_constituents(
        db,
        pagination.limit,
        pagination.offset,
    )
    data = [IndexConstituentRead.model_validate(item) for item in items]
    return list_response(
        "index constituents retrieved",
        "index_constituents",
        data,
        total,
        pagination.limit,
        pagination.offset,
    )


async def get_index_constituent(
    db: AsyncSession,
    item_id: UUID,
) -> JSONResponse:
    item = await index_constituent_service.get_index_constituent(db, item_id)
    data = IndexConstituentRead.model_validate(item)
    return success_response("index constituent retrieved", "index_constituent", data)


async def create_index_constituent(
    db: AsyncSession,
    schema: IndexConstituentCreate,
) -> JSONResponse:
    body = payload(schema)
    item = await index_constituent_service.create_index_constituent(db, body)
    data = IndexConstituentRead.model_validate(item)
    return success_response(
        "index constituent created",
        "index_constituent",
        data,
        201,
    )


async def update_index_constituent(
    db: AsyncSession,
    item_id: UUID,
    schema: IndexConstituentUpdate,
) -> JSONResponse:
    body = payload(schema)
    item = await index_constituent_service.update_index_constituent(
        db,
        item_id,
        body,
    )
    data = IndexConstituentRead.model_validate(item)
    return success_response("index constituent updated", "index_constituent", data)


async def delete_index_constituent(
    db: AsyncSession,
    item_id: UUID,
) -> Response:
    await index_constituent_service.delete_index_constituent(db, item_id)
    return empty_response()
