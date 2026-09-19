from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, IdMixin, TimestampMixin


class MarketIndex(IdMixin, TimestampMixin, Base):
    __tablename__ = "indices"
    code: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, index=True
    )
    constituents: Mapped[list["IndexConstituent"]] = relationship(
        back_populates="index"
    )
    investigations: Mapped[list["Investigation"]] = relationship(back_populates="index")
