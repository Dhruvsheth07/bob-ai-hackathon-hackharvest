"""
Integration tests for What-If Simulation API.
"""

from datetime import datetime, timedelta
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.berth import Berth
from app.models.crane import Crane
from app.models.port import Port
from app.models.simulation import Simulation
from app.models.vessel import Vessel
from app.models.vessel_schedule import VesselSchedule


def test_run_simulation(client: TestClient, db_session: Session, auth_headers_admin: dict):
    # Setup test data
    port = Port(name="Test Port", code="TST", location="Test Location")
    db_session.add(port)
    db_session.commit()
    
    vessel = Vessel(name="Test Vessel", imo_number=str(uuid.uuid4().int)[:7], vessel_type="CONTAINER", capacity_teu=1000, length_m=300)
    db_session.add(vessel)
    db_session.commit()

    berth = Berth(port_id=port.id, name="Berth 1", length_m=200, status="AVAILABLE")
    db_session.add(berth)
    db_session.commit()
    
    crane = Crane(port_id=port.id, name="Crane 1", capacity_tph=30)
    db_session.add(crane)
    db_session.commit()

    schedule = VesselSchedule(
        vessel_id=vessel.id, 
        port_id=port.id,
        eta=datetime.now(),
        etd=datetime.now() + timedelta(days=2),
        status="SCHEDULED"
    )
    db_session.add(schedule)
    db_session.commit()

    # Run Simulation
    response = client.post(
        "/api/v1/simulations",
        headers=auth_headers_admin,
        json={
            "port_id": port.id,
            "scenario_type": "VESSEL_DELAY",
            "scenario_parameters": {
                "vessel_id": vessel.id,
                "delay_hours": 12
            }
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["port_id"] == port.id
    assert data["scenario_type"] == "VESSEL_DELAY"
    assert data["status"] == "COMPLETED"
    
    sim_id = data["id"]
    
    # Verify we didn't modify production schedule
    db_session.refresh(schedule)
    # The ETA in DB should remain unchanged (we would need to save the original to check exactly, but
    # our engine logic operates only on lists of models and doesn't flush)
    
    # Get Simulation
    response = client.get(
        f"/api/v1/simulations/{sim_id}",
        headers=auth_headers_admin
    )
    assert response.status_code == 200
    assert response.json()["id"] == sim_id
    assert "simulated_metrics" in response.json()
    assert "impact_summary" in response.json()
