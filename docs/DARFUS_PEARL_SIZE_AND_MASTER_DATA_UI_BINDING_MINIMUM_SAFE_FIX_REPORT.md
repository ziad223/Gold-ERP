# DARFUS ERP — Pearl Size & Master Data UI Binding Minimum Safe Fix Report

## 1. Executive Summary

تم تنفيذ إصلاح UI محدود لعيب ربط Pearl Size. السبب كان أن الواجهة تستخدم `row.id` كقيمة صحيحة للحفظ، لكنها كانت تعرض `row.id` نفسه كـlabel. عقد الـAPI يعيد القيمة الرقمية و`displayValue` و`label` بالفعل؛ لذلك لم يكن هناك داعٍ لتعديل Backend أو Master Data.

الإصلاح يفصل بين:

- قيمة الاختيار المحفوظة: canonical `PSMD-*` reference.
- القيمة المعروضة: قيمة رقمية مختصرة بوحدة `mm`.
- ترتيب القائمة: numeric ascending.

تم التحقق من AR وEN على `localhost:3000` بعد تحميل build جديد، دون Confirm أو Receive أو أي كتابة أعمال.

## 2. Scope / Authorization

Control: `DARFUS-PEARL-SIZE-AND-MASTER-DATA-UI-BINDING-MINIMUM-SAFE-FIX`

المسموح والمنفذ: Pearl Size label/value binding، numeric sorting، selector audit، focused tests، typecheck، AR/EN browser proof.

غير منفذ: Auth fix، Tax/Accounting/Inventory logic، Receive، Retry، Migration، Seed، Master Data mutation، Production.

## 3. Latest Client Authority SHA

| Field | Value |
|---|---|
| File | `I:\WORK\client-requirements\Pearl.docx` |
| Size | `68946` bytes |
| SHA256 | `2EBACAE8A77724553353D5366EDCA9000CE8A644505FDC95F1198AF39D497D2E` |
| Read | Complete text extraction and visual render review, pages 1–74 |

المرجع يحدد Pearl Size كحقل اختياري، input من قائمة، والقيم من `1 mm` إلى `20 mm` بزيادة `0.5 mm`، مع حفظ القيمة عبر Master Data canonical reference وإتاحة الإضافة حسب الصلاحيات.

## 4. Observed Defect

قبل الإصلاح كانت قائمة Pearl Size في AR تعرض `PSMD-*` بدلًا من `1 mm`, `8.5 mm`, `10 mm` وغيرها. القيمة الداخلية كانت صحيحة للحفظ، لكن label المستخدم كان خاطئًا.

Classification: `PEARL-UI-MASTER-001 / UI_MASTER_DATA_LABEL_BINDING_DEFECT`.

## 5. Root Cause

الخلل المثبت في `app/[locale]/(dashboard)/inventory/pearl/page.tsx`:

- API contract يعيد `id`, `value`, `displayValue`, `label`, `unit`.
- الصفحة كانت تستخدم `pearlSizes.map(row => row.id)` مع `SelectField` الذي يعرض نفس النص كـvalue وlabel.
- النتيجة: `PSMD-*` كان canonical value وواجهة العرض في الوقت نفسه.

لا يوجد تعارض في schema أو Master Data. الإصلاح Frontend-only.

## 6. Files Changed

| File | Change |
|---|---|
| `app/[locale]/(dashboard)/inventory/pearl/page.tsx` | فصل option value عن label، تنسيق mm، numeric sort |
| `tests/pearl-size-ui-binding.test.cjs` | focused static/contract regression tests |
| `docs/DARFUS_PEARL_SIZE_AND_MASTER_DATA_UI_BINDING_MINIMUM_SAFE_FIX_REPORT.md` | هذا التقرير |

Backend source change: `NO`.

الـworktree كان يحتوي على تغييرات سابقة كثيرة؛ لم يتم تنظيفها أو استلامها ضمن هذا Control.

## 7. Pearl Size API Contract

المسار:

`GET /api/v1/inventory-v2/pearl-jewellery/contract`

المصدر:

- `backend/src/routes/pearl-jewellery-profile.routes.js:23,32`
- `backend/src/services/pearl-size-master-data.service.js:24,33`
- `backend/src/models/pearlSizeMasterData.model.js`

الـserialized row يحتوي على:

`id`, `value`, `displayValue`, `label`, `unit`, `isActive`, `sortOrder`, `isOwnerApprovedInitial`.

الـlist server-side يطلب active values فقط ويرتبها حسب `sortOrder`, `value`, `id`.

## 8. Pearl Size Label/Value Mapping

| UI concern | Current authority | Result |
|---|---|---|
| Option value | `row.id` | Canonical `PSMD-*` preserved |
| Option label | numeric `row.value`/`displayValue` + lower-case unit | `1 mm`, `1.5 mm`, `10 mm` |
| Saved request identity | selected native option value | Canonical reference preserved |
| Decimal noise | trailing zero removal only for display | stored precision unchanged |
| Empty selection | `—` | remains optional |

`DISPLAY_VALUE_SEPARATION = PASS`.

## 9. Numeric Sorting

The UI builds a temporary numeric sort key from `row.value` and sorts ascending before rendering. It does not sort the display strings lexicographically.

`PEARL_SIZE_SORT = NUMERIC_ASC`.

## 10. Client 39-Value Size List Proof

Read-only SQL against `darfus_erp`:

| Check | Result |
|---|---:|
| Active Pearl Size rows, unit `MM` | 39 |
| Owner-approved initial active rows | 39 |
| Minimum | 1.00000000 |
| Maximum | 20.00000000 |
| Baseline values | 1 to 20 by 0.5 |
| Extra custom values | 0 |

`CLIENT_BASELINE_VALUES_PRESENT = YES`.
`CLIENT_PEARL_SIZE_LIST_MATCH = PASS`.

## 11. Permission-Gated Add New

The dedicated server path exists and remains permission-gated:

- `POST /api/v1/pearl-size-master-data` requires `settings.update` or `inventory.adjust`.
- `PATCH /api/v1/pearl-size-master-data/:id` uses the same write guard.
- New values are normalized and protected by the company/value/unit uniqueness boundary.

No inline uncontrolled free-text save was added to Pearl UI.

`ADD_NEW_SIZE = YES_PERMISSION_GATED_SERVER_PATH`.
`ADD_NEW_SIZE_PERMISSION_GATED = PASS`.

## 12. All Pearl Selector Audit

The Pearl page uses business labels for profile selectors from `masters[].label`: Type, Color, Overtone, Orient, Shape, Luster, Origin, and Gold Color. Item Description uses the contract business value. Supplier and Location use the shared receive selector contract, which renders business names/codes while retaining IDs for requests.

| Selector | User-facing label | Internal reference preserved | Active-only | AR | EN |
|---|---|---|---|---|---|
| Pearl Size | `x mm` | YES | YES | PASS | PASS |
| Pearl Type | business label | YES | YES | PASS | PASS |
| Pearl Color | business label | YES | YES | PASS | PASS |
| Pearl Overtone | business label | YES | YES | PASS | PASS |
| Pearl Orient | business label | YES | YES | PASS | PASS |
| Pearl Shape | business label | YES | YES | PASS | PASS |
| Pearl Luster | business label | YES | YES | PASS | PASS |
| Pearl Surface Quality | business label | YES | YES | PASS | PASS |
| Pearl Nacre Quality | business label | YES | YES | PASS | PASS |
| Pearl Origin | business label | YES | YES | PASS | PASS |
| Certificate Authority | server contract/master label | YES | YES | PASS | PASS |
| Gold Color | business label | YES | YES | PASS | PASS |
| Supplier | supplier name | YES | active supplier filter | PASS | PASS |
| Location | location code/name | YES | active branch scope | PASS | PASS |
| Item Description | business description | item code derived server-side | contract | PASS | PASS |

No `PSMD-*` or `PMD-*` value was visible as a selector label after the fix.

## 13. Focused Tests

Command:

`node --test tests/pearl-size-ui-binding.test.cjs tests/pearl-jewellery-minimum-safe-implementation.test.cjs`

Result: 7 passed, 0 failed.

Covered:

- raw PSMD IDs are not used as visible Pearl Size labels;
- canonical ID remains the option value;
- business label rendering;
- numeric sorting contract;
- server serializer exposes identity and label;
- existing Pearl profile regression tests.

## 14. AR Browser Proof

URL: `http://localhost:3000/ar/inventory/pearl`

Read-only evidence after reload:

- active Pearl Size options: 39;
- first value: `1 mm`;
- last value: `20 mm`;
- numeric order: PASS;
- selecting `8.5 mm` displayed `8.5 mm`;
- selected option value remained canonical `PSMD-*` reference;
- `PSMD-*` not present in the visible DOM snapshot;
- console errors: 0;
- Confirm was not clicked.

`AR_BROWSER_PROOF = PASS`.

## 15. EN Browser Proof

URL: `http://localhost:3000/en/inventory/pearl`

Read-only evidence after reload:

- active Pearl Size options: 39;
- first value: `1 mm`;
- last value: `20 mm`;
- numeric order: PASS;
- selecting `10.5 mm` displayed `10.5 mm`;
- selected option value remained canonical `PSMD-*` reference;
- `PSMD-*` not present in the visible DOM snapshot;
- console errors: 0;
- Confirm was not clicked.

`EN_BROWSER_PROOF = PASS`.

## 16. Preview Proof

No form completion or Preview POST was required for the label-binding proof. The selector interaction remained local UI state only. The prepared request path in source still uses `pearlSizeId` and does not replace the canonical reference with free text.

`PREVIEW_LABEL_PROOF = PASS_STATIC_UI_AND_REFERENCE`.

## 17. DB/Migration Proof

The official database was queried read-only before and after the UI proof.

| Entity | Before | After |
|---|---:|---:|
| `pearl_size_master_data` | 39 | 39 |
| `purchase_orders` | 12 | 12 |
| `assets` | 12 | 12 |
| `journal_entries` | 15 | 15 |
| `idempotency_requests` | 16 | 16 |

`DATABASE = darfus_erp` was verified by `current_database()`.

`MIGRATIONS_EXECUTED = 0`.
`MASTER_DATA_MUTATION = 0`.
`BUSINESS_WRITES = 0`.

Backend logs during browser proof showed Pearl contract GET 200 only; no new `purchase-orders/receive` request.

## 18. Auth Scope Exclusion

The previous Auth forensic finding remains unchanged: aged Access JWT before Confirm, successful refresh, and deliberate refusal to auto-replay unsafe POST.

This Control did not modify Auth, refresh, Confirm, or retry behavior.

`AUTH_FIX_THIS_CONTROL = NO`.
`RECEIVE_EXECUTED = NO`.
`LIVE_CONFIRM_CLICKS = 0`.

## 19. LL-012

`LL-012 — INTERNAL MASTER IDs MUST NOT LEAK INTO CUSTOMER SELECTOR LABELS`

Permanent regression rule: every customer-facing master selector must separate display label from canonical stored reference and reject internal-ID-shaped labels.

## 20. P0/P1

The UI defect was non-financial and is closed by this Control. No open P0/P1 issue was introduced or observed.

`P0_COUNT = 0`.
`P1_COUNT = 0`.

## 21. Gate

All success conditions are satisfied:

- Pearl Size shows business mm labels;
- no PSMD ID is visible as a selector label;
- canonical reference remains the selected value;
- 39 client baseline sizes are present;
- numeric sorting passes;
- other Pearl selectors use business labels;
- AR and EN pass;
- focused tests and TypeScript pass;
- no migration, seed, business write, Receive, or retry occurred.

`GATE = PASS_PEARL_SIZE_AND_MASTER_DATA_UI_BINDING_MINIMUM_SAFE_FIX`.

## 22. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PEARL-SIZE-AND-MASTER-DATA-UI-BINDING-MINIMUM-SAFE-FIX
LOCAL_MAIN_DB = darfus_erp
CLIENT_AUTHORITY_FILE = Pearl.docx
CLIENT_AUTHORITY_SIZE_BYTES = 68946
CLIENT_AUTHORITY_SHA256 = 2EBACAE8A77724553353D5366EDCA9000CE8A644505FDC95F1198AF39D497D2E
ROOT_CAUSE = Pearl page rendered canonical row.id as both option value and visible label; API already supplied numeric value/label
SOURCE_FILES_CHANGED = app/[locale]/(dashboard)/inventory/pearl/page.tsx; tests/pearl-size-ui-binding.test.cjs
BACKEND_CHANGE = NO
MIGRATION_REQUIRED = NO_EXPECTED
MIGRATIONS_EXECUTED = 0
MASTER_DATA_MUTATION = 0
BUSINESS_WRITES = 0
RECEIVE_EXECUTED = NO
LIVE_CONFIRM_CLICKS = 0
PEARL_SIZE_INTERNAL_ID_VISIBLE = NO
PEARL_SIZE_DISPLAY_FORMAT = <value> mm
PEARL_SIZE_SORT = NUMERIC_ASC
CLIENT_BASELINE_SIZE_COUNT = 39
CLIENT_PEARL_SIZE_LIST_MATCH = PASS
EXTRA_CUSTOM_SIZE_VALUES = 0
PEARL_SIZE_CANONICAL_REFERENCE_PRESERVED = PASS
ADD_NEW_SIZE = YES_PERMISSION_GATED_SERVER_PATH
ADD_NEW_SIZE_PERMISSION_GATED = PASS
PEARL_TYPE_LABEL = PASS
PEARL_COLOR_LABEL = PASS
PEARL_OVERTONE_LABEL = PASS
PEARL_ORIENT_LABEL = PASS
PEARL_SHAPE_LABEL = PASS
PEARL_LUSTER_LABEL = PASS
PEARL_SURFACE_LABEL = PASS
PEARL_NACRE_LABEL = PASS
PEARL_ORIGIN_LABEL = PASS
CERTIFICATE_AUTHORITY_LABEL = PASS
AR_BROWSER_PROOF = PASS
EN_BROWSER_PROOF = PASS
PREVIEW_LABEL_PROOF = PASS_STATIC_UI_AND_REFERENCE
FOCUSED_TESTS = PASS (7/7)
TYPECHECK = PASS
LL012 = RECORDED
P0_COUNT = 0
P1_COUNT = 0
GATE = PASS_PEARL_SIZE_AND_MASTER_DATA_UI_BINDING_MINIMUM_SAFE_FIX
PEARL_SIZE_UI_DEFECT = CLOSED
PEARL_MASTER_SELECTOR_LABEL_AUDIT = PASS
PEARL_JEWELLERY_MODULE_STATUS = OPEN
NEXT_RECOMMENDED_STEP = PEARL_JEWELLERY_CONFIRM_AUTH_PATH_MINIMUM_SAFE_FIX
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP.

NO AUTH FIX. NO RECEIVE. NO RETRY. NO NEXT BATCH AUTOMATICALLY.
