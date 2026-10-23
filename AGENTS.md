## Agent skills

### Issue tracker

No issue tracker; follow `docs/planning/commit-plan.md` for focused work. See `docs/agents/issue-tracker.md`.

Use `/implement` for a decided slice from that plan. Use `/grill-me` first when an important product or design decision is still unsettled; keep the decision in the conversation or update the existing project documentation rather than creating a separate spec.

### Domain docs

Single-context domain docs: root `GLOSSARY.md` and `docs/adr/`. See `docs/agents/domain.md`.

Use `/tdd` for money handling, purchase decisions, atomicity, and concurrency behavior. Run the relevant tests and frontend checks, then use `/code-review` on the local diff against the assignment and `architecture.md`.

## Commit messages
Generate a commit message for your work once you have finished a full slice. Never commit without explicit approval.

Use `<type>: <short summary>` with one of these types:

- `feat`: add or change application behavior.
- `test`: add or change automated tests.
- `docs`: change README, architecture, AI usage, or other documentation.
- `chore`: scaffolding, dependencies, configuration, or maintenance.
