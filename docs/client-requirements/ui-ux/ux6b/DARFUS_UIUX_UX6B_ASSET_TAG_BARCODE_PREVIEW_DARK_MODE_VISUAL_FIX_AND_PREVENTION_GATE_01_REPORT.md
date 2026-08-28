# DARFUS ERP — UX-6B Asset Tag / Barcode Preview Dark Mode Report

## أسئلة الإغلاق المختصرة

- هل أُعيد إنتاج المشكلة قبل التعديل؟ نعم، على نفس الأصل في EN وAR Dark Mode.
- ما السبب الحقيقي؟ سطح `.barcode-tag-face` الداخلي كان شفافًا ويرث ألوان التطبيق؛ SVG الباركود شفاف الخلفية وبـbars سوداء.
- كم Production file تغيّر؟ ملف إنتاج واحد فقط.
- هل تغيّرت قيمة أو خوارزمية Barcode؟ لا.
- هل تغيّرت Tag data أو Print behavior؟ لا.
- هل بقي Light صحيحًا؟ نعم.
- هل تم إصلاح Dark؟ نعم، بعزل سطح الطباعة الداخلي.
- هل AR/EN وDesktop/Tablet/Mobile وPrint Preview نجحت؟ نعم، ضمن الأدلة المسجلة.
- هل تم لمس `darfus_erp`؟ لا؛ business/financial/inventory writes = 0.
- هل rollback جاهز؟ نعم، parity قبل/بعد نجح في نسخة معزولة.

## 1. Executive Summary

تم إصلاح عيب بصري ضيق في معاينة Asset Tag/Barcode داخل Asset Detail. التعديل محصور في CSS المضمّن داخل `ClientBarcodeTagTemplate.tsx`: خلفية ورقية بيضاء، لون حبر داكن، وعزل عن Dark Mode. لم يتغير أي محتوى أو قيمة أو توليد أو طباعة أو منطق أعمال.

`GATE = PASS_DARFUS_UIUX_UX6B_ASSET_TAG_BARCODE_PREVIEW_DARK_MODE_VISUAL_FIX_AND_PREVENTION_GATE`

## 2. Owner Observation

Light Mode كان مقروءًا، بينما Dark Mode كان يعرض مساحة الوسم الداخلية شفافة/داكنة مع نص فاتح وباركود أسود منخفض التباين. العيب مصنف `VISUAL_DEFECT` في `INVENTORY / ASSET DETAIL / TAG PREVIEW`، وليس ضوضاء تجميلية.

## 3. Read First

تمت قراءة Control UX-6B كاملًا، وتعليمات المشروع، وhandoff، ومنهج التنفيذ، وسجلات UX2–UX6، وBarcode/Tag Profile/Item Revision، ومصادر Asset detail/tag/barcode/print/theme والاختبارات ذات الصلة قبل التعديل. التفاصيل في `DARFUS_UX6B_READ_FIRST.md`.

## 4. Baseline

- HEAD: `1657b0e9ba580faef69be48f04637835c201b521`.
- تم التقاط `git status --short` و`diff --stat` و`diff --name-only` قبل التعديل.
- الـworktree كان متسخًا مسبقًا؛ لم يتم reset/restore/clean/stash.
- قبل snapshot: `backups/ui-ux/PRE_UX6B_TAG_PREVIEW_20260828T114038Z/`.
- قبل hash للملف المستهدف: `C17B7F290EE981E6EA00D794921F6C78ABF0D648722F7D497D438B610AD12B4E`.

## 5. Reproduction

Asset: `AST-PUR-1787912070001-1-1-13rw`; Barcode: `GWBGL22000001`.

قبل التعديل: face background `rgba(0,0,0,0)`, face color `rgb(241,245,249)`, SVG background transparent، وظهر Dark preview منخفض التباين. Light preview كان مقروءًا. `DEFECT_REPRODUCED = YES`.

## 6. Authority Map

`Asset detail → ClientAssetTagPreview → assetToTagData → ClientBarcodeTagTemplate → BarcodeTagFront/Back → ScannableBarcode`.

التوليد بقي في `ScannableBarcode` عبر bwip-js، والبيانات بقيت من Asset mapper، والطباعة بقيت عبر `renderPrintDocument` و`printHtmlDocument` مع `isAuthorized("printBarcode")`.

## 7. Root Cause

`ROOT_CAUSE = THEME_ISOLATION_FAILURE_ON_INNER_BARCODE_TAG_FACE`.

الثقة `HIGH`: سبب المصدر وcomputed styles والصورة قبل التعديل متطابقة. القاعدة السابقة عرّفت layout/border فقط، دون background/foreground مضمونين للوجه الداخلي؛ لذلك ورث الوجه Dark Mode، بينما SVG الباركود شفاف الخلفية.

## 8. Frozen Contracts

Asset identity، Barcode value/generator/symbology/checksum، tag payload، weights/karat/item label، print handler/route/output business content، Asset lifecycle، Inventory/Receiving/Movement/Transfer/Workshop/Reservation/POS/GBW/Accounting/Tax/Permissions/API/DB بقيت دون تغيير.

## 9. Before Evidence

أدلة EN/AR Light/Dark desktop وAR Dark tablet/mobile محفوظة في snapshot. أدلة preview المركزة توضح العيب نفسه على نفس البيانات؛ لا mutation صُنعت لأجل الصورة.

## 10. Files Changed

Production: `features/printing/components/ClientBarcodeTagTemplate.tsx` فقط.

Test: `tests/ux6b-asset-tag-preview-theme.test.cjs` فقط.

لم يتغير `ClientAssetTagPreview.tsx` أو `ScannableBarcode.tsx` أو mapper أو `app/globals.css` أو backend/API/DB.

## 11. Minimum Fix

أضيفت داخل `.barcode-tag-face` فقط: `background:#ffffff`, `color:#111827`, `color-scheme:light`, `forced-color-adjust:none`، مع خلفية/لون صريحين لحاوية barcode وSVG. لا يوجد hardcoded business data أو إعادة توليد للباركود.

## 12. Theme Isolation

بعد الإصلاح في Light وDark: face background `rgb(255,255,255)`، face foreground `rgb(17,24,39)`، SVG background `rgb(255,255,255)`، وSVG fill `rgb(0,0,0)`. `HTML_PREVIEW_THEME_ISOLATION = PASS`; `SVG_PREVIEW_THEME_ISOLATION = PASS`; `CANVAS_PREVIEW_THEME_ISOLATION = NOT_APPLICABLE`.

## 13. Barcode Readability

القيمة بقيت `GWBGL22000001`، bars سوداء على أبيض، quiet zone والمساحة والـhuman-readable code ظلت ظاهرة دون clipping في لقطات المتصفح. لا ندعي scanner acceptance. `BARCODE_VISUAL_READABILITY = PASS`.

## 14. Tag Readability

وصف القطعة `22K Gold Bangle`، karat/weight، barcode text، وحقول tag الخلفية أصبحت مقروءة في Dark وLight. `TAG_TEXT_READABILITY = PASS`.

## 15. Light

Light ظل صحيحًا قبل وبعد، دون تغير data أو layout business. `LIGHT_MODE_PREVIEW = PASS`; `LIGHT_MODE_REGRESSION = NO`.

## 16. Dark

Dark أصبح shell داكنًا مع tag paper surface فاتح وعالي التباين. `DARK_MODE_PREVIEW = PASS`; `DARK_MODE_CONTRAST_DEFECT = CLOSED`.

## 17. AR/EN

AR وEN نجحا في browser الحقيقي؛ chrome بقي locale-correct، والقيمة نفسها بقيت. `UX6B_AR = PASS`; `UX6B_EN = PASS`.

## 18. RTL/LTR

اتجاه الوسم يتبع locale، لكن barcode symbol/text بقي LTR ولم يُعكس. `BARCODE_DIRECTION_CHANGED_BY_RTL = NO`; `UX6B_RTL_LTR = PASS`.

## 19. Responsive

Desktop وTablet وMobile نجحت. في القياس النهائي: tablet body/client `925/925`، mobile `459/459`؛ overflow ظل محصورًا في wrapper الحالي. `UX6B_DESKTOP = PASS`; `UX6B_TABLET = PASS`; `UX6B_MOBILE = PASS`.

## 20. Print Preview

المعاينة والشاشة المطبوعة تستخدمان نفس template/renderer، و`data-print-root` وglobal scoped print rules لم تتغير. سطح الوسم صار print-safe حتى أثناء Dark Mode. `PRINT_PREVIEW_VISUAL_PARITY = PASS`; `PRINT_BEHAVIOR_CHANGED = NO`; `PHYSICAL_PRINT_TRIGGERED = NO`.

## 21. Accessibility

زر `Print tag`/`طباعة التاج` بقي permission-gated وkeyboard reachable، والقيمة النصية للباركود ظاهرة، والـcontrast لا يعتمد على اللون وحده. `UX6B_ACCESSIBILITY = PASS`.

## 22. Console/Hydration

Browser logs لم تسجل application errors أو hydration errors. رسائل React DevTools/HMR المتوقعة في بيئة التطوير ليست failures. `CONSOLE_APPLICATION_ERRORS = 0`; `HYDRATION_ERRORS = 0`.

## 23. Focused Tests

`node --test tests/ux6b-asset-tag-preview-theme.test.cjs` → `4/4 PASS`.

## 24. Barcode/Tag Regression

Barcode parity، Tag Profile، وAsset identity selection → PASS. القيمة/المولد/mapper/print permission بقيت محفوظة.

## 25. UX6 Regression

UX-6 focused/regression selection → PASS، وInventory Count لم يُفتح.

## 26. Cross-Module Regression

POS Asset/barcode consumption، Inventory، Receiving/unified intake، tag/print consumers، GBW، Asset، Barcode، Revision، وUX4C selection → PASS.

## 27. Typecheck/Build

- `npm run typecheck` → PASS.
- `npm run build` → PASS; Next.js generated 130/130 routes.
- `git -c safe.directory=I:/WORK/jewellery-erp-master diff --check` → PASS؛ line-ending warnings فقط.

## 28. Main DB Safety

`SELECT current_database()` → `darfus_erp`. لا receive/Asset/barcode/print mutation أو DB write أو migration أو seed أو restart أو deployment. `MAIN_DB_CONTROL_OWNED_BUSINESS_WRITES=0`, `MAIN_DB_CONTROL_OWNED_FINANCIAL_WRITES=0`, `MAIN_DB_CONTROL_OWNED_INVENTORY_WRITES=0`.

## 29. Same-Defect-Class Audit

تم فحص Tag Preview، Barcode SVG، RFID display، QR branch source path، Generic BarcodePrintTemplate، وreceipt/document preview surfaces. تم إصلاح السطح المثبت فقط؛ الأسطح الأخرى محفوظة ومُسجلة دون توسيع UX-6B.

`UX6_THEME_ISOLATION_AUDIT = COMPLETE`.

## 30. Permanent Prevention Gate

تم إنشاء `DARFUS-PREVIEW-THEME-ISOLATION-GATE-001`: لا يجوز إغلاق أي embedded/fixed-format preview من screenshot للصفحة الأم فقط؛ يجب إثبات Light/Dark، AR/EN، responsive، print contrast، theme boundary، وثبات business/encoded value.

## 31. High-Risk Visual Checklist

تم إنشاء checklist يشمل embedded preview، Barcode/QR، print surface، disabled/error/selected/empty، dense table، long identifiers، RTL، mobile، وsame-state Light/Dark. `EMBEDDED_COMPONENT_VISUAL_GATE=CREATED`; `HIGH_RISK_VISUAL_CHECKLIST_ADDED=YES`.

## 32. Root Cause Prevention Entry

تمت إضافة entry للعيب `DARFUS-ASSET-TAG-PREVIEW-DARK-MODE-CONTRAST-001` مع root cause، enabling condition، minimum fix، prevention gate، test، وaffected modules. `ROOT_CAUSE_PREVENTION_ENTRY=COMPLETE`.

## 33. After Snapshot

`backups/ui-ux/UX6B_TAG_PREVIEW_20260828T114038Z/` يحوي source/test snapshots، صور AR/EN Light/Dark، responsive captures، hash manifest، build/test evidence، prevention artifacts، وrollback rehearsal. `UX6B_AFTER_SNAPSHOT=PASS`.

## 34. Rollback

في `rollback-rehearsal/`: restored-before hash = `C17B7F290EE981E6EA00D794921F6C78ABF0D648722F7D497D438B610AD12B4E`، after/reapplied hash = `5A6530F4180E8B18C42DC77D3E892C7AB1A0344485B1EF242AE99CACE6E95B04`. `UX6B_ROLLBACK_REHEARSAL=PASS`; `UX6B_BEFORE_HASH_PARITY=PASS`; `UX6B_AFTER_HASH_PARITY=PASS`.

## 35. Registers

تم تحديث Change Ledger وRollback Register وسجلات Success/Error/Issue/Root Cause/Owner Decision/Closed Evidence توثيقيًا. تمت إضافة قاعدة أن embedded high-risk visual components تحتاج Light/Dark proof مستقل.

## 36. Gate

`P0 = 0`; `P1 = 0`; `P2 = 0`; `P3 = 0` في هذا التحكم بعد إغلاق العيب.

`ISSUE_STATUS = CLOSED`.
`UX6_STATUS = CLOSED`.
`GATE = PASS_DARFUS_UIUX_UX6B_ASSET_TAG_BARCODE_PREVIEW_DARK_MODE_VISUAL_FIX_AND_PREVENTION_GATE`.

## 37. Final Tokens

```text
CURRENT_CONTROL = DARFUS-UIUX-UX6B-ASSET-TAG-BARCODE-PREVIEW-DARK-MODE-VISUAL-FIX-AND-PREVENTION-GATE-01
ISSUE_ID = DARFUS-ASSET-TAG-PREVIEW-DARK-MODE-CONTRAST-001
MODE = MINIMUM_SAFE_VISUAL_FIX_WITH_PERMANENT_THEME_ISOLATION_PREVENTION
EXECUTE_THIS_CONTROL = YES
READ_FIRST = YES
DEFECT_REPRODUCED = YES
TAG_BARCODE_PREVIEW_AUTHORITY_MAP = COMPLETE
ROOT_CAUSE = THEME_ISOLATION_FAILURE_ON_INNER_BARCODE_TAG_FACE
ROOT_CAUSE_CONFIDENCE = HIGH
PRE_UX6B_GIT_STATE_CAPTURED = YES
UX6B_BEFORE_SNAPSHOT = PASS
UX6B_BEFORE_HASH_MANIFEST = PASS
PRODUCTION_SOURCE_FILES_CHANGED = 1
PRODUCTION_CHANGE_SCOPE = MINIMUM
PREVIEW_CONTENT_SEMANTICS_CHANGED = NO
BARCODE_VALUE_CHANGED = NO
BARCODE_GENERATION_CHANGED = NO
TAG_DATA_CHANGED = NO
PRINT_BEHAVIOR_CHANGED = NO
ASSET_AUTHORITY_CHANGED = NO
INVENTORY_LOGIC_CHANGED = NO
API_CHANGED = NO
DATABASE_CHANGED = NO
MIGRATIONS = 0
HTML_PREVIEW_THEME_ISOLATION = PASS
SVG_PREVIEW_THEME_ISOLATION = PASS
CANVAS_PREVIEW_THEME_ISOLATION = NOT_APPLICABLE
BARCODE_VISUAL_READABILITY = PASS
TAG_TEXT_READABILITY = PASS
LIGHT_MODE_PREVIEW = PASS
LIGHT_MODE_REGRESSION = NO
DARK_MODE_PREVIEW = PASS
DARK_MODE_CONTRAST_DEFECT = CLOSED
UX6B_AR = PASS
UX6B_EN = PASS
BARCODE_DIRECTION_CHANGED_BY_RTL = NO
UX6B_RTL_LTR = PASS
UX6B_DESKTOP = PASS
UX6B_TABLET = PASS
UX6B_MOBILE = PASS
PRINT_PREVIEW_VISUAL_PARITY = PASS
PHYSICAL_PRINT_TRIGGERED = NO
UX6B_ACCESSIBILITY = PASS
CONSOLE_APPLICATION_ERRORS = 0
HYDRATION_ERRORS = 0
UX6B_FOCUSED_TESTS = PASS
BARCODE_REGRESSION = PASS
TAG_PROFILE_REGRESSION = PASS
ASSET_IDENTITY_REGRESSION = PASS
UX6_REGRESSION = PASS
CROSS_MODULE_REGRESSION = PASS
TYPECHECK = PASS
BUILD = PASS
MAIN_DB_CONTROL_OWNED_BUSINESS_WRITES = 0
MAIN_DB_CONTROL_OWNED_FINANCIAL_WRITES = 0
MAIN_DB_CONTROL_OWNED_INVENTORY_WRITES = 0
UX6_THEME_ISOLATION_AUDIT = COMPLETE
PERMANENT_THEME_ISOLATION_GATE_CREATED = YES
EMBEDDED_COMPONENT_VISUAL_GATE = CREATED
SAME_STATE_LIGHT_DARK_EVIDENCE = PASS
HIGH_RISK_VISUAL_CHECKLIST_ADDED = YES
ROOT_CAUSE_PREVENTION_ENTRY = COMPLETE
UX6B_AFTER_SNAPSHOT = PASS
UX6B_CHANGE_LEDGER_UPDATED = YES
UX6B_ROLLBACK_REHEARSAL = PASS
UX6B_BEFORE_HASH_PARITY = PASS
UX6B_AFTER_HASH_PARITY = PASS
P0 = 0
P1 = 0
P2 = 0
P3 = 0
ISSUE_STATUS = CLOSED
UX6_STATUS = CLOSED
GATE = PASS_DARFUS_UIUX_UX6B_ASSET_TAG_BARCODE_PREVIEW_DARK_MODE_VISUAL_FIX_AND_PREVENTION_GATE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 38. STOP

تم إيقاف التنفيذ بعد التقرير. لا تغيير Barcode، لا تغيير business/print behavior، لا DB، لا migration، ولا بدء UX-7 تلقائيًا.

