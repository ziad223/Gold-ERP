# DARFUS ERP — G2C Final Acceptance Rerun
# Canonical Inventory Receive Financial Reconciliation Closure

Control ID: `DARFUS-G2C-FINAL-ACCEPTANCE-RERUN`

## 1. Executive Summary

تمت إعادة قبول G2C على Local Main فقط بعد إصلاح `G2C-FIN-001`. بدأ المسار من Inventory، واستخدم GBW، ومر عبر Preview المصحح ثم Receive canonical واحد. تطابقت القيم المالية بين Preview وTax Snapshot وPO وJournal ضمن rounding authority الموجود، ونجح replay بنفس Idempotency-Key دون إنشاء صفوف إضافية.

**النتيجة: `PASS_PHASE_03B_G2C_CANONICAL_INVENTORY_RECEIVE_FINAL_ACCEPTANCE`**

لم يتم لمس Online Production، ولم تُنشأ Migration، ولم يُستخدم Supplier legacy UI، ولم تبدأ G2D.

## 2. Previous Block

البلوك السابق كان `G2C-FIN-001_PREVIEW_SUBMIT_TAX_MISMATCH`: كان GBW preview يرسل payload مختلفًا عن submit، فظهرت معاينة غير مساوية للـTax Snapshot.

أثناء هذه الإعادة ظهر سبب تنفيذي تابع: إضافة `goldValuation` دون سعر شراء فعلي كانت تجعل preview fail-closed، لأن GBW preview يتطلب `purchaseGoldRate`. تم تطبيق minimum safe fix فقط: عند عدم إدخال سعر يدوي، يستخدم preview وsubmit نفس `preview.gold.purchaseRate` المحسوب من Gold Center.

لم تتغير Business Formula أو Tax Engine أو Accounting authority.

## 3. Source/Runtime Alignment

### Preconditions

| Check | Result | Evidence |
|---|---|---|
| Current database | PASS | `current_database() = darfus_erp` |
| SequelizeMeta | PASS | 85 |
| Backend health | PASS | `GET /api/health = 200` |
| DB health | PASS | `GET /api/health/db = 200` |
| Redis health | PASS | `GET /api/health/redis = 200` |
| Gold health | PASS | `GET /api/health/gold = 200`, GOLDAPI_IO/AED, fresh quote |
| Frontend | PASS | `GET http://localhost:3000/ar/inventory = 200` |
| Backend restart | NOT RUN | Avoided startup command that automatically runs migrations |
| Online Production | UNTOUCHED | No production URL/request used |

### Source checks

- `goldValuation` is present in GBW preview-side `receiveItem` and submit piece.
- `resolvedPurchaseGoldRate` is shared by preview and submit.
- `/ar/suppliers/purchases` remains redirect-only to `/ar/inventory`.
- Supplier detail receive shortcut remains removed.
- No Migration was created by this rerun.
- Owner-accepted pre-existing `next-env.d.ts` generated drift was not edited.

## 4. Canonical Inventory Entry

Browser journey, Arabic, authenticated:

```text
/ar/inventory
→ إضافة / استلام مخزون
→ ذهب بالوزن
→ /ar/inventory/gold-by-weight
```

Observed:

- GBW and GBP are available in the Inventory chooser.
- Diamond/Gem/Pearl remain disabled.
- Shared fields are present: Supplier, DB Location, Purchase Date, Tax Treatment, Tax Summary, Notes.
- No Payment UI is shown.
- Supplier and Location values came from DB-backed contract data.

## 5. Preview Input Parity

The Preview was completed before Submit and the button remained disabled until the required canonical previews were ready.

| Input | Actual |
|---|---|
| Profile | `GOLD_BY_WEIGHT_JEWELLERY` |
| Supplier | `SUP-001 / QA-G2C-SUPPLIER-01` |
| Location | `LOC-9a10f58e-4207-4512-8824-7a7b06159151 / QA-G2C-RECEIVE-LOCATION-01` |
| Purchase date | `2026-08-18` |
| Tax treatment | `STANDARD_VAT` |
| Gross weight | 6g |
| Stone weight | 0g |
| Net weight | 6g |
| Karat | 21K |
| Gold rate | `447.75144840 AED/g` |
| Purchase making | 30 AED/g |
| Current making | 30 AED/g |
| `goldValuation.purchaseGoldRate` | `447.7514484` |
| `goldValuation.currentGoldRate` | `447.75144840` |
| VAT rate | 14% |
| Preview taxable base | 2866.51 AED |
| Preview VAT | 401.31 AED |
| Preview total | 3267.82 AED |

`PREVIEW_SUBMIT_INPUT_PARITY = PASS`: the same resolved purchase rate, current rate, making inputs, VAT inputs, profile, weight, barcode code, and per-piece Asset payload are used by preview and submit.

## 6. Controlled Receive

Exactly one new synthetic canonical Receive was submitted from Inventory:

```text
POST /purchase-orders/receive
PO     = PO-1787087436111
Asset  = AST-PUR-1787087436118-1-1-1v4x
Barcode= GWPND21000001
```

The browser displayed `تم استلام الأصل عبر Supplier V2.` and a success notification. No additional Receive was submitted.

## 7. Tax Snapshot

The new PO persisted:

```text
tax_treatment             = STANDARD_VAT
resolvedTaxTreatment      = STANDARD_VAT
effectiveVatRate          = 14
vatRegisteredSnapshot     = true
companyVatRateSnapshot    = 14
taxableBase               = 2866.51
vatAmount                 = 401.31
taxLawRuleVersion         = UAE-VATP043-2025-02-26
taxLawEffectiveDate       = 2025-02-26
taxCalculationVersion     = DARFUS-UAE-TAX-03B-G2A2-V1
roundingScale             = 2
```

`purchase_orders.tax_snapshot IS NOT NULL` and the PO treatment is `STANDARD_VAT`.

## 8. Financial Reconciliation

| Reconciliation | Preview | Persisted Snapshot | PO | Result |
|---|---:|---:|---:|---|
| Taxable base | 2866.51 | 2866.51 | 2866.5100 | PASS |
| VAT amount | 401.31 | 401.31 | 401.3100 | PASS |
| Effective rate | 14% | 14% | 14.000% | PASS |
| Total | 3267.82 | — | 3267.82000000 | PASS |

Canonical raw calculation evidence in the current cost revision is `vat_base=2866.50869040`, `vat_amount=401.31121666`, and `total_purchase_cost=3267.81990706`; transaction snapshot and journal use the existing 2-decimal posting authority.

```text
PREVIEW_TO_SNAPSHOT_RECONCILIATION = PASS
SNAPSHOT_TO_PO_RECONCILIATION       = PASS
PO_TO_JOURNAL_RECONCILIATION        = PASS
JOURNAL_BALANCED                    = PASS
```

## 9. Asset/Barcode/Movement/Origin/Cost

| Assertion | Result | Evidence |
|---|---|---|
| Supplier scope | PASS | Supplier active and company matches Asset/PO |
| Location scope | PASS | Location active; company and branch match Asset |
| Asset | PASS | One `GOLD_BY_WEIGHT_JEWELLERY`, `AVAILABLE`, 6g gross/net |
| Product authority | PASS | PO item `product_id = NULL`; no Product quantity row created |
| Barcode | PASS | `GWPND21000001`, one ACTIVE history row, revision 1 |
| Duplicate barcode | PASS | 0 duplicate barcode groups |
| Movement | PASS | One `PURCHASE_RECEIVE`, source PO, target branch/location |
| Origin | PASS | One `PURCHASE_ORDER`, `V2_RUNTIME_RECEIPT` |
| Cost revision | PASS | One current revision, supplier and PO item linked |

## 10. Journal/Payable

Journal: `JE-1787087436173`, status `posted`.

```text
SYS-INVENTORY debit = 2866.51
1400 input VAT debit = 401.31
SYS-AP supplier payable credit = 3267.82
total debit = 3267.82
total credit = 3267.82
```

No Payment UI was shown and `payments` remained 0.

## 11. Idempotency

Replay was sent to the same canonical endpoint with the same masked key and the same company/branch context. Secrets and Authorization values were not recorded.

```text
Replay HTTP status = 201
Replay success = true
Replay returned same PO = PO-1787087436111
Idempotency row = purchase.receive / succeeded / 201
```

Counts before the replay and after the replay remained unchanged:

```text
purchase_orders = 3
assets = 3
asset_barcode_history = 3
asset_origins = 3
asset_purchase_cost_revisions = 3
inventory_asset_movements = 3
journal_entries = 3
journal_lines = 9
payments = 0
```

`IDEMPOTENCY_REPLAY = PASS`.

## 12. Network Evidence

The following local HTTP evidence was collected without printing credentials, tokens, or Authorization headers:

| Request | Result |
|---|---|
| `GET /api/health` | 200 |
| `GET /api/health/db` | 200 |
| `GET /api/health/redis` | 200 |
| `GET /api/health/gold` | 200 |
| GBW Preview from canonical browser flow | success; values displayed |
| `POST /purchase-orders/receive` from canonical browser flow | success; PO/Asset/Barcode returned |
| Same receive endpoint + same Idempotency-Key | 201 success; same PO; no duplicate rows |
| Frontend `/ar/inventory` | 200 |

`NETWORK_ACCEPTANCE_EVIDENCE = PASS`.

## 13. Console/Browser Evidence

- Canonical Arabic browser journey completed without visible fatal error.
- Preview displayed server tax values.
- Receive displayed Supplier V2 success and notification.
- No `An unexpected server error occurred.` appeared after the corrected Preview.
- Browser alert region was empty after the successful run.
- No visible 5xx was present in the canonical journey.

`CONSOLE_ACCEPTANCE_EVIDENCE = PASS` for fatal/unhandled/visible receive errors.

## 14. Legacy Route Regression

Read-only browser checks:

```text
/ar/suppliers/purchases → /ar/inventory
Supplier Details → no Receive create button
```

No Receive was executed from either legacy path.

`LEGACY_SUPPLIER_RECEIVE_UI = REMOVED`.

## 15. Focused Tests

### Backend

The required focused backend command completed:

```text
45 passed / 0 failed
```

Coverage included G2C tax/location, G2A1 policy, G2A2 transaction tax, G2B location, Inventory authority, GBW, GBP, Supplier V2, and legacy isolation.

### Frontend

```text
Unified Inventory Intake UX: 5 passed / 0 failed
```

### Typecheck

```text
npm run typecheck: PASS
```

## 16. DB Reconciliation

Before this rerun, the previous legacy and previous mismatched canonical synthetic data were preserved. The new corrected run added exactly one business set:

| Entity | Before | After new receive | After replay |
|---|---:|---:|---:|
| purchase_orders | 2 | 3 | 3 |
| purchase_order_items | 2 | 3 | 3 |
| assets | 2 | 3 | 3 |
| barcode history | 2 | 3 | 3 |
| asset origins | 2 | 3 | 3 |
| cost revisions | 2 | 3 | 3 |
| inventory movements | 2 | 3 | 3 |
| journal entries | 2 | 3 | 3 |
| journal lines | 6 | 9 | 9 |
| payments | 0 | 0 | 0 |

Classification of existing records:

- Old legacy synthetic Receive: preserved, not acceptance authority.
- Previous mismatched canonical Receive: preserved, not final acceptance authority.
- New corrected canonical Receive: `PO-1787087436111`, acceptance authority for this rerun.
- Idempotent replay: no additional business rows.

No DELETE, rollback, manual tax correction, or cleanup was performed.

## 17. Files Changed

Intentional source change in this rerun:

- `app/[locale]/(dashboard)/inventory/gold-by-weight/page.tsx`
  - resolved Gold Center purchase rate is shared by preview and submit.

Report created:

- `docs/DARFUS_PHASE_03B_G2C_CANONICAL_INVENTORY_RECEIVE_FINAL_ACCEPTANCE_REPORT.md`

No test file, migration, config, `next-env.d.ts`, PostgreSQL container, Redis container, or production source was changed by this rerun.

The worktree contains extensive pre-existing changes and untracked historical batch files; they were not cleaned or reverted.

## 18. Bugs Found/Fixed

### G2C-FIN-001 — closed by this rerun

Preview/submit tax mismatch caused by different `goldValuation` payloads. Fixed by shared payload construction.

### G2C-FIN-002 — closed by this rerun

After the first source fix, preview still failed when the operator left purchase rate blank because preview-side `goldValuation.purchaseGoldRate` was undefined. Fixed by using `preview.gold.purchaseRate` as the same server-resolved rate in preview and submit.

Both fixes are minimum-safe authority alignment changes. No business formula was changed.

## 19. Gate

```text
CANONICAL_ENTRY = PASS
PREVIEW_SUBMIT_INPUT_PARITY = PASS
NEW_CANONICAL_RECEIVE = PASS
PREVIEW_TO_SNAPSHOT_RECONCILIATION = PASS
SNAPSHOT_TO_PO_RECONCILIATION = PASS
PO_TO_JOURNAL_RECONCILIATION = PASS
JOURNAL_BALANCE = PASS
TAX_SNAPSHOT = PASS
SUPPLIER_REFERENCE = PASS
LOCATION_REFERENCE = PASS
ASSET = PASS
BARCODE = PASS
MOVEMENT = PASS
ORIGIN = PASS
COST_REVISION = PASS
IDEMPOTENCY_REPLAY = PASS
NETWORK_ACCEPTANCE_EVIDENCE = PASS
CONSOLE_ACCEPTANCE_EVIDENCE = PASS
LEGACY_SUPPLIER_RECEIVE_UI = REMOVED
G2A1_REGRESSION = PASS
G2A2_REGRESSION = PASS
G2B_REGRESSION = PASS
ONLINE_PRODUCTION_UNTOUCHED = YES

GATE = PASS_PHASE_03B_G2C_CANONICAL_INVENTORY_RECEIVE_FINAL_ACCEPTANCE
G2C_LOCAL_MAIN_FINAL_CLOSED = YES
```

This closes only G2C Local Main acceptance. It does not close GBW, GBP, Supplier Accounting, Barcode, or POS final acceptance.

## 20. Final Tokens

```text
CURRENT_CONTROL = DARFUS-G2C-FINAL-ACCEPTANCE-RERUN
LOCAL_MAIN_DB = darfus_erp
SEQUELIZE_META = 85
SOURCE_GOLD_VALUATION_FIX_PRESENT = PASS
CANONICAL_RECEIVE_ENTRY = INVENTORY
PREVIEW_SUBMIT_INPUT_PARITY = PASS
NEW_CANONICAL_SYNTHETIC_RECEIVE = PASS

PREVIEW_TAXABLE_BASE = 2866.51
SNAPSHOT_TAXABLE_BASE = 2866.51
PO_TAX_BASE = 2866.5100
PREVIEW_VAT_AMOUNT = 401.31
SNAPSHOT_VAT_AMOUNT = 401.31
PO_INPUT_VAT_AMOUNT = 401.3100
PREVIEW_TOTAL = 3267.82
PO_TOTAL = 3267.82000000
JOURNAL_TOTAL_DEBIT = 3267.82000000
JOURNAL_TOTAL_CREDIT = 3267.82000000
SUPPLIER_PAYABLE_CREDIT = 3267.82000000

PREVIEW_TO_SNAPSHOT_RECONCILIATION = PASS
SNAPSHOT_TO_PO_RECONCILIATION = PASS
PO_TO_JOURNAL_RECONCILIATION = PASS
JOURNAL_BALANCE = PASS
TAX_SNAPSHOT = PASS
SUPPLIER_REFERENCE = PASS
LOCATION_REFERENCE = PASS
ASSET = PASS
BARCODE = PASS
MOVEMENT = PASS
ORIGIN = PASS
COST_REVISION = PASS
IDEMPOTENCY_REPLAY = PASS
NETWORK_ACCEPTANCE_EVIDENCE = PASS
CONSOLE_ACCEPTANCE_EVIDENCE = PASS
LEGACY_SUPPLIER_RECEIVE_UI = REMOVED

PREVIOUS_LEGACY_SYNTHETIC_RECEIVE = PRESERVED_NOT_ACCEPTANCE_AUTHORITY
PREVIOUS_MISMATCHED_CANONICAL_RECEIVE = PRESERVED_NOT_FINAL_ACCEPTANCE
G2A1_REGRESSION = PASS
G2A2_REGRESSION = PASS
G2B_REGRESSION = PASS
MIGRATION_CREATED = NO
ONLINE_PRODUCTION_CONTACTED = NO

GATE = PASS_PHASE_03B_G2C_CANONICAL_INVENTORY_RECEIVE_FINAL_ACCEPTANCE
G2C_LOCAL_MAIN_FINAL_CLOSED = YES
NEXT_RECOMMENDED_STEP = 03B-G2D-COMPANY-ONBOARDING-OPERATIONAL-READINESS-GATE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**G2C Final Acceptance complete → OWNER REVIEW → STOP.**
