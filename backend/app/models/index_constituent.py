from datetime import date
from decimal import Decimal
from uuid import UUID
from sqlalchemy import Date, ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, IdMixin, TimestampMixin


class IndexConstituent(IdMixin, TimestampMixin, Base):
    __tablename__ = "index_constituents"
    __table_args__ = (
        UniqueConstraint(
            "index_id",
            "company_id",
            "effective_from",
            name="uq_index_constituents_index_company_from",
        ),
    )
    index_id: Mapped[UUID] = mapped_column(
        ForeignKey("indices.id", ondelete="CASCADE"), index=True, nullable=False
    )
    company_id: Mapped[UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=False
    )
    weight: Mapped[Decimal | None] = mapped_column(Numeric(10, 6), nullable=True)
    effective_from: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    effective_to: Mapped[date | None] = mapped_column(Date, nullable=True)
    index: Mapped["MarketIndex"] = relationship(back_populates="constituents")
    company: Mapped["Company"] = relationship(back_populates="index_constituents")
