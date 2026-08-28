# Owner Decision Register — Gift Voucher 01

| Decision | Current state |
|---|---|
| Official DB promotion | Not authorized; `darfus_erp` remains read-only |
| Named Gift Voucher schema promotion | AUTHORIZED_AND_COMPLETED for `darfus_erp` and `20260827010000-gift-voucher-purchased-foundation.js` in this control only |
| Purchased-only scope | Frozen and implemented; non-purchased classes fail closed |
| Partial voucher balance | FROZEN: not implemented; full face only |
| Pearl markup data | Separate Owner decision/track; not changed here |
| Official Gift Voucher business acceptance | Not authorized by this schema-promotion control |
| Next batch | No automatic start |

## UX-9

| Decision | State |
|---|---|
| UX9 financial authority | FROZEN; presentation-only scope applied |
| Accounting/Treasury routes | Existing routes preserved; no new workflow |
| Gift Voucher financial mapping prevention | OPEN; not modified by UX9 |
| UX9 closure | CLOSED pending Owner review; no automatic UX10 start |

## UX-8 Gold Center (2026-08-28)

| Decision | State |
|---|---|
| Gold provider/source/currency/quote semantics | FROZEN/PRESERVED; presentation only |
| Gold write handlers and permission `gold.manage_pricing_policy` | FROZEN/PRESERVED |
| UX8 scope | APPLIED; shared panel styling, responsive data frames, localized headings, and existing rate-input labels only |
| Official DB | READ-ONLY; no UX8 business writes |
| Rollback | READY; before/after hashes and isolated copy rehearsal |
| Next batch | UX-9 only after Owner review; no automatic start |

# UX-7 Owner Tablet Evidence Waiver (2026-08-28)

| Decision | Frozen result |
|---|---|
| UX7_TABLET_REAL_BROWSER_EVIDENCE | WAIVED_BY_OWNER |
| Waiver reason | EPHEMERAL_BROWSER_SESSION_BRANCH_CONTEXT_BLOCKER_AFTER_DIRECT_840X1180_BROWSER_PROOF |
| Product defect | NO |
| Source fix required | NO |
| Residual risk accepted | YES; Tablet-only defect on populated Customer/Supplier surfaces remains unproven |
| UX7 status | CLOSED_WITH_OWNER_EVIDENCE_WAIVER |
| Next stage | UX-8 Gold Center; not started automatically |

This waiver closes the evidence gap only. It does not convert missing Tablet evidence into PASS and does not waive business, API, DB, accounting, permissions, AR/EN, Light/Dark, Desktop, Mobile, test, typecheck, build, safety, or rollback requirements.

# UX7B evidence decision (2026-08-28)

| Decision | State |
|---|---|
| Tablet proof | BLOCKED until a real browser surface can be measured at 768–900px; no CSS/mobile substitution accepted |
| Production changes | None in UX7B |
| Next stage | UX-8 is not started automatically |

# UX7C evidence decision (2026-08-28)

| Decision | State |
|---|---|
| Direct Tablet evidence | Viewport proven at 840×1180, but populated Customer/Supplier proof blocked by missing active Branch context in disposable session |
| Context handling | No context injection or DB mutation performed |
| Next stage | UX-8 is not started automatically |

# UX7 owner decision record (2026-08-28)

| Decision | State |
|---|---|
| UX7 scope | FROZEN/APPLIED; Customers/Suppliers presentation and interaction polish only |
| Business/API/DB/accounting/POS/permission behavior | PRESERVED; no changes |
| UX7 theme parity and embedded sweep | PASS; no fixed-format preview in scope, UX6B gate remains active |
| UX7 rollback | READY; file-scoped snapshot and isolated hash rehearsal available |
| Next batch | No automatic start; UX-8 requires explicit approval |

# UX6B owner visual prevention decision (2026-08-28)

| Decision | State |
|---|---|
| Embedded high-risk preview acceptance | FROZEN: embedded components cannot pass from parent-page screenshots alone |
| Light/Dark proof | FROZEN: same data/state must be proven in both themes |
| Print-like surfaces | FROZEN: explicit theme-isolated paper/ink surface required |
| UX6B correction | APPLIED; presentation only, barcode/tag/print/business authorities preserved |
| Next batch | No automatic start |

# UX6 owner scope record (2026-08-28)

| Decision | State |
|---|---|
| UX6 scope | FROZEN/APPLIED; Inventory overview and Asset detail presentation only |
| Business/API/DB/permission authorities | PRESERVED; no changes |
| Inventory Count | CLOSED; not reopened |
| Pre-existing worktree drift | PRESERVED; no cleanup or reset |
| UX6 rollback | PASS rehearsal in isolated evidence directory |
| Next batch | No automatic start |

# GBW override-reason fix owner review (2026-08-28)

| Decision | Current state | Owner action required |
|---|---|---|
| UI reason capture/mapping | Implemented with existing server contract | Review minimum-safe frontend fix |
| Full successful lower-rate acceptance | Not run in this control | Authorize a safe acceptance target if required |
| Full successful higher-rate acceptance | Not run in this control | Authorize a safe acceptance target if required |
| Historical raw request body | Not retained; no replay or new Receive authorized | Accept evidence limitation or authorize future safe observability work |
| Next batch | No automatic start | Explicit approval only |

# UX5B owner review record (2026-08-28)

| Decision | State |
|---|---|
| Populated POS evidence | CLOSED_BY_EVIDENCE; isolated static fixture only |
| Production source/business logic | UNCHANGED |
| Sidebar Light issue | Remains closed; not reopened |
| Gift Voucher logic | Untouched |
| UX-6 | OWNER REVIEW REQUIRED; no automatic start |

# UX5D owner visual scope (2026-08-28)

| Decision | State |
|---|---|
| Gift Voucher scope | FROZEN/APPLIED; visual clarity only |
| Business/API/DB/payment/checkout/accounting/tax/inventory scope | PRESERVED; no changes |
| UX5C deferred issues | Preserved; not reopened |
| UX5D rollback | READY after isolated restore/reapply hash rehearsal |
| Next batch | No automatic start |

# UX5C owner visual correction decision (2026-08-28)

| Decision | State |
|---|---|
| UX5C scope | FROZEN/APPLIED; POS presentation only |
| Approved findings | Tablet compression, Arabic payment chrome, discount neutral state, disabled checkout, empty-cart clear presentation, search clipping, teal/gold balance, empty POS density |
| Deferred Sidebar Light height | PRESERVED/DEFERRED; not touched |
| Deferred Gift Voucher vs Empty Cart state | PRESERVED/DEFERRED; not touched |
| Business/API/DB/payment/checkout scope | PRESERVED; no changes |
| UX5C rollback | READY; isolated hash rehearsal passed |
| Next batch | No automatic start |

# UX5 owner decision record (2026-08-28)

| Decision | State |
|---|---|
| UX5 scope | FROZEN/APPLIED; POS presentation only |
| Business/API/DB/tax/accounting/inventory/payment/voucher authority | PRESERVED; no service or contract change |
| POS presentation boundary | Customer/search/items/payment/totals layout, responsive density, AR/EN, dark/light and accessibility state only |
| Main DB | READ-ONLY; no business mutation authorized or observed |
| UX5 rollback | READY; file-scoped source snapshot and exact-hash rehearsal passed |
| Next batch | No automatic start |

# UX4B owner decision (2026-08-28)

| Decision | State |
|---|---|
| Drawer focus restoration defect | OWNER REVIEW REQUIRED; do not fix in UX4B |
| UX4B gate | FAIL until Drawer focus return is corrected and re-proven |
| UX4C / UX5 | NOT AUTHORIZED; no automatic start |

# UX4C closure (2026-08-28)

| Decision | State |
|---|---|
| Drawer focus restoration | IMPLEMENTED_AND_PROVEN; scoped UX4C only |
| UX4B-A11Y-001 | CLOSED |
| UX4 status | CLOSED after UX4C evidence |
| UX5 | NOT AUTHORIZED; no automatic start |

No new Owner decision was assumed during this batch.

| Official Voucher business acceptance authorization | OWNER-AUTHORIZED for exactly one minimum Purchased Gift Voucher cycle on `darfus_erp`: one issue, optional required activation, one full POS redemption; no additional Voucher/Checkout, mixed payment, concurrency, print mutation, Pearl repair, or cleanup | Consumed only as one issue attempt in this control; it failed HTTP 403 before persistence |
| Official acceptance failed mutation handling | FROZEN: no retry, no restore, no deletion, no second business attempt after an ambiguous/failed result | Applied; zero official business delta |
| Runtime parity blocker | Separate Owner review required before any future acceptance; this record does not authorize refresh or another financial mutation | OPEN |

| Runtime parity recovery | Owner-authorized backend-only refresh of the normal local service; no frontend/DB/Redis restart and no business retry | COMPLETED; authenticated read proof passed; future financial retry requires a new explicit authorization |

| POS Gift Voucher payment composition | Voucher is a settlement component, not a discount; one canonical UI/state path | FROZEN/PRESERVED; no tax/accounting/payment-engine business change |
| Gift Voucher + Installment/Deposit | Current server contract does not support these combinations | OWNER REVIEW REQUIRED before any backend capability work; current UI must fail closed |
| POS Gift Voucher UI control | No official financial retry, checkout, issue, activation, redemption, print, or DB mutation in this control | COMPLETED; read-only browser proof only |
| POS-GV-INSTALLMENT-DEPOSIT-VISIBILITY-001 | Installment/Deposit + Voucher remain visible but unsupported | FROZEN; UI must remain disabled/fail-closed; no backend capability change in visual control |

| POS-GV-I18N-NARROW-CLOSEOUT-001 | Error presentation uses locale catalog; unsupported payment combinations remain visible but disabled | FROZEN/PRESERVED; no financial retry or backend capability change authorized | CLOSED for read-only UI control; future financial acceptance needs separate authorization |

| GV-OFFICIAL-RETRY-01 | Owner authorized exactly one auto-confirmed-current-total issue and one checkout cycle, with no retry after failure | Applied: current total 3235.82 was used once; issue returned 422 and control stopped | Any future mapping fix or financial retry requires separate explicit authorization/control |
| GV-ISSUE-FINANCIAL-MAPPING-001 | `FINANCIAL_MAPPING_REQUIRED` blocks Purchased Gift Voucher issue | OPEN; do not infer whether configuration/master data or product correction is the owner of the mapping | Owner review required before any change or retry |
| GV-FINANCIAL-MAPPING-001 | Freeze the exact company/branch semantic role authority for `GIFT_VOUCHER_LIABILITY` and authorize clone-only recovery proof | REQUIRED; official role rows are absent, candidate account 2400 is not sufficient authority | Owner decision required; no official write or retry |
| TAX-RATE-AUTHORITY-VERIFY-001 | Freeze whether current company VAT policy is 14% and how its effective date is governed against 5% legal metadata | REQUIRED; source reads configured 14%, tax metadata states 5%, effective date not stored | Owner policy decision required before financial proof |
| TAX-RATE-AUTHORITY-VERIFY-001-CLOSURE | Owner decision: company Tax Center configuration is runtime authority; current company rate is 14%; 5% is metadata only | FROZEN / CLOSED_BY_OWNER_POLICY | Applied without changing Tax code/settings; future financial proof uses configured company rate |
| GV-FINANCIAL-MAPPING-001-CLOSURE | Owner-authorized exact role mapping promotion after clone gates | FROZEN / APPLIED | Only two `GIFT_VOUCHER_LIABILITY` role rows were created; no Voucher issue/Checkout |
| GV-UNAUTHORIZED-OFFICIAL-MUTATION-001 | Decide handling/acceptance of official Voucher 1000.0000, activation, and print history observed after mapping checkpoint | OWNER REVIEW REQUIRED | No rollback, cleanup, or repeat operation authorized by this control |
| GV-EXTERNAL-CONCURRENT-500-001 | Decide handling of unrelated AED 500 Voucher observed at 19:05:19 during post-acceptance reconciliation | OWNER REVIEW REQUIRED | Preserve current data; no automatic cleanup/reversal or new financial operation |
| MIGRATION-STARTUP-CONTRACT-001 | Normal deployment may run repository-approved pending migrations through canonical runner; manual rehearsal uses guarded safe command | FROZEN FOR STARTUP CONTRACT | `db:migrate=sequelize db:migrate`; `db:migrate:safe=node scripts/migrate-safe.js`; failure blocks `npm start` |
| UX0-D01 | Choose one of three proposed visual directions and approve terminology/contrast/density/accessibility priorities | OPEN; UX-0 proposal only | Required before UX-1; no business authority changes permitted |
| UX0B-D01 | Review refined `DARFUS OBSIDIAN ATELIER`, terminology ambiguities, and whether to authorize completion of missing AR/EN × Dark/Light responsive evidence | OWNER REVIEW REQUIRED | No design implementation or workflow change authorized |
| UX1-D01 | Review `DARFUS OBSIDIAN ATELIER` direction, semantic tokens, typography/numeric/motion/responsive/accessibility contracts and isolated prototypes | REFERENCE SPECIFICATION COMPLETE; OWNER VISUAL REVIEW REQUIRED before any production rollout or UX-2 | No business/API/DB authority changes; UX-2 is not authorized automatically |
| UX1R-D01 | Review the compact production-style refinement and owner visual approval pack for the already approved Obsidian Atelier direction | REFERENCE REFINEMENT COMPLETE; OWNER VISUAL APPROVAL REQUIRED before production rollout or UX-2 | Prototype-only refinement; no production theme, component, route or behavior change |
| DARFUS-UX2-SEMANTIC-TOKEN-FOUNDATION-001 | Authorize only the minimum Obsidian semantic foundation after classic rollback readiness | OWNER-AUTHORIZED / APPLIED WITHIN SCOPE | `app/globals.css` only; no module rollout, business/API/DB change, or automatic UX-3 |

# GBW purchase-rate override reason (2026-08-28)

| Decision | Current state | Owner action required |
|---|---|---|
| UI reason capture/mapping | Not implemented; server contract is proven | Authorize a named minimum-safe GBW UI fix or keep the P1 workflow blocked |
| Backend validation | Frozen/proven fail-closed; no change proposed | No decision needed to weaken validation |
| Raw historical request body | Not retained; no replay or new Receive authorized | Accept evidence limitation or authorize future safe observability work |
| Arabic error localization | Separate documented P2 | Authorize separately if desired |
# UX3 owner decision record (2026-08-28)

- UX3 was executed within the supplied shell/navigation scope. No owner decision was assumed for business, permission, route, accounting, inventory, or database behavior.

# UX4 owner decision record (2026-08-28)

| Decision | State |
|---|---|
| UX4 scope | FROZEN/APPLIED; shared UI presentation/accessibility only |
| Existing component contracts | PRESERVED; no required prop/default/event contract changed |
| Module consumer migration | NOT AUTHORIZED; no mass rewrite performed |
| Business/API/DB/permission scope | PRESERVED; no changes |
| UX4 rollback | READY; file-scoped snapshot and hash rehearsal available |
| Next batch | No automatic start |
