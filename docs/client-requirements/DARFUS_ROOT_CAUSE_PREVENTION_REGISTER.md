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
