# DARFUS ERP — C2C1 Revision Service / API / Permission Contract Report

النتيجة: تم تجميد عقد C2C1 كوثائق فقط. لم يتم تعديل الكود أو الاختبارات أو الـMigration، ولم تتم أي كتابة على `darfus_erp`. تم إثبات أن مخطط C2B الحالي يمكنه دعم العقد عند ربطه داخل نفس المعاملة مع `asset_events` و`audit_logs` الموجودين فعليًا.

## 1. Executive Summary

| Gate item | Result | Evidence |
|---|---|---|
| Generic field authority | frozen | five-field allowlist; dedicated/identity denylist |
| Permission/security authority | frozen | existing User/Auth/RBAC and server company/branch resolvers |
| API contract | frozen | POST + GET list/detail; no update/delete |
| Idempotency/concurrency | frozen | existing hash/claim/resolve/succeed semantics plus Asset lock requirement |
| Event/audit provenance | frozen | existing Asset Event and append-only audit chain |
| C2B compatibility | YES, with same-transaction event/audit linkage | C2B migration plus existing tables/fields |
| Implementation | not started | documentation-only boundary |

## 2. Read-only evidence reviewed

| Area | Source/evidence | Finding |
|---|---|---|
| permissions | `lib/permissions/catalog.ts` inventory list | `inventory.adjust` exists; dedicated revision permissions do not |
| auth/RBAC | `backend/src/middleware/auth.middleware.js` | server User/Auth context and permission middleware are authoritative |
| branch scope | `resolveAuthorizedBranchId` in `backend/src/routes/erp.routes.js` | active branch/company validation is server-side and can fail closed |
| actor attribution | `backend/src/services/operator-session.service.js`, `command-actor-context.service.js` | technical User and verified Employee/operator snapshots are available |
| audit | `backend/src/services/audit.service.js` | append-only tamper-evident dual-actor chain exists |
| events | `backend/src/models/assetEvent.model.js`, `inventory-v2-runtime.service.js` | Asset event timeline and source/id/correlation/idempotency fields exist |
| idempotency | `backend/src/services/idempotency.service.js` | stable canonicalization, SHA-256 request hash, claim/resolve/succeed contract exists |
| C2B schema | `backend/migrations/20260824010000-create-asset-revision-schema.js` and current read-only DB inspection | parent/change tables, unique keys, checks, FKs, and UPDATE/DELETE immutability triggers exist |
| current authorities | metadata, barcode, cost, valuation, inventory runtime services | dedicated owners must not be bypassed |

## 3. Contract decisions

### 3.1 Fields

The generic v1 command allows only `name`, `description`, `category`, `brand`, and `notes`. It accepts multiple distinct fields atomically, rejects duplicates and no-op changes, and records typed old/new snapshots. Barcode, RFID, identity, physical, financial, valuation, operational, branch, movement, and unknown fields are explicitly denied to the generic path.

This is intentionally narrower than the C2B schema’s syntactic ability to store arbitrary `field_key` values. Schema capability is not business authorization.

### 3.2 Permission and context

The frozen future permissions are:

```text
REVISION_CREATE_PERMISSION = inventory.revision.create
REVISION_READ_PERMISSION = inventory.revision.view
REVISION_ADMIN_OVERRIDE = NONE
```

They are not present in the current catalog and are not registered in C2C1. C2C2 must add them through its own controlled permission implementation. The server derives company, active branch, User, and operator attribution. Missing or mismatched context fails closed. The legacy `CMP-DEMO` fallback is not part of this contract.

### 3.3 API

```text
POST /api/v1/inventory-v2/assets/:assetId/revisions
GET  /api/v1/inventory-v2/assets/:assetId/revisions
GET  /api/v1/inventory-v2/assets/:assetId/revisions/:revisionId
```

Create accepts `changes`, `reason`, `sourceOperation`, optional `sourceReference`, and the required `Idempotency-Key` header plus stale-write precondition. Actor, company, branch, revision number, old values, timestamps, authority, and hash are server-derived. Update/delete are not public operations. Existing canonical error envelope and frozen stable codes are used.

### 3.4 Idempotency and concurrency

```text
IDEMPOTENCY_SCOPE = inventory-v2.asset-revision
```

The real `hashRequest(scope, body, params)` algorithm is reused. It hashes sorted object keys, preserves arrays, removes idempotency keys from the body, and includes route parameters. Same key/same request replays the stored response; same key/changed request returns a stable 409. An Asset row lock plus the unique `(asset_id, revision_no)` constraint allocates revision numbers safely. No cross-authority composite command is allowed.

### 3.5 Event and audit

```text
REVISION_EVENT_TYPE = ASSET_REVISION_RECORDED
REVISION_EVENT_VERSION = 1
SOURCE_TYPE = ASSET_REVISION
```

One event and one audit-chain record are linked to each revision in the same transaction. The event is a timeline notification; C2B revision tables are the historical authority; the existing audit service is the actor/security authority. No second history or audit system is created.

## 4. C2B schema compatibility decision

`asset_revisions` contains Asset/company/branch links, revision number, reason/source, actor IDs, occurred-at, and idempotency scope/key/hash. `asset_revision_changes` contains field key, old/new JSONB values, value type, authority type, and dedicated-operation reference. Unique asset/revision and company/scope/key constraints, field/value/authority checks, foreign keys, and immutability triggers are present.

The parent tables do not duplicate every human-readable actor snapshot. This is acceptable because current `asset_events` supports company/branch/actor/source/correlation/idempotency snapshots and `audit_logs` provides append-only dual-actor, branch, before/after, and hash-chain evidence. C2C2 must write those records in the same transaction and expose them through the read projection.

```text
C2B_SCHEMA_SUPPORTS_C2C1_CONTRACT = YES_WITH_EXISTING_EVENT_AUDIT_PROVENANCE
SCHEMA_ADJUSTMENT_REQUIRED_AFTER_C2B = NO
```

This conclusion is limited to the frozen service contract. It does not claim that C2C2 implementation has been performed.

### Current official DB observation

The read-only check during C2C1 resolved `current_database() = darfus_erp`, found `SequelizeMeta = 92`, and found the C2B migration entry `20260824010000-create-asset-revision-schema.js`. Both `asset_revisions` and `asset_revision_changes` exist with zero rows at observation time; the immutability triggers for UPDATE/DELETE are present. This is an observation of current state, not a C2C1 write. It does not authorize using the official DB for mutation proof and does not change the C2B history.

## 5. Downstream impact

All current consumers continue using the same Asset ID and dedicated authorities. The contract is additive; it requires no breaking change in supplier receive, POS, CGP, accounting, barcode, RFID, workshop, transfers, inventory count, invoice, CRM, or reporting. Future screens may read a revision projection but may not use it as a replacement for current Asset, price, status, or financial authorities.

## 6. C2C2 boundary

The next implementation gate, if separately authorized, may implement only the frozen service/controller/routes, validators, dedicated permission registration, read projections, and focused tests. It must prove scope/RBAC, no-op and multi-field behavior, exact replay/conflict, concurrency, event/audit atomicity, and C2B immutability. No UI, broad refactor, new migration, or dedicated-domain rewrite is authorized by this report.

## 7. Gate and final tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-C2C1-REVISION-SERVICE-API-PERMISSION-CONTRACT-01
MODE = READ_ONLY_CONTRACT_FREEZE
SYSTEM_WIDE_CONTRACT_IMPACT_REVIEW = COMPLETE
REVISION_CREATE_PERMISSION = inventory.revision.create
REVISION_READ_PERMISSION = inventory.revision.view
FINAL_REVISION_FIELD_ALLOWLIST = name, description, category, brand, notes
FINAL_REVISION_FIELD_DENYLIST = identity, barcode, RFID, physical, financial, valuation, operational, movement, scope, actor, timestamps, unknown/unowned fields
MULTI_FIELD_REVISION_ALLOWED = YES
VALUE_CANONICALIZATION_CONTRACT = SORT_OBJECT_KEYS_PRESERVE_ARRAY_ORDER_PRESERVE_TYPES_NO_IMPLICIT_COERCION
REVISION_COMPANY_SCOPE_RULE = SERVER_DERIVED_COMPANY_REQUIRED_FAIL_CLOSED
REVISION_BRANCH_SCOPE_RULE = SERVER_AUTHORIZED_ACTIVE_COMPANY_BRANCH_REQUIRED_FAIL_CLOSED
EMPLOYEE_ATTRIBUTION_RULE = VERIFIED_OPERATOR_SNAPSHOT_WHEN_PRESENT_TECHNICAL_USER_ALWAYS_NO_GUESSING
PROVENANCE_SURVIVES_PARENT_DEACTIVATION = YES
REVISION_ALLOCATION_STRATEGY = ASSET_ROW_LOCK_PLUS_UNIQUE_ASSET_REVISION_NUMBER
IDEMPOTENCY_SCOPE = inventory-v2.asset-revision
CONCURRENCY_POLICY = CENTRAL_IDEMPOTENCY_CLAIM_PLUS_ASSET_SERIALIZATION
CROSS_AUTHORITY_COMPOSITE_REVISION = NO
REVISION_EVENT_TYPE = ASSET_REVISION_RECORDED
REVISION_EVENT_VERSION = 1
CREATE_ENDPOINT = POST /api/v1/inventory-v2/assets/:assetId/revisions
LIST_ENDPOINT = GET /api/v1/inventory-v2/assets/:assetId/revisions
DETAIL_ENDPOINT = GET /api/v1/inventory-v2/assets/:assetId/revisions/:revisionId
C2B_SCHEMA_SUPPORTS_C2C1_CONTRACT = YES_WITH_EXISTING_EVENT_AUDIT_PROVENANCE
SCHEMA_ADJUSTMENT_REQUIRED_AFTER_C2B = NO
BREAKING_DOWNSTREAM_CHANGE_REQUIRED = NO
WILL_REQUIRE_CORE_REDESIGN_LATER = NO
DUPLICATE_AUTHORITY = NO
CIRCULAR_DEPENDENCY = NO
SOURCE_FILES_CHANGED = 0
TEST_FILES_CHANGED = 0
MIGRATIONS_CHANGED = 0
BUSINESS_DB_WRITES = 0
P0 = 0
P1 = 0
P2 = 1 (dedicated permission registration is a deferred C2C2 prerequisite)
P3 = 0
GATE = PASS_CLIENT_C2C1_REVISION_SERVICE_API_PERMISSION_CONTRACT
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 8. Change accounting

The seven files created by this control are documentation artifacts only. No source, test, migration, runtime configuration, permission catalog, or database row was changed. Existing dirty worktree entries, including prior C2B files, remain untouched and are not attributed to C2C1.

STOP — Owner review is required before any C2C2 implementation.
