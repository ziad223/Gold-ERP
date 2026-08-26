# DARFUS Client C2C1 — Event and Audit Contract

## Authorities

| Evidence/concern | Authority |
|---|---|
| canonical revision snapshots | C2B `asset_revisions` and `asset_revision_changes` |
| operational timeline notification | existing `asset_events` / `inventory-v2-runtime.service.js` event conventions |
| actor/security provenance | existing append-only, hash-chained `audit.service.js` |
| idempotency evidence | existing `idempotency_requests` and `idempotency.service.js` |

No second history or audit system may be introduced.

## Frozen event

```text
REVISION_EVENT_TYPE = ASSET_REVISION_RECORDED
REVISION_EVENT_VERSION = 1
SOURCE_TYPE = ASSET_REVISION
SOURCE_ID = revisionId
```

Minimum event link/payload:

```text
eventId
eventType
eventVersion
assetId
revisionId
companyId
branchId
occurredAt
sourceOperation
sourceReference
idempotencyKey
```

The event links the timeline to the canonical revision; it does not duplicate all change rows. Existing Asset Event fields such as `sourceType`, `sourceId`, `eventType`, `correlationId`, `companyId`, `branchId`, `userId`, `employeeCode`, `employeeName`, and `idempotencyKey` are used according to their current conventions.

## Audit record

The same transaction appends one audit record with:

- action `asset.revision.recorded`;
- `sourceDocument = revisionId`;
- correlation/request ID and idempotency scope/key reference;
- company and operation branch;
- technical User and verified Employee/operator snapshots;
- permission/authorization result;
- reason, source operation/reference;
- before/after or linked change snapshots;
- the Asset and revision identifiers.

`attachDualAuditActor` and `audit.service.js` remain the implementation authority for dual actor fields and the tamper-evident chain. A later deactivation must not erase the captured names/codes or branch snapshot.

## Atomic write order

The future C2C2 service performs the following within one transaction, subject to the existing idempotency contract:

```text
idempotency claim
→ authenticate/scope/permission/field validation
→ lock Asset and read current values
→ insert asset_revisions
→ insert asset_revision_changes
→ append ASSET_REVISION_RECORDED
→ append asset.revision.recorded audit row
→ store successful idempotency response
→ commit
```

Any failure before commit leaves no revision, change, event, audit, or successful idempotency row. Existing durable rows are never deleted to simulate rollback.

## Relationship to current Asset state

The event and audit rows are notification/provenance links. They do not replace Asset current metadata, barcode history, purchase-cost revisions, valuations, movements, or accounting journals. A generic revision command can update only its five allowlisted metadata values through the approved current metadata authority; it must not “synchronize” dedicated fields by copying snapshots.

## Read projections

Asset detail/timeline may later show revision entries by following `sourceType=ASSET_REVISION` and `sourceId=revisionId`. It must retain the historical event/actor/branch context even when the Asset’s current location, status, or owner differs. Event ordering must use persisted `occurredAt` plus stable ID tie-breaking.

## Recovery and duplicate prevention

Durable event publication is not destructively rolled back. Before commit, the DB transaction rolls back. After commit, a failure in an external consumer is handled by the existing durable event/outbox/retry conventions; the revision is not deleted. Idempotent replay returns the original response and never emits a second revision event or audit record.

