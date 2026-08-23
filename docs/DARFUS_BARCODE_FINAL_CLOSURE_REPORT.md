# DARFUS ERP — Barcode Final Closure

Control ID: `DARFUS-BARCODE-FINAL-CLOSURE`

## 1. Executive Summary

تم تدقيق Barcode كهوية قابلة للمسح مرتبطة بالـAsset، دون تحويله إلى سلطة مخزون مستقلة. النتيجة الحالية تثبت أن التوليد يتم من الخادم ومن إعدادات الشركة، وأن serial allocation محكوم بـPostgreSQL UPSERT، وأن العلاقة مع Asset والتاريخ والـcompany/branch محمية عبر المصدر والقيود الحالية.

تم تنفيذ القراءة فقط على `darfus_erp`. لم يتم إنشاء Receive أو Asset أو Barcode أو Replacement أو Journal أو Payment أو Audit row، ولم تُنفذ Migration أو RFID أو POS final integration أو أي تغيير في Business Logic.

`GATE = PASS_BARCODE_FINAL_CLOSURE`

## 2. Preconditions

| Precondition | Status | Evidence |
|---|---|---|
| Supplier Master final closure | YES / reused | `docs/DARFUS_SUPPLIER_MASTER_FINAL_RUNTIME_ACCEPTANCE_REPORT.md` |
| Supplier Receive V2 final closure | YES / reused | `docs/DARFUS_SUPPLIER_RECEIVE_V2_FINAL_CLOSURE_REPORT.md` |
| Asset final closure | YES / reused | `docs/DARFUS_ASSET_FINAL_CLOSURE_REPORT.md` |
| Official DB target | `darfus_erp` | `SELECT current_database()` returned `darfus_erp` |
| Mutation policy | Read-only | `NEW_RECEIVES=0`; no replacement/reprint request submitted |

## 3. Barcode Authority

| Concern | Current authority | Evidence | Result |
|---|---|---|---|
| Physical stock | Asset | Inventory V2 list queries `assets` only | PASS |
| Scannable identity | Asset.barcode + active history row | `asset_barcode_history`, Asset detail | PASS |
| Final value generation | Server `barcode-identity.service` | `generateBarcodeForAsset()` | PASS |
| Company scope | Server `req.companyId` and company-scoped settings | Asset list/detail and generator | PASS |
| Branch context | Authorized Asset/branch context | `resolveAuthorizedBranchId()` and `findScopedInventoryV2Asset()` | PASS |
| History | `asset_barcode_history` | Initial trigger and replacement service | PASS |
| Client authority | None for final Barcode | create path overwrites client identity values | PASS |

Frozen lifecycle semantics remain: reprint keeps the same identity; replacement retires the old row and creates the new active identity for the same Asset; returned Assets retain their Barcode.

## 4. Source Forensic

| Area | Source proof |
|---|---|
| Generator | `backend/src/services/barcode-identity.service.js`: `generateBarcodeForAsset()` resolves company database settings and calls `allocateBarcodeSerial()`. |
| Serial allocation | Same service uses `INSERT ... ON CONFLICT (company_id, inventory_code, item_code, karat_code) DO UPDATE SET last_serial = ... + 1 RETURNING last_serial`. |
| Collision protection | Generator checks both `assets` including non-paranoid rows and `asset_barcode_history`; it skips historical collisions and never reuses a Barcode. |
| Initial history | `backend/migrations/20260817010000-barcode-replacement-status-foundation.js` creates the history table and the Asset insert trigger. |
| Replacement | `replaceAssetBarcode()` locks current ACTIVE history, requires a reason and transaction, retires old history, updates the same Asset, and inserts the next ACTIVE history row. |
| Reprint | `POST /inventory-v2/assets/:id/tags/print` records a tag-print event only; it does not allocate or change Barcode identity. |
| Replacement route | `POST /inventory-v2/assets/:id/barcode/replace`, permission `inventory.adjust`, server-generated next Barcode, idempotency and audit/event evidence. |
| Asset list/detail | `GET /inventory-v2/assets` and `GET /inventory-v2/assets/:id`, permission `inventory.view`; both enforce company and authorized branch. |
| Direct edit | `ErpController` rejects changed Asset identity fields after Barcode generation; the DB trigger rejects unauthorized `assets.barcode` updates. |
| Public history CRUD | No `setupCrud` or public route for `asset_barcode_history`; history is only used by canonical lifecycle code. |

No source defect requiring a Barcode fix was proven. No runtime source file was changed.

## 5. DB Baseline

Read-only snapshot after all tests and browser reads:

| Entity / Check | Count / Actual |
|---|---:|
| Current database | `darfus_erp` |
| SequelizeMeta | 86 |
| Assets | 6 |
| Barcode history rows | 6 |
| Active Barcode rows | 6 |
| Retired Barcode rows | 0 |
| Asset events | 6 |
| Inventory Asset movements | 6 |
| Purchase orders | 6 |
| Idempotency requests | 6 |
| Audit logs | 44 |

Counts were identical before and after the focused tests.

## 6. Generation / Serial Authority

`generateBarcodeForAsset()` uses company-scoped `barcode_inventory_codes` and `barcode_item_codes` from the database. The browser can provide classification inputs such as profile/type/item hint, but the final value is overwritten by the server-generated identity.

Serial authority is the `barcode_sequences` scope `(company_id, inventory_code, item_code, karat_code)`. PostgreSQL UPSERT is the concurrency boundary; the database also has `barcode_sequences_scope_uq`. The generator checks historical and Asset collisions and retries up to 20 serial allocations without reusing a historical value.

`BARCODE_SERVER_AUTHORITY = PASS`  
`BARCODE_SERIAL_AUTHORITY = PASS`  
`BARCODE_CONCURRENCY_SAFETY = PASS` — source UPSERT plus database unique backstops; no persistent concurrency mutation was run under the read-only policy.

## 7. Barcode Format

The actual formatter is:

`<InventoryCode><ItemCode><2-digit Karat><6-digit Serial>`

The two accepted current examples parse as:

| Barcode | Inventory | Item | Karat | Serial | DB mapping |
|---|---|---|---|---|---|
| `GWRNG21000001` | `GW` | `RNG` | `21` | `000001` | PASS |
| `GPRNG21000003` | `GP` | `RNG` | `21` | `000003` | PASS |

The formatter pads karat to two digits and serial to six digits. The service normalizes loose profiles to `00` and rejects a non-`00` loose karat. No future loose profile was activated or created during this control.

`BARCODE_FORMAT_AUTHORITY = PASS`  
`BARCODE_SERIAL_WIDTH = PASS`  
`BARCODE_KARAT_ENCODING = PASS`

## 8. Inventory / Item / Karat Mapping

Current official master data is company-backed and read-only during this control:

- Inventory codes: `GW`, `GP`, `DD`, `GS`, `PL`; all 5 are active and client-approved.
- Item codes: 20 active/client-approved rows, including canonical `ERG` and `NCK`.
- No generated or active Barcode uses noncanonical `ERR` or `NLC`.
- Current DB Assets use `GW` and `GP`, item codes `RNG`/`PND`, and karat `21`.
- SQL parsing proved every active Asset Barcode matches `assets.inventory_code`, `item_code`, `karat_code`, and padded `barcode_serial`.

| Token | Result |
|---|---|
| `BARCODE_INVENTORY_PREFIX_MAPPING` | PASS |
| `BARCODE_ITEM_CODE_MAPPING` | PASS |
| `BARCODE_KARAT_ENCODING` | PASS |

No historical alias was rewritten and no backfill was performed.

## 9. Asset Relationship

Every active history row points to an existing Asset. The active history Barcode equals `assets.barcode`, and the Asset remains the physical inventory authority. Product quantity is not used by the Inventory V2 list or Barcode lookup/search projection.

The database baseline returned:

- orphan Barcode History rows: 0
- active Barcode without Asset: 0
- active Asset/Barcode mismatches: 0
- company mismatch: 0
- branch/context mismatch: 0

`BARCODE_ASSET_RELATION = PASS`

## 10. Active Barcode Uniqueness

The database contains:

- `asset_barcode_history_barcode_uq` — unique historical Barcode value, preventing reuse.
- `asset_barcode_history_one_active_uq` — partial unique index, at most one ACTIVE history row per Asset.
- `assets_barcode_global_uq` and company Barcode indexes — Asset-side uniqueness backstops.
- `barcode_sequences_scope_uq` — one serial counter per company/taxonomy/karat scope.

Read-only anomaly results:

| Check | Count |
|---|---:|
| Assets without active Barcode | 0 |
| Assets with more than one active Barcode | 0 |
| Duplicate active Barcode values | 0 |
| Duplicate Asset Barcode values | 0 |

`ONE_ACTIVE_BARCODE_PER_ASSET = PASS`  
`ACTIVE_BARCODE_VALUE_UNIQUENESS = PASS`

## 11. Barcode History

Actual history fields include Asset/company identity, Barcode, revision, state (`ACTIVE`/`RETIRED`), action (`INITIAL`/`REPLACEMENT`), issue/retirement timestamps and actors, retirement reason, source type/id, and audit timestamps.

The current official DB has 6 `INITIAL`/`ACTIVE` rows and no retired rows. Old rows are not deleted by the replacement service. There is no independent public history CRUD route; direct lifecycle writes are confined to the canonical service and protected by unique constraints and the Asset identity trigger.

`BARCODE_HISTORY_PRESERVED = PASS`

## 12. Reprint / Revision / Replacement

| Lifecycle | Current result | Evidence |
|---|---|---|
| Reprint | `PASS_SOURCE` | Tag-print route requires idempotency; `REPRINT` requires reason; runtime writes tag-print event and returns existing Barcode. |
| Independent Barcode revision workflow | `NOT_IMPLEMENTED` | No separate revision endpoint; `barcodeRevision` is maintained by replacement. |
| Replacement contract | `PASS_SOURCE_PROVEN` | Same Asset; old history `RETIRED`; new history `ACTIVE`; server-generated Barcode; reason required. |
| Replacement atomicity | `PASS_SOURCE_PROVEN` | One transaction, Asset lock, history lock, unique constraints, rollback on error. No accepted Asset was mutated. |
| Replacement runtime mutation | `NOT_RUN_READ_ONLY` | Control forbids mutation of accepted Asset. |

No new Barcode was issued in this control.

## 13. Return Behavior

The canonical return path resolves an Asset before Product fallback, rejects final-profile Product returns, and calls `inventoryV2Runtime.transitionAsset(... toStatus: "RETURNED")`. It does not replace or clear `asset.barcode`. The detail UI states that status transitions are legal workflow actions, while Barcode identity remains protected.

`RETURN_BARCODE_RETENTION = PASS_SOURCE`

## 14. Lookup / Scan Resolution

The canonical read path is `GET /inventory-v2/assets?search=<barcode>` and the exact Asset path is `GET /inventory-v2/assets/:id`. Search is server-side and includes `a.barcode ILIKE :search`; it is constrained by `a.company_id=:companyId` and `a.branch_id=:branchId`.

The Arabic and English Inventory lists display Barcode beside the exact Asset ID. Direct invalid Asset navigation returned a safe non-fatal error state with no console errors. No separate top-level Barcode inventory was introduced.

`BARCODE_LOOKUP = PASS`  
`INVALID_BARCODE_SAFE = PASS`

## 15. Company / Branch Scope

The Asset list requires `inventory.view`, resolves an authorized branch, and applies both server company and branch predicates. Asset detail uses `findScopedInventoryV2Asset()` with `{ id, companyId: req.companyId, branchId }`. The replacement and tag-print routes repeat the same authorized branch resolution before locking the Asset.

Therefore a client-supplied company or branch cannot rebind a Barcode to another Asset or branch. Cross-company access is fail-closed at the Asset scope.

`CROSS_COMPANY_BARCODE_ACCESS = BLOCKED`  
`BARCODE_COMPANY_SCOPE = PASS`  
`BARCODE_BRANCH_CONTEXT = PASS`

## 16. Asset Status Compatibility

Barcode identity is not automatically changed by `AVAILABLE`, `RESERVED`, `WORKSHOP`, `SOLD`, or `RETURNED` transitions. The canonical status transition service records the event/movement while preserving the Asset Barcode. Replacement is the only controlled identity change and is isolated behind `inventory.adjust`, a reason, a transaction, and an idempotency key.

`ASSET_STATUS_BARCODE_COMPATIBILITY = PASS_SOURCE`

## 17. Receive Idempotency

No new Receive was executed. Existing accepted Supplier Receive V2/G3 evidence was reused because the Barcode generator, Asset history trigger, and idempotency path are unchanged in this control.

The source contract remains:

- valid same-key receive replay returns the prior result and does not create a second Asset, Barcode, or history row;
- a conflicting same-key request is rejected by the idempotency contract;
- the server-generated Barcode is part of the original Asset transaction;
- no failed/rejected receive is used as a Barcode mutation proof here.

`RECEIVE_REPLAY_BARCODE_IDEMPOTENCY = PASS_REUSED_G3`

## 18. Delete / Direct Edit Protection

Asset hard delete is blocked by the existing `assets_hard_delete_forbidden_trg`. The Barcode identity trigger rejects direct Asset Barcode changes unless the transaction-local replacement capability is explicitly set by the canonical replacement service.

The generic Asset update path compares identity fields including type, karat, inventory code, item code, karat code, Barcode, serial, generated timestamp, and revision; changes after generation are rejected. No public `asset_barcode_history` CRUD endpoint or route was found. History deletion is therefore `NOT_EXPOSED` through the application, and accepted Asset history was not touched.

`DIRECT_BARCODE_EDIT = BLOCKED_OR_NOT_EXPOSED`  
`BARCODE_DELETE_PROTECTION = PASS`

## 19. Integrity Queries

All checks were read-only and returned zero anomalies:

| Query | Result |
|---|---:|
| Orphan Barcode History rows | 0 |
| Active Barcode without Asset | 0 |
| Duplicate active Barcode values | 0 |
| Assets with multiple active Barcode rows | 0 |
| Active Asset/Barcode mismatch | 0 |
| Company mismatch | 0 |
| Branch/context mismatch | 0 |
| Active invalid format | 0 |
| Active invalid inventory prefix | 0 |
| Active invalid item code (`ERR`/`NLC`) | 0 |
| Active invalid karat encoding | 0 |
| Active serial width not equal to 6 | 0 |
| Asset fields vs parsed Barcode mismatch | 0 |
| Invalid current gold karat code | 0 |
| Loose profile non-`00` karat | 0 |

Historical-only state is separated: retired rows currently equal 0; no historical anomaly or repair was inferred.

## 20. Current Accepted Barcode Evidence

| Asset | Profile | Barcode | Active history | Company/Branch | Mapping |
|---|---|---|---:|---|---|
| `AST-PUR-1787083585731-1-1-plz5` | `GOLD_BY_WEIGHT_JEWELLERY` | `GWRNG21000001` | 1 | compatible | PASS |
| `AST-PUR-1787094119267-1-1-sulb` | `GOLD_BY_PIECE` | `GPRNG21000003` | 1 | compatible | PASS |

Both rows are `ACTIVE`, revision 1, action `INITIAL`, source `ASSET_CREATE`. SQL parsing matched inventory prefix, item code, two-digit karat, and six-digit serial to the Asset columns.

## 21. Concurrency Safety

The source has two independent protections:

1. The serial counter is allocated by a PostgreSQL `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` within the caller transaction, avoiding a `MAX()+1` race.
2. Active/history values are protected by unique indexes and the generator checks both Asset and history identities, retrying a collision without reuse.

The focused test asserts the UPSERT and all required unique constraints. Persistent concurrent generation was not run because the Control requires `NEW_BARCODE_ROWS=0` and forbids mutation of accepted Assets.

`BARCODE_CONCURRENCY_SAFETY = PASS`

## 22. Permissions / Audit

| Operation | Permission / evidence |
|---|---|
| Asset list/detail/search | `inventory.view` plus authorized company/branch context |
| Reprint/tag print | `inventory.print`, reason for REPRINT, idempotency, audit event |
| Replacement | `inventory.adjust`, reason, idempotency, Asset event `BARCODE_REPLACED`, audit record |
| Generic identity edit | Rejected by controller and DB identity trigger |
| History CRUD | No public route exposed |

No audit row was created in this control. Existing audit count remained 44.

## 23. Browser AR/EN

Read-only browser observations on the local main runtime:

| Journey | Result | Evidence |
|---|---|---|
| `/ar/inventory` | PASS | Six Asset rows; Barcode, Asset ID, profile, branch/location, supplier, and status visible. |
| Arabic GBP Asset detail | PASS | `GPRNG21000003`, Asset ID, identity/traceability, origin, history, branch and location visible. |
| `/en/inventory/:id` | PASS | English detail route loaded with Asset ID, Barcode, Identity and Traceability, and Unified Item History. |
| Invalid Asset/Barcode route | PASS | Safe non-fatal not-found/error state; no blank crash. |
| Console | PASS | `dev.logs({levels:["error"]})` returned no errors for the accepted detail and invalid route. |
| Barcode search | PASS_SOURCE_AND_UI | Inventory list search field is explicitly Barcode/RFID/Asset search and backend query includes `a.barcode ILIKE`. |

No print or reprint action was clicked, and no form was submitted.

## 24. API / Network / Console

Read-only health GETs on local main:

| Endpoint | Status | Result |
|---|---:|---|
| `http://localhost:8000/api/v1/health` | 200 | UP |
| `/api/v1/health/db` | 200 | PostgreSQL connected |
| `/api/v1/health/redis` | 200 | Redis connected |
| `/api/v1/health/gold` | 200 | HEALTHY; live provider; no mock fallback |
| Authenticated Asset list/detail browser requests | Loaded | Data rendered in AR/EN screens; no fatal console error |

The source-backed API paths are `GET /api/v1/inventory-v2/assets` and `GET /api/v1/inventory-v2/assets/:id`, with `inventory.view` and server scope. No mutation endpoint was called.

`NETWORK = PASS`  
`CONSOLE = PASS`

## 25. Focused Tests

Added and passed:

```text
node --test tests/barcode-final-closure.test.cjs backend/tests/barcode-status-foundation-01c.test.cjs
15 tests, 15 passed
```

Regression run:

```text
69 tests, 69 passed
```

The regression set covered Asset Final Closure, Barcode Status Foundation, Supplier Master, Supplier Receive V2, Inventory Authority, Unified Inventory UX, GBW, GBP, G3 tax precision, and idempotency-related contracts.

Typecheck:

```text
npm run typecheck
PASS — tsc --noEmit
```

The focused Barcode coverage includes format, profile prefix, item mapping, karat/serial encoding, server authority, serial UPSERT, one-active-per-Asset, global/history uniqueness, Asset relation, reprint, replacement, return retention, lookup, company/branch scope, direct edit protection, and accepted Receive replay contract.

## 26. Files Changed

Intentional files for this control:

- `tests/barcode-final-closure.test.cjs` — focused static Barcode closure test.
- `docs/DARFUS_BARCODE_FINAL_CLOSURE_REPORT.md` — this report.

No Backend/Product/Frontend runtime source file was changed. No migration was created. Existing unrelated worktree drift remains untouched, including the Owner-accepted generated `next-env.d.ts` drift.

## 27. Gate

All required Barcode authority, format, serial, concurrency, relationship, uniqueness, history, lookup, scope, permissions, browser, API health, focused test, and typecheck gates passed. Replacement/reprint mutation proof was intentionally not run because the Control requires zero new rows and prohibits mutating accepted Assets.

```text
GATE = PASS_BARCODE_FINAL_CLOSURE
BARCODE_FINAL_CLOSED = YES
```

## 28. Final Tokens

```text
CURRENT_CONTROL = DARFUS-BARCODE-FINAL-CLOSURE
LOCAL_MAIN_DB = darfus_erp
SEQUELIZE_META = 86

BARCODE_SERVER_AUTHORITY = PASS
BARCODE_FORMAT_AUTHORITY = PASS
BARCODE_SERIAL_AUTHORITY = PASS
BARCODE_CONCURRENCY_SAFETY = PASS
BARCODE_INVENTORY_PREFIX_MAPPING = PASS
BARCODE_ITEM_CODE_MAPPING = PASS
BARCODE_KARAT_ENCODING = PASS
BARCODE_SERIAL_WIDTH = PASS
BARCODE_ASSET_RELATION = PASS
ONE_ACTIVE_BARCODE_PER_ASSET = PASS
ACTIVE_BARCODE_VALUE_UNIQUENESS = PASS
BARCODE_HISTORY_PRESERVED = PASS
BARCODE_REPRINT_CONTRACT = PASS
BARCODE_REVISION_CONTRACT = NOT_IMPLEMENTED
BARCODE_REPLACEMENT_CONTRACT = PASS_SOURCE_PROVEN
BARCODE_REPLACEMENT_ATOMICITY = PASS_SOURCE_PROVEN
RETURN_BARCODE_RETENTION = PASS_SOURCE
BARCODE_LOOKUP = PASS
INVALID_BARCODE_SAFE = PASS
CROSS_COMPANY_BARCODE_ACCESS = BLOCKED
BARCODE_COMPANY_SCOPE = PASS
BARCODE_BRANCH_CONTEXT = PASS
RECEIVE_REPLAY_BARCODE_IDEMPOTENCY = PASS_REUSED_G3
DIRECT_BARCODE_EDIT = BLOCKED_OR_NOT_EXPOSED
BARCODE_DELETE_PROTECTION = PASS

ORPHAN_BARCODE_ROWS = 0
DUPLICATE_ACTIVE_BARCODE_VALUES = 0
ASSETS_WITH_MULTIPLE_ACTIVE_BARCODES = 0
ACTIVE_ASSET_BARCODE_MISMATCHES = 0
ACTIVE_INVALID_FORMAT_BARCODES = 0
ACTIVE_INVALID_ITEM_CODE_BARCODES = 0
ACTIVE_INVALID_KARAT_BARCODES = 0

AR_UI = PASS
EN_UI = PASS
NETWORK = PASS
CONSOLE = PASS
PERMISSIONS = PASS
FOCUSED_TESTS = PASS
TYPECHECK = PASS

NEW_RECEIVES = 0
NEW_ASSETS = 0
NEW_BARCODE_ROWS = 0
NEW_REPLACEMENTS = 0
NEW_JOURNALS = 0
NEW_PAYMENTS = 0
NEW_AUDIT_ROWS = 0

MIGRATION_CREATED = NO
ONLINE_PRODUCTION_CONTACTED = NO

GATE = PASS_BARCODE_FINAL_CLOSURE
BARCODE_FINAL_CLOSED = YES
RFID_FINAL_CLOSED = NO
NEXT_RECOMMENDED_STEP = RFID_FINAL_CLOSURE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

Boundaries after PASS:

```text
SUPPLIER_MASTER_FINAL_CLOSED = YES
SUPPLIER_RECEIVE_V2_FINAL_CLOSED = YES
ASSET_FINAL_CLOSED = YES
BARCODE_FINAL_CLOSED = YES
RFID_FINAL_CLOSED = NO
GBW_FINAL_CLOSED = NO
GBP_FINAL_CLOSED = NO
SUPPLIER_ACCOUNTS_FINAL_CLOSED = NO
POS_FINAL_CLOSED = NO
```

STOP. Do not begin RFID Final Closure automatically.

`NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`
