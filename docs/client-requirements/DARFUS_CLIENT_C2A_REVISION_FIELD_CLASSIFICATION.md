# DARFUS Client C2A — Revision Field Classification

This is a read-only ownership classification. It does not authorize a field, schema, or UI change.

## Classification legend

- `NO_GENERAL_REVISION`: existing dedicated owner; do not duplicate.
- `GENERAL_REVISION_CANDIDATE`: may be stored in a future typed revision change row only after C2B allowlist/permission approval.
- `DEDICATED_BARCODE_OPERATION`: barcode service/history owns it.
- `DEDICATED_RFID_OPERATION`: RFID assignment/history owns it.
- `DEDICATED_FINANCIAL_OPERATION`: purchase-cost, valuation, pricing or accounting owner applies.
- `IMMUTABLE_IDENTITY`: protected after creation unless an explicit identity decision changes the frozen authority.
- `OPERATIONAL_STATE_OWNER`: status/location/branch changes belong to transition/movement authorities, not generic revision.

## Field matrix

| Field / business concern | Current source/DB authority | Classification | Future safe rule |
|---|---|---|---|
| Asset ID | `assets.id`, all direct FKs | IMMUTABLE_IDENTITY | Never replace; every revision points to same ID |
| Item type | Asset identity guard; barcode components | IMMUTABLE_IDENTITY | No generic revision mutation |
| Inventory code | Asset/barcode identity | IMMUTABLE_IDENTITY | No generic revision mutation |
| Item code | Asset/barcode identity; C1 canonical ERG/NCK | IMMUTABLE_IDENTITY | No silent code conversion |
| Karat | Asset identity guard/barcode | IMMUTABLE_IDENTITY | No generic revision mutation |
| Barcode | `barcode-identity.service`, `asset_barcode_history` | DEDICATED_BARCODE_OPERATION | Only existing replacement service/history; optional revision link |
| Barcode revision number | Barcode identity service/history | DEDICATED_BARCODE_OPERATION | Never use as general item revision number |
| RFID | RFID routes, assignments and scan history | DEDICATED_RFID_OPERATION | Only dedicated RFID operation; optional revision link |
| Operational status | transition/event/movement services | OPERATIONAL_STATE_OWNER | Status transition remains the authority |
| Branch | server context, asset transitions/movements | OPERATIONAL_STATE_OWNER | Branch move is a transfer/transition, not a descriptive revision |
| Location | asset metadata/operational transition paths | OPERATIONAL_STATE_OWNER | Location movement remains operational authority |
| Description / name | `asset-metadata.service.js` allowlist | GENERAL_REVISION_CANDIDATE | Future allowlisted metadata revision with old/new value |
| Notes | asset metadata allowlist / audit | GENERAL_REVISION_CANDIDATE | Future revision if business history is required |
| Category | asset metadata allowlist | GENERAL_REVISION_CANDIDATE | Confirm profile-specific authority in C2B |
| Brand | asset metadata allowlist | GENERAL_REVISION_CANDIDATE | Confirm owner and audit semantics in C2B |
| Image / attachment | attachments service/table | GENERAL_REVISION_CANDIDATE | Attachment history must remain separate; no fake field diff |
| Components / stone details | component/profile detail tables | GENERAL_REVISION_CANDIDATE | Profile-specific service; revision may reference component change |
| Size / dimensions | profile/component data | GENERAL_REVISION_CANDIDATE | No generic write until field authority and validation are frozen |
| Weight | profile/detail and Asset data | DEDICATED_FINANCIAL_OPERATION | Weight changes can affect valuation/accounting; require profile/financial authority |
| Gold rate / making / cost | purchase cost revisions and valuation | DEDICATED_FINANCIAL_OPERATION | Dedicated financial snapshot and accounting rules only |
| Purchase cost | `asset_purchase_cost_revisions` | DEDICATED_FINANCIAL_OPERATION | Never overload general revision rows |
| Current valuation | `asset_current_valuations` | DEDICATED_FINANCIAL_OPERATION | Current snapshot authority remains dedicated |
| Selling price | `asset-selling-price.service.js` | DEDICATED_FINANCIAL_OPERATION | Dedicated permission/idempotency/audit path |
| Supplier/origin | `asset_origins`, PO links | DEDICATED_FINANCIAL_OPERATION | Do not rewrite historical acquisition; correction needs separate approved contract |
| Tax/VAT snapshot | PO/financial tax snapshot | DEDICATED_FINANCIAL_OPERATION | Immutable transaction snapshot; no generic revision edit |
| Certificate / certificate number | certificate tables | GENERAL_REVISION_CANDIDATE | Certificate history/attachment semantics must be explicit in C2B |
| Tag/print state | tag print events | OPERATIONAL_STATE_OWNER | Reprint remains same barcode/identity; no item revision |
| Sale/return state | POS/sale/return services | OPERATIONAL_STATE_OWNER | Preserve Asset identity and business event history |
| Audit actor/reason/time | Asset event/audit conventions | GENERAL_REVISION_CANDIDATE (header) | Mandatory on future revision header |
| Source document/event | sourceType/sourceId/idempotency conventions | GENERAL_REVISION_CANDIDATE (header) | Required provenance; no anonymous revision |

## Mandatory boundary

The user-facing term “revision” must not become a catch-all write API. A field is a general revision candidate only if its dedicated authority is not already responsible for the business effect and the later owner-approved contract defines validation, permission, audit and downstream impact. The classification intentionally leaves weight, components and profile details gated because their changes can affect financial or physical identity semantics.

