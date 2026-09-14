"""
Feature extractor: computes utilization features from live DB data.

Features:
    berth_utilization  — fraction of berths NOT in AVAILABLE status
    crane_utilization  — fraction of cranes NOT in AVAILABLE status
    arrival_pressure   — fraction of upcoming arrivals vs berth capacity (capped at 1.0)
    yard_utilization   — DEFERRED: always 0.0 until a yard-occupancy table is added

All features are in [0.0, 1.0].
"""

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.berth import Berth
from app.models.crane import Crane
from app.models.vessel_schedule import VesselSchedule
from app.schemas.prediction import PredictionFeatures

# Look-ahead window for arrival pressure calculation
ARRIVAL_WINDOW_HOURS = 12


def _safe_ratio(numerator: int, denominator: int, fallback: float = 0.0) -> float:
    """Return numerator/denominator, or fallback if denominator is 0."""
    if denominator == 0:
        return fallback
    return min(1.0, numerator / denominator)


def compute_berth_utilization(db: Session, port_id: int) -> float:
    """
    Fraction of berths at this port that are NOT 'AVAILABLE'.
    Returns 0.0 if the port has no berths.
    """
    total = db.query(Berth).filter(Berth.port_id == port_id).count()
    unavailable = (
        db.query(Berth)
        .filter(Berth.port_id == port_id, Berth.status != "AVAILABLE")
        .count()
    )
    return _safe_ratio(unavailable, total)


def compute_crane_utilization(db: Session, port_id: int) -> float:
    """
    Fraction of cranes at this port that are NOT 'AVAILABLE'.
    Returns 0.0 if the port has no cranes.
    """
    total = db.query(Crane).filter(Crane.port_id == port_id).count()
    unavailable = (
        db.query(Crane)
        .filter(Crane.port_id == port_id, Crane.status != "AVAILABLE")
        .count()
    )
    return _safe_ratio(unavailable, total)


def compute_arrival_pressure(
    db: Session, port_id: int, prediction_time: datetime
) -> float:
    """
    Number of vessels with SCHEDULED or ARRIVED status and ETA within the
    next ARRIVAL_WINDOW_HOURS, divided by max(total_berths, 5).

    Capped at 1.0.
    """
    window_end = prediction_time + timedelta(hours=ARRIVAL_WINDOW_HOURS)

    arriving = (
        db.query(VesselSchedule)
        .filter(
            VesselSchedule.port_id == port_id,
            VesselSchedule.status.in_(["SCHEDULED", "ARRIVED"]),
            VesselSchedule.eta >= prediction_time,
            VesselSchedule.eta <= window_end,
        )
        .count()
    )

    total_berths = db.query(Berth).filter(Berth.port_id == port_id).count()
    denominator = max(total_berths, 5)  # floor at 5 to avoid over-sensitivity

    return _safe_ratio(arriving, denominator)


def extract_features(
    db: Session, port_id: int, prediction_time: datetime
) -> PredictionFeatures:
    """
    Compute all 4 features for a given port and point-in-time.

    yard_utilization is hardcoded to 0.0 (deferred to a future phase).
    """
    return PredictionFeatures(
        berth_utilization=compute_berth_utilization(db, port_id),
        crane_utilization=compute_crane_utilization(db, port_id),
        arrival_pressure=compute_arrival_pressure(db, port_id, prediction_time),
        yard_utilization=0.0,  # Future phase: derive from yard occupancy table
    )
