# DARFUS ERP — Gift Voucher Financial Mapping Authority Recovery 01

Control ID: `DARFUS-GIFT-VOUCHER-FINANCIAL-MAPPING-AUTHORITY-RECOVERY-01`
Mode: `READ_FIRST_PLUS_FINANCIAL_AUTHORITY_FORENSIC_AND_SAFE_RECOVERY_DESIGN`
Official DB: `darfus_erp`

## الملخص التنفيذي بالعربية

تم تنفيذ فحص قراءة فقط لسبب فشل إصدار Gift Voucher. طلب الإصدار السابق رجع `422 FINANCIAL_MAPPING_REQUIRED` قبل إنشاء أي سجل، ولم تتم إعادة إرساله. الـTreasury mapping موجود وصحيح، لكن الربط الدلالي المطلوب `GIFT_VOUCHER_LIABILITY` غير موجود للفرعين في قاعدة `darfus_erp`. يوجد حساب مرشح `2400` لكنه ليس سلطة تشغيلية بدون semantic-role mapping، لذلك لم يتم استخدامه مباشرة. كما أن إعداد الشركة الحالي للضريبة `14%` يتعارض مع metadata قانونية في Tax Engine قيمتها `5%` ولا يوجد تاريخ نفاذ محفوظ؛ لذلك يلزم قرار Owner قبل أي استعادة مالية أو proof جديد.

النتيجة: لا توجد كتابة على قاعدة البيانات الرسمية، ولا يوجد إصلاح أو Retry أو Voucher جديد. الـGate محجوب بسبب Tax Authority غير المحسومة، مع توثيق Minimum Safe Fix للتنفيذ لاحقًا على Disposable Clone فقط.

## Executive Summary

| Finding | Result | Evidence | Classification | Severity |
|---|---|---|---|---|
| Canonical issue route | resolves required accounts before persistence | `gift-voucher.service.js`; `financial-account-resolver.service.js` | NO_ISSUE | — |
| Treasury authority | exactly one active cash mapping per active branch | `BranchFinancialMapping` read-only query | NO_ISSUE | — |
| Liability semantic role | zero active `GIFT_VOUCHER_LIABILITY` rows in both branches | `SystemAccountRole` query; prior 422 stack | MISSING_MASTER_DATA | P1 |
| Candidate liability account | account `2400` is active liability but has no role link | `accounts` query | DESIGN_LIMITATION / MAPPING_GAP | P1 |
| Tax policy authority | configured 14%; engine legal metadata 5%; effective date absent | settings/policy/engine trace | OWNER_DECISION_REQUIRED | P1 |
| Official data delta | zero | prior before/after comparison | NO_ISSUE | — |

## Read First / Failure Boundary

The following were read before conclusion: `AGENTS.md`, `PROJECT_PROGRESS_HANDOFF.md`, the official retry report, retry accounting/tax/treasury and DB-delta reports, financial runtime proof, schema implementation report, main runtime parity report, POS Gift Voucher reports, all six required registers, the resolver/catalog/compatibility/bootstrap services, Gift Voucher service, posting service, settings/company-tax/tax-engine/transaction-tax services, sales service, ERP route and idempotency implementation.

The failed request was one prior official attempt: HTTP `422`, code `FINANCIAL_MAPPING_REQUIRED`, request ID `ded2e4a2-4e74-4abf-a3fa-dc59d5becc50`. It was not replayed. No additional `POST /api/v1/gift-vouchers/issue` was sent in this control.

## Supplier / Voucher Financial Contract

Purchased Gift Voucher issue is governed by:

`payment received -> resolved Treasury debit`

`voucher obligation -> resolved GIFT_VOUCHER_LIABILITY credit`

Revenue = `0`; Output VAT = `0`. Redemption is a later Sales Invoice event: Sales owns Revenue and the Tax Engine owns transaction VAT. This control does not change redemption or tax calculation.

## Supplier V2 / Financial Resolver Trace

| Step | Source evidence | Actual |
|---|---|---|
| Payment normalization | `gift-voucher.service.js` `normalizeIssuePaymentMethod` | cash -> `CASH_TREASURY`; bank/card/transfer -> `BANK_ACCOUNT` |
| Treasury resolution | `resolveRequiredBranchFinancialAccount` | requires exactly one active branch mapping; Branch-1 and Branch-2 pass |
| Liability resolution | `resolveRequiredSemanticAccount` | requires exactly one active `SystemAccountRole` row per company/branch; both branches have zero |
| Compatibility | resolver -> account/role checks | not reached for liability on official failed request |
| Persistence boundary | `issuePurchasedVoucher` | Voucher and posting occur only after both resolutions; therefore no partial write |
| Posting | `postingService.postEntry` with resolved IDs | canonical path uses resolved IDs, not literal legacy helpers |

## Semantic Role Matrix

| Role | Meaning | Official state | Authority |
|---|---|---|---|
| `CASH_TREASURY` | cash received | one active mapping per branch | branch financial mapping |
| `BANK_ACCOUNT` | bank/card/transfer receipt | resolver/catalog available; not exercised here | branch financial mapping |
| `GIFT_VOUCHER_LIABILITY` | purchased-voucher obligation | missing in both branches | semantic role mapping — required |
| `SALES_REVENUE` | revenue at redemption | present in catalog/role state | Sales/accounting path — out of issue scope |
| `VAT_PAYABLE` | VAT on taxable sale/redemption | present in catalog/role state | Tax/accounting path — zero on purchase issue |

## Official Master Data Inventory

Database identity: `current_database() = darfus_erp`; `current_user = postgres`.

| Entity | Count/state | Relevance |
|---|---:|---|
| Companies | 1 | company context exists |
| Active branches | 2 | Branch-1 and Branch-2 exist |
| Accounts | 38 | account catalog exists |
| System account roles | 26; 13 per branch | `GIFT_VOUCHER_LIABILITY` absent |
| Branch financial mappings | 67 incl. inactive history | active cash mapping resolves uniquely |
| Settings | 12 | tax policy is configured but ambiguous |
| Cash register sessions | 1 open Branch-2 | not the cause of Branch-1 failure |
| Gift Vouchers | 0 in failed-attempt delta | no issue persisted |

Account `2400` is company-scoped, active, liability type, credit nature, liability classification, named `Gift Voucher Liability`. There is no `SYS-GIFT-VOUCHER-LIABILITY` account code row and no active semantic role link. `2400` is therefore a candidate, not authority.

## Treasury Authority

No separate `treasuries` table was found. Current Treasury authority is the combination of branch financial mapping, resolved Account, cash register session and cash transaction. Branch-1 active `CASH_TREASURY` resolves to `ACC-25af8d3f-9d2d-4584-afc0-880e53926280` / `SYS-CASH`; Branch-2 likewise has one active mapping. Historical inactive duplicates are not active authority.

`TREASURY_MAPPING = FOUND_VALID`.

## Liability Account Authority

`MISSING_SEMANTIC_ROLE_EXACT_NAME = GIFT_VOUCHER_LIABILITY`.

The source catalog declares the role and the canonical service explicitly resolves it. The official DB has zero matching role rows in both branches. The legacy `posting.service.js` helpers reference literal `2400` and `4100`, but the canonical Gift Voucher issue path does not call them. They must not be reactivated as authority or used as a fallback.

`GIFT_VOUCHER_LIABILITY_MAPPING = MISSING`.
`LEGACY_2400_4100_RUNTIME_AUTHORITY = NO`.

## Scope / Currency / Account-Type Authority

| Dimension | Required/current proof |
|---|---|
| Company | Gold ERP company `COMP-48ab554f-427e-4642-9419-bc8616c2dc36` |
| Currency | AED |
| Branch | server-authoritative; two active branches |
| Treasury account | active asset/debit/asset/posting mapping |
| Liability account | active liability/credit/liability account must be resolved through role |
| Purchased issue VAT | zero; no Output VAT |
| Redemption VAT | Sales + Tax Engine, later event |
| Hardcoded account fallback | forbidden and not used by canonical issue route |

## Duplicate / Ambiguous Mapping Check

There is no duplicate active Treasury mapping group and no duplicate active semantic-role group. The observed condition is absence, not ambiguity:

`AMBIGUOUS_FINANCIAL_MAPPING = NO`

The Tax policy is separately ambiguous because two authoritative-looking rate sources are not reconciled.

## Root Cause Classification

`FINANCIAL_MAPPING_ROOT_CAUSE_CLASS = MISSING_MASTER_DATA`.

The resolver correctly fails closed because the required semantic role is missing. The failure is before Voucher, journal, cash transaction, or other business persistence. This is not a tax-engine failure, provider failure, permission failure, or proven product defect.

Impact: purchased Gift Voucher issue is blocked, but no partial business damage occurred.

## Tax Authority Trace

| Layer | Actual |
|---|---|
| Official settings | `vatRate = 14`; `purchaseVatRate` absent, so purchase fallback is configured `vatRate` |
| Enabled treatments | `STANDARD_VAT`, `EXEMPT`, `REVERSE_CHARGE`, `OUT_OF_SCOPE` |
| Company tax policy | reads company/settings and exposes configured rate |
| UAE tax engine | legal standard metadata `5%`; accepts configured 0–100% |
| Transaction tax context | law version `UAE-VATP043-2025-02-26`, law effective date `2025-02-26`; effective rate comes from company policy |
| Effective-date storage | no settings effective-date column proven |
| Prior read-only preview | base `2838.44`, VAT `397.38`, total `3235.82`; 14% applied once |

`CURRENT_CONFIGURED_VAT_RATE = 14%`.
`TAX_RATE_AUTHORITY = AMBIGUOUS`.
`OWNER_POLICY_DECISION_REQUIRED = YES`.
`TAX_CHANGED = NO`.

The Tax ambiguity does not explain the 422; the resolver rejects the missing liability role earlier. It blocks this recovery gate because future financial proof must not choose a rate silently.

## Minimum Safe Fix Design

After Owner freezes the Tax policy and separately authorizes a disposable-clone rehearsal:

1. Recheck exact company and branch scope.
2. Provision exactly one active `SystemAccountRole` mapping for `GIFT_VOUCHER_LIABILITY` per active branch through the existing application/bootstrap authority.
3. Point it to an Owner-approved compatible liability account.
4. Do not hardcode `2400`, create a parallel accounting authority, or alter the canonical issue service.
5. Run resolver, accounting, idempotency, and rollback proofs on the disposable clone only.
6. Keep official DB unchanged until a future, separately named promotion authorization.

No migration is required by the current evidence. If a schema change is later claimed, stop under `BLOCKED_GIFT_VOUCHER_FINANCIAL_MAPPING_AUTHORITY_RECOVERY_SCHEMA_CHANGE` and do not create/apply it automatically.

## Clone Evidence

Existing disposable `darfus_gift_voucher_schema_impl_01` was verified by `current_database()` and not mutated. It contains the liability role for both branches, account 2400, 13 pre-existing vouchers, and 13 balanced issue journals. It is historical/non-fresh supporting evidence, not controlled proof.

`CLONE_REQUIRED = YES_FOR_FUTURE_MAPPING_PROOF`.
`CLONE_ISOLATION = PASS_IDENTITY_VERIFIED_NO_MUTATION`.
`CLONE_GV_ISSUE_FINANCIAL_PROOF = NOT_RUN_IN_THIS_FORENSIC_CONTROL`.

## Idempotency Boundary

The existing implementation canonicalizes `{scope, params, body}` with recursively sorted object keys, preserves array order, removes `idempotencyKey` and `idempotency-key` from the body, and hashes with SHA-256. The unique company/scope/key claim occurs in the caller transaction; same hash replays the result and changed hash conflicts. No new key was claimed in this control.

`IDEMPOTENCY_HASH_INPUT_PROVEN = YES`.
`FAILED_POST_REPLAYED = NO`.

## Official DB Zero Delta

The previous failed-attempt before/after comparison was unchanged:

| Entity | Before | After | Delta |
|---|---:|---:|---:|
| Gift Vouchers | 0 | 0 | 0 |
| Voucher branch eligibilities | 0 | 0 | 0 |
| Voucher print events | 0 | 0 | 0 |
| Invoices | 3 | 3 | 0 |
| Invoice items | 3 | 3 | 0 |
| Payments | 3 | 3 | 0 |
| Cash transactions | 11 | 11 | 0 |
| Journal entries | 29 | 29 | 0 |
| Journal lines | 81 | 81 | 0 |
| Inventory movements | 70 | 70 | 0 |
| Asset events | 74 | 74 | 0 |
| Audit logs | 189 | 189 | 0 |
| Idempotency requests | 105 | 105 | 0 |
| SequelizeMeta | 93 | 93 | 0 |

`OFFICIAL_DB_BUSINESS_DELTA = 0`.
`OFFICIAL_DB_FINANCIAL_MAPPING_DELTA = 0`.
`OFFICIAL_DB_WRITES = 0`.

## Focused Tests / Regression / Typecheck

Read-only static contract tests were run without changing source or tests:

- financial bootstrap contract tests and existing Gift Voucher/Tax/POS/CGP/UI affected tests: `48 passed / 0 failed`;
- TypeScript check: `npm exec -- tsc --noEmit --incremental false` — exit code 0;
- no runtime Voucher issue, checkout, redemption, mapping write, migration, or official DB mutation was run.

`FOCUSED_TESTS = PASS`.
`TYPECHECK = PASS`.
`RUNTIME_FINANCIAL_MAPPING_PROOF = NOT_RUN_PENDING_OWNER_TAX_DECISION_AND_CLONE_AUTHORIZATION`.

## Registers Updated

The six current registers were updated by documentation only with:

- `GV-FINANCIAL-MAPPING-001` — missing liability semantic role;
- `FINANCIAL-MAPPING-PREFLIGHT-001` — future clone-only preflight;
- `TAX-RATE-AUTHORITY-VERIFY-001` — configured/legal/effective-date reconciliation;
- prevention entry `GV-L-007` — readiness must check semantic role before financial acceptance.

Historical `GV-E-009`, `GV-I-004`, `GV-L-006`, and `GV-ISSUE-FINANCIAL-MAPPING-001` were preserved, not rewritten or closed.

## Risk / Priority Matrix

| ID | Issue | Classification | Severity | Priority | Evidence | Blocks future financial proof? |
|---|---|---|---|---|---|---|
| GV-FINANCIAL-MAPPING-001 | `GIFT_VOUCHER_LIABILITY` role missing in both branches | MISSING_MASTER_DATA | P1 | P1 | resolver + official role query + HTTP 422 | Yes |
| TAX-RATE-AUTHORITY-VERIFY-001 | 14% configured vs 5% legal metadata; no effective date | OWNER_DECISION_REQUIRED / FINANCIAL | P1 | P1 | settings, policy, tax-engine trace | Yes |
| GV-LEGACY-LITERAL-001 | legacy helpers contain literal 2400/4100 | DESIGN_LIMITATION | P2 | P2 | `posting.service.js`; canonical issue path bypasses helpers | No, provided unreachable |

`P0_COUNT = 0`.
`P1_COUNT = 2`.
`P2_COUNT = 1`.

## Gate

The resolver failure and official zero-delta proof pass. The overall control cannot PASS because the Tax Authority is explicitly unresolved and the control requires a proven Tax authority before financial mapping recovery.

`GATE = BLOCKED_GIFT_VOUCHER_FINANCIAL_MAPPING_AUTHORITY_RECOVERY_TAX_AUTHORITY_UNRESOLVED`

## Final Tokens

```text
CURRENT_CONTROL = DARFUS-GIFT-VOUCHER-FINANCIAL-MAPPING-AUTHORITY-RECOVERY-01
MODE = READ_FIRST_PLUS_FINANCIAL_AUTHORITY_FORENSIC_AND_SAFE_RECOVERY_DESIGN
OFFICIAL_DATABASE = darfus_erp
DATABASE_IDENTITY_PROVEN = YES
FAILED_POST_REPLAYED = NO
FINANCIAL_MAPPING_ROOT_CAUSE_CLASS = MISSING_MASTER_DATA
MISSING_SEMANTIC_ROLE_EXACT_NAME = GIFT_VOUCHER_LIABILITY
TREASURY_MAPPING = FOUND_VALID
GIFT_VOUCHER_LIABILITY_MAPPING = MISSING
AMBIGUOUS_FINANCIAL_MAPPING = NO
LEGACY_2400_4100_RUNTIME_AUTHORITY = NO
CURRENT_CONFIGURED_VAT_RATE = 14%
TAX_RATE_AUTHORITY = AMBIGUOUS
OWNER_POLICY_DECISION_REQUIRED = YES
TAX_CHANGED = NO
IDEMPOTENCY_HASH_INPUT_PROVEN = YES
CLONE_REQUIRED = YES_FOR_FUTURE_MAPPING_PROOF
CLONE_ISOLATION = PASS_IDENTITY_VERIFIED_NO_MUTATION
CLONE_GV_ISSUE_FINANCIAL_PROOF = NOT_RUN_IN_THIS_FORENSIC_CONTROL
FOCUSED_TESTS = PASS
TYPECHECK = PASS
OFFICIAL_DB_BUSINESS_DELTA = 0
OFFICIAL_DB_FINANCIAL_MAPPING_DELTA = 0
OFFICIAL_DB_WRITES = 0
MIGRATION_CREATED = NO
MIGRATION_EXECUTED = NO
SOURCE_FILES_CHANGED = 0
TEST_FILES_CHANGED = 0
P0_COUNT = 0
P1_COUNT = 2
P2_COUNT = 1
GATE = BLOCKED_GIFT_VOUCHER_FINANCIAL_MAPPING_AUTHORITY_RECOVERY_TAX_AUTHORITY_UNRESOLVED
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Next Step / STOP

Owner decision required only for the company Tax policy/effective-date authority and explicit authorization of future Disposable Clone mapping proof. Do not write the official mapping, do not retry Voucher issue, do not issue/activate/redeem Voucher, do not change Tax settings, and do not start another batch automatically.

**توقف هنا: التقرير مكتمل، وقاعدة `darfus_erp` لم تُعدّل.**

