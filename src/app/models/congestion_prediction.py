"""
SQLAlchemy model for the congestion_predictions table.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class CongestionPrediction(Base):
    __tablename__ = "congestion_predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    port_id: Mapped[int] = mapped_column(Integer, ForeignKey("ports.id"), nullable=False)
    prediction_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    berth_utilization: Mapped[float | None] = mapped_column(Numeric(5, 4), nullable=True)
    crane_utilization: Mapped[float | None] = mapped_column(Numeric(5, 4), nullable=True)
    yard_utilization: Mapped[float | None] = mapped_column(Numeric(5, 4), nullable=True)
    arrival_pressure: Mapped[float | None] = mapped_column(Numeric(5, 4), nullable=True)
    congestion_score: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False)
    model_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime, server_default=func.now(), nullable=True
    )

    # Relationship for convenience
    port: Mapped["Port"] = relationship("Port", lazy="joined")  # type: ignore

    def __repr__(self) -> str:
        return (
            f"<CongestionPrediction(id={self.id}, port_id={self.port_id}, "
            f"risk='{self.risk_level}', score={self.congestion_score})>"
        )
