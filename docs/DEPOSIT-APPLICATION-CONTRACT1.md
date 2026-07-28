# DEPOSIT-APPLICATION-CONTRACT1 — Owner-approved v1.0.0 policy

## Decision

**Option A is final for v1.0.0:** a reservation may receive multiple bounded
deposit receipts and may receive bounded partial refunds before sale completion.
There is **no standalone pre-sale deposit application**, no allocation to an
existing invoice/AR target, and no multi-invoice allocation. The remaining
deposit is applied only by the existing `complete-sale` transaction.

## Authority and scope

All deposit financial configuration is branch-scoped; there is no company-level
financial fallback. The authoritative scope is the reservation company and
branch plus authenticated company context and verified Employee branch context.
Clients may provide business amount, channel, reference/notes, reason, and an
idempotency key only. They must never select company, branch, treasury,
liability/GL account, bank account, CashRegister, or cash session. Branchless
legacy reservations are manual-review and non-operational.

## Authoritative application path and lifecycle

`complete-sale` is the sole application path. It requires the current completion
threshold, creates the final invoice once, performs normal sales posting
(revenue, VAT, COGS, inventory) once, clears Reservation Advance liability once,
and writes `ReservationPaymentApplication` rows linked to required
`finalInvoiceId`. No pre-sale application or existing-sale/AR allocation route
exists in v1.0.0.

1. Configure the branch liability, cash treasury, and permitted non-cash maps.
2. Create the branch-scoped reservation and collect one or more receipts:
   **Dr authoritative branch treasury / Cr branch Reservation Advance liability**.
3. Before completion, run one or more bounded refunds:
   **Dr branch Reservation Advance liability / Cr authoritative branch treasury**.
4. Do not apply a deposit before completion.
5. At `complete-sale`, create the final invoice and normal sale entries once,
   then apply remaining net deposit once: **Dr Reservation Advance liability /
   Cr sale receivable or settlement account** according to the existing sale
   contract. Link application rows to the final invoice.
6. Completion is replay-safe or safely rejected; refund execution and completion
   are serialized so only one can consume the same balance.

No flow converts a reservation deposit to Customer Credit without a future,
separately approved policy.

## Formula and fail-closed rules

```
net_deposit_balance = total_received - total_executed_refunds
refundable_balance  = total_received - total_executed_refunds

applicable_deposit     = net_deposit_balance
remaining_customer_due = final_sale_total - applicable_deposit
                         - other authorized settlement already applied
```

Balances cannot be negative. Receipts fail closed above the allowed reservation
amount because no v1.0.0 overpayment policy exists. Refunds cannot exceed the
refundable balance. There is no standalone applied balance, no application row
without a final invoice, and no double liability clearing.

## State, authorization, and rollback

| State | Permitted transition | Guard | Posting |
| --- | --- | --- | --- |
| RESERVED / PARTIALLY_PAID | bounded receipt | verified Employee, exact branch/company, mapping/session, idempotency | receipt only |
| FULLY_PAID | complete sale or cancellation/refund | serialized lock | settlement or refund |
| CANCELLED_PENDING_REFUND / REFUND_REQUESTED | request, approve, reject, execute refund | bounded approved workflow | execution only |
| PARTIALLY_REFUNDED | further bounded refund or valid completion | remaining balance | refund or completion |
| FULLY_REFUNDED / CANCELLED_REFUNDED / COMPLETED_SALE | none | terminal | none |
| MANUAL_REVIEW | none in v1.0.0 | branchless legacy | none |

Direct deny overrides grants. Every mutation transactionally revalidates scope;
cash, journal, audit, mapping/session, or idempotency failure rolls back. Receipt,
refund, or application on branchless records; over-refund; pre-sale application;
and Customer Credit conversion are forbidden.

## API and UI contract

Receipt accepts amount, business channel, allowed reference/notes, and
idempotency key. Refund request accepts amount, refund channel, reason, and key.
`complete-sale` remains the only application endpoint and derives applicable
deposit server-side. Same-key/same-normalized-payload replay returns prior
result; conflicting replay fails.

UI displays reservation total, deposit received, refunded total, refundable
balance, remaining due, status, and **"العربون يُطبّق عند إتمام البيع" / "The
deposit is applied at sale completion."** It offers receipt, bounded refund
workflow, and current-condition completion. It never displays a standalone apply
action, raw GL/treasury input, or arbitrary branch/register/session authority.

## Acceptance and deferred work

Acceptance must prove multiple receipts, overpayment refusal, bounded/repeated
refunds, replay/conflict, branch-only mappings/no fallback, session enforcement,
Employee/direct-deny and cross-scope controls, completion after receipts/refunds,
exactly-once sale/settlement and final-invoice-linked applications, race
serialization, Customer Credit separation, legacy refusal, zero fixture residue,
and full regression.

**Standalone partial application before complete-sale is not a v1.0.0
requirement.** Defer standalone application, pre-sale application service,
existing-sale/AR allocation model, and multi-invoice allocation. `DEPOSIT-1-FIX-
CONT3` may complete the preserved implementation without adding those features.
