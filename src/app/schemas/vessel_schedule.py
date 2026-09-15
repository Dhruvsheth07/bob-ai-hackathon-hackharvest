"""
Pydantic schemas for vessel schedule endpoints.
"""

from datetime import datetime

from pydantic import BaseModel, Field, field_validator, model_validator

from app.schemas.common import PaginatedResponse


class ScheduleBase(BaseModel):
    """Base fields for Vessel Schedule."""

    vessel_id: int = Field(..., description="ID of the vessel")
    port_id: int = Field(..., description="ID of the port")
    eta: datetime = Field(..., description="Estimated time of arrival")
    predicted_eta: datetime | None = Field(default=None, description="ML Predicted ETA (optional)")
    etd: datetime | None = Field(default=None, description="Estimated time of departure")
    containers_teu: int | None = Field(default=0, description="Number of containers in TEU")
    priority: str | None = Field(default="NORMAL", description="Priority: NORMAL, HIGH, CRITICAL")
    status: str | None = Field(default="SCHEDULED", description="Status: SCHEDULED, ARRIVED, BERTHED, IN_PROGRESS, COMPLETED, CANCELLED")

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str | None) -> str | None:
        if v is None:
            return v
        allowed = {"NORMAL", "HIGH", "CRITICAL"}
        if v.upper() not in allowed:
            raise ValueError(f"Priority must be one of {allowed}")
        return v.upper()

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is None:
            return v
        allowed = {"SCHEDULED", "ARRIVED", "BERTHED", "IN_PROGRESS", "COMPLETED", "CANCELLED"}
        if v.upper() not in allowed:
            raise ValueError(f"Status must be one of {allowed}")
        return v.upper()

    @field_validator("containers_teu")
    @classmethod
    def validate_containers(cls, v: int | None) -> int | None:
        if v is not None and v < 0:
            raise ValueError("Containers TEU cannot be negative.")
        return v

    @model_validator(mode="after")
    def validate_dates(self) -> "ScheduleBase":
        if self.eta and self.etd:
            if self.eta >= self.etd:
                raise ValueError("ETA must be before ETD.")
        return self


class ScheduleCreate(ScheduleBase):
    """Schema for creating a Vessel Schedule."""
    pass


class ScheduleUpdate(BaseModel):
    """Schema for updating a Vessel Schedule."""

    vessel_id: int | None = Field(default=None)
    port_id: int | None = Field(default=None)
    eta: datetime | None = Field(default=None)
    predicted_eta: datetime | None = Field(default=None)
    etd: datetime | None = Field(default=None)
    containers_teu: int | None = Field(default=None)
    priority: str | None = Field(default=None)
    status: str | None = Field(default=None)

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str | None) -> str | None:
        if v is None:
            return v
        allowed = {"NORMAL", "HIGH", "CRITICAL"}
        if v.upper() not in allowed:
            raise ValueError(f"Priority must be one of {allowed}")
        return v.upper()

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is None:
            return v
        allowed = {"SCHEDULED", "ARRIVED", "BERTHED", "IN_PROGRESS", "COMPLETED", "CANCELLED"}
        if v.upper() not in allowed:
            raise ValueError(f"Status must be one of {allowed}")
        return v.upper()


class ScheduleResponse(BaseModel):
    """
    Schema for Vessel Schedule response.

    Does NOT inherit ScheduleBase validators so that existing DB rows
    are returned as-is without risking validation failures on read.
    """

    id: int
    vessel_id: int
    port_id: int
    eta: datetime
    predicted_eta: datetime | None = None
    etd: datetime | None = None
    containers_teu: int | None = None
    priority: str | None = None
    status: str | None = None
    vessel_name: str | None = None
    port_name: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class ScheduleListResponse(PaginatedResponse[ScheduleResponse]):
    """Paginated list of schedules."""
    pass
