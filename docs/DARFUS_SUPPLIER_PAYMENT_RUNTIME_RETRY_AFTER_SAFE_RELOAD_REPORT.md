# DARFUS ERP — Supplier Payment Runtime Retry After Safe Reload Report

Control ID: `DARFUS-SUPPLIER-PAYMENT-RUNTIME-RETRY-AFTER-SAFE-RELOAD`

## Compose / Startup Forensic

| Item | Evidence |
|---|---|
| Service | `backend` |
| Container before reload | `darfus-backend` |
| Original command | `sh -c "npm run db:migrate && npm start"` |
| Entrypoint | `/sbin/tini --` |
| Working directory | `/app` |
| Source mount | `I:\WORK\jewellery-erp-master\backend` → `/app` (RW bind mount) |
| Node process before reload | `node src/server.js`, stale relative to source edit |
| PostgreSQL/Redis | Not restarted or recreated |

The ordinary compose restart path was not used because it invokes the migration command.

## Safe Reload Decision

The safe path was:

1. Stop only the stale `darfus-backend` container.
2. Start `darfus-backend-reload` with an explicit command override: `npm start`.
3. Preserve the same backend bind mount, environment, network, port 8000, PostgreSQL, and Redis.

The reload container command was verified as `["npm","start"]`; no migration command was part of the reload command.

`BACKEND_SAFE_RELOAD = PASS`

## Migration Non-Execution Proof

| Check | Before | After |
|---|---:|---:|
| `COUNT(*) FROM "SequelizeMeta"` | 86 | 86 |

Safe-reload logs showed `npm start` / `node src/server.js` only. `MIGRATION_CREATED = NO`; `MIGRATION_EXECUTED = NO` for this reload.

## New Source Loaded Proof

After reload, authenticated `GET /api/v1/suppliers/SUP-001/purchase-orders` returned for the candidate:

| Field | Actual |
|---|---:|
| Raw PO total | 2132.96451278 |
| `originalPayable` | 2132.96 |
| `paid` | 0.00 |
| `remainingAmount` | 2132.96 |
| `paymentStatus` | unpaid |
| `paymentHistory` | present |

`NEW_PAYMENT_SOURCE_LOADED = PASS`.

## Preflight

| Check | Result |
|---|---|
| `GET /api/v1/health` | HTTP 200, UP |
| `GET /api/v1/health/db` | HTTP 200 |
| `GET /api/v1/health/redis` | HTTP 200 |
| `SELECT current_database()` | `darfus_erp` |
| `pg_is_in_recovery()` | false |
| Existing backup | preserved and previously verified |
| Online production | not contacted |

## Candidate Recheck

| Field | Actual |
|---|---|
| Supplier | `SUP-001` |
| PO | `PO-1787094119240` |
| Status | received |
| Consignment | false |
| Company | `COMP-48ab554f-427e-4642-9419-bc8616c2dc36` |
| Branch | `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c` |
| Raw total | 2132.96451278 |
| Posted AP | 2132.96 |
| Existing effective payments before lifecycle | 0.00 |
| Purchase journal | `JE-1787094119309`, balanced |

The forbidden historical PO/journal were not used.

## Baseline

Immediately before the first payment:

| Entity | Count |
|---|---:|
| purchase_orders | 6 |
| cash_transactions | 0 |
| journal_entries | 6 |
| journal_lines | 18 |
| audit_logs | 49 |
| idempotency_requests | 6 |
| assets | 6 |
| asset_barcode_history | 6 |
| asset_rfid_assignments | 2 |
| inventory_asset_movements | 6 |
| asset_purchase_cost_revisions | 6 |
| asset_current_valuations | 6 |

The tax snapshot and raw PO total were captured and remained unchanged throughout the positive payment steps and the failed reversal attempt.

## Partial Payment

Request amount: `500.00` AED.

| Evidence | Result |
|---|---|
| Network | HTTP 201 |
| CashTransaction | created, `cash_out`, supplier_purchase |
| Journal | created and balanced, Dr AP / Cr Cash, 500.00 |
| State | paid 500.00, outstanding 1632.96, partial |
| Forbidden-domain drift | none |

`PARTIAL_PAYMENT_RUNTIME = PASS`.

## Replay / Conflict

Same-key replay returned HTTP 201 and did not create another payment or journal. Changed payload with the same key returned HTTP 409 and did not mutate the DB.

`PAYMENT_IDEMPOTENCY_REPLAY = PASS`

`PAYMENT_IDEMPOTENCY_CONFLICT = PASS`

## Overpayment / Invalid Amounts

| Case | Amount | Status | Mutation |
|---|---:|---:|---|
| Overpayment | 1632.97 | 422 | none |
| Zero | 0.00 | 422 | none |
| Negative | -1.00 | 422 | none |

Forbidden-domain drift checks passed after each request.

`OVERPAYMENT_SAFETY_RUNTIME = PASS`

`ZERO_NEGATIVE_PAYMENT_SAFETY = PASS`

## Full Settlement

The exact remaining 2DP amount, `1632.96`, was accepted with HTTP 201.

Result before the attempted reversal:

- effective paid: `2132.96`
- outstanding: `0.00`
- status: `paid`
- payment journals: 2, both balanced
- no micro-residual observed

`FULL_PAYMENT_RUNTIME = PASS`

## No-Micro-Residual Proof

The full settlement closed against posted AP at 2DP. No `0.00001278`, `0.0001`, or `0.01` residual existed.

`NO_MICRO_RESIDUAL_AFTER_FULL_SETTLEMENT = PASS`

## Balance / Statement

Supplier statement after full settlement returned HTTP 200. The full-settlement state was `outstanding = 0.00`. The statement path was read-only and used the source-aware payment state.

The required post-reversal balance could not be proven because the reversal failed before commit.

## Reversal

The final payment was submitted once for reversal with reason:

`FINAL-RUNTIME-SUPPLIER-PAYMENT-REVERSAL`

The endpoint returned HTTP 500. Server log evidence showed a temporary reversing journal was posted, then the request failed and the transaction rolled back. Final DB evidence confirms:

- original two payments preserved;
- reversal CashTransaction count = 0;
- reversal journal count = 0;
- reversal idempotency count = 0;
- no reversal audit committed;
- no forbidden inventory/PO/tax drift.

`PAYMENT_REVERSAL_RUNTIME = FAIL`

## Reversal Root Cause

Confirmed source defect:

- `backend/src/services/posting.service.js` `postEntry()` returns a plain JSON object after posting (`entry.toJSON()` plus lines).
- `backend/src/routes/erp.routes.js` reversal path calls `reversalJournal.update({ reversalOf: originalJournal.id })` as if the return value were a Sequelize instance.
- The call throws after the temporary journal is created.
- The surrounding transaction rolls back, preventing a partial persisted reversal.

This is a P1 financial workflow defect in the reversal path. No fix was implemented in this Retry control.

## Reversal Replay / Conflict

Not run after the HTTP 500. No reversal key was persisted, so replay/conflict evidence would require another reversal attempt and is outside the stopped run.

`PAYMENT_REVERSAL_IDEMPOTENCY_REPLAY = NOT_RUN_AFTER_FAILURE`

`PAYMENT_REVERSAL_IDEMPOTENCY_CONFLICT = NOT_RUN_AFTER_FAILURE`

## Delete Protection

No delete was attempted. Source/UI inspection preserves posted-payment immutability and exposes no hard-delete action.

`POSTED_PAYMENT_HARD_DELETE = BLOCKED`

## AP Reconciliation

Before reversal failure:

`Posted AP 2132.96 - effective payments 2132.96 = outstanding 0.00`

After the failed reversal, the two payments remained effective. The final DB state therefore remains fully paid, not the requested partially-paid preferred state.

## Purchase History Immutability

Forbidden domains remained unchanged:

| Domain | Delta |
|---|---:|
| PO count/total | 0 |
| Tax snapshot | 0 |
| Purchase journal | 0 |
| Assets | 0 |
| Barcode history | 0 |
| RFID assignments | 0 |
| Inventory movements | 0 |
| Purchase cost revisions | 0 |
| Current valuations | 0 |

No cleanup or manual correction was performed after the failure.

## Scope / Permissions

The successful requests used the approved company and branch context and the `treasury.update` permission. Dedicated cross-company, unauthorized-branch, and permission-negative runtime tests were not run after the P1 reversal failure.

`PAYMENT_COMPANY_SCOPE = NOT_RUN`

`PAYMENT_BRANCH_SCOPE = NOT_RUN`

`PAYMENT_PERMISSIONS = PASS_PRECONDITION_RUNTIME_NEGATIVES_NOT_RUN`

## Concurrency

Not run. No uncontrolled concurrent write was sent to Local Main. Concurrency remains unproven.

## Audit

Payment audit evidence was created for the two successful payments. The failed reversal created no committed reversal audit. Final counts were audit_logs `49 → 52`; payment-related committed financial records were two payments, two balanced payment journals, and no reversal record.

## AR / EN

Read-only browser verification after the payment lifecycle:

| Page | Result |
|---|---|
| `/ar/suppliers/SUP-001` | Supplier profile and statement surfaces loaded |
| `/en/suppliers/SUP-001` | Supplier profile, POs & Receipts, and Supplier Statement loaded |
| Payment history / amount visibility | observed |
| Reverse action | visible for the posted payment; not clicked |
| Hard-delete action | not present |
| Receive create workflow | not used |
| Console errors/warnings | 0 observed in both inspected tabs |

Browser evidence is read-only after the controlled API lifecycle.

## Network / Console

| Operation | Status |
|---|---:|
| Partial payment | 201 |
| Same-key replay | 201 |
| Changed-payload conflict | 409 |
| Overpayment reject | 422 |
| Zero reject | 422 |
| Negative reject | 422 |
| Full settlement | 201 |
| Statement after full | 200 |
| Reversal | 500 |
| Reversal replay | not run after failure |
| Reversal conflict | not run after failure |
| Browser console | 0 observed |

No password, token, cookie, or authorization header is included in this report.

## Final DB Reconciliation

Final state after the stopped run:

| Entity | Final count | Delta from pre-runtime |
|---|---:|---:|
| purchase_orders | 6 | 0 |
| cash_transactions | 2 | +2 allowed payments |
| journal_entries | 8 | +2 allowed payment journals |
| journal_lines | 22 | +4 allowed payment lines |
| audit_logs | 52 | +3 audit records in current run scope |
| idempotency_requests | 8 | +2 successful payment keys |
| assets | 6 | 0 |
| asset_barcode_history | 6 | 0 |
| asset_rfid_assignments | 2 | 0 |
| inventory_asset_movements | 6 | 0 |
| asset_purchase_cost_revisions | 6 | 0 |
| asset_current_valuations | 6 | 0 |
| reversal CashTransactions | 0 | 0 |
| reversal journals | 0 | 0 |

The final target PO is fully paid because the required reversal did not commit. Payment history was preserved; no destructive cleanup was attempted.

## Integrity Queries

The following current-path invariants were not violated by the successful payment steps or the failed reversal:

- no payment without a valid PO;
- no payment outside supplier/company ownership;
- both payment journals balanced;
- no overpayment;
- no negative outstanding after full settlement;
- no duplicate effective payment from replay;
- no persisted reversal without an original payment;
- no asset/barcode/RFID/inventory mutation caused by payment.

The historical unbalanced journal remains outside the current-path result.

## Focused Tests

| Check | Result |
|---|---|
| Supplier settlement focused suite | 6/6 PASS |
| `npm run typecheck` | PASS |
| Supplier/Asset/Barcode/RFID/GBW/GBP regression suites | previously verified PASS |
| Runtime payment lifecycle through full settlement | PASS |
| Runtime reversal | FAIL, HTTP 500 |
| Runtime reversal replay/conflict/concurrency | NOT RUN after failure |

No migration was created or executed. No mutation script was run outside the explicitly authorized lifecycle.

## Historical Defect Boundary

| Field | Value |
|---|---|
| Historical journal | `JE-1787090870905` |
| Historical PO | `PO-1787090870807` |
| Historical action | `PRESERVED_NO_REWRITE` |
| Used in this lifecycle | no |

## Gate

`FAIL_SUPPLIER_ACCOUNTS_AND_PAYMENTS_FINAL_CLOSURE`

Reason: a current-path P1 financial defect prevents append-only supplier-payment reversal from completing. The transaction rollback protected the database from a partial reversal, but the required final preferred state was not reached.

`SUPPLIER_ACCOUNTS_FINAL_CLOSED = NO`

No automatic fix, retry, cleanup, delete, migration, or next phase was started.

## Final Tokens

```text
CURRENT_CONTROL = DARFUS-SUPPLIER-PAYMENT-RUNTIME-RETRY-AFTER-SAFE-RELOAD
OWNER_AUTHORIZATION = REUSED_APPROVED_SCOPE
LOCAL_MAIN_DB = darfus_erp

BACKEND_SAFE_RELOAD = PASS
MIGRATION_EXECUTED = NO
SEQUELIZE_META_BEFORE = 86
SEQUELIZE_META_AFTER = 86
NEW_PAYMENT_SOURCE_LOADED = PASS

PAYMENT_TEST_SUPPLIER_ID = SUP-001
PAYMENT_TEST_PO_ID = PO-1787094119240
PAYMENT_TEST_PO_TOTAL_8DP = 2132.96451278
PAYMENT_TEST_POSTED_AP_2DP = 2132.96
PAYMENT_TEST_PURCHASE_JOURNAL_ID = JE-1787094119309

PARTIAL_PAYMENT_RUNTIME = PASS
PAYMENT_IDEMPOTENCY_REPLAY = PASS
PAYMENT_IDEMPOTENCY_CONFLICT = PASS
OVERPAYMENT_SAFETY_RUNTIME = PASS
ZERO_NEGATIVE_PAYMENT_SAFETY = PASS
FULL_PAYMENT_RUNTIME = PASS
NO_MICRO_RESIDUAL_AFTER_FULL_SETTLEMENT = PASS
PAYMENT_JOURNAL_BALANCE = PASS

SUPPLIER_BALANCE_RUNTIME = PASS_BEFORE_REVERSAL
SUPPLIER_STATEMENT = PASS_CURRENT_SCOPE_BEFORE_REVERSAL
TARGET_PO_AP_RECONCILIATION = PASS_BEFORE_REVERSAL
SUPPLIER_BALANCE_RECONCILIATION = NOT_PROVEN_AFTER_REVERSAL_FAILURE

PAYMENT_REVERSAL_RUNTIME = FAIL_HTTP_500_ROLLED_BACK
PAYMENT_REVERSAL_JOURNAL = FAIL_NOT_PERSISTED
PAYMENT_REVERSAL_REOPENS_OUTSTANDING = NOT_PROVEN
PAYMENT_REVERSAL_IDEMPOTENCY_REPLAY = NOT_RUN_AFTER_FAILURE
PAYMENT_REVERSAL_IDEMPOTENCY_CONFLICT = NOT_RUN_AFTER_FAILURE

POSTED_PAYMENT_HARD_DELETE = BLOCKED
PAYMENT_COMPANY_SCOPE = NOT_RUN
PAYMENT_BRANCH_SCOPE = NOT_RUN
PAYMENT_PERMISSIONS = PASS_PRECONDITION_RUNTIME_NEGATIVES_NOT_RUN
PAYMENT_AUDIT = PASS_FOR_PAYMENTS_REVERSAL_NOT_COMMITTED
PAYMENT_CONCURRENCY_SAFETY = NOT_RUN
PAYMENT_REVERSAL_CONCURRENCY_SAFETY = NOT_RUN
PURCHASE_HISTORY_IMMUTABLE_AFTER_PAYMENT = PASS

AR_UI = PASS_READ_ONLY_POST_PAYMENT
EN_UI = PASS_READ_ONLY_POST_PAYMENT
NETWORK = FAIL_REVERSAL_HTTP_500
CONSOLE = PASS_ZERO_OBSERVED
FOCUSED_TESTS = PASS_STATIC
TYPECHECK = PASS

PO_COUNT_DELTA = 0
ASSET_COUNT_DELTA = 0
BARCODE_HISTORY_DELTA = 0
RFID_DELTA = 0
INVENTORY_MOVEMENT_DELTA = 0
PURCHASE_COST_REVISION_DELTA = 0
CURRENT_VALUATION_MUTATION_DELTA = 0

HISTORICAL_UNBALANCED_JOURNAL = JE-1787090870905
HISTORICAL_DEFECT_ACTION = PRESERVED_NO_REWRITE

ONLINE_PRODUCTION_CONTACTED = NO
GATE = FAIL_SUPPLIER_ACCOUNTS_AND_PAYMENTS_FINAL_CLOSURE
SUPPLIER_ACCOUNTS_FINAL_CLOSED = NO
NEXT_RECOMMENDED_STEP = MINIMUM_SAFE_REVERSAL_FIX_THEN_OWNER_APPROVED_CONTROLLED_RERUN
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP.
