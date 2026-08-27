# D2F Gate A — Gift Voucher Authority Map

## Read-first result

The client document was read completely again. Gate A source inspection covered the Gift Voucher model, migration, routes, UI, hook, projection registry, print view model, posting service, permissions/search references, tests, and official DB schema/data.

## Authority findings

| Required authority | Evidence | Result |
|---|---|---|
| Canonical business source | backend/src/models/giftVoucher.model.js -> table gift_vouchers | Source table exists |
| Stable immutable ID | id is primary key; gift_vouchers_pkey is unique | PROVEN |
| Business display number | code is exposed and used by GET /gift-vouchers/:code | Exists, but no unique constraint was proven; only non-unique index |
| Company scope | company_id is NOT NULL and FK to companies | PROVEN |
| Branch scope | only free-text branch column exists; no branch_id/FK/Branch association | AMBIGUOUS |
| Party/recipient | customer_id and customer_name exist; no separate recipient authority | PARTIAL / recipient semantics not proven |
| Currency | no currency column, currency snapshot, or source setting mapping | AMBIGUOUS |
| Face/current value | value and balance are DECIMAL(15,4) | Stored values exist |
| Status/lifecycle | enum active, redeemed, expired | Basic state exists; issue/redemption/expiry event authority not proven |
| Tax | no tax treatment, tax rate, tax snapshot, or tax authority in table/model/routes | AMBIGUOUS |
| Payment | payment_method text exists; payments table has no voucher source column and no voucher payment rows | AMBIGUOUS |
| Liability/accounting | posting.service.js contains unused postVoucherIssueEntry/postVoucherRedeemEntry helpers and account 2400 mapping; no active route, journal row, or source linkage was proven | AMBIGUOUS |
| Audit | no dedicated Voucher audit/print source was found; official gift audit count is 0 | NOT PROVEN |
| Print | frontend generic giftVoucher placeholder exists, but D2 projection registry has adapter=null/canPrint=false | NOT PROVEN |
| Mutation lifecycle | POST issue/redeem routes return GIFT_VOUCHER_FINANCIAL_WORKFLOW_DISABLED before mutation | BLOCKED |

## Main DB evidence

- current_database = darfus_erp.
- gift_vouchers row count = 0.
- gift_vouchers status rows = 0.
- journal rows with gift_voucher_issue/gift_voucher_redeem = 0.
- gift-related audit rows = 0.
- invoices with type giftVoucher = 0.
- gift_vouchers indexes: primary key id; non-unique indexes on code and company_id.

## Fast triage conclusion

The source identity and stored value fields are known, but financial amount semantics across issue/redemption, tax, currency, liability, payment, branch, display-number uniqueness, and print audit are not all proven. This is a real Gate A ambiguity, not a missing UI checkbox.

GATE_A = BLOCKED_GIFT_VOUCHER_AUTHORITY_AMBIGUOUS

