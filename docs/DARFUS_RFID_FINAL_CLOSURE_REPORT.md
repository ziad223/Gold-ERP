# DARFUS ERP — RFID Final Closure Report

**Control ID:** `DARFUS-RFID-FINAL-CLOSURE`  
**Mode:** Read-only forensic closure with source/unit proof only  
**Date:** 2026-08-19

## 1. Executive Summary

تم فحص RFID على المصدر الحالي، مخطط قاعدة البيانات الرسمية، الـAPI، واجهة Inventory بالعربية والإنجليزية، والاختبارات المركزة. النطاق الحالي **جزئي لكنه مدعوم مصدرًا واختباريًا**: RFID هو هوية اختيارية مرتبطة بـAsset، وله assignment/replacement/scan evidence، مع بحث Inventory وعرض التفاصيل. Barcode يظل الهوية الأساسية.

لا توجد أي بيانات RFID في `darfus_erp` وقت الفحص، ولم تُنفّذ أي عملية assignment أو scan أو receive أو journal أو payment. لذلك لا يُدّعى runtime lifecycle acceptance ببيانات حية؛ الإثبات التشغيلي المتاح هو source + focused service proof وقراءة browser/API فقط.

تم إصلاح عيب محدد في Generic Asset CRUD كان يسمح بتعديل `rfid` خارج مسار assignment المحكوم. لم تُنشأ migration ولم يحدث أي write رسمي.

## 2. Preconditions

| Item | Result | Evidence |
|---|---|---|
| Official database | PASS | `SELECT current_database()` = `darfus_erp` |
| Official DB mutation | NONE | Read-only counts only; no POST/PUT/DELETE/receive/scan/assignment |
| New receives/assets/barcodes | 0 | Final baseline unchanged: assets=6, RFID rows=0 |
| Payment/journal/tax/gold/POS mutation | NONE | No such operation executed |
| Migration | NONE | No migration created or executed |
| Online production | NOT CONTACTED | Local main URLs only |
| Browser mode | READ-ONLY | AR/EN Inventory list and detail navigation |
| Next.js generated drift | OWNER-ACCEPTED / UNTOUCHED | `next-env.d.ts` was not edited; no build or Next dev run |

## 3. RFID Implementation Classification

| Area | Classification | Finding |
|---|---|---|
| RFID implementation | PARTIAL | Asset field, assignment history, scan evidence, API, search and display exist |
| Data model | PRESENT | `Asset.rfid`, `asset_rfid_assignments`, `rfid_scan_events` |
| Assignment service | PRESENT | `assignRfid()` is server-side and transactional |
| Lookup service | PRESENT | `recordRfidScan()` resolves current active assignment in company scope |
| History model | PRESENT_VIA_ASSIGNMENT_HISTORY | Previous assignments remain as `REPLACED`; no separate history table |
| UI | PARTIAL | Inventory list/detail/search display; no dedicated assignment action UI |
| Hardware integration | NOT_IMPLEMENTED | No reader/antenna/driver integration found; outside this closure |
| Unassign | NOT_IMPLEMENTED | No public unassign route found |
| Replacement | PRESENT | Reassignment retires the previous assignment and creates a new current assignment |

## 4. Source Forensic

| Layer | Source evidence | Assessment |
|---|---|---|
| Asset model | `backend/src/models/asset.model.js` nullable `rfid` | Optional Asset-linked value; not stock quantity |
| Schema | `backend/migrations/20260804020000-inventory-components-rfid-history-foundation.js:52-88` | Assignment and scan tables plus constraints/indexes |
| Service | `backend/src/services/inventory-v2-runtime.service.js:457-504` | Required value, reuse rejection, replacement and scan evidence |
| Route | `backend/src/routes/erp.routes.js:5612-5652` | Permissioned assignment and scan endpoints; company/branch context |
| Inventory search | `backend/src/routes/erp.routes.js:5185-5196` | Barcode and RFID search from Asset/current assignment |
| Detail | `backend/src/routes/erp.routes.js:5366-5395` | Assignment history returned for scoped Asset |
| UI | `app/[locale]/(dashboard)/inventory/page.tsx:91-106`; detail `:135` | AR/EN search and identity display |
| Generic CRUD fix | `backend/src/controllers/erp.controller.js:103-127` | `rfid` is now an identity field; generic CRUD cannot bypass governed assignment semantics |

## 5. Data Model

`assets.rfid` is a compatibility/current-value projection. The authoritative assignment relationship is `asset_rfid_assignments`, carrying Asset, company, branch, RFID value, current/status, assignment actor/time, end actor/time, replacement reason and classification. `rfid_scan_events` records scan evidence and links to assignment and Asset with restrictive foreign keys.

No Product quantity field is used as RFID authority. No RFID value is used as a Barcode authority.

## 6. DB Baseline

| Entity/check | Count/result |
|---|---:|
| Database | `darfus_erp` |
| SequelizeMeta | 86 |
| Assets | 6 |
| Assets with non-empty RFID | 0 |
| RFID assignments | 0 |
| Current ACTIVE assignments | 0 |
| RFID scan events | 0 |
| Asset events | 6 |
| Audit logs | 44 |

The final read-only query after tests returned: `darfus_erp|6|0|0|0|44`.

## 7. RFID Value / Format Authority

RFID is normalized as a required non-empty opaque external identifier in the assignment path. It is not forced into Barcode format and no business meaning is inferred from its shape. Global uniqueness is DB-backed by `asset_rfid_number_global_uq`; reuse is also rejected by service logic.

## 8. Asset Relationship

One current RFID assignment maps to one Asset. Assignment is scoped to the authorized company/branch Asset. Replacement keeps the same Asset and retires the prior assignment. RFID does not create an Asset and does not change physical quantity authority.

## 9. Barcode Relationship

Barcode remains the permanent primary Asset identity. RFID is optional and shown as a separate current relationship. No barcode replacement, barcode generation or barcode mutation was executed in this control.

## 10. Uniqueness / Cardinality

| Rule | Evidence | Result |
|---|---|---|
| One RFID value globally | Unique index + service reuse check | PASS_SOURCE_DB |
| One current RFID per Asset | Partial unique index on `asset_id WHERE is_current=true` | PASS_SOURCE_DB |
| Active assignment references Asset | FK and scoped join | PASS_SOURCE_DB |
| Duplicate active values in official DB | Read-only query | 0 |
| Multiple active assignments per Asset | Read-only query | 0 |

## 11. Assignment

Canonical assignment is `POST /api/v1/inventory-v2/assets/:id/rfid`, protected by authentication, `inventory.adjust`, authorized branch resolution and `Idempotency-Key`. It locks the scoped Asset and creates assignment evidence plus an Asset event. The route does not create inventory stock, receive, payable or journal records.

## 12. Unassign / Replacement

Unassign is not implemented as a public operation and is not claimed. Replacement is implemented through the assignment route: the current row is marked non-current/`REPLACED` with end metadata, then a new `ACTIVE` row is inserted for the same Asset. The old value cannot be reused because the global unique index covers assignment history.

## 13. Company / Branch / Location

Assignment uses the server-resolved company/branch context and the Asset’s existing company/branch. Scan lookup requires current company and active assignment, and the route resolves the scoped Asset using authorized branch context. RFID does not become location authority; location remains Asset/branch data.

## 14. Status Compatibility

Assignment statuses are constrained to `ACTIVE`, `INACTIVE`, `REPLACED`, or `MISSING`. Scans resolve only `is_current=true AND status='ACTIVE'`. No operational Asset status schema was changed. No retired RFID row is treated as current by the lookup query.

## 15. Lookup / Scan / Inventory Search

`POST /api/v1/inventory-v2/rfid/scan` is permissioned by `inventory.view`, records a scan event, and resolves the current Asset. Inventory GET search accepts Barcode or RFID and returns the Asset/current RFID projection. Invalid or cross-company values fail closed in source/service proof; no scan POST was run against the official DB.

## 16. History / Audit

Replacement preserves assignment rows and marks the old row `REPLACED`. Scan events are append-only through an immutable trigger. Assignment creates `AssetEvent` evidence and the route writes an audit record when executed. The current official DB has no RFID assignment/scan audit rows because no runtime mutation occurred.

## 17. Permissions

Assignment requires authentication and `inventory.adjust`. Scan requires authentication and `inventory.view`. Asset reads are company/branch scoped. No new permission or fallback financial authority was added.

## 18. Receive / POS / Hardware Boundaries

Supplier Receive keeps RFID optional in profile payload metadata and does not make RFID a receive authority. No RFID assignment is created by receive in this closure. POS hardware/reader integration is absent and POS RFID expansion remains deferred. The existing Inventory RFID audit surface was not used as proof of hardware integration.

## 19. Integrity Queries

| Check | Result |
|---|---:|
| Orphan RFID rows | 0 |
| Duplicate active RFID values | 0 |
| Assets with multiple active RFID | 0 |
| Active RFID missing Asset | 0 |
| Company mismatch | 0 |
| Branch mismatch | 0 |
| Current RFID vs Asset projection mismatch | 0 |
| Retired row marked current | 0 |

Because the official DB has zero RFID rows, these are empty-state integrity results, not evidence of a populated RFID lifecycle.

## 20. Concurrency / Idempotency

The assignment path uses the existing Asset-event idempotency contract and locks current/reused RFID rows before write. Replays are expected not to duplicate assignment evidence; changed bodies with the same key are rejected by the existing conflict contract. The focused service proof covers assignment and scan query contracts without database writes. No live idempotency mutation was run.

## 21. Browser AR/EN

| Journey | Result | Evidence |
|---|---|---|
| AR Inventory list | PASS_READ_ONLY | Page loaded; RFID search/identity text present; no console errors observed |
| AR Asset detail | PASS_READ_ONLY | Barcode and RFID fields rendered; current RFID empty as expected |
| EN Inventory list | PASS_READ_ONLY | Page loaded; RFID search/identity text present; no console errors observed |
| EN Asset detail | PASS_READ_ONLY | Barcode and RFID fields rendered; current RFID empty as expected |
| Assignment UI | NOT_RUN | No dedicated UI action is present and mutation was prohibited |
| Hardware scan UI | NOT_RUN | No hardware integration is present |

## 22. API / Network / Console

| Area | Result |
|---|---|
| `GET /api/v1/health` | 200 / UP |
| `GET /api/v1/health/db` | 200 / PostgreSQL connected |
| `GET /api/v1/health/redis` | 200 / Redis connected |
| Inventory list/detail browser requests | Loaded successfully |
| Browser console | No RFID-related console error observed |
| Mutating RFID endpoints | Not called; no official DB mutation permitted |

## 23. Focused Tests

`node --test tests/rfid-final-closure.test.cjs`: **15/15 passed**.

Combined focused/regression command: **84/84 passed, 0 failed**. It included RFID, Barcode, Asset, Supplier Master, Supplier Receive V2, Unified Intake, GBW, GBP, accounting/tax precision and authority-foundation tests.

`npm run typecheck`: **PASS** (`tsc --noEmit`).

The RFID test includes a dynamic service-level assignment/scan proof using isolated fakes; it does not connect to or write `darfus_erp`.

## 24. Files Changed

Intentional changes for this control:

| File | Change |
|---|---|
| `backend/src/controllers/erp.controller.js` | Added `rfid` to governed Asset identity fields so Generic Asset CRUD cannot bypass RFID assignment authority |
| `tests/rfid-final-closure.test.cjs` | Added 15 focused source/service/boundary tests |
| `docs/DARFUS_RFID_FINAL_CLOSURE_REPORT.md` | This report |

No migration, configuration, `next-env.d.ts`, database record or Git history operation was performed. Existing unrelated worktree drift was not cleaned or reverted.

## 25. Gate

### Current accepted scope

`PASS_RFID_FINAL_CLOSURE` applies to the current accepted partial RFID scope: Asset-linked optional RFID, governed assignment/replacement service, company/branch-scoped lookup, scan evidence contract, Inventory search/display, uniqueness/cardinality and source/test proof.

It does **not** claim populated-data runtime lifecycle acceptance. Official DB has no RFID assets, and `RFID_RUNTIME_MUTATION=NO` by design. Dedicated unassign UI/API, hardware readers, POS RFID workflow and receive-time automatic assignment remain outside this closure.

### Boundary decision

No P0/P1 RFID authority or integrity defect was found after the Generic Asset CRUD guard was added. No official DB write occurred. The next workstream is not started automatically.

## 26. Final Tokens

```text
CURRENT_CONTROL = DARFUS-RFID-FINAL-CLOSURE
LOCAL_MAIN_DB = darfus_erp
SEQUELIZE_META = 86
RFID_IMPLEMENTATION = PARTIAL
RFID_DATA_MODEL = PRESENT
RFID_ASSIGNMENT_SERVICE = PRESENT
RFID_LOOKUP_SERVICE = PRESENT
RFID_HISTORY_MODEL = PRESENT_VIA_ASSIGNMENT_HISTORY
RFID_UI = PARTIAL
RFID_HARDWARE_INTEGRATION = NOT_IMPLEMENTED_NOT_REQUIRED
RFID_ASSET_AUTHORITY = PASS
RFID_NOT_STOCK_AUTHORITY = PASS
RFID_NOT_PRODUCT_AUTHORITY = PASS
RFID_VALUE_AUTHORITY = PASS
RFID_FORMAT_CONTRACT = OPAQUE_EXTERNAL_ID
RFID_UNIQUENESS = PASS
RFID_ASSET_CARDINALITY = PASS
RFID_ASSIGNMENT = PASS
RFID_UNASSIGN = NOT_IMPLEMENTED
RFID_REPLACEMENT = PASS_SOURCE_PROVEN
RFID_COMPANY_SCOPE = PASS
RFID_BRANCH_CONTEXT = PASS
RFID_LOCATION_DERIVATION = PASS
RFID_BARCODE_ASSET_CONSISTENCY = PASS_SOURCE_DB
RFID_STATUS_COMPATIBILITY = PASS_SOURCE
RFID_LOOKUP = PASS_SOURCE_TEST_PROVEN
INVENTORY_RFID_SEARCH = PASS
INVALID_RFID_SAFE = PASS_SOURCE
CROSS_COMPANY_RFID_ACCESS = BLOCKED
RFID_HISTORY = PASS
RFID_AUDIT = PASS_SOURCE
RFID_CONCURRENCY_SAFETY = PASS_SOURCE_DB
RFID_IDEMPOTENCY = PASS
ASSETS_WITH_RFID = 0
ORPHAN_RFID_ROWS = 0
DUPLICATE_ACTIVE_RFID_VALUES = 0
ASSETS_WITH_MULTIPLE_ACTIVE_RFID = 0
RFID_COMPANY_MISMATCHES = 0
RFID_BRANCH_MISMATCHES = 0
AR_UI = PASS
EN_UI = PASS
NETWORK = PASS
CONSOLE = PASS
PERMISSIONS = PASS
FOCUSED_TESTS = PASS
TYPECHECK = PASS
RFID_RUNTIME_MUTATION = NO
NEW_RECEIVES = 0
NEW_ASSETS = 0
NEW_BARCODES = 0
NEW_JOURNALS = 0
NEW_PAYMENTS = 0
MIGRATION_CREATED = NO
ONLINE_PRODUCTION_CONTACTED = NO
GATE = PASS_RFID_FINAL_CLOSURE
RFID_FINAL_CLOSED = YES
GBW_FINAL_CLOSED = NO
NEXT_RECOMMENDED_STEP = GOLD_BY_WEIGHT_FINAL_CLOSURE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

### Closure boundaries

```text
SUPPLIER_MASTER_FINAL_CLOSED = YES
SUPPLIER_RECEIVE_V2_FINAL_CLOSED = YES
ASSET_FINAL_CLOSED = YES
BARCODE_FINAL_CLOSED = YES
RFID_FINAL_CLOSED = YES
GBW_FINAL_CLOSED = NO
GBP_FINAL_CLOSED = NO
SUPPLIER_ACCOUNTS_FINAL_CLOSED = NO
POS_FINAL_CLOSED = NO
```

**RFID FINAL CLOSURE COMPLETE → OWNER REVIEW → WAIT FOR EXPLICIT NEXT BATCH APPROVAL.**
