# DARFUS ERP — Audited Asset Selling Price Management + Existing Loose Diamond Correction

Control ID: `DARFUS-ASSET-SELLING-PRICE-MANAGEMENT-AND-LOOSE-DIAMOND-CORRECTION`

تم تنفيذ أمر تصحيح واحد فقط للأصل المحدد، بعد إثبات rollback والنسخة الاحتياطية. لم يتم تنفيذ Receive أو Sale أو Payment أو RFID أو SQL business patch. النتيجة النهائية: إدارة سعر البيع أصبحت مسارًا مخصصًا ومصرحًا ومدققًا، وتم تصحيح سعر الأصل إلى 8000، مع بقاء التكلفة والتقييم والضريبة والقيد والهوية كما هي. لا يوجد خطر كتابة غير مصرح بها على بقية سجلات الأعمال.

## 1. Executive Summary

- Existing Asset `AST-PUR-1787315623826-1-1-z3ig` was corrected once: `6600.00 → 8000.00`.
- The command is `PATCH /api/v1/inventory-v2/assets/:id/selling-price` and reuses the existing `inventory.adjust` permission.
- Validation, minimum-price policy, reason, transaction, audit, branch/company scope, and idempotency are server-side.
- POS initially exposed the Asset but returned a zero operational price because it attempted Gold-rate resolution for Loose Diamond. The minimum safe fix restricts Gold-rate resolution to gold profiles; POS now returns Asset price `8000.00`.
- Final focused/shared tests: `35/35` pass. Typecheck and production frontend build pass.
- Official database business delta: only the authorized Asset price field, one price-edit audit row, and one price-edit idempotency row. No Receive or financial side effects.

## 2. Owner Product Decision

Authorized Manager/Admin users may edit operational Selling Price. Cashier/basic users may not. Selling Price is separate from purchase cost, current valuation, tax, accounting, barcode, and Asset identity.

This control did not create a new receive, PO, Asset, Barcode, Journal, Payment, RFID assignment, migration, seed, or production contact.

## 3. Lessons Learned Applied

- The actual Asset model, pricing policy, idempotency, permission, audit, and POS contracts were traced before the live correction.
- No business value, VAT rate, company, branch, or minimum price was hardcoded.
- Explicit `sellingPrice` remains higher priority than legacy receive fallbacks.
- Shared POS pricing was regression-tested after the source correction.
- Rollback was proven before the live correction.
- No direct SQL business update was used for the correction.
- The stale frontend runtime was detected by browser evidence; the existing `next start` process was rebuilt/restarted, with no Next dev process and no `next-env.d.ts` edit.

## 4. Existing Permission Model

`inventory.adjust` already exists and is assigned to the current `admin`, `manager`, and `owner` role definitions. It is not assigned to `sales`. No new permission or migration was needed.

Evidence: `backend/src/bootstrap/permission-baseline-v1.js`, `backend/src/middleware/business-permission.middleware.js`, and read-only DB role/permission query.

## 5. Final Selling-Price Permission

`SELLING_PRICE_EDIT_PERMISSION = inventory.adjust`

The route uses `requireBusinessPermission("inventory.adjust", { touch: true, operation: "inventory_v2.asset_selling_price_update" })`. A synthetic legacy `sales` user passed to the live middleware was rejected; no transaction was opened and no DB row was changed.

## 6. Backend Command Contract

**Route:** `PATCH /api/v1/inventory-v2/assets/:id/selling-price`

**Request body:**

```json
{
  "newSellingPrice": "8000.00",
  "reason": "Verified loose-diamond selling-price correction",
  "expectedUpdatedAt": "2026-08-21T12:33:43.838Z"
}
```

Company and branch are derived from authenticated context and the locked Asset. The successful live response was HTTP 200 for the exact target Asset.

Implementation: `backend/src/routes/erp.routes.js:5419`, `backend/src/services/asset-selling-price.service.js:53`.

## 7. Server Validation

The command verifies Asset existence, active operational state, company/branch scope, positive finite decimal price, four-decimal precision, optimistic version where supplied, and valid idempotency state. Immutable operational states fail closed.

## 8. Minimum Price Guard

The service reads `asset_pricing_policies.minimum_selling_price` inside the transaction with row locking. `7900` against a minimum of `8000` failed closed. The live correction used exactly the policy minimum `8000.0000`.

## 9. Reason Requirement

Blank reason failed closed. The committed audit reason was `Verified loose-diamond selling-price correction`.

## 10. Transaction Design

The route starts one Sequelize transaction, locks the scoped Asset and pricing policy, validates, updates only `Asset.price`/`updatedBy`, records the audit event, completes the idempotency result, and commits. Any error rolls back. The forced rollback proof staged the price and audit then restored the original state.

## 11. Audit Contract

One audit row was created:

- action: `inventory_v2.asset_selling_price_changed`
- Asset: `AST-PUR-1787315623826-1-1-z3ig`
- old price: `6600.0000`
- new price: `8000.0000`
- reason: present
- actor: authenticated admin user
- company: `COMP-48ab554f-427e-4642-9419-bc8616c2dc36`
- branch: `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c`
- timestamp: `2026-08-21 13:23:26.328+00`

## 12. Accounting No-Side-Effect Rule

The price command does not call purchase posting, valuation, tax, payable, movement, cash, or journal services. Final counts confirm no new financial or inventory business rows.

## 13. AR UI

The Asset details page now exposes `إدارة سعر البيع` with current price, minimum price, historical purchase cost, new-price input, required reason, and permission-gated action `تعديل سعر البيع`. Browser proof after the production build confirmed the section, values, and action in Arabic.

## 14. EN UI

The same page exposes `Selling Price Management`, `Current Selling Price`, `Minimum Selling Price`, `Historical Purchase Cost`, `New Selling Price`, `Reason`, and `Edit Selling Price`. Browser proof confirmed the same values in English.

## 15. Focused Tests

Command:

```text
node --test backend/tests/asset-selling-price-management.test.cjs backend/tests/loose-diamond-sale-price-mapping-fix.test.cjs backend/tests/loose-diamond-minimum-safe-implementation.test.cjs backend/tests/diamond-corrective-tax-valuation-idempotency.test.cjs backend/tests/cgp-asset-pos-selling-price-and-editable-metadata.test.cjs backend/tests/asset-final-closure.test.cjs backend/tests/supplier-all-asset-profiles-acquisition-payable-pricing-fix-01.test.cjs
```

Result: `35` tests, `35` pass, `0` fail.

Coverage includes authorized service change, minimum/reason/decimal/state guards, route contract, UI contract, explicit Loose Diamond selling-price authority, POS Asset-only projection, and shared receive/sale regressions.

## 16. Shared Price Regression

PASS. The explicit receive mapping tests remain green. POS now resolves Loose Diamond from the stored Asset selling price when no markup is configured. Gold profiles still use the canonical Gold-rate path.

Source correction:

- `backend/src/services/gold-sale-pricing.service.js:482` uses `asset.price` as the Loose-profile direct-price fallback.
- `backend/src/routes/erp.routes.js:7720` resolves Gold rate only when `isGoldSaleProfile(profile)` is true.

## 17. Typecheck

`npm run typecheck` — PASS (`tsc --noEmit`). JavaScript syntax checks for the changed backend files — PASS.

## 18. Runtime Source Parity

- Backend: the running container is the existing `jewellery-erp-master-backend-run-fe01a1c1d6ce`, bind-mounted to the workspace. It was restarted once after the backend source correction; logs show PostgreSQL/Redis connection and `Listening on Port: http://localhost:8000`.
- Frontend: the existing `localhost:3000` `next start` process was identified as stale, stopped, rebuilt with `npm run build` (`BUILD_EXIT=0`), and restarted on the same port. No second frontend was created.
- `next-env.d.ts` was not edited; it still references `./.next/types/routes.d.ts`.

## 19. Exact Target Rollback Acceptance

PASS. In a forced rollback transaction:

- database resolved to `darfus_erp`
- staged price was `8000`
- audit was staged
- rollback restored price `6600`
- correction audit count before/after was unchanged
- persistent business delta was zero

## 20. DB Baseline

Before correction, read-only baseline was:

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
| audit_logs | 64 |

Target baseline: price `6600`, minimum `8000`, purchase cost `5000`, current valuation `6200`, barcode `DDLOS00000001`, status `AVAILABLE`.

## 21. Fresh Backup

PASS. Backup was created before the live correction:

- path: `I:\WORK\jewellery-erp-master\backend\backups\darfus_erp_PRE_ASSET_SELLING_PRICE_CORRECTION_20260821T132240Z.dump`
- bytes: `1,295,484`
- SHA256: `084008B0A16EFF8CB68A13064829CC0AF25B183A4F88710EAB3C5B79BEEB757A`
- `pg_restore -l`: PASS, 1175 TOC entries
- backup timestamp: `2026-08-21 13:22:40 UTC`
- correction timestamp: `2026-08-21 13:23:26 UTC`

The earlier zero-byte backup attempt was rejected and not used as the safety gate.

## 22. Live Existing-Asset Correction

Exactly one committed live price correction was sent through the canonical application route. It returned HTTP 200 and targeted only `AST-PUR-1787315623826-1-1-z3ig`. No Receive endpoint was called.

## 23. Post-Correction Asset

| Field | Final value |
|---|---|
| Asset | `AST-PUR-1787315623826-1-1-z3ig` |
| Selling price | `8000.00000000` |
| Minimum selling price | `8000.00000000` |
| Purchase cost | `5000.00000000` |
| Final purchase cost | `5000.0000` |
| Barcode | `DDLOS00000001` unchanged |
| Operational status | `AVAILABLE` unchanged |
| Asset status | `available` unchanged |

## 24. Audit Evidence

Exactly one correction audit exists for the target action and Asset. Its old/new values, reason, actor, company, branch, and timestamp match the committed command. No duplicate correction audit was created by replay or conflict probing.

## 25. No-Duplicate DB Deltas

| Entity | Baseline | Final | Delta |
|---|---:|---:|---:|
| purchase_orders | 10 | 10 | 0 |
| purchase_order_items | 10 | 10 | 0 |
| assets | 10 | 10 | 0 |
| asset_barcode_history | 10 | 10 | 0 |
| asset_origins | 10 | 10 | 0 |
| asset_purchase_cost_revisions | 10 | 10 | 0 |
| asset_current_valuations | 10 | 10 | 0 |
| inventory_asset_movements | 10 | 10 | 0 |
| journal_entries | 13 | 13 | 0 |
| journal_lines | 36 | 36 | 0 |
| cash_transactions | 3 | 3 | 0 |
| idempotency_requests | 13 | 14 | +1 price-edit command row only |
| audit_logs | 64 | 65 | +1 authorized price audit |

`NEW_RECEIVE_EXECUTED = NO`. The idempotency replay returned 200 without a new business row; the changed payload with the same key returned 409. No receive idempotency row was added.

## 26. Purchase/Valuation/Accounting Immutability

PASS.

- PO `PO-1787315623819`: tax base `5000`, VAT `700`, total `5700`, `STANDARD_VAT`, unchanged.
- Purchase cost revision: VAT base `5000`, VAT `700`, total purchase cost `5000`, unchanged.
- Current valuation: component value `6200`, VAT `868`, total `7068`, version `1`, unchanged.
- Journal `JE-1787315623898`: debit `5700`, credit `5700`, posted, unchanged.
- Journal lines remain Inventory debit `5000`, Input VAT debit `700`, Supplier Payable credit `5700`.
- Cash delta: `0`.
- No new journal, payable, movement, tax snapshot, barcode, origin, or valuation row.

## 27. AR Proof

PASS. Real browser route `/ar/inventory/AST-PUR-1787315623826-1-1-z3ig` showed:

- Selling Price `8000`
- Minimum Selling Price `8000`
- Historical Purchase Cost `5000`
- Current Valuation Total `7068` (the required current valuation component remains `6200` in DB)
- authorized `تعديل سعر البيع` action

## 28. EN Proof

PASS. Real browser route `/en/inventory/AST-PUR-1787315623826-1-1-z3ig` showed the same values and `Edit Selling Price`. AR/EN price parity is PASS.

## 29. POS Read Proof

PASS. Read-only `GET /api/v1/pos/search?query=DDLOS00000001` returned:

- `id = AST-PUR-1787315623826-1-1-z3ig`
- `isProduct = false`
- `profile = LOOSE_DIAMOND`
- `price = 8000`
- `available = 1`
- `unavailable = false`
- correct branch `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c`

No POS sale was executed.

## 30. Existing Unrelated P0

`JE-1787090870905` was not changed. It remains the pre-existing imbalance (`2133.21` debit vs `2133.22` credit) and is explicitly deferred from this control.

## 31. P0/P1

- New P0: `0`
- New P1: `0`
- Pre-existing P0: `JE-1787090870905`, preserved and not caused by this control.

## 32. Gate

All control criteria passed, including actual command proof, permission guard, fail-closed validation, rollback, backup, one live correction, AR/EN runtime proof, POS price proof, idempotency replay/conflict, and no financial side effects.

`GATE = PASS_ASSET_SELLING_PRICE_MANAGEMENT_AND_LOOSE_DIAMOND_FINAL_CLOSURE`

`ASSET_SELLING_PRICE_MANAGEMENT = CLOSED_ACCEPTED`

`LOOSE_DIAMOND_RECEIVE_CONTROL = PASS`

`LOOSE_DIAMOND_SALE_PRICE_MAPPING = PASS`

`LOOSE_DIAMOND_EXISTING_ASSET_PRICE_CORRECTION = PASS`

`LOOSE_DIAMOND_FINAL_USER_WORKFLOW_CLOSED = YES`

`LOOSE_DIAMOND_MODULE_STATUS = CLOSED`

## 33. Final Tokens

```text
CURRENT_CONTROL = DARFUS-ASSET-SELLING-PRICE-MANAGEMENT-AND-LOOSE-DIAMOND-CORRECTION
LOCAL_MAIN_DB = darfus_erp
TARGET_ASSET = AST-PUR-1787315623826-1-1-z3ig
OLD_SELLING_PRICE = 6600.00
CORRECT_SELLING_PRICE = 8000.00
MINIMUM_SELLING_PRICE = 8000.00
ACTUAL_PRICE_UPDATE_CONTRACT = PATCH /api/v1/inventory-v2/assets/:id/selling-price; body newSellingPrice + reason + expectedUpdatedAt; auth company/branch context
EXISTING_RELEVANT_PERMISSION = inventory.adjust
SELLING_PRICE_EDIT_PERMISSION = inventory.adjust
CANONICAL_SELLING_PRICE_UPDATE_ROUTE = PATCH /api/v1/inventory-v2/assets/:id/selling-price
UNAUTHORIZED_USER_SERVER_REJECT = PASS
AUTHORIZED_USER_SERVER_ACCEPT = PASS
BELOW_MINIMUM_PRICE_FAILS_CLOSED = PASS
PRICE_CHANGE_REASON_REQUIRED = PASS
SELLING_PRICE_UPDATE_TRANSACTIONAL = PASS
SALE_PRICE_CHANGE_AUDIT = PASS
AR_SELLING_PRICE_UI = PASS
EN_SELLING_PRICE_UI = PASS
SHARED_PRICE_REGRESSION = PASS
TYPECHECK = PASS
BACKEND_RUNTIME_PARITY = PASS
FRONTEND_RUNTIME_PARITY = PASS
EXACT_TARGET_ROLLBACK_ACCEPTANCE = PASS
ROLLBACK_TARGET_PRICE = 8000.00
ROLLBACK_AUDIT_STAGED = YES
PERSISTENT_BUSINESS_DELTA = Asset.price only before audit commit; no unauthorized business delta
PRE_CORRECTION_BACKUP = PASS
PRE_CORRECTION_BACKUP_PATH = backend/backups/darfus_erp_PRE_ASSET_SELLING_PRICE_CORRECTION_20260821T132240Z.dump
PRE_CORRECTION_BACKUP_SHA256 = 084008B0A16EFF8CB68A13064829CC0AF25B183A4F88710EAB3C5B79BEEB757A
BACKUP_PRECEDES_CORRECTION = YES
LIVE_PRICE_CORRECTIONS = 1
POST_CORRECTION_ASSET_PRICE = 8000.00
LIVE_PRICE_CORRECTION_AUDIT = PASS
NEW_RECEIVE_EXECUTED = NO
PURCHASE_ORDERS_DELTA = 0
PURCHASE_ORDER_ITEMS_DELTA = 0
ASSET_COUNT_DELTA = 0
BARCODE_DELTA = 0
ORIGIN_DELTA = 0
PURCHASE_REVISION_DELTA = 0
CURRENT_VALUATION_DELTA = 0
MOVEMENT_DELTA = 0
JOURNAL_DELTA = 0
CASH_DELTA = 0
IDEMPOTENCY_DELTA = +1 price-edit command only; receive delta 0
AUDIT_DELTA = +1
DUPLICATE_BUSINESS_ROWS = 0
PRICE_EDIT_FINANCIAL_SIDE_EFFECTS = 0
AR_ASSET_SELLING_PRICE = 8000.00
EN_ASSET_SELLING_PRICE = 8000.00
AR_EN_PRICE_PARITY = PASS
POS_ASSET_PRICE_READ = 8000.00
POS_SALE_EXECUTED = NO
PURCHASE_COST_CHANGED = NO
CURRENT_VALUATION_CHANGED = NO
TAX_CHANGED = NO
PURCHASE_JOURNAL_CHANGED = NO
NEW_JOURNAL_CREATED = NO
PRE_EXISTING_UNRELATED_FINANCIAL_P0 = PRESENT_JE_1787090870905
PRE_EXISTING_P0_CHANGED = NO
FINAL_FOCUSED_TESTS = PASS (35/35)
FINAL_SHARED_PRICE_REGRESSION = PASS
FINAL_TYPECHECK = PASS
HARDCODED_BUSINESS_VALUES = NO
ONLINE_PRODUCTION_CONTACTED = NO
P0_NEW = 0
P1_NEW = 0
GATE = PASS_ASSET_SELLING_PRICE_MANAGEMENT_AND_LOOSE_DIAMOND_FINAL_CLOSURE
ASSET_SELLING_PRICE_MANAGEMENT = CLOSED_ACCEPTED
LOOSE_DIAMOND_FINAL_USER_WORKFLOW_CLOSED = YES
LOOSE_DIAMOND_MODULE_STATUS = CLOSED
NEXT_RECOMMENDED_STEP = GEM_STONE_JEWELLERY_PREIMPLEMENTATION_AUTHORITY_AUDIT
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

### Intentional files for this control

- `backend/src/services/asset-selling-price.service.js`
- `backend/src/routes/erp.routes.js`
- `backend/src/services/gold-sale-pricing.service.js`
- `app/[locale]/(dashboard)/inventory/[id]/page.tsx`
- `backend/tests/asset-selling-price-management.test.cjs`
- `backend/tests/cgp-asset-pos-selling-price-and-editable-metadata.test.cjs`
- this report

The worktree contained broad pre-existing changes and untracked historical artifacts. They were not cleaned, reset, staged, or claimed as part of this control. The earlier shared receive price-mapping files remain prior approved work and were regression-tested, not broadened here.

## Stop

`STOP`

`NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`
