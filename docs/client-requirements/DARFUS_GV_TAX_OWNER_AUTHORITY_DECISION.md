# Gift Voucher Tax Owner Authority Decision

Owner decision applied by Control 01:

```text
COMPANY_TAX_POLICY_AUTHORITY = COMPANY_CONFIGURED_TAX_CENTER_SETTING
CURRENT_COMPANY_VAT_RATE = 14%
TAX_RATE_IS_CONFIGURABLE_PER_COMPANY = YES
TAX_CHANGE_ALLOWED_BY_BUSINESS_POLICY = YES
TAX_RATE_AUTHORITY = RESOLVED_BY_OWNER_POLICY
CURRENT_RUNTIME_VAT_AUTHORITY = COMPANY_CONFIGURED_14_PERCENT
TAX_CHANGED = NO
TAX_BLOCKER = CLOSED
```

The Tax Engine legal/reference metadata `5%` remains unchanged and is not runtime authority for this company. No Tax setting or Tax code was modified.

Read-only runtime calculation using the company policy produced: base `2838.44`, effective rate `14%`, VAT `397.38`, total `3235.82`, rounding scale `2`.

`TAX_RUNTIME_MATCHES_COMPANY_CONFIG = PASS`.
`TAX_RATE_AUTHORITY_VERIFY_001 = CLOSED_BY_OWNER_POLICY`.

