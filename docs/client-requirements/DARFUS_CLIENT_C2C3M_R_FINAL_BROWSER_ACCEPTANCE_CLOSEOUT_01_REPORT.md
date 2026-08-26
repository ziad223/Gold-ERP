# DARFUS ERP — C2C3M-R Final Browser Acceptance Closeout

## ملخص تنفيذي

تم تنفيذ الأدلة المفقودة فقط لـ B6/B7 على Disposable runtime مع هويات اختبار اصطناعية. اجتاز API contract صلاحيات العرض/الرفض كما هو متوقع، ولم تحدث أي business mutation. فشل إغلاق المتصفح لأن route الفروع يطلب `branches.view` غير الموجودة في canonical permission catalog، فظل Branch context غير جاهز ولم تصل الشاشة إلى Revision panel. هذا عيب P1 مثبت، لذلك لا يجوز إصدار PASS ولا تنفيذ إصلاح تلقائي.

## حدود control

| Guardrail | Result |
|---|---|
| Official DB `darfus_erp` | read-only |
| Disposable DB | `darfus_c2c2_revision_runtime_02` |
| Product/source changes | 0 |
| Test changes | 0 |
| Migrations | 0 |
| Revision create | 0 |
| Barcode/RFID/inventory/accounting mutation | 0 |
| C3 started | no |

## Upstream evidence preserved

B1–B5 وB8 ونتائج permission catalog reconciliation بقيت مرجعًا داعمًا ولم تُعاد. هذا control استهدف فقط الأدلة الناقصة، كما طلبت خطة C2C3M-R.

## Runtime preflight

| Service | Result |
|---|---|
| temporary backend health | 200 |
| temporary DB health | 200 |
| temporary Redis health | 200 |
| `current_database()` | `darfus_c2c2_revision_runtime_02` |
| official DB identity | `darfus_erp` read-only |
| action provenance | captured |

## B6/B7 result

| Scenario | API result | Browser result | Delta |
|---|---|---|---:|
| B6 view-only | revisions GET 200 / create 403 | blocked before Revision panel by Branch context | 0 |
| B7 no-permission | revisions GET 403 / create 403 | blocked before Revision panel by Branch context | 0 |

The browser did not emit a revision GET/POST after the branch gate. No mutation was hidden behind the blocked UI.

## Root-cause finding

`C2C3M-R-DEF-001`:

1. `backend/src/routes/erp.routes.js` protects branch list/get with `branches.view`.
2. `backend/src/bootstrap/permission-catalog-source.js` and the official/clone catalogs contain 152 permissions but no `branches.view`.
3. Both synthetic users received HTTP 403 from `/api/v1/branches`.
4. `contexts/branch-context.tsx` requires that request to succeed before `branchesLoaded` becomes ready.
5. `components/branch/branch-context-gate.tsx` stops the page at `Branch readiness required`.

Classification: `PRODUCT_DEFECT / SECURITY / ACCEPTANCE_GAP`, severity `P1`.

This is not fixed in this closeout. Adding a permission ad hoc would conceal a source/catalog mismatch and is forbidden by the control.

## Browser/network/console

- EN login and shell rendered.
- EN branch request returned 403.
- No hydration crash or route crash was observed.
- One application console blocker was recorded for the 403 branch request.
- AR final smoke was not started after the stop condition.
- No business POST was sent in either language.

See the companion artifacts:

- [Permission/browser proof](DARFUS_CLIENT_C2C3M_R_PERMISSION_BROWSER_PROOF.md)
- [Network wire proof](DARFUS_CLIENT_C2C3M_R_NETWORK_WIRE_PROOF.md)
- [AR/EN smoke](DARFUS_CLIENT_C2C3M_R_AR_EN_FINAL_SMOKE.md)
- [DB reconciliation](DARFUS_CLIENT_C2C3M_R_FINAL_DB_RECONCILIATION.md)

## DB and permission reconciliation

Disposable business tables remained unchanged during B6/B7. Official permission diagnostic was read-only and returned source/DB parity 152/152, no missing/extra permissions, no metadata mismatch, no role binding gap, and zero permission writes. Official business counts were not mutated by this control.

## Final decision

The missing acceptance evidence cannot be marked PASS because the real browser cannot reach the protected Revision view under the canonical branch-context path. The correct next action is an Owner-reviewed source/catalog decision for `C2C3M-R-DEF-001`; no automatic fix and no C3.

## Required final tokens

```text
CURRENT_CONTROL = DARFUS-C2C3M-R-FINAL-BROWSER-ACCEPTANCE-CLOSEOUT
RUNTIME_PREFLIGHT = PASS
ACTION_PROVENANCE_CAPTURED = YES
B1_B5 = PASS_FROM_PRIOR
B6_VIEW_ONLY_BROWSER = BLOCKED_BRANCH_CONTEXT_PERMISSION_GAP
B6_GET = 200
B6_POST = 403
B6_REVISION_DELTA = 0
B7_NO_PERMISSION_BROWSER = BLOCKED_BRANCH_CONTEXT_PERMISSION_GAP
B7_GET = 403
B7_CREATE_AUTHORITY = DENIED
B7_REVISION_DELTA = 0
B8 = PASS_FROM_PRIOR
B8_FINAL = PASS_FROM_PRIOR
AR_FINAL_SMOKE = NOT_RUN_AFTER_STOP
EN_FINAL_SMOKE = BLOCKED_C2C3M_R_DEF_001
BROWSER_NETWORK_WIRE_PROOF = BLOCKED_BROWSER_REVISION_WIRE_NOT_EMITTED
BROWSER_CONSOLE_BLOCKERS = 1
PERMISSION_CATALOG = IN_SYNC
PERMISSION_DRIFT_PREVENTION = PASS
NEW_REVISION_ROWS = 0
OFFICIAL_BUSINESS_WRITES = 0
OFFICIAL_DAMAGE = 0
PRODUCT_CODE_FILES_CHANGED = 0
TEST_FILES_CHANGED = 0
MIGRATIONS_CREATED = 0
P0_COUNT = 0
P1_COUNT = 1
P2_COUNT = 0
P3_COUNT = 0
ITEM_REVISION_CLOSED = NO
GATE = BLOCKED_C2C3M_R_PRODUCT_DEFECT_FOUND
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
NEXT_BATCH = C3_COMMON_PROFILE_FIELDS
```

## Stop

تم التوقف عند العيب المثبت. لا إصلاح، لا migration، لا official mutation، ولا بدء C3 تلقائيًا.
