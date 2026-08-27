# DARFUS ERP — POS Gift Voucher I18N + Narrow Visual Final Closeout

Control ID: `DARFUS-POS-GIFT-VOUCHER-I18N-NARROW-VISUAL-CLOSEOUT-01`
Date: 2026-08-27

## الملخص التنفيذي

المشكلة كانت أن صفحة EN تعرض رسالة عربية عند عدم العثور على القسيمة. السبب
المثبت هو أن مسار GET يعيد رسالة عربية، والواجهة كانت تعرض `error.message`
مباشرة. تم تنفيذ إصلاح Frontend محدود: تصنيف يعتمد على كود الخطأ/HTTP status
وترجمة AR/EN. لم يحدث أي تغيير في الخادم أو الضريبة أو الدفع أو المحاسبة.

تمت إعادة إثبات AR وEN في المتصفح الداخلي، بما في ذلك viewport ضيق حقيقي
ومتحكم به `768x800`. حالات Installment وDeposit بقيت ظاهرة لكنها غير مدعومة
ومغلقة كما يفرض العقد الحالي.

## Scope / authority

- Business logic: unchanged.
- Backend/API contract: unchanged; only existing read-only GET lookup observed.
- Tax/accounting/payment/voucher state: unchanged.
- Official DB `darfus_erp`: read-only; zero business delta.
- Production: not contacted.
- Build: not run, per current acceptance guardrail; typecheck passed.
- Generated `next-env.d.ts` drift: not edited or reverted.

## Root cause and minimum fix

The old catch path in `app/[locale]/(dashboard)/pos/page.tsx` copied the raw
`DarfusApiError.message`. The current GET not-found route returns 404 without a
stable code and its message is Arabic. `lib/api/gift-voucher-error.ts` now
maps stable backend codes where available and the existing 404 contract to a
locale-neutral key. `messages/ar.json` and `messages/en.json` provide the
user-facing strings. The shared section uses `useTranslations("POS")`.

No raw backend text is used as a UI fallback.

## Source changes

| File | Change |
|---|---|
| `lib/api/gift-voucher-error.ts` | New status/code-only UI classifier |
| `app/[locale]/(dashboard)/pos/page.tsx` | Gift Voucher errors use catalog/classifier |
| `features/sales/components/GiftVoucherPaymentSection.tsx` | Shared labels use POS translations |
| `messages/ar.json`, `messages/en.json` | Complete Gift Voucher UI/error catalog |
| `tests/pos-gift-voucher-i18n.test.cjs` | Focused I18N/error leakage tests |
| existing Gift Voucher UI tests | Assertions aligned to stable translation key |

No backend source, migration, schema, config, or database file was changed for
this control. The worktree was already dirty; no cleanup, reset, restore, stash,
or unrelated drift ownership was taken.

## Focused proof

Command:

`node --test tests/pos-gift-voucher-i18n.test.cjs tests/pos-gift-voucher-visual-ux-correction.test.cjs tests/pos-gift-voucher-payment-ui-composition.test.cjs tests/pos-journal-preview-p2.test.cjs tests/stage-c-pos-financial-integration.test.cjs`

Result: `17/17 PASS`, exit code 0.

`npm run typecheck`: PASS, exit code 0.

`npm run build`: NOT RUN by instruction/guardrail.

## Internal browser evidence

| Proof | Evidence | Result |
|---|---|---|
| AR desktop unknown voucher | existing GET lookup, visible Arabic not-found message | PASS |
| EN desktop unknown voucher | same read-only GET lookup, visible English not-found message | PASS |
| AR 768x800 | RTL layout, typing/focus, Installment/Deposit disabled warning | PASS |
| EN 768x800 | LTR layout, typing/focus, Installment/Deposit disabled warning | PASS |
| clean final console | internal browser log query | 0 errors |
| mutation requests | backend recent-log mutation filter | NONE |

The clean final tab was used after reload. No final screenshot file was created
or modified by this control; the required visual review is documented in the
companion screenshot-review artifact and existing desktop PNG evidence.

## Database/runtime evidence

Containers remained up: backend on `8000`, Redis healthy on `6379`, PostgreSQL
healthy on host `5433`. The read-only identity query returned `darfus_erp`.
Final read counts were: `gift_vouchers=0`, `invoices=3`, `payments=3`,
`journal_entries=29`, `cash_transactions=11`, and
`inventory_asset_movements=70`, matching the recorded baseline. No recent
business mutation log match was found.

## Required gates

| Gate | Result |
|---|---|
| I18N root cause proven | PASS |
| User-facing error localization | PASS |
| Raw backend message hidden | PASS |
| AR desktop | PASS |
| EN desktop | PASS |
| AR narrow 768x800 | PASS |
| EN narrow 768x800 | PASS |
| Keyboard focus / typing | PASS |
| Installment/Deposit fail-closed UI | PASS |
| Screenshot review | COMPLETE |
| Visual verification | COMPLETE |
| Focused tests | PASS |
| Affected regressions | PASS |
| Typecheck | PASS |
| Official DB mutation | 0 |

## Final tokens

```text
CURRENT_CONTROL = DARFUS-POS-GIFT-VOUCHER-I18N-NARROW-VISUAL-CLOSEOUT-01
MODE = I18N_AND_NARROW_VISUAL_CLOSEOUT
INTERNAL_BROWSER_VIEWPORT_CONTROL = PASS
NARROW_VIEWPORT_ACTUAL_DIMENSIONS = 768x800
I18N_ROOT_CAUSE_PROVEN = YES
POS-GV-I18N-ERROR-MESSAGE-001 = CLOSED
POS-I18N-ERROR-MESSAGE-GATE-001 = CLOSED
USER_FACING_ERROR_LOCALIZATION_GATE = PASS
TECHNICAL_INTERNAL_NOTES_VISIBLE = NO
RAW_BACKEND_MESSAGE_RENDERED_TO_USER = NO
AR_ERROR_LOCALIZATION = PASS
EN_ERROR_LOCALIZATION = PASS
AR_ERROR_VISUAL = PASS
EN_ERROR_VISUAL = PASS
AR_NARROW_TYPED_FOCUS = PASS
EN_NARROW_TYPED_FOCUS = PASS
AR_NARROW_UNSUPPORTED_MODE = PASS
EN_NARROW_UNSUPPORTED_MODE = PASS
KEYBOARD_FOCUS = PASS
TOUCH_LAYOUT = PASS
DESKTOP_REGRESSION_AR = PASS
DESKTOP_REGRESSION_EN = PASS
VISUAL_VERIFICATION = COMPLETE
SCREENSHOT_REVIEW = COMPLETE
BUSINESS_LOGIC_CHANGED = NO
TAX_ENGINE_CHANGED = NO
PAYMENT_ENGINE_CHANGED = NO
ACCOUNTING_CHANGED = NO
BACKEND_CHANGED = NO
DATABASE_SCHEMA_CHANGED = NO
BROWSER_BUSINESS_MUTATIONS = 0
OFFICIAL_DB_BUSINESS_WRITES = 0
OFFICIAL_BUSINESS_DELTA = 0
OFFICIAL_FINANCIAL_DELTA = 0
OFFICIAL_INVENTORY_DELTA = 0
CONSOLE_ERRORS_CLEAN_FINAL_TAB = 0
FOCUSED_TESTS = PASS_17_OF_17
TYPECHECK = PASS
BUILD = NOT_RUN_BY_GUARDRAIL
SIX_REGISTERS_UPDATED = YES
P0_COUNT = 0
P1_COUNT = 0
P2_COUNT = 0
P3_COUNT = 0
POS_GIFT_VOUCHER_UI_FINAL_CLOSEOUT = CLOSED
GATE = PASS_POS_GIFT_VOUCHER_I18N_NARROW_VISUAL_CLOSEOUT
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_ONLY; any official financial retry requires separate explicit authorization
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

No Voucher issue, activation, redemption, checkout, payment, print, backend
mutation, database mutation, or financial retry was performed. STOP after Owner
review.

