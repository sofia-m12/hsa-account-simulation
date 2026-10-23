from fastapi import FastAPI
from sqlalchemy import text

from .database import engine
from .routes.accounts import router as accounts_router

app = FastAPI(title="HSA Account Simulation")
app.include_router(accounts_router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/db")
def database_health_check() -> dict[str, str]:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ok"}
