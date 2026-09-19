from uuid import UUID
from fastapi import APIRouter, Depends
from app.helpers.dependencies import DbSession, get_current_user
from app.helpers.schemas import PaginationParams, IndexCreate, IndexUpdate
from app.handlers.market_index_handler import (
    list_indices,
    get_index,
    create_index,
    update_index,
    delete_index,
)

router = APIRouter(
    prefix="/indices", tags=["indices"], dependencies=[Depends(get_current_user)]
)


@router.post("", status_code=201)
async def create(schema: IndexCreate, db: DbSession):
    return await create_index(db, schema)


@router.get("")
async def list_(db: DbSession, pagination: PaginationParams = Depends()):
    return await list_indices(db, pagination)


@router.get("/{index_id}")
async def get(index_id: UUID, db: DbSession):
    return await get_index(db, index_id)


@router.patch("/{index_id}")
async def update(index_id: UUID, schema: IndexUpdate, db: DbSession):
    return await update_index(db, index_id, schema)


@router.delete("/{index_id}", status_code=204)
async def delete(index_id: UUID, db: DbSession):
    return await delete_index(db, index_id)
