"""
Maps CP-SAT output (slots) back to datetimes and domain models.
"""

from datetime import datetime, timedelta
from typing import List

from app.models.berth_assignment import BerthAssignment
from app.models.crane_assignment import CraneAssignment
from app.optimization.input_model import CraneInput
from app.optimization.solver import SolverResult


def map_solver_result(
    solver_result: SolverResult,
    run_id: int,
    base_time: datetime,
    slot_duration_minutes: int,
    available_cranes: List[CraneInput],
) -> tuple[List[BerthAssignment], List[CraneAssignment]]:
    """
    Convert integer slot assignments back to SQLAlchemy objects.
    """
    if solver_result.status != "COMPLETED":
        return [], []

    berth_assignments = []
    crane_assignments = []

    # Map berths
    for b in solver_result.berth_assignments:
        start_dt = base_time + timedelta(minutes=b["start_slot"] * slot_duration_minutes)
        end_dt = base_time + timedelta(minutes=b["end_slot"] * slot_duration_minutes)
        
        ba = BerthAssignment(
            vessel_schedule_id=b["vessel_schedule_id"],
            berth_id=b["berth_id"],
            optimization_run_id=run_id,
            start_time=start_dt,
            end_time=end_dt,
            status="PLANNED",
        )
        berth_assignments.append(ba)

    # Map cranes (distribute the required crane_count among available cranes)
    for c in solver_result.crane_assignments:
        start_dt = base_time + timedelta(minutes=c["start_slot"] * slot_duration_minutes)
        end_dt = base_time + timedelta(minutes=c["end_slot"] * slot_duration_minutes)
        
        count = c["crane_count"]
        # For simplicity in v1, we just pick the first `count` cranes. 
        # A more advanced version would track individual crane schedules here.
        assigned_cranes = available_cranes[:count]
        
        for crane in assigned_cranes:
            ca = CraneAssignment(
                vessel_schedule_id=c["vessel_schedule_id"],
                crane_id=crane.id,
                optimization_run_id=run_id,
                start_time=start_dt,
                end_time=end_dt,
                productivity_teu_per_hour=crane.capacity_tph,
            )
            crane_assignments.append(ca)

    return berth_assignments, crane_assignments
