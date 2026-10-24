# AI usage

I used AI as a development partner that I brainstormed with and delegated to. I made

the product decisions, reviewed the changes, ran the system myself, and corrected output that didn't match my requirements.

## Tools used

- **Codex/ChatGPT:** my primary tool. I mainly used GPT-5.6 Terra for planning
and GPT-5.6 Sol for implementation work.
- **Cursor Agent Chat (Auto):** used for targeted code and UI iterations. Once
the frontend existed, Cursor's Select Element feature let me point at a
rendered element and request a specific adjustment with its code context.
- **AI Hero/Matt Pocock workflow skills:** focused workflows for grilling
unsettled decisions, test-driven development, code review, frontend design,
and diagram creation.
- **Context compaction:** I used `/compact` between longer phases to retain the
essential decisions and current state without exhausting the chat's context
window.

## Where AI helped

AI helped me:

- turn the assignment into a granular, dependency-aware commit plan;
- question and document database, API, money, decline-order, and concurrency
decisions before implementation;
- scaffold and implement backend endpoints, frontend flows, Docker setup,
tests, and project quality checks;
- diagnose command failures and UI behavior from concrete output;
- review changes against the assignment and architecture decisions;
- split work into focused commits without including private planning docs; and
- prepare architecture diagrams and the demo narrative.

I used commits rather than pull requests as the planning unit because this was
a solo take-home. That applies feature/PR planning discipline I learned in
internships while keeping the process proportional to the project.

## Representative prompts and workflows

### Plan, challenge, implement, and verify

My normal feature loop was:

1. Update and read `docs/planning/commit-plan.md`.
2. Use `/compact` when needed to preserve the active decisions.
3. Ask: “Let's proceed with commit 7 work. If it is clear, give me the

   requirements for complete; otherwise grill me.”
4. Use the grilling workflow to resolve ambiguous behavior.
5. Approve or change the completion requirements.
6. Ask: “Proceed with implementation using TDD.”
7. Run the supplied tests and smoke-test commands in my own terminal.
8. Run the code-review workflow, address findings, inspect the proposed commit

   split, and approve the commit.
9. Push manually, then mark the commit complete in the plan.

For independent changes in different parts of the codebase, I allowed
subagents to work in parallel. I avoided parallel work when changes shared
files or would require patch staging.

### Break a slice into reviewable work

> Read the next commit in `docs/planning/commit-plan.md`. Break it down into a
> checklist of actionable steps needed to complete it. Keep each bullet short,
> and identify the observable completion requirements.

This made each slice easy to scan before code was written and gave me explicit
criteria for accepting or changing the result.

### Diagnose before changing code

> Investigate why the Home page's recent-activity table is empty while the
> Transactions page displays transactions correctly. Explain the cause before
> implementing the fix.

For visual polish, I also selected rendered elements in Cursor and made focused
requests such as matching a button to the color and treatment of the Create
Account action on `HomePage.tsx`. Earlier, I asked AI to remove unused Vite
starter UI, assets, imports, and CSS while retaining the minimum working
React/Vite structure.

## Corrections I made

### Incomplete database model

GPT initially modeled only the card fields needed by an account lookup and  
omitted `cards.id` and `cards.issued_at` from `backend/app/models.py`. I noticed
that the model did not match `backend/schema.sql` and asked AI directly where
`issued_at` was and whether the transaction model was also missing. I required
the SQLAlchemy model and API response to stay aligned with the database. The
columns were added, tests were rerun, and I added a repository instruction to
surface future backend/database mismatches.

### Wrong test-database workflow

GPT proposed creating a temporary `hsa_seed_format_test` database to validate a
seed-formatting change. I pointed out that the project already had the dedicated
`hsa_test` database and instructed it to use that instead. The corrected
workflow protects development data without creating an unnecessary third
database. The convention is documented in the README and `AGENTS.md`.

### Overly restrictive concurrency UI

The first concurrency form only enabled execution when the two amounts summed
to more than the selected account's balance. That could force an
insufficient-funds race, but it unnecessarily blocked other valid concurrent
requests. During manual UI testing, I asked AI to remove the combined-total
restriction. I kept useful validation—each amount must be positive, correctly
formatted, and individually affordable—and updated the user-facing test before
changing the implementation.

I also caught that the concurrency dropdowns exposed only qualified categories
and expanded them to all seven choices, allowing reviewers to demonstrate
declined transactions too.

These corrections represent how I worked with AI: compare its output to the
actual source of truth, explain the mismatch, require a focused correction, and
verify the behavior instead of accepting plausible-looking code.

## How I verified the final implementation

- **Source-of-truth review:** compared SQLAlchemy tables and API fields with
`backend/schema.sql`, then checked behavior against the assignment and
architecture document.
- **Backend tests:** ran the FastAPI/PostgreSQL suite against the separate
`hsa_test` database, covering accounts, deposits, cards, purchase outcomes,
rollback behavior, and concurrent purchases.
- **Frontend tests:** used Vitest and Testing Library for routes, modal flows,
payloads, concurrency behavior, error states, and navigation.
- **Static checks:** ran Ruff, Prettier, ESLint, TypeScript, and the Vite
production build. `make check` runs the full-project static checks.
- **Database inspection:** rebuilt the Compose database, queried tables with
`psql`, and checked balances and transaction rows directly.
- **Manual smoke tests:** ran the Docker Compose stack and exercised account
creation, deposits, card issuance, approved and declined purchases, browser
routing, global activity, and concurrency in the browser.
- **Human-controlled delivery:** reviewed diffs and commit contents, committed  
only approved slices, and pushed commits myself.
