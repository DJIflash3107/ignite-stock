from datetime import date, datetime, timedelta
from typing import Any
from uuid import UUID

from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.models.enums import (
    ConfidenceLevel,
    DriverType,
    EvidenceAlignment,
    EvidenceType,
    ImpactLevel,
    InvestigationStatus,
    InvestigationType,
    MessageRole,
    ToolCallStatus,
)


class PaginationParams(BaseModel):
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class OrmSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower()


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=255)


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8, max_length=255)


class UserRead(UserBase, OrmSchema):
    id: UUID
    role: str
    created_at: datetime
    updated_at: datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower()


class TokenRead(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SectorsSubsectorRead(BaseModel):
    sector: str = Field(min_length=1)
    subsector: str = Field(min_length=1)


class MarketOverviewQuery(BaseModel):
    start: date | None = None
    end: date | None = None
    index_code: str | None = Field(default=None, min_length=1, max_length=64)

    @field_validator("index_code")
    @classmethod
    def normalize_index_code(cls, value: str | None) -> str | None:
        return value.strip().upper() if value else value

    @model_validator(mode="after")
    def validate_dates(self):
        self.resolved_dates()
        return self

    def resolved_dates(self) -> tuple[date, date]:
        resolved_end = self.end or date.today()
        resolved_start = self.start or resolved_end - timedelta(days=30)
        if resolved_start < date(2021, 1, 1):
            raise ValueError("start must not be earlier than 2021-01-01")
        if resolved_end > date.today():
            raise ValueError("end must not be in the future")
        if resolved_start > resolved_end:
            raise ValueError("start must not be after end")
        if (resolved_end - resolved_start).days > 90:
            raise ValueError("date range must not exceed 90 days")
        return resolved_start, resolved_end


class MarketMoversQuery(BaseModel):
    period: str = Field(default="1d", pattern="^(1d|7d|14d|30d|365d)$")
    classification: str = Field(default="top_gainers,top_losers")
    limit: int = Field(default=5, ge=1, le=10)
    sub_sector: str | None = Field(default=None, min_length=1, max_length=128)
    min_mcap_billion: int | None = Field(default=None, ge=0)

    @field_validator("classification")
    @classmethod
    def validate_classification(cls, value: str) -> str:
        choices = {item.strip() for item in value.split(",") if item.strip()}
        if not choices or not choices.issubset({"top_gainers", "top_losers"}):
            raise ValueError("classification must contain top_gainers and/or top_losers")
        return ",".join(item for item in ("top_gainers", "top_losers") if item in choices)

    @field_validator("sub_sector")
    @classmethod
    def normalize_sub_sector(cls, value: str | None) -> str | None:
        return value.strip().lower() if value else value


class MarketMoverRead(BaseModel):
    classification: str
    period: str
    ticker: str
    company_name: str
    price_change: float
    last_close_price: float
    latest_close_date: date


class MarketCapPointRead(BaseModel):
    date: date
    idx_total_market_cap: float


class IndexCloseRead(BaseModel):
    index_code: str = Field(min_length=1)
    date: date
    price: float


class MarketOverviewRead(BaseModel):
    start: date
    end: date
    market_cap_series: list[MarketCapPointRead]
    market_cap_change: dict[str, float | None]
    index_series: list[IndexCloseRead]


class SectorPerformanceRead(BaseModel):
    sector_code: str
    sector_name: str
    subsector: str
    report: dict[str, Any]


class CompanyMarketContextRead(BaseModel):
    ticker: str
    company_name: str
    overview: dict[str, Any]
    valuation: dict[str, Any]
    market_comparison: dict[str, float | None]
    sector_comparison: dict[str, float | None]
    peers: list[dict[str, Any]]


class DateRangeIndexQuery(BaseModel):
    start: date | None = None
    end: date | None = None
    index_code: str = Field(default="IHSG", min_length=1, max_length=64)

    @field_validator("index_code")
    @classmethod
    def normalize_index_code(cls, value: str) -> str:
        return value.strip().upper()

    @model_validator(mode="after")
    def validate_dates(self):
        self.resolved_dates()
        return self

    def resolved_dates(self) -> tuple[date, date]:
        resolved_end = self.end or date.today()
        resolved_start = self.start or resolved_end - timedelta(days=30)
        if resolved_start < date(2021, 1, 1):
            raise ValueError("start must not be earlier than 2021-01-01")
        if resolved_end > date.today():
            raise ValueError("end must not be in the future")
        if resolved_start > resolved_end:
            raise ValueError("start must not be after end")
        if (resolved_end - resolved_start).days > 90:
            raise ValueError("date range must not exceed 90 days")
        return resolved_start, resolved_end


class MarketImpactQuery(DateRangeIndexQuery):
    limit: int = Field(default=5, ge=1, le=20)


class CompanyImpactQuery(DateRangeIndexQuery):
    pass


class StockContributorRead(BaseModel):
    ticker: str
    company_name: str
    price_change: float
    market_cap: float
    estimated_weight: float
    estimated_contribution: float


class MarketImpactRead(BaseModel):
    start: date
    end: date
    index_code: str
    index_return: float | None
    market_return: float | None
    relative_performance: float | None
    weight_source: str = "estimated_market_cap_share"
    top_contributors: list[StockContributorRead]


class CompanyImpactRead(BaseModel):
    ticker: str
    company_name: str
    sub_sector: str | None
    start: date
    end: date
    index_code: str
    stock_return: float | None
    index_return: float | None
    market_return: float | None
    sector_return: float | None
    relative_to_index: float | None
    relative_to_sector: float | None
    estimated_weight: float | None
    estimated_contribution: float | None
    weight_source: str = "estimated_market_cap_share"
    peers: list[dict[str, Any]]


class InvestigationCreate(BaseModel):
    user_id: UUID | None = None
    company_ticker: str | None = Field(default=None, min_length=1, max_length=32)
    index_code: str | None = Field(default=None, min_length=1, max_length=64)
    investigation_type: InvestigationType
    question: str = Field(min_length=1)
    target_date: date
    status: InvestigationStatus = InvestigationStatus.PENDING
    summary: str | None = None
    overall_confidence: ConfidenceLevel | None = None
    completed_at: datetime | None = None

    @field_validator("company_ticker")
    @classmethod
    def normalize_company_ticker(cls, value: str | None) -> str | None:
        return value.strip().upper() if value else value

    @field_validator("index_code")
    @classmethod
    def normalize_investigation_index_code(cls, value: str | None) -> str | None:
        return value.strip().upper() if value else value


class InvestigationUpdate(BaseModel):
    user_id: UUID | None = None
    company_ticker: str | None = Field(default=None, min_length=1, max_length=32)
    index_code: str | None = Field(default=None, min_length=1, max_length=64)
    investigation_type: InvestigationType | None = None
    question: str | None = Field(default=None, min_length=1)
    target_date: date | None = None
    status: InvestigationStatus | None = None
    summary: str | None = None
    overall_confidence: ConfidenceLevel | None = None
    completed_at: datetime | None = None

    @field_validator("company_ticker")
    @classmethod
    def normalize_company_ticker(cls, value: str | None) -> str | None:
        return value.strip().upper() if value else value

    @field_validator("index_code")
    @classmethod
    def normalize_investigation_index_code(cls, value: str | None) -> str | None:
        return value.strip().upper() if value else value


class InvestigationRead(InvestigationCreate, OrmSchema):
    id: UUID
    created_at: datetime


class InvestigationAnalyzeRequest(BaseModel):
    company_ticker: str = Field(min_length=1, max_length=32)
    target_date: date
    question: str | None = None
    index_code: str = Field(default="IHSG", min_length=1, max_length=64)
    peer_limit: int = Field(default=5, ge=1, le=20)
    news_limit: int = Field(default=10, ge=1, le=50)
    filings_limit: int = Field(default=10, ge=1, le=50)

    @field_validator("company_ticker")
    @classmethod
    def normalize_company_ticker(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("index_code")
    @classmethod
    def normalize_index_code(cls, value: str) -> str:
        return value.strip().upper()


class InvestigationDriverCreate(BaseModel):
    investigation_id: UUID
    driver_type: DriverType
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    confidence: ConfidenceLevel
    impact_level: ImpactLevel
    rank: int = Field(ge=1)


class InvestigationDriverUpdate(BaseModel):
    investigation_id: UUID | None = None
    driver_type: DriverType | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    confidence: ConfidenceLevel | None = None
    impact_level: ImpactLevel | None = None
    rank: int | None = Field(default=None, ge=1)


class InvestigationDriverRead(InvestigationDriverCreate, OrmSchema):
    id: UUID
    created_at: datetime
    updated_at: datetime


class EvidenceItemCreate(BaseModel):
    investigation_id: UUID
    driver_id: UUID | None = None
    evidence_type: EvidenceType
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    data: dict[str, Any]
    source_type: str = Field(min_length=1, max_length=255)
    source_reference: str | None = None
    alignment: EvidenceAlignment | str | None = None
    observed_at: datetime | None = None


class EvidenceItemUpdate(BaseModel):
    investigation_id: UUID | None = None
    driver_id: UUID | None = None
    evidence_type: EvidenceType | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    data: dict[str, Any] | None = None
    source_type: str | None = Field(default=None, min_length=1, max_length=255)
    source_reference: str | None = None
    alignment: EvidenceAlignment | str | None = None
    observed_at: datetime | None = None


class EvidenceItemRead(EvidenceItemCreate, OrmSchema):
    id: UUID
    created_at: datetime
    updated_at: datetime


class InvestigationDetailRead(InvestigationRead):
    drivers: list[InvestigationDriverRead] = []
    evidence_items: list[EvidenceItemRead] = []


class ConversationCreate(BaseModel):
    user_id: UUID | None = None
    investigation_id: UUID | None = None
    title: str = Field(min_length=1, max_length=255)


class ConversationUpdate(BaseModel):
    user_id: UUID | None = None
    investigation_id: UUID | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)


class ConversationRead(ConversationCreate, OrmSchema):
    id: UUID
    created_at: datetime
    updated_at: datetime


class MessageCreate(BaseModel):
    conversation_id: UUID
    role: MessageRole
    content: str = Field(min_length=1)
    metadata: dict[str, Any] | None = None


class MessageUpdate(BaseModel):
    conversation_id: UUID | None = None
    role: MessageRole | None = None
    content: str | None = Field(default=None, min_length=1)
    metadata: dict[str, Any] | None = None


class MessageRead(MessageCreate, OrmSchema):
    metadata: dict[str, Any] | None = Field(
        default=None,
        validation_alias=AliasChoices("metadata", "meta_data"),
        serialization_alias="metadata",
    )
    id: UUID
    created_at: datetime
    updated_at: datetime


class AgentToolCallCreate(BaseModel):
    conversation_id: UUID | None = None
    investigation_id: UUID | None = None
    tool_name: str = Field(min_length=1, max_length=255)
    arguments: dict[str, Any]
    result: dict[str, Any] | None = None
    status: ToolCallStatus = ToolCallStatus.PENDING
    execution_time_ms: int | None = Field(default=None, ge=0)


class AgentToolCallUpdate(BaseModel):
    conversation_id: UUID | None = None
    investigation_id: UUID | None = None
    tool_name: str | None = Field(default=None, min_length=1, max_length=255)
    arguments: dict[str, Any] | None = None
    result: dict[str, Any] | None = None
    status: ToolCallStatus | None = None
    execution_time_ms: int | None = Field(default=None, ge=0)


class AgentToolCallRead(AgentToolCallCreate, OrmSchema):
    id: UUID
    created_at: datetime
    updated_at: datetime
