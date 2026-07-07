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

### Phase 21.3-Fix — Central Idempotency Requests + Critical Frontend Keys

Status:

* Completed (code). Added race-safe idempotency for the critical financial/stock mutation endpoints. **Migration NOT executed here** — it must be applied before the wrapped endpoints work (they insert into the new table): `cd backend && npm run db:migrate` on a safe/dev DB.
* No print work; no accounting/settlement/stock redesign; no POS/purchase calculation changes; no destructive DB command.

Infrastructure (new):

* Migration `backend/migrations/20260707000000-create-idempotency-requests.js` — additive/reversible; creates `idempotency_requests` (id, company_id, scope, key, request_hash, status, status_code, response_body JSONB, expires_at, timestamps) with **UNIQUE (company_id, scope, key)** + helper indexes.
* Model `backend/src/models/idempotencyRequest.model.js` (registered in `models/index.js`).
* Service `backend/src/services/idempotency.service.js`: `hashRequest(scope, body)` (sha256 canonical JSON, key excluded), `claim` (insert-first in the caller's transaction → race-safe via the unique index), `resolveExisting` (fresh query → replay/processing/conflict), `succeed` (store response). Existing per-table `idempotency_key` trace columns kept.

Contract & behavior:

* Header `Idempotency-Key`; scopes `pos.checkout`, `sales.return`, `sales.exchange`, `purchase.receive`.
* Missing key on a wrapped endpoint → **400**. Same key + same request → **replay** the saved 2xx response. Same key + processing → **409**. Same key + different request hash → **409**. On business failure the `processing` row rolls back with the transaction, so a genuine retry can proceed.
* Race-safe by construction: the `processing` row is claimed in the SAME transaction as the business mutation and updated to `succeeded` before commit; a concurrent duplicate blocks on the unique key then replays, or its insert fails → it rolls back and resolves the committed row.

Endpoints wrapped: **`/pos/checkout`, `/sales/returns`, `/sales/exchanges`, `/purchase-orders/receive`** — each replaces its old lookup-only replay with claim + resolve, and persists the exact success payload via `succeed` before commit (returns/exchanges preserve Phase 21.2 settlement; receive preserves stock/accounting). **Deferred:** `/purchase-orders/:id/pay` (already *requires* a key + has replay/conflict + PO row-lock — strong; central conversion is a follow-up); secondary payment/treasury/installment/draft endpoints keep their existing lookup + row locks.

Frontend keys (mandatory now — backend rejects missing keys): returns / exchanges / purchase-receive pages send a **stable** `Idempotency-Key` (ref-based `generateUUID`, generated once per attempt, reused on retry, reset on success / new-search). POS checkout already sent a stable key (unchanged).

Verification:

* `scripts/verify-idempotency.js` (new, `npm run verify:idempotency`): functional service test with a mock unique store (claim/duplicate/processing/replay/conflict + hash contract), migration/model unique-constraint static checks, route scope+claim+succeed coverage, and frontend key coverage. **Passes.** `node -c` on all changed backend files ok; typecheck/lint/build ok; `verify-invoice-crud-guards` + `verify-return-exchange-settlement` still pass; no print files touched.

Remaining deferred: run the migration; convert `/purchase-orders/:id/pay` + secondary payment/treasury endpoints to the central service; enforce missing-key rejection on secondary endpoints; TTL cleanup job for `expires_at`; customer credit ledger; mock-production-default hardening; ledger-based report reconciliation.

---

### Phase 23-Fix — Customer Credit Ledger MVP (Infrastructure)

Status:

* Completed (code). Added a per-customer **credit ledger** as **infrastructure only** — new table + model + service + one read-only endpoint + a read-only UI display. **No shipped behavior changed**: returns/exchanges still cash-refund excess, overpayment stays prevented/rejected, `Customer.balance` stays AR-only, `Invoice.remainingAmount` unchanged, installments/treasury unchanged, `statement-v2` unchanged (only a read-only credit card added on the page). **No credit is created by any flow** in this phase.
* **Migration created but NOT run here** — apply before the endpoint returns real data: `cd backend && npm run db:migrate` on a safe/dev DB. No destructive DB command.

Infrastructure (new):

* Migration `backend/migrations/20260707010000-create-customer-credit-transactions.js` — additive/reversible; creates `customer_credit_transactions` (id, company_id, branch_id, customer_id, source_type, source_id, direction, amount, currency, description, status, **journal_entry_id** (GL-bridge, nullable), cash_transaction_id, invoice_id, created_by, metadata, timestamps) + 5 indexes (company+customer+created, company+source, journal, cash, invoice). No CHECK constraints on existing tables.
* Model `backend/src/models/customerCreditTransaction.model.js` (registered in `models/index.js` with minimal `belongsTo Company`/`Customer` + reverse `hasMany`). `direction ∈ {credit_in, credit_out}`, `status ∈ {active, reversed, void}`, `amount > 0`, `source_type ∈ {opening_balance, return_credit, exchange_credit, overpayment, credit_application, credit_refund, manual_adjustment, migration_seed}` — enforced via model validators.
* Service `backend/src/services/customer-credit.service.js`: `recordCreditIn`, `recordCreditOut` (rejects if it would drive available credit **negative**), `getCustomerCreditSummary` (availableCredit = Σ active credit_in − Σ active credit_out), `getCustomerCreditTransactions`. Accepts `transaction`; company/customer-scoped. **Never touches `Customer.balance`, `Invoice.remainingAmount`, or the GL** (never requires posting.service). **GL bridge to account 2300 "Customer Deposits" is DEFERRED** — `journalEntryId` is a nullable pass-through.

API (read-only): `GET /customers/:id/credit` (auth + `customers.view`, company-scoped, 404 if not found) → `{ customerId, availableCredit, totalCreditIn, totalCreditOut, currency, page, pageSize, transactions, meta:{ glBridge:"deferred" } }`. **No POST/apply/refund/adjust endpoint.**

Frontend (read-only): a small "Available Credit" card on the customer statement panel (`customers/[id]/page.tsx`), fetched via the existing direct-`apiClient` pattern. No buttons/actions/forms — display only; shows 0 until a future phase enables credit creation.

Verification: `scripts/verify-customer-credit-ledger.js` (`npm run verify:customer-credit-ledger`) — **functional** (mock store: credit_in/out sum, no-negative rule, amount validation, per-customer scoping; the mock exposes only the credit model, so the service can't touch Customer/Invoice) + **static** (migration/model/registration, service surface, service never accesses Customer/Invoice models or posts GL, read-only endpoint exists, **no flow records credit**, return/exchange settlement intact, posting.service not coupled/rewritten). **Passes.** `node -c` on routes/service/model/migration ok; typecheck/lint (0 errors)/build ok; all prior verifiers pass; no print/report files touched; 11 stashes untouched.

Remaining deferred (need a business decision): keep return/exchange excess as credit vs cash refund; overpayment acceptance; credit application to future invoices; credit refund workflow; GL posting bridge to 2300; `Customer.balance` installment drift; ledger-based reports.

---

### Phase 22-Fix — Strict Production Data-Source Hardening

Status:

* Completed (code). Closed the one remaining silent-mock hazard: a production build missing/empty/invalid `NEXT_PUBLIC_DATA_SOURCE` used to default the whole app to `mock`/localStorage, bypassing PostgreSQL. Frontend-only change; **no backend, no DB, no migration, no print/accounting/idempotency changes.**

Central selector ([lib/data-source.ts](../lib/data-source.ts)):

* New helpers: `getDataSourceMode()`, `isApiDataSource()`, `assertProductionDataSource()`. Removed the `(… as DataSourceMode) || "mock"` unsafe-cast default.
* **Production** (`NODE_ENV === "production"`): `getDataSourceMode()` **always returns "api"** (mock/local can never be returned). The module stays **import-safe** (never throws just from import) so `next build` succeeds; the loud failure is `assertProductionDataSource()`, called by the API client before any request — it throws when `NEXT_PUBLIC_DATA_SOURCE` is missing/≠"api" or `NEXT_PUBLIC_API_URL` is empty.
* **Development**: validated env value, defaulting to `mock` when unset; an **invalid** value throws loudly. Value is trimmed + lowercased.
* `DATA_SOURCE` const kept (production-forced "api") so all existing `DATA_SOURCE === "api"` callers keep working; `isMock`/`isLocal`/`shouldPersist`/`isApiReady` now derive from the getter (never mock/persist in production).

API client ([lib/api/client.ts](../lib/api/client.ts)):

* Removed the duplicate `process.env.NEXT_PUBLIC_DATA_SOURCE || "mock"` default; imports and calls `assertProductionDataSource()` + `getDataSourceMode()`. Preserved the existing safe behavior — **API errors throw (`DarfusApiError`), no catch-return-mock, no fallback to local**.

Direct env readers centralized (13 files): removed every direct `process.env.NEXT_PUBLIC_DATA_SOURCE` read from business flows — POS, sales returns/exchanges, customer-gold, invoices, assets (`use-asset-query`, `use-assets`), inventory (`use-inventory-list`, manufacturing, stock-audit), employees, settings — now use `isApiDataSource()` / `getDataSourceMode()`. Only `lib/data-source.ts` reads the raw env.

localStorage / mock (unchanged, preserved): business persistence stays gated — `erp-context` skips persistence and clears demo state in api mode; `settings-context` branch/settings writes are all behind `if (!isApi)`. POS drafts remain a pre-checkout local cache. **No mock files deleted**; the api-mode `Local*` repo cleanup remains deferred.

Env contract: `.env` is **untracked** (local only) — its empty `NEXT_PUBLIC_DATA_SOURCE=` no longer causes silent mock (production forces api + fails loud on real deployments). Tracked `.env.example` / `.env.production.example` already correctly show `NEXT_PUBLIC_DATA_SOURCE=api` — left unchanged; no secrets added.

Verification: new `scripts/verify-production-data-source.js` (`npm run verify:production-data-source`) — **functional** (transpiles the selector and exercises production/dev × missing/mock/api/no-URL/invalid → asserts forced-api, loud throws, dev default/invalid) + **static** (no `|| "mock"`, no unsafe cast, NODE_ENV guard + 3 rules, client imports the guard & still throws with no mock/local fallback, no stray direct env reads, localStorage gates intact, mock files present). **Passes.** typecheck/lint (0 errors)/**build (production) ok**; all prior verifiers still pass; no backend/print files touched; 11 stashes untouched.

Remaining deferred: optional explicit demo-mode flag/banner (`NEXT_PUBLIC_ALLOW_DEMO_MODE`) if ever needed; api-mode `Local*` repository cleanup (inventory/sales/manufacturing/reports/audit/settings still local in api mode); customer credit ledger; ledger-based reports.

---

### Phase 21.5-Fix — Edge Financial Idempotency & Cleanup Script Repair

Status:

* Completed (code). Extended the central `idempotency_requests` service to the two remaining exposed financial mutation endpoints, and repaired the (previously broken) TTL cleanup command. **No new migration** — the 21.3 table/indexes are reused.
* No print work; no payroll/gold-model/accounting/settlement/stock redesign; no destructive DB command. **Treasury closing intentionally left unchanged** (strong per-account-per-day uniqueness + no cash/journal effect → deferred).

Endpoints converted (each now REQUIRES `Idempotency-Key` → 400 if missing; `req.params.id` folded into the request hash; old lookup-only logic removed):

* **`POST /payslips/:id/pay`** — scope `payroll.payslip_payment`. Replaced the optional-key `slip.idempotencyKey === key` lookup with claim/succeed. **Wrapped in a `sequelize.transaction` for the first time** and moved `postPayrollEntry` INSIDE it (`{ transaction: t }`, which the service already supports) — a posting failure now rolls back the whole payment, ending the old best-effort divergence where a payslip could be marked `paid` with no GL entry. Status guard (`paid` → 409) kept. Payroll calculation unchanged.
* **`POST /customers/:id/gold/payout`** — scope `customer.gold_payout`. Added the central claim inside the existing transaction (previously it had **zero** idempotency/status guard). Negative `CustomerGoldPool` deduction + Dr 2300 / Cr cash|bank journal unchanged. **No frontend caller exists** (endpoint is API-only) — none was invented; requiring a key makes any future/API caller safe-by-default.

Frontend keys:

* **Payslip** (`hooks/use-payroll.ts` `payPayslip` + `employees/payroll/page.tsx`): per-payslip `useRef` key map, generated on first pay attempt, reused on retry, cleared on success.
* **Gold payout:** no change (no caller).

Cleanup script repair (Phase 21.4 bug):

* The root `scripts/idempotency-cleanup.js` failed with `MODULE_NOT_FOUND` — `require("dotenv")` cannot resolve from the repo root (`dotenv` is only in `backend/node_modules`), so `npm run idempotency:cleanup` never ran. **Relocated to `backend/scripts/idempotency-cleanup.js`** (backend convention: `require("dotenv").config({ path: ../.env })` + `require("../src/models")` + `require("sequelize").Op`); root copy removed; `package.json` script now `node backend/scripts/idempotency-cleanup.js`. Still deletes ONLY `expires_at < now`, supports `--dry-run`, no truncate/reset/delete-all, closes the connection. **Dry-run verified live** (read-only `SELECT count(*) … WHERE expires_at < now` → 0 rows, no deletion).
* **Cron:** run manually or via an **external scheduler** (e.g. daily at low-traffic hours: `npm run idempotency:cleanup`). No in-app scheduler (BullMQ/Redis is optional and degrades to in-memory, so it is not relied on for cleanup).

Verification:

* `scripts/verify-secondary-idempotency.js` extended (`npm run verify:secondary-idempotency`): now asserts the two new scopes wired + required-key 400 + `req.params` in hash + old lookup removed (claim/succeed/resolve ≥ 9); treasury closing NOT centralized; payslip frontend sends a stable ref key; **gold payout has no frontend caller** (recursive grep); cleanup relocated + root copy gone + resolves backend deps + package path updated. **Passes.**
* `node -c` on `erp.routes.js` + `backend/scripts/idempotency-cleanup.js` ok; typecheck/lint (0 errors)/build ok; `verify-idempotency` + `verify-invoice-crud-guards` + `verify-return-exchange-settlement` still pass; no print files touched; 11 stashes untouched.

Remaining deferred: treasury-closing centralization (low risk); a scheduled/automated cleanup job (currently manual/cron); customer credit ledger; mock-production-default hardening; ledger-based report reconciliation.

---

### Phase 21.4-Fix — Secondary Financial Idempotency & TTL Cleanup

Status:

* Completed (code). Extended the Phase 21.3 central `idempotency_requests` service to the three highest-risk secondary financial mutation endpoints, and added a safe manual TTL cleanup script. **No new migration** — the 21.3 `idempotency_requests` table/indexes (already run by the user) are reused as-is.
* No print work; no accounting/settlement/stock redesign; no POS/return/exchange/generic-CRUD changes; no destructive DB command.

Endpoints converted (each now REQUIRES `Idempotency-Key` → 400 if missing; old lookup-only logic removed; `req.params` folded into the request hash so one key cannot cross records):

* **`POST /treasury/transactions`** — scope `treasury.cash_transaction`. Replaced the optional-key `CashTransaction.findOne` lookup (which admitted a race window) with claim/succeed inside the existing `sequelize.transaction` callback; a concurrent duplicate throws a sentinel → the callback rolls back → `resolveExisting` replays/conflicts. Treasury cash + GL journal behavior unchanged; same response shape saved & replayed.
* **`POST /purchase-orders/:id/pay`** — scope `purchase.payment`. Replaced the `CashTransaction` lookup/`sameOperation` replay with the central claim inside the write transaction (after opening `t`, before the PO row-lock). PO `FOR UPDATE` lock, overpayment guards and Dr AP / Cr cash|bank posting unchanged. `Supplier.findByPk` reference read moved inside the tx so the saved response includes `supplierDueReference`; `succeed` runs before commit.
* **`POST /installments/:id/pay`** — scope `installment.payment`. Replaced the optional-key `inst.idempotencyKey === key` lookup with claim/succeed inside the `sequelize.transaction` callback (sentinel-on-duplicate pattern). Payment row + installment status + GL journal + treasury CashTransaction logging unchanged.

Frontend keys:

* **Treasury** (`hooks/use-treasury.ts` `addTransaction` + `accounting/treasury/page.tsx`): stable `useRef` key, generated on modal open, reused on retry (kept on failure), reset to `""` on success.
* **Installments** (`hooks/use-installments.ts` `payInstallment` + `sales/installments/page.tsx`): per-installment `useRef` key map, generated on first pay attempt, reused on retry, cleared on success.
* **Purchase payment**: caller already existed (`suppliers/[id]/page.tsx` → `accountingRepository.payPurchaseOrder` → `api-impl.ts`) and already sent a stable `payKey` (`crypto.randomUUID`, one per payment session) — **unchanged**, no invented caller.

TTL cleanup (no migration, no scheduler infra):

* `scripts/idempotency-cleanup.js` (`npm run idempotency:cleanup`): deletes ONLY expired rows via `IdempotencyRequest.destroy({ where: { expiresAt: { [Op.lt]: now } } })` (`expires_at < now`). Supports `--dry-run` (count only). Never truncates/resets/deletes-all; prints the deleted count; closes the DB connection. Intended for manual run or external cron. **Not executed here** (per safety rules).

Verification:

* `scripts/verify-secondary-idempotency.js` (new, `npm run verify:secondary-idempotency`): static checks — the three scopes wired with required key + `req.params` in the hash, old lookup-only patterns removed, claim/succeed/resolve now cover ≥7 endpoints; frontend hooks/pages send stable ref-based keys and reset on success; cleanup deletes only `expiresAt < now` with no truncate/delete-all; the four Phase 21.3 scopes still wired; no print coupling. **Passes.**
* `node -c` on `erp.routes.js`, `idempotency.service.js`, `idempotency-cleanup.js` ok; typecheck/lint (0 errors)/build ok; `verify-idempotency` + `verify-invoice-crud-guards` + `verify-return-exchange-settlement` still pass; no print files touched; 11 stashes untouched.

Remaining deferred: payslip / customer gold-payout / treasury-closing centralization; a scheduled/automated cleanup job (currently manual/cron); customer credit ledger; mock-production-default hardening; ledger-based report reconciliation.

---

### Phase 21.2-Fix — Receivable-First Return / Exchange Settlement

Status:

* Completed. Backend accounting/treasury fix for the confirmed High-risk Phase 21.2 finding: sales returns/exchanges booked cash movement + receivable changes inconsistently (double compensation, fake cash, GL-vs-balance divergence).
* No print work; no DB reset/seed/migration; no customer-credit ledger; no idempotency wiring; no generic-invoice-CRUD/POS-checkout/supplier changes; stock/asset reversal unchanged.

Bug (confirmed in the 21.2 audit):

* **Return** — created a `cash_out` for the **full** `returnedTotal` (any paid state) **and separately** reduced receivable; `postReturnEntry` credited **Cash 1110** for the full total (never AR 1300). An unpaid/partial return double-compensated the customer and diverged the GL from `customer.balance`.
* **Exchange** — created `cash_in`/`cash_out` by diff sign whenever `diffTotal !== 0` (independent of settlement/outstanding); GL money leg always hit Cash 1110/1120, never AR 1300; the receivable branch keyed off `paymentMethod === "credit"` which the UI never sends (`"Exchange"`), so it was dead.

Fix — receivable-first settlement (`erp.routes.js` returns + exchanges, `posting.service.js`):

* **Returns:** `receivableReliefAmount = min(returnedTotal, outstanding)`, `cashRefundAmount = returnedTotal − relief`. Receivable relief applied **once** (`customer.balance` + `invoice.remainingAmount`, clamped ≥ 0); `CashTransaction cash_out` created **only if** `cashRefundAmount > 0`; `postReturnEntry` now splits the money leg **Cr AR 1300** (relief) + **Cr Cash/Bank** (refund). Legacy callers (no split) still get the old full-cash entry (balanced).
* **Exchanges:** `diff<0` → relieve AR first, cash-refund only the excess. `diff>0` → `settlementMode` (`paid_now`|`credit`); default = **credit** when `paymentMethod:"Exchange"`/unconfirmed (avoids fake `cash_in`), `paid_now` only for a real cash/bank method or explicit flag. GL money leg splits **Cash/Bank + AR 1300**; treasury `CashTransaction` only for real cash (`exchangeCashAmount > 0`); receivable moved once via a single signed `exchangeArDelta` (+`invoice.remainingAmount`, clamped ≥ 0).
* Examples: unpaid return 3000/out 10000 → AR −3000, cash 0. Partial return 3000/out 2000 → AR −2000, cash 1000. Fully-paid return 3000/out 0 → AR 0, cash 3000. Exchange diff −1000/out 400 → AR −400, cash refund 600. Exchange diff +1000 credit → AR +1000, no cash_in.

Frontend: **unchanged** — the backend safe default (`"Exchange"`+diff>0 → credit) closes the fake-`cash_in` hole without UI changes; an explicit "paid now" toggle is an optional future add. Returns already work via the receivable-first default (no settlement UI needed for MVP).

Verification:

* `scripts/verify-return-exchange-settlement.js` (new, `npm run verify:return-exchange-settlement`): (A) functional — stubs `postEntry`/`resolveAccountingByKarat` and asserts `postReturnEntry`'s AR 1300 / Cash split + legacy fallback + that every entry **balances**; (B) the settlement-formula matrix (all return + exchange scenarios); (C) static route assertions that both routes use receivable-first + gated treasury + AR 1300 and that the **old bug patterns are gone** (`amount: returnedTotal`, `if (diffTotal !== 0)`, `paymentMethod === "credit"`), with stock/asset sections intact. **All pass.**
* `node -c` on both changed backend files ok; frontend typecheck/lint/build ok; `verify-invoice-crud-guards` still ok; no orphaned refs; grep-safety clean (no print/POS-checkout/supplier logic touched).

Remaining risks (deferred): idempotency on return/exchange submit → Phase 21.3; a proper customer-credit ledger (currently AR only, clamped ≥ 0 — no negative/credit balance) → future; ledger-based report reconciliation.

---

### Phase 21.1-Fix — Generic Invoice CRUD Guards (data integrity)

Status:

* Completed. Backend guard-only fix for the Critical Phase 21 audit finding: the generic `/invoices` CRUD could create/update/delete **posted** financial invoices with no stock/treasury/accounting reversal. Posted invoices are now changed only through the lifecycle-safe routes.
* No print work; no DB/migration/seed; no accounting/treasury redesign; no returns/exchanges accounting change; no idempotency work; no POS checkout / purchase-receive calculation changes.

Root cause:

* `setupCrud("invoices", …)` (erp.routes.js) wired generic POST/PUT/PATCH/DELETE + deactivate/reactivate through `ErpController`. The only guard was "reject explicit lifecycle fields in the body", but the model default is `postingStatus:"posted"`, so a generic create with items/totals (no lifecycle field) produced a **posted** header with none of the side effects; generic update/delete could mutate/soft-delete posted invoices; `deactivate` even set an invalid `status:"inactive"` enum.

Fix (`backend/src/controllers/erp.controller.js`, all scoped to `model.name === "Invoice"`):

* **create** — blocked entirely (403): invoices are created only via `/pos/checkout` or `/sales/invoices/drafts → /sales/invoices/:id/post`.
* **update** — 409 when `postingStatus !== "draft"` (posted/cancelled). DRAFT updates remain allowed; the pre-existing lifecycle-field guard (postingStatus/postedAt/cancelledAt/cancelReason) still applies to drafts (403).
* **delete** — 409 when `postingStatus !== "draft"`; only drafts (no posted side effects) may be soft-deleted; posted docs need a lifecycle cancel/reversal.
* **deactivate / reactivate** — blocked (409) for invoices (no such lifecycle; also avoids the invalid status enum).
* Guards are pure `res.status(...)` returns before any DB write; no new financial/DB operations added.

Frontend: unchanged — it never called generic invoice mutations (only `GET /invoices` lists + the `/sales/invoices/*` and `/pos/checkout` lifecycle endpoints). Nothing to remediate.

Verification:

* `scripts/verify-invoice-crud-guards.js` (new, `npm run verify:invoice-crud-guards`) — functionally exercises the guards against a mock Invoice model (no DB): create 403; posted/cancelled update 409; draft update allowed (reaches `item.update`) but draft lifecycle-field 403; posted delete 409 (no destroy) while draft delete allowed; deactivate/reactivate 409; a non-Invoice model is unaffected; and statically confirms the lifecycle routes (`/pos/checkout`, `/sales/invoices/:id/post|cancel`, `/sales/invoices/draft`) + `setupCrud("invoices")` are still wired. **All pass.**
* `node -c` on the controller ok; frontend typecheck/lint/build ok (backend-only change); grep-safety clean (guards only). Backend has no lint/test scripts (skipped); no destructive DB command run.

Remaining risks (deferred): return/exchange accounting risk → Phase 21.2; broad idempotency → Phase 21.3; any legacy draft route/mock-production default and serialized-asset StockMovement / ledger-report items remain as previously noted.

---

### Phase 19Y.3 — POS Print Dialog with Template Selector & Live Preview

Status:

* Completed. Frontend-only. After a successful POS checkout, a print dialog now opens with a template selector + live preview (Thermal default), reusing the existing print system.
* No backend/DB/migration/API; no new settings key; no autoPrint/copies; no `defaultPosTemplate` persistence; no custom text blocks; no favicon; no POS submit/payment/stock/accounting/treasury changes; no totals recalculation. `ReceiptPrintTemplate`/`ReceiptPreview` files retained.

Changes:

* **`InvoicePrintOptionsDialog.tsx` (extended, backward-compatible):** added optional props `showPreview` / `previewCompany` / `previewSettings` / `previewLabels`. When `showPreview` is set, it renders a live `InvoiceDocument` (scaled: thermal at 80mm, A4 via `zoom:0.5`) reacting to the selected template/language/document-type. Sales passes none of these, so its behavior is unchanged (selectors + Print only). Added `id`/`name` to the three selects (`print-document-type` / `print-template` / `print-language`).
* **`pos/page.tsx`:** replaced the post-checkout `ReceiptPreview` modal (Option 1) with `InvoicePrintOptionsDialog` opened on `completedInvoice` (set by the existing `postInvoice` success). `initialOptions = POS_PRINT_DEFAULTS` (module const: documentMode auto / templateId **thermal** / bilingual — stable ref so the dialog's reseed effect never resets the user's choice). Added a POS `printInvoice(invoice, options)` mirroring Sales (`InvoiceDocument` → `renderPrintDocument` → `printHtmlDocument`), a memoized `printCompany` (`PrintCompany` from the auth company / Company Profile), and `printLabels` (POS + PrintExport namespaces; all keys verified present in en/ar). `onPrint={printInvoice}`, `onClose` just clears `completedInvoice`.

Behavior / safety:

* Dialog opens only after `postInvoice` succeeded. `printInvoice` and the dialog **never call `postInvoice`** (verified: `postInvoice` only at the checkout handler line 814). Print/close do not mutate cart/order/payment/stock/accounting; no invoice is re-created. Preview + print render the server-returned `completedInvoice` via the ViewModel — no totals recalculation. Company data comes from the auth company (not `receipt.*`). Receipt messages still flow via the templates. `ReceiptPreview`/`ReceiptPrintTemplate` remain in the codebase (POS no longer mounts `ReceiptPreview`, but the files are intact for reuse/rollback).

Verification:

* typecheck clean; lint 0 errors (pre-existing `<img>` warnings; none in the two changed files); build succeeded; `next-env.d.ts` clean.
* All print verifies pass (VM / template-config / builder-config / company-info); grep-safety clean (no new financial logic; the pre-existing display-only subtotal `reduce` in `ReceiptPrintTemplate`/`ReceiptPreview` was not touched); translation keys for the POS labels confirmed present in `messages/en.json` + `ar.json`.
* Playwright not run (POS dialog isn't covered by the `/test/print-export` fixture spec; known headless limitation). Native POS print QA recommended.

Remaining gaps: autoPrint/copies not added; `ReceiptPreview`/`ReceiptPrintTemplate` consolidation/removal deferred; custom text blocks not started; favicon deferred; closing/thank-you not added; native POS print QA recommended.

---

### Phase 19Y.6 — Persist POS Default Print Template

Status:

* Completed. Frontend/settings-only POS print default persistence.
* No backend/DB/migration/API changes; no new settings key; no `posPrint` key.
* No autoPrint/copies; no legacy receipt component deletion; no custom text blocks; no favicon.
* No POS submit/payment/stock/accounting/treasury changes; no totals recalculation.

Changes:

* Added `receipt.defaultPosTemplate` under the existing `receipt` settings document, using the current template IDs (`thermal`, `luxuryGold`, `compactA4`, `minimal`) with Thermal fallback.
* Added a Settings -> Print & Invoice Design -> POS Print Behavior field for the default POS template.
* POS print dialog now seeds `initialOptions.templateId` from `settings.receipt.defaultPosTemplate || "thermal"` while keeping `documentMode: "auto"` and `languageMode: "bilingual"`.
* Added guard logic that accepts current template IDs and normalizes short legacy/prompt aliases (`luxury` -> `luxuryGold`, `compact` -> `compactA4`); invalid/missing values fall back to `thermal`.
* Temporary template changes inside the POS print dialog remain temporary and are not auto-saved.

Preserved:

* Existing `receipt` key and existing receipt fields.
* Sales invoice print defaults (`printTemplateDefaults`) and Sales print behavior.
* POS dialog opens only after successful invoice creation and still prints the server-returned invoice through `InvoiceDocument`.
* `ReceiptPreview` and `ReceiptPrintTemplate` remain in place for deferred legacy cleanup.

Verification:

* `npm run typecheck` clean.
* `npm run lint` passed with existing warnings only.
* `npm run build` succeeded.
* `verify-invoice-print-view-model.js`, `verify-print-template-config.js`, `verify-print-builder-config.js`, `verify-print-company-info.js` all ok.

Remaining gaps:

* autoPrint/copies deferred.
* legacy `ReceiptPreview`/`ReceiptPrintTemplate` cleanup deferred.
* custom text blocks not started.
* favicon deferred.
* closing/thank-you not added.
* broader accessibility cleanup deferred.
* native/manual POS print QA still recommended.

---

### Phase 19Y.8 — Duplicate POS Receipt Controls Cleanup

Status:

* Completed. Frontend Settings UI cleanup only.
* No backend/DB/migration/API changes; no settings key rename; no data deletion.
* No autoPrint/copies; no legacy `ReceiptPreview`/`ReceiptPrintTemplate` deletion.
* No POS checkout/payment/stock/accounting/treasury changes; no totals recalculation.
* No Print Builder schema expansion.

Changes:

* Cleaned duplicate POS/Receipt visibility controls from Settings -> Print & Invoice Design.
* Kept visible only:

  * Invoice & Receipt Messages (`welcomeMessage`, `headerNote`, `footerMessage`, `termsMessage`).
  * POS Print Behavior (`receipt.defaultPosTemplate`).

* Added helper text near POS Print Behavior that field visibility is controlled from Invoice Print Builder below.
* Added a short backward-compatibility note that legacy POS receipt options are preserved internally.
* Hid the old visible POS/Receipt paper/layout controls and visibility toggles:

  * `paperSize`, `layout`
  * `showLogo`, `showCashier`, `showBarcode`, `showQrCode`
  * `showCompanyName`, `showTaxNumber`, `showAddress`, `showPhone`
  * `showVatBreakdown`, `showCustomerInfo`, `showBranchInfo`

Preserved:

* Existing `receipt` key and `receiptForm` state fields.
* Existing `handleSaveReceipt` payload, so hidden legacy values are not stripped when saving messages/default template.
* Active POS printing continues through `InvoicePrintOptionsDialog` -> `InvoiceDocument`.
* Invoice Print Builder remains the field/section visibility source for active POS/Sales invoice templates.

Remaining gaps:

* Missing builder controls audit optional for barcode/QR/branch/VAT granularity.
* autoPrint/copies deferred.
* legacy `ReceiptPreview`/`ReceiptPrintTemplate` deletion deferred.
* custom text blocks not started.
* favicon deferred.
* closing/thank-you not added.
* broader accessibility cleanup deferred.
* native/manual POS print QA still recommended.

---

### Phase 19Y.2 — Receipt Settings Cleanup & POS Company Data Source

Status:

* Completed. Frontend-only. Removed the duplicate company-data inputs from the POS/Receipt settings card and made the POS receipt render company data from Company Profile first (receipt = legacy fallback).
* No backend/DB/migration/API; no settings-key rename; no data deletion; no POS print dialog; no custom text blocks; no favicon; no POS submit/payment/stock/accounting changes; no totals recalculation.

Changes:

* **Settings UI** (`settings/page.tsx`): removed the `receipt.phone` / `receipt.vatNumber` / `receipt.address` inputs from the "POS Receipt-specific Options" area and the now-duplicate `showVatNumber` toggle (`showTaxNumber` already governs TRN visibility). Added helper text: "Company name, logo, phone, TRN, and address are managed from Company Profile." Kept messages (welcome/header/footer/terms), paperSize/layout, and all POS visibility toggles. `receiptForm` still holds phone/address/vatNumber/showVatNumber and `handleSaveReceipt` still persists them → **legacy values preserved, not deleted**.
* **POS receipt data source** (`ReceiptPrintTemplate.tsx` + `ReceiptPreview.tsx`): both now resolve company **address / phone / TRN** as `company (Company Profile) → receipt.* fallback`. Address is formatted from structured company fields (`[address1, address2, city, region, country, postalCode].filter(Boolean).join(", ")`). `ReceiptPreview.handlePrint` passes the structured company fields into `ReceiptPrintTemplate`. TRN visibility now gated by `showTaxNumber` (was `showVatNumber`). Visibility toggles control visibility only, not the data source. Messages still from `receipt`.

Not changed (reported): pre-existing display-only subtotal `reduce` in `ReceiptPrintTemplate` (`invoice.subtotal ?? items.reduce(...)`) and `ReceiptPreview` (`baseSubtotal = items.reduce(...)`) were left intact — totals/tax/total still come from the server `invoice`. Invoice-print VM precedence unchanged (already company-first from 19X.2). `receipt.phone/address/vatNumber` schema/parse untouched; `receipt` key not renamed; `ReceiptPrintTemplate` kept.

Verification:

* typecheck clean; lint 0 errors (pre-existing `<img>` warnings); build succeeded; `next-env.d.ts` clean.
* All print verifies pass (VM / template-config / builder-config / company-info); grep-safety clean (only the pre-existing subtotal `reduce` + a helper-text string).
* Playwright not run (POS receipt not covered by the fixture spec; known headless limitation). Native POS print QA recommended.

Remaining gaps: POS print dialog (template selection + live preview) not started (19Y.3); custom text blocks not started; favicon deferred; closing/thank-you not added; native POS print QA recommended.

---

### Phase 19Y-Fix — Invoice Message Fields Across Templates

Status:

* Completed. Configurable invoice/print messages now render across all four invoice templates, using the **existing `receipt` settings key** (welcomeMessage / headerNote / footerMessage / termsMessage).
* No new settings key; no backend/DB/migration/API; no custom text blocks; no closing/thank-you field; no financial/business logic.

Changes:

* **ViewModel** (`invoice-print-view-model.ts`): added display-only `vm.messages = { welcomeMessage?, headerNote?, footerMessage?, termsMessage? }` sourced from `settings.receipt` (trimmed; empty → undefined). Kept **separate** from `vm.notes` (= per-invoice `invoice.notes`).
* **Builder config:** added section toggles `welcomeMessage`, `headerNote`, `footerMessage` (default `true`) to `PrintTemplateSectionConfig` + defaults (print-template-config.ts), the Zod `SectionConfigSchema` (print-builder-config.ts), and the Settings Print Builder section-toggle list. Reused existing `sections.terms` for `termsMessage`. Old saved builder configs sanitize safely (missing keys default true).
* **Templates (all four):** render messages from `vm.messages`, gated by the section toggles — welcome + header note near the header; terms in the terms section; footer message near the footer. **Luxury no longer reads `receiptConfig.termsMessage` directly** (removed the unused `receiptConfig`); all four now use `vm.messages.termsMessage`, so terms appears in Compact/Minimal/Thermal too (previously Luxury-only). Plain text, React-escaped, `white-space: pre-line`, no `dangerouslySetInnerHTML`; Thermal uses compact sizing; empty messages auto-collapse.
* **Settings UI:** the POS/Receipt card's message inputs are now under an **"Invoice & Receipt Messages / رسائل الفواتير والإيصالات"** sub-heading with helper text ("appear on printed invoices and POS receipts; plain text; do not affect totals"); POS-specific fields split under a "POS Receipt-specific Options" sub-heading. Same `receipt` save path; POS receipt behavior preserved.
* **Fixture/tests:** `FIXTURE_SETTINGS.receipt` messages added; `verify-invoice-print-view-model.js` asserts messages source/trim/empty→undefined + notes separation + totals unchanged; `verify-print-builder-config.js` asserts new section defaults + toggle round-trip; one export smoke test (terms in Compact/Minimal/Thermal, footer message in Luxury).

Verification:

* typecheck clean; lint 0 errors (pre-existing `<img>` warnings); build succeeded; `next-env.d.ts` clean.
* All print verifies pass (VM / template-config / builder-config / company-info); grep-safety clean.
* `npm run test:print-export` not run to completion (known headless Playwright limitation; force-terminated). No artifacts tracked. Native browser QA recommended.

Preserved: `receipt` / `printTemplateDefaults` / `invoicePrintBuilderConfig` / `printCompanyInfo`; invoice `notes` stays separate; POS `ReceiptPrintTemplate` unchanged.

Remaining gaps: closing/thank-you message not added; custom text blocks not started; native print QA recommended; advanced controls / drag-drop / PDF / Search & Print not started.

---

### Phase 19X.2-G — Live Company Data in Invoice Preview

Status:

* Completed. Frontend/preview-only fix. The Settings → Print & Invoice Design builder preview no longer shows stale fixture company data.
* No backend/DB/migration/API changes; no financial/business logic; no invoice messages; no custom text blocks.

Root cause:

* Both preview `InvoiceDocument` instances passed the static `company={FIXTURE_COMPANY}` ("Test Jewellery Co", fixture TRN), so the preview reflected the demo fixture rather than the live/edited company data.

Fix (`app/[locale]/(dashboard)/settings/page.tsx` only):

* Added a memoized `livePreviewCompany` (useMemo — no setState, no loop) derived with precedence **Company Profile form state > auth company/session > FIXTURE_COMPANY (demo fallback)**, covering name/logo/branch/currency/TRN/phone/email/website + address (country/city/region/address1/address2/postalCode). Both previews now pass `company={livePreviewCompany}`.
* Demo invoice/items/customer/totals still come from `FIXTURE_INVOICE`. Preview `settings` still spreads real `settings` + unsaved `invoicePrintBuilderConfig: builderForm`, so builder toggles/theme/template/language stay live. `receipt`/`printCompanyInfo` remain contact/address fallback via the VM; identity stays company-first (printInfo.displayName/taxNumber cannot override).

Verification:

* typecheck clean; lint 0 errors (pre-existing `<img>` warnings); build succeeded; `next-env.d.ts` clean.
* print verifies (VM / template-config / builder-config / company-info) all ok; grep-safety clean.
* `npm run test:print-export` not run to completion (known headless Playwright limitation; the settings preview isn't covered by the fixture spec anyway). No artifacts tracked. Native browser QA recommended.

Remaining gaps: invoice message expansion / custom text blocks not started; native print QA recommended; advanced controls / drag-drop / PDF / Search & Print not started.

---

### Phase 19X.2-F — Company Address Wiring

Status:

* Completed. Wires the official company address (existing DB columns) into Company Profile and invoice print.
* No new DB columns, no migration, no data deletion, no settings-key rename, no custom text blocks, no invoice-message expansion, no financial/business logic.

Audit outcome (no surprises):

* `companies` already has `country, city, region, address1, address2, postal_code, commercial_register`; `serializeCompany` already returns them; `DarfusCompany` already types them. The only gap was the `PATCH /settings` company whitelist (omitted them) and the missing Company Profile UI + VM formatting. `EGYPT` seen in output is `company.country`, not a full address.

Changes:

* **Backend (existing columns only):** extended the `PATCH /settings` company whitelist (erp.routes.js) with `country, city, region, address1, address2, postalCode, commercialRegister`. No model/migration change; `/settings/by-key` untouched.
* **settings-context:** `AppSettings` + `updateSettings` payload forward the seven address fields.
* **Company Profile UI:** new "Official Company Address / العنوان الرسمي للشركة" section (country, city, region, postalCode, address1, address2, commercialRegister) with helper text; `handleSaveCompany` sends them via `updateSettings` (→ PATCH /settings) + `updateCompany` (session). Load effect populates from the auth company. No company-address input remains in Print & Invoice Design.
* **ViewModel address:** formats `[address1, address2, city, region, country, postalCode].filter(Boolean).join(", ")`; precedence = formatted company address > `printCompanyInfo.address` > `receipt.address`. Country-only still yields a location string (acceptable). Display-only.
* **PrintCompany + templates + sales caller:** `PrintCompany` and the VM `options.company` gained the six structured address fields; all four templates forward them; the sales print caller passes them from the auth company.

Verification:

* typecheck clean; lint 0 errors (pre-existing `<img>` warnings); build succeeded; `next-env.d.ts` clean; `node -c` on erp.routes.js ok.
* `verify-invoice-print-view-model.js` extended + ok (structured address formats and wins; country-only; printInfo fallback; receipt fallback; prior identity/contact precedence still holds). print-company-info / template-config / builder-config verifies ok. grep-safety clean.
* `npm run test:print-export` not run to completion (known headless Playwright limitation; force-terminated). No artifacts tracked. Native browser QA recommended.

Preserved keys: `receipt`, `printTemplateDefaults`, `invoicePrintBuilderConfig`, `printCompanyInfo` (address fallback). `printCompanyInfo.address` / `receipt.address` remain hidden fallback/backward-compat.

Remaining gaps:

* Invoice message expansion / custom text blocks not started.
* Native print QA recommended.
* Advanced controls / drag-drop / PDF / Search & Print not started.

---

### Phase 19X.2-C/D/E — Company Profile Contact Wiring + Print Source Cleanup

Status:

* Completed (frontend-only; the 19X.2-B dev migration was run: `20260704000000-add-company-contact-fields: migrated`). Finishes the company-data consolidation.
* No backend/DB/migration/API changes; no data deletion; no settings-key rename; no custom text blocks; no invoice-message expansion; no financial/business logic.

Changes:

* **Types (C):** `DarfusCompany` (auth-context) + `PrintCompany` (InvoicePrintTemplate) + `AppSettings` (settings-context) gained `phone/email/website`. `serializeCompany` already returns them (19X.2-B).
* **Company Profile UI (C):** added phone/email/website inputs alongside name/logo/currency/TRN; one Save button. `handleSaveCompany` now sends `taxNumber` (TRN persistence fix) + `phone/email/website` through `updateSettings` (→ `PATCH /settings`) and mirrors them into `updateCompany` (session). Load effect prefills contact fields from the DB company, falling back to legacy `printCompanyInfo` when the DB field is empty (frontend-assisted migration; no DB backfill). Address intentionally NOT added to Company Profile this phase — still served by `printCompanyInfo`/`receipt` fallback (reported).
* **settings-context (C):** `updateSettings` payload now forwards `taxNumber/phone/email/website` as company props (backend whitelist accepts them). PATCH whitelist on the frontend list unchanged for settings keys; `/settings/by-key` untouched.
* **Remove duplicate card (E):** deleted the "Company Print Info / بيانات الشركة للطباعة" card from Print & Invoice Design (and its state/handlers/preview wiring). `printCompanyInfo` key/schema/hook **kept** as fallback/backward-compat.
* **ViewModel precedence (D):** identity (`displayName`, `trn`) is now company-master-only — `printCompanyInfo.displayName/taxNumber` are ignored as overrides (kept in schema, no deletion). Contact fields resolve company → `printCompanyInfo` → `receipt`.
* **Print path wiring (required, reported):** to actually deliver DB company contact into print, `PrintCompany` gained phone/email/website, the sales print caller passes them from the auth company, and all four templates now build the VM `company` from the real company props (removing the old `receiptConfig.phone/address` injection into `options.company`; the VM still applies the `receipt` fallback internally, so no regression). `receiptConfig` retained only where still used (Luxury terms).

Verification:

* typecheck clean; lint 0 errors (pre-existing `<img>` warnings); build succeeded; `next-env.d.ts` clean.
* `verify-invoice-print-view-model.js` rewritten + ok: company businessName/taxNumber/phone/email/website win over old `printCompanyInfo`; empty company → printInfo fallback; empty both → receipt fallback; email undefined when no source. `verify-print-company-info.js` still ok (schema unchanged). template/builder verifies ok. grep-safety clean.
* `npm run test:print-export` not run to completion (known headless Playwright limitation; force-terminated). No artifacts tracked. Native browser QA recommended.

Preserved keys: `receipt`, `printTemplateDefaults`, `invoicePrintBuilderConfig`, `printCompanyInfo` (fallback).

Remaining gaps:

* True DB address wiring (address1/2/postalCode → print) optional/not started.
* Invoice message expansion / custom text blocks not started.
* Native print QA recommended.
* Advanced controls / drag-drop / PDF / Search & Print not started.

---

### Phase 19X.2-B — DB-Backed Company Contact Fields (backend/DB foundation)

Status:

* Completed (code). Backend/DB-only foundation for making Company Profile the master source of company contact data. **Migration NOT executed here** (requires a real DB; see below). No frontend/print/ViewModel/template changes.
* From the Phase 19X.1 + 19X.2 audits (Option B, staged). This is phase **B** (backend + migration + serializer). Frontend wiring / precedence cleanup / duplicate-card removal are later phases C/D/E — NOT started.

Changes:

* Migration `backend/migrations/20260704000000-add-company-contact-fields.js` (new): additive, idempotent (`columnExists` guard), adds nullable columns to `companies` — `phone STRING(40)`, `email STRING(160)`, `website STRING(200)`. No defaults, no index, no backfill, no data rewrite. `down` removes the three columns if present. Mirrors the established pattern (e.g. `20260627010000-add-purchase-vat-fields.js`).
* `backend/src/models/company.model.js`: added `phone`/`email`/`website` attributes (nullable; single-word names map cleanly under `underscored: true`).
* `backend/src/routes/erp.routes.js` (`PATCH /settings`): extended the company whitelist loop to `["businessName","logo","currency","branchName","taxNumber","phone","email","website"]`. Existing fields unchanged; settings JSONB behavior and `/settings/by-key` untouched; permission (`settings.update`) unchanged.
* `backend/src/controllers/auth.controller.js` (`serializeCompany`): added `email` and `website` (empty-string fallback); `phone` (already listed) now resolves from the real DB column. Flows through login/refresh/me/register/logout responses (single serialization point).

Migration execution:

* **Not run.** Command for a safe/dev DB: `cd backend && npm run db:migrate` (never against production). Columns are additive + nullable, so pre-migration the code is safe: existing rows serialize the new fields as `""` and the whitelist simply no-ops for absent values.

Safety / compatibility:

* `taxNumber` already backend-supported (unchanged). `printCompanyInfo` schema/key and the current print fallback remain the source for print contact data until the frontend phase (C). Existing frontend + print output unchanged. No financial/business logic; grep-safety clean on changed files. typecheck/lint/build green; syntax checks (`node -c`) pass on all changed backend files + migration; print verifies all ok.

Remaining next phases:

* 19X.2-C — frontend Company Profile wiring (send phone/email/website + fix TRN send; prefill from `printCompanyInfo`).
* 19X.2-D — print ViewModel precedence cleanup (company-first identity; company→printInfo→receipt contact).
* 19X.2-E — remove the duplicate Company Print Info card from Print & Invoice Design.
* Invoice messages / custom text blocks / advanced features — not started.

---

### Phase 19X-Fix — Print Company Info Source + Email End-to-End

Status:

* Completed. Frontend-only. Added a new settings JSONB key `printCompanyInfo` (display-only company print contact/branding), saved via the generic `PUT /settings/by-key/printCompanyInfo`.
* No backend/DB/migrations/API/new-endpoint changes; no company model columns; no `PATCH /settings` whitelist change; no localStorage; no custom text blocks; no financial/business logic; no ViewModel calculation changes.

Problem addressed (from the Phase 19X audit):

* Company `email` had no end-to-end source: the company DB model has no email/phone/website columns; templates never passed email into the ViewModel; `vm.company.email` was always empty even though the `footerEmail` toggle/slot exists.

Storage / schema:

* `features/printing/lib/print-company-info-config.ts` (new): `PrintCompanyInfoConfig` type + `DEFAULT_PRINT_COMPANY_INFO_CONFIG` + `sanitizePrintCompanyInfoConfig` (Zod-based; never throws; strips unknown keys; trims + caps lengths; clears invalid email/website rather than rejecting the payload; input `version` ignored, output normalized to 1). Fields: displayName, subtitle, phone, email, website, address, taxNumber.
* `hooks/use-print-company-info.ts` (new): reads `settings.printCompanyInfo` (memoized-sanitized to avoid render loops), exposes `config / isSaving / error / saveConfig`; saves via by-key then `refreshSettings()`.
* `scripts/verify-print-company-info.js` (new) + `package.json` script `verify:print-company-info`.

ViewModel merge (`features/printing/lib/invoice-print-view-model.ts`):

* Added display-only `subtitle` + `website` to the VM company type (and optional `website` to the options.company input type).
* Layering (display-only): `printCompanyInfo` > company master > legacy `receipt` fallback, for displayName/subtitle/phone/email/website/address/trn. Existing `receipt` fallbacks preserved. No totals/VAT/item/payment changes. Import-free (keeps the plain-`require` VM verify script working).

Settings context (`contexts/settings-context.tsx`):

* Added `printCompanyInfo?: any` to `AppSettings` and to the JSON parse-keys list. PATCH whitelist NOT touched (writes go through by-key only).

Settings UI (`app/[locale]/(dashboard)/settings/page.tsx`):

* New "Company Print Info / بيانات الشركة للطباعة" card in the unified Print & Invoice Design tab, between Invoice Print Defaults and the Print Builder. Fields displayName/subtitle/phone/email/website/address/taxNumber, Save + Reset, helper text ("print display only; does not modify company master data; leave blank to use fallback"). Signature-guarded rehydrate effect (Phase 19U-Hotfix pattern) to avoid update loops. Builder live preview now merges the sanitized in-progress company info (`printCompanyInfo: previewCompanyInfo`).

Rendering:

* Email now flows end-to-end into all four templates' footer via the existing `footerEmail` field/slot — no template file changes needed. `website` and `subtitle` are stored (and merged into the VM) but NOT yet rendered in templates (reported as stored-but-not-rendered; future phase).

Verification:

* typecheck clean; lint 0 errors (pre-existing `<img>` warnings only); build succeeded; `next-env.d.ts` clean.
* `verify-print-company-info.js` ok (default/fallback/unknown-key-strip/invalid-email+website-clear/length-cap/version-normalize); `verify-invoice-print-view-model.js` extended + ok (email sourced from printCompanyInfo; precedence; receipt fallback still works); template-config + builder-config verifies ok; financial-safety grep on changed files clean.
* `npm run test:print-export` not run to completion (known headless Playwright `webServer`/browser limitation; run force-terminated). Added one smoke assertion (configured email renders in footer) + `printCompanyInfo` in the fixture; no artifacts tracked (gitignored). Native browser QA recommended.

Preserved keys (unchanged): `receipt`, `printTemplateDefaults`, `invoicePrintBuilderConfig`.

Remaining gaps:

* Invoice message fields expansion (greeting/closing/footer/terms into A4 invoice templates) not started (Phase 19Y).
* Custom text blocks not started (Phase 19Z).
* `website`/`subtitle` stored but not rendered in templates yet.
* Native/manual browser print QA still recommended.
* Advanced controls / drag-drop / PDF / Search & Print not started.

---

### Phase 19W — Settings Print Tabs Consolidation

Status:

* Completed. UI-only Settings page consolidation (`app/[locale]/(dashboard)/settings/page.tsx`).
* No backend/DB/migrations/API changes; no settings-key rename; no data migration; no deletion of saved settings; no localStorage; no new Builder controls; no company email/custom-text additions; no financial/business logic; no ViewModel/template output change.

Problem:

* Settings previously showed two competing tabs that both sounded like invoice design: `receipt` (تصميم الفاتورة / Receipt Layout) and `printBuilder` (مُصمّم الطباعة / Print Builder).

Change (Option A — single visible tab, multiple existing keys):

* Merged the `receipt` and `printBuilder` tabs into one tab `printDesign`, labelled **تصميم الطباعة والفواتير / Print & Invoice Design**. The `activeTab` union dropped `receipt` and `printBuilder` and gained `printDesign`; the two tab-list entries collapsed into one.
* All three cards now render under the single `printDesign` tab, each still saving to its own existing key:
  * POS / Receipt Print Options → `receipt` (relabelled heading + description to make clear it is POS/thermal receipt + messages, not A4 invoice design; card body/toggles/save unchanged).
  * Invoice Print Defaults → `printTemplateDefaults` (unchanged).
  * Invoice Print Builder → `invoicePrintBuilderConfig` (unchanged; toggles, theme presets, live preview, reset, save all intact).
* Card physical order was intentionally preserved (POS/Receipt, then Invoice Print Defaults directly above the Print Builder) to avoid a risky large block relocation; the POS/Receipt description points to the invoice templates below it. Invoice Print Defaults and Print Builder remain adjacent/grouped.
* No external deep-links referenced the old `receipt`/`printBuilder` tab ids (grep-verified), so no navigation callers needed updating.

Verification:

* typecheck clean; lint 0 errors (pre-existing `<img>` warnings only); build succeeded; `next-env.d.ts` clean.
* `verify-invoice-print-view-model.js`, `verify-print-template-config.js`, `verify-print-builder-config.js` → all ok; financial-safety grep on the changed file clean (only pre-existing payment-method *settings* labels, no calculation logic).
* `npm run test:print-export` not run to completion in this headless environment (Playwright `webServer`/browser dependent; the run was force-terminated). No artifacts tracked (gitignored). Native browser QA recommended: one clear print/invoice design tab; Invoice Print Defaults sits with the Builder; Builder toggles + preview work; POS/receipt settings still accessible and clearly labelled; save + refresh persists `receipt`, `printTemplateDefaults`, and `invoicePrintBuilderConfig`.

Remaining gaps:

* Company print info + messages (incl. missing company email) / custom text blocks not started (Phase 19X).
* Native/manual browser print QA still recommended.
* Builder advanced controls / drag-drop / PDF / Search & Print not started.

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
Phase 27-Fix — Manual Customer Deposit
(follows Phase 27 audit. Added manual customer deposit workflow. Backend endpoint
POST /customers/:id/credit/deposit is guarded by treasury.update and requires
Idempotency-Key with central scope customer.credit_deposit. The endpoint validates
positive amount, cash/bank method, and 1110/1120 account-code pairing; locks the
customer row; rejects inactive customers; validates optional branch; creates an
operational CashTransaction cash_in log; calls recordCreditIn(glPosting) as the
single GL owner; posts one journal only: Dr 1110/1120 and Cr 2300; links
cashTransactionId on CustomerCreditTransaction and journalEntryId on both credit
row and CashTransaction. Customer.balance and invoice balances are not mutated.
CustomerCreditTransaction sourceType now accepts manual_deposit at model
validation level only; no DB migration/schema change. Minimal customer detail UI
adds Available Credit -> Add Deposit modal with amount, cash/bank, date,
description, reference, stable idempotency key, and warnings that this is a
customer credit liability and not invoice settlement. Added
verify-manual-customer-deposit.js and package script. Updated customer-credit
verifiers to allow deposit only. No refund/apply credit endpoint, no return/
exchange changes, no dashboard/report rewrite, no print work. Deferred: granular
customers.credit.deposit permission, refund customer credit, apply credit to
invoice/POS, return/exchange settlement options, source-aware 2300 reconciliation,
stronger concurrent credit consume locking.)

Previous marker:
Phase 26.1-Hotfix-Fix — Backend Script Env Loading Repair
(follows the Phase 26.1-Hotfix audit. Fixed root-invoked backend maintenance
scripts to load backend/.env by script path before requiring Sequelize models.
Root npm run check:customer-credit-gl-bridge now uses the same backend DB env as
backend migration/status commands; the mismatch was root cwd loading root .env
and falling back to localhost:5432 while backend migrations used localhost:5433.
Also normalized reconcile-installment-balances and idempotency-cleanup backend
scripts to the same explicit env loading pattern. No migration repair was needed;
no DB writes, no backfill, no route changes, no customer credit business flow
changes, no return/exchange changes, no apply/refund/manual deposit flows, no
posting.service redesign, no dashboard/report rewrite, no print work. Updated
verifiers to require explicit backend env loading. Deferred: manual customer
deposit, refund customer credit, apply credit to invoice/POS, return/exchange
settlement options, source-aware 2300 reconciliation, backfill only if ever
proven safe.)

Previous marker:
Phase 26.1-Fix — Customer Credit Existing Rows Dry-Run Checker
(follows Phase 26-Fix. Added backend/scripts/check-customer-credit-gl-bridge.js,
a dry-run-only checker for existing CustomerCreditTransaction rows and their
GL bridge state. Root command: npm run check:customer-credit-gl-bridge. Supports
--company-id, --customer-id, --source-type, --status, --limit, and --json; rejects
--apply/--write/--fix/--update/--backfill/--confirm. The checker reads only
CustomerCreditTransaction, JournalEntry, JournalLine, Account, and Customer with
explicit attributes; it performs no writes and closes the DB connection. It
classifies rows as OK, Needs GL Bridge Review, Broken Link, Invalid Journal, or
Ignored / Not Eligible; validates linked journals when present; checks credit_in
has Cr 2300 and credit_out has Dr 2300; reports amount mismatches, missing/invalid
journals, missing customer/company, and inactive rows. It warns that GL 2300 can
include non-CustomerCreditTransaction subledgers (invoice deposits/customer gold),
so it does not treat total 2300 vs customer-credit total as an error. Added
verify-customer-credit-existing-rows-checker.js and npm script verify:customer-
credit-existing-rows-checker. No backfill, no apply mode, no route changes, no
public customer credit mutation endpoint, no return/exchange changes, no apply/
refund/manual deposit flows, no migration, no dashboard/report rewrite, no print
work. Deferred: manual customer deposit, refund customer credit, apply credit to
invoice/POS, return/exchange settlement options, source-aware 2300 reconciliation,
full credit backfill only if dry-run output proves safe, stronger concurrent
credit consume locking.)

Previous marker:
Phase 26-Fix — Customer Credit Service-Level GL Bridge to 2300
(follows Phase 26 audit. Added service-level GL bridge primitives to
backend/src/services/customer-credit.service.js without adding public mutation
endpoints. recordCreditIn/recordCreditOut now support optional glPosting:
credit_in can Dr an explicit counter account and Cr 2300; credit_out can Dr
2300 and Cr an explicit counter account. If glPosting is missing/disabled, rows
remain ledger-only as before. Generated journalEntryId is saved on the
CustomerCreditTransaction row; explicit journalEntryId + glPosting.enabled is
rejected to prevent duplicate/ambiguous journals. GL bridge work uses
postingService.postEntry, the existing chart/ensureAccount behavior, and wraps
credit row + journal in a transaction when no caller transaction is supplied.
No route changes, no return/exchange credit mode, no apply-credit-to-invoice/POS,
no refund endpoint, no backfill, no migration, no dashboard/report rewrite, no
print work. Future public credit endpoints must use central idempotency scopes
customer.credit_in / customer.credit_apply / customer.credit_refund. Phase 25
reconciliation may still show 2300 differences because 2300 includes other
subledgers such as invoice deposits/customer gold. Added
verify-customer-credit-gl-bridge.js and npm script verify:customer-credit-gl-
bridge. Deferred: customer credit dry-run/backfill checker, manual deposit,
return/exchange credit mode, apply credit, refund credit, source-aware 2300
reconciliation, customer/supplier journal-line dimensions.)

Previous marker:
Phase 25-Fix — Ledger Reporting Foundation MVP
(follows the Phase 25 audit. Added/strengthened read-only ledger reporting
foundation without rewriting dashboards or operational reports. Existing
/accounts/:id/statement and /reports/trial-balance remain JournalEntry/
JournalLine-based and now include additive ledger metadata; account statement
also exposes branch filter and period debit/credit totals. Added read-only
/reports/ledger/account for accountCode/accountId ledger lookup, plus
/reports/ledger/cash-reconciliation comparing GL cash/bank accounts 1110/1120
against CashTransaction movement, and /reports/ledger/ar-ap-reconciliation
comparing GL AR/AP/customer-deposit accounts 1300/2100/2300 against operational
mirrors. Customer/supplier reconciliation remains account-level only because
JournalLine has no customerId/supplierId dimensions; customer/supplier
statements remain source-document-based. Operational reports remain unchanged
except additive ledgerBased:false/source metadata where touched. Added
verify-ledger-reporting-foundation.js and npm script verify:ledger-reporting-
foundation. No dashboard rewrite; no posting.service redesign; no migration; no
print work. Deferred: dashboard KPI conversion, full balance sheet, full income
statement, cash flow statement, customer/supplier journal-line dimensions,
customer credit GL bridge to 2300, ledger-based operational report conversion.)

Previous marker:
Phase 24.1-Hotfix — Installment Reconciliation Script Runtime Repair
(follows Phase 24.1-Fix after manual dry-run exposed two runtime issues: root script
could not resolve backend-only sequelize without NODE_PATH, and Invoice.findAll selected
all model columns including optional vat_rate, which the current DB schema lacks. Moved
the dry-run script to backend/scripts/reconcile-installment-balances.js, updated the root
npm command to call that path, and switched model imports to the backend convention
require("dotenv").config() + require("../src/models"). All Sequelize reads now use explicit
attributes only; the script does not mention or require vat_rate/vatRate. The report output
and JSON mode remain the same. Still dry-run only: no apply mode, no writes, no route changes,
no DB migration, no business logic changes, no return/exchange changes, no print work.)

Previous marker:
Phase 24.1-Fix — Dry-Run Installment Drift Reconciliation Report
(follows the Phase 24.1 audit. Added scripts/reconcile-installment-balances.js as a
dry-run-only report for historical installment mirror drift between Payment rows and
Invoice.paidAmount / Invoice.remainingAmount / Customer.balance. The script supports
--company-id, --invoice-id, --customer-id, --limit, and --json; it rejects --apply,
--write, --fix, --update, and --confirm with a dry-run-only error. It reads only
Invoice, Payment, Installment, Customer, plus related return/exchange Invoice rows
for risky skip classification. It performs no writes, has no apply mode, runs no
backfill, and changes no routes/business logic. Risky invoices with returns/exchanges
or suspicious overpayment are skipped for manual review. Added
verify-installment-reconciliation.js and npm scripts reconcile:installment-balances
and verify:installment-reconciliation. No DB mutation, no migration, no print work,
and no ledger-based reports. Deferred: review real dry-run output, guarded apply-mode
design if approved, historical return/exchange settlement review, ledger-based reports,
credit application/refund, GL bridge to 2300.)

Previous marker:
Phase 24-Fix — Installment AR Mirror Writeback
(follows the Phase 24 audit. Fixed forward-going installment AR mirror drift in POST
/installments/:id/pay only: after a fresh central idempotency claim and inside the existing
installment payment transaction, the route now locks the related Invoice and Customer rows,
reduces Customer.balance, reduces Invoice.remainingAmount, and increases Invoice.paidAmount
by the collected amount, with AR mirrors clamped at >=0. Idempotency replay/conflict/
processing paths resolve before the writeback and do not re-apply it. Existing Payment,
CashTransaction, and postInstallmentPayment journal behavior remain unchanged. No return/
exchange settlement changes; no customer credit ledger calls; no historical backfill/
reconciliation; no migration; no print work. Added verify-installment-balance-writeback.js
and npm script verify:installment-balance-writeback. Deferred: historical installment drift
reconciliation/backfill, ledger-based reports, credit application/refund flows, GL bridge
for customer credit ledger.)

Previous marker:
Phase 23-Fix — Customer Credit Ledger MVP (Infrastructure)
(follows the Phase 23 audit. Added customer_credit_transactions table (migration 20260707010000, NOT
run here), model customerCreditTransaction.model.js (registered), and customer-credit.service.js
(recordCreditIn/recordCreditOut/getCustomerCreditSummary/getCustomerCreditTransactions; availableCredit
= Σ active credit_in − credit_out; credit_out cannot go negative; accepts transaction; company/customer
scoped; NEVER writes Customer.balance/Invoice.remainingAmount and posts NO GL — 2300 bridge deferred,
journalEntryId nullable). Read-only GET /customers/:id/credit endpoint + a read-only Available Credit
card on customers/[id] statement panel. INFRASTRUCTURE ONLY: no flow creates credit; returns/exchanges
still cash-refund excess; overpayment still prevented; Customer.balance stays AR-only; statement-v2
unchanged. New verify-customer-credit-ledger.js (functional + static) passes; typecheck/lint(0 err)/build
+ node -c + all prior verifiers ok. No print/report/posting.service rewrite; no destructive DB; migration
created but not run. 11 stashes untouched. Deferred (business decision): excess-as-credit vs refund,
overpayment acceptance, credit apply/refund, GL 2300 bridge, Customer.balance installment drift, ledger reports.)

Previous marker:
Phase 22-Fix — Strict Production Data-Source Hardening
(follows the Phase 22 audit. Closed the silent-mock hazard: production (NODE_ENV=production) now
ALWAYS resolves the data source to "api" and fails loudly via assertProductionDataSource() when
NEXT_PUBLIC_DATA_SOURCE is missing/≠api or NEXT_PUBLIC_API_URL is empty — called by the API client
before any request. Centralized lib/data-source.ts (getDataSourceMode/isApiDataSource/
assertProductionDataSource), removed the (as DataSourceMode) || "mock" default and the duplicate
|| "mock" in lib/api/client.ts, and replaced 13 direct process.env.NEXT_PUBLIC_DATA_SOURCE reads
across POS/sales/returns/exchanges/customer-gold/invoices/assets/inventory/employees/settings with
the central helper. Module is import-safe so next build passes; loud failure is at the API boundary.
Dev still allows mock/local (default mock; invalid throws). localStorage business persistence stays
gated by !isApi (unchanged); no mock files deleted. New verify-production-data-source.js (functional +
static) passes; typecheck/lint(0 err)/production build + prior verifiers ok. Frontend-only; no backend/
DB/migration/print/idempotency/accounting changes. .env is untracked (local); examples already =api.
11 stashes untouched. Deferred: explicit demo-mode flag; api-mode Local repo cleanup; credit ledger;
ledger reports.)

Previous marker:
Phase 21.5-Fix — Edge Financial Idempotency & Cleanup Script Repair
(follows the Phase 21.5 audit. Extended central idempotency to the last two exposed financial
endpoints: /payslips/:id/pay (payroll.payslip_payment) and /customers/:id/gold/payout
(customer.gold_payout). Both now REQUIRE Idempotency-Key (400 if missing), fold req.params.id into
the hash, and use claim/succeed inside a transaction — payslip pay is now wrapped in a transaction
for the first time with postPayrollEntry moved inside it (ends the best-effort no-journal divergence).
Payslip frontend sends a stable per-payslip ref key; gold payout has no UI caller so none was invented.
Treasury closing left unchanged (per-account-per-day uniqueness, no cash/journal — deferred). Repaired
the broken TTL cleanup: relocated scripts/idempotency-cleanup.js → backend/scripts/idempotency-cleanup.js
(root copy failed with MODULE_NOT_FOUND on dotenv), package script → node backend/scripts/idempotency-
cleanup.js; still deletes only expires_at < now, --dry-run verified live (0 rows, no delete); run via
external cron. verify-secondary-idempotency.js extended and passes; verify-idempotency + prior verifiers
still pass; typecheck/lint(0 err)/build + node -c ok. NO new migration; no payroll/gold/accounting/
print redesign; no destructive DB. 11 stashes untouched. Deferred: treasury-closing centralization;
scheduled cleanup job; customer credit ledger; mock hardening; ledger reports.)

Previous marker:
Phase 21.4-Fix — Secondary Financial Idempotency & TTL Cleanup
(follows the Phase 21.4 audit. Extended the central idempotency_requests service to the three
highest-risk secondary financial endpoints: /treasury/transactions (treasury.cash_transaction),
/purchase-orders/:id/pay (purchase.payment), /installments/:id/pay (installment.payment). Each now
REQUIRES Idempotency-Key (400 if missing), folds req.params into the request hash, and uses
claim/succeed inside its business transaction (sentinel-on-duplicate → rollback → resolveExisting
replay/conflict), replacing the old optional-key/lookup-only logic. Frontend: treasury + installments
pages now send stable ref-based keys (reset/cleared on success); purchase-pay caller already sent a
stable key (unchanged). Added scripts/idempotency-cleanup.js (npm run idempotency:cleanup) — deletes
ONLY expires_at < now (Op.lt), supports --dry-run, no truncate/reset/delete-all; NOT executed here.
New verify-secondary-idempotency.js passes; verify-idempotency + prior verifiers still pass;
typecheck/lint(0 err)/build + node -c ok. NO new migration (21.3 table reused); no accounting/
settlement/stock/print redesign; no destructive DB. 11 stashes untouched. Deferred: payslip/gold-
payout/treasury-closing centralization; scheduled cleanup job; customer credit ledger; mock hardening.)

Previous marker:
Phase 21.3-Fix — Central Idempotency Requests + Critical Frontend Keys
(follows the Phase 21.3 audit. Added central idempotency_requests table with UNIQUE
(company_id, scope, key) + model + idempotency.service (hashRequest/claim/resolveExisting/succeed).
Wrapped /pos/checkout, /sales/returns, /sales/exchanges, /purchase-orders/receive with insert-first
race-safe idempotency (missing key→400, replay saved response, same-key-diff-hash→409, processing→409);
success payload persisted before commit. Frontend returns/exchanges/purchase-receive now send a stable
Idempotency-Key (generateUUID, reset on success); POS unchanged. /purchase-orders/:id/pay + secondary
payment/treasury endpoints deferred (already required-key + row-lock). Migration NOT executed — run
`cd backend && npm run db:migrate` before use. verify-idempotency.js (functional + static) passes;
typecheck/lint/build + prior verifiers ok; no print work; no settlement/stock redesign; no DB reset.
Next: run migration; convert pay/secondary endpoints; TTL cleanup — deferred.)

Previous marker:
Phase 21.2-Fix — Receivable-First Return / Exchange Settlement
(follows the Phase 21.2 audit's High finding. Returns/exchanges now settle against the
original invoice's outstanding receivable FIRST — cash moves only for the real excess.
Returns: receivableReliefAmount=min(returnedTotal,outstanding), cash_out only if excess>0;
postReturnEntry money leg splits Cr AR 1300 + Cr Cash/Bank (legacy full-cash fallback kept).
Exchanges: diff<0 relieves AR first then cash-refunds excess; diff>0 defaults to CREDIT for
the UI's hardcoded "Exchange" (no fake cash_in), paid_now only for a real method/flag; GL
splits Cash/Bank + AR 1300; treasury CashTransaction only for real cash; customer.balance +
invoice.remainingAmount adjusted once, clamped >=0. Stock/asset reversal unchanged; frontend
unchanged (backend safe default). New verify-return-exchange-settlement.js (functional GL split
+ formula matrix + static route checks; confirms old bug patterns gone) passes; node -c +
typecheck/lint/build ok. No DB/migration; no customer-credit ledger; idempotency → 21.3 deferred.)

Previous marker:
Phase 21.1-Fix — Generic Invoice CRUD Guards (data integrity)
(follows the Phase 21 audit's Critical finding. Blocked generic /invoices create
entirely (403) and generic update/delete/deactivate/reactivate of posted/cancelled
invoices (409) in ErpController — posted financial docs change only via lifecycle
routes (/pos/checkout, /sales/invoices/*). Draft invoices still updatable/deletable;
lifecycle-field guard preserved. Frontend never used generic invoice mutations, so
unchanged. New verify-invoice-crud-guards.js (functional, no DB) + lifecycle-route
static checks all pass; typecheck/lint/build ok. No DB/migration; no accounting/
treasury redesign. Return/exchange accounting → 21.2; idempotency → 21.3 deferred.)

Previous marker:
Phase 20.3-Fix — Custom Text Block Styling Controls
(follows Phase 20.3 request after user confirmed 20.2 manual QA working. Added
safe per-block style controls for invoicePrintCustomBlocks: fontSize xs/sm/base/
lg/xl, align left/center/right, and bold/italic/underline booleans. Existing
blocks without style default safely. Sanitizer rejects invalid font/alignment
values and ignores arbitrary style/CSS fields. Settings -> Print & Invoice
Design now exposes a simple print styling toolbar per block. CustomPrintTextBlocks
maps style enums/booleans to fixed safe rendering values only; text remains plain
React text with white-space: pre-line. No HTML, no Markdown, no dangerouslySetInnerHTML,
no rich text editor, no font-family/color picker, no arbitrary CSS input. Existing
receipt messages, invoice.notes, branch, Sales/POS print paths, and Builder
customTextBlocks section toggle remain unchanged. No backend/DB/API/migration;
no financial/business logic changes.)
```

Previous marker:
```text
Phase 20.2-Fix — Custom Print Text Blocks MVP
(follows Phase 20.2 audit. Added independent invoicePrintCustomBlocks settings
key with a constrained plain-text MVP: max 5 blocks, title max 120 chars, content
max 1000 chars, predefined placements afterHeader / afterInvoiceDetails /
beforeItems / afterItems / afterTotals / beforeSignatures / beforeFooter,
optional template filter, and sortOrder. Added sanitizer/config module, by-key
save hook, Settings -> Print & Invoice Design editor, Builder section toggle
sections.customTextBlocks defaulting true, ViewModel grouping by placement, and
CustomPrintTextBlocks renderer. Luxury, Compact, Minimal, and Thermal render
blocks in their placement slots. Existing receipt messages and invoice.notes are
unchanged. Plain React text only: no HTML, no Markdown, no dangerouslySetInnerHTML.
No backend/DB/API/migration; no receipt custom blocks; no barcode/QR, VAT
granularity, paper/layout, autoPrint/copies, legacy cleanup, POS checkout,
payment/stock/accounting, or totals recalculation changes. Remaining gaps:
drag/drop deferred; barcode/QR controls deferred; VAT granularity deferred;
paper/layout controls deferred; autoPrint/copies deferred; legacy cleanup
deferred; broader a11y cleanup deferred.)

Previous marker:
Phase 20.1-Fix — Invoice Branch Print Toggle
(follows Phase 20.1 audit. Added fields.invoiceBranch to the Print Builder
field visibility config, defaulting true. InvoicePrintViewModel now exposes
document.branch from invoice.branch only; no fallback to company.branchName, so
prints do not invent or substitute the operational branch. Luxury, Compact,
Minimal, and Thermal templates render Branch / الفرع near invoice metadata when
the field is enabled and the invoice branch exists. Updated verify scripts for
ViewModel source/no-fallback behavior and Builder/template config defaults. No
barcode/QR, VAT granularity, paper/layout, backend/DB/API/migration, POS submit,
payment/stock/accounting, or totals recalculation changes. Remaining gaps:
barcode/QR controls deferred; VAT granularity deferred; paper/layout controls
deferred; custom text blocks not started; autoPrint/copies deferred; legacy
cleanup deferred; broader a11y cleanup deferred.)

Previous marker:
Phase 19Z-Fix — Static Favicon + Company Logo Favicon
(follows 19Z audit. Added a static public/favicon.ico fallback so /favicon.ico no longer
404s before auth loads. Added a client-side CompanyFaviconUpdater mounted once in AppShell;
it uses company.logo from Company Profile via getPublicFileUrl and falls back to /favicon.ico
when no company logo is available or after logout/no company. Future custom favicon precedence
is left as a code comment only; no custom favicon upload/settings key added. No backend/DB/API/
migration changes; no print/POS/business logic changes. Remaining gaps: custom favicon upload
not added; favicon shape/quality depends on the company logo; browser favicon caching may require
hard refresh; custom text blocks not started; autoPrint/copies deferred; legacy receipt cleanup
deferred; broader a11y cleanup deferred.)

Previous marker:
Phase 19Y.8 — Duplicate POS Receipt Controls Cleanup
(follows 19Y.7 audit. Hid duplicate legacy POS/Receipt visibility controls plus
paperSize/layout from Settings -> Print & Invoice Design; kept visible shared messages
and receipt.defaultPosTemplate only. Added helper that visibility is controlled from
Invoice Print Builder below and legacy receipt options are preserved internally.
receiptForm/save payload still preserve hidden legacy values. Active POS print remains
InvoicePrintOptionsDialog -> InvoiceDocument; no backend/DB/API/migration; no data
deletion; no legacy component deletion; no autoPrint/copies; no POS submit/payment/
stock/accounting changes; no totals recalculation. Next: optional missing builder controls
audit or autoPrint/copies audit only in separate phase.)

Previous marker:
Phase 19Y.6 — Persist POS Default Print Template
(follows 19Y.3 + 19Y.5 audit. Added persisted POS default template under existing
receipt.defaultPosTemplate; Settings -> Print & Invoice Design now has POS Print Behavior
default-template select. POS print dialog seeds Auto/Bilingual plus saved template, Thermal
fallback; in-dialog template changes are temporary and not auto-saved. No new settings key;
no backend/DB/API/migration; no autoPrint/copies; no legacy receipt deletion; no
POS submit/payment/stock/accounting changes; no totals recalculation. typecheck/lint/build ok;
all print verifies pass. Next: autoPrint/copies audit or legacy cleanup only in separate phase.)

Previous marker:
Phase 19Y.3 — POS Print Dialog with Template Selector & Live Preview
(follows 19Y.2 + receipt-form-field id/name a11y fix e038e44. POS post-checkout now opens
InvoicePrintOptionsDialog (extended with optional showPreview/previewCompany/previewSettings/previewLabels
— Sales unchanged) with a live InvoiceDocument preview, Thermal default; replaced the ReceiptPreview
modal (files retained). POS printInvoice mirrors Sales (InvoiceDocument → renderPrintDocument →
printHtmlDocument); company from auth/Company Profile; server totals only, no recalculation; print/close
never call postInvoice or mutate order/payment/stock/accounting. Frontend-only; no backend/DB/API; no
new settings key. typecheck/lint/build ok; all print verifies pass; POS label keys verified in en/ar.
Next: custom text blocks / favicon / default-template persistence — not started.)

Previous marker:
Phase 19Y.2 — Receipt Settings Cleanup & POS Company Data Source
(follows 19Y-Fix. Removed duplicate receipt.phone/vatNumber/address inputs + showVatNumber toggle
from the POS/Receipt settings card (values kept as legacy fallback, not deleted); added a "managed from
Company Profile" helper. ReceiptPrintTemplate + ReceiptPreview now use company (Company Profile) data
first for address/phone/TRN, receipt.* only as fallback; address formatted from structured company
fields; TRN gated by showTaxNumber. Pre-existing display-only subtotal reduce left intact; no totals
recalculation. Frontend-only; no backend/DB/API; receipt key/schema preserved; ReceiptPrintTemplate kept.
typecheck/lint/build ok; all print verifies pass. Next: 19Y.3 POS print dialog — not started.)

Previous marker:
Phase 19Y-Fix — Invoice Message Fields Across Templates
(follows 19X.2-G. Added vm.messages (welcomeMessage/headerNote/footerMessage/termsMessage) from the
existing receipt key; rendered across all four invoice templates gated by builder section toggles
(reused sections.terms; added welcomeMessage/headerNote/footerMessage toggles, default true).
Luxury no longer reads receiptConfig.termsMessage directly; terms now shows in Compact/Minimal/Thermal.
Relabeled the Settings messages area "Invoice & Receipt Messages". Plain text, escaped; invoice.notes
stays separate; POS receipt unchanged. No new key/backend/DB/migration; no custom text blocks.
typecheck/lint/build ok; VM + builder verifies extended and all print verifies pass. print-export E2E
not run (headless limitation). Next: 19Z custom text blocks / closing message — not started.)

Previous marker:
Phase 19X.2-G — Live Company Data in Invoice Preview
(follows 19X.2-F. Fixed the Settings builder preview to use LIVE company data via a memoized
livePreviewCompany — precedence Company Profile form state > auth company > FIXTURE_COMPANY demo
fallback — instead of the static FIXTURE_COMPANY. Fixture still supplies demo invoice/items/totals;
builder toggles/theme/template stay live; identity company-first (printInfo cannot override).
Single-file frontend fix (settings/page.tsx); no backend/DB/API; no financial logic.
typecheck/lint/build ok; print verifies pass. print-export E2E not run (headless limitation).
Next: 19Y invoice messages — not started.)

Previous marker:
Phase 19X.2-F — Company Address Wiring
(follows 19X.2-C/D/E. Wired official company address (existing DB columns country/city/region/
address1/address2/postalCode/commercialRegister) into Company Profile + print. Extended the
PATCH /settings whitelist with those existing columns (no migration); settings-context forwards them;
new Official Company Address UI section; VM formats company address (structured DB > printCompanyInfo.address
> receipt.address); PrintCompany + 4 templates + sales caller pass structured address. EGYPT = country,
not full address. Frontend + 1-line backend whitelist; no new columns/migration/data deletion.
typecheck/lint/build ok; node -c ok; VM verify extended + all print verifies pass. print-export E2E
not run (headless limitation). Next: 19Y invoice messages — not started.)

Previous marker:
Phase 19X.2-C/D/E — Company Profile Contact Wiring + Print Source Cleanup
(follows 19X.2-B; dev migration applied. Company Profile now edits/saves phone/email/website + TRN
persistence fix via PATCH /settings; auth/PrintCompany/AppSettings types gained phone/email/website;
sales print caller + all four templates pass DB company contact into the VM (removed receiptConfig
injection). ViewModel precedence: identity company-only (printCompanyInfo.displayName/taxNumber
ignored), contact company→printCompanyInfo→receipt. Removed the duplicate Company Print Info card;
printCompanyInfo key/schema kept as fallback. Frontend-only; no backend/DB/API changes; no data
deletion. typecheck/lint/build ok; VM verify rewritten (company-wins + fallbacks) + all print
verifies pass. print-export E2E not run (headless limitation). Next: optional DB address wiring /
19Y invoice messages — not started.)
```

After this file is committed, future agents must update this section when they complete a phase.
