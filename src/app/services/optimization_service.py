"""
Optimization service logic.
"""

import math
from datetime import datetime, timezone

from sqlalchemy.orm import Session, joinedload

from app.exceptions import NotFoundException
from app.models.berth import Berth
from app.models.crane import Crane
from app.models.optimization_run import OptimizationRun
from app.models.port import Port
from app.models.vessel_schedule import VesselSchedule
from app.optimization.input_model import BerthInput, CraneInput, SolverInput, VesselInput
from app.optimization.result_mapper import map_solver_result
from app.optimization.solver import BerthCraneSolver
from app.repositories import optimization_repository
from app.schemas.optimization import (
    BerthAssignmentResult,
    CraneAssignmentResult,
    OptimizationMetrics,
    OptimizationRequest,
    OptimizationResult,
    OptimizationRunResponse,
)

SLOT_DURATION_MINUTES = 15


def run_optimization(db: Session, request: OptimizationRequest, user_id: int) -> OptimizationResult:
    """Run optimization for a port and return results."""
    
    # 1. Validate Port
    port = db.query(Port).filter(Port.id == request.port_id).first()
    if not port:
        raise NotFoundException(detail="Port not found.")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    horizon_slots = math.ceil((request.horizon_hours * 60) / SLOT_DURATION_MINUTES)
    
    # Create the run record in PENDING state
    run = OptimizationRun(
        port_id=request.port_id,
        start_time=now,
        horizon_hours=request.horizon_hours,
        status="RUNNING",
        created_by=user_id
    )
    run = optimization_repository.create_run(db, run)
    
    try:
        # 2. Load Input Data
        berths = db.query(Berth).filter(Berth.port_id == request.port_id).all()
        cranes = db.query(Crane).filter(Crane.port_id == request.port_id).all()
        
        # Load upcoming vessel schedules that haven't completed
        schedules = (
            db.query(VesselSchedule)
            .options(joinedload(VesselSchedule.vessel))
            .filter(
                VesselSchedule.port_id == request.port_id,
                VesselSchedule.status.in_(["SCHEDULED", "ARRIVED", "BERTHED"])
            )
            .all()
        )
        
        # Build solver input
        b_inputs = [
            BerthInput(b.id, float(b.length_m), float(b.max_draft_m) if b.max_draft_m else None, b.capacity_teu)
            for b in berths
        ]
        
        c_inputs = [
            CraneInput(c.id, c.capacity_tph or 30)
            for c in cranes
        ]
        
        v_inputs = []
        for s in schedules:
            v = s.vessel
            # Calculate ETA slot
            minutes_from_now = (s.eta - now).total_seconds() / 60
            eta_slot = max(0, math.floor(minutes_from_now / SLOT_DURATION_MINUTES))
            
            etd_slot = None
            if s.etd:
                etd_mins = (s.etd - now).total_seconds() / 60
                etd_slot = max(0, math.floor(etd_mins / SLOT_DURATION_MINUTES))
                
            v_inputs.append(VesselInput(
                schedule_id=s.id,
                vessel_id=v.id,
                length_m=float(v.length_m),
                draft_m=float(v.draft_m) if v.draft_m else 10.0,
                containers_teu=v.capacity_teu or 1000,
                priority=s.priority,
                eta_slot=eta_slot,
                etd_slot=etd_slot
            ))
            
        solver_input = SolverInput(
            port_id=request.port_id,
            horizon_slots=horizon_slots,
            slot_duration_minutes=SLOT_DURATION_MINUTES,
            vessels=v_inputs,
            berths=b_inputs,
            cranes=c_inputs
        )
        
        # 3. Solve
        solver = BerthCraneSolver(solver_input)
        solver.build_model()
        solver_res = solver.solve(time_limit_seconds=request.time_limit_seconds)
        
        # 4. Map & Persist Results
        run.status = solver_res.status
        if solver_res.objective_value is not None:
            run.objective_value = solver_res.objective_value
            
        optimization_repository.update_run(db, run)
        
        berth_assigns, crane_assigns = map_solver_result(
            solver_res, run.id, now, SLOT_DURATION_MINUTES, c_inputs
        )
        
        if berth_assigns or crane_assigns:
            optimization_repository.save_assignments(db, berth_assigns, crane_assigns)

        # 5. Auto-generate recommendations from the completed run
        if solver_res.status == "COMPLETED":
            try:
                from app.services import recommendation_service as _rec_svc
                _rec_svc.generate_recommendations(db, request.port_id, run.id)
            except Exception:
                # Recommendation generation failure must not roll back the optimization result
                pass
            
        return _build_result(db, run)
            
    except Exception as e:
        run.status = "FAILED"
        optimization_repository.update_run(db, run)
        raise e


def get_optimization_run(db: Session, run_id: int) -> OptimizationResult:
    """Fetch a run and its assignments."""
    run = optimization_repository.get_run_by_id(db, run_id)
    if not run:
        raise NotFoundException("Optimization run not found.")
    return _build_result(db, run)


def _build_result(db: Session, run: OptimizationRun) -> OptimizationResult:
    """Helper to assemble OptimizationResult from DB records."""
    b_assigns, c_assigns = optimization_repository.get_assignments(db, run.id)
    
    b_res = []
    for ba in b_assigns:
        b_res.append(BerthAssignmentResult(
            vessel_schedule_id=ba.vessel_schedule_id,
            vessel_name=ba.vessel_schedule.vessel.name if ba.vessel_schedule.vessel else None,
            berth_id=ba.berth_id,
            berth_name=ba.berth.name if ba.berth else None,
            start_time=ba.start_time,
            end_time=ba.end_time,
            status=ba.status or "PLANNED"
        ))
        
    c_res = []
    for ca in c_assigns:
        c_res.append(CraneAssignmentResult(
            vessel_schedule_id=ca.vessel_schedule_id,
            crane_id=ca.crane_id,
            crane_name=ca.crane.name if ca.crane else None,
            start_time=ca.start_time,
            end_time=ca.end_time,
            productivity_teu_per_hour=ca.productivity_teu_per_hour
        ))
        
    metrics = OptimizationMetrics(
        vessels_scheduled=len(b_res),
        vessels_unassigned=0,  # Could be calculated against input
        avg_wait_time_hours=0.0, # Placeholder
        berth_utilization_pct=0.0 # Placeholder
    )
    
    run_resp = OptimizationRunResponse(
        id=run.id,
        port_id=run.port_id,
        status=run.status or "UNKNOWN",
        objective_value=float(run.objective_value) if run.objective_value is not None else None,
        horizon_hours=run.horizon_hours,
        created_at=run.created_at
    )
    
    return OptimizationResult(
        run=run_resp,
        metrics=metrics,
        berth_assignments=b_res,
        crane_assignments=c_res
    )
