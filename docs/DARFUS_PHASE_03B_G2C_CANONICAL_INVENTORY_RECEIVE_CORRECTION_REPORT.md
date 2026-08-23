# DARFUS ERP — Phase 03B-G2C Correction
# Single Canonical Inventory Receive Workflow Report

## Executive Summary

تم تنفيذ تصحيح واجهة G2C في المصدر دون إنشاء مسار استلام ثالث، مع الحفاظ على نفس Receive API وTax Engine وSupplier V2. شاشة Inventory أصبحت نقطة الإنشاء الوحيدة، ومسار Supplier القديم يعيد التوجيه إلى Inventory ولا يعرض نموذج استلام.

الاختبارات المركزة و`typecheck` ناجحة. تم تنفيذ استلام اصطناعي canonical واحد فقط على `darfus_erp` وفق موافقة المهمة. أثبتت قاعدة البيانات سلامة Asset/Barcode/Origin/Movement/Cost Revision/Payable/Journal، لكن سجل الاستلام كشف عدم تطابق بين Tax Preview الذي ظهر قبل الإرسال وبين Tax Snapshot المحفوظ. لذلك لا يُغلق G2C ولا يُسمح باعتبار Browser/Receive Acceptance السابق PASS.

**Gate: `BLOCKED_FINANCIAL_RECONCILIATION_OBSERVED_IN_CANONICAL_RUN`**

## Pre-change Baseline

| Item | Evidence |
|---|---|
| Official DB | `current_database() = darfus_erp`، PostgreSQL container `darfus-postgres` على host port 5433 |
| Runtime | Frontend `localhost:3000`، Backend `localhost:8000`، authenticated session موجودة |
| Existing legacy evidence | سجل قديم synthetic محفوظ، لكنه غير صالح كـG2C acceptance evidence |
| DB before this controlled receive | suppliers=1، active locations=1 ضمن الشركة/الفرع، existing purchase orders/assets=1/1 |
| Worktree | dirty قبل المهمة، مع تغييرات ومخرجات batches سابقة؛ لم يتم cleanup/reset/restore/stash |
| New controlled receive | واحد فقط، من Inventory canonical، لا يوجد Receive إضافي في هذه المهمة |

## Guardrail Alignment

- `darfus_erp` بقيت قاعدة التشغيل الرسمية؛ لم يتم إنشاء clone ولم يتم تبديل الهدف.
- لم تُنشأ Migration جديدة في هذه المهمة.
- لم يتم تشغيل restart للـBackend لأن أمر تشغيل الحاوية ينفذ migrations تلقائيًا.
- لم يتم تعديل `next-env.d.ts` أو تشغيل build.
- لا يوجد seed/provisioning جديد من هذه المهمة.
- بيانات الاختبار الاصطناعية الموجودة بقيت كما هي ولم تُحذف أو تُعدّل يدويًا.

## Canonical Receive UI

### Inventory screen

Browser read-only evidence على `http://localhost:3000/ar/inventory` أظهر:

- زرًا واحدًا: `إضافة / استلام مخزون`.
- Profile chooser: GBW وGBP متاحان؛ Diamond/Gem/Pearl disabled.
- مسار GBW: `/ar/inventory/gold-by-weight`.
- مسار GBP: `/ar/inventory/gold-by-piece`.

### Supplier screen

- `GET /ar/suppliers/purchases` يعيد التوجيه إلى `/ar/inventory`.
- لا يوجد Receive form على URL القديم.
- شاشة المورد `/ar/suppliers/SUP-001` تعرض بيانات المورد والتبويبات التاريخية، ولا تعرض `Receive Inventory From Supplier` أو Shortcut لإنشاء Receive.

### Shared section

كلا نموذجي GBW وGBP يعرضان نفس القسم:

- Supplier من DB.
- Location من DB داخل الشركة/الفرع الحالي.
- Purchase Date.
- Tax Treatment من سياسة الخادم، دون default ضريبي في UI.
- Server Tax Summary.
- Notes.
- RCM evidence checklist عند اختيار Reverse Charge.

لا توجد Payment fields في واجهة canonical؛ تظل defaults الداخلية للتوافق الخلفي فقط.

## Implementation Changes

### Shared canonical receive section

`components/inventory/shared-receive-section.tsx`

- أنشأ shared UI وstate للحقول المشتركة.
- يحوّل Tax Treatment إلى نفس contract الحالي (`applyVat`, `isRcm`, `rcmRate`, evidence/context).
- يعرض Tax Summary القادم من `/inventory-v2/receive-preview`.
- لا ينشئ Tax Engine أو Payment workflow جديدًا.

### Gold By Weight

`app/[locale]/(dashboard)/inventory/gold-by-weight/page.tsx`

- أُضيفت shared receive state وserver tax preview.
- Submit يستخدم `/purchase-orders/receive` مع `inventoryV2=true` و`perPiece` وshared tax/location fields.
- تم توحيد `goldValuation` داخل `receiveItem` المستخدم في preview وsubmit؛ هذا هو minimum safe source fix لسبب عدم التطابق المكتشف.
- زر Receive لا يفتح قبل اكتمال Supplier/Location/Tax/Preview/RCM evidence.

### Gold By Piece

`app/[locale]/(dashboard)/inventory/gold-by-piece/page.tsx`

- نفس shared receive contract ونفس canonical endpoint.
- لا تم نسخ GBW business formula؛ GBP business calculation بقي server-backed.

### Supplier routes/UI

- `app/[locale]/(dashboard)/suppliers/purchases/page.tsx`: redirect-only إلى Inventory.
- `app/[locale]/(dashboard)/suppliers/[id]/page.tsx`: إزالة receive shortcut.
- `app/[locale]/(dashboard)/suppliers/page.tsx`: إزالة link إلى مسار الإنشاء القديم.

### Backend contract exposure

- `backend/src/routes/gold-by-weight-profile.routes.js`
- `backend/src/routes/gold-by-piece-profile.routes.js`

أضيفت tax policy وsupplier tax metadata إلى profile contract؛ لم يتغير authority الخاص بالـReceive أو Accounting.

## Focused Tests

### Backend

Command run from `backend`:

```text
node --test tests/phase-03b-g2c-receive-tax-location.test.cjs tests/phase-03b-g2a1-tax-policy.test.cjs tests/phase-03b-g2a2-transaction-tax.test.cjs tests/phase-03b-g2b-location-management.test.cjs tests/inventory-authority-foundation-01a.test.cjs tests/gold-by-weight-profile-02.test.cjs tests/gold-by-piece-rate-calculation-03-r2.test.cjs tests/supplier-receive-profile-switch-async-preview-race-ux-fix-03.test.cjs
```

**45 passed / 0 failed**.

Coverage includes canonical tax/location contract, server company/branch authority, no free-text location, legacy URL redirect, profile calculations, Product quantity exclusion, and shared fields.

### Frontend

```text
node --test tests/unified-inventory-intake-ux-02-r3.test.cjs
```

**5 passed / 0 failed**.

### Typecheck

```text
npm run typecheck
```

**Passed**.

## Browser / Network / Backend Proof

| Proof | Result | Evidence |
|---|---|---|
| Inventory canonical entry | PASS | Arabic browser snapshot shows one Add/Receive button and chooser |
| GBW shared form | PASS | Supplier, DB Location, Purchase Date, Tax Treatment, Tax Summary, Notes visible |
| GBP shared form | PASS | Same shared section visible; profile-specific fields remain separate |
| Supplier legacy create URL | PASS | Redirected to `/ar/inventory`; no receive form |
| Supplier detail shortcut | PASS | No receive shortcut in browser snapshot |
| Profile gate | PASS | GBW/GBP enabled; Diamond/Gem/Pearl disabled |
| Backend focused contract proof | PASS | 45/45 focused tests |
| Network trace delivery | NOT COMPLETE | Browser binding exposed DOM proof; no separate retained request/console export was produced |
| Additional receive | NOT RUN | Intentionally not run; single controlled receive cap preserved |

The new source uses the same `/inventory-v2/receive-preview` and `/purchase-orders/receive` contracts. The live runtime was not restarted because its startup command runs migrations automatically.

## Controlled Canonical Receive Proof

One synthetic GBW receive was sent from Inventory only:

- Profile: `GOLD_BY_WEIGHT_JEWELLERY`.
- Supplier: `SUP-001`.
- DB Location: `LOC-9a10f58e-4207-4512-8824-7a7b06159151`.
- Tax Treatment: `STANDARD_VAT`.
- Quantity: one physical piece.
- Product identity: none.

Observed response included one PO, one Asset, and one generated barcode. No second receive was attempted.

## Database Reconciliation

Read-only queries against `darfus_erp` after the controlled receive:

| Assertion | Result | Evidence |
|---|---|---|
| Purchase order | PASS | `PO-1787085524743`, status `received` |
| Purchase order item | PASS | quantity=1, received_quantity=1, asset_id set, product_id NULL |
| Asset | PASS | one new `GOLD_BY_WEIGHT_JEWELLERY`, status `AVAILABLE`, company/branch/location/supplier linked |
| Barcode | PASS | `GWRNG21000002`, one active history row, revision 1 |
| Barcode uniqueness | PASS | assets=2, distinct barcodes=2, duplicate groups=0, blank barcode assets=0 |
| Asset origin | PASS | one `PURCHASE_ORDER` origin, `V2_RUNTIME_RECEIPT` |
| Cost revision | PASS | one current revision; supplier/source/purchase order item linked |
| Inventory movement | PASS | one `PURCHASE_RECEIVE`, target branch/location and PO source linked |
| Product physical stock | PASS | products=0; stock_movements=0; item product_id NULL |
| Counts after receive | PASS | purchase_orders=2, assets=2, origins=2, cost revisions=2, movements=2 |
| Idempotency record | PASS for submitted request | `purchase.receive`, status `succeeded`, status_code=201; key value intentionally omitted |

## Tax Snapshot / Financial Reconciliation

### Persisted snapshot

The new PO contains:

```text
tax_treatment = STANDARD_VAT
total = 2484.33000000
tax_base = 2366.0300
vat_rate = 5.000
input_vat_amount = 118.3000
requested/resolved = STANDARD_VAT
effective rate = 5
rounding scale = 2
rule = UAE-VATP043-2025-02-26
calculation = DARFUS-UAE-TAX-03B-G2A2-V1
```

### Finding G2C-FIN-001

| Field | Value |
|---|---|
| Layer | UI preview payload vs canonical receive calculation |
| Expected | Preview and submit use identical economic inputs and produce the same Tax Snapshot |
| Actual | Before the source correction, shared preview showed taxable base `2360.11` and VAT `124.22`; persisted submit snapshot was base `2366.03` and VAT `118.30` |
| Evidence | Browser run record plus read-only PO `PO-1787085524743` tax fields/snapshot |
| Root cause | GBW `receiveItem` used by preview did not include the `goldValuation` wrapper that submit already supplied; backend V2 calculation therefore consumed different inputs |
| Minimum safe source change | Add the same `goldValuation` inputs to the preview-side `receiveItem`; no formula or Tax Engine change |
| Current status | Source corrected; typecheck/tests pass. The already-created receive remains evidence of the pre-fix mismatch and is not reclassified as PASS |
| Classification | PRODUCT_DEFECT / FINANCIAL / ACCEPTANCE_GAP |
| Severity | P1 |

The persisted journal is internally balanced, but that does not erase the pre-submit UI mismatch. No manual correction, reversal, or second receive was attempted.

## Accounting / Payable Proof

Read-only DB evidence for the new PO:

- Journal: `JE-1787085524796`, status `posted`.
- Source: `purchase_order / PO-1787085524743`.
- Total debit = `2484.33`; total credit = `2484.33`; 3 lines.
- Inventory debit = `2366.03`.
- Input VAT debit = `118.30`.
- Supplier payable credit = `2484.33`.
- Company and branch match the Asset and PO context.
- Payment rows remain 0; no payment UI was presented.

Accounting authority was preserved; no journal logic was redesigned.

## Legacy Compatibility

| Legacy Consumer | Final profile blocked? | Non-final compatibility preserved? | Evidence |
|---|---:|---:|---|
| Supplier purchase page URL | Yes, redirect-only | N/A for create UI | Browser redirect and focused test |
| Supplier detail receive shortcut | Yes, removed | N/A | Browser snapshot and source test |
| Legacy non-final Product workflows | No change intended | Static scope preserved | 01A compatibility tests pass |
| Canonical V2 receive | No | Yes | New Asset/Barcode/Movement/Journal evidence |

The old synthetic receive was not deleted and was not used as acceptance proof.

## Files Changed for G2C

Intentional G2C-touch files (the worktree also contained substantial pre-existing batch drift; no cleanup was performed):

- `components/inventory/shared-receive-section.tsx`
- `app/[locale]/(dashboard)/inventory/gold-by-weight/page.tsx`
- `app/[locale]/(dashboard)/inventory/gold-by-piece/page.tsx`
- `app/[locale]/(dashboard)/suppliers/[id]/page.tsx`
- `app/[locale]/(dashboard)/suppliers/page.tsx`
- `app/[locale]/(dashboard)/suppliers/purchases/page.tsx`
- `backend/src/routes/gold-by-weight-profile.routes.js`
- `backend/src/routes/gold-by-piece-profile.routes.js`
- `backend/tests/inventory-authority-foundation-01a.test.cjs`
- `backend/tests/supplier-receive-profile-switch-async-preview-race-ux-fix-03.test.cjs`
- `tests/unified-inventory-intake-ux-02-r3.test.cjs`
- `docs/DARFUS_PHASE_03B_G2C_CANONICAL_INVENTORY_RECEIVE_CORRECTION_REPORT.md`

Migrations created by G2C: **0**.

## Risk / Regression Matrix

| ID | Risk | Severity | Status | Blocks G2C close? |
|---|---|---:|---|---:|
| G2C-FIN-001 | Preview/submit tax reconciliation mismatch observed in the controlled run | P1 | Source minimum fix applied; run artifact remains mismatched | Yes |
| G2C-UX-001 | Duplicate Supplier receive creation path | P1 | Corrected; legacy URL redirects and shortcut removed | No |
| G2C-DATA-001 | Location could be free text or wrong branch | P1 | Guarded by DB-backed server location contract | No |
| G2C-INV-001 | Product quantity could become physical authority | P1 | V2/Product exclusion tests and DB evidence pass | No |
| G2C-OBS-001 | Separate retained browser network/console export absent | P3 | Not fabricated; must be collected in the next approved rerun | Yes for full acceptance evidence |

## Gate

```text
G2C_CANONICAL_RECEIVE_UI_CORRECTION = IMPLEMENTED
SINGLE_RECEIVE_ENTRY_POINT = YES
SUPPLIER_RECEIVE_CREATE_UI = REMOVED
LEGACY_SUPPLIER_RECEIVE_WORKFLOW = NOT_AUTHORITY
GBW_SHARED_RECEIVE_FIELDS = PRESENT
GBP_SHARED_RECEIVE_FIELDS = PRESENT
DB_LOCATION_AUTHORITY = PASS
SUPPLIER_V2_PATH = PASS
ASSET_BARCODE_MOVEMENT_ORIGIN_COST = PASS
PRODUCT_QUANTITY_PHYSICAL_AUTHORITY = NOT_USED
ACCOUNTING_JOURNAL_BALANCE = PASS
TAX_SNAPSHOT_INTERNAL_BALANCE = PASS
TAX_PREVIEW_TO_SNAPSHOT_RECONCILIATION = BLOCKED
NETWORK_CONSOLE_ACCEPTANCE_EVIDENCE = INCOMPLETE
G2C_FINAL_CLOSED = NO
GATE = BLOCKED_FINANCIAL_RECONCILIATION_OBSERVED_IN_CANONICAL_RUN
```

## Next Recommended Step

1. Owner review of `G2C-FIN-001` and the one existing synthetic PO.
2. After explicit approval only: verify the current running backend/source alignment and perform a read-only preview reconciliation using the corrected payload; do not create another receive unless separately authorized.
3. If the Owner requires final acceptance, run the controlled proof with retained network/console evidence and an explicitly approved data-handling decision for the existing synthetic record.

No automatic next batch was started.

## Final Tokens

```text
CURRENT_BATCH = DARFUS-PHASE-03B-G2C-CANONICAL-INVENTORY-RECEIVE-CORRECTION
MODE = MINIMUM_SAFE_CORRECTION_WITH_READ_ONLY_FORENSIC_AND_ONE_CONTROLLED_SYNTHETIC_RECEIVE
OFFICIAL_DATABASE = darfus_erp
OFFICIAL_DB_MUTATION_THIS_BATCH = ONE_OWNER_APPROVED_SYNTHETIC_CANONICAL_RECEIVE
ADDITIONAL_RECEIVES_THIS_BATCH = 0
MIGRATIONS_CREATED = 0
SINGLE_RECEIVE_ENTRY_POINT = YES
SUPPLIER_RECEIVE_CREATE_UI = REMOVE
LEGACY_SUPPLIER_RECEIVE_WORKFLOW = NOT_AUTHORITY
GBW_SHARED_SECTION = IMPLEMENTED
GBP_SHARED_SECTION = IMPLEMENTED
SERVER_DB_LOCATION = IMPLEMENTED
TAX_ENGINE_DUPLICATED_IN_UI = NO
PRODUCT_QUANTITY_PHYSICAL_AUTHORITY = NO
ASSET_BARCODE_AUTHORITY = PRESERVED
ACCOUNTING_AUTHORITY = PRESERVED
IDEMPOTENCY_AUTHORITY = PRESERVED
FOCUSED_BACKEND_TESTS = 45
FOCUSED_BACKEND_TESTS_PASS = 45
FOCUSED_FRONTEND_TESTS = 5
FOCUSED_FRONTEND_TESTS_PASS = 5
TYPECHECK = PASS
NEW_CANONICAL_RECEIVE_CREATED = YES
NEW_CANONICAL_RECEIVE_DB_PERSISTENCE = PASS
NEW_CANONICAL_RECEIVE_TAX_RECONCILIATION = BLOCKED
KNOWN_P1 = G2C-FIN-001_PREVIEW_SUBMIT_TAX_MISMATCH
G2C_FINAL_CLOSED = NO
GATE = BLOCKED_FINANCIAL_RECONCILIATION_OBSERVED_IN_CANONICAL_RUN
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**G2C correction report complete → OWNER REVIEW → PRIORITY DECISION → STOP.**
