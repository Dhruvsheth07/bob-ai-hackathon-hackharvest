"""
SQLAlchemy model for the roles table.

Maps to the existing 'roles' table in PostgreSQL.
Do NOT create or modify this table — it already exists with seeded data.
"""

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class Role(Base):
    """Role model — maps to the existing 'roles' table."""

    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    # Relationship
    users: Mapped[list["User"]] = relationship("User", back_populates="role")

    def __repr__(self) -> str:
        return f"<Role(id={self.id}, name='{self.name}')>"
