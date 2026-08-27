# DARFUS C2B — Schema System Impact Recheck

## Impact result

`SYSTEM_WIDE_SCHEMA_IMPACT_REVIEW = COMPLETE`.

The new schema adds references to existing stable authorities only. It does not add columns to existing business tables, alter existing enums, change existing FKs, or change any API/model contract.

| Area | Existing authority | Schema effect | Result |
|---|---|---|---|
| Asset | `assets.id` | restrictive reference only | stable identity preserved |
| Barcode | barcode service/history | no table change | replacement/reprint semantics unchanged |
| RFID | assignment/scan history | no table change | RFID authority unchanged |
| Supplier Receive | PO/origin/cost/movement/journal | no relation written | receive contract unchanged |
| CGP | CGP aggregate/consumers | no relation written | DRAFT→VALIDATED→POSTED unchanged |
| Transfers | transfer items/events/movements | no relation written | transfer identity unchanged |
| Workshop | workshop items/events | no relation written | workshop lifecycle unchanged |
| Returns/Exchange/POS | invoice Asset links/status services | no relation written | sale/return identity unchanged |
| Accounting | journals and snapshots | no relation written | no new posting authority |
| Inventory Count | count items/audits | no relation written | count remains closed |
| CRM/Reports | read projections | no API/UI change | future read projection can join by Asset ID |
| Audit | existing events/audit/idempotency | future reference only | no duplicate audit authority |
| Frontend | Asset detail/timeline | no UI change | no runtime claim |

## Referential-integrity checklist

- Asset orphan risk: guarded by required `asset_revisions.asset_id` FK and RESTRICT.
- Change orphan risk: guarded by required `asset_revision_changes.revision_id` FK and RESTRICT.
- Company scope: required FK; future service must enforce Asset/company equality because cross-column tenant equality is not represented by a redundant composite FK in C2B.
- Branch/user/employee context: nullable FKs with SET NULL, preserving history if an optional context row is removed.
- Barcode/RFID/accounting history: no existing rows or constraints are altered.
- Existing data: no backfill and no rewrite.

## Future service invariant

Before inserting a revision, C2C must lock/load the Asset, verify `asset.company_id = revision.company_id`, verify branch/user/employee scope, validate the field allowlist and dedicated authority, claim the central idempotency scope/key, then insert header and changes in one transaction. These are not implemented or claimed by C2B.

