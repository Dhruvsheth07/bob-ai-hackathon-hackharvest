"""
Pydantic schemas for the simulation engine.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ScenarioType(str, Enum):
    BERTH_UNAVAILABLE = "BERTH_UNAVAILABLE"
    CRANE_UNAVAILABLE = "CRANE_UNAVAILABLE"
    VESSEL_DELAY = "VESSEL_DELAY"
    INCREASED_ARRIVALS = "INCREASED_ARRIVALS"


class SimulationRequest(BaseModel):
    """Payload for triggering a what-if simulation."""
    port_id: int
    scenario_type: ScenarioType
    scenario_parameters: Dict[str, Any] = Field(
        ...,
        description="Parameters for the scenario (e.g., {'crane_id': 5, 'duration_hours': 12})"
    )


class SimulationMetrics(BaseModel):
    """Comparison metrics for baseline and simulated scenarios."""
    total_waiting_hours: float
    average_waiting_hours: float
    berth_utilization: float
    crane_utilization: float
    maximum_congestion_score: float
    number_of_delayed_vessels: int


class SimulationImpactSummary(BaseModel):
    """Calculated delta between simulated and baseline metrics."""
    waiting_hours_delta: float
    berth_utilization_delta: float
    crane_utilization_delta: float
    congestion_score_delta: float
    delayed_vessels_delta: int


class SimulationResponse(BaseModel):
    """Full details of a simulation run."""
    id: int
    port_id: int
    scenario_type: ScenarioType
    scenario_parameters: Dict[str, Any]
    baseline_metrics: Optional[SimulationMetrics]
    simulated_metrics: Optional[SimulationMetrics]
    impact_summary: Optional[SimulationImpactSummary]
    mitigation_recommendations: Optional[List[Dict[str, Any]]]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
