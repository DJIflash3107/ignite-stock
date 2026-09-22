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


class SectorsConfigurationError(AppError):
    def __init__(self, message: str = "Sectors API is not configured") -> None:
        super().__init__(76001, message, "sectors", HTTPStatus.SERVICE_UNAVAILABLE)


class SectorsTimeoutError(AppError):
    def __init__(self, message: str = "Sectors API request timed out") -> None:
        super().__init__(76002, message, "sectors", HTTPStatus.GATEWAY_TIMEOUT)


class SectorsConnectionError(AppError):
    def __init__(self, message: str = "Cannot connect to Sectors API") -> None:
        super().__init__(76003, message, "sectors", HTTPStatus.BAD_GATEWAY)


class SectorsRateLimitError(AppError):
    def __init__(self, message: str = "Sectors API rate limit exceeded") -> None:
        super().__init__(76004, message, "sectors", HTTPStatus.TOO_MANY_REQUESTS)


class SectorsUpstreamError(AppError):
    def __init__(
        self,
        message: str = "Sectors API request failed",
        upstream_status: int | None = None,
        upstream_error: str | None = None,
    ) -> None:
        details: dict[str, Any] = {"sectors": message}
        if upstream_status is not None:
            details["upstream_status"] = upstream_status
        if upstream_error:
            details["upstream_error"] = upstream_error
        super().__init__(76005, message, "sectors", HTTPStatus.BAD_GATEWAY, details)


class SectorsInvalidResponseError(AppError):
    def __init__(self, message: str = "Sectors API returned invalid data") -> None:
        super().__init__(76006, message, "sectors", HTTPStatus.BAD_GATEWAY)


class AgentConfigurationError(AppError):
    def __init__(self, message: str = "AI Agent is not configured. Please set OPENAI_API_KEY.") -> None:
        super().__init__(77001, message, "agent", HTTPStatus.SERVICE_UNAVAILABLE)
