"""
Tests for berth & crane optimization engine and endpoints.
"""

from datetime import datetime, timedelta, timezone

import pytest

from app.optimization.input_model import BerthInput, CraneInput, SolverInput, VesselInput
from app.optimization.solver import BerthCraneSolver


# ── Unit Tests: Solver ────────────────────────────────────────────────────────

def test_solver_trivial_infeasible():
    """Empty inputs should short-circuit to INFEASIBLE without crashing."""
    input_data = SolverInput(
        port_id=1, horizon_slots=288, slot_duration_minutes=15,
        vessels=[], berths=[], cranes=[]
    )
    solver = BerthCraneSolver(input_data)
    solver.build_model()
    res = solver.solve()
    assert res.status == "INFEASIBLE"


def test_solver_basic_feasible():
    """1 vessel, 1 berth, 1 crane. Vessel should be scheduled at its ETA."""
    v1 = VesselInput(
        schedule_id=101, vessel_id=201, length_m=100.0, draft_m=8.0,
        containers_teu=500, priority="NORMAL", eta_slot=10, etd_slot=None
    )
    b1 = BerthInput(id=1, length_m=300.0, max_draft_m=15.0, capacity_teu=None)
    c1 = CraneInput(id=1, capacity_tph=30)
    
    input_data = SolverInput(
        port_id=1, horizon_slots=100, slot_duration_minutes=60,
        vessels=[v1], berths=[b1], cranes=[c1]
    )
    
    solver = BerthCraneSolver(input_data)
    solver.build_model()
    res = solver.solve()
    
    assert res.status in ["OPTIMAL", "FEASIBLE", "COMPLETED"]
    assert len(res.berth_assignments) == 1
    
    ba = res.berth_assignments[0]
    assert ba["vessel_schedule_id"] == 101
    assert ba["berth_id"] == 1
    assert ba["start_slot"] >= 10  # Must be >= ETA


def test_solver_dimension_conflict():
    """Vessel is too long/deep for the only available berth."""
    v1 = VesselInput(
        schedule_id=101, vessel_id=201, length_m=400.0, draft_m=16.0,
        containers_teu=500, priority="NORMAL", eta_slot=0, etd_slot=None
    )
    b1 = BerthInput(id=1, length_m=300.0, max_draft_m=15.0, capacity_teu=None)
    c1 = CraneInput(id=1, capacity_tph=30)
    
    input_data = SolverInput(
        port_id=1, horizon_slots=100, slot_duration_minutes=60,
        vessels=[v1], berths=[b1], cranes=[c1]
    )
    
    solver = BerthCraneSolver(input_data)
    solver.build_model()
    res = solver.solve()
    
    # Can still be 'COMPLETED' with empty assignments because solver just penalizes it
    assert res.status in ["OPTIMAL", "FEASIBLE", "COMPLETED"]
    assert len(res.berth_assignments) == 0


def test_solver_no_overlap():
    """2 vessels arriving at the same time, only 1 berth."""
    v1 = VesselInput(
        schedule_id=101, vessel_id=201, length_m=100.0, draft_m=8.0,
        containers_teu=60, priority="NORMAL", eta_slot=0, etd_slot=None
    )
    v2 = VesselInput(
        schedule_id=102, vessel_id=202, length_m=100.0, draft_m=8.0,
        containers_teu=60, priority="NORMAL", eta_slot=0, etd_slot=None
    )
    b1 = BerthInput(id=1, length_m=300.0, max_draft_m=15.0, capacity_teu=None)
    c1 = CraneInput(id=1, capacity_tph=30)
    
    input_data = SolverInput(
        port_id=1, horizon_slots=100, slot_duration_minutes=60,
        vessels=[v1, v2], berths=[b1], cranes=[c1]
    )
    
    solver = BerthCraneSolver(input_data)
    solver.build_model()
    res = solver.solve()
    
    assert res.status in ["OPTIMAL", "FEASIBLE", "COMPLETED"]
    assert len(res.berth_assignments) == 2
    
    ba1 = next(b for b in res.berth_assignments if b["vessel_schedule_id"] == 101)
    ba2 = next(b for b in res.berth_assignments if b["vessel_schedule_id"] == 102)
    
    # They should not overlap
    assert ba1["end_slot"] <= ba2["start_slot"] or ba2["end_slot"] <= ba1["start_slot"]


# ── Integration Tests: API ────────────────────────────────────────────────────

@pytest.fixture
def port_1_id():
    return 1


def test_run_optimization_unauthorized(client, port_1_id):
    """Anonymous user cannot run optimization."""
    resp = client.post(
        "/api/v1/optimization/run",
        json={"port_id": port_1_id, "horizon_hours": 24}
    )
    assert resp.status_code == 401


def test_run_optimization_viewer_forbidden(client, auth_headers, port_1_id):
    """VIEWER cannot run optimization."""
    resp = client.post(
        "/api/v1/optimization/run",
        headers=auth_headers,
        json={"port_id": port_1_id, "horizon_hours": 24}
    )
    assert resp.status_code == 403


def test_run_optimization_success(client, auth_headers_pm, port_1_id):
    """PORT_MANAGER can run optimization successfully."""
    # First, make sure there is at least one berth and crane (seeded by DB setup)
    # Then run the optimizer
    resp = client.post(
        "/api/v1/optimization/run",
        headers=auth_headers_pm,
        json={"port_id": port_1_id, "horizon_hours": 48}
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["run"]["port_id"] == port_1_id
    assert data["run"]["status"] in ["COMPLETED", "INFEASIBLE", "OPTIMAL", "FEASIBLE"]
    assert "metrics" in data


def test_get_optimization_run(client, auth_headers, auth_headers_pm, port_1_id):
    """Any authenticated user can fetch an optimization run."""
    # Run it first
    run_resp = client.post(
        "/api/v1/optimization/run",
        headers=auth_headers_pm,
        json={"port_id": port_1_id, "horizon_hours": 24}
    )
    run_id = run_resp.json()["run"]["id"]
    
    # Fetch run
    resp = client.get(f"/api/v1/optimization/{run_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == run_id


def test_get_optimization_run_not_found(client, auth_headers):
    """404 for unknown run."""
    resp = client.get("/api/v1/optimization/99999", headers=auth_headers)
    assert resp.status_code == 404


def test_get_run_assignments(client, auth_headers, auth_headers_pm, port_1_id):
    """Fetch the full assignments for a run."""
    run_resp = client.post(
        "/api/v1/optimization/run",
        headers=auth_headers_pm,
        json={"port_id": port_1_id, "horizon_hours": 24}
    )
    run_id = run_resp.json()["run"]["id"]
    
    resp = client.get(f"/api/v1/optimization/{run_id}/assignments", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "berth_assignments" in data
    assert "crane_assignments" in data
    assert "metrics" in data
