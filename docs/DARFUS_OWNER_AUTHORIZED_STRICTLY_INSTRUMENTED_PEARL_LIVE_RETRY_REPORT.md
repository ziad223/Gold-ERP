# DARFUS ERP — Owner-Authorized Strictly Instrumented Pearl Live Retry Report

النتيجة المختصرة: تم تنفيذ ضغطة Confirm واحدة فقط على `darfus_erp` وأعادت `201` وأنشأت Receive واحدًا مكتملًا مع PO وAsset وBarcode وMovement وCost Revision وCurrent Valuation وقيد محاسبي متوازن. لم يتم تنفيذ ضغط ثانٍ أو Receive إضافي أو تنظيف. فشل الإغلاق النهائي لأن Exact Idempotency Replay لم يمكن إرساله من جلسة المتصفح الحالية دون كشف/إعادة إنشاء بيانات المصادقة، كما أن POS أعاد الأصل كسجل واحد غير قابل للاختيار بسعر `AED 0.00` رغم أن `Asset.price=5000`. قاعدة البيانات الرسمية تحتوي الآن على هذه المعاملة المصرح بها، ولم تحدث أي كتابة يدوية أو Migration/Seed.

## 1. Executive Summary

- Official live Receive: PASS، HTTP `201`، طلب واحد فقط.
- DB/Asset/Component/Barcode/Movement/Cost/Valuation/Accounting: PASS.
- AR وEN Asset readback: PASS، ولا توجد معرفات Master Data داخلية ظاهرة.
- POS barcode read-only: FAIL؛ نتيجة واحدة ظهرت لكن السعر `0.00 / unavailable` والزر disabled.
- Exact Replay: BLOCKED؛ لم يُرسل أي Replay POST.
- Same-key changed-payload `409`: NOT RUN، لأن الضبط يتطلب إثبات Replay أولًا.
- No second Confirm، no cleanup، no migration، no seed، no production contact.

## 2. Owner Authorization

Control: `DARFUS-OWNER-AUTHORIZED-STRICTLY-INSTRUMENTED-PEARL-LIVE-RETRY`.

Owner authorization allowed exactly one official Pearl Confirm against `darfus_erp`. The single click was performed by the user at the final gate. The evidence is in artifacts `15`–`18`.

## 3. Prior Gates

All prior control gates were recorded as PASS before the click: auth path, Pearl Size binding, auth freshness fix, dispatch diagnostics, runtime readiness, and no-intercept runtime. No new source defect was fixed in this control.

## 4. Runtime State

`NEXT_PRODUCTION_START_LOCALHOST`, `NODE_ENV=production`, frontend `localhost:3000`, backend `localhost:8000`, diagnostics ON, interception OFF. The frontend was not started in dev mode. No `next-env.d.ts` change was made.

## 5. LL-011 to LL-014

| Lesson | Result | Evidence |
|---|---|---|
| LL-011 auth freshness | PASS | pre-confirm auth freshness, context recompare, hash recompare |
| LL-012 internal master labels | PASS | AR/EN readback showed business labels; visible internal IDs = 0 |
| LL-013 click-to-backend dispatch | PASS | artifact 15; click → handler → guards → API client → fetch → backend → 201 |
| LL-014 diagnostics/interception independence | PASS | diagnostics ON and interception OFF |

## 6. Pre-Live Tests

Focused set: `38 pass, 0 fail`. Typecheck and production build were PASS before the final gate. The same focused set was rerun after the live Receive with `38 pass, 0 fail`; see artifact 30.

## 7. AR/EN Preview Parity

The frozen prepared request used `PRE_TAX_BASE=3984`, `vatRate=14`, `taxIncluded=false`, and `applyVat=true`. The expected tax was `557.76`, total `4541.76`. The persisted PO snapshot matches these economic values.

## 8. Pearl Master Label Check

Pearl Size was persisted through the canonical master-data reference and displayed as `8.5` in the readback. No `PSMD-*` or other internal master ID was visible in AR or EN.

## 9. Exact Prepared Request

Artifact 06 is the saved exact prepared business request. It contains one `PEARL_JEWELLERY` item, one Pearl group, purchase cost `3984`, selling price `5000`, supplier `SUP-001`, canonical branch/location, and the frozen idempotency key. No secret, token, cookie, or Authorization value was saved.

## 10. Canonical Business Hash

Artifact 07 stores the canonical business hash. Recompare before click passed:

`315147360599ce7c359c22074dc33dc4f423ea48f7ad70df4e9a7c66a0b03453`

The idempotency key was excluded from the business hash as required.

## 11. Rollback Request

Artifact 08 contains the prepared canonical rollback request. It was not used against the official DB. No cleanup or rollback was executed after the successful official Receive.

## 12. Clone Receive

The exact prepared request was proven on disposable clone `darfus_erp_pearl_live_clone_20260822_01`: HTTP `201`, one Asset, one barcode, one movement, one cost revision, one valuation, one journal, and one idempotency row.

## 13. Clone Rollback

The disposable clone was restored from the fresh dump and returned to its baseline counts. Clone persistent business delta after rollback was `0`. The official DB was not involved in clone rollback.

## 14. Official DB Baseline

Immediately before the official click, `current_database()` was `darfus_erp`. Baseline counts were: PO 12, PO items 12, Assets 12, Pearl Assets 0, Components 9, Pearl details 0, Barcode history 12, Origins 12, Cost revisions 12, Valuations 12, Movements 12, Journals 15, Journal lines 42, Idempotency 16, Cash transactions 3.

## 15. Fresh Backup

Fresh backup created before the final live gate:

`backend/backups/darfus_erp_owner_authorized_pearl_live_retry_20260822_123856.dump`

Bytes: `710820`. SHA-256: `2a5385af25c9b5c09ece37726c162dea410a060f9cf9b04ae2429d8c3a2dd856`. `pg_restore -l`: PASS, 1194 TOC lines. See artifact 12.

## 16. Final Auth Freshness

Auth preflight returned `FRESH`. Company and branch contexts matched the prepared request. No token or credential value is included in this report.

## 17. Final Request/Hash Recompare

Prepared request remained present, immutable for the final click, and hash/context recompare passed. `BUSINESS_FIELD_MISMATCH_COUNT=0`.

## 18. One Manual Confirm

Exactly one user Confirm click was recorded. The confirmation dialog closed after the successful response. No second click, automatic retry, or additional Receive was performed.

## 19. Live Dispatch Correlation

Correlation ID: `PEARL-DISPATCH-f60f0f04-810f-4307-afb3-246279231c11`.

Click count 1; handler 1; API client 1; fetch 1; first blocking guard NONE; backend request observed. Backend request ID: `a792e757-8668-40c3-897e-6e6fd86f7f43`.

## 20. Browser Network Result

Browser observed `POST /api/v1/purchase-orders/receive` with status `201`. Console errors were zero. Diagnostics remained ON and interception OFF.

## 21. Backend Request Correlation

The official backend log showed exactly one relevant line:

`2026-08-22 09:40:26 info: POST /api/v1/purchase-orders/receive 201 267.090ms outcome=completed request_id=a792e757-8668-40c3-897e-6e6fd86f7f43`

No second receive POST was observed.

## 22. Live HTTP Response

HTTP `201`; PO `PO-1787391626460`; Asset `AST-PUR-1787391626468-1-1-wf0w`; Barcode `PLRNG18000001`; Journal `JE-1787391626555`.

## 23. Official DB Reconciliation

After the authorized Receive: PO +1, PO item +1, Asset +1, Pearl Asset +1, component +1, Pearl detail +1, barcode history +1, origin +1, cost revision +1, valuation +1, movement +1, journal +1, journal lines +3, idempotency +1, cash +0. No duplicate rows were observed. See artifact 19.

## 24. Asset / Components

The new record is one top-level `PEARL_JEWELLERY` Asset with operational status `AVAILABLE`, supplier `SUP-001`, branch `BR-3241...6767c`, location `LOC-9a10...159151`, Asset price `5000`, and historical cost `3984`. Product quantity was not used as physical authority.

## 25. Pearl Details

One Pearl component and one Pearl detail were persisted: quantity 1, combined weight 1.2 g, purchase cost 1500, current value 1600, Akoya, White, Round, High luster, Japan. Quantity did not multiply combined weight or cost.

## 26. Barcode

Exactly one active barcode row exists for the Asset: `PLRNG18000001`, server-generated with inventory code `PL`, item code `RNG`, karat `18`, six-digit serial, revision 1.

## 27. Historical Purchase Snapshot

Gross 12 g; Pearl 1.2 g; net gold 10.8 g; pure gold 8.1 g; purchase gold rate 200; gold value 2160; making 30/g and total 324; Pearl cost 1500; pre-tax base 3984; VAT 14% and 557.76; purchase total 4541.76. The PO snapshot has `tax_base=3984`, `input_vat_amount=557.76`, and `total=4541.76`. The persisted PO representation has `tax_included=true` for the tax-inclusive total while the prepared item contract used the pre-tax cost; the monetary parity is correct.

## 28. Current Valuation

Current Gold Center rate `407.62049952`; current gold value `4402.30139482`; current making `324`; current Pearl value `1600`; VAT base `6326.30139482`; VAT `885.68219527`; current total `7211.98359009`. The current valuation is separate from the historical purchase snapshot.

## 29. Accounting

Journal `JE-1787391626555` is posted and balanced:

- Dr `SYS-INVENTORY`: 3984
- Dr `1400` recoverable VAT: 557.76
- Cr `SYS-AP`: 4541.76

Total debit = total credit = `4541.76`; cash delta = 0. Supplier payable is represented by the AP credit.

## 30. Idempotency Exact Replay

`BLOCKED_PEARL_IDEMPOTENCY`. After the proven 201, the saved exact request and key were available, but the current authenticated browser control surface did not expose an authenticated request channel (`fetch` was unavailable in its evaluation surface). No token, cookie, password, or Authorization header was inspected or regenerated. No Replay POST was sent. The official idempotency row remains `succeeded/201` with the saved canonical hash and no post-attempt business delta.

## 31. Idempotency Changed-Payload Conflict

Not run. The control requires exact replay proof before the changed-payload conflict proof. Running it without a safe authenticated channel would violate the no-guessing and no-additional-business-request guardrail.

## 32. AR Readback

PASS. AR Asset detail displayed Pearl Jewellery, barcode, status, branch/location, weights, karat, Pearl data, historical cost, current valuation, and selling price. Visible internal master IDs: 0. Console errors: 0.

## 33. EN Readback

PASS. EN Asset detail displayed the same identity and financial separation. Visible internal master IDs: 0. Console errors: 0.

## 34. POS Read-Only

FAIL. Barcode search returned one result for `PLRNG18000001`, but the visible result showed `AED 0.00`, `Current selling price unavailable`, and a disabled result button. No checkout was performed. This is a separate P1 closure blocker because it prevents the new Pearl Asset from being selected through the POS barcode path even though Asset detail shows `Asset.price=5000`.

## 35. Post-Live Regression

The focused post-live suite passed 38/38 with zero failures. No source or configuration change was made after the Receive. POS remains the observed runtime gap described in section 34.

## 36. Historical P1 Resolution

The historical ambiguous-click root cause remains `NOT_PROVEN`. The current dispatch defect class is proven prevented for this run because the full chain reached backend `201`. It cannot retire the module because the required exact replay and POS proofs remain incomplete.

## 37. P0/P1

- P0: 0.
- P1: 2.
  1. `BLOCKED_PEARL_IDEMPOTENCY`: exact same-key replay and changed-payload 409 were not proven.
  2. `PEARL_POS_PRICE_READBACK`: POS search returned a disabled zero-price result while Asset.price is 5000.

## 38. Gate

`GATE = BLOCKED_PEARL_IDEMPOTENCY`

The overall Pearl module remains `OPEN`. POS is an additional independently recorded P1 blocker. The success gate is not claimed.

## 39. Final Tokens

```text
CURRENT_CONTROL = DARFUS-OWNER-AUTHORIZED-STRICTLY-INSTRUMENTED-PEARL-LIVE-RETRY
LOCAL_MAIN_DB = darfus_erp
OWNER_AUTHORIZED_LIVE_RETRY = YES
ACTUAL_ACCEPTANCE_RUNTIME = NEXT_PRODUCTION_START_LOCALHOST
FINAL_RUNTIME_DIAGNOSTICS = ON
FINAL_RUNTIME_INTERCEPTION = OFF
SOURCE_CHANGES = 0_EXPECTED
MIGRATIONS_EXECUTED = 0
SEEDS_EXECUTED = 0
MASTER_DATA_MUTATION = NO
PRE_LIVE_TESTS = 38_PASS_0_FAIL
AR_PROFILE_PREVIEW = READY
EN_PROFILE_PREVIEW = READY
SHARED_PREVIEW = READY
PRE_TAX_BASE = 3984
VAT_RATE = 14
VAT_AMOUNT = 557.76
PURCHASE_TOTAL = 4541.76
PEARL_SIZE_INTERNAL_ID_VISIBLE = NO
EXACT_PREPARED_REQUEST_ARTIFACT = PRESENT
CANONICAL_BUSINESS_HASH_ARTIFACT = PRESENT
BUSINESS_FIELD_MISMATCH_COUNT = 0
ROLLBACK_REQUEST_ARTIFACT = PRESENT_NOT_USED_OFFICIAL
CLONE_RECEIVE = PASS
CLONE_ROLLBACK = PASS
CLONE_PERSISTENT_BUSINESS_DELTA = 0
PRE_LIVE_DB_BASELINE = PRESENT_CURRENT_DATABASE_darfus_erp
PRE_RETRY_BACKUP = PASS
PRE_RETRY_BACKUP_BYTES = 710820
PRE_RETRY_BACKUP_SHA256 = 2a5385af25c9b5c09ece37726c162dea410a060f9cf9b04ae2429d8c3a2dd856
PRE_RETRY_BACKUP_RESTORE_LIST = PASS
AUTH_FRESHNESS_PREFLIGHT = PASS_FRESH
COMPANY_CONTEXT_MATCH = true
BRANCH_CONTEXT_MATCH = true
REQUEST_RECOMPARE = PASS
HASH_RECOMPARE = PASS
LIVE_ADDITIONAL_CONFIRM_CLICKS = 1
CLICK_EVENT_COUNT = 1
HANDLER_ENTRY_COUNT = 1
FIRST_BLOCKING_GUARD = NONE
API_CLIENT_ENTRY_COUNT = 1
FETCH_ATTEMPT_COUNT = 1
BROWSER_REQUEST_OBSERVED = YES
BACKEND_REQUEST_OBSERVED = YES
BACKEND_REQUEST_ID = a792e757-8668-40c3-897e-6e6fd86f7f43
LIVE_RECEIVE_HTTP = 201
LIVE_PO = PO-1787391626460
LIVE_ASSET = AST-PUR-1787391626468-1-1-wf0w
LIVE_BARCODE = PLRNG18000001
LIVE_JOURNAL = JE-1787391626555
OFFICIAL_DB_DELTA = ONE_AUTHORIZED_RECEIVE_ONLY
PEARL_COMPONENT_COUNT = 1
PEARL_DETAIL_COUNT = 1
PEARL_GROUP_QUANTITY = 1
PEARL_GROUP_TOTAL_WEIGHT = 1.2
PEARL_GROUP_COST = 1500
PEARL_GROUP_DOUBLE_MULTIPLICATION = NO
VAT_APPLICATION_COUNT = 1
CURRENT_GOLD_RATE = 407.62049952
CURRENT_ITEM_COST = 7211.98359009
SELLING_PRICE_AUTHORITY = ASSET_PRICE
JOURNAL_BALANCED = YES
CASH_DELTA = 0
IDEMPOTENCY_EXACT_REPLAY = BLOCKED
IDEMPOTENCY_CHANGED_PAYLOAD_409 = NOT_RUN
AR_ASSET_READBACK = PASS
EN_ASSET_READBACK = PASS
POS_BARCODE_READ_ONLY = FAIL_POS_PRICE_READBACK
LL011_PREVENTION_WORKED = YES
LL012_LABEL_PREVENTION_WORKED = YES
LL013_DISPATCH_PROOF_WORKED = YES
LL014_DIAGNOSTICS_INTERCEPTION_INDEPENDENCE_WORKED = YES
HISTORICAL_ROOT_CAUSE = NOT_PROVEN
HISTORICAL_AMBIGUITY_STATUS = CURRENT_CHAIN_PROVEN_BUT_MODULE_NOT_CLOSED
POST_LIVE_REGRESSION = 38_PASS_0_FAIL
P0_COUNT = 0
P1_COUNT = 2
GATE = BLOCKED_PEARL_IDEMPOTENCY
PEARL_JEWELLERY_FINAL_USER_WORKFLOW_CLOSED = NO
PEARL_JEWELLERY_MODULE_STATUS = OPEN
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_OF_SAFE_AUTHENTICATED_REPLAY_CHANNEL_AND_POS_PRICE_MAPPING
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 40. STOP

لا يتم تنفيذ Replay أو Conflict أو Receive إضافي أو إصلاح POS أو تنظيف بيانات في هذا الـControl. التقرير والأدلة محفوظة، والـOfficial DB لم يتعرض إلا إلى Receive الواحد المصرح به. التوقف الآن بانتظار Owner Review.
