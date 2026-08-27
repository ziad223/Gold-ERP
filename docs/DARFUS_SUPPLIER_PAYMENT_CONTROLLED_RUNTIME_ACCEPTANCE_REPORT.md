# DARFUS ERP — Supplier Payment Controlled Runtime Acceptance Report

Control ID: `DARFUS-SUPPLIER-PAYMENT-CONTROLLED-RUNTIME-ACCEPTANCE`

## Owner Authorization

Owner Authorization: `APPROVED`

Target DB: `darfus_erp`

Online Production: `NOT TOUCHED`

The authorized lifecycle was not started because the live backend on port 8000 was stale relative to the approved source changes. Sending a payment to that process would have tested the previous settlement authority and could have created misleading financial evidence.

## Candidate

The selected existing clean synthetic PO was:

| Field | Value |
|---|---|
| Supplier | `SUP-001` |
| PO | `PO-1787094119240` |
| Company | `COMP-48ab554f-427e-4642-9419-bc8616c2dc36` |
| Branch | `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c` (`Branch-1`) |
| PO status | `received` |
| Consignment | `false` |
| Raw PO total | `2132.96451278` |
| Posted purchase journal | `JE-1787094119309` |
| Posted AP | `2132.96` |
| Existing supplier payment | none |

The historical bad PO `PO-1787090870807` was excluded.

## Settlement Authority

The source implementation is aligned with the Owner decisions:

- Purchase and tax history remain 8DP.
- Supplier settlement is 2DP AED.
- Posted supplier-payable credit in the posted purchase journal is the settlement authority.
- Allocation is single-PO.
- Reversal is append-only.
- Posted payment hard delete is forbidden.

Read-only API evidence from the live process showed the old response shape: `originalPayable` and `paymentHistory` were absent, while `remainingAmount` still reflected the legacy raw-PO path. Source modification times were after the backend container start time. Therefore the live process had not loaded the approved settlement/reversal source.

## Baseline

Preflight passed:

| Check | Result |
|---|---|
| `GET /api/v1/health` | HTTP 200, `UP` |
| `GET /api/v1/health/db` | HTTP 200, PostgreSQL connected |
| `GET /api/v1/health/redis` | HTTP 200, Redis connected |
| `SELECT current_database()` | `darfus_erp` |
| `pg_is_in_recovery()` | `false` |
| SequelizeMeta | 86 |

A fresh official backup was created before any business mutation:

`backups/official/darfus_erp_PRE_SUPPLIER_PAYMENT_RUNTIME_20260819_1832.dump`

Backup verification: non-empty, `678842` bytes, `pg_restore --list` returned `1186` entries.

Baseline A counts:

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

Target PO snapshot:

- PO total: `2132.96451278`
- Tax snapshot: preserved JSON with `roundingScale=8`, `taxableBase=1871.02150244`, and `vatAmount=261.94301034`
- Purchase journal: `JE-1787094119309`
- Journal debit = credit = `2132.96`
- AP credit: `2132.96`
- Current effective payment: `0.00`
- Current outstanding: `2132.96`

## Partial Payment

`NOT_RUN — RUNTIME_STALE_SOURCE_NOT_LOADED`

No payment POST was sent. The required partial-payment CashTransaction, journal, statement, audit, and idempotency evidence therefore do not exist.

## Replay / Conflict

`NOT_RUN — RUNTIME_STALE_SOURCE_NOT_LOADED`

No payment key was claimed and no replay or changed-payload conflict was generated.

## Overpayment / Invalid Amounts

`NOT_RUN — RUNTIME_STALE_SOURCE_NOT_LOADED`

No overpayment, zero, or negative payment request was sent. No financial mutation occurred.

## Full Settlement

`NOT_RUN — RUNTIME_STALE_SOURCE_NOT_LOADED`

The target PO remained unpaid at the baseline state.

## No-Micro-Residual Proof

Static source proof exists in `supplier-payment-state.service.js`: settlement compares round2 values and does not use the old `<= 0.01` closure tolerance. Runtime proof was not possible because the main backend had not loaded that source.

## Supplier Balance / Statement

The supplier page was read-only inspected in Arabic and English. The page loaded the supplier profile, POs & Receipts, and Supplier Statement surfaces. No Pay or Reversal action was submitted. The target remained at the baseline outstanding amount.

`Supplier.due` was not changed and was not used as settlement authority.

## Reversal

`NOT_RUN — NO ORIGINAL PAYMENT CREATED`

No final payment was created, so no reversal was attempted. This avoids creating a reversal against the stale route or against a nonexistent original payment.

## Reversal Replay / Conflict

`NOT_RUN — NO ORIGINAL PAYMENT CREATED`

No reversal idempotency key was claimed and no reversal journal was created.

## Delete Protection

No delete was attempted. The source route and UI implementation preserve posted payment immutability and expose no hard-delete operation. Runtime delete-protection proof was not run because no payment was created.

## AP Reconciliation

Read-only precondition passed for the candidate:

`posted AP 2132.96 - effective payments 0.00 = outstanding 2132.96`

Post-payment and post-reversal reconciliation could not be run.

## Purchase History Immutability

No business mutation occurred. The following remained unchanged from Baseline A:

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

## Company / Branch / Permissions

Read-only authentication and context preconditions passed for the local admin session:

- Company: `COMP-48ab554f-427e-4642-9419-bc8616c2dc36`
- Branch: `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c`
- Required `treasury.update` permission was present in the authenticated account.

No cross-company, cross-branch, unauthorized, or concurrency mutations were attempted because runtime source freshness failed first.

## Concurrency

Not run. No uncontrolled concurrency was sent to Local Main. The source contains PO row locking and idempotency claims, but runtime concurrency proof remains pending.

## Audit

No payment or reversal audit rows were created. Current read-only query showed zero rows for `supplier.payment` and `supplier.payment.reversal` created by this lifecycle.

## AR / EN

| Surface | Result |
|---|---|
| `/ar/suppliers/SUP-001` | Loaded read-only; Supplier profile and Arabic tabs visible |
| `/en/suppliers/SUP-001` | Loaded read-only; Supplier profile, POs & Receipts, and Supplier Statement visible |
| Pay/Reverse mutation | Not submitted |
| Receive workflow | Not used |
| Console errors/warnings observed | 0 |

The browser evidence is read-only only and is not a payment acceptance result.

## Network / Console

| Operation | Result |
|---|---|
| Health | HTTP 200 |
| DB health | HTTP 200 |
| Redis health | HTTP 200 |
| Supplier PO GET | HTTP 200, legacy response shape observed |
| Partial payment POST | Not sent |
| Same-key replay | Not sent |
| Changed-payload conflict | Not sent |
| Overpayment/zero/negative POST | Not sent |
| Full settlement POST | Not sent |
| Reversal POST | Not sent |
| Reversal replay/conflict | Not sent |
| Browser console | 0 observed errors/warnings |

No password, token, cookie, or authorization header was written to the report.

## Final DB Reconciliation

After the stale-runtime detection, a read-only integrity query confirmed:

| Allowed/forbidden domain | Delta |
|---|---:|
| PO count | 0 |
| Asset count | 0 |
| Barcode history | 0 |
| RFID assignments | 0 |
| Inventory movements | 0 |
| Purchase cost revisions | 0 |
| Current valuations | 0 |
| CashTransactions | 0 |
| Cash-transaction journals | 0 |
| Payment/reversal idempotency | 0 |
| Payment/reversal audit | 0 |

## Integrity Queries

The following current-path conditions remained zero because no payment lifecycle was run:

- payment without valid PO
- payment without supplier/company ownership
- payment without journal
- unbalanced payment journal
- overpaid PO at 2DP
- paid PO with non-zero 2DP residual
- negative outstanding
- duplicate effective payment
- reversal without original payment
- duplicate effective reversal
- unbalanced reversal journal
- payment-caused Asset/Barcode/RFID/Inventory mutation

The pre-existing historical unbalanced journal remains outside this current-path result.

## Focused Tests

Static/source tests and typecheck from the implementation batch remained passing:

| Check | Result |
|---|---|
| Supplier payment settlement focused tests | 6/6 PASS |
| Supplier all-asset-profile regression | 4/4 PASS |
| Supplier master final closure | 6/6 PASS |
| Unified inventory intake regression | 5/5 PASS |
| Asset/Barcode/RFID regressions | PASS in verified suites |
| G3/tax/GBP/G2A2/G2B regressions | PASS in verified suites |
| `npm run typecheck` | PASS |
| Runtime payment/reversal acceptance | NOT RUN |

No mutating verifier or payment runtime script was run against `darfus_erp`.

## Historical Defect Boundary

The following was preserved and not used:

| Field | Value |
|---|---|
| PO | `PO-1787090870807` |
| Journal | `JE-1787090870905` |
| Debit | `2133.21` |
| Credit | `2133.22` |
| Classification | `HISTORICAL_PREEXISTING_DEFECT` |
| Action | `PRESERVED_NO_REWRITE` |

## Gate

`FAIL_SUPPLIER_ACCOUNTS_AND_PAYMENTS_FINAL_CLOSURE`

Failure classification: `ENVIRONMENT_CONFIG / RUNTIME_STALE_SOURCE_NOT_LOADED`.

This is not evidence of financial data corruption and no P0/P1 data regression was introduced by this run. It means the mandatory controlled runtime acceptance could not safely begin because port 8000 was serving the pre-change process. Restarting the backend was not performed because its compose command runs the migration command at startup while this control explicitly forbids migration execution.

`SUPPLIER_ACCOUNTS_FINAL_CLOSED = NO`

## Final Tokens

```text
CURRENT_CONTROL = DARFUS-SUPPLIER-PAYMENT-CONTROLLED-RUNTIME-ACCEPTANCE
OWNER_AUTHORIZATION = APPROVED
LOCAL_MAIN_DB = darfus_erp

PAYMENT_TEST_SUPPLIER_ID = SUP-001
PAYMENT_TEST_PO_ID = PO-1787094119240
PAYMENT_TEST_PO_TOTAL_8DP = 2132.96451278
PAYMENT_TEST_POSTED_AP_2DP = 2132.96
PAYMENT_TEST_CURRENT_OUTSTANDING_2DP = 2132.96
PAYMENT_TEST_PURCHASE_JOURNAL_ID = JE-1787094119309

PURCHASE_TAX_PRECISION = 8DP_PRESERVED
SUPPLIER_SETTLEMENT_PRECISION = 2DP_AED
CANONICAL_PAYABLE_SETTLEMENT_AMOUNT = POSTED_AP_AMOUNT
PAYMENT_ALLOCATION_SCOPE = SINGLE_PO

PARTIAL_PAYMENT_RUNTIME = FAIL_NOT_RUN_STALE_RUNTIME
PAYMENT_IDEMPOTENCY_REPLAY = FAIL_NOT_RUN_STALE_RUNTIME
PAYMENT_IDEMPOTENCY_CONFLICT = FAIL_NOT_RUN_STALE_RUNTIME
OVERPAYMENT_SAFETY_RUNTIME = FAIL_NOT_RUN_STALE_RUNTIME
ZERO_NEGATIVE_PAYMENT_SAFETY = FAIL_NOT_RUN_STALE_RUNTIME
FULL_PAYMENT_RUNTIME = FAIL_NOT_RUN_STALE_RUNTIME
NO_MICRO_RESIDUAL_AFTER_FULL_SETTLEMENT = PASS_STATIC_RUNTIME_NOT_RUN
PAYMENT_JOURNAL_BALANCE = PASS_PRECONDITION_RUNTIME_NOT_RUN

SUPPLIER_BALANCE_RUNTIME = FAIL_NOT_RUN_STALE_RUNTIME
SUPPLIER_STATEMENT = PASS_READ_ONLY_RUNTIME_PAYMENT_NOT_RUN
TARGET_PO_AP_RECONCILIATION = PASS_PRECONDITION_RUNTIME_NOT_RUN
SUPPLIER_BALANCE_RECONCILIATION = FAIL_NOT_RUN_STALE_RUNTIME

PAYMENT_REVERSAL_RUNTIME = FAIL_NOT_RUN_NO_ORIGINAL_PAYMENT
PAYMENT_REVERSAL_JOURNAL = FAIL_NOT_RUN_NO_ORIGINAL_PAYMENT
PAYMENT_REVERSAL_REOPENS_OUTSTANDING = FAIL_NOT_RUN_NO_ORIGINAL_PAYMENT
PAYMENT_REVERSAL_IDEMPOTENCY_REPLAY = FAIL_NOT_RUN_NO_ORIGINAL_PAYMENT
PAYMENT_REVERSAL_IDEMPOTENCY_CONFLICT = FAIL_NOT_RUN_NO_ORIGINAL_PAYMENT

POSTED_PAYMENT_HARD_DELETE = BLOCKED_NOT_ATTEMPTED
PAYMENT_COMPANY_SCOPE = PASS_STATIC_RUNTIME_NOT_RUN
PAYMENT_BRANCH_SCOPE = PASS_STATIC_RUNTIME_NOT_RUN
PAYMENT_PERMISSIONS = PASS_PRECONDITION_RUNTIME_NOT_RUN
PAYMENT_AUDIT = FAIL_NOT_RUN
PAYMENT_CONCURRENCY_SAFETY = FAIL_NOT_RUN
PAYMENT_REVERSAL_CONCURRENCY_SAFETY = FAIL_NOT_RUN

PURCHASE_HISTORY_IMMUTABLE_AFTER_PAYMENT = PASS_NO_MUTATION_BASELINE_DELTA_ZERO

AR_UI = PASS_READ_ONLY_PAYMENT_NOT_RUN
EN_UI = PASS_READ_ONLY_PAYMENT_NOT_RUN
NETWORK = PASS_HEALTH_ONLY_RUNTIME_NOT_RUN
CONSOLE = PASS_ZERO_OBSERVED_READ_ONLY
FOCUSED_TESTS = PASS_STATIC
TYPECHECK = PASS

PO_COUNT_DELTA = 0
ASSET_COUNT_DELTA = 0
BARCODE_HISTORY_DELTA = 0
RFID_DELTA = 0
INVENTORY_MOVEMENT_DELTA = 0
PURCHASE_COST_REVISION_DELTA = 0

HISTORICAL_UNBALANCED_JOURNAL = JE-1787090870905
HISTORICAL_DEFECT_ACTION = PRESERVED_NO_REWRITE

MIGRATION_CREATED = NO
MIGRATION_EXECUTED = NO
ONLINE_PRODUCTION_CONTACTED = NO
OFFICIAL_DB_BUSINESS_WRITES = 0

GATE = FAIL_SUPPLIER_ACCOUNTS_AND_PAYMENTS_FINAL_CLOSURE
SUPPLIER_ACCOUNTS_FINAL_CLOSED = NO
NEXT_RECOMMENDED_STEP = RESTART_LOCAL_BACKEND_WITHOUT_MIGRATION_EXECUTION_THEN_REPEAT_CONTROLLED_RUNTIME
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP.
