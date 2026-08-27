# DARFUS C2B — Revision Constraint Matrix

| Object | Constraint / index | Contract | Evidence target |
|---|---|---|---|
| `asset_revisions.id` | primary key | stable project `STRING` ID | schema inspection |
| `asset_revisions.asset_id` | FK to `assets.id` | required; RESTRICT delete | invalid Asset insert rejected |
| `asset_revisions.company_id` | FK to `companies.id` | required; RESTRICT delete | invalid company rejected |
| `asset_revisions.branch_id` | FK to `branches.id` | nullable; SET NULL delete | nullable context supported |
| `asset_revisions.technical_user_id` | FK to `users.id` | nullable; SET NULL delete | optional actor context |
| `asset_revisions.employee_id` | FK to `employees.id` | nullable; SET NULL delete | optional operator context |
| `asset_revisions.revision_no` | positive CHECK | greater than zero | zero/negative rejected |
| `asset_revisions.asset_id,revision_no` | unique index | one ordered number per Asset | duplicate rejected; separate Assets may both use 1 |
| `asset_revisions.idempotency_scope/key` | non-empty CHECK + unique company scope key | domain backstop; central idempotency store remains primary | duplicate request rejected |
| `asset_revisions.source_operation` | non-empty CHECK | provenance required | empty source rejected |
| `asset_revision_changes.revision_id` | FK to header | required; RESTRICT delete | orphan change rejected |
| `asset_revision_changes.field_key` | lower-case bounded CHECK | schema mechanism only; final allowlist C2C | malformed key rejected |
| `asset_revision_changes.value_type` | CHECK | string/number/decimal/boolean/datetime/identifier/structured/null | unknown type rejected |
| `asset_revision_changes.authority_type` | CHECK | general vs dedicated reference | authority duplication prevented at contract level |
| `asset_revision_changes.old/new_value` | presence CHECK | at least one side exists | empty change rejected |
| Both tables | immutable triggers | UPDATE/DELETE rejected | append-only evidence |
| Both tables | timestamps | created/updated required | project convention |

## Foreign-key deletion policy

`CASCADE_HISTORY_DELETE = NO`. Asset and company are restrictive. Context references may be nulled when their parent is removed, preserving the revision row and its business evidence; official production deletion policy remains governed by existing security/data-retention authority. No delete is executed by C2B.

## Value encoding contract

The schema uses project-consistent JSONB. The future service must store a canonical envelope, e.g. `{ "value": "12.3400" }` for a decimal, with `value_type='decimal'`. It must not store secrets, binary credentials or unconstrained executable content. Canonical serialization and decimal comparison belong to C2C tests/service.

## Revision-number contract

`GENERAL_REVISION_NUMBER != BARCODE_REVISION_NUMBER`. The schema enforces only the per-Asset unique pair. Application allocation is intentionally deferred to C2C and must use an Asset row lock plus a unique-conflict safety path; `MAX(revision_no)+1` without locking is forbidden.

