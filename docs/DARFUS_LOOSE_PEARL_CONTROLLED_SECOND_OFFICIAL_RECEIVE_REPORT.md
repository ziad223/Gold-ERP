# DARFUS ERP — Controlled Second Official Loose Pearl Receive Report

تم تنفيذ بوابات ما قبل الاستلام والضغط الرسمي المصرح به مرة واحدة فقط. النتيجة كانت HTTP 500 من المسار canonical، لذلك توقفت فورًا دون Retry أو ضغط ثانٍ. فحص قاعدة البيانات بعد الفشل أثبت أن العملية تراجعت بالكامل ولم يحدث Partial Persistence أو Business Delta.

## 1. Executive Summary

- Control: `DARFUS-LOOSE-PEARL-CONTROLLED-SECOND-OFFICIAL-RECEIVE`
- Official target: `darfus_erp`
- Official attempt: 2 of 2 authorized attempts
- Confirm clicks: one
- Result: `HTTP 500`
- Business delta after failure: `0`
- Third attempt: not authorized and not run
- Final gate: `BLOCKED_LOOSE_PEARL_SECOND_OFFICIAL_RECEIVE`

The receive workflow is not closed. No source fix, migration, seed, cleanup, reversal, or historical journal remediation was performed.

## 2. Owner Authorization

The supplied Control explicitly authorized one controlled second Official Loose Pearl receive against `darfus_erp`. The action-time confirmation was received immediately before the click. No automatic retry was used.

## 3. Prior Runtime Pass

The prerequisite Disposable Clone control was read and accepted:

- Clone receive: 201
- Deterministic receipt ordinal: 1
- `NAN_REACHED_SQL = NO`
- Auth/company/branch context: proven
- Exact replay and changed-payload conflict: proven on the clone
- Official database was not written by that clone control

Evidence: `backend/acceptance-artifacts/loose-pearl/DARFUS-LOOSE-PEARL-CLONE-AUTH-CONTEXT-RECOVERY-AND-RUNTIME-PROOF/`.

## 4. Frozen Closed Problems

The control’s closed decisions were not reopened:

- `LP003 = CLOSED` before the attempt
- `LP-LESSON-002 = CLOSED_WITH_RUNTIME_PROOF` before the attempt
- NaN ordinal source fix remained unchanged
- Super Admin company-context support remained unchanged
- Historical 0.01 accounting exception remained scoped to its existing journal only

## 5. Prevention Gates

| Gate | Result | Evidence |
|---|---|---|
| Stored line balance before posting | PASS | Existing focused tests and preflight |
| Legacy 0.01 tolerance active | NO | Source/test evidence |
| Ordinal finite/integer/positive | PASS prerequisite | NaN prevention test, 6/6 |
| NaN rejected before SQL | PASS prerequisite | NaN prevention test |
| LP003 color gate | PASS prerequisite | Loose Pearl tests, 7/7 |
| Scoped historical accounting baseline | PASS | Exactly one known unbalanced journal |

## 6. Backup

Fresh backup was created immediately before the final attempt:

- Path: `backend/acceptance-artifacts/loose-pearl/DARFUS-LOOSE-PEARL-CONTROLLED-SECOND-OFFICIAL-RECEIVE/darfus_erp_official_controlled_second_attempt_final_20260822_232946.dump`
- Size: `713995` bytes
- SHA-256: `D2FF658CDA0AA79E119652ED952FF99F58EE71D34C29629F07BA59F42F334166`
- `pg_restore --list`: PASS, exit 0

## 7. Official DB Baseline

Read-only identity: `current_database() = darfus_erp`.

| Entity | Before attempt |
|---|---:|
| purchase_orders | 13 |
| purchase_order_items | 13 |
| assets | 13 |
| LOOSE_PEARL assets | 0 |
| asset_components | 10 |
| asset_pearl_component_details | 1 |
| asset_origins | 13 |
| asset_purchase_cost_revisions | 13 |
| asset_current_valuations | 13 |
| inventory_asset_movements | 13 |
| asset_barcode_history | 13 |
| purchase_order_item_asset_links | 13 |
| journal_entries | 16 |
| journal_lines | 45 |
| idempotency_requests | 17 |
| cash_transactions | 3 |

Evidence: `backend/acceptance-artifacts/loose-pearl/DARFUS-LOOSE-PEARL-CONTROLLED-SECOND-OFFICIAL-RECEIVE/04-official-db-baseline.json`.

## 8. First Attempt Zero-Delta Recheck

The first failed request (`70e0c2c4-f4e1-48f8-94da-f5e5c5b5`) remained at HTTP 500 with zero persistent business delta. The pre-retry database still contained zero Loose Pearl assets and the recorded baseline counts were unchanged.

## 9. Scoped Historical Accounting Baseline

Before and after the second attempt, the only unbalanced posted journal was:

`JE-1787090870905`: debit `2133.21`, credit `2133.22`.

All other posted journals were balanced. No historical remediation was performed.

## 10. Auth/Company/Branch Context

Pre-confirm context passed:

- Authenticated: YES
- Super Admin: YES
- Company: Gold ERP, exact approved company context
- Branch: Branch-1, exact approved branch context
- Supplier: `SUP-001`
- Location: approved active DB location scoped to the company and branch
- Operational readiness: READY

No raw credential, password, cookie, or auth token was exported or placed in the report.

## 11. UI Pre-Confirm

The real UI path was used:

`Inventory → Add / Receive Inventory → Loose Pearl`

Pre-confirm checks passed:

- Labels visible
- Pearl Size visible
- Pearl Color visible
- No undefined labels
- No internal master IDs shown as user labels
- Confirm button enabled only after valid data
- Diagnostics ON
- Request interception OFF

The first browser tab became stale before any click; DB/log verification proved no POST occurred. A fresh tab was opened and the form was re-prepared. This did not create an additional Official attempt.

## 12. Preview

Profile and shared previews were READY:

| Value | Actual |
|---|---:|
| Purchase base pre-tax | 100.00000000 |
| Purchase VAT | 14.00000000 |
| Purchase total | 114.00000000 |
| Current base | 120.00000000 |
| Current VAT | 16.80000000 |
| Current total | 136.80000000 |
| Configured VAT rate | 14% |

The active tax rate was read from company settings; no VAT setting was changed.

## 13. Exact Request

The production diagnostics panel captured the exact request used by the single click. It contained:

- profile: `LOOSE_PEARL`
- quantity: `1`
- `perPiece.length`: `1`
- purchase cost: `100.00000000`
- current value: `120.00000000`
- selling price: `200.00000000`
- pearl color: `Black`
- `taxIncluded = false`
- `applyVat = true`
- `inventoryV2 = true`

The exact body is preserved in `10-exact-request.json`; the idempotency key is preserved only in the acceptance artifact for replay forensic use and is not repeated here.

## 14. Business Hash

The real production canonicalization was used:

- Scope: `purchase.receive`
- Algorithm: existing `idempotency.service.hashRequest`
- Key excluded from hash: YES
- Business hash artifact: `11-business-hash.json`

## 15. Auth Freshness

Auth/company/branch context was valid during the final pre-confirm screen and the request used the same approved context. The result was not an auth failure; Backend reached the canonical receive route and returned HTTP 500.

## 16. Observability

- Diagnostics: ON
- Request interception: OFF
- Backend request ID: `f757c8d1-1553-42e9-87e2-01f653f37611`
- Browser UI message: `An unexpected server error occurred.`

## 17. Browser Dispatch Chain

Observed chain:

`Confirm Receive click → POST /api/v1/purchase-orders/receive → HTTP 500 → UI error`

Exactly one click was performed on the fresh tab. No second click occurred.

## 18. Backend Request

| Field | Actual |
|---|---|
| Method | POST |
| Endpoint | `/api/v1/purchase-orders/receive` |
| HTTP | 500 |
| Request ID | `f757c8d1-1553-42e9-87e2-01f653f37611` |
| Server message | `An unexpected server error occurred.` |
| Retry | NOT RUN |

The current structured container log did not expose a lower-level exception. Root cause remains `UNKNOWN` and requires a separate read-only forensic control; no automatic fix was attempted.

## 19. Second Official Receive

`OFFICIAL_RECEIVE_ATTEMPT_2 = FAIL_500`.

The attempt did not produce a successful transaction. The control’s failure governance was applied immediately: stop, reconcile read-only, no third attempt.

## 20. Business Chain

Not created. Post-failure counts equal the pre-attempt baseline:

- PO: 0 delta
- PO item: 0 delta
- Asset: 0 delta
- Loose Pearl asset: 0 delta
- Pearl detail: 0 delta
- Origin: 0 delta
- Cost revision: 0 delta
- Current valuation: 0 delta
- Movement: 0 delta
- Barcode history: 0 delta
- Receipt link/evidence: 0 delta
- Journal: 0 delta
- Idempotency success record: 0 delta
- Cash: 0 delta

## 21. Receipt Evidence Ordinal

Official ordinal persistence could not be proven because the receive failed before a committed transaction existed. No NaN reached SQL was observed in this attempt, and the precondition was proven in the Disposable Clone. Official closure token remains NOT CONFIRMED.

## 22. Asset/Barcode

No new Asset or Barcode was created. `LOOSE_PEARL assets = 0` after the failed attempt. No Product fallback or POS readback was executed after failure.

## 23. Pearl Color / LP003

The prepared request contained `pearlColor = Black`. Official persistence/readback could not be proven because HTTP 500 prevented a committed Asset. LP003 was PASS before the attempt but is not marked newly confirmed on Official DB.

## 24. Historical Cost

The prepared historical purchase base was `100.00000000` pre-tax. No purchase-cost revision was persisted; the database count remained 13.

## 25. Current Valuation

The prepared current valuation base was `120.00000000`, VAT `16.80000000`, total `136.80000000`. No current valuation row was persisted; the database count remained 13.

## 26. Tax

Preview tax was dynamic and correct for the active 14% policy. Official persistence and application-count proof were not reached because the canonical receive returned HTTP 500. No tax setting was changed.

## 27. Accounting

No new journal was created. The only unbalanced posted journal remained the scoped historical exception `JE-1787090870905`; no second unbalanced journal appeared.

## 28. Post-Receive Journal Scan

Post-failure scan:

- Total unbalanced posted journals: 1
- Unbalanced IDs: `[JE-1787090870905]`
- All new/other unbalanced journals: 0
- New Loose Pearl journal difference: not applicable; no new journal

## 29. Supplier/AP

No PO or payable was created. Supplier balance/cash/treasury were not mutated. No payment was created.

## 30. AR Readback

Not run after failure because no Asset ID existed. The pre-confirm UI was English; no additional mutating or retry action was taken to obtain an AR readback.

## 31. EN Readback

Pre-confirm English UI passed the required labels and preview. Post-receive Asset readback was not applicable because HTTP 500 created no Asset.

## 32. POS Read-only

Not run after failure because no new barcode existed. No checkout was executed.

## 33. Idempotency Exact Replay

Not run. The exact request and key were preserved, but the control authorizes replay only after successful Official 201. Because the first Official attempt returned 500, replay would violate the failure stop condition.

## 34. Idempotency Conflict

Not run for the same reason. No same-key changed-payload request was sent after the failed Official attempt.

## 35. Final DB Reconciliation

Read-only after the 500 showed exact equality with the baseline:

`BUSINESS_DELTA = 0`

No partial persistence was observed. Evidence: `32-final-db-reconciliation.json`.

## 36. Final Integrity

- Duplicate business effect: 0
- Orphan effect from this attempt: 0 observed
- Cash delta: 0
- New journal difference: not applicable
- Known historical unbalanced journals: exactly 1
- Other unbalanced journals: 0
- Loose Pearl assets: 0

## 37. Relevant Regression

Read-only focused regressions completed before the official attempt:

| Suite | Result |
|---|---|
| NaN ordinal prevention | 6/6 PASS |
| Loose Pearl minimum-safe implementation | 7/7 PASS |
| Loose Pearl label audit | 3/3 PASS |
| Asset final closure | 9/9 PASS |
| Barcode final closure | 11/11 PASS |
| G2C receive tax/location | 4/4 PASS |
| G2A2 transaction tax | 10/10 PASS |
| G3 PO tax precision | 2/2 PASS |
| Diamond corrective contract regression | 5/5 PASS |
| Supplier asset-profile preview | 4/4 PASS |

No build, migration, seed, source fix, or unrelated suite was run.

## 38. Delivery/Reset Safety

This local main DB remains integration/test data. It must be reset before customer delivery. A fresh customer DB and separate fresh server DB must have zero unbalanced posted journals and no synthetic business data. The local historical exception and synthetic acceptance data must not be promoted.

The successful-transaction cleanup rule was not invoked because no successful Official transaction exists from Attempt 2.

## 39. P0/P1/P2

| Priority | Count | Issue |
|---|---:|---|
| P0 | 0 | No data loss or persistent corruption observed |
| P1 | 1 | Canonical Official Loose Pearl receive is blocked by HTTP 500; root cause not exposed by current log |
| P2 | 0 | No additional issue established |

Classification: `PRODUCT_DEFECT_OR_RUNTIME_UNKNOWN`, not enough evidence to distinguish product defect from runtime/environment cause. No source fix is authorized by this Control.

## 40. Gate

`GATE = BLOCKED_LOOSE_PEARL_SECOND_OFFICIAL_RECEIVE`

The success gate cannot be used because the required HTTP 201 was not achieved. Loose Pearl and Stage A remain not closed.

## 41. Final Tokens

```text
CURRENT_CONTROL = DARFUS-LOOSE-PEARL-CONTROLLED-SECOND-OFFICIAL-RECEIVE
LOCAL_MAIN_DB = darfus_erp
OWNER_AUTHORIZATION = ONE_CONTROLLED_SECOND_OFFICIAL_LOOSE_PEARL_RECEIVE
FAILED_ATTEMPT_1_HTTP = 500
FAILED_ATTEMPT_1_PERSISTENT_DELTA = 0
LP_LESSON_002 = CLOSED_WITH_RUNTIME_PROOF
LP003 = CLOSED_BEFORE_ATTEMPT; OFFICIAL_RECONFIRMATION_NOT_REACHED
P0_BEFORE = 0
P1_BEFORE = 0
P2_BEFORE = 0
BACKUP = PASS
BACKUP_SHA256 = D2FF658CDA0AA79E119652ED952FF99F58EE71D34C29629F07BA59F42F334166
BASELINE_UNBALANCED_IDS = [JE-1787090870905]
ALL_OTHER_BASELINE_UNBALANCED = 0
AUTH_FRESHNESS = PASS_PRE_CONFIRM
COMPANY_CONTEXT = PASS
BRANCH_CONTEXT = PASS
SUPPLIER_CONTEXT = PASS
LOCATION_CONTEXT = PASS
PROFILE_PREVIEW = READY
SHARED_PREVIEW = READY
EXACT_REQUEST_CAPTURE = PASS
BUSINESS_HASH = PASS
DIAGNOSTICS = ON
REQUEST_INTERCEPTION = OFF
OFFICIAL_ATTEMPT_NUMBER = 2
OFFICIAL_RECEIVE_HTTP = 500
REQUEST_ID = f757c8d1-1553-42e9-87e2-01f653f37611
PO_ID = NONE
ASSET_ID = NONE
BARCODE = NONE
JOURNAL_ID = NONE
RECEIPT_EVIDENCE_ID = NONE
RECEIPT_EVIDENCE_ORDINAL = NOT_PERSISTED
ORDINAL_IS_FINITE = NOT_APPLICABLE_OFFICIAL
ORDINAL_IS_INTEGER = NOT_APPLICABLE_OFFICIAL
NAN_REACHED_SQL = NOT_OBSERVED
ONE_PHYSICAL_PEARL_ONE_ASSET = NOT_CREATED; NO_DELTA
PEARL_COLOR_PERSISTENCE = NOT_REACHED
HISTORICAL_COST = PREPARED_ONLY; NOT_PERSISTED
CURRENT_VALUATION = PREPARED_ONLY; NOT_PERSISTED
TAX_APPLICATION_COUNT = NOT_REACHED
ACCOUNTING = NO_NEW_JOURNAL; BASELINE_PRESERVED
NEW_JOURNAL_DIFFERENCE = NOT_APPLICABLE
FINAL_UNBALANCED_POSTED_IDS = [JE-1787090870905]
ALL_NEW_OR_OTHER_UNBALANCED = 0
SUPPLIER_AP = NO_NEW_PO_OR_PAYABLE
CASH_DELTA = 0
AR_READBACK = NOT_RUN_AFTER_FAILURE
EN_READBACK = PRE_CONFIRM_ONLY
POS_READ_ONLY = NOT_RUN_AFTER_FAILURE
IDEMPOTENCY_EXACT_REPLAY = NOT_RUN
IDEMPOTENCY_CHANGED_PAYLOAD_409 = NOT_RUN
DUPLICATE_BUSINESS_EFFECT = 0
RELEVANT_REGRESSION = PASS
OFFICIAL_SUCCESSFUL_DISTINCT_RECEIVE_COUNT = 0
THIRD_OFFICIAL_ATTEMPT = NO
AUTOMATIC_RETRY_COUNT = 0
P0_COUNT = 0
P1_COUNT = 1
P2_COUNT = 0
LOOSE_PEARL_MODULE_STATUS = NOT_CLOSED
STAGE_A_STATUS = NOT_CLOSED
GATE = BLOCKED_LOOSE_PEARL_SECOND_OFFICIAL_RECEIVE
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_OF_HTTP_500_READ_ONLY_ROOT_CAUSE_CONTROL
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 42. STOP

STOP completed after read-only reconciliation.

- No third Official receive
- No automatic retry
- No source fix
- No historical journal remediation
- No Stage B start
- No database reset
- No deployment
- No production contact

Owner review is required before any separate forensic/root-cause control. The failed Attempt 2 did not create business records and remains preserved as failure evidence.
