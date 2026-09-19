from uuid import UUID
from fastapi import APIRouter, Depends
from app.helpers.dependencies import DbSession, get_current_user
from app.helpers.schemas import (
    PaginationParams,
    InvestigationDriverCreate,
    InvestigationDriverUpdate,
)
from app.handlers.investigation_driver_handler import (
    list_investigation_drivers,
    get_investigation_driver,
    create_investigation_driver,
    update_investigation_driver,
    delete_investigation_driver,
)

router = APIRouter(
    prefix="/investigation-drivers",
    tags=["investigation_drivers"],
    dependencies=[Depends(get_current_user)],
)


@router.post("", status_code=201)
async def create(schema: InvestigationDriverCreate, db: DbSession):
    return await create_investigation_driver(db, schema)


@router.get("")
async def list_(db: DbSession, pagination: PaginationParams = Depends()):
    return await list_investigation_drivers(db, pagination)


@router.get("/{item_id}")
async def get(item_id: UUID, db: DbSession):
    return await get_investigation_driver(db, item_id)


@router.patch("/{item_id}")
async def update(item_id: UUID, schema: InvestigationDriverUpdate, db: DbSession):
    return await update_investigation_driver(db, item_id, schema)


@router.delete("/{item_id}", status_code=204)
async def delete(item_id: UUID, db: DbSession):
    return await delete_investigation_driver(db, item_id)
