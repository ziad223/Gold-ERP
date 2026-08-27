# DARFUS POS Making Charge — Frontend Build / Refresh Proof

ما تم: تنفيذ build الإنتاج الطبيعي ثم تحديث خدمة `next start` الحالية فقط. ما مرّ: build، توازي الـruntime، وصحة backend/DB/Redis. ما لم يثبت: Browser Preflight بسبب عطل أداة المتصفح. لا توجد كتابة على `darfus_erp`.

## Control

- Control: `DARFUS-POS-MAKING-CHARGE-FRONTEND-BROWSER-FINAL-CLOSEOUT-01`
- Project: `I:\WORK\jewellery-erp-master`
- Official DB: `darfus_erp` (read-only)
- Build command: `npm run build` → `next build`
- Manual `next-env.d.ts` edit: **NO**

## Fast triage

| Check | Evidence | Result |
|---|---|---|
| Corrected POS source present | `app/[locale]/(dashboard)/pos/page.tsx`, `features/sales/hooks/use-pos.ts`, `backend/src/routes/erp.routes.js`; source contains eligible-weight/net-weight path | PASS |
| Old frontend state | `BUILD_ID=8RLhnWrX310CiNlEKSZpZ`, mtime `2026-08-26 09:05:03`; source was newer | STALE_CONFIRMED |
| Backend target | `GET http://localhost:8000/api/v1/health/db` = 200; official DB identity query = `darfus_erp` | PASS |
| Startup migration guard | compose command is `npm start`; server calls `sequelize.authenticate()` and skips runtime bootstrap unless explicit opt-in | PASS |
| Secret/config change | No environment change was made | PASS |
| Initial generated file | `next-env.d.ts` SHA-256 `7AD303E40D4FDDF44F156129E397511953A71481C5CFD86B1862649AAAF240CC`; import was `./.next/dev/types/routes.d.ts` | RECORDED |

`FAST_TRIAGE_COMPLETE = YES`  
`SOURCE_CORRECTION_PRESENT = YES`  
`OFFICIAL_DB_TARGET_CONFIRMED = darfus_erp`

## Build

`npm run build` completed with exit code `0`.

- Next.js: `16.2.9 (Turbopack)`
- TypeScript phase: passed
- Static page generation: `125/125`
- New `BUILD_ID`: `Y6V_WF-4PV_YuGaSjVsEK`
- Build timestamp: `2026-08-26 19:55:35`
- No migration output or migration command was run.

The build regenerated `next-env.d.ts` without manual editing. The resulting file is the exact supported toolchain variant authorized by the project guardrail:

```text
import "./.next/types/routes.d.ts";
SHA-256 = 7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651
```

This is the approved generated transition from the recorded initial SHA to the recorded final SHA. No source workaround or fake variant was introduced.

## Runtime refresh

The previously serving process was verified as the exact workspace `next/dist/server/lib/start-server.js` process, PID `3468`, and stopped once. The same `next start` service was launched on port `3000`; no backend/PostgreSQL restart occurred.

- New frontend PID: `26740`
- Process start: `2026-08-26 19:56:34`
- Command: workspace `node_modules/.bin/..\next\dist\bin\next start`
- `/ar/pos`: HTTP `200`
- `/en/pos`: HTTP `200`
- `/_next/static/Y6V_WF-4PV_YuGaSjVsEK/_buildManifest.js`: HTTP `200`
- The served POS chunk contains the corrected marker `Eligible gold weight for making` and the `netGoldWeight` path.

Therefore:

`FRONTEND_BUILD = PASS`  
`FRONTEND_RUNTIME_PARITY = PASS`  
`MAIN_RUNTIME_CHECK = PASS` (HTTP/runtime level)

## Source evidence

| File | SHA-256 |
|---|---|
| `app/[locale]/(dashboard)/pos/page.tsx` | `89FC62F6C5669BD3DD3B8586D0536604D264F84DE18C56157E43AC92FAE530A4` |
| `features/sales/hooks/use-pos.ts` | `E5032A73C44AC2C8ACA8911C7B3645AF6C79D169F072F064CF991F4743904221` |
| `backend/src/routes/erp.routes.js` | `8002B66D868BC5E57EDEE5D0903B7EDE4CCFF1AC50849A1B787F3BB312140ED9` |

These are evidence of the already-approved upstream correction; this control did not edit them.

## Scope result

- Product source files changed by this control: `0`
- Test files changed by this control: `0`
- Generated build output: refreshed under `.next`
- Official DB writes: `0`
- Official checkout/fixtures: `0`
- Migration: `0`

