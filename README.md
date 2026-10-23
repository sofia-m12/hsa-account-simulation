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
