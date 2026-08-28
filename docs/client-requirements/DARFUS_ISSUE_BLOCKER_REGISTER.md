# DARFUS Issue / Blocker Register — Gift Voucher 01

| ID | Issue | Classification | Severity | Blocks this batch? | Disposition |
|---|---|---|---|---|---|
| GV-I-001 | Pearl profile master data has invalid/missing markup percent for one asset | MISSING_MASTER_DATA / CONFIG; NOT_A_GIFT_VOUCHER_DEFECT | P2 | No; fixture excluded safely | Owner review in Pearl track; no Pearl data, pricing logic, default, or hardcoded markup change |
| GV-I-002 | Official promotion not authorized | GOVERNANCE | P1 for promotion only | No for this completed schema-promotion control; yes for business acceptance | AUTHORIZED_AND_PROMOTED for the named Gift Voucher schema migration only; business issuance/redemption/checkout remains unauthorized |

No P0 or P1 defect was introduced in the Gift Voucher implementation itself. GV-I-001 remains a separate Pearl configuration issue.

| DARFUS-UX4-NETWORK-OBSERVABILITY-001 | Browser capability did not expose network request instrumentation during UX4 presentation verification | ACCEPTANCE_EVIDENCE_GAP | P3 | No | Console/DOM/runtime evidence recorded; no network PASS claim inferred |

| GV-I-003 | Official Gift Voucher business acceptance was blocked because the running backend served the old fail-closed financial-workflow guard while current source exposed the promoted issue route; read-side Voucher list also returned 500 | ENVIRONMENT_CONFIG / RUNTIME_PARITY | P1 for the prior acceptance | Resolved for read-side parity; no business acceptance authorized | Backend-only refresh completed; authenticated Gift Voucher GET returned 200; any future financial attempt still needs separate Owner authorization |

| POS-GV-PAYMENT-MODE-VISIBILITY-001 | Gift Voucher + Installment/Deposit is not supported by the current server payment contract; the UI cannot claim full all-mode enablement | PROVIDER/CAPABILITY / UX COMPOSITION | P2 current control; blocks full all-mode closure | No backend change in this UI control; fail closed and require Owner decision for any future server capability | Cash/Card/Transfer/Split are proven supported; no official DB impact |
| POS-GV-INPUT-VISIBILITY-LAYOUT-002 | Narrow viewport visual proof cannot be completed because the available browser control has no resize/emulation capability | ACCEPTANCE_EVIDENCE_GAP | P2 | Keep gate blocked; do not infer narrow PASS from CSS | Desktop AR/EN corrected; official DB delta 0 |

| POS-I18N-ERROR-MESSAGE-GATE-001 | Gift Voucher validation displayed raw server-language text in EN | UI / I18N | P2 | No | CLOSED: stable status/code mapping, complete AR/EN catalog, focused tests, clean internal browser proof |

| POS-GV-NARROW-VISUAL-001 | Prior visual control lacked controllable narrow viewport evidence | ACCEPTANCE_EVIDENCE_GAP | P2 historical | No | CLOSED_FOR_THIS_CONTROL: internal viewport set to 768x800 and AR/EN states reviewed |

| GV-I-004 | Official Purchased Gift Voucher issue cannot resolve required semantic financial mapping | MISSING_MASTER_DATA / ENVIRONMENT_CONFIG; unresolved product-vs-configuration classification | P1 | Yes; blocks this acceptance | STOPPED before persistence. Owner must decide/authorize the minimum safe mapping closure; no retry or financial mutation was attempted |
| GV-FINANCIAL-MAPPING-001 | Required `GIFT_VOUCHER_LIABILITY` role mapping missing for purchased issue | MISSING_MASTER_DATA | P1 | Yes | Exact resolver failure proven; candidate account 2400 exists but is not semantic authority; clone-only future proof |
| TAX-RATE-AUTHORITY-VERIFY-001 | Configured VAT policy is not reconciled with legal metadata/effective date | OWNER_DECISION_REQUIRED / FINANCIAL | P1 | Yes for this control | 14% configured; 5% legal metadata; no effective-date storage; no rate changed |
| GV-FINANCIAL-MAPPING-001-CLOSURE | Required liability mapping is now present exactly once per active branch | RESOLVED_CONFIGURATION | P1 | No for mapping control | Official readiness PASS; two mapping rows only; Voucher issue remains separately unauthorized |
| TAX-RATE-AUTHORITY-VERIFY-001-CLOSURE | Company-configured 14% is frozen as runtime policy by Owner | RESOLVED_OWNER_POLICY | P1 | No for mapping control | Read-only Tax calculation follows 14%; no Tax mutation |
| GV-UNAUTHORIZED-OFFICIAL-MUTATION-001 | Official Voucher/Journal/Cash mutation occurred after mapping checkpoint outside this control | UNAUTHORIZED_OFFICIAL_FINANCIAL_MUTATION | P1 | Yes | Current DB has Voucher 1, Journal 30, CashTransactions 12; no automatic repair permitted |
| GV-EXTERNAL-CONCURRENT-500-001 | Independent AED 500 Voucher issue/activation observed during post-acceptance delta review | CONCURRENT_EXTERNAL_MUTATION | P1 for governance review; not a defect in the authorized flow | No | Separate Voucher identity/key/journal/time prove attribution; preserve data and await Owner review |
| AUTO-STARTUP-MIGRATION-CONTRACT-RESTORE-001 | Normal startup was blocked by the safe approval wrapper / missing automatic chain | RESOLVED_SOURCE_CONTRACT | P1 | No | Canonical runner restored and proven on Disposable clone; official DB never executed |
| UX0-BLOCK-001 | UX-0 evidence gate remains blocked for exhaustive critical-state visual coverage; five required visual/i18n concerns remain open | UX / ACCEPTANCE_EVIDENCE_GAP | P1/P2 | Yes for UX-0 PASS | No implementation, no DB impact; see UX-0 issue matrix |
| UX0-OBS-DB-001 | Official `journal_entries` increased from 34 to 35 during read-only audit; latest row is an external Gift Voucher issue at 20:10:13Z | CONCURRENT_EXTERNAL_MUTATION / FINANCIAL | P1 for attribution review; not caused by UX-0 | No | Preserve and attribute separately; no cleanup or rollback by UX-0 |
| DARFUS-MODERN-EXPERIENCE-NONTRADITIONAL-001 | Existing navy/teal/gold UI is operational but not yet a distinctive modern jewellery/precious-metals direction | DESIGN_DIRECTION / UX | P2 | No | Refined Obsidian Atelier proposal awaits Owner review; no implementation |
| DARFUS-I18N-LANGUAGE-PURITY-001 | AR/EN chrome/data/message separation is incomplete; English surfaces show Arabic business values and some raw Arabic runtime text | I18N | P1 | Yes for UX-0B PASS | Business data may remain source language; raw messages require translation boundary |
| DARFUS-RESPONSIVE-ALL-DEVICE-CLASS-001 | Seven viewport classes measured for EN/Dark, but complete locale/theme cross-product and overlay proof remain incomplete | RESPONSIVE / ACCEPTANCE_EVIDENCE_GAP | P1 | Yes for UX-0B PASS | Do not claim universal responsive acceptance; follow dedicated matrix |
| DARFUS-MOTION-SAFETY-001 | No formal reduced-motion/critical-operation motion contract was previously frozen | MOTION / ACCESSIBILITY | P2 | No | UX-1 must adopt the read-only motion policy; no decorative infinite motion |
| UX1-REFERENCE-EVIDENCE-001 | UX-1 isolated prototypes required actual browser proof before a design-system reference gate could close | ACCEPTANCE_EVIDENCE_GAP / UX1 | RESOLVED | No | Browser matrix covers three prototypes, AR/EN, RTL/LTR, dark/light and mobile/tablet/desktop; production rollout remains separate |
| UX1R-OWNER-VISUAL-001 | UX-1 identity needed operational-density and Arabic/English purity evidence before visual handoff | UX1R / DESIGN / ACCEPTANCE | RESOLVED_FOR_PROTOTYPE | No | Compact shell, density, language, motion, reduced-motion, responsive and accessibility evidence are documented; production rollout remains separately gated |
| DARFUS-UIUX-UX2-001 | UX-2 required classic rollback proof before a production foundation change | UX2 / ROLLBACK | RESOLVED | No | Classic snapshot, exact SHA parity rehearsal, restore map and after-state rollback proof completed |

# UX4B blocker status (2026-08-28)

| ID | Issue | Area | Severity | Status | Disposition |
|---|---|---|---|---|---|
| UX4B-A11Y-001 | Drawer closes with focus on BODY instead of the invoking trigger | Accessibility / UX4B | P2 | OPEN | Owner review; propose separate UX4C minimum-safe correction |

# UX4C blocker resolution (2026-08-28)

| ID | Resolution | Severity | Status | Evidence |
|---|---|---|---|---|
| UX4B-A11Y-001 | Drawer restores focus to exact invoking trigger after close | P2 | RESOLVED | UX4C browser evidence and focused regression test |
# UX3 issue status (2026-08-28)

- No P0/P1 UX3 blocker observed. Dedicated network capture is unavailable in the browser tool; source/API scope review confirms no UX3 API caller or route change.

# UX5 evidence limitations (2026-08-28)

| ID | Issue | Area | Severity | Status | Disposition |
|---|---|---|---|---|---|
| UX5-NETWORK-OBSERVABILITY-001 | Connected browser surface does not expose request-method/network interception; only DOM, console, URL and read-only runtime evidence were available | Acceptance evidence | P3 | DOCUMENTED | No network PASS claim inferred; source/API caller review remains the evidence for unchanged network contracts |
| UX5-POPULATED-STATE-001 | No safe mutation was authorized, so a populated cart/selected-asset state was not created for this visual-only control | Acceptance evidence | P3 | DOCUMENTED | Empty/read-only state was verified; no fixture checkout or business mutation performed |

# UX5C evidence limitations and deferred protections (2026-08-28)

| ID | Issue | Area | Severity | Status | Disposition |
|---|---|---|---|---|---|
| DARFUS-UX5C-NETWORK-OBSERVABILITY-001 | Connected browser surface does not provide detailed request interception | Acceptance evidence | P3 | DOCUMENTED | No detailed network PASS claimed; source/API and backend read-only evidence used |
| DARFUS-UX5C-DEFERRED-SIDEBAR-LIGHT-HEIGHT-001 | Light Mode Sidebar height | UX5C deferred issue | P2 | DEFERRED | Explicitly not touched in UX5C |
| DARFUS-UX5C-DEFERRED-VOUCHER-EMPTY-CART-STATE-001 | Gift Voucher state vs Empty Cart | UX5C deferred issue | P2 | DEFERRED | Explicitly not touched in UX5C |

# UX5D evidence note (2026-08-28)

| ID | Issue | Area | Severity | Status | Disposition |
|---|---|---|---|---|---|
| DARFUS-UX5D-SHARED-RUNTIME-CONCURRENCY-001 | Shared runtime showed an unrelated Receive/PO/Asset/Journal group during the visual-only window; no UX5D action initiated it | Acceptance evidence | P3 | DOCUMENTED | Preserve data, do not attribute to UX5D, and do not claim whole-runtime zero delta without an isolated baseline |

# GBW purchase-rate override reason (2026-08-28)

| ID | Issue | Area | Severity | Status | Disposition |
|---|---|---|---|---|---|
| DARFUS-GBW-RECEIVING-PURCHASE-GOLD-RATE-OVERRIDE-REASON-001 | Authorized non-equal GBW purchase-rate flow cannot provide mandatory reason from current UI | Supplier receiving / GBW | P1 | ROOT_CAUSE_PROVEN | No fix in forensic control; requires named Owner-authorized UI contract fix |
| DARFUS-GBW-RECEIVING-I18N-RAW-ERROR-001 | Raw backend English may surface in AR error display | UX/observability | P2 | DOCUMENTED | Track separately; no business logic change |
| DARFUS-GBW-RECEIVING-RAW-PAYLOAD-EVIDENCE-001 | Historical logs provide status/request ID but not original request body | Forensic evidence | P3 | BLOCKED | Do not claim exact raw-body capture; add safe telemetry only in an approved future control |

# UX5B populated POS evidence closeout (2026-08-28)

| ID | Issue | Area | Severity | Status | Disposition |
|---|---|---|---|---|---|
| DARFUS-UIUX-UX5B-POPULATED-DENSITY-EVIDENCE-001 | Populated cart density evidence was previously incomplete | Acceptance evidence | P3 | CLOSED | Isolated fixture evidence completed across required locale/theme/viewport states; no production source or business behavior changed |

# GBW purchase-rate override reason minimum-safe fix (2026-08-28)

| ID | Issue | Area | Severity | Status | Disposition |
|---|---|---|---|---|---|
| DARFUS-GBW-RECEIVING-PURCHASE-GOLD-RATE-OVERRIDE-REASON-001-FIX | Non-equal GBW rate can now be accompanied by the mandatory reason from the UI | Supplier receiving / GBW | P1 | FRONTEND_REMEDIATED; ACCEPTANCE_OPEN | Do not claim full closure until an Owner-authorized successful lower/higher acceptance is proven in a safe target |

# UX6 Inventory/Asset implementation (2026-08-28)

| ID | Issue | Area | Severity | Status | Disposition |
|---|---|---|---|---|---|
| DARFUS-UX6-INVENTORY-PRESENTATION-001 | Inventory list/detail readability and semantic density required scoped presentation correction | Inventory UX | P3 | CLOSED | Summary hierarchy, readable EN statuses, table semantics, numeric alignment, and detail typography were corrected without business/API/DB changes |

| DARFUS-ASSET-TAG-PREVIEW-DARK-MODE-CONTRAST-001 | Embedded Asset Tag Preview lost contrast in application Dark Mode | Inventory / Asset / Tag Preview | P2 | CLOSED | Inner face had transparent background and inherited light text; explicit print-safe face/container colors were added without changing data or print behavior |

| DARFUS-UX7-CUSTOMERS-SUPPLIERS-PRESENTATION-001 | Customer/Supplier master-data surfaces needed clearer scoped hierarchy and contact/identifier readability | Customers / Suppliers UX | P3 | CLOSED | Added UX7-scoped presentation classes only; source authorities, actions and values unchanged |
