"""
SQLAlchemy model for crane_assignments table.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class CraneAssignment(Base):
    __tablename__ = "crane_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    vessel_schedule_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("vessel_schedules.id"), nullable=False
    )
    crane_id: Mapped[int] = mapped_column(Integer, ForeignKey("cranes.id"), nullable=False)
    optimization_run_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("optimization_runs.id"), nullable=True
    )
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    productivity_teu_per_hour: Mapped[int | None] = mapped_column(Integer, nullable=True)

    vessel_schedule: Mapped["VesselSchedule"] = relationship("VesselSchedule")  # type: ignore
    crane: Mapped["Crane"] = relationship("Crane")  # type: ignore

    def __repr__(self) -> str:
        return f"<CraneAssignment(id={self.id}, vessel_schedule_id={self.vessel_schedule_id}, crane_id={self.crane_id})>"
