"""
Authentication API endpoints.

POST /register  — create a new user account
POST /login     — authenticate and receive JWT tokens
POST /refresh   — exchange a refresh token for new tokens
GET  /me        — get the current user's profile
"""

import logging

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.repositories import user_repository
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services import auth_service

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────


def _user_to_response(user: User) -> UserResponse:
    """Convert a User model to a UserResponse schema (no password_hash)."""
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role.name,
        is_active=user.is_active,
        created_at=user.created_at,
    )


# ── Endpoints ─────────────────────────────────────────────────────


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    tags=["Authentication"],
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
) -> UserResponse:
    """
    Create a new user account.

    - Validates email format and password strength.
    - Hashes the password with bcrypt.
    - Assigns the specified role (defaults to VIEWER).
    - Returns the created user without the password hash.
    """
    user = auth_service.register_user(
        db=db,
        email=data.email,
        password=data.password,
        name=data.name,
        role_name=data.role_name,
    )
    logger.info("User registered: %s (role=%s)", user.email, user.role.name)
    return _user_to_response(user)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and receive JWT tokens",
    tags=["Authentication"],
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """
    Authenticate with email and password.

    Returns an access token and a refresh token on success.
    """
    user = auth_service.authenticate_user(db, data.email, data.password)

    access_token = auth_service.create_access_token(subject=user.id)
    refresh_token = auth_service.create_refresh_token(subject=user.id)

    logger.info("User logged in: %s", user.email)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    tags=["Authentication"],
)
def refresh(
    data: RefreshRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """
    Exchange a valid refresh token for a new access/refresh token pair.
    """
    payload = auth_service.verify_token(data.refresh_token, expected_type="refresh")
    user_id = int(payload["sub"])

    # Verify the user still exists and is active
    user = user_repository.get_user_by_id(db, user_id)
    if not user or not user.is_active:
        from app.exceptions import UnauthorizedException

        raise UnauthorizedException(detail="User not found or deactivated.")

    access_token = auth_service.create_access_token(subject=user.id)
    refresh_token = auth_service.create_refresh_token(subject=user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
    tags=["Authentication"],
)
def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """
    Return the profile of the currently authenticated user.

    Requires a valid Bearer token in the Authorization header.
    """
    return _user_to_response(current_user)
