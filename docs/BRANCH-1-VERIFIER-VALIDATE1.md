# BRANCH-1-VERIFIER-VALIDATE1 — Formal Verification Record

Verification ID: `B1VV-20260721`

Date: 2026-07-21. Workspace: `H:\WORK\jewellery-erp-master`. Branch: `main`.
Starting and verification HEAD: `0b18cd35579276e51fc60291de50897d50b70444`.

## Safety and baseline

The only allowed live target was resolved through the shared ENV contract as
development PostgreSQL `::1:5432/darfus_erp`. No `DATABASE_URL`/`DB_*`
conflict was accepted. Before live verification, backup
`backend/backups/darfus_erp_branch1_verifier_validate1_20260721130243.dump`
was created under the ignored backup directory (368,533 bytes); `pg_dump` and
`pg_restore -l` both exited 0.

The database remained at 48 applied migrations, with the exact canonical
128-slug permission set (SHA-256 `7d4959cf19ca0ddd138422d097b7311600d5b43deae0a31780bedf6cc0565dc1`), no duplicate slug/orphan role grant, and default role counts `admin 128`, `owner 128`, `manager 114`, `accountant 30`, `sales 27`.

## Static/readiness matrix

All 66 canonical `scripts/verify-*.js` entries were run as
`node scripts/<file>` with live confirmation absent. Result: **66 PASS / 0
FAIL / 0 BLOCKED** (exit 0 for every entry; observed duration range 52–1322 ms).

| Range | Result | Canonical verifier files |
| --- | --- | --- |
| 1–11 | PASS | accounting-dashboard-source-of-truth, accounting-treasury-launch-minimum, apply-customer-credit, auth-security-containment, barcode-inventory-foundation, barcode-tag-print-layouts, branch-operational-isolation, client-demo-data, client-demo-transactional-seeds, client-scope-lock, customer-credit-2300-reconciliation |
| 12–22 | PASS | customer-credit-existing-rows-checker, customer-credit-gl-bridge, customer-credit-ledger, customer-credit-refund, customer-history-exchange-display, customer-reconciliation-panel, customer-statement-reconciliation, customer-statement-v3-ui, deposit-posting-reconciliation, employee-authorization-foundation, employee-credential-setup-readiness |
| 23–33 | PASS | employee-management-operator-ui-contract, employee-operator-session, employee-permission-catalog-wiring, employee-permission-enforcement, exchange-display-api-enrichment, exchange-print-display, exchange-summary-ui, exchange-tax-customer-facing-policy, full-2300-reconciliation, gold-purchase-approval-workflow, gold-purchase-draft-workflow |
| 34–44 | PASS | idempotency, installment-balance-writeback, installment-reconciliation, inventory-item-type-forms, invoice-crud-guards, invoice-print-view-model, invoices-search-print, ledger-reporting-foundation, live-exchange-tax-policy, manual-customer-deposit, market-launch-safety-containment |
| 45–55 | PASS | pos-reservation-deposit-configuration, post-reset-operational-bootstrap, print-builder-config, print-company-info, print-template-config, production-data-source, reservation-amendment-expiry-renewal, reservation-completion-refund-settlement, reservation-core-accounting-foundation, reservation-governance-reports-ui, return-exchange-settlement |
| 56–66 | PASS | return-exchange-settlement-options, return-exchange-settlement-ui, sales-adjustment-operator-enforcement, sales-pos-operator-enforcement, secondary-idempotency, simple-account-center, simple-branch-account-access, simple-super-admin-access, single-level-employee-operator, source-aware-statement-v3, super-admin-branch-shell-recovery |

## Approved live execution

The finalized approved V3 matrix passed **6 PASS / 0 FAIL / 0 BLOCKED** using
the fresh backup and distinct run IDs:

| Verifier | Run ID | Result | Cleanup evidence |
| --- | --- | --- | --- |
| employee-authorization-foundation | `B1VV-AUTH-20260721` | PASS | Explicit no persistent test pollution |
| employee-operator-session | `B1VV-SESSION-20260721` | PASS | Explicit no persistent test pollution |
| employee-permission-enforcement | `B1VV-ENFORCE-20260721` | PASS | Namespaced cleanup completed |
| employee-permission-catalog-wiring | `B1VV-CATALOG-20260721` | PASS | Namespaced cleanup completed |
| single-level-employee-operator | `B1VV-SINGLE-20260721` | PASS | Namespaced cleanup completed |
| super-admin-branch-shell-recovery | `B1VV-RECOVERY-20260721` | PASS | Explicit no persistent account test pollution |

Additional approved rollback-scoped V2 verifier
`verify-accounting-treasury-launch-minimum.js` passed in 1,401 ms under
`B1VV-ACCOUNT-V2-20260721`.

## Safety-negative matrix

Guard rejection tests passed for remote host, Production, Staging, wrong DB,
wrong port, missing owner confirmation, missing live confirmation, missing run
ID, missing backup, invalid/missing backup, DB identity mismatch, V4, and V5.
Static V0 mode works with no DB confirmation. The guard unit test passed.

All three V4 entry points (`sales-adjustment-operator-enforcement`,
`sales-pos-operator-enforcement`, and `simple-super-admin-access`) were
explicitly invoked with live confirmations and a valid backup; each refused
with `VERIFY_EXISTING_DATA_MUTATION_SHARED_DATABASE_FORBIDDEN`. Generic V5
refused with `VERIFY_DESTRUCTIVE_SHARED_DATABASE_FORBIDDEN`. An in-memory
disposable canonical-source copy with one required slug removed failed its
semantic assertion as expected; no official file was altered.

## Reconciliation and quality

Post-run exact owned-fixture probes returned zero across Company, Branch, User,
Role, Employee, Customer, Asset, Reservation, Payment, CashTransaction,
JournalEntry, and StockMovement prefixes. Journal reconciliation found zero
unbalanced journal entries. Post-run non-fixture counts were: 10 cash
transactions, 15 journals, 30 journal lines, 0
stock movements, 0 payments, 1 reservation, 0 Customer Credit transactions,
and 0 cash-register sessions. No owned financial/inventory residue exists.

Focused permission/ENV/bootstrap tests PASS. Typecheck PASS. Lint PASS with
18 existing warnings and zero errors. Production build PASS. `git diff --check`
PASS.

## Finding and decision

`B1VV-F001` remains open: read-only live
`scripts/verify-client-demo-data.js` failed its historical expectation
`Expected at least 20 assets, found 11`. Its live code issues SELECT queries
only; no Product, financial, inventory, or DB mutation occurred. This is a
local data-baseline/verifier-readiness blocker, not a Product defect.

**Decision: PARTIAL — NAMED VERIFIER OR LOCAL INFRASTRUCTURE BLOCKER REMAINS.**

Next marker:

`BRANCH-1-VERIFIER-VALIDATE1-CONT1 — resolve only B1VV-F001 without Product business changes.`

Production, Staging, remote DBs, server environments, and deployment targets
were not accessed or changed.

## CONT1 — historical demo-baseline reconciliation

`B1VV-F001` is closed as an **optional historical-demo readiness classification**,
not by adding data or changing a Product/verifier assertion. The exact assertion
is `scripts/verify-client-demo-data.js:186`:
`counts.assets >= 20`. It was introduced by
`02f870a54d96261289f015a9f065e9564702b0d3` (2026-07-10,
`test: close transactional demo seed verification`) as part of a one-time
Phase 32.4 post-reset snapshot. That closure records 20 assets, 12 invoices,
6 installments, 14 cash transactions, 26 journals, and 73 journal lines on
the then-local port-5433 demo database. It is not an owner-approved v1.0.0
minimum dataset or a Branch-1 Product contract.

The associated inventory seeder defines only eleven named `AST-CD-*` variants;
the later raw 20-row check therefore represented the combined historical reset
and transactional-flow snapshot, rather than an inventory, pagination, branch,
or UI requirement. The current adopted `::1:5432/darfus_erp` database has 11
operational assets: 5 available and 6 sold across four branches. They have
valid company/branch ownership, no cross-company branch mismatch, no soft
deletes, no duplicate/invalid barcodes, and two legitimate child assets. None
is an `AST-CD-*` historical fixture; all eleven lack the retired demo
`inventory_subtype` coverage. Current counts also differ from the historical
snapshot (13 invoices, 1 payment, 0 installments, 16 journals, 35 journal
lines, 11 cash transactions), proving that the whole live branch is a
historical-demo sufficiency probe rather than a current Product acceptance test.

The probe was rerun read-only with explicit local identity and correctly failed
at the unchanged assertion: `Expected at least 20 assets, found 11`. This is
the false-pass proof: the historical mode still detects an absent historical
baseline and no exit semantics were weakened. Its approved mandatory mode is
static/readiness, which passed; the explicit live mode remains optional and may
be used only to assess whether a separately approved historical demo snapshot
has been restored. No persistent Asset, fixture, seed, migration, Product code,
or verifier code was changed.

CONT1 fresh backup
`backend/backups/darfus_erp_branch1_verifier_validate1_cont1_20260721132906.dump`
(370,982 bytes) passed `pg_dump` and `pg_restore -l`. Rerun results: static
66 PASS / 0 FAIL / 0 BLOCKED; guarded V3 6 PASS / 0 FAIL / 0 BLOCKED; V2
rollback PASS; guard negative suite 13/13 PASS; all V4 entries and V5 refused;
permission/ENV/bootstrap tests, typecheck, build, and diff check PASS; lint
PASS with 18 existing warnings and zero errors. Exact owned-fixture cleanup,
financial, inventory, permission, and role reconciliation remained clean.

**Decision: FORMAL BRANCH VERIFIER VALIDATION COMPLETE.** Historical-demo
richness remains explicitly unproven and is not release or Product acceptance.
Production, Staging, remote targets, deployment, and Product business code were
not accessed or changed.

Next marker:

`DEPOSIT-1-DIAG-CLOSE — Reproduce and close reservation-deposit configuration, treasury-authority, state-machine, CashRegister, and GL diagnosis before authorizing the Product fix.`
