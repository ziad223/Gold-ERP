# DARFUS ERP — Loose Diamond HTTP 500 Forensic + Minimum Safe Fix + One Controlled Retry

## 1. Executive Summary

تم فحص الـHTTP 500، وإعادة إنتاج عيب persistence مستقل داخل معاملة `darfus_erp` مع rollback، وتطبيق أصغر إصلاح آمن، ثم تشغيل الاختبارات وAR/EN Preview. الإصلاح المحدد نجح في الاختبار المركّز وفي مسار Route كامل بحاجز Commit وrollback.

لكن محاولة Retry الوحيدة المصرح بها من المتصفح عادت `HTTP 500`، ولم يحفظ الـrunner stack الداخلي لذلك الطلب. لا يوجد دليل كافٍ لربط 500 المتصفح بالعيب المحدد أو إعلان Root Cause نهائي. تم التوقف دون Retry ثانٍ، ودون أي صف دائم جديد.

## 2. Current Gate / Prior Failure

| Item | Result | Evidence |
|---|---|---|
| Prior controlled retry | HTTP 500 | Backend request log at 2026-08-21 11:46:11 |
| Current retry | HTTP 500 | `POST /api/v1/purchase-orders/receive`, request `333f5c19-1215-42a2-915c-ad1cdd743c40` |
| Successful new receives | 0 | DB counts unchanged; `LOOSE_DIAMOND` assets = 0 |
| Second retry | Not run | Hard stop after one retry |

## 3. DB Baseline

Target was checked with `current_database()` before forensic and before retry: `darfus_erp`.

| Entity | Before | After | Delta |
|---|---:|---:|---:|
| purchase_orders | 9 | 9 | 0 |
| purchase_order_items | 9 | 9 | 0 |
| assets | 9 | 9 | 0 |
| asset_components | 6 | 6 | 0 |
| asset_diamond_component_details | 6 | 6 | 0 |
| asset_barcode_history | 9 | 9 | 0 |
| asset_rfid_assignments | 2 | 2 | 0 |
| asset_origins | 9 | 9 | 0 |
| asset_purchase_cost_revisions | 9 | 9 | 0 |
| asset_current_valuations | 9 | 9 | 0 |
| inventory_asset_movements | 9 | 9 | 0 |
| journal_entries | 12 | 12 | 0 |
| journal_lines | 33 | 33 | 0 |
| cash_transactions | 3 | 3 | 0 |
| idempotency_requests | 12 | 12 | 0 |
| audit_logs | 63 | 63 | 0 |
| LOOSE_DIAMOND assets | 0 | 0 | 0 |

## 4. Existing Backup Preservation

Existing backup was preserved and not overwritten:

`backend/backups/darfus_erp_PRE_LOOSE_DIAMOND_RETRY_20260821_111445Z.dump`

A new pre-retry backup was also created:

`backend/backups/darfus_erp_PRE_LOOSE_DIAMOND_500_FIX_RETRY_20260821_114531Z.dump`

- Bytes: `694860`
- SHA-256: `332D2AD84C99FFAC857DDD97994F402035E392D68BC77020A15C5ABB545550F9`
- `pg_restore -l`: PASS; TOC entries `1175`
- Backup timestamp preceded the retry POST.

## 5. HTTP 500 Request Correlation

| Request | HTTP | Correlation |
|---|---:|---|
| Prior control request | 500 | `1a022287-8947-4448-b0d7-3450017991b0` |
| Current controlled retry | 500 | `333f5c19-1215-42a2-915c-ad1cdd743c40` |

The current backend log recorded the safe customer response only:

`code=INTERNAL_SERVER_ERROR`, `message=An unexpected server error occurred.`

No token, cookie, password, or request body was logged.

## 6. Stack Trace

`RECEIVE_500_STACK_TRACE = NOT_CAPTURED_FOR_BROWSER_REQUEST`.

The existing logger rendered the safe message but discarded metadata fields from the console formatter. A minimal internal-only observability adjustment was made in `backend/src/middleware/error.middleware.js` to pass the safe exception stack through the logger `stack` field. No further Receive was made after that adjustment.

Safe rollback reproduction did capture the previously proven persistence exception:

```text
Error: Named replacement ":certificateCost" has no entry in the replacement map.
at Object.persistReceiptEvidence (.../backend/src/services/inventory-v2-runtime.service.js:351:26)
```

That reproduction used an intentionally incomplete piece object. It proves the isolated mapping defect, but does not prove that it was the hidden exception of the browser retry.

## 7. Exception Type / Message

| Scope | Type | Message | Status |
|---|---|---|---|
| Browser retry | Unknown internal exception; transport sanitized | `An unexpected server error occurred.` | Captured |
| Safe isolated reproduction before fix | `Sequelize` replacement error | `Named replacement ":certificateCost" has no entry in the replacement map.` | Proven |
| Safe malformed ordinal reproduction | `SequelizeDatabaseError`, PostgreSQL `42703` | `column "nan" does not exist` | Not the browser payload; excluded from Root Cause |

## 8. Receive Pipeline Trace

The canonical route is `POST /api/v1/purchase-orders/receive` in `backend/src/routes/erp.routes.js:7859`.

The full synthetic handler trace with the exact V2 shape reached the commit barrier after:

`route entry → transaction → supplier/branch/location → idempotency claim → V2 normalization → master-data resolution → PO preparation → Asset → AssetEvent → PO Item → receipt evidence → origin → cost revision → current valuation → pricing policy → movement → payable journal → audit → notification → idempotency success → commit barrier`

The commit barrier intentionally threw before commit and the transaction rolled back.

## 9. Last Successful Stage

`LAST_SUCCESSFUL_RECEIVE_STAGE = FULL_SYNTHETIC_ROUTE_REACHED_COMMIT_BARRIER_AND_ROLLED_BACK`.

For the actual browser retry, the last successful stage cannot be proven from retained logs.

## 10. First Failed Stage

`FIRST_FAILED_RECEIVE_STAGE = UNKNOWN_FOR_BROWSER_RETRY`.

The isolated pre-fix defect occurred at the `asset_purchase_cost_revisions` SQL mapping in `persistReceiptEvidence`, line 351, but the normalized production route supplies `certificateCost = 0`; therefore this is not asserted as the browser retry's final failure stage.

## 11. Transaction / Rollback Proof

- `TRANSACTION_STARTED = YES`
- `TRANSACTION_ROLLBACK = PASS`
- `PARTIAL_BUSINESS_ROWS = 0`
- Actual retry DB deltas: zero across all checked business tables.
- Full-route forensic run used a Commit barrier and explicit rollback; it produced no persistent business rows.

## 12. Exact Failure File/Function/Line

Actual browser request:

- `FAILURE_FILE = UNKNOWN_FROM_RETAINED_RUNTIME_EVIDENCE`
- `FAILURE_FUNCTION = UNKNOWN_FROM_RETAINED_RUNTIME_EVIDENCE`
- `FAILURE_LINE = UNKNOWN_FROM_RETAINED_RUNTIME_EVIDENCE`
- `FAILURE_OPERATION = UNKNOWN_FROM_RETAINED_RUNTIME_EVIDENCE`

Proven isolated defect:

- File: `backend/src/services/inventory-v2-runtime.service.js`
- Function: `persistReceiptEvidence`
- Line: 351 SQL call / line 357 replacement
- Operation: named replacement map passed `undefined` for optional `certificateCost`.

## 13. Root Cause

`ROOT_CAUSE_500 = NOT_PROVEN_FOR_THE_BROWSER_RETRY`.

The minimum source defect proven by safe rollback was an optional persistence mapping that passed `undefined` into Sequelize named replacements. The correction maps it to SQL `NULL`. The corrected isolated path and full synthetic route pass, but the browser retry still returned 500 and its internal exception was not retained; no silent attribution is made.

## 14. Root Cause Classification

- Proven isolated defect: `PERSISTENCE_MAPPING_BUG`
- Actual browser retry: `UNKNOWN`
- Final forensic classification for the retry: `OTHER_PROVEN` is **not** claimed; Root Cause remains unresolved.

## 15. Safe Reproduction

`SAFE_REPRODUCTION = PASS` for the isolated persistence defect.

The test inserted temporary evidence inside a real transaction on `darfus_erp`, reproduced the Sequelize replacement error, and rolled the transaction back. A second corrected full-route run used an explicit Commit barrier and rolled back. No permanent data was left.

`SAME_EXCEPTION_REPRODUCED = YES` for the isolated `certificateCost` mapping defect; `SAME_EXCEPTION_REPRODUCED_FOR_BROWSER_RETRY = NOT_PROVEN`.

## 16. Minimum Safe Fix

Applied one mapping correction:

```js
certificateCost: piece.certificateCost ?? null
```

No validation, tax, accounting, barcode, idempotency, profile, or business formula was changed. No migration, seed, master-data mutation, or manual SQL business patch was performed.

`MINIMUM_SAFE_FIX = PASS_FOR_PROVEN_MAPPING_DEFECT`

## 17. Files Changed

Intentional changes in this control:

- `backend/src/services/inventory-v2-runtime.service.js` — optional certificate cost mapping.
- `backend/src/middleware/error.middleware.js` — safe internal stack observability field.
- `backend/tests/loose-diamond-minimum-safe-implementation.test.cjs` — regression for omitted optional certificate cost.
- `docs/DARFUS_LOOSE_DIAMOND_500_FORENSIC_MINIMUM_FIX_CONTROLLED_RETRY_REPORT.md` — this report.

No migrations were created or executed. Existing unrelated worktree drift was not cleaned or reset.

## 18. Exact 500 Regression

`EXACT_500_REGRESSION = PASS_FOR_THE_PROVEN_PERSISTENCE_FAILURE_STAGE`.

The pre-fix rollback reproduction captured the exact Sequelize replacement failure. The post-fix test passed and the full synthetic route reached the commit barrier. The browser retry remains independently failed with an unretained internal cause.

## 19. Negative Regression

`INVALID_CASE_FAILS_CLOSED = PASS`.

The invalid multi-color master-data reference test remained a validation failure and was not weakened.

## 20. Persistence Pipeline Test

`PERSISTENCE_PIPELINE_TEST = PASS_WITH_FORCED_ROLLBACK`.

The route-level synthetic test passed through Asset, AssetEvent, PO Item, origin, cost revision, current valuation, profile references, movement, payable journal, audit, notification, and idempotency success, then stopped at the forced Commit barrier and rolled back.

## 21. Focused Tests

`node --test backend/tests/loose-diamond-minimum-safe-implementation.test.cjs`

- 12 passed
- 0 failed

## 22. Relevant Regression

Relevant Supplier V2, Diamond, Asset, Barcode, Unified Inventory, and UX tests:

- 40 passed
- 0 failed

## 23. Typecheck

`npm run typecheck = PASS` (`tsc --noEmit`).

## 24. Runtime Restart

Only the backend runner was restarted without migrations, seed, reset, or volume deletion. The frontend was not rebuilt or restarted.

## 25. Health

| Endpoint | Status |
|---|---:|
| `/api/v1/health` | 200 |
| `/api/v1/health/db` | 200 |
| `/api/v1/health/redis` | 200 |

DB health confirmed PostgreSQL connection. Redis health confirmed Redis connection.

## 26. AR Preview Recheck

`AR_PREVIEW = PASS`.

Synthetic values: purchase base `5000.00`, VAT `700.00`, purchase total `5700.00`, current value `6200.00`, current VAT `868.00`, current total `7068.00`. Receipt readiness was shown as ready.

## 27. EN Preview Recheck

`EN_PREVIEW = PASS` with the same server-derived values and readiness state.

`PREVIEW_PARITY = PASS`; `DOUBLE_VAT = NO`.

## 28. UI Cleanup Regression

- `TECHNICAL_INTERNAL_NOTES_VISIBLE = NO`
- `USEFUL_BUSINESS_HELP_TOOLTIPS = PASS`
- `AR_TOOLTIPS = PASS`
- `EN_TOOLTIPS = PASS`
- Browser console errors/warnings after the preview journey: none captured.

## 29. New Retry Request

- `NEW_RETRY_REQUEST = YES`
- `NEW_RETRY_IDEMPOTENCY_KEY = YES`
- `EXACT_REQUEST_CAPTURED_BEFORE_POST = YES` by the production builder's immutable request/key refs.
- Payload shape: one V2 item, `quantity=1`, `perPiece.length=1`, `DD/LOS/00`, pre-tax purchase base `5000`, current value `6200`, colors F/G, no RFID, no attachments.
- Key value is intentionally redacted.

## 30. Fresh Pre-Retry Backup

`PRE_RETRY_BACKUP = PASS`.

See Section 4 for path, bytes, SHA-256, and restore-list proof.

## 31. Controlled Retry

Exactly one final `Confirm Receive` click was executed from the English authenticated Loose Diamond UI.

- `CONTROLLED_RETRY_HTTP = 500`
- Request ID: `333f5c19-1215-42a2-915c-ad1cdd743c40`
- Second retry: not run.

## 32. PO / Asset / Barcode

No new PO, PO Item, Asset, Barcode, or RFID row was persisted. Counts remained unchanged.

## 33. Multi-Color Persistence

Not run on a persisted asset because the controlled retry did not return 201. Pre-persistence normalized references and the rollback pipeline accepted F exactly once and G exactly once.

## 34. Purchase Cost Revision

Not persisted by the failed browser retry. The isolated corrected pipeline accepted the pre-tax purchase cost mapping and rolled back before commit.

## 35. Current Valuation

Not persisted by the failed browser retry. The isolated corrected pipeline accepted the separate current valuation values and rolled back before commit.

## 36. Tax Snapshot

AR/EN profile and shared previews showed one server-derived VAT application: base `5000.00`, VAT `700.00`, total `5700.00`. No persisted tax snapshot was created by the failed retry.

## 37. Supplier Payable

Not persisted by the failed browser retry. No payment executed; cash transaction delta was `0`.

## 38. Journal

No new journal was persisted by the failed retry. The rollback pipeline produced a balanced synthetic journal shape before the forced rollback: Dr inventory `5000`, Dr input VAT `700`, Cr supplier payable `5700`.

## 39. Financial Reconciliation

Preview arithmetic passed and the rollback-only accounting pipeline balanced. Persisted Receive reconciliation was not available because the only controlled retry returned 500.

## 40. Origin / Movement

No persistent origin or movement was created by the failed browser retry. The rollback-only pipeline reached both origin and `PURCHASE_RECEIVE` movement successfully.

## 41. Idempotency Replay

`IDEMPOTENCY_EXACT_REPLAY = NOT_RUN` because there was no successful original Receive.

## 42. Same-Key Conflict

`IDEMPOTENCY_CONFLICT = NOT_RUN` because a successful original Receive is required and the control forbids another Receive attempt.

## 43. AR Persisted Details

`AR_ASSET_DETAILS = NOT_RUN`; no new asset exists.

## 44. EN Persisted Details

`EN_ASSET_DETAILS = NOT_RUN`; no new asset exists.

## 45. Final DB Deltas

`BUSINESS_DELTA = 0` across the checked baseline tables. `LOOSE_DIAMOND` asset delta is `0`; `cash_transactions` delta is `0`; `idempotency_requests` delta is `0`.

## 46. Existing Unrelated P0

Preserved unchanged:

`JE-1787090870905`: debit `2133.21000000`, credit `2133.22000000`.

`PRE_EXISTING_P0_CHANGED = NO`.

## 47. P0 / P1

| Priority | Issue | Classification | Evidence | Impact |
|---|---|---|---|---|
| P0 existing | Unrelated journal imbalance | FINANCIAL | Same journal totals before/after | Existing financial integrity risk |
| P1 new | Controlled Loose Diamond retry returns 500; hidden internal exception not retained | BACKEND_RUNTIME_BUG / UNKNOWN | HTTP 500 request `333f5c19-1215-42a2-915c-ad1cdd743c40`; no business delta | Final user workflow remains open |

## 48. Gate

The proven optional-field persistence defect is fixed and its isolated regression passes. The single browser retry still failed with HTTP 500 and the underlying exception was not captured, so no final closure is claimed.

`GATE = FAIL_LOOSE_DIAMOND_500_FIX_CONTROLLED_RETRY`

`LOOSE_DIAMOND_FINAL_USER_WORKFLOW_CLOSED = NO`

`LOOSE_DIAMOND_MODULE_STATUS = OPEN`

## 49. Final Tokens

```text
CURRENT_CONTROL = DARFUS-LOOSE-DIAMOND-500-FORENSIC-MINIMUM-FIX-CONTROLLED-RETRY
LOCAL_MAIN_DB = darfus_erp
PRIOR_CONTROLLED_RETRY_HTTP = 500
RECEIVE_500_REQUEST_ID = 333f5c19-1215-42a2-915c-ad1cdd743c40
RECEIVE_500_STACK_TRACE = NOT_CAPTURED_FOR_BROWSER_REQUEST
RECEIVE_500_EXCEPTION_TYPE = UNKNOWN
RECEIVE_500_EXCEPTION_MESSAGE = An unexpected server error occurred.
LAST_SUCCESSFUL_RECEIVE_STAGE = UNKNOWN_FOR_BROWSER_RETRY; FULL_SYNTHETIC_ROUTE_REACHED_COMMIT_BARRIER
FIRST_FAILED_RECEIVE_STAGE = UNKNOWN_FOR_BROWSER_RETRY
FAILURE_FILE = UNKNOWN_FOR_BROWSER_RETRY
FAILURE_FUNCTION = UNKNOWN_FOR_BROWSER_RETRY
FAILURE_LINE = UNKNOWN_FOR_BROWSER_RETRY
FAILURE_OPERATION = UNKNOWN_FOR_BROWSER_RETRY
TRANSACTION_STARTED = YES
TRANSACTION_ROLLBACK = PASS
PARTIAL_BUSINESS_ROWS = 0
ROOT_CAUSE_500 = NOT_PROVEN_FOR_BROWSER_RETRY
ROOT_CAUSE_CLASSIFICATION = UNKNOWN
SAFE_REPRODUCTION = PASS_FOR_ISOLATED_MAPPING_DEFECT
SAME_EXCEPTION_REPRODUCED = YES_FOR_ISOLATED_MAPPING_DEFECT_ONLY
MINIMUM_SAFE_FIX = PASS_FOR_ISOLATED_MAPPING_DEFECT
MIGRATION_CREATED = NO
MIGRATION_EXECUTED = NO
EXACT_500_REGRESSION = PASS_FOR_PROVEN_STAGE_ONLY
FOCUSED_TESTS = PASS_12_OF_12
RELEVANT_REGRESSION = PASS_40_OF_40
TYPECHECK = PASS
AR_PREVIEW = PASS
EN_PREVIEW = PASS
PREVIEW_PARITY = PASS
DOUBLE_VAT = NO
UI_CLEANUP_REGRESSION = PASS
NEW_RETRY_REQUEST = YES
NEW_RETRY_IDEMPOTENCY_KEY = YES
EXACT_REQUEST_CAPTURED_BEFORE_POST = YES
PRE_RETRY_BACKUP = PASS
PRE_RETRY_BACKUP_PATH = backend/backups/darfus_erp_PRE_LOOSE_DIAMOND_500_FIX_RETRY_20260821_114531Z.dump
PRE_RETRY_BACKUP_SHA256 = 332D2AD84C99FFAC857DDD97994F402035E392D68BC77020A15C5ABB545550F9
BACKUP_PRECEDES_RETRY_POST = YES
CONTROLLED_RETRY_HTTP = 500
SUCCESSFUL_NEW_LOOSE_DIAMOND_RECEIVES = 0
PO = NONE
ASSET = NONE
BARCODE = NONE
JOURNAL = NONE
ONE_STONE_ONE_ASSET = NOT_PERSISTED
MOUNTED_COMPONENTS = 0_PERSISTED
MULTI_COLOR_PERSISTENCE = NOT_PERSISTED
PURCHASE_COST_PRETAX = 5000.00_PREVIEW_ONLY
CURRENT_VALUATION = NOT_PERSISTED
HISTORICAL_CURRENT_SEPARATION = PASS_PREVIEW_AND_ROLLBACK_ONLY
TAX_PARITY = PASS_PREVIEW_ONLY
SUPPLIER_PAYABLE = NOT_PERSISTED
PAYMENT_EXECUTED = NO
CASH_DELTA = 0
NEW_JOURNAL_BALANCE = NOT_PERSISTED; ROLLBACK_PIPELINE_BALANCED
BARCODE_DD_LOS_00 = NOT_PERSISTED
IDEMPOTENCY_EXACT_REPLAY = NOT_RUN
IDEMPOTENCY_CONFLICT = NOT_RUN
DUPLICATE_BUSINESS_ROWS = 0
AR_ASSET_DETAILS = NOT_RUN
EN_ASSET_DETAILS = NOT_RUN
PRE_EXISTING_UNRELATED_FINANCIAL_P0 = PRESENT_JE_1787090870905
PRE_EXISTING_P0_CHANGED = NO
ONLINE_PRODUCTION_CONTACTED = NO
P0_NEW = 0
P1_NEW = 1
GATE = FAIL_LOOSE_DIAMOND_500_FIX_CONTROLLED_RETRY
LOOSE_DIAMOND_FINAL_USER_WORKFLOW_CLOSED = NO
LOOSE_DIAMOND_MODULE_STATUS = OPEN
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 50. Stop

تم التوقف بعد Retry واحد فقط. لا Receive ثانٍ، لا Payment، لا RFID، لا Cleanup، لا تعديل يدوي للـDB، ولا بدء Gem Stone.

