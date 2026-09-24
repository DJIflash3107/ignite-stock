from uuid import UUID

from fastapi import APIRouter, Depends

from app.handlers import agent_chat_handler, agent_handler
from app.helpers.dependencies import CurrentUser, DbSession, get_current_user
from app.helpers.schemas import AgentChatRequest, AgentInvestigateRequest, PaginationParams

router = APIRouter(
    prefix="/agent",
    tags=["agent"],
    dependencies=[Depends(get_current_user)],
)


@router.post("/investigate", status_code=201)
async def investigate(
    schema: AgentInvestigateRequest,
    db: DbSession,
    current_user: CurrentUser,
):
    """Execute AI Investigation Agent workflow (supports one-shot JSON or SSE streaming)."""
    return await agent_handler.investigate(db, schema, current_user)


@router.post("/chat", status_code=200)
async def chat(
    schema: AgentChatRequest,
    db: DbSession,
    current_user: CurrentUser,
):
    """Execute conversational AI agent investigation with context tracking."""
    return await agent_chat_handler.chat(db, schema, current_user)


@router.get("/conversations")
async def list_conversations(
    db: DbSession,
    current_user: CurrentUser,
    pagination: PaginationParams = Depends(),
    investigation_id: UUID | None = None,
):
    """List conversations belonging to the authenticated user."""
    return await agent_chat_handler.list_conversations(
        db, current_user, pagination, investigation_id
    )


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: UUID,
    db: DbSession,
    current_user: CurrentUser,
):
    """Get details of a specific conversation owned by the authenticated user."""
    return await agent_chat_handler.get_conversation(db, current_user, conversation_id)


@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: UUID,
    db: DbSession,
    current_user: CurrentUser,
    pagination: PaginationParams = Depends(),
):
    """Get paginated messages of a specific conversation owned by the authenticated user."""
    return await agent_chat_handler.get_conversation_messages(
        db, current_user, conversation_id, pagination
    )

