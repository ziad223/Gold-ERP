# DARFUS C3 — Common Profile Authority Map

## Frozen architecture

| Concern | Current authority | Who writes it | Who reads it | Who snapshots it | Who displays it | Must not own it |
|---|---|---|---|---|---|---|
| Common descriptive identity (`description`, `brand`, existing model metadata) | `assets` plus the existing Asset metadata/revision allowlists | Supplier Receive V2 at creation; Asset metadata/revision for approved descriptive changes | Asset list/detail, POS/search projections, reports, tags where profile requires | PO item/source and Asset events where applicable | Profile screens, Asset Detail, list/search, projections | A new profile table or a second metadata service |
| Supplier relationship | Supplier master + `assets.supplier_id` + PO/origin links | Supplier Receive V2 and canonical purchase source | Asset list/detail, supplier history, payable projections | PO, origin, purchase-cost revision | Shared Receive, Asset Detail, supplier views | Profile UI or generic Asset metadata |
| Location | `inventory_locations` and `assets.location_id`; movements own transitions | Canonical receive and movement/transfer/workshop/count flows | Asset list/detail, movement and scope queries | Origin/movement rows | Shared Receive and Asset Detail | Free text or a profile-specific location column |
| Purchase date | PO date and `assets.purchase_date`; purchase-cost/origin snapshot | Canonical Supplier Receive | Asset detail/list, purchase history | PO/origin/cost revision | Shared Receive and Asset Detail | A common profile duplicate |
| Tax treatment | Tax Engine + company tax policy + PO immutable tax snapshot | Canonical receive/Tax Engine | PO/tax reports/preview | PO `tax_snapshot` and financial source links | Shared Tax Summary and financial views | Asset profile fields or a frontend-only tax calculator |
| Notes | Asset metadata for Asset notes; PO/event/audit notes for transaction context | Existing receive and metadata/revision authorities | Asset detail, audit/timeline, PO | Events/audit and source document | Shared receive and detail/revision UI | A profile-specific notes authority |
| Barcode | Barcode identity service + `assets.barcode` + active/retired history | Asset creation/replacement dedicated routes | Asset/POS/tags/count/transfer/workshop/returns | Barcode history/events | List/detail/tag/POS | Common profile contract or profile UI |
| RFID | Asset-linked RFID assignment/history service | Dedicated RFID assignment/replace/unassign routes | Asset detail/list, scan and operational consumers | `asset_rfid_assignments` and events | Asset Detail/RFID UI and tag consumers | Common metadata or Barcode service |
| Profile/item type | Canonical `PROFILE_REGISTRY`, Asset identity fields and item-code master | Supplier Receive V2/profile strategies | Profile registry, Asset detail, barcode/POS/report projections | Asset/source history | Profile chooser/detail/tag | A free-form client label |
| Status | Inventory V2 transition authority and Asset events | Canonical business transitions | List/detail/POS/count/returns/transfers/workshop | Asset events/movements | Read-only status UI | Generic common-field update |
| Branch/company | Server-authoritative auth/context and Asset scope | Server context, not client payload | All scoped routes and projections | Asset/movement/journal/source scope | Context selector/read-only display | Frontend-only selectors or profile form |
| Created/audit facts | Asset timestamps, actor context, Asset Events and Audit Service | Server runtime | Detail/timeline/audit/report consumers | Immutable events/audit/source references | Asset Detail and audit views | User-entered profile fields |

## Public contract

The minimum safe public contract is an additive read-only `commonFieldContract` published with the existing `/inventory-v2/profiles` response. It describes canonical field keys, owner, requiredness at the receive envelope, read/write boundary, and dedicated authority for identity/financial fields. It is metadata about the existing contract; it does not create tables or a second write path.

The canonical receive body remains the existing Supplier Receive V2 request:

```text
supplierId + branch context + purchaseDate + taxTreatment + notes
items[].perPiece[].profile + description + existing profile-specific fields + locationId
```

`SharedReceiveSection` remains the one common UI source for Supplier, Location, Purchase Date, Tax Treatment, Notes and Tax Summary. The profile form remains the source of profile-specific extensions. The client cannot make `branchId`, Barcode, RFID, status, financial values, or movement values authoritative by sending them through the common contract.

## Design invariants

```text
WHO_OWNS_COMMON_PROFILE_DATA = Existing Asset / Supplier Receive V2 / Tax / Location authorities by field
WHO_MAY_READ_IT = Authorized Inventory readers and existing scoped projections
WHO_MAY_MUTATE_IT = Canonical Supplier Receive V2 for intake; existing dedicated Asset metadata/revision or lifecycle routes only where allowed
STABLE_ASSET_ID = assets.id
BACKWARD_COMPATIBILITY = REQUIRED
DUPLICATE_GENERAL_METADATA_AUTHORITY = NO
DUPLICATE_PROFILE_AUTHORITY = NO
CIRCULAR_DEPENDENCY = NO
FUTURE_INTEGRATION_REQUIRES_CORE_REDESIGN = NO
```

## Downstream dependency map

| Consumer | Common fields consumed | Authority boundary |
|---|---|---|
| Supplier Receive V2 | supplier, location, purchase date, tax treatment, notes, description and profile extension | Receives once; server validates company/branch/master data and writes canonical source rows |
| Asset list/search | description, brand/model, supplier, location, purchase date, barcode, RFID, profile, status, branch | Read-only Asset projection; Product quantity is not a physical source |
| Asset Detail | all readable Asset/common projections plus origin/cost/valuation/audit | Read-only projection plus existing dedicated actions |
| Asset Revision | only existing general metadata allowlist | Barcode/RFID/physical/financial/scope/status fields remain rejected by dedicated-authority guard |
| Barcode/tag | Asset ID, profile/item code, Barcode and profile-specific tag values | Barcode/tag rendering consumes stored Asset identity; it does not store a duplicate |
| RFID | Asset ID and RFID history | Dedicated RFID assignment service |
| POS | Asset ID, Barcode, status, branch/location, sale price | Asset-only final-profile search and canonical sale authority |
| Transfers/workshop/returns/count | Asset ID, branch/location/status, Barcode/RFID | Lifecycle/movement/count authorities; no common-field write path |
| Invoices/CGP/accounting | source document links, tax/financial snapshots, employee/audit context | Dedicated financial/source authority |
| CRM/reports | read projections and source links | No second business owner |

## Unresolved/explicitly excluded

`sku` and a universal `image` field do not have a proven canonical authority in the accepted source. They remain `MISSING/NOT_PROVEN` and are not synthesized from Barcode, item code, attachments, or a new column. That is an intentional safety boundary, not an omitted implementation.
