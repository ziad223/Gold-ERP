# DARFUS POS Making Charge Formula — Authority Record

بالعربي: تم تتبع معنى المصنعية من مستند العميل إلى مصدر التسعير والخادم. التعديل المحدود يثبت أن المصنعية في Gold By Weight هي سعر لكل جرام مضروبًا في وزن الذهب المؤهل، مع بقاء الخادم هو السلطة النهائية. لم تُكتب قاعدة `darfus_erp`.

## Control

- Control: `DARFUS-POS-MAKING-CHARGE-FORMULA-CLOSURE-01`
- Business authorities: `I:\WORK\client-requirements\تم الانتهاء\Gold By Weight.docx`, `I:\WORK\client-requirements\تم الانتهاء\1- Sales Invoice.docx`
- Authority order: client DOCX → frozen DARFUS architecture → current source/DB/runtime
- DOCX coverage: both files located, OOXML extracted completely, and rendered through LibreOffice (`36` and `130` pages respectively). The Gold By Weight embedded formula image was also inspected.
- Official DB: `darfus_erp`, read-only

## Proven business meaning

| Contract item | Proven authority | Evidence | Result |
|---|---|---|---|
| Making input | Selling Making Cost Per Gram | Gold By Weight paragraphs 0337–0342; Sales Invoice paragraphs 0930–0935 | `MAKING_RATE_MEANING = AED_PER_GRAM` |
| GBW eligible weight | Net Gold Weight | Gold By Weight paragraphs 0235, 0240–0247 and 0281–0292 | `POS_WEIGHT_BASIS = NET_GOLD_WEIGHT` for `GOLD_BY_WEIGHT_JEWELLERY` |
| GBW making formula | rate × net gold weight | Gold By Weight paragraph 0292 | `TOTAL_MAKING = ELIGIBLE_WEIGHT × RATE` |
| GBW gold value | selling rate × net gold weight | Gold By Weight paragraphs 0325–0333 and 0278–0279 | Gold Center rate and Asset net authority are separate inputs |
| Invoice line | independently priced/recalculated line | Sales Invoice paragraphs 0877, 0900–0908, 0956–0978 | Server prices each Asset line; no client total authority |
| Minimum/approval | below minimum making requires manager approval | Gold By Weight paragraphs 0405–0410 | Existing `approvalRequired` contract preserved |
| VAT | canonical tax engine on the resolved GBW subtotal | `gold-sale-pricing.service.js:125–151`; route tax-base handling at `erp.routes.js:14544–14552` | One VAT application; no second POS VAT resolver |

## Field and authority trace

| Field | Meaning | Authority | Evidence |
|---|---|---|---|
| `makingChargePerGram` | User-entered proposed sale making rate in AED/g | Server validates and passes to canonical pricing; UI is input only | `erp.routes.js:718–722, 888–893`; `gold-sale-pricing.service.js:112–127` |
| `netGoldWeight` | GBW eligible gold weight | Asset/`asset_gold_details`, server-resolved | `gold-sale-pricing.service.js:545–579` |
| `grossWeight` | physical/display/audit weight | Asset; not GBW making basis | `asset.model.js`; `gold-sale-pricing.service.js:545–579` |
| `sellingGoldRate` | current selling gold rate | Gold Center/server resolver | `erp.routes.js:888–893`; `gold-sale-pricing.service.js` |
| `minimumMakingPerGram` | minimum policy threshold | Asset pricing policy/server | `gold-sale-pricing.service.js:571–582` |
| `totalMakingCharge` | sum of resolved line making amounts | Server preview/checkout response | `erp.routes.js:14526, 14549, 14593–14595` |
| `price`, `total`, `weight` from client | request/display hints only | Not trusted for Asset sale pricing | `erp.routes.js:888–893`; existing POS tests |

## Exact formula

For a GBW line `i`:

```text
making_i = netGoldWeight_i × makingChargePerGram_i
totalMaking = Σ making_i
```

The current POS form supplies one cart-level `makingChargePerGram`; the canonical server applies that validated rate to each eligible GBW line. The pure pricing service also accepts item-level rates for isolated line pricing. A separate per-line rate editor is not added in this control.

Examples proven by focused tests:

```text
10 × 50 = 500
(5 + 4 + 10) × 50 = 950
5 × 50 + 4 × 60 + 10 × 40 = 890
```

## Current source finding

The server pricing authority was already net-based and was retained. Two real defects were corrected narrowly:

1. POS display quote used `grossWeight` for GBW making; it now uses the server-defined eligible net weight (`app/[locale]/(dashboard)/pos/page.tsx:642–647`).
2. `/pricing/calculate` included dynamic GBW making internally but reported `totalMakingCharge=0`; it now reports dynamic making separately without adding it again to the tax base (`backend/src/routes/erp.routes.js:14495–14549`).

The mock-only fallback was aligned to the same GBW net basis (`features/sales/hooks/use-pos.ts:134–150`). Non-final/non-GBW strategy branches remain separate.

## Server authority and safety

- Client-submitted price/weight/total-making fields are not final authorities for Asset sales.
- Asset branch, company/branch scope, Asset status, Gold Center rate, VAT resolver, minimum-making approval, accounting preview, and idempotency remain server-controlled.
- The canonical tax engine is reused; no second VAT calculation was introduced.
- No inventory, accounting, Gold Center, CGP acquisition, or schema authority was changed.

## Scope boundary

Included: GBW POS display/preview mapping, mock fallback alignment, focused semantic tests, and reports.

Excluded: Gold Center changes, CGP acquisition changes, accounting redesign, inventory changes, master-data provisioning, migrations, and official DB mutation.

