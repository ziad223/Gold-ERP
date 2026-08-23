# DARFUS ERP — Stage D Control & Safety Final Closure

تم تنفيذ فحص Stage D، وتصحيح حواجز CRUD العامة المثبتة فقط، ثم إعادة الاختبارات والـruntime read-only. لم تُنشأ أي معاملة أعمال جديدة، ولم تُعدّل قاعدة `darfus_erp` بكتابة أعمال. نجحت اختبارات الأمان المركزة والـregression والـtypecheck، مع بقاء استثناء القيد التاريخي المعروف موثقًا دون إصلاح.

## 1. Executive Summary

- `darfus_erp` هو الهدف الفعلي، و`current_database() = darfus_erp`.
- Backend `:8000` وPostgreSQL وRedis وFrontend `:3000` تعمل.
- تم إثبات Auth/Company/Branch/RBAC/Idempotency/Error/Audit boundaries من المصدر والاختبارات.
- تم تطبيق أقل حظر آمن لمسارات CRUD العامة التي كانت تستطيع تجاوز أصحاب workflow: Company، Manufacturing Orders، Customer/Investment Gold Pools، Approval Requests، Journal Entries، إضافة إلى الحواجز القائمة للمخزون/التحويل/الشراء/الخزينة.
- لا توجد Migration جديدة، ولا Seed، ولا Master Data mutation، ولا business write في هذا التحكم.
- يوجد warning بيئي غير حاجب: runtime يستخدم development-default JWT secrets؛ لم تُطبع القيم ولم تُغيّر.
- يوجد قيد تاريخي معروف غير متوازن `JE-1787090870905`، وهو الاستثناء المحدد في سلطة Stage D؛ لم يُنشأ في هذا التحكم ولم يُلمس.

## 2. Auth / Session

الحالة: `PASS`.

- `auth.middleware.js` يتحقق من Bearer token، الجلسة الفنية، user activity، ونسخة الجلسة.
- protected GET بدون Authorization أعاد `401` للـCustomers وInventory V2 وPOS Search.
- Refresh/logout/current-user مسارات منفصلة، ولا يوجد fallback لتسجيل الدخول أو رفع الصلاحية.
- اختبارات auth/security وsession lifecycle نجحت.
- لم تُطبع كلمات مرور أو tokens أو أسرار في هذا التقرير أو سجلات التسليم.

## 3. Company Context

الحالة: `PASS_FAIL_CLOSED`.

- Company يأتي من auth/header الموثق؛ body/query لا يصبحان authority.
- Super Admin يحتاج Company صريحة؛ الاختبار أثبت رفض التشغيل بدونها وقبول Company صالحة فقط.
- Cross-company Company selection مرفوضة، ولا يوجد `CMP-DEMO` كـfallback تشغيلي.
- `accessible-company` bootstrap قراءة/اختيار فقط ولا يفرض Company جانبية.

الدليل: `auth.middleware.js`، `accessible-company-bootstrap.test.cjs`، `super-admin-company-context.test.cjs`، `company-context-lifecycle.test.mjs`.

## 4. Branch Context

الحالة: `PASS_FAIL_CLOSED`.

- Branch Account مربوط بفرع ثابت، وأي header مخالف مرفوض.
- Company-level actor يحتاج Branch صالحًا للعمليات branch-sensitive.
- Branch inactive/foreign/missing مرفوض؛ Transfer/Workshop/Count/POS/Accounting تعتمد على branch scope الخادمي.
- اختبارات Branch lifecycle وTransfer/Workshop/Count وfinancial mapping نجحت.

## 5. RBAC / Least Privilege

الحالة: `PASS`.

- Backend هو boundary الأمني؛ UI visibility ليست authority.
- Employee Branch Account يستخدم `operator-session.service` وEmployee effective permissions مع direct denial precedence.
- الصلاحيات الخاصة بـTransfer/Workshop/Count/POS/Returns/Inventory/Accounting/Settings موجودة ومستخدمة في المصدر.
- اختبارات employee authorization وcompany/branch isolation وStage B نجحت.
- unknown permission لا يمنح bypass، ولا يوجد role self-elevation في المسارات التي فُحصت.

## 6. High-Risk / Destructive Controls

الحالة: `PASS` بعد minimum safe fix.

- Asset status transitions محكومة بمالك lifecycle، state allowlist، company/branch، transaction، audit/event/movement، وidempotency عند الحاجة.
- Barcode replacement، RFID، Transfer، Workshop، Count، POS، Return/Refund، والـfinancial actions لها routes/permissions مخصصة.
- لا يوجد تنفيذ High-Risk action في Stage D.
- التعديل المنفذ أضاف hard-block خادمي ثابت `403` للـgeneric mutation resources التي لا يجوز أن تكتب authority مباشرة.

## 7. Master Data Safety

الحالة: `PASS` للحدود المفحوصة؛ لا provisioning.

| Master/Data | Current count | State |
|---|---:|---|
| Suppliers | 2 | Present |
| Inventory Locations | 4 total / 3 active | Present; inactive rows remain data |
| Customers | 2 | Present |
| Products | 0 | Empty; not used as serialized authority |
| Profile master data | 660 | Present |

- Location selection is DB-backed and active/scope checked.
- Used master data is protected by dedicated lifecycle semantics; no delete/disable was executed.
- No free-text location was used for the Stage C sale readback.

## 8. Idempotency / Concurrency

الحالة: `PASS`.

- Central `idempotency.service.js` uses stable sorted canonical JSON, excludes the idempotency key from body hash, and hashes scope/params/body.
- Unique company/scope/key constraint is present and current `SequelizeMeta` count is 91.
- Same key/same hash replays; same key/changed hash conflicts; claim occurs transactionally.
- Stage B/C tests cover duplicate sale, custody, count scan, receive/replay boundaries.
- No live replay was sent in Stage D.

## 9. Legacy / Generic Mutation Bypass

الحالة: `PASS` after fix.

### Confirmed gap and minimum fix

`setupCrud` had generic write registration for resources whose canonical owners are dedicated workflows. The fix added explicit `LIFECYCLE_GENERIC_MUTATION_BLOCKS` and registers the block before legacy special cases. The block returns stable `403` and never reaches the controller.

Blocked resources include:

- `companies`
- `manufacturing-orders`
- `customer-gold-pools`
- `inventory-gold-pools`
- `approval-requests`
- `journal-entries`
- existing Asset/Product/Stock Movement/Transfer/Purchase Order/Cash Transaction generic blocks

Canonical owners remain available: Inventory V2 transformation, Gold Purchase routes, dedicated financial approval flow, and journal draft/post/reverse/cancel endpoints.

## 10. Error Contract / Information Leakage

الحالة: `PASS`.

- Error contract tests: `9/9` passed in the focused run.
- 401/403/404/409/422/5xx classes are normalized by current middleware and do not expose SQL/ORM internals to normal clients.
- Error logs can contain internal diagnostic stack traces for operators, but the client envelope remains safe.

## 11. Audit / Traceability

الحالة: `PASS`.

- `audit.service.js` appends hash-linked audit rows with actor, technical/employee context, permission, operation, and before/after fields where applicable.
- Read-only verification of the accepted Stage C company audit chain returned `valid=true`, `total=85`.
- AssetEvent and InventoryAssetMovement remain the lifecycle evidence authorities.
- No new business audit event was generated by Stage D.

## 12. Financial Control Safety

الحالة: `PASS` for current Stage D scope, with known historical exception preserved.

- Generic journal mutation is now explicitly blocked; dedicated manual-draft/post/reverse/cancel routes remain the owners.
- Accepted Stage C sale journal is balanced: debit `5076.71000000` = credit `5076.71000000`.
- Invoice/payment/cash/journal/Asset/event/movement/idempotency links are intact.
- Finalized sale tax and Asset purchase/cost evidence are not rewritten by generic routes.
- `JE-1787090870905` remains `2133.21000000` debit vs `2133.22000000` credit. It is the named historical local exception and was not treated as a new Stage D defect or repaired.

## 13. Runtime / Environment Safety

الحالة: `PASS` with non-blocking hardening note.

| Service | Status | Evidence |
|---|---|---|
| Backend `:8000` | UP | `/api/v1/health = 200` |
| PostgreSQL | UP | `/api/v1/health/db = 200`; `current_database()=darfus_erp` |
| Redis | UP | `/api/v1/health/redis = 200` |
| Frontend `:3000` | UP | `/en/dashboard = 200` |

- Docker has one backend, one PostgreSQL, one Redis; no parallel Frontend was started.
- Backend was refreshed once after the source guard change. Startup log states: no migrations executed, runtime admin bootstrap skipped.
- Before/after restart counts: `SequelizeMeta 91`, `purchase_orders 14`, `assets 14`, `journal_entries 18`, `invoices 1` on both sides.
- Environment is development mode and both JWT secret variables are development defaults. This is `P2_HARDENING`, not changed in this control.

## 14. Focused Tests / Regression

الحالة: `PASS`.

- `tests/stage-d-control-safety.test.cjs`: `2/2`.
- Auth/security containment: pass.
- Idempotency verifier and secondary idempotency verifier: pass.
- Error contract/middleware: `9/9`.
- Company/Branch/Super Admin/Employee authorization: `24/24`.
- Stage B selected regression: `77/77`.
- Stage C/Asset/Barcode selected regression: `23/23`.
- Financial bootstrap selected regression: `30/30`.
- Tax/Location/Readiness selected regression: `24/24`.
- `npm run typecheck`: pass.
- `node --check` on changed/critical backend files: pass.
- `git diff --check` on touched tracked files: pass.

Verifier-only corrections were limited to current source/test contract drift: canonical operation scope detection, the intentional Supplier legacy redirect, TypeScript alias resolution, and an outdated relative path in the G2A1 test. No business rule was weakened.

## 15. DB Integrity

الحالة: `PASS`.

Current read-only counts:

| Entity | Count |
|---|---:|
| purchase_orders / purchase_order_items | 14 / 14 |
| assets / asset_events | 14 / 23 |
| asset_barcode_history / asset_origins | 14 / 14 |
| asset_purchase_cost_revisions / asset_current_valuations | 14 / 14 |
| inventory_asset_movements | 20 |
| invoices / invoice_items | 1 / 1 |
| payments / cash_transactions | 1 / 4 |
| journal_entries / journal_lines | 18 / 53 |
| idempotency_requests | 34 |
| transfers / transfer_items | 1 / 1 |
| stock_audits / stock_audit_items | 3 / 15 |

Read-only anomaly checks all returned zero: orphan origin/cost/valuation, orphan invoice item/payment/journal line/transfer item/count item, missing active barcode, duplicate active barcode, double-sold asset link, duplicate active transfer custody, duplicate count rows, and duplicate idempotency company/scope/key.

## 16. Accepted Stage C Sale Readback

الحالة: `PASS`; no replay or new checkout.

- Invoice: `INV-2026-000001`, status `paid`, posting `posted`.
- Asset: `AST-PUR-1787085524749-1-1-dww3`, status/operational status `sold/SOLD`.
- Barcode: `GWRNG21000002`, one active history row.
- Invoice values: subtotal `2377.78624720`, tax `332.89010000`, total `2710.67630000`, VAT rate `14.000`.
- Payment: one, `2710.6763`, cash; CashTransaction: one linked cash-in.
- Journal: one linked invoice journal, balanced; SALE AssetEvent: one; SALE movement: one.
- Exact POS idempotency row: one succeeded row; no duplicate scope/key rows.
- No Stage D receive/transfer/workshop/count/checkout/return/refund/void was executed.

## 17. AR/EN Browser Smoke

الحالة: `PASS` read-only.

Routes checked in both AR and EN: Dashboard, Inventory, Transfers, Workshop, Inventory Count, POS, Customers, Settings, and Employees/Roles.

- All navigations stayed on the requested local route and rendered `DARFUS Jewellery ERP`.
- Build Error/Application Error/Unhandled Runtime Error: none observed.
- Browser console error logs: none observed on the checked pages.
- No business mutation button was clicked.
- No password/token was inspected.

## 18. P0/P1/P2

| Priority | Count | Finding |
|---|---:|---|
| New P0 | 0 | No new P0 proven |
| New P1 | 0 | Generic mutation gap was corrected and retested; historical journal is excluded by authority |
| Blocking P2 | 0 | No blocking P2 |
| Non-blocking P2 | 1 | Development-default JWT secret configuration requires deployment hardening |
| Historical exception | 1 | `JE-1787090870905`, untouched and separately preserved |

## 19. Gate

```text
AUTH_GATE = PASS
COMPANY_CONTEXT_GATE = PASS_FAIL_CLOSED
BRANCH_CONTEXT_GATE = PASS_FAIL_CLOSED
RBAC_GATE = PASS
IDEMPOTENCY_GATE = PASS
CONCURRENCY_GATE = PASS
LEGACY_BYPASS_GATE = PASS
DESTRUCTIVE_ACTION_GATE = PASS
ERROR_LEAKAGE_GATE = PASS
AUDIT_TRACEABILITY_GATE = PASS
FINANCIAL_CONTROL_GATE = PASS
RUNTIME_SAFETY_GATE = PASS
DB_INTEGRITY_GATE = PASS
P0_COUNT = 0
P1_COUNT = 0
P2_BLOCKING_COUNT = 0
GATE = PASS_STAGE_D_CONTROL_AND_SAFETY_FINAL_CLOSURE
STAGE_D_STATUS = CLOSED
```

## 20. Final Tokens

```text
CURRENT_CONTROL = DARFUS-STAGE-D-CONTROL-AND-SAFETY-MINIMUM-SAFE-IMPLEMENTATION-AND-CLOSURE
LOCAL_MAIN_DB = darfus_erp

AUTH_AUTHORITY = auth.middleware.js + technical-session.service.js
SESSION_AUTHORITY = TechnicalAccountSession + EmployeeOperationalSession authorization freshness
COMPANY_CONTEXT_AUTHORITY = server-validated X-Company-ID / authenticated Company scope; Super Admin explicit selection
BRANCH_CONTEXT_AUTHORITY = server-validated X-Branch-ID / Branch Account fixed branch / branch-isolation.service.js
RBAC_AUTHORITY = backend permission.service.js + business-permission.middleware.js + Employee effective authorization
IDEMPOTENCY_AUTHORITY = backend/src/services/idempotency.service.js
AUDIT_AUTHORITY = backend/src/services/audit.service.js + AssetEvent + InventoryAssetMovement
DESTRUCTIVE_ACTION_AUTHORITY = dedicated lifecycle routes/services with narrow permissions, state guards, transaction, audit, idempotency
ERROR_CONTRACT_AUTHORITY = backend/src/middleware/error.middleware.js + canonical API error envelope
LEGACY_BYPASS_SURFACE = generic CRUD hard-blocked for lifecycle/financial/Company/Gold Purchase/approval resources; master-data CRUD remains permission-scoped

SOURCE_CHANGES = minimum safe backend generic-mutation hard-block + verifier/test contract alignment; pre-existing worktree drift preserved
MIGRATION = NOT_REQUIRED; source and SequelizeMeta both 91; no migration executed
RBAC_MUTATION = NO
BACKUP = N/A; no schema or official DB business mutation authorized
MIGRATION_REHEARSAL = N/A

FOCUSED_STAGE_D_TESTS = PASS
RELEVANT_REGRESSION = PASS
TYPECHECK = PASS
NODE_CHECK = PASS
BACKEND_RUNTIME_PARITY = PASS after one safe backend refresh; no pending migration and startup bootstrap skipped
FRONTEND_RUNTIME_PARITY = PASS on localhost:3000 read-only smoke
AR_BROWSER_SMOKE = PASS
EN_BROWSER_SMOKE = PASS

AUTH_GATE = PASS
COMPANY_CONTEXT_GATE = PASS_FAIL_CLOSED
BRANCH_CONTEXT_GATE = PASS_FAIL_CLOSED
RBAC_GATE = PASS
IDEMPOTENCY_GATE = PASS
CONCURRENCY_GATE = PASS
LEGACY_BYPASS_GATE = PASS
DESTRUCTIVE_ACTION_GATE = PASS
ERROR_LEAKAGE_GATE = PASS
AUDIT_TRACEABILITY_GATE = PASS
FINANCIAL_CONTROL_GATE = PASS
RUNTIME_SAFETY_GATE = PASS
DB_INTEGRITY_GATE = PASS

NEW_TRANSFER = 0
NEW_WORKSHOP = 0
NEW_COUNT = 0
NEW_RECEIVE = 0
NEW_CHECKOUT = 0
NEW_RETURN = 0
NEW_REFUND = 0
NEW_VOID = 0
NEW_LIFECYCLE_MUTATION = 0

OFFICIAL_DB_BUSINESS_WRITES_THIS_CONTROL = 0
P0_COUNT = 0
P1_COUNT = 0
P2_BLOCKING_COUNT = 0
GATE = PASS_STAGE_D_CONTROL_AND_SAFETY_FINAL_CLOSURE
STAGE_D_STATUS = CLOSED
NEXT_RECOMMENDED_STEP = STAGE_E_FINAL_ACCEPTANCE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

لا يوجد Stage E تلقائي، ولا Deployment، ولا Production contact، ولا معاملة أعمال جديدة. انتهى هذا التحكم عند `PASS_STAGE_D_CONTROL_AND_SAFETY_FINAL_CLOSURE`.
