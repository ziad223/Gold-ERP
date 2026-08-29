# DARFUS Error Register — Gift Voucher 01

This register preserves resolved evidence from the accepted disposable-clone
implementation. It does not reopen or rerun any runtime behavior.

| ID | Layer | Finding | Root-cause link | Status | Minimum fix / disposition | Official DB impact |
|---|---|---|---|---|---|---|
| GV-E-001 | Environment | Local harness credentials did not match local PostgreSQL connection | — | RESOLVED | Ran inside the approved isolated backend; no business mutation | 0 |
| GV-E-002 | Environment | Temporary frontend Junction was rejected by Turbopack | — | RESOLVED | Rebuilt in a separate temporary directory with lockfile dependencies | 0 |
| GV-E-003 | Product/runtime | `COUNT` aggregate used `FOR UPDATE` in the print path | GV-L-003 | RESOLVED | Lock the parent Voucher identity; do not row-lock an aggregate count; focused test and clone rerun passed | 0 |
| GV-E-004 | Harness/query | Legacy `stock_movements` was queried instead of `inventory_asset_movements` | GV-L-004 | RESOLVED | Correct the proof query to the canonical movement/event authorities; asset movement evidence passed | 0 |
| GV-E-005 | Existing configuration | Pearl asset preview failed with invalid or missing markup percent | Separate issue GV-I-001 | OPEN / DEFERRED | Keep separate from Gift Voucher; no Pearl data, pricing logic, default, or hardcoded markup change | 0 |
| GV-E-006 | Product runtime / shared POS pricing | POS preview and checkout used different profile-price recognition paths, causing a shared pricing-registry mismatch during Gift Voucher clone acceptance | GV-L-001 | RESOLVED | Use the shared canonical `isSalePricingProfile` recognition path; accepted impacted POS/financial regression set passed | 0 |
| GV-E-007 | Accounting / posting precision | Cent-level rounding caused a valid sub-cent journal to differ by 0.01 during disposable Gift Voucher acceptance | GV-L-002 | RESOLVED | Use four-decimal posting precision whenever relevant transaction values contain sub-cent precision and assert Debit = Credit; focused and clone financial proof passed | 0 |

Historical issue `PURCHASE-ORDER-UNBALANCED-JOURNAL-001` is separate and remains
untouched. Reopen GV-E-006 or GV-E-007 only if a direct current regression is
proven in the corresponding authority.

Official schema promotion control `DARFUS-GIFT-VOUCHER-CONTROLLED-OFFICIAL-MIGRATION-PROMOTION-01` produced no new error or unexplained side effect. The historical Pearl issue and historical purchase-order journal exception remain separate and unchanged.

| GV-E-008 | Official runtime parity | Main Gift Voucher issue submission returned HTTP 403 with `GIFT_VOUCHER_FINANCIAL_WORKFLOW_DISABLED` after source/schema promotion | GV-L-005 | RESOLVED FOR READ-SIDE PARITY | Backend-only refresh loaded the current approved source; authenticated GET returned 200; no financial mutation was retried | 0 |

The one authorized issue attempt was not replayed. The backend log request ID was `cbf36216-8071-4b0c-a7b7-f68ac60e33dd`. Read-side `GET /api/v1/gift-vouchers` returned HTTP 500 in the stale runtime and HTTP 200 after the approved backend-only refresh; no rows were written in either control.

Recovery evidence: `DARFUS_GIFT_VOUCHER_MAIN_RUNTIME_PARITY_RECOVERY_01_REPORT.md`.

| POS-GV-PAYMENT-MODE-VISIBILITY-001 | UI composition | Gift Voucher was nested under Split-only JSX, so it was not available beside other primary modes | POS-GV-ONE-CANONICAL-PAYMENT-COMPONENT-001 | RESOLVED_FOR_SUPPORTED_MODES; full all-mode closure blocked | Shared component outside Split; unsupported server combinations fail closed | 0 |
| POS-PAYMENT-UX-LAYOUT-001 | UI/accessibility | Old Voucher control used a cramped Split-grid `h-8` layout with weak hierarchy/focus affordance | POS-GV-ONE-CANONICAL-PAYMENT-COMPONENT-001 | RESOLVED | `input-base`, responsive width, explicit label, focus token, AR/EN proof | 0 |
| POS-GV-INPUT-VISIBILITY-LAYOUT-002 | Visual UI | RTL input/action composition collapsed the code field and obscured typing/caret | POS-VISUAL-BROWSER-ACCEPTANCE-001 | CORRECTED_DESKTOP_AR_EN; narrow evidence pending | Local Flex width correction; no business change | 0 |

| POS-GV-I18N-ERROR-MESSAGE-001 | I18N/UI | English POS surfaced the Arabic 404 server message through raw `error.message` | POS-I18N-ERROR-MESSAGE-GATE-001 | CLOSED | Status/code classifier plus AR/EN POS catalog; no backend or business change | 0 |

| POS-GV-INPUT-VISIBILITY-LAYOUT-002 | Visual UI | Narrow viewport proof was previously unavailable | POS-VISUAL-BROWSER-ACCEPTANCE-001 | CLOSED_FOR_THIS_CONTROL | Internal browser viewport capability provided explicit 768x800 proof; AR/EN focus and unsupported-mode states passed | 0 |

| GV-E-009 | Official runtime financial readiness | Gift Voucher issue returned HTTP 422 `FINANCIAL_MAPPING_REQUIRED` before persistence | GV-L-006 | OPEN / BLOCKING | Resolve and prove required semantic financial mapping in a separately approved control; do not retry automatically | 0 |
| GV-FINANCIAL-MAPPING-001 | Financial authority | Required `GIFT_VOUCHER_LIABILITY` semantic role is absent in both official branches; canonical issue fails closed with HTTP 422 before persistence | FINANCIAL-MAPPING-PREFLIGHT-001 | OPEN / BLOCKING | Missing master-data mapping; no hardcoded account fallback; future clone proof only | 0 |
| TAX-RATE-AUTHORITY-VERIFY-001 | Financial policy | Company settings expose 14% while tax engine legal metadata identifies 5%; no effective-date field proves which policy governs | OWNER-TAX-POLICY-DECISION | OPEN / BLOCKING FOR THIS CONTROL | Freeze the applicable company tax policy before any future financial mapping proof; do not change now | 0 |
| GV-FINANCIAL-MAPPING-001-CLOSURE | Financial authority | Two exact branch-scoped `GIFT_VOUCHER_LIABILITY` mappings now resolve to compatible account 2400; no Voucher transaction was created | DARFUS_GV_MAPPING_OFFICIAL_DELTA.md | CLOSED | Minimum exact mapping promotion; historical failure entry retained | 0 |
| FINANCIAL-MAPPING-PREFLIGHT-001-CLOSURE | Financial readiness | Backup, clone, account, scope, resolver, accounting, idempotency, rollback, tests and official delta gates passed | DARFUS_GIFT_VOUCHER_FINANCIAL_MAPPING_MINIMUM_SAFE_FIX_01_REPORT.md | CLOSED_FOR_MAPPING_CONTROL | Does not authorize official Voucher issue | 0 |
| TAX-RATE-AUTHORITY-VERIFY-001-CLOSURE | Financial policy | Owner froze company Tax Center configuration as runtime authority at 14%; 5% remains non-runtime metadata | DARFUS_GV_TAX_OWNER_AUTHORITY_DECISION.md | CLOSED_BY_OWNER_POLICY | No Tax code or setting changed | 0 |
| GV-UNAUTHORIZED-OFFICIAL-MUTATION-001 | Official financial mutation | After mapping promotion checkpoint, an external runtime issued a 1000.0000 Voucher, activated it, and created two print events | DARFUS_GIFT_VOUCHER_FINANCIAL_MAPPING_MINIMUM_SAFE_FIX_01_REPORT.md | OPEN / P1 | Do not rollback or cleanup automatically; Owner forensic review required | 0 |
| GV-EXTERNAL-CONCURRENT-500-001 | Concurrent official Voucher mutation outside this control | Voucher `GV-05a43035-1aa2-456d-abc5-1c08c966a140` / AED 500 appeared at 19:05:19 with independent issue/activation records after the authorized AED 1000 flow | `DARFUS_GV_OFFICIAL_1000_DB_DELTA.md` | OPEN / OWNER REVIEW | Attributed and preserved; no cleanup, reversal, or retry | 0 |
| MIGRATION-DEPLOYMENT-CONTRACT-TENSION-001 | Historical safe wrapper and normal automatic deployment policy are separate contracts | Worktree drift replaced the normal runner with the approval wrapper; no introducing commit exists in reachable history | DOCUMENTED / P3 | Keep `db:migrate` canonical and retain `db:migrate:safe` for manual rehearsal; Owner review before deployment | 0 |
| UX0-ERR-001 | UX-0 sampled browser evidence found mixed-language values, dense critical views, and incomplete global contrast/label proof | UX / I18N / ACCESSIBILITY / EVIDENCE | OPEN; documented only | No source or DB change; retained for Owner review and later UX-1 scope | 0 |
| UX0B-ERR-001 | Full AR/EN × Dark/Light × 7-class evidence was not completed; `/en/sales/deposits` returned 404 and Tax Center state was not fully proven | ACCEPTANCE_EVIDENCE_GAP / ROUTE | OPEN / UX-0B BLOCKING | Preserve evidence, do not infer route or state, require Owner-approved follow-up | 0 |
| UX1-ERR-001 | UX-1 isolated reference route was initially unavailable through the locale wrapper because of an incorrect relative import | UX1 / ROUTE / SOURCE | RESOLVED | Minimum prototype-only wrapper import correction; browser route returned 200; no production/API/DB change | 0 |
| UX1R-ERR-001 | No new runtime warning/error was captured during UX-1R browser refinement; reduced-motion media emulation is not exposed by the browser harness | UX1R / ACCEPTANCE_EVIDENCE | DOCUMENTED_LIMITATION | CSS contract and served keyframes were inspected; no production change or fallback behavior was introduced | 0 |
| UX2-ERR-001 | Initial typecheck included TypeScript files inside the in-repository classic snapshot and reported missing snapshot-only dependencies | UX2 / ARTIFACT_SCOPE | RESOLVED | Snapshot TypeScript copies were renamed to `.ux2snapshot`; product source/config was not changed; typecheck then exited 0 | 0 |
# UX3 error reconciliation (2026-08-28)

- UX3 browser console error count: `0` on the tested AR/EN shell routes. No API/DB error path was changed. Network instrumentation was not exposed by the connected browser capability set and remains an evidence limitation, not an inferred PASS.

# UX4 error reconciliation (2026-08-28)

- No UX4 runtime console error/warning was captured on the tested AR/EN consumer routes. Network instrumentation was not exposed by the connected browser capability set; this remains a P3 evidence limitation and is not treated as a business/API PASS claim.

# UX4B error reconciliation (2026-08-28)

- `UX4B-A11Y-001`: Drawer entry focus passed, but close did not restore focus to the invoking trigger; active element was `BODY`. P2; not fixed in UX4B.
- Fresh UX4B reference tabs reported zero console errors/warnings after the localized route correction. Network capture and reduced-motion emulation remain tool limitations.

# UX4C error reconciliation (2026-08-28)

- `UX4B-A11Y-001` resolved by the scoped Drawer focus-restoration change; fresh EN/AR desktop/mobile probes returned focus to the exact trigger.
- Focused UX4C/UX4B/UX4/UX3 tests passed `13/13`; fresh browser tabs captured zero error/warning entries.

# UX5C evidence reconciliation (2026-08-28)

- No application console errors, warnings, or hydration errors were observed in the UX5C AR/EN browser pass.
- Detailed request interception remains unavailable in the connected browser surface; source/API review and read-only backend evidence were used. This is a P3 evidence limitation, not a product mutation.
- Empty-cart state was intentionally retained because UX5C forbids business mutation; populated-cart acceptance is outside this visual-only control.

# UX5D evidence reconciliation (2026-08-28)

- No UX5D application console errors, warnings, or hydration errors were observed.
- A concurrent Receive/PO/Asset/Journal group was observed in the shared official runtime during the window; it was not initiated by UX5D, was not modified, and is documented in the UX5D report. UX5D business writes remain zero.

# GBW receiving purchase-rate override reason (2026-08-28)

| Issue ID | Symptom | Evidence | Classification | Status |
|---|---|---|---|---|
| DARFUS-GBW-RECEIVING-PURCHASE-GOLD-RATE-OVERRIDE-REASON-001 | Non-equal purchase rate reaches the server without a reason and is rejected with 422 | GBW page has rate state/input but no reason state/key; backend gate at `erp.routes.js:8550–8564`; four logged 422 responses | PRODUCT_DEFECT / CONTRACT_MISMATCH; backend validation is not defective | ROOT_CAUSE_PROVEN_AWAITING_OWNER_FIX_AUTHORIZATION |
| DARFUS-GBW-RECEIVING-I18N-RAW-ERROR-001 | Arabic UI can display backend English reason-required message | `page.tsx` catch uses `caught?.message` directly | UX/OBSERVABILITY | DOCUMENTED_AWAITING_OWNER_FIX_AUTHORIZATION |

# GBW purchase-rate override reason minimum-safe fix (2026-08-28)

| Issue ID | Current evidence | Status |
|---|---|---|
| DARFUS-GBW-RECEIVING-PURCHASE-GOLD-RATE-OVERRIDE-REASON-001 | Frontend now supplies the existing `purchaseRateOverrideReason` contract for non-equal rates; no business receive was executed | MINIMUM_FIX_IMPLEMENTED_AWAITING_FULL_ACCEPTANCE |
| DARFUS-GBW-RECEIVING-I18N-RAW-ERROR-001 | Scoped Arabic mapping added for the exact reason-required backend error; other errors preserve existing handling | SCOPED_UI_MAPPING_IMPLEMENTED |

# UX5B populated POS evidence closeout (2026-08-28)

- No UX5B application error, business failure, or unexpected DB delta was observed. The isolated fixture is explicitly non-authoritative and produced no API mutation.

# UX6 Inventory/Asset implementation (2026-08-28)

- No new UX6 application, business, API, or database error was observed. The only coverage limitation is documented visual coverage for forced empty/loading/error and synthetic extreme-value states; no mutation was used to manufacture them.

# UX6B Asset Tag / Barcode Dark Mode visual correction (2026-08-28)

- The observed Dark Mode contrast defect was reproduced and closed by a scoped presentation fix. No new application, business, barcode, print, API, or database error remains in this control.

# UX7 Customers / Suppliers presentation (2026-08-28)

- No new application, business, API, database, accounting, POS or permission error was observed. The typecheck issue caused by old UX6B evidence copies was isolated to those non-source copies and resolved by renaming them as snapshot evidence; the final typecheck and build passed.

# UX7B Tablet evidence closeout (2026-08-28)

- Tablet evidence remains incomplete because the available real browser could not set or expose a measured viewport in the required 768–900px range. This is an evidence-environment blocker, not a product defect; no source or business behavior was changed.

# UX7C direct Chrome/Playwright Tablet evidence (2026-08-28)

- Direct Chrome/Playwright measured the required 840×1180 viewport and authenticated, but the isolated session stopped at `Branch readiness required`; populated Customer/Supplier proof could not be reached without a context change. No product defect or mutation was introduced.

# UX-8 Gold Center (2026-08-28)

- No UX8 product error was observed. A pre-existing `next dev` process was visible during process inspection but did not own port 3000; it was not started or modified by UX8. Main port 3000 was owned by the existing `next start` listener.

# UX-9 Accounting / Treasury (2026-08-28)

- No UX9 product error was observed. Mobile dense tables use bounded local horizontal scrolling while page/document overflow remains zero. No console warning/error was observed in the browser proof.

# UX-10 Settings / Audit (2026-08-28)

- No UX10 product error was observed. The owner-method contract file was absent from the workspace after exact search and was recorded as a documentation environment gap only; no secret or mutation was captured.

# UX-11 Print / Preview (2026-08-28)

- A first typecheck included the newly created partial UX11 source snapshot and reported missing copied dependencies inside `backups/ui-ux/PRE_UX11_PRINT_PREVIEW_20260828T222005Z/source`. This was an archive completeness issue, not a product defect; the archive was completed and typecheck passed. No production source/config was changed for this issue.
- No UX11 browser console error or warning was observed. No print/reprint or business mutation was executed.

# UX-11B Print / Preview Evidence Closeout (2026-08-28)

- Local Chrome launched successfully and the required 840x1180 tablet viewport was measured.
- The existing print-export harness could not render its fixture: the normal Playwright command lacked bundled `chromium_headless_shell-1161`, and the evidence-only local-Chrome runner received HTTP 404 for the localized `/ar/test/print-export` path. This is recorded as an evidence/runtime availability blocker; no source or test fix was made.
- `ReceiptPreview` and `BarcodeLabelPreview` have source declarations but no current reachable consumer/mount, so direct browser proof is incomplete. No route or fixture was added to manufacture proof.

# UX-11C Disposable Evidence Harness (2026-08-28)

- The disposable-only direct mounts and localized fixture alias rendered successfully through verified local Chrome; no application console, hydration, page, or mutation error was observed.
- The existing `tests/export-print.spec.ts` run was 16/17. The sole failure is a stale test-contract defect: `renders modernDark theme preset on luxuryGold without crashing` creates a locator without first calling `page.goto(FIXTURE_PAGE)`. The fixture marker is present when navigated by the evidence runner. No test or product source was modified.
- The initial disposable build attempt failed only because Turbopack rejects a node_modules junction outside the filesystem root; an in-copy physical dependency copy resolved the harness environment issue. The disposable build then passed.
- UX-12 local `npm run test:print-export` could not launch the configured Playwright headless executable because `headless_shell.exe` is absent. This is recorded as an environment evidence blocker; no browser was downloaded and no product/test workaround was applied.
- UX-12B build reached successful compilation but TypeScript failed with code 1 in the pre-existing UX11 rollback artifact because `./print-types` was missing. Raw pageerror/requestfailed hooks were unavailable in the connected Chrome API; visible/runtime console errors remained 0.
- UX-12B recovery confirmed the same scope defect: broad TypeScript globs include ignored `backups/**`; 90 backup files were present in effective compiler input. Minimum `tsconfig.json` exclusion is Owner-gated and was not applied.
