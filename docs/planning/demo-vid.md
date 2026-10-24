# Demo video script

## Opening and application demo — 1:40

**Show:** Start on the Home page.

**Say:**

> Hey y'all—hello, and good morning or afternoon to whoever is reviewing this.
> I hope you're doing well coming into this last week of October. I know I'm
> definitely excited for Halloween!
>
> Okay, I'll get into it. This is my app. I called it HSA Platform—super
> creative name, I know—and I'm going to walk you through what it does and how.
>
> There are three main pages: Home, an individual Account page, and the global
> Transactions page. Home is where you land when the app loads. It has the main
> navigation, a table of all existing HSA accounts, and Recent Activity showing
> the five newest transactions across those accounts. Account numbers are links,
> so I'll open one from here.

**Show:** Create a new account with a lowercase name such as `kelly h`, then
open it. Deposit $100 and issue its simulated card.

**Say:**

> I can create an account from this modal. The API normalizes the holder name,
> and every new account starts with a zero-dollar USD balance. On the Account
> page I can deposit funds and issue one simulated card. The UI displays only
> the last four digits; it never puts the full token in a visible field.

**Show:** Make an approved Medical purchase. Open Transactions, run a Travel
purchase, and point out the decline reason and unchanged balance.

**Say:**

> A Medical purchase is qualified and approves when the balance can cover it.
> The global Transactions page shows activity across every account, and it also
> lets a reviewer search by holder name or account number and simulate a
> purchase without navigating back to the Account page. Travel is not a
> qualified category, so this request is recorded as declined with an
> Unqualified Expense reason and does not change the balance.

## System architecture — 0:35

**Show:** The system diagram in `docs/planning/architecture.md`, followed by the
running Docker Compose services.

**Say:**

> Under the UI, the frontend is React, TypeScript, and Vite. nginx serves the
> production build and proxies relative API requests to FastAPI. FastAPI and
> Pydantic validate the API boundary, SQLAlchemy with psycopg handles data
> access, and PostgreSQL owns the persisted data, constraints, and concurrency
> behavior. Docker Compose starts PostgreSQL, the repeatable seed job, the
> backend, and the frontend together.

## Data model — 0:35

**Show:** The three-table diagram, then briefly show `backend/schema.sql`.

**Say:**

> The model has three tables: accounts, cards, and transactions. Accounts use
> UUIDs internally and unique decimal account numbers in the UI. Money is stored
> as integer cents to avoid floating-point errors, and currency is constrained
> to USD. A unique card account ID enforces one card per account. Deposits and
> purchases share transaction history, with database checks keeping approved
> and declined rows internally consistent.

## Transaction processing and concurrency — 0:55

**Show:** The purchase-decision diagram. Select a separate, prepared seed account
with exactly $100, switch to Concurrency test, and submit $80 and $50 qualified
purchases. Show the resulting rows and final balance.

**Say:**

> Purchase decisions stay on the server. It locks the account row and checks
> the card token, whether the expense is qualified, and then whether there are
> sufficient funds. Those checks have a fixed order, so each decline has one
> clear reason. Only an approval debits the account, and the debit and history
> row commit atomically.
>
> The concurrency mode sends two normal purchase requests at the same time—
> there is no special test-only endpoint. PostgreSQL's row lock makes the second
> request evaluate the balance after the first commits. I'm using a separate
> seeded account with exactly $100 here so the result is easy to see. With $80
> and $50 against $100, exactly one purchase approves and one declines for
> insufficient funds. Either request may win; the important part is that the
> balance cannot be overspent.

## What I would improve with more time — 0:25

**Show:** The tradeoffs and limitations section of `architecture.md`.

**Say:**

> With more time, I would add authentication and account ownership, versioned
> database migrations, a paginated global-transactions endpoint, stronger card
> token protection through a payment provider or encryption, and card lifecycle
> controls. I would also add broader end-to-end and accessibility coverage.
> Name normalization is intentionally deterministic today; production code
> would need explicit rules for names that simple title casing does not handle
> well.

## AI usage and validation — 0:25

**Show:** `docs/planning/ai-usage.md`, a focused test result, and `make check`.

**Say:**

> I used Codex/ChatGPT and Cursor Agent Chat for planning, implementation,  
> diagnosis, review, and targeted UI iteration. My normal loop was to plan a  
> small commit, challenge unclear requirements, implement it test-first, run the  
> commands myself and test in browser, review the diff, and only then commit it.
>
> I verified the final result with backend and frontend tests,
> formatting and lint checks, production builds, direct database inspection,
> and full browser smoke tests.

## Recording checklist

- Reset or seed the data before recording.
- Prepare and rehearse the separate seeded account used for the $100
concurrency example; do not use it for the earlier purchase walkthrough.
- Increase browser and editor text size enough for the recording.
- Keep terminals prepared so the video does not wait for builds.
- Show visible outcomes first and code only when it explains a decision.
- Confirm the final recording is under five minutes.
- Add the final video link to the README before submission.
