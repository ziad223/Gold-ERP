# DARFUS ERP — Gift Voucher Official End-to-End Acceptance — AED 1000

## ما تم؟

- تم تنفيذ Voucher جديدة واحدة بقيمة AED 1,000 على `darfus_erp` بعد اجتياز الهوية والـHealth والـResolver والـBackup.
- Voucher الجديدة: `GVN-964B0620BB704E27` / `GV-964B0620BB704E27` / `GV-3dac8467-f1c0-46fb-a09c-5bf52d4b8e3e`، وهي منفصلة عن Voucher Owner اليدوية السابقة.
- الـAsset: `AST-PUR-1787092907353-1-1-hldv`، Barcode `GPRNG21000002`، والحالة أصبحت SOLD مرة واحدة.
- Invoice Total = AED 3,040.6505؛ VAT = AED 373.4132 عند 14%؛ Voucher applied = AED 1,000؛ Remaining Due = AED 2,040.6505 بطريقة Card.
- Issue وIssue Journal المتوازن وActivation وPOS Validation وCheckout نجحت. Voucher أصبحت REDEEMED بالكامل.
- Invoice/Payments/Treasury/Sale Journal/Tax/Inventory/Audit تطابقت. لا يوجد Double VAT.
- Exact Issue Replay وExact Checkout Replay أعادا نفس السجلات دون تكرار.
- يوجد Delta خارجي مستقل بقيمة Voucher AED 500 ظهر أثناء فترة الفحص؛ تم تحديد هويته ولم يتم لمسه أو تنظيفه.

## Executive Summary

`GIFT_VOUCHER_OFFICIAL_END_TO_END_ACCEPTANCE = PASS` للتحكم المصرح به. كل دلتا خاصة بهذا التحكم قابلة للتتبع، والـDelta الخارجي موثق كحادث منفصل. لا توجد P0/P1 أُدخلت بواسطة هذا التحكم.

## Owner Authorization

النطاق المصرح: Voucher Purchased واحدة AED 1000، Activation واحدة، Checkout واحد، Full Redemption، وExact Idempotent Replay للـIssue والـCheckout. لم يتم تنفيذ Voucher أو Checkout مستقل إضافي.

## Read First

تمت قراءة `AGENTS.md` و`PROJECT_PROGRESS_HANDOFF.md` والتقارير السابقة والسجلات الستة المطلوبة قبل التنفيذ. لم يتم تعديل المصدر أو الاختبارات أو الإعدادات.

## Official DB / Runtime / Health

`current_database() = darfus_erp`; normal local backend on `localhost:8000`; frontend `localhost:3000`; health, DB, Redis = HTTP 200. Backend source/runtime parity was verified by matching mounted source hashes and runtime start evidence.

## Financial Mapping Readiness

Branch-1 has the required Treasury mapping and exactly one compatible Gift Voucher Liability mapping to account 2400. No account or mapping was created in this control.

## Tax Authority

Company Tax Center configured rate is 14%; this is the runtime authority. No Tax setting was changed. The issue had VAT 0; the sale VAT was AED 373.4132.

## Backup / Baseline

Fresh valid backup: `backend/backups/darfus_erp_gv_official_1000_pre_acceptance_20260827T152932Z.dump`, 842,711 bytes, SHA-256 `AB299C37542FE78CD049D0E25A662F523A90DEB17C77285A3B085CB1E5591D20`, pg_dump 0, pg_restore list 0. Baseline and exact deltas are in `DARFUS_GV_OFFICIAL_1000_DB_DELTA.md`.

## Previous Owner Manual Voucher Attribution

Previous manual voucher `GV-68ef905c-3a4a-4ba9-9d60-ba90d88b7fbc` / `GV-C966BB2D5E4E4F18` remains historical evidence only. It was not reused, edited, deleted, reversed, or counted as this control's new voucher.

## Acceptance Asset / Pricing Preview

Asset was AVAILABLE before the operation. Server pricing request `10648048-625d-489c-a094-a1a2f678139c` returned base AED 2,667.2373448, making 0, discount 0, VAT 14% / AED 373.4132, total AED 3,040.6505. Full AED 1000 redemption was supported.

## Voucher Issue / Accounting / Activation

Issue HTTP 201 request `6d82ac97-d5b1-4027-a2ca-7d93b145c546`; journal `JE-1787844649646` balanced 1000/1000 with bank debit and liability credit; issue revenue and output VAT were zero. Issue replay returned the same identity and financial rows. Activation HTTP 200 request `3e9f2a9a-28ae-4a43-92ee-c0b2a3ad428a`, `issued → active`.

## Browser POS Flow / Full Redemption

Arabic internal browser flow selected customer `CUS-0003`, the acceptance barcode, validated the voucher, applied AED 1000, paid AED 2040.6505 by Card, and clicked checkout once. Browser showed success. Backend recorded HTTP 201 request `b8fc94c0-53c3-4902-a333-0b93a0b7bbbc`. The voucher is now `redeemed` with zero residual value.

## Checkout Idempotency / Invoice / Payments

Exact key `4d5cb993-93e5-4773-a0be-dc4631911a47` and stored hash were matched to the production-built request before replay. Replay HTTP 201 request `ade7f5ed-fc45-450d-a1da-287b04217ecb` returned the same invoice `INV-2026-000005` and produced no new row. The invoice total, two payments, and settlement split reconcile exactly.

## Treasury / Sale Accounting / Tax

The Voucher issue receipt is separate from the sale's Card receipt. Sale journal `JE-1787857084088` is balanced; revenue is one canonical credit, VAT is one canonical credit, liability settlement is exactly AED 1000, and COGS/inventory lines are balanced. No duplicate revenue or VAT exists.

## Inventory / Audit

Asset status changed `AVAILABLE → SOLD` once, with one event and one movement; Barcode and Asset identity remained unchanged. Audit rows exist for issue, activation, redemption, and sale. Print/reprint was not used.

## Network / Console

Issue, activation, pricing, voucher validation, and checkout evidence are recorded with statuses/request IDs in the companion artifacts. Console application errors: 0. A tool-side diagnostic call after the successful click lacked a page-performance object; it did not affect the transaction and is not a product error.

## Concurrent External Delta

After the control's authorized transaction, an unrelated AED 500 Voucher `GV-05a43035-1aa2-456d-abc5-1c08c966a140` was observed at 19:05:19 with its own issue/activation records. It is preserved and attributed separately; no automatic cleanup or reversal was performed.

## Registers

All six registers were updated with the authorized AED 1000 acceptance, identities, accounting/tax/treasury/inventory/idempotency evidence, exact delta attribution, and the concurrent external-delta note.

## Gate

`GATE = PASS_GIFT_VOUCHER_OFFICIAL_END_TO_END_ACCEPTANCE_1000`

The PASS applies to the named Owner authorization. The concurrent unrelated Voucher remains an open attributed incident for Owner review and does not authorize any new action.

## Final Tokens

CURRENT_CONTROL = DARFUS-GIFT-VOUCHER-OFFICIAL-END-TO-END-ACCEPTANCE-1000-01  
MODE = OWNER_AUTHORIZED_OFFICIAL_MAIN_DB_END_TO_END_ACCEPTANCE  
AUTHORIZED_VOUCHER_FACE_VALUE = 1000.00 AED  
READ_FIRST = YES  
OFFICIAL_DB = darfus_erp  
OFFICIAL_DB_IDENTITY_PROVEN = YES  
OFFICIAL_RUNTIME_PARITY = PASS  
HEALTH = PASS (health/db/redis 200)  
OFFICIAL_FINANCIAL_RESOLVER_READINESS = PASS  
CURRENT_COMPANY_VAT_RATE = 14%  
TAX_RUNTIME_AUTHORITY = PASS  
PRE_ACCEPTANCE_BACKUP = PASS  
BACKUP_READABILITY = PASS  
OFFICIAL_ACCEPTANCE_BASELINE = CAPTURED  
PREVIOUS_OWNER_MANUAL_VOUCHER = ATTRIBUTED_AND_NOT_REUSED  
ACCEPTANCE_ASSET_ID = AST-PUR-1787092907353-1-1-hldv  
ACCEPTANCE_ASSET_BARCODE = GPRNG21000002  
ACCEPTANCE_ASSET_PRE_STATE = AVAILABLE  
SERVER_BASE = 2667.2373448  
SERVER_MAKING = 0  
SERVER_DISCOUNT = 0  
SERVER_VAT_RATE = 14%  
SERVER_VAT_AMOUNT = 373.4132  
SERVER_FINAL_TOTAL = 3040.6505  
INVOICE_TOTAL_SUPPORTS_FULL_1000_REDEMPTION = YES  
OFFICIAL_GV_1000_ID = GV-3dac8467-f1c0-46fb-a09c-5bf52d4b8e3e  
OFFICIAL_GV_1000_NUMBER = GVN-964B0620BB704E27  
OFFICIAL_GV_1000_ISSUE = PASS  
ISSUE_JOURNAL_BALANCED = PASS  
ISSUE_REVENUE = 0  
ISSUE_OUTPUT_VAT = 0  
ISSUE_IDEMPOTENCY = PASS  
VOUCHER_ACTIVATION = PASS  
PRE_CHECKOUT_VOUCHER_STATE = PASS  
REAL_BROWSER_CHECKOUT = PASS  
VOUCHER_APPLIED_AMOUNT = 1000.00  
REMAINING_DUE = 2040.6505  
REMAINING_PAYMENT_METHOD = CARD  
VOUCHER_TREATED_AS_SETTLEMENT = YES  
DISCOUNT_CHANGED_BY_VOUCHER = NO  
FULL_REDEMPTION = PASS  
CHECKOUT_IDEMPOTENCY = PASS  
VOUCHER_LIFECYCLE = PASS  
INVOICE_ID = INV-ID-1787857084030-yztnis  
INVOICE_RECONCILIATION = PASS  
PAYMENT_RECONCILIATION = PASS  
TREASURY_RECONCILIATION = PASS  
SALE_JOURNAL_BALANCED = PASS  
NO_DUPLICATE_REVENUE = YES  
NO_DUPLICATE_VAT = YES  
GV_LIABILITY_SETTLEMENT = 1000.00  
SALE_TAX = PASS  
DOUBLE_VAT = NO  
INVENTORY_RECONCILIATION = PASS  
ASSET_SOLD_ONCE = YES  
AUDIT_RECONCILIATION = PASS  
SECOND_REDEMPTION_RUNTIME_RETEST = NOT_RUN_ON_MAIN_UPSTREAM_AND_STATE_PROOF_ACCEPTED  
NETWORK_EVIDENCE = PASS  
CONSOLE_APPLICATION_ERRORS = 0  
ALL_CURRENT_CONTROL_DELTAS_ATTRIBUTED = YES  
UNEXPLAINED_BUSINESS_DELTA = 0  
UNEXPLAINED_FINANCIAL_DELTA = 0  
UNEXPLAINED_INVENTORY_DELTA = 0  
SUCCESS_REGISTER_UPDATED = YES  
ERROR_REGISTER_UPDATED = YES  
ISSUE_BLOCKER_REGISTER_UPDATED = YES  
ROOT_CAUSE_PREVENTION_REGISTER_UPDATED = YES  
OWNER_DECISION_REGISTER_UPDATED = YES  
CLOSED_EVIDENCE_REGISTER_UPDATED = YES  
CURRENT_CONTROL_P0 = 0  
CURRENT_CONTROL_P1 = 0  
P2 = 0  
P3 = 1 (tool-side diagnostic only)  
GIFT_VOUCHER_OFFICIAL_END_TO_END_ACCEPTANCE = PASS  
GATE = PASS_GIFT_VOUCHER_OFFICIAL_END_TO_END_ACCEPTANCE_1000  
NEXT_RECOMMENDED_STEP = Owner review of the attributed concurrent AED 500 Voucher incident; no new business operation  
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START

## STOP

No third Voucher, second independent Checkout, print/reprint acceptance, cleanup, reversal, Tax change, mapping change, migration, or production action was performed. STOP. Owner review required.
