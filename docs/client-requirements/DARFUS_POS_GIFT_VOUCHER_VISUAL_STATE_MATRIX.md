# POS Gift Voucher Visual State Matrix

| State | AR | EN | Evidence | Result |
|---|---|---|---|---|
| Normal supported | visible input/action | visible input/action | post-fix screenshots | PASS desktop |
| Hover | existing Button/input hover tokens | same | source tokens | SOURCE PASS |
| Focused | visible border/ring/caret | visible border/ring/caret | screenshots | PASS desktop |
| Filled | synthetic code readable | synthetic code readable | browser readback/screenshots | PASS desktop |
| Validated | not exercised (`gift_vouchers=0`) | not exercised | mutation prohibited | NOT RUN SAFE |
| Error | `role=alert` association in source | same | component source | SOURCE PASS |
| Installment disabled | warning + disabled controls | warning + disabled controls | browser screenshots | PASS |
| Deposit disabled | warning + disabled controls | warning + disabled controls | browser/source evidence | PASS |
| Narrow | not inspected | not inspected | resize API unavailable | BLOCKED |

