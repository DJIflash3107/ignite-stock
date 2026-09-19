from uuid import UUID

from fastapi.responses import JSONResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.responses import empty_response, list_response, success_response
from app.helpers.schemas import (
    EvidenceItemCreate,
    EvidenceItemRead,
    EvidenceItemUpdate,
    PaginationParams,
)
from app.services import evidence_item_service
from app.services.base import payload


async def list_evidence_items(
    db: AsyncSession,
    pagination: PaginationParams,
) -> JSONResponse:
    items, total = await evidence_item_service.list_evidence_items(
        db,
        pagination.limit,
        pagination.offset,
    )
    data = [EvidenceItemRead.model_validate(item) for item in items]
    return list_response(
        "evidence items retrieved",
        "evidence_items",
        data,
        total,
        pagination.limit,
        pagination.offset,
    )


async def get_evidence_item(
    db: AsyncSession,
    item_id: UUID,
) -> JSONResponse:
    item = await evidence_item_service.get_evidence_item(db, item_id)
    data = EvidenceItemRead.model_validate(item)
    return success_response("evidence item retrieved", "evidence_item", data)


async def create_evidence_item(
    db: AsyncSession,
    schema: EvidenceItemCreate,
) -> JSONResponse:
    body = payload(schema)
    item = await evidence_item_service.create_evidence_item(db, body)
    data = EvidenceItemRead.model_validate(item)
    return success_response("evidence item created", "evidence_item", data, 201)


async def update_evidence_item(
    db: AsyncSession,
    item_id: UUID,
    schema: EvidenceItemUpdate,
) -> JSONResponse:
    body = payload(schema)
    item = await evidence_item_service.update_evidence_item(db, item_id, body)
    data = EvidenceItemRead.model_validate(item)
    return success_response("evidence item updated", "evidence_item", data)


async def delete_evidence_item(db: AsyncSession, item_id: UUID) -> Response:
    await evidence_item_service.delete_evidence_item(db, item_id)
    return empty_response()
