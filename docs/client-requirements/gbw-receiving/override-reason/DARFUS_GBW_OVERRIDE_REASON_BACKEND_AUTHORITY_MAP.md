# GBW backend authority map

| Authority | Source and lines | Observed contract |
|---|---|---|
| Canonical endpoint | `backend/src/routes/erp.routes.js:8300` | `/purchase-orders/receive` is the canonical route; compatibility route is handled by the same implementation. |
| Rate gate | `erp.routes.js:8550–8564` | GBW/24K profile compares requested rate with the resolved reference using Decimal equality. |
| Reference | `backend/src/services/gold-sale-pricing.service.js:624–662` | Company approved executable GoldPrice, then approved global row, then Gold Center snapshot; company isolation is enforced. |
| Permission | `erp.routes.js:8559–8560` | Non-equal rate requires `inventory.adjust`. |
| Reason sources | `erp.routes.js:8560` | Piece-level, nested gold valuation, then body-level reason. |
| Reason validation | `erp.routes.js:8561` | Blank/missing reason raises `ValidationError("Purchase gold-rate override reason is required.")`. |
| Precision | `erp.routes.js:8562` | Approved GBW override is `requestedDecimal.toFixed(8)`; comparison itself has no tolerance. |
| Transaction | `erp.routes.js:8336` and subsequent route body | Transaction is opened before business persistence; override validation occurs before Asset/PO/journal writes. |
| Audit | `erp.routes.js:9034–9061` | Approved override is recorded in the audit chain with reference, approved rate, reason, and operator reason. |
| Persistence | `inventory-v2-runtime.service.js:364–388` | Purchase cost revision persists purchase rate, VAT base/amount, and total purchase cost; override reason is carried as audit evidence, not a silent Asset metadata field. |

Backend conclusion: validation and authority are fail-closed and internally coherent. The proven defect is the missing frontend contract participation.

