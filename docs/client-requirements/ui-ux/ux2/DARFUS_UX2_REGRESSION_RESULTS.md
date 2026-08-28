# UX-2 Regression Results

Executed after the `app/globals.css` foundation change; no test was weakened or edited.

| Check | Result |
|---|---|
| Prototype isolation / UX1R reference tests | PASS |
| Theme context and existing class contract | PASS |
| POS UI focused regression | PASS |
| Inventory UI focused regression | PASS |
| Gift Voucher UI focused regression | PASS |
| AR/EN and responsive checks | PASS |
| No production navigation change | PASS |
| No API/DB/business mutation hook | PASS |

Focused command result: `34/34` tests passed, `0` failed.

`npm run typecheck` → exit 0.

`npm run build` → exit 0; Next.js 16.2.9 (Turbopack); 128 static pages generated; Next dev server was not started.

No tests were weakened. Regression is limited to the foundation and representative affected surfaces.

`AFFECTED_FRONTEND_REGRESSION = PASS`
