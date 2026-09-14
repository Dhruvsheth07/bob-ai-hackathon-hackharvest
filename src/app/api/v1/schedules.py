"""
Vessel Schedules API endpoints.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user, require_roles
from app.models.user import User
from app.schemas.vessel_schedule import (
    ScheduleCreate,
    ScheduleListResponse,
    ScheduleResponse,
    ScheduleUpdate,
)
from app.services import schedule_service

router = APIRouter()


@router.get(
    "",
    response_model=ScheduleListResponse,
    summary="List schedules",
)
def list_schedules(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    port_id: int | None = None,
    vessel_id: int | None = None,
    status: str | None = None,
    priority: str | None = None,
    eta_from: datetime | None = None,
    eta_to: datetime | None = None,
    sort_by: str = Query("eta", pattern="^(eta|priority)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ScheduleListResponse:
    """List schedules (paginated and filtered)."""
    return schedule_service.list_schedules(
        db=db,
        page=page,
        page_size=page_size,
        port_id=port_id,
        vessel_id=vessel_id,
        status=status,
        priority=priority,
        eta_from=eta_from,
        eta_to=eta_to,
        sort_by=sort_by,
    )


@router.post(
    "",
    response_model=ScheduleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new schedule",
    dependencies=[Depends(require_roles("PORT_MANAGER", "SHIFT_SUPERVISOR", "ADMIN"))],
)
def create_schedule(
    data: ScheduleCreate,
    db: Session = Depends(get_db),
) -> ScheduleResponse:
    """Create a new schedule. Requires PORT_MANAGER, SHIFT_SUPERVISOR, or ADMIN role."""
    return schedule_service.create_schedule(db, data)


@router.get(
    "/upcoming",
    response_model=list[ScheduleResponse],
    summary="Get upcoming schedules",
)
def get_upcoming_schedules(
    port_id: int | None = None,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ScheduleResponse]:
    """Get upcoming scheduled or arrived vessels."""
    return schedule_service.get_upcoming(db, port_id, limit)


@router.get(
    "/{schedule_id}",
    response_model=ScheduleResponse,
    summary="Get a schedule by ID",
)
def get_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ScheduleResponse:
    """Get a schedule by ID."""
    return schedule_service.get_schedule(db, schedule_id)


@router.put(
    "/{schedule_id}",
    response_model=ScheduleResponse,
    summary="Update a schedule",
    dependencies=[Depends(require_roles("PORT_MANAGER", "SHIFT_SUPERVISOR", "ADMIN"))],
)
def update_schedule(
    schedule_id: int,
    data: ScheduleUpdate,
    db: Session = Depends(get_db),
) -> ScheduleResponse:
    """Update a schedule. Requires PORT_MANAGER, SHIFT_SUPERVISOR, or ADMIN role."""
    return schedule_service.update_schedule(db, schedule_id, data)


@router.delete(
    "/{schedule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a schedule",
    dependencies=[Depends(require_roles("ADMIN"))],
)
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
) -> None:
    """Delete a schedule. Requires ADMIN role."""
    schedule_service.delete_schedule(db, schedule_id)
