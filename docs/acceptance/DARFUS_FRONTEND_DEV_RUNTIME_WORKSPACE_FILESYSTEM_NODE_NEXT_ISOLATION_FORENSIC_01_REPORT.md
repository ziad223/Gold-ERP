# DARFUS ERP — Frontend Dev Runtime Workspace / Filesystem / Node-Next Isolation Forensic Report

## 1. Executive Summary

تم تنفيذ الفحص داخل نسخ تشخيصية على ‎C:‎ فقط. لم يتم تعديل كود المنتج أو ‎.env‎ أو قاعدة البيانات، ولم يتم تشغيل أي عملية تجارية. النتيجة الحاسمة: نسخة Workspace A التي تحمل ‎node_modules‎ الحالية أعادت نفس ‎SyntaxError: Invalid or unexpected token‎ بعد ‎Ready‎، بينما Workspace B بنفس المصدر ونسخة ‎Node/Next‎ نفسها، بعد ‎npm ci‎ نظيف ومحدد من lockfile، بقيت مستقرة وأعادت ‎200‎ لصفحات العملاء.

الفحص المباشر أثبت 9 ملفات JavaScript تالفة داخل ‎node_modules‎ في A: بها NUL وبداية ثنائية واحدة مشتركة، وتفشل ‎node --check‎. الملفات المناظرة في B بنفس الحجم تنجح وتختلف SHA-256. لذلك:

`ROOT_CAUSE = ORIGINAL_NODE_MODULES_INSTALL_CORRUPTION`

لم يُصلح هذا الـControl النسخة الأصلية. يلزم Owner approval منفصل لإعادة تثبيت الاعتمادات الأصلية وفق lockfile، ثم إعادة إثبات التشغيل.

## 2. Upstream Evidence

- ‎npm run dev‎ الأصلي: ‎Ready‎ ثم ‎SyntaxError‎ وخروج العملية.
- Turbopack وWebpack فشلا بنفس النتيجة؛ ‎npm start‎ الإنتاجي كان يعمل.
- تم سابقًا حفظ مخرجات ‎.next/dev‎ التالفة وعدم المساس بـ‎.next/server‎.
- السبب CRM‑1B4 مثبت سابقًا كـ`PROVEN_NO`.
- هذا التقرير لا يعيد اختبار الأصل ولا ينقل أي مخرج مولّد إلى الأصل.

## 3. Investigation Boundaries

النطاق هو عزل طبقة فشل Frontend Dev Runtime فقط. المسموح كان نسخًا مؤقتة على ‎C:‎، ‎npm ci‎ داخل B، GET تشخيصية، probes محدودة، وقراءة الحالة. الممنوعات محفوظة: لا إصلاح للأصل، لا تغيير Node/Next/PATH/security settings، لا migrations، لا DB/API business writes، ولا production.

## 4. Original Runtime Baseline

الحالة السابقة المقبولة: ‎Ready → SyntaxError → exit 1‎. بعد recovery السابق كان ‎.next/dev‎ الأصلي فارغًا، و‎.next/server‎ موجودًا. في هذا الـControl لم يُشغّل Next داخل الأصل؛ ‎localhost:3000‎ كان خاليًا بعد إيقاف العملية التشخيصية.

## 5. Original Workspace / Drive Identity

| Item | Evidence |
|---|---|
| Workspace | `I:\WORK\jewellery-erp-master` |
| Branch / HEAD | `main` / `1657b0e9ba580faef69be48f04637835c201b521` |
| Drive | Fixed, NTFS, label `PROGRAMS`, Healthy/OK |
| Worktree | Dirty before this control; current read-only snapshot: 1048 status lines, 146 tracked modified/staged, 902 untracked, 11 stashes |
| `next-env.d.ts` | SHA-256 `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651`; no status line |
| Original mutation in this control | `NO` except creation of this report |

The dirty counts include existing project drift and are not treated as this control's product change.

## 6. Diagnostic Local Drive Selection

`C:` was selected after read-only inspection: Fixed, NTFS, Healthy/OK, approximately 133.8 GB free at final probe. No mount mapping or policy was changed. The disposable root is `C:\DARFUS-DIAGNOSTIC`.

## 7. Source Parity Manifest

The manifest `C:\DARFUS-DIAGNOSTIC\source-critical-original.txt` covers 28 critical current-worktree files. A and B each matched all 28 paths by length and SHA-256 (`SOURCE_PARITY = PASS`). The copies were made from the current worktree, not Git HEAD. `.env` presence was retained in the disposable copies without printing its contents.

## 8. Workspace A — Same Installed Dependencies

Path: `C:\DARFUS-DIAGNOSTIC\workspace-a-same-install`.

- Source: 28/28 critical files match the original manifest.
- Root `node_modules`: 29,916 files, same count as original.
- Core Next, React, React DOM, and libphonenumber hashes matched the original package files at the selected checks.
- A used the copied current `node_modules`; no install was run in A.

## 9. Workspace A Result

`npm run dev` reached `Ready in 1034ms`, then emitted `SyntaxError: Invalid or unexpected token` and exited with code 1. This is `WORKSPACE_A_SAME_INSTALL = FAIL_SAME_SYNTAXERROR`.

No business page request was sent to A after the process exited. A generated only a small `_events_*.json` file and no server JS output.

## 10. Workspace B — Fresh Deterministic Install

Path: `C:\DARFUS-DIAGNOSTIC\workspace-b-fresh-install`.

- Same current source copy; 28/28 critical files match.
- `node_modules` was excluded from the copy.
- `npm ci` completed successfully in 53 seconds from the existing lockfile.
- No package upgrade, Node change, PATH change, or global installation was used.
- Root `node_modules` after install: 29,916 files.

## 11. Workspace B Result

`npm run dev` reached `Ready in 969ms` and remained alive through the requests. Read-only GET results:

| Path | Status | Meaning |
|---|---:|---|
| `/` | 307 | locale redirect |
| `/ar` | 307 | locale redirect |
| `/en` | 307 | locale redirect |
| `/ar/customers` | 200 | page served |
| `/en/customers` | 200 | page served |

After the probe, the diagnostic B process was stopped by Ctrl-C; port 3000 was confirmed not listening.

## 12. Dependency-State Interpretation

The decisive comparison keeps source, C: filesystem, Node, Next, React versions, script, and environment shape constant while changing only the installed dependency state. A fails; clean B passes. This is a controlled dependency-state isolation, not a theory based only on timing.

## 13. Minimal Next Same-Version App

`MINIMAL_NEXT_SAME_VERSIONS = NOT_REQUIRED`. B already provides the stronger control: the real DARFUS source succeeds with the exact project versions after deterministic installation. No unrelated app or dependency version was introduced.

## 14. Project-vs-Runtime Interpretation

The project source is not sufficient to reproduce the failure when paired with a clean lockfile installation. The current failure is therefore not classified as a general Windows/Node/Next defect and not classified as a CRM product defect.

## 15. I:-Path Confirmation if Applicable

`I:` itself was not reformatted, repaired, remapped, or modified. A was executed from C: and still failed with the copied dependency state; B was executed from C: and passed with a clean dependency state. This isolates the controlling variable to dependency contents and eliminates the I: path as the current failure owner. It does not claim that every possible I: storage fault has been exhaustively tested.

## 16. Filesystem Write/Read Integrity Probe

Two bounded probes were run only under `C:\DARFUS-DIAGNOSTIC`:

- 150 file writes
- 150 SHA readbacks
- 100 renames followed by SHA verification
- SHA mismatches: 0

`LOCAL_DIAGNOSTIC_WRITE_INTEGRITY = PASS`. No original workspace path was used by the probe.

## 17. Generated Output Comparison

| Workspace | Generated result | Parse result |
|---|---|---|
| A | No `.next/dev/server` output after early failure; one event file | failure occurred before usable server output |
| B | 200 `.next/dev` files; 46 server JS files | 46/46 `node --check` pass |
| Upstream original | Five preserved malformed `.next/dev/server/chunks/ssr` artifacts were previously recorded | all five previously failed parse |

Additional dependency evidence: A contains 9 `.js` files with NUL bytes and the common first 16 bytes `24 1A 9C 92 6D 85 CE 6D 6F 93 4C D2 44 FC DC 3B`. All 9 fail `node --check`; the corresponding B files are the same size, have different SHA-256, contain no NUL, and all 9 pass `node --check`.

The affected paths are in `@babel/runtime` and `next/dist/...`, including Next dev hot-reloader, config/type-check, middleware, error formatting, and trace files. No file content was printed.

## 18. Windows/Security Read-Only Evidence

Windows Defender read-only status reported `AMServiceEnabled=True`, `AntivirusEnabled=True`, `RealTimeProtectionEnabled=True`, and `NISEnabled=True`. Ten Defender operational events were readable; sampled events were informational (IDs 1150/1151). No setting, exclusion, or security policy was changed. No security-interference conclusion is required because dependency corruption is directly proven.

## 19. Path-Length Evidence

| Scope | Files scanned | Maximum path |
|---|---:|---:|
| Original I: | 62,727 | 248 characters |
| Workspace A | 42,754 | 225 characters |
| Workspace B | 33,423 | 194 characters |

The passing B path is below the observed original maximum; path length is not the controlling cause.

## 20. Node/Next Runtime Binary Identity

| Tool | Path | Version |
|---|---|---|
| Node | `C:\Program Files\nodejs\node.exe` | v24.19.0 |
| npm | `C:\Program Files\nodejs\npm.cmd` | 11.17.0 |
| npx | `C:\Program Files\nodejs\npx.cmd` | 11.17.0 |
| Next | project dependency | 16.2.9 |
| React / React DOM | project dependency | 19.2.7 |

The same Node/Next/React versions were used by A and B. No PATH or version change was made.

## 21. Decision Matrix

| Candidate layer | Result | Evidence |
|---|---|---|
| Original I: filesystem/path | Eliminated as controlling layer | A fails and B passes from C:; both volumes are healthy NTFS |
| Original copied `node_modules` | Proven defect | 9 NUL/binary JS files; 9 parse failures; clean B counterparts pass |
| Project-specific Next dev path | Eliminated for this failure | same real source/script works in B |
| Windows Node/Next generally | Eliminated | same Node/Next works in B |
| Security software interference | Not proven; not needed | Defender is enabled, no direct blocking evidence |
| Path length/filename | Not supported | B passes; max B path 194 |

## 22. Eliminated Causes

`CRM1B4_CAUSED_FAILURE = PROVEN_NO`. The current evidence also eliminates a generic Node/Next version defect, a source-only defect, and path length as the controlling cause. Stale `.next/dev` artifacts remain real upstream evidence, but the 9 corrupted dependency files show an active lower-layer reproduction in A even without copied `.next` output.

## 23. Proven Root Cause

`ORIGINAL_NODE_MODULES_INSTALL_CORRUPTION = PROVEN`.

The corrupted dependency installation contains nine JavaScript files with NUL/binary data. Their clean lockfile counterparts are valid JavaScript. The exact environment result is:

`ROOT_CAUSE = ORIGINAL_NODE_MODULES_INSTALL_CORRUPTION`

## 24. CRM‑1B4 Relationship

`CRM1B4_CAUSED_FAILURE = PROVEN_NO`. No CRM source, route, database, or migration was changed or inspected as a repair target.

## 25. System Impact

The defect blocks the original Next development server and therefore blocks reliable dev-mode browser acceptance on the original workspace. It does not prove a production-build failure: upstream `npm start` production evidence remained separate and passing. No customer, inventory, accounting, Gift Voucher, or main DB business data was touched.

## 26. Minimum Safe Environment Fix Proposal

Proposal only; not executed:

1. Owner-approved maintenance window and source/worktree snapshot.
2. Preserve the forensic manifests and prior `.next/dev` backup.
3. Recreate the original root dependency installation with the existing lockfile (`npm ci`), without changing Node/Next versions or editing source.
4. Regenerate only the original dev output through the normal command after dependency integrity is verified; never copy B output into the original.
5. Re-run the narrow dev and GET proof, then verify `next-env.d.ts` against the accepted SHA.

`ORIGINAL_PATHS_THAT_WOULD_CHANGE = I:\WORK\jewellery-erp-master\node_modules` (and generated `.next/dev` only as part of a separately approved regeneration).

## 27. Owner Decision Packet

| Field | Value |
|---|---|
| ROOT_CAUSE | `ORIGINAL_NODE_MODULES_INSTALL_CORRUPTION` |
| EVIDENCE_CHAIN | A same source + copied deps fails; 9 malformed dependency JS files; B same source + clean `npm ci` passes |
| FAILING_LAYER | Original installed dependency contents |
| WHY_ORIGINAL_FAILS | Node parses malformed dependency JavaScript during dev startup |
| WHY_CONTROL_WORKSPACE_PASSES/FAILS | B replaces only dependency state and passes; A preserves it and fails |
| SOURCE_PARITY | PASS, 28/28 critical files |
| DEPENDENCY_PARITY | A copied parity PASS; A/B content difference directly proven for 9 files |
| NODE_NEXT_PARITY | PASS, Node 24.19.0 / Next 16.2.9 |
| FILESYSTEM_PARITY | PASS for bounded C: integrity; I: full health not a mutation target |
| CRM1B4_RELATION | `PROVEN_NO` |
| PRODUCT_CHANGE_REQUIRED | `NO` |
| PROPOSED_MINIMUM_SAFE_ENVIRONMENT_FIX | Owner-approved lockfile-pinned reinstall of original `node_modules`, then narrow rerun |
| SYSTEM_SETTINGS_THAT_WOULD_CHANGE | `NONE` |
| DEPENDENCIES_THAT_WOULD_CHANGE | Only the local installed files; package versions remain lockfile-pinned |
| EXPECTED_EFFECT | Restore valid dependency JavaScript and allow dev startup |
| REGRESSION_RADIUS | Frontend dev tooling only; no business behavior change intended |
| ROLLBACK_METHOD | Owner-approved restore of preserved dependency snapshot or deterministic reinstall; not executed |
| OWNER_APPROVAL_REQUIRED | `YES` |

## 28. Main DB Safety

`MAIN_DB = darfus_erp`.

`MAIN_DB_MUTATION = 0`. No backend business request, DB query, migration, seed, account, customer, inventory, invoice, payment, or financial operation was run by this control. Browser probes were local frontend GETs inside B only.

## 29. Diagnostic Workspace Retention

Disposable evidence was retained for Owner review; no automatic cleanup was performed:

- `C:\DARFUS-DIAGNOSTIC\workspace-a-same-install` — 42,754 files; generated failure state retained.
- `C:\DARFUS-DIAGNOSTIC\workspace-b-fresh-install` — 33,423 files; clean generated output retained.
- `C:\DARFUS-DIAGNOSTIC\source-critical-original.txt` — source parity manifest.
- `C:\DARFUS-DIAGNOSTIC\filesystem-integrity-probe-20260831` — 150 probe files.

These copies are diagnostic evidence only and are not a new source or production authority.

## 30. Gate

`WORKSPACE_A_SAME_INSTALL = FAIL_SAME_SYNTAXERROR`

`WORKSPACE_B_FRESH_INSTALL = PASS_STABLE`

`MINIMAL_NEXT_SAME_VERSIONS = NOT_REQUIRED`

`DEPENDENCY_INSTALL_STATE_DEFECT = PROVEN`

`ORIGINAL_I_WORKSPACE_FILESYSTEM_DEFECT = ELIMINATED_AS_CONTROLLING_LAYER`

`PROJECT_SPECIFIC_DEV_RUNTIME_DEFECT = ELIMINATED_AS_CONTROLLING_LAYER`

`WINDOWS_NODE_NEXT_RUNTIME_DEFECT = ELIMINATED`

`I_DIAGNOSTIC_WRITE_INTEGRITY = NOT_RUN`

`LOCAL_DIAGNOSTIC_WRITE_INTEGRITY = PASS`

`PRODUCT_CHANGE_REQUIRED = NO`

`GATE = PASS_ENVIRONMENT_ROOT_CAUSE_ISOLATED_AWAITING_OWNER_FIX_APPROVAL`

This gate means the cause is isolated; it does not mean the original dev runtime is repaired.

## 31. Final Tokens

```text
CURRENT_CONTROL = DARFUS-FRONTEND-DEV-RUNTIME-WORKSPACE-FILESYSTEM-NODE-NEXT-ISOLATION-FORENSIC-01
MODE = CONTROLLED_DISPOSABLE_ENVIRONMENT_ISOLATION_AND_ROOT_CAUSE_PROOF_ONLY
ORIGINAL_WORKSPACE = I:\WORK\jewellery-erp-master
ORIGINAL_WORKSPACE_MUTATED = NO
MAIN_DB = darfus_erp
MAIN_DB_MUTATION = 0
SOURCE_PARITY = PASS
I_DRIVE_TYPE = FIXED
I_FILESYSTEM = NTFS_HEALTHY_OK
LOCAL_DIAGNOSTIC_DRIVE = C:
LOCAL_DIAGNOSTIC_FILESYSTEM = NTFS_HEALTHY_OK
WORKSPACE_A_SAME_INSTALL = FAIL_SAME_SYNTAXERROR
WORKSPACE_B_FRESH_INSTALL = PASS_STABLE
MINIMAL_NEXT_SAME_VERSIONS = NOT_REQUIRED
I_DIAGNOSTIC_WRITE_INTEGRITY = NOT_RUN
LOCAL_DIAGNOSTIC_WRITE_INTEGRITY = PASS
DEPENDENCY_INSTALL_STATE_DEFECT = PROVEN
ORIGINAL_I_WORKSPACE_FILESYSTEM_DEFECT = ELIMINATED_AS_CONTROLLING_LAYER
PROJECT_SPECIFIC_DEV_RUNTIME_DEFECT = ELIMINATED_AS_CONTROLLING_LAYER
WINDOWS_NODE_NEXT_RUNTIME_DEFECT = ELIMINATED
CRM1B4_CAUSED_FAILURE = PROVEN_NO
PRODUCT_CHANGE_REQUIRED = NO
ROOT_CAUSE = ORIGINAL_NODE_MODULES_INSTALL_CORRUPTION
PROPOSED_MINIMUM_SAFE_ENVIRONMENT_FIX = OWNER_APPROVED_LOCKFILE_PINNED_NODE_MODULES_REINSTALL_ONLY
OWNER_APPROVAL_REQUIRED = YES
GATE = PASS_ENVIRONMENT_ROOT_CAUSE_ISOLATED_AWAITING_OWNER_FIX_APPROVAL
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_PROVEN_ENVIRONMENT_CAUSE_AND_EXPLICIT_FIX_APPROVAL
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP AFTER REPORT. Do not modify the original project, repair dependencies, change Node/Next, run CRM‑1B4 migration, or start CRM‑1C without explicit Owner approval.
