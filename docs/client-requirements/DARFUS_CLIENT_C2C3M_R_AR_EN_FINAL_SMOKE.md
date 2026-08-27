# DARFUS ERP — C2C3M-R Arabic/English Final Smoke

## ملخص

لم يُستكمل smoke النهائي بعد ظهور عيب `branches.view`؛ هذا قرار توقف مقصود وليس تجاوزًا. لم تُرسل business POST في أي لغة.

## EN read-only smoke

| Check | Result |
|---|---|
| Login | 200 |
| Dashboard/layout | rendered |
| Asset detail route | rendered partially |
| Branch context | blocked: GET `/api/v1/branches` = 403 |
| Revision panel | not reached |
| Revision GET from browser | not emitted |
| Revision POST | 0 |
| Console | one application error for the 403 branches request; no hydration crash |

`EN_FINAL_SMOKE = BLOCKED_C2C3M_R_DEF_001`.

## AR read-only smoke

لم يبدأ بعد توقف control عند العيب المثبت في EN/B6/B7. لم يتم استخدام هذا التوقف لتوليد PASS غير مدعوم، ولم تُرسل أي POST عربية.

`AR_FINAL_SMOKE = NOT_RUN_AFTER_STOP`.

## Previously accepted scenarios

تم اعتماد B1–B5 وB8 في الأدلة السابقة، ولذلك لم تُعاد mutation أو سيناريوهاتها. هذا التقرير لا يعيد استخدام نجاح سابق لإثبات B6/B7.

## UI safety

- لا تم إنشاء revision.
- لا تم الضغط على create.
- لا تم تعديل Asset أو Barcode أو RFID أو Inventory أو Accounting.
- لا تم كشف كلمات مرور أو tokens.

## Final tokens

```text
EN_FINAL_SMOKE = BLOCKED_C2C3M_R_DEF_001
AR_FINAL_SMOKE = NOT_RUN_AFTER_STOP
AR_BUSINESS_POSTS = 0
EN_BUSINESS_POSTS = 0
BROWSER_CONSOLE_BLOCKERS = 1
NO_HYDRATION_CRASH = YES
```
