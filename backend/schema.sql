-- Initial HSA simulation schema. Apply once to an empty PostgreSQL database.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SEQUENCE account_number_seq
    AS BIGINT
    START WITH 1000000000
    INCREMENT BY 1;

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number BIGINT NOT NULL UNIQUE DEFAULT nextval('account_number_seq'),
    holder_name TEXT NOT NULL
        CHECK (char_length(trim(holder_name)) BETWEEN 1 AND 120),
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    balance_cents INTEGER NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT accounts_currency_usd CHECK (currency = 'USD')
);

CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL UNIQUE REFERENCES accounts (id),
    token VARCHAR(16) NOT NULL UNIQUE,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT cards_token_is_16_digits CHECK (token ~ '^[0-9]{16}$')
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts (id),
    card_id UUID REFERENCES cards (id),
    kind TEXT NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    merchant TEXT,
    category TEXT,
    outcome TEXT NOT NULL,
    decline_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT transactions_kind_valid
        CHECK (kind IN ('DEPOSIT', 'PURCHASE')),
    CONSTRAINT transactions_outcome_valid
        CHECK (outcome IN ('APPROVED', 'DECLINED')),
    CONSTRAINT transactions_decline_reason_valid
        CHECK (
            decline_reason IS NULL
            OR decline_reason IN (
                'UNQUALIFIED_EXPENSE',
                'INSUFFICIENT_FUNDS',
                'INVALID_CARD'
            )
        ),
    CONSTRAINT transactions_outcome_reason_consistent
        CHECK (
            (outcome = 'APPROVED' AND decline_reason IS NULL)
            OR (outcome = 'DECLINED' AND decline_reason IS NOT NULL)
        ),
    CONSTRAINT transactions_deposit_shape
        CHECK (
            kind <> 'DEPOSIT'
            OR (card_id IS NULL AND outcome = 'APPROVED' AND category IS NULL)
        ),
    CONSTRAINT transactions_purchase_shape
        CHECK (
            kind <> 'PURCHASE'
            OR (card_id IS NOT NULL AND category IS NOT NULL)
        )
);

CREATE INDEX transactions_account_created_at_idx
    ON transactions (account_id, created_at DESC);

CREATE INDEX transactions_card_id_idx
    ON transactions (card_id);
