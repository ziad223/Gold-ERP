# DARFUS ERP — Migration Startup Contract Restoration 01

## Executive Summary — إجابات البداية

| السؤال | الإجابة المثبتة |
|---|---|
| ما الذي كان يمنع الـstartup؟ | `db:migrate` كان يستدعي `migrate-safe.js` الذي يطلب target/approval، وCompose الحالي كان يشغّل `npm start` فقط. |
| ما أمر `db:migrate` الأصلي؟ | `sequelize db:migrate` من Git. |
| ما الـcommit الذي غيره؟ | لا يوجد introducing commit ظاهر؛ التغيير الحالي uncommitted worktree. |
| ما الذي أُعيد؟ | package command وسلسلة Compose `npm run db:migrate && npm start`. |
| هل `migrate-safe.js` موجودة؟ | نعم، محفوظة كـ`db:migrate:safe`. |
| هل Dockerfile تغير؟ | لا؛ `CMD ["npm","start"]` ثابت، وCompose يملك السلسلة. |
| هل تم Clone جديد؟ | نعم، باسم Disposable موثق. |
| ما الـpending؟ | migration واحدة: `20260827010000-gift-voucher-purchased-foundation.js`. |
| هل تمت مراجعتها؟ | نعم، وكل 93 migration قُرئت وقُيدت. |
| هل نجح Auto Migration؟ | نعم على Clone؛ health=200. |
| هل pending أصبحت 0؟ | نعم؛ `SequelizeMeta=93`. |
| هل restart ثانٍ نجح بلا تكرار؟ | نعم. |
| هل فشل migration يمنع npm start؟ | نعم؛ exit=1 ولا يوجد process على 8012. |
| هل SequelizeMeta سليمة؟ | نعم، 93 total و93 distinct. |
| هل تم لمس `darfus_erp`؟ | لا. |
| هل تم Render deploy؟ | لا. |
| هل تم لمس Gift Voucher/UI؟ | لا business mutation ولا UI/UX change. |
| Gate | `PASS_DARFUS_MIGRATION_STARTUP_CONTRACT_RESTORATION` |
| الخطوة التالية | Owner review فقط. |

## 1. Owner Decision

تم تنفيذ استعادة عقد التشغيل فقط، مع إبقاء `darfus_erp` read-only.

## 2. Read First

قُرئت `AGENTS.md`, `PROJECT_PROGRESS_HANDOFF.md`, README، Dockerfile، package،
`.sequelizerc`، config/database، `migrate-safe.js`، server/bootstrap scripts،
كل 93 migration، Compose، تقارير C2C1S ذات الصلة، والاختبارات. لم يحدث reset أو
clean أو stash أو history rewrite.

## 3–8. Current Contract / Git / Runner / Consumers

قبل الاستعادة، diff الـworktree أثبت `db:migrate → node scripts/migrate-safe.js`
وCompose `command: npm start`. Git يثبت الأمر الأصلي وسلسلة Compose الأصلية.
الـrunner هو Sequelize CLI 6.6.5 / ORM 6.37.8 عبر `.sequelizerc` إلى
`backend/migrations`. التفاصيل في artifacts الحالية/ Git/Runner/Consumer.

## 9–10. Minimum Restoration / Files Changed

تمت استعادة `db:migrate` فقط إلى `sequelize db:migrate` وCompose إلى
`sh -c "npm run db:migrate && npm start"`. تم تحديث assertion الاختبار القديم
الذي كان يثبت العقد المعاكس. لم يتغير Dockerfile أو migration content أو business
source أو Gift Voucher logic أو tax/accounting/inventory/UI.

التغييرات المقصودة في هذا control: `backend/package.json`، `docker-compose.yml`،
وassertion الاختبار المركّز؛ أما باقي worktree drift فكان موجودًا قبل هذا control.

## 11–13. Fresh Clone / Pending / Migration Review

تم إنشاء `darfus_migration_startup_restore_20260827_01` من Disposable source
`darfus_c2c1s_migration_guard_01` بعد فحص عدم وجود الهدف. `current_database()`
أثبت الهوية. baseline=92، pending=1 exact. migration 93 قُرئت كاملة وكانت آمنة
لـempty Disposable clone؛ راجع `DARFUS_MIGRATION_PENDING_REVIEW.md`.

## 14–20. Runtime and Integrity Proof

الـfirst boot نفذ migration 93 ثم شغّل API على port 8010؛ health=200. أصبحت
metadata=93، وبقيت Gift Vouchers/companies/users=0. الـsecond boot أعاد رسالة
up-to-date ثم health=200 بلا duplicate. schema objects المتوقعة ظهرت فقط، ولم
تظهر business-row changes. الفشل المعزول أعاد exit=1 ومنع 8012 start.

## 21–25. Safe Tool / Environment / Tests

`npm run db:migrate:safe` بقي manual guarded entrypoint. normal startup لا يطلب
`DARFUS_MIGRATION_TARGET_MODE` أو `DARFUS_OFFICIAL_MIGRATION_APPROVED` أو exact
list أو `--execute`. focused C2C1S test=7/7، acceptance guard=7/7، و
`npm run typecheck`=PASS. لم يُشغّل Next dev أو build.

## 26. Official DB Zero Delta

لم يُنفذ migration/SQL write/restart على `darfus_erp`. read-only post-observation:
`SequelizeMeta=93`, `gift_vouchers=3`, `purchase_orders=14`, `assets=18`,
`journal_entries=34`. كل process mutation كان على Clone صريح. Render لم يُلمس.

## 27–28. Gift Voucher and UI/UX Isolation

Migration proof فقط على Clone فارغ؛ لا issue/redemption/payment أو accounting/tax/
inventory mutation، ولا frontend/UI/UX action.

## 29. Registers

تم تحديث السجلات الستة بالمدخلات `AUTO-STARTUP-MIGRATION-CONTRACT-RESTORE-001`,
`MIGRATION-DEPLOYMENT-CONTRACT-TENSION-001`, و`MIGRATION-STARTUP-CONTRACT-001`.

## 30. Gate

`GATE = PASS_DARFUS_MIGRATION_STARTUP_CONTRACT_RESTORATION`.
كل شروط Git/Clone/runner/metadata/schema/health/failure/tests/typecheck/zero-delta
مرت. provenance الخاص بعدم وجود introducing commit موثق صراحةً.

## 31. Final Tokens

```text
CURRENT_CONTROL = DARFUS-MIGRATION-STARTUP-CONTRACT-RESTORATION-01
MODE = READ_FIRST_PLUS_ORIGINAL_MIGRATION_CONTRACT_RESTORATION_WITH_CLONE_PROOF_ONLY
READ_FIRST = YES
CURRENT_STARTUP_CONTRACT_MAPPED = YES
ORIGINAL_DB_MIGRATE_COMMAND_PROVEN = YES
ORIGINAL_DB_MIGRATE_COMMAND = sequelize db:migrate
INTRODUCING_COMMIT = UNCOMMITTED_WORKTREE_CHANGE (no introducing commit in reachable Git history)
ORIGINAL_MIGRATION_RUNNER = sequelize-cli 6.6.5 -> Sequelize/Umzug via .sequelizerc
ORIGINAL_RUNNER_SOURCE_PROVEN = YES
MIGRATION_CONSUMERS_MAPPED = YES
DOCKERFILE_CHANGE_REQUIRED = NO
PACKAGE_JSON_CHANGE_REQUIRED = YES
MIGRATE_SAFE_DELETED = NO
MIGRATION_FILES_CHANGED = 0
FRESH_CLONE_CREATED = YES
CLONE_IDENTITY_PROVEN = YES
PENDING_MIGRATION_SET_PROVEN = YES
PENDING_MIGRATIONS_REVIEWED = YES
PENDING_MIGRATIONS_SAFE_FOR_CLONE_EXECUTION = YES
SOURCE_RESTORATION = MINIMUM_ONLY
AUTO_STARTUP_MIGRATION_CLONE = PASS
CLONE_PENDING_AFTER_FIRST_START = 0
DOUBLE_START = PASS
MIGRATION_DUPLICATE_EXECUTION = NO
MIGRATION_FAILURE_BLOCKS_APP_START = PASS
FAIL_OPEN_MIGRATION_BEHAVIOR = NO
SEQUELIZE_META_INTEGRITY = PASS
CLONE_SCHEMA_DELTA = EXACT_EXPECTED
CLONE_UNEXPECTED_BUSINESS_DELTA = 0
CLONE_RUNTIME_HEALTH = PASS
DOCKERFILE_CHANGED = NO
MIGRATE_SAFE_RETAINED = YES
MIGRATE_SAFE_MANUAL_ENTRYPOINT = npm run db:migrate:safe
NORMAL_STARTUP_REQUIRES_DARFUS_MIGRATION_TARGET_MODE = NO
NORMAL_STARTUP_REQUIRES_DARFUS_OFFICIAL_MIGRATION_APPROVED = NO
NORMAL_STARTUP_REQUIRES_EXACT_MIGRATION_LIST = NO
NORMAL_STARTUP_REQUIRES_EXECUTE_FLAG = NO
RENDER_ENV_CHANGED = NO
RENDER_DEPLOYMENT = NOT_RUN
OFFICIAL_DB_SCHEMA_DELTA = 0
OFFICIAL_DB_MIGRATION_META_DELTA = 0
OFFICIAL_DB_BUSINESS_DELTA = 0
OFFICIAL_DB_FINANCIAL_DELTA = 0
OFFICIAL_DB_INVENTORY_DELTA = 0
GIFT_VOUCHER_CHANGED = NO
GIFT_VOUCHER_BUSINESS_MUTATION = 0
UI_UX_CHANGED = NO
FOCUSED_STARTUP_MIGRATION_TESTS = PASS (7/7)
AFFECTED_REGRESSION = PASS (acceptance guard 7/7)
TYPECHECK = PASS
SUCCESS_REGISTER_UPDATED = YES
ERROR_REGISTER_UPDATED = YES
ISSUE_BLOCKER_REGISTER_UPDATED = YES
ROOT_CAUSE_PREVENTION_REGISTER_UPDATED = YES
OWNER_DECISION_REGISTER_UPDATED = YES
CLOSED_EVIDENCE_REGISTER_UPDATED = YES
CURRENT_CONTROL_P0 = 0
CURRENT_CONTROL_P1 = 0
P2 = 0
P3 = 1 (worktree provenance has no introducing commit)
GATE = PASS_DARFUS_MIGRATION_STARTUP_CONTRACT_RESTORATION
NEXT_RECOMMENDED_STEP = OWNER REVIEW; no automatic deployment/control
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
MIGRATION_STARTUP_CONTRACT = RESTORED
```

## 32. Next Step

Owner review. لا Render deployment ولا official migration ولا control جديد تلقائيًا.

## 33. STOP

`STOP` — التقرير مكتمل.

