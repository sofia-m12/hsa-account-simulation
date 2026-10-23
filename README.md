# HSA Account Simulation

A local web app that simulates HSA accounts, deposits, virtual debit cards, and transactions.

## Stack

- Frontend: React, TypeScript, and Vite
- Backend: Python and FastAPI

## Prerequisites

- Python 3
- Node.js and npm

## Run locally

### Backend

From the repository root, create and activate a virtual environment, then install the backend dependencies:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
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