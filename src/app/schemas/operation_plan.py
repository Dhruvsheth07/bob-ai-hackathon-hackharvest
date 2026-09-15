from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class OperationPlanItemBase(BaseModel):
    vessel_id: int
    berth_id: Optional[int] = None
    planned_start: datetime
    planned_end: datetime
    crane_count: int = Field(default=0)
    shift_label: Optional[str] = None
    priority: Optional[str] = None


class OperationPlanItemCreate(OperationPlanItemBase):
    plan_id: int


class OperationPlanItemResponse(OperationPlanItemBase):
    id: int
    plan_id: int

    model_config = ConfigDict(from_attributes=True)


class OperationPlanBase(BaseModel):
    port_id: int
    start_time: datetime
    horizon_hours: int = Field(default=72)
    status: str = Field(default="DRAFT")


class OperationPlanCreate(OperationPlanBase):
    optimization_run_id: Optional[int] = None
    summary_metrics: Optional[Dict[str, Any]] = None
    congestion_windows: Optional[Dict[str, Any]] = None
    recommendations: Optional[Dict[str, Any]] = None
    created_by: Optional[int] = None


class OperationPlanUpdate(BaseModel):
    status: Optional[str] = None


class OperationPlanResponse(OperationPlanBase):
    id: int
    optimization_run_id: Optional[int] = None
    summary_metrics: Optional[Dict[str, Any]] = None
    congestion_windows: Optional[Dict[str, Any]] = None
    recommendations: Optional[Dict[str, Any]] = None
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    items: List[OperationPlanItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class OperationPlanGenerateRequest(BaseModel):
    port_id: int
    start_time: Optional[datetime] = None
    horizon_hours: int = Field(default=72)
    optimization_run_id: Optional[int] = None
