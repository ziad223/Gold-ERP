# DARFUS POS Making Charge — Disposable Acceptance Record

بالعربي: لم يتم تنفيذ أي Checkout أو كتابة أعمال. قبول الـruntime المعزول محجوب لأن قاعدة rehearsal المشار إليها غير موجودة ولا توجد fixtures آمنة مثبتة لتشغيل السيناريو المطلوب.

## Gate and target

```text
CONTROL = DARFUS-POS-MAKING-CHARGE-FORMULA-CLOSURE-01
OFFICIAL_DB = darfus_erp
OFFICIAL_DB_MUTATION = 0
REHEARSAL_TARGET = NOT_CREATED
```

Read-only database listing inside the PostgreSQL container returned only:

```text
darfus_erp
```

The pre-approved script `backend/scripts/verify-gold-making-charge-01-pos-rehearsal.js` expects the historical source `darfus_erp_inventory_rehearsal_20260804_160500z`; that database is absent. The script was inspected but not run. No disposable database was created from the protected official database, and no synthetic Asset fixture was inserted.

## Static/pure acceptance

| Proof | Result | Evidence |
|---|---|---|
| 10 × 50 | PASS | MC-01 |
| 5 + 4 + 10 at 50 | PASS | MC-02 = 950 |
| varying rates | PASS | MC-03 = 890 |
| stone-bearing GBW uses net | PASS | MC-04 |
| forged client weight ignored | PASS | MC-05 |
| forged total making ignored | PASS | MC-06 |
| zero/negative | PASS | MC-07/08 |
| below/exact minimum | PASS | MC-09/10 |
| non-GBW strategies remain distinct | PASS | MC-11 |
| VAT once | PASS | MC-12/13 |
| historical cost/purity | PASS | MC-14 |
| Gold Center and CGP boundaries | PASS | MC-15/16 |
| POS labels/mock response | PASS | additional static tests |

Focused file result: `19/19 PASS`; listed regression files other than the control test: `40/40 PASS`.

## Runtime proof status

| Required proof | Status | Reason |
|---|---|---|
| Disposable DB mutation | BLOCKED | requested historical rehearsal DB not present; no safe fixture target |
| Checkout transaction | NOT RUN | no safe target; official DB protected |
| Invoice/payment/journal delta | NOT RUN | mutation proof unavailable |
| Idempotent replay on a business transaction | NOT RUN | no safe target |
| AR browser | BLOCKED | in-app browser setup failed while writing kernel assets (`system cannot find path`) |
| EN browser | BLOCKED | same browser tooling failure |
| Network/runtime preview | BLOCKED | authenticated browser instrumentation unavailable; no POST was sent |
| Main runtime source parity | BLOCKED | backend container was not rebuilt/restarted after source edits |

## Required safe continuation

Owner must separately provide or approve a disposable PostgreSQL target containing the required four available GBW Asset fixtures, or explicitly authorize a controlled clone/fixture plan. Only then may the existing rehearsal script be run, after verifying `SELECT current_database()` equals the disposable target. No official DB write is implied by this report.
