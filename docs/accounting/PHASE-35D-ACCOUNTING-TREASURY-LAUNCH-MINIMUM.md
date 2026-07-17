# Phase 35D - Accounting and Treasury Launch Minimum

Status: implementation complete, verification in progress.

Phase 35D implements the smallest Day-1 accounting truth and cash-register control approved after Phase 35C. It does not implement full fiscal close, VAT filing, purchase lifecycle redesign, inventory valuation, payroll, production deployment, or accountant policy decisions.

## Safety Baseline

- Repository: `H:\WORK\jewellery-erp-master`
- Branch: `main`
- Starting HEAD: `0d3bc0bc99ccb4e1aedf0192dfc78b12096152bf`
- Starting commit: `0d3bc0b docs: map client requirements to market mvp`
- Stashes: 11, untouched
- Local DB only: Docker PostgreSQL `localhost:5433 / darfus_erp`
- Production/Render/remote databases: untouched
- Start backup: `H:\WORK\jewellery-erp-master\backend\backups\darfus_erp_phase35d_start_20260717_144709.dump` (`481174` bytes)

## Included Requirement IDs

- `CR-ACC-004`: account-balance truth from posted journal lines.
- `CR-ACC-005`: minimum accounting date lock.
- `CR-ACC-006`: VAT/tax boundary documented, no VAT filing policy invented.
- `CR-ACC-011`: direct balance mutation blocked.
- `CR-TREAS-004`: minimum cash close expected/count/variance control.
- `CR-TREAS-005`: branch cash register/session control.
- `CR-REP-001`: company/branch-scoped reconciliation/register reporting.
- `LB-35C-001`, `LB-35C-002`, `LB-35C-003`, `LB-35C-006`.

## Implemented

- Added migration `20260717010000-accounting-treasury-launch-minimum.js`.
- Added `accounting_locks` with one lock row per company.
- Added `cash_register_sessions` with one-open-register uniqueness per company, branch, and cash account.
- Added narrow permissions:
  - `treasury.register.view`
  - `treasury.register.open`
  - `treasury.register.close`
  - `accounting.lock.manage`
  - `accounting.reconciliation.view`
- Added services:
  - `accounting-lock.service.js`
  - `account-balance.service.js`
  - `cash-register.service.js`
- Posting engine and manual journal service now enforce locked-through accounting dates.
- Treasury summary now reads posted journal-line balances, not `Account.balance`.
- `Account.balance` remains as a compatibility mirror and is reported as divergence only.
- Generic account create/update rejects direct `balance`, `storedBalance`, and `calculatedBalance` mutation.
- Treasury cash-affecting manual transactions require an open branch cash register.
- Register close computes expected cash server-side and requires a variance reason when counted cash differs.
- Gift Voucher issue/redeem write APIs are denied with `GIFT_VOUCHER_FINANCIAL_WORKFLOW_DISABLED`; historical reads remain.
- Accounting UI exposes date lock and balance-truth summary in the reconciliation tab.
- Treasury UI exposes register open/current/close/history controls.
- Gift Voucher UI shows the disabled launch state.

## API Surface

- `GET /accounting/lock`
- `PUT /accounting/lock`
- `GET /reports/account-balances/reconciliation`
- `GET /treasury/register/current`
- `GET /treasury/registers`
- `POST /treasury/register/open`
- `POST /treasury/register/close`

Existing treasury transaction and summary routes are preserved, with cash-register and ledger-truth enforcement added.

## Counts

- Migrations before: 43
- Migrations after migration: 44
- Permissions before: 123
- Permissions after migration: 128
- Verifier files before new verifier in this working tree: 57
- Verifier files after adding `verify-accounting-treasury-launch-minimum.js`: 58

## Verification

Targeted verifier:

```powershell
node scripts/verify-accounting-treasury-launch-minimum.js
```

Marker:

```text
ACCOUNTING TREASURY LAUNCH MINIMUM PASSED
```

The verifier checks:

- migration/schema presence;
- final DB counts;
- permission rows;
- accounting lock denial;
- posted journal-line balance truth versus stored mirror divergence;
- cash transaction denial without open register;
- open/close register behavior;
- server-calculated expected cash and variance;
- variance reason requirement;
- fixture rollback cleanup;
- static route/UI/localization contracts.

## Deferred

- VAT return filing, UAE e-invoicing, UUID/QR/government submission.
- Gift Voucher liability/redeem accounting.
- Customer Gold Purchase final financial settlement and gold liability.
- Inventory valuation and warehouse launch MVP.
- Purchase lifecycle reversal/debit-note hardening.
- Payroll/attendance calculations.
- Full accounting report catalog, fiscal years, retained earnings, and full close process.
- Production deployment and external integrations.

No plaintext credentials, secrets, tokens, or PINs are documented.
