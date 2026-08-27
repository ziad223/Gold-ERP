# ACC-1 - Accounting Zero-State and Reversal-Aware Ledger Reporting

## Scope and Safety

ACC-1 started from `e9941caef72d0517ce6cec29d029a4f72396490d` on `main`.
All work used local Docker PostgreSQL only: `localhost:5433 / darfus_erp`.
Production/Render was not contacted, changed, or deployed. There is no
migration and no permission change.

Validated backups:

- `backend/backups/darfus_erp_acc1_start_20260719_225538.dump` (818759 bytes)
- `backend/backups/darfus_erp_acc1_final_20260720_001652.dump` (495429 bytes)

Both archives were validated with `pg_restore -l`.

## Root Cause and Reporting Rule

The accounting page had hardcoded card values and KPI placeholders. A second
P1 defect was that financial reporting selected only `status='posted'`.
Manual reversal creates a posted `manual_reversal` and changes the original
posted journal to `reversed`. The proven local pair had cash/bank deltas
`-5000` and `+5000`; posted-only reporting showed a false `+5000` result.

`backend/src/services/ledger-reporting.service.js` centralizes the reportable
ledger statuses: `posted` and `reversed`. Before reporting, it rejects invalid
reversed history: the original must have exactly one same-company/same-branch
posted `manual_reversal` with correct `reversal_of` and `source_id` linkage.
JournalEntry has no currency/book field, so those contexts cannot be checked
at this schema level.

Posting/reversal workflow queries remain unchanged where they mean current
posting state or reversal eligibility.

## Final Contract

`GET /api/v1/accounting/dashboard-summary` returns server-calculated cash and
bank balances, net receipts/payments, currency, scope/period metadata, and
source `reportable_ledger_journal_lines`. The account-balance engine, treasury
summary, trial balance, account ledger, cash reconciliation, and ledger
reconciliation use the same reportable population. `Account.balance` remains
a reconciliation mirror only and is never dashboard truth.

Dashboard activity semantics are **net external cash activity**. It groups an
original/reversal pair by `COALESCE(reversal_of, id)` before classifying the
cash/bank delta. Corrections therefore do not inflate all-time receipts or
payments, while internal cash-to-bank transfers remain net zero across cash
and bank.

The frontend uses `useAccountingDashboardSummary`; it has no financial
fallback/client calculation and shows controlled loading/error/unavailable
states. The activity cards use Net Receipts / Net Payments and Arabic
equivalents.

## Verification and QA

`scripts/verify-accounting-dashboard-source-of-truth.js` emits
`ACCOUNTING DASHBOARD SOURCE OF TRUTH PASSED`. It proves posted inclusion,
draft exclusion, reversal-pair net zero, orphan detection, company/branch
isolation, transfer behavior, API parity, and cleanup.

The manual reversal verifier was aligned with AUTH-1 persisted technical
sessions. The treasury verifier was aligned with the new source name. Three
stale verifier-count checks were updated from 63 to 64 after ACC-1 added its
focused verifier.

Local Playwright QA used only `ACC1-BQA-*` fixtures and passed English LTR,
Arabic RTL, desktop and narrow mobile widths, no horizontal overflow, one
summary request per navigation, journal search/manual-draft dialog,
AED/QAR/USD/EGP server currency formatting, and no browser console/runtime
error. Reversed history was neutralized in cash/net-activity cards.

All ACC1-FIX1/API/BQA companies, users, journals, accounts, technical
sessions, and operator sessions were zero after QA. Ports 3000/8000 were
stopped. Syntax checks, focused verifiers, the manual reversal verifier (29
checks), typecheck, lint, build, and diff-check passed. The clean-tree root
suite passed `64/64`.

## Commits and Next Step

- `109e6ff fix: replace accounting placeholders with ledger summary`
- `b37bc82 test: align verifier count after accounting dashboard`

Counts remain 44 migrations, 128 permissions, and 64 verifier scripts. No
reset, reseed, or production data change occurred.

Next safe action after owner approval:

`ACC-DEPLOY1 - Controlled Production Accounting Zero-State Deployment & Validation`

Do not begin `NOTIF-PRE1`, `UX-PRE1`, or Phase 35E automatically.
