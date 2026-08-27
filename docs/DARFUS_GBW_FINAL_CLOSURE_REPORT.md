# DARFUS ERP — Gold By Weight Final Closure

Control: `DARFUS-GBW-FINAL-CLOSURE`  
Date: `2026-08-19`  
Mode: existing accepted evidence reuse + focused verification; no new GBW receive

## 1 Executive Summary

تم إغلاق GBW بنجاح على المسار الحالي مع إعادة استخدام سجل الاستلام المقبول، دون إنشاء Receive أو Asset أو Barcode أو Journal جديد. تم اكتشاف Gap حقيقي في حالة `stoneWeight = grossWeight`، وتم إصلاحه بأقل تعديل آمن في نقطتي التحقق المشتركة، ثم اجتازت الاختبارات المركزة و`typecheck`.

النتيجة التشغيلية الحالية:

- Official DB confirmed as `darfus_erp`; all queries were read-only.
- GBW UI loads in Arabic and English from the canonical Inventory route.
- Gold Center is healthy and fresh at `GOLDAPI_IO / LIVE_PROVIDER / AED`.
- Existing GBW records have Asset, unique Barcode, Purchase Origin, Cost Revision, Current Valuation, Movement, Tax Snapshot, Payable/Journal linkage, and successful idempotency records.
- No new receive was necessary; the latest accepted GBW evidence remains reusable.
- Retail/POS selling is intentionally bounded and deferred to POS final integration; no sale was executed.

## 2 Preconditions

| Precondition | Actual | Evidence | State |
|---|---|---|---|
| Supplier Master final closure | Closed precondition | Existing closure evidence; current contract returns DB suppliers | PASS |
| Supplier Receive V2 final closure | Closed precondition | Canonical `/purchase-orders/receive`, V2 piece guard and current accepted records | PASS |
| Asset final closure | Closed precondition | Current GBW Assets and Asset detail evidence | PASS |
| Barcode final closure | Closed precondition | `asset_barcode_history`, unique current barcodes, current accepted search evidence | PASS |
| RFID final closure | Closed precondition | Existing controlled RFID closure; no RFID mutation in this batch | PASS |
| Official database | `darfus_erp` | `SELECT current_database()` returned `darfus_erp` | PASS |
| New controlled GBW receive | Not required | Accepted GBW evidence and current DB reconciliation were sufficient | 0 |
| Online production contact | None | Local `localhost:3000`, `localhost:8000`, local PostgreSQL only | PASS |

## 3 GBW Reference Lock

| Authority | Current implementation | Verification |
|---|---|---|
| `NET_WEIGHT = GROSS_WEIGHT - STONE_WEIGHT` | Server-side Decimal calculation | `gold-by-weight-profile.service.js:normalizeInput`; focused tests |
| `PURE_GOLD_WEIGHT = NET_WEIGHT * KARAT / 24` | Server-side Decimal calculation | `gold-by-weight-profile.service.js:normalizeInput`; formula regression tests |
| `TOTAL_MAKING_COST = MAKING_PER_GRAM * NET_WEIGHT` | Server valuation service | `gold-valuation.service.js`; financial formula tests |
| Supported karats | 9, 10, 12, 14, 18, 21, 22, 24; Jewellery excludes 24 and Bar requires 24 | GBW service constants and focused tests |
| Physical authority | One physical piece = one Asset | V2 receive path and current PO item/Asset links |
| Product quantity | Not physical authority | Final-profile server guard and no GBW Product links |
| Barcode | Server-generated Asset identity | Current barcodes and barcode history |
| RFID | Optional secondary identity | Existing RFID closure; current GBW RFID values are empty and no new assignment occurred |
| Receive workflow | Inventory → Add/Receive → GBW → Supplier V2 | AR/EN route and UI contract |
| Payment fields | Not part of GBW receive UI | Browser DOM has no Payment field; payable is posted through PO/accounting |

Reference lock: `PASS`.

## 4 Source Forensic

Relevant authorities are present in the current worktree:

- `backend/src/services/gold-by-weight-profile.service.js`: GBW profile normalization and calculation.
- `backend/src/services/inventory-master-policy.service.js`: shared V2 weight and quantity-authority policy.
- `backend/src/routes/gold-by-weight-profile.routes.js`: authenticated GBW contract and read-only preview routes.
- `backend/src/routes/erp.routes.js`: canonical receive, final-profile V2 guard, transaction, PO, Asset, cost, movement, accounting, and idempotency orchestration.
- `backend/src/services/inventory-v2-runtime.service.js`: per-piece normalization and evidence persistence.
- `app/[locale]/(dashboard)/inventory/gold-by-weight/page.tsx`: unified GBW UI caller.
- `components/inventory/shared-receive-section.tsx`: shared supplier/location/date/tax/RCM section.

The prior worktree is materially dirty from earlier owner-approved phases. This batch did not clean, reset, stash, restore, or take ownership of unrelated drift. `next-env.d.ts` remains the owner-accepted generated Next.js drift and was not edited.

## 5 Master Data

Read-only counts from `darfus_erp`:

| Entity | Count | Actual use in GBW |
|---|---:|---|
| Active suppliers | 2 | Contract returns DB-backed suppliers |
| Active inventory locations | 1 | Contract returns the current branch-scoped location |
| Active GBW-related profile master rows | 23 | Item descriptions/colors are server-backed |
| Enabled Gold Market settings | 1 | Live provider configuration |
| Gold Market quotes (`GOLDAPI_IO`, AED) | 90 | Historical/current quote evidence |
| Products | 0 | Consistent with serialized GBW authority |

No master data was inserted or changed in this batch.

## 6 Weight / Karat Validation

The initially observed boundary defect was that `stoneWeight > grossWeight` was rejected but equality was accepted. The following minimum safe checks are now enforced:

- gross weight must be positive;
- stone weight must be non-negative;
- stone weight must not exceed gross weight;
- net weight must be positive;
- karat must be in the server-supported set;
- Jewellery 24K is separated from the Bar strategy;
- making per gram must be non-negative when required;
- Product/quantity fields are rejected as physical authority.

Current GBW database records:

| Asset | Profile | Gross | Net | Karat | Status | Barcode |
|---|---|---:|---:|---:|---|---|
| `AST-PUR-1787083585731-1-1-plz5` | `GOLD_BY_WEIGHT_JEWELLERY` | 5 | 5 | 21 | AVAILABLE | `GWRNG21000001` |
| `AST-PUR-1787085524749-1-1-dww3` | `GOLD_BY_WEIGHT_JEWELLERY` | 5 | 5 | 21 | AVAILABLE | `GWRNG21000002` |
| `AST-PUR-1787087436118-1-1-1v4x` | `GOLD_BY_WEIGHT_JEWELLERY` | 6 | 6 | 21 | AVAILABLE | `GWPND21000001` |

The accepted records use zero stone weight, so persisted net equals gross. No current record has a negative or impossible weight.

## 7 Formula / Precision Authority

GBW calculations use `decimal.js` and server rounding to 8 decimal places with half-up rounding. The focused and existing formula suites prove:

```text
10.000 - 2.000 = 8.00000000 net
8.00000000 × 21 / 24 = 7.00000000 pure gold
8.00000000 × 5.00000000 = 40.00000000 making
```

The persisted cost model separates precision layers intentionally:

- Asset/cost revision values retain higher precision;
- PO/tax snapshot values use the configured accounting/tax rounding scale;
- the GBW accepted example has cost revision total `2484.32751693`, while the PO/tax snapshot is `2484.33` at its two-decimal tax/accounting scale;
- the journal is balanced at cent precision.

The missing `net > 0` guard was corrected in:

- `backend/src/services/gold-by-weight-profile.service.js`;
- `backend/src/services/inventory-master-policy.service.js`.

No formula was changed.

## 8 Gold Center / Historical Rate

Read-only API evidence:

```text
GET /api/v1/health/gold → 200
healthStatus = HEALTHY
provider = GOLDAPI_IO
mode = LIVE_PROVIDER
currency = AED
unit = PER_GRAM
fresh = true
stale = false
isMockFallback = false
```

Current DB setting:

```text
refresh_interval_seconds = 1500
stale_after_seconds = 2500
enabled = true
```

The source provider path is `https://www.goldapi.io/api/XAU/{currency}` with a server-managed API key environment variable. The key value was not printed. The adapter validates provider metal/currency/schema and classifies authentication, rate-limit, network, timeout, and malformed-response failures.

The accepted GBW Asset `GWRNG21000002` retains the historical purchase rate `448.20524132`, gold value `2241.02620660`, making `125.00000000`, and historical VAT/cost evidence. Current Gold Center refresh does not rewrite that purchase snapshot.

## 9 Shared Receive Contract

The canonical GBW form uses `SharedReceiveSection` for:

- Supplier from DB;
- branch-scoped Location from DB;
- Purchase Date;
- Tax Treatment from company policy;
- server-derived Tax Summary;
- optional Notes;
- RCM evidence only when Reverse Charge is selected.

The form does not provide payment fields. Supplier-page receive creation is not authoritative; the Supplier page remains a read/management surface and redirects to Inventory for the canonical workflow.

## 10 GBW Profile UI

The GBW page exposes the server-backed profile/strategy, description, barcode item code, karat, gold color, weights, purchase rate, making, current valuation, sale-preview boundary, Asset/Barcode/RFID display, status/branch display, and audit/system display.

Net and pure-gold values are read-only. Branch and operational status are server-owned. The UI explicitly states that Product quantity is not an authority.

## 11 Preview

The preview route is authenticated and read-only:

```text
GET  /api/v1/inventory-v2/gold-by-weight/contract
POST /api/v1/inventory-v2/gold-by-weight/preview
POST /api/v1/inventory-v2/receive-preview
```

The current browser contract loaded successfully and the previously accepted GBW preview/receive evidence proves server-derived net, pure, making, gold value, VAT, and total purchase cost. The browser was not used to submit a new receive in this closure.

## 12 Existing Evidence Reuse

`CAN_REUSE_CURRENT_GBW_ACCEPTANCE_EVIDENCE = YES`.

The clean accepted GBW record `AST-PUR-1787085524749-1-1-dww3` remains present and unchanged in the current official database. Its chain is:

```text
Supplier → PO PO-1787085524743 → PO Item POI-1787085524777-1-1
→ Asset AST-PUR-1787085524749-1-1-dww3
→ Barcode GWRNG21000002
→ Purchase Origin
→ Cost Revision
→ PURCHASE_RECEIVE movement
→ Tax Snapshot / Payable / Journal
```

No duplicate synthetic business row was created.

## 13 Optional Controlled Receive

`NEW_CONTROLLED_GBW_RECEIVE_REQUIRED = NO`  
`NEW_GBW_RECEIVES = 0`

The existing evidence was sufficient for the final gate. No new Supplier, PO, Asset, Barcode, RFID assignment, Journal, payment, or idempotency result was created.

## 14 Tax / PO Reconciliation

The accepted GBW PO uses the actual persisted company policy and immutable snapshot:

```text
taxTreatment = STANDARD_VAT
vatRate = 5
taxBase = 2366.03
inputVatAmount = 118.30
isRcm = false
PO total = 2484.33
taxSnapshot.roundingScale = 2
```

The tax snapshot records policy/version/jurisdiction, VAT registration snapshot, enabled treatments, and RCM eligibility state. The source and tests confirm that the client does not author VAT as a business authority; the server resolves and persists the snapshot.

## 15 Asset / Barcode / RFID Boundary

Read-only GBW integrity results:

| Check | Result |
|---|---:|
| GBW Assets | 3 |
| Missing barcode | 0 |
| Duplicate current GBW barcodes | 0 |
| Invalid karat | 0 |
| Non-positive gross weight | 0 |
| Missing Origin | 0 |
| Missing current valuation | 0 |
| Missing current purchase cost revision | 0 |
| GBW PO items linked to Product | 0 |
| GBW Product stock movements | 0 |
| New RFID assignments this batch | 0 |

Current barcodes are server-generated Asset identity. Existing RFID history remains historical evidence; current GBW RFID fields are empty and optional.

## 16 Origin / Cost Revision / Movement

All three GBW Assets have:

- `asset_origins.origin_type = PURCHASE_ORDER`;
- one PO item identity;
- one current `asset_purchase_cost_revisions` row;
- supplier and purchase date evidence;
- one `inventory_asset_movements` row with `movement_type = PURCHASE_RECEIVE` and `source_type = PURCHASE_ORDER`.

The PO item, Asset, cost revision, origin, and movement source identities reconcile one-to-one for the current GBW records.

## 17 Historical vs Current Valuation

The historical purchase revision and current valuation are separate authorities. The accepted Asset has current valuation data and an immutable purchase revision. No live Gold Center refresh was allowed to rewrite the historical acquisition snapshot.

## 18 Retail / Selling Price Boundary

The source exposes a read-only GBW sale-preview service using current Gold Center pricing and net weight. No sale or payment was executed in this closure.

Current DB evidence is mixed because it includes earlier accepted records: two GBW Assets have persisted retail prices (`3279`, `4314`) and one older accepted row has `price = 0`. This is not an acquisition/accounting defect; it is a deferred retail/POS boundary and is recorded as a non-blocking follow-up. No selling rule was invented or changed.

`GBW_RETAIL_PRICING_BOUNDARY = ACCEPTED_NOT_IMPLEMENTED`.

## 19 Supplier Payable / Journal

Supplier payable is represented by the received PO/accounting authority, not by a payment field in the GBW form. Current read-only reconciliation shows:

- 3 GBW-linked received POs;
- 3 GBW-linked journal entries;
- all GBW-linked journal entries balanced (`unbalanced_gbw_journals = 0`);
- current `payments` table count is 0;
- `PAYMENT_RECORD_DELTA = 0` for this batch.

No accounting mapping or journal logic was changed.

## 20 Idempotency

The three GBW-linked PO receives have `purchase.receive` idempotency rows with status `succeeded` and HTTP status `201`. Existing accepted evidence covers same-key replay and conflicting-key behavior. This batch did not replay or create another receive.

The receive route claims idempotency only after Supplier, Branch, and DB Location validation and performs PO/Asset/evidence/accounting work inside the transaction. The final-profile guard rejects legacy Product/quantity receive before that transaction path is allowed to create business records.

## 21 Company / Branch / Location

For all three GBW records, read-only joins prove:

- Asset company equals PO company;
- Asset supplier equals PO supplier;
- Asset branch exists and is the same branch allowed by the location;
- location company and branch match the Asset context;
- UI displays the current server branch context and receives DB-backed locations.

Company, branch, and location scope: `PASS`.

## 22 POS Readiness Boundary

Asset/barcode search evidence exists for the current Asset inventory path, and the source preserves Asset identity and operational status. A sale was intentionally not executed in this closure.

`GBW_POS_READINESS = ACCEPTED_DEFERRED_BOUNDARY`.

Final POS sale/checkout acceptance remains a separate scope and does not reopen GBW acquisition closure.

## 23 Integrity Queries

The read-only integrity run found:

- 0 missing or duplicate GBW current barcodes;
- 0 invalid karats;
- 0 invalid gross weights;
- 0 missing origin/current valuation/current cost revision;
- 0 Product-linked GBW PO items;
- 0 Product stock movements for GBW;
- 0 unbalanced GBW journals;
- 0 company/branch/location mismatches.

Pure gold is a server-derived calculation rather than a dedicated Asset column in the current schema; it is verified through the server formula and accepted preview/cost evidence, not inferred from a missing column.

`GBW_INTEGRITY_ANOMALIES_P1 = 0`.

## 24 Browser AR/EN

### Arabic

`http://localhost:3000/ar/inventory/gold-by-weight` loaded successfully.

Observed:

- `Gold Center متاح`;
- `GOLDAPI_IO · AED`;
- current quote timestamp;
- DB Supplier selector;
- DB Location selector scoped to the current branch;
- policy Tax Treatment selector;
- server Tax Summary section;
- GBW profile fields and read-only net/pure fields;
- no Payment field;
- no fatal UI error;
- no console errors/warnings relevant to the page.

### English

`http://localhost:3000/en/inventory/gold-by-weight` loaded successfully with the equivalent English labels and the same server-backed values. No console errors were observed.

## 25 API / Network / Console

Read-only health evidence:

| Endpoint | Status | Result |
|---|---:|---|
| `/api/v1/health` | 200 | UP |
| `/api/v1/health/db` | 200 | PostgreSQL connected |
| `/api/v1/health/redis` | 200 | Redis connected |
| `/api/v1/health/gold` | 200 | HEALTHY, live GOLDAPI_IO/AED |
| `/api/v1/inventory-v2/gold-by-weight/contract` | 200 | Authenticated contract loaded in browser |

Backend logs show successful authenticated GBW contract requests with HTTP 200 and a successful Gold Market refresh job. Browser console errors for AR/EN were empty.

## 26 Focused Tests

Command executed:

```text
node --test tests/gbw-final-closure.test.cjs \
  backend/tests/gold-by-weight-profile-02.test.cjs \
  backend/tests/gold-by-weight-financial-formula-01b.test.cjs \
  backend/tests/gold-health-canonical.test.cjs \
  tests/gold-by-weight-sidebar-navigation-02-r2.test.cjs \
  backend/tests/supplier-receive-profile-switch-async-preview-race-ux-fix-03.test.cjs
```

Result: `28 passed, 0 failed`.

The focused closure test covers frozen formulas, supported karats, positive net-weight boundary, Product/quantity rejection, final-profile legacy receive rejection, canonical receive/tax/Asset/Barcode authorities, Gold Center provider boundary, unified intake, and no dedicated sidebar entry.

Typecheck:

```text
npm run typecheck → PASS
```

No build was run. No migration was created or executed.

## 27 Files Changed

Intentional changes in this batch:

1. `backend/src/services/gold-by-weight-profile.service.js` — reject non-positive net weight.
2. `backend/src/services/inventory-master-policy.service.js` — reject non-positive V2 gold net weight.
3. `tests/gbw-final-closure.test.cjs` — focused GBW closure tests.
4. `docs/DARFUS_GBW_FINAL_CLOSURE_REPORT.md` — this report.

The two source paths were already dirty/untracked or modified before this batch; only the net-weight guard hunks described above were touched during this batch. Pre-existing worktree changes, including the owner-accepted `next-env.d.ts` generated drift, were not reverted or edited.

## 28 Gate

### Strengths

- Server-authoritative Decimal formulas and validation.
- Final-profile V2 guard is fail-closed before business-record creation.
- Asset/Barcode/Origin/Cost/Movement/Journal chain is present and reconciled.
- Gold Center provider is live, configured, and non-mock.
- Historical purchase snapshots are separated from current valuation.
- Unified Intake is the only accepted GBW creation UI.
- Official DB was not mutated in this batch.

### Deferred non-blocking boundary

`GBW-RETAIL-001`: one historical accepted GBW row has no persisted retail price, and POS sale acceptance is intentionally deferred to POS final integration. This does not block GBW supplier acquisition, valuation, tax, payable, journal, or inventory-authority closure.

### Gate result

`PASS_GOLD_BY_WEIGHT_FINAL_CLOSURE`

`GBW_FINAL_CLOSED = YES`

## 29 Final Tokens

```text
CURRENT_CONTROL = DARFUS-GBW-FINAL-CLOSURE
LOCAL_MAIN_DB = darfus_erp
SEQUELIZE_META = 86
CAN_REUSE_CURRENT_GBW_ACCEPTANCE_EVIDENCE = YES
NEW_CONTROLLED_GBW_RECEIVE_REQUIRED = NO
NEW_GBW_RECEIVES = 0
GBW_REFERENCE_LOCK = PASS
GBW_SERVER_FORMULA_AUTHORITY = PASS
GBW_NET_FORMULA = PASS
GBW_PURE_FORMULA = PASS
GBW_MAKING_FORMULA = PASS
GBW_SUPPORTED_KARATS = PASS
GBW_WEIGHT_VALIDATION = PASS
GBW_PRECISION = PASS
GBW_GOLD_CENTER_AUTHORITY = PASS
GBW_HISTORICAL_RATE_SNAPSHOT = PASS
GBW_SHARED_RECEIVE_CONTRACT = PASS
GBW_PROFILE_FIELDS = PASS
GBW_PREVIEW = PASS
GBW_TAX_AUTHORITY = PASS
GBW_PO_TAX_RECONCILIATION = PASS
GBW_ONE_PIECE_ONE_ASSET = PASS
GBW_PRODUCT_QUANTITY_EXCLUSION = PASS
GBW_ASSET_EVIDENCE = PASS
GBW_BARCODE_EVIDENCE = PASS
GBW_RFID_BOUNDARY = PASS
GBW_ORIGIN = PASS
GBW_PURCHASE_COST_REVISION = PASS
GBW_MOVEMENT = PASS
GBW_HISTORICAL_CURRENT_COST_SEPARATION = PASS
GBW_RETAIL_PRICING_BOUNDARY = ACCEPTED_NOT_IMPLEMENTED
GBW_SUPPLIER_PAYABLE = PASS
GBW_JOURNAL_BALANCE = PASS
PAYMENT_RECORD_DELTA = 0
GBW_IDEMPOTENCY_REPLAY = PASS
GBW_IDEMPOTENCY_CONFLICT = PASS
GBW_COMPANY_SCOPE = PASS
GBW_BRANCH_SCOPE = PASS
GBW_LOCATION_SCOPE = PASS
GBW_POS_READINESS = ACCEPTED_DEFERRED_BOUNDARY
GBW_INTEGRITY_ANOMALIES_P1 = 0
AR_UI = PASS
EN_UI = PASS
NETWORK = PASS
CONSOLE = PASS
PERMISSIONS = PASS
FOCUSED_TESTS = PASS
TYPECHECK = PASS
NEW_ASSETS = 0
NEW_BARCODES = 0
NEW_RFID_ASSIGNMENTS = 0
NEW_JOURNALS = 0
NEW_PAYMENTS = 0
MIGRATION_CREATED = NO
ONLINE_PRODUCTION_CONTACTED = NO
GATE = PASS_GOLD_BY_WEIGHT_FINAL_CLOSURE
GBW_FINAL_CLOSED = YES
GBP_FINAL_CLOSED = NO
NEXT_RECOMMENDED_STEP = GOLD_BY_PIECE_FINAL_CLOSURE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

No further GBW receive, POS sale, payment, migration, or production action was started.
