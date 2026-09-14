"""
Tests for vessel schedule endpoints.
"""

import pytest
from datetime import datetime, timedelta, timezone

@pytest.fixture
def vessel_id(client, auth_headers_pm):
    """Create a test vessel and return its ID."""
    resp = client.post(
        "/api/v1/vessels",
        headers=auth_headers_pm,
        json={"name": "Schedule Test Vessel"}
    )
    assert resp.status_code == 201
    return resp.json()["id"]

def test_create_schedule(client, auth_headers_pm, vessel_id):
    """Create a schedule."""
    # Port 1 is seeded in setup_test_db
    eta = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    resp = client.post(
        "/api/v1/schedules",
        headers=auth_headers_pm,
        json={
            "vessel_id": vessel_id,
            "port_id": 1,
            "eta": eta
        }
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["vessel_id"] == vessel_id
    assert data["port_id"] == 1
    assert data["status"] == "SCHEDULED"

def test_create_schedule_invalid_fk(client, auth_headers_pm):
    """Cannot create schedule for non-existent vessel."""
    eta = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    resp = client.post(
        "/api/v1/schedules",
        headers=auth_headers_pm,
        json={
            "vessel_id": 9999,
            "port_id": 1,
            "eta": eta
        }
    )
    assert resp.status_code == 400

def test_create_schedule_eta_etd(client, auth_headers_pm, vessel_id):
    """ETD must be after ETA."""
    eta = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    etd = datetime.now(timezone.utc).isoformat()
    resp = client.post(
        "/api/v1/schedules",
        headers=auth_headers_pm,
        json={
            "vessel_id": vessel_id,
            "port_id": 1,
            "eta": eta,
            "etd": etd
        }
    )
    assert resp.status_code == 422

def test_list_upcoming(client, auth_headers, auth_headers_pm, vessel_id):
    """List upcoming schedules."""
    # Create an upcoming schedule
    eta = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    client.post(
        "/api/v1/schedules",
        headers=auth_headers_pm,
        json={
            "vessel_id": vessel_id,
            "port_id": 1,
            "eta": eta,
            "status": "SCHEDULED"
        }
    )
    
    # Create a completed schedule (should not be in upcoming)
    client.post(
        "/api/v1/schedules",
        headers=auth_headers_pm,
        json={
            "vessel_id": vessel_id,
            "port_id": 1,
            "eta": eta,
            "status": "COMPLETED"
        }
    )
    
    resp = client.get("/api/v1/schedules/upcoming", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    # Check that all returned are SCHEDULED or ARRIVED
    for item in data:
        assert item["status"] in ["SCHEDULED", "ARRIVED"]
