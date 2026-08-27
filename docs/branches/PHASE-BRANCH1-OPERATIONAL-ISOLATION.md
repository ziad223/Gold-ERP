# PHASE BRANCH-1 - Operational Isolation (local implementation record)

**Status:** NOT CLOSED. This record preserves implementation and isolated QA evidence; it is not a production-deployment approval.

## Scope and safety

All work remained on `main` and local services only. No production system was accessed or changed. The primary `darfus_erp` database was not migrated or used for write-capable QA. Its before/after counts for companies/assets/journal_entries/system_account_roles were `9/20/53/0`.

Read-only primary backups were created and their archive listings validated:

- `backend/backups/darfus_erp_branch1_start_20260720_132745.dump`
- `backend/backups/darfus_erp_branch1_final_20260720_133606.dump`

The isolated localhost-only `darfus_erp_branch1_qa` database was created from empty, migrated, used by the focused verifier, cleaned to zero QA company, branch-customer, role, and account rows, and dropped.

## Implemented model

The selected customer model is **company identity plus `BranchCustomer`**. The two additive migrations bring the repository migration count to 47:

1. Branch-scoped system account roles and `accounts.branch_id`.
2. `branch_customers`, without guessing or rewriting historical ownership.

`CUSTOMER_DEPOSIT_LIABILITY` now resolves on `companyId + branchId + roleCode`; branch bootstrap creates a minimal active liability account and mapping or safely adopts a valid single-branch legacy mapping. Multi-branch legacy mappings are manual-review blockers. Bootstrap returns `created`, `adopted`, `alreadyPresent`, `blockers`, and `warnings`, and creates no balances, journals, or Demo data.

The ordinary Settings account selector was removed. Settings/POS use a read-only branch readiness result. Operational branch authority is derived on the server from authenticated context; mismatched submitted branch values are rejected. The reservation path now resolves the branch role before writes and checks same-branch customers/assets/reservations. The ERP controller adds server-side operational branch read/write scopes and creates a `BranchCustomer` relationship for new customer writes. The generic asset mutation guard remains in place and no transfer or direct asset branch reassignment workflow was added.

## Verification completed

- JavaScript syntax checks for changed backend JavaScript and migrations: pass.
- Empty isolated QA migration chain: pass (47 migrations).
- `scripts/verify-branch-operational-isolation.js`: static and runtime pass, emitting `BRANCH OPERATIONAL ISOLATION PASSED`.
- Existing post-reset bootstrap verifier: pass.
- Existing reservation deposit configuration static verifier: pass after its stale company-scoped expectations were aligned to the approved branch role.
- `npm run typecheck`: pass.
- `npm run lint`: 18 pre-existing warnings, zero errors.
- `npm run build`: pass.

Permissions remain 128. The focused verifier is number 66 and covers the branch mapping, selector removal, bootstrap idempotency, branch customer and asset scope, readiness/manual-review classification, generic guard, no transfer, and permissions count.

## Why this phase is not closed

The mandatory clean-tree 66/66 verifier suite and the required local Arabic/English desktop/mobile two-branch browser QA matrix were not completed. One legacy accounting verifier was also not runnable against the intentionally unmigrated primary database because its `Account` model now expects the new branch column; the attempted run made no primary data change. These conditions mean the phase cannot claim the requested final local verification outcome.

Historical branchless rows remain read-only/manual-review candidates; no ambiguous record was assigned a branch. `TRANSFER-PRE1` and `NOTIF-PRE1` remain paused; `RESET-DEPLOY1` remains superseded/paused.

## Commits

- `0144003 docs: record branch operational isolation audit`
- `925fb56 fix: enforce branch operational isolation`
- `50459a2 test: align branch isolation verifier expectations`

No production deployment has been performed.
