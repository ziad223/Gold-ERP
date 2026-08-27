# DARFUS Client C2C1 — System Consumer Impact

## System-wide impact matrix

| Consumer | Reads revision history? | May create generic revision? | Same Asset ID? | Breaking change in C2C2? | Contract impact |
|---|---:|---:|---:|---:|---|
| Asset detail/timeline | future read projection | no direct bypass | yes | no | display linked revision/event snapshots |
| Barcode identity/history | no generic write | no | yes | no | barcode authority remains dedicated |
| RFID | no generic write | no | yes | no | RFID service remains authority |
| Supplier Receive V2 | optional history read | no | yes | no | receive remains acquisition authority |
| Workshop | optional history read | no | yes | no | workshop transitions remain dedicated |
| Transfers | optional history read | no | yes | no | branch/location movement remains dedicated |
| POS/sales | optional detail read | no | yes | no | sale/status/pricing remain dedicated |
| Returns/exchange | optional detail read | no | yes | no | Asset identity remains continuous |
| Invoice/search/print | optional read projection | no | linked source | no | no duplicate invoice authority |
| CGP | optional read | no | yes where linked | no | CGP posting remains DRAFT→VALIDATED→POSTED |
| Accounting/treasury | no generic write | no | source-linked | no | no journal/payable mutation |
| Inventory Count | optional read | no | yes | no | count authority remains count workflow |
| CRM | optional 360 read | no | linked source | no | CRM is not a second source of truth |
| Reports/exports | future read projection | no | linked source | no | additive, scope-filtered projection |
| Audit/notifications | yes, through event/audit links | no | yes | no | existing event/audit authorities reused |
| Frontend | future read/create UI only | through approved endpoint | yes | no | no UI or route implementation in C2C1 |

## Shared dependencies

- Asset ID is the stable physical identity shared by all listed consumers.
- Company/branch scope is resolved by the existing server context, not by a revision payload.
- User/Auth/RBAC stays the authorization authority; Employee attribution is additive evidence.
- Barcode, RFID, cost, valuation, status, movement, workshop, transfer, POS, CGP, and accounting remain dedicated authorities.
- The future read projection may be consumed by Asset detail, audit, reports, invoice projections, or CRM without copying current-value ownership.

## Compatibility decisions

`BREAKING_DOWNSTREAM_CHANGE_REQUIRED = NO`. The C2B tables are additive and foreign-key to the existing Asset. No existing row, route, or current authority must change merely to read an optional revision history.

`WILL_REQUIRE_CORE_REDESIGN_LATER = NO` for the frozen generic five-field scope. Future dedicated operations may link to a revision through `dedicatedOperationReference`, but the generic endpoint cannot become an umbrella for them.

`DUPLICATE_AUTHORITY = NO` and `CIRCULAR_DEPENDENCY = NO`: the revision service records historical changes and links existing events/audit; it does not own the current state of any other bounded context.

## Future C2C2 change boundary

Allowed only after this freeze: a revision service/controller/route, validators, permission registration under the frozen names, models/adapters for the already-created C2B tables if needed, read projections, and focused tests. The implementation must not modify supplier receive, POS, CGP, accounting, barcode, RFID, workshop, transfers, inventory count, CRM, or status schemas unless a new evidence-backed contract gate is approved.

