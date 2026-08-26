# DARFUS ERP — C2A System-Wide Revision Dependency + Stable Design Gate Report

## Executive Summary

تم تنفيذ C2A كفحص قراءة وتصميم فقط. تم ربط هوية `Asset` الثابتة بكل المراجع الحرجة في المصدر وقاعدة البيانات، ومراجعة تاريخ الباركود وRFID والأحداث والتكلفة والتقييم والحركة والبيع والتحويل والورشة وCGP والمحاسبة والتقارير. لم يتم تعديل الكود أو الاختبارات أو المخطط أو قاعدة البيانات، ولم يتم تنفيذ أي Receive أو أي عملية تجارية.

النتيجة الأساسية: `assets.id` هو مرجع الهوية الفيزيائية الثابت. توجد بنية أحداث قوية للتاريخ التشغيلي، لكنها ليست عقد Revision عام typed وقابلاً للتزامن. لا توجد جداول Revision عامة حاليًا. التصميم المستقر المقترح هو Hybrid: سجل Revision عام مستقبلي مستقل، مع إشعار في `asset_events`، وإبقاء Barcode وRFID والتكلفة والتقييم والمحاسبة أصحاب سلطة مستقلين.

## Scope and evidence boundary

| Item | Result |
|---|---|
| Control | `DARFUS-CLIENT-C2A-SYSTEM-WIDE-REVISION-STABLE-DESIGN-01` |
| Mode | Read-only architecture / referential-integrity |
| Official DB checked | `darfus_erp` via `current_database()` |
| Source/test/schema changes | 0 by C2A |
| Business DB writes | 0 |
| Inventory Count | CLOSED; not reopened |
| Runtime mutation | Not run; source/DB evidence was sufficient for design mapping |
| Production | Not contacted |

Pre-existing worktree drift was observed and preserved. It is not attributed to C2A. The five files in this control are documentation artifacts only.

## Current authority and dependency proof

The full dependency map is in `DARFUS_CLIENT_C2A_REVISION_SYSTEM_DEPENDENCY_MAP.md`. The most important proof is:

- `assets.id` is referenced by restrictive foreign keys from barcode history, components, valuations, origins, purchase-cost revisions, RFID, transfers, workshop, invoice links, reservations, manufacturing and stock-audit data.
- `asset_events` contains structured actor/source/before-after/idempotency context and 65 current rows, but current events are operational lifecycle events; no `REVISION` event type or general revision table exists.
- `asset_purchase_cost_revisions` is a financial snapshot authority with its own revision number and must not be reused for descriptive item revisions.
- Barcode format, active uniqueness, replacement and identity immutability are protected by current service/model/database constraints and were covered by the accepted C1 evidence.
- Asset detail currently presents unified history/timeline and related origins, costs, valuation, components, RFID, certificates, movements and links; there is no general Revision endpoint or tab.
- Direct Asset orphan checks across the audited reference tables returned zero at audit time. This is a current-data observation, not permission to mutate history.

## Stable Asset identity decision

`STABLE_ASSET_ID = assets.id`

The ID remains stable across metadata, approved financial, operational and future revision events. A revision never creates a replacement Asset for the same physical piece and never deletes/recreates the Asset. Existing PO, invoice, journal, origin, barcode, RFID, transfer, workshop, count and movement links therefore remain valid.

## Architecture option decision

| Option | Decision | Reason |
|---|---|---|
| A — extend `asset_events` | Not selected as sole authority | Heterogeneous operational event stream; no typed revision header/change cardinality or DB-enforced per-Asset revision contract |
| B — revision header + change rows | Valid core | Clean typed semantics, but needs event/audit integration and dedicated identity/financial handling |
| C — Barcode history only | Rejected | Would corrupt the meaning of barcode replacement/history and cannot represent general fields |
| D — Hybrid | **Recommended stable design** | Dedicated typed revision authority plus existing event/audit integration and dedicated Barcode/RFID/financial authorities |

`REVISION_ARCHITECTURE = D_HYBRID_CANONICAL_REVISION_PLUS_EXISTING_AUTHORITIES`

## Recommended stable design

Future C2B should design, but not yet implement:

1. `asset_revisions` immutable header linked to `assets.id`, with per-Asset revision number, source, actor/operator, company/branch, reason, occurred time and idempotency fingerprint.
2. `asset_revision_changes` typed old/new value rows with a frozen field allowlist and dedicated-owner reference where applicable.
3. An append-only Asset event/audit notification referencing the revision. `asset_events` remains lifecycle evidence, not a duplicate revision store.
4. Existing barcode identity service/history for barcode replacement only; existing RFID routes/history for RFID only; purchase-cost/current-valuation/pricing services for financial changes only.
5. No direct public CRUD, no `MAX(revision_no)+1`, no anonymous changes, and no generic revision that posts accounting or changes inventory quantity.

`REVISION_STORAGE_AUTHORITY = FUTURE_ASSET_REVISION_HEADER_AND_CHANGE_ROWS`  
`REVISION_SERVICE_AUTHORITY = FUTURE_CANONICAL_ASSET_REVISION_SERVICE`

## Field classification outcome

The companion field classification separates:

- immutable identity: Asset ID, type, inventory code, item code, karat;
- dedicated identity operations: Barcode and RFID;
- operational authority: status, branch, location, movements and workflow state;
- dedicated financial authority: weight when economically material, purchase cost, VAT/tax snapshots, current valuation, selling price, supplier/origin;
- future general revision candidates: allowlisted description, notes, brand/category, attachments and profile/component values only after an owner-approved validation/permission contract.

This prevents the word “revision” from becoming an unrestricted write path.

## System-wide impact

The companion impact matrix proves that current downstream modules can continue to read the same Asset ID without a breaking change. A general descriptive revision has no quantity, movement, status, sale, tax, payable, journal, CGP or Inventory Count effect. Financial or identity effects remain under their dedicated authorities.

## Historical snapshot and no-fake-history policy

Prior invoice/journal/movement/origin/purchase-cost/valuation/barcode/RFID evidence remains immutable. New revision rows, when later authorized, describe only changes observed after implementation. No backfill may invent v1/v2 history for old data. Existing `asset_events` remain as they are; C2A does not relabel them as revisions.

## Compatibility and security

Backward compatibility is preserved because existing Assets may have zero general revision rows, existing APIs continue to expose the same Asset identity, and current workflows retain their owners. User/Auth/RBAC remains authorization authority; Employee remains operator identity. No shared account or UI-based permission shortcut is introduced.

## Deferred C2B requirements

The next design gate, only after explicit Owner approval, must decide the exact schema constraints, field allowlist, permissions, conflict handling, row-lock/concurrency method, idempotency semantics, event/audit linkage, projections and AR/EN UI. It must rehearse additively on a disposable clone before any official promotion. C2A does not create or apply a migration.

## Risk / severity

| Risk | Finding | Severity |
|---|---|---|
| Orphan references | Direct audited Asset-reference orphan count is 0; future schema should use restrictive FK | P2 deferred design safeguard |
| Duplicate authority | Avoided by hybrid separation | P1 if violated; none introduced |
| Identity break | Current Asset/Barcode identity guards preserved | P0 if violated; none introduced |
| Historical fabrication | No backfill authorized | P1 if violated; none introduced |
| Financial corruption | Cost/valuation/accounting kept dedicated | P0 if violated; none introduced |
| Future permission ambiguity | Field allowlist and role matrix still need C2B design | P2 |

`P0_COUNT = 0`  
`P1_COUNT = 0`  
`P2_COUNT = 2`  
`P3_COUNT = 0`

## Final tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-C2A-SYSTEM-WIDE-REVISION-STABLE-DESIGN-01
MODE = READ_ONLY_ARCHITECTURE_AND_REFERENTIAL_INTEGRITY_CONTROL
OFFICIAL_DATABASE = darfus_erp
OFFICIAL_DB_WRITES = 0
SOURCE_FILES_CHANGED_BY_C2A = 0
TEST_FILES_CHANGED_BY_C2A = 0
SCHEMA_CHANGED = NO
MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED = 0
ASSET_ID_STABLE = YES
ASSET_REFERENCE_MAP_COMPLETE = YES
ALL_CRITICAL_ASSET_REFERENCES_MAPPED = YES
SYSTEM_WIDE_DEPENDENCY_ANALYSIS = COMPLETE
REVISION_ARCHITECTURE = D_HYBRID_CANONICAL_REVISION_PLUS_EXISTING_AUTHORITIES
REVISION_STORAGE_AUTHORITY = FUTURE_ASSET_REVISION_HEADER_AND_CHANGE_ROWS
REVISION_SERVICE_AUTHORITY = FUTURE_CANONICAL_ASSET_REVISION_SERVICE
BARCODE_AUTHORITY_PRESERVED = YES
RFID_AUTHORITY_PRESERVED = YES
INVENTORY_AUTHORITY_PRESERVED = YES
ACCOUNTING_AUTHORITY_PRESERVED = YES
AUDIT_AUTHORITY_PRESERVED = YES
HISTORICAL_SNAPSHOTS_PRESERVED = YES
FAKE_HISTORY_CREATED = NO
ORPHAN_RISK = NO_WITH_FUTURE_FK_AND_UNIQUE_CONSTRAINTS
BROKEN_REFERENCE_RISK = NO
DUPLICATE_AUTHORITY = NO
CIRCULAR_DEPENDENCY = NO
BACKWARD_COMPATIBILITY = PASS
P0_COUNT = 0
P1_COUNT = 0
P2_COUNT = 2
P3_COUNT = 0
GATE = PASS_CLIENT_C2A_SYSTEM_WIDE_REVISION_STABLE_DESIGN
NEXT_BATCH = C2B_SCHEMA_DESIGN_AND_DISPOSABLE_REHEARSAL
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## STOP

تم إنشاء وثائق التصميم المطلوبة فقط. لا يوجد تنفيذ أو Migration أو كتابة على `darfus_erp`.  
`C2A SYSTEM-WIDE REVISION STABLE DESIGN COMPLETE → OWNER REVIEW → WAIT FOR EXPLICIT APPROVAL`.

