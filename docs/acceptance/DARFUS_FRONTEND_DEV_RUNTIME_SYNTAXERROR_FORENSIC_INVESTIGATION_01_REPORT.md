# DARFUS ERP — Frontend Dev Runtime SyntaxError Forensic Investigation

Control ID: `DARFUS-FRONTEND-DEV-RUNTIME-SYNTAXERROR-FORENSIC-INVESTIGATION-01`

تم تنفيذ التحقيق للقراءة فقط. أُعيد إنتاج الانهيار بعد `Ready`، وثبت وجود خمس وحدات SSR ثنائية تالفة داخل `.next/dev` لا تُفسَّر كـJavaScript. شجرة الإنتاج الحالية تعمل بـHTTP 200، وملفات المصدر/الإعدادات والحزمة الجديدة الخاصة بـCRM‑1B4 اجتازت الفحوص. لم يُطبَّق أي إصلاح، ولم تُغيَّر قاعدة البيانات أو الحزم أو إعدادات Next.

## 1. Executive Summary

| Finding | Result |
|---|---|
| `npm run dev` | Reproduced; exit 1 after `Ready` |
| Turbopack vs Webpack | Both fail with the same hidden `SyntaxError` |
| Exact failing artifact | 5 stale binary files under `.next/dev/server/chunks/ssr` |
| Production isolation | `npm start` stayed ready; AR/EN HEAD returned 200 |
| CRM‑1B4 relation | Proven not the cause; affected artifacts predate CRM‑1B4 files and target unrelated modules |
| Classification | `PRE_EXISTING_ARTIFACT` / Next generated dev artifact corruption |
| Fix | Not applied; Owner approval required |

## 2. Current Failure

Observed output for both dev paths:

```text
✓ Ready in <1s
SyntaxError: Invalid or unexpected token
    at ignore-listed frames
```

`npm run dev` exited with code 1 and the port stopped listening. The current run completed in about 3.1 seconds; the error appeared immediately after `Ready`. `curl`/HEAD connectivity after the crash had no stable dev server.

## 3. Read-Only Scope

Allowed diagnostics only: process/port inspection, source/config reads, package resolution, JSON/syntax checks, existing production start, generated-artifact inspection, and temporary process-scoped `NODE_OPTIONS`. No source/test/package/config edit, package install, cache deletion/rename, Git mutation, migration, or database write was performed.

## 4. Repository Baseline

| Field | Evidence |
|---|---|
| Project | `I:\WORK\jewellery-erp-master` |
| Branch | `main` |
| HEAD | `1657b0e9ba580faef69be48f04637835c201b521` |
| Pre-investigation status | 146 tracked modified/staged entries; 900 untracked entries; pre-existing drift preserved |
| Stashes | 11 |
| `next-env.d.ts` | no Git status entry; SHA-256 `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651` |
| Git operations | no reset, restore, clean, stash, add, commit, or push |

## 5. Runtime Versions

| Runtime | Value |
|---|---|
| Node | `v24.19.0` |
| npm | `11.17.0` |
| Next | `16.2.9` (`npx --no-install next --version`) |
| React / React DOM | `19.2.7 / 19.2.7` |
| `libphonenumber-js` | `1.13.12` in root and backend manifests |

`next.config.ts`, `proxy.ts`, and `tsconfig.json` were read. No second project-owned Next process was left running after the diagnostic runs; port 3000 was clear at the final check.

## 6. Exact Reproduction

| Command | Result | Timing / exit |
|---|---|---|
| `npm run dev` | Next 16.2.9 Turbopack reports Ready, then `SyntaxError: Invalid or unexpected token` | exit 1; process about 3.1s |
| `NODE_OPTIONS=--trace-uncaught npm run dev` | Same output; no expanded source path | exit 1 |
| `node --trace-uncaught .\\node_modules\\next\\dist\\bin\\next dev` | Same output | exit 1 |
| Port after crash | no listener | verified read-only |

`FAILURE_REPRODUCED = YES`.

## 7. Turbopack vs Webpack

`npx --no-install next dev --webpack` also reports `Ready`, the same `SyntaxError`, and exits with code 1. Therefore:

```text
TURBOPACK_ONLY_DEFECT = NO
WEBPACK_ONLY_DEFECT = NO
SHARED_DEV_RUNTIME_OR_ARTIFACT_PATH_SUSPECT = YES
```

No permanent Webpack switch was made.

## 8. Production Runtime Isolation

The existing production build was not rebuilt in this control. `npm start` loaded the existing `.next/server` output, stayed ready, and returned:

| URL | Result |
|---|---|
| `http://localhost:3000/en/dashboard` | HEAD 200 |
| `http://localhost:3000/ar/dashboard` | HEAD 200 |

```text
START_PROCESS_STAYS_ALIVE = YES_DURING_CHECK
PRODUCTION_RUNTIME_RESULT = PASS_HTTP_200
SAME_SYNTAXERROR = NO
```

The diagnostic process was stopped after the read-only check. This is strong evidence that the failure is isolated to the dev path/artifacts, not a general source parse failure.

## 9. Dependency Smoke

The CRM‑1B4 dependency was loaded directly without editing:

```text
require('libphonenumber-js/max').parsePhoneNumberFromString = function
01012345678 + EG = +201012345678
```

```text
LIBPHONENUMBER_DIRECT_RUNTIME = PASS
```

The resolved module is `node_modules/libphonenumber-js/max/index.cjs`; `node --check` passed.

## 10. Dependency Integrity

The resolved `libphonenumber-js/max/index.cjs` is readable UTF-8/CJS-compatible content with no BOM and no NUL bytes. It is 3,921 bytes, has SHA-256 `CF59D6231BF62E1B47B1219425B2898D58B8D584A1C043BAED9B023724F4B697`, and `node --check` exited 0. The source package entry is valid. No dependency reinstall or version change was performed.

## 11. Startup Import Inspection

Read-only files inspected:

- `next.config.ts`
- `proxy.ts`
- `app/[locale]/layout.tsx`
- `app/providers.tsx`
- `tsconfig.json`

They contain valid source structure and no CRM‑1B4 direct imports. The CRM‑1B4 imports occur in Customer, POS, Settings, repository, and selector paths; they are not imported by `next.config.ts`, `proxy.ts`, the locale layout, or `app/providers.tsx`.

```text
CRM1B4_IMPORT_PATH_REACHABLE_AT_DEV_START = NO_DIRECT_STARTUP_IMPORT
```

This does not claim that a later page compilation can never load CRM code; it proves the observed startup failure is not from a direct root startup import.

## 12. Encoding / Invalid Token Inspection

The likely startup files and all inspected CRM‑1B4 frontend paths were checked read-only:

| Check | Result |
|---|---|
| UTF-8 validity | PASS |
| BOM | none |
| NUL bytes | 0 |
| Replacement characters | none |
| Suspicious `0x1A`/`0x7F` in source | none |
| JSON parse: root/backend package and tsconfig | PASS |
| `.env` structure | 15 lines; 4 variable assignments; no malformed assignment |

No secret value was printed. Temporary `NODE_OPTIONS=--trace-uncaught` was process-scoped only and was not persisted.

## 13. CRM-1B4 Change Relationship

The invalid artifacts are not CRM‑1B4 source files. They include a generated Lucide House icon chunk and generated root chunks referenced by login, settings-users, stock-audit, and not-found entries. Their modification times range from 2026-08-16 through 2026-08-28, while CRM‑1B4 source files were modified on 2026-08-30/31.

Additional evidence:

- Direct `libphonenumber-js/max` smoke passed.
- CRM‑1B4 typecheck and the existing production build had passed before this investigation.
- Existing production `.next/server` JavaScript sample parsed successfully and `npm start` returned 200.
- No direct CRM‑1B4 import exists in the startup graph inspected above.

```text
CRM1B4_CAUSED_FAILURE = PROVEN_NO
```

## 14. .next Artifact Inspection

`.next` exists and contains separate `dev` and production `server` trees. The dev tree contains stale SSR chunks with old timestamps. Five files share the same binary prefix:

```text
24 1A 9C 92 6D 85 CE 6D 6F 93 4C D2 44 FC DC 3B ...
```

They contain NUL bytes and no meaningful printable JavaScript text. Their exact sizes and SHA-256 values were recorded during inspection:

| Generated file | Size | SHA-256 | Last write |
|---|---:|---|---|
| `.next/dev/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_house_1fn6ej3.js` | 1,967 | `A556D7DDD99E9DE34B4AB376AF6C99579D19FFB54AD6BFBB5DA0D05701383386` | 2026-08-28 |
| `.next/dev/server/chunks/ssr/[root-of-the-server]__1eio2bz._.js` | 4,733 | `4F88A64C889A015F256D0C92354EFECD9A0EE18090C627896941A10FCB40595B` | 2026-08-23 |
| `.next/dev/server/chunks/ssr/[root-of-the-server]__1_vhypj._.js` | 4,626 | `2918E82DCAC52C692DBF172C6ED394CB3261E9DBC7CDAACA673018F17065C5AB` | 2026-08-18 |
| `.next/dev/server/chunks/ssr/node_modules_1w8vxjs._.js` | 2,106 | `225AC48EBEA5485F2529F05BEAF0984766AC79CA23C66DB285F66DC6E298AFD3` | 2026-08-16 |
| `.next/dev/server/chunks/ssr/[root-of-the-server]__1te_y_v._.js` | 4,308 | `9F47D695509434824A49D718E298D3A672E530E5CEF1252F29FF34904938AD6A` | 2026-08-16 |

The generated app entry files reference these chunks. No artifact was deleted, renamed, or rewritten.

## 15. Node Syntax Checks

Bounded generated-artifact parsing used `vm.Script` and exact `node --check` confirmation:

| Scope | Checked | Failures |
|---|---:|---:|
| `.next/dev/server/app/**/*.js` | 130 | 0 |
| `.next/dev/server/**/*.js` | 620 | 5 |
| `.next/dev/static/chunks` recent sample | 40 | 0 |
| `.next/server` recent production sample | 40 | 0 |
| Direct failing files with `node --check` | 5 | 5 |

Each failing file fails at line 1 / byte 0 with `SyntaxError: Invalid or unexpected token`. This is the exact lower-level parse failure corresponding to the hidden dev message.

## 16. Config / JSON Inspection

`package.json`, `backend/package.json`, `tsconfig.json`, `.next/package.json`, and `.next/dev/package.json` parsed successfully. `next.config.ts` and `proxy.ts` passed Node syntax checking and were successfully loaded by `npm start`. No configuration file was changed.

```text
STARTUP_CONFIG_SYNTAX = PASS
```

## 17. Environment Structural Inspection

`.env` was inspected by variable name and structure only. It has four non-comment assignments, each with a valid variable name and `=` delimiter. Values were not printed. No permanent environment variable was added or changed.

## 18. Next Error Formatter Investigation

The string `ignore-listed frames` was not found in the installed JavaScript sources under `node_modules/next` or `node_modules/@next`. The phrase therefore did not provide the original file path in this environment and was not used as root-cause evidence.

The direct `node --check` of the generated files exposes the original path, line 1, and byte-0 invalid token. That artifact evidence is stronger than the filtered dev display.

## 19. Eliminated Causes

| Candidate | Result | Evidence |
|---|---|---|
| Turbopack-only defect | Eliminated | Webpack reproduces same failure |
| Webpack-only defect | Eliminated | Turbopack reproduces same failure |
| General production source syntax | Strongly eliminated | existing production JS parses; `npm start` returns 200 |
| `libphonenumber-js` corruption | Eliminated | direct require/parse and `node --check` pass |
| CRM‑1B4 direct startup import | Eliminated | no direct startup import; bad chunks predate CRM files |
| JSON/config syntax | Eliminated | JSON parse, config checks, production startup pass |
| Official DB/backend failure | Not implicated | this is frontend dev process; no DB write/action occurred |
| Environment-wide root cause | Not fully eliminated | workspace filesystem is slow/network-backed; it may explain stale artifact generation, but no causal proof |

## 20. Proven Root Cause

```text
ROOT_CAUSE = PRE_EXISTING_ARTIFACT
SUBCLASS = NEXT_GENERATED_ARTIFACT_CORRUPTION
```

The immediate throw is a JavaScript parser reading a binary, non-JavaScript file from `.next/dev/server/chunks/ssr`. The artifact is referenced by generated dev app entries and is loaded by the shared Next dev path. The invalid files predate this investigation and CRM‑1B4 source timestamps.

Why dev fails: the dev runtime reaches the stale malformed SSR chunks after reporting `Ready`.

Why production passes: `npm start` uses the separate `.next/server` build tree, whose inspected files are valid JavaScript and which served both AR and EN HEAD requests with 200.

The deeper reason those old `.next/dev` files became binary is not proven by read-only evidence; it may be stale/corrupted generated output or a filesystem/cache write problem. No claim beyond the proven artifact failure is made.

## 21. System Impact

- Development frontend server is unusable until the affected dev output is regenerated or otherwise isolated.
- Existing production build path is operational at the time of proof.
- No business logic, API contract, database, migration, permissions, accounting, inventory, or CRM data was changed.
- Browser acceptance against a dev server cannot proceed while this artifact remains active.

## 22. Minimum Safe Fix Proposal

Do not apply in this control. After explicit Owner approval, the minimum proposed correction is to regenerate only the project-owned `.next/dev` output under a controlled checkpoint, then verify that the five affected generated files are replaced by valid JavaScript and rerun both `npm run dev` and `npx next dev --webpack`. The proposed procedure must:

1. record and protect the accepted `next-env.d.ts` SHA;
2. exact-target only the dev artifact directory; never touch source, packages, or the official DB;
3. avoid permanent Webpack/config changes;
4. verify source status after regeneration; and
5. rerun the smallest dev/production/CRM regression checks.

No dependency change is proposed. If regeneration reproduces binary output, stop and escalate a workspace/filesystem/runtime investigation instead of repeatedly deleting caches.

## 23. Owner Decision Packet

```text
ROOT_CAUSE = PRE_EXISTING_ARTIFACT
FAILING_COMPONENT = Next dev SSR generated artifact loader
FAILING_FILE = .next/dev/server/chunks/ssr (five files listed in Section 14)
FAILING_LINE_OR_BYTE = line 1 / byte 0; first bytes 24 1A 9C 92 6D 85 CE 6D 6F 93 4C D2 44 FC DC 3B
TRIGGER = dev runtime loads stale binary SSR chunk after Ready
WHY_DEV_FAILS = malformed .next/dev SSR chunk is parsed as JavaScript
WHY_BUILD_PASSES_OR_DOES_NOT_PASS = production .next/server tree is separate and parses; npm start returns 200
CRM1B4_RELATION = PROVEN_NO
SYSTEM_IMPACT = frontend dev runtime unavailable; production build path unaffected in this proof
PROPOSED_MINIMUM_SAFE_FIX = owner-approved regeneration of only .next/dev with SHA/source guards
FILES_THAT_WOULD_CHANGE = generated .next/dev artifacts only, if approved
DEPENDENCIES_THAT_WOULD_CHANGE = none
CACHE_ACTION_IF_ANY = not performed; controlled dev-artifact regeneration proposed only
WHY_THIS_FIX_IS_MINIMUM = targets the exact invalid generated output without source/config/package changes
EXPECTED_EFFECT = valid dev SSR chunks and stable port 3000
REGRESSION_RADIUS = frontend development compilation and browser acceptance; no business data path
ROLLBACK_METHOD = restore/retain the current generated-artifact snapshot only under a separately approved procedure; no Git/source rollback
OWNER_APPROVAL_REQUIRED = YES
```

## 24. Gate

The exact root cause of the observed throw is proven at generated-file/byte level, but no fix was authorized or applied.

```text
GATE = PASS_FORENSIC_ROOT_CAUSE_PROVEN_AWAITING_OWNER_FIX_APPROVAL
```

This gate does not mean the dev server is fixed. It only closes the forensic investigation and hands the evidence to the Owner.

## 25. Final Tokens

```text
CURRENT_CONTROL = DARFUS-FRONTEND-DEV-RUNTIME-SYNTAXERROR-FORENSIC-INVESTIGATION-01
MODE = READ_ONLY_FORENSIC_ROOT_CAUSE_DISCOVERY_ONLY
IMPLEMENTATION_ALLOWED = NO
FIX_ALLOWED = NO

FAILURE_REPRODUCED = YES
TURBOPACK_RESULT = FAIL_EXIT_1_SYNTAXERROR_AFTER_READY
WEBPACK_RESULT = FAIL_EXIT_1_SAME_SYNTAXERROR_AFTER_READY
PRODUCTION_RUNTIME_RESULT = PASS_HTTP_200_START_STAYS_ALIVE
LIBPHONENUMBER_DIRECT_RUNTIME = PASS
STARTUP_CONFIG_SYNTAX = PASS
GENERATED_ARTIFACT_SYNTAX = FAIL_5_OF_620_DEV_SERVER_CHUNKS
ROOT_CAUSE = PRE_EXISTING_ARTIFACT
FAILING_COMPONENT = NEXT_DEV_SSR_GENERATED_ARTIFACT
FAILING_FILE = FIVE_STALE_BINARY_FILES_UNDER_.next/dev/server/chunks/ssr
FAILING_LINE_OR_BYTE = LINE_1_BYTE_0
CRM1B4_CAUSED_FAILURE = PROVEN_NO

PRODUCT_CODE_CHANGED = NO
TESTS_CHANGED = NO
PACKAGES_CHANGED = NO
NEXT_CONFIG_CHANGED = NO
NEXT_CACHE_DELETED = NO
NEXT_CACHE_RENAMED = NO
NODE_MODULES_CHANGED = NO
DATABASE_CHANGED = NO
MIGRATIONS_EXECUTED = 0

PROPOSED_MINIMUM_SAFE_FIX = OWNER_APPROVED_REGENERATE_ONLY_.next/dev_WITH_SOURCE_AND_next-env_GUARDS
OWNER_APPROVAL_REQUIRED = YES
GATE = PASS_FORENSIC_ROOT_CAUSE_PROVEN_AWAITING_OWNER_FIX_APPROVAL
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_ROOT_CAUSE_AND_EXPLICIT_FIX_APPROVAL
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. Do not apply the proposed fix, delete `.next`, reinstall dependencies, modify CRM‑1B4 source, change Next configuration, or start a fix batch without explicit Owner approval.
