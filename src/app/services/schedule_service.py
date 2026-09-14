"""
Vessel Schedule service — business logic.
"""

from datetime import datetime

from sqlalchemy.orm import Session

from app.exceptions import ConflictException, NotFoundException, BadRequestException
from app.models.vessel_schedule import VesselSchedule
from app.repositories import schedule_repository, vessel_repository
from app.schemas.vessel_schedule import ScheduleCreate, ScheduleListResponse, ScheduleUpdate

# Temporary direct query to check if a port exists since we don't have a port repository yet.
from app.models.port import Port


def list_schedules(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    port_id: int | None = None,
    vessel_id: int | None = None,
    status: str | None = None,
    priority: str | None = None,
    eta_from: datetime | None = None,
    eta_to: datetime | None = None,
    sort_by: str = "eta",
) -> ScheduleListResponse:
    """List schedules with pagination and filtering."""
    skip = (page - 1) * page_size
    items, total = schedule_repository.get_all(
        db, 
        skip=skip, 
        limit=page_size, 
        port_id=port_id,
        vessel_id=vessel_id,
        status=status,
        priority=priority,
        eta_from=eta_from,
        eta_to=eta_to,
        sort_by=sort_by
    )
    
    pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    # Map relationships for the response
    for item in items:
        if hasattr(item, 'vessel') and item.vessel:
            item.vessel_name = item.vessel.name
        if hasattr(item, 'port') and item.port:
            item.port_name = item.port.name
    
    return ScheduleListResponse(
        items=items,  # type: ignore
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


def get_schedule(db: Session, schedule_id: int) -> VesselSchedule:
    """Get a schedule by ID or raise 404."""
    schedule = schedule_repository.get_by_id(db, schedule_id)
    if not schedule:
        raise NotFoundException(detail="Schedule not found.")
        
    if hasattr(schedule, 'vessel') and schedule.vessel:
        schedule.vessel_name = schedule.vessel.name
    if hasattr(schedule, 'port') and schedule.port:
        schedule.port_name = schedule.port.name
        
    return schedule


def get_upcoming(db: Session, port_id: int | None = None, limit: int = 10) -> list[VesselSchedule]:
    """Get upcoming schedules."""
    items = schedule_repository.get_upcoming(db, port_id, limit)
    for item in items:
        if hasattr(item, 'vessel') and item.vessel:
            item.vessel_name = item.vessel.name
        if hasattr(item, 'port') and item.port:
            item.port_name = item.port.name
    return items


def _validate_fks(db: Session, vessel_id: int | None, port_id: int | None):
    """Validate that the referenced vessel and port exist."""
    if vessel_id is not None:
        vessel = vessel_repository.get_by_id(db, vessel_id)
        if not vessel:
            raise BadRequestException(detail=f"Vessel with id {vessel_id} not found.")
            
    if port_id is not None:
        port = db.query(Port).filter(Port.id == port_id).first()
        if not port:
            raise BadRequestException(detail=f"Port with id {port_id} not found.")


def create_schedule(db: Session, data: ScheduleCreate) -> VesselSchedule:
    """Create a new schedule."""
    _validate_fks(db, data.vessel_id, data.port_id)
            
    schedule = VesselSchedule(
        vessel_id=data.vessel_id,
        port_id=data.port_id,
        eta=data.eta,
        predicted_eta=data.predicted_eta,
        etd=data.etd,
        containers_teu=data.containers_teu,
        priority=data.priority,
        status=data.status,
    )
    
    created = schedule_repository.create(db, schedule)
    
    # Reload to get the joined relationships for the response
    return get_schedule(db, created.id)


def update_schedule(db: Session, schedule_id: int, data: ScheduleUpdate) -> VesselSchedule:
    """Update an existing schedule."""
    schedule = get_schedule(db, schedule_id) # also raises 404 if not found
    
    update_data = data.model_dump(exclude_unset=True)
    
    # Validate FKs if they are being updated
    _validate_fks(db, update_data.get("vessel_id"), update_data.get("port_id"))
    
    # Re-validate dates if they are being updated
    new_eta = update_data.get("eta", schedule.eta)
    new_etd = update_data.get("etd", schedule.etd)
    if new_eta and new_etd and new_eta >= new_etd:
        raise BadRequestException(detail="ETA must be before ETD.")
                
    for key, value in update_data.items():
        setattr(schedule, key, value)
        
    updated = schedule_repository.update(db, schedule)
    
    # Reload to get the joined relationships for the response
    return get_schedule(db, updated.id)


def delete_schedule(db: Session, schedule_id: int) -> None:
    """Delete a schedule."""
    schedule = get_schedule(db, schedule_id)
    schedule_repository.delete(db, schedule)
