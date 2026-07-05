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

/**
 * Compact A4 invoice template (Phase 19H).
 *
 * A denser, low-decoration A4 alternative to the Luxury Gold template. It renders
 * the SAME data from the same `InvoicePrintViewModel` and honours the same
 * `templateConfig` (theme/language/sections/fields) and display-only
 * `documentTitleOverride`. Presentation only: it never recomputes VAT, subtotal,
 * total, payments, stock, or any invoice truth — every value comes from the
 * ViewModel.
 */

const compactInvoiceStyles = `
  @page { size: A4; margin: 0; }
  html, body { margin: 0; padding: 0; }
  .compact-invoice {
    --invoice-gold: #af842f;
    --invoice-gold-dark: #7c5a18;
    --invoice-gold-soft: #f6edd7;
    --invoice-gold-line: rgba(175, 132, 47, 0.5);
    --invoice-text: #231f18;
    --invoice-muted: #6e6149;
    --invoice-ivory: #fffdf7;
    --invoice-font: "Times New Roman", "Noto Naskh Arabic", "Arial", serif;
    --invoice-title-font: "Times New Roman", "Noto Naskh Arabic", "Arial", serif;
    position: relative;
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 10mm 10mm 8mm;
    background: #ffffff;
    color: var(--invoice-text);
    font-family: var(--invoice-font);
    direction: ltr;
    font-size: 9.6px;
  }
  .compact-ar { direction: rtl; unicode-bidi: isolate; }
  .compact-en { direction: ltr; unicode-bidi: isolate; }
  .compact-header {
    display: grid;
    grid-template-columns: 16mm 1fr auto;
    align-items: center;
    gap: 4mm;
    padding-bottom: 2.5mm;
    border-bottom: 1.5px solid var(--invoice-gold);
  }
  .compact-logo-wrap {
    width: 15mm; height: 15mm;
    border: 1px solid var(--invoice-gold-line);
    border-radius: 6px;
    display: grid; place-items: center;
    overflow: hidden;
  }
  .compact-logo { width: 100%; height: 100%; object-fit: contain; padding: 1.5mm; }
  .compact-initials { color: var(--invoice-gold-dark); font-size: 11px; font-weight: 900; }
  .compact-brand { min-width: 0; }
  .compact-brand-name {
    margin: 0;
    color: var(--invoice-gold-dark);
    font-family: var(--invoice-title-font);
    font-size: 17px; font-weight: 900; letter-spacing: 0.06em;
    text-transform: uppercase; line-height: 1.05;
    overflow-wrap: anywhere;
  }
  .compact-brand-ar { margin: 0.5mm 0 0; color: var(--invoice-muted); font-size: 10px; font-weight: 700; direction: rtl; unicode-bidi: isolate; }
  .compact-doc {
    text-align: end; min-width: 40mm;
  }
  .compact-doc-title { margin: 0; color: var(--invoice-text); font-size: 12px; font-weight: 900; }
  .compact-doc-trn { margin: 0.6mm 0 0; color: var(--invoice-muted); font-size: 9px; font-weight: 700; }
  .compact-meta {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4mm;
    margin-top: 3mm;
  }
  .compact-box { border: 1px solid var(--invoice-gold-line); border-radius: 4px; overflow: hidden; }
  .compact-box-title {
    display: flex; justify-content: space-between; gap: 6px;
    padding: 1.2mm 2.5mm;
    background: var(--invoice-gold-soft);
    color: var(--invoice-gold-dark);
    font-size: 8.6px; font-weight: 900; text-transform: uppercase;
    border-bottom: 1px solid var(--invoice-gold-line);
  }
  .compact-field {
    display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 3mm;
    padding: 1.1mm 2.5mm;
    border-bottom: 1px dotted rgba(175, 132, 47, 0.35);
    font-size: 9px;
  }
  .compact-field:last-child { border-bottom: 0; }
  .compact-label { color: var(--invoice-muted); font-weight: 700; overflow-wrap: anywhere; }
  .compact-value { color: var(--invoice-text); font-weight: 800; text-align: end; overflow-wrap: anywhere; }
  .compact-table-wrap { margin-top: 3mm; }
  .compact-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 8.8px; direction: ltr; }
  .compact-table thead { display: table-header-group; }
  .compact-table tr { break-inside: avoid; page-break-inside: avoid; }
  .compact-table th {
    border: 1px solid var(--invoice-gold-line);
    background: var(--invoice-gold-soft);
    color: var(--invoice-gold-dark);
    padding: 1.2mm 1mm; font-weight: 900; text-align: center; line-height: 1.2;
  }
  .compact-table td {
    border: 1px solid rgba(175, 132, 47, 0.25);
    padding: 1.1mm 1mm; text-align: center; vertical-align: middle;
    overflow-wrap: anywhere; line-height: 1.18;
  }
  .compact-asset-line { color: var(--invoice-muted); font-size: 8px; }
  .compact-summary {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(62mm, 0.8fr);
    gap: 4mm; margin-top: 3mm; align-items: start;
  }
  .compact-pay-list { list-style: none; margin: 0; padding: 0; }
  .compact-pay-list li {
    display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 3mm;
    padding: 1.1mm 2.5mm; border-bottom: 1px dotted rgba(175, 132, 47, 0.35); font-size: 9px;
  }
  .compact-pay-list li:last-child { border-bottom: 0; }
  .compact-total .compact-label, .compact-total .compact-value {
    color: var(--invoice-gold-dark); font-size: 10.5px; font-weight: 900;
  }
  .compact-special { margin-top: 3mm; }
  .compact-notes { margin-top: 3mm; }
  .compact-notes-lines { padding: 1.6mm 2.5mm; font-size: 9px; white-space: pre-line; min-height: 8mm; }
  .compact-signatures {
    display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6mm; margin-top: 6mm;
  }
  .compact-signature {
    min-height: 11mm; display: flex; align-items: end; justify-content: center;
    border-bottom: 1px solid var(--invoice-gold-dark);
    color: var(--invoice-muted); font-size: 8.6px; font-weight: 800;
    text-align: center; padding-bottom: 1mm;
  }
  .compact-footer {
    margin-top: 4mm; padding-top: 2mm; border-top: 1px solid var(--invoice-gold-line);
    display: flex; flex-wrap: wrap; justify-content: center; gap: 5mm;
    color: var(--invoice-gold-dark); font-size: 8.6px; font-weight: 700; text-align: center;
  }
  @media print {
    .compact-invoice { color-adjust: exact; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .compact-box, .compact-summary, .compact-signatures { break-inside: avoid; page-break-inside: avoid; }
  }
`;

export function CompactInvoicePrintTemplate({
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

  return (
    <article className="print-document print-page compact-invoice" data-print-root style={themeVars}>
      <style>{compactInvoiceStyles}</style>

      {tpl.sections.header && (
        <section className="compact-header">
          <div className="compact-logo-wrap">
            {tpl.fields.companyLogo && vm.company.logoUrl ? (
              <img className="compact-logo" src={vm.company.logoUrl} alt={companyNameEn} />
            ) : (
              <span className="compact-initials">{companyInitials}</span>
            )}
          </div>
          <div className="compact-brand">
            {showEn && <h1 className="compact-brand-name">{companyNameEn}</h1>}
            {showAr && <p className="compact-brand-ar">{companyNameAr}</p>}
          </div>
          <div className="compact-doc">
            {showEn && <p className="compact-doc-title compact-en">{documentTitleEn}</p>}
            {showAr && <p className="compact-doc-title compact-ar">{documentTitleAr}</p>}
            {tpl.fields.companyTrn && <p className="compact-doc-trn">{trnLabel}: {text(vm.company.trn)}</p>}
          </div>
        </section>
      )}

      {tpl.sections.welcomeMessage && vm.messages.welcomeMessage && (
        <p style={{ textAlign: "center", whiteSpace: "pre-line", margin: "1mm 0", fontWeight: 600 }}>{vm.messages.welcomeMessage}</p>
      )}
      {tpl.sections.headerNote && vm.messages.headerNote && (
        <p style={{ textAlign: "center", whiteSpace: "pre-line", margin: "0 0 1mm", fontSize: "0.9em", color: "#555" }}>{vm.messages.headerNote}</p>
      )}

      {(tpl.sections.clientDetails || tpl.sections.invoiceDetails) && (
        <section className="compact-meta">
          {tpl.sections.clientDetails && (
            <div className="compact-box">
              <BoxTitle en="CLIENT DETAILS" ar="بيانات العميل" showEnglish={showEn} showArabic={showAr} />
              <Field labelEn="Customer Name" labelAr="اسم العميل" value={text(vm.customer.name)} showEnglish={showEn} showArabic={showAr} />
              {tpl.fields.customerPhone && <Field labelEn="Mobile Number" labelAr="رقم الهاتف" value={text(vm.customer.phone)} showEnglish={showEn} showArabic={showAr} />}
              {tpl.fields.customerTrn && <Field labelEn="Customer TRN" labelAr="الرقم الضريبي" value={text(vm.customer.trn)} showEnglish={showEn} showArabic={showAr} />}
              {tpl.fields.customerAddress && <Field labelEn="Address" labelAr="العنوان" value={text(vm.customer.address)} showEnglish={showEn} showArabic={showAr} />}
            </div>
          )}
          {tpl.sections.invoiceDetails && (
            <div className="compact-box">
              <BoxTitle en="INVOICE DETAILS" ar="بيانات الفاتورة" showEnglish={showEn} showArabic={showAr} />
              <Field labelEn="Invoice No." labelAr="رقم الفاتورة" value={text(vm.document.number)} showEnglish={showEn} showArabic={showAr} />
              <Field labelEn="Invoice Date" labelAr="تاريخ الفاتورة" value={text(vm.document.date)} showEnglish={showEn} showArabic={showAr} />
              <Field labelEn="Type" labelAr="النوع" value={documentTypeLabel} showEnglish={showEn} showArabic={showAr} />
              <Field labelEn="Status" labelAr="الحالة" value={text(vm.document.status)} showEnglish={showEn} showArabic={showAr} />
              {tpl.fields.originalInvoiceRef && (vm.document.originalInvoiceNumber || vm.document.originalInvoiceId) && (
                <Field labelEn="Original Invoice" labelAr="الفاتورة الأصلية" value={text(vm.document.originalInvoiceNumber ?? vm.document.originalInvoiceId)} showEnglish={showEn} showArabic={showAr} />
              )}
              {cashierName && tpl.fields.salesperson && <Field labelEn="Salesperson" labelAr="البائع" value={text(cashierName)} showEnglish={showEn} showArabic={showAr} />}
            </div>
          )}
        </section>
      )}

      {tpl.sections.itemsTable && (
        <section className="compact-table-wrap">
          <table className="compact-table">
            <thead>
              <tr>
                <th style={{ width: "8mm" }}>#</th>
                <th><LocalizedPrintLabel en="Item" ar="القطعة" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="compact-en" arabicClassName="compact-ar" /></th>
                <th style={{ width: "16mm" }}><LocalizedPrintLabel en="Karat" ar="العيار" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="compact-en" arabicClassName="compact-ar" /></th>
                <th style={{ width: "16mm" }}><LocalizedPrintLabel en="Wt (g)" ar="الوزن" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="compact-en" arabicClassName="compact-ar" /></th>
                <th style={{ width: "11mm" }}><LocalizedPrintLabel en="Qty" ar="الكمية" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="compact-en" arabicClassName="compact-ar" /></th>
                <th style={{ width: "22mm" }}><LocalizedPrintLabel en="Net" ar="الصافي" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="compact-en" arabicClassName="compact-ar" /></th>
                <th style={{ width: "22mm" }}><LocalizedPrintLabel en="VAT" ar="الضريبة" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="compact-en" arabicClassName="compact-ar" /></th>
                <th style={{ width: "24mm" }}><LocalizedPrintLabel en="Total" ar="الإجمالي" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="compact-en" arabicClassName="compact-ar" /></th>
              </tr>
            </thead>
            <tbody>
              {vm.items.map((item) => (
                <tr key={`${item.id ?? item.assetId ?? item.index}-${item.index}`}>
                  <td>{text(item.index)}</td>
                  <td>
                    <strong>{text(item.description)}</strong>
                    {item.assetId && tpl.fields.itemAssetId && <div className="compact-asset-line">{assetIdLabel}: {text(item.assetId)}</div>}
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

      {tpl.sections.specialSummary && vm.special?.exchange && (
        <section className="compact-special compact-box">
          <BoxTitle en="EXCHANGE SUMMARY" ar="ملخص الاستبدال" showEnglish={showEn} showArabic={showAr} />
          <Field labelEn="Difference" labelAr="الفرق" value={money(vm.special.exchange.difference)} showEnglish={showEn} showArabic={showAr} />
        </section>
      )}

      {(tpl.sections.paymentMethod || tpl.sections.amountDetails) && (
        <section className="compact-summary">
          {tpl.sections.paymentMethod && (
            <div className="compact-box">
              <BoxTitle en="PAYMENT" ar="الدفع" showEnglish={showEn} showArabic={showAr} />
              <ul className="compact-pay-list">
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
            <div className="compact-box">
              <BoxTitle en="AMOUNT DETAILS" ar="تفاصيل المبلغ" showEnglish={showEn} showArabic={showAr} />
              <Field labelEn="Net / Subtotal" labelAr="الصافي" value={money(vm.totals.subtotal)} showEnglish={showEn} showArabic={showAr} />
              <Field labelEn="Discount" labelAr="الخصم" value={money(vm.totals.discount)} showEnglish={showEn} showArabic={showAr} />
              <Field labelEn="VAT Rate" labelAr="نسبة الضريبة" value={percent(vm.totals.vatRate)} showEnglish={showEn} showArabic={showAr} />
              <Field labelEn="VAT Amount" labelAr="قيمة الضريبة" value={money(vm.totals.vatAmount)} showEnglish={showEn} showArabic={showAr} />
              <Field labelEn="Total" labelAr="الإجمالي" value={money(vm.totals.totalAmount)} isTotal showEnglish={showEn} showArabic={showAr} />
              <Field labelEn="Paid" labelAr="المدفوع" value={money(vm.totals.paidAmount)} showEnglish={showEn} showArabic={showAr} />
              <Field labelEn="Remaining" labelAr="المتبقي" value={money(vm.totals.remainingAmount)} showEnglish={showEn} showArabic={showAr} />
            </div>
          )}
        </section>
      )}

      {tpl.sections.notes && vm.notes && (
        <section className="compact-notes compact-box">
          <BoxTitle en="NOTES" ar="ملاحظات" showEnglish={showEn} showArabic={showAr} />
          <div className="compact-notes-lines">{vm.notes}</div>
        </section>
      )}

      {tpl.sections.terms && vm.messages.termsMessage && (
        <section className="compact-notes compact-box">
          <BoxTitle en="TERMS" ar="الشروط والأحكام" showEnglish={showEn} showArabic={showAr} />
          <div className="compact-notes-lines" style={{ whiteSpace: "pre-line" }}>{vm.messages.termsMessage}</div>
        </section>
      )}

      {tpl.sections.footerMessage && vm.messages.footerMessage && (
        <p style={{ textAlign: "center", whiteSpace: "pre-line", margin: "1mm 0", fontSize: "0.9em", color: "#555" }}>{vm.messages.footerMessage}</p>
      )}

      {tpl.sections.signatures && (
        <section className="compact-signatures">
          <div className="compact-signature"><LocalizedPrintLabel en="Customer" ar="العميل" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="compact-en" arabicClassName="compact-ar" /></div>
          <div className="compact-signature"><LocalizedPrintLabel en="Company Stamp" ar="ختم الشركة" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="compact-en" arabicClassName="compact-ar" /></div>
          <div className="compact-signature"><LocalizedPrintLabel en="Salesperson" ar="المبيعات" showEnglish={showEn} showArabic={showAr} separator=" / " englishClassName="compact-en" arabicClassName="compact-ar" /></div>
        </section>
      )}

      {tpl.sections.footer && footerItems.length > 0 && (
        <footer className="compact-footer">
          {footerItems.map((value) => (
            <span key={value}>{text(value)}</span>
          ))}
        </footer>
      )}
    </article>
  );
}

function BoxTitle({
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
    <div className="compact-box-title">
      <LocalizedPrintLabel
        en={en}
        ar={ar}
        showEnglish={showEnglish}
        showArabic={showArabic}
        separator=""
        englishClassName="compact-en"
        arabicClassName="compact-ar"
      />
    </div>
  );
}

function Field({
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
    <div className={`compact-field${isTotal ? " compact-total" : ""}`}>
      <LocalizedPrintLabel
        en={labelEn}
        ar={labelAr}
        showEnglish={showEnglish}
        showArabic={showArabic}
        className="compact-label"
        englishClassName="compact-en"
        arabicClassName="compact-ar"
      />
      <span className="compact-value">{value}</span>
    </div>
  );
}
