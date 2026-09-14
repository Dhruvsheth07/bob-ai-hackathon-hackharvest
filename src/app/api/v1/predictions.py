"""
Congestion Prediction API endpoints.

Route order is intentional: /forecast must be registered before /{prediction_id}
to prevent FastAPI from treating "forecast" as an integer path parameter.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user, require_roles
from app.models.user import User
from app.schemas.prediction import (
    CongestionListResponse,
    CongestionPredictionResponse,
    ForecastResponse,
    PredictionRequest,
)
from app.services import prediction_service

router = APIRouter()


@router.post(
    "/congestion",
    response_model=ForecastResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a congestion forecast",
    dependencies=[Depends(require_roles("PORT_MANAGER", "ADMIN"))],
)
def generate_forecast(
    request: PredictionRequest,
    db: Session = Depends(get_db),
) -> ForecastResponse:
    """
    Trigger congestion forecast generation for a port.

    Calculates features from live data, runs the prediction engine for each
    time slot in the horizon, persists results, and returns the full forecast.
    Requires PORT_MANAGER or ADMIN role.
    """
    return prediction_service.generate_congestion_forecast(db, request)


@router.get(
    "/congestion",
    response_model=CongestionListResponse,
    summary="List stored congestion predictions",
)
def list_predictions(
    port_id: int | None = None,
    from_dt: datetime | None = None,
    to_dt: datetime | None = None,
    risk_level: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CongestionListResponse:
    """List stored predictions with optional filtering by port, date range, and risk level."""
    return prediction_service.get_predictions(
        db,
        port_id=port_id,
        from_dt=from_dt,
        to_dt=to_dt,
        risk_level=risk_level,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/congestion/forecast",
    response_model=ForecastResponse,
    summary="Get current forecast for a port",
)
def get_forecast(
    port_id: int,
    horizon_hours: int = Query(72, ge=1, le=72),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ForecastResponse:
    """
    Return the most recently generated forecast for a port.
    Reads from stored predictions — does not re-run the engine.
    """
    return prediction_service.get_forecast(db, port_id, horizon_hours)


@router.get(
    "/congestion/{prediction_id}",
    response_model=CongestionPredictionResponse,
    summary="Get a single prediction by ID",
)
def get_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CongestionPredictionResponse:
    """Fetch a single stored prediction by its ID."""
    return prediction_service.get_prediction_by_id(db, prediction_id)
