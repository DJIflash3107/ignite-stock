from fastapi import APIRouter, Depends

from app.handlers.market_handler import get_company_impact, get_company_market_context
from app.helpers.schemas import MarketImpactQuery
from app.helpers.dependencies import get_current_user
from app.helpers.exceptions import ValidationAppError

MAX_PEER_LIMIT = 20

router = APIRouter(
    prefix="/companies", tags=["companies"], dependencies=[Depends(get_current_user)]
)


def _validated_peer_limit(peer_limit: int) -> int:
    if peer_limit < 1 or peer_limit > MAX_PEER_LIMIT:
        raise ValidationAppError({"peer_limit": "peer_limit must be between 1 and 20"})
    return peer_limit


@router.get("/{ticker}/market-context")
async def market_context(ticker: str, peer_limit: int = 5):
    return await get_company_market_context(ticker, _validated_peer_limit(peer_limit))


@router.get("/{ticker}/impact")
async def impact(ticker: str, query: MarketImpactQuery = Depends()):
    return await get_company_impact(ticker, query)
