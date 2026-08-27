# DARFUS ERP — C2C3M-R Network Wire Proof

## ملخص

تم تسجيل الطلبات المسموح بها فقط. لم تُرسل أي عملية Revision create أو أي mutation للأعمال. توقف wire proof الخاص بلوحة Revision في المتصفح لأن Branch context فشل قبل أن تُصدر الصفحة طلب revisions.

## Runtime provenance

| Runtime | Value |
|---|---|
| Browser | `http://localhost:3003` |
| Backend | `http://localhost:8001` |
| DB | `darfus_c2c2_revision_runtime_02`، مثبت بقراءة `current_database()` |
| Official DB | `darfus_erp` read-only؛ لا request mutation من هذا control |
| Secrets | لا token أو password أو Authorization value محفوظ هنا |

## Direct API wire

| Identity | Method | Endpoint | Status | Meaning |
|---|---|---|---:|---|
| Synthetic view-only | POST | `/api/v1/auth/login` | 200 | authenticated |
| Synthetic view-only | GET | revisions endpoint | 200 | view allowed، total 11 |
| Synthetic view-only | POST | revisions endpoint | 403 | create denied |
| Synthetic no-permission | POST | `/api/v1/auth/login` | 200 | authenticated |
| Synthetic no-permission | GET | revisions endpoint | 403 | view denied |
| Synthetic no-permission | POST | revisions endpoint | 403 | create denied |

لا توجد POST business receive أو revision create في هذا control.

## Browser/server correlation

| Browser event | Observed wire | Result |
|---|---|---|
| View-only login | `/api/v1/auth/login` = 200 | pass |
| View-only shell | settings = 200/304 | pass |
| View-only branch context | `/api/v1/branches` = 403 | blocker |
| No-permission login | `/api/v1/auth/login` = 200 | pass |
| No-permission shell | settings = 403 | expected denial |
| No-permission branch context | `/api/v1/branches` = 403 | blocker/denial |
| Revision GET from browser | not emitted | BranchContextGate stopped page |
| Revision POST from browser | not emitted | no mutation attempted |

## Root cause

الـroute يفرض `branches.view`، بينما canonical permission source/DB لا يحتوي هذه الصلاحية. لذلك لا يجوز تسجيل عدم ظهور Revision panel كفشل صلاحيات Revision نفسها؛ هو توقف سابق في Branch context.

## Final tokens

```text
BROWSER_NETWORK_WIRE_PROOF = BLOCKED_BROWSER_REVISION_WIRE_NOT_EMITTED
REQUEST_STATUS_EVIDENCE = CAPTURED
REVISION_POST_SENT = 0
BUSINESS_POST_SENT = 0
SECRETS_EXPOSED = NO
ROOT_CAUSE = C2C3M-R-DEF-001
```
