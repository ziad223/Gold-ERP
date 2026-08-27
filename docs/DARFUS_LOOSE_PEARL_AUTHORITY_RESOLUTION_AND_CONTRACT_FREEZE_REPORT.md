# DARFUS ERP — Loose Pearl Authority Resolution and Contract Freeze Report

تم تنفيذ مرحلة Authority Resolution وContract Freeze فقط. تم اعتماد قراري Owner السابقين، وتجميد عقد Loose Pearl وحوكمة الفشل وإعادة المحاولة. لم يتم تعديل Product Source أو قاعدة البيانات، ولم يتم تنفيذ Receive أو Confirm أو Retry.

## 1. Executive Summary

تم إغلاق التعارضين اللذين سجلهما `DARFUS-LOOSE-PEARL-PREIMPLEMENTATION-AUTHORITY-AUDIT`:

- `LP-OD-001`: كل Pearl فعلية تصبح Asset مستقلًا؛ Quantity في UI للـbulk convenience فقط.
- `LP-OD-002`: شراء Loose Pearl يتطلب Supplier canonical؛ optional Supplier يخص مصادر non-purchase مستقبلية فقط.

تم تجميد `LL-018`: الفشل لا يعني Retry تلقائيًا ولا حظرًا دائمًا؛ لا Retry إلا بعد حفظ الدليل، إثبات DB delta والحد الفاشل، Root Cause مثبت، Minimum Safe Fix، Tests، Impact Analysis، Owner Review، ثم Retry واحد مضبوط.

## 2. Control Scope

| Token | Actual |
|---|---|
| Control | `DARFUS-LOOSE-PEARL-AUTHORITY-RESOLUTION-AND-CONTRACT-FREEZE` |
| Mode | `AUTHORITY_AND_CONTRACT_FREEZE_ONLY` |
| Official DB | `darfus_erp`, untouched |
| Source/Product changes | `0` |
| Migrations created/executed | `0 / 0` |
| Seeds/Master mutations | `0 / 0` |
| Receive/Confirm/Replay | `NO / 0 / NO` |
| Business writes | `0` |

## 3. Prior Audit State

Prior gate was `BLOCKED_LOOSE_PEARL_TRUE_OWNER_DECISION_REQUIRED` with exactly two decisions: group Asset vs one physical Asset, and optional Supplier vs required Supplier Receive V2. Both are explicitly resolved here. No new source/DB evidence was used to reopen them.

## 4. LP-OD-001 Resolution

`LP-OD-001 = RESOLVED_ONE_PHYSICAL_PEARL_ONE_ASSET`.

One active Barcode belongs to each Asset. No `assets.quantity` column is required. UI may accept Quantity N for identical pearls as entry convenience, but durable persistence is N Assets, N identities, and N Barcodes.

## 5. Asset Cardinality Contract

`ONE_PHYSICAL_LOOSE_PEARL = ONE_ASSET`. Product quantity and grouped Product rows are not physical authority. Partial sale/transfer/return/manufacturing consumption inside an Asset is not needed; future bulk operations select multiple Assets.

## 6. Bulk Entry Normalization

Bulk entry is optional and deferred. If later enabled, identical technical attributes must be shared, but the persistence mapper must expand to one physical Asset per Pearl. It must not create a group Asset.

## 7. Weight/Cost Allocation Safety

Combined bulk Total Weight and Pearl Cost must not be silently divided by Quantity or cloned onto every Asset. `BULK_TOTAL_WEIGHT_ALLOCATION = NO_SILENT_ALLOCATION` and `BULK_TOTAL_COST_ALLOCATION = NO_SILENT_ALLOCATION`. Safe baseline is one physical Pearl entry → one Asset. Bulk allocation is a pre-implementation design gate, not a reason to add a migration now.

## 8. Lineage Consequence

Future manufacturing links each source Loose Pearl Asset by Asset ID to a target Jewellery Asset/component. Group quantity is never the lineage authority. Workshop/manufacturing remains deferred.

## 9. LP-OD-002 Resolution

`LP-OD-002 = RESOLVED_PURCHASE_REQUIRES_CANONICAL_SUPPLIER`.

For Purchase, `Supplier.id` is required, company-scoped, valid, and active. Unknown/Default/Fake Supplier and free-text substitution are forbidden. The canonical Supplier Receive V2 route remains the only purchased-stock workflow.

## 10. Supplier Purchase Contract

```text
SOURCE_TYPE = PURCHASE
SUPPLIER = REQUIRED
CANONICAL_RECEIVE = SUPPLIER_RECEIVE_V2
```

## 11. Non-Purchase Deferral

`NON_PURCHASE_ACQUISITION_FLOW = DEFERRED_NOT_AUTHORIZED`. Opening Balance, Owner-provided stock, Inventory Adjustment, Manufacturing Output, or other sources require a separate future authority and are not implemented here.

## 12. Loose Pearl Core Contract

`LOOSE_PEARL` is standalone inventory with no Gold, Karat, Gold Weight, Gold Cost, or Making. One physical Pearl is one Asset with one active Barcode. Supplier Receive V2, Asset, Barcode, branch, location, Tax, Accounting, Asset.price, and Idempotency remain the frozen system authorities.

The full normalized contract is in:
[DARFUS_LOOSE_PEARL_NORMALIZED_IMPLEMENTATION_CONTRACT.md](I:/WORK/jewellery-erp-master/docs/DARFUS_LOOSE_PEARL_NORMALIZED_IMPLEMENTATION_CONTRACT.md)

## 13. Historical Purchase

Historical Pearl Cost is pre-tax acquisition cost for the physical Pearl and must remain immutable when current value changes. Purchase VAT is applied exactly once by the existing dynamic Tax Engine.

## 14. Current Value

Historical Purchase Cost and Current Pearl Value are separate. Current value changes only through an approved audited valuation path and never overwrites the historical purchase snapshot.

## 15. Tax

The existing UAE Tax Engine and Company Tax Policy remain authoritative. No 5% or 14% hardcoding is permitted. The flow remains Company Policy → Transaction Tax Context → legal eligibility → immutable tax snapshot → Accounting. Double VAT is forbidden.

## 16. Accounting

For standard taxable purchases: Inventory/Asset debit equals historical pre-tax cost, Recoverable VAT debit equals VAT, and Accounts Payable credit equals the inclusive purchase total. Cash delta at Receive is zero and Debit=Credit. No journal was posted in this Control.

## 17. Asset.price

`Asset.price` is the explicit selling-price authority. A bad derived pricing policy must not zero a valid positive Asset.price; if no valid price exists, the future flow fails closed.

## 18. Barcode/RFID

Loose Pearl must use `PL` + `LOS` + `00` + six-digit serial: `PLLOS00XXXXXX`. It must be globally unique, one active Barcode per Asset, and must not use first-compatible fallback. RFID is optional and supplementary; Barcode remains primary.

## 19. Status/Branch/Location

Branch is required, server authoritative, and fail-closed. Location is active branch-scoped DB Master Data only; free-text transaction locations are forbidden. Status uses the existing V2 operational transition authority.

## 20. UI/Receive

The future workflow is exactly:

```text
Inventory → + Add / Receive Inventory → Loose Pearl → Supplier Receive V2
```

There is one dedicated Loose Pearl form; Pearl Jewellery is not reused by hiding Gold fields; no legacy or parallel Receive workflow is authorized.

## 21. POS

Future read-only proof must show Barcode → one Loose Pearl Asset → AVAILABLE → correct branch → Asset.price → selectable. Checkout is not required for that proof.

## 22. Idempotency

Before any future live Confirm, retain the exact request, canonical hash input, rollback request artifact, and key. After a proven authenticated post-success channel: exact replay returns the same result with business delta 0; same key plus changed payload returns 409 with business delta 0.

## 23. Failure Classification

This Control executed no Receive, so `FIRST_PROVEN_BROKEN_BOUNDARY = NOT_APPLICABLE` and `ROOT_CAUSE = NOT_PROVEN`. Future failures must be classified at the first proven boundary: UI event, submit handler, client guard, auth freshness, context, request hash, API client, fetch/network, middleware, route validation, business handler, transaction, idempotency, accounting, readback, or POS.

## 24. DB Delta Retry Decision

No Receive or Retry occurred. For any future failure, DB delta must be reconciled across PO, Asset, component/detail, Barcode, movement, cost revision, current valuation, Journal, Cash, and Idempotency. A successful transaction must never be retried; a partial/uncertain state is stop/no cleanup/no delete; a zero-delta failure may proceed only through the governed path below.

## 25. Minimum Safe Fix Rule

Fix the first proven broken boundary, not the symptom. Every proposal must state Root Cause, boundary, current behavior, minimum change, files/modules, DB/accounting/inventory/security impact, rollback, focused tests, and regression tests.

## 26. High-Risk Stop Gate

Any fix touching Accounting, inventory ownership, Asset/Barcode identity, Tax, Supplier balances, permissions, Idempotency, historical cost, or current valuation requires impact analysis and Owner review. Implementation is not authorized by this freeze.

## 27. Controlled Retry Rule

A retry requires preserved evidence, proven Root Cause, reconciled DB delta, minimum safe fix, focused/regression/typecheck/build PASS as applicable, exact request revalidation, company/branch/auth context PASS, fresh backup where critical, safe post-success channel, and explicit Owner authorization. Maximum is one Confirm click per authorization.

## 28. Same-Cause Repeat Rule

If that one controlled retry fails for the same cause, stop and block a third attempt. If a genuinely new cause appears, record a new lesson and stop.

## 29. LL-018

`LL-018 = FROZEN_CONTROLLED_RETRY_AFTER_PROVEN_FAILURE`.

Failed critical mutation may be retried only after proven Root Cause, zero/reconciled persistent state, Minimum Safe Fix, tests, impact analysis, and Owner authorization. Automatic retry is forbidden; a permanent blanket retry ban is also forbidden.

## 30. Migration Policy

`MIGRATION_NEEDED = UNPROVEN_DESIGN_ONLY`. After LP-OD-001, an `assets.quantity` migration should not be required. Any future migration requires schema proof, exact gap proof, reversible design, clone rehearsal, backup, and explicit Owner approval.

## 31. Implementation Scope

The next separately authorized minimum-safe implementation may target only: Loose Pearl contract, profile/shared preview, dedicated AR/EN route/form, chooser entry, Pearl master binding, Supplier V2 mapping, historical/current mapping, Asset.price, PL/LOS/00 enforcement, Asset readback, POS read-only compatibility, and Idempotency evidence.

## 32. Deferred Scope

Bulk allocation, Group Asset model, non-purchase acquisition, Workshop, partial/split operations, transfer redesign, inventory count redesign, POS checkout redesign, and Accounting redesign are deferred.

## 33. Preimplementation Test Plan

Before the first Receive: classifier and contract tests, master-data binding tests, tax-once/accounting parity, Asset/Barcode cardinality, branch/location/supplier scope, Asset.price fallback safety, AR/EN readback, POS barcode search, Idempotency exact/conflict behavior, and regression/typecheck/build where applicable.

## 34. Future Live Acceptance Preconditions

Focused tests, regression, typecheck/build, disposable-clone Receive, rollback delta 0, exact request/hash/rollback evidence, company/branch/auth/location/supplier proof, fresh DB baseline/backup, and safe authenticated post-success channel must pass. Only then may Owner authorize one official Confirm.

## 35. True Owner Decisions

`TRUE_OWNER_DECISIONS_REMAINING = 0`. LP-OD-001 and LP-OD-002 are closed by this Owner-supplied Control. Bulk allocation is deferred design work, not reopened authority.

## 36. P0/P1/P2

`P0_COUNT = 0`, `P1_COUNT = 0`, `P2_COUNT = 2` (deferred bulk allocation design and certificate-master reconciliation). No new defect or mutation was introduced.

## 37. Gate

```text
GATE = PASS_LOOSE_PEARL_AUTHORITY_RESOLUTION_AND_IMPLEMENTATION_CONTRACT_FREEZE
LP_OD_001 = RESOLVED_ONE_PHYSICAL_PEARL_ONE_ASSET
LP_OD_002 = RESOLVED_PURCHASE_REQUIRES_CANONICAL_SUPPLIER
TRUE_OWNER_DECISIONS_REMAINING = 0
LL018 = FROZEN
MIGRATION_AUTHORIZED = NO
IMPLEMENTATION_EXECUTED = NO
BUSINESS_WRITES = 0
LOOSE_PEARL_MODULE_STATUS = CONTRACT_FROZEN_READY_FOR_MINIMUM_SAFE_IMPLEMENTATION
NEXT_RECOMMENDED_STEP = LOOSE_PEARL_MINIMUM_SAFE_IMPLEMENTATION
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 38. Final Tokens

```text
CURRENT_CONTROL = DARFUS-LOOSE-PEARL-AUTHORITY-RESOLUTION-AND-CONTRACT-FREEZE
LOCAL_MAIN_DB = darfus_erp
PRIOR_GATE = BLOCKED_LOOSE_PEARL_TRUE_OWNER_DECISION_REQUIRED
LP_OD_001 = RESOLVED_ONE_PHYSICAL_PEARL_ONE_ASSET
LP_OD_001_UI_BULK_QUANTITY = ENTRY_CONVENIENCE_ONLY
LP_OD_001_PERSISTED_ASSET_QUANTITY = NOT_USED
BULK_TOTAL_WEIGHT_ALLOCATION = NO_SILENT_ALLOCATION
BULK_TOTAL_COST_ALLOCATION = NO_SILENT_ALLOCATION
LP_OD_002 = RESOLVED_PURCHASE_REQUIRES_CANONICAL_SUPPLIER
FAKE_SUPPLIER_ALLOWED = NO
NON_PURCHASE_ACQUISITION_FLOW = DEFERRED_NOT_AUTHORIZED
TRUE_OWNER_DECISIONS_REMAINING = 0
LOOSE_PEARL_HAS_GOLD = NO
LOOSE_PEARL_HAS_MAKING = NO
ONE_PHYSICAL_LOOSE_PEARL = ONE_ASSET
PURCHASED_LOOSE_PEARL_SUPPLIER = REQUIRED
CANONICAL_RECEIVE = SUPPLIER_RECEIVE_V2
SELLING_PRICE_AUTHORITY = ASSET_PRICE
EXPECTED_BARCODE = PLLOS00XXXXXX
TAX_ENGINE = DYNAMIC_EXISTING_AUTHORITY
HISTORICAL_CURRENT_SEPARATION = REQUIRED
LL018 = FROZEN_CONTROLLED_RETRY_AFTER_PROVEN_FAILURE
AUTOMATIC_RETRY = NO
PERMANENT_BLANKET_RETRY_BAN = NO
RETRY_REQUIRES_ROOT_CAUSE = YES
RETRY_REQUIRES_DB_DELTA_PROOF = YES
RETRY_REQUIRES_MINIMUM_SAFE_FIX = YES
RETRY_REQUIRES_REGRESSION = YES
RETRY_REQUIRES_OWNER_AUTHORIZATION = YES
MAX_CONTROLLED_RETRY_CLICKS_PER_AUTHORIZATION = 1
SAME_CAUSE_THIRD_ATTEMPT = BLOCKED
SOURCE_CHANGES = 0
MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED = 0
BUSINESS_WRITES = 0
GATE = PASS_LOOSE_PEARL_AUTHORITY_RESOLUTION_AND_IMPLEMENTATION_CONTRACT_FREEZE
LOOSE_PEARL_MODULE_STATUS = CONTRACT_FROZEN_READY_FOR_MINIMUM_SAFE_IMPLEMENTATION
NEXT_RECOMMENDED_STEP = LOOSE_PEARL_MINIMUM_SAFE_IMPLEMENTATION
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 39. STOP

لا Implementation، لا Migration، لا Receive، لا Confirm، لا Retry، لا Master Data mutation، ولا Batch تالٍ تلقائيًا. انتظر Owner authorization صريحًا للـMinimum Safe Implementation.
