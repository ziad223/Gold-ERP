# DARFUS CLIENT CRM — Safe Implementation Roadmap

Planning only. No batch below was started. Every batch requires explicit Owner approval.

| BATCH_ID | TITLE | REQUIREMENTS | ROOT CAUSE | OBJECTIVE | ALLOWED SCOPE | FORBIDDEN SCOPE | DB/MIGRATION | BUSINESS LOGIC | DEPENDENCIES | RISK | DISPOSABLE ACCEPTANCE |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CRM-1A | Identity and field parity | CF; SCR fields | Foundation | Freeze field vocabulary/server authority | Customer contract/projection | Merge/communication/operational domains | No | No until approved | Frozen identity/RBAC | P1 | No |
| CRM-1B | Duplicate detection review | BR duplicate; SCN-03; EX-02 | Duplicate | Read-only detection/proposal | Search/service/tests | Merge mutation | No | No | CRM-1A | P1 | No |
| CRM-1C | Merge authority | BR merge; SCN-04; EX-03 | Duplicate/Merge | Design survivor/remap/audit/recovery | Explicit approved merge design | Destructive rewrite | Maybe/owner gate | Yes after approval | CRM-1B + owner decision | P1 | Yes |
| CRM-1D | Lifecycle parity | BR archive/reactivate | Lifecycle | Map restrictions/audit | Status adapter/permission proof | New states without authority | No | Possibly | CRM-1A | P1 | No |
| CRM-2A | Customer 360 projection | ARC/MOD/INT source rows | 360 | Read-only source-backed view | Projection/read routes/UI | Duplicate transactions | No | No | CRM-1A + maps | P1 | Maybe |
| CRM-2B | Timeline/history | ARC timeline; MOD history | Timeline | Source event coverage/navigation | Read projection/tests | Manual event truth | Maybe | No | CRM-2A | P1 | Maybe |
| CRM-2C | Balance adapter | MOD-07; INT-02 | Financial read model | Canonical read semantics | Read adapter/reconcile | GL ownership/change | No | No | Accounting authority | P1 | No |
| CRM-3A | Dashboard/segmentation | MOD dashboard/segment | Analytics | Owner-defined metrics and segments | Read projections/UI | Unapproved scoring | No | No | CRM-2A/2C | P2 | No |
| CRM-3B | Loyalty parity | MOD-09; BR-08/09 | Loyalty | Map policy/event/expiry/audit | Existing ledger adapter | Accounting mutation | No | Yes only after approval | CRM-1A | P1 | Maybe |
| CRM-4A | Communication/consent | CF-10; MOD-10; BR-07/10 | Privacy/Communication | Establish owner/permission/audit | New domain after decision | Sending during design | Yes if approved | Yes after approval | Privacy/RBAC/audit | P1 | Yes |
| CRM-4B | Security/audit/notifications | SCR/INT/EX | Observability | CRM permission/audit matrix | Read-only catalog/projection | Permission widening | No | Possibly | CRM-1A/4A | P1 | No |
| CRM-5A | API/DTO/events/CQRS | ARC/TECH | Architecture | Classify mandatory contracts | Adapters/contracts | New event store by assumption | Maybe | Possibly | Owner architecture decision | P2 | No |
| CRM-5B | Offline/recovery | SCN-09; EX-06; TECH-09 | Offline | Design and prove sync/conflict | Isolated design/proof | Main DB mutation | Yes if approved | Yes after approval | CRM-1A | P2 | Yes |
| CRM-6 | Performance/production | TECH/FUT checklist | Readiness | Benchmark/checklist after stable scope | Isolated benchmark/readiness | Synthetic main-DB data | No | No | Prior batches | P2 | Yes |

