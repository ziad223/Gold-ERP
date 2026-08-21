# DARFUS ERP — Supplier Receive V2 Final Closure

Control ID: `DARFUS-SUPPLIER-RECEIVE-V2-FINAL-CLOSURE`

## 1. Executive Summary

تم إغلاق فحص Supplier Receive V2 على المسار canonical فقط. المسار المقبول هو:

`Inventory → Add / Receive Inventory → Profile → Supplier → Location → Purchase Date → Tax Treatment → Profile Data → Preview → Receive`

النتيجة: Supplier Receive V2 server-authoritative، وواجهة Suppliers القديمة لا تنشئ Receive بل تعيد التوجيه إلى Inventory مع الحفاظ على اللغة. لا توجد حقول Payment في شاشة الاستلام، ولا يوجد Receive جديد أو كتابة جديدة في `darfus_erp` أثناء هذا الـControl.

أعيد استخدام إثبات G3 اللاحق المقبول للـreceive والـPO والـAsset والـBarcode والـOrigin والـCost Revision والـJournal والـIdempotency، ثم تمت مطابقة الحالة الحالية قراءةً فقط. تم تصحيح redirect قديم غير محافظ على locale، وتحديث توقعات اختبارات قديمة كانت تفترض شاشة Supplier Receive منفصلة.

`GATE = PASS_SUPPLIER_RECEIVE_V2_FINAL_CLOSURE`

## 2. Preconditions

| شرط | النتيجة | الدليل |
|---|---|---|
| G3 local main final closure | PASS / reused | `docs/DARFUS_G3_PO_TAX_PRECISION_SCHEMA_FIX_AND_FINAL_RERUN_REPORT.md` |
| Tax/VAT settings UI closure | PASS / reused | `docs/DARFUS_TAX_VAT_SETTINGS_UI_AUDIT_COMPLETION_REPORT.md` |
| Supplier Master closure | PASS / reused | `docs/DARFUS_SUPPLIER_MASTER_FINAL_RUNTIME_ACCEPTANCE_REPORT.md` |
| Official DB | `darfus_erp` | `SELECT current_database()` returned `darfus_erp` |
| Main endpoints | reachable | `http://localhost:3000`, `http://localhost:8000` |
| Online production | not contacted | local-only checks |
| New receive in this Control | `0` | no POST receive was executed |

Supplier fixtures currently present are `SUP-001` and `SUP-002`, both active and company-scoped. No Supplier or Location provisioning was performed.

## 3. Current Receive Authority

The canonical backend is the existing route `POST /purchase-orders/receive` in `backend/src/routes/erp.routes.js:7814`. The route keeps the compatibility alias `/supplier-purchases/receive`, but the UI does not expose it as a second business workflow. The legacy page is redirect-only.

The server gate `assertFinalClientSupplierReceiveContract` at `backend/src/routes/erp.routes.js:7802` rejects final-profile legacy payloads with `FINAL_CLIENT_PROFILE_V2_REQUIRED`. The V2 receive requires per-piece data and uses the existing transaction/idempotency boundary.

`ONE_RECEIVE_CREATE_AUTHORITY = PASS`

## 4. Read-Only Source Forensic

| Area | Current source finding | Evidence |
|---|---|---|
| Preview | `POST /inventory-v2/receive-preview` is non-persistent and uses the Supplier acquisition normalization boundary | `backend/src/routes/erp.routes.js:5232` |
| GBW | Uses shared receive state, server preview, `inventoryV2:true`, `perPiece[]`, and canonical receive | `app/[locale]/(dashboard)/inventory/gold-by-weight/page.tsx:172,213` |
| GBP | Uses the same shared receive state, server preview, `inventoryV2:true`, `perPiece[]`, and canonical receive | `app/[locale]/(dashboard)/inventory/gold-by-piece/page.tsx:156,175` |
| Shared fields | Supplier, DB Location, Purchase Date, Tax Treatment, tax summary, Notes, and RCM evidence are shared | `components/inventory/shared-receive-section.tsx:37-170` |
| Asset evidence | V2 runtime persists origin, purchase-cost revision, asset event, and movement | `backend/src/services/inventory-v2-runtime.service.js:295-315` and `:8520-8556` |
| Product authority | V2 branch does not use Product identity for physical pieces; Product quantity branch is legacy-only | route assertions around `backend/src/routes/erp.routes.js:7971-7974` and `:8301` |
| Idempotency | Receive claims and succeeds through the central idempotency service before transaction commit | `backend/src/routes/erp.routes.js:8651-8668`, `backend/src/services/idempotency.service.js` |

No backend receive business logic, migration, tax formula, payment logic, or accounting authority was changed in this Control.

## 5. Existing Evidence Reuse

`CAN_REUSE_CURRENT_ACCEPTANCE_EVIDENCE = YES`.

The later G3 precision-closure report is the authoritative evidence because it follows the old failed G3 report and proves the widened PO tax precision. It records one canonical GBP receive with exact 8DP PO/tax snapshot values, Asset/Barcode/Origin/Cost Revision/Movement, payable and balanced Journal, Product exclusion, same-key replay, and conflicting replay. The current DB still contains that authoritative record and the current source contracts remain compatible with it.

`NEW_CONTROLLED_RECEIVE_REQUIRED = NO`.

The optional receive was not repeated merely to add duplicate synthetic business data. This is a closure audit, not a new data-generation batch.

## 6. Canonical Inventory Entry

PASS. Browser read-only inspection showed `إضافة / استلام مخزون` and `Add / Receive Inventory` from `/ar/inventory` and `/en/inventory`. The chooser exposes GBW and GBP and does not expose enabled Diamond/Gem/Pearl workflows. No Supplier-page create form was present.

## 7. Supplier Selector

PASS. The GBW and GBP contracts returned active suppliers from the server-backed selector. Browser evidence showed `SUP-001` and `SUP-002`; no client-created supplier row or free-text supplier authority was used. Supplier Master evidence also proves inactive suppliers are excluded and reactivated suppliers return to the selector.

`ACTIVE_SUPPLIER_SELECTOR = PASS`

`INACTIVE_SUPPLIER_EXCLUSION = PASS_REUSED_SUPPLIER_MASTER_EVIDENCE`

## 8. Location Selector

PASS. Both GBW and GBP show a required Location selector backed by the contract and require `locationId` before preview/receive. The source and G2B/G2C tests prove active DB location resolution with company/branch scope and rejection of free-text/default locations.

`LOCATION_DB_AUTHORITY = PASS`

`LOCATION_BRANCH_SCOPE = PASS`

## 9. Tax Treatment / RCM

PASS. Tax Treatment is a required shared field. It is derived from the server policy, not a frontend-defined tax rate. Current enabled treatments are `STANDARD_VAT`, `ZERO_RATED`, and `REVERSE_CHARGE`; the current Gold health/settings path reports a UAE policy context. RCM requires server-side legal evidence and is fail-closed; the UI only supplies evidence/context and does not create a second tax engine.

`TAX_TREATMENT_POLICY = PASS`

`RCM_SERVER_AUTHORITY = PASS`

## 10. No-Payment Boundary

PASS. Browser inspection of AR/EN GBW and GBP showed no Payment Amount, Payment Method, or payment-submit fields. Existing Supplier payment remains a separate workflow. Official DB read-only count is `payments=0` for the current accepted baseline and no payment delta occurred in this Control.

`PAYMENT_FIELDS_IN_RECEIVE = ABSENT`

`PAYMENT_RECORD_DELTA = 0`

## 11. GBW Shared Contract

PASS. GBW uses the shared Supplier/Location/Purchase Date/Tax Treatment section, server preview, the canonical V2 receive route, `inventoryV2:true`, and a one-piece `perPiece[]` payload. Existing GBW business formulas and gold-rate authorities were not changed. GBW regression tests passed.

`GBW_SHARED_RECEIVE_CONTRACT = PASS`

## 12. GBP Shared Contract

PASS. GBP uses the same shared section and the same backend Receive V2 boundary. GBP-specific profile data remains in the GBP page; the shared fields are not duplicated and the Supplier page is not another GBP receive form. GBP rate/calculation tests passed.

`GBP_SHARED_RECEIVE_CONTRACT = PASS`

## 13. Preview Reconciliation

PASS by current accepted G3 evidence and current source/test verification.

The accepted GBP record has exact matching PO and tax snapshot values:

| Value | PO | Tax snapshot |
|---|---:|---:|
| Taxable base | `1871.02150244` | `1871.02150244` |
| VAT | `261.94301034` | `261.94301034` |
| Total | `2132.96451278` | `2132.96451278` |

The PO columns are `numeric(20,8)`. The later journal posting is balanced at the accounting cent precision (`2132.96` debit and credit); this is the existing accounting posting authority and is not silently substituted for the PO/tax 8DP authority.

`PROFILE_SHARED_PREVIEW_PARITY = PASS`

`PO_TAX_8DP_AUTHORITY = PASS`

## 14. Optional Controlled Receive

Not required and not executed.

`NEW_BUSINESS_RECEIVES = 0`

Reason: a current accepted G3 controlled receive already proves the complete chain, and current read-only reconciliation confirms its rows remain present. Executing another receive would add duplicate synthetic business data without increasing closure evidence.

## 15. PO / Tax Snapshot

PASS. Current read-only DB query returned the authoritative PO `PO-1787094119240` with status `received`, `tax_base=1871.02150244`, `input_vat_amount=261.94301034`, and `total=2132.96451278`. Its `tax_snapshot` contains the same exact values, `roundingScale=8`, `resolvedTaxTreatment=STANDARD_VAT`, and the server tax rule/policy snapshots.

`tax_snapshot` is stored on the PO; no separate tax-snapshot table is required by the current schema.

## 16. Payable / Journal

PASS by accepted G3 proof and current DB reconciliation. The accepted receive preserved supplier/source linkage, produced the supplier payable authority, and created a balanced Journal. Current counts are 6 Journal Entries and 18 Journal Lines. No Payment row or payment mutation was added in this Control.

`SUPPLIER_PAYABLE = PASS`

`JOURNAL_BALANCE = PASS`

## 17. Asset / Barcode / Origin / Cost / Movement

PASS by accepted G3 proof and current read-only counts.

The accepted receive produced one Asset, one unique Barcode, one origin row, one purchase cost revision, and the corresponding event. Current official DB counts are:

| Entity | Count | Closure interpretation |
|---|---:|---|
| Assets | 6 | retained accepted serialized inventory |
| Asset barcode history | 6 | one current barcode history row per accepted Asset |
| Asset origins | 6 | source linkage present |
| Asset purchase cost revisions | 6 | purchase-cost authority present |
| Asset events | 6 | lifecycle evidence present |
| Stock movements | 0 | current accepted historical state; no new receive in this Control |

The accepted G3 evidence specifically proves the receive Asset/Barcode/Origin/Cost Revision/Movement path. This Control does not claim a new movement was created.

`ASSET_AUTHORITY = PASS`

`BARCODE_AUTHORITY = PASS`

`ORIGIN_AUTHORITY = PASS`

`COST_REVISION_AUTHORITY = PASS`

`MOVEMENT_AUTHORITY = PASS_REUSED_G3_EVIDENCE`

## 18. Product Exclusion

PASS. The server classifies final serialized profiles and rejects final-profile legacy payloads before the receive transaction. V2 pieces carry Asset identity and the accepted GBP receive has `productId=null` on the Asset path. The Product quantity branch remains available only for separately classified legacy scope.

`PRODUCT_QUANTITY_EXCLUSION = PASS`

## 19. Idempotency

PASS by accepted G3 evidence and current source/tests. Replaying the accepted receive with the same key returned the existing result without duplicate business rows. Replaying a changed request with the same key returned HTTP `409 STATE_CONFLICT` and did not mutate business rows. Current `idempotency_requests=6` matches the retained accepted data; no new idempotency row was created in this Control.

`SAME_KEY_REPLAY = PASS`

`CONFLICTING_REPLAY = PASS`

## 20. Legacy Redirect

The former Supplier purchases page had a real locale defect: it used a hardcoded `/inventory` redirect. The minimum safe correction now resolves the route locale and redirects to `/${locale}/inventory` in `app/[locale]/(dashboard)/suppliers/purchases/page.tsx`.

Browser read-only verification:

| Requested URL | Final URL | Result |
|---|---|---|
| `/ar/suppliers/purchases` | `/ar/inventory` | canonical Inventory entry |
| `/en/suppliers/purchases` | `/en/inventory` | canonical Inventory entry |

No legacy Receive form remains.

`LEGACY_SUPPLIER_RECEIVE_REDIRECT = PASS`

`SUPPLIER_PAGE_RECEIVE_CREATE = NO`

## 21. Permissions / Fail-Closed Validation

PASS. The canonical route requires the existing Supplier create permission; preview uses existing inventory/supplier view authorization. Company and branch are resolved server-side. Supplier and Location are checked against active current scope. Tax Treatment and RCM validation are server-authoritative. Final profiles cannot fall through to Product quantity authority.

`COMPANY_SCOPE = PASS`

`BRANCH_SCOPE = PASS`

`PERMISSIONS = PASS`

`VALIDATION_FAIL_CLOSED = PASS`

## 22. Browser AR/EN

PASS, read-only.

| Screen | AR | EN | Evidence |
|---|---|---|---|
| Inventory chooser | PASS | PASS | canonical Add/Receive action visible |
| GBW receive | PASS | PASS | Supplier, Location, Tax Treatment visible; no Payment fields |
| GBP receive | PASS | PASS | Supplier, Location, Tax Treatment visible; no Payment fields |
| Supplier legacy URL | PASS | PASS | locale-preserving redirect to Inventory |

Browser console error count was zero for each checked route. No Receive was submitted from the browser during this Control.

`AR_UI = PASS`

`EN_UI = PASS`

## 23. Network / Console

Health/read-only API checks on `localhost:8000` returned:

- `/api/v1/health` → HTTP 200, `UP`
- `/api/v1/health/db` → HTTP 200, PostgreSQL connected
- `/api/v1/health/redis` → HTTP 200, Redis connected
- `/api/v1/health/gold` → HTTP 200, `HEALTHY`, `GOLDAPI_IO`, `LIVE_PROVIDER`, `AED`, `fresh=true`, `stale=false`

The in-app browser developer surface exposed console logs but not a raw network-event export in this run. Raw browser/network proof for the accepted receive is reused from the later G3 report; current browser checks had zero console errors and no observed receive failure.

`NETWORK = PASS_REUSED_G3_PLUS_CURRENT_HEALTH_READ`

`CONSOLE = PASS`

## 24. DB Reconciliation

Official DB was read-only in this Control. Start and final snapshots are equal because `NEW_BUSINESS_RECEIVES=0`.

| Entity | Current count |
|---|---:|
| Suppliers | 2 |
| Purchase Orders | 6 |
| Purchase Order Items | 6 |
| Assets | 6 |
| Asset Barcode History | 6 |
| Asset Origins | 6 |
| Asset Purchase Cost Revisions | 6 |
| Asset Events | 6 |
| Stock Movements | 0 |
| Journal Entries | 6 |
| Journal Lines | 18 |
| Payments | 0 |
| Audit Logs | 44 |
| Idempotency Requests | 6 |
| SequelizeMeta | 86 |

`current_database()` returned `darfus_erp`. No insert/update/delete/truncate/backfill/seed occurred in this Control.

## 25. Focused Tests

| Suite | Result |
|---|---:|
| Receive/authority/profile/tax/GBW/GBP/Supplier closure focused suite | 54/54 PASS |
| G2A1–G2D tax/location/readiness suite from `backend` working directory | 29/29 PASS |
| TypeScript typecheck | PASS |

The stale Supplier all-profiles test was minimally aligned to read the canonical GBP Inventory page rather than the now redirect-only Supplier page. Three earlier root-level failures were not product failures: two G2A1 tests used old repository-relative paths and the Supplier test asserted the removed legacy form. Running G2A1 from its intended `backend` directory and correcting the stale source target produced the pass results above.

`FOCUSED_TESTS = PASS`

`TYPECHECK = PASS`

## 26. Files Changed

Intentional files touched for this Control:

- `app/[locale]/(dashboard)/suppliers/purchases/page.tsx` — locale-preserving redirect to canonical Inventory.
- `tests/supplier-master-final-closure.test.cjs` — updated stale redirect assertion.
- `backend/tests/supplier-receive-profile-switch-async-preview-race-ux-fix-03.test.cjs` — updated stale redirect assertion.
- `backend/tests/inventory-authority-foundation-01a.test.cjs` — updated stale redirect assertion.
- `backend/tests/supplier-all-asset-profiles-acquisition-payable-pricing-fix-01.test.cjs` — aligned source target/assertions with canonical GBP Inventory receive.
- `docs/DARFUS_SUPPLIER_RECEIVE_V2_FINAL_CLOSURE_REPORT.md` — this report.

The worktree contained extensive pre-existing modifications and untracked acceptance/source files. They were not cleaned, reset, stashed, or taken as part of this Control. `next-env.d.ts` was not edited; the Owner-accepted generated drift remains untouched. No migration was created.

## 27. Gate

All required current closure criteria pass, using current read-only source/browser/DB evidence plus the accepted later G3 receive evidence. No new business receive was necessary, no official DB write was made, and no online production endpoint was contacted.

`SUPPLIER_RECEIVE_V2_FINAL_CLOSED = YES`

`GATE = PASS_SUPPLIER_RECEIVE_V2_FINAL_CLOSURE`

## 28. Final Tokens

```text
CURRENT_CONTROL = DARFUS-SUPPLIER-RECEIVE-V2-FINAL-CLOSURE
LOCAL_MAIN_DB = darfus_erp
SEQUELIZE_META = 86

CAN_REUSE_CURRENT_ACCEPTANCE_EVIDENCE = YES
NEW_CONTROLLED_RECEIVE_REQUIRED = NO
NEW_BUSINESS_RECEIVES = 0

CANONICAL_INVENTORY_RECEIVE_ENTRY = PASS
SINGLE_RECEIVE_ENTRY_POINT = PASS
LEGACY_SUPPLIER_RECEIVE_REDIRECT = PASS
SUPPLIER_PAGE_RECEIVE_CREATE = NO
ACTIVE_SUPPLIER_SELECTOR = PASS
INACTIVE_SUPPLIER_EXCLUSION = PASS_REUSED_SUPPLIER_MASTER_EVIDENCE
LOCATION_DB_AUTHORITY = PASS
LOCATION_BRANCH_SCOPE = PASS
TAX_TREATMENT_POLICY = PASS
RCM_SERVER_AUTHORITY = PASS
PAYMENT_FIELDS_IN_RECEIVE = ABSENT
PAYMENT_RECORD_DELTA = 0

GBW_SHARED_RECEIVE_CONTRACT = PASS
GBP_SHARED_RECEIVE_CONTRACT = PASS
PROFILE_SHARED_PREVIEW_PARITY = PASS
PO_TAX_8DP_AUTHORITY = PASS
SUPPLIER_PAYABLE = PASS
JOURNAL_BALANCE = PASS
ASSET_AUTHORITY = PASS
BARCODE_AUTHORITY = PASS
ORIGIN_AUTHORITY = PASS
COST_REVISION_AUTHORITY = PASS
MOVEMENT_AUTHORITY = PASS_REUSED_G3_EVIDENCE
PRODUCT_QUANTITY_EXCLUSION = PASS
SAME_KEY_REPLAY = PASS
CONFLICTING_REPLAY = PASS
COMPANY_SCOPE = PASS
BRANCH_SCOPE = PASS
PERMISSIONS = PASS
VALIDATION_FAIL_CLOSED = PASS

AR_UI = PASS
EN_UI = PASS
NETWORK = PASS_REUSED_G3_PLUS_CURRENT_HEALTH_READ
CONSOLE = PASS
FOCUSED_TESTS = PASS
TYPECHECK = PASS

MIGRATION_CREATED = NO
ONLINE_PRODUCTION_CONTACTED = NO

GATE = PASS_SUPPLIER_RECEIVE_V2_FINAL_CLOSURE
SUPPLIER_RECEIVE_V2_FINAL_CLOSED = YES
ASSET_FINAL_CLOSED = NO
NEXT_RECOMMENDED_STEP = ASSET_FINAL_CLOSURE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

Boundary status after this closure:

```text
SUPPLIER_MASTER_FINAL_CLOSED = YES
SUPPLIER_RECEIVE_V2_FINAL_CLOSED = YES
ASSET_FINAL_CLOSED = NO
BARCODE_FINAL_CLOSED = NO
RFID_FINAL_CLOSED = NO
GBW_FINAL_CLOSED = NO
GBP_FINAL_CLOSED = NO
SUPPLIER_ACCOUNTS_FINAL_CLOSED = NO
POS_FINAL_CLOSED = NO
```

STOP. Do not begin Asset Final Closure automatically.

`NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`
