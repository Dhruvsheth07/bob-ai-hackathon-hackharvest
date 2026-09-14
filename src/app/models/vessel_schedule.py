"""
SQLAlchemy model for the vessel_schedules table.

Maps to the existing 'vessel_schedules' table.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class VesselSchedule(Base):
    """Vessel Schedule model — maps to the existing 'vessel_schedules' table."""

    __tablename__ = "vessel_schedules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    vessel_id: Mapped[int] = mapped_column(Integer, ForeignKey("vessels.id"), nullable=False)
    port_id: Mapped[int] = mapped_column(Integer, ForeignKey("ports.id"), nullable=False)
    eta: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    predicted_eta: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    etd: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    containers_teu: Mapped[int | None] = mapped_column(Integer, default=0, nullable=True)
    priority: Mapped[str | None] = mapped_column(String(20), default="NORMAL", nullable=True)
    status: Mapped[str | None] = mapped_column(String(30), default="SCHEDULED", nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime, server_default=func.now(), nullable=True
    )

    # Relationships
    vessel: Mapped["Vessel"] = relationship("Vessel", back_populates="schedules", lazy="joined")
    port: Mapped["Port"] = relationship("Port", lazy="joined")

    def __repr__(self) -> str:
        return f"<VesselSchedule(id={self.id}, vessel_id={self.vessel_id}, port_id={self.port_id})>"
