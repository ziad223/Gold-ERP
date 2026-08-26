# DARFUS ERP — C2C3M-R Permission and Browser Proof

## ملخص

تم تنفيذ الجزء المسموح فقط من قبول C2C3M-R على بيئة Disposable مع هويات اصطناعية. قاعدة `darfus_erp` بقيت للقراءة فقط، ولم تُنشأ Revision رسمية ولم تُرسل أي عملية أعمال. توقفت اختبارات المتصفح عند عيب مثبت يمنع تحميل Branch context قبل ظهور لوحة Revision.

## النطاق والـ provenance

| Item | Evidence |
|---|---|
| Frontend under test | `http://localhost:3003` production runtime، وليس Next dev |
| Backend under test | `http://localhost:8001` temporary runtime |
| Disposable DB | `darfus_c2c2_revision_runtime_02`، مثبت بواسطة `SELECT current_database()` |
| Official DB | `darfus_erp`، read-only |
| Synthetic identities | view-only و no-permission فقط؛ لا كلمات مرور أو tokens في هذا التقرير |
| Product/source edits | 0 |
| Official business writes | 0 |
| Revision create attempts | 0 |

## Permission catalog diagnostic

| Check | Result |
|---|---:|
| Source permission count | 152 |
| Official DB permission count | 152 |
| Missing permissions | 0 |
| Extra permissions | 0 |
| Metadata mismatches | 0 |
| Role binding gaps | 0 |
| `inventory.revision.view` | exactly once |
| `inventory.revision.create` | exactly once |
| Automatic reconciliation | not run |

`PERMISSION_CATALOG = IN_SYNC` و`PERMISSION_DRIFT_PREVENTION = PASS`.

## B6 — view-only browser/API proof

الهوية الاصطناعية امتلكت صلاحية Revision view وصلاحيات القراءة اللازمة للـshell، ولم تمتلك Revision create.

| Proof | Observed result |
|---|---|
| Login | HTTP 200 |
| Direct revisions GET | HTTP 200، total = 11 على الـclone |
| Revisions POST | HTTP 403 |
| Browser asset page | layout loaded، لكن `Branch readiness required` بقيت ظاهرة |
| Browser revisions request | لم تُرسل؛ `BranchContextGate` أوقف الوصول قبل اللوحة |
| Revision DB delta | 0 |

## B7 — no-permission browser/API proof

الهوية الاصطناعية لم تمتلك Revision view أو create.

| Proof | Observed result |
|---|---|
| Login | HTTP 200 |
| Direct revisions GET | HTTP 403 |
| Revisions POST | HTTP 403 |
| Browser asset page | layout loaded، لكن `Branch readiness required` بقيت ظاهرة |
| Browser revisions request | لم تُرسل؛ توقفت الصفحة عند Branch context |
| Revision DB delta | 0 |

## العيب المثبت الذي أوقف القبول

`C2C3M-R-DEF-001 = branches.view catalog/route mismatch`.

- `backend/src/routes/erp.routes.js` يربط `branches` بصلاحية `branches.view` لقوائم/قراءة الفروع.
- مصدر permission catalog وقاعدة البيانات الرسمية/الـclone لا يحتويان `branches.view`.
- طلب GET `/api/v1/branches` أعاد 403 لكلتا هويتي الاختبار.
- `contexts/branch-context.tsx` لا يعتبر Branch context جاهزًا دون نجاح طلب الفروع.
- `components/branch/branch-context-gate.tsx` يعرض `Branch readiness required` ويمنع بقية مسار الصفحة.

التصنيف: `PRODUCT_DEFECT / SECURITY / ACCEPTANCE_GAP`، الشدة `P1`، والأثر هو منع إثبات B6/B7 من المتصفح، وليس تجاوز الصلاحيات.

## التزام السلامة

لم تتم إضافة `branches.view` اصطناعيًا، لأن ذلك سيخفي تعارضًا حقيقيًا بين route وcatalog. لم يتم تعديل المصدر أو permission catalog أو DB.

## Final tokens

```text
B6_VIEW_ONLY_BROWSER = BLOCKED_BRANCH_CONTEXT_PERMISSION_GAP
B6_GET = 200
B6_POST = 403
B6_REVISION_DELTA = 0
B7_NO_PERMISSION_BROWSER = BLOCKED_BRANCH_CONTEXT_PERMISSION_GAP
B7_GET = 403
B7_CREATE_AUTHORITY = DENIED
B7_REVISION_DELTA = 0
C2C3M_R_DEFECT = C2C3M-R-DEF-001
PERMISSION_CATALOG = IN_SYNC
PERMISSION_DRIFT_PREVENTION = PASS
P0_COUNT = 0
P1_COUNT = 1
```
