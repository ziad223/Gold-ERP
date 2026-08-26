# DARFUS Permission Reconciliation Official Local Main Proof

## Official target

- Database: `darfus_erp`
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:3000`
- Git HEAD observed: `1657b0e9ba580faef69be48f04637835c201b521`
- Branch observed: `main`

## Protection and backup

The command refused an official `--execute` when approval was `NO` with:

`PROTECTED_PERMISSION_TARGET_REQUIRES_EXPLICIT_APPROVAL`

Before the approved write, a fresh custom-format backup was created and verified:

- file: `backend/acceptance-artifacts/permission-reconciliation/darfus_erp-before-permission-promotion-20260826.dump`;
- size: `793291` bytes;
- `pg_restore --list`: `PASS`;
- archive database: `darfus_erp`.

The immediate pre-write identity was `current_database() = darfus_erp`, database user `postgres`, with no active non-idle business DML/DDL session observed.

## Before/after database proof

| Entity | Before | After | Delta | Expected |
|---|---:|---:|---:|---|
| permissions | 150 | 152 | +2 | exact two Revision rows |
| roles | 5 | 5 | 0 | unchanged |
| role_permissions | 469 | 469 | 0 | no new role binding |
| user_roles | 1 | 1 | 0 | unchanged |
| system_account_roles | 26 | 26 | 0 | unchanged |
| employee_role_assignments | 0 | 0 | 0 | unchanged |
| employee_permission_grants | 0 | 0 | 0 | unchanged |
| employee_permission_denials | 0 | 0 | 0 | unchanged |

Official dry-run before execute showed source=152, DB=150, missing exactly the two Revision names, extra=0, metadata mismatch=0, and role-binding gaps=0. The approved execute wrote exactly two rows in one transaction.

The two rows are present exactly once:

| Name | ID | Module | Action |
|---|---|---|---|
| `inventory.revision.create` | `PERM-inventory.revision.create` | `inventory.revision` | `create` |
| `inventory.revision.view` | `PERM-inventory.revision.view` | `inventory.revision` | `view` |

No Revision role binding exists; this is expected because the existing intended Admin is `super_admin` and the accepted resolver reads all durable permission names. No unrelated role was broadened.

## Business-table no-delta proof

Verified backup-before versus official-after row counts were identical:

| Table | Before backup | After | Delta |
|---|---:|---:|---:|
| purchase_orders | 14 | 14 | 0 |
| purchase_order_items | 14 | 14 | 0 |
| assets | 18 | 18 | 0 |
| inventory_asset_movements | 62 | 62 | 0 |
| journal_entries | 25 | 25 | 0 |
| journal_lines | 67 | 67 | 0 |
| cash_transactions | 7 | 7 | 0 |
| idempotency_requests | 99 | 99 | 0 |

`OFFICIAL_REVISION_ROWS_DELTA = 0` and there was no Asset, Barcode, Movement, Journal, payment, or business transaction mutation.

## Runtime proof

Authenticated local Admin with the correct Company and Branch context produced:

- `GET /api/v1/health` → 200;
- `GET /api/v1/health/db` → 200;
- `GET /api/v1/health/redis` → 200;
- `GET /api/v1/inventory-v2/assets/AST-PUR-1787083585731-1-1-plz5/revisions?limit=50` with `x-company-id` and `x-branch-id` → 200;
- response was an empty, valid Revision list (`items=[]`, `total=0`), not 403/404.

An initial request without the Branch context returned 422; after supplying the existing Branch context the same read-only request returned 200. This was context enforcement, not a permission drift.

On `localhost:3000/en/inventory/AST-PUR-1787083585731-1-1-plz5`:

- Asset Detail loaded;
- `Revision history` panel rendered;
- `No revisions yet` rendered as the valid empty state;
- no route-not-found or permission-denied message appeared;
- browser error/warning log was empty for the inspected tab.

No Revision create request was sent. No business POST was issued by this proof.
