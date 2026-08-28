# Three-case matrix

Reference rate used for the current context: 21K/AED `475.36260000` from the latest valid Gold Center quote.

| Case | Requested example | Backend classification | Current UI ability | Expected outcome |
|---|---:|---|---|---|
| Equal | `475.36260000` | Exact equal; no override | Rate can be entered; no reason needed | Receive can proceed if all unrelated contract fields are valid. |
| Lower | `470.00000000` | Non-equal override | Rate can be entered; reason cannot be entered or sent | 422 without reason; 403 if permission check fails first. |
| Higher | `480.00000000` | Non-equal override | Rate can be entered; reason cannot be entered or sent | 422 without reason; 403 if permission check fails first. |

The examples are diagnostic only; this control did not submit any of them.

