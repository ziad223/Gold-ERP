# DARFUS ERP — Loose Diamond Sale Price Mapping Read-Only Forensic

Control ID: `DARFUS-LOOSE-DIAMOND-SALE-PRICE-MAPPING-READONLY-FORENSIC`

## 1. Executive Summary

تم تنفيذ فحص مصدر وقاعدة بيانات قراءة فقط. لم يتم تعديل الكود أو قاعدة البيانات، ولم يتم تنفيذ Receive أو Replay أو Payment أو RFID أو Cleanup.

السبب مثبت: الواجهة ترسل `sellingPrice=8000.00000000`، وملف Loose Diamond/Inventory V2 يتعامل مع `sellingPrice` كحقل السعر البيعي المقبول، لكن مسار `POST /api/v1/purchase-orders/receive` عند إنشاء Asset يقرأ `v2Piece.salePrice ?? item.price`. وبما أن `salePrice` غير موجود و`item.price` غير موجود في الطلب، يكون `item.price` قد أُنشئ قبلاً كـ`round(unitCost * 1.32)`. مع `unitCost=5000` ينتج `6600`.

الـAsset المحفوظ لذلك الاستلام هو `AST-PUR-1787315623826-1-1-z3ig` وسعره `6600.00000000`. أما `minimum_selling_price=8000.00000000` فمحفوظ منفصلًا في `asset_pricing_policies`، ولا يوجد حقل `assets.sale_price` أو `assets.selling_price`.

`GATE = PASS_LOOSE_DIAMOND_SALE_PRICE_MAPPING_READONLY_FORENSIC`.

## 2. Current Accepted Loose Diamond Receive

تمت قراءة الأدلة الموجودة من الـReceive المقبول سابقًا فقط:

| Evidence | Value |
|---|---|
| PO | `PO-1787315623819` |
| Asset | `AST-PUR-1787315623826-1-1-z3ig` |
| Barcode | `DDLOS00000001` |
| Profile | `LOOSE_DIAMOND` |
| Original prepared selling price | `8000.00000000` |
| Original prepared minimum selling price | `8000.00000000` |
| Persisted `assets.price` | `6600.00000000` |
| Persisted Asset cost | `5000.00000000` |

لا توجد معاملة جديدة مطلوبة أو مسموحة لهذا الفحص.

## 3. Read-Only DB Safety

تم إثبات:

```text
SELECT current_database() = darfus_erp
```

العدادات قُرئت في بداية الفحص ونهايته، ولم تتغير:

| Entity | Start | End | Delta |
|---|---:|---:|---:|
| purchase_orders | 10 | 10 | 0 |
| purchase_order_items | 10 | 10 | 0 |
| assets | 10 | 10 | 0 |
| asset_components | 7 | 7 | 0 |
| asset_diamond_component_details | 7 | 7 | 0 |
| asset_barcode_history | 10 | 10 | 0 |
| asset_origins | 10 | 10 | 0 |
| asset_purchase_cost_revisions | 10 | 10 | 0 |
| asset_current_valuations | 10 | 10 | 0 |
| inventory_asset_movements | 10 | 10 | 0 |
| journal_entries | 13 | 13 | 0 |
| journal_lines | 36 | 36 | 0 |
| cash_transactions | 3 | 3 | 0 |
| idempotency_requests | 13 | 13 | 0 |
| audit_logs | 64 | 64 | 0 |

`DB_MUTATION = NO`.

## 4. Persisted Price Evidence

تم فحص الأعمدة الموجودة فعليًا، بدون افتراض أعمدة غير موجودة:

| Source | Actual persisted fields |
|---|---|
| `assets` | `price=6600.00000000`, `cost=5000.00000000`, `final_purchase_cost=5000.0000` |
| `assets` sale aliases | لا توجد أعمدة `sale_price` أو `selling_price` |
| `purchase_order_items` | `unit_price=5000.00000000`, `total=5000.00000000`; لا يوجد sale-price field |
| `asset_pricing_policies` | `minimum_selling_price=8000.00000000`, `markup_percent=NULL`, `maximum_discount_percent=NULL`, `manual_price_allowed=false` |
| `asset_current_valuations` | `component_value=6200`, `total_value=7068`; ليست selling-price storage |
| `asset_components` | diamond component has cost/current component fields only; no selling-price field |

`PERSISTED_ASSET_PRICE = 6600.00000000`.
`PERSISTED_SELLING_PRICE_FIELDS = assets.price only, operationally; no assets.sale_price or assets.selling_price; no PO-item selling-price field`.
`PERSISTED_MINIMUM_SELLING_PRICE = 8000.00000000 in asset_pricing_policies.minimum_selling_price`.

## 5. Original Request Price Evidence

تمت قراءة الـrequest evidence المحتفظ به في التقرير السابق، بدون إعادة إرسال أو إعادة بناء POST:

```text
sellingPrice = 8000.00000000
minimumSellingPrice = 8000.00000000
purchasePricePreTax = 5000.00000000
currentDiamondValuePreTax = 6200.00000000
markupPercent = null
maximumDiscountPercent = null
```

الـaliases في الطلب:

| Alias | Original request |
|---|---|
| `sellingPrice` | `8000.00000000` |
| `salePrice` | absent |
| `price` | absent at the final V2 piece/item payload |
| `retailPrice` | absent |
| `unitPrice` | absent as sale-price authority; `unitCost` is purchase-cost authority |
| `minimumSellingPrice` | `8000.00000000` in `pricing` |
| `markupPercent` | null |
| `maximumDiscountPercent` | null |

`ORIGINAL_REQUEST_SELLING_PRICE = 8000.00`.

## 6. Frontend Price Mapping

Source: `app/[locale]/(dashboard)/inventory/loose-diamond/page.tsx`.

| Stage | Actual mapping | Source |
|---|---|---|
| Form state | `form.sellingPrice` | `page.tsx:22` |
| Profile request | `looseDetails.sellingPrice` and top-level `sellingPrice` | `page.tsx:97-98` |
| Final piece | `sellingPrice: preview.sale.finalSalePrice` | `page.tsx:130` |
| Final pricing policy payload | `pricing.sellingPrice` and `pricing.minimumSellingPrice` | `page.tsx:130` |
| Final prepared request | `items[0].sellingPrice` and `items[0].perPiece[0].sellingPrice` | retained accepted request |
| `price` / `salePrice` aliases | not emitted as final V2 sale-price fields | source + request evidence |

`FRONTEND_FORM_FIELD = form.sellingPrice`.
`FRONTEND_PREPARED_FIELD = items[0].sellingPrice and items[0].perPiece[0].sellingPrice; pricing.sellingPrice`.
`FRONTEND_PREPARED_VALUE = 8000.00000000`.

## 7. Profile Preview Price Contract

Source: `backend/src/services/loose-diamond-profile.service.js`.

- `normalizePiece()` accepts canonical `input.sellingPrice` first, then the compatibility alias `input.salePrice`, then detail aliases (`loose-diamond-profile.service.js:109`).
- The normalized profile stores `piece.sellingPrice` (`:141`).
- Preview calls `calculateLooseProfileSalePrice()` with `sellingPrice: piece.sellingPrice` (`:175-180`).
- Preview exposes `sale.finalSalePrice`, `sale.minimumAllowedSellingPrice`, expected profit, and margin (`:202-209`).

The current profile contract therefore proves:

`PROFILE_CANONICAL_SELLING_PRICE_FIELD = piece.sellingPrice`.
`PROFILE_MINIMUM_PRICE_FIELD = sale.minimumAllowedSellingPrice / pricing.minimumSellingPrice`.

`sellingPrice` is the direct user-entered price; minimum price is a separate guard/derived policy value.

## 8. Shared Receive Normalization

The canonical route is `POST /api/v1/purchase-orders/receive` in `backend/src/routes/erp.routes.js`.

The exact relevant flow is:

```text
final prepared item
→ route normalizedItems
→ item.price = Number(item.price) || Math.round(unitCost * 1.32)       [erp.routes.js:7979]
→ inventoryV2Runtime.requireV2ReceiptPieces(normalizedItems)           [erp.routes.js:8148]
→ normalizeReceiptPiece(piece)                                        [inventory-v2-runtime.service.js:138]
→ loose-diamond sale validation uses piece.sellingPrice               [inventory-v2-runtime.service.js:232-242]
→ item.v2Pieces = pieces                                              [erp.routes.js:8209]
→ Asset.create({ price: v2Piece?.salePrice ?? item.price })            [erp.routes.js:8528]
```

`normalizeReceiptPiece()` does not rename `sellingPrice` to `salePrice`; it preserves the original field through `...piece` and uses `piece.sellingPrice` for validation. The final Asset mapper reads a different alias.

`RECEIVE_MAPPER_PRICE_READ_ORDER = v2Piece.salePrice ?? item.price; item.price is pre-populated as Number(item.price) || Math.round(unitCost * 1.32)`.

## 9. Asset Creation Price Mapping

The Asset creation object in the shared V2 Supplier Receive route contains:

```js
price: v2Piece?.salePrice ?? item.price,
cost: effectiveCost,
```

at `backend/src/routes/erp.routes.js:8528-8530`.

For the accepted Loose Diamond request:

```text
v2Piece.sellingPrice = 8000
v2Piece.salePrice = absent
item.price = 5000 * 1.32 = 6600
Asset.price = 6600
```

The mapper does not read `v2Piece.sellingPrice` at the point where `Asset.price` is populated.

## 10. Exact Origin of 6600

The origin is proven, not inferred:

| Token | Proven value |
|---|---|
| `PERSISTED_6600_SOURCE` | legacy `item.price` fallback derived from purchase `unitCost` |
| `PERSISTED_6600_SOURCE_FILE` | `backend/src/routes/erp.routes.js` |
| `PERSISTED_6600_SOURCE_FUNCTION` | canonical Supplier Receive route handler (`router.post(["/purchase-orders/receive", ...])`) |
| `PERSISTED_6600_SOURCE_LINE` | normalization `:7979`; Asset mapping `:8528` |
| `PERSISTED_6600_FORMULA` | `Math.round(5000 * 1.32) = 6600` |
| hardcoded 6600 | NO |
| current valuation source | NO |
| minimum price source | NO |
| payment/accounting source | NO |

This is a legacy fallback precedence/alias defect, not a tax or valuation calculation.

## 11. Asset.price Semantic Authority

Schema evidence:

- `backend/src/models/asset.model.js:46-49` defines only generic `price` as a required decimal.
- Initial schema `backend/migrations/20260616000000-init-db.js:127` creates generic `assets.price`; it does not define `sale_price` or `selling_price` on `assets`.
- POS search returns Asset price as its sellable price fallback (`erp.routes.js:7752-7772`).
- Sale, return, and exchange paths use `asset.price` as the effective unit sale price (`erp.routes.js:928-934`, `:1976-1977`, `:2335-2337`).

Therefore the physical column has a legacy generic name, but its proven operational meaning is:

`ASSET_PRICE_SEMANTIC = SELLING_PRICE`.

It is not purchase cost and not current valuation. The current `6600` is the wrong value placed into that selling-price authority.

## 12. Shared Mapping / Diamond Jewellery Risk

`SHARED_PRICE_MAPPING_USED = YES`.

Loose Diamond and Diamond Jewellery both use the shared V2 Asset creation branch in `erp.routes.js` and the same `v2Piece.salePrice ?? item.price` mapping. Loose Diamond has profile-specific validation in `normalizeReceiptPiece`; Diamond Jewellery has its own profile normalization before the shared Asset mapper.

`DIAMOND_JEWELLERY_REGRESSION_RISK = MEDIUM`.

Reason: a broad alias correction in the shared mapper could affect Diamond Jewellery and other V2 profiles. Any future fix must be profile-scoped or proven across all shared consumers. No such fix was made here.

## 13. Canonical Selling Price Persistence Target

Based on the business authority and current architecture:

`CANONICAL_SELLING_PRICE_PERSISTENCE_TARGET = assets.price for the operational sellable Asset price, plus asset_pricing_policies.minimum_selling_price for the separate minimum guard snapshot`.

The current schema has no dedicated `assets.selling_price` column and no PO-item selling-price column. The pricing policy row is a guard/policy snapshot, not a replacement for the user-entered selling price.

`CANONICAL_USER_ENTERED_SELLING_PRICE = 8000.00`.

## 14. Selling Price vs Minimum Selling Price

The distinction is proven:

- Profile `sellingPrice` is used to calculate `finalSalePrice`.
- The profile returns a separate `minimumAllowedSellingPrice`.
- Receive evidence persists `asset_pricing_policies.minimum_selling_price=8000`.
- `markup_percent` and `maximum_discount_percent` are NULL for this row.
- `manual_price_allowed=false`.

The minimum guard must not overwrite the user-entered sale price. The current issue is the opposite: the guard is preserved, but `assets.price` receives the legacy fallback.

`SELLING_PRICE_AND_MINIMUM_PRICE_ARE_SEPARATE = YES`.

## 15. Root Cause

The profile/business contract uses `sellingPrice`. The shared receive mapper persists `v2Piece.salePrice ?? item.price` and never maps `v2Piece.sellingPrice` into the Asset `price` field. Since `item.price` was absent in the final request, the earlier normalization fallback computed `5000 × 1.32 = 6600`.

## 16. Root Cause Classification

`ROOT_CAUSE = RECEIVE_MAPPER_ALIAS_MISMATCH`.

`ROOT_CAUSE_CLASSIFICATION = RECEIVE_MAPPER_ALIAS_MISMATCH`.

Secondary manifestation: `LEGACY_FALLBACK_PRECEDENCE_BUG`.

## 17. Existing Asset Preservation

No source fix, Asset update, SQL patch, replay, or Receive was executed.

`EXISTING_ASSET_PRICE_CHANGED = NO`.

The existing accepted Asset remains the forensic evidence with `price=6600.00000000`.

## 18. Final DB No-Mutation Proof

All read-only counts stayed unchanged during this control:

```text
PURCHASE_ORDERS_DELTA = 0
ASSETS_DELTA = 0
BARCODE_DELTA = 0
JOURNAL_DELTA = 0
IDEMPOTENCY_DELTA = 0
CASH_DELTA = 0
DB_BUSINESS_WRITES = 0
```

No current DB transaction was opened for mutation.

## 19. Existing Unrelated P0

`JE-1787090870905` was read only and remains unchanged:

```text
debit  = 2133.21000000
credit = 2133.22000000
status = posted
```

`PRE_EXISTING_P0_CHANGED = NO`.

## 20. P0 / P1

- New P0: `0`.
- New P1: `0`.
- Open mapping item: `1` existing/persisted sale-price contract defect, requiring a separately authorized minimum-safe fix.
- This control does not authorize correction of the accepted Asset or another Receive.

## 21. Gate

The Root Cause, source path, formula, semantic authority, persistence target, and DB no-mutation state are proven.

`GATE = PASS_LOOSE_DIAMOND_SALE_PRICE_MAPPING_READONLY_FORENSIC`.
`LOOSE_DIAMOND_RECEIVE_CONTROL = PASS`.
`LOOSE_DIAMOND_FINAL_MODULE_STATUS = OPEN_ONE_SALE_PRICE_MAPPING_ITEM`.
`NEXT_RECOMMENDED_STEP = OWNER_REVIEW_THEN_MINIMUM_SAFE_SALE_PRICE_MAPPING_FIX_AND_NON_DUPLICATING_ACCEPTANCE`.
`NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`.

## 22. Final Tokens

```text
CURRENT_CONTROL = DARFUS-LOOSE-DIAMOND-SALE-PRICE-MAPPING-READONLY-FORENSIC
LOCAL_MAIN_DB = darfus_erp
SUCCESSFUL_ACCEPTED_LOOSE_DIAMOND_ASSET = AST-PUR-1787315623826-1-1-z3ig
SUCCESSFUL_ACCEPTED_PO = PO-1787315623819
SUCCESSFUL_ACCEPTED_BARCODE = DDLOS00000001
ORIGINAL_REQUEST_SELLING_PRICE = 8000.00
ORIGINAL_REQUEST_MINIMUM_SELLING_PRICE = 8000.00
PERSISTED_ASSET_PRICE = 6600.00000000
PERSISTED_SELLING_PRICE_FIELDS = assets.price=6600.00000000; no assets.sale_price; no assets.selling_price; no PO-item selling-price field
PERSISTED_MINIMUM_SELLING_PRICE = asset_pricing_policies.minimum_selling_price=8000.00000000
FRONTEND_FORM_FIELD = form.sellingPrice
FRONTEND_PREPARED_FIELD = items[0].sellingPrice and items[0].perPiece[0].sellingPrice; pricing.sellingPrice
FRONTEND_PREPARED_VALUE = 8000.00000000
PROFILE_CANONICAL_SELLING_PRICE_FIELD = piece.sellingPrice
PROFILE_MINIMUM_PRICE_FIELD = sale.minimumAllowedSellingPrice / pricing.minimumSellingPrice
RECEIVE_MAPPER_PRICE_READ_ORDER = v2Piece.salePrice ?? item.price; item.price = Number(item.price) || Math.round(unitCost * 1.32)
PERSISTED_6600_SOURCE = legacy item.price fallback from purchase unitCost
PERSISTED_6600_SOURCE_FILE = backend/src/routes/erp.routes.js
PERSISTED_6600_SOURCE_FUNCTION = canonical Supplier Receive route handler
PERSISTED_6600_SOURCE_LINE = erp.routes.js:7979 and erp.routes.js:8528
PERSISTED_6600_FORMULA = Math.round(5000 * 1.32) = 6600
ASSET_PRICE_SEMANTIC = SELLING_PRICE
SHARED_PRICE_MAPPING_USED = YES
DIAMOND_JEWELLERY_REGRESSION_RISK = MEDIUM_SHARED_V2_ASSET_MAPPER
CANONICAL_SELLING_PRICE_PERSISTENCE_TARGET = assets.price plus asset_pricing_policies.minimum_selling_price guard snapshot
CANONICAL_USER_ENTERED_SELLING_PRICE = 8000.00
SELLING_PRICE_AND_MINIMUM_PRICE_ARE_SEPARATE = YES
ROOT_CAUSE = RECEIVE_MAPPER_ALIAS_MISMATCH
ROOT_CAUSE_CLASSIFICATION = RECEIVE_MAPPER_ALIAS_MISMATCH
SOURCE_FIX_EXECUTED = NO
REAL_RECEIVE_EXECUTED = NO
EXISTING_ASSET_PRICE_CHANGED = NO
PURCHASE_ORDERS_DELTA = 0
ASSETS_DELTA = 0
BARCODE_DELTA = 0
JOURNAL_DELTA = 0
IDEMPOTENCY_DELTA = 0
CASH_DELTA = 0
DB_BUSINESS_WRITES = 0
PRE_EXISTING_UNRELATED_FINANCIAL_P0 = PRESENT_JE_1787090870905
PRE_EXISTING_P0_CHANGED = NO
ONLINE_PRODUCTION_CONTACTED = NO
P0_NEW = 0
P1_NEW = 0
GATE = PASS_LOOSE_DIAMOND_SALE_PRICE_MAPPING_READONLY_FORENSIC
LOOSE_DIAMOND_FINAL_MODULE_STATUS = OPEN_ONE_SALE_PRICE_MAPPING_ITEM
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

تم التوقف بعد التقرير. لا تعديل مصدر، لا تعديل Asset، لا Receive، لا Replay، لا Payment، لا RFID، لا Cleanup، لا تعديل Journal، ولا بدء Gem Stone.

`NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`.
