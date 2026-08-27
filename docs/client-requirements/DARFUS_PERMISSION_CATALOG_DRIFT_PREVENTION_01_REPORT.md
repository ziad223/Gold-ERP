# DARFUS ERP — Canonical Permission Catalog Reconciliation + Drift Prevention

## ملخص تنفيذي

تم تدقيق مصدر الصلاحيات والـRBAC وقاعدة `darfus_erp`، ثم أضيف مسار reconciliation صريح وآمن. قبل الترقية كان المصدر canonical = 152 والقاعدة = 150، والناقص فقط صلاحيتا Revision. تم تنفيذ صفين فقط بعد dry-run وbackup صالح وrehearsal معزول. نجحت اختبارات الحماية، وإعادة التنفيذ، والـRBAC، وGET API، وواجهة Asset Detail. لم يحدث أي business mutation أو Revision creation.

- ما نجح: exact diff، disposable rehearsal، idempotency، official promotion، API 200، browser panel، RBAC negative controls.
- ما فشل: لا يوجد فشل P0/P1 في هذا control. ظهرت محاولة API أولى 422 بسبب غياب Branch context ثم نجح نفس GET بعد استخدام السياق الصحيح.
- خطر القاعدة الرسمية: تم تغيير security master-data المصرح به فقط: صفا permission؛ لا تغيّر أي business table.
- الخطوة التالية: Owner review فقط؛ لا يبدأ C3 تلقائيًا.

## 1. Control and scope

- `CURRENT_CONTROL = DARFUS-PERMISSION-CATALOG-RECONCILIATION-PREVENTION-01`
- Project: `I:\\WORK\\jewellery-erp-master`
- Official DB: `darfus_erp`
- Main runtime: `localhost:3000` / `localhost:8000`
- Scope: Permission catalog drift prevention and closure of the existing Revision 403.
- Out of scope: Revision create, Asset mutation, inventory, accounting, POS, migrations, broad seed, Admin bypass, security weakening, production.

## 2. Root cause and authority audit

### Root cause

The Revision route already enforced the canonical names, but the persistent `permissions` table had not received the two source rows. The old `accessControl.PERMISSIONS` export also represented only 145 names because later source catalogs were separate. The audited canonical union is 152; the official DB was 150 and lacked only the two Revision names.

### Authority conclusions

| Item | Proven authority |
|---|---|
| `PERMISSION_SOURCE_AUTHORITY` | `backend/src/bootstrap/permission-catalog-source.js`, aggregating the existing versioned catalogs and current migration-defined metadata |
| `PERMISSION_DB_AUTHORITY` | `permissions` table |
| `ROLE_BINDING_AUTHORITY` | `roles`, `role_permissions`, `user_roles`, existing `ROLE_DEFS` |
| `SUPER_ADMIN_PERMISSION_MODEL` | Existing `permission.service.js`; the route’s Revision guard resolves DB permission names for `super_admin` |
| `EXISTING_RECONCILE_PATH` | No safe dedicated path existed; existing `accessControl.ensurePermissions` is a bootstrap mutator and was not reused as normal startup reconciliation |

The accepted source catalog has one source aggregation point and no duplicate name authority. Historical migrations were not edited.

## 3. Change boundary

| Boundary | Result |
|---|---|
| Target requirement | Revision catalog rows and drift prevention only |
| Expected code | Catalog aggregation, safe reconciler, explicit CLI, one consumer literal normalization, focused tests |
| Forbidden source | Revision service/route behavior, inventory, accounting, migrations, seeds, UI business logic |
| Expected DB schema change | None |
| Expected business logic change | None |
| Accounting/inventory impact | None |
| Security impact | Additive permission master data only; existing fail-closed RBAC preserved |
| Idempotency impact | None |

## 4. Files changed for this control

Intentional source/config files:

- `backend/src/bootstrap/gold-pricing-policy-permission-catalog.js`
- `backend/src/bootstrap/permission-catalog-source.js`
- `backend/src/bootstrap/permission-catalog-reconciler.js`
- `backend/scripts/reconcile-permissions-safe.js`
- `backend/src/services/gold-pricing-policy.service.js` (consumer now imports its catalog descriptor)
- `backend/package.json` (explicit `permissions:check` and `permissions:reconcile` scripts)

Intentional test file:

- `backend/tests/permission-catalog-reconciler.test.cjs`

Required report artifacts:

- `DARFUS_PERMISSION_CATALOG_AUTHORITY_MAP.md`
- `DARFUS_PERMISSION_RECONCILIATION_CONTRACT.md`
- `DARFUS_PERMISSION_RECONCILIATION_DISPOSABLE_PROOF.md`
- `DARFUS_PERMISSION_RECONCILIATION_OFFICIAL_LOCAL_MAIN_PROOF.md`
- this report.

The worktree had pre-existing drift before this control: 110 tracked modified files, no staged files, and 4852 untracked files were observed. Those unrelated changes were preserved and not cleaned/reset/restored/stashed.

## 5. Reconciler and drift prevention

Implemented properties:

- dry-run by default;
- explicit `--execute` required;
- exact `current_database()` verification;
- disposable/official target mode required;
- official target refuses execute without one-command approval;
- one transaction for additive rows;
- no delete and no update of existing permission rows;
- exact approved missing-set gate;
- source/DB/metadata/role-binding diff output;
- idempotent second run;
- no normal-startup import or auto-reconcile;
- permanent source contract test for Revision route guard keys.

## 6. Tests

Command:

```text
node --test backend/tests/permission-catalog-reconciler.test.cjs
```

Result: 9 tests passed, 0 failed.

Covered duplicate names, strict duplicate module/action input, exact two-row diff, unexpected drift block, protected target refusal, target mismatch, no-delete behavior, role-binding gaps, route/source contract, Super Admin resolution, branch-shell denial, and view-only read/create separation.

## 7. Disposable rehearsal

`darfus_b1_employee_runtime_20260825_01` was verified as the full-RBAC disposable target. The first execute added exactly two permission rows; the second execute added zero. Counts for roles, role_permissions, user_roles, system_account_roles, employee assignments, grants, and denials were unchanged. Revision role bindings remained zero. The existing Admin/Super Admin resolver returned both Revision names as effective.

The schema-only `darfus_c2b_revision_fresh_01` also proved the two-row transactional insertion and zero-write second execution; it was not used as the sole RBAC proof.

## 8. Official local-main promotion

The official target was verified as `darfus_erp`. A fresh custom-format backup was created and verified before the write:

`backend/acceptance-artifacts/permission-reconciliation/darfus_erp-before-permission-promotion-20260826.dump` — 793291 bytes, `pg_restore --list=PASS`.

The official dry-run showed exactly the two accepted missing names and no extra, metadata, destructive, or role-binding delta. The approved execute inserted only `PERM-inventory.revision.create` and `PERM-inventory.revision.view`.

No role binding was added because the existing intended Admin is `super_admin` and the accepted resolver uses durable Permission names. No other role was broadened.

## 9. Official DB proof

| Entity | Before | After | Delta |
|---|---:|---:|---:|
| permissions | 150 | 152 | +2 expected |
| roles | 5 | 5 | 0 |
| role_permissions | 469 | 469 | 0 |
| user_roles | 1 | 1 | 0 |
| system_account_roles | 26 | 26 | 0 |
| employee_role_assignments | 0 | 0 | 0 |
| employee_permission_grants | 0 | 0 | 0 |
| employee_permission_denials | 0 | 0 | 0 |

Before-backup versus after counts were unchanged for `purchase_orders` (14), `purchase_order_items` (14), `assets` (18), `inventory_asset_movements` (62), `journal_entries` (25), `journal_lines` (67), `cash_transactions` (7), and `idempotency_requests` (99). Revision business rows, Assets, Barcodes, Movements, Journals, Payments, and business events were not created.

## 10. Main API and browser proof

Authenticated read-only runtime proof used the existing local Admin with the correct Company and Branch context:

- health, DB, and Redis endpoints: 200;
- `GET /api/v1/inventory-v2/assets/AST-PUR-1787083585731-1-1-plz5/revisions?limit=50`: 200;
- response: valid empty list, not 403/404;
- no Revision create POST was sent.

The first request without Branch context returned 422, proving fail-closed context enforcement. The corrected request with existing Company/Branch context returned 200.

On `http://localhost:3000/en/inventory/AST-PUR-1787083585731-1-1-plz5`, the Asset Detail page showed `Revision history` and `No revisions yet`; there was no route/permission error and the inspected browser error/warning log was empty.

## 11. Prevention lesson

`PERMISSION-CATALOG-DRIFT-001`

- Cause: a source permission was introduced without an explicit source-to-DB promotion gate.
- Enabler: distributed catalog definitions and a bootstrap mutator were not a controlled diagnostic/reconcile contract.
- Minimum fix: canonical source aggregator plus explicit dry-run/execute reconciler.
- Prevention gate: read-only exact diff → role authority proof → disposable exact rehearsal → focused tests → protected official dry-run → exact approved promotion → API/browser proof.

## 12. Risk and disposition

- P0: 0.
- P1: 0 after controlled promotion.
- P2: 0 remaining in this control.
- P3: 0 remaining in this control.
- No product/business logic defect was found or changed.
- The protected official DB contains two approved security master-data rows; no rollback/cleanup was executed.

## 13. Final tokens

```text
PROTECTED_DB_GUARD = PASS
DISPOSABLE_RECONCILE = PASS
IDEMPOTENT_SECOND_RUN = PASS
PERMISSION_RECONCILE_TESTS = PASS
SOURCE_PERMISSION_DRIFT_TEST = PASS
PERMISSION_CATALOG_DRIFT_VISIBLE = YES
OFFICIAL_PERMISSION_COUNT_BEFORE = 150
OFFICIAL_PERMISSION_COUNT_AFTER = 152
REVISION_CREATE_PERMISSION_PRESENT = YES
REVISION_VIEW_PERMISSION_PRESENT = YES
REVISION_CREATE_EFFECTIVE_FOR_INTENDED_ADMIN = YES
REVISION_VIEW_EFFECTIVE_FOR_INTENDED_ADMIN = YES
UNEXPECTED_PERMISSION_ROWS_ADDED = 0
UNEXPECTED_ROLE_BINDINGS_ADDED = 0
PERMISSION_ROWS_DELETED = 0
ROLE_BINDINGS_DELETED = 0
MAIN_REVISION_LIST_API = PASS
LOCAL_3000_REVISION_PANEL = PASS
RBAC_NEGATIVE_CONTROL = PASS
OFFICIAL_REVISION_ROWS_DELTA = 0
OFFICIAL_ASSET_DELTA = 0
OFFICIAL_BARCODE_DELTA = 0
OFFICIAL_MOVEMENT_DELTA = 0
OFFICIAL_JOURNAL_DELTA = 0
PERMISSION_CATALOG_DRIFT_PREVENTION = ACTIVE
FUTURE_PERMISSION_ADDITION_REQUIRES_RECONCILE_GATE = YES
BACKEND_START_AUTO_RECONCILES_PERMISSIONS = NO
CANONICAL_RECONCILER = IMPLEMENTED
RECONCILER_DRY_RUN_DEFAULT = YES
RECONCILER_IDEMPOTENT = YES
OFFICIAL_DB_BUSINESS_WRITES = 0
OFFICIAL_DB_SECURITY_MASTER_DATA_WRITES = 2_APPROVED_PERMISSION_ROWS
MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED = 0
REVISION_CREATE_REQUESTS_SENT = 0
REVISION_BUSINESS_ROWS_CREATED = 0
P0 = 0
P1 = 0
P2 = 0
P3 = 0
GATE = PASS_PERMISSION_CATALOG_RECONCILIATION_AND_DRIFT_PREVENTION
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

`NO C3 AUTOMATIC START`

`NO OFFICIAL REVISION BUSINESS MUTATION`

`NO BROAD PERMISSION SEED`

`NO ADMIN BYPASS`

`NO SECURITY WEAKENING`

`NO PRODUCTION`

**Permission catalog reconciliation and drift prevention complete → Owner review → wait for explicit next approval.**
