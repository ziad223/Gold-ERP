# DARFUS ERP — UX-0 Full Read-Only Audit 01

ما حجم النظام الذي تمت مراجعته؟ 68 ملف صفحة فعلية، منها 67 قالبًا محليًا وملف طباعة اختباري.
كم Route فعلية؟ 68 قوالب صفحات؛ 67 تحت `/[locale]` وواحد غير إنتاجي.
كم شاشة حرجة؟ 25 عائلة حرجة تقريبًا، محددة في سجل التغطية أدناه.
كم صفحة Dark Mode بها مشكلة؟ لم يُثبت عدّ صفحات نهائي؛ issue عالمي مفتوح بسبب عدم اكتمال مصفوفة التحقق.
كم صفحة Light Mode بها مشكلة؟ لم يُثبت عدّ صفحات نهائي؛ لا تعميم بلا دليل.
كم مشكلة AR؟ مشكلتا اتساق/نقاء لغوي مرصودتان على الأقل؛ التفاصيل في سجل اللغة.
كم مشكلة EN؟ مشكلتان مرصودتان على الأقل، منها بقاء بيانات عربية في عدة شاشات.
كم مشكلة RTL/LTR؟ ملاحظتان عالميتان منخفضتا/متوسطتا الثقة؛ لا كسر شامل مثبت.
كم مشكلة Responsive؟ ملاحظتان: كثافة/جداول وPOS تحتاجان اختبارًا أعمق.
كم مشكلة Information Density؟ 3 محاور: sidebar، profile forms، tables/dashboard.
كم مشكلة Accessibility؟ محوران: label association وأسماء controls.
ما أكثر 10 مشاكل تأثيرًا؟ انظر Issue Priority Matrix.
هل الهوية الحالية تعكس Gold/Jewellery ERP؟ جزئيًا: navy/teal مع gold accents ورسائل Gold ERP؛ تحتاج قرار اتجاه بصري.
ما اتجاهات التصميم المقترحة؟ Executive Precious-Metal ERP، Modern Jewellery Operations، Financial Gold Terminal.
هل تم تعديل أي كود؟ لا.
هل تم لمس Business Logic؟ لا.
Gate: BLOCKED_DARFUS_UI_UX_UX0_BROWSER_EVIDENCE_INCOMPLETE.
الخطوة التالية فقط: Owner review لاختيار اتجاه UX-1 بعد سد فجوات الأدلة، دون بدء التنفيذ.

## Executive Summary

| Dimension | Result |
|---|---|
| Route inventory | 68 page files; 67 localized + 1 non-production |
| Runtime | Frontend HTTP 200; backend `/api/v1/health`, `/health/db`, `/health/redis`, `/health/gold` = 200 |
| DB | `current_database() = darfus_erp`; read-only SELECT only; latest recheck assets 18, customers 3, invoices 5, journal_entries 35 |
| Browser | Real internal browser; AR/EN, dark/light, desktop/narrow sampled |
| Main risks | density, language purity, dark-mode global parity, accessibility association, tag scale |
| Mutation | none in this control |

Read-only baseline note: a later recheck showed `journal_entries` = 35. The new latest row was `JE-1787861413852`, `gift_voucher_issue`, `GV-59282ccf-d37f-45ca-aae4-cdd9c5892292`, at `2026-08-27 20:10:13Z`, with balanced 100/100 debit-credit. UX-0 sent no business request; this is recorded as an unattributed concurrent external mutation and was not changed.

## Read First

Read fully: `AGENTS.md`, `PROJECT_PROGRESS_HANDOFF.md`, `README.md`, root `package.json`, locale/layout/routing files, shell/navigation/theme/global CSS, shared UI/state/print/POS/inventory/accounting/settings sources, and all six DARFUS registers. Read-first source hashes were captured during audit; no source file was edited.

## Route Inventory

See `DARFUS_UI_UX_ROUTE_INVENTORY.md`. It is generated from every current `page.tsx`, not a guessed list.

## Current Visual Identity

Current identity is dark navy/graphite + teal with restrained gold accents, rounded panels and soft shadows. It reads as a modern general ERP with a Gold ERP label and gold-rate surfaces; fit to a premium jewellery operation is PARTIAL, not yet an accepted final identity. See design directions.

## Global Shell / Navigation

Shell is coherent and permission-aware; sidebar grouping is predictable but long and truncates several labels. Mobile collapses into a menu. Full findings: shell and navigation artifacts.

## Dark / Light / Arabic / English / RTL-LTR

Theme switching and locale switching were proven through the internal browser. AR is RTL/Cairo and EN is LTR/Inter. Dark mode is visibly implemented, but not globally accepted because hardcoded variants and component-level contrast have not been exhaustively proven. EN and AR rendering work, but language purity needs improvement due to mixed data/labels.

## Information Density / Forms / Tables / POS

Dashboard is balanced but long; profile forms are rich and vertically dense; inventory/finance tables are information-heavy and not uniformly optimized for narrow screens. POS has a strong customer/search/items/payment hierarchy and fail-closed empty-cart state, with accessibility and mixed-language follow-up.

## Financial / Gold Numeric Presentation

AED and tabular numerals are visible and readable; Gold Center shows high precision while transactional views use two decimals. Future work should define display tokens without changing calculation/rounding authority.

## Tag / Print Preview

Print architecture has explicit printable roots and light-paper behavior in dark mode. Actual-size/zoom/readability is not fully proven; `DARFUS-TAG-PREVIEW-SCALE-001` remains open.

## Error / Empty / Loading / Disabled

Shared components exist and sampled states render. Technical strings and mixed-language user messages remain possible; no raw stack trace was observed in sampled browser states. No issue was closed solely because a component exists.

## Responsive / Accessibility / Consistency / Tokens

Narrow dashboard rendered without document overflow and with mobile navigation. Dense critical modules need deeper route-state coverage. Accessibility is NEEDS_IMPROVEMENT based on unnamed/unassociated POS controls; no WCAG certification is claimed. Shared components exist but page-local variants and hardcoded colors are widespread.

## Screenshot Baseline

See `DARFUS_UI_UX_SCREENSHOT_BASELINE_INDEX.md`; representative screenshots were captured without editing and without business actions.

## Issue Priority Matrix

See `DARFUS_UI_UX_ISSUE_PRIORITY_MATRIX.md`. The five required legacy concerns remain open.

## Registers

The six registers were updated by documentation-only entries referencing UX-0 and preserving prior evidence. No closed business authority was reopened.

## Gate

The control is **BLOCKED** rather than PASS because the required route-family evidence is materially sampled but not exhaustive across every critical state, and the available browser session reported viewport dimensions different from requested overrides. This is an evidence gate, not a product mutation or business failure. No code/DB/business writes occurred.

## Final Tokens

CURRENT_CONTROL = DARFUS-UIUX-UX0-FULL-READ-ONLY-AUDIT-01
MODE = READ_ONLY_UI_UX_FORENSIC_AND_VISUAL_ACCEPTANCE_AUDIT
READ_FIRST = YES
ROUTE_INVENTORY_COMPLETE = YES
TOTAL_ROUTES = 68
CRITICAL_ROUTES = 25_FAMILIES_SAMPLED
REAL_BROWSER_AUDIT = YES
AR_AUDIT = PASS_RENDERING_NEEDS_LANGUAGE_PURITY
EN_AUDIT = PASS_RENDERING_NEEDS_LANGUAGE_PURITY
RTL_AUDIT = PASS_WITH_FOLLOW_UP
LTR_AUDIT = PASS_WITH_FOLLOW_UP
DARK_MODE_AUDIT = NEEDS_IMPROVEMENT
LIGHT_MODE_AUDIT = NEEDS_IMPROVEMENT
DESKTOP_AUDIT = YES
NARROW_AUDIT = YES_WITH_VIEWPORT_EVIDENCE_VARIANCE
RESPONSIVE_AUDIT = NEEDS_IMPROVEMENT
ACCESSIBILITY_AUDIT = NEEDS_IMPROVEMENT
INFORMATION_DENSITY_AUDIT = COMPLETE_WITH_OPEN_ISSUES
FORM_AUDIT = COMPLETE_WITH_OPEN_ISSUES
TABLE_AUDIT = COMPLETE_WITH_OPEN_ISSUES
POS_AUDIT = COMPLETE_READ_ONLY
TAG_PRINT_PREVIEW_AUDIT = PARTIAL
FINANCIAL_NUMERIC_AUDIT = COMPLETE_WITH_OPEN_ISSUES
TERMINOLOGY_INVENTORY = PROPOSED_READ_ONLY
LANGUAGE_PURITY_AR = NEEDS_IMPROVEMENT
LANGUAGE_PURITY_EN = NEEDS_IMPROVEMENT
CURRENT_VISUAL_IDENTITY = NAVY_TEAL_WITH_GOLD_ACCENTS
GOLD_JEWELLERY_ERP_IDENTITY_FIT = PARTIAL
DESIGN_DIRECTIONS_PROPOSED = 3
SOURCE_FILES_CHANGED = 0
BUSINESS_LOGIC_CHANGED = NO
API_CHANGED = NO
DATABASE_CHANGED = NO
MIGRATIONS = 0
BUSINESS_WRITES = 0
FINANCIAL_WRITES = 0
INVENTORY_WRITES = 0
UNATTRIBUTED_EXTERNAL_DB_DELTA = journal_entries +1 observed during recheck; not caused by UX-0
TAX_CHANGED = NO
GIFT_VOUCHER_CHANGED = NO
MIGRATION_STARTUP_CHANGED = NO
SUCCESS_REGISTER_UPDATED = YES_DOCUMENTATION_ONLY
ERROR_REGISTER_UPDATED = YES_DOCUMENTATION_ONLY
ISSUE_BLOCKER_REGISTER_UPDATED = YES_DOCUMENTATION_ONLY
ROOT_CAUSE_PREVENTION_REGISTER_UPDATED = YES_DOCUMENTATION_ONLY
OWNER_DECISION_REGISTER_UPDATED = YES_DOCUMENTATION_ONLY
CLOSED_EVIDENCE_REGISTER_UPDATED = YES_DOCUMENTATION_ONLY
P0 = 0
P1 = 6_OPEN_OR_EVIDENCE_GAPS
P2 = 2_OPEN_OR_EVIDENCE_GAPS
P3 = 0_SEPARATE_COUNT_NOT_ASSERTED
GATE = BLOCKED_DARFUS_UI_UX_UX0_BROWSER_EVIDENCE_INCOMPLETE
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_THEN_CLOSE_EVIDENCE_GAPS_AND_CHOOSE_UX1_DIRECTION
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START

STOP. No UX-1 or implementation started.
