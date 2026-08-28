# UX4 Browser Evidence Matrix

Read-only evidence was collected from the existing `http://localhost:3000` runtime after the source build. No business button, form submission, or mutation endpoint was invoked.

| Route | Locale/dir | Render | Shared evidence | Console errors/warnings | Horizontal overflow |
|---|---|---|---|---:|---:|
| `/en/dashboard` | EN/LTR | PASS | Button, Card, Badge, numeric/table surfaces | 0 | NO |
| `/ar/dashboard` | AR/RTL | PASS | Shell, Button/Card/Badge and numeric isolation | 0 | NO |
| `/en/pos` | EN/LTR | PASS | input-base/search, select, button, responsive POS surface | 0 | NO |
| `/ar/inventory/stock-audit` | AR/RTL | PASS | input/select/state presentation | 0 | NO |
| `/en/accounting` | EN/LTR | PASS | Button, Input, Select, Card, Table and numeric presentation | 0 | NO |
| `/en/inventory` | EN/LTR | PASS | modal trigger surface and canonical inventory table | 0 | NO |

Narrow check at 390×844 was run for `/ar/dashboard` and `/en/pos`; both retained correct `lang`/`dir`, loaded, had no console errors/warnings, and no horizontal document overflow. The connected browser did not expose network instrumentation; no network PASS claim is made from that unavailable signal.
