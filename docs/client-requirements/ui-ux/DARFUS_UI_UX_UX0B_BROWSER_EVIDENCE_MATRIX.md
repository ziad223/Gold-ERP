# UX-0B Browser Evidence Matrix

## Scope and evidence rule

Read-only internal-browser evidence collected on 2026-08-27 against `http://localhost:3000`. No clicks that submit business actions were used. The viewport capability was set to seven requested classes and the browser-reported CSS viewport was recorded. The runtime returned a repeatable width mapping of `1600, 1422, 1222, 1067, 889, 711, 434` for requested widths `1440, 1280, 1100, 960, 800, 640, 390`; the report preserves both values.

## Measured critical families

The matrix covers 18 critical route families. Each row was visited at all seven requested classes in EN/Dark. `PASS` means the route rendered and no horizontal overflow was observed. `ISSUE` means it rendered but had vertical overflow or a readiness/degraded state. `BLOCKED` means the candidate route was not an available route or the requested state could not be proved.

| Family | Canonical route | 1440 | 1280 | 1100 | 960 | 800 | 640 | 390 | Evidence note |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| Dashboard | `/en/dashboard` | ISSUE | ISSUE | ISSUE | ISSUE | ISSUE | ISSUE | ISSUE | no horizontal overflow; vertical page scroll at 1222px and below; readiness/loading appeared transiently |
| POS/Sales | `/en/pos` | ISSUE | PASS | ISSUE | ISSUE | ISSUE | PASS | ISSUE | POS rendered; some classes showed branch-readiness guard |
| Inventory/Assets | `/en/inventory` | PASS | PASS | ISSUE | PASS | ISSUE | ISSUE | ISSUE | All Items rendered; no horizontal overflow; narrow vertical read |
| Inventory intake/profile | `/en/inventory/gold-by-weight` | PASS | PASS | PASS | ISSUE | ISSUE | ISSUE | ISSUE | form route rendered; readiness guard in several states |
| Customers | `/en/customers` | PASS | ISSUE | ISSUE | ISSUE | ISSUE | ISSUE | ISSUE | no horizontal overflow; vertical scroll at 960/800/640 |
| Suppliers/Purchasing | `/en/suppliers` | ISSUE | ISSUE | ISSUE | PASS | ISSUE | ISSUE | ISSUE | readiness guard at several widths |
| Gift Voucher | `/en/sales/gift-vouchers` | PASS | PASS | PASS | PASS | PASS | PASS | ISSUE | route rendered; mobile-small readiness state |
| Deposits | `/en/sales/deposits` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | actual route returned Next 404 in all seven measurements; no deposit page was inferred |
| Installments | `/en/sales/installments` | ISSUE | PASS | PASS | PASS | PASS | PASS | PASS | route rendered; wide class transient readiness |
| Gold Center | `/en/gold-center` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | route rendered at every class |
| Accounting/Journal | `/en/accounting` | ISSUE | ISSUE | ISSUE | ISSUE | PASS | ISSUE | ISSUE | readiness at wide classes; vertical scroll at 800/640/390 |
| Treasury | `/en/accounting/treasury` | PASS | PASS | PASS | PASS | PASS | PASS | ISSUE | vertical scroll at mobile-small |
| Financial Reports | `/en/reports` | ISSUE | ISSUE | ISSUE | ISSUE | ISSUE | ISSUE | ISSUE | vertical page scroll at all classes |
| Settings | `/en/settings` | ISSUE | ISSUE | ISSUE | ISSUE | ISSUE | ISSUE | ISSUE | vertical page scroll at all classes |
| Tax Center | `/en/settings/tax` | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | route served no heading in the measured DOM; capability not fully runtime-proven |
| Employees/Accounts | `/en/employees` | PASS | PASS | ISSUE | ISSUE | ISSUE | ISSUE | ISSUE | vertical scroll from laptop down |
| Audit/Approvals | `/en/audit` | PASS | PASS | PASS | ISSUE | PASS | ISSUE | PASS | vertical scroll at 960/640 |
| Tag/Print Preview | `/en/reports/exports` | PASS | PASS | ISSUE | PASS | PASS | PASS | PASS | Local Export Center rendered; readiness guard at laptop |

## Locale/theme evidence boundary

Prior UX-0 real-browser evidence separately visited the route inventory in AR and EN and captured EN dark, EN light, AR light, and RTL/LTR DOM states. UX-0B did not create any mutation or alter source. Full seven-class coverage for every route in both locales and both themes is therefore **not** claimed.

## Findings

- Horizontal overflow was not observed in the measured route-family set.
- Vertical overflow is common and is not automatically a defect; it becomes a P1/P2 design concern when dense forms, reports, tables, or POS controls require long scans.
- Branch readiness and loading guards are implementation states, not visual acceptance of populated business content.
- No browser console error/warning was observed in the prior captured sample; recent backend logs include an expired-session 401 and a missing upload asset 404, both retained as runtime evidence rather than UX closure claims.

`REAL_BROWSER_CLOSEOUT = COMPLETE_FOR_MEASURED_EN_DARK_SAMPLE`
`FULL_AR_EN_DARK_LIGHT_STATE_COVERAGE = NOT_COMPLETE`
