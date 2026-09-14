"""
Recommendation repository — data access layer.
"""

from typing import Optional

from sqlalchemy.orm import Session

from app.models.recommendation import Recommendation


def create_many(db: Session, items: list[Recommendation]) -> list[Recommendation]:
    """Bulk insert recommendations in one commit."""
    if not items:
        return []
    db.add_all(items)
    db.commit()
    for r in items:
        db.refresh(r)
    return items


def get_by_id(db: Session, rec_id: int) -> Optional[Recommendation]:
    return db.query(Recommendation).filter(Recommendation.id == rec_id).first()


def get_all(
    db: Session,
    port_id: Optional[int] = None,
    status: Optional[str] = None,
    rec_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
) -> tuple[list[Recommendation], int]:
    """Filtered, paginated list of recommendations."""
    from sqlalchemy.orm import joinedload

    q = db.query(Recommendation).options(
        joinedload(Recommendation.optimization_run)
    )

    if port_id is not None:
        # Filter via the optimization run's port_id
        from app.models.optimization_run import OptimizationRun
        q = q.join(
            OptimizationRun,
            Recommendation.optimization_run_id == OptimizationRun.id,
            isouter=True,
        ).filter(
            (OptimizationRun.port_id == port_id)
            | (Recommendation.optimization_run_id.is_(None))
        )

    if status:
        q = q.filter(Recommendation.status == status.upper())
    if rec_type:
        q = q.filter(Recommendation.type == rec_type.upper())

    total = q.count()
    items = (
        q.order_by(Recommendation.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return items, total


def update_status(db: Session, rec: Recommendation, new_status: str) -> Recommendation:
    rec.status = new_status
    db.commit()
    db.refresh(rec)
    return rec
