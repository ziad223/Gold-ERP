# POS Gift Voucher Visual Design Contract

- Gift Voucher remains a payment settlement component, never a discount.
- One shared component and one parent-owned state remain authoritative.
- Supported Cash/Card/Transfer/Split composition is unchanged semantically.
- Installment and Deposit remain visible but disabled with a clear explanation;
  no backend capability is added.
- Desktop uses a dominant input and practical fixed-width Validate action.
- Narrow layout stacks the controls through the existing responsive breakpoint.
- Voucher codes remain LTR-safe inside both AR and EN.
- Focus uses the existing `input-base` and Button focus tokens; typed text must
  remain readable and the caret visible.
- No global CSS, backend, tax, accounting, inventory, settings, migration, or
  official Voucher state changes are allowed.

`UX_SCOPE = GIFT_VOUCHER_PAYMENT_SECTION_AND_IMMEDIATE_PAYMENT_PANEL_ALIGNMENT_ONLY`

