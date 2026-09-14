"""
SQLAlchemy model for the recommendations table.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    optimization_run_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("optimization_runs.id"), nullable=True
    )
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str | None] = mapped_column(String(20), default="MEDIUM", nullable=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    expected_impact: Mapped[Any] = mapped_column(JSON, nullable=True)
    status: Mapped[str | None] = mapped_column(String(30), default="PENDING", nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime, server_default=func.now(), nullable=True
    )

    optimization_run: Mapped["OptimizationRun | None"] = relationship("OptimizationRun")  # type: ignore

    def __repr__(self) -> str:
        return f"<Recommendation(id={self.id}, type='{self.type}', status='{self.status}')>"
