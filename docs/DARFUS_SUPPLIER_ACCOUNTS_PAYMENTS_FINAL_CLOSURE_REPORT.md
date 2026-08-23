# DARFUS ERP — Supplier Accounts & Payments Final Closure

Control ID: `DARFUS-SUPPLIER-ACCOUNTS-PAYMENTS-FINAL-CLOSURE`  
Batch mode: `READ_ONLY_SUPPLIER_ACCOUNTS_PAYMENTS_FINAL_CLOSURE`  
Audit date: `2026-08-19`  
Official database: `darfus_erp`

## 1. Executive Summary

تم تنفيذ فحص المصدر، قاعدة البيانات الرسمية، والواجهتين العربية والإنجليزية للقراءة فقط. لم يتم إنشاء Supplier أو Receive أو Payment أو Asset أو Journal أو Barcode جديد، ولم تُعدّل قاعدة البيانات الرسمية.

النتيجة الحالية: الأساس البرمجي لمسار سداد أمر شراء موجود، لكنه ليس إغلاقًا نهائيًا مثبتًا. لا توجد أي دفعة مورد حية في `darfus_erp`، لذلك لا يمكن إثبات partial/full/overpayment/replay/conflict أو تسوية AP فعلية في هذا الـBatch. كما توجد فجوة دقة مثبتة بين إجمالي PO ذي 8 منازل عشرية ومسار `CashTransaction` ذي 4 منازل عشرية، إضافة إلى قيد استلام تاريخي غير متوازن محفوظ كما هو.

**Gate:** `BLOCKED_SUPPLIER_PAYMENT_RUNTIME_AUTHORIZATION_REQUIRED`  
**SUPPLIER_ACCOUNTS_FINAL_CLOSED:** `NO`

## 2. Preconditions

| Check | Actual | Evidence | State |
|---|---|---|---|
| Official DB | `darfus_erp` | `SELECT current_database()` داخل حاوية PostgreSQL | PASS |
| Main backend | reachable | `GET http://localhost:8000/api/v1/health` → HTTP 200, `status=UP` | PASS |
| Main frontend | reachable/authenticated | Browser snapshots on `localhost:3000/ar|en/suppliers/SUP-001` | PASS |
| Online production | not touched | No production URL/tool used | PASS |
| New receive/payment | not run | No POST/PUT/PATCH/DELETE issued | PASS |
| Previous accepted receive evidence | reused only | Existing GBP/GBW closure reports and current rows | PASS |

## 3. Implementation Classification

| Area | Classification | Actual evidence | Closure state |
|---|---|---|---|
| Supplier payable source | `PARTIAL` | Received `PurchaseOrder.total` and receive journal exist; no live payment evidence | Not closed |
| Supplier payment workflow | `PARTIAL` | `POST /purchase-orders/:id/pay` and UI modal exist | Not runtime-proven |
| Payment state | `PARTIAL` | Computed from `CashTransaction` references; current payment count is zero | Not closed |
| Allocation | `FOUNDATION_ONLY` | One payment references one PO; no supplier allocation table or multi-PO allocator | Not closed |
| Supplier statement | `PARTIAL` | Read-only source-document statement; `ledgerBased=false` | Not closed |
| Payment reversal/void | `NOT_IMPLEMENTED_FOR_SUPPLIER_PAYMENT` | No supplier-payment-specific reversal/void contract proven | Not closed |
| Audit/idempotency | `IMPLEMENTED_STATICALLY` | Transactional audit/idempotency code exists; no current payment rows/replay proof | Not closed |

## 4. Source Forensic

Primary source locations:

- `backend/src/routes/erp.routes.js:8800` — canonical supplier payment endpoint.
- `backend/src/routes/erp.routes.js:8810` — idempotency scope `purchase.payment`.
- `backend/src/routes/erp.routes.js:8829` — company-scoped PO lock.
- `backend/src/routes/erp.routes.js:8843` — payment amount is `round4`.
- `backend/src/routes/erp.routes.js:8861-8869` — paid sum and PO total are rounded to 4 decimals.
- `backend/src/routes/erp.routes.js:8884` — `CashTransaction` creation.
- `backend/src/routes/erp.routes.js:8902` — journal posting through `postingService.postCashEntry`.
- `backend/src/routes/erp.routes.js:8914` — audit action `supplier.payment`.
- `backend/src/routes/erp.routes.js:8951` — idempotency success persisted before commit.
- `backend/src/services/supplier-payment-state.service.js:6-52` — payable/paid/remaining state from received POs and supplier-payment cash-outs.
- `backend/src/routes/erp.routes.js:13428-13587` — read-only supplier statement from received POs plus payment cash-outs, not GL.
- `backend/src/models/cashTransaction.model.js:36-39` — `amount DECIMAL(15,4)`.
- `backend/src/models/purchaseOrder.model.js:40-46` — ORM still declares `total DECIMAL(15,4)` while the official DB column is `numeric(20,8)`.
- `lib/repositories/api-impl.ts:546-555` — frontend calls the canonical endpoint with an idempotency key.
- `app/[locale]/(dashboard)/suppliers/[id]/page.tsx:73-165,1184-1270` — payment modal and client-side guards; server remains authoritative.

Important authority boundaries proven in source:

1. Payment is separate from receive and does not create an Asset, Barcode, Movement, or PO.
2. Payment is a `cash_out` `CashTransaction` with `category=supplier_purchase` and `reference=PO.id`.
3. `Supplier.due` is never updated; the statement is the computed reference for current payable state.
4. The payment journal is posted by the treasury cash posting service as `source_type=cash_transaction`, not `supplier_payment`.
5. Generic `cash-transactions` mutations are blocked by `GENERIC_TREASURY_MUTATION_FORBIDDEN`; the dedicated payment route is the intended write boundary.

## 5. Supplier Payable Authority

| Concern | Current authority | Evidence | Assessment |
|---|---|---|---|
| Payable creation | Received non-consignment PO | `PurchaseOrder.status=received`, receive journal source `purchase_order` | Present |
| Payable amount | PO `total` | `supplier-payment-state.service.js` | Present, precision boundary unresolved |
| Payment linkage | CashTransaction `reference=PO.id` | payment endpoint and statement route | Present for one PO |
| Supplier master `due` | Reference only | Source comments and UI warning | Not payable authority |
| AP GL account | Branch mapping role `SUPPLIER_PAYABLE` | payment endpoint resolver | Server-backed |

## 6. Supplier Balance / Outstanding

Official DB read-only result for the sole company:

| Supplier | Received non-consignment POs | Gross payable | Paid by supplier cash-outs | Computed outstanding | `Supplier.due` |
|---|---:|---:|---:|---:|---:|
| `SUP-001` / `QA-G2C-SUPPLIER-01` | 6 | 14,508.48001244 | 0 | 14,508.48001244 | 0 |
| `SUP-002` / `QA-SUPPLIER-FINAL-RUNTIME-01` | 0 | 0 | 0 | 0 | 0 |

The Arabic and English supplier screens both display computed closing balance `14,508.48` and explicitly mark `Supplier.due=0` as a legacy/unreliable reference. This is consistent with source behavior, but no payment debit row exists yet.

## 7. Supplier Statement

The statement endpoint is read-only and source-document based:

- Received non-consignment PO = credit.
- Supplier payment cash-out linked through `CashTransaction.reference → PurchaseOrder.id` = debit.
- `meta.ledgerBased=false`, `meta.readOnly=true`, `meta.dueReferenceReliable=false`.
- No dedicated supplier payable subledger table was found.
- No supplier payment allocation table was found; the only similarly named tables are `financial_settlement_allocations` and `reservation_refund_allocations`.

Current browser evidence: 6 purchase-order rows, 0 supplier-payment rows, closing balance AED 14,508.48, reference due AED 0.00, difference -AED 14,508.48.

## 8. Payment Workflow

The implemented route is:

`POST /api/v1/purchase-orders/:id/pay`

Required/validated inputs include positive amount, `cash|bank` account, optional date/reference/note, company-scoped received non-consignment PO, branch treasury mapping, supplier payable mapping, and `Idempotency-Key`.

The UI exposes payment only inside Supplier → POs & Receipts as a modal. No payment was opened or submitted. Supplier Details remains a history/accounts surface; no new receive workflow was used.

## 9. Payment Methods / Account Authority

`normalizeTreasuryAccount` accepts only `cash` or `bank`. The server resolves the actual branch financial mapping through `resolveTreasuryAccount`; the payable side resolves the active `SUPPLIER_PAYABLE` branch mapping. No hardcoded runtime account was used as authority.

## 10. Allocation

Current allocation model is one payment to one PO by free-text `CashTransaction.reference`. This supports repeated partial payments against one PO but does not prove:

- allocation across multiple POs;
- independent allocation rows;
- reallocation or allocation history;
- payment-level supplier subledger ownership.

Classification: `FOUNDATION_ONLY`.

## 11. Partial / Full / Overpayment

Source and existing verifier scripts contain coverage for partial, full, overpayment, already-paid, draft, consignment, invalid amount, and missing idempotency key. Those scripts create and delete temporary database fixtures and were **not executed** because this Batch is read-only and has no mutation approval.

Official DB evidence contains no payment rows, so none of these states is live-proven:

`PARTIAL=NOT_PROVEN`, `FULL=NOT_PROVEN`, `OVERPAYMENT_REJECTION=NOT_PROVEN`, `ZERO_PAYMENT=NOT_PROVEN`, `NEGATIVE_PAYMENT=NOT_PROVEN`, `REFUND/REVERSAL=NOT_PROVEN`.

## 12. Payment Journal

The canonical route creates a cash-out and invokes `postCashEntry`, which posts a balanced journal with:

- debit: mapped supplier payable account;
- credit: mapped cash/bank account;
- source type: `cash_transaction`;
- source id: the cash transaction id.

Current DB: 0 supplier payment cash-outs and 0 payment journals. Therefore journal balance is source-proven but not live-proven.

## 13. AP Reconciliation

Current received PO/AP source totals:

- 6 received POs;
- gross payable `14,508.48001244`;
- supplier payment cash-outs `0`;
- customer `payments` rows `0` (this table is not supplier-payment authority);
- payment idempotency rows `0`;
- supplier payment audit rows `0`.

Existing journal reconciliation is not clean because one historical receive journal remains unbalanced:

`JE-1787090870905` for `PO-1787090870807`: debit `2133.21000000`, credit `2133.22000000`.

Five other receive journals are balanced. This is pre-existing receive evidence, not changed in this Batch, and no correction was attempted.

## 14. Status / Reversal / Delete Protection

The payment route permits only `received` and non-consignment POs and rejects overpayment. Generic treasury mutation routes are blocked. A supplier-payment-specific void/reversal endpoint and immutable payment lifecycle contract were not found. A generic journal reversal route exists, but safe supplier-payment reversal linkage was not proven and was not invoked.

## 15. Idempotency / Concurrency

Static source evidence is positive:

- required idempotency key;
- scope `purchase.payment`;
- request hash includes body and PO params;
- claim occurs inside the same DB transaction;
- PO row is locked with `FOR UPDATE` semantics;
- replay/conflict resolution is implemented;
- success response is stored before commit;
- rollback occurs on any error.

Live evidence is unavailable because `idempotency_requests` has 0 `purchase.payment` rows and runtime mutation is not authorized.

## 16. Company / Branch / Permissions

The endpoint requires `treasury.update`, scopes the PO to `req.companyId`, uses the PO branch (or authorized request branch), and resolves both treasury and payable accounts through branch mappings. Browser context showed Company `Gold ERP` and Branch `Branch-1` in both language surfaces. No cross-company/branch payment mutation was attempted.

## 17. Audit

The route writes `audit_logs.action=supplier.payment` in the same transaction as the cash transaction and journal. Current official DB count for this action is `0`, so audit persistence is source-proven only.

## 18. UI AR/EN

| Surface | Arabic | English | Result |
|---|---|---|---|
| Supplier profile | Loads | Loads | PASS |
| POs & Receipts | 6 rows, each shows سداد | 6 rows, each shows Pay | PASS/read-only |
| Supplier Statement | 6 PO rows, no payments | 6 PO rows, no payments | PASS/read-only |
| Computed balance | AED 14,508.48 | AED 14,508.48 | Matches DB rounded display |
| Legacy due warning | Visible | Visible | Correctly warns `Supplier.due` is not source of truth |
| Payment modal submit | Not opened | Not opened | NOT RUN by authorization boundary |

Browser console read: no error/warn entries on the inspected supplier tab. No mutation request was issued.

## 19. Existing Runtime Evidence

Reused current evidence only:

- Current official DB has six accepted received POs and six receive journals.
- Existing GBP/GBW closure reports document receive-side Asset/Barcode/Movement/Cost/Accounting proof.
- There is no accepted live supplier payment row or accepted payment runtime closure.

## 20. Owner Authorization Boundary

The current Supplier Accounts & Payments prompt did not provide explicit approval to mutate `darfus_erp`. Earlier approvals for other batches are not inferred as payment authorization for this batch.

Required but absent: explicit owner authorization naming the exact payment scenarios and target `darfus_erp`, together with a valid backup/rehearsal/active-write gate if persistent mutation is intended.

## 21. Controlled Runtime Acceptance

`CONTROLLED_PAYMENT_RUNTIME_REQUIRED=YES`.

Not run because it would create persistent payment, journal, cash, audit, and idempotency rows in the official DB. No temporary clone was implicitly created, and no mutation target was approved in this batch.

Required future evidence, in order:

1. explicit owner authorization and exact target;
2. one existing received PO, without creating a new receive;
3. partial payment;
4. same-key replay and changed-request conflict;
5. final payment and overpayment rejection;
6. payment cash transaction, supplier statement debit, payable/cash journal balance, audit and idempotency reconciliation;
7. UI/network/console proof in Arabic and English;
8. AP reconciliation including the 8DP/4DP decision below.

## 22. DB Reconciliation

| Entity/check | Count/value | Expected | Result |
|---|---:|---|---|
| Companies | 1 | Existing company | PASS |
| Suppliers | 2 | Existing master | PASS |
| Received POs | 6 | Existing accepted history | PASS |
| Received non-consignment payable | 14,508.48001244 | Matches source rows | PASS |
| Supplier payment CashTransactions | 0 | Runtime payment required for closure | BLOCKED |
| Customer `payments` rows | 0 | Not supplier authority | NO_ISSUE |
| `purchase.payment` idempotency rows | 0 | Runtime proof required | BLOCKED |
| `supplier.payment` audit rows | 0 | Runtime proof required | BLOCKED |
| Orphan supplier payment references | 0 | 0 | PASS/vacuous |
| Non-positive supplier payments | 0 | 0 | PASS/vacuous |
| Posted supplier payments without journal | 0 | 0 | PASS/vacuous |
| Unbalanced supplier-payment journals | 0 | 0 | PASS/vacuous |

## 23. Purchase History Immutability

No purchase history was changed. The current tax snapshot immutability hooks and accepted receive history remain untouched. No deletion, correction, restore, migration, or backfill was performed.

## 24. Integrity Queries

Read-only integrity checks found no existing supplier payment rows to inspect. The zero results for orphan references, negative/zero payments, missing payment journals, and unbalanced supplier-payment journals are vacuous and must not be represented as live payment acceptance.

## 25. API / Network / Console

| Check | Actual | Classification |
|---|---|---|
| `GET localhost:8000/api/v1/health` | HTTP 200, `status=UP` | PASS |
| `GET /api/v1/db` | HTTP 404 | No registered public endpoint; not used as DB proof |
| `GET /api/v1/redis` | HTTP 404 | No registered public endpoint; not used as Redis proof |
| `GET /api/v1/gold/health` | HTTP 404 | No registered public endpoint; out of supplier-payment scope |
| Supplier profile/PO/statement GETs | Browser loaded in AR/EN | PASS/read-only |
| Payment POST | Not issued | BLOCKED by authorization |
| Browser console | No error/warn entries observed | PASS for inspected read-only journey |

## 26. Focused Tests

Executed without DB mutation:

| Test | Result |
|---|---|
| `tests/supplier-master-final-closure.test.cjs` | 6/6 PASS |
| `tests/asset-final-closure.test.cjs` | 9/9 PASS |
| `tests/barcode-final-closure.test.cjs` | 11/11 PASS |
| `tests/rfid-final-closure.test.cjs` | 17/17 PASS |
| `tests/unified-inventory-intake-ux-02-r3.test.cjs` | 5/5 PASS |
| `backend/tests/supplier-all-asset-profiles-acquisition-payable-pricing-fix-01.test.cjs` | 4/4 PASS |
| `backend/tests/g3-financial-reconciliation-correction.test.cjs` | 3/3 PASS |
| `backend/tests/g3-po-tax-precision-schema.test.cjs` | 2/2 PASS |
| `backend/tests/gold-by-piece-rate-calculation-03-r2.test.cjs` | 5/5 PASS |
| `backend/tests/phase-03b-g2a2-transaction-tax.test.cjs` | 10/10 PASS |
| `backend/tests/phase-03b-g2b-location-management.test.cjs` | 5/5 PASS |
| `npm run typecheck` | PASS |

Not executed: `backend/scripts/verify-supplier-payment.js`, `verify-supplier-purchase-payment-state.js`, `verify-supplier-statement.js`, and `verify-supplier-due-containment.js`, because they create and delete test data and the current Batch is strictly read-only.

## 27. Files Changed

| File | Change |
|---|---|
| `docs/DARFUS_SUPPLIER_ACCOUNTS_PAYMENTS_FINAL_CLOSURE_REPORT.md` | This forensic report only |

Product code files changed: `0`. Test files changed: `0`. Migration/config/database changes: `0`. Official DB writes: `0`.

The repository had pre-existing worktree drift. The recorded pre-audit baseline was 94 tracked modified files, 320 untracked files, and 11 stashes; no cleanup, reset, restore, stash, or build was run. A fresh Git status command was blocked by Git's dubious-ownership safety check and was not bypassed by changing Git configuration.

## 28. Gate

### Confirmed blockers

| ID | Issue | Severity | Classification | Blocks final closure |
|---|---|---|---|---|
| SUPP-PAY-001 | No live supplier payment exists; required partial/full/overpayment/replay/conflict/runtime proof cannot be produced without a mutation authorization | P1 | `ACCEPTANCE_GAP` / `FINANCIAL` | YES |
| SUPP-PAY-002 | Payment amount, `CashTransaction.amount`, and payment state are rounded to 4DP while official PO totals are `numeric(20,8)`; live GBP PO residual is `0.00001278` after 4DP rounding | P1 | `FINANCIAL` / `DESIGN_LIMITATION` | YES until authority decision |
| SUPP-PAY-003 | One pre-existing receive journal is unbalanced: `JE-1787090870905`, debit 2133.21 vs credit 2133.22 | P1 | `FINANCIAL` / `DB_STATE` | AP reconciliation not clean |
| SUPP-PAY-004 | No dedicated supplier payment reversal/void or allocation lifecycle was proven | P2 | `ACCEPTANCE_GAP` / `DESIGN_LIMITATION` | Yes for final lifecycle closure |

### Gate decision

`GATE = BLOCKED_SUPPLIER_PAYMENT_RUNTIME_AUTHORIZATION_REQUIRED`  
`PASS_SOURCE = NO` (source has a partial implementation and unresolved precision/lifecycle boundaries)  
`SUPPLIER_ACCOUNTS_FINAL_CLOSED = NO`

## 29. Final Tokens

```text
CURRENT_BATCH = DARFUS-SUPPLIER-ACCOUNTS-PAYMENTS-FINAL-CLOSURE
MODE = READ_ONLY_SUPPLIER_ACCOUNTS_PAYMENTS_FINAL_CLOSURE
OFFICIAL_DATABASE = darfus_erp
OFFICIAL_DB_WRITES = 0
NEW_RECEIVES = 0
NEW_PAYMENTS = 0
NEW_SUPPLIERS = 0
NEW_ASSETS = 0
NEW_BARCODES = 0
NEW_JOURNALS = 0
MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED = 0

SUPPLIER_ACCOUNTS_IMPLEMENTATION = PARTIAL
SUPPLIER_PAYABLE_IMPLEMENTATION = PARTIAL
SUPPLIER_PAYMENT_IMPLEMENTATION = PARTIAL
PAYMENT_STATE_IMPLEMENTATION = PARTIAL
PAYMENT_ALLOCATION_IMPLEMENTATION = FOUNDATION_ONLY
SUPPLIER_STATEMENT_IMPLEMENTATION = PARTIAL
PAYMENT_JOURNAL_IMPLEMENTATION = STATICALLY_IMPLEMENTED_NOT_RUNTIME_PROVEN
PAYMENT_REVERSAL_IMPLEMENTATION = NOT_IMPLEMENTED_FOR_SUPPLIER_PAYMENT
IDEMPOTENCY_IMPLEMENTATION = STATICALLY_IMPLEMENTED_NOT_RUNTIME_PROVEN

SUPPLIER_COUNT = 2
RECEIVED_PO_COUNT = 6
SUPPLIER_PAYMENT_COUNT = 0
SUPPLIER_PAYMENT_IDEMPOTENCY_COUNT = 0
SUPPLIER_PAYMENT_AUDIT_COUNT = 0
SUPPLIER_PAYABLE_GROSS = 14508.48001244
SUPPLIER_PAYMENT_PAID = 0
SUPPLIER_OUTSTANDING_COMPUTED = 14508.48001244
SUPPLIER_DUE_AUTHORITY = REFERENCE_ONLY
STATEMENT_LEDGER_BASED = NO_SOURCE_DOCUMENTS

PAYMENT_RUNTIME_REQUIRED = YES
OWNER_PAYMENT_RUNTIME_AUTHORIZATION = NOT_PROVIDED
PAYMENT_RUNTIME_EXECUTED = NO
PARTIAL_PAYMENT_PROOF = NOT_RUN
FULL_PAYMENT_PROOF = NOT_RUN
OVERPAYMENT_PROOF = NOT_RUN
PAYMENT_REPLAY_PROOF = NOT_RUN
PAYMENT_CONFLICT_PROOF = NOT_RUN
PAYMENT_JOURNAL_BALANCE_PROOF = NOT_RUN
AP_RECONCILIATION_PROOF = PARTIAL_PREPAYMENT_ONLY
UI_AR_PROOF = READ_ONLY_PASS
UI_EN_PROOF = READ_ONLY_PASS
CONSOLE_ERRORS = 0_OBSERVED

P0_COUNT = 0
P1_COUNT = 3
P2_COUNT = 1
P3_COUNT = 0
P4_COUNT = 0

CONTROLLED_PAYMENT_RUNTIME_REQUIRED = YES
GATE = BLOCKED_SUPPLIER_PAYMENT_RUNTIME_AUTHORIZATION_REQUIRED
SUPPLIER_ACCOUNTS_FINAL_CLOSED = NO
NEXT_RECOMMENDED_STEP = OWNER_DECISION_ON_PAYMENT_RUNTIME_AUTHORIZATION_AND_4DP_VS_8DP_SETTLEMENT_AUTHORITY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Next Step

Owner review is required. If approved later, authorize the exact controlled payment runtime and resolve the 4DP/8DP settlement authority before accepting a final supplier-accounts closure. Do not create a new receive in that follow-up; use an existing accepted received PO. No automatic start.

**STOP.**
