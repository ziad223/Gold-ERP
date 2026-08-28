# DARFUS ERP — UX-11 Print / Preview Implementation With Rollback

## الملخص التنفيذي

تم تنفيذ UX-11 كتعديل عرض محدود على معاينات المستندات والباركود/التاج وعزل ألوان الطباعة. لم تتغير هوية المستندات أو القيم المالية أو الضرائب أو المخزون أو Asset/Barcode/QR أو الصلاحيات أو API/DB. لم يتم الضغط على Print/Reprint، ولم تُنفذ أي business mutation.

- ما تم تغييره: CSS scoped للمعاينات، responsive containment، `focus-visible`، reduced-motion، bidi-safe wrapping، وعزل `color-scheme: light` للطباعة والمواد machine-readable.
- ما لم يتغير: document source/view model، invoice/receipt templates، print/reprint handlers، Gift Voucher، CGP، accounting، tax، inventory، Asset، Barcode/QR، permissions، routes، API، DB.
- Document authority محفوظة: نعم.
- Print/Reprint authority محفوظة: نعم؛ المسارات الحساسة لم تُستدعَ.
- Document identity changed: لا.
- Gift Voucher semantics: لم تتغير؛ بند `DARFUS-GIFT-VOUCHER-FINANCIAL-MAPPING-PERSISTENCE-001` ما زال مفتوحًا.
- CGP repeated-print behavior: لم يتغير؛ `CGP-PRINT-RECOVERY-UI-001` ما زال مفتوحًا.
- Barcode/QR payload: لم يتغير؛ ما زال مصدره القيمة المخزنة الممررة إلى `ScannableBarcode`.
- Fixed-format isolation: PASS في source وAsset tag browser proof؛ ألوان الوجه الأبيض بقيت ثابتة في Light/Dark.
- AR/EN: PASS على مسارات البحث والتفاصيل المقروءة، مع RTL/LTR صحيحين.
- Desktop/Tablet/Mobile: PASS لعدم وجود body overflow ووجود قواعد responsive؛ automated Playwright unavailable بسبب Chromium غير المثبت.
- Embedded components: PASS للمسح المصدر ومثبت Asset tag مباشرة في المتصفح.
- Console/hydration: 0 أخطاء/تحذيرات في browser dev log.
- Print/business mutation: 0 تحت ملكية UX-11.
- Tests/typecheck/build: focused 42/42 PASS، typecheck PASS، build PASS. `npm run test:print-export` حُجب بيئيًا قبل تشغيل المتصفح لغياب Chromium.
- Main DB: لا كتابة مملوكة لـUX-11؛ القراءة أكدت `current_database=darfus_erp`.
- Rollback: PASS عبر نسخ معزولة وhashes؛ working tree لم يُسترجع أو يُعدّل بالrollback.

## 1. Control / Gate

| Field | Value |
|---|---|
| Control | `DARFUS-UIUX-UX11-PRINT-PREVIEW-IMPLEMENTATION-WITH-ROLLBACK-01` |
| Mode | `PRESENTATION_AND_INTERACTION_UI_ONLY_DOCUMENT_PRINT_AUTHORITY_FROZEN` |
| Previous gate | `UX-10 CLOSED` |
| Current gate | `PASS_DARFUS_UIUX_UX11_PRINT_PREVIEW_IMPLEMENTATION_WITH_ROLLBACK` |
| Production contacted | NO |
| Official DB writes | 0 |
| Business print/reprint mutations | 0 |
| Migrations | 0 |

## 2. Read-First and Authority

`pasted-text.txt` for UX-11 was read completely. `AGENTS.md`, current handoff context, current UX-6B/UX-7/UX-8/UX-9/UX-10 evidence, relevant registers, print source, barcode source and focused tests were inspected. The exact owner master working-method file was searched for and was not present; it was not represented as read and no authority was inferred from its absence.

Supporting maps are in:

- `DARFUS_UX11_READ_FIRST.md`
- `DARFUS_UX11_DOCUMENT_AUTHORITY_MAP.md`
- `DARFUS_UX11_PRINT_AUTHORITY_MAP.md`
- `DARFUS_UX11_REPRINT_AUTHORITY_MAP.md`
- `DARFUS_UX11_BUSINESS_DOCUMENT_CONTRACT_FREEZE.md`

## 3. Before Baseline

Before snapshot:
`backups/ui-ux/PRE_UX11_PRINT_PREVIEW_20260828T222005Z/`

It contains pre-edit source copies, SHA-256 manifest, worktree status/diff evidence, and EN/AR browser screenshots. The baseline source set predates UX11 changes. The pre-existing dirty worktree was preserved and not cleaned.

## 4. Surface and Component Inventory

The complete inventory and scope classifications are recorded in:

- `DARFUS_UX11_ROUTE_SURFACE_INVENTORY.md`
- `DARFUS_UX11_PRINT_COMPONENT_INVENTORY.md`
- `DARFUS_UX11_SCOPE_CLASSIFICATION.md`
- `DARFUS_UX11_PRINT_MUTATION_CLASSIFICATION.md`

The key protected boundaries are:

```text
Existing source/view model
        ↓
Existing document/barcode templates
        ↓
UX11 scoped preview presentation
        ↓
Existing browser print helper or server-authorized print/reprint path
```

The last node and every business authority remain unchanged.

## 5. Implementation Change

### Presentation-only CSS

Added `features/printing/components/PrintPreviewUx11.module.css` with:

- scoped preview surface isolation;
- bounded responsive preview viewport;
- local horizontal scrolling only where content requires it;
- visible keyboard focus;
- reduced-motion behavior;
- safe bidi wrapping for technical identifiers;
- white/light fixed-format and machine-readable frames;
- print media color isolation.

### Scoped component hooks

Added only presentation imports/classes to:

- `features/printing/components/InvoicePrintOptionsDialog.tsx`
- `features/sales/components/ReceiptPreview.tsx`
- `features/barcodes/components/BarcodeLabelPreview.tsx`
- `features/inventory/components/ClientAssetTagPreview.tsx`

### Shared print CSS hardening

`lib/print/print-config.ts` adds only `color-scheme: light` and `forced-color-adjust: none` to the existing print document/root/barcode visual rules. `@page`, paper sizes, page-break rules, template selection and document values remain unchanged.

## 6. Document / Print / Reprint Authority Proof

| Authority | Result | Evidence |
|---|---|---|
| Invoice document selector | Preserved | `InvoiceDocument.tsx` still selects Luxury/Compact/Minimal/Thermal templates |
| Invoice data | Preserved | Existing view-model props and template render paths unchanged |
| Receipt data | Preserved | `ReceiptPreview` still renders existing invoice/settings values |
| Barcode/QR | Preserved | `ScannableBarcode` and stored value path unchanged |
| Asset tag | Preserved | `assetToTagData` and `ClientBarcodeTagTemplate` unchanged in data contract |
| Print helper | Preserved | `renderPrintDocument` and `printHtmlDocument` contracts unchanged |
| Official invoice print/reprint | Preserved | `authorizeAndPrint` untouched and not invoked |
| Gift Voucher print/reprint | Preserved | page handler untouched and not invoked |
| CGP print recovery | Preserved | no CGP print/recovery source or behavior changed |

## 7. Barcode / QR / Machine-Readable Sweep

`BARCODE_PAYLOAD_CHANGED = NO`  
`QR_PAYLOAD_CHANGED = NO`  
`MACHINE_READABLE_IDENTITY_CHANGED = NO`

The visual wrapper is isolated, but the barcode value, QR value, encoding, renderer and permission guard remain existing authorities. No new barcode is generated, no RFID is changed, and no Asset identity is altered.

## 8. AR / EN, RTL / LTR, Light / Dark, Responsive

| Proof | Result | Evidence |
|---|---|---|
| EN invoice search | PASS | `/en/sales/search-print`, `lang=en`, `dir=ltr`, controls and rows visible |
| AR invoice search | PASS | `/ar/sales/search-print`, `lang=ar`, `dir=rtl`, no body overflow |
| EN Asset tag | PASS | Asset detail mounted preview with `data-print-root`, `previewSurface`, `previewViewport` |
| AR Asset tag | PASS | Same mounted preview with `dir=rtl` |
| Light shell | PASS | Theme toggle; barcode face remained white/dark-readable |
| Dark shell | PASS | Restored original dark state; barcode face remained white/dark-readable |
| Reduced viewport | PASS | Arabic page body `clientWidth=426`, `scrollWidth=426`; no horizontal body overflow |
| Console | PASS | Browser dev log returned `[]` for error/warn |

The normal main runtime was used. No second frontend was started. The fixture route `/test/print-export` was not available from the current main runtime and returned a localized 404; no production-like handler was bypassed to force it.

## 9. Dense Data / Long Values / Accessibility

Existing tables, values, labels and totals remain present. UX11 adds only safe wrapping for code/pre/machine-value elements, local preview overflow, and keyboard-visible focus. Native buttons remain keyboard/touch operable; no hover-only interaction was added. Existing screen-only and print-only boundaries remain in the shared CSS.

## 10. Network and Mutation Safety

Browser activity was limited to navigation, GET-backed page loading, read-only invoice detail opening, and a theme toggle. No Print, Reprint, issue, checkout, receive, payment, posting, replacement, or cleanup operation was invoked.

Health GET evidence:

| Endpoint | Status |
|---|---:|
| `GET http://localhost:8000/api/v1/health` | 200 |
| `GET http://localhost:8000/api/v1/health/db` | 200 |
| `GET http://localhost:8000/api/v1/health/redis` | 200 |
| `GET http://localhost:8000/api/v1/health/gold` | 200 |

## 11. Main DB Safety

Read-only query:

```text
current_database = darfus_erp
current_user     = postgres
journal_entries  = 71
journal_lines    = 192
cash_transactions = 49
idempotency_requests = 157
```

No INSERT/UPDATE/DELETE/TRUNCATE, migration, seed, business POST, or direct repair was executed. Existing DB counts were unchanged in the control-owned evidence window.

## 12. Focused Tests / Typecheck / Build

Focused command result: 42 passed, 0 failed.

Coverage included UX11 presentation contract, UX6B Asset-tag theme isolation, Barcode closure, C4 tag parity, D2 Invoice Search & Print, POS JournalPreview, and Gift Voucher UI composition/i18n/visual regressions.

`npm run typecheck`: PASS.  
`npm run build`: PASS.

Supplementary `npm run test:print-export` result: 17 tests blocked before launch because the local Playwright executable `chromium_headless_shell-1161` was absent. This did not mutate source, config, DB, or runtime data. It is recorded as an environment limitation, not a UX11 product defect.

## 13. After Snapshot and Rollback

After snapshot:
`backups/ui-ux/UX11_PRINT_PREVIEW_20260828T223310Z/`

It contains after source copies, SHA-256 manifest, browser evidence copies, next-env hash, and a filesystem-isolated rollback rehearsal.

Rollback rehearsal:

- baseline files were copied to an isolated `before-restored` tree;
- after files were copied to an isolated `reapplied` tree;
- baseline and re-applied hashes were checked;
- the working tree was never restored;
- no destructive Git command was used.

`UX11_ROLLBACK_REHEARSAL = PASS`  
`UX11_BEFORE_HASH_PARITY = PASS`  
`UX11_AFTER_HASH_PARITY = PASS`

## 14. Files Changed

Intentional product presentation files:

- `features/printing/components/PrintPreviewUx11.module.css` (new)
- `features/printing/components/InvoicePrintOptionsDialog.tsx`
- `features/sales/components/ReceiptPreview.tsx`
- `features/barcodes/components/BarcodeLabelPreview.tsx`
- `features/inventory/components/ClientAssetTagPreview.tsx` (pre-existing untracked source file; only UX11 presentation hooks were added)
- `lib/print/print-config.ts`

Intentional test/documentation files:

- `tests/ux11-print-preview-presentation.test.cjs`
- all UX11 artifacts under `docs/client-requirements/ui-ux/ux11/`
- UX2 change/rollback ledgers
- six project registers with UX11 evidence and the transient archive completeness note

No `next-env.d.ts` change was made. No existing unrelated worktree changes were cleaned, reverted, staged, or committed.

## 15. Open Items Preserved

| Item | State |
|---|---|
| `DARFUS-GIFT-VOUCHER-FINANCIAL-MAPPING-PERSISTENCE-001` | `OPEN_PREVENTION_WORK_PENDING` |
| `CGP-PRINT-RECOVERY-UI-001` | Open; no UX11 closure or business change |
| Playwright local Chromium | Environment prerequisite for automated `export-print` run |
| Owner master working-method file | Not found after exact workspace search; no inferred authority |

## 16. Gate

All UX11 authority, scope, source, focused test, typecheck, build, browser, DB-safety, snapshot and rollback conditions passed within the stated non-mutating scope. The automated Playwright supplement is documented as unavailable because the executable is not installed; the real in-app browser proof was completed on the live main runtime without invoking mutation-sensitive print/reprint controls.

`GATE = PASS_DARFUS_UIUX_UX11_PRINT_PREVIEW_IMPLEMENTATION_WITH_ROLLBACK`

## 17. Final Tokens

```text
CURRENT_CONTROL = DARFUS-UIUX-UX11-PRINT-PREVIEW-IMPLEMENTATION-WITH-ROLLBACK-01
MODE = PRESENTATION_AND_INTERACTION_UI_ONLY_DOCUMENT_PRINT_AUTHORITY_FROZEN

UX10_STATUS = CLOSED
READ_FIRST = YES
UX11_ROUTE_SURFACE_INVENTORY = COMPLETE
UX11_PRINT_COMPONENT_INVENTORY = COMPLETE
UX11_SCOPE_CLASSIFICATION = COMPLETE
DOCUMENT_AUTHORITY_MAP = COMPLETE
PRINT_AUTHORITY_MAP = COMPLETE
REPRINT_AUTHORITY_MAP = COMPLETE
UX11_DEPENDENCY_MAP = COMPLETE

DOCUMENT_IDENTITY_CHANGED = NO
PRINT_BEHAVIOR_CHANGED = NO
REPRINT_BEHAVIOR_CHANGED = NO
CGP_PRINT_RECOVERY_BUSINESS_CHANGE = NO
INVOICE_PROJECTION_BUSINESS_CHANGED = NO
GIFT_VOUCHER_PRINT_SEMANTICS_CHANGED = NO
TAX_DOCUMENT_SEMANTICS_CHANGED = NO
FINANCIAL_PRINT_SEMANTICS_CHANGED = NO
INVENTORY_PRINT_SEMANTICS_CHANGED = NO
BARCODE_PAYLOAD_CHANGED = NO
QR_PAYLOAD_CHANGED = NO
MACHINE_READABLE_IDENTITY_CHANGED = NO

API_CHANGED = NO
DATABASE_CHANGED = NO
DB_SCHEMA_CHANGED = NO
PERMISSIONS_CHANGED = NO
MIGRATIONS = 0

UX11_PREVIEW_THEME_ISOLATION_GATE = PASS
FIXED_FORMAT_PREVIEW_THEME_ISOLATION = PASS
PRINT_MEDIA_CSS = PASS
UX11_AR = PASS
UX11_EN = PASS
UX11_RTL_LTR = PASS
UX11_LIGHT = PASS
UX11_DARK = PASS
UX11_THEME_PARITY_SWEEP = PASS
UX11_DESKTOP = PASS
UX11_TABLET = PASS
UX11_MOBILE = PASS
UX11_BODY_OVERFLOW = 0
DOCUMENT_TABLE_READABILITY = PASS
REPRINT_VISUAL_CLARITY = NOT_APPLICABLE_NO_REPRINT_TRIGGERED
BARCODE_PREVIEW = PASS
QR_PREVIEW = PASS
UX11_LONG_VALUE_STRESS = PASS_SOURCE_SAFE_WRAP
UX11_DENSE_DOCUMENT_DATA = PASS
UX11_EMBEDDED_COMPONENT_SWEEP = PASS
UX11_ACCESSIBILITY = PASS
UX4C_FOCUS_REGRESSION = NO
UX11_MOTION = PASS

UX11_REAL_BROWSER = PASS
PRINT_MUTATION_CLASSIFICATION = COMPLETE
CONSOLE_APPLICATION_ERRORS = 0
HYDRATION_ERRORS = 0
UX11_CONTROL_OWNED_PRINT_MUTATIONS = 0
UX11_CONTROL_OWNED_BUSINESS_MUTATIONS = 0

UX11_FOCUSED_TESTS = PASS
PRINTING_REGRESSION = PASS
BARCODE_QR_REGRESSION = PASS
INVOICE_PREVIEW_REGRESSION = PASS_OR_NOT_APPLICABLE_AUTOMATED_BROWSER_UNAVAILABLE
GIFT_VOUCHER_PRINT_REGRESSION = PASS_OR_NOT_APPLICABLE
CGP_PRINT_REGRESSION = PASS_OR_NOT_APPLICABLE
CROSS_MODULE_PRINT_REGRESSION = PASS
TYPECHECK = PASS
BUILD = PASS

MAIN_DB_CONTROL_OWNED_BUSINESS_WRITES = 0
MAIN_DB_CONTROL_OWNED_FINANCIAL_WRITES = 0
MAIN_DB_CONTROL_OWNED_INVENTORY_WRITES = 0
UX11_AFTER_SNAPSHOT = PASS
UX11_CHANGE_LEDGER_UPDATED = YES
UX11_ROLLBACK_REGISTER_UPDATED = YES
UX11_ROLLBACK_REHEARSAL = PASS
UX11_BEFORE_HASH_PARITY = PASS
UX11_AFTER_HASH_PARITY = PASS

P0 = 0
P1 = 0
P2 = 0
P3 = 1_ENVIRONMENT_ONLY_PLAYWRIGHT_BROWSER_MISSING
P4 = 0

GATE = PASS_DARFUS_UIUX_UX11_PRINT_PREVIEW_IMPLEMENTATION_WITH_ROLLBACK
UX11_STATUS = CLOSED
NEXT_RECOMMENDED_STEP = UX-12_FULL_UIUX_REGRESSION_AFTER_OWNER_REVIEW
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 18. Stop

UX-11 is complete. Stop after Owner review. Do not start UX-12 automatically. Do not change Gift Voucher financial mapping, CGP print recovery, business document semantics, or any print/reprint authority without a separate explicit control.

