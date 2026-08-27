# DARFUS ERP — POS Gift Voucher Visual UX Correction Report

Control: `DARFUS-POS-GIFT-VOUCHER-VISUAL-UX-CORRECTION-01`

## ملخص المالك

المشكلة البصرية كانت انكماش حقل Gift Voucher وتداخل ترتيب الحقل والزر في RTL.
السبب المثبت تعارض `w-full`/`flex-1` مع زر واسع داخل Flex. تم إصلاح القسم
محليًا باستخدام Flex متجاوب وزر بعرض عملي ثابت، دون تغيير Business Logic أو
Backend أو Tax أو Accounting. نجح الفحص البصري desktop في AR وEN، ونجحت حالات
Installment/Deposit المعطلة. لم تحدث أي كتابة في قاعدة البيانات. لا يمكن إغلاق
الـGate لأن أداة المتصفح الحالية لا تسمح بفحص narrow viewport حقيقي؛ لا يوجد
ادعاء PASS لهذا الجزء. الخطوة التالية فقط Owner review ثم اختبار narrow منفصل.

## Executive Summary

| Item | Result |
|---|---|
| Root cause | Proven local flex width competition |
| UI correction | Implemented in shared Gift Voucher component |
| Business/backend logic | Unchanged |
| AR desktop | PASS |
| EN desktop | PASS |
| Installment/Deposit | Visible and clearly disabled |
| Narrow viewport | BLOCKED — browser resize unavailable |
| Focus/typed text | PASS desktop |
| Official DB | Zero delta |
| Gate | `BLOCKED_POS_GIFT_VOUCHER_VISUAL_UX_NARROW_EVIDENCE_INCOMPLETE` |

## Owner Decision

Cash/Card/Transfer/Split remain supported. Installment/Deposit remain visible
but unavailable, exactly as the frozen Owner decision requires. No new server
capability was added.

## Read First / Before Screenshot

Reviewed `AGENTS.md`, `PROJECT_PROGRESS_HANDOFF.md`, the POS page, shared
Gift Voucher component, Button/input tokens, prior UI reports, and six
registers. A pre-fix real-browser screenshot was compared with post-fix AR/EN
screenshots.

## Visual Forensic / Root Cause

The pre-fix input collapsed because the flex row combined a global
`input-base w-full`, `flex-1`, and an action rendered at full width. In the
payment card, flex shrink resolved this by leaving the input nearly zero-width.
This was reproduced visually and corrected locally; it was not a backend or
payment-contract defect.

## Design and Files Changed

Changed:

- `features/sales/components/GiftVoucherPaymentSection.tsx` — local layout only.
- `tests/pos-gift-voucher-visual-ux-correction.test.cjs` — focused visual contract checks.
- the eight visual artifacts and six required registers.

The POS page itself was not changed in this visual-only control. Existing
pre-control POS worktree drift remains untouched.

## Input / Focus / Button

The input now uses `min-w-0 w-full flex-1`; the action uses `max-content`, a
7rem minimum, and 100% maximum width. The component retains `[direction:ltr]`,
`input-base` focus tokens, explicit label, keyboard Enter handling, disabled
state, and `role=alert` error association. Desktop screenshots show no overlap,
clipping, or hidden typed text.

## Disabled Installment / Deposit

The shared section remains visible. Both controls are disabled and the message
explains the method limitation. `completeSale` retains the server-capability
guard; no fake split or payment-engine change was introduced.

## RTL / LTR / Desktop / Narrow

AR and EN desktop visual reviews passed. The code input remains LTR-safe in AR.
The responsive source contract is present, but the browser tool cannot resize or
emulate a narrow viewport, so `NARROW_VISUAL_ACCEPTANCE` is blocked rather than
inferred.

## Screenshot Review

Captured after-fix screenshots for AR supported/typed, AR Installment, AR
Deposit, EN supported/typed, and EN Installment/Deposit. Review result for those
screenshots: overlap NO, clipping NO, typed text visible YES, focus obvious YES
where focused, labels readable YES, button alignment PASS, hierarchy PASS.
Validated state was not captured because the official DB has zero Voucher rows.
Final desktop artifacts: `DARFUS_POS_GIFT_VOUCHER_VISUAL_AR_DESKTOP.png` and
`DARFUS_POS_GIFT_VOUCHER_VISUAL_EN_DESKTOP.png`.

## Focused Tests / Regression / Typecheck

`node --test tests/pos-gift-voucher-payment-ui-composition.test.cjs tests/pos-gift-voucher-visual-ux-correction.test.cjs tests/pos-journal-preview-p2.test.cjs tests/stage-c-pos-financial-integration.test.cjs` — 13/13 PASS.

`npm run typecheck` — PASS.

## Runtime / Network / DB Safety

The existing authenticated runtime at localhost:3000 reflected the corrected
component after its current serving refresh. No new frontend instance, build,
backend restart, or official financial retry was performed. Backend logs showed
read-only GET/304 calls and no business POST. Official DB identity was
`darfus_erp|postgres`; required counts remained unchanged.

## Registers

Registered/reused:

- `POS-GV-INPUT-VISIBILITY-LAYOUT-002` — corrected for desktop AR/EN; narrow evidence pending.
- `POS-VISUAL-BROWSER-ACCEPTANCE-001` — prevention rule applied; screenshot + viewport review now required.
- `POS-GV-INSTALLMENT-DEPOSIT-VISIBILITY-001` — visible fail-closed UX proven.

Previous functional PASS remains historical functional evidence; this control
records the separate visual defect and its correction.

## Gate

`CURRENT_CONTROL_P0 = 0`

`CURRENT_CONTROL_P1 = 0`

`P2 = 1` — narrow viewport visual evidence is unavailable in the current browser
control surface; this is an acceptance blocker, not a proven product failure.

`P3 = 0`

```text
CURRENT_CONTROL = DARFUS-POS-GIFT-VOUCHER-VISUAL-UX-CORRECTION-01
MODE = READ_FIRST_PLUS_VISUAL_UX_CORRECTION_ONLY
READ_FIRST = YES
CURRENT_VISUAL_FORENSIC = COMPLETE
VISUAL_ROOT_CAUSE_PROVEN = YES
POS_GV_INPUT_VISIBILITY_LAYOUT_002 = RESOLVED_DESKTOP_AR_EN_NARROW_PENDING
POS_VISUAL_BROWSER_ACCEPTANCE_001 = REGISTERED_AND_APPLIED_NARROW_REQUIRED
POS_GV_INSTALLMENT_DEPOSIT_VISIBILITY_001 = PASS_VISIBLE_FAIL_CLOSED_AR_EN
BUSINESS_LOGIC_CHANGED = NO
BACKEND_CHANGED = NO
UX_SCOPE = GIFT_VOUCHER_PAYMENT_SECTION_AND_IMMEDIATE_PAYMENT_PANEL_ALIGNMENT_ONLY
INPUT_MIN_USABLE_WIDTH = YES_DESKTOP_SOURCE_RESPONSIVE
VOUCHER_CODE_LTR_SAFE = YES
FOCUS_STATE_VISUALLY_OBVIOUS = YES_DESKTOP
TYPED_TEXT_VISIBILITY = PASS_DESKTOP_AR_EN
INSTALLMENT_DISABLED_STATE_CLEAR = YES
DEPOSIT_DISABLED_STATE_CLEAR = YES
ERROR_STATE_VISUAL = SOURCE_PASS_NO_OFFICIAL_VALIDATE
SECTION_VISUAL_HIERARCHY = PASS_DESKTOP_AR_EN
VALIDATE_BUTTON_LAYOUT = PASS_DESKTOP_AR_EN
AR_VISUAL_ACCEPTANCE = PASS_DESKTOP
EN_VISUAL_ACCEPTANCE = PASS_DESKTOP
DESKTOP_VISUAL_ACCEPTANCE = PASS
NARROW_VISUAL_ACCEPTANCE = BLOCKED_BROWSER_VIEWPORT_UNAVAILABLE
SCREENSHOT_REVIEW_COMPLETE = YES_FOR_AR_EN_DESKTOP_AND_DISABLED_STATES
VISUAL_BROWSER_ACCEPTANCE_GATE = BLOCKED_NARROW_EVIDENCE_INCOMPLETE
FRONTEND_RUNTIME_PARITY = PASS_OBSERVED_CORRECTED_SERVING_RUNTIME
OFFICIAL_VOUCHER_VALIDATE_REQUESTS = 0
BROWSER_BUSINESS_MUTATIONS = 0
OFFICIAL_BUSINESS_DELTA = 0
OFFICIAL_FINANCIAL_DELTA = 0
OFFICIAL_INVENTORY_DELTA = 0
OFFICIAL_GIFT_VOUCHER_ACCEPTANCE_RETRY = NOT_AUTHORIZED_THIS_CONTROL
FOCUSED_TESTS = PASS_13_OF_13
AFFECTED_REGRESSION = PASS
TYPECHECK = PASS
SUCCESS_REGISTER_UPDATED = YES
ERROR_REGISTER_UPDATED = YES
ISSUE_BLOCKER_REGISTER_UPDATED = YES
ROOT_CAUSE_PREVENTION_REGISTER_UPDATED = YES
OWNER_DECISION_REGISTER_UPDATED = YES
CLOSED_EVIDENCE_REGISTER_UPDATED = YES
CURRENT_CONTROL_P0 = 0
CURRENT_CONTROL_P1 = 0
P2 = 1
P3 = 0
GATE = BLOCKED_POS_GIFT_VOUCHER_VISUAL_UX_NARROW_EVIDENCE_INCOMPLETE
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_THEN_REAL_NARROW_VIEWPORT_VISUAL_ACCEPTANCE_ONLY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Next Step

Owner review only. Perform no Voucher issue, validation, checkout, payment,
print, backend change, or DB mutation. STOP.
