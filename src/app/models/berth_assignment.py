"""
SQLAlchemy model for berth_assignments table.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class BerthAssignment(Base):
    __tablename__ = "berth_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    vessel_schedule_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("vessel_schedules.id"), nullable=False
    )
    berth_id: Mapped[int] = mapped_column(Integer, ForeignKey("berths.id"), nullable=False)
    optimization_run_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("optimization_runs.id"), nullable=True
    )
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str | None] = mapped_column(String(30), default="PLANNED", nullable=True)

    vessel_schedule: Mapped["VesselSchedule"] = relationship("VesselSchedule")  # type: ignore
    berth: Mapped["Berth"] = relationship("Berth")  # type: ignore

    def __repr__(self) -> str:
        return f"<BerthAssignment(id={self.id}, vessel_schedule_id={self.vessel_schedule_id}, berth_id={self.berth_id})>"
