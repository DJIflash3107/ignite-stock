from uuid import UUID

from fastapi import APIRouter, Depends

from app.handlers.company_handler import (
    create_company,
    delete_company,
    get_company,
    list_companies,
    update_company,
)
from app.handlers.market_handler import get_company_market_context
from app.helpers.dependencies import DbSession, get_current_user
from app.helpers.exceptions import ValidationAppError
from app.helpers.schemas import CompanyCreate, CompanyUpdate, PaginationParams


MAX_PEER_LIMIT = 20


def _validated_peer_limit(peer_limit: int) -> int:
    if peer_limit < 1 or peer_limit > MAX_PEER_LIMIT:
        raise ValidationAppError({"peer_limit": "peer_limit must be between 1 and 20"})
    return peer_limit

router = APIRouter(
    prefix="/companies", tags=["companies"], dependencies=[Depends(get_current_user)]
)


@router.get("/{ticker}/market-context")
async def market_context(ticker: str, peer_limit: int = 5):
    return await get_company_market_context(ticker, _validated_peer_limit(peer_limit))


@router.post("", status_code=201)
async def create(schema: CompanyCreate, db: DbSession):
    return await create_company(db, schema)


@router.get("")
async def list_(db: DbSession, pagination: PaginationParams = Depends()):
    return await list_companies(db, pagination)


@router.get("/{company_id}")
async def get(company_id: UUID, db: DbSession):
    return await get_company(db, company_id)


@router.patch("/{company_id}")
async def update(company_id: UUID, schema: CompanyUpdate, db: DbSession):
    return await update_company(db, company_id, schema)


@router.delete("/{company_id}", status_code=204)
async def delete(company_id: UUID, db: DbSession):
    return await delete_company(db, company_id)
