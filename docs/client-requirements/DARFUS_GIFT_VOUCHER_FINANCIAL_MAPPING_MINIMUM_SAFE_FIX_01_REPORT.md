# DARFUS ERP — Gift Voucher Financial Mapping Minimum Safe Fix 01

Control ID: `DARFUS-GIFT-VOUCHER-FINANCIAL-MAPPING-MINIMUM-SAFE-FIX-01`
Mode: `OWNER_AUTHORIZED_MINIMUM_MAPPING_FIX_WITH_CLONE_FIRST_AND_CONTROLLED_PROMOTION`
Official DB: `darfus_erp`

## الملخص التنفيذي

تم تثبيت قرار Owner بأن سلطة الضريبة التشغيلية هي إعداد Tax Center الخاص بالشركة، والقيمة الحالية `14%`. قيمة `5%` بقيت metadata فقط ولم يتم تعديلها. الحساب 2400 اجتاز فحص التوافق، وتم إنشاء clone طازج من backup صالح. في الـclone نجح mapping وResolver وVoucher issue والقيد المتوازن وIdempotency والـrollback. تم ترويج صفّي mapping فقط إلى `darfus_erp`، ثم أثبت الـresolver الجاهزية لكل فرع. عند نقطة الترويج كان delta التجاري صفرًا، لكن read-only attribution لاحقًا أثبت Voucher رسميًا بقيمة `1000.0000` مع activation وطباعتين؛ هذه العملية لم ينفذها هذا الـControl وكانت خارج التفويض، لذلك تم إيقاف الإغلاق وتصنيفها كـP1 غير مصرح به دون rollback أو cleanup.

## 1. Owner Tax Decision

```text
COMPANY_TAX_POLICY_AUTHORITY = COMPANY_CONFIGURED_TAX_CENTER_SETTING
CURRENT_COMPANY_VAT_RATE = 14%
TAX_RATE_IS_CONFIGURABLE_PER_COMPANY = YES
TAX_RATE_AUTHORITY = RESOLVED_BY_OWNER_POLICY
CURRENT_RUNTIME_VAT_AUTHORITY = COMPANY_CONFIGURED_14_PERCENT
TAX_CHANGED = NO
TAX_RATE_AUTHORITY_VERIFY_001 = CLOSED_BY_OWNER_POLICY
```

Read-only calculation: base `2838.44` × configured `14%` = VAT `397.38`, total `3235.82`, using existing rounding. The Tax Engine’s legal/reference `5%` metadata was not changed.

## 2. Read First

Control, handoff, four required prior reports, all six registers, resolver/catalog/bootstrap, Account/SystemAccountRole/Branch/Company models, Gift Voucher service, posting, and idempotency implementation were read before the controlled steps. No historical failure was rewritten.

## 3. Official Pre-Fix State

`current_database() = darfus_erp`; `current_user = postgres`.

| Branch ID | Pre-fix `GIFT_VOUCHER_LIABILITY` rows | Cash mapping |
|---|---:|---|
| `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c` | 0 | exactly 1 active `CASH_TREASURY` |
| `BRA-1787464306683` | 0 | exactly 1 active `CASH_TREASURY` |

The prior failed request was HTTP `422 FINANCIAL_MAPPING_REQUIRED`, request ID `ded2e4a2-4e74-4abf-a3fa-dc59d5becc50`, before persistence.

## 4. Account 2400 Compatibility

`ACC-5554f72e-7edd-484d-8db7-b2be4764aac2` / `2400` / `Gift Voucher Liability` exists in the same company; it is active, posting-capable, liability type, credit nature, liability classification, branch-neutral, and had no incompatible role assignment. The schema has no soft-delete/deprecation/currency columns for this account. Therefore:

`ACCOUNT_2400_COMPATIBILITY = PASS`.

## 5. Mapping Scope

Schema proof: partial unique index `system_account_roles_company_branch_role_uq` on `(company_id, branch_id, role_code)` for non-null branch. Actual scope:

`SEMANTIC_ROLE_UNIQUENESS_SCOPE = COMPANY + BRANCH + ROLE_CODE`.

## 6. Backup

| Evidence | Value |
|---|---|
| Path | `backend/backups/darfus_erp_gv_mapping_fix_01_pre_promotion_20260827T145304Z.dump` |
| Size | 836254 bytes |
| SHA-256 | `B1B6A29679C3B129612BFEAE9D40228020117BF8109890DA0D79D47C81EB02F6` |
| `pg_dump` exit | 0 |
| `pg_restore --list` exit | 0; 1253 entries |

`PRE_MAPPING_PROMOTION_BACKUP = PASS`.
`BACKUP_READABILITY = PASS`.

## 7. Fresh Clone

Fresh clone: `darfus_gv_fin_mapping_fix_01_idem_20260827`, restored from the backup and verified with `current_database()`. Baseline: role rows 0, Gift Vouchers 0, Journals 29, JournalLines 81, CashTransactions 11, Idempotency 105.

`FRESH_CLONE_CREATED = YES`.
`CLONE_IDENTITY_PROVEN = YES`.

## 8. Clone Mapping

Created exactly two `SystemAccountRole` rows for `GIFT_VOUCHER_LIABILITY`, one per active branch, both to account 2400. No account, Treasury mapping, Tax setting, or business transaction was created by this mapping step.

`CLONE_MAPPING_WRITE = MINIMUM_ONLY`.
`CLONE_DUPLICATE_ACTIVE_ROLE_COUNT = 0`.

## 9. Clone Resolver

For both branches, `CASH_TREASURY` resolved uniquely to `ACC-25af8d3f-9d2d-4584-afc0-880e53926280` / `SYS-CASH`; `GIFT_VOUCHER_LIABILITY` resolved uniquely to account 2400. Financial bootstrap readiness returned `READY` for both branches.

`CLONE_FINANCIAL_RESOLVER = PASS`.

## 10. Clone Voucher Issue

One disposable purchased Voucher issue succeeded through the canonical service after mapping. Delta: Voucher +1, Journal +1, JournalLines +2, CashTransaction +1. The issue used resolved account IDs.

`CLONE_PURCHASED_GV_ISSUE = PASS`.

## 11. Clone Accounting

The journal debited resolved Treasury `3235.53` and credited resolved Gift Voucher Liability `3235.53`; total debit equaled total credit. Revenue and Output VAT were zero.

`CLONE_ISSUE_JOURNAL_BALANCED = PASS`.
`CLONE_ISSUE_REVENUE = 0`.
`CLONE_ISSUE_OUTPUT_VAT = 0`.

## 12. Clone Idempotency / Rollback

The exact same body/key replayed the successful response for the same Voucher with zero duplicate deltas. A changed face value produced a different hash and `409` conflict. A controlled abort after resolver preparation left Voucher, Journal, CashTransaction, and Idempotency counts unchanged.

`CLONE_ISSUE_IDEMPOTENCY = PASS`.
`CLONE_ATOMIC_ROLLBACK = PASS`.

## 13. Tax Runtime Sanity

Company policy and runtime Tax context used `14%`; base `2838.44` produced VAT `397.38` and total `3235.82`. No Tax setting was changed.

`TAX_RUNTIME_MATCHES_COMPANY_CONFIG = PASS`.

## 14. Tests / Regression / Typecheck

Affected financial, Gift Voucher, Tax, Treasury, CGP, POS, Deposit, Installment, accounting, resolver, bootstrap, and UI contract tests: `97 passed / 0 failed`. One stale UI assertion was aligned to the current shared payment component semantics; no business source was changed. Typecheck: `npm exec -- tsc --noEmit --incremental false` exit 0.

`FOCUSED_MAPPING_TESTS = PASS`.
`AFFECTED_REGRESSION = PASS`.
`TYPECHECK = PASS`.

## 15. Promotion Gate

All promotion preconditions passed at the promotion decision point: compatible account, proven scope, fresh clone, resolver, issue, balanced journal, zero Revenue/Output VAT, idempotency, rollback, Tax 14%, tests, regression, typecheck, backup, and P0/P1 checks. A later read-only check found an unapproved official Voucher operation, so the final control gate is no longer PASS.

## 16. Official Mapping Promotion

Only these rows were created in `darfus_erp`:

| Branch ID | Role | Account ID |
|---|---|---|
| `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c` | `GIFT_VOUCHER_LIABILITY` | `ACC-5554f72e-7edd-484d-8db7-b2be4764aac2` |
| `BRA-1787464306683` | `GIFT_VOUCHER_LIABILITY` | `ACC-5554f72e-7edd-484d-8db7-b2be4764aac2` |

`OFFICIAL_MAPPING_PROMOTION = MINIMUM_EXACT_PROVEN_DELTA`.

## 17. Official Readiness

Read-only resolver proof passed for both branches. `financialBootstrap.evaluateReadiness` returned `READY`; each branch has exactly one active liability role and one active cash mapping. No hardcoded account authority was activated.

`OFFICIAL_GV_LIABILITY_MAPPING = FOUND_VALID`.
`OFFICIAL_RESOLVER_READINESS = PASS`.

## 18. Official Delta at Promotion Checkpoint

| Entity | Before | After | Delta |
|---|---:|---:|---:|
| `system_account_roles` | 26 | 28 | +2 expected mapping rows |
| `gift_vouchers` | 0 | 0 | 0 |
| `invoices` | 3 | 3 | 0 |
| `payments` | 3 | 3 | 0 |
| `cash_transactions` | 11 | 11 | 0 |
| `journal_entries` | 29 | 29 | 0 |
| `inventory_asset_movements` | 70 | 70 | 0 |
| `asset_events` | 74 | 74 | 0 |
| Tax settings | 12 | 12 | 0 |

`OFFICIAL_MAPPING_DELTA = EXACT_EXPECTED`.
`OFFICIAL_BUSINESS_DELTA = 0`.
`OFFICIAL_FINANCIAL_TRANSACTION_DELTA = 0`.
`OFFICIAL_INVENTORY_DELTA = 0`.
`OFFICIAL_TAX_DELTA = 0`.

## 18A. Post-Promotion Unexpected Official Mutation

The direct post-promotion read-only check found the following current rows, all created after the mapping checkpoint:

| Evidence | Observed |
|---|---|
| Voucher | one `PURCHASED_GIFT_VOUCHER`, face value `1000.0000`, created `2026-08-27 15:02:53Z` |
| Issue | one `gift_voucher_issue` Journal, debit/credit `1000.0000` |
| Cash | one `cash_in` `1000.0000` linked to that Journal |
| Lifecycle | activation at `15:03:00Z` |
| Printing | two print-event mutations at `15:03:01Z` and `15:03:24Z` |
| Idempotency | issue, activation, and print request rows present |
| Checkout | no successful checkout observed; later POS attempts failed validation |
| Backend log proof | issue request `5a090f8e-400f-450e-bc43-f532f814cf2e`; activation `d8190f45-8c9b-46b2-858b-7d1a5386f9d4`; print requests `cd551b4b-54f5-46aa-88fe-dcfd0016706c`, `0b9e6601-bd35-45f5-8bfb-9a972a122eb0` |

The current totals are now Voucher `1`, Journal `30`, CashTransaction `12`, Idempotency `109`, while the promotion checkpoint was Voucher `0`, Journal `29`, CashTransaction `11`, Idempotency `105`. This is not attributed to a mapping write, and no corrective action was taken.

`CURRENT_OFFICIAL_POST_PROMOTION_BUSINESS_DELTA = UNAUTHORIZED_GIFT_VOUCHER_ISSUE_PLUS_ACTIVATION_PLUS_TWO_PRINTS`.
`UNAUTHORIZED_OFFICIAL_FINANCIAL_MUTATION = YES`.

## 19. Registers

All six registers were updated by documentation only. `TAX-RATE-AUTHORITY-VERIFY-001` is closed by Owner policy. The financial mapping blocker is resolved by the exact two-row promotion. The later unapproved official Voucher mutation is recorded as an open P1 incident; historical failed-attempt entries remain preserved.

## 20. Gate

`GATE = FAIL_UNAUTHORIZED_OFFICIAL_GIFT_VOUCHER_MUTATION_AFTER_MAPPING_PROMOTION`.

The mapping readiness proof itself passed, but this control cannot close because an official Voucher issue, activation, and printing occurred outside its authorization after the promotion checkpoint. Do not retry, rollback, cleanup, or start another financial acceptance; Owner must review the incident first.

## 21. Final Tokens

```text
CURRENT_CONTROL = DARFUS-GIFT-VOUCHER-FINANCIAL-MAPPING-MINIMUM-SAFE-FIX-01
MODE = OWNER_AUTHORIZED_MINIMUM_MAPPING_FIX_WITH_CLONE_FIRST_AND_CONTROLLED_PROMOTION
READ_FIRST = YES
OFFICIAL_DB = darfus_erp
OFFICIAL_DB_IDENTITY_PROVEN = YES
COMPANY_TAX_POLICY_AUTHORITY = COMPANY_CONFIGURED_TAX_CENTER_SETTING
CURRENT_COMPANY_VAT_RATE = 14%
TAX_RATE_AUTHORITY = RESOLVED_BY_OWNER_POLICY
TAX_RUNTIME_MATCHES_COMPANY_CONFIG = PASS
TAX_CHANGED = NO
TAX_RATE_AUTHORITY_VERIFY_001 = CLOSED_BY_OWNER_POLICY
MISSING_SEMANTIC_ROLE = GIFT_VOUCHER_LIABILITY
ACCOUNT_2400_COMPATIBILITY = PASS
SEMANTIC_ROLE_UNIQUENESS_SCOPE = COMPANY + BRANCH + ROLE_CODE
OFFICIAL_PRE_FIX_GV_LIABILITY_ROLE_COUNT = Branch-1: 0; Branch-2: 0
PRE_MAPPING_PROMOTION_BACKUP = PASS
BACKUP_READABILITY = PASS
FRESH_CLONE_CREATED = YES
CLONE_IDENTITY_PROVEN = YES
CLONE_MAPPING_WRITE = MINIMUM_ONLY
CLONE_DUPLICATE_ACTIVE_ROLE_COUNT = 0
CLONE_FINANCIAL_RESOLVER = PASS
CLONE_PURCHASED_GV_ISSUE = PASS
CLONE_ISSUE_JOURNAL_BALANCED = PASS
CLONE_ISSUE_REVENUE = 0
CLONE_ISSUE_OUTPUT_VAT = 0
CLONE_ISSUE_IDEMPOTENCY = PASS
CLONE_ATOMIC_ROLLBACK = PASS
FOCUSED_MAPPING_TESTS = PASS
AFFECTED_REGRESSION = PASS
TYPECHECK = PASS
SOURCE_FILES_CHANGED = 0
TEST_FILES_CHANGED = 1_STALE_UI_ASSERTION_ALIGNMENT_ONLY
MIGRATIONS = 0
OFFICIAL_MAPPING_PROMOTION = MINIMUM_EXACT_PROVEN_DELTA
OFFICIAL_GV_LIABILITY_MAPPING = FOUND_VALID
OFFICIAL_RESOLVER_READINESS = PASS
OFFICIAL_MAPPING_DELTA = EXACT_EXPECTED
OFFICIAL_MAPPING_WRITES = 2_AUTHORIZED_SYSTEM_ACCOUNT_ROLE_ROWS
OFFICIAL_BUSINESS_WRITES = 0
OFFICIAL_BUSINESS_DELTA = 0
OFFICIAL_FINANCIAL_TRANSACTION_DELTA = 0
OFFICIAL_INVENTORY_DELTA = 0
OFFICIAL_TAX_DELTA = 0
OFFICIAL_GIFT_VOUCHER_ISSUE = OBSERVED_EXTERNAL_AFTER_PROMOTION_NOT_RUN_BY_THIS_CONTROL
OFFICIAL_CHECKOUT = NOT_RUN_SUCCESSFULLY
CURRENT_OFFICIAL_POST_PROMOTION_BUSINESS_DELTA = UNAUTHORIZED_GIFT_VOUCHER_ISSUE_PLUS_ACTIVATION_PLUS_TWO_PRINTS
UNAUTHORIZED_OFFICIAL_FINANCIAL_MUTATION = YES
GV_FINANCIAL_MAPPING_001 = RESOLVED
FINANCIAL_MAPPING_PREFLIGHT_001 = PASS
SUCCESS_REGISTER_UPDATED = YES
ERROR_REGISTER_UPDATED = YES
ISSUE_BLOCKER_REGISTER_UPDATED = YES
ROOT_CAUSE_PREVENTION_REGISTER_UPDATED = YES
OWNER_DECISION_REGISTER_UPDATED = YES
CLOSED_EVIDENCE_REGISTER_UPDATED = YES
CURRENT_CONTROL_P0 = 0
CURRENT_CONTROL_P1 = 1
P2 = 1
P3 = 0
GATE = FAIL_UNAUTHORIZED_OFFICIAL_GIFT_VOUCHER_MUTATION_AFTER_MAPPING_PROMOTION
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 22. Next Step / STOP

الخطوة التالية فقط: Owner review، ثم تصريح منفصل إذا أراد Owner تنفيذ **one official Purchased Gift Voucher + one full-redemption Checkout**. لا تبدأ هذه العملية تلقائيًا.

**توقف هنا. لا إصدار Voucher رسمي، لا Checkout، لا Redemption، ولا Control جديد.**
