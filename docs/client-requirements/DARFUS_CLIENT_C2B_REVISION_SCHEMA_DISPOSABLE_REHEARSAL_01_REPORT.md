# DARFUS ERP — C2B Revision Schema Contract + Disposable Migration Rehearsal Report

## Executive Summary

تم تحويل تصميم C2A إلى عقد Schema إضافي فقط. لم يتم إنشاء API أو UI أو Revision Service، ولم يتم تعديل Asset أو Barcode أو RFID أو Inventory أو Accounting. قاعدة `darfus_erp` بقيت قراءة فقط؛ أي Migration/اختبار صفوف يتم على قواعد Disposable جديدة فقط.

قبل التنفيذ تم فحص conventions الفعلية: `STRING` IDs، أسماء `snake_case`، `JSONB` للبيانات المركبة، `company_id` و`branch_id`، FKs، الفهارس الفريدة، `idempotency_requests` المركزي، وتغليف Migration بالـtransaction. أحدث migration الحالي هو `20260823030000-inventory-count-authority-foundation.js` وعددها 91.

## Change boundary

| Item | Declared boundary |
|---|---|
| Migration | `backend/migrations/20260824010000-create-asset-revision-schema.js` only |
| Tests | `backend/tests/c2b-revision-schema-contract.test.cjs` only |
| Models | none required in C2B |
| Documentation | five C2B artifacts |
| Forbidden modules | Asset business services, Barcode, RFID, Inventory, POS, CGP, Accounting, Invoice, Frontend, permissions, status and existing migrations |
| Official DB | no migration, no schema/business write |

## Frozen schema decision

```text
REVISION_SCHEMA = ADDITIVE_TWO_TABLE_APPEND_ONLY_HYBRID_STORAGE
REVISION_HEADER_TABLE = asset_revisions
REVISION_CHANGE_TABLE = asset_revision_changes
REVISION_PRIMARY_KEY_STRATEGY = PROJECT_STRING_IDS_SUPPLIED_BY_FUTURE_SERVICE
ASSET_FK = asset_revisions.asset_id -> assets.id REQUIRED RESTRICT DELETE
COMPANY_BRANCH_SCOPE = company_id REQUIRED RESTRICT; branch_id NULLABLE SET NULL
REVISION_NO_STRATEGY = PER_ASSET_POSITIVE_INTEGER; C2C ASSET_ROW_LOCK_THEN_ALLOCATE; NO_MAX_PLUS_ONE_WITHOUT_LOCK
REVISION_NO_UNIQUE_CONSTRAINT = UNIQUE(asset_id, revision_no)
IDEMPOTENCY_SCHEMA_STRATEGY = CENTRAL idempotency_requests PRIMARY STORE + IMMUTABLE HEADER SCOPE/KEY/HASH + UNIQUE(company_id, scope, key)
FIELD_KEY_SCHEMA_STRATEGY = BOUNDED_LOWERCASE_IDENTIFIER_CHECK; FINAL APPLICATION ALLOWLIST IN C2C
REVISION_VALUE_ENCODING = JSONB OLD/NEW CANONICAL ENVELOPES + value_type; DECIMAL AS CANONICAL STRING
IMMUTABILITY_DB_STRATEGY = POSTGRES BEFORE UPDATE/DELETE TRIGGERS ON BOTH HISTORY TABLES; DOWN ONLY EMPTY DISPOSABLE
PROVENANCE_SCHEMA = source_operation/source_reference + user/employee/operator + company/branch + reason/occurred_at + idempotency identity
MODEL_FILES_REQUIRED_IN_C2B = NO
GENERAL_REVISION_BACKFILL = NONE
CURRENT_MIGRATION_COUNT_BEFORE_C2B = 91
CURRENT_LATEST_MIGRATION = 20260823030000-inventory-count-authority-foundation.js
MIGRATIONS_CREATED = 1
TEST_FILES_CHANGED_BY_C2B = 1
MODEL_FILES_CREATED_BY_C2B = 0
```

## Schema implementation

The migration creates only `asset_revisions` and `asset_revision_changes`, their FKs, indexes, CHECK constraints and two immutability triggers. It uses restrictive Asset/company deletion to protect history and nullable SET NULL context links where current conventions do not guarantee a parent row. It does not alter existing tables or business meaning.

The change table explicitly separates `GENERAL_REVISION_CHANGE` from `DEDICATED_OPERATION_REFERENCE`. Barcode, RFID, cost, valuation, selling price, tax, status, transfer and movement remain owned by their existing services; a future revision may reference those operations but cannot duplicate them.

## Migration / fresh database evidence

The controlled execution targets were `darfus_c2b_revision_schema_01` and `darfus_c2b_revision_fresh_01`. Each mutating command was preceded by an exact disposable `current_database()` check. The official database was never a migration target. Disposable databases and the local clone dump are preserved and not cleaned automatically.

Results: clone Migration UP PASS; all 92 migrations on Fresh DB PASS; new tables/constraints/triggers PASS; Fresh DB down/up PASS; second migration run returned no pending migrations; focused schema tests PASS; typecheck PASS.

Migration ordering evidence: source contained 91 migrations before C2B, latest was `20260823030000-inventory-count-authority-foundation.js`; the next valid additive file is `20260824010000-create-asset-revision-schema.js` and is the only migration created by C2B. `PRE_PRODUCTION_DOWN_SAFE = YES` for an empty disposable schema. `POST_PRODUCTION_SCHEMA_ROLLBACK_POLICY = RESTRICTED_FORWARD_FIX`; the guarded down migration must not be used after real revision history exists.

## Existing-data and system impact

The system impact recheck confirms no existing table, Asset reference, Barcode/RFID history, event, movement, invoice link, journal or permission is changed by the additive schema. Existing Assets may have zero general revision rows. No fake v1/v2 history is created.

## Business runtime boundary

`BUSINESS_REVISION_RUNTIME = NOT_IMPLEMENTED_BY_DESIGN`. C2B does not claim revision API, UI, metadata behavior, workshop integration, Barcode replacement behavior, RFID behavior, financial behavior, or service allocation correctness. Those belong to C2C.

## Rehearsal results

| Proof | Result | Evidence |
|---|---|---|
| Clone baseline reconciled | PASS | `darfus_c2b_revision_schema_01`: Assets 18, Barcode 18, RFID 2, Events 65, Cost 18, Valuation 14, Invoice links 1, Movements 62, Journals 25, Meta 91 before migration |
| Migration UP on clone | PASS | `SequelizeMeta` 92; two new tables present |
| Constraint tests | PASS | ordered revisions, duplicate rejection, FK rejection, checks, immutable update/delete |
| DB concurrency backstop | PASS | two parallel same Asset/revision inserts: one success, one unique rejection |
| Existing business delta | 0 | all clone baseline business counts unchanged; revision rows existed only in new tables |
| Fresh full chain | PASS | `darfus_c2b_revision_fresh_01`, 92 migrations |
| Fresh second run | PASS | no migrations executed / schema up to date |
| Rollback rehearsal | PASS | new migration down on empty Fresh DB removed only new schema, then up restored it |
| Focused tests | PASS | 4/4 `backend/tests/c2b-revision-schema-contract.test.cjs` |
| Syntax/typecheck | PASS | `node --check` migration; root `npm run typecheck` exit 0 |
| Official DB | PASS zero delta | `darfus_erp` still Meta 91, Assets 18, Barcode 18, RFID 2, Events 65, Movements 62, Journals 25, permissions 150, revision tables 0 |

## Required final tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-C2B-REVISION-SCHEMA-DISPOSABLE-REHEARSAL-01
MODE = ADDITIVE_SCHEMA_AND_DISPOSABLE_REHEARSAL_ONLY
OFFICIAL_DATABASE = darfus_erp
DISPOSABLE_CLONE_DB = darfus_c2b_revision_schema_01
FRESH_DISPOSABLE_DB = darfus_c2b_revision_fresh_01
PROJECT_SCHEMA_CONVENTIONS_MAPPED = YES
SYSTEM_WIDE_SCHEMA_IMPACT_REVIEW = COMPLETE
SCHEMA_CONTRACT_FROZEN = YES
ASSET_ID_CHANGE = NO
HISTORICAL_REFERENCE_REWRITE = NO
CASCADE_HISTORY_DELETE = NO
DUPLICATE_BUSINESS_AUTHORITY = NO
REVISION_HEADER_IMMUTABLE = YES
REVISION_CHANGE_HISTORY_IMMUTABLE = YES
DUPLICATE_REVISION_REQUEST_DB_BACKSTOP = YES
PROVENANCE_RECONSTRUCTABLE = YES
GENERAL_REVISION_BACKFILL = NONE
BUSINESS_REVISION_RUNTIME = NOT_IMPLEMENTED_BY_DESIGN
MIGRATION_FILE = backend/migrations/20260824010000-create-asset-revision-schema.js
MIGRATION_UP_DISPOSABLE = PASS
DB_CONCURRENCY_BACKSTOP = PASS
ALL_MIGRATIONS_UP_FRESH_DB = PASS
FRESH_DB_SECOND_MIGRATION_RUN = NO_PENDING_MIGRATIONS
ROLLBACK_REHEARSAL = PASS
C2B_FOCUSED_TESTS = PASS
TYPECHECK = PASS
OFFICIAL_DB_SCHEMA_WRITE_DELTA = 0
OFFICIAL_DB_BUSINESS_WRITE_DELTA = 0
OFFICIAL_PERMISSION_DELTA = 0
OFFICIAL_ASSET_DELTA = 0
OFFICIAL_BARCODE_DELTA = 0
OFFICIAL_RFID_DELTA = 0
OFFICIAL_MOVEMENT_DELTA = 0
OFFICIAL_JOURNAL_DELTA = 0
DISPOSABLE_DATABASES_PRESERVED_FOR_REVIEW = YES
P0 = 0
P1 = 0
P2 = 0
P3 = 0
```

## Gate

`GATE = PASS_CLIENT_C2B_REVISION_SCHEMA_DISPOSABLE_REHEARSAL`

The final C2B PASS gate is claimed because the Disposable Clone migration, constraint tests, fresh full-chain run, second migration run, rollback rehearsal, and official zero-delta proof are complete.

`NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`

## STOP

لا يوجد أي Migration مطبق على `darfus_erp`، ولا توجد Revision business mutations. تم إغلاق C2B بعد إثبات الـDisposable، ولا يبدأ C2C تلقائيًا.
