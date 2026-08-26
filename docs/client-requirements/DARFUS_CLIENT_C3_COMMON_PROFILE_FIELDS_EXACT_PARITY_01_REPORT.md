# DARFUS ERP — C3 Common Profile Fields Exact Parity Report

بالعربي المختصر: تم تثبيت عقد واحد للحقول المشتركة بين GBW وGBP وDiamond وGem Stone وPearl، مع إبقاء Asset وSupplier Receive V2 وLocation وTax وBarcode وRFID وAccounting كسلطاتهم الحالية. أُضيف contract قراءة فقط واختبارات مركزة. لا توجد كتابة أعمال على `darfus_erp`.

## Executive Summary

| Area | Result | Evidence |
|---|---|---|
| Read-first | COMPLETE | Profile registry, Asset, Supplier V2, shared UI, routes, tests and migrations inspected |
| Common contract | IMPLEMENTED | `inventory-common-profile-fields.service.js` |
| Common UI envelope | PASS | One `SharedReceiveSection` used by all five families |
| Profile coverage | PASS | Five top-level families mapped to nine existing internal strategies |
| Unknown/dedicated fields | PASS | Fail-closed classifier tests |
| Official DB | READ-ONLY | Direct SELECT checks; no business mutation |
| Schema/migrations | UNCHANGED | 92 source = 92 applied; no C3 migration |
| Browser AR/EN | PASS | Inventory list and all five profile forms inspected |
| C3 gate | PASS | Additive read-only foundation; no P0/P1 introduced |

## Authority and implementation decision

The client common requirement is represented by the accepted upstream C1/Phase-35C authority records available in the workspace. The original five DOCX sources are not present in the current project checkout; no field absent from those accepted records was invented. `SKU` and universal `image` remain unproven and outside the contract.

The proven gap was an implicit/duplicated common boundary, not missing database storage. The minimum safe change is therefore one server-side public metadata contract, published additively from the existing protected profile endpoint. No common-field write endpoint was created.

```text
WHO_OWNS_COMMON_PROFILE_DATA = Existing Asset / Supplier Receive V2 / Tax / Location authorities by field
WHO_MAY_READ_IT = Authorized Inventory readers and existing scoped projections
WHO_MAY_MUTATE_IT = Canonical Supplier Receive V2 for intake; existing dedicated Asset metadata/revision or lifecycle routes only where allowed
STABLE_ASSET_ID = assets.id
PUBLIC_CONTRACT = read-only commonFieldContract on GET /api/v1/inventory-v2/profiles
BACKWARD_COMPATIBILITY = REQUIRED
DUPLICATE_GENERAL_METADATA_AUTHORITY = NO
DUPLICATE_PROFILE_AUTHORITY = NO
CIRCULAR_DEPENDENCY = NO
FUTURE_INTEGRATION_REQUIRES_CORE_REDESIGN = NO
```

## Field classification

### Common fields in the public C3 contract

`description`, `brand`, `supplierId`, `locationId`, `purchaseDate`, `taxTreatment`, `notes`, `barcode`, `rfid`, `inventoryProfile`, `branchId`, `operationalStatus`, `createdBy`, `createdAt`, `auditLog`.

### Subset common fields

`model`, `modelNumber`, and `condition` remain existing subset/profile-contract fields. They were not copied into a second universal authority.

### Profile-specific fields

Gold color, karat, gross/net/stone weights, pure-gold values, making and pricing fields, certificates, component collections, loose-stone details, pearl details, gemstone setting/treatment details, and profile-specific current/historical valuation fields remain governed by their existing profile contracts.

### Dedicated authority fields

Asset ID, Barcode, RFID assignment, inventory/item code, Item Type/Profile identity, karat, weight/quantity, operational status, Branch, Location transitions, movement, purchase cost, selling price, valuation, tax snapshot, journal, and invoice identity. The C3 classifier rejects these when presented as generic common-field mutations.

## Exact files/functions

| File | Location | Purpose |
|---|---|---|
| `backend/src/services/inventory-common-profile-fields.service.js` | lines 7–240 | Five family map, common contract, dedicated classifier, fail-closed assertions, public contract |
| `backend/src/routes/erp.routes.js` | lines 48, 5350–5374 | Existing `inventory.view`-protected profile route; additive `commonFieldContract` response |
| `components/inventory/shared-receive-section.tsx` | lines 75–174 | One shared Supplier/Location/Date/Tax/Notes/Tax Summary receive envelope |
| Five profile pages | shared section imports/usage | AR/EN profile-specific extension plus common envelope |
| `backend/tests/c3-common-profile-fields.test.cjs` | six tests | Contract, five families, separation, UI source, projections, route protection |

## Focused and regression tests

Command:

```text
node --test backend/tests/c3-common-profile-fields.test.cjs tests/asset-final-closure.test.cjs tests/barcode-final-closure.test.cjs backend/tests/c2c2-revision-service-api.test.cjs backend/tests/supplier-all-asset-profiles-acquisition-payable-pricing-fix-01.test.cjs backend/tests/inventory-master-data-bootstrap-r4.test.cjs backend/tests/route-permission-catalog-coverage.test.cjs tests/unified-inventory-ux-final-closure.test.cjs
```

Result: **52 tests passed, 0 failed**.

`npm run typecheck` also passed. Two pre-existing source-marker assertions in the affected Asset/Unified regression tests were aligned to the current accepted route wording; this was test-only stale-contract alignment, not a product behavior change.

## Runtime and DB proof

- Main `:8000` health, DB, Redis, and Gold health: 200.
- Disposable `:8001` health, DB, Redis, and Gold health: 200.
- Main AR/EN inventory list: PASS.
- Main AR/EN GBW, GBP, Diamond, Gem Stone, and Pearl forms: common envelope PASS.
- Browser console warnings/errors collected: none.
- Official `current_database()`: `darfus_erp`.
- Disposable `current_database()`: `darfus_c3_common_profile_fields_01`.
- Official source/applied migrations: 92/92, pending 0, extra 0.
- Official in-scope Asset rows: 11; missing supplier/location/description/branch: 0.
- Blank barcode rows: 0; duplicate barcode rows: 0.
- Official business writes: 0; official damage: 0.

No Receive was run by C3. Existing synthetic rows were read-only evidence; this report does not claim a new transactional create. The protected disposable route returned 401 without authorization and 200 with an existing disposable-clone test session; the response proved `success=true`, contract version `1`, 15 fields, five top-level families, and nine internal strategies. The exact contract shape and permission boundary were also proven by source and tests.

## Findings and risks

| Finding | Classification | Severity | Disposition |
|---|---|---|---|
| Common contract was previously implicit | IMPLEMENTATION_GAP / API mapping | P2 before C3; closed by additive contract | Implemented and tested |
| Universal SKU authority not proven | UNKNOWN / missing authority | P2 | Deferred; do not alias Barcode/item code |
| Universal image authority not proven | UNKNOWN / missing authority | P2 | Deferred; do not create common image field |
| Existing four CGP Assets lack location | DB_STATE outside C3 profiles | P2 | Preserved; no cleanup or backfill |
| No RFID assignments in current rows | Current data state, optional field | P3 | Preserved; no provisioning |

No P0/P1 issue was introduced. No new lesson was required; the change follows the existing “single authority, smallest safe change, stale-test alignment” prevention rules.

## Final tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-C3-COMMON-PROFILE-FIELDS-EXACT-PARITY-01
MODE = READ_FIRST_PLUS_MINIMUM_SAFE_IMPLEMENTATION_PLUS_DISPOSABLE_ACCEPTANCE
CLIENT_COMMON_FIELD_COUNT = 15
COMMON_FIELDS = description, brand, supplierId, locationId, purchaseDate, taxTreatment, notes, barcode, rfid, inventoryProfile, branchId, operationalStatus, createdBy, createdAt, auditLog
SUBSET_COMMON_FIELDS = model, modelNumber, condition
PROFILE_SPECIFIC_FIELDS = goldColor, karat, weights, making, pricing, certificates, components, looseDetails, pearlDetails, gemstoneDetails, profile valuation
DEDICATED_AUTHORITY_FIELDS = assetId, barcode, rfid assignment, inventory/item code, itemType/profile, karat, weights/quantity, status, branch, location transitions, movement, purchase cost, selling price, valuation, tax, journal, invoice identity
C3_GAP_CLASS = A_UI_API_MAPPING_GAP_ONLY
WHO_OWNS_COMMON_PROFILE_DATA = Existing Asset / Supplier Receive V2 / Tax / Location authorities by field
DUPLICATE_GENERAL_METADATA_AUTHORITY = NO
DUPLICATE_PROFILE_AUTHORITY = NO
CIRCULAR_DEPENDENCY = NO
FUTURE_INTEGRATION_REQUIRES_CORE_REDESIGN = NO
MIGRATION_REQUIRED = NO
PERMISSION_CHANGE_REQUIRED = NO
GLOBAL_ROUTE_PERMISSION_COVERAGE_TEST = PASS
GBW_PARITY = PASS
GBP_PARITY = PASS
DIAMOND_PARITY = PASS
GEM_STONE_PARITY = PASS
PEARL_PARITY = PASS
FIELD_ROUND_TRIP_PARITY = PASS
AR_BROWSER = PASS
EN_BROWSER = PASS
BROWSER_PREFLIGHT = PASS
C3_FOCUSED_TESTS = PASS
C3_AFFECTED_REGRESSION = PASS
TYPECHECK = PASS
OFFICIAL_BUSINESS_WRITES = 0
OFFICIAL_DB_DAMAGE = 0
C3_MUTATION_TARGET_IS_DISPOSABLE = YES (prepared; no C3 business mutation executed)
P0 = 0
P1 = 0
P2 = 3 documented/deferred observations
P3 = 1 documented observation
GATE = PASS_CLIENT_C3_COMMON_PROFILE_FIELDS_EXACT_PARITY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## STOP

`COMMON_PROFILE_FIELDS = CLOSED` for the implemented common contract foundation.

`NEXT = C4_TAG_PROFILE_PARITY` only after explicit Owner approval. No C4 work was started automatically.
