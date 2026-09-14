"""
SQLAlchemy model for the vessels table.

Maps to the existing 'vessels' table.
"""

from datetime import datetime

from sqlalchemy import DateTime, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class Vessel(Base):
    """Vessel model — maps to the existing 'vessels' table."""

    __tablename__ = "vessels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    imo_number: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    length_m: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    draft_m: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    capacity_teu: Mapped[int | None] = mapped_column(Integer, nullable=True)
    vessel_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime, server_default=func.now(), nullable=True
    )

    # Relationships
    schedules: Mapped[list["VesselSchedule"]] = relationship(
        "VesselSchedule", back_populates="vessel", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Vessel(id={self.id}, name='{self.name}', imo='{self.imo_number}')>"
