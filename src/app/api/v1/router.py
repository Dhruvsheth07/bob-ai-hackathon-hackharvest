"""
API v1 router — contains all version 1 endpoints.

Business logic belongs in services, not here.
"""

import logging

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter()

# Include sub-routers
from app.api.v1.auth import router as auth_router

router.include_router(auth_router, prefix="/auth", tags=["Authentication"])


@router.get(
    "/health",
    summary="Health Check",
    description="Returns the application health status and database connectivity.",
    response_description="Health status object",
    tags=["System"],
)
def health_check(db: Session = Depends(get_db)) -> dict:
    """
    Health check endpoint.

    Verifies:
    - Application is running
    - Database is reachable

    Returns a JSON object with status, environment, version, and
    database connectivity information.
    """
    settings = get_settings()

    # Check database connectivity
    db_connected = False
    try:
        db.execute(text("SELECT 1"))
        db_connected = True
    except Exception:
        logger.warning("Database health check failed", exc_info=True)

    return {
        "status": "healthy",
        "environment": settings.APP_ENV,
        "version": settings.APP_VERSION,
        "db_connected": db_connected,
    }
