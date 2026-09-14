"""
Tests for vessel endpoints.
"""

def test_list_vessels(client, auth_headers):
    """List vessels."""
    resp = client.get("/api/v1/vessels", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] >= 0

def test_create_vessel(client, auth_headers_pm):
    """Create a vessel as PORT_MANAGER."""
    resp = client.post(
        "/api/v1/vessels",
        headers=auth_headers_pm,
        json={"name": "Test Vessel", "imo_number": "IMO1234567"}
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test Vessel"
    assert data["imo_number"] == "IMO1234567"

def test_create_vessel_rbac_viewer(client, auth_headers):
    """VIEWER cannot create a vessel."""
    resp = client.post(
        "/api/v1/vessels",
        headers=auth_headers,
        json={"name": "Test Vessel 2", "imo_number": "IMO7654321"}
    )
    assert resp.status_code == 403

def test_duplicate_imo(client, auth_headers_pm):
    """Cannot create vessel with duplicate IMO."""
    payload = {"name": "Test Vessel 3", "imo_number": "1111111"}
    client.post("/api/v1/vessels", headers=auth_headers_pm, json=payload)
    resp = client.post("/api/v1/vessels", headers=auth_headers_pm, json=payload)
    assert resp.status_code == 409

def test_invalid_dimensions(client, auth_headers_pm):
    """Cannot create vessel with negative dimensions."""
    resp = client.post(
        "/api/v1/vessels",
        headers=auth_headers_pm,
        json={"name": "Test", "length_m": -10}
    )
    assert resp.status_code == 422

def test_get_and_update_vessel(client, auth_headers_pm, auth_headers):
    """Get and update a vessel."""
    # Create
    resp1 = client.post(
        "/api/v1/vessels",
        headers=auth_headers_pm,
        json={"name": "Old Name", "imo_number": "2222222"}
    )
    v_id = resp1.json()["id"]

    # Get as VIEWER
    resp2 = client.get(f"/api/v1/vessels/{v_id}", headers=auth_headers)
    assert resp2.status_code == 200
    assert resp2.json()["name"] == "Old Name"

    # Update as PM
    resp3 = client.put(
        f"/api/v1/vessels/{v_id}",
        headers=auth_headers_pm,
        json={"name": "New Name"}
    )
    assert resp3.status_code == 200
    assert resp3.json()["name"] == "New Name"

def test_delete_vessel_rbac(client, auth_headers_pm, auth_headers_admin):
    """Delete requires ADMIN."""
    resp1 = client.post(
        "/api/v1/vessels",
        headers=auth_headers_pm,
        json={"name": "To Delete", "imo_number": "3333333"}
    )
    v_id = resp1.json()["id"]

    # PM cannot delete
    resp2 = client.delete(f"/api/v1/vessels/{v_id}", headers=auth_headers_pm)
    assert resp2.status_code == 403

    # ADMIN can delete
    resp3 = client.delete(f"/api/v1/vessels/{v_id}", headers=auth_headers_admin)
    assert resp3.status_code == 204

    # Verify deleted
    resp4 = client.get(f"/api/v1/vessels/{v_id}", headers=auth_headers_admin)
    assert resp4.status_code == 404
