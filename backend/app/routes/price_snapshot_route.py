from uuid import UUID
from fastapi import APIRouter, Depends
from app.helpers.dependencies import DbSession, get_current_user
from app.helpers.schemas import (
    PaginationParams,
    PriceSnapshotCreate,
    PriceSnapshotUpdate,
)
from app.handlers.price_snapshot_handler import (
    list_price_snapshots,
    get_price_snapshot,
    create_price_snapshot,
    update_price_snapshot,
    delete_price_snapshot,
)

router = APIRouter(
    prefix="/price-snapshots",
    tags=["price_snapshots"],
    dependencies=[Depends(get_current_user)],
)


@router.post("", status_code=201)
async def create(schema: PriceSnapshotCreate, db: DbSession):
    return await create_price_snapshot(db, schema)


@router.get("")
async def list_(db: DbSession, pagination: PaginationParams = Depends()):
    return await list_price_snapshots(db, pagination)


@router.get("/{item_id}")
async def get(item_id: UUID, db: DbSession):
    return await get_price_snapshot(db, item_id)


@router.patch("/{item_id}")
async def update(item_id: UUID, schema: PriceSnapshotUpdate, db: DbSession):
    return await update_price_snapshot(db, item_id, schema)


@router.delete("/{item_id}", status_code=204)
async def delete(item_id: UUID, db: DbSession):
    return await delete_price_snapshot(db, item_id)
