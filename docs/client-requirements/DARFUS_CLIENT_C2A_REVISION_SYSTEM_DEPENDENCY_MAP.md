# DARFUS Client C2A — System-Wide Revision Dependency Map

Control: `DARFUS-CLIENT-C2A-SYSTEM-WIDE-REVISION-STABLE-DESIGN-01`  
Mode: read-only architecture and referential-integrity audit  
Date: 2026-08-26

## Executive finding

The current system has one stable physical identity authority: `assets.id`. Barcode history, RFID assignments, origin, cost, valuation, movements, events, documents, sales, transfers, workshop, inventory count and accounting references all depend on that identity. The current `asset_events` stream is a strong append-only operational timeline, but it is heterogeneous and has no typed general revision header/change contract. No `asset_revisions` or `asset_revision_changes` tables exist. Therefore a future general revision capability must be additive and must not overload barcode history, financial cost revisions, or operational events.

## Authority graph

```text
Asset.id (stable physical identity)
├─ identity: type / karat / inventoryCode / itemCode / barcode / RFID
├─ operational state: status / branch / location
├─ descriptive state: metadata / components / profile details
├─ dedicated histories: asset_barcode_history, RFID assignments/scans
├─ financial snapshots: purchase cost revisions, current valuations
├─ lifecycle evidence: asset_events, inventory_asset_movements
├─ acquisition: origins, PO item links, supplier/payable/journal source links
├─ commercial: invoice item asset links, POS/returns/exchange/reservations
├─ operations: transfers, workshop, manufacturing, missing cases, count items
└─ presentation/audit: certificates, attachments, tag print events, reports
```

## Database reference map

| Reference group | Current tables / reference | Relationship to Asset | C2A consequence |
|---|---|---|---|
| Identity | `assets`, `asset_barcode_history`, `asset_rfid_assignments` | direct FK or unique identity constraints | Asset ID remains immutable; barcode/RFID keep dedicated authority |
| Lifecycle | `asset_events`, `inventory_asset_movements`, `stock_movements` | direct Asset/event references | Revision must not masquerade as movement or status transition |
| Acquisition | `asset_origins`, `purchase_order_items`, `purchase_order_item_asset_links`, `asset_purchase_cost_revisions` | direct Asset links | Historical supplier/cost/source snapshots remain unchanged |
| Valuation | `asset_current_valuations`, `asset_pricing_policies` | direct Asset FK | Current valuation changes use financial/valuation authority, not generic revision storage |
| Profile | `asset_gold_details`, diamond/gemstone/pearl detail tables, `asset_components`, master-data refs | direct Asset FK | Profile fields require explicit field ownership; no inferred generic mutation |
| Commercial | `invoice_items`, `invoice_item_asset_links`, reservations, CGP dispositions | direct or application-level Asset references | Existing invoice/sale/CGP identity and history must survive unchanged |
| Operations | transfers, workshop items, manufacturing input/output, missing cases, stock audit items | direct Asset FK | Operational workflows continue to reference the same Asset |
| RFID/tagging | `rfid_scan_events`, `asset_tag_print_events`, `asset_barcode_history` | direct Asset FK | Print/replacement/scan history remains separate and auditable |
| Audit | `audit_logs`, outbox/processed events, idempotency records | direct or source-document reference | Any future revision must carry actor, reason, source and idempotency evidence |

## Source/service/API/event coverage

| Layer | Evidence | Current responsibility | Revision dependency |
|---|---|---|---|
| Asset model/controller | `backend/src/models/asset.model.js`, `backend/src/controllers/erp.controller.js` | Asset identity, identity-change guard, metadata/value fields | Stable ID and identity guard must remain authoritative |
| Asset events | `backend/src/models/assetEvent.model.js`, `inventory-v2-runtime.service.js` | immutable chronological lifecycle evidence; operational events | Can receive a notification/audit event, but is not a typed revision store |
| Inventory V2 | `backend/src/services/inventory-v2-runtime.service.js` | transactions, events, movements, origins, receipt evidence | Future revision service must use transaction/locking/idempotency conventions |
| Barcode | `backend/src/services/barcode-identity.service.js` | format, allocation, replacement and barcode history | Barcode replacement remains dedicated; no generic revision bypass |
| RFID | RFID routes/runtime methods | assign, unassign, scan and assignment history | RFID change remains dedicated; revision may link to it |
| Metadata | `backend/src/services/asset-metadata.service.js` | allowlisted metadata update, optimistic timestamp, audit | Candidate descriptive revision fields; exact ownership must be frozen before implementation |
| Selling price | `backend/src/services/asset-selling-price.service.js` | permission/idempotency/audit for price changes | Dedicated financial/pricing owner remains separate |
| Cost/valuation | purchase cost revision and current valuation paths | historical acquisition and current value snapshots | Never overload as generic item revision |
| Transfers/workshop | `backend/src/routes/transfer.routes.js`, ERP routes/services | status/location/movement/event transitions | Revision is not a substitute for operational movement |
| Sales/returns/POS | ERP routes and invoice asset links | SOLD/RETURNED/exchange asset identity | Existing Asset reference remains unchanged |
| CGP | CGP consumer/business/accounting services | DRAFT → VALIDATED → POSTED and asset acquisition evidence | Revision must not create a second CGP or accounting authority |
| Audit/count | canonical inventory audit/count services | observations/count lifecycle | C2A does not reopen Inventory Count |
| Frontend | Asset detail page, `AssetTimeline`, `AssetEditModal`, asset hooks | read history/timeline; edit allowlisted metadata | Future UI should extend Asset Detail history, not create a second item identity |

## Existing data proof

Read-only official database evidence at audit time:

| Check | Result |
|---|---:|
| `current_database()` | `darfus_erp` |
| Assets | 18 |
| Asset barcode history rows / active rows | 18 / 18 |
| Asset events | 65 |
| Inventory asset movements | 62 |
| Purchase cost revisions | 18 |
| Current valuations | 14 |
| PO item asset links | 14 |
| Invoice item asset links | 1 |
| Transfer items | 11 |
| Workshop items | 3 |
| Stock audit items | 33 |
| RFID scan events | 1 |
| General revision tables | 0 (`asset_revisions` and `asset_revision_changes` absent) |
| Direct Asset orphan checks across audited references | 0 |

The direct foreign-key map includes restrictive references from barcode history, components, valuations, origins, cost revisions, RFID, transfers, workshop, invoice links, reservations, and other operational tables. This is evidence that deleting/replacing the Asset row is not a safe revision strategy.

## Reference lifecycle

```text
Create Asset once
  → receipt/origin/cost/valuation evidence
  → operational events and movements
  → sale/return/transfer/workshop/count/RFID evidence
  → future approved revision record linked to same Asset.id
```

A revision must be an additional historical fact. It must not rewrite prior invoice, journal, movement, origin, purchase-cost, or valuation snapshots. No fake historical rows or backfill are authorized by C2A.

## C2A conclusion

`SYSTEM_WIDE_DEPENDENCY_ANALYSIS = COMPLETE` and `ALL_CRITICAL_ASSET_REFERENCES_MAPPED = YES` for the current source/DB surface. A schema design is required for a general revision contract, but no schema or source change is authorized in C2A. The stable candidate is the hybrid design documented in the companion options and impact matrix.

