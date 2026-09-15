"""
Pydantic schemas for vessel endpoints.
"""

import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import PaginatedResponse


# ── Shared validators (used only on input schemas) ────────────────────────────

def _validate_imo(v: str | None) -> str | None:
    """Validate and normalise an IMO number. Accepts 6 or 7 digits with optional IMO prefix."""
    if v is None:
        return v
    v_clean = v.upper().replace(" ", "")
    # Accept IMO followed by 6 or 7 digits (real-world data may use either)
    if not re.match(r"^(IMO)?\d{6,7}$", v_clean):
        raise ValueError("IMO number must be 6-7 digits, optionally prefixed with 'IMO'.")
    return v_clean


# ── Input schemas (validators applied) ───────────────────────────────────────

class VesselBase(BaseModel):
    """Base fields for Vessel (used by Create)."""

    imo_number: str | None = Field(default=None, description="IMO number (6-7 digits, optional IMO prefix)")
    name: str = Field(..., description="Name of the vessel")
    length_m: float | None = Field(default=None, description="Length in meters")
    draft_m: float | None = Field(default=None, description="Draft in meters")
    capacity_teu: int | None = Field(default=None, description="Capacity in TEU")
    vessel_type: str | None = Field(default=None, description="Type of vessel")

    @field_validator("imo_number")
    @classmethod
    def validate_imo(cls, v: str | None) -> str | None:
        return _validate_imo(v)

    @field_validator("length_m", "draft_m")
    @classmethod
    def validate_dimensions(cls, v: float | None) -> float | None:
        if v is not None and v <= 0:
            raise ValueError("Dimensions must be positive.")
        return v

    @field_validator("capacity_teu")
    @classmethod
    def validate_capacity(cls, v: int | None) -> int | None:
        if v is not None and v < 0:
            raise ValueError("Capacity cannot be negative.")
        return v


class VesselCreate(VesselBase):
    """Schema for creating a Vessel."""
    pass


class VesselUpdate(BaseModel):
    """Schema for updating a Vessel."""

    imo_number: str | None = Field(default=None)
    name: str | None = Field(default=None)
    length_m: float | None = Field(default=None)
    draft_m: float | None = Field(default=None)
    capacity_teu: int | None = Field(default=None)
    vessel_type: str | None = Field(default=None)

    @field_validator("imo_number")
    @classmethod
    def validate_imo(cls, v: str | None) -> str | None:
        return _validate_imo(v)

    @field_validator("length_m", "draft_m")
    @classmethod
    def validate_dimensions(cls, v: float | None) -> float | None:
        if v is not None and v <= 0:
            raise ValueError("Dimensions must be positive.")
        return v

    @field_validator("capacity_teu")
    @classmethod
    def validate_capacity(cls, v: int | None) -> int | None:
        if v is not None and v < 0:
            raise ValueError("Capacity cannot be negative.")
        return v


# ── Output schema (NO field validators — reads raw DB data as-is) ─────────────

class VesselResponse(BaseModel):
    """
    Schema for Vessel response.

    Intentionally does NOT inherit VesselBase validators so that existing
    DB rows with non-standard IMO formats are returned without crashing.
    """

    id: int
    imo_number: str | None = None
    name: str
    length_m: float | None = None
    draft_m: float | None = None
    capacity_teu: int | None = None
    vessel_type: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class VesselListResponse(PaginatedResponse[VesselResponse]):
    """Paginated list of vessels."""
    pass
