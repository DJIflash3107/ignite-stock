from functools import lru_cache
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "IgniteStock"
    app_env: str = "local"
    log_level: str = "INFO"
    cors_origins: Annotated[list[str], NoDecode] = Field(default_factory=list)

    mysql_host: str = "localhost"
    mysql_port: int = 3306
    mysql_database: str = "ignite_stock"
    mysql_user: str = "ignite_stock"
    mysql_password: str = "change-me"
    database_url: str | None = None
    database_sync_url: str | None = None

    jwt_secret_key: str = "replace-with-a-long-random-secret"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

    sectors_api_base_url: str = "https://api.sectors.app"
    sectors_api_key: str | None = None
    sectors_api_timeout_seconds: float = Field(default=10.0, gt=0, le=120)
    sectors_api_cache_ttl_seconds: float = Field(default=300.0, ge=0, le=86400)

    openai_api_key: str | None = None
    openai_base_url: str | None = None
    agent_llm_model: str = "openai/gpt-4o-mini"
    agent_llm_temperature: float = Field(default=0.1, ge=0.0, le=1.0)

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @property
    def async_database_url(self) -> str:
        if self.database_url:
            return self.database_url
        return (
            f"mysql+asyncmy://{self.mysql_user}:{self.mysql_password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
        )

    @property
    def sync_database_url(self) -> str:
        if self.database_sync_url:
            return self.database_sync_url
        return self.async_database_url.replace("mysql+asyncmy://", "mysql+pymysql://", 1)


@lru_cache
def get_settings() -> Settings:
    return Settings()
