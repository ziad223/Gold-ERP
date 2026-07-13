# حزمة استيضاح المتطلبات وقرارات الاعتماد — Phase 32.5
## DARFUS Jewellery ERP — Client / Owner / Accountant Clarification Pack

> وثيقة توضيحية فقط. لم يتم تنفيذ أو تعديل أو حذف أي شيء. الغرض: عرض ما تم إنجازه، وما يحتاج قراركم قبل استكمال العمل.

---

## أولًا — ملخص تنفيذي للعميل (بلغة بسيطة)

النظام في حالة متقدمة وجاهز للعرض في معظم الوظائف الأساسية:

- **تم إنجازه ويطابق متطلباتكم:** فاتورة المبيعات، المرتجع، الاستبدال، التقسيط، العربون، قسيمة الهدية، شراء الذهب من العميل، البحث والطباعة الموحّد للفواتير، نظام الباركود والتاج (وجه/ظهر)، أصناف المخزون (ذهب بالوزن/بالقطعة، ألماس، أحجار كريمة، لؤلؤ)، الأساس المحاسبي والضريبة (VAT 5%)، كشف حساب العميل، الخزينة، اللغتان العربية والإنجليزية مع الاتجاهين، والدفع المتعدد.
- **يحتاج استكمالًا:** وحدة شراء الذهب من المورد (IGP)، توسعة إدارة علاقات العملاء (CRM)، مؤشرات أداء الموظفين وربط البائع بالفاتورة، لوحة المعلومات الموحّدة وسعر السوق، ومطابقة نهائية لشكل الفاتورة (عمود الضريبة لكل بند + توقيع البائع + ختم الشركة).
- **يحتاج قرار العميل:** العملة (SAR أم AED)، أسلوب التسعير (سعر عالمي/تجزئة)، اعتماد الساعات، صيغة عرض الباركود، أبعاد التاج والطابعة، ونطاق CRM/الموظفين/اللوحة.
- **يحتاج قرار المحاسب:** المعالجة المحاسبية للمبلغ المتبقي غير المدفوع من فاتورة العربون.
- **مبدئي (بموافقة المالك بانتظار تأكيد العميل):** نوع «الساعات» (WT/WCH/00)، وعيار الأصناف السائبة.
- **مؤجّل:** الفوترة الحكومية الإماراتية (ملفاتها لم تعد ضمن مجلد المتطلبات الحالي — يلزم تأكيدكم).
- **بنية داخلية لا يجب حذفها:** الصلاحيات، سجل التدقيق، محرك الترحيل المحاسبي، منع تكرار العمليات، خدمات المطابقة، وحماية هوية الباركود. هذه ضرورية لصحّة وأمان النظام حتى وإن لم تُذكر بالاسم في مستنداتكم.

> ملاحظة: لم نختبر التوافق مع طابعة فعلية؛ لا نؤكد توافق طابعة/دقة طباعة (DPI) دون اختبار مادي.

---

## Response Status (updated Phase 32.5-Requirements-Delta — 2026-07-10)

**Evidence RE-001** (owner-supplied consolidated client/accountant approval) resolved the **reservation** decisions only:
- **Approved:** 7 (AD-002, CD-026, CD-027, CD-028, CD-029, CD-030, SD-008) — reservation accounting, multiple payments, expiry/auto-cancel, refund, renewal/repricing, multi-item add/remove/replace, permissions/notifications.
- **Rejected:** 0 · **Deferred:** 0 · **Conflicting:** 0.
- **Pending:** all other decisions (AD-001 deposit-invoice GL, CD-001…CD-025, SD-001…SD-007).
- **Critical unresolved:** AD-001 (deposit-invoice remainder GL), CD-018 (IGP), CD-001 (currency SAR/AED).
- **Configuration pending (not blockers):** reservation liability account code; final tax posting config; reservation permission assignments.

**Source-set update:** +3 requirement files (`9- Audit System`, `10 - Reports`, `11- Setting`) — 30 files total. See `PHASE-32.5-REQUIREMENTS-DELTA.md`. Original requirement evidence and all open questions below are unchanged; nothing removed.

**Reservation amendment:** a reservation may contain one or multiple items. Authorized users may add items before final sale, remove an item from a multi-item reservation, or replace one reserved item with another. Added items become Reserved; removed/replaced items return to Available. Reservation total, total paid, remaining balance, and excess balance are recalculated after every item change. If the new total increases, the difference is added to remaining balance; if the new total is below total paid, the excess is refunded before final completion. Prior payment records are never modified or deleted. The final sales invoice contains only items present in the reservation at completion. Every add/remove/replace operation must record before/after values, employee, date/time, reason, item identifiers, and price changes in the audit trail. This supersedes the previous rule that prohibited changing an item inside the same reservation.

---

## B) المطابَق والمُنفَّذ (Implemented and Matched)

| Requirement | Current Status | Notes |
|---|---|---|
| Sales invoice | ✅ Implemented | POS + posting |
| Sales return | ✅ Implemented | receivable-first settlement |
| Exchange | ✅ Implemented | VAT on new item only |
| Installments | ✅ Implemented | guarantor + schedule |
| Deposit / arbon | ✅ Implemented | remainder GL pending accountant (AD-001) |
| Gift voucher | ✅ Implemented | liability treatment to confirm |
| Customer gold (CGP) | ✅ Implemented | IGP (supplier gold) pending |
| Search & Print | ✅ Implemented | unified read-only + reuse print |
| Barcode identity | ✅ Implemented | `INVENTORY+ITEM+KT+6-digit` |
| Barcode immutability | ✅ Implemented | reused only on same-item return/exchange |
| Front/back tags | ✅ Implemented | per-type; GW hides price |
| Gold By Weight / Piece | ✅ Implemented | type-driven Add-Item form |
| Diamond / Gemstone / Pearl | ✅ Implemented | J vs loose via subtype + metadata |
| Accounting foundation | ✅ Implemented | posting/journal/COGS |
| VAT (5%) | ✅ Implemented | per invoice |
| COGS | ✅ Implemented | trusted logic |
| Customer statements | ✅ Implemented (v2 visible) | v3 internal/hidden |
| Treasury | ✅ Implemented | cash-in/out, closing |
| Arabic/English + RTL/LTR | ✅ Implemented | bilingual print |
| Multi-payment | ✅ Implemented | split (cash/card…) |
| Return/exchange identity preservation | ✅ Implemented | same ID/barcode/RFID/history |

> Physical-printer compatibility is **not** claimed.

---

## C) الناقص أو الجزئي (Missing or Partially Implemented)

### IGP — شراء الذهب من المورد
- **Client requirement:** supplier gold purchase (source `6- Gold Purchase (CGP - IGP).docx`).
- **Current:** CGP (customer gold) present; **IGP supplier flow missing.**
- **Decision required (CD-018):** confirm exact supplier-gold process, settlement, VAT, stock behavior.

### CRM
- Loyalty/points: **present**. Segmentation / communication tracking / analytics: **missing**. Campaigns: confirm. → **CD-019**.

### Employees
- Attendance/payroll/roles: **present**. KPI/performance, employee code, activity logs, **salesperson↔invoice link: missing**. → **CD-020**.

### Dashboard
- Page exists; **consolidated widgets + market gold price incomplete.** → **CD-021**.

### Invoice Layout (screenshot)
- Missing/partial: **per-line VAT column**, **salesperson signature**, **company stamp**, payment-method grid parity. → **CD-022 / CD-016 / CD-017**.

### POS (screenshot)
- Main flow, split payment, exchange line: **present**. Loyalty-points display: **verify visually (CD-023)**. Short barcode in screenshot conflicts with formal barcode doc: **CD-004**.

---

## D) أسئلة قرارات العميل (Client Decision Questions)

Each: ID · Question · Evidence · Current · Options · Recommended (not applied) · Business impact · Technical impact · Approver.

### CD-001 — System Currency
- **Evidence:** POS screenshot = SAR; invoice screenshot = AED. **Current:** AED default, configurable.
- **Options:** A AED · B SAR · C company-configurable (AED default) · D branch-configurable. **Recommended:** C.
- **Business:** correct pricing/tax display. **Technical:** currency setting + formatting. **Approver:** OWNER+CLIENT.

### CD-002 — UAE E-Invoicing Scope
- **Evidence:** two UAE docs existed previously; **absent** from current source. **Current:** deferred, not implemented.
- **Options:** A intentionally removed / B required later / C removed accidentally / D needs new official docs. **Recommended:** deferred, not exposed as completed. **Approver:** OWNER+CLIENT.

### CD-003 — Watch Type
- **Evidence:** Watch not in client files; provisional WT/WCH/00. **Options:** A keep in scope / B hide / C remove after audit / D future. **Recommended:** keep provisional, not client-approved. **Approver:** OWNER+CLIENT.

### CD-004 — Barcode Display Format
- **Evidence:** `الباركود.docx` = `INVENTORY+ITEM+KT+6-digit`; POS mockup = `R-24-00125`. **Current:** formal full format.
- **Options:** A keep full / B short alias + full stored / C replace / D show both. **Recommended:** keep full stored; alias only after approval. **Approver:** CLIENT.

### CD-005 — Global vs Retail Selling Price
- **Evidence:** XLSX Sales section shows a choice (سعر عالمي/تجزئة). **Current:** single sell price.
- **Options:** A one price / B global + retail override / C company price mode / D branch pricing. Clarify: gold-price source, making charge, min making charge, discount, override approval. **Recommended:** C. **Approver:** OWNER+CLIENT.

### CD-006 — Loose-item KT Policy
- **Ask:** should loose items use KT? `00`? setting-metal only? omit/neutralize in barcode? **Current:** demo default "18" (marked not client-approved). **Approver:** CLIENT.

### CD-007…CD-015 — Printing/Hardware (see Decision Register)
Tag dimensions (CD-007), printer/DPI (CD-008), duplex method (CD-009), QR vs CODE128 (CD-010), RFID presentation (CD-011), revision display (CD-012), MC obfuscation (CD-013), discount display (CD-014), certificate fields (CD-015). Each: current behavior + options + safe temporary default; **physical testing required** for CD-007/008/009.

### CD-016 / CD-017 — Company stamp & Salesperson signature (invoice)
Source vs manual vs none; salesperson signature needs an employee↔invoice link (see CD-020). **Approver:** OWNER+CLIENT.

### CD-022 / CD-023 / CD-024 / CD-025
Invoice per-line VAT column parity (CD-022), POS loyalty-points display (CD-023), pure-gold 999.9/995 display (CD-024, from XLSX), scale-capture of weight (CD-025, from XLSX).

---

## E) قرار محاسبي (Accounting Decision)

### AD-001 — Unpaid Deposit Remainder GL Treatment
- **Verified scenario:** invoice total **2415**, cash received **1500**, deposit liability **1500**, remaining operational **915**, **no AR journal line** for the unpaid 915; statement-v2 uses the document/payment model.
- **Options (accountant to choose):**
  - A. **Keep current** — post only actual cash received; unpaid remainder remains operational/document balance.
  - B. **Post unpaid remainder to Accounts Receivable.**
  - C. **Treat invoice as reservation only** until full conversion to sale.
  - D. Another accountant-defined treatment.
- **Must specify:** account affected · trigger event · reversal behavior · statement behavior · tax/VAT timing · customer-balance behavior.
- **No source change before written accounting confirmation.** **Approver:** ACCOUNTANT. **Priority:** P0.

---

## F) الميزات الظاهرة غير المطلوبة صراحةً (Extra Visible Features)

| Feature | In Client Files | Current Use | Dependencies | Options | Recommendation |
|---|---|---|---|---|---|
| Approvals | No | approval workflow | model/route/perm | keep/hide/internal/future/remove-after-audit | **Hide-first / confirm (SD-001)** |
| Reservations | No | sales reservations | model/route | same | **Confirm scope (SD-002)** |
| Manufacturing | No | melt/manufacture, asset lineage | orders + COGS/melt | same | **Keep internal / confirm (SD-003)** |
| Stock Audit | No | inventory audit | assets | same | **Keep internal / confirm (SD-004)** |
| Notifications | No | realtime alerts | events/SSE | same | **Confirm / verify not dead (SD-005)** |
| Audit page | Internal | audit trail (hash-chained) | audit_logs | keep/hide | **KEEP — foundation (SD-006)** |
| Inventory Transfers | Implied | multi-branch transfer | transfers | keep/hide | **KEEP (SD-007)** |

**Principle: Hide-first; preserve data/dependencies until confirmed. No immediate deletion.**

---

## G) نطاق CRM (Client to confirm — CD-019)
Classify each as **required-now / future / not-required:** segmentation · categories · loyalty points · communication log · follow-up reminders · campaigns · analytics · purchase behavior · VIP classification · inactive-customer alerts · birthday/occasion reminders.

## H) نطاق الموظفين (Client to confirm — CD-020)
Confirm: employee code format · attendance method · payroll requirements · KPI definitions · performance score · commission · **salesperson↔invoice linkage** · user↔employee linkage · activity logs · department/role structure · signature source. **Not implemented without definitions.**

## I) نطاق لوحة المعلومات (Client to classify — CD-021)
For each widget mark **Required / Optional / Hide / Future:** sales today/month/year · profit · VAT · cash/bank · inventory value · gold weight · low stock · customer balances · supplier balances · installments · returns/exchanges · employee performance · **gold market price** · branch comparison · recent activity · alerts.

---

## J) تسلسل التنفيذ المقترح (Implementation Order — not executed)
1. **Phase 32.5-Client-Response** — record approved client/accountant answers.
2. **Phase 32.5-Fix A** — IGP · salesperson↔invoice link · required Dashboard gaps.
3. **Phase 32.5-Fix B** — CRM & Employees client-approved scope.
4. **Phase 32.5-Fix C** — invoice/POS layout, translation & print alignment.
5. **Phase 32.5-Fix D** — hide confirmed out-of-scope visible features (hide-first).
6. **Phase 32.5-Removal Audit** — dependency-proof before any deletion.

> Full evidence (CR/SF registers, matrices, XLSX field matrix, screenshot requirements, conflicts) is in `PHASE-32.5-TRACEABILITY-APPENDIX.md`. Decision tracker: `PHASE-32.5-DECISION-REGISTER.md`. Frozen source hashes: `PHASE-32.5-SOURCE-MANIFEST.md`.
