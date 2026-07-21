# v1.0.0 Test and Acceptance Matrix

| Critical flow | Role / branch / locale / viewport | Expected API and data effect | Financial / inventory / audit effect | Cleanup and evidence |
| --- | --- | --- | --- | --- |
| Super Admin login and recovery | Super Admin; EN/AR desktop/mobile | Password-only login, session freshness, no fixed branch. | No financial effect; auth audit and logout/session revocation. | Named test account/session removed or rolled back. |
| Branch Account plus Employee PIN | Fixed Branch Account and verified Employee; A/B; EN/AR desktop/mobile | Six-digit PIN, direct deny wins, branch fixed, stale authorization rejected. | No financial effect; operator session/audit. | Namespaced session cleanup. |
| Customer exact identity | Two branches and A1/A2/B1/unknown customers | Exact requested same-branch ID; cross-branch/unknown 404/403; no substitution. | No PII, credit, loyalty or statement leakage. | Rollback-owned fixtures. |
| Customer Credit deposit/refund | Treasury role; branch A/B | Protected liability and effective branch server-resolved; idempotency/replay safe. | Cash register, credit ledger, GL and audit exactly once. | Transaction rollback or proof of named cleanup. |
| Reservation Araboon | Sales/treasury roles; A/B; EN/AR desktop/mobile | Initial/subsequent payment, totals/status transitions, duplicate protection. | Receipt, cash movement, Dr cash/bank Cr branch advances only; no premature VAT/revenue/COGS/inventory. | Named fixture, journal/cash/application cleanup proof. |
| Reservation completion/cancel/refund | Same reservation lifecycle | Complete once; cancellation/refund approval/execution and expiry/renewal rules. | Settlement clears advances once; refund reverses liability to authoritative treasury; asset releases correctly. | Rollback or complete named cleanup. |
| POS, sale, return, exchange, installments | Employee permissions; A/B; EN/AR desktop/mobile | Scoped commands and correct errors. | Idempotency, VAT, AR, GL, stock and receipts reconcile. | Isolated fixture accounting reconciliation. |
| Inventory/barcode/gold purchase | Authorized branch A/B | Same-branch access only; no unauthorized lifecycle mutation. | Stock and valuation/audit correctness. | Fixture asset removal only when safely owned. |
| Reports/printing/localization | Super Admin/Branch Employee; EN/AR desktop/mobile | Routes, RTL/LTR, permissions and response data correct. | No write; labels and financial display match underlying ledger. | Screenshot/network/console record. |

Every live test records preconditions, actions, expected HTTP result, database
effect, cash-register/GL/inventory/audit effect, exact cleanup, and evidence.
Shared `darfus_erp` tests require the LOCAL-DB-VERIFIER-ADOPT1 safety contract.

Live verification requires exact local `VERIFY_DATABASE_*` / `DB_*` identity,
owner and live confirmation, a unique run ID, and a validated local backup for
V2/V3. V4 existing-data mutation and V5 destructive verifiers are blocked.

Runtime configuration acceptance includes development `::1:5432/darfus_erp`,
server missing-variable refusal, strict port/SSL parsing, URL target conflict
refusal, and error output that excludes credential values.

## LOCAL-DB-VERIFIER-REDESIGN1-RESUME execution

Canonical inventory: 66 `scripts/verify-*.js`. After `e3215f9`, default mode was 58 PASS and 8 scope-BLOCKED only by untracked temporary file `-`; no Product assertion failed. Guard and owned-fixture helper tests PASS. Fresh ignored backup `backend/backups/darfus_erp_local_db_verifier_redesign1_20260721124738.dump` (368,763 bytes) passed `pg_restore -l`. V3 PASS: Employee authorization foundation, Employee operator session, Employee permission enforcement. V3 BLOCKED: permission catalog wiring, single-level Employee, Super Admin recovery (`125` versus `128` permissions). V4/V5 and V6 modes remain blocked/deferred.

## LOCAL-DB-VERIFIER-REDESIGN2-RESUME execution

Owner-proven root artifact absence restored all scope checks: eight prior scope verifiers PASS and the canonical static matrix is **66 PASS / 0 FAIL / 0 BLOCKED**. Fresh ignored backup `backend/backups/darfus_erp_local_db_verifier_redesign2_20260721132707.dump` is 367,530 bytes and passed `pg_restore -l`. Guarded V3 is **3 PASS / 0 FAIL / 3 BLOCKED**, with each block the unchanged `125 !== 128` permission assertion. Zero owned companies/employees remained after execution.

## PERMISSION-BASELINE-RECONCILE1 execution

Fresh ignored local backup `backend/backups/darfus_erp_permission_baseline_reconcile1_20260721103957.dump` is 367,530 bytes; `pg_dump` and `pg_restore -l` both exited 0. Migration `20260721010000-reconcile-canonical-permission-baseline.js` advanced the adopted `::1:5432/darfus_erp` development database from 47 to 48 migrations and from 125 to the exact 128-slug canonical set. It inserted only the missing sales adjustment rows, retained all nine active lifecycle rows, added only absent grants on named built-in roles, and left custom roles/direct grants/direct denials unchanged. Focused catalog, ENV guard and bootstrap-config tests PASS; static matrix is **66 PASS / 0 FAIL / 0 BLOCKED**; guarded V3 is **6 PASS / 0 FAIL / 0 BLOCKED**. Typecheck and build PASS; lint has 18 existing warnings and 0 errors. Failed early verifier namespaces were exactly identified and cleaned to zero.
