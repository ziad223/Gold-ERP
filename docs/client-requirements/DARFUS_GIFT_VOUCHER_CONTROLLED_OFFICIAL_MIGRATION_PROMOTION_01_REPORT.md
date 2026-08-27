# DARFUS Gift Voucher Controlled Official Migration Promotion — 01

ما تم: تم تطبيق Migration Gift Voucher المحددة فقط على `darfus_erp` عبر الـguard المصرّح به.
تم أخذ Backup صالح قبل التطبيق، وتم التحقق من الـschema والـmeta والـhealth بعده.
هل تم أخذ Backup؟ نعم؛ Custom-format غير فارغ وقابل للقراءة.
هل تطابق Migration مع نسخة الـClone؟ نعم وفق تطابق المسار والمحتوى وملف الـWorktree؛ لا يوجد hash سابق مسجل في تقرير الـClone، وتم توثيق هذا القيد.
هل تم تطبيق Migration على `darfus_erp`؟ نعم، مرة واحدة؛ 92→93.
هل تم إنشاء Business Data؟ لا؛ كل deltas التجارية = 0.
هل تغيرت المالية أو المخزون؟ لا؛ المالية والمخزون = 0 delta.
هل Backend اشتغل بعد Migration؟ نعم؛ health/DB/Redis = 200، ولم تكن إعادة التشغيل مطلوبة.
ما الأخطاء التي ظهرت؟ لا أخطاء Migration جديدة؛ طلب GET غير المصادق عليه أعاد 401 كما هو متوقع.
ما الذي تم تسجيله؟ Backup، apply، schema، runtime، integrity، والسجلات النهائية.
Gate: PASS_GIFT_VOUCHER_CONTROLLED_OFFICIAL_MIGRATION_PROMOTION.
الخطوة التالية فقط: قبول أعمال Gift Voucher منفصل بتفويض Owner مستقل.

## Executive Summary

تمت ترقية Schema واحدة فقط:

`20260827010000-gift-voucher-purchased-foundation.js`

الهدف الرسمي ثبت عبر نفس اتصال PostgreSQL: `darfus_erp | postgres`. الـbaseline
قبل التطبيق كان `SequelizeMeta=92`، والـpending الوحيد كان Migration الهدف. بعد
التطبيق أصبح `SequelizeMeta=93` وظهر الهدف مرة واحدة. بقيت كل جداول الأعمال
والمالية والمخزون والفواتير بلا تغيير.

## Owner Authorization Scope

التفويض المرفق هو `OWNER_AUTHORIZED_OFFICIAL_SCHEMA_PROMOTION_ONLY`. تم احترامه:
لا إصدار Voucher، لا تفعيل، لا طباعة، لا استرداد، لا POS Checkout، لا Payment،
لا Journal، لا Cash، لا Inventory، لا fixture، لا seed، لا backfill، ولا Production
deployment.

## Read First

تمت قراءة:

- `AGENTS.md`
- `PROJECT_PROGRESS_HANDOFF.md`
- `DARFUS_GIFT_VOUCHER_FULL_REDEMPTION_CONTRACT_CORRECTION_01_REPORT.md`
- `DARFUS_GIFT_VOUCHER_SCHEMA_MINIMUM_SAFE_IMPLEMENTATION_01_REPORT.md`
- `DARFUS_GIFT_VOUCHER_MIGRATION_REHEARSAL.md`
- `DARFUS_GIFT_VOUCHER_OFFICIAL_DB_INTEGRITY.md`
- `DARFUS_GIFT_VOUCHER_ERROR_REGISTER_RECONCILIATION_01_REPORT.md`
- جميع السجلات الستة المطلوبة.
- `backend/scripts/migrate-safe.js`، `backend/src/server.js`، إعداد اتصال DB، وملف Migration الهدف.

`READ_FIRST=YES`.

## Official DB Identity

| Check | Result |
|---|---|
| `current_database()` | `darfus_erp` |
| `current_user` | `postgres` |
| Same target for dry-run/apply | YES; backend container to PostgreSQL service |
| Official target mismatch | NO |

## Pre-Migration Baseline

| Entity | Before |
|---|---:|
| `SequelizeMeta` | 92 |
| `gift_vouchers` | 0 |
| `payments` | 3 |
| `journal_entries` | 29 |
| `journal_lines` | 81 |
| `cash_transactions` | 11 |
| `inventory_asset_movements` | 70 |
| `audit_logs` | 189 |
| `idempotency_requests` | 105 |
| `invoices` | 3 |
| `invoice_items` | 3 |

`OFFICIAL_PRE_MIGRATION_BASELINE=CAPTURED`.

## Migration Hash / Parity

| Field | Evidence |
|---|---|
| Target file | `backend/migrations/20260827010000-gift-voucher-purchased-foundation.js` |
| Current SHA-256 | `36FCE0C0F64B606CA79E74AB1EA60EF6379D8554D51C82064715B28D964DADB5` |
| Current size | `15846` bytes |
| Rehearsal report | Clone apply/down/re-apply PASS; report did not retain a hash |
| Worktree state | File is the pre-existing reviewed untracked Worktree source; no source edit occurred in this control |
| Parity conclusion | PASS with explicit limitation: no prior rehearsal hash was recorded |

`TARGET_MIGRATION_MATCHES_REHEARSAL=YES_WITHOUT_RECORDED_PRIOR_HASH` and
`MIGRATION_PARITY_WITH_REHEARSAL=PASS_WITHOUT_RECORDED_PRIOR_HASH`.

## Pending Migration Inspection

The guarded dry-run returned:

```text
MIGRATION_TARGET_DATABASE=darfus_erp
MIGRATION_PENDING_COUNT=1
SAFE_MIGRATION_DRY_RUN=YES
pending = 20260827010000-gift-voucher-purchased-foundation.js
targetInMeta = 0
```

`UNRELATED_PENDING_MIGRATIONS=0`.

## Protected DB Safety

Normal backend startup uses `npm start`, connects to PostgreSQL, and does not
invoke a migration runner. Runtime admin bootstrap is opt-in through
`ALLOW_RUNTIME_ADMIN_BOOTSTRAP=true` and was not enabled for this operation.
The official apply used process-scoped approval and the explicit exact migration
list; no `.env` was changed.

`AUTO_STARTUP_MIGRATION=DISABLED` and `PROTECTED_DB_MIGRATION_GUARD=ACTIVE`.

## Backup / Recovery Proof

Backup proof is recorded in
`DARFUS_GIFT_VOUCHER_OFFICIAL_BACKUP_PROOF.md`:

- path: `backend/backups/darfus_erp_gift_voucher_pre_promotion_20260827T111244Z.dump`;
- size: `816305` bytes;
- SHA-256: `EA6B8406C12CFFCE73D7229852CF20B0AD1FC231DEE903CFB8DFCA9BD6DD0CF7`;
- `pg_dump=0`, `pg_restore --list=0`.

`PRE_MIGRATION_BACKUP=PASS`, `BACKUP_NONZERO=YES`,
`BACKUP_HASH_CAPTURED=YES`, `BACKUP_READABILITY=PASS`.

## Official Migration Apply

The guarded exact-target wrapper applied one migration and returned:

```text
MIGRATION_TARGET_DATABASE=darfus_erp
MIGRATION_PENDING_COUNT=1
SAFE_MIGRATION_EXECUTED_COUNT=1
MIGRATION_META_COUNT_AFTER=93
```

`OFFICIAL_MIGRATION_EXECUTED=YES` and `OFFICIAL_MIGRATION_RESULT=PASS`.

## Post-Migration Schema Verification

The target migration exists exactly once. Verified schema includes:

- unique Voucher Code and Voucher Number;
- non-null 3-character currency;
- lifecycle enum and safety checks;
- branch eligibility table, composite key, and FKs;
- one-to-one Payment linkage;
- print-event table and audit actor FKs;
- immutable identity and delete-forbidden triggers.

`TARGET_MIGRATION_IN_META=YES`, `TARGET_MIGRATION_META_COUNT=1`,
`SCHEMA_VERIFICATION=PASS`, `VOUCHER_CODE_UNIQUE_CONSTRAINT=PASS`,
`CURRENCY_SCHEMA=PASS`, `BRANCH_ELIGIBILITY_SCHEMA=PASS`,
`PAYMENT_LINKAGE_SCHEMA=PASS`, `PRINT_EVENT_SCHEMA=PASS`.

## SequelizeMeta

| Before | After | Target count after |
|---:|---:|---:|
| 92 | 93 | 1 |

The +1 is expected schema metadata only.

## Business / Financial / Inventory Delta

All required business counts were equal before and after:

`gift_vouchers 0→0`, `payments 3→3`, `journal_entries 29→29`,
`journal_lines 81→81`, `cash_transactions 11→11`,
`inventory_asset_movements 70→70`, `audit_logs 189→189`,
`idempotency_requests 105→105`, `invoices 3→3`, `invoice_items 3→3`.

`OFFICIAL_BUSINESS_WRITES_BY_MIGRATION=0`.
`OFFICIAL_FINANCIAL_DELTA_BY_MIGRATION=0`.
`OFFICIAL_INVENTORY_DELTA_BY_MIGRATION=0`.

## Backend Runtime Refresh

No refresh was required because the existing backend process remained healthy and
the implementation code was already present. No frontend, PostgreSQL, or Redis
restart was executed.

`BACKEND_RUNTIME_REFRESH=NOT_REQUIRED` and `AUTO_MIGRATION_DURING_REFRESH=NO`.

## Health / DB / Redis

| Endpoint | Result |
|---|---|
| `/api/v1/health` | HTTP 200 |
| `/api/v1/health/db` | HTTP 200 |
| `/api/v1/health/redis` | HTTP 200 |

The unauthenticated read-only Gift Voucher list request returned HTTP 401, which
is the expected authentication guard. Source inspection confirms list/detail are
GET-only. No login was performed because it is unnecessary for schema promotion
and can update session metadata.

`BACKEND_HEALTH=PASS`, `DB_HEALTH=PASS`, `REDIS_HEALTH=PASS`,
`GIFT_VOUCHER_READONLY_RUNTIME=PASS_SOURCE_AND_HEALTH; AUTH_GET_NOT_RUN`.

## Historical Journal Separation

`PURCHASE-ORDER-UNBALANCED-JOURNAL-001` and `JE-1787090870905` were not changed
and are not attributed to this promotion.

`PRE_EXISTING_JE_EXCEPTION_CHANGED_BY_CONTROL=NO` and
`ATTRIBUTED_TO_GIFT_VOUCHER_PROMOTION=NO`.

## Pearl Separation

`GV-I-001` remains a separate Pearl missing/configuration issue. No Pearl data,
pricing, or default was changed.

`PEARL_ISSUE_CHANGED_BY_CONTROL=NO`.

## Success Register

Added four official promotion successes: migration, schema, runtime health, and
zero business delta. Prior clone successes remain unchanged and were not
recreated.

`SUCCESS_REGISTER_UPDATED=YES`.

## Error / Root Cause Register

No new error was found. Existing resolved errors GV-E-006/GV-E-007 and links to
GV-L-001/GV-L-002 remain; GV-E-003→GV-L-003 and GV-E-004→GV-L-004 remain explicit.
No new root-cause class was introduced by promotion.

`ERROR_REGISTER_UPDATED=YES`, `ROOT_CAUSE_PREVENTION_REGISTER_UPDATED=YES`.

## Owner Decision / Closed Evidence

The Owner Decision Register now records this named schema promotion as completed,
while official business acceptance remains unauthorized. The Issue/Blocker
Register records GV-I-002 as authorized/promoted for schema only. The Closed
Evidence Register points to all promotion artifacts.

`ISSUE_BLOCKER_REGISTER_UPDATED=YES`, `OWNER_DECISION_REGISTER_UPDATED=YES`,
`CLOSED_EVIDENCE_REGISTER_UPDATED=YES`.

## Files Changed

Documentation/register updates:

- `docs/client-requirements/DARFUS_GIFT_VOUCHER_OFFICIAL_PROMOTION_PREFLIGHT.md`
- `docs/client-requirements/DARFUS_GIFT_VOUCHER_OFFICIAL_BACKUP_PROOF.md`
- `docs/client-requirements/DARFUS_GIFT_VOUCHER_OFFICIAL_MIGRATION_APPLY.md`
- `docs/client-requirements/DARFUS_GIFT_VOUCHER_OFFICIAL_SCHEMA_VERIFICATION.md`
- `docs/client-requirements/DARFUS_GIFT_VOUCHER_OFFICIAL_RUNTIME_READONLY_PROOF.md`
- `docs/client-requirements/DARFUS_GIFT_VOUCHER_OFFICIAL_DB_POST_PROMOTION_INTEGRITY.md`
- this report;
- the six Gift Voucher registers.

Generated authorized backup:
`backend/backups/darfus_erp_gift_voucher_pre_promotion_20260827T111244Z.dump`.

No Product source, tests, migration source, `.env`, seed, fixture, or deployment
file was changed.

## Gate

All promotion-only criteria passed: explicit Owner scope, official identity,
exact pending set, protected guard, verified backup, one successful target
Migration, schema/meta verification, zero business/financial/inventory deltas,
healthy backend/DB/Redis, untouched historical exception/Pearl issue, and updated
registers. The only documented limitation is the absence of a previously recorded
rehearsal hash; the current reviewed Worktree content/hash and exact migration
path were retained as evidence.

`GIFT_VOUCHER_OFFICIAL_SCHEMA=PROMOTED`
`GATE=PASS_GIFT_VOUCHER_CONTROLLED_OFFICIAL_MIGRATION_PROMOTION`

## Final Tokens

```text
CURRENT_CONTROL = DARFUS-GIFT-VOUCHER-CONTROLLED-OFFICIAL-MIGRATION-PROMOTION-01
MODE = OWNER_AUTHORIZED_OFFICIAL_SCHEMA_PROMOTION_ONLY
OWNER_AUTHORIZATION_SCOPE = OFFICIAL_SCHEMA_PROMOTION_ONLY
READ_FIRST = YES
OFFICIAL_DB = darfus_erp
OFFICIAL_DB_IDENTITY_PROVEN = YES
OFFICIAL_PRE_MIGRATION_BASELINE = CAPTURED (SequelizeMeta=92; vouchers=0; payments=3; journals=29; journal_lines=81; cash=11; movements=70; audit=189; idempotency=105; invoices=3; invoice_items=3)
TARGET_MIGRATION = 20260827010000-gift-voucher-purchased-foundation.js
TARGET_MIGRATION_MATCHES_REHEARSAL = YES_WITHOUT_RECORDED_PRIOR_HASH
MIGRATION_PARITY_WITH_REHEARSAL = PASS_WITHOUT_RECORDED_PRIOR_HASH
PENDING_MIGRATIONS = [20260827010000-gift-voucher-purchased-foundation.js]
UNRELATED_PENDING_MIGRATIONS = 0
AUTO_STARTUP_MIGRATION = DISABLED
PROTECTED_DB_MIGRATION_GUARD = ACTIVE
PRE_MIGRATION_BACKUP = PASS
BACKUP_NONZERO = YES
BACKUP_HASH_CAPTURED = YES
BACKUP_READABILITY = PASS
OFFICIAL_MIGRATION_EXECUTED = YES
OFFICIAL_MIGRATION_RESULT = PASS
TARGET_MIGRATION_IN_META = YES
TARGET_MIGRATION_META_COUNT = 1
SCHEMA_VERIFICATION = PASS
VOUCHER_CODE_UNIQUE_CONSTRAINT = PASS
CURRENCY_SCHEMA = PASS
BRANCH_ELIGIBILITY_SCHEMA = PASS
PAYMENT_LINKAGE_SCHEMA = PASS
PRINT_EVENT_SCHEMA = PASS
OFFICIAL_BUSINESS_WRITES_BY_MIGRATION = 0
OFFICIAL_FINANCIAL_DELTA_BY_MIGRATION = 0
OFFICIAL_INVENTORY_DELTA_BY_MIGRATION = 0
BACKEND_RUNTIME_REFRESH = NOT_REQUIRED
AUTO_MIGRATION_DURING_REFRESH = NO
BACKEND_HEALTH = PASS
DB_HEALTH = PASS
REDIS_HEALTH = PASS
GIFT_VOUCHER_READONLY_RUNTIME = PASS_SOURCE_AND_HEALTH_AUTH_GET_NOT_RUN
OFFICIAL_DB_POST_MIGRATION_INTEGRITY = PASS
OFFICIAL_GIFT_VOUCHER_BUSINESS_ACCEPTANCE_EXECUTED = NO
PRODUCT_CODE_CHANGED_THIS_CONTROL = NO
MIGRATION_SOURCE_CHANGED_THIS_CONTROL = NO
PRE_EXISTING_JE_EXCEPTION_CHANGED_BY_CONTROL = NO
ATTRIBUTED_TO_GIFT_VOUCHER_PROMOTION = NO
PEARL_ISSUE_CHANGED_BY_CONTROL = NO
SUCCESS_REGISTER_UPDATED = YES
ERROR_REGISTER_UPDATED = YES
ISSUE_BLOCKER_REGISTER_UPDATED = YES
ROOT_CAUSE_PREVENTION_REGISTER_UPDATED = YES
OWNER_DECISION_REGISTER_UPDATED = YES
CLOSED_EVIDENCE_REGISTER_UPDATED = YES
GV_I_002 = AUTHORIZED_AND_PROMOTED_SCHEMA_ONLY
CURRENT_CONTROL_P0 = 0
CURRENT_CONTROL_P1 = 0
P2 = 0_NEW_PROMOTION_ERRORS
P3 = 1_PARITY_HASH_PROVENANCE_LIMITATION
GIFT_VOUCHER_OFFICIAL_SCHEMA = PROMOTED
GATE = PASS_GIFT_VOUCHER_CONTROLLED_OFFICIAL_MIGRATION_PROMOTION
NEXT_RECOMMENDED_STEP = DARFUS_GIFT_VOUCHER_OFFICIAL_RUNTIME_BUSINESS_ACCEPTANCE (requires separate explicit Owner authorization)
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Next Step

Only `DARFUS_GIFT_VOUCHER_OFFICIAL_RUNTIME_BUSINESS_ACCEPTANCE` may be considered
next, with a separate explicit Owner authorization. It must define its exact
business operation, backup/baseline, idempotency, accounting, and rollback/recovery
proof. It is not started automatically.

## STOP

STOP. Do not issue, activate, print, redeem, checkout, create fixtures, run
another migration, fix Pearl, repair the historical journal exception, start D2F
Gate B, or start CRM in this control.
