# DARFUS ERP — Inventory Count Eligibility Reason & Lifecycle Visibility

Control ID: `DARFUS-INVENTORY-COUNT-ELIGIBILITY-REASON-LIFECYCLE-VISIBILITY-01`

## 1. Executive Summary

تم تنفيذ هذا الـControl كفحص Forensic ثم Minimum Safe Fix محدود. لم يتم إنشاء Count جديد، ولم يتم Scan أو Complete أو Close على `darfus_erp` في هذا الـControl.

النتيجة المثبتة: الباركود `GWRNG21000002` يخص Asset مباعة حاليًا، وكانت ضمن Frozen Count Snapshot قبل بيعها. الحارس server-side صحيح، لكن العقد القديم كان يخفي السبب وراء رسالة عامة `STATE_CONFLICT`. تمت إضافة reason contract مستقر وعرض منفصل لنتيجة الجرد وحالة الـAsset الحالية، مع AR/EN copy، بدون تخفيف الحارس أو تعديل Snapshot أو Asset.

## 2. Owner Clarification on Prior Manual Mutations

| Finding | Result |
|---|---|
| Prior observe/complete POSTs | Owner-confirmed manual actions |
| Unexpected mutation incident attribution | Resolved by Owner clarification |
| Current Control initiated scan/create/complete/close | No |
| Main DB business mutation by this Control | 0 |

الإجراءات اليدوية السابقة لم تُنسب إلى المنتج في هذا التقرير، ولم يتم استكمال forensic attribution لها.

## 3. Official DB Read-only Baseline

| Check | Evidence | Result |
|---|---|---|
| Database identity | `SELECT current_database()` | `darfus_erp` |
| `stock_audits` | SELECT count | 4 |
| `stock_audit_items` | SELECT count | 15 |
| `assets` | SELECT count | 18 |
| `inventory_asset_movements` | SELECT count | 60 |
| `journal_entries` | SELECT count | 25 |
| `asset_events` | SELECT count | 63 |
| `idempotency_requests` | SELECT count | 70 |

تمت مقارنة نفس tuple بعد Clone proof وبعد Browser read-only، وبقيت القيم كما هي. توجد لقطة تاريخية أقدم تشير إلى `journal_entries=24`؛ لا تُنسب هذه الزيادة لهذا الـControl لأن هذا الـControl لم ينفذ أي main write، وOwner سبق أن أكد وجود إجراءات يدوية.

## 4. Current Count

| Field | Value |
|---|---|
| Count number | `COUNT-20260823080206-38a95c8e` |
| DB ID | `IMAUD-982efb549fe840b5a0aec4c12c` |
| Status | `in-progress` |
| Company | `COMP-48ab554f-427e-4642-9419-bc8616c2dc36` |
| Canonical Branch | Branch-2 / `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c` |
| Canonical Location | `QA-G2C-RECEIVE-LOCATION-01` / `LOC-9a10f58e-4207-4512-8824-7a7b06159151` |
| Created | `2026-08-23 08:02:06.985+00` |
| Started | No dedicated column; first frozen item created `2026-08-23 08:02:07.015+00` |
| Frozen expected | 13 |
| Matched | 2 |
| Missing/currently unobserved | 11 |
| Unexpected | 0 |
| Variance | 11 |

## 5. Failed Barcode Asset

| Field | Actual evidence |
|---|---|
| Barcode | `GWRNG21000002` |
| Asset ID | `AST-PUR-1787085524749-1-1-dww3` |
| `assets.status` | `sold` |
| `operational_status` | `SOLD` |
| Canonical Branch | Branch-2 via `branch_id` |
| Canonical Location | `QA-G2C-RECEIVE-LOCATION-01` via `location_id` |
| Denormalized `assets.branch` | `Branch-1` — inconsistent display field; canonical ID wins |
| Source/origin | `supplier_purchase`, `asset_origins.origin_type=PURCHASE_ORDER`, PO `PO-1787085524743` |
| Supplier | `SUP-001` |
| Sale link | Invoice `INV-2026-000001`, status `paid` |
| Transfer link | No row found |
| Workshop link | No row found |
| Latest lifecycle event | `SALE`, `AVAILABLE → SOLD`, `2026-08-23 09:46:01.022+00` |
| Latest inventory movement | `SALE`, same invoice, `2026-08-23 09:46:01.022+00` |

## 6. Successful Barcode Comparator

| Field | Failed | Successful comparator |
|---|---|---|
| Barcode | `GWRNG21000002` | `PLRNG18000001` |
| Asset ID | `AST-PUR-1787085524749-1-1-dww3` | `AST-PUR-1787391626468-1-1-wf0w` |
| Current status | `SOLD` | `AVAILABLE` |
| Branch | Branch-2 | Branch-2 |
| Location | `QA-G2C-RECEIVE-LOCATION-01` | `QA-G2C-RECEIVE-LOCATION-01` |
| In frozen set | YES | YES |
| Count result | `missing`, result NULL | `matched`, `MATCHED` |
| Observe evidence | No accepted row for failed barcode | `BARCODE_SCAN`, observed `2026-08-23 21:59:51.949+00` |

## 7. Frozen Snapshot Membership

`GWRNG21000002` is proven to be in the frozen expected set:

| Field | Value |
|---|---|
| Frozen item ID | `IMAUDITEM-14bef91970c34e73a36c95eef1` |
| Asset ID | `AST-PUR-1787085524749-1-1-dww3` |
| Frozen barcode | `GWRNG21000002` |
| Item status | `missing` |
| Result | NULL; not overwritten by the rejection |
| Snapshot item created | `2026-08-23 08:02:07.015+00` |
| Observed at | NULL |
| Scan method | NULL |

## 8. Timeline

| Event | Time | Evidence |
|---|---:|---|
| Count created | `08:02:06.985` | `stock_audits.created_at` |
| Count started/snapshot proxy | `08:02:07.015` | first `stock_audit_items.created_at` |
| Failed Asset sold | `09:46:01.022` | `asset_events.SALE` and inventory movement |
| Failed scan attempts in historical log | `21:59:32`, `21:59:33`, later retries | Backend log `409 STATE_CONFLICT`; actions were Owner-confirmed manual |
| Current Control failed scan attempt | Not run | Main mutation firewall respected |

Classification:

`ASSET_STATE_CHANGE_RELATIVE_TO_COUNT = AFTER_COUNT_START`

This is not a pre-ineligible snapshot case. The Asset was eligible when the snapshot was created and became SOLD later.

## 9. Eligibility Rule Trace

Canonical implementation: `backend/src/services/inventory-audit-canonical.service.js`.

The actual order is:

1. Resolve Asset by company-scoped ID/barcode/RFID.
2. Reject `SOLD`, `MELTED`, or `MISSING` before observation.
3. Reject canonical Branch mismatch.
4. Reject canonical Location mismatch.
5. Reject Asset absent from the frozen expected set.
6. Only then update the frozen row to `matched/MATCHED`.

For `GWRNG21000002`, the first applicable branch is the lifecycle guard:

`operationalStatus=SOLD → Scanned Asset is not count-eligible.`

`GUARD_CORRECT_FOR_CURRENT_DATA = YES`

## 10. Backend Reason Contract

### Before the fix

| Field | Actual |
|---|---|
| HTTP | 409 |
| Error code | `STATE_CONFLICT` |
| Message | `Scanned Asset is not count-eligible.` |
| Stable reason code | Not present |
| Safe current status/details | Not present |

The server knew the status internally through `asset.operationalStatus`, but `ConflictError` carried no details and the canonical error contract previously normalized only numeric/boolean details.

### After the fix

The same `STATE_CONFLICT` is preserved, with safe details such as:

`reasonCode=ASSET_SOLD`, `assetId`, `barcode`, `currentOperationalStatus`, `currentBranchId`, and `currentLocationId`.

Proven rejection codes:

`ASSET_SOLD`, `ASSET_MELTED`, `ASSET_MISSING`, `ASSET_BRANCH_MISMATCH`, `ASSET_LOCATION_MISMATCH`, `ASSET_NOT_IN_FROZEN_SET`.

No SQL/model names or sensitive values are exposed.

## 11. Frontend Data Authority

Before the fix, the Count GET already returned nested Asset data, but the page type kept only `id/barcode`; scan catch displayed the raw generic message. Therefore:

`FRONTEND_CAN_DERIVE_REASON_SAFELY_BEFORE_FIX = NO`

After the fix, the frontend consumes server `details.reasonCode`, uses server Asset status, keeps Count result separate, and displays a non-destructive rejection card. It does not infer eligibility or make an Asset countable.

## 12. Root Cause

| Class | Proven finding | Severity |
|---|---|---|
| `IC-ELIG-C` | Asset changed from AVAILABLE to SOLD after snapshot; frozen row correctly remained | P2 |
| `IC-ELIG-A` | Correct guard had poor reason visibility | P2 |
| `IC-ELIG-J` | Distinct lifecycle/scope branches collapsed into generic conflict messages | P2 |
| `IC-ELIG-I` | Frontend lost the canonical reason and showed generic error only | P2 |

`ROOT_CAUSE_PROVEN = YES`.

No `IC-ELIG-G` or `IC-ELIG-H` was found. The Asset was not proven eligible at scan time.

## 13. Minimum Safe Design

- Keep the server-side eligibility guard and frozen snapshot unchanged.
- Return a stable safe reason code in `STATE_CONFLICT.details`.
- Show Count evidence result separately from current Asset lifecycle.
- Show current status and lifecycle-changed-after-snapshot note where proven by timestamps.
- Map reason codes to Arabic/English business copy.
- Do not create an observation row after rejection.
- Do not retry automatically, adjust inventory, or change accounting.

## 14. Source Changes

| File | Change | Evidence |
|---|---|---|
| `backend/src/utils/errors.js` | `ConflictError` accepts safe details | `ConflictError(..., details)` |
| `backend/src/utils/error-contract.js` | Safe bounded string details are serialized | `normalizeDetails` |
| `backend/src/services/inventory-audit-canonical.service.js` | Stable reasons added to existing rejection branches; guard unchanged | `eligibilityConflict`, lines 15–20, 101–117 |
| `backend/src/routes/erp.routes.js` | Read model marks `lifecycleChangedAfterSnapshot`; no Count totals/state mutation | `inventoryCountReadModel`, lines 6093–6101 |
| `app/[locale]/(dashboard)/inventory/stock-audit/page.tsx` | AR/EN current lifecycle column, note, and non-destructive reason panel | `scanRejection`, `lifecycleLabel`, table columns |
| `backend/tests/inventory-count-eligibility-reason.test.cjs` | Focused contract and UI/source tests | 5 tests |
| `backend/scripts/inventory-count-eligibility-clone-proof.cjs` | Disposable clone-only runtime harness | Source/clone identity guarded |

No migration was created. No business rule, Product quantity authority, Asset state, accounting, or Count snapshot was changed.

## 15. Disposable Environment

Clone used:

`darfus_erp_count_eligibility_1787524074645`

Proof:

`SELECT current_database()` returned the exact clone name before tests. The clone was restored from an official read-only dump. The first restore attempt was stopped before tests because the PostgreSQL 18 restore utility emitted an unsupported `transaction_timeout` statement for PostgreSQL 16; the retry used a temporary plain SQL restore with that utility-only statement removed. No source or official DB change resulted.

`DISPOSABLE_CLONE_DROPPED = YES`.

## 16. Controlled Reproduction

| Case | Result | DB side effect in clone |
|---|---|---|
| SOLD `GWRNG21000002` | 409, `STATE_CONFLICT`, `ASSET_SOLD` | Frozen row stayed `missing/NULL` |
| Eligible `GPRNG21000003` | Observe succeeded | Transaction rolled back; no persisted clone delta |
| Replay same eligible Asset | `replayed=true` | One frozen row only |
| Different Branch Asset | `ASSET_BRANCH_MISMATCH` | No observation |
| Different Location Asset | `ASSET_LOCATION_MISMATCH` | No observation |

## 17. Snapshot Timing Test

PASS based on the real cloned evidence:

`asset.updated_at = 2026-08-23 09:46:01.024+00` is after the frozen item timestamp `2026-08-23 08:02:07.015+00`. The frozen row remained present and unchanged while the current status was exposed separately. No new lifecycle mutation was created for this test.

## 18. Focused Tests

| Test | Result |
|---|---|
| `backend/tests/inventory-count-eligibility-reason.test.cjs` | 5/5 PASS |
| `backend/tests/stage-b-b3-inventory-count.test.cjs` | 24/24 PASS |
| `tests/inventory-count-active-session-discovery.test.cjs` | 5/5 PASS |
| Combined result | 34/34 PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |

## 19. AR Browser

Read-only authenticated Browser proof on `/ar/inventory/stock-audit`:

- Branch-2 selected through the context selector.
- Current Count opened through GET-only `Open current Count`.
- `GWRNG21000002` rendered as `غير معدود` in Count result.
- The same row rendered `مباعة` as current lifecycle.
- The same row rendered `تغيرت الحالة بعد تثبيت قائمة الجرد`.
- `PLRNG18000001` rendered as `متطابق` and `متاحة`.
- No Scan/Complete/Close/Create action was invoked.

`AR_LOCALIZATION = PASS`.

## 20. EN Browser

Read-only authenticated Browser proof on `/en/inventory/stock-audit`:

- `GWRNG21000002` rendered as `EXPECTED_NOT_COUNTED`.
- Current lifecycle rendered as `Sold`.
- Lifecycle note rendered as `Lifecycle changed after the Count snapshot`.
- `PLRNG18000001` rendered as `EXPECTED_AND_COUNTED` and `Available`.
- No mutation action was invoked.

`EN_LOCALIZATION = PASS`.

## 21. Main No-Mutation Proof

Official Browser and logs for this Control showed GET requests only for locations, active Counts, closed Counts, and Count detail. No `POST /inventory-v2/audits/*` was made by this Control.

The failed barcode was not retried on `darfus_erp`.

`OFFICIAL_ACCEPTANCE_MUTATION_COUNT = 0`

## 22. Other Module Regression

The change is isolated to the Count rejection/error contract and Count read model/UI. Existing Count authority tests continued to pass, including permissions, scope, idempotency, frozen membership, no Asset transition, no Product quantity authority, and legacy route blocking.

No POS, Transfer, Workshop, Supplier, Customer, or Accounting mutation was run.

`OTHER_MODULE_READ_ONLY_REGRESSION = PASS` for the impacted authority surface; broad transactional acceptance was intentionally outside this Control.

## 23. Data Integrity

| Assertion | Result |
|---|---|
| Official Count item count changed | 0 |
| Official Asset status changed | 0 |
| Official inventory movement delta | 0 |
| Official journal delta during this Control | 0 |
| Official Count create/scan/complete/close | 0 |
| Clone duplicate observation | 0; one frozen row remained |
| Clone failed rejection row write | 0 |
| Clone dropped | YES |

## 24. Prevention Lessons

| Lesson | Result |
|---|---|
| LL-037 — eligibility rejection must explain business reason | PASS: stable reason codes and localized mapping |
| LL-038 — Count evidence and current lifecycle are separate | PASS: frozen result unchanged; current state separate |
| LL-039 — pre-ineligible Asset must not enter snapshot | NOT APPLICABLE to this case; the Asset became SOLD after snapshot, and start logic excludes SOLD/MELTED/MISSING |

## 25. Remaining Risks

1. The failed Asset has inconsistent denormalized `assets.branch=Branch-1` while canonical `branch_id` resolves to Branch-2. The Count guard correctly uses canonical IDs; this remains a DB/display consistency risk and was not changed.
2. The UI reason panel was not triggered on official DB because the Control forbids a main retry. Its backend contract was proven on the disposable clone and its AR/EN mapping was proven by focused tests.
3. A separate empty active Count exists in Branch-2 (`COUNT-20260823173908-b1b1852e`); it was not modified.

## 26. Gate

| Gate item | Result |
|---|---|
| Root cause proven | PASS |
| Failed status and frozen membership proven | PASS |
| Rejection rule proven | PASS |
| Guard preserved | PASS |
| Reason contract visible | PASS via clone runtime + UI mapping |
| Current lifecycle visible | PASS |
| Count result separate | PASS |
| AR/EN localization | PASS/PASS |
| Eligible/ineligible/reason clone tests | PASS |
| Frozen snapshot preserved | PASS |
| Official mutation count | 0 |
| P0 | 0 |
| P1 blocking | 0 |

`GATE = PASS_INVENTORY_COUNT_ELIGIBILITY_REASON_LIFECYCLE_VISIBILITY`

## 27. Final Tokens

```text
CURRENT_CONTROL = DARFUS-INVENTORY-COUNT-ELIGIBILITY-REASON-LIFECYCLE-VISIBILITY-01
OFFICIAL_DATABASE = darfus_erp
OWNER_CONFIRMED_PRIOR_OBSERVE_COMPLETE = MANUAL

FAILED_BARCODE = GWRNG21000002
FAILED_ASSET_ID = AST-PUR-1787085524749-1-1-dww3
FAILED_ASSET_CURRENT_STATUS = SOLD
FAILED_ASSET_BRANCH = Branch-2 / BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c
FAILED_ASSET_LOCATION = QA-G2C-RECEIVE-LOCATION-01 / LOC-9a10f58e-4207-4512-8824-7a7b06159151
FAILED_ASSET_IN_FROZEN_SET = YES
COUNT_ID = IMAUD-982efb549fe840b5a0aec4c12c
COUNT_STATUS = in-progress
COUNT_CREATED_AT = 2026-08-23 08:02:06.985+00
COUNT_STARTED_AT = 2026-08-23 08:02:07.015+00 (first frozen item proxy)
ASSET_STATE_CHANGE_RELATIVE_TO_COUNT = AFTER_COUNT_START
FAILED_BARCODE_REJECTED_BY_RULE = SOLD lifecycle guard in canonical observeAudit
GUARD_CORRECT_FOR_CURRENT_DATA = YES

SUCCESS_BARCODE = PLRNG18000001
SUCCESS_ASSET_ID = AST-PUR-1787391626468-1-1-wf0w
SUCCESS_COMPARE_RESULT = AVAILABLE, same Branch/Location, frozen MATCHED

SERVER_REASON_AVAILABLE_INTERNALLY = YES
SERVER_REASON_EXPOSED_TO_CLIENT = NO before fix / YES after fix
FRONTEND_CAN_DERIVE_REASON_SAFELY = NO before fix / YES with server reason contract after fix
ROOT_CAUSE_CLASS = IC-ELIG-C + IC-ELIG-A + IC-ELIG-J + IC-ELIG-I
ROOT_CAUSE = Correct SOLD guard after snapshot lifecycle change, with generic reason and missing lifecycle presentation
GUARD_CHANGED = NO
BACKEND_ERROR_CONTRACT_CHANGED = YES, additive safe details only
FRONTEND_VISIBILITY_CHANGED = YES

MIGRATION_CREATED = NO
DISPOSABLE_DB = darfus_erp_count_eligibility_1787524074645
DISPOSABLE_REPRO = PASS
ELIGIBLE_SCAN_REGRESSION = PASS
INELIGIBLE_SCAN_REJECTION = PASS
FROZEN_SNAPSHOT_PRESERVED = PASS
AR_LOCALIZATION = PASS
EN_LOCALIZATION = PASS

OFFICIAL_ACCEPTANCE_MUTATION_COUNT = 0
MAIN_COUNT_CREATED = 0
MAIN_COUNT_SCANNED = 0
MAIN_COUNT_COMPLETED = 0
MAIN_COUNT_CLOSED = 0
MAIN_ASSET_STATE_DELTA = 0
MAIN_MOVEMENT_DELTA = 0
MAIN_ACCOUNTING_DELTA = 0
MAIN_BUSINESS_WRITE_DELTA = 0

LL_037 = PASS
LL_038 = PASS
LL_039 = NOT_APPLICABLE

P0_COUNT = 0
P1_BLOCKING_COUNT = 0
P2_COUNT = 1
P3_COUNT = 0
GATE = PASS_INVENTORY_COUNT_ELIGIBILITY_REASON_LIFECYCLE_VISIBILITY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

توقف هنا. لا Main Scan، ولا Complete، ولا Close، ولا Count جديد، ولا Asset/Accounting mutation، ولا Batch تالٍ تلقائيًا.
