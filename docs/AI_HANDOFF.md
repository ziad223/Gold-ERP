# DARFUS Jewellery ERP — AI Handoff

This file is the handoff checkpoint for AI coding agents working on this repository.

Every agent must read this file before making changes and must preserve its purpose as the project handoff source of truth.

---

## 1. Project Identity

DARFUS Jewellery ERP.

Stack:
- Next.js frontend.
- Express / Sequelize backend.
- PostgreSQL.
- Redis / queues where configured.
- React Query / API repositories.
- Print system currently uses React templates rendered to static HTML and browser print.

Primary rule:
- Production/API mode source of truth is PostgreSQL/API, not localStorage/mock data.

---

## 2. Global Safety Rules

Before any work, always run:

```bash
git status --short
git stash list
git log --oneline -10
```

Rules:

* If working tree is dirty, stop and report files only.
* Never use `git reset`, `git restore`, `stash pop`, `stash apply`, or `stash drop` unless explicitly instructed by the user.
* Never run DB reset, seed, undo, destructive migrations, or production DB writes.
* Prefer surgical changes.
* One phase = one focused commit.
* Stop after the requested phase.
* Do not broaden scope.
* Do not silently fix unrelated issues.
* Do not touch stashes.

Financial/business safety:

* Backend financial truth must stay server-side.
* Frontend must not recalculate VAT, COGS, treasury balances, stock truth, payment truth, journal entries, or invoice posting truth.
* Print/UI layers may format and display values but must not mutate or become financial source of truth.
* No hardcoded company branding, TRN, address, logo, tax data, or customer data.

---

## 3. Current Confirmed HEAD

Latest confirmed functional HEAD before this handoff file:

```text
1af77ac fix: send invoice item ids for returns and exchanges
```

If the actual current HEAD differs, inspect `git log --oneline -10` and preserve the latest committed phase report.

---

## 4. Return / Exchange Work Completed

### Phase 18S — Backend line-level selection

Commit:

```text
dafb100 fix: select returned invoice items by line id
```

Backend changes:

* Returns optionally accepts `returnedInvoiceItemIds`.
* Exchanges optionally accepts `returnedInvoiceItemId`.
* Old contracts remain backward-compatible:

  * `returnedAssetIds`
  * `returnedAssetId`
* If invoice item IDs are supplied, backend selects the exact original `InvoiceItem.id`.
* If old asset IDs are supplied, backend falls back to previous assetId behavior.
* Financial logic, VAT, COGS, stock movements, and posting logic were not redesigned.
* Double guard remains conservative product-level by `assetId`.
* Full line-level return/exchange history requires future migration storing `originalInvoiceItemId`.

Verification reported green:

* duplicate product line return/exchange contract: 23/23
* return product support
* exchange product support
* mixed exchange items contract
* returns/exchange contract
* API contracts
* regressions
* typecheck/lint/build

---

### Phase 18T — Frontend sends InvoiceItem.id

Commit:

```text
1af77ac fix: send invoice item ids for returns and exchanges
```

Frontend changes:

* `InvoiceItem` type includes `id?: number`.
* Returns selection uses unique line keys.
* Returns sends `returnedInvoiceItemIds` when selected lines have IDs.
* Returns still sends `returnedAssetIds` fallback.
* Exchanges selection uses unique line keys.
* Exchanges sends `returnedInvoiceItemId` when selected returned line has ID.
* Exchanges still sends `returnedAssetId` fallback.
* No financial payload fields are sent.
* Backend was untouched.

Verification reported green:

* typecheck
* lint on modified files
* build
* backend sanity:

  * duplicate-lines contract 23/23
  * mixed-items 39/39
  * exchange product support 26/26
  * return product support 20/20
  * API contracts 8/8

Remaining:

* Browser QA Network inspection for duplicate PRD-ID lines if not already done.
* Full line-level history still deferred.

---

## 5. Print System Work

---

### 🔖 Print Template Track — Transfer Checkpoint (through Phase 19T)

Read this block first. It is the transfer-ready summary of the invoice print
template track. Per-phase detail (19A–19T) follows below.

**Latest approved commit:** `19a79e1 fix: localize invoice print labels by language mode`

**Completed phases (invoice print track):**

| Phase | Commit | What shipped |
| --- | --- | --- |
| 19A | (discovery, no commit) | Print system discovery — found `InvoicePrintTemplate.tsx`, `print-config.ts`, iframe + `window.print()` flow; recommended a ViewModel before CSS. |
| 19B | `060fc43 feat: add invoice print view model` | `InvoicePrintViewModel` + `buildInvoicePrintViewModel` + dynamic title helper + `scripts/verify-invoice-print-view-model.js`. |
| 19C / 19C-REV / 19C-FIX / 19C-ALIGN | `f04ccb0`, `4ed279f`, `8ba51a8`, `5253daf` | Luxury Gold A4 bilingual template + reference match + one-page fit + layout alignment. |
| 19D-CLEAN | `5c7a740 refactor: stabilize invoice print template` | Template cleanup + `features/printing/lib/print-template-config.ts` (types + defaults, groundwork). |
| 19E | `71a03c0 feat: wire invoice print template config` | Runtime config wiring: theme CSS vars + section/field visibility + language mode from config; `resolveInvoicePrintTemplateConfig`. |
| 19F | `725dc59 feat: add invoice print options dialog` | Print options dialog on `/sales` (Document Type / Template / Language). Defaults Auto / Luxury Gold / Bilingual. Display-only `documentTitleOverride`. |
| 19G | `5f5c8f2 feat: persist invoice print defaults` | Persist defaults via `PUT /settings/by-key/printTemplateDefaults` (value `{ documentMode, templateId, languageMode }`); read from raw `settings.printTemplateDefaults`; Settings UI section "طباعة الفاتورة الافتراضية". NOT `PATCH /settings`. |
| 19H | `117bdbd feat: add compact invoice print template` | Real Compact A4 template + `InvoiceDocument.tsx` selector. |
| 19I | `bcbb917 feat: add minimal invoice print template` | Real Minimal A4 template (id `minimal`, replaced never-real `minimalA4` placeholder). |
| 19J | `d253313 feat: add thermal invoice print template` | Real Thermal receipt-style template (id `thermal`, replaced never-real `thermalReceipt` placeholder). All four templates enabled. |
| 19J handoff | `43b352a docs: update print template handoff through 19J` | Transfer checkpoint for phases 19A-19J. |
| 19K-Fix | `7488ec0 fix: harden invoice print template browser output` | Replaced Compact/Minimal/Thermal semantic headers with print-safe sections; mapped Thermal to 80mm paper and Luxury/Compact/Minimal to A4. |
| 19L-Fix | `e6a9b7e fix: allow luxury invoice print pagination` | Replaced Luxury fixed height/max-height with `min-height`, removed outer clipping, and allowed long Luxury invoices to paginate. |
| 19M-Fix | `19a79e1 fix: localize invoice print labels by language mode` | Added localized print label helper and expanded label language-mode coverage across Luxury/Compact/Minimal/Thermal. |
| 19N | (audit, no commit) | Manual browser print acceptance audit. No Critical/High findings; native print preview/iframe capture and real thermal roll behaviour remain partially/unverified. |
| 19O | (audit, no commit) | Print export test setup audit. `npm run test:print-export` currently fails because `tests/export-print.spec.ts` and the `tests/` directory are missing. |
| 19O-Fix | `test: add invoice print export smoke coverage` | Added `tests/export-print.spec.ts` + test fixture page `app/test/print-export/page.tsx`. `npm run test:print-export` now passes (11 tests). Covers all 4 templates × 3 language modes + invalid fallback. No native print preview. |
| 19Q | `feat: add invoice print builder config schema` | Created `print-builder-config.ts` defining strict Zod schema for builder settings, defaults, validation/stripping, and fallback/merge helpers. Added `useInvoicePrintBuilderConfig` storage hook. Mapped to `invoicePrintBuilderConfig` settings key via generic PUT endpoint. Mapped new verification script. No UI yet. |
| 19R | `feat: add invoice print builder toggle UI` | Added a Settings UI panel/tab "Print Builder" to edit section & field visibility overrides per template, with save/reset and warnings. Integrated overrides into `InvoiceDocument` render gateway. |
| 19S | `feat: add invoice print builder preview` | Extracted mock print data to `invoice-print-fixture.ts` and added a Live Print Preview panel to the Print Builder UI. Renders dynamic changes instantly on the client using mock data via `InvoiceDocument`. Added a preview language switcher. |
| 19T | `feat: add invoice print builder theme presets` | Added pre-defined Theme Presets (`classicGold`, `modernDark`, `softGold`, `minimalGray`, `thermalMono`) to Print Builder config schema, settings page dropdown selector, and dynamic stylesheets inside InvoiceDocument. |

**Current source of truth**

Template IDs (`features/printing/lib/invoice-print-options.ts` → `InvoicePrintTemplateId`):

```ts
"luxuryGold" | "compactA4" | "minimal" | "thermal"
```

Selector — `features/printing/components/InvoiceDocument.tsx`:

```ts
compactA4 -> CompactInvoicePrintTemplate
minimal   -> MinimalInvoicePrintTemplate
thermal   -> ThermalInvoicePrintTemplate
default   -> InvoicePrintTemplate   // Luxury Gold; also the unknown/missing fallback
```

Template components (`features/printing/components/`):

* `InvoicePrintTemplate.tsx` — Luxury Gold A4 (exports `InvoicePrintTemplateProps`, the shared props type).
* `CompactInvoicePrintTemplate.tsx` — Compact A4.
* `MinimalInvoicePrintTemplate.tsx` — Minimal A4.
* `ThermalInvoicePrintTemplate.tsx` — Thermal (~80mm, monochrome).
* `LocalizedPrintLabel.tsx` — reusable label-only localization helper (`LocalizedPrintLabel`, `formatLocalizedText`).
* `InvoiceDocument.tsx` — renderer selector (single entry point used by `/sales`).

Shared print layer:

* Data source: `features/printing/lib/invoice-print-view-model.ts` (`buildInvoicePrintViewModel`). All templates render ViewModel values only.
* Config: `features/printing/lib/print-template-config.ts` (`resolveInvoicePrintTemplateConfig`, `shouldShowArabic/English`, theme/section/field defaults).
* Options + persistence helpers: `features/printing/lib/invoice-print-options.ts` (`getDefaultInvoicePrintOptions`, `sanitizePrintTemplateDefaults`, `buildTemplateConfigFromPrintOptions`, `getPrintDocumentTitleOverride`).
* Dialog: `features/printing/components/InvoicePrintOptionsDialog.tsx` (all four templates enabled; no disabled placeholders remain).
* Defaults hook: `hooks/use-print-template-defaults.ts`.
* Callers: `app/[locale]/(dashboard)/sales/page.tsx` (print), `app/[locale]/(dashboard)/settings/page.tsx` (defaults UI, in the Receipt Layout tab).

Print defaults settings key: `printTemplateDefaults`

* Saved through: `PUT /settings/by-key/printTemplateDefaults` with body `{ value: { documentMode, templateId, languageMode } }`.
* Read from: raw settings map `settings.printTemplateDefaults` (via `GET /settings` → `data.settings`), then `sanitizePrintTemplateDefaults`.
* **Do NOT use** `PATCH /settings` for this key (its whitelist does not include it).

Fallback defaults (`getDefaultInvoicePrintOptions()`):

```ts
{ documentMode: "auto", templateId: "luxuryGold", languageMode: "bilingual" }
```

An invalid/unknown saved `templateId` sanitizes to `luxuryGold`; an unknown id at render also falls back to Luxury Gold via the selector.

**Safety state (19F → 19O-Fix):**

* Backend untouched throughout this print-template track. No DB schema changes, no migrations, no API changes.
* No invoice financial recalculation; no ViewModel calculation changes after print ViewModel stabilization.
* No posting/payment/stock/accounting/treasury/POS changes.
* No `localStorage` persistence; no PDF generator; no Search & Print; no Builder UI.
* Stashes were not touched. `next-env.d.ts` clean. Working tree was clean before this docs update.

**Checks passed (latest Phase 19M-Fix / audits):**

* `npm run typecheck` — clean.
* lint — passed with existing warnings only. Expected static-print `<img>` warnings only (each template renders the company logo via a raw `<img>`; `next/image` cannot be used in `renderToStaticMarkup` print HTML). No errors.
* `npm run build` — succeeded.
* `node scripts/verify-invoice-print-view-model.js` — ok.
* `node scripts/verify-print-template-config.js` — ok.
* financial-safety grep on changed print/settings files — clean.
* `npm run test:print-export` — ✅ passes (11 tests, added in 19O-Fix).

**Remaining gaps:**

* Native print preview/manual browser QA is still recommended.
* Real thermal printer / 80mm roll behavior still needs manual QA.
* All four templates are fixed layouts — no Print Template Builder UI yet.
* PDF generator not started.
* Search & Print not started.
* Backend read-only print-field exposure audit still pending.
* Document-type list remains the 19F set (expansion is a separate product decision).
* Legacy `features/printing/components/ReceiptPrintTemplate.tsx` retains an old `invoice.subtotal ?? items.reduce(...)` display fallback (untouched; predates 19x).

**Next recommended phase:** `Print Template Builder UI` (or other print track work)

* 19O-Fix is complete; all smoke tests pass.
* Builder UI has not been started.
* Do not start Builder UI, PDF generator, Search & Print, or document type expansion without a dedicated phase.

---

### Phase 19A — Invoice Print System Discovery

Status:

* Completed as read-only discovery.
* No files modified.
* No commit.
* No DB needed.

Key findings:

* Existing invoice print template:

  * `features/printing/components/InvoicePrintTemplate.tsx`
* Current invoice print is mainly used from:

  * `app/[locale]/(dashboard)/sales/page.tsx`
* Other print templates:

  * `features/printing/components/ReceiptPrintTemplate.tsx`
  * `features/printing/components/BarcodePrintTemplate.tsx`
  * `features/printing/components/ReportPrintTemplate.tsx`
* Print rendering flow:

  * React template to static HTML.
  * Hidden iframe.
  * browser `window.print()`.
* No real PDF generator currently.
* `lib/print/print-config.ts` contains print CSS, `@page`, print media, direction, and table behavior.
* Current invoice template is simple and raw `Invoice`-based.
* There is no dedicated `InvoicePrintViewModel`.
* Document title is not sufficiently dynamic by invoice type.
* Search & Print as a unified independent layer is not implemented.
* Current `/sales` print does not cover the complete documented invoice universe.
* Payments/customer/branch/company/installment details are not fully available in generic invoice detail.
* Gift Voucher and Customer Gold Purchase are not fully represented in current invoice print model.
* Do not start luxury CSS directly before creating a safe ViewModel.

Client documentation says print/search should support these Sales-domain document types:

* Sales Invoice.
* Return Invoice.
* Exchange Invoice.
* Installments Invoice.
* Deposit Invoice.
* Gift Voucher Invoice.
* Customer Gold Purchase Invoice.
* Invoices Search & Print.

Design reference:

* Luxury bilingual Arabic/English A4 invoice.
* Gold visual style.
* Logo/watermark.
* TRN.
* Client details.
* Invoice details.
* Items table.
* Payment method box.
* Amount details box.
* Notes.
* Customer signature.
* Company stamp.
* Salesperson signature.
* Footer with contact details.

Important 19A conclusion:

* The next safe phase is 19B — Invoice Print ViewModel.
* Do not implement CSS/template first.

---

### Phase 19B — Invoice Print ViewModel

Commit:

```text
060fc43 feat: add invoice print view model
```

Status:

* Completed.
* Frontend-only.
* No backend changes.
* No DB reads/writes.
* No migrations.

Files added:

* `features/printing/lib/invoice-print-view-model.ts`
* `scripts/verify-invoice-print-view-model.js`

Key result:

* Added `InvoicePrintViewModel` types.
* Added `buildInvoicePrintViewModel`.
* Added dynamic document title helper for sales/tax/return/exchange/installment/deposit/gift voucher/customer gold purchase.
* Totals map from invoice fields only.
* Line VAT/line total are not invented; missing data creates warnings.
* Company branding is mapped from settings/company options only.
* Verification script confirms titles, warnings, and no client-side financial truth recalculation.

---

### Phase 19C — Luxury Bilingual A4 Template

Commit:

```text
feat: add luxury invoice print template
```

Status:

* Completed.
* Frontend-only.
* No backend changes.
* No DB reads/writes.
* No migrations.
* No API contract changes.

Files changed:

* `features/printing/components/InvoicePrintTemplate.tsx`
* `docs/AI_HANDOFF.md`

Key result:

* Existing invoice print entrypoint remains compatible with `/sales`.
* `InvoicePrintTemplate` now builds/accepts `InvoicePrintViewModel`.
* Template renders a luxury bilingual Arabic/English A4-style invoice.
* Added gold borders, logo/initial fallback, watermark, company header, TRN display, client details, invoice details, items table, payment method box, amount details box, notes, signatures, and footer.
* Document title comes from the ViewModel, not a fixed title.
* Special sections render only available ViewModel data for exchange/installments/deposit/gift voucher/customer gold purchase.
* Warnings remain internal and are not printed for customers.
* The template formats totals from `viewModel.totals`; it does not recalculate VAT, subtotal, total, payments, stock, posting, or customer balances.

Remaining:

* Browser print preview visual QA should be performed with real sample invoices.
* Backend may later need read-only print fields for richer company/customer/branch/payment/installment data.
* Unified Search & Print route remains deferred.
* Special invoice type wiring remains deferred.

---

### Phase 19C-REV — Match Final Invoice Reference Image

Commit:

```text
style: match invoice print reference
```

Status:

* Completed.
* Frontend-only visual refinement.
* No backend changes.
* No DB reads/writes.
* No migrations.
* No API contract changes.

Files changed:

* `features/printing/components/InvoicePrintTemplate.tsx`
* `docs/AI_HANDOFF.md`

Key result:

* Refined the luxury invoice template to more closely match the final client reference image.
* Header is now centered and brand-led, with a dynamic primary brand line and secondary line derived from company data.
* Gold double border, decorative corners, central ornament, watermark placement, client/invoice boxes, table styling, payment/amount boxes, notes, signatures, and footer contact bar were tuned closer to the reference.
* Template still uses `InvoicePrintViewModel`.
* All company/customer/document/payment/totals data remains dynamic.
* No hardcoded DARFUS, TRN, phone, email, address, invoice number, or customer data.
* No VAT, subtotal, total, payment, stock, posting, or customer balance recalculation.
* CSS variables were added inside the template to keep future settings integration straightforward.

Remaining:

* Browser print preview QA with real sample invoices is still recommended.
* Settings UI for print branding/style remains deferred.
* Special invoice type wiring remains deferred.

---

### Phase 19C-FIX — One Page Print Fit + Header Visibility

Commit:

```text
fix: fit invoice print to one page
```

Status:

* Completed.
* Frontend-only print CSS/layout hotfix.
* No backend changes.
* No DB reads/writes.
* No migrations.
* No API contract changes.

Files changed:

* `features/printing/components/InvoicePrintTemplate.tsx`
* `docs/AI_HANDOFF.md`

Key result:

* Added template-local A4 `@page` sizing with zero print margin.
* Set the invoice page to `210mm x 297mm` and compacted header, detail boxes, table rows, notes, signatures, and footer spacing so normal invoices fit one A4 page.
* Fixed company EN/AR name visibility with safe dynamic fallbacks from ViewModel/company data.
* Centered company/document title/TRN stack independently of the logo.
* Kept the current print button/API compatible.
* No hardcoded company/customer/invoice data.
* No VAT, subtotal, total, payment, stock, posting, or customer balance recalculation.

Remaining:

* Very long invoices still need a future multi-page/page-break pass.
* Browser print preview QA with real sample invoices remains recommended.
* Print settings UI remains deferred.

---

### Phase 19C-ALIGN — Exact Reference Layout Alignment

Commit:

```text
style: align invoice print layout
```

Status:

* Completed.
* Frontend-only visual/layout alignment.
* No backend changes.
* No DB reads/writes.
* No migrations.
* No API contract changes.

Files changed:

* `features/printing/components/InvoicePrintTemplate.tsx`
* `docs/AI_HANDOFF.md`

Key result:

* Fixed print header visibility by avoiding the semantic `header` element hidden by global print CSS.
* Set the invoice template visual layout to LTR while isolating Arabic text with RTL spans.
* Restored large centered company/document title/TRN header.
* Fixed visual order for Client Details left and Invoice Details right.
* Fixed visual table column order to match the reference image.
* Fixed Payment Method left and Amount Details right.
* Moved notes/signatures/footer into a bottom tail area to use the page height more like the reference.
* Preserved one-page A4 sizing for normal invoices.
* No hardcoded company/customer/invoice data.
* No VAT, subtotal, total, payment, stock, posting, or customer balance recalculation.

Remaining:

* Final approval still needs browser print preview QA against real sample invoices.
* Very long invoices still need a future controlled multi-page/page-break pass.
* Print settings UI remains deferred.

---

### Phase 19D-CLEAN — Print System Stabilization Before Builder

Commit:

```text
refactor: stabilize invoice print template
```

Status:

* Completed.
* Frontend-only print module cleanup.
* No backend, no DB, no migrations, no API contract changes, no financial/business logic.
* No settings UI, no template builder UI, no drag & drop, no PDF generator, no Search & Print route.

Files changed:

* `features/printing/components/InvoicePrintTemplate.tsx`
* `features/printing/lib/print-template-config.ts` (new — types + defaults only)
* `docs/AI_HANDOFF.md`

Audit result (no critical issues found):

* Template is already financial-safe: only formats/displays `viewModel` values via `money()`/`text()`; no `items.reduce`, `calculateVat`, `subtotal =`, `total =`, `tax =`.
* ViewModel does not invent line financials (line net/vat/total stay `undefined` → render as `—`).
* Layout is LTR with isolated Arabic (`.luxury-ar` spans), per 19C-ALIGN — not global RTL.
* No hardcoded company/customer/invoice/TRN data; all dynamic with `—` fallbacks.
* No conflicting/duplicate CSS selectors of concern; A4 one-page sizing intact.

What was cleaned:

* Made the "Original Invoice Ref" detail row conditional so normal sales invoices no longer show an empty `—` row (return/exchange still show it).
* Removed dead `getBrandDisplay` second parameter (`englishName`) that was never passed.

Defaults / config shape extracted:

* Added `features/printing/lib/print-template-config.ts` with TYPES + SAFE DEFAULTS only:
  * `PrintTemplateLanguageMode`, `PrintTemplatePaperSize`, `PrintTemplateFieldVisibility`, `PrintTemplateSectionConfig`, `PrintTemplateThemeConfig`, `PrintTemplateConfig`.
  * `DEFAULT_PRINT_TEMPLATE_THEME/SECTIONS/FIELDS/CONFIG` (theme mirrors current luxury gold palette).
* Intentionally NOT wired to settings/backend/DB or the current render path — groundwork only for the future builder.

Preserved:

* A4 one-page behavior for normal invoices (template-local `@page` + sizing untouched).
* Layout direction (LTR + isolated Arabic).
* Dynamic data / `InvoicePrintViewModel` (still the single display source).
* No financial recalculation.
* Old print button/API compatibility (`InvoicePrintTemplate` props `invoice/company/cashierName/locale/labels/settings/viewModel` unchanged; caller `app/[locale]/(dashboard)/sales/page.tsx` untouched).

Verification reported green:

* typecheck
* lint on changed files: 0 errors, 2 pre-existing `<img>` warnings (watermark/logo — intentional for static print HTML; `next/image` cannot be used in `renderToStaticMarkup`).
* build
* `node scripts/verify-invoice-print-view-model.js` → ok
* financial-safety grep on template + `features/printing/lib` → no financial recalculation

Remaining gaps:

* `InvoicePrintLabels` still carries ~22 fields of which only `trn` + `assetId` are used by the template; kept intact because it is the caller's compatibility contract (caller out of this phase's scope).
* Browser print-preview QA with real sample invoices still recommended.
* Line-level net/VAT/total remain unavailable from backend (do not invent).
* Payments/customer phone-TRN-address/installment schedule still not in generic invoice detail (backend read-only exposure needed later).
* Unified Search & Print route, special-type wiring, and the print builder/settings UI remain deferred.

Next suggested phase:

* Print Template Config / Builder groundwork can now build on `print-template-config.ts`; OR proceed with `19D — Wire Sales / Return / Exchange Print Data` (read-only wiring). Keep print read-only; no financial recalculation.

---

### Phase 19E — Print Template Config Runtime Wiring

Commit:

```text
feat: wire invoice print template config
```

Status:

* Completed.
* Frontend-only print config runtime wiring.
* No backend, no DB, no migrations, no API contract changes, no financial/business logic.
* No settings UI, no template builder UI, no drag & drop, no print dialog, no PDF generator, no Search & Print route.

Files changed:

* `features/printing/lib/print-template-config.ts` (resolver + language helpers + a few non-critical toggle fields + `watermarkOpacity`)
* `features/printing/components/InvoicePrintTemplate.tsx` (reads a resolved config)
* `scripts/verify-print-template-config.js` (new)
* `docs/AI_HANDOFF.md`

Config resolver added:

* `resolveInvoicePrintTemplateConfig(overrides?)` — dependency-free per-group shallow merge onto `DEFAULT_PRINT_TEMPLATE_CONFIG`; `null`/`undefined`/missing overrides never break the template (returns the exact current default look).
* `PrintTemplateConfigOverrides` type allows partial nested overrides (tweak one color/toggle without restating the config).
* `shouldShowArabic` / `shouldShowEnglish` language-mode helpers.
* Extended (additive, defaults true / current values): `theme.watermarkOpacity` (0.04) and fields `itemAssetId`, `originalInvoiceRef`, `footerPhone`, `footerEmail`, `footerAddress`.

Template wiring (defaults preserve the exact current look):

* `InvoicePrintTemplate` accepts an optional `templateConfig?: PrintTemplateConfigOverrides` (also reads `settings.printTemplateConfig` via a safe typed access); resolves to a full config via the resolver.
* Theme: `--invoice-*` CSS variables + `--invoice-watermark-opacity` are now set from `config.theme` on the root article `style` (defaults equal the previous hardcoded palette, so no visual change).
* Section visibility wired for: header, clientDetails, invoiceDetails, itemsTable, specialSummary, paymentMethod, amountDetails, notes, terms, signatures, footer.
* Field visibility wired (non-critical only): companyLogo, companyTrn, watermark, customerPhone, customerTrn, customerAddress, salesperson, originalInvoiceRef, itemAssetId, footerPhone/Email/Address. Legal/core fields (invoice no./date, totals, VAT, TRN default) stay on by default.
* Language mode foundation: `shouldShowArabic/English` applied to the main document title and brand AR/EN lines only; bilingual (default) shows both = unchanged. Full per-label language mode deferred to the builder/UI phase.
* Watermark: gated by `fields.watermark` with opacity from `theme.watermarkOpacity`; watermark source stays the company logo (ViewModel). Background image config intentionally not added/wired (A4 risk) — deferred.
* Icons: footer still uses the existing inline unicode glyphs; no icon dependency added — icon config deferred to the UI phase.

Preserved:

* Default visual behavior (no `templateConfig` → identical output).
* Old print button/API compatibility (all previous props still work; caller `app/[locale]/(dashboard)/sales/page.tsx` untouched).
* `InvoicePrintViewModel` remains the single display source; no new API calls.
* No hardcoded company/customer/invoice/TRN data.
* No financial recalculation (grep on template + `features/printing/lib` clean).

Verification reported green:

* typecheck
* lint on changed files: 0 errors, 2 pre-existing `<img>` warnings (watermark/logo — static print HTML).
* build
* `node scripts/verify-invoice-print-view-model.js` → ok
* `node scripts/verify-print-template-config.js` → ok (defaults complete, partial merge correct, language helpers correct)
* financial-safety grep → clean

Remaining gaps:

* No settings UI / builder UI / persistence yet — `templateConfig` is accepted but nothing supplies overrides in production (defaults only).
* Full per-label language mode (box titles/detail labels) still bilingual; deferred.
* Background image + configurable icons deferred.
* Backend read-only exposure of payments/customer/branch/installment print fields still pending (unchanged from 19A/19C).

Next suggested phase:

* Print Template Builder / Settings UI to produce `PrintTemplateConfigOverrides` (and later persist them), OR `19D — Wire Sales / Return / Exchange Print Data`. Keep print read-only.

---

### Phase 19F — Print Dialog & Template Selection

Commit:

```text
feat: add invoice print options dialog
```

Status:

* Completed.
* Frontend-only print options dialog.
* No backend, no DB, no migrations, no API contract changes.
* No settings persistence (no DB / no localStorage), no builder UI, no drag & drop, no PDF generator, no Search & Print route.
* No financial/business logic.

Files changed/added:

* `features/printing/lib/invoice-print-options.ts` (new — options model + helpers)
* `features/printing/components/InvoicePrintOptionsDialog.tsx` (new — dialog UI)
* `features/printing/components/InvoicePrintTemplate.tsx` (optional `documentTitleOverride` prop, display-only)
* `app/[locale]/(dashboard)/sales/page.tsx` (print button opens the dialog; print flow passes options)
* `docs/AI_HANDOFF.md`

Print Dialog:

* Clicking Print in the invoice detail modal on `/sales` now opens `InvoicePrintOptionsDialog` instead of printing immediately.
* Options: Document Type (Auto + 8 manual types), Template (Luxury Gold A4 active; Compact/Minimal/Thermal shown disabled "Coming soon"), Language Mode (Bilingual/Arabic/English).
* Defaults: Auto + Luxury Gold + Bilingual (printing with defaults = identical output to before).
* Built with existing `Modal`/`NativeSelect`/`Button` components; bilingual inline labels; no new dependencies; no new i18n keys.

Document Type status — WIRED (title-only):

* `getPrintDocumentTitleOverride(mode)` returns display titles mirroring the ViewModel wording; template applies it to the printed header title + the "Invoice Type" detail row only.
* It never changes invoice type, items, totals, VAT, or stored data. `auto` (default) keeps ViewModel behaviour.
* `printModeMatchesInvoice` powers a non-blocking advisory warning in the dialog when the chosen type doesn't match the invoice's stored type.

templateConfig passing:

* `buildTemplateConfigFromPrintOptions(options)` → `{ languageMode }` passed as `templateConfig` (19E wiring), so Arabic/English/Bilingual affects titles + brand lines exactly as 19E defined.
* `printInvoice(invoice, options?)` keeps direct-print compatibility — calling with no options uses `getDefaultInvoicePrintOptions()`.

Preserved / safety:

* Old template props all optional/unchanged; template works with no `templateConfig`/`documentTitleOverride`.
* `InvoicePrintViewModel` remains the single display source; no new API calls; no hardcoded company/customer/invoice data (dialog labels are generic document-type wording only).
* No financial recalculation (grep clean on dialog/options/template/sales print path).

Verification reported green:

* typecheck
* lint on changed files: 0 errors; 2 pre-existing `<img>` warnings (template watermark/logo).
* build
* `verify-invoice-print-view-model.js` → ok
* `verify-print-template-config.js` → ok
* financial-safety grep → clean for 19F files. NOTE (pre-existing, untouched): `ReceiptPrintTemplate.tsx` line ~57 has an old display fallback `invoice.subtotal ?? items.reduce(...)` from the legacy receipt template — predates the 19x series; flag for a future receipt-template cleanup phase.

Remaining gaps:

* Options are per-print only — no persistence (deferred to a settings/persistence phase).
* Only one real template; Compact/Minimal/Thermal are placeholders.
* Language mode still title/brand-level only (full per-label mode deferred).
* Legacy receipt template retains its old subtotal display fallback (see note above).
* Backend read-only print fields (payments/customer/branch/installments) still pending.

Next suggested phase:

* Template Config persistence / Settings UI, or Print Template Builder UI, or additional templates (Compact A4). Keep print read-only.

---

### Phase 19G — Persist Invoice Print Defaults

Commit:

```text
feat: persist invoice print defaults
```

Status:

* Completed (audit + implementation, both approved).
* Frontend-only. NO backend routes/models/migrations. NO `PATCH /settings` whitelist change. NO DB schema change.
* Persistence reuses the existing generic setting store; no localStorage / no hidden fallback persistence.

Audit result (D): Safe to implement without DB/API change — the `settings` table is a JSONB key/value store, `GET /settings` returns the full raw map (`data.settings`), and `PUT /settings/by-key/:key` accepts any key with arbitrary JSONB value (no whitelist). Product decision (per user): keep the exact 19F document-type list; do NOT adopt the audit prompt's alternative list.

Files changed/added:

* `features/printing/lib/invoice-print-options.ts` — `sanitizePrintTemplateDefaults(raw)` validates an untrusted value against the 19F enums (documentMode/templateId/languageMode), falling back to Auto / Luxury Gold / Bilingual.
* `hooks/use-print-template-defaults.ts` (new) — reads `settings.printTemplateDefaults` (sanitized) and saves via `PUT /settings/by-key/printTemplateDefaults` with `{ value }`, then `refreshSettings()`.
* `contexts/settings-context.tsx` — added `printTemplateDefaults?: { documentMode; templateId; languageMode }` to `AppSettings` and to the JSON-parse keys read from the raw settings map (read-only; save path is the by-key route, so no PATCH whitelist edit).
* `features/printing/components/InvoicePrintOptionsDialog.tsx` — new optional `initialOptions` prop; the dialog seeds from it (falls back to 19F defaults).
* `app/[locale]/(dashboard)/sales/page.tsx` — reads saved defaults via the hook; passes `initialOptions={savedPrintDefaults}` to the dialog; `printInvoice(invoice, options = savedPrintDefaults)` stays direct-print compatible.
* `app/[locale]/(dashboard)/settings/page.tsx` — new "Invoice Print Defaults" card in the existing Receipt Layout tab: Document Type / Template / Language selects + Save (mirrors the receipt section's raw-select pattern; existing components only).
* `docs/AI_HANDOFF.md`.

Persistence contract:

* Key: `printTemplateDefaults`. Value: `{ documentMode: string; templateId: string; languageMode: string }`.
* Read: raw settings map → sanitize → fallback to 19F defaults.
* Write: `PUT /settings/by-key/printTemplateDefaults` `{ value: sanitized }` → `refreshSettings()` (the settings context is useState-backed, refreshed via GET /settings; SSE `Settings` event also fires).

Preserved / safety:

* No saved value → identical 19F behaviour (Auto / Luxury Gold / Bilingual).
* Direct `printInvoice(invoice)` still works; dialog still optional.
* Values sanitized against enums before both read-use and save (the by-key route stores arbitrary JSON, so the frontend guards).
* No financial/business logic; no invoice/posting/payment/stock/treasury/accounting change; no hardcoded company/customer/invoice data.

Verification reported green:

* typecheck
* lint on changed files: 0 errors; warnings are all pre-existing/unrelated (settings logo `<img>`, `isAuthenticated` dep in existing settings-context callbacks).
* build
* `verify-invoice-print-view-model.js` → ok
* `verify-print-template-config.js` → ok
* financial-safety grep on changed print/settings files → clean

Remaining gaps:

* Document-type list intentionally still the 19F set (the audit-prompt list — Simplified Tax / Proforma / Quotation / Delivery / Credit / Debit Note — is a separate product decision, not implemented).
* Still one real template (Compact/Minimal/Thermal are placeholders).
* Language mode remains title/brand-level (full per-label mode deferred).
* Legacy `ReceiptPrintTemplate` subtotal display fallback still untouched.
* Backend read-only print fields (payments/customer/branch/installments) still pending.

Next suggested phase:

* Real Compact A4 template, or Print Template Builder UI, or expand document-type list (needs product sign-off). Keep print read-only.

---

### Phase 19H — Real Compact A4 Invoice Template

Commit:

```text
feat: add compact invoice print template
```

Status:

* Completed. Frontend-only.
* No backend/DB/migrations/API changes; no settings persistence logic change (only reads existing `templateId`); no localStorage/PDF/Search & Print/Builder UI.
* No financial/business logic; no invoice/posting/payment/stock/accounting change.

Template IDs (unchanged convention — camelCase; NOT the audit prompt's hyphenated examples):

* `luxuryGold` → existing Luxury Gold A4 (unchanged output).
* `compactA4` → new Compact A4 template.
* invalid/missing → falls back to `luxuryGold` (via `sanitizePrintTemplateDefaults` for saved values, and via the renderer selector at render time).

Files changed/added:

* `features/printing/components/CompactInvoicePrintTemplate.tsx` (new) — dense A4 template. Same props as Luxury (`InvoicePrintTemplateProps`), same `InvoicePrintViewModel` data source, honours `templateConfig` (theme/language/sections/fields) and `documentTitleOverride`. Smaller header, dense meta grid, compact items table + totals, minimal decoration. No `items.reduce`/VAT/subtotal/total math — ViewModel values only.
* `features/printing/components/InvoiceDocument.tsx` (new) — renderer selector: `templateId === "compactA4"` → Compact, else (luxuryGold/unknown) → Luxury.
* `features/printing/components/InvoicePrintTemplate.tsx` — exported `InvoicePrintTemplateProps` only (no output/behaviour change).
* `features/printing/lib/invoice-print-options.ts` — `InvoicePrintTemplateId = "luxuryGold" | "compactA4"`; `compactA4` added to `ALLOWED_TEMPLATE_IDS` (sanitize still falls back to luxuryGold for invalid).
* `features/printing/components/InvoicePrintOptionsDialog.tsx` — Compact A4 enabled (Minimal/Thermal still disabled placeholders).
* `app/[locale]/(dashboard)/sales/page.tsx` — prints via `<InvoiceDocument templateId={options.templateId} .../>` instead of the Luxury template directly.
* `app/[locale]/(dashboard)/settings/page.tsx` — Compact A4 added to the Template select.
* `docs/AI_HANDOFF.md`.

Selection / persistence behaviour:

* Print dialog and settings both offer Luxury Gold + Compact A4 (enabled); Minimal/Thermal remain "Coming soon" disabled.
* A saved `printTemplateDefaults.templateId = "compactA4"` opens the dialog with Compact selected and prints Compact.
* An invalid/old saved value sanitizes to `luxuryGold`.

Compatibility:

* `printInvoice(invoice)` with no options → saved defaults (or 19F defaults) → Luxury Gold + Auto + Bilingual when nothing saved.
* Luxury Gold rendering unchanged.
* No saved settings → identical previous behaviour.
* Direct print calls do not crash; unknown templateId → Luxury.

Verification reported green:

* typecheck
* lint on changed files: 0 errors; only pre-existing/expected `<img>` warnings (settings logo preview + Compact/Luxury print logos — static print HTML can't use `next/image`).
* build
* `verify-invoice-print-view-model.js` → ok
* `verify-print-template-config.js` → ok
* financial-safety grep on Compact template + selector → clean

Remaining gaps:

* Minimal A4 / Thermal Receipt still placeholders.
* Compact honours language/title/theme/section/field config but is a fixed dense layout (no per-user layout builder).
* Document-type list still the 19F set (expansion is a separate product decision).
* Legacy `ReceiptPrintTemplate` subtotal display fallback still untouched.
* Backend read-only print fields (payments/customer/branch/installments) still pending.

Next suggested phase:

* Print Template Builder UI, or a third template (Minimal A4), or backend read-only print-field exposure. Keep print read-only.

---

### Phase 19I — Real Minimal A4 Invoice Template

Commit:

```text
feat: add minimal invoice print template
```

Status:

* Completed. Frontend-only.
* No backend/DB/migrations/API changes; no settings-persistence architecture change (only reads existing `templateId`); no localStorage/PDF/Search & Print/Builder UI.
* No financial/business logic; no invoice/posting/payment/stock/accounting change.

Template IDs (camelCase convention preserved):

* `luxuryGold` → Luxury Gold A4 (unchanged).
* `compactA4` → Compact A4 (unchanged).
* `minimal` → new Minimal A4 template. (Replaced the old disabled `minimalA4` placeholder value, which was never a real allowed id.)
* `thermalReceipt` → still a disabled placeholder.
* invalid/missing → falls back to `luxuryGold` (sanitize for saved values + selector at render).

Files changed/added:

* `features/printing/components/MinimalInvoicePrintTemplate.tsx` (new) — clean, white, spacious A4 layout (more spacious than Compact, less ornate than Luxury). Same `InvoicePrintTemplateProps` + same `InvoicePrintViewModel`; honours `templateConfig` (theme/language/sections/fields) and `documentTitleOverride`. No `items.reduce`/VAT/subtotal/total math — ViewModel values only.
* `features/printing/components/InvoiceDocument.tsx` — selector now: `compactA4` → Compact, `minimal` → Minimal, else (luxuryGold/unknown) → Luxury.
* `features/printing/lib/invoice-print-options.ts` — `InvoicePrintTemplateId` adds `"minimal"`; `minimal` added to `ALLOWED_TEMPLATE_IDS`.
* `features/printing/components/InvoicePrintOptionsDialog.tsx` — Minimal A4 enabled (value `minimal`); Thermal still disabled placeholder.
* `app/[locale]/(dashboard)/settings/page.tsx` — Minimal A4 added to the Template select.
* `docs/AI_HANDOFF.md`.
* (sales/page.tsx unchanged — it already renders via `<InvoiceDocument templateId={options.templateId} .../>`.)

Selection / persistence behaviour:

* Print dialog and settings both offer Luxury Gold + Compact A4 + Minimal A4 (enabled); Thermal remains "Coming soon" disabled.
* A saved `printTemplateDefaults.templateId = "minimal"` opens the dialog with Minimal selected and prints Minimal. `compactA4`/`luxuryGold` still work. Invalid → luxuryGold.

Compatibility:

* `printInvoice(invoice)` with no options → saved defaults (or 19F defaults) → Luxury Gold when nothing saved.
* Luxury Gold and Compact A4 output unchanged.
* No saved settings → identical previous behaviour.
* Direct print calls do not crash; unknown templateId → Luxury.

Verification reported green:

* typecheck
* lint on changed files: 0 errors; only pre-existing/expected `<img>` warnings (settings logo preview + Minimal print logo — static print HTML can't use `next/image`).
* build
* `verify-invoice-print-view-model.js` → ok
* `verify-print-template-config.js` → ok
* financial-safety grep on Minimal template + selector → clean

Remaining gaps:

* Thermal Receipt still a placeholder.
* All three templates are fixed layouts (no per-user layout builder).
* Document-type list still the 19F set (expansion is a separate product decision).
* Legacy `ReceiptPrintTemplate` subtotal display fallback still untouched.
* Backend read-only print fields (payments/customer/branch/installments) still pending.

Next suggested phase:

* Print Template Builder UI, or a Thermal receipt-style template, or backend read-only print-field exposure. Keep print read-only.

---

### Phase 19J — Real Thermal Receipt-Style Invoice Template

Commit:

```text
feat: add thermal invoice print template
```

Status:

* Completed. Frontend-only.
* No backend/DB/migrations/API changes; no settings-persistence architecture change (only reads existing `templateId`); no localStorage/PDF/Search & Print/Builder UI.
* No financial/business logic; no invoice/posting/payment/stock/accounting change. Still an invoice print template (not POS).

Template IDs (all four fixed templates now real; convention preserved):

* `luxuryGold` → Luxury Gold A4 (unchanged).
* `compactA4` → Compact A4 (unchanged).
* `minimal` → Minimal A4 (unchanged).
* `thermal` → new Thermal receipt-style template. (Replaced the old disabled `thermalReceipt` placeholder value, which was never a real allowed id.)
* invalid/missing → falls back to `luxuryGold` (sanitize for saved values + selector at render).

Files changed/added:

* `features/printing/components/ThermalInvoicePrintTemplate.tsx` (new) — narrow (~80mm) monochrome receipt-style layout: centered header/logo, compact invoice + customer blocks, receipt-style item rows (name + qty/karat/weight/total sub-line, not a wide A4 table), clear totals block, dashed rules, minimal decoration, `@page { size: 80mm auto }`. Same `InvoicePrintTemplateProps` + same `InvoicePrintViewModel`; honours `templateConfig` (language/sections/fields; only text/muted colours from theme since thermal is monochrome) and `documentTitleOverride`. No `items.reduce`/VAT/subtotal/total math — ViewModel values only.
* `features/printing/components/InvoiceDocument.tsx` — selector now: `compactA4` → Compact, `minimal` → Minimal, `thermal` → Thermal, else (luxuryGold/unknown) → Luxury.
* `features/printing/lib/invoice-print-options.ts` — `InvoicePrintTemplateId` adds `"thermal"`; `thermal` added to `ALLOWED_TEMPLATE_IDS`.
* `features/printing/components/InvoicePrintOptionsDialog.tsx` — Thermal enabled (value `thermal`). All four fixed templates now enabled; no disabled placeholders remain.
* `app/[locale]/(dashboard)/settings/page.tsx` — Thermal added to the Template select (distinct from the unrelated receipt paper-size select).
* `docs/AI_HANDOFF.md`.
* (sales/page.tsx unchanged — it already renders via `<InvoiceDocument templateId={options.templateId} .../>`.)

Selection / persistence behaviour:

* Print dialog and settings both offer Luxury Gold + Compact A4 + Minimal A4 + Thermal (all enabled).
* A saved `printTemplateDefaults.templateId = "thermal"` opens the dialog with Thermal selected and prints Thermal. compactA4/minimal/luxuryGold still work. Invalid → luxuryGold.

Compatibility:

* `printInvoice(invoice)` with no options → saved defaults (or 19F defaults) → Luxury Gold when nothing saved.
* Luxury Gold, Compact A4 and Minimal A4 output unchanged.
* No saved settings → identical previous behaviour.
* Direct print calls do not crash; unknown templateId → Luxury.
* Thermal works inside the current iframe print pipeline (renderPrintDocument + printHtmlDocument).

Verification reported green:

* typecheck
* lint on changed files: 0 errors; only pre-existing/expected `<img>` warnings (settings logo preview + Thermal print logo — static print HTML can't use `next/image`).
* build
* `verify-invoice-print-view-model.js` → ok
* `verify-print-template-config.js` → ok
* financial-safety grep on Thermal template + selector → clean

Remaining gaps:

* All four templates are fixed layouts (no per-user layout builder).
* Thermal preview page size depends on the browser's thermal/roll print support; the layout renders as a narrow receipt regardless.
* Document-type list still the 19F set (expansion is a separate product decision).
* Legacy `ReceiptPrintTemplate` subtotal display fallback still untouched.
* Backend read-only print fields (payments/customer/branch/installments) still pending.

Next suggested phase:

* Print Template Builder UI (per-user layout/section/theme editor over the existing config), or backend read-only print-field exposure, or invoice print browser QA across the four templates. Keep print read-only.

---

### Phase 19K-Fix — Safe Print Browser QA Fixes

Commit:

```text
fix: harden invoice print template browser output
```

Status:

* Completed. Frontend-only safe browser-print hardening.
* No backend/DB/migrations/API changes.
* No financial/business logic; no invoice/posting/payment/stock/accounting/treasury/POS changes.
* No Builder UI, no PDF generator, no Search & Print, no document-type expansion.

Files changed:

* `features/printing/components/CompactInvoicePrintTemplate.tsx`
* `features/printing/components/MinimalInvoicePrintTemplate.tsx`
* `features/printing/components/ThermalInvoicePrintTemplate.tsx`
* `app/[locale]/(dashboard)/sales/page.tsx`
* `docs/AI_HANDOFF.md`

Key fixes:

* Replaced semantic template-level `header` tags with print-safe `section` tags in Compact A4, Minimal A4, and Thermal templates so shared print CSS does not hide their printed company/logo/title/TRN headers.
* Fixed invoice print paper-size mapping by selected template:

  * `thermal` -> `80mm`
  * `luxuryGold`, `compactA4`, `minimal` -> `A4`

Preserved:

* Template selection remains unchanged.
* Persisted defaults remain unchanged.
* Invalid/missing template IDs still fall back to Luxury Gold.
* Luxury Gold output was not modified.

Remaining gaps:

* Luxury long-invoice truncation/page-break redesign still pending.
* Full language mode expansion across every label/header still pending.
* Missing `tests/export-print.spec.ts` / `npm run test:print-export` target still pending.
* Browser/manual print preview QA across all four templates is still recommended.

---

### Phase 19L-Fix — Luxury Gold Long Invoice Pagination

Commit:

```text
fix: allow luxury invoice print pagination
```

Status:

* Completed. Frontend-only Luxury Gold print layout fix.
* No backend/DB/migrations/API changes.
* No financial/business logic; no invoice/posting/payment/stock/accounting/treasury/POS changes.
* No Builder UI, no PDF generator, no Search & Print, no language mode expansion.

Files changed:

* `features/printing/components/InvoicePrintTemplate.tsx`
* `docs/AI_HANDOFF.md`

Key fixes:

* Fixed Luxury Gold long-invoice clipping by replacing fixed A4 `height`/`max-height` with natural `min-height`.
* Removed the outer Luxury Gold clipping rule so long invoices can flow beyond one printed page.
* Existing table row / totals / signatures / notes page-break hardening remains in place.

Remaining gaps:

* Manual browser print preview QA is still recommended.
* Full language mode expansion across every label/header still pending.
* Missing `tests/export-print.spec.ts` / `npm run test:print-export` target still pending.
* Print Template Builder UI has not been started.

---

### Phase 19M-Fix — Invoice Print Language Label Expansion

Commit:

```text
fix: localize invoice print labels by language mode
```

Status:

* Completed. Frontend-only print label rendering fix.
* No backend/DB/migrations/API changes.
* No financial/business logic; no invoice/posting/payment/stock/accounting/treasury/POS changes.
* No Builder UI, no PDF generator, no Search & Print, no document-type expansion.

Files changed:

* `features/printing/components/LocalizedPrintLabel.tsx`
* `features/printing/components/InvoicePrintTemplate.tsx`
* `features/printing/components/CompactInvoicePrintTemplate.tsx`
* `features/printing/components/MinimalInvoicePrintTemplate.tsx`
* `features/printing/components/ThermalInvoicePrintTemplate.tsx`
* `docs/AI_HANDOFF.md`

Key fixes:

* Added a reusable localized print label helper plus string formatter for label-only print contexts.
* Expanded `languageMode` coverage across Luxury Gold, Compact A4, Minimal A4, and Thermal labels.
* Arabic-only now suppresses English labels in template labels.
* English-only now suppresses Arabic labels in template labels.
* Bilingual remains the default and stays visually close to the previous output.
* Dynamic values, ViewModel values, totals, payment amounts, and document title override behavior remain display-only and unchanged.

Remaining gaps:

* Manual browser print preview QA is still recommended.
* Missing `tests/export-print.spec.ts` / `npm run test:print-export` target still pending.
* Print Template Builder UI has not been started.

---

### Phase 19N — Manual Browser Print Acceptance Audit

Status:

* Completed as audit-only.
* No files modified.
* No commit.
* No backend/DB/migrations/API changes.
* No financial/business logic; no invoice/posting/payment/stock/accounting changes.

Key findings:

* No Critical findings.
* No High findings.
* Browser print dialog and source wiring were partially verified.
* Native print preview / iframe capture was not fully exercised due to browser automation limitations.
* Real thermal printer / 80mm roll-print behavior remains unverified.
* Dynamic bilingual customer/product/company data is not a label-localization bug; only labels are expected to switch by language mode.

Recommendation from audit:

* Proceed to missing print-export test setup.

---

### Phase 19O — Print Export Test Setup Audit

Status:

* Completed as audit-only.
* No persistent file changes.
* No commit.
* No backend/DB/migrations/API changes.
* No production print component changes.

Key findings:

* `npm run test:print-export` currently fails because `tests/export-print.spec.ts` does not exist.
* The `tests/` directory is absent.
* Current script:

  ```text
  playwright test tests/export-print.spec.ts --project="Desktop Large"
  ```

* Playwright is installed/configured through:

  * `playwright.config.ts`
  * `@playwright/test` 1.51.1

Preferred next implementation:

* `Phase 19O-Fix — Add Minimal Print Export Smoke Test`.
* Prefer a static render smoke test rather than native browser print preview.
* Cover all template IDs:

  * `luxuryGold`
  * `compactA4`
  * `minimal`
  * `thermal`

* Cover language modes:

  * `bilingual`
  * `ar`
  * `en`

* Cover invalid template fallback to Luxury Gold.
* Do not touch backend/DB/API/migrations.
* Do not change financial/business logic.
* Do not start Builder UI.

---

### Phase 19O-Fix — Add Minimal Print Export Smoke Test

Status:

* Completed.
* Added `tests/export-print.spec.ts` (new file).
* Added `app/test/print-export/page.tsx` (test-only fixture page).
* Updated `.gitignore` to ignore `playwright-report/` and `test-results/`.
* No backend/DB/migrations/API changes.
* No production print component changes.
* No financial/business logic changes.

What was added:

* `tests/export-print.spec.ts` — Playwright smoke test (11 tests).
* `app/test/print-export/page.tsx` — test-only fixture page that renders all 4 templates × 3 language modes with static fixture data.
* Test strategy: static render smoke via Playwright navigating to the fixture page.
* Does NOT call `window.print()` or use native print preview.

Templates covered:

* `luxuryGold` — asserts `luxury-invoice` class + `size: A4`.
* `compactA4` — asserts `compact-invoice` class + `size: A4`.
* `minimal` — asserts `minimal-invoice` class + `size: A4`.
* `thermal` — asserts `thermal-invoice` class + `80mm`.

Language modes covered:

* `bilingual` — English + Arabic labels present.
* `ar` — Arabic labels present, English labels suppressed.
* `en` — English labels present, Arabic labels suppressed.

Invalid template fallback:

* Unknown template ID falls back to Luxury Gold (asserts `luxury-invoice` class, no other template classes).

---

### Phase 19Q — Print Builder Config Schema / Storage Design

Status:

* Completed.
* Created `features/printing/lib/print-builder-config.ts` (Zod validation, sanitization, defaults, and resolution helpers).
* Created `hooks/use-invoice-print-builder-config.ts` (storage hook reusing generic PUT route).
* Created `scripts/verify-print-builder-config.js` (VM verification unit tests).
* Updated `contexts/settings-context.tsx` to include `invoicePrintBuilderConfig` type field.
* No UI yet.
* No backend/DB/migrations/API changes.
* No financial/business logic changes.

What was added:

* Zod schema `InvoicePrintBuilderConfigSchema` supporting overrides per template ID under a single `invoicePrintBuilderConfig` key.
* Verification unit test script ensuring that:
  * Raw input is strictly sanitized and validated against allowed properties (stripping unknown keys, rather than failing validation entirely).
  * Missing or malformed payloads fall back to standard builder defaults.
  * Template configuration override extraction and template default merging operate safely without throwing in the render path.
* Storage hook reading/writing directly via `PUT /settings/by-key/invoicePrintBuilderConfig`.

---

### Phase 19R — Print Builder MVP UI: Section / Field Toggles

Status:

* Completed.
* Added "Print Builder" tab panel to Settings UI page `app/[locale]/(dashboard)/settings/page.tsx` with selectors for template ID (`luxuryGold`, `compactA4`, `minimal`, `thermal`).
* Added UI switches/toggles for all 11 config sections and 14 individual fields from `print-template-config.ts` dynamically bound to active template form states.
* Wired overrides into `InvoiceDocument.tsx` render path selector.
* Implemented template reset (clears specific overrides, keeps defaults) and save handlers using `useInvoicePrintBuilderConfig`.
* Display-only: warnings shown if critical columns/totals are disabled; no recalculations or DB ledger impact.
* No backend/DB/migrations/API changes.
* No financial/business logic changes.

---

### Phase 19S — Print Builder Preview Panel

Status:

* Completed.
* Extracted static invoice print data to `features/printing/lib/invoice-print-fixture.ts` to share between test runners and settings UI.
* Refactored Settings Print Builder tab to a split-screen layout (toggles editor on the left, live mock preview panel on the right).
* Live Preview updates instantly as toggles are flipped (uses live React state without requiring settings save first).
* Responsive layout hides/stacks preview below toggles on mobile viewports.
* Added live language selector (Bilingual, Arabic, English) for previewing label visibility.
* Display-only: Preview renders strictly local fixture data (no DB/API invoice calls).
* No backend/DB/migrations/API changes.
* No financial/business logic changes.

---

### Phase 19T — Print Builder Theme Presets

Status:

* Completed.
* Added `themePreset` field and `PRINT_BUILDER_THEME_PRESETS` predefined options mapping (`classicGold`, `modernDark`, `softGold`, `minimalGray`, `thermalMono`) to `print-builder-config.ts` and Zod schema.
* Added `themePreset` key to `PrintTemplateConfigOverrides` and `PrintTemplateConfig` in `print-template-config.ts` so template components resolve presets.
* Refactored Settings UI Print Builder panel to show a Theme Preset dropdown.
* Integrated preset resolving color merge logic inside `InvoiceDocument.tsx` so preset values cascade safely.
* Expanded `scripts/verify-print-builder-config.js` to assert that themePreset validates correctly, sanitizes invalid presets, and resolves colors.
* Added E2E Playwright smoke assertion checking that theme preset renders without crashing.
* No backend/DB/migrations/API changes.
* No financial/business logic changes.

---

### Phase 19U-Fix — Print Builder Persistence + Modal Scroll Lock

Status:

* Completed. Two focused frontend-only bugfixes from the Phase 19U audit.
* No backend/DB/migrations/API/new-endpoint changes. No `PATCH /settings`. No localStorage. No financial/business logic. No new Builder feature.

Bug 1 — Builder customization not applied / appeared reset:

* Root cause: `contexts/settings-context.tsx` parsed only `["paymentMethods", "receipt", "barcode", "printTemplateDefaults"]` from the JSON-serialized settings map, so `settings.invoicePrintBuilderConfig` stayed a raw string; `sanitizeInvoicePrintBuilderConfig` (Zod) then failed and fell back to defaults in both the Settings Builder UI and Sales print.
* Fix: added `"invoicePrintBuilderConfig"` to that read-side parse list (only). The write path stays `PUT /settings/by-key/invoicePrintBuilderConfig`; the PATCH-whitelist array (`updateSettings`) was NOT touched.
* Result: `settings.invoicePrintBuilderConfig` rehydrates as an object after refresh; the Builder UI shows saved toggles/theme; Sales print (`InvoiceDocument`) now receives the parsed config and applies saved customization.

Bug 2 — page scroll frozen after Sales invoice print flow:

* Root cause: `components/ui/modal.tsx` scroll-lock effect depended on `[open, onClose]`. The Sales parent modal passes an inline `onClose`, so the effect cleaned up + re-ran while the nested print dialog was open, re-capturing `document.body.style.overflow` as `"hidden"` and restoring `"hidden"` on final cleanup.
* Fix: reference-counted body scroll lock via module-level `activeModalCount` + `previousBodyOverflow`; the effect now depends on `[open]` only; the Escape handler uses the latest `onClose` via a ref. Body is locked when the first modal opens and restored only when the last closes.
* Result: nested/stacked modals and repeated print/cancel/close cycles no longer leave `body`/`html` overflow stuck; scroll works after the flow.

Verification:

* typecheck clean; lint 0 errors (2 pre-existing `isAuthenticated` `useCallback` warnings, unrelated); build succeeded; `next-env.d.ts` clean.
* `verify-invoice-print-view-model.js`, `verify-print-template-config.js`, `verify-print-builder-config.js` → all ok.
* financial-safety grep on the two changed files → clean.
* `npm run test:print-export` (Playwright, `webServer: npm run dev` on :3000) could not complete in the current headless environment (no output; server/browser-dependent). Not a code failure — the two fixes don't touch the print/export rendering path; manual browser QA still recommended.

Remaining gaps:

* Native/manual browser print QA still recommended (esp. the two fixed flows).
* Builder advanced controls not started; drag/drop not started; PDF generator + Search & Print not started.

---

### Phase 19V-Fix — CSP Upload Image Origin

Status:

* Completed. Frontend-only CSP config fix (from the Phase 19V audit).
* No backend/DB/migrations/API changes; no `PATCH /settings`; no localStorage; no financial/business logic; no Builder/UI changes.

Root cause:

* The Content-Security-Policy is defined in `next.config.ts` (`headers()`, applied to `/:path*`, all environments). Its `img-src 'self' data: blob:` omitted the backend upload origin, so logos served cross-origin from `<backend>/uploads/...` (e.g. `http://localhost:8000/uploads/...`, via `lib/files.ts` `getPublicFileUrl` → `getApiOrigin()` from `NEXT_PUBLIC_API_URL`) were blocked in the app UI and the print iframe (which inherits the parent-page CSP).

Fix (`next.config.ts` only):

* Added a `getOrigin(value)` helper and a de-duplicated `uploadImageOrigins` allow-list derived from env only: `NEXT_PUBLIC_API_ORIGIN`, `NEXT_PUBLIC_API_URL`, `BACKEND_ORIGIN`. `'self'` already covers the frontend origin (FRONTEND_URL intentionally not added).
* CSP `img-src` is now `'self' data: blob: <configured upload origins>`. In dev this resolves to `http://localhost:8000`; in production it uses the configured backend/asset origin. No wildcard `img-src *`; the rest of the CSP is unchanged.

Result: settings logo/image preview, sales image preview, and the invoice print logo (main page + print iframe) can load backend uploads; CSP stays restrictive.

Verification:

* typecheck clean; lint 0 errors; build succeeded; `next-env.d.ts` clean.
* origin derivation confirmed: `new URL("http://localhost:8000/api/v1").origin` → `http://localhost:8000`.
* `verify-invoice-print-view-model.js`, `verify-print-template-config.js`, `verify-print-builder-config.js` → all ok; financial-safety grep clean.
* `npm run test:print-export` not run to completion in this headless environment (Playwright `webServer`/browser dependent). Native browser QA of the three surfaces + DevTools console (no `img-src` CSP violation for backend uploads) recommended.

Remaining gaps:

* Settings tab consolidation (receipt vs printBuilder) not started (Phase 19W).
* Company print info + messages (incl. missing company email) not started (Phase 19X).
* Native/manual browser print QA still recommended.
* Builder advanced controls / drag-drop / PDF / Search & Print not started.

---

### Phase 19U-Hotfix — Stabilize Print Builder Settings State

Status:

* Completed. Frontend-only hotfix for a `Maximum update depth exceeded` crash on the Settings Print Builder tab (`app/[locale]/(dashboard)/settings/page.tsx:187`).
* No backend/DB/migrations/API changes; no `PATCH /settings`; no localStorage; no financial/business logic; no new Builder feature.

Root cause:

* `useInvoicePrintBuilderConfig` called `sanitizeInvoicePrintBuilderConfig(...)` on every render, returning a NEW object each time. The Settings page's `useEffect(() => setBuilderForm(savedBuilderConfig), [savedBuilderConfig])` therefore saw a new dependency reference every render → `setBuilderForm` → re-render → infinite loop.

Fix:

* `hooks/use-invoice-print-builder-config.ts`: memoize `config` with `useMemo(() => sanitizeInvoicePrintBuilderConfig(rawBuilderConfig), [rawBuilderConfig])` so it keeps a stable reference across renders (the raw settings value is stable between reloads). Save path unchanged.
* `app/[locale]/(dashboard)/settings/page.tsx`: defensive guard — a `savedBuilderConfigSignature = useMemo(() => JSON.stringify(savedBuilderConfig), [savedBuilderConfig])` plus `setBuilderForm(prev => JSON.stringify(prev) === signature ? prev : savedBuilderConfig)`, so a redundant/unstable config can never trigger an update loop (returning `prev` makes React bail out).

Preserved (unchanged): saving/reading `invoicePrintBuilderConfig`, Builder toggles, preview panel, theme presets, Sales print application, and the 19U-Fix modal scroll-lock.

Verification:

* typecheck clean; lint 0 errors (1 pre-existing `<img>` logo warning); build succeeded; `next-env.d.ts` clean.
* `verify-invoice-print-view-model.js`, `verify-print-template-config.js`, `verify-print-builder-config.js` → all ok; financial-safety grep clean.
* `npm run test:print-export` again not run to completion in this headless environment (Playwright `webServer: npm run dev` on :3000 / browser dependent). No artifacts left (gitignored). Native browser QA of the Print Builder tab (no crash, save/refresh rehydrate, Sales print applies, scroll intact) recommended.

---

## 6. Current Next Phase

Phase 19T is complete. Next intended phase:

```text
Phase 19U — Builder advanced settings controls
```

Purpose:

* Add control sliders or selectors for print settings like margin scale (small/medium/large), document title custom wording, and font selections.
* Save customized properties safely under `invoicePrintBuilderConfig` per-template.
* Keep the E2E print export tests green.

---

## 7. Known Gaps / Deferred Work

Return/Exchange:

* Full line-level return/exchange history requires migration to store `originalInvoiceItemId`.
* Current double guard remains product-level and conservative.
* Partial return/exchange remains deferred.

Print/Search:

* No unified Search & Print route/filter layer yet.
* `tests/export-print.spec.ts` added in 19O-Fix; `npm run test:print-export` passes (11 tests).
* Native print preview/manual browser QA is still recommended.
* Real thermal printer / 80mm roll behavior still needs manual QA.
* Print Template Builder UI has not been started.
* PDF generator has not been started.
* `InvoicePrintViewModel` exists.
* Current template uses the ViewModel.
* Dynamic titles by invoice type exist in the ViewModel helper.
* Payment rows exist in backend but are not included in generic invoice detail.
* Installment rows exist but are not included in generic invoice detail.
* Company/customer/branch print fields may need future read-only exposure.
* Gift Voucher and Customer Gold Purchase require special print modeling.
* Company stamp/signature assets and watermark settings are not confirmed.
* Customer phone/TRN/address may be missing from current invoice print data.
* Line-level VAT/net/total may be missing; do not invent financial truth.

---

## 8. Print ViewModel Principles

Future print ViewModel must follow:

* Read-only.
* Display-only.
* No DB writes.
* No API mutations.
* No financial recalculation.
* Invoice/system totals are source of truth.
* Fallbacks must be clearly display-only.
* Missing data should become warnings/gaps, not invented values.
* Branding must come from company/settings, not hardcoded.
* Titles should be dynamic by invoice type and tax context.
* Special invoice types must not be printed as normal sales invoices.

Suggested ViewModel direction:

```ts
type InvoicePrintViewModel = {
  document: {
    titleAr: string;
    titleEn: string;
    type: string;
    number: string;
    date: string;
    status?: string;
    originalInvoiceNumber?: string;
  };
  company: {
    nameAr?: string;
    nameEn?: string;
    logoUrl?: string;
    watermarkUrl?: string;
    phone?: string;
    email?: string;
    address?: string;
    trn?: string;
  };
  customer: {
    name?: string;
    phone?: string;
    trn?: string;
    address?: string;
  };
  items: Array<{
    index: number;
    descriptionAr?: string;
    descriptionEn?: string;
    karat?: string;
    weight?: number;
    quantity?: number;
    netAmount?: number;
    vatAmount?: number;
    totalAmount?: number;
  }>;
  payments: Array<{
    methodLabelAr: string;
    methodLabelEn: string;
    amount: number;
    currency: string;
  }>;
  totals: {
    netAmount?: number;
    vatRate?: number;
    vatAmount?: number;
    totalAmount?: number;
    totalPaid?: number;
    balance?: number;
    currency?: string;
  };
  notes?: string;
  warnings?: string[];
  special?: {
    exchange?: {
      returnedItems?: unknown[];
      newItems?: unknown[];
      difference?: number;
    };
    installments?: {
      downPayment?: number;
      remainingBalance?: number;
      scheduleSummary?: unknown[];
    };
    deposit?: {
      depositStatus?: string;
      redeemedAmount?: number;
    };
    giftVoucher?: {
      voucherNumber?: string;
      expiryDate?: string;
      redemptionPolicy?: string;
    };
    customerGoldPurchase?: {
      goldWeight?: number;
      karat?: string;
      purchaseRate?: number;
    };
  };
};
```

---

## 9. Verification Baseline

Recent reported green before 19PREP:

* return/exchange duplicate product lines contract
* sales return product support
* sales exchange product support
* sales exchange mixed items contract
* returns/exchange contract
* API contracts
* frontend typecheck
* frontend lint
* frontend build

For print work, future verification should include:

* sales title
* tax title
* return title
* exchange title
* installment title
* deposit title
* gift voucher title
* customer gold purchase title
* items mapping
* totals mapping from stored invoice values
* payment mapping
* missing logo fallback
* missing TRN fallback
* no client-side financial recalculation

---

## 10. Do Not Touch Without Explicit Phase

* backend posting/accounting logic
* VAT calculation
* COGS calculation
* stock movement logic
* treasury/payment mutation logic
* invoice posting status logic
* migrations
* seeders
* stashes
* production database
* destructive Git commands
* existing return/exchange contracts unless the phase explicitly targets them

---

## 11. Last Updated

Updated by AI during:

```text
Phase 19V-Fix — CSP Upload Image Origin
(follows 19U-Hotfix + 19V audit; latest feature phase: 19T — Print Builder Theme Presets.
verify checks pass: VM + template + builder configs; build ok. print-export E2E not run in
this headless environment — server/browser dependent. Next: 19W tab consolidation.)
```

After this file is committed, future agents must update this section when they complete a phase.
