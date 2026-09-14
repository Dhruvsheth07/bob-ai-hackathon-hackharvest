"""
Data classes representing the solver's input universe.
Isolated from SQLAlchemy and FastAPI models to allow pure unit testing.
"""

from dataclasses import dataclass
from typing import List, Optional


@dataclass
class VesselInput:
    """A vessel to be scheduled."""
    schedule_id: int
    vessel_id: int
    length_m: float
    draft_m: float
    containers_teu: int
    priority: str  # NORMAL, HIGH, CRITICAL
    eta_slot: int  # Converted to solver time slot index
    etd_slot: Optional[int]


@dataclass
class BerthInput:
    """A berth resource."""
    id: int
    length_m: float
    max_draft_m: Optional[float]
    capacity_teu: Optional[int]


@dataclass
class CraneInput:
    """A crane resource."""
    id: int
    capacity_tph: int


@dataclass
class SolverInput:
    """The full universe for one optimization run."""
    port_id: int
    horizon_slots: int
    slot_duration_minutes: int
    vessels: List[VesselInput]
    berths: List[BerthInput]
    cranes: List[CraneInput]
