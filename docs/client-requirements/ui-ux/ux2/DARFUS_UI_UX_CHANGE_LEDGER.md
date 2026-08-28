# DARFUS UI/UX Change Ledger

| Batch | Production file | Before SHA-256 | After SHA-256 | Change purpose | Functional change | Rollback ready | Evidence |
|---|---|---|---|---|---|---|---|
| CLASSIC-BASELINE | 48 inventoried frontend/design files | See classic manifest | Same | Freeze recoverable classic baseline | No | YES | `DARFUS_UX2_CLASSIC_DESIGN_HASH_MANIFEST.md` |
| UX2 | `app/globals.css` | See classic manifest | Recorded after build | Add semantic aliases, foundation palette hooks and motion tokens | No | YES | UX2 report + rollback proof |
| UX3 | `app/globals.css`, `components/layout/app-shell.tsx`, `components/layout/header.tsx`, `components/layout/sidebar.tsx`, `components/ui/page-header.tsx`, new `components/layout/breadcrumbs.tsx` | UX3 pre-manifest | UX3 after-manifest | Shell/navigation presentation, landmarks, breadcrumbs, active semantics, responsive hooks | No | YES | UX3 report + isolated rollback rehearsal |
| UX4 | Shared UI component files listed in UX4 report; focused UX4 test | UX4 before manifest | UX4 after manifest | Shared component presentation/accessibility only; no consumer mass migration | No | YES | UX4 report + before/after manifests + isolated rollback proof |
| UX4C | `components/ui/drawer.tsx`; `tests/ux4c-drawer-focus.test.cjs` | `73B50EF20B2D7251BF803B2F7C83426C32D4009BCB40867BF05FC9FE26E55FB8` | `32251475D47AC86F1A8C64267A4F2188CBDAE956361FD769889B61A505D466E6` | Restore focus to exact invoking Drawer trigger | ACCESSIBILITY_FOCUS_LIFECYCLE_ONLY; business change NO | YES | UX4C report + snapshots + isolated hash rollback rehearsal |
| UX5 | `app/[locale]/(dashboard)/pos/page.tsx`; `tests/ux5-pos-presentation.test.cjs` | `AD8D2330D6D1D76C110BA0B5E7741F759185AF2DD4394C475310A85C58BA88A4` | `A02F9F9DC4C3179246DFC701815FBA07E187C4AD80FBE8AB958B2F788F5AE90A` | POS presentation hierarchy, density, responsive layout and payment selected-state accessibility; existing actions/contracts preserved | PRESENTATION_ONLY; business change NO | YES | UX5 report + snapshots + focused tests + browser evidence |
| UX5C | `app/[locale]/(dashboard)/pos/page.tsx`; `tests/ux5c-pos-visual-corrections.test.cjs`; UX5C evidence docs | `A02F9F9DC4C3179246DFC701815FBA07E187C4AD80FBE8AB958B2F788F5AE90A` | `3B787189C7F75007F0C32B2114456783036D292C8DC66107034BFB3BC1814EC7` | Owner visual corrections only: medium responsive layout, locale-pure payment chrome, neutral/disabled/empty states, search density, teal/gold balance | PRESENTATION_ONLY; business/API/DB change NO | YES | UX5C report + before/after screenshots + focused/regression tests + isolated rollback |
| UX5D | `features/sales/components/GiftVoucherPaymentSection.tsx`; UX5D focused test; UX5D evidence docs | `02D379E629DE057FBA2523C0F0A1932E12B0BAFE005A8C010BE12C587E09B7F4` | `37A841A5AA15A1D8A62733D32527FC8542A7F7CB38294F5A4905EDB2224D7321` | Gift Voucher visual clarity only: hierarchy, contrast, adaptive layout, AR/EN readability, focus/touch presentation | PRESENTATION_ONLY; business/API/DB change NO | YES | UX5D report + snapshots + focused/regression tests + browser evidence + isolated rollback |

| UX5B | No production source; isolated `backups/ui-ux/UX5B_POPULATED_POS_20260828T103000Z/` fixture and evidence files | N/A | See UX5B evidence manifest | Populated POS density/visual evidence only; no production navigation or business behavior | NO PRODUCTION CHANGE | YES | UX5B report + isolated fixture screenshots + 104/104 tests |

Only `app/globals.css` is the production file changed by UX-2. UX3 changes only the shell/navigation files listed above; no module page was migrated.

`UI_UX_CHANGE_LEDGER = CREATED`
## UX6 Inventory/Asset presentation (2026-08-28)

| Control | Intentional source scope | Result | Evidence |
|---|---|---|---|
| `DARFUS-UIUX-UX6-INVENTORY-ASSETS-IMPLEMENTATION-WITH-ROLLBACK-01` | `inventory/page.tsx`, `inventory/[id]/page.tsx`, focused presentation test; list/detail readability, status labels, density, accessibility | PASS; business/API/DB/permission authorities unchanged | UX6 report, browser matrix, focused/regression tests, after hashes, rollback proof |

## UX6B Asset Tag/Barcode preview theme isolation (2026-08-28)

| Control | Production file | Before SHA-256 | After SHA-256 | Business change | Barcode value change | Print behavior change | Rollback |
|---|---|---|---|---|---|---|---|
| `DARFUS-UIUX-UX6B-ASSET-TAG-BARCODE-PREVIEW-DARK-MODE-VISUAL-FIX-AND-PREVENTION-GATE-01` | `features/printing/components/ClientBarcodeTagTemplate.tsx` | `C17B7F290EE981E6EA00D794921F6C78ABF0D648722F7D497D438B610AD12B4E` | `5A6530F4180E8B18C42DC77D3E892C7AB1A0344485B1EF242AE99CACE6E95B04` | NO | NO | NO | YES |

## UX7 Customers/Suppliers presentation (2026-08-28)

| Control | Production scope | Result | Evidence |
|---|---|---|---|
| `DARFUS-UIUX-UX7-CUSTOMERS-SUPPLIERS-IMPLEMENTATION-WITH-ROLLBACK-01` | `app/globals.css`, Customer/Supplier list/detail pages, focused UX7 test; scoped presentation/readability/responsive classes only | PASS; business/API/DB/accounting/POS/permission authorities unchanged | UX7 report, AR/EN Light/Dark browser evidence, 43/43 relevant tests, typecheck/build, DB identity proof, after hashes, isolated rollback rehearsal |

## UX7B Tablet evidence closeout (no production change)

| Control | Production scope | Result | Evidence |
|---|---|---|---|
| `DARFUS-UIUX-UX7B-CUSTOMERS-SUPPLIERS-TABLET-REAL-BROWSER-EVIDENCE-CLOSEOUT-01` | Documentation/evidence only | BLOCKED; real measured 768–900px viewport unavailable | UX7B baseline, viewport measurements, browser capability blocker, 4/4 focused safety test |

## UX7C Direct Chrome/Playwright Tablet evidence (no production change)

| Control | Production scope | Result | Evidence |
|---|---|---|---|
| `DARFUS-UIUX-UX7C-DIRECT-CHROME-PLAYWRIGHT-CDP-TABLET-EVIDENCE-CLOSEOUT-01` | Documentation/evidence only | BLOCKED; direct 840×1180 and auth proven, active Branch context unavailable for populated surfaces | UX7C browser discovery/runtime, viewport measurements, context blocker, source integrity, 4/4 focused test |

## UX-8 Gold Center

| Control | Production scope | Result | Evidence |
|---|---|---|---|
| `DARFUS-UIUX-UX8-GOLD-CENTER-IMPLEMENTATION-WITH-ROLLBACK-01` | Gold Center presentation/accessibility only; no Gold authority, API, DB, business or permission change | PASS; pre-existing worktree drift preserved | `ui-ux/ux8/DARFUS_UIUX_UX8_GOLD_CENTER_IMPLEMENTATION_WITH_ROLLBACK_01_REPORT.md`, before/after hashes, browser matrix, focused test, rollback rehearsal |

## UX-9 Accounting / Treasury

| Control | Production scope | Result | Evidence |
|---|---|---|---|
| `DARFUS-UIUX-UX9-ACCOUNTING-TREASURY-IMPLEMENTATION-WITH-ROLLBACK-01` | Accounting/Treasury presentation and interaction only; financial authorities frozen | PASS; no financial or business mutation | `ui-ux/ux9/DARFUS_UIUX_UX9_ACCOUNTING_TREASURY_IMPLEMENTATION_WITH_ROLLBACK_01_REPORT.md`, before/after hashes, browser matrix, focused/regression tests |

## UX-10 Settings / Audit

| Control | Production scope | Result | Evidence |
|---|---|---|---|
| `DARFUS-UIUX-UX10-SETTINGS-AUDIT-IMPLEMENTATION-WITH-ROLLBACK-01` | Settings/Audit presentation, interaction affordances and readability only; authority and security frozen | PASS; no settings, audit, API, DB or business mutation | `ui-ux/ux10/DARFUS_UIUX_UX10_SETTINGS_AUDIT_IMPLEMENTATION_WITH_ROLLBACK_01_REPORT.md`, before/after hashes, browser matrix, focused tests, typecheck, build, rollback rehearsal |

## UX-11 Print / Preview

| Control | Production scope | Result | Evidence |
|---|---|---|---|
| `DARFUS-UIUX-UX11-PRINT-PREVIEW-IMPLEMENTATION-WITH-ROLLBACK-01` | Print/preview presentation, fixed-format theme isolation, responsive containment and accessibility only; document, print/reprint, barcode/QR and business authorities frozen | PASS; no business print/reprint, API, DB or accounting mutation | `ui-ux/ux11/DARFUS_UIUX_UX11_PRINT_PREVIEW_IMPLEMENTATION_WITH_ROLLBACK_01_REPORT.md`, source hashes, browser evidence, 42 focused tests, typecheck, build, rollback rehearsal |
