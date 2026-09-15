# Setup Guide

> **This file is read by the automated evaluation pipeline. Be precise and complete.**

## Prerequisites

Before you begin, ensure you have the following installed:

- [x] Python 3.10+
- [x] Node.js 18+
- [x] PostgreSQL 14+ (or Docker Desktop to run a containerized database)

## Environment Variables

Copy `src/.env.example` to `src/.env` and fill in the values:

```bash
cd src
cp .env.example .env
```

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (e.g., `postgresql+psycopg://user:password@localhost:5432/ibm_bob`) | Yes |
| `JWT_SECRET_KEY` | Secret key for JWT authentication | Yes |
| `CORS_ORIGINS` | Array of allowed origins (e.g., `["http://localhost:5173"]`) | Yes |
| `WATSONX_API_KEY` | Your IBM watsonx.ai API key (for future ML models) | No |
| `WATSONX_PROJECT_ID` | Your watsonx.ai project ID (for future ML models) | No |

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/Dhruvsheth07/bob-ai-hackathon-hackharvest.git
cd bob-ai-hackathon-hackharvest

# 2. Set up Python virtual environment and install backend dependencies
cd src
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt

# 3. Install frontend dependencies
cd frontend
npm install
cd ..

# 4. Set up the database (run Alembic migrations and seed admin user)
alembic upgrade head
python seed_admin.py
```

## Running the Application

```bash
# Start the backend (from the src directory)
uvicorn app.main:app --reload --port 8000

# Start the frontend (in a separate terminal, from the src/frontend directory)
npm run dev
```

The frontend will be available at: `http://localhost:5173`
The backend API documentation will be available at: `http://localhost:8000/docs`

## Running Tests

```bash
# Run pytest for backend tests (from the src directory)
pytest -v
```

## Quick Demo (Optional)

If you have a demo script or sample data to showcase the project quickly:

```bash
# Run the seed script to create an admin user and populate dummy data
python seed_admin.py
```

## Troubleshooting

| Issue | Solution |
|---|---|
| `ModuleNotFoundError` | Ensure you have activated the virtual environment and run `pip install -r requirements.txt`. |
| Database connection refused | Ensure PostgreSQL is running and the `DATABASE_URL` in your `.env` is correct. |
| Missing tables / relation does not exist | Run database migrations with `alembic upgrade head`. |
| API Request Failed / CORS Errors | Verify `CORS_ORIGINS` in `.env` includes your exact frontend URL (e.g., `http://localhost:5173`) and restart the backend. |
