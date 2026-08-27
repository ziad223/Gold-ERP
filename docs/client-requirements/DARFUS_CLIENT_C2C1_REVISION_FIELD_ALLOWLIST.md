# DARFUS Client C2C1 — Revision Field Allowlist

Control: `DARFUS-CLIENT-C2C1-REVISION-SERVICE-API-PERMISSION-CONTRACT-01`  
Mode: `READ_ONLY_CONTRACT_FREEZE`

## Purpose and boundary

This document freezes the field contract for a future Asset Revision service. It does not authorize a route, model, permission registration, migration, or data mutation. The physical Asset remains the inventory authority. Existing dedicated services remain the authority for identity, barcode, RFID, financial, valuation, location, status, movement, transfer, workshop, and other operational changes.

## General revision allowlist (v1)

The generic revision command may record only these five fields:

| Field key | Authority type | Value shape | Meaning | Generic endpoint |
|---|---|---|---|---|
| `name` | `GENERAL_REVISION_CHANGE` | string or null when the existing field permits it | Asset display name | allowed |
| `description` | `GENERAL_REVISION_CHANGE` | string or null when the existing field permits it | Asset description | allowed |
| `category` | `GENERAL_REVISION_CHANGE` | existing category identifier or null | Asset category reference | allowed only after normal category validation |
| `brand` | `GENERAL_REVISION_CHANGE` | string or null | Brand metadata | allowed |
| `notes` | `GENERAL_REVISION_CHANGE` | string or null | Non-authoritative notes | allowed |

The service must validate the field’s existing source type and business constraints before writing. `asset_revision_changes` records the old and new values; it does not become a second current-value authority.

## Dedicated-operation denylist

The following are forbidden in a generic revision request, even if a caller has broad inventory permissions. They must remain owned by their existing dedicated authority:

| Authority | Denied field families |
|---|---|
| Immutable identity | `assetId`, `asset_id`, `itemType`, `inventoryCode`, `itemCode`, `karat`, and any identity/barcode value that changes the physical identity |
| Barcode | `barcode`, `barcodeRevision`, barcode replacement/retirement, barcode history |
| RFID | `rfid`, RFID assignment/replacement/unassignment |
| Physical and commercial facts | weight, dimensions, karat/purity, stone/component details, making, supplier, origin, acquisition cost, purchase-cost revision, sale price, tax snapshot |
| Current valuation | current gold/making/diamond values, valuation base, current VAT, valuation totals |
| Operational state | status, condition, tag status, branch, location, availability, reservation state, transfer, workshop, count, movement |
| Financial/accounting | journal, payable, payment, cash, account mapping, posting, reversal, settlement |
| Ownership and scope | company, branch, technical user, employee, operator session, revision number, timestamps, idempotency fields |
| Unknown/unowned | every field not in the five-field allowlist or not explicitly handled by an approved dedicated operation |

`purchaseCost`, `sellingPrice`, `weight`, `karat`, `supplier`, `location`, `status`, and similar values are therefore not “convenience fields” of the generic revision endpoint. A caller must use the existing dedicated operation or the request is rejected with a stable error.

## Multi-field and no-op semantics

- One command may contain multiple changes, so long as every field is in the allowlist and each key occurs once.
- An empty `changes` array is invalid.
- Duplicate field keys in one request are invalid; the service must not resolve conflicting values by order.
- The server reads the current Asset values in the same transaction, records those values as `oldValue`, and compares the canonical current value with the requested new value.
- A request with no effective change is rejected with `REVISION_NO_EFFECTIVE_CHANGE` and creates no revision, event, audit row, or successful idempotency result.
- Partial application is forbidden: validation of every field precedes any persistent insert, and the header, change rows, event, audit entry, and idempotency success are one transaction.

## Canonical value comparison

Canonical comparison is structural, not a UI-string comparison:

1. Object keys are sorted recursively.
2. Array order is preserved.
3. `null`, boolean, string, number, decimal-string, identifier, datetime, and structured values remain distinct types.
4. No implicit case folding, whitespace trimming, number coercion, or array sorting is performed unless the field’s existing validator explicitly defines that normalization.
5. The canonical form is used for no-op detection, `oldValue`/`newValue` recording, and the request hash. The stored JSONB values remain the auditable snapshots.

## Field authority map

| Concern | Current authority | C2C1 rule |
|---|---|---|
| Current Asset metadata | `asset-metadata.service.js` and Asset row | Generic revision may cover only the five metadata keys after equivalent validation |
| Asset identity | Asset identity guards and `barcode-identity.service.js` | Never generic revision |
| Barcode/RFID | barcode/RFID dedicated services and Asset events | Never generic revision |
| Purchase cost | `asset_purchase_cost_revisions` / purchase-cost service | Never generic revision |
| Current valuation | `asset_current_valuations` / valuation mapper | Never generic revision |
| Status/branch/location/movement | inventory runtime and movement/event authorities | Never generic revision |
| Revision history | C2B `asset_revisions` + `asset_revision_changes` | Canonical historical record only |
| Timeline notification | existing `asset_events` | One `ASSET_REVISION_RECORDED` event linked to the revision |
| Actor/security audit | existing append-only `audit_logs` | One audit entry linked to the revision |

## Provenance requirements per change

Each persisted change must carry `fieldKey`, `oldValue`, `newValue`, `valueType`, `authorityType`, and (only when a dedicated operation is involved) `dedicatedOperationReference`. For the v1 generic endpoint, `authorityType` is server-set to `GENERAL_REVISION_CHANGE`; the client cannot upgrade a field by sending another authority type.

## C2C2 implementation boundary

C2C2 may implement the generic five-field command and read projections. It may not expand this allowlist, remove the denylist, or write dedicated authorities through a generic path without a new Owner decision and a new contract review. No source or database change is made by C2C1.

