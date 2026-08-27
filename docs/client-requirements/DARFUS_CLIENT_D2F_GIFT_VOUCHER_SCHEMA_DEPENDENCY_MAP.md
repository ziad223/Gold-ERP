# D2F Gate A Re-Entry — Gift Voucher Schema and Dependency Map

## Current dependency graph

```text
gift_vouchers
  ├─ company_id -> companies.id (FK, required)
  ├─ customer_id/customer_name -> optional current party fields
  ├─ value/balance/status/issue_date/expiry_date/payment_method/branch
  ├─ GET /gift-vouchers and GET /gift-vouchers/:code
  ├─ GiftVouchers UI + use-gift-vouchers hook
  ├─ customer profile count projection
  ├─ invoice-projection registry (currently SUPPORTED_LATER)
  └─ unused posting.service voucher issue/redeem helpers
```

## Dependency evidence

| Dependency | Current evidence | State | Safe interpretation |
|---|---|---|---|
| Stable internal identity | `giftVoucher.model.js:id` and `gift_vouchers_pkey` | Proven | Preserve as immutable internal ID |
| Company scope | Model `companyId` required; DB FK to `companies(id)` | Proven | Keep server company scope |
| Branch scope | Model `branch` string; no FK/scope table | Gap | Must not be treated as canonical branch authority |
| Customer integration | `customerId/customerName`; customer profile count | Partial | Nullable customer is required for anonymous issue |
| Payment Engine | Sales docs own payment validation/allocation; current payments table has no voucher source FK | Gap | Add one Payment Engine boundary, not frontend allocation |
| Accounting | Posting helper source types and account 2400 exist | Not active | Helper is design evidence only; no runtime authority |
| Treasury | No voucher treasury source rows/routes proven | Missing | Define only from approved financial event policy |
| Tax | Shared Tax Engine exists for Sales; no Gift Voucher treatment/snapshot mapping | Blocked | Requires policy proof before implementation |
| Audit | Generic audit framework exists; no voucher-specific event/reprint authority proven | Gap | Reuse canonical audit source after event contract |
| Projection | Registry has `gift_voucher`, adapter null, `SUPPORTED_LATER`, view/print false | Fail-closed | Do not activate early |
| Search | GET list/detail routes are authenticated and company-scoped | Partial | Not equivalent to D2 invoice projection |
| Print | Generic Gift Voucher placeholder warning only; no active source adapter | Missing | Dedicated voucher presentation contract required |
| Idempotency | Existing platform idempotency exists, but no voucher write path | Not proven | Required for issue/redeem/reprint writes |

## Dependency mapping result

`UPSTREAM_DEPENDENCIES_MAPPED = YES`

`DOWNSTREAM_DEPENDENCIES_MAPPED = YES`

`CRITICAL_UNRESOLVED_DEPENDENCY = NO` means no dependency was hidden or unknown in this audit. The known unresolved financial contracts are explicitly captured as Gate A blockers, not treated as unknown dependencies.

## Migration candidates (design only)

The client-proven gaps likely require an additive staged schema design for some or all of:

- unique/non-reusable Voucher Code enforcement;
- separate Voucher Number authority, if confirmed distinct from Code;
- currency authority/snapshot;
- canonical branch/location restriction scope;
- voucher type, ownership, funding source, activation, distribution, lifecycle and audit events;
- QR/barcode representations;
- Payment Engine source allocation and tax/accounting snapshots.

`MIGRATION_REQUIRED = YES_DESIGN_REQUIRED`

No migration was created or applied. Protected-main promotion remains unauthorized.
