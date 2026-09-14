"""
Vessel API endpoints.
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user, require_roles
from app.models.user import User
from app.schemas.vessel import VesselCreate, VesselListResponse, VesselResponse, VesselUpdate
from app.services import vessel_service

router = APIRouter()


@router.get(
    "",
    response_model=VesselListResponse,
    summary="List vessels",
)
def list_vessels(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    name: str | None = None,
    vessel_type: str | None = None,
    sort_by: str = Query("name", pattern="^(name|created_at)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VesselListResponse:
    """List vessels (paginated and filtered)."""
    return vessel_service.list_vessels(
        db=db,
        page=page,
        page_size=page_size,
        name=name,
        vessel_type=vessel_type,
        sort_by=sort_by,
    )


@router.post(
    "",
    response_model=VesselResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new vessel",
    dependencies=[Depends(require_roles("PORT_MANAGER", "ADMIN"))],
)
def create_vessel(
    data: VesselCreate,
    db: Session = Depends(get_db),
) -> VesselResponse:
    """Create a new vessel. Requires PORT_MANAGER or ADMIN role."""
    return vessel_service.create_vessel(db, data)


@router.get(
    "/{vessel_id}",
    response_model=VesselResponse,
    summary="Get a vessel by ID",
)
def get_vessel(
    vessel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VesselResponse:
    """Get a vessel by ID."""
    return vessel_service.get_vessel(db, vessel_id)


@router.put(
    "/{vessel_id}",
    response_model=VesselResponse,
    summary="Update a vessel",
    dependencies=[Depends(require_roles("PORT_MANAGER", "ADMIN"))],
)
def update_vessel(
    vessel_id: int,
    data: VesselUpdate,
    db: Session = Depends(get_db),
) -> VesselResponse:
    """Update a vessel. Requires PORT_MANAGER or ADMIN role."""
    return vessel_service.update_vessel(db, vessel_id, data)


@router.delete(
    "/{vessel_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a vessel",
    dependencies=[Depends(require_roles("ADMIN"))],
)
def delete_vessel(
    vessel_id: int,
    db: Session = Depends(get_db),
) -> None:
    """Delete a vessel. Requires ADMIN role."""
    vessel_service.delete_vessel(db, vessel_id)
