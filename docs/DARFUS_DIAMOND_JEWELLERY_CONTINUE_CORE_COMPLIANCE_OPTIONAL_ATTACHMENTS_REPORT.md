# DARFUS ERP — Diamond Jewellery Continue Core Compliance + Full Receive UI

Control ID: `DARFUS-DIAMOND-JEWELLERY-CONTINUE-CORE-COMPLIANCE-OPTIONAL-ATTACHMENTS`

Target: Diamond Jewellery only  
Official database: `darfus_erp`  
Runtime: `http://localhost:3000` / `http://localhost:8000`  
Mode: implementation + focused tests + read-only browser/DB proof  
Final Receive: not executed

## Executive Summary

تم تنفيذ الجزء الأساسي المطلوب لـ Diamond Jewellery. تم إبقاء الصور ومرفقات الشهادات `OPTIONAL_DEFERRED` ولم تعد حاجزًا أمام Core Receive.

النتيجة الحالية:

- وصف القطعة أصبح Server-authoritative ومربوطًا بكود الصنف؛ `Diamond Brooch → BRH` ثبت في المتصفح.
- ألوان الألماس أصبحت منفصلة عن Gold Color، و`Fancy Blue` يعمل عبر master contract.
- الحقول المطلوبة والاختيارية، المعاينة Profile، المعاينة المشتركة، VAT، التكلفة الحالية، Markup، Minimum Selling Price، Expected Profit، وProfit Margin أصبحت ظاهرة ومترابطة.
- زر `Receive Inventory` موجود، لا يعمل إلا بعد جاهزية المعاينتين والصلاحية، ويفتح Confirmation قبل أي POST.
- تم فتح Confirmation وإلغاؤه في المتصفح. لم يتم الضغط على `Confirm Receive`، ولم يُرسل `POST /api/v1/purchase-orders/receive`.
- تمت إضافة دفاع خادمي ضد السعر الأقل من الحد الأدنى في مسار V2 المباشر باستخدام نفس Preview/Tax/Gold authority.
- لا توجد Migration أو Seed أو Official DB business mutation في هذا الباتش.

## Authority and Read Evidence

| Evidence | Result |
|---|---|
| Primary business authority | `I:\WORK\client-requirements\Diamond (Jewellery  Loose Stone).docx` |
| Client document coverage | Previous audit recorded complete 82-page extraction and visual verification, with 0 unmapped visual requirements |
| Latest execution instruction | `C:\Users\NEGM\.codex\attachments\1354b409-4790-456e-8ed8-1202434fbd9b\pasted-text.txt` read completely before implementation |
| Previous blocked report | `docs/DARFUS_DIAMOND_JEWELLERY_CLIENT_COMPLIANCE_IMPLEMENTATION_FULL_RECEIVE_UI_REPORT.md` used as the gap map |
| Scope | Diamond Jewellery only; no Loose Diamond, Gemstone, or Pearl implementation |
| Attachment decision | Images and certificate attachments are optional and deferred |

The client document remains the business authority. Frozen DARFUS Asset, Barcode, Supplier V2, Tax, Accounting, RBAC, Company/Branch, and Idempotency authorities were preserved.

## Core Requirements and Reference Traceability

| Requirement | Implementation | Evidence |
|---|---|---|
| One Jewellery piece = one Asset | Preserved in V2 contract/runtime | `diamond-jewellery-profile.service.js:288-300`; existing `inventory-v2-runtime.service.js` authority |
| No Product.quantity physical authority | Preserved | Existing V2 policy and receive route guard; no Product identity is sent by the new UI |
| Diamond Jewellery separate from Loose Diamond | Preserved | `PROFILE = DIAMOND_JEWELLERY`; no Loose Diamond route or UI added |
| Inventory → Add/Receive → Diamond Jewellery | Implemented | `app/[locale]/(dashboard)/inventory/diamond-jewellery/page.tsx` |
| Item Description → Item Code | Implemented server-side | `diamond-jewellery-profile.service.js:16-68`; UI displays read-only canonical code |
| Brooch mapping | Implemented and browser-proven | `Diamond Brooch → BRH` in EN and AR browser journeys |
| Gold Color separate from Diamond Color | Implemented | Separate UI controls and `DIAMOND_COLOR` server category |
| Diamond Color master binding | Implemented | Master-backed `D-Z` plus separate Fancy values; `Fancy Blue` browser-proven |
| Diamond Type, Clarity, Shape, Treatment | Implemented | Server master index and selectors |
| Tone, Tone Level, Saturation, Cut | Implemented as optional fields | Server-backed selectors; browser values selected successfully |
| Origin, Position, Setting | Implemented as optional master-backed fields | Browser selected `Australia`, `Center Stone`, `Four Prong` |
| Other descriptions | Implemented conditionally | Server validation and UI conditional fields |
| Certificate Number → Authority | Implemented | Server dependency and Certificate Authority selector; attachments remain deferred |
| Historical purchase section | Implemented | Historical Gold Price, Gold Value, Making, Diamond Cost, Purchase VAT, Total Purchase Cost |
| Current cost section | Implemented | Gold Center rate, Current Gold Value, Current Making, Current Diamond Value, Current VAT, Total Current Cost |
| Sales section | Implemented | Optional Markup/Discount, required Selling Price, derived minimum/profit/margin |
| Decimal/high-precision margin | Implemented server-side | `calculatePreview()` uses Decimal and returns `profitMarginPercent` |
| Unified Profile Preview | Implemented | `/inventory-v2/diamond-jewellery/preview` |
| Shared Receive Preview | Implemented | `/inventory-v2/receive-preview` |
| Canonical Receive preparation | Implemented, not executed | UI prepares `/purchase-orders/receive`, `inventoryV2=true`, `profile=DIAMOND_JEWELLERY` |
| Confirmation before mutation | Implemented | `openConfirmation()` only opens modal; `confirmReceive()` is separate |
| Idempotency preparation | Implemented | One generated key retained in `receiveKeyRef` for logical retry |
| Optional attachments | Deferred | No file input, upload, staged token, or fake success added |

## Full Receive UI Readiness

The new page implements one readiness gate:

`valid input → Profile Preview → Shared Receive Preview → current fingerprints match → permission → Receive enabled`

Required readiness includes item description, karat, supplier, purchase date, location, tax treatment, gross weight, total Diamond CT, one or more components, historical gold price, positive selling price, and each required component field. Optional fields do not block readiness: images, certificate attachments, Tone, Tone Level, Saturation, Cut, Stone Cost, current making/current diamond value, Markup, Maximum Discount, and RFID.

The UI invalidates both previews when dependencies change. A CT mismatch was tested in the Arabic browser: the server returned the friendly Arabic validation message and both readiness badges changed to `غير جاهزة`.

## Attachment Architecture

| Feature | Status | Decision |
|---|---|---|
| Item Images | `OPTIONAL_DEFERRED` | No unsafe pre-Asset upload workaround |
| Certificate Attachments | `OPTIONAL_DEFERRED` | Certificate text fields remain functional; no staged attachment mutation |
| Safe staged/pre-Asset architecture | Not implemented in this batch | Deferred to a separately approved design |

No attachment table, migration, upload endpoint, temporary token, orphan cleanup, or file mutation was added.

## Server Changes

### Profile authority

`backend/src/services/diamond-jewellery-profile.service.js:16-68,216-305` now owns:

- canonical 17 Diamond Jewellery descriptions and item-code map;
- accepted Diamond Type, Color, Clarity, Cut, Shape, Treatment values from the existing master-data policy;
- master-index resolution for active company master rows;
- certificate authority validation when a master authority list exists;
- optional Tone/Level/Saturation/Origin/Position/Setting normalization;
- exact component CT reconciliation, net-gold validation, and Decimal calculations;
- current/purchase VAT and server-side Profit Margin output.

### Profile preview route

`backend/src/routes/diamond-jewellery-profile.routes.js:17-50` loads the same active company-scoped master categories and passes them to `calculatePreview()`.

### Supplier V2 runtime

`backend/src/services/inventory-v2-runtime.service.js:136-157` resolves Diamond master data through context and requires a positive sale price for final V2 Diamond pieces.

### Canonical receive defense

`backend/src/routes/erp.routes.js:78-81,5259-5260,8143-8156`:

- loads active Diamond master data from the company database;
- passes that authority into V2 normalization;
- reuses `diamondJewelleryProfileService.calculatePreview()` before persistence;
- rejects `DIAMOND_SALE_PRICE_BELOW_MINIMUM` if the direct server payload bypasses UI readiness.

This did not add a route and did not alter Accounting authority.

## Frontend Changes

`app/[locale]/(dashboard)/inventory/diamond-jewellery/page.tsx` now has one complete nine-section form:

1. Piece identification and canonical read-only Item Code.
2. Gold and weight facts plus derived gold weights.
3. One-to-many Diamond components with required and optional fields.
4. Historical purchase values and Purchase VAT from server Preview.
5. Current cost and Current VAT from server Preview.
6. Markup, Selling Price, Minimum, Expected Profit, Profit Margin.
7. Barcode family, RFID, and server tag state.
8. Server lifecycle/Company/Branch/Location context.
9. Audit/system display fields.

`components/inventory/shared-receive-section.tsx:128-151` received only stable React keys for placeholder options; no business behavior changed.

## Focused Tests

Command:

```text
node --test tests/diamond-jewellery-authority-implementation.test.cjs tests/diamond-negative-shared-preview.test.cjs tests/diamond-jewellery-core-compliance.test.cjs
npm run typecheck
```

Result: `13 passed, 0 failed`; TypeScript typecheck passed. Node syntax checks passed for the changed backend modules.

Coverage includes:

- exact CT and net-weight validation;
- all canonical description/code identity behavior represented by the mapping;
- forged Brooch/RNG rejection;
- Fancy Blue accepted and Gold Color rejected as Diamond Color;
- master-backed optional dimensions and certificate dependency;
- server V2 sale-price requirement and minimum-price guard presence;
- Profile/Shared Preview source boundary;
- confirmation, canonical endpoint preparation, deferred attachments, and absence of Owner Authorization text;
- previous shared-preview negative cases.

## Browser / Network Evidence

Browser used: Codex in-app browser, existing local main frontend.

### English journey

URL: `http://localhost:3000/en/inventory/diamond-jewellery`

Observed:

- authenticated Company/Branch context loaded;
- DB-backed Supplier and Location selectors loaded;
- Tax Treatment loaded from company policy;
- all Diamond master selectors loaded;
- `Diamond Brooch` selected and read-only code displayed as `BRH`;
- `Fancy Blue`, `Bright`, `Medium`, `Vivid`, `Australia`, `Center Stone`, and `Four Prong` selected;
- Purchase VAT displayed as `AED 353.08`;
- Current VAT displayed as `AED 832.48349743`;
- Minimum Selling Price displayed as `AED 6,778.79419333`;
- Expected Profit and Profit Margin displayed;
- `Profile Preview: READY` and `Shared Receive Preview: READY`;
- `Receive Inventory` enabled;
- confirmation opened with Supplier, Location, date, description, `BRH`, weights, tax treatment, totals, and selling price;
- confirmation cancelled; `Confirm Receive` disappeared.

### Arabic journey

URL: `http://localhost:3000/ar/inventory/diamond-jewellery`

Observed:

- Arabic labels and friendly validation messages loaded;
- same DB-backed selectors and master values loaded;
- same `BRH` mapping and Fancy Blue/optional dimension selections;
- Purchase VAT, Current VAT, minimum, profit, and margin displayed;
- `معاينة الملف: جاهزة` and `المعاينة المشتركة: جاهزة`;
- `استلام المخزون` enabled;
- CT mismatch `1.60000000` versus component `1.50000000` returned the Arabic mismatch message and changed both readiness states to not ready;
- restoring exact CT returned both readiness states to ready.

### Mutation boundary

The Receive button was clicked only to open the confirmation. `Confirm Receive` was never clicked. No final Receive request was sent. No PO, Asset, Barcode, RFID, movement, journal, payment, or attachment was created by this batch.

## Runtime and DB Safety

The official target was verified by a read-only health/database check. The active backend process was reloaded from the current mounted source with `NODE_ENV=test` and `PORT=8000` without running compose, migrations, seed, or setup bootstrap.

Read-only health result:

```text
GET http://localhost:8000/api/v1/health → 200
database = darfus_erp
```

The post-browser read-only DB snapshot was:

| Table | Count |
|---|---:|
| purchase_orders | 7 |
| assets | 7 |
| inventory_asset_movements | 7 |
| stock_movements | 0 |
| asset_barcode_history | 7 |
| journal_entries | 10 |
| journal_lines | 27 |
| payments | 0 |

These are observations only; no SQL INSERT/UPDATE/DELETE/TRUNCATE/seed/backup was executed.

## Accounting / Tax / Asset Authority

No final Receive was run, so no new Accounting/Payable/Asset assertion was created in this control. The implementation continues to use the existing canonical V2 persistence path. The new UI obtains Purchase VAT and Current VAT from server calculation; React does not calculate VAT independently.

The server-side direct-receive price defense reuses the existing Gold Center reference rate and transaction Tax Context. No new Diamond pricing engine, Tax Engine, Accounting mapper, Barcode service, or Asset authority was introduced.

## Known Deferred / Not Executed Items

| Item | Status | Reason |
|---|---|---|
| Final Diamond Receive | Not executed | Explicit control prohibition |
| PO/Asset/Barcode/RFID/Movement/Journal/Payment proof | Not executed | Requires final Receive and is deferred to controlled acceptance batch |
| Idempotent replay/conflicting replay runtime proof | UI/server preparation only | No mutation permitted in this batch |
| Attachment upload and persistence | Optional deferred | Safe staged pre-Asset architecture is not part of this batch |
| Loose Diamond | Not touched | Explicit scope exclusion |
| Gemstone/Pearl | Not touched | Explicit scope exclusion |
| Migration/Seed/Master provisioning | Not executed | Explicit guardrail |

## Worktree Safety

The worktree was already materially dirty before this batch. Read-only status showed many pre-existing tracked modifications and untracked authority/source/report files. No reset, restore, clean, stash, add, commit, or push was executed.

Intentional files for this batch:

- `backend/src/services/diamond-jewellery-profile.service.js`
- `backend/src/routes/diamond-jewellery-profile.routes.js`
- `backend/src/services/inventory-v2-runtime.service.js`
- `backend/src/routes/erp.routes.js` (scoped Diamond master/price guard additions; file also had pre-existing drift)
- `app/[locale]/(dashboard)/inventory/diamond-jewellery/page.tsx`
- `components/inventory/shared-receive-section.tsx`
- `tests/diamond-jewellery-authority-implementation.test.cjs`
- `tests/diamond-negative-shared-preview.test.cjs`
- `tests/diamond-jewellery-core-compliance.test.cjs`
- `docs/DARFUS_DIAMOND_JEWELLERY_CONTINUE_CORE_COMPLIANCE_OPTIONAL_ATTACHMENTS_REPORT.md`

## Gate

```text
DIAMOND_CLIENT_DOC_CORE_ADD_RECEIVE_COMPLIANCE = PASS
DIAMOND_FULL_RECEIVE_UI_READY = YES
ATTACHMENT_ARCHITECTURE = OPTIONAL_DEFERRED
PROFILE_PREVIEW = READY_PROVEN_AR_EN
SHARED_RECEIVE_PREVIEW = READY_PROVEN_AR_EN
FINAL_RECEIVE_EXECUTED = NO
UNAUTHORIZED_DIAMOND_RECEIVE_MUTATION = NONE_OBSERVED
P0_BLOCKERS = 0
P1_BLOCKERS = 0
GATE = READY_FOR_ONE_CONTROLLED_DIAMOND_JEWELLERY_UI_RECEIVE_ACCEPTANCE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Final Tokens

```text
CONTROL_ID = DARFUS-DIAMOND-JEWELLERY-CONTINUE-CORE-COMPLIANCE-OPTIONAL-ATTACHMENTS
PRIMARY_BUSINESS_REFERENCE = I:\\WORK\\client-requirements\\Diamond (Jewellery  Loose Stone).docx
DIAMOND_CLIENT_DOC_RE_READ_COMPLETELY = YES
EXECUTION_INSTRUCTION_READ_COMPLETELY = YES
PREVIOUS_BLOCKED_REPORT_USED = YES

ITEM_IMAGES = OPTIONAL_DEFERRED
CERTIFICATE_ATTACHMENTS = OPTIONAL_DEFERRED
ATTACHMENTS_REQUIRED_FOR_CORE_RECEIVE = NO

ITEM_CODE_AUTHORITY = SERVER_DESCRIPTION_TO_ITEM_CODE
DIAMOND_BROOCH_ITEM_CODE = BRH
DIAMOND_COLOR_MASTER_BINDING = PASS
GOLD_COLOR_SEPARATE_FROM_DIAMOND_COLOR = YES
TONE_LEVEL_SATURATION_ORIGIN_POSITION_SETTING = READY
CERTIFICATE_TEXT_DEPENDENCY = PASS

PROFILE_PREVIEW = PASS
SHARED_RECEIVE_PREVIEW = PASS
FULL_RECEIVE_UI = READY
CONFIRMATION_UX = PASS
IDEMPOTENCY_UI_PREPARED = YES
FINAL_RECEIVE_EXECUTED = NO

OFFICIAL_DATABASE = darfus_erp
OFFICIAL_DB_WRITES_THIS_BATCH = 0
MIGRATION_CREATED = NO
MIGRATION_EXECUTED = NO
SEED_EXECUTED = NO
BUSINESS_MUTATIONS_THIS_BATCH = 0

FOCUSED_TESTS = 13
FOCUSED_TESTS_PASS = 13
TYPECHECK = PASS
BROWSER_AR = PASS_READ_ONLY
BROWSER_EN = PASS_READ_ONLY
DB_PROOF = READ_ONLY
ACCOUNTING_RUNTIME_PROOF = DEFERRED_NO_RECEIVE
IDEMPOTENCY_RUNTIME_PROOF = DEFERRED_NO_RECEIVE

DIAMOND_CORE_IMPLEMENTATION_BLOCKED_BY_ATTACHMENTS = NO
DIAMOND_FULL_RECEIVE_UI_READY = YES
GATE = READY_FOR_ONE_CONTROLLED_DIAMOND_JEWELLERY_UI_RECEIVE_ACCEPTANCE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP

Owner review is required before any controlled Diamond Jewellery Receive acceptance. No Receive, mutation proof, attachment architecture, Loose Diamond, or next batch was started automatically.
