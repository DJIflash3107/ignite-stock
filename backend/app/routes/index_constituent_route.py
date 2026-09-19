from uuid import UUID
from fastapi import APIRouter, Depends
from app.helpers.dependencies import DbSession, get_current_user
from app.helpers.schemas import (
    PaginationParams,
    IndexConstituentCreate,
    IndexConstituentUpdate,
)
from app.handlers.index_constituent_handler import (
    list_index_constituents,
    get_index_constituent,
    create_index_constituent,
    update_index_constituent,
    delete_index_constituent,
)

router = APIRouter(
    prefix="/index-constituents",
    tags=["index_constituents"],
    dependencies=[Depends(get_current_user)],
)


@router.post("", status_code=201)
async def create(schema: IndexConstituentCreate, db: DbSession):
    return await create_index_constituent(db, schema)


@router.get("")
async def list_(db: DbSession, pagination: PaginationParams = Depends()):
    return await list_index_constituents(db, pagination)


@router.get("/{item_id}")
async def get(item_id: UUID, db: DbSession):
    return await get_index_constituent(db, item_id)


@router.patch("/{item_id}")
async def update(item_id: UUID, schema: IndexConstituentUpdate, db: DbSession):
    return await update_index_constituent(db, item_id, schema)


@router.delete("/{item_id}", status_code=204)
async def delete(item_id: UUID, db: DbSession):
    return await delete_index_constituent(db, item_id)
