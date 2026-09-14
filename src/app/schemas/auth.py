"""
Pydantic schemas for authentication endpoints.

These schemas handle request validation and response serialization.
password_hash is NEVER exposed in any response schema.
"""

import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


# ── Request Schemas ───────────────────────────────────────────────


class RegisterRequest(BaseModel):
    """Schema for user registration."""

    email: EmailStr
    password: str
    name: str
    role_name: str = "VIEWER"

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit.")
        return v

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        stripped = v.strip()
        if len(stripped) < 1:
            raise ValueError("Name must not be empty.")
        if len(stripped) > 100:
            raise ValueError("Name must not exceed 100 characters.")
        return stripped


class LoginRequest(BaseModel):
    """Schema for user login."""

    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    """Schema for token refresh."""

    refresh_token: str


# ── Response Schemas ──────────────────────────────────────────────


class TokenResponse(BaseModel):
    """JWT token pair returned on login or refresh."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """User profile — password_hash is never included."""

    id: int
    email: str
    name: str
    role: str
    is_active: bool
    created_at: datetime | None = None

    model_config = {"from_attributes": True}
