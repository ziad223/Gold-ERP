# DARFUS ERP — Phase 03B-G2B Location Management

## 1. Executive Summary

تم تنفيذ أقل أساس آمن لإدارة مواقع المخزون على البيئة المحلية الرئيسية فقط. جدول `inventory_locations` كان موجودًا ومطابقًا للسلطة المطلوبة، لذلك لم تُنشأ Migration ولم يُنشأ Backup جديد. أضيف مسار DB-backed واحد، نطاقه Company/Branch خادمي، مع create/list/update/disable وتدقيق append-only وواجهة إدارة مستقلة.

نجح القبول المحلي بالموقع الاصطناعي الواحد `QA-G2B-LOCATION-01-EDITED` داخل الفرع الحالي. تم تعطيله في نهاية الاختبار، ولذلك لا توجد مواقع نشطة. لم يتم تشغيل Receive ولم تُنشأ أي بيانات Supplier أو Inventory أو Accounting.

## 2. Existing Location Architecture

- جدول `inventory_locations` موجود منذ migration `20260804010000-inventory-master-core-profile-foundation.js`.
- الأعمدة الفعلية: `id`, `company_id`, `branch_id`, `code`, `name`, `location_type`, `is_active`, timestamps.
- يوجد unique index على `(company_id, branch_id, code)`.
- توجد مراجع Foreign Key من `assets`, `inventory_asset_movements`, `inventory_workshop_items`, `stock_audits`, `transfer_items`, و`asset_missing_cases`.
- قبل G2B لم يوجد Model/CRUD route مخصص لإدارة المواقع. كانت GBW/GBP تقرآن المواقع النشطة raw SQL.

## 3. Authority Applied

| Authority | Result | Evidence |
|---|---|---|
| LOCATION_AUTHORITY | DB master data | Model/service/route الجديد؛ لا in-memory defaults |
| LOCATION_SCOPE | Branch | `req.branchId` + branch lookup داخل company |
| COMPANY_SCOPE | Server authoritative | `req.companyId` من auth/context؛ body/header override خارج النطاق مرفوض |
| FREE_TEXT_TRANSACTION_AUTHORITY | DENIED | Location management API لا يقبل Location كسلطة transaction free-text |
| PHYSICAL_INVENTORY_AUTHORITY | Preserved | لا تغيير في Asset authority |
| NO_FAKE_PRODUCTION_DEFAULT | PASS for location management/master data | `fake_location_rows=0`; لا row باسم Showroom/Main Warehouse/Warehouse/Default Location |

## 4. Schema/Migration

`MIGRATION_REQUIRED=NO`.

الـschema الحالي يحتوي `branch_id`, `is_active`, وunique index صالحين، ولا يوجد historical location row يحتاج backfill. لذلك:

- `MIGRATION_CREATED=0`
- `MIGRATIONS_EXECUTED_THIS_BATCH=0`
- SequelizeMeta قبل/بعد: `85 -> 85`
- `NO_NEW_BACKUP_REQUIRED=YES` لأن Migration غير مطلوبة.

## 5. Branch/Company Scope

- Company الفعلي: `COMP-48ab554f-427e-4642-9419-bc8616c2dc36`.
- Branch الفعلي: `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c` (`Branch-1`).
- لا يوجد إنشاء Company أو Branch جديد.
- Body `companyId`/`branchId` مرفوض بـ`LOCATION_SCOPE_IMMUTABLE`.
- Company header خارج النطاق: `403 COMPANY_SCOPE_INVALID`.
- Branch header خارج النطاق: `403 FORBIDDEN`.
- Branch move غير موجود كعملية، و`PATCH` لا يقبل نقل الموقع بين الفروع.

## 6. API

Canonical path: `/api/v1/inventory/locations`.

| Method | Endpoint | Behavior | Result |
|---|---|---|---|
| GET | `/inventory/locations` | Active locations for authenticated company/branch | 200; active list became empty after disable |
| GET | `/inventory/locations?includeDisabled=true` | Management list including disabled | 200; synthetic row present |
| POST | `/inventory/locations` | Create with server company/branch context | 201 through browser/API caller |
| PATCH | `/inventory/locations/:id` | Name/code/type only | 200 |
| POST | `/inventory/locations/:id/disable` | Soft disable | 200 |
| DELETE | Not added | No destructive endpoint invented | N/A with source proof |

Validation proof:

- blank name: `422 VALIDATION_FAILED`.
- client branch override: `422 LOCATION_SCOPE_IMMUTABLE`.
- unauthenticated read: `401 UNAUTHORIZED`.
- active-only list hides disabled rows by default.
- normalized active duplicate logic is implemented in the service and covered by focused source/unit tests; no second persistent synthetic row was created.

## 7. Permissions

- GET uses existing `inventory.view`.
- POST/PATCH/disable use existing `inventory.adjust` with operation names `inventory.locations.create`, `inventory.locations.update`, and `inventory.locations.disable`.
- Super Admin uses the existing technical permission path; no role or permission grant was added.
- No-auth access was rejected with 401. No new user/role was provisioned solely for a negative test.

`PERMISSION_CONTROL=PASS` for the existing permission architecture and route guards.

## 8. Audit

The existing tamper-evident `auditService.record` is used inside the same DB transaction as the location write.

Actions emitted:

- `location.created`
- `location.updated`
- `location.disabled`

The audit rows contain company, branch, actor/user id, location id in description, before/after snapshots, operation, and request correlation id. Audit count was `26` before and `30` after: exactly four location audit records (one create, two updates, one disable; the second update was the direct API proof).

`AUDIT=PASS`.

## 9. Management UI

Added one management page at `/ar/inventory/locations`, linked from the existing Inventory page without a new Sidebar business entry.

Implemented:

- current branch-visible DB list;
- create form for name/code/type;
- edit for safe fields;
- disable action;
- “include disabled” filter;
- permission-gated mutation controls;
- no Receive, tax, GBW, GBP, Diamond, or profile form added.

## 10. Focused Tests

| Suite | Result |
|---|---:|
| G2B location management static/unit | 5/5 PASS |
| G2A1 + G2A2 transaction tax regression | 16/16 PASS |
| Inventory authority + GBW + GBP + Supplier focused regression | 22/22 PASS |
| Frontend TypeScript typecheck | PASS |

G2B tests are in `backend/tests/phase-03b-g2b-location-management.test.cjs` and cover normalization, canonical routes, scope guards, audit wiring, no delete endpoint, no fake UI default, and schema sufficiency.

## 11. Regression Tests

- G2A1 tax policy: PASS; existing policy values unchanged.
- G2A2 transaction tax/snapshot/RCM: 16/16 PASS.
- Inventory authority: PASS.
- GBW formula and zero-stone regression: PASS.
- GBP rate calculation: PASS.
- Supplier V2 source/preview acquisition contract: PASS.
- No Receive business transaction was executed.

## 12. Local Main Synthetic Acceptance

The single synthetic location was created on `darfus_erp` as explicitly required for G2B local acceptance. It was not real customer, supplier, inventory, or financial data.

| Flow | Result |
|---|---|
| Create | PASS; one synthetic row created |
| Read/list | PASS |
| Edit | PASS; name and code changes persisted |
| Disable | PASS; `is_active=false` |
| Active list after disable | PASS; row hidden |
| Include disabled list | PASS; row visible |
| Browser create/edit/disable | PASS |
| Receive run | NO |

## 13. Browser/Network Proof

Local browser path: `http://localhost:3000/ar/inventory/locations`.

Verified authenticated navigation and page load for:

- `/ar/dashboard`
- `/ar/settings`
- `/ar/inventory`
- `/ar/inventory/locations`

Observed page headings successfully. The browser create action returned success state, the row appeared, edit persisted, disable persisted, active filtering hid it, and include-disabled filtering showed it. Browser console errors/warnings: `0`. API health/db/settings requests returned 200 during proof. No 5xx observed on the tested path.

## 14. DB Reconciliation

| Entity | Before | After | Notes |
|---|---:|---:|---|
| companies | 1 | 1 | unchanged |
| branches | 1 | 1 | unchanged |
| suppliers | 0 | 0 | no provisioning |
| inventory_locations | 0 | 1 | one synthetic disabled location only |
| purchase_orders | 0 | 0 | Receive not run |
| assets | 0 | 0 | no physical inventory created |
| inventory_asset_movements | 0 | 0 | unchanged |
| stock_movements | 0 | 0 | unchanged |
| journal_entries | 0 | 0 | no accounting transaction |
| journal_lines | 0 | 0 | no accounting transaction |
| payments | 0 | 0 | unchanged |
| customers | 0 | 0 | unchanged |
| audit_logs | 26 | 30 | four location lifecycle audit rows |

Final location row: company/branch scoped, `code=QA-G2B-LOC-01-EDITED`, `name=QA-G2B-LOCATION-01-EDITED`, `location_type=GENERAL`, `is_active=false`.

`fake_location_rows=0`; `active_locations=0`.

## 15. Files Changed

Intentional G2B files:

- `backend/src/models/inventoryLocation.model.js`
- `backend/src/services/inventory-location.service.js`
- `backend/src/routes/inventory-location.routes.js`
- `backend/src/models/index.js`
- `backend/src/routes/index.js`
- `app/[locale]/(dashboard)/inventory/page.tsx`
- `app/[locale]/(dashboard)/inventory/locations/page.tsx`
- `backend/tests/phase-03b-g2b-location-management.test.cjs`
- `docs/DARFUS_PHASE_03B_G2B_LOCATION_MANAGEMENT_REPORT.md`

The worktree already contained unrelated tracked and untracked changes. No cleanup, reset, restore, stash, or ownership transfer was performed. Current branch/HEAD remained `main / 1657b0e9ba580faef69be48f04637835c201b521`. The Owner-accepted generated `next-env.d.ts` drift was not edited or reverted.

## 16. Bugs Found/Fixed

- Fixed/implemented the missing dedicated DB-backed Location Management authority (model, service, routes, audit, UI).
- No schema defect was found; no migration was created.
- No business-rule or accounting defect was changed.
- Legacy `Showroom` strings remain in pre-existing Receive/generic legacy/mock/display paths documented by G1. They are not used by the new Location Management authority and are explicitly deferred to `03B-G2C-RECEIVE-API-UI-TAX-LOCATION-CLEANUP`; G2B did not widen into Receive cleanup.

## 17. Gate

```text
LOCATION_DB_AUTHORITY=PASS
LOCATION_BRANCH_SCOPE=PASS
LOCATION_COMPANY_SCOPE=PASS
CREATE=PASS
READ_LIST=PASS
UPDATE=PASS
DISABLE=PASS
FREE_TEXT_TRANSACTION_AUTHORITY=DENIED
FAKE_DEFAULT_LOCATION=NONE_IN_DB_AND_MANAGEMENT_AUTHORITY
PERMISSION_CONTROL=PASS
AUDIT=PASS
USED_LOCATION_DELETE_PROTECTION=NOT_APPLICABLE_WITH_SOURCE_PROOF
MANAGEMENT_UI=PASS
LOCAL_MAIN_API=PASS
LOCAL_MAIN_BROWSER=PASS
LOCAL_MAIN_DB=PASS
G2A1_REGRESSION=PASS
G2A2_REGRESSION=PASS
RECEIVE_RUN=NO
ONLINE_PRODUCTION_UNTOUCHED=YES
MIGRATIONS_CREATED=0
OFFICIAL_DB_TARGET=darfus_erp
SYNTHETIC_LOCATION_ONLY=YES
```

`GATE = PASS_PHASE_03B_G2B_LOCATION_MANAGEMENT`

`G2B_LOCAL_MAIN_FINAL_CLOSED = YES`

## 18. Next Step

`NEXT_RECOMMENDED_STEP = 03B-G2C-RECEIVE-API-UI-TAX-LOCATION-CLEANUP`

The next batch must explicitly resolve the remaining Receive/generic legacy `Showroom`/free-text paths before making Location mandatory in Supplier Receive. No automatic start was performed.

## 19. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PHASE-03B-G2B-LOCATION-MANAGEMENT
PHASE = 03B-G2B
LOCAL_MAIN_DB = darfus_erp
DB_REACHABLE = YES
SEQUELIZE_META_BEFORE = 85
SEQUELIZE_META_AFTER = 85
MIGRATION_REQUIRED = NO
MIGRATIONS_CREATED = 0
LOCATION_TABLE_PRESENT = YES
LOCATION_MODEL = IMPLEMENTED
LOCATION_SERVICE = IMPLEMENTED
LOCATION_ROUTES = IMPLEMENTED
LOCATION_DB_AUTHORITY = PASS
LOCATION_BRANCH_SCOPE = PASS
LOCATION_COMPANY_SCOPE = PASS
LOCATION_CREATE = PASS
LOCATION_READ_LIST = PASS
LOCATION_UPDATE = PASS
LOCATION_DISABLE = PASS
LOCATION_INCLUDE_DISABLED = PASS
LOCATION_DELETE = NOT_APPLICABLE_WITH_SOURCE_PROOF
LOCATION_PERMISSION = PASS
LOCATION_AUDIT = PASS
LOCAL_SYNTHETIC_LOCATION_CREATED = YES
LOCAL_SYNTHETIC_LOCATION_FINAL_STATE = DISABLED
FAKE_DEFAULT_LOCATION = NONE_IN_DB_AND_MANAGEMENT_AUTHORITY
LEGACY_SHOWROOM_CLEANUP = DEFERRED_TO_G2C
SUPPLIERS_BEFORE = 0
SUPPLIERS_AFTER = 0
PURCHASE_ORDERS_BEFORE = 0
PURCHASE_ORDERS_AFTER = 0
ASSETS_BEFORE = 0
ASSETS_AFTER = 0
MOVEMENTS_BEFORE = 0
MOVEMENTS_AFTER = 0
JOURNALS_BEFORE = 0
JOURNALS_AFTER = 0
PAYMENTS_BEFORE = 0
PAYMENTS_AFTER = 0
CUSTOMERS_BEFORE = 0
CUSTOMERS_AFTER = 0
RECEIVE_RUN = NO
ONLINE_PRODUCTION_UNTOUCHED = YES
G2A1_REGRESSION = PASS
G2A2_REGRESSION = PASS
MANAGEMENT_UI = PASS
LOCAL_MAIN_API = PASS
LOCAL_MAIN_BROWSER = PASS
LOCAL_MAIN_DB = PASS
OFFICIAL_DB_PERSISTENT_WRITE = SYNTHETIC_LOCATION_AND_AUDIT_ONLY
G2B_LOCAL_MAIN_FINAL_CLOSED = YES
GATE = PASS_PHASE_03B_G2B_LOCATION_MANAGEMENT
NEXT_RECOMMENDED_STEP = 03B-G2C-RECEIVE-API-UI-TAX-LOCATION-CLEANUP
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```
