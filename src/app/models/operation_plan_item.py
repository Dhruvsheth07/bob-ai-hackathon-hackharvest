"""
SQLAlchemy model for operation_plan_items table.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class OperationPlanItem(Base):
    __tablename__ = "operation_plan_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    plan_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("operations_plans.id", ondelete="CASCADE"), nullable=False
    )
    vessel_id: Mapped[int] = mapped_column(Integer, ForeignKey("vessels.id"), nullable=False)
    berth_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("berths.id"), nullable=True)
    planned_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    planned_end: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    crane_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    shift_label: Mapped[str | None] = mapped_column(String(50), nullable=True)
    priority: Mapped[str | None] = mapped_column(String(20), nullable=True)

    plan: Mapped["OperationPlan"] = relationship("OperationPlan", back_populates="items")  # type: ignore
    vessel: Mapped["Vessel"] = relationship("Vessel")  # type: ignore
    berth: Mapped["Berth"] = relationship("Berth")  # type: ignore

    def __repr__(self) -> str:
        return f"<OperationPlanItem(id={self.id}, plan_id={self.plan_id}, vessel_id={self.vessel_id})>"
