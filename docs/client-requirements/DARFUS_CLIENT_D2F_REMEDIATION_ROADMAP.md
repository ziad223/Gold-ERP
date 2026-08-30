# DARFUS ERP — D2F Remediation Roadmap

This document is planning only. No batch below was started by Gate D.

## Root-cause groups

| Group | Affected rows/issues | Root cause | Dependency | Minimum safe batch |
|---|---|---|---|---|
| ROOT_CAUSE_GROUP_01 | INV-002, INV-013, INV-020, INV-028, INV-030, INV-031 to INV-036, INV-041, INV-042, INV-054 | Client event-store wording differs from the accepted DARFUS relational source/projection authority. | Owner architecture decision only if literal event-store implementation is demanded. | Documentation/architecture decision; no implementation by default. |
| ROOT_CAUSE_GROUP_02 | INV-057, INV-058, D2F-ISSUE-003 | Capacity/cache wording and benchmark evidence are different dimensions; current 50k benchmark is successful but query plans include scans/sorts and no cache warm/cold proof. | New measured target and Owner approval. | Optional capacity benchmark/cache decision control. |
| ROOT_CAUSE_GROUP_03 | D2F-ISSUE-001, D2F-ISSUE-004, plus optional logo observation D2F-ISSUE-002 | Evidence/documentation/provenance residue outside the D2F business contract. | Documentation owner; optional asset/config owner. | Documentation reconciliation only; optional non-core asset control. |

## Proposed order

| Batch ID | Rows / issues | Root cause | Files / areas | DB change expected | Migration expected | Business logic change | Risk | Dependencies | Owner approval |
|---|---|---|---|---|---|---|---|---|---|
| D2F-ROADMAP-00 | D2F-ISSUE-001, D2F-ISSUE-004 | Evidence/documentation provenance | Report index, handoff continuity notes | No | No | No | P3 provenance confusion | Owner review | YES |
| D2F-ROADMAP-01 | INV-057, INV-058, D2F-ISSUE-003 | Measured capacity/cache decision | Benchmark harness and query-plan evidence only at first | No | No | No | P3 capacity overclaim if skipped | New target, representative dataset | YES |
| D2F-ROADMAP-02 | INV-002, INV-013, INV-020, INV-028, INV-030, INV-031..036, INV-041, INV-042, INV-054 | Architecture wording reconciliation | Authority documentation only unless Owner explicitly selects new architecture | No by default | No by default | No by default | P3 wording mismatch; high risk if an event store is introduced casually | Frozen architecture decision | YES |
| D2F-ROADMAP-03 | D2F-ISSUE-002 | Optional logo/upload asset | Configuration/asset ownership | No | No | No | P2 non-core visual omission | Asset owner decision | YES |

## Explicitly separate and do not start from Gate D

- CGP repeated-print/recovery UI.
- Gift Voucher financial mapping persistence prevention.
- UX11C stale-navigation test maintenance.
- CRM, HR, Payroll, production, and deployment.

`NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`.
