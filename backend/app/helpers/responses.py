from typing import Any

from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel


def dump(value: Any) -> Any:
    if isinstance(value, BaseModel):
        return value.model_dump(mode="json")
    if isinstance(value, list):
        return [dump(item) for item in value]
    return value


def success_response(message: str, key: str, value: Any, status_code: int = 200) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"message": {"success": message}, "data": {key: dump(value)}},
    )


def list_response(message: str, key: str, value: list[Any], total: int, limit: int, offset: int) -> JSONResponse:
    return JSONResponse(
        content={
            "message": {"success": message},
            "data": {key: dump(value), "pagination": {"total": total, "limit": limit, "offset": offset}},
        }
    )


def empty_response() -> Response:
    return Response(status_code=204)


def error_response(code: int, message: str, errors: dict[str, Any], status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"message": {"error": f"{code}: {message}"}, "error": errors},
    )
