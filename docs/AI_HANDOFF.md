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

## 6. Current Next Phase

Next intended phase:

```text
19D — Wire Sales / Return / Exchange Print Data
```

Purpose:

* Frontend-only.
* Wire the new print ViewModel/template safely into sales, return, and exchange flows where approved.
* Keep print read-only.
* Preserve backend/source-of-truth totals.
* Do not recalculate financial truth.
* Do not modify backend unless a later phase explicitly exposes missing read-only print fields.

Expected candidate files for 19D:

* Existing sales/returns/exchanges print invocation files.
* `features/printing/*` only when needed for read-only print data wiring.

Do not touch in 19D unless explicitly approved:

* backend routes/models/services.
* migrations.
* posting/accounting/VAT/COGS logic.
* Search & Print route implementation.

---

## 7. Known Gaps / Deferred Work

Return/Exchange:

* Full line-level return/exchange history requires migration to store `originalInvoiceItemId`.
* Current double guard remains product-level and conservative.
* Partial return/exchange remains deferred.

Print/Search:

* No unified Search & Print route/filter layer yet.
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
19C-ALIGN — Exact Reference Layout Alignment
```

After this file is committed, future agents must update this section when they complete a phase.
