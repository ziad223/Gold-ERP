# DARFUS Issue / Blocker Register — Gift Voucher 01

| ID | Issue | Classification | Severity | Blocks this batch? | Disposition |
|---|---|---|---|---|---|
| GV-I-001 | Pearl profile master data has invalid/missing markup percent for one asset | MISSING_MASTER_DATA / CONFIG; NOT_A_GIFT_VOUCHER_DEFECT | P2 | No; fixture excluded safely | Owner review in Pearl track; no Pearl data, pricing logic, default, or hardcoded markup change |
| GV-I-002 | Official promotion not authorized | GOVERNANCE | P1 for promotion only | No for this completed schema-promotion control; yes for business acceptance | AUTHORIZED_AND_PROMOTED for the named Gift Voucher schema migration only; business issuance/redemption/checkout remains unauthorized |

No P0 or P1 defect was introduced in the Gift Voucher implementation itself. GV-I-001 remains a separate Pearl configuration issue.

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
