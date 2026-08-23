# DARFUS ERP — Phase 03B-G2A1-R1 Local Main Environment Apply + Runtime Acceptance Report

## 1. Executive Summary

تم تطبيق ترحيل G2A1 المحدد فقط على قاعدة `darfus_erp` المحلية بعد التحقق من الهوية وإنشاء backup كامل صالح. نجحت صحة الـbackend/DB/Redis، ونجحت الاختبارات المركزة بعد التطبيق `22/22`، ونجحت رحلات المتصفح الأساسية على `localhost:3000` دون أخطاء Console ظاهرة.

لم يتم تنفيذ كتابة Tax Policy الصناعية لأن إثبات authenticated PATCH/GET على الـMain API لم يكن قابلاً لإعادة الاستخدام من runner الحالي: جلسة المتصفح authenticated، لكن أداة المتصفح لا توفر Network request/response capture أو cross-port API request، وبيانات اعتماد `ADMIN_*` الموجودة داخل الحاوية أعادت `422`. لم يتم تجاوز ذلك بتغيير كلمة مرور أو إنشاء مستخدم أو كتابة SQL.

النتيجة: **لا يوجد Product/DB migration failure مثبت**، لكن قبول R1 الكامل محجوب قبل إثبات Main Settings Write/Persistence/Audit/Network.

## 2. Preconditions

- قرأت تعليمات R1، تقرير G2A1 السابق، ومرجع G1A قبل التنفيذ.
- تم الحفاظ على worktree drift الموجود مسبقاً؛ لم يُستخدم `reset` أو `restore` أو `clean` أو `stash` أو `build`.
- الحالة المرجعية قبل R1: `HEAD=1657b0e9ba580faef69be48f04637835c201b521`، وworktree واسع التغيير: `90` tracked modified، `747` untracked، `11` stashes.
- لا توجد تغييرات Frontend أو Backend مصدرية نفذها R1.
- لم يتم الاتصال ببيئة Online Production.

## 3. Updated Environment Authority

| Item | Actual | Evidence |
|---|---|---|
| Local main DB | `darfus_erp` | `SELECT current_database()` داخل `darfus-postgres` |
| Local backend | `http://localhost:8000` | Docker port mapping and health responses |
| Local frontend | `http://localhost:3000` | HTTP 200 and browser navigation |
| PostgreSQL | 16.15 | DB identity query |
| Redis | Container service on 6379 | `/api/v1/health/redis` = 200/UP |
| Online Production | Untouched | No production host/database/deployment command used |

## 4. G2A1 Source Integrity

G2A1 source/report authority matched before R1. The intentional G2A1 source set was already present before this control:

- `backend/src/models/company.model.js`
- `backend/src/services/uae-tax-engine.service.js`
- `backend/src/services/company-tax-policy.service.js`
- `backend/src/routes/erp.routes.js`
- `backend/migrations/20260818020000-add-company-vat-registered.js`
- G2A1 focused test files

R1 did not edit those files. Historical worktree drift was preserved and is not attributed to R1.

## 5. Pre-Apply Main Runtime Forensic

Before apply, `darfus-backend`, `darfus-postgres`, and `darfus-redis` were running. PostgreSQL and Redis reported healthy. The backend was bind-mounted to the current worktree but was an older process, so only the backend was restarted after migration.

Pre-apply health:

- `GET /api/v1/health` = 200, `UP`
- `GET /api/v1/health/db` = 200, connected
- `GET /api/v1/health/redis` = 200, connected
- `GET http://localhost:3000` = 200

## 6. Local DB Identity

| Check | Result |
|---|---|
| `current_database()` | `darfus_erp` |
| `current_user` | `postgres` |
| PostgreSQL | 16.15 |
| Companies before apply | 1 |
| Settings before apply | 0 |
| Suppliers before apply | 0 |
| Locations before apply | 0 |
| Purchase orders before apply | 0 |
| Assets before apply | 0 |
| Journal entries before apply | 0 |
| Audit logs before apply | 23 |

## 7. Pending Migration Safety

Canonical Sequelize status showed exactly one pending migration:

`20260818020000-add-company-vat-registered.js`

No unexpected pending migration was found. `SequelizeMeta` was `83` before apply.

## 8. Fresh Backup

Fresh full backup was created and verified before migration:

- File: [darfus_erp_PRE_G2A1_R1_FULL_20260818_200740.dump](../backups/official/darfus_erp_PRE_G2A1_R1_FULL_20260818_200740.dump)
- Size: `648306` bytes
- SHA-256: `213D434ED11B1D30C318CBEFAE5C32909EEA9697E93F26B43EDF06ECCCAD4736`
- `pg_restore --list`: PASS
- TOC entries: `1186`
- Backup identity: `darfus_erp|postgres|PostgreSQL 16.15`

The host initially lacked PostgreSQL client binaries; the backup was then produced using the PostgreSQL container tools and copied out, with the temporary dump container removed after verification. No business data was changed by backup creation.

## 9. Pre-Apply Regression Tests

PASS:

- G2A1 tax-policy tests
- GBW formula regression tests
- GBP rate/calculation regression tests
- Supplier serialized-profile acquisition/payable/pricing tests
- Database environment contract
- Typecheck

The aggregate pre-apply run passed `22/22`, `0` failures.

## 10. Local Main Migration Apply

The exact pending migration was applied through the canonical Sequelize command against the verified `darfus_erp` target. No other migration was run.

Post-apply proof:

| Assertion | Result |
|---|---|
| `SequelizeMeta` | 83 → 84 |
| G2A1 migration row | 1 |
| `companies.vat_registered` | present |
| Column nullable | YES |
| Column default | NULL / no default |
| Existing non-null values | 0 |
| Backfill | none |

## 11. Main Backend Promotion

Because the backend source is bind-mounted, only `docker compose restart backend` was used. PostgreSQL, Redis, and frontend were not restarted. The backend remained running with restart count `0` after the controlled restart and served healthy responses.

## 12. Main Frontend State

The existing frontend at `localhost:3000` was retained. No frontend source, build output, `next-env.d.ts`, or configuration was edited. No build was run.

## 13. Post-Promotion Health

PASS:

- `GET http://localhost:8000/api/v1/health` = 200 / UP
- `GET http://localhost:8000/api/v1/health/db` = 200 / PostgreSQL connected
- `GET http://localhost:8000/api/v1/health/redis` = 200 / Redis connected
- `GET http://localhost:3000` = 200

No startup error was observable in the captured post-restart log slice. Health responses are the primary runtime evidence.

## 14. Main Settings Read API

**PARTIALLY OBSERVED / R1 BLOCKED.**

The authenticated browser session successfully loaded `/ar/settings`, which is evidence that the frontend settings journey and its authenticated application flow remained usable. However, the required direct evidence of `GET /api/v1/settings = 200` with returned `taxPolicy` metadata was not captured:

- unauthenticated direct request correctly returned `401`;
- direct backend navigation from the browser tool was blocked by the browser client;
- page evaluation does not expose `fetch`/network APIs;
- no token, cookie, local-storage, or browser profile was inspected.

This is an evidence/access limitation, not proof of a product defect.

## 15. Synthetic Local Test Configuration

The approved synthetic policy values were identified but **not written** because the authenticated PATCH proof could not be safely executed. No real customer data, supplier, location, inventory, purchase, journal, or payment data was created.

Expected synthetic-only values for the next authorized retry would be:

`vatRegistered=true`, `vatRate=5`, enabled treatments `STANDARD_VAT`, `ZERO_RATED`, `REVERSE_CHARGE`, default `STANDARD_VAT`, and `preciousGoodsRcmEnabled=true`.

These were not persisted in this control and are not claimed as product defaults.

## 16. Main Settings Write API

**BLOCKED / NOT RUN.**

Required `PATCH /api/v1/settings` with one synthetic policy update was not sent. The local `ADMIN_EMAIL`/`ADMIN_PASSWORD` environment credential was used only in memory for a login attempt and returned `422`; its value was never printed. The existing browser session is authenticated, but the available browser control surface did not expose a safe authenticated API request facility.

No fallback SQL write, password reset, user creation, or configuration change was used.

## 17. Negative API Proof

- G2A1 unit/route contract tests for invalid treatments, enabled/default consistency, typed `vatRegistered`, and company-override protection: PASS in the focused suite.
- Main-runtime negative API calls: NOT RUN because authenticated Main API access was not available to the direct runner.
- No role fixtures or permanent accounts were created.

## 18. Browser Acceptance

The real existing browser session was used against `localhost:3000`. These pages loaded without visible application errors:

| URL | Result | Evidence |
|---|---|---|
| `/ar/dashboard` | PASS | Arabic dashboard rendered |
| `/ar/settings` | PASS | Settings page rendered |
| `/ar/inventory` | PASS | Empty inventory state rendered |
| `/ar/inventory/gold-by-weight` | PASS | GBW form rendered |
| `/en/inventory/gold-by-piece` | PASS | GBP English form rendered |
| `/ar/suppliers` | PASS | Empty suppliers state rendered |

Browser console error/warning logs were empty for these journeys. Required Network status/taxPolicy response proof remains incomplete, so the R1 browser gate cannot pass.

## 19. Network Evidence

Direct health network evidence is PASS on ports 8000 and 3000. The unauthenticated settings route correctly returned `401`. Authenticated settings Network capture was unavailable through the current browser control surface. No alternate port or temporary backend was accepted as final evidence.

## 20. DB Persistence Proof

Post-migration read-only reconciliation:

| Entity | Count / state |
|---|---:|
| Companies | 1 |
| `vat_registered IS NOT NULL` | 0 |
| Settings | 0 |
| Suppliers | 0 |
| Locations | 0 |
| Purchase orders | 0 |
| Assets | 0 |
| Journal entries | 0 |
| Journal lines | 0 |
| Payments | 0 |
| Audit logs | 23 |

This confirms that the migration was additive and no synthetic Tax Policy business write occurred.

## 21. Audit Proof

No Tax Policy write was executed; therefore no R1 synthetic policy audit event can be claimed. Audit log count remained `23`. The G2A1 source route and focused tests cover semantic audit behavior, but Main DB runtime proof remains pending.

## 22. No Fake Product Defaults Proof

- No supplier was created: `0`.
- No location was created: `0`.
- No purchase order was created: `0`.
- No asset was created: `0`.
- No journal or payment was created: `0`.
- No settings rows were inserted by R1.
- `vat_registered` has no database default and no backfill.
- No production or customer configuration was invented.

## 23. Regression Smoke Checks

Post-promotion focused aggregate: `22 passed, 0 failed`.

Post-promotion browser smoke passed for Dashboard, Settings, Inventory, GBW, GBP, and Suppliers. Empty master-data states (`Suppliers=0`, `Locations=0`, `Assets=0`) were observed and not provisioned. No Receive flow was run.

## 24. Runtime Bugs Found/Fixes

| Finding | Classification | Severity | Action |
|---|---|---|---|
| Main direct login using the container `ADMIN_*` credential returned 422 | ENVIRONMENT_CONFIG / ACCEPTANCE_GAP | P2 | No fix; no credential or account mutation allowed |
| Browser tool could not expose authenticated cross-port Network evidence | TOOLING/ACCEPTANCE_GAP | P2 | No workaround using token/session-store inspection |
| G2A1 migration/backend health issue | None proven | — | No runtime bug fixed |

No business rule, tax formula, accounting authority, or product source was changed during R1.

## 25. Final DB Reconciliation

The final reconciled local DB is still `darfus_erp`, with `SequelizeMeta=84` and the nullable additive column present. Business-domain counts stayed at the pre-apply zero baseline for settings, suppliers, locations, purchase orders, assets, journal entries, journal lines, and payments. Audit logs stayed at `23` because no policy write was attempted.

## 26. Online Production Isolation

PASS. No online production server, production database, deployment command, migration target, or remote URL was contacted. All runtime commands targeted Docker local services or `localhost:3000`/`localhost:8000`.

## 27. Files Changed During R1

Intentional R1 artifacts:

- [Backup](../backups/official/darfus_erp_PRE_G2A1_R1_FULL_20260818_200740.dump)
- This report

No product source, test source, migration source, frontend source, `.env`, `AGENTS.md`, or `next-env.d.ts` was edited during R1. The migration was executed, not created by R1.

## 28. Gate

`GATE = BLOCKED_PHASE_03B_G2A1_R1_MAIN_BROWSER_ACCEPTANCE_FAILURE`

Reason: required authenticated Main Settings GET/one-write/GET response, DB Tax Policy persistence, semantic audit, negative Main API proof, and authenticated Network evidence were not completed. The block is maintained rather than bypassed. The schema migration, backup, health, focused tests, and UI compatibility evidence passed.

## 29. Next Recommended Control

First resolve the authenticated Main API evidence boundary using the existing owner-approved browser session or an explicitly supplied/approved local credential path, without inspecting or printing browser session stores and without changing business data. Then rerun only the remaining R1 Settings GET/PATCH/GET, negative API, DB persistence, audit, and Network checks.

`03B-G2A2-TRANSACTION-TAX-TREATMENT-SNAPSHOT-AND-PRECIOUS-GOODS-RCM-ELIGIBILITY` is **not authorized to start automatically** and must not start while R1 is blocked.

## 30. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PHASE-03B-G2A1-R1-LOCAL-MAIN-ENVIRONMENT-APPLY-AND-RUNTIME-ACCEPTANCE
PHASE = 03B-G2A1-R1
MODE = LOCAL_MAIN_ENVIRONMENT_CONTROLLED_APPLY_AND_ACCEPTANCE
LOCAL_MAIN_DB = darfus_erp
LOCAL_MAIN_BACKEND = http://localhost:8000
LOCAL_MAIN_FRONTEND = http://localhost:3000
ONLINE_PRODUCTION_ENVIRONMENT = UNTOUCHED

G2A1_SOURCE = PASS
PRE_APPLY_FOCUSED_TESTS = PASS (22/22)
PRE_APPLY_TYPECHECK = PASS
LOCAL_MAIN_BACKUP = backups/official/darfus_erp_PRE_G2A1_R1_FULL_20260818_200740.dump
LOCAL_MAIN_BACKUP_SHA256 = 213D434ED11B1D30C318CBEFAE5C32909EEA9697E93F26B43EDF06ECCCAD4736
LOCAL_MAIN_BACKUP_TOC = 1186; pg_restore --list PASS
EXPECTED_PENDING_MIGRATIONS = 20260818020000-add-company-vat-registered.js only
G2A1_MIGRATION = 20260818020000-add-company-vat-registered.js
LOCAL_MAIN_MIGRATION_APPLIED = YES
LOCAL_MAIN_SEQUELIZE_META_BEFORE = 83
LOCAL_MAIN_SEQUELIZE_META_AFTER = 84
VAT_REGISTERED_COLUMN_PRESENT = YES
VAT_REGISTERED_COLUMN_NULLABLE = YES
VAT_REGISTERED_COLUMN_DEFAULT = NULL
MAIN_BACKEND_PROMOTED_TO_G2A1_SOURCE = YES (bind-mounted source; backend-only restart)
MAIN_BACKEND_8000 = PASS
MAIN_FRONTEND_3000 = PASS
MAIN_HEALTH = PASS
MAIN_SETTINGS_READ_API = BLOCKED (authenticated response metadata not captured)
MAIN_SETTINGS_WRITE_API = BLOCKED (not run)
MAIN_TAX_POLICY_PERSISTENCE = BLOCKED (not written)
MAIN_AUDIT = BLOCKED (no policy write)
MAIN_BROWSER = BLOCKED (UI pass; required Network contract incomplete)
MAIN_NETWORK = BLOCKED (authenticated settings evidence unavailable)
MAIN_FRONTEND_COMPATIBILITY = PASS
LOCAL_TEST_CONFIGURATION_USED = NO
LOCAL_TEST_CONFIGURATION_TYPE = SYNTHETIC_ONLY
REAL_CUSTOMER_DATA_USED = NO
SUPPLIER_CREATED_THIS_CONTROL = 0
LOCATION_CREATED_THIS_CONTROL = 0
PURCHASE_ORDER_CREATED_THIS_CONTROL = 0
ASSET_CREATED_THIS_CONTROL = 0
JOURNAL_CREATED_THIS_CONTROL = 0
RECEIVE_RUN_THIS_CONTROL = NO
G2A2_IMPLEMENTED = NO
ONLINE_PRODUCTION_SERVER_CONTACTED = NO
ONLINE_PRODUCTION_DB_CONTACTED = NO
ONLINE_DEPLOYMENT_RUN = NO
RUNTIME_BUGS_FOUND = 2 acceptance/environment evidence blockers; no product defect proven
RUNTIME_BUGS_FIXED = 0
GATE = BLOCKED_PHASE_03B_G2A1_R1_MAIN_BROWSER_ACCEPTANCE_FAILURE
NEXT_RECOMMENDED_STEP = Resolve authenticated Main API evidence boundary, then rerun remaining R1 checks only
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**STOP — Owner Review required. No G2A2, deployment, Receive, onboarding, or online action was started.**
