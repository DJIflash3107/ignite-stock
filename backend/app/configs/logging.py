import logging
from datetime import datetime, timezone

from app.configs.settings import get_settings

SENSITIVE_KEYS = {"authorization", "password", "password_hash", "token", "jwt_secret_key", "mysql_password", "database_url", "database_sync_url"}


def redact(value: object) -> object:
    if isinstance(value, dict):
        return {key: "***" if key.lower() in SENSITIVE_KEYS else redact(item) for key, item in value.items()}
    if isinstance(value, list):
        return [redact(item) for item in value]
    return value


class AppFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        code = getattr(record, "error_code", "00000")
        path = getattr(record, "path", "-")
        method = getattr(record, "method", "-")
        timestamp = datetime.now(timezone.utc).isoformat()
        message = record.getMessage()
        return f"[{record.levelname}][{code}] {message} | {method} {path} | {timestamp}"


def configure_logging() -> None:
    settings = get_settings()
    logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO), force=True)
    formatter = AppFormatter()
    for handler in logging.getLogger().handlers:
        handler.setFormatter(formatter)
