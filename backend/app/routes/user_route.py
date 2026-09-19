from uuid import UUID
from fastapi import APIRouter, Depends
from app.helpers.dependencies import DbSession, get_current_user
from app.helpers.schemas import PaginationParams, UserCreate, UserUpdate
from app.handlers.user_handler import (
    list_users,
    get_user,
    create_user,
    update_user,
    delete_user,
)

router = APIRouter(
    prefix="/users", tags=["users"], dependencies=[Depends(get_current_user)]
)


@router.post("", status_code=201)
async def create(schema: UserCreate, db: DbSession):
    return await create_user(db, schema)


@router.get("")
async def list_(db: DbSession, pagination: PaginationParams = Depends()):
    return await list_users(db, pagination)


@router.get("/{user_id}")
async def get(user_id: UUID, db: DbSession):
    return await get_user(db, user_id)


@router.patch("/{user_id}")
async def update(user_id: UUID, schema: UserUpdate, db: DbSession):
    return await update_user(db, user_id, schema)


@router.delete("/{user_id}", status_code=204)
async def delete(user_id: UUID, db: DbSession):
    return await delete_user(db, user_id)
