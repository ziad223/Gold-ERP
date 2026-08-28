# Arabic / English

| Locale | Label | Help/validation |
|---|---|---|
| AR | `سبب تعديل سعر شراء الذهب` | `أدخل سبب اختلاف السعر عن المرجع الحالي.` / `سبب تعديل سعر شراء الذهب مطلوب عند اختلاف السعر عن المرجع.` |
| EN | `Purchase Gold-Rate Override Reason` | `Enter why the purchase rate differs from the current reference.` / `A reason is required when the purchase gold rate differs from the reference.` |

Raw backend message mapping is scoped to the known reason-required message only; backend error semantics were not changed.

`AR_OVERRIDE_REASON_UI = PASS`  
`EN_OVERRIDE_REASON_UI = PASS`  
`RAW_BACKEND_ERROR_I18N = FIXED_SCOPED`

