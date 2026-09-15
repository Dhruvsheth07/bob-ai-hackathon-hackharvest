"""
SQLAlchemy model for operations_plans table.
"""

from datetime import datetime
from typing import Any, Dict

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class OperationPlan(Base):
    __tablename__ = "operations_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    port_id: Mapped[int] = mapped_column(Integer, ForeignKey("ports.id"), nullable=False)
    optimization_run_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("optimization_runs.id"), nullable=True
    )
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    horizon_hours: Mapped[int] = mapped_column(Integer, default=72, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="DRAFT", nullable=False)
    
    # JSON fields to store the dynamically calculated plan data
    summary_metrics: Mapped[Dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    congestion_windows: Mapped[Dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    recommendations: Mapped[Dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    
    created_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime, server_default=func.now(), nullable=True
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=True
    )

    port: Mapped["Port"] = relationship("Port")  # type: ignore
    optimization_run: Mapped["OptimizationRun"] = relationship("OptimizationRun")  # type: ignore
    items: Mapped[list["OperationPlanItem"]] = relationship("OperationPlanItem", back_populates="plan", cascade="all, delete-orphan")  # type: ignore

    def __repr__(self) -> str:
        return f"<OperationPlan(id={self.id}, port_id={self.port_id}, status='{self.status}')>"
