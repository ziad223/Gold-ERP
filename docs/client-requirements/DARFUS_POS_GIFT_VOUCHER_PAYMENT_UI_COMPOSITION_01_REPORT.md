# DARFUS ERP — POS Gift Voucher Payment UI Composition Report

Control ID: `DARFUS-POS-GIFT-VOUCHER-PAYMENT-UI-COMPOSITION-01`

## ملخص المالك

المشكلة الأصلية كانت حصر Gift Voucher داخل Split وضعف شكل حقل الإدخال. السبب
المثبت هو شرط JSX الخاص بـ`method === "split"` مع حقل صغير داخل شبكة Split. تم
نقل العرض إلى مكوّن واحد مشترك خارج Split، مع الإبقاء على الحالة والتحقق
المعتمدين. لم يتغير Business Logic الخادمي أو Tax أو Accounting. Cash/Card/
Transfer/Split تعمل عبر عقد split الحالي، أما Installment/Deposit فالدعم
الخادمي غير موجود ولذلك يظهران Fail-Closed. نجح فحص AR/EN والكتابة والتركيز،
ولم تحدث أي كتابة في `darfus_erp`. توجد نقطة حجب واحدة لإغلاق كل التركيبات:
عدم دعم Voucher + Installment/Deposit في Payment Engine الحالي. الخطوة التالية
فقط: Owner review وتحديد ما إذا كان يلزم عقد خادمي منفصل؛ لا يبدأ تلقائيًا.

## Executive Summary

| Area | Result |
|---|---|
| Shared Voucher composition | Implemented for all visible payment modes |
| Canonical state/validator | One parent state and existing GET validator |
| Cash/Card/Transfer/Split | Enabled through existing canonical split settlement |
| Installment/Deposit | Visible but fail-closed; server combination unsupported |
| Business logic / tax / accounting | Unchanged |
| Focused tests | PASS (4 new + 6 affected tests) |
| Typecheck | PASS |
| Browser AR/EN | PASS for read-only UI state |
| Official DB | Zero delta; read-only queries only |
| Gate | `BLOCKED_POS_GIFT_VOUCHER_PAYMENT_UI_SERVER_CAPABILITY` |

## Owner UX Requirement

The component is now visible regardless of the selected primary method. It is a
settlement component, never a discount. A validated voucher's face value is
display-only; the user cannot edit the applied amount. Remaining due is derived
from the current invoice total minus the validated full face value.

## Read First

Read-first review covered the POS payment selector, Split block, Gift Voucher
GET validator, checkout payload, Installment and Deposit branches, input/button
tokens, Gift Voucher service, Sales payment resolver, current reports, and
registers. Official database identity and current counts were queried read-only.

## Current UI Forensic

Before the change, payment mode selection lived in the POS page and the Gift
Voucher code/validated state also lived in the parent, but the input and success
message were rendered only inside the `method === "split"` block. The code used
the existing `GET /gift-vouchers/:code` validator. Split payload construction
was the only place that emitted a `gift_voucher` leg. There was no second
validator, but the presentation was conditionally trapped and the old input used
`h-8` inside a constrained grid.

## Root Cause

`POS-GV-PAYMENT-MODE-VISIBILITY-001`: proven JSX composition defect: Voucher
markup was nested under `method === "split"`.

`POS-PAYMENT-UX-LAYOUT-001`: proven local layout defect: the code field used a
small `h-8` control in the Split grid, weakening hierarchy and focus clarity.

No backend defect was introduced or changed. The current backend contract
rejects Voucher legs unless the top-level payment method is `split`, and only
cash/card/transfer are canonical non-voucher legs. This is the reason
Installment/Deposit are not enabled falsely.

## Payment Mode Map

| Mode | UI result | Server mapping |
|---|---|---|
| Cash | Voucher section enabled | canonical `paymentMethod=split` with cash remainder + Voucher leg |
| Card | enabled | canonical split with card remainder + Voucher leg |
| Transfer | enabled | canonical split with transfer remainder + Voucher leg |
| Split | enabled | existing split allocations + Voucher leg |
| Installment | visible, input/button disabled with warning | unsupported by current Voucher contract; no Voucher payload emitted |
| Deposit | visible, fail-closed by checkout guard | reservation authority remains separate; no fake Voucher combination |

## Design Contract and Shared Component

Added `features/sales/components/GiftVoucherPaymentSection.tsx`. The parent
owns one `giftVoucherCode`, one validated `giftVoucher`, one loading/error state,
and the derived remaining due. The component owns only presentation and actions:
entry, Validate, loading, success summary, remove, and error display.

It uses the existing `input-base` focus token, practical responsive width,
`direction:ltr` for codes, AR/LTR container direction, disabled state for
unsupported combinations, and keyboard Enter handling. No new API or backend
authority was created.

## Payment State / Payload

For Cash/Card/Transfer with a validated voucher, the frontend adapts the request
to the already-supported canonical split representation. The selected ordinary
method receives `remainingAfterGiftVoucher`; the Voucher leg receives the full
server-provided face value. Split keeps its existing allocation inputs. The
invoice total, VAT, discount, revenue, Treasury, posting, and inventory rules
are untouched.

## Cash / Card / Transfer / Split

Static tests prove the supported-method mapping. Browser clicks on Cash, Card,
Transfer, and Split returned `data-gift-voucher-supported=true`. No checkout was
performed, so there is no new financial transaction to reconcile.

## Installment / Deposit

The current server-side `prepareGiftVoucherSettlement` rejects any Voucher leg
unless the top-level method is Split; its canonical non-voucher methods exclude
Installment and Deposit. The UI therefore keeps the shared section visible but
disables entry and shows a user-facing warning. `completeSale` also rejects a
validated Voucher with an unsupported method before the existing Deposit or
Installment mutation path can run.

This is a capability blocker for the full all-mode acceptance, not a reason to
weaken the server contract or invent a second payment engine.

## Voucher Input UX / Focus / AR / EN / Responsive

The input now has a stable label, full practical width, LTR-safe code direction,
visible focus ring, readable filled text, responsive column-to-row layout, and a
button that is full-width only at narrow widths. AR and EN browser proof passed.
The validated state is intentionally not exercised because the official DB has
zero Vouchers and this control forbids creating one.

## Focused Tests and Regression

`node --test tests/pos-gift-voucher-payment-ui-composition.test.cjs` — 4/4 PASS.

`node --test tests/pos-gift-voucher-payment-ui-composition.test.cjs tests/pos-journal-preview-p2.test.cjs tests/stage-c-pos-financial-integration.test.cjs` — 10/10 PASS.

`npm run typecheck` — PASS.

The existing POS journal, pricing authority, Customer lookup, Asset sale-price,
and Stage C contract tests passed. No unrelated full suite was run.

## Browser and Network

AR `/ar/pos` and EN `/en/pos` loaded in the existing authenticated Chrome tab.
Typed synthetic codes were local UI-only values; Validate was not clicked. The
backend log showed read-side GET/304 traffic and no business POST. Console logs
contained no application exception; existing HMR connection messages were
observed from the already-serving runtime.

## Official DB Safety

Read-only query returned `darfus_erp|postgres`. Counts remained unchanged:
`gift_vouchers=0`, `invoices=3`, `payments=3`, `cash_transactions=11`,
`journal_entries=29`, `journal_lines=81`, `inventory_asset_movements=70`,
`asset_events=74`, `audit_logs=189`, `idempotency_requests=105`.

`OFFICIAL_BUSINESS_DELTA = 0`

`OFFICIAL_FINANCIAL_DELTA = 0`

`OFFICIAL_INVENTORY_DELTA = 0`

## Files Changed

Current-control artifacts:

- `app/[locale]/(dashboard)/pos/page.tsx` — shared component placement, state composition, fail-closed guards, canonical split adapter.
- `features/sales/components/GiftVoucherPaymentSection.tsx` — new reusable UI component.
- `tests/pos-gift-voucher-payment-ui-composition.test.cjs` — focused static contract tests.
- seven POS Gift Voucher documentation artifacts and six existing registers.

The POS page already had unrelated/pre-existing worktree modifications before
this control. Its pre-change SHA-256 was recorded as
`243012DB7DB747703819D2F686C1BC892B66F6512972D8BE25945BDADE2126A3`; no cleanup,
reset, restore, stash, or broad reformat was performed.

## Registers

Registered:

- `POS-GV-PAYMENT-MODE-VISIBILITY-001` — resolved for supported modes; full all-mode closure blocked by server capability.
- `POS-PAYMENT-UX-LAYOUT-001` — resolved in AR/EN read-only browser proof.
- `POS-GV-ONE-CANONICAL-PAYMENT-COMPONENT-001` — prevention rule implemented and covered by focused tests.

The existing runtime-parity lesson `GV-L-005` remains preserved. No new backend,
tax, accounting, treasury, inventory, migration, or official acceptance retry
was started.

## Gate

The gate is blocked because the current server does not support Voucher combined
with Installment or Deposit, and this control explicitly forbids changing that
business contract. Supported-mode composition and UI safety are complete, but a
full `PASS_POS_GIFT_VOUCHER_PAYMENT_UI_COMPOSITION` would overstate capability.

`CURRENT_CONTROL_P0 = 0`

`CURRENT_CONTROL_P1 = 0`

`P2 = 2` (visibility/composition and payment-panel UX findings; resolved for
supported modes, with the capability limitation recorded).

`P3 = 0`

## Final Tokens

```text
CURRENT_CONTROL = DARFUS-POS-GIFT-VOUCHER-PAYMENT-UI-COMPOSITION-01
MODE = READ_FIRST_PLUS_MINIMUM_SAFE_FRONTEND_COMPOSITION_CHANGE
READ_FIRST = YES
CURRENT_PAYMENT_UI_FORENSIC = COMPLETE
PAYMENT_MODE_SOURCE_MAP = COMPLETE
POS_GV_PAYMENT_MODE_VISIBILITY_001 = RESOLVED_FOR_SUPPORTED_MODES_BLOCKED_FULL_ALL_MODE_CAPABILITY
POS_PAYMENT_UX_LAYOUT_001 = RESOLVED_AR_EN
POS_GV_ONE_CANONICAL_PAYMENT_COMPONENT_001 = IMPLEMENTED_AND_TESTED
BUSINESS_LOGIC_CHANGED = NO
GIFT_VOUCHER_UI_ROLE = PAYMENT_SETTLEMENT_COMPONENT
GIFT_VOUCHER_UI_ROLE_DISCOUNT = NO
ONE_CANONICAL_GIFT_VOUCHER_PAYMENT_COMPONENT = YES
VOUCHER_VALIDATION_API_COUNT = UNCHANGED
SERVER_FINAL_AUTHORITY = YES
VOUCHER_APPLIED_AMOUNT_EDITABLE = NO
CASH_VOUCHER_UI = PASS
CARD_VOUCHER_UI = PASS
TRANSFER_VOUCHER_UI = PASS
INSTALLMENT_COMBINATION_SERVER_SUPPORT = NO_PROVEN_BY_CURRENT_CONTRACT
INSTALLMENT_VOUCHER_UI = FAIL_CLOSED_PASS
DEPOSIT_COMBINATION_SERVER_SUPPORT = NO_PROVEN_BY_CURRENT_CONTRACT
DEPOSIT_VOUCHER_UI = FAIL_CLOSED_PASS
SPLIT_VOUCHER_UI = PASS
VOUCHER_INPUT_NOT_COLLAPSED = YES
FOCUS_STATE_VISIBLE = YES
TYPED_VOUCHER_TEXT_VISIBLE = YES
PAYMENT_HIERARCHY_CLEAR = YES
AR_BROWSER_UI = PASS
EN_BROWSER_UI = PASS
NARROW_LAYOUT = SOURCE_PASS_BROWSER_NOT_SEPARATELY_RESIZED
BROWSER_BUSINESS_MUTATIONS = 0
OFFICIAL_BUSINESS_DELTA = 0
OFFICIAL_FINANCIAL_DELTA = 0
OFFICIAL_INVENTORY_DELTA = 0
OFFICIAL_FINANCIAL_RETRY = NOT_AUTHORIZED_THIS_CONTROL
FOCUSED_TESTS = PASS
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
P2 = 2
P3 = 0
GATE = BLOCKED_POS_GIFT_VOUCHER_PAYMENT_UI_SERVER_CAPABILITY
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_OF_INSTALLMENT_AND_DEPOSIT_VOUCHER_CAPABILITY; NO_AUTOMATIC_BACKEND_CHANGE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Next Step

Owner review only. Do not issue, activate, redeem, checkout, print, retry the
official Gift Voucher acceptance, or start a backend capability batch from this
control.

STOP.

