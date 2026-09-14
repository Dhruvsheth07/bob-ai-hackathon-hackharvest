"""
Vessel Schedule repository — data access layer.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.models.vessel_schedule import VesselSchedule


def get_all(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    port_id: int | None = None,
    vessel_id: int | None = None,
    status: str | None = None,
    priority: str | None = None,
    eta_from: datetime | None = None,
    eta_to: datetime | None = None,
    sort_by: str = "eta",
) -> tuple[list[VesselSchedule], int]:
    """Fetch a paginated list of schedules."""
    query = db.query(VesselSchedule).options(joinedload(VesselSchedule.vessel), joinedload(VesselSchedule.port))

    if port_id is not None:
        query = query.filter(VesselSchedule.port_id == port_id)
    if vessel_id is not None:
        query = query.filter(VesselSchedule.vessel_id == vessel_id)
    if status:
        query = query.filter(VesselSchedule.status == status)
    if priority:
        query = query.filter(VesselSchedule.priority == priority)
    if eta_from:
        query = query.filter(VesselSchedule.eta >= eta_from)
    if eta_to:
        query = query.filter(VesselSchedule.eta <= eta_to)

    total = query.count()

    if sort_by == "priority":
        # Sort CRITICAL, HIGH, NORMAL
        # This is a bit tricky in pure SQL without a custom sort order, we can rely on string sort or just return it.
        # Simple string sort will do 'CRITICAL' < 'HIGH' < 'NORMAL' alphabetically which happens to match!
        query = query.order_by(VesselSchedule.priority.asc(), VesselSchedule.eta.asc())
    else:
        query = query.order_by(VesselSchedule.eta.asc())

    items = query.offset(skip).limit(limit).all()
    return items, total


def get_by_id(db: Session, schedule_id: int) -> VesselSchedule | None:
    """Fetch a schedule by ID."""
    return db.query(VesselSchedule).options(joinedload(VesselSchedule.vessel), joinedload(VesselSchedule.port)).filter(VesselSchedule.id == schedule_id).first()


def get_upcoming(db: Session, port_id: int | None = None, limit: int = 10) -> list[VesselSchedule]:
    """Fetch upcoming scheduled or arrived vessels."""
    query = db.query(VesselSchedule).options(joinedload(VesselSchedule.vessel), joinedload(VesselSchedule.port))
    
    query = query.filter(VesselSchedule.status.in_(["SCHEDULED", "ARRIVED"]))
    
    if port_id is not None:
        query = query.filter(VesselSchedule.port_id == port_id)
        
    query = query.order_by(VesselSchedule.eta.asc())
    
    return query.limit(limit).all()


def create(db: Session, schedule: VesselSchedule) -> VesselSchedule:
    """Insert a new schedule."""
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


def update(db: Session, schedule: VesselSchedule) -> VesselSchedule:
    """Commit changes to an existing schedule."""
    db.commit()
    db.refresh(schedule)
    return schedule


def delete(db: Session, schedule: VesselSchedule) -> None:
    """Delete a schedule."""
    db.delete(schedule)
    db.commit()
