# DARFUS UI/UX UX-3 Read First

## Control

- Control: `DARFUS-UIUX-UX3-SHELL-NAVIGATION-IMPLEMENTATION-WITH-ROLLBACK-01`
- Project: `I:\\WORK\\jewellery-erp-master`
- Official DB: `darfus_erp` (read-only; no UX3 database operation is in scope)
- Runtime under observation: `http://localhost:3000` / `http://localhost:8000`
- Mode: minimum-safe shell/navigation implementation with focused proof and isolated rollback rehearsal.

## Authority order

1. UX-3 execution control and accepted owner decisions.
2. UX-2 semantic token foundation already present in `app/globals.css`.
3. Current shell source, runtime, and existing permission/route authorities.
4. Earlier UX reports as supporting evidence only.

## Read-first result

The current shell was inspected before editing: locale layout, dashboard layout, app shell, header, sidebar, logo, company/branch/operator context, language/theme controls, page header, modal dependency, and UX-2 theme context. The current sidebar permission filter and route list are protected authorities. UX-3 changes are restricted to presentation, navigation landmarks, active-state semantics, breadcrumbs, page-container rhythm, and responsive shell behavior.

## Hard boundaries

- No business/API/DB/migration/accounting/tax/inventory/POS/CGP/payment changes.
- No auth, RBAC, company/branch authority, or route contract changes.
- No module form/table/layout redesign.
- No Gold, barcode, pricing, idempotency, print, or Gift Voucher behavior changes.
- `NAV_VISIBILITY_PRESENTATION != PERMISSION_AUTHORITY` remains true.
- `PERMISSION_BEHAVIOR_CHANGED = NO` and `ROUTE_CONTRACT_CHANGED = NO` are required gates.

## Pre-change control

The pre-UX3 source snapshot and SHA-256 manifest were captured under `backups/ui-ux/PRE_UX3_SHELL_20260828_023226/` before source edits. The repository already contains unrelated worktree changes; they are preserved and are not owned by UX-3.
