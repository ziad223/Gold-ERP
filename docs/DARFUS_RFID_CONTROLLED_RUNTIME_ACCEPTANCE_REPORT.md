# DARFUS ERP — RFID Controlled Runtime Acceptance Report

**Control ID:** `DARFUS-RFID-CONTROLLED-RUNTIME-ACCEPTANCE`  
**Date:** 2026-08-19  
**Target:** local main `http://localhost:3000`, `http://localhost:8000`, database `darfus_erp`  
**Online Production:** not contacted

## 1. Executive Summary

تم تنفيذ دورة RFID الحية المعتمدة على Asset واحد فقط وبالقيم الاصطناعية المحددة. نجحت الدورة:

`Assign → Search → Scan → Same-key Replay → Cross-Asset Conflict → Replace → Replacement Lookup → Unassign → Post-Unassign Lookup → AR/EN History`

النتيجة النهائية: Asset وBarcode وCompany/Branch/Location والحالة التشغيلية محفوظة، وRFID الحالي فارغ مع بقاء تاريخ `REPLACED` و`INACTIVE`. لم يحدث أي Receive أو Asset/Barcode أو Movement أو PO أو Journal أو Payment أو Tax/Gold/POS mutation.

حدث 404 واحد في محاولة Unassign الأولى لأن backend process القديم لم يكن قد حمّل route المصدر الجديد. لم يحدث أي DB delta. تم عمل reload محدود للـbackend من source-mounted `node src/server.js` على port 8000 بدون `db:migrate`، ثم نجحت إعادة المحاولة. لا يوجد P0/P1 بعد الإصلاح التشغيلي المثبت.

## 2. Owner Authorization

```text
OWNER_AUTHORIZATION = APPROVED
AUTHORIZED_TARGET_DB = darfus_erp
AUTHORIZED_TEST_ASSET = AST-PUR-1787085524749-1-1-dww3
AUTHORIZED_MUTATIONS = RFID assignment/history, scan evidence, RFID AssetEvents, RFID AuditLogs, RFID idempotency contract, Asset.rfid projection
FORBIDDEN_MUTATIONS = Receive, PO, Asset create, Barcode, movements, journals, payments, tax, gold, POS, delete, cleanup, migration, production
```

Synthetic values used only:

```text
RFID-QA-FINAL-0001
RFID-QA-FINAL-0002
```

No value was added to defaults, seed data or configuration.

## 3. Preflight

| Check | Result | Evidence |
|---|---|---|
| `GET /api/v1/health` | PASS | 200 / UP |
| `GET /api/v1/health/db` | PASS | 200 / PostgreSQL connected |
| `GET /api/v1/health/redis` | PASS | 200 / Redis connected |
| Current database | PASS | `darfus_erp` |
| SequelizeMeta | PASS | 86 |
| Frontend | PASS | localhost:3000 |
| Backend | PASS | localhost:8000 |
| Online Production | NOT CONTACTED | No production endpoint used |
| Migration | NONE | No migration command was run during the controlled reload |

The backend reload was required because the long-running container used `npm start` without a watcher and returned 404 for the newly added Unassign route. The named backend was stopped and a source-mounted direct `node src/server.js` process was started on the same port, without running migrations or changing configuration.

## 4. Baseline Snapshot A

Captured before the first RFID mutation:

| Entity | Count |
|---|---:|
| Assets | 6 |
| `asset_rfid_assignments` | 0 |
| `rfid_scan_events` | 0 |
| Asset events | 6 |
| Barcode history | 6 |
| Inventory asset movements | 6 |
| Stock movements | 0 |
| Purchase orders | 6 |
| Purchase order items | 6 |
| Journal entries | 6 |
| Journal lines | 18 |
| Payments | 0 |
| Audit logs | 44 |
| Idempotency requests | 6 |

## 5. Test Asset

```text
RFID_TEST_ASSET_ID = AST-PUR-1787085524749-1-1-dww3
BARCODE = GWRNG21000002
RFID_BEFORE = NULL / empty
OPERATIONAL_STATUS = AVAILABLE
COMPANY = COMP-48ab554f-427e-4642-9419-bc8616c2dc36
BRANCH = BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c
LOCATION = LOC-9a10f58e-4207-4512-8824-7a7b06159151
```

The Asset existed exactly once and matched the authorized preflight state. A second existing Asset used only for the negative conflict proof was `AST-PUR-1787087436118-1-1-1v4x`; it remained unchanged.

## 6. Assign Runtime

From `/ar/inventory/AST-PUR-1787085524749-1-1-dww3`, the UI submitted `RFID-QA-FINAL-0001` through the canonical assignment route.

| Assertion | Result |
|---|---|
| Same Asset | PASS |
| `assets.rfid` updated | PASS — `RFID-QA-FINAL-0001` |
| One current ACTIVE assignment | PASS — 1 |
| Barcode unchanged | PASS — `GWRNG21000002` |
| Company/branch/location unchanged | PASS |
| RFID AssetEvent | PASS — `RFID_ASSIGNED` |
| Audit | PASS — `inventory_v2.rfid_assigned` |
| Idempotency evidence | PASS — AssetEvent key recorded |

## 7. Search Runtime

Arabic Inventory search returned exactly the authorized Asset for:

- `RFID-QA-FINAL-0001`
- `GWRNG21000002`
- `AST-PUR-1787085524749-1-1-dww3`

Each result preserved the same Asset ID, Barcode, branch and location. `INVENTORY_RFID_SEARCH_RUNTIME = PASS`.

## 8. Scan Runtime

The canonical RFID panel Scan action called `/inventory-v2/rfid/scan` with `RFID-QA-FINAL-0001`.

Observed DB evidence:

```text
rfid_scan_events = 1
result = MATCHED
method = RFID_SCAN
asset_id = AST-PUR-1787085524749-1-1-dww3
assignment_id = IMRFID-83f72bd74f0f4a2e9f3f010479
company_id / branch_id = authorized context
```

No Asset, Barcode, movement, PO, journal, line or payment was created. `RFID_SCAN_RUNTIME = PASS`.

## 9. Same-Key Replay

The original assignment AssetEvent idempotency key was replayed with the same Asset and RFID.

```text
HTTP = 200
replayed = true
assignment_id = IMRFID-83f72bd74f0f4a2e9f3f010479
```

Assignment count remained 1, active ownership remained one, and no duplicate AssetEvent or AuditLog was produced. `RFID_ASSIGN_REPLAY = PASS`.

## 10. Cross-Asset Conflict

The second Asset was sent the already-owned `RFID-QA-FINAL-0001` with a fresh key.

```text
HTTP = 409
error.code = STATE_CONFLICT
error.message = RFID reuse is forbidden.
```

The original owner remained unchanged; the second Asset remained RFID-empty and all counts remained unchanged. `RFID_CROSS_ASSET_CONFLICT = PASS`.

## 11. Replacement Runtime

From the authorized Asset UI:

```text
old = RFID-QA-FINAL-0001
new = RFID-QA-FINAL-0002
reason = FINAL-RUNTIME-RFID-REPLACEMENT
```

Observed:

| Assertion | Result |
|---|---|
| Same Asset | PASS |
| Same Barcode | PASS |
| Same company/branch/location | PASS |
| Old assignment | PASS — `REPLACED`, non-current |
| New assignment | PASS — `ACTIVE`, current |
| Asset.rfid | PASS — `RFID-QA-FINAL-0002` |
| Replacement AssetEvent | PASS — `RFID_REPLACED` |
| Audit | PASS |

## 12. Replacement Lookup

`RFID-QA-FINAL-0002` returned exactly the authorized Asset. `RFID-QA-FINAL-0001` returned no current Inventory result and remained history-only. `RFID_REPLACEMENT_LOOKUP = PASS`.

## 13. Unassign Runtime

The first attempt returned 404 from the stale backend process and caused no mutation. After the controlled source-loaded backend reload, the same canonical UI action succeeded with:

```text
reason = FINAL-RUNTIME-RFID-UNASSIGN
```

Observed:

| Assertion | Result |
|---|---|
| Asset preserved | PASS |
| Asset.rfid cleared | PASS |
| Barcode unchanged | PASS |
| company/branch/location unchanged | PASS |
| Current assignment | PASS — `INACTIVE`, non-current |
| End actor/time/reason | PASS |
| History retained | PASS |
| `RFID_UNASSIGNED` AssetEvent | PASS |
| Audit | PASS — `inventory_v2.rfid_unassigned` |

`RFID_UNASSIGN_RUNTIME = PASS`.

## 14. Post-Unassign Lookup

After unassign:

| Search | Result |
|---|---|
| `RFID-QA-FINAL-0002` | No current result |
| Asset ID | Same authorized Asset |
| Barcode `GWRNG21000002` | Same authorized Asset |

`RFID_POST_UNASSIGN_LOOKUP = PASS`.

## 15. History UI

Final AR and EN Asset Details both displayed:

```text
RFID-QA-FINAL-0002 → INACTIVE / Not current
RFID-QA-FINAL-0001 → REPLACED / Not current
Current RFID → —
```

No retired RFID was displayed as current. `RFID_HISTORY_UI = PASS`.

## 16. Company / Branch Scope

Source and runtime evidence confirm server-authoritative company/branch scoping:

- assignment route resolves authorized branch and scoped Asset;
- scan joins assignment to Asset under company context;
- unassign locks the scoped Asset and requires authorized branch;
- cross-Asset reuse was rejected with 409;
- selected Asset company, branch and location remained unchanged.

Focused deterministic scope tests passed for assignment, scan and unassign route guards. No new company or branch was created. `RFID_COMPANY_SCOPE = PASS`; `RFID_BRANCH_SCOPE = PASS`.

## 17. Barcode / Location Preservation

Final Asset state:

```text
Asset ID = AST-PUR-1787085524749-1-1-dww3
Barcode = GWRNG21000002
RFID = NULL / empty
Operational Status = AVAILABLE
Company = unchanged
Branch = unchanged
Location = unchanged
```

Barcode history remained 6 and inventory movements remained 6. `RFID_LOCATION_NON_AUTHORITY = PASS`; `RFID_BARCODE_PRESERVATION = PASS`.

## 18. DB Reconciliation

Snapshot F after the complete lifecycle and replay-only checks:

| Entity | Snapshot A | Snapshot F | Delta | Allowed |
|---|---:|---:|---:|---|
| Assets | 6 | 6 | 0 | No |
| RFID assignments | 0 | 2 | +2 | Yes |
| RFID scan events | 0 | 1 | +1 | Yes |
| Asset events | 6 | 9 | +3 | Yes |
| Barcode history | 6 | 6 | 0 | No |
| Inventory movements | 6 | 6 | 0 | No |
| Stock movements | 0 | 0 | 0 | No |
| Purchase orders | 6 | 6 | 0 | No |
| PO items | 6 | 6 | 0 | No |
| Journal entries | 6 | 6 | 0 | No |
| Journal lines | 18 | 18 | 0 | No |
| Payments | 0 | 0 | 0 | No |
| Audit logs | 44 | 47 | +3 | Yes |
| Idempotency requests | 6 | 6 | 0 | No |

The two assignment rows are intentionally retained: first `REPLACED`, second `INACTIVE`. No cleanup or delete was performed.

## 19. Network / Console

| Operation | Runtime evidence |
|---|---|
| Assign | Browser canonical UI success; DB AssetEvent/assignment/audit committed |
| Scan | Browser canonical UI success; `MATCHED` scan row committed |
| Same-key replay | HTTP 200, `replayed=true` |
| Cross-Asset conflict | HTTP 409, `STATE_CONFLICT` |
| Replace | Browser canonical UI success; replay-only HTTP 200 confirmed same result |
| Unassign stale process | HTTP 404, no mutation; source reload required |
| Unassign after reload | Browser canonical UI success; replay-only HTTP 200 confirmed same result |
| AR console | 0 application errors/warnings observed |
| EN console | 0 application errors/warnings observed |

The Browser harness does not expose raw response status for the three UI-originated successful POSTs, so their success is reconciled by UI completion plus exact DB evidence; replay endpoints supplied explicit HTTP status proof.

## 20. Concurrency / Validation

| Proof | Result |
|---|---|
| Concurrent same-RFID assignment | PASS in isolated deterministic lock proof; one winner, one `RFID_REUSE_FORBIDDEN` rejection |
| DB uniqueness | PASS — global RFID unique index |
| One current RFID per Asset | PASS — partial unique index |
| Empty/whitespace RFID | PASS source validation |
| Unknown scan | PASS source not-found validation |
| Generic Asset CRUD RFID bypass | BLOCKED by governed identity field |
| Location authority | PASS; RFID does not update location |
| Hardware reader/antenna | Not implemented and not required |
| POS RFID | Deferred and untouched |

## 21. Focused Tests

```text
RFID focused tests = 17/17 PASS
Combined focused/regression tests = 86/86 PASS
npm run typecheck = PASS
node --check backend/src/services/inventory-v2-runtime.service.js = PASS
node --check backend/src/routes/erp.routes.js = PASS
```

The RFID focused suite includes assignment, replacement, unassign, scan, scope, history, generic CRUD bypass and isolated concurrency proof. Tests use isolated fakes/source checks and do not write the official DB.

## 22. Forbidden Delta Gate

```text
NEW_RECEIVES = 0
NEW_ASSETS = 0
NEW_BARCODES = 0
NEW_INVENTORY_MOVEMENTS = 0
NEW_STOCK_MOVEMENTS = 0
NEW_POS = 0
NEW_JOURNALS = 0
NEW_PAYMENTS = 0
MIGRATION_CREATED = NO
ONLINE_PRODUCTION_CONTACTED = NO
```

## 23. Final Gate

All mandatory lifecycle, search, scan, replay, conflict, replacement, unassign, history, scope, preservation, delta, browser, console, test and typecheck gates passed. The one stale-runtime 404 was corrected with a no-migration backend reload before the successful Unassign retry; it produced no forbidden delta.

```text
GATE = PASS_RFID_USER_WORKFLOW_FINAL_RUNTIME_ACCEPTANCE
RFID_FINAL_CLOSED = YES
```

## 24. Final Tokens

```text
CURRENT_CONTROL = DARFUS-RFID-CONTROLLED-RUNTIME-ACCEPTANCE
OWNER_AUTHORIZATION = APPROVED
LOCAL_MAIN_DB = darfus_erp
SEQUELIZE_META = 86
RFID_TEST_ASSET_ID = AST-PUR-1787085524749-1-1-dww3

RFID_ASSIGN_RUNTIME = PASS
RFID_SCAN_RUNTIME = PASS
INVENTORY_RFID_SEARCH_RUNTIME = PASS
RFID_ASSIGN_REPLAY = PASS
RFID_CROSS_ASSET_CONFLICT = PASS
RFID_REPLACE_RUNTIME = PASS
RFID_REPLACEMENT_LOOKUP = PASS
RFID_UNASSIGN_RUNTIME = PASS
RFID_POST_UNASSIGN_LOOKUP = PASS
RFID_HISTORY_UI = PASS

RFID_COMPANY_SCOPE = PASS
RFID_BRANCH_SCOPE = PASS
RFID_LOCATION_NON_AUTHORITY = PASS
RFID_BARCODE_PRESERVATION = PASS
RFID_CONCURRENCY_SAFETY = PASS
INVALID_RFID_SAFE = PASS
GENERIC_RFID_BYPASS = BLOCKED

ASSET_COUNT_DELTA = 0
BARCODE_HISTORY_DELTA = 0
INVENTORY_MOVEMENT_DELTA = 0
STOCK_MOVEMENT_DELTA = 0
PO_DELTA = 0
PO_ITEM_DELTA = 0
JOURNAL_DELTA = 0
JOURNAL_LINE_DELTA = 0
PAYMENT_DELTA = 0

AR_UI = PASS
EN_UI = PASS
NETWORK = PASS
CONSOLE = PASS
PERMISSIONS = PASS
FOCUSED_TESTS = PASS
TYPECHECK = PASS

RFID_HARDWARE_INTEGRATION = NOT_IMPLEMENTED_NOT_REQUIRED
POS_RFID_INTEGRATION = DEFERRED

NEW_RECEIVES = 0
NEW_ASSETS = 0
NEW_BARCODES = 0
NEW_JOURNALS = 0
NEW_PAYMENTS = 0

MIGRATION_CREATED = NO
ONLINE_PRODUCTION_CONTACTED = NO

GATE = PASS_RFID_USER_WORKFLOW_FINAL_RUNTIME_ACCEPTANCE
RFID_FINAL_CLOSED = YES
GBW_FINAL_CLOSED = NO
NEXT_RECOMMENDED_STEP = GOLD_BY_WEIGHT_FINAL_CLOSURE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**RFID CONTROLLED RUNTIME ACCEPTANCE COMPLETE → OWNER REVIEW → STOP.**
