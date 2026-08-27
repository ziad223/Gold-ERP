# DARFUS ERP — POS Making Charge Real Chrome Browser Recovery and Final Closeout

ما تم: تمت قراءة تعليمات التحكم والتقارير السابقة، وتشغيل Chrome حقيقي معزول، وإتمام preflight كامل، ثم إثبات رحلتي AR وEN على POS مع Network وConsole، وفحص main dashboard/POS قراءة فقط. ما نجح: قناة Chrome، backend health، DB/Redis health، source/build parity، AR/EN page smoke، pricing response للـAsset الموجود، والاختبارات السابقة المقبولة. ما لم يثبت: full three-Asset browser fixture `19g / 950 AED` في هذا التحكم. ما تغير: لا Product Code ولا tests ولا config ولا database. Root Cause: عطل قناة Browser Control القديمة تم تجاوزه؛ عدم توفر fixtures الرسمية حُدد كحد بيانات قبول، وليس Product defect. Gate: غير مكتمل للـfull closeout. الخطوة التالية فقط: Owner review ثم تحكم معزول ومصرح به لإثبات 19g/950 إن كان مطلوبًا.

## 1. Executive Summary

هذا التحكم استعاد قناة Browser حقيقية بنجاح ولم ينفذ Checkout أو Receive أو أي business mutation. لا يصح إعلان `PASS_POS_MAKING_CHARGE_FINAL_BROWSER_CLOSEOUT` لأن شرط AR/EN الكامل يتطلب ثلاث Assets مع eligible weights `5g + 4g + 10g = 19g` ومصنعية `950 AED`، وهذه fixtures غير موجودة في `darfus_erp` ولم يتم إنشاء Clone جديد في هذا التحكم.

النتيجة الحالية:

```text
BROWSER_RECOVERY = PASS
REAL_CHROME_PREFLIGHT = PASS
AR_SINGLE_ASSET_BROWSER_SMOKE = PASS
EN_SINGLE_ASSET_BROWSER_SMOKE = PASS
AR_EN_FULL_19G_950_BROWSER_PROOF = NOT_PROVEN
OFFICIAL_DB_WRITES = 0
```

## 2. Read-First Sources

- `AGENTS.md` — read completely; official DB and no-Next-dev/target safety rules applied.
- `PROJECT_PROGRESS_HANDOFF.md` — read completely.
- Current control prompt `DARFUS_POS_MAKING_CHARGE_REAL_CHROME_BROWSER_RECOVERY_AND_FINAL_CLOSEOUT-01` — read completely.
- Previous formula, runtime, clone checkout, frontend build, isolated browser, AR, EN, and main smoke reports under `docs/client-requirements/` — read before current evidence update.
- Required legacy filename `DARFUS_POS_MAKING_CHARGE_FRONTEND_BROWSER_FINAL_CLOSEOUT_01.md` was not found; the existing `_REPORT.md` and all referenced evidence artifacts were read.

## 3. Browser Environment Root Cause

التفصيل الكامل في [DARFUS_POS_MAKING_BROWSER_CONTROL_ROOT_CAUSE.md](./DARFUS_POS_MAKING_BROWSER_CONTROL_ROOT_CAUSE.md).

| ID | Layer | Finding | Classification | Disposition |
|---|---|---|---|---|
| `BROWSER_CONTROL_ENVIRONMENT_001` | Browser harness | previous kernel-asset write failed with OS error 3 | environment/tooling | resolved for current run by local Chrome CDP; no Product change |
| `BROWSER_CONTROL_ENVIRONMENT_002` | probe harness | stale manifest path returned 404 | harness input | corrected to actual POS route; no Product change |
| `POS-MAKING-FULL-FIXTURE-003` | acceptance data | official DB lacks the 3-Asset A/B/C fixture set | data availability / safety boundary | no official fixtures created |

`BROWSER_ROOT_CAUSE_PROVEN = YES`

## 4. Recovery Decision

The recovery order used the local Google Chrome executable with a dedicated temporary profile and loopback CDP. No personal Chrome profile was used or mutated. Existing project runtime was observed rather than restarted. The preflight passed, so the current blocker is not browser control availability; it is the missing isolated fixture path for the exact 19g/950 browser assertions.

## 5. Real Chrome / Browser Preflight

Details: [DARFUS_POS_MAKING_REAL_CHROME_PREFLIGHT.md](./DARFUS_POS_MAKING_REAL_CHROME_PREFLIGHT.md)

```text
GOOGLE_CHROME_FOUND = YES
REAL_BROWSER = YES
REAL_BROWSER_NAME = Google Chrome
REAL_BROWSER_VERSION = 151.0.7922.174
REAL_BROWSER_CONTROL_PATH = CDP 127.0.0.1:9223
DEDICATED_BROWSER_PROFILE = YES
PERSONAL_CHROME_PROFILE_MUTATED = NO
BROWSER_PREFLIGHT = PASS
CONSOLE_CAPTURE = PASS
NETWORK_CAPTURE = PASS
```

## 6. Isolated Environment

No new clone was created because the current activity was browser recovery/read-only proof and the official DB did not contain the required three-Asset fixture set. The previous disposable checkout is upstream evidence only; it was not replayed.

```text
ISOLATED_ENV_REQUIRED = YES_FOR_FULL_19G_950_PROOF
DISPOSABLE_CLONE_CREATED_THIS_CONTROL = NO
CLONE_MUTATION_PERFORMED = NO
ISOLATED_DB_IDENTITY_PROVEN = NOT_RUN_THIS_CONTROL
ISOLATED_BACKEND_POINTS_TO_CLONE = NOT_RUN_THIS_CONTROL
ISOLATED_FRONTEND_POINTS_TO_ISOLATED_BACKEND = NOT_RUN_THIS_CONTROL
BROWSER_FIXTURES = NOT_CREATED
CLONE_BROWSER_PROOF = NOT_RUN_THIS_CONTROL
```

The official DB was never used for fixture creation. No clone is being claimed as current proof.

## 7. AR Visual Evidence

Details: [DARFUS_POS_MAKING_AR_BROWSER_NETWORK_FINAL.md](./DARFUS_POS_MAKING_AR_BROWSER_NETWORK_FINAL.md)

The real browser rendered authenticated Arabic POS and the current one-Asset making charge UI. It showed eligible `5 جم`, making `250.00`, VAT `367.42`, and total `2,991.84`. The exact three-Asset `19g / 950 AED` requirement remains `BLOCKED` by unavailable fixtures, not by a demonstrated product failure.

## 8. AR Network Evidence

- Browser-originated Asset search GET returned `200`.
- Browser-originated pricing POST returned `200`.
- Server returned making `250` for the selected 5g eligible Asset at 50 AED/g.
- VAT rate was dynamically `14`; pricing response had a balanced journal preview.
- No checkout or other business mutation was sent.

```text
AR_BROWSER = BLOCKED
AR_VISUAL_TOTAL_MAKING_950 = BLOCKED
AR_STONE_NET_WEIGHT = BLOCKED
AR_NETWORK = PASS
AR_NETWORK_SERVER_MAKING_950 = BLOCKED
AR_CONSOLE_BLOCKERS = 0
```

## 9. EN Visual Evidence

Details: [DARFUS_POS_MAKING_EN_BROWSER_NETWORK_FINAL.md](./DARFUS_POS_MAKING_EN_BROWSER_NETWORK_FINAL.md)

The real browser rendered authenticated English POS and the current one-Asset making charge UI. It showed eligible `5 g`, making `AED 250.00`, VAT `AED 367.42`, and total `AED 2,991.84`. The exact three-Asset `19g / 950 AED` requirement remains `BLOCKED` by unavailable fixtures.

## 10. EN Network Evidence

- Browser-originated Asset search GET returned `200`.
- Browser-originated pricing POST returned `200`.
- Server returned making `250` for the selected 5g eligible Asset at 50 AED/g.
- VAT rate was dynamically `14`; pricing response had a balanced journal preview.
- No checkout or other business mutation was sent.

```text
EN_BROWSER = BLOCKED
EN_VISUAL_TOTAL_MAKING_950 = BLOCKED
EN_STONE_NET_WEIGHT = BLOCKED
EN_NETWORK = PASS
EN_NETWORK_SERVER_MAKING_950 = BLOCKED
EN_CONSOLE_BLOCKERS = 0
```

## 11. Main Read-Only Browser Smoke

Details: [DARFUS_POS_MAKING_MAIN_FRONTEND_READONLY_SMOKE.md](./DARFUS_POS_MAKING_MAIN_FRONTEND_READONLY_SMOKE.md)

```text
MAIN_AR_READONLY_BROWSER = PASS
MAIN_EN_READONLY_BROWSER = PASS
MAIN_CONSOLE_BLOCKERS = 0
MAIN_FAILED_RESPONSES = 0
MAIN_BUSINESS_MUTATIONS = 0
```

The existing runtime on `localhost:3000` was used. No new frontend was started. The observed frontend process on port 3000 was PID `12480`; an existing Next dev process was observed but not started or stopped by this control. This is recorded as environment drift because AGENTS forbids starting Next dev during acceptance.

## 12. Official DB Before/After

Official identity was verified read-only:

```text
SELECT current_database(), current_user;
=> darfus_erp | postgres
```

Current counts matched the accepted baseline observation:

| Table | Count | Current-control business delta |
|---|---:|---:|
| `assets` | 18 | 0 observed |
| `asset_pricing_policies` | 14 | 0 observed |
| `invoices` | 3 | 0 observed |
| `invoice_items` | 3 | 0 observed |
| `payments` | 3 | 0 observed |
| `cash_transactions` | 11 | 0 observed |
| `journal_entries` | 29 | 0 observed |
| `journal_lines` | 81 | 0 observed |
| `inventory_asset_movements` | 70 | 0 observed |
| `audit_logs` | 187 | 0 observed |
| `idempotency_requests` | 105 | 0 observed |

The current browser journey captured no business POST to the official backend. Because this control did not create a clone or execute a mutation, no clone delta is claimed.

```text
OFFICIAL_DB = darfus_erp
OFFICIAL_BUSINESS_WRITES_BY_CONTROL = 0
OFFICIAL_FINANCIAL_DELTA_BY_CONTROL = 0
OFFICIAL_INVENTORY_DELTA_BY_CONTROL = 0
```

## 13. Accounting / Inventory Safety

- The current read-only pricing response had `journalPreview.balanced = true`.
- The prior disposable checkout acceptance remains upstream evidence for `950` making, VAT once, balanced journal, payment, inventory, and idempotency. It is not a new browser proof in this control.
- No Asset status, inventory movement, invoice, payment, journal, or barcode was created or changed by this control.
- The existing official inventory remains untouched.

## 14. Historical 0.01 Exception

The existing exception remains unchanged and is not attributed to this control:

```text
JOURNAL = JE-1787090870905
SOURCE = PO-1787090870807
DEBIT = 2133.21000000
CREDIT = 2133.22000000
DELTA = 0.01000000
CHANGED_BY_THIS_CONTROL = NO
ATTRIBUTED_TO_POS_MAKING_FIX = NO
```

## 15. Security

- Dedicated temporary Chrome profile only; personal profile not used.
- No cookies, local storage, passwords, or session stores were inspected.
- No auth/RBAC/company/branch bypass was introduced.
- The authenticated session resolved Branch-1 through the application context.

## 16. Files Changed

Product source hashes and mtimes remained unchanged during this control. No Product or test file was edited. Documentation artifacts only were created/updated:

- `docs/client-requirements/DARFUS_POS_MAKING_BROWSER_CONTROL_ROOT_CAUSE.md`
- `docs/client-requirements/DARFUS_POS_MAKING_REAL_CHROME_PREFLIGHT.md`
- `docs/client-requirements/DARFUS_POS_MAKING_ISOLATED_BROWSER_ENV_PROOF.md`
- `docs/client-requirements/DARFUS_POS_MAKING_AR_BROWSER_NETWORK_FINAL.md`
- `docs/client-requirements/DARFUS_POS_MAKING_EN_BROWSER_NETWORK_FINAL.md`
- `docs/client-requirements/DARFUS_POS_MAKING_MAIN_FRONTEND_READONLY_SMOKE.md`
- `docs/client-requirements/DARFUS_POS_MAKING_CHARGE_FRONTEND_BROWSER_FINAL_CLOSEOUT_01_REPORT.md`

Pre-existing worktree changes were not cleaned, reset, staged, or assumed as this control’s Product changes. `git status` was read using an explicit safe-directory override only; no Git config was changed.

## 17. Tests / Runtime

No Product source changed, so the previously accepted affected result was not rerun unnecessarily:

```text
PREVIOUS_ACCEPTED_AFFECTED_TESTS = 59/59 PASS
PREVIOUS_ACCEPTED_TYPECHECK = PASS
CURRENT_PRODUCT_SOURCE_CHANGED = NO
CURRENT_TEST_SOURCE_CHANGED = NO
```

Current runtime read-only proof:

```text
GET /api/v1/health = 200
GET /api/v1/health/db = 200
GET /api/v1/health/redis = 200
GBW authenticated contract = 200
GBP authenticated contract = 200
AR/EN POS page = 200
```

Gold Center was observed as `STALE` with live provider `GOLDAPI_IO`; recurring provider network/unknown refresh failures and quote age above `staleAfter` are a separate provider/runtime issue. It explains disabled profile receive controls and is not a POS making formula change.

## 18. Issues

| ID | Severity | Classification | Status | Impact |
|---|---|---|---|---|
| `BROWSER_CONTROL_ENVIRONMENT_001` | P2 historical | ENVIRONMENT_CONFIG / ACCEPTANCE_GAP | resolved for current run | old browser channel could not write kernel assets; local Chrome path now works |
| `POS-MAKING-FULL-FIXTURE-003` | P2 | ACCEPTANCE_GAP / MISSING_DATA | open | exact AR/EN `19g / 950` browser assertions need isolated fixtures |
| `GOLD-RUNTIME-STALE-001` | P2 operational/provider | PROVIDER_EXTERNAL / RUNTIME | observed, out of scope | Gold Center freshness blocks gold-profile receive controls; no POS formula regression proven |
| `PURCHASE-ORDER-UNBALANCED-JOURNAL-001` | P1 baseline exception | FINANCIAL / pre-existing | unchanged | historical 0.01 imbalance; not created or changed here |

No P0 or current-control P1 was introduced. The baseline P1 is explicitly excluded from this control’s mutation scope.

## 19. Gate

The Browser environment recovery gate passes, but the final POS making browser closeout gate does not pass because required AR/EN 3-Asset `19g / 950` proof was not produced. This is an incomplete acceptance evidence gate, not permission to fake a PASS.

```text
GATE = BLOCKED_FULL_AR_EN_19G_950_BROWSER_EVIDENCE_NOT_PRODUCED
```

## 20. Final Tokens

```text
CURRENT_CONTROL = DARFUS-POS-MAKING-CHARGE-REAL-CHROME-BROWSER-RECOVERY-AND-FINAL-CLOSEOUT-01
PARENT_CONTROL = DARFUS-POS-MAKING-CHARGE-FRONTEND-BROWSER-FINAL-CLOSEOUT-01
READ_FIRST = YES
BROWSER_ROOT_CAUSE_PROVEN = YES
BROWSER_CONTROL_ENVIRONMENT_001 = RESOLVED
GOOGLE_CHROME_FOUND = YES
REAL_BROWSER = YES
REAL_BROWSER_NAME = Google Chrome
REAL_BROWSER_VERSION = 151.0.7922.174
REAL_BROWSER_CONTROL_PATH = CDP 127.0.0.1:9223
DEDICATED_BROWSER_PROFILE = YES
PERSONAL_CHROME_PROFILE_MUTATED = NO
BROWSER_PREFLIGHT = PASS
ISOLATED_ENV_REQUIRED = YES_FOR_FULL_19G_950_PROOF
ISOLATED_DB_IDENTITY_PROVEN = NOT_RUN_THIS_CONTROL
ISOLATED_BACKEND_POINTS_TO_CLONE = NOT_RUN_THIS_CONTROL
ISOLATED_FRONTEND_POINTS_TO_ISOLATED_BACKEND = NOT_RUN_THIS_CONTROL
BROWSER_FIXTURES = NOT_CREATED
NEW_BROWSER_CHECKOUT_REQUIRED = NO_UNLESS_REGRESSION_PROVEN
AR_BROWSER = BLOCKED
AR_VISUAL_TOTAL_MAKING_950 = BLOCKED
AR_STONE_NET_WEIGHT = BLOCKED
AR_NETWORK = PASS
AR_NETWORK_SERVER_MAKING_950 = BLOCKED
AR_CONSOLE_BLOCKERS = 0
EN_BROWSER = BLOCKED
EN_VISUAL_TOTAL_MAKING_950 = BLOCKED
EN_STONE_NET_WEIGHT = BLOCKED
EN_NETWORK = PASS
EN_NETWORK_SERVER_MAKING_950 = BLOCKED
EN_CONSOLE_BLOCKERS = 0
MAIN_AR_READONLY_BROWSER = PASS
MAIN_EN_READONLY_BROWSER = PASS
FRONTEND_RUNTIME_PARITY = PASS
BACKEND_RUNTIME_PARITY = PASS
MAIN_RUNTIME_CHECK = PASS
PRODUCT_BUSINESS_LOGIC_CHANGED = NO
MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED_ON_OFFICIAL_DB = 0
OFFICIAL_DB = darfus_erp
OFFICIAL_BUSINESS_WRITES_BY_CONTROL = 0
OFFICIAL_FINANCIAL_DELTA_BY_CONTROL = 0
OFFICIAL_INVENTORY_DELTA_BY_CONTROL = 0
PRE_EXISTING_JE_EXCEPTION_CHANGED_BY_CONTROL = NO
ATTRIBUTED_TO_POS_MAKING_FIX = NO
CURRENT_CONTROL_P0 = 0
CURRENT_CONTROL_P1 = 0
P2 = 3
P3 = 0
POS_MAKING_CHARGE_FORMULA = RUNTIME_PROVEN_PREVIOUS_CLONE; CURRENT_AR_EN_FULL_BROWSER_PROOF_PENDING
GATE = BLOCKED_FULL_AR_EN_19G_950_BROWSER_EVIDENCE_NOT_PRODUCED
NEXT_RECOMMENDED_STEP = OWNER_REVIEW; IF_APPROVED_CREATE_DISPOSABLE_CLONE_AND_RUN_ONLY_FULL_AR_EN_19G_950_BROWSER_PROOF
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 21. Next Step

Owner review only. If the owner wants the exact browser gate closed, authorize a separate disposable-clone fixture proof for A/B/C and run only the missing AR/EN `19g / 950` evidence. Do not create official fixtures, do not checkout on `darfus_erp`, do not repair the historical journal, and do not start Gift Voucher or another business batch automatically.

## 22. STOP

STOP.

