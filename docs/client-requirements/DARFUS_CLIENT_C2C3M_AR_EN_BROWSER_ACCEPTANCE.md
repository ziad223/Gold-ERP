# DARFUS Client C2C3M — AR / EN Browser Acceptance

## English

| Check | Evidence | Status |
|---|---|---|
| Route | `http://localhost:3002/en/inventory/AST-PUR-1787083585731-1-1-plz5` 200 | PASS |
| Direction/locale | DOM `dir=ltr`, `lang=en` | PASS |
| Context | Gold ERP and Branch-1 visible | PASS |
| Revision list/detail | versions v1–v11 and `View details` controls visible | PASS |
| Editor | only Asset name, Description, Category, Brand, Notes | PASS |
| Review | review table and `Submit Revision` visible after a real diff | PASS — but the later closeout produced an unplanned 201 |
| B1–B5 | saved, no-op, one-result double submit, and stale conflict observed | PASS |
| Console | error/warn log empty | PASS |

Observed English stale message: `The Asset changed in another session. Refresh and review before submitting.`

## العربية

| الفحص | الدليل | الحالة |
|---|---|---|
| المسار | `http://localhost:3002/ar/inventory/AST-PUR-1787083585731-1-1-plz5` 200 | PASS |
| الاتجاه/اللغة | DOM `dir=rtl`, `lang=ar` | PASS |
| السياق | `Gold ERP` و`Branch-1` ظاهرين | PASS |
| قائمة Revision والتفاصيل | النسخ والسجل وأزرار عرض التفاصيل ظاهرة بالعربية | PASS |
| المحرر | أسماء الحقول الوصفية الخمسة فقط | PASS |
| المراجعة | نافذة `مراجعة Revision` ظهرت؛ لاحقًا سُجل POST 201 غير مقصود وأنشأ v11 للملاحظات | FAIL — unexpected disposable mutation |
| حماية الحقول | السعر والتكلفة والباركود والوزن والعيار والحالة والفرع والموقع موضحة كمسارات مستقلة | PASS |
| Console | سجل الخطأ/التحذير فارغ | PASS |

An Arabic review diff was prepared, but the final observed state includes one POST 201 and revision v11 changing `notes` to `C2C3M-AR-REVIEW-ONLY`. The row was not deleted or reversed. No official DB row was created.

## Permission coverage limitation

The admin session used for AR/EN has full access. A view-only user and an authenticated no-permission user were not available with usable credentials in the disposable runtime. Therefore the AR/EN permission-specific screens are not claimed as PASS.

```text
AR_ROUTE = PASS
AR_RTL = PASS
AR_EDITOR_REVIEW_NO_WRITE = FAIL_UNEXPECTED_DISPOSABLE_MUTATION
EN_ROUTE = PASS
EN_LTR = PASS
EN_B1_B5 = PASS
AR_EN_CONSOLE = PASS
AR_EN_PERMISSION_VARIANTS = BLOCKED_PRECONDITION
```
