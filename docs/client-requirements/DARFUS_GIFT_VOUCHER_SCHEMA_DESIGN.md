# DARFUS Gift Voucher Minimum Safe Schema Design

## Core table: `gift_vouchers`

| Field | Constraint / authority | Purpose |
|---|---|---|
| `id` | Primary key | Technical identity. |
| `voucher_number` | Global unique, immutable, never reused | Human voucher number. |
| `voucher_code` | Global unique, immutable, never reused | Scan/search/redeem code. |
| `company_id` | Required FK | Server-authoritative owning company. |
| `issue_branch_id` | Required FK | Server-authoritative issue branch. |
| `voucher_type` | `PURCHASED_GIFT_VOUCHER` in active scope | Business classification. |
| `funding_source` | `PURCHASED` is the only active source | Financial-policy guard. |
| `face_value` | Positive, immutable | Fixed monetary obligation. |
| `currency` | Required, immutable, server/company resolved | Prevents client currency authority. |
| `status` | `issued`, `active`, `distributed`, `redeemed`, `expired`, `cancelled` | Lifecycle storage. Only issued → active → redeemed is a financial workflow in this control. |
| `branch_eligibility_mode` | `ALL_BRANCHES` or `SELECTED_BRANCHES` | Canonical eligibility policy. |
| `customer_id` | Nullable FK | Optional issuance customer. |
| `issued_at` / actor ids | Required timestamp plus user/employee attribution where available | Issue audit. |
| `activated_at` / actor ids | Nullable | Separate activation audit. |
| `redeemed_at` / actor ids | Nullable | One-time redemption audit. |
| `redemption_invoice_id` | Nullable unique FK | Actual Sales Invoice source. |
| `redemption_payment_id` | Nullable unique FK | Exact payment allocation source. |

The database identity trigger prevents mutation of voucher number, code, face
value, currency, funding source, voucher type and company after issue.

## Eligibility and print relations

`gift_voucher_branch_eligibilities` stores one `voucher_id + branch_id` pair
for `SELECTED_BRANCHES`; its primary key prevents duplicate eligibility rows.

`gift_voucher_print_events` is append-only event storage for original print and
reprint evidence. It does not change voucher identity, status, value, payment,
or accounting state.

## Payment link

`payments.gift_voucher_id` is nullable and unique when populated. It links one
full-value Gift Voucher allocation to one Payment row and prevents a second
payment row from claiming the same voucher.

## Migration safety

The migration starts with a transaction-local preflight that requires
`gift_vouchers` to be empty. This is deliberate: it avoids inventing currency,
identity, activation, branch eligibility or financial history for legacy rows.
If a future target contains legacy vouchers, the migration fails before schema
mutation and needs a separately approved migration/data authority.

The down migration is permitted only while all new Voucher, print, eligibility
and Payment-link data are empty. It is for disposable rehearsal only; it is not
a production recovery procedure.

## Accounting design

Issue uses one journal only:

`Dr resolved Cash/Bank Treasury`  
`Cr resolved GIFT_VOUCHER_LIABILITY`

Redemption has no separate voucher journal. The existing Sales Invoice journal
keeps its Sales Revenue and VAT credits, while the strict adapter adds the
voucher-liability debit for the exact full voucher value. Ordinary split legs
remain existing treasury debit legs. This produces one balanced invoice entry,
with no duplicate revenue, tax, cash transaction or Payment allocation.

`NO_OUTPUT_VAT_ON_ISSUE = YES`
`NO_SECOND_REVENUE_OR_VAT_ON_REDEMPTION = YES`
