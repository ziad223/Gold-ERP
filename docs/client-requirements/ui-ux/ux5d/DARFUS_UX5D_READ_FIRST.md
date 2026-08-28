# DARFUS UX-5D — Read-First Record

- Control: `DARFUS-UIUX-UX5D-GIFT-VOUCHER-VISUAL-CLARITY-ONLY`
- Mode: minimum safe presentation-only implementation.
- Read completely before edit: UX-5D instruction, `AGENTS.md`, project handoff, UX5/UX5C reports, Gift Voucher closeout/registers, UX4 contracts, UX2 tokens, POS source and `GiftVoucherPaymentSection`.
- Frozen: Gift Voucher business logic, state machine, calculations, API, DB, payment, checkout, accounting, tax, inventory, permissions and routes.
- Result: only `GiftVoucherPaymentSection.tsx` presentation classes/text hierarchy were changed; public props, handlers, values, guards and API callers were preserved.

## Boundary

`GiftVoucherPaymentSection` is a presentation consumer of the existing POS authority. No new state, calculation, request, route, master data, or business event was introduced.

