# DARFUS ERP — Loose Gem Stone Authenticated Live Receive Retry Report

تم تنفيذ محاولة Confirm إضافية واحدة فقط بعد استعادة جلسة المصادقة، ونجحت على `darfus_erp`. تم إثبات الـPO والـAsset والباركود والحركة والتكلفة والتقييم الحالي والقيد المتوازن، ثم تم إثبات Replay المطابق ورفض Payload مختلف بالمفتاح نفسه. لم يحدث Receive ثالث، ولم يحدث تنظيف أو تعديل يدوي أو Migration أو تغيير مصدر.

النجاح: مسار الاستلام القانوني، البيانات المالية، والـIdempotency. الفشل السابق كان انتهاء جلسة قبل الـConfirm ولم ينتج أي بيانات. الخطر على قاعدة البيانات محصور في Receive الاختباري الواحد المصرح به، وهو موثق وقابل للتتبع؛ لا توجد فروقات غير متوقعة.

## 1. Executive Summary

- Control: `DARFUS-LOOSE-GEM-STONE-AUTHENTICATED-LIVE-RECEIVE-RETRY`.
- Official DB: `darfus_erp`، وتم التحقق من `SELECT current_database()` قبل وبعد.
- Exactly one additional authenticated Confirm was executed from the canonical Inventory workflow.
- Result: HTTP `201`; one PO, one serialized Asset, one barcode, one origin, one movement, one purchase-cost revision, one current valuation, one balanced journal.
- Exact replay returned the existing business result with HTTP `201`; same-key changed payload returned HTTP `409 STATE_CONFLICT`.
- No third Confirm, no new receive after the successful one, no cleanup, no migration, no seed, no source change in this retry control.

## 2. Prior Attempt and Authentication Recovery

The preceding official attempt returned `401_UNAUTHORIZED_SESSION_EXPIRED` before business persistence. The pre-retry baseline was unchanged. Protected reads after local session recovery returned:

| Read | Status |
|---|---:|
| `GET /api/v1/settings` | 200 |
| `GET /api/v1/inventory-v2/loose-gemstone/contract` | 200 |

No password, token, cookie, or idempotency key is included in this report or the artifacts.

## 3. Official DB Baseline and Backup

The pre-confirm read-only baseline was:

| Entity | Before |
|---|---:|
| Purchase Orders | 11 |
| Purchase Order Items | 11 |
| Assets | 11 |
| Asset Components | 8 |
| Gemstone Component Details | 1 |
| Barcode History | 11 |
| Asset Origins | 11 |
| Purchase Cost Revisions | 11 |
| Current Valuations | 11 |
| Inventory Movements | 11 |
| Journal Entries | 14 |
| Journal Lines | 39 |
| Cash Transactions | 3 |
| Idempotency Requests | 15 |
| Audit Logs | 70 |
| Loose Gemstone Assets | 0 |
| GSLOS Barcodes | 0 |

Fresh backup was created before the authorized Confirm:

- File: `backend/backups/darfus_erp_PRE_LOOSE_GEM_STONE_AUTH_RETRY_20260822_001700.dump`
- Size: `707303` bytes
- SHA-256: `4F9AAE496C9B63166BC61818B2DC28B413587F1C5CDB8A6DC076201A1033ACB8`
- `pg_restore --list`: PASS

## 4. Request and Preview Revalidation

The English browser form used the same synthetic business data as the preserved prepared request. The comparison excluded only the newly generated idempotency key and found zero business-field mismatches.

| Check | Result |
|---|---|
| Profile Preview | READY |
| Shared Preview | READY |
| Tax treatment | `STANDARD_VAT` |
| Configured VAT rate | 14% |
| Purchase base before VAT | AED 5,200.00 |
| Purchase VAT | AED 728.00 |
| Purchase total | AED 5,928.00 |
| Current valuation base | AED 6,200.00 |
| Current VAT | AED 868.00 |
| Current valuation total | AED 7,068.00 |
| `items[0].unitCost` | `5200.00000000` |
| `items[0].purchaseCost` | `5200.00000000` |
| `taxIncluded` | `false` |
| `applyVat` | `true` |
| `perPiece.length = quantity` | PASS |
| Business payload parity | PASS |

## 5. Canonical Receive and Network Proof

The only additional Confirm used:

`Inventory → Add / Receive Inventory → Loose Gem Stone → Confirm Receive`

| Method | Endpoint | Status | Business effect |
|---|---|---:|---|
| POST | `/api/v1/purchase-orders/receive` | 201 | Exactly one receive created |

The backend log recorded a balanced journal for the new PO. Production was not contacted. The prior 401 did not create a business transaction.

## 6. Created Business Identity

| Record | Value |
|---|---|
| Purchase Order | `PO-1787347062767` |
| Purchase Order Item | `POI-1787347062818-1-1` |
| Asset | `AST-PUR-1787347062774-1-1-hjm1` |
| Barcode | `GSLOS00000001` |
| Company | `COMP-48ab554f-427e-4642-9419-bc8616c2dc36` |
| Branch | `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c` |
| Location | `LOC-9a10f58e-4207-4512-8824-7a7b06159151` |
| Supplier | `SUP-001` / `QA-G2C-SUPPLIER-01` |
| Profile | `LOOSE_GEMSTONE` |
| Asset status | `AVAILABLE` |

## 7. Asset / Barcode / Origin / Movement Proof

- One physical unit produced exactly one Asset.
- Asset has exactly one active barcode: `GSLOS00000001`.
- Barcode history contains one initial active record linked to the Asset.
- Origin is `PURCHASE_ORDER` and links to the received PO item.
- Movement is `PURCHASE_RECEIVE`, scoped to the expected company, branch, and location, and sourced from the PO.
- Component is `PRIMARY_SUBJECT / GEMSTONE`, 2.50000000 CT, Ruby; gemstone detail includes Oval, Red, Medium tone, Strong saturation, Chatoyancy, Mozambique.

## 8. Purchase Cost and Tax Proof

The persisted PO snapshot is:

| Field | Value |
|---|---:|
| Tax treatment | `STANDARD_VAT` |
| Tax base | 5,200.00 |
| VAT rate | 14% |
| Input VAT | 728.00 |
| PO total | 5,928.00 |
| Tax included flag | true at PO snapshot level |

The purchase-cost revision stores the historical pre-tax economic components and the tax snapshot separately:

- Component cost: 200.00
- VAT base: 5,200.00
- VAT amount: 728.00
- Total purchase cost: 5,200.00 in the canonical asset cost field
- Supplier and PO-item links preserved
- Revision is current (`is_current = true`)

This matches the established V2 contract used by the receive path; no historical row was altered.

## 9. Current Valuation Proof

The current valuation is separate from the historical purchase snapshot:

| Field | Value |
|---|---:|
| Rate source | `LOOSE_GEMSTONE_VALUATION` |
| Component/current value | 6,200.00 |
| VAT rate | 14% from `TAX_ENGINE` |
| VAT base | 6,200.00 |
| VAT amount | 868.00 |
| Total valuation | 7,068.00 |

The Asset Details pages explicitly show the historical purchase snapshot separately from the current valuation.

## 10. Accounting and Supplier Payable Proof

Journal: `JE-1787347062866`, source `purchase_order / PO-1787347062767`, status `posted`.

| Journal line | Debit | Credit |
|---|---:|---:|
| Inventory | 5,200.00 | 0.00 |
| Recoverable input VAT | 728.00 | 0.00 |
| Supplier payable / AP | 0.00 | 5,928.00 |
| **Total** | **5,928.00** | **5,928.00** |

`Base + VAT = PO total = AP` and `Debit = Credit`. No cash transaction was created by the receive. Supplier payable is represented by the canonical AP journal credit; no parallel payment mutation was performed.

## 11. Idempotency Verification

The exact prepared request was retained for the retry proof. The first UI replay click encountered the expired browser session and produced no business write. After local authentication recovery, the exact same body and same key were submitted through the authenticated receive contract:

| Test | Result |
|---|---|
| Same exact request body + same key | HTTP 201, existing PO/Asset returned |
| Duplicate Asset/Barcode/Movement/Journal from replay | 0 |
| Same key + changed payload | HTTP 409 `STATE_CONFLICT` |
| New PO from replay/conflict | 0 |

The idempotency record remains a single succeeded request with status code 201. The key itself is intentionally not recorded.

## 12. DB Reconciliation

The post-control read-only totals were:

| Entity | After | Delta | Expected |
|---|---:|---:|---:|
| Purchase Orders | 12 | +1 | +1 |
| Purchase Order Items | 12 | +1 | +1 |
| Assets | 12 | +1 | +1 |
| Asset Components | 9 | +1 | +1 |
| Gemstone Component Details | 2 | +1 | +1 |
| Barcode History | 12 | +1 | +1 |
| Asset Origins | 12 | +1 | +1 |
| Purchase Cost Revisions | 12 | +1 | +1 |
| Current Valuations | 12 | +1 | +1 |
| Inventory Movements | 12 | +1 | +1 |
| Journal Entries | 15 | +1 | +1 |
| Journal Lines | 42 | +3 | +3 |
| Cash Transactions | 3 | 0 | 0 |
| Idempotency Requests | 16 | +1 | +1 |
| Audit Logs | 71 | +1 | +1 |
| Loose Gemstone Assets | 1 | +1 | +1 |
| GSLOS Barcodes | 1 | +1 | +1 |

Replay and conflict did not change these post-success totals. There was no unexpected partial persistence.

## 13. Arabic Asset Details Readback

`/ar/inventory/AST-PUR-1787347062774-1-1-hjm1` loaded successfully with zero console errors. It displayed the Asset, barcode, `AVAILABLE` state, company branch, location, supplier/PO origin, historical purchase VAT 728, current valuation VAT 868, and totals 5,928 / 7,068.

## 14. English Asset Details Readback

`/en/inventory/AST-PUR-1787347062774-1-1-hjm1` loaded successfully with zero console errors. It displayed the same persisted identity and financial separation as Arabic, including barcode `GSLOS00000001`, `AVAILABLE`, branch/location, source PO, historical purchase snapshot, and current valuation.

## 15. POS Barcode Compatibility

Read-only POS search on `/en/pos` using `GSLOS00000001` returned exactly one result:

- `Synthetic Ruby EN`
- Barcode `GSLOS00000001`
- 0.5 g
- Selling price AED 8,000.00
- No item was added to the invoice and checkout was not executed.
- Console errors: 0.

## 16. Source / Scope Safety

| Item | Result |
|---|---|
| Source changes in this retry control | 0 |
| Product code changed in this retry | 0 |
| Test files changed in this retry | 0 |
| Migration created/executed | NO / NO |
| Seed/master-data mutation | NO |
| Tax/Gold settings mutation | NO |
| Manual SQL business write | 0 |
| Cleanup/deletion | NO |
| Production contact | NO |
| Third Confirm | NOT RUN |
| Additional successful receives beyond authorized one | 0 |

## 17. Failure and Risk Review

- Prior session-expiry 401: recovered before the permitted replay-only proof; no business persistence resulted.
- No P0 or P1 defect was introduced or observed in the authorized retry.
- The official database now contains one clearly identified synthetic Loose Gem Stone receive authorized for this control. It was not deleted because cleanup was forbidden.
- The implementation still relies on the existing authenticated session and canonical Supplier Receive V2 contract; no new workflow was introduced.

## 18. Gate

All required closure evidence is present:

- Authenticated Confirm: PASS
- Official DB target proof: PASS
- Fresh verified backup: PASS
- Canonical receive path: PASS
- Preview/request parity: PASS
- PO/tax snapshot: PASS
- Asset/barcode/origin/movement: PASS
- Purchase cost revision: PASS
- Current valuation: PASS
- Supplier payable and balanced journal: PASS
- Exact idempotency replay: PASS
- Same-key changed payload 409: PASS
- AR/EN Asset readback: PASS
- POS barcode read-only proof: PASS
- No third Confirm: PASS
- Official DB unexpected delta: 0

`GATE = PASS_LOOSE_GEM_STONE_FINAL_USER_WORKFLOW_CLOSURE_AFTER_AUTHENTICATED_RETRY`

## 19. Final Tokens

```text
CURRENT_CONTROL = DARFUS-LOOSE-GEM-STONE-AUTHENTICATED-LIVE-RECEIVE-RETRY
LOCAL_MAIN_DB = darfus_erp
OFFICIAL_DB_TARGET_PROVEN = YES
OFFICIAL_DB_PRE_RETRY_READ_ONLY = YES
AUTH_RECOVERY = PASS
ADDITIONAL_CONFIRM_ATTEMPTS = 1
SUCCESSFUL_RECEIVES_THIS_CONTROL = 1
THIRD_CONFIRM = NOT_RUN
PREVIEW_PARITY = PASS
PROFILE_PREVIEW = READY
SHARED_PREVIEW = READY
PREVIEW_PURCHASE_BASE = 5200.00
PREVIEW_PURCHASE_VAT = 728.00
PREVIEW_PURCHASE_TOTAL = 5928.00
CURRENT_VALUATION_BASE = 6200.00
CURRENT_VALUATION_VAT = 868.00
CURRENT_VALUATION_TOTAL = 7068.00
PO_VERIFICATION = PASS
ASSET_VERIFICATION = PASS
BARCODE_VERIFICATION = PASS
ORIGIN_VERIFICATION = PASS
MOVEMENT_VERIFICATION = PASS
PURCHASE_COST_REVISION = PASS
CURRENT_VALUATION_VERIFICATION = PASS
SUPPLIER_PAYABLE_VERIFICATION = PASS
JOURNAL_BALANCE = PASS
EXACT_IDEMPOTENCY_REPLAY = PASS
SAME_KEY_CHANGED_PAYLOAD_409 = PASS
AR_ASSET_READBACK = PASS
EN_ASSET_READBACK = PASS
POS_BARCODE_READ_PROOF = PASS
DB_UNEXPECTED_DELTA = 0
MIGRATION_CREATED = NO
MIGRATION_EXECUTED = NO
MASTER_DATA_MUTATION = NO
TAX_SETTINGS_MUTATION = NO
GOLD_SETTINGS_MUTATION = NO
PRODUCTION_CONTACTED = NO
LOOSE_GEM_STONE_FINAL_USER_WORKFLOW_CLOSED = YES
LOOSE_GEM_STONE_MODULE_STATUS = CLOSED
P0_COUNT = 0
P1_COUNT = 0
GATE = PASS_LOOSE_GEM_STONE_FINAL_USER_WORKFLOW_CLOSURE_AFTER_AUTHENTICATED_RETRY
NEXT_RECOMMENDED_STEP = PEARL_JEWELLERY_PREIMPLEMENTATION_AUTHORITY_AUDIT
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 20. Required Stop

No further receive, retry, cleanup, implementation, migration, seed, or production action is authorized by this control.

**STOP → OWNER REVIEW → NEXT BATCH ONLY AFTER EXPLICIT APPROVAL**
