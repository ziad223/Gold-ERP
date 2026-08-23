# DARFUS ERP — Loose Diamond Minimum Safe Implementation Report

## 1. Executive Summary

تم تنفيذ الحد الأدنى من مسار Loose Diamond مع الحفاظ على Asset/Barcode/Supplier V2/Tax/Accounting authorities. تم إثبات المنطق باختبارات مركزة، وتمت تجربة provisioning على قاعدة rehearsal منفصلة بنجاح. لم يتم تنفيذ أي Receive، ولم تُنشأ PO/Asset/Barcode/Movement/Journal/Payment جديدة.

الـGate النهائي ليس PASS لأن AR/EN authenticated browser proof لم يكتمل: جلسة المتصفح الحالية لم تحمل Company context، وواجهة العقد المصادق عليها أعادت `401`. لذلك لا أعتبر Profile Preview أو Shared Preview مثبتين عبر browser.

## 2. Owner Decisions Applied

| Decision | Applied |
|---|---|
| One loose stone = one Asset | Yes |
| Multi-stone loose Asset | Rejected |
| Product.quantity as physical authority | No |
| Purchase Price required | Yes |
| Stone Cost independent second authority | No; equality checked when supplied |
| Current Diamond Value | Optional and separate from purchase |
| Diamond Color | Multi-value, active master IDs |
| Supplier | DB master |
| Location | Branch-scoped DB master |
| Gold fields | Not applicable |
| Receive | Not executed |

## 3. Files Changed

Intentional implementation scope:

- `app/[locale]/(dashboard)/inventory/loose-diamond/page.tsx`
- `components/inventory/inventory-intake-chooser.tsx`
- `backend/src/routes/loose-diamond-profile.routes.js`
- `backend/src/routes/index.js`
- `backend/src/routes/erp.routes.js`
- Loose Diamond, policy, master-data, barcode, runtime, tax-preview, and sale-pricing services under `backend/src/services/`
- `backend/migrations/20260821010000-loose-diamond-master-data-and-multicolor.js`
- `backend/tests/loose-diamond-minimum-safe-implementation.test.cjs`
- Updated unified-intake regression assertions to include the newly approved Loose Diamond choice.

The worktree was already broadly dirty before this batch. No reset, restore, clean, stash, commit, or unrelated cleanup was performed. Current observed state: branch `main`, HEAD `1657b0e9ba580faef69be48f04637835c201b521`, approximately 96 tracked and 354 untracked status lines, 11 stashes.

## 4. Master Data / Fresh DB Provisioning

Implemented versioned `DIAMOND_NAME` with canonical value `Diamond`, dataset version 3, and fresh-DB reproducible manifest support.

Disposable rehearsal target: `darfus_erp_g2a2_clone_20260818_181245z`.

- `current_database()` verified as the clone before migration.
- Migration chain advanced from 85 to 87.
- `DIAMOND_NAME/Diamond` count: 1.
- Bootstrap state: `READY`, version 3.
- Multi-color reference constraint: `(asset_id, category_key, master_data_id)`.
- PO/Asset/Journal counts remained zero on the clone.
- Rerun: `No migrations were executed, database schema was already up to date.`

The official DB was observed at migration 87 with one `DIAMOND_NAME/Diamond` row and no business-table count delta. A fresh full custom-format backup was captured afterward:

`backend/backups/darfus_erp_POST_LOOSE_DIAMOND_MASTER_STATE_20260821T084800Z.dump`

Bytes: `694353`; SHA-256: `00ECF927D5D297DC63A71E3550D097E5C1C88FBDCC41DA932F1BFEDD4A7A0547`.

The required “backup before official apply” ordering cannot be claimed because the official master/schema advance was already observed before this backup capture. This is an explicit gate risk, not hidden.

## 5. Route / Discoverability

Implemented read-only contract and preview routes:

- `GET /api/v1/inventory-v2/loose-diamond/contract`
- `POST /api/v1/inventory-v2/loose-diamond/preview`

Both require authenticated `inventory.view`, use company/branch context, active DB masters, active branch locations, active suppliers, and server barcode settings.

Inventory chooser now exposes:

`Gold By Weight`, `Gold By Piece`, `Diamond Jewellery`, `Loose Diamond`; Gem Stone and Pearl remain disabled. No sidebar entry or second receive workflow was added.

## 6. Loose Diamond Profile Contract

Contract authority is `LOOSE_DIAMOND`; physical unit is one stone/one Asset. Component arrays are rejected. Gold fields are not used. Carat is preserved as `CT`; grams are derived only as `CT × 0.20` for shared reporting/storage compatibility.

## 7. Required / Optional Validation

Required and server-validated: description, Stone Name, Diamond Type, at least one Color, Clarity, Shape, Carat > 0, Purchase Price, Selling Price, Tax Treatment, Supplier, Location, Purchase Date.

Optional: Treatment where allowed by the approved Diamond rule, Tone, Tone Level, Saturation, Cut, Origin, certificate fields, Current Diamond Value, markup/discount metadata, notes.

Stone Cost, when supplied, must equal Purchase Price; it is not a second business authority.

## 8. Stone Name Authority

`DIAMOND_NAME` is DB-backed and versioned. `Diamond` is the initial canonical value. The frontend consumes server-provided IDs/options and does not own the business list.

## 9. Treatment Authority Fix

Loose Diamond treatment now resolves through `DIAMOND_TREATMENT`; it is not resolved through `GEMSTONE_TREATMENT`. Invalid, inactive, or unavailable values fail closed. Gemstone behavior was not changed by this profile implementation.

## 10. Multi-Color Design/Implementation

The UI submits an array of active master IDs, rejects duplicate IDs, and preserves each selected color. The normalized reference schema now permits one reference row per selected master value. The asset detail persistence keeps a readable joined snapshot for the existing component detail column while normalized references remain authoritative.

## 11. Carat Model

Carat is the original physical measure, with max three input decimals. Derived grams are `carat × 0.20`; no gold weight or karat is populated for Loose Diamond. Barcode karat authority is `00`.

## 12. Supplier / Location Authority

Supplier is selected from active company DB suppliers. Location is selected from active locations scoped to the current company and branch. No free-text supplier/location authority is introduced.

## 13. Supplier V2 Mapping

Loose Diamond is normalized through the existing Supplier V2 runtime. The prepared per-piece contract uses one piece, one Asset intent, `inventoryCode=DD`, `itemCode=LOS`, `purchaseCost=unitCost=pre-tax Purchase Price`, and no Product quantity physical authority.

## 14. Purchase Financial Semantics

`purchasePricePreTax` is the canonical acquisition base. Purchase VAT is resolved by the existing Transaction Tax Context. Purchase total is base plus VAT. The runtime persists the pre-tax acquisition cost boundary and keeps VAT in the existing tax/accounting evidence boundary.

## 15. Current Valuation Semantics

Current Diamond Value is optional. When absent, no current valuation row is synthesized from historical purchase data. When present, current base, VAT, and total remain separate from historical purchase values.

## 16. Sales Pricing / Minimum Guard

Selling Price is required. Existing loose-profile pricing authority is reused for the server minimum/discount guard. Direct or markup-derived pricing is server-calculated; a below-minimum Loose Diamond sale is rejected by runtime validation.

## 17. Tax Boundary

Profile preview calculates tax from the pre-tax Purchase Price. Shared Supplier V2 preview consumes the normalized pre-tax piece cost and produces the inclusive PO total. Focused proof with a configured 14% rate: base `1000`, VAT `140`, total `1140`; no second VAT application.

## 18. Accounting Static Mapping

No accounting code was redesigned. The intended canonical mapping remains: acquisition base debit, input VAT debit, AP credit for inclusive total. No journal was created in this batch, so live balance proof remains deferred to owner-authorized receive acceptance.

## 19. Barcode DD/LOS/00

Loose Diamond barcode mapping is fail-closed to inventory code `DD`, item code `LOS`, karat code `00`. The implementation does not use the generic first-compatible fallback for this profile.

## 20. RFID

RFID remains optional and unchanged. No RFID assignment or mutation was performed.

## 21. Idempotency Preparation

The UI prepares and retains one immutable request object and a generated idempotency key for read-only inspection. No request was sent to the final receive endpoint. Exact replay runtime proof is intentionally deferred because no Receive is allowed in this batch.

## 22. AR Browser Proof

`GET http://localhost:3000/ar/inventory/loose-diamond` returned `200`. The in-app browser then displayed `Preparing workspace — Company readiness could not be loaded`, with no authenticated Company context. Profile Preview and Shared Preview could not be completed in AR.

Status: `BLOCKED_AUTHENTICATED_BROWSER_PROOF`.

## 23. EN Browser Proof

No authenticated EN browser session was available. No credentials were entered and no sensitive data was transmitted.

Status: `BLOCKED_AUTHENTICATED_BROWSER_PROOF`.

## 24. Profile Preview

Pure service proof: PASS. Browser proof: NOT PROVEN. The profile service returns `READY` for valid master-backed input and rejects invalid treatment, duplicate colors, Stone Cost mismatch, and invalid measurements.

## 25. Shared Preview

Pure Supplier V2 preview proof: PASS. Browser proof: NOT PROVEN because the authenticated contract could not be loaded.

## 26. Prepared Exact Request

Static/UI builder prepares:

- `items[0].unitCost = purchaseBasePreTax`
- `items[0].purchaseCost = purchaseBasePreTax`
- `inventoryCode = DD`
- `itemCode = LOS`
- `taxIncluded = false`
- `applyVat` from shared server-backed tax treatment
- one retained idempotency key

No final request was submitted.

## 27. Network No-Receive Proof

Read-only API observations:

| Endpoint | Result |
|---|---|
| `/api/v1/health` | 200 |
| `/api/v1/inventory-v2/loose-diamond/contract` | 401 without authenticated context |
| `/api/v1/purchase-orders/receive` | Not called |

Observed final receive calls creating business data: `0`.

## 28. DB No-Business-Mutation Proof

Official `darfus_erp` before/after observed counts:

| Table | Before | After | Delta |
|---|---:|---:|---:|
| purchase_orders | 9 | 9 | 0 |
| purchase_order_items | 9 | 9 | 0 |
| assets | 9 | 9 | 0 |
| asset_origins | 9 | 9 | 0 |
| asset_purchase_cost_revisions | 9 | 9 | 0 |
| asset_current_valuations | 9 | 9 | 0 |
| inventory_asset_movements | 9 | 9 | 0 |
| journal_entries | 12 | 12 | 0 |
| journal_lines | 33 | 33 | 0 |
| cash_transactions | 3 | 3 | 0 |
| idempotency_requests | 12 | 12 | 0 |

Allowed master/schema delta observed: one `DIAMOND_NAME/Diamond` row, migration metadata to version 87, and the normalized multi-color uniqueness constraint. No business transaction delta was observed.

## 29. Focused Tests

`backend/tests/loose-diamond-minimum-safe-implementation.test.cjs`: 6/6 PASS.

Covered: versioned master, preview VAT, CT conversion, multi-color, invalid treatment, duplicate colors, Stone Cost mismatch, Asset-based V2 normalization, component rejection, quantity rejection, no current-value fallback, DD/LOS/00, and shared preview no-double-VAT parity.

## 30. Regression / Typecheck

PASS:

- Unified Inventory UX and Intake regressions: 13 tests.
- Diamond core compliance: 5 tests.
- Inventory authority: 6 tests.
- Master-data bootstrap: 5 tests.
- Tax/location: 4 tests.
- Transaction tax: 10 tests.
- Barcode/status: 4 tests.
- GBW sidebar/final/profile/financial regressions: 22 tests.
- `npm run typecheck`.
- Backend modified-file syntax checks.

No build was run; current Next runtime was preserved per guardrails.

## 31. Existing Unrelated Journal P0

Existing journal imbalance evidence remains outside this Loose Diamond batch. No journal rows were changed and it was not counted as a new Loose Diamond defect.

## 32. Remaining Risks

1. Authenticated AR/EN browser proof is blocked by missing Company context in the available browser session.
2. Live backend contract proof is blocked by 401 without login; no credentials were entered.
3. The official master/schema advance was observed before the fresh backup captured in this batch; the backup is valid and non-empty, but the required pre-apply sequencing cannot be claimed.
4. No receive means Asset persistence, barcode allocation, movement, accounting, payable, and idempotent replay remain unproven at runtime.
5. Worktree drift is broad and pre-existing; no cleanup was performed.

## 33. Gate

`GATE = BLOCKED_AUTHENTICATED_BROWSER_PROOF_AND_PREAPPLY_BACKUP_SEQUENCE`

Implementation static/test status: `PASS`.

Runtime acceptance status: `BLOCKED`.

`LOOSE_DIAMOND_FINAL_USER_WORKFLOW_CLOSED = NO`

`FIRST_LOOSE_DIAMOND_RECEIVE_EXECUTED = NO`

## 34. Final Tokens

```text
CURRENT_CONTROL = DARFUS-LOOSE-DIAMOND-MINIMUM-SAFE-IMPLEMENTATION
LOCAL_MAIN_DB = darfus_erp
CLIENT_AUTHORITY = Diamond (Jewellery  Loose Stone).docx
OWNER_DECISION_ONE_STONE_ONE_ASSET = YES
OWNER_DECISION_MULTI_STONE_LOOSE_ASSET = NO
PURCHASE_PRICE_REQUIRED = YES
STONE_COST_SECOND_INDEPENDENT_FIELD = NO
STONE_COST_CANONICAL_ALIAS = PURCHASE_PRICE_PRE_TAX
CURRENT_VAT_PURCHASE_ACCOUNTING_AUTHORITY = NO
DIAMOND_COLOR_CARDINALITY = MULTI_VALUE
SUPPLIER_AUTHORITY = DB_MASTER
LOCATION_AUTHORITY = BRANCH_SCOPED_DB_MASTER
LOOSE_DIAMOND_ROUTE = PASS_STATIC_BLOCKED_BROWSER
AR_DISCOVERABILITY = BLOCKED_AUTHENTICATED_SESSION
EN_DISCOVERABILITY = BLOCKED_AUTHENTICATED_SESSION
NO_GOLD_FIELDS = PASS
CARAT_MODEL = PASS
DIAMOND_NAME_MASTER = PASS
DIAMOND_NAME_FRESH_DB_PROVISIONING = PASS_DISPOSABLE_CLONE
DIAMOND_TREATMENT_AUTHORITY = PASS
MULTI_COLOR_IMPLEMENTATION = PASS_STATIC_AND_CLONE_SCHEMA
SUPPLIER_V2_UNIT_COST_SEMANTICS = PRE_TAX_ECONOMIC_PURCHASE_BASE
PURCHASE_FINANCIAL_MAPPING = PASS_STATIC
CURRENT_VALUATION_MAPPING = PASS_STATIC_NO_FALLBACK
HISTORICAL_CURRENT_SEPARATION = PASS_STATIC
LOOSE_DIAMOND_SALES_AUTHORITY = PASS_STATIC
MINIMUM_SELLING_PRICE_SERVER_GUARD = PASS_STATIC
BARCODE_INVENTORY_CODE = DD
BARCODE_ITEM_CODE = LOS
BARCODE_KARAT_CODE = 00
FIRST_LOOSE_DIAMOND_RECEIVE_EXECUTED = NO
FINAL_RECEIVE_REQUESTS_CREATING_BUSINESS_DATA = 0
OFFICIAL_BUSINESS_WRITES = 0
OFFICIAL_MASTER_SCHEMA_DELTA = YES_ONE_DIAMOND_NAME_ROW_VERSION_87
OFFICIAL_BACKUP = VALID_NONEMPTY_POST_OBSERVATION
FOCUSED_TESTS = PASS
REGRESSION_TESTS = PASS
TYPECHECK = PASS
MIGRATION_CREATED = YES
MIGRATION_EXECUTED_ON_DISPOSABLE_CLONE = YES
MIGRATION_EXECUTED_ON_OFFICIAL = OBSERVED_VERSION_87
RECEIVE_EXECUTED = NO
MASTER_DATA_MUTATION = ONE_DIAMOND_NAME_ROW_OBSERVED
ONLINE_PRODUCTION_CONTACTED = NO
P0_NEW = 0
P1_NEW = 0
GATE = BLOCKED_AUTHENTICATED_BROWSER_PROOF_AND_PREAPPLY_BACKUP_SEQUENCE
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_OF_GATE_AND_EXPLICIT_AUTHENTICATED_READ_ONLY_BROWSER_RERUN
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. No Loose Diamond Receive, no Diamond next batch, and no automatic follow-up was started.
