# POS Gift Voucher Payment UI — Design Contract

## Frozen semantics

- Gift Voucher is a `PAYMENT_SETTLEMENT_COMPONENT`, never a discount.
- The existing server Gift Voucher validation endpoint is reused once per
  validation action; no parallel validator is created.
- A validated Voucher keeps its full server-provided face value. Applied value
  is display-only and is never editable.
- Cash/Card/Transfer with a validated Voucher are represented to the existing
  server as one canonical split settlement: ordinary remainder plus the Voucher
  leg. The selected UI method remains the ordinary remainder method.
- Split continues to use the existing split allocation authority.
- Installment and Deposit plus Voucher are not supported by the current server
  contract and are blocked in the UI rather than faked.
- Switching payment mode does not duplicate or silently clear the shared
  Voucher state. Unsupported combinations fail closed at checkout.

## UX contract

The payment panel has one reusable Gift Voucher section outside the Split-only
layout. It owns presentation for code entry, validation, loading, success/error
state, removal before checkout, and remaining due. The parent POS page continues
to own the canonical state and checkout payload construction.

The code input is full-width, LTR-safe in both locales, keyboard-focusable, and
uses the existing input/button focus tokens. AR remains RTL for the panel while
Voucher codes remain readable LTR. EN remains LTR.

## Non-goals

No Voucher issue, activation, redemption, checkout, print, tax, accounting,
treasury, inventory, backend, migration, schema, or settings change.
