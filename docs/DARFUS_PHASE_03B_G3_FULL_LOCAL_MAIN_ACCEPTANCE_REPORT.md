# DARFUS ERP — Phase 03B-G3 Full Local Main Browser + API + DB + Accounting Acceptance

Control ID: `DARFUS-PHASE-03B-G3-FULL-LOCAL-MAIN-ACCEPTANCE`

## 1. Executive Summary

تم تنفيذ قبول Local Main على `localhost:3000` و`localhost:8000` وقاعدة `darfus_erp` فقط. تم إثبات الجاهزية، مسار Inventory canonical، GBW evidence السابق المقبول، وعقد/معاينة GBP. بعد موافقة Owner تم تنفيذ Receive اصطناعي واحد فقط لـGold By Piece من:

`Inventory → إضافة / استلام مخزون → Gold By Piece`

تم إنشاء Asset وBarcode وOrigin وCost Revision وMovement وPO وJournal وIdempotency row. لكن القبول توقف فورًا بسبب عيب مالي P1 مثبت:

1. Tax Preview لا يساوي Tax Snapshot/PO.
2. Journal غير متوازن بفارق `0.01`.

لم يتم تنفيذ Idempotency replay بعد ظهور mismatch، ولم يتم أي تعديل يدوي أو cleanup أو migration. Official DB تم لمسها فقط بالـReceive الاصطناعي المصرح به من Owner؛ Online Production لم تُلمس.

## 2. Preconditions

| Check | Result | Evidence |
|---|---|---|
| Local Main DB | PASS | `SELECT current_database() = darfus_erp` |
| SequelizeMeta | PASS | `85` |
| Backend health | PASS | `GET /api/v1/health = 200` |
| DB health | PASS | `GET /api/v1/health/db = 200` |
| Redis health | PASS | `GET /api/v1/health/redis = 200` |
| Gold health | PASS | `GET /api/v1/health/gold = 200`, `GOLDAPI_IO`, `AED`, `LIVE_PROVIDER`, fresh/non-stale |
| Frontend | PASS | `http://localhost:3000` reachable; required Arabic routes loaded |
| System readiness | PASS | onboarding API returned `200`; UI showed جاهز |
| Operational receive readiness | PASS | onboarding API/UI showed جاهز; blockers empty in prior/current readiness proof |
| Online Production | YES / untouched | no online production URL or request used |

No restart, build, migration, seed, backup, or destructive command was executed by G3.

## 3. Current Data Reconciliation

Before G3, the current Local Main DB contained 3 preserved synthetic Supplier Receive records, all GBW-family records. They were not deleted or rewritten. The current active supplier was `SUP-001`; the active DB location was `LOC-9a10f58e-4207-4512-8824-7a7b06159151`; a second location remained disabled. The company/branch context was one synthetic company and one active branch.

The existing records were retained as historical evidence:

- old synthetic receive: preserved;
- previous mismatched canonical receive: preserved;
- corrected G2C GBW acceptance receive: preserved and reused as GBW current proof;
- new G3 GBP receive: the only new G3 business receive.

## 4. Company/Branch Authority

| Assertion | Result | Evidence |
|---|---|---|
| Company server context | PASS | Browser header showed `Gold ERP`; backend logs showed one company context |
| Branch server context | PASS | Browser header showed `Branch-1`; asset/PO/journal all linked to the same branch |
| DB company | PASS | one company row; `vat_registered=true`, currency AED |
| DB branch | PASS | one active `Branch-1` row scoped to the company |
| Cross-scope/product authority | PASS static | G2C/01A focused tests passed server-authoritative branch and Product exclusion checks |

No auth middleware or company/branch logic was changed in G3.

## 5. Onboarding/Readiness

Arabic `/ar/settings` showed exactly one discoverability entry for onboarding. `/ar/settings/onboarding` showed:

- System Ready;
- Operational Receive Ready;
- 7 onboarding steps visible and marked جاهز;
- canonical path statement: Inventory → إضافة / استلام مخزون;
- no duplicate Receive form.

The backend recorded authenticated `GET /api/v1/settings/operational-readiness = 200` twice during the verification window.

## 6. Supplier

`/ar/suppliers` loaded with the existing active synthetic supplier `QA-G2C-SUPPLIER-01 / SUP-001`. The screen exposed list/details management actions and no Receive-create action. `/ar/suppliers/purchases` redirected to `/ar/inventory` and was not used for the G3 receive.

Supplier master runtime: `PASS` for read-only evidence. Supplier final closure remains open by design.

## 7. Locations

`/ar/inventory/locations` loaded the DB-backed location management screen. The active location and disabled location were both visible when requested. The Receive forms displayed only the active DB-backed location selector; no free-text location was used.

Location scope evidence:

- active: `QA-G2C-RECEIVE-LOCATION-01`;
- disabled: `QA-G2B-LOCATION-01-EDITED`;
- both company/branch scoped;
- no location provisioning or mutation in G3.

Location master runtime: `PASS` for read-only evidence.

## 8. Tax Policy

Read-only settings evidence:

| Key | Actual |
|---|---|
| `vatRate` | `14` synthetic test value |
| `defaultTaxTreatment` | `STANDARD_VAT` |
| `enabledTaxTreatments` | `STANDARD_VAT`, `ZERO_RATED`, `REVERSE_CHARGE` |
| `preciousGoodsRcmEnabled` | `true` |
| `decimalPrecision` | `2` |
| Company VAT registration | explicit `true` |

The current policy was not reset or modified. Tax Engine source was not changed in G3.

## 9. Canonical Receive Authority

PASS for the tested entry authority:

`Inventory → إضافة / استلام مخزون → Gold By Piece`

The chooser showed GBW and GBP enabled and Diamond/Gem/Pearl disabled. The Supplier legacy purchases route redirected to Inventory and was not an alternate create path. The actual receive request was recorded by backend as `POST /api/v1/purchase-orders/receive = 201`.

## 10. GBW Acceptance

Current G2C GBW Local Main evidence was reused because it is current, corrected, and tied to the same `darfus_erp` baseline. It proves:

- canonical Inventory entry;
- Supplier and DB Location selection;
- explicit tax treatment;
- Gold Center rate source;
- `NET = GROSS - STONE`;
- `PURE = NET × KARAT / 24`;
- `TOTAL_MAKING_COST = MAKING_PER_GRAM × NET`;
- Asset/Barcode/Origin/Movement/Cost/Payable/Journal;
- same-key replay with no duplicate rows.

GBW formula/business logic was not changed in G3.

GBW Browser/API/DB status for G3 integration: `PASS_BY_CURRENT_G2C_EVIDENCE`.

## 11. GBP Acceptance

The GBP browser form was opened in Arabic from the canonical Inventory route. Synthetic input used:

- profile: `GOLD_BY_PIECE`;
- description: Gold Ring;
- gold color: Yellow Gold;
- karat: 21K;
- gross weight: 4g;
- stone weight: 0g;
- purchase making: 20 AED/g;
- current making: 20 AED/g;
- markup: 25%;
- tax treatment: STANDARD_VAT;
- existing synthetic Supplier and active DB Location;
- barcode item code: RNG.

The GBP profile preview returned `200`. The shared receive preview returned `200` after the minimum safe UI correction. The Gold Center source used by the persisted cost revision was `GOLD_CENTER_GLOBAL_SPOT` at `447.81044382 AED/g`.

The one approved receive produced:

- PO: `PO-1787090870807`;
- Asset: `AST-PUR-1787090870838-1-1-9k4e`;
- Barcode: `GPRNG21000001`.

GBP Asset/Barcode/Movement creation succeeded, but final GBP acceptance is `BLOCKED` by the Tax reconciliation and Journal P1 findings below.

## 12. Tax Reconciliation

The required equality failed:

| Value | GBP Preview | Persisted Tax Snapshot / PO | Result |
|---|---:|---:|---|
| Tax treatment | STANDARD_VAT | STANDARD_VAT | PASS |
| VAT rate | 14% | 14% | PASS |
| Taxable base | `1834.56543649` | `1871.24177528` | FAIL |
| VAT amount | `298.65018733` | `261.97384854` | FAIL |
| Total | `2133.21562382` | `2133.21562382` | total equal, component mismatch |

`Preview ≠ Tax Snapshot ≠ PO tax fields`, therefore:

`TAX_PREVIEW_SNAPSHOT_PO = BLOCKED_P1_FINANCIAL_MISMATCH`

No tax snapshot was manually edited.

## 13. Asset/Barcode

The new GBP physical record was created as one Asset:

| Assertion | Result | Evidence |
|---|---|---|
| One physical piece = one Asset | PASS | one new Asset linked to one PO item |
| Profile | PASS | `GOLD_BY_PIECE` |
| Karat | PASS | 21 |
| Gross/net | PASS | 4g / 4g |
| Company/branch/location | PASS | current company, `Branch-1`, active DB Location |
| Supplier | PASS | `SUP-001` |
| Status | PASS | legacy available + `AVAILABLE` operational status |
| Barcode | PASS | `GPRNG21000001`, ACTIVE, revision 1 |
| Active barcode uniqueness | PASS | duplicate active barcode groups = 0 |

No barcode replacement or manual barcode operation was performed.

## 14. Movement/Product Exclusion

Movement evidence:

- one `PURCHASE_RECEIVE` movement;
- source type `PURCHASE_ORDER`;
- source PO `PO-1787090870807`;
- target branch `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c`;
- target location `LOC-9a10f58e-4207-4512-8824-7a7b06159151`.

Product quantity exclusion passed for the tested GBP record:

- PO item `product_id IS NULL`;
- final-profile Product physical item count = 0;
- `stock_movements` count remained 0.

## 15. Payable/Journal

Supplier payable authority was created through the posted journal, and `payments` remained 0. However the Journal balance gate failed:

| Journal line | Debit | Credit |
|---|---:|---:|
| Inventory | `1871.24000000` | `0` |
| Input VAT | `261.97000000` | `0` |
| Supplier payable | `0` | `2133.22000000` |
| Totals | `2133.21000000` | `2133.22000000` |

Journal: `JE-1787090870905`, status `posted`.

`JOURNAL_BALANCE = FAIL_P1` with imbalance `-0.01`.

This is a financial posting defect, not an approval to alter the journal. No manual correction was made.

## 16. Idempotency

The successful receive created one succeeded idempotency row with HTTP status 201. A replay using the same key was not executed because the required stop condition was reached immediately after the Tax/Journal mismatch:

`TAX/JOURNAL MISMATCH → STOP → NO FINAL PASS`

Therefore:

`IDEMPOTENCY = BLOCKED_AFTER_P1_FINANCIAL_STOP`

No second receive, replay, cleanup, reversal, or manual record change was performed.

## 17. Browser

Read-only/browser evidence passed for the required pages:

| Route | Result |
|---|---|
| `/ar/settings` | LOADS; exactly one onboarding entry |
| `/ar/settings/onboarding` | LOADS; 7 steps; both readiness statuses جاهز |
| `/ar/suppliers` | LOADS; supplier list; no Receive create action |
| `/ar/inventory` | LOADS; canonical Add/Receive action; Asset-only rows |
| `/ar/inventory/locations` | LOADS; active/disabled DB locations |
| `/ar/inventory/gold-by-weight` | LOADS; GBW contract and form |
| `/ar/inventory/gold-by-piece` | LOADS; GBP contract and form |
| `/ar/suppliers/purchases` | Redirects to `/ar/inventory` |

Arabic canonical GBP journey reached successful Supplier V2 confirmation. No blank page or fatal UI error was observed.

## 18. Network/Console

Backend request evidence:

- Health/DB/Redis/Gold GETs: 200;
- readiness GET: 200;
- GBW/GBP contract GETs: 200;
- GBP profile preview POST: 200;
- shared receive preview POST: 200 after fix;
- canonical receive POST: 201;
- no receive-related 5xx.

Browser Console after successful GBP receive: 0 error entries and 0 warning entries in the inspected tab.

A background notification request later returned 401 in backend logs after the receive; it did not affect the receive response or display. It is recorded as non-blocking runtime/session noise and was not changed in G3.

## 19. Focused Regression

Passing focused evidence:

| Suite | Result |
|---|---|
| G2A1 tax policy | 6/6 PASS when run from the required backend working directory |
| G2A2 transaction tax | 10/10 PASS |
| G2B location | 5/5 PASS |
| G2C receive contract | 4/4 PASS |
| G2D readiness | 4/4 PASS |
| Inventory authority 01A | 6/6 PASS |
| GBW profile | 7/7 PASS |
| GBP R2 calculation | 5/5 PASS |
| Barcode/status 01C | 4/4 PASS |
| GBW financial formula | 6/6 PASS |
| Unified Intake | 5/5 PASS |
| Settings discoverability | 2/2 PASS |
| Supplier canonical UI race/redirect | 2/2 PASS |
| Frontend typecheck | PASS |

One historical Supplier acquisition test failed because it still expects the removed legacy Supplier page to contain the preview route. The current source intentionally makes that page redirect-only; the canonical replacement tests passed. This is classified as `ACCEPTANCE_GAP / STALE_TEST_EXPECTATION`, not fixed in G3.

## 20. DB Reconciliation

| Entity | Before | After one GBP receive | Delta |
|---|---:|---:|---:|
| companies | 1 | 1 | 0 |
| branches | 1 | 1 | 0 |
| settings | 12 | 12 | 0 |
| suppliers | 1 | 1 | 0 |
| inventory_locations | 2 | 2 | 0 |
| purchase_orders | 3 | 4 | +1 |
| purchase_order_items | 3 | 4 | +1 |
| assets | 3 | 4 | +1 |
| asset_barcode_history | 3 | 4 | +1 |
| asset_origins | 3 | 4 | +1 |
| asset_purchase_cost_revisions | 3 | 4 | +1 |
| inventory_asset_movements | 3 | 4 | +1 |
| stock_movements | 0 | 0 | 0 |
| journal_entries | 3 | 4 | +1 |
| journal_lines | 9 | 12 | +3 |
| payments | 0 | 0 | 0 |
| audit_logs | 37 | 38 | +1 |
| idempotency_requests | 3 | 4 | +1 |

The only G3 persistent business mutation was the one Owner-approved synthetic GBP receive. No deletion, cleanup, reverse, manual journal, manual tax, manual barcode, or migration was performed.

## 21. Bugs Found/Fixed

### G3-GBP-001 — fixed minimum-safe

The GBP page built `unitCost` only on the outer receive item. The canonical `perPiece[]` object therefore failed the server V2 purchase-cost evidence requirement and produced `POST /inventory-v2/receive-preview = 422`. The minimum safe fix added the already-calculated `unitCost`/`cost` to the per-piece transport object in the existing GBP page. It did not change the GBP formula, rate source, tax engine, or accounting authority.

After the fix:

- GBP profile preview = 200;
- shared receive preview = 200;
- focused GBP tests = 5/5;
- typecheck = PASS.

### G3-FIN-001 — open P1, not fixed

The GBP receive persisted a PO/Tax Snapshot whose component totals differ from the browser Tax Preview, and its posted Journal is not balanced by `0.01`. Root cause is an exact-value/line-rounding reconciliation defect in the receive/accounting path. No business-rule or accounting change was attempted in G3.

## 22. Files Changed

Intentional G3 changes:

- `app/[locale]/(dashboard)/inventory/gold-by-piece/page.tsx` — minimum-safe per-piece cost transport correction;
- `docs/DARFUS_PHASE_03B_G3_FULL_LOCAL_MAIN_ACCEPTANCE_REPORT.md` — this report.

No test file, migration, config, `next-env.d.ts`, database schema, or online production source was changed. `next-env.d.ts` remained the pre-existing Owner-accepted generated drift and was not edited. The broader dirty worktree was pre-existing and was not cleaned, reset, stashed, or restored.

## 23. Gate

| Gate | Result |
|---|---|
| HEALTH | PASS |
| AUTH_COMPANY_BRANCH | PASS |
| ONBOARDING_READINESS | PASS |
| SETTINGS_DISCOVERABILITY | PASS |
| SUPPLIER_MASTER_RUNTIME | PASS |
| LOCATION_MASTER_RUNTIME | PASS |
| CANONICAL_RECEIVE_ONLY | PASS |
| GBW_BROWSER_API_DB | PASS by current G2C evidence |
| GBP browser/contract/Asset path | PASS partially; final acceptance blocked |
| TAX_PREVIEW_SNAPSHOT_PO | FAIL P1 |
| ASSET_AUTHORITY | PASS |
| BARCODE_AUTHORITY | PASS |
| MOVEMENT_AUTHORITY | PASS |
| PRODUCT_QUANTITY_EXCLUSION | PASS |
| SUPPLIER_PAYABLE | BLOCKED by Journal mismatch |
| JOURNAL_BALANCE | FAIL P1 |
| ACCOUNTING_RECONCILIATION | FAIL P1 |
| IDEMPOTENCY | BLOCKED after mandatory stop |
| NETWORK | PASS for tested receive path; background notification 401 noted |
| CONSOLE | PASS for inspected tab |
| FOCUSED_REGRESSION | BLOCKED by stale historical test expectation; canonical replacements pass |
| TYPECHECK | PASS |

`GATE = FAIL_P1_FINANCIAL_TAX_AND_JOURNAL_RECONCILIATION`

G3 does not close Supplier, Supplier Receive, GBW, GBP, Barcode/RFID, or POS final feature phases.

## 24. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PHASE-03B-G3-FULL-LOCAL-MAIN-ACCEPTANCE
LOCAL_MAIN_DB = darfus_erp
SEQUELIZE_META = 85
HEALTH = PASS
AUTH_COMPANY_BRANCH = PASS
SYSTEM_FIRST_RUN_READY = YES
OPERATIONAL_RECEIVE_READY = YES
SETTINGS_ONBOARDING_DISCOVERABLE = PASS
SUPPLIER_MASTER_RUNTIME = PASS
LOCATION_MASTER_RUNTIME = PASS
CANONICAL_RECEIVE_ONLY = PASS
GBW_BROWSER_API_DB = PASS_BY_CURRENT_G2C_EVIDENCE
GBP_BROWSER_API_DB = BLOCKED_P1_FINANCIAL_MISMATCH
TAX_PREVIEW_SNAPSHOT_PO = FAIL_P1
ASSET_AUTHORITY = PASS
BARCODE_AUTHORITY = PASS
MOVEMENT_AUTHORITY = PASS
PRODUCT_QUANTITY_EXCLUSION = PASS
SUPPLIER_PAYABLE = BLOCKED_BY_JOURNAL_IMBALANCE
JOURNAL_BALANCE = FAIL_P1
ACCOUNTING_RECONCILIATION = FAIL_P1
IDEMPOTENCY = BLOCKED_AFTER_P1_STOP
NETWORK = PASS_WITH_BACKGROUND_401_NOTED
CONSOLE = PASS
FOCUSED_REGRESSION = BLOCKED_STALE_TEST_EXPECTATION
TYPECHECK = PASS
NEW_G3_RECEIVES = 1
MIGRATION_CREATED = NO
BUSINESS_LOGIC_REWRITTEN = NO
ROUTE_CLASSIFICATION_AUDIT = DEFERRED
ONLINE_PRODUCTION_CONTACTED = NO
GATE = FAIL_P1_FINANCIAL_TAX_AND_JOURNAL_RECONCILIATION
G3_LOCAL_MAIN_FINAL_CLOSED = NO
SUPPLIER_MASTER_FINAL_CLOSED = NO
SUPPLIER_RECEIVE_FINAL_CLOSED = NO
GBW_FINAL_CLOSED = NO
GBP_FINAL_CLOSED = NO
BARCODE_FINAL_CLOSED = NO
RFID_FINAL_CLOSED = NO
POS_FINAL_CLOSED = NO
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_P1_FINANCIAL_RECONCILIATION_BEFORE_ANY_REPLAY_OR_RETRY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

تم التوقف عند Gate. لا يبدأ أي إصلاح مالي أو replay أو Supplier Final Closure تلقائيًا.
