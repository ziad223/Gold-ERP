# Gift Voucher Financial Mapping — Minimum Safe Fix Design

## Preconditions

1. Owner freezes the intended company VAT policy/rate and effective-date authority.
2. Owner authorizes a disposable-clone rehearsal; official `darfus_erp` remains read-only.
3. Exact company/branch scope and target role are rechecked immediately before any mapping write.

## Minimum change

Provision one canonical `SystemAccountRole` mapping per active branch for `GIFT_VOUCHER_LIABILITY`, pointing to an approved active liability account through the existing application/bootstrap authority. Do not add a new accounting authority, hardcode `2400`, or alter the canonical Gift Voucher service.

## Proof required later

- resolver returns exactly one Treasury and one liability role per branch;
- purchased issue debits resolved Treasury and credits resolved Gift Voucher Liability;
- Revenue and Output VAT remain zero;
- transaction rollback leaves zero partial business rows;
- idempotency replay returns the existing result without duplicate records;
- same-key changed payload conflicts;
- balanced journal and cash/payment evidence reconcile;
- official DB delta remains zero until a separately named promotion is authorized.

## Explicitly out of scope

No official mapping write, no Voucher issue/retry, no redemption, no Tax Engine change, no migration, no schema change, no hardcoded account fallback, and no cleanup of historical evidence.

