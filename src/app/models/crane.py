"""
SQLAlchemy model for the cranes table.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class Crane(Base):
    __tablename__ = "cranes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    port_id: Mapped[int] = mapped_column(Integer, ForeignKey("ports.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    crane_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    capacity_tph: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str | None] = mapped_column(String(30), default="AVAILABLE", nullable=True)
    availability_start: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    availability_end: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"<Crane(id={self.id}, name='{self.name}', status='{self.status}')>"
