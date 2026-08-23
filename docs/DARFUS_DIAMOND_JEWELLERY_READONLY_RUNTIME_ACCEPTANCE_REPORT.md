# DARFUS ERP — Diamond Jewellery Read-Only Runtime Acceptance Report

Control ID: `DARFUS-DIAMOND-JEWELLERY-READONLY-RUNTIME-ACCEPTANCE`

## Executive Summary

تم التحقق من الـDocker backend المحدث على `localhost:8000` دون تنفيذ Receive أو أي كتابة تجارية. العقد المصادق عليه أصبح `200`، ومسار Diamond AR/EN يعمل، وProfile Preview وShared Receive Preview نجحا ببيانات اصطناعية فقط. لم يتم استدعاء `/purchase-orders/receive`.

ظهر تعارضان في طبقة الاختبار/التحقق يجب توثيقهما قبل PASS نهائي:

1. اختبارات Unified Inventory القديمة ما زالت تتوقع أن عدد الملفات المفعلة = 2، بينما سلطة هذا الـControl تتطلب تفعيل Diamond، والواقع = 3.
2. أثناء negative validation، أرسلت الواجهة طلب Shared Receive Preview متزامنًا ببيانات Diamond غير صالحة؛ الـprofile preview أعاد `422` بشكل صحيح، لكن بعض الطلبات المتزامنة إلى Shared Receive Preview أعادت `500` بدل validation `4xx`. المسار الصحيح ببيانات صالحة أعاد `200`.

لم يتم إصلاح هذين الأمرين في هذا Read-Only Control.

## Backend Freshness

الحاوية `darfus-backend` أعيد تحديثها قبل هذا Control، وبدأت من source الحالي. سجل الإقلاع أفاد أن schema up to date ولم تُطبّق migrations. لم أنفذ restart أو migration.

```text
GET /api/v1/inventory-v2/diamond-jewellery/contract = 200
DIAMOND_BACKEND_RUNTIME_FRESH = PASS
```

## Health

| Check | Result | Evidence |
|---|---|---|
| Backend health | PASS | `GET /api/v1/health = 200` |
| Database health | PASS | `GET /api/v1/health/db = 200` |
| Redis health | PASS | `GET /api/v1/health/redis = 200` |
| Gold health | PASS | `GOLDAPI_IO`, `LIVE_PROVIDER`, `AED`, `PER_GRAM`, `HEALTHY`, `fresh=true` |
| Current database | PASS | `SELECT current_database() = darfus_erp` |

## Contract Runtime

Authenticated `GET /api/v1/inventory-v2/diamond-jewellery/contract` returned `200` and exposed:

- `profile = DIAMOND_JEWELLERY`;
- no Loose Diamond UI authority;
- item descriptions and canonical item codes;
- karats `9,10,12,14,18,21,22,24`;
- Diamond component options and current company master rows;
- Supplier and branch-scoped Location context;
- Company Tax Policy and enabled treatments;
- Gold Center capability and current health;
- `DD` barcode family;
- Asset authority and `quantityAuthority = NOT_ALLOWED`.

During runtime review, existing master labels such as `Natural Diamond` were found beside the reference values `Natural`. The minimum safe source alignment was applied before this runtime proof: the UI now selects the canonical contract values, and the server accepts the existing labels as equivalent aliases without changing their business meaning.

`DIAMOND_PROFILE_CONTRACT_RUNTIME = PASS`

## Chooser

Browser proof on `/en/inventory` and `/ar/inventory`:

- Gold By Weight: enabled;
- Gold By Piece: enabled;
- Diamond Jewellery: enabled;
- Loose Diamond: not exposed;
- Gem Stone: disabled;
- Pearl: disabled.

`DIAMOND_JEWELLERY_CHOOSER_RUNTIME = PASS`

The existing source regression tests still assert the pre-Diamond state of two enabled profiles. That is a stale test expectation, not the current runtime behavior.

## AR UI

`/ar/inventory/diamond-jewellery` loaded normally after chooser navigation. Evidence included:

- Arabic page title and labels;
- shared receive section in Arabic;
- RTL layout route;
- Supplier and Location DB-backed selectors;
- Diamond sections visible;
- final Receive visibly stopped.

`AR_DIAMOND_UI = PASS`

## EN UI

`/en/inventory/diamond-jewellery` loaded normally with:

- English labels;
- readable numeric CT/g/AED values;
- shared receive fields;
- nine Diamond profile sections;
- no dynamic Asset-not-found collision;
- no final Receive control.

`EN_DIAMOND_UI = PASS`

## Shared Receive

Valid synthetic browser input used the returned contract values only:

```text
Supplier = existing DB supplier
Location = existing active branch-scoped DB location
Purchase Date = current local date
Tax Treatment = STANDARD_VAT
Notes = empty
Components = 2
```

The page showed DB-backed Supplier/Location, server tax treatment, server tax summary, and no master-data create/edit controls. Company and Branch remained server context.

`DIAMOND_SHARED_RECEIVE_RUNTIME = PASS`

## Weight Calculations

Synthetic positive input:

```text
Gross Weight = 10 g
Total Diamond Weight = 1.5 CT
Gold Karat = 21K
Component CT = 1.0 + 0.5
```

The server preview reached `200` and the UI showed a ready preview. The source authority is:

```text
stoneWeight = 1.5 × 0.20 = 0.30000000 g
netGoldWeight = 10 − 0.30000000 = 9.70000000 g
pureGoldWeight = 9.70000000 × 21 / 24 = 8.48750000 g
```

`DIAMOND_CT_TO_GRAM_RUNTIME = PASS`

`DIAMOND_NET_GOLD_WEIGHT_RUNTIME = PASS`

`DIAMOND_PURE_GOLD_WEIGHT_RUNTIME = PASS`

## Components

Two components were entered using contract options:

| Component | CT | Type | Color | Clarity | Shape | Stone Cost |
|---|---:|---|---|---|---|---:|
| 1 | 1.0 | Natural | D | VS1 | Round | 1000 |
| 2 | 0.5 | Lab Grown | F | SI1 | Princess | null |

The page displayed `Component CT total matches the declared total` and `Profile Preview = READY`.

`DIAMOND_COMPONENT_RUNTIME = PASS`

`MULTIPLE_DIAMONDS_RUNTIME = PASS`

## CT Reconciliation

Positive runtime path:

```text
1.0 CT + 0.5 CT = 1.5 CT → profile preview 200
```

Negative browser path:

```text
Declared total changed to 1.6 CT → DIAMOND_COMPONENT_CARAT_TOTAL_MISMATCH → profile preview 422
```

No persistence occurred for either path.

`DIAMOND_COMPONENT_WEIGHT_RECONCILIATION_RUNTIME = PASS`

## CT vs Gold K

The contract and response keep component carat in CT and Gold purity in numeric K. No field or calculation combines CT and K. The direct V2 normalizer also returned separate `componentCarat` and asset `karat` values.

`DIAMOND_CARAT_GOLD_KARAT_RUNTIME = PASS`

## Certificate

The no-certificate positive path succeeded. The browser negative path entered a certificate number without authority and received `DIAMOND_CERTIFICATE_AUTHORITY_REQUIRED` with profile preview `422`. No certificate row was created.

`DIAMOND_CERTIFICATE_RUNTIME_PREVIEW = PASS`

## Historical Cost

Synthetic historical inputs:

```text
Historical Gold Purchase Price / g = 200
Making / Workmanship / g = 10
Stone Costs = 1000 + null
```

The visible server-derived output included:

```text
Historical Gold Value = AED 1,940.00
Total Making = AED 97.00
Total Diamond Cost = AED 1,000.00
Total Purchase Cost = AED 3,462.18
```

The missing second Stone Cost remained absent from component input while contributing zero to the aggregate. The tax projection came from the existing server tax context; no frontend tax formula was used.

`DIAMOND_HISTORICAL_COST_RUNTIME = PASS`

## Historical vs Current Rate

The visible current rate was sourced as:

```text
source = GOLDAPI_IO
currency = AED
unit = PER_GRAM
rateType = GLOBAL/SPOT
currentRate = 466.25238050
```

The historical rate remained the explicit manual input `200`; Gold Center did not replace it.

`DIAMOND_HISTORICAL_CURRENT_RATE_SEPARATION_RUNTIME = PASS`

## Tax / RCM

The contract exposed the current company Tax Policy and enabled treatments. Valid `STANDARD_VAT` was accepted by the server and appeared in the shared preview. The UI included the existing RCM evidence component for `REVERSE_CHARGE`; no UI-only RCM approval was added. The server route delegates to `transaction-tax-context.service.js`.

`DIAMOND_TAX_RUNTIME = PASS`

`DIAMOND_RCM_RUNTIME_BOUNDARY = PASS`

`DIAMOND_PURCHASE_PREVIEW_RECONCILIATION = PASS` for the valid Standard VAT path.

## Current Cost

The valid preview displayed current Gold Center data and a server-derived current total:

```text
Current Gold Rate / g = 466.25238050
Total Current Cost = AED 6,406.39882357
```

No Gold settings changed. No manual current-rate override was exposed by this profile.

`DIAMOND_CURRENT_GOLD_RUNTIME = PASS`

`DIAMOND_CURRENT_COST_RUNTIME = PASS`

`DIAMOND_CURRENT_RATE_OVERRIDE_BOUNDARY = NOT_APPLICABLE`

## Sales

The page exposed explicit Piece Selling Price and optional Maximum Discount. No automatic 4C market pricing exists. No POS sale was executed. The source preview derives a minimum price from current cost and marks a missing or below-cost price as not accepted.

`DIAMOND_SALES_RUNTIME = PASS`

`DIAMOND_NO_AUTO_4C_MARKET_PRICING = PASS`

`DIAMOND_ZERO_PRICE_SAFETY_RUNTIME = PASS` by source preview guard; no sale was submitted.

## Diamond Preview

Authenticated browser request:

```text
POST /api/v1/inventory-v2/diamond-jewellery/preview = 200
```

The positive response drove the visible `Profile Preview = READY` state and the displayed weight, historical cost, current rate, and current cost values.

`DIAMOND_PROFILE_PREVIEW_RUNTIME = PASS`

## Shared Receive Preview

Authenticated browser request with canonical Diamond V2 mapped input:

```text
POST /api/v1/inventory-v2/receive-preview = 200
```

The UI displayed `Shared Supplier V2 Preview = READY`. No final Receive request was sent.

`DIAMOND_SHARED_RECEIVE_PREVIEW_RUNTIME = PASS` for valid input.

## Preview Reconciliation

The positive profile preview and shared preview used the same:

- `DIAMOND_JEWELLERY` profile;
- two serialized component inputs;
- gross/CT/net weight facts;
- Supplier/Location/Tax Treatment context;
- server purchase cost evidence;
- canonical shared tax preview.

`DIAMOND_PREVIEW_RECONCILIATION = PASS` for the valid path.

## Validation

| Runtime check | Result |
|---|---|
| CT mismatch | PASS — profile preview `422`, `DIAMOND_COMPONENT_CARAT_TOTAL_MISMATCH` |
| Stone carat zero | PASS — profile preview `422`, `DIAMOND_STONE_CARAT_WEIGHT_INVALID` |
| Certificate number without authority | PASS — profile preview `422`, `DIAMOND_CERTIFICATE_AUTHORITY_REQUIRED` |
| Unsupported karat / missing required field / gross <= 0 / net > gross / negative value | PASS in focused source validation tests; not submitted as business mutation |
| Final Receive | NOT RUN by control |

## Network / Console

Positive network evidence from backend logs:

```text
GET  /api/v1/inventory-v2/diamond-jewellery/contract 200
POST /api/v1/inventory-v2/diamond-jewellery/preview 200
POST /api/v1/inventory-v2/receive-preview 200
```

Negative profile validation requests correctly returned `422`. During those negative changes, stale shared-preview requests were also observed returning `500`; they were not used as positive evidence and no mutation followed. This is a runtime error-handling/race gap for a future minimum safe fix.

No `/api/v1/purchase-orders/receive` request was observed.

Browser console logs for the AR/EN sessions contained no captured error or warning entries.

```text
FINAL_RECEIVE_REQUESTS = 0
CONSOLE = PASS
NETWORK = FAIL_WITH_NEGATIVE_SHARED_PREVIEW_500
```

The unrelated branding image `404` remained P3 and did not block the valid Diamond profile preview.

## DB No-Mutation Proof

Before and after read-only counts were identical. Both snapshots confirmed `current_database = darfus_erp`.

| Entity | Before | After | Delta |
|---|---:|---:|---:|
| purchase_orders | 6 | 6 | 0 |
| assets | 6 | 6 | 0 |
| asset_components | 0 | 0 | 0 |
| asset_diamond_component_details | 0 | 0 | 0 |
| asset_barcode_history | 6 | 6 | 0 |
| asset_origins | 6 | 6 | 0 |
| asset_purchase_cost_revisions | 6 | 6 | 0 |
| asset_current_valuations | 6 | 6 | 0 |
| inventory_asset_movements | 6 | 6 | 0 |
| journal_entries | 9 | 9 | 0 |
| journal_lines | 24 | 24 | 0 |
| cash_transactions | 3 | 3 | 0 |
| audit_logs | 60 | 60 | 0 |
| idempotency_requests | 9 | 9 | 0 |
| `DIAMOND_JEWELLERY` assets | 0 | 0 | 0 |
| `LOOSE_DIAMOND` assets | 0 | 0 | 0 |

```text
DB_BUSINESS_WRITES = 0
NEW_DIAMOND_JEWELLERY_ASSETS = 0
NEW_DIAMOND_COMPONENT_ROWS = 0
NEW_RECEIVES = 0
NEW_JOURNALS = 0
```

## Tests

| Command | Result |
|---|---|
| `node --test tests/diamond-jewellery-authority-implementation.test.cjs` | PASS — 5/5 |
| `node --test tests/unified-inventory-ux-final-closure.test.cjs` | FAIL — 7/8; stale expected enabled count 2, actual required count 3 |
| `node --test tests/unified-inventory-intake-ux-02-r3.test.cjs` | FAIL — 4/5; stale expected enabled count 2, actual required count 3 |
| `npm run typecheck` | PASS |

No test file was edited in this runtime control. The two failures are test expectation drift caused by the newly authorized Diamond chooser enablement.

Post-alignment verification rerun: `npm run typecheck` PASS and `node --test tests/diamond-jewellery-authority-implementation.test.cjs` PASS (5/5). No runtime mutation was performed during the rerun.

## Gate

The runtime evidence for the Diamond contract, positive profile preview, positive shared preview, AR/EN routes, weights, components, tax path, and DB no-mutation proof is present. The Control cannot be marked PASS because:

- the required Unified Inventory regression commands fail on stale assertions;
- negative browser cascades produce a Shared Receive Preview `500` instead of a clean validation `4xx`.

These failures did not mutate the DB and did not call final Receive.

```text
DIAMOND_READ_ONLY_RUNTIME_ACCEPTANCE = FAIL_WITH_TEST_AND_NEGATIVE_PREVIEW_GAPS
GATE = FAIL_DIAMOND_RUNTIME_REGRESSION_AND_NEGATIVE_PREVIEW_HANDLING
```

This is not a Receive authorization. Do not start Diamond Receive or Loose Diamond.

## Final Tokens

```text
CURRENT_CONTROL = DARFUS-DIAMOND-JEWELLERY-READONLY-RUNTIME-ACCEPTANCE
LOCAL_MAIN_DB = darfus_erp

BACKEND_HEALTH = PASS
DATABASE_HEALTH = PASS
REDIS_HEALTH = PASS

DIAMOND_BACKEND_RUNTIME_FRESH = PASS
DIAMOND_PROFILE_CONTRACT_RUNTIME = PASS
DIAMOND_JEWELLERY_CHOOSER_RUNTIME = PASS
AR_DIAMOND_UI = PASS
EN_DIAMOND_UI = PASS
DIAMOND_SHARED_RECEIVE_RUNTIME = PASS

DIAMOND_CT_TO_GRAM_RUNTIME = PASS
DIAMOND_NET_GOLD_WEIGHT_RUNTIME = PASS
DIAMOND_PURE_GOLD_WEIGHT_RUNTIME = PASS
DIAMOND_COMPONENT_RUNTIME = PASS
MULTIPLE_DIAMONDS_RUNTIME = PASS
DIAMOND_COMPONENT_WEIGHT_RECONCILIATION_RUNTIME = PASS
DIAMOND_CARAT_GOLD_KARAT_RUNTIME = PASS
DIAMOND_RUNTIME_VALIDATION = PASS
DIAMOND_CERTIFICATE_RUNTIME_PREVIEW = PASS

DIAMOND_HISTORICAL_COST_RUNTIME = PASS
DIAMOND_HISTORICAL_CURRENT_RATE_SEPARATION_RUNTIME = PASS
DIAMOND_TAX_RUNTIME = PASS
DIAMOND_RCM_RUNTIME_BOUNDARY = PASS
DIAMOND_PURCHASE_PREVIEW_RECONCILIATION = PASS
DIAMOND_CURRENT_GOLD_RUNTIME = PASS
DIAMOND_CURRENT_COST_RUNTIME = PASS
DIAMOND_CURRENT_RATE_OVERRIDE_BOUNDARY = NOT_APPLICABLE
DIAMOND_SALES_RUNTIME = PASS
DIAMOND_NO_AUTO_4C_MARKET_PRICING = PASS
DIAMOND_ZERO_PRICE_SAFETY_RUNTIME = PASS

DIAMOND_PROFILE_PREVIEW_RUNTIME = PASS
DIAMOND_SHARED_RECEIVE_PREVIEW_RUNTIME = PASS_VALID_PATH
DIAMOND_PREVIEW_RECONCILIATION = PASS_VALID_PATH
NETWORK = FAIL_WITH_NEGATIVE_SHARED_PREVIEW_500
CONSOLE = PASS
FINAL_RECEIVE_REQUESTS = 0

DB_BUSINESS_WRITES = 0
NEW_DIAMOND_JEWELLERY_ASSETS = 0
NEW_DIAMOND_COMPONENT_ROWS = 0

DIAMOND_FOCUSED_TESTS = PASS
UNIFIED_INVENTORY_REGRESSION = FAIL_STALE_EXPECTATION
TYPECHECK = PASS

MIGRATION_CREATED = NO
MIGRATION_EXECUTED = NO_BY_THIS_CONTROL
ONLINE_PRODUCTION_CONTACTED = NO

DIAMOND_SOURCE_AND_UI_READY = YES
DIAMOND_READ_ONLY_RUNTIME_ACCEPTANCE = FAIL
CAN_REUSE_CURRENT_DIAMOND_ACCEPTANCE_EVIDENCE = NO
NEW_CONTROLLED_DIAMOND_RECEIVE_REQUIRED = YES
OWNER_RUNTIME_AUTHORIZATION = NOT_PROVIDED

GATE = FAIL_DIAMOND_RUNTIME_REGRESSION_AND_NEGATIVE_PREVIEW_HANDLING
DIAMOND_JEWELLERY_FINAL_CLOSED = NO
NEXT_RECOMMENDED_STEP = OWNER REVIEW OF STALE REGRESSION ASSERTIONS AND NEGATIVE SHARED PREVIEW ERROR HANDLING; THEN RERUN THIS READ-ONLY CONTROL
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

STOP. No Diamond Receive. No Loose Diamond. No cleanup. No migration. No seed. No production contact.

**READ-ONLY RUNTIME ACCEPTANCE COMPLETE → OWNER REVIEW OF TWO GAPS → WAIT FOR EXPLICIT APPROVAL**
