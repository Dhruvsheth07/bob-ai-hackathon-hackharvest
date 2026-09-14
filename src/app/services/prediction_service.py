"""
Congestion Prediction service — business logic.

Orchestrates feature extraction, engine prediction, persistence, and retrieval.
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.exceptions import BadRequestException, NotFoundException
from app.models.congestion_prediction import CongestionPrediction
from app.models.port import Port
from app.prediction.engine import rule_based_engine
from app.prediction.feature_extractor import extract_features
from app.repositories import prediction_repository
from app.schemas.prediction import (
    CongestionListResponse,
    CongestionPredictionResponse,
    ForecastResponse,
    PredictionRequest,
)


def _get_port_or_404(db: Session, port_id: int) -> Port:
    port = db.query(Port).filter(Port.id == port_id).first()
    if not port:
        raise NotFoundException(detail=f"Port with id {port_id} not found.")
    return port


def _to_response(pred: CongestionPrediction) -> CongestionPredictionResponse:
    """Map ORM instance → Pydantic response, enriching port_name from relationship."""
    port_name = pred.port.name if pred.port else None
    return CongestionPredictionResponse(
        id=pred.id,
        port_id=pred.port_id,
        port_name=port_name,
        prediction_time=pred.prediction_time,
        berth_utilization=float(pred.berth_utilization) if pred.berth_utilization is not None else None,
        crane_utilization=float(pred.crane_utilization) if pred.crane_utilization is not None else None,
        yard_utilization=float(pred.yard_utilization) if pred.yard_utilization is not None else None,
        arrival_pressure=float(pred.arrival_pressure) if pred.arrival_pressure is not None else None,
        congestion_score=float(pred.congestion_score),
        risk_level=pred.risk_level,
        model_version=pred.model_version,
        created_at=pred.created_at,
    )


def generate_congestion_forecast(
    db: Session,
    request: PredictionRequest,
) -> ForecastResponse:
    """
    Generate and persist a congestion forecast.

    For each time slot [now, now+horizon], extracts features from the live DB,
    runs the prediction engine, and saves the result. Returns the full forecast.
    """
    if request.interval_hours < 1:
        raise BadRequestException(detail="interval_hours must be at least 1.")

    port = _get_port_or_404(db, request.port_id)
    engine = rule_based_engine  # Swap to XGBoostEngine here in a future phase

    now = datetime.now(timezone.utc).replace(tzinfo=None)  # store as naive UTC

    prediction_objects: list[CongestionPrediction] = []
    slot = now
    steps = request.horizon_hours // request.interval_hours

    for _ in range(steps):
        features = extract_features(db, request.port_id, slot)
        score, risk = engine.predict(features)

        pred = CongestionPrediction(
            port_id=request.port_id,
            prediction_time=slot,
            berth_utilization=features.berth_utilization,
            crane_utilization=features.crane_utilization,
            yard_utilization=features.yard_utilization,
            arrival_pressure=features.arrival_pressure,
            congestion_score=score,
            risk_level=risk,
            model_version=engine.MODEL_VERSION,
        )
        prediction_objects.append(pred)
        slot = slot + timedelta(hours=request.interval_hours)

    saved = prediction_repository.bulk_create(db, prediction_objects)

    responses = [_to_response(p) for p in saved]
    return ForecastResponse(
        port_id=request.port_id,
        port_name=port.name,
        generated_at=now,
        horizon_hours=request.horizon_hours,
        predictions=responses,
    )


def get_predictions(
    db: Session,
    port_id: int | None = None,
    from_dt: datetime | None = None,
    to_dt: datetime | None = None,
    risk_level: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> CongestionListResponse:
    """Paginated list of stored predictions."""
    skip = (page - 1) * page_size
    items, total = prediction_repository.get_all(
        db,
        port_id=port_id,
        from_dt=from_dt,
        to_dt=to_dt,
        risk_level=risk_level,
        skip=skip,
        limit=page_size,
    )
    pages = (total + page_size - 1) // page_size if total > 0 else 0
    return CongestionListResponse(
        items=[_to_response(p) for p in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


def get_prediction_by_id(db: Session, prediction_id: int) -> CongestionPredictionResponse:
    """Fetch a single prediction by ID or raise 404."""
    pred = prediction_repository.get_by_id(db, prediction_id)
    if not pred:
        raise NotFoundException(detail="Prediction not found.")
    return _to_response(pred)


def get_forecast(
    db: Session,
    port_id: int,
    horizon_hours: int = 72,
) -> ForecastResponse:
    """
    Return the most recent stored forecast for a port.

    Fetches predictions from the latest batch (by created_at) for the next
    horizon_hours starting from now.
    """
    port = _get_port_or_404(db, port_id)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    to_dt = now + timedelta(hours=horizon_hours)

    # Find the most recent batch's created_at
    from sqlalchemy import func as sa_func
    latest_batch = (
        db.query(sa_func.max(CongestionPrediction.created_at))
        .filter(CongestionPrediction.port_id == port_id)
        .scalar()
    )

    items = prediction_repository.get_forecast_range(
        db, port_id, now, to_dt, batch_created_at=latest_batch
    )

    return ForecastResponse(
        port_id=port_id,
        port_name=port.name,
        generated_at=now,
        horizon_hours=horizon_hours,
        predictions=[_to_response(p) for p in items],
    )
