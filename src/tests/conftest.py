"""
Pytest configuration and shared fixtures.
"""

import os

# Set test environment variables BEFORE any app imports.
# These must be set before pydantic-settings reads them.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["APP_ENV"] = "testing"
os.environ["LOG_LEVEL"] = "DEBUG"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-do-not-use-in-production"

# Clear the settings cache so it picks up our test env vars
from app.config import get_settings
get_settings.cache_clear()

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker, Session

from app.database import get_db
from app.models import Base
from app.models.role import Role


# In-memory SQLite engine for tests (no real PostgreSQL needed)
test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = sessionmaker(
    bind=test_engine,
    autocommit=False,
    autoflush=False,
)


def override_get_db():
    """Yield a test database session."""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create all tables and seed roles in the in-memory test database."""
    Base.metadata.create_all(bind=test_engine)

    # Seed roles so auth tests can find them
    db = TestSessionLocal()
    try:
        existing = db.query(Role).first()
        if not existing:
            roles = [
                Role(id=1, name="ADMIN"),
                Role(id=2, name="PORT_MANAGER"),
                Role(id=3, name="SHIFT_SUPERVISOR"),
                Role(id=4, name="OPERATOR"),
                Role(id=5, name="ANALYST"),
                Role(id=6, name="VIEWER"),
            ]
            db.add_all(roles)
            db.commit()
    finally:
        db.close()

    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def db_session() -> Session:
    """Provide a clean database session for each test."""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()


@pytest.fixture()
def client() -> TestClient:
    """
    Provide a FastAPI TestClient with database dependency overridden
    to use the in-memory SQLite database.
    """
    from app.main import create_app

    app = create_app()
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as tc:
        yield tc

    app.dependency_overrides.clear()


@pytest.fixture()
def registered_user(client: TestClient) -> dict:
    """Register a test user and return the response data."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "testuser@example.com",
            "password": "SecurePass1",
            "name": "Test User",
        },
    )
    assert response.status_code == 201
    return response.json()


@pytest.fixture()
def auth_headers(client: TestClient, registered_user: dict) -> dict:
    """Login the test user and return Authorization headers."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "testuser@example.com",
            "password": "SecurePass1",
        },
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
