import os
from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://hsa:hsa@localhost:5432/hsa_test")

from app.database import engine
from app.main import app


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

    response = client.post(f"/api/accounts/{account['id']}/deposits", json={"amount": "25.50"})

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

    response = client.post(f"/api/accounts/{account['id']}/deposits", json={"amount": amount})

    assert response.status_code == 422


def test_deposit_returns_404_for_unknown_account(client):
    response = client.post(
        "/api/accounts/00000000-0000-0000-0000-000000000099/deposits",
        json={"amount": "1.00"},
    )
    assert response.status_code == 404


def test_activity_history_exposes_deposit_and_purchase_decisions_in_newest_order(client):
    account = client.post("/api/accounts", json={"holder_name": "Activity Viewer"}).json()
    token = _issue_card_token(client, account["id"])
    deposit = client.post(f"/api/accounts/{account['id']}/deposits", json={"amount": "100.00"})
    approved = client.post(
        f"/api/accounts/{account['id']}/purchases",
        json={
            "card_token": token,
            "amount": "25.00",
            "merchant": "Dental Office",
            "category": "dental",
        },
    )
    declined = client.post(
        f"/api/accounts/{account['id']}/purchases",
        json={
            "card_token": token,
            "amount": "10.00",
            "merchant": "Travel Store",
            "category": "travel",
        },
    )

    response = client.get(f"/api/accounts/{account['id']}/transactions")

    assert response.status_code == 200
    history = response.json()
    assert [entry["id"] for entry in history] == [
        declined.json()["transaction"]["id"],
        approved.json()["transaction"]["id"],
        deposit.json()["transaction_id"],
    ]
    assert history[0]["kind"] == "PURCHASE"
    assert history[0]["merchant"] == "Travel Store"
    assert history[0]["category"] == "travel"
    assert history[0]["outcome"] == "DECLINED"
    assert history[0]["decline_reason"] == "UNQUALIFIED_EXPENSE"
    assert history[1]["kind"] == "PURCHASE"
    assert history[1]["amount_cents"] == 2500
    assert history[1]["outcome"] == "APPROVED"
    assert history[1]["decline_reason"] is None
    assert history[2]["kind"] == "DEPOSIT"
    assert history[2]["amount_cents"] == 10000
    assert history[2]["merchant"] is None
    assert history[2]["category"] is None


def test_activity_history_returns_404_for_unknown_account(client):
    response = client.get("/api/accounts/00000000-0000-0000-0000-000000000099/transactions")

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
        response = client.post(f"/api/accounts/{account['id']}/deposits", json={"amount": "10.00"})
        assert response.status_code == 500
        assert client.get(f"/api/accounts/{account['id']}").json()["balance_cents"] == 0
    finally:
        with engine.begin() as connection:
            connection.execute(
                text("DROP TRIGGER IF EXISTS reject_deposit_activity_trigger ON transactions")
            )
            connection.execute(text("DROP FUNCTION IF EXISTS reject_deposit_activity()"))


def test_issue_card_returns_safe_fields_and_updates_account_lookup(client):
    account = client.post("/api/accounts", json={"holder_name": "Cardholder"}).json()

    response = client.post(f"/api/accounts/{account['id']}/card")

    assert response.status_code == 201
    body = response.json()
    assert body["id"]
    assert body["account_id"] == account["id"]
    assert len(body["token"]) == 16
    assert body["token"].isdigit()
    assert len(body["card_last4"]) == 4
    assert body["card_last4"].isdigit()
    assert body["issued_at"]

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
    response = client.post("/api/accounts/00000000-0000-0000-0000-000000000099/card")

    assert response.status_code == 404


def test_issue_card_documents_new_and_existing_success_responses(client):
    operation = app.openapi()["paths"]["/api/accounts/{account_id}/card"]["post"]

    assert "201" in operation["responses"]
    assert "200" in operation["responses"]


def _issue_card_token(client, account_id):
    client.post(f"/api/accounts/{account_id}/card")
    with engine.connect() as connection:
        return connection.execute(
            text("SELECT token FROM cards WHERE account_id = :account_id"),
            {"account_id": account_id},
        ).scalar_one()


def test_qualified_purchase_approves_and_debits_balance(client):
    account = client.post("/api/accounts", json={"holder_name": "Buyer"}).json()
    token = _issue_card_token(client, account["id"])
    client.post(f"/api/accounts/{account['id']}/deposits", json={"amount": "100.00"})

    response = client.post(
        f"/api/accounts/{account['id']}/purchases",
        json={"card_token": token, "amount": "80.00", "merchant": "Clinic", "category": "medical"},
    )

    assert response.status_code == 201
    assert response.json()["transaction"]["outcome"] == "APPROVED"
    assert response.json()["account"]["balance_cents"] == 2000


@pytest.mark.parametrize(
    ("category", "reason"),
    [("travel", "UNQUALIFIED_EXPENSE"), ("medical", "INSUFFICIENT_FUNDS")],
)
def test_purchase_declines_without_debit(client, category, reason):
    account = client.post("/api/accounts", json={"holder_name": "Buyer"}).json()
    token = _issue_card_token(client, account["id"])
    client.post(f"/api/accounts/{account['id']}/deposits", json={"amount": "50.00"})

    response = client.post(
        f"/api/accounts/{account['id']}/purchases",
        json={"card_token": token, "amount": "80.00", "merchant": "Store", "category": category},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["transaction"]["outcome"] == "DECLINED"
    assert body["transaction"]["decline_reason"] == reason
    assert body["account"]["balance_cents"] == 5000


def test_purchase_rejects_invalid_card(client):
    account = client.post("/api/accounts", json={"holder_name": "Buyer"}).json()
    _issue_card_token(client, account["id"])
    response = client.post(
        f"/api/accounts/{account['id']}/purchases",
        json={
            "card_token": "0" * 16,
            "amount": "1.00",
            "merchant": "Clinic",
            "category": "medical",
        },
    )
    assert response.status_code == 201
    assert response.json()["transaction"]["decline_reason"] == "INVALID_CARD"


def test_concurrent_purchases_approve_exactly_one(client):
    account = client.post("/api/accounts", json={"holder_name": "Concurrent Buyer"}).json()
    token = _issue_card_token(client, account["id"])
    client.post(f"/api/accounts/{account['id']}/deposits", json={"amount": "100.00"})

    def purchase(amount):
        with TestClient(app, raise_server_exceptions=False) as concurrent_client:
            return concurrent_client.post(
                f"/api/accounts/{account['id']}/purchases",
                json={
                    "card_token": token,
                    "amount": amount,
                    "merchant": "Clinic",
                    "category": "medical",
                },
            )

    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(purchase, ["80.00", "50.00"]))

    assert [response.status_code for response in responses] == [201, 201]
    assert (
        sum(response.json()["transaction"]["outcome"] == "APPROVED" for response in responses) == 1
    )
    assert client.get(f"/api/accounts/{account['id']}").json()["balance_cents"] in {2000, 5000}


def test_purchase_rolls_back_debit_when_activity_insert_fails(client):
    account = client.post("/api/accounts", json={"holder_name": "Rollback Buyer"}).json()
    token = _issue_card_token(client, account["id"])
    client.post(f"/api/accounts/{account['id']}/deposits", json={"amount": "25.00"})
    with engine.begin() as connection:
        connection.execute(
            text("""
            CREATE OR REPLACE FUNCTION reject_purchase_activity() RETURNS trigger AS $$
            BEGIN
                IF NEW.kind = 'PURCHASE' THEN RAISE EXCEPTION 'forced purchase failure'; END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            CREATE TRIGGER reject_purchase_activity_trigger
            BEFORE INSERT ON transactions
            FOR EACH ROW EXECUTE FUNCTION reject_purchase_activity();
        """)
        )
    try:
        response = client.post(
            f"/api/accounts/{account['id']}/purchases",
            json={
                "card_token": token,
                "amount": "10.00",
                "merchant": "Clinic",
                "category": "medical",
            },
        )
        assert response.status_code == 500
        assert client.get(f"/api/accounts/{account['id']}").json()["balance_cents"] == 2500
    finally:
        with engine.begin() as connection:
            connection.execute(
                text("DROP TRIGGER IF EXISTS reject_purchase_activity_trigger ON transactions")
            )
            connection.execute(text("DROP FUNCTION IF EXISTS reject_purchase_activity()"))
