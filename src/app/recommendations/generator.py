"""
Rule-based recommendation generator.

Each rule reads from persisted DB data and emits zero or more
Recommendation objects. The generator is idempotent — it will not
create a duplicate PENDING recommendation of the same type for the
same entity.
"""

from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.berth_assignment import BerthAssignment
from app.models.congestion_prediction import CongestionPrediction
from app.models.crane_assignment import CraneAssignment
from app.models.crane import Crane
from app.models.recommendation import Recommendation
from app.models.vessel_schedule import VesselSchedule


# ── Deduplication Helper ─────────────────────────────────────────────────────

def _already_exists(db: Session, rec_type: str, entity_id: Optional[int]) -> bool:
    """Return True if there is already a PENDING recommendation of this type for this entity.

    Uses Python-side JSONB filtering to stay compatible with SQLite test databases.
    """
    pending = db.query(Recommendation).filter(
        Recommendation.type == rec_type,
        Recommendation.status == "PENDING",
    ).all()

    if not pending:
        return False

    if entity_id is None:
        return True  # Type-level dedup (e.g. CONGESTION_WARNING per port)

    for rec in pending:
        impact = rec.expected_impact
        if isinstance(impact, dict) and impact.get("entity_id") == entity_id:
            return True
    return False


# ── Rule 1: CONGESTION_WARNING ───────────────────────────────────────────────

def rule_congestion_warning(
    db: Session, port_id: int, run_id: Optional[int]
) -> List[Recommendation]:
    """
    Generate CONGESTION_WARNING for any HIGH/CRITICAL prediction in the next 24h.
    One recommendation per distinct risk level upgrade per port.
    """
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    window = now + timedelta(hours=24)

    predictions = (
        db.query(CongestionPrediction)
        .filter(
            CongestionPrediction.port_id == port_id,
            CongestionPrediction.risk_level.in_(["HIGH", "CRITICAL"]),
            CongestionPrediction.prediction_time >= now,
            CongestionPrediction.prediction_time <= window,
        )
        .order_by(CongestionPrediction.prediction_time.asc())
        .all()
    )

    if not predictions:
        return []

    worst = max(predictions, key=lambda p: {"HIGH": 1, "CRITICAL": 2}.get(p.risk_level, 0))

    if _already_exists(db, "CONGESTION_WARNING", port_id):
        return []

    return [Recommendation(
        optimization_run_id=run_id,
        type="CONGESTION_WARNING",
        severity=worst.risk_level,
        title=f"Congestion {worst.risk_level} risk predicted within 24 hours",
        description=(
            f"The congestion model predicts {worst.risk_level} risk at "
            f"{worst.prediction_time.strftime('%H:%M %d %b')} "
            f"with score {float(worst.congestion_score):.2f}. "
            "Consider redistributing vessel arrivals or pre-positioning resources."
        ),
        expected_impact={
            "entity_id": port_id,
            "risk_level": worst.risk_level,
            "congestion_score": float(worst.congestion_score),
            "prediction_time": worst.prediction_time.isoformat(),
            "port_id": port_id,
        },
        status="PENDING",
    )]


# ── Rule 2: VESSEL_DELAY ─────────────────────────────────────────────────────

def rule_vessel_delay(
    db: Session, port_id: int, run_id: Optional[int]
) -> List[Recommendation]:
    """
    Generate VESSEL_DELAY for any vessel whose ETA has passed > 30 minutes ago
    but is still in SCHEDULED status (not yet ARRIVED/BERTHED).
    """
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    cutoff = now - timedelta(minutes=30)

    delayed = (
        db.query(VesselSchedule)
        .filter(
            VesselSchedule.port_id == port_id,
            VesselSchedule.status == "SCHEDULED",
            VesselSchedule.eta <= cutoff,
        )
        .all()
    )

    recs = []
    for s in delayed:
        if _already_exists(db, "VESSEL_DELAY", s.id):
            continue
        delay_hours = round((now - s.eta).total_seconds() / 3600, 1)
        recs.append(Recommendation(
            optimization_run_id=run_id,
            type="VESSEL_DELAY",
            severity="MEDIUM" if delay_hours < 2 else "HIGH",
            title=f"Vessel schedule {s.id} is delayed by {delay_hours}h",
            description=(
                f"Vessel schedule ID {s.id} had ETA {s.eta.strftime('%H:%M %d %b')} "
                f"but remains in SCHEDULED status. Actual delay: {delay_hours}h. "
                "Notify berth planners to update the berth queue."
            ),
            expected_impact={
                "entity_id": s.id,
                "vessel_schedule_id": s.id,
                "eta": s.eta.isoformat(),
                "delay_hours": delay_hours,
            },
            status="PENDING",
        ))
    return recs


# ── Rule 3: PRIORITY_ESCALATION ──────────────────────────────────────────────

def rule_priority_escalation(
    db: Session, port_id: int, run_id: Optional[int]
) -> List[Recommendation]:
    """
    Generate PRIORITY_ESCALATION for any CRITICAL/HIGH vessel that has no
    berth assignment in the most recent optimization run for this port.
    """
    if run_id is None:
        return []

    # Scheduled vessels with HIGH/CRITICAL priority
    priority_vessels = (
        db.query(VesselSchedule)
        .filter(
            VesselSchedule.port_id == port_id,
            VesselSchedule.status.in_(["SCHEDULED", "ARRIVED"]),
            VesselSchedule.priority.in_(["HIGH", "CRITICAL"]),
        )
        .all()
    )

    if not priority_vessels:
        return []

    # Get assigned schedule IDs in this run
    assigned_ids = {
        ba.vessel_schedule_id
        for ba in db.query(BerthAssignment.vessel_schedule_id)
        .filter(BerthAssignment.optimization_run_id == run_id)
        .all()
    }

    recs = []
    for s in priority_vessels:
        if s.id in assigned_ids:
            continue
        if _already_exists(db, "PRIORITY_ESCALATION", s.id):
            continue
        recs.append(Recommendation(
            optimization_run_id=run_id,
            type="PRIORITY_ESCALATION",
            severity="CRITICAL" if s.priority == "CRITICAL" else "HIGH",
            title=f"Priority {s.priority} vessel (schedule {s.id}) unassigned",
            description=(
                f"Vessel schedule ID {s.id} has {s.priority} priority but received "
                "no berth assignment in the latest optimization run. "
                "Manual intervention required to ensure timely service."
            ),
            expected_impact={
                "entity_id": s.id,
                "vessel_schedule_id": s.id,
                "priority": s.priority,
                "run_id": run_id,
            },
            status="PENDING",
        ))
    return recs


# ── Rule 4: CRANE_REALLOCATION ───────────────────────────────────────────────

def rule_crane_reallocation(
    db: Session, port_id: int, run_id: Optional[int]
) -> List[Recommendation]:
    """
    Generate CRANE_REALLOCATION when a single vessel is assigned > 80% of
    the port's available cranes simultaneously.
    """
    if run_id is None:
        return []

    total_cranes = db.query(Crane).filter(Crane.port_id == port_id).count()
    if total_cranes == 0:
        return []

    threshold = total_cranes * 0.8

    crane_counts = (
        db.query(
            CraneAssignment.vessel_schedule_id,
            db.query(CraneAssignment.vessel_schedule_id)
            .with_entities(CraneAssignment.vessel_schedule_id)
            .count()
        )
        .filter(CraneAssignment.optimization_run_id == run_id)
        .group_by(CraneAssignment.vessel_schedule_id)
        .all()
    )

    # Simpler alternative query using raw count
    from sqlalchemy import func
    grouped = (
        db.query(CraneAssignment.vessel_schedule_id, func.count().label("cnt"))
        .filter(CraneAssignment.optimization_run_id == run_id)
        .group_by(CraneAssignment.vessel_schedule_id)
        .all()
    )

    recs = []
    for schedule_id, cnt in grouped:
        if cnt < threshold:
            continue
        if _already_exists(db, "CRANE_REALLOCATION", schedule_id):
            continue
        recs.append(Recommendation(
            optimization_run_id=run_id,
            type="CRANE_REALLOCATION",
            severity="MEDIUM",
            title=f"Vessel schedule {schedule_id} holds {cnt}/{total_cranes} cranes",
            description=(
                f"Schedule ID {schedule_id} has been allocated {cnt} out of "
                f"{total_cranes} total cranes ({int(cnt/total_cranes*100)}%). "
                "Consider redistributing cranes to improve port throughput."
            ),
            expected_impact={
                "entity_id": schedule_id,
                "vessel_schedule_id": schedule_id,
                "crane_count": cnt,
                "total_cranes": total_cranes,
                "utilization_pct": round(cnt / total_cranes * 100, 1),
            },
            status="PENDING",
        ))
    return recs


# ── Rule 5: BERTH_CHANGE ─────────────────────────────────────────────────────

def rule_berth_change(
    db: Session, port_id: int, run_id: Optional[int]
) -> List[Recommendation]:
    """
    Generate BERTH_CHANGE when a vessel has a berth assignment that differs from
    the previous optimization run's assignment for the same port.
    Only generates if there are at least 2 runs for this port.
    """
    if run_id is None:
        return []

    from app.models.optimization_run import OptimizationRun
    prev_run = (
        db.query(OptimizationRun)
        .filter(
            OptimizationRun.port_id == port_id,
            OptimizationRun.id < run_id,
            OptimizationRun.status == "COMPLETED",
        )
        .order_by(OptimizationRun.id.desc())
        .first()
    )
    if not prev_run:
        return []

    # Build {schedule_id: berth_id} for both runs
    def assignment_map(r_id: int) -> dict:
        return {
            ba.vessel_schedule_id: ba.berth_id
            for ba in db.query(BerthAssignment)
            .filter(BerthAssignment.optimization_run_id == r_id)
            .all()
        }

    current_map = assignment_map(run_id)
    prev_map = assignment_map(prev_run.id)

    recs = []
    for sched_id, berth_id in current_map.items():
        prev_berth = prev_map.get(sched_id)
        if prev_berth is None or prev_berth == berth_id:
            continue
        if _already_exists(db, "BERTH_CHANGE", sched_id):
            continue
        recs.append(Recommendation(
            optimization_run_id=run_id,
            type="BERTH_CHANGE",
            severity="MEDIUM",
            title=f"Berth reassignment detected for schedule {sched_id}",
            description=(
                f"Vessel schedule {sched_id} was moved from berth {prev_berth} "
                f"to berth {berth_id} between optimization runs. "
                "Notify the vessel's agent and update berthing notices."
            ),
            expected_impact={
                "entity_id": sched_id,
                "vessel_schedule_id": sched_id,
                "old_berth_id": prev_berth,
                "new_berth_id": berth_id,
                "previous_run_id": prev_run.id,
            },
            status="PENDING",
        ))
    return recs


# ── Main Entry Point ─────────────────────────────────────────────────────────

def generate_all(
    db: Session, port_id: int, run_id: Optional[int]
) -> List[Recommendation]:
    """Run all 5 rules and return the combined de-duplicated list."""
    results: List[Recommendation] = []
    for rule_fn in [
        rule_congestion_warning,
        rule_vessel_delay,
        rule_priority_escalation,
        rule_crane_reallocation,
        rule_berth_change,
    ]:
        try:
            results.extend(rule_fn(db, port_id, run_id))
        except Exception:
            # Individual rule failure must not abort the others
            pass
    return results
