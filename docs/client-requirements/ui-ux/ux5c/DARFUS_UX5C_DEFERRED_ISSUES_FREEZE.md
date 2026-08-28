# DARFUS ERP — UX5C Deferred Issues Freeze

| Issue | Status | UX5C result |
|---|---|---|
| Light Mode Sidebar height | Deferred for separate investigation | Untouched |
| Gift Voucher active state vs Empty Cart | Deferred for separate investigation | Untouched |

Required safety tokens:

```text
SIDEBAR_HEIGHT_ISSUE = DEFERRED
SIDEBAR_HEIGHT_ISSUE_TOUCHED = NO
GIFT_VOUCHER_STATE_INVESTIGATION = DEFERRED
GIFT_VOUCHER_STATE_ISSUE_TOUCHED = NO
GIFT_VOUCHER_COMPONENT_CHANGE = NO
```

No UX5C correction authorizes changing `GiftVoucherPaymentSection.tsx`, voucher
state, validation/reset behavior, or shell/sidebar height/background behavior.
