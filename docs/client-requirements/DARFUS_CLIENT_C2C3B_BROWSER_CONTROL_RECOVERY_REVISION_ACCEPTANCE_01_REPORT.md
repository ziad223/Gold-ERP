# DARFUS ERP — C2C3B Browser Control Recovery + Browser-Only Revision Acceptance Report

بالعربي المختصر: فحصت بيئة التحكم بالمتصفح، وثبت أن فشل `kernel assets` بيئي قبل فتح أي صفحة. أُعيد تشغيل خدمة التحكم المحددة فقط، لكنها لم تعد تلقائيًا؛ لذلك لم يحدث أي Browser Acceptance أو mutation، وبقيت `darfus_erp` سليمة.

## 1. Control and boundary

| Item | Actual |
|---|---|
| Control | `DARFUS-CLIENT-C2C3B-BROWSER-CONTROL-RECOVERY-REVISION-ACCEPTANCE-01` |
| Mode | `ENVIRONMENT_RECOVERY_PLUS_BROWSER_ONLY_ACCEPTANCE` |
| Product/backend/frontend feature changes | `0` |
| Migrations/schema/permissions | `0` |
| `next-env.d.ts` edit/revert | `0` |
| Official DB writes | `0` |
| Official runtime touched | `NO` |
| C3 started | `NO` |

The existing worktree drift was preserved; no Git cleanup or destructive Git command was used.

## 2. Root-cause audit

The browser-control call failed before any code, tab, URL, or page action with:

```text
failed to write kernel assets: The system cannot find the path specified. (os error 3)
```

The following environment evidence was collected:

- browser client module exists;
- browser plugin asset directory and WASM assets exist;
- `node_repl\active_execs` exists but was empty;
- browser session directory exists;
- user permissions on relevant directories are sufficient;
- the node_repl/CUA service processes were present but stale relative to this run;
- reset/retry reproduced the same pre-action error;
- the permitted process restart closed the transport and did not produce a replacement service.

The exact internal path causing the tool error is not exposed. Accordingly:

```text
BROWSER_FAILURE_CLASS = ENVIRONMENT_ONLY
BROWSER_ROOT_CAUSE_CLASS = UNKNOWN
BROWSER_ROOT_CAUSE = Internal browser-control kernel-assets path resolution failure; visible plugin paths are present, so no narrower cause is proven.
MINIMUM_ENVIRONMENT_FIX = Restarted the stale browser-control node_repl/CUA process only; recovery unsuccessful.
BROWSER_CONTROL_RECOVERED = NO
```

## 3. Runtime target preflight

| Target | Result |
|---|---|
| `3002/en` Asset Detail GET | 200 |
| `3002/ar` Asset Detail GET | 200 |
| `8001/health` | 200 |
| `8001/health/db` | 200 |
| `8001/health/redis` | 200 |
| `current_database()` on `8001` backend | `darfus_c2c2_revision_runtime_02` |
| Gold health | 503; unrelated and not opened |

The target isolation was proven through HTTP/DB read-only checks. It does not replace Browser Control recovery proof.

## 4. Dev proof decision

```text
DEV_TOOLCHAIN_REGEN_PROOF = NOT_REQUIRED_BY_ACCEPTANCE_DUE_TO_PROJECT_GOVERNANCE
```

`AGENTS.md` forbids running `next dev` during acceptance. The prior C2C3R build variant proof and generated-file policy remain valid. No dev process was started in C2C3B.

## 5. Browser acceptance result

The Browser Control did not recover, so no tab was opened and B1–B8 were not run. The detailed register is in:

`docs/client-requirements/DARFUS_CLIENT_C2C3B_BROWSER_ACCEPTANCE_MATRIX.md`

```text
AR_BROWSER_ACCEPTANCE = BLOCKED_BROWSER_CONTROL_UNRECOVERED
EN_BROWSER_ACCEPTANCE = BLOCKED_BROWSER_CONTROL_UNRECOVERED
B1_NOTES_REVISION = NOT_RUN_BLOCKED
B2_NAME_DESCRIPTION_REVISION = NOT_RUN_BLOCKED
B3_NO_OP = NOT_RUN_BLOCKED
B4_DOUBLE_SUBMIT = NOT_RUN_BLOCKED
B5_STALE_REVISION = NOT_RUN_BLOCKED
B6_VIEW_ONLY = NOT_RUN_BLOCKED
B7_NO_PERMISSION = NOT_RUN_BLOCKED
B8_DEDICATED_FIELDS = NOT_RUN_BLOCKED
BROWSER_CONSOLE_BLOCKERS = NOT_OBSERVABLE
BROWSER_NETWORK_PROOF = BLOCKED_BROWSER_CONTROL_UNRECOVERED
BACKEND_RUNTIME_PROOF = NOT_BROWSER_CORRELATED
DB_REVISION_PROOF = NOT_RUN_BROWSER_PROOF
EVENT_AUDIT_BROWSER_PARITY = NOT_RUN_BROWSER_PROOF
ASSET_DETAIL_REGRESSION = NOT_RUN_BROWSER_PROOF
```

No password, token, cookie, localStorage, browser profile, or session secret was inspected or printed.

## 6. DB and evidence preservation

The disposable DB was preserved and not cleaned. Current read-only snapshot:

| DB | Assets | Revisions | Revision changes | Asset events | Movements | Journals |
|---|---:|---:|---:|---:|---:|---:|
| `darfus_c2c2_revision_runtime_02` | 18 | 6 | 7 | 71 | 62 | 25 |
| `darfus_erp` | 18 | 0 | 0 | 65 | 62 | 25 |

No C2C3B browser mutation was sent. Therefore no new Revision/event/audit row exists from this control. The official DB was queried read-only and no official data was changed.

```text
ASSET_ID_UNCHANGED = YES
BARCODE_DELTA = 0
RFID_DELTA = 0
STATUS_DELTA = 0
BRANCH_DELTA = 0
MOVEMENT_DELTA = 0
JOURNAL_DELTA = 0
COST_DELTA = 0
VALUATION_DELTA = 0
OFFICIAL_DB_DAMAGE = 0
DISPOSABLE_EVIDENCE_PRESERVED = YES
```

## 7. Prevention lesson

```text
NEW_LESSON_ID = BROWSER-CONTROL-ENVIRONMENT-001
ROOT_CAUSE = UNKNOWN internal kernel-assets path failure
WHAT_ALLOWED_IT_TO_HAPPEN = Critical acceptance began without a successful tab/DOM/console/network preflight
MINIMUM_FIX = Reinitialize browser-control runtime/process; do not change product code
PREVENTION_GATE = Browser control health check before critical acceptance
TEST_TO_PREVENT_REGRESSION = Open disposable tab + DOM + console + network preflight before business mutation
MODULES_AFFECTED = ALL_REAL_BROWSER_ACCEPTANCE
BROWSER_PREVENTION_GATE_DEFINED = YES
```

## 8. Gate

The mandatory PASS gate requires `BROWSER_CONTROL_RECOVERED = YES` and all AR/EN B1–B8 proofs. Those conditions are not met.

```text
P0 = 0
P1 = 1 (browser acceptance gate blocked; no business-data damage)
P2 = 0
P3 = 1 (environment evidence/observability limitation)
GATE = BLOCKED_C2C3B_BROWSER_ENVIRONMENT_UNRECOVERED
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 9. Final tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-C2C3B-BROWSER-CONTROL-RECOVERY-REVISION-ACCEPTANCE-01
MODE = ENVIRONMENT_RECOVERY_PLUS_BROWSER_ONLY_ACCEPTANCE
BROWSER_ROOT_CAUSE_CLASS = UNKNOWN
BROWSER_CONTROL_RECOVERED = NO
DEV_TOOLCHAIN_REGEN_PROOF = NOT_REQUIRED_BY_ACCEPTANCE_DUE_TO_PROJECT_GOVERNANCE
FRONTEND_RUNTIME_PARITY = PASS_HTTP_ONLY_BROWSER_BLOCKED
BROWSER_MUTATION_TARGET_IS_DISPOSABLE = YES_TARGET_VERIFIED_NO_MUTATION
AR_BROWSER_ACCEPTANCE = BLOCKED_BROWSER_CONTROL_UNRECOVERED
EN_BROWSER_ACCEPTANCE = BLOCKED_BROWSER_CONTROL_UNRECOVERED
B1_NOTES_REVISION = NOT_RUN_BLOCKED
B2_NAME_DESCRIPTION_REVISION = NOT_RUN_BLOCKED
B3_NO_OP = NOT_RUN_BLOCKED
B4_DOUBLE_SUBMIT = NOT_RUN_BLOCKED
B5_STALE_REVISION = NOT_RUN_BLOCKED
B6_VIEW_ONLY = NOT_RUN_BLOCKED
B7_NO_PERMISSION = NOT_RUN_BLOCKED
B8_DEDICATED_FIELDS = NOT_RUN_BLOCKED
BROWSER_CONSOLE_BLOCKERS = NOT_OBSERVABLE
BROWSER_NETWORK_PROOF = BLOCKED_BROWSER_CONTROL_UNRECOVERED
BACKEND_RUNTIME_PROOF = NOT_BROWSER_CORRELATED
DB_REVISION_PROOF = NOT_RUN_BROWSER_PROOF
EVENT_AUDIT_BROWSER_PARITY = NOT_RUN_BROWSER_PROOF
ASSET_DETAIL_REGRESSION = NOT_RUN_BROWSER_PROOF
ASSET_ID_UNCHANGED = YES
BARCODE_DELTA = 0
RFID_DELTA = 0
STATUS_DELTA = 0
BRANCH_DELTA = 0
MOVEMENT_DELTA = 0
JOURNAL_DELTA = 0
COST_DELTA = 0
VALUATION_DELTA = 0
PRODUCT_CODE_CHANGED_DURING_C2C3B = NO
OFFICIAL_DB_WRITES = 0
OFFICIAL_DB_DAMAGE = 0
DISPOSABLE_EVIDENCE_PRESERVED = YES
BROWSER_PREVENTION_GATE_DEFINED = YES
P0 = 0
P1 = 1
P2 = 0
P3 = 1
GATE = BLOCKED_C2C3B_BROWSER_ENVIRONMENT_UNRECOVERED
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. No C3, no product fix, no official DB mutation, no permissions promotion, no barcode/RFID/inventory/accounting change, and no automatic retry.
