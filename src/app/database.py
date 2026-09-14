"""
SQLAlchemy engine, session factory, and database dependency.

Uses synchronous SQLAlchemy 2.x with the psycopg (v3) driver.
Engine and session factory are lazily initialised so that module-level
imports do not trigger settings validation (important for testing).
"""

import logging
from collections.abc import Generator
from typing import Annotated

from fastapi import Depends
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

logger = logging.getLogger(__name__)

# Lazy singletons — populated on first call to _get_engine()
_engine: Engine | None = None
_SessionLocal: sessionmaker[Session] | None = None


def _get_engine() -> Engine:
    """Return the SQLAlchemy engine, creating it on first use."""
    global _engine
    if _engine is None:
        from app.config import get_settings

        settings = get_settings()

        # SQLite doesn't support pool_size / max_overflow
        kwargs: dict = {
            "pool_pre_ping": True,
            "echo": settings.is_development,
        }
        if not settings.DATABASE_URL.startswith("sqlite"):
            kwargs["pool_size"] = 5
            kwargs["max_overflow"] = 10

        _engine = create_engine(settings.DATABASE_URL, **kwargs)
    return _engine


def _get_session_factory() -> sessionmaker[Session]:
    """Return the session factory, creating it on first use."""
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(
            bind=_get_engine(),
            autocommit=False,
            autoflush=False,
            expire_on_commit=False,
        )
    return _SessionLocal


def get_engine() -> Engine:
    """Public accessor for the engine (used by main.py lifespan)."""
    return _get_engine()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a database session.

    Yields a SQLAlchemy session and ensures it is closed after the
    request finishes, even if an exception occurs.
    """
    session_factory = _get_session_factory()
    db = session_factory()
    try:
        yield db
    finally:
        db.close()


# Reusable type alias for route dependencies
DbSession = Annotated[Session, Depends(get_db)]
