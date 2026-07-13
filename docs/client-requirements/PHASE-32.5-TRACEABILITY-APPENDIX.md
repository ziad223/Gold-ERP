# Phase 32.5 — Traceability Appendix (Technical / Internal)

Durable evidence for implementation. Source = frozen snapshot (`PHASE-32.5-SOURCE-MANIFEST.md`).

---

## Appendix A — Full CR Register

| CR | Domain | Source | Requirement | Explicit/Implied | Conf | Conflict |
|---|---|---|---|---|---|---|
| CR-001 | Sales | 0/1-Sales | Sales invoice: create → decrement stock → post journal on approval | Explicit | High | — |
| CR-002 | Sales | 0-Sales | 8 invoice types incl. repair-delivery + cancel-before-post | Explicit | High | — |
| CR-003 | Return | 2-Return | Sales return + settlement | Explicit | High | — |
| CR-004 | Exchange | 3-Exchange | Exchange; VAT on **new item only** | Explicit | High | — |
| CR-005 | Installments | 4-Installments | Installment sale + guarantor + schedule | Explicit | High | — |
| CR-006 | Deposit | 5-Deposit | Deposit/arbon as deferred liability | Explicit | High | AD-001 |
| CR-007 | GiftVoucher | 6-GiftVoucher | Voucher issue/redeem liability | Explicit | High | — |
| CR-008 | CGP | 7-CGP / 6-CGP-IGP | Customer gold purchase | Explicit | High | — |
| CR-009 | IGP | 6-CGP-IGP | **Supplier** gold purchase (IGP) | Explicit | High | CD-018 |
| CR-010 | Search&Print | 8-Search&Print | Unified read-only search+print, 7 types; filters number/customer/date/branch/employee/type/status | Explicit | High | — |
| CR-011 | Barcode | الباركود | Identity `INVENTORY+ITEM+KT+6-SERIAL`; 5 inv codes + 18 item codes | Explicit | High | CD-004 |
| CR-012 | Barcode | الباركود | Front/back tag content per type; GW hides price; ST/NT/MC/DIS/CC | Explicit | High | — |
| CR-013 | Barcode | الباركود | Barcode immutable; reused only same-item return/exchange; revision v1/v2 | Explicit | High | CD-012 |
| CR-014 | Inventory | 1-GoldWeight + xlsx | GW form: color, pure-gold 999.9/995, gross(scale), stone wt (mandatory), net=gross−stone | Explicit | High | CD-024/025 |
| CR-015 | Inventory | 2-GoldPiece + xlsx | Gold-by-piece form | Explicit | High | — |
| CR-016 | Inventory | 3-Diamond + xlsx | Diamond J(9 sec)/loose(8 sec): carat/color/clarity/cut/shape/cert | Explicit | High | CD-006 |
| CR-017 | Inventory | 4-Gem + xlsx | Gem J/loose: type/carat/color/tone/saturation/cert (multi-stone) | Explicit | High | CD-006 |
| CR-018 | Inventory | 5-Pearl + xlsx | Pearl J/loose: type/size/quality/color/count/overtone/orient/luster/nacre | Explicit | High | CD-006 |
| CR-019 | Inventory | xlsx | 24K/bar variant: certificate cost/name/number; no making charge | Explicit | High | — |
| CR-020 | Inventory | xlsx | Tag section = button-driven barcode/RFID/link/print; 11 statuses | Explicit | High | — |
| CR-021 | Pricing | 1-GoldWeight + xlsx | Sell price = global-vs-retail choice; making-charge/g + min making-charge | Explicit | High | CD-005 |
| CR-022 | Accounting | Accounting(+شامل) | Treasury/GL/VAT(5%)/AR/AP/Revenue/Expense/Asset/Posting/Closing/Audit | Explicit | High | — |
| CR-023 | Gold logic | منطق الذهب | Karat/purity pricing (18/21/22/24), 999.9/995 pure gold | Explicit | High | — |
| CR-024 | Statements | Accounting/AR | Customer statement | Explicit | High | — |
| CR-025 | Dashboard | Dashboard.docx | Consolidated dashboard + market gold price | Explicit | Med | CD-021 |
| CR-026 | CRM | 7-CRM | Loyalty/points, segmentation, communication, analytics | Explicit | Med | CD-019 |
| CR-027 | Employees | 8-Employees | Attendance, payroll, roles, KPI, employee code, activity logs | Explicit | Med | CD-020 |
| CR-028 | POS | POS screenshot | 3-col: customer + **loyalty points**; barcode scan; grid(barcode/desc/karat/weight-g/price-g/total/type); inline exchange line (negative); manual add; split payment (cash+mada); paid/difference; item count + total weight; keyboard shortcuts | Explicit(visual) | High | CD-001/023 |
| CR-029 | Invoice print | Invoice screenshot | Bilingual TAX INVOICE: TRN; per-line VAT 5% column; NET/VAT/TOTAL; payment-method grid (cash/card/bank/other); customer + salesperson signatures; company stamp; footer contact | Explicit(visual) | High | CD-016/017/022 |
| CR-030 | Currency | screenshots | Currency (SAR/AED) | Explicit(conflict) | High | CD-001 |
| CR-031 | Languages | multiple | Arabic + English, RTL/LTR, bilingual print | Explicit | High | — |
| CR-032 | Payments | POS + invoice | Multi-method split payment | Explicit | High | — |
| CR-033 | Gov | (absent) | UAE E-Invoicing | Was explicit; **absent now** | — | CD-002 |

---

## Appendix B — Full SF Register (significant)

| SF | Module | Feature | Evidence | Visibility | Permission | Class |
|---|---|---|---|---|---|---|
| SF-001 | POS | Checkout, split pay | `/pos`, pos/checkout | Visible | sales.create | Client |
| SF-002 | Sales | Invoice list | `/sales` | Visible | sales.view | Client |
| SF-003 | Sales | Search & Print | `/sales/search-print` | Visible | sales.view | Client |
| SF-004 | Sales | Returns | `/sales/returns` | Visible | sales | Client |
| SF-005 | Sales | Exchanges | `/sales/exchanges` | Visible | sales | Client |
| SF-006 | Sales | Installments | `/sales/installments` | Visible | sales | Client |
| SF-007 | Sales | Gift vouchers | `/sales/gift-vouchers` | Visible | sales | Client |
| SF-008 | Sales | Customer gold (CGP) | `/sales/customer-gold` | Visible | sales | Client |
| SF-009 | Sales | Reservations | `/sales/reservations` | Visible | sales | **Extra** |
| SF-010 | Inventory | List + tabs | `/inventory` | Visible | inventory.view | Client |
| SF-011 | Inventory | Item detail | `/inventory/[id]` | Visible | inventory.view | Client |
| SF-012 | Inventory | Type-driven Add-Item | InventoryItemForm | Visible | inventory | Client |
| SF-013 | Inventory | Adjustments | `/inventory/adjustments` | Visible | inventory | Extra/Internal |
| SF-014 | Inventory | Manufacturing | `/inventory/manufacturing` | Visible | inventory | **Extra** |
| SF-015 | Inventory | Stock audit | `/inventory/stock-audit` | Visible | inventory | **Extra** |
| SF-016 | Inventory | Transfers | `/inventory/transfers` | Visible | inventory | Implied |
| SF-017 | Barcode | Settings taxonomy | `/settings/barcode-codes` | Visible | settings | Client |
| SF-018 | Barcode | Identity service | barcode-identity.service | Backend | — | Foundation |
| SF-019 | Print | Generic barcode label | BarcodePrintTemplate | Visible | printBarcode | Client |
| SF-020 | Print | Client front/back tags | ClientBarcodeTagTemplate | Visible | printBarcode | Client |
| SF-021 | Print | Invoice templates ×4 | InvoiceDocument + templates | Visible | — | Client |
| SF-022 | Print | Exchange print summary | ExchangePrintSummary | Visible | — | Client |
| SF-023 | Customers | List/detail | `/customers`(+`[id]`) | Visible | customers.view | Client |
| SF-024 | Customers | Loyalty | `/customers/loyalty` | Visible | customers | Client |
| SF-025 | Suppliers | List/detail/purchases | `/suppliers`(+`[id]`,purchases) | Visible | suppliers.view | Client |
| SF-026 | Accounting | GL/journal/posting | `/accounting`, posting.service | Visible | accounting.view | Client+Foundation |
| SF-027 | Accounting | Treasury | `/accounting/treasury` | Visible | treasury.view | Client |
| SF-028 | Accounting | Statement-v2 | customer page | Visible | — | Client |
| SF-029 | Accounting | Statement-v3 | source-aware-statement | Hidden | flag | Internal diag |
| SF-030 | Accounting | Full-2300 | full-2300-reconciliation | Internal | — | Internal diag |
| SF-031 | Accounting | Credit reconciliation | customer-credit + panel | Hidden | flag/perm | Internal diag |
| SF-032 | Gold | Gold center | `/gold-center` | Visible | gold.view | Client |
| SF-033 | Employees | List/detail/payroll | `/employees`(+`[id]`,payroll) | Visible | payroll.view | Client(partial) |
| SF-034 | Dashboard | Overview | `/dashboard` | Visible | dashboard.view | Client(partial) |
| SF-035 | Reports | Reports + exports + valuation | `/reports`(+exports,inventory-valuation) | Visible | reports.view | Client |
| SF-036 | System | Audit | `/audit` | Visible | audit.view | Foundation |
| SF-037 | System | Approvals | `/approvals` | Visible | approvals.view | **Extra** |
| SF-038 | System | Notifications | `/notifications` | Header | — | **Extra** |
| SF-039 | System | Settings + users | `/settings`(+users) | Visible | settings.view | Client+Foundation |
| SF-040 | Internal | Permissions/idempotency/audit-chain | services | Backend | — | Foundation |
| SF-041 | Internal | Reconciliation services | reconciliation svcs | Backend | — | Foundation |
| SF-042 | Internal | Demo reset guard + seeders | scripts/, seeders/client-demo | CLI | env-gated | Internal/Demo |

---

## Appendix C — CR→SF Matrix

| CR | SF | Status | Gap | Decision |
|---|---|---|---|---|
| CR-001..005,007 | SF-001,002,004,005,006,007 | MATCHED | — | KEEP |
| CR-006 deposit | SF-001,028 | PARTIALLY MATCHED | remainder GL | CLIENT/ACCT (AD-001) |
| CR-008 CGP | SF-008,032 | PARTIALLY MATCHED | lifecycle | KEEP/FIX |
| CR-009 IGP | — | MISSING | no supplier-gold flow | ADD (CD-018) |
| CR-010 search&print | SF-003 | MATCHED | — | KEEP |
| CR-011..013 barcode | SF-017,018,020 | MATCHED | display format | KEEP (CD-004/012) |
| CR-014..020 item forms | SF-010,011,012 | MATCHED | 999.9/995, scale | KEEP/verify (CD-024/025) |
| CR-021 pricing | SF-012 | PARTIALLY MATCHED | global/retail toggle | ADD/CONFIRM (CD-005) |
| CR-022 accounting | SF-026,027 | MATCHED (internal) | — | KEEP — FOUNDATION |
| CR-023 gold logic | SF-032 | MATCHED | — | KEEP |
| CR-024 statement | SF-028 | MATCHED | — | KEEP |
| CR-025 dashboard | SF-034 | PARTIALLY MATCHED | consolidation + market price | FIX (CD-021) |
| CR-026 CRM | SF-023,024 | PARTIALLY MATCHED | segmentation/comm/analytics | ADD (CD-019) |
| CR-027 employees | SF-033 | PARTIALLY MATCHED | KPI/code/logs/salesperson-link | ADD (CD-020) |
| CR-028 POS | SF-001 | MOSTLY MATCHED | loyalty display verify | FIX (CD-023) |
| CR-029 invoice | SF-021 | PARTIALLY MATCHED | per-line VAT col, salesperson sig, stamp | FIX (CD-016/017/022) |
| CR-030 currency | SF-001,021 | CLIENT CONFLICT | SAR vs AED | CLIENT CONFIRMATION (CD-001) |
| CR-031 languages | (i18n) | MATCHED | 4 missing AR keys | FIX (P3) |
| CR-032 payments | SF-001 | MATCHED | — | KEEP |
| CR-033 gov e-invoicing | — | DEFERRED (source removed) | — | DEFER (CD-002) |

**No CR unmapped.**

---

## Appendix D — Reverse SF Scope Mapping

| SF | Classification | Decision |
|---|---|---|
| SF-001..008,010..012,017,019..028,032..035,039 | EXPLICIT CLIENT REQUIREMENT | KEEP/FIX |
| Watch (within SF-010/012/017/020) | OWNER-APPROVED PROVISIONAL | KEEP provisional (CD-003) |
| SF-018,026,029,030,031,036,040,041 | INTERNAL FOUNDATION | KEEP |
| SF-042 | INTERNAL/DEMO | KEEP (env-gated) |
| SF-009,014,015,037,038 | EXTRA CLIENT-VISIBLE | HIDE-first / CONFIRM (SD-001..005) |
| SF-013,016 | INTERNAL-OPS / IMPLIED | KEEP/CONFIRM |
| RFID (foundation) | DEFERRED FOUNDATION | DEFER |

**No visible feature UNCLASSIFIED.**

---

## Appendix E — XLSX Field Matrix (Add Item Pages.xlsx, 10 sheets)

Columns per row: *field nature* (mandatory/optional/auto) · *input* (manual/list/scale/attach/button) · *behavior/formula* · *field name*.

**Gold By Weight (8 sections):**
- **§1 Identification:** description (mand, list+manual), karat (mand, list), gold color (opt: yellow/white/rose or manual), brand, model, model#, supplier, purchase date (mand), image (attach).
- **§2 Weights:** gross weight (mand, manual or **scale capture**), stone weight (mand), stone name (opt), net gold = gross−stones (auto), pure gold 999.9 (auto, mand), pure gold 995 (auto, optional toggle).
- **§3 Purchase:** gold price/g at purchase (global not retail, editable, non-updating reference), total gold value, making-charge/g, total making, **VAT 5%** (formula), total piece value at purchase.
- **§4 Current cost:** current gold price/g, total gold value, making, VAT, total value now.
- **§5 Sales:** sell price (**global-vs-retail choice** → auto price), selling making-charge/g, **min making-charge**.
- **§6 Tag:** barcode (auto on button), RFID (auto on button), location; buttons: create barcode / create RFID / link RFID / print tag.
- **§7 Status:** available, available/used, pending-tag, reserved, sold, pending-transfer, in-workshop, melted, returned, exchanged, lost.
- **§8 Audit/system.**

**Gold By Weight 24K/Bar (8):** as above; §3 replaces making-charge with **certificate cost for 24K** + certificate name/number; VAT on certificate cost.

**Gold By Piece (8):** piece-based variant of GW.

**Diamond Jewellery (9):** Identification · **Gold data** · **Stone data** · Purchase · Current · Sales · Tag · Status · Audit.
**Loose Diamond (8):** no Gold section (Stone only).
**Gem Jewellery (9) / Loose Gem (8):** same pattern; Stone = gem type/carat/color/tone/saturation/cert (multi-stone).
**Pearl Jewellery (9) / Loose Pearl (8):** **Pearl data** = type/size/quality/color/count/overtone/orient/luster/nacre.
**CGP (6):** invoice data · additional data · gold data · price/purchase · status · audit.

No formulas-as-data, data-validations, comments, named ranges, or embedded images detected; all values read.

---

## Appendix F — Screenshot Requirements

**POS (`واجه نقطه البيع…`, SHA f406e03b…):**
- Header: logo, "نقطة بيع POS - فاتورة جديدة", datetime, cashier (أحمد الشريف).
- **Customer panel:** name, mobile, **loyalty points (رصيد النقاط 2,450)**, "بحث عن عميل".
- **Item entry:** barcode scan field; grid `# | barcode | description | karat | weight(g) | price/g | total | type/delete`; **row 4 = exchange item (ذهب مستبدل), negative weight/total in red**; "إضافة قطعة يدويًا".
- Footer: item count (5), **total weight (18.80g)**.
- **Amount:** total 5190.20 **SAR**; net-before-tax 4943.05; **tax 5% (247.15)**.
- **Payment grid:** method (نقدي cash / بطاقة مدى mada) | amount | action; **split (3000 + 2200.20)**; paid 5200.20; **difference −10.00**.
- Actions: إتمام البيع (Enter), إلغاء الفاتورة (Esc); keyboard shortcuts (F1/↑↓/Enter/Esc).

**Invoice (`شكل الفاتوره العامه…`, SHA fb37f15e…):**
- Header: DARFUS JEWELLERY + Arabic; "فاتورة ضريبية / TAX INVOICE"; **TRN**.
- CLIENT DETAILS (name, mobile) · INVOICE DETAILS (No. INV-1001, date).
- **Line grid (EN/AR):** Sr No. | ITEM DESCRIPTION | GOLD KARAT | WEIGHT(g) | NET AMOUNT | **VAT 5% column** | TOTAL AMOUNT.
- PAYMENT METHOD grid (Cash/Card/Bank Transfer/Other, AED) · AMOUNT DETAILS (NET/VAT 5%/TOTAL) · TOTAL PAID.
- **Notes · Customer Signature · Company Stamp · Salesperson Signature.**
- Footer: +971 508 562 099 · Dubai UAE · info@darfusjewellery.ae · **currency AED**.

---

## Appendix G — Conflict Register

| ID | Source A | Source B | Conflict | Current System | Decision |
|---|---|---|---|---|---|
| CF-1 | POS (SAR) | Invoice (AED) | Currency | AED default, configurable | CD-001 |
| CF-2 | POS `R-24-00125` | الباركود `GWBRC21000001` | Barcode display format | formal format implemented | CD-004 |
| CF-3 | XLSX global-vs-retail | POS single price/g | Pricing mode | single price | CD-005 |
| CF-4 | Prior source (2 gov docx) | Current source (absent) | Scope removal | e-invoicing deferred | CD-002 |
| CF-5 | 2 JPEG dup pairs | — | Duplicate files (identical SHA) | n/a | informational only |

Not resolved on the client's behalf.

---

## Appendix H — New Source Files (Phase 32.5-Requirements-Delta)

New CRs from `9- Audit System.docx`, `10 - Reports.docx`, `11- Setting.docx` (see `PHASE-32.5-REQUIREMENTS-DELTA.md` for full analysis). Nothing is marked IMPLEMENTED without code evidence.

| CR | Domain | Source | Requirement | System | Status |
|---|---|---|---|---|---|
| CR-034 | Audit | 9-Audit | Centralized immutable event-driven audit (before/after, user/branch/device, per module) | `audit.service.js`, `auditLog.model.js` (hash-chained), `/audit` | **APPROVED — PARTIAL** (foundation implemented; dedicated timeline/traceability viewers, retention/archiving, device tracking AUDIT REQUIRED) |
| CR-035 | Audit | 9-Audit | Retention & archiving; delete-prevention; search/filter/export | partial | **APPROVED — NOT IMPLEMENTED** |
| CR-036 | Reports | 10-Reports | Multi-domain report catalog (Customer/Employee/Financial/Gold/Inventory/Installment + KPIs) | `/reports` (+exports, valuation) | **APPROVED — PARTIAL** (most KPI/analytics NOT IMPLEMENTED; needs prioritization) |
| CR-037 | Settings | 11-Setting | 19 settings categories (company/branch/roles/permissions matrix/numbering/barcode/tax/currency/language/notifications/printing/templates/backup/integrations) | `/settings`(+users, barcode-codes) | **APPROVED — PARTIAL** (field/data permissions, numbering engine, country/exchange engines, notification channels/templates/backup/integration hub AUDIT REQUIRED) |

## Appendix I — Reservation Decisions (RE-001, APPROVED)

| Decision | Links to system areas | Implementation status |
|---|---|---|
| AD-002 reservation accounting (Cr Customer Reservation Advances / Current Liab.) | Treasury, Payments, Journals, Customer statements (separate "Reservation Payments" section — NOT AR) | **APPROVED — CONFLICTING** (Phase 32.6 audit: visible reservation UI can create a deposit invoice and not a reservation-payment ledger; account code + tax config PENDING) |
| CD-026 multiple payments (receipt+journal each; no edit/delete) | Reservations, Payments, Treasury, Audit logs | **APPROVED — CONFLICTING** (Phase 32.6 audit: only one `Reservation.deposit` field exists; no reservation payment/receipt model) |
| CD-027 expiry & auto-cancel (asset → Available; Cancelled—Refund Pending; notify) | Reservations, Inventory assets, Notifications, Permissions | **APPROVED — PARTIAL** (Phase 32.6 audit: `expiresAt` exists, but no scheduler/refund-pending status/notification workflow) |
| CD-028 refund (Dr Advances → Cr Cash/Bank; separate approve/execute) | Treasury, Journals, Permissions | **APPROVED — NOT IMPLEMENTED** |
| CD-029 renewal & repricing (link old→new, transfer payments, price diff/refund) | Reservations, Payments, Sales invoice (final), Inventory | **APPROVED — NOT IMPLEMENTED** |
| CD-030 multi-item add/remove/replace (supersedes no-item-change rule) | Reservations, Inventory assets, Payments, Sales invoice final items, Audit logs, Permissions | **APPROVED — CONFLICTING** (Phase 32.6 audit: current model/UI are single-asset only) |
| SD-008 permissions & notifications | Employees/permissions, Notifications | **APPROVED — PARTIAL** (generic `sales.*` and notification infrastructure exist; no granular reservation permissions/recipients) |
| Completion → sale | Sales invoice, VAT, COGS, Inventory (Reserved→Sold), advance settlement | **APPROVED — CONFLICTING** (Phase 32.6 audit: UI links to POS; no reservation-bound completion/advance-settlement route) |

Multi-item amendment details: a reservation may contain one or multiple items. Authorized users may add items before final sale, remove an item from a multi-item reservation, or replace one reserved item with another. Added items become Reserved; removed or replaced items return to Available. Reservation total, total paid, remaining balance, and excess balance are recalculated after every item change. If total increases, the difference is added to remaining; if total falls below paid, the excess is refunded before final completion. Previous payment records are not modified or deleted. The final sales invoice contains only the items currently present in the reservation at completion time. Every add/remove/replace operation requires before/after values, employee, date/time, reason, item identifiers, and price changes in the audit trail.

Phase 32.6 audit completed in `PHASE-32.6-RESERVATION-AUDIT.md`: current `/sales/reservations` page exists (SF-009), but implementation is a legacy single-asset flow backed by generic `/reservations` CRUD plus separate asset PATCH and optional deposit-invoice creation. Core RE-001 accounting/payment/multi-item/completion/refund/renewal behavior is not implemented and several visible behaviors are conflicting. Next recommended implementation phase: **Phase 32.6-Fix A — Reservation Core Data Model & Atomic Accounting Foundation**.
## Phase 32.6-Fix A Traceability Update

Reservation core foundation is now **APPROVED — PARTIAL** for:

- atomic reservation creation
- asset-backed multi-item schema foundation
- immutable reservation payment ledger
- configured reservation-advances liability posting
- idempotency and duplicate protection
- minimal frontend safety

Still **APPROVED — NOT IMPLEMENTED / AUDIT REQUIRED**:

- completion-to-sale
- advance settlement to final invoice
- refunds
- expiry scheduler
- renewal
- post-creation item add/remove/replace workflows
- reports
- customer-statement reservation section
- notifications
- granular permissions
- full multi-item UI

## Phase 32.6-Fix B Traceability Update

Reservation completion and refund settlement are now **APPROVED — IMPLEMENTED** (verified
live against local `darfus_erp`, **LIVE TESTS EXECUTED**, no persistent pollution):

- completion-to-sale (`Completion → sale` row above) — a fully-paid non-legacy reservation
  posts one final VAT-inclusive sales invoice, moves assets/items Reserved→Sold, and records
  exactly one asset-linked inventory-out stock movement
- advance settlement to final invoice — separate settlement journal (Dr Customer Reservation
  Advances / Cr AR) nets customer AR to zero; sales, VAT, and COGS post once each
- CD-026 multiple payments — posted reservation payments are applied through immutable
  `reservation_payment_applications`; original payment rows are never edited or deleted
- refunds (CD-027 refund-pending leg) — full-only refund request/approval/rejection/execution;
  execution posts Dr Customer Reservation Advances / Cr Cash/Bank only, with no
  sales/VAT/COGS/inventory/AR movement; cancellation releases assets to Available and posts no
  refund accounting

Still **APPROVED — NOT IMPLEMENTED (deferred to Fix C / Fix D)**:

- CD-027 automatic expiry scheduler and notifications
- renewal / successor reservations
- CD-030 post-creation multi-item add/remove/replace and repricing
- reservation reports
- customer-statement reservation section
- full granular reservation permission matrix
- full multi-item reservation UI

## Phase 32.6-Fix C Traceability Update

Reservation multi-item changes, automatic expiry, and renewal are now **APPROVED —
IMPLEMENTED** (verified live against local `darfus_erp`, **LIVE TESTS EXECUTED**, no persistent
pollution):

- CD-030 multi-item add/remove/replace + reprice — dedicated atomic `amend-items` endpoint;
  server-resolved prices; total/status recomputed; total-below-paid and zero-item amendments
  rejected; removed items preserved; no accounting journal
- CD-027 expiry & auto-cancel — no-grace automatic expiry (trusted DB time, `SKIP LOCKED`,
  cancellation reuse): assets → Available, payments preserved, paid → `cancelled_refund_pending`,
  unpaid → `cancelled`, `expired_by_system` metadata; no automatic refund/sale; extension-before-
  expiry with immutable history
- Renewal & advance transfer — automatically expired reservations renew into a linked successor
  at current server prices; eligible advance moves via an immutable transfer subledger with no GL
  journal (Advances/customer/branch/company/currency unchanged) and no cash movement; higher/
  equal/lower successor totals handled; distinct `renewal_excess` refund (Dr Advances / Cr Cash)
  gates activation for the lower case

Still **APPROVED — NOT IMPLEMENTED (deferred to Fix D)**:

- CD-027 expiry notification delivery
- reservation reports
- customer-statement reservation section
- full granular reservation permission matrix
- full reservation UI redesign
- cross-company/branch/currency renewal
- partial active-reservation refunds

## Phase 32.6-Post-C Traceability Update

POS reservation deposit + reservation advances configuration are now **APPROVED — IMPLEMENTED**
(verified live against local `darfus_erp`, **LIVE TESTS EXECUTED**, no persistent pollution):

- AD-002 reservation advances accounting — the `reservationAdvancesAccountId` liability account is
  now configurable from Accounting Settings and re-validated backend-side (active, company-scoped,
  credit-nature liability); reservation payments post Dr Cash/Bank / Cr Reservation Advances only
  (no sales/VAT/AR/COGS/inventory before final sale); the unpaid balance stays operational
- CD-026 multiple payments — mandatory initial payment > 0 on manual creation (PC-001); later
  payments unlimited and unscheduled (PC-002); no installment schedule
- POS deposit (PC-004) — the `Deposit / عربون` action creates a reservation via the dedicated API,
  never a sales invoice; submits no trusted totals/journal lines/account

Phase 32.6-Fix D is now **APPROVED — IMPLEMENTED & CLOSED** (verified live against local `darfus_erp` database with 45/45 static and behavioral HTTP verifiers passing):
- AD-003 Customer Statement print/export deferral is explicitly owner-approved for deferral to a later phase.
- Granular permission matrices (22 test scenarios) and API smoke matrices (11 endpoints) are fully verified and integrated.
- Option A configuration missing protocol is fully enforced returning HTTP 200 with structured status and machine-readable `configurationIssue` fields.
- Reservation `id` acts as the human-readable business key `reservationNumber`.
# Phase 32.6-Fix D final traceability addendum (2026-07-13)

| Requirement | Implementation/evidence |
|---|---|
| Common report pagination | Nine reservation report handlers use page 1, limit 50, max 100 and `{total,page,limit,pages}` |
| Stable pages and full totals | Timestamp plus ID ordering; page-independent totals asserted through real HTTP |
| Export | Positive full-filter export and exact negative `403 FORBIDDEN` asserted for every reservation report |
| Scope security | Company, branch, own, query-narrowing, counts, pages, totals, GL diagnostics and export isolation asserted |
| Account permission/validation | Granular/broad/both success; neither/mixed denial; six invalid-account cases return 422 without mutation or success audit |
| Repricing | Ordinary, repricing-only, mixed, fallback, empty-array, and atomic denial matrix asserted |
| Reconciliation | Deliberate mismatch plus actual posted matching GL row: 750/750, difference 0, reconciled, no investigation flag |
| Permission integrity | Exact 403/FORBIDDEN negative middleware tests with real targets; positive Audit/Reports/Statement tests kept separate |
| Cleanup | Exact `T32FDRC-*` namespace cleanup, zero persistent matches, setting restored to ACC-2300 |
| Verification | Typecheck, lint, build, 45/45 verifiers, gated live verifier |

Commits: application `6d12975`; primary verifier `669b194`; verifier compatibility `396e255`. MANUAL UI QA REQUIRED.

# Phase 33B traceability addendum (2026-07-13)

| Requirement | Implementation/evidence |
|---|---|
| Separate aggregates | Dedicated CGP and IGP document/item tables, models, services, and routes |
| Draft workflow | Create/read/update/validate/soft-void; only draft and validated are active states |
| Measurements | Backend decimal net and pure-weight calculation with approved storage precision |
| IGP scope | Physical, serialized bullion, and bullion lot pass; pool/custom/unsupported return exact 422 |
| Identity | Company-scoped serialized bullion and lot duplicate rejection |
| Security | Exact 401/403, secure detail 404, same-company references, authenticated branch maximum, hidden counts excluded |
| Reliability | Idempotent create/validate/void, payload conflict, optimistic version conflict, immutable audit |
| No downstream effects | Real HTTP assertions show zero asset, stock, journal, cash, gold-pool, order, notification, and barcode rows |
| UI | CGP Sales workspace and IGP Supplier workspace; no posting or deferred operation controls |
| Migration safety | Additive migration only; local backup 349.5 KB; no legacy backfill |
| Verification | Typecheck/lint/build, 46/46 verifier files, gated live HTTP suite, zero namespace pollution |

Dedicated permissions/maker-checker are deferred to Phase 33C. Accounting/tax/value policy is
deferred to Phase 33D and requires accountant/client decisions. MANUAL UI QA REQUIRED.

# Phase 33C traceability addendum (2026-07-14)

| Requirement | Implementation/evidence |
|---|---|
| Dedicated permissions | Exact 22-key CGP/IGP catalog; administrator-only initial grant; grouped role administration UI |
| Scope | Base view required; all > branch > own; secure detail 404; mutation never widens scope; query branch narrows only |
| Transitional access | Sales/Supplier fallbacks retained for draft create/read/update/validate/void only |
| Submission | Validated-only, versioned/idempotent command creates one pending approval and immutable canonical snapshot/hash |
| Maker–checker | Creator and submitter self-review denied; own-only reviewer denied; independent branch/all reviewer required |
| Approval/rejection | Locked atomic terminal transition; exact approval version; mandatory rejection reason; rejection returns to draft |
| Immutability/revisions | Submitted/approved PATCH and void blocked; approved source unchanged; linked idempotent draft revision |
| Approval queue | Shared scoped queue/detail APIs with aggregate/status/branch/requester/date/document/reference filters and pagination |
| Audit | Submitted, approved, rejected, and revision-created events for both CGP and IGP |
| No posting | Live counts remain zero for assets, stock, journal, cash, pools, orders, and notifications |
| Migration safety | Additive migration; 37 total; validated 383,582-byte local custom backup; no legacy backfill |
| Verification | 47/47 static verifiers; Phase 33C gated real HTTP verifier; concurrency and snapshot-tamper checks; zero namespace pollution |

Phase 33D remains decision-blocked by final accounting, tax, valuation, settlement, payment,
return, and reversal policy. MANUAL UI QA REQUIRED.
