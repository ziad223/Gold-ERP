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
import {
  formatLocalizedText,
  LocalizedPrintLabel,
} from "@/features/printing/components/LocalizedPrintLabel";
import { CustomPrintTextBlocks } from "@/features/printing/components/CustomPrintTextBlocks";

/**
 * Minimal A4 invoice template (Phase 19I).
 *
 * A clean, white, low-decoration A4 layout — more spacious than Compact, less
 * ornate than Luxury Gold. It renders the SAME data from the same
 * `InvoicePrintViewModel` and honours the same `templateConfig`
 * (theme/language/sections/fields) and display-only `documentTitleOverride`.
 * Presentation only: no VAT/subtotal/total/payment/stock recomputation — every
 * value comes from the ViewModel.
 */

const minimalInvoiceStyles = `
  @page { size: A4; margin: 0; }
  html, body { margin: 0; padding: 0; }
  .minimal-invoice {
    --invoice-gold: #af842f;
    --invoice-gold-dark: #7c5a18;
    --invoice-gold-soft: #f6edd7;
    --invoice-gold-line: rgba(175, 132, 47, 0.5);
    --invoice-text: #231f18;
    --invoice-muted: #6e6149;
    --invoice-ivory: #fffdf7;
    --invoice-font: "Times New Roman", "Noto Naskh Arabic", "Arial", serif;
    --invoice-title-font: "Times New Roman", "Noto Naskh Arabic", "Arial", serif;
    --minimal-line: #d9d3c6;
    --minimal-soft: #f4f2ec;
    position: relative;
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 16mm 15mm 12mm;
    background: #ffffff;
    color: var(--invoice-text);
    font-family: var(--invoice-font);
    direction: ltr;
    font-size: 10.5px;
    line-height: 1.4;
  }
  .minimal-ar { direction: rtl; unicode-bidi: isolate; }
  .minimal-en { direction: ltr; unicode-bidi: isolate; }
  .minimal-header {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 6mm;
    padding-bottom: 5mm;
    border-bottom: 1px solid var(--invoice-text);
  }
  .minimal-logo-wrap { width: 18mm; height: 18mm; display: grid; place-items: center; overflow: hidden; }
  .minimal-logo { width: 100%; height: 100%; object-fit: contain; }
  .minimal-initials { font-size: 14px; font-weight: 800; color: var(--invoice-text); letter-spacing: 0.05em; }
  .minimal-brand { min-width: 0; }
  .minimal-brand-name {
    margin: 0; font-family: var(--invoice-title-font);
    font-size: 20px; font-weight: 800; letter-spacing: 0.05em; line-height: 1.1;
    text-transform: uppercase; color: var(--invoice-text); overflow-wrap: anywhere;
  }
  .minimal-brand-ar { margin: 1mm 0 0; color: var(--invoice-muted); font-size: 11px; direction: rtl; unicode-bidi: isolate; }
  .minimal-doc { text-align: end; min-width: 42mm; }
  .minimal-doc-title { margin: 0; font-size: 14px; font-weight: 800; letter-spacing: 0.05em; color: var(--invoice-text); }
  .minimal-doc-trn { margin: 1.4mm 0 0; color: var(--invoice-muted); font-size: 9.5px; }
  .minimal-meta {
    display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8mm;
    margin-top: 6mm;
  }
  .minimal-meta-title {
    margin: 0 0 1.5mm; padding-bottom: 1mm;
    font-size: 9px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--invoice-muted); border-bottom: 1px solid var(--minimal-line);
    display: flex; justify-content: space-between; gap: 8px;
  }
  .minimal-row {
    display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4mm;
    padding: 0.9mm 0; font-size: 10px;
  }
  .minimal-row-label { color: var(--invoice-muted); overflow-wrap: anywhere; }
  .minimal-row-value { font-weight: 700; text-align: end; overflow-wrap: anywhere; }
  .minimal-table-wrap { margin-top: 7mm; }
  .minimal-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10px; direction: ltr; }
  .minimal-table thead { display: table-header-group; }
  .minimal-table tr { break-inside: avoid; page-break-inside: avoid; }
  .minimal-table th {
    border-bottom: 1.5px solid var(--invoice-text);
    padding: 2mm 1.5mm; font-weight: 800; text-align: center; line-height: 1.25;
    color: var(--invoice-text);
  }
  .minimal-table td {
    border-bottom: 1px solid var(--minimal-line);
    padding: 2mm 1.5mm; text-align: center; vertical-align: middle;
    overflow-wrap: anywhere; line-height: 1.3;
  }
  .minimal-table .minimal-desc { text-align: start; }
  .minimal-asset-line { color: var(--invoice-muted); font-size: 8.6px; margin-top: 0.5mm; }
  .minimal-summary {
    display: grid; grid-template-columns: minmax(0, 1fr) minmax(66mm, 0.75fr);
    gap: 8mm; margin-top: 6mm; align-items: start;
  }
  .minimal-pay-list { list-style: none; margin: 0; padding: 0; }
  .minimal-pay-list li {
    display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4mm;
    padding: 1mm 0; border-bottom: 1px solid var(--minimal-line); font-size: 10px;
  }
  .minimal-pay-list li:last-child { border-bottom: 0; }
  .minimal-amounts .minimal-row { border-bottom: 1px solid var(--minimal-line); padding: 1.4mm 0; }
  .minimal-amounts .minimal-row:last-child { border-bottom: 0; }
  .minimal-total { border-top: 1.5px solid var(--invoice-text) !important; }
  .minimal-total .minimal-row-label, .minimal-total .minimal-row-value {
    font-size: 12px; font-weight: 800; color: var(--invoice-text);
  }
  .minimal-special { margin-top: 6mm; }
  .minimal-notes { margin-top: 6mm; }
  .minimal-notes-title { font-size: 9px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--invoice-muted); }
  .minimal-notes-lines { margin-top: 1.5mm; padding: 2mm 0; font-size: 10px; white-space: pre-line; border-top: 1px solid var(--minimal-line); }
  .minimal-signatures {
    display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8mm; margin-top: 12mm;
  }
  .minimal-signature {
    min-height: 12mm; display: flex; align-items: end; justify-content: center;
    border-top: 1px solid var(--invoice-text);
    color: var(--invoice-muted); font-size: 9px; font-weight: 700; text-align: center; padding-top: 1mm;
  }
  .minimal-footer {
    margin-top: 8mm; padding-top: 3mm; border-top: 1px solid var(--minimal-line);
    display: flex; flex-wrap: wrap; justify-content: center; gap: 6mm;
    color: var(--invoice-muted); font-size: 9px; text-align: center;
  }
  @media print {
    .minimal-invoice { color-adjust: exact; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .minimal-meta, .minimal-summary, .minimal-signatures { break-inside: avoid; page-break-inside: avoid; }
  }
`;

export function MinimalInvoicePrintTemplate({
  invoice,
  company,
  cashierName,
  locale,
  settings,
  viewModel,
  templateConfig,
  documentTitleOverride,
}: InvoicePrintTemplateProps) {
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
    templateId: "minimal",
    locale,
    currency,
    getPublicFileUrl,
  });

  const tpl = resolveInvoicePrintTemplateConfig(templateConfig);
  const showAr = shouldShowArabic(tpl);
  const showEn = shouldShowEnglish(tpl);
  const themeVars = {
    "--invoice-gold": tpl.theme.gold,
    "--invoice-gold-dark": tpl.theme.goldDark,
    "--invoice-gold-soft": tpl.theme.goldSoft,
    "--invoice-text": tpl.theme.text,
    "--invoice-muted": tpl.theme.muted,
    "--invoice-ivory": tpl.theme.ivory,
    "--invoice-font": tpl.theme.fontFamily,
    "--invoice-title-font": tpl.theme.titleFontFamily,
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
  const assetIdLabel = formatLocalizedText({ en: "Asset ID", ar: "رقم القطعة", showEnglish: showEn, showArabic: showAr });
  const footerItems = [
    tpl.fields.footerPhone ? vm.company.phone : undefined,
    tpl.fields.footerAddress ? vm.company.address : undefined,
    tpl.fields.footerEmail ? vm.company.email : undefined,
  ].filter((v): v is string => Boolean(v));
  const customBlocks = tpl.sections.customTextBlocks ? vm.customTextBlocksByPlacement : {};

  return (
    <article className="print-document print-page minimal-invoice" data-print-root style={themeVars}>
      <style>{minimalInvoiceStyles}</style>

      {tpl.sections.header && (
        <section className="minimal-header">
          <div className="minimal-logo-wrap">
            {tpl.fields.companyLogo && vm.company.logoUrl ? (
              <img className="minimal-logo" src={vm.company.logoUrl} alt={companyNameEn} />
            ) : (
              <span className="minimal-initials">{companyInitials}</span>
            )}
          </div>
          <div className="minimal-brand">
            {showEn && <h1 className="minimal-brand-name">{companyNameEn}</h1>}
            {showAr && <p className="minimal-brand-ar">{companyNameAr}</p>}
          </div>
          <div className="minimal-doc">
            {showEn && <p className="minimal-doc-title minimal-en">{documentTitleEn}</p>}
            {showAr && <p className="minimal-doc-title minimal-ar">{documentTitleAr}</p>}
            {tpl.fields.companyTrn && <p className="minimal-doc-trn">{trnLabel}: {text(vm.company.trn)}</p>}
          </div>
        </section>
      )}

      {tpl.sections.welcomeMessage && vm.messages.welcomeMessage && (
        <p style={{ textAlign: "center", whiteSpace: "pre-line", margin: "1.5mm 0", fontWeight: 600 }}>{vm.messages.welcomeMessage}</p>
      )}
      {tpl.sections.headerNote && vm.messages.headerNote && (
        <p style={{ textAlign: "center", whiteSpace: "pre-line", margin: "0 0 1.5mm", fontSize: "0.9em", color: "#555" }}>{vm.messages.headerNote}</p>
      )}
      <CustomPrintTextBlocks blocks={customBlocks.afterHeader} />

      {(tpl.sections.clientDetails || tpl.sections.invoiceDetails) && (
        <section className="minimal-meta">
          {tpl.sections.clientDetails && (
            <div>
              <SectionTitle en="Client Details" ar="بيانات العميل" showEnglish={showEn} showArabic={showAr} />
              <Row labelEn="Customer Name" labelAr="اسم العميل" value={text(vm.customer.name)} showEnglish={showEn} showArabic={showAr} />
              {tpl.fields.customerPhone && <Row labelEn="Mobile Number" labelAr="رقم الهاتف" value={text(vm.customer.phone)} showEnglish={showEn} showArabic={showAr} />}
              {tpl.fields.customerTrn && <Row labelEn="Customer TRN" labelAr="الرقم الضريبي" value={text(vm.customer.trn)} showEnglish={showEn} showArabic={showAr} />}
              {tpl.fields.customerAddress && <Row labelEn="Address" labelAr="العنوان" value={text(vm.customer.address)} showEnglish={showEn} showArabic={showAr} />}
            </div>
          )}
          {tpl.sections.invoiceDetails && (
            <div>
              <SectionTitle en="Invoice Details" ar="بيانات الفاتورة" showEnglish={showEn} showArabic={showAr} />
              <Row labelEn="Invoice No." labelAr="رقم الفاتورة" value={text(vm.document.number)} showEnglish={showEn} showArabic={showAr} />
              <Row labelEn="Invoice Date" labelAr="تاريخ الفاتورة" value={text(vm.document.date)} showEnglish={showEn} showArabic={showAr} />
              {tpl.fields.invoiceBranch && vm.document.branch && (
                <Row labelEn="Branch" labelAr="الفرع" value={text(vm.document.branch)} showEnglish={showEn} showArabic={showAr} />
              )}
              <Row labelEn="Type" labelAr="النوع" value={documentTypeLabel} showEnglish={showEn} showArabic={showAr} />
              <Row labelEn="Status" labelAr="الحالة" value={text(vm.document.status)} showEnglish={showEn} showArabic={showAr} />
              {tpl.fields.originalInvoiceRef && (vm.document.originalInvoiceNumber || vm.document.originalInvoiceId) && (
                <Row labelEn="Original Invoice" labelAr="الفاتورة الأصلية" value={text(vm.document.originalInvoiceNumber ?? vm.document.originalInvoiceId)} showEnglish={showEn} showArabic={showAr} />
              )}
              {cashierName && tpl.fields.salesperson && <Row labelEn="Salesperson" labelAr="البائع" value={text(cashierName)} showEnglish={showEn} showArabic={showAr} />}
            </div>
          )}
        </section>
      )}
      <CustomPrintTextBlocks blocks={customBlocks.afterInvoiceDetails} />
      <CustomPrintTextBlocks blocks={customBlocks.beforeItems} />

      {tpl.sections.itemsTable && (
        <section className="minimal-table-wrap">
          <table className="minimal-table">
            <thead>
              <tr>
                <th style={{ width: "9mm" }}>#</th>
                <th className="minimal-desc"><LocalizedPrintLabel en="Item Description" ar="وصف القطعة" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="minimal-en" arabicClassName="minimal-ar" /></th>
                <th style={{ width: "17mm" }}><LocalizedPrintLabel en="Karat" ar="العيار" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="minimal-en" arabicClassName="minimal-ar" /></th>
                <th style={{ width: "18mm" }}><LocalizedPrintLabel en="Weight (g)" ar="الوزن" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="minimal-en" arabicClassName="minimal-ar" /></th>
                <th style={{ width: "12mm" }}><LocalizedPrintLabel en="Qty" ar="الكمية" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="minimal-en" arabicClassName="minimal-ar" /></th>
                <th style={{ width: "23mm" }}><LocalizedPrintLabel en="Net" ar="الصافي" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="minimal-en" arabicClassName="minimal-ar" /></th>
                <th style={{ width: "23mm" }}><LocalizedPrintLabel en="VAT" ar="الضريبة" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="minimal-en" arabicClassName="minimal-ar" /></th>
                <th style={{ width: "25mm" }}><LocalizedPrintLabel en="Total" ar="الإجمالي" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="minimal-en" arabicClassName="minimal-ar" /></th>
              </tr>
            </thead>
            <tbody>
              {vm.items.map((item) => (
                <tr key={`${item.id ?? item.assetId ?? item.index}-${item.index}`}>
                  <td>{text(item.index)}</td>
                  <td className="minimal-desc">
                    <strong>{text(item.description)}</strong>
                    {item.assetId && tpl.fields.itemAssetId && <div className="minimal-asset-line">{assetIdLabel}: {text(item.assetId)}</div>}
                  </td>
                  <td>{text(item.karat)}</td>
                  <td>{text(item.weight)}</td>
                  <td>{text(item.quantity)}</td>
                  <td>{money(item.netAmount)}</td>
                  <td>{money(item.vatAmount)}</td>
                  <td>{money(item.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      <CustomPrintTextBlocks blocks={customBlocks.afterItems} />

      {tpl.sections.specialSummary && vm.special?.exchange && (
        <section className="minimal-special">
          <SectionTitle en="Exchange Summary" ar="ملخص الاستبدال" showEnglish={showEn} showArabic={showAr} />
          <Row labelEn="Difference" labelAr="الفرق" value={money(vm.special.exchange.difference)} showEnglish={showEn} showArabic={showAr} />
        </section>
      )}

      {(tpl.sections.paymentMethod || tpl.sections.amountDetails) && (
        <section className="minimal-summary">
          {tpl.sections.paymentMethod && (
            <div>
              <SectionTitle en="Payment" ar="الدفع" showEnglish={showEn} showArabic={showAr} />
              <ul className="minimal-pay-list">
                {vm.payments.map((payment, index) => (
                  <li key={`${payment.method}-${index}`}>
                    <span>{formatLocalizedText({ en: payment.methodLabelEn, ar: payment.methodLabelAr, showEnglish: showEn, showArabic: showAr, separator: " / " })}</span>
                    <strong>{payment.amount === undefined ? "—" : money(payment.amount)}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tpl.sections.amountDetails && (
            <div className="minimal-amounts">
              <SectionTitle en="Amount Details" ar="تفاصيل المبلغ" showEnglish={showEn} showArabic={showAr} />
              <Row labelEn="Net / Subtotal" labelAr="الصافي" value={money(vm.totals.subtotal)} showEnglish={showEn} showArabic={showAr} />
              <Row labelEn="Discount" labelAr="الخصم" value={money(vm.totals.discount)} showEnglish={showEn} showArabic={showAr} />
              <Row labelEn="VAT Rate" labelAr="نسبة الضريبة" value={percent(vm.totals.vatRate)} showEnglish={showEn} showArabic={showAr} />
              <Row labelEn="VAT Amount" labelAr="قيمة الضريبة" value={money(vm.totals.vatAmount)} showEnglish={showEn} showArabic={showAr} />
              <Row labelEn="Total" labelAr="الإجمالي" value={money(vm.totals.totalAmount)} isTotal showEnglish={showEn} showArabic={showAr} />
              <Row labelEn="Paid" labelAr="المدفوع" value={money(vm.totals.paidAmount)} showEnglish={showEn} showArabic={showAr} />
              <Row labelEn="Remaining" labelAr="المتبقي" value={money(vm.totals.remainingAmount)} showEnglish={showEn} showArabic={showAr} />
            </div>
          )}
        </section>
      )}
      <CustomPrintTextBlocks blocks={customBlocks.afterTotals} />

      {tpl.sections.notes && vm.notes && (
        <section className="minimal-notes">
          <p className="minimal-notes-title"><LocalizedPrintLabel en="Notes" ar="ملاحظات" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="minimal-en" arabicClassName="minimal-ar" /></p>
          <div className="minimal-notes-lines">{vm.notes}</div>
        </section>
      )}

      {tpl.sections.terms && vm.messages.termsMessage && (
        <section className="minimal-notes">
          <p className="minimal-notes-title"><LocalizedPrintLabel en="Terms" ar="الشروط والأحكام" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="minimal-en" arabicClassName="minimal-ar" /></p>
          <div className="minimal-notes-lines" style={{ whiteSpace: "pre-line" }}>{vm.messages.termsMessage}</div>
        </section>
      )}

      <CustomPrintTextBlocks blocks={customBlocks.beforeFooter} />

      {tpl.sections.footerMessage && vm.messages.footerMessage && (
        <p style={{ textAlign: "center", whiteSpace: "pre-line", margin: "1.5mm 0", fontSize: "0.9em", color: "#555" }}>{vm.messages.footerMessage}</p>
      )}

      <CustomPrintTextBlocks blocks={customBlocks.beforeSignatures} />

      {tpl.sections.signatures && (
        <section className="minimal-signatures">
          <div className="minimal-signature"><LocalizedPrintLabel en="Customer" ar="العميل" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="minimal-en" arabicClassName="minimal-ar" /></div>
          <div className="minimal-signature"><LocalizedPrintLabel en="Company Stamp" ar="ختم الشركة" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="minimal-en" arabicClassName="minimal-ar" /></div>
          <div className="minimal-signature"><LocalizedPrintLabel en="Salesperson" ar="المبيعات" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="minimal-en" arabicClassName="minimal-ar" /></div>
        </section>
      )}

      {tpl.sections.footer && footerItems.length > 0 && (
        <footer className="minimal-footer">
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
    <p className="minimal-meta-title">
      <LocalizedPrintLabel
        en={en}
        ar={ar}
        showEnglish={showEnglish}
        showArabic={showArabic}
        separator=""
        englishClassName="minimal-en"
        arabicClassName="minimal-ar"
      />
    </p>
  );
}

function Row({
  labelEn,
  labelAr,
  value,
  showEnglish,
  showArabic,
  isTotal = false,
}: {
  labelEn: string;
  labelAr: string;
  value: string;
  showEnglish: boolean;
  showArabic: boolean;
  isTotal?: boolean;
}) {
  return (
    <div className={`minimal-row${isTotal ? " minimal-total" : ""}`}>
      <LocalizedPrintLabel
        en={labelEn}
        ar={labelAr}
        showEnglish={showEnglish}
        showArabic={showArabic}
        className="minimal-row-label"
        englishClassName="minimal-en"
        arabicClassName="minimal-ar"
      />
      <span className="minimal-row-value">{value}</span>
    </div>
  );
}
