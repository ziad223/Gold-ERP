# DARFUS ERP — Frontend Dev Artifact Recovery & CRM‑1B4 Browser Closeout

Control ID: `DARFUS-FRONTEND-DEV-ARTIFACT-RECOVERY-AND-CRM1B4-BROWSER-CLOSEOUT-01`

تم حفظ الدليل التالف ونقل `.next/dev` فقط إلى snapshot قابل للاسترجاع. إعادة التوليد النظيفة أعادت نفس `SyntaxError` بعد `Ready` بينما بقي `.next/dev` بلا ملفات، لذلك أوقفـت بقية الخطوات حسب Control. لم يتم تشغيل Webpack أو Browser أو أي اختبار إضافي بعد هذا الشرط، ولم تُلمس `.next/server` أو المصدر أو `darfus_erp`.

## 1. Executive Summary

| Item | Result | Evidence |
|---|---|---|
| Corrupt evidence preservation | PASS | Five files copied before isolation |
| Dev-tree recovery snapshot | PASS | Complete 11,023-file tree moved outside `.next` |
| Targeted scope | PASS | `.next/dev` only; `.next/server` untouched |
| Clean regeneration | FAIL / reproduced | `npm run dev` → Ready → same SyntaxError; fresh dev tree empty |
| Old bad files active after recovery | 0 | All five absent from fresh `.next/dev` |
| Production path | Previously PASS | Existing `npm start` proof returned AR/EN 200 before this recovery |
| CRM‑1B4 source | Not changed | No source/test/package/config edit in this control |
| Browser closeout | BLOCKED | Stop condition reached before Browser phase |

## 2. Upstream Proven Root Cause

The preceding forensic control proved malformed stale files under `.next/dev/server/chunks/ssr`, classified as `PRE_EXISTING_ARTIFACT / NEXT_GENERATED_ARTIFACT_CORRUPTION`, with CRM‑1B4 not implicated. The complete old dev tree was preserved before this recovery. The new evidence changes the operational conclusion: isolating the old tree did not make `next dev` stable.

```text
UPSTREAM_ROOT_CAUSE = NEXT_GENERATED_DEV_ARTIFACT_CORRUPTION
RECOVERY_FINDING = SAME_SYNTAXERROR_AFTER_CLEAN_DEV_TREE_ISOLATION
```

## 3. Repository Baseline

| Field | Value |
|---|---|
| Project | `I:\WORK\jewellery-erp-master` |
| Branch | `main` |
| HEAD | `1657b0e9ba580faef69be48f04637835c201b521` |
| Before recovery | 146 tracked modified/staged; 901 untracked entries; 11 stashes |
| Existing drift | preserved; no reset/restore/clean/stash |
| Source/test/package changes in this control | none |

## 4. next-env Guard

Before recovery SHA-256:

`7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651`

After the failed clean regeneration the SHA was identical. There was no Git status entry for `next-env.d.ts`, and it was not edited or restored.

## 5. Corrupt Artifact Reconfirmation

All five known files existed before recovery and again failed `node --check` with exit 1 at line 1 / byte 0. Each began with:

`24 1A 9C 92 6D 85 CE 6D 6F 93 4C D2 44 FC DC 3B`

The recorded sizes, SHA-256 values, timestamps, and NUL-byte counts were preserved in `backend/acceptance-artifacts/frontend-dev-artifact-recovery/20260831_010045879/CORRUPT_DEV_ARTIFACT_MANIFEST.md`.

## 6. Evidence Preservation

```text
CORRUPT_ARTIFACT_EVIDENCE_PRESERVED = YES
EVIDENCE_DIR = backend/acceptance-artifacts/frontend-dev-artifact-recovery/20260831_010045879
```

The five files were copied to `corrupt-files/` before any isolation. A metadata file records the source dev-tree counts and the accepted `next-env.d.ts` hash. The evidence contains no credentials or environment values.

## 7. Dev Tree Recovery Snapshot

The complete `.next/dev` directory was moved once, without overwrite, to:

`I:\WORK\jewellery-erp-master\.next-dev-corrupt-backup-20260831_010045879`

| Check | Result |
|---|---:|
| Snapshot present | YES |
| Snapshot files | 11,023 |
| Snapshot bytes | 4,151,957,223 |
| `.next/server` moved | NO |
| Existing snapshot overwritten | NO |
| Snapshot deleted | NO |

```text
DEV_TREE_RECOVERY_SNAPSHOT = CREATED
```

## 8. Targeted Recovery

The only isolated path was `.next/dev`. The old malformed files were no longer at their original location. No source, configuration, package, dependency, production build, database, or Git path was modified.

```text
TARGETED_RECOVERY_SCOPE = .next/dev_ONLY
```

## 9. Turbopack Dev Result

One normal `npm run dev` attempt was made after the move:

```text
▲ Next.js 16.2.9 (Turbopack)
✓ Ready in 2.0s
SyntaxError: Invalid or unexpected token
at ignore-listed frames
exit code 1
```

The process exited and port 3000 had no listener. Per the Control stop condition, no second recovery/deletion attempt was made.

```text
TURBOPACK_DEV_STABLE = BLOCKED_REPRODUCED_GENERATION_FAILURE
```

## 10. Regenerated JS Validation

After the failed clean attempt, `.next/dev` existed but contained 0 files. The five old paths were absent, so there was no newly generated JavaScript to validate and no new SSR chunk to copy.

```text
FRESH_DEV_TREE_FILES = 0
GENERATED_DEV_JS_CHECKED = 0
GENERATED_DEV_JS_SYNTAX_FAILURES = NOT_APPLICABLE_FRESH_TREE_EMPTY
OLD_BAD_ARTIFACT_ACTIVE_COUNT = 0
```

This is not a recovery PASS: the runtime failed before writing the replacement tree.

## 11. Binary Corruption Validation

No fresh binary SSR files were produced. Therefore no new binary prefix/hash comparison is possible. The previous binary files remain preserved in the old snapshot and evidence directory.

```text
REGENERATED_BINARY_CORRUPTION = NOT_OBSERVABLE_NO_FILES_GENERATED
RECOVERY_RESULT = REPRODUCED_GENERATION_CORRUPTION_OR_RUNTIME_FAILURE
```

## 12. Webpack Dev Result

Not run after the clean-regeneration failure. The prior forensic evidence already showed Turbopack and Webpack failed identically before recovery. The current Control explicitly requires stopping when the same failure reproduces after isolation.

```text
WEBPACK_DEV_STABLE = BLOCKED_STOP_CONDITION
```

## 13. Production Runtime Non-Regression

The existing `.next/server` tree was not touched. Before this recovery, the prior forensic control had already proven `npm start` stayed ready and returned HTTP 200 for `/ar/dashboard` and `/en/dashboard`. A new production start was not run after the recovery failure because the Control stop condition was reached.

```text
PRODUCTION_TREE_TOUCHED = NO
PRODUCTION_RUNTIME = PASS_PREVIOUS_FORENSIC_NOT_RERUN_AFTER_STOP
```

## 14. CRM‑1B4 Browser Channel

Browser closeout was not started. The recovery control requires stopping immediately after the same dev failure is reproduced following isolation. No clicks, screenshots, console claims, network claims, credentials, cookies, or business requests were fabricated.

```text
BROWSER_CONTROL = BLOCKED_BY_RECOVERY_STOP_CONDITION
CRM1B4_BROWSER_CLOSEOUT = BLOCKED
```

## 15. AR Customers

Not run. No AR browser evidence is claimed.

```text
AR_BROWSER = BLOCKED
```

## 16. EN Customers

Not run. No EN browser evidence is claimed.

```text
EN_BROWSER = BLOCKED
```

## 17. Legacy Customer Edit

Not run in Browser. The previously established source/clone contract still says legacy phone countries remain unresolved and are not inferred or backfilled; this control performed no save or backfill.

```text
LEGACY_UI_DOES_NOT_AUTO_INFER_COUNTRY = NOT_BROWSER_VERIFIED
```

## 18. POS Phone Lookup

Not run in Browser and no POS request was issued.

```text
POS_PHONE_COUNTRY_BROWSER = BLOCKED
```

## 19. Settings Default Country

Not run in Browser and no Settings write was issued.

```text
SETTINGS_PHONE_COUNTRY_BROWSER = BLOCKED
```

## 20. RTL/LTR

Not run because Browser closeout was blocked before this phase.

```text
RTL_LTR_BROWSER = BLOCKED
```

## 21. Light/Dark

Not run because Browser closeout was blocked before this phase.

```text
LIGHT_DARK_BROWSER = BLOCKED
```

## 22. Responsive

Not run because Browser closeout was blocked before this phase.

```text
RESPONSIVE_BROWSER = BLOCKED
```

## 23. Console / Runtime

The only captured runtime error was the dev process `SyntaxError` shown in Section 9. Browser console/pageerror/network instrumentation was not run. No counts are fabricated.

```text
CONSOLE_APPLICATION_ERRORS = NOT_RUN
NAVIGATION_404 = NOT_RUN
HYDRATION_ERRORS = NOT_RUN
```

## 24. Main DB Safety

No database connection or business request was issued by this recovery control. The protected database remains `darfus_erp`; no Customer, Settings, financial, inventory, migration, or schema write occurred.

```text
MAIN_DB = darfus_erp
MAIN_DB_READ_ONLY = YES
MAIN_DB_BUSINESS_WRITES_BY_CONTROL = 0
MAIN_DB_MIGRATIONS_EXECUTED = 0
MAIN_DB_CUSTOMER_DELTA = 0_BY_CONTROLLED_OPERATIONS
MAIN_DB_FINANCIAL_DELTA = 0_BY_CONTROLLED_OPERATIONS
MAIN_DB_INVENTORY_DELTA = 0_BY_CONTROLLED_OPERATIONS
```

## 25. Focused Tests

Not rerun after the recovery stop condition. The upstream CRM‑1B4 focused result remains 24/24 PASS from the preceding control; no source was changed in this control.

```text
FOCUSED_TESTS = PASS_UPSTREAM_24_OF_24_NOT_RERUN_AFTER_STOP
```

## 26. Cross-Module Regression

Not rerun after the recovery stop condition. The upstream bounded result remains 92/92 PASS from the preceding control; no source was changed in this control.

```text
CROSS_MODULE_REGRESSION = PASS_UPSTREAM_92_OF_92_NOT_RERUN_AFTER_STOP
```

## 27. Typecheck

Not rerun after the recovery stop condition. Upstream CRM‑1B4 typecheck was PASS and no source was changed in this control.

```text
TYPECHECK = PASS_UPSTREAM_NOT_RERUN_AFTER_STOP
```

## 28. Build

Not rerun after the recovery stop condition. The existing production build was previously PASS and was not touched. No build/config mutation was performed here.

```text
BUILD = PASS_UPSTREAM_NOT_RERUN_AFTER_STOP
NEXT_ENV_SHA_UNCHANGED = YES
```

## 29. Recovery Classification

The old stale/corrupt artifact was successfully isolated and preserved, but a fresh `npm run dev` still crashed while the fresh `.next/dev` tree contained zero files. Therefore the stale artifact is not the complete active cause.

```text
ROOT_CAUSE = ENVIRONMENT_RUNTIME_DEFECT
SUBCLASS = WORKSPACE_FILESYSTEM_OR_RUNTIME_GENERATION_FAILURE
RECOVERY_RESULT = REPRODUCED_GENERATION_CORRUPTION
PRODUCT_CHANGE_REQUIRED = NO
CRM1B4_CAUSED_FAILURE = PROVEN_NO
```

The evidence proves recurrence after isolation and strongly localizes the next suspect to the workspace/filesystem/runtime generation path. It does not prove whether the final lower-level owner is Windows filesystem/storage behavior or a Next dev runtime defect; no further bisection was authorized.

## 30. Remaining Risks

| Risk | Severity | Classification | Disposition |
|---|---|---|---|
| Fresh dev generation still exits | P2 operational blocker | ENVIRONMENT_RUNTIME | Owner review; no repeated deletion/retry |
| Browser AR/EN evidence missing | P2 evidence blocker | ACCEPTANCE_GAP | Must be collected only after stable dev runtime |
| `.next/dev` fresh directory is empty | P2 diagnostic signal | WORKSPACE_RUNTIME | Preserve current evidence; do not guess |
| Production build | No new regression proven | RUNTIME | Prior HTTP 200 evidence retained; production tree untouched |
| CRM‑1B4 source | No defect proven | PRODUCT | No source change requested |
| Official DB | No risk introduced | DB_STATE | Zero controlled writes/migrations |

## 31. Gate

The old evidence was preserved and `.next/dev` was isolated once, but clean regeneration reproduced the same failure. The Control therefore does not reach the recovery PASS gate or the full Browser closeout gate.

```text
GATE = BLOCKED_WORKSPACE_FILESYSTEM_RUNTIME_GENERATION_CORRUPTION_REPRODUCED
```

This gate closes the attempted recovery with evidence only. It does not close CRM‑1B4 browser acceptance and does not authorize any product, dependency, Node/Next, database, or migration change.

## 32. Final Tokens

```text
CURRENT_CONTROL = DARFUS-FRONTEND-DEV-ARTIFACT-RECOVERY-AND-CRM1B4-BROWSER-CLOSEOUT-01
OWNER_APPROVAL = EXPLICIT
UPSTREAM_ROOT_CAUSE = NEXT_GENERATED_DEV_ARTIFACT_CORRUPTION

CORRUPT_ARTIFACT_EVIDENCE_PRESERVED = YES
DEV_TREE_RECOVERY_SNAPSHOT = CREATED
TARGETED_RECOVERY_SCOPE = .next/dev_ONLY
PRODUCT_SOURCE_CHANGED = NO
TEST_SOURCE_CHANGED = NO
PACKAGES_CHANGED = NO
NODE_MODULES_CHANGED = NO
NEXT_CONFIG_CHANGED = NO
DATABASE_SCHEMA_CHANGED = NO
MIGRATIONS_EXECUTED = 0

TURBOPACK_DEV_STABLE = BLOCKED_REPRODUCED_GENERATION_FAILURE
WEBPACK_DEV_STABLE = BLOCKED_STOP_CONDITION
GENERATED_DEV_JS_SYNTAX_FAILURES = NOT_APPLICABLE_FRESH_TREE_EMPTY
REGENERATED_BINARY_CORRUPTION = NOT_OBSERVABLE_NO_FILES_GENERATED
OLD_BAD_ARTIFACT_ACTIVE_COUNT = 0
PRODUCTION_RUNTIME = PASS_PREVIOUS_FORENSIC_NOT_RERUN_AFTER_STOP

AR_BROWSER = BLOCKED
EN_BROWSER = BLOCKED
LEGACY_UI_DOES_NOT_AUTO_INFER_COUNTRY = NOT_BROWSER_VERIFIED
POS_PHONE_COUNTRY_BROWSER = BLOCKED
SETTINGS_PHONE_COUNTRY_BROWSER = BLOCKED
RTL_LTR_BROWSER = BLOCKED
LIGHT_DARK_BROWSER = BLOCKED
RESPONSIVE_BROWSER = BLOCKED
CONSOLE_APPLICATION_ERRORS = NOT_RUN
NAVIGATION_404 = NOT_RUN
HYDRATION_ERRORS = NOT_RUN

FOCUSED_TESTS = PASS_UPSTREAM_24_OF_24_NOT_RERUN_AFTER_STOP
CROSS_MODULE_REGRESSION = PASS_UPSTREAM_92_OF_92_NOT_RERUN_AFTER_STOP
TYPECHECK = PASS_UPSTREAM_NOT_RERUN_AFTER_STOP
BUILD = PASS_UPSTREAM_NOT_RERUN_AFTER_STOP
NEXT_ENV_SHA_UNCHANGED = YES

MAIN_DB = darfus_erp
MAIN_DB_READ_ONLY = YES
MAIN_DB_BUSINESS_WRITES_BY_CONTROL = 0
MAIN_DB_MIGRATIONS_EXECUTED = 0
MAIN_DB_CUSTOMER_DELTA = 0_BY_CONTROLLED_OPERATIONS
MAIN_DB_FINANCIAL_DELTA = 0_BY_CONTROLLED_OPERATIONS
MAIN_DB_INVENTORY_DELTA = 0_BY_CONTROLLED_OPERATIONS

RECOVERY_RESULT = REPRODUCED_GENERATION_CORRUPTION
CRM1B4_BROWSER_CLOSEOUT = BLOCKED
GATE = BLOCKED_WORKSPACE_FILESYSTEM_RUNTIME_GENERATION_CORRUPTION_REPRODUCED
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_WORKSPACE_FILESYSTEM_RUNTIME_EVIDENCE_AND_EXPLICIT_NEW_DIAGNOSTIC_APPROVAL
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. Do not repeat cache deletion, move the project, change Node/Next, reinstall dependencies, alter CRM‑1B4, or run Browser acceptance until Owner review and a new explicit diagnostic decision.
