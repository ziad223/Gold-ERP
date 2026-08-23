# DARFUS ERP — POS JournalPreview COGS / Inventory Surgical Closure V2

Control ID: `DARFUS-POS-JOURNAL-PREVIEW-P2-SURGICAL-CLOSURE-V2`  
Mode: read-only JournalPreview correction; no Checkout/Sale execution.

## 1. Executive Summary

تم إصلاح مصدر معاينة القيد في POS بحيث يعرض نتيجة الخادم فقط. قبل التعديل كان `JournalPreview.tsx` يعيد بناء الحسابات والمبالغ داخل React من `total/tax/cost`، ولذلك لم يكن COGS/Inventory مرتبطًا مباشرة بعقد المحاسبة الخادمي.

تم اعتماد المسار الخادمي الموجود `/api/v1/pricing/calculate` كمعاينة قراءة فقط. صار المسار يقيّد الأصول بالـCompany والـBranch، ويستخدم `Asset.cost` server-side، ثم يحل الحسابات من Branch financial mappings عبر `financialAccountResolver`. لم يتغير Checkout أو posting، ولم يُنفذ Checkout.

النتيجة المثبتة في Browser AR وEN على Asset متاح موجود مسبقًا: Base `AED 200.00`، VAT `AED 28.00`، Total `AED 228.00`، COGS `AED 100.00`، Inventory `AED 100.00`، وإجمالي المدين والدائن `AED 328.00` لكل جانب.

## 2. Proven Root Cause

| Finding | Evidence | Classification |
|---|---|---|
| المعاينة كانت client-built | `features/accounting/components/JournalPreview.tsx` كان يقبل `total`, `tax`, `cost`, `paymentMethod` ويبني الخطوط وأسماء الحسابات محليًا | PRODUCT_DEFECT / ACCOUNTING |
| COGS كان يعتمد على `provisionalCost` المحلي | POS كان يمرر `cost={provisionalCost}` بدل رد خادمي | PRODUCT_DEFECT / INVENTORY |
| أسماء الحسابات لم تكن Branch-resolved | المكون القديم كان يضع أسماء ثابتة مثل `Cost of Goods Sold (Gold)` و`Asset Inventory (Gold Stock)` | PRODUCT_DEFECT / FINANCIAL |
| الخادم كان يملك معاينة قابلة لإعادة الاستخدام | `/pricing/calculate` ينادي `postingService.previewInvoiceLines` ويحسب السعر/الضريبة/التكلفة من الخادم | DESIGN_LIMITATION corrected |

لم يُثبت أي خلل في معادلات البيع أو في COGS posting نفسه؛ العيب كان في طبقة العرض ومصدر بيانات المعاينة.

## 3. Existing Checkout Accounting Authority

- مسار البيع القانوني هو `POST /api/v1/pos/checkout` عبر `executeCanonicalSale`.
- في مسار Asset، الخادم يحل الأصل داخل Company، ويفرض Branch، ويضع `validatedItems[].cost = Number(asset.cost) || 0`.
- `InvoiceItem.cost` يأخذ قيمة `validatedItems[].cost`.
- `postingService.postInvoiceEntry` يجمع `InvoiceItem.cost * quantity` لبناء COGS/Inventory.
- `postingService.postEntry` يحل الحسابات قبل أي Journal write بواسطة `financialAccountResolver.resolvePostingAccount`.
- رموز الحسابات القياسية الحالية (`1110/1120/1300/4100/2200/5000/1200`) تتحول إلى semantic Branch mapping عبر `POSTING_CODE_ROLE` و`BRANCH_MAPPING_CATALOG`؛ لا توجد أسماء الحسابات أو أكوادها في المتصفح كسلطة مالية.

هذا المسار لم يتغير ولم يُنفذ في هذا Control.

## 4. Chosen Preview Architecture

`CHOSEN_PREVIEW_ARCHITECTURE = OPTION_A`

تمت إعادة استخدام endpoint القراءة الموجود:

`POST /api/v1/pricing/calculate`

الـendpoint يحسب السعر والضريبة والتكلفة من الخادم، ويرجع `journalPreview`. لا ينشئ Invoice أو Payment أو CashTransaction أو Journal أو Movement أو Idempotency business claim.

واجهة `JournalPreview` أصبحت renderer لعقد `ServerJournalPreview` فقط. لا تحسب totals، ولا تختار الحسابات، ولا تقبل cost أو tax أو accounts من العميل.

## 5. Source Changes

التغييرات المقصودة لهذا Control:

1. `app/[locale]/(dashboard)/pos/page.tsx`
   - احتفاظ بـ`journalPreview` القادم من `calculatePricing`.
   - تمرير `preview={journalPreview}` فقط.
   - عند فشل/غياب الرد تعرض المعاينة `Unavailable` بدل اعتبارها صفرًا أو غير متزنة.
2. `features/accounting/components/JournalPreview.tsx`
   - إزالة الحساب المحلي للخطوط والحسابات.
   - عرض خطوط ومجاميع وبalance الخادم فقط.
   - unknown/null لا يتحول إلى zero.
3. `features/sales/hooks/use-pos.ts`
   - إضافة نوع `ServerJournalPreview` إلى نتيجة pricing.
4. `backend/src/routes/erp.routes.js`
   - إلزام `/pricing/calculate` بفرع مصرح به.
   - تقييد Product/Asset reads بالـCompany والـBranch.
   - حل كل حساب preview بواسطة `financialAccountResolver` قبل إرسال الرد.
   - لا توجد عملية create/update/save/destroy في مقطع المعاينة.
5. `tests/pos-journal-preview-p2.test.cjs`
   - focused contract/authority tests.

لا توجد Migration أو Seed أو تعديل Settings أو RBAC.

## 6. Security / Scope

- Company/Branch authority بقيت server-side.
- client لا يرسل ولا يحدد account IDs أو COGS أو Inventory cost أو VAT amount أو tax rate كسلطة.
- `paymentMethod` يظل اختيارًا تشغيليًا، لكن الحساب الناتج يحدده الخادم من mapping.
- لا توجد صلاحيات جديدة.
- لم يُنفذ `/pos/checkout`، ولم تُلمس أي Sale/Return/Reservation/Payment workflow.
- لا يوجد API key أو secret في التقرير.

## 7. Focused Tests

`node --test tests/pos-journal-preview-p2.test.cjs` → **3/3 PASS**

أثبتت الاختبارات:

- JournalPreview يعرض عقد الخادم ولا يقبل مدخلات مالية محلية.
- pricing preview read-only وBranch-scoped وserver-resolved accounts.
- COGS وInventory يساويان نفس server-resolved cost، والقيد متزن.

`npm run typecheck` → **PASS**  
`node --check backend/src/routes/erp.routes.js` → **PASS**

## 8. Regression

- Stage C POS financial integration: **PASS**.
- Asset final closure: **PASS**.
- Barcode final closure: **PASS**.
- Financial bootstrap contract suites 1–4: **PASS**.
- G3 financial reconciliation contract: **PASS**.
- POS Asset status mapping: **PASS**.
- Authorization/Branch/security focused suites: **17/17 PASS**.
- Combined in-scope run: **71/71 relevant tests PASS**.

ملاحظة غير مرتبطة بالتعديل: `tests/full-regression-f003-assets-branch-context.test.mjs` فشل بافتراض قديم يبحث عن `useCoreErpData({ resources: ["products"] })` في شاشة Inventory؛ المصدر الحالي يستخدم `useInventoryV2List`. لم يتغير هذا الملف أو شاشة Inventory في هذا Control. هذا **P3 pre-existing stale test contract** وليس P0/P1 أو blocking P2 ناتجًا عن التعديل الحالي.

## 9. DB Zero-Write Proof

Official target was read-only verified as `current_database = darfus_erp`.

Read-only post-proof after backend refresh and AR/EN preview:

| Table | Count |
|---|---:|
| purchase_orders | 14 |
| purchase_order_items | 14 |
| assets | 14 |
| invoices | 1 |
| invoice_items | 1 |
| payments | 1 |
| cash_transactions | 4 |
| journal_entries | 18 |
| journal_lines | 53 |
| inventory_asset_movements | 20 |
| idempotency_requests | 34 |

These counts align with the pre-control Stage E official baseline for the business-level rows. No business endpoint was called except read-only search and pricing preview. Backend logs show no `/pos/checkout` request and no mutation route for this control.

`OFFICIAL_DB_BUSINESS_WRITES_THIS_CONTROL = 0`

The single known historical unbalanced journal from the prior baseline remains preserved and was not modified.

## 10. Runtime Parity

Backend was rebuilt/recreated through the normal Docker Compose backend service because backend route source changed. No migration was created or applied; startup reported: `No migrations were executed, database schema was already up to date.`

| Check | Result |
|---|---|
| `GET /api/v1/health` | 200 |
| `GET /api/v1/health/db` | 200 |
| `GET /api/v1/health/redis` | 200 |
| Frontend `/en/pos` | 200 |
| Frontend `/ar/pos` | 200 |
| `GET /api/v1/pos/search?...PLLOS00000001` | 304, completed |
| `POST /api/v1/pricing/calculate` | 200, completed |

The selected asset was pre-existing `PLLOS00000001`; it was added only to the browser cart for client-side preview inspection. No checkout action occurred.

## 11. AR/EN Browser Proof

### English

- URL: `http://localhost:3000/en/pos`
- `lang=en`, `dir=ltr`.
- One available Asset selected by barcode in the client cart.
- `Automatic Double-Entry Journal Preview` displayed.
- `Balanced` displayed.
- COGS `AED 100.00` debit.
- Asset Inventory `AED 100.00` credit.
- Debit total `AED 328.00`; credit total `AED 328.00`.
- Console warnings/errors: none.

### Arabic

- URL: `http://localhost:3000/ar/pos`
- `lang=ar`, `dir=rtl`.
- Same read-only Asset preview.
- `متزن` displayed.
- COGS and Inventory displayed at `100.00` for the same server cost.
- Debit and credit totals displayed equally at `328.00`.
- Console warnings/errors: none.

No Checkout, print, payment, confirmation, or sale button was clicked.

## 12. Stage C Posting Parity Reference

The preview and existing post path now have the same evidence-backed financial boundary:

`Asset.cost` → server pricing cost → `postingService.previewInvoiceLines` COGS/Inventory → existing `postInvoiceEntry` cost aggregation → existing `postEntry` Branch financial resolver.

This is parity of source and mapping, not a new posting implementation. The preview remains read-only and the sale posting remains independent.

## 13. Remaining Risks

1. The pre-existing F003 test contract is stale against the current Inventory V2 hook and should be handled in a separate owner-approved regression-maintenance batch.
2. `postingService.previewInvoiceLines` remains a pure preview builder and does not post; final journal proof remains the responsibility of the existing Checkout path, which was intentionally not executed here.
3. The known historical unbalanced journal remains unchanged as required by prior authority; it is not produced by this preview.

No P0 or P1 issue was introduced. `P2_BLOCKING_COUNT = 0`. The stale F003 test is P3 and outside this surgical scope.

## 14. Gate

| Gate item | Result |
|---|---|
| P2 POS JournalPreview COGS | PASS |
| P2 POS JournalPreview Inventory | PASS |
| Server preview authority | PASS |
| Preview/Checkout cost and account parity | PASS |
| Checkout business logic changed | NO |
| Checkout posting logic changed | NO |
| Checkout executed | NO |
| Official DB business writes | 0 |
| Focused P2 tests | PASS |
| Stage C regression | PASS |
| Financial regression | PASS |
| Security regression | PASS |
| Typecheck | PASS |
| Node check | PASS |
| P0 | 0 |
| P1 | 0 |
| Blocking P2 | 0 |

`GATE = PASS_POS_JOURNAL_PREVIEW_COGS_INVENTORY_P2_CLOSURE`

## 15. Final Tokens

```text
CURRENT_CONTROL = DARFUS-POS-JOURNAL-PREVIEW-P2-SURGICAL-CLOSURE-V2
LOCAL_MAIN_DB = darfus_erp

ROOT_CAUSE = Client JournalPreview rebuilt the journal locally from provisional totals/cost and static labels instead of rendering the server preview contract.
CURRENT_PREVIEW_INPUT = Server-resolved Company/Branch-scoped Asset/Product pricing and cost; client supplies only item identifiers and operational pricing inputs.
CHECKOUT_COST_SOURCE = validatedItems[].cost from server Asset.cost for Asset sales; Product.unitCost remains legacy Product authority only.
CHECKOUT_ACCOUNTING_BUILDER = postingService.postInvoiceEntry -> postEntry
CHECKOUT_ACCOUNT_MAPPING = financialAccountResolver.resolvePostingAccount via POSTING_CODE_ROLE and Branch financial mappings

CHOSEN_PREVIEW_ARCHITECTURE = OPTION_A
PREVIEW_ENDPOINT = POST /api/v1/pricing/calculate
SOURCE_CHANGES = POS page, JournalPreview renderer, usePos pricing type, branch-scoped pricing route, focused P2 test, this report
MIGRATION = NONE_CREATED_OR_EXECUTED
RBAC_CHANGE = NO

FOCUSED_P2_TESTS = PASS_3_OF_3
STAGE_C_REGRESSION = PASS
FINANCIAL_REGRESSION = PASS
SECURITY_REGRESSION = PASS_17_OF_17
TYPECHECK = PASS
NODE_CHECK = PASS

BACKEND_RUNTIME_PARITY = PASS
FRONTEND_RUNTIME_PARITY = PASS
AR_PREVIEW = PASS
EN_PREVIEW = PASS

PREVIEW_CASH = AED 228.00
PREVIEW_REVENUE = AED 200.00
PREVIEW_VAT = AED 28.00
PREVIEW_COGS = AED 100.00
PREVIEW_INVENTORY = AED 100.00
PREVIEW_DEBIT_TOTAL = AED 328.00
PREVIEW_CREDIT_TOTAL = AED 328.00
PREVIEW_DIFFERENCE = AED 0.00
PREVIEW_BALANCED = TRUE

SERVER_POSTING_PARITY_REFERENCE = PASS: same Asset.cost source and same server financial account resolver boundary; no posting executed

CHECKOUT_BUSINESS_LOGIC_CHANGED = NO
CHECKOUT_POSTING_LOGIC_CHANGED = NO
CHECKOUT_EXECUTED = NO

NEW_INVOICE = 0
NEW_PAYMENT = 0
NEW_CASH_TRANSACTION = 0
NEW_JOURNAL = 0
NEW_ASSET_EVENT = 0
NEW_MOVEMENT = 0
OFFICIAL_DB_BUSINESS_WRITES_THIS_CONTROL = 0

P0_COUNT = 0
P1_COUNT = 0
P2_BLOCKING_COUNT = 0
P3_COUNT = 1_PRE_EXISTING_STALE_F003_TEST

GATE = PASS_POS_JOURNAL_PREVIEW_COGS_INVENTORY_P2_CLOSURE

STAGE_A_STATUS = CLOSED
STAGE_B_STATUS = CLOSED
STAGE_C_STATUS = CLOSED
STAGE_D_STATUS = CLOSED
STAGE_E_STATUS = CLOSED
NEXT_RECOMMENDED_STEP = STAGE_F_DOCUMENTATION_AND_HANDOVER
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. No Checkout, Sale, Payment, Return, Refund, Void, mutation proof, migration, seed, or automatic next batch was started.
