-- Optional development data. Apply backend/schema.sql first.
-- Safe to run repeatedly because the identifiers are fixed.
INSERT INTO accounts (id, account_number, holder_name, currency, balance_cents)
VALUES ('00000000-0000-0000-0000-000000000001', 1000000000, 'Sample Account Holder', 'USD', 5000)
ON CONFLICT (id) DO NOTHING;
SELECT setval('account_number_seq', GREATEST((SELECT COALESCE(MAX(account_number), 999999999) FROM accounts), 1000000000));
INSERT INTO cards (id, account_id, token)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '4242424242424242')
ON CONFLICT (id) DO NOTHING;
INSERT INTO transactions (id, account_id, kind, amount_cents, outcome)
VALUES ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'DEPOSIT', 10000, 'APPROVED')
ON CONFLICT (id) DO NOTHING;
INSERT INTO transactions (id, account_id, card_id, kind, amount_cents, merchant, category, outcome)
VALUES (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'PURCHASE',
    5000,
    'Example Pharmacy',
    'PHARMACY',
    'APPROVED'
)
ON CONFLICT (id) DO NOTHING;
