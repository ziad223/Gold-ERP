# DARFUS ERP — G3 Final GBP Acceptance Rerun Report

Control ID: `DARFUS-G3-FINAL-GBP-ACCEPTANCE-RERUN`

## 1. Executive Summary

تم تنفيذ المسار القانوني فقط: `Inventory → إضافة / استلام مخزون → ذهب بالقطعة`. نجح استلام اصطناعي واحد وأنشأ PO واحدًا وAsset واحدًا وBarcode واحدًا وحركة أصل وقيدًا محاسبيًا متوازنًا بالسنت. لم يتم استخدام شاشة الموردين القديمة، ولم يتم تنفيذ replay أو conflicting replay بعد ظهور فشل مصالحة مالية حرفية.

الـGate النهائي **FAIL / BLOCKED** وليس PASS: `purchase_orders.tax_base` و`purchase_orders.input_vat_amount` يحفظان 4 منازل عشرية فقط، بينما Profile Preview وShared Preview وTax Snapshot وCost Revision تعتمد 8 منازل. هذا يخالف شرط `snapshot = PO` الحرفي، وهو عيب مالي/دقّة persistence من أولوية P1. لم يتم إصلاحه في هذا الـBatch.

## 2. Previous Financial Defects

- PO `PO-1787090870807` وJournal `JE-1787090870905` محفوظان كما هما كدليل تاريخي للعيب السابق.
- لم يحدث لهما update/delete/reverse/repost أو manual re-balance.
- التصنيف: `PRESERVED_G3_FINANCIAL_DEFECT_EVIDENCE`; ليسا دليل قبول نهائي.

## 3. Source Fix Presence

- `app/[locale]/(dashboard)/inventory/gold-by-piece/page.tsx`: `receiveItem` carries server-derived `purchaseCost`, `goldValue`, `makingTotal`, `vatBase`, and `vatAmount` into the shared preview/receive contract.
- `backend/src/services/posting.service.js`: rounded journal lines and exact rounded-cent debit/credit guard occur before `JournalEntry.create`.
- Active backend container was checked read-only and contained the same guard. No source change was made in this rerun.

## 4. Preconditions

| Check | Result | Evidence |
|---|---|---|
| Official database | PASS | `current_database() = darfus_erp` |
| Sequelize migrations | PASS | Applied count `85`; no pending migration was run |
| Backend / PostgreSQL / Redis | PASS | Backend up on `8000`; PostgreSQL healthy on host `5433`; Redis healthy on `6379` |
| Readiness | PASS | `systemFirstRunReady=true`, `operationalReceiveReady=true`, no blockers |
| Company / Branch / Location / Supplier | PASS | Existing company/branch context; Supplier `SUP-001`; Location `QA-G2C-RECEIVE-LOC-01` |
| Gold Center | PASS | `HEALTHY`, `GOLDAPI_IO`, `LIVE_PROVIDER`, AED, fresh/non-stale |
| Frontend | PASS | Existing `localhost:3000` runtime; no restart/build performed |

## 5. Preview Parity

Captured before submit from the canonical GBP form:

| Value | Profile Preview | Shared Receive Preview | Result |
|---|---:|---:|---|
| Live 21K purchase rate | `447.93637628` | same source | PASS |
| Gross / stone / net | `4 / 0 / 4` | same item | PASS |
| Gold value | `1791.74550512` | carried from profile | PASS |
| Making total | `80.00000000` | carried from profile | PASS |
| Taxable base | `1871.74550512` | `1871.74550512` | PASS |
| VAT rate / treatment | `14% / STANDARD_VAT` | `14% / STANDARD_VAT` | PASS |
| VAT amount | `262.04437072` | `262.04437072` | PASS |
| Total purchase cost | `2133.78987584` | derived from same inputs | PASS |

The first UI submit returned the controlled session-refresh retry message and produced no DB delta. The manually retried UI submit returned success and was the single business receive.

## 6. Controlled GBP Receive

| Evidence | Actual |
|---|---|
| Entry point | Canonical Inventory GBP form only |
| Result | HTTP `201` success through `/api/v1/purchase-orders/receive` |
| PO | `PO-1787092907325` |
| PO item | `POI-1787092907380-1-1` |
| Asset | `AST-PUR-1787092907353-1-1-hldv` |
| Profile | `GOLD_BY_PIECE` |
| Quantity authority | Asset; Product ID is NULL |
| Payment | `0`; no payment row created |
| New business receives | `1` |

## 7. Tax Snapshot / PO Reconciliation

Tax Snapshot on the new PO:

- treatment: `STANDARD_VAT`
- taxableBase: `1871.74550512`
- vatAmount: `262.04437072`
- roundingScale: `8`
- UAE policy snapshot and 14% company rate preserved.

Persisted PO columns:

- `total = 2133.78987584` — exact total retained.
- `tax_base = 1871.7455` — truncated/quantized to 4 decimals.
- `input_vat_amount = 262.0444` — quantized to 4 decimals.

Database schema evidence: `purchase_orders.tax_base` and `purchase_orders.input_vat_amount` are `numeric(15,4)`, while `purchase_orders.total` is `numeric(20,8)`. Therefore:

`Tax Snapshot taxableBase != PO tax_base` and `Tax Snapshot vatAmount != PO input_vat_amount` at exact authority precision.

Classification: `P1 FINANCIAL / PERSISTENCE-PRECISION DEFECT`. No schema migration or data correction was performed.

## 8. Asset / Barcode

- `1 piece = 1 Asset`: PASS.
- Asset profile: `GOLD_BY_PIECE`; status `AVAILABLE`; operational status `AVAILABLE`.
- Barcode: `GPRNG21000002`; one active history row; unique within the observed data.
- Inventory code: `GP`; item code: `RNG`; karat: `21`; gross/net weight: `4 / 4`.
- Product quantity authority was not used; `product_id` is NULL for the PO item and Asset.

## 9. Origin / Cost / Movement

- Origin row: one `PURCHASE_ORDER` origin linked to `POI-1787092907380-1-1`, classification `V2_RUNTIME_RECEIPT`.
- Cost revision: one current revision, AED, live Gold Center rate `447.93637628`, gold value `1791.74550512`, making `80`, VAT base `1871.74550512`, VAT `262.04437072`, total `2133.78987584`.
- Asset movement: one `PURCHASE_RECEIVE` movement to the approved Branch and Location.
- `stock_movements` delta: `0`.

## 10. Journal / Supplier Payable

New journal: `JE-1787092907406`, status `posted`.

| Line | Debit | Credit |
|---|---:|---:|
| Inventory `SYS-INVENTORY` | `1871.75000000` | `0` |
| Input VAT `1400` | `262.04000000` | `0` |
| Supplier Payable `SYS-AP` | `0` | `2133.79000000` |
| **Total** | **`2133.79000000`** | **`2133.79000000`** |

The journal is exactly balanced at persisted cents and has no residual line. The rounded journal credit equals the PO total at cents, and payment delta is zero. However, raw 8-decimal tax equality with the PO tax columns is not proven because the PO columns have already lost precision.

## 11. Same-Key Replay

**NOT RUN.** The exact PO/snapshot reconciliation failure in Section 7 is a P1 stop condition. No replay was sent, no duplicate was created, and no idempotency row was altered after the successful receive.

The successful receive has one `purchase.receive` idempotency row with status `succeeded` and status code `201`; its key is intentionally not printed.

## 12. Conflicting Replay

**NOT RUN.** Stopped under the same P1 gate; no conflicting payload was sent.

## 13. Browser / Network / Console

- Arabic canonical route loaded at `http://localhost:3000/ar/inventory/gold-by-piece`.
- Unified Intake chooser showed GBP enabled; Diamond/Gem Stone/Pearl remained disabled.
- Supplier and Location were DB-backed selections; Tax Treatment was `STANDARD_VAT`.
- Profile Preview and Shared Receive Preview completed before submit.
- First receive request encountered the existing controlled `401 → session refresh → manual retry` behavior; it produced no persistent delta.
- Retry completed with HTTP `201` and the UI displayed `تم الاستلام عبر Supplier V2` with the new Asset link.
- Browser fatal/error logs after the successful flow: none observed.
- No legacy Supplier Receive screen was used; no `/suppliers/purchases` acceptance was claimed.

Network evidence captured for the successful path: contract/readiness and both preview requests succeeded before the receive; receive succeeded on the retry. Same-key replay/conflict network evidence was not collected because the financial gate stopped the batch.

## 14. DB Reconciliation

| Entity | Before | After successful receive | Delta |
|---|---:|---:|---:|
| purchase_orders | 4 | 5 | +1 |
| purchase_order_items | 4 | 5 | +1 |
| assets | 4 | 5 | +1 |
| asset_barcode_history | 4 | 5 | +1 |
| asset_origins | 4 | 5 | +1 |
| asset_purchase_cost_revisions | 4 | 5 | +1 |
| inventory_asset_movements | 4 | 5 | +1 |
| stock_movements | 0 | 0 | 0 |
| journal_entries | 4 | 5 | +1 |
| journal_lines | 12 | 15 | +3 |
| payments | 0 | 0 | 0 |
| audit_logs | 38 | 39 | +1 |
| idempotency_requests | 4 | 5 | +1 |

Replay/conflict post-counts are not applicable because both were intentionally not run after the P1 stop.

## 15. Historical Defect Preservation

The previous defective PO `PO-1787090870807` and Journal `JE-1787090870905` remain present. No cleanup, reversal, correction, direct SQL business write, migration, seed, or backup operation was performed in this rerun.

## 16. Focused Tests

- Previously completed correction tests: PASS (`backend/tests/g3-financial-reconciliation-correction.test.cjs`, 3 tests).
- Previously completed typecheck: PASS.
- Active source guard syntax check: PASS.
- Full final acceptance test matrix: **NOT COMPLETE** because the exact PO tax persistence mismatch triggered the required stop before replay, conflict replay, POS barcode compatibility, GBW regression, and Unified Intake regression closure.

## 17. Files Changed

- New report: `docs/DARFUS_G3_FINAL_GBP_ACCEPTANCE_RERUN_REPORT.md`.
- No product source, test source, migration, config, `.env`, or Git metadata was changed by this rerun.
- The existing dirty worktree and Owner-accepted generated `next-env.d.ts` drift were preserved; unrelated pre-existing changes are not attributed to this batch.

## 18. Gate

`GATE = FAIL_P1_FINANCIAL_PO_TAX_PRECISION_RECONCILIATION`

The required final PASS gate is not satisfied. Specifically:

1. One canonical GBP receive succeeded.
2. Asset/Barcode/Origin/Cost/Movement and balanced journal evidence succeeded.
3. Exact Tax Snapshot ↔ PO tax column equality failed due to the live schema precision limitation.
4. Same-key replay and conflicting replay were not run after the stop condition.
5. Therefore this is not `PASS_PHASE_03B_G3_FULL_LOCAL_MAIN_BROWSER_API_DB_ACCOUNTING_ACCEPTANCE`.

## 19. Final Tokens

```text
CURRENT_BATCH = DARFUS-G3-FINAL-GBP-ACCEPTANCE-RERUN
MODE = G3_FINAL_GBP_ACCEPTANCE_RERUN
OFFICIAL_DATABASE = darfus_erp
ONE_NEW_CANONICAL_GBP_RECEIVE = COMPLETED_1
PERSISTENT_BUSINESS_WRITES_THIS_BATCH = 1_AUTHORIZED_SYNTHETIC_RECEIVE
UNAUTHORIZED_MANUAL_DB_WRITES = 0
MIGRATIONS_RUN = 0
LEGACY_SUPPLIER_RECEIVE_USED = NO
HISTORICAL_DEFECT_MODIFIED = NO

GBP_CANONICAL_RECEIVE = PASS
PREVIEW_SUBMIT_CALCULATION_PARITY = PASS_SOURCE_AND_RUNTIME_INPUT_PARITY
ASSET_BARCODE_ORIGIN_COST_MOVEMENT = PASS
JOURNAL_CENT_BALANCE = PASS
TAX_SNAPSHOT_PO_EXACT_RECONCILIATION = FAIL_P1
SAME_KEY_IDEMPOTENCY_REPLAY = NOT_RUN_STOPPED_ON_P1
CONFLICTING_REPLAY = NOT_RUN_STOPPED_ON_P1
POS_BARCODE_COMPATIBILITY = NOT_RUN
GBW_REGRESSION = NOT_RUN
UNIFIED_INTAKE_REGRESSION = PARTIAL_CANONICAL_PATH_ONLY

P0_COUNT = 0
P1_COUNT = 1
P2_COUNT = 0
P3_COUNT = 0
P4_COUNT = 0

G3_LOCAL_MAIN_FINAL_CLOSED = NO
GATE = FAIL_P1_FINANCIAL_PO_TAX_PRECISION_RECONCILIATION
NEXT_RECOMMENDED_STEP = OWNER_DECISION_ON_MINIMUM_SAFE_PO_TAX_PRECISION_SCHEMA_FIX_THEN_CONTROLLED_RERUN
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP — OWNER REVIEW REQUIRED. No automatic fix, replay, cleanup, migration, or next batch was started.
