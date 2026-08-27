# DARFUS ERP — CGP Post-to-UI Synchronization Forensic Report

## Executive Summary

تم تنفيذ فحص المصدر، وإعادة إنتاج المشكلة على Disposable Clone فقط، ثم تطبيق إصلاح واجهة محدود يعتمد على إعادة قراءة `business-view` عبر GET فقط. بعد الإصلاح تم إنشاء CGP اصطناعي واحد على الـClone: ظهر `Posted / Pending` مباشرة، ثم ظهرت الأصول والمحاسبة ومركز الذهب وسجل العميل تلقائيًا دون تحديث يدوي ودون POST ثانٍ. قاعدة `darfus_erp` بقيت دون دلتا تجارية.

النتيجة: سبب المشكلة كان فجوة توقيت بين POST الذي يثبت المستند ويضع حدثًا في Outbox وبين الإسقاطات اللاحقة غير المتزامنة، مع وجود قراءة واحدة فقط في الواجهة. لم يثبت عيب في إسقاط Backend أو في Accounting؛ لذلك كان التغيير في الواجهة فقط.

## Main Read-only Baseline

| Item | Result | Evidence |
|---|---|---|
| Official database | `darfus_erp` | `SELECT current_database()` قبل وبعد الاختبار |
| Official CGP documents | 4 | Read-only SQL before/after |
| Official assets / origins | 18 / 18 | Read-only SQL before/after |
| Official movements | 60 | Read-only SQL before/after |
| Official journals | 24 | Read-only SQL before/after |
| Official liabilities | 4 | Read-only SQL before/after |
| Official outbox / integration rows | 4 / 16 | Read-only SQL before/after |
| Official business delta | 0 | Same counts and same `CGPD-000001`…`CGPD-000004` |

تم إيقاف الـofficial backend مؤقتًا أثناء تشغيل الـClone ثم إعادته. عند الإعادة ظهر: `No migrations were executed`، ثم عاد للاستماع على `localhost:8000` مع `DB_NAME=darfus_erp`.

## Source Call Graph

```text
GoldPurchaseDraftWorkspace.post()
  -> postGoldPurchaseDraft()
  -> POST /gold-purchases/cgp/drafts/:id/post
  -> idempotency middleware
  -> cgpPostingService.post()
  -> mark POSTED + enqueue durable CGP outbox event
  -> asynchronous runtime dispatcher
       -> INVENTORY
       -> ACCOUNTING
       -> GOLD_CENTER
       -> CRM
  -> GET /gold-purchases/cgp/drafts/:id/business-view
```

`business-view` هو مصدر العرض المالي والتكاملات والأصول والمستحقات. الـPOST لا ينتظر اكتمال كل المستهلكين قبل الرد.

## Frontend State Authority

قبل الإصلاح كان `post()` يعيد تحميل قائمة المسودات، وكان effect حالة `POSTED/REVERSED` ينفذ GET واحدًا لـ`business-view`. هذا لا يكفي عندما تكون حالة الـOutbox ما زالت `PENDING` لحظة القراءة.

بعد الإصلاح:

- الحالة الظاهرة تعتمد على `businessView` و`businessViewSyncState`.
- `PENDING` يقرأ `business-view` دوريًا بفاصل 1000ms.
- المهلة القصوى 30 ثانية.
- الحالات النهائية: `SUCCEEDED`, `FAILED`, `TIMEOUT`.
- إلغاء effect عند unmount أو تغيير المستند.
- لا يوجد `POST`, `PUT`, `PATCH`, `settle` أو أي mutation داخل revalidation.
- زر Post يبقى مسار mutation الوحيد، ومقفل أثناء `saving`.

## Backend Async Model

التتبع أثبت أن `cgpPostingService` يثبت المستند وينشئ حدث Outbox، ثم يقوم Dispatcher بتشغيل المستهلكين الأربعة. `GET business-view` يجمع `IntegrationStatus`, assets, accounting, liability, settlement projection وpricing snapshots.

لم يتم تعديل Backend business logic أو schema أو migration.

## Disposable Environment

تم استخدام:

- Backup: `backend/backups/darfus_erp_official_cgp_control_20260823.dump`
- Backup SHA-256: `D38D33E48E3B5A45C0333A5FF9FC19B5083C2A5BD8BB0B8D3B33CAE85A6A59BD`
- Disposable DB: `darfus_erp_cgp_sync_rehearsal_20260823_01`
- Temporary backend: `darfus-backend-cgp-sync-browser-v2` على `localhost:8000`
- Temporary frontend: `localhost:3011`
- Clone connection proof: `SELECT current_database()` أعاد اسم الـClone، لا `darfus_erp`.

تم إيقاف الـClone والـtemporary frontend بعد الإثبات، وإعادة `darfus-backend` الرسمي.

## Pre-fix Controlled Reproduction

على Disposable Clone، أظهر POST قبل الإصلاح:

| Event | Time (UTC) | Observed |
|---|---:|---|
| Post click | `17:46:28.963` | mutation started |
| Post response | `17:46:29.024` | `POSTED`, version 3 |
| First business-view GET | `17:46:29.027` | integrations/assets/payable not ready |
| Follow-up observation | `17:46:29.612` | Inventory ready |
| Terminal observation | `17:46:29.926` | all integrations and payable ready |

الواجهة القديمة كانت ستتوقف عند القراءة الأولى، ولذلك كانت تحتاج Refresh يدويًا لرؤية الإسقاط النهائي.

## Network Timeline

### Post-fix disposable run

| Sequence | Method | Endpoint | Status | Request ID / Evidence |
|---:|---|---|---:|---|
| 1 | POST | `/api/v1/gold-purchases/cgp/drafts/:id/post` | 200 | `42d7152c-e922-422f-a903-96bfb219a8a0` |
| 2 | GET | `/api/v1/gold-purchases/cgp/drafts/:id/business-view` | 200 | `344c59be-e234-41d4-b797-14a1197867a7` |
| 3 | GET | `/api/v1/gold-purchases/cgp/drafts/:id/business-view` | 200 | `ac344d28-bfa9-40c8-bd88-276a4aa000da` |

`POST_MUTATION_COUNT=1` و`POST_FIX_SYNC_MUTATION_COUNT=0`. كل طلبات التزامن بعد POST كانت GET فقط.

## DB/Event Timeline

المستند الاصطناعي بعد الإصلاح كان `CGPD-000004` على الـClone:

| Entity | Count | Result |
|---|---:|---|
| CGP document | 1 | `POSTED` |
| CGP item | 1 | exactly once |
| Outbox event | 1 | exactly once |
| Integration statuses | 4 | all `SUCCEEDED` |
| Asset | 1 | `CGPA-263a142653eb421bbfb8f87db2` |
| Asset origin | 1 | `CUSTOMER_GOLD_PURCHASE` |
| Barcode | 1 | `GWANK24000004` |
| Inventory movements | 2 | lifecycle entries for same asset |
| Purchase-cost revision | 1 | exactly once |
| Customer liability | 1 | `OPEN`, outstanding `679.1114` |
| Journal | 1 | `JE-1787508037569` |
| Journal lines | 2 | balanced |
| Current valuation | 0 | not part of the CGP posting projection in this runtime; no valuation defect was inferred |

Journal proof: `total_debit=679.11140000`, `total_credit=679.11140000`, status `posted`.

## Root Cause

| Code | Classification | Proof |
|---|---|---|
| `CGP-UI-SYNC-A` | POST response snapshot is intentionally earlier than async projections | Posting service enqueues the event and returns before all consumers finish |
| `CGP-UI-SYNC-F` | Frontend had no bounded revalidation loop | Pre-fix effect issued one `business-view` GET only |
| `CGP-UI-SYNC-X` | Not proven | No API projection defect or accounting mismatch was found |

`ROOT_CAUSE_CONFIDENCE=HIGH`.

## Minimum Safe Design

The implemented design is:

```text
POST once
  -> show Posted / Pending
  -> bounded GET-only business-view revalidation
  -> terminal Succeeded / Failed / Timeout
  -> no automatic repost
```

The success state requires all four canonical integrations (`INVENTORY`, `ACCOUNTING`, `GOLD_CENTER`, `CRM`) to be `SUCCEEDED` and the payable projection to exist. `RETRYABLE_FAILED` is terminal UI failure and does not trigger another POST.

## Source Diff

Intentional control changes:

1. `features/gold-purchases/components/GoldPurchaseDraftWorkspace.tsx`
   - `CgpBusinessViewSyncState` and bounded GET-only revalidation at lines 37–156.
   - Pending, failed and timeout user-visible states at lines 239–241.
2. `tests/cgp-post-ui-sync-surgical-fix.test.cjs`
   - focused static contract tests for interval, timeout, terminal gates and mutation isolation.

No Backend source, migration, seed, tax rule, accounting mapper, settlement mutation, or CGP schema was changed for this control. The workspace already contained substantial unrelated dirty changes; they were preserved and not claimed as part of this control.

`next-env.d.ts` was not manually edited. The build generated the Owner-approved exact Next drift from the prior routes path to the `.next/dev` routes path; it was not reverted.

## Pre-fix Tests

The pre-fix focused run passed the relevant runtime, outbox, readiness, immutable-governance and read-model tests. One unrelated stale test failed:

`backend/tests/cgp-settlement-http-ui-contract.test.cjs` expected the old immutable permission catalog entry `gold_purchase.cgp.settle`. This is a pre-existing governance/test-contract mismatch and was not changed in this control.

## Post-fix Tests

Final focused run:

```text
node --test tests/cgp-post-ui-sync-surgical-fix.test.cjs \
  tests/cgp-approval-removal-financial-readiness.test.cjs \
  tests/cgp-runtime-outbox-dispatcher-contract.test.cjs \
  tests/cgp-imp-02-contract.test.cjs \
  tests/cgp-imp-11-contract.test.cjs \
  backend/tests/cgp-governance-immutable-actionability.test.cjs \
  backend/tests/cgp-post-payment-readmodel-ux.test.cjs
```

Result: `20 pass, 0 fail`.

`npm run typecheck`: PASS.

## Post-fix Disposable E2E

Browser: `localhost:3011`, backend clone on `localhost:8000`, Branch-1.

1. Created one synthetic draft `CGPD-000004`.
2. Validated it once.
3. Clicked Post once.
4. Immediately after POST the UI showed `Posted`, `Pending`, and the Arabic/English progress message that no repost would occur.
5. Without reload or manual refresh, the UI reached `Succeeded` for Inventory, Accounting, Gold Center and CRM, displayed the asset barcode, journal ID, payable and settlement form.
6. Browser logs after the run: no error or warning entries.

## Optional Settlement Sync Test

Not executed. No settlement POST was required because the reported defect was post-to-UI integration visibility, not settlement synchronization. The UI displayed the payable and read-only settlement status automatically; no payment mutation was introduced.

## Exactly-once Proof

The clone DB contains one document, one item, one Outbox event, one asset, one origin, one barcode, one cost revision, one liability and one journal for the post-fix synthetic document. No replay or second POST was sent in the post-fix browser run.

## Main Read-only Browser Proof

The post-fix Clone browser proof passed in both locales:

- EN: `Customer Gold Purchase Drafts`, `Posted`, integration results, asset barcode, journal reference and payable displayed.
- AR: `مسودات شراء الذهب من العملاء`, `تم الترحيل`, `نتائج الترحيل والتكامل`, barcode, journal reference and المستحق displayed.

The official runtime was restored after clone evidence. No official mutation or browser action was performed against the CGP POST endpoint.

## Other Module Regression

Read-only official GET matrix after restoring the official backend returned 200 for:

`health`, `health/db`, `health/redis`, `health/gold`, `branches`, `settings`, `customers`, `suppliers`, `inventory-v2/assets`, `inventory-v2/profiles`, `CGP drafts`, `purchase-orders`, `invoices`, `transfers`, `workshop-orders`, `inventory-v2/audits`, `approval-requests`, `financial/readiness`, `financial/branch-mappings`, `treasury/transactions`, and `gold/fixings`.

No POST/PUT/PATCH/DELETE business endpoint was called on `darfus_erp`.

## DB No-Business-Write Proof

| Official table family | Before | After | Delta |
|---|---:|---:|---:|
| CGP documents | 4 | 4 | 0 |
| Assets | 18 | 18 | 0 |
| Asset origins | 18 | 18 | 0 |
| Inventory movements | 60 | 60 | 0 |
| Journals | 24 | 24 | 0 |
| Customer liabilities | 4 | 4 | 0 |
| Outbox events | 4 | 4 | 0 |
| Integration statuses | 16 | 16 | 0 |

The official backend startup executed its normal migration check and reported `No migrations were executed`; no migration was created or applied by this control.

## Prevention Lessons

- A successful POST response is not proof that asynchronous projections are complete.
- UI state must distinguish Posted from integrated/settle-ready.
- Polling must be bounded, cancellable and GET-only.
- A visible pending state is safer than a false terminal state.
- Reposting is not a synchronization strategy and was explicitly prevented.

## Similar Risk Scan

The same risk pattern exists anywhere a mutation enqueues an asynchronous projection and the UI performs only one immediate read. This control did not broaden into unrelated workflows. The CGP workspace is now guarded by a focused test that prevents reintroducing mutation calls into the synchronization effect.

## Documentation Delta

Created this report:

`docs/DARFUS_CGP_POST_UI_SYNC_FORENSIC_AND_SURGICAL_FIX_01_REPORT.md`

Added focused test:

`tests/cgp-post-ui-sync-surgical-fix.test.cjs`

## Remaining Risks

1. `backend/tests/cgp-settlement-http-ui-contract.test.cjs` retains a stale expectation about the immutable permission catalog; it is outside this surgical UI sync fix.
2. CGP posting does not create a Treasury settlement automatically; payment remains a separate authorized action and was not mutated here.
3. The normal local `next-env.d.ts` generated drift remains Owner-approved and was not manually changed.
4. Disposable clone data is evidence only and is not production/master data.

## Gate

| Gate criterion | Result |
|---|---|
| Root cause proven before fix | PASS |
| Pre-fix stale state reproduced | PASS |
| Post-fix no manual refresh | PASS |
| POST mutation count | 1 |
| Post-fix sync mutations | 0 |
| GET-only revalidation | PASS |
| Clone exactly-once integrity | PASS |
| Asset/accounting/liability visibility | PASS |
| AR browser | PASS |
| EN browser | PASS |
| Console errors after run | 0 |
| Official DB business delta | 0 |
| P0/P1 introduced | 0 |

`GATE = PASS_CGP_POST_UI_SYNC_SURGICAL_FIX`

## Final Tokens

```text
CONTROL_ID = DARFUS-CGP-POST-UI-SYNC-FORENSIC-AND-SURGICAL-FIX-01
OFFICIAL_DATABASE = darfus_erp
OFFICIAL_DB_BUSINESS_WRITES = 0
DISPOSABLE_CLONE_MUTATION = YES
NEW_OFFICIAL_CGP = NO
NEW_CLONE_CGP = 1
POST_MUTATION_COUNT = 1
POST_FIX_SYNC_MUTATION_COUNT = 0
POST_FIX_SYNC_METHODS = GET_ONLY
PRE_FIX_MANUAL_REFRESH_REQUIRED = YES
POST_FIX_MANUAL_REFRESH_REQUIRED = NO
CGP_UI_SYNC_ROOT_CAUSE = CGP-UI-SYNC-A + CGP-UI-SYNC-F
ROOT_CAUSE_CONFIDENCE = HIGH
BACKEND_BUSINESS_LOGIC_CHANGED = NO
MIGRATION_CREATED = NO
MIGRATION_EXECUTED_BY_CONTROL = NO
ASSET_EXACTLY_ONCE = PASS
BARCODE_EXACTLY_ONCE = PASS
INTEGRATION_STATUS_EXACTLY_ONCE = PASS
ACCOUNTING_BALANCED = PASS
LIABILITY_EXACTLY_ONCE = PASS
SETTLEMENT_MUTATION = NOT_RUN
AR_BROWSER = PASS
EN_BROWSER = PASS
FOCUSED_TESTS = PASS (20/20)
TYPECHECK = PASS
OFFICIAL_DB_DELTA = 0
P0_COUNT = 0
P1_COUNT = 0
GATE = PASS_CGP_POST_UI_SYNC_SURGICAL_FIX
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

تم إيقاف التنفيذ بعد التقرير. لا توجد CGP أو Settlement إضافية، ولا يبدأ أي Batch لاحق تلقائيًا.
