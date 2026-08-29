# DARFUS ERP — UX-12B Owner-Approved Build Scope Remediation + Raw Evidence Final Closeout

## Executive Summary

تم تنفيذ التغيير المصرّح به فقط: إضافة `backups/**` إلى `tsconfig.json` لاستبعاد أرشيفات الأدلة من برنامج TypeScript. لم يتغير كود المنتج أو الاختبارات أو API أو قاعدة البيانات أو المنطق المالي/التشغيلي. نجح typecheck وproduction build بخروج صريح `0`، ونجح harness Playwright المعزول على المسارات الـ18 مع hooks مستقلة لـconsole/pageerror/requestfailed. قاعدة `darfus_erp` بقيت للقراءة فقط.

النتيجة: UX-12B مغلق بنجاح. لم يتم بدء UX-13 أو أي batch تالٍ.

## Baseline

| Item | Before |
|---|---|
| Branch | `main` |
| HEAD | `1657b0e9ba580faef69be48f04637835c201b521` |
| Node/npm | `v24.19.0` / `11.17.0` |
| Worktree | 139 tracked modified, 882 untracked; pre-existing drift preserved |
| `tsconfig.json` SHA-256 | `7707C03B22160D1DDBA7A1E04C307A24590E77999352DA6B6BF328BE1AF91DB5` |
| `next-env.d.ts` SHA-256 | `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651` |
| Database | `darfus_erp` |
| Runtime | frontend 3000, backend 8000, PostgreSQL 5433, Redis 6379 |

## Authorized Diff

Only this intentional source diff was applied:

```diff
"exclude": [
  "node_modules",
- "jewellery-erp-master"
+ "jewellery-erp-master",
+ "backups/**"
]
```

No backup file was deleted, moved, renamed, or edited. `next-env.d.ts` was not manually edited; its accepted generated runtime drift remains unchanged for this control.

## Compiler Scope Proof

| Check | Result |
|---|---:|
| Backup TypeScript files in compiler before | 90 |
| Backup TypeScript files in compiler after | 0 |
| Representative `app/**` files after | 74 |
| Representative `components/**` files after | 112 |
| Representative `lib/**` files after | 53 |
| `src/**` files after | 0 (directory not present in effective program) |

`ARCHIVE_REMOVED_FROM_COMPILATION = YES` and `PRODUCT_SOURCE_REMOVED_FROM_COMPILATION = NO`.

## Typecheck

Command: `npm run typecheck`  
Result: `TYPECHECK = PASS`, exit code `0`.

## Production Build

Command: `npm run build`  
Result: `BUILD = PASS`, explicit `BUILD_EXIT_CODE = 0`.

The build compiled successfully, completed TypeScript, generated 130 static pages, and finalized route optimization. The previous failure from the archived rollback copy no longer occurs.

## Runtime Health

| Service | Evidence | Result |
|---|---|---|
| Frontend | `GET http://localhost:3000/ar/dashboard` | 200 |
| Backend | `GET http://localhost:8000/api/v1/health` | 200 |
| Database health | `GET /api/v1/health/db` | 200 |
| Redis health | `GET /api/v1/health/redis` | 200 |
| Gold health | `GET /api/v1/health/gold` | 200 |
| Containers | `darfus-backend` up; `darfus-postgres` healthy; `darfus-redis` healthy | PASS |

`RUNTIME_HEALTH = PASS`.

## Raw Playwright Evidence

An isolated Playwright Chromium context was used with the known local Chrome executable. The personal browser profile was not opened or touched. Listeners were registered before navigation:

```text
page.on("console", ...)
page.on("pageerror", ...)
page.on("requestfailed", ...)
```

| Route group | Routes | HTTP | Console errors/warnings | Page errors | Request failures | Bad responses |
|---|---:|---:|---:|---:|---:|---:|
| AR/EN fixed matrix | 18 | 18 × 200 | 0 | 0 | 0 | 0 |

Routes covered exactly:

`/ar/dashboard`, `/en/dashboard`, `/ar/pos`, `/en/pos`, `/ar/customers`, `/en/customers`, `/ar/inventory`, `/en/inventory`, `/ar/gold-center`, `/en/gold-center`, `/ar/accounting`, `/en/accounting`, `/ar/settings`, `/en/settings`, `/ar/audit`, `/en/audit`, `/ar/sales/search-print`, `/en/sales/search-print`.

No visible fatal application error or hydration error was observed. `RAW_CONSOLE_CAPTURE = PASS`, `PAGEERROR_CAPTURE = PASS`, `REQUESTFAILED_CAPTURE = PASS`.

## DataToolbar Recheck

The accepted implementation remains the single accessibility repair `aria-label={resetLabel}` in `components/ui/data-toolbar.tsx`. Existing accepted AR/EN evidence and source inspection prove native button focusability and locale-specific accessible names. A fresh unauthenticated headless context reached login before the populated toolbar could render; this is recorded as an authentication-context limitation, not a product failure.

`DATATOOLBAR_RESET_AR_ACCESSIBLE_NAME = PASS`  
`DATATOOLBAR_RESET_EN_ACCESSIBLE_NAME = PASS`  
`DATATOOLBAR_RESET_FOCUSABLE = PASS`  
`DATATOOLBAR_BEHAVIOR_CHANGED = NO`

## DB / Financial / Inventory Safety

Read-only identity and counts:

`darfus_erp | purchase_orders=19 | purchase_order_items=19 | assets=23 | inventory_asset_movements=81 | journal_entries=72 | journal_lines=195 | idempotency_requests=160`

No business POST/PUT/PATCH/DELETE was issued. No migration, seed, inventory transaction, accounting transaction, payment, or financial mutation was executed.

`MAIN_DB_IDENTITY_VERIFIED = YES`  
`MAIN_DB_CONTROL_OWNED_BUSINESS_WRITES = 0`  
`MAIN_DB_CONTROL_OWNED_FINANCIAL_WRITES = 0`  
`MAIN_DB_CONTROL_OWNED_INVENTORY_WRITES = 0`

## Source Integrity

The final worktree is intentionally dirty because of pre-existing project changes: 140 tracked status entries after the authorized `tsconfig.json` edit and 882 untracked entries. The only intentional source change for this control is `tsconfig.json`; the status drift was not cleaned or rewritten. No unauthorized product source changes were introduced.

Final `tsconfig.json` SHA-256: `75F32EC1BB8C2CCA788D3F27A3ED81B200BD157F49F199B541316188BCFB16AC`.

`UNAUTHORIZED_PRODUCT_SOURCE_CHANGES = 0`.

## Rollback Proof

An isolated rollback rehearsal copied the edited file, removed only the approved exclusion in the rehearsal copy, and reapplied it. The real worktree was never replaced.

`ROLLBACK_METHOD = PROVEN`  
`BEFORE_HASH = 7707C03B22160D1DDBA7A1E04C307A24590E77999352DA6B6BF328BE1AF91DB5`  
`AFTER_HASH = 75F32EC1BB8C2CCA788D3F27A3ED81B200BD157F49F199B541316188BCFB16AC`

## Open Registers

The following tracks remain open and unchanged:

- `DARFUS-GIFT-VOUCHER-FINANCIAL-MAPPING-PERSISTENCE-001`
- `CGP-PRINT-RECOVERY-UI-001`
- `UX11C-PRINT-EXPORT-STALE-NAVIGATION-TEST-001` (`OPEN_P3_TEST_MAINTENANCE`)

## Final Gate

```text
CURRENT_CONTROL = DARFUS-UIUX-UX12B-OWNER-APPROVED-BUILD-SCOPE-REMEDIATION-RAW-EVIDENCE-FINAL-CLOSEOUT-01
MODE = OWNER_APPROVED_MINIMUM_SAFE_CHANGE_AND_EVIDENCE_CLOSEOUT
EXECUTE_THIS_CONTROL = YES
OWNER_APPROVAL = EXPLICIT

AUTHORIZED_CHANGE_APPLIED = YES
AUTHORIZED_FILE_CHANGED = tsconfig.json
UNAUTHORIZED_PRODUCT_SOURCE_CHANGES = 0

BUILD_SCOPE_ROOT_CAUSE = PROVEN_PREEXISTING_ARCHIVE_ARTIFACT_INCLUDED_IN_COMPILATION
BACKUP_TS_FILES_IN_COMPILER_BEFORE = 90
BACKUP_TS_FILES_IN_COMPILER_AFTER = 0
ARCHIVE_REMOVED_FROM_COMPILATION = YES
PRODUCT_SOURCE_REMOVED_FROM_COMPILATION = NO

TYPECHECK = PASS
BUILD = PASS
BUILD_EXIT_CODE = 0

DIRECT_LOCAL_CHROME = PASS
PERSONAL_BROWSER_PROFILE_TOUCHED = NO
RAW_CONSOLE_CAPTURE = PASS
PAGEERROR_CAPTURE = PASS
REQUESTFAILED_CAPTURE = PASS
CONSOLE_APPLICATION_ERRORS = 0
UNEXPECTED_PAGEERRORS = 0
UNEXPECTED_REQUEST_FAILURES = 0
HYDRATION_ERRORS = 0

DATATOOLBAR_RESET_AR_ACCESSIBLE_NAME = PASS
DATATOOLBAR_RESET_EN_ACCESSIBLE_NAME = PASS
DATATOOLBAR_RESET_FOCUSABLE = PASS
DATATOOLBAR_BEHAVIOR_CHANGED = NO

BUSINESS_LOGIC_CHANGED = NO
API_CHANGED = NO
DATABASE_CHANGED = NO
DB_SCHEMA_CHANGED = NO
PERMISSIONS_CHANGED = NO
MIGRATIONS = 0
RUNTIME_HEALTH = PASS
MAIN_DB_IDENTITY_VERIFIED = YES
MAIN_DB_CONTROL_OWNED_BUSINESS_WRITES = 0
MAIN_DB_CONTROL_OWNED_FINANCIAL_WRITES = 0
MAIN_DB_CONTROL_OWNED_INVENTORY_WRITES = 0
ROLLBACK_METHOD = PROVEN

GIFT_VOUCHER_MAPPING_PREVENTION_TRACK = OPEN_UNCHANGED
CGP_PRINT_RECOVERY_UI_001 = OPEN_UNCHANGED
UX11C_PRINT_EXPORT_STALE_NAVIGATION_TEST_001 = OPEN_P3_TEST_MAINTENANCE

P0 = 0
P1 = 0
UX12B = PASS
GATE = PASS_DARFUS_UIUX_UX12B_FINAL_EVIDENCE_CLOSEOUT
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_FOR_UX13_ONLY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

UX-12B انتهى. لا يبدأ UX-13 أو أي مسار آخر تلقائيًا؛ المطلوب الآن Owner review فقط.
