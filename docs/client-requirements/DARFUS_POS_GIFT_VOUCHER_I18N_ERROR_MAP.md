# Gift Voucher Error Map

| Stable source | Locale key | AR | EN | User-visible raw server text? |
|---|---|---|---|---|
| HTTP 404 / `GIFT_VOUCHER_NOT_FOUND` | `notFound` | القسيمة غير موجودة | Gift voucher not found | No |
| `GIFT_VOUCHER_NOT_REDEEMABLE` | `notRedeemable` | القسيمة غير متاحة للاستخدام | Gift voucher is not available for redemption | No |
| `GIFT_VOUCHER_BRANCH_INELIGIBLE` | `branchIneligible` | القسيمة غير متاحة لهذا الفرع | Gift voucher is not available for this branch | No |
| `GIFT_VOUCHER_CURRENCY_MISMATCH` | `currencyMismatch` | عملة القسيمة لا تطابق عملة الفاتورة | Gift voucher currency does not match the invoice currency | No |
| `GIFT_VOUCHER_FULL_VALUE_REQUIRED` | `fullValueRequired` | يجب استخدام قيمة القسيمة كاملة | The voucher must be used for its full value | No |
| `GIFT_VOUCHER_CANONICAL_SPLIT_REQUIRED` | `unsupportedPaymentMethod` | القسيمة غير متاحة مع طريقة السداد المحددة حاليًا. | Gift Voucher is not available with the selected payment method. | No |
| missing client code | `missingCode` | أدخل كود القسيمة أولًا | Enter a gift voucher code first | No |
| checkout before verification | `verifyBeforeCheckout` | يرجى التحقق من القسيمة أولًا | Verify the gift voucher first | No |
| voucher exceeds invoice | `valueExceedsInvoice` | قيمة القسيمة تتجاوز إجمالي الفاتورة | Voucher value exceeds the invoice total | No |
| unknown error/status | `generic` | تعذر التحقق من القسيمة حاليًا | Gift voucher validation failed | No |

The map is code/status based. It deliberately does not use the backend message as
a locale fallback.

