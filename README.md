# HSA Account Simulation

A local web app that simulates HSA accounts, deposits, virtual debit cards, and transactions.

## Documentation

- [Architecture](docs/planning/architecture.md)
- [AI usage](docs/planning/ai-usage.md)
- Demo: 

```text
hsa-account-simulation/
├── backend/
├── frontend/
├── docs/
│   └── planning/
│       ├── architecture.md
│       └── ai-usage.md
├── compose.yaml
├── README.md
└── .gitignore
```

## Stack

- Frontend: React, TypeScript, and Vite
- Backend: Python, FastAPI, SQLAlchemy, psycopg, and PostgreSQL

## Prerequisites

- Docker with Docker Compose, or OrbStack on macOS (recommended)

## Run the full stack with Docker

Start PostgreSQL, the API, and the frontend together:

```sh
docker compose up -d --build
docker compose ps
curl http://localhost:8000/health
curl http://localhost:8000/health/db
```

Open <http://localhost:5173>. The API is available at <http://localhost:8000>.

## Database initialization and seed data

On first startup, PostgreSQL automatically applies `backend/schema.sql`, then the
Compose seed service runs `backend/seed.sql` by default. The seed is repeatable
and creates sample account, card, deposit, and purchase data.

To start without seed data:

```sh
SEED_DATA=false docker compose up -d --build
```

The schema initialization runs only when the PostgreSQL volume is new. To reset
the local database and initialize it again:

```sh
docker compose down -v
docker compose up -d --build
```

`docker compose down -v` permanently removes the local PostgreSQL volume and
all development data stored in it.

## Automated tests

The backend test fixture clears whichever database `DATABASE_URL` targets. The
command below points it at the separate `hsa_test` database so development data
is not cleared:

```sh
docker compose up -d db
docker compose run --rm --build -v "$PWD/backend/tests:/app/tests:ro" \
  -e DATABASE_URL=postgresql+psycopg://hsa:hsa@db:5432/hsa_test \
  -e PYTHONPATH=/app backend pytest tests -q
```

Run the frontend tests in a temporary Node container:

```sh
docker run --rm -v "$PWD/frontend:/app" -v /app/node_modules -w /app node:22-alpine \
  sh -c "npm ci && npm test"
```

## Formatting and linting

The following quality commands require Python 3, Node.js and npm, and Make on
the host machine. They are not required to run the production Docker stack.

Create and activate a Python virtual environment, then install the backend and
frontend development dependencies:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
npm ci --prefix frontend
```

### Frontend

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

### Backend

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

With the virtual environment active, run all backend and frontend static checks
plus the frontend production build from the repository root:

```sh
make check
```

To format both applications from the repository root:

```sh
make format
```

Automated tests remain separate from these commands; use the Docker-based test
commands above.
