"""
Prediction repository — data access layer for congestion_predictions.
"""

from datetime import datetime

from sqlalchemy.orm import Session, joinedload

from app.models.congestion_prediction import CongestionPrediction


def create(db: Session, prediction: CongestionPrediction) -> CongestionPrediction:
    """Insert a new prediction row."""
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction


def bulk_create(db: Session, predictions: list[CongestionPrediction]) -> list[CongestionPrediction]:
    """Insert multiple predictions in a single commit."""
    db.add_all(predictions)
    db.commit()
    for p in predictions:
        db.refresh(p)
    return predictions


def get_by_id(db: Session, prediction_id: int) -> CongestionPrediction | None:
    """Fetch a single prediction by PK."""
    return (
        db.query(CongestionPrediction)
        .options(joinedload(CongestionPrediction.port))
        .filter(CongestionPrediction.id == prediction_id)
        .first()
    )


def get_all(
    db: Session,
    port_id: int | None = None,
    from_dt: datetime | None = None,
    to_dt: datetime | None = None,
    risk_level: str | None = None,
    skip: int = 0,
    limit: int = 20,
) -> tuple[list[CongestionPrediction], int]:
    """Paginated, filtered list of predictions."""
    query = db.query(CongestionPrediction).options(joinedload(CongestionPrediction.port))

    if port_id is not None:
        query = query.filter(CongestionPrediction.port_id == port_id)
    if from_dt:
        query = query.filter(CongestionPrediction.prediction_time >= from_dt)
    if to_dt:
        query = query.filter(CongestionPrediction.prediction_time <= to_dt)
    if risk_level:
        query = query.filter(CongestionPrediction.risk_level == risk_level.upper())

    total = query.count()
    items = query.order_by(CongestionPrediction.prediction_time.asc()).offset(skip).limit(limit).all()
    return items, total


def get_forecast_range(
    db: Session,
    port_id: int,
    from_dt: datetime,
    to_dt: datetime,
    batch_created_at: datetime | None = None,
) -> list[CongestionPrediction]:
    """
    Fetch predictions for a port within a time range.

    If batch_created_at is provided, restricts to predictions created at or
    after that timestamp (used to return only the latest forecast batch).
    """
    query = (
        db.query(CongestionPrediction)
        .options(joinedload(CongestionPrediction.port))
        .filter(
            CongestionPrediction.port_id == port_id,
            CongestionPrediction.prediction_time >= from_dt,
            CongestionPrediction.prediction_time <= to_dt,
        )
    )
    if batch_created_at:
        query = query.filter(CongestionPrediction.created_at >= batch_created_at)

    return query.order_by(CongestionPrediction.prediction_time.asc()).all()
