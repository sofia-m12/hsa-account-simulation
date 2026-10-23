## Agent skills

### Issue tracker

No issue tracker; follow `docs/planning/commit-plan.md` for focused work. See `docs/agents/issue-tracker.md`.

Use `/implement` for a decided slice from that plan. Use `/grill-me` first when an important product or design decision is still unsettled; keep the decision in the conversation or update the existing project documentation rather than creating a separate spec.

### Domain docs

Single-context domain docs: root `GLOSSARY.md` and `docs/adr/`. See `docs/agents/domain.md`.

Use `/tdd` for money handling, purchase decisions, atomicity, and concurrency behavior. Run the relevant tests and frontend checks, then use `/code-review` on the local diff against the assignment and `architecture.md`.

Keep backend API models and responses aligned with the authoritative database schema. If an API field is omitted, renamed, or computed instead of matching a database column, call out the difference to the user before proceeding.

### Design System Tokens

For frontend work, use this Human Interest-inspired system as a visual reference,
not a brand reproduction: do not use its logo, wordmark, or proprietary imagery.
The HSA dashboard should feel calm, credible, and easy to scan—an account tool,
not a marketing landing page.

- **Color:** `--color-ink: #000025` is the primary text and strong-control
  color; `--color-teal: #14B5AB` is for focused, positive, and verified states;
  `--color-surface: #FFFFFF` is the default canvas; `--color-tint: #EAF6FD`
  is for large, quiet page regions; `--color-line: #C8D4DD` is for control
  borders and dividers; `--color-danger: #B42318` is reserved for errors and
  declined outcomes. Never use teal as a substitute for body text.
- **Typography:** use `Georgia, 'Times New Roman', serif` for page and section
  headings, with an expressive but readable weight; use `Inter, ui-sans-serif,
  system-ui, sans-serif` for controls, amounts, tables, and body copy. Use
  sentence case, not all-caps labels. Keep body lines to roughly 65 characters
  and use a 1.5–1.6 line-height.
- **Spacing and layout:** use a 4px base unit with this scale: `4, 8, 12, 16,
  24, 32, 48, 64`. Keep dashboard content left-aligned in a fluid container
  (`max-width: 1200px`) with 24px mobile and 48px desktop gutters. Separate
  major dashboard regions with 48–64px of space; use 16–24px inside panels.
- **Components:** primary actions are solid ink with white text; secondary
  actions are white with a 2px ink outline; use teal sparingly for status and
  the active/focus affordance. Inputs are white, 2px line-bordered, 12px
  rounded rectangles with generous horizontal padding. Panels use white
  surfaces, a 1px line border, 12–16px radius, and no default drop shadow.
  Make the balance the visual anchor with large serif numerals; render activity
  as a structured, date-aware list rather than a grid of interchangeable cards.
- **Interaction:** provide a clear `:focus-visible` ring in teal, visible
  validation and server-error messages, and outcome badges that pair color with
  text. Respect `prefers-reduced-motion`; transitions should clarify a direct
  interaction, never decorate the page.

## Commit messages
Generate a commit message for your work once you have finished a full slice. Never commit without explicit approval.

Use `<type>: <short summary>` with one of these types:

- `feat`: add or change application behavior.
- `test`: add or change automated tests.
- `docs`: change README, architecture, AI usage, or other documentation.
- `chore`: scaffolding, dependencies, configuration, or maintenance.
