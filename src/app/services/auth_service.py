"""
Authentication service — business logic for registration, login, and JWT tokens.

Routes call this service; the service calls the repository.
"""

import logging
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import get_settings
from app.exceptions import ConflictException, UnauthorizedException
from app.models.user import User
from app.repositories import user_repository
from app.security import hash_password, verify_password

logger = logging.getLogger(__name__)


# ── User Registration & Authentication ────────────────────────────


def register_user(
    db: Session,
    email: str,
    password: str,
    name: str,
    role_name: str = "VIEWER",
) -> User:
    """
    Register a new user.

    Raises:
        ConflictException: If the email is already taken.
        ValueError: If the role does not exist.
    """
    # Check for duplicate email
    existing = user_repository.get_user_by_email(db, email)
    if existing:
        raise ConflictException(detail="A user with this email already exists.")

    # Resolve role
    role = user_repository.get_role_by_name(db, role_name)
    if not role:
        raise ValueError(f"Role '{role_name}' does not exist.")

    # Create user
    user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
        role_id=role.id,
    )
    return user_repository.create_user(db, user)


def authenticate_user(db: Session, email: str, password: str) -> User:
    """
    Verify credentials and return the user.

    Raises:
        UnauthorizedException: If email not found or password is wrong.
    """
    user = user_repository.get_user_by_email(db, email)
    if not user:
        raise UnauthorizedException(detail="Invalid email or password.")

    if not verify_password(password, user.password_hash):
        raise UnauthorizedException(detail="Invalid email or password.")

    if not user.is_active:
        raise UnauthorizedException(detail="Account is deactivated.")

    return user


# ── JWT Token Management ─────────────────────────────────────────


def create_access_token(
    subject: int | str,
    expires_delta: timedelta | None = None,
) -> str:
    """Create a signed JWT access token."""
    settings = get_settings()

    expire = datetime.now(timezone.utc) + (
        expires_delta
        or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": str(subject),
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_refresh_token(subject: int | str) -> str:
    """Create a signed JWT refresh token with a longer TTL."""
    settings = get_settings()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_REFRESH_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": str(subject),
        "exp": expire,
        "type": "refresh",
    }
    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def verify_token(token: str, expected_type: str = "access") -> dict:
    """
    Decode and validate a JWT token.

    Args:
        token: The raw JWT string.
        expected_type: Expected token type ('access' or 'refresh').

    Returns:
        The decoded payload dict.

    Raises:
        UnauthorizedException: If the token is invalid, expired, or wrong type.
    """
    settings = get_settings()

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError:
        raise UnauthorizedException(detail="Invalid or expired token.")

    if payload.get("type") != expected_type:
        raise UnauthorizedException(detail="Invalid token type.")

    if "sub" not in payload:
        raise UnauthorizedException(detail="Token missing subject.")

    return payload
