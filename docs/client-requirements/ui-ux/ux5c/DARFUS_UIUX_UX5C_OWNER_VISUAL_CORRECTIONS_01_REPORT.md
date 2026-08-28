# DARFUS ERP — UX5C Owner Visual Corrections Report

تم تنفيذ التصحيحات البصرية الثمانية المعتمدة في POS فقط. نجحت الاختبارات المركزة
والانحدار و`typecheck` و`build` وفحص المتصفح AR/EN في Dark/Light وعلى
Desktop/Tablet/Mobile. لم تتغير Business Logic أو API أو قاعدة البيانات أو
Payment/Checkout/Gift Voucher أو Sidebar المؤجل.

## 1. Control and Gate

| Field | Result |
|---|---|
| Control | `DARFUS-UIUX-UX5C-OWNER-VISUAL-CORRECTIONS-01` |
| Adopted file | `C:\\Users\\NEGM\\Desktop\\DARFUS_UIUX_UX5C_OWNER_VISUAL_CORRECTIONS_01.md` |
| Mode | `OWNER_VISUAL_CORRECTION_ONLY_WITH_DEFERRED_ISSUES_FROZEN` |
| Scope | POS presentation only |
| Gate | `PASS_DARFUS_UIUX_UX5C_OWNER_VISUAL_CORRECTIONS` |

## 2. Deferred Issues Freeze

| Issue | Result |
|---|---|
| Light Mode Sidebar height | Deferred; untouched |
| Gift Voucher state vs Empty Cart | Deferred; untouched |
| `GiftVoucherPaymentSection.tsx` | Unchanged; SHA preserved |

## 3. Read-First and Safety

UX5C was read completely: 858 lines / 17,642 bytes. Project instructions,
handoff, UX-2/UX-3/UX-4/UX-4C evidence, registers, UX5 report, current POS
source, `DataToolbar`, `Button`, and protected Gift Voucher source were reviewed
before the edit. No reset, clean, stash, mass restore, migration, deployment,
or business mutation was performed.

## 4. Worktree Baseline

| Field | Value |
|---|---|
| Branch | `main` |
| HEAD | `1657b0e9ba580faef69be48f04637835c201b521` |
| Baseline | Dirty worktree with unrelated pre-existing changes |
| Handling | Preserved; no cleanup or ownership assumed |
| Capture | `backups/ui-ux/PRE_UX5C_OWNER_VISUAL_20260828_085333Z/` |

## 5. Owner Finding Map

The complete map is in `DARFUS_UX5C_OWNER_FINDING_MAP.md`. It covers the eight
approved findings, their source owner, visual cause, minimum correction, impact,
and rollback path. `OWNER_FINDING_MAP = COMPLETE`.

## 6. Before Evidence

Before source hash:

`A02F9F9DC4C3179246DFC701815FBA07E187C4AD80FBE8AB958B2F788F5AE90A`

Eight screenshots were captured before editing in
`backups/ui-ux/PRE_UX5C_OWNER_VISUAL_20260828_085333Z/`.

## 7. Implemented Corrections

| Finding | Implementation | Result |
|---|---|---|
| Tablet compression | Two-column `lg` layout; payment spans row; three columns only at `2xl` | PASS |
| Arabic payment chrome | Arabic-only payment labels; English-only EN labels including split state | PASS |
| Discount zero | Zero uses neutral text; positive discount keeps existing accent | PASS |
| Disabled Checkout | Explicit disabled surface, contrast, border, cursor, opacity | PASS |
| Empty-cart Clear | Existing handler preserved; empty state de-emphasizes clear action | PASS |
| Search clipping | POS-local `min-w-0` boundary and responsive layout | PASS |
| Teal/gold balance | Gold reserved for POS identity and total; teal remains operational | PASS |
| Empty POS density | Empty state reduced to `min-h-[170px]` with balanced padding | PASS |

## 8. Business Boundary Proof

No business calculations, state transitions, payloads, API clients, routes,
permissions, payment identifiers, checkout conditions, Gift Voucher code, tax,
making formula, inventory, accounting, or shared component contracts were changed.
The existing `calculatePricing`, `postInvoice`, `completeSale`, Asset identity,
and payment state paths remain in place.

## 9. AR / EN Payment Purity

AR button labels are `نقدي`, `بطاقة`, `تحويل`, `مجزأ`, `تقسيط`, `عربون`.
English uses `Cash`, `Card`, `Transfer`, `Split`, `Installment`, `Deposit`.
Split allocation and installment labels are also locale-conditional. Browser
inspection returned zero English payment leaks in AR and zero Arabic payment leaks
in EN.

## 10. States, Search, and Accessibility

The Clear Invoice Items handler remains `setCart([])`; only presentation changed.
Checkout keeps the same native disabled expression and `completeSale` handler.
The existing query, filter, reset, keyboard, and `/pos/search` behavior is
unchanged. Native labels, `aria-pressed`, native disabled Checkout,
`aria-disabled` empty Clear action, touch-sized controls, and RTL/LTR direction
were verified. No new motion was introduced.

## 11. Browser Evidence

| Surface | Result |
|---|---|
| EN light/dark desktop | PASS; `dir=ltr`, overflow 0 |
| AR light/dark desktop | PASS; `dir=rtl`, overflow 0 |
| EN/AR tablet | PASS; reported CSS width 853 × 1138, overflow 0 |
| EN/AR mobile | PASS; reported CSS width 434 × 938, overflow 0 |
| AR split payment | PASS; no English payment chrome |
| EN split payment | PASS; no Arabic payment chrome |
| Console | 0 application errors, 0 warnings, 0 hydration errors |

Screenshots and the full matrix are in `screenshots/` and
`DARFUS_UX5C_BROWSER_EVIDENCE_MATRIX.md`.

## 12. Runtime and DB Safety

`http://localhost:8000/api/v1/health` returned `200` and
`http://localhost:3000/en/pos` returned `200`. Read-only PostgreSQL identity
was `darfus_erp`. UX5C invoked no business mutation path. Existing concurrent or
historical activity was not altered or cleaned.

## 13. Tests, Typecheck, and Build

- Focused UX5C tests: `11/11 PASS`
- Existing POS/Gift Voucher/GBW/CGP/reservation/payment regression: `41/41 PASS`
- `npm run typecheck`: PASS
- `npm run build`: PASS, Next.js 16.2.9; 130 static pages generated

## 14. After Snapshot and Rollback

After snapshot: `backups/ui-ux/UX5C_OWNER_VISUAL_20260828_090140Z/`.

| Artifact | SHA-256 |
|---|---|
| POS page after | `3B787189C7F75007F0C32B2114456783036D292C8DC66107034BFB3BC1814EC7` |
| UX5C focused test | `CD0ED06D723BA47A7B8A5263D19442325927598CC949F1370B234D653C49FD09` |
| Gift Voucher protected component | `02D379E629DE057FBA2523C0F0A1932E12B0BAFE005A8C010BE12C587E09B7F4` |

The isolated rehearsal restored the before POS copy and reproduced its exact hash,
then reapplied the after copy and reproduced the exact after hash. Live source was
not reset, cleaned, stashed, or replaced. Full proof is in
`DARFUS_UX5C_ROLLBACK_PROOF.md`.

## 15. Registers and Remaining Limitations

Updated the success, error, issue/blocker, root-cause prevention, owner decision,
closed evidence, UX2 change ledger, and UX2 rollback registers. Two P3 evidence
limitations remain documented: detailed request interception is not exposed by the
connected browser surface, and no populated cart was created because UX5C forbids
business mutation. The two deferred issues remain open and untouched.

## 16. Final Tokens

```text
CURRENT_CONTROL = DARFUS-UIUX-UX5C-OWNER-VISUAL-CORRECTIONS-01
MODE = OWNER_VISUAL_CORRECTION_ONLY_WITH_DEFERRED_ISSUES_FROZEN
READ_FIRST = YES
PRE_UX5C_GIT_STATE_CAPTURED = YES
OWNER_FINDING_MAP = COMPLETE
UX5C_BEFORE_SNAPSHOT = PASS
UX5C_BEFORE_HASH_MANIFEST = PASS
UX5C_BEFORE_SCREENSHOTS = PASS
UX5C_FILE_SCOPE = POS_PRESENTATION_ONLY
UX5C_TABLET_RESPONSIVE = PASS
AR_PAYMENT_UI_ENGLISH_LEAKS = 0
EN_PAYMENT_UI_ARABIC_LEAKS = 0
DISCOUNT_ZERO_VISUAL_STATE = NEUTRAL
DISCOUNT_BEHAVIOR_CHANGED = NO
CHECKOUT_DISABLED_VISUAL_CLARITY = PASS
CHECKOUT_ENABLEMENT_LOGIC_CHANGED = NO
EMPTY_CART_CLEAR_ACTION_PRESENTATION = PASS
CLEAR_CART_BEHAVIOR_CHANGED = NO
POS_SEARCH_CLIPPING = RESOLVED
SEARCH_BEHAVIOR_CHANGED = NO
TEAL_GOLD_BALANCE = PASS
EMPTY_POS_DENSITY = PASS
SIDEBAR_HEIGHT_ISSUE = DEFERRED
SIDEBAR_HEIGHT_ISSUE_TOUCHED = NO
GIFT_VOUCHER_STATE_INVESTIGATION = DEFERRED
GIFT_VOUCHER_STATE_ISSUE_TOUCHED = NO
GIFT_VOUCHER_COMPONENT_CHANGE = NO
UX5C_AR = PASS
UX5C_EN = PASS
UX5C_DARK = PASS
UX5C_LIGHT = PASS
UX5C_RESPONSIVE = PASS
UX5C_ACCESSIBILITY = PASS
FOCUSED_UX5C_TESTS = PASS_11_OF_11
POS_UX5C_REGRESSION = PASS_41_OF_41
TYPECHECK = PASS
BUILD = PASS
UX5C_REAL_BROWSER = PASS
CONSOLE_APPLICATION_ERRORS = 0
HYDRATION_ERRORS = 0
DATABASE_CHANGED = NO
BUSINESS_LOGIC_CHANGED = NO
API_CHANGED = NO
MIGRATIONS = 0
BUSINESS_WRITES = 0
FINANCIAL_WRITES = 0
INVENTORY_WRITES = 0
TAX_CHANGED = NO
PAYMENT_LOGIC_CHANGED = NO
GIFT_VOUCHER_BUSINESS_LOGIC_CHANGED = NO
CHECKOUT_LOGIC_CHANGED = NO
UX5C_AFTER_SNAPSHOT = PASS
UX5C_CHANGE_LEDGER_UPDATED = YES
UX5C_ROLLBACK_REGISTER_UPDATED = YES
UX5C_ROLLBACK_REHEARSAL = PASS
UX5C_RESTORED_HASH_PARITY = PASS
P0 = 0
P1 = 0
P2 = 0
P3 = 2_DOCUMENTED_EVIDENCE_LIMITATIONS
GATE = PASS_DARFUS_UIUX_UX5C_OWNER_VISUAL_CORRECTIONS
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_ONLY_THEN_UX6_IF_EXPLICITLY_AUTHORIZED
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 17. STOP

توقف عند Owner Review. لا تبدأ UX6، ولا تلمس Sidebar Light height أو Gift Voucher
state vs Empty Cart، ولا تنفذ Checkout أو أي تعديل أعمال تلقائيًا.
