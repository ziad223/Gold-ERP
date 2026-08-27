# D2F Gate A — Gift Voucher Projection Contract

## Intended contract

Gift Voucher could be exposed only as:

gift_vouchers canonical source
→ read-only adapter
→ D1/D2 normalized projection
→ search/detail/print

That contract is not activated in this control.

## Proven source fields

| Projection concern | Candidate source | Proven? |
|---|---|---|
| sourceId | gift_vouchers.id | YES |
| displayNumber | gift_vouchers.code | NO — uniqueness is not proven |
| customer | customer_id/customer_name | PARTIAL |
| value | value | YES as stored DECIMAL, business meaning across lifecycle not fully proven |
| balance | balance | YES as stored DECIMAL, redemption semantics not fully proven |
| status | status enum | YES as stored enum, transition/event authority not proven |
| issue date | issue_date | YES |
| expiry | expiry_date | YES |
| branch | branch text | NO — no branch authority/FK |
| currency | none | NO |
| tax | none | NO |
| payment | payment_method only | NO |
| accounting/liability | no source link; disabled routes; unused posting helpers | NO |
| print audit | none proven | NO |

## No-activation rule

The D2 registry remains:

gift_voucher = SUPPORTED_LATER
adapter = null
canViewDetail = false
canPrint = false

Other future sources purchase_order and repair remain unchanged. No generic Invoice row is created, no financial field is copied from Sales, and no tax behavior is inherited from Sales.

GIFT_VOUCHER_ADAPTER_ACTIVE = NO
DUPLICATE_AUTHORITY = NO
GIFT_VOUCHER_FINANCIAL_RECALCULATION = NOT_RUN
GIFT_VOUCHER_TAX_RECALCULATION = NOT_RUN
GIFT_VOUCHER_ACCOUNTING_WRITE = 0

