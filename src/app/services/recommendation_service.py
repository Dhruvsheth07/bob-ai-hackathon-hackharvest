"""
Recommendation service — business logic for lifecycle management.
"""

from typing import Optional

from sqlalchemy.orm import Session

from app.exceptions import BadRequestException, NotFoundException
from app.models.audit_log import AuditLog
from app.models.recommendation import Recommendation
from app.recommendations import generator
from app.repositories import audit_log_repository, recommendation_repository
from app.schemas.recommendation import RecommendationListResponse, RecommendationResponse


def _to_response(rec: Recommendation) -> RecommendationResponse:
    return RecommendationResponse(
        id=rec.id,
        optimization_run_id=rec.optimization_run_id,
        type=rec.type,
        severity=rec.severity,
        title=rec.title,
        description=rec.description,
        expected_impact=rec.expected_impact,
        status=rec.status,
        created_at=rec.created_at,
    )


def generate_recommendations(
    db: Session, port_id: int, run_id: Optional[int]
) -> list[RecommendationResponse]:
    """
    Run all recommendation rules for a port and persist results.
    Called automatically after optimization completes.
    """
    new_recs = generator.generate_all(db, port_id, run_id)
    saved = recommendation_repository.create_many(db, new_recs)
    return [_to_response(r) for r in saved]


def get_all(
    db: Session,
    port_id: Optional[int] = None,
    status: Optional[str] = None,
    rec_type: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> RecommendationListResponse:
    """Paginated list of recommendations."""
    skip = (page - 1) * page_size
    items, total = recommendation_repository.get_all(
        db,
        port_id=port_id,
        status=status,
        rec_type=rec_type,
        skip=skip,
        limit=page_size,
    )
    pages = (total + page_size - 1) // page_size if total > 0 else 0
    return RecommendationListResponse(
        items=[_to_response(r) for r in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


def get_by_id(db: Session, rec_id: int) -> RecommendationResponse:
    rec = recommendation_repository.get_by_id(db, rec_id)
    if not rec:
        raise NotFoundException("Recommendation not found.")
    return _to_response(rec)


def _change_status(
    db: Session, rec_id: int, user_id: int, new_status: str
) -> RecommendationResponse:
    """Internal helper for accept/reject."""
    rec = recommendation_repository.get_by_id(db, rec_id)
    if not rec:
        raise NotFoundException("Recommendation not found.")
    if rec.status != "PENDING":
        raise BadRequestException(
            detail=f"Recommendation is already {rec.status}. Only PENDING recommendations can be actioned."
        )

    old_status = rec.status
    rec = recommendation_repository.update_status(db, rec, new_status)

    # Write audit log
    log = AuditLog(
        user_id=user_id,
        action=f"RECOMMENDATION_{new_status}",
        entity_type="recommendations",
        entity_id=rec_id,
        old_value={"status": old_status},
        new_value={"status": new_status},
    )
    audit_log_repository.create(db, log)

    return _to_response(rec)


def accept(db: Session, rec_id: int, user_id: int) -> RecommendationResponse:
    """Accept a PENDING recommendation. Writes an audit log."""
    return _change_status(db, rec_id, user_id, "ACCEPTED")


def reject(db: Session, rec_id: int, user_id: int) -> RecommendationResponse:
    """Reject a PENDING recommendation. Writes an audit log."""
    return _change_status(db, rec_id, user_id, "REJECTED")
