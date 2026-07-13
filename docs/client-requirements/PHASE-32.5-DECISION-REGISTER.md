# Phase 32.5 — Decision Register

Sign-off tracker for every open decision. **Status starts PENDING; Answer/Date are intentionally blank** (to be filled by the approver, not by the implementation team). Recommended options are shown but **not applied**.

**Approver legend:** CLIENT · OWNER · ACCOUNTANT · CLIENT+ACCOUNTANT · OWNER+CLIENT

| Decision ID | Domain | Question | Options | Recommended | Approver | Priority | Status | Answer | Date |
|---|---|---|---|---|---|---|---|---|---|
| AD-001 | Accounting | Unpaid deposit remainder GL treatment (total 2415, cash 1500, remainder 915, no AR line today) | A keep current (post cash only) / B post remainder to AR / C reservation-until-conversion / D other | A (keep current, pending) | ACCOUNTANT | P0 | PENDING | | |
| CD-001 | Currency | Official/default currency (POS mockup SAR vs invoice mockup AED) | A AED / B SAR / C company-configurable, AED default / D branch-configurable | C | OWNER+CLIENT | P2 | PENDING | | |
| CD-002 | Scope | UAE E-Invoicing (2 docs removed from source set) | A intentionally removed / B required later / C removed accidentally / D needs new official docs | Deferred, not exposed as completed | OWNER+CLIENT | P2 | PENDING | | |
| CD-003 | Inventory | Watch inventory type (not in client files; provisional WT/WCH/00) | A keep in client scope / B hide from client UI / C remove after dependency audit / D future | Keep provisional; not presented as client-approved | OWNER+CLIENT | P3 | PENDING | | |
| CD-004 | Barcode | Barcode display format (docx full `INV+ITEM+KT+SERIAL` vs POS short `R-24-00125`) | A keep full / B short alias + full stored / C replace / D show both | A (keep full stored); alias only after approval | CLIENT | P3 | PENDING | | |
| CD-005 | Pricing | Global vs retail selling price (XLSX shows a choice) | A one price / B global + retail override / C company price mode / D branch pricing | C (company-configured mode) | OWNER+CLIENT | P2 | PENDING | | |
| CD-006 | Barcode/Inventory | Loose diamond/gem/pearl KT policy (demo default "18", not client-approved) | A KT="00" / B setting-metal KT / C omit/neutralize KT / D other | Configurable; mark demo default not client-approved | CLIENT | P3 | PENDING | | |
| CD-007 | Printing | Final barcode tag physical dimensions (default 62×28mm) | A 62×28 / B other size / C multiple sizes | Keep configurable default; needs client dims | CLIENT | P3 | PENDING | | |
| CD-008 | Printing | Printer brand/model + DPI (none specified) | provide model/DPI | Keep printer-agnostic; physical test required | CLIENT | P3 | PENDING | | |
| CD-009 | Printing | Duplex / front-back method for tags | A true duplex / B paired panels / C separate passes | Paired panels (printer-dependent) | CLIENT | P3 | PENDING | | |
| CD-010 | Printing | QR usage vs CODE128 | A CODE128 only / B QR optional / C both | CODE128 default, QR optional | CLIENT | P4 | PENDING | | |
| CD-011 | Printing | RFID printed presentation | A hidden / B indicator only / C value | Indicator-only default | CLIENT | P4 | PENDING | | |
| CD-012 | Printing | Barcode revision (v1/v2) display on tag | A hide / B show | Hidden default | CLIENT | P4 | PENDING | | |
| CD-013 | Printing | Making-charge obfuscation (merged MC+min, e.g. "2518") | A off (plain) / B on (merged) | Off by default; configurable | CLIENT | P4 | PENDING | | |
| CD-014 | Printing | Discount display meaning on tag (DIS) | A max % / B value / C hidden | Tag-only discount, source to confirm | CLIENT | P4 | PENDING | | |
| CD-015 | Printing | Certificate fields on tag | A show number / B show issuer+number / C hidden | Show number when present | CLIENT | P4 | PENDING | | |
| CD-016 | Printing | Company stamp source on invoice | A uploaded image / B text / C none | Uploaded image (settings) | OWNER+CLIENT | P3 | PENDING | | |
| CD-017 | Printing | Salesperson signature source on invoice | A logged-in salesperson / B manual / C none | Logged-in salesperson (needs employee↔invoice link) | OWNER+CLIENT | P2 | PENDING | | |
| CD-018 | Sales/Gold | IGP (supplier gold purchase) process, settlement, VAT, stock behavior | define full workflow | Build after client-defined process | CLIENT+ACCOUNTANT | P1 | PENDING | | |
| CD-019 | CRM | Required CRM depth (segmentation/communication/analytics/campaigns/VIP/reminders) | required-now / future / not-required per item | Loyalty now; rest per client priority | CLIENT | P2 | PENDING | | |
| CD-020 | Employees | Employee code format, KPI/performance, commission, salesperson↔invoice, user↔employee, activity logs | define each | Salesperson↔invoice first; rest per client | CLIENT | P2 | PENDING | | |
| CD-021 | Dashboard | Which widgets are Required/Optional/Hide/Future (see clarification pack list) | classify per widget | Sales/VAT/cash/inventory/gold-price required | CLIENT | P2 | PENDING | | |
| CD-022 | Invoice layout | Per-line VAT column + payment-method grid parity with screenshot | A align to screenshot / B keep current | Align to screenshot | CLIENT | P2 | PENDING | | |
| CD-023 | POS | Loyalty-points display parity with POS screenshot | A show points / B hide | Show (verify present) | CLIENT | P3 | PENDING | | |
| CD-024 | Inventory | Pure-gold 999.9 (mandatory) + 995 (optional toggle) display (XLSX) | A show both / B 999.9 only / C hidden | 999.9 mandatory; 995 toggle | CLIENT | P3 | PENDING | | |
| CD-025 | Inventory | Weight capture from scale device (XLSX "التقاط من الميزان") | A hardware scale / B manual only | Manual now; scale future/hardware | CLIENT | P3 | PENDING | | |
| SD-001 | Extra feature | `/approvals` visibility | keep / hide / internal / future / remove-after-audit | Hide-first / confirm | OWNER+CLIENT | P3 | PENDING | | |
| SD-002 | Extra feature | `/sales/reservations` visibility | keep / hide / internal / future / remove-after-audit | Confirm scope | CLIENT | P3 | PENDING | | |
| SD-003 | Extra feature | `/inventory/manufacturing` visibility | keep / hide / internal / future / remove-after-audit | Keep (internal ops) / confirm | OWNER+CLIENT | P3 | PENDING | | |
| SD-004 | Extra feature | `/inventory/stock-audit` visibility | keep / hide / internal / future / remove-after-audit | Keep (internal ops) / confirm | OWNER+CLIENT | P3 | PENDING | | |
| SD-005 | Extra feature | `/notifications` visibility | keep / hide / internal / future / remove-after-audit | Confirm / verify not dead | OWNER+CLIENT | P4 | PENDING | | |
| SD-006 | Extra feature | `/audit` page visibility | keep (internal foundation) / hide | KEEP — internal foundation | OWNER | P4 | PENDING | | |
| SD-007 | Extra feature | Inventory transfers visibility | keep / hide | KEEP (multi-branch) | OWNER+CLIENT | P4 | PENDING | | |
| AD-002 | Accounting | Reservation deposit accounting | Dr Cash/Bank → Cr Customer Reservation Advances (Current Liab.); per-payment journal; no AR for remainder | (approved) | ACCOUNTANT (via OWNER) | P1 | **APPROVED** *(account code CONFIGURATION PENDING; final tax config CONFIGURATION REQUIRED, not a blocker)* | Approve flow + account name/classification; code pending | 2026-07-10 |
| CD-026 | Reservation | Multiple partial payments | open count; independent receipt + journal each; block overpayment; no sale invoice per payment; no edit/delete (reverse/refund only); no partial refund while active | (approved) | CLIENT (via OWNER) | P1 | **APPROVED** | Approved as stated | 2026-07-10 |
| CD-027 | Reservation | Expiry & automatic cancellation | per-reservation duration by authorized salesperson; store expiry datetime; **no grace**; auto-cancel → asset Available, status "Cancelled — Refund Pending", notify; cancellation posts no journal | (approved) | OWNER+CLIENT | P1 | **APPROVED** | Approved as stated | 2026-07-10 |
| CD-028 | Reservation | Refund policy | all payments fully refundable, no fees; Dr Reservation Advances → Cr Cash/Bank; refund method may differ (needs extra approval); **approve-refund permission separate from execute-refund**; from employee settings | (approved) | CLIENT + ACCOUNTANT (via OWNER) | P1 | **APPROVED** | Approved as stated | 2026-07-10 |
| CD-029 | Reservation | Renewal & repricing | extend before expiry (keep old+new history); after expiry no reopen — new reservation at current price, linked to old, transfer prior payments via documented settlement, no history deletion; higher price → add difference; lower than paid → refund difference first | (approved) | OWNER+CLIENT | P1 | **APPROVED** | Approved as stated; item-change prohibition superseded by CD-030 | 2026-07-10 |
| CD-030 | Reservation | Multi-item reservation and item add/remove/replace | reservation may contain one or multiple items; authorized users may add before final sale, remove an item from a multi-item reservation, or replace one reserved item with another; added items become Reserved; removed/replaced items return Available; recalc total/paid/remaining/excess after every change; increased total adds to remaining; total below paid requires excess refund before completion; prior payment records immutable; final invoice contains only current reservation items; audit trail captures before/after, employee, datetime, reason, item IDs, and price changes | (approved) | OWNER+CLIENT | P1 | **APPROVED** | Supersedes previous no-item-change rule | 2026-07-10 |
| SD-008 | Reservation | Permissions & notifications | authorized salesperson sets duration/creates; authorized staff notified on expiry; separate approve vs execute refund; add/remove/replace item operations require authorized users and full audit trail | (approved) | OWNER+CLIENT | P2 | **APPROVED** *(permission assignments CONFIGURATION PENDING in employee settings)* | Approved as stated | 2026-07-10 |
| AD-003 | Accounting/Reports | Customer statement reservation advances print/export layout deferral | A defer print/export / B implement now | A | OWNER | P1 | **APPROVED** *(explicitly approved to defer statement advances print/export to later phase)* | Deferred print/export | 2026-07-13 |

## Response Evidence
**RE-001** — Owner-supplied consolidated client/accountant approval (date **2026-07-10**). Authority per owner: CLIENT decisions confirmed by OWNER; ACCOUNTING decisions confirmed as accountant-approved by OWNER; OWNER decisions approved directly. Scope of RE-001 is **reservations & reservation customer-deposit accounting only** (AD-002, CD-026…CD-030, SD-008). RE-001 does **not** close the earlier deposit-**invoice** decision **AD-001** (unpaid remainder GL for deposit invoices) — that remains PENDING, though RE-001 confirms the same "remainder not posted to AR" principle for reservations. Answers are recorded **exactly** as stated; account code and final tax/permission configuration remain PENDING CONFIGURATION and are not requirement blockers. CD-030 is the latest approved multi-item amendment and supersedes the earlier no-item-change rule.

**Status:** all non-reservation decisions remain PENDING. Reservation decisions are APPROVED (implementation not started). Removal is never scheduled before a Hide-first validation + dependency-proof audit.

## Phase 32.6-Post-C Decision Addendum (owner-approved)

- **PC-001 (initial payment):** A **manually created reservation must start with an initial payment
  greater than zero** (and ≤ reservation total). Reservations may never be created with a zero/
  missing initial payment. The amount is agreed individually with the customer. **APPROVED** —
  supersedes any earlier behavior that allowed manual reservation creation without an initial
  payment. This rule applies to user/manual creation only; internal Fix C renewal successors
  (funded by advance transfer) are exempt. Implemented in Phase 32.6-Post-C.
- **PC-002 (later payments):** Later reservation payments remain **unlimited and unscheduled** —
  any amount ≤ remaining, any timing before expiry, each with its own receipt/journal. **No**
  installment schedule, due-date table, or recurrence. **APPROVED**.
- **PC-003 (accounting configuration):** The **Reservation Advances Account** (`reservationAdvancesAccountId`)
  is configured through Accounting Settings (active credit-nature liability accounts only, backend
  re-validated). No account code is hardcoded; no silent fallback. Reservation payments post Dr
  Cash/Bank / Cr Reservation Advances only. **APPROVED**.
- **PC-004 (POS deposit):** The POS `Deposit / عربون` action **creates a reservation, not a sales
  invoice**, through the dedicated reservation API. **APPROVED**.
# DR-32.6-FD-FINAL — Reservation governance final contract closure (2026-07-13)

- Reservation report JSON pagination is standardized at page 1, limit 50, maximum 100, with `{ total, page, limit, pages }`.
- Invalid pagination returns `422 VALIDATION_FAILED`; totals are full-filter totals; ordering is deterministic; authorized export is complete and unpaginated.
- Authenticated company/branch/own visibility is the maximum scope. Query filters narrow only, and the same scope governs rows, totals, counts, pages, reconciliation balances, diagnostics, and exports.
- Reservation advances account configuration accepts the granular permission or broad settings fallback, validates active same-company posting liability/credit accounts before mutation, and rejects invalid or mixed payloads atomically without success audit.
- Repricing requires `reservations.reprice_items`; mixed amendment/repricing requests require both applicable authorities.
- Behavioral closure evidence includes exact permission denials, all nine report contracts, reconciliation mismatch and reconciled rows, 45/45 static verifiers, and zero namespace pollution.
- MANUAL UI QA REQUIRED.

# DR-33B — Gold Purchase draft foundation (2026-07-13)

- **APPROVED/IMPLEMENTED:** CGP and IGP are separate aggregates with separate temporary
  company-scoped draft numbering. They are not reinterpretations of legacy gold pools or
  purchase orders.
- **APPROVED/IMPLEMENTED:** Phase 33B active states are `draft` and `validated`; delete means
  audited soft void. Editing a validated draft returns it to draft.
- **APPROVED/IMPLEMENTED:** IGP initial types are physical gold, serialized bullion, and
  bullion lots. Pool and custom investment remain deferred.
- **APPROVED/IMPLEMENTED:** Storage precision is weight 6, purity/fineness 6, exchange rate 8,
  proposed money 4 decimals. Only net and pure-gold weight formulas are authoritative here.
- **TRANSITIONAL:** Existing Sales and Supplier permissions protect draft operations only.
- **OWNER DECISION REQUIRED BEFORE PHASE 33C:** dedicated CGP/IGP permission matrix and
  maker-checker boundaries.
- **ACCOUNTANT/CLIENT DECISION REQUIRED BEFORE PHASE 33D:** final price basis, tax/VAT/RCM,
  valuation, account categories, settlement, payments, returns, and reversals.
- **EXPLICITLY DEFERRED:** posting, receipt, assets, barcodes, inventory, liquidity transfer,
  transformation, withdrawal, attachments/documents, and final reporting.
- MANUAL UI QA REQUIRED.

# DR-33C — Gold Purchase approval governance (2026-07-14)

- **APPROVED/IMPLEMENTED:** Exact 11-key CGP and 11-key IGP permission sets; module view plus `view_all > view_branch > view_own` scope precedence.
- **APPROVED/IMPLEMENTED:** One-level maker–checker. Creator/submitter self-review is forbidden; reviewers require dedicated approve/reject plus branch/all visibility.
- **APPROVED/IMPLEMENTED:** `draft → validated → submitted → approved`, with rejection returning to draft while preserving immutable approval history.
- **APPROVED/IMPLEMENTED:** Canonical submitted JSONB snapshot with SHA-256 hash, optimistic versions, idempotent commands, one pending request, and serialized terminal review.
- **APPROVED/IMPLEMENTED:** Approved documents are immutable; explicit revision creates a linked new draft and never mutates the source.
- **TRANSITIONAL:** Phase 33B Sales/Supplier permissions remain draft-operation fallbacks only; they never authorize submit/review/revision.
- **EXPLICITLY DEFERRED:** all posting, receipt, asset/barcode, inventory, accounting, treasury, payment, return/reversal, withdrawal, liquidity-transfer, and transformation behavior.
- **ACCOUNTANT/CLIENT DECISION REQUIRED BEFORE PHASE 33D:** final price, VAT/RCM/tax, valuation, account categories, settlements, payments, returns, and reversals.
- Application `be14c304472c86e776be41646d4d7aeb5dfca059`; verifier `007435c991abeb8f0bed5b35b48439188db8f15d`; 47/47 static verifiers and gated HTTP workflow pass with zero pollution.
- MANUAL UI QA REQUIRED.
