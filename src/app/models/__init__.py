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
from app.models.port import Port  # noqa: E402, F401
from app.models.vessel import Vessel  # noqa: E402, F401
from app.models.vessel_schedule import VesselSchedule  # noqa: E402, F401
from app.models.berth import Berth  # noqa: E402, F401
from app.models.crane import Crane  # noqa: E402, F401
from app.models.congestion_prediction import CongestionPrediction  # noqa: E402, F401
from app.models.optimization_run import OptimizationRun  # noqa: E402, F401
from app.models.berth_assignment import BerthAssignment  # noqa: E402, F401
from app.models.crane_assignment import CraneAssignment  # noqa: E402, F401
