# DARFUS Client C2C3B — Browser Control Root Cause

بالعربي المختصر: العطل ظهر قبل فتح أي تبويب، داخل طبقة التحكم بالمتصفح، وليس داخل المنتج. مسارات plugin والأصول ومجلدات التخزين موجودة، لكن خدمة التحكم فشلت برسالة مسار kernel غير موجودة ولم تُعد بعد إعادة تشغيلها.

## Control

- Control ID: `DARFUS-CLIENT-C2C3B-BROWSER-CONTROL-RECOVERY-REVISION-ACCEPTANCE-01`
- Scope: environment recovery only
- Product source changes: `0`
- Backend changes: `0`
- `next-env.d.ts` edits/reverts: `0`
- Official DB writes: `0`

## Evidence-first triage

| Check | Actual evidence | Result |
|---|---|---|
| Browser plugin client | `C:\Users\NEGM\.codex\plugins\cache\openai-bundled\browser\26.820.60940\scripts\browser-client.mjs` exists | PASS |
| Browser plugin assets | `assets` directory and browser WASM assets exist | PASS |
| Node REPL directory | `C:\Users\NEGM\.codex\node_repl\active_execs` exists; it was empty | OBSERVED |
| Browser session directory | `C:\Users\NEGM\.codex\browser\sessions` exists | PASS |
| User filesystem access | user has FullControl on the relevant local directories | PASS |
| Browser tool call | failed before code/page action: `failed to write kernel assets: The system cannot find the path specified. (os error 3)` | FAIL |
| Retry after kernel reset | same pre-action failure | FAIL |
| Browser-control processes | stale `node_repl.exe` and its CUA node service were present from `2026-08-26 07:55:06` | OBSERVED |
| After permitted process restart | transport closed; no replacement `node_repl` process appeared | NOT RECOVERED |

## Classification

```text
BROWSER_FAILURE_CLASS = ENVIRONMENT_ONLY
BROWSER_ROOT_CAUSE_CLASS = UNKNOWN
BROWSER_ROOT_CAUSE = Browser control fails while writing its internal kernel assets even though the visible plugin assets and local runtime directories exist; the precise internal missing path is not exposed by the tool, so no narrower cause is claimed.
MINIMUM_ENVIRONMENT_FIX = Restarted the stale browser-control node_repl/CUA service only; no project or product file was touched.
BROWSER_CONTROL_RECOVERED = NO
```

The observed stale process is a plausible environmental contributor, but the available evidence does not prove it was the direct cause. The restart itself left the control transport closed, so the recovery is classified as unsuccessful rather than PASS.

## Safety conclusion

No product code, browser plugin file, project configuration, `next-env.d.ts`, database, migration, permission, or business data was changed. No browser tab was opened and no browser click/form/HTTP mutation occurred.

## Prevention lesson

```text
NEW_LESSON_ID = BROWSER-CONTROL-ENVIRONMENT-001
ROOT_CAUSE = UNKNOWN internal kernel-assets path failure in browser-control environment
WHAT_ALLOWED_IT_TO_HAPPEN = Critical acceptance started without a successful control preflight proving tab + DOM + console + network access
MINIMUM_FIX = Browser-control process/runtime reinitialization, pending platform recovery
PREVENTION_GATE = Browser control health check before critical acceptance
TEST_TO_PREVENT_REGRESSION = Open a disposable tab, inspect DOM, capture console, and capture network before any business mutation
MODULES_AFFECTED = ALL_REAL_BROWSER_ACCEPTANCE
```
