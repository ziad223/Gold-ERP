# DARFUS ERP — Minimum Safe Supplier Payment Reversal Fix + Reversal-Only Runtime Report

Control ID: `DARFUS-SUPPLIER-PAYMENT-REVERSAL-FIX-RUNTIME`

## 1. Executive Summary

تم إصلاح عيب Reversal بأقل تغيير آمن: لم يتم تغيير عقد `postEntry()` عالميًا؛ أعاد مسار Reversal جلب JournalEntry كسجل Sequelize داخل نفس transaction قبل ربط `reversalOf`. نجحت focused tests وtypecheck، ثم تم تنفيذ Reversal-only على الـPO المصرح به.

النتيجة النهائية المطلوبة تحققت: Payment الجزئي بقي فعالًا، والـfinal payment أصبح reversed append-only، وفتح outstanding إلى `1632.96`، دون أي تعديل على PO أو Tax Snapshot أو Asset/Barcode/RFID/Inventory.

## 2. Current State

| Field | Actual |
|---|---|
| Supplier | `SUP-001` |
| PO | `PO-1787094119240` |
| Raw PO total | `2132.96451278` |
| Posted AP | `2132.96` |
| Effective paid after reversal | `500.00` |
| Current outstanding | `1632.96` |
| Current payment state | `partial` |
| Final payment reversed | yes |

No new Partial or Full Payment was created in this control.

## 3. Known Root Cause

`posting.service.js` `postEntry()` returns a plain JSON snapshot (`entry.toJSON()` plus lines). The old Reversal caller invoked `reversalJournal.update(...)`, which only exists on a Sequelize model instance. The previous runtime returned HTTP 500 and rolled back correctly.

## 4. Source Forensic / postEntry Callers

All direct callers were inspected. Their observed contract is JSON/identity data, not a required Sequelize instance:

| Caller family | Expected result |
|---|---|
| `posting.service.js` wrappers | return journal JSON to callers |
| `erp.routes.js` direct posting routes | use journal `.id`/serialized data |
| `financial-settlement.service.js` | use `journal.id` in related rows |
| `customer-credit.service.js` | return posting result / identity |
| `installment-precision-remediation.service.js` | use `correctionJournal.id` |
| CGP accounting/reversal services | use journal identity and serialize if needed |
| reservation services | consume wrapper result identity |

Evidence did not support a global return-contract change.

## 5. Minimum Safe Fix Decision

| Decision | Result |
|---|---|
| `REVERSAL_CALLER_MINIMUM_FIX` | PASS |
| `GLOBAL_POSTING_SERVICE_CONTRACT_CHANGE` | NO |
| Linkage method | `JournalEntry.findOne` inside same transaction, then model `.update` |
| Schema required | no |
| Manual balancing line | no |

The corrected path validates the persisted journal by company/source, locks it, checks existence, updates `reversalOf`, then links the CashTransaction, all before audit/idempotency commit.

## 6. Files Changed

| File | Change |
|---|---|
| `backend/src/routes/erp.routes.js` | Minimal Reversal caller fix only |
| `backend/tests/supplier-payment-settlement-final-closure.test.cjs` | Plain-JSON contract and transaction/scope/lock assertions |
| `docs/DARFUS_SUPPLIER_PAYMENT_REVERSAL_FIX_RUNTIME_REPORT.md` | This report |

No migration, model/schema change, payment route change, receive change, or business formula change was made.

## 7. Focused Tests

| Suite | Result |
|---|---|
| Supplier settlement/reversal focused suite | 8/8 PASS |
| Supplier Master regression | 6/6 PASS |
| Asset regression | 9/9 PASS |
| Barcode regression | 11/11 PASS |
| RFID regression | 17/17 PASS |
| Unified intake regression | 5/5 PASS |
| `npm run typecheck` | PASS |

The focused suite verifies the plain-JSON posting contract, model re-load, transaction rollback path, company/branch/permission guards, row locking, idempotency, append-only behavior, and delete protection. No uncontrolled concurrent write was sent to Local Main.

## 8. Safe Backend Reload

The compose startup command is `sh -c "npm run db:migrate && npm start"`, so it was not used for reload. The stale reload container was stopped and a replacement was started with explicit command `npm start`, using the same bind mount, environment, network, and port. PostgreSQL and Redis were not restarted.

`BACKEND_SAFE_RELOAD = PASS`

## 9. Migration Non-Execution Proof

| Check | Before | After |
|---|---:|---:|
| `COUNT(*) FROM "SequelizeMeta"` | 86 | 86 |

The reload container command was `npm start`; no migration command was included.

`MIGRATION_CREATED = NO`

`MIGRATION_EXECUTED = NO`

## 10. New Reversal Source Loaded

After reload, the authenticated PO GET returned `originalPayable=2132.96`, `paid=2132.96`, `remainingAmount=0`, and `paymentHistory` present. This proved the current settlement source was loaded before the Reversal POST.

`NEW_REVERSAL_SOURCE_LOADED = PASS`

## 11. Runtime Candidate Recheck

| Field | Actual |
|---|---|
| PO status | received |
| Supplier | SUP-001 |
| Purchase journal | `JE-1787094119309` |
| Purchase journal balance | debit = credit = 2132.96 |
| Existing supplier payments | 2 |
| Partial payment | 500.00 |
| Final payment | 1632.96 |
| Outstanding before reversal | 0.00 |

Final payment selected, never the 500.00 partial payment:

| Field | Value |
|---|---|
| Final Payment ID | `TX-PAY-1787169978251-h2nf` |
| Amount | 1632.96 |
| Journal | `JE-1787169978253` |
| Idempotency scope | `purchase.payment` |

## 12. Reversal Baseline

| Entity | Count before reversal |
|---|---:|
| purchase_orders | 6 |
| cash_transactions | 2 |
| journal_entries | 8 |
| journal_lines | 22 |
| audit_logs | 52 |
| idempotency_requests | 8 |
| assets | 6 |
| asset_barcode_history | 6 |
| asset_rfid_assignments | 2 |
| inventory_asset_movements | 6 |
| asset_purchase_cost_revisions | 6 |
| asset_current_valuations | 6 |
| target reversal rows | 0 |

PO total, Tax Snapshot, Purchase Journal, posted AP, and outstanding were captured before mutation.

## 13. Reversal Runtime

The canonical endpoint was called once with reason `FINAL-RUNTIME-SUPPLIER-PAYMENT-REVERSAL` and a fresh idempotency key.

Result: HTTP 201.

Created reversal:

- CashTransaction: `TX-REV-PAY-1787170684571-9wkt`
- amount: `1632.9600`
- type/category: `cash_in / supplier_payment_reversal`
- journal: `JE-1787170684574`
- original payment preserved

`PAYMENT_REVERSAL_RUNTIME = PASS`

## 14. Reversal Journal

Read-only DB proof:

| Field | Value |
|---|---:|
| Reversal journal | `JE-1787170684574` |
| `reversal_of` | `JE-1787169978253` |
| Debit | 1632.96000000 |
| Credit | 1632.96000000 |
| Journal lines | 2 |

Accounting direction was Dr Cash/Bank and Cr Supplier Payable using mapped accounts.

`PAYMENT_REVERSAL_JOURNAL = PASS`

## 15. Outstanding Reopen

After reversal:

`2132.96 posted AP - 500.00 effective payment = 1632.96 outstanding`

The API returned `paid=500`, `remainingAmount=1632.96`, `paymentStatus=partial`.

`PAYMENT_REVERSAL_REOPENS_OUTSTANDING = PASS`

`NO_MICRO_RESIDUAL_AFTER_REVERSAL = PASS`

## 16. Replay / Conflict

| Operation | Status | Result |
|---|---:|---|
| Same reversal key + same payload | 201 | same canonical result, no duplicate reversal/journal |
| Same reversal key + changed reason | 409 | stable conflict, no mutation |
| Fresh-key double reversal | 409 | stable rejection, no mutation |

`PAYMENT_REVERSAL_IDEMPOTENCY_REPLAY = PASS`

`PAYMENT_REVERSAL_IDEMPOTENCY_CONFLICT = PASS`

`DOUBLE_REVERSAL_SAFETY = PASS`

## 17. Double-Reversal Protection

The second reversal attempt found the existing journal linked by `reversalOf` and rejected with HTTP 409. Reversal count remained one and no extra idempotency success was stored.

## 18. Supplier Balance / Statement

Supplier statement GET returned HTTP 200 after reversal. Browser and API evidence showed the PO credit, partial payment debit, final payment debit, reversal credit, and current outstanding `1632.96`.

`SUPPLIER_BALANCE_RUNTIME = PASS`

`SUPPLIER_STATEMENT = PASS_CURRENT_SCOPE`

`SUPPLIER_BALANCE_RECONCILIATION = PASS`

`Supplier.due` remained reference-only.

## 19. AP Reconciliation

`2132.96 - 500.00 = 1632.96`

`TARGET_PO_AP_RECONCILIATION = PASS`

The historical global GL defect remains preserved and is not claimed clean.

## 20. Audit

Committed reversal audit evidence included:

- action `supplier.payment.reversal`;
- PO `PO-1787094119240`;
- supplier `SUP-001`;
- original payment ID;
- reversal payment ID;
- amount `1632.96`;
- actor and timestamp;
- reason `FINAL-RUNTIME-SUPPLIER-PAYMENT-REVERSAL`;
- before/after outstanding values.

`PAYMENT_AUDIT = PASS`

## 21. Scope / Permissions

Focused tests passed the server-side guards for:

- company ownership on PO/payment lookup;
- authorized branch resolution;
- `treasury.update` business permission;
- original payment company scope;
- reversal row locking and existing-reversal protection.

No additional company or branch was created in Local Main.

`PAYMENT_COMPANY_SCOPE = PASS_FOCUSED_SOURCE_GUARD`

`PAYMENT_BRANCH_SCOPE = PASS_FOCUSED_SOURCE_GUARD`

`PAYMENT_PERMISSIONS = PASS_FOCUSED_SOURCE_GUARD`

## 22. Concurrency

The focused isolated source proof passed for the concurrency controls: idempotency claim, PO/payment row locks, and existing reversal lookup under transaction. No uncontrolled concurrent writes were sent to Local Main. The prior payment concurrency requirement is covered by the same source-level lock/idempotency guard proof; no new payment was created.

`PAYMENT_CONCURRENCY_SAFETY = PASS_FOCUSED_LOCK_IDEMPOTENCY_PROOF`

`PAYMENT_REVERSAL_CONCURRENCY_SAFETY = PASS_FOCUSED_LOCK_IDEMPOTENCY_PROOF`

## 23. Purchase / Inventory Isolation

Final reversal-only counts:

| Domain | Delta from reversal baseline |
|---|---:|
| PO count/total | 0 |
| Tax Snapshot | 0 |
| Purchase Journal | 0 |
| Assets | 0 |
| Barcode History | 0 |
| RFID | 0 |
| Inventory Movements | 0 |
| Purchase Cost Revisions | 0 |
| Current Valuations | 0 |
| New unrelated payment | 0 |
| Reversal evidence | +1 |
| Reversal journal | +1 |

`PURCHASE_HISTORY_IMMUTABLE_AFTER_PAYMENT = PASS`

## 24. AR / EN

Read-only browser verification:

| Page | Result |
|---|---|
| `/ar/suppliers/SUP-001` | supplier and statement loaded; reversal state visible |
| `/en/suppliers/SUP-001` | POs & Receipts and statement loaded; Reverse action visible |
| Outstanding | 1632.96 visible in statement |
| Hard-delete action | absent |
| Receive workflow | not present/used |
| Console errors/warnings | 0 in both inspected tabs |

`AR_UI = PASS`

`EN_UI = PASS`

`CONSOLE = PASS`

## 25. Network / Console

| Request | Status |
|---|---:|
| Reversal POST | 201 |
| Reversal replay | 201 |
| Reversal conflict | 409 |
| Double-reversal reject | 409 |
| Supplier Statement GET | 200 |
| Supplier PO state GET | 200 |
| Health / DB / Redis | 200 / 200 / 200 |

`NETWORK = PASS`

No secrets were included in this report.

## 26. Final DB Reconciliation

| Entity | Before | After | Allowed delta |
|---|---:|---:|---:|
| purchase_orders | 6 | 6 | 0 |
| cash_transactions | 2 | 3 | +1 reversal |
| journal_entries | 8 | 9 | +1 reversal |
| journal_lines | 22 | 24 | +2 reversal lines |
| audit_logs | 52 | 53 | +1 reversal audit |
| idempotency_requests | 8 | 9 | +1 reversal success |
| assets | 6 | 6 | 0 |
| asset_barcode_history | 6 | 6 | 0 |
| asset_rfid_assignments | 2 | 2 | 0 |
| inventory_asset_movements | 6 | 6 | 0 |
| asset_purchase_cost_revisions | 6 | 6 | 0 |
| asset_current_valuations | 6 | 6 | 0 |

Replay, conflict, and double-reversal attempts produced no additional allowed or forbidden rows.

## 27. Integrity Queries

Current-path checks were zero/pass:

- reversal without original payment: zero;
- duplicate effective reversal: zero;
- reversal journal missing: zero;
- unbalanced reversal journal: zero;
- reversed payment still counted as effective: zero;
- statement/balance mismatch: zero;
- negative outstanding: zero;
- micro residual: zero;
- payment/reversal affecting Asset/Barcode/RFID/Inventory: zero.

## 28. Historical Defect Boundary

`HISTORICAL_UNBALANCED_JOURNAL = JE-1787090870905`

`HISTORICAL_DEFECT_ACTION = PRESERVED_NO_REWRITE`

No historical journal was edited, deleted, or used as current-path evidence.

## 29. Gate

All required reversal-only criteria passed. The database is left in the approved non-destructive preferred state: partial payment effective, final payment reversed, outstanding positive, and all payment/reversal history retained.

`GATE = PASS_SUPPLIER_ACCOUNTS_AND_PAYMENTS_FINAL_CLOSURE`

`SUPPLIER_ACCOUNTS_FINAL_CLOSED = YES`

## 30. Final Tokens

```text
CURRENT_CONTROL = DARFUS-SUPPLIER-PAYMENT-REVERSAL-FIX-RUNTIME
LOCAL_MAIN_DB = darfus_erp

PAYMENT_TEST_SUPPLIER_ID = SUP-001
PAYMENT_TEST_PO_ID = PO-1787094119240
PAYMENT_TEST_POSTED_AP_2DP = 2132.96

FINAL_PAYMENT_ID = TX-PAY-1787169978251-h2nf
FINAL_PAYMENT_AMOUNT = 1632.96
FINAL_PAYMENT_JOURNAL_ID = JE-1787169978253

REVERSAL_CALLER_MINIMUM_FIX = PASS
GLOBAL_POSTING_SERVICE_CONTRACT_CHANGE = NO
REVERSAL_TRANSACTION_ATOMICITY = PASS

FOCUSED_TESTS = PASS
TYPECHECK = PASS

BACKEND_SAFE_RELOAD = PASS
MIGRATION_EXECUTED = NO
SEQUELIZE_META_BEFORE = 86
SEQUELIZE_META_AFTER = 86
NEW_REVERSAL_SOURCE_LOADED = PASS

PAYMENT_REVERSAL_RUNTIME = PASS
PAYMENT_REVERSAL_JOURNAL = PASS
PAYMENT_REVERSAL_REOPENS_OUTSTANDING = PASS
NO_MICRO_RESIDUAL_AFTER_REVERSAL = PASS

PAYMENT_REVERSAL_IDEMPOTENCY_REPLAY = PASS
PAYMENT_REVERSAL_IDEMPOTENCY_CONFLICT = PASS
DOUBLE_REVERSAL_SAFETY = PASS

PAYMENT_CONCURRENCY_SAFETY = PASS_FOCUSED_LOCK_IDEMPOTENCY_PROOF
PAYMENT_REVERSAL_CONCURRENCY_SAFETY = PASS_FOCUSED_LOCK_IDEMPOTENCY_PROOF

PAYMENT_COMPANY_SCOPE = PASS_FOCUSED_SOURCE_GUARD
PAYMENT_BRANCH_SCOPE = PASS_FOCUSED_SOURCE_GUARD
PAYMENT_PERMISSIONS = PASS_FOCUSED_SOURCE_GUARD
PAYMENT_AUDIT = PASS

SUPPLIER_BALANCE_RUNTIME = PASS
SUPPLIER_STATEMENT = PASS_CURRENT_SCOPE
TARGET_PO_AP_RECONCILIATION = PASS
SUPPLIER_BALANCE_RECONCILIATION = PASS

POSTED_PAYMENT_HARD_DELETE = BLOCKED
PURCHASE_HISTORY_IMMUTABLE_AFTER_PAYMENT = PASS

AR_UI = PASS
EN_UI = PASS
NETWORK = PASS
CONSOLE = PASS

PO_COUNT_DELTA = 0
ASSET_COUNT_DELTA = 0
BARCODE_HISTORY_DELTA = 0
RFID_DELTA = 0
INVENTORY_MOVEMENT_DELTA = 0
PURCHASE_COST_REVISION_DELTA = 0
CURRENT_VALUATION_MUTATION_DELTA = 0

HISTORICAL_UNBALANCED_JOURNAL = JE-1787090870905
HISTORICAL_DEFECT_ACTION = PRESERVED_NO_REWRITE

MIGRATION_CREATED = NO
ONLINE_PRODUCTION_CONTACTED = NO

GATE = PASS_SUPPLIER_ACCOUNTS_AND_PAYMENTS_FINAL_CLOSURE
SUPPLIER_ACCOUNTS_FINAL_CLOSED = YES
NEXT_RECOMMENDED_STEP = UNIFIED_INVENTORY_UX_FINAL_CLOSURE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP.
