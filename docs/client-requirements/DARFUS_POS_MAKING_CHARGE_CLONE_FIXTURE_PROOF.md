# DARFUS POS Making Charge — Disposable Clone and Fixture Proof

بالعربي: تم إنشاء clone مؤقت من `darfus_erp` بعد تصريح الـControl، والتحقق من هويته قبل أي fixture mutation. كل الـfixtures كانت صناعية داخل clone فقط، ثم أُزيل الـclone بعد حفظ الأدلة.

## Clone safety

```text
SOURCE_DATABASE = darfus_erp
CLONE_DATABASE = darfus_pos_making_charge_runtime_01
OFFICIAL_DB_MUTATION_FOR_CLONE = 0
DISPOSABLE_DB_IDENTITY_PROVEN = YES
```

The first custom-format restore stopped before fixtures because PostgreSQL rejected `SET transaction_timeout = 0`. Root cause was dump/server compatibility, not product code. The partial clone was verified as the exact temporary name, dropped, and recreated from a non-empty plain dump with only that incompatible dump directive removed. The final clone contained `143` public tables and was verified with `SELECT current_database()` before fixture writes.

## Clone context

| Context | Value |
|---|---|
| Company | `COMP-48ab554f-427e-4642-9419-bc8616c2dc36` |
| Branch | `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c` / Branch-2 |
| Location | existing clone location from Branch-2 |
| Customer | `CUS-0001` |
| Cash session | `CRS-1787758515940-t252` (OPEN, clone copy) |
| Profile | `GOLD_BY_WEIGHT_JEWELLERY` |
| Rate | `50 AED/g` |

## Synthetic fixtures

| Fixture | Gross | Stone | Net gold | Expected making |
|---|---:|---:|---:|---:|
| `POS-MC-1787762617045-1` / `GWRNG21000003` | 5 | 0 | 5 | 250 |
| `POS-MC-1787762617045-2` / `GWRNG21000004` | 5 | 1 | 4 | 200 |
| `POS-MC-1787762617045-3` / `GWRNG21000005` | 10 | 0 | 10 | 500 |

```text
TOTAL_NET_GOLD_WEIGHT = 19g
TOTAL_MAKING = 950 AED
STONE_BEARING_PROOF = 4g × 50 = 200 AED, not 5g × 50
```

Fixtures used the canonical Asset model, database barcode code/sequence authority (`GW` + `RNG` + `21` + six-digit serial), `asset_gold_details`, company/branch/location fields, and `GOLD_BY_WEIGHT_JEWELLERY` profile. No official row was inserted.

## Fixture mutation boundary

The only writes before checkout were the three synthetic clone Assets, their canonical barcode-history trigger rows, barcode sequence advancement, and their gold-detail rows. No official DB, production, migration, or source file was changed.

## Final state

The clone was dropped only after checkout, replay, conflict, accounting, payment, inventory, barcode, and idempotency evidence was collected. `pg_database` confirmed the clone no longer existed; `darfus_erp` remained present.

