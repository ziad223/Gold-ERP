# DARFUS ERP - Gift Voucher Full Redemption Contract Test Matrix

The matrix defines static/contract proof for this correction control. It does not
create a voucher, redeem a voucher, post a payment, or write the official DB.

| Test ID | Contract assertion | Evidence target | Expected |
|---|---|---|---|
| GV-CONTRACT-01 | Specialized mode is full redemption only. | Authority artifact | `FULL_REDEMPTION_ONLY` |
| GV-CONTRACT-02 | Partial amount/allocation is forbidden and no residual balance is valid. | Authority, effective rules, event matrix | Reject; no residual |
| GV-CONTRACT-03 | Consumption is one time and not multi-transaction. | Authority/effective rules | One successful redemption only |
| GV-CONTRACT-04 | Voucher code is globally unique, immutable, and never reused as a requirement. | Authority/effective rules | Requirement recorded; no migration |
| GV-CONTRACT-05 | Issuance, activation, and distribution are separate; customer is optional at issuance; value is fixed. | Authority/effective rules | Distinct lifecycle boundaries |
| GV-CONTRACT-06 | Currency and branch eligibility are server/company authorities. | Authority/financial boundary | No frontend-only authority |
| GV-CONTRACT-07 | Central Payment Engine plus strict adapter owns allocation; atomicity/concurrency/idempotency are required. | Authority/financial boundary | No parallel allocator |
| GV-CONTRACT-08 | Purchased issue is treasury debit/liability credit with no revenue and no Output VAT. | Financial boundary/policy | Exact financial boundary |
| GV-CONTRACT-09 | Purchased redemption leaves invoice tax/revenue authority with the actual Sales Invoice/Tax Engine. | Financial boundary/policy | No second tax/revenue path |
| GV-CONTRACT-10 | Non-purchased funding/tax classes fail closed pending separate policy. | Effective rules/policy | No inferred treatment |
| GV-CONTRACT-11 | Expiry/cancel/breakage/refund/write-off fail closed if not approved. | Effective rules/policy | No automatic financial event |
| GV-CONTRACT-12 | Print/reprint preserves identity and projection remains read-only/future. | Authority/projection registry | No new voucher or posting |
| GV-CONTRACT-13 | Security and company/branch/RBAC authority are not bypassed. | Authority/routes | Existing controls preserved |
| GV-CONTRACT-14 | Issue and redeem routes are disabled before mutation with stable error. | `erp.routes.js` | `GIFT_VOUCHER_FINANCIAL_WORKFLOW_DISABLED` |
| GV-CONTRACT-15 | Legacy direct account helpers are not reachable runtime authority. | `posting.service.js` + routes | Helpers retained; routes unreachable |
| GV-CONTRACT-16 | Generic partial payment behavior remains outside the Gift Voucher contract. | Drift matrix and non-GV source evidence | No generic behavior change |

