# Closed Evidence Register — Gift Voucher 01

| Evidence | Location |
|---|---|
| Migration rehearsal | `DARFUS_GIFT_VOUCHER_MIGRATION_REHEARSAL.md` |
| Payment adapter and accounting | `DARFUS_GIFT_VOUCHER_PAYMENT_ENGINE_ADAPTER.md`, `DARFUS_GIFT_VOUCHER_FINANCIAL_RUNTIME_PROOF.md` |
| Atomicity/idempotency | `DARFUS_GIFT_VOUCHER_ATOMICITY_CONCURRENCY_IDEMPOTENCY.md` |
| Print/reprint | `DARFUS_GIFT_VOUCHER_PRINT_REPRINT_PROOF.md` |
| Browser/network | `DARFUS_GIFT_VOUCHER_BROWSER_NETWORK_ACCEPTANCE.md` |
| Official DB integrity | `DARFUS_GIFT_VOUCHER_OFFICIAL_DB_INTEGRITY.md` |
| Main report | `DARFUS_GIFT_VOUCHER_SCHEMA_MINIMUM_SAFE_IMPLEMENTATION_01_REPORT.md` |
| Official promotion preflight | `DARFUS_GIFT_VOUCHER_OFFICIAL_PROMOTION_PREFLIGHT.md` |
| Official backup proof | `DARFUS_GIFT_VOUCHER_OFFICIAL_BACKUP_PROOF.md` |
| Official migration apply | `DARFUS_GIFT_VOUCHER_OFFICIAL_MIGRATION_APPLY.md` |
| Official schema verification | `DARFUS_GIFT_VOUCHER_OFFICIAL_SCHEMA_VERIFICATION.md` |
| Official read-only runtime proof | `DARFUS_GIFT_VOUCHER_OFFICIAL_RUNTIME_READONLY_PROOF.md` |
| Official post-promotion integrity | `DARFUS_GIFT_VOUCHER_OFFICIAL_DB_POST_PROMOTION_INTEGRITY.md` |
| Official promotion report | `DARFUS_GIFT_VOUCHER_CONTROLLED_OFFICIAL_MIGRATION_PROMOTION_01_REPORT.md` |

Official DB: schema metadata promoted in this named control; no business rows were created. Clone: prior cumulative evidence retained. Production: not contacted.

| Official business acceptance preflight | `DARFUS_GIFT_VOUCHER_OFFICIAL_BUSINESS_ACCEPTANCE_PREFLIGHT.md`, `DARFUS_GIFT_VOUCHER_OFFICIAL_BUSINESS_ACCEPTANCE_BACKUP.md`, `DARFUS_GIFT_VOUCHER_OFFICIAL_ACCEPTANCE_ASSET_PROOF.md` |
| Official issue attempt and failure | `DARFUS_GIFT_VOUCHER_OFFICIAL_ISSUE_PROOF.md`, `DARFUS_GIFT_VOUCHER_OFFICIAL_BROWSER_NETWORK_PROOF.md` |
| Official zero-delta evidence | `DARFUS_GIFT_VOUCHER_OFFICIAL_DB_DELTA.md`, `DARFUS_GIFT_VOUCHER_OFFICIAL_INVENTORY_AUDIT_PROOF.md`, `DARFUS_GIFT_VOUCHER_OFFICIAL_ACCOUNTING_TAX_TREASURY_PROOF.md` |
| Official acceptance report | `DARFUS_GIFT_VOUCHER_OFFICIAL_RUNTIME_BUSINESS_ACCEPTANCE_01_REPORT.md` |

These acceptance artifacts are not a closure proof. `REOPEN_ONLY_IF = DIRECT_CURRENT_REGRESSION`; before this recovery the runtime parity blocker was open.

| Main runtime parity preflight | `DARFUS_GIFT_VOUCHER_MAIN_RUNTIME_PARITY_PREFLIGHT.md` |
| Main runtime source identity | `DARFUS_GIFT_VOUCHER_MAIN_RUNTIME_SOURCE_IDENTITY.md` |
| Main runtime refresh proof | `DARFUS_GIFT_VOUCHER_MAIN_RUNTIME_REFRESH_PROOF.md` |
| Main authenticated read proof | `DARFUS_GIFT_VOUCHER_MAIN_RUNTIME_AUTH_READ_PROOF.md` |
| Main zero-delta proof | `DARFUS_GIFT_VOUCHER_MAIN_RUNTIME_ZERO_DELTA.md` |
| Main parity recovery report | `DARFUS_GIFT_VOUCHER_MAIN_RUNTIME_PARITY_RECOVERY_01_REPORT.md` |

The read-side parity blocker is resolved by the named Owner-authorized
backend-only recovery. No business acceptance is authorized by this evidence.

| POS Gift Voucher forensic/design contract | `DARFUS_POS_GIFT_VOUCHER_PAYMENT_UI_FORENSIC.md`, `DARFUS_POS_GIFT_VOUCHER_PAYMENT_UI_DESIGN_CONTRACT.md`, `DARFUS_POS_GIFT_VOUCHER_PAYMENT_MODE_MATRIX.md`, `DARFUS_POS_GIFT_VOUCHER_UI_TEST_MATRIX.md` |
| POS Gift Voucher browser proof | `DARFUS_POS_GIFT_VOUCHER_BROWSER_AR_EN_PROOF.md` |
| POS Gift Voucher zero-delta proof | `DARFUS_POS_GIFT_VOUCHER_ZERO_DB_DELTA.md` |
| POS Gift Voucher composition report | `DARFUS_POS_GIFT_VOUCHER_PAYMENT_UI_COMPOSITION_01_REPORT.md` |

These artifacts prove UI composition and supported-mode behavior only. They do
not authorize or close the official financial Gift Voucher acceptance retry.

| POS Gift Voucher visual forensic/design/state | `DARFUS_POS_GIFT_VOUCHER_VISUAL_FORENSIC.md`, `DARFUS_POS_GIFT_VOUCHER_VISUAL_DESIGN_CONTRACT.md`, `DARFUS_POS_GIFT_VOUCHER_VISUAL_STATE_MATRIX.md` |
| POS Gift Voucher AR/EN browser proof | `DARFUS_POS_GIFT_VOUCHER_VISUAL_BROWSER_AR.md`, `DARFUS_POS_GIFT_VOUCHER_VISUAL_BROWSER_EN.md` |
| POS Gift Voucher narrow proof | `DARFUS_POS_GIFT_VOUCHER_VISUAL_NARROW_PROOF.md` |
| POS Gift Voucher visual zero delta | `DARFUS_POS_GIFT_VOUCHER_VISUAL_ZERO_DB_DELTA.md` |
| POS Gift Voucher visual correction report | `DARFUS_POS_GIFT_VOUCHER_VISUAL_UX_CORRECTION_01_REPORT.md` |

| POS Gift Voucher I18N forensic | `DARFUS_POS_GIFT_VOUCHER_I18N_FORENSIC.md` |
| POS Gift Voucher error map | `DARFUS_POS_GIFT_VOUCHER_I18N_ERROR_MAP.md` |
| POS Gift Voucher internal browser proof | `DARFUS_POS_GIFT_VOUCHER_INTERNAL_BROWSER_PROOF.md` |
| POS Gift Voucher AR narrow proof | `DARFUS_POS_GIFT_VOUCHER_NARROW_AR_PROOF.md` |
| POS Gift Voucher EN narrow proof | `DARFUS_POS_GIFT_VOUCHER_NARROW_EN_PROOF.md` |
| POS Gift Voucher I18N screenshot review | `DARFUS_POS_GIFT_VOUCHER_I18N_SCREENSHOT_REVIEW.md` |
| POS Gift Voucher I18N narrow zero delta | `DARFUS_POS_GIFT_VOUCHER_I18N_NARROW_ZERO_DB_DELTA.md` |
| POS Gift Voucher I18N narrow visual closeout | `DARFUS_POS_GIFT_VOUCHER_I18N_NARROW_VISUAL_CLOSEOUT_01_REPORT.md` |

| Official retry preflight | `DARFUS_GIFT_VOUCHER_OFFICIAL_RETRY_PREFLIGHT.md` |
| Official retry backup | `DARFUS_GIFT_VOUCHER_OFFICIAL_RETRY_BACKUP.md` |
| Official retry Asset/pricing | `DARFUS_GIFT_VOUCHER_OFFICIAL_RETRY_ASSET_AND_PRICING.md` |
| Official retry Owner confirmation | `DARFUS_GIFT_VOUCHER_OFFICIAL_RETRY_OWNER_CONFIRMATION.md` |
| Official retry issue proof | `DARFUS_GIFT_VOUCHER_OFFICIAL_RETRY_ISSUE_PROOF.md` |
| Official retry redemption stop | `DARFUS_GIFT_VOUCHER_OFFICIAL_RETRY_REDEMPTION_PROOF.md` |
| Official retry browser/network | `DARFUS_GIFT_VOUCHER_OFFICIAL_RETRY_BROWSER_NETWORK.md` |
| Official retry accounting/tax/treasury | `DARFUS_GIFT_VOUCHER_OFFICIAL_RETRY_ACCOUNTING_TAX_TREASURY.md` |
| Official retry inventory/audit | `DARFUS_GIFT_VOUCHER_OFFICIAL_RETRY_INVENTORY_AUDIT.md` |
| Official retry DB delta | `DARFUS_GIFT_VOUCHER_OFFICIAL_RETRY_DB_DELTA.md` |
| Official retry report | `DARFUS_GIFT_VOUCHER_OFFICIAL_RUNTIME_BUSINESS_ACCEPTANCE_RETRY_01_REPORT.md` |
| GV-FINANCIAL-MAPPING-001 | Financial mapping authority recovery forensic | `DARFUS_GV_FINANCIAL_MAPPING_ROOT_CAUSE.md`; official DB read-only evidence; HTTP 422 request `ded2e4a2-4e74-4abf-a3fa-dc59d5becc50` | OPEN/BLOCKED pending role and tax policy authority |
| FINANCIAL-MAPPING-PREFLIGHT-001 | Preflight before any future mapping proof | `DARFUS_GV_FINANCIAL_MAPPING_MINIMUM_SAFE_FIX.md`; disposable-clone-only design | REQUIRED BEFORE FUTURE MUTATION |
| TAX-RATE-AUTHORITY-VERIFY-001 | Tax rate authority trace | `DARFUS_GV_TAX_RATE_AUTHORITY.md`; official settings and source trace | OWNER DECISION REQUIRED |
| GV-FINANCIAL-MAPPING-FIX-01 | Minimum mapping fix and official readiness | `DARFUS_GIFT_VOUCHER_FINANCIAL_MAPPING_MINIMUM_SAFE_FIX_01_REPORT.md`; clone proof; official delta | CLOSED / MAPPING READY; Voucher acceptance not authorized |
| TAX-RATE-AUTHORITY-VERIFY-001-CLOSURE | Owner Tax policy freeze | `DARFUS_GV_TAX_OWNER_AUTHORITY_DECISION.md` | CLOSED_BY_OWNER_POLICY |
| GV-UNAUTHORIZED-OFFICIAL-MUTATION-001 | Post-promotion unexpected Voucher/Journal/Cash/Print evidence | `DARFUS_GIFT_VOUCHER_FINANCIAL_MAPPING_MINIMUM_SAFE_FIX_01_REPORT.md`; backend request log IDs | OPEN / OWNER REVIEW; not closed |
| GV-S-OFFICIAL-1000-E2E-01 | Owner-authorized AED 1000 official issue, activation, full POS redemption, accounting/tax/treasury/inventory/idempotency proof | `DARFUS_GIFT_VOUCHER_OFFICIAL_END_TO_END_ACCEPTANCE_1000_01_REPORT.md` and companion evidence artifacts | CLOSED FOR THIS CONTROL; external AED 500 delta separately attributed |
| AUTO-STARTUP-MIGRATION-CONTRACT-RESTORE-001 | Original startup runner restoration and Clone proof | `DARFUS_MIGRATION_STARTUP_CONTRACT_RESTORATION_01_REPORT.md`; companion current/git/clone/boot/schema/failure artifacts; focused tests and typecheck | CLOSED / PASS |
| UX-0 audit artifacts | `docs/client-requirements/ui-ux/` route inventory, shell/theme/locale/density/accessibility/POS/numeric/tag/error audits, screenshot baseline, issue matrix, design directions, and full report | Documentation-only audit; no UX issue marked closed; Gate blocked on remaining evidence coverage |
| UX-0B design research and evidence artifacts | `docs/client-requirements/ui-ux/DARFUS_UIUX_UX0B_DESIGN_RESEARCH_AND_EVIDENCE_CLOSEOUT_01_REPORT.md` and companion browser/responsive/research/problem-map artifacts | Documentation-only closeout; 7 viewport classes measured for 18 families, full locale/theme state acceptance remains blocked | OPEN / NOT A PRODUCT CLOSURE |
| UX1 design system and reference prototypes | `docs/client-requirements/ui-ux/ux1/` including specifications, three isolated prototype docs, browser evidence matrix and final report | Documentation plus isolated prototype-only surface; real-browser proof complete; no production rollout or business write | PASS_REFERENCE_PROTOTYPE_ONLY |
| UX1R owner visual refinement | `docs/client-requirements/ui-ux/ux1r/` including compact shell, density, language, motion, responsive, accessibility, browser matrix, approval pack and report | Prototype-only refinement; real-browser evidence complete; no production rollout or business write | PASS_REFERENCE_REFINEMENT_ONLY |
| DARFUS-UIUX-VISUAL-ROLLBACK-AND-BASELINE-CONTRACT-001 / DARFUS-CLASSIC-DESIGN-BASELINE-001 | `docs/client-requirements/ui-ux/ux2/` and `backups/ui-ux/PRE_UX2_CLASSIC_DESIGN_20260828_020614/` | Classic baseline frozen; 48-file manifest and isolated exact-hash rollback proof | PASS_CLASSIC_BASELINE |
| DARFUS-UIUX-CHANGE-LEDGER-001 / DARFUS-UIUX-ROLLBACK-REGISTER-001 | `docs/client-requirements/ui-ux/ux2/DARFUS_UI_UX_CHANGE_LEDGER.md`, `DARFUS_UI_UX_CLASSIC_RESTORE_MAP.md`, `DARFUS_UX2_ROLLBACK_PROOF.md` | UX2 scope limited to `app/globals.css`; rollback ready | PASS_UX2_ROLLBACK |
| DARFUS-UX2-SEMANTIC-TOKEN-FOUNDATION-001 | `docs/client-requirements/ui-ux/ux2/DARFUS_UIUX_UX2_THEME_SEMANTIC_TOKEN_FOUNDATION_WITH_CLASSIC_ROLLBACK_01_REPORT.md` | Semantic foundation, browser, focused tests, typecheck/build, and zero business delta evidence | PASS_UX2_FOUNDATION |
# UX3 closure evidence (2026-08-28)

- `DARFUS-UIUX-UX3-SHELL-NAVIGATION-IMPLEMENTATION-WITH-ROLLBACK-01`: shell-only changes passed focused/regression tests, typecheck/build, AR/EN desktop/mobile browser proof, and isolated rollback hash proof. No closed business authority was reopened.

# UX4 closure evidence (2026-08-28)

- `DARFUS-UIUX-UX4-CORE-COMPONENTS-IMPLEMENTATION-WITH-ROLLBACK-01`: component inventory/contract freeze, before/after SHA snapshots, focused tests 5/5, affected UX regressions 15/15, typecheck/build PASS, AR/EN and narrow read-only consumer browser proof, zero business/DB mutation, and isolated rollback hash parity. Full artifacts are under `docs/client-requirements/ui-ux/ux4/`.

# UX4B closeout status (2026-08-28)

- `DARFUS-UIUX-UX4B-CORE-COMPONENTS-BROWSER-VISUAL-EVIDENCE-CLOSEOUT-01`: isolated reference surface, focused tests, typecheck/build, AR/EN dark/light/responsive and consumer smoke evidence collected; closeout remains OPEN because Drawer focus return failed. Not a closed authority.

# UX4C closure evidence (2026-08-28)

- `DARFUS-UIUX-UX4C-DRAWER-FOCUS-RESTORATION-MINIMUM-SAFE-FIX-01`: shared Drawer focus return corrected and proven in EN/AR, dark/light, desktop/mobile; contract unchanged, business/API/DB unchanged, 13/13 tests, typecheck/build and isolated rollback hash parity passed. `UX4B-A11Y-001` closed; UX4 final visual/accessibility acceptance closed.

# UX5 POS evidence (2026-08-28)

- `DARFUS-UIUX-UX5-POS-SALES-IMPLEMENTATION-WITH-ROLLBACK-01`: adopted Desktop control executed within POS presentation-only scope. Existing customer/search/items/payment/totals/checkout authorities were preserved; 22 focused POS/payment/accounting tests passed, typecheck/build passed, AR/EN light/dark and responsive read-only browser evidence was collected, and isolated source-hash rollback parity passed. Detailed gate disposition is in `ui-ux/ux5/DARFUS_UIUX_UX5_POS_SALES_IMPLEMENTATION_WITH_ROLLBACK_01_REPORT.md`.

# UX5C closure evidence (2026-08-28)

- `DARFUS-UIUX-UX5C-OWNER-VISUAL-CORRECTIONS-01`: approved POS visual corrections applied without changing business/API/DB/payment/checkout/Gift Voucher/Sidebar deferred authorities. Focused `11/11`, POS regression `41/41`, typecheck/build, AR/EN Dark/Light responsive browser proof, official DB identity read-only proof, and isolated rollback hash parity passed. Deferred Sidebar Light height and Gift Voucher Empty Cart state remain open and untouched.

# UX5D closure evidence (2026-08-28)

- `DARFUS-UIUX-UX5D-GIFT-VOUCHER-VISUAL-CLARITY-ONLY`: Gift Voucher presentation hierarchy, contrast, responsive amount layout, AR/EN readability and accessibility were corrected without changing the frozen component contract or business authorities. Focused/impacted tests `44/44`, Gift Voucher backend regressions `28/28`, typecheck/build, browser evidence, after hash snapshot and isolated rollback rehearsal passed. Shared-runtime concurrent business activity was preserved and separately documented.

# GBW override-reason forensic evidence (2026-08-28)

- Control `DARFUS-GBW-RECEIVING-PURCHASE-GOLD-RATE-OVERRIDE-REASON-READ-ONLY-FORENSIC-01` produced the 13 scoped evidence artifacts under `docs/client-requirements/gbw-receiving/override-reason/`.
- The backend authority, reference-rate order, exact Decimal comparison, permission/reason gate, transaction boundary, current DOM absence, official DB identity, and historical 422 responses are documented.
- This issue is not closed: the root cause is proven, but the strict exact historical raw request body was not retained. No code, Receive, migration, seed, or official DB write occurred.

# GBW override-reason minimum-safe fix (2026-08-28)

- Control `DARFUS-GBW-RECEIVING-PURCHASE-GOLD-RATE-OVERRIDE-REASON-MINIMUM-SAFE-FIX-01` produced the scoped fix artifacts under `docs/client-requirements/gbw-receiving/override-reason-fix/`, before/after hashes, focused tests, AR/EN browser evidence, typecheck/build, and rollback rehearsal.
- The frontend contract fix is evidenced; this entry does not close the business acceptance. No Receive, official DB business write, migration, or seed was performed by the control.

# UX5B populated POS evidence closeout (2026-08-28)

- `DARFUS-UIUX-UX5B-POPULATED-POS-BROWSER-VISUAL-EVIDENCE-CLOSEOUT-01` closed the populated-density evidence gap using an isolated static fixture only. AR/EN, Light/Dark, desktop/tablet/mobile, long values, accessibility, UX5C regression, 104/104 tests, typecheck/build, SHA-256 and rollback evidence passed.
- UX5/UX5C/UX5D business and presentation contracts remain closed; no production source, API, DB, payment, Gift Voucher, GBW, inventory, accounting or checkout behavior changed. UX-6 is not started.

# UX6 Inventory/Asset presentation closure (2026-08-28)

- UX6 closed its scoped Inventory overview and Asset detail presentation work with AR/EN, light/dark, desktop/tablet/mobile evidence, focused/regression tests, typecheck/build, SHA-256 manifests, official DB read-only identity proof, and isolated rollback rehearsal.
- Asset/Barcode/status/branch/location/workflow and all business authorities remained unchanged. No official DB write, migration, receive, sale, count, or cleanup occurred.

# UX6B Asset Tag / Barcode Dark Mode closure (2026-08-28)

- UX6B reproduced and closed the embedded Asset Tag contrast defect with one scoped production CSS change. Light/Dark, AR/EN, responsive, barcode/tag readability, print-surface, focused/regression, typecheck/build, and isolated rollback evidence passed.
- The permanent `DARFUS-PREVIEW-THEME-ISOLATION-GATE-001` and embedded high-risk visual checklist were created. Barcode value/generation, tag data, print behavior, Asset authority, API, DB, and business logic were unchanged.

# UX7 Customers / Suppliers closure (2026-08-28)

- UX7 closed scoped Customers/Suppliers presentation work with populated list/detail/form evidence in AR/EN and Light/Dark, wide/narrow responsive checks, direct embedded-component sweep, focused/regression tests, typecheck/build, official DB read-only identity proof, after hashes and isolated rollback rehearsal.
- Customer/Supplier identity, contact, tax, status, financial, permission, POS, API, DB and accounting authorities remained unchanged. No synthetic Customer/Supplier record or business write was created.
