# UX-2 Browser Evidence Matrix

Real-browser checks were performed against the existing main frontend at `http://localhost:3000` without starting Next dev or another frontend instance. Each listed route rendered a visible main region; AR was RTL, EN was LTR, and the runtime exposed the new canvas and motion variables. Console error capture was empty for the checked routes.

| Route family | AR RTL | EN LTR | Dark | Light | Focus/controls | Result |
|---|---|---|---|---|---|---|
| Dashboard | PASS | PASS | PASS | PASS | Shell, controls, main content | PASS |
| POS | PASS | PASS | PASS | PASS | Inputs/buttons visible | PASS |
| Inventory | PASS | PASS | PASS | PASS | Inputs/tables visible | PASS |
| Accounting | PASS | PASS | PASS | PASS | Numeric content visible | PASS |
| Gold Center | PASS | PASS | PASS | PASS | Gold display visible | PASS |
| Settings / Tax | PASS | PASS | PASS | PASS | Controls visible | PASS |

No business POST/PUT/PATCH/DELETE was used. No production navigation was added. Theme switching was verified on Dashboard; AR/EN route navigation and DOM direction were verified on all rows. Screenshots are in `backups/ui-ux/UX2_THEME_FOUNDATION_20260828_020614/screenshots/`.

`UX2_REAL_BROWSER = PASS`
