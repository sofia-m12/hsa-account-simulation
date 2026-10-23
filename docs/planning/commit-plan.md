# HSA take-home: commit plan

Keep each commit runnable or clearly marked as the next scaffold step; do not combine unrelated work merely to hit a commit count.
 The quoted phrases below are from docs/planning/master-take-home.md. The user-confirmed implementation choices are React + TypeScript + Vite, FastAPI + Pydantic, PostgreSQL, SQLAlchemy + psycopg, `backend/schema.sql` (no Alembic), PostgreSQL-only Docker Compose, and native run instructions as a fallback.

## Commit sequence

| # | Suggested commit | Work and completion check |
|---|---|---|
| 1 (Complete) | `chore: scaffold full-stack project` | Create `backend/`, `frontend/`, `docs/`, and a root README outline. Add `.gitignore` for Python virtual environments, caches, Node dependencies/build output, local env files, and editor/OS noise. Add a minimal `backend/pyproject.toml` (or `requirements.txt`) and frontend `package.json` with pinned-compatible scripts. Add a minimal FastAPI app and Vite React/TypeScript app. Completion: backend health endpoint responds; frontend dev server displays a starter page; both commands are documented. |
| 2 (Complete) | `chore: add local database setup` | Add PostgreSQL-only `compose.yaml` with pinned major version, named volume, credentials from documented local defaults or env, and health check. Add `.env.example` and backend settings for `DATABASE_URL`. Document both Docker PostgreSQL and native PostgreSQL setup, while keeping app processes host-run. Completion: either setup path yields a reachable empty PostgreSQL database and settings load without committing secrets. |
| 3 (Complete) | `feat: define initial HSA database schema` | Add `backend/schema.sql` for accounts, cards, transactions, keys, indexes, checks, and uniqueness constraints. Use UUID identifiers, USD, integer cents, nonnegative balances, positive transaction amounts, one card per account, and appropriate transaction fields. Add a short schema/setup note: create an empty database, then apply the SQL file once. Completion: the script applies cleanly to a fresh database and the resulting tables/constraints match the documented model. |
| 3b (Complete) | `chore: run schema and seed on compose startup` | Apply `schema.sql` and `seed.sql` when Compose Postgres starts so local databases have tables and sample data without a manual step. |
| 4 (Complete) | `feat: add database connection and health checks` | Configure SQLAlchemy with psycopg and a request-scoped session dependency. Add a database readiness check that can distinguish app health from database availability. Avoid schema auto-creation: `schema.sql` is the committed initial schema. Completion: API can connect, query readiness, and close sessions cleanly. |
| 4b (Complete) | `docs: add frontend design system tokens` | Document color, typography, spacing, component, and interaction tokens in `AGENTS.md` for the HSA dashboard (Human Interest–inspired reference, not brand reproduction). |
| 4c (Complete) | `feat: add HSA dashboard shell with home, account, and transactions views` | Replace the Vite starter with routed UI shell: home (accounts list + recent activity, create account / simulate transaction actions), individual account (details, balance, deposit modal), and empty transactions page. Apply design-system tokens; use local mock data until APIs exist. Completion: reviewer can navigate the three views in the browser. |
| 5 (Complete) | `feat: add account creation and lookup API` | Add Pydantic request/response models and routes to create and list/read accounts. New accounts start at zero cents and USD; PostgreSQL allocates a unique decimal `account_number` from its sequence. Responses preserve database column names and include computed nullable `card_last4`. Completion: API tests prove creation, validation, deterministic lookup/list ordering, unique account-number allocation, and persistence after reconnecting. |
| 6 (Complete) | `feat: add atomic deposits` | Add deposit endpoint and service operation that validates bounded positive money, increments balance, and inserts an activity record in one DB transaction. Convert decimal input to integer cents without floating-point balance arithmetic. Completion: valid deposits persist; invalid amounts fail; activity-write failure rolls the balance update back. |
| 7 (Complete) | `feat: issue one simulated card per account` | Add card issuance and lookup behavior. Use a fake numeric token and safe display fields only; never collect or store PAN/CVV. Enforce one card per account in the database and make repeated issuance return the existing card. Completion: card survives reload and duplicate issue attempts cannot create a second card. |
| 8 (Complete) | `feat: process qualified purchases safely` | Add purchase request/response models and service logic. Resolve account through active card, lock the account row inside the transaction, normalize the selected category, evaluate the server-side qualified set (`medical`, `dental`, `vision`, `pharmacy`) and funds, write APPROVED/DECLINED history, and debit only on approval. The UI category list is fixed to Medical, Dental, Vision, Pharmacy, Travel, Entertainment, and Other; unknown or non-qualified categories decline as `UNQUALIFIED_EXPENSE`. Commit balance and history together. Completion: qualified purchase with funds approves; ineligible and insufficient-funds requests decline without debit; DB concurrency test for $80 and $50 against $100 results in exactly one approval. |
| 9 (Complete) | `test: cover account activity history` | Verify the existing activity endpoint exposes deposits and both approved and declined purchases with stable newest-first ordering, merchant/category details, outcomes, decline reasons, and unknown-account handling. |
| 10 | `feat: build HSA dashboard flows` | Wire the existing dashboard shell to the API: create/select account, show balance, deposit funds, issue/display simulated card, submit purchase, and review activity. Replace mock data with relative `/api` requests (Vite proxy already configured). Add loading, empty, validation, and server-error states. Keep eligibility and balance decisions on the server. Completion: a reviewer can complete the four required flows in the browser without using the API manually. |
| 11 | `feat: add concurrency demo and clear outcomes` | Add a small UI affordance that sends two independent purchase requests for a fresh $100 account (or document the API/test demonstration if UI time is tight). Render each server result and the refreshed balance. Completion: the UI never predicts the winner; the persisted final state agrees with the database test. This is a demonstration aid, while the real concurrency test remains required evidence. |
| 12 | `test: cover HSA rules and database concurrency` | Complete unit and PostgreSQL integration tests for money parsing, categories, persistence, exact-balance spending, account isolation, concurrent deposits/cards if implemented, concurrent purchases using separate sessions/connections, and transaction rollback. Coordinate the concurrency test so requests overlap; assert the invariant, not which request wins. Completion: local test suite passes against a real PostgreSQL instance. |
| 13 | `docs: add setup and architecture guide` | Finish README with prerequisites, Docker and native PostgreSQL setup, environment configuration, schema application/reset, backend/frontend startup, and local test commands. Add `architecture.md` describing components, routes, schema, business rules, locking/atomicity, tradeoffs, and limitations. Add `ai-usage.md` with actual tools/prompts, a real correction, and verification evidence. Completion: follow setup from a clean clone; docs match observed behavior. |
| 14 | `chore: polish reviewer experience and submission` | Add small UI polish and accessibility fixes, optional Playwright happy-path smoke test if time allows, and final README links. Run backend tests, frontend typecheck/build, clean setup check, and manually walk through the required flows. Record the demo under five minutes and link it. Completion: reviewer can start the project and access the repository, documentation, and video. |

Commits through 9 are complete (account API, deposits, cards, qualified purchases, and activity history coverage). The next implementation target is commit 10 (`feat: build HSA dashboard flows`); dashboard API wiring remains next.

## Commit 6 implementation split

The completed deposit work can be committed as three focused slices:

1. `test: define atomic deposit behavior` — add the HTTP-level tests for valid deposits, amount validation, missing accounts, activity history, and rollback when activity creation fails.
2. `feat: add atomic deposit API` — add deposit and transaction schemas/models, implement the account deposit transaction, and expose account activity lookup.
3. `docs: record deposit money-handling decisions` — update the demo script and this plan with integer-cents storage, the `$10,000.00` bound, and atomicity behavior.

## Commit 7 implementation split

The completed card issuance work can be committed as three focused slices:

1. `test: define simulated card issuance behavior` — add API tests for safe
   card fields, account lookup display, repeated issuance, missing accounts,
   and documented success responses.
2. `feat: issue one simulated card per account` — add the card response schema,
   numeric token generation, idempotent issuance route, and database-aligned
   card defaults.
3. `docs: record simulated card issuance decisions` — update the architecture
   and demo notes with token handling, idempotency, and one-card-per-account
   behavior.

## Commit 8 implementation split

The purchase work can be committed as three focused slices:

1. `test: define qualified purchase behavior` — add API tests for approved
   purchases, each decline reason, exact-balance spending, invalid amounts,
   rollback, and concurrent `$80`/`$50` purchases against `$100`.
2. `feat: process qualified purchases safely` — add purchase schemas and the
   locked, atomic purchase endpoint. Define the complete category list and
   server-side qualified subset; normalize categories and record
   `UNQUALIFIED_EXPENSE` for non-qualified or unknown values.
3. `docs: record purchase qualification decisions` — document the fixed seven
   category choices, qualification map, integer-cents debit behavior, decline
   reasons, and row-locking/concurrency decision in the demo notes and plan.
