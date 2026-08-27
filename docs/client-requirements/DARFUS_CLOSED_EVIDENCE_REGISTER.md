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
