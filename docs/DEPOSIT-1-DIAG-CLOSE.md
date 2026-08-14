# DEPOSIT-1-DIAG-CLOSE — Reservation Deposit / Araboon Diagnosis

**Completed:** 2026-07-21 (local, read-only diagnosis)
**Repository:** `H:\WORK\jewellery-erp-master` / `main`
**Starting checkpoint:** `bb664ed4ecf1b6037a6a337f4ab06286f4e23226`
**Decision:** **A. DEPOSIT DIAGNOSIS COMPLETE — READY FOR TARGETED FIX**

## Scope and safety

This phase made no Product, verifier, migration, permission, configuration, data,
backup, service, remote, staging, or Production change. Source inspection and
SELECT-only queries used the resolved development target `::1:5432/darfus_erp`.
No fixture was inserted because the missing configuration/session states and the
financial-authority defects are directly provable without a write.

## Current architecture and concept map

| Concept | Current implementation | Storage / accounting | Status |
| --- | --- | --- | --- |
| Reservation deposit / Araboon | Reservation initial/later `ReservationPayment` | `reservations`, `reservation_payments`, reservation journal source | Separate business subledger, but financially coupled as below. |
| Reservation sale application | `ReservationPaymentApplication` during `completeSale` | application rows, invoice, settlement journal | Full-payment-only; no partial application. |
| Reservation refund | Requested/approved/executed `ReservationRefund` | refund/allocation rows, refund journal, `CashTransaction` | Client treasury authority and session controls are defective. |
| Customer Credit | `CustomerCreditTransaction` deposit/refund endpoints | customer-credit rows, cash transaction, GL bridge | Separate table and customer balance; uses the same protected liability role. |
| Invoice/POS deposit | invoice deposit posting | invoices / `postDepositEntry` / account `2300` | Separate legacy/invoice path. |

The reservation service never creates a `CustomerCreditTransaction`; its receipt
correctly avoids VAT, revenue, AR, COGS, and inventory. It does, however, resolve
the same `CUSTOMER_DEPOSIT_LIABILITY` role used by customer-credit routes.
Consequently the models are **PARTIALLY_COUPLED**: source documents are distinct,
but the required Reservation Advance liability cannot be independently configured
or reported from Customer Credit.

## Current call graphs

### Receipt

POS/reservation UI supplies customer, asset/item, amount and `paymentMethod` →
`POST /reservations` or `POST /reservations/:id/payments` → `authMiddleware` +
`requireAnyBusinessPermission` → `reservation.service` transaction → active
branch/customer/assets and server-resolved liability role → `ReservationPayment`
→ `postReservationPaymentEntry` → audit/notification/response.

Branch and liability are server-scoped, and idempotency is transaction-backed.
But `treasuryAccountCode(paymentMethod)` converts a client method directly to
hard-coded `1110`/`1120`; no authoritative branch treasury mapping, CashRegister
check, CashTransaction receipt row, or register session lock is used.

### Application to final sale

`POST /reservations/:id/complete-sale` → branch/resource locks → requires exactly
`paid == agreedTotal` → creates posted sale invoice/items and inventory changes →
normal invoice posting → `postReservationAdvanceSettlementEntry` (Dr advances,
Cr 1300) → one application per payment → completed reservation. Idempotency and
the payment-application unique index prevent duplicate full settlement. There is
no supported partial sale application or remaining-advance state.

### Cancellation and refund

Cancellation locks the reservation, releases assets, and changes a paid
reservation to `cancelled_refund_pending`; it does not move money. Refund request
requires all posted payments to be refunded in full, stores a method-derived
`treasuryAccountCode`, and creates one open refund. Approval, rejection, and
execution use generic permission middleware. Execution locks refund/reservation/
payments, posts Dr advances/Cr treasury, creates a cash-out row and allocations,
then marks payments/refund/reservation final in one transaction.

The execution body takes precedence: `body.treasuryAccountCode ||
refund.treasuryAccountCode || ...`; the same defect exists in renewal-excess
refund execution. The UI explicitly prompts for `1110/1120` and sends that raw
value. No open cash register is checked or locked.

## Read-only database evidence

- 48 migrations; 128 permissions; role grant counts: Admin 128, Owner 128,
  Manager 114, Accountant 30, Sales 27.
- Five active branches; zero `system_account_roles`, including zero
  `CUSTOMER_DEPOSIT_LIABILITY`; zero cash-register sessions/open sessions.
- One branchless legacy reservation; zero reservation payments, refunds,
  applications, reservation journals, reservation cash transactions, reservation
  idempotency rows, and customer-credit rows.
- Uniqueness is present for branch role mappings, one open cash register,
  payment idempotency/receipt number, one payment application, open/executed
  refund, and central idempotency `(company, scope, key)`.

The absent mapping/session state is a **MISSING_REQUIRED_CONFIGURATION** blocking
normal current reservation posting, not proof of historic financial corruption.

## Findings

| ID | Severity | Classification | Summary | Fix boundary |
| --- | --- | --- | --- | --- |
| DEPOSIT-F001 | P1 | PRODUCT_DEFECT / FINANCIAL_AUTHORITY | Standard and renewal-excess refund execution accept client `treasuryAccountCode`; UI exposes the raw selector. | Remove raw account authority and derive from trusted branch/session/method configuration. |
| DEPOSIT-F002 | P1 | PRODUCT_DEFECT / FINANCIAL_AUTHORITY | Receipt uses hard-coded `1110`/`1120` from client payment method. | Introduce server-resolved branch treasury authority for cash/bank methods. |
| DEPOSIT-F003 | P1 | PRODUCT_DEFECT / CASHREGISTER | Receipt does not create a cash transaction or enforce a register; refund creates cash transaction without enforcing/locking an open register. | Require/revalidate current cash session for cash and record linked movement atomically; define bank path. |
| DEPOSIT-F004 | P1 | PRODUCT_DEFECT / ACCOUNTING | Reservation advances and Customer Credit share `CUSTOMER_DEPOSIT_LIABILITY`; invoice deposits retain another path. | Add an explicit reservation-advance accounting role/source contract; preserve Customer Credit and invoice-deposit distinctions. |
| DEPOSIT-F005 | P1 | MISSING_REQUIRED_CONFIGURATION | Current local DB has zero mappings and zero sessions. | Fail closed with actionable readiness errors; do not silently bootstrap during posting. |
| DEPOSIT-F006 | P1 | PRODUCT_DEFECT / AUTHORIZATION | Refund approve/reject/execute routes use generic permission middleware; a Branch Account always receives no generic permissions, so verified Employee authority/direct-deny handling is not applied. | Use employee-aware business authorization and fixed operational branch for all financial refund actions. |
| DEPOSIT-F007 | P1 | PRODUCT_DEFECT / STATE_MACHINE | Completion requires exact full payment; request/execute refund requires full refund. Partial application/refund required by the target contract is absent. | Add amount-level available/applied/refunded state and safe partial transitions. |
| DEPOSIT-F008 | P2 | VERIFIER_GAP | 66/66 static/readiness passes, but existing reservation verifiers encode hard-coded treasury and full-refund behavior and do not test session/authority/partial-flow failures. | Add targeted acceptance/verifier coverage only with the Product fix. |
| DEPOSIT-F009 | P2 | IDEMPOTENCY / UX_API_CONTRACT | Receipt/execute are replay-safe; refund request is unique/locked but has no request replay contract. | Define idempotency for every financial command and return safe replay semantics. |

## Required DEPOSIT-1-FIX contract

1. Client may submit business amount, permitted payment/refund method, reason and
idempotency key. It must never submit a GL account code, liability account ID,
branch override for a fixed Branch Account, or arbitrary register/session ID.
2. Server derives authenticated company/effective branch → verified Employee
authorization → active cash session for cash or authorized active bank treasury
mapping for non-cash → reservation-advance liability mapping → account IDs/codes.
Missing, inactive, duplicate, cross-branch, or stale configuration fails closed
before financial writes.
3. Reservation Advance must have a distinct protected accounting role from
Customer Credit and invoice deposits. Each record/journal/cash movement retains
reservation, company, branch, actor, method, server-derived accounts, amount,
currency and idempotency reference.
4. Receipt is one transaction: validate/lock branch, reservation, mapping and
cash session; create payment, cash-in movement, balanced journal, audit and
idempotency result. Cash is Dr authoritative cash / Cr Reservation Advance
liability; bank follows the equivalent authorized bank account. No revenue, VAT,
COGS, inventory, AR, or Customer Credit movement.
5. Application records a bounded amount against available advance and a sale;
it clears liability once and lets normal sale posting recognize revenue/VAT/COGS/
inventory. It rejects over-application and duplicate application.
6. Cancellation retains the unapplied liability. Refund may only allocate the
remaining refundable amount, requires approval policy, and is one transaction:
Dr Reservation Advance liability / Cr authoritative treasury, linked cash-out,
allocations, audit and idempotency. No sale reversal/inventory movement unless a
separate completed-sale workflow authorizes it.
7. Use employee-aware business guards for receive, apply, cancel, refund request,
approval and execution; preserve Super Admin’s explicit technical behavior and
direct-deny precedence. Every resource lookup is company/branch scoped.
8. Forward-only schema changes are permitted only if needed for distinct role,
treasury mapping, session linkage and partial allocation invariants. No legacy
rewrite: branchless/legacy reservations remain non-operational/manual review.

## DEPOSIT-1-ACCEPT minimum matrix

1. Valid configured cash receipt; 2. missing/invalid/duplicate liability mapping;
3. missing/closed/stale cash session; 4. authorized bank path; 5. raw treasury
code ignored/rejected; 6. cross-branch/cross-company tampering rejection; 7.
balanced receipt journal/no premature sale postings; 8. receipt replay; 9.
multiple receipts; 10. partial/full application and over-application denial; 11.
cancel with remaining liability; 12. partial/full refund and over-refund denial;
13. refund replay and refund-after-application denial; 14. apply/refund and
session-close races; 15. transaction rollback leaves no financial residue; 16.
Customer Credit/invoice deposit separation; 17. verified Employee/direct-deny/
Super Admin/branch checks; 18. Arabic/English desktop/mobile UX; 19. reports,
statements and audit references; 20. typecheck/lint/build and full verifier
regression with exact fixture cleanup.

## Validation and next phase

Current source checks passed: 66/66 default static/readiness verifiers,
typecheck, production build, and `git diff --check`; lint passed with the known
18 warnings and zero errors. No Browser/runtime financial test was run because
it would require prohibited fixture/configuration writes and services on 3000/8000
were not reused.

NEXT TOOL START HERE

DEPOSIT-1-FIX — Implement the approved reservation-deposit treasury-authority, configuration, state-machine, CashRegister, idempotency, and GL corrections without expanding into unrelated Product work.

Do not start automatically.
