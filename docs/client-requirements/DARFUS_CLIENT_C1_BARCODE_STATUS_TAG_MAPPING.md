# DARFUS C1 — Barcode Status, Common Fields, Tags, RFID, and Integration

## Status / lifecycle mapping

| Client vocabulary | Current canonical state/event | Exact? | Evidence / disposition |
|---|---|---|---|
| Created | Initial Asset creation plus `asset_barcode_history.action=INITIAL`; operational status may begin `PENDING_INTEGRATION` or `AVAILABLE`. | IMPLEMENTED_DIFFERENTLY | Creation is an event/history fact, not a single final status. |
| In Stock | `AVAILABLE` | IMPLEMENTED_DIFFERENTLY | Operational equivalent; label vocabulary differs. |
| Reserved | `RESERVED` | EXACT | In `OPERATIONAL_STATUS` and transition map. |
| Sold | `SOLD` | EXACT | In status and canonical sale transition. |
| Returned | `RETURNED` plus return event/movement | IMPLEMENTED_DIFFERENTLY | Returned is both a durable state in current runtime and a lifecycle event; Barcode remains. |
| Repair | `WORKSHOP` plus workshop events | IMPLEMENTED_DIFFERENTLY | Current canonical operational state is WORKSHOP, not REPAIR. |
| Melted | `MELTED` | EXACT | Canonical state and transformation path. |
| Lost | `MISSING` plus event/audit evidence | IMPLEMENTED_DIFFERENTLY | Current accepted vocabulary uses MISSING; Inventory Count is not reopened. |
| Archived | Legacy `archived` maps to `MISSING`; current V2 status domain does not promote `ARCHIVED`. | IMPLEMENTED_DIFFERENTLY | Do not add enum values in C1. |

`STATUS_MAPPING = IMPLEMENTED_DIFFERENTLY` and is not a reason to mutate the status schema in C1.

## Common profile field parity

| Field | GBW | GBP | Diamond | Gem Stone | Pearl / loose profiles | Current authority | C1 result |
|---|---|---|---|---|---|---|---|
| Barcode | Asset/list/detail/tag | Same | Same | Same | Same | `assets.barcode` + active history | EXACT |
| SKU | No separately proven canonical SKU field | Same | Same | Same | Same | No independent Barcode alias established | MISSING / NOT_PROVEN |
| RFID | Optional Asset assignment/history | Same | Same | Same | Same | `asset_rfid_assignments`; not Barcode | AVAILABLE_DIFFERENTLY |
| Item Type | Asset type/profile/code | Same | Same | Same | Same | Asset identity fields; generic guard | EXACT |
| Description | Asset metadata/profile | Same | Same | Same | Same | Asset metadata service | EXACT |
| Brand | Asset metadata/tag where provided | Same | Profile metadata | Profile metadata | Profile metadata | Asset metadata / profile payload | AVAILABLE_DIFFERENTLY |
| Supplier | Asset supplier relation/list/detail | Same | Same | Same | Same | `supplier_id` + receive origin | AVAILABLE_DIFFERENTLY |
| Purchase Date | Asset/list/detail | Same | Same | Same | Same | `assets.purchase_date` | AVAILABLE_DIFFERENTLY |
| Image | No exact common Asset/tag contract proven | Same | Same | Same | Same | Attachments exist separately; image edit not in metadata allowlist | MISSING / PARTIAL |
| Status | V2 operational status | Same | Same | Same | Same | `operational_status` + legacy mapping | AVAILABLE_DIFFERENTLY |
| Branch | Asset branch/branch_id and server scope | Same | Same | Same | Same | company/branch authority | EXACT |
| Created By / Created Date | Asset timestamps/created_by | Same | Same | Same | Same | Asset model/events | AVAILABLE_DIFFERENTLY |
| Audit Log | Asset events + audit service | Same | Same | Same | Same | `asset_events`, audit log | AVAILABLE_DIFFERENTLY |

`COMMON_PROFILE_FIELDS = PARTIAL`: most data is available through the Asset/detail projections, but exact common UI/tag parity across every profile is not proven and SKU/image are not independently established as canonical fields.

## Tag renderer audit

Source: `features/printing/components/ClientBarcodeTagTemplate.tsx`, `barcode-tags/BarcodeTagFront.tsx`, `BarcodeTagBacks.tsx`, `types.ts`, and `lib/print/barcode-label.ts`.

| Profile | Business fields evidenced in renderer | Extra / illustrative behavior | C1 result |
|---|---|---|---|
| GBW | Front stored Barcode; back GW, ST, stored NT, MC; price hidden by policy. | Exact paper layout/order is not frozen; NT is stored, not recomputed. | PARTIAL |
| GBP | Front Barcode/price; back optional brand, WT, DIS, karat/name title. | Exact visual order and optional rules are not fully proven. | PARTIAL |
| Diamond | Front Barcode/price; back Carat, CC, Cut/shape, DIS, optional Cert. | Cut/Cert are current extras; exact client subset/layout not proven. | PARTIAL |
| Gem Stone | Front Barcode/price; back multiple ST rows via `resolveStones`, DIS, optional Cert. | Mockup prefix conflict is resolved by D03/NCK; physical print layout not exact-proofed. | PARTIAL |
| Pearl | Front Barcode/price; back Type, Size, Quality, DIS. | Current renderer includes Size/Quality beyond the short mockup description; layout not exact-proofed. | PARTIAL |

`TAG_PROFILE_PARITY = PARTIAL`. No physical tag was printed in C1; no production printing or barcode mutation occurred.

## RFID interaction

| Concern | Current contract | Evidence |
|---|---|---|
| Owner | Asset-linked RFID assignment service/history | `inventory-v2-runtime.service.js`, `asset_rfid_assignments` |
| Assignment | One current assignment per Asset; global RFID uniqueness | DB indexes `asset_rfid_number_global_uq`, `asset_rfid_one_current_uq` |
| Replacement/unassign | Dedicated routes, reason/idempotency, history and Asset event | `POST /inventory-v2/assets/:id/rfid`, `/rfid/unassign` |
| Barcode coupling | No implicit Barcode↔RFID replacement; each identity has separate lifecycle | Source service boundaries |
| Return/status | Status transition does not edit RFID | `transitionAsset()` does not write RFID |
| Revision | RFID changes are assignment history, not Item Revision | Source evidence |

`RFID_BARCODE_COUPLING = SEPARATE_GOVERNED_IDENTITIES; NO_IMPLICIT_COUPLING`.

## Future integration / extensibility

| Consumer | Integration authority | Direct Barcode generation/write? |
|---|---|---:|
| POS | Asset search/resolution and canonical sale | No |
| Supplier Receive | Supplier V2 creates Asset and calls identity service | No independent authority |
| CGP | CGP inventory consumer calls identity service | No independent authority |
| Inventory Count | Barcode observes an Asset; count authority is not Barcode | No |
| Transfers | Asset transition/movement retains identity | No |
| Workshop/Repair | Asset transition/events retain identity | No |
| Returns/Exchange | Asset resolution/transition; Product fallback guarded where required | No for final Asset path |
| Invoice Search / CRM / Reports | Read projections and linked Asset identity | No |
| Audit | Asset events/audit service | No |

`FUTURE_INTEGRATION_REQUIRES_BARCODE_REBUILD = NO`  
`DUPLICATE_BARCODE_AUTHORITY = NO`  
`CIRCULAR_DEPENDENCY = NO`

