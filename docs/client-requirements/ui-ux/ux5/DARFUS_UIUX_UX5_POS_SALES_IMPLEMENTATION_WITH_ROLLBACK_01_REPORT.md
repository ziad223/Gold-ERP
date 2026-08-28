# DARFUS ERP — UX5 POS/Sales Presentation Implementation With Rollback

تم تنفيذ تحسين عرض POS فقط: تم تنظيم مناطق العميل والبحث والسطور والدفع، تحسين الكثافة والاستجابة، وإضافة حالة وصول لطريقة الدفع المختارة. نجحت الاختبارات المركزة و`typecheck` و`build`، ونجح فحص المتصفح AR/EN في الوضعين الفاتح والداكن وعلى سطح المكتب/الجهاز اللوحي/الهاتف دون تنفيذ بيع أو أي كتابة أعمال. لم تتغير قواعد السعر أو الضريبة أو المصنعية أو الدفع أو القسيمة أو المخزون أو المحاسبة.

## 1. Executive Summary

| Item | Result |
|---|---|
| Adopted control | `C:\Users\NEGM\Desktop\DARFUS_UIUX_UX5_POS_SALES_IMPLEMENTATION_WITH_ROLLBACK_01.md` — read completely before edit |
| Scope | POS presentation only |
| Production source change | `app/[locale]/(dashboard)/pos/page.tsx` only; existing pre-UX5 dirty changes were preserved |
| Test change | New UX5 presentation test plus one stale GBW marker alignment |
| Business/API/DB changes | None |
| Browser business mutation | None; checkout, customer creation, voucher validation, draft mutation and payment mutation were not invoked |
| Main DB | `darfus_erp`, read-only identity verified |
| Gate disposition | `PASS_DARFUS_UIUX_UX5_POS_SALES_IMPLEMENTATION_WITH_ROLLBACK` for the scoped presentation control |

## 2. Owner Authorization

The Desktop UX5 file is the adopted authority for this batch. Its restrictions were
applied literally: POS presentation only; no business logic, API, DB, migration,
accounting, tax, inventory, voucher, payment, permission, route, print, barcode, or
shared-component contract changes. The previously accepted `next-env.d.ts` policy was
respected and that file was not edited.

## 3. Read First

Read before source edit: `AGENTS.md`, `PROJECT_PROGRESS_HANDOFF.md`, the adopted Desktop
UX5 control, the UX4C report, UX2 ledger/rollback register, and the current POS source,
POS payment/voucher components, JournalPreview, POS-related types, tests, package scripts,
and current runtime evidence. No other client inventory document was used as POS authority.

## 4. Git/Worktree Baseline

| Field | Observed |
|---|---|
| Branch | `main` |
| HEAD | `1657b0e9ba580faef69be48f04637835c201b521` |
| Worktree | Dirty before UX5; 998 status lines were observed |
| Pre-existing POS state | POS page was already modified before this batch; the pre-UX5 file snapshot was captured |
| Cleanup/reset/stash | Not run |
| `next-env.d.ts` | Not edited or reverted |
| Scope attribution | UX5 attribution is based on the pre-edit snapshot/hash and the narrow applied hunks; unrelated dirty worktree files remain owner state |

## 5. POS Authority Map

| Concern | Visual owner | Business/source authority | UX5 result |
|---|---|---|---|
| Customer | POS customer card and phone lookup | `useAuth`, customer query, `/pos/customer-lookup` | layout/spacing only |
| Search | `DataToolbar` and POS search effect | bounded `/pos/search` read path | responsive/focus presentation only |
| Barcode/Asset | search result and cart row | Asset/barcode identity | labels/readability only |
| Product compatibility | existing product branch | existing Product compatibility path | preserved; not removed |
| Weights/karat | cart/search item values | selected Asset/Product data | visual hierarchy only |
| Making | input + pricing preview | `calculatePricing` and server pricing authority | no formula/input semantics change |
| Discount | discount input/summary | existing checkout contract | presentation only |
| VAT | settings rate label + server preview | `settings.vatRate` display, server tax | no rate/formula change |
| Gift Voucher | `GiftVoucherPaymentSection` | voucher service and split adapter | component untouched; payment meaning preserved |
| Payments | payment method group | existing payment options and validation | selected state made explicit with `aria-pressed` |
| Totals | summary panel | pricing preview result | hierarchy only |
| Checkout | existing `completeSale` button | POS checkout/draft paths | affordance only; disabled guards preserved |
| Journal | `JournalPreview` | server journal preview | no client calculation |
| Context/RBAC | shell/auth | server Company/Branch/RBAC | untouched |
| i18n | `useLocale`/`dir` | locale catalog and server data | dynamic RTL/LTR layout preserved |

## 6. Business Contract Freeze

Frozen for this control: `SERVER_FINAL_AUTHORITY=YES`, `POS_MAKING_FORMULA_CHANGED=NO`,
`POS_WEIGHT_BASIS_GBW=NET_GOLD_WEIGHT`, voucher is settlement rather than discount,
existing payment combinations remain authoritative, Asset/barcode identity remains the
physical-sale identity, and no UI state change may enable a previously invalid action.

## 7. Before Snapshot

Captured before source edit at `2026-08-28T08:06:14Z`:
`backups/ui-ux/PRE_UX5_POS_20260828_080614Z/`.
The POS production page and Gift Voucher component were copied there. The worktree was
already dirty and was not cleaned.

## 8. Before Hashes

| File | SHA-256 before UX5 |
|---|---|
| `app/[locale]/(dashboard)/pos/page.tsx` | `AD8D2330D6D1D76C110BA0B5E7741F759185AF2DD4394C475310A85C58BA88A4` |
| `features/sales/components/GiftVoucherPaymentSection.tsx` | `02D379E629DE057FBA2523C0F0A1932E12B0BAFE005A8C010BE12C587E09B7F4` |

## 9. Before Screenshots

Available pre-edit screenshot: `ux5/screenshots/before/en-dark-desktop.png`.
It records the empty/read-only POS state with customer, search, invoice items, voucher,
payment, totals, and disabled checkout. AR/light/mobile pre-edit screenshot parity was
not captured before the source edit; therefore those views are treated as after-only
evidence and not falsely described as pre/post visual diffs.

## 10. Restore Map

Restore only the UX5-attributed file hunks in `app/[locale]/(dashboard)/pos/page.tsx` and
the UX5 test/docs artifacts from the scoped snapshot. Do not restore the whole dirty
worktree. Do not touch unrelated files or `next-env.d.ts`.

## 11. Files Changed

Intentional UX5 files:

- `app/[locale]/(dashboard)/pos/page.tsx` — presentation classes, responsive direction,
  selected-payment ARIA state, and empty-state hierarchy.
- `tests/ux5-pos-presentation.test.cjs` — focused semantic/presentation guard tests.
- `tests/gbw-final-closure.test.cjs` — one stale `Server Tax Summary` marker aligned to
  the current `Tax Summary` contract; no product code change.
- `docs/client-requirements/ui-ux/ux5/` — contract, report, snapshots and screenshots.
- UX2 ledger, rollback register, closed evidence register, owner decision register and
  issue register — documentation-only UX5 entries.

No backend, migration, config, tax, accounting, inventory, voucher, payment, permission,
route, print, barcode or shared component API file was changed by UX5.

## 12. POS Layout

The existing three authority areas remain one workspace. Desktop uses a balanced customer /
search-and-items / payment layout. AR now uses RTL grid direction while each card keeps
its own locale direction. Empty invoice items use a clear bounded empty state, and the
content area avoids the former oversized blank gap without changing any action.

## 13. Customer/Search

Customer selection, phone lookup, `/pos/search`, type filter, reset, keyboard search, and
unavailable-item guards were preserved. Search result buttons retain the existing click
handler and now have clearer wrapping/focus presentation. No customer was created or
mutated.

## 14. Items/Assets

Invoice item table and Asset/Product identity remain the same. The existing `assetId`,
barcode/code, quantity, and selected-item behavior remain in the source. No inventory
authority or Product compatibility path was removed.

## 15. Weight/Making

Only presentation spacing and grouping changed. The existing `calculatePricing` call,
server authority, `makingChargePerGram`, GBW eligible-weight display, and line values are
unchanged.

## 16. Stone/Additional Value

The existing Stone Value input and summary row remain in the same state/handler path.
No new field or calculation was introduced.

## 17. Discount

Discount remains the existing input and payload field. UX5 only retains its visual
emphasis in the totals panel; no discount rule or permission changed.

## 18. VAT

The existing configured rate is displayed by the current settings-backed label. No VAT
rate, tax engine, or calculation code was edited.

## 19. Payments

Payment options remain sourced from current settings and the existing payment contract.
The buttons now render as an accessible group with `aria-pressed` for the selected method;
the selected method still uses the same `setMethod` handler.

## 20. Gift Voucher

`GiftVoucherPaymentSection.tsx` was not modified. Existing copy, validation, focus-safe
actions, supported/unsupported state, and settlement-not-discount semantics remain intact.
The focused voucher tests passed.

## 21. Totals

Subtotal, making, stone, discount, VAT and total retain their existing values and source.
The totals are grouped in a bounded visual panel with a stronger total row; no duplicate
calculation or client-side financial authority was added.

## 22. Checkout

The existing checkout/draft branch and `onClick={completeSale}` remain. Disabled behavior
still depends on cart, posting state, settings readiness and reservation readiness.
No checkout was submitted.

## 23. States

Empty, loading, error, unavailable, disabled and selected states remain represented by the
existing handlers. UX5 improves empty-state hierarchy and keeps error/settings messages
inside the existing presentation boundary.

## 24. AR/EN

Browser proof:

- EN route: `/en/pos`, `dir=ltr`, no console errors/warnings.
- AR route: `/ar/pos`, `dir=rtl`, no console errors/warnings.
- AR had Arabic chrome; existing Arabic business data remained data-source content and
  was not rewritten by UX5.

## 25. Dark/Light

Captured after screenshots for EN/AR in dark and light. Existing semantic theme classes
rendered correctly; no theme token or global CSS change was made.

## 26. Responsive

Read-only browser evidence:

| Profile | Result |
|---|---|
| Desktop default (~1422×800) | EN/AR layout loaded; no horizontal overflow |
| Tablet override (reported ~853×1138) | EN/AR layout loaded; no horizontal overflow |
| Mobile override (reported 434×938) | EN/AR stacked layout loaded; `scrollWidth=viewport`, no horizontal overflow |

The empty state was used at mobile/tablet because no safe checkout/cart mutation was
authorized. This is an explicit evidence limitation, not invented populated-state proof.

## 27. Motion

No new motion or animation was introduced. Existing loading motion remains under the
existing global reduced-motion policy; no essential information depends on animation.

## 28. Accessibility

Verified or source-proven: form labels/aria labels, search combobox expansion, visible
focus path, keyboard ArrowDown opening of search, payment group semantics, selected
payment `aria-pressed`, disabled checkout, voucher error `role=alert`, and touch-sized
buttons. No business mutation was used for these checks.

## 29. Focused Tests

Command:

`node --test tests/ux5-pos-presentation.test.cjs tests/pos-gift-voucher-payment-ui-composition.test.cjs tests/pos-gift-voucher-visual-ux-correction.test.cjs tests/pos-gift-voucher-i18n.test.cjs tests/pos-journal-preview-p2.test.cjs tests/stage-c-pos-financial-integration.test.cjs`

Result: `22/22 PASS`.

## 30. POS Regression

Command included UX5, Gift Voucher composition/i18n/visual, JournalPreview, Stage C POS,
GBW closure, CGP post UI synchronization, and reservation payment/navigation contracts.
Result: `35/35 PASS`.

## 31. Cross-Module Smoke

Read-only source and runtime smoke covered POS dependencies to customer, settings,
pricing/journal preview, voucher component, GBW, CGP, and reservation contracts. No
cross-module mutation was invoked. The selected browser route loaded with authenticated
Company/Branch context.

## 32. Typecheck/Build

- `npm run typecheck` — PASS.
- `npm run build` — PASS.

The existing main frontend process was not started or replaced by this batch.

## 33. Real Browser

Main runtime `http://localhost:3000` returned HTTP 200 for `/en/pos` and `/ar/pos`.
The page was checked in real browser DOM and screenshots. Search focus/keyboard and payment
selection were exercised without checkout. Console error/warning count was zero in the
tested tabs.

## 34. Main Runtime/DB

| Check | Evidence |
|---|---|
| Frontend | `GET http://localhost:3000/en/pos` → 200 |
| Backend | `GET http://localhost:8000/api/v1/health` → 200, `UP` |
| Database identity | `SELECT current_database()` through the local Postgres container → `darfus_erp` |
| DB read-only counts observed | purchase_orders=14, assets=18, journal_entries=35, payments=7, cash_transactions=17 |
| Mutating browser action | None |
| POST business requests in backend log during check | None observed |

## 35. Financial Zero Delta

No checkout, payment, voucher, journal, tax, or draft write was invoked. No accounting or
treasury source was changed. `FINANCIAL_WRITES_THIS_BATCH=0`.

## 36. Inventory Zero Delta

No Asset/Product/Barcode/Movement action was invoked. Asset and Product authority code was
only inspected/presented. `INVENTORY_WRITES_THIS_BATCH=0`.

## 37. After Snapshot

After snapshot: `backups/ui-ux/UX5_POS_20260828_081104Z/`.
It contains the POS page, UX5 focused test and `rollback-rehearsal` copies. After POS page
SHA-256: `A02F9F9DC4C3179246DFC701815FBA07E187C4AD80FBE8AB958B2F788F5AE90A`.

## 38. Change Ledger

UX5 was appended to `ui-ux/ux2/DARFUS_UI_UX_CHANGE_LEDGER.md`. The entry records the
pre-UX5 and after hashes, presentation-only purpose, and rollback readiness. Historical
entries were preserved.

## 39. Rollback Proof

Isolated copy rehearsal passed:

- restored-before SHA = `AD8D2330D6D1D76C110BA0B5E7741F759185AF2DD4394C475310A85C58BA88A4`
- reapplied-after SHA = `A02F9F9DC4C3179246DFC701815FBA07E187C4AD80FBE8AB958B2F788F5AE90A`
- before parity = PASS
- after parity = PASS

Live source was not rolled back or replaced during the rehearsal.

## 40. Registers

Updated documentation-only entries:

- `DARFUS-UX5-POS-VISUAL-IMPLEMENTATION-001`
- `DARFUS-UX5-POS-BUSINESS-CONTRACT-PRESERVATION-001`
- `DARFUS-UX5-POS-ROLLBACK-001`
- `DARFUS-UX5-POS-ACCESSIBILITY-001`

The issue register records two non-blocking evidence limitations: no detailed Network
interception in the connected browser surface, and no authorized populated-cart mutation.

## 41. Gate

`GATE = PASS_DARFUS_UIUX_UX5_POS_SALES_IMPLEMENTATION_WITH_ROLLBACK`

Reason: the scoped presentation implementation passed focused/regression tests,
typecheck/build, main runtime health, DB identity read-only proof, AR/EN RTL/LTR,
dark/light, responsive no-overflow checks, accessibility checks, contract preservation,
and isolated rollback parity. No P0/P1 defect was introduced. Network detail was not
claimed beyond source review/backend GET-only log evidence.

## 42. Final Tokens

```text
CURRENT_CONTROL = DARFUS-UIUX-UX5-POS-SALES-IMPLEMENTATION-WITH-ROLLBACK-01
MODE = PRODUCTION_POS_VISUAL_IMPLEMENTATION_WITH_BUSINESS_CONTRACT_FREEZE_AND_FILE_SCOPED_ROLLBACK
UX5_FILE_SCOPE = POS_PRESENTATION_ONLY
POS_AUTHORITY_MAP = COMPLETE
POS_BUSINESS_CONTRACT_FREEZE = COMPLETE
UX5_BEFORE_SNAPSHOT = PASS
UX5_BEFORE_HASH_MANIFEST = PASS
UX5_BEFORE_SCREENSHOT_COVERAGE = PARTIAL_DOCUMENTED
POS_LAYOUT = PASS
CUSTOMER_SEARCH_PRESENTATION = PASS
ITEM_ASSET_PRESENTATION = PASS
WEIGHT_MAKING_PRESENTATION = PASS_PRESERVED
STONE_VALUE_PRESENTATION = PASS_PRESERVED
DISCOUNT_PRESENTATION = PASS_PRESERVED
VAT_PRESENTATION = PASS_PRESERVED
PAYMENT_PRESENTATION = PASS
GIFT_VOUCHER_PRESENTATION = PASS_PRESERVED
TOTALS_PRESENTATION = PASS
CHECKOUT_PRESENTATION = PASS_PRESERVED
POS_STATES_PRESENTATION = PASS
AR = PASS
EN = PASS
RTL_LTR = PASS
DARK = PASS
LIGHT = PASS
RESPONSIVE_DESKTOP = PASS
RESPONSIVE_TABLET = PASS
RESPONSIVE_MOBILE = PASS
MOTION = PASS_PRESERVED
ACCESSIBILITY = PASS
FOCUSED_UX5_TESTS = PASS_22_OF_22
POS_REGRESSION_TESTS = PASS_35_OF_35
CROSS_MODULE_SMOKE = PASS_READ_ONLY
TYPECHECK = PASS
BUILD = PASS
MAIN_RUNTIME_INSPECTED = YES
MAIN_DB_IDENTITY_VERIFIED = YES
MAIN_DB = darfus_erp
MAIN_DB_READ_ONLY = YES
FINANCIAL_ZERO_DELTA = PASS_NO_WRITE_PATH_INVOKED
INVENTORY_ZERO_DELTA = PASS_NO_WRITE_PATH_INVOKED
NETWORK_DETAILED_INTERCEPTION = UNAVAILABLE_DOCUMENTED
BUSINESS_LOGIC_CHANGED = NO
API_CHANGED = NO
DATABASE_CHANGED = NO
MIGRATIONS = 0
BUSINESS_WRITES = 0
FINANCIAL_WRITES = 0
INVENTORY_WRITES = 0
PERMISSION_BEHAVIOR_CHANGED = NO
ROUTE_CONTRACT_CHANGED = NO
ROLLBACK_REHEARSAL = PASS
UX5_BATCH_CLOSURE = IMPLEMENTATION_PASS_AND_ROLLBACK_READY
P0 = 0
P1 = 0
P2 = 0
P3 = 2_DOCUMENTED_EVIDENCE_LIMITATIONS
GATE = PASS_DARFUS_UIUX_UX5_POS_SALES_IMPLEMENTATION_WITH_ROLLBACK
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_ONLY_THEN_UX6_IF_EXPLICITLY_AUTHORIZED
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 43. Next Step

Owner review of the UX5 report and screenshots. UX6 or any further POS work requires
explicit authorization. No business acceptance or financial checkout is authorized by
this control.

## 44. STOP

STOP. No checkout, customer creation, voucher mutation, payment, invoice posting,
inventory mutation, migration, deployment, or automatic next batch was started.
