# DARFUS ERP — Loose Diamond vatRate Contract Fix + Final Controlled Receive

## 1. Executive Summary

تم تنفيذ الحد الأدنى من إصلاح عقد `currentValuation.vatRate`، ثم اجتازت الصفحة AR/EN والاختبارات وـrollback harness، وبعد نسخة احتياطية جديدة تم تنفيذ Receive واحد فقط من واجهة Loose Diamond على `darfus_erp`. نجح الاستلام بـHTTP `201`، وأنشأ PO واحدًا وPO Item واحدًا وAsset ألماس حر واحدًا، مع Barcode وOrigin وCost Revision وCurrent Valuation وMovement وقيد محاسبي متوازن.

تم تنفيذ replay بالمفتاح نفسه دون أي Business duplicates، ثم أُرسل payload مختلف بالمفتاح نفسه فعاد `409 STATE_CONFLICT`. لم يتم تنفيذ Receive ثانٍ أو Payment أو RFID أو Migration أو Seed أو Cleanup أو Production contact.

`GATE = PASS_LOOSE_DIAMOND_FINAL_CONTROLLED_UI_RECEIVE_CLOSURE` لهذا الـControl فقط. توجد ملاحظة legacy منفصلة: payload يرسل `sellingPrice=8000` بينما مسار الاستلام الحالي يpersist `Asset.price=6600` بسبب fallback قديم؛ لم يتم تغييرها في هذا الـControl، ولا تُخفى عن Owner Review.

## 2. Proven Root Cause

السبب المثبت سابقًا كان:

`FRONTEND_CURRENT_TAX_PROPERTY_NAME_MISMATCH`
→ الواجهة قرأت `preview.current?.currentTax?.effectiveVatRate`
→ العقد الفعلي يعيد `preview.current.taxSnapshot.effectiveVatRate`
→ `currentValuation.vatRate` اختفى أثناء JSON serialization
→ فشل Sequelize عند named replacement `:vatRate` داخل `asset_current_valuations`.

الـone-field differential rollback بإضافة rate فقط وصل إلى commit barrier ثم rollback. لم يُعاد فتح أسباب 422 أو certificateCost أو Double VAT.

## 3. Actual Preview Contract

| Contract | Proven value | Evidence |
|---|---|---|
| Actual current tax response path | `preview.current.taxSnapshot` | `backend/src/services/loose-diamond-profile.service.js` preview response |
| Effective rate field | `preview.current.taxSnapshot.effectiveVatRate` | server tax snapshot and AR/EN prepared payload |
| Purchase preview | base `5000.00`, VAT `700.00`, total `5700.00` | AR/EN runtime preview and persisted PO |
| Current valuation preview | base `6200.00`, VAT `868.00`, total `7068.00` | AR/EN runtime preview and persisted current valuation |
| Configured rate | `14%` | server-derived company tax preview; not hardcoded in source |

## 4. Minimum Safe Frontend Fix

تم تعديل `app/[locale]/(dashboard)/inventory/loose-diamond/page.tsx` فقط في العقد المباشر:

- قراءة rate من `preview?.current?.taxSnapshot?.effectiveVatRate`.
- تمريرها إلى `currentValuation.vatRate`.
- منع تجهيز/إرسال الطلب إذا كانت القيمة الحالية خاضعة للضريبة وrate غير موجودة.
- رسالة UI آمنة للمستخدم، بدون fallback أو نسبة ثابتة.
- لا تعديل على Purchase VAT أو `taxIncluded` أو `applyVat` أو السعر أو Supplier/Location أو Barcode.

`MINIMUM_SAFE_FRONTEND_FIX = PASS`.

## 5. Files Changed

Control-intentional files:

- `app/[locale]/(dashboard)/inventory/loose-diamond/page.tsx`
- `tests/loose-diamond-vatrate-contract.test.cjs`
- `docs/DARFUS_LOOSE_DIAMOND_VATRATE_CONTRACT_FIX_FINAL_CONTROLLED_RECEIVE_REPORT.md`

`backend/src/...` لم يُعدّل لهذا الإصلاح؛ عقد الخادم كان صحيحًا. الـworktree كان dirty مسبقًا ويحتوي ملفات Product/Backend/Docs كثيرة غير مملوكة لهذا Control، ولم يتم تنظيفها أو reset أو stash أو restore.

## 6. Prepared Request Regression

`tests/loose-diamond-vatrate-contract.test.cjs`: 3/3 PASS.

أثبت الاختبار:

- source-preview rate path موجود.
- `vatRate: currentValuationVatRate` موجود.
- mapping القديم `currentTax` غير موجود.
- لا يوجد `vatRate: 14` hardcode.
- missing-rate fail-closed موجود.
- user-facing copy لا تعرض Supplier V2 أو Backend أو API أو perPiece أو Idempotency أو Request Fingerprint.

## 7. Missing-Rate Fail-Closed Regression

`MISSING_SERVER_CURRENT_VAT_RATE_FAILS_CLOSED = PASS`.

عند وجود current valuation taxable بدون rate server-derived، لا يصبح زر الإرسال جاهزًا ولا يُبنى طلب Receive ناقص.

## 8. UI Cleanup Regression

`TECHNICAL_INTERNAL_NOTES_VISIBLE = NO` في فحص نصوص صفحة الإدخال.
المساعدة التجارية وTooltips بقيت متاحة بلغة المستخدم. لا تغيير UI واسع أو حقول جديدة.

## 9. Typecheck / Focused Tests

| Test | Result |
|---|---|
| `node --test tests/loose-diamond-vatrate-contract.test.cjs` | 3/3 PASS |
| `node --test backend/tests/loose-diamond-minimum-safe-implementation.test.cjs` | 12/12 PASS |
| `node --test tests/asset-final-closure.test.cjs` | 9/9 PASS |
| `node --test tests/barcode-final-closure.test.cjs` | 11/11 PASS |
| `node --test tests/unified-inventory-intake-ux-02-r3.test.cjs` | 5/5 PASS |
| `npm run typecheck` | PASS |

`FINAL_FOCUSED_TESTS = PASS`.
`FINAL_RELEVANT_REGRESSION = PASS`.
`FINAL_TYPECHECK = PASS`.

## 10. Runtime Source Proof

- Frontend runtime: `localhost:3000`, `next start`, not Next dev.
- Build ID: `Fsyt9l-PrMTdbrJe5RbTj`.
- `next-env.d.ts` SHA256: `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651`, the Owner-accepted generated final hash.
- Loose Diamond page SHA256: `6228BDC4556489BEB13B48AED929B01962260EBA4C2A9FDB9DC4BFF3122E26F0`.
- Backend host/runtime source parity: host `inventory-v2-runtime.service.js` SHA256 `E7E72F8AD2B124DE159547AC47E7367E9FFCBBC8564AAE7B724B366CDED8932A`; container-mounted source matched case-insensitively.

`CORRECTED_FRONTEND_RUNTIME_SERVED = YES`.

## 11. AR Preview

AR `/ar/inventory/loose-diamond` with synthetic values reached READY. Profile and shared preview were ready, purchase base/VAT/total were `5000/700/5700`, current valuation was `6200/868/7068`, and current rate was the server-derived `14`.

`AR_PREVIEW = PASS`.
`AR_PROFILE_PREVIEW = READY`.
`AR_SHARED_PREVIEW = READY`.
`AR_PREVIEW_PARITY = PASS`.

## 12. EN Preview

EN `/en/inventory/loose-diamond` reached READY with the same synthetic values, rate `14`, and no browser error logs.

`EN_PREVIEW = PASS`.
`EN_PROFILE_PREVIEW = READY`.
`EN_SHARED_PREVIEW = READY`.
`EN_PREVIEW_PARITY = PASS`.
`AR_EN_FINANCIAL_PARITY = PASS`.

## 13. Exact Corrected Browser Request

Captured before POST from the production prepared-request panel:

| Field | Value |
|---|---|
| profile | `LOOSE_DIAMOND` |
| inventoryV2 | `true` |
| quantity | `1` |
| perPiece length | `1` |
| inventory code / item code / karat code | `DD / LOS / 00` |
| purchasePricePreTax | `5000.00000000` |
| currentDiamondValuePreTax | `6200.00000000` |
| sellingPrice | `8000.00000000` |
| taxIncluded | `false` |
| applyVat | `true` |
| currentValuation.vatRate | `14` |
| colors | `F`, `G` canonical refs, once each |
| supplier / location | `SUP-002` / `LOC-9a10f58e-4207-4512-8824-7a7b06159151` |

`EXACT_CORRECTED_BROWSER_REQUEST_CAPTURED = YES`.

## 14. vatRate Source Proof

The prepared request used `preview.current.taxSnapshot.effectiveVatRate`. The value was present, numeric, and not undefined. The focused test rejects a hardcoded `14` mapping, and runtime JSON showed the field as `14` only after server Preview resolution.

`PREPARED_REQUEST_CURRENT_VALUATION_VAT_RATE_PRESENT = YES`.
`PREPARED_REQUEST_CURRENT_VALUATION_VAT_RATE_SOURCE = SERVER_PREVIEW`.
`HARDCODED_VAT_RATE = NO`.

## 15. Exact Browser Payload Rollback

The exact corrected browser request was executed through the canonical backend receive handler using the same backend source, company, branch, supplier, location, tax context, and official database. The transaction was stopped by an explicit commit barrier and rolled back.

Result: `REACHED_COMMIT_BARRIER`.

The prior `Named replacement ":vatRate" has no entry in the replacement map` error did not recur.

## 16. Commit Barrier / Rollback Proof

| Check | Result |
|---|---|
| `current_database()` before/after harness | `darfus_erp` / `darfus_erp` |
| Commit barrier reached | YES |
| vatRate replacement error | NO |
| Transaction rollback | PASS |
| Persistent business delta | `0` across PO, Asset, evidence, Movement, Journal, Cash, Idempotency, Audit tables |

`PERSISTENT_BUSINESS_DELTA_BEFORE_REAL_RECEIVE = 0`.

## 17. DB Baseline

Final baseline immediately before the backup/real Receive:

| Entity | Count |
|---|---:|
| purchase_orders | 9 |
| purchase_order_items | 9 |
| assets | 9 |
| asset_components | 6 |
| asset_diamond_component_details | 6 |
| asset_barcode_history | 9 |
| asset_rfid_assignments | 2 |
| asset_origins | 9 |
| asset_purchase_cost_revisions | 9 |
| asset_current_valuations | 9 |
| inventory_asset_movements | 9 |
| journal_entries | 12 |
| journal_lines | 33 |
| cash_transactions | 3 |
| idempotency_requests | 12 |
| audit_logs | 63 |
| LOOSE_DIAMOND assets | 0 |

## 18. Fresh Pre-Receive Backup

- Database: `darfus_erp`.
- Path: `backend/backups/darfus_erp_PRE_FINAL_LOOSE_DIAMOND_RECEIVE_20260821_123143Z.dump`.
- Size: `695220` bytes.
- SHA256: `1AC5042B386EB88AF392D3C8BB13967E754E96E2E4DA487B9EE0625E2B5D7F17`.
- `pg_restore -l`: PASS, 1186 listing lines, exit `0`.
- Backup timestamp: `2026-08-21 12:31:43Z`.
- Receive POST timestamp: `2026-08-21 12:33:43Z`.

`PRE_RECEIVE_BACKUP = PASS`.
`BACKUP_PRECEDES_RECEIVE_POST = YES`.

## 19. Frozen Real Receive Request

The request was frozen from the AR production builder before POST. The new idempotency key was:

`81668d6a-73dd-4960-9b76-215950a6ae12`

It was not used by the earlier failed attempts. The single UI flow was:

`Inventory → Loose Diamond → Profile Preview → Shared Preview → Receive → Confirm Receive`.

`NEW_REAL_RECEIVE_REQUEST = YES`.
`NEW_REAL_RECEIVE_IDEMPOTENCY_KEY = YES`.
`EXACT_REQUEST_CAPTURED_BEFORE_POST = YES`.
`IDEMPOTENCY_KEY_CAPTURED_BEFORE_POST = YES`.

## 20. Real Controlled Receive

Exactly one click on the final `تأكيد الاستلام` button was executed. Backend log evidence:

```text
POST /api/v1/purchase-orders/receive 201 204.670ms outcome=completed
request_id=29ce7f1f-fcac-4da1-9bb4-ba698400bb87
Entry JE-1787315623898 posted (purchase_order:PO-1787315623819) — Dr 5700 / Cr 5700
```

`ORIGINAL_UI_RECEIVE_HTTP = 201`.
`ORIGINAL_UI_RECEIVE = PASS_201`.
`SUCCESSFUL_NEW_LOOSE_DIAMOND_RECEIVES = 1`.

## 21. PO / PO Item

- PO: `PO-1787315623819`, status `received`.
- PO Item: `POI-1787315623854-1-1`.
- Supplier: `SUP-002`.
- Company/Branch: `COMP-48ab554f-427e-4642-9419-bc8616c2dc36` / `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c`.
- Quantity: `1`; product_id: NULL; asset_id linked.
- Tax base: `5000.00000000`; VAT: `700.00000000`; total: `5700.00000000`.

`NEW_PO = 1` and `NEW_PO_ITEM = 1`.

## 22. Asset Cardinality

- Asset: `AST-PUR-1787315623826-1-1-z3ig`.
- Profile: `LOOSE_DIAMOND`.
- One stone / one Asset: PASS.
- Components: one primary diamond component; mounted components: `0`.
- Asset status: `AVAILABLE` / operational status `AVAILABLE`.
- RFID assignment delta: `0`.

`NEW_LOOSE_DIAMOND_ASSET = 1`.
`ONE_STONE_ONE_ASSET = PASS`.
`MOUNTED_COMPONENTS = 0`.

## 23. Barcode

Barcode: `DDLOS00000001`.

- Prefix segments: `DD / LOS / 00`.
- One active initial history row.
- Distinct barcode count for the new Asset: `1`.
- No replacement or RFID operation.

`BARCODE_DD_LOS_00 = PASS`.
`RFID_DELTA = 0`.

## 24. Multi-Color

The persisted primary component contains `color = F, G`; normalized detail output contains F once and G once. No duplicate color reference was persisted.

`MULTI_COLOR_PERSISTENCE = PASS`.
`COLOR_F_COUNT = 1`.
`COLOR_G_COUNT = 1`.

## 25. Purchase Cost Revision

Revision `1` for the new Asset persisted:

- `gold_value = 5000.00000000` as the canonical historical value field for this profile.
- `vat_base = 5000.00000000`.
- `vat_amount = 700.00000000`.
- `total_purchase_cost = 5000.00000000`.
- `mapping_classification = V2_RUNTIME_RECEIPT`.

Recoverable VAT was not capitalized into the Asset acquisition cost.

`PURCHASE_COST_PRETAX = 5000.00`.

## 26. Current Valuation

The new current valuation persisted:

- component/current base: `6200.00000000`.
- VAT rate: `14.000000` from `TAX_ENGINE`.
- VAT amount: `868.00000000`.
- total: `7068.00000000`.
- version: `1`.

`CURRENT_VALUATION = PASS`.
`CURRENT_VALUATION_VAT_RATE_PERSISTED = PASS`.
`CURRENT_VALUATION_VAT_RATE = 14.000000`.

## 27. Current Valuation VAT Rate Persistence

Preview rate `14` = prepared request rate `14` = persisted current valuation rate `14`. The purchase VAT snapshot remains separate at base `5000` / VAT `700`; current valuation VAT is not posted to the PO or AP journal.

`HISTORICAL_CURRENT_SEPARATION = PASS`.

## 28. Tax Snapshot

The PO tax snapshot persisted:

```text
resolvedTaxTreatment = STANDARD_VAT
requestedTaxTreatment = STANDARD_VAT
taxableBase = 5000
effectiveVatRate = 14
vatAmount = 700
roundingScale = 2
taxCalculationVersion = DARFUS-UAE-TAX-03B-G2A2-V1
```

Profile Preview = Shared Preview = PO tax base/VAT/total = persisted tax snapshot. VAT was applied once.

`TAX_PARITY = PASS`.
`DOUBLE_VAT = NO`.

## 29. Supplier Payable

The received PO is unpaid. `paidAmount = 0`; remaining payable is `5700.00000000`. No Payment endpoint was called and `cash_transactions` remained unchanged at `3`.

`SUPPLIER_PAYABLE = PASS`.
`PAYMENT_EXECUTED = NO`.
`CASH_DELTA = 0`.

The canonical receive route updated the existing supplier's operational `lastOrder` field to the receive date; no Supplier identity, creation, provisioning, or payment mutation occurred.

## 30. Journal

New journal: `JE-1787315623898`, posted, source `purchase_order / PO-1787315623819`.

| Account | Debit | Credit |
|---|---:|---:|
| SYS-INVENTORY | 5000.00 | 0.00 |
| 1400 Input VAT | 700.00 | 0.00 |
| SYS-AP Supplier Payable | 0.00 | 5700.00 |

Total debit = `5700.00`; total credit = `5700.00`.

`NEW_JOURNAL_BALANCE = PASS`.

## 31. Financial Reconciliation

`PO tax base + purchase VAT = PO total`:

`5000.00 + 700.00 = 5700.00`.

The same values reconcile to the input VAT debit and supplier payable credit. Current valuation `6200 + 868 = 7068` remains a separate valuation/display snapshot and was not added to the purchase journal.

## 32. Origin / Movement

- One Asset Origin: `PURCHASE_ORDER`, linked to `POI-1787315623854-1-1`, classification `V2_RUNTIME_RECEIPT`.
- One Movement: `PURCHASE_RECEIVE`, source `PURCHASE_ORDER / PO-1787315623819`, to branch `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c`, to location `LOC-9a10f58e-4207-4512-8824-7a7b06159151`.

`ORIGIN = PASS`.
`MOVEMENT = PASS`.

## 33. Idempotency Replay

The UI `إعادة إرسال العملية` button replayed the retained original request with the exact original key. The response returned the same PO/Asset/Journal response. No new business rows were created.

The idempotency row remained one succeeded row with status code `201` and one request hash.

`IDEMPOTENCY_EXACT_REPLAY = PASS_NO_DUPLICATES`.

## 34. Same-Key Conflict

The UI `إرسال نسخة معدلة` sent a changed payload using the same key. The response was:

```json
{"status":409,"errorCode":"STATE_CONFLICT","message":"تم استخدام مفتاح منع التكرار (Idempotency-Key) لطلب مختلف"}
```

No PO, Asset, Movement, Journal, or Cash row was added.

`IDEMPOTENCY_CONFLICT = PASS_409`.

## 35. AR Persisted Asset

AR `/ar/inventory/AST-PUR-1787315623826-1-1-z3ig` loaded successfully with no error/warn logs. It showed:

- Loose Diamond / Diamond.
- `1.25 CT`, Natural Diamond, F/G, VS1, Round, Australia.
- Supplier, Branch-1, and the canonical Location.
- Barcode `DDLOS00000001`.
- Purchase snapshot `5000 / 700 / 5000` and separate current valuation `6200 / 868 / 7068`.
- AVAILABLE status, PURCHASE_ORDER origin, PURCHASE_RECEIVE movement, PO link, and audit event.

System traceability labels such as source type and operational status are shown in the audit/history area; no form-level technical Receive instructions were exposed.

`AR_ASSET_DETAILS = PASS`.

## 36. EN Persisted Asset

EN `/en/inventory/AST-PUR-1787315623826-1-1-z3ig` showed the same business values and identity with no error/warn logs. Arabic/English business parity passed.

`EN_ASSET_DETAILS = PASS`.
`AR_EN_BUSINESS_PARITY = PASS`.

## 37. Final DB Deltas

| Entity | Before | After | Delta |
|---|---:|---:|---:|
| purchase_orders | 9 | 10 | +1 |
| purchase_order_items | 9 | 10 | +1 |
| assets | 9 | 10 | +1 |
| asset_components | 6 | 7 | +1 |
| asset_diamond_component_details | 6 | 7 | +1 |
| asset_barcode_history | 9 | 10 | +1 |
| asset_rfid_assignments | 2 | 2 | 0 |
| asset_origins | 9 | 10 | +1 |
| asset_purchase_cost_revisions | 9 | 10 | +1 |
| asset_current_valuations | 9 | 10 | +1 |
| inventory_asset_movements | 9 | 10 | +1 |
| journal_entries | 12 | 13 | +1 |
| journal_lines | 33 | 36 | +3 |
| cash_transactions | 3 | 3 | 0 |
| idempotency_requests | 12 | 13 | +1 |
| audit_logs | 63 | 64 | +1 |
| LOOSE_DIAMOND assets | 0 | 1 | +1 |

Replay and conflict produced no additional business rows. `DUPLICATE_BUSINESS_ROWS = 0`.

## 38. Master Data No-Mutation

No Supplier, Location, profile master, Tax setting, Gold setting, or Barcode master was provisioned or manually edited. Existing Supplier `SUP-002` and Location `LOC-9a10f58e-4207-4512-8824-7a7b06159151` were server-resolved. The receive route's existing `Supplier.lastOrder` operational update occurred as part of canonical receive; it did not create or alter master identity/configuration.

`MASTER_DATA_MUTATION = NO` for provisioning/identity/configuration.

## 39. Existing Unrelated P0

`JE-1787090870905` remained unchanged and still shows the pre-existing imbalance `2133.21000000` debit versus `2133.22000000` credit. No historical journal correction was attempted.

`PRE_EXISTING_UNRELATED_FINANCIAL_P0 = PRESENT_JE_1787090870905`.
`PRE_EXISTING_P0_CHANGED = NO`.

## 40. Final Tests

All focused and relevant tests listed in Section 9 passed after the successful Receive. No migrations were created or executed. No Payment or RFID action was run.

## 41. P0 / P1

- New P0: `0`.
- New P1: `0`.
- The previously existing journal imbalance remains separately documented and unchanged.
- Out-of-scope legacy observation: `sellingPrice=8000` is present in the prepared request, while the current receive mapper persists `Asset.price=6600` through its legacy fallback because it consumes `salePrice`/`item.price`. This was not introduced by the vatRate fix and was not changed after the authorized Receive. It requires Owner review before claiming independent sale-price persistence closure.

## 42. Gate

All explicit vatRate, rollback, backup, one-receive, persistence, tax, valuation, accounting, barcode, idempotency, AR/EN, no-duplicate, test, and no-production criteria for this Control passed.

`GATE = PASS_LOOSE_DIAMOND_FINAL_CONTROLLED_UI_RECEIVE_CLOSURE`.
`LOOSE_DIAMOND_FINAL_USER_WORKFLOW_CLOSED = YES` for this controlled receive/vatRate scope.
`LOOSE_DIAMOND_MODULE_STATUS = CLOSED` for this Control; sale-price fallback remains a separately tracked Owner-review item.

## 43. Final Tokens

```text
CURRENT_CONTROL = DARFUS-LOOSE-DIAMOND-VATRATE-CONTRACT-FIX-FINAL-CONTROLLED-RECEIVE
LOCAL_MAIN_DB = darfus_erp
PROVEN_ROOT_CAUSE = FRONTEND_CURRENT_TAX_PROPERTY_NAME_MISMATCH_CAUSING_MISSING_CURRENT_VALUATION_VAT_RATE
ACTUAL_CURRENT_TAX_RESPONSE_PATH = preview.current.taxSnapshot
ACTUAL_EFFECTIVE_VAT_RATE_FIELD = preview.current.taxSnapshot.effectiveVatRate
MINIMUM_SAFE_FRONTEND_FIX = PASS
FILES_CHANGED = app/[locale]/(dashboard)/inventory/loose-diamond/page.tsx; tests/loose-diamond-vatrate-contract.test.cjs; this report
PREPARED_REQUEST_CURRENT_VALUATION_VAT_RATE_PRESENT = YES
PREPARED_REQUEST_CURRENT_VALUATION_VAT_RATE = 14
PREPARED_REQUEST_CURRENT_VALUATION_VAT_RATE_SOURCE = SERVER_PREVIEW
HARDCODED_VAT_RATE = NO
MISSING_SERVER_CURRENT_VAT_RATE_FAILS_CLOSED = PASS
FRONTEND_VATRATE_REGRESSION = PASS
BACKEND_LOOSE_DIAMOND_REGRESSION = PASS
TYPECHECK = PASS
CORRECTED_FRONTEND_RUNTIME_SERVED = YES
AR_PREVIEW = PASS
EN_PREVIEW = PASS
PREVIEW_PARITY = PASS
DOUBLE_VAT = NO
EXACT_CORRECTED_BROWSER_REQUEST_CAPTURED = YES
EXACT_CORRECTED_BROWSER_CURRENT_VATRATE_PRESENT = YES
EXACT_CORRECTED_BROWSER_CURRENT_VATRATE = 14
EXACT_CORRECTED_BROWSER_PAYLOAD_ROLLBACK_RESULT = REACHED_COMMIT_BARRIER
VATRATE_REPLACEMENT_ERROR = NO
TRANSACTION_ROLLBACK = PASS
PERSISTENT_BUSINESS_DELTA_BEFORE_REAL_RECEIVE = 0
PRE_RECEIVE_BACKUP = PASS
PRE_RECEIVE_BACKUP_PATH = backend/backups/darfus_erp_PRE_FINAL_LOOSE_DIAMOND_RECEIVE_20260821_123143Z.dump
PRE_RECEIVE_BACKUP_SHA256 = 1AC5042B386EB88AF392D3C8BB13967E754E96E2E4DA487B9EE0625E2B5D7F17
BACKUP_PRECEDES_RECEIVE_POST = YES
NEW_REAL_RECEIVE_REQUEST = YES
NEW_REAL_RECEIVE_IDEMPOTENCY_KEY = YES
EXACT_REQUEST_CAPTURED_BEFORE_POST = YES
ORIGINAL_UI_RECEIVE_HTTP = 201
ORIGINAL_UI_RECEIVE = PASS_201
SUCCESSFUL_NEW_LOOSE_DIAMOND_RECEIVES = 1
PO = PO-1787315623819
PO_ITEM = POI-1787315623854-1-1
ASSET = AST-PUR-1787315623826-1-1-z3ig
BARCODE = DDLOS00000001
JOURNAL = JE-1787315623898
ONE_STONE_ONE_ASSET = PASS
MOUNTED_COMPONENTS = 0
BARCODE_DD_LOS_00 = PASS
RFID_DELTA = 0
MULTI_COLOR_PERSISTENCE = PASS
COLOR_F_COUNT = 1
COLOR_G_COUNT = 1
PURCHASE_COST_PRETAX = 5000.00
CURRENT_VALUATION = PASS
CURRENT_VALUATION_VAT_RATE_PERSISTED = PASS
CURRENT_VALUATION_VAT_RATE = 14.000000
HISTORICAL_CURRENT_SEPARATION = PASS
TAX_PARITY = PASS
SUPPLIER_PAYABLE = PASS
PAYMENT_EXECUTED = NO
CASH_DELTA = 0
NEW_JOURNAL_BALANCE = PASS
IDEMPOTENCY_EXACT_REPLAY = PASS_NO_DUPLICATES
IDEMPOTENCY_CONFLICT = PASS_409
DUPLICATE_BUSINESS_ROWS = 0
AR_ASSET_DETAILS = PASS
EN_ASSET_DETAILS = PASS
MASTER_DATA_MUTATION = NO_UNINTENDED_PROVISIONING_OR_IDENTITY_CHANGE
PRE_EXISTING_UNRELATED_FINANCIAL_P0 = PRESENT_JE_1787090870905
PRE_EXISTING_P0_CHANGED = NO
FINAL_FOCUSED_TESTS = PASS
FINAL_RELEVANT_REGRESSION = PASS
FINAL_TYPECHECK = PASS
ONLINE_PRODUCTION_CONTACTED = NO
P0_NEW = 0
P1_NEW = 0
GATE = PASS_LOOSE_DIAMOND_FINAL_CONTROLLED_UI_RECEIVE_CLOSURE
LOOSE_DIAMOND_FINAL_USER_WORKFLOW_CLOSED = YES_FOR_THIS_CONTROL
LOOSE_DIAMOND_MODULE_STATUS = CLOSED_FOR_THIS_CONTROL
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_OF_THIS_REPORT_AND_SEPARATE_SALE_PRICE_MAPPING_DECISION
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

تم التوقف بعد إنشاء التقرير. لا Receive إضافي، لا Payment، لا RFID، لا Cleanup، لا تعديل يدوي للـDB، ولا بدء Gem Stone.

`NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`.
