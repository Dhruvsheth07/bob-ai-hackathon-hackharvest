"""
Audit log repository.
"""

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def create(db: Session, log: AuditLog) -> AuditLog:
    """Insert an audit log entry."""
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
