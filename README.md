# HSA Account Simulation

A local web app that simulates HSA accounts, deposits, virtual debit cards, and transactions.

## Stack

- Frontend: React, TypeScript, and Vite
- Backend: Python, FastAPI, SQLAlchemy, psycopg, and PostgreSQL

## Prerequisites

- Python 3
- Node.js and npm
- Make
- Docker with Docker Compose, or OrbStack on macOS (recommended)

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

### Frontend formatting and linting

The frontend uses Prettier for consistent formatting and ESLint for static code
checks. Both tools and their configuration are installed with the frontend
development dependencies through `npm ci`.

From `frontend/`, rewrite supported files with Prettier:

```sh
npm run format
```

Check formatting without changing files, then run ESLint:

```sh
npm run format:check
npm run lint
```

Before committing frontend changes, run both checks and verify the production
build:

```sh
npm run format:check
npm run lint
npm run build
```

### Backend formatting and linting

Ruff formats and checks the backend application and tests. It is installed with
the backend dependencies from the repository root:

```sh
python -m pip install -r backend/requirements.txt
```

Rewrite backend Python files, or check formatting without changing them:

```sh
ruff format backend
ruff format --check backend
```

Run the backend lint checks, or apply safe automatic fixes:

```sh
ruff check backend
ruff check backend --fix
```

## Full-project quality checks

After installing the backend requirements in an active virtual environment and
the frontend dependencies with `npm ci --prefix frontend`, run all backend and
frontend static checks plus the frontend production build from the repository
root:

```sh
make check
```

To format both applications from the repository root:

```sh
make format
```

Automated tests remain separate from these commands. Run the backend tests
against `hsa_test` using the command above and run frontend tests with
`npm test --prefix frontend`.
