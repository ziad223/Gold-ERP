# Rate comparison contract

| Case | Numeric rule | Permission | Reason | Result |
|---|---|---|---|---|
| Equal | `Decimal(requested).eq(Decimal(reference))` | Not required for override | Not required | Proceed with reference/equal rate; no override audit. |
| Lower | `!eq`; a valid non-negative requested value may be lower | `inventory.adjust` required | Nonblank required | 422 without reason; 403 without permission; otherwise approved override. |
| Higher | `!eq` | `inventory.adjust` required | Nonblank required | Same as lower; no special tolerance. |
| Invalid/non-numeric | Decimal parse/finite validation | N/A | N/A | Validation failure before persistence. |

Current GBW branch uses exact Decimal comparison with no tolerance or percentage threshold. Approved GBW override formatting is eight decimal places via `toFixed(8)`.

