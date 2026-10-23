# HSA Account Simulation

A local web app that simulates HSA accounts, deposits, virtual debit cards, and transactions.

## Stack

- Frontend: React, TypeScript, and Vite
- Backend: Python, FastAPI, SQLAlchemy, psycopg, and PostgreSQL

## Prerequisites

- Python 3
- Node.js and npm
- Docker and Docker Compose (recommended)

## Run the full stack with Docker

Start PostgreSQL, the API, and the frontend together:

```sh
docker compose up --build
```

Open <http://localhost:5173>. The API is available at <http://localhost:8000>.

## Run locally

### Backend

From the repository root, create and activate a virtual environment, then install the backend dependencies:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
```

Start PostgreSQL separately with `docker compose up db`, or use a native PostgreSQL
database and set `DATABASE_URL` in `.env` (see `.env.example`).

### Database initialization and seed data

On first startup, PostgreSQL automatically applies `backend/schema.sql`, then the
Compose seed service runs `backend/seed.sql` by default. The seed is repeatable
and creates sample account, card, deposit, and purchase data.

To start without seed data:

```sh
SEED_DATA=false docker compose up --build
```

The schema initialization runs only when the PostgreSQL volume is new. To reset
the local database and initialize it again:

```sh
docker compose down -v
docker compose up --build
```

The backend test fixture clears whichever database `DATABASE_URL` targets; the command below points it at `hsa_test`.

Tests use the separate `hsa_test` database so development data is not cleared:

```sh
docker compose down -v
docker compose up -d db
docker compose run --rm --build -v "$PWD/backend/tests:/app/tests:ro" \
  -e DATABASE_URL=postgresql+psycopg://hsa:hsa@db:5432/hsa_test \
  -e PYTHONPATH=/app backend pytest tests -q
```

Start the API:
```sh
cd backend
uvicorn app.main:app --reload
```

### Frontend

In another terminal, from the repository root:

```sh
cd frontend
npm ci
npm run dev
```
