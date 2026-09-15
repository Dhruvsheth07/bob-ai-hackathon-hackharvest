import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.models.operation_plan import OperationPlan
from app.models.optimization_run import OptimizationRun
from app.models.berth_assignment import BerthAssignment
from app.models.vessel_schedule import VesselSchedule
from app.models.vessel import Vessel
from app.models.port import Port
from app.models.berth import Berth


def test_generate_operations_plan(client: TestClient, db_session: Session, auth_headers: dict):
    # Setup test data
    port = Port(name="Test Port", code="TST", location="Test Location")
    db_session.add(port)
    db_session.commit()
    
    vessel = Vessel(name="Test Vessel", imo_number="1234567", vessel_type="CONTAINER", capacity_teu=1000)
    db_session.add(vessel)
    db_session.commit()

    berth = Berth(port_id=port.id, name="Berth 1", length_m=200, status="AVAILABLE")
    db_session.add(berth)
    db_session.commit()

    schedule = VesselSchedule(
        vessel_id=vessel.id, 
        port_id=port.id,
        eta=datetime.utcnow(),
        etd=datetime.utcnow() + timedelta(days=2),
        status="SCHEDULED"
    )
    db_session.add(schedule)
    db_session.commit()
    
    opt_run = OptimizationRun(port_id=port.id, start_time=datetime.utcnow(), status="COMPLETED")
    db_session.add(opt_run)
    db_session.commit()

    assignment = BerthAssignment(
        optimization_run_id=opt_run.id,
        vessel_schedule_id=schedule.id,
        berth_id=berth.id,
        start_time=datetime.utcnow(),
        end_time=datetime.utcnow() + timedelta(hours=10)
    )
    db_session.add(assignment)
    db_session.commit()

    # Generate plan
    start_time_iso = datetime.utcnow().isoformat()
    response = client.post(
        "/api/v1/operations-plans/generate",
        headers=auth_headers,
        json={
            "port_id": port.id,
            "start_time": start_time_iso,
            "horizon_hours": 72,
            "optimization_run_id": opt_run.id
        }
    )
    
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["status"] == "DRAFT"
    assert data["port_id"] == port.id
    assert len(data["items"]) == 1
    assert data["items"][0]["vessel_id"] == vessel.id
    
    plan_id = data["id"]
    
    # Get plan
    response = client.get(
        f"/api/v1/operations-plans/{plan_id}",
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["id"] == plan_id

    # Approve plan
    response = client.post(
        f"/api/v1/operations-plans/{plan_id}/approve",
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["status"] == "APPROVED"
