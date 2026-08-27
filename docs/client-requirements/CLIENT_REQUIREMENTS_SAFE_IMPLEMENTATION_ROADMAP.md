# DARFUS ERP — Client Requirements Safe Implementation Roadmap

This is a proposal only. No roadmap batch was started by this audit.

| Order | Batch | Objective | Prerequisites | Main risk | Gate |
|---:|---|---|---|---|---|
| 1 | A — Owner/Architecture Decisions | Resolve CR-EMP-001, CR-BC-001/002/003 and CR-CGP-001/002. | Owner review of conflict register; preserve current security/inventory/accounting authorities. | Security or identity divergence if silently implemented. | Explicit written decisions. |
| 2 | B — Employee Identity + Attribution Foundation | Close Employee Code/profile/branch/employee attribution and establish one read-only identity projection. | Batch A; no shared-account weakening; Employee master authority. | Wrong employee attribution on financial/operational actions. | Employee field/uniqueness/attribution proof. |
| 3 | C — Barcode Exact Parity / Revision Decisions | Reconcile code conflicts and prove tag/identity/history/revision semantics without changing existing identities. | Batch A; current barcode DB baseline; backup/migration plan only if approved. | Barcode identity break or historical invalidation. | Code table, tag, history and revision gate. |
| 4 | D — Invoice Search & Print Exact Parity | Complete type projections, Employee filter, multi-select type, lifecycle reconstruction, print and audit fields. | B; CGP artifact decision; event/projection authority. | Financial search/print misrepresentation. | All seven types and filters read-only proof. |
| 5 | E — CGP Invoice Artifact/Search/Print/Employee Parity | Add only the read-only CGP invoice artifact/projection required by approved mapping. | A/B/D; current CGP lifecycle remains DRAFT → VALIDATED → POSTED. | Duplicate invoice/business authority. | Artifact-to-CGP one-to-one reconciliation. |
| 6 | F — CRM Foundation + Customer 360 Read Model | Close duplicate detection foundation and unify read-only cross-domain 360. | Customer Domain owner; invoice/CGP projections; privacy decision. | CRM becomes second owner of financial/inventory truth. | Source-authority and 360 completeness proof. |
| 7 | G — CRM Transaction/Balance Integration | Complete returns/exchanges/CGP/installments/reservations/repairs/balance projections. | F; domain read contracts. | Stale or contradictory balances. | Reconciliation against original authorities. |
| 8 | H — CRM Segmentation | Add approved manual/dynamic segmentation dimensions. | F; owner decision on segment rule authority; consent/privacy. | Unauthorized inference or privacy exposure. | Rule and permission proof. |
| 9 | I — CRM Loyalty | Close adjust/expire/event integration/audit while keeping loyalty separate from accounting. | F/H; loyalty policy approval. | Incorrect financial/loyalty balances. | Ledger/idempotency/audit proof. |
| 10 | J — Communication Center | Add communication initiation/history/follow-up/document links. | Privacy/consent decision; CRM identity. | Sensitive customer-data leakage. | Permission, consent and audit gate. |
| 11 | K — CRM Merge/Archive/Reactivate/Consent | Implement only approved merge/history/consent semantics. | A/F/J; rollback/compensation design. | Irreversible identity/data loss. | Disposable rehearsal plus owner approval. |
| 12 | L — Employee Attendance/Leave | Add devices, corrections, leave workflow and reports. | B; owner device/offline decisions. | Payroll/audit errors. | Attendance/leave no-delete and approval proof. |
| 13 | M — Employee Payroll/Accounting | Complete salary components, payroll lifecycle, posting and reporting. | B/L; accounting mapping approval. | Critical payroll/accounting corruption. | Balanced journal and immutable-row proof. |
| 14 | N — Employee Performance/KPI | Add transaction-derived KPI definitions and reports. | B; authoritative event inputs; privacy decision. | Misleading manual KPI results. | Derived-only KPI proof. |
| 15 | O — Final Cross-Module Parity Acceptance | Reconcile all five documents without reopening closed Inventory Count. | All prior gates; current source/DB baseline. | Broad regression. | Exact traceability matrix re-run and Owner acceptance. |

## Process controls for every future batch

- Read the relevant client sections completely before implementation.
- Use the smallest source change that closes an approved atomic row.
- Keep User/RBAC, Asset/Barcode, CGP posting, accounting and Customer Domain authorities intact.
- Use disposable/Owner-approved rehearsal for mutations; official `darfus_erp` remains read-only unless a separately named promotion is authorized.
- Run focused evidence first; do not repeat unrelated closed Inventory Count proofs.
