"""
Repository for optimization runs and assignments.
"""

from typing import List, Tuple

from sqlalchemy.orm import Session, joinedload

from app.models.berth_assignment import BerthAssignment
from app.models.crane_assignment import CraneAssignment
from app.models.optimization_run import OptimizationRun


def create_run(db: Session, run: OptimizationRun) -> OptimizationRun:
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


def update_run(db: Session, run: OptimizationRun) -> OptimizationRun:
    db.commit()
    db.refresh(run)
    return run


def get_run_by_id(db: Session, run_id: int) -> OptimizationRun | None:
    return db.query(OptimizationRun).filter(OptimizationRun.id == run_id).first()


def save_assignments(
    db: Session,
    berths: List[BerthAssignment],
    cranes: List[CraneAssignment]
) -> None:
    db.add_all(berths)
    db.add_all(cranes)
    db.commit()


def get_assignments(
    db: Session, run_id: int
) -> Tuple[List[BerthAssignment], List[CraneAssignment]]:
    berths = (
        db.query(BerthAssignment)
        .options(
            joinedload(BerthAssignment.berth),
            joinedload(BerthAssignment.vessel_schedule)
        )
        .filter(BerthAssignment.optimization_run_id == run_id)
        .all()
    )
    
    cranes = (
        db.query(CraneAssignment)
        .options(
            joinedload(CraneAssignment.crane),
            joinedload(CraneAssignment.vessel_schedule)
        )
        .filter(CraneAssignment.optimization_run_id == run_id)
        .all()
    )
    
    return berths, cranes
