# DARFUS ERP — Stage F End-User Documentation & Handover Report

## ملخص تنفيذي

تم إنشاء دليلَي المستخدم العربي والإنجليزي اعتمادًا على الشاشات الفعلية في بيئة التشغيل المحلية الحالية، مع فهرس للشاشات ونسخ مشروحة من اللقطات. اجتاز ملفا DOCX وPDF التحقق البنيوي والبصري: 30 صفحة عربية و30 صفحة إنجليزية، دون قصّ أو تداخل مرئي أو فقدان للجداول/الصور.

لم تُنفّذ أي عملية أعمال في قاعدة `darfus_erp`: لا Receive، ولا Checkout، ولا Transfer، ولا Workshop، ولا Count، ولا Payment، ولا أي تعديل بيانات أعمال. الخطر على قاعدة البيانات الرسمية = صفر من هذا الـBatch.

الحالة الوحيدة غير المكتملة هي ملاحظة توثيقية P3: مسار تقرير تقييم المخزون المتخصص بقي في حالة تحميل/انتهت مهلة التنقل أثناء نافذة الفحص القرائي. تم تصنيفه صراحةً ولم يتم اختراع نتيجة له، وهو لا يمنع استخدام الأدلة الأساسية أو إغلاق التوثيق.

## 1. Executive Summary

| Item | Result |
|---|---|
| Control | `DARFUS-STAGE-F-END-USER-BILINGUAL-MANUAL-WITH-ANNOTATED-RUNTIME-SCREENSHOTS` |
| Runtime authority | Current local runtime at `http://localhost:3000` with backend at `http://localhost:8000` |
| Database authority | `darfus_erp`, read-only during this Batch |
| Product/business code changed | No |
| Database business mutation | No |
| Documentation deliverables | AR/EN DOCX, AR/EN PDF, screen inventory, screenshot index, annotated screenshot set |
| Final decision | `PASS_STAGE_F_END_USER_DOCUMENTATION_AND_HANDOVER` |

## 2. Source / Runtime Authority

- Source route discovery identified 68 current route files.
- The runtime, current sidebar, current labels, current company/branch context, and current AR/EN rendering were treated as the authority for user-facing wording.
- Core read-only runtime navigation covered dashboard, inventory intake, all eight inventory profiles, Asset/Barcode, POS and Journal Preview, suppliers, customers, invoices, transfers, workshop, count, Gold Center, accounting, treasury, reports, users, settings, and related exposed surfaces.
- Existing local synthetic/accepted records were viewed where a detail screen required a record. No new record was created.
- No production runtime was contacted and no alternate backend or database was started.

## 3. Current Screen Inventory

The complete inventory is in [CURRENT_END_USER_SCREEN_INVENTORY.md](I:/WORK/jewellery-erp-master/docs/user-manual/CURRENT_END_USER_SCREEN_INVENTORY.md).

- 68 source route files were classified.
- 63 operational/admin/customer-facing runtime surfaces were captured in AR and EN.
- Authentication, reset, utility, print-export, and dynamic detail routes were classified separately rather than presented as normal end-user workflows.
- All eight current profile routes are documented through the unified Inventory → Add / Receive Inventory entry point.
- No undocumented end-user screen remains in the inventory; the slow specialized report route is explicitly recorded as a documentation finding.

## 4. AR Screenshot Coverage

- Raw runtime screenshots: 63.
- Annotated runtime screenshots: 63.
- Language: Arabic/RTL.
- Browser viewport: 1440 × 900, except the explicitly marked responsive POS capture.
- Coverage includes navigation, company/branch/language context, workspace, intake chooser, profile forms, POS cart/Journal Preview, Asset details, Supplier details, Invoice details, Gold Center, and operational screens.

## 5. EN Screenshot Coverage

- Raw runtime screenshots: 63.
- Annotated runtime screenshots: 63.
- Language: English/LTR.
- Browser viewport: 1440 × 900, except the explicitly marked responsive POS capture.
- The same operational coverage was captured in English. Labels were read from the English runtime and were not back-translated from Arabic.

## 6. Annotated Walkthrough Coverage

Every retained screenshot has an annotated counterpart with the same three markers:

1. Navigation: where to open the module.
2. Context: company, branch, language, and account context.
3. Workspace: the active screen, task controls, result, or preview.

The annotation generator and rendered QA contact sheets are retained under `docs/user-manual/qa/`. The visual pass covered all 30 rendered pages for each language.

## 7. AR Manual

[DARFUS_ERP_End_User_Manual_AR.docx](I:/WORK/jewellery-erp-master/DARFUS_ERP_End_User_Manual_AR.docx)  
[DARFUS_ERP_End_User_Manual_AR.pdf](I:/WORK/jewellery-erp-master/DARFUS_ERP_End_User_Manual_AR.pdf)

The Arabic manual is an end-user guide, not an engineering runbook. It includes:

- تسجيل الدخول واختيار الشركة والفرع.
- أساسيات التنقل والبحث والمرشحات.
- مسار المخزون الموحد والاستلام.
- ملفات Gold By Weight وGold By Piece وDiamond Jewellery وLoose Diamond وGem Stone Jewellery وLoose Gem Stone وPearl Jewellery وLoose Pearl.
- Asset وBarcode وRFID.
- Transfers وWorkshop وInventory Count.
- Suppliers والمشتريات والعملاء.
- POS وJournal Preview والفواتير والإرجاع والحجوزات.
- Gold Center وCustomer Gold Purchase والحسابات والخزينة والتقارير والمستخدمين والإعدادات.
- استكشاف الأخطاء وقاموس الحالات وقائمة التدريب والتسليم.

## 8. EN Manual

[DARFUS_ERP_End_User_Manual_EN.docx](I:/WORK/jewellery-erp-master/DARFUS_ERP_End_User_Manual_EN.docx)  
[DARFUS_ERP_End_User_Manual_EN.pdf](I:/WORK/jewellery-erp-master/DARFUS_ERP_End_User_Manual_EN.pdf)

The English manual contains the same operational coverage and task guidance in LTR layout. It explains the canonical workflows, where results appear, safety checks, and the difference between read-only review and an authorized business action.

## 9. Task Guides

The manuals provide seven core quick recipes plus detailed per-screen procedures:

1. Receive stock through Inventory → Add / Receive Inventory.
2. Find and review an Asset by barcode.
3. Transfer an Asset between branches.
4. Send and return an Asset through Workshop.
5. Perform an Inventory Count.
6. Review a customer and invoice.
7. Review a POS cart and Journal Preview before any authorized checkout.

The recipes explicitly preserve the single canonical workflow and do not instruct users to use a legacy supplier receive shortcut.

## 10. Business Impact Explanations

The documentation explains the operational effect of each major action:

- Receiving creates a traceable physical Asset with its identity and Barcode.
- Asset Details is the traceability point for identity, branch/location, status, supplier, values, and history.
- Transfer changes custody/location and does not create a sale or supplier payment.
- Workshop changes operational custody/status and does not create a sale.
- Count records what was observed and must be reviewed with its variance/result.
- POS Journal Preview shows the financial effect before an authorized checkout.
- Invoice and supplier history show the resulting record after an authorized transaction.
- Gold Center values are reference data and should not be treated as a substitute for an unavailable or stale rate.

## 11. Where Result Appears Coverage

The manuals direct users to the relevant result screen or record:

- Receive result: Inventory, Asset Details, barcode search, supplier history, and accounting when applicable.
- Transfer result: transfer register and Asset location/status.
- Workshop result: workshop register and Asset operational status.
- Count result: count record, counted/missing/unexpected/variance information, and audit history.
- Sale result: invoice, payment/receipt, Asset sold state, and Journal Preview/posted journal where permitted.
- Supplier result: supplier balance, purchases, payable/payment history.
- Customer result: customer profile, invoice history, deposits/reservations, and CGP history.

## 12. AR/EN Parity

- Arabic and English manuals contain the same workflow coverage and safety rules.
- AR screenshots were captured from RTL runtime screens; EN screenshots from LTR runtime screens.
- Business labels were taken from the matching runtime locale.
- No internal route names, API paths, database names, request fingerprints, idempotency keys, or engineering-only implementation terms were inserted into the user manuals.

## 13. Privacy and Safety

- No passwords, setup tokens, API keys, session tokens, or secrets are included in the manuals or report.
- Screenshots use the current local runtime and existing synthetic/accepted records only.
- No new customer, supplier, inventory, POS, payment, or accounting record was created.
- The manuals instruct users to verify company, branch, location, status, totals, and result before repeating any financial action.
- External e-invoicing integration is explicitly outside this Stage F documentation scope; the guide does not claim that it is implemented.

## 14. Document Validation

| Artifact | Validation |
|---|---|
| Arabic DOCX | PASS — opens, structured paragraphs/tables/images present |
| Arabic PDF | PASS — rendered from DOCX, 30 pages |
| English DOCX | PASS — opens, structured paragraphs/tables/images present |
| English PDF | PASS — rendered from DOCX, 30 pages |
| Arabic visual QA | PASS — pages 1–30 reviewed; no clipping/overlap/table/image defect observed |
| English visual QA | PASS — pages 1–30 reviewed; no clipping/overlap/table/image defect observed |
| Screenshot index | PASS — 88 indexed raw/annotated paths resolve |
| Technical leakage scan | PASS — no `localhost`, API paths, JWT, Redis, Docker, or Sequelize terms in the user manuals |

## 15. Documentation Findings

### DOC-F-001 — Specialized inventory valuation report route

| Field | Finding |
|---|---|
| Route | `Reports → Inventory valuation` / `/reports/inventory-valuation` |
| Expected | The route completes and presents the report to an authorized user |
| Actual | The route remained in loading state or navigation timed out during the read-only capture window |
| Severity | P3 — non-blocking documentation/runtime observability finding |
| Business mutation | None |
| Manual treatment | The route is classified in the inventory; no unsupported report result was described as available |
| Impact | Specialized valuation-report walkthrough is not asserted as runtime-proven in this handover |
| Next action | Owner may schedule a separate read-only route investigation; no automatic fix or new Stage was started |

This finding does not block the core end-user manual because dashboard, inventory, Asset, POS/Journal Preview, supplier, customer, invoice, transfer, workshop, count, Gold Center, accounting, and settings paths were captured and documented.

## 16. Main DB Mutation Proof

All business mutation counters for this Batch are zero:

| Mutation | Count |
|---|---:|
| New Receive | 0 |
| New Transfer | 0 |
| New Workshop record | 0 |
| New Inventory Count | 0 |
| New Checkout | 0 |
| New Return | 0 |
| New Refund | 0 |
| New Void | 0 |
| New CGP post | 0 |
| New Supplier Payment | 0 |

No migration, seed, backup, restore, cleanup, DB write, or production deployment was performed.

## 17. Missing/Undocumented Screens

`UNDOCUMENTED_END_USER_SCREENS = 0`.

The route inventory distinguishes normal end-user screens from authentication/utility routes and dynamic record details. The specialized inventory valuation route is not missing from the inventory; it is explicitly classified with `DOC-F-001` because its read-only runtime completion was not proven in the capture window.

## 18. Final Gate

The Stage F deliverables are complete and the final visual/document validation passed. The one P3 finding is recorded and does not block core manual handover.

`GATE = PASS_STAGE_F_END_USER_DOCUMENTATION_AND_HANDOVER`

## 19. Final Tokens

```text
CURRENT_CONTROL = DARFUS-STAGE-F-END-USER-BILINGUAL-MANUAL-WITH-ANNOTATED-RUNTIME-SCREENSHOTS
CURRENT_END_USER_SCREENS = 68_SOURCE_ROUTE_FILES / 63_OPERATIONAL_SURFACES
AR_SCREENSHOTS = 63
EN_SCREENSHOTS = 63
ANNOTATED_SCREENSHOTS = 126 (63 AR + 63 EN)
AR_MANUAL_DOCX = I:\WORK\jewellery-erp-master\DARFUS_ERP_End_User_Manual_AR.docx
AR_MANUAL_PDF = I:\WORK\jewellery-erp-master\DARFUS_ERP_End_User_Manual_AR.pdf
EN_MANUAL_DOCX = I:\WORK\jewellery-erp-master\DARFUS_ERP_End_User_Manual_EN.docx
EN_MANUAL_PDF = I:\WORK\jewellery-erp-master\DARFUS_ERP_End_User_Manual_EN.pdf
AR_MANUAL_PAGES = 30
EN_MANUAL_PAGES = 30
TASK_GUIDES_COUNT = 7 core recipes + per-screen procedures
IMPACT_MAPS_COUNT = 8 workflow impact notes
UNDOCUMENTED_END_USER_SCREENS = 0
DOC_FINDINGS = 1 non-blocking P3
MAIN_DB_NEW_RECEIVE = 0
MAIN_DB_NEW_TRANSFER = 0
MAIN_DB_NEW_WORKSHOP = 0
MAIN_DB_NEW_COUNT = 0
MAIN_DB_NEW_CHECKOUT = 0
MAIN_DB_NEW_RETURN = 0
MAIN_DB_NEW_REFUND = 0
MAIN_DB_NEW_VOID = 0
MAIN_DB_NEW_CGP_POST = 0
MAIN_DB_NEW_SUPPLIER_PAYMENT = 0
AR_DOCX_VALIDATION = PASS
AR_PDF_VALIDATION = PASS
EN_DOCX_VALIDATION = PASS
EN_PDF_VALIDATION = PASS
P0_DOCUMENTATION_BLOCKERS = 0
P1_DOCUMENTATION_BLOCKERS = 0
GATE = PASS_STAGE_F_END_USER_DOCUMENTATION_AND_HANDOVER
STAGE_F_STATUS = CLOSED
NEXT_RECOMMENDED_STEP = PRODUCTION_READINESS_AND_DEPLOYMENT_HARDENING
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**Stage F complete → Owner review → priority decision → wait for explicit next instruction.**
