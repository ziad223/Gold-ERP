# DARFUS ERP — Diamond Jewellery Second Final UI Receive Acceptance Report

Control ID: `DARFUS-DIAMOND-JEWELLERY-SECOND-FINAL-UI-RECEIVE-ACCEPTANCE`

## 1. Executive Summary

تم اجتياز فحوصات الصحة والمعاينة وفتح التأكيد، وتم التقاط Exact Request وIdempotency Key قبل الإرسال. لكن تبويب المتصفح أصبح غير متاح عند لحظة الضغط، لذلك لم يُنفّذ Confirm ولم يُرسل Receive. لم تتم إعادة بناء الطلب ولم تُنفّذ أي محاولة بديلة.

## 2. Owner Authorization

Owner confirmation for one Receive was received at action time. No business mutation occurred because the controlled tab was unavailable before the click.

## 3. Previous Corrective Gate

The previous corrective gate was PASS for tax parity, current valuation mapping, and exact replay preparation.

## 4. Preserved First Failed-Acceptance Data

PO `PO-1787292943231`, Asset `AST-PUR-1787292943243-1-1-9juc`, Barcode `DDBRH21000001`, and Journal `JE-1787292943315` were not modified.

## 5. Docker Runtime / Health

Normal Docker backend was running. Postgres and Redis were healthy. `/api/v1/health`, `/api/v1/health/db`, `/api/v1/health/redis`, and `/api/v1/health/gold` returned 200. Gold was `GOLDAPI_IO`, `LIVE_PROVIDER`, `AED`, `PER_GRAM`, fresh, not stale, and not mock fallback.

## 6. Tax Policy

Read-only configuration observed: `STANDARD_VAT`, `14%`, `applyVat=true`, `taxIncluded=false`. No settings were changed.

## 7. Baseline DB Counts

`current_database() = darfus_erp`.

| Entity | Count at baseline / final check | Delta |
|---|---:|---:|
| purchase_orders | 8 | 0 |
| purchase_order_items | 8 | 0 |
| assets | 8 | 0 |
| asset_components | 4 | 0 |
| asset_diamond_component_details | 4 | 0 |
| asset_barcode_history | 8 | 0 |
| asset_rfid_assignments | 2 | 0 |
| asset_origins | 8 | 0 |
| asset_purchase_cost_revisions | 8 | 0 |
| asset_current_valuations | 8 | 0 |
| inventory_asset_movements | 8 | 0 |
| journal_entries | 11 | 0 |
| journal_lines | 30 | 0 |
| cash_transactions | 3 | 0 |
| audit_logs | 62 | 0 |
| idempotency_requests | 11 | 0 |

## 8. Controlled Synthetic Input

`Diamond Brooch`, `BRH`, 21K Yellow Gold, gross 10g, total diamond 1.5CT, two components, existing Supplier/Location, no RFID, no images, no certificates.

## 9. AR User Journey

Passed through `Inventory → إضافة / استلام مخزون → Diamond Jewellery`. Profile and shared previews became ready. The confirmation displayed supplier, location, date, item, BRH, 21K, 10g, 1.5CT, two components, tax, purchase total, current total, and sale price.

## 10. Profile Preview

Profile Preview: READY. Historical base `3037.00`; VAT `425.18`; total `3462.18`. Current Gold Center rate observed in the prepared request: `471.59200422`; current valuation total `6829.56038266`.

## 11. Shared Preview

Shared Receive Preview: READY. Tax base and tax-inclusive total matched the profile preview.

## 12. Prepared Exact Request

The read-only prepared payload showed `inventoryV2=true`, profile `DIAMOND_JEWELLERY`, `items[0].unitCost=3037.00000000`, and `perPiece[0].purchaseCost=perPiece[0].unitCost=3037.00000000`. `taxIncluded=false`, `applyVat=true`, and current valuation used the live rate and current values.

## 13. Confirmation

Confirmation was opened successfully. `EXACT_REQUEST_CAPTURED_BEFORE_POST = YES`.

## 14. Original Second UI Receive

Not executed. The controlled browser tab became unavailable before the Confirm click. No fallback API call was used.

## 15. Immediate Preview→PO Tax Parity

Not applicable because no PO was created. Preview parity was proven before confirmation only.

## 16. Success UX

Not reached.

## 17. PO / PO Item

No new PO or PO item.

## 18. Asset

No new Asset.

## 19. Description→ItemCode→Barcode

Prepared mapping was `Diamond Brooch → BRH → DD` server-generated. No new barcode was allocated.

## 20. RFID

No RFID assigned.

## 21. Components

Prepared payload contained two components: Natural Diamond 1.0CT / Fancy Blue / VS1 / Round / Australia / Center Stone / Four Prong / cost 1000, and Lab Grown Diamond 0.5CT / F / SI1 / Princess / null cost. Nothing was persisted.

## 22. Origin

No new origin row.

## 23. Purchase Cost Revision

Not persisted. Prepared economic purchase cost was pre-tax `3037.00` under the proven canonical semantics.

## 24. Current Valuation

Not persisted. Prepared current valuation was based on live Gold Center/current making/current diamond values.

## 25. Movement

No new inventory movement.

## 26. Tax Snapshot

Not persisted. Prepared tax context was `STANDARD_VAT`, 14%, non-inclusive, applied once.

## 27. Supplier Payable

No payable or payment was created.

## 28. Journal

No journal was created.

## 29. Financial Reconciliation

Not applicable without a persisted Receive. No existing journal was changed.

## 30. Exact Idempotency Replay

Not executed. The exact key observed before the unavailable-tab event was `1bb4f2cd-fb3c-4e57-968b-c4755a477d79`, but no replay was attempted.

## 31. Same-Key Conflict

Not executed.

## 32. Final DB Deltas

All observed business deltas were zero. `SUCCESSFUL_NEW_BUSINESS_RECEIVES = 0`.

## 33. Master Data No-Mutation

No supplier, location, company, branch, tax, gold, barcode configuration, or other master-data mutation occurred.

## 34. AR Asset Details

Not applicable; no new Asset.

## 35. EN Asset Details

Not applicable; no new Asset.

## 36. Network / Console

Health and preview requests succeeded. Backend logs showed no `POST /api/v1/purchase-orders/receive` during the attempted action. No final Receive, replay, or 409 conflict request was sent.

## 37. Tests / Typecheck

No post-acceptance test rerun was started because the authorized Receive did not occur. Previous corrective tests and typecheck remained PASS; this control is blocked before acceptance completion.

## 38. Deferred Optional Attachments

Images and certificate attachments were omitted as authorized.

## 39. Files Changed If Corrective Fix Was Needed

No product source, migration, configuration, or database file was changed. This report is the only current-control artifact.

## 40. Gate

`GATE = BLOCKED_EXACT_REQUEST_SESSION_UNAVAILABLE`

The acceptance cannot be marked PASS. The exact request was not reconstructed, no Receive was retried, and no third Receive was created.

## 41. Final Tokens

```text
CURRENT_CONTROL = DARFUS-DIAMOND-JEWELLERY-SECOND-FINAL-UI-RECEIVE-ACCEPTANCE
OWNER_RUNTIME_AUTHORIZATION = APPROVED_SECOND_FINAL_RECEIVE
LOCAL_MAIN_DB = darfus_erp
NORMAL_DOCKER_BACKEND = PASS
BACKEND_HEALTH = PASS
DB_HEALTH = PASS
REDIS_HEALTH = PASS
GOLD_HEALTH = PASS_HEALTHY_FRESH
CURRENT_CONFIGURED_VAT_RATE = 14%
SECOND_CONTROLLED_ITEM_DESCRIPTION = Diamond Brooch
SECOND_CONTROLLED_ITEM_CODE = BRH
SECOND_CONTROLLED_PO = NOT_CREATED
SECOND_CONTROLLED_PO_ITEM = NOT_CREATED
SECOND_CONTROLLED_ASSET = NOT_CREATED
SECOND_CONTROLLED_BARCODE = NOT_CREATED
SECOND_CONTROLLED_JOURNAL = NOT_CREATED
SECOND_CONTROLLED_IDEMPOTENCY_KEY = 1bb4f2cd-fb3c-4e57-968b-c4755a477d79
SUCCESSFUL_NEW_BUSINESS_RECEIVES = 0
PROFILE_PREVIEW_BASE = 3037.00
PROFILE_PREVIEW_VAT = 425.18
PROFILE_PREVIEW_TOTAL = 3462.18
PREPARED_RECEIVE_UNIT_COST = 3037.00000000
PO_TAX_BASE = NOT_APPLICABLE
PO_VAT = NOT_APPLICABLE
PO_TOTAL = NOT_APPLICABLE
PREVIEW_RECEIVE_TAX_PARITY = PROVEN_PRE_RECEIVE
DOUBLE_VAT = NO_PREPARED_PATH
PURCHASE_COST_REVISION_COST = NOT_PERSISTED
PURCHASE_COST_REVISION_MAPPING = PREPARED_PASS
CURRENT_GOLD_RATE = 471.59200422
PROFILE_CURRENT_VALUATION_TOTAL = 6829.56038266
PERSISTED_CURRENT_VALUATION_TOTAL = NOT_CREATED
CURRENT_VALUATION_MAPPING = PREPARED_PASS
HISTORICAL_CURRENT_SEPARATION = PASS_PREPARED
TAX_SNAPSHOT_PARITY = NOT_PERSISTED
SUPPLIER_PAYABLE = NOT_CREATED
JOURNAL_BALANCE = NOT_APPLICABLE
DESCRIPTION_TO_ITEM_CODE = PASS_PREPARED
BARCODE_DD_BRH_21 = NOT_ALLOCATED
ASSET_COUNT_DELTA = 0
COMPONENT_COUNT_DELTA = 0
DIAMOND_DETAIL_COUNT_DELTA = 0
BARCODE_COUNT_DELTA = 0
RFID_COUNT_DELTA = 0
ORIGIN_COUNT_DELTA = 0
PURCHASE_REVISION_COUNT_DELTA = 0
CURRENT_VALUATION_COUNT_DELTA = 0
MOVEMENT_COUNT_DELTA = 0
JOURNAL_COUNT_DELTA = 0
JOURNAL_LINES_DELTA = 0
CASH_TRANSACTION_COUNT_DELTA = 0
IDEMPOTENCY_EXACT_REPLAY = NOT_RUN
IDEMPOTENCY_REPLAY_SAME_PO = NOT_APPLICABLE
IDEMPOTENCY_REPLAY_SAME_ASSET = NOT_APPLICABLE
IDEMPOTENCY_CONFLICT = NOT_RUN
DUPLICATE_BUSINESS_ROWS = 0
MASTER_DATA_MUTATION = NO
PAYMENT_EXECUTED = NO
RFID_ASSIGNED = NO
LOOSE_DIAMOND_CREATED = NO
AR_BROWSER = BLOCKED_BEFORE_CONFIRM
EN_BROWSER = NOT_RUN
NETWORK_RECEIVE = NOT_SENT
NETWORK_EXACT_REPLAY = NOT_RUN
NETWORK_CONFLICT = NOT_RUN
FOCUSED_TESTS = NOT_RERUN
REGRESSION_TESTS = NOT_RERUN
TYPECHECK = PREVIOUS_PASS_NOT_RERUN
ITEM_IMAGES = OPTIONAL_DEFERRED
CERTIFICATE_ATTACHMENTS = OPTIONAL_DEFERRED
MIGRATION_CREATED = NO
MIGRATION_EXECUTED = NO
ONLINE_PRODUCTION_CONTACTED = NO
FIRST_FAILED_ACCEPTANCE_DATA_PRESERVED = YES
SECOND_ACCEPTANCE_DATA_PRESERVED = NOT_CREATED
P0_COUNT = 0
P1_COUNT = 1
GATE = BLOCKED_EXACT_REQUEST_SESSION_UNAVAILABLE
DIAMOND_JEWELLERY_FINAL_USER_WORKFLOW_CLOSED = NO
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_AND_EXPLICIT_CONTROLLED_RESUMPTION_WITH_EXACT_REQUEST_SESSION_AVAILABLE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## STOP

No Receive, replay, conflict request, cleanup, or third Diamond Jewellery Receive was started after the browser session became unavailable.

`NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`

---

# RERUN CLOSURE ADDENDUM — NEW BROWSER SESSION

The earlier blocked attempt was superseded by the explicitly authorized new-browser resumption. The following results are the authoritative final results for this control. The old blocked section remains as historical evidence of the first unavailable-tab attempt.

## Final Acceptance Evidence

- Browser path: `Inventory → إضافة / استلام مخزون → Diamond Jewellery`.
- Profile Preview = READY; Shared Preview = READY.
- Historical base = `3037.00`; VAT = `425.18`; total = `3462.18`.
- New exact request used a new key and retained `unitCost` / `purchaseCost` = `3037.00000000`, `taxIncluded=false`, `applyVat=true`.
- One UI Confirm click returned HTTP `201`.
- Exact replay with the same captured request/key returned HTTP `201` and created no duplicate business rows.
- Same-key changed `notes` payload returned HTTP `409 STATE_CONFLICT` and created no rows.

## Final Created Records

| Entity | Value |
|---|---|
| PO | `PO-1787297267352` |
| PO Item | `POI-1787297267420-1-1` |
| Asset | `AST-PUR-1787297267358-1-1-p41w` |
| Barcode | `DDBRH21000002` |
| Journal | `JE-1787297267456` |
| Idempotency key | `2e9f33b8-bd11-4cef-94b6-10dc6d683f6f` |
| Idempotency request hash | `7ee3ea0faf9c76bb659b881323c3e8718e4443cb1079d5fd9ceac859f6a6a962` |

The new barcode is distinct from the preserved historical `DDBRH21000001`, has one active history row, revision 1, and action `INITIAL`. No RFID was assigned.

## Final Financial Proof

- PO tax base = `3037.00000000`.
- PO VAT = `425.18000000`.
- PO total = `3462.18000000`.
- Purchase-cost revision total = `3037.00000000`, VAT amount `0`, VAT base `3037.00000000`; this is the pre-tax canonical Asset acquisition cost.
- Current valuation total = `6829.56038266`, with live Gold Center rate `471.59200422`, current gold value `4574.44244093`, current making `116.40000000`, current diamond value `1300.00000000`, and current VAT `838.71794173`.
- Journal lines: Inventory debit `3037.00`, Input VAT debit `425.18`, Supplier Payable credit `3462.18`; total debit = total credit = `3462.18`.
- Payment was not executed; PO state is unpaid, paid `0`, remaining `3462.18`; cash transaction delta `0`.

## Components / Origin / Movement

Exactly two `asset_components` and two `asset_diamond_component_details` rows were created. Component 1 persisted 1.0 CT / 0.2g Natural / Fancy Blue / VS1 / Round / Excellent / Australia / Center Stone / Four Prong / cost 1000. Component 2 persisted 0.5 CT / 0.1g Lab Grown / F / SI1 / Princess / null cost. One `PURCHASE_ORDER` origin and one `PURCHASE_RECEIVE` movement were linked to the new PO, PO Item, branch, location, and Asset.

## AR / EN Asset Details

Arabic and English read-only Asset detail pages both passed. They showed Diamond Brooch, `DIAMOND_JEWELLERY`, BRH, barcode `DDBRH21000002`, 21K, gross 10g, net 9.7g, pure gold 8.4875g, 2 descriptive components, supplier/location, PURCHASE_ORDER source, AVAILABLE status, purchase cost/history, current valuation, immutable event, and PURCHASE_RECEIVE movement. No console errors were observed.

## Final DB Deltas

Relative to the pre-confirmation baseline:

| Table / evidence | Delta |
|---|---:|
| purchase_orders | +1 |
| purchase_order_items | +1 |
| assets / DIAMOND_JEWELLERY assets | +1 / +1 |
| LOOSE_DIAMOND assets | 0 |
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
| idempotency_requests | +1 logical claim; replay/conflict reused the existing claim |
| audit_logs | +1 |

Master data, tax settings, gold settings, supplier, and location counts were unchanged. The replay and conflict checks produced no duplicate PO, Asset, Barcode, Movement, Journal, or Payable rows.

## Tests / Network

- Original Receive: `201`.
- Exact replay: `201`, same logical PO/Asset/Barcode, no duplicate rows.
- Same-key changed payload: `409 STATE_CONFLICT`.
- Required focused/regression group: `51 passed, 0 failed`.
- `npm run typecheck`: PASS.
- Backend health, DB health, Redis health, and fresh Gold health: PASS.
- No migration was created or executed. Online production was not contacted.

## Superseding Final Tokens

```text
CURRENT_CONTROL = DARFUS-DIAMOND-JEWELLERY-SECOND-FINAL-UI-RECEIVE-ACCEPTANCE
OWNER_RUNTIME_AUTHORIZATION = APPROVED_SECOND_FINAL_RECEIVE
LOCAL_MAIN_DB = darfus_erp
NORMAL_DOCKER_BACKEND = PASS
BACKEND_HEALTH = PASS
DB_HEALTH = PASS
REDIS_HEALTH = PASS
GOLD_HEALTH = PASS_HEALTHY_FRESH
CURRENT_CONFIGURED_VAT_RATE = 14%
SECOND_CONTROLLED_ITEM_DESCRIPTION = Diamond Brooch
SECOND_CONTROLLED_ITEM_CODE = BRH
SECOND_CONTROLLED_PO = PO-1787297267352
SECOND_CONTROLLED_PO_ITEM = POI-1787297267420-1-1
SECOND_CONTROLLED_ASSET = AST-PUR-1787297267358-1-1-p41w
SECOND_CONTROLLED_BARCODE = DDBRH21000002
SECOND_CONTROLLED_JOURNAL = JE-1787297267456
SECOND_CONTROLLED_IDEMPOTENCY_KEY = 2e9f33b8-bd11-4cef-94b6-10dc6d683f6f
SUCCESSFUL_NEW_BUSINESS_RECEIVES = 1
PROFILE_PREVIEW_BASE = 3037.00
PROFILE_PREVIEW_VAT = 425.18
PROFILE_PREVIEW_TOTAL = 3462.18
PREPARED_RECEIVE_UNIT_COST = 3037.00000000
PO_TAX_BASE = 3037.00000000
PO_VAT = 425.18000000
PO_TOTAL = 3462.18000000
PREVIEW_RECEIVE_TAX_PARITY = PASS
DOUBLE_VAT = NO
PURCHASE_COST_REVISION_COST = 3037.00000000
PURCHASE_COST_REVISION_MAPPING = PASS
CURRENT_GOLD_RATE = 471.59200422
PROFILE_CURRENT_VALUATION_TOTAL = 6829.56038266
PERSISTED_CURRENT_VALUATION_TOTAL = 6829.56038266
CURRENT_VALUATION_MAPPING = PASS
HISTORICAL_CURRENT_SEPARATION = PASS
TAX_SNAPSHOT_PARITY = PASS
SUPPLIER_PAYABLE = PASS
JOURNAL_BALANCE = PASS
DESCRIPTION_TO_ITEM_CODE = PASS
BARCODE_DD_BRH_21 = PASS
ASSET_COUNT_DELTA = 1
COMPONENT_COUNT_DELTA = 2
DIAMOND_DETAIL_COUNT_DELTA = 2
BARCODE_COUNT_DELTA = 1
RFID_COUNT_DELTA = 0
ORIGIN_COUNT_DELTA = 1
PURCHASE_REVISION_COUNT_DELTA = 1
CURRENT_VALUATION_COUNT_DELTA = 1
MOVEMENT_COUNT_DELTA = 1
JOURNAL_COUNT_DELTA = 1
JOURNAL_LINES_DELTA = 3
CASH_TRANSACTION_COUNT_DELTA = 0
IDEMPOTENCY_EXACT_REPLAY = PASS_201_NO_DUPLICATES
IDEMPOTENCY_REPLAY_SAME_PO = YES
IDEMPOTENCY_REPLAY_SAME_ASSET = YES
IDEMPOTENCY_CONFLICT = PASS_409_STATE_CONFLICT
DUPLICATE_BUSINESS_ROWS = 0
MASTER_DATA_MUTATION = NO
PAYMENT_EXECUTED = NO
RFID_ASSIGNED = NO
LOOSE_DIAMOND_CREATED = NO
AR_BROWSER = PASS
EN_BROWSER = PASS
NETWORK_RECEIVE = PASS_201
NETWORK_EXACT_REPLAY = PASS_201
NETWORK_CONFLICT = PASS_409
FOCUSED_TESTS = PASS_51
REGRESSION_TESTS = PASS
TYPECHECK = PASS
ITEM_IMAGES = OPTIONAL_DEFERRED
CERTIFICATE_ATTACHMENTS = OPTIONAL_DEFERRED
MIGRATION_CREATED = NO
MIGRATION_EXECUTED = NO
ONLINE_PRODUCTION_CONTACTED = NO
FIRST_FAILED_ACCEPTANCE_DATA_PRESERVED = YES
SECOND_ACCEPTANCE_DATA_PRESERVED = YES
P0_COUNT = 0
P1_COUNT = 0
GATE = PASS_DIAMOND_JEWELLERY_FINAL_USER_WORKFLOW_CLOSURE
DIAMOND_JEWELLERY_FINAL_USER_WORKFLOW_CLOSED = YES
NEXT_RECOMMENDED_STEP = LOOSE_DIAMOND
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

`PASS_DIAMOND_JEWELLERY_FINAL_USER_WORKFLOW_CLOSURE`

No third Diamond Jewellery Receive, payment, RFID, cleanup, migration, or automatic Loose Diamond start was performed.
