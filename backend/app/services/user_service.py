from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.helpers.exceptions import (
    AuthenticationError,
    ConflictError,
    DatabaseError,
    NotFoundError,
)
from app.helpers.security import create_access_token, hash_password, verify_password
from app.models.user import User


async def list_users(
    db: AsyncSession,
    limit: int,
    offset: int,
) -> tuple[list[User], int]:
    try:
        query = select(User).limit(limit).offset(offset)
        count_query = select(func.count()).select_from(User)
        items = (await db.execute(query)).scalars().all()
        total = (await db.execute(count_query)).scalar_one()
        return list(items), total
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc


async def get_user(db: AsyncSession, user_id: UUID) -> User:
    try:
        user = await db.get(User, user_id)
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc

    if user is None:
        raise NotFoundError("user")
    return user


async def create_user(db: AsyncSession, data: dict) -> User:
    user_data = {
        **data,
        "email": data["email"].lower(),
        "password_hash": hash_password(data["password"]),
    }
    user_data.pop("password")

    user = User(**user_data)
    db.add(user)
    try:
        await db.commit()
        await db.refresh(user)
        return user
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("user") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def update_user(
    db: AsyncSession,
    user_id: UUID,
    data: dict,
) -> User:
    user = await get_user(db, user_id)
    user_data = dict(data)

    if "email" in user_data:
        user_data["email"] = user_data["email"].lower()
    if "password" in user_data:
        user_data["password_hash"] = hash_password(user_data.pop("password"))

    for key, value in user_data.items():
        setattr(user, key, value)

    try:
        await db.commit()
        await db.refresh(user)
        return user
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("user") from exc
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def delete_user(db: AsyncSession, user_id: UUID) -> None:
    user = await get_user(db, user_id)
    try:
        await db.delete(user)
        await db.commit()
    except SQLAlchemyError as exc:
        await db.rollback()
        raise DatabaseError() from exc


async def register_user(db: AsyncSession, data: dict) -> tuple[User, str]:
    user = await create_user(db, data)
    return user, create_access_token(user.id)


async def login_user(
    db: AsyncSession,
    email: str,
    password: str,
) -> tuple[User, str]:
    try:
        user = (
            await db.execute(select(User).where(User.email == email.lower()))
        ).scalar_one_or_none()
    except SQLAlchemyError as exc:
        raise DatabaseError() from exc

    if user is None or not verify_password(password, user.password_hash):
        raise AuthenticationError("email or password is invalid")
    return user, create_access_token(user.id)


async def current_user(db: AsyncSession, user_id: UUID) -> User:
    try:
        return await get_user(db, user_id)
    except NotFoundError as exc:
        raise AuthenticationError("Authentication failed") from exc
