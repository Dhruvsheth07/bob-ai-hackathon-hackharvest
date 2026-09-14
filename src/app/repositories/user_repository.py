"""
User and Role repository — data access layer.

All database queries for users and roles are encapsulated here.
"""

import logging

from sqlalchemy.orm import Session

from app.models.role import Role
from app.models.user import User

logger = logging.getLogger(__name__)


def get_user_by_email(db: Session, email: str) -> User | None:
    """Fetch a user by email address."""
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """Fetch a user by integer ID."""
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, user: User) -> User:
    """Insert a new user into the database."""
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_role_by_name(db: Session, name: str) -> Role | None:
    """Fetch a role by name (e.g. 'ADMIN', 'VIEWER')."""
    return db.query(Role).filter(Role.name == name).first()
