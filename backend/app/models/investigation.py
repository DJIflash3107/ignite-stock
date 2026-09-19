from datetime import date, datetime
from uuid import UUID
from sqlalchemy import Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, IdMixin
from app.models.base import utc_now


class Investigation(IdMixin, Base):
    __tablename__ = "investigations"
    user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True
    )
    company_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("companies.id", ondelete="SET NULL"), index=True, nullable=True
    )
    index_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("indices.id", ondelete="SET NULL"), index=True, nullable=True
    )
    investigation_type: Mapped[str] = mapped_column(
        String(64), index=True, nullable=False
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    target_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    overall_confidence: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    user: Mapped["User | None"] = relationship(back_populates="investigations")
    company: Mapped["Company | None"] = relationship(back_populates="investigations")
    index: Mapped["MarketIndex | None"] = relationship(back_populates="investigations")
    drivers: Mapped[list["InvestigationDriver"]] = relationship(
        back_populates="investigation"
    )
    evidence_items: Mapped[list["EvidenceItem"]] = relationship(
        back_populates="investigation"
    )
    conversations: Mapped[list["Conversation"]] = relationship(
        back_populates="investigation"
    )
    tool_calls: Mapped[list["AgentToolCall"]] = relationship(
        back_populates="investigation"
    )
