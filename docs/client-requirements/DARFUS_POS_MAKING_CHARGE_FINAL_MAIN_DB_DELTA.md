# DARFUS POS Making Charge — Final Official Main DB Delta

بالعربي: تم الرجوع إلى `darfus_erp` بعد إغلاق الـclone وإثبات أن قاعدة الرسمي ما زالت بنفس الهوية والأعداد. لا توجد كتابة أعمال من هذا Control على القاعدة الرسمية.

## Identity and service proof

```text
OFFICIAL_DB = darfus_erp
OFFICIAL_DB_MUTATION_FOR_CLONE = 0
OFFICIAL_BUSINESS_WRITES_BY_CONTROL = 0
OFFICIAL_FINANCIAL_DELTA_BY_CONTROL = 0
OFFICIAL_INVENTORY_DELTA_BY_CONTROL = 0
```

## Before/after counts

| Entity | Before | After | Delta |
|---|---:|---:|---:|
| assets | 18 | 18 | 0 |
| asset_pricing_policies | 14 | 14 | 0 |
| invoices | 3 | 3 | 0 |
| invoice_items | 3 | 3 | 0 |
| payments | 3 | 3 | 0 |
| cash_transactions | 11 | 11 | 0 |
| journal_entries | 29 | 29 | 0 |
| journal_lines | 81 | 81 | 0 |
| inventory_asset_movements | 70 | 70 | 0 |
| audit_logs | 187 | 187 | 0 |
| idempotency_requests | 105 | 105 | 0 |

The backend refresh and clone proof did not change these official business counts.

## Protected historical exception

```text
ISSUE_ID = PURCHASE-ORDER-UNBALANCED-JOURNAL-001
JOURNAL = JE-1787090870905
SOURCE = PO-1787090870807
DEBIT = 2133.21000000
CREDIT = 2133.22000000
DELTA = 0.01000000
STATUS = posted
```

It remains present and byte-for-byte business values were not changed by this Control:

```text
PRE_EXISTING_JE_EXCEPTION_STILL_PRESENT = YES
PRE_EXISTING_JE_EXCEPTION_CHANGED_BY_CONTROL = NO
ATTRIBUTED_TO_POS_MAKING_FIX = NO
```

No reverse, rebalance, delete, cleanup, backup, migration, seed, or official Checkout was executed.

