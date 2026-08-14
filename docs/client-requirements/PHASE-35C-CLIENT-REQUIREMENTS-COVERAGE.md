# Phase 35C - Client Requirements Coverage Verification and Simple Market MVP Scope Lock

Phase 35C is documentation-only. No implementation, tests, verifiers, browser QA, migrations, seeds, fixtures, write APIs, or production access were performed in this phase.

Starting repository state:
- Repository: `H:\WORK\jewellery-erp-master`
- Branch: `main`
- Starting HEAD: `4e47f4c3b1d700d7f39d39876f890fbe58985703`
- Starting commit: `4e47f4c fix: contain unsafe market launch workflows`
- Stashes: 11, untouched
- Client source root: `H:\WORK\client-requirements`
- Local DB rule: SELECT-only permitted against `localhost:5433 / darfus_erp`; no DB writes were performed
- Production/Render: untouched

Evidence levels used:
- E4: current source plus verifier/live closure evidence from a clean completed phase
- E3: current source plus read-only database/source evidence
- E2: current source inspection only
- E1: historical documentation claim only
- E0: no evidence found

Status values are the formal Phase 35C values. "Verified" means supported by current source plus prior clean closure evidence; this phase itself did not re-run mutation verifiers.

## 1. Executive Summary

Source inventory:
- Business source files in folder, excluding the nested ZIP: 30
- Unique source files by SHA-256: 28
- Duplicate visual files by SHA-256: 2 duplicate files across 2 duplicate pairs
- Supplied ZIP: `client-requirements.zip`, 30 entries, all filenames and SHA-256 hashes match the folder source
- Source conflict: none
- Unreadable files: 0

Requirement normalization:
- Raw extracted atomic candidates: 219
- Duplicate/inherited candidates: 94
- Unique normalized requirements used for market coverage: 125

Coverage totals by formal status:

| Status | Count |
|---|---:|
| IMPLEMENTED AND VERIFIED | 35 |
| IMPLEMENTED - MANUAL QA REQUIRED | 15 |
| IMPLEMENTED DIFFERENTLY - BUSINESS INTENT SATISFIED | 10 |
| IMPLEMENTED BUT PARTIAL | 25 |
| IMPLEMENTED BUT UNSAFE | 5 |
| IMPLEMENTED BUT NOT VERIFIED | 8 |
| FRONTEND ONLY | 4 |
| BACKEND ONLY | 6 |
| DATABASE FOUNDATION ONLY | 4 |
| NOT IMPLEMENTED | 5 |
| DEFERRED BY APPROVED DECISION | 3 |
| OWNER DECISION REQUIRED | 3 |
| ACCOUNTANT SIGN-OFF REQUIRED | 2 |
| Total | 125 |

Coverage percentages:
- Functional implementation coverage against all unique requirements: 93 / 125 = 74.4% have at least some implemented foundation.
- Delivery-weighted client-request coverage, excluding deferred/OUT/decision rows: 76.85 / 113 = 68.0%.
- Strong verified coverage: 35 / 125 = 28.0%.
- Proposed M0/M1 MVP coverage: 48 / 65 = 73.8% have implemented, verified, or acceptable alternative coverage; 17 / 65 remain partial, unsafe, missing, or decision-blocked.
- Document-by-document coverage: 30 / 30 files inspected; 28 / 28 unique file hashes inspected after duplicate image normalization.

Market priority totals:

| Priority | Count |
|---|---:|
| M0 - Day-1 market blocker | 14 |
| M1 - Day-1 core | 51 |
| M2 - Early post-launch | 34 |
| M3 - Advanced / enterprise | 14 |
| OUT - excluded from current product scope | 4 |
| DECISION - owner/accountant decision required | 8 |
| Total | 125 |

Strongest implemented modules:
- Super Admin, Branch Account, Employee operator authorization, branch scope, and session behavior.
- Sales/POS draft/posting lifecycle, returns, exchanges, installments collection, print/reprint enforcement, and idempotency foundations.
- Reservation lifecycle, payments, amendments, expiry, renewal, reports, and statement integration.
- Barcode identity foundations, item type forms, and barcode tag print layouts.
- Customer history, customer credit ledger/foundation, statement-v2/v3 foundations, and exchange display.
- Gold Purchase draft/approval governance foundations.

Weakest or launch-sensitive modules:
- Treasury cashbox/register/shift model is not implemented.
- `Account.balance` mirror divergence and fiscal period close/VAT filing remain unresolved.
- Purchase lifecycle remains partial: receipt/payment exist, but purchase returns/debit notes/reversal/supplier payable governance are not launch-ready.
- Inventory warehouse/bin governance and stock count operational sign-off remain partial.
- Payroll/attendance is guarded but not complete.
- Gift voucher exists but lacks full market accounting/settlement validation.
- UAE e-invoicing/government integration is not ready and requires accountant/legal sign-off.

Proposed launch classification: CONDITIONAL.

The smallest safe market version is feasible only if Day-1 scope is locked to controlled jewellery retail operations and the remaining M0 blockers are fixed or explicitly disabled before launch. The system should not be marketed as a complete enterprise jewellery ERP yet.

## 2. Source Inventory

| Source ID | Filename | Type | SHA-256 | Duplicate Of | Canonical/Inheriting | Requirement Count | Notes |
|---|---|---|---|---|---|---:|---|
| SRC-SALES-00 | `0- Sales Module Documentation.docx` | DOCX | `63EE0A422F5290F7514BD46FCC5F934732E53B40BD506CF992DD2F8635B5E1A3` | - | Canonical sales overview | 18 | Defines sales branches and shared lifecycle. |
| SRC-INV-GBW | `1- Gold By Weight.docx` | DOCX | `271023241F284D7E69A3E6D992CC2A87D7A3044C5E2E1D21E4D35D20B7221869` | - | Canonical gold-by-weight | 9 | Item fields, weights, cost, tag, status. |
| SRC-SALES-SI | `1- Sales Invoice.docx` | DOCX | `28592210EC9F52680A135FDE0224CB89BED70348B94DD113BE5E59497E46C4F4` | - | Canonical invoice behavior | 18 | Main inherited sales invoice contract. |
| SRC-REPORTS | `10 - Reports.docx` | DOCX | `520C2D9CECE1CED0753459D44603BCD3BA1F0F42370744CBDB0C2F0471D109BB` | - | Canonical reports | 8 | Broad report taxonomy; many advanced reports. |
| SRC-SETTINGS | `11- Setting.docx` | DOCX | `7E31FDC68795FA3C6FAE40C2B35D185A8A6C3A88F2E4B1F13EC085C159FE2004` | - | Canonical settings | 7 | Company, branch, roles, permissions, numbering, integrations. |
| SRC-INV-GBP | `2- Gold By Piece.docx` | DOCX | `93FAFC2B71D4D1E7FF73EF1761B3CFFB69EA974F838A2335F2CD925A0CF8629C` | - | Inherits inventory master | 7 | Gold-by-piece variant. |
| SRC-SALES-RET | `2- Sales Return.docx` | DOCX | `6B36D740CD04B3939174F2A47FFA84D5587E4AD2E24887BA955BFCC8649931CB` | - | Inherits Sales Invoice | 6 | Return-specific rules plus inherited invoice rules. |
| SRC-INV-DIA | `3- Diamond (Jewellery  Loose Stone).docx` | DOCX | `2F57502FCB84E0FCE1FDC584110E3D3A374CBB2DAAC755D8B70EFD483E69DF9C` | - | Inherits inventory master | 8 | Diamond jewellery and loose stones. |
| SRC-SALES-EXC | `3- Exchange Invoice.docx` | DOCX | `FE1911BB57AB31560AEE67C5D9F9DB022331045043B37FCE1D0E89DBE7D544AB` | - | Inherits Sales Invoice | 7 | Exchange-specific settlement and display. |
| SRC-INV-GEM | `4- Gem Stone (Jewellery  Loose Stone).docx` | DOCX | `F605E01954A0910A804C77C202F7C273E8BBA64380CA19738331B33B4A74D9C3` | - | Inherits inventory master | 7 | Gemstone jewellery and loose stones. |
| SRC-SALES-INS | `4- Installments Invoice.docx` | DOCX | `3E6A50E054AB32047F33D244C5AEC9480A06F46A18F5F407EEF2B99B0E644BC0` | - | Inherits Sales Invoice | 7 | Installment schedule and collection. |
| SRC-SALES-DEP | `5- Deposit Invoice.docx` | DOCX | `272EF0597575A515A1C69A81AEC73B9D7B0F48D54EE5C7B4BF552B7D16059483` | - | Inherits Sales Invoice | 6 | Deposit intent maps to reservation flow. |
| SRC-INV-PEARL | `5- Pearl.docx` | DOCX | `2EBACAE8A77724553353D5366EDCA9000CE8A644505FDC95F1198AF39D497D2E` | - | Inherits inventory master | 7 | Pearl jewellery and loose pearl. |
| SRC-SALES-GV | `6- Gift Voucher Invoice.docx` | DOCX | `37666B86930FAB89A1E66E7C78BCD2BD4105D495FDB8867BCF77A479549ACD3A` | - | Inherits Sales Invoice | 5 | Gift voucher issue/redeem. |
| SRC-GP | `6- Gold Purchase (CGP - IGP).docx` | DOCX | `25E150DB3826A475BBEF360C7A4A2300D0C0EC4AF94C8A33A33FC1A8B1F872D0` | - | Canonical CGP/IGP | 11 | Draft, validation, approval, inventory/accounting separation. |
| SRC-SALES-CGP | `7- Customer Gold Purchase Invoice.docx` | DOCX | `7857DBD777A25F8FD9372A722B7967947FDCDCE7E89B774B54731091AC1CCC0F` | - | Canonical customer gold purchase invoice | 5 | Customer-facing purchase settlement. |
| SRC-CRM | `7- Customers CRM.docx` | DOCX | `EA2799BA2276202C78315D1D97C3700805D1DA643683FD178E2D793194D8C526` | - | Canonical customers/CRM | 10 | Profile, history, balances, segmentation, loyalty, communications. |
| SRC-HR | `8- Employees.docx` | DOCX | `943C55D4B082F79F9625C5AE8A8CE38BE9770289663426BDB5D832FA7AC6C9C9` | - | Canonical employees/HR | 8 | Profile, attendance, payroll, roles, employee code. |
| SRC-PRINT | `8- Invoices Search & Print.docx` | DOCX | `7CBAF1C6D80D540C0A61A22017CBCF6A91F5C7D4A346E93C450B6BD1876FB9D4` | - | Canonical invoice search/print | 5 | Read-only invoice search and rendering. |
| SRC-AUDIT | `9- Audit System.docx` | DOCX | `41FF908E7BA0CC53DD09A1B91295468F2639D7DAA7CBF474CF801C1C971682B0` | - | Canonical audit | 6 | Immutable logs, before/after, actor/device/branch tracking. |
| SRC-ACCT-FULL | `Accounting شامل.docx` | DOCX | `74954ABD97BBE5071338CC1B0E70BF36BD39606D637C20DA3ECBB674F01DA84A` | - | Canonical full accounting | 9 | Hybrid finance core; broad accountant-facing model. |
| SRC-ACCT | `Accounting.docx` | DOCX | `E51DD337DC94C174E3516C3EE4133B452E00B4F8C2C6D0CC25FE14C995A2F695` | - | Accounting summary | 6 | Treasury, GL, VAT, AR/AP. |
| SRC-XLS-ITEMS | `Add Item Pages.xlsx` | XLSX | `C8826790B0F2AE3F34C7EA02F02630A4CE2278E5A9F24635C17588A465C0FB2B` | - | Field workbook | 7 | 10 sheets of item-entry fields and formulas. |
| SRC-POS-IMG-A | `WhatsApp Image 2026-06-30 at 9.47.46 PM.jpeg` | JPEG | `F406E03BF70EA7B5002FAF5ADD40E8A3112E62F2E7695E351D834A93B96DDE23` | SRC-POS-IMG-B | Duplicate POS visual | 1 | POS layout reference. |
| SRC-INV-IMG-A | `WhatsApp Image 2026-06-30 at 9.49.24 PM.jpeg` | JPEG | `FB37F15EDC5CD6C15DB03610F3B22A8F30464695769EF4BA77052DFB05EAA6A8` | SRC-INV-IMG-B | Duplicate invoice visual | 1 | Invoice layout reference. |
| SRC-BARCODE | `الباركود.docx` | DOCX | `8B0FB45DB4FC05604481227E95491E101216BBA24007210E2EBA46C99C7F4C60` | - | Canonical barcode/tag | 5 | Barcode composition and reuse rules. |
| SRC-DASH | `الشرح الكامل Dashboard.docx` | DOCX | `2F0874C359DBF14FCFDD7E89132912DDEDC2ED8116690206F2373EA4D8F3EEBF` | - | Canonical system structure | 9 | Navigation and module taxonomy. |
| SRC-INV-IMG-B | `شكل الفاتوره العامه مع اختلاف اسم الفاتوره .jpeg` | JPEG | `FB37F15EDC5CD6C15DB03610F3B22A8F30464695769EF4BA77052DFB05EAA6A8` | - | Canonical invoice visual | 1 | General invoice layout. |
| SRC-GOLD-LOGIC | `منطق الذهب وعيارات الذهب.docx` | DOCX | `2E36F6B26D811B96339940E86F988262AC4A79C6122D04CBF11096C4448585F5` | - | Canonical karat logic | 5 | Pure gold weight and karat calculation intent. |
| SRC-POS-IMG-B | `واجه نقطه البيع في السيستم.jpeg` | JPEG | `F406E03BF70EA7B5002FAF5ADD40E8A3112E62F2E7695E351D834A93B96DDE23` | - | Canonical POS visual | 1 | Three-column POS workflow reference. |

Archive comparison:
- `client-requirements.zip` exists inside `H:\WORK\client-requirements`.
- ZIP entry count: 30.
- Missing in ZIP: none.
- Extra in ZIP: none.
- Hash differences: none.
- Result: no `CLIENT REQUIREMENTS SOURCE CONFLICT`.

## 3. Normalization and Inheritance Map

| Canonical Requirement Group | Canonical Source | Inherited/Repeated Sources | Raw Count | Unique Count |
|---|---|---|---:|---:|
| Shared sales invoice lifecycle | SRC-SALES-SI | SRC-SALES-00, SRC-SALES-RET, SRC-SALES-EXC, SRC-SALES-INS, SRC-SALES-DEP, SRC-SALES-GV, SRC-PRINT | 43 | 18 |
| Return/exchange inherited invoice behavior | SRC-SALES-RET / SRC-SALES-EXC | Sales invoice, print, visual invoice | 18 | 9 |
| Installments inherited invoice behavior | SRC-SALES-INS | Sales invoice, accounting, reports | 12 | 7 |
| Deposit as reservation/advance | SRC-SALES-DEP | Sales module, settings, reports | 13 | 6 |
| Gift voucher | SRC-SALES-GV | Sales invoice, reports, accounting | 8 | 5 |
| Customer gold purchase | SRC-SALES-CGP / SRC-GP | Gold purchase, accounting, treasury | 16 | 9 |
| Inventory master common fields | SRC-INV-GBW | SRC-INV-GBP, SRC-INV-DIA, SRC-INV-GEM, SRC-INV-PEARL, SRC-XLS-ITEMS | 39 | 18 |
| Barcode/RFID/tag lifecycle | SRC-BARCODE | Inventory docs, POS visual, item workbook | 13 | 6 |
| Dashboard/navigation taxonomy | SRC-DASH | Sales/inventory/accounting/settings docs | 12 | 9 |
| Customers/CRM | SRC-CRM | Sales, reports, accounting | 16 | 10 |
| Employees/operator/HR | SRC-HR | Settings, audit, sales operator phases | 12 | 8 |
| Accounting/treasury/VAT | SRC-ACCT-FULL | SRC-ACCT, reports, sales/purchase docs | 19 | 13 |
| Reports | SRC-REPORTS | All module docs | 8 | 8 |
| Settings/security | SRC-SETTINGS | Dashboard, audit, employees | 8 | 7 |
| Visual POS/invoice layout | SRC-POS-IMG-B / SRC-INV-IMG-B | Duplicate WhatsApp images | 2 | 2 |

## 4. Module Coverage Summary

| Module | Unique Requirements | Implemented & Verified | Implemented/QA | Partial | Foundation Only | Missing | Unsafe | Deferred | MVP Decision | Confidence |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|
| Global architecture and Dashboard | 7 | 2 | 2 | 2 | 1 | 0 | 0 | 0 | M1 preserve with UX QA | E2/E1 |
| Sales foundation/POS | 12 | 7 | 2 | 2 | 0 | 0 | 1 | 0 | M0/M1 preserve and validate | E4 |
| Sales Invoice | 9 | 5 | 2 | 2 | 0 | 0 | 0 | 0 | M0 preserve | E4 |
| Sales Return | 5 | 3 | 1 | 1 | 0 | 0 | 0 | 0 | M1 preserve | E4 |
| Exchange Invoice | 6 | 4 | 1 | 1 | 0 | 0 | 0 | 0 | M1 preserve | E4 |
| Installments | 6 | 3 | 1 | 2 | 0 | 0 | 0 | 0 | M1 preserve with QA | E4 |
| Deposit/Reservation | 6 | 4 | 1 | 1 | 0 | 0 | 0 | 0 | M1 preserve as reservation | E4 |
| Gift Voucher | 5 | 0 | 1 | 2 | 1 | 1 | 0 | 0 | M2 disable or limited pilot | E2 |
| Customer Gold Purchase | 6 | 2 | 1 | 2 | 1 | 0 | 0 | 0 | M2 controlled pilot | E4/E2 |
| Search/Print/PDF/Templates | 7 | 3 | 2 | 2 | 0 | 0 | 0 | 0 | M1 preserve | E4 |
| Inventory item types | 14 | 3 | 4 | 5 | 2 | 0 | 0 | 0 | M0/M1 limited catalog | E4/E2 |
| Barcode/RFID/lifecycle | 6 | 3 | 1 | 1 | 1 | 0 | 0 | 0 | M0 barcode; RFID M2 | E4/E2 |
| Transfers | 4 | 1 | 1 | 2 | 0 | 0 | 0 | 0 | M2 unless multi-branch launch | E2/E1 |
| Customers/CRM | 10 | 3 | 2 | 3 | 1 | 1 | 0 | 0 | M1 core only | E4/E2 |
| Employees/operator auth | 8 | 5 | 1 | 1 | 1 | 0 | 0 | 0 | M0 preserve | E4 |
| Attendance | 2 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | M2 limited | E2 |
| Payroll | 3 | 0 | 0 | 1 | 1 | 0 | 1 | 0 | M3 defer | E2 |
| Suppliers/purchases | 8 | 1 | 1 | 4 | 1 | 1 | 0 | 0 | M0 controlled receive/payment | E2/E1 |
| Treasury | 7 | 2 | 1 | 2 | 0 | 1 | 1 | 0 | M0 cash controls needed | E4/E2 |
| Accounting/VAT/AR/AP | 11 | 2 | 1 | 4 | 1 | 1 | 2 | 0 | M0 repair/sign-off | E2/E1 |
| Audit System | 6 | 3 | 1 | 1 | 1 | 0 | 0 | 0 | M0 preserve | E4/E2 |
| Reports | 8 | 2 | 2 | 3 | 1 | 0 | 0 | 0 | M1 essential only | E2/E1 |
| Settings | 7 | 2 | 2 | 2 | 1 | 0 | 0 | 0 | M1 preserve | E2 |
| Responsive/RTL/LTR/usability | 4 | 1 | 2 | 1 | 0 | 0 | 0 | 0 | M1 browser QA phase | E1 |
| Production/deployment/integration | 4 | 0 | 0 | 1 | 0 | 1 | 0 | 2 | M3/decision | E1/E0 |

## 5. Full Atomic Requirements Matrix

### A. Global Architecture and Dashboard

| Requirement ID | Client Source | Section | Atomic Requirement | Current Implementation | Status | Market Priority | Evidence | Gap | Owner Decision | Accountant Sign-off | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CR-GLOBAL-001 | SRC-DASH | System structure | Main modules must be reachable from Dashboard/navigation. | Sidebar/dashboard routes exist for dashboard, sales, POS, inventory, customers, suppliers, accounting, treasury, reports, audit, settings. | IMPLEMENTED - MANUAL QA REQUIRED | M1 | E2 source: `app/[locale]/(dashboard)/*`, `components/layout/sidebar.tsx`; E1 Phase 35B browser QA partial. | Full navigation pass not run in Phase 35C. | No | No | Preserve; include in market browser QA. |
| CR-GLOBAL-002 | SRC-DASH | Dashboard | Dashboard should summarize sales, operations, inventory, alerts, recent invoices. | Dashboard feature widgets and local provider exist. | IMPLEMENTED BUT PARTIAL | M1 | E2 `features/dashboard/*`, `app/[locale]/(dashboard)/dashboard/page.tsx`. | Data-contract and live coverage not fully proven. | No | No | Keep basic dashboard; defer advanced BI. |
| CR-GLOBAL-003 | SRC-DASH | Workspace | Branch/company context must be visible and scoped. | Branch switcher/auth context and backend branch hardening exist. | IMPLEMENTED AND VERIFIED | M0 | E4 Phase 35B branch/report hardening; `auth.middleware`, `erp.routes.js`. | Full UI pass still needed. | No | No | Preserve backend authority. |
| CR-GLOBAL-004 | SRC-DASH | Module order | Sales, inventory, transfers, accounting, CRM, HR, reports, settings appear in final order. | Navigation differs from source order but covers most modules. | IMPLEMENTED DIFFERENTLY - BUSINESS INTENT SATISFIED | M2 | E2 sidebar/routes. | Exact order differs. | No | No | Do not rebuild navigation solely for source order. |
| CR-GLOBAL-005 | SRC-DASH | Notifications | Notifications center and alerts are part of system structure. | Notification routes and UI route exist. | IMPLEMENTED BUT NOT VERIFIED | M2 | E2 `/notifications` routes and page. | Not market-QA proven. | No | No | Keep hidden/limited until QA. |
| CR-GLOBAL-006 | SRC-DASH | Offline/hybrid | Offline/realtime/hybrid concepts appear in dashboard/system docs. | Some dashboard offline banner/snapshot source exists. | FRONTEND ONLY | M3 | E2 `features/dashboard/offline`, `offline-banner`. | No proven sync engine. | Yes | No | Exclude from MVP. |
| CR-GLOBAL-007 | SRC-DASH | Approvals | Approval flow should exist for controlled operations. | Gold Purchase approval exists; generic approval route/page exists. | IMPLEMENTED BUT PARTIAL | M2 | E4 Gold Purchase approval verifier; E2 approvals page. | No universal approval engine. | Yes | No | Use only where already wired. |

### B. Sales, POS, Invoice, Return, Exchange, Installment, Reservation, Voucher, CGP

| Requirement ID | Client Source | Section | Atomic Requirement | Current Implementation | Status | Market Priority | Evidence | Gap | Owner Decision | Accountant Sign-off | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CR-SALES-001 | SRC-SALES-00 | Overview | Sales module must support sale, return, exchange, installment, deposit, voucher, customer gold purchase, search/print. | Routes/pages exist for all named branches. | IMPLEMENTED BUT PARTIAL | M1 | E2 routes/pages; E4 for sale/return/exchange/installment/reservation. | Voucher and CGP settlement incomplete. | No | Some | Preserve implemented; limit incomplete flows. |
| CR-SALES-002 | SRC-SALES-00 | Lifecycle | Operational transactions support draft, post, print/reprint, cancel/controlled mutation lifecycle. | Sales draft create/update/cancel/post and print/reprint gates exist. | IMPLEMENTED AND VERIFIED | M0 | E4 `verify-sales-pos-operator-enforcement.js`, `verify-single-level-employee-operator.js`. | Finalized cancel/void broader policy deferred. | No | No | Preserve. |
| CR-SALES-003 | SRC-SALES-SI | Header/customer | Sales invoice captures customer and invoice header data. | Invoice/customer models/routes and UI exist. | IMPLEMENTED AND VERIFIED | M1 | E4 sales/POS verifier; E2 `invoice.model.js`, sales pages. | Manual visual QA needed. | No | No | Preserve. |
| CR-SALES-004 | SRC-SALES-SI | Items | Invoice items handle sellable inventory assets/products. | Invoice item and POS checkout support assets/products; server computes totals. | IMPLEMENTED AND VERIFIED | M0 | E4 sales/POS verifiers; `sales.service.js`. | Launch catalog must be limited to proven item types. | No | No | Preserve. |
| CR-SALES-005 | SRC-SALES-SI | Pricing | Pricing must be server-controlled and not trust client financial totals. | Server recomputes checkout/draft totals and COGS. | IMPLEMENTED AND VERIFIED | M0 | E4 verifiers; `lib/types.ts` comments; `erp.routes.js`. | Gold live-price policy still configurable. | No | Accountant for VAT/gold policy | Preserve. |
| CR-SALES-006 | SRC-SALES-SI | VAT | Sales VAT should be calculated, stored, and printed. | Invoice VAT rate/tax fields and reports exist. | IMPLEMENTED - MANUAL QA REQUIRED | M0 | E2/E4 VAT migrations/verifiers; Phase 35A tax audit. | UAE/legal VAT sign-off required. | No | Yes | Sign off before launch. |
| CR-SALES-007 | SRC-SALES-SI | Payments | POS supports cash/card/transfer/installment/deposit style payments. | Payment method settings and POS payment support exist. | IMPLEMENTED BUT PARTIAL | M1 | E2 settings/payment code; E4 POS cash and installment paths. | Bank/card reconciliation not complete. | No | No | Limit accepted payment modes to validated ones. |
| CR-SALES-008 | SRC-SALES-SI | Employee ownership | Sales actions must be attributed to employee/operator. | Employee operator sessions, nullable super-admin actor, invoice/payment/print attribution exist. | IMPLEMENTED AND VERIFIED | M0 | E4 HF5A/HF5C and sales operator verifiers. | None for current scope. | No | No | Preserve. |
| CR-SALES-009 | SRC-SALES-SI | Idempotency | Duplicate posting/checkout must be prevented. | Idempotency verifier scripts and route comments show idempotent sales paths. | IMPLEMENTED AND VERIFIED | M0 | E4 `verify-idempotency.js`, `verify-secondary-idempotency.js`, sales verifiers. | More end-to-end browser duplicate-click QA needed. | No | No | Preserve; include in launch QA. |
| CR-SALES-010 | SRC-SALES-SI | Search/recovery | Draft recovery/autosave/session behavior should prevent lost invoices. | Draft routes exist; recovery/autosave not fully proven. | IMPLEMENTED BUT PARTIAL | M2 | E2 sales draft source. | No current browser recovery proof. | No | No | Defer advanced recovery. |
| CR-SALES-011 | SRC-SALES-RET | Return | Return can target exact invoice item/asset and compute credit note server-side. | `/sales/returns` supports returned invoice item IDs/assets and server-side totals. | IMPLEMENTED AND VERIFIED | M1 | E4 adjustment and return/exchange verifiers. | Generic refund policy beyond invoice return is deferred. | No | Accountant for refund accounting | Preserve invoice-backed return. |
| CR-SALES-012 | SRC-SALES-RET | Return settlement | Return excess settlement should be controlled. | Settlement options/verifiers exist. | IMPLEMENTED - MANUAL QA REQUIRED | M1 | E4 `verify-return-exchange-settlement*.js`; no Phase 35C runtime. | UI flow needs launch QA. | No | Yes | Preserve; validate in launch QA. |
| CR-SALES-013 | SRC-SALES-RET | Return inventory | Returned same item keeps lifecycle identity where applicable. | Barcode doc intent aligns with return/exchange reuse; return routes support exact assets. | IMPLEMENTED BUT PARTIAL | M0 | E2 route/source; E4 return product support verifier. | Need inventory lifecycle browser proof. | No | No | Include in inventory launch QA. |
| CR-SALES-014 | SRC-SALES-EXC | Exchange | Exchange can return one item and sell replacement item(s). | `/sales/exchanges` and preview support asset/product mix and server financials. | IMPLEMENTED AND VERIFIED | M1 | E4 exchange verifiers and display API. | UI visual QA remains. | No | Accountant for tax presentation | Preserve. |
| CR-SALES-015 | SRC-SALES-EXC | Exchange display | Customer-facing exchange invoice should separate replacement and returned credit. | Exchange display API and UI summary exist. | IMPLEMENTED AND VERIFIED | M1 | E4 exchange display/print verifiers. | None for current simple flow. | No | Yes for tax policy | Preserve. |
| CR-SALES-016 | SRC-SALES-EXC | Exchange tax policy | Exchange VAT/tax treatment must be explicit. | Live exchange tax policy verifier exists. | IMPLEMENTED - MANUAL QA REQUIRED | M0 | E4 `verify-live-exchange-tax-policy.js`, `verify-exchange-tax-customer-facing-policy.js`. | Accountant sign-off still required. | No | Yes | Do not launch without sign-off. |
| CR-SALES-017 | SRC-SALES-INS | Installment sale | Invoice can be installment type with schedule. | Installment invoice enum, settings, and schedule code exist. | IMPLEMENTED AND VERIFIED | M1 | E4 installment enum/reconciliation verifiers. | Full UI collection QA needed. | No | No | Preserve. |
| CR-SALES-018 | SRC-SALES-INS | Installment collection | Installment payments can be collected and attributed. | `/installments/:id/pay` operator-gated and validated. | IMPLEMENTED AND VERIFIED | M1 | E4 HF5C and installment verifiers. | Cash/accounting linkage needs launch QA. | No | No | Preserve with receipt QA. |
| CR-SALES-019 | SRC-SALES-INS | Installment balances | Installment/customer balances stay reconciled. | Balance writeback/reconciliation verifiers exist. | IMPLEMENTED AND VERIFIED | M1 | E4 `verify-installment-reconciliation.js`, `verify-installment-balance-writeback.js`. | Historical data repair not in scope. | No | No | Preserve. |
| CR-SALES-020 | SRC-SALES-DEP | Deposit | Deposit invoice intent should reserve item and hold money. | Implemented differently as reservation advances and payments. | IMPLEMENTED DIFFERENTLY - BUSINESS INTENT SATISFIED | M1 | E4 reservation lifecycle verifiers; PC decisions. | Source calls it deposit invoice; app uses reservation. | No | Accountant for advances liability | Preserve reservation architecture. |
| CR-SALES-021 | SRC-SALES-DEP | Reservation completion/refund | Reservation can complete, refund, renew, amend, expire. | Reservation modules and reports exist. | IMPLEMENTED AND VERIFIED | M1 | E4 reservation verifier family. | Manual UI QA required. | No | No | Preserve. |
| CR-SALES-022 | SRC-SALES-GV | Gift voucher issue | Gift voucher can be issued. | Backend route/model and UI page exist. | IMPLEMENTED BUT NOT VERIFIED | M2 | E2 `giftVoucher.model.js`, `/gift-vouchers/issue`, page. | No current accounting/QA proof. | Owner may defer | Accountant if liability recognized | Disable or mark beta until validated. |
| CR-SALES-023 | SRC-SALES-GV | Gift voucher redeem | Gift voucher can be redeemed against sale. | Redeem route exists. | BACKEND ONLY | M2 | E2 `/gift-vouchers/redeem`. | Integration with POS/accounting not proven. | Yes | Yes | Defer from MVP or validate separately. |
| CR-SALES-024 | SRC-SALES-GV | Voucher liability | Voucher value must be a liability until redeemed/expired. | No strong evidence of complete liability accounting. | NOT IMPLEMENTED | M1 | E0/E2 no proven GL flow. | Financial risk if launched. | Yes | Yes | Exclude gift vouchers from Day-1. |
| CR-SALES-025 | SRC-SALES-CGP | Customer gold purchase | Customer gold purchase has intake/approval before asset/accounting effects. | CGP/IGP draft/approval governance exists. | IMPLEMENTED AND VERIFIED | M2 | E4 Gold Purchase draft/approval verifiers. | Customer-facing settlement/payment not fully signed off. | Yes | Yes | Use controlled pilot only. |
| CR-SALES-026 | SRC-SALES-CGP | No asset before approval | No physical asset/accounting entry before posting/approval. | Gold Purchase docs and verifier evidence indicate no downstream rows before approval. | IMPLEMENTED AND VERIFIED | M1 | E4 trace appendix and Gold Purchase verifiers. | Downstream settlement still deferred. | No | Yes | Preserve. |
| CR-SALES-027 | SRC-PRINT | Unified search | Read-only search across invoice types. | Search/print page and hooks exist; verifier exists. | IMPLEMENTED AND VERIFIED | M1 | E4 `verify-invoices-search-print.js`. | Visual/manual QA needed. | No | No | Preserve. |
| CR-SALES-028 | SRC-PRINT | Print/reprint | Official print/reprint should be controlled and auditable. | Invoice print view model, print events, operator gates exist. | IMPLEMENTED AND VERIFIED | M0 | E4 print and operator verifiers. | Exact visual pixel match not required. | No | Accountant/legal for invoice content | Preserve. |
| CR-SALES-029 | SRC-PRINT | PDF/export | PDF/print templates should render invoice documents. | Print template/config and view model exist. | IMPLEMENTED - MANUAL QA REQUIRED | M1 | E4 print config/verifiers; E2 UI. | Browser/pdf print QA not run here. | No | No | Include in launch QA. |
| CR-SALES-030 | SRC-POS-IMG-B | POS layout | POS should show customer, item entry, and payment panels. | Current POS page exists; source visual shows layout intent only. | IMPLEMENTED - MANUAL QA REQUIRED | M1 | E1 Phase 35B browser QA covered other pages; E2 POS page. | Phase 35C did not run browser QA. | No | No | QA desktop/mobile POS before launch. |

### C. Inventory, Barcode, Transfers, Gold Logic

| Requirement ID | Client Source | Section | Atomic Requirement | Current Implementation | Status | Market Priority | Evidence | Gap | Owner Decision | Accountant Sign-off | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CR-INV-001 | SRC-INV-GBW | Gold by weight | Item form captures description, karat, color, brand, model, supplier, purchase date, photo. | Inventory item forms and metadata exist. | IMPLEMENTED - MANUAL QA REQUIRED | M1 | E4 `verify-inventory-item-type-forms.js`; E2 `InventoryItemForm`. | Browser field-by-field QA needed. | No | No | Preserve for launch catalog. |
| CR-INV-002 | SRC-INV-GBW | Weights | Gross, stone, net gold, pure gold weights must be calculated. | Inventory type fields and gold logic source exist. | IMPLEMENTED BUT PARTIAL | M0 | E2 item form/config; E1 Phase 35A inventory audit. | Calculation QA and scale capture not proven. | No | Accountant for valuation method | Validate before selling weight-based items. |
| CR-INV-003 | SRC-GOLD-LOGIC | Karat | Pure gold weight depends on karat ratio. | Gold karat pricing/quote routes exist. | IMPLEMENTED BUT NOT VERIFIED | M0 | E2 `/gold/quote`, karat price routes. | No Phase 35C runtime calculation proof. | No | Yes | Add targeted validation phase before launch. |
| CR-INV-004 | SRC-INV-GBW | Purchase cost | Purchase cost, making cost, VAT and total cost should be captured/calculated. | Asset/product cost fields exist; purchase receipt links assets. | IMPLEMENTED BUT PARTIAL | M1 | E2 models/migrations; E1 Phase 35A. | Valuation governance incomplete. | No | Yes | Limit cost model; reconcile accounting. |
| CR-INV-005 | SRC-INV-GBW | Current cost | Current gold cost can update from current price. | Gold prices and valuation route exist. | IMPLEMENTED BUT PARTIAL | M2 | E2 gold price/company source migration, valuation report. | Gold price source tenant decision deferred. | Yes | Yes | Defer dynamic valuation beyond MVP. |
| CR-INV-006 | SRC-INV-GBW | Sales data | Sales making charge/minimum making charge must be stored. | Form fields/config suggest sales pricing data. | IMPLEMENTED - MANUAL QA REQUIRED | M1 | E2 inventory form/config. | Enforced discount/minimum policy not fully proven. | No | No | QA with POS discount policy. |
| CR-INV-007 | SRC-INV-GBP | Gold by piece | Piece-based gold item type should be supported. | Item type forms include gold_by_piece concepts. | IMPLEMENTED - MANUAL QA REQUIRED | M1 | E4 item type verifier. | Full sale/stock lifecycle QA needed. | No | No | Include in launch catalog only after QA. |
| CR-INV-008 | SRC-INV-DIA | Diamond jewellery | Diamond jewellery combines gold and diamond components. | Type definitions and item form fields include diamond details. | IMPLEMENTED BUT PARTIAL | M2 | E2 `lib/types.ts`, `InventoryTypeFields`. | Valuation/sale edge cases not launch-proven. | Owner catalog decision | Yes | Defer if launch catalog is gold-only. |
| CR-INV-009 | SRC-INV-DIA | Loose diamond | Loose stone is independent asset. | Types/forms include loose diamond. | IMPLEMENTED BUT PARTIAL | M2 | E2 source. | No verified end-to-end purchase/sale. | Owner catalog decision | Yes | Defer unless required for Day-1. |
| CR-INV-010 | SRC-INV-GEM | Gemstone jewellery | Gemstone jewellery captures gold and stone data. | Types/forms include gemstones. | IMPLEMENTED BUT PARTIAL | M2 | E2 source. | Not fully verified. | Owner catalog decision | Yes | Defer if not selling. |
| CR-INV-011 | SRC-INV-GEM | Loose gemstone | Loose gemstones are separate assets. | Types/forms indicate support. | IMPLEMENTED BUT PARTIAL | M2 | E2 source. | Not verified. | Owner catalog decision | Yes | Defer. |
| CR-INV-012 | SRC-INV-PEARL | Pearl jewellery/loose pearl | Pearl count/details and pearl item type supported. | Types/forms include pearls. | IMPLEMENTED BUT PARTIAL | M2 | E2 source. | Not verified. | Owner catalog decision | Yes | Defer if not launch catalog. |
| CR-INV-013 | SRC-XLS-ITEMS | Item workbook | Add item pages should expose required/optional fields per item type. | Form exists and item-type verifier exists. | IMPLEMENTED - MANUAL QA REQUIRED | M1 | E4 verifier; E2 workbook extraction. | UI field parity not manually checked here. | No | No | QA launch item types only. |
| CR-INV-014 | SRC-BARCODE | Barcode format | Barcode combines inventory code, item code, karat, serial. | Barcode identity/settings models and print code exist. | IMPLEMENTED AND VERIFIED | M0 | E4 `verify-barcode-inventory-foundation.js`, tag verifier. | Owner must approve exact tag format. | Yes | No | Preserve; owner visual sign-off. |
| CR-INV-015 | SRC-BARCODE | Barcode uniqueness | Barcode never reused except same physical item return/exchange. | Unique indexes and barcode verifier exist. | IMPLEMENTED AND VERIFIED | M0 | E4 barcode verifiers; Phase 35A DB evidence. | Return/exchange identity QA still useful. | No | No | Preserve. |
| CR-INV-016 | SRC-BARCODE | RFID | RFID should be assignable where used. | RFID fields/indexes exist; UI/forms mention RFID. | DATABASE FOUNDATION ONLY | M2 | E2 model/index evidence. | No full RFID device workflow. | Yes | No | Defer RFID hardware workflow. |
| CR-INV-017 | SRC-DASH | Transfers | Inventory/financial transfers should be supported. | Transfer routes and page exist; Phase 35A found transactional transfer controls. | IMPLEMENTED BUT PARTIAL | M2 | E2/E1 inventory audit. | Full transfer approval/receive UX not fully verified. | Owner if multi-branch Day-1 | No | Defer unless multi-branch launch. |
| CR-INV-018 | SRC-DASH | Stock audit | Inventory audit/stock count should exist. | Stock audit routes/models exist. | BACKEND ONLY | M2 | E2 `stock-audits` routes/models. | No operational stock-count QA. | No | No | Early post-launch unless required. |
| CR-INV-019 | SRC-DASH | Warehouse/bin | Branch warehouses/storage locations should govern stock. | No full warehouse/bin model found; branch-scoped assets exist. | NOT IMPLEMENTED | M0 | E1 Phase 35A DB evidence found no public warehouse table. | Multi-warehouse launch unsafe. | Owner scope | No | Launch with branch-level stock only or implement warehouse governance. |
| CR-INV-020 | SRC-DASH | Generic inventory safety | Inventory mutations must not bypass lifecycle rules. | Phase 35B blocks generic assets/products/stock movements/transfers mutation. | IMPLEMENTED AND VERIFIED | M0 | E4 `verify-market-launch-safety-containment.js`. | Dedicated lifecycle still needs QA. | No | No | Preserve. |

### D. Customers, Employees, Attendance, Payroll

| Requirement ID | Client Source | Section | Atomic Requirement | Current Implementation | Status | Market Priority | Evidence | Gap | Owner Decision | Accountant Sign-off | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CR-CRM-001 | SRC-CRM | Profile | Customer profile stores identity/contact/status data. | Customer model/routes/pages exist. | IMPLEMENTED AND VERIFIED | M1 | E4 customer pagination/statement verifiers; E2 source. | Full field parity not checked. | No | No | Preserve. |
| CR-CRM-002 | SRC-CRM | History | Customer transaction history should show invoices, returns, exchanges. | Customer detail/history and exchange display integration exist. | IMPLEMENTED AND VERIFIED | M1 | E4 customer history exchange display verifier. | Manual UI QA needed. | No | No | Preserve. |
| CR-CRM-003 | SRC-CRM | Balance | Customer balances/statements must be trustworthy. | Statement-v2/v3 and credit ledger foundations exist. | IMPLEMENTED BUT PARTIAL | M0 | E4 statement/credit verifiers; E1 accounting audit. | 2300/source-aware reconciliation still not fully market-signed. | No | Yes | Keep statement-v2; accountant sign-off before broad use. |
| CR-CRM-004 | SRC-CRM | Segmentation | Customer segmentation exists. | Loyalty/segments routes exist. | IMPLEMENTED BUT NOT VERIFIED | M3 | E2 `/loyalty/segments`. | No QA/product decision. | Yes | No | Defer. |
| CR-CRM-005 | SRC-CRM | Loyalty points | Loyalty points should accrue/redeem. | Loyalty routes and page exist. | IMPLEMENTED BUT NOT VERIFIED | M3 | E2 routes/page. | Not launch-verified. | Yes | No | Exclude from MVP unless owner approves. |
| CR-CRM-006 | SRC-CRM | Communication layer | Customer communication center. | No complete communication automation evidence. | NOT IMPLEMENTED | M3 | E0. | SMS/WhatsApp/email deferred. | Yes | No | Exclude. |
| CR-CRM-007 | SRC-CRM | KYC/attachments | Customer documents and KYC should be stored. | Customer attachments and KYC patch route exist. | IMPLEMENTED BUT NOT VERIFIED | M2 | E2 routes/models. | Privacy/retention QA needed. | No | No | Early post-launch. |
| CR-CRM-008 | SRC-CRM | Credit deposit/refund | Customer credit deposit/refund/application. | Backend routes and verifiers exist but UI/launch policy incomplete. | IMPLEMENTED BUT PARTIAL | M2 | E4 credit verifiers. | Accountant/business sign-off needed. | Yes | Yes | Defer from simplest MVP. |
| CR-HR-001 | SRC-HR | Employee profile | Employee profile and lifecycle management. | Employee routes/pages exist. | IMPLEMENTED - MANUAL QA REQUIRED | M1 | E2 employee routes/page. | HF5D simplified employee page deferred. | No | No | Preserve; simplify later. |
| CR-HR-002 | SRC-HR | Employee Code/PIN | Branch Account verifies Employee Code + six-digit PIN once. | HF5C single-level verified operator session implemented. | IMPLEMENTED AND VERIFIED | M0 | E4 `verify-single-level-employee-operator.js`. | None for current policy. | No | No | Preserve. |
| CR-HR-003 | SRC-HR | Employee permissions | Employee roles, direct grants/denials, branch access. | Employee authorization services and verifiers exist. | IMPLEMENTED AND VERIFIED | M0 | E4 HF5C verifiers. | Grouped ready roles deferred. | No | No | Preserve. |
| CR-HR-004 | SRC-HR | Attendance | Check-in/check-out and attendance records. | Attendance routes exist and are permission-guarded. | IMPLEMENTED BUT PARTIAL | M2 | E2 routes; E4 Phase 35B guards. | No complete attendance workflow/reports. | Yes | No | Defer beyond market core. |
| CR-HR-005 | SRC-HR | Payroll | Payroll generation, payslips, payment. | Routes/model exist; guards fixed; business process not complete. | IMPLEMENTED BUT UNSAFE | M3 | E4 Phase 35B guard containment; E2 payroll routes. | No calculation/accounting/treasury integration. | Yes | Accountant if payroll used | Exclude from MVP. |
| CR-HR-006 | SRC-HR | Performance | Performance management. | No implementation evidence. | NOT APPLICABLE TO MARKET MVP | OUT | E0. | Enterprise HR scope. | Yes | No | Exclude. |
| CR-HR-007 | SRC-HR | Employee session revocation | Admin can inspect/revoke employee sessions. | Routes guarded by employee verification permissions. | IMPLEMENTED AND VERIFIED | M0 | E4 HF5C/Phase35B. | None. | No | No | Preserve. |
| CR-HR-008 | SRC-HR | HR documents/contracts | Employee documents/contracts. | No strong evidence of employee document management. | NOT IMPLEMENTED | M2 | E0. | HR filing gap. | Owner | No | Defer. |

### E. Suppliers, Purchases, Treasury, Accounting

| Requirement ID | Client Source | Section | Atomic Requirement | Current Implementation | Status | Market Priority | Evidence | Gap | Owner Decision | Accountant Sign-off | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CR-PUR-001 | SRC-ACCT / SRC-GP | Suppliers | Supplier profile and documents. | Supplier pages/routes/documents exist and are scope-hardened. | IMPLEMENTED - MANUAL QA REQUIRED | M1 | E4 Phase 35B supplier read containment; E2 pages/routes. | Supplier UI QA needed. | No | No | Preserve. |
| CR-PUR-002 | SRC-ACCT | Purchase receipt | Purchase receipt should create stock/cost evidence. | Dedicated purchase receive route exists. | IMPLEMENTED BUT PARTIAL | M0 | E2 `/purchase-orders/receive`; E1 Phase 35A purchase audit. | Purchase lifecycle/reversal incomplete. | No | Yes | Minimal receive flow needs validation phase. |
| CR-PUR-003 | SRC-ACCT | Supplier payment | Supplier PO payment should create treasury/payment state. | `/purchase-orders/:id/pay` exists and Phase 35B validates treasury account. | IMPLEMENTED - MANUAL QA REQUIRED | M1 | E4 Phase 35B containment; E2 route. | Supplier statement reference assumptions. | No | Yes | QA and constrain payment references. |
| CR-PUR-004 | SRC-ACCT | Purchase VAT/RCM | Purchase VAT/RCM and tax treatment. | Purchase VAT migrations/verifiers exist. | IMPLEMENTED BUT NOT VERIFIED | M1 | E2/E1 purchase VAT verifier names and source. | Accountant sign-off and UI QA needed. | No | Yes | Separate validation before launch if purchases enabled. |
| CR-PUR-005 | SRC-ACCT | Purchase returns/debit notes | Supplier returns/debit notes/reversals. | No complete implementation evidence. | NOT IMPLEMENTED | M1 | E1 Phase 35A. | Cannot safely reverse supplier purchases. | Owner | Yes | Either implement or disable purchase-return workflow. |
| CR-PUR-006 | SRC-ACCT | Generic purchase safety | Generic purchase mutation must not bypass lifecycle. | Phase 35B blocks generic purchase-order mutation. | IMPLEMENTED AND VERIFIED | M0 | E4 Phase 35B verifier. | Dedicated lifecycle still partial. | No | No | Preserve. |
| CR-TREAS-001 | SRC-ACCT | Cash/bank accounts | Treasury tracks cash and bank accounts. | Treasury transactions/summary routes and UI exist. | IMPLEMENTED - MANUAL QA REQUIRED | M1 | E2 routes/UI; E4 Phase 35B validation. | Cashbox/register not implemented. | No | Yes | Use controlled manual treasury only. |
| CR-TREAS-002 | SRC-ACCT | Cash in/out | Manual cash in/out must require valid counter account. | Phase 35B added counter-account validation. | IMPLEMENTED AND VERIFIED | M0 | E4 Phase 35B verifier/browser QA. | Broader approvals not implemented. | No | Yes | Preserve. |
| CR-TREAS-003 | SRC-ACCT | Cash transfers | Transfers validate from/to accounts and branch. | Phase 35B validates transfer accounts/branch. | IMPLEMENTED AND VERIFIED | M1 | E4 Phase 35B. | Reconciliation/closing still partial. | No | Yes | Preserve with QA. |
| CR-TREAS-004 | SRC-ACCT | Treasury closing | Daily closing/variance capture. | Treasury closing route exists. | IMPLEMENTED BUT PARTIAL | M0 | E2 routes; E1 Phase 35A flagged cash controls. | No cashbox/register/shift open/close. | Owner | Yes | M0 small fix or disable cashbox claims. |
| CR-TREAS-005 | SRC-ACCT | Cashbox/register/shift | Branch cashbox/register/shift control. | No full implementation evidence. | NOT IMPLEMENTED | M0 | E1 Phase 35A/35B exclusions. | Day-1 cash-control risk. | Owner | Yes | Implement minimal cashbox or explicit operating limitation. |
| CR-ACC-001 | SRC-ACCT-FULL | Chart of accounts | Chart of accounts and ledger viewer. | Accounts/journal routes and UI exist. | IMPLEMENTED BUT PARTIAL | M1 | E2 routes/pages; E1 Phase 35A. | Chart governance/sign-off needed. | Owner | Yes | Lock chart before launch. |
| CR-ACC-002 | SRC-ACCT-FULL | Manual journals | Manual draft/post/reverse lifecycle. | Journal draft/post/reverse scripts/routes exist. | IMPLEMENTED AND VERIFIED | M1 | E4 accounting manual draft verifier family. | Browser QA not run in Phase 35C. | No | Yes | Preserve. |
| CR-ACC-003 | SRC-ACCT-FULL | Auto posting | Active workflows post to GL automatically. | Posting service exists and several flows integrate. | IMPLEMENTED BUT PARTIAL | M0 | E2 `posting.service.js`; E1 audits. | Not all active workflows fully proven. | No | Yes | Validate launch workflows only. |
| CR-ACC-004 | SRC-ACCT-FULL | Account balances | Account balance mirrors must match journal lines. | Phase 35A found material divergence. | IMPLEMENTED BUT UNSAFE | M0 | E1 Phase 35A accounting audit. | Launch financial statements unsafe until repaired. | No | Yes | M0 repair/reconciliation phase. |
| CR-ACC-005 | SRC-ACCT-FULL | Fiscal periods | Period close/lock/fiscal calendar. | No complete period close implementation. | NOT IMPLEMENTED | M0 | E1 Phase 35A. | Backdated edits/reporting risk. | Owner/accountant | Yes | Minimal period lock or explicit launch control. |
| CR-ACC-006 | SRC-ACCT | VAT engine | VAT reports and country rules. | Tax summary and VAT report verifier exists. | IMPLEMENTED BUT PARTIAL | M0 | E2 reports; E1 VAT verifier. | UAE/legal sign-off required. | No | Yes | Accountant sign-off before production invoicing. |
| CR-ACC-007 | SRC-ACCT | AR/AP | Customer/supplier balances and outstanding invoices. | Customer statements and supplier statements exist. | IMPLEMENTED BUT PARTIAL | M1 | E2 routes; E4 customer/supplier statement verifiers. | Account balance/supplier reference gaps. | No | Yes | Validate launch statements. |
| CR-ACC-008 | SRC-ACCT-FULL | Financial statements | Financial statements/trial balance/profit/cash reports. | Several report routes exist. | IMPLEMENTED BUT PARTIAL | M2 | E2 report routes. | Not all source reports implemented. | Owner/accountant | Yes | Essential reports only in MVP. |
| CR-ACC-009 | SRC-ACCT-FULL | Gold pool/liability | Gold pool accounting/liability presentation. | Gold pool/customer gold foundations exist. | DATABASE FOUNDATION ONLY | DECISION | E2 models/services. | Accounting policy unresolved. | Owner | Yes | Accountant decision required. |
| CR-ACC-010 | SRC-ACCT-FULL | UAE e-invoicing | UUID/QR/government queue and integrations. | Some legacy/spec references exist, no production integration. | ACCOUNTANT SIGN-OFF REQUIRED | DECISION | E1 scope docs. | Legal/compliance decision required. | Owner | Yes | Exclude until signed off. |
| CR-ACC-011 | SRC-ACCT-FULL | Accounting generic safety | Generic accounting mutation cannot bypass posting lifecycle. | Phase 35B contained high-risk generic paths; accounts labels still editable under permission. | IMPLEMENTED BUT PARTIAL | M0 | E4 Phase 35B; E1 Phase 35A. | Chart governance sign-off. | Owner | Yes | Lock chart/account edits for launch. |

### F. Audit, Reports, Settings, UI, Integrations

| Requirement ID | Client Source | Section | Atomic Requirement | Current Implementation | Status | Market Priority | Evidence | Gap | Owner Decision | Accountant Sign-off | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CR-AUD-001 | SRC-AUDIT | Logs | Full event logging for business actions. | Audit service/model/routes exist. | IMPLEMENTED - MANUAL QA REQUIRED | M0 | E2 `audit.service.js`, `auditLog.model.js`; E4 auth/sales/gold verifiers. | Not every route audited equally. | No | No | Preserve and expand by workflow. |
| CR-AUD-002 | SRC-AUDIT | Before/after | Before/after changes shown in audit details. | Audit diff viewer exists. | IMPLEMENTED BUT NOT VERIFIED | M2 | E2 `AuditDiffViewer`. | No broad QA. | No | No | Early post-launch. |
| CR-AUD-003 | SRC-AUDIT | Actor tracking | User, employee, branch, device/session tracking. | Technical and employee session attribution implemented. | IMPLEMENTED AND VERIFIED | M0 | E4 HF5A/HF5C. | Device tracking depth not fully assessed. | No | No | Preserve. |
| CR-AUD-004 | SRC-AUDIT | Immutable logs | Audit should be immutable/hash-chain protected. | Audit hash chain migration/verifier exists. | IMPLEMENTED AND VERIFIED | M0 | E4 `verify-audit-chain.js`; migration. | Retention/archiving not complete. | No | No | Preserve. |
| CR-AUD-005 | SRC-AUDIT | Search/filter | Audit search/filter by period/module/user. | Audit period filter verifier and UI exist. | IMPLEMENTED - MANUAL QA REQUIRED | M1 | E4 backend verifier; E2 UI. | Browser QA not run here. | No | No | Include in launch QA. |
| CR-AUD-006 | SRC-AUDIT | Retention/archiving | Retention/archive rules. | No implementation evidence. | NOT APPLICABLE TO MARKET MVP | OUT | E0. | Long-term governance. | Owner | No | Defer. |
| CR-REP-001 | SRC-REPORTS | Common filters | Reports should support period/branch filters and permissions. | Phase 35B branch/report hardening exists. | IMPLEMENTED AND VERIFIED | M0 | E4 Phase 35B. | Some reports still need manual QA. | No | No | Preserve. |
| CR-REP-002 | SRC-REPORTS | Sales reports | Sales/tax/profit summaries. | Report routes exist. | IMPLEMENTED - MANUAL QA REQUIRED | M1 | E2 routes; E1 Phase 35A. | Visual/export QA needed. | No | Accountant for tax/profit | Include essentials only. |
| CR-REP-003 | SRC-REPORTS | Inventory reports | Inventory valuation and stock reports. | Inventory valuation route/page exists. | IMPLEMENTED BUT PARTIAL | M1 | E2 route/page; E1 Phase 35A. | Valuation/accounting sign-off. | No | Yes | Validate before launch. |
| CR-REP-004 | SRC-REPORTS | Reservation reports | Reservation reports and reconciliation. | Reservation report family implemented. | IMPLEMENTED AND VERIFIED | M1 | E4 reservation governance reports verifier. | Manual QA still useful. | No | No | Preserve. |
| CR-REP-005 | SRC-REPORTS | Accounting reports | Trial balance, ledger, reconciliation reports. | Routes exist. | IMPLEMENTED BUT PARTIAL | M2 | E2 routes. | Account balance repair needed first. | No | Yes | Defer broad accounting reports until repair. |
| CR-REP-006 | SRC-REPORTS | Executive reports | Executive growth/forecast/risk dashboards. | Not implemented as requested. | NOT APPLICABLE TO MARKET MVP | OUT | E0. | Enterprise analytics. | Owner | No | Exclude. |
| CR-REP-007 | SRC-REPORTS | Export | Report export should exist. | Some exports exist; not universal. | IMPLEMENTED BUT PARTIAL | M2 | E2 routes/pages; reservation export E4. | No full export matrix. | Owner | No | Defer universal export. |
| CR-REP-008 | SRC-REPORTS | Performance | Reports should be safe under pagination and filters. | Pagination verifiers exist for multiple domains. | IMPLEMENTED BUT NOT VERIFIED | M1 | E1/E2 verifier inventory. | Not rerun in Phase 35C. | No | No | Include in validation phase. |
| CR-SET-001 | SRC-SETTINGS | Company profile | Company legal/tax/branding settings. | Settings and company update routes exist. | IMPLEMENTED - MANUAL QA REQUIRED | M1 | E2 settings context/routes. | Document upload/branding QA needed. | No | Yes for tax identity | Preserve. |
| CR-SET-002 | SRC-SETTINGS | Branch settings | Branch info/status and assignment. | Branch routes/settings exist; branch scope hardened. | IMPLEMENTED AND VERIFIED | M0 | E4 Phase 35B/HF5B. | Warehouse assignment incomplete. | No | No | Preserve. |
| CR-SET-003 | SRC-SETTINGS | Users/roles/permissions | System account, role, permission management. | Super Admin/System Accounts implemented. | IMPLEMENTED AND VERIFIED | M0 | E4 HF5A/HF5B/HF5C. | Grouped permissions/ready roles deferred. | No | No | Preserve. |
| CR-SET-004 | SRC-SETTINGS | Permission matrix | Field/data permissions. | Module/action permissions exist; field-level not complete. | IMPLEMENTED BUT PARTIAL | M2 | E2 permission catalog/routes. | Field-level permissions absent. | Owner | No | Defer field-level matrix. |
| CR-SET-005 | SRC-SETTINGS | Numbering | Document numbering engine. | Invoice number and reservation number foundations exist. | IMPLEMENTED BUT PARTIAL | M1 | E2 migrations/verifiers. | Universal configurable numbering not proven. | Owner | No | Lock simple numbering. |
| CR-SET-006 | SRC-SETTINGS | Tax/currency/language | VAT, currency, Arabic/English settings. | Settings context and messages exist. | IMPLEMENTED - MANUAL QA REQUIRED | M1 | E2 settings/messages; E1 QA. | Full locale QA needed. | No | Yes for VAT | Preserve. |
| CR-SET-007 | SRC-SETTINGS | Backup/integrations | Backup/integration hub. | Local backups used by phases; no product backup/integration UI. | NOT IMPLEMENTED | M2 | E0 product evidence. | Operational backup plan required outside app. | Owner | No | Defer UI; maintain manual backup procedure. |
| CR-UI-001 | SRC-POS-IMG-B | POS visual | POS layout should minimize steps for customer, scan/manual item entry, payment, finish sale. | POS page and hooks exist; visual differs but intent aligned. | IMPLEMENTED DIFFERENTLY - BUSINESS INTENT SATISFIED | M1 | E2 `app/.../pos/page.tsx`, `use-pos`. | Browser QA required. | No | No | Preserve current UI; QA usability. |
| CR-UI-002 | SRC-INV-IMG-B | Invoice visual | Invoice print should show bilingual header, tax invoice, customer, invoice data, item rows, VAT, payment methods, signatures. | Print view model/template/config exist. | IMPLEMENTED - MANUAL QA REQUIRED | M1 | E4 print view model verifier; image inspected. | Pixel-perfect match not required; legal content sign-off needed. | No | Yes | Use current template with sign-off. |
| CR-UI-003 | SRC-DASH | Arabic RTL | Arabic RTL must work. | Arabic messages and layout direction exist; Phase 35B Arabic Treasury QA passed. | IMPLEMENTED - MANUAL QA REQUIRED | M1 | E1/E2. | Full app RTL pass not run. | No | No | Run launch QA. |
| CR-UI-004 | SRC-DASH | English LTR | English LTR must work. | English messages/layout exist; Phase 35B English Treasury QA passed. | IMPLEMENTED - MANUAL QA REQUIRED | M1 | E1/E2. | Full app LTR pass not run. | No | No | Run launch QA. |
| CR-UI-005 | SRC-DASH | Mobile/desktop | Main workflows should be usable on mobile/desktop. | Some responsive QA exists. | IMPLEMENTED BUT NOT VERIFIED | M2 | E1 Phase 35B mobile Treasury only. | No broad responsive QA. | No | No | Launch QA phase. |
| CR-PROD-001 | SRC-DASH / SRC-ACCT | Production data source | Production must not use mock/local fallback. | Production data-source verifier exists. | IMPLEMENTED AND VERIFIED | M0 | E4 `verify-production-data-source.js`. | Production deployment not performed. | No | No | Preserve. |
| CR-PROD-002 | SRC-DASH | External integrations | Gold market API, WhatsApp/SMS, government integrations. | Gold live route exists; production external integrations deferred. | DEFERRED BY APPROVED DECISION | M3 | E1 scope docs. | Integration decisions pending. | Yes | Some | Exclude from MVP. |
| CR-PROD-003 | SRC-DASH | Offline mode | Offline/hybrid operation. | Only frontend foundations observed. | DEFERRED BY APPROVED DECISION | M3 | E1 scope docs; E2 offline banner. | No sync engine. | Yes | No | Exclude. |
| CR-PROD-004 | SRC-DASH | Deployment readiness | Production deployment/monitoring/backups. | Not part of repo implementation phase. | DEFERRED BY APPROVED DECISION | DECISION | E1 prior phases untouched production. | Deployment plan needed later. | Yes | No | Separate release validation phase. |

## 6. Already Implemented - Preserve and Do Not Rebuild

| Foundation | Complete Enough For | Not Included | Why Not Rebuild | Extension Point |
|---|---|---|---|---|
| Sales/POS draft/post lifecycle | Controlled Day-1 sale flow | Advanced draft recovery and every item subtype | Server-side financial truth and operator controls are already verified. | Extend item-type QA and UI polish. |
| Sales returns | Invoice-backed returns | Generic refunds unrelated to invoices | Existing exact-line/asset model is safer than broad refund shortcuts. | Add refund/reversal policy later. |
| Sales exchanges | Preview/execute, print/display | Accountant-approved final tax language | Existing exchange display separates returned/replacement values. | Accountant policy and UI QA. |
| Installment collection | Standalone installment payment collection | Full credit-risk/aging suite | Collection path is operator-gated and verified. | Add reports and collection UX later. |
| Reservation/deposit replacement | Deposit business intent | Literal "deposit invoice" screen | Reservation model is stronger and already verified with reports/reconciliation. | Keep terminology simple for users. |
| Print templates/config | Invoice print/reprint | Pixel-perfect source image clone | Current configurable print stack is safer and reusable. | Legal/accountant template sign-off. |
| Customer history/statements | Customer operational view | Advanced CRM automation | Existing statement and exchange display work should not be rebuilt. | Expand statement-v3 after sign-off. |
| Employee authorization | Branch Account operator security | HF5D/HF5E role simplification | HF5C closed the market-needed single PIN model. | Simplified employee page and grouped roles. |
| Super Admin/Branch Accounts | Market-ready access model | 2FA/break-glass/service accounts | Owner login and fixed branch accounts are verified. | Optional security hardening later. |
| Audit foundation | Critical traceability | Full retention/archive policy | Hash-chain and actor tracking exist. | Expand event coverage. |
| Manual accounting lifecycle | Manual journals | Period close and balance repair | Draft/post/reverse patterns are valuable foundations. | Fiscal close and reconciliation repair. |
| Gold Purchase governance | Draft/approval control | Full accounting/settlement execution | Maker-checker foundation is safer than direct posting. | Phase for payment/accounting policy. |
| Barcode/item foundations | Unique sellable identity | Hardware RFID workflow | Unique barcode/tag logic is core and verified. | Owner tag-format sign-off and RFID later. |

## 7. Implemented Differently but Satisfies Intent

| Client Wording/Design | Current Design | Why Intent Is Satisfied | Remaining Difference | Market Impact |
|---|---|---|---|---|
| Deposit Invoice | Reservation with advance payments | Holds item/customer money and supports completion/refund/reports. | User-facing name differs. | Low if communicated. |
| Level-based employee authorization | Single verified Employee session | Owner approved simpler PIN once model. | No Level 1/2/step-up. | Positive simplification. |
| Super Admin employee/PIN governance | Email/password-only Super Admin | Owner approved Super Admin direct full access. | No synthetic employee. | Positive simplification. |
| Literal POS visual | Existing POS flow and components | Same business workflow: customer, item entry, payment, sale completion. | Not pixel-perfect. | QA usability, no rebuild. |
| Invoice visual reference | Configurable bilingual print template | Captures tax invoice structure and can evolve. | Exact image styling differs. | Needs sign-off, not rebuild. |
| Deposit payment shortcut | Reservation payment APIs | Safer audit/reconciliation model. | Different route terminology. | Accept. |
| Global approval flow | Specific Gold Purchase/reservation approvals | Approval is wired where business risk demanded it. | No universal approval engine. | Defer. |
| Field permission matrix | Module/action permissions plus Employee direct denials | Covers market-critical access; field-level is advanced. | No full field ACL. | Defer. |
| Offline/hybrid shell | Online-first app with some offline UI foundations | MVP can operate online-only. | No offline sync. | Exclude from MVP. |
| Advanced CRM | Customer history/statement/credit foundations | Core shop needs customer records and balances first. | Campaign/communication missing. | Defer. |

## 8. Partial Implementations

| Area | Existing Foundation | Exact Missing Part | Risk | MVP Need | Future Phase |
|---|---|---|---|---|---|
| Inventory valuation | Assets, stock movements, inventory valuation route | Accountant-approved valuation/COGS governance and warehouse rules | Wrong profit/stock value | M0 if using valuation reports | Accounting/inventory repair |
| Purchase lifecycle | Receive/pay routes, supplier docs | Returns, debit notes, reversal, supplier payable reconciliation | Irreversible purchase errors | M0 if purchase entry enabled | Purchase lifecycle hardening |
| Treasury | Cash/bank transactions, validation | Cashbox/register/shift opening/closing | Cash loss/dispute | M0 for cash-heavy shop | Minimal treasury cashbox |
| Accounting | GL/journals/reports | Account.balance repair, fiscal period lock, VAT filing | Untrustworthy financial statements | M0 | Accounting repair |
| Payroll | Routes/models/guards | Calculation, approval, payment, posting | Incorrect salaries | Not MVP | HR/payroll phase |
| Gift voucher | Issue/redeem routes/model | Liability accounting, POS redemption validation | Liability understatement | Not MVP unless validated | Gift voucher phase |
| Diamond/gem/pearl | Form/type foundations | End-to-end purchase/sale/valuation QA | Item valuation errors | Depends launch catalog | Item subtype validation |
| Reports | Many routes | Full client report catalog and exports | Over-promising | Essential only | Reporting roadmap |
| Production integrations | Some gold/live hooks | Government/WhatsApp/SMS/offline | Compliance/integration failure | Not MVP | Integration phase |

## 9. Genuine Missing Requirements

| Requirement | No Existing Implementation Evidence | Market Priority | Consequence | Recommendation |
|---|---|---|---|---|
| Cashbox/register/shift control | No full register/shift model found. | M0 | Weak daily cash accountability. | Implement minimal cashbox or launch with explicit cash procedure. |
| Purchase returns/debit notes/reversal | No complete dedicated flow found. | M1 | Purchase mistakes cannot be reversed safely. | Disable purchase-return claims or implement small reversal phase. |
| Fiscal period close/lock | No complete period close implementation. | M0 | Backdated edits can undermine reports. | Add minimal period lock or strict launch policy. |
| Product backup/integration hub | No product UI or workflow. | M2 | Operational backup depends on manual/admin process. | Defer UI; define manual backup SOP. |
| Communication automation | No complete SMS/WhatsApp/email campaign layer. | M3 | CRM automation unavailable. | Exclude from MVP. |

## 10. Unsafe or Unverified Requirements

| Area | Current Behavior | Risk | Existing Guard | Missing Proof | Required Validation |
|---|---|---|---|---|---|
| Account balances | Prior audit found Account.balance divergence. | Financial reports unsafe. | Journal lines and reconciliation reports exist. | Repair/clean proof. | M0 accounting repair. |
| Treasury daily cash | Treasury validation improved. | No register/shift accountability. | Counter-account/branch validation. | Cash close process. | Minimal cashbox or operating limitation. |
| Purchase lifecycle | Receive/pay exist. | Missing returns/debit notes/reversal. | Generic mutation containment. | Dedicated reversal proof. | Purchase hardening phase. |
| VAT/UAE invoice | VAT fields/reports exist. | Legal/accounting mismatch. | Configurable tax/report foundations. | Accountant/legal sign-off. | Sign-off before production. |
| Gift vouchers | Issue/redeem backend exists. | Liability and redemption accounting not proven. | Routes/model. | End-to-end flow. | Defer/disable. |
| Inventory valuation | Valuation report exists. | Inaccurate inventory/profit if method wrong. | Barcode/assets/COGS foundations. | Accountant-approved method. | Validate launch catalog. |
| Responsive UI | Some pages QA'd. | Mobile/RTL issues in core sale. | Locale/layout foundations. | Full flow QA. | Browser QA phase. |

## 11. Simple Market MVP Scope Lock - Proposed

IN MVP - REQUIRED BEFORE LAUNCH:
- CR-GLOBAL-003
- CR-SALES-002 through CR-SALES-009
- CR-SALES-011 through CR-SALES-019
- CR-SALES-020, CR-SALES-021, CR-SALES-027 through CR-SALES-030
- CR-INV-001 through CR-INV-007, CR-INV-014, CR-INV-015, CR-INV-019, CR-INV-020
- CR-HR-001 through CR-HR-003, CR-HR-007
- CR-PUR-001 through CR-PUR-006 if purchase receipt/payment is enabled
- CR-TREAS-001 through CR-TREAS-005
- CR-ACC-001 through CR-ACC-007, CR-ACC-011
- CR-AUD-001, CR-AUD-003, CR-AUD-004
- CR-REP-001 through CR-REP-004
- CR-SET-001 through CR-SET-006
- CR-UI-001 through CR-UI-004
- CR-PROD-001

IN MVP - ALREADY COMPLETE, PRESERVE:
- Super Admin/Branch Account/Employee operator model: CR-HR-002, CR-HR-003, CR-HR-007, CR-SET-003
- Sales/POS financial truth: CR-SALES-002 through CR-SALES-005, CR-SALES-008, CR-SALES-009
- Return/exchange/installment operator enforcement: CR-SALES-011, CR-SALES-014, CR-SALES-017 through CR-SALES-019
- Reservation/deposit replacement: CR-SALES-020, CR-SALES-021
- Barcode uniqueness: CR-INV-014, CR-INV-015
- Generic mutation containment and branch/report hardening: CR-INV-020, CR-PUR-006, CR-REP-001
- Audit actor/hash-chain foundation: CR-AUD-003, CR-AUD-004

DEFERRED AFTER LAUNCH:
- Gift voucher full accounting and POS redemption: CR-SALES-022 through CR-SALES-024
- Customer Gold Purchase full settlement: CR-SALES-025, CR-SALES-026 unless explicitly piloted
- Diamond/gem/pearl/loose-stone launch catalog: CR-INV-008 through CR-INV-012
- RFID hardware workflow: CR-INV-016
- Multi-branch transfers and stock audit UX: CR-INV-017, CR-INV-018
- Customer segmentation/loyalty/communication: CR-CRM-004 through CR-CRM-008
- Attendance/payroll: CR-HR-004, CR-HR-005
- Full report catalog/export/BI: CR-REP-005 through CR-REP-008
- Field-level permissions and universal numbering: CR-SET-004, CR-SET-005
- Broad mobile/tablet polish beyond market-critical flows: CR-UI-005

EXCLUDED FROM CURRENT PRODUCT SCOPE:
- HR performance management: CR-HR-006
- Audit retention/archive automation: CR-AUD-006
- Executive forecasting/advanced BI: CR-REP-006
- Offline sync, WhatsApp/SMS campaigns, government integrations until signed off: CR-PROD-002 through CR-PROD-004

## 12. Owner Decision Register

| Decision ID | Requirement IDs | Decision Needed | Options | Recommended Simple Option | Consequence |
|---|---|---|---|---|---|
| OD-35C-001 | CR-INV-008..012 | Day-1 catalog includes diamonds/gems/pearls? | Gold-only / selected subtype / all subtypes | Gold-only or one verified subtype | Reduces valuation and QA risk. |
| OD-35C-002 | CR-TREAS-005 | Cashbox/register required before launch? | Implement minimal / manual SOP / no cash | Minimal cashbox if cash sales launch | Prevents weak cash accountability. |
| OD-35C-003 | CR-SALES-022..024 | Gift vouchers in Day-1? | Disable / beta / full validation | Disable | Avoids liability accounting risk. |
| OD-35C-004 | CR-SALES-025..026 | Customer Gold Purchase in Day-1? | Disable / controlled pilot / full settlement | Controlled pilot only after accountant sign-off | Avoids unapproved gold liability/payment treatment. |
| OD-35C-005 | CR-PUR-002..005 | Purchase entry strategy | Opening stock only / simple receive-pay / full lifecycle | Simple receive-pay with no returns until hardened | Keeps inventory sourcing controlled. |
| OD-35C-006 | CR-CRM-004..008 | CRM growth features | Defer / include loyalty / include communications | Defer | Protects launch simplicity. |
| OD-35C-007 | CR-PROD-002..004 | Production integrations | None / selected / full | None for MVP | Avoids external dependency risk. |
| OD-35C-008 | CR-REP-005..008 | Report promise level | Essential / full catalog | Essential only | Avoids selling unfinished BI. |

## 13. Accountant Sign-off Register

| Accounting Decision | Affected Requirements | Existing Behavior | Options | Required Evidence | Launch Impact |
|---|---|---|---|---|---|
| VAT/tax invoice content | CR-SALES-006, CR-SALES-016, CR-UI-002, CR-ACC-006, CR-ACC-010 | VAT fields/reports/print exist. | Current template / adjusted template / disable official tax claim | Accountant-approved invoice sample and VAT report | Required before production invoices. |
| Exchange tax treatment | CR-SALES-014..016 | Exchange policy/display exists. | Tax on differential / tax on replacement / jurisdiction-specific | Written accountant policy and sample invoices | Required if exchanges launch. |
| Reservation advances liability | CR-SALES-020..021 | Reservation advances account config exists. | Liability account / customer credit / deposit revenue | Account mapping and reports | Required if reservations launch. |
| Account.balance repair | CR-ACC-004 | Prior audit found divergence. | Repair mirror / ignore mirror / computed-only reports | Clean reconciliation evidence | M0 before financial reports. |
| Period close/VAT filing | CR-ACC-005..006 | No complete close/filing. | Minimal lock / manual SOP / full close module | Closing policy and lock tests | M0 or explicit limitation. |
| Gold pool/customer gold | CR-ACC-009, CR-SALES-025..026 | Foundations exist. | Liability/pool presentation variants | Written accounting policy | Required for CGP launch. |
| Gift voucher liability | CR-SALES-022..024 | Routes exist, accounting not proven. | Deferred revenue/liability / disable | End-to-end GL proof | Disable unless signed off. |

## 14. Client Expectation Gap Register

| Client Expected | System Currently Provides | Difference | User-Facing Impact | Must Communicate? | Resolution |
|---|---|---|---|---|---|
| Deposit Invoice | Reservation with advance payments | Different label/workflow | Users see reservation, not invoice named deposit | Yes | Train/label as reservation deposit. |
| Full report catalog | Essential reports and many foundations | Not every listed report | Some menu/report expectations deferred | Yes | Publish MVP report list. |
| Full accounting suite | GL/journals/reports foundations | No period close and balance repair pending | Financial statements not launch-safe yet | Yes | M0 accounting repair. |
| Full payroll | Guarded routes/basic models | No complete payroll process | HR payroll unavailable | Yes | Exclude payroll from MVP. |
| All item subtypes | Forms/types for many subtypes | End-to-end QA incomplete | Some items may be disabled | Yes | Launch catalog decision. |
| Offline/hybrid | Online-first app | No sync | Offline use unavailable | Yes | Exclude. |
| Government integrations | Config/source references only | No production integration | Compliance integrations absent | Yes | Accountant/legal decision. |
| POS visual exactness | Functional POS | Not pixel-perfect | Low if workflow is efficient | Optional | QA usability, not pixel match. |

## 15. UI and Visual Reference Comparison

Dashboard:
- Source expects a broad module hub. Current app has dashboard route, widgets, sidebar, branch switcher, auth guard, and module pages.
- Current gap is full market browser QA, not a full rebuild.

POS visual reference:
- Source image shows three major panels: customer, item entry/scanning, payment/finish sale.
- Current POS has a dedicated page and POS hooks; Phase 35C did not run browser QA.
- Pixel-perfect matching is not a binding requirement. Workflow parity is the MVP concern.

Invoice visual reference:
- Source image requires bilingual tax invoice header, customer/invoice details, item rows, VAT, payment methods, total, notes/signatures/contact.
- Current print stack has invoice print view model, templates, custom block/config verifiers.
- Required before production: accountant/legal sign-off on VAT/TRN/QR/wording and a print QA pass.

Item entry workbook:
- Workbook contains required/optional fields and formulas for item types.
- Current item type form foundations exist; launch should validate only the item categories actually sold on Day-1.

Responsive and RTL/LTR:
- Arabic/English resources and direction support exist.
- Phase 35B browser QA covered Treasury in English, Arabic, and mobile width. It did not cover all POS/inventory/accounting flows.

## 16. Report and Settings Coverage

Operationally necessary before launch:
- Sales/POS daily sales report
- Invoice search/print
- Customer statement/history
- Inventory list/status and valuation limited to launch catalog
- Treasury transaction/summary
- Tax summary or VAT report with accountant sign-off
- Audit log search
- Branch/company/user/role/permission settings

Advanced reports/settings deferred:
- Executive forecasts/growth/risk
- Full export coverage
- Universal field-level permissions
- Backup/integration hub UI
- Advanced notification templates
- Full fiscal close reporting
- Complete HR/payroll reports

Implemented:
- Reservation report family
- Ledger/trial-balance/reconciliation route foundations
- Inventory valuation route/page
- Tax/financial/profit summaries
- Settings context and backend settings routes
- System Accounts, roles, permissions

Partial:
- Financial reports are blocked by account balance repair/sign-off.
- Inventory valuation depends on valuation method and launch catalog.
- Report exports are not universal.

## 17. Launch Blocker Register

| Blocker ID | Requirement IDs | Current Evidence | Severity | Smallest Safe Fix | Dependency | Recommended Phase |
|---|---|---|---|---|---|---|
| LB-35C-001 | CR-ACC-004 | Phase 35A found Account.balance divergence. | M0 | Repair/reconcile balances or make reports computed-only. | Accountant sign-off | Phase 35D Accounting Repair |
| LB-35C-002 | CR-TREAS-005 | No cashbox/register/shift. | M0 | Minimal cashbox open/close or explicit manual SOP limitation. | Owner decision | Phase 35D/E Treasury MVP |
| LB-35C-003 | CR-ACC-005 | No fiscal period close/lock. | M0 | Minimal period lock for posted transactions or manual launch policy. | Accountant | Phase 35D Accounting Repair |
| LB-35C-004 | CR-PUR-002..005 | Purchase lifecycle partial. | M0/M1 | Limit to opening stock or validate simple receive/pay and disable returns. | Owner/accountant | Purchase MVP Hardening |
| LB-35C-005 | CR-INV-002..004, CR-INV-019 | Inventory valuation/warehouse governance partial. | M0 | Launch with branch-level stock and validated gold-only item flow. | Owner catalog decision | Inventory MVP Validation |
| LB-35C-006 | CR-SALES-006, CR-ACC-006, CR-ACC-010 | VAT/UAE tax sign-off pending. | M0 | Accountant-approved invoice/report samples. | Accountant | Tax/Print Sign-off |
| LB-35C-007 | CR-UI-001..005 | Full browser QA not run for all market flows after 35B. | M0 | Browser QA over locked MVP flows. | Fixed MVP scope | Release Validation |
| LB-35C-008 | CR-SALES-022..024 | Gift voucher accounting unproven. | M1 if enabled | Disable for launch. | Owner | Scope lock |

## 18. Deferred Product Backlog

Early post-launch:
- CR-INV-017, CR-INV-018: Transfers and stock audit UX.
- CR-CRM-007, CR-CRM-008: Customer documents/credit workflows.
- CR-REP-007, CR-REP-008: Export and pagination hardening across all reports.
- CR-SET-005: Universal numbering engine.

Growth:
- CR-INV-008 through CR-INV-012: Diamond/gem/pearl categories after catalog decision.
- CR-CRM-004, CR-CRM-005: Segmentation and loyalty.
- CR-HR-004: Attendance.

Enterprise:
- CR-HR-005, CR-HR-006: Payroll and performance.
- CR-REP-006: Executive analytics/forecasting.
- CR-AUD-006: Retention/archive.
- CR-SET-004: Field/data permission matrix.

Integration-dependent:
- CR-PROD-002: Gold market API, WhatsApp/SMS, government integrations.
- CR-PROD-003: Offline sync.
- CR-PROD-004: Production deployment/monitoring automation.

Client/accountant-decision-dependent:
- CR-SALES-022 through CR-SALES-026: Gift voucher and Customer Gold Purchase.
- CR-ACC-009, CR-ACC-010: Gold-pool liability and UAE e-invoicing.

## 19. Recommended Implementation Roadmap

Phase 35D - Accounting and Treasury Launch Repair
- Objective: remove M0 financial-trust blockers.
- Requirement IDs: CR-ACC-004, CR-ACC-005, CR-ACC-006, CR-TREAS-004, CR-TREAS-005.
- Included scope: balance reconciliation, period lock/minimal close, accountant-approved VAT/tax invoice samples, minimal cashbox or explicit limitation.
- Excluded scope: full enterprise accounting suite, payroll, BI.
- Likely files/services/tables: `erp.routes.js`, `posting.service.js`, journal/account models, treasury routes/UI, reports.
- Migration expectation: possible additive migration for cashbox/periods if owner chooses implementation rather than limitation.
- Accounting sign-off: required.
- Backup: required before any DB mutation.
- Verifier plan: accounting repair verifier, treasury cashbox/limitation verifier, VAT sample verifier.
- Browser QA plan: accounting reports, treasury open/close/cash in/out, Arabic/English.
- Dependency: owner decision OD-35C-002.
- Launch impact: blocks launch unless resolved or disabled.

Phase 35E - Inventory and Purchase MVP Validation
- Objective: lock Day-1 item catalog and safe receipt/payment path.
- Requirement IDs: CR-INV-001 through CR-INV-007, CR-INV-014, CR-INV-015, CR-INV-019, CR-PUR-001 through CR-PUR-006.
- Included scope: validated gold-only or chosen item subtype path; barcode tag sign-off; purchase receive/pay happy path; purchase returns disabled or implemented.
- Excluded scope: all subtypes, RFID hardware, full warehouse/bin, manufacturing.
- Likely files/services/tables: inventory form/components, asset/product/purchase models, receive/pay routes, barcode settings.
- Migration expectation: none if disabling unsupported flows; possible if warehouse/bin chosen.
- Accounting sign-off: valuation/COGS and purchase VAT.
- Backup: required if fixtures/runtime validation.
- Verifier plan: launch-catalog item verifier, purchase receive/pay verifier, disabled purchase-return guard.
- Browser QA: add item, print tag, purchase receive/pay, POS sell, return same item.
- Dependency: owner catalog decision OD-35C-001/005.
- Launch impact: blocks inventory-based sales if unresolved.

Phase 35F - Market Browser QA and Scope-Limit UI
- Objective: prove the exact locked MVP workflows and hide/label deferred features.
- Requirement IDs: CR-UI-001 through CR-UI-005 plus all M0/M1 preserved flows.
- Included scope: browser QA, route visibility, controlled errors, Arabic/English/mobile, no runtime overlay.
- Excluded scope: redesign.
- Likely files/services/tables: sidebar/auth guards/messages only if gaps found.
- Migration expectation: none.
- Accounting sign-off: no, except invoice examples.
- Backup: not required unless runtime fixtures mutate DB.
- Verifier plan: static UI contract verifier if needed.
- Browser QA: Super Admin, Branch Account, Employee PIN, POS, sales invoice, return, exchange, installment, reservation, print, reports, treasury, inventory.
- Dependency: locked MVP scope.
- Launch impact: required before market release.

Phase 35G - Optional Customer/Gift/CGP Extensions
- Objective: enable selected non-core commercial features after sign-off.
- Requirement IDs: CR-SALES-022 through CR-SALES-026, CR-CRM-004 through CR-CRM-008.
- Included scope: one approved feature at a time.
- Excluded scope: campaigns/offline/government unless separately approved.
- Migration expectation: feature-dependent.
- Accounting sign-off: required for gift voucher and CGP.
- Launch impact: post-launch unless owner explicitly includes.

## 20. Final Proposed Market Product Definition

The first sellable DARFUS Jewellery ERP version should target a small to medium jewellery shop operating online-first, with controlled branch/company scope, Super Admin ownership, fixed Branch Accounts, and Employee Code/PIN operator sessions.

Supported daily workflows:
- Configure company, branch, users, Branch Accounts, roles, permissions, settings, and print basics.
- Create and manage customers and core customer history/statements.
- Create launch-approved inventory items, generate unique barcodes/tags, and maintain branch-level availability.
- Sell through POS/Sales with server-calculated totals, VAT fields, employee attribution, idempotency, and official print/reprint.
- Process invoice-backed returns, exchanges, and installment collections.
- Use reservation/deposit flow instead of a separate deposit invoice.
- Record controlled treasury cash/bank transactions once cash controls are repaired or operationally limited.
- Use essential reports only: invoice search/print, customer statement, sales/tax summary, treasury summary, inventory valuation for approved catalog, audit logs.

Supported item categories for MVP:
- Gold by weight and gold by piece only unless owner approves and QA validates diamond/gem/pearl categories.

Supported payment modes:
- Cash and explicitly validated configured methods. Card/bank/transfer may be displayed only where reconciliation and treasury policy are validated.
- Installments only through the verified installment collection path.
- Gift vouchers excluded until accounting is signed off.

Supported roles/accounts:
- Super Admin email/password-only.
- Branch Account fixed to one branch.
- Verified Employee operator session with Code + six-digit PIN.
- Legacy behavior only where preserved by prior access-model phases.

Explicit limitations:
- No full payroll.
- No offline sync.
- No government e-invoicing integration until sign-off.
- No full report catalog.
- No advanced CRM communications/loyalty unless enabled later.
- No purchase returns/debit notes unless implemented.
- No warehouse/bin/multi-stock-location claims unless implemented.
- No gift voucher liability flow until validated.
- No full enterprise accounting claims until period close, balance repair, and accountant sign-off are complete.

Upgrade path:
- Add minimal accounting/treasury repair first.
- Validate launch inventory and purchase paths.
- Run full browser release validation.
- Then enable optional features one by one with their own verifier, browser QA, backup, and sign-off.

Final Phase 35C classification:

`PHASE 35C COVERAGE REPORT COMPLETED — MVP SCOPE LOCK PROPOSED — DOCUMENTATION ONLY — NO IMPLEMENTATION PERFORMED`
