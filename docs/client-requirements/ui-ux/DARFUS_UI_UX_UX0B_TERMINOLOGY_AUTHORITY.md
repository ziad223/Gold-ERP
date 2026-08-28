# UX-0B Terminology Authority

| DARFUS concept | Arabic UI term | English UI term | Technical term retained? | Business data exempt? | Reason / affected areas |
|---|---|---|---|---|---|
| Asset | أصل | Asset | Yes | IDs/codes remain source | serialized inventory authority |
| Inventory | المخزون | Inventory | No | stored names exempt | module label |
| Customer | العميل | Customer | No | names exempt | CRM/POS/invoices |
| Supplier | المورد | Supplier | No | supplier name exempt | purchasing/receive |
| Making charge | المصنعية | Making Charge | No | no | financial meaning |
| Gift Voucher | قسيمة هدية | Gift Voucher | No | voucher code exempt | POS/sales |
| VAT | ضريبة القيمة المضافة | VAT | Yes, when useful | rates/codes exempt | tax/settings/transactions |
| Journal Entry | قيد اليومية | Journal Entry | Yes, when useful | source IDs exempt | accounting |
| Customer Gold Purchase | شراء الذهب من العميل | Customer Gold Purchase (CGP) | Acronym retained with expansion | source references exempt | CGP |
| Barcode | باركود | Barcode | Yes | barcode value exempt | inventory/tag/POS |
| RFID | RFID | RFID | Yes | RFID value exempt | asset/tag |
| Branch | الفرع | Branch | No | branch value exempt | company/branch context |
| Location | الموقع | Location | No | location value exempt | inventory |

Ambiguous terms requiring Owner review before UX-1: `Stock` vs `Inventory`, `Item` vs `Asset` in user-facing copy, and whether `Tax Treatment` should be `المعاملة الضريبية` or the fuller VAT label in each context. No translation source was modified.

`TERMINOLOGY_AUTHORITY = PROPOSED_FROZEN_FOR_UX1_REVIEW`
