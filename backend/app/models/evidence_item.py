from datetime import datetime
from typing import Any
from uuid import UUID
from sqlalchemy import DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, IdMixin, TimestampMixin


class EvidenceItem(IdMixin, TimestampMixin, Base):
    __tablename__ = "evidence_items"
    investigation_id: Mapped[UUID] = mapped_column(
        ForeignKey("investigations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    driver_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("investigation_drivers.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    evidence_type: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    data: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    source_type: Mapped[str] = mapped_column(String(255), nullable=False)
    source_reference: Mapped[str | None] = mapped_column(Text, nullable=True)
    alignment: Mapped[str | None] = mapped_column(String(32), nullable=True)
    observed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    investigation: Mapped["Investigation"] = relationship(
        back_populates="evidence_items"
    )
    driver: Mapped["InvestigationDriver | None"] = relationship(
        back_populates="evidence_items"
    )
