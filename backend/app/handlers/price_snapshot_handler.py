from uuid import UUID

from fastapi.responses import JSONResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.responses import empty_response, list_response, success_response
from app.helpers.schemas import (
    PaginationParams,
    PriceSnapshotCreate,
    PriceSnapshotRead,
    PriceSnapshotUpdate,
)
from app.services import price_snapshot_service
from app.services.base import payload


async def list_price_snapshots(
    db: AsyncSession,
    pagination: PaginationParams,
) -> JSONResponse:
    items, total = await price_snapshot_service.list_price_snapshots(
        db,
        pagination.limit,
        pagination.offset,
    )
    data = [PriceSnapshotRead.model_validate(item) for item in items]
    return list_response(
        "price snapshots retrieved",
        "price_snapshots",
        data,
        total,
        pagination.limit,
        pagination.offset,
    )


async def get_price_snapshot(
    db: AsyncSession,
    item_id: UUID,
) -> JSONResponse:
    item = await price_snapshot_service.get_price_snapshot(db, item_id)
    data = PriceSnapshotRead.model_validate(item)
    return success_response("price snapshot retrieved", "price_snapshot", data)


async def create_price_snapshot(
    db: AsyncSession,
    schema: PriceSnapshotCreate,
) -> JSONResponse:
    body = payload(schema)
    item = await price_snapshot_service.create_price_snapshot(db, body)
    data = PriceSnapshotRead.model_validate(item)
    return success_response("price snapshot created", "price_snapshot", data, 201)


async def update_price_snapshot(
    db: AsyncSession,
    item_id: UUID,
    schema: PriceSnapshotUpdate,
) -> JSONResponse:
    body = payload(schema)
    item = await price_snapshot_service.update_price_snapshot(db, item_id, body)
    data = PriceSnapshotRead.model_validate(item)
    return success_response("price snapshot updated", "price_snapshot", data)


async def delete_price_snapshot(db: AsyncSession, item_id: UUID) -> Response:
    await price_snapshot_service.delete_price_snapshot(db, item_id)
    return empty_response()
