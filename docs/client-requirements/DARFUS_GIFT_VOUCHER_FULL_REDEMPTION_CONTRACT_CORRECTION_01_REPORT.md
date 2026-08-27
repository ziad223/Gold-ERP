# DARFUS ERP - Gift Voucher Full Redemption Contract Correction Report

## Executive Summary

تمت قراءة برومبت الـControl وملفات DOCX المرجعية وقراءة مصدر Gift Voucher
والتقارير السابقة. تم تصحيح الـcontract drift الذي كان يصف `Partial redemption`
كحدث Gift Voucher صالح، وتثبيت أن Gift Voucher متخصص على
`FULL_REDEMPTION_ONLY` و`ONE_TIME`. لم يتم تفعيل إصدار أو استرداد، ولم يتم إنشاء
Voucher أو Payment أو Journal، ولم تتم أي كتابة على `darfus_erp`.

النتيجة: تصحيح العقد مغلق، أما تنفيذ Gift Voucher المالي/التشغيلي نفسه فما زال
مؤجلاً إلى Control مستقل مع schema وaccounting وruntime proof.

## Scope and Safety

| Item | Result |
|---|---|
| Control | `DARFUS-GIFT-VOUCHER-FULL-REDEMPTION-CONTRACT-CORRECTION-01` |
| Mode | `READ_FIRST_PLUS_CONTRACT_CORRECTION_ONLY` |
| Official DB | `darfus_erp` |
| Workflow mutation | Not executed |
| Official DB mutation | `0` |
| Migration/seed/backfill | Not created or executed |
| Production contact | None |
| New clone | None; no runtime state requiring a clone was used |
| Client business rules changed | No; only stale contract wording was corrected |

## Authority and Source Coverage

The specialized Gift Voucher document was treated as the first business authority.
Deposit and Sales Invoice were used only for inherited shared behavior where the
specialized document is silent. Sales Module and Accounting were used as generic
framework authorities. Existing D2F artifacts were supporting evidence and were not
allowed to override the specialized contract.

The five DOCX packages were read through all available `word/*.xml` parts. No
embedded media was present in these five packages, so there was no image-only Gift
Voucher requirement to recover.

| Document | SHA-256 | Bytes | Word XML parts | Text runs | Paragraph tags | Tables | Media |
|---|---|---:|---:|---:|---:|---:|---:|
| `6- Gift Voucher Invoice.docx` | `37666b86930fab89a1e66e7c78bcd2bd4105d495fdb8867bcf77a479549acd3a` | 51,558 | 7 | 2,994 | 390 | 0 | 0 |
| `5- Deposit Invoice.docx` | `272ef0597575a515a1c69a81aec73b9d7b0f48d54ee5c7b4bf552b7d16059483` | 63,310 | 7 | 4,977 | 578 | 0 | 0 |
| `1- Sales Invoice.docx` | `28592210ec9f52680a135fde0224cb89bed70348b94dd113be5e59497e46c4f4` | 115,141 | 7 | 7,217 | 3,085 | 2 | 0 |
| `0- Sales Module Documentation.docx` | `63ee0a422f5290f7514bd46fcc5f934732e53b40bd506cf992dd2f8635b5e1a3` | 102,121 | 7 | 6,009 | 3,039 | 1 | 0 |
| `Accounting شامل.docx` | `74954abd97bbe5071338cc1b0e70bf36bd39606d637c20da3ecbb674f01da84a` | 179,954 | 7 | 6,623 | 5,511 | 0 | 0 |

`CLIENT_DOCS_READ_COMPLETE = YES`

## Preserved Current Runtime Safety

Read-only source and runtime evidence:

| Layer | Evidence | Result |
|---|---|---|
| GET routes | `backend/src/routes/erp.routes.js:16376-16401` | List/detail are company-scoped reads. |
| Issue route | `backend/src/routes/erp.routes.js:16405-16411` | Stable-forbidden before mutation. |
| Redeem route | `backend/src/routes/erp.routes.js:16413-16419` | Stable-forbidden before mutation. |
| Stable error | `GIFT_VOUCHER_FINANCIAL_WORKFLOW_DISABLED` | No active issue/redeem runtime path. |
| Projection | `backend/src/services/invoice-projection.service.js:87-99` | `SUPPORTED_LATER`, adapter null, detail/print false. |
| Official DB identity | `SELECT current_database(), current_user` | `darfus_erp | postgres`. |
| Official DB count | `SELECT count(*) FROM gift_vouchers` | `0`; no voucher rows were created. |
| Main health | `GET /api/v1/health` | HTTP 200. |
| DB health | `GET /api/v1/health/db` | HTTP 200. |
| Redis health | `GET /api/v1/health/redis` | HTTP 200. |

No write endpoint was called by this control. The current `gift_vouchers` count of
zero is observed state, not an attempted issue or redemption.

## Corrected Gift Voucher Contract

The specialized contract is now explicit:

- `INDIVIDUAL_VOUCHER_REDEMPTION_MODE = FULL_REDEMPTION_ONLY`.
- Partial allocation is forbidden; a residual balance and multi-transaction
  consumption are invalid outcomes.
- A successful redemption is `ONE_TIME` and consumes the full voucher value.
- Voucher code must be globally unique, immutable, and never reused. This is a
  recorded future schema/runtime requirement; no migration was created here.
- Issuance, activation, and distribution remain separate events.
- Customer is optional at issuance where anonymous issuance is allowed.
- Face value is fixed at issuance; currency and branch eligibility are server-side
  authorities.
- Allocation belongs to the central Payment Engine through a strict Gift Voucher
  adapter, with canonical atomicity, concurrency, and idempotency controls.
- Purchased issue is `Dr resolved treasury / Cr resolved Gift Voucher Liability`,
  with no issue revenue and no Output VAT.
- Purchased redemption is a payment allocation against a real Sales Invoice. The
  Sales Invoice and Tax Engine own revenue and VAT; the voucher service does not
  calculate a second VAT or create a second sale.
- Non-purchased classes, expiry, cancellation, breakage, refund, and write-off are
  separate policies and remain fail-closed until approved.
- Print/reprint preserves the same voucher identity; a projection is read-only and
  cannot become a second posting owner.
- Existing User/Auth/RBAC, company, branch, and audit authority is preserved.

## Drift Correction

The corrected source artifact is
`docs/client-requirements/DARFUS_D2F_GV_FINANCIAL_EVENT_MATRIX.md`. Its former
valid-event row now states that partial redemption is not a valid Gift Voucher
event, has no Payment Engine allocation, and must be rejected before mutation.

The Purchased Voucher policy was clarified so that “partial-redemption rounding”
is not an unresolved future partial feature; it is an unauthorized path that must
fail closed under the specialized full-redemption contract.

### Drift classifications

| Surface | Classification | Disposition |
|---|---|---|
| D2F financial event matrix partial row | Active contract drift | Corrected. |
| D2F purchased policy wording | Ambiguous contract wording | Clarified. |
| Transactional demo seeder description | Inactive legacy artifact | Preserved; no seeder run or edit. |
| Disabled UI optional redeem amount | Inactive disabled surface | Preserved; it cannot be treated as active authority. |
| Generic non-Gift Voucher partial payment paths | No issue / out of scope | Preserved. |
| Posting helpers with `2400`/`4100` | Inactive dangerous helper | Preserved but unreachable from active Gift Voucher routes. |
| Gift Voucher invoice projection | Correct future boundary | Preserved as inactive. |

`ACTIVE_GIFT_VOUCHER_CONTRACT_DRIFT = 0`

## Dangerous Helper and Route Check

`backend/src/services/posting.service.js:869-912` contains legacy
`postVoucherIssueEntry` and `postVoucherRedeemEntry` helpers, including literal
`2400` liability and `4100` revenue references. They are not an active runtime
authority: `backend/src/routes/erp.routes.js:16405-16419` returns the stable disabled
error and does not call them.

Therefore:

`LEGACY_DIRECT_ISSUE_POSTING_ACTIVE = NO`

`LEGACY_DIRECT_REDEMPTION_REVENUE_ACTIVE = NO`

`DANGEROUS_DIRECT_ACCOUNT_HELPERS_ACTIVE = NO_RUNTIME_PATH`

The helpers were not rewritten in this control because doing so would be financial
workflow implementation, outside the approved scope.

## Generic Payment Boundary

Generic payment/installment/reservation behavior may support partial payments or
remaining balances for its own business methods. That behavior is not inherited by
Gift Voucher redemption. The specialized adapter must reject a partial Gift Voucher
amount while leaving unrelated generic methods unchanged.

`GENERIC_PAYMENT_PARTIALITY_CHANGED = NO`

## Static Contract Tests

Test command:

`node --test backend/tests/gift-voucher-full-redemption-contract.test.cjs`

Result: **17 passed, 0 failed**. This includes `GV-CONTRACT-01` through
`GV-CONTRACT-16` plus matrix coverage. The test proves the corrected contract,
financial boundaries, route fail-closed behavior, projection boundary, inactive
legacy helpers, and preservation of generic non-Gift Voucher behavior.

Regression command:

`node --test backend/tests/d1-unified-invoice-projection.test.cjs backend/tests/e-cgp-invoice-projection.test.cjs tests/d2-final-invoice-search-print.test.cjs`

Result: **15 passed, 0 failed**. Gift Voucher remains `SUPPORTED_LATER`, has no
adapter/detail/print path, and the CGP/Invoice projection authorities are unchanged.

## No Implementation Boundary Crossed

| Protected area | This control |
|---|---|
| Gift Voucher issue/redeem workflow | Not implemented or executed |
| Payment Engine | Not changed |
| Tax Engine | Not changed |
| Accounting/posting | Not changed |
| Gift Voucher schema/migration | Not changed |
| UI enablement | Not changed |
| Invoice projection activation | Not changed |
| Master data | Not changed |
| Official database | Read-only; zero writes |
| Production | Not contacted |

## Remaining Risks and Deferred Implementation Prerequisites

These are not active contract drift after the correction, but they block a future
Gift Voucher implementation batch:

1. The current schema does not prove a unique durable Voucher Code, durable
   currency, canonical branch FK, activation/distribution state, payment linkage,
   tax snapshot, or complete lifecycle audit linkage.
2. A future implementation must replace/retire the inactive optional-amount UI
   contract before enabling redemption.
3. Future posting must use semantic account-role resolution and must not activate
   the legacy literal-account helpers.
4. Future runtime proof must prove atomicity, concurrency, idempotency, full-value
   redemption, invoice tax/revenue ownership, and zero residual balance on a safe
   approved target.
5. Non-purchased funding and expiry/cancellation/breakage/refund/write-off require
   separate owner decisions.

No risk above was repaired or bypassed here.

## Final Decision

`GIFT_VOUCHER_FULL_REDEMPTION_CONTRACT = CLOSED`

`GIFT_VOUCHER_IMPLEMENTATION = NOT_CLOSED_BY_THIS_CONTROL`

`P0_CURRENT = 0`

`P1_CURRENT = 0`

`P2_DEFERRED_IMPLEMENTATION_PREREQUISITES = 5`

`GATE = PASS_GIFT_VOUCHER_FULL_REDEMPTION_CONTRACT_CORRECTION`

This gate does not authorize D2F Gate B, Gift Voucher workflow implementation,
CRM, or any database mutation.

## Final Tokens

```text
CURRENT_CONTROL = DARFUS-GIFT-VOUCHER-FULL-REDEMPTION-CONTRACT-CORRECTION-01
MODE = READ_FIRST_PLUS_CONTRACT_CORRECTION_ONLY
OFFICIAL_DB = darfus_erp
CLIENT_DOCS_READ_COMPLETE = YES
CURRENT_SOURCE_READ_COMPLETE = YES
D2F_ARTIFACTS_READ_COMPLETE = YES
GIFT_VOUCHER_FULL_REDEMPTION_AUTHORITY = FROZEN
INDIVIDUAL_VOUCHER_REDEMPTION_MODE = FULL_REDEMPTION_ONLY
PARTIAL_REDEMPTION_ALLOWED = NO
RESIDUAL_BALANCE_ALLOWED = NO
MULTI_TRANSACTION_CONSUMPTION_ALLOWED = NO
ONE_TIME_REDEMPTION = YES
CODE_UNIQUE_IMMUTABLE_NEVER_REUSED = REQUIRED_LATER_NO_MIGRATION_THIS_CONTROL
ISSUANCE_ACTIVATION_SEPARATE = YES
CUSTOMER_AT_ISSUANCE = OPTIONAL
FACE_VALUE = FIXED_AT_ISSUANCE
CURRENCY_AUTHORITY = SERVER_COMPANY
BRANCH_ELIGIBILITY_AUTHORITY = CANONICAL_SERVER_POLICY
PAYMENT_ENGINE_AUTHORITY = CENTRAL_ENGINE_STRICT_GV_ADAPTER
ATOMICITY_CONCURRENCY_IDEMPOTENCY = REQUIRED
PURCHASED_ISSUE_DEBIT = RESOLVED_TREASURY
PURCHASED_ISSUE_CREDIT = RESOLVED_GIFT_VOUCHER_LIABILITY
PURCHASED_ISSUE_REVENUE = NO
PURCHASED_ISSUE_OUTPUT_VAT = NO
REDEMPTION_REVENUE_TAX_AUTHORITY = ACTUAL_SALES_INVOICE_AND_TAX_ENGINE
NON_PURCHASED_POLICY = SEPARATE_OWNER_POLICY_FAIL_CLOSED
EXPIRY_CANCEL_BREAKAGE_REFUND_WRITEOFF = SEPARATE_POLICY_FAIL_CLOSED
PRINT_REPRINT_IDENTITY_PRESERVED = YES
PROJECTION = READ_ONLY_FUTURE_ADAPTER
LEGACY_DIRECT_ISSUE_POSTING_ACTIVE = NO
LEGACY_DIRECT_REDEMPTION_REVENUE_ACTIVE = NO
DANGEROUS_DIRECT_ACCOUNT_HELPERS_ACTIVE = NO_RUNTIME_PATH
ACTIVE_GIFT_VOUCHER_CONTRACT_DRIFT = 0
GIFT_VOUCHER_WORKFLOW_MUTATIONS = 0
OFFICIAL_DB_WRITES = 0
MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED = 0
GIFT_VOUCHER_CONTRACT_TESTS = 17_PASS_0_FAIL
INVOICE_PROJECTION_REGRESSION_TESTS = 15_PASS_0_FAIL
P0_CURRENT = 0
P1_CURRENT = 0
GIFT_VOUCHER_FULL_REDEMPTION_CONTRACT = CLOSED
GATE = PASS_GIFT_VOUCHER_FULL_REDEMPTION_CONTRACT_CORRECTION
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. Do not start D2F Gate B, CRM, Gift Voucher implementation, or any mutation
without a separate explicit Owner-approved control.
