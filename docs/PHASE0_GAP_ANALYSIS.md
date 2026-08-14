# DARFUS Jewellery ERP — Phase 0 Gap Analysis
> تقرير تدقيق قبل أي تعديل. لا DB reset، لا إعادة بناء، تعديلات Surgical فقط.
> تاريخ: 2026-06-19. المرجع: «ملف البرنامج.docx» (DARFUS Approved Vision) + خطة الـ11 مرحلة.

## 0. حالة المستودع (خطر عام يجب حله أولاً)
- مجلد `.git` **فارغ** — لا يوجد commits ولا HEAD. عملياً لا يوجد version control.
- **الخطر:** أي تعديل Surgical بدون git = لا rollback، لا diff، لا أمان. هذا يناقض هدف «بدون كسر النظام».
- **التوصية (قبل Phase 1):** `git init` + commit أولي لكامل الحالة الحالية (snapshot)، ثم فرع لكل مرحلة.

---

## 1. ما هو موجود فعلاً (الأساس قوي ومتقدم)
البنية الحالية أنضج بكثير من نقطة الصفر. الموجود:

**Backend** (Express + Sequelize + PostgreSQL@5433):
- 46 model، 12 service، routes موحدة (`erp.routes.js` 5429 سطر).
- محرك ترحيل مالي ناضج: `posting.service.js` (double-entry متوازن، يرفض غير المتوازن)، `sales.service.js` (مصدر واحد للحساب)، `settings.service.js` (مصدر واحد للإعدادات).
- Treasury (cashTransaction)، Payments، Journal (entry+line)، Invoice+Items.
- أنواع فواتير لها models: Installment، GiftVoucher، Reservation، CustomerGoldPool، InventoryGoldPool.
- Audit immutable: `audit.service.js` بسلسلة hash + hooks تمنع التعديل/الحذف.
- RBAC: Role، Permission، RolePermission، UserRole، Permission service.
- StockMovement، Transfer، StockAudit، ManufacturingOrder، AssetEvent (event store)، AssetAttachment/Certificate.
- Realtime SSE (`events.service.js`)، Notifications، Gold (`gold.service.js` + GoldFixing + GoldPrice).
- 17 migration (آخرها 2026-06-19)، كلها additive. idempotency_key موجود على Invoice + checkout.

**Frontend** (Next.js 16):
- صفحات: dashboard, pos, inventory(+[id]/adjustments/manufacturing/stock-audit/transfers), sales(+returns/exchanges/installments/gift-vouchers/reservations/customer-gold), accounting(+treasury), customers(+[id]/loyalty), employees(+[id]/payroll), suppliers(+purchases), reports(+exports), gold-center, audit, approvals, notifications, settings(+users).
- Settings tabs جاهزة: Company Profile، Branches، Payment Methods، Receipt Layout، Barcode Settings + Barcode Template Settings.
- Printing: BarcodePrintTemplate، InvoicePrintTemplate، ReceiptPrintTemplate، ReportPrintTemplate، BarcodeLabelPreview، ReceiptPreview.
- 18 hook، 4 context (auth/erp/settings/theme)، i18n ar+en.

---

## 2. الناقص / الفجوات (مرتبة حسب المرحلة)

| المرحلة | موجود | فجوة فعلية | خطورة |
|---|---|---|---|
| **P1 أمان** | ترحيل transactional متوازن، audit hash chain، idempotency جزئي | `erp.controller.js logAudit()` يكتب AuditLog بدون hash/prevHash → **سلسلة الـaudit مكسورة** (verifyChain=false). idempotency غير معمم على كل العمليات المالية | **عالي** (سلامة بيانات) |
| **P2 Settings** | Company/Branches/Payments/Receipt/Barcode tabs | إعدادات Gold Price ليست داخل Settings (في gold-center)؛ Printing Templates غير قابلة للإدارة من Settings (مكوّدة)؛ **تفضيلات أعمدة الجرد localStorage-only** (`darfus-inventory-columns-v1`) — يخالف القاعدة | متوسط |
| **P3 Inventory** | 6 أنواع، StockMovement، باركود فريد، AssetEvent | حالات ناقصة في `asset.model` ENUM: الموجود `available/reserved/sold/repair/transferred/melted/archived` — **ناقص `pending_transfer`، `returned`، `pending_tag`**؛ لا نوع `other`/custom | متوسط–عالي |
| **P4 Sales** | كل أنواع الفواتير لها صفحات+models، multi-payment جزئي | **لا توجد دورة Draft → Post → Cancel-Before-Post**: invoice ينشأ مُرحَّلاً فوراً (status enum: paid/partial/due/returned/cancelled — لا draft/posted). هذا أكبر فجوة معمارية | **عالي** |
| **P5 Accounting** | posting متوازن، Treasury، VAT ديناميكي | **محاسبة الذهب حسب العيار غير مطبقة** (حساب واحد بدل Inventory/COGS/Revenue لكل 18/21/22/24)؛ عرض document amount مقابل journal total يحتاج توضيح في واجهة المحاسبة | متوسط |
| **P6 Customers** | ملف موحد، ledger، loyalty، history service | شبه مكتمل؛ تحسين منع التكرار (phone/code/name hints) | منخفض |
| **P7 Printing** | قوالب كمكوّنات React | **لا Barcode Label Designer ولا إدارة قوالب Settings-driven/قابلة للاختيار/versioned** | متوسط |
| **P8 Reports** | صفحات تقارير + exports | التأكد من اعتماد بيانات حقيقية بالكامل وتطابق export مع المعروض + تطبيق الصلاحيات على print/export | متوسط |
| **P9 Dashboard** | صفحة dashboard | التأكد أنه read-only فقط (لا POST/PUT/DELETE من widgets) | منخفض |
| **P10 Permissions** | RBAC models + service | Edit-after-post (permission+reason+revision) جزئي؛ سلسلة audit مكسورة (نفس P1) | عالي |
| **P11 Future** | لا government/RFID/licensing | مقصود — لا يُبنى الآن، فقط interfaces نظيفة | — |

---

## 3. الخطر لو نُفِّذ كل شيء مرة واحدة
- تغيير `asset.status` ENUM دفعة واحدة قد يكسر استعلامات/فلاتر البيع والجرد الحالية.
- إدخال دورة Draft/Post تلمس POS checkout + posting + inventory + customer balance معاً → أعلى خطر كسر.
- تقسيم حسابات الذهب حسب العيار يغيّر CHART والـpostInvoiceEntry → خطر على توازن القيود التاريخية.
- بدون git = لا تراجع آمن.

---

## 4. الأولويات المقترحة (تنفيذ تدريجي بـ stop-gate لكل مرحلة)
1. **P0.1 — git init + snapshot** (شبكة أمان، إلزامي قبل الكود).
2. **P1 — إصلاح سلسلة Audit** (`logAudit` يمر عبر `audit.service.record`) + تعميم idempotency. خطر منخفض، قيمة سلامة عالية.
3. **P3 — إضافة حالات المخزون الناقصة** (additive ENUM: pending_transfer/returned/pending_tag) + قواعد منع البيع. migration additive فقط.
4. **P2 — نقل تفضيلات الأعمدة من localStorage إلى Settings** + ربط Gold Price داخل Settings.
5. **P4 — دورة Draft/Post/Cancel** (الأكبر، يأتي بعد استقرار 1–3).
6. **P5 — محاسبة الذهب حسب العيار** (CHART إضافي، non-destructive).
7. **P7 — Barcode Label Designer + إدارة قوالب من Settings.**
8. **P8/P9/P10 — تدقيق التقارير، تثبيت read-only للداشبورد، edit-after-post.**

---

## 5. الملفات الأكثر عرضة للتعديل لكل مرحلة
- **P1:** `backend/src/controllers/erp.controller.js` (logAudit)، `backend/src/services/audit.service.js`.
- **P3:** `backend/src/models/asset.model.js` + migration جديدة additive، فلاتر البيع في `erp.routes.js`/POS.
- **P2:** `app/[locale]/(dashboard)/inventory/page.tsx`، `contexts/settings-context.tsx`، settings routes.
- **P4:** `erp.routes.js` (/pos/checkout، /sales/invoices/draft)، `invoice.model.js` (status)، `sales.service.js`، `posting.service.js`، POS page.
- **P5:** `posting.service.js` (CHART + postInvoiceEntry)، migration حسابات العيار.
- **P7:** `features/printing/*`، `features/barcodes/*`، settings page.

---

## قاعدة التنفيذ
لا انتقال لمرحلة قبل اعتماد المرحلة السابقة. بعد كل مرحلة: (الملفات المعدلة، سبب كل تعديل، ما اختُبر، المخاطر).
