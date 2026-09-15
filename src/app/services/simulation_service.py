"""
What-If Simulation service logic.
"""

import math
from datetime import datetime, timezone, timedelta
from typing import Tuple

from sqlalchemy.orm import Session, joinedload

from app.exceptions import NotFoundException, BadRequestException
from app.models.berth import Berth
from app.models.crane import Crane
from app.models.port import Port
from app.models.simulation import Simulation
from app.models.vessel_schedule import VesselSchedule
from app.optimization.input_model import BerthInput, CraneInput, SolverInput, VesselInput
from app.optimization.solver import BerthCraneSolver
from app.prediction.engine import rule_based_engine
from app.prediction.feature_extractor import extract_features
from app.schemas.simulation import (
    ScenarioType,
    SimulationImpactSummary,
    SimulationMetrics,
    SimulationRequest,
    SimulationResponse,
)

SLOT_DURATION_MINUTES = 15
HORIZON_HOURS = 72


def _compute_metrics(
    db: Session,
    port_id: int,
    solver_input: SolverInput,
    time_limit_seconds: int = 10,
) -> SimulationMetrics:
    """Run solver and prediction on the given inputs and return metrics."""
    # 1. Run optimization
    solver = BerthCraneSolver(solver_input)
    solver.build_model()
    solver_res = solver.solve(time_limit_seconds=time_limit_seconds)
    
    # 2. Extract assignment wait times
    total_wait_minutes = 0.0
    delayed_vessels = 0
    assigned_vessels = 0
    
    if solver_res.status in ("COMPLETED", "FEASIBLE") and solver_res.berth_assignments:
        for a in solver_res.berth_assignments:
            assigned_vessels += 1
            v_in = next((v for v in solver_input.vessels if v.schedule_id == a["vessel_schedule_id"]), None)
            if v_in:
                wait_slots = max(0, a["start_slot"] - v_in.eta_slot)
                wait_mins = wait_slots * SLOT_DURATION_MINUTES
                total_wait_minutes += wait_mins
                if wait_mins > 0:
                    delayed_vessels += 1
                    
    total_wait_hours = total_wait_minutes / 60.0
    avg_wait_hours = total_wait_hours / assigned_vessels if assigned_vessels > 0 else 0.0

    # 3. Predict congestion score (use live features but could be adjusted for simulation)
    # For a true simulation, we should alter the features, but for now we'll do a basic prediction
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    features = extract_features(db, port_id, now)
    
    # Simple mock adjustment based on assignments
    b_util = features.berth_utilization
    c_util = features.crane_utilization
    if assigned_vessels > 0:
        b_util = min(1.0, assigned_vessels / max(1, len(solver_input.berths)))
    
    score, _ = rule_based_engine.predict(features)
    
    return SimulationMetrics(
        total_waiting_hours=round(total_wait_hours, 2),
        average_waiting_hours=round(avg_wait_hours, 2),
        berth_utilization=round(b_util, 2),
        crane_utilization=round(c_util, 2),
        maximum_congestion_score=round(score, 2),
        number_of_delayed_vessels=delayed_vessels
    )


def run_simulation(db: Session, request: SimulationRequest) -> SimulationResponse:
    port = db.query(Port).filter(Port.id == request.port_id).first()
    if not port:
        raise NotFoundException(detail="Port not found.")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    horizon_slots = math.ceil((HORIZON_HOURS * 60) / SLOT_DURATION_MINUTES)
    
    # 1. Load Baseline Input Data
    berths = db.query(Berth).filter(Berth.port_id == request.port_id).all()
    cranes = db.query(Crane).filter(Crane.port_id == request.port_id).all()
    
    schedules = (
        db.query(VesselSchedule)
        .options(joinedload(VesselSchedule.vessel))
        .filter(
            VesselSchedule.port_id == request.port_id,
            VesselSchedule.status.in_(["SCHEDULED", "ARRIVED", "BERTHED"])
        )
        .all()
    )
    
    b_inputs = [BerthInput(b.id, float(b.length_m), float(b.max_draft_m) if b.max_draft_m else None, b.capacity_teu) for b in berths]
    c_inputs = [CraneInput(c.id, c.capacity_tph or 30) for c in cranes]
    
    v_inputs = []
    for s in schedules:
        v = s.vessel
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
        
    baseline_solver_input = SolverInput(
        port_id=request.port_id,
        horizon_slots=horizon_slots,
        slot_duration_minutes=SLOT_DURATION_MINUTES,
        vessels=list(v_inputs),
        berths=list(b_inputs),
        cranes=list(c_inputs)
    )
    
    # 2. Compute Baseline Metrics
    baseline_metrics = _compute_metrics(db, request.port_id, baseline_solver_input)
    
    # 3. Apply Scenario Modifications
    sim_b_inputs = list(b_inputs)
    sim_c_inputs = list(c_inputs)
    sim_v_inputs = [
        VesselInput(
            schedule_id=v.schedule_id, vessel_id=v.vessel_id, length_m=v.length_m,
            draft_m=v.draft_m, containers_teu=v.containers_teu, priority=v.priority,
            eta_slot=v.eta_slot, etd_slot=v.etd_slot
        ) for v in v_inputs
    ]
    
    if request.scenario_type == ScenarioType.BERTH_UNAVAILABLE:
        berth_id = request.scenario_parameters.get("berth_id")
        sim_b_inputs = [b for b in sim_b_inputs if b.berth_id != berth_id]
        if not sim_b_inputs:
            raise BadRequestException("Scenario leaves no berths available.")
            
    elif request.scenario_type == ScenarioType.CRANE_UNAVAILABLE:
        crane_id = request.scenario_parameters.get("crane_id")
        sim_c_inputs = [c for c in sim_c_inputs if c.crane_id != crane_id]
        if not sim_c_inputs:
            raise BadRequestException("Scenario leaves no cranes available.")
            
    elif request.scenario_type == ScenarioType.VESSEL_DELAY:
        vessel_id = request.scenario_parameters.get("vessel_id")
        delay_hours = request.scenario_parameters.get("delay_hours", 0)
        delay_slots = math.ceil((delay_hours * 60) / SLOT_DURATION_MINUTES)
        for v in sim_v_inputs:
            if v.vessel_id == vessel_id:
                v.eta_slot += delay_slots
                if v.etd_slot:
                    v.etd_slot += delay_slots
                    
    elif request.scenario_type == ScenarioType.INCREASED_ARRIVALS:
        count = request.scenario_parameters.get("additional_vessels", 1)
        # Add mock vessels
        for i in range(count):
            sim_v_inputs.append(VesselInput(
                schedule_id=-1 * (i + 1),
                vessel_id=-1 * (i + 1),
                length_m=200.0,
                draft_m=10.0,
                containers_teu=1500,
                priority=1,
                eta_slot=10,
                etd_slot=None
            ))
            
    sim_solver_input = SolverInput(
        port_id=request.port_id,
        horizon_slots=horizon_slots,
        slot_duration_minutes=SLOT_DURATION_MINUTES,
        vessels=sim_v_inputs,
        berths=sim_b_inputs,
        cranes=sim_c_inputs
    )
    
    # 4. Compute Simulated Metrics
    simulated_metrics = _compute_metrics(db, request.port_id, sim_solver_input)
    
    # 5. Compute Impact Summary
    impact = SimulationImpactSummary(
        waiting_hours_delta=round(simulated_metrics.total_waiting_hours - baseline_metrics.total_waiting_hours, 2),
        berth_utilization_delta=round(simulated_metrics.berth_utilization - baseline_metrics.berth_utilization, 2),
        crane_utilization_delta=round(simulated_metrics.crane_utilization - baseline_metrics.crane_utilization, 2),
        congestion_score_delta=round(simulated_metrics.maximum_congestion_score - baseline_metrics.maximum_congestion_score, 2),
        delayed_vessels_delta=simulated_metrics.number_of_delayed_vessels - baseline_metrics.number_of_delayed_vessels
    )
    
    # 6. Generate Recommendations
    recs = []
    if impact.waiting_hours_delta > 10:
        recs.append({"action": "Re-assign cranes to prioritize delayed vessels", "impact": "High"})
    if request.scenario_type == ScenarioType.BERTH_UNAVAILABLE:
        recs.append({"action": "Divert low priority vessels to neighboring ports", "impact": "Medium"})
        
    # 7. Persist Simulation
    sim = Simulation(
        port_id=request.port_id,
        scenario_type=request.scenario_type.value,
        scenario_parameters=request.scenario_parameters,
        baseline_metrics=baseline_metrics.model_dump(),
        simulated_metrics=simulated_metrics.model_dump(),
        impact_summary=impact.model_dump(),
        mitigation_recommendations=recs,
        status="COMPLETED"
    )
    db.add(sim)
    db.commit()
    db.refresh(sim)
    
    # 8. Return response
    return SimulationResponse.model_validate(sim)


def get_simulation(db: Session, simulation_id: int) -> SimulationResponse:
    sim = db.query(Simulation).filter(Simulation.id == simulation_id).first()
    if not sim:
        raise NotFoundException(detail="Simulation not found.")
    return SimulationResponse.model_validate(sim)
