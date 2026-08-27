# DARFUS POS Making Charge — Main Frontend Read-Only Smoke

ما تم: فحص HTTP read-only بعد refresh للـmain frontend. الصفحتان تعملان، والـbuild الجديد يخدم marker المصحح. فحص console/visual الحقيقي محجوب بسبب Browser Control Environment، ولا توجد أي business mutation.

## HTTP/runtime smoke

| URL | HTTP | Runtime evidence |
|---|---:|---|
| `http://localhost:3000/ar/pos` | 200 | page served by refreshed `next start`; POS chunk has corrected marker |
| `http://localhost:3000/en/pos` | 200 | page served by refreshed `next start`; POS chunk has corrected marker |
| `http://localhost:3000/_next/static/Y6V_WF-4PV_YuGaSjVsEK/_buildManifest.js` | 200 | new build path is served |

## Backend context

| Endpoint | Result |
|---|---|
| `GET /api/v1/health` | 200 |
| `GET /api/v1/health/db` | 200; PostgreSQL connected |
| `GET /api/v1/health/redis` | 200; Redis connected |

Backend container was not restarted during the frontend refresh. The serving frontend process is the refreshed workspace `next start` process PID `26740`, started `2026-08-26 19:56:34`.

## Browser limitation

The required browser-control preflight failed before a browser tab could be controlled. Therefore console capture, visual assertions, and interactive smoke are not claimed:

`MAIN_AR_READONLY_BROWSER = BLOCKED_BROWSER_CONTROL_ENVIRONMENT`  
`MAIN_EN_READONLY_BROWSER = BLOCKED_BROWSER_CONTROL_ENVIRONMENT`  

---

## Current Real Chrome Addendum — 2026-08-27

تمت إعادة فحص main frontend بChrome الحقيقي المعزول، قراءة فقط، على AR وEN. لم يتم الضغط على Checkout ولم تُرسل business mutation.

| URL | Status | Visible/runtime evidence |
|---|---|---|
| `http://localhost:3000/ar/dashboard` | PASS | authenticated Arabic dashboard rendered |
| `http://localhost:3000/en/dashboard` | PASS | authenticated English dashboard rendered |
| `http://localhost:3000/ar/pos` | PASS | Arabic POS rendered; read-only journey and pricing request captured |
| `http://localhost:3000/en/pos` | PASS | English POS rendered; read-only journey and pricing request captured |

Console contained only expected React DevTools/HMR informational messages. `failed responses = []`; `non-GET business requests = []` during the main smoke. The existing runtime process was observed, not restarted; `localhost:3000` was owned by the existing `next start` process PID `12480`. A Next dev process PID `6792` was also observed as pre-existing environment drift and was not started or stopped by this control.

```text
CURRENT_MAIN_AR_BROWSER = PASS
CURRENT_MAIN_EN_BROWSER = PASS
CURRENT_MAIN_CONSOLE_BLOCKERS = 0
CURRENT_MAIN_FAILED_RESPONSES = 0
CURRENT_MAIN_BUSINESS_MUTATIONS = 0
```

The HTTP smoke is PASS as a supporting runtime check, not a replacement for the required browser gate.
