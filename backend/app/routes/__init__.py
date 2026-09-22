from fastapi import APIRouter
from app.routes.auth import router as auth_router
from app.routes.user_route import router as user_router
from app.routes.investigation_route import router as investigation_router
from app.routes.investigation_driver_route import router as investigation_driver_router
from app.routes.evidence_item_route import router as evidence_item_router
from app.routes.conversation_route import router as conversation_router
from app.routes.message_route import router as message_router
from app.routes.agent_tool_call_route import router as agent_tool_call_router
from app.routes.market_route import router as market_router
from app.routes.company_route import router as company_router
from app.routes.agent_route import router as agent_router

api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(user_router)
api_router.include_router(investigation_router)
api_router.include_router(investigation_driver_router)
api_router.include_router(evidence_item_router)
api_router.include_router(conversation_router)
api_router.include_router(message_router)
api_router.include_router(agent_tool_call_router)
api_router.include_router(market_router)
api_router.include_router(company_router)
api_router.include_router(agent_router)
