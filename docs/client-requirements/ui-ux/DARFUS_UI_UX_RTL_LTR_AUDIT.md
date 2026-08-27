# RTL / LTR Audit

`app/[locale]/layout.tsx` sets `dir=rtl` for AR and `dir=ltr` for EN. `AppShell`, `Sidebar`, header controls, logical `start/end` positioning, and the mobile sidebar were inspected in both directions.

| Dimension | Finding |
|---|---|
| RTL shell/sidebar | Sidebar right anchored; collapse icon and active arrow switch direction; dashboard and POS align correctly |
| LTR shell/sidebar | Sidebar left anchored; controls align correctly |
| Tables/numerics | Financial numbers use tabular numerals and numeric-token LTR isolation; mixed data still requires per-table review |
| Deep controls | Some native select/legacy page variants may retain asymmetric label or action conventions; no universal failure proven |

RTL/LTR = NEEDS_IMPROVEMENT at global parity level, with no direct P0/P1 layout break observed.
