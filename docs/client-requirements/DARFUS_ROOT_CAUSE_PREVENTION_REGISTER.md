# Root Cause / Prevention Register — Gift Voucher 01

| Lesson | Root cause | What allowed it | Minimum fix / prevention gate | Regression status |
|---|---|---|---|---|
| GV-L-001 | POS preview and checkout used different profile-price recognition paths | Shared profile recognition was not consumed consistently at both boundaries | Use the shared canonical `isSalePricingProfile` path; protect it with the impacted POS/financial regression set | RESOLVED; GV-E-006 |
| GV-L-002 | Cent rounding could make a valid sub-cent journal differ by 0.01 | Posting precision was insufficient for a transaction containing sub-cent values | Use four-decimal posting when any relevant amount has sub-cent precision and assert Debit = Credit in financial proof | RESOLVED; GV-E-007 |
| GV-L-003 | Aggregate COUNT was row-locked in PostgreSQL | A row-lock clause was applied to an aggregate query in the print path | Lock the parent Voucher identity, never an aggregate count; retain the focused static/runtime regression gate | RESOLVED; GV-E-003 |
| GV-L-004 | Acceptance proof initially targeted a legacy movement table | The proof query was not mapped to the canonical asset movement/event authorities before runtime | Map DB assertions to `inventory_asset_movements` and `asset_events` before runtime evidence is accepted | RESOLVED; GV-E-004 |

The official promotion control added no new error/root-cause class. Its prevention
gate was the existing exact-target migration wrapper, pre-apply active-write
check, verified backup, exact pending-set check, and post-migration zero-business-
delta verification.

| GV-L-005 | Running backend process was stale relative to the current mounted source, so a fail-closed Gift Voucher financial guard remained active during official acceptance | Runtime freshness/parity was not re-proven immediately before the business acceptance attempt | Before critical official acceptance, prove serving process freshness against the approved source/build and stop on mismatch; never replay a failed financial mutation automatically | RECOVERY_PROVEN; ACTIVE_PREVENTION_REMAINS; GV-E-008 |

| MIGRATION-REHEARSAL-HASH-PROVENANCE-001 | Migration rehearsal evidence did not persist the migration file SHA-256 | The rehearsal gate did not require a cryptographic file fingerprint | Every migration rehearsal records SHA-256, file size, migration name, and worktree provenance; main promotion compares the current hash to the rehearsal hash | ACTIVE_PREVENTION |

| POS-GV-ONE-CANONICAL-PAYMENT-COMPONENT-001 | Gift Voucher presentation was conditionally nested inside Split | Payment composition allowed one mode-specific UI block even though state/validation were parent-owned | One reusable component consumes one parent Voucher state and existing validator across every mode; unsupported combinations are fail-closed; focused mode matrix test required | IMPLEMENTED; focused/browser proof PASS for supported modes |
| POS-VISUAL-BROWSER-ACCEPTANCE-001 | Prior acceptance checked functional presence but not human visual composition across screenshots/viewports/states | Visual acceptance lacked mandatory screenshot, overlap, clipping, caret, RTL/LTR, and narrow-width review | Require Functional + Interaction + Visual acceptance, including real screenshots and a real narrow viewport; `ELEMENT_EXISTS != UI_ACCEPTED` | APPLIED; narrow viewport gate still pending |

| POS-I18N-ERROR-MESSAGE-002 | Locale-specific POS UI copied raw backend message into user-facing Gift Voucher error state | Existing catch path used `error.message` while the lookup route message was server-language text and had no stable code | Classify known API status/code to locale catalog key; never use raw server message for Gift Voucher presentation | Focused AR/EN key parity test plus AR/EN browser validation | POS only | IMPLEMENTED; regression covered |

| POS-VISUAL-BROWSER-ACCEPTANCE-002 | Narrow visual gate was blocked by lack of viewport control | Acceptance was attempted without a controllable viewport capability | Require internal viewport capability and record exact dimensions before narrow PASS | AR/EN 768x800 screenshots and DOM review | POS UI | APPLIED; gate closed |

| GV-L-006 | Financial account resolver rejected Purchased Gift Voucher issue because required semantic mapping was missing or ambiguous | Acceptance preflight proved runtime and pricing but did not prove Gift Voucher issuance mapping readiness | Add a pre-mutation semantic-account readiness check to the acceptance gate; classify mapping ownership before any retry; never bypass resolver or hardcode accounts | Owner-authorized mapping-readiness test and one controlled retry only after PASS | Gift Voucher / Finance | ACTIVE; current retry stopped safely |
| GV-L-007 | Purchased Gift Voucher financial role was not included in official branch semantic-role readiness | Optional catalog role was explicitly resolved by the command but absent from both branch role sets; the candidate account alone did not satisfy the resolver | Require semantic-role presence, exact-one cardinality, account compatibility, and tax-policy preflight before any financial acceptance | `FINANCIAL-MAPPING-PREFLIGHT-001` plus disposable clone proof | Gift Voucher / Finance | DESIGN RECORDED; no implementation in this control |
| GV-L-007-CLOSURE | The missing semantic role was safely closed after Owner Tax authority decision | Clone-first proof showed exact role resolution, balanced issue, idempotency and rollback; official promotion was restricted to two role rows | Keep preflight and clone gates mandatory; never issue or fallback to literal account codes from this mapping control | `DARFUS_GIFT_VOUCHER_FINANCIAL_MAPPING_MINIMUM_SAFE_FIX_01_REPORT.md` | Gift Voucher / Finance | CLOSED_FOR_THIS_CONTROL |
| GV-L-008 | An official Voucher business mutation appeared after the mapping-only promotion checkpoint without being part of the authorized control | Backend logs and read-only DB evidence show issue, activation and two print commands after the checkpoint; this control sent no issue request | Freeze/observe the runtime around mapping promotion and require request-ID attribution before declaring zero-delta closure | `GV-UNAUTHORIZED-OFFICIAL-MUTATION-001`; no automatic repair | Gift Voucher / Finance / Operations | ACTIVE |
| GV-L-009 | An unrelated official AED 500 Voucher was created concurrently while the AED 1000 acceptance was being reconciled | After-state counts alone can be mistaken for this control's writes | Attribute every delta by immutable identity, idempotency key, timestamp, and source journal before gate; never clean concurrent data automatically | `DARFUS_GV_OFFICIAL_1000_DB_DELTA.md` | Gift Voucher / Finance / Operations | ACTIVE; Owner review |
| MIGRATION-STARTUP-CONTRACT-001 | Normal application startup must automatically apply repository-approved pending migrations; failure must block app start | `db:migrate` and Compose had drifted to the manual approval wrapper / no-migration startup | Keep canonical `db:migrate` for deployment, retain guarded `db:migrate:safe` for manual rehearsal, and require `&& npm start` | Fresh-clone first boot, double boot, and failure probe | Deployment / Database | FROZEN BY THIS CONTROL |
| UX0-L-001 | Visual acceptance cannot be inferred from component existence or normal rendering alone | Prior evidence focused on runtime/function, not complete theme/locale/density/accessibility coverage | Require route inventory plus real AR/EN, RTL/LTR, dark/light, desktop/narrow and state evidence before UX PASS | UX-0 browser matrix and screenshot baseline | ACTIVE; UX-1 prevention gate |
| UX0B-L-001 | Responsive evidence can be mistaken for complete visual acceptance when only one locale/theme is measured | Viewport measurement and content/state/theme coverage were not separated | Report requested vs actual viewport, state, locale and theme independently; block full PASS until the cross-product is proven | ACTIVE; UX0B |
| UX1-L-001 | Reference-prototype existence can be mistaken for a verified design-system gate | Static hooks do not prove served AR/EN/theme/responsive/focus behavior | Require a real-browser matrix with requested and actual viewport, root lang/dir/theme, selected prototype, named controls, console state and no business-write path | UX-1 browser matrix + focused isolation test | APPLIED; UX-1 |
| UX1R-L-001 | A polished reference can remain too editorial to validate operational density | UX-1 proved identity but retained oversized hero/spacing and a single illustrative POS row | Require compact shell, 3–5 representative POS rows, explicit Arabic/English purity, motion safety and actual responsive evidence before visual handoff | UX1R focused tests + 18-state browser matrix | APPLIED; UX-1R |
| DARFUS-UX2-SEMANTIC-TOKEN-FOUNDATION-001 | A theme foundation can accidentally widen into a module redesign or make backup source compile as product source | UX-2 boundary and in-repository snapshot compilation were not isolated initially | Keep UX-2 consumption global and minimal; store TypeScript snapshot copies with a non-compiling suffix; run typecheck after artifact creation | Focused UX2 regression + typecheck + source-file boundary review | UX2 | APPLIED; UX-2 |
# UX3 prevention note (2026-08-28)

- `UX3-SHELL-SCOPE`: keep navigation presentation separate from permission authority; focused test protects the existing route catalog and permission references. Rollback proof is isolated and hash-based.

# UX4 prevention note (2026-08-28)

| Lesson ID | Root cause | Minimum prevention | Test/gate |
|---|---|---|---|
| DARFUS-UX4-SCOPE-001 | Shared visual work can accidentally become consumer/business refactoring | Freeze props, consumers, exact files, before/after hashes; forbid module/API/DB changes | UX4 inventory, contract test, scope review |
| DARFUS-UX4-ACCESSIBILITY-001 | A visual primitive can render while lacking accessible state semantics | Require names, focus-visible, dialog/listbox/tab/table/status semantics | UX4 focused accessibility test |

# UX4B prevention note (2026-08-28)

| Lesson ID | Root cause | Minimum prevention | Test/gate |
|---|---|---|---|
| DARFUS-UX4B-FOCUS-RETURN-001 | Drawer entry focus was verified, but trigger restoration was not part of the earlier evidence | Require open → entry focus → close → invoking-trigger focus proof for every overlay | UX4B keyboard/focus gate; UX4C regression test before close |

# UX4C prevention closure (2026-08-28)

- `DARFUS-UX4B-FOCUS-RETURN-001` was exercised and closed by `tests/ux4c-drawer-focus.test.cjs` plus real-browser exact-trigger probes. Future overlay controls retain the same entry/return acceptance requirement.

# UX5C prevention record (2026-08-28)

| Lesson ID | Root cause | Minimum prevention | Test/gate |
|---|---|---|---|
| DARFUS-UX5C-PRESENTATION-STATE-001 | POS visual hierarchy did not distinguish neutral zero values, disabled actions, narrow responsive layouts, and locale-specific payment chrome | Keep presentation-state and locale-purity assertions beside POS authority/contract tests; verify AR/EN at desktop/tablet/mobile | `tests/ux5c-pos-visual-corrections.test.cjs` plus UX5C browser matrix |

| DARFUS-UX5D-PRESENTATION-CONTRACT-001 | Gift Voucher visual state needed clearer hierarchy and adaptive amount layout without changing payment semantics | Keep visual assertions on existing props/handlers/value expressions and run Gift Voucher + POS regressions before closure | `tests/ux5d-gift-voucher-visual-clarity.test.cjs` plus UX5D browser matrix |

# GBW receiving override-reason contract (2026-08-28)

| Lesson ID | Root cause | Minimum prevention | Test/gate |
|---|---|---|---|
| DARFUS-GBW-OVERRIDE-REASON-001 | UI exposed an editable purchase rate but omitted the server-required reason contract | Every governed manual-rate UI must map the server reason key, test equal/lower/higher cases, and verify rejection has zero business writes | Focused GBW override contract tests plus authenticated AR/EN browser proof |

Raw-body observability remains a separate evidence limitation, not a reason to alter business validation.

# GBW override-reason fix (2026-08-28)

| Lesson ID | Root cause | What allowed it | Minimum fix | Prevention gate | Tests / modules |
|---|---|---|---|---|---|
| DARFUS-GBW-OVERRIDE-REASON-001-FIX | Editable manual purchase rate had no UI field/state/payload mapping for the existing server-required reason | Frontend contract omitted an already-enforced backend field | Show/require a scoped reason for non-equal entered/reference rates and map the existing key; preserve backend authority | Equal/lower/higher UI contract proof plus safe zero-write rejection proof before any final acceptance | `tests/gbw-override-reason-fix.test.cjs`, authenticated AR/EN GBW browser proof |

# UX5B populated POS evidence prevention (2026-08-28)

| Lesson ID | Root cause | Minimum prevention | Test/gate |
|---|---|---|---|
| DARFUS-UX5B-POPULATED-DENSITY-001 | Earlier responsive POS evidence used mainly an empty cart | Require an isolated populated display state with long values and explicit AR/EN, Light/Dark, desktop/tablet/mobile checks before density closeout | UX5B 8-state screenshot matrix, `104/104` focused/regression tests, no-mutation gate |

# UX6 Inventory status/density prevention (2026-08-28)

| Lesson ID | Root cause | What allowed it | Minimum fix | Prevention gate | Tests / modules |
|---|---|---|---|---|---|
| DARFUS-UX6-STATUS-DENSITY-001 | A server status enum was exposed as raw English text and the Asset table/detail hierarchy was too dense for quick scanning | Presentation had direct enum fallback and lacked an explicit table caption/search name | Keep server status keys authoritative but map display labels, semantic table metadata, numeric formatting, and bounded responsive density | UX6 presentation guard plus AR/EN desktop/tablet/mobile browser evidence | `tests/ux6-inventory-assets-presentation.test.cjs`, Inventory/Asset surfaces |

| DARFUS-PREVIEW-THEME-ISOLATION-GATE-001 | Fixed-format embedded tag preview inherited application Dark Mode because the inner printable face had no explicit paper/ink surface | Parent-page visual evidence passed while the nested machine-readable component was not directly checked in both themes | Require explicit inner print-safe surface and same-state Light/Dark verification for every high-risk preview | `THEME_PARITY_SWEEP=PASS`; no stage closes on parent screenshot only; direct embedded-component evidence required | `tests/ux6b-asset-tag-preview-theme.test.cjs`, Barcode/Tag/Print surfaces |

| DARFUS-UX7B-DIRECT-TABLET-VIEWPORT-001 | Responsive acceptance may be labeled Tablet from CSS or adjacent viewport evidence without a measured browser width | Evidence contract did not enforce direct measured Tablet proof | Require a genuine browser viewport measurement between 768px and 900px, with the same-state component and overflow checks | UX7B Tablet gate; CSS inference and 586/355px mobile evidence are insufficient | UX7B browser evidence and viewport measurement register |

| DARFUS-UX7C-DIRECT-CONTEXT-001 | Direct browser proof can have valid viewport/authentication but lack the application's active Branch context | Ephemeral profile did not carry the existing main-browser context and no safe context-selection path was available at the required viewport | Treat viewport, authentication and Company/Branch context as separate gates; never inject or mutate context to force visual acceptance | Direct tablet acceptance requires valid Branch context before populated-surface proof | UX7C direct Playwright runtime and Customer/Supplier context gate |

| DARFUS-UX7-OWNER-WAIVER-001 | Owner-approved closure may accept an explicitly documented evidence gap without mislabeling the missing evidence as PASS | UX7B/UX7C could not prove populated Customer/Supplier Tablet surfaces despite direct 840×1180 runtime proof | Preserve the historical incomplete-evidence statement and record the waiver separately from product acceptance | Owner waiver must name the exact gap, reason, residual risk and preserved non-waived gates | UX7 final waiver register entry |

| DARFUS-UX7-MASTER-DATA-READABILITY-001 | Dense customer/supplier surfaces mixed identity, contact and action signals without a scoped responsive readability layer | Presentation hierarchy and long identifiers were left to generic utility combinations | Add scoped stat/data/detail styles, bidi-safe identifiers/contact wrapping and mobile action wrapping without altering source values | `UX7_THEME_PARITY_SWEEP=PASS`, `UX7_EMBEDDED_COMPONENT_SWEEP=PASS`, browser matrix and focused test | `tests/ux7-customers-suppliers.test.cjs`, Customer/Supplier surfaces |

| DARFUS-UX8-GOLD-CENTER-SCOPED-PRESENTATION-001 | Shared Gold Center data surfaces presented dense status/settings/history information without a unified bounded presentation layer, and existing editable rate inputs lacked programmatic labels | Presentation concerns were distributed between utility classes and an existing page surface | Use a scoped Gold Center CSS module and explicit localized labels while preserving handler/value/permission authorities | UX8 route inventory and browser matrix must cover AR/EN, Light/Dark, responsive overflow, labels, and no business requests | `tests/ux8-gold-center-presentation.test.cjs`; Gold Center shared panel/page |

| DARFUS-UX9-SCOPED-FINANCIAL-PRESENTATION-001 | Dense financial tables and mixed control surfaces lacked a shared responsive/focus presentation boundary | Accounting/Treasury pages relied on repeated utility combinations | Add a single route-rooted CSS module; keep financial authority in existing hooks/services | UX9 test must assert scoped root, numeric readability, local overflow, focus-visible and reduced motion | Accounting/Treasury pages and JournalPreview |

| DARFUS-UX10-SCOPED-SETTINGS-AUDIT-PRESENTATION-001 | Settings/Audit surfaces lacked one scoped presentation boundary for dense values, long identifiers and visible focus | Presentation concerns were distributed across page utility classes while authority-bearing handlers were interleaved with forms | Add one route-rooted CSS module and page root hooks; preserve all authority-bearing source | UX10 test asserts scoped roots, numeric readability, local overflow, bidi-safe values, focus-visible and reduced motion | Settings/Audit pages |

| DARFUS-UX11-SNAPSHOT-COMPLETENESS-001 | A partial source snapshot was included under a TypeScript-included backup tree without its local imports | Snapshot generation selected changed/high-risk files but did not copy all compile dependencies | Complete archive dependency closure before running project-wide typecheck; keep archive evidence outside product scope | Snapshot manifest must record dependency closure; typecheck must pass before gate | `tests/ux11-print-preview-presentation.test.cjs`; UX11 archive workflow |

| DARFUS-UX11B-MEASURED-TABLET-001 | Tablet acceptance can be asserted from CSS or a resized image without proving the real browser viewport | Evidence review may conflate responsive styling with measured runtime dimensions | Require direct local Chrome measurement with `window.innerWidth`, `innerHeight`, document/body widths, and DPR at 768–900px | `EXPLICIT_TABLET_ACCEPTANCE_REQUIRES_MEASURED_RUNTIME_WIDTH` | UX11B tablet measurement artifact and browser evidence |
| DARFUS-UX11B-DIRECT-COMPONENT-001 | A parent page or source declaration can be mistaken for proof of a changed preview component | Component inventory did not enforce a direct runtime mount for every changed preview | Require direct component proof for every changed preview; if no safe consumer exists, block and record the gap | `CHANGED_PREVIEW_COMPONENTS_REQUIRE_DIRECT_COMPONENT_PROOF` | UX11B direct component sweep |
| DARFUS-UX11B-LOCAL-CHROME-FALLBACK-001 | Missing bundled Playwright Chromium can incorrectly stop acceptance even when verified local Chrome can launch | Harness was coupled to an unavailable bundled executable | Attempt the existing harness with verified local Chrome or an evidence-only equivalent before finalizing the browser blocker | `MISSING_BUNDLED_PLAYWRIGHT_BROWSER_IS_NOT_FINAL_BLOCKER_WHEN_VERIFIED_LOCAL_CHROME_CAN_RUN_EQUIVALENT_ACCEPTANCE` | UX11B runtime and print-export harness audit |

| DARFUS-UX11C-DIRECT-MOUNT-001 | A changed preview component without a production consumer cannot receive honest browser acceptance from a parent page | The component inventory did not require an isolated direct mount path | Require a disposable test-only harness for direct visual acceptance, with business component source unchanged | `PREVIEW_COMPONENT_WITHOUT_RUNTIME_CONSUMER_REQUIRES_DISPOSABLE_TEST_HARNESS_FOR_VISUAL_ACCEPTANCE` | UX11C disposable direct mounts |
| DARFUS-UX11C-FIXTURE-ROUTE-001 | A test-only print fixture can be mistaken for a production route requirement | Locale middleware redirected the fixture path while production intentionally had no localized test route | Expose test-only fixture aliases only in disposable copies; never add production routes solely for acceptance | `TEST_ONLY_PRINT_FIXTURES_MUST_NOT_BE_ADDED_TO_PRODUCTION_ROUTES_SOLELY_FOR_ACCEPTANCE` | UX11C fixture alias and print-export evidence |
| DARFUS-UX11C-DISPOSABLE-INTEGRITY-001 | An isolated browser harness can be accepted without proving it stayed isolated from main source/DB | Harness evidence may focus only on visual output | Require initial parity, zero mutation monitoring, cleanup, and final main hash/DB verification | `DISPOSABLE_BROWSER_HARNESS_MUST_PROVE_ZERO_MAIN_SOURCE_DELTA_AND_ZERO_MAIN_DB_MUTATION` | UX11C source parity, network, DB, cleanup artifacts |
| DARFUS-UX12-PRINT-RUNNER-001 | Print-export acceptance depends on a locally installed headless executable that is absent | Runner availability was not checked before the required print command | Preflight required browser executable availability and classify missing tooling as environment evidence blocker; do not alter product/test source to bypass it | `PRINT_ACCEPTANCE_MUST_SEPARATE_PRODUCT_PROOF_FROM_RUNNER_AVAILABILITY` | UX12 print-export gate |
| DARFUS-UX12B-BUILD-SCOPE-001 | Build TypeScript includes stale rollback evidence artifacts | Generated/evidence directories remain inside the worktree TypeScript input scope | Keep rollback evidence isolated from production TypeScript inputs before a future build gate; do not delete history during UX12B | `BUILD_INPUTS_MUST_EXCLUDE_STALE_ROLLBACK_ARTIFACTS_OR_PROVE_THEM_COMPILEABLE` | UX12B build closeout |
| DARFUS-UX12B-BUILD-SCOPE-RECOVERY-001 | Broad `**/*.ts`/`**/*.tsx` globs compile ignored backups | Archive content shares the repository tree with product source | Require explicit build-input boundary review before any config edit and separate evidence validation from product build | `EVIDENCE_ARCHIVES_MUST_NOT_ENTER_PRODUCT_BUILD_INPUTS_WITHOUT_EXPLICIT_OWNER_APPROVAL` | UX12B recovery |
