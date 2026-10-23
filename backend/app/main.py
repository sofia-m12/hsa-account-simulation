from fastapi import FastAPI
from sqlalchemy import text

from .database import engine

app = FastAPI(title="HSA Account Simulation")


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/db")
def database_health_check() -> dict[str, str]:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ok"}
