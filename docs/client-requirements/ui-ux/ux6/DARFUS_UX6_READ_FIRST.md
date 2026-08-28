# UX-6 Read-First Record

Control: `DARFUS-UIUX-UX6-INVENTORY-ASSETS-IMPLEMENTATION-WITH-ROLLBACK-01`

## Authority and safety

- Mode: presentation and interaction UI only.
- Official database: `darfus_erp`; verified read-only with `SELECT current_database()`.
- No migration, seed, API contract, business-rule, permission, route, or database change is permitted by UX-6.
- Existing worktree drift was preserved; no reset, restore, clean, stash, or generated `next-env.d.ts` edit was performed.

## Sources read

- Project `AGENTS.md` and the current owner working-method contract.
- `PROJECT_PROGRESS_HANDOFF.md`, current source-freeze/worktree authority, and UX2–UX5B ledgers/registers.
- `docs/client-requirements/ui-ux/DARFUS_UI_UX_ROUTE_INVENTORY.md`.
- UX1 Inventory/Asset reference prototype and component contracts.
- UX4 table/state contracts and UX4C drawer/focus closure.
- UX5/UX5B POS and visual closure reports; POS was not changed.
- Current inventory list and Asset detail pages, inventory V2 hooks, Asset panels, barcode/RFID/revision surfaces, and the existing canonical action handlers.
- Current focused/regression tests, `package.json`, typecheck/build scripts, Docker/runtime status, and read-only main DB identity.

## Read-first conclusion

The safe UX-6 boundary is the populated Asset list and Asset detail presentation: hierarchy, readable status labels, table density, numeric alignment, accessible search naming, and responsive containment. Existing data hooks, authority fields, action handlers, and workflow routes remain the implementation reality and are retained.

