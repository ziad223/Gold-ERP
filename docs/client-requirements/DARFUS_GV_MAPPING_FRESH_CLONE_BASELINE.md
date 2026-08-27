# Gift Voucher Mapping — Fresh Clone Baseline

Backup source: `darfus_erp`.
Backup: `backend/backups/darfus_erp_gv_mapping_fix_01_pre_promotion_20260827T145304Z.dump`.
Backup size: `836254` bytes.
Backup SHA-256: `B1B6A29679C3B129612BFEAE9D40228020117BF8109890DA0D79D47C81EB02F6`.
`pg_dump = 0`; `pg_restore --list = 0`.

## Controlled clone

`darfus_gv_fin_mapping_fix_01_idem_20260827` was freshly restored from that backup and verified with `current_database()`. Identity was not `darfus_erp`.

| Baseline | Count |
|---|---:|
| `GIFT_VOUCHER_LIABILITY` role rows | 0 |
| Gift Vouchers | 0 |
| Journal entries | 29 |
| Journal lines | 81 |
| Cash transactions | 11 |
| Idempotency requests | 105 |

An earlier clone `darfus_gv_fin_mapping_fix_01_20260827` was also created and used as supporting resolver/issue evidence; neither clone is official.

`FRESH_CLONE_CREATED = YES`.
`CLONE_IDENTITY_PROVEN = YES`.

