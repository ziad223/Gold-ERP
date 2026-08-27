# Gift Voucher Official Promotion — Schema Verification

`current_database()=darfus_erp` and `current_user=postgres` were rechecked after
the apply. The target migration appears exactly once in `SequelizeMeta` and the
resulting schema is present.

| Authority | Verification | Result |
|---|---|---|
| Migration metadata | `SequelizeMeta=93`; target count `1`; latest target name exact | PASS |
| Voucher identity | `voucher_code` and `voucher_number` non-null, unique indexes present | PASS |
| Currency | `currency varchar(3) NOT NULL` | PASS |
| Lifecycle | Non-null enum status with issued/active/distributed/redeemed/expired/cancelled | PASS |
| Branch eligibility | `gift_voucher_branch_eligibilities` exists with composite PK and branch/voucher FKs | PASS |
| Payment linkage | `payments.gift_voucher_id` exists with FK and unique index | PASS |
| Print events | `gift_voucher_print_events` exists with voucher/company/branch/user/employee FKs | PASS |
| Identity protection | Immutable identity trigger and delete-forbidden trigger present | PASS |
| Safety checks | Non-empty code, positive face value, purchased type/funding, eligibility, redeemed-link checks | PASS |

`TARGET_MIGRATION_IN_META=YES`, `TARGET_MIGRATION_META_COUNT=1`, and
`SCHEMA_VERIFICATION=PASS`.
