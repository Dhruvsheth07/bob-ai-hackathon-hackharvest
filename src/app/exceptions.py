"""
Centralized exception handling for the FastAPI application.

Provides:
- AppException base class for domain-specific errors.
- Global handlers that convert exceptions into consistent JSON responses.
"""

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


# ── Custom Exception Classes ──────────────────────────────────────

class AppException(Exception):
    """Base exception for application-level errors."""

    def __init__(
        self,
        status_code: int = 500,
        detail: str = "An unexpected error occurred.",
        headers: dict[str, str] | None = None,
    ) -> None:
        self.status_code = status_code
        self.detail = detail
        self.headers = headers
        super().__init__(detail)


class NotFoundException(AppException):
    """Resource not found."""

    def __init__(self, detail: str = "Resource not found.") -> None:
        super().__init__(status_code=404, detail=detail)


class BadRequestException(AppException):
    """Invalid request data."""

    def __init__(self, detail: str = "Bad request.") -> None:
        super().__init__(status_code=400, detail=detail)


class UnauthorizedException(AppException):
    """Authentication required or invalid credentials."""

    def __init__(self, detail: str = "Invalid credentials.") -> None:
        super().__init__(
            status_code=401,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class ForbiddenException(AppException):
    """Insufficient permissions."""

    def __init__(self, detail: str = "Insufficient permissions.") -> None:
        super().__init__(status_code=403, detail=detail)


class ConflictException(AppException):
    """Resource conflict (e.g. duplicate email)."""

    def __init__(self, detail: str = "Resource already exists.") -> None:
        super().__init__(status_code=409, detail=detail)


class NotFoundException(AppException):
    """Resource not found."""

    def __init__(self, detail: str = "Resource not found.") -> None:
        super().__init__(status_code=404, detail=detail)


# ── Handler Functions ─────────────────────────────────────────────

async def app_exception_handler(
    request: Request,
    exc: AppException,
) -> JSONResponse:
    """Handle all AppException subclasses."""
    logger.warning("AppException: %s (status=%d)", exc.detail, exc.status_code)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail},
        headers=exc.headers,
    )


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """Return clean 422 responses for request validation failures."""
    errors: list[dict[str, Any]] = []
    for err in exc.errors():
        errors.append(
            {
                "field": " → ".join(str(loc) for loc in err.get("loc", [])),
                "message": err.get("msg", ""),
                "type": err.get("type", ""),
            }
        )
    logger.warning("Validation error: %s", errors)
    return JSONResponse(
        status_code=422,
        content={"error": "Validation failed", "details": errors},
    )


async def unhandled_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    """Catch-all for unhandled exceptions. Logs the full traceback."""
    logger.exception("Unhandled exception on %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error."},
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register all exception handlers on the FastAPI app instance."""
    app.add_exception_handler(AppException, app_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, validation_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, unhandled_exception_handler)  # type: ignore[arg-type]
