# DARFUS Client C2C3M — Real Browser Acceptance Matrix

بالعربي المختصر: تم تشغيل المتصفح الحقيقي على الـDisposable runtime ونُفذت سيناريوهات B1–B5 فعليًا. القبول الكامل متوقف عند variants الصلاحيات B6/B7، وغياب Network wire-capture، وحدثت كتابة AR غير مقصودة على الـClone أثناء إغلاق إثبات المراجعة. لم يتغير كود المنتج ولم تُكتب قاعدة `darfus_erp`.

## Targets and preflight

| Check | Expected | Actual | Status |
|---|---|---|---|
| Frontend EN | `http://localhost:3002` | route 200 | PASS |
| Frontend AR | `http://localhost:3002` | route 200 | PASS |
| Backend | `http://localhost:8001` | health 200, DB 200, Redis 200 | PASS |
| Disposable DB | `darfus_c2c2_revision_runtime_02` | `SELECT current_database()` exact match | PASS |
| Official DB | `darfus_erp` read-only | identity re-read; no writes | PASS |
| Real browser tab | required | EN and AR authenticated tabs opened | PASS |
| Company/branch context | server authoritative | Gold ERP / Branch-1 visible | PASS |
| Browser console | no blockers | EN/AR `dev.logs(error,warn)` empty | PASS |
| Gold health | outside C2C3M scope | `/health/gold` 503, recorded as unrelated | INFO |

The disposable backend was recreated only with runtime CORS values for `localhost:3002`; no source/config file or database data was changed by that adjustment.

## Scenario matrix

| Scenario | Required result | Actual evidence | Status |
|---|---|---|---|
| B1 Notes-only | one POST 201; one revision/change/event; notes updated | Browser `Revision saved`; server POST 201 request `8db36251…`; DB revision v7 `ASREV-1851…`, one change/event/audit/idempotency row | PASS |
| B2 Name + Description | one POST 201; one header; two changes | Browser `Revision saved`; server POST 201 request `bbd4f6ef…`; DB revision v8 `ASREV-03ec…`, two changes | PASS |
| B3 No-op | no durable write | Review was not opened for empty diff; counts stayed at v8/10 changes; no POST in server log | PASS |
| B4 Rapid double submit | one durable result; no duplicate | two UI click promises but one server POST 201 request `1da43d23…`; only revision v9 `ASREV-33d20…` exists | PASS |
| B5 Stale revision | 409 `REVISION_CONCURRENT_CONFLICT`; no overwrite | fresh v10 POST 201 request `347ca099…`; stale POST 409 request `d1dc84b3…`; no stale revision/event/audit/idempotency row | PASS |
| B6 View-only | history visible; create unavailable; backend denied | No pre-seeded view-only identity exists. Admin is all-access; sales has no revision permission. Creating permission/user fixtures was not authorized for this run | BLOCKED — prerequisite |
| B7 No Revision permission | UI/backend fail closed; no mutation | Route/source guards and clone catalog prove the fail-closed design; authenticated denied-user browser proof cannot run because its synthetic credential is unavailable | BLOCKED — credential |
| B8 Dedicated fields | dedicated fields stay outside general Revision | EN/AR editor exposes only name, description, category, brand, notes; UI states price/cost/barcode/weights/karat/status/branch/location use dedicated workflows | PASS |
| AR review-only safety | review then cancel; no submit | an unplanned AR POST 201 created revision v11 (`notes` only) before the final read-only recheck | FAIL — unexpected disposable mutation |

## AR/EN result

| Surface | Actual | Status |
|---|---|---|
| EN asset detail | authenticated DOM, `dir=ltr`, revision list/history, editor, review, localized stale error | PASS |
| AR asset detail | authenticated DOM, `dir=rtl`, Arabic navigation, editor, review | FAIL — review path ended with one unexpected 201 on the disposable clone |
| IDs and history | asset/barcode and revision IDs visible; no hidden credential/token output | PASS |
| B6/B7 localized permission screens | not executed without required identities | BLOCKED |

## Gate

```text
BROWSER_PREFLIGHT = PASS
B1 = PASS
B2 = PASS
B3 = PASS
B4 = PASS
B5 = PASS
B6 = BLOCKED_PRESEEDED_VIEW_ONLY_IDENTITY_UNAVAILABLE
B7 = BLOCKED_AUTHENTICATED_DENIED_CREDENTIAL_UNAVAILABLE
B8 = PASS
AR_REVIEW_ONLY_SAFETY = FAIL_UNEXPECTED_DISPOSABLE_MUTATION
REAL_BROWSER_ACCEPTANCE = INCOMPLETE
GATE = BLOCKED_C2C3M_REQUIRED_PERMISSION_VARIANTS_NETWORK_WIRE_PROOF_AND_UNEXPECTED_CLONE_MUTATION
```

No C3 was started.
