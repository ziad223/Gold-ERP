# DARFUS ERP — Final Official Loose Pearl Acceptance Report

## 1. Executive Summary

تم تنفيذ Quick Preflight ثم Receive رسمي واحد فقط من شاشة Loose Pearl canonical على قاعدة `darfus_erp`. النتيجة الأصلية كانت HTTP `201`. تم تنفيذ Exact Replay مرة واحدة، ثم Changed-payload مرة واحدة؛ أعاد الأول `201` والثاني `409 STATE_CONFLICT`، ولم تُنشأ سجلات أعمال إضافية.

لم يتم تنفيذ أي Receive ثانٍ، ولا Migration أو Seed أو Cleanup أو تعديل يدوي للبيانات أو Production.

## 2. Quick Preflight

| Check | Result | Evidence |
|---|---|---|
| Backend health | PASS | `GET /api/v1/health` = 200 |
| Database health | PASS | `GET /api/v1/health/db` = 200 |
| Redis health | PASS | `GET /api/v1/health/redis` = 200 |
| Database target | PASS | `SELECT current_database()` = `darfus_erp` |
| Authentication/context | PASS | Authenticated Super Admin; UI showed Gold ERP / Branch-1 |
| Supplier | PASS | `QA-G2C-SUPPLIER-01` |
| Location | PASS | `QA-G2C-RECEIVE-LOC-01` / `QA-G2C-RECEIVE-LOCATION-01` |
| Permission/readiness | PASS | UI showed `Receipt data complete` and `Receive permission available` |
| VAT policy | PASS | `STANDARD_VAT`, configured rate `14%` |

## 3. Authorized Receive

- Entry point: Inventory → Add Loose Pearl.
- Profile: `LOOSE_PEARL`.
- Quantity: `1`; `perPiece.length`: `1`.
- Purchase base: `100.00000000` AED.
- Current value: `120.00000000` AED.
- Selling price: `200.00000000` AED.
- Pearl data: Black, Abalone, size `1.0`.
- Prepared request: `inventoryV2=true`, `taxIncluded=false`, `applyVat=true`, `taxTreatment=STANDARD_VAT`.
- Prepared request used one generated idempotency key and was sent once from the confirmation action.

Backend log evidence:

```text
POST /api/v1/purchase-orders/receive 201 272.383ms outcome=completed
```

## 4. Tax and PO Proof

| Value | Expected | Persisted | Result |
|---|---:|---:|---|
| Taxable base | 100.00 | 100.00 | PASS |
| VAT rate | 14% | 14% | PASS |
| Input VAT | 14.00 | 14.00 | PASS |
| Purchase total | 114.00 | 114.00 | PASS |
| Tax treatment | STANDARD_VAT | STANDARD_VAT | PASS |

The PO tax snapshot was immutable and recorded the company rate, UAE jurisdiction, rounding scale 2, and tax-engine version. The persisted `tax_included=true` is the canonical document snapshot flag set by the explicit V2 piece-VAT branch after adding VAT to the pre-tax goods base; the submitted request itself remained `taxIncluded=false` and the financial calculation was applied once.

## 5. PO / Asset / Barcode / Movement Chain

| Authority | Evidence | Result |
|---|---|---|
| Purchase Order | `PO-1787434485735`, status `received` | PASS |
| PO Item | `POI-1787434485789-1-1`, quantity 1, unit price 100 | PASS |
| Asset | `AST-PUR-1787434485744-1-1-9kp0`, profile `LOOSE_PEARL` | PASS |
| Asset status | `AVAILABLE`, Branch-1, canonical location ID | PASS |
| Pearl component | One component, type Abalone, color Black, size 1.0 | PASS |
| Origin | `PURCHASE_ORDER` linked to the PO item | PASS |
| Movement | `PURCHASE_RECEIVE` to Branch-1/location | PASS |
| Barcode | `PLLOS00000001`, one active row, unique | PASS |
| Product quantity | PO item `product_id` is null; no Product stock authority used | PASS |

Ordinal evidence: the selected pearl-size master ID resolved to the active master row; the persisted size is finite `1.0`, and no NaN/invalid ordinal value was present.

## 6. Cost, Current Valuation, and Supplier Payable

| Area | Persisted value | Result |
|---|---:|---|
| Historical purchase cost | 100.00 AED | PASS |
| Purchase cost revision | `vat_base=100`, `vat_amount=14`, `total_purchase_cost=100` | PASS |
| Current valuation base | 120.00 AED | PASS |
| Current valuation VAT | 16.80 AED | PASS |
| Current valuation total | 136.80 AED | PASS |
| Supplier payable / remaining amount | 114.00 AED, unpaid | PASS |
| Cash transaction delta | 0 | PASS |

Historical purchase cost and current valuation remained separate. Current valuation did not overwrite the purchase snapshot.

## 7. Accounting Proof

New journal: `JE-1787434485848`, status `posted`.

| Line | Debit | Credit |
|---|---:|---:|
| Inventory / `SYS-INVENTORY` | 100.00 | 0.00 |
| Input VAT / `1400` | 14.00 | 0.00 |
| Supplier Payable / `SYS-AP` | 0.00 | 114.00 |
| **Total** | **114.00** | **114.00** |

Accounting is balanced and no cash posting was created. The pre-existing unbalanced journal remains the single historical exception: `JE-1787090870905`, difference `-0.01`. It was not modified.

## 8. Exact Idempotency Proof

The browser retained the original request object and key in the production page state. The exact Replay reused both through the canonical UI diagnostic action.

| Request | HTTP | Result | Business delta |
|---|---:|---|---:|
| Original receive | 201 | succeeded | one authorized chain |
| Same body + same key | 201 | replayed existing response | 0 |
| Changed payload + same key | 409 | `STATE_CONFLICT` | 0 |

Backend log evidence:

```text
POST /api/v1/purchase-orders/receive 201 272.383ms outcome=completed
POST /api/v1/purchase-orders/receive 201 65.588ms outcome=completed
POST /api/v1/purchase-orders/receive 409 59.317ms outcome=completed
```

The idempotency row is `succeeded`, `status_code=201`, and the same request hash remains recorded. No key poisoning or duplicate Asset/Barcode/Movement/Journal occurred.

## 9. Browser Proof

### Arabic Asset Details

PASS. `/ar/inventory/AST-PUR-1787434485744-1-1-9kp0` showed Loose Pearl, `AVAILABLE`, Branch-1, canonical location, barcode `PLLOS00000001`, Black color, purchase cost 100, current valuation VAT 16.8, current total 136.8, PO origin, and linked purchase movement.

### English Asset Details

PASS. `/en/inventory/AST-PUR-1787434485744-1-1-9kp0` showed the same values and identity in English.

### POS Barcode Compatibility

PASS. POS search by `PLLOS00000001` returned one `Loose Pearl` result at AED 200. No checkout was performed.

## 10. DB Delta Proof

Baseline was captured before the Receive. Counts after the original Receive, Exact Replay, and Changed Replay were:

| Table | Before | After | Delta |
|---|---:|---:|---:|
| purchase_orders | 13 | 14 | +1 |
| purchase_order_items | 13 | 14 | +1 |
| assets | 13 | 14 | +1 |
| asset_components | 10 | 11 | +1 |
| asset_origins | 13 | 14 | +1 |
| asset_purchase_cost_revisions | 13 | 14 | +1 |
| asset_current_valuations | 13 | 14 | +1 |
| inventory_asset_movements | 13 | 14 | +1 |
| asset_barcode_history | 13 | 14 | +1 |
| purchase_order_item_asset_links | 13 | 14 | +1 |
| journal_entries | 16 | 17 | +1 |
| journal_lines | 45 | 48 | +3 |
| cash_transactions | 3 | 3 | 0 |
| idempotency_requests | 17 | 18 | +1 |

The only intended business delta is the single authorized Loose Pearl receive. Replay and conflict generated no additional business rows.

## 11. Scope and Safety

- Official database: `darfus_erp`.
- Official DB mutation: exactly one Owner-authorized Receive transaction; no manual SQL mutation.
- Additional Receive attempts: 0.
- Migrations: 0 created, 0 executed.
- Seeds/master-data provisioning: 0.
- Cleanup/delete/rollback: 0.
- Production contact: 0.
- Supplier legacy receive screen: not used.
- Other profiles: not used.
- Checkout/payment: not performed.

## 12. Gate

`PASS_LOOSE_PEARL_FINAL_OFFICIAL_ACCEPTANCE`

The Loose Pearl module is closed for this acceptance. Stage A is closed. The next stage, if separately authorized, is Stage B/B1 transfer requirements read-first. No automatic next batch is started.

## 13. Final Tokens

```text
CURRENT_CONTROL = DARFUS-LOOSE-PEARL-FINAL-OFFICIAL-ACCEPTANCE
OFFICIAL_DATABASE = darfus_erp
OFFICIAL_RECEIVE_COUNT_THIS_CONTROL = 1
ADDITIONAL_RECEIVE_COUNT = 0
ORIGINAL_HTTP_STATUS = 201
EXACT_REPLAY_HTTP_STATUS = 201
CHANGED_PAYLOAD_HTTP_STATUS = 409
PO_PROOF = PASS
ASSET_PROOF = PASS
BARCODE_PROOF = PASS
MOVEMENT_PROOF = PASS
ORDINAL_PROOF = PASS
TAX_PROOF = PASS
PURCHASE_COST_REVISION_PROOF = PASS
CURRENT_VALUATION_PROOF = PASS
SUPPLIER_PAYABLE_PROOF = PASS
JOURNAL_BALANCE_PROOF = PASS
CASH_DELTA = 0
AR_ASSET_DETAILS = PASS
EN_ASSET_DETAILS = PASS
POS_BARCODE_PROOF = PASS
IDEMPOTENCY_EXACT_REPLAY = PASS
IDEMPOTENCY_CHANGED_PAYLOAD_CONFLICT = PASS
HISTORICAL_UNBALANCED_JOURNAL_MODIFIED = NO
MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED = 0
MASTER_DATA_MUTATION = NO
CLEANUP_PERFORMED = NO
PRODUCTION_CONTACTED = NO
GATE = PASS_LOOSE_PEARL_FINAL_OFFICIAL_ACCEPTANCE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 14. Stop

FULL LOOSE PEARL OFFICIAL ACCEPTANCE COMPLETE → OWNER REVIEW → WAIT FOR EXPLICIT NEXT AUTHORIZATION.
