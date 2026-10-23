## Agent skills

### Issue tracker

No issue tracker is used for this take-home. Work from the next focused item in `deliverables/commit-plan.md`; do not create issues, tickets, or pull requests.

Use `/implement` for a decided slice from that plan. Use `/grill-me` first when an important product or design decision is still unsettled; keep the decision in the conversation or update the existing project documentation rather than creating a separate spec.

### Domain docs

The take-home assignment defines requirements. `architecture.md` is the project brief for the agreed behavior, architecture, and tradeoffs. Use React + TypeScript + Vite, FastAPI + Pydantic, PostgreSQL, SQLAlchemy + psycopg, and `backend/schema.sql`. Keep PostgreSQL-only Docker Compose and native PostgreSQL setup documented.

Use `/tdd` for money handling, purchase decisions, atomicity, and concurrency behavior. Run the relevant tests and frontend checks, then use `/code-review` on the local diff against the assignment and `architecture.md`.

## Commit messages
Generate a commit message for your work once you have finished a full slice. Never commit without explicit approval.

Use `<type>: <short summary>` with one of these types:

- `feat`: add or change application behavior.
- `test`: add or change automated tests.
- `docs`: change README, architecture, AI usage, or other documentation.
- `chore`: scaffolding, dependencies, configuration, or maintenance.