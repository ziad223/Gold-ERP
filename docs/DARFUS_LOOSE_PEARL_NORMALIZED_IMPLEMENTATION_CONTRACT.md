# DARFUS ERP — Loose Pearl Normalized Implementation Contract

**Control:** `DARFUS-LOOSE-PEARL-AUTHORITY-RESOLUTION-AND-CONTRACT-FREEZE`  
**Mode:** `AUTHORITY_AND_CONTRACT_FREEZE_ONLY`  
**Status:** Frozen contract; no implementation authorized by this document.

## 1. Authority Resolution

### LP-OD-001 — RESOLVED

`ONE_PHYSICAL_LOOSE_PEARL = ONE_ASSET` and `ONE_ACTIVE_BARCODE_PER_ASSET = YES`.

The client’s bulk grouping wording is normalized as UI entry convenience only. A future bulk entry may accept `Quantity = N` for identical pearls, but persistence must produce N physical Assets, N primary identities, and N active unique Barcodes. No `assets.quantity` column is required by this contract, and Product/quantity is never physical inventory authority.

Combined bulk weight and combined bulk cost must not be silently divided or copied. Bulk identical entry remains deferred until explicit allocation rules are safe. The minimum safe implementation is one physical Pearl entry → one Asset.

Because each Pearl is an independent Asset, partial sale/transfer/return/manufacturing consumption inside one Asset is not needed. Future bulk operations select multiple Assets.

### LP-OD-002 — RESOLVED

`PURCHASED_LOOSE_PEARL_REQUIRES_CANONICAL_SUPPLIER = YES`.

For purchased stock, `Supplier.id` is required, company-scoped, valid, and active under current rules. Supplier Receive V2 remains the only canonical purchased-stock receive path. Unknown Supplier, Default Supplier, Fake Supplier, and free-text substitution are forbidden.

The client’s optional Supplier wording is normalized to future non-purchase sources only. Opening Balance, Owner-provided stock, Inventory Adjustment, Manufacturing Output, or another acquisition source are deferred and not authorized by this contract.

`TRUE_OWNER_DECISIONS_REMAINING = 0`.

## 2. Frozen Loose Pearl Core Contract

| Concern | Frozen authority |
|---|---|
| Profile | `LOOSE_PEARL` |
| Inventory | Standalone Pearl inventory |
| Gold / Karat / Gold Weight / Gold Cost / Making | Not applicable |
| Physical identity | One physical Pearl = one Asset |
| Quantity | UI convenience only; never physical authority |
| Purchase source | Supplier Receive V2 |
| Supplier | Required for Purchase |
| Historical cost | Pre-tax purchase cost for that physical Pearl |
| Current value | Separate approved audited valuation path |
| Selling price | Explicit `Asset.price` |
| Barcode | `PL` / `LOS` / `00` / six-digit serial = `PLLOS00XXXXXX` |
| RFID | Optional supplementary unique identity |
| Branch | Server authoritative and fail-closed |
| Location | Active branch-scoped DB Master Data; no free text |
| Status | V2 operational status transition authority |
| Master Data | DB-backed; internal IDs never displayed |
| Tax | Existing dynamic UAE Tax Engine; apply once |
| Accounting | Pre-tax inventory debit + VAT debit + inclusive AP credit; balanced |
| Idempotency | Existing canonical `purchase.receive` hash/key contract |

## 3. Technical Fields

Future profile scope includes Pearl Weight, Pearl Size, Type, Color, Overtone, Orient, Shape, Luster, Surface Quality, Nacre Quality, Origin, Certificate Authority/Number/Images, Remarks, Pearl Cost, Images, and Purchase Date. Quantity authority for one physical Pearl is always 1 Asset.

Pearl Size is the canonical 39-value master from 1.0 to 20.0 mm by 0.5; customer display is `<value> mm`; internal master IDs remain hidden. All categorical Pearl fields use DB Master Data. Permissioned Add/Edit/Disable is allowed; destructive deletion of historically used values is forbidden. Certificate Authority drift is reconciled without automatic deletion.

## 4. Financial Contract

Historical purchase cost is immutable evidence for the physical Asset and must not change when current market value changes. The Tax Engine resolves company policy and legal treatment, creates an immutable tax snapshot, and posts canonical accounting. No rate is hardcoded. Standard taxable purchase conceptually posts:

```text
Dr Inventory / Asset = historical pre-tax Pearl cost
Dr Recoverable VAT   = purchase VAT
Cr Accounts Payable  = total purchase value
Cash delta at Receive = 0
Debit = Credit
```

Invalid derived pricing policy must never turn a valid positive `Asset.price` into zero or unavailable. If no valid price exists, fail closed.

## 5. Canonical UI and Receive

The only future creation workflow is:

```text
Inventory → + Add / Receive Inventory → Loose Pearl → canonical Supplier Receive V2
```

There must be one dedicated Loose Pearl route/form. Pearl Jewellery must not be reused by hiding Gold fields. No legacy or parallel Receive workflow is authorized.

The future builder must bind Pearl master IDs server-side, map one physical Pearl to one `perPiece` Asset, retain exact request evidence, preserve company/branch/location context, and use the canonical receive contract.

## 6. Barcode / RFID / Lineage

Loose Pearl barcode generation must use `PL`, `LOS`, `00`, and a six-digit unique serial with no first-compatible fallback. One active Barcode exists per Asset; barcode is primary. RFID remains optional and supplementary.

Future manufacturing creates lineage by Asset ID:

```text
source Loose Pearl Asset → lineage link → target Jewellery Asset/component
```

Workshop/manufacturing implementation is deferred.

## 7. Failure and Retry Governance — LL-018

`FAILED_RECEIVE != AUTOMATIC_RETRY` and `FAILED_RECEIVE != PERMANENT_NO_RETRY`.

On any failure or ambiguous result: stop, preserve Browser Network/backend request ID/idempotency/DB evidence, prove the first broken boundary and DB delta, classify the root cause, implement only the minimum safe fix after approval, run focused/regression/typecheck/build checks as applicable, perform impact analysis, obtain Owner review, then authorize at most one controlled retry.

No second Confirm is automatic. If the same cause fails again, stop and block a third attempt. A successful transaction with a UI/readback failure must never be retried.

Required future exact artifacts are the original request, canonical business hash input, rollback request artifact, and idempotency key. After a safe authenticated post-success channel is proven: exact same key + exact payload must produce a replay with zero business delta; same key + changed payload must produce 409 with zero business delta.

## 8. Deferred Scope

- Bulk total weight/cost allocation.
- Group Asset model.
- Non-purchase acquisition flows.
- Workshop/manufacturing implementation.
- Partial quantity/split operations.
- Transfer redesign.
- Inventory count redesign.
- POS checkout redesign.
- Accounting redesign.

## 9. Future Acceptance Gates

Before any official Loose Pearl Receive: focused tests, relevant regression, typecheck/build, disposable-clone Receive, rollback delta 0, exact request/hash/rollback evidence, company/branch/auth/location/supplier proof, fresh DB baseline/backup, and safe authenticated post-success channel where replay is required must all pass. Only a new explicit Owner authorization may permit one official Confirm.

## 10. Frozen Tokens

```text
LP_OD_001 = RESOLVED_ONE_PHYSICAL_PEARL_ONE_ASSET
LP_OD_002 = RESOLVED_PURCHASE_REQUIRES_CANONICAL_SUPPLIER
LP_OD_001_UI_BULK_QUANTITY = ENTRY_CONVENIENCE_ONLY
LP_OD_001_PERSISTED_ASSET_QUANTITY = NOT_USED
BULK_TOTAL_WEIGHT_ALLOCATION = NO_SILENT_ALLOCATION
BULK_TOTAL_COST_ALLOCATION = NO_SILENT_ALLOCATION
FAKE_SUPPLIER_ALLOWED = NO
NON_PURCHASE_ACQUISITION_FLOW = DEFERRED_NOT_AUTHORIZED
ONE_PHYSICAL_LOOSE_PEARL = ONE_ASSET
PURCHASED_LOOSE_PEARL_SUPPLIER = REQUIRED
CANONICAL_RECEIVE = SUPPLIER_RECEIVE_V2
SELLING_PRICE_AUTHORITY = ASSET_PRICE
EXPECTED_BARCODE = PLLOS00XXXXXX
TAX_ENGINE = DYNAMIC_EXISTING_AUTHORITY
HISTORICAL_CURRENT_SEPARATION = REQUIRED
LL018 = FROZEN_CONTROLLED_RETRY_AFTER_PROVEN_FAILURE
AUTOMATIC_RETRY = NO
PERMANENT_BLANKET_RETRY_BAN = NO
RETRY_REQUIRES_ROOT_CAUSE = YES
RETRY_REQUIRES_DB_DELTA_PROOF = YES
RETRY_REQUIRES_MINIMUM_SAFE_FIX = YES
RETRY_REQUIRES_REGRESSION = YES
RETRY_REQUIRES_OWNER_AUTHORIZATION = YES
MAX_CONTROLLED_RETRY_CLICKS_PER_AUTHORIZATION = 1
SAME_CAUSE_THIRD_ATTEMPT = BLOCKED
MIGRATION_AUTHORIZED = NO
IMPLEMENTATION_EXECUTED = NO
BUSINESS_WRITES = 0
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```
