# DARFUS ERP — Diamond Jewellery Controlled Runtime Final Closure

## 1. Executive Summary

تم تنفيذ Receive واحد فقط لقطعة اصطناعية من نوع `DIAMOND_JEWELLERY` على قاعدة البيانات الرسمية `darfus_erp` بعد موافقة Owner الصريحة. تم التحقق من المسار القانوني الكامل: PO → PO Item → Asset → Barcode → Diamond Components → Origin → Cost Revision → Current Valuation → Movement → Tax Snapshot → Supplier Payable/Journal.

النتيجة: المعاملة الوحيدة نجحت، وأعيد تشغيل الطلب بالمفتاح نفسه دون تكرار، بينما أعاد الطلب المتعارض `409 STATE_CONFLICT`. لا توجد دفعة، ولا RFID، ولا Loose Diamond، ولا Master Data أو Migration أو Cleanup في هذا التحكم.

## 2. Owner Authorization

| Item | Result |
|---|---|
| Owner authorization for one synthetic Diamond Jewellery Receive | APPROVED |
| Official DB target | `darfus_erp` |
| Maximum successful receives | 1 |
| Successful business receives | 1 |
| Payment / supplier payment | NOT RUN |
| Loose Diamond | NOT RUN |
| Production / Online Production | NOT TOUCHED |
| Cleanup of acceptance data | NOT RUN; accepted record preserved |

## 3. Preconditions

- `SELECT current_database()` was verified as `darfus_erp` immediately before the controlled mutation.
- Company/branch context was verified as company `COMP-48ab554f-427e-4642-9419-bc8616c2dc36`, branch `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c`, `Branch-1`.
- Supplier and location were existing DB records; no supplier/location was created by this control.
- Gold health was fresh before the transaction.
- No migration was created or applied. Backend startup logged: `No migrations were executed, database schema was already up to date.`

## 4. Health / Gold Freshness

| Check | Result | Evidence |
|---|---|---|
| Backend health | 200 / UP | `GET /api/v1/health` |
| Gold health | 200 / HEALTHY | `GOLDAPI_IO`, `LIVE_PROVIDER`, AED, fresh=true, stale=false, mockFallback=false |
| PostgreSQL | healthy | `darfus-postgres`, port 5433→5432 |
| Redis | healthy | `darfus-redis`, port 6379 |
| Frontend | 200 | localhost:3000 asset detail route |
| Runtime services | Up | `docker compose ps` |

## 5. Baseline DB Counts

Read-only baseline captured before Receive:

| Entity | Baseline |
|---|---:|
| purchase_orders | 6 |
| purchase_order_items | 6 |
| assets | 6 |
| asset_components | 0 |
| asset_diamond_component_details | 0 |
| asset_barcode_history | 6 |
| asset_rfid_assignments | 2 |
| asset_origins | 6 |
| asset_purchase_cost_revisions | 6 |
| asset_current_valuations | 6 |
| inventory_asset_movements | 6 |
| journal_entries | 9 |
| journal_lines | 24 |
| cash_transactions | 3 |
| audit_logs | 60 |
| idempotency_requests | 9 |
| DIAMOND_JEWELLERY assets | 0 |
| LOOSE_DIAMOND assets | 0 |

`asset_rfid_assignments` is the actual current schema table used for RFID evidence.

## 6. Synthetic Acceptance Input

| Field | Value |
|---|---|
| Profile | `DIAMOND_JEWELLERY` |
| Description / item | Ring / `RNG` |
| Inventory code | `DD` |
| Karat | 21 |
| Gross weight | 10.00000000 g |
| Diamond total | 1.50000000 CT |
| Component 1 | Natural, D, VS1, Round, 1.00000000 CT, purchase cost 1000 |
| Component 2 | Lab Grown, F, SI1, Princess, 0.50000000 CT, purchase cost null |
| Historical gold rate | 200 AED/g |
| Making | 10 AED/g; total 97 |
| Historical diamond cost | 1000 |
| Sale price | 7000 |
| Tax treatment | `STANDARD_VAT` |
| Certificate | None |
| RFID | None |
| Paid amount | 0 |

All values were synthetic acceptance values. No secret, token, or password is included in this report.

## 7. Profile Preview

Profile contract and profile preview returned 200. The preview proved:

| Calculation | Value |
|---|---:|
| Diamond grams | 0.30000000 |
| Net gold | 9.70000000 |
| Pure gold | 8.48750000 |
| Historical gold value | 1940.00000000 |
| Making total | 97.00000000 |
| Diamond cost | 1000.00000000 |
| Tax base | 3037.00000000 |
| VAT | 425.18000000 |
| Purchase total | 3462.18000000 |
| Current gold rate | 466.80803905 |
| Current valuation | 6412.54329582 |
| Sale price | 7000 |

## 8. Shared Receive Preview

The shared Supplier V2 preview returned 200 with total `3462.18` and tax `425.18`. The submitted request used the same canonical supplier, location, purchase date, tax treatment, and per-piece Diamond payload. Preview and persisted Receive totals matched to the stored precision.

## 9. Receive Request

| Item | Result |
|---|---|
| Endpoint | `POST /api/v1/purchase-orders/receive` |
| Original response | 201 |
| Business receive count | 1 |
| Idempotency key | `diamond-runtime-final-closure-f392fe13854142bb8441c13ed58818d6` |
| PO | `PO-1787249363466` |
| Response total | 3462.18 |
| Response tax base | 3037.00 |
| Response VAT | 425.18 |
| Response paid | 0 |
| Response remaining | 3462.18 |
| Payment status | unpaid |

## 10. PO / PO Item

PO `PO-1787249363466` is `received`, linked to supplier `SUP-001`, company and branch context, with total `3462.18000000`, tax base `3037.00000000`, VAT rate `14.000`, and input VAT `425.18000000`.

PO Item `POI-1787249363519-1-1` has quantity 1, received quantity 1, `product_id = NULL`, Asset `AST-PUR-1787249363472-1-1-acuh`, and total `3462.18000000`.

## 11. Asset

| Field | Value |
|---|---|
| Asset | `AST-PUR-1787249363472-1-1-acuh` |
| Profile | `DIAMOND_JEWELLERY` |
| Status | `AVAILABLE` / `available` |
| Branch / location | `Branch-1` / `QA-G2C-RECEIVE-LOCATION-01` |
| Supplier | `SUP-001` / `QA-G2C-SUPPLIER-01` |
| Barcode | `DDRNG21000001` |
| Product authority | `product_id = NULL`; Asset is physical authority |
| Gross / net | 10.00000000 g / 9.70000000 g |
| Karat | 21 |
| Cost / sale price | 3037.00000000 / 7000 |

## 12. Barcode / RFID

- One active barcode row was created for the Asset: `DDRNG21000001`.
- Barcode history shows revision 1, state `ACTIVE`, action `INITIAL`, source `ASSET_CREATE`.
- Barcode is unique and linked to exactly this Asset.
- RFID assignments remained unchanged at 2; this acceptance Asset has no RFID assignment.

## 13. Diamond Components

Exactly two `asset_components` rows and two linked `asset_diamond_component_details` rows exist for the one Asset:

| Sequence | Type | CT | Weight g | Color | Clarity | Shape | Purchase cost |
|---:|---|---:|---:|---|---|---|---:|
| 0 | Natural | 1.00000000 | 0.20000000 | D | VS1 | Round | 1000.00000000 |
| 1 | Lab Grown | 0.50000000 | 0.10000000 | F | SI1 | Princess | NULL |

The null cost for the Lab Grown component was preserved; it was not converted to zero or inferred.

## 14. Certificate Boundary

No certificate was supplied. No certificate row was created. The stored certificate cost is `0.00000000`, matching the accepted input and profile contract.

## 15. Origin

One `asset_origins` row exists for the Asset:

`origin_type = PURCHASE_ORDER`, `purchase_order_item_id = POI-1787249363519-1-1`, same company/branch, `mapping_classification = V2_RUNTIME_RECEIPT`.

## 16. Purchase Cost Revision

One current revision exists, revision 1, with:

- historical gold rate `200.00000000`, source `MANUAL`;
- gold value `1940.00000000`;
- making per gram `10.00000000`, making total `97.00000000`;
- component cost `1000.00000000`;
- VAT base `3037.00000000`, VAT `425.18000000`, rate `14.000000`;
- total purchase cost `3462.18000000` AED;
- supplier and PO Item linkage preserved;
- provenance marks `DIAMOND_JEWELLERY`, `V2_RUNTIME_RECEIPT`, and `perPiece=true`.

## 17. Current Valuation

The separate current valuation row is present and does not overwrite the historical snapshot:

| Field | Value |
|---|---:|
| Rate source | GOLDAPI_IO |
| Gold rate | 466.80803905 |
| Gold value | 4528.03797879 |
| Making value | 97.00000000 |
| Component value | 1000.00000000 |
| VAT base | 5625.03797879 |
| VAT amount | 787.50531703 |
| Total current value | 6412.54329582 |

## 18. Movement

Exactly one `PURCHASE_RECEIVE` movement exists for the controlled Asset, source `PURCHASE_ORDER / PO-1787249363466`, to the verified branch and location, with its immutable `PURCHASE_RECEIVED` AssetEvent linked.

## 19. Tax Snapshot

The PO tax snapshot is immutable evidence of the applied policy:

- requested and resolved treatment: `STANDARD_VAT`;
- jurisdiction: UAE;
- effective VAT rate: 14;
- taxable base: 3037;
- VAT: 425.18;
- rounding scale: 2;
- company VAT registered snapshot: true;
- tax calculation version: `DARFUS-UAE-TAX-03B-G2A2-V1`;
- tax law rule version: `UAE-VATP043-2025-02-26`;
- RCM result: `NOT_REQUESTED`.

## 20. Supplier Payable

The PO remains unpaid with remaining amount `3462.18`. The journal credits `SYS-AP` for the same amount. No cash transaction was created for this PO, consistent with the approved no-payment scope.

## 21. Journal

Journal `JE-1787249363555` is `posted`, source `purchase_order / PO-1787249363466`, with three lines:

| Account | Debit | Credit |
|---|---:|---:|
| SYS-INVENTORY | 3037.00 | 0 |
| 1400 — Input VAT | 425.18 | 0 |
| SYS-AP | 0 | 3462.18 |
| **Total** | **3462.18** | **3462.18** |

## 22. PO / Tax / Payable / Journal Reconciliation

`3037.00 × 14% = 425.18` at the stored 2-decimal tax rounding scale. `3037.00 + 425.18 = 3462.18`. PO total, item total, payable remaining, journal debit, and journal credit reconcile exactly. Current valuation is intentionally separate from historical purchase cost.

## 23. Idempotency Replay

The exact original payload and exact same idempotency key returned 201 with the same PO. Final DB deltas show no duplicate Asset, Barcode, Movement, Journal, or PO Item. The idempotency table contains one row for the key with status code 201.

## 24. Idempotency Conflict

The same idempotency key with changed Notes returned `409 STATE_CONFLICT`. It did not create or alter business records. The backend log shows one original 201, one replay 201, and one conflict 409.

## 25. DB Final Deltas

| Entity | Baseline | Final | Delta | Expected |
|---|---:|---:|---:|---:|
| purchase_orders | 6 | 7 | +1 | +1 |
| purchase_order_items | 6 | 7 | +1 | +1 |
| assets | 6 | 7 | +1 | +1 |
| asset_components | 0 | 2 | +2 | +2 |
| asset_diamond_component_details | 0 | 2 | +2 | +2 |
| asset_barcode_history | 6 | 7 | +1 | +1 |
| asset_rfid_assignments | 2 | 2 | 0 | 0 |
| asset_origins | 6 | 7 | +1 | +1 |
| asset_purchase_cost_revisions | 6 | 7 | +1 | +1 |
| asset_current_valuations | 6 | 7 | +1 | +1 |
| inventory_asset_movements | 6 | 7 | +1 | +1 |
| journal_entries | 9 | 10 | +1 | +1 |
| journal_lines | 24 | 27 | +3 | +3 |
| cash_transactions | 3 | 3 | 0 | 0 |
| audit_logs | 60 | 61 | +1 | +1 |
| idempotency_requests | 9 | 10 | +1 | +1 |
| DIAMOND_JEWELLERY assets | 0 | 1 | +1 | +1 |
| LOOSE_DIAMOND assets | 0 | 0 | 0 | 0 |

Suppliers remained 2, locations remained 2, companies remained 1, branches remained 1, and products remained 0. No master-data provisioning occurred.

## 26. Asset / Component / Scope Integrity

- One physical Diamond Jewellery piece produced exactly one Asset.
- `product_id` remained null for the PO item; Product quantity did not become physical authority.
- Two descriptive embedded components remained inside the one top-level Asset.
- The accepted Asset is company- and branch-scoped and available at the selected DB location.
- No Loose Diamond asset was created.

## 27. AR UI

Read-only browser verification on `http://localhost:3000/ar/inventory` showed the accepted row with Ring, Asset ID, profile `مجوهرات ألماس`, barcode `DDRNG21000001`, 10 g gross, 9.7 g net, Branch-1, the DB location, supplier, and `متاحة`.

The Arabic Asset detail route showed the same barcode, Asset identity, status, location, historical purchase snapshot, current valuation, sale price, two embedded components, `PURCHASE_RECEIVED` event, and `PURCHASE_RECEIVE` movement.

## 28. EN UI

Read-only browser verification on `http://localhost:3000/en/inventory/AST-PUR-1787249363472-1-1-acuh` showed the same identity and values in English: Diamond Jewellery, `AVAILABLE`, Branch-1, the DB location, barcode, frozen purchase snapshot, separate current valuation, two embedded components, origin, event, and movement.

## 29. Network / Console

Backend request evidence:

- profile contract: 200;
- Diamond preview: 200;
- shared receive preview: 200;
- original canonical Receive: 201;
- exact replay: 201;
- changed-payload replay: 409;
- no second successful business Receive.

Browser Console verification after AR/EN navigation returned no errors or warnings. During the original receive session, notification requests briefly returned 401 before refresh and then returned 200/304; this did not affect Receive, PO, Asset, accounting, or idempotency and is recorded as a non-blocking P3 runtime issue.

## 30. Tests / Typecheck

All focused tests passed:

| Test | Result |
|---|---|
| `diamond-jewellery-authority-implementation.test.cjs` | 5/5 PASS |
| `diamond-negative-shared-preview.test.cjs` | 3/3 PASS |
| `unified-inventory-ux-final-closure.test.cjs` | 8/8 PASS |
| `unified-inventory-intake-ux-02-r3.test.cjs` | 5/5 PASS |
| `asset-final-closure.test.cjs` | 9/9 PASS |
| `barcode-final-closure.test.cjs` | 11/11 PASS |
| `supplier-master-final-closure.test.cjs` | 6/6 PASS |
| `npm run typecheck` | PASS |

No build was run. No migration was created or applied.

## 31. Files Changed

This control added only this report:

`docs/DARFUS_DIAMOND_JEWELLERY_CONTROLLED_RUNTIME_FINAL_CLOSURE_REPORT.md`

The worktree had extensive pre-existing modifications and untracked files. No cleanup, reset, restore, stash, or unrelated source edit was performed for this control. The accepted DB business rows are the intentional controlled runtime evidence and were not deleted.

## 32. Gate

### PASS_DIAMOND_JEWELLERY_FINAL_CLOSURE

The gate passes because:

- exactly one successful synthetic Diamond Jewellery Receive was executed;
- the official DB target was verified before mutation;
- PO, Asset, Barcode, two components, two Diamond detail rows, Origin, Cost Revision, Valuation, Movement, Tax Snapshot, Payable, and balanced Journal are present;
- preview and persisted tax/total values reconcile exactly;
- exact idempotent replay created no duplicates;
- conflicting replay failed with 409;
- AR and EN browser evidence confirms the persisted Asset;
- no payment, RFID, Loose Diamond, migration, seed, master-data provisioning, or cleanup occurred;
- focused tests and typecheck passed;
- no P0/P1 regression was introduced.

The notification 401 burst is a P3 non-blocking observability/session-refresh issue and does not invalidate the Diamond Jewellery acceptance path.

## 33. Final Tokens

```text
CURRENT_CONTROL = DARFUS-DIAMOND-JEWELLERY-CONTROLLED-RUNTIME-FINAL-CLOSURE
LOCAL_MAIN_DB = darfus_erp
OWNER_RUNTIME_AUTHORIZATION = APPROVED
RECEIVES_EXECUTED_SUCCESSFULLY = 1
CONTROLLED_PO_NUMBER = PO-1787249363466
CONTROLLED_PO_ITEM_ID = POI-1787249363519-1-1
CONTROLLED_ASSET_ID = AST-PUR-1787249363472-1-1-acuh
CONTROLLED_BARCODE = DDRNG21000001
CONTROLLED_JOURNAL_ID = JE-1787249363555
CONTROLLED_IDEMPOTENCY_KEY = diamond-runtime-final-closure-f392fe13854142bb8441c13ed58818d6
CONTROLLED_PROFILE = DIAMOND_JEWELLERY
ASSET_COUNT_DELTA = +1
COMPONENT_COUNT_DELTA = +2
DIAMOND_DETAIL_COUNT_DELTA = +2
BARCODE_COUNT_DELTA = +1
RFID_ASSIGNMENT_COUNT_DELTA = 0
MOVEMENT_COUNT_DELTA = +1
COST_REVISION_COUNT_DELTA = +1
CURRENT_VALUATION_COUNT_DELTA = +1
JOURNAL_COUNT_DELTA = +1
JOURNAL_LINES_DELTA = +3
CASH_TRANSACTION_COUNT_DELTA = 0
LOOSE_DIAMOND_CREATED = NO
PAYMENT_EXECUTED = NO
MASTER_DATA_MUTATION = NO
MIGRATIONS_CREATED = 0
MIGRATIONS_APPLIED = 0
AR_BROWSER = PASS
EN_BROWSER = PASS
BROWSER_CONSOLE = 0_ERRORS_0_WARNINGS
NETWORK_CONTRACT = PASS
NETWORK_RECEIVE = PASS_201
NETWORK_EXACT_REPLAY = PASS_201_NO_DUPLICATE
NETWORK_CONFLICT_REPLAY = PASS_409_STATE_CONFLICT
TAX_SNAPSHOT = PASS
ACCOUNTING_PAYABLE = PASS
JOURNAL_BALANCE = PASS
IDEMPOTENCY = PASS
FOCUSED_TESTS = PASS
TYPECHECK = PASS
P0_COUNT = 0
P1_COUNT = 0
P2_COUNT = 0
P3_COUNT = 1
P4_COUNT = 0
ACCEPTANCE_DATA_PRESERVED = YES
GATE = PASS_DIAMOND_JEWELLERY_FINAL_CLOSURE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_ONLY
LOOSE_DIAMOND_STARTED = NO
```

**Diamond Jewellery controlled runtime final closure complete → Owner review → wait for explicit next approval.**
