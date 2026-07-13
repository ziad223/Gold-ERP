# DARFUS Jewellery ERP — Client Scope Lock

**Phase 31.1** — established from the Phase 31.0 Client Scope Cleanup & Alignment Audit.
This document is the alignment contract between the delivered system and the client's
requirement files. It is read-only guidance for future phases; it changes no code or data.

> **Phase 32.6-Reservation-Audit (docs-only):** current `/sales/reservations` is confirmed as
> **not client-aligned** with RE-001. It is a legacy single-item reservation screen using generic
> `/reservations` CRUD, a separate asset-status PATCH, and optional deposit-invoice creation. This
> must not be treated as approved reservation accounting. The approved client/accountant scope still
> requires: one/many reservation items, atomic reservation creation, multiple immutable payments with
> independent receipts/journals, configured Customer Reservation Advances liability, no AR/revenue/VAT/
> COGS before final sale, reservation-bound Complete Sale with advance settlement, exact expiry to
> Cancelled — Refund Pending, separate refund approval/execution, renewal/successor links, item
> add/remove/replace audit, granular permissions, notifications, reports, and a customer-statement
> reservation section. Existing reusable internal infrastructure (posting engine, idempotency,
> audit logs, notifications, POS/invoice posting) should be reused only where semantics match. Next
> phase: **Phase 32.6-Fix A — Reservation Core Data Model & Atomic Accounting Foundation**.
>
> **Phase 32.5-Requirements-Delta (docs-only):** source set 27 → **30 files** (+`9- Audit System`,
> `10 - Reports`, `11- Setting`; prior files SHA-256-unchanged). **Reservation decisions APPROVED**
> (evidence RE-001, 2026-07-10): reservations are operational documents — asset stays Reserved,
> remainder never posted to AR; per-payment receipts + journals to a new **Customer Reservation
> Advances** liability (account code pending); auto-expiry/cancel + full refund with separate
> approve/execute permissions; renewal/repricing; multi-item reservations are approved (one/many
> items; authorized add/remove/replace before final sale; item statuses and totals recalculate; excess
> paid is refunded before completion; payment history immutable; final invoice uses only current items;
> audit trail required), superseding the older no-item-change rule; VAT-inclusive, no double VAT. Implementation NOT
> started; next phase = Phase 32.6-Reservation-Audit. Audit/Reports/Settings mostly internal/partial.
> No code/DB/requirement-source changes.
>
> **Phase 32.5-Client-Confirmation-Hotfix (test-only):** `scripts/verify-client-demo-data.js`
> no longer diffs every future commit against the frozen Phase 32.4-Run-C baseline
> `02f870a` in default mode (that made the approved Phase 32.5 clarification docs fail).
> Default mode now inspects only the current working tree; the phase-scoped allow-list is
> enforced only in explicit historical scope-audit mode
> (`VERIFY_CLIENT_DEMO_SCOPE_BASELINE=<git-ref>`). Functional/static/live demo-data
> assertions and the read-only live gates (`VERIFY_CLIENT_DEMO_LIVE`/`VERIFY_DATABASE_NAME`)
> are unchanged. No application/database/requirement changes.

---

## 1. Source of Truth

The **client requirement files** (external, read-only, at `H:\WORK\client-requirements`) are the
**source of truth** for scope. The currently implemented DARFUS Jewellery ERP must be **aligned to
the client scope** — features are kept, hidden, deferred, or (only with explicit approval and a
dependency check) removed based on that scope, not on the internal Phase 30 diagnostic track (which
is now **paused**).

---

## 2. In Scope — Customer Facing (client-requested)

- Sales invoice
- Sales return
- Exchange invoice
- Installments invoice
- Deposit invoice
- Gift voucher invoice
- Customer gold purchase invoice
- Invoices Search & Print
- Inventory: Gold by Weight
- Inventory: Gold by Piece
- Inventory: Diamond
- Inventory: Gem Stone
- Inventory: Pearl
- Gold Purchase CGP / IGP
- Barcode / RFID
- Accounting
- Treasury
- General Ledger
- VAT
- AR / Customer Statement
- AP / Suppliers
- Dashboard
- Customers / CRM
- Employees
- Reports
- Transfers
- Gold Center
- Security / permissions
- UAE Government E-Invoicing
- Offline / Hybrid

---

## 3. Internal Only (keep; not a client-facing deliverable)

- posting engine
- journal posting services
- audit logging
- permission guards
- idempotency
- reconciliation services
- statement reconciliation diagnostic
- full-2300 diagnostic
- verifier scripts
- production data-source guards

These are load-bearing infrastructure. They must remain even though the client did not "request"
them by name — they guarantee correctness, safety, and compliance of the in-scope features.

---

## 4. Hidden Until Sign-off (accounting-sensitive; present in code, gated off in UI)

- statement-v3 toggle
- customer credit reconciliation panel
- full-2300 diagnostic/report UI (if ever exposed)
- any customer-facing 2300 breakdown

**Reason:** Accounting-sensitive and not approved for customer-facing display yet.

**Mechanism:** `app/[locale]/(dashboard)/customers/[id]/page.tsx` gates these behind
`const SHOW_ACCOUNTING_SENSITIVE_DIAGNOSTICS = false;`. The components, queries, repository methods,
and backend endpoints are **kept intact** — only their entry points are not rendered by default.
Flip the flag to `true` **only after accounting sign-off**.

---

## 5. Deferred / Needs Client Sign-off

- Repair Delivery invoice flow
- first-class Diamond / Gem Stone / Pearl item-type forms
- IGP module
- barcode exact tag conformance (`INVENTORY CODE + ITEM CODE + KT + SERIAL`)
- offline / hybrid sync
- CRM segmentation / communication / analytics
- Employees KPI / performance
- manufacturing (if not confirmed in scope)
- reservations (if not confirmed in scope)

---

## 6. Needs Accounting Sign-off

- UAE Government E-Invoicing VAT / UBL mapping
- statement-v3 customer-facing display
- full 2300 customer-facing report
- customerId / supplierId dimension in journal entries / lines
- historical 2300 reclassification
- gold-pool liability presentation
- POS customer-credit payment

---

## 7. Do Not Remove Without Explicit Approval

- posting engine
- audit logs
- permission system
- idempotency
- diagnostic services
- verifiers
- reconciliation services
- journal services

Removing any of these requires explicit written approval **and** a dependency check proving disuse.
Per Phase 31.0, **no feature is currently proven safe to delete**.

---

## Notes

- **Phase 30 accounting-diagnostic track is paused.**
- **UAE Government E-Invoicing** remains the highest-value missing requirement (**P0**) but is **not**
  implemented in this phase; it requires a dedicated scope + accounting/client sign-off phase.
- This phase performed **no deletions** and **no backend accounting/posting/balance changes**.

---

## Phase 31.4-Fix — Unified Invoices Search & Print

Added/aligned the dedicated customer-facing `/sales/search-print` layer with a
read-only GET endpoint. It supports search/view/print only and does not create,
update, delete, post, cancel, settle, pay, refund, seed, reset, or migrate data.

Supported real invoice-row types are sale, return, exchange, installment, and
deposit. Gift vouchers and customer-gold purchases remain in their existing
modules because they are not stored as invoice rows in the current schema.
Employee/salesperson filtering is explicitly unavailable because that field is
not stored on invoices. `Closed` is derived for display from an already-posted,
fully paid invoice; no status enum or migration was added.

Existing Luxury/default, Compact, Minimal, and Thermal print templates were
preserved. Existing trusted exchange-display print behavior and normal invoice
print behavior were preserved. No accounting/posting/balance/VAT logic or
mutation route changed. Statement-v3, the customer credit reconciliation panel,
and full-2300 diagnostics remain hidden/non-customer-facing. UAE E-Invoicing
remains deferred. Event-sourcing/projection architecture was not implemented;
the current relational/audit architecture is retained.

---

## Phase 32.1-Fix — Editable Barcode + Inventory Foundation

Barcode taxonomy is now company-scoped and database-backed, with authorized
management at `/settings/barcode-codes`. Initial inventory codes are GW, GP,
DD, GS, PL, and WT. Item codes use the authoritative 18-code client table plus
WCH. Used code values are locked to protect historical barcodes and printed
tags; replacement means creating a new code and deactivating the old one.

The stored target format is uppercase, separator-free
`INVENTORY + ITEM + KT + six-digit SERIAL`. Sequence scope is company +
inventory code + item code + karat code. Asset remains the aggregate root and
gains nullable identity components, inventory subtype, metadata schema version,
and JSONB metadata without removing or repurposing existing fields.

Owner scope override: Watch stays visible and system-supported using provisional
`WT/WCH/00`. It is active, provisional, and client-unapproved, documented as an
owner-approved provisional system extension pending client confirmation. Loose
diamond/gem/pearl records require a real karat or an explicitly configured
default KT; no silent fallback is invented.

RFID remains optional / future-ready only. No RFID hardware integration or real
scanning claim was introduced. No demo data reset or seed rewrite occurred.
Production reset remains forbidden. Existing barcodes were not backfilled or
rewritten. Posting/accounting/VAT/COGS/statements, POS, return/exchange submit,
exchange display/print safety, and invoice templates remain unchanged. UAE
E-Invoicing remains deferred.

---

## Phase 32.1-Hotfix — Refresh Invoices Search & Print Verifier Scope Guard

Test-only maintenance: refreshed the stale working-tree scope guard in
`scripts/verify-invoices-search-print.js`. It had pinned its baseline to the
Phase 31.4 base (`8169bfe`) with a rigid allowed-files whitelist, which wrongly
rejected already-approved Phase 32.1 barcode-foundation files simply because they
were introduced after `8169bfe`. The guard now tracks the current approved
baseline (`0a7b7ce`) and rejects changed files only when they touch a protected
accounting/posting/journal/reconciliation/customer-credit area, delete a file, or
introduce UAE E-Invoicing / event-sourcing.

No product, business, barcode-foundation, accounting/posting, print, or
Search & Print behavior changed. Hidden diagnostics (statement-v3, customer credit
reconciliation panel, full-2300) remain non-customer-facing. UAE E-Invoicing
remains deferred.

---

## Phase 32.4-Run — Owner Gate + Backup Readiness (reset NOT executed)

Owner confirmed the local `darfus_erp` is demo-only/disposable. The reset guard now
gates `darfus_erp` behind the full owner confirmation (`OWNER_CONFIRMED_DEMO_ONLY=true`
+ the three base gates + local host), rejects remote/managed providers, and refuses
without a working backup (host `pg_dump` or the local Docker Postgres). The Docker
backup mechanism was proven non-destructively (1.49 MB dump; DB intact). A
deterministic client-demo **inventory** seeder (`backend/seeders/client-demo/`,
`client-demo-v1`) was authored via the canonical barcode service (10 variants,
idempotent, accounting-neutral); loose-item KT is a configured demo assumption
pending client confirmation.

**The destructive reset was NOT executed** — the service-driven transactional/
accounting seed workflow is not yet complete/reviewed, and per the run precondition
the seed source must be complete first. Production/Render untouched; no business
code changed; production reset remains forbidden; UAE E-Invoicing deferred.

---

## Phase 32.4-Hotfix — Refresh Barcode Foundation Verifier Reset Guard

Test-only: refreshed the stale `/reset/i` scope guard in
`scripts/verify-barcode-inventory-foundation.js` (baseline → `1a6c76f`) so the
approved, environment-gated Phase 32.4 demo-reset tooling is allowed while
unsafe/production reset and historical-barcode backfill tooling stay forbidden.
No product/business code changed; no database operation executed; functional
barcode assertions unchanged; production reset remains forbidden.

---

## Phase 32.4-Fix — Guarded Client-Demo Data Reset (tooling only)

Added a guarded, safety-gated **client-demo reset process** (`scripts/reset-client-demo-data.js`
+ `scripts/verify-client-demo-data.js`) — tooling and docs only. **No reset,
migration, or seed was executed.** The reset refuses unless a dedicated,
disposable demo database is positively verified (dedicated demo-name allow-rule,
production host/name rejection) AND the operator opts in with
`ALLOW_CLIENT_DEMO_RESET=true`, `RESET_TARGET=demo`, and a matching
`CONFIRM_DATABASE_NAME`. It backs up before any reset and never prints secrets.

In this workspace the only configured DB is the **general development database**
`darfus_erp` (not a dedicated demo DB), so the gate correctly blocked execution.
**Production reset remains forbidden.** No accounting/posting/sales/return/exchange/
print/barcode-generator/inventory-form business code changed; hidden diagnostics
stay hidden; UAE E-Invoicing remains deferred. Watch stays provisional (WT/WCH/00);
loose-item KT stays a demo-configured assumption pending client confirmation.

---

## Phase 32.3-Fix — Client Barcode Tag Front/Back Layouts

Added client-aligned **front/back barcode tag layouts** for serialized Assets,
reusing the existing print engine (additive — the generic `BarcodePrintTemplate`
and Product label flow are preserved). Type-specific back faces for Gold By
Weight/Piece, Diamond (J/Loose), Gem Stone (J/Loose), Pearl (J/Loose), and Watch
(owner-approved provisional). Price policy: Gold By Weight hides price; other client
types show it; Watch configurable. The printed barcode equals the stored
`asset.barcode`; the browser never allocates/regenerates identity. New tag-display
metadata (`discount`, `stoneWeight`, `minimumMakingCharge`, gemstone `stones` array)
is captured through the existing Phase 32.2 forms with no migration (metadata JSONB
already exists) — tag presentation only, never affecting invoice discount/COGS.

Physical tag dimensions and printer hardware remain configurable / pending client
confirmation (default 62mm × 28mm; duplex method left to the printer). No DB
migration, seeds, reset, backend, accounting/posting, sales/return/exchange, or
invoice-print changes. Hidden diagnostics remain non-customer-facing. Production
reset remains forbidden. UAE E-Invoicing remains deferred.

---

## Phase 32.2-Fix — Inventory Item-Type Forms

Added the client-aligned, type-driven inventory item Add/Edit form for **Gold By
Weight, Gold By Piece, Diamond, Gem Stone, Pearl, and Watch**, aligning the
existing `/inventory` Add flow to the client's item-type model. Watch remains an
**owner-approved provisional type pending client confirmation** (WT / WCH / 00).

Type-specific attributes are stored in `Asset.metadata` (JSONB, schema v1) and the
loose/jewellery + 24K/bar distinctions in `inventory_subtype` — no new per-type
tables. The browser never generates the final stored barcode; it only shows a
read-only preview and sends taxonomy (inventory/item/karat) so the backend
allocates the serial + final barcode. Frontend-only alignment: no backend route,
migration, seed, or reset; no posting/accounting/VAT/COGS/statement/customer-credit,
POS, return/exchange, or invoice-print behavior changed. Hidden accounting
diagnostics remain non-customer-facing; UAE E-Invoicing remains deferred.

---

## Phase 32.4-Run-Hotfix B — Implement Trusted HTTP Transactional Demo Seeds

Added trusted, Express-mounted HTTP transactional seeder modules in backend and integrated them into the client-demo reset process.

- All transactional operations (Supplier purchases, POS cash/installment/deposit checkout, returns, exchanges, installments, customer gold, manual journals, gift vouchers, treasury transactions, and customer credit) use authenticated HTTP requests run against an in-process server instance on an ephemeral localhost port.
- No direct database writes (via `bulkCreate`, `bulkInsert`, `Model.create`, etc.) are made in the transactional seeder files. No posting or journal services are bypassed.
- Implemented plan mode (`--plan`) to output a visual, masked dry-run outline of the execution.
- Gated safety validations are added to `verify-client-demo-transactional-seeds.js` to verify no direct DB insertions exist on transactional tables, no random values or credentials are leaked, and the Express app runs in-process.
- No DB reset, migrations, or seeds were executed in this phase.

---

## Phase 32.4-Run-C-Closure — Evidence, Reconciliation & Final Approval Verification

Verified and reconciled the complete post-reset local database state `darfus_erp` without performing any database resets, migrations, seeds, or data mutations during this closure phase.

- Verified that all 30/30 database migrations are applied.
- Inspected the SQL backup dump size (325,609 bytes), backup manifest, and validated the dump header.
- Updated `scripts/verify-client-demo-data.js` to implement live PostgreSQL queries (verifying table counts, active inventory codes, zero-line checks, and balanced trial balances) instead of printing a skipped warning. Ran the live verifier and confirmed it successfully passes.
- Confirmed that the 2 missing assets (`AST-2026-00179` and `AST-2026-00144`) are child assets with non-null `parent_asset_id` values, explaining why they are correctly filtered out on the frontend list which queries standalone assets only (`/assets?standaloneOnly=true`).
- Reconciled 12 invoices (3 legacy, 9 transactional) mapping to exactly 10 invoice items (the 3 legacy invoices have 0 items as designed).
- Validated that all 26 journal entries and 73 journal lines are fully balanced, the global trial balance net difference is exactly `0.00000000`, and no posted journal has zero lines.
- Verified output VAT on account code `2200` (`1597.00000000` net credit) and zero input VAT.
- Reconciled COGS postings on account code `5000` (net debit `21100.00000000`) and matching stock effects. RNG product stock is exactly 10.
- Reconciled cash transactions (14 entries, Cash In: `29232.5000`, Cash Out: `14812.5000`).
- Confirmed supplier balances and verified that `Supplier.due` remains frozen as a reference-only field per Phase 10M containment.
- Verified installments (6 schedule, 2 partially paid, 4 pending), deposit/arbon invoices (1500 cash-in), gift vouchers (500 issue, 200 redeem, 300 balance), and customer gold pool records (4 entries, Khaled's net gold balance: 5g).
- Confirmed returned and exchanged assets retain their original barcodes (`GPERG21000001` and `GWBRC21000002`).
- Ran and passed all 39 verifier scripts in the repository.

## Phase 32.4-Run-C-Hotfix Fix

Deposit/arbon posting now uses the actual resolved received amount for Cash and Customer
Deposits; it never falls back to the invoice total when only a partial deposit was received.
The corrected deterministic demo result is: total 2415, received 1500, cash journal debit
1500, customer-deposit credit 1500, remaining 915. No additional accounting treatment was
invented for the unpaid remainder and customer-balance semantics remain unchanged.

Live demo verification is separately opt-in and read-only via `VERIFY_CLIENT_DEMO_LIVE=true`
and `VERIFY_DATABASE_NAME=darfus_erp`; reset authorization variables are not needed. Requested
live checks fail when skipped, disconnected, remote, or pointed at the wrong database. The
focused deposit verifier is registered as `verify:deposit-posting-reconciliation`.

The owner-confirmed local demo database was rebuilt through the guarded reset using backup
`backups/client-demo/2026-07-10T14-00-46-106Z`; production/Render and all stashes were untouched.
The exchange demo note was corrected descriptively to match the existing gemstone-necklace
replacement. Existing sales/return/exchange, supplier, VAT/COGS, barcode, inventory, print,
statement-v3/full-2300 visibility, and UAE E-Invoicing scope remain protected or deferred.

## Phase 32.4-Run-C-Hotfix 2

Final local browser/API smoke verification completed against only the owner-confirmed local
demo stack (`localhost:3000`, `localhost:8000`, Docker `darfus-postgres`, database
`darfus_erp` on port 5433). No reset, seed, migration, direct DB mutation, or business
mutation request was executed. Browser login used the fictional seeded demo administrator;
credentials, cookies, and tokens were not documented.

Customer-facing smoke coverage passed for dashboard, inventory, barcode settings, Invoices
Search & Print, sales, returns, exchanges, installments, gift vouchers, customer gold, and
customer statement-v2. Authenticated GET API smoke passed for the matching read-only
resources, including exchange-display enrichment and treasury summary. Deposit/arbon values
are consistent across DB/API/UI: total 2415, received 1500, remaining 915; treasury/journal
evidence no longer implies 2415 cash received.

Journal status wording is clarified: `balanced` is an actual stored journal status for two
non-posted entries, while all 23 posted journals are mathematically balanced. Posted journal
summary: 23 balanced, 0 unbalanced, 0 zero-line; global debit and credit both equal
176142.00000000.

The unpaid deposit remainder is currently represented by `Invoice.remainingAmount` and the
operational `Customer.balance` AR mirror. The deposit journal does not post an AR 1300 line
for the unpaid remainder. This is documented as the existing approved repository behavior;
formal accounting sign-off remains required if the client/accountant wants a different GL
treatment for deposit remainders.

Verification: 40/40 verifier scripts passed with live data checks executed and not skipped;
`typecheck` passed; `lint` passed with 0 errors and 19 existing warnings; `build` passed.
Physical printer/DPI validation remains untested. Statement-v3, full-2300 diagnostics,
customer reconciliation panels, UAE E-Invoicing, production/Render, and the 11 stashes remain
protected/untouched.
## Phase 32.6-Fix A — Reservation Core Foundation Scope Lock

Implemented only the reservation core foundation:

- additive reservation schema fields
- `reservation_items`
- `reservation_payments`
- atomic reservation creation
- immutable reservation payment posting foundation
- configured Customer Reservation Advances account via `reservationAdvancesAccountId`
- dedicated reservation routes/service
- minimal frontend safety changes
- focused verifier

Protected/deferred:

- final sale completion
- reservation-to-invoice settlement
- refund approval/execution
- automatic expiry scheduler
- renewal
- post-creation add/remove/replace item workflows
- reservation reports
- customer-statement reservation section
- notification workflows
- full granular reservation permissions
- full multi-item reservation UI

Reservation advances accounting remains configuration-driven. No hardcoded `2300` fallback was
introduced. Reservation payments do not post VAT, revenue, AR, COGS, inventory, customer-credit,
or deposit income before final sale. Existing print templates, exchange safety, statement-v3,
full-2300 diagnostics, UAE E-Invoicing deferral, and production/Render boundaries remain
unchanged.

## Phase 32.6-Fix-A-Hotfix — Verifier Scope Closure

This hotfix changes only verifier/tooling documentation scope. It does not modify reservation
business behavior, reservation migrations, accounting posting, frontend reservation flow, or
database records.

`verify-barcode-tag-print-layouts.js` no longer uses the old barcode-phase baseline `c21b20d`
automatically in default global-suite mode. Default mode preserves barcode functional/static/
layout assertions and checks current working-tree safety only. Historical barcode-phase scope
checking remains available by explicitly setting:

`VERIFY_BARCODE_TAG_SCOPE_BASELINE=<git-ref>`

Invalid refs fail non-zero. Explicit historical mode prints the selected baseline and enforces
the original historical allow-list/deletion checks. This keeps barcode audit capability without
blocking approved later phases such as Phase 32.6-Fix A.

## Phase 32.6-Fix-A-Hotfix-2 — Remaining Stale Verifier Scope Guards

This is a verifier/tooling-only closure hotfix. Fix A implementation commit remains
`13ab543dbf74d59077eed3238de9d4be746c09e3`, and the first verifier hotfix commit remains
`f90a1558af870d1592582c5b073ddd4df27cd384`.

The remaining stale historical baseline guards were normalized in:
- `scripts/verify-barcode-inventory-foundation.js`
- `scripts/verify-inventory-item-type-forms.js`
- `scripts/verify-invoices-search-print.js`

Default verifier mode preserves all functional assertions and checks only current
working-tree safety. Historical phase scope checks require explicit opt-in:
- `VERIFY_BARCODE_INVENTORY_SCOPE_BASELINE=<git-ref>`
- `VERIFY_INVENTORY_ITEM_TYPE_SCOPE_BASELINE=<git-ref>`
- `VERIFY_INVOICES_SEARCH_PRINT_SCOPE_BASELINE=<git-ref>`

Invalid refs fail non-zero; explicit historical mode prints the chosen baseline and enforces
the original historical deletion/out-of-scope rules. No application source, reservation
source, reservation migration, accounting source, database record, Production/Render target,
or stash was changed. Phase 32.6-Fix B remains deferred.

## Phase 32.6-Fix B — Final Sale Completion & Refund Settlement Scope Lock

Implemented only the approved completion/refund layer after Fix A:

- Fully paid new-workflow reservations may be completed as one atomic final sale.
- The final sales invoice is generated from current active reservation items only.
- Posted reservation payments are applied through immutable
  `reservation_payment_applications`; original reservation payment rows remain historical.
- Invoice accounting stays on the established `postInvoiceEntry` path for sales, VAT,
  COGS, and inventory. A separate reservation settlement journal debits configured Customer
  Reservation Advances and credits AR/customer control.
- Assets and reservation items become Sold during completion.
- A reservation links to at most one final invoice; duplicate completion is blocked.
- Manual cancellation releases reserved assets. Paid cancellations become
  `cancelled_refund_pending`; unpaid cancellations become `cancelled`.
- Refund request, approval/rejection, and execution are separate.
- Refund execution debits configured Customer Reservation Advances and credits selected
  Cash/Bank only. It does not post sales reversal, VAT reversal, COGS reversal, inventory
  movement, or AR movement.
- Refunds are full only; partial, duplicate, excessive, unapproved, and completed-reservation
  refunds are blocked.
- Approval and execution permissions are separated (`approvals.manage` versus
  `treasury.update`).

Still out of scope and not implemented:

- automatic expiry scheduler
- expiry notifications
- renewal/successor reservations
- payment transfer between reservations
- add/remove/replace item workflows after reservation creation
- active reservation repricing
- full reservation reporting
- reservation section in customer statements
- full granular reservation permission matrix
- full reservation UI redesign
- UAE E-Invoicing

Production/Render, stashes, requirement-source files, customer-credit logic, statement
services, exchange safety, and print templates remain protected.

### Phase 32.6-Fix-B-Closure lock

Closure work (commit `feat: close reservation completion refund workflow`) stays within the
approved completion/refund layer and adds only:

- A VAT-inclusive completion correction — the agreed reservation price is treated as
  VAT-inclusive; net and VAT are extracted from the gross total rather than added on top.
  No second VAT layer is posted.
- An additive, forward-only stock-movement schema change (`asset_id` on `stock_movements`)
  so a serialized asset sale posts exactly one inventory-out movement. Existing product-backed
  movements are preserved.
- Permission-aware minimal frontend wiring on `/sales/reservations` using dedicated endpoints
  only, submitting no trusted financial values.
- A gated local live verifier (`darfus_erp@localhost:5433`) that self-cleans its namespace.

No repricing, multi-item change, expiry, renewal, reporting, customer-statement, notification,
or full permission-matrix behavior is introduced. Migrations created no business records.
Production/Render, remote databases, and the 11 stashes were not touched. Full detail lives in
`docs/client-requirements/PHASE-32.6-FIX-B.md`.

## Phase 32.6-Fix C — Multi-Item Changes, Automatic Expiry & Renewal Scope Lock

Implemented only the approved reservation lifecycle layer after Fix B (commit `feat: add
reservation amendments expiry and renewal`; detail in
`docs/client-requirements/PHASE-32.6-FIX-C.md`):

- **Item amendment** (add / remove / replace / reprice) on active reservations via a dedicated
  atomic endpoint. Prices are server-resolved from asset records; the client submits only asset
  ids. Totals/status are recomputed server-side; an amendment that would leave total below paid or
  leave zero active items is rejected. Removed/replaced items are preserved as `released`; original
  payments are never edited. No sales/VAT/AR/COGS/inventory/cash/advance posting.
- **Expiry extension** (later-only, before the trusted-time expiry) with immutable history and no
  financial posting.
- **Automatic expiry** with no grace period, reusing the approved cancellation release path via a
  `SKIP LOCKED`, per-row, multi-worker-safe scheduler. Assets released; payments preserved; no
  refund/sale/journal; paid→refund-pending, unpaid→cancelled; fully paid is not auto-completed.
- **Renewal** of automatically expired reservations into a linked successor at current server
  prices, transferring the eligible advance via an immutable transfer subledger with **no GL
  journal** (Advances account, customer, branch, company, currency unchanged) and no cash movement.
- **Renewal-excess refund** (distinct `renewal_excess` type) reusing the Fix B Dr Advances / Cr
  Cash posting, with separate approval/execution and full rollback safety, before successor
  activation.

Out of scope and not implemented: full granular permission matrix, notification delivery,
reservation reports, customer-statement reservation section, full UI redesign, cross-company/
branch/currency renewal, partial active-reservation refunds, automatic financial refund at expiry,
automatic sale completion at expiry. Migrations created no business records. Production/Render,
remote databases, and the 11 stashes remain protected and untouched.

## Phase 32.6-Post-C — POS Reservation Deposit & Accounting Configuration Scope Lock

Implemented only the approved POS/reservation deposit wiring and accounting configuration (commit
`feat: wire POS reservation deposits and account configuration`; detail in
`docs/client-requirements/PHASE-32.6-POST-C-POS-RESERVATION.md`):

- The `reservationAdvancesAccountId` setting is configurable from Accounting Settings (active
  credit-nature liability accounts only; backend re-validated). No account code is hardcoded; no
  silent fallback; stable-coded bilingual 422 errors.
- A manually created reservation requires an **initial payment > 0** (and ≤ total) and a payment
  method; later payments stay unlimited and unscheduled with no installment schedule or due-date
  table. The rule applies only to the manual path; internal renewal successors are unaffected.
- Initial and later reservation payments post **Dr Cash/Bank / Cr Reservation Advances** only; no
  sales/VAT/AR/COGS/inventory posting before final sale; the unpaid balance is operational, not AR.
- The POS `Deposit / عربون` action creates a reservation via the dedicated reservation API — never
  a sales invoice — submitting only asset ids and operational fields (no trusted totals/journal
  lines/account). Missing configuration disables reservation confirmation while the normal sale path
  remains available.

Out of scope: fixed installment schedules, full permission matrix, reports, customer-statement
reservation section, notification workflows, full UI redesign, mobile reservation flow, any new
accounting policy beyond the reservation advances account. No migration was required and no business
records were created. Production/Render, remote databases, and the 11 stashes remain untouched.

## Phase 32.6-Fix D — Reservation Governance/UI Scope Lock

Implemented only the approved reservation governance, reporting, statement, notification, and UI
layer after Fix A/B/C/Post-C:

- Granular reservation permission keys are now registered for viewing scopes, creation, payment
  recording, completion, cancellation, amendments/repricing, expiry extension, renewal, refund
  request/approval/rejection/execution, audit view, report view/export, statement view, and
  configuration. Legacy `sales.*`, `approvals.manage`, `treasury.update`, `reports.*`,
  `audit.view`, and `customers.view` are preserved as transitional fallbacks only.
- Reservation list/detail reads now have a row-visibility foundation for all-company, branch, and
  own-scope access.
- `GET /reservations/:id/audit-timeline` exposes read-only immutable reservation audit events.
- Reservation notifications carry optional source metadata and an event-key dedupe guard.
- Read-only reservation reports were added for summary, payments, and operational advances
  reconciliation.
- Statement-v2 contains a separate `reservationAdvances` section (`دفعات الحجوزات`) and does not
  merge reservation payments into AR.
- `/sales/reservations` now exposes granular-permission action gating, later payments, centralized
  status labels, audit timeline, and reservation report links.

Fix D does **not** change reservation payment posting, final sale posting, refund posting, VAT,
COGS, POS checkout sales, customer-credit logic, statement services, print templates, UAE
E-Invoicing, Production/Render, or remote databases. It does not start any post-Fix-D phase.

Still deferred: final employee/role assignment matrix, notification recipient/escalation rules,
full export formatting, full reservation report UI, printable statement reservation section,
mobile workflow polish, and physical printer validation.
