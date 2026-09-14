"""
Pydantic schemas for recommendation endpoints.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.schemas.common import PaginatedResponse


class RecommendationResponse(BaseModel):
    """Full recommendation row response."""

    id: int
    optimization_run_id: int | None = None
    type: str
    severity: str | None = None
    title: str
    description: str | None = None
    expected_impact: Any = None
    status: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class RecommendationListResponse(PaginatedResponse[RecommendationResponse]):
    """Paginated list of recommendations."""
    pass
