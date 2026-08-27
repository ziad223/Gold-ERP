# DARFUS ERP — C2C3M-R Final DB Reconciliation

## ملخص

هذه المصالحة تثبت عدم وجود mutation أعمال في هذا control. تم استخدام Disposable clone للقراءات والـsynthetic RBAC fixture فقط. `darfus_erp` بقي read-only.

## Disposable clone baseline / after

تم أخذ baseline بعد تجهيز الهوية الاصطناعية وقبل B6/B7، ثم أعيدت نفس القراءات بعد API/browser proof.

| Table | Before | After | Delta |
|---|---:|---:|---:|
| `asset_revisions` | 11 | 11 | 0 |
| `asset_revision_changes` | 13 | 13 | 0 |
| `asset_events` | 76 | 76 | 0 |
| `audit_logs` | 147 | 147 | 0 |
| `assets` | 18 | 18 | 0 |
| `inventory_asset_movements` | 62 | 62 | 0 |
| `journal_entries` | 25 | 25 | 0 |
| `journal_lines` | 67 | 67 | 0 |
| `idempotency_requests` | 110 | 110 | 0 |

`DISPOSABLE_REVISION_BUSINESS_DELTA = 0`.

## Synthetic fixture boundary

تم إنشاء/تعيين هويات وأدوار اصطناعية على الـclone فقط، بعد إثبات `SELECT current_database()`، لاستخدام B6/B7. هذه ليست business transaction وليست seed للـofficial DB. لم تتم إضافة `branches.view` حتى لا يُخفى العيب.

## Official DB read-only proof

قاعدة الهدف الرسمية أكدت `current_database() = darfus_erp`. القراءات الحالية تضمنت:

| Check | Observed |
|---|---:|
| permissions | 152 |
| `inventory.revision.create` | 1 |
| `inventory.revision.view` | 1 |
| `asset_revisions` | 1 |
| `asset_revision_changes` | 2 |
| `assets` | 18 |
| `inventory_asset_movements` | 62 |
| `journal_entries` | 25 |
| `journal_lines` | 67 |
| `cash_transactions` | 7 |
| `idempotency_requests` | 100 |

تشخيص permission الرسمي read-only أعاد:

```text
SOURCE_PERMISSION_COUNT=152
DB_PERMISSION_COUNT=152
MISSING_PERMISSION_COUNT=0
EXTRA_PERMISSION_COUNT=0
METADATA_MISMATCH_COUNT=0
ROLE_BINDING_GAP_COUNT=0
PERMISSION_WRITES=0
```

آخر business timestamps المرصودة رسميًا (`2026-08-26 07:25:50 UTC`) سبقت نشاط هذا control، ولم يُرسل control الحالي business POST إلى `darfus_erp`.

## Integrity conclusion

لا توجد delta أعمال في الـclone أثناء B6/B7، ولا mutation رسمية من هذا control. لا يوجد دليل على ضرر جديد. تم إيقاف القبول قبل أي إصلاح أو mutation.

## Final tokens

```text
OFFICIAL_DB = darfus_erp
OFFICIAL_DB_READ_ONLY = YES
DISPOSABLE_CURRENT_DATABASE_VERIFIED = YES
DISPOSABLE_REVISION_BUSINESS_DELTA = 0
OFFICIAL_BUSINESS_WRITES = 0
OFFICIAL_DAMAGE = 0
NEW_REVISION_ROWS = 0
NEW_ASSET_ROWS = 0
NEW_MOVEMENT_ROWS = 0
NEW_JOURNAL_ROWS = 0
PERMISSION_WRITES = 0
```
