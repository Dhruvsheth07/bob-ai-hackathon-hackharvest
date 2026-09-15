"""
SQLAlchemy model for simulations table.
"""

from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class Simulation(Base):
    __tablename__ = "simulations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    port_id: Mapped[int] = mapped_column(Integer, ForeignKey("ports.id"), nullable=False)
    scenario_type: Mapped[str] = mapped_column(String(50), nullable=False)
    scenario_parameters: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    baseline_metrics: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    simulated_metrics: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    impact_summary: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    mitigation_recommendations: Mapped[list | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str | None] = mapped_column(String(30), default="PENDING", nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime, server_default=func.now(), nullable=True
    )

    port: Mapped["Port"] = relationship("Port")  # type: ignore

    def __repr__(self) -> str:
        return f"<Simulation(id={self.id}, port_id={self.port_id}, type='{self.scenario_type}', status='{self.status}')>"
