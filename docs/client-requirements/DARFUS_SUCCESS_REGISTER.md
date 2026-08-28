# DARFUS Success Register — Gift Voucher 01

| ID | Evidence | Result |
|---|---|---|
| GV-S-001 | Clone migration apply/down/re-apply | PASS |
| GV-S-002 | 35 contract/foundation tests | PASS |
| GV-S-003 | 36 impacted POS/financial regressions | PASS |
| GV-S-004 | Clone issue, activation, full redemption, mixed, multiple | PASS |
| GV-S-005 | Idempotent replay and changed-payload conflict | PASS |
| GV-S-006 | Exactly-one-success concurrency | PASS |
| GV-S-007 | Original/reprint events | PASS |
| GV-S-008 | AR/EN isolated UI + GET network | PASS |
| GV-S-009 | Official DB before/after delta | PASS; zero |
| GV-S-OFFICIAL-MIGRATION-001 | Owner-authorized Gift Voucher migration applied to `darfus_erp` through the guarded exact-target wrapper | PASS; one migration |
| GV-S-OFFICIAL-SCHEMA-001 | Gift Voucher purchased schema, indexes, constraints, and foreign keys verified on official DB | PASS |
| GV-S-OFFICIAL-RUNTIME-001 | Backend, DB, and Redis health verified after promotion; no refresh required | PASS; 200/200/200 |
| GV-S-OFFICIAL-ZERO-BUSINESS-DELTA-001 | Official migration created zero Voucher/Payment/Journal/Cash/Inventory/Invoice business rows | PASS; zero delta |
| GV-S-OFFICIAL-ACCEPTANCE-PREFLIGHT-001 | Official business-acceptance identity, health, backup, safe Asset, and server pricing preflight | PASS; no business mutation |
| GV-S-OFFICIAL-ACCEPTANCE-ZERO-DELTA-001 | The single authorized issue attempt failed before persistence and all official business counts remained unchanged | PASS; zero business/financial/inventory delta |
| GV-S-OFFICIAL-RUNTIME-PARITY-RECOVERY-001 | Backend-only refresh, source/container hash parity, health 200/200/200, authenticated Gift Voucher GET 200, AR/EN read-only pages, and zero official business delta | PASS; no business mutation |
| POS-GV-UI-001 | Shared Gift Voucher payment component rendered in current POS AR/EN runtime; supported-mode and zero-delta proof | PASS for read-only UI composition |
| POS-GV-UI-002 | Focused composition test, affected POS regressions, typecheck, AR/EN typing/focus and fail-closed unsupported-mode proof | PASS |
| POS-GV-VISUAL-001 | Post-fix AR/EN desktop screenshots: input width, typed text, focus, button alignment, Installment/Deposit visible disabled | PASS desktop; narrow pending |

| POS-GV-I18N-NARROW-001 | Stable locale-neutral Gift Voucher error mapping plus internal-browser AR/EN desktop and 768x800 visual proof | PASS; `VISUAL_VERIFICATION=COMPLETE`, focused tests 17/17, typecheck PASS |

| GV-S-OFFICIAL-RETRY-01-PREFLIGHT | Owner-authorized retry preflight, official DB identity, health, backup, Asset, and current pricing | PASS preflight; issue later blocked before persistence |
| GV-S-OFFICIAL-RETRY-01-ZERO-DELTA | One authorized issue attempt returned 422 before persistence; official counts and Asset unchanged | PASS; zero business/financial/inventory delta |
| GV-S-FINANCIAL-MAPPING-READ-01 | Resolver, Treasury, liability, Tax, clone isolation, and official zero-delta evidence documented without replay | PASS for forensic evidence; financial recovery gate remains blocked by unresolved Tax Authority | `DARFUS_GV_FINANCIAL_MAPPING_AUTHORITY_RECOVERY_01_REPORT.md` |
| GV-S-FINANCIAL-MAPPING-FIX-01 | Owner Tax authority, fresh backup/clone, exact two-row mapping, resolver readiness, clone financial/idempotency/rollback proof, and official zero transaction delta | PASS | `DARFUS_GIFT_VOUCHER_FINANCIAL_MAPPING_MINIMUM_SAFE_FIX_01_REPORT.md` |
| GV-S-FINANCIAL-MAPPING-PROMOTION-CHECKPOINT-01 | Exact two-row official mapping promotion and immediate checkpoint delta | PASS at checkpoint only; later unapproved official business mutation invalidates final control closure | `DARFUS_GV_MAPPING_OFFICIAL_PROMOTION.md`; `DARFUS_GV_MAPPING_OFFICIAL_DELTA.md` |
| GV-S-OFFICIAL-1000-E2E-01 | Owner-authorized AED 1000 issue, activation, one POS full redemption, accounting/tax/treasury/inventory/audit proof, and exact issue/checkout replay | PASS; one new voucher and one checkout, replay produced no duplicates | `DARFUS_GIFT_VOUCHER_OFFICIAL_END_TO_END_ACCEPTANCE_1000_01_REPORT.md` |
| AUTO-STARTUP-MIGRATION-CONTRACT-RESTORE-001 | Restored original automatic migration startup contract with Disposable-clone proof | PASS; one pending migration applied, second start pending=0, failure blocked app start, official DB unchanged | `DARFUS_MIGRATION_STARTUP_CONTRACT_RESTORATION_01_REPORT.md` |
| UX0-AUDIT-01 | Full UI/UX route, shell, theme, AR/EN, RTL/LTR, density, accessibility, POS, numeric, print and issue audit artifacts | COMPLETE_AS_AUDIT; Gate blocked for evidence completion, not a product PASS claim | `docs/client-requirements/ui-ux/DARFUS_UI_UX_MODERNIZATION_UX0_FULL_READ_ONLY_AUDIT_01_REPORT.md` |
| UX0B-RESEARCH-001 | UX-0B external benchmark research, 18-family × 7 viewport measurement, dark/light and AR/EN closeout artifacts | COMPLETE_AS_READ_ONLY_RESEARCH; gate blocked for full cross-product visual evidence | `docs/client-requirements/ui-ux/DARFUS_UIUX_UX0B_DESIGN_RESEARCH_AND_EVIDENCE_CLOSEOUT_01_REPORT.md` |
| UX1-REFERENCE-PROTOTYPES-001 | UX-1 Obsidian Atelier semantic system and three isolated reference prototypes with real-browser AR/EN, RTL/LTR, dark/light and responsive evidence | PASS_DARFUS_UIUX_UX1_DESIGN_SYSTEM_AND_REFERENCE_PROTOTYPES; static focused test 3/3, typecheck/build PASS, zero prototype business writes | `docs/client-requirements/ui-ux/ux1/DARFUS_UIUX_UX1_DESIGN_SYSTEM_SPECIFICATION_AND_REFERENCE_PROTOTYPES_01_REPORT.md` |
| UX1R-OWNER-VISUAL-REFINEMENT-001 | Owner-approved Obsidian Atelier refinement: compact shell, production-density references, AR/EN purity, motion/reduced-motion and responsive browser evidence | PASS_DARFUS_UIUX_UX1R_OWNER_VISUAL_REFINEMENT; focused tests 7/7, typecheck/build PASS, zero business writes | `docs/client-requirements/ui-ux/ux1r/DARFUS_UIUX_UX1R_OWNER_VISUAL_REFINEMENT_01_REPORT.md` |
| DARFUS-UIUX-VISUAL-ROLLBACK-AND-BASELINE-CONTRACT-001 | Classic baseline, source snapshot, hash manifest and isolated rollback proof | PASS; classic hash restored exactly | `docs/client-requirements/ui-ux/ux2/DARFUS_UX2_CLASSIC_ROLLBACK_REHEARSAL.md` |
| DARFUS-CLASSIC-DESIGN-BASELINE-001 | 48-file classic production design baseline | FROZEN; snapshot and complete SHA-256 records available | `docs/client-requirements/ui-ux/ux2/DARFUS_UX2_CLASSIC_DESIGN_HASH_MANIFEST.md` |
| DARFUS-UIUX-CHANGE-LEDGER-001 | UX-2 change boundary and before/after hashes | CREATED; one active production file only | `docs/client-requirements/ui-ux/ux2/DARFUS_UI_UX_CHANGE_LEDGER.md` |
| DARFUS-UIUX-ROLLBACK-REGISTER-001 | File-scoped classic and UX2 rollback readiness | READY; isolated restore and re-apply parity proven | `docs/client-requirements/ui-ux/ux2/DARFUS_UX2_ROLLBACK_PROOF.md` |
| DARFUS-UX2-SEMANTIC-TOKEN-FOUNDATION-001 | Minimum semantic token, typography, motion and reduced-motion foundation | PASS; focused tests/typecheck/build/browser evidence pass | `docs/client-requirements/ui-ux/ux2/DARFUS_UIUX_UX2_THEME_SEMANTIC_TOKEN_FOUNDATION_WITH_CLASSIC_ROLLBACK_01_REPORT.md` |
# UX3 success evidence (2026-08-28)

- UX3 shell/navigation implementation: focused tests `3/3`, selected regressions `33/33`, typecheck PASS, build PASS, AR/EN browser shell proof PASS, console errors `0`, official DB writes `0`, rollback rehearsal PASS.

# UX4 success evidence (2026-08-28)

| ID | Evidence | Result |
|---|---|---|
| DARFUS-UX4-CORE-COMPONENTS-001 | Shared core component implementation and scope audit | PASS; core-components-only |
| DARFUS-COMPONENT-PROP-CONTRACT-PRESERVATION-001 | Existing props/defaults/events/className compatibility test and typecheck | PASS; no prop contract change |
| DARFUS-COMPONENT-ACCESSIBILITY-GATE-001 | Dialog/listbox/tab/table/status semantics and focus/name test | PASS |
| DARFUS-UX4-ROLLBACK-001 | UX4 before/after snapshots, SHA-256 manifests, restore map and hash rehearsal | PASS |

# UX4B evidence closeout (2026-08-28)

| ID | Evidence | Result |
|---|---|---|
| DARFUS-UX4B-REFERENCE-001 | Isolated localized static component reference surface, focused isolation test, AR/EN dark/light/responsive browser evidence | PARTIAL; Drawer focus restoration blocks closeout |

# UX4C corrective evidence (2026-08-28)

| ID | Evidence | Result |
|---|---|---|
| DARFUS-UX4C-DRAWER-FOCUS-001 | Exact trigger capture/return, AR/EN, dark/light, desktop/mobile browser proof, 13/13 focused/regression tests, typecheck/build, isolated rollback | PASS |

# UX5C owner visual corrections (2026-08-28)

| ID | Evidence | Result |
|---|---|---|
| DARFUS-UX5C-OWNER-VISUAL-CORRECTIONS-001 | Eight approved POS presentation corrections, 11/11 focused tests, 41/41 POS regression tests, AR/EN Dark/Light responsive browser evidence, typecheck/build, after snapshot and isolated rollback | PASS |

# UX5D Gift Voucher visual clarity (2026-08-28)

| ID | Evidence | Result |
|---|---|---|
| DARFUS-UX5D-GIFT-VOUCHER-VISUAL-001 | Scoped component presentation change, 44/44 impacted POS tests, 28/28 Gift Voucher backend regressions, AR/EN light/dark responsive browser evidence, typecheck/build, after snapshot and isolated rollback | PASS |

# GBW purchase-rate override reason forensic (2026-08-28)

| ID | Evidence | Result |
|---|---|---|
| DARFUS-GBW-RECEIVING-PURCHASE-GOLD-RATE-OVERRIDE-REASON-READ-ONLY-FORENSIC-01 | Source/frontend/backend authority trace, official DB SELECT evidence, authenticated GBW DOM, and four historical 422 reason-required responses; no Receive or write by this control | ROOT_CAUSE_PROVEN; RAW_PAYLOAD_EVIDENCE_BLOCKED |

# GBW purchase-rate override reason minimum-safe fix (2026-08-28)

| ID | Evidence | Result |
|---|---|---|
| DARFUS-GBW-RECEIVING-PURCHASE-GOLD-RATE-OVERRIDE-REASON-001 | Scoped GBW frontend reason state/control/mapping, focused 8/8 tests, AR/EN browser proof, typecheck/build, after snapshot and rollback rehearsal; no Receive | FRONTEND_FIX_IMPLEMENTED; FULL_SUCCESSFUL_OVERRIDE_ACCEPTANCE_DEFERRED |

## Change ledger — GBW minimum-safe fix

| File | Before SHA-256 | After SHA-256 | Scope result |
|---|---|---|---|
| `app/[locale]/(dashboard)/inventory/gold-by-weight/page.tsx` | `9EF70DD20C014F6CF3EE49EFE11A6AEA36C10C4E8A237843E5D36F505C31A352` | `1A1552362CCE4BCD30B5E61395CF001EE314D30CF4F74987D523DF032A33F5FB` | Frontend contract only; backend/API/DB authority unchanged |
| `tests/gbw-override-reason-fix.test.cjs` | `NEW IN THIS CONTROL` | `1D1BFF9583D6787B96C4E28C2E80C8961C4E6590F6149CDBAD443BBC88A6E0A` | Focused regression coverage |

# UX5B populated POS evidence closeout (2026-08-28)

| ID | Evidence | Result |
|---|---|---|
| DARFUS-UIUX-UX5B-POPULATED-POS-BROWSER-VISUAL-EVIDENCE-CLOSEOUT-01 | Isolated 4-row populated visual fixture, 8 AR/EN theme/viewport captures, 104/104 regressions, typecheck/build, official DB identity read-only proof, zero checkout/mutation, SHA-256 manifest and rollback rehearsal | PASS_DARFUS_UIUX_UX5B_POPULATED_POS_BROWSER_VISUAL_EVIDENCE_CLOSEOUT |

# UX6 Inventory/Asset implementation (2026-08-28)

| ID | Evidence | Result |
|---|---|---|
| DARFUS-UIUX-UX6-INVENTORY-ASSETS-IMPLEMENTATION-WITH-ROLLBACK-01 | Inventory list/detail presentation-only changes, 4/4 focused tests, 58/58 and 56/56 selected regressions, typecheck/build, AR/EN responsive browser matrix, official DB identity read-only proof, after hashes and isolated rollback rehearsal | PASS_DARFUS_UIUX_UX6_INVENTORY_ASSETS_IMPLEMENTATION_WITH_ROLLBACK |

# UX6B Asset Tag / Barcode Dark Mode visual correction (2026-08-28)

| ID | Evidence | Result |
|---|---|---|
| DARFUS-UIUX-UX6B-ASSET-TAG-BARCODE-PREVIEW-DARK-MODE-VISUAL-FIX-AND-PREVENTION-GATE-01 | Reproduced Dark defect, isolated one-file visual fix, same Asset/barcode AR/EN Light/Dark and responsive browser proof, 4/4 focused tests, regressions, typecheck/build, zero official DB writes, prevention gate, and rollback hash parity | PASS_DARFUS_UIUX_UX6B_ASSET_TAG_BARCODE_PREVIEW_DARK_MODE_VISUAL_FIX_AND_PREVENTION_GATE |

# UX7 Customers / Suppliers presentation (2026-08-28)

| ID | Evidence | Result |
|---|---|---|
| DARFUS-UIUX-UX7-CUSTOMERS-SUPPLIERS-IMPLEMENTATION-WITH-ROLLBACK-01 | Scoped Customer/Supplier presentation layer, AR/EN Light/Dark browser evidence, 43/43 relevant tests, typecheck/build, official DB identity read-only proof, after hashes and isolated rollback rehearsal | PASS_DARFUS_UIUX_UX7_CUSTOMERS_SUPPLIERS_IMPLEMENTATION_WITH_ROLLBACK |

# UX7B Tablet evidence closeout (2026-08-28)

| ID | Evidence | Result |
|---|---|---|
| DARFUS-UIUX-UX7B-CUSTOMERS-SUPPLIERS-TABLET-REAL-BROWSER-EVIDENCE-CLOSEOUT-01 | Read-only baseline, official DB identity, safe focused test (4/4); required measured 768–900px browser viewport unavailable, so no Tablet PASS was claimed | BLOCKED_DARFUS_UIUX_UX7B_TABLET_REAL_BROWSER_EVIDENCE_UNAVAILABLE |

# UX7C direct Chrome/Playwright Tablet evidence (2026-08-28)

| ID | Evidence | Result |
|---|---|---|
| DARFUS-UIUX-UX7C-DIRECT-CHROME-PLAYWRIGHT-CDP-TABLET-EVIDENCE-CLOSEOUT-01 | Direct local Chrome 151 + Playwright 1.51.1 measured 840×1180 and authenticated, but the isolated session required active Branch context before populated Customer/Supplier states; no mutation or source change | BLOCKED_DARFUS_UIUX_UX7C_REQUIRED_CUSTOMER_SUPPLIER_CONTEXT_UNAVAILABLE |

# UX-7 final Owner Tablet evidence waiver (2026-08-28)

| ID | Evidence | Result |
|---|---|---|
| DARFUS-UIUX-UX7-OWNER-TABLET-EVIDENCE-WAIVER-FINAL-CLOSURE-01 | Explicit Owner waiver for the isolated-session Branch-context blocker; prior UX7 business/runtime/safety evidence remains accepted and no source/DB change occurred | PASS_DARFUS_UIUX_UX7_WITH_OWNER_TABLET_EVIDENCE_WAIVER |

# UX-8 Gold Center (2026-08-28)

| ID | Evidence | Result |
|---|---|---|
| DARFUS-UIUX-UX8-GOLD-CENTER-IMPLEMENTATION-WITH-ROLLBACK-01 | Scoped presentation/accessibility refinement, AR/EN Light/Dark responsive browser matrix, 4/4 focused test, typecheck, build, GET-only runtime evidence, after hashes and isolated rollback rehearsal | PASS_DARFUS_UIUX_UX8_GOLD_CENTER_IMPLEMENTATION_WITH_ROLLBACK |

# UX-9 Accounting / Treasury (2026-08-28)

| ID | Evidence | Result |
|---|---|---|
| DARFUS-UIUX-UX9-ACCOUNTING-TREASURY-IMPLEMENTATION-WITH-ROLLBACK-01 | Scoped Accounting/Treasury presentation layer, AR/EN responsive and theme browser evidence, 55 relevant tests, typecheck, build, GET-only health proof, after hashes and rollback rehearsal | PASS_DARFUS_UIUX_UX9_ACCOUNTING_TREASURY_IMPLEMENTATION_WITH_ROLLBACK |
