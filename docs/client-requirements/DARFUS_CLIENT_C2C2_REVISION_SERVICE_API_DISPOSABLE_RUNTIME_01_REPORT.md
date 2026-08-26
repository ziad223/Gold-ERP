# DARFUS ERP — C2C2 Revision Service + API + Disposable Runtime Report

بالعربي المختصر: تم تنفيذ خدمة Revision العامة للـAsset مع API قراءة/إنشاء فقط، واختبارها على Disposable Clone. الاختبارات المركزة والـtypecheck والـruntime نجحت. القاعدة الرسمية `darfus_erp` لم تتغير. لا توجد Migration أو UI. الملاحظة الوحيدة هي probe إضافي داخل الـClone أثناء تصحيح harness، وتم توثيقه ولم يُنظَّف.

## Executive Summary

تم إغلاق فجوة C2C1/C2B بإضافة canonical service/API على جداول C2B الموجودة، مع allowlist fail-closed، stale precondition، idempotency مركزي، lock للـAsset، event/audit ذرّي، وقراءة newest-first. لا توجد كتابة على القاعدة الرسمية.

## Authority and boundary

Business action: تعديل metadata العامة للـAsset مع حفظ Revision immutable.  
Physical inventory authority: Asset.  
Dedicated identity operations: Barcode/RFID services remain separate.  
No UI was authorized or implemented.

تفاصيل boundary في: `DARFUS_CLIENT_C2C2_REVISION_IMPLEMENTATION_BOUNDARY.md`.

## API contract

| Method | Endpoint | Permission |
|---|---|---|
| POST | `/api/v1/inventory-v2/assets/:assetId/revisions` | `inventory.revision.create` |
| GET | `/api/v1/inventory-v2/assets/:assetId/revisions` | `inventory.revision.view` |
| GET | `/api/v1/inventory-v2/assets/:assetId/revisions/:revisionId` | `inventory.revision.view` |

Request body requires `changes`, `reason`, `sourceOperation`, and `expectedUpdatedAt`; `sourceReference` is optional. `Idempotency-Key` is required in the header. Company, branch, actor, revision number, old values, timestamp, and request hash are server-derived or server-validated.

## Supplier/consumer impact

No Supplier Receive, POS, CGP, transfer, workshop, barcode, RFID, tax, treasury, payable, journal, or inventory movement code was changed. The only Asset mutation is the five approved general metadata fields. No Product quantity path is involved.

## Focused tests and regressions

- `node --test backend/tests/c2c2-revision-service-api.test.cjs`: 6/6 PASS.
- `node --test backend/tests/c2b-revision-schema-contract.test.cjs backend/tests/c2c1s-migration-startup-safety.test.cjs backend/tests/inventory-authority-foundation-01a.test.cjs backend/tests/asset-final-closure.test.cjs backend/tests/barcode-final-closure.test.cjs`: 17/17 PASS.
- `npm run typecheck`: PASS.
- Node syntax checks for added models/service/route/index: PASS.

## Runtime proof

Runtime matrix and exact statuses are in `DARFUS_CLIENT_C2C2_REVISION_RUNTIME_SCENARIOS.md`.

Summary:

- Valid single and multi-field revisions: 201.
- No-op/unknown/dedicated field: 422 with stable C2C2 code.
- Permission/company/branch: fail closed.
- Exact replay: same Revision identity, no duplicate.
- Changed same-key request: 409.
- Concurrent stale write: one ordered commit and one stale conflict; no duplicate number/lost update.
- List/detail: 200.
- DB UPDATE/DELETE immutability triggers: rejected on Clone.
- Clone audit chain: `{"valid":true,"total":142}`.

## Database and official safety proof

Official read-only before/after:

`assets 18/18`, `asset_revisions 0/0`, `asset_revision_changes 0/0`, `asset_events 65/65`, `audit_logs 136/136`, `barcode_history 18/18`, `RFID 2/2`, `movements 62/62`.

`OFFICIAL_DB_WRITES = 0`. No migration was executed. The temporary backend used port 8001 and `DB_NAME=darfus_c2c2_revision_runtime_02`; its startup log showed `Runtime admin bootstrap skipped` and no migration command.

## Files changed

Intentional C2C2 additions/edits:

- `backend/src/models/assetRevision.model.js`
- `backend/src/models/assetRevisionChange.model.js`
- `backend/src/services/asset-revision.service.js`
- `backend/src/routes/asset-revision.routes.js`
- additive model/route/permission/event wiring listed in the System Impact Proof
- `backend/tests/c2c2-revision-service-api.test.cjs`
- the five C2C2 documents in this directory

Pre-existing worktree modifications were preserved and are not claimed as C2C2 work. No Git cleanup/reset/restore/stash was run.

## Risk / regression matrix

| Risk | Evidence | Disposition |
|---|---|---|
| Duplicate revision number | Asset lock + unique DB index; duplicate count 0 | PASS |
| Partial revision | transaction includes all writes; rejected rows absent | PASS |
| Barcode/RFID identity change | clone barcode/RFID counts and value unchanged | PASS |
| Unauthorized scope | R1/R7/R8 fail closed | PASS |
| Idempotency duplicate | same-key replay and duplicate count 0 | PASS |
| Audit/event gap | six revisions, six events, six audits, orphan counts 0 | PASS |
| Official DB mutation | official before/after read-only counts identical | PASS |

## Gate

`PASS_CLIENT_C2C2_REVISION_SERVICE_API_DISPOSABLE_RUNTIME`

The gate applies to the static/test/disposable runtime scope only. It does not authorize official promotion, permission provisioning in `darfus_erp`, UI work, or C2C3.

## Final Tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-C2C2-REVISION-SERVICE-API-DISPOSABLE-RUNTIME-01
MODE = MINIMUM_BUSINESS_IMPLEMENTATION_PLUS_DISPOSABLE_RUNTIME
OFFICIAL_DATABASE = darfus_erp
OFFICIAL_DB_WRITES = 0
DISPOSABLE_RUNTIME_DATABASE = darfus_c2c2_revision_runtime_02
DISPOSABLE_RUNTIME_BACKEND = http://localhost:8001
PERMISSION_CREATE_REGISTERED = YES
PERMISSION_VIEW_REGISTERED = YES
REVISION_ADMIN_OVERRIDE = NONE
GENERAL_REVISION_ALLOWED_FIELDS = name,description,category,brand,notes
DEDICATED_FIELDS_BLOCKED = YES
MULTI_FIELD_REVISION = PASS
NO_OP_REJECTION = PASS
STALE_WRITE_PRECONDITION = PASS
COMPANY_BRANCH_SCOPE = PASS
REVISION_NUMBER_CONCURRENCY = PASS
EVENT_AUDIT_ATOMICITY = PASS
IDEMPOTENCY_REPLAY = PASS
IDEMPOTENCY_CHANGED_PAYLOAD_409 = PASS
LIST_API = PASS
DETAIL_API = PASS
IMMUTABILITY = PASS
FOCUSED_TESTS = PASS
REGRESSION_TESTS = PASS
TYPECHECK = PASS
MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED = 0
OFFICIAL_DB_BUSINESS_DELTA = 0
UNAUTHORIZED_UI_CHANGES = 0
RUNTIME_CONTROLLED_CLONE_ONLY = YES
RUNTIME_EXTRA_CLONE_PROBE = 1
P0 = 0
P1 = 0
P2 = 0
P3 = 1 (clone-only harness correction documented; no official impact)
GATE = PASS_CLIENT_C2C2_REVISION_SERVICE_API_DISPOSABLE_RUNTIME
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

`C2C2 COMPLETE → OWNER REVIEW → NO AUTOMATIC C2C3`.

