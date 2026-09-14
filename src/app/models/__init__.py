"""
SQLAlchemy declarative base for all ORM models.

Import Base here and use it in all model files so that Alembic
can discover models via a single metadata object.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""

    pass


# Import all models so that Base.metadata is populated for Alembic
from app.models.role import Role  # noqa: E402, F401
from app.models.user import User  # noqa: E402, F401
