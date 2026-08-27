# DARFUS POS Making Charge — AR Browser / Network Final Evidence

ما تم: تم تحديث الـmain frontend إلى build جديد وثبتت صفحة `/ar/pos` بــHTTP 200 ووجود marker المصحح في الـserved chunk. ما حُجب: قبول AR الحقيقي، بسبب فشل Browser Preflight قبل إنشاء بيئة العزل.

## Required AR proof

| Proof | Result | Evidence |
|---|---|---|
| Real browser `/ar/pos` | BLOCKED | Browser Preflight error: `failed to write kernel assets ... os error 3` |
| Add three isolated assets | NOT RUN | no clone/fixtures created after preflight failure |
| Visible eligible gold weight | NOT OBSERVED | source/served chunk contains marker only |
| Stone-bearing item uses net 4g | NOT OBSERVED | no real browser session |
| Visible total making `950` | NOT OBSERVED | no fixture/cart/browser session |
| Browser console blockers | NOT OBSERVED | console capture unavailable |
| Pricing network request/response | NOT OBSERVED | browser network capture unavailable |

## Non-browser runtime evidence

- Refreshed main `/ar/pos` returned HTTP `200`.
- Served POS JavaScript chunk includes `Eligible gold weight for making`, Arabic `وزن الذهب المؤهل للمصنعية`, `totalMakingCharge`, and `netGoldWeight`.
- The already accepted upstream clone proof recorded server pricing making `950`, stone-bearing net-weight behavior, checkout making `950`, VAT once, balanced journal, payment, inventory, and idempotent replay. It is not claimed as new AR browser proof for this control.

`AR_BROWSER = BLOCKED_BROWSER_CONTROL_ENVIRONMENT`  
`AR_VISUAL_TOTAL_MAKING_950 = NOT_PROVEN`  
`AR_STONE_NET_WEIGHT = NOT_PROVEN`  
`AR_NETWORK = NOT_PROVEN`  
`AR_NETWORK_SERVER_MAKING_950 = NOT_PROVEN`  
`AR_CONSOLE_BLOCKERS = NOT_OBSERVED`  

---

## Current Real Chrome Addendum — 2026-08-27

تمت رحلة AR على Chrome الحقيقي المعزول ضد `http://localhost:3000/ar/pos`، بدون Checkout أو أي mutation. تم التقاط Network حقيقي من المتصفح وConsole بلا أخطاء مانعة. الرحلة الحالية استخدمت Asset رسميًا واحدًا لأن الثلاثة fixtures المطلوبة غير موجودة في الرسمي.

### Required browser evidence classification

| Evidence | Result | Actual evidence |
|---|---|---|
| Real browser page | PASS | authenticated `/ar/pos`, HTTP 200، POS rendered، Branch-1، customer/cart controls |
| Eligible 19g | BLOCKED | current official DB has no approved A/B/C three-Asset fixture set |
| Stone item uses net 4g | BLOCKED | no stone-bearing fixture was created in this control |
| Making 950 AED | BLOCKED | current single official Asset proof returned making 250 AED; prior clone 950 is supporting evidence only |
| Browser Network captured | PASS | browser-originated `GET /api/v1/pos/search` 200 and `POST /api/v1/pricing/calculate` 200 captured |
| Server response = 950 | BLOCKED | current response for 5g Asset at 50 AED/g was 250 AED; 950 exists only in prior clone acceptance |
| Console blocker count | PASS | no blocking console error; only expected React/HMR informational messages |

### Current browser/network facts

- Search request: `GET /api/v1/pos/search?query=GWRNG21000001&type=all&limit=20&includeUnavailableExact=true` → `200`.
- Pricing request: `POST /api/v1/pricing/calculate` → `200`.
- Request used the selected Asset identity and `makingChargePerGram = 50`.
- Server response: eligible weight `5g`, making `250`, VAT `367.4186`, total `2991.837`, VAT rate `14`; journal preview balanced.
- Visible Arabic values included eligible weight `5 جم`, total making `+250.00`, VAT `367.42`, and total `2,991.84`.
- No checkout button was clicked and no official business POST was sent.

```text
AR_BROWSER = BLOCKED
AR_BROWSER_SINGLE_ASSET_SMOKE = PASS
AR_VISUAL_TOTAL_MAKING_950 = BLOCKED
AR_STONE_NET_WEIGHT = BLOCKED
AR_NETWORK = PASS
AR_NETWORK_SERVER_MAKING_950 = BLOCKED
AR_CONSOLE_BLOCKERS = 0
```
