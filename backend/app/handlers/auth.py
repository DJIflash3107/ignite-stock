from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.responses import success_response
from app.helpers.schemas import LoginRequest, TokenRead, UserCreate, UserRead
from app.models.user import User
from app.services.base import payload
from app.services.user_service import login_user, register_user


def auth_payload(user: User, token: str) -> dict:
    profile = UserRead.model_validate(user).model_dump(mode="json")
    token_data = TokenRead(access_token=token).model_dump()
    return {"profile": profile, "token": token_data}


async def register(db: AsyncSession, schema: UserCreate) -> JSONResponse:
    body = payload(schema)
    user, token = await register_user(db, body)
    data = auth_payload(user, token)
    return success_response("user registered", "user", data, 201)


async def login(db: AsyncSession, schema: LoginRequest) -> JSONResponse:
    email = schema.email
    password = schema.password
    user, token = await login_user(db, email, password)
    data = auth_payload(user, token)
    return success_response("user logged in", "user", data)


async def me(user: User) -> JSONResponse:
    data = UserRead.model_validate(user)
    return success_response("current user retrieved", "user", data)
