# DARFUS ERP — Phase 03B-G2D Company Onboarding + Operational Readiness Report

Control: `DARFUS-PHASE-03B-G2D-COMPANY-ONBOARDING-OPERATIONAL-READINESS`

## 1. Executive Summary

تم تنفيذ مسار onboarding canonical للجاهزية، مع فصل صريح بين `SYSTEM_FIRST_RUN_READY` و`OPERATIONAL_RECEIVE_READY`. التقييم مشتق من حالة قاعدة البيانات على الخادم، ولا ينفذ كتابة أو provisioning أو Receive.

الحالة الحالية على Local Main:

- `darfus_erp` reachable، و`SequelizeMeta=85`.
- Company context موجود، و`Branch-1` نشط.
- Reference inventory master data في حالة `READY`.
- يوجد Supplier اصطناعي نشط وموقع مخزون اصطناعي نشط تابعان للنطاق الحالي.
- Company tax policy صريحة: VAT Registered=true، rate الحالي=14 للاختبار المحلي، treatments/default/RCM موجودة. لم تتم إعادة ضبطه إلى 5.
- Financial foundation الحالي `READY` عبر evaluator الموجود في النظام.
- `SYSTEM_FIRST_RUN_READY=true` و`OPERATIONAL_RECEIVE_READY=true` بلا blockers لمسار `SUPPLIER_RECEIVE`.

لم يتم إنشاء Supplier أو Location أو Tax setting أو Receive جديد في G2D. إعادة تشغيل backend شغّلت migration check فقط، وكانت النتيجة: لا migrations نُفذت، والـschema up to date.

## 2. Existing Setup Architecture

تمت مراجعة المصادر السابقة المطلوبة بالإضافة إلى source الحالي:

- First-run setup الحالي: `backend/src/routes/setup.routes.js`، `backend/src/controllers/setup.controller.js`، `backend/src/services/first-run-setup-state.service.js`.
- Company/settings الحالية: `backend/src/models/company.model.js`، `backend/src/services/settings.service.js`، و`GET/PATCH /api/v1/settings`.
- Branch authority الحالية: `Branch` model وbranch context/authorization الموجودان في `auth.middleware.js` و`erp.routes.js`.
- Location authority: `backend/src/routes/inventory-location.routes.js` و`backend/src/services/inventory-location.service.js`، company/branch scoped وDB-backed.
- Supplier authority: Supplier Master الحالي تحت `/suppliers`؛ لا يتم إنشاء مورد تلقائيًا من readiness.
- Financial readiness: `backend/src/services/financial-bootstrap.service.js` و`evaluateReadiness`، مع system roles وbranch mappings.
- Existing receive authority لم تُعاد في onboarding؛ الاستلام يبقى Inventory canonical فقط.

`first_run_setup_states.GLOBAL=READY`، و`SequelizeMeta=85`. لا يوجد duplicate first-run bootstrap ولا onboarding progress table جديد.

## 3. Readiness Authority

أُضيفت سلطة server-side واحدة في `backend/src/services/operational-readiness.service.js`:

- `evaluateOperationalReadinessSnapshot(snapshot)` pure evaluator لا يقبل company/branch من frontend facts.
- `getOperationalReadiness({ companyId, branchId, workflow })` يقرأ Company/Branch/Location/Supplier/Tax/Financial/Reference state من DB.
- يعيد `systemFirstRunReady`, `operationalReceiveReady`, `checks`, `blockers` وpolicy metadata.
- `READINESS_EVALUATION_WRITES=0`.
- Supplier blocker workflow-specific لمسار Supplier Purchase، وليس blocker لتشغيل النظام كله.
- Tax blocker مطلوب فقط عندما يكون taxable supplier receive هو workflow.

التمييز مثبت باختبار: حذف Supplier من facts الافتراضية يبقي system readiness=true ويجعل operational receive=false.

## 4. Company Identity

تم استخدام الحقول الموجودة في `Company` فقط: `businessName`, `workspace`, `currency`, `country`, `taxNumber` وسائر contact/address fields الموجودة في schema.

الـLocal Main الحالي:

- Company name: `Gold ERP`، مصنف synthetic local configuration.
- Currency: `AED`.
- `country` و`taxNumber/TRN` غير مدخلين؛ لا تم إدخال قيم fake ولا تم اعتبار غيابهما blocker لمسار الاختبار المحلي الحالي.
- لا توجد DARFUS أو Owner legal identity كـproduct default.

صفحة onboarding تربط إلى Settings canonical ولا تنسخ Company save logic.

## 5. UAE Tax Setup

تمت إعادة استخدام `company-tax-policy.service.js` وG2A1/G2A2 engine؛ لم يتم إنشاء Tax Engine جديد.

Readiness يتحقق من policy fields الصريحة التالية:

- `vatRegistered` صريح من Company.
- `vatRate` صريح من Setting.
- `enabledTaxTreatments` موجود ومحدد.
- `defaultTaxTreatment` موجود داخل enabled treatments.
- `preciousGoodsRcmEnabled` صريح.

الحالة الحالية: `vatRegistered=true`، `vatRate=14` (synthetic test propagation value)، enabled treatments تشمل `STANDARD_VAT`, `ZERO_RATED`, `REVERSE_CHARGE`، default=`STANDARD_VAT`، وRCM=true. القيمة القانونية metadata=5 من G2A1 engine؛ لم تُستخدم كـfallback ولم تُفرض على Local Main.

اختبارات G2D تثبت:

- TRN لا يستنتج VAT registration.
- `vatEnabled` لا يستنتج VAT registration.
- policy ناقصة تفشل closed.

## 6. Branch Readiness

تمت إعادة استخدام Branch management وserver branch authorization. لا يوجد duplicate branch provisioning.

Current DB evidence: شركة واحدة وفرع نشط واحد: `Branch-1`. Readiness route يقبل branch context من server-validated branch header أو fixed branch، ويستخدم `resolveAuthorizedBranchId`; لا يعتمد على body ولا يسمح بتجاوز company/branch scope.

## 7. Location Readiness

تمت إعادة استخدام G2B location service والجدول `inventory_locations`.

الحالة الحالية:

- Location rows: 2.
- Active in current Company/Branch: 1 (`QA-G2C-RECEIVE-LOCATION-01`).
- Historical/disabled row: 1.

الخدمة تعد فقط active DB-backed locations المطابقة للشركة والفرع. لا free-text، ولا `Showroom`/`Main Warehouse` default، ولا إنشاء تلقائي.

## 8. Supplier Readiness

Supplier remains Supplier Master authority وليس Product default.

Current DB evidence: Supplier rows=1، active supplier=`QA-G2C-SUPPLIER-01`. Readiness counts active suppliers داخل الشركة فقط. Onboarding يعرض الحالة ويربط إلى `/suppliers`، ولا ينشئ موردًا.

## 9. Financial Readiness

لم يتم اختراع حسابات أو mappings. تم استدعاء `financialBootstrapService.evaluateReadiness` قراءةً فقط.

النتيجة الحالية `READY`: branch system roles وbranch financial mappings المطلوبة موجودة ومتوافقة، بما فيها Inventory Asset وSupplier Payable وVAT/accounting roles اللازمة للمسار canonical. لا يوجد bootstrap أو reconcile أو journal write في G2D.

## 10. Onboarding UI

أُضيفت صفحة واحدة:

`app/[locale]/(dashboard)/settings/onboarding/page.tsx`

وتعرض Stepper من سبع خطوات:

1. Company identity
2. UAE tax policy
3. Branches
4. Inventory locations
5. Financial readiness
6. Suppliers
7. Readiness review

الصفحة read-only guide/readiness dashboard، وتستخدم `GET /settings/operational-readiness` ثم تربط إلى Settings/Locations/Accounting/Suppliers الحالية. لا تحتوي Receive form، ولا duplicate settings logic، ولا mutation button.

Browser Arabic proof على `/ar/settings/onboarding` أظهر READY للنظام والاستلام، وجميع الخطوات، ورسالة أن Receive الوحيد هو Inventory → إضافة / استلام مخزون.

## 11. Readiness API

تمت إضافة endpoint canonical:

`GET /api/v1/settings/operational-readiness`

في `backend/src/routes/erp.routes.js`، مع `authMiddleware` و`requirePermission("settings.view")`.

خصائصه:

- company-scoped من `req.companyId`.
- branch-aware عبر `resolveAuthorizedBranchId`.
- server-authoritative، no secrets.
- workflow الحالي `SUPPLIER_RECEIVE`.
- response الحالي: `200`، `systemFirstRunReady=true`، `operationalReceiveReady=true`، `blockers=[]`.

## 12. Permissions/Audit

Readiness يستخدم صلاحية `settings.view`. Branch/company scope يمر عبر auth والـexisting resolver. أي future mutation من Settings/Branch/Location/Supplier سيبقى عبر APIs الحالية ذات permissions/audit الموجودة؛ G2D نفسه لم ينفذ mutation.

لا يوجد readiness audit system جديد، لأن التقييم لا يكتب.

## 13. Focused Tests

أُضيف:

`backend/tests/phase-03b-g2d-operational-readiness.test.cjs`

النتيجة: **4/4 PASS**.

يغطي:

- استقلال system وoperational readiness.
- missing reference/branch/location/supplier/tax/financial fail-closed.
- عدم inference من TRN أو `vatEnabled`.
- company/branch server scope وعدم body override.
- onboarding steps وغياب duplicate receive form.

كما تم تشغيل syntax checks للخدمة والـroute بنجاح.

## 14. Regression Tests

Focused regression result:

- G2A1: **6/6 PASS** عند تشغيل الاختبار من `backend` working directory الصحيح.
- G2A2: PASS.
- G2B: PASS.
- G2C: PASS.
- Inventory authority 01A: PASS.
- GBW profile: PASS.
- GBP 03-R2: PASS.
- Unified Inventory Intake 02-R3: PASS.

Combined focused run بعد استبعاد path-specific G2A1 invocation الخاطئ: **46/46 PASS**. لا توجد regression failure مثبتة بسبب G2D.

Frontend `npm run typecheck`: **PASS**.

## 15. Local Main Acceptance

Environment under test: `localhost:3000`, `localhost:8000`, database `darfus_erp`.

Server-side live readiness result:

```json
{
  "systemFirstRunReady": true,
  "operationalReceiveReady": true,
  "blockers": [],
  "checks": {
    "companyIdentity": "READY",
    "taxPolicy": "READY",
    "activeBranch": "READY",
    "activeInventoryLocation": "READY",
    "supplierAvailable": "READY",
    "financialFoundation": "READY",
    "referenceMasterData": "READY"
  }
}
```

Current synthetic rows remain classified as `LOCAL_DEVELOPMENT_CONFIGURATION` / `LOCAL_SYNTHETIC_ACCEPTANCE_DATA`, not product defaults and not real customer data.

## 16. Browser/Network

Browser acceptance was read-only and Arabic-first:

| URL | Result | Evidence |
|---|---|---|
| `/ar/settings/onboarding` | PASS | 7 steps rendered; System READY; Supplier Receive READY; no blocker; no duplicate Receive form |
| `/ar/inventory` | PASS | main page rendered; no visible fatal error |
| `/ar/inventory/locations` | PASS | DB-backed location list rendered |
| `/ar/settings` | PASS | settings page rendered |
| `/ar/suppliers` | PASS | supplier list rendered; no visible fatal error |

Backend request evidence:

- `GET /api/v1/settings/operational-readiness` → 200.
- `GET /api/v1/settings` → 200/304.
- `GET /api/v1/inventory/locations` → 304.
- `GET /api/v1/suppliers` → 200/304.
- `GET /api/health` → 200.
- `GET /api/health/db` → 200.
- `GET /api/health/redis` → 200.

No visible browser fatal error and no acceptance 5xx were observed. No real Receive was run.

## 17. DB Reconciliation

Read-only snapshots before and after the G2D implementation/acceptance were unchanged:

| Entity | Before | After | Delta |
|---|---:|---:|---:|
| companies | 1 | 1 | 0 |
| branches | 1 | 1 | 0 |
| settings | 12 | 12 | 0 |
| suppliers | 1 | 1 | 0 |
| inventory_locations | 2 | 2 | 0 |
| purchase_orders | 3 | 3 | 0 |
| assets | 3 | 3 | 0 |
| inventory_asset_movements | 3 | 3 | 0 |
| stock_movements | 0 | 0 | 0 |
| journal_entries | 3 | 3 | 0 |
| journal_lines | 9 | 9 | 0 |
| payments | 0 | 0 | 0 |
| audit_logs | 37 | 37 | 0 |
| SequelizeMeta | 85 | 85 | 0 |

`READINESS_EVALUATION_WRITES=0`، `RECEIVE_RUN_THIS_CONTROL=NO`. The backend restart reported “No migrations were executed, database schema was already up to date.”

## 18. Files Changed

Intentional G2D files:

- `backend/src/services/operational-readiness.service.js` — new server authority.
- `backend/src/routes/erp.routes.js` — one GET readiness route.
- `app/[locale]/(dashboard)/settings/onboarding/page.tsx` — one onboarding/readiness guide.
- `backend/tests/phase-03b-g2d-operational-readiness.test.cjs` — focused tests.
- `docs/DARFUS_PHASE_03B_G2D_COMPANY_ONBOARDING_OPERATIONAL_READINESS_REPORT.md` — this report.

No migration, seed, config, secret, Next generated file, or git cleanup was changed. Worktree was already dirty before G2D; baseline observed was `93` tracked modified entries and `292` untracked entries, preserved as pre-existing drift except for the intentional paths above.

## 19. Bugs Found/Fixed

Fixed in G2D:

- There was no single server-authoritative company/branch operational-readiness evaluator for onboarding. Added the read-only evaluator and canonical GET endpoint.
- There was no canonical onboarding/readiness UI under Settings. Added the single guide page without adding a second settings or receive workflow.

Not fixed because they are outside G2D:

- No company country/legal identity/TRN was invented for the synthetic Local Main company.
- Existing Local Main synthetic VAT rate remains 14 for test propagation; no business rule or tax formula was changed.
- No supplier/location provisioning was performed.

## 20. Gate

All G2D acceptance criteria are satisfied on Local Main. Official online production was not contacted. `darfus_erp` received zero business writes in this control. No P0/P1 regression was introduced.

```text
GATE = PASS_PHASE_03B_G2D_COMPANY_ONBOARDING_OPERATIONAL_READINESS
G2D_LOCAL_MAIN_FINAL_CLOSED = YES
```

## 21. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PHASE-03B-G2D-COMPANY-ONBOARDING-OPERATIONAL-READINESS
LOCAL_MAIN_DB = darfus_erp
SEQUELIZE_META = 85

SYSTEM_FIRST_RUN_READY_AUTHORITY = PASS
OPERATIONAL_RECEIVE_READY_AUTHORITY = PASS
READINESS_SERVER_AUTHORITY = PASS

COMPANY_ONBOARDING = PASS
UAE_TAX_ONBOARDING = PASS
BRANCH_READINESS = PASS
LOCATION_READINESS = PASS
SUPPLIER_READINESS = PASS
FINANCIAL_READINESS = PASS

NO_FAKE_DEFAULTS = PASS
NO_AUTO_SUPPLIER = PASS
NO_AUTO_LOCATION = PASS
NO_VAT_INFERENCE = PASS

CURRENT_LOCAL_MAIN_SYSTEM_FIRST_RUN_READY = YES
CURRENT_LOCAL_MAIN_OPERATIONAL_RECEIVE_READY = YES

ONBOARDING_RESUMABLE = PASS
CANONICAL_APIS_REUSED = PASS
DUPLICATE_RECEIVE_WORKFLOW = NO

READINESS_EVALUATION_WRITES = 0
RECEIVE_RUN_THIS_CONTROL = NO

G2A1_REGRESSION = PASS
G2A2_REGRESSION = PASS
G2B_REGRESSION = PASS
G2C_REGRESSION = PASS

MAIN_HEALTH = PASS
MAIN_BROWSER = PASS

PRODUCT_DEFAULTS_ADDED = NO
REAL_CUSTOMER_DATA_USED = NO
ONLINE_PRODUCTION_CONTACTED = NO

GATE = PASS_PHASE_03B_G2D_COMPANY_ONBOARDING_OPERATIONAL_READINESS
G2D_LOCAL_MAIN_FINAL_CLOSED = YES
NEXT_RECOMMENDED_STEP = 03B-G3-FULL-LOCAL-MAIN-BROWSER-API-DB-ACCOUNTING-ACCEPTANCE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. G3 لم يبدأ تلقائيًا.
