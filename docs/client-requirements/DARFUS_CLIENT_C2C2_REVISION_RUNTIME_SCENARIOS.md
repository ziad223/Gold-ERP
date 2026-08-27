# DARFUS Client C2C2 — Disposable Runtime Scenarios

Runtime target: `http://localhost:8001`  
Database proved by `SELECT current_database()`: `darfus_c2c2_revision_runtime_02`  
Asset: `AST-PUR-1787083585731-1-1-plz5`  
Company: `COMP-48ab554f-427e-4642-9419-bc8616c2dc36`  
Branch: `BRA-1787464306683` (`Branch-1`)

Passwords and tokens are intentionally excluded.

| Scenario | Expected | Observed | Result |
|---|---|---|---|
| R1 permission denied | 403 `REVISION_PERMISSION_DENIED` | 403 after final route reload | PASS |
| R2 valid single field | 201, revision 1, one change | 201, revision 1, one change | PASS |
| R3 valid multi-field | 201, revision 2, two changes | 201, revision 2, two changes | PASS |
| R4 no-op | 422 `REVISION_NO_EFFECTIVE_CHANGE` | 422, no durable row | PASS |
| R5 unknown field | 422 `REVISION_FIELD_NOT_ALLOWED` | 422, no durable row | PASS |
| R6 dedicated Barcode field | 422 `REVISION_DEDICATED_OPERATION_REQUIRED` | 422, no durable row | PASS |
| R7 wrong company | fail closed | 403 `COMPANY_SCOPE_INVALID` | PASS |
| R8 wrong branch | fail closed | 403 `ASSET_SCOPE_INVALID` | PASS |
| R9 exact idempotent replay | same key/body returns original | 201, same revision 4 and same revision identity; semantic response equality proved | PASS |
| R10 same key, changed body | 409 stable conflict | 409 `REVISION_IDEMPOTENCY_CONFLICT` | PASS |
| R11 concurrent same Asset, different requests | no lost update or duplicate number | one request committed revision 3/5 in separate runs; competing stale snapshot rejected; no duplicate number | PASS — stale-precondition-safe |
| R12 stale precondition | 409 `REVISION_CONCURRENT_CONFLICT` | 409, no durable row | PASS |
| R13 list | 200, newest first | 200, final list `6,5,4,3,2,1` | PASS |
| R14 detail | 200, header/changes/actor/source | 200, revision 4, one change, technical actor present | PASS |
| R15 immutability | UPDATE/DELETE rejected | both failed with `Asset revision history is immutable`; counts unchanged | PASS |

## Runtime notes

- R2/R3 and R11 were executed with a stale-write precondition. When two requests used the same snapshot concurrently, PostgreSQL/Asset locking allowed one deterministic commit and the later request failed the required stale check. This is safe behavior: no lost update and no duplicate revision number.
- One authorized clone-only probe was issued while correcting the harness after the first permission-response parser failed. It produced one additional controlled metadata revision (final revision 6); it was not an official-database write and was not cleaned up.
- No automatic retry was used for any business request.

