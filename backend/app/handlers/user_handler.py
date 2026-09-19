from uuid import UUID

from fastapi.responses import JSONResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.responses import empty_response, list_response, success_response
from app.helpers.schemas import PaginationParams, UserCreate, UserRead, UserUpdate
from app.services import user_service
from app.services.base import payload


async def list_users(
    db: AsyncSession,
    pagination: PaginationParams,
) -> JSONResponse:
    items, total = await user_service.list_users(
        db,
        pagination.limit,
        pagination.offset,
    )
    data = [UserRead.model_validate(item) for item in items]
    return list_response(
        "users retrieved",
        "users",
        data,
        total,
        pagination.limit,
        pagination.offset,
    )


async def get_user(db: AsyncSession, user_id: UUID) -> JSONResponse:
    user = await user_service.get_user(db, user_id)
    data = UserRead.model_validate(user)
    return success_response("user retrieved", "user", data)


async def create_user(
    db: AsyncSession,
    schema: UserCreate,
) -> JSONResponse:
    body = payload(schema)
    user = await user_service.create_user(db, body)
    data = UserRead.model_validate(user)
    return success_response("user created", "user", data, 201)


async def update_user(
    db: AsyncSession,
    user_id: UUID,
    schema: UserUpdate,
) -> JSONResponse:
    body = payload(schema)
    user = await user_service.update_user(db, user_id, body)
    data = UserRead.model_validate(user)
    return success_response("user updated", "user", data)


async def delete_user(db: AsyncSession, user_id: UUID) -> Response:
    await user_service.delete_user(db, user_id)
    return empty_response()
