import logging
from http import HTTPStatus

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.helpers.exceptions import AppError, DatabaseError, NotFoundError, ValidationAppError
from app.helpers.responses import error_response

logger = logging.getLogger("ignite_stock")


def field_errors(exc: RequestValidationError) -> dict[str, str]:
    errors: dict[str, str] = {}
    for error in exc.errors():
        loc = [str(part) for part in error.get("loc", []) if part not in ("body", "query", "path")]
        field = ".".join(loc) if loc else "request"
        errors[field] = str(error.get("msg", "invalid value"))
    return errors


def log_error(request: Request, error: AppError, exc: Exception) -> None:
    logger.log(
        logging.ERROR if error.status_code >= 500 else logging.WARNING,
        error.message,
        extra={"error_code": error.code, "method": request.method, "path": request.url.path},
        exc_info=error.status_code >= 500,
    )


async def app_error_handler(request: Request, exc: AppError):
    log_error(request, exc, exc)
    return error_response(exc.code, exc.message, exc.details, exc.status_code)


async def validation_error_handler(request: Request, exc: RequestValidationError):
    error = ValidationAppError(field_errors(exc))
    log_error(request, error, exc)
    return error_response(error.code, error.message, error.details, error.status_code)


async def http_error_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == HTTPStatus.NOT_FOUND:
        error = NotFoundError("endpoint")
    else:
        error = AppError(exc.status_code * 100, str(exc.detail), "http", exc.status_code)
    log_error(request, error, exc)
    return error_response(error.code, error.message, error.details, error.status_code)


async def db_error_handler(request: Request, exc: SQLAlchemyError):
    error = DatabaseError()
    log_error(request, error, exc)
    return error_response(error.code, error.message, error.details, error.status_code)


async def unexpected_error_handler(request: Request, exc: Exception):
    error = AppError(50000, "Unexpected server error", "server", HTTPStatus.INTERNAL_SERVER_ERROR)
    log_error(request, error, exc)
    return error_response(error.code, error.message, error.details, error.status_code)


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_error_handler)
    app.add_exception_handler(SQLAlchemyError, db_error_handler)
    app.add_exception_handler(Exception, unexpected_error_handler)
