# DARFUS Client C2A — System-Wide Revision Impact Matrix

Read-only impact assessment; no implementation or migration is included.

| Module / authority | Reads stable Asset ID | Can request a revision | Owns revision business effect | Identity/FK impact | History/snapshot rule | Change required in C2A |
|---|---:|---:|---|---|---|---|
| Asset model/detail | Yes | Future UI/API | Future revision service | Same Asset FK | Additive history only | None |
| Asset metadata | Yes | Existing metadata path | Metadata service today; future revision wrapper | None | old/new values required | None |
| Barcode | Yes | Existing replacement path | Barcode identity service/history | Same Asset; unique active row | Never rewrite prior barcode rows | None |
| RFID | Yes | Existing RFID routes | RFID assignment/history | Same Asset/assignment FKs | Keep scans and assignments | None |
| Supplier Receive V2 | Yes | No generic revision today | Receive/cost/origin/accounting | PO links preserved | Historical receipt snapshots immutable | None |
| Purchase cost | Yes | Dedicated cost operation | Cost revision service | Same Asset | Financial revision remains separate | None |
| Current valuation/pricing | Yes | Dedicated valuation/price paths | Valuation/pricing services | Same Asset | Current snapshot and audit preserved | None |
| Inventory movements | Yes | No; operational transitions | Inventory V2 | Asset/event FKs preserved | Revision does not create movement | None |
| Transfers | Yes | Transfer workflow | Transfer service | Same Asset, transfer item links | Transfer history unchanged | None |
| Workshop | Yes | Workshop workflow | Workshop service | Same Asset/workshop item | Send/return events unchanged | None |
| POS/Sales | Yes | Sale/return/exchange workflow | POS/sale services | Invoice Asset links preserved | Sale and return evidence immutable | None |
| Reservations | Yes | Reservation workflow | Reservation service | Asset FK preserved | No revision side effect | None |
| CGP | Yes | CGP workflow | CGP DRAFT→VALIDATED→POSTED | CGP disposition/origin preserved | No duplicate CGP authority | None |
| Accounting/Treasury | Via source links | Dedicated financial operations | Posting/accounting authority | Journal source unchanged | No revision-only journal | None |
| Inventory Count | Yes | Count workflow only | Count/audit canonical services | Count item FK preserved | Do not reopen count | None |
| Returns/exchange | Yes | Return/exchange workflow | Existing service | Same Asset identity | No automatic replacement | None |
| Invoices/search/print | Yes | Read/projection | Invoice source domains | Links preserved | Reconstruct old snapshots, do not rewrite | None |
| Reporting | Yes | Read only | Projection/reporting | Same IDs | Include revision history only when defined | None |
| Audit/outbox/idempotency | Yes | Future revision command | Shared conventions | Source links + idempotency | Append-only evidence | None |
| Frontend Asset Detail | Yes | Future Revisions view | No authority in UI | Same ID | Timeline plus typed revision view later | None |
| CRM/customer views | Through domain links | Read only | CRM is not inventory owner | No new authority | Consume original truth | None |

## Downstream invariants

1. A general descriptive revision changes no inventory quantity, barcode identity, RFID assignment, movement, status, invoice, payable, journal, tax snapshot or CGP state.
2. A barcode replacement is a dedicated identity operation and may be linked to a revision only as evidence.
3. A financial change is performed by the dedicated financial authority and is not simulated by a generic change row.
4. Existing historical documents remain tied to their original snapshots and Asset ID.
5. Every future revision must carry company/branch scope, authenticated user, employee/operator attribution where required, reason, source and idempotency evidence.
6. No current module needs a breaking API change merely to remain compatible with the recommended additive design.

## Later implementation gates

`C2B` must separately prove schema constraints, field allowlist, permission matrix, transaction/locking, idempotency, event/audit integration, report projections, AR/EN UI, and disposable runtime behavior before any official promotion. C2A does not authorize any of those writes.

