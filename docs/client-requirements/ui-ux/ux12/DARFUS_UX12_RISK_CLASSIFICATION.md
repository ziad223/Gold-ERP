# UX-12 Risk Classification

| Class | Surfaces | Risk | Evidence disposition |
|---|---|---|---|
| R1 critical | POS, sales/search-print, inventory/assets, Gold Center, accounting/treasury | financial/inventory presentation or authority confusion | direct AR/EN, light/dark, 1440/840/390 checks passed; no mutation |
| R2 operational | customers, suppliers, settings/audit, employees, reservations, CGP | workflow discoverability and dense-data failure | direct representative checks passed; no route error/overflow |
| R3 embedded/fixed | invoice previews, receipt/tag previews, print templates, dialogs | format identity, print isolation, theme leakage | source sweep plus UX-11C direct component evidence; no identity or CSS authority change |
| R4 evidence/environment | headless print runner, missing owner-method document, pre-existing worktree drift | evidence completeness | documented; no product defect inferred |

No current P0/P1 UI regression was observed. The only direct UX-12 defect was a mobile accessible-name gap in the shared reset control; it was repaired locally.
