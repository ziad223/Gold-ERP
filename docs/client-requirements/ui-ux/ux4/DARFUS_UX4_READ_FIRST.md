# DARFUS UX4 — Read-First Record

Control: `DARFUS-UIUX-UX4-CORE-COMPONENTS-IMPLEMENTATION-WITH-ROLLBACK-01`

## Authority read

- `AGENTS.md` — read completely before work.
- `PROJECT_PROGRESS_HANDOFF.md` — read completely.
- UX-1 component, form, table, accessibility, motion, and responsive contracts — read completely.
- UX-2 semantic-token report and rollback artifacts — read completely.
- UX-3 shell/navigation report and rollback artifacts — read completely.
- Six DARFUS registers — read completely.
- UX4 execution instruction — read completely from the supplied attachment.

## Boundary

This batch is limited to shared UI component presentation and accessibility. It does not change routes, props, business workflows, API contracts, permissions, tax, accounting, inventory authority, or data.

## Current acceptance authority

- UX-2 semantic tokens and classic rollback remain the foundation.
- UX-3 shell/header/sidebar/navigation/breadcrumb implementation remains intact.
- `next-env.d.ts` generated drift is owner-accepted and is not edited.
- Worktree was already dirty before UX4; unrelated changes remain outside this batch.

## Safety

No database or business API writes are authorized. Browser checks are GET/read-only navigation and presentation inspection only.
