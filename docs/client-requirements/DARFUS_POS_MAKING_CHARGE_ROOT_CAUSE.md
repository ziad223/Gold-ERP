# DARFUS POS Making Charge — Root Cause and Minimum Safe Fix

بالعربي: السبب ليس خللًا في `gold-sale-pricing.service`؛ السبب كان اختلافًا بين طبقة عرض POS ومرجع الوزن، مع نقص في حقل الإبلاغ عن مصنعية التسعير الديناميكي. تم إصلاح الحد الأدنى فقط.

## Root-cause classification

| ID | Classification | Evidence | Disposition |
|---|---|---|---|
| A | `A_UI_SEMANTIC_BUG` | POS display quote labeled/handled the cart charge as a number without exposing the eligible GBW weight; `currentSellingPriceForAsset` used gross for GBW before correction | Corrected in `page.tsx:642–647`; added explicit eligible-weight summary |
| B | `B_FRONTEND_TOTAL_CALCULATION_BUG` | The frontend display path calculated GBW making with `grossWeight` even though the source authority is net gold weight | Corrected; server remains final authority |
| C | `C_BACKEND_FORMULA_BUG` | Not proven in canonical server formula; server already used `makingWeightGrams: netGoldWeight` for GBW | Not a current canonical formula defect |
| D | `D_GROSS_VS_NET_WEIGHT_BUG` | Proven in the POS display path when stone-bearing GBW assets have gross ≠ net | Corrected for GBW only; non-GBW branches preserved |
| E | `E_INVOICE_LEVEL_VS_LINE_LEVEL_BUG` | Server prices GBW Asset lines individually, but current POS input is one cart-level rate | No broad redesign; documented as scope boundary |
| F | `F_RATE_AUTHORITY_BUG` | No evidence that client gold rate overrides server Gold Center; checkout resolves server rate | No defect proven |
| G | `G_RUNTIME_STALE` | Main backend container started at `2026-08-26T15:04:45Z`, before this source correction; no rebuild/restart was authorized | Runtime parity blocked; no restart performed |
| H | `H_MULTIPLE_PROVEN` | A + B + D are proven; `/pricing/calculate` had a separate reporting defect | Reported without widening |
| I | `I_NO_DEFECT_CURRENT_RUNTIME` | Not claimable because browser/runtime proof was blocked | Not used as final status |

## Technical cause

1. The canonical server service accepts `netGoldWeight`, `itemWeightGrams`, and `makingWeightGrams`; the GBW Asset adapter selects net gold weight for making (`backend/src/services/gold-sale-pricing.service.js:545–579`).
2. POS’s pre-correction display quote selected `grossWeight` for GBW making. This diverged from the client DOCX rule: `إجمالي المصنعية = تكلفة المصنعية لكل جرام × وزن الذهب الصافي`.
3. `/pricing/calculate` accumulated dynamic GBW making inside the canonical pricing result but only returned the non-dynamic accumulator as `totalMakingCharge`; this obscured the correct server result in the UI. The fix reports `dynamicGoldMakingTotal + totalMakingCharge` while keeping the tax base from double-counting dynamic making.

## Minimum safe fix

- POS display: use `netGoldWeight ?? netWeight ?? grossWeight` for GBW eligible making weight; retain gross for display/audit.
- POS mock fallback: same profile-specific net basis.
- Server preview response: report dynamic making separately and exactly once.
- Add a visible bilingual eligible-weight summary; no business field or backend authority added.
- Add focused pure/static tests; no migration and no official DB mutation.

## Prevention lesson

```text
LESSON_ID = POS-MAKING-PER-GRAM-AUTHORITY-001
ROOT_CAUSE = UI treated AED/g as a direct total and/or used gross weight for a net-weight business rule.
WHAT_ALLOWED_IT = rate label and eligible weight were not made explicit at the POS display boundary; server and UI were not checked with a stone-bearing example.
MINIMUM_FIX = expose rate-per-gram semantics, show eligible weight, and route final pricing through canonical server calculation.
PREVENTION_GATE = any POS making change must prove profile × eligible weight × rate × VAT once before browser acceptance.
TEST = MC-01..MC-16 plus stone-bearing net-vs-gross case and forged-client-input cases.
MODULES = POS UI, POS preview adapter, canonical sale pricing tests.
```

## Non-regression boundaries

- No Gold Center resolver or provider code changed.
- No Tax Engine implementation changed.
- No accounting mapper, Asset status, inventory movement, CGP acquisition, or idempotency contract changed.
- No legacy non-final Product branch was removed.

