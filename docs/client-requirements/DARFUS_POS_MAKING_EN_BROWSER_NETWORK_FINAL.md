# DARFUS POS Making Charge — EN Browser / Network Final Evidence

ما تم: تم تحديث الـmain frontend إلى build جديد وثبتت صفحة `/en/pos` بــHTTP 200 ووجود marker المصحح في الـserved chunk. ما حُجب: قبول EN الحقيقي، بسبب فشل Browser Preflight قبل إنشاء بيئة العزل.

## Required EN proof

| Proof | Result | Evidence |
|---|---|---|
| Real browser `/en/pos` | BLOCKED | Browser Preflight error: `failed to write kernel assets ... os error 3` |
| Add three isolated assets | NOT RUN | no clone/fixtures created after preflight failure |
| Visible eligible gold weight | NOT OBSERVED | source/served chunk contains marker only |
| Stone-bearing item uses net 4g | NOT OBSERVED | no real browser session |
| Visible total making `950` | NOT OBSERVED | no fixture/cart/browser session |
| Browser console blockers | NOT OBSERVED | console capture unavailable |
| Pricing network request/response | NOT OBSERVED | browser network capture unavailable |

## Non-browser runtime evidence

- Refreshed main `/en/pos` returned HTTP `200`.
- The same served POS chunk contains the corrected net-weight path and both AR/EN labels.
- The already accepted upstream clone proof is retained as supporting server-side evidence only; it is not claimed as new EN browser proof for this control.

`EN_BROWSER = BLOCKED_BROWSER_CONTROL_ENVIRONMENT`  
`EN_VISUAL_TOTAL_MAKING_950 = NOT_PROVEN`  
`EN_STONE_NET_WEIGHT = NOT_PROVEN`  
`EN_NETWORK = NOT_PROVEN`  
`EN_NETWORK_SERVER_MAKING_950 = NOT_PROVEN`  
`EN_CONSOLE_BLOCKERS = NOT_OBSERVED`  

---

## Current Real Chrome Addendum — 2026-08-27

تمت رحلة EN على Chrome الحقيقي المعزول ضد `http://localhost:3000/en/pos`، بدون Checkout أو أي mutation. تم التقاط Network حقيقي من المتصفح وConsole بلا أخطاء مانعة. الرحلة الحالية استخدمت Asset رسميًا واحدًا لأن الثلاثة fixtures المطلوبة غير موجودة في الرسمي.

### Required browser evidence classification

| Evidence | Result | Actual evidence |
|---|---|---|
| Real browser page | PASS | authenticated `/en/pos`, HTTP 200، POS rendered، Branch-1، customer/cart controls |
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
- Visible English values included eligible weight `5 g`, total making `AED 250.00`, VAT `AED 367.42`, and total `AED 2,991.84`.
- No checkout button was clicked and no official business POST was sent.

```text
EN_BROWSER = BLOCKED
EN_BROWSER_SINGLE_ASSET_SMOKE = PASS
EN_VISUAL_TOTAL_MAKING_950 = BLOCKED
EN_STONE_NET_WEIGHT = BLOCKED
EN_NETWORK = PASS
EN_NETWORK_SERVER_MAKING_950 = BLOCKED
EN_CONSOLE_BLOCKERS = 0
```
