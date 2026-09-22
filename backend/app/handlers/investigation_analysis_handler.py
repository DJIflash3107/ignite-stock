from uuid import UUID

from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.responses import list_response, success_response
from app.helpers.schemas import (
    EvidenceItemRead,
    InvestigationAnalyzeRequest,
    InvestigationDetailRead,
    InvestigationDriverRead,
    PaginationParams,
)
from app.models.user import User
from app.services import (
    evidence_item_service,
    investigation_analysis_service,
    investigation_driver_service,
    investigation_service,
)


async def analyze_investigation(
    db: AsyncSession,
    request: InvestigationAnalyzeRequest,
    current_user: User | None = None,
) -> JSONResponse:
    user_id = current_user.id if current_user else None
    result = await investigation_analysis_service.run_investigation_analysis(
        db=db,
        request=request,
        user_id=user_id,
    )
    return success_response("investigation analysis completed", "investigation", result, 201)


async def get_investigation_detail(
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
        **InvestigationDetailRead.model_validate(item).model_dump(exclude={"drivers", "evidence_items"}),
        drivers=drivers_read,
        evidence_items=evidence_read,
    )
    return success_response("investigation retrieved", "investigation", data)


async def get_investigation_drivers(
    db: AsyncSession,
    investigation_id: UUID,
    pagination: PaginationParams,
) -> JSONResponse:
    # First verify investigation exists
    await investigation_service.get_investigation(db, investigation_id)
    items, total = await investigation_driver_service.list_drivers_for_investigation(
        db,
        investigation_id,
        limit=pagination.limit,
        offset=pagination.offset,
    )
    data = [InvestigationDriverRead.model_validate(item) for item in items]
    return list_response(
        "investigation drivers retrieved",
        "drivers",
        data,
        total,
        pagination.limit,
        pagination.offset,
    )


async def get_investigation_evidence(
    db: AsyncSession,
    investigation_id: UUID,
    pagination: PaginationParams,
) -> JSONResponse:
    # First verify investigation exists
    await investigation_service.get_investigation(db, investigation_id)
    items, total = await evidence_item_service.list_evidence_for_investigation(
        db,
        investigation_id,
        limit=pagination.limit,
        offset=pagination.offset,
    )
    data = [EvidenceItemRead.model_validate(item) for item in items]
    return list_response(
        "investigation evidence retrieved",
        "evidence",
        data,
        total,
        pagination.limit,
        pagination.offset,
    )
