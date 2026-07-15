# Phase 34.5B Core — Returns, Exchanges and Installment Collection Operator Enforcement

## Status

Phase 34.5B Core is implemented in the current working tree and pending closure commit.

Core scope is intentionally limited to Sales Returns, Sales Exchanges, standalone Installment Collection, and invoice-backed official print/reprint behavior where return/exchange documents are represented as invoices.

Deferred to Phase 34.5B2 or later:

- finalized invoice cancel/void
- generic refunds/payment reversals
- gift voucher issue/redeem/cancel
- customer credit deposit/refund/application
- non-invoice official receipt persistence
- Gold Purchase integration
- broad Treasury/Accounting/Inventory conversion
- production SMTP, OTP/TOTP, backup codes, SMS, full break-glass
- Phase 33D and Phase 33C-HF2

## Permissions

No schema migration was required. Migration count remains 42.

Added exactly three permissions:

| Permission | Arabic label | English label | Level |
|---|---|---|---|
| `sales.returns.execute` | تنفيذ مرتجعات المبيعات | Execute Sales Returns | Level 2 |
| `sales.exchanges.execute` | تنفيذ استبدال المبيعات | Execute Sales Exchanges | Level 2 |
| `sales.installments.collect` | تحصيل الأقساط | Collect Installments | Level 2 |

Expected local permission count is 123. POS permissions remain 3. Gold Purchase permissions remain 24.

## Account-Type Policy

Phase 34.5B Core reuses the centralized account-type-aware Sales/POS operator policy introduced in Phase 34.5A-HF2.

Legacy accounts preserve technical User permission compatibility and existing operator-mode behavior.

Branch Shell accounts receive no direct operational User permissions. They reach the employee-first command gate only through valid fixed company/branch technical scope, then require an active Employee operator session, Employee branch access, Employee permission, direct-denial precedence, and the required Level.

Super Admin accounts have technical system scope only. Operational mutations still require active Employee authority and Level 2 where required. There is no operational bypass.

## Command Gates

| Operation | Legacy technical permission | Employee permission | Level |
|---|---|---|---|
| Return preview/search | existing read/create policy | read policy / Level 1 where sensitive | Level 1 where required |
| Return execute | `sales.create` | `sales.returns.execute` | Level 2 |
| Exchange preview | `sales.create` | `sales.create` | Level 1 |
| Exchange execute | `sales.create` | `sales.exchanges.execute` | Level 2 |
| Installment collect | `sales.create` | `sales.installments.collect` | Level 2 |

Routes do not rely on a generic technical `requirePermission(...)` before Branch Shell employee-first policy for these core operations.

## Actor Attribution

Employee identity is resolved server-side from the active operator session. Frontend payloads are not trusted for Employee identity.

- Return invoices set `createdByEmployeeId` and `finalizedByEmployeeId` from the active Employee.
- Exchange invoices set `createdByEmployeeId` and `finalizedByEmployeeId` from the active Employee.
- Installment collection payments set `Payment.receivedByEmployeeId` from the active Employee.
- Audit context records technical User, Employee, operator session, company, branch and command context.

No new actor columns were added and no historical backfill was performed.

## Idempotency and Atomicity

Return, exchange and installment idempotency include server-side operator actor consistency.

- Same idempotency key, same request and same Employee may replay safely.
- Same idempotency key under a different Employee conflicts rather than silently replaying with a different actor.
- Denied requests are verified failure-atomic and do not create invoices, items, payments, stock movements, journal/cash entries, customer-credit rows, notifications, success audit or idempotency success rows.

Business calculations for pricing, tax, COGS, settlement, journals, cash and stock valuation were not redesigned.

## Frontend

The Returns, Exchanges and Installments pages expose execution/collection actions through the new employee permissions while preserving legacy visibility compatibility.

Operator-required, step-up, direct-denial, branch-mismatch and stale-session failures preserve form state and use the existing operator recovery flow. Idempotency keys remain stable across safe retry and are reset when material request inputs change.

## Verification

New verifier:

- `scripts/verify-sales-adjustment-operator-enforcement.js`

Expected verifier inventory: 53.

Required marker:

- `SALES ADJUSTMENT OPERATOR ENFORCEMENT PASSED`

Regression evidence includes:

- Phase 34.5 Sales/POS operator verifier
- Phase 34.5A/HF1/HF2 account/session/recovery verifier
- return/exchange settlement verifiers
- installment balance/reconciliation verifiers
- full verifier suite expected `53/53 PASS`

## Local Backup

Before live DB-backed verification, a local PostgreSQL custom-format backup was created:

- `backend/backups/darfus_erp_phase34_5b_core_20260715_175406.dump`
- size: `467855` bytes

The backup is local evidence only and must not be committed.

## Manual Browser QA

Manual browser QA is required before verified closure. Required flows:

- Legacy user compatibility
- Branch Shell with no Employee, Level 1 Employee, Level 2 Employee and direct denial
- Super Admin with no Employee and with valid Employee
- Returns execution, duplicate submit and official print/reprint
- Exchange preview, execution, duplicate submit and official print/reprint
- Installment collection, Level 2 step-up and duplicate submit
- Arabic RTL and English LTR labels/errors
- Desktop/mobile dialog behavior
- QA fixture cleanup and stopped services
