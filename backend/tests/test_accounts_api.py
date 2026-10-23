import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

os.environ.setdefault(
    "DATABASE_URL", "postgresql+psycopg://hsa:hsa@localhost:5432/hsa"
)

from app.database import engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(autouse=True)
def clean_accounts():
    with engine.begin() as connection:
        connection.execute(text("TRUNCATE transactions, cards, accounts RESTART IDENTITY CASCADE"))
    yield


@pytest.fixture
def client():
    return TestClient(app)


def test_create_account_returns_zero_balance_usd_and_normalized_name(client):
    response = client.post("/api/accounts", json={"holder_name": "  Jane Smith  "})

    assert response.status_code == 201
    body = response.json()
    assert body["holder_name"] == "Jane Smith"
    assert body["currency"] == "USD"
    assert body["balance_cents"] == 0
    assert body["account_number"] >= 1_000_000_000
    assert body["card_last4"] is None


@pytest.mark.parametrize("payload", [{}, {"holder_name": "   "}, {"holder_name": "x" * 121}])
def test_create_account_rejects_invalid_holder_name(client, payload):
    response = client.post("/api/accounts", json=payload)
    assert response.status_code == 422


def test_list_accounts_is_newest_first_and_empty_is_successful(client):
    assert client.get("/api/accounts").json() == []
    client.post("/api/accounts", json={"holder_name": "First"})
    client.post("/api/accounts", json={"holder_name": "Second"})

    response = client.get("/api/accounts")
    assert response.status_code == 200
    assert [account["holder_name"] for account in response.json()] == ["Second", "First"]


def test_get_account_returns_404_for_unknown_uuid(client):
    response = client.get("/api/accounts/00000000-0000-0000-0000-000000000099")
    assert response.status_code == 404


def test_account_persists_after_a_new_request(client):
    created = client.post("/api/accounts", json={"holder_name": "Persistent"}).json()
    response = client.get(f"/api/accounts/{created['id']}")
    assert response.status_code == 200
    assert response.json()["account_number"] == created["account_number"]
