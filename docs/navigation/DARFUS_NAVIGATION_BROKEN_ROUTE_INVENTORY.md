# DARFUS Navigation Broken Route Inventory

Control: `DARFUS-NAVIGATION-CANONICAL-ROUTE-AUDIT-AND-FIX-01`

This inventory records the confirmed broken navigation emitted by the pre-fix
breadcrumb producer. The two rows are affected route families produced by one
source defect; they are not two independent implementations.

| ID | File | UI Location | Wrong URL | Correct URL | Root Cause | Fixed |
|---|---|---|---|---|---|---|
| NAV-BRK-001 | `components/layout/breadcrumbs.tsx` | Gold Center breadcrumb on `/{locale}/gold-center` | `/{locale}/dashboard/gold-center` | `/{locale}/gold-center` | Synthetic Dashboard crumb was included when building descendant hrefs | YES |
| NAV-BRK-002 | `components/layout/breadcrumbs.tsx` | Parent breadcrumb on every non-dashboard descendant route, including Gold Center sub-pages | `/{locale}/dashboard/{actual-segments}` | `/{locale}/{actual-segments}` | Same synthetic Dashboard crumb leakage into the accumulated href | YES |

## Scope of impact

The affected family covered the current route tree's non-dashboard pages such as
Gold Center, Inventory, Sales, Customers, Accounting, Settings, Employees,
Suppliers, Reports, and their existing descendants. The Dashboard home crumb
continues to resolve to `/{locale}/dashboard`.

No other independent broken navigation producer was found in the audited
application source. API links, external attachment URLs, and the existing
`/suppliers/purchases` compatibility redirect were classified separately and
were not treated as internal 404s.
