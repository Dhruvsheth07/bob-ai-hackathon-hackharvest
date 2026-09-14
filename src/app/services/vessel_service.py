"""
Vessel service — business logic.
"""

from sqlalchemy.orm import Session

from app.exceptions import ConflictException, NotFoundException
from app.models.vessel import Vessel
from app.repositories import vessel_repository
from app.schemas.vessel import VesselCreate, VesselListResponse, VesselUpdate


def list_vessels(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    name: str | None = None,
    vessel_type: str | None = None,
    sort_by: str = "name",
) -> VesselListResponse:
    """List vessels with pagination and filtering."""
    skip = (page - 1) * page_size
    items, total = vessel_repository.get_all(
        db, skip=skip, limit=page_size, name=name, vessel_type=vessel_type, sort_by=sort_by
    )
    
    pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    return VesselListResponse(
        items=items,  # type: ignore
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


def get_vessel(db: Session, vessel_id: int) -> Vessel:
    """Get a vessel by ID or raise 404."""
    vessel = vessel_repository.get_by_id(db, vessel_id)
    if not vessel:
        raise NotFoundException(detail="Vessel not found.")
    return vessel


def create_vessel(db: Session, data: VesselCreate) -> Vessel:
    """Create a new vessel."""
    if data.imo_number:
        existing = vessel_repository.get_by_imo(db, data.imo_number)
        if existing:
            raise ConflictException(detail="Vessel with this IMO number already exists.")
            
    vessel = Vessel(
        imo_number=data.imo_number,
        name=data.name,
        length_m=data.length_m,
        draft_m=data.draft_m,
        capacity_teu=data.capacity_teu,
        vessel_type=data.vessel_type,
    )
    return vessel_repository.create(db, vessel)


def update_vessel(db: Session, vessel_id: int, data: VesselUpdate) -> Vessel:
    """Update an existing vessel."""
    vessel = get_vessel(db, vessel_id)
    
    update_data = data.model_dump(exclude_unset=True)
    
    if "imo_number" in update_data and update_data["imo_number"] is not None:
        if update_data["imo_number"] != vessel.imo_number:
            existing = vessel_repository.get_by_imo(db, update_data["imo_number"])
            if existing:
                raise ConflictException(detail="Vessel with this IMO number already exists.")
                
    for key, value in update_data.items():
        setattr(vessel, key, value)
        
    return vessel_repository.update(db, vessel)


def delete_vessel(db: Session, vessel_id: int) -> None:
    """Delete a vessel."""
    vessel = get_vessel(db, vessel_id)
    
    if vessel.schedules:
        raise ConflictException(detail="Cannot delete vessel with associated schedules.")
        
    vessel_repository.delete(db, vessel)
