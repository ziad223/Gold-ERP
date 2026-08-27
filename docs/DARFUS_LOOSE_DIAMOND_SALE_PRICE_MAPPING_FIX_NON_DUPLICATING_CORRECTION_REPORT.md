# DARFUS ERP — Loose Diamond Sale Price Mapping Fix + Non-Duplicating Existing Asset Correction

Control ID: `DARFUS-LOOSE-DIAMOND-SALE-PRICE-MAPPING-FIX-NON-DUPLICATING-CORRECTION`

## 1. Executive Summary

This control applied and verified the minimum safe Shared V2 sale-price mapping correction. Explicit `sellingPrice` is now resolved before the legacy `item.price` fallback, while the legacy fallback remains available for compatible non-explicit callers.

The already accepted Loose Diamond Asset was **not** corrected because the current source has no canonical, audited Asset selling-price correction service or endpoint. The control explicitly requires stopping in that situation. No Backup was taken because the correction was not authorized to proceed after the path check, and no persistent business data was changed.

## 2. Proven Root Cause

The accepted request carried `sellingPrice=8000.00`, while the receive mapper persisted:

```text
v2Piece.salePrice ?? item.price
```

`v2Piece.salePrice` was absent. Earlier normalization populated `item.price` using the retained compatibility fallback:

```text
Math.round(unitCost * 1.32)
5000 * 1.32 = 6600
```

Therefore the Asset received `price=6600` although the explicit business selling price was `8000`.

Classification: `RECEIVE_MAPPER_ALIAS_MISMATCH` with secondary `LEGACY_FALLBACK_PRECEDENCE_BUG`.

## 3. Shared V2 Price Consumers

The source inspection found three V2 Asset-creation consumers in `backend/src/routes/erp.routes.js`:

| Consumer | Source location | Previous mapping | Corrected mapping | Scope |
|---|---:|---|---|---|
| Supplier Receive | `erp.routes.js:8529` | `v2Piece.salePrice ?? item.price` | centralized resolver | Loose Diamond, Diamond Jewellery, and other V2 receives |
| Manufacturing/Melt output | `erp.routes.js:6277` | `piece.salePrice ?? piece.purchaseCost` | centralized resolver with purchase-cost fallback | transformation outputs |
| CGP conversion | `erp.routes.js:6346` | `piece.salePrice ?? piece.purchaseCost` | centralized resolver with purchase-cost fallback | CGP conversion |

The POS read path remains Asset-based and reads the operational Asset price through its existing pricing resolver. No POS sale was executed.

## 4. Canonical Price Precedence

The proven compatible order is:

```text
piece.sellingPrice
→ piece.salePrice
→ item.sellingPrice
→ item.salePrice
→ item.price
→ caller fallback (transformation-only purchaseCost fallback)
```

Evidence:

- Loose Diamond profile and runtime validation use `sellingPrice` first, with `salePrice` as a compatibility alias.
- Diamond Jewellery profile uses `salePrice` as its established profile field.
- The old receive mapper used normalized `item.price` as the last receive fallback.
- Manufacturing and CGP callers historically used purchase cost only when no explicit sale alias existed; that fallback remains caller-scoped.

`CANONICAL_ASSET_PRICE_PRECEDENCE = PROVEN`

## 5. Legacy 1.32 Fallback Status

`LEGACY_1_32_FALLBACK_STATUS = RETAINED_COMPATIBILITY_FALLBACK`

The `Math.round(unitCost * 1.32)` behavior was not removed globally. It is used only when no explicit sale-price authority is present. For an explicit Loose Diamond `sellingPrice`, the fallback is not used.

## 6. Minimum Safe Mapping Fix

Added:

`backend/src/services/inventory-v2-price-mapping.service.js`

The resolver accepts only proven compatible aliases and gives explicit values precedence over `item.price`. `backend/src/routes/erp.routes.js` now uses it at all three discovered V2 Asset creation sites.

`MINIMUM_SAFE_SALE_PRICE_MAPPING_FIX = PASS`

No purchase cost, VAT, minimum-selling-price policy, current valuation, barcode, accounting, or idempotency logic was changed.

## 7. Files Changed

Intentional changes for this control:

- `backend/src/routes/erp.routes.js` — centralized V2 selling-price resolver wired into the three Asset creation sites.
- `backend/src/services/inventory-v2-price-mapping.service.js` — new narrow precedence helper.
- `backend/tests/loose-diamond-sale-price-mapping-fix.test.cjs` — focused and shared-consumer regression coverage.
- `docs/DARFUS_LOOSE_DIAMOND_SALE_PRICE_MAPPING_FIX_NON_DUPLICATING_CORRECTION_REPORT.md` — this report.

The worktree was already heavily modified before this control. No unrelated files were cleaned, reset, restored, stashed, or deleted.

## 8. Loose Diamond Regression

Focused test:

```text
piece.sellingPrice = 8000
item.price = 6600
resolved Asset.price = 8000
```

Result: `LOOSE_DIAMOND_EXPLICIT_SELLING_PRICE_REGRESSION = PASS`.

The regression also confirms that the resolver itself does not alter purchase cost or valuation inputs.

## 9. Alias Compatibility Regression

Results:

- canonical `sellingPrice` wins: PASS
- legacy `salePrice` remains supported: PASS
- legacy `item.price` remains available without explicit authority: PASS
- explicit value is not overridden by fallback: PASS

`PRICE_ALIAS_COMPATIBILITY_REGRESSION = PASS`

## 10. Diamond Jewellery Regression

The shared resolver preserves the established `salePrice` field used by Diamond Jewellery. Existing Diamond Jewellery corrective tax/valuation tests passed.

`DIAMOND_JEWELLERY_SALE_PRICE_REGRESSION = PASS`

## 11. Other Shared V2 Regression

The three Asset creation sites were asserted to use the centralized resolver. Existing Asset, CGP selling-price/metadata, Supplier profile, and shared inventory tests passed.

`SHARED_V2_PRICE_REGRESSION = PASS`

## 12. Typecheck

Command:

```text
npm run typecheck
```

Result: PASS (`tsc --noEmit`, exit code 0).

## 13. Rollback Mapping Acceptance

The pure mapping proof is covered by the focused test and resolves the intended future Asset price to `8000.00` without a Receive. A DB transaction rollback harness was not executed because the control stopped before any existing-Asset correction path was available; no transaction or business write was needed.

`CORRECTED_MAPPING_ROLLBACK_PROOF = NOT_RUN_BLOCKED_CORRECTION_PATH_MISSING`
`INTENDED_ROLLED_BACK_ASSET_PRICE = 8000.00`
`PERSISTENT_BUSINESS_DELTA = 0`

## 14. DB Pre-Correction Snapshot

Read-only verification was run against the official target:

```text
current_database() = darfus_erp
```

Target Asset:

| Field | Read-only value |
|---|---:|
| Asset ID | `AST-PUR-1787315623826-1-1-z3ig` |
| Barcode | `DDLOS00000001` |
| Profile | `LOOSE_DIAMOND` |
| Asset.price | `6600.00000000` |
| Asset.cost | `5000.00000000` |
| final_purchase_cost | `5000.0000` |
| minimum_selling_price | `8000.00000000` |
| Status | `available` |

`PRE_CORRECTION_ASSET_PRICE = 6600.00`

## 15. Canonical Existing Asset Correction Path

The existing source was inspected before any data correction:

- `PATCH /inventory-v2/assets/:id/metadata` delegates to `asset-metadata.service.js`.
- Its allowlist is only `name`, `description`, `category`, `brand`, `notes`, and `location`.
- `price` is explicitly not in that allowlist.
- `PUT /inventory-v2/assets/:id/current-valuation` updates valuation only and is not a selling-price correction path.
- No existing Asset selling-price update endpoint/service with price-specific audit evidence was found.

`CANONICAL_EXISTING_ASSET_CORRECTION_PATH = CORRECTION_PATH_MISSING`

The prompt requires stopping rather than creating a new correction endpoint, using ad-hoc SQL, or silently widening scope.

## 16. Fresh Pre-Correction Backup

Not executed. The control requires a fresh verified backup immediately before a permitted existing-Asset correction. Since the required canonical audited correction path is missing, the correction was not attempted and no backup was taken for a non-existent correction operation.

`PRE_CORRECTION_BACKUP = NOT_RUN_BLOCKED_CORRECTION_PATH_MISSING`
`BACKUP_PRECEDES_CORRECTION = NOT_APPLICABLE`

## 17. Existing Asset Price Correction

No correction was performed.

```text
EXISTING_ASSET_CORRECTIONS = 0
POST_CORRECTION_ASSET_PRICE = NOT_APPLICABLE (persisted value remains 6600.00000000)
```

No new Receive, PO, Asset, Barcode, Movement, Journal, Payment, RFID assignment, or cleanup occurred.

## 18. Audit Evidence

No sale-price correction audit event was created because no correction was performed. The current architecture has audit support for metadata and other inventory commands, but no existing audited price-correction command was found.

`SALE_PRICE_CORRECTION_AUDITED = NOT_SUPPORTED_BY_EXISTING_PATH / NOT_RUN`

## 19. Post-Correction Asset

Post-correction proof is intentionally not applicable. The official Asset remains the pre-correction state:

```text
price = 6600.00000000
cost = 5000.00000000
minimum_selling_price = 8000.00000000
```

## 20. Pricing Policy Parity

The separate minimum guard remains unchanged and was verified read-only:

```text
SELLING_PRICE = 6600.00000000 (persisted defect; not corrected)
MINIMUM_SELLING_PRICE = 8000.00000000
SELLING_PRICE_MINIMUM_PRICE_SEPARATION = PROVEN_AS_SEPARATE_FIELDS
```

The source fix does not rewrite the minimum policy.

## 21. Purchase/Valuation Immutability

Read-only evidence confirms the target Asset purchase cost and final purchase cost remain `5000.00`. No current valuation or tax data was written. Existing accepted evidence remains preserved:

```text
Purchase cost = 5000.00
Purchase VAT = 700.00
PO total = 5700.00
Current valuation base = 6200.00
Current VAT = 868.00
Current total = 7068.00
```

`PURCHASE_COST_CHANGED = NO`
`CURRENT_VALUATION_CHANGED = NO`
`TAX_SNAPSHOT_CHANGED = NO`

## 22. Accounting Immutability

The accepted purchase journal `JE-1787315623898` remains balanced at `5700.00` debit and `5700.00` credit. No journal or cash write occurred.

`PURCHASE_JOURNAL_CHANGED = NO`
`NEW_JOURNAL_CREATED_FOR_PRICE_CORRECTION = NO`
`CASH_DELTA = 0`

The unrelated historical P0 `JE-1787090870905` remains unchanged at debit `2133.21` and credit `2133.22`.

## 23. No-Duplicate DB Deltas

Official DB read-only counts after the source/test phase:

| Entity | Count |
|---|---:|
| purchase_orders | 10 |
| purchase_order_items | 10 |
| assets | 10 |
| asset_barcode_history | 10 |
| asset_origins | 10 |
| asset_purchase_cost_revisions | 10 |
| asset_current_valuations | 10 |
| inventory_asset_movements | 10 |
| journal_entries | 13 |
| journal_lines | 36 |
| cash_transactions | 3 |
| idempotency_requests | 13 |

`PURCHASE_ORDERS_DELTA = 0`
`PURCHASE_ORDER_ITEMS_DELTA = 0`
`ASSET_COUNT_DELTA = 0`
`BARCODE_DELTA = 0`
`ORIGIN_DELTA = 0`
`PURCHASE_REVISION_DELTA = 0`
`CURRENT_VALUATION_DELTA = 0`
`MOVEMENT_DELTA = 0`
`JOURNAL_DELTA = 0`
`IDEMPOTENCY_DELTA = 0`
`DUPLICATE_BUSINESS_ROWS = 0`

## 24. Barcode/RFID

Read-only target evidence remains:

```text
BARCODE = DDLOS00000001
RFID_DELTA = 0
```

No barcode replacement/reprint or RFID operation was executed.

## 25. AR Asset Details

Not rerun as a post-correction acceptance because the correction path was missing and no corrected persisted value exists. The current persisted operational price remains `6600.00`; therefore the required `8000.00` AR closure proof is not available.

`AR_ASSET_SELLING_PRICE = NOT_CORRECTED (6600.00 persisted)`
`AR_ASSET_DETAILS = BLOCKED_CORRECTION_PATH_MISSING`

## 26. EN Asset Details

Same state as AR. No post-correction browser acceptance was run and no UI/DB value was altered.

`EN_ASSET_SELLING_PRICE = NOT_CORRECTED (6600.00 persisted)`
`EN_ASSET_DETAILS = BLOCKED_CORRECTION_PATH_MISSING`
`AR_EN_PRICE_PARITY = NOT_APPLICABLE_FOR_CORRECTED_STATE`

## 27. POS Read Proof

No sale was executed. Existing source proves POS reads the Asset operational price; the current persisted target value is still `6600.00`. The required post-correction POS proof of `8000.00` cannot pass until a canonical correction path exists.

`POS_ASSET_PRICE_READ = 6600.00 current persisted value`
`POS_SALE_EXECUTED = NO`

## 28. Final Tests

Focused command set:

```text
node --test backend/tests/loose-diamond-sale-price-mapping-fix.test.cjs \
  backend/tests/loose-diamond-minimum-safe-implementation.test.cjs \
  backend/tests/diamond-corrective-tax-valuation-idempotency.test.cjs \
  backend/tests/cgp-asset-pos-selling-price-and-editable-metadata.test.cjs \
  backend/tests/asset-final-closure.test.cjs \
  backend/tests/supplier-all-asset-profiles-acquisition-payable-pricing-fix-01.test.cjs
```

Result: 29 tests passed, 0 failed.

```text
npm run typecheck
```

Result: PASS.

`FINAL_FOCUSED_TESTS = PASS`
`FINAL_SHARED_REGRESSIONS = PASS`
`FINAL_TYPECHECK = PASS`

## 29. Existing Unrelated P0

`JE-1787090870905` remains present and unchanged at debit `2133.21` / credit `2133.22`.

`PRE_EXISTING_P0_CHANGED = NO`

## 30. P0 / P1

| Priority | Issue | State |
|---|---|---|
| P0 | Unauthorized data duplication or financial mutation | None introduced |
| P1 | Existing Loose Diamond Asset selling price is wrong and has no canonical audited correction path | Open; blocks final closure |

`P0_NEW = 0`
`P1_NEW = 0`
`P1_EXISTING_OPEN = 1`

## 31. Gate

The source mapping fix and regressions pass, but the required existing-Asset correction cannot safely proceed because the canonical application-level audited correction path is absent.

```text
GATE = BLOCKED_LOOSE_DIAMOND_EXISTING_ASSET_SAFE_CORRECTION_PATH
LOOSE_DIAMOND_RECEIVE_CONTROL = PASS
LOOSE_DIAMOND_SALE_PRICE_MAPPING = PASS
LOOSE_DIAMOND_EXISTING_ASSET_PRICE_CORRECTION = BLOCKED
LOOSE_DIAMOND_FINAL_USER_WORKFLOW_CLOSED = NO
LOOSE_DIAMOND_MODULE_STATUS = OPEN_ONE_DATA_CORRECTION_ITEM
NEXT_RECOMMENDED_STEP = OWNER REVIEW OF A MINIMUM SAFE AUDITED EXISTING-ASSET PRICE-CORRECTION PATH
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

No new endpoint, SQL patch, migration, Receive, backup, or business-data correction should be started automatically.

## 32. Final Tokens

```text
CURRENT_CONTROL = DARFUS-LOOSE-DIAMOND-SALE-PRICE-MAPPING-FIX-NON-DUPLICATING-CORRECTION
LOCAL_MAIN_DB = darfus_erp
TARGET_ASSET = AST-PUR-1787315623826-1-1-z3ig
TARGET_PO = PO-1787315623819
TARGET_BARCODE = DDLOS00000001
ORIGINAL_USER_SELLING_PRICE = 8000.00
ORIGINAL_MINIMUM_SELLING_PRICE = 8000.00
PRE_CORRECTION_ASSET_PRICE = 6600.00
SHARED_V2_PRICE_CONSUMERS = 3 Asset creation sites: Supplier Receive, Manufacturing/Melt, CGP conversion
CANONICAL_ASSET_PRICE_PRECEDENCE = piece.sellingPrice -> piece.salePrice -> item.sellingPrice -> item.salePrice -> item.price -> caller fallback
LEGACY_1_32_FALLBACK_STATUS = RETAINED_COMPATIBILITY_FALLBACK
MINIMUM_SAFE_SALE_PRICE_MAPPING_FIX = PASS
FILES_CHANGED = erp.routes.js; inventory-v2-price-mapping.service.js; loose-diamond-sale-price-mapping-fix.test.cjs; this report
LOOSE_DIAMOND_EXPLICIT_SELLING_PRICE_REGRESSION = PASS
PRICE_ALIAS_COMPATIBILITY_REGRESSION = PASS
LEGACY_FALLBACK_REGRESSION = PASS
DIAMOND_JEWELLERY_SALE_PRICE_REGRESSION = PASS
SHARED_V2_PRICE_REGRESSION = PASS
FOCUSED_TESTS = PASS
SHARED_REGRESSION_TESTS = PASS
TYPECHECK = PASS
CORRECTED_MAPPING_ROLLBACK_PROOF = NOT_RUN_BLOCKED_CORRECTION_PATH_MISSING
ROLLED_BACK_ASSET_PRICE = 8000.00 intended only; no DB transaction committed
PERSISTENT_BUSINESS_DELTA = 0
CANONICAL_EXISTING_ASSET_CORRECTION_PATH = CORRECTION_PATH_MISSING
PRE_CORRECTION_BACKUP = NOT_RUN_BLOCKED_CORRECTION_PATH_MISSING
PRE_CORRECTION_BACKUP_PATH = NOT_CREATED
PRE_CORRECTION_BACKUP_SHA256 = NOT_CREATED
BACKUP_PRECEDES_CORRECTION = NOT_APPLICABLE
EXISTING_ASSET_CORRECTIONS = 0
POST_CORRECTION_ASSET_PRICE = NOT_APPLICABLE; current persisted 6600.00000000
SALE_PRICE_CORRECTION_AUDITED = NOT_RUN / NO EXISTING PATH
SELLING_PRICE = 6600.00000000 persisted current state
MINIMUM_SELLING_PRICE = 8000.00000000
SELLING_PRICE_MINIMUM_PRICE_SEPARATION = PASS
PURCHASE_COST_CHANGED = NO
CURRENT_VALUATION_CHANGED = NO
TAX_SNAPSHOT_CHANGED = NO
PURCHASE_JOURNAL_CHANGED = NO
NEW_JOURNAL_CREATED_FOR_PRICE_CORRECTION = NO
CASH_DELTA = 0
PURCHASE_ORDERS_DELTA = 0
PURCHASE_ORDER_ITEMS_DELTA = 0
ASSET_COUNT_DELTA = 0
BARCODE_DELTA = 0
ORIGIN_DELTA = 0
PURCHASE_REVISION_DELTA = 0
CURRENT_VALUATION_DELTA = 0
MOVEMENT_DELTA = 0
JOURNAL_DELTA = 0
IDEMPOTENCY_DELTA = 0
DUPLICATE_BUSINESS_ROWS = 0
RFID_DELTA = 0
AR_ASSET_SELLING_PRICE = NOT_CORRECTED (6600.00)
EN_ASSET_SELLING_PRICE = NOT_CORRECTED (6600.00)
AR_EN_PRICE_PARITY = NOT_APPLICABLE_FOR_CORRECTED_STATE
POS_ASSET_PRICE_READ = 6600.00 current persisted value
POS_SALE_EXECUTED = NO
FINAL_FOCUSED_TESTS = PASS
FINAL_SHARED_REGRESSIONS = PASS
FINAL_TYPECHECK = PASS
PRE_EXISTING_UNRELATED_FINANCIAL_P0 = PRESENT_JE_1787090870905
PRE_EXISTING_P0_CHANGED = NO
NEW_RECEIVE_EXECUTED = NO
SUCCESSFUL_NEW_RECEIVE_COUNT = 0
ONLINE_PRODUCTION_CONTACTED = NO
P0_NEW = 0
P1_NEW = 0
GATE = BLOCKED_LOOSE_DIAMOND_EXISTING_ASSET_SAFE_CORRECTION_PATH
LOOSE_DIAMOND_FINAL_USER_WORKFLOW_CLOSED = NO
LOOSE_DIAMOND_MODULE_STATUS = OPEN_ONE_DATA_CORRECTION_ITEM
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 33. Stop

The source mapping correction and regression proof are complete. Existing business data remains unchanged. Execution stops here pending explicit Owner review of the missing canonical audited Asset-price correction path.

`NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`
