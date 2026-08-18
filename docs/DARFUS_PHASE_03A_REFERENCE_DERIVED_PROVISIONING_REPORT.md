# DARFUS ERP — PHASE 03A PROVISIONING REPORT

**Control:** `DARFUS-PHASE-03A-REFERENCE-DERIVED-MASTER-DATA-BARCODE-PROVISIONING`  
**Official DB:** `darfus_erp`  
**Mode:** Controlled reference-derived provisioning

## 1. Executive Summary

Phase 03A executed only the approved reference-derived provisioning scope on the official database.

Committed rows:

- 502 supported Profile Master Data rows.
- 39 Pearl Size rows.
- 5 canonical Barcode Inventory Code rows.
- 20 canonical Barcode Item Code rows.
- 2 audit records for the provisioning and the verified Pearl Size correction.

Not written:

- Suppliers, Locations, Settings, Tax data, Assets, Purchase Orders, Movements, Payments, Journals, Idempotency records, and Barcode Sequences.

The Phase 03A Gate is blocked because unresolved authority/schema gaps remain. No value was invented and no business logic was changed.

## 2. Preconditions and Backup Integrity

```text
PHASE_01_FINAL_CLOSED = YES
GATE_PHASE_01A = PASS_PHASE_01A_BARCODE_CARDINALITY_CORRECTION
PHASE_02_BACKUP = PASS
BACKUP_FORMAT = POSTGRES_CUSTOM
BACKUP_SHA256_MATCH = YES
```

Backup:

```text
darfus_erp_FULL_20260818_000425.dump
SHA256 = 7BDC254D6D9512A32D13B0909CCFDDD700907DBB380332974AF4117BB31860E3
PG_RESTORE_LIST_READABLE = YES
```

## 3. Official DB Identity

```text
current_database() = darfus_erp
container = darfus-postgres
PostgreSQL = 16.15
```

## 4. Schema and Source Authority Inspection

Verified:

- `profile_master_data` is company-scoped with unique `(company_id, category_key, canonical_value)`.
- `pearl_size_master_data` is company-scoped with unique `(company_id, value, unit)`.
- Barcode inventory/item tables are company-scoped and uniquely keyed by code.
- `barcode_sequences` is scoped by `(company_id, inventory_code, item_code, karat_code)`.
- Existing barcode allocation creates sequence rows lazily; no bootstrap row was required.
- Existing `provision-master-data-01d.js` rejects the official DB and also contains provisional `WT`, so it was not used.
- Existing source does not provide per-loose-profile `KT=00` configuration.

## 5. Baseline Before

| Table | Before |
|---|---:|
| profile_master_data | 0 |
| pearl_size_master_data | 0 |
| barcode_inventory_codes | 0 |
| barcode_item_codes | 0 |
| barcode_sequences | 0 |
| settings | 0 |
| suppliers | 0 |
| inventory_locations | 0 |
| purchase_orders | 0 |
| assets | 0 |
| inventory_asset_movements | 0 |
| payments | 0 |
| journal_entries | 0 |
| journal_lines | 0 |
| idempotency_requests | 0 |
| audit_logs | 15 |

## 6. Provisioning Dry Run

Dry-run executed against `darfus_erp` before the write transaction.

| Scope | Planned | Action |
|---|---:|---|
| Supported Profile Master Data | 502 | INSERT/KEEP transactionally |
| Pearl Sizes | 39 | INSERT/KEEP transactionally |
| Barcode Inventory Codes | 5 | INSERT/KEEP transactionally |
| Barcode Item Codes | 20 | INSERT/KEEP transactionally |
| Barcode Sequences | 0 | Lazy source allocation; no bootstrap |
| Certificate Authority | 0 | BLOCKED by `Gubelin` vs `Gübelin` conflict |

## 7. Barcode Inventory Code Provisioning

Provisioned and verified:

| Profile | Code | Status |
|---|---|---|
| Gold By Weight | GW | Present, active, client-approved |
| Gold By Piece | GP | Present, active, client-approved |
| Diamond | DD | Present, active, client-approved |
| Gem Stone | GS | Present, active, client-approved |
| Pearl | PL | Present, active, client-approved |

No `WT` row was created.

## 8. Barcode Item Code Provisioning

All 20 canonical mappings are present, active, and client-approved:

```text
ANK BGL BAR BRC BRH CHN CHK CON CRW ERG
FST LOS NCK PND PCH RNG TRN WRN ROS CSD
```

Verified:

```text
ROS = present
CSD = present
ERG = present
NCK = present
ERR = absent
NLC = absent
```

All item rows allow only `GW, GP, DD, GS, PL`.

## 9. Loose KT=00 Provisioning/Support Status

The authority is retained:

```text
LOOSE_PROFILE_KT_SEGMENT = 00
```

No fake Barcode, Asset, or Sequence was generated.

Implementation gap: the current Barcode Inventory Code schema stores `requires_karat` at inventory-code level, not at Loose Profile subtype level. It cannot safely express `KT=00` for Loose Diamond/Gem/Pearl while preserving Karat requirements for Jewellery under the same inventory code. No schema or business-logic change was made.

## 10. Profile Master Data Provisioning

Provisioned categories and counts:

| Category | Count |
|---|---:|
| GOLD_ITEM_DESCRIPTION | 19 |
| GOLD_COLOR | 4 |
| DIAMOND_TYPE | 3 |
| DIAMOND_TREATMENT | 9 |
| DIAMOND_COLOR | 30 |
| DIAMOND_CLARITY | 11 |
| DIAMOND_CUT | 5 |
| DIAMOND_SHAPE | 29 |
| DIAMOND_ORIGIN | 15 |
| GEMSTONE_NAME | 67 |
| GEMSTONE_TYPE | 6 |
| GEMSTONE_SHAPE | 19 |
| GEMSTONE_COLOR | 45 |
| GEMSTONE_TONE | 14 |
| GEMSTONE_TONE_LEVEL | 9 |
| GEMSTONE_SATURATION | 10 |
| GEMSTONE_OPTICAL_EFFECT | 11 |
| GEMSTONE_ORIGIN | 25 |
| PEARL_TYPE | 10 |
| PEARL_COLOR | 17 |
| PEARL_OVERTONE | 19 |
| PEARL_ORIENT | 6 |
| PEARL_SHAPE | 10 |
| PEARL_LUSTER | 26 |
| PEARL_SURFACE_QUALITY | 18 |
| PEARL_NACRE_QUALITY | 27 |
| PEARL_ORIGIN | 20 |
| PEARL_ITEM_DESCRIPTION | 18 |

Gold values include `Gold Rosary`, `Custom Design`, and `Multi-colour` according to Final Authority.

## 11. Pearl Size Provisioning

```text
Range = 1.0 mm to 20.0 mm
Step = 0.5 mm
Expected = 39
Actual = 39
Distinct = 39
Missing expected values = 0
Outside-range/step values = 0
```

During verification, an execution counter error initially produced `0.5–19.5`. The newly created, unused `0.5` row was corrected transactionally to canonical `20.0` after proving zero Asset references. The correction was audited. No deletion or cleanup was performed.

## 12. Barcode Coverage Matrix

| Canonical Description Group | Mapping | Status |
|---|---|---|
| Gold core descriptions | Shared approved codes | Covered |
| Gold Rosary | ROS | Covered |
| Custom Design | CSD | Covered |
| Diamond jewellery descriptions | Shared codes including RNG/ERG/NCK | Covered |
| Loose Diamond | LOS | Covered |
| Gem Stone jewellery descriptions | Shared codes | Covered |
| Loose Gemstone | LOS | Covered |
| Pearl jewellery descriptions | Shared codes | Covered |
| Loose Pearl | LOS | Covered |

No unresolved barcode item-code mapping remains in the provisioned canonical table.

## 13. Master Data Coverage Matrix

| Profile | Supported reference categories | Provisioned | Missing / blocked |
|---|---|---:|---|
| GBW | Gold descriptions, colors, karat source constants | Yes | Karat has no DB master table |
| GBP | Gold descriptions, colors, karat source constants | Yes | Per-loose KT policy not applicable |
| Diamond Jewellery | Type, treatment, color, clarity, cut, shape, origin | Yes | Tone, tone levels, saturation, position, setting, certificate conflict |
| Loose Diamond | Same supported Diamond categories | Yes | Same schema gaps and certificate conflict |
| Gem Jewellery | Name, type, shape, color, tone, levels, saturation, optical effect, origin | Yes | Treatment values/position/setting, certificate conflict |
| Loose Gemstone | Same supported Gem categories | Yes | Same schema gaps and certificate conflict |
| Pearl Jewellery | Pearl registries and item descriptions | Yes | Certificate conflict |
| Loose Pearl | Pearl registries, item descriptions, sizes | Yes | Certificate conflict |

## 14. Baseline After

| Table | After |
|---|---:|
| profile_master_data | 502 |
| pearl_size_master_data | 39 |
| barcode_inventory_codes | 5 |
| barcode_item_codes | 20 |
| barcode_sequences | 0 |
| settings | 0 |
| suppliers | 0 |
| inventory_locations | 0 |
| purchase_orders | 0 |
| assets | 0 |
| inventory_asset_movements | 0 |
| payments | 0 |
| journal_entries | 0 |
| journal_lines | 0 |
| idempotency_requests | 0 |
| audit_logs | 17 |

## 15. Before/After Reconciliation

Allowed changes:

- `profile_master_data`: 0 → 502.
- `pearl_size_master_data`: 0 → 39.
- `barcode_inventory_codes`: 0 → 5.
- `barcode_item_codes`: 0 → 20.
- `barcode_sequences`: unchanged at 0.
- `audit_logs`: 15 → 17, both records attributable to this Control.

All forbidden business tables remained unchanged at zero.

## 16. Unauthorized Table Change Check

```text
SUPPLIERS_WRITTEN = 0
LOCATIONS_WRITTEN = 0
TAX_SETTINGS_WRITTEN = 0
PURCHASE_ORDERS_WRITTEN = 0
ASSETS_WRITTEN = 0
MOVEMENTS_WRITTEN = 0
PAYMENTS_WRITTEN = 0
JOURNALS_WRITTEN = 0
IDEMPOTENCY_BUSINESS_RECORDS_WRITTEN = 0
```

## 17. Source/Git Safety Proof

```text
SOURCE_BUSINESS_CODE_CHANGED = NO
MIGRATIONS_CREATED = 0
MIGRATIONS_APPLIED = 0
BUILD_RUN = NO
```

No reset, clean, restore, stash, commit, mass formatting, or `next-env.d.ts` change was performed.

## 18. Files Changed/Created

Created:

[ DARFUS_PHASE_03A_REFERENCE_DERIVED_PROVISIONING_REPORT.md ](DARFUS_PHASE_03A_REFERENCE_DERIVED_PROVISIONING_REPORT.md)

No source file was changed. Official DB rows were changed only within the allowed Phase 03A tables listed above.

## 19. Implementation Gaps and Blockers

The following prevent a complete Phase 03A PASS:

1. `CERTIFICATE_AUTHORITY` has an unresolved raw-reference conflict: `Gubelin` versus `Gübelin`. The category was not provisioned.
2. Current schema/source has no Diamond Tone, Tone Level, Saturation, Stone Position, or Stone Setting categories.
3. Current schema/source has no Gem Stone Position or Stone Setting categories.
4. Current source has no canonical Gem Stone Treatment value list.
5. Loose `KT=00` cannot be represented per subtype by the current inventory-code configuration schema.

No silent resolution or invented value was used.

## 20. Production Inputs Still Required

Still forbidden and not supplied:

- Suppliers and Supplier TRNs.
- Locations and default Branch Location.
- VAT registration, Company TRN, VAT rate, and Tax Treatment.
- Payment terms and due days.
- Pricing thresholds and minimum making.

## 21. Gate

The safe, evidence-backed result is:

```text
GATE = BLOCKED_PHASE_03A_AUTHORITY_OR_SCHEMA_CONFLICT
```

The reference-derived safe subset was provisioned, but Phase 03A must not be called fully PASS while the Certificate Authority conflict and schema gaps remain unresolved.

## 22. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PHASE-03A-REFERENCE-DERIVED-MASTER-DATA-BARCODE-PROVISIONING
PHASE = 03A
PHASE_NAME = REFERENCE_DERIVED_MASTER_DATA_AND_BARCODE_PROVISIONING
OFFICIAL_DB = darfus_erp
PHASE_01_FINAL_CLOSED = YES
PHASE_02_VERIFIED_BACKUP = YES
BACKUP_FILE = darfus_erp_FULL_20260818_000425.dump
BACKUP_SHA256_EXPECTED = 7BDC254D6D9512A32D13B0909CCFDDD700907DBB380332974AF4117BB31860E3
BACKUP_SHA256_MATCH = YES
BARCODE_INVENTORY_CODES = GW;GP;DD;GS;PL
BARCODE_ITEM_CODES = ANK;BGL;BAR;BRC;BRH;CHN;CHK;CON;CRW;ERG;FST;LOS;NCK;PND;PCH;RNG;TRN;WRN;ROS;CSD
ROS_CODE = ROS
CSD_CODE = CSD
EARRINGS_CODE = ERG
NECKLACE_CODE = NCK
LOOSE_PROFILE_KT_SEGMENT = 00
PEARL_SIZE_RANGE_MM = 1.0_TO_20.0
PEARL_SIZE_STEP_MM = 0.5
PEARL_SIZE_EXPECTED_COUNT = 39
PEARL_SIZE_ACTUAL_COUNT = 39
PROFILE_MASTER_DATA_PROVISIONED = PARTIAL_SAFE_SUBSET
BARCODE_INVENTORY_CODES_PROVISIONED = YES
BARCODE_ITEM_CODES_PROVISIONED = YES
PEARL_SIZE_MASTER_DATA_PROVISIONED = YES
BARCODE_SEQUENCE_BOOTSTRAP = NOT_REQUIRED_BY_CANONICAL_SOURCE
REFERENCE_DERIVED_VALUES_ONLY = YES
INVENTED_MASTER_VALUES = 0
BARCODE_COVERAGE_UNRESOLVED = 0
MASTER_DATA_CONFLICTS_UNRESOLVED = 1
SUPPLIER_CREATED = NO
LOCATION_CREATED = NO
VAT_SETTINGS_CHANGED = NO
PRODUCTION_TAX_VALUES_INVENTED = NO
PAYMENT_TERMS_CREATED = NO
PURCHASE_ORDER_CREATED = NO
ASSET_CREATED = NO
MOVEMENT_CREATED = NO
PAYMENT_CREATED = NO
JOURNAL_CREATED = NO
GBW_RECEIVE_EXECUTED = NO
GBP_RECEIVE_EXECUTED = NO
SOURCE_BUSINESS_CODE_CHANGED = NO
MIGRATIONS_CREATED = 0
MIGRATIONS_APPLIED = 0
BUILD_RUN = NO
DIAMOND_IMPLEMENTATION = NOT_STARTED
GEM_IMPLEMENTATION = NOT_STARTED
PEARL_IMPLEMENTATION = NOT_STARTED
OFFICIAL_DB_BUSINESS_WRITES = 0
REFERENCE_DERIVED_MASTER_DATA_WRITES = 566
AUDIT_RECORDS_CREATED_BY_THIS_CONTROL = 2
GATE = BLOCKED_PHASE_03A_AUTHORITY_OR_SCHEMA_CONFLICT
NEXT_RECOMMENDED_STEP = OWNER_RESOLVE_CERTIFICATE_AUTHORITY_AND_SCHEMA_GAPS
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```
