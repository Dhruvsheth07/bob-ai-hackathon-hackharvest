"""
Pydantic schemas for congestion prediction endpoints.
"""

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import PaginatedResponse


class PredictionRequest(BaseModel):
    """Input to trigger a congestion forecast."""

    port_id: int = Field(..., description="Port ID to forecast congestion for")
    horizon_hours: int = Field(default=72, ge=1, le=72, description="Forecast horizon in hours (max 72)")
    interval_hours: int = Field(default=1, ge=1, le=24, description="Prediction interval in hours")


class PredictionFeatures(BaseModel):
    """Computed utilization features used as input to the prediction engine."""

    berth_utilization: float = Field(ge=0.0, le=1.0)
    crane_utilization: float = Field(ge=0.0, le=1.0)
    yard_utilization: float = Field(ge=0.0, le=1.0)
    arrival_pressure: float = Field(ge=0.0, le=1.0)


class CongestionPredictionResponse(BaseModel):
    """Full prediction response row."""

    id: int
    port_id: int
    port_name: str | None = None
    prediction_time: datetime
    berth_utilization: float | None
    crane_utilization: float | None
    yard_utilization: float | None
    arrival_pressure: float | None
    congestion_score: float
    risk_level: str
    model_version: str | None
    created_at: datetime | None

    model_config = {"from_attributes": True}


class CongestionListResponse(PaginatedResponse[CongestionPredictionResponse]):
    """Paginated list of congestion predictions."""
    pass


class ForecastResponse(BaseModel):
    """Response for a 72-hour forecast."""

    port_id: int
    port_name: str | None = None
    generated_at: datetime
    horizon_hours: int
    predictions: list[CongestionPredictionResponse]
