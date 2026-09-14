"""
Pydantic schemas for berth & crane optimization endpoints.
"""

from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


class OptimizationRequest(BaseModel):
    """Input parameters to trigger an optimization run."""

    port_id: int = Field(..., description="ID of the port to optimize")
    horizon_hours: int = Field(default=72, ge=12, le=168, description="Planning horizon in hours")
    time_limit_seconds: int = Field(default=30, ge=1, le=120, description="Solver time limit")


class BerthAssignmentResult(BaseModel):
    """A single vessel's assignment to a berth."""

    vessel_schedule_id: int
    vessel_name: str | None = None
    berth_id: int
    berth_name: str | None = None
    start_time: datetime
    end_time: datetime
    status: str

    model_config = {"from_attributes": True}


class CraneAssignmentResult(BaseModel):
    """A single crane assigned to a vessel."""

    vessel_schedule_id: int
    crane_id: int
    crane_name: str | None = None
    start_time: datetime
    end_time: datetime
    productivity_teu_per_hour: int | None = None

    model_config = {"from_attributes": True}


class OptimizationRunResponse(BaseModel):
    """Basic metadata about an optimization run."""

    id: int
    port_id: int
    status: str
    objective_value: float | None = None
    horizon_hours: int | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class OptimizationMetrics(BaseModel):
    """Summary metrics of the optimization run."""

    vessels_scheduled: int
    vessels_unassigned: int
    avg_wait_time_hours: float
    berth_utilization_pct: float


class OptimizationResult(BaseModel):
    """The full payload returned after a run or when querying run details."""

    run: OptimizationRunResponse
    metrics: OptimizationMetrics
    berth_assignments: List[BerthAssignmentResult]
    crane_assignments: List[CraneAssignmentResult]
