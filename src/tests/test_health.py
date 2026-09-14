"""
Tests for the GET /api/v1/health endpoint.
"""


def test_health_returns_200(client):
    """Health endpoint should return HTTP 200 with expected fields."""
    response = client.get("/api/v1/health")

    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert "environment" in data
    assert "version" in data
    assert "db_connected" in data


def test_health_response_shape(client):
    """Health response should contain exactly the expected keys."""
    response = client.get("/api/v1/health")
    data = response.json()

    expected_keys = {"status", "environment", "version", "db_connected"}
    assert set(data.keys()) == expected_keys


def test_health_version_format(client):
    """Version should be a semantic version string."""
    response = client.get("/api/v1/health")
    data = response.json()

    version = data["version"]
    parts = version.split(".")
    assert len(parts) == 3, f"Version '{version}' is not semver"
    assert all(part.isdigit() for part in parts)
