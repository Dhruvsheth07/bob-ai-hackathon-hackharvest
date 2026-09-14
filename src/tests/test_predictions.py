"""
Tests for congestion prediction endpoints and engine logic.
"""

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest

from app.prediction.engine import RuleBasedEngine
from app.prediction.feature_extractor import (
    compute_arrival_pressure,
    compute_berth_utilization,
    compute_crane_utilization,
)
from app.schemas.prediction import PredictionFeatures


# ── Unit tests: engine ──────────────────────────────────────────────────────

class TestRuleBasedEngine:
    """Direct unit tests on the prediction engine (no DB required)."""

    engine = RuleBasedEngine()

    def test_score_all_zero(self):
        """All features zero → score 0.0 → LOW."""
        features = PredictionFeatures(
            berth_utilization=0.0,
            crane_utilization=0.0,
            yard_utilization=0.0,
            arrival_pressure=0.0,
        )
        score, risk = self.engine.predict(features)
        assert score == 0.0
        assert risk == "LOW"

    def test_score_all_one(self):
        """All features 1.0 → score 1.0 → CRITICAL."""
        features = PredictionFeatures(
            berth_utilization=1.0,
            crane_utilization=1.0,
            yard_utilization=1.0,
            arrival_pressure=1.0,
        )
        score, risk = self.engine.predict(features)
        assert score == 1.0
        assert risk == "CRITICAL"

    def test_score_formula(self):
        """Verify weighted formula: 0.35*0.8 + 0.25*0.6 + 0.20*0.4 + 0.20*0.0."""
        features = PredictionFeatures(
            berth_utilization=0.8,
            crane_utilization=0.4,
            yard_utilization=0.0,
            arrival_pressure=0.6,
        )
        expected = round(0.35 * 0.8 + 0.25 * 0.6 + 0.20 * 0.4 + 0.20 * 0.0, 4)
        score, _ = self.engine.predict(features)
        assert abs(score - expected) < 1e-4

    @pytest.mark.parametrize("score,expected_risk", [
        (0.0,  "LOW"),
        (0.39, "LOW"),
        (0.40, "MEDIUM"),
        (0.69, "MEDIUM"),
        (0.70, "HIGH"),
        (0.84, "HIGH"),
        (0.85, "CRITICAL"),
        (1.0,  "CRITICAL"),
    ])
    def test_risk_bands(self, score, expected_risk):
        """Check every risk band boundary."""
        assert self.engine._classify_risk(score) == expected_risk

    def test_model_version(self):
        assert self.engine.MODEL_VERSION == "rule_based_v1.0"


# ── Integration tests: API endpoints ───────────────────────────────────────

@pytest.fixture
def port_1_id():
    """Port ID 1 is seeded by conftest setup_test_db."""
    return 1


def test_generate_forecast_requires_auth(client, port_1_id):
    """POST without a token → 401."""
    resp = client.post(
        "/api/v1/predictions/congestion",
        json={"port_id": port_1_id, "horizon_hours": 4, "interval_hours": 1},
    )
    assert resp.status_code == 401


def test_generate_forecast_viewer_forbidden(client, auth_headers, port_1_id):
    """VIEWER cannot trigger a forecast."""
    resp = client.post(
        "/api/v1/predictions/congestion",
        headers=auth_headers,
        json={"port_id": port_1_id, "horizon_hours": 4, "interval_hours": 1},
    )
    assert resp.status_code == 403


def test_generate_forecast_success(client, auth_headers_pm, port_1_id):
    """PORT_MANAGER generates a 4-hour forecast at 1-hour intervals → 4 predictions."""
    resp = client.post(
        "/api/v1/predictions/congestion",
        headers=auth_headers_pm,
        json={"port_id": port_1_id, "horizon_hours": 4, "interval_hours": 1},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["port_id"] == port_1_id
    assert len(data["predictions"]) == 4
    # Each prediction must have a valid risk level
    for p in data["predictions"]:
        assert p["risk_level"] in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
        assert 0.0 <= p["congestion_score"] <= 1.0
        assert p["model_version"] == "rule_based_v1.0"
        # yard_utilization always 0.0 this phase
        assert p["yard_utilization"] == 0.0


def test_generate_forecast_invalid_port(client, auth_headers_pm):
    """Non-existent port → 404."""
    resp = client.post(
        "/api/v1/predictions/congestion",
        headers=auth_headers_pm,
        json={"port_id": 99999, "horizon_hours": 2, "interval_hours": 1},
    )
    assert resp.status_code == 404


def test_list_predictions(client, auth_headers, auth_headers_pm, port_1_id):
    """Generate then list predictions."""
    # Generate
    client.post(
        "/api/v1/predictions/congestion",
        headers=auth_headers_pm,
        json={"port_id": port_1_id, "horizon_hours": 2, "interval_hours": 1},
    )
    # List
    resp = client.get(
        "/api/v1/predictions/congestion",
        headers=auth_headers,
        params={"port_id": port_1_id},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 2
    assert all(p["port_id"] == port_1_id for p in data["items"])


def test_get_prediction_by_id(client, auth_headers, auth_headers_pm, port_1_id):
    """Generate a forecast and then fetch one prediction by ID."""
    gen_resp = client.post(
        "/api/v1/predictions/congestion",
        headers=auth_headers_pm,
        json={"port_id": port_1_id, "horizon_hours": 1, "interval_hours": 1},
    )
    pred_id = gen_resp.json()["predictions"][0]["id"]

    resp = client.get(f"/api/v1/predictions/congestion/{pred_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == pred_id


def test_get_prediction_not_found(client, auth_headers):
    """Non-existent prediction ID → 404."""
    resp = client.get("/api/v1/predictions/congestion/99999", headers=auth_headers)
    assert resp.status_code == 404


def test_get_forecast_endpoint(client, auth_headers, auth_headers_pm, port_1_id):
    """GET /forecast returns stored predictions for the port."""
    # Generate first
    client.post(
        "/api/v1/predictions/congestion",
        headers=auth_headers_pm,
        json={"port_id": port_1_id, "horizon_hours": 2, "interval_hours": 1},
    )
    resp = client.get(
        "/api/v1/predictions/congestion/forecast",
        headers=auth_headers,
        params={"port_id": port_1_id, "horizon_hours": 72},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["port_id"] == port_1_id
    assert isinstance(data["predictions"], list)


def test_forecast_invalid_port(client, auth_headers):
    """GET /forecast for non-existent port → 404."""
    resp = client.get(
        "/api/v1/predictions/congestion/forecast",
        headers=auth_headers,
        params={"port_id": 99999},
    )
    assert resp.status_code == 404
