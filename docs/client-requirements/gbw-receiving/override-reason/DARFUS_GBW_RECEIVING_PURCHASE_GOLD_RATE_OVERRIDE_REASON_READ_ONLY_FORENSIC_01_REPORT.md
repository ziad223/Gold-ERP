# DARFUS GBW purchase gold-rate override reason — final read-only forensic report

## Executive answer

هل تم تعديل أي كود؟ لا.  
هل تم تنفيذ أي Receive؟ لا.  
هل تم لمس DB؟ SELECT فقط على `darfus_erp`; لا توجد كتابة.  
ما سعر المرجع الفعلي؟ لسياق 21K/AED الحالي: `475.36260000` من آخر quote صالح في Gold Center، مع عدم وجود GoldPrice approved executable.  
ماذا يحدث عند السعر المساوي؟ Exact Decimal equality؛ لا Override ولا Reason.  
ماذا يحدث عند السعر الأقل؟ يصبح Override؛ يحتاج `inventory.adjust` وReason غير فارغ.  
ماذا يحدث عند السعر الأعلى؟ نفس قاعدة السعر الأقل.  
متى يعتبر النظام السعر Override؟ عند عدم التساوي الرقمي الدقيق مع المرجع.  
متى يصبح السبب Required؟ بعد ثبوت عدم التساوي؛ الغياب/الفراغ يسبب 422.  
هل Frontend لديه حقل Reason؟ لا.  
هل الحقل مخفي أم غير موجود؟ غير موجود في state/component/payload.  
هل الـPayload يرسل Reason؟ لا.  
ما شرط Backend الدقيق؟ `!requestedDecimal.eq(new Decimal(String(referenceRate)))`, ثم permission ثم one of the three reason paths.  
ما Root Cause؟ Frontend/Backend contract mismatch، وليس provider أو DB.  
هل Backend validation صحيحة أم بها Bug؟ صحيحة بحسب المصدر؛ لا Bug مثبت.  
هل المشكلة Frontend / Backend / Contract mismatch؟ Frontend gap + contract mismatch.  
ما Minimum Safe Fix المقترح؟ UI reason capture/mapping فقط مع إبقاء backend authority، بعد Owner approval.  
ما الاختبارات المطلوبة بعد الموافقة؟ equal/lower/higher, permission, blank reason, Decimal precision, AR/EN, no-write rejection, audit, idempotency, company/branch.  
Gate: `BLOCKED_DARFUS_GBW_OVERRIDE_REASON_READ_ONLY_FORENSIC_EVIDENCE_INCOMPLETE` بسبب عدم توفر raw historical request body.

## 1. Scope, authority, and safety

The current control, `AGENTS.md`, handoff, six registers, source, focused test references, current runtime, logs, and official DB read-only evidence were reviewed. No product source, test, config, migration, seed, or business data was modified. No Receive was sent. The current runtime was not restarted.

Authority order used: current owner control → frozen DARFUS architecture → current source/DB/runtime → historical reports as support only.

## 2. Baseline

| Item | Evidence |
|---|---|
| Branch / HEAD | `main` / `1657b0e9ba580faef69be48f04637835c201b521` |
| Worktree | Pre-existing dirty worktree: 131 tracked modified entries and 870 untracked entries at baseline; no cleanup performed. |
| Runtime | Backend health 200; DB health 200; Redis health 200; frontend route 200. |
| Docker | Existing services inspected read-only; no restart/recreate. |
| DB identity | `current_database() = darfus_erp`, user `postgres`. |
| Current counts | assets 21; purchase_orders 17; purchase_order_items 17; asset_purchase_cost_revisions 21; asset_current_valuations 17; inventory_asset_movements 77; journal_entries 40; journal_lines 121; idempotency_requests 123; audit_logs 215. |
| Override audit rows | `supplier_purchase_rate.override` count = 0 at inspection. |
| Source hashes | Target source evidence inspected; no target source file was changed by this control. |

The large worktree delta is pre-existing and is not attributed to this control. The baseline status listing itself was read-only.

## 3. Frontend authority and actual field

`app/[locale]/(dashboard)/inventory/gold-by-weight/page.tsx` has `draft.purchaseGoldRate`, an editable `Global Gold Rate At Purchase / g` field, and sends the rate in nested `goldValuation`. It has no `overrideReason`, `purchaseRateOverrideReason`, or equivalent state, field, validation, or payload key. The contract type advertises `reasonRequired`, but the page does not render or map it.

The real browser DOM at `/en/inventory/gold-by-weight` confirmed the rate input and absence of a reason input. It also showed authenticated company/branch, a healthy Gold Center, and no console errors/warnings at capture time. The absence is source-level and therefore applies across desktop/tablet/mobile; no hidden responsive control exists.

## 4. Backend contract trace

The canonical route is `backend/src/routes/erp.routes.js:8300`. For GBW/24K at `8550–8564`, the route:

1. Resolves the canonical reference rate.
2. Parses the requested rate as Decimal.
3. Treats any exact inequality as an override.
4. Requires `inventory.adjust` permission.
5. Reads reason from piece, nested gold valuation, or body.
6. Rejects missing/blank reason with `ValidationError("Purchase gold-rate override reason is required.")`.
7. Uses eight-decimal output for the approved GBW override and carries evidence to the audit chain.

The receive transaction begins at line 8336 and business writes occur later. Override validation is before Asset, PO item, movement, accounting, and payable persistence. `inventory-v2-runtime.service.js:364–388` persists the governed purchase-cost snapshot; `erp.routes.js:9034–9061` records approved override evidence in audit.

## 5. Reference authority and current DB

`gold-sale-pricing.service.js:624–662` uses current-company approved executable GoldPrice, then global approved row, then the Gold Center snapshot. Current read-only DB evidence showed no executable approved 21K GoldPrice row. The latest valid Gold Center quote was AED, valid/official, and included 21K `475.36260000`. This is the current reference used for the diagnostic three-case matrix; no value was changed.

## 6. Request/response evidence

Backend logs contain four historical `422` Receive responses with safe message `Purchase gold-rate override reason is required.` and request IDs `76564846-5eb8-4a88-ad88-81cc212a1567`, `0972174e-49e2-4b02-beeb-9f969769910f`, `51073c8c-9b90-4a88-9e7f-a38a95c0e893`, and `df9fea4d-d5fa-4270-a7ca-fcdf5db31211`. The exact request body was not retained. No new Receive was issued to recover it.

Therefore the source-built request shape is proven, the failure response is proven, but `FAILING_REQUEST_PAYLOAD_CAPTURED` is not claimed as raw-body capture.

## 7. Three-case result

| Case | Result |
|---|---|
| Equal `475.36260000` | No override; reason not required. |
| Lower `470.00000000` | Override; permission and reason required; current UI cannot supply reason. |
| Higher `480.00000000` | Override; permission and reason required; current UI cannot supply reason. |

The examples were not submitted by this control.

## 8. Root cause and classification

`FRONTEND_MISSING_OVERRIDE_REASON_FIELD` is proven with HIGH confidence. Root cause classification is `PRODUCT_DEFECT`/`CONTRACT_MISMATCH` in the frontend workflow. Backend validation is `NO_ISSUE` based on the current trace. Gold provider and DB are not the root cause.

Separate P2: raw backend English is displayed through `caught?.message`; track localization independently.

## 9. Minimum-safe fix recommendation

After explicit Owner authorization only: add a GBW-scoped reason control next to the existing rate input, map it to the existing server reason contract, retain server-side permission/comparison/audit/transaction authority, and add localized validation/error handling. Do not change Gold Center, formulas, DB schema, or accounting.

## 10. Registers

The six DARFUS registers were updated by documentation-only append with this issue, evidence links, and the blocked raw-body status. No historical evidence was rewritten and the issue was not marked closed.

## 11. Final tokens

`CURRENT_CONTROL = DARFUS-GBW-RECEIVING-PURCHASE-GOLD-RATE-OVERRIDE-REASON-READ-ONLY-FORENSIC-01`  
`ISSUE_ID = DARFUS-GBW-RECEIVING-PURCHASE-GOLD-RATE-OVERRIDE-REASON-001`  
`MODE = READ_ONLY_FORENSIC_NO_FIX`  
`OFFICIAL_DATABASE = darfus_erp`  
`SOURCE_FILES_CHANGED = 0`  
`TEST_FILES_CHANGED = 0`  
`DATABASE_CHANGED = NO`  
`MIGRATIONS_CREATED = 0`  
`MIGRATIONS_EXECUTED = 0`  
`BUSINESS_DB_WRITES = 0`  
`RECEIVES_EXECUTED_BY_THIS_CONTROL = 0`  
`FRONTEND_OVERRIDE_REASON_FIELD = MISSING`  
`BACKEND_OVERRIDE_VALIDATION = PROVEN_FAIL_CLOSED`  
`REFERENCE_RATE_AUTHORITY = PROVEN`  
`EQUAL_RATE_CONTRACT = PROVEN`  
`LOWER_RATE_CONTRACT = PROVEN_FROM_SOURCE_AND_HISTORICAL_ERROR`  
`HIGHER_RATE_CONTRACT = PROVEN_FROM_SOURCE`  
`FAILING_REQUEST_PAYLOAD_CAPTURED = NO_EXACT_RAW_BODY_RETAINED`  
`ROOT_CAUSE = FRONTEND_MISSING_OVERRIDE_REASON_FIELD`  
`ROOT_CAUSE_CONFIDENCE = HIGH`  
`P0_COUNT = 0`  
`P1_COUNT = 1`  
`P2_COUNT = 1`  
`P3_COUNT = 1`  
`GATE = BLOCKED_DARFUS_GBW_OVERRIDE_REASON_READ_ONLY_FORENSIC_EVIDENCE_INCOMPLETE`  
`NEXT_STEP_ONLY = OWNER_REVIEW_AND_EXPLICIT_FIX_AUTHORIZATION`  
`NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`

STOP. No fix, Receive, migration, seed, DB write, or next batch was started.

