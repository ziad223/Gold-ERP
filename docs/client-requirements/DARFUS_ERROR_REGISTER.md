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
