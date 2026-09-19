from uuid import UUID
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, IdMixin, TimestampMixin


class Sector(IdMixin, TimestampMixin, Base):
    __tablename__ = "sectors"
    code: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    parent_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("sectors.id", ondelete="SET NULL"), index=True, nullable=True
    )
    parent: Mapped["Sector | None"] = relationship(
        remote_side="Sector.id", back_populates="children"
    )
    children: Mapped[list["Sector"]] = relationship(back_populates="parent")
    companies: Mapped[list["Company"]] = relationship(back_populates="sector")
