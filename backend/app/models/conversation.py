from uuid import UUID
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, IdMixin, TimestampMixin


class Conversation(IdMixin, TimestampMixin, Base):
    __tablename__ = "conversations"
    user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True
    )
    investigation_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("investigations.id", ondelete="SET NULL"), index=True, nullable=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    user: Mapped["User | None"] = relationship(back_populates="conversations")
    investigation: Mapped["Investigation | None"] = relationship(
        back_populates="conversations"
    )
    messages: Mapped[list["Message"]] = relationship(back_populates="conversation")
    tool_calls: Mapped[list["AgentToolCall"]] = relationship(
        back_populates="conversation"
    )
