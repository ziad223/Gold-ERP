# DARFUS C2B — Revision Schema Contract

Control: `DARFUS-CLIENT-C2B-REVISION-SCHEMA-DISPOSABLE-REHEARSAL-01`  
Scope: additive storage schema only; no API, UI, service, or business mutation.

## Frozen contract

| Contract | Decision |
|---|---|
| Revision architecture | Hybrid: canonical revision header/changes plus existing event/audit and dedicated authorities |
| Header table | `asset_revisions` |
| Change table | `asset_revision_changes` |
| Primary keys | project-style `STRING` IDs supplied by a future service; no DB business allocator in C2B |
| Asset FK | `asset_revisions.asset_id -> assets.id`, required, `ON DELETE RESTRICT`, `ON UPDATE CASCADE` |
| Company FK | required `companies.id`, `ON DELETE RESTRICT`, `ON UPDATE CASCADE` |
| Branch FK | nullable `branches.id`, `ON DELETE SET NULL`, `ON UPDATE CASCADE`; legacy Asset branch context is not universally a branch row |
| Technical user FK | nullable `users.id`, `ON DELETE SET NULL` |
| Employee FK | nullable `employees.id`, `ON DELETE SET NULL` |
| Revision number | positive integer, per Asset, unique `(asset_id, revision_no)`; never Barcode revision |
| Idempotency | immutable scope/key/hash on header plus unique `(company_id, idempotency_scope, idempotency_key)`; central `idempotency_requests` remains the command store |
| Field key | bounded lower-case identifier pattern in DB; final owned allowlist in C2C |
| Values | JSONB old/new envelopes governed by `value_type`; decimals are canonical strings, never JS floats |
| Immutability | DB trigger rejects UPDATE/DELETE on both history tables; `down` only accepts empty disposable schema |
| Backfill | none |

## Header semantics

`asset_revisions` represents one immutable revision event for one stable Asset. It stores provenance (`source_operation`, `source_reference`, user/operator, company/branch, reason, occurred time) and idempotency identity. It does not own a barcode, RFID, cost, valuation, tax, status, movement, invoice or journal effect.

## Change semantics

Each `asset_revision_changes` row belongs to exactly one header and identifies a bounded field key, old/new JSONB values, a value type, an authority type, and an optional reference to a dedicated operation. A decimal must be encoded as a string inside the JSONB envelope with `value_type='decimal'`; the future service must canonicalize and compare values deterministically.

`authority_type='GENERAL_REVISION_CHANGE'` is for an approved general revision candidate. `authority_type='DEDICATED_OPERATION_REFERENCE'` is evidence linking to an existing Barcode/RFID/financial/operational operation; it does not duplicate that operation.

## Concurrency and idempotency

`REVISION_NO_CONCURRENCY_STRATEGY = FUTURE_C2C_ASSET_ROW_LOCK_THEN_ALLOCATE_NEXT_AND_RELY_ON_UNIQUE(asset_id,revision_no)`.

C2B creates the database uniqueness backstop only. C2B does not implement allocation. C2C must lock the Asset row, derive the next number inside the transaction, insert the header/changes, and handle unique conflicts. The generic `idempotency_requests` store remains the primary command replay mechanism; the revision header’s unique scope/key is a domain backstop.

## Tenant and historical rules

Company is required. Branch, technical user and employee are nullable because current project identity conventions and legacy Asset rows do not guarantee a branch row, technical user or employee for every historical context. The future service must verify that every non-null context belongs to the Asset’s company. Asset and company deletion are restrictive, so revision history cannot cascade away. No current data is rewritten and no baseline revision is fabricated.

## Migration boundary

The migration creates only the two new tables, indexes, checks, foreign keys and justified immutability triggers. It does not alter existing Asset, Barcode, RFID, inventory, accounting, status or permission structures. No Sequelize model is required in C2B; the future service/model gate may add models after this schema is proven.

