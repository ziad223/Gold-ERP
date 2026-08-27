# Phase 32.5 — Requirements Delta (New Source Files + Reservation Decisions)

Documentation/analysis only. No code, DB, or requirement-source changes.
Prior baseline: `PHASE-32.5-SOURCE-MANIFEST.md` (27 files). Current: **30 files**.

## A. Source Set Changes

| Change | File | Ext | Size | SHA-256 | Status |
|---|---|---|---:|---|---|
| **ADDED** | 9- Audit System.docx | docx | 78825 | `41ff908e7ba0cc53dd09a1b91295468f2639d7daa7cbf474cf801c1c971682b0` | read ✅ |
| **ADDED** | 10 - Reports.docx | docx | 94491 | `520c2d9cece1ced0753459d44603bcd3ba1f0f42370744cbdb0c2f0471d109bb` | read ✅ |
| **ADDED** | 11- Setting.docx | docx | 19974 | `7e31fdc68795fa3c6fae40c2b35d185a8a6c3a88f2e4b1f13ec085c159fe2004` | read ✅ |
| REMOVED | (none) | — | — | — | — |
| MODIFIED | (none — all 27 prior SHA-256 unchanged) | — | — | — | — |
| UNCHANGED | 27 prior files | — | — | — | verified by SHA-256 |

- **Total files:** 27 → **30** (+3) · **Duplicate JPEG pairs:** 2 (unchanged) · **Unique content units:** **28** (30 files − 2 duplicates).
- Delta determined by **SHA-256** (not mtime). No prior file's content changed.
- UAE government e-invoicing docx remain **absent** (unchanged from prior delta) → still SOURCE-SET CHANGE pending confirmation (CD-002).

## B. Audit System Requirements (`9- Audit System.docx`)
Bilingual EN/AR spec, 9 PARTS (Foundation, Modules, Screen Specs, Business Rules, Operational Scenarios, Exception Handling, Integrations, Technical Design, Implementation Summary).

| Requirement area | Client statement | Current system | Status |
|---|---|---|---|
| Centralized event-driven audit, independent of business modules | every important op auto-generates ≥1 audit event | `audit.service.js` + `auditLog.model.js` | **ALREADY IMPLEMENTED (foundation)** — AUDIT REQUIRED for full coverage |
| Immutable logs (no edit/delete) | immutable historical records | hash-chained `prev_hash` audit log | **ALREADY IMPLEMENTED** |
| Before/After change capture | previous + new values | audit records support before/after | **PARTIAL** — AUDIT REQUIRED |
| User/Employee/Branch/Device tracking | full operational context | userId, branch, sourceDocument captured | **PARTIAL** — device tracking AUDIT REQUIRED |
| Traceability + Timeline + Audit Dashboard screens | dedicated viewers | `/audit` page exists | **PARTIALLY IMPLEMENTED** (dedicated timeline/traceability viewers NOT confirmed) |
| Per-module audit (Sales/Inventory/Accounting/Gold/Transfers/Customers/Employees/Gov/Offline) | audit each module | broad coverage exists | **PARTIAL** — AUDIT REQUIRED |
| Retention & Archiving; delete-prevention | retention rules | not confirmed | **NOT IMPLEMENTED / AUDIT REQUIRED** |
| Search & Filters (branch/user/date); Export | filterable, exportable | audit page filters partial | **PARTIAL** |
| Government Integration Audit; Offline & Recovery Audit | audit those flows | those flows deferred | **DEFERRED** (depends on deferred features) |

**Classification:** mostly **INTERNAL/ADMIN foundation ALREADY IMPLEMENTED**; dedicated audit UI (timeline/traceability viewers), retention/archiving, and device tracking = **PARTIAL / NOT IMPLEMENTED — AUDIT REQUIRED**.

## C. Reports Requirements (`10 - Reports.docx`)
Bilingual catalog. Common features: filters (date/branch/user/customer/supplier), grouping, totals, export, permission-gated, read-only. Report families (representative — each has AR label):

- **Customer:** Reports, Activity, Balance, Communication, Gold Purchase, KPIs, Loyalty, Profitability.
- **Employee:** Reports, Audit, KPIs.
- **Financial:** Reports, KPIs, Overview, Statements, Transfers.
- **Gold:** By Piece, By Weight, Investment, KPIs, Position, Pricing, Providers, Risk, Settlement, Treasury.
- **Inventory:** Reports, Audit, KPIs.
- **Installment:** Reports.
- (plus Sales / Purchase / Treasury / Tax / Reservation families referenced across the catalog.)

| Status | Reports |
|---|---|
| ALREADY IMPLEMENTED / PARTIAL | `/reports` (+exports, inventory-valuation), installment reports, treasury — **AUDIT REQUIRED** for exact field/filter parity |
| NOT IMPLEMENTED | most **KPI** reports, Customer Profitability/Communication/Loyalty analytics, Gold Position/Risk/Settlement/Investment, Financial Statements/Overview dashboards |
| CLIENT CONFIRMATION | exact required fields/filters/grouping per report (doc is a large catalog; prioritization needed) |

**Classification:** **PARTIALLY IMPLEMENTED**; large catalog, many **NOT IMPLEMENTED**; needs prioritization (ties to CRM/Employees/Dashboard scope decisions CD-019/020/021).

## D. Settings Requirements (`11- Setting.docx`)
19 categories:

1. Company Profile (info, tax registration/TRN, branding, documents) — **IMPLEMENTED (partial)**
2. Branch Settings (info, config, status) — **IMPLEMENTED (partial)**
3. User Roles (management, groups) — **IMPLEMENTED** (`/settings/users`)
4. **Permissions Matrix** (module/screen/action/**field**/**data** permissions) — **PARTIAL** (module/action exist; field/data-level = **NOT IMPLEMENTED / AUDIT REQUIRED**)
5. General/Business/Regional/Performance settings — **PARTIAL**
6. **Numbering Engine** (document/customer/supplier/employee/inventory/auto-number rules) — **PARTIAL/NOT CONFIRMED — AUDIT REQUIRED**
7. RFID & Barcode (config, templates, label printing) — **IMPLEMENTED** (`/settings/barcode-codes`)
8. Gold Price (sources, branch price policy) — **PARTIAL** (ties to CD-005 pricing)
9. Country Engine — **NOT CONFIRMED**
10. Tax Engine (types, rates, rules, mapping) — **PARTIAL** (VAT 5% implemented; configurable engine AUDIT REQUIRED)
11. Currency (base currency, precision, formatting) — **PARTIAL** (ties to CD-001)
12. Exchange Rate — **NOT IMPLEMENTED** (only if multi-currency; not in current scope)
13. Language (user language, number format) — **IMPLEMENTED**
14. Date & Time — **PARTIAL**
15. Notifications (**email/SMS/push**) — **NOT IMPLEMENTED / AUDIT REQUIRED**
16. Printing (printer management, receipt printing) — **PARTIAL/IMPLEMENTED**
17. Document Template Settings (invoice/report/receipt templates) — **PARTIAL / AUDIT REQUIRED**
18. Backup / Restore — **INTERNAL/ADMIN ONLY — AUDIT REQUIRED**
19. Integration Hub — **DEFERRED / AUDIT REQUIRED**

**Classification:** core settings **IMPLEMENTED/PARTIAL**; field/data-level permissions, numbering engine, country engine, exchange rate, and notification channels = **NOT IMPLEMENTED — AUDIT REQUIRED**. **Reservation settings** now approved (RE-001) — see Decision Register (permissions, duration, refund approval).

## E. Conflicts
- No new hard conflicts introduced by the three files. The Settings doc's **Currency (base currency)** reinforces the open **CD-001 (SAR vs AED)** conflict — resolution still pending.
- Reports doc's KPI/analytics scope overlaps CRM/Employees/Dashboard decisions (CD-019/020/021) — must be prioritized together, not built blindly.
- Audit doc's "Government Integration Audit" references UAE e-invoicing, which remains **DEFERRED** (source-set change, CD-002).

## F. Reservation Decisions (from RE-001)
Recorded in `PHASE-32.5-DECISION-REGISTER.md` (AD-002, CD-026…CD-030, SD-008) and linked in `PHASE-32.5-TRACEABILITY-APPENDIX.md`. Summary: reservation = operational document (not a sale; asset stays Reserved in company stock; remainder NOT posted to AR); multiple partial payments each with own receipt + journal (Dr Cash/Bank → Cr **Customer Reservation Advances**, Current Liabilities, **account code PENDING CONFIGURATION**); no edit/delete of a payment (reverse/refund only); per-reservation expiry (no grace) → auto-cancel to Available + "Cancelled — Refund Pending" + notify; full refund on cancel (Dr Reservation Advances → Cr Cash/Bank), separate approve-vs-execute refund permissions; renewal/repricing rules; **multi-item amendment approved** (one/many items; authorized add/remove/replace before final sale; added items Reserved; removed/replaced items Available; recalc total/paid/remaining/excess after every item change; increased total adds to remaining; total below paid requires excess refund before completion; previous payment records immutable; final invoice includes only current reservation items; audit trail captures before/after values, employee, date/time, reason, item identifiers, and price changes; supersedes the previous no-item-change rule); price is VAT-inclusive with **no double VAT**, final VAT posting at final sale invoice (configurable). **Implementation not started** — next phase is Reservation Audit.
