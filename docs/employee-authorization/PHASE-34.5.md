# Phase 34.5 — Sales/POS Operator Enforcement Pilot

## Status

Implementation is in place for the controlled Sales/POS pilot. Automated static, typecheck, lint, build, migration, schema/catalog, real HTTP business-flow verifier evidence, failure atomicity evidence and local browser QA have passed. Final clean-tree 51/51 verifier execution is performed after the closure commit per the Phase 34.5 handoff procedure.

## Scope Implemented

- Sales/POS remains in `legacy_users` mode by default.
- `salesOperatorMode` is resolved from the existing settings table:
  - company default: `value.companyDefault`
  - branch override: `value.branchOverrides[branchId]`
  - fallback: `legacy_users`
- In `shared_employee_operator` mode:
  - true draft create/edit/cancel require User + Employee `sales.create` and Level 1;
  - draft post requires User + Employee `sales.create` and Level 2;
  - legacy immediate-post `/sales/invoices/draft` requires User + Employee `sales.create` and Level 2;
  - POS checkout requires User + Employee `pos.sell` and Level 2;
  - POS discount override requires User + Employee `pos.discount.approve` and Level 2;
  - official print/reprint requires User + Employee `sales.print` and Level 2.
- POS read/search remains read-only compatible with `pos.view` or `pos.sell` and no Employee operator requirement.
- Generic Invoice mutation routes are blocked with `GENERIC_INVOICE_MUTATION_FORBIDDEN`; generic Invoice read/list remains compatible.
- Frontend API errors for stable operator codes trigger the existing global Operator Bar verify/step-up panel without auto-retrying or clearing cart/draft state.

## Migration

Migration: `backend/migrations/20260714050000-sales-pos-operator-enforcement.js`

Local migration count moved from 40 to 41.

Additive schema:

- `invoices.created_by_employee_id`
- `invoices.finalized_by_employee_id`
- `payments.received_by_employee_id`
- `invoice_print_events`

`invoice_print_events` records authorization attempts, not physical printer completion. It stores company, branch, invoice, technical user, optional Employee, optional operator session, event type, copy number, reason and timestamps.

No historical backfill is performed. Legacy rows can retain null Employee fields.

## Permission Catalog

Added exactly:

- `pos.view`
- `pos.sell`
- `pos.discount.approve`

Local permission count moved from 111 to 114. Gold Purchase permission count remains 24.

## Actor and Audit

Employee business attribution is sourced only from the validated server-side operator session:

- draft create sets `Invoice.createdByEmployeeId`;
- final post/POS checkout sets `Invoice.finalizedByEmployeeId`;
- payments created inside final post/POS checkout set `Payment.receivedByEmployeeId`;
- dual audit v2 context is attached to protected Sales/POS commands and print authorization.

Frontend payloads are not trusted for Employee identity.

## Included Routes

| Route | Mode | User permission | Employee permission | Level |
|---|---|---|---|---|
| `POST /api/v1/sales/invoices/drafts` | shared | `sales.create` | `sales.create` | 1 |
| `PATCH /api/v1/sales/invoices/:id` | shared | `sales.create` | `sales.create` | 1 |
| `POST /api/v1/sales/invoices/:id/cancel` | shared | `sales.create` | `sales.create` | 1 |
| `POST /api/v1/sales/invoices/:id/post` | shared | `sales.create` | `sales.create` | 2 |
| `POST /api/v1/sales/invoices/draft` | shared | `sales.create` | `sales.create` | 2 |
| `POST /api/v1/pos/checkout` | shared | `pos.sell` | `pos.sell` | 2 |
| POS discount override | shared | `pos.discount.approve` | `pos.discount.approve` | 2 |
| `POST /api/v1/invoices/:id/print-events` | shared | `sales.print` | `sales.print` | 2 |

## Explicit Exclusions

No operator enforcement was added to:

- Sales Returns
- Sales Exchanges
- finalized invoice cancel/void
- refunds or payment reversals
- standalone installment collection
- gift vouchers
- customer credit deposit/refund
- Gold Purchase
- Supplier Purchases
- Treasury-wide commands
- Accounting-wide commands
- Inventory-wide commands
- Payroll
- Attendance

These remain deferred to Phase 34.5B or later.

## Verification Evidence

Passed:

- `node --check backend/src/routes/erp.routes.js`
- `node --check backend/src/services/sales-operator-policy.service.js`
- `node --check backend/src/models/invoicePrintEvent.model.js`
- `node --check backend/migrations/20260714050000-sales-pos-operator-enforcement.js`
- `node --check scripts/verify-sales-pos-operator-enforcement.js`
- `node scripts/verify-sales-pos-operator-enforcement.js`
- `npm run typecheck`
- `npm run lint` — 0 errors, existing warnings only
- `npm run build`
- `git diff --check`

The upgraded Phase 34.5 verifier now uses real Express HTTP against the local
`darfus_erp@localhost:5433` database and emits:

- `LIVE HTTP TESTS EXECUTED`
- `FAILURE ATOMICITY PASSED`
- `No persistent business test pollution detected`
- `SALES/POS OPERATOR ENFORCEMENT PASSED`

Local DB evidence:

- migrations: 41
- permissions: 114
- Gold Purchase permissions: 24
- POS permissions exist once
- approved columns/table exist

Behavioral evidence covered:

- shared-mode POS checkout without operator session returns exact `401 OPERATOR_SESSION_REQUIRED`;
- employee missing `pos.sell` and employee direct denial return exact `403 OPERATOR_PERMISSION_DENIED`;
- technical user missing `pos.sell` returns exact `403 FORBIDDEN`;
- operator branch mismatch returns exact `403 OPERATOR_BRANCH_MISMATCH`;
- shared-mode POS checkout succeeds only after Level 2 Employee verification and persists
  `Invoice.finalizedByEmployeeId` and `Payment.receivedByEmployeeId`;
- discount override requires both technical `pos.discount.approve` and Employee
  `pos.discount.approve`, with denied attempts producing zero business mutation;
- draft create is Level 1 and persists `Invoice.createdByEmployeeId`;
- draft post requires Level 2 and persists `Invoice.finalizedByEmployeeId`;
- generic invoice mutation is blocked with `GENERIC_INVOICE_MUTATION_FORBIDDEN`;
- official print/reprint authorization records copy metadata and enforces duplicate/reason rules;
- legacy branch mode preserves no-Employee POS checkout behavior.

Local browser QA evidence used an isolated `T34-5-BQA-*` namespace against the
local frontend, local backend and local DB. Evidence included:

- API-mode login with isolated technical user;
- English POS shared-mode page rendering with the Employee verification banner,
  product/customer visibility and checkout controls;
- shared-mode no-operator checkout denial with `OPERATOR_SESSION_REQUIRED`;
- shared-mode Level 2 Employee verification followed by employee-attributed POS checkout;
- legacy branch POS checkout without Employee finalizer;
- Arabic POS RTL smoke;
- exact browser-QA namespace cleanup with zero remaining records.

## Remaining Limitations

- Final clean-tree 51/51 verifier suite must be run after the closure commit.
- Broader Phase 34.5B business surfaces remain deferred.

## Deferred Work

- Phase 34.5B
- returns
- exchanges
- finalized cancel/void
- refunds/reversals
- standalone installment collection
- gift vouchers
- customer credit deposit/refund
- advanced numeric discount limits
- manager/second-Employee override
- Gold Purchase integration
- Treasury/accounting/inventory-wide integration
- offline finalization
- User.accountType
- Phase 33D
- Phase 33C-HF2
