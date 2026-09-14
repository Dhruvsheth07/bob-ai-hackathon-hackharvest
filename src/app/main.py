"""
FastAPI application factory.

Creates and configures the FastAPI application instance with:
- CORS middleware
- Exception handlers
- API v1 router (/api/v1)
- Structured logging
- Swagger/ReDoc documentation
"""

import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import get_settings
from app.database import get_engine
from app.exceptions import register_exception_handlers
from app.logging_config import setup_logging

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan — runs on startup and shutdown."""
    settings = get_settings()

    # ── Startup ───────────────────────────────────────────────────
    logger.info(
        "Starting %s v%s [%s]",
        settings.APP_NAME,
        settings.APP_VERSION,
        settings.APP_ENV,
    )

    # Verify database connectivity
    try:
        with get_engine().connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection verified successfully.")
    except Exception:
        logger.error("Failed to connect to the database!", exc_info=True)

    yield

    # ── Shutdown ──────────────────────────────────────────────────
    logger.info("Shutting down %s.", settings.APP_NAME)
    get_engine().dispose()


def create_app() -> FastAPI:
    """Build and return the configured FastAPI application."""
    settings = get_settings()

    # Configure logging first
    setup_logging(settings.LOG_LEVEL)

    application = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "Backend API for the Port Operations Optimizer — "
            "an AI-powered tool to reduce vessel congestion and "
            "optimize berth scheduling."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ── CORS Middleware ───────────────────────────────────────────
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception Handlers ────────────────────────────────────────
    register_exception_handlers(application)

    # ── Routers ───────────────────────────────────────────────────
    from app.api.v1.router import router as v1_router

    application.include_router(v1_router, prefix="/api/v1")

    return application


# Application instance used by uvicorn
app = create_app()
