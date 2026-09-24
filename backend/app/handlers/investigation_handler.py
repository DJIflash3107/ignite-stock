from uuid import UUID

from fastapi.responses import JSONResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.responses import empty_response, list_response, success_response
from app.helpers.schemas import (
    EvidenceItemRead,
    InvestigationCreate,
    InvestigationDetailRead,
    InvestigationDriverRead,
    InvestigationRead,
    InvestigationUpdate,
    PaginationParams,
)
from app.services import investigation_service
from app.services.base import payload
from app.models.user import User


async def list_investigations(
    db: AsyncSession,
    pagination: PaginationParams,
    current_user: User,
    search: str | None = None,
    investigation_type: str | None = None,
) -> JSONResponse:
    items, total = await investigation_service.list_investigations(
        db,
        pagination.limit,
        pagination.offset,
        user_id=current_user.id,
        search=search,
        investigation_type=investigation_type,
    )
    data = [InvestigationRead.model_validate(item) for item in items]
    return list_response(
        "investigations retrieved",
        "investigations",
        data,
        total,
        pagination.limit,
        pagination.offset,
    )


async def get_investigation(
    db: AsyncSession,
    item_id: UUID,
) -> JSONResponse:
    item = await investigation_service.get_investigation_with_details(db, item_id)
    drivers_read = [
        InvestigationDriverRead.model_validate(d)
        for d in sorted(item.drivers, key=lambda x: x.rank)
    ]
    evidence_read = [
        EvidenceItemRead.model_validate(e)
        for e in item.evidence_items
    ]
    data = InvestigationDetailRead(
        **InvestigationRead.model_validate(item).model_dump(),
        drivers=drivers_read,
        evidence_items=evidence_read,
    )
    return success_response("investigation retrieved", "investigation", data)


async def create_investigation(
    db: AsyncSession,
    schema: InvestigationCreate,
) -> JSONResponse:
    body = payload(schema)
    item = await investigation_service.create_investigation(db, body)
    data = InvestigationRead.model_validate(item)
    return success_response("investigation created", "investigation", data, 201)


async def update_investigation(
    db: AsyncSession,
    item_id: UUID,
    schema: InvestigationUpdate,
) -> JSONResponse:
    body = payload(schema)
    item = await investigation_service.update_investigation(db, item_id, body)
    data = InvestigationRead.model_validate(item)
    return success_response("investigation updated", "investigation", data)


async def delete_investigation(db: AsyncSession, item_id: UUID) -> Response:
    await investigation_service.delete_investigation(db, item_id)
    return empty_response()
