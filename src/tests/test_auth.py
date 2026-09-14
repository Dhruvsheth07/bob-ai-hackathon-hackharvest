"""
Tests for authentication endpoints.

POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
"""


class TestRegister:
    """Tests for POST /api/v1/auth/register."""

    def test_register_success(self, client):
        """Successful registration returns 201 with user data, no password_hash."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "ValidPass1",
                "name": "New User",
            },
        )

        assert response.status_code == 201
        data = response.json()

        assert data["email"] == "newuser@example.com"
        assert data["name"] == "New User"
        assert data["role"] == "VIEWER"
        assert data["is_active"] is True
        assert "id" in data
        # password_hash must NEVER appear in the response
        assert "password_hash" not in data
        assert "password" not in data

    def test_register_duplicate_email(self, client):
        """Registering with an existing email returns 409."""
        payload = {
            "email": "dupe@example.com",
            "password": "ValidPass1",
            "name": "First User",
        }
        # First registration should succeed
        resp1 = client.post("/api/v1/auth/register", json=payload)
        assert resp1.status_code == 201

        # Second registration with the same email should fail
        resp2 = client.post("/api/v1/auth/register", json=payload)
        assert resp2.status_code == 409
        assert "already exists" in resp2.json()["error"].lower()

    def test_register_weak_password(self, client):
        """Password that doesn't meet strength requirements is rejected."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "weak@example.com",
                "password": "short",
                "name": "Weak User",
            },
        )
        assert response.status_code == 422


class TestLogin:
    """Tests for POST /api/v1/auth/login."""

    def test_login_success(self, client, registered_user):
        """Valid credentials return 200 with access and refresh tokens."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": registered_user["email"],
                "password": registered_user["_password"],
            },
        )

        assert response.status_code == 200
        data = response.json()

        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0
        assert len(data["refresh_token"]) > 0

    def test_login_wrong_password(self, client, registered_user):
        """Wrong password returns 401."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": registered_user["email"],
                "password": "WrongPassword1",
            },
        )
        assert response.status_code == 401


class TestGetMe:
    """Tests for GET /api/v1/auth/me."""

    def test_get_me_with_valid_token(self, client, registered_user, auth_headers):
        """Valid token returns 200 with current user profile."""
        response = client.get("/api/v1/auth/me", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        assert data["email"] == registered_user["email"]
        assert data["name"] == "Test User"
        assert data["role"] == "VIEWER"
        assert "password_hash" not in data

    def test_get_me_invalid_token(self, client):
        """Invalid token returns 401."""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid-token-here"},
        )
        assert response.status_code == 401

    def test_get_me_no_token(self, client):
        """Missing token returns 401."""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401


class TestRoleProtection:
    """Tests for role-based access control."""

    def test_viewer_cannot_access_admin_endpoint(self, client, auth_headers):
        """
        A VIEWER user should get 403 when accessing an ADMIN-only endpoint.
        We test this by hitting a health endpoint protected with require_roles.

        Note: Since we don't have admin-only endpoints yet, we test the
        require_roles dependency directly via a test-only route.
        """
        from app.main import create_app
        from app.dependencies.auth import require_roles
        from app.database import get_db
        from fastapi import Depends
        from tests.conftest import override_get_db

        app = create_app()
        app.dependency_overrides[get_db] = override_get_db

        # Add a temporary admin-only route for testing
        @app.get("/api/v1/test-admin-only")
        def admin_only(user=Depends(require_roles("ADMIN"))):
            return {"message": "admin access granted"}

        from fastapi.testclient import TestClient

        with TestClient(app) as tc:
            # First register + login a VIEWER user
            tc.post(
                "/api/v1/auth/register",
                json={
                    "email": "viewer_role_test@example.com",
                    "password": "SecurePass1",
                    "name": "Viewer User",
                },
            )
            login_resp = tc.post(
                "/api/v1/auth/login",
                json={
                    "email": "viewer_role_test@example.com",
                    "password": "SecurePass1",
                },
            )
            token = login_resp.json()["access_token"]

            # Try accessing admin-only endpoint
            response = tc.get(
                "/api/v1/test-admin-only",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert response.status_code == 403

        app.dependency_overrides.clear()
