from uuid import UUID
from fastapi import APIRouter, Depends
from app.helpers.dependencies import DbSession, get_current_user
from app.helpers.schemas import PaginationParams, EvidenceItemCreate, EvidenceItemUpdate
from app.handlers.evidence_item_handler import (
    list_evidence_items,
    get_evidence_item,
    create_evidence_item,
    update_evidence_item,
    delete_evidence_item,
)

router = APIRouter(
    prefix="/evidence-items",
    tags=["evidence_items"],
    dependencies=[Depends(get_current_user)],
)


@router.post("", status_code=201)
async def create(schema: EvidenceItemCreate, db: DbSession):
    return await create_evidence_item(db, schema)


@router.get("")
async def list_(db: DbSession, pagination: PaginationParams = Depends()):
    return await list_evidence_items(db, pagination)


@router.get("/{item_id}")
async def get(item_id: UUID, db: DbSession):
    return await get_evidence_item(db, item_id)


@router.patch("/{item_id}")
async def update(item_id: UUID, schema: EvidenceItemUpdate, db: DbSession):
    return await update_evidence_item(db, item_id, schema)


@router.delete("/{item_id}", status_code=204)
async def delete(item_id: UUID, db: DbSession):
    return await delete_evidence_item(db, item_id)
