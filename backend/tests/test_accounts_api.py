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
    return TestClient(app, raise_server_exceptions=False)


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


def test_deposit_increments_balance_and_records_activity(client):
    account = client.post("/api/accounts", json={"holder_name": "Depositor"}).json()

    response = client.post(
        f"/api/accounts/{account['id']}/deposits", json={"amount": "25.50"}
    )

    assert response.status_code == 201
    body = response.json()
    assert body["account"]["balance_cents"] == 2550
    assert body["amount_cents"] == 2550
    assert body["transaction_id"]

    activity = client.get(f"/api/accounts/{account['id']}/transactions")
    assert activity.status_code == 200
    assert activity.json()[0]["kind"] == "DEPOSIT"
    assert activity.json()[0]["amount_cents"] == 2550
    assert activity.json()[0]["outcome"] == "APPROVED"


@pytest.mark.parametrize("amount", ["0", "-1.00", "10000.01", "1.001", "not-money"])
def test_deposit_rejects_invalid_amounts(client, amount):
    account = client.post("/api/accounts", json={"holder_name": "Depositor"}).json()

    response = client.post(
        f"/api/accounts/{account['id']}/deposits", json={"amount": amount}
    )

    assert response.status_code == 422


def test_deposit_returns_404_for_unknown_account(client):
    response = client.post(
        "/api/accounts/00000000-0000-0000-0000-000000000099/deposits",
        json={"amount": "1.00"},
    )
    assert response.status_code == 404


def test_deposit_rolls_back_balance_when_activity_insert_fails(client):
    account = client.post("/api/accounts", json={"holder_name": "Rollback"}).json()
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE OR REPLACE FUNCTION reject_deposit_activity() RETURNS trigger AS $$
                BEGIN RAISE EXCEPTION 'forced activity failure'; END;
                $$ LANGUAGE plpgsql;
                CREATE TRIGGER reject_deposit_activity_trigger
                BEFORE INSERT ON transactions
                FOR EACH ROW EXECUTE FUNCTION reject_deposit_activity();
                """
            )
        )
    try:
        response = client.post(
            f"/api/accounts/{account['id']}/deposits", json={"amount": "10.00"}
        )
        assert response.status_code == 500
        assert client.get(f"/api/accounts/{account['id']}").json()["balance_cents"] == 0
    finally:
        with engine.begin() as connection:
            connection.execute(text("DROP TRIGGER IF EXISTS reject_deposit_activity_trigger ON transactions"))
            connection.execute(text("DROP FUNCTION IF EXISTS reject_deposit_activity()"))


def test_issue_card_returns_safe_fields_and_updates_account_lookup(client):
    account = client.post("/api/accounts", json={"holder_name": "Cardholder"}).json()

    response = client.post(f"/api/accounts/{account['id']}/card")

    assert response.status_code == 201
    body = response.json()
    assert body["id"]
    assert body["account_id"] == account["id"]
    assert len(body["card_last4"]) == 4
    assert body["card_last4"].isdigit()
    assert body["issued_at"]
    assert "token" not in body

    refreshed = client.get(f"/api/accounts/{account['id']}")
    assert refreshed.status_code == 200
    assert refreshed.json()["card_last4"] == body["card_last4"]


def test_issue_card_is_idempotent_for_repeated_requests(client):
    account = client.post("/api/accounts", json={"holder_name": "Repeat Card"}).json()

    first = client.post(f"/api/accounts/{account['id']}/card")
    second = client.post(f"/api/accounts/{account['id']}/card")

    assert first.status_code == 201
    assert second.status_code == 200
    assert second.json() == first.json()


def test_issue_card_returns_404_for_unknown_account(client):
    response = client.post(
        "/api/accounts/00000000-0000-0000-0000-000000000099/card"
    )

    assert response.status_code == 404


def test_issue_card_documents_new_and_existing_success_responses(client):
    operation = app.openapi()["paths"]["/api/accounts/{account_id}/card"]["post"]

    assert "201" in operation["responses"]
    assert "200" in operation["responses"]
