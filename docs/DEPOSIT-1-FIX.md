# DEPOSIT-1-FIX status

## CONT5 C10 — Super Admin explicit-company repair accepted — 2026-07-26

Commit `4079836` makes operational and financial Super Admin requests fail
closed with `422 SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED` when `X-Company-ID` is
absent. A valid selected company is validated before assignment; nonexistent
company remains `403 COMPANY_SCOPE_INVALID`. Authentication-only routes use an
explicit context-free middleware variant, preserving technical session actions
without turning them into business entry points. C10 real HTTP acceptance passed
for absent/valid/invalid company, foreign branch, missing branch, query branch
override, foreign account input, normal-user compatibility, Branch Account
Employee guard, and auth-only compatibility; each denied case left all owned
financial counts zero and cleanup returned the C10 namespace to zero. CONT5
remains partial for the unexecuted configuration, reconciliation, orphan-audit
and rollback-seam cells only.

## CONT5 C9 stopped — Super Admin explicit-company defect — 2026-07-26

CONT9 found a source-proven P1 Product defect before any fixture or financial
write. `authMiddleware` assigns `req.companyId = user.companyId || "CMP-DEMO"`
before its Super Admin branch; that branch accepts an omitted `X-Company-ID` and
does not replace the fallback with a typed rejection. A Super Admin can therefore
reach a branch-scoped financial route under an implicit company context, contrary
to the approved explicit-company contract. `resolveAuthorizedBranchId` will then
accept a supplied active branch in that implicit company. No C9 harness, backup,
fixture, DB mutation, or Product change was made. CONT5 is not closable; next is
`DEPOSIT-1-FIX-CONT5-CONT10` to repair only this context guard and add focused
regression coverage before resuming the remaining C9 matrix.

## CONT5 C8 partial R2-invariant record — 2026-07-26

The actual second full-refund request with a distinct key was rejected while the
first full refund was active. This formally closes R2 as an enforced Product
invariant: no second refund, cash, journal or allocation was created. C8 cleanup
was zero. Super Admin, configuration, reconciliation and rollback remain open.

## CONT5 C7 partial race/context record — 2026-07-26

Actual HTTP R1 execution concurrency passed: one success and one loser with no
C7 residue. The supported inactive Employee state was denied. R2's two-active-
refund premise is blocked by the real request route's locked active-refund guard;
no direct insertion was used. Super Admin, configuration, reconciliation and
rollback evidence remain P1/PARTIAL.

## CONT5 C6 partial idempotency and validation record — 2026-07-26

Owned C6 real HTTP refund request/execution same-key replays returned their
original successful response; changed payload with the same key returned a typed
409 conflict. No financial row was duplicated and exact C6 cleanup was zero.
Typecheck, lint and build now pass naturally. Remaining P1 acceptance cells are
refund race, inactive/Super Admin, configuration, reconciliation and rollback.

## DEPOSIT-1-FIX-CONT5-CONT5 partial refund-middleware record — 2026-07-26

Real local HTTP refund request/approve/reject/execute succeeded for a verified
Branch Account Employee (201/200/200/200). Every action returned
`401 BRANCH_ACCOUNT_EMPLOYEE_REQUIRED` without operator verification and
`403 EMPLOYEE_PERMISSION_DENIED` for no-permission and direct-deny-over-grant.
The initial 422 was harness-only: its request omitted required
`Idempotency-Key`; adding it returned 201 without Product change. One discarded
run left seven exact-owned idempotency rows because harness cleanup missed that
table; exact cleanup removed them, the harness was corrected, and final C5
zero-residue is confirmed. Backup `darfus_erp_cont5_cont5_20260726_201314.dump`
(398,335 bytes) validates through `pg_restore -l` (722 entries). Required static
checks passed. `DEPOSIT-CONT5-F002` remains P1/PARTIAL: request/execution
idempotency/race, inactive/Super Admin, configuration, reconciliation and
rollback remain unproved. Next: `DEPOSIT-1-FIX-CONT5-CONT6`.

`DEPOSIT-1-FIX-CONT4C` closed the receipt source/migration integration blocker only.

- Receipt source commit: `2afa6d9 feat: add immutable reservation deposit receipts`.
- Local development migration: 49 -> 50, applied exactly once; exact rerun was a no-op.
- Backup: `C:\Users\NEGM\AppData\Local\DARFUS-backups\darfus_erp-deposit-receipts-before-2026-07-25T21-18-16-830Z.dump`, `pg_restore -l` PASS (717 entries).
- Contract verifier, syntax, typecheck, focused lint, and production build PASS.
- No Branch Settings, refund, complete-sale, dashboard, permission, configuration, Staging, or Production work was committed in this receipt slice.

Next handoff: `DEPOSIT-1-FIX-CONT4D` must resolve only the bounded receipt fixture/runtime acceptance gap. Only after it closes may `DEPOSIT-1-FIX-CONT5` own complete-sale alignment for unlimited receipts/prior refunds, Branch Settings UI, bounded-refund UI, and reconciliation. `DASHRES-F004` error-normalization remains a separate scope.

## DEPOSIT-1-FIX-CONT4D-CONT1 closeout — 2026-07-25

`DEPOSIT-RDR-F001` is closed by a complete external, exact-owned runtime journey; no Product source was modified. The fixed harness completed syntax/init, local development target/migration 50/50 proof, dry-run, payment, replay, 409 conflict, secure reads/history, immutable snapshot/Arabic-English print contract, dependency-ordered cleanup, zero-residue audit and clean process exit. Focused receipt/association/dashboard checks, typecheck, lint (18 existing warnings, zero errors), and production build passed. Next: `DEPOSIT-1-FIX-CONT5`; do not reopen receipt plumbing here. `DASHRES-F004` error-normalization remains a separate scope.

## DEPOSIT-1-FIX-CONT5 implementation update — 2026-07-26

CONT5 completes the source implementation for net deposit application at
`complete-sale`, bounded partial pre-sale refund, server-derived branch
financial authority, and branch-scoped Settings/refund UI. It does not add a
standalone deposit application, AR allocation, migration, or receipt behavior.
The static contract suite and reconciled historical settlement verifier pass,
along with typecheck, lint (18 existing warnings) and production build. The next
phase is `DEPOSIT-1-FIX-CONT5-CONT1`, which must run the remaining controlled
exact-owned local financial runtime/reconciliation acceptance before any release
decision.

## DEPOSIT-1-FIX-CONT5-CONT1 partial runtime record — 2026-07-26

An external exact-owned development-only harness proved three immutable receipts
followed by one final-sale settlement (`20.0000` received/applied), and a
partial-refund journey (`30.0000` received, `8.0000` refunded, `22.0000`
applied), with receipt/cash/journal creation, selected fail-closed checks,
branch/company denial and exact zero-residue cleanup. `DEPOSIT-CONT5-F002`
remains open: employee/direct-deny, concurrent/race, high-count, full
idempotency and rollback/failure-seam evidence was not run. Continue only with
`DEPOSIT-1-FIX-CONT5-CONT2`.

Evidence metadata: external harness
`C:\Users\NEGM\AppData\Local\Temp\DARFUS\deposit-cont5-cont1-20260726.cjs`,
SHA-256 `9CEB8CEC277226FD729A57BC331884448A32D5C7FB815D8D61840893D23BACD9`;
validated custom backup
`C:\Users\NEGM\AppData\Local\DARFUS-backups\darfus_erp_cont5_cont1_20260726_014211.dump`
(390,489 bytes, `pg_restore -l` exit 0). The harness is retained only because
the runtime matrix is partial; it is outside the repository and unstaged.

## DEPOSIT-1-FIX-CONT5-CONT2 partial runtime record — 2026-07-26

New C2-owned runtime evidence passed a complete-sale race with one `201` result
and one `STATE_CONFLICT`, deposit-payment replay/conflict, and a 25-payment /
25-immutable-receipt scenario whose completion applied `25.0000` exactly once.
All C2 rows were removed exactly. This does not close `DEPOSIT-CONT5-F002`:
real Branch Account Employee/direct-deny middleware, refund races and refund
idempotency, remaining configuration failures, detailed GL/session
reconciliation, and transaction failure seams remain unproved.

## DEPOSIT-1-FIX-CONT5-CONT3 partial middleware record — 2026-07-26

An exact-owned C3 Branch Account harness used the live local HTTP route stack.
Verified Employee Settings read returned 200; missing Employee returned
`401 BRANCH_ACCOUNT_EMPLOYEE_REQUIRED`; no permission and direct-deny over a
grant returned `403 EMPLOYEE_PERMISSION_DENIED`. C3 cleanup was zero. Required
mutation routes, refund/race/idempotency, configuration, reconciliation and
rollback evidence remains unproved.

## DEPOSIT-1-FIX-CONT5-CONT4 partial mutation record — 2026-07-26

C4 extended the live HTTP Branch Account proof to Settings update: a verified
Employee received 200, while missing Employee, no permission, and direct-deny
over a grant received the expected 401/403 results with zero owned residue.
Refund action authorization/idempotency/race, full configuration,
reconciliation, and safe rollback seams remain unproved.
## CONT5-CONT11 financial acceptance evidence (2026-07-26)

Local DB C11 used only the exact owned namespace ACC-DEPOSIT-CONT5-C11-*, then removed it exactly. The C11 service-path scenario proved selected fail-closed financial configuration and branch isolation cells, with zero-row checks after each rejected attempt. The completed scenario reconciled received=30, refunded=8, applied=22, and remaining liability=0; it produced three immutable receipts, one refund allocation, one final invoice, and one stock movement, with selected owned orphan/duplicate checks clean.

This is not final CONT5 closure. Untested configuration cells, complete GL/AR/cash/tax and orphan/cross-scope audits, plus Deposit/Refund/Complete-sale failure injection are still missing durable reviewed evidence. DEPOSIT-CONT5-F002 remains PARTIAL; next only DEPOSIT-1-FIX-CONT5-CONT12.

CONT12 stopped before financial fixtures because the candidate live verifier requires a pre-existing active BranchCustomer. Its temporary test-only edits were reverted. CONT13 must create a complete owned fixture graph for durable rollback coverage.

## CONT16-CONT1 journal rollback evidence — 2026-07-26

`backend/scripts/verify-reservation-deposit-full-acceptance.js` now has a mandatory-cell result runner and a verifier-process-only scoped failure helper. Against a new fully owned C16-C1 fixture, injection at `postingService.postReservationPaymentEntry` returned `ACC_C16_C1_DEPOSIT_JOURNAL_PERSISTENCE_FAILURE` with a real transaction that finished `rollback`. Payment, receipt, cash, journal, journal-line, succeeded-idempotency, audit, receipt-sequence and reservation-status snapshots were unchanged; after restoration a fresh key committed exactly one payment, receipt, cash transaction and balanced two-line journal. Exact cleanup and zero residue passed. Other rollback cells remain unproved.

## CONT16-CONT2 receipt rollback evidence — 2026-07-26

The same fully owned verifier now injects `ACC_C16_C2_DEPOSIT_RECEIPT_PERSISTENCE_FAILURE` at `depositReceiptService.createImmutableDocument`, after payment/journal/cash work but before transaction commit. The real transaction finished `rollback`; payment, receipt, sequence, cash, journal, journal-line, succeeded-idempotency, audit and reservation snapshots were unchanged. A restored fresh-key retry created exactly one payment, immutable receipt, unique receipt number, cash transaction and balanced journal set. Arabic/English receipt notices were persisted. Cleanup and zero residue passed.

## CONT16-CONT3 idempotency-success rollback evidence — 2026-07-27

`reservationService.addPayment` calls `idempotencyService.succeed` with the same Sequelize transaction immediately before commit. Injecting `ACC_C16_C3_DEPOSIT_IDEMPOTENCY_SUCCESS_PERSISTENCE_FAILURE` rolled back payment, receipt, sequence, cash, journal, journal-line, audit, reservation and claimed idempotency rows. The failed key was absent after rollback; the same key then committed exactly once and replay returned the same payment without new artifacts. Cleanup and zero residue passed.

## CONT16-CONT4 refund cash-out rollback evidence — 2026-07-27

The fully owned verifier injects `ACC_C16_C4_REFUND_CASH_OUT_PERSISTENCE_FAILURE` at `CashTransaction.create` in `_executeRefundInTransaction`, after refund journal posting and before allocations/status execution. The real transaction finished `rollback`; the refund stayed approved and all cash/journal/allocation/idempotency/audit/reservation and receipt-digest values were unchanged. Same-key retry executed exactly once; replay added no artifacts. Cleanup and zero residue passed.

## CONT16-CONT5 refund journal rollback evidence — 2026-07-27

The verifier now injects `ACC_C16_C5_REFUND_JOURNAL_PERSISTENCE_FAILURE` only at `JournalEntry.create` for the owned `reservation_refund` source. The actual transaction order is refund metadata update, journal header/lines, cash-out, allocations, final status update, then idempotency success/commit; therefore the selected failure occurs before cash persistence. The real transaction finished `rollback`, leaving the Refund approved and every refund cash/journal/line/allocation/idempotency/audit, liability, treasury and receipt-snapshot value unchanged. Same-key retry created one balanced two-line journal (Dr Reservation Advance 5, Cr branch treasury 5), one cash-out and one allocation; replay created no duplicate. No invoice, VAT, revenue, COGS or inventory mutation occurred. Cleanup and zero C16-C5 residue passed.

## CONT16-CONT6 refund allocation rollback evidence — 2026-07-27

The verifier injects `ACC_C16_C6_REFUND_ALLOCATION_PERSISTENCE_FAILURE` only at `ReservationRefundAllocation.create` for the owned Refund and owned source Deposit payment. The real order is refund metadata update, journal header/lines, cash-out, allocation, final status update, idempotency success and commit. The injected allocation failure finished the real transaction as `rollback`: the Refund remained approved and staged journal/cash/allocation/status/idempotency/audit/account-balance and receipt-digest values remained unchanged. Same-key retry created one 5.00000000 allocation linked to the same Company, Branch, Reservation and source payment, one cash-out and one balanced journal; replay added no artifact or balance movement. Cleanup and zero C16-C6 residue passed.

## CONT16-CONT7 refund idempotency-success rollback evidence — 2026-07-27

The verifier injects `ACC_C16_C7_REFUND_IDEMPOTENCY_SUCCESS_PERSISTENCE_FAILURE` only at `idempotencyService.succeed` for the owned `reservation.refund.execute` key. The real order is claim, Refund metadata, journal header/lines, cash-out, allocation, final status/reservation update, audit/notification, idempotency success, then the only commit. The success call received that same transaction and its failure finished it as `rollback`: the Refund remained approved and no claimed key, journal, cash, allocation, status, audit, balance or receipt-snapshot delta committed. The failed key was absent, so same-key retry committed one execution and one succeeded response; replay added no artifact. Cleanup and zero C16-C7 residue passed.

## CONT16-CONT8 Complete-sale Invoice rollback evidence — 2026-07-27

The verifier injects `ACC_C16_C8_COMPLETE_SALE_INVOICE_PERSISTENCE_FAILURE` only at `models.Invoice.create` in `_completeSaleInTransaction`. The real order is claim, validation/locks, invoice-number calculation, Invoice creation, item/asset/stock writes, invoice journal, Deposit-settlement journal, applications, Reservation completion, audit/notification, idempotency success, then the only commit. The real transaction finished `rollback`: the Reservation stayed `partially_paid`; Invoice/item/document, application, journal/line, inventory, status, idempotency/audit, account and immutable-receipt values had zero failure delta. The failed key was absent; restored same-key retry created one Invoice (`20.0000`, VAT `0.9500`, Deposit paid `10.0000`, due `10.0000`), one item, one application, two balanced journals, one stock movement and one completion. Replay added no artifact. Cleanup and zero C16-C8 residue passed.

## CONT16-CONT9 Complete-sale accounting rollback evidence — 2026-07-27

The verifier injects `ACC_C16_C9_COMPLETE_SALE_ACCOUNTING_PERSISTENCE_FAILURE` only at the Invoice-sale `JournalEntry.create` reached by `postInvoiceEntry`, after Invoice/header/item/asset/stock staging and before settlement, applications, completion and idempotency success. The real transaction rolled back: no Invoice/document/item, application, journal/line, AR/revenue/VAT/liability/COGS/inventory balance, stock, status, audit, idempotency or receipt-snapshot delta committed. Same-key retry created one Invoice, one application, two balanced journals (40.0000 debit/credit aggregate), one stock movement and one completion; replay added no artifact. Cleanup and zero C16-C9 residue passed.

## CONT16-CONT10 Complete-sale Deposit-application rollback evidence — 2026-07-27

`COMPLETE_SALE_ROLLBACK_DEPOSIT_APPLICATION_PERSISTENCE` is PASS. The fully owned verifier injects `ACC_C16_C10_COMPLETE_SALE_DEPOSIT_APPLICATION_PERSISTENCE_FAILURE` exactly at `ReservationPaymentApplication.create(..., { transaction })` in `_completeSaleInTransaction`, after Invoice/item/asset/stock staging plus Invoice and Deposit-settlement journals, and before Reservation completion, audit, idempotency success and the sole commit. The real Sequelize transaction finished `rollback`: the Reservation remained `partially_paid`; Invoice/document/item, application, journal/line, AR/revenue/VAT/liability/COGS/inventory balances, stock, status, idempotency/audit and receipt digest all had zero committed failure delta. The failed key was absent, so same-key retry created exactly one `20.0000` Invoice, one `10.0000` application linked to the owned source payment and Invoice in the same Company/Branch/Reservation, two balanced journals (40.0000 debit/credit aggregate), one stock movement and one completion; replay added no artifact. The original Arabic/English immutable receipt snapshot remained unchanged. Backup `backend/backups/darfus_erp_cont16_c10_20260727_173223.dump` was validated with `pg_restore -l` (398871 bytes; 733 objects), is ignored, and was never restored. Exact cleanup and zero C16-C10 residue passed; migrations remain 50/50. `DEPOSIT-CONT5-F002` remains P1 OPEN/PARTIAL for Complete-sale idempotency and the remaining configuration, reconciliation, audit and repeatability cells. Next only: `DEPOSIT-1-FIX-CONT5-CONT16-CONT11`.

## CONT16-CONT11 Complete-sale idempotency-success rollback evidence — 2026-07-27

`COMPLETE_SALE_ROLLBACK_IDEMPOTENCY_SUCCESS_PERSISTENCE` is PASS. The fully owned verifier injects `ACC_C16_C11_COMPLETE_SALE_IDEMPOTENCY_SUCCESS_PERSISTENCE_FAILURE` only at `idempotencyService.succeed({ request, statusCode: 201, responseBody, transaction: t })` in `completeSale`, after Invoice/item/asset/stock, both final-sale journals, the `10.0000` Deposit application, Reservation completion and completion audit/notification staging, and immediately before the sole `t.commit()`. The success call received the real Sequelize transaction and failure finished it as `rollback`: Reservation, Invoice/document/item, application, journal/line, AR/revenue/VAT/liability/COGS/inventory balances, stock, status, idempotency/audit and receipt digest had zero committed failure delta. The claimed key was absent, so same-key retry created exactly one `20.0000` Invoice, one correctly scoped `10.0000` application, two balanced journals (40.0000 debit/credit aggregate), one stock movement, one completion audit and one succeeded idempotency response; replay added no artifact. The original Arabic/English immutable receipt snapshot remained unchanged. Backup `backend/backups/darfus_erp_cont16_c11_20260727_175514.dump` was validated with `pg_restore -l` (398871 bytes; 733 objects), is ignored, and was never restored. Exact cleanup and zero C16-C11 residue passed; migrations remain 50/50. All Complete-sale rollback seams are now locally accepted. `DEPOSIT-CONT5-F002` remains P1 OPEN/PARTIAL for the configuration, reconciliation, orphan/cross-scope audit and final repeatability cells. Next only: `DEPOSIT-1-FIX-CONT5-CONT16-CONT12`.

## CONT16-CONT12 configuration blocker — 2026-07-27

`DEPOSIT-CONT16-C12-F001` is **P1 OPEN**. The new fully owned runtime matrix passed six Deposit/Refund guard cells: valid A1 Deposit, closed-session Deposit rejection, missing A1-liability no-fallback rejection, cross-Branch/raw-authority rejection, closed-session Refund rejection and valid A1 Refund. Each negative cell had zero financial write delta. The first Complete-sale missing-posting-configuration cell then reproduced a fail-open defect: with no explicit branch-scoped AR, revenue, VAT, COGS or inventory configuration, `completeSale` succeeded and `postingService.ensureAccount(companyId, code, transaction)` auto-created codes 1300, 4100, 2200, 5000 and 1200 by company/code. The owned Reservation became completed with one Invoice, application, two journals and stock movement. This violates the required explicit branch-scoped/fail-closed policy, so remaining C12 cells were not accepted. The verifier finally cleaned every owned row to zero. A Product correction requires an explicit approved role/mapping contract for final-sale posting accounts; no migration, policy change or Product workaround was made in this slice. Next only: `DEPOSIT-1-FIX-CONT5-CONT16-CONT12-CONT1`.

## CONT16-CONT12-CONT1 Complete-sale mapping closure — 2026-07-27

`DEPOSIT-CONT16-C12-F001` is **RESOLVED**. Complete-sale now resolves six explicit branch-scoped `system_account_roles` before Invoice creation: Accounts Receivable, Sales Revenue, VAT Payable, Inventory Asset, Cost of Goods Sold and Reservation Advance Liability. The resolver rejects missing, ambiguous, cross-scope, inactive and wrong-role mappings with stable `BRANCH_FINANCIAL_*` codes; the strict Invoice and settlement posting paths use resolved account IDs and never call `ensureAccount`. The owned C12-CONT1 matrix passed six Deposit/Refund regressions plus valid explicit mapping, missing mapping, Company candidate, sibling Branch, other Company, inactive and wrong-role Complete-sale cells; every negative cell had zero account and financial write delta. The unique role constraint makes ambiguity not applicable. Valid mapping completed once and replay added no duplicate Invoice/application/journal/stock rows while retaining the Deposit receipt digest. The dedicated Super Admin final-sale role-management API remains a later setup/UI gap; existing explicit-company authorization remains enforced. Backup `backend/backups/darfus_erp_cont16_c12_cont1_20260727_185012.dump` was validated (398871 bytes; 733 objects), never restored, and cleanup/zero residue passed. Next only: `DEPOSIT-1-FIX-CONT5-CONT16-CONT13`.

## CONT16-CONT13 financial reconciliation evidence — 2026-07-27

`FINANCIAL_RECONCILIATION_MATRIX` is PASS. The committed verifier adds C13-only namespace handling, fixed eight-decimal `NUMERIC` arithmetic, per-journal balance checks, mapped-account identity checks, source-document and account-balance delta equations, and replay snapshots. One guarded fully owned run (`ACC-DEPOSIT-CONT5-C16-C13-20260727-1920-RUN3`) passed four isolated cells: Deposit receipt, partial Refund, Complete-sale without Refund, and Complete-sale after Refund. The actual final-sale Invoice was gross `20.0000`, net `19.0500`, VAT `0.9500`, cost `10.0000`; Deposit/Refund/application equations, AR due, VAT/Revenue, COGS/Inventory and treasury/liability movements reconciled exactly. Deposit and Refund posted no AR/VAT/Revenue/COGS/Inventory. Replay produced no new documents, journals, stock, account movement or idempotency effects; immutable receipt snapshots remained unchanged. Backup `backend/backups/darfus_erp_cont16_c13_20260727_191903.dump` was ignored, validated by `pg_restore -l` (398871 bytes; 718 objects), never restored; cleanup and zero residue passed with migrations 50/50. No Product finding was reproduced. `DEPOSIT-CONT5-F002` remains P1 OPEN/PARTIAL for orphan/cross-scope audit and final repeatability only. Next only: `DEPOSIT-1-FIX-CONT5-CONT16-CONT14`.

## CONT16-CONT14 integrity audit evidence — 2026-07-27

`ORPHAN_DUPLICATE_CROSS_SCOPE_AUDIT_MATRIX` is PASS. `backend/scripts/verify-reservation-deposit-full-acceptance.js` and `tests/reservation-deposit-rollback-cell.test.cjs` add the narrow C14 namespace and a fully owned 14-cell lifecycle graph audit. Guarded run `ACC-DEPOSIT-CONT5-C16-C14-20260727-1941-RUN3` created two Deposit payments/immutable receipts/cash-ins, one partial Refund/allocation/cash-out, and one final Invoice with two contract-correct Deposit applications, journals and stock movement. Every orphan, semantic-duplicate, receipt-number, journal/account-scope, idempotency and audit-link count was zero; Deposit, Refund and Complete-sale replays were identity-stable. A2 and B1 probes for each operation returned `RESOURCE_NOT_FOUND` with exact before/after snapshots unchanged. Original Deposit receipts and notices remained immutable. Ignored backup `backend/backups/darfus_erp_cont16_c14_20260727_193617.dump` validated through `pg_restore -l` (398871 bytes; 733 objects), was never restored or staged; final cleanup/zero residue, no idle transaction/waiting lock and migrations 50/50 passed. No Product finding was reproduced. `DEPOSIT-CONT5-F002` remains P1 OPEN/PARTIAL for final repeatability/regression only. Next only: `DEPOSIT-1-FIX-CONT5-CONT16-CONT15`.

## CONT16-CONT15 final repeatability and regression evidence — 2026-07-27

`FINAL_REPEATABILITY_AND_REGRESSION` is PASS. The committed verifier executes all eleven rollback cells, the 14-cell configuration/no-fallback matrix, four reconciliation cells and 14 integrity cells in isolated owned sub-fixtures with exact manifest cleanup between cells. RUN1 `ACC-DEPOSIT-CONT5-C16-C15-RUN1-20260727-2032` and RUN2 `ACC-DEPOSIT-CONT5-C16-C15-RUN2-20260727-2034` each passed 14 top-level mandatory suites; RUN2 compared its normalized semantic evidence against external RUN1 evidence and passed. Normalization permits IDs, timestamps, namespaces, correlation/process IDs and monotonic document numbers only; suite inventory/status, semantic artifact counts, account balances, journal source-shape and amounts, idempotency/audit shape, replay and negative zero-write evidence matched exactly. Each RUN cleaned to zero before the next; final import-only audit reported zero C15 residue, no idle transaction/waiting lock/owned connection and migrations 50/50. Ignored guard backup `backend/backups/darfus_erp_cont16_c15_20260727_202445.dump` (398871 bytes; 733 objects) and external backup were validated by `pg_restore -l`, never restored or staged. Focused regression passed 35 tests and targeted lint. `DEPOSIT-CONT5-F002` is **RESOLVED** for the local Deposit/Refund/Complete-sale technical acceptance chain. Next only: `DEPOSIT-1-ACCEPT`.

## DEPOSIT-1 local technical acceptance — 2026-07-27

**Decision:** `DEPOSIT-1-ACCEPT = COMPLETE`; `DEPOSIT_REFUND_COMPLETE_SALE_LOCAL_TECHNICAL_ACCEPTANCE = ACCEPTED`; `DEPOSIT-CONT5-F002 = RESOLVED`.

The accepted local backend scope is Reservation Deposit receipt/document and accounting, bounded Refund approval/execution/cash-out/accounting/allocation, and Complete-sale Invoice, Deposit application, AR/liability settlement, VAT/Revenue/COGS/Inventory recognition. It includes idempotency/retry/replay, all eleven injected persistence rollback cells, branch-scoped configuration/no-fallback, reconciliation, owned integrity audit, two semantically equivalent repeatability runs, exact cleanup and zero residue. The evidence chain is C1–C11 rollback PASS, C12 configuration/no-fallback PASS with `DEPOSIT-CONT16-C12-F001` resolved, C13 reconciliation PASS, C14 integrity PASS, and C15 RUN1/RUN2/normalized comparison/full focused regression PASS.

Accepted guarantees are financial atomicity and balanced journals; one immutable Deposit receipt per payment with no Deposit VAT/Revenue/COGS/Inventory recognition; bounded source-linked Refunds with no Refund VAT/Revenue/COGS/Inventory recognition; final sale as the sole producer of Invoice, VAT, Revenue, COGS and inventory movement; one valid Deposit application; mandatory branch role mappings with no Company/Branch/account fallback; cross-scope rejection; replay zero effect; and no owned orphan, duplicate or cross-scope residue.

This is local subsystem acceptance only. It does **not** authorize deployment, Staging, Production, Product-wide production readiness, production migration/backup-restore/disaster-recovery work, monitoring, performance/load testing, a whole-product security review, or whole-product regression. Super Admin company-selection UX, dedicated Branch financial-role management UI/API, onboarding, notification remediation and global error-contract closure remain follow-up work. Final checkpoint: `7a6cc640ac995b3cd56f6185eef49369270065ab`; next marker only: `NOTIF-PRE1` (diagnosis only).
