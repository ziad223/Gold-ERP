# DARFUS ERP — UX-12B Build + Raw Evidence Recovery Closeout

## الإجابة التنفيذية

تم فحص سبب فشل build وجمع raw console من 18 route، مع إعادة فحص DataToolbar وhash/rollback وDB. لم يتم تعديل أي product source في هذا Recovery Control، ولم تُجرَ أي كتابة أعمال على `darfus_erp`.

سبب build هو دخول 90 ملفًا من `backups/**` في برنامج TypeScript بسبب `**/*.ts` و`**/*.tsx`، رغم أن `backups/` ignored وغير جزء من runtime. الملف الفاشل نسخة rollback قديمة تفتقد `print-types`. أصغر إصلاح هو استبعاد `backups/**` من build input، لكنه يحتاج Owner approval ولم يُطبق.

raw console عبر Chrome سجّل 0 errors و0 warnings و0 visible application errors على 18 route. لا توفر واجهة Chrome الحالية hooks مستقلة موثوقة لـ`pageerror` و`requestfailed`؛ لذلك لا أرفعها إلى PASS.

## Baseline

- Timestamp: 2026-08-29T19:56:56+03:00.
- Branch `main`; HEAD `1657b0e9ba580faef69be48f04637835c201b521`.
- Worktree: 1021 status lines, 139 tracked modified, 882 untracked, 11 stashes; pre-existing drift preserved.
- Node `v24.19.0`; npm `11.17.0`; Next `16.2.9`; Playwright `1.51.1`.
- Main frontend/backend/DB/Redis remained running; no restart.
- Owner master method file search: not found.

## Build-Scope Forensics

Effective TypeScript config contains the broad globs and does not exclude `backups`. `npx tsc --showConfig` counted 90 backup files in the program. `git ls-files backups` returned no tracked files; `.gitignore` explicitly ignores `backups/`. Product import search found no import from `backups/**`. The failing file is therefore `PREEXISTING_ARCHIVE_ARTIFACT_INCLUDED_IN_COMPILATION`, secondary `BUILD_CONFIGURATION_SCOPE_DEFECT`.

The dedicated build compiled successfully in 44 seconds and then failed TypeScript. First failure was the missing `./print-types` import in the old rollback copy. `BUILD_EXIT_CODE = 1` from the Next build worker. No suppression, deletion, broad source move, package change, or config fix was performed.

## Owner Decision Packet

Proposed minimum change: `tsconfig.json` only, add a narrow `backups/**` exclusion. It should be applied only after Owner approval, with a pre-edit hash, effective-config proof, production build exit 0, and regression checks. The proposal is not applied in this control.

## Raw Browser Evidence

Visited routes: `/ar|en/dashboard`, `/pos`, `/customers`, `/inventory`, `/gold-center`, `/accounting`, `/settings`, `/audit`, `/sales/search-print`. Raw `tab.dev.logs`: 0 errors, 0 warnings; visible fatal error text: 0. Independent `pageerror` and `requestfailed` hooks are unavailable in the connected API, so `PAGEERROR_CAPTURE = BLOCKED` and `REQUESTFAILED_CAPTURE = BLOCKED`.

## DataToolbar

AR and EN reset accessible names passed at 390×844. The accepted `aria-label={resetLabel}` remains the only repair; behavior and disabled logic are unchanged. The prior isolated rollback/hash rehearsal passed.

## Runtime and DB Safety

Health/db/redis/gold GETs returned 200. Official DB identity is `darfus_erp`. Counts are unchanged from UX-12 baseline. Control-owned business/financial/inventory writes are zero. The three known open tracks remain open and were not modified.

## Gate

`GATE = WAITING_OWNER_APPROVAL_FOR_PROVEN_MINIMUM_BUILD_SCOPE_REMEDIATION`

The gate is blocked honestly because the build remains non-zero and raw pageerror/requestfailed capture is unavailable. This is not a product business regression. No repository remediation was applied.

## Final Tokens

```text
CURRENT_CONTROL = DARFUS-UIUX-UX12B-BUILD-RAW-EVIDENCE-RECOVERY-CLOSEOUT-01
MODE = READ_ONLY_FIRST_THEN_OWNER_GATED_MINIMUM_SAFE_CHANGE
EXECUTE_THIS_CONTROL = YES
READ_FIRST = PASS
BUILD_SCOPE_ROOT_CAUSE = PROVEN
BUILD_REPOSITORY_CHANGE_REQUIRED = YES
OWNER_APPROVAL_REQUIRED = YES
REPOSITORY_CHANGE_APPLIED = NO
BUILD_LOCK_ROOT_CAUSE = PROVEN_LIVE_BUILD_NOT_STALE
BUILD = FAIL_PREEXISTING_ARCHIVE_ARTIFACT_INCLUDED_IN_COMPILATION
BUILD_EXIT_CODE = 1
NEXT_ENV_D_TS_DRIFT = OWNER_ACCEPTED_GENERATED_RUNTIME_DRIFT
DIRECT_LOCAL_CHROME = PASS
BROWSER_EXECUTABLE = C:\Program Files\Google\Chrome\Application\chrome.exe
BROWSER_VERSION = 151.0.7922.174
PLAYWRIGHT_VERSION = 1.51.1
PERSONAL_BROWSER_PROFILE_TOUCHED = NO
RAW_CONSOLE_CAPTURE = PASS_TAB_DEV_LOGS_ONLY
PAGEERROR_CAPTURE = BLOCKED_BROWSER_API_LIMITATION
REQUESTFAILED_CAPTURE = BLOCKED_BROWSER_API_LIMITATION
CONSOLE_APPLICATION_ERRORS = 0
UNEXPECTED_PAGEERRORS = UNKNOWN_NOT_EXPOSED
UNEXPECTED_REQUEST_FAILURES = UNKNOWN_NOT_EXPOSED
HYDRATION_ERRORS = 0_VISIBLE_ERRORS
DATATOOLBAR_RESET_AR_ACCESSIBLE_NAME = PASS
DATATOOLBAR_RESET_EN_ACCESSIBLE_NAME = PASS
DATATOOLBAR_RESET_FOCUSABLE = PASS_NATIVE_BUTTON
DATATOOLBAR_BEHAVIOR_CHANGED = NO
UX12_A11Y_REPAIR_SCOPE = ONE_ACCESSIBILITY_ATTRIBUTE
BUSINESS_LOGIC_CHANGED = NO
API_CHANGED = NO
DATABASE_CHANGED = NO
DB_SCHEMA_CHANGED = NO
PERMISSIONS_CHANGED = NO
MIGRATIONS = 0
UX12B_A11Y_RECHECK = PASS
UX12B_ROLLBACK_REHEARSAL = PASS
UX12B_BEFORE_HASH_PARITY = PASS
UX12B_AFTER_HASH_PARITY = PASS
KNOWN_STALE_PRINT_TEST_CLASSIFIED_SEPARATELY = YES
RUNTIME_HEALTH = PASS
UX12B_CONTROL_OWNED_BUSINESS_MUTATING_REQUESTS = 0
MAIN_DB_IDENTITY_VERIFIED = YES
MAIN_DB_CONTROL_OWNED_BUSINESS_WRITES = 0
MAIN_DB_CONTROL_OWNED_FINANCIAL_WRITES = 0
MAIN_DB_CONTROL_OWNED_INVENTORY_WRITES = 0
UX12B_EVIDENCE_ARTIFACTS = PASS
GIFT_VOUCHER_MAPPING_PREVENTION_TRACK = OPEN_UNCHANGED
CGP_PRINT_RECOVERY_UI_001 = OPEN_UNCHANGED
UX11C_PRINT_EXPORT_STALE_NAVIGATION_TEST_001 = OPEN_P3_TEST_MAINTENANCE
P0 = 0
P1 = 0
P2 = 0
P3 = 2
GATE = WAITING_OWNER_APPROVAL_FOR_PROVEN_MINIMUM_BUILD_SCOPE_REMEDIATION
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_ONLY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

توقف هنا. لا تطبق تعديل tsconfig، لا تحذف أو تنقل backups، لا تبدأ UX-13، ولا تبدأ أي track آخر قبل Owner approval صريح.
