from uuid import UUID
from fastapi import APIRouter, Depends
from app.helpers.dependencies import DbSession, get_current_user
from app.helpers.schemas import (
    PaginationParams,
    InvestigationCreate,
    InvestigationUpdate,
)
from app.handlers.investigation_handler import (
    list_investigations,
    get_investigation,
    create_investigation,
    update_investigation,
    delete_investigation,
)

router = APIRouter(
    prefix="/investigations",
    tags=["investigations"],
    dependencies=[Depends(get_current_user)],
)


@router.post("", status_code=201)
async def create(schema: InvestigationCreate, db: DbSession):
    return await create_investigation(db, schema)


@router.get("")
async def list_(db: DbSession, pagination: PaginationParams = Depends()):
    return await list_investigations(db, pagination)


@router.get("/{item_id}")
async def get(item_id: UUID, db: DbSession):
    return await get_investigation(db, item_id)


@router.patch("/{item_id}")
async def update(item_id: UUID, schema: InvestigationUpdate, db: DbSession):
    return await update_investigation(db, item_id, schema)


@router.delete("/{item_id}", status_code=204)
async def delete(item_id: UUID, db: DbSession):
    return await delete_investigation(db, item_id)
