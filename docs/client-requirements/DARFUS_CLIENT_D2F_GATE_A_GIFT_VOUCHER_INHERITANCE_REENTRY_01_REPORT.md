# DARFUS ERP — D2F Gate A Re-Entry Report

تمت قراءة وثائق Sales وDeposit وGift Voucher كاملة، ثم تطبيق أولوية Gift Voucher المتخصص فوق Deposit ثم Sales. النتيجة: قواعد العميل أصبحت مثبتة، لكن Gate A يتوقف ماليًا لأن Tax Treatment وAccounting/Liability/Currency/Branch authority غير مثبتة في التنفيذ الحالي. لم يحدث أي تعديل على الكود أو قاعدة `darfus_erp`، ولم يبدأ Gate B.

## 1. Scope and source coverage

| Source | Read status | Visual/render evidence |
|---|---|---|
| Sales Invoice | YES | 3,021 non-empty paragraphs; 2 tables; 0 images; 130 pages rendered |
| Deposit Invoice | YES | 553 non-empty paragraphs; 0 tables; 0 images; 82 pages rendered |
| Gift Voucher Invoice | YES | 368 non-empty paragraphs; 0 tables; 0 images; 39 pages rendered |

`SALES_DOC_READ_COMPLETELY = YES`

`DEPOSIT_DOC_READ_COMPLETELY = YES`

`GIFT_VOUCHER_DOC_READ_COMPLETELY = YES`

## 2. Inheritance result

`INHERITANCE_PRECEDENCE_APPLIED = YES`

Gift Voucher-specific rules override Deposit where different. The key example is ownership: Deposit requires a customer, while Gift Voucher supports Anonymous Voucher and therefore does not require a customer at issuance. Sales supplies the shared Payment Engine, Posting Engine, Tax Engine, security, audit and print framework.

`CLIENT_RULE_NOT_CONFUSED_WITH_IMPLEMENTATION = YES`

## 3. Fast triage

| Fact | Actual |
|---|---|
| Internal identity | `gift_vouchers.id`, string primary key |
| Business display number | Not separately stored/proven; current projection candidate is `code` |
| Voucher code | `gift_vouchers.code`, searchable by current GET route |
| Company scope | Required `company_id` FK to `companies.id` |
| Branch scope | Free-text `branch`; no canonical branch FK/restriction relation |
| Value | `value` DECIMAL(15,4) |
| Balance | `balance` DECIMAL(15,4) |
| Currency | Not stored or durably mapped in voucher source |
| Status | Current enum: `active`, `redeemed`, `expired` |
| Payment | `payment_method` text only; no voucher payment source linkage |
| Accounting | Unused posting helpers reference account `2400 Gift Voucher Liability`; no active route/journal proof |
| Audit/lifecycle events | No dedicated voucher event/audit source proven |
| Print | Generic placeholder exists; projection adapter is null and `canPrint=false` |
| Write routes | Issue/redeem return stable `GIFT_VOUCHER_FINANCIAL_WORKFLOW_DISABLED` before mutation |

`FAST_TRIAGE_COMPLETE = YES`

## 4. Effective client rules

The effective rules are fully recorded in [Effective Business Rules](DARFUS_CLIENT_D2F_GIFT_VOUCHER_EFFECTIVE_BUSINESS_RULES.md) and the complete domain matrix. The proven rules include:

- independent stored monetary value, independent of a future Sales Invoice;
- fixed predefined value and Full Redemption Only;
- Anonymous, Customer, and Corporate ownership;
- permanent unique Voucher Code, optional QR/barcode representation;
- separate Issuance, Activation and Distribution events;
- Draft -> Active -> one final outcome -> Closed lifecycle;
- policy-based expiry and redemption restrictions;
- Payment Engine owns payment allocation; Gift Voucher Engine owns lifecycle;
- failed redemption before successful Sales posting leaves voucher/accounting/treasury unchanged;
- voucher presentation print, not traditional invoice print;
- reprint preserves the same Voucher Number/Code/QR/Barcode/Value.

`AUTHORITY_MATRIX_COMPLETE = YES`

## 5. Gate A blockers

### Financial blocker — tax

The documents prove that Tax Engine/Country Engine/Company Tax Policy remain the authority and forbid manual VAT. They do not prove the Gift Voucher-specific legal/business tax treatment in the current company/country configuration. Source and DB contain no Gift Voucher tax mapping or immutable tax snapshot.

`GIFT_VOUCHER_TAX_ENGINE_AUTHORITY = PROVEN`

`GIFT_VOUCHER_TAX_TREATMENT = UNPROVEN_IN_CURRENT_COMPANY_COUNTRY_POLICY`

### Financial blocker — liability/accounting/treasury

The Gift Voucher document defines stored value as an organization obligation and inherits the financial framework, but the current active accounting contract is not proven. The account-2400 posting helpers are disconnected design evidence, not runtime authority. No voucher journal or treasury source rows exist in the protected DB.

`GIFT_VOUCHER_ACCOUNTING_AUTHORITY = INHERITED_FRAMEWORK_NOT_ACTIVE_FOR_VOUCHER`

`GIFT_VOUCHER_LIABILITY_AUTHORITY = ACCOUNT_2400_DESIGN_HINT_ONLY_NOT_RUNTIME_PROVEN`

### Implementation gaps that are not silently promoted

- code uniqueness/non-reuse constraint;
- separate display-number authority;
- durable currency source/snapshot;
- canonical branch/location restriction;
- type, ownership, funding, activation, distribution and lifecycle event model;
- Payment Engine source allocation;
- QR/barcode source identity;
- dedicated audit and voucher print/reprint contract.

## 6. Projection readiness

Current registry state:

`gift_voucher -> SUPPORTED_LATER -> adapter=null -> canViewDetail=false -> canPrint=false`

This fail-closed state is correct and was not changed.

`GIFT_VOUCHER_PROJECTION_AUTHORITY_READY = NOT_READY_FINANCIAL_CONTRACT_BLOCKED`

## 7. Acceptance and mutation status

No source code, tests, migration, settings or DB rows were changed. No disposable clone was created because no implementation or mutation proof was authorized before closing the financial authority blocker.

`DISPOSABLE_DB_PROVEN_BEFORE_MUTATION = NOT_APPLICABLE_NO_MUTATION`

`FOCUSED_TESTS = NOT_RUN_GATE_A_BLOCKED`

`AFFECTED_REGRESSION = NOT_RUN_GATE_A_BLOCKED`

`TYPECHECK = NOT_RUN_NO_SOURCE_CHANGE`

`P0 = 0`

`P1 = 1_FINANCIAL_AUTHORITY_BLOCKER`

`P2 = 8_IMPLEMENTATION_GAPS_DEFERRED`

`P3 = 0`

## 8. Main DB and runtime

`MAIN_DB_BASELINE_CAPTURED = YES`

`MAIN_DB_CHECK = PASS_READ_ONLY`

`MAIN_RUNTIME_CHECK = PASS_HEALTH_ONLY`

`OFFICIAL_DB = darfus_erp`

`OFFICIAL_BUSINESS_DELTA_BY_CONTROL = 0`

`OFFICIAL_FINANCIAL_DELTA_BY_CONTROL = 0`

`OFFICIAL_TREASURY_DELTA_BY_CONTROL = 0`

## 9. Final tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-D2F-GATE-A-GIFT-VOUCHER-INHERITANCE-REENTRY-01
SALES_DOC_READ_COMPLETELY = YES
DEPOSIT_DOC_READ_COMPLETELY = YES
GIFT_VOUCHER_DOC_READ_COMPLETELY = YES
INHERITANCE_PRECEDENCE_APPLIED = YES
FAST_TRIAGE_COMPLETE = YES
AUTHORITY_MATRIX_COMPLETE = YES
CLIENT_RULE_NOT_CONFUSED_WITH_IMPLEMENTATION = YES
STABLE_INTERNAL_ID = gift_vouchers.id
BUSINESS_DISPLAY_NUMBER = NOT_SEPARATELY_STORED_CURRENT_CODE_CANDIDATE
VOUCHER_CODE = gift_vouchers.code
VOUCHER_CODE_CLIENT_RULE = PROVEN
VOUCHER_CODE_IMPLEMENTATION_STATUS = PARTIAL_NON_UNIQUE_INDEX_ONLY
GIFT_VOUCHER_CURRENCY_CLIENT_RULE = PROVEN
GIFT_VOUCHER_CURRENCY_AUTHORITY = MISSING_DURABLE_VOUCHER_SOURCE
GIFT_VOUCHER_BRANCH_RULE = PROVEN
GIFT_VOUCHER_BRANCH_IMPLEMENTATION = FREE_TEXT_ONLY_NO_CANONICAL_SCOPE
GIFT_VOUCHER_CUSTOMER_REQUIRED_AT_ISSUE = NO_ANONYMOUS_ALLOWED
VOUCHER_VALUE_MODEL = FIXED_PREDEFINED_IMMUTABLE_VALUE
FULL_REDEMPTION_RULE = FULL_REDEMPTION_ONLY_ONCE
MULTI_VOUCHER_PAYMENT_RULE = INHERITED_SALES_PAYMENT_POLICY_CONTROLLED_NOT_RUNTIME_PROVEN
PAYMENT_ENGINE_OWNS_PAYMENT_ALLOCATION = YES
GIFT_VOUCHER_ENGINE_OWNS_VOUCHER_LIFECYCLE = YES_CLIENT_AUTHORITY
DUPLICATE_PAYMENT_AUTHORITY = NO
FAILED_REDEMPTION_ATOMICITY = CLIENT_RULE_PROVEN_IMPLEMENTATION_NOT_PROVEN
DUPLICATE_REDEMPTION_PROTECTION = CLIENT_RULE_PROVEN_IMPLEMENTATION_NOT_PROVEN
FULL_REDEMPTION_ENFORCEMENT = CLIENT_RULE_PROVEN_IMPLEMENTATION_NOT_PROVEN
GIFT_VOUCHER_LIFECYCLE_MATRIX = COMPLETE_CLIENT_RULE_CURRENT_SCHEMA_INCOMPLETE
ISSUANCE_ACTIVATION_SEPARATION = PASS_CLIENT_RULE_NO_RUNTIME_IMPLEMENTATION
FUNDING_SOURCE_AUTHORITY = CLIENT_PROVEN_LIST_CURRENT_FIELD_MISSING
GIFT_VOUCHER_TAX_ENGINE_AUTHORITY = PROVEN
GIFT_VOUCHER_TAX_TREATMENT = UNPROVEN_IN_CURRENT_COMPANY_COUNTRY_POLICY
GIFT_VOUCHER_ACCOUNTING_AUTHORITY = INHERITED_FRAMEWORK_NOT_ACTIVE_FOR_VOUCHER
GIFT_VOUCHER_LIABILITY_AUTHORITY = ACCOUNT_2400_DESIGN_HINT_ONLY_NOT_RUNTIME_PROVEN
TREASURY_MOVEMENT_ONLY_ON_PROVEN_FINANCIAL_EVENT = YES_POLICY_NOT_IMPLEMENTED
GIFT_VOUCHER_AUDIT_CONTRACT = CLIENT_RULE_PROVEN_IMPLEMENTATION_NOT_PROVEN
GLOBAL_ROUTE_PERMISSION_COVERAGE_TEST = NOT_RUN_IMPLEMENTATION_NOT_STARTED
GIFT_VOUCHER_PRINT_LAYOUT_AUTHORITY = PROVEN_CLIENT_CONTRACT_NOT_RUNTIME_IMPLEMENTED
GIFT_VOUCHER_REPRINT_CREATES_NEW_VOUCHER = NO
GIFT_VOUCHER_REPRINT_IDENTITY_PRESERVED = CLIENT_RULE_PROVEN_IMPLEMENTATION_NOT_PROVEN
GIFT_VOUCHER_PROJECTION_AUTHORITY_READY = NOT_READY_FINANCIAL_CONTRACT_BLOCKED
MIGRATION_REQUIRED = YES_DESIGN_REQUIRED
MAIN_MIGRATION_APPLY = NOT_AUTHORIZED_IN_THIS_CONTROL
MAIN_DB_BASELINE_CAPTURED = YES
MAIN_DB_CHECK = PASS_READ_ONLY
MAIN_RUNTIME_CHECK = PASS_HEALTH_ONLY
DISPOSABLE_ACCEPTANCE = NOT_RUN_GATE_A_FINANCIAL_BLOCKED
OFFICIAL_DB = darfus_erp
OFFICIAL_BUSINESS_DELTA_BY_CONTROL = 0
OFFICIAL_FINANCIAL_DELTA_BY_CONTROL = 0
OFFICIAL_TREASURY_DELTA_BY_CONTROL = 0
FOCUSED_TESTS = NOT_RUN_GATE_A_BLOCKED
AFFECTED_REGRESSION = NOT_RUN_GATE_A_BLOCKED
TYPECHECK = NOT_RUN_NO_SOURCE_CHANGE
P0 = 0
P1 = 1_FINANCIAL_AUTHORITY_BLOCKER
P2 = 8_IMPLEMENTATION_GAPS_DEFERRED
P3 = 0
GATE_A = BLOCKED_FINANCIAL_AUTHORITY_UNRESOLVED
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 10. Stop

Do not start Gate B, performance benchmarking, print mutation, CRM, CGP print changes, migration promotion, or production work. Owner review is required for the financial authority closure.
