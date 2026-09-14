"""
SQLAlchemy model for optimization_runs table.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class OptimizationRun(Base):
    __tablename__ = "optimization_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    port_id: Mapped[int] = mapped_column(Integer, ForeignKey("ports.id"), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    horizon_hours: Mapped[int | None] = mapped_column(Integer, default=72, nullable=True)
    objective_value: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    status: Mapped[str | None] = mapped_column(String(30), default="PENDING", nullable=True)
    created_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime, server_default=func.now(), nullable=True
    )

    port: Mapped["Port"] = relationship("Port")  # type: ignore

    def __repr__(self) -> str:
        return f"<OptimizationRun(id={self.id}, port_id={self.port_id}, status='{self.status}')>"
