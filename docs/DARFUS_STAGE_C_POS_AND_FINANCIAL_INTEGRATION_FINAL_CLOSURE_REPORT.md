# DARFUS ERP — Stage C POS & Financial Integration Final Closure Report

تم تنفيذ فحص Stage C وتصحيح فجوتين مثبتتين في المصدر فقط. نجحت اختبارات POS المركزة، وفحص TypeScript، وقراءة AR/EN من الـPOS، وصحة backend/DB/Redis. لم يتم إنشاء Customer أو Asset، ولم يتم تنفيذ Checkout أو أي كتابة تجارية على `darfus_erp`. فشل الإغلاق النهائي لأن بيانات التشغيل المطلوبة للبيع غير متاحة: `customers = 0`، والفرع النشط `Branch-1` لا يحتوي أصلًا متاحًا بسعر بيع موجب.

## 1. Executive Summary

- `darfus_erp` بقي بدون business writes: لا Invoice ولا Payment ولا Journal ولا Asset sale ولا Product quantity mutation.
- تم تنفيذ lookup عميل بالهاتف كعملية GET مقيدة بالشركة، مع منع الإنشاء التلقائي ورابط إلى شاشة العملاء canonical عند عدم العثور.
- تم عزل `item.price`, `sellingPrice`, و`salePrice` المرسلة من العميل عن تسعير Asset على الخادم؛ المسار غير المرتبط بملفات التسعير يستخدم `Asset.price` فقط، والمسارات ذات التسعير profile-specific تفقد overrides العميل قبل حساب الخادم.
- لا توجد حاجة إلى Migration أو تغيير RBAC أو تغيير Tax Engine.
- تم التوقف قبل بناء Cart صالح وقبل Confirmation/Checkout حسب بوابة Stage C.

## 2. Current POS / Financial Authority

| Concern | Authority | Evidence | Result |
|---|---|---|---|
| Canonical UI | `app/[locale]/(dashboard)/pos/page.tsx` | `/ar/pos` and `/en/pos` loaded | PASS |
| Canonical sale boundary | `executeCanonicalSale` in `backend/src/routes/erp.routes.js` | `POST /pos/checkout` route is transaction/idempotency guarded | PASS, not invoked |
| Asset sale identity | Asset lookup by company, branch and status | route locks Asset and rejects unavailable/cross-branch assets | PASS by source |
| Physical quantity | Product quantity is not serialized Asset authority | final-profile Product guard remains in route | PASS by source |
| Invoice/payment | Invoice, InvoiceItem, Payment and treasury posting inside canonical sale transaction | `erp.routes.js`, `sales.service.js`, `posting.service.js` | NOT REACHED |
| Customer | Customer is mandatory at canonical sale boundary | `if (!customerId)` and company-scoped Customer lookup | PASS by source; data unavailable |
| Idempotency | `idempotency.service.js` stable canonical body hash, same-key replay/conflict | route claims before business work | NOT REACHED |

The client/source documents and frozen continuity authority require server totals, dynamic Company Tax Policy, Asset price authority, customer selection, one canonical sale path, atomic posting, and duplicate protection. No historical Stage B control was reopened.

## 3. Customer Phone Lookup

### Gap confirmed before the change

The POS had only a customer `<select>` loaded from `/customers`. With the official DB containing no customers, the cashier had no phone lookup and no explicit canonical create-customer path from POS.

### Minimum safe change

- Added pure normalizer: `backend/src/services/customer-phone.service.js`.
- Added read-only route: `GET /api/v1/pos/customer-lookup` in `backend/src/routes/erp.routes.js`.
- Scope: `company_id = req.companyId`, active customers only, soft-deleted rows excluded, normalized phone match, limit 2.
- One match selects the existing customer in POS.
- No match returns a safe not-found response and the UI links to `/customers`.
- More than one normalized match returns stable `CUSTOMER_PHONE_AMBIGUOUS` with HTTP 409.
- No customer creation, update, audit mutation, or branch/customer mutation is performed by this route.
- The current Customers form does not expose a proven prefill contract; therefore entered phone is not silently injected into a new customer form.

### Browser evidence

- AR `/ar/pos`: synthetic phone `000000001` returned `لم يتم العثور على عميل بهذا الرقم` and displayed `إنشاء عميل من شاشة العملاء`.
- EN `/en/pos`: the same synthetic phone returned `No customer was found for this phone number` and displayed `Create the customer from Customers`.
- Checkout remained disabled; no customer was created.
- No console errors were observed in either browser journey.

## 4. Barcode / Asset / Price Authority

- POS search remains bounded, authenticated, company/branch scoped, and Asset-aware.
- Available Asset status is the operational source for serialized sale eligibility.
- Canonical sale still rejects Product payloads for final serialized profiles.
- The client cannot override Asset sale price through `item.price`, `sellingPrice`, or `salePrice` on the changed Asset path.
- Current official DB evidence:

| Item | Value |
|---|---|
| Total Assets | 14 |
| Active barcode-history rows | 14 |
| Products | 0 |
| Branch-1 available Asset | `AST-PUR-1787083585731-1-1-plz5` |
| Branch-1 barcode | `GWRNG21000001` |
| Branch-1 operational status | `AVAILABLE` / available projection |
| Branch-1 Asset.price | `0` |
| Positive-price saleable examples | Present under Branch-2, not current Branch-1 context |

The Branch-1 Asset cannot be used for a real sale because the server fail-closed price guard requires a positive sale amount. No branch switch or price mutation was performed.

## 5. Tax Authority

- Current Company Tax Policy read-only value: `vatRate = 14`.
- Current default treatment: `STANDARD_VAT`.
- Enabled treatments include `STANDARD_VAT`, `EXEMPT`, `REVERSE_CHARGE`, and `OUT_OF_SCOPE`.
- The POS displays dynamic `VAT (14%)`; no Stage C code change hardcodes a tax rate.
- Tax Engine and transaction snapshot authority were not changed.
- No sale occurred, so taxable base, VAT snapshot, grand total, invoice tax snapshot, and journal tax lines are `NOT_REACHED`.

## 6. Confirmed Gaps / Source Changes

Only these files were intentionally changed for Stage C:

| File | Change | Scope |
|---|---|---|
| `backend/src/services/customer-phone.service.js` | New pure phone normalizer | Customer lookup support only |
| `backend/src/routes/erp.routes.js` | Read-only phone lookup; remove client price overrides; use server Asset price for non-profile-specific Asset sale | Narrow backend authority guard |
| `app/[locale]/(dashboard)/pos/page.tsx` | Phone lookup input/button, not-found message, canonical Customers link | UI only; no customer mutation |
| `tests/stage-c-pos-financial-integration.test.cjs` | Three focused source/normalizer tests | Test-only |

The worktree was already heavily dirty before Stage C. Current read-only status snapshot: 101 tracked modified entries and 1,572 untracked entries. The existing dirty changes in `erp.routes.js` and POS files were not treated as wholly Stage C-owned; no cleanup, reset, restore, stash, add, commit, or push was performed.

## 7. Migration / RBAC

- `MIGRATION_CREATED = NO`.
- `SequelizeMeta = 91` before and after the runtime check; no pending schema change was introduced.
- No seed, provisioning, master-data insertion, VAT/settings mutation, or database repair was run.
- Lookup uses existing authenticated business permissions: `pos.view` or `pos.sell`.
- Canonical checkout permission/operator policy remains unchanged.
- The normal backend container refresh used the existing Compose startup path; no migration file was created and the migration count remained unchanged.

## 8. Focused Tests / Regression

### Stage C focused test

Command:

```text
node --test tests/stage-c-pos-financial-integration.test.cjs
```

Result: **3 passed, 0 failed**.

Coverage:

- deterministic phone normalization;
- company-scoped read-only lookup, required/ambiguous errors, and no create path;
- client sale-price override isolation and Asset price authority.

### Relevant regression set

Command:

```text
node --test backend/tests/pos-redesign-phase-02-universal-search-customer.test.cjs backend/tests/pos-asset-status-mapping-surgical-correction.test.cjs backend/tests/cgp-asset-pos-selling-price-and-editable-metadata.test.cjs backend/tests/customer-master-phase-03-pos-customer-summary.test.cjs tests/complete-sale-branch-account-resolver.test.cjs
```

Result: **23 passed, 0 failed**.

Also passed:

```text
node --check backend/src/routes/erp.routes.js
npm run typecheck
```

## 9. Runtime Parity

| Service | Result | Evidence |
|---|---|---|
| Frontend | PASS | Existing `localhost:3000` runtime served refreshed AR/EN POS source; no second frontend started |
| Backend | PASS | `localhost:8000/api/v1/health` returned HTTP 200 / UP after refresh |
| PostgreSQL | PASS | `/api/v1/health/db` returned HTTP 200 / PostgreSQL connected |
| Redis | PASS | `/api/v1/health/redis` returned HTTP 200 / Redis connected |
| AR POS | PASS read-only | Correct POS screen, Branch-1 context, phone lookup and not-found UI |
| EN POS | PASS read-only | Correct POS screen, Branch-1 context, phone lookup and not-found UI |
| Browser console | PASS observed | No error entries observed in the two lookup journeys |

The frontend process already serving port 3000 was reused. No alternate frontend was started.

## 10. Pre-Checkout Exact Proof

| Gate item | Expected | Actual | Status |
|---|---|---|---|
| Company context | Gold ERP | Gold ERP | PASS |
| Branch context | Authorized active branch | Branch-1 | PASS |
| Customer | Existing active company customer | 0 customers in official DB | BLOCKED |
| Customer phone lookup | Exact read-only lookup | No match for synthetic `000000001`; create link shown | PASS / BLOCKED DATA |
| Barcode/Asset | One available Asset in active branch | `GWRNG21000001` / `AST-PUR-1787083585731-1-1-plz5` | PASS identity |
| Asset price | Positive server-authoritative price | `0` | BLOCKED |
| Cart | One accepted sale item | Not built | NOT_REACHED |
| Payment | Valid canonical payment plan | Not selected for a valid cart | NOT_REACHED |
| Tax base/VAT/total | Server-calculated | Not reached | NOT_REACHED |
| Final checkout payload | Ready and reviewed | Not produced | NOT_REACHED |
| Checkout button | Enabled only after all gates | Disabled | PASS fail-closed |
| `POST /api/v1/pos/checkout` | No request before Owner confirmation | 0 requests | PASS |

## 11. Owner Confirmation

`OWNER_CONFIRMATION = NOT_OBTAINED`.

The Stage C control requires a literal Owner confirmation immediately before one real checkout. That confirmation gate was not reached because the data prerequisites are absent. No checkout was attempted.

Precise setup request for a later controlled attempt:

1. Approve/use one existing active company Customer; do not auto-create it during checkout.
2. Either make an approved existing positive-price Asset available in the selected Branch-1 context, or explicitly approve switching the controlled browser context to Branch-2 where existing positive-price Assets are present.
3. After those prerequisites are confirmed, rebuild one cart and stop again at the literal Owner confirmation gate. No checkout is authorized by this report.

## 12. One Real Checkout

- `CHECKOUT_EXECUTED = NO`.
- `POST /api/v1/pos/checkout = 0`.
- No confirmation click was made.
- No sale, Invoice, Payment, CashTransaction, Journal, Asset status transition, inventory movement, or idempotency business result was created.

## 13. Successful Sale Inventory Proof

Not reached because the pre-checkout customer and positive-price Asset gates failed. No Asset status, barcode, cost, origin, valuation, or movement was changed.

## 14. Successful Financial Proof

Not reached. No invoice tax snapshot, receivable/cash posting, VAT posting, revenue posting, COGS posting, or balanced sale journal was created.

## 15. Idempotency Proof

Source-level authority is present and tested indirectly through the existing route/service contract: stable request hash, same-key replay handling, and changed-payload conflict handling. Runtime replay was **NOT_REACHED** because no original checkout request was allowed or generated.

Expected later proof remains:

- exact same key + exact same body → replay without duplicate effects;
- same key + changed body → conflict;
- no duplicate payment, journal, or inventory event.

## 16. Receipt / Readback Proof

Not reached. No AR or EN sale receipt exists for this Stage C attempt. AR/EN POS screen labels and customer lookup messages were read successfully.

## 17. Return / Void Boundary

No return, refund, void, or reversal was executed. These remain separately owned canonical workflows.

## 18. Final DB / Integrity

Read-only post-check snapshot:

| Table / state | Count |
|---|---:|
| `customers` | 0 |
| `purchase_orders` | 14 |
| `purchase_order_items` | 14 |
| `assets` | 14 |
| `asset_barcode_history` | 14 |
| `inventory_asset_movements` | 19 |
| `invoices` | 0 |
| `invoice_items` | 0 |
| `payments` | 0 |
| `journal_entries` | 17 |
| `journal_lines` | 48 |
| `cash_transactions` | 3 |
| `idempotency_requests` | 33 |
| `products` | 0 |
| `SequelizeMeta` | 91 |

`DB_BUSINESS_WRITES = 0` by controlled action scope. The counts are consistent with the pre-Stage-C read-only baseline; no delta was introduced by the browser lookup or runtime refresh.

## 19. Remaining Risks / Priority

| ID | Issue | Severity | Priority | Classification | Blocks Stage C checkout? |
|---|---|---|---|---|---|
| C-P1-001 | No active Customer exists in official DB | Critical readiness gap | P1 | MISSING_MASTER_DATA / ACCEPTANCE_GAP | YES |
| C-P1-002 | Active Branch-1 has no positive-price saleable Asset | Critical readiness gap | P1 | DB_STATE / INVENTORY / ACCEPTANCE_GAP | YES |
| C-P2-001 | Customer form does not have a proven phone-prefill route from POS | Non-blocking workflow limitation | P2 | UX / ACCEPTANCE_GAP | No, manual canonical creation/selection remains possible |
| C-P3-001 | Direct browser resource timing capture was unavailable in the browser surface | Observability limitation | P3 | OBSERVABILITY | No |
| C-BASE-001 | One known historical unbalanced journal exists from earlier controls | Historical exception | P1 historical | FINANCIAL / DB_STATE | Not reproduced or changed by Stage C |

No P0 issue was introduced. The P1 readiness blockers are data prerequisites, not a new checkout mutation defect.

## 20. Final Tokens

```text
CURRENT_CONTROL = DARFUS-STAGE-C-POS-AND-FINANCIAL-INTEGRATION-MINIMUM-SAFE-IMPLEMENTATION-AND-CLOSURE
LOCAL_MAIN_DB = darfus_erp
STAGE_C_CONTROL_FULL_READ = YES
POS_UI_AUTHORITY = app/[locale]/(dashboard)/pos/page.tsx
POS_API_AUTHORITY = backend/src/routes/erp.routes.js
SALE_DB_MODEL = Invoice + InvoiceItem
PAYMENT_DB_MODEL = Payment + CashTransaction where applicable
CUSTOMER_PHONE_LOOKUP = IMPLEMENTED_READ_ONLY_GET
TEST_CUSTOMER = NONE
TEST_CUSTOMER_PHONE = 000000001_NOT_FOUND_ONLY
TEST_ASSET_ID = AST-PUR-1787083585731-1-1-plz5_BRANCH_1_PRICE_ZERO
TEST_ASSET_BARCODE = GWRNG21000001
PRE_ASSET_STATUS = AVAILABLE
SELLING_PRICE = 0_CURRENT_BRANCH_ASSET
TAX_TREATMENT = STANDARD_VAT
TAX_RATE = 14
TAXABLE_BASE = NOT_REACHED
VAT = NOT_REACHED
GRAND_TOTAL = NOT_REACHED
PAYMENT_METHOD = NOT_REACHED
EXPECTED_JOURNAL = NOT_REACHED
SOURCE_CHANGES = 4_INTENTIONAL_STAGE_C_FILES
MIGRATION_CREATED = NO
MIGRATION_PENDING = NO_OBSERVED
PERMISSIONS = UNCHANGED
FOCUSED_STAGE_C_TESTS = PASS_3_OF_3
RELEVANT_REGRESSION = PASS_23_OF_23
TYPECHECK = PASS
BACKEND_RUNTIME_PARITY = PASS
FRONTEND_RUNTIME_PARITY = PASS_EXISTING_MAIN_RUNTIME
AR_POS_PROOF = PASS_READ_ONLY
EN_POS_PROOF = PASS_READ_ONLY
NETWORK_PROOF = READ_ONLY_UI_REQUEST_COMPLETED_STATUS_NOT_INDEPENDENTLY_CAPTURED
OWNER_CONFIRMATION = NOT_OBTAINED
CHECKOUT_HTTP = NOT_RUN
CHECKOUT_EXECUTED = NO
ASSET_ROWS_DELTA = 0
PRODUCT_QUANTITY_MUTATION = 0
DB_BUSINESS_WRITES = 0
P0_COUNT = 0
P1_COUNT = 2
P2_BLOCKING_COUNT = 0
P3_COUNT = 1
GATE = BLOCKED_PRECHECKOUT_CUSTOMER_AND_ASSET_SETUP_REQUIRED
STAGE_C_STATUS = PAUSED_BEFORE_OWNER_CONFIRMATION
NEXT_RECOMMENDED_STEP = OWNER_APPROVED_EXISTING_CUSTOMER_AND_POSITIVE_PRICE_ASSET_SETUP_THEN_REBUILD_ONE_CART
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## STOP

لا يوجد Checkout أو Sale ثانٍ أو تنظيف أو Return أو Refund أو Void أو Stage D تلقائي. التقرير متوقف عند بوابة Owner Confirmation، وينتظر مراجعة المالك وتجهيز prerequisites فقط.

---

# Stage C Final Closure Addendum — One Owner-Authorized Checkout

تم تنفيذ Checkout واحد فقط بعد تأكيد المالك الصريح على قاعدة `darfus_erp`. تم استخدام المسار canonical في POS، ونجح الطلب بوضوح عبر HTTP `201`. لم يتم تنفيذ Retry أو Checkout ثانٍ أو Return/Refund/Void أو تنظيف.

**Owner confirmation:** `YES`  
**Checkout attempts allowed:** `ONE_ONLY`  
**Checkout attempts executed:** `1`  
**Automatic retry:** `NO`  
**Production:** `NOT TOUCHED`

## A. Successful Checkout Evidence

| Item | Actual | Result |
|---|---|---|
| Endpoint | `POST /api/v1/pos/checkout` | PASS |
| HTTP status | `201` | PASS |
| Backend request ID | `e2392da3-4507-421e-9130-0057af3656b3` | Recorded |
| Customer | Elsayed Negm / `CUS-0001` / `01013054967` | PASS |
| Company | `COMP-48ab554f-427e-4642-9419-bc8616c2dc36` | PASS |
| Branch | Branch-2 / `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c` | PASS |
| Asset | `AST-PUR-1787085524749-1-1-dww3` | PASS |
| Barcode | `GWRNG21000002` | PASS |
| Profile | `GOLD_BY_WEIGHT_JEWELLERY` | PASS |
| Payment | `cash` | PASS |
| Response technical ID | `INV-ID-1787478360975-9vhxi5` | PASS |
| Response invoice number | `INV-2026-000001` | PASS |
| Journal ID | `JE-1787478361049` | PASS |

The browser displayed `Checkout successful! Invoice ID: INV-ID-1787478360975-9vhxi5` and opened the print-options dialog. The separate `Print` action was not pressed; no print event was created.

## B. Invoice / Payment / Cash Proof

Read-only DB verification for the created invoice:

| Field | Persisted value |
|---|---:|
| Invoice subtotal | `2377.78624720` AED |
| Invoice tax | `332.89010000` AED |
| VAT rate | `14.000%` |
| Invoice total | `2710.67630000` AED |
| Payment method | `cash` |
| Paid amount | `2710.6763` AED |
| Remaining amount | `0.0000` AED |
| Status | `paid` |
| Posting status | `posted` |
| Invoice item count | `1` |
| Item price | `2377.78624720` AED |
| Item cost | `2366.02620660` AED |

The UI displayed the same canonical amounts rounded to two decimals: subtotal AED 2,377.79, VAT AED 332.89, total AED 2,710.68. The raw persisted values retain the existing higher-precision monetary representation; no financial field was edited after posting.

The created Payment row was:

```text
PAY-1787478361043-w7q1
invoice_id = INV-ID-1787478360975-9vhxi5
branch_id = BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c
payment_method = cash
amount = 2710.6763
```

The created CashTransaction row was:

```text
TX-1787478361090-cf10
type = cash_in
amount = 2710.6763
reference = INV-ID-1787478360975-9vhxi5
branch = Branch-2
branch_id = BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c
status = posted
journal_entry_id = JE-1787478361049
```

## C. Asset / Barcode / Movement Proof

The selected Asset was read after Checkout:

| Check | Actual | Result |
|---|---|---|
| Asset status | `sold` | PASS |
| Operational status | `SOLD` | PASS |
| Asset identity | `AST-PUR-1787085524749-1-1-dww3` | PRESERVED |
| Barcode | `GWRNG21000002` | PRESERVED |
| Active barcode rows | `1` | PASS |
| Barcode history | Revision 1, `ACTIVE`, `INITIAL` | PASS |
| Invoice item → Asset link | One link, ordinal `1`, `V2_RUNTIME_SALE` | PASS |
| Asset cost snapshot revision | `IMCOST-48e42c9b797448e590f3d45728` | PASS |
| Sale Asset event | One `SALE` event, `AVAILABLE → SOLD` | PASS |
| Inventory Asset movement | One `SALE` movement sourced by the invoice | PASS |
| Product quantity authority | Not used; no Product physical line was in the Cart | PASS |

The sale event idempotency value was the persisted checkout key plus the Asset ID, and the movement references the same invoice and Asset event. No barcode replacement or history mutation occurred.

## D. Journal Proof

Persisted Journal Entry:

```text
id = JE-1787478361049
source_type = invoice
source_id = INV-ID-1787478360975-9vhxi5
status = posted
total_debit = 5076.71000000
total_credit = 5076.71000000
posted_by = Elsayed Negm
branch_id = BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c
```

Persisted Journal Lines:

| Account | Debit | Credit |
|---|---:|---:|
| `SYS-CASH` / الخزينة النقدية | 2710.68000000 | 0.00000000 |
| `SYS-SALES` / إيرادات المبيعات | 0.00000000 | 2377.79000000 |
| `SYS-VAT` / ضريبة القيمة المضافة المستحقة | 0.00000000 | 332.89000000 |
| `SYS-COGS` / تكلفة البضاعة المباعة | 2366.03000000 | 0.00000000 |
| `SYS-INVENTORY` / أصل المخزون | 0.00000000 | 2366.03000000 |
| **Total** | **5076.71000000** | **5076.71000000** |

`DEBIT - CREDIT = 0.00000000`. The backend log also recorded `JE-1787478361049 posted — Dr 5076.71 / Cr 5076.71`.

## E. Idempotency Proof

The checkout used the persisted key:

```text
scope = pos.checkout
key = 92330a75-35f9-4bfe-b4c9-3065dcf38cac
request_hash = fc66ff95d4ee7cc481a95cd944746221767153a8d9112ec13d6e414b7273cb35
status = succeeded
status_code = 201
matching_rows_for_company_scope_key = 1
response_invoice_id = INV-ID-1787478360975-9vhxi5
```

This is a read-only proof of the recorded idempotency claim and successful response. No replay request was sent because the Owner explicitly authorized one Checkout only and prohibited a second Checkout or automatic retry.

## F. DB Delta / Integrity Proof

The pre-checkout baseline was captured immediately before the one authorized mutation:

| Table | Before | After | Delta | Expected |
|---|---:|---:|---:|---|
| `invoices` | 0 | 1 | +1 | One sale invoice |
| `invoice_items` | 0 | 1 | +1 | One Asset line |
| `payments` | 0 | 1 | +1 | One cash payment |
| `cash_transactions` | 3 | 4 | +1 | One cash-in transaction |
| `journal_entries` | 17 | 18 | +1 | One posted invoice journal |
| `journal_lines` | 48 | 53 | +5 | Five canonical lines |
| `idempotency_requests` | 33 | 34 | +1 | One successful claim |
| `assets` | 14 | 14 | 0 | Existing Asset transitioned, not created |
| `asset_events` | 22 | 23 | +1 | One SALE event |
| `inventory_asset_movements` | 19 | 20 | +1 | One SALE movement |

Read-only integrity assertions:

```text
current_database = darfus_erp
exact_idempotency_rows = 1
invoice_print_events_for_invoice = 0
active_barcode_rows = 1
invoice_item_orphans = 0
payment_orphans = 0
journal_line_orphans = 0
asset_link_orphans = 0
movement_event_link_orphans = 0
journal_debit = 5076.71000000
journal_credit = 5076.71000000
journal_difference = 0.00000000
```

No second invoice, Asset, payment, journal, barcode, or movement was created. No direct SQL write, migration, seed, settings change, VAT change, or cleanup was performed.

## G. Runtime / Browser Result

The only business mutation request observed was:

```text
POST /api/v1/pos/checkout → 201
request_id = e2392da3-4507-421e-9130-0057af3656b3
```

The UI showed the successful invoice and the persisted receipt preview values. Browser console errors were empty for the controlled POS session. Unrelated notification refresh calls produced transient 401s while the session refreshed, followed by successful refresh calls; they did not affect the already completed Checkout and no retry was issued for Checkout.

## H. Remaining Risk / Non-Blocking Limitation

The pre-checkout UI JournalPreview displayed zero provisional COGS/Inventory because the bounded POS search projection did not carry acquisition cost into the browser Cart. The canonical server sale orchestration resolved the Asset cost at the sale boundary and posted a balanced Journal with the persisted cost. This remains a P2 observability limitation and was not changed during this acceptance.

No P0/P1 failure was observed in the authorized Checkout. No Return, Refund, Void, or Stage D workflow was started.

## I. Final Closure Tokens

```text
CURRENT_CONTROL = DARFUS-STAGE-C-POS-PRECHECKOUT-CART-READINESS
FINAL_CLOSURE = ONE_OWNER_AUTHORIZED_CHECKOUT
OFFICIAL_DATABASE = darfus_erp
OFFICIAL_DB_TARGET_VERIFIED = YES
OWNER_CONFIRMATION = YES
CHECKOUT_ATTEMPTS_ALLOWED = 1
CHECKOUT_ATTEMPTS_EXECUTED = 1
CHECKOUT_HTTP_STATUS = 201
CHECKOUT_REQUEST_ID = e2392da3-4507-421e-9130-0057af3656b3
INVOICE_ID = INV-ID-1787478360975-9vhxi5
INVOICE_NUMBER = INV-2026-000001
CUSTOMER_ID = CUS-0001
BRANCH_ID = BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c
ASSET_ID = AST-PUR-1787085524749-1-1-dww3
BARCODE = GWRNG21000002
SERVER_SALE_PRICE_DISPLAY = 2377.79
PERSISTED_INVOICE_SUBTOTAL = 2377.78624720
PERSISTED_INVOICE_VAT = 332.89010000
PERSISTED_INVOICE_TOTAL = 2710.67630000
VAT_RATE = 14
PAYMENT_METHOD = cash
PAYMENT_ID = PAY-1787478361043-w7q1
CASH_TRANSACTION_ID = TX-1787478361090-cf10
JOURNAL_ID = JE-1787478361049
JOURNAL_BALANCE = PASS
ASSET_FINAL_STATUS = SOLD
ACTIVE_BARCODE_ROWS = 1
SALE_MOVEMENT_PROOF = PASS
IDEMPOTENCY_KEY = 92330a75-35f9-4bfe-b4c9-3065dcf38cac
IDEMPOTENCY_SCOPE = pos.checkout
IDEMPOTENCY_STATUS = succeeded
IDEMPOTENCY_STATUS_CODE = 201
IDEMPOTENCY_EXACT_ROW_COUNT = 1
SECOND_CHECKOUT = NO
AUTOMATIC_RETRY = NO
DB_INTEGRITY = PASS
DB_BUSINESS_WRITES = ONE_AUTHORIZED_CHECKOUT_ONLY
MIGRATION_CREATED = NO
MASTER_DATA_MUTATION = NO
TAX_SETTINGS_MUTATION = NO
PRODUCTION_CONTACTED = NO
P0_COUNT = 0
P1_COUNT = 0_NEW_IN_THIS_CONTROL
P2_COUNT = 1_NON_BLOCKING_OBSERVABILITY
GATE = PASS_STAGE_C_FINAL_CLOSURE
STAGE_C_STATUS = CLOSED_FOR_THIS_AUTHORIZED_CHECKOUT
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Final Stop

Stage C final Checkout acceptance is complete for this one authorized transaction. No second Checkout, replay, cleanup, Return, Refund, Void, or Stage D action was executed. `NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`.
