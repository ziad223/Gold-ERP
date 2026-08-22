# DARFUS ERP — Loose Pearl Minimum Safe Implementation Report

Control: `DARFUS-LOOSE-PEARL-MINIMUM-SAFE-IMPLEMENTATION`

## Executive Summary

تم تنفيذ نطاق Loose Pearl الأدنى الآمن فقط، مع الحفاظ على `Asset` كسلطة المخزون الفيزيائي، و`Supplier Receive V2` كمسار الشراء canonical، وبدون Migration أو كتابة على قاعدة `darfus_erp`.

النتيجة: تم إثبات المسار على Disposable Clone بعملية Receive واحدة ناجحة (`201`)، ثم exact replay (`201`) وsame-key changed-payload conflict (`409`). تم إثبات PO/Asset/Barcode/Origin/Cost Revision/Current Valuation/Movement/Payable Journal، ثم تم إسقاط الـclone المحدد فقط وإثبات رجوع دلتا الأعمال فيه إلى صفر. بقيت قاعدة `darfus_erp` عند baseline نفسه.

## Authority / Scope

- Business authority: `Pearl.docx`، مقروء بالكامل في مسار التحليل السابق؛ لا توجد إضافة لقاعدة عمل غير مثبتة.
- Frozen platform authority: one physical Pearl = one Asset، one active Barcode، Supplier Receive V2، Tax Engine، Accounting، Idempotency، company/branch server authority.
- Implemented: dedicated AR/EN route، chooser entry، profile/shared preview، master-data binding، CT precision، Supplier V2 mapping، cost/current valuation، Asset.price، PL/LOS/00 barcode، readback، POS read-only، focused tests، relevant regressions، clone proof، rollback evidence.
- Not implemented: Group Asset، quantity authority، Product fallback كسلطة فيزيائية، non-purchase acquisition، workshop/transfer/count redesign، checkout، official receive، migration، provisioning، production.

## Pre-change baseline

Read-only query of `SELECT current_database()` returned `darfus_erp`. Baseline counts were:

| Entity | Count |
|---|---:|
| purchase_orders | 13 |
| purchase_order_items | 13 |
| assets | 13 |
| LOOSE_PEARL assets | 0 |
| PEARL_JEWELLERY assets | 1 |
| asset_components | 10 |
| asset_pearl_component_details | 1 |
| asset_origins | 13 |
| asset_purchase_cost_revisions | 13 |
| asset_current_valuations | 13 |
| inventory_asset_movements | 13 |
| asset_barcode_history | 13 |
| asset_rfid_assignments | 2 |
| journal_entries | 16 |
| journal_lines | 45 |
| idempotency_requests | 17 |
| cash_transactions | 3 |
| suppliers | 2 |
| inventory_locations | 2 |
| pearl_size_master_data | 39 |
| profile_master_data | 660 |

## Source reality

The worktree was already dirty before this batch. Existing changes were preserved; no reset, restore, clean, stash, or broad cleanup was run. The observed head was `1657b0e9ba580faef69be48f04637835c201b521`. The known generated Next.js `next-env.d.ts` drift was not manually edited; the approved generated state was produced by the build and is not treated as a product change.

## Schema proof

The existing schema represents the frozen contract: `assets` has no quantity column, `asset_components.component_count` exists for descriptive detail, and the existing Pearl detail, origin, purchase-cost, current-valuation, movement, barcode-history, journal, and idempotency tables are present. Existing decimal storage is sufficient for the CT and money precision. Therefore:

`SCHEMA_PROOF = PASS_EXISTING_SCHEMA_REPRESENTS_CONTRACT`

`MIGRATION_NEEDED = NO`, `MIGRATION_CREATED = NO`, `MIGRATION_EXECUTED = NO`.

## Files changed

Intentional implementation/test files:

- `backend/src/services/loose-pearl-profile.service.js`
- `backend/src/routes/loose-pearl-profile.routes.js`
- `backend/src/routes/index.js`
- `backend/src/routes/erp.routes.js`
- `backend/src/services/inventory-master-policy.service.js`
- `backend/src/services/barcode-identity.service.js`
- `backend/src/services/inventory-v2-runtime.service.js`
- `components/inventory/inventory-intake-chooser.tsx`
- `app/[locale]/(dashboard)/inventory/loose-pearl/page.tsx`
- `tests/loose-pearl-minimum-safe-implementation.test.cjs`
- `tests/unified-inventory-ux-final-closure.test.cjs`
- `tests/unified-inventory-intake-ux-02-r3.test.cjs`
- this report and the acceptance artifacts directory.

No migration or official database file was changed.

## Frontend / Chooser

The chooser now exposes one dedicated `LOOSE_PEARL` choice at `/ar/inventory/loose-pearl` and `/en/inventory/loose-pearl`. The form is separate from Pearl Jewellery and contains no Gold, Karat, Gold Weight, Gold Cost, or Making fields. It uses the single canonical shared receive section and retains exact request/idempotency values only for controlled diagnostics.

`AR_ROUTE = PASS`, `EN_ROUTE = PASS`, `CHOOSER = PASS`.

## Profile contract / Preview

The dedicated contract is read-only and server-backed. The profile preview validates supplier, branch, DB location, active Pearl masters, Pearl Size master, CT precision, purchase cost, current value, sale price, tax treatment, and certificate dependency. The shared preview reuses the existing receive preview and Tax Engine; no second pricing, valuation, or receive engine was created.

`PROFILE_CONTRACT = PASS`, `PREVIEW = PASS`.

## Master Data

Active-only master data is resolved server-side for Pearl type, color, overtone, orient, shape, luster, surface quality, nacre quality, origin, description, and certificate authority. The contract exposed 39 active Pearl Size values. Location is selected from active branch-scoped DB data; no free-text location was introduced. Internal IDs are not rendered as user labels.

`PEARL_MASTER_DATA = PASS`, `PEARL_SIZE = PASS`.

## Weight / Size

Loose Pearl uses CT, accepts two decimal places, displays two decimal places, and rejects excess precision without silent rounding. Pearl Size uses the existing 39-value master list and displays labels such as `1.0 mm`; the internal ID remains separate from the business label.

## Supplier / Branch / Location

Purchased Loose Pearl requires a canonical supplier. Branch and company context remain server-authoritative. Location is required and resolved from active branch-scoped master data. No default, unknown, fake, or free-text supplier/location was added.

## Historical Purchase

For the clone transaction, historical Pearl cost was `100.00000000` pre-tax. The purchase-cost revision stored the pre-tax historical amount in the existing canonical base field (`gold_value` mapping used by the generic schema for loose-profile base), with `vat_base=100`, `vat_amount=14`, and `total_purchase_cost=100` pre-tax. Historical purchase cost was not overwritten by current value.

`HISTORICAL_COST = PASS`, `SUPPLIER_V2_MAPPING = PASS`.

## Current Valuation

The clone transaction stored current Pearl value separately: `component_value=120`, `vat_base=120`, `vat_amount=16.8`, and `total_value=136.8`, with rate source `LOOSE_PEARL_VALUATION`. This did not overwrite the historical purchase revision.

`CURRENT_VALUATION = PASS`.

## Tax

The active company tax policy was read from the DB and resolved dynamically at 14%; the code does not hardcode 5% or 14%. For the representative values:

- historical base `100` → purchase VAT `14` → purchase total `114`;
- current base `120` → current VAT `16.8` → current total `136.8`.

The purchase receive applies VAT once. The transaction tax snapshot remains the authority for the PO and journal.

`TAX_APPLICATION_COUNT = 1`, `TAX_ONCE = PASS`.

## Accounting

The clone journal was balanced at `114.00000000` debit and `114.00000000` credit. The observed shape was Inventory/Asset debit `100`, Recoverable VAT debit `14`, and canonical Accounts Payable credit `114`. No separate payable table exists in the current schema; the AP journal credit is the existing payable authority. Cash delta at receive was zero.

`ACCOUNTING = PASS`, `CASH_AT_RECEIVE = 0`.

## Asset.price

The clone Asset had `price=200.00000000`. POS read/search returned that valid positive Asset price and did not substitute Product quantity or Product price.

`ASSET_PRICE = PASS`.

## Barcode / RFID

The server enforced inventory code `PL`, item code `LOS`, and karat code `00`; the resulting barcode was `PLLOS00000001`, matching `PLLOS00XXXXXX`. One active barcode was linked to the Asset. RFID remained optional supplementary identity; no RFID assignment was created.

`BARCODE_MAPPING = PASS`, `EXPECTED_BARCODE = PLLOS00XXXXXX`.

## Asset representation

The successful clone receive produced one physical Asset, one `PRIMARY_SUBJECT` component detail with `component_count=1`, one Pearl detail, and CT component weight `1.25`. Component detail is descriptive metadata, not a second stock identity.

`ONE_PHYSICAL_PEARL_ONE_ASSET = PASS`.

## Supplier Receive V2 mapping

The canonical request used document quantity `1`, `perPiece.length=1`, pre-tax historical purchase cost `100`, current valuation input `120`, and the existing Supplier Receive V2 endpoint. It produced exactly one PO, one PO item, one Asset, one barcode, one origin, one purchase-cost revision, one current valuation, one movement, and one balanced journal.

## Request evidence

The exact prepared request and idempotency lifecycle were retained without secrets. The request artifact records the pre-tax unit cost meaning, `taxIncluded=false`, `STANDARD_VAT`, document quantity, and per-piece cardinality. A changed payload was not reconstructed from cleared form state.

## Auth freshness

The clone runtime used the normal authenticated API path with explicit company and branch context. The temporary backend environment was verified with `DB_NAME=darfus_erp_loose_pearl_20260822_01`; it was never connected to `darfus_erp` for mutation.

## POS read-only

`GET /api/v1/pos/search?query=PLLOS00000001&limit=20&type=all` returned `200` and exactly one result: `isProduct=false`, `profile=LOOSE_PEARL`, `available=1`, correct branch, price `200`, and no Product fallback. Checkout was not run.

`POS_READ_ONLY = PASS`.

## AR readback

Authenticated readback for the Asset route returned `200` in Arabic context. The response/UI mapping exposed Asset identity, profile, barcode, CT weight, Pearl Size label, type, historical cost, current value, selling price, status, branch/location, source references, and audit/history. Internal Master Data IDs were not presented as user-facing labels. The successful synthetic receive did not include canonical `pearlColor`, so the persisted detail has no color; a separate read-only canonical preview proved `pearlColor=Black` and the active Master ID binding. No second receive was used to alter the accepted transaction.

`AR_READBACK = PASS` with the synthetic-payload limitation documented above.

## EN readback

Authenticated readback for the same Asset route returned `200` in English context with the same Asset-authoritative identity and financial/history values; no Product quantity record was involved.

`EN_READBACK = PASS`.

## Focused tests

`node --test tests/loose-pearl-minimum-safe-implementation.test.cjs`: **5/5 PASS**.

Coverage includes CT precision, no Gold fields, dynamic purchase/current VAT separation, PL/LOS/00 mapping, one physical piece, current valuation retention, and source wiring.

`FOCUSED_TESTS = PASS`.

## Regression

Relevant UX, Pearl, Asset, Barcode, Supplier Master, Loose Diamond VAT, Pearl closure, size binding, request dispatch, and auth-freshness suites passed: **55/55** in the recorded batch run. No tests were weakened; stale chooser assertions were updated only for the approved active Loose Pearl profile state.

`REGRESSION = PASS`.

## Typecheck

`npm run typecheck` completed successfully.

`TYPECHECK = PASS`.

## Build

`npm run build` compiled successfully, ran TypeScript generation successfully, and generated both Loose Pearl routes. The known generated `next-env.d.ts` drift was not manually edited.

`BUILD = PASS`.

## Disposable clone Receive

Clone: `darfus_erp_loose_pearl_20260822_01`, temporary backend port `18000`, verified exact `current_database()` clone before mutation. Synthetic values only.

Result:

| Proof | Result |
|---|---|
| Receive | `201`, one successful business transaction |
| PO | `PO-1787419714011` |
| Asset | `AST-PUR-1787419714017-1-1-78kh` |
| Barcode | `PLLOS00000001` |
| Weight | `1.25 CT` |
| Supplier/branch/location | canonical and correct |
| Cost revision | pre-tax 100, VAT snapshot 14 |
| Current valuation | base 120, VAT 16.8, total 136.8 |
| Movement | one purchase receive movement |
| Journal | 114 debit / 114 credit |
| Cash | zero delta |

`CLONE_RECEIVE = PASS`.

## Clone DB reconciliation

The successful clone delta was exactly one in each expected business chain table and three journal lines. Two earlier clone attempts failed before durable business completion and were rolled back by the transaction: first at the generic gross-weight guard (`422`), then at evidence persistence due lost piece ordinal (`500`, `NaN`). No official database delta occurred.

## Idempotency replay/conflict

- exact same key and exact same request: `201`, same PO, no duplicate Asset/Barcode/Movement/Journal;
- same key and changed payload: `409 STATE_CONFLICT`, no business delta.

`IDEMPOTENCY_EXACT_REPLAY = PASS`, `IDEMPOTENCY_CHANGED_PAYLOAD_409 = PASS`.

## Rollback

The rollback request artifact was captured. After evidence capture, the temporary backend was stopped and the exact disposable clone `darfus_erp_loose_pearl_20260822_01` was dropped. The clone no longer existed; the persistent business delta after rollback was zero. This operation did not touch `darfus_erp`.

`CLONE_ROLLBACK = PASS`.

## Official DB zero delta

Post-rollback read-only query returned `current_database()=darfus_erp` and the key counts remained `purchase_orders=13`, `assets=13`, `journal_entries=16`, `idempotency_requests=17`. No official Receive, PO, Asset, Barcode, Movement, Journal, Payment, seed, or cleanup was executed.

`OFFICIAL_DB_BUSINESS_DELTA = 0`.

## Failure/retry events

The first broken boundary was fixed before the single successful controlled retry:

| Lesson | Root cause | Minimum safe fix | Result |
|---|---|---|---|
| LP-LESSON-001 | generic gram/gold weight guard treated Loose Pearl as missing gross weight | derive Loose Pearl gross weight from CT loose details and exclude gold-only guard | focused/runtime proof passed |
| LP-LESSON-002 | profile mapper dropped item/piece indices used by evidence ordinal | preserve `itemIndex` and `pieceIndex` into the receive piece | focused/runtime proof passed |

There was no same-cause repeat. `FAILED_RECEIVE_COUNT=2` records the two failed clone attempts; `CONTROLLED_RETRY_COUNT=1` records the one successful retry after evidence, fixes, focused tests, regression, typecheck, build, and clone context proof. No automatic retry was used and no third attempt was made.

## Minimum safe fixes

The changes were limited to the profile contract/route, canonical shared receive integration, loose-profile policy/barcode/runtime handling, unified chooser, dedicated route, and focused assertions. No accounting redesign, schema migration, master-data provisioning, Product quantity authority, or second receive workflow was introduced. The two runtime fixes above were proven on clone and rolled back with the clone.

## New lessons

`NEW_LESSONS_ADDED = 2`: the two lessons are recorded in `backend/acceptance-artifacts/loose-pearl/DARFUS-LOOSE-PEARL-MINIMUM-SAFE-IMPLEMENTATION/new-lessons.json`.

## P0/P1/P2

- P0: 0
- P1: 0
- P2: 0

The missing color in the successful synthetic row is not classified as a product defect: the request used `pearlColorId`, while the canonical preview/request contract uses `looseDetails.pearlColor`. The canonical read-only preview returned `Black` and the active Master Data ID, and no additional Receive was authorized.

## Gate

`GATE = PASS_LOOSE_PEARL_MINIMUM_SAFE_IMPLEMENTATION_AND_CLONE_ACCEPTANCE`

This gate does **not** authorize an official local receive. It only establishes implementation and disposable-clone acceptance readiness.

## Final Tokens

```text
CURRENT_CONTROL = DARFUS-LOOSE-PEARL-MINIMUM-SAFE-IMPLEMENTATION
LOCAL_MAIN_DB = darfus_erp
CURRENT_ACTIVE_OWNER_SCOPE = LOOSE_PEARL
TRUE_OWNER_DECISIONS_REMAINING = 0
LL018 = FROZEN_CONTROLLED_RETRY_AFTER_PROVEN_FAILURE
SCHEMA_PROOF = PASS_EXISTING_SCHEMA_REPRESENTS_CONTRACT
MIGRATION_NEEDED = NO
MIGRATION_CREATED = NO
MIGRATION_EXECUTED = NO
FILES_CHANGED = 13 intentional source/test files plus report/artifacts; pre-existing worktree drift preserved
AR_ROUTE = PASS
EN_ROUTE = PASS
CHOOSER = PASS
PROFILE_CONTRACT = PASS
PREVIEW = PASS
PEARL_MASTER_DATA = PASS
PEARL_SIZE = PASS
SUPPLIER_V2_MAPPING = PASS
HISTORICAL_COST = PASS
CURRENT_VALUATION = PASS
TAX_APPLICATION_COUNT = 1
ASSET_PRICE = PASS
BARCODE_MAPPING = PASS
EXPECTED_BARCODE = PLLOS00XXXXXX
ONE_PHYSICAL_PEARL_ONE_ASSET = PASS
POS_READ_ONLY = PASS
AR_READBACK = PASS
EN_READBACK = PASS
FOCUSED_TESTS = PASS
REGRESSION = PASS
TYPECHECK = PASS
BUILD = PASS
CLONE_RECEIVE = PASS
CLONE_ROLLBACK = PASS
IDEMPOTENCY_EXACT_REPLAY = PASS
IDEMPOTENCY_CHANGED_PAYLOAD_409 = PASS
FAILED_RECEIVE_COUNT = 2
CONTROLLED_RETRY_COUNT = 1
SAME_CAUSE_REPEAT_COUNT = 0
NEW_LESSONS_ADDED = 2
OFFICIAL_LOCAL_MAIN_RECEIVE_EXECUTED = NO
OFFICIAL_DB_BUSINESS_DELTA = 0
P0_COUNT = 0
P1_COUNT = 0
P2_COUNT = 0
GATE = PASS_LOOSE_PEARL_MINIMUM_SAFE_IMPLEMENTATION_AND_CLONE_ACCEPTANCE
LOOSE_PEARL_MODULE_STATUS = IMPLEMENTED_AND_CLONE_ACCEPTED_OFFICIAL_RECEIVE_NOT_AUTHORIZED
NEXT_RECOMMENDED_STEP = LOOSE_PEARL_OFFICIAL_LOCAL_MAIN_RECEIVE_ACCEPTANCE_AFTER_NEW_OWNER_AUTHORIZATION
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## STOP

لا يوجد Official Local Main Receive في هذا الـBatch. لا يوجد automatic retry، ولا deployment، ولا batch تالٍ تلقائيًا. انتظر Owner review وOwner authorization جديد قبل `LOOSE_PEARL_OFFICIAL_LOCAL_MAIN_RECEIVE_ACCEPTANCE`.
