from fastapi import APIRouter, Depends

from app.handlers.market_handler import (
    get_market_movers,
    get_market_overview,
    get_sector_performance,
    get_company_market_context
)
from app.helpers.dependencies import get_current_user
from app.helpers.schemas import MarketMoversQuery, MarketOverviewQuery


__all__ = ["router"]

router = APIRouter(
    prefix="/market",
    tags=["market"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/overview")
async def overview(query: MarketOverviewQuery = Depends()):
    return await get_market_overview(query)


@router.get("/movers")
async def movers(query: MarketMoversQuery = Depends()):
    return await get_market_movers(query)


@router.get("/sectors/{sector_code}")
async def sector_performance(sector_code: str):
    return await get_sector_performance(sector_code)


@router.get("/companies/{ticker}/market-context")
async def company_market_context(ticker: str, peer_limit: int = 5):
    return await get_company_market_context(ticker, peer_limit)
