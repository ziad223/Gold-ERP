# DARFUS ERP — UX-9 Accounting / Treasury Implementation With Rollback 01

## Executive Summary

تم تنفيذ تحسينات عرض وتفاعل محدودة داخل شاشات Accounting وTreasury فقط. نجحت الاختبارات المركزة، TypeScript، Build، وفحوص المتصفح AR/EN وRTL/LTR وDark/Light وdesktop/tablet/mobile. لم تُنفّذ أي كتابة أعمال أو تغيير مالي؛ قاعدة `darfus_erp` بقيت دون كتابة من UX-9.

## Read-first / Scope

The current Accounting/Treasury source, financial resolver/catalog, posting/journal/reporting/cash-register services, hooks, UX ledgers, UX8 report, and project guardrails were inspected. The requested owner master contract file was not present in the workspace and is recorded as missing evidence. UX-9 remained presentation-only.

## Route and Authority Maps

Routes and sources are recorded in `DARFUS_UX9_ROUTE_SURFACE_INVENTORY.md`. Accounting authority is the journal/posting/resolver/reporting stack; Treasury authority is the register/transaction/closing services and explicit branch financial mappings. Full maps are in `DARFUS_UX9_ACCOUNTING_AUTHORITY_MAP.md`, `DARFUS_UX9_TREASURY_AUTHORITY_MAP.md`, and `DARFUS_UX9_DEPENDENCY_MAP.md`.

## Business / Financial Contract Freeze

Journal meaning, posting balance, account resolution, Treasury mappings/register lifecycle, tax/rounding/signs, inventory, permissions/RBAC/company/branch, and Gift Voucher liability mapping were not changed. The Gift Voucher financial mapping prevention track remains open. See `DARFUS_UX9_BUSINESS_FINANCIAL_CONTRACT_FREEZE.md`.

## Before Snapshot / After Snapshot / Rollback

Before snapshot and source hashes: `backups/ui-ux/PRE_UX9_ACCOUNTING_TREASURY_20260828T211831+0300/` and `DARFUS_UX9_BEFORE_HASH_MANIFEST.md`.

After source copies and hashes: `backups/ui-ux/UX9_ACCOUNTING_TREASURY_20260828T183500Z/` and `DARFUS_UX9_AFTER_HASH_MANIFEST.md`. Rollback rehearsal is documentation-only and safe: restore only the seven UX9-owned source/test files from the before snapshot in a disposable worktree; no rollback command was run against the current dirty worktree. No `next-env.d.ts` change was made.

## Implementation

Added `features/accounting/components/AccountingTreasuryUx9.module.css`, imported it into the four Accounting/Treasury page roots and `JournalPreview`, and added a focused static test. The CSS provides scoped dense-table readability, local responsive overflow, numeric alignment, code direction safety, focus-visible styling, and reduced-motion handling. No business fields, labels, calculations, API calls, permissions, handlers, routes, or state transitions changed.

## Browser Evidence

AR/EN routes loaded in the authenticated local browser. Desktop 1440x900, tablet 840x1180, and mobile 390x844 were checked. RTL/LTR were correct; page horizontal overflow was false at all sampled screens. On mobile, dense tables used local scroll frames only. Dark and light theme screenshots were captured, and console warning/error count was zero. Details and screenshots are in `DARFUS_UX9_BROWSER_EVIDENCE_MATRIX.md`, `DARFUS_UX9_AR_EN.md`, `DARFUS_UX9_DARK_LIGHT.md`, and `DARFUS_UX9_RESPONSIVE.md`.

## Network / DB Safety

Health GETs returned 200 for application, DB, Redis, and Gold. No Accounting/Treasury write form was submitted. Read-only DB identity was `darfus_erp`; observed counts were journal entries 71, journal lines 192, cash transactions 49, and idempotency requests 157. No UX9-owned business delta was produced.

## Tests

UX9 presentation test: 4/4 passed. Relevant Accounting/Treasury/Resolver/Gift Voucher regression set: 51/51 passed. `npm run typecheck`: PASS. `npm run build`: PASS.

## Strengths

- Financial authority is explicitly server-side and branch/company scoped in the resolver and posting stack.
- JournalPreview consumes the server preview contract and retains semantic balanced/out-of-balance display.
- Treasury writes remain permission-gated and were not made reachable by presentation code.
- Scoped CSS limits UX9 effects to the named surfaces; no global design or business authority was introduced.

## Weaknesses / Residual Risks

- The owner master working-method contract file was unavailable in the workspace; this is an evidence/documentation gap, not a product change.
- Dense tables intentionally require local horizontal scrolling on mobile; this is bounded and does not overflow the page.
- Existing write controls remain visible where the existing product exposes them; UX-9 did not redesign or disable financial actions.
- Gift Voucher financial mapping prevention remains open by instruction.

## Files Changed

UX9-owned source/test files: four Accounting/Treasury page files, `features/accounting/components/JournalPreview.tsx`, the new scoped CSS module, and the new focused test. UX9 documentation and snapshots were added under the listed paths. Pre-existing unrelated worktree changes were preserved and are not attributed to UX-9.

## Gate

`P0 = 0`, `P1 = 0`, no UX9 financial mutation, no migration, no DB write, and no closed UX stage reopened.

`GATE = PASS_DARFUS_UIUX_UX9_ACCOUNTING_TREASURY_IMPLEMENTATION_WITH_ROLLBACK`

`UX9_STATUS = CLOSED`

## Final Tokens

```text
CURRENT_CONTROL = DARFUS-UIUX-UX9-ACCOUNTING-TREASURY-IMPLEMENTATION-WITH-ROLLBACK-01
MODE = PRESENTATION_AND_INTERACTION_UI_ONLY_FINANCIAL_AUTHORITY_FROZEN
ACCOUNTING_AUTHORITY_MAP = COMPLETE
TREASURY_AUTHORITY_MAP = COMPLETE
DEPENDENCY_MAP = COMPLETE
BUSINESS_FINANCIAL_CONTRACT_FREEZE = PASS
FINANCIAL_MEANING_CHANGED = NO
JOURNAL_POSTING_CHANGED = NO
ACCOUNT_RESOLUTION_CHANGED = NO
TREASURY_MAPPING_CHANGED = NO
TAX_ROUNDING_SIGN_CHANGED = NO
INVENTORY_AUTHORITY_CHANGED = NO
PERMISSIONS_SECURITY_CHANGED = NO
GIFT_VOUCHER_MAPPING_CHANGED = NO
GIFT_VOUCHER_PREVENTION_TRACK = OPEN
AR = PASS
EN = PASS
RTL_LTR = PASS
DARK_LIGHT = PASS
DESKTOP = PASS
TABLET = PASS
MOBILE = PASS
DENSE_FINANCIAL_DATA = PASS
BODY_OVERFLOW = 0
EMBEDDED_COMPONENT_SWEEP = PASS
ACCESSIBILITY = PASS
BROWSER = PASS
CONSOLE_ERRORS = 0
HYDRATION_ERRORS = 0
NETWORK_MUTATIONS = 0
UX9_OWNED_DB_MUTATIONS = 0
FOCUSED_TESTS = PASS
ACCOUNTING_REGRESSION = PASS
TREASURY_REGRESSION = PASS
RESOLVER_REGRESSION = PASS
GIFT_VOUCHER_MAPPING_REGRESSION = PASS
TYPECHECK = PASS
BUILD = PASS
MAIN_DB_BUSINESS_WRITES = 0
BEFORE_AFTER_HASH_MANIFEST = PASS
ROLLBACK_REHEARSAL = PASS
P0 = 0
P1 = 0
GATE = PASS_DARFUS_UIUX_UX9_ACCOUNTING_TREASURY_IMPLEMENTATION_WITH_ROLLBACK
NEXT_BATCH = UX-10_SETTINGS_AUDIT_AFTER_OWNER_REVIEW
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```
