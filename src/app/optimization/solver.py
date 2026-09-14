"""
Berth and Crane Optimization Solver using Google OR-Tools CP-SAT.
"""

import math
from dataclasses import dataclass
from typing import Dict, List, Optional

from ortools.sat.python import cp_model

from app.optimization.input_model import SolverInput


@dataclass
class SolverResult:
    """Raw output from the solver before mapping to DB/API schemas."""
    status: str  # COMPLETED, INFEASIBLE, FAILED
    objective_value: Optional[float]
    berth_assignments: List[Dict]  # {"vessel_schedule_id": int, "berth_id": int, "start_slot": int, "end_slot": int}
    crane_assignments: List[Dict]  # {"vessel_schedule_id": int, "crane_count": int, "start_slot": int, "end_slot": int}


class BerthCraneSolver:
    """
    CP-SAT model for assigning vessels to berths and allocating cranes.
    Works entirely in discrete time slots to avoid floating point issues.
    """

    def __init__(self, input_data: SolverInput):
        self.input = input_data
        self.model = cp_model.CpModel()
        
        # We need at least 1 berth and 1 vessel to solve anything.
        self.is_trivial_infeasible = False
        if not self.input.berths or not self.input.vessels:
            self.is_trivial_infeasible = True
            
        self.vars = {}  # Store CP-SAT variables here
        self.vessel_tasks = {} # Store IntervalVars for vessels
        
    def _get_service_slots(self, teu: int, crane_count: int, crane_tph: int) -> int:
        """Estimate required slots based on TEU and crane productivity."""
        if crane_count <= 0 or crane_tph <= 0:
            return 999999 # effectively infinite
        
        # Rough assumption: 1 TEU = 14 tons avg (for TPH conversion)
        # However, many ports measure crane capacity in Moves Per Hour (MPH).
        # We will assume capacity_tph means TEU per hour for simplicity here.
        hours_needed = teu / (crane_count * crane_tph)
        minutes_needed = hours_needed * 60
        slots_needed = math.ceil(minutes_needed / self.input.slot_duration_minutes)
        return max(1, slots_needed)

    def build_model(self) -> None:
        """Define variables, constraints, and objective function."""
        if self.is_trivial_infeasible:
            return

        horizon = self.input.horizon_slots
        num_berths = len(self.input.berths)
        
        # Assumption for v1: all cranes at the port are roughly identical in capacity.
        # We allocate a *count* of cranes per vessel to keep the model tractable.
        total_cranes = len(self.input.cranes)
        avg_crane_tph = 30 # default 30 moves/hour
        if self.input.cranes:
            valid_tph = [c.capacity_tph for c in self.input.cranes if c.capacity_tph]
            if valid_tph:
                avg_crane_tph = sum(valid_tph) // len(valid_tph)

        # 1. Variables
        vessel_intervals = []
        berth_intervals = {b.id: [] for b in self.input.berths}
        crane_demands = []
        
        obj_vars = []
        obj_coeffs = []

        for v in self.input.vessels:
            # We create an "is_assigned" boolean in case the vessel simply cannot fit in the horizon.
            is_assigned = self.model.NewBoolVar(f"assigned_{v.schedule_id}")
            
            # Start slot must be >= ETA slot
            start_slot = self.model.NewIntVar(v.eta_slot, horizon, f"start_{v.schedule_id}")
            
            # For v1, we fix crane count to 2 per vessel if available, else 1
            crane_count = min(2, max(1, total_cranes))
            duration = self._get_service_slots(v.containers_teu, crane_count, avg_crane_tph)
            
            end_slot = self.model.NewIntVar(v.eta_slot + duration, horizon + duration, f"end_{v.schedule_id}")
            
            # Only valid if is_assigned == 1
            interval = self.model.NewOptionalIntervalVar(
                start_slot, duration, end_slot, is_assigned, f"interval_{v.schedule_id}"
            )
            vessel_intervals.append(interval)
            
            # Crane capacity demand for cumulative constraint
            # (If assigned, it uses `crane_count` cranes, else 0)
            demand = self.model.NewIntVar(0, crane_count, f"crane_demand_{v.schedule_id}")
            self.model.Add(demand == crane_count).OnlyEnforceIf(is_assigned)
            self.model.Add(demand == 0).OnlyEnforceIf(is_assigned.Not())
            crane_demands.append(demand)
            
            # Which berth?
            # We create a boolean matrix for assignment: x[v, b] = 1 if vessel v is at berth b
            v_berth_vars = []
            for b in self.input.berths:
                # Check dimensions
                if b.length_m < v.length_m or (b.max_draft_m and b.max_draft_m < v.draft_m):
                    # Incompatible
                    b_var = self.model.NewBoolVar(f"v{v.schedule_id}_b{b.id}_incompatible")
                    self.model.Add(b_var == 0)
                else:
                    b_var = self.model.NewBoolVar(f"v{v.schedule_id}_b{b.id}")
                    # If assigned to this berth, we create a copy of the interval for the NoOverlap constraint
                    b_interval = self.model.NewOptionalIntervalVar(
                        start_slot, duration, end_slot, b_var, f"interval_v{v.schedule_id}_b{b.id}"
                    )
                    berth_intervals[b.id].append(b_interval)
                    
                v_berth_vars.append(b_var)
                
            # If assigned, sum of b_var == 1, else 0
            self.model.AddExactlyOne(v_berth_vars).OnlyEnforceIf(is_assigned)
            self.model.Add(sum(v_berth_vars) == 0).OnlyEnforceIf(is_assigned.Not())
            
            # Save vars for result extraction
            self.vars[v.schedule_id] = {
                "is_assigned": is_assigned,
                "start_slot": start_slot,
                "end_slot": end_slot,
                "berth_vars": {b.id: v_berth_vars[idx] for idx, b in enumerate(self.input.berths)},
                "crane_count": crane_count
            }

            # Objectives:
            priority_weight = 5 if v.priority == "CRITICAL" else (3 if v.priority == "HIGH" else 1)
            
            # Penalty for NOT assigning (heavy)
            not_assigned_penalty = self.model.NewIntVar(0, 1000000, f"unassigned_pen_{v.schedule_id}")
            self.model.Add(not_assigned_penalty == 10000 * priority_weight).OnlyEnforceIf(is_assigned.Not())
            self.model.Add(not_assigned_penalty == 0).OnlyEnforceIf(is_assigned)
            
            obj_vars.append(not_assigned_penalty)
            obj_coeffs.append(1)
            
            # Penalty for waiting (start_slot - eta_slot)
            wait_time = self.model.NewIntVar(0, horizon, f"wait_{v.schedule_id}")
            self.model.Add(wait_time == start_slot - v.eta_slot)
            
            obj_vars.append(wait_time)
            obj_coeffs.append(priority_weight)

        # 2. Constraints
        
        # Berth capacity (NoOverlap)
        for b_id, intervals in berth_intervals.items():
            if intervals:
                self.model.AddNoOverlap(intervals)
                
        # Crane capacity (Cumulative)
        if total_cranes > 0 and vessel_intervals:
            self.model.AddCumulative(vessel_intervals, crane_demands, total_cranes)

        # 3. Objective
        self.model.Minimize(sum(var * coeff for var, coeff in zip(obj_vars, obj_coeffs)))

    def solve(self, time_limit_seconds: int = 30) -> SolverResult:
        """Run the CP-SAT solver and extract assignments."""
        if self.is_trivial_infeasible:
            return SolverResult(status="INFEASIBLE", objective_value=None, berth_assignments=[], crane_assignments=[])
            
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = time_limit_seconds
        # Optional: solver.parameters.log_search_progress = True
        
        status = solver.Solve(self.model)
        
        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            berth_assignments = []
            crane_assignments = []
            
            for v_id, v_vars in self.vars.items():
                if solver.Value(v_vars["is_assigned"]):
                    start_slot = solver.Value(v_vars["start_slot"])
                    end_slot = solver.Value(v_vars["end_slot"])
                    
                    # Find assigned berth
                    assigned_b_id = None
                    for b_id, b_var in v_vars["berth_vars"].items():
                        if solver.Value(b_var):
                            assigned_b_id = b_id
                            break
                            
                    if assigned_b_id is not None:
                        berth_assignments.append({
                            "vessel_schedule_id": v_id,
                            "berth_id": assigned_b_id,
                            "start_slot": start_slot,
                            "end_slot": end_slot
                        })
                        
                        crane_assignments.append({
                            "vessel_schedule_id": v_id,
                            "crane_count": v_vars["crane_count"],
                            "start_slot": start_slot,
                            "end_slot": end_slot
                        })
                        
            return SolverResult(
                status="COMPLETED",
                objective_value=solver.ObjectiveValue(),
                berth_assignments=berth_assignments,
                crane_assignments=crane_assignments
            )
        elif status == cp_model.INFEASIBLE:
            return SolverResult(status="INFEASIBLE", objective_value=None, berth_assignments=[], crane_assignments=[])
        else:
            return SolverResult(status="FAILED", objective_value=None, berth_assignments=[], crane_assignments=[])
