from datetime import date, datetime
from decimal import Decimal
from uuid import UUID
from sqlalchemy import (
    BigInteger,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, IdMixin
from app.models.base import utc_now


class PriceSnapshot(IdMixin, Base):
    __tablename__ = "price_snapshots"
    __table_args__ = (
        UniqueConstraint(
            "company_id", "trade_date", name="uq_price_snapshots_company_trade_date"
        ),
    )
    company_id: Mapped[UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=False
    )
    trade_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    open: Mapped[Decimal] = mapped_column(Numeric(20, 6), nullable=False)
    high: Mapped[Decimal] = mapped_column(Numeric(20, 6), nullable=False)
    low: Mapped[Decimal] = mapped_column(Numeric(20, 6), nullable=False)
    close: Mapped[Decimal] = mapped_column(Numeric(20, 6), nullable=False)
    volume: Mapped[int] = mapped_column(BigInteger, nullable=False)
    market_cap: Mapped[Decimal | None] = mapped_column(Numeric(20, 4), nullable=True)
    return_1d: Mapped[Decimal | None] = mapped_column(Numeric(12, 6), nullable=True)
    return_7d: Mapped[Decimal | None] = mapped_column(Numeric(12, 6), nullable=True)
    return_30d: Mapped[Decimal | None] = mapped_column(Numeric(12, 6), nullable=True)
    source: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    company: Mapped["Company"] = relationship(back_populates="price_snapshots")
