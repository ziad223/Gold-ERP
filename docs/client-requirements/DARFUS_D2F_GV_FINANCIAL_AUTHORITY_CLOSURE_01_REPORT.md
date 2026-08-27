# DARFUS ERP — Gift Voucher Financial Authority Closure Report

## ملخص عربي

تم تثبيت سياسة القسيمة المشتراة ماليًا حسب اعتماد المالك، بدون تنفيذ إصدار أو استرداد وبدون تعديل على الكود أو قاعدة البيانات. تم فحص مسار Deposit قراءةً فقط. خرائط حساب التزام دفعات العملاء موجودة وصحيحة للفرعين، بينما الخطأ المسجل في الـruntime هو اشتراط فتح جلسة الخزينة لمسار إيداع نقدي للحجز. لم يتم إصلاح الخطأ أو تشغيل أي معاملة جديدة.

## 1. Control and scope

CURRENT_CONTROL = DARFUS-D2F-GV-FINANCIAL-AUTHORITY-CLOSURE-01
OFFICIAL_DB = darfus_erp
MODE = POLICY_CLOSURE_PLUS_READ_ONLY_DEPOSIT_TRIAGE
PRODUCTION_CONTACTED = NO

The control was kept on two separate tracks:

- Track A: Purchased Gift Voucher UAE financial authority.
- Track B: read-only Deposit/Customer Deposit accounting triage.

Gate B and any Gift Voucher implementation were not started.

## 2. Purchased Gift Voucher policy closure

| Policy item | Frozen result | Authority |
|---|---|---|
| Issue face value | Paid face value is the voucher liability amount | Owner-approved control |
| Issue treasury | Debit resolved cash/bank only if real money is received | Owner-approved control |
| Issue liability | Credit resolved Gift Voucher Liability | Owner-approved control |
| Issue revenue | No Sales Revenue | Owner-approved control |
| Issue Output VAT | No Output VAT | Owner-approved control |
| Redemption | Voucher is a payment instrument against a later Sales Invoice | Owner-approved control |
| Redemption VAT/revenue | Actual Sales Invoice and Tax Engine only | Owner-approved control |
| Payment allocation | Payment Engine | Frozen boundary |
| Lifecycle | Gift Voucher service | Frozen boundary |
| Journal translation | Posting Engine | Frozen boundary |
| Currency | Durable server/company authority | Owner-approved control |
| Non-purchased classes | Separate policy required; fail closed | Owner-approved control |
| Expiry/cancellation/breakage/refund/write-off | Unresolved; no automatic accounting | Owner-approved control |

PURCHASED_VOUCHER_ISSUE_REVENUE = NO
PURCHASED_VOUCHER_ISSUE_OUTPUT_VAT = NO
PURCHASED_VOUCHER_ISSUE_LIABILITY = YES
PURCHASED_VOUCHER_ISSUE_TREASURY_EFFECT = YES_IF_REAL_MONEY_RECEIVED
HARDCODED_VAT_RATE = NO
TAX_RULE_VERSION_TRACEABILITY = YES

## 3. Current Gift Voucher implementation reality

| Layer | Read-only finding | Consequence |
|---|---|---|
| DB model | backend/src/models/giftVoucher.model.js has basic code/value/balance/status/date/payment/branch fields; no proven durable currency, branch id, tax snapshot, payment/accounting references, or complete audit contract | Implementation not ready |
| Migration | backend/migrations/20260617010000-installments-vouchers.js creates the basic table and a non-unique code index | Schema/idempotency closure remains a later batch |
| API | backend/src/routes/erp.routes.js:16371-16412 exposes GET list/detail; POST issue/redeem are stable-forbidden before mutation with GIFT_VOUCHER_FINANCIAL_WORKFLOW_DISABLED | Current runtime is fail-closed |
| UI | app/[locale]/(dashboard)/sales/gift-vouchers/page.tsx:86-93 disables Issue/Redeem | No live voucher financial action was executed |
| Posting helpers | backend/src/services/posting.service.js:869-916 contain non-authoritative helpers; issue uses literal 2400 and redeem uses literal 4100 revenue | Do not enable as-is |
| Invoice projection | backend/src/services/invoice-projection.service.js:88-101 marks gift voucher SUPPORTED_LATER with no adapter/detail/print | Projection/print is not closed |

The current disabled routes are a safety property: no real Gift Voucher issue or redemption can be claimed from helper existence or UI presence.

## 4. Official DB read-only proof

Read-only query result:

SELECT current_database(), current_user
darfus_erp | postgres

Current safe counts observed:

| Entity | Count |
|---|---:|
| companies | 1 |
| branches | 2 |
| accounts | 38 |
| system_account_roles | 26 |
| branch_financial_mappings | 67 |
| settings | 12 |
| invoices | 3 |
| payments | 3 |
| cash_transactions | 9 |
| journal_entries | 27 |
| journal_lines | 77 |
| gift_vouchers | 0 |
| deposit invoices | 0 |
| journal entries with source_type deposit | 0 |
| gift-voucher journal rows | 0 |

Read-only company settings observed:

currency = AED
vat_registered = true
defaultTaxTreatment = STANDARD_VAT
enabledTaxTreatments = STANDARD_VAT, EXEMPT, REVERSE_CHARGE, OUT_OF_SCOPE

No setting was changed.

## 5. Deposit/Customer Deposit triage

### 5.1 Failure evidence

The current container log contains this stable runtime error:

code = CASH_REGISTER_SESSION_REQUIRED
message = Open the branch cash register before recording a cash reservation deposit.
HTTP contract in source = 409

Observed existing log timestamps include 2026-08-26 12:32:37, 12:33:25–12:33:27, 12:40:27, and 12:42:53. This control did not send a deposit request.

The exact browser Network method, URL, request body, and request ID for the original failure were not available in the read-only session. The evidence therefore classifies the observed reservation-cash-deposit failure, but does not claim reproduction of a separate Sales Invoice type=deposit failure.

### 5.2 Source trace

backend/src/services/reservation-financial-resolver.service.js:58-70:

1. Resolves the branch-scoped customer-deposit liability.
2. Resolves the branch cash treasury account.
3. Requires an OPEN CashRegisterSession for cash when requireSession is true.
4. Throws CASH_REGISTER_SESSION_REQUIRED with HTTP 409 when no open session exists.

backend/src/routes/erp.routes.js:11255-11420 for customer credit deposit:

- requires treasury.update permission;
- requires company/branch context and Idempotency-Key;
- resolves CUSTOMER_DEPOSIT_LIABILITY server-side;
- resolves treasury server-side;
- performs CashTransaction, customer-credit ledger, journal, audit, and idempotency work in one transaction.

backend/src/services/posting.service.js:626-652 for the legacy deposit invoice helper uses treasury mapping plus RESERVATION_ADVANCE_LIABILITY. It is not evidence that a current deposit invoice exists in the official DB.

### 5.3 DB mapping proof

Read-only system_account_roles inspection found one CUSTOMER_DEPOSIT_LIABILITY role row for each active branch. Both resolve to an active account with:

type = liability
nature = credit
code = SYS-CUSTOMER-DEPOSIT

Active branch treasury mappings also exist. Historical inactive duplicate mapping rows are present, but the current active role/branch authority is not missing or ambiguous for the two active branches.

### 5.4 Root cause

DEPOSIT_OBSERVED_FAILURE = CASH_REGISTER_SESSION_REQUIRED
DEPOSIT_ROOT_CAUSE_CLASS = K_OTHER_PROVEN
DEPOSIT_ROOT_CAUSE = Missing OPEN cash-register session for the cash reservation-deposit path
DEPOSIT_ACCOUNT_MAPPING_GAP = NOT_PROVEN
DEPOSIT_SALES_INVOICE_FAILURE_REPRODUCED = NO
DEPOSIT_FIX_EXECUTED = NO
DEPOSIT_TRIAGE_GATE = PASS_ROOT_CAUSE_PROVEN_FIX_DEFERRED

This does not authorize opening a cash register, changing mappings, retrying a deposit, or changing posting logic. If the intended issue is specifically the Sales Invoice type=deposit route rather than the observed reservation-cash-deposit path, a separate authenticated read-only capture is required before assigning a route-level root cause.

## 6. No-mutation proof

No source, test, migration, configuration, settings, master-data, business endpoint, or database write was executed by this control.

MAIN_DB_CHECK = PASS_READ_ONLY
OFFICIAL_BUSINESS_DELTA_BY_CONTROL = 0
OFFICIAL_FINANCIAL_DELTA_BY_CONTROL = 0
OFFICIAL_INVENTORY_DELTA_BY_CONTROL = 0
POSTED_VOUCHERS_BY_CONTROL = 0
REDEEMED_VOUCHERS_BY_CONTROL = 0
DEPOSIT_POSTS_BY_CONTROL = 0

Existing historical data was not cleaned or modified.

## 7. Risks and deferred work

| ID | Risk | Severity | Disposition |
|---|---|---|---|
| GV-FIN-001 | Current voucher posting helpers use literal account codes and a redemption revenue line that conflicts with the approved boundary if enabled | P1 implementation blocker, not active runtime corruption because routes are disabled | Separate Gift Voucher schema/implementation batch |
| GV-DATA-001 | Current voucher schema lacks durable financial/audit/idempotency fields required by policy | P1 implementation prerequisite | Design and rehearse on disposable clone |
| DEP-TRIAGE-001 | Cash reservation deposit requires an OPEN cash-register session | P2 operational precondition | Separate deposit closure only with Owner authorization |
| DEP-OBS-001 | Exact original Sales Deposit Network request was not available | P2 observability gap | Capture read-only authenticated request in separate triage |

## 8. Gates

FINANCIAL_AUTHORITY_GATE = PASS_PURCHASED_GIFT_VOUCHER_UAE_FINANCIAL_POLICY
DEPOSIT_TRIAGE_GATE = PASS_ROOT_CAUSE_PROVEN_FIX_DEFERRED
GIFT_VOUCHER_IMPLEMENTATION_GATE = NOT_STARTED
GATE_B = NOT_STARTED

The financial authority gate means the Purchased Voucher policy is explicit and internally consistent. It does not mean Gift Voucher implementation, schema, issue, redemption, invoice projection, or print closure is complete.

## 9. Next order after Owner review

1. If Deposit requires a business fix, open DARFUS-DEPOSIT-SALE-ACCOUNTING-MAPPING-CLOSURE-01 with exact authenticated runtime evidence.
2. Design and implement Gift Voucher schema/contract and runtime on a disposable clone only.
3. Obtain a separately named Owner authorization before any official migration/promotion.
4. Re-close D2F Gate A, then consider later approved gates.

No next batch was started automatically.

## 10. Final tokens

CURRENT_CONTROL = DARFUS-D2F-GV-FINANCIAL-AUTHORITY-CLOSURE-01
LOCAL_MAIN_DB = darfus_erp
MAIN_DB_CHECK = PASS_READ_ONLY
OFFICIAL_BUSINESS_DELTA_BY_CONTROL = 0
OFFICIAL_FINANCIAL_DELTA_BY_CONTROL = 0
OFFICIAL_INVENTORY_DELTA_BY_CONTROL = 0
FINANCIAL_AUTHORITY_GATE = PASS_PURCHASED_GIFT_VOUCHER_UAE_FINANCIAL_POLICY
DEPOSIT_ROOT_CAUSE_CLASS = K_OTHER_PROVEN
DEPOSIT_TRIAGE_GATE = PASS_ROOT_CAUSE_PROVEN_FIX_DEFERRED
DEPOSIT_SALES_INVOICE_FAILURE_REPRODUCED = NO
SOURCE_FILES_CHANGED = 0
TEST_FILES_CHANGED = 0
MIGRATIONS_CREATED = 0
DB_WRITES = 0
GIFT_VOUCHER_ISSUE_EXECUTED = NO
GIFT_VOUCHER_REDEEM_EXECUTED = NO
DEPOSIT_MUTATION_EXECUTED = NO
GATE_B_STARTED = NO
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START

STOP — Owner review required.

