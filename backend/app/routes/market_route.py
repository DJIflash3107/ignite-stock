from uuid import UUID

from fastapi import APIRouter, Depends

from app.handlers.market_handler import (
    get_market_movers,
    get_market_overview,
    get_sector_performance,
)
from app.helpers.dependencies import DbSession, get_current_user
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


@router.get("/sectors/{sector_id}")
async def sector_performance(sector_id: UUID, db: DbSession):
    return await get_sector_performance(db, sector_id)
