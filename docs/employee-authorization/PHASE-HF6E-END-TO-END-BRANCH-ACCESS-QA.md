# HF6E - End-to-End Branch Login and Employee Access QA

## Closure

HF6E closed locally on `main` after a bounded P1 route-recovery fix.

- Starting HEAD: `64c8eb0b68b9788a1ab2aa8256b86009e7955caa`
- Fix commit: `9cbde94599f76cf44693da8cf8d0c132740090cf`
  (`fix: route inline employee verification to allowed workspace`)
- Migrations: `44`; permissions: `128`; verifier files: `62`
- Final clean-tree suite: `62/62 PASS`

## P1 Cause and Route Contract

The initial HF6E run recorded `HF6E_INVENTORY_REVERIFY_ROUTE_MISMATCH`.
After a Branch Account ended a Sales Employee session on `/en/sales`, inline
verification of an Inventory Employee changed authorization but retained the
denied Sales page. The inline shared form had no post-success route callback,
`AuthGuard` redirected only from `/dashboard`, and Change Employee separately
waited for asynchronous provider state.

The fix adds canonical `resolveEmployeeWorkspaceRoute`. It consumes the fresh
backend `EmployeeAuthorizationSummary`, uses the existing business priority
map, and returns the first permitted business route or neutral `/dashboard`
for no business access. Inline verification and Change Employee use it directly
with locale-aware `router.replace`; no route is selected from stale provider
state. `AuthGuard` retains reload recovery and renders an explicit controlled
no-assigned-access state. There is no POS fallback, permission recalculation,
backend change, scope change, or technical-account shortcut.

## Browser QA

Host-local Playwright with installed Chrome used `http://localhost:3000` and
only isolated `HF6E-FIX1-BQA-*` / `HF6E-BQA-RERUN-*` data.

- `HF6E_INLINE_REVERIFY_ROUTE_RECOVERY_PASSED`: English, Arabic, and mobile
  Sales -> End Employee -> inline Inventory verification replaced `/sales` with
  localized `/inventory`; browser Back did not reopen an unauthorized Sales
  workspace; no-access Employees reached the controlled dashboard state.
- `HF6E_FULL_BROWSER_RERUN_PASSED`: valid/invalid Branch login, inline Code and
  PIN verification, Cashier, Sales, Inventory, Treasury, Manager, direct
  denial, no access, stale/reverify, reload/current, Change Employee, End
  Employee, full logout, Super Admin separation, and Employee permission UI.
- Sales could call Customers but not Inventory; Inventory could call Inventory
  but not Customers. Arabic desktop and English mobile had no horizontal
  overflow, runtime overlay, or console error.

## Security and Cleanup

The backend remains authoritative for `(role permissions union direct grants)
minus direct denials`, fixed branch/company scope, and session freshness.
Branch technical sessions remain separate from Employee sessions. End, stale,
expired, and revoked Employee state return to the inline shell without ending
the Branch Account login.

All `HF6E-FIX1-BQA-*` and `HF6E-BQA-RERUN-*` data was removed. Zero rows were
confirmed for fixture companies, branches, Users, Employees, credentials,
branch access, grants, denials, verification attempts, operator sessions,
technical sessions, and audit rows. No real business, financial, inventory,
customer, token, or setting row changed. Temporary QA scripts were deleted;
ports `3000` and `8000` are quiet and `next-env.d.ts` is clean.

## Backups and Gates

All backups target local Docker PostgreSQL only at `localhost:5433 / darfus_erp`
and passed `pg_restore -l`.

- `backend/backups/darfus_erp_hf6e_start_20260718_214214.dump` (`492816` bytes)
- `backend/backups/darfus_erp_hf6e_fix1_start_20260718_215735.dump` (`492816` bytes)
- `backend/backups/darfus_erp_hf6e_final_20260718_221056.dump` (`494060` bytes)

Typecheck, lint (18 established warnings and zero errors), build, targeted
regressions, `git diff --check`, and the clean committed `62/62` verifier suite
passed. Production/Render was untouched. Next safe phase, only after owner
approval: `NOTIF-PRE1 — Comprehensive Notification, Error Feedback &
Performance Audit`.

NEXT TOOL START HERE
