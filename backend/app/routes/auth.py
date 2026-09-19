from fastapi import APIRouter
from app.handlers.auth import login, me, register
from app.helpers.dependencies import CurrentUser, DbSession
from app.helpers.schemas import LoginRequest, UserCreate

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=201)
async def register_route(schema: UserCreate, db: DbSession):
    return await register(db, schema)


@router.post("/login")
async def login_route(schema: LoginRequest, db: DbSession):
    return await login(db, schema)


@router.get("/me")
async def me_route(current_user: CurrentUser):
    return await me(current_user)
