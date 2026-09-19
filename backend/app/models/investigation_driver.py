from uuid import UUID
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, IdMixin, TimestampMixin


class InvestigationDriver(IdMixin, TimestampMixin, Base):
    __tablename__ = "investigation_drivers"
    investigation_id: Mapped[UUID] = mapped_column(
        ForeignKey("investigations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    driver_type: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[str] = mapped_column(String(64), nullable=False)
    impact_level: Mapped[str] = mapped_column(String(64), nullable=False)
    rank: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    investigation: Mapped["Investigation"] = relationship(back_populates="drivers")
    evidence_items: Mapped[list["EvidenceItem"]] = relationship(back_populates="driver")
