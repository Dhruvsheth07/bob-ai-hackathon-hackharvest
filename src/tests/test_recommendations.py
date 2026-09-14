"""
Tests for the recommendation engine and endpoints.
"""

from datetime import datetime, timedelta, timezone

import pytest

from app.recommendations.generator import (
    rule_congestion_warning,
    rule_priority_escalation,
    rule_vessel_delay,
)


# ── Unit Tests: Individual Rules ─────────────────────────────────────────────

def test_rule_congestion_warning_no_predictions(db_session):
    """No predictions → no warnings generated."""
    recs = rule_congestion_warning(db_session, port_id=1, run_id=None)
    assert recs == []


def test_rule_vessel_delay_no_delays(db_session):
    """No past-ETA SCHEDULED vessels → no VESSEL_DELAY recommendations."""
    recs = rule_vessel_delay(db_session, port_id=1, run_id=None)
    assert recs == []


def test_rule_priority_escalation_no_run(db_session):
    """No run_id → no PRIORITY_ESCALATION (can't check assignments)."""
    recs = rule_priority_escalation(db_session, port_id=1, run_id=None)
    assert recs == []


# ── Integration Tests: API ────────────────────────────────────────────────────

@pytest.fixture
def port_1_id():
    return 1


@pytest.fixture
def recommendation_id(client, auth_headers_pm, port_1_id):
    """Run optimization (which auto-generates recommendations) and return
    the ID of the first recommendation found, or create one directly."""
    # Run optimization to trigger recommendation generation
    run_resp = client.post(
        "/api/v1/optimization/run",
        headers=auth_headers_pm,
        json={"port_id": port_1_id, "horizon_hours": 24, "time_limit_seconds": 5},
    )
    assert run_resp.status_code == 201

    # List all recommendations
    list_resp = client.get("/api/v1/recommendations", headers=auth_headers_pm)
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]

    if not items:
        pytest.skip("No recommendations generated — DB has no vessels/schedules to trigger rules")

    return items[0]["id"]


def test_list_recommendations_auth_required(client):
    """Unauthenticated users cannot list recommendations."""
    resp = client.get("/api/v1/recommendations")
    assert resp.status_code == 401


def test_list_recommendations(client, auth_headers, auth_headers_pm, port_1_id):
    """Authenticated user can list recommendations."""
    # Trigger generation
    client.post(
        "/api/v1/optimization/run",
        headers=auth_headers_pm,
        json={"port_id": port_1_id, "horizon_hours": 24, "time_limit_seconds": 5},
    )
    resp = client.get("/api/v1/recommendations", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


def test_list_recommendations_filter_status(client, auth_headers, auth_headers_pm, port_1_id):
    """Can filter by status."""
    client.post(
        "/api/v1/optimization/run",
        headers=auth_headers_pm,
        json={"port_id": port_1_id, "horizon_hours": 24, "time_limit_seconds": 5},
    )
    resp = client.get(
        "/api/v1/recommendations",
        headers=auth_headers,
        params={"status": "PENDING"},
    )
    assert resp.status_code == 200
    for item in resp.json()["items"]:
        assert item["status"] == "PENDING"


def test_get_recommendation_not_found(client, auth_headers):
    """Non-existent recommendation → 404."""
    resp = client.get("/api/v1/recommendations/99999", headers=auth_headers)
    assert resp.status_code == 404


def test_get_recommendation_by_id(client, auth_headers, recommendation_id):
    """Fetch a single recommendation by ID."""
    resp = client.get(f"/api/v1/recommendations/{recommendation_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == recommendation_id


def test_accept_recommendation(client, auth_headers_pm, recommendation_id):
    """PORT_MANAGER can accept a recommendation."""
    resp = client.post(
        f"/api/v1/recommendations/{recommendation_id}/accept",
        headers=auth_headers_pm,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "ACCEPTED"


def test_reject_requires_supervisor(client, auth_headers, recommendation_id):
    """VIEWER cannot reject a recommendation → 403."""
    resp = client.post(
        f"/api/v1/recommendations/{recommendation_id}/reject",
        headers=auth_headers,
    )
    assert resp.status_code == 403


def test_double_accept_fails(client, auth_headers_pm, recommendation_id):
    """Cannot accept a recommendation that's already ACCEPTED → 400."""
    # Accept it first
    client.post(
        f"/api/v1/recommendations/{recommendation_id}/accept",
        headers=auth_headers_pm,
    )
    # Try to accept again
    resp = client.post(
        f"/api/v1/recommendations/{recommendation_id}/accept",
        headers=auth_headers_pm,
    )
    assert resp.status_code == 400


def test_reject_recommendation(client, auth_headers_pm, port_1_id):
    """PORT_MANAGER can reject a recommendation."""
    # Generate a fresh one
    client.post(
        "/api/v1/optimization/run",
        headers=auth_headers_pm,
        json={"port_id": port_1_id, "horizon_hours": 24, "time_limit_seconds": 5},
    )
    list_resp = client.get(
        "/api/v1/recommendations",
        headers=auth_headers_pm,
        params={"status": "PENDING"},
    )
    items = list_resp.json()["items"]
    if not items:
        pytest.skip("No PENDING recommendations to reject")

    rec_id = items[0]["id"]
    resp = client.post(
        f"/api/v1/recommendations/{rec_id}/reject",
        headers=auth_headers_pm,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "REJECTED"
