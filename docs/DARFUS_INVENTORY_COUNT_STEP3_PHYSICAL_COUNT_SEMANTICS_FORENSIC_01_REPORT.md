# DARFUS ERP — Inventory Count Step 3 Physical Count Semantics Forensic

Control ID: `DARFUS-INVENTORY-COUNT-STEP3-PHYSICAL-COUNT-SEMANTICS-FORENSIC-01`  
Master stage: `INVENTORY_COUNT_STABILIZATION`  
Master step: `3_OF_8`  
Mode: Read-only forensic closure

## 1. Executive Summary

تمت مراجعة معنى العدّ الفعلي في المصدر، الاختبارات، تقرير Step 3 السابق، وبيانات Counts الرسمية قراءة فقط. النتيجة: لا يوجد دليل على أن `Complete()` يطابق العناصر غير المرصودة تلقائيًا.

الفجوة كانت في عرض الدليل السابق: تم تسجيل Observe ناجح واحد، لكن جسم ذلك الطلب كان يحتوي على قائمة الباركودات التسعة كاملة، وليس باركودًا واحدًا. صفوف Count الرسمية تؤكد أن العناصر التسعة لها `result=MATCHED` و`observed_at` و`scan_method=BARCODE_SCAN`.

`ROOT_CAUSE_CLASS = IC-COUNT-A`  
`ROOT_CAUSE_PROVEN = YES`  
`SEVERITY = P3_EVIDENCE_ONLY`

تم اكتشاف فجوة اختبار مستقلة: الاختبارات الحالية لا تحتوي assertion صريحًا لسيناريو Expected=3 → Observe=1 → Complete → Missing=2. لم يتم تعديل الاختبارات أو المصدر في هذا التحكم.

## 2. Master Plan Position

| Item | Result |
|---|---|
| Master stage | `INVENTORY_COUNT_STABILIZATION` |
| Master step | `3_OF_8` |
| Current status before control | Conditional / Evidence Gap |
| Control scope | Physical Count semantics forensic only |
| Source edits | 0 |
| Test edits | 0 |
| Official DB mutation | 0 |
| Step 4 | Not started |

## 3. Trigger Evidence

The previous Step 3 report stated Expected=9, Counted=9, Missing=0, Unexpected=0, Variance=0 and summarized the successful eligible scan as one Observe request. That wording did not include the request body cardinality.

The exact disposable harness source shows:

- `eligibleBarcodes = candidates.map((row) => row.barcode)`.
- One Observe request sends `{ barcodes: eligibleBarcodes, method: "BARCODE_SCAN" }`.
- The following assertion requires the number of matched rows to equal `candidates.length`.

Therefore, the single successful Observe was a multi-barcode request containing all nine eligible barcodes. The exact source evidence is in `backend/scripts/inventory-count-full-disposable-e2e.cjs:188-194`.

The prior disposable database was intentionally dropped after its accepted proof, so its item rows are no longer available. This is recorded as:

`DISPOSABLE_ITEM_EVIDENCE_NOT_PERSISTED = YES`

No evidence was fabricated from the dropped clone.

## 4. Canonical Source Map

| Concern | Source | Function / location | Finding |
|---|---|---|---|
| Create Count | `backend/src/services/inventory-audit-canonical.service.js:37` | `createAudit` | Creates the Count document only; no item rows |
| Frozen expected set | `backend/src/services/inventory-audit-canonical.service.js:63` | `startAudit` | Creates one item per eligible Asset in branch/location scope |
| Initial item state | same file:75 | `StockAuditItem.create` | `status="missing"`, `result=null` |
| Physical observation | same file:82 | `observeAudit` | Resolves Asset identity/scope, then updates the expected row to MATCHED |
| Completion | same file:125 | `completeAudit` | Updates only rows with `result=null` to MISSING |
| Closure | same file:134 | `closeAudit` | Changes Count status to closed; does not change item result |
| API summary | `backend/src/routes/erp.routes.js:6093` | `inventoryCountReadModel` | Derived counts from item result values |
| UI summary | `app/[locale]/(dashboard)/inventory/stock-audit/page.tsx:28` | `countTotals` | Uses status/result fallback for display |
| Prior request body | `backend/scripts/inventory-count-full-disposable-e2e.cjs:188-194` | harness | One Observe carried all nine barcodes |

The canonical routes use central idempotency and transaction rollback on failure. No route was executed in this control.

## 5. Counted/Matched/Missing Definitions

### COUNTED_DEFINITION

There is no independent persisted `counted` state. In the canonical API read model, `countedCount` is the number of Count items whose `result === "MATCHED"` (`erp.routes.js:6108`). In the UI, an item is counted when `status === "matched"` or `result === "MATCHED"` (`stock-audit/page.tsx:33`).

### MATCHED_DEFINITION

An expected frozen item becomes matched only after `observeAudit` resolves the submitted Asset identity, verifies status and branch/location scope, verifies membership in the frozen expected set, and updates:

```text
status = "matched"
result = "MATCHED"
observedAt = current timestamp
scanMethod = resolved method
scannedBranchId = authorized branch
```

### MISSING_DEFINITION

An expected frozen item is missing when it remains `result=null` at completion. `completeAudit` changes those rows to:

```text
status = "missing"
result = "MISSING"
observedAt = completion timestamp
```

The non-null `observedAt` written by Complete is a finalization timestamp, not physical observation proof. Physical observation proof requires the prior MATCHED update and its `scanMethod`.

### UNEXPECTED_DEFINITION

The read model projects `unexpectedCount` from `result === "EXTRA"`. The canonical expected-set Observe path rejects an Asset that is not in the frozen set; it does not create an `unexpected` row in the current canonical implementation.

### VARIANCE_DEFINITION

The UI derives variance as `missing + unexpected`. The API read model exposes the component counts rather than a separate persisted variance field.

## 6. Item State Machine

| Item state | Observe effect | Complete effect | Close effect | Final summary contribution |
|---|---|---|---|---|
| No row before Start | Not applicable | Not applicable | Not applicable | No expected item |
| `status=missing`, `result=null`, `observedAt=null`, `scanMethod=null` after Start | Eligible submitted Asset becomes MATCHED; invalid/ineligible input is rejected | Row becomes `status=missing`, `result=MISSING`, and receives completion timestamp | No item change | Expected but not counted; Missing after completion |
| `status=matched`, `result=MATCHED` after Observe | Same row may be replayed/updated; no second row | Unchanged because `result` is not null | Unchanged | Counted / Matched |
| `status=unexpected`, `result=EXTRA` if present in a read model | No canonical creation path proven here | Not changed by the null-result update | Unchanged | Unexpected |
| Count `draft` | No item set yet | Rejected | Rejected | Not started |
| Count `in-progress` | Observations accepted under guards | Finalizes null-result rows | Rejected | Active physical evidence |
| Count `completed` | Rejected | Idempotent replay only | Changes Count status | Preserved evidence |
| Count `closed` | Rejected | Rejected | Idempotent replay only | Closed preserved evidence |

Conclusion: `Complete()` does not convert unobserved expected items into MATCHED. It converts them into MISSING.

## 7. Existing Test Coverage

Read-only tests inspected:

- `backend/tests/inventory-count-eligibility-reason.test.cjs`
- `backend/tests/stage-b-b3-inventory-count.test.cjs`
- `tests/inventory-count-active-session-discovery.test.cjs`

Existing tests explicitly cover:

- frozen expected set by branch/location;
- initial missing/null state as a source/UI expectation;
- MATCHED projection;
- idempotent duplicate observation;
- eligibility rejection reasons;
- Complete/Close route presence and no Asset/accounting adjustment;
- active Count discovery and read-first resume behavior.

Required exact test is not currently present:

`TEST_FOR_UNOBSERVED_EXPECTED_TO_MISSING = NO`  
`PREVENTION_GAP = YES`

This is a regression-prevention gap, not evidence of an implementation defect. Tests were not edited in this control.

## 8. Existing DB Evidence

Official database was queried read-only. Current identity and baseline counts:

```text
current_database = darfus_erp
stock_audits = 5
stock_audit_items = 24
assets = 18
inventory_asset_movements = 62
journal_entries = 25
asset_events = 65
```

Relevant historical Count summary:

| Count | Status | Items | MATCHED | MISSING | EXTRA | Non-null observed_at | scan_method present |
|---|---|---:|---:|---:|---:|---:|---:|
| `COUNT-20260825154754-b103b823` | closed | 9 | 9 | 0 | 0 | 9 | 9 |
| `COUNT-20260823075745-dde82bfe` | closed | 1 | 1 | 0 | 0 | 1 | 1 |

For `COUNT-20260825154754-b103b823`, all nine item rows were inspected. Each had:

- `status=matched`;
- `result=MATCHED`;
- `expected_branch_id=BRANCH-1` and `scanned_branch_id=BRANCH-1`;
- a non-null `observed_at`;
- `scan_method=BARCODE_SCAN`.

The nine observed barcodes were:

```text
GWRNG21000001
GWPND21000001
GPRNG21000001
GPRNG21000002
DDBRH21000001
DDBRH21000002
DDLOS00000001
GSRNG21000001
GSLOS00000001
```

This item-level evidence is consistent with all nine being physically submitted in the single multi-barcode Observe request documented in Section 3.

## 9. Disposable Reproduction

`DISPOSABLE_REPRO_REQUIRED = NO`.

Reason: the canonical source directly proves the unobserved transition, and the prior disposable harness source plus official item-level rows directly proves the disputed 9/9 run. A new clone would not add evidence needed to classify the prior report’s gap and would introduce an unnecessary mutation path.

`DISPOSABLE_DATABASE = N/A`  
`MAIN_COUNT_MUTATION = 0`

The required 3-Asset reproduction remains the recommended regression test contract, not an executed mutation in this read-only forensic control.

## 10. Item-Level Timeline

### Prior 9-Asset disposable run

| Point | Evidence |
|---|---|
| Before Start | No item rows; Count was draft |
| After Start | Frozen expected set contained 9 rows, each initialized missing/null |
| Observe | One request submitted the complete 9-barcode array; each expected row was updated to MATCHED with `BARCODE_SCAN` |
| Exact replay | Same request/key returned idempotent replay; no duplicate rows |
| Before Complete | Harness asserted matched rows = 9 and unresolved rows = 0 |
| Complete | No null-result rows remained, so no row was converted to MISSING |
| Close | Count status changed to closed; item evidence remained unchanged |

### Physical evidence interpretation

`observedAt` alone cannot distinguish physical observation from completion finalization because Complete writes a timestamp to missing rows. The authoritative combination for the prior run is `result=MATCHED` plus `scan_method=BARCODE_SCAN`, corroborated by the exact request body containing all nine barcodes.

## 11. Summary Calculation

### Server read model

From `inventoryCountReadModel`:

```text
expectedCount = number of loaded items
countedCount = items where result = MATCHED
missingCount = items where result = MISSING
unexpectedCount = items where result = EXTRA
```

### UI read model

From `countTotals`:

```text
expected = items.length unless server expectedCount is supplied
counted = status=matched OR result=MATCHED
missing = status=missing OR result=MISSING
unexpected = status=unexpected OR result=EXTRA
variance = missing + unexpected
```

At Start, the UI can show the initialized missing status while the API’s `missingCount` remains zero because `result` is still null. This is a projection-timing difference, not automatic physical matching. After Complete, the result values align and unobserved items are Missing.

## 12. Root Cause

`ROOT_CAUSE_CLASS = IC-COUNT-A`

`ROOT_CAUSE = Prior report evidence was incomplete/ambiguous: it counted the successful Observe HTTP request, but omitted that the request body contained all nine eligible barcodes. The source and official item rows prove that the nine items were physically observed through the multi-barcode Observe path; Complete did not auto-match them.`

Source-level alternatives:

| Candidate | Classification | Evidence |
|---|---|---|
| IC-COUNT-A | PROVEN | Harness sends all nine barcodes in one Observe; official rows show nine MATCHED + BARCODE_SCAN |
| IC-COUNT-B | REJECTED | Complete updates only `result=null` rows to MISSING |
| IC-COUNT-C | REJECTED | Start initializes `status=missing`, `result=null` |
| IC-COUNT-D | REJECTED | Server counted projection filters `result=MATCHED`, not expected count |
| IC-COUNT-E | REJECTED as root cause | UI labels are derived from status/result; they do not explain the prior 9/9 item evidence |
| IC-COUNT-F | NOT PROVEN / REJECTED for this run | No second automated observation path was found in the inspected canonical flow |

`ROOT_CAUSE_PROVEN = YES`

## 13. Severity

`SEVERITY = P3_EVIDENCE_ONLY`

No P1 physical-count defect was proven. The previous report’s ambiguity is a reporting/forensic evidence defect. A test-contract gap remains because the unobserved expected transition is not asserted explicitly.

## 14. Minimum Safe Fix Proposal

No implementation is authorized in this control.

Proposal only:

1. Add a focused test using Expected=3, Observe=1, Complete, asserting Matched=1 and Missing=2.
2. Include the Observe body cardinality and per-item result/observedAt/scanMethod in every Count acceptance report.
3. Keep the existing business transition: Start creates frozen rows; Observe is physical-presence evidence; Complete finalizes unobserved rows as Missing.
4. Preserve Asset identity, Barcode identity, branch/location scope, idempotency, inventory movement neutrality, and accounting neutrality.
5. If UI/API projection timing is later judged confusing, handle it as a separate read-model/UI observability decision; do not change physical-count authority here.

## 15. Prevention Lesson

`LL-040 = Expected Inventory Is Not Physical Observation`

```text
ROOT_CAUSE = Acceptance report omitted the cardinality and item-level evidence of a multi-barcode Observe request.
WHAT_ALLOWED_IT_TO_HAPPEN = Report summarized one HTTP request as one physical observation and did not include the request body or per-item rows.
MINIMUM_FIX = Require request cardinality plus item-level result/scanMethod evidence in Count acceptance reports, and add the 3-Asset regression test.
PREVENTION_GATE = Expected=3 -> Observe=1 -> Complete -> Matched=1, Missing=2.
TEST_TO_PREVENT_REGRESSION = Required; not added in this read-only control.
MODULES_AFFECTED = Inventory Count tests/reporting only unless a shared projection change is later proven necessary.
```

## 16. Main DB No-Write Proof

This control performed only source inspection and read-only queries against `darfus_erp`.

| Entity | Current count | Mutation |
|---|---:|---:|
| `stock_audits` | 5 | 0 |
| `stock_audit_items` | 24 | 0 |
| `assets` | 18 | 0 |
| `inventory_asset_movements` | 62 | 0 |
| `journal_entries` | 25 | 0 |
| `asset_events` | 65 | 0 |

`MAIN_BUSINESS_WRITE_DELTA = 0`

No clone was created, no source was edited, no test was edited, and no official mutation endpoint was called.

## 17. Gate

The physical Count semantics are proven correct and the prior gap was evidence completeness. The explicit missing regression test is recorded as a prevention gap for a later approved test-only change.

`GATE = PASS_STEP3_PHYSICAL_COUNT_SEMANTICS_CORRECT`

Step 3/8 may be finally closed from the physical-semantics perspective. This does not authorize Step 4, a source fix, a test edit, or an official Count.

## 18. Final Tokens

```text
CURRENT_CONTROL = DARFUS-INVENTORY-COUNT-STEP3-PHYSICAL-COUNT-SEMANTICS-FORENSIC-01
MASTER_STAGE = INVENTORY_COUNT_STABILIZATION
MASTER_STEP = 3_OF_8
OFFICIAL_DATABASE = darfus_erp
COUNTED_DEFINITION = Derived count of Count items with result MATCHED; UI also accepts status matched
MATCHED_DEFINITION = Expected frozen item updated by canonical Observe to status matched/result MATCHED with observation metadata
MISSING_DEFINITION = Expected frozen item still result null at Complete, then finalized as status missing/result MISSING
UNOBSERVED_EXPECTED_BEHAVIOR = Complete converts result-null expected rows to MISSING, never MATCHED
TEST_FOR_UNOBSERVED_EXPECTED_TO_MISSING = NO
PREVENTION_GAP = YES
DISPOSABLE_REPRO_REQUIRED = NO
DISPOSABLE_DATABASE = N/A
REPRO_EXPECTED = N/A
REPRO_OBSERVED = N/A
REPRO_MATCHED = N/A
REPRO_MISSING = N/A
ROOT_CAUSE_CLASS = IC-COUNT-A
ROOT_CAUSE = Prior report omitted that one Observe request contained all nine barcodes; source and DB item evidence prove all nine were observed
ROOT_CAUSE_PROVEN = YES
SEVERITY = P3_EVIDENCE_ONLY
BUSINESS_LOGIC_CHANGE_THIS_CONTROL = NO
SOURCE_FILES_CHANGED = 0
TEST_FILES_CHANGED = 0
MIGRATIONS = 0
MAIN_COUNT_MUTATION = 0
MAIN_ASSET_MUTATION = 0
MAIN_MOVEMENT_MUTATION = 0
MAIN_ACCOUNTING_MUTATION = 0
MAIN_BUSINESS_WRITE_DELTA = 0
LL_040 = Proposed: item-level observation evidence plus Expected=3/Observe=1/Complete regression test
STEP_3_FINAL_STATUS = PASS
NEXT_MASTER_STEP = 4_OF_8_ONLY_IF_STEP3_PASS
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
GATE = PASS_STEP3_PHYSICAL_COUNT_SEMANTICS_CORRECT
```

STOP. No fix, source edit, test edit, main mutation, Step 4 execution, client-requirements work, or automatic batch was started.
