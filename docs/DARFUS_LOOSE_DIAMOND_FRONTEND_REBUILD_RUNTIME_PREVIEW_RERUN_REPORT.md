# DARFUS ERP — Loose Diamond Frontend Rebuild + Runtime Preview Rerun Report

## 1. Executive Summary

تم بناء frontend من المصدر الحالي وتشغيله من Build جديد، ثم أُعيدت مراجعة AR بالمستخدم المصادق عليه. نجح البناء ونجح contract وProfile Preview، لكن Shared Preview ما زال يفشل بـHTTP 500. ثبت السبب من payload مماثل ومن stack trace معزول: `loose-profile-finance.service.js:28` يستدعي `Decimal.neq()` غير المتاح عند مقارنة `stoneCostCanonical` مع سعر الشراء.

هذا control يمنع أي source correction جديدة بعد ظهور هذا العيب؛ لذلك لم يتم تعديل backend، ولم يتم تشغيل EN preview بعد hard stop، ولم يتم تنفيذ Receive أو backup أو أي DB business write.

## 2. Source Fix Presence

Source file inspected:

`app/[locale]/(dashboard)/inventory/loose-diamond/page.tsx`

Evidence present before build:

- `inventoryV2: true`
- `profile: LOOSE_DIAMOND`
- top-level `quantity: 1`
- `perPiece: [piece]`
- `inventoryCode: DD`, `itemCode: LOS`, `karatCode: 00`
- pre-tax `unitCost`/`purchaseCost`
- `taxIncluded: false`
- exact request/key/fingerprint refs

`SOURCE_FIX_PRESENT = PASS`.

## 3. Build Guard / next-env.d.ts Evidence

| Evidence | Before | After build | Final |
|---|---|---|---|
| `next-env.d.ts` SHA-256 | `7AD303E40D4FDDF44F156129E397511953A71481C5CFD86B1862649AAAF240CC` | `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651` | restored to before hash |
| Content import | `./.next/dev/types/routes.d.ts` | `./.next/types/routes.d.ts` | `./.next/dev/types/routes.d.ts` |
| Policy result | owner-accepted generated drift | known generated build result | no unintended final change |

The final `next-env.d.ts` content was restored byte-for-byte with a narrow patch. No broad Git command was used.

## 4. Runtime Baseline

- Previous served process: `next start`, stale Build ID `brqo-UntwfaS34-ax1n4G`.
- Source page timestamp: `2026-08-21T09:09:56.999Z`.
- New Build ID: `NdOxBvBWFHrbHeRbm5kVU`.
- New frontend listener was observed on port 3000 after restart.

## 5. Safe Frontend Build

`npm run build` completed successfully with Next.js 16.2.9/Turbopack. TypeScript and static page generation completed without error.

`SAFE_FRONTEND_BUILD = PASS`.

## 6. Frontend Restart / New Build Identity

The stale frontend process was stopped and `npm start` was relaunched from the new `.next` artifact. The rebuilt UI text changed from the old read-only wording to the current confirmation-capable wording, proving the source fix was served.

`SOURCE_FIX_SERVED = YES`.

## 7. Backend Health

| Endpoint | Status |
|---|---:|
| `/api/v1/health` | 200 |
| `/api/v1/health/db` | 200 |
| `/api/v1/health/redis` | 200 |

Backend remained in the normal Docker runtime. No backend restart, migration, or seed was run.

## 8. Authenticated Company/Branch Context

Authenticated browser context remained valid: Company `Gold ERP`, Branch `Branch-1`. The Loose Diamond contract loaded and suppliers, location, tax treatments, and profile master selectors were present.

## 9. AR Route

`/ar/inventory/loose-diamond` loaded successfully from the new Build. No relevant browser console errors were captured before the preview failure.

`AR_ROUTE = PASS`.

## 10. AR Profile Preview

The synthetic values were entered exactly as specified: Diamond, Natural Diamond, F/G, VS1, Excellent, Round, Australia, 1.25 CT, purchase 5000 AED, current value 6200 AED, selling price 8000 AED, STANDARD_VAT.

Profile Preview reached READY. Server-rendered values were purchase base `5000.00`, purchase VAT `700.00`, purchase total `5700.00`, current value `6200.00`, current VAT `868.00`, and current total `7068.00`.

`PROFILE_PREVIEW_AR = READY`.

## 11. AR Shared Preview

The browser displayed `An unexpected server error occurred.` The backend log recorded:

`POST /api/v1/inventory-v2/receive-preview 500`

The final Receive endpoint was not called.

`SHARED_PREVIEW_AR = FAIL`.

## 12. AR Preview Parity

Not provable because Shared Preview did not return a summary. No confirmation was opened and no Receive was sent.

`PREVIEW_PARITY_AR = NOT_PROVABLE`.

## 13. EN Route

EN route was previously verified on the stale runtime. The new Build was not advanced to EN preview after the AR Shared Preview hard stop, as required by this control.

`EN_ROUTE = NOT_RUN_AFTER_AR_HARD_STOP`.

## 14. EN Profile Preview

Not run in the new Build after the AR hard stop.

`PROFILE_PREVIEW_EN = NOT_RUN`.

## 15. EN Shared Preview

Not run in the new Build after the AR hard stop.

`SHARED_PREVIEW_EN = NOT_RUN`.

## 16. EN Preview Parity

Not run.

## 17. Prepared Exact Request Runtime Proof

The confirmation state was not opened because `sharedPreview` remained null. Source-level retention is present, but runtime prepared-request proof is pending.

## 18. perPiece Runtime Proof

The rebuilt source contains `quantity: 1` and `perPiece: [piece]`. A read-only diagnostic using the same source payload reached the backend normalizer and exposed the next defect before any persistence.

## 19. Barcode DD/LOS/00 Runtime Preparation

Source contract remains `DD / LOS / 00`. No barcode was allocated and no barcode row changed.

## 20. Network No-Receive Proof

Observed allowed calls: contract, master-data reads, profile preview, and shared receive-preview. Backend logs show one shared-preview `500`. There was no `POST /api/v1/purchase-orders/receive`.

`FINAL_RECEIVE_REQUESTS = 0`.

## 21. DB No-Business-Mutation Proof

Read-only current counts:

| Entity | Count |
|---|---:|
| purchase_orders | 9 |
| purchase_order_items | 9 |
| assets | 9 |
| asset_barcode_history | 9 |
| asset_origins | 9 |
| asset_purchase_cost_revisions | 9 |
| asset_current_valuations | 9 |
| inventory_asset_movements | 9 |
| journal_entries | 12 |
| journal_lines | 33 |
| cash_transactions | 3 |
| idempotency_requests | 12 |
| LOOSE_DIAMOND assets | 0 |

`current_database() = darfus_erp`. Counts match the pre-control baseline. No mutation endpoint was called.

## 22. Focused Tests

- `node --test backend/tests/loose-diamond-minimum-safe-implementation.test.cjs`: 6/6 PASS.
- `node --test tests/unified-inventory-intake-ux-02-r3.test.cjs`: 5/5 PASS.

## 23. Typecheck / Relevant Regression

`npm run typecheck`: PASS.

No broad unrelated regression suite was run after the hard stop.

## 24. Files Changed

No product source file was changed in this control. Generated `.next` artifacts were rebuilt. `next-env.d.ts` was automatically changed by Next during build and restored exactly to the owner-accepted pre-build content. The prior Loose Diamond source correction remains from the preceding control.

## 25. Remaining Risks

Confirmed P1 blocker:

`backend/src/services/loose-profile-finance.service.js:28` calls `new Decimal(...).neq(...)`. In the installed Decimal.js runtime this is not a function. The same frontend payload supplies both `purchasePricePreTax` and equal `stoneCostCanonical`, so this comparison executes and produces the 500.

Minimum safe correction is a backend implementation correction to use the supported Decimal equality API. It was not applied because this control explicitly says to stop and report if a new product source correction is necessary.

## 26. Gate

`GATE = BLOCKED_LOOSE_DIAMOND_SHARED_PREVIEW_RUNTIME`.

The frontend rebuild and serving gate passed, but Shared Preview still fails in the backend. No Receive, backup, payment, RFID assignment, migration, seed, master-data mutation, or historical journal correction occurred.

## 27. Final Tokens

```text
CURRENT_CONTROL = DARFUS-LOOSE-DIAMOND-FRONTEND-REBUILD-RUNTIME-PREVIEW-RERUN
LOCAL_MAIN_DB = darfus_erp
SOURCE_FIX_PRESENT = PASS
NEXT_ENV_PREBUILD_HASH = 7AD303E40D4FDDF44F156129E397511953A71481C5CFD86B1862649AAAF240CC
NEXT_ENV_POSTBUILD_HASH = 7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651
NEXT_ENV_UNEXPECTED_CHANGE = NO_FINAL_CHANGE_RESTORED
SAFE_FRONTEND_BUILD = PASS
NEW_BUILD_ID = NdOxBvBWFHrbHeRbm5kVU
SOURCE_FIX_SERVED = YES
BACKEND_HEALTH = PASS
DB_HEALTH = PASS
REDIS_HEALTH = PASS
AUTHENTICATED_SESSION = PASS
COMPANY_CONTEXT = PASS
BRANCH_CONTEXT = PASS
CONTRACT_HTTP = PASS_AUTHENTICATED
AR_ROUTE = PASS
PROFILE_PREVIEW_AR = READY
SHARED_PREVIEW_AR = FAIL_HTTP_500
PREVIEW_PARITY_AR = NOT_PROVABLE
EN_ROUTE = NOT_RUN_AFTER_AR_HARD_STOP
PROFILE_PREVIEW_EN = NOT_RUN
SHARED_PREVIEW_EN = NOT_RUN
PREVIEW_PARITY_EN = NOT_RUN
RUNTIME_PER_PIECE_LENGTH = 1_SOURCE_CONFIRMED
PROFILE_PURCHASE_BASE = 5000.00
PROFILE_PURCHASE_VAT = 700.00
PROFILE_PURCHASE_TOTAL = 5700.00
SHARED_PURCHASE_BASE = NOT_RETURNED
SHARED_PURCHASE_VAT = NOT_RETURNED
SHARED_PURCHASE_TOTAL = NOT_RETURNED
DOUBLE_VAT = NOT_PROVABLE
PREPARED_UNIT_COST = 5000.00_SOURCE_CONFIRMED
PREPARED_PURCHASE_COST = 5000.00_SOURCE_CONFIRMED
PREPARED_BARCODE_AUTHORITY = DD_LOS_00_SOURCE_CONFIRMED
EXACT_REQUEST_RETAINED = YES_SOURCE_CONFIRMED
IDEMPOTENCY_KEY_RETAINED = YES_SOURCE_CONFIRMED
PREVIEW_FINGERPRINT_RETAINED = YES_SOURCE_CONFIRMED
FINAL_RECEIVE_REQUESTS = 0
DB_BUSINESS_WRITES = 0
LOOSE_DIAMOND_ASSET_COUNT_DELTA = 0
FOCUSED_TESTS = PASS
TYPECHECK = PASS
RELEVANT_FRONTEND_REGRESSION = PASS_5_OF_5
PRODUCT_SOURCE_CHANGES_THIS_CONTROL = 0
PRE_RECEIVE_BACKUP = DEFERRED_TO_RECEIVE_CONTROL
ONLINE_PRODUCTION_CONTACTED = NO
P0_NEW = 0
P1_NEW = 1
GATE = BLOCKED_LOOSE_DIAMOND_SHARED_PREVIEW_RUNTIME
FIRST_LOOSE_DIAMOND_RECEIVE_EXECUTED = NO
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**STOP. لا تنفذ Receive أو backup أو source correction جديدة ضمن هذا control.**
