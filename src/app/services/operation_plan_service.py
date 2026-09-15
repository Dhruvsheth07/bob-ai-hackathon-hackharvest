from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.berth_assignment import BerthAssignment
from app.models.congestion_prediction import CongestionPrediction
from app.models.crane_assignment import CraneAssignment
from app.models.operation_plan import OperationPlan
from app.models.operation_plan_item import OperationPlanItem
from app.models.optimization_run import OptimizationRun
from app.models.vessel_schedule import VesselSchedule
from app.repositories.operation_plan_repository import OperationPlanRepository


def _get_shift_label(dt: datetime) -> str:
    hour = dt.hour
    if 0 <= hour < 8:
        return "Night Shift (00:00 - 08:00)"
    elif 8 <= hour < 16:
        return "Morning Shift (08:00 - 16:00)"
    else:
        return "Evening Shift (16:00 - 00:00)"


class OperationPlanService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = OperationPlanRepository(db)

    def generate_plan(
        self,
        port_id: int,
        start_time: datetime,
        horizon_hours: int = 72,
        optimization_run_id: Optional[int] = None
    ) -> OperationPlan:
        # 1. Fetch latest optimization run if not provided
        if optimization_run_id is None:
            opt_run = self.db.scalar(
                select(OptimizationRun)
                .where(OptimizationRun.port_id == port_id)
                .where(OptimizationRun.status == "COMPLETED")
                .order_by(desc(OptimizationRun.created_at))
            )
            if not opt_run:
                raise ValueError(f"No completed optimization run found for port {port_id}")
            optimization_run_id = opt_run.id
        else:
            opt_run = self.db.scalar(
                select(OptimizationRun).where(OptimizationRun.id == optimization_run_id)
            )
            if not opt_run:
                raise ValueError(f"Optimization run {optimization_run_id} not found")

        # 2. Fetch berth and crane assignments for this run
        berth_assignments = list(self.db.scalars(
            select(BerthAssignment).where(BerthAssignment.optimization_run_id == optimization_run_id)
        ).all())

        crane_assignments = list(self.db.scalars(
            select(CraneAssignment).where(CraneAssignment.optimization_run_id == optimization_run_id)
        ).all())

        # 3. Build items
        end_time = start_time + timedelta(hours=horizon_hours)
        items: List[OperationPlanItem] = []
        
        # We need vessel schedules to get vessel priorities
        vessel_ids = [ba.vessel_schedule_id for ba in berth_assignments]
        # We use vessel_schedule_id to get VesselSchedule which has vessel_id? Let's check models.
        # Actually BerthAssignment has vessel_schedule_id. VesselSchedule has vessel_id.
        # Let's map vessel_schedule_id to VesselSchedule
        schedules = {
            vs.id: vs
            for vs in self.db.scalars(
                select(VesselSchedule).where(VesselSchedule.id.in_(vessel_ids))
            ).all()
        }

        # Calculate cranes per berth assignment
        cranes_per_assignment: Dict[int, int] = {}
        for ca in crane_assignments:
            # We assume crane assignments are linked to vessel schedules as well
            if ca.vessel_schedule_id not in cranes_per_assignment:
                cranes_per_assignment[ca.vessel_schedule_id] = 0
            cranes_per_assignment[ca.vessel_schedule_id] += 1

        for ba in berth_assignments:
            schedule = schedules.get(ba.vessel_schedule_id)
            if not schedule:
                continue
                
            # Check if assignment falls within the horizon
            if ba.start_time > end_time or ba.end_time < start_time:
                continue
            
            # Simple shift calculation based on start time
            shift = _get_shift_label(ba.start_time)
            
            # Determine priority (could be from Vessel or VesselSchedule, just setting a placeholder if missing)
            priority = "NORMAL"
            
            item = OperationPlanItem(
                vessel_id=schedule.vessel_id,
                berth_id=ba.berth_id,
                planned_start=ba.start_time,
                planned_end=ba.end_time,
                crane_count=cranes_per_assignment.get(ba.vessel_schedule_id, 0),
                shift_label=shift,
                priority=priority
            )
            items.append(item)

        # 4. Gather congestion predictions
        predictions = list(self.db.scalars(
            select(CongestionPrediction)
            .where(
                CongestionPrediction.port_id == port_id,
                CongestionPrediction.prediction_time >= start_time,
                CongestionPrediction.prediction_time <= end_time
            )
            .order_by(CongestionPrediction.prediction_time)
        ).all())

        high_risk_periods = [
            {
                "time": p.prediction_time.isoformat(),
                "level": p.risk_level,
                "score": float(p.congestion_score)
            }
            for p in predictions if p.risk_level in ["HIGH", "CRITICAL"]
        ]

        summary_metrics = {
            "total_vessels_handled": len(items),
            "average_cranes_per_vessel": sum(i.crane_count for i in items) / len(items) if items else 0,
            "total_high_risk_periods": len(high_risk_periods)
        }

        recommendations = {
            "supervisor_actions": [
                "Ensure extra staff during HIGH risk periods.",
                "Verify crane availability at shift changes."
            ]
        }

        # 5. Create header
        plan = OperationPlan(
            port_id=port_id,
            optimization_run_id=optimization_run_id,
            start_time=start_time,
            horizon_hours=horizon_hours,
            status="DRAFT",
            summary_metrics=summary_metrics,
            congestion_windows={"high_risk_periods": high_risk_periods},
            recommendations=recommendations
        )

        plan = self.repo.create_plan(plan)
        
        # Connect plan id to items
        for item in items:
            item.plan_id = plan.id
            
        self.repo.create_plan_items(items)
        
        # Refresh to load relationships
        self.db.refresh(plan)
        return plan

    def get_plan(self, plan_id: int) -> Optional[OperationPlan]:
        return self.repo.get_by_id(plan_id)

    def list_plans(self, skip: int = 0, limit: int = 100) -> List[OperationPlan]:
        return self.repo.get_all(skip, limit)

    def approve_plan(self, plan_id: int) -> Optional[OperationPlan]:
        return self.repo.update_status(plan_id, "APPROVED")
