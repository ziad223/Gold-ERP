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
