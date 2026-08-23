# Immutable reservation-deposit receipts

## CONT5 C10 boundary — 2026-07-26

C10 repaired only Super Admin company-context middleware. Its HTTP matrix made
no payment, receipt, refund, allocation, cash, journal, invoice, or reservation
row; exact cleanup removed its technical fixture graph. Receipt behavior, schema,
snapshots and migrations remain unchanged and accepted.

## CONT5 C9 boundary — 2026-07-26

CONT9 stopped before fixture creation after a Super Admin company-scope defect
was found in authentication middleware. No receipt source, schema, snapshots,
migration, or receipt row changed. The immutable receipt subsystem remains
accepted; no C9 receipt evidence was claimed.

## CONT5 C8 boundary — 2026-07-26

C8 formalized the refund-request invariant only. It did not alter receipt source,
schema, snapshots or migrations; exact C8 receipt fixtures were removed.

## CONT5 C7 boundary — 2026-07-26

C7 did not change receipt source, schema, snapshots or migrations. Its owned
receipt rows were removed during exact cleanup.

## CONT5 C6 boundary — 2026-07-26

C6 exercised refund idempotency only and did not alter receipt source, schema,
snapshots or migrations. Exact owned receipt rows were removed with C6 cleanup.

## CONT5 C5 boundary — 2026-07-26

Refund middleware acceptance used the existing immutable receipt subsystem but
did not modify receipt source, schema, snapshots or migrations. All owned C5
receipt rows were removed during exact fixture cleanup; receipt acceptance is
not re-opened by this partial phase.

Completed locally on 2026-07-25 by `DEPOSIT-1-FIX-CONT4C`.

Commit `2afa6d9` adds an immutable receipt document and one branch/year server-side sequence per committed reservation payment. Receipt numbers use `DEP-{BRANCH_CODE}-{YEAR}-{SEQUENCE}`; allocation, payment, audit, document snapshot, and idempotency response are one transaction. A duplicate payment request replays the original response with `replay: true`; a legacy committed payment with no document returns `LEGACY_PAYMENT_WITHOUT_IMMUTABLE_RECEIPT`.

The document snapshot is assembled only from server-side company, branch, customer, reservation/item, asset, payment, refund, and settings records. It records zero deposit VAT, product-tax information only, financial totals at issuance, and Arabic/English non-final-tax-invoice notices. Reads require `reservations.view_receipts` and authorized company/branch scope; history is capped at 200 rows/page.

Local migration state: `20260721030000-reservation-deposit-receipt-documents.js` SHA-256 `B155F4121CCF9C335651F0C1F9D838BBE2021AC3244BA3339CC4DAF72158FBD8` was applied once to local development `darfus_erp` after a validated custom-format backup. Source/applied migration count is 50/50; no migration is pending. Staging and Production remain untouched.

Runtime scope note: catalog/ORM/static/UI validation passed. A bounded exact-owned receipt-fixture probe exceeded its diagnostic window and was stopped; immediate residue audit was zero across its company, branch, customer, asset, reservation, item, payment, receipt, and sequence prefixes. It is not a successful full payment-posting acceptance.

## DEPOSIT-1-FIX-CONT4D-CONT1 runtime acceptance — 2026-07-25

The prior gap is closed. External harness `C:\Users\NEGM\AppData\Local\Temp\DARFUS\deposit-rdr-cont4d-cont1.js` (final SHA-256 `0447A2970C59A79312A6E63120FE961177911761E5DB7ED9EB7C5676B59BE3AD`) passed `node --check`, import-only initialization, local-target proof, and dry-run cleanup before it created an exact owned graph. It used only development loopback `darfus_erp:5432`, with migration state 50/50 and the receipt migration applied once. The temporary harness was removed after this record.

One `1.0000` owned cash deposit completed through `reservationService.addPayment`: one payment, cash transaction, two-line balanced treasury/Reservation-Advance journal, audit event, idempotency record, sequence and immutable receipt were created. No invoice, stock movement, payment application, VAT, revenue, COGS, final sale, or refund was created. Pre/post read-only activity snapshots reported zero lock waiters and zero idle-in-transaction sessions. Same-key replay returned the same payment/receipt; changed payload returned 409 and no additional rows. ID/payment/number reads and one-item history agreed; Arabic/English notices and snapshot version 1 were present. After a temporary owned customer display-name change, the receipt snapshot remained unchanged and the master field was restored.

Exact raw SQL removed the one owned audit row; dependency-ordered cleanup removed all other owned rows. The zero-residue audit was zero for audits, idempotency, receipt, sequence, payment applications, payments, cash, journals/lines, reservation graph, session, mappings/accounts, customer/asset, branch and company, then the harness exited cleanly. `DEPOSIT-RDR-F001` is closed; the PostgreSQL client emitted a non-fatal deprecation warning after completion, but no timeout, lock, data residue, or Product defect was observed.
## CONT5-CONT11 acceptance note (2026-07-26)

The owned runtime reconciliation recorded three successful Deposit payments and exactly three immutable receipt documents; no rejected configuration attempt created a payment or receipt. Receipt/payment uniqueness and orphan checks were zero. This confirms the observed happy-path and fail-closed configuration behavior locally, but does not replace the still-required durable failure-injection evidence for receipt persistence rollback.

CONT12 did not add receipt rollback evidence: the candidate permanent live verifier is not independently fixture-owned. Receipt behavior remains accepted; the missing evidence is infrastructure for isolated failure testing.

## CONT16-CONT1 note — 2026-07-26

The new journal-persistence injection fails before receipt persistence inside the real Deposit transaction. The C16-C1 failure created no receipt document or sequence delta; the restored retry created exactly one immutable receipt. Receipt-persistence rollback itself is still a separate unexecuted cell.

## CONT16-CONT2 receipt-persistence rollback — 2026-07-26

`createImmutableDocument` was replaced only within the verifier process for one real `addPayment` attempt. Its deterministic failure rolled back the already-attempted payment, cash and journal work, leaving no receipt or sequence delta. After restoration, one retry produced one unique immutable receipt per payment with the persisted Arabic and English notices. No valid orphan receipt/document was observed.

## CONT16-CONT3 idempotency atomicity — 2026-07-27

The Deposit success-response persistence update is inside the same transaction as immutable receipt issuance. A scoped failure at `idempotencyService.succeed` left no issued receipt or sequence delta; same-key retry issued one receipt and replay produced no second receipt.

## CONT16-CONT4 refund immutability note — 2026-07-27

Refund cash-out failure, successful retry and replay left the owned original Deposit receipt count and persisted snapshot digest unchanged. The original immutable receipt was not modified by refund execution.

## CONT16-CONT5 refund journal immutability note — 2026-07-27

The scoped Refund journal-header failure, its rollback, the restored same-key retry and replay all retained the original Deposit receipt ID, count and snapshot digest. No failed or successful Refund attempt mutated the immutable receipt or issued a new receipt document.

## CONT16-CONT6 refund allocation immutability note — 2026-07-27

Allocation-persistence failure, rollback, restored same-key retry and replay retained the owned Deposit receipt ID, count and snapshot digest. Allocation execution did not mutate or reissue the original immutable receipt.

## CONT16-CONT7 refund idempotency immutability note — 2026-07-27

Refund idempotency-success failure, transaction rollback, restored same-key retry and replay retained the owned Deposit receipt ID, count and snapshot digest. No idempotency result or Refund execution path mutated or reissued the original receipt.

## CONT16-CONT8 Complete-sale immutability note — 2026-07-27

Invoice-persistence failure, transaction rollback, restored same-key completion retry and replay retained the owned Deposit receipt ID, number, count and snapshot digest. Final-sale completion applied the Deposit through its own application and settlement journals; it did not mutate or reissue the immutable Deposit receipt.

## CONT16-CONT9 Complete-sale accounting immutability note — 2026-07-27

Final-sale accounting-header failure, rollback, retry and replay retained the original Deposit receipt ID, number, notices and snapshot digest. Accounting and settlement did not mutate or reissue the receipt.

## CONT16-CONT10 Complete-sale application immutability note — 2026-07-27

The real `ReservationPaymentApplication.create` failure, transaction rollback, restored same-key completion retry and replay retained the owned Deposit receipt ID, number, Arabic/English notices and snapshot digest. Applying the Deposit through the final Invoice did not mutate, reissue or create a receipt for the failed attempt.

## CONT16-CONT11 Complete-sale idempotency immutability note — 2026-07-27

The real Complete-sale `idempotencyService.succeed` failure, rollback, restored same-key retry and replay retained the owned Deposit receipt ID, number, Arabic/English notices and snapshot digest. Completion response persistence did not mutate, reissue or create a receipt for the failed attempt.

## CONT16-CONT12 configuration-blocker receipt note — 2026-07-27

The C12 Complete-sale configuration probe reproduced a posting-account fallback, but the fully owned Deposit receipt ID, number and snapshot digest were unchanged. Cleanup removed the entire owned probe graph; no receipt mutation finding was reproduced.

## CONT16-CONT12-CONT1 strict mapping receipt note — 2026-07-27

Both fail-closed mapping rejections and the valid explicit-mapping Complete-sale/replay retained the owned Deposit receipt IDs, numbers, Arabic/English notices and snapshot digest. Strict final-sale account resolution neither reissues nor mutates Deposit receipts.

## CONT16-CONT13 reconciliation immutability note — 2026-07-27

The four owned financial reconciliation cells retained Deposit receipt IDs, numbers, persisted snapshots and Arabic/English notices across Refund, Complete-sale and all successful replays. The C13 verifier compares the receipt snapshot payloads directly; financial reconciliation never reissues or mutates a receipt.

## CONT16-CONT14 integrity audit immutability note — 2026-07-27

The owned C14 lifecycle graph had two Deposit receipts, a partial Refund and a completed sale. Orphan/duplicate/cross-scope checks and all replays retained the receipt IDs, numbers, persisted snapshot payloads and Arabic/English notices; no cross-scope rejection or downstream operation reissued or mutated a Deposit receipt.

## CONT16-CONT15 repeatability immutability note — 2026-07-27

Both isolated C15 runs exercised every Deposit, Refund and Complete-sale acceptance suite. Their normalized comparison retained receipt count, immutable document role, snapshot payload and Arabic/English notices; replay and negative paths never reissued or mutated a Deposit receipt.

## DEPOSIT-1 local acceptance receipt guarantee — 2026-07-27

The final local acceptance decision retains the receipt contract: each accepted Deposit creates one immutable receipt/document; Deposit, Refund, Complete-sale, rollback, rejected configuration and replay paths do not mutate, reissue or duplicate its IDs, numbers, snapshot payloads or Arabic/English notices. This guarantee was included in C1–C15 evidence, including equivalent RUN1/RUN2 outcomes. It is a local backend subsystem guarantee only and is not deployment or Production authorization.
