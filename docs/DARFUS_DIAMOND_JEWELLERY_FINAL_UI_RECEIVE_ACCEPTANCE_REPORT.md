# DARFUS ERP — Diamond Jewellery Final UI Receive Acceptance

تم تنفيذ قبول واحد فقط من مسار Inventory canonical على `darfus_erp`. نجح إنشاء PO/Asset/Barcode/Movement/Journal، لكن Gate النهائي FAIL بسبب عدم تطابق ضريبة المعاينة مع ضريبة Receive/PO، وعدم إثبات exact idempotency replay من نفس payload الأصلي.

## 1. Executive Summary

- المسار المستخدم: `Inventory → إضافة / استلام مخزون → Diamond Jewellery`.
- Receive ناجح واحد فقط؛ لا يوجد Loose Diamond ولا Receive ثانٍ.
- الفحص قبل/بعد أثبت أن العملية تمت على `darfus_erp`، مع حفظ البيانات الاصطناعية وعدم حذفها.
- واجهة التأكيد احتاجت إصلاحًا محدودًا للـviewport، ثم فشل أول Submit بـ422 قبل persistence بسبب missing top-level `items[0].unitCost`; تم إصلاحه حدًا أدنى ثم نجح نفس الاستلام بعد إثبات عدم وجود persistence.
- الفشل المتبقي مالي: Preview عرض VAT `425.18` وإجمالي `3462.18`، بينما PO/Journal حفظا VAT `484.71` وإجمالي `3946.89`; Asset cost/valuation بقيا `3462.18` وVAT `0`.

## 2. Owner Authorization

`OWNER_RUNTIME_AUTHORIZATION = APPROVED`.
النطاق المصرح: synthetic Diamond Jewellery واحد، max one successful receive، no payment، no Loose Diamond، no second receive، no cleanup.

## 3. Docker Runtime Restoration

تمت استعادة Backend Docker الطبيعي. `docker compose ps`: backend Up، PostgreSQL healthy، Redis healthy. Logs أثبتت `sequelize db:migrate` مع `No migrations were executed, database schema was already up to date.` ثم server الطبيعي على 8000. لا Migration جديدة ولا Restart إضافي مطلوب.

## 4. Health/DB/Redis/Gold

| Check | Evidence | Result |
|---|---|---|
| Backend `/api/v1/health` | HTTP 200, status UP | PASS |
| DB health | PostgreSQL connected | PASS |
| Redis health | Redis connected | PASS |
| Gold health | GOLDAPI_IO, LIVE_PROVIDER, AED, PER_GRAM, fresh=true, stale=false, mockFallback=false | PASS |
| Database target | `current_database() = darfus_erp`, user postgres | PASS |

## 5. Current Tax Policy

`STANDARD_VAT`, effective configured VAT rate `14%`, UAE policy snapshot, VAT registered true, enabled treatments include STANDARD_VAT and REVERSE_CHARGE. No settings/master-data mutation occurred.

## 6. Baseline Counts

Read-only baseline immediately before final Confirm:

| Entity | Count |
|---|---:|
| purchase_orders | 7 |
| purchase_order_items | 7 |
| assets | 7 |
| asset_components | 2 |
| asset_diamond_component_details | 2 |
| asset_barcode_history | 7 |
| asset_rfid_assignments | 2 |
| asset_origins | 7 |
| asset_purchase_cost_revisions | 7 |
| asset_current_valuations | 7 |
| inventory_asset_movements | 7 |
| journal_entries | 10 |
| journal_lines | 27 |
| cash_transactions | 3 |
| audit_logs | 61 |
| idempotency_requests | 10 |

## 7. Synthetic UI Input

`DIAMOND_JEWELLERY`, `Diamond Brooch → BRH`, 21K Yellow Gold, gross 10g, total diamond 1.5CT, historical gold rate 200, making 10/g, current making 12/g, current diamond value 1300, sale price 100000, STANDARD_VAT, no RFID, no certificates, no attachments.

Components: Natural Diamond 1.0CT Fancy Blue VS1 Round Excellent Australia Center Stone Four Prong with cost 1000; Lab Grown Diamond 0.5CT F SI1 Princess with no component cost.

## 8. AR Journey

Browser loaded `/ar/inventory`, opened `إضافة / استلام مخزون`, selected `متاح الآن ألماس`, and loaded `/ar/inventory/diamond-jewellery` while authenticated as Company Gold ERP / Branch-1. No Supplier legacy receive screen was used.

## 9. Profile Preview

HTTP 200 `POST /api/v1/inventory-v2/diamond-jewellery/preview`. UI showed READY and the expected profile math: gold value 1940, making 97, diamond cost 1000, net gold 9.7g, pure gold 8.4875g.

## 10. Shared Preview

HTTP 200 `POST /api/v1/inventory-v2/receive-preview`. UI showed READY, STANDARD_VAT, taxable base 3037, VAT 425.18, historical total 3462.18, and current cost 6811.286365 at the final live quote.

## 11. Confirmation

Confirmation displayed supplier, DB location, purchase date, description, BRH, 21K, 10g, 1.5CT, 2 stones, tax treatment, historical total, current total, and selling price. It explicitly stated that no Receive request was sent before Confirm.

The confirmation card had an initial viewport defect (`overflow-y: visible`, content taller than viewport); it was corrected with `max-h-[calc(100vh-2rem)] overflow-y-auto` only.

## 12. Original UI Receive

Final Confirm was activated once after the scoped UI fixes. HTTP response was 201 from `POST /api/v1/purchase-orders/receive`; no second successful business receive was made.

## 13. Success UX

UI displayed `تم الاستلام عبر Supplier V2` and link to the accepted Asset `AST-PUR-1787292943243-1-1-9juc`.

## 14. PO/PO Item

- PO: `PO-1787292943231`, status received, supplier `SUP-001`, branch Branch-1, unpaid note.
- PO item: `POI-1787292943282-1-1`, quantity 1, `product_id = NULL`, asset linked, final purchase cost 3462.1800.
- PO total: 3946.89000000; tax base 3462.18000000; input VAT 484.71000000.

## 15. Asset

`AST-PUR-1787292943243-1-1-9juc`, profile `DIAMOND_JEWELLERY`, status AVAILABLE, condition NEW, branch `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c`, location `LOC-9a10f58e-4207-4512-8824-7a7b06159151`, supplier `SUP-001`, purchase date 2026-08-21.

## 16. Description→ItemCode→Barcode

`Diamond Brooch → BRH → DDBRH21000001`. Barcode is server-generated and unique; barcode history revision 1 is ACTIVE/INITIAL.

## 17. RFID

No RFID was supplied. New-asset RFID assignment delta is 0; `rfid = NULL`; no RFID mutation occurred.

## 18. Components

Asset components delta +2 and diamond detail delta +2. Stored details include Natural/Fancy Blue/VS1/Round/Excellent/Australia/Center Stone/Four Prong and Lab Grown/F/SI1/Princess. Physical authority remains one Asset; component count is descriptive.

## 19. Origin

One `asset_origins` row: `PURCHASE_ORDER`, PO item `POI-1787292943282-1-1`, branch-scoped, mapping `V2_RUNTIME_RECEIPT`.

## 20. Purchase Cost Revision

One revision, revision 1, AED, gold value 1940, making total 97, component cost 1000, total purchase cost 3462.18, supplier and PO item linked. The revision recorded VAT 0, which contributes to the reconciliation gap in section 26.

## 21. Current Valuation

One current valuation row, total 3462.18, gold value 1940, making 97, component value 1000, VAT 0. It did not overwrite the historical snapshot.

## 22. Movement

One `PURCHASE_RECEIVE` movement, source PO `PO-1787292943231`, to Branch-1 and the selected DB Location, asset linked, operator linked.

## 23. Tax Snapshot

PO tax snapshot exists and is immutable-looking/readable: STANDARD_VAT, UAE, effective rate 14, taxable base 3462.18, VAT 484.71, total PO 3946.89. Snapshot presence PASS; parity with Profile/Shared Preview FAIL.

## 24. Supplier Payable

No payment/cash transaction was created. The supplier payable is represented by the AP journal credit of 3946.89 and PO unpaid state/note. Payment execution = NO.

## 25. Journal

`JE-1787292943315`, posted, source PO, Branch-1. Lines: inventory debit 3462.18; input VAT debit 484.71; supplier payable credit 3946.89. Total debit = total credit = 3946.89. Journal balance PASS.

## 26. Reconciliation

FAIL — confirmed financial mismatch:

| Layer | Tax base | VAT | Total |
|---|---:|---:|---:|
| Profile/Shared Preview | 3037.00 | 425.18 | 3462.18 |
| PO/Tax Snapshot/Journal | 3462.18 | 484.71 | 3946.89 |
| Asset cost/current valuation | 3037.00 effective components | 0 | 3462.18 |

Root cause: the UI sends the preview total as the V2 piece/item purchase cost, while the canonical Receive totals apply STANDARD_VAT again to that total. The PO/Journal authority therefore differs from the preview and from Asset cost/valuation. No business-rule change or corrective re-receive was attempted.

## 27. Idempotency Exact Replay

FAIL / NOT PROVEN. The successful record is `idempotency_requests.id=37`, scope `purchase.receive`, key `0fdc5e7a-ae28-4c98-9e44-b7a47fe333ce`, status succeeded, code 201. A reconstructed same-key payload was intentionally not claimed as exact; it received 409 STATE_CONFLICT because its request hash differed. The original UI request body was not exposed by the browser surface after the UI cleared its in-memory key reference. No duplicate rows were created.

## 28. Idempotency Conflict

PASS for fail-closed conflict behavior: same key with a non-identical reconstructed payload returned HTTP 409 `STATE_CONFLICT`; no PO/Asset/Movement/Journal delta occurred.

## 29. Final DB Deltas

| Entity | Delta |
|---|---:|
| purchase_orders | +1 |
| purchase_order_items | +1 |
| assets | +1 |
| asset_components | +2 |
| asset_diamond_component_details | +2 |
| asset_barcode_history | +1 |
| asset_rfid_assignments | 0 |
| asset_origins | +1 |
| asset_purchase_cost_revisions | +1 |
| asset_current_valuations | +1 |
| inventory_asset_movements | +1 |
| journal_entries | +1 |
| journal_lines | +3 |
| cash_transactions | 0 |
| audit_logs | +1 |
| idempotency_requests | +1 |

No Product physical-stock row was linked or created; duplicate barcode count is 0.

## 30. Master Data No-Mutation

Suppliers remained 2, Locations remained 2, and profile master data remained 659. The selected Supplier/Location were existing DB records. No provisioning, seed, settings, VAT, barcode sequence, or master-data write was performed.

## 31. AR Asset Details

PASS. `/ar/inventory/AST-PUR-1787292943243-1-1-9juc` displayed Asset ID, barcode, AVAILABLE, Branch-1, location, 10g, 0.3g stone weight, 9.7g net gold, 21K, 8.4875g pure gold, two descriptive components, origin, cost, valuation, immutable event and movement history.

## 32. EN Asset Details

PASS. `/en/inventory/AST-PUR-1787292943243-1-1-9juc` displayed the same persisted identity and history in English, including `DDBRH21000001`, `AVAILABLE`, component descriptions, PO source, and movement.

## 33. Network/Console

- Contract GET: HTTP 200.
- Profile preview: HTTP 200.
- Shared receive preview: HTTP 200.
- Original canonical Receive: HTTP 201.
- Earlier pre-fix receive: HTTP 422 before persistence, message `سعر التكلفة للبند رقم 1 غير صحيح`; zero business-row delta proven before retry.
- Browser surface exposed no console error stream; no claim is made beyond visible UI/network evidence.
- Existing unrelated runtime noise included an upload 404 and token-refresh 401/200 sequence; neither affected the accepted Asset.

## 34. Tests/Typecheck

Focused suite: PASS, 52 tests passed, 0 failed. Included Diamond authority/core/negative tests, unified intake tests, Asset/Barcode closure tests, and Supplier master closure tests. `npm run typecheck`: PASS. No build was run.

## 35. Optional Attachments Deferred

`ITEM_IMAGES = OPTIONAL_DEFERRED`; `CERTIFICATE_ATTACHMENTS = OPTIONAL_DEFERRED`. No attachment architecture or certificate upload work was started.

## 36. Any Corrective Files Changed

Only the Diamond Jewellery page was intentionally touched during this control:

- `app/[locale]/(dashboard)/inventory/diamond-jewellery/page.tsx` — scoped confirmation-card scrolling fix; top-level V2 `unitCost` contract fix.

The worktree already contained extensive unrelated tracked/untracked drift; no cleanup, reset, restore, stash, add, commit, or push was performed. The required report file is this report. No backend, migration, config, DB, or accounting source was changed.

## 37. Gate

`GATE = FAIL_DIAMOND_JEWELLERY_FINAL_USER_WORKFLOW_CLOSURE`

Reason: critical Preview→Submit tax/total reconciliation failed, and exact idempotency replay was not proven from the original UI payload. This is not partial persistence: the accepted Receive is complete and preserved. No second Diamond receive is authorized or performed.

## 38. Final Tokens

```text
CURRENT_CONTROL = DARFUS-DIAMOND-JEWELLERY-FINAL-UI-RECEIVE-ACCEPTANCE
OWNER_RUNTIME_AUTHORIZATION = APPROVED
NORMAL_DOCKER_BACKEND_RESTORED = YES
BACKEND_HEALTH = PASS
DB_HEALTH = PASS
REDIS_HEALTH = PASS
GOLD_HEALTH = PASS
LOCAL_MAIN_DB = darfus_erp
CURRENT_VAT_RATE = 14%
CONTROLLED_PROFILE = DIAMOND_JEWELLERY
CONTROLLED_ITEM_DESCRIPTION = Diamond Brooch
CONTROLLED_ITEM_CODE = BRH
CONTROLLED_PO_NUMBER = PO-1787292943231
CONTROLLED_PO_ITEM_ID = POI-1787292943282-1-1
CONTROLLED_ASSET_ID = AST-PUR-1787292943243-1-1-9juc
CONTROLLED_BARCODE = DDBRH21000001
CONTROLLED_JOURNAL_ID = JE-1787292943315
CONTROLLED_IDEMPOTENCY_KEY = 0fdc5e7a-ae28-4c98-9e44-b7a47fe333ce
SUCCESSFUL_BUSINESS_RECEIVES = 1
AR_UI_RECEIVE = PASS
CONFIRMATION_UX = PASS_AFTER_SCOPED_FIX
ORIGINAL_RECEIVE_NETWORK = PASS_201
SUCCESS_UX = PASS
ASSET_DETAILS_NAVIGATION = PASS
EN_PERSISTED_DETAILS = PASS
DESCRIPTION_TO_ITEM_CODE = PASS
BARCODE_DD_BRH_21 = PASS
ASSET_COUNT_DELTA = +1
COMPONENT_COUNT_DELTA = +2
DIAMOND_DETAIL_COUNT_DELTA = +2
BARCODE_COUNT_DELTA = +1
RFID_ASSIGNMENT_COUNT_DELTA = 0
ORIGIN_COUNT_DELTA = +1
COST_REVISION_COUNT_DELTA = +1
CURRENT_VALUATION_COUNT_DELTA = +1
MOVEMENT_COUNT_DELTA = +1
JOURNAL_COUNT_DELTA = +1
JOURNAL_LINES_DELTA = +3
CASH_TRANSACTION_COUNT_DELTA = 0
LOOSE_DIAMOND_CREATED = NO
PAYMENT_EXECUTED = NO
MASTER_DATA_MUTATION = NO
TAX_SNAPSHOT = PASS_PRESENCE_FAIL_PARITY
ACCOUNTING_PAYABLE = PASS
JOURNAL_BALANCE = PASS
IDEMPOTENCY_EXACT_REPLAY = FAIL_NOT_PROVEN
IDEMPOTENCY_CONFLICT = PASS_409_STATE_CONFLICT
DUPLICATE_BUSINESS_ROWS = 0
AR_BROWSER = PASS
EN_BROWSER = PASS
BROWSER_CONSOLE = NOT_EXPOSED_NO_VISIBLE_ERROR
NETWORK_CONTRACT = PASS
NETWORK_PROFILE_PREVIEW = PASS_200
NETWORK_SHARED_PREVIEW = PASS_200
NETWORK_RECEIVE = PASS_201
NETWORK_EXACT_REPLAY = FAIL_HASH_MISMATCH_NOT_EXACT
NETWORK_CONFLICT_REPLAY = PASS_409_STATE_CONFLICT
FOCUSED_TESTS = PASS_52_TESTS
TYPECHECK = PASS
ITEM_IMAGES = OPTIONAL_DEFERRED
CERTIFICATE_ATTACHMENTS = OPTIONAL_DEFERRED
MIGRATION_CREATED = NO
MIGRATION_EXECUTED = NO
ONLINE_PRODUCTION_CONTACTED = NO
ACCEPTANCE_DATA_PRESERVED = YES
P0_COUNT = 0
P1_COUNT = 1
GATE = FAIL_DIAMOND_JEWELLERY_FINAL_USER_WORKFLOW_CLOSURE
DIAMOND_JEWELLERY_FINAL_USER_WORKFLOW_CLOSED = NO
NEXT_RECOMMENDED_STEP = CORRECTIVE_CONTROL_FOR_PREVIEW_SUBMIT_TAX_PARITY_AND_EXACT_REPLAY_PROOF
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. No second Diamond Jewellery Receive, no attachment work, no Loose Diamond, and no automatic next batch.
