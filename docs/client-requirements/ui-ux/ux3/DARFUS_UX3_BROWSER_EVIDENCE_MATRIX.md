# UX-3 Browser Evidence Matrix

Runtime: authenticated `http://localhost:3000`; no new frontend instance was started. Browser actions were GET/navigation and presentation-state only.

| Route family | AR | EN | Desktop | Narrow | Header/sidebar/main | Breadcrumb | Console errors |
|---|---:|---:|---:|---:|---:|---:|---:|
| Dashboard | PASS | PASS | PASS | PASS | PASS | PASS | 0 |
| POS | PASS | PASS | PASS | — | PASS | PASS | 0 |
| Inventory | PASS | PASS | PASS | — | PASS | PASS | 0 |
| Accounting | PASS | PASS | PASS | — | PASS | PASS | 0 |
| Gold Center | PASS | PASS | PASS | — | PASS | PASS | 0 |
| Settings | PASS | PASS | PASS | — | PASS | PASS | 0 |

Mobile interaction: Open navigation → visible `#primary-navigation` → Close navigation; desktop collapse: expanded `true` → `false` → restored `true`.

Dedicated network capture was not exposed by the connected browser capability set. No UX3 source changed API callers or routes, and no mutating browser request was issued; this is recorded as an evidence limitation rather than a claim of hidden network telemetry.
