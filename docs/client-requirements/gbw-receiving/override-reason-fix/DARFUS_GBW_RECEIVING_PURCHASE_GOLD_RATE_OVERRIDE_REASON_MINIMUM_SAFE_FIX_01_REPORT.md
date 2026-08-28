# GBW purchase gold-rate override reason — minimum safe fix report

ما الذي تم تعديله؟ تمت إضافة حقل سبب تعديل السعر داخل صفحة GBW فقط، مع حالة محلية، إظهار مشروط، تحقق محلي، وربط بمفتاح Backend الحالي.  
هل Backend تغير؟ لا.  
هل Gold Rate authority تغيرت؟ لا.  
هل `inventory.adjust` تغير؟ لا.  
هل DB schema تغير؟ لا.  
هل Equal rate ما زال يعمل؟ نعم؛ الحقل لا يظهر ولا يصبح مطلوبًا.  
هل Lower rate يعرض Reason؟ نعم، مثبت في EN/AR browser.  
هل Higher rate يعرض Reason؟ نعم، مثبت في EN browser والمصدر.  
هل Blank Reason يُرفض؟ نعم، guard محلي وBackend 422 محفوظان.  
هل Valid Reason يصل للBackend؟ نعم، عبر `piece.purchaseRateOverrideReason` الموجود أصلًا؛ لم يتم تنفيذ Receive.  
هل AR/EN سليمة؟ نعم للـcontrol المضاف.  
هل Mobile/Tablet/Desktop سليمة؟ نعم في DOM responsive proof.  
هل main DB تم تنفيذ Receive تجريبي عليها؟ لا.  
هل Accounting/Inventory/Idempotency تغيرت؟ لا.  
هل Rollback جاهز؟ نعم، hash parity على نسخة معزولة.  
Gate: `BLOCKED_DARFUS_GBW_PURCHASE_GOLD_RATE_OVERRIDE_REASON_FULL_ACCEPTANCE_INCOMPLETE`؛ minimum frontend fix وproof UI/test مكتملان، لكن full successful lower/higher override acceptance لم يُنفذ.  
الخطوة التالية فقط: Owner review؛ لا تبدأ أي batch تلقائي.

## 1. Executive Summary

The previously proven root cause was corrected minimally in `app/[locale]/(dashboard)/inventory/gold-by-weight/page.tsx`. The UI now exposes a real reason field only when the entered purchase rate is non-equal to the frontend-known reference, uses the existing backend reason key, and blocks blank submission locally. The backend remains the final authority.

No official business mutation occurred. `darfus_erp` was inspected read-only; no final Receive was sent. A successful lower/higher override acceptance was intentionally not run because it would create business data and this control did not authorize an official Receive.

## 2. Scope / Frozen Boundaries

The change is UI contract-only. Gold Center, rate source, Decimal comparison, permission, backend validation, endpoint, tax, accounting, inventory, idempotency, company/branch, and DB schema are unchanged.

## 3. Read First and baseline

Read-first was complete. Branch `main`; HEAD `1657b0e9ba580faef69be48f04637835c201b521`. The worktree was already dirty with 131 tracked modified entries and 870 untracked entries; no cleanup was performed. Official DB `current_database() = darfus_erp`. Health endpoints returned 200 for backend, DB, and Redis; frontend route returned 200.

Read-only counts at inspection: assets 21, purchase orders 17, PO items 17, purchase-cost revisions 21, current valuations 17, movements 77, journal entries 40, journal lines 121, idempotency requests 123, audit logs 215. `supplier_purchase_rate.override` audit rows: 0.

## 4. Before Evidence

Before snapshot and hash are in `PRE_GBW_OVERRIDE_REASON_FIX_20260828T100648Z`. The prior page had editable rate input but no reason state/field/payload key. The initial browser page confirmed that absence. The backend still used exact Decimal inequality, `inventory.adjust`, and nonblank reason.

## 5. Change Map / Frontend State

The Draft now has `purchaseGoldRateOverrideReason`, initialized empty. `purchaseRateOverrideActive` uses the existing decimal helper for presentation only and compares the entered value against `preview.gold.currentRate`. It is true for both lower and higher values, false for equal values. Clear restores the initial draft.

## 6. Visibility / Payload / Permission

The native textarea is rendered only while override is active, marked required, labelled in AR/EN, and described by localized help. The final piece maps the trimmed value to `purchaseRateOverrideReason`; equal-rate payloads omit it. The server still checks `inventory.adjust` and validates the reason. No endpoint or DTO changed.

## 7. Equal / Lower / Higher

| Case | Result |
|---|---|
| Equal | Field hidden; no reason required; existing flow preserved. |
| Lower | Field shown and required; blank is blocked locally and by backend if bypassed. |
| Higher | Field shown and required; same server contract as lower. |

No tolerance or automatic reason was introduced.

## 8. AR/EN, error, responsive, accessibility

EN lower/equal/higher and AR lower were exercised in the existing authenticated browser. Tablet width 768 and mobile width 390 showed the AR control without horizontal-overflow evidence; viewport was reset. Known backend English reason error is mapped to the scoped Arabic message; other errors retain existing handling. Native label/textarea, `required`, `aria-describedby`, keyboard, touch, and focus styling are preserved.

## 9. Focused and regression tests

Focused frontend: 8/8. GBW/profile/tax/closure regressions: 7/7, 4/4, 6/6, and 7/7. Asset: 9/9; Barcode: 11/11; unified inventory UX: 8/8; idempotency/tax regression: 5/5. `npm run typecheck` passed. `npm run build` passed and generated no `next-env.d.ts` drift.

## 10. Real Browser / isolated acceptance

No Receive button was pressed and no `/purchase-orders/receive` request was sent by this control. Preview POSTs were allowed as non-mutating UI previews. Successful valid-reason business acceptance remains a separate isolated acceptance item, not a failed claim.

## 11. Accounting / inventory / idempotency

No accounting/inventory/idempotency logic changed. Existing tests preserve Asset/Barcode/movement/tax/journal/idempotency authorities. Official DB synthetic receives and control-owned business/financial/inventory writes are all zero.

## 12. Snapshots, ledger, rollback

After snapshot: `backups/gbw/GBW_OVERRIDE_REASON_FIX_20260828T101352Z/`. Before page hash matched `9EF70D...C31A352`; after page hash is `1A1552...A33F5FB`; focused test hash is `1D1B...A6E0A`. Isolated rollback restored the exact before hash and re-applied the exact after hash. The six registers were updated documentation-only; the issue is not marked closed because full successful override acceptance was not performed.

## 12A. Files changed by this control

| Category | File(s) | Result |
|---|---|---|
| Product source | `app/[locale]/(dashboard)/inventory/gold-by-weight/page.tsx` | One scoped frontend contract change; this path was already part of the pre-existing dirty worktree |
| Focused test | `tests/gbw-override-reason-fix.test.cjs` | One new focused regression test file |
| Documentation/evidence | `docs/client-requirements/gbw-receiving/override-reason-fix/*`, six registers, `backups/gbw/*` | Evidence and audit records only |
| Backend/API/DB/config/migrations | None | Unchanged; no migration created or executed |

## 13. Final Tokens

`CURRENT_CONTROL = DARFUS-GBW-RECEIVING-PURCHASE-GOLD-RATE-OVERRIDE-REASON-MINIMUM-SAFE-FIX-01`  
`ISSUE_ID = DARFUS-GBW-RECEIVING-PURCHASE-GOLD-RATE-OVERRIDE-REASON-001`  
`MODE = MINIMUM_SAFE_FRONTEND_CONTRACT_FIX`  
`EXECUTE_THIS_CONTROL = YES`  
`READ_FIRST = YES`  
`PRE_FIX_GIT_STATE_CAPTURED = YES`  
`MAIN_DB_IDENTITY_VERIFIED = YES`  
`FORENSIC_CONTRACT_STILL_VALID = YES`  
`FRONTEND_CHANGE_SCOPE_MINIMAL = YES`  
`BEFORE_SNAPSHOT = PASS`  
`BEFORE_HASH_MANIFEST = PASS`  
`BEFORE_BROWSER_EVIDENCE = PASS`  
`OVERRIDE_REASON_FIELD_ADDED = YES`  
`LOWER_RATE_REASON_VISIBLE = YES`  
`HIGHER_RATE_REASON_VISIBLE = YES`  
`EQUAL_RATE_REASON_NOT_REQUIRED = YES`  
`FRONTEND_COMPARISON_IS_PRESENTATION_ONLY = YES`  
`BACKEND_FINAL_AUTHORITY = YES`  
`REASON_STATE_SCOPED_TO_RECEIVING_DRAFT = YES`  
`CLIENT_REASON_REQUIRED_WHEN_OVERRIDE = YES`  
`BACKEND_REASON_VALIDATION_PRESERVED = YES`  
`REASON_PAYLOAD_MAPPING = PASS`  
`BACKEND_API_CONTRACT_CHANGED = NO`  
`INVENTORY_ADJUST_PERMISSION_CHANGED = NO`  
`EQUAL_RATE_WORKFLOW_PRESERVED = YES`  
`LOWER_RATE_WORKFLOW = PASS`  
`HIGHER_RATE_WORKFLOW = PASS`  
`AR_OVERRIDE_REASON_UI = PASS`  
`EN_OVERRIDE_REASON_UI = PASS`  
`RAW_BACKEND_ERROR_I18N = FIXED_SCOPED`  
`RESPONSIVE_OVERRIDE_REASON_UI = PASS`  
`ACCESSIBILITY = PASS`  
`FOCUSED_FRONTEND_TESTS = PASS`  
`BACKEND_OVERRIDE_REGRESSION = PASS`  
`INVENTORY_REGRESSION = PASS`  
`ACCOUNTING_REGRESSION = PASS`  
`IDEMPOTENCY_REGRESSION = PASS`  
`TYPECHECK = PASS`  
`BUILD = PASS`  
`REAL_BROWSER_UI_PROOF = PASS`  
`OVERRIDE_ACCEPTANCE_ENVIRONMENT = AUTOMATED_ISOLATED_NOT_REQUIRED_FOR_UI_ONLY_PROOF`  
`OVERRIDE_ACCEPTANCE = PARTIAL_UI_ONLY`  
`OVERRIDE_AUDIT_EVIDENCE = PASS_OR_DOCUMENTED_NOT_EXPOSED`  
`MAIN_DB_SYNTHETIC_RECEIVES = 0`  
`MAIN_DB_CONTROL_OWNED_BUSINESS_WRITES = 0`  
`MAIN_DB_CONTROL_OWNED_FINANCIAL_WRITES = 0`  
`MAIN_DB_CONTROL_OWNED_INVENTORY_WRITES = 0`  
`BACKEND_OVERRIDE_POLICY_CHANGED = NO`  
`REFERENCE_RATE_AUTHORITY_CHANGED = NO`  
`PERMISSION_POLICY_CHANGED = NO`  
`ACCOUNTING_LOGIC_CHANGED = NO`  
`INVENTORY_LOGIC_CHANGED = NO`  
`DB_SCHEMA_CHANGED = NO`  
`MIGRATIONS = 0`  
`AFTER_SNAPSHOT = PASS`  
`CHANGE_LEDGER_UPDATED = YES`  
`ROLLBACK_REHEARSAL = PASS`  
`BEFORE_HASH_RESTORE_PARITY = PASS`  
`AFTER_HASH_REAPPLY_PARITY = PASS`  
`P0 = 0`  
`P1 = 0`  
`P2 = 0`  
`P3 = 0`  
`PRODUCT_SOURCE_FILES_CHANGED_BY_CONTROL = 1`  
`TEST_FILES_CHANGED_BY_CONTROL = 1`  
`TOTAL_FOCUSED_AND_REGRESSION_TESTS = 65/65`  
`GATE = BLOCKED_DARFUS_GBW_PURCHASE_GOLD_RATE_OVERRIDE_REASON_FULL_ACCEPTANCE_INCOMPLETE`  
`ISSUE_STATUS = IMPLEMENTED_AWAITING_FULL_ISOLATED_ACCEPTANCE`  
`NEXT_RECOMMENDED_STEP = OWNER_REVIEW_ONLY; AUTHORIZE_ISOLATED_SUCCESSFUL_LOWER_HIGHER_ACCEPTANCE_IF_REQUIRED`  
`NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`

## STOP

No official Receive, migration, seed, backend policy change, DB schema change, or next batch was started. STOP.
