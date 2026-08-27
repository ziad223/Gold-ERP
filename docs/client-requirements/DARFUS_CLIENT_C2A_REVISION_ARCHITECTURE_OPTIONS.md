# DARFUS Client C2A — Revision Architecture Options

Control: `DARFUS-CLIENT-C2A-SYSTEM-WIDE-REVISION-STABLE-DESIGN-01`  
Read-only design decision; no option is implemented here.

## Evaluation criteria

The option must preserve the stable Asset ID, keep barcode/RFID/accounting authorities separate, provide typed historical changes, support actor/reason/idempotency, avoid fake history, coexist with existing APIs, and remain extensible without a second business authority.

## Options

| Criterion | A — extend `asset_events` | B — Revision header + changes | C — Barcode history only | D — Hybrid |
|---|---|---|---|---|
| Stable Asset ID | Pass | Pass | Pass | Pass |
| Typed per-revision/per-field history | Partial; JSONB and mixed events | Pass | Fail | Pass |
| Operational event separation | Fail risk; events are already heterogeneous | Pass | Pass | Pass |
| Barcode semantics | Partial/ambiguous | Pass if linked, not owned | Fail; over-broad authority | Pass; dedicated history |
| RFID semantics | Partial/ambiguous | Pass if linked, not owned | Fail | Pass; dedicated history |
| Financial snapshot separation | Partial; risk of mixing | Pass | Pass | Pass |
| DB uniqueness/concurrency contract | Partial; no revision number contract | Pass | Partial | Pass |
| Existing timeline compatibility | Pass | Pass through event/audit projection | Partial | Pass |
| Future extension | Partial | Pass | Fail | Pass |
| Overall assessment | Not stable as sole authority | Strong core | Reject | Recommended |

## Option A — Extend `asset_events`

`asset_events` already records actor, branch/company, source, before/after context, correlation and idempotency data. It is therefore useful evidence. However, current event types are operational (`PURCHASE_RECEIVED`, transfer, workshop, sale, RFID and CGP lifecycle), and the current timeline treats events as lifecycle evidence. A generic revision event would make queries and permissions ambiguous and would not provide database-enforced revision headers/change rows. **Assessment: do not use as the canonical general revision store.**

## Option B — Dedicated Revision header and change rows

A future `asset_revisions` header linked to `assets.id`, with `asset_revision_changes` rows for old/new values, is semantically clean. It needs an event/audit integration contract and dedicated handling for barcode/RFID/financial fields. **Assessment: valid core, but incomplete alone unless integrated with existing event/audit authorities.**

## Option C — Barcode history only

Barcode history is identity-specific and intentionally protected by uniqueness, active-row and replacement constraints. Using it for description, component, size, price or other revisions would falsely imply a barcode change and would corrupt the meaning of reprint/replacement history. **Assessment: reject.**

## Option D — Hybrid stable design (recommended)

Use a canonical Revision header + Change rows for approved general item revisions. Emit an append-only `asset_events` notification/audit/integration event for the revision, while leaving existing event types and timeline semantics intact. Invoke the existing barcode identity service only when an approved barcode replacement occurs; keep Barcode history as the barcode authority. Use RFID routes/history only when RFID changes. Keep purchase-cost revisions and current valuations as financial authorities. This combines Option B’s typed semantics with existing event/audit integration and avoids duplicate authorities.

## Stable design decision

`REVISION_ARCHITECTURE = D_HYBRID_CANONICAL_REVISION_PLUS_EXISTING_AUTHORITIES`

`REVISION_STORAGE_AUTHORITY = FUTURE_ASSET_REVISION_HEADER_AND_CHANGE_ROWS`

`REVISION_SERVICE_AUTHORITY = FUTURE_CANONICAL_ASSET_REVISION_SERVICE`

The future service must be the only public write path for general revisions. It must be permission-gated, company/branch fail-closed, employee/operator attributed, idempotent, transactionally consistent, and protected by an Asset row lock or equivalent concurrency control. It must not use `MAX(revision_no)+1`; uniqueness and allocation must be database-backed.

## Conceptual future schema (design only)

No tables are created in C2A. A later C2B design should evaluate:

| Concept | Required meaning |
|---|---|
| `asset_revisions` | immutable header: Asset FK, per-Asset revision number, source type/id, actor/user/employee, reason, occurred time, company/branch, idempotency key/fingerprint, created metadata |
| `asset_revision_changes` | one row per approved changed field: field key, old value snapshot, new value snapshot, data type/authority, optional dedicated-operation reference |
| Event/audit link | append-only event/audit notification referencing the revision; not a second revision store |

The exact field allowlist, value encoding, status and permission model require the later schema/design gate. No existing Asset rows are backfilled.

## Authority preservation rules

- `assets.id` is stable and never replaced for a revision.
- Type, karat, inventory code, item code and barcode identity remain protected by current guards. Barcode replacement, if later approved, calls `barcode-identity.service.replaceAssetBarcode`.
- RFID assignment/replacement/unassignment remains under RFID routes/history; a general revision only references the operation.
- Purchase cost revisions remain historical acquisition-cost authority; current valuations remain current-value authority.
- A descriptive revision does not create quantity, movement, sale, purchase, journal, payable, tax, or inventory-count effects.
- A financial change uses the existing financial service and its accounting/tax contract; a revision record does not post a journal by itself.
- Prior invoice, journal, movement, origin, barcode, RFID and valuation snapshots remain immutable.
- No shared account, RBAC weakening, direct DB edit, or fake historical record is allowed.

## Compatibility and extension

Old Assets with no general revision rows remain valid. Existing Asset detail/history, barcode print, POS, Supplier V2, CGP, transfers, workshop, returns/exchange, RFID and count paths continue to operate. A later UI may add a Revisions view beneath Asset Detail using current timeline conventions; C2A does not add it.

## Risk decision

The recommended hybrid has no identified orphan or broken-reference risk if implemented with restrictive Asset FK, per-Asset uniqueness, immutable headers, and existing authority links. The risk is deferred design complexity, not a current runtime defect.

