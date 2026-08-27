# DARFUS ERP — Gold By Piece Final Closure

Control ID: `DARFUS-GBP-FINAL-CLOSURE`  
Date: `2026-08-19`  
Mode: existing accepted evidence reuse + current read-only verification  
Official DB: `darfus_erp`

## 1 Executive Summary

أُغلق فحص Gold By Piece الحالي على المسار القانوني الموحد دون إنشاء Receive أو Sale جديد. تم إثبات أن السجل المقبول الحالي موجود في `darfus_erp`، وأن مصدر GBP، Gold Center، Tax Snapshot، PO precision، Asset/Barcode/Origin/Cost/Movement، Supplier Payable، Journal، Idempotency، الواجهتين العربية والإنجليزية، والاختبارات المركزة متوافقة مع بوابة الإغلاق.

النتيجة: `PASS_GOLD_BY_PIECE_FINAL_CLOSURE`.

تم فصل سجلين تاريخيين أقدم يحتويان على مشاكل precision/Journal قديمة؛ لم يتم تعديلهما أو استخدامهما كدليل قبول للحالة الحالية. يوجد حد POS مقبول مؤجل: لم تُنفذ عملية بيع، والقبول هنا يثبت أن البيع غير الآمن بسعر صفر يُرفض عند canonical sale boundary، لا أن POS النهائي أُغلق.

## 2 Preconditions

| Check | Result | Evidence |
|---|---|---|
| GBW precondition | PASS | `docs/DARFUS_GBW_FINAL_CLOSURE_REPORT.md`, gate passed |
| Supplier Receive V2 | PASS | canonical receive route and 01A/G3 focused tests |
| Asset authority | PASS | current GBP assets are serialized Assets; Product is not physical authority |
| Barcode | PASS | active unique Asset barcode history rows; current GBP format `GP + item + karat + serial` |
| RFID | PASS / optional | RFID remains optional Asset-linked identity; no mutation required |
| Tax / PO precision | PASS | live `purchase_orders.tax_base` and `input_vat_amount` are `numeric(20,8)` |
| No new mutation required | PASS | existing clean GBP evidence is present and unchanged |

## 3 GBP Reference Lock

The previously approved Gold By Piece reference lock remains the business authority. Current source and runtime were checked against it; GBW formulas were not copied as GBP business authority.

| Requirement | Current authority | Result |
|---|---|---|
| Profile identity | `GOLD_BY_PIECE` | PASS |
| Purchase basis | `GOLD_CENTER_GLOBAL_SPOT`, selected karat | PASS |
| Supported karats | `9, 10, 12, 14, 18, 21, 22, 24` | PASS |
| Historical purchase snapshot | `asset_purchase_cost_revisions` and PO tax snapshot | PASS |
| Current valuation | `asset_current_valuations` from current Gold Center calculation | PASS |
| Physical identity | one piece = one Asset = one active Barcode | PASS |
| Supplier intake | canonical Supplier V2 through Inventory | PASS |
| Retail | server-side GBP markup/discount authority; Retail rate mode is fail-closed when unconfigured | PASS / accepted boundary |
| Payment fields | not part of the GBP receive form | PASS |

## 4 Source Forensic

| File / function | Evidence |
|---|---|
| `backend/src/services/gold-by-piece-profile.service.js` | GBP profile, supported karats, Decimal precision, global rate resolution, weights, purchase/current economics |
| `backend/src/routes/gold-by-piece-profile.routes.js` | authenticated GBP contract, read-only preview and sale-preview, server-backed masters, Gold Center and authority declaration |
| `app/[locale]/(dashboard)/inventory/gold-by-piece/page.tsx` | one GBP form, shared receive section, profile preview, shared tax preview, canonical Supplier V2 receive payload |
| `backend/src/services/gold-sale-pricing.service.js` | server-side GBP current-cost/markup/discount/VAT pricing algebra |
| `backend/src/routes/erp.routes.js` | canonical sale Asset resolution, final-profile Product guard, positive sale amount guard |
| `components/inventory/inventory-intake-chooser.tsx` | GBP enabled in unified chooser; Diamond, Gem Stone and Pearl remain disabled |

No source, migration, configuration, or business-rule edit was made by this control.

## 5 Master Data

| Master | Actual | State |
|---|---|---|
| Company | `Gold ERP` | READY |
| Branch | `Branch-1`, active | READY |
| Supplier | 2 active DB suppliers, including `SUP-001` | READY |
| Location | 1 active branch-scoped location; 1 historical inactive location | READY |
| GBP item descriptions/colors | server-backed master selectors visible in AR/EN | READY |
| Karats | 8 supported values from server contract | READY |
| Barcode item codes | server-backed approved codes, including `RNG` | READY |
| VAT policy | server-backed `STANDARD_VAT`, `ZERO_RATED`, `REVERSE_CHARGE` choices | READY |
| Gold settings | LIVE provider, AED, enabled | READY |

## 6 Selected Karat / Purchase Authority

The service requires an integer supported karat and resolves purchase rate through the Gold Center global spot authority. The accepted current record uses 21K and stores:

- purchase rate: `447.75537561`
- source: `GOLD_CENTER_GLOBAL_SPOT`
- currency: `AED`
- unit: `PER_GRAM`
- quote type: `SPOT`

The client cannot replace the purchase authority unless the existing server-backed manual override configuration and permission are available. The current UI displays the server-derived rate.

## 7 Purchase Precision

GBP service arithmetic uses Decimal.js with 8-decimal monetary/weight output and 6-decimal karat/rate metadata where defined. The live PO tax columns and current cost revision preserve 8 decimals. Legacy Asset/PO-item display fields with lower precision are not treated as the canonical historical cost authority.

Current accepted values:

| Value | Actual |
|---|---:|
| Gold value | `1791.02150244` |
| Making total | `80.00000000` |
| Taxable base | `1871.02150244` |
| VAT | `261.94301034` |
| Total purchase cost | `2132.96451278` |

## 8 Gold Center / Historical Snapshot

Current read-only health:

| Signal | Actual |
|---|---|
| Health | HTTP 200 / `HEALTHY` |
| Provider | `GOLDAPI_IO` |
| Mode | `LIVE_PROVIDER` |
| Currency / unit | `AED` / `PER_GRAM` |
| Freshness | fresh, non-stale |
| Mock fallback | `false` |

The accepted Asset snapshot stores its provider, quote ID, quote timestamp, karat, source and derivation in the immutable purchase-cost provenance. A later Gold Center quote does not rewrite the purchase snapshot. Current valuation is stored separately from the purchase revision.

## 9 Shared Receive Contract

The canonical path is:

`Inventory → Add / Receive Inventory → Gold By Piece → one GBP form → Supplier V2`

The form uses the shared Supplier, DB Location, Purchase Date, Tax Treatment, Notes and server tax summary section. The submit payload sets `inventoryV2: true`, carries one `perPiece` entry, and calls `/purchase-orders/receive`. The Supplier legacy receive screen was not used and remains non-authoritative.

## 10 GBP Profile UI

Arabic and English both render:

- Supplier and Location as DB-backed required selectors;
- Purchase Date and Tax Treatment;
- Item Description / Type, Gold Color, Karat, Condition;
- Gross Weight, Stone Weight, server-derived Net Gold Weight and Pure Gold Weight;
- Global Gold Rate, Purchase Making, Current Making;
- Current Rate Mode, Current Gold Value, Current Total Cost;
- Markup and Maximum Discount;
- server-backed Barcode Item Code, optional RFID, and current Branch;
- no Payment fields and no separate GBP sidebar workflow.

Chooser state: GBW and GBP enabled; Diamond, Gem Stone and Pearl disabled.

## 11 Preview

The existing accepted canonical preview evidence remains valid because the current DB record and source contracts were re-read and match. Profile Preview and Shared Receive Preview carried the same server-derived purchase/tax inputs at 8DP. No new preview mutation or Receive was needed.

## 12 Existing Evidence Reuse

Current DB evidence re-confirmed the accepted identifiers:

| Evidence | Current actual |
|---|---|
| PO | `PO-1787094119240` |
| PO Item | `POI-1787094119290-1-1` |
| Asset | `AST-PUR-1787094119267-1-1-sulb` |
| Barcode | `GPRNG21000003` |
| Journal | `JE-1787094119309` |
| Idempotency row | succeeded, HTTP 201 |

The current record is not stale: it exists in the official DB, has complete relations, exact tax reconciliation and matching source classifications.

## 13 Optional Controlled Receive

`NEW_CONTROLLED_GBP_RECEIVE_REQUIRED = NO`.

No new Receive, Asset, Barcode, RFID assignment, Journal or Payment was created in this control. The previously authorized accepted receive remains the sole current clean GBP runtime evidence.

## 14 Tax / PO Precision

For the accepted current PO:

| Check | Actual | Result |
|---|---:|---|
| Tax Snapshot taxable base | `1871.02150244` | PASS |
| PO `tax_base` | `1871.02150244` | PASS |
| Tax Snapshot VAT | `261.94301034` | PASS |
| PO `input_vat_amount` | `261.94301034` | PASS |
| PO total | `2132.96451278` | PASS |

No tolerance or manual rounding was used for the Snapshot ↔ PO comparison.

## 15 Asset / Barcode / RFID

Current GBP integrity query:

| Check | Count | Result |
|---|---:|---|
| GBP Assets | 3 | PASS |
| Missing Barcode | 0 | PASS |
| Duplicate Asset Barcodes | 0 | PASS |
| Missing Origin | 0 | PASS |
| Missing current Cost Revision | 0 | PASS |
| Missing Current Valuation | 0 | PASS |
| Product-linked accepted PO item | 0 | PASS |

The current accepted item has one active Barcode History row, one Asset, no Product ID, and no RFID mutation. RFID remains an optional Asset identity and does not become inventory authority.

## 16 Origin / Cost Revision / Movement

The accepted record has:

- one `PURCHASE_ORDER` Origin linked to `POI-1787094119290-1-1`;
- one current `asset_purchase_cost_revisions` row with 8DP Gold Center rate and purchase economics;
- one `PURCHASE_RECEIVE` `inventory_asset_movements` row to the active Branch/Location;
- zero `stock_movements` for serialized GBP physical stock.

No identity mismatch was found.

## 17 Historical vs Current Valuation

The current accepted Asset has a separate current valuation row:

- rate source: `GOLD_CENTER_GLOBAL_SPOT`;
- rate at receipt snapshot: `447.75537561`;
- total current valuation: `2132.96451278`;
- historical purchase revision: separate row, immutable.

This separation is preserved. Current Gold Center health now reports a newer live quote; that observation does not update the historical purchase rate.

## 18 Retail / Selling Price / Zero-Price Safety

`GBP_RETAIL_PRICING = IMPLEMENTED_GLOBAL_MARKUP_BOUNDARY / RETAIL_RATE_NOT_CONFIGURED_FAIL_CLOSED`.

The GBP sale authority uses current valuation cost, server-side markup, maximum discount and VAT. It does not reuse purchase cost as the UI selling price. Missing markup is rejected by the GBP pricing service. A zero/missing effective sale amount is rejected at the canonical sale boundary by `assertPositiveSaleAmount`; the UI also does not create an implicit Retail fallback. No sale was executed in this control.

Accepted POS boundary: the current source retains compatibility fallback for older Assets when a current valuation row is absent, but all current GBP Assets have valuations and the final POS sale was not finalized in this control. This is recorded as an accepted deferred boundary, not as current GBP data corruption.

## 19 Supplier Payable / Journal

The accepted journal `JE-1787094119309` is posted and balanced:

| Account | Debit | Credit |
|---|---:|---:|
| `SYS-INVENTORY` | `1871.02000000` | `0` |
| Input VAT `1400` | `261.94000000` | `0` |
| Supplier Payable `SYS-AP` | `0` | `2132.96000000` |
| Total | `2132.96000000` | `2132.96000000` |

Payment rows remain zero. Payable is linked to the accepted PO and supplier; no accounting mapping rewrite was performed.

## 20 Idempotency

Existing accepted evidence, revalidated against the current idempotency row, proves:

- same-key replay returned the original HTTP 201 result without duplicate business rows;
- changed payload with the same key returned HTTP 409 `STATE_CONFLICT`;
- current row status is `succeeded` and the accepted Asset/PO identifiers remain unchanged.

No replay request was sent again in this control.

## 21 Company / Branch / Location

Company, Branch and Location are server-scoped. Current accepted relations are:

- Company: `COMP-48ab554f-427e-4642-9419-bc8616c2dc36`;
- Branch: `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c` (`Branch-1`, active);
- Location: `LOC-9a10f58e-4207-4512-8824-7a7b06159151` (active, branch-scoped);
- Supplier: `SUP-001`.

The GBP contract is guarded by `inventory.view`; Branch and Company filters are server-authoritative.

## 22 POS Readiness Boundary

`GBP_POS_READINESS = ACCEPTED_DEFERRED_BOUNDARY`.

No POS sale was executed. Static source proof shows:

- final-profile Product quantity sale is rejected;
- Asset sale requires Asset identity and quantity 1;
- unavailable Asset status is rejected;
- final calculated sale amount must be positive;
- server-side GBP pricing is used when the Asset has a GBP profile.

Full POS finalization remains outside this closure and must not be inferred as closed.

## 23 Integrity Queries

Current official DB integrity findings:

| Check | Result |
|---|---|
| All current GBP Assets have Barcode | PASS |
| Active Barcode cardinality is unique | PASS |
| All current GBP Assets have Origin | PASS |
| All current GBP Assets have current Cost Revision | PASS |
| All current GBP Assets have Current Valuation | PASS |
| PO Item → Asset cardinality | PASS |
| Product physical authority used by current GBP receive | PASS: no |
| Serialized movement linked to accepted Origin | PASS |
| Current PO Tax Snapshot ↔ PO columns | PASS exact 8DP |
| Current accepted Journal balanced | PASS |

Historical non-blocking evidence, preserved without repair:

- `PO-1787090870807` / `JE-1787090870905`: old PO precision mismatch and an unbalanced historical journal;
- `PO-1787092907325`: old PO tax-column precision mismatch, with balanced journal.

The current canonical record `PO-1787094119240` is clean and proves the corrected path. These historical rows are not counted as current GBP P1 anomalies.

## 24 Browser AR/EN

| Locale | URL | Result |
|---|---|---|
| Arabic | `http://localhost:3000/ar/inventory/gold-by-piece` | PASS |
| English | `http://localhost:3000/en/inventory/gold-by-piece` | PASS |

Both pages loaded with Gold Center ready, DB Supplier/Location options, server tax treatment choices, GBP fields, current Branch, disabled Receive button until required data, and no Payment fields. The unified Inventory route was used; no Supplier legacy receive screen was used.

## 25 API / Network / Console

Read-only health endpoints:

| Endpoint | HTTP | Actual |
|---|---:|---|
| `/api/v1/health` | 200 | backend UP |
| `/api/v1/health/db` | 200 | PostgreSQL connected |
| `/api/v1/health/redis` | 200 | Redis connected |
| `/api/v1/health/gold` | 200 | Gold Center healthy/fresh, GOLDAPI_IO, AED |
| GBP `/contract` | 200 in accepted current evidence | server-backed GBP contract loaded by AR/EN pages |
| GBP `/preview` | 200 in accepted current evidence | read-only profile preview |
| shared `/receive-preview` | 200 in accepted current evidence | read-only tax preview |

No receive endpoint was called in this control. Browser console errors/warnings: none observed in AR or EN.

## 26 Focused Tests

Command executed:

```text
node --test backend/tests/gold-by-piece-rate-calculation-03-r2.test.cjs backend/tests/g3-financial-reconciliation-correction.test.cjs backend/tests/g3-po-tax-precision-schema.test.cjs backend/tests/supplier-all-asset-profiles-acquisition-payable-pricing-fix-01.test.cjs backend/tests/gold-by-weight-financial-formula-01b.test.cjs backend/tests/gold-by-weight-profile-02.test.cjs backend/tests/inventory-authority-foundation-01a.test.cjs backend/tests/phase-03b-g2a2-transaction-tax.test.cjs backend/tests/phase-03b-g2b-location-management.test.cjs backend/tests/supplier-receive-profile-switch-async-preview-race-ux-fix-03.test.cjs tests/asset-final-closure.test.cjs tests/barcode-final-closure.test.cjs tests/rfid-final-closure.test.cjs tests/unified-inventory-intake-ux-02-r3.test.cjs
```

Result: `92 passed, 0 failed`.

`npm run typecheck`: PASS. No build, migration, seed or test fixture write was run.

## 27 Files Changed

Intentional change in this control:

- `docs/DARFUS_GBP_FINAL_CLOSURE_REPORT.md` — this report only.

Product source files changed: `0`. Test files changed: `0`. Migration files changed: `0`. Config/secrets changed: `0`. Official DB writes: `0`.

Pre-existing worktree state was preserved: branch `main`, HEAD `1657b0e9ba580faef69be48f04637835c201b521`, 94 tracked modified entries, 320 untracked entries, 11 stashes. The Owner-accepted generated `next-env.d.ts` drift was not edited or reverted.

## 28 Gate

All mandatory current GBP closure criteria pass. Historical defects are explicitly preserved and excluded from current-path acceptance because the current canonical record proves the corrected schema/runtime path.

```text
GATE = PASS_GOLD_BY_PIECE_FINAL_CLOSURE
GBP_FINAL_CLOSED = YES
```

## 29 Final Tokens

```text
CURRENT_CONTROL = DARFUS-GBP-FINAL-CLOSURE
LOCAL_MAIN_DB = darfus_erp
SEQUELIZE_META = 86
CAN_REUSE_CURRENT_GBP_ACCEPTANCE_EVIDENCE = YES
NEW_CONTROLLED_GBP_RECEIVE_REQUIRED = NO
NEW_GBP_RECEIVES = 0

GBP_REFERENCE_LOCK = PASS
GBP_SERVER_PURCHASE_AUTHORITY = PASS
GBP_SELECTED_KARAT_AUTHORITY = PASS
GBP_SUPPORTED_KARATS = PASS
GBP_PURCHASE_PRECISION = PASS
GBP_GOLD_CENTER_AUTHORITY = PASS
GBP_HISTORICAL_RATE_SNAPSHOT = PASS
GBP_HISTORICAL_SNAPSHOT_IMMUTABLE = PASS
GBP_SHARED_RECEIVE_CONTRACT = PASS
GBP_PROFILE_FIELDS = PASS
GBP_PREVIEW = PASS
GBP_TAX_AUTHORITY = PASS
GBP_PO_TAX_RECONCILIATION = PASS
GBP_ONE_PIECE_ONE_ASSET = PASS
GBP_PRODUCT_QUANTITY_EXCLUSION = PASS
GBP_ASSET_EVIDENCE = PASS
GBP_BARCODE_EVIDENCE = PASS
GBP_RFID_BOUNDARY = PASS
GBP_ORIGIN = PASS
GBP_PURCHASE_COST_REVISION = PASS
GBP_MOVEMENT = PASS
GBP_HISTORICAL_CURRENT_COST_SEPARATION = PASS
GBP_CURRENT_VALUATION = PASS
GBP_RETAIL_PRICING_BOUNDARY = PASS_OR_ACCEPTED_NOT_IMPLEMENTED
GBP_ZERO_PRICE_SAFETY = PASS
GBP_SUPPLIER_PAYABLE = PASS
GBP_JOURNAL_BALANCE = PASS
PAYMENT_RECORD_DELTA = 0
GBP_IDEMPOTENCY_REPLAY = PASS
GBP_IDEMPOTENCY_CONFLICT = PASS
GBP_COMPANY_SCOPE = PASS
GBP_BRANCH_SCOPE = PASS
GBP_LOCATION_SCOPE = PASS
GBP_POS_READINESS = ACCEPTED_DEFERRED_BOUNDARY
GBP_INTEGRITY_ANOMALIES_P1 = 0
AR_UI = PASS
EN_UI = PASS
NETWORK = PASS
CONSOLE = PASS
PERMISSIONS = PASS
FOCUSED_TESTS = PASS_92_TESTS
TYPECHECK = PASS
NEW_ASSETS = 0
NEW_BARCODES = 0
NEW_RFID_ASSIGNMENTS = 0
NEW_JOURNALS = 0
NEW_PAYMENTS = 0
MIGRATION_CREATED = NO
ONLINE_PRODUCTION_CONTACTED = NO
GATE = PASS_GOLD_BY_PIECE_FINAL_CLOSURE
GBP_FINAL_CLOSED = YES
NEXT_RECOMMENDED_STEP = SUPPLIER_ACCOUNTS_AND_PAYMENTS_FINAL_CLOSURE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP — Owner review required. No Supplier Accounts & Payments closure was started automatically.
