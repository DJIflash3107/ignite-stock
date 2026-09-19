from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.enums import ConfidenceLevel, DriverType, EvidenceType, ImpactLevel, InvestigationStatus, InvestigationType, MessageRole, ToolCallStatus


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


class SectorCreate(BaseModel):
    code: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=255)
    parent_id: UUID | None = None


class SectorUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=64)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    parent_id: UUID | None = None


class SectorRead(SectorCreate, OrmSchema):
    id: UUID
    created_at: datetime
    updated_at: datetime


class CompanyCreate(BaseModel):
    ticker: str = Field(min_length=1, max_length=32)
    name: str = Field(min_length=1, max_length=255)
    sector_id: UUID
    subsector: str | None = Field(default=None, max_length=255)
    market_cap: Decimal | None = Field(default=None, ge=0)
    is_active: bool = True


class CompanyUpdate(BaseModel):
    ticker: str | None = Field(default=None, min_length=1, max_length=32)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    sector_id: UUID | None = None
    subsector: str | None = Field(default=None, max_length=255)
    market_cap: Decimal | None = Field(default=None, ge=0)
    is_active: bool | None = None


class CompanyRead(CompanyCreate, OrmSchema):
    id: UUID
    created_at: datetime
    updated_at: datetime


class IndexCreate(BaseModel):
    code: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=255)
    is_active: bool = True


class IndexUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=64)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    is_active: bool | None = None


class IndexRead(IndexCreate, OrmSchema):
    id: UUID
    created_at: datetime
    updated_at: datetime


class IndexConstituentCreate(BaseModel):
    index_id: UUID
    company_id: UUID
    weight: Decimal | None = Field(default=None, ge=0)
    effective_from: date
    effective_to: date | None = None


class IndexConstituentUpdate(BaseModel):
    index_id: UUID | None = None
    company_id: UUID | None = None
    weight: Decimal | None = Field(default=None, ge=0)
    effective_from: date | None = None
    effective_to: date | None = None


class IndexConstituentRead(IndexConstituentCreate, OrmSchema):
    id: UUID
    created_at: datetime
    updated_at: datetime


class PriceSnapshotCreate(BaseModel):
    company_id: UUID
    trade_date: date
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: int = Field(ge=0)
    market_cap: Decimal | None = Field(default=None, ge=0)
    return_1d: Decimal | None = None
    return_7d: Decimal | None = None
    return_30d: Decimal | None = None
    source: str = Field(min_length=1, max_length=255)


class PriceSnapshotUpdate(BaseModel):
    company_id: UUID | None = None
    trade_date: date | None = None
    open: Decimal | None = None
    high: Decimal | None = None
    low: Decimal | None = None
    close: Decimal | None = None
    volume: int | None = Field(default=None, ge=0)
    market_cap: Decimal | None = Field(default=None, ge=0)
    return_1d: Decimal | None = None
    return_7d: Decimal | None = None
    return_30d: Decimal | None = None
    source: str | None = Field(default=None, min_length=1, max_length=255)


class PriceSnapshotRead(PriceSnapshotCreate, OrmSchema):
    id: UUID
    created_at: datetime


class InvestigationCreate(BaseModel):
    user_id: UUID | None = None
    company_id: UUID | None = None
    index_id: UUID | None = None
    investigation_type: InvestigationType
    question: str = Field(min_length=1)
    target_date: date
    status: InvestigationStatus = InvestigationStatus.PENDING
    summary: str | None = None
    overall_confidence: ConfidenceLevel | None = None
    completed_at: datetime | None = None


class InvestigationUpdate(BaseModel):
    user_id: UUID | None = None
    company_id: UUID | None = None
    index_id: UUID | None = None
    investigation_type: InvestigationType | None = None
    question: str | None = Field(default=None, min_length=1)
    target_date: date | None = None
    status: InvestigationStatus | None = None
    summary: str | None = None
    overall_confidence: ConfidenceLevel | None = None
    completed_at: datetime | None = None


class InvestigationRead(InvestigationCreate, OrmSchema):
    id: UUID
    created_at: datetime


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
    observed_at: datetime | None = None


class EvidenceItemRead(EvidenceItemCreate, OrmSchema):
    id: UUID
    created_at: datetime
    updated_at: datetime


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
    metadata: dict[str, Any] | None = Field(default=None, validation_alias=AliasChoices("metadata", "meta_data"), serialization_alias="metadata")
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
