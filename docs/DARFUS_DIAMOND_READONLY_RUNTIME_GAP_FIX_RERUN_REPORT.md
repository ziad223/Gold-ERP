# DARFUS ERP — Diamond Read-Only Runtime Gap Fix + Rerun Report

Control ID: `DARFUS-DIAMOND-READONLY-RUNTIME-GAP-FIX-RERUN`

## 1. Executive Summary

تم تنفيذ إصلاحين محدودين فقط:

1. مواءمة اختبارات Unified Inventory مع السلطة الحالية التي تفعّل ثلاثة ملفات: Gold By Weight وGold By Piece وDiamond Jewellery.
2. منع Shared Receive Preview من العمل على Diamond preview قديم/غير صالح، وتحويل أخطاء Diamond validation المعروفة إلى `422` بدل `500`.

لم يتم تنفيذ Receive أو Loose Diamond أو Migration أو Seed أو أي business write على `darfus_erp`.

## 2. Previous Two Gaps

| Gap | Previous Evidence | Closure |
|---|---|---|
| Unified tests expected 2 enabled profiles | Both affected tests asserted `enabled: true` count = 2 | Assertions now require exactly 3 and verify Diamond enabled, Gem Stone/Pearl disabled |
| Invalid Diamond state could reach Shared Preview and return 500 | Old preview state remained usable while current input was changing; raw validator `Error` reached middleware | Current-input fingerprint gate + narrow known Diamond validation mapping |

## 3. Root Cause — Stale Test Expectations

`tests/unified-inventory-ux-final-closure.test.cjs` and `tests/unified-inventory-intake-ux-02-r3.test.cjs` encoded the pre-Diamond state: two enabled profiles, three disabled profiles, and a GBW/GBP-only route ternary. Current approved runtime authority enables Diamond Jewellery as the third profile. No product/UI behavior was changed to satisfy the tests; only stale assertions were aligned.

## 4. Root Cause — Negative Shared Preview 500

Two causes were confirmed:

- Frontend orchestration kept the prior successful `preview` while the `item` input changed. The shared-preview effect could therefore see a stale `receiveItem` during an invalid transition.
- `POST /inventory-v2/receive-preview` called the Diamond normalizer through `inventoryV2Runtime`. Known Diamond validation failures were plain `Error` instances, and the generic error middleware correctly treated an unwrapped plain error as `500`.

The fix is deliberately narrow: the page clears the previous preview/shared preview and records the exact current-input fingerprint; Shared Preview runs only when the current fingerprint has a successful Diamond preview. The backend maps only known `DIAMOND_*` input codes, plus the Diamond-specific incomplete certificate shape, to `ValidationError`/`422`. Unexpected errors remain `500`.

## 5. Files Changed

Intentional files for this control:

- `tests/unified-inventory-ux-final-closure.test.cjs`
- `tests/unified-inventory-intake-ux-02-r3.test.cjs`
- `tests/diamond-negative-shared-preview.test.cjs`
- `backend/src/services/diamond-jewellery-profile.service.js`
- `backend/src/routes/diamond-jewellery-profile.routes.js`
- `backend/src/routes/erp.routes.js`
- `app/[locale]/(dashboard)/inventory/diamond-jewellery/page.tsx`
- `docs/DARFUS_DIAMOND_READONLY_RUNTIME_GAP_FIX_RERUN_REPORT.md`

Existing unrelated worktree drift was not cleaned, reset, or claimed.

## 6. Unified Inventory Test Alignment

PASS. The tests now assert:

- Gold By Weight: enabled
- Gold By Piece: enabled
- Diamond Jewellery: enabled
- Loose Diamond: disabled/not enabled
- Gem Stone: disabled
- Pearl: disabled
- enabled count: `3`

## 7. Frontend Preview Orchestration Fix

Implemented in the Diamond Jewellery page:

- clear `preview`, `previewFingerprint`, and `sharedPreview` whenever the current profile input changes;
- set the fingerprint only after the current Diamond profile preview succeeds;
- block Shared Preview unless `previewFingerprint === itemFingerprint` and the current preview exists;
- preserve cancellation guards so stale responses cannot overwrite the current invalid state.

Representative browser proof:

| State | Diamond Profile Preview | Shared Preview Request | UI |
|---|---:|---:|---|
| Valid two-component input | 200 | 200 | READY / READY |
| CT changed from 1.5 to 1.6 | 422 | Not sent | INCOMPLETE / NOT_READY |
| Restored valid CT = 1.5 | 200 | 200 | READY / READY |

`INVALID_DIAMOND_UI_SHARED_PREVIEW_REQUESTS = 0` for the representative invalid transition.

## 8. Backend Validation Error Mapping Fix

Implemented:

- `diamond-jewellery-profile.service.js::toValidationError(error)` recognizes only the established `DIAMOND_*` validation-code shape.
- Diamond profile preview and shared receive-preview use that mapper.
- A Diamond-specific `INVENTORY_CERTIFICATE_REQUIRED_FIELDS` path is mapped to `DIAMOND_CERTIFICATE_AUTHORITY_REQUIRED`.
- Unknown infrastructure/programming errors are not converted.

## 9. Positive Preview Runtime

Authenticated local runtime:

- `GET /api/v1/inventory-v2/diamond-jewellery/contract`: `200`
- `POST /api/v1/inventory-v2/diamond-jewellery/preview`: `200`
- `POST /api/v1/inventory-v2/receive-preview`: `200`
- Profile Preview: `READY`
- Shared Supplier V2 Preview: `READY`
- Final Receive: not run

Captured valid values for Gross Weight `10`, CT `1.5`, Karat `21`, historical rate `200`, making/g `10`, and two components:

| Calculation | Runtime Value |
|---|---:|
| CT to grams | `0.30000000 g` |
| Net gold | `9.70000000 g` |
| Pure gold at 21K | `8.48750000 g` |
| Historical gold value | `AED 1,940.00` |
| Total making | `AED 97.00` |
| Diamond cost | `AED 1,000.00` |
| Total purchase cost | `AED 3,462.18` |
| Current Gold Center rate | `466.80803905 AED/g` |
| Total current cost | `AED 6,412.54329582` |
| Derived minimum sale price | `AED 6,412.54329582` |
| Expected profit at AED 7,000 | `AED 587.45670419` |

No formula, tax, Gold Center, supplier, location, or pricing authority was changed.

## 10. Negative Browser Runtime

The browser changed only the synthetic declared CT from `1.5` to `1.6`. The UI displayed `DIAMOND_COMPONENT_CARAT_TOTAL_MISMATCH`, Profile Preview became incomplete, Shared Preview became not ready, and no Shared Preview request was logged. The input was restored to `1.5`; both valid previews returned successfully.

Console errors in the final browser checks: `0`.

## 11. Direct Invalid Shared Preview API

Authenticated direct requests to `POST /api/v1/inventory-v2/receive-preview` produced:

| Payload | Status | Error Code |
|---|---:|---|
| Valid Diamond payload | 200 | — |
| CT total mismatch | 422 | `DIAMOND_COMPONENT_CARAT_TOTAL_MISMATCH` |
| Zero stone carat | 422 | `DIAMOND_STONE_CARAT_WEIGHT_INVALID` |
| Component certificate without authority | 422 | `DIAMOND_CERTIFICATE_AUTHORITY_REQUIRED` |
| Top-level certificate without authority | 422 | `DIAMOND_CERTIFICATE_AUTHORITY_REQUIRED` |

`INVALID_DIAMOND_SHARED_PREVIEW_500 = 0` in the post-fix direct run.

## 12. Network / Console

- Health endpoints: `/health`, `/health/db`, `/health/redis`, `/health/gold`: all `200`.
- Diamond contract: `200`.
- Valid profile/shared preview: `200` / `200`.
- Invalid profile preview: `422`.
- Invalid UI state: no Shared Preview request.
- Final Receive requests: `0`.
- `/purchase-orders/receive`: not called.
- Console errors: `0`.
- Existing unrelated branding image `404` remains outside this control and is P3/non-blocking.

## 13. DB No-Mutation Proof

Read-only snapshots before and after the rerun were identical:

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
| idempotency_requests | 9 | 9 | 0 |
| DIAMOND_JEWELLERY assets | 0 | 0 | 0 |
| LOOSE_DIAMOND assets | 0 | 0 | 0 |

`DB_BUSINESS_WRITES = 0`.

## 14. Focused Tests

| Command | Result |
|---|---|
| `node --test tests/diamond-jewellery-authority-implementation.test.cjs` | PASS — 5/5 |
| `node --test tests/diamond-negative-shared-preview.test.cjs` | PASS — 3/3 |

## 15. Unified Regression Tests

| Command | Result |
|---|---|
| `node --test tests/unified-inventory-ux-final-closure.test.cjs` | PASS — 8/8 |
| `node --test tests/unified-inventory-intake-ux-02-r3.test.cjs` | PASS — 5/5 |

## 16. Typecheck

`npm run typecheck` — PASS.

The normal backend container refresh ran the existing startup `sequelize db:migrate` check. The container log explicitly reported: `No migrations were executed, database schema was already up to date.` No migration was created or applied.

## 17. Gate

All required gap-fix and read-only rerun criteria pass. No Receive authorization is implied by this result.

```text
UNIFIED_TEST_EXPECTATION_ALIGNMENT = PASS
EXPECTED_ENABLED_PROFILES = 3
INVALID_DIAMOND_UI_SHARED_PREVIEW_REQUESTS = 0
INVALID_DIAMOND_SHARED_PREVIEW_STATUS = 422
INVALID_DIAMOND_SHARED_PREVIEW = 4XX
INVALID_DIAMOND_SHARED_PREVIEW_500 = 0
SHARED_PREVIEW_500_COUNT = 0
VALID_DIAMOND_PREVIEW_PATH_REGRESSION = PASS
NEGATIVE_UI_ORCHESTRATION = PASS
NEGATIVE_SHARED_PREVIEW_API = PASS
DIAMOND_FOCUSED_TESTS = PASS
UNIFIED_INVENTORY_UX_TESTS = PASS
UNIFIED_INVENTORY_INTAKE_TESTS = PASS
NEGATIVE_SHARED_PREVIEW_TESTS = PASS
TYPECHECK = PASS
NETWORK = PASS
CONSOLE = PASS
FINAL_RECEIVE_REQUESTS = 0
DB_BUSINESS_WRITES = 0
MIGRATION_CREATED = NO
MIGRATION_EXECUTED = NO
ONLINE_PRODUCTION_CONTACTED = NO
DIAMOND_SOURCE_AND_UI_READY = YES
DIAMOND_READ_ONLY_RUNTIME_ACCEPTANCE = PASS
CAN_REUSE_CURRENT_DIAMOND_ACCEPTANCE_EVIDENCE = NO
NEW_CONTROLLED_DIAMOND_RECEIVE_REQUIRED = YES
OWNER_RUNTIME_AUTHORIZATION = NOT_PROVIDED
GATE = BLOCKED_DIAMOND_JEWELLERY_RUNTIME_AUTHORIZATION_REQUIRED
DIAMOND_JEWELLERY_FINAL_CLOSED = NO
NEXT_RECOMMENDED_STEP = OWNER REVIEW; if approved, authorize one controlled synthetic Diamond Jewellery Receive only
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 18. Final Tokens

```text
CURRENT_CONTROL = DARFUS-DIAMOND-READONLY-RUNTIME-GAP-FIX-RERUN
LOCAL_MAIN_DB = darfus_erp
ROOT_CAUSE_STALE_UNIFIED_TESTS = PRE_DIAMOND_ENABLED_COUNT_AND_ROUTE_ASSERTIONS
ROOT_CAUSE_NEGATIVE_SHARED_PREVIEW_500 = STALE_FRONTEND_PREVIEW_STATE_PLUS_UNWRAPPED_DIAMOND_VALIDATION_ERRORS
EXPECTED_ENABLED_PROFILES = 3
UNIFIED_TEST_EXPECTATION_ALIGNMENT = PASS
FRONTEND_INVALID_PROFILE_SHARED_PREVIEW_GUARD = PASS
INVALID_DIAMOND_UI_SHARED_PREVIEW_REQUESTS = 0
BACKEND_DIAMOND_VALIDATION_ERROR_MAPPING = PASS
INVALID_DIAMOND_SHARED_PREVIEW_STATUS = 422
INVALID_DIAMOND_SHARED_PREVIEW = 4XX
INVALID_DIAMOND_SHARED_PREVIEW_500 = 0
SHARED_PREVIEW_500_COUNT = 0
VALID_DIAMOND_PREVIEW_PATH_REGRESSION = PASS
NEGATIVE_UI_ORCHESTRATION = PASS
NEGATIVE_SHARED_PREVIEW_API = PASS
DIAMOND_PROFILE_PREVIEW_RUNTIME = PASS
DIAMOND_SHARED_RECEIVE_PREVIEW_RUNTIME = PASS
DIAMOND_PREVIEW_RECONCILIATION = PASS
NETWORK = PASS
CONSOLE = PASS
FINAL_RECEIVE_REQUESTS = 0
DB_BUSINESS_WRITES = 0
NEW_DIAMOND_JEWELLERY_ASSETS = 0
NEW_DIAMOND_COMPONENT_ROWS = 0
DIAMOND_FOCUSED_TESTS = PASS
UNIFIED_INVENTORY_UX_TESTS = PASS
UNIFIED_INVENTORY_INTAKE_TESTS = PASS
NEGATIVE_SHARED_PREVIEW_TESTS = PASS
TYPECHECK = PASS
MIGRATION_CREATED = NO
MIGRATION_EXECUTED = NO
ONLINE_PRODUCTION_CONTACTED = NO
DIAMOND_SOURCE_AND_UI_READY = YES
DIAMOND_READ_ONLY_RUNTIME_ACCEPTANCE = PASS
CAN_REUSE_CURRENT_DIAMOND_ACCEPTANCE_EVIDENCE = NO
NEW_CONTROLLED_DIAMOND_RECEIVE_REQUIRED = YES
OWNER_RUNTIME_AUTHORIZATION = NOT_PROVIDED
GATE = BLOCKED_DIAMOND_JEWELLERY_RUNTIME_AUTHORIZATION_REQUIRED
DIAMOND_JEWELLERY_FINAL_CLOSED = NO
NEXT_RECOMMENDED_STEP = OWNER REVIEW THEN EXPLICIT AUTHORIZATION FOR ONE CONTROLLED SYNTHETIC RECEIVE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. No Diamond Jewellery Receive or Loose Diamond work was started.
