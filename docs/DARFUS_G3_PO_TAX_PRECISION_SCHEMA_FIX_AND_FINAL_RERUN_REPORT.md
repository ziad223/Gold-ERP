# DARFUS ERP — Minimum Safe PO Tax Precision Schema Fix + G3 Controlled Rerun

Control ID: `DARFUS-G3-PO-TAX-PRECISION-SCHEMA-FIX-AND-RERUN`

## 1. Executive Summary

تم إثبات سبب فشل G3، إنشاء Full Backup صالح، تطبيق migration واحدة فقط على `darfus_erp`، ثم تنفيذ canonical GBP receive واحد مع same-key replay وconflicting replay. أُغلقت المصالحة المالية المطلوبة: Tax Snapshot وPO tax columns متطابقة 8DP، والـjournal الجديد متوازن بالسنت.

تم الحفاظ على كل السجلات التاريخية دون update/delete/backfill/reverse. لم يتم لمس Online Production. لم يتم تغيير Tax Engine أو Accounting rules.

## 2. Live Schema Before

Verified live target: `current_database() = darfus_erp`.

| Column | Live type before | Precision | Scale |
|---|---|---:|---:|
| `tax_base` | numeric | 15 | 4 |
| `input_vat_amount` | numeric | 15 | 4 |
| `total` | numeric | 20 | 8 |

`SequelizeMeta` before: `85`.

## 3. Root Cause Proof

`Tax Snapshot`, GBP calculation, and Asset purchase-cost revision use 8-decimal values. Before the fix, the last receive showed:

- Snapshot taxable base: `1871.74550512`; persisted `tax_base`: `1871.7455`.
- Snapshot VAT: `262.04437072`; persisted `input_vat_amount`: `262.0444`.

Source verification confirmed the canonical tax/cost path carries 8DP evidence while the PO ORM/migration definitions used `DECIMAL(15,4)`.

`ROOT_CAUSE = PO_TAX_COLUMNS_LOSSY_PERSISTENCE_PRECISION`.

## 4. Backup Evidence

| Item | Result |
|---|---|
| Backup path | `backend/backups/darfus_erp_PRE_G3_PO_TAX_PRECISION_20260819_015724.dump` |
| Target | `darfus_erp` on local PostgreSQL container |
| Format | PostgreSQL custom dump |
| Size | `671297` bytes |
| SHA-256 | `BB164D6A5A47BF14FB7432A60A2A93EF88FD67300B8845D1E04AFAA633B0E7F8` |
| `pg_restore --list` | PASS; list size `99062` bytes |
| Secrets exposed | NO |

## 5. Migration

Migration: `backend/migrations/20260819010000-widen-purchase-order-tax-precision.js`.

Only these changes were applied:

```sql
ALTER TABLE purchase_orders
  ALTER COLUMN tax_base TYPE NUMERIC(20,8);

ALTER TABLE purchase_orders
  ALTER COLUMN input_vat_amount TYPE NUMERIC(20,8);
```

`purchase_orders.total` and all other columns were left unchanged. The down definition exists for migration convention only and was not run because 8→4 can be lossy.

ORM alignment: `backend/src/models/purchaseOrder.model.js` now declares only `taxBase` and `inputVatAmount` as `DECIMAL(20,8)`. Existing unrelated worktree edits in that model were preserved.

Migration syntax, load check, and schema regression test passed before apply. Migration applied successfully; no second migration was created or run.

## 6. Live Schema After

| Column | Live type after | Precision | Scale |
|---|---|---:|---:|
| `tax_base` | numeric | 20 | 8 |
| `input_vat_amount` | numeric | 20 | 8 |
| `total` | numeric | 20 | 8 |

`SequelizeMeta` after: `86`.

Health after migration:

- `/api/v1/health`: HTTP 200
- `/api/v1/health/db`: HTTP 200
- `/api/v1/health/redis`: HTTP 200
- `/api/v1/health/gold`: HTTP 200; `GOLDAPI_IO`, AED, fresh/non-stale
- readiness: `systemFirstRunReady=true`, `operationalReceiveReady=true`, blockers `[]`

## 7. Existing Data Preservation

Migration delta for existing business data: zero.

| Entity | Before | After migration | Delta |
|---|---:|---:|---:|
| purchase_orders | 5 | 5 | 0 |
| purchase_order_items | 5 | 5 | 0 |
| assets | 5 | 5 | 0 |
| journal_entries | 5 | 5 | 0 |
| payments | 0 | 0 | 0 |

Existing monetary values were numerically unchanged; only trailing zero capacity was widened. No historical row was updated or backfilled.

## 8. Focused Tests

Authoritative focused set: **32/32 PASS**.

Included:

- G3 financial reconciliation correction
- G3 PO tax precision schema regression
- G2A2 transaction tax
- G2C receive tax/location
- GBP R2 calculation and receive wiring
- Inventory authority / Product quantity exclusion
- Canonical Supplier Receive profile-switch and legacy redirect contract
- `npm run typecheck`: PASS

Five older assertions were observed as non-authoritative stale expectations: two assume a root-level `src`/`migrations` layout that does not exist, and three expect the removed Supplier legacy receive form. They were not modified and do not represent the current canonical workflow.

## 9. GBP Preview Parity

Canonical Arabic browser path: `/ar/inventory` → `إضافة / استلام مخزون` → `ذهب بالقطعة`.

Before submit, the browser showed the live 21K rate `447.75537561`. Read-only API verification of the same contract returned HTTP 200 for both previews:

| Value | Profile Preview | Shared Receive Preview | Result |
|---|---:|---:|---|
| Purchase gold rate | `447.75537561` | same receive input | PASS |
| Gold value | `1791.02150244` | carried from profile | PASS |
| Making total | `80.00000000` | carried from profile | PASS |
| Taxable base | `1871.02150244` | `1871.02150244` | PASS |
| VAT | `261.94301034` | `261.94301034` | PASS |
| Total | `2132.96451278` | same economics | PASS |
| Treatment | `STANDARD_VAT` | `STANDARD_VAT` | PASS |

`PROFILE_SHARED_PREVIEW_PARITY = PASS`.

## 10. Controlled Receive

One and only one new synthetic GBP receive was submitted from the canonical Inventory UI.

| Evidence | Actual |
|---|---|
| HTTP | `201` |
| PO | `PO-1787094119240` |
| PO Item | `POI-1787094119290-1-1` |
| Asset | `AST-PUR-1787094119267-1-1-sulb` |
| Barcode | `GPRNG21000003` |
| Journal | `JE-1787094119309` |
| Profile | `GOLD_BY_PIECE` |
| Tax treatment | `STANDARD_VAT` |
| New business receives | `1` |

## 11. Tax Snapshot / PO Exact Reconciliation

New PO values:

- `tax_snapshot.taxableBase = 1871.02150244`
- `purchase_orders.tax_base = 1871.02150244`
- `tax_snapshot.vatAmount = 261.94301034`
- `purchase_orders.input_vat_amount = 261.94301034`
- `purchase_orders.total = 2132.96451278`

All comparisons are exact at 8 decimals; no tolerance was used.

`TAX_SNAPSHOT_PO_EXACT_8DP_RECONCILIATION = PASS`.

## 12. Journal / Payable

New journal `JE-1787094119309` is posted:

| Account | Debit | Credit |
|---|---:|---:|
| `SYS-INVENTORY` | `1871.02000000` | `0` |
| `1400` Input VAT | `261.94000000` | `0` |
| `SYS-AP` Supplier Payable | `0` | `2132.96000000` |
| **Total** | **`2132.96000000`** | **`2132.96000000`** |

`round2(PO total) = 2132.96 = supplier payable credit`; payment delta is zero. The single pre-existing historical defective journal remains separately preserved and is not used as current acceptance evidence.

`JOURNAL_BALANCE = PASS` and `SUPPLIER_PAYABLE = PASS`.

## 13. Asset / Barcode / Movement

- One physical piece → one Asset: PASS.
- Asset profile `GOLD_BY_PIECE`, status `available`, operational status `AVAILABLE`.
- Product ID on PO Item is NULL; Product quantity is not physical authority.
- One active Barcode History row: `GPRNG21000003`; no duplicate active barcode found.
- One `PURCHASE_ORDER` Origin row, classification `V2_RUNTIME_RECEIPT`.
- One current purchase-cost revision with 8DP live rate/economics.
- One `PURCHASE_RECEIVE` inventory asset movement to the approved Branch/Location.
- `stock_movements` delta: `0`.

Note: legacy `final_purchase_cost` display/storage fields on PO Item/Asset remain outside this minimum-safe tax-column scope; the canonical 8DP cost authority is the current Asset purchase-cost revision and was preserved.

## 14. Same-Key Replay

Same request body and same Idempotency-Key were hash-verified before sending. The API returned HTTP `201` with the original PO/Asset response. The current route replays the stored response without adding a `replayed` flag; DB evidence is authoritative:

- PO remained `PO-1787094119240`.
- Asset remained `AST-PUR-1787094119267-1-1-sulb`.
- Counts remained unchanged at 6 PO / 6 PO items / 6 Assets / 6 barcodes / 6 origins / 6 cost revisions / 6 movements / 6 journals / 18 journal lines / 6 idempotency rows.

`SAME_KEY_REPLAY = PASS`.

## 15. Conflict Replay

Same key with a meaningful changed payload (description and gross weight) returned HTTP `409`, error code `STATE_CONFLICT`.

No business counts changed after the conflict: no PO, item, Asset, Barcode, Origin, Cost Revision, Movement, Journal, Payment, Audit, or Idempotency row was added.

`CONFLICTING_REPLAY = PASS`.

## 16. Browser / Network / Console

- Arabic canonical Inventory journey loaded and completed.
- GBP was enabled; Diamond/Gem Stone/Pearl remained disabled.
- Supplier, DB Location, STANDARD_VAT, live Gold Center, and synthetic GBP fields were used.
- Browser displayed `تم الاستلام عبر Supplier V2` and the new Asset link.
- Browser console errors/warnings after the flow: none observed.
- Profile preview: HTTP 200.
- Shared receive preview: HTTP 200.
- Browser receive: HTTP 201.
- Same-key replay: HTTP 201, same canonical result.
- Conflicting replay: HTTP 409, no mutation.
- Supplier legacy route remains redirect-only by source and focused test evidence; it was not used for acceptance.

`NETWORK = PASS` and `CONSOLE = PASS`.

## 17. DB Reconciliation

| Snapshot | PO | PO Items | Assets | Barcodes | Origins | Cost Revisions | Asset Movements | Stock Movements | Journals | Journal Lines | Payments | Audit Logs | Idempotency |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| A — before migration | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 0 | 5 | 15 | 0 | 39 | 5 |
| B — after migration | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 0 | 5 | 15 | 0 | 39 | 5 |
| C — before new receive | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 0 | 5 | 15 | 0 | 39 | 5 |
| D — after new receive | 6 | 6 | 6 | 6 | 6 | 6 | 6 | 0 | 6 | 18 | 0 | 40 | 6 |
| E — after same-key replay | 6 | 6 | 6 | 6 | 6 | 6 | 6 | 0 | 6 | 18 | 0 | 40 | 6 |
| F — after conflict replay | 6 | 6 | 6 | 6 | 6 | 6 | 6 | 0 | 6 | 18 | 0 | 40 | 6 |

The one globally unbalanced journal is the preserved historical defective journal `JE-1787090870905`; the new journal is balanced and was independently verified.

## 18. Historical Evidence Preservation

Preserved without update/delete/reversal/backfill:

- `PO-1787090870807`
- `JE-1787090870905`
- `PO-1787092907325`
- `JE-1787092907406`

Classification: `PRESERVED_HISTORICAL_ACCEPTANCE_EVIDENCE`.

## 19. Files Changed

Intentional files for this control:

- `backend/migrations/20260819010000-widen-purchase-order-tax-precision.js`
- `backend/src/models/purchaseOrder.model.js` — two precision declarations only; unrelated pre-existing edits preserved.
- `backend/tests/g3-po-tax-precision-schema.test.cjs`
- `docs/DARFUS_G3_PO_TAX_PRECISION_SCHEMA_FIX_AND_FINAL_RERUN_REPORT.md`
- Backup artifact: `backend/backups/darfus_erp_PRE_G3_PO_TAX_PRECISION_20260819_015724.dump`

Pre-existing worktree changes, including Owner-accepted generated `next-env.d.ts` drift, were not reverted or claimed. No product logic, tax logic, accounting rule, `.env`, or online production source was changed.

## 20. Gate

All required current canonical gates passed:

- live schema before/after proven;
- backup created and readable;
- one migration applied;
- existing rows preserved;
- focused authoritative tests and typecheck passed;
- one canonical GBP receive;
- exact 8DP Tax Snapshot ↔ PO reconciliation;
- journal/payable/Asset/Barcode/Origin/Cost/Movement authority;
- Product quantity exclusion;
- same-key replay and conflicting replay;
- browser/network/console evidence;
- historical evidence preserved;
- Online Production untouched.

`GATE = PASS_PHASE_03B_G3_FULL_LOCAL_MAIN_BROWSER_API_DB_ACCOUNTING_ACCEPTANCE`

`G3_LOCAL_MAIN_FINAL_CLOSED = YES`

## 21. Final Tokens

```text
CURRENT_CONTROL = DARFUS-G3-PO-TAX-PRECISION-SCHEMA-FIX-AND-RERUN
LOCAL_MAIN_DB = darfus_erp
SEQUELIZE_META_BEFORE = 85
LIVE_SCHEMA_BEFORE_TAX_BASE = numeric(15,4)
LIVE_SCHEMA_BEFORE_INPUT_VAT = numeric(15,4)
ROOT_CAUSE = PO_TAX_COLUMNS_LOSSY_PERSISTENCE_PRECISION
BACKUP_PATH = backend/backups/darfus_erp_PRE_G3_PO_TAX_PRECISION_20260819_015724.dump
BACKUP_SHA256 = BB164D6A5A47BF14FB7432A60A2A93EF88FD67300B8845D1E04AFAA633B0E7F8
BACKUP_READABLE = YES
MIGRATION_FILE = backend/migrations/20260819010000-widen-purchase-order-tax-precision.js
MIGRATION_APPLIED = PASS
SEQUELIZE_META_AFTER = 86
LIVE_SCHEMA_AFTER_TAX_BASE = numeric(20,8)
LIVE_SCHEMA_AFTER_INPUT_VAT = numeric(20,8)
EXISTING_ROWS_PRESERVED = PASS
HISTORICAL_PO_1_PRESERVED = YES
HISTORICAL_PO_2_PRESERVED = YES
HISTORICAL_JOURNAL_1_PRESERVED = YES
HISTORICAL_JOURNAL_2_PRESERVED = YES
FOCUSED_TESTS = PASS_32_AUTHORITATIVE_TESTS; FIVE_STALE_NON_AUTHORITATIVE_EXPECTATIONS_NOT_MODIFIED
TYPECHECK = PASS
PROFILE_SHARED_PREVIEW_PARITY = PASS
NEW_GBP_RECEIVE = PASS
NEW_GBP_PO = PO-1787094119240
NEW_GBP_ASSET = AST-PUR-1787094119267-1-1-sulb
NEW_GBP_BARCODE = GPRNG21000003
NEW_GBP_JOURNAL = JE-1787094119309
PREVIEW_TAX_BASE = 1871.02150244
SNAPSHOT_TAX_BASE = 1871.02150244
PO_TAX_BASE = 1871.02150244
PREVIEW_VAT = 261.94301034
SNAPSHOT_VAT = 261.94301034
PO_INPUT_VAT = 261.94301034
PREVIEW_TOTAL = 2132.96451278
PO_TOTAL = 2132.96451278
TAX_SNAPSHOT_PO_EXACT_8DP_RECONCILIATION = PASS
JOURNAL_TOTAL_DEBIT = 2132.96000000
JOURNAL_TOTAL_CREDIT = 2132.96000000
JOURNAL_BALANCE = PASS
SUPPLIER_PAYABLE = PASS
ASSET_AUTHORITY = PASS
BARCODE_AUTHORITY = PASS
ORIGIN_AUTHORITY = PASS
COST_REVISION_AUTHORITY = PASS
MOVEMENT_AUTHORITY = PASS
PRODUCT_QUANTITY_EXCLUSION = PASS
SAME_KEY_REPLAY = PASS
CONFLICTING_REPLAY = PASS
NETWORK = PASS
CONSOLE = PASS
MIGRATION_COUNT_THIS_BATCH = 1
NEW_BUSINESS_RECEIVES = 1
MANUAL_DB_BUSINESS_EDITS = 0
ONLINE_PRODUCTION_CONTACTED = NO
GATE = PASS_PHASE_03B_G3_FULL_LOCAL_MAIN_BROWSER_API_DB_ACCOUNTING_ACCEPTANCE
G3_LOCAL_MAIN_FINAL_CLOSED = YES
NEXT_RECOMMENDED_STEP = SUPPLIER_MASTER_FINAL_CLOSURE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. Supplier Master Final Closure was not started automatically.
