# DARFUS ERP — UX5C Restore Map

Rollback is file-scoped. Preserve unrelated pre-existing worktree changes.

| Scope | Restore source | Reapply source | Verification |
|---|---|---|---|
| POS page | `backups/ui-ux/PRE_UX5C_OWNER_VISUAL_20260828_085333Z/pos-page.tsx` | `backups/ui-ux/UX5C_OWNER_VISUAL_<timestamp>/pos-page.tsx` | SHA-256 exact parity |
| UX5C focused test | Pre-UX5C worktree state | After snapshot copy | Test file hash/contents |
| UX5C evidence | Not part of product rollback | Keep as audit evidence | Files remain preserved |

Protected and never restored by UX5C:

- `components/layout/sidebar.tsx` and shell height rules
- `features/sales/components/GiftVoucherPaymentSection.tsx`
- backend, API, DB, migrations, settings, payment/checkout logic, tax, pricing,
  inventory, accounting, permissions, routes, and barcode code

Rehearsal sequence:

1. Copy UX5C after files into an isolated rehearsal directory.
2. Restore the pre-UX5C POS page copy there.
3. Verify the exact before hash.
4. Reapply the UX5C POS page copy there.
5. Verify the exact after hash.

`UX5C_RESTORE_MAP = COMPLETE`
