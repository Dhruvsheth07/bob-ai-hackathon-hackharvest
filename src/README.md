# Port Operations Optimizer — Backend

AI-powered backend API to reduce vessel congestion and optimize berth scheduling at ports.

## Tech Stack

| Component | Technology |
|---|---|
| Language | Python 3.12+ |
| Framework | FastAPI |
| ORM | SQLAlchemy 2.x |
| Database | PostgreSQL (psycopg v3 driver) |
| Migrations | Alembic |
| Config | pydantic-settings |
| Testing | pytest + httpx |

## Prerequisites

- **Python 3.12+**
- **PostgreSQL** — database must already exist (this app does NOT create it)
- **pip** (or your preferred package manager)

## Setup

```bash
# 1. Navigate to the src directory
cd src/

# 2. Create a virtual environment
python -m venv .venv

# 3. Activate it
#    Windows (PowerShell):
.venv\Scripts\Activate.ps1
#    macOS/Linux:
source .venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Configure environment
cp .env.example .env
# Edit .env with your actual DATABASE_URL and other values
```

## Running the Application

```bash
# Development server with hot-reload
uvicorn app.main:app --reload --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once running, visit:

| Docs | URL |
|---|---|
| Swagger UI | [http://localhost:8000/docs](http://localhost:8000/docs) |
| ReDoc | [http://localhost:8000/redoc](http://localhost:8000/redoc) |
| OpenAPI JSON | [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json) |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Health check (app + DB status) |

## Database Migrations

```bash
# Generate a new migration after model changes
alembic revision --autogenerate -m "describe your change"

# Apply all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

## Running Tests

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ -v --tb=short
```

## Project Structure

```
src/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app factory
│   ├── config.py            # Environment settings
│   ├── database.py          # SQLAlchemy engine & session
│   ├── exceptions.py        # Centralized error handling
│   ├── logging_config.py    # Structured JSON logging
│   ├── api/
│   │   └── v1/
│   │       └── router.py    # v1 endpoints
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic request/response schemas
│   ├── services/            # Business logic
│   └── repositories/        # Data access layer
├── alembic/                 # Database migrations
├── tests/                   # pytest test suite
├── alembic.ini
├── requirements.txt
├── .env.example
└── README.md
```

## Architecture

- **Routes** (`api/`) — HTTP layer only; no business logic
- **Services** (`services/`) — business rules and orchestration
- **Repositories** (`repositories/`) — database queries
- **Models** (`models/`) — SQLAlchemy ORM definitions
- **Schemas** (`schemas/`) — Pydantic validation & serialization

Database sessions are injected via FastAPI dependency injection (`get_db`).

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | *(required)* | PostgreSQL connection string |
| `APP_ENV` | `development` | `development` / `production` / `testing` |
| `APP_PORT` | `8000` | Server port |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed CORS origins (JSON array) |
| `LOG_LEVEL` | `INFO` | Logging verbosity |
