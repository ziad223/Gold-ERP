# DARFUS ERP — Branch Permission & Item Revision Final Closure

Control ID: `DARFUS-BRANCH-PERMISSION-FINAL-CLOSURE-01`  
Date: `2026-08-26`  
Project: `I:\WORK\jewellery-erp-master`

## Executive Summary

تم تحديد سبب العائق وإصلاحه بأصغر تغيير آمن: قراءة الفروع العامة كانت تشتق `branches.view`، بينما صلاحية الفروع القانونية الموجودة في الكتالوج هي صلاحية سياق الإعدادات `settings.view`. تم ربط قراءة الفروع بنفس الصلاحية الموجودة، مع إبقاء صلاحيات إنشاء/تعديل/تعطيل/إعادة تفعيل/حذف الفروع منفصلة كما هي.

الاختبارات المركزة نجحت `18/18`، وفحص TypeScript نجح. إثبات المتصفح العربي والإنجليزي على الـruntime المعزول نجح، وإثبات B6/B7 على API نجح دون إنشاء Revision. قاعدة `darfus_erp` لم تستقبل أي كتابة، ولم يتغير أي Asset أو Movement أو Journal أو Revision رسمي.

`GATE = PASS_BRANCH_PERMISSION_AND_ITEM_REVISION_FINAL_CLOSURE`

## Authority Decision

| Decision | Result | Evidence |
|---|---|---|
| Branch read authority | Reuse existing `settings.view` | `contexts/settings-context.tsx` loads `/branches` as authenticated company/branch context; canonical catalog contains `settings.view` and does not contain `branches.view`. |
| Branch mutation authority | Dedicated branch lifecycle permissions preserved | `erp.routes.js` retains `branches.create`, `branches.update`, `branches.deactivate`, `branches.reactivate`, and `branches.delete` guards. |
| Revision view/create authority | `inventory.revision.view` / `inventory.revision.create` | Existing revision routes and canonical permission catalog; no change to revision schema or business contract. |
| Fallback behavior | Fail closed | Unsupported generic aliases no longer become implicit permission authorities; coverage test rejects unregistered consumers. |

## Proven Root Cause

`setupCrud("branches", ...)` converted a list/read operation into `branches.view`. That name was not part of the canonical permission catalog, so a valid context user received `403` from `/api/v1/branches`; the frontend then could not reach READY Branch context and the Revision panel was not browser-provable.

This was a permission-consumer/catalog mismatch, not an Item Revision schema, Asset, Barcode, inventory, accounting, or database-state defect.

## Minimum Safe Source Change

| File | Change | Scope |
|---|---|---|
| `backend/src/bootstrap/permission-consumer-coverage.js` | Added the shared generic CRUD map and fail-closed candidate resolver; `branches` read is explicitly overridden to `settings.view`; canonical action overrides prevent invented permissions. | Permission consumer mapping only |
| `backend/src/routes/erp.routes.js` | Uses the shared resolver in `guardFor`; retains the existing branch lifecycle guards. | Generic route guard only |
| `backend/src/middleware/auth.middleware.js` | Removed unsupported legacy alias `branches.cross`; existing canonical POS permissions remain. | Guard alias cleanup only |
| `backend/tests/route-permission-catalog-coverage.test.cjs` | Scans generic CRUD and direct permission consumers against the canonical catalog; asserts the branch read authority. | Focused prevention coverage |
| `docs/FINDINGS_REGISTER.md` | Added `ROUTE-PERMISSION-CATALOG-COVERAGE-001` with root cause and prevention gate. | Documentation |

No migration, schema, seed, permission row, Asset, Barcode, Movement, Journal, or Revision business logic was changed.

## Static Proof

| Proof | Result | Evidence |
|---|---|---|
| Canonical catalog | PASS | 152 source entries; duplicate/name and module/action checks pass. |
| `settings.view` exists | PASS | Canonical catalog and official DB each contain one row. |
| `branches.view` | Not introduced | No new branch-view permission was added. |
| Generic route coverage | PASS | All generic CRUD candidates resolve to canonical catalog entries. |
| Direct consumer coverage | PASS | Direct route/middleware/service permission literals resolve to canonical entries. |
| Revision service/API source | PASS | Existing C2C2 authority and fail-closed contract remain intact. |
| Migration | NONE | No migration created or executed. |

## Focused Tests and Typecheck

Command:

```text
node --test backend/tests/c2c2-revision-service-api.test.cjs backend/tests/c2c3-revision-ui.test.cjs backend/tests/permission-catalog-reconciler.test.cjs backend/tests/route-permission-catalog-coverage.test.cjs
```

Result: `18 passed, 0 failed`.

Additional syntax checks for the changed JavaScript files passed. `npm run typecheck` passed with exit code `0`. A Next build was not run; this control did not require a build and the runtime guardrail prohibits starting Next dev during acceptance.

## Disposable Runtime and Synthetic Fixture Boundary

Runtime proof used only:

| Component | Target |
|---|---|
| Frontend | `http://localhost:3003` |
| Backend | `http://localhost:8001` |
| Database | `darfus_c2c2_revision_runtime_02` |
| Redis | local disposable-runtime Redis connection |

The exact disposable database was verified with `SELECT current_database()`. Two synthetic identities were used without exposing credentials in this report. B7 received a synthetic shell role containing only the already-required `inventory.view` and `settings.view` permissions so the browser could reach the asset page while still lacking both Revision permissions. This was disposable RBAC fixture setup only; it was not a business seed or official DB write.

After evidence collection, the owned temporary listeners `3003/8001` were stopped. Existing `3000/8000` listeners were observed only and were not restarted or modified.

## API Contract Proof

All requests below used authenticated synthetic identities and were read-only except for the deliberately attempted Revision create, which was rejected before business persistence.

| Case | Login | `GET /api/v1/branches` | `GET /api/v1/inventory-v2/assets/{asset}/revisions` | `POST .../revisions` | Result |
|---|---:|---:|---:|---:|---|
| B6 view-only | 200 | 200 | 200 | 403 | PASS; history readable, create denied |
| B7 no Revision permission | 200 | 200 | 403 | 403 | PASS; history and create denied |

The B7 `branches=200` result is expected: its synthetic shell grants `settings.view`, the chosen canonical branch-context read authority. A separate pre-shell no-settings probe in the same control returned `/api/v1/branches = 403`, proving the unauthorized branch-read boundary remains fail-closed. No branch permission was broadened to all users.

## Browser Proof

The browser ran against the disposable frontend/backend only. No create control was pressed and no Revision POST was sent from the final browser journeys.

| Identity / Locale | URL | Direction | Branch context | Revision history | Create action | Console blockers | Result |
|---|---|---|---|---|---|---:|---|
| B6 view-only / AR | `http://localhost:3003/ar/inventory/AST-PUR-1787083585731-1-1-plz5` | `rtl` | Branch-1 ready | Visible | Explicit create-denied message | 0 | PASS |
| B6 view-only / EN | `http://localhost:3003/en/inventory/AST-PUR-1787083585731-1-1-plz5` | `ltr` | Branch-1 ready | Visible | Explicit create-denied message | 0 | PASS |
| B7 no Revision permission / EN | same asset route | `ltr` | Branch-1 ready | Unavailable message | No create action | No blocking UI failure in the post-fix DOM proof | PASS |

AR evidence included the asset detail, `سجل Revision`, visible history, and `لا تملك صلاحية إنشاء Revision`. EN evidence included `Descriptive Asset Revision`, visible history for B6, and `You do not have permission to create Asset Revisions`. B7 displayed `Revision history is not available for your permission` and no revision action.

Historical console messages from a pre-fix tab showing the old `/settings` and `/branches` `403` are not used as final evidence. The clean final AR and EN B6 tabs had zero console errors.

## Browser / Network Safety

| Request family | Observed behavior |
|---|---|
| Branch context read | `GET /api/v1/branches` authorized only for the canonical `settings.view` context authority. |
| Revision history | B6 `200`; B7 `403`. |
| Revision create | B6 and B7 `403`; no successful Revision POST. |
| Browser business POSTs | 0 in the final AR/EN proof. |
| Automatic retry | None. |

## Database Reconciliation

### Official database read-only proof

`SELECT current_database()` returned `darfus_erp`. Final read-only observations:

| Table / check | Count |
|---|---:|
| `permissions` | 152 |
| `inventory.revision.view` | 1 |
| `inventory.revision.create` | 1 |
| `asset_revisions` | 1 |
| `asset_revision_changes` | 2 |
| `assets` | 18 |
| `inventory_asset_movements` | 62 |
| `journal_entries` | 25 |
| `journal_lines` | 67 |
| `cash_transactions` | 7 |
| `idempotency_requests` | 100 |

These match the prior official read-only baseline. No official permission row, revision row, Asset, movement, journal, payment, or idempotency row was created by this control.

### Disposable database before/after

| Table | Before | After | Delta |
|---|---:|---:|---:|
| `asset_revisions` | 11 | 11 | 0 |
| `asset_revision_changes` | 13 | 13 | 0 |
| `asset_events` | 76 | 76 | 0 |
| `audit_logs` | 147 | 147 | 0 |
| `assets` | 18 | 18 | 0 |
| `inventory_asset_movements` | 62 | 62 | 0 |
| `journal_entries` | 25 | 25 | 0 |
| `journal_lines` | 67 | 67 | 0 |
| `idempotency_requests` | 110 | 110 | 0 |

Synthetic RBAC fixture rows are intentionally excluded from business-delta counts. `DISPOSABLE_REVISION_BUSINESS_DELTA = 0`.

## Security and Authority Closure

- Branch context remains server-authoritative and fail-closed.
- `settings.view` is reused only for the existing branch-context read; it does not grant branch mutation.
- Revision create remains protected by `inventory.revision.create`.
- Revision read remains protected by `inventory.revision.view`.
- Asset identity, Barcode identity, Inventory Count, Accounting, and Idempotency authorities were not changed.
- No shared account, permission catalog expansion, migration, or production action was performed.

## Worktree Safety

The worktree was already dirty before this control. Read-only status showed 113 tracked entries and 608 untracked entries at the time of final inspection. No reset, restore, clean, stash, or unrelated-drift cleanup was performed.

The intentional current-control files are the five source/test/documentation paths listed in **Minimum Safe Source Change**, plus this report. Existing modifications in other paths remain pre-existing and are not attributed to this control.

## Priority and Gate

| ID | Finding | Classification | Severity | Status |
|---|---|---|---|---|
| `ROUTE-PERMISSION-CATALOG-COVERAGE-001` | Generic Branch read derived an unregistered permission and blocked Branch context. | Permission consumer/catalog mismatch | P1 | RESOLVED by minimal source mapping and coverage test |
| `C2C3M-R-DEF-001` | Previous browser closeout could not reach the Revision panel because of the same mismatch. | Runtime acceptance blocker | P1 | RESOLVED and rerun passed |

No P0 or P1 blocker remains. No new P2/P3 defect was introduced or left unexplained by this control.

## Final Tokens

```text
CURRENT_CONTROL = DARFUS-BRANCH-PERMISSION-FINAL-CLOSURE-01
BRANCH_PERMISSION_AUTHORITY = settings.view
BRANCH_PERMISSION_DECISION = REUSE_EXISTING
BRANCHES_GET_AUTHORIZED = 200
BRANCHES_GET_UNAUTHORIZED = 403
GLOBAL_ROUTE_PERMISSION_COVERAGE_TEST = PASS
PERMISSION_CATALOG_STATUS = IN_SYNC
B6_VIEW_ONLY_BROWSER = PASS
B6_GET = 200
B6_POST = 403
B6_BUSINESS_DELTA = 0
B7_NO_PERMISSION_BROWSER = PASS
B7_GET = 403
B7_CREATE = DENIED
B7_BUSINESS_DELTA = 0
AR_FINAL_SMOKE = PASS
EN_FINAL_SMOKE = PASS
AR_BUSINESS_POST_COUNT = 0
EN_BUSINESS_POST_COUNT = 0
BROWSER_CONSOLE_BLOCKERS = 0
OFFICIAL_DB = darfus_erp
OFFICIAL_DB_READ_ONLY = YES
OFFICIAL_NEW_REVISION_ROWS = 0
OFFICIAL_ASSET_DELTA = 0
OFFICIAL_MOVEMENT_DELTA = 0
OFFICIAL_JOURNAL_DELTA = 0
PROBLEM_PREVENTION_REGISTER_UPDATED = YES
FOCUSED_TESTS = 18/18 PASS
TYPECHECK = PASS
MIGRATIONS = 0
OFFICIAL_DB_WRITES = 0
P0 = 0
P1 = 0
P2 = 0
P3 = 0
ITEM_REVISION_FEATURE = CLOSED
GATE = PASS_BRANCH_PERMISSION_AND_ITEM_REVISION_FINAL_CLOSURE
NEXT_BATCH = C3_ONLY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

تم إيقاف هذا التحكم بعد التقرير. لا يبدأ C3 تلقائيًا، ولا توجد صلاحية لإنشاء Revision أو تعديل قاعدة البيانات الرسمية من هذا التقرير.
