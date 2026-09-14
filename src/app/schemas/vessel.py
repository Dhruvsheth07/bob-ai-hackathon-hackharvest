"""
Pydantic schemas for vessel endpoints.
"""

import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import PaginatedResponse


class VesselBase(BaseModel):
    """Base fields for Vessel."""

    imo_number: str | None = Field(default=None, description="IMO number (7 digits, optional IMO prefix)")
    name: str = Field(..., description="Name of the vessel")
    length_m: float | None = Field(default=None, description="Length in meters")
    draft_m: float | None = Field(default=None, description="Draft in meters")
    capacity_teu: int | None = Field(default=None, description="Capacity in TEU")
    vessel_type: str | None = Field(default=None, description="Type of vessel")

    @field_validator("imo_number")
    @classmethod
    def validate_imo(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v_clean = v.upper().replace(" ", "")
        if not re.match(r"^(IMO)?\d{7}$", v_clean):
            raise ValueError("IMO number must be 7 digits, optionally prefixed with 'IMO'.")
        return v_clean

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
        if v is None:
            return v
        v_clean = v.upper().replace(" ", "")
        if not re.match(r"^(IMO)?\d{7}$", v_clean):
            raise ValueError("IMO number must be 7 digits, optionally prefixed with 'IMO'.")
        return v_clean

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


class VesselResponse(VesselBase):
    """Schema for Vessel response."""

    id: int
    created_at: datetime | None

    model_config = {"from_attributes": True}


class VesselListResponse(PaginatedResponse[VesselResponse]):
    """Paginated list of vessels."""
    pass
