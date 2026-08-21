# DARFUS ERP — Asset Final Closure

Control ID: `DARFUS-ASSET-FINAL-CLOSURE`

## 1. Executive Summary

تم إغلاق Asset كسلطة المخزون المادي serialized. القراءة الحالية تثبت أن قوائم Inventory وتفاصيل Asset تستخدم Asset V2 فقط، وأن company/branch/location تُفرض من الخادم، وأن التاريخ والتكلفة وOrigin والحركة والBarcode محفوظة بعلاقات منفصلة ومحمية.

الـOfficial DB بقي قراءة فقط. لم يتم إنشاء Receive أو Asset أو Barcode أو Origin أو Cost Revision أو Movement أو Journal أو Payment جديد. أُضيف اختبار static مركّز خاص بـAsset Final Closure فقط؛ لم يتغير runtime business logic أو schema.

`GATE = PASS_ASSET_FINAL_CLOSURE`

## 2. Preconditions

| شرط مغلق مسبقًا | الحالة | الدليل |
|---|---|---|
| G3 local main final closure | YES / reused | `docs/DARFUS_G3_PO_TAX_PRECISION_SCHEMA_FIX_AND_FINAL_RERUN_REPORT.md` |
| Tax/VAT settings UI final closure | YES / reused | `docs/DARFUS_TAX_VAT_SETTINGS_UI_AUDIT_COMPLETION_REPORT.md` |
| Supplier Master final closure | YES / reused | `docs/DARFUS_SUPPLIER_MASTER_FINAL_RUNTIME_ACCEPTANCE_REPORT.md` |
| Supplier Receive V2 final closure | YES / reused | `docs/DARFUS_SUPPLIER_RECEIVE_V2_FINAL_CLOSURE_REPORT.md` |
| Official DB | `darfus_erp` | `SELECT current_database()` |
| Frontend / Backend | `localhost:3000` / `localhost:8000` | local health and browser checks |
| New business rows | `0` | no mutation path executed |

## 3. Asset Authority

| Authority | Result | Evidence |
|---|---|---|
| Physical serialized inventory | Asset | `inventory-v2/assets` list and detail routes |
| One physical piece | One Asset | V2 `perPiece` cardinality and six distinct PO-item Asset links |
| Product quantity for final profiles | Not authoritative | Asset list queries only `assets`; final-profile policy and tests exclude Product fallback |
| Asset identity | `Asset.id`, server-generated/immutable | Asset model plus database hard-delete/identity guards |
| History | `asset_events` plus linked `inventory_asset_movements` | detail endpoint timeline and immutable tables |
| Barcode relation | Asset-side active history relationship | `asset_barcode_history`, one-active partial unique index |

## 4. Read-Only Source Forensic

| Area | Actual source | Finding |
|---|---|---|
| Asset list | `backend/src/routes/erp.routes.js:5173` | `GET /inventory-v2/assets` requires `inventory.view`, resolves authorized branch, filters by company and branch, and queries `assets` only |
| Asset detail | `backend/src/routes/erp.routes.js:5354` | `GET /inventory-v2/assets/:id` requires `inventory.view` and requires the Asset to match server company and branch |
| List UI | `app/[locale]/(dashboard)/inventory/page.tsx` | Every row is one physical Asset; search/filter/pagination use `useInventoryV2List` |
| Detail UI | `app/[locale]/(dashboard)/inventory/[id]/page.tsx` | Shows identity, profile, status, branch, location, barcode, origin, purchase snapshot, valuation, history, movement evidence, and document links |
| Read hook | `features/inventory/hooks/use-inventory-v2.ts` | Uses only `/inventory-v2/assets` and `/inventory-v2/assets/:id` |
| Status authority | `backend/src/services/inventory-v2-runtime.service.js:10-61` | Explicit operational status registry and transition matrix |
| Transition boundary | `backend/src/services/inventory-v2-runtime.service.js:424-454` | Requires transaction, reloads the row, checks company scope, validates transition, then records event and movement |
| Location authority | `backend/src/services/inventory-location.service.js` | Location is selected by `companyId + branchId`; active/current scope is server checked |
| Metadata edit | `backend/src/services/asset-metadata.service.js` | Allowlist is descriptive only: name, description, category, brand, notes, location; `expectedUpdatedAt` protects concurrent edits |

## 5. DB Baseline

Read-only final snapshot of `darfus_erp`:

| Entity | Count |
|---|---:|
| Assets | 6 |
| Asset barcode history | 6 |
| Asset origins | 6 |
| Asset purchase cost revisions | 6 |
| Asset events | 6 |
| Inventory Asset movements | 6 |
| Legacy `stock_movements` | 0 |
| Purchase Order Items | 6 |
| PO-item Asset links | 6 |
| Purchase Orders | 6 |
| Journal Entries | 6 |
| Payments | 0 |
| Audit Logs | 44 |
| Idempotency Requests | 6 |
| SequelizeMeta | 86 |

`current_database() = darfus_erp`.

Profile distribution: `GOLD_BY_WEIGHT_JEWELLERY=3`, `GOLD_BY_PIECE=3`. All six current Assets are `operational_status=AVAILABLE` and legacy `status=available`.

The six PO items have `quantity=1` and `received_quantity=1`; the six PO-item Asset links reference six distinct Assets and six distinct PO items.

## 6. Asset Identity

PASS. The canonical receive contract requires `perPiece.length === document quantity`; a mismatch is rejected with `INVENTORY_V2_PER_PIECE_LENGTH_MISMATCH`. Receive-created V2 Assets are server-generated and the accepted source response uses `productId=null` on the Asset path.

Primary accepted evidence:

- GBP: `AST-PUR-1787094119267-1-1-sulb`, profile `GOLD_BY_PIECE`, barcode `GPRNG21000003`.
- GBW: `AST-PUR-1787083585731-1-1-plz5`, profile `GOLD_BY_WEIGHT_JEWELLERY`, barcode `GWRNG21000001`.

The later G3 evidence proves same-key replay returned the same Asset without duplication; current DB counts remain unchanged.

`ASSET_PHYSICAL_AUTHORITY = PASS`

`ONE_PIECE_ONE_ASSET = PASS`

`PRODUCT_QUANTITY_EXCLUSION = PASS`

## 7. Company / Branch Scope

PASS. Asset list filters include `a.company_id=:companyId` and `a.branch_id=:branchId`. Asset detail resolves the authorized branch and uses `where: { id, companyId: req.companyId, branchId }`. The server context is used for detail/list/history relations; a client company/body value cannot replace it.

All six current Assets belong to company `COMP-48ab554f-427e-4642-9419-bc8616c2dc36` and branch `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c`. DB anomaly query results:

- Missing company: `0`
- Missing branch where operational status requires it: `0`
- Branch orphan/missing branch row: `0`
- Company mismatch between Asset and Branch: `0`
- Event company/branch mismatch: `0`
- Movement company/target branch mismatch: `0`

`ASSET_COMPANY_SCOPE = PASS`

`ASSET_BRANCH_SCOPE = PASS`

## 8. Location Authority

PASS. All six current Assets use the DB-backed location `LOC-9a10f58e-4207-4512-8824-7a7b06159151`. The location service resolves by company and branch; Asset detail and movement rows retain location IDs. No free-text value is used as the physical location authority and no fake default is created by the Asset API.

DB results:

- Location scope anomalies: `0`
- Inactive assigned locations: `0`
- Movement target location mismatch: `0`

No location mutation was executed.

`ASSET_LOCATION_DB_AUTHORITY = PASS`

## 9. Status Model

The current operational status registry is:

`PENDING_INTEGRATION`, `AVAILABLE`, `RESERVED`, `PENDING_TRANSFER`, `WORKSHOP`, `SOLD`, `RETURNED`, `MISSING`, `MELTED`, `REVERSAL_PENDING`, `REVERSED`.

`status` is the retained legacy compatibility column. `operational_status` is the canonical runtime status and is normalized through `operationalStatusOf`. The current DB has all six Assets at `AVAILABLE` / `available`.

`IN_TRANSFER`, `RECOVERED`, and `EXCHANGED` are event-only terms, not new operational statuses. Future statuses were not added.

`ASSET_STATUS_AUTHORITY = PASS`

## 10. Asset List / Details UX

PASS, read-only browser verification.

The AR Inventory list rendered Asset rows including Asset ID, profile, barcode, weight, branch/location, supplier, and operational status. The EN Inventory list rendered the same Asset rows and identifiers. The accepted GBP detail route rendered successfully in AR and EN with no blank page or fatal runtime error.

The detail source renders:

- Asset ID and Barcode
- Profile
- Operational Status and status date/latest event
- Branch and Location
- Supplier/source trace
- Barcode, RFID relation, and tag state
- Receipt Origin
- Frozen historical purchase snapshot and current valuation separately
- Unified immutable history with Event and Movement entries
- Created date, linked documents, and legal next transitions

The detail view explicitly states that status, price, cost, barcode, weight, and karat are protected. Existing profile label constants are reused by the current UI; the EN route itself loaded successfully and preserved the `/en/` locale.

`ASSET_DETAILS_UI = PASS`

`ASSET_LIST_UI = PASS`

## 11. Origin Authority

PASS. Every current Asset has exactly one Origin row because `asset_origins.asset_id` is unique. The six receive-created records are `origin_type=PURCHASE_ORDER` and `mapping_classification=V2_RUNTIME_RECEIPT`, each linked through PO Item to a source Purchase Order and Supplier.

The origin query found zero orphan rows and zero PO/supplier/company mismatches. Historical origin values are read-only evidence and no Supplier/settings change was applied.

`ASSET_ORIGIN_AUTHORITY = PASS`

## 12. Purchase Cost Revision

PASS. Each current Asset has exactly one `is_current=true` purchase cost revision. The database partial unique index enforces one current revision per Asset; revisions have immutable update/delete guards. The detail endpoint reads `asset_purchase_cost_revisions` separately from current valuation.

DB results:

- Orphan cost revisions: `0`
- Assets without a current cost revision: `0`
- Multiple current cost revisions: `0`
- Cost company/branch/supplier mismatches: `0`

The current control did not change valuation or cost formulas. Display rounding remains a presentation concern; persisted revision values remain the authority.

`ASSET_PURCHASE_COST_REVISION_AUTHORITY = PASS`

`ASSET_HISTORY_IMMUTABILITY = PASS`

## 13. Events / Movements

The architecture has three distinct layers:

1. `asset_events` — immutable chronological lifecycle authority, with event type, source, old/new context, company/branch, and idempotency key.
2. `inventory_asset_movements` — immutable physical branch/location trail linked to an Asset Event.
3. `stock_movements` — retained legacy Product/stock table; it is not the V2 serialized Asset movement authority.

All six current Assets have a `PURCHASE_RECEIVED` event with source `PURCHASE_ORDER` and a `PURCHASE_RECEIVE` Asset movement to the same current branch/location. The accepted GBP and GBW records therefore preserve:

`Receive → Asset → Event → Movement → Branch → Location → Source PO`.

DB results:

- Orphan Asset Events/Movements: `0`
- Orphan inventory Asset movements: `0`
- Movement without a linked Event: `0`
- Event scope mismatches: `0`
- Movement scope mismatches: `0`
- Legacy `stock_movements` rows: `0`

`ASSET_MOVEMENT_EVENT_AUTHORITY = PASS`

`STOCK_MOVEMENT_LEGACY_SEPARATION = PASS`

## 14. Product Quantity Exclusion

PASS. The canonical list and search query only serialized `assets`; the source explicitly states Products never provide stock results. The final-profile policy blocks Product quantity fallback while preserving unrelated legacy Product compatibility. All six current PO Item Asset links have `product_id` null.

`PRODUCT_QUANTITY_EXCLUSION = PASS`

## 15. Barcode Relationship

PASS for Asset-side relationship only. Barcode format, numbering, replacement lifecycle, and Barcode Final Closure were not changed.

The schema enforces one active barcode row per Asset with a partial unique index, and barcode history is linked to the Asset with a foreign key. Current DB results:

- Assets without an active Barcode History row: `0`
- Active Asset barcode/Asset value mismatch: `0`
- Duplicate active Barcode groups: `0`
- Duplicate Asset barcode groups: `0`
- Orphan barcode rows: `0`

`ASSET_BARCODE_RELATION = PASS`

`DUPLICATE_ACTIVE_BARCODE_ANOMALIES = 0`

`BARCODE_FINAL_CLOSED = NO` because Barcode Final Closure is a later control.

## 16. PO / Supplier Trace

PASS. The current trace is:

`Purchase Order → Purchase Order Item → PO Item Asset Link → Asset → Asset Origin → Supplier`

All six links are unique by Asset and by PO-item ordinal. Current source queries and DB checks found zero PO Item/Asset/Supplier/company mismatches. The accepted GBP Asset traces to `PO-1787094119240`, Supplier `SUP-001`, and the accepted GBW Asset traces to `PO-1787083585606`, Supplier `SUP-001`.

Later Supplier deactivation/reactivation did not delete historical Asset/Supplier relationships; the current historical rows remain readable.

`ASSET_PO_SUPPLIER_TRACE = PASS`

## 17. Delete / Edit Policy

PASS. Database triggers include `assets_hard_delete_forbidden_trg` and `assets_barcode_immutable_trg`; event, movement, origin, and cost-evidence tables have immutable guards. No Asset V2 hard-delete route is exposed.

The only current Asset metadata edit route is `PATCH /inventory-v2/assets/:id/metadata`, permission-gated by `inventory.adjust`, branch/company-scoped, idempotent, and restricted to descriptive fields. It requires `expectedUpdatedAt`. Asset ID, company, branch, source PO, origin, barcode, historical cost, weights, karat, and operational status are not in the allowlist.

`ASSET_DELETE_PROTECTION = PASS`

## 18. Idempotency

PASS by current source and accepted G3 evidence. Receive V2 claims idempotency within the business transaction; same-key replay returns the same accepted Asset and does not duplicate Asset/Event/Movement rows. A changed request with the same key is rejected as a conflict and does not mutate the Asset.

The current DB has 6 retained idempotency rows, unchanged by this Control.

`ASSET_IDEMPOTENCY = PASS`

## 19. Existing Asset Evidence

| Profile | Asset | Barcode | Status | Source |
|---|---|---|---|---|
| GBW | `AST-PUR-1787083585731-1-1-plz5` | `GWRNG21000001` | `AVAILABLE` | `PO-1787083585606` / `SUP-001` |
| GBP | `AST-PUR-1787094119267-1-1-sulb` | `GPRNG21000003` | `AVAILABLE` | `PO-1787094119240` / `SUP-001` |

For both records, read-only DB evidence showed company, branch, location, barcode, Origin, current Cost Revision, Event, Asset Movement, PO link, and Supplier trace. The GBP record is the latest clean accepted G3 record and remains the primary precision-compatible evidence.

## 20. Integrity / Orphan Queries

| Check | Result |
|---|---:|
| Orphan Asset Barcode rows | 0 |
| Orphan Asset Origin rows | 0 |
| Orphan Asset Cost Revision rows | 0 |
| Orphan Asset Movement rows | 0 |
| Orphan Asset Event links | 0 |
| Duplicate active Barcodes | 0 |
| Multiple current Cost Revisions | 0 |
| Missing Asset company | 0 |
| Missing required Asset branch | 0 |
| Invalid Location scope | 0 |
| Company mismatch | 0 |
| Branch mismatch | 0 |
| Product authority conflict | 0 |

No P1 anomaly was found. No repair, cleanup, delete, backfill, or mutation was attempted.

## 21. Permissions / Audit

`GET /inventory-v2/assets` and `GET /inventory-v2/assets/:id` require `inventory.view`. Metadata changes require `inventory.adjust`; status transitions use canonical permission-gated workflows and the server transition authority. Asset detail routes do not expose a direct status overwrite control.

`NEW_AUDIT_ROWS = 0`. No mutating browser action or API mutation was executed in this Control.

`PERMISSIONS = PASS`

## 22. Browser AR/EN

Read-only browser results:

| Route | AR | EN | Result |
|---|---|---|---|
| Inventory list | PASS | PASS | Asset rows rendered with IDs, barcodes, branch/location, supplier, and status |
| Accepted GBP Asset detail | PASS | PASS | identity, profile/status, trace, cost, origin, and history rendered |
| Invalid Asset detail | PASS | PASS | safe error state; no fatal page error |

The AR detail showed `AST-PUR-1787094119267-1-1-sulb`, `GPRNG21000003`, `GOLD_BY_PIECE`, `Branch-1`, `QA-G2C-RECEIVE-LOCATION-01`, purchase cost, origin, and unified history. The EN list/detail routes also loaded the accepted rows and had no fatal runtime error.

`AR_UI = PASS`

`EN_UI = PASS`

## 23. API / Network / Console

Actual read endpoints exercised by the authenticated Inventory UI are:

- `GET /api/v1/inventory-v2/assets`
- `GET /api/v1/inventory-v2/assets/:id`
- `GET /api/v1/health`
- `GET /api/v1/health/db`
- `GET /api/v1/health/redis`
- `GET /api/v1/health/gold`

The Asset list/detail responses rendered the expected rows and detail fields. Invalid Asset ID returned the safe UI error state without a fatal error. Health results were HTTP 200: backend UP, PostgreSQL connected, Redis connected, and Gold health healthy/fresh.

Console error count was zero for the inspected AR/EN list/detail and invalid-ID journeys. The browser developer surface does not export raw request records separately in this run; endpoint success is evidenced by authenticated UI data rendering, source route contracts, and health responses.

`NETWORK = PASS`

`CONSOLE = PASS`

## 24. Focused Tests

| Suite | Result |
|---|---:|
| Asset-specific closure test | 9/9 PASS |
| Combined Asset/Supplier/GBW/GBP/authority/Barcode/G3 focused suite | 58/58 PASS |
| G2A1–G2D tax/location/readiness suite from `backend` | 29/29 PASS |
| `npm run typecheck` | PASS |

The new test is `tests/asset-final-closure.test.cjs` and covers Asset physical authority, one-piece cardinality, Product exclusion, company/branch/location authority, status transitions, origin/cost/movement preservation, barcode cardinality, delete protection, idempotency, and legacy compatibility.

`FOCUSED_TESTS = PASS`

`TYPECHECK = PASS`

## 25. Files Changed

Intentional files changed in this Control:

- `tests/asset-final-closure.test.cjs` — new focused static Asset closure test.
- `docs/DARFUS_ASSET_FINAL_CLOSURE_REPORT.md` — this report.

No runtime source, model, migration, configuration, Product, Barcode format, RFID, POS, Tax, Payment, Journal, or DB file was changed. The worktree contains broad pre-existing drift. `next-env.d.ts` is still the Owner-accepted generated drift and was not edited, reverted, or rebuilt.

## 26. Gate

All Asset Final Closure PASS criteria are satisfied by current source, read-only DB anomaly checks, authenticated AR/EN browser evidence, accepted G3 idempotency evidence, and focused tests. No new business rows were created and no P0/P1 Asset defect was found.

`GATE = PASS_ASSET_FINAL_CLOSURE`

`ASSET_FINAL_CLOSED = YES`

## 27. Final Tokens

```text
CURRENT_CONTROL = DARFUS-ASSET-FINAL-CLOSURE
LOCAL_MAIN_DB = darfus_erp
SEQUELIZE_META = 86

ASSET_PHYSICAL_AUTHORITY = PASS
ONE_PIECE_ONE_ASSET = PASS
PRODUCT_QUANTITY_EXCLUSION = PASS
ASSET_COMPANY_SCOPE = PASS
ASSET_BRANCH_SCOPE = PASS
ASSET_LOCATION_DB_AUTHORITY = PASS
ASSET_STATUS_AUTHORITY = PASS
ARBITRARY_STATUS_OVERWRITE = BLOCKED
ASSET_DETAILS_UI = PASS
ASSET_LIST_UI = PASS
ASSET_ORIGIN_AUTHORITY = PASS
ASSET_PURCHASE_COST_REVISION_AUTHORITY = PASS
ASSET_HISTORY_IMMUTABILITY = PASS
ASSET_MOVEMENT_EVENT_AUTHORITY = PASS
STOCK_MOVEMENT_LEGACY_SEPARATION = PASS
ASSET_BARCODE_RELATION = PASS
DUPLICATE_ACTIVE_BARCODE_ANOMALIES = 0
ASSET_PO_SUPPLIER_TRACE = PASS
ASSET_DELETE_PROTECTION = PASS
ASSET_IDEMPOTENCY = PASS
ORPHAN_ASSET_BARCODE_ROWS = 0
ORPHAN_ASSET_ORIGIN_ROWS = 0
ORPHAN_ASSET_COST_ROWS = 0
ORPHAN_ASSET_MOVEMENT_ROWS = 0
COMPANY_MISMATCH_ANOMALIES = 0
BRANCH_MISMATCH_ANOMALIES = 0
LOCATION_SCOPE_ANOMALIES = 0
MULTIPLE_CURRENT_COST_REVISION_ANOMALIES = 0
AR_UI = PASS
EN_UI = PASS
NETWORK = PASS
CONSOLE = PASS
PERMISSIONS = PASS
FOCUSED_TESTS = PASS
TYPECHECK = PASS

NEW_RECEIVES = 0
NEW_ASSETS = 0
NEW_BARCODES = 0
NEW_ORIGINS = 0
NEW_COST_REVISIONS = 0
NEW_MOVEMENTS = 0
NEW_JOURNALS = 0
NEW_PAYMENTS = 0
NEW_AUDIT_ROWS = 0

MIGRATION_CREATED = NO
ONLINE_PRODUCTION_CONTACTED = NO

GATE = PASS_ASSET_FINAL_CLOSURE
ASSET_FINAL_CLOSED = YES
BARCODE_FINAL_CLOSED = NO
NEXT_RECOMMENDED_STEP = BARCODE_FINAL_CLOSURE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

Boundaries after PASS:

```text
SUPPLIER_MASTER_FINAL_CLOSED = YES
SUPPLIER_RECEIVE_V2_FINAL_CLOSED = YES
ASSET_FINAL_CLOSED = YES
BARCODE_FINAL_CLOSED = NO
RFID_FINAL_CLOSED = NO
GBW_FINAL_CLOSED = NO
GBP_FINAL_CLOSED = NO
SUPPLIER_ACCOUNTS_FINAL_CLOSED = NO
POS_FINAL_CLOSED = NO
```

STOP. Do not begin Barcode Final Closure automatically.

`NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`
