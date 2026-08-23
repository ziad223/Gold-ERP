# DARFUS ERP — Stage C POS Pre-Checkout Cart Readiness Report

تم تنفيذ فحص الجاهزية قبل Checkout فقط على البيئة المحلية الرسمية. تم التحقق من عميل موجود، وتبديل السياق إلى Branch-2، واختيار Asset واحد متاح، وبناء Cart غير محفوظ، واختيار CASH، وإثبات الأسعار والضريبة والقيد المتوقع قراءةً فقط. لم يتم تنفيذ Checkout ولم تحدث أي كتابة أعمال في قاعدة `darfus_erp`.

**Control ID:** `DARFUS-STAGE-C-POS-PRECHECKOUT-CART-READINESS`  
**Official DB:** `darfus_erp`  
**Frontend:** `http://localhost:3000`  
**Backend:** `http://localhost:8000`  
**Mode:** Read-only pre-checkout readiness  
**Date:** 2026-08-23

## 1. Customer Verification

| Check | Result | Evidence |
|---|---|---|
| Existing customer | PASS | `CUS-0001` exists and is active in the official DB. |
| Customer | PASS | Elsayed Negm / `CUS-0001` |
| Phone | PASS | `01013054967`; normalized lookup key has exactly one matching customer. |
| Company scope | PASS | `COMP-48ab554f-427e-4642-9419-bc8616c2dc36` |
| Soft deletion | PASS | `is_deleted = false` / active record. |
| Branch mapping | PASS | A `branch_customers` row exists for Branch-2. |
| POS summary | PASS | `GET /api/v1/customers/CUS-0001/pos-summary` returned 200; the browser displayed the customer summary. |
| Canonical customer screen | PASS | `/en/customers` showed the canonical customer list with two active customers, including Elsayed Negm. |

The customer was selected from the server-backed POS customer selector after the Branch-2 context was established. No customer was created or changed.

## 2. Branch-2 Context

| Check | Result | Evidence |
|---|---|---|
| UI context switch | PASS | The supported branch selector was used once to switch from Branch-1 to Branch-2. |
| Branch | PASS | `Branch-2` |
| Branch ID | PASS | `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c` |
| Company header | PASS | Browser remained under the current Gold ERP company context. |
| Cross-branch asset scope | PASS | Selected asset belongs to Branch-2 and its location is branch-scoped to Branch-2. |

The first customer list response was stale after the context switch; the authenticated POS tab was reloaded once, without changing data. The refreshed selector then returned the Branch-2 customers and the customer was selected successfully.

## 3. Asset / Barcode Selection

The selected physical inventory line was:

| Field | Value | Result |
|---|---|---|
| Asset ID | `AST-PUR-1787085524749-1-1-dww3` | PASS |
| Description | Gold Ring | PASS |
| Profile | `GOLD_BY_WEIGHT_JEWELLERY` | PASS |
| Barcode | `GWRNG21000002` | PASS |
| Karat | 21K | PASS |
| Weight | 5 g | PASS |
| Company | `COMP-48ab554f-427e-4642-9419-bc8616c2dc36` | PASS |
| Branch | `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c` | PASS |
| Location | `LOC-9a10f58e-4207-4512-8824-7a7b06159151` / `QA-G2C-RECEIVE-LOCATION-01` | PASS |
| Location state | Active and mapped to Branch-2 | PASS |
| Asset status | `available` | PASS |
| Operational status | `AVAILABLE` | PASS |
| Active barcode rows | Exactly 1: `GWRNG21000002:ACTIVE:1` | PASS |
| Active transfer | 0 | PASS |
| Active workshop record | 0 | PASS |
| Active reservation | 0 | PASS |
| Origin | Purchase order `POI-1787085524777-1-1`, mapping `V2_RUNTIME_RECEIPT` | PASS |

The POS search by barcode returned exactly one result and the Cart contains exactly one serialized Asset line. No Product quantity row was used as the physical-stock authority.

## 4. Price Authority

| Price item | Value | Authority / evidence |
|---|---:|---|
| Persisted `Asset.price` | AED 3,279.00 | Read-only DB inspection. This is not the final GBW server-derived sale amount used by the pricing path. |
| POS/server-derived GBW sale amount | AED 2,377.79 | POS barcode search result and `POST /api/v1/pricing/calculate` response, HTTP 200. |
| Quantity | 1 | Asset-only cart line. |
| Client price override | Blocked | Prior Stage C source hardening removes client `price`, `sellingPrice`, and `salePrice` before profile pricing. |
| Cost fallback | Not used as sale price | The GBW profile pricing path derives the sale amount from server-side profile pricing. |

For this GBW profile, the profile-specific server pricing path is authoritative over the raw persisted `Asset.price` value. The client did not replace the server amount, and no price was persisted.

## 5. Tax Authority

| Tax item | Value | Result |
|---|---:|---|
| Tax treatment | `STANDARD_VAT` | PASS |
| Configured VAT rate | 14% | Read-only company settings; dynamic runtime value, not hardcoded in the test. |
| Subtotal / taxable base | AED 2,377.79 | PASS |
| Discount | AED 0.00 | PASS |
| VAT | AED 332.89 | PASS |
| Total | AED 2,710.68 | PASS |

The server pricing response was HTTP 200 and returned the current configured VAT rate and calculated totals. The displayed VAT is the system result for `2,377.79 × 14%`, rounded by the existing runtime calculation to AED 332.89; the control did not alter the rate or tax settings.

## 6. Cart

| Check | Result | Evidence |
|---|---|---|
| Cart persistence | PASS | Cart exists only in the browser React state; no draft order or invoice was created. |
| Line count | PASS | Exactly one line. |
| Physical identity | PASS | Asset `AST-PUR-1787085524749-1-1-dww3`, barcode `GWRNG21000002`. |
| Profile | PASS | `GOLD_BY_WEIGHT_JEWELLERY`. |
| Quantity | PASS | 1. |
| Unit sale amount | PASS | AED 2,377.79, server-derived. |
| Cart subtotal | PASS | AED 2,377.79. |
| Cart VAT | PASS | AED 332.89. |
| Cart total | PASS | AED 2,710.68. |
| Duplicate line | PASS | No duplicate Asset or barcode line. |
| Product physical fallback | PASS | No Product-based physical line was selected. |

## 7. Payment Method

| Item | Result | Evidence |
|---|---|---|
| Payment method | PASS | `CASH` selected in the POS UI; Cash button was active and Card was inactive. |
| Payment persistence | NOT RUN | Checkout was intentionally not executed. |
| Expected paid amount | AED 2,710.68 | Existing `salesService.resolvePayment` cash contract pays the full total. |
| Expected change | AED 0.00 / not applicable | The current UI does not request a separate tendered-cash amount for this path. |
| Expected cash delta | AED 2,710.68 | Expected only if a later authorized Checkout is executed. |
| Expected AR delta | AED 0.00 | Cash payment plan. |
| External gateway | Not used | No gateway request was made. |

## 8. Expected Journal

The following is the expected canonical server-side sale journal for the selected Asset and the derived totals. It is a source-based expectation only; no journal was posted in this control.

| Account | Debit (AED) | Credit (AED) | Source meaning |
|---|---:|---:|---|
| `1110` Cash on Hand / Till | 2,710.68 | 0.00 | Cash payment for invoice total |
| `4100` Jewellery Sales Revenue | 0.00 | 2,377.79 | Taxable sale base |
| `2200` VAT Payable | 0.00 | 332.89 | Output VAT |
| `5000` Cost of Goods Sold | 2,366.02620660 | 0.00 | Selected Asset acquisition cost |
| `1200` Inventory | 0.00 | 2,366.02620660 | Asset inventory release |
| **Totals** | **5,076.70620660** | **5,076.70620660** | **Difference = 0.00** |

The canonical server source (`postInvoiceEntry`) derives cost from the Asset at the sale boundary and preserves the balanced entry. `resolveAccountingByKarat` defaults to false unless an explicit company setting enables it; the current read-only settings did not show an enabled karat-split setting, so the generic account roles above are the expected path.

### UI journal-preview limitation

The browser `JournalPreview` displayed **Balanced** and showed the cash, revenue, and VAT lines, but displayed zero for COGS and Asset Inventory. The current POS search projection does not carry the acquisition cost into the browser cart’s provisional preview, while the canonical server sale path resolves `asset.cost` at Checkout. This is recorded as a **P2 observability gap**; it was not changed in this read-only control and does not authorize Checkout. The server-derived expected journal remains balanced with the selected Asset cost.

## 9. DB Baseline

### Official target proof

Read-only database inspection resolved:

```text
current_database = darfus_erp
```

### Counts immediately before the final stop

| Entity | Count |
|---|---:|
| customers | 2 |
| invoices | 0 |
| invoice_items | 0 |
| payments | 0 |
| cash_transactions | 3 |
| journal_entries | 17 |
| journal_lines | 48 |
| idempotency_requests | 33 |
| assets | 14 |
| asset_events | 22 |
| inventory_asset_movements | 19 |

These counts were read before the final stop and were unchanged by branch selection, customer selection, search, pricing calculation, cart construction, payment selection, and opening the journal preview.

### Selected-record state

The selected Asset remained `available` / `AVAILABLE`, in Branch-2, at the active Branch-2 location, with the single active barcode. `CUS-0001` remained active and unchanged. No invoice, payment, cash transaction, journal, inventory movement, Asset transition, reservation, or other business row was created by this control.

### Mutation boundary

```text
POST /api/v1/pos/checkout = NOT SENT
FINAL_CHECKOUT_EXECUTED = NO
DB_BUSINESS_WRITES_THIS_CONTROL = 0
```

No direct SQL mutation, migration, seed, settings change, VAT change, master-data change, or cleanup was performed.

## 10. Runtime / Browser Proof

### Browser path

The authenticated browser path used was:

```text
POS
→ supported branch selector
→ Branch-2
→ existing customer CUS-0001
→ barcode search GWRNG21000002
→ one Asset result
→ one cart line
→ CASH
→ Show Entry Details
→ STOP before Complete Checkout & Print Receipt
```

The final button was visible and enabled, but it was not clicked. This is intentional and is the required stop boundary for this control.

### Network/runtime evidence

Observed read-only or non-business requests included:

| Request | Status | Meaning |
|---|---:|---|
| `GET /api/v1/pos/customer-lookup?phone=01013054967` | 200 | Existing customer lookup. |
| `GET /api/v1/customers/CUS-0001/pos-summary` | 200 | Customer POS summary. |
| `GET /api/v1/customers` | 200 | Branch-scoped customer list after authenticated reload. |
| `GET /api/v1/pos/search?query=GWRNG21000002&type=all&limit=20&includeUnavailableExact=true` | 200 | Exact barcode search. |
| `POST /api/v1/pricing/calculate` | 200 | Read-only server pricing/tax calculation. |
| `POST /api/v1/pos/checkout` | **NOT SENT** | Required mutation boundary was not crossed. |

Backend health, DB health, and Redis health were UP/200 during the controlled observation. Browser console error collection for the final authenticated POS tab was empty.

## 11. Owner Confirmation Block

The control does **not** authorize Checkout automatically. The following is the required next authorization boundary and was not exercised:

```text
OWNER_CONFIRMATION = REQUIRED_FOR_NEXT_STEP
CHECKOUT_ALLOWED = ONE_ONLY
AUTOMATIC_RETRY = NO
SECOND_CHECKOUT = NO
TARGET = darfus_erp
```

If separately authorized, the next action would be one literal Checkout attempt from the already prepared Cart. Any ambiguous HTTP result, timeout, 401/403/409/422/5xx, or partial persistence must stop the next control immediately without retry.

## 12. Final Tokens

```text
CURRENT_CONTROL = DARFUS-STAGE-C-POS-PRECHECKOUT-CART-READINESS
LOCAL_MAIN_DB = darfus_erp
CUSTOMER_ID = CUS-0001
CUSTOMER_NAME = Elsayed Negm
CUSTOMER_PHONE = 01013054967
CUSTOMER_READY = PASS
COMPANY_CONTEXT = COMP-48ab554f-427e-4642-9419-bc8616c2dc36
BRANCH_CONTEXT = Branch-2
BRANCH_ID = BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c
BRANCH_CONTEXT_READY = PASS
ASSET_ID = AST-PUR-1787085524749-1-1-dww3
ASSET_PROFILE = GOLD_BY_WEIGHT_JEWELLERY
ASSET_BARCODE = GWRNG21000002
ASSET_STATUS = AVAILABLE
ASSET_LOCATION = LOC-9a10f58e-4207-4512-8824-7a7b06159151
ACTIVE_BARCODE_COUNT = 1
POSITIVE_PRICE_ASSET_READY = PASS
PERSISTED_ASSET_PRICE = 3279.00
SERVER_DERIVED_SALE_PRICE = 2377.79
CART_LINES = 1
CART_READY = PASS
PAYMENT_METHOD = CASH
EXPECTED_SUBTOTAL = 2377.79
EXPECTED_TAX_TREATMENT = STANDARD_VAT
EXPECTED_VAT_RATE = 14%
EXPECTED_VAT = 332.89
EXPECTED_TOTAL = 2710.68
EXPECTED_CASH_DELTA = 2710.68
EXPECTED_AR_DELTA = 0
EXPECTED_JOURNAL_BALANCED = PASS
UI_JOURNAL_COST_PREVIEW = P2_OBSERVABILITY_GAP
PRICE_PROOF = PASS
TAX_PROOF = PASS
PAYMENT_PLAN = PASS
CHECKOUT_EXECUTED = NO
FINAL_CHECKOUT_REQUEST_SENT = NO
DB_BUSINESS_WRITES_THIS_CONTROL = 0
MIGRATION_CREATED = NO
MASTER_DATA_MUTATION = NO
VAT_SETTINGS_MUTATION = NO
GATE = PASS_STAGE_C_PRECHECKOUT_CART_READINESS
NEXT_STEP = OWNER_LITERAL_CONFIRMATION_FOR_ONE_REAL_CHECKOUT
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Gate

`PASS_STAGE_C_PRECHECKOUT_CART_READINESS`

The pre-checkout gate passes: an existing customer is ready, the Branch-2 context is established, one positive-price serialized Asset with a valid active barcode is ready, the non-persistent Cart contains one Asset line, the server-derived price and dynamic VAT are evidenced, CASH is selected, and the expected canonical journal is balanced. The gate is **pre-checkout only**. It does not close Checkout acceptance and does not authorize a real sale.

The only recorded limitation is the P2 UI journal cost-display mismatch described above; no source or business-rule change was made in this read-only control.

**STOP.** Await explicit Owner confirmation before any separate real Checkout control. `NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`.
