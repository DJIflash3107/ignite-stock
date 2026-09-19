from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.configs.logging import configure_logging
from app.configs.settings import get_settings
from app.helpers.responses import success_response
from app.middlewares.error_handlers import register_exception_handlers
from app.middlewares.request_context import RequestContextMiddleware
from app.routes import api_router

settings = get_settings()
configure_logging()

app = FastAPI(title=settings.app_name)
app.add_middleware(RequestContextMiddleware)
if settings.cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
register_exception_handlers(app)
app.include_router(api_router)


@app.get("/health")
async def health():
    return success_response("service healthy", "health", {"status": "ok"})
