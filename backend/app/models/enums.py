from enum import StrEnum


class InvestigationType(StrEnum):
    COMPANY = "company"
    INDEX = "index"
    SECTOR = "sector"
    GENERAL = "general"


class InvestigationStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ConfidenceLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class DriverType(StrEnum):
    PRICE = "price"
    VOLUME = "volume"
    FUNDAMENTAL = "fundamental"
    NEWS = "news"
    SECTOR = "sector"
    CORPORATE_ACTION = "corporate_action"
    MARKET = "market"
    OTHER = "other"


class ImpactLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class EvidenceType(StrEnum):
    PRICE = "price"
    FINANCIAL = "financial"
    NEWS = "news"
    FILING = "filing"
    MARKET = "market"
    OTHER = "other"


class EvidenceAlignment(StrEnum):
    SUPPORTING = "supporting"
    CONTRADICTORY = "contradictory"
    NEUTRAL = "neutral"


class MessageRole(StrEnum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    TOOL = "tool"


class ToolCallStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
