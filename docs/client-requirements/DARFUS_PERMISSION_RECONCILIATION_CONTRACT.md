# DARFUS Permission Reconciliation Contract

## Control

`DARFUS-PERMISSION-CATALOG-RECONCILIATION-PREVENTION-01`

## Explicit entrypoints

From `backend/`:

```text
npm run permissions:check       # read-only dry-run (default)
npm run permissions:reconcile  # explicit --execute only
```

Required invocation guard:

```text
DARFUS_PERMISSION_TARGET_MODE = disposable | official
DARFUS_PERMISSION_TARGET_DB = exact database name
DARFUS_OFFICIAL_PERMISSION_RECONCILE_APPROVED = YES only for approved official promotion
```

The approval variable is supplied only for the one command invocation. It is not stored in Compose or `.env`.

## Read path

1. Load and validate the canonical source catalog.
2. Query `SELECT current_database(), current_user`.
3. Refuse a target/database mismatch.
4. Read `permissions` and current role bindings.
5. Calculate source count, DB count, missing, extra, metadata mismatch, and role-binding gaps against existing `ROLE_DEFS`.
6. Print the complete diff without changing state.

## Write path

Writes are allowed only when all of the following are true:

- `--execute` is present;
- the exact target identity was verified;
- protected `darfus_erp` has the explicit one-command approval;
- there are no extra rows or metadata mismatches;
- missing rows are exactly the approved Revision pair, or there are no missing rows on an idempotent rerun;
- the write is one transaction;
- rows use `PERM-<permission name>`, canonical name/module/action/description, and timestamps;
- no delete, update of existing rows, role grant, seed, migration, or business-table operation is performed.

Current promotion boundary:

```text
150 → 152
missing = inventory.revision.create, inventory.revision.view
```

## Fail-closed conditions

| Condition | Result |
|---|---|
| Missing target mode | `PERMISSION_TARGET_MODE_REQUIRED` |
| Missing target DB | `PERMISSION_TARGET_DB_REQUIRED` |
| Actual DB differs from target | `PERMISSION_TARGET_DB_MISMATCH` |
| Official execute without approval | `PROTECTED_PERMISSION_TARGET_REQUIRES_EXPLICIT_APPROVAL` |
| Official mode points to another DB | `OFFICIAL_PERMISSION_TARGET_DB_REQUIRED` |
| Unexpected missing permission | `BLOCKED_UNEXPECTED_PERMISSION_DRIFT` |
| Extra or metadata mismatch during execute | `BLOCKED_UNEXPECTED_PERMISSION_DRIFT` |
| Duplicate source name | `DUPLICATE_PERMISSION_NAME` |
| Strict duplicate module/action input | `DUPLICATE_PERMISSION_MODULE_ACTION` |

Existing historical module/action collisions are retained because later migrations intentionally use the same broad module for separate named permissions. They are not a second permission authority; source-name uniqueness remains mandatory.

## Role-binding contract

The reconciler reads role bindings and checks existing `ROLE_DEFS`. It does not broaden roles. The current Admin/Super Admin path is dynamic permission-row resolution, and the intended user is an existing `super_admin`. Therefore the approved promotion adds zero `role_permissions` rows.

## Startup contract

The reconciler is not imported by the normal server startup path. Normal `npm start` remains non-mutating. Permission reconciliation is visible only through the explicit CLI entrypoint.

## No business authority change

This contract does not change Asset/Barcode authority, Revision field rules, User/Auth/RBAC semantics, Company/Branch enforcement, Accounting, inventory, POS, financial workflows, migrations, or broad seeders.
