# DARFUS ERP — Gem Stone Jewellery Minimum Safe Implementation Report

الحالة الحالية: تم تنفيذ Gem Stone Jewellery مع Receive واحد مصرح به على `darfus_erp`، ثم تم تصحيح واجهة Stone Settings فقط. لم يتم تنفيذ Receive إضافي بعد التصحيح، ولم يتم لمس Diamond أو Loose Gem Stone أو Pearl.

## 1. Executive Summary

- المسار canonical هو `Inventory → Add / Receive Inventory → Gem Stone`، والChooser يفعّل Gem Stone فقط ضمن النطاق المعتمد.
- تم تطبيق نموذج Gem Stone server-authoritative: قطعة مجوهرات واحدة = Asset واحد، مع مكونات أحجار متعددة وCT reconciliation وmaster-data validation.
- تم تنفيذ Receive واحد فقط: PO واحد، Asset واحد، Barcode واحد، Movement واحد، Origin واحد، Cost Revision واحد، Current Valuation واحد، Journal واحد.
- تم إثبات Exact Replay بالمفتاح نفسه (HTTP 201) وSame-key changed payload (HTTP 409)، دون أي صفوف أعمال إضافية.
- تم إصلاح Stone Settings UI مع الحفاظ على `stone.settings: string[]` وmulti-select binding؛ AR وEN أثبتا الاختيار المتعدد والـchips والإزالة بلا أخطاء console.
- الإغلاق النهائي غير معتمد حاليًا: rollback full-route acceptance لم يُنفذ قبل الـlive Receive، ويوجد regression قديم واحد خارج نطاق Gem (`158` manifest rows بدل `157`).

## 2. Authority Lock

- Business authority: `I:/WORK/client-requirements/Gem Stone (Jewellery  Loose Stone).docx`، SHA256 `F605E01954A0910A804C77C202F7C273E8BBA64380CA19738331B33B4A74D9C3`.
- Architecture authority: Asset / Barcode / Supplier Receive V2 / Tax / Accounting / Idempotency.
- Official DB: `darfus_erp`.
- No business implementation for Loose Gem Stone, Pearl, or Diamond in this batch.

## 3. Owner Decisions Applied

- `GEMSTONE_JEWELLERY` هو profile الداخلي.
- One physical jewellery piece = one Asset.
- `Product.quantity` ليس physical inventory authority.
- Treatment optional and DB-master/permission gated.
- Gold rate and VAT remain server/configuration authorities.

## 4. Lessons Learned Applied

- تم فصل historical purchase عن current valuation.
- تم تمرير pre-tax purchase base إلى Supplier V2، مع تطبيق VAT مرة واحدة.
- تم منع الاعتماد على UI labels أو frontend-only authority.
- تم التحقق من الـpayload المحفوظ قبل Confirm.

## 5. Files Changed

Intentional Gem batch files:

- `backend/src/services/gem-stone-jewellery-profile.service.js`
- `backend/src/routes/gem-stone-jewellery-profile.routes.js`
- `backend/src/routes/index.js`
- `backend/src/routes/erp.routes.js`
- `backend/src/services/inventory-v2-runtime.service.js`
- `backend/src/services/supplier-acquisition-preview.service.js`
- `backend/src/services/gold-sale-pricing.service.js`
- `backend/src/services/inventory-master-data-policy.service.js`
- `backend/migrations/20260821020000-gemstone-jewellery-multisetting-and-master-alignment.js`
- `components/inventory/inventory-intake-chooser.tsx`
- `app/[locale]/(dashboard)/inventory/gem-stone/page.tsx`
- `backend/tests/gem-stone-jewellery-minimum-safe-implementation.test.cjs`
- the two existing unified-intake regression tests.

The worktree contained substantial pre-existing drift; no reset, clean, restore, stash, or cleanup was performed.

## 6. Migration / Master Data

Migration `20260821020000-gemstone-jewellery-multisetting-and-master-alignment.js` is additive and forward-only. It creates `asset_gemstone_component_settings` and aligns DB master values with the client/source arrays. Official `SequelizeMeta` count is `88`, and the migration is applied.

Current official Gem master counts:

| Category | Count |
|---|---:|
| GEMSTONE_NAME | 67 |
| GEMSTONE_TYPE | 6 |
| GEMSTONE_SHAPE | 19 |
| GEMSTONE_COLOR | 45 |
| GEMSTONE_TONE | 14 |
| GEMSTONE_TONE_LEVEL | 9 |
| GEMSTONE_SATURATION | 10 |
| GEMSTONE_OPTICAL_EFFECT | 11 |
| GEMSTONE_ORIGIN | 25 |
| GEMSTONE_POSITION | 7 |
| GEMSTONE_SETTING | 47 |

Treatment remains empty; supplied treatment values fail closed rather than being invented.

## 7. Fresh DB Provisioning

Disposable rehearsal DB `darfus_erp_gemstone_rehearsal_20260821` was created and all `88` migrations applied successfully. It was not used as an official business data source. No official master-data seed was performed outside the approved additive migration.

## 8. Canonical UI

`Inventory → Add / Receive Inventory → Gem Stone` is the single Gem Stone entry. No sidebar entry or second receive workflow was added.

## 9. Nine-Section Contract

The page contains Identification, Gold and Weight, Gem Stone Information, Purchase, Current Cost, Sales, Tag and Identity, Location and Status, and Audit and System. Shared Supplier, DB Location, Purchase Date, Tax Treatment, and Tax Summary are reused.

## 10. Item Identification

Description and item code are server-backed. The live item was `Gem Stone Ring` with canonical item code `RNG`.

## 11. Gemstone Component Model

Components are normalized per stone. The live proof used one Ruby component with `2 CT`, `100` stone cost, and an empty optional setting/treatment.

## 12. Component Field Matrix

Name, CT weight, type, shape, color, tone, tone level, saturation, optical effect, origin, position, settings, treatment, cost, current value, and notes are represented according to the client document. Master-backed fields resolve only against active DB master values.

## 13. Multi-Setting

Storage: `asset_gemstone_component_settings`, one row per selected setting. The live receive had no selected setting, so `asset_gemstone_component_settings` remained `0`; the schema and binding were verified.

UI correction after owner feedback:

- Before: native raw `<select multiple>` produced a vertical list with internal scrolling.
- After: accessible `details`/`listbox` with checkbox options, chips, remove buttons, `aria-multiselectable="true"`, RTL/LTR-compatible layout, and bounded option overflow only when content exceeds the list area.
- AR and EN browser proof selected `Antique` and `Bar`, displayed two chips, and removed each value without changing the stored model contract.

## 14. Treatment

Optional, DB-master and permission gated. No treatment master values currently exist; non-empty treatment is rejected with `GEMSTONE_TREATMENT_MASTER_UNAVAILABLE`.

## 15. Total Gem Weight Reconciliation

Declared total CT must equal the exact sum of component CT. The live `2 CT` component matched the declared `2 CT` total.

## 16. Gold Weight Formulas

- `1 CT = 0.20 g`.
- Gross `10 g` minus stone `0.40 g` = net gold `9.60 g`.
- Pure gold `999.9` derives from net gold and the approved purity factor.

## 17. Purchase Financial Mapper

For the live proof:

`gold value 2400 + making 192 + stone cost 100 = pre-tax base 2692`.

Supplier V2 received `unitCost=2692` and `purchaseCost=2692`; it did not receive a tax-inclusive amount.

## 18. Tax Engine

Configured VAT rate was `14%`, resolved dynamically. PO tax base `2692`, VAT `376.88`, total `3068.88`. VAT was applied once.

## 19. Historical Purchase Snapshot

The purchase cost revision persisted historical values: gold value `2400`, making total `192`, component cost `100`, VAT base `2692`, VAT `376.88`, total purchase cost `2692` under the existing V2 revision semantics. The PO remains tax-inclusive at `3068.88` through its tax snapshot.

## 20. Current Valuation

Current valuation is separate from historical purchase:

| Value | Persisted |
|---|---:|
| Current gold rate | 477.33584119 |
| Current gold value | 4582.42407542 |
| Current making value | 240.00 |
| Current component value | 150.00 |
| Current VAT | 696.13937056 |
| Current total | 5668.56344598 |

No historical purchase fallback was used.

## 21. Selling Price / Pricing Policy

Selling price persisted on the Asset as `7000`. Minimum allowed price was `5668.56344598`; expected profit was `1331.43655402`. POS returned the Asset price, not Product quantity pricing.

## 22. Barcode / RFID

Server-generated GS barcode: `GSRNG21000001`. It is unique and linked to the Asset. RFID remained optional and blank.

## 23. Certificates / Images

No certificate or image was required for the live synthetic proof. Certificate/image expansion remains outside this minimum-safe implementation where not required by the current receive contract.

## 24. Permissions / Audit

Authenticated Company/Branch context remained enforced. Asset event, origin, movement, purchase source, and actor evidence were visible in Asset Details. No permission weakening was introduced.

## 25. Profile Preview

AR Profile Preview: `READY`. The live financial result included historical purchase total `3068.88` and current total `5668.56344598`.

## 26. Shared Preview Parity

AR and EN shared previews reached `READY`. Shared Supplier V2 preview used the same pre-tax base and tax context; no frontend VAT recomputation was introduced.

## 27. Exact Prepared Request

The confirmation view retained and displayed the exact production request. Verified before the only Confirm:

| Field | Value |
|---|---:|
| `items[0].unitCost` | 2692 |
| `perPiece[0].purchaseCost` | 2692 |
| `perPiece[0].unitCost` | 2692 |
| `taxIncluded` | false |
| `applyVat` | true |
| `inventoryV2` | true |
| profile | GEMSTONE_JEWELLERY |

## 28. Focused Tests

`backend/tests/gem-stone-jewellery-minimum-safe-implementation.test.cjs`: **7 passed**. It covers classification, weight/formula rules, treatment fail-closed behavior, financial separation, migration structure, unified route, exact request retention, idempotency hashing, and settings UI binding.

## 29. Shared Regressions

Focused shared suite: **53 passed, 1 failed**. The single failure is pre-existing/outside Gem Stone: `backend/tests/inventory-master-data-bootstrap-r2.test.cjs` expects `157` manifest rows while the existing untracked manifest contains `158` (`DCLA`/`IIDGR` authority drift). No Gem fix was applied to that unrelated drift.

## 30. Typecheck / Build

- `npm run typecheck`: PASS.
- `npm run build`: PASS.
- Next route `/ar|en/inventory/gem-stone`: present.
- `next-env.d.ts` preserved at accepted SHA `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651`.

## 31. Runtime Parity

- Backend health: 200.
- DB health: 200.
- Redis health: 200.
- Gold health: 200, `GOLDAPI_IO`, `LIVE_PROVIDER`, AED, fresh, no mock fallback.
- Final receive: HTTP 201 exactly once from the canonical Inventory UI.
- Same-key replay: HTTP 201.
- Same-key changed payload: HTTP 409.
- No second PO, Asset, Movement, Journal, or Barcode was created by replay/conflict.

## 32. AR/EN Preview

AR and EN real browser pages loaded the same canonical form. Both reached Profile Preview `READY` and Shared Receive Preview `READY`. Browser console warnings/errors were empty during the UI proof.

Stone Settings UI proof:

| Token | Result |
|---|---|
| STONE_SETTING_MULTSELECT_UI | PASS |
| AR_STONE_SETTING_UI | PASS |
| EN_STONE_SETTING_UI | PASS |
| STONE_SETTING_BROWSER_PROOF | PASS |
| Keyboard-focusable summary/checkbox controls | PASS (native focusable controls; no hover dependency) |
| Touch click selection/removal | PASS |

## 33. Rollback Full-Route Acceptance

The required exact full-route forced rollback acceptance was **not run before the live Receive**. Therefore `EXACT_GEMSTONE_ROLLBACK_ACCEPTANCE` is `NOT_RUN`, and the final closure gate cannot pass in this report. No rollback or cleanup was attempted after the live Receive.

## 34. Fresh Backup

Backup preceded the live Receive:

- Path: `backend/backups/darfus_erp_PRE_GEM_STONE_JEWELLERY_RECEIVE_20260821.dump`
- Size: `699754` bytes.
- SHA256: `C1AD150AC654E666BBB39C1F1788DBB5D19891B8699847247B2E94BF0A9A5A29`.
- Backup was non-empty and the earlier `pg_restore -l` verification passed.
- Backup timestamp preceded Receive at `2026-08-21 16:48:25`.

## 35. One Live Receive

Exactly one new business Receive was executed on official `darfus_erp` after the approved backup:

- PO: `PO-1787330905244`
- Asset: `AST-PUR-1787330905253-1-1-zo5f`
- Barcode: `GSRNG21000001`
- Journal: `JE-1787330905329`
- Request id: `9b5a991e-05f9-498c-8db8-a350ea309a13`

No Receive was executed after the Stone Settings UI correction.

## 36. DB Persistence

Before/after business counts were `10 → 11` for POs, PO items, Assets, origins, cost revisions, valuations, and movements; `7 → 8` Asset components; `13 → 14` journals; `36 → 39` journal lines; `14 → 15` idempotency rows. The expected one-receive deltas were observed. Gem detail count is `1`; setting relation count is `0` because no setting was selected in the live piece.

## 37. Accounting

Journal `JE-1787330905329` is posted and balanced:

- Debit: `3068.88000000`.
- Credit: `3068.88000000`.
- Inventory debit: `2692`.
- Input VAT debit: `376.88`.
- Accounts Payable credit: `3068.88`.

## 38. Historical/Current Separation

PASS. Historical purchase base/Tax Snapshot and current live-rate valuation are stored separately and differ as expected.

## 39. Selling Price Proof

PASS. Asset price and POS price are both `7000`, and POS selection used the serialized Asset/barcode result.

## 40. Idempotency

PASS. The exact retained request hash matched the DB `request_hash` `66e1c684e233467a88bac54c5d8589057965c257d07d08f16d299113f7679026`. Exact replay returned 201 and changed payload returned 409. Counts remained unchanged at `11/11/11/14` for PO/PO item/Asset/Journal after replay and conflict.

## 41. AR Persisted Asset

PASS. AR Asset Details displayed the Gem Stone Ring, barcode, price, purchase event, PO source, movement, and available status.

## 42. EN Persisted Asset

PASS. EN Asset Details displayed the same identity, barcode, price, PO source, movement, and available status.

## 43. POS Read Proof

PASS. POS search by `GSRNG21000001` returned Gem Stone Ring; selecting the result showed `GEMSTONE JEWELLERY`, barcode `GSRNG21000001`, `21K`, `10 g`, quantity `1`, and AED `7000`. No sale or checkout was executed.

## 44. No-Duplicate Deltas

PASS after exact replay/conflict: no duplicate business rows, no second Asset, no second Barcode, no second Movement, and no second Journal. No cleanup was performed.

## 45. Existing Unrelated P0

Existing `JE-1787090870905` remains present and was not modified. It is unrelated to this Gem Stone receive and remains an existing financial baseline issue.

## 46. P0/P1

- New P0: `0`.
- New P1: `0`.
- Gate blockers: rollback acceptance not run before live Receive; shared R2 manifest regression `158 != 157`.

## 47. Gate

The UI correction itself passes, but the overall closure gate is not passed.

`GATE = BLOCKED_GEM_STONE_ROLLBACK_ACCEPTANCE_AND_SHARED_R2_REGRESSION`

`GEM_STONE_JEWELLERY_FINAL_USER_WORKFLOW_CLOSED = NO`

## 48. Final Tokens

```text
CURRENT_CONTROL = DARFUS-GEM-STONE-JEWELLERY-MINIMUM-SAFE-IMPLEMENTATION
LOCAL_MAIN_DB = darfus_erp
CLIENT_AUTHORITY_FILE = I:/WORK/client-requirements/Gem Stone (Jewellery  Loose Stone).docx
STONE_TREATMENT = OPTIONAL_DB_MASTER_PERMISSION_GATED
GEM_STONE_CANONICAL_UI = PASS
GEM_STONE_CHOOSER = ENABLED
MULTI_SETTING_STORAGE = PASS
MASTER_DATA_SOURCE_DB_DRIFT = CLOSED
FRESH_DB_GEM_STONE_PROVISIONING = PASS
TOTAL_GEMSTONE_WEIGHT_RECONCILIATION = PASS
CT_TO_GRAMS = PASS
NET_GOLD_FORMULA = PASS
PURE_GOLD_FORMULA = PASS
PURCHASE_FINANCIAL_MAPPER = PASS
VAT_ENGINE = PASS
HISTORICAL_PURCHASE_IMMUTABLE = PASS
CURRENT_VALUATION_NO_HISTORY_FALLBACK = PASS
SELLING_PRICE_MAPPING = PASS
MINIMUM_PRICE_POLICY = PASS
GS_BARCODE = PASS
RFID_OPTIONAL = PASS
PERMISSIONS = PASS
AUDIT = PASS
PROFILE_PREVIEW = PASS
SHARED_PREVIEW_PARITY = PASS
UNDEFINED_NAMED_REPLACEMENT_RISK = CLOSED
MASTER_ARRAY_SCALAR_VALIDATION = PASS
STONE_SETTING_MULTISELECT_UI = PASS
AR_STONE_SETTING_UI = PASS
EN_STONE_SETTING_UI = PASS
STONE_SETTING_BROWSER_PROOF = PASS
FOCUSED_TESTS = PASS (7/7)
SHARED_REGRESSIONS = FAIL (53/54; pre-existing R2 manifest mismatch)
TYPECHECK = PASS
FRONTEND_BUILD = PASS
BACKEND_RUNTIME_PARITY = PASS
FRONTEND_RUNTIME_PARITY = PASS
AR_PREVIEW = PASS
EN_PREVIEW = PASS
EXACT_GEMSTONE_ROLLBACK_ACCEPTANCE = NOT_RUN
PERSISTENT_BUSINESS_DELTA = 1 authorized live Receive
PRE_RECEIVE_BACKUP = PASS
PRE_RECEIVE_BACKUP_PATH = backend/backups/darfus_erp_PRE_GEM_STONE_JEWELLERY_RECEIVE_20260821.dump
PRE_RECEIVE_BACKUP_SHA256 = C1AD150AC654E666BBB39C1F1788DBB5D19891B8699847247B2E94BF0A9A5A29
BACKUP_PRECEDES_RECEIVE = YES
SUCCESSFUL_NEW_RECEIVE_COUNT = 1
CREATED_PO = PO-1787330905244
CREATED_ASSET = AST-PUR-1787330905253-1-1-zo5f
CREATED_BARCODE = GSRNG21000001
CREATED_JOURNAL = JE-1787330905329
COMPONENT_COUNT = 1
JOURNAL_BALANCED = YES
HISTORICAL_CURRENT_SEPARATION = PASS
SELLING_PRICE_PERSISTENCE = PASS
IDEMPOTENCY_REPLAY = PASS (201)
IDEMPOTENCY_CONFLICT = PASS (409)
AR_ASSET_DETAILS = PASS
EN_ASSET_DETAILS = PASS
AR_EN_ASSET_PARITY = PASS
GEM_STONE_POS_PRICE_AUTHORITY = PROVEN
POS_SALE_EXECUTED = NO
PURCHASE_ORDERS_DELTA = 1
PURCHASE_ORDER_ITEMS_DELTA = 1
ASSET_COUNT_DELTA = 1
COMPONENT_DELTA = 1
GEM_DETAIL_DELTA = 1
BARCODE_DELTA = 1
RFID_DELTA = 0
ORIGIN_DELTA = 1
PURCHASE_REVISION_DELTA = 1
CURRENT_VALUATION_DELTA = 1
MOVEMENT_DELTA = 1
JOURNAL_DELTA = 1
CASH_DELTA = 0
IDEMPOTENCY_DELTA = 1
DUPLICATE_BUSINESS_ROWS = 0
UNINTENDED_FINANCIAL_SIDE_EFFECTS = 0
PRE_EXISTING_UNRELATED_FINANCIAL_P0 = PRESENT_JE_1787090870905
PRE_EXISTING_P0_CHANGED = NO
P0_NEW = 0
P1_NEW = 0
ONLINE_PRODUCTION_CONTACTED = NO
GATE = BLOCKED_GEM_STONE_ROLLBACK_ACCEPTANCE_AND_SHARED_R2_REGRESSION
GEM_STONE_JEWELLERY_FINAL_USER_WORKFLOW_CLOSED = NO
GEM_STONE_JEWELLERY_MODULE_STATUS = OPEN
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

No further Receive, no cleanup, no rollback, no master-data mutation, and no new profile was started after this report update.

Recommended next step: Owner review of the rollback-gate exception and the pre-existing R2 manifest mismatch; only then authorize any closure rerun.

`NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`
