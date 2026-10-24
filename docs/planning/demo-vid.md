# Demo video script

Target length: five minutes or less. Add concrete screenshots, commands, and
final wording as each feature is completed.

## 1. Demo of the application

**Show:** Open the app, create or select an HSA account, view the balance, make
a deposit, issue the simulated card, submit a purchase, and review activity.

**Say:** Explain the user flow in plain language and point out the loading,
empty, validation, approval, and decline states.

**Target time:** 1:45

## 2. System architecture

**Show:** The architecture diagram and the running Docker Compose services.

**Say:** Describe the React + TypeScript + Vite frontend, FastAPI backend,
SQLAlchemy/psycopg data access, and PostgreSQL database. Mention that Compose
starts the database, backend, and frontend together.

**Target time:** 0:45

Card issuance uses one simulated numeric token per account. The backend stores
the token only for internal card/purchase lookup and returns the last four
digits plus the issue timestamp; repeated issuance returns the same card.

## 3. Data model

**Show:** The three-table diagram and `backend/schema.sql`.

**Say:** Explain `accounts`, `cards`, and `transactions`, including the
one-card-per-account constraint, integer cents, USD-only currency, UUID keys,
unique decimal account numbers, and safe card-token handling.

**Target time:** 0:45

## 4. How transactions are processed

**Show:** A successful deposit or purchase, a declined purchase, and the
relevant service/test code.

**Say:** Explain that money is represented as integer cents, eligibility and
funds are decided on the server, and balance changes plus transaction history
are committed atomically. Mention row locking for concurrent purchases and
that declined purchases do not debit the account. Integer cents avoid
floating-point rounding errors, so `$25.50` is stored and calculated as `2550`.

**Target time:** 0:55

## 5. What you would improve with more time

**Show:** A short list of deferred work in the plan or architecture notes.

**Say:** Discuss prioritized improvements such as stronger card-token
protection, richer card lifecycle controls, authentication, broader automated
integration/concurrency coverage, and additional accessibility or UX polish.

**Target time:** 0:30

## 6. How you used AI and validated its output

**Show:** The relevant documentation, tests, and verification commands.

**Say:** Explain which development tasks used AI assistance, then show how the
output was checked through focused design review, schema inspection, frontend
build/type checks, backend tests, Docker Compose validation, and manual browser
flows.

Mention the initial model gap: I first represented only the card fields
needed by the account lookup query in `backend/app/models.py`, leaving out the
schema's `cards.id` and `cards.issued_at` columns. You identified that mismatch
and told me to align the model with the database; I corrected the model and
would validate the result against `backend/schema.sql` and the API tests. I then added a line in agents.md: "Keep backend API models and responses aligned with"
    I also checked edits to models.py and other files with my architecture.doc and schema draw ups that were my source of truth

**Target time:** 0:20

## Final checklist

- Keep the complete recording under five minutes.
- Use seeded data only when it makes the flow faster to demonstrate.
- Prefer visible outcomes over long code walkthroughs.
- Replace each placeholder with final UI screenshots, commands, and narration.
