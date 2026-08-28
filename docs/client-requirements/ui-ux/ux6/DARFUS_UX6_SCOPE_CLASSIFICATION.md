# UX-6 Scope Classification

| Class | Surfaces | Decision |
|---|---|---|
| A — safe presentation | Inventory overview and Asset detail | Implemented: spacing, hierarchy, status readability, data-density and accessibility presentation only |
| B — inspect/preserve | Intake chooser, profile forms, Asset panels | No implementation; existing contracts and callers remain untouched |
| C — workflow-sensitive | Receive, transfer, workshop, adjustment, stock audit, POS, returns, revisions | No restructuring or business interaction change |
| D — frozen/out of scope | Backend/API, DB/schema, migrations, master data, permissions, accounting, Gift Voucher, GBW formulas, closed UX tracks | No change |

No UX-6 change crosses from Class A into business behavior.

