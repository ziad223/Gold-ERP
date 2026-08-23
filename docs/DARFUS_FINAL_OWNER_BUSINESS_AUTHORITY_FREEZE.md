# DARFUS ERP — FINAL OWNER BUSINESS AUTHORITY FREEZE

**Control ID:** `DARFUS-FINAL-OWNER-BUSINESS-AUTHORITY-FREEZE-01`  
**Phase:** `01`  
**Mode:** Documentation-only authority freeze  
**Official DB:** `darfus_erp` — read-only

## Purpose and Authority Precedence

This file freezes Owner business authority before further implementation. It is not permission to change code, database, configuration, or runtime data.

Precedence:

1. Explicit Owner final decisions in this freeze.
2. Raw business references.
3. Frozen DARFUS architecture.
4. Current source implementation.
5. Runtime defaults.
6. Mockups and illustrative examples.

Mockups do not override code tables or explicit Owner decisions.

## Physical Inventory and Final Profiles

- `ONE_PHYSICAL_PIECE = ONE_ASSET`.
- `Asset` is the physical inventory authority.
- `Product.quantity` is not serialized physical-stock authority.
- Each physical piece has an independent Asset and lifecycle.
- Each Asset may have at most one active Barcode.
- A newly created or `PENDING_INTEGRATION` Asset may temporarily have no active Barcode until canonical barcode generation or assignment is completed.
- `MAX_ACTIVE_BARCODE_PER_ASSET = 1`.
- `PENDING_ASSET_MAY_HAVE_ZERO_ACTIVE_BARCODE = YES`.
- `EVERY_ASSET_ALWAYS_HAS_ACTIVE_BARCODE = NO`.
- Final profiles: `GOLD_BY_WEIGHT_JEWELLERY`, `GOLD_BAR_24K`, `GOLD_BY_PIECE`, `DIAMOND_JEWELLERY`, `LOOSE_DIAMOND`, `GEMSTONE_JEWELLERY`, `LOOSE_GEMSTONE`, `PEARL_JEWELLERY`, `LOOSE_PEARL`.
- Jewellery and Loose profiles remain separate. Diamond, Gem Stone, and Pearl implementation remain paused.

## Master Data Authority

- `PRODUCTION_MASTER_DATA_SOURCE = DATABASE`.
- Reference lists are canonical initial master-data candidates, not permanent frontend hardcoded authority.
- Master data may be added, edited, or disabled according to permission and type.
- Used historical values must not be deleted: `DELETE_USED_MASTER_VALUE = NO`.
- Conflicting lists are reconciled by canonical union and source traceability.
- Confirmed union values include `Gold Rosary`, `Custom Design`, and `Multi-colour`.
- No production value is invented or created by this file.

## GBW and GBP Authority

GBW formulas are preserved:

```text
NET = GROSS - STONE
PURE = NET × KARAT / 24
TOTAL_MAKING_COST = MAKING_PER_GRAM × NET
```

GBW, Gold Center, and financial logic are not changed.

GBP authority:

- Purchase rate uses selected global karat rate.
- Historical rate snapshots are immutable.
- Karats: `9, 10, 12, 14, 18, 21, 22, 24`.
- Retail is fail-closed unless configured.
- `Condition` is a technical platform field: `NEW` or `USED`.
- Condition is separate from Operational Status.

## Supplier and Payment Authority

For `SUPPLIER_PURCHASE`:

- Supplier is required and must already exist in Supplier Master.
- No fake Supplier and no transaction-time silent Supplier creation.
- Supplier Payable follows current Accounting authority.

An approved independent non-supplier workflow may allow null Supplier. No such workflow is invented here; if absent in source, it is a future controlled-workflow gap.

Approved financial flow:

```text
Purchase Total → Supplier Payable → Payment(s) → Remaining Balance → Supplier Profile
```

Cash, Credit, Partial payment, payment history, and outstanding balance are supported capabilities. Balance is derived:

`SUPPLIER_BALANCE = DERIVED_FROM_AUTHORITATIVE_PURCHASES_AND_PAYMENTS`

`Supplier.due` or another manually mutable value is not the authority. Equivalent existing source payment states may be retained.

## VAT and Tax Authority

- `VAT_ENGINE = SERVER_AUTHORITATIVE`.
- `VAT_RATE_HARDCODED = NO`.
- `VAT_RATE_SOURCE = SETTINGS`.
- Current 5% fallback is `RUNTIME_FALLBACK_ONLY`, not Production authority.
- VAT amount is server-calculated.
- Manual transaction VAT amount is prohibited.
- Production Tax Settings must support VAT registration, Company TRN, Default Tax Treatment, and Standard VAT Rate without invented values.

Approved treatments:

`STANDARD_VAT; ZERO_RATED; REVERSE_CHARGE; EXEMPT; OUT_OF_SCOPE`

Treatments remain distinct even when VAT amount is zero. Standard VAT uses approved Settings rate and server calculation. Zero Rated stores classification with zero rate/amount. Reverse Charge stores its classification and uses its approved accounting path; it is not merely “no VAT”. Historical transactions preserve Tax Treatment, VAT Rate, VAT Amount, and Tax Base/provenance snapshots. Old transactions are not recalculated after Settings changes. Tax changes are permission-controlled and audited.

## Location Authority

- `LOCATION_AUTHORITY = DB_MASTER_DATA`.
- `LOCATION_SCOPE = BRANCH_AWARE`.
- `TRANSACTION_LOCATION_FREE_TEXT = NO`.
- Receive selects an existing canonical Location.
- Add Location is a permission-controlled canonical master-data flow.
- An approved default Branch Location is supported conceptually, but no Location or name is invented here.

## Barcode Authority

Inventory codes:

| Profile | Code |
|---|---|
| Gold By Weight | `GW` |
| Gold By Piece | `GP` |
| Diamond | `DD` |
| Gem Stone | `GS` |
| Pearl | `PL` |

Item codes:

| Item | Code | Item | Code |
|---|---|---|---|
| Anklet | `ANK` | Bangle | `BGL` |
| Bar | `BAR` | Bracelet | `BRC` |
| Brooch | `BRH` | Chain | `CHN` |
| Choker | `CHK` | Coin | `CON` |
| Crown | `CRW` | Earrings | `ERG` |
| Full Set | `FST` | Loose Stone | `LOS` |
| Necklace | `NCK` | Pendant | `PND` |
| Pendant Chain | `PCH` | Ring | `RNG` |
| Twins Ring | `TRN` | Wedding Band | `WRN` |
| Gold Rosary | `ROS` | Custom Design | `CSD` |

For profiles with Karat:

```text
BARCODE = INVENTORY_CODE + ITEM_CODE + KT + SERIAL
KT = 2 numeric digits
SERIAL = 6 numeric digits
```

Loose profile decision:

```text
LOOSE_PROFILE_KT_SEGMENT = 00
DDLOS00000001
GSLOS00000001
PLLOS00000001
```

Code table is canonical. Mockup inconsistencies `ERR`/`NLC` are presentation inconsistencies; canonical values remain Earrings=`ERG`, Necklace=`NCK`.

## Barcode Lifecycle

Reprint: same Asset, same Barcode, no new identity, audited.  
Revision: same Asset and Barcode with revision history for repair, weight, stone, or size changes.  
Replacement: old Barcode `RETIRED`, new Barcode `ACTIVE`, never reuse old value, reason/permission/audit/history required.  
Customer Return/Exchange of the same piece preserves Asset, identity, Barcode, and lifecycle unless a genuine Replacement occurred.

Item Type and Karat are identity-sensitive after Barcode creation and are not ordinary editable fields.

## Status, Condition, and Tag

Operational Status:

```text
PENDING_INTEGRATION, AVAILABLE, RESERVED, PENDING_TRANSFER, WORKSHOP,
SOLD, RETURNED, MISSING, MELTED, REVERSAL_PENDING, REVERSED
```

Condition: `NEW`, `USED`. `USED` is not a Status.  
Tag Status: `PENDING`, `PRINTED`.  
Exchange, Repair, Transfer, Return, Reprint, and Replacement are events/audit records, not permanent Status values by default.

## Pearl Quantity Rule

Loose Pearl `Quantity > 1` is Batch Entry Convenience only:

```text
Quantity = N → N physical Assets
```

Shared batch/acquisition lineage and specifications are allowed; physical pieces never collapse into Product quantity authority. Pearl implementation remains paused.

## Company, Branch, Accounting, Idempotency, POS, and Intake

- `SINGLE_COMPANY_MULTI_BRANCH`; Company/Branch context is server-authoritative and fail-closed.
- Preserve Posting Logic, balanced journals, Supplier Payable accounting, and approved tax mappings.
- Preserve idempotency replay protection, conflict protection, and canonical records.
- `POS_BARCODE_LOOKUP = ASSET_AUTHORITY`; Product quantity is not physical fallback.
- Unified workflow: `Inventory → Add / Receive Inventory → Unified Profile Chooser`.
- Supplier shortcut uses the same workflow with validated supplier preselection.
- No duplicate Sidebar entry or parallel receive workflow.

## Owner-Approved Decisions

| ID | Decision |
|---|---|
| OA-001 | Gold Rosary = `ROS` |
| OA-002 | Custom Design = `CSD` |
| OA-003 | Loose Diamond/Gem/Pearl KT = `00` |
| OA-004 | Code Table overrides mockups; `ERG`/`NCK` canonical |
| OA-005 | Supplier required for Supplier Purchase |
| OA-006 | Cash/Credit/Partial settlement supported |
| OA-007 | Supplier balance derived from purchases/payments |
| OA-008 | VAT rate configurable from Settings, not hardcoded |
| OA-009 | VAT amount server-calculated |
| OA-010 | Manual transaction VAT amount prohibited |
| OA-011 | Five approved Tax Treatments are distinct |
| OA-012 | Historical Tax snapshots preserved; no old recalculation |
| OA-013 | Location is canonical DB Master Data |
| OA-014 | Add Location is permission-controlled |
| OA-015 | No uncontrolled transaction Location free text |
| OA-016 | Status is separate from Condition and Tag Status |
| OA-017 | Condition = `NEW` / `USED` |
| OA-018 | Loose Pearl quantity preserves one physical piece = one Asset |
| OA-019 | Reprint, Revision, Replacement are distinct |

## Known Implementation Gaps

Document only; do not fix in Phase 01:

- Official DB master data is empty after reset.
- Barcode codes/sequences are empty.
- General Settings are empty; VAT fallback is runtime-only.
- Suppliers and Locations are empty.
- Pearl size master data is empty.
- `ROS`/`CSD` are not provisioned.
- Current Revision model is incomplete against the frozen lifecycle authority.
- Loose `KT=00` is not runtime-proven.
- Special Tax Treatment accounting is not fully runtime-proven.

## Production Values Required Later

Do not invent Real Supplier, Supplier TRN, Company TRN, VAT registration state, Production VAT Rate, Default Production Tax Treatment, Location name, payment terms, due days, minimum making, or pricing thresholds.

`PRODUCTION_CONFIGURATION_INPUT_REQUIRED_LATER = YES`.

## Forbidden Scope

No business or financial logic, Inventory authority, Supplier Accounting, Gold Center, Permissions, Company/Branch, Idempotency, or Barcode service changes. No migration, seed, provisioning, backup, Supplier/Location/VAT/Barcode inserts, receive, purchase order, Asset, payable, journal, build, deploy, cleanup, reset, Diamond, Gem Stone, or Pearl implementation. Do not modify `next-env.d.ts`.

## Next Phase Preconditions

Owner review is required. Before any separately approved mutation: create a fresh verified backup, confirm exact `darfus_erp` target and baseline, approve write scope, supply production configuration, and approve runtime proof. Do not start Phase 02 automatically.

## Final Tokens

```text
CURRENT_CONTROL = DARFUS-FINAL-AUTHORITY-BARCODE-CARDINALITY-CORRECTION-01A
PHASE = 01A
PHASE_NAME = FINAL_AUTHORITY_BARCODE_CARDINALITY_CORRECTION
FINAL_AUTHORITY_FILE = DARFUS_FINAL_OWNER_BUSINESS_AUTHORITY_FREEZE.md
OWNER_DECISIONS_LOCKED = YES
MASTER_DATA_AUTHORITY_LOCKED = YES
SUPPLIER_AUTHORITY_LOCKED = YES
SUPPLIER_PAYMENT_AUTHORITY_LOCKED = YES
VAT_TAX_AUTHORITY_LOCKED = YES
LOCATION_AUTHORITY_LOCKED = YES
BARCODE_AUTHORITY_LOCKED = YES
STATUS_CONDITION_AUTHORITY_LOCKED = YES
ASSET_AUTHORITY_LOCKED = YES
ROS_CODE = ROS
CSD_CODE = CSD
LOOSE_PROFILE_KT_SEGMENT = 00
VAT_RATE_HARDCODED = NO
VAT_RATE_SOURCE = SETTINGS
VAT_AMOUNT_SERVER_CALCULATED = YES
MANUAL_TRANSACTION_VAT_AMOUNT = NO
TAX_TREATMENTS = STANDARD_VAT;ZERO_RATED;REVERSE_CHARGE;EXEMPT;OUT_OF_SCOPE
LOCATION_AUTHORITY = DB_MASTER_DATA
TRANSACTION_LOCATION_FREE_TEXT = NO
ADD_LOCATION_PERMISSION_CONTROLLED = YES
SUPPLIER_PURCHASE_REQUIRES_SUPPLIER = YES
CASH_PURCHASE_SUPPORTED = YES
CREDIT_PURCHASE_SUPPORTED = YES
PARTIAL_PAYMENT_SUPPORTED = YES
SUPPLIER_BALANCE_DERIVED = YES
ONE_PHYSICAL_PIECE_ONE_ASSET = YES
MAX_ACTIVE_BARCODE_PER_ASSET = 1
PENDING_ASSET_MAY_HAVE_ZERO_ACTIVE_BARCODE = YES
EVERY_ASSET_ALWAYS_HAS_ACTIVE_BARCODE = NO
BARCODE_REPRINT_AUTHORITY_CHANGED = NO
BARCODE_REVISION_AUTHORITY_CHANGED = NO
BARCODE_REPLACEMENT_AUTHORITY_CHANGED = NO
OTHER_OWNER_DECISIONS_CHANGED = NO
INTERNAL_AUTHORITY_CONTRADICTIONS = 0
PRODUCT_QUANTITY_PHYSICAL_AUTHORITY = NO
SOURCE_BUSINESS_CODE_CHANGED = NO
OFFICIAL_DB_BUSINESS_WRITES = 0
PROVISIONING_PERFORMED = NO
BACKUP_CREATED = NO_NOT_REQUIRED_PHASE_01
MIGRATIONS_CREATED = 0
MIGRATIONS_APPLIED = 0
BUILD_RUN = NO
DIAMOND_IMPLEMENTATION = NOT_STARTED
GEM_IMPLEMENTATION = NOT_STARTED
PEARL_IMPLEMENTATION = NOT_STARTED
PHASE_01_FINAL_CLOSED = YES
GATE = PASS_PHASE_01A_BARCODE_CARDINALITY_CORRECTION
NEXT_RECOMMENDED_STEP = PHASE_02_FULL_VERIFIED_OFFICIAL_DB_BACKUP
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```
