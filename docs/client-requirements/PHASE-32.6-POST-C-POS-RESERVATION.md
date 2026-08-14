# Phase 32.6-Post-C — POS Reservation Deposit & Accounting Configuration

## Scope

Connected the POS `Deposit / عربون` action, mandatory reservation initial payment, and the
Reservation Advances Account configuration into one operable workflow on top of Fix A/B/C.

- The Reservation Advances Account is now configurable from the Accounting Settings UI.
- Every **manually created** reservation must start with an initial payment greater than zero.
- Later reservation payments remain **unlimited and unscheduled** (no installment schedule).
- The POS Deposit action creates a reservation via the dedicated reservation API — never a sales
  invoice.
- Internal Fix C renewal/successor creation is unchanged (funded by advance transfer, not a manual
  cash payment).

## Approved Business Rule

A manually created reservation requires: a customer, one or more items, an expiry date/time, an
**initial payment > 0** (and ≤ reservation total), a payment method, and a configured Reservation
Advances Account. A reservation with zero/missing initial payment is rejected by the backend
(frontend validation is supplemental).

After creation, later payments are unlimited, unscheduled, and may differ in amount and timing;
each creates its own receipt and journal, the backend recalculates the remaining balance, and a
payment above the remaining balance is rejected. No installment schedule, due-date table, or
recurrence is introduced.

The mandatory-initial-payment rule applies only to the public manual creation path
(`createReservation`). Internal renewal successors are created directly via `Reservation.create`
and funded by the Fix C advance transfer, so they are unaffected. There is no client-controlled
bypass flag.

## Accounting Configuration

- Setting key: `reservationAdvancesAccountId` (existing key; stores an Account ID only).
- Settings UI: Accounting section of System Settings — a selector labelled
  «حساب دفعات مقدمة من العملاء – حجوزات» / "Reservation Advances Account" that lists only **active,
  credit-nature liability** accounts. The backend re-validates the selection on save and on every
  posting.
- Backend validation (`getReservationAdvancesAccount`) requires the account to exist, be active,
  belong to the company, and be a credit-nature liability account. Errors are stable-coded and
  bilingual: `RESERVATION_ADVANCES_ACCOUNT_NOT_CONFIGURED` and
  `RESERVATION_ADVANCES_ACCOUNT_INVALID` (HTTP 422). No account code is hardcoded and there is no
  silent fallback.

## Accounting

Initial and later reservation payments post **Dr selected Cash/Bank / Cr configured Reservation
Advances** only. Before final sale, no sales revenue, VAT output, Accounts Receivable, COGS, or
inventory-sale movement is posted; the unpaid balance is operational, not AR.

## POS Reservation Mode

Selecting `Deposit / عربون` in POS enters reservation mode: the confirm handler opens the
reservation deposit dialog and **returns before** any invoice/sale posting. The dialog shows the
customer, cart items, reservation total, a mandatory initial-payment input, a remaining-after-
payment preview, payment method, a required future expiry (date & time), and notes, and requires a
configured advances account. The confirm button reads «إنشاء الحجز وتسجيل الدفعة الأولى» /
"Create Reservation and Record Initial Payment". Submission builds the reservation payload from the
cart (customer, branch, asset ids, expiry, initial payment, idempotency key) — submitting **no**
trusted totals, VAT, journal lines, or advances account — and calls `POST /reservations`. On
success the cart clears, a success summary shows the reservation number/paid/remaining/expiry with
a link to Reservations, and no sales invoice or sales/VAT/AR/COGS/inventory posting occurs.

When the advances account is not configured, POS reservation confirmation is disabled with a clear
bilingual warning (and a settings link for authorized users); the normal sale path stays available.

## Regular Reservation Page

The Reservations management create dialog enforces the same rules: mandatory initial payment > 0
(and ≤ total), a payment-method selector, a configuration warning, and a disabled confirm when the
advances account is missing. Both entry points use the same backend route and rules.

## Error Handling

Backend validation returns stable error codes with bilingual (Arabic | English) messages:
`RESERVATION_INITIAL_PAYMENT_REQUIRED`, `RESERVATION_PAYMENT_METHOD_REQUIRED`,
`RESERVATION_ADVANCES_ACCOUNT_NOT_CONFIGURED`, `RESERVATION_ADVANCES_ACCOUNT_INVALID`, plus the
existing asset/idempotency conflicts. Frontends surface the message directly.

## Migration

No migration was required — the generic settings storage and existing reservation schema already
support the feature. No account was seeded, defaulted, or hardcoded.

## Verification

- Static: `scripts/verify-pos-reservation-deposit-configuration.js` (settings/backend/POS/
  reservation-page/error/docs contracts + scope guard). Prints `STATIC ONLY — LIVE DATA NOT
  VERIFIED` when ungated.
- Live (gated by `VERIFY_POS_RESERVATION_LIVE=true` + `VERIFY_DATABASE_NAME=darfus_erp`, local
  `darfus_erp@localhost:5433`): reads and restores the prior advances setting; verifies missing/
  invalid account rejection, missing/zero/negative/over-total/missing-method initial-payment
  rejection, valid multi-item atomic creation, Dr Cash/Cr Advances posting with no sales/VAT/AR/
  COGS/inventory or invoice, partial/fully-paid status, idempotency, rollback, unlimited later
  payments, overpayment rejection, and intact internal renewal. Cleans only its namespace and
  restores the setting exactly — printing **LIVE TESTS EXECUTED** and **No persistent test
  pollution detected**.
- Browser/POS smoke: driven via the API/live verifier and static frontend contract assertions
  (headless browser automation of the POS was not run in this environment; this is stated honestly
  rather than claimed).

## Deferred Scope (Fix D)

Fixed installment schedules, full reservation permission matrix, reports, customer-statement
reservation section, notification workflows, full UI redesign, and mobile reservation flow remain
deferred.

Next phase: **Phase 32.6-Fix D — Permissions, Audit, Notifications, Reports & Full UI**.
