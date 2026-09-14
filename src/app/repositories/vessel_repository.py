"""
Vessel repository — data access layer.
"""

from typing import Any

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.vessel import Vessel


def get_all(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    name: str | None = None,
    vessel_type: str | None = None,
    sort_by: str = "name",
) -> tuple[list[Vessel], int]:
    """Fetch a paginated list of vessels."""
    query = db.query(Vessel)

    if name:
        query = query.filter(Vessel.name.ilike(f"%{name}%"))
    if vessel_type:
        query = query.filter(Vessel.vessel_type == vessel_type)

    total = query.count()

    if sort_by == "created_at":
        query = query.order_by(Vessel.created_at.desc())
    else:
        query = query.order_by(Vessel.name.asc())

    items = query.offset(skip).limit(limit).all()
    return items, total


def get_by_id(db: Session, vessel_id: int) -> Vessel | None:
    """Fetch a vessel by ID."""
    return db.query(Vessel).filter(Vessel.id == vessel_id).first()


def get_by_imo(db: Session, imo: str) -> Vessel | None:
    """Fetch a vessel by IMO number (case-insensitive)."""
    return db.query(Vessel).filter(func.lower(Vessel.imo_number) == imo.lower()).first()


def create(db: Session, vessel: Vessel) -> Vessel:
    """Insert a new vessel."""
    db.add(vessel)
    db.commit()
    db.refresh(vessel)
    return vessel


def update(db: Session, vessel: Vessel) -> Vessel:
    """Commit changes to an existing vessel."""
    db.commit()
    db.refresh(vessel)
    return vessel


def delete(db: Session, vessel: Vessel) -> None:
    """Delete a vessel."""
    db.delete(vessel)
    db.commit()

# Need func for get_by_imo
from sqlalchemy import func
