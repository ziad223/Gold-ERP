# DARFUS ERP — إعادة بناء نقطة ما قبل UI/UX والحالة الحالية لمتطلبات العميل

## ملخص تنفيذي

تم تنفيذ إعادة بناء قراءة فقط لمسار متطلبات العميل من آخر نقطة أعمال موثقة قبل برنامج UI/UX حتى أحدث حالة مقبولة. لم يتم تعديل كود المنتج أو الاختبارات أو الإعدادات أو قاعدة البيانات، ولم تُنفذ أي عملية أعمال أو Migration أو تنظيف Git.

النتيجة الأساسية:

- نقطة ما قبل UI/UX المثبتة هي **قبول Gift Voucher الرسمي لمسار واحد** ثم **استعادة عقد بدء الـmigration**؛ وليست إغلاقًا لمتطلبات العميل كاملة.
- أول سجل UI/UX فعلي تم العثور عليه هو UX0، بتاريخ ملف `2026-08-27 23:12:37`، وكان تدقيقًا بصريًا منفصلًا ومغلقه الأولي `BLOCKED` بسبب نقص دليل المتصفح.
- UX13 أُغلق كقبول بصري مع ثلاث ملاحظات P3 منفصلة، منها صيانة اختبار print قديم؛ لا يوجد UX14 معتمد.
- D2F لم يُغلق: عائق Gate A القديم أزيل جزئيًا بأدلة Gift Voucher الأحدث، لكن Gate A لم يُعاد تشغيله، وGate B/C/D لم تُنفذ.
- الحالة الحالية لا تبرر بدء تنفيذ جديد. نقطة العمل الآمنة الوحيدة المقترحة هي إعادة دخول D2F Gate A قراءةً فقط لإعادة تقييم جاهزية الإسقاط بعد تغيّر سلطة Gift Voucher.

### ملخص الحالة الحالية

| البند | الحالة الحالية | الدليل المختصر |
|---|---|---|
| متطلبات العميل | تدقيق parity مكتمل، المنتج غير مكتمل parity | Audit 02: 191 متطلبًا ذريًا، 48 Exact و60 Different و41 Partial و20 Missing و4 UI و10 Backend و4 Conflict و4 Owner Decision |
| مسار UI/UX | UX13 مقبول بصريًا، مع فروق دليل/ملاحظات P3 منفصلة | تقرير UX13، بوابة PASS مع P3=3 |
| Gift Voucher | قبول رسمي لمسار Voucher/Checkout واحد موجود، مع ملاحظات إغلاق دائم منفصلة | تقرير القبول الرسمي + سجل القرار |
| D2F | مفتوح / غير مكتمل | Gate A لم يُعد، Gate B/C/D لم تُنفذ |
| Employee/CRM | هوية الموظف مغلقة، CRM الكامل غير مكتمل؛ Attendance/Payroll/KPI غير مبدوءة | B1R + Audit 02 + غياب تقارير قبول لاحقة لهذه العائلات |
| الإنتاج | غير مقبول كمسار نشر نهائي | لا يوجد دليل نشر إنتاج لاحق ضمن هذه المراجعة |

## 1. نطاق المنهج ومصادر الدليل

تم الالتزام بالترتيب التالي:

1. تحديد أول Control فعلي لـ UI/UX من الملفات، لا افتراض أن UX-1 هو البداية.
2. قراءة `AGENTS.md` وتعليمات المشروع، و`PROJECT_PROGRESS_HANDOFF.md`.
3. مراجعة تقارير متطلبات العميل ومسارات B1/C1/C2/C3/C4/D1/E/D2/D2F وGift Voucher.
4. مراجعة تقارير UX0 حتى UX13 وسجلّات القرار والدليل والنجاح والمنع والأخطاء والحجب.
5. مطابقة الحالة الحالية مع المصدر، قاعدة البيانات، وواجهات الصحة GET فقط.

### السجلات الستة التي تمت مراجعتها

| السجل | الغرض |
|---|---|
| `docs/client-requirements/DARFUS_OWNER_DECISION_REGISTER.md` | قرارات المالك والقيود المفتوحة |
| `docs/client-requirements/DARFUS_CLOSED_EVIDENCE_REGISTER.md` | ما أُغلق وما بقي كفجوة دليل |
| `docs/client-requirements/DARFUS_SUCCESS_REGISTER.md` | نتائج البوابات المقبولة |
| `docs/client-requirements/DARFUS_ROOT_CAUSE_PREVENTION_REGISTER.md` | دروس المنع وتصنيف الأسباب |
| `docs/client-requirements/DARFUS_ISSUE_BLOCKER_REGISTER.md` | العيوب والحجب وDisposition |
| `docs/client-requirements/DARFUS_ERROR_REGISTER.md` | أخطاء التشغيل والأدلة التاريخية |

تم استخدام التقارير السابقة كدليل داعم فقط. لم تُستخدم لإلغاء سلطة Owner أو لإثبات Runtime جديد دون مطابقته مع الحالة الحالية.

## 2. الملفات المرجعية والاستمرارية

| المصدر | الحالة / الدليل |
|---|---|
| `I:\WORK\jewellery-erp-master\AGENTS.md` | السلطة الحالية: `darfus_erp`، منع الكتابة العادية، Asset authority، حماية `next-env.d.ts`، وعدم أوامر Git التدميرية |
| `I:\WORK\jewellery-erp-master\PROJECT_PROGRESS_HANDOFF.md` | 1105 سطرًا، SHA-256=`3F1DAD07FA8D66E5071FB5D9F7E613931F0D69C75F545199D65063C925D4BB47` |
| Audit 02 artifacts | مصفوفة parity وتقارير التعارض والـroadmap موجودة تحت `docs/client-requirements/` |
| UX0 report | أول تقرير UI/UX فعلي تم العثور عليه؛ `GATE=BLOCKED_DARFUS_UI_UX_UX0_BROWSER_EVIDENCE_INCOMPLETE` |
| Current UX13 report | آخر تقرير UI/UX؛ `GATE=PASS_DARFUS_UIUX_UX13_FINAL_VISUAL_ACCEPTANCE` |

`MASTER_WORKING_METHOD` أو تقرير continuity منفصل بالاسم المطلوب لم يوجد في جذر الوثائق بعد البحث المحدد؛ تم الاعتماد على `AGENTS.md` و`PROJECT_PROGRESS_HANDOFF.md` وسجلات المشروع الفعلية، مع تسجيل غياب الملف كفجوة توثيقية لا كافتراض.

## 3. نقطة التوقف السابقة لبداية UI/UX

### 3.1 آخر نقطة أعمال مثبتة قبل UX0

آخر نقطة قابلة للإثبات قبل أول تقرير UX هي:

1. إغلاق/قبول مسار Gift Voucher الرسمي المحدد بعملية إصدار واحدة وCheckout واحد على `darfus_erp`.
2. استعادة عقد بدء الـmigration في تقرير مستقل، مع إثبات clone-only للتجربة وعدم تغيير DB الرسمي.
3. بقاء parity الكامل لمتطلبات العميل غير مكتمل، وبقاء D2F محجوبًا بسلطة Gift Voucher وقتها.

الأدلة:

- `docs/client-requirements/DARFUS_GIFT_VOUCHER_OFFICIAL_END_TO_END_ACCEPTANCE_1000_01_REPORT.md` — بوابة `PASS_GIFT_VOUCHER_OFFICIAL_END_TO_END_ACCEPTANCE_1000`.
- `docs/DARFUS_MIGRATION_STARTUP_CONTRACT_RESTORATION_01_REPORT.md` — بوابة `PASS_DARFUS_MIGRATION_STARTUP_CONTRACT_RESTORATION`.
- تقرير D2F وGate A القديمان يثبتان أن إغلاق Gift Voucher/Invoice Projection كان لا يزال شرطًا متسلسلًا.

### 3.2 ما كان مغلقًا قبل UI/UX

| المسار | الحالة عند نقطة ما قبل UX0 | ملاحظة |
|---|---|---|
| Client Requirements Audit 02 | مغلق كتدقيق | لا يعني أن المنتج حقق parity |
| Safety/Prevention Gate 00 | مغلق | منهج التنفيذ الآمن فقط |
| B1 Employee Identity/Attribution | مغلق بعد B1R | هوية/إسناد، وليس Payroll |
| C1 Barcode | Read-first مغلق مع فروق | Revision/tag/status parity الكامل لم يكن مغلقًا |
| C2 Revision service/API | مغلق | قبول UI النهائي لم يكن مكتملاً في تلك اللحظة |
| D1 Unified Invoice Projection | قيد الإغلاق/ثم أُغلق لاحقًا | لا يساوي D2F الكامل |
| E CGP Projection | قيد الإغلاق/ثم أُغلق لاحقًا | print layout النهائي بقي منفصلًا |
| D2 Search/Print active scope | تقرير قبول موجود | D2F Gate A/B/C/D لم يكن مغلقًا |
| Gift Voucher | سلطة مالية/تنفيذية قيد الحسم ثم قُبل مسار رسمي لاحقًا | لا يُستنتج منه إغلاق D2F تلقائيًا |

### 3.3 ما بقي مفتوحًا حينها

- D2F Gate A: سلطة Gift Voucher، الإسقاط، tax/accounting/source authority.
- D2F Gate B: benchmark/cache/large dataset.
- D2F Gate C: print/reprint runtime mutation acceptance.
- D2F Gate D: final 59-row closure.
- بقية parity الخاصة بالموظفين وCRM وBarcode revision/tag details.
- ملاحظات print/reprint وGift Voucher المالية الدائمة.

## 4. لماذا بدأ مسار UI/UX؟

الدليل لا يدعم تفسيرًا بأن UI/UX بدأ لأن متطلبات العميل أصبحت مكتملة. الذي تثبته الملفات هو أن UI/UX أصبح مسارًا منفصلًا بعد وجود أساس أعمال مقبول جزئيًا، مع بقاء D2F وفجوات parity مفتوحة.

أول Control فعلي هو:

`docs/client-requirements/ui-ux/DARFUS_UI_UX_MODERNIZATION_UX0_FULL_READ_ONLY_AUDIT_01_REPORT.md`

وكانت حالته الأولى:

- `CURRENT_CONTROL = DARFUS-UIUX-UX0-FULL-READ-ONLY-AUDIT-01`
- `GATE = BLOCKED_DARFUS_UI_UX_UX0_BROWSER_EVIDENCE_INCOMPLETE`
- `P1 = 6_OPEN_OR_EVIDENCE_GAPS`
- `P2 = 2_OPEN_OR_EVIDENCE_GAPS`

إذًا السبب المثبت لبدء البرنامج هو فتح مسار بصري/تجربة مستخدم مستقل لإدارة الكثافة، الثيمات، التنقل، الوصولية، والاستجابة، وليس إعلان اكتمال المنتج التجاري. كما أن توصيات التقارير السابقة كانت Owner-gated، ولم تكن تفويضًا تلقائيًا لمسار جديد.

## 5. خط زمني UX0 → UX13

| المرحلة | النتيجة الحالية | الدليل / الملاحظة |
|---|---|---|
| UX0 | Audit أولي محجوب | نقص browser evidence؛ P1/P2 مفتوحان |
| UX0B | Design research/evidence closeout محجوب | بقيت مراجعة Owner/دليل قبل UX1 |
| UX1 | مواصفة Design System وprototypes PASS | لم يكن rollout إنتاجيًا تلقائيًا |
| UX1R | refinement بصري PASS | Owner visual approval مطلوب للمراحل التالية |
| UX2 | semantic token foundation PASS | نطاق `app/globals.css` فقط حسب التقرير |
| UX3 | shell/navigation PASS | لم تتغير business/API/DB authorities |
| UX4 | core components مطبق | UX4B كشف عيب focus؛ UX4C أصلحه وأغلقه |
| UX5 | POS presentation PASS | presentation-only |
| UX5C | POS visual corrections PASS | business/payment/checkout مجمد |
| UX5D | Gift Voucher visual clarity PASS | لا تغيير state machine أو calculation |
| UX5B | populated POS evidence PASS | fixture معزول، لا بيانات أعمال جديدة |
| UX6 | Inventory/Asset presentation PASS | Asset/Barcode/status authority محفوظة |
| UX6B | Asset tag dark-mode correction PASS | إصلاح بصري scoped مع prevention gate |
| UX7 | Customers/Suppliers presentation PASS مع waiver | Tablet populated evidence ناقص، Owner waiver صريح |
| UX7B | Tablet evidence BLOCKED | viewport حقيقي غير متاح |
| UX7C | Tablet direct proof BLOCKED | session بلا Branch context |
| UX7 waiver | مغلق بقبول Owner للفجوة | لا يحول الدليل الناقص إلى PASS تقني |
| UX8 | Gold Center presentation PASS/مغلق pending review | gold authority لم تتغير |
| UX9 | Accounting/Treasury presentation PASS | financial meaning لم يتغير |
| UX10 | Settings/Audit presentation PASS | settings/audit authority محفوظة |
| UX11 | Print/Preview presentation PASS | fixed-format isolation محفوظ |
| UX11B | evidence closeout BLOCKED | direct components/print fixture غير متاحين |
| UX11C | disposable harness BLOCKED contractually | 16/17 بسبب stale test navigation |
| UX12 | cross-module regression BLOCKED أوليًا | print runner/build evidence ناقص |
| UX12B | build/raw evidence recovery PASS لاحقًا | build exit 0، config exclusion/repair موثق |
| UX13 | final visual acceptance PASS | P0/P1/P2 جديد=0، P3=3 منفصلة |

### ملاحظات UX13 التي لا يجب إخفاؤها

تقرير UX13 أبقى هذه المسارات منفصلة:

1. `DARFUS-GIFT-VOUCHER-FINANCIAL-MAPPING-PERSISTENCE-001` — P3/open register.
2. `CGP-PRINT-RECOVERY-UI-001` — P3/open register.
3. `UX11C-PRINT-EXPORT-STALE-NAVIGATION-TEST-001` — P3/test maintenance.

UX7 أُغلق بــ `CLOSED_WITH_OWNER_EVIDENCE_WAIVER`، وليس بدليل Tablet مباشر مكتمل.

## 6. مسارات الأعمال اللاحقة ودرجة إغلاقها

### 6.1 ما أُغلق لاحقًا بأدلة مستقلة

| المسار | النتيجة |
|---|---|
| B1 Employee Identity/Attribution | أُغلق بعد disposable runtime proof؛ لا يشمل Payroll |
| C2C2 Revision Service/API | أُغلق disposable؛ security/idempotency/scoping مثبتة |
| C3 Common Profile Fields | أُغلق كـcommon additive foundation |
| C4 Tag Profile Parity | أُغلق للملفات الخمسة |
| D1 Unified Invoice Projection | أُغلق GET/read-only projection |
| E CGP Invoice Projection | أُغلق projection؛ print layout النهائي بقي منفصلًا |
| D2 active Search/Print | بوابة D2 PASS، مع فروق D2F منفصلة |
| Gift Voucher authority/schema/official named flow | سلطة الأعمال والقبول الرسمي لمسار محدد مثبتان |
| UX0 → UX13 | مسار UI/UX مقبول حسب كل بوابة، مع فروق evidence/waiver/P3 مسجلة |

### 6.2 حالات لا يجوز اعتبارها مغلقة

- D2F الكامل.
- D2F Gate A بعد تغيّر سلطة Gift Voucher.
- D2F Gate B benchmark/cache.
- D2F Gate C print/reprint mutation acceptance.
- D2F Gate D final 59-row closure.
- Gift Voucher permanent financial mapping prevention.
- CGP repeated print/recovery UI.
- Employee Attendance/Leave/Payroll/KPI.
- CRM الكامل، segmentation، loyalty، communication، merge/consent.

## 7. مصفوفة supersession وعدم الخلط

| الحالة القديمة | الدليل الأحدث | ما الذي تغيّر | ما الذي لم يتغيّر |
|---|---|---|---|
| D2F Gate A محجوب بسبب Gift Voucher authority | تقرير GV authority + official E2E | عائق السلطة لمسار محدد أصبح أوضح/مقبولًا | D2F Gate A نفسه لم يُعاد تشغيله |
| C2/C3 browser blocker بسبب permission/next-env | permission reconciliation + UX12B | بعض عوائق البيئة/الكاتالوج أزيلت | لا يوجد تقرير C2C3M نهائي لاحق يثبت إغلاق المسار |
| UX0/UX12B blocked evidence | UX12B/UX13 | أدلة build/raw/browser اللاحقة حسّنت وأغلقت UX visual gates | لا تُعاد كتابة الحقيقة التاريخية للتقارير المحجوبة |
| D2 search/print PASS | D2F artifacts | D2 active scope قُبل | Gift Voucher unified projection/print الكامل بقي شرط D2F |
| GV early financial ambiguity | official named E2E | المسار المحدد قُبل رسميًا | الوقاية الدائمة وإسقاط D2F ليست مغلقة تلقائيًا |

القاعدة المستخدمة: supersession يغيّر حالة العائق فقط إذا كان الدليل الأحدث يغطي نفس العقد ونفس النطاق؛ لا يحوّل prerequisite غير المعاد اختباره إلى PASS.

## 8. D2F — فصل Gates A/B/C/D

| Gate | الحالة الحالية | الدليل | الأثر |
|---|---|---|---|
| Gate A — Gift Voucher inheritance/projection readiness | `BLOCKER_REMOVED_GATE_NOT_RERUN` | تقارير GV الأحدث أزالت جزءًا من الغموض؛ تقرير D2F Gate A الموجود قديم ومحجوب | يجب إعادة تقييمه قبل أي Gate لاحق |
| Gate B — large dataset/cache/benchmark | `NOT_RUN_SEQUENTIAL_GATE_A_BLOCKED` | لا benchmark نهائي مرتبط بإعادة Gate A | لا يجوز إعلان performance readiness |
| Gate C — print/reprint runtime mutation acceptance | `NOT_RUN_SEQUENTIAL_GATE_A_BLOCKED` | لا print mutation رسمي ضمن D2F | لا يجوز إعلان print/reprint parity كامل |
| Gate D — final 59-row closure | `NOT_RUN / FINAL_GATE_NOT_REACHED` | لم تُغلق Gates السابقة | full invoice client scope مفتوح |

### ما يحتاجه D2F قبل القبول

- إعادة Gate A قراءةً فقط بالسلطة الحالية.
- إثبات أن Gift Voucher projection/print source authority لا تنشئ مالكًا ثانيًا.
- بعد PASS صريح فقط، تشغيل B ثم C ثم D بتفويض مستقل لكل مرحلة.

## 9. Gift Voucher — فصل الأبعاد

| البعد | الحالة | التفسير |
|---|---|---|
| Business contract | محدد/مجمد | authority reports وOwner decisions |
| Schema | موجود/مروّج حسب التقارير اللاحقة | لا يعني اكتمال D2F projection |
| Financial mapping للمسار الرسمي | مثبت لمسار named official E2E | لا يساوي permanent prevention |
| Official E2E | PASS لمسار Voucher/Checkout واحد | لا Voucher أو Checkout إضافي ضمن هذا التحكم |
| POS integration | PASS للمسار المسمى | لا يُعمم على كل الحالات غير المختبرة |
| Tax/accounting/treasury/inventory/idempotency/audit | PASS للمسار المسمى | دليل نطاقي، لا إغلاق لكل D2F |
| Unified invoice projection/search/print | غير مكتمل في D2F | لا يوجد Gate A rerun لاحق يثبت الإغلاق |
| Print/reprint | مسار منفصل | لا equate بين E2E المالي وإغلاق print |
| Persistence prevention | مفتوح | `DARFUS-GIFT-VOUCHER-FINANCIAL-MAPPING-PERSISTENCE-001` |

## 10. CGP وحالة الـInvoice

| البعد | الحالة الحالية |
|---|---|
| CGP core business | مقبول في مسار DRAFT → VALIDATED → POSTED حسب السلطة المجمدة |
| CGP approval | لا تُعاد Approval؛ validation/post permission/confirmation هي السلطة المقبولة |
| CGP projection | مغلق كتوقع read-only في E |
| CGP invoice search/print | البيانات جاهزة جزئيًا، لكن D2F الكامل لم يُغلق |
| repeated print/recovery | مفتوح كمسار منفصل `CGP-PRINT-RECOVERY-UI-001` |
| rollback/recovery semantics | durable recovery/compensation بعد publication، لا حذف أحداث |

لا يوجد دليل يسمح بدمج CGP business aggregate مع Generic Invoice أو اعتبار projection مالكًا ثانيًا.

## 11. Employees / HR / CRM

### Employees

| العائلة | الحالة |
|---|---|
| Employee Identity Foundation | مغلقة بعد B1R |
| Employee Code / operator attribution | مغلق ضمن الهوية والإسناد المثبت |
| User/Auth/RBAC | السلطة التقنية محفوظة؛ لا shared branch account |
| Employee Documents/expiry/timeline/statistics | غير مقبول كتنفيذ كامل ضمن الأدلة الحالية |
| Attendance/Devices/Leave | غير مبدوءة كمسارات مقبولة |
| Payroll/Payroll Accounting | غير مبدوءة كمسارات مقبولة |
| Performance/KPI | غير مبدوءة كمسارات مقبولة |

### CRM

Customer Master الحالي ليس CRM كاملًا. الدليل يدعم وجود أساس Customer وقراءة بعض التكاملات، لكنه لا يثبت اكتمال:

- Customer 360 timeline متكامل لكل domains.
- Segmentation dynamic/manual.
- Loyalty earn/redeem/adjust/expire.
- Communication Center.
- Merge/archive/reactivate مع history preservation.
- Consent/privacy/document/alert coverage الكامل.

التصنيف الحالي: `PARTIAL` للأساس الحالي، و`NOT_STARTED` للعائلات CRM الثقيلة التي لا يوجد لها قبول مستقل.

## 12. الحالة الحالية للمصدر وDB وRuntime

### 12.1 Source / Worktree

| الحقل | القيمة | ملاحظة |
|---|---|---|
| Branch | `main` | قراءة فقط |
| HEAD | `1657b0e9ba580faef69be48f04637835c201b521` | لم يتغير في هذا التحكم |
| Worktree status lines | 1022 | dirty مسبقًا |
| Tracked status entries | 140 | لا ownership للتغييرات السابقة |
| Untracked entries | 882 | محفوظة كما هي |
| Stash count | 11 | لم يتم استخدام أو تعديل stash |
| `tsconfig.json` SHA-256 | `75F32EC1BB8C2CCA788D3F27A3ED81B200BD157F49F199B541316188BCFB16AC` | أثر سابق موثق في UX12B |
| `next-env.d.ts` SHA-256 | `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651` | drift generated مقبول/محمي؛ لم يُعدّل |
| Source changes this control | 0 | التقرير هو artifact توثيقي فقط |

### 12.2 Runtime

| Service | Status | Health | Errors | Evidence |
|---|---|---|---|---|
| Frontend `localhost:3000` | UP | HTTP 200 | لا خطأ HTTP في probe | `GET /ar/dashboard` |
| Backend `localhost:8000` | UP | HTTP 200 | لا خطأ في health probe | `GET /api/v1/health` |
| DB health | UP | HTTP 200 | لا خطأ اتصال | `GET /api/v1/health/db` |
| Redis | UP | HTTP 200 | لا خطأ اتصال | `GET /api/v1/health/redis` |
| Gold Center | UP | HTTP 200 | response صحي | `GET /api/v1/health/gold` |
| `darfus-backend` | running | container Up | لا restart ضمن هذا probe | Docker status |
| `darfus-postgres` | running/healthy | PostgreSQL 16 container | لا خطأ health | Docker status |
| `darfus-redis` | running/healthy | Redis 7 container | لا خطأ health | Docker status |

ملاحظة: عدم ظهور خطأ في probe لا يثبت parity لكل workflow؛ هو إثبات صحة اتصال/خدمة فقط.

### 12.3 Official DB قراءة فقط

إثبات الهوية الحالي عبر Docker/PostgreSQL:

`current_database() = darfus_erp`

`current_user = postgres`

| Entity | Current count | ملاحظة |
|---|---:|---|
| companies | 1 | DB state |
| branches | 2 | DB state |
| users | 1 | DB state |
| suppliers | 2 | يختلف عن snapshot قديم؛ لا attribution لهذا control |
| customers | 3 | DB state |
| employees | 0 | لا Employee master rows حاليًا |
| assets | 23 | DB state |
| inventory_asset_movements | 82 | DB state |
| purchase_orders | 19 | DB state |
| purchase_order_items | 19 | DB state |
| invoices | 10 | DB state |
| payments | 20 | DB state |
| journal_entries | 73 | DB state |
| journal_lines | 200 | DB state |
| audit_logs | 315 | DB state |
| idempotency_requests | 161 | DB state |
| gift_vouchers | 5 | DB state |
| asset_barcode_history | 23 | table موجود؛ عدّ rows الحالي |
| asset_current_valuations | 19 | DB state |
| asset_purchase_cost_revisions | 23 | DB state |
| SequelizeMeta | 93 | migration metadata count |

مقارنةً بتقرير UX12B الأقدم، لوحظت فروق حالية في بعض الأرقام (مثل movements 82 مقابل 81، journals 73 مقابل 72، lines 200 مقابل 195، idempotency 161 مقابل 160). هذه فروق بين snapshots زمنية، ولا يوجد دليل أنها نتجت من هذا التحكم؛ هذا التحكم لم يرسل business POST ولم يكتب DB.

## 13. Current Master / Feature Matrix

| # | المسار الحالي | الحالة | الدليل / الحد |
|---:|---|---|---|
| 1 | Client Requirements Audit 02 | CLOSED_AS_AUDIT | 191 atomic requirements مفهرسة |
| 2 | Safety Prevention Gate 00 | CLOSED | منهج السلامة فقط |
| 3 | B1 Employee Identity | CLOSED | B1R disposable proof |
| 4 | C1 Barcode Read-first | CLOSED_WITH_ACCEPTED_VARIANCE | parity gaps ما زالت موثقة |
| 5 | C2 Revision Service/API | CLOSED | C2C2 report |
| 6 | C2C3 Revision UI/browser | PARTIAL / rerun missing | blocker السابق أزيل جزئيًا بلا closeout نهائي |
| 7 | C3 Common Profile | CLOSED | common foundation |
| 8 | C4 Tag Profile | CLOSED | five profile tags |
| 9 | D1 Unified Invoice Projection | CLOSED | D1R GET runtime |
| 10 | E CGP Invoice Projection | CLOSED_WITH_ACCEPTED_VARIANCE | projection مغلق، print layout منفصل |
| 11 | D2 Search/Print active scope | CLOSED_WITH_ACCEPTED_VARIANCE | D2 gate PASS، D2F ليس مغلقًا |
| 12 | D2F full invoice scope | OPEN | Gift Voucher/D2F scope incomplete |
| 13 | D2F Gate A | BLOCKER_REMOVED_GATE_NOT_RERUN | يحتاج إعادة دخول RO |
| 14 | D2F Gate B | NOT_RUN | Gate A sequence |
| 15 | D2F Gate C | NOT_RUN | Gate A sequence |
| 16 | D2F Gate D | NOT_RUN | final 59-row gate لم يصل |
| 17 | Gift Voucher authority | CLOSED_FOR_NAMED_AUTHORITY | لا يعادل D2F close |
| 18 | Gift Voucher official named E2E | CLOSED_WITH_ACCEPTED_VARIANCE | مسار واحد محدد فقط |
| 19 | Gift Voucher mapping prevention | OPEN | prevention register منفصل |
| 20 | CGP core business | CLOSED_AS_ACCEPTED_CORE | invoice artifact منفصل |
| 21 | CGP repeated print/recovery | OPEN | `CGP-PRINT-RECOVERY-UI-001` |
| 22 | Employee identity/attribution | CLOSED | لا Payroll |
| 23 | Attendance/Leave | NOT_STARTED | لا قبول مستقل |
| 24 | Payroll/Payroll Accounting | NOT_STARTED | لا قبول مستقل |
| 25 | KPI/Performance | NOT_STARTED | لا قبول مستقل |
| 26 | CRM Customer Master/360 foundation | PARTIAL | Customer ليس full CRM |
| 27 | CRM segmentation/loyalty/communication/merge | NOT_STARTED | لا قبول مستقل |
| 28 | Production/deployment acceptance | OPEN | لا production closure مثبت |
| 29 | Final client parity | NOT_STARTED | implementation track لم يبدأ ككل |
| 30 | Final handover | NOT_STARTED | لا final handover closure مثبت |

إجمالي صفوف الحالة الحالية: 30.

## 14. Dependency Graph

```text
Employee Identity Foundation
  ├─> Employee attribution on invoices
  ├─> Employee attribution on CGP
  └─> Employee filter/reporting
       (لا يفرض Attendance أو Payroll أولًا)

Customer Identity
  ├─> Invoice Search customer filter
  ├─> CGP customer reference
  └─> CRM foundation / 360 read model

Invoice Projection Foundation (D1)
  ├─> CGP Invoice Projection (E)
  └─> Unified Search/Print (D2)
       └─> D2F Gate A: Gift Voucher authority
            ├─> Gate B: large dataset/cache proof
            ├─> Gate C: print/reprint acceptance
            └─> Gate D: final 59-row closure

Barcode decision / revision history
  └─> exact barcode parity and Item Revision contract

Gift Voucher financial prevention
  └─> permanent D2F projection/print confidence (separate from named E2E)

UX13
  └─> returns to Client Requirements track; does not authorize D2F automatically
```

## 15. نقاط القوة المثبتة

| Strength | Evidence | الأثر التشغيلي |
|---|---|---|
| فصل سلطة Asset عن Product quantity | AGENTS + inventory closure reports | يحمي physical inventory authority |
| RBAC/user authority محفوظة | Batch A + B1 + current guardrails | يمنع shared-account weakening |
| accounting double-entry محفوظ | D1/E/D2/GV reports؛ journal proofs للمسارات المقبولة | يقلل خطر قبول UI دون financial authority |
| وجود idempotency وعقود recovery | B1/C2/GV/UX prevention evidence | يدعم exactly-once والـcompensation بدل الحذف |
| مسارات visual scoped | UX2–UX13 reports | التغييرات البصرية بقيت منفصلة عن business logic |
| Owner waiver موثق لا يخفي الفجوة | UX7 waiver | يميّز missing evidence عن product PASS |
| migration startup contract واضح | migration restoration report | يقلل automatic migration risk |
| official DB identity قابلة للإثبات | current `current_database()=darfus_erp` + health/db | يتيح attribution واضحًا للقراءة الحالية |

## 16. نقاط الضعف والفجوات المثبتة

| Weakness | Evidence | Impact | Category |
|---|---|---|---|
| D2F sequence لم يُستأنف بعد تغيّر Gift Voucher authority | Gate A القديم + غياب rerun | full invoice scope غير محسوم | Architecture / Product |
| Gift Voucher named E2E لا يغلق persistence prevention | register + UX13 | احتمال تكرار mapping defect في مسار مستقبلي | Financial / Provider-like config |
| CGP invoice projection لا يساوي print/recovery closure | E + D2F + open register | search/print lifecycle غير مكتمل بالكامل | Financial / UX |
| Revision UI final browser acceptance غير مكتمل الدليل | C2C3M blocker history، لا rerun نهائي موجود | revision client parity غير مثبتة | UX / Acceptance |
| Employee domain أوسع بكثير من الهوية المقبولة | Audit 02 + عدم وجود تقارير Payroll/Attendance | HR requirements غير منفذة | Architecture / Data |
| Customer Master لا يساوي CRM | Audit 02 + غياب CRM closure | 360/loyalty/communication gaps | CRM |
| worktree dirty بدرجة عالية | 140 tracked و882 untracked | attribution/forensic review أصعب | Observability / Process |
| print evidence ما زال به stale test item | UX11C/UX13 | false negative في acceptance tooling | Observability / Testing |

## 17. Priority Matrix

التصنيف التالي يخص الفجوات الحالية المثبتة، وليس كل متطلبات العميل كعيوب تنفيذية.

| ID | Issue | Area | Classification | Severity | Priority | Evidence | Blocks Inventory Work? |
|---|---|---|---|---|---|---|---|
| PR-001 | D2F Gate A لم يُعاد تشغيله بعد إزالة عائق Gift Voucher الجزئي | Invoice scope | ACCEPTANCE_GAP | blocking sequence | P2 | D2F Gate A old report + later GV reports | No |
| PR-002 | D2F Gate B/C/D لم تُنفذ | Invoice scope | ACCEPTANCE_GAP | incomplete closure | P2 | `NOT_RUN_SEQUENTIAL_GATE_A_BLOCKED` | No |
| PR-003 | Gift Voucher financial mapping prevention مفتوحة | Gift Voucher | FINANCIAL / ACCEPTANCE_GAP | recurring-risk | P2 | owner/success/root-cause registers | No |
| PR-004 | CGP repeated print/recovery UI مفتوح | CGP | ACCEPTANCE_GAP | workflow gap | P2 | `CGP-PRINT-RECOVERY-UI-001` | No |
| PR-005 | C2C3M final browser/UI proof غير معاد بعد إزالة بعض blockers | Revision | ACCEPTANCE_GAP | proof gap | P2 | C2C3M report + permission reconciliation | No |
| PR-006 | CRM الكامل وHR families غير مبدوءة | Client parity | MISSING / PARTIAL | foundational scope | P2 | Audit 02 + no closure reports | No |
| PR-007 | UX7 populated Tablet evidence waived | UX evidence | ACCEPTANCE_GAP | residual risk accepted | P3 | Owner waiver | No |
| PR-008 | print-export stale navigation test يحتاج صيانة | Testing | TEST_GAP | non-blocking | P3 | UX11C/UX13 register | No |
| PR-009 | فرق snapshots الحالية مقابل UX12B غير منسوبة لهذا control | Observability | UNKNOWN_EXTERNAL_DELTA | evidence caveat | P3 | current DB counts vs older report | No |

لا يوجد P0 أو P1 جديد مثبت في هذا التحكم. عدم وجود P0/P1 لا يعني أن product parity اكتملت.

## 18. اقتراح العمل التالي — Control واحد فقط

### `NEXT_SAFE_CONTROL`

`D2F_GATE_A_CURRENT_STATE_REENTRY_AND_PROJECTION_READINESS_RECHECK`

### لماذا هذا هو الاختيار الآمن

- هو أقدم dependency غير مغلق بعد ظهور أدلة Gift Voucher الأحدث.
- يختبر ما إذا كان عائق Gate A انتهى فعلاً دون القفز إلى benchmark أو print mutation.
- لا يعيد تنفيذ UI/UX المغلق.
- لا يبدأ CRM أو Employee HR أو production.
- يمكن تنفيذه قراءةً فقط أولًا، مع GET/source/DB reconciliation.

### شروطه قبل البدء

1. Owner authorization صريح لهذا الـcontrol الجديد.
2. عدم إرسال POST/PUT/PATCH/DELETE أو إجراء print mutation.
3. مراجعة تقارير Gift Voucher الأحدث مع عقد D2F وD1/E/D2.
4. إثبات current DB identity وcompany/branch context وruntime parity قراءةً فقط.
5. إذا بقيت أي سلطة مالية أو projection ambiguity، يبقى Gate A محجوبًا ولا يبدأ B/C/D.

### لا يُسمح ببدئه تلقائيًا

نجاح هذا الاقتراح لا يعني تفويض Gate B أو C أو D. كل Gate لاحق يحتاج قرارًا ونطاقًا مستقلًا.

## 19. Gate الحالي لإعادة البناء

هذا Gate يقيس اكتمال reconstruction، لا اكتمال product parity.

| شرط | النتيجة |
|---|---|
| Pre-UIUX checkpoint identified | YES |
| First actual UX control identified | YES — UX0 |
| Timeline UX0→UX13 reconstructed | YES |
| Later work/supersession separated | YES |
| D2F A/B/C/D separated | YES |
| Gift Voucher dimensions separated | YES |
| CGP projection/print/recovery separated | YES |
| Employee/CRM/HR state mapped | YES |
| Current source/DB/runtime RO evidence | YES |
| No source/test/product mutation | YES |
| No DB/business mutation | YES |
| One next safe control identified | YES |

## 20. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PRE-UIUX-TO-CURRENT-STATE-RECONSTRUCTION-01
MODE = READ_ONLY_FORENSIC_CONTINUITY_RECONSTRUCTION

PRE_UIUX_CHECKPOINT_PROVEN = YES
PRE_UIUX_CHECKPOINT = OFFICIAL_GIFT_VOUCHER_E2E_PLUS_MIGRATION_STARTUP_CONTRACT_RESTORATION
FIRST_UIUX_CONTROL = DARFUS-UIUX-UX0-FULL-READ-ONLY-AUDIT-01
LATEST_ACCEPTED_UIUX_CONTROL = DARFUS-UIUX-UX13-FINAL-VISUAL-ACCEPTANCE-01
UIUX_PROGRAM_STATE = CLOSED_PENDING_OWNER_REVIEW_OF_NON_BLOCKING_OPEN_ITEMS

CLIENT_REQUIREMENTS_AUDIT_02 = PASS_AS_AUDIT_NOT_PRODUCT_PARITY
TOTAL_CLIENT_REQUIREMENTS_AT_AUDIT_02 = 191
PRODUCT_EXACT_PARITY = NOT_COMPLETE

D2F_GATE_A = BLOCKER_REMOVED_GATE_NOT_RERUN
D2F_GATE_B = NOT_RUN_SEQUENTIAL_GATE_A_BLOCKED
D2F_GATE_C = NOT_RUN_SEQUENTIAL_GATE_A_BLOCKED
D2F_GATE_D = NOT_RUN_FINAL_GATE_NOT_REACHED
FULL_INVOICE_CLIENT_SCOPE = OPEN_PARTIAL

GIFT_VOUCHER_NAMED_OFFICIAL_E2E = PASS
GIFT_VOUCHER_PERMANENT_MAPPING_PREVENTION = OPEN
CGP_CORE = ACCEPTED
CGP_PROJECTION = CLOSED
CGP_REPEATED_PRINT_RECOVERY = OPEN

EMPLOYEE_IDENTITY_ATTRIBUTION = CLOSED
EMPLOYEE_ATTENDANCE_LEAVE = NOT_STARTED
EMPLOYEE_PAYROLL_ACCOUNTING = NOT_STARTED
EMPLOYEE_KPI_PERFORMANCE = NOT_STARTED
CUSTOMER_FOUNDATION_CRM = PARTIAL
CUSTOMER_CRM_EXTENDED_CAPABILITIES = NOT_STARTED

OFFICIAL_DATABASE = darfus_erp
DATABASE_REACHABLE = YES
CURRENT_DATABASE_PROOF = current_database()=darfus_erp
CURRENT_DB_USERS = 1
CURRENT_DB_COMPANIES = 1
CURRENT_DB_BRANCHES = 2
CURRENT_DB_SUPPLIERS = 2
CURRENT_DB_CUSTOMERS = 3
CURRENT_DB_EMPLOYEES = 0
CURRENT_DB_ASSETS = 23
CURRENT_DB_MOVEMENTS = 82
CURRENT_DB_INVOICES = 10
CURRENT_DB_PAYMENTS = 20
CURRENT_DB_JOURNALS = 73
CURRENT_DB_JOURNAL_LINES = 200
CURRENT_DB_GIFT_VOUCHERS = 5
CURRENT_DB_IDEMPOTENCY_REQUESTS = 161
CURRENT_DB_MIGRATION_METADATA = 93

CURRENT_RUNTIME_FRONTEND = HTTP_200_LOCALHOST_3000
CURRENT_RUNTIME_BACKEND = HTTP_200_LOCALHOST_8000
CURRENT_RUNTIME_DB_HEALTH = HTTP_200
CURRENT_RUNTIME_REDIS_HEALTH = HTTP_200
CURRENT_RUNTIME_GOLD_HEALTH = HTTP_200

WORKTREE_BRANCH = main
WORKTREE_HEAD = 1657b0e9ba580faef69be48f04637835c201b521
WORKTREE_STATUS = DIRTY_PREEXISTING
TRACKED_STATUS_ENTRIES = 140
UNTRACKED_ENTRIES = 882
STASH_COUNT = 11

SOURCE_FILES_CHANGED_THIS_CONTROL = 0
TEST_FILES_CHANGED_THIS_CONTROL = 0
PRODUCT_SOURCE_MUTATION_THIS_CONTROL = 0
BUSINESS_DB_WRITES_THIS_CONTROL = 0
MIGRATIONS_CREATED_THIS_CONTROL = 0
MIGRATIONS_EXECUTED_THIS_CONTROL = 0
GIT_DESTRUCTIVE_ACTIONS_THIS_CONTROL = 0

CURRENT_MASTER_TRACK_ROWS = 30
CURRENT_MASTER_CLOSED = 10
CURRENT_MASTER_CLOSED_WITH_ACCEPTED_VARIANCE = 4
CURRENT_MASTER_PARTIAL = 2
CURRENT_MASTER_OPEN = 4
CURRENT_MASTER_BLOCKER_REMOVED_GATE_NOT_RERUN = 1
CURRENT_MASTER_NOT_RUN = 3
CURRENT_MASTER_NOT_STARTED = 6

P0_COUNT = 0
P1_COUNT = 0
P2_COUNT = 6
P3_COUNT = 3
P4_COUNT = 0

NEXT_SAFE_CONTROL = D2F_GATE_A_CURRENT_STATE_REENTRY_AND_PROJECTION_READINESS_RECHECK
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START

GATE = PASS_PRE_UIUX_TO_CURRENT_STATE_RECONSTRUCTION
```

## 21. الخاتمة

تم إنشاء هذا التقرير توثيقيًا فقط. لم يتم إصلاح أي فجوة، ولم يتم فتح أي batch لاحق، ولم يتم تنفيذ أي Receive أو Invoice أو Payment أو Print mutation أو Migration.

**FULL FORENSIC RECONSTRUCTION COMPLETE → OWNER REVIEW → PRIORITY DECISION → WAIT FOR EXPLICIT APPROVAL**

`NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`

توقف.
