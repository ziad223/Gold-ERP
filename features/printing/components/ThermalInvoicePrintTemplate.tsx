import type { CSSProperties } from "react";
import { getPublicFileUrl } from "@/lib/api/files";
import { formatAppMoney } from "@/lib/formatters/currency";
import { toEnglishDigits } from "@/lib/formatters/numbers";
import { buildInvoicePrintViewModel } from "@/features/printing/lib/invoice-print-view-model";
import {
  resolveInvoicePrintTemplateConfig,
  shouldShowArabic,
  shouldShowEnglish,
} from "@/features/printing/lib/print-template-config";
import type { InvoicePrintTemplateProps } from "@/features/printing/components/InvoicePrintTemplate";
import { ExchangePrintSummary } from "@/features/printing/components/ExchangePrintSummary";
import {
  formatLocalizedText,
  LocalizedPrintLabel,
} from "@/features/printing/components/LocalizedPrintLabel";
import { CustomPrintTextBlocks } from "@/features/printing/components/CustomPrintTextBlocks";

/**
 * Thermal receipt-style invoice template (Phase 19J).
 *
 * A narrow (~80mm), monochrome, low-decoration receipt layout. Still an INVOICE
 * print template (not POS/business logic). Renders the SAME data from the same
 * `InvoicePrintViewModel` and honours the same `templateConfig`
 * (theme/language/sections/fields) and display-only `documentTitleOverride`.
 * Presentation only: no VAT/subtotal/total/payment/stock recomputation — every
 * value comes from the ViewModel.
 */

const thermalInvoiceStyles = `
  @page { size: 80mm auto; margin: 0; }
  html, body { margin: 0; padding: 0; }
  .thermal-invoice {
    --invoice-text: #1c1a15;
    --invoice-muted: #55503f;
    --thermal-line: #b9b3a4;
    --thermal-font: "Consolas", "Menlo", "DejaVu Sans Mono", "Noto Naskh Arabic", monospace;
    width: 80mm;
    max-width: 80mm;
    margin: 0 auto;
    padding: 4mm 4.5mm 6mm;
    background: #ffffff;
    color: var(--invoice-text);
    font-family: var(--thermal-font);
    direction: ltr;
    font-size: 9px;
    line-height: 1.42;
  }
  .thermal-ar { direction: rtl; unicode-bidi: isolate; }
  .thermal-en { direction: ltr; unicode-bidi: isolate; }
  .thermal-center { text-align: center; }
  .thermal-header { text-align: center; padding-bottom: 2mm; }
  .thermal-logo-wrap { display: flex; justify-content: center; }
  .thermal-logo { width: 16mm; height: 16mm; object-fit: contain; margin-bottom: 1.5mm; }
  .thermal-initials { font-size: 15px; font-weight: 800; letter-spacing: 0.08em; }
  .thermal-name { margin: 0; font-size: 13px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; overflow-wrap: anywhere; }
  .thermal-name-ar { margin: 0.6mm 0 0; font-size: 10px; color: var(--invoice-muted); direction: rtl; unicode-bidi: isolate; }
  .thermal-doc-title { margin: 1.6mm 0 0; font-size: 11px; font-weight: 800; }
  .thermal-trn { margin: 0.8mm 0 0; font-size: 8.4px; color: var(--invoice-muted); }
  .thermal-rule { border: 0; border-top: 1px dashed var(--thermal-line); margin: 2mm 0; }
  .thermal-line-row {
    display: flex; justify-content: space-between; gap: 3mm; padding: 0.5mm 0; font-size: 8.8px;
  }
  .thermal-line-row .thermal-label { color: var(--invoice-muted); overflow-wrap: anywhere; }
  .thermal-line-row .thermal-value { font-weight: 700; text-align: end; overflow-wrap: anywhere; }
  .thermal-section-title { margin: 0 0 1mm; font-size: 8.4px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--invoice-muted); }
  .thermal-item { padding: 1mm 0; border-bottom: 1px dotted var(--thermal-line); }
  .thermal-item:last-child { border-bottom: 0; }
  .thermal-item-name { font-weight: 700; overflow-wrap: anywhere; }
  .thermal-item-sub { display: flex; justify-content: space-between; gap: 3mm; margin-top: 0.4mm; font-size: 8.2px; color: var(--invoice-muted); }
  .thermal-item-total { font-weight: 800; color: var(--invoice-text); }
  .thermal-item-meta { overflow-wrap: anywhere; }
  .thermal-totals .thermal-line-row { font-size: 9px; padding: 0.6mm 0; }
  .thermal-grand { border-top: 1px solid var(--invoice-text); margin-top: 1mm; padding-top: 1mm; }
  .thermal-grand .thermal-label, .thermal-grand .thermal-value { font-size: 11px; font-weight: 800; color: var(--invoice-text); }
  .thermal-signatures { margin-top: 5mm; display: grid; gap: 4mm; }
  .thermal-signature { border-top: 1px solid var(--invoice-text); padding-top: 1mm; text-align: center; font-size: 8.4px; color: var(--invoice-muted); }
  .thermal-footer { margin-top: 3mm; text-align: center; font-size: 8.2px; color: var(--invoice-muted); }
  .thermal-footer span { display: block; overflow-wrap: anywhere; }
  @media print {
    .thermal-invoice { color-adjust: exact; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

export function ThermalInvoicePrintTemplate({
  invoice,
  company,
  cashierName,
  locale,
  settings,
  viewModel,
  templateConfig,
  documentTitleOverride,
  exchangeDisplay,
}: InvoicePrintTemplateProps) {
  // Phase 30.7-Fix — customer-safe exchange print (suppress raw negative rows/totals).
  const isExchange = invoice.type === "exchange";
  const precision = settings?.decimalPrecision ?? 2;
  const currency = settings?.currency ?? company.currency ?? "AED";
  const vm = viewModel ?? buildInvoicePrintViewModel(invoice, {
    company: {
      businessName: company.name,
      logo: company.logo,
      taxNumber: company.trn,
      phone: company.phone,
      email: company.email,
      website: company.website,
      country: company.country,
      city: company.city,
      region: company.region,
      address1: company.address1,
      address2: company.address2,
      postalCode: company.postalCode,
    },
    settings,
    templateId: "thermal",
    locale,
    currency,
    getPublicFileUrl,
  });

  const tpl = resolveInvoicePrintTemplateConfig(templateConfig);
  const showAr = shouldShowArabic(tpl);
  const showEn = shouldShowEnglish(tpl);
  // Thermal is monochrome; only the text/muted colours follow the theme config.
  const themeVars = {
    "--invoice-text": tpl.theme.text,
    "--invoice-muted": tpl.theme.muted,
  } as CSSProperties;

  const money = (value: number | undefined) => (value === undefined ? "—" : formatAppMoney(value, vm.totals.currency ?? currency, precision));
  const text = (value: string | number | undefined | null) => {
    if (value === undefined || value === null || String(value).trim() === "") return "—";
    return toEnglishDigits(String(value));
  };
  const percent = (value: number | undefined) => (value === undefined ? "—" : `${toEnglishDigits(value)}%`);

  const companyNameEn = vm.company.nameEn ?? vm.company.displayName ?? vm.company.nameAr ?? company.name ?? "—";
  const companyNameAr = vm.company.nameAr ?? vm.company.displayName ?? vm.company.nameEn ?? company.name ?? "—";
  const companyInitials = (companyNameEn.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("")) || "—";
  const documentTitleAr = documentTitleOverride?.titleAr ?? vm.document.titleAr;
  const documentTitleEn = documentTitleOverride?.titleEn ?? vm.document.titleEn;
  const documentTypeLabel = formatLocalizedText({
    en: documentTitleEn,
    ar: documentTitleAr,
    showEnglish: showEn,
    showArabic: showAr,
    separator: " / ",
  });
  const trnLabel = formatLocalizedText({ en: "TRN", ar: "الرقم الضريبي", showEnglish: showEn, showArabic: showAr });
  const qtyLabel = formatLocalizedText({ en: "Qty", ar: "الكمية", showEnglish: showEn, showArabic: showAr });
  const karatLabel = formatLocalizedText({ en: "Karat", ar: "العيار", showEnglish: showEn, showArabic: showAr });
  const weightLabel = formatLocalizedText({ en: "Weight", ar: "الوزن", showEnglish: showEn, showArabic: showAr });
  const assetIdLabel = formatLocalizedText({ en: "Asset ID", ar: "رقم القطعة", showEnglish: showEn, showArabic: showAr });
  const footerItems = [
    tpl.fields.footerPhone ? vm.company.phone : undefined,
    tpl.fields.footerAddress ? vm.company.address : undefined,
    tpl.fields.footerEmail ? vm.company.email : undefined,
  ].filter((v): v is string => Boolean(v));
  const customBlocks = tpl.sections.customTextBlocks ? vm.customTextBlocksByPlacement : {};

  return (
    <article className="print-document print-page thermal-invoice" data-print-root style={themeVars}>
      <style>{thermalInvoiceStyles}</style>

      {tpl.sections.header && (
        <section className="thermal-header">
          {tpl.fields.companyLogo && vm.company.logoUrl ? (
            <span className="thermal-logo-wrap"><img className="thermal-logo" src={vm.company.logoUrl} alt={companyNameEn} /></span>
          ) : (
            <div className="thermal-initials">{companyInitials}</div>
          )}
          {showEn && <p className="thermal-name">{companyNameEn}</p>}
          {showAr && <p className="thermal-name-ar">{companyNameAr}</p>}
          {showEn && <p className="thermal-doc-title thermal-en">{documentTitleEn}</p>}
          {showAr && <p className="thermal-doc-title thermal-ar">{documentTitleAr}</p>}
          {tpl.fields.companyTrn && <p className="thermal-trn">{trnLabel}: {text(vm.company.trn)}</p>}
        </section>
      )}

      {tpl.sections.welcomeMessage && vm.messages.welcomeMessage && (
        <p style={{ textAlign: "center", whiteSpace: "pre-line", fontSize: "8.6px", fontWeight: 700, margin: "1mm 0" }}>{vm.messages.welcomeMessage}</p>
      )}
      {tpl.sections.headerNote && vm.messages.headerNote && (
        <p style={{ textAlign: "center", whiteSpace: "pre-line", fontSize: "8.2px", margin: "0 0 1mm" }}>{vm.messages.headerNote}</p>
      )}
      <CustomPrintTextBlocks blocks={customBlocks.afterHeader} compact />

      {tpl.sections.invoiceDetails && (
        <>
          <hr className="thermal-rule" />
          <div>
            <LineRow labelEn="Invoice No." labelAr="رقم الفاتورة" value={text(vm.document.number)} showEnglish={showEn} showArabic={showAr} />
            <LineRow labelEn="Date" labelAr="التاريخ" value={text(vm.document.date)} showEnglish={showEn} showArabic={showAr} />
            {tpl.fields.invoiceBranch && vm.document.branch && (
              <LineRow labelEn="Branch" labelAr="الفرع" value={text(vm.document.branch)} showEnglish={showEn} showArabic={showAr} />
            )}
            <LineRow labelEn="Type" labelAr="النوع" value={documentTypeLabel} showEnglish={showEn} showArabic={showAr} />
            {vm.document.status && <LineRow labelEn="Status" labelAr="الحالة" value={text(vm.document.status)} showEnglish={showEn} showArabic={showAr} />}
            {tpl.fields.originalInvoiceRef && (vm.document.originalInvoiceNumber || vm.document.originalInvoiceId) && (
              <LineRow labelEn="Original Inv." labelAr="الفاتورة الأصلية" value={text(vm.document.originalInvoiceNumber ?? vm.document.originalInvoiceId)} showEnglish={showEn} showArabic={showAr} />
            )}
            {cashierName && tpl.fields.salesperson && <LineRow labelEn="Salesperson" labelAr="البائع" value={text(cashierName)} showEnglish={showEn} showArabic={showAr} />}
          </div>
        </>
      )}
      <CustomPrintTextBlocks blocks={customBlocks.afterInvoiceDetails} compact />

      {tpl.sections.clientDetails && (
        <>
          <hr className="thermal-rule" />
          <div>
            <SectionTitle en="Client" ar="العميل" showEnglish={showEn} showArabic={showAr} />
            <LineRow labelEn="Name" labelAr="الاسم" value={text(vm.customer.name)} showEnglish={showEn} showArabic={showAr} />
            {tpl.fields.customerPhone && <LineRow labelEn="Mobile" labelAr="الهاتف" value={text(vm.customer.phone)} showEnglish={showEn} showArabic={showAr} />}
            {tpl.fields.customerTrn && <LineRow labelEn="TRN" labelAr="الرقم الضريبي" value={text(vm.customer.trn)} showEnglish={showEn} showArabic={showAr} />}
          </div>
        </>
      )}
      <CustomPrintTextBlocks blocks={customBlocks.beforeItems} compact />

      {isExchange && (
        <ExchangePrintSummary exchangeDisplay={exchangeDisplay ?? null} locale={locale} currency={currency} variant="thermal" />
      )}
      {tpl.sections.itemsTable && !isExchange && (
        <>
          <hr className="thermal-rule" />
          <div>
            <SectionTitle en="Items" ar="الأصناف" showEnglish={showEn} showArabic={showAr} />
            {vm.items.map((item) => (
              <div className="thermal-item" key={`${item.id ?? item.assetId ?? item.index}-${item.index}`}>
                <div className="thermal-item-name">{text(item.index)}. {text(item.description)}</div>
                <div className="thermal-item-sub">
                  <span className="thermal-item-meta">
                    {[
                      `${qtyLabel}: ${text(item.quantity)}`,
                      item.karat ? `${karatLabel}: ${text(item.karat)}` : undefined,
                      item.weight !== undefined ? `${weightLabel}: ${text(item.weight)}g` : undefined,
                      item.assetId && tpl.fields.itemAssetId ? `${assetIdLabel}: ${text(item.assetId)}` : undefined,
                    ].filter(Boolean).join(" • ")}
                  </span>
                  <span className="thermal-item-total">{money(item.totalAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <CustomPrintTextBlocks blocks={customBlocks.afterItems} compact />

      {tpl.sections.specialSummary && vm.special?.exchange && !isExchange && (
        <>
          <hr className="thermal-rule" />
          <LineRow labelEn="Exchange Difference" labelAr="فرق الاستبدال" value={money(vm.special.exchange.difference)} showEnglish={showEn} showArabic={showAr} />
        </>
      )}

      {tpl.sections.amountDetails && !isExchange && (
        <div className="thermal-totals">
          <hr className="thermal-rule" />
          <LineRow labelEn="Net / Subtotal" labelAr="الصافي" value={money(vm.totals.subtotal)} showEnglish={showEn} showArabic={showAr} />
          <LineRow labelEn="Discount" labelAr="الخصم" value={money(vm.totals.discount)} showEnglish={showEn} showArabic={showAr} />
          <LineRow labelEn="VAT Rate" labelAr="نسبة الضريبة" value={percent(vm.totals.vatRate)} showEnglish={showEn} showArabic={showAr} />
          <LineRow labelEn="VAT" labelAr="الضريبة" value={money(vm.totals.vatAmount)} showEnglish={showEn} showArabic={showAr} />
          <div className="thermal-grand"><LineRow labelEn="TOTAL" labelAr="الإجمالي" value={money(vm.totals.totalAmount)} showEnglish={showEn} showArabic={showAr} /></div>
          <LineRow labelEn="Paid" labelAr="المدفوع" value={money(vm.totals.paidAmount)} showEnglish={showEn} showArabic={showAr} />
          <LineRow labelEn="Remaining" labelAr="المتبقي" value={money(vm.totals.remainingAmount)} showEnglish={showEn} showArabic={showAr} />
        </div>
      )}

      {tpl.sections.paymentMethod && vm.payments.length > 0 && !isExchange && (
        <>
          <hr className="thermal-rule" />
          <SectionTitle en="Payment" ar="الدفع" showEnglish={showEn} showArabic={showAr} />
          {vm.payments.map((payment, index) => (
            <div className="thermal-line-row" key={`${payment.method}-${index}`}>
              <span className="thermal-label">{formatLocalizedText({ en: payment.methodLabelEn, ar: payment.methodLabelAr, showEnglish: showEn, showArabic: showAr, separator: " / " })}</span>
              <span className="thermal-value">{payment.amount === undefined ? "—" : money(payment.amount)}</span>
            </div>
          ))}
        </>
      )}
      <CustomPrintTextBlocks blocks={customBlocks.afterTotals} compact />

      {tpl.sections.notes && vm.notes && (
        <>
          <hr className="thermal-rule" />
          <SectionTitle en="Notes" ar="ملاحظات" showEnglish={showEn} showArabic={showAr} />
          <div style={{ whiteSpace: "pre-line", fontSize: "8.6px" }}>{vm.notes}</div>
        </>
      )}

      {tpl.sections.terms && vm.messages.termsMessage && (
        <>
          <hr className="thermal-rule" />
          <SectionTitle en="Terms" ar="الشروط والأحكام" showEnglish={showEn} showArabic={showAr} />
          <div style={{ whiteSpace: "pre-line", fontSize: "8.6px" }}>{vm.messages.termsMessage}</div>
        </>
      )}

      <CustomPrintTextBlocks blocks={customBlocks.beforeFooter} compact />

      {tpl.sections.footerMessage && vm.messages.footerMessage && (
        <p style={{ textAlign: "center", whiteSpace: "pre-line", fontSize: "8.2px", margin: "1mm 0" }}>{vm.messages.footerMessage}</p>
      )}

      <CustomPrintTextBlocks blocks={customBlocks.beforeSignatures} compact />

      {tpl.sections.signatures && (
        <div className="thermal-signatures">
          <div className="thermal-signature"><LocalizedPrintLabel en="Customer" ar="العميل" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="thermal-en" arabicClassName="thermal-ar" /></div>
          <div className="thermal-signature"><LocalizedPrintLabel en="Salesperson" ar="المبيعات" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="thermal-en" arabicClassName="thermal-ar" /></div>
        </div>
      )}

      {tpl.sections.footer && footerItems.length > 0 && (
        <footer className="thermal-footer">
          {footerItems.map((value) => (
            <span key={value}>{text(value)}</span>
          ))}
        </footer>
      )}
    </article>
  );
}

function SectionTitle({
  en,
  ar,
  showEnglish,
  showArabic,
}: {
  en: string;
  ar: string;
  showEnglish: boolean;
  showArabic: boolean;
}) {
  return (
    <p className="thermal-section-title">
      <LocalizedPrintLabel
        en={en}
        ar={ar}
        showEnglish={showEnglish}
        showArabic={showArabic}
        separator=" / "
        englishClassName="thermal-en"
        arabicClassName="thermal-ar"
      />
    </p>
  );
}

function LineRow({
  labelEn,
  labelAr,
  value,
  showEnglish,
  showArabic,
}: {
  labelEn: string;
  labelAr: string;
  value: string;
  showEnglish: boolean;
  showArabic: boolean;
}) {
  return (
    <div className="thermal-line-row">
      <LocalizedPrintLabel
        en={labelEn}
        ar={labelAr}
        showEnglish={showEnglish}
        showArabic={showArabic}
        className="thermal-label"
        englishClassName="thermal-en"
        arabicClassName="thermal-ar"
      />
      <span className="thermal-value">{value}</span>
    </div>
  );
}
