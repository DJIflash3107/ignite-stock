from fastapi.responses import JSONResponse

from app.helpers.responses import list_response, success_response
from app.helpers.schemas import MarketMoversQuery, MarketOverviewQuery
from app.services import market_intelligence_service


async def get_market_overview(query: MarketOverviewQuery) -> JSONResponse:
    data = await market_intelligence_service.get_market_overview(query)
    return success_response("market overview retrieved", "market", data)


async def get_market_movers(query: MarketMoversQuery) -> JSONResponse:
    data = await market_intelligence_service.get_market_movers(query)
    return list_response(
        "market movers retrieved",
        "movers",
        data,
        len(data),
        query.limit,
        0,
    )


async def get_sector_performance(sector_code: str) -> JSONResponse:
    data = await market_intelligence_service.get_sector_performance(sector_code)
    return success_response("sector performance retrieved", "sector", data)


async def get_company_market_context(
    ticker: str,
    peer_limit: int = 5,
) -> JSONResponse:
    data = await market_intelligence_service.get_company_market_context(ticker, peer_limit)
    return success_response("company market context retrieved", "market_context", data)
