"""
SQLAlchemy model for the berths table.
"""

from sqlalchemy import ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class Berth(Base):
    __tablename__ = "berths"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    port_id: Mapped[int] = mapped_column(Integer, ForeignKey("ports.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    length_m: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    max_draft_m: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    capacity_teu: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str | None] = mapped_column(String(30), default="AVAILABLE", nullable=True)

    def __repr__(self) -> str:
        return f"<Berth(id={self.id}, name='{self.name}', status='{self.status}')>"
