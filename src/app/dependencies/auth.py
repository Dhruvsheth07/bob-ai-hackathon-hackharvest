"""
Authentication dependencies for FastAPI route injection.

Provides:
- get_current_user: extracts and validates Bearer token, returns User
- require_roles: factory that returns a dependency enforcing role membership
"""

import logging
from collections.abc import Callable

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.exceptions import ForbiddenException, UnauthorizedException
from app.models.user import User
from app.repositories import user_repository
from app.services import auth_service

logger = logging.getLogger(__name__)

# OAuth2 scheme — Swagger UI will show a "lock" icon and send Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency that extracts the current user from a Bearer JWT.

    Raises:
        UnauthorizedException: If the token is invalid or the user doesn't exist.
    """
    payload = auth_service.verify_token(token, expected_type="access")
    user_id = int(payload["sub"])

    user = user_repository.get_user_by_id(db, user_id)
    if not user:
        raise UnauthorizedException(detail="User not found.")

    if not user.is_active:
        raise UnauthorizedException(detail="Account is deactivated.")

    return user


def require_roles(*allowed_roles: str) -> Callable:
    """
    Factory that returns a dependency checking role membership.

    Usage in a route:
        @router.get("/admin-only", dependencies=[Depends(require_roles("ADMIN"))])

    Or as a parameter:
        current_user: User = Depends(require_roles("ADMIN", "PORT_MANAGER"))

    Raises:
        ForbiddenException: If the user's role is not in allowed_roles.
    """

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.name not in allowed_roles:
            logger.warning(
                "User %s (role=%s) denied access to resource requiring %s",
                current_user.email,
                current_user.role.name,
                allowed_roles,
            )
            raise ForbiddenException(
                detail=f"Requires one of roles: {', '.join(allowed_roles)}."
            )
        return current_user

    return role_checker
