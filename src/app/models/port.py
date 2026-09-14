"""
SQLAlchemy model for the ports table.

Minimal read-only model needed for FK validation and joining.
Maps to the existing 'ports' table.
"""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class Port(Base):
    """Port model — maps to the existing 'ports' table."""

    __tablename__ = "ports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    code: Mapped[str] = mapped_column(String(20), nullable=False)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    timezone: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime, server_default=func.now(), nullable=True
    )

    def __repr__(self) -> str:
        return f"<Port(id={self.id}, name='{self.name}', code='{self.code}')>"
