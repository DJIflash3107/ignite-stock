from http import HTTPStatus
from typing import Any


class AppError(Exception):
    def __init__(self, code: int, message: str, key: str, status_code: int, details: dict[str, Any] | None = None) -> None:
        self.code = code
        self.message = message
        self.key = key
        self.status_code = status_code
        self.details = details or {key: message}
        super().__init__(message)


class AuthenticationError(AppError):
    def __init__(self, message: str = "Authentication failed") -> None:
        super().__init__(23456, message, "authentication", HTTPStatus.UNAUTHORIZED)


class AuthorizationError(AppError):
    def __init__(self, message: str = "Permission denied") -> None:
        super().__init__(23457, message, "authorization", HTTPStatus.FORBIDDEN)


class NotFoundError(AppError):
    def __init__(self, entity: str = "resource") -> None:
        super().__init__(40404, f"{entity} not found", entity, HTTPStatus.NOT_FOUND)


class ConflictError(AppError):
    def __init__(self, entity: str = "resource", message: str = "already exists") -> None:
        super().__init__(40909, f"{entity} {message}", entity, HTTPStatus.CONFLICT)


class DatabaseError(AppError):
    def __init__(self, message: str = "Cannot connect to database") -> None:
        super().__init__(67787, message, "database", HTTPStatus.SERVICE_UNAVAILABLE)


class ValidationAppError(AppError):
    def __init__(self, details: dict[str, Any]) -> None:
        super().__init__(12345, "Validation failed", "validation", HTTPStatus.UNPROCESSABLE_ENTITY, details)
