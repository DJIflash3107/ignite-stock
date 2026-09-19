from uuid import UUID
from fastapi import APIRouter, Depends
from app.helpers.dependencies import DbSession, get_current_user
from app.helpers.schemas import PaginationParams, SectorCreate, SectorUpdate
from app.handlers.sector_handler import (
    list_sectors,
    get_sector,
    create_sector,
    update_sector,
    delete_sector,
)

router = APIRouter(
    prefix="/sectors", tags=["sectors"], dependencies=[Depends(get_current_user)]
)


@router.post("", status_code=201)
async def create(schema: SectorCreate, db: DbSession):
    return await create_sector(db, schema)


@router.get("")
async def list_(db: DbSession, pagination: PaginationParams = Depends()):
    return await list_sectors(db, pagination)


@router.get("/{sector_id}")
async def get(sector_id: UUID, db: DbSession):
    return await get_sector(db, sector_id)


@router.patch("/{sector_id}")
async def update(sector_id: UUID, schema: SectorUpdate, db: DbSession):
    return await update_sector(db, sector_id, schema)


@router.delete("/{sector_id}", status_code=204)
async def delete(sector_id: UUID, db: DbSession):
    return await delete_sector(db, sector_id)
