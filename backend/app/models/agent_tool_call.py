from typing import Any
from uuid import UUID
from sqlalchemy import ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, IdMixin, TimestampMixin


class AgentToolCall(IdMixin, TimestampMixin, Base):
    __tablename__ = "agent_tool_calls"
    conversation_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("conversations.id", ondelete="SET NULL"), index=True, nullable=True
    )
    investigation_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("investigations.id", ondelete="SET NULL"), index=True, nullable=True
    )
    tool_name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    arguments: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    result: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    execution_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    conversation: Mapped["Conversation | None"] = relationship(
        back_populates="tool_calls"
    )
    investigation: Mapped["Investigation | None"] = relationship(
        back_populates="tool_calls"
    )
