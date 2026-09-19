from decimal import Decimal
from uuid import UUID
from sqlalchemy import Boolean, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, IdMixin, TimestampMixin


class Company(IdMixin, TimestampMixin, Base):
    __tablename__ = "companies"
    ticker: Mapped[str] = mapped_column(
        String(32), unique=True, index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sector_id: Mapped[UUID] = mapped_column(
        ForeignKey("sectors.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    subsector: Mapped[str | None] = mapped_column(String(255), nullable=True)
    market_cap: Mapped[Decimal | None] = mapped_column(Numeric(20, 4), nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, index=True
    )
    sector: Mapped["Sector"] = relationship(back_populates="companies")
    index_constituents: Mapped[list["IndexConstituent"]] = relationship(
        back_populates="company"
    )
    price_snapshots: Mapped[list["PriceSnapshot"]] = relationship(
        back_populates="company"
    )
    investigations: Mapped[list["Investigation"]] = relationship(
        back_populates="company"
    )
