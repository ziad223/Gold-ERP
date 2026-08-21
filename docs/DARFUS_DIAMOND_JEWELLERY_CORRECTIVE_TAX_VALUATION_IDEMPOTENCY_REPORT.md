# DARFUS ERP — Diamond Jewellery Corrective Tax / Valuation / Idempotency Report

Control: DARFUS-DIAMOND-JEWELLERY-CORRECTIVE-TAX-VALUATION-IDEMPOTENCY
Mode: source correction + focused tests + read-only runtime proof
Scope: DIAMOND_JEWELLERY only
Official DB: darfus_erp (read-only)
Production: not contacted

## 1. Executive Summary

تم تنفيذ تصحيح مصدر محدود لمعالجة سبب فشل القبول السابق دون تنفيذ Receive جديد ودون تعديل بيانات القبول السابقة.

- تم إثبات أن items[].unitCost في مسار Supplier V2 يجب أن يمثل أساس الاستحواذ قبل الضريبة في هذا المسار، وليس إجمالي المعاينة شامل الضريبة.
- تم تعديل Diamond mapper ليستخدم historicalPurchaseBasePreTax، مع إعادة اشتقاق القيمة نفسها خادمياً قبل أي persistence مستقبلي.
- تم فصل القيم التاريخية عن القيم الحالية صراحةً، وربط asset_current_valuations المستقبلية بقيم Gold Center/current-making/current-diamond الحالية.
- تم تجهيز buildFinalReceiveRequest() ليحفظ نفس كائن الطلب ومفتاحه وبصمة المعاينة، ويستخدم Confirm نفس الكائن دون إعادة بنائه من حالة النموذج.
- AR وEN: Profile Preview وShared Receive Preview = 200/READY، والأساس/VAT/الإجمالي متطابقة.
- تم فتح نافذة التأكيد وفحص كائن الطلب الكامل، ثم إلغاؤها في اللغتين. لم يُرسل POST /api/v1/purchase-orders/receive.
- Official DB business delta = 0. بيانات القبول السابقة بقيت كما هي عمداً.

## 2. Preserved Failed-Acceptance Evidence

العملية السابقة الناجحة الوحيدة بقيت دون تعديل:

| Evidence | Preserved value |
|---|---|
| PO | PO-1787292943231 |
| PO item | POI-1787292943282-1-1 |
| Asset | AST-PUR-1787292943243-1-1-9juc |
| Barcode | DDBRH21000001 |
| Journal | JE-1787292943315 |
| Previous PO total | 3946.89 |
| Previous PO tax base | 3462.18 |
| Previous PO VAT | 484.71 |
| Existing journal balance | debit = credit = 3946.89 |

الصفوف السابقة ظلت unchanged، بما فيها mismatch المعروف. لم تتم إعادة تسعيرها أو إصلاحها يدوياً.

## 3. Supplier V2 Contract Trace

| Layer | Proven behavior | Evidence |
|---|---|---|
| UI item | Sends one perPiece physical piece and top-level unitCost | app/[locale]/(dashboard)/inventory/diamond-jewellery/page.tsx:48 |
| V2 normalization | Requires perPiece.length = document quantity and normalizes one Asset piece | backend/src/services/inventory-v2-runtime.service.js:124-132 |
| Supplier preview | Sums piece.purchaseCost into goods total, then resolves transaction VAT | backend/src/services/supplier-acquisition-preview.service.js:17-22, 35-103 |
| Receive route | Recomputes Diamond preview server-side and now canonicalizes historical base | backend/src/routes/erp.routes.js:8150-8190 |
| PO total | Uses goods base plus the resolved transaction tax snapshot | backend/src/routes/erp.routes.js:8176-8205 |
| Asset book cost | Recoverable VAT is not added to the physical Asset cost | Existing effectiveCost branch in backend/src/routes/erp.routes.js |
| Purchase revision | Stores canonical piece.purchaseCost evidence; transaction VAT remains in PO tax/accounting authority | backend/src/services/inventory-v2-runtime.service.js:315-333 |
| Current valuation | Stores explicit piece.currentValuation values when supplied by the canonical mapper | backend/src/services/inventory-v2-runtime.service.js:399-409 |

SUPPLIER_V2_UNIT_COST_SEMANTICS = PROVEN_PRE_TAX_PURCHASE_BASE_FOR_STANDARD_VAT_DIAMOND_RECEIVE

The previous accepted request sent 3462.18 as goods cost, then the canonical Receive applied 14% to that amount. The corrected request sends 3037.00; the tax engine applies 14% once.

## 4. unitCost Semantics

| Field | Canonical meaning | Tax included? | Persistence target | Evidence |
|---|---|---:|---|---|
| items[].unitCost | Per-unit historical purchase base / goods cost | No | PO item and item totals | Receive route normalizes item cost and recomputes from V2 pieces |
| perPiece[].purchaseCost | Economic acquisition cost for the physical Asset | No for recoverable STANDARD_VAT path | Asset cost and purchase-cost revision | effectiveCost subtracts recoverable piece VAT; corrected Diamond mapper supplies pre-tax base |
| perPiece[].unitCost | Same per-piece pre-tax economic base | No | V2 normalized piece evidence | Corrected UI payload and server canonicalization |
| taxTreatment | Transaction tax policy selector | N/A | Immutable PO tax snapshot | Shared tax request and server policy |
| vatBase / vatAmount | Tax-engine evidence, not a second cost authority | N/A | PO tax snapshot/accounting | Tax engine and supplier acquisition preview |
| asset_current_valuations.totalValue | Current valuation total, including current valuation VAT per client formula | Yes | Current valuation snapshot | Client reference + explicit current mapper |

SUPPLIER_V2_UNIT_COST_SEMANTICS = PROVEN.

## 5. Diamond Historical Economic Model

The client reference requires:

    historicalGoldValuePreTax = netGoldWeight × historicalGoldRate
    historicalMakingValuePreTax = netGoldWeight × historicalMakingPerGram
    historicalDiamondCostPreTax = sum(component purchase costs)
    historicalPurchaseBasePreTax = the three values above
    purchaseVAT = VAT Engine(historicalPurchaseBasePreTax, tax treatment)
    historicalPurchaseTotalTaxInclusive = base + purchaseVAT

The service now exposes explicit aliases without changing the formula:

- historicalPurchase.purchaseBasePreTax
- historicalPurchase.historicalPurchaseBasePreTax
- historicalPurchase.purchaseTotalTaxInclusive
- historicalPurchase.historicalPurchaseTotalTaxInclusive
- currentCost.currentValuationBasePreTax
- currentCost.currentValuationTotalTaxInclusive

| Component | Value |
|---|---:|
| Gold | 1940.00 |
| Making | 97.00 |
| Diamond | 1000.00 |
| Historical base before VAT | 3037.00 |

No Gold By Weight formula was copied or changed.

## 6. Preview→Submit Root Cause

The previous failure is now proven:

1. Diamond Profile Preview correctly calculated base 3037.00, VAT 425.18, total 3462.18.
2. The former UI mapper put historicalPurchase.totalPurchaseCost (3462.18) into V2 purchaseCost and unitCost.
3. Supplier V2 treated that value as goods cost and the transaction tax path applied 14% again.
4. The persisted PO became base 3462.18, VAT 484.71, total 3946.89.

ROOT_CAUSE_DOUBLE_VAT = PROVEN_UI_SENT_TAX_INCLUSIVE_TOTAL_AS_PRE_TAX_V2_COST

## 7. Tax Parity Fix

The corrected mapping is:

    profile preview base
    = shared preview base
    = prepared final receive unitCost
    = 3037.00 for the controlled synthetic example

The request explicitly carries:

    unitCost = 3037.00000000
    purchaseCost = 3037.00000000
    taxTreatment = STANDARD_VAT
    applyVat = true
    taxIncluded = false

| Value | AR | EN |
|---|---:|---:|
| Tax base | 3037.00 | 3037.00 |
| VAT | 425.18 | 425.18 |
| Total | 3462.18 | 3462.18 |

PREVIEW_SHARED_TAX_PARITY = PASS
DOUBLE_VAT_PATH = ELIMINATED
NO_DOUBLE_VAT = PASS

The server also canonicalizes the Diamond historical base from its own profile preview before future persistence; the frontend is not the authority.

## 8. Purchase Cost Revision Semantics/Fix

The canonical recoverable STANDARD_VAT interpretation is:

- acquisition/book cost for the physical Asset = pre-tax base;
- purchase VAT belongs to the PO immutable tax snapshot and Input VAT journal line;
- asset_purchase_cost_revisions.total_purchase_cost receives the canonical economic cost supplied by the V2 piece;
- the prior row containing 3462.18 remains unchanged as historical failed-acceptance evidence.

PURCHASE_COST_REVISION_MAPPING = PASS
PURCHASE_REVISION_COST_SEMANTICS = PRE_TAX_CANONICAL_ACQUISITION_COST_FOR_RECOVERABLE_STANDARD_VAT

No historical revision was updated.

## 9. Current Valuation Semantics/Fix

The prior UI request did not provide an explicit current valuation object, so the runtime fell back to purchase values. The corrected mapper supplies:

- live Gold Center rate and source;
- current gold value;
- current making value;
- current diamond value;
- current valuation pre-tax base;
- current VAT;
- current valuation total.

The backend re-derives the same current valuation from the server-side Diamond preview and replaces client-supplied economic values before future persistence.

CURRENT_VALUATION_MAPPING = PASS
HISTORICAL_CURRENT_SEPARATION = PASS

The new current valuation was not persisted in this control because no Receive was authorized. The old valuation row remains unchanged.

## 10. Current VAT Business Meaning

The client reference defines Current Cost as current gold value + current making value + current diamond value + current VAT. It also states that current cost changes with market prices and does not change historical purchase cost.

CURRENT_VAT_BUSINESS_SEMANTICS = CURRENT_VALUATION_DISPLAY_AND_VALUATION_SNAPSHOT_AMOUNT_NOT_PURCHASE_AP_VAT

Purchase VAT and Current VAT are kept separate. Current VAT is not substituted into PO tax, supplier payable, or historical purchase cost.

## 11. Accounting Mapping

The canonical future STANDARD_VAT shape remains:

    Inventory / acquisition debit = 3037.00
    Input VAT debit               = 425.18
    Accounts Payable credit       = 3462.18
    Debit = Credit                = 3462.18

The accounting mapper was not redesigned. Existing prior journal JE-1787292943315 remains balanced at 3946.89; it was not rewritten.

ACCOUNTING_MAPPING = PASS_STATIC_CANONICAL_MAPPING_PRESERVED

New accounting persistence was intentionally not executed in this control.

## 12. Final Receive Payload Builder

buildFinalReceiveRequest() is now the single production builder in the Diamond Jewellery page.

- openConfirmation() prepares one exact object and one idempotency key.
- confirmReceive() sends JSON.stringify(exactRequest) from the retained object.
- It does not reconstruct the body from cleared or changed form state.
- A stale request fingerprint fails closed and requires reopening confirmation.

FINAL_RECEIVE_PAYLOAD_BUILDER = PASS

## 13. Preview Fingerprint

The existing profile/shared fingerprints plus the final request fingerprint cover:

- item description/code;
- karat, gross weight, diamond weights, and component details;
- historical gold rate and making values;
- current making and current diamond value;
- sale price;
- tax treatment and RCM evidence;
- supplier, location, purchase date, and branch context.

PREVIEW_FINGERPRINT = PASS

## 14. Original Request Capture

The exact final object and exact key are retained in refs:

- exactReceiveRequestRef
- exactReceiveKeyRef
- exactReceiveFingerprintRef

The read-only Confirmation also exposes the prepared object in a clearly labeled read-only inspection block. No credentials or API keys are included.

ORIGINAL_REQUEST_CAPTURE = PASS
EXACT_RECEIVE_PAYLOAD_RETENTION = PASS

## 15. Idempotency Hash Canonicalization

The real implementation is backend/src/services/idempotency.service.js:31:

    canonical = stableStringify({ scope, params, body: bodyWithoutIdempotencyKey })
    hash = SHA-256(canonical)

For the canonical receive route:

- scope = purchase.receive;
- params = {};
- body = exact receive body excluding idempotencyKey and idempotency-key;
- object keys are sorted recursively;
- array order is preserved;
- company scope is enforced by database claim key (company_id, scope, key), not added implicitly to this hash call;
- HTTP method and arbitrary headers are not independently hashed by this call.

IDEMPOTENCY_HASH_INPUT_PROVEN = YES

## 16. Exact Replay Preparation

Focused proof passes:

- original retained request and replay with the same semantic body produce the same real canonical hash;
- changing unitCost changes the hash;
- the same exact request/key is available after a future successful response;
- a future replay can therefore use the original captured object instead of reconstructing it.

No replay request was sent in this control. The old same-key reconstructed replay remains historical 409 STATE_CONFLICT evidence and was not retried.

IDEMPOTENCY_REPLAY_HASH_EQUIVALENCE_TEST = PASS
EXACT_REPLAY_RUNTIME = NOT_RUN_BY_GUARDRAIL

## 17. Focused Tests

New focused test: backend/tests/diamond-corrective-tax-valuation-idempotency.test.cjs

Result: 5 passed, 0 failed.

Covered:

- explicit historical/current fields;
- pre-tax Diamond unitCost mapping;
- one-time VAT math (3037 + 14% = 3462.18);
- server-side historical/current mapper wiring;
- real idempotency hash equivalence and changed-payload difference.

Additional tax, supplier, location, master, Asset, Barcode, accounting-posting, and idempotency-related focused tests passed after rerunning the two path-sensitive tests from backend as their own project root.

## 18. Regression Tests

The required Diamond, unified intake, Asset, Barcode, Supplier, tax, and Supplier V2 regression groups were run.

- Main relevant regression group: 53 passed, 0 failed.
- Corrective group: 5 passed, 0 failed.
- Additional source-focused group: all assertions passed when invoked from the correct backend working directory.
- npm run typecheck: PASS.
- Next build: NOT RUN, per repository guardrail protecting the current Next runtime.

No test mutation was directed at darfus_erp.

## 19. AR Read-Only Browser Proof

URL: http://localhost:3000/ar/inventory/diamond-jewellery

- authenticated page loaded;
- supplier and DB location selected from server-provided options;
- STANDARD_VAT selected;
- synthetic Diamond Brooch data entered;
- Profile Preview = READY;
- Shared Receive Preview = READY;
- historical base = 3037.00;
- VAT = 425.18;
- total = 3462.18;
- current values were live and non-historical;
- Confirmation opened;
- prepared request inspected;
- Confirmation cancelled;
- Confirm Receive was not clicked;
- browser console errors = none observed.

AR_PREVIEW = PASS

## 20. EN Read-Only Browser Proof

URL: http://localhost:3000/en/inventory/diamond-jewellery

- authenticated page loaded;
- same synthetic business values were used;
- Profile Preview = READY;
- Shared Receive Preview = READY;
- historical base = 3037.00;
- VAT = 425.18;
- total = 3462.18;
- Confirmation opened and exact prepared payload inspected;
- Confirmation cancelled;
- browser console errors = none observed.

EN_PREVIEW = PASS

## 21. Prepared Receive Payload Inspection

The exact AR and EN prepared objects were inspected before any final POST.

| Field | Prepared value / behavior | Status |
|---|---|---|
| items[0].unitCost | 3037.00000000 | PASS |
| perPiece[0].purchaseCost | 3037.00000000 | PASS |
| perPiece[0].unitCost | 3037.00000000 | PASS |
| items[0].sellingPrice | Profile sale price remains 100000 through piece sale data | PASS |
| inventoryV2 | true | PASS |
| profile | DIAMOND_JEWELLERY | PASS |
| Diamond payload | One physical piece, one perPiece, one component set | PASS |
| Historical gold rate | 200 | PASS |
| Historical purchase base | 3037.00 | PASS |
| Purchase total preview | 3462.18 | PASS |
| Current gold rate | Live Gold Center value; AR 469.93944339, EN 471.59200422 | PASS |
| Current making | 116.40000000 current value from 12/g × 9.7g | PASS |
| Current diamond value | 1300 | PASS |
| Current valuation total | Live current total; AR 6811.28636500, EN 6829.56038266 | PASS |
| Tax treatment | STANDARD_VAT, applyVat=true, taxIncluded=false | PASS |
| Supplier | Server-backed SUP-001 | PASS |
| Location | Server-backed LOC-9a10f58e-4207-4512-8824-7a7b06159151 | PASS |
| Purchase date | 2026-08-21 | PASS |
| Idempotency lifecycle | Generated on preparation, retained with exact request, not sent in this control | PASS |

## 22. Network Proof — No Final Receive

Observed authenticated calls:

- Diamond contract GET = 200;
- Diamond Profile Preview POST = 200;
- Shared Receive Preview POST = 200;
- no POST /api/v1/purchase-orders/receive after corrective source change;
- backend logs contain no final Receive call during this control.

Normal runtime health also passed:

| Endpoint | Result |
|---|---|
| /api/v1/health | 200 / UP |
| /api/v1/health/db | 200 / PostgreSQL connected |
| /api/v1/health/redis | 200 / Redis connected |
| /api/v1/health/gold | 200 / HEALTHY / GOLDAPI_IO / AED / fresh |
| Frontend Diamond URL | 200 |

There was one transient Gold scheduler network warning followed by a successful refresh; the read-only Gold health endpoint was fresh at final inspection. No Gold settings were changed.

## 23. DB No-Mutation Proof

Read-only target proof:

    SELECT current_database() = darfus_erp

Current counts remained equal to the post-acceptance baseline:

| Table | Current count | Expected delta |
|---|---:|---:|
| purchase_orders | 8 | 0 |
| purchase_order_items | 8 | 0 |
| assets | 8 | 0 |
| asset_components | 4 | 0 |
| asset_diamond_component_details | 4 | 0 |
| asset_barcode_history | 8 | 0 |
| asset_origins | 8 | 0 |
| asset_purchase_cost_revisions | 8 | 0 |
| asset_current_valuations | 8 | 0 |
| inventory_asset_movements | 8 | 0 |
| journal_entries | 11 | 0 |
| journal_lines | 30 | 0 |
| cash_transactions | 3 | 0 |
| idempotency_requests | 11 | 0 |

The preserved PO, PO item, Asset, cost revision, valuation, journal, and idempotency row values matched the previous report. No business cleanup/update/delete was issued.

The normal backend container startup invoked its configured migration check and logged No migrations were executed, database schema was already up to date. No migration file was created or applied.

FINAL_RECEIVE_REQUESTS_CREATING_BUSINESS_DATA = 0
DB_BUSINESS_WRITES = 0

## 24. Files Changed

Intentional current-control changes:

1. app/[locale]/(dashboard)/inventory/diamond-jewellery/page.tsx
   - pre-tax payload mapping;
   - current valuation payload;
   - exact final request builder/capture/retention;
   - read-only prepared payload inspection block.
2. backend/src/services/diamond-jewellery-profile.service.js
   - explicit historical/current economic aliases; formulas unchanged.
3. backend/src/routes/erp.routes.js
   - server-authoritative Diamond historical-base and current-valuation canonicalization.
4. backend/tests/diamond-corrective-tax-valuation-idempotency.test.cjs
   - focused corrective tests.
5. This report.

The worktree already had extensive tracked and untracked changes before this control. HEAD remained 1657b0e9ba580faef69be48f04637835c201b521; branch main; no reset, restore, clean, stash, add, commit, or push was performed. The page and profile service were already untracked from earlier batches; this report does not claim unrelated worktree changes.

## 25. Remaining Risks

- Existing failed-acceptance data still contains the old tax mismatch by design; a separate owner-authorized data correction is not part of this control.
- No new Receive was executed, so future persistence of corrected PO/Asset/current-valuation/accounting shape remains for the next explicitly authorized acceptance.
- Exact runtime replay was prepared and hash-tested, but not sent.
- Gold provider had a transient scheduler network warning that recovered; current health was fresh and no provider/config change was made.
- No Next build was run under repository guardrail.

## 26. Gate

DIAMOND_CORRECTIVE_TAX_PARITY = PASS
DIAMOND_CORRECTIVE_CURRENT_VALUATION = PASS
DIAMOND_EXACT_REPLAY_PREPARATION = PASS
NEW_RECEIVE_EXECUTED = NO
DIAMOND_JEWELLERY_FINAL_USER_WORKFLOW_CLOSED = NO
P0_COUNT = 0
P1_COUNT = 0
GATE = READY_FOR_SECOND_OWNER_AUTHORIZED_DIAMOND_FINAL_UI_RECEIVE_ACCEPTANCE

This gate authorizes no Receive by itself. A new explicit Owner authorization is required for the next controlled final acceptance.

## 27. Final Tokens

CURRENT_CONTROL = DARFUS-DIAMOND-JEWELLERY-CORRECTIVE-TAX-VALUATION-IDEMPOTENCY
LOCAL_MAIN_DB = darfus_erp
EXISTING_FAILED_ACCEPTANCE_DATA_PRESERVED = YES
SUPPLIER_V2_UNIT_COST_SEMANTICS = PROVEN_PRE_TAX_PURCHASE_BASE_FOR_STANDARD_VAT_DIAMOND_RECEIVE
ROOT_CAUSE_DOUBLE_VAT = UI_SENT_TAX_INCLUSIVE_TOTAL_AS_PRE_TAX_V2_COST
PREVIEW_HISTORICAL_BASE = 3037.00
PREPARED_RECEIVE_UNIT_COST = 3037.00000000
PREVIEW_SHARED_TAX_PARITY = PASS
DOUBLE_VAT_PATH = ELIMINATED
PURCHASE_COST_REVISION_MAPPING = PASS
PURCHASE_REVISION_COST_SEMANTICS = PRE_TAX_CANONICAL_ACQUISITION_COST_FOR_RECOVERABLE_STANDARD_VAT
CURRENT_VALUATION_MAPPING = PASS
CURRENT_VALUATION_SEMANTICS = CURRENT_GOLD_PLUS_CURRENT_MAKING_PLUS_CURRENT_DIAMOND_PLUS_CURRENT_VAT
CURRENT_VAT_BUSINESS_SEMANTICS = CURRENT_VALUATION_DISPLAY_AND_VALUATION_SNAPSHOT_AMOUNT_NOT_PURCHASE_AP_VAT
HISTORICAL_CURRENT_SEPARATION = PASS
ACCOUNTING_MAPPING = PASS_STATIC_CANONICAL_MAPPING_PRESERVED
DYNAMIC_VAT = PASS
CURRENT_CONFIGURED_VAT_RATE = 14%
FINAL_RECEIVE_PAYLOAD_BUILDER = PASS
PREVIEW_FINGERPRINT = PASS
ORIGINAL_REQUEST_CAPTURE = PASS
EXACT_REPLAY_PAYLOAD_RETENTION = PASS
IDEMPOTENCY_HASH_INPUT_PROVEN = YES
IDEMPOTENCY_REPLAY_HASH_EQUIVALENCE_TEST = PASS
AR_PREVIEW = PASS
EN_PREVIEW = PASS
FINAL_RECEIVE_REQUESTS_CREATING_BUSINESS_DATA = 0
NEW_PO_COUNT = 0
NEW_ASSET_COUNT = 0
NEW_JOURNAL_COUNT = 0
DB_BUSINESS_WRITES = 0
FOCUSED_TESTS = PASS
REGRESSION_TESTS = PASS
TYPECHECK = PASS
MIGRATION_CREATED = NO
MIGRATION_EXECUTED = NO
MASTER_DATA_MUTATION = NO
TAX_SETTINGS_MUTATION = NO
GOLD_SETTINGS_MUTATION = NO
ONLINE_PRODUCTION_CONTACTED = NO
P0_COUNT = 0
P1_COUNT = 0
GATE = READY_FOR_SECOND_OWNER_AUTHORIZED_DIAMOND_FINAL_UI_RECEIVE_ACCEPTANCE
DIAMOND_JEWELLERY_FINAL_USER_WORKFLOW_CLOSED = NO
NEXT_RECOMMENDED_STEP = SECOND_OWNER_AUTHORIZED_FINAL_DIAMOND_UI_RECEIVE_ACCEPTANCE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START

## STOP

No Diamond Receive, no Loose Diamond work, no historical-data correction, and no automatic next batch were started.

NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START

