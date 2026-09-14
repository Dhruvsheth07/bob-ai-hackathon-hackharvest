"""
Recommendation API endpoints.
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user, require_roles
from app.models.user import User
from app.schemas.recommendation import RecommendationListResponse, RecommendationResponse
from app.services import recommendation_service

router = APIRouter()


@router.get(
    "",
    response_model=RecommendationListResponse,
    summary="List recommendations",
)
def list_recommendations(
    port_id: int | None = None,
    status: str | None = None,
    type: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RecommendationListResponse:
    """List stored recommendations with optional filtering."""
    return recommendation_service.get_all(
        db,
        port_id=port_id,
        status=status,
        rec_type=type,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{recommendation_id}",
    response_model=RecommendationResponse,
    summary="Get a single recommendation",
)
def get_recommendation(
    recommendation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RecommendationResponse:
    """Fetch a recommendation by its ID."""
    return recommendation_service.get_by_id(db, recommendation_id)


@router.post(
    "/{recommendation_id}/accept",
    response_model=RecommendationResponse,
    summary="Accept a recommendation",
    dependencies=[Depends(require_roles("SHIFT_SUPERVISOR", "PORT_MANAGER", "ADMIN"))],
)
def accept_recommendation(
    recommendation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RecommendationResponse:
    """
    Accept a PENDING recommendation. Writes an audit log entry.
    Requires SHIFT_SUPERVISOR, PORT_MANAGER, or ADMIN role.
    """
    return recommendation_service.accept(db, recommendation_id, current_user.id)


@router.post(
    "/{recommendation_id}/reject",
    response_model=RecommendationResponse,
    summary="Reject a recommendation",
    dependencies=[Depends(require_roles("SHIFT_SUPERVISOR", "PORT_MANAGER", "ADMIN"))],
)
def reject_recommendation(
    recommendation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RecommendationResponse:
    """
    Reject a PENDING recommendation. Writes an audit log entry.
    Requires SHIFT_SUPERVISOR, PORT_MANAGER, or ADMIN role.
    """
    return recommendation_service.reject(db, recommendation_id, current_user.id)
