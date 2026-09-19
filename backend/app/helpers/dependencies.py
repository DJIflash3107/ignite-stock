from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.configs.database import get_db
from app.helpers.exceptions import AuthenticationError
from app.helpers.security import decode_access_token
from app.models.user import User
from app.services.user_service import current_user

bearer_scheme = HTTPBearer(auto_error=False)
DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise AuthenticationError("Authentication failed")
    user_id = decode_access_token(credentials.credentials)
    return await current_user(db, user_id)


CurrentUser = Annotated[User, Depends(get_current_user)]
