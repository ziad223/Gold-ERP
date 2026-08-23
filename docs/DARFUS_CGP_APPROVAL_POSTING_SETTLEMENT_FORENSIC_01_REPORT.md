# DARFUS ERP — CGP Approval / Posting / Settlement Forensic Investigation

**Control ID:** `DARFUS-CGP-APPROVAL-POSTING-SETTLEMENT-FORENSIC-01`  
**Mode:** Read-only root-cause investigation  
**Target:** `CGPD-000001`  
**Database:** `darfus_erp`  
**Date:** 2026-08-23

## 1. Executive Summary

تم تنفيذ فحص Forensic للـCGP المستهدف قراءة فقط. لم يتم تنفيذ POST أو Settlement أو Payment أو Retry أو Replay، ولم يتم تعديل الكود أو قاعدة البيانات أو الاختبارات.

النتائج:

- Approval flow مكتمل ومثبت في سجل التدقيق، وليس هو سبب فشل التكامل.
- CGP posting نجح: المستند أصبح `POSTED`، وتم إنشاء Posted Event وOutbox row.
- Inventory consumer نجح: تم إنشاء Asset واحد، وOrigin واحد، وAsset Event واحد، وMovement واحد، مع Barcode واحد.
- Accounting consumer فشل قبل إنشاء Journal أو Customer Financial Liability لأن mapping دور `CUSTOMER_CREDITOR` مفقود/غير متاح للفرع الحالي. يوجد mapping واحد فقط لدور `INVENTORY_ASSET`.
- بسبب فشل Accounting، بقي الـOutbox في `RETRYABLE_FAILED` ولم تُنفذ مراحل Gold Center وAvailability وCRM.
- Settlement backend موجود، لكن settlement غير متاح لهذا السجل لأن الـLiability المطلوب لم يُنشأ بعد.
- خطأ `.map` التاريخي لم يُعاد إنتاجه في القراءة الحالية؛ المصدر يوضح تعبيرًا حساسًا (`draft.items.map`) لكن الـserializer الحالي يضمن `items` كمصفوفة. لذلك سبب الخطأ التاريخي غير مثبت بالكامل.

**النتيجة الحالية:** Track A مثبت، Track B مثبت كأثر تابع لفشل Accounting، Track C غير مثبت تاريخيًا بما يكفي لإغلاق البوابة.

## 2. Target CGP Evidence

| Field | Actual | Evidence |
|---|---|---|
| Draft | `CGPD-000001` | Official DB SELECT + browser detail |
| Customer | Mohamed Negm | Browser detail |
| Branch | Branch-2 | Browser detail and `branch_id` |
| Currency | AED | Official DB |
| Business value | `5432.891` | Official DB `total_gold_value` |
| Payable to customer | `5432.891` | Official DB `total_payable_to_customer` |
| Paid | `0.0000` | Browser/business view |
| Remaining | `5432.8910` | Browser/business view |
| UI state | Posted | Browser detail |
| DB business state | `POSTED` | `customer_gold_purchase_documents.business_status` |
| Legacy/status field | `approved` | `customer_gold_purchase_documents.status` |
| Version | `5` | Official DB |
| Posting reference | `CGP-POSTED:<document id>` | Official DB |
| Posting request correlation | `91ce2d74-dd33-4955-8bb1-57730c36c6dc` | Backend log + posting metadata |

The UI/DB business-state parity is **PASS**: the UI shows Posted and the canonical business status is `POSTED`. The legacy `approved` field is not a contradiction; the posting service preserves it while advancing the canonical CGP lifecycle.

## 3. Source Call Graph

| Stage | Source | Authority / Result |
|---|---|---|
| API mount | `backend/src/app.js:100` | `/api/v1` |
| CGP route mount | `backend/src/routes/index.js:35` | `/gold-purchases` |
| Business view | `backend/src/routes/gold-purchase.routes.js:109` | Read-only GET for integration view |
| Post boundary | `backend/src/routes/gold-purchase.routes.js:121` | Idempotent post wrapper → `cgpPostingService.post` |
| Settlement boundary | `backend/src/routes/gold-purchase.routes.js:136` | Thin route → `financialSettlementService.executeCustomerPayoutSettlement` |
| Post service | `backend/src/services/cgp-posting.service.js:204` | Validated → Posted, snapshots, audit, outbox |
| Runtime dispatcher | `backend/src/services/cgp-runtime-dispatcher.service.js` | Inventory → Accounting → Gold Center → Availability → CRM |
| Inventory consumer | `backend/src/services/cgp-inventory-consumer.service.js:189` | Exactly-once Asset path |
| Accounting consumer | `backend/src/services/cgp-accounting-consumer.service.js:165` | Journal + Customer Financial Liability |
| Settlement service | `backend/src/services/financial-settlement.service.js:58` | Customer payout settlement authority |
| Business view composer | `backend/src/services/cgp-business-view.service.js` | Integrations, assets, accounting, payable, settlements |

## 4. Approval Flow

The target has exactly one approval request:

- Approval ID: `GPAR:COMP-...:58eec1e9-...`
- Aggregate type: `cgp`
- Document version: `2`
- Approval status: `approved`
- Requested: `2026-08-23T15:41:33.797Z`
- Reviewed: `2026-08-23T15:41:48.744Z`
- Requester/reviewer: same authenticated user
- Review reason: `1`
- Audit flag: `selfReview=true`
- Permission recorded: `gold_purchase.cgp.self_approve`

Source behavior in `gold-purchase-governance.service.js` separates governance approval from posting. Approval sets governance to `APPROVED` and leaves canonical business state `VALIDATED`; posting is a separate authorized transition. The approval route was not called during this audit.

**Finding:** Approval flow is evidenced as completed. Self-review is an explicit permission-controlled behavior in the current architecture. Whether self-approval is acceptable as a governance policy is an owner policy decision, not the proven cause of the downstream failure.

## 5. Canonical CGP State

The canonical lifecycle is `DRAFT → VALIDATED → POSTED`.

For the target:

```text
approval request: APPROVED
governance status: APPROVED
business status: POSTED
legacy status: approved
posting timestamp: 2026-08-23T15:50:06.402Z
```

The posting service rejects a second post when `businessStatus === POSTED`, and requires `businessStatus === VALIDATED` before the first post. This protects the target from another post. No post was attempted in this control.

## 6. Posted Event

The source contract creates `CustomerGoldPurchasePostedEvent` version `1` and enqueues it in the same transaction as the CGP state transition. The target has:

- Event ID: `CGP-POSTED:CGPD:COMP-48ab554f-427e-4642-9419-bc8616c2dc36:be005e65-7f60-4a83-94b5-280884b8a926`
- Event type: `CustomerGoldPurchasePostedEvent`
- Event version: `1`
- Outbox row: `1`
- Outbox status: `RETRYABLE_FAILED`
- Attempt count: `11`
- Last error: `The required financial mapping is missing or ambiguous.`

The event was created. The event was not published because a downstream consumer failed.

## 7. Event Processor / Dispatcher

`cgp-runtime-dispatcher.service.js` is explicit CGP-only runtime delivery. Its hard-gated order is:

1. Inventory
2. Accounting
3. Gold Center
4. Availability evaluation
5. CRM soft projection

The dispatcher claims only eligible events when `CGP_RUNTIME_DISPATCH_ENABLED=true` and a valid activation watermark is present. The current container environment did not expose the CGP runtime enable/watermark variables, so the runtime is disabled by default/fail-closed. No dispatcher retry was triggered by this audit.

The durable evidence shows the event reached Inventory and stopped at Accounting. Since each consumer uses its own transaction, Inventory’s durable effects remain while Accounting failure leaves the event retryable.

**Processor status:** `FAILED_RETRYABLE`, with partial consumer completion.

## 8. Inventory Integration

Inventory integration is **SUCCEEDED** for the target event.

Evidence:

| Entity | Actual |
|---|---:|
| Processed event consumer | `INVENTORY / SUCCEEDED` |
| Integration status rows | `1` (`INVENTORY / SUCCEEDED`) |
| Asset | `1` |
| Asset origin | `1` |
| Asset event | `1` |
| Inventory movement | `1` |
| Barcode | `GWANK24000001` |
| Asset status | `pending_integration` |
| Operational status | `PENDING_INTEGRATION` |
| Asset source | `customer_gold_purchase` |
| Origin type | `CUSTOMER_GOLD_PURCHASE` |
| Movement type | `CGP_ACQUIRED_PENDING` |
| Movement location | `null` |

The one-item CGP produced the expected one-Asset effect. Asset creation is not the failure point. Its pending operational state is an intentional downstream-integrations gate, not proof of an inventory write corruption.

## 9. Accounting Integration

Accounting integration is **FAILED**.

The accounting consumer calls `resolveRequiredSemanticAccount` twice for:

- `INVENTORY_ASSET`
- `CUSTOMER_CREDITOR`

The resolver requires exactly one scoped mapping and then validates the resolved account’s company, branch, active state, posting capability, type, nature, and statement classification.

Official DB read-only evidence for the target company/branch:

| Semantic role | Mapping count |
|---|---:|
| `INVENTORY_ASSET` | `1` |
| `CUSTOMER_CREDITOR` | `0` |

The outbox `last_error` is exactly the resolver’s sanitized failure message: `The required financial mapping is missing or ambiguous.`

No journal was created and no Customer Financial Liability was created.

**Proven conclusion:** downstream accounting stopped before journal/liability persistence because the required `CUSTOMER_CREDITOR` mapping is absent for the target company/branch.

## 10. Customer Ledger

The architecture distinguishes financial recognition from settlement:

- At POST, the accounting consumer creates a `CustomerFinancialLiability` with original and outstanding amount.
- At SETTLEMENT, the settlement service reduces the liability and records settlement/journal/treasury evidence.
- CRM history/timeline are soft projections later in the CGP event sequence.

For `CGPD-000001`:

| Record | Expected at POST | Actual |
|---|---|---:|
| Customer Financial Liability | Yes | `0` |
| Customer Transaction History | Yes, after CRM consumer | `0` |
| Customer Timeline | Yes, after CRM consumer | `0` |
| Settlement allocation | Only after settlement | `0` |

The missing financial liability is a direct consequence of the accounting consumer failure. No settlement or payment was attempted.

## 11. Settlement Backend

Settlement backend **exists** and is wired through the canonical route:

`POST /api/v1/gold-purchases/cgp/drafts/:id/settlements`

The route requires a posted CGP and `gold_purchase.cgp.settle`; the service is `executeCustomerPayoutSettlement` in `financial-settlement.service.js`.

The service supports CASH, BANK_TRANSFER, and mixed legs, validates positive amounts and currency, prevents over-settlement, requires the appropriate treasury mappings, posts a balanced customer payout journal, writes settlement/legs/allocation/cash evidence, updates the liability, and uses idempotency scope `financial-settlement:v1`.

The backend was not called. It is not the source of the current blocker; its prerequisite liability does not exist because Track A failed.

## 12. Settlement UI

Settlement UI is implemented in `features/gold-purchases/components/GoldPurchaseDraftWorkspace.tsx`.

The form is rendered only when:

```text
selected.businessStatus === POSTED
AND settlement permission exists
AND businessView.payable exists
AND outstandingAmount > 0
```

For `CGPD-000001`, the browser showed the read-only settlement history text:

`No payment recorded. Posting does not create a Treasury movement.`

The settlement form was not visible. This is an expected guard because `businessView.payable` is absent when accounting did not create a liability. The backend capability is present; the UI is hidden by an upstream missing prerequisite.

## 13. `.map` Frontend Error

The exact current source candidate is:

```text
features/gold-purchases/components/GoldPurchaseDraftWorkspace.tsx:108
setLines(draft.items.map((x) => ({ ...x })));
```

Expected value: `GoldPurchaseDraftItem[]`.  
API source: authenticated GET `/api/v1/gold-purchases/cgp/drafts?page=1&limit=50`, serialized by `gold-purchase-draft.service.js`.  
Current serializer evidence: `value.items = (value.items || []).sort(...)` at line 196.

Read-only browser result:

- CGP list loaded.
- `CGPD-000001` opened successfully.
- The detail page showed one item and the Posted state.
- No current console error or warning was observed.
- No current `.map` exception was reproduced.

Therefore:

| Required field | Finding |
|---|---|
| Error component | `GoldPurchaseDraftWorkspace.edit` |
| Error file | `features/gold-purchases/components/GoldPurchaseDraftWorkspace.tsx` |
| Error line | `108` |
| Suspected undefined value | historical `draft.items` at the `.map` boundary |
| Current value | array for the target; no exception |
| Classification | `STALE_COMPONENT_EXPECTATION / HISTORICAL_CAUSE_NOT_REPRODUCED` |
| Proven root cause | No; exact historical response/state causing `undefined` is unavailable |

This is an evidence gap, not authorization to change the component during this control.

## 14. Network Read-only Evidence

Read-only browser navigation was performed in a new browser tab without mutation actions:

- `http://localhost:3000/en/sales/customer-gold/drafts`
- Existing `CGPD-000001` detail opened from the list.
- `http://localhost:3000/en/approvals`

Observed:

- CGP list and detail loaded.
- Business view loaded.
- Posted, asset, integration, financial and settlement sections rendered.
- Approval page reported no scoped CGP approvals pending.
- No mutation endpoint was called by this audit.
- No browser console errors/warnings were observed for the inspected pages.

The backend log includes the historical target posting response `200` at `2026-08-23 15:50:06` with request ID `91ce2d74-dd33-4955-8bb1-57730c36c6dc`. No current retry, settlement, payment, approval, or posting request was issued by this audit.

## 15. DB Read-only Evidence

All database evidence in this report was collected through SELECT-only queries executed through the existing backend container. The query returned `current_database() = darfus_erp`.

Target-scoped current counts:

| Entity | Count |
|---|---:|
| CGP document | 1 |
| CGP items | 1 |
| Approval requests | 1 |
| Outbox event | 1 |
| Integration status rows | 1 |
| Processed event receipts | 1 |
| Assets | 1 |
| Asset origins | 1 |
| Asset events | 1 |
| Inventory movements | 1 |
| Journal entries | 0 |
| Journal lines | 0 |
| Customer Financial Liabilities | 0 |
| Financial settlements | 0 |
| Settlement legs | 0 |
| Settlement allocations | 0 |
| Customer transaction history | 0 |
| Customer timeline | 0 |

The target record, approval record, posting metadata, outbox event, Asset, Origin and Movement were preserved. No UPDATE/INSERT/DELETE/TRUNCATE was executed in this control.

## 16. Log Evidence

Relevant read-only evidence:

- Backend connected to the database and listened on port 8000.
- Target post request was logged as HTTP `200` at `2026-08-23 15:50:06`.
- Target business view GET returned `200`.
- Outbox database evidence records `RETRYABLE_FAILED`, attempt count `11`, and the sanitized financial mapping error.
- No current `[CGPRuntime]` successful publish evidence exists for the target.
- An earlier unrelated/other CGP post attempt logged `CGP_APPROVED_GOLD_PRICE_REQUIRED`; it is not the target root cause and was not retried.
- A later `401` session-expiry log was observed historically; the current read-only browser session loaded the target pages successfully. It is not the target integration root cause.

## 17. Root Cause — Track A

### Approval → Posting → Inventory → Accounting

| Question | Finding | Classification |
|---|---|---|
| Did approval complete? | Yes, one approved request, self-review permission recorded | `NO_ISSUE` for this incident |
| Did posting create the canonical fact? | Yes, `POSTED`, version 5, posting reference and event metadata | `NO_ISSUE` |
| Did Inventory consume the event? | Yes, exactly once receipt and one Asset path | `NO_ISSUE` |
| Did Accounting consume the event? | No; failed resolving `CUSTOMER_CREDITOR` | `MISSING_MASTER_DATA / FINANCIAL_MAPPING` |
| Did a journal post? | No, count 0 | Direct consequence |
| Did a liability post? | No, count 0 | Direct consequence |

**Proven Track A root cause:** required semantic account mapping `CUSTOMER_CREDITOR` is absent/ambiguous for the target company/branch, so Accounting fails before Journal and Liability creation. This is a P1 financial integration blocker.

## 18. Root Cause — Track B

Settlement is not independently broken. The backend route and service exist, and the service correctly requires a posted document plus a recognized open liability. The target has no liability because Track A failed; therefore:

```text
POSTED CGP
→ Accounting mapping failure
→ no CustomerFinancialLiability
→ payable absent
→ settlement action correctly hidden/unavailable
```

**Proven Track B root cause:** upstream accounting recognition did not create the settlement prerequisite. Classification: `DEPENDENT_ON_TRACK_A`, not a missing settlement implementation.

No payment, settlement, treasury movement, or settlement journal was executed.

## 19. Root Cause — Track C

The current source contains an unsafe direct `.map` boundary at line 108, but the current API serializer defaults missing items to `[]`, and the target browser journey did not reproduce the exception.

The historical request/response pair or exact component state that contained `undefined` was not available for read-only verification. Consequently, the following cannot be proven from current evidence:

- whether the historical response omitted `items`;
- whether a different list endpoint or stale frontend bundle returned a different shape;
- whether the exception happened on an older component revision;
- whether the value was undefined due to state initialization, API mismatch, or stale runtime.

**Track C finding:** `STALE_COMPONENT_EXPECTATION / HISTORICAL_CAUSE_NOT_REPRODUCED`. This remains an acceptance-gap blocker for a full root-cause PASS, but no current user-visible error was observed and no code change is authorized in this control.

## 20. Approval Relationship Decision

Approval did not cause the posting/integration failure.

Evidence:

- Approval request is approved.
- Governance status is `APPROVED`.
- Posting later succeeded and created the canonical event.
- Inventory later consumed the event successfully.
- Accounting failed specifically on financial mapping resolution.

The self-review was explicitly recorded with the `gold_purchase.cgp.self_approve` permission. This is a governance policy observation for Owner review, not a proven defect in the target incident.

## 21. Impact

### Persistent business impact observed

- The CGP canonical record is Posted.
- One physical Asset and its inventory evidence exist.
- The Asset remains `PENDING_INTEGRATION`.
- Financial recognition is incomplete: no Journal and no Customer Financial Liability.
- Customer payout settlement cannot begin.
- Gold Center, availability and CRM downstream processing have not completed.

### Safety impact

- No duplicate Asset was observed.
- No duplicate Journal was observed.
- No payment or settlement was created.
- No mutation was caused by this control.

### Priority

- Track A: **P1** — financial posting/integration blocked.
- Track B: **P1 dependent blocker** — customer settlement unavailable because liability is absent.
- Track C: **P2 acceptance/observability gap** — historical UI failure not fully reproducible; current runtime did not fail.

## 22. Minimum Safe Fix Proposal

No fix was applied. The following are design-only proposals for a separately authorized batch:

1. Resolve the financial configuration for the exact company/branch by providing exactly one valid `CUSTOMER_CREDITOR` semantic mapping, with an active, posting-enabled, scope-compatible account. Do not use a hardcoded account or fallback.
2. Rehearse the same protected event-processing path in a safe authorized target before any persistent recovery. The recovery must preserve Inventory exactly-once evidence and must not create duplicate Assets or Movements.
3. After Accounting succeeds, verify Gold Center, Availability and CRM consumers and confirm the resulting Journal is balanced and the Liability is OPEN with the correct amount.
4. Only after an Owner-authorized settlement acceptance should the existing settlement route be tested; do not create payment in this forensic control.
5. For Track C, capture the exact historical API payload/runtime bundle or add a focused non-mutating contract test in a later approved change batch. Candidate hardening is a null-safe component boundary or an explicit API contract assertion, but the choice must follow evidence.

These are not execution instructions for the current control.

## 23. Regression / Prevention Plan

Future authorized work should prove, without changing business authority:

- approval and posting remain separate state transitions;
- one posted CGP event creates one outbox event;
- Inventory consumer is exactly-once;
- missing `CUSTOMER_CREDITOR` mapping fails clearly before Journal/ Liability creation and leaves a retryable event;
- a valid mapping allows balanced Accounting recognition;
- the event can progress to Gold Center, Availability and CRM without duplicate Inventory effects;
- settlement is unavailable without an open liability and available with one;
- settlement idempotency rejects same-key changed payloads and prevents duplicate payment evidence;
- `draft.items` is always present in the list contract and the edit path is tested with empty/missing optional arrays;
- browser tests inspect GET/business-view responses and console errors without invoking mutations unless separately authorized.

No test or source change was made here.

## 24. Severity

| ID | Area | Classification | Severity | Evidence | Current status |
|---|---|---|---|---|---|
| CGP-A-001 | Accounting integration | `MISSING_MASTER_DATA / FINANCIAL_MAPPING` | P1 | `CUSTOMER_CREDITOR` mapping count 0; outbox retryable error | Confirmed |
| CGP-B-001 | Settlement readiness | `DOWNSTREAM_DEPENDENCY` | No liability; settlement predicate requires payable | Confirmed dependent blocker |
| CGP-C-001 | CGP UI `.map` | `ACCEPTANCE_GAP / UNKNOWN_HISTORICAL_CAUSE` | P2 | line 108 candidate; current serializer/browser safe | Not fully proven |
| CGP-G-001 | Governance | `POLICY_REVIEW` | P2 | explicit self-review permission and audit flag | Owner policy review only |

No P0 data-loss or duplicate-record evidence was found in this read-only audit. The P1 financial integration blocker prevents full operational closure.

## 25. Gate

The gate does **not** pass because the historical `.map` root cause is not fully proven from current read-only evidence.

```text
GATE = BLOCKED_CGP_MAP_HISTORICAL_CAUSE_NOT_REPRODUCED
```

Track A and Track B root causes are proven. Track C remains an evidence/acceptance gap. No automatic fix, retry, settlement, provisioning, or next batch is authorized.

## 26. Final Tokens

```text
CURRENT_CONTROL = DARFUS-CGP-APPROVAL-POSTING-SETTLEMENT-FORENSIC-01
TARGET_CGP = CGPD-000001
CURRENT_DATABASE = darfus_erp
UI_STATUS = Posted
DB_CANONICAL_STATUS = POSTED
UI_DB_STATUS_PARITY = PASS
APPROVAL_REQUEST_ID = GPAR:COMP-...:58eec1e9-...
APPROVAL_FLOW_STATUS = APPROVED
POSTED_EVENT_EXPECTED = YES
POSTED_EVENT_CREATED = YES
EVENT_ID = CGP-POSTED:CGPD:COMP-48ab554f-427e-4642-9419-bc8616c2dc36:be005e65-7f60-4a83-94b5-280884b8a926
EVENT_STATUS = RETRYABLE_FAILED
CGP_EVENT_PROCESSOR_STATUS = FAILED_RETRYABLE_PARTIAL_CONSUMER_COMPLETION
INVENTORY_INTEGRATION_STATUS = SUCCEEDED
EXPECTED_ASSET_EFFECT = ONE_ASSET_PER_CGP_ITEM
ACTUAL_ASSET_COUNT = 1
ACCOUNTING_INTEGRATION_STATUS = FAILED
JOURNAL_COUNT_FOR_CGP = 0
CUSTOMER_LEDGER_EXPECTED_AT_POST = YES_FINANCIAL_LIABILITY_AND_SOFT_CRM_PROJECTION
CUSTOMER_LEDGER_ACTUAL = NO_LIABILITY_NO_TRANSACTION_HISTORY_NO_TIMELINE
SETTLEMENT_BACKEND_EXISTS = YES
SETTLEMENT_UI_IMPLEMENTED = YES
SETTLEMENT_UI_VISIBLE_FOR_CGPD_000001 = NO
SETTLEMENT_HIDDEN_REASON = NO_CUSTOMER_FINANCIAL_LIABILITY_AFTER_ACCOUNTING_FAILURE
ERROR_COMPONENT = GoldPurchaseDraftWorkspace.edit
ERROR_FILE = features/gold-purchases/components/GoldPurchaseDraftWorkspace.tsx
ERROR_LINE = 108
UNDEFINED_MAP_VALUE = HISTORICAL_DRAFT_ITEMS_AT_EDIT_BOUNDARY_NOT_REPRODUCED
MAP_ERROR_CLASSIFICATION = STALE_COMPONENT_EXPECTATION_HISTORICAL_CAUSE_NOT_REPRODUCED
DID_APPROVAL_FLOW_CAUSE_POSTING_INTEGRATION_FAILURE = NO
IS_CGP_POST_ACTION_BROKEN = NO
IS_DOWNSTREAM_EVENT_PROCESSING_BROKEN = YES_ACCOUNTING_MAPPING_FAILURE
IS_SETTLEMENT_MISSING_OR_HIDDEN = YES_HIDDEN_BY_MISSING_UPSTREAM_LIABILITY
ROOT_CAUSE_POSTING_INTEGRATION = CUSTOMER_CREDITOR_FINANCIAL_MAPPING_MISSING_OR_AMBIGUOUS
ROOT_CAUSE_SETTLEMENT = UPSTREAM_ACCOUNTING_LIABILITY_NOT_CREATED
ROOT_CAUSE_MAP_ERROR = NOT_FULLY_PROVEN_CURRENT_RUNTIME_REPRODUCES_NO_ERROR
MINIMUM_SAFE_FIX = DESIGN_ONLY_NO_FIX_APPLIED
SEVERITY = P1_FINANCIAL_BLOCKER_PLUS_P2_HISTORICAL_UI_EVIDENCE_GAP
BUSINESS_WRITES_THIS_CONTROL = 0
SOURCE_CHANGES_THIS_CONTROL = 0
MIGRATIONS_THIS_CONTROL = 0
RETRIES_THIS_CONTROL = 0
PAYMENTS_THIS_CONTROL = 0
NEW_CGP_THIS_CONTROL = 0
TARGET_CGP_PRESERVED = YES
GATE = BLOCKED_CGP_MAP_HISTORICAL_CAUSE_NOT_REPRODUCED
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**STOP.**

