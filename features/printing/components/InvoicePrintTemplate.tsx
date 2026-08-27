import type { CSSProperties } from "react";
import type { Invoice, ExchangeDisplayResponse } from "@/lib/types";
import { ExchangePrintSummary } from "@/features/printing/components/ExchangePrintSummary";
import { getPublicFileUrl } from "@/lib/api/files";
import { formatAppMoney } from "@/lib/formatters/currency";
import { toEnglishDigits } from "@/lib/formatters/numbers";
import {
  buildInvoicePrintViewModel,
  type InvoicePrintViewModel,
} from "@/features/printing/lib/invoice-print-view-model";
import {
  resolveInvoicePrintTemplateConfig,
  shouldShowArabic,
  shouldShowEnglish,
  type PrintTemplateConfigOverrides,
} from "@/features/printing/lib/print-template-config";
import {
  formatLocalizedText,
  LocalizedPrintLabel,
} from "@/features/printing/components/LocalizedPrintLabel";
import { CustomPrintTextBlocks } from "@/features/printing/components/CustomPrintTextBlocks";

export interface PrintCompany {
  name: string;
  logo?: string;
  branch?: string;
  trn?: string;
  currency: string;
  phone?: string;
  email?: string;
  website?: string;
  country?: string;
  city?: string;
  region?: string;
  address1?: string;
  address2?: string;
  postalCode?: string;
}

export interface InvoicePrintLabels {
  invoice: string;
  invoiceNo: string;
  uuid: string;
  date: string;
  branch: string;
  trn: string;
  customer: string;
  cashier: string;
  item: string;
  assetId: string;
  description: string;
  weight: string;
  karat: string;
  qty: string;
  price: string;
  makingCharge: string;
  stoneValue: string;
  discount: string;
  subtotal: string;
  vat: string;
  total: string;
  payment: string;
  remaining: string;
  notes: string;
  qr: string;
}

export interface InvoicePrintTemplateProps {
  invoice: Invoice;
  company: PrintCompany;
  cashierName?: string;
  locale: string;
  labels: InvoicePrintLabels;
  settings?: {
    currency: string;
    decimalPrecision: number;
    receipt?: any;
    invoicePrintBuilderConfig?: any;
    invoicePrintCustomBlocks?: any;
  };
  viewModel?: InvoicePrintViewModel;
  templateConfig?: PrintTemplateConfigOverrides;
  /**
   * Display-only document title override (Phase 19F print dialog). Replaces the
   * printed title wording only — never the invoice type, items, or totals.
   */
  documentTitleOverride?: { titleAr: string; titleEn: string };
  /**
   * Phase 30.7-Fix — trusted, pre-fetched customer-facing exchange display data.
   * When the invoice is an exchange, templates render ExchangePrintSummary from
   * this (suppressing the raw negative item line/total). Never fetched in print.
   */
  exchangeDisplay?: ExchangeDisplayResponse | null;
}

const luxuryInvoiceStyles = `
  @page {
    size: A4;
    margin: 0;
  }
  html,
  body {
    margin: 0;
    padding: 0;
  }
  .luxury-invoice {
    --invoice-gold: #af842f;
    --invoice-gold-dark: #7c5a18;
    --invoice-gold-soft: #f6edd7;
    --invoice-gold-line: rgba(175, 132, 47, 0.52);
    --invoice-text: #231f18;
    --invoice-muted: #6e6149;
    --invoice-ivory: #fffdf7;
    --invoice-font: "Times New Roman", "Noto Naskh Arabic", "Arial", serif;
    --invoice-title-font: "Times New Roman", "Noto Naskh Arabic", "Arial", serif;
    position: relative;
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 6mm;
    background:
      linear-gradient(#fffefa, #fffefa) padding-box,
      linear-gradient(135deg, rgba(175, 132, 47, 0.92), rgba(238, 220, 167, 0.9), rgba(175, 132, 47, 0.92)) border-box;
    border: 2px solid transparent;
    color: var(--invoice-text);
    font-family: var(--invoice-font);
    direction: ltr;
    page-break-after: avoid;
    break-after: avoid;
  }
  .luxury-invoice::before {
    content: "";
    position: absolute;
    inset: 3.5mm;
    border: 1px solid var(--invoice-gold-line);
    pointer-events: none;
    z-index: 0;
  }
  .luxury-invoice::after {
    content: "";
    position: absolute;
    inset: 6mm;
    border: 1px solid rgba(175, 132, 47, 0.2);
    pointer-events: none;
    z-index: 0;
  }
  .luxury-corner {
    position: absolute;
    width: 18mm;
    height: 18mm;
    border-color: var(--invoice-gold);
    opacity: 0.92;
    z-index: 1;
    pointer-events: none;
  }
  .luxury-corner-top-start { inset-block-start: 4mm; inset-inline-start: 4mm; border-block-start: 2px solid; border-inline-start: 2px solid; }
  .luxury-corner-top-end { inset-block-start: 4mm; inset-inline-end: 4mm; border-block-start: 2px solid; border-inline-end: 2px solid; }
  .luxury-corner-bottom-start { inset-block-end: 4mm; inset-inline-start: 4mm; border-block-end: 2px solid; border-inline-start: 2px solid; }
  .luxury-corner-bottom-end { inset-block-end: 4mm; inset-inline-end: 4mm; border-block-end: 2px solid; border-inline-end: 2px solid; }
  .luxury-watermark {
    position: absolute;
    inset-block-start: 78mm;
    inset-inline-start: 12mm;
    width: 64mm;
    max-height: 74mm;
    opacity: var(--invoice-watermark-opacity, 0.04);
    object-fit: contain;
    pointer-events: none;
    z-index: 0;
  }
  .luxury-content {
    position: relative;
    z-index: 2;
    padding: 3mm;
    min-height: 279mm;
    display: flex;
    flex-direction: column;
  }
  .luxury-ar {
    direction: rtl;
    unicode-bidi: isolate;
  }
  .luxury-en {
    direction: ltr;
    unicode-bidi: isolate;
  }
  .luxury-brand-header {
    position: relative;
    min-height: 42mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 1.5mm 22mm 3mm;
  }
  .luxury-logo-wrap {
    position: absolute;
    inset-block-start: 2mm;
    inset-inline-start: 0;
    width: 17mm;
    height: 17mm;
    border: 1px solid var(--invoice-gold-line);
    border-radius: 999px;
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.76);
    overflow: hidden;
  }
  .luxury-logo { width: 100%; height: 100%; object-fit: contain; padding: 2.5mm; }
  .luxury-initials { color: var(--invoice-gold-dark); font-size: 12px; font-weight: 900; }
  .luxury-brand-center {
    min-width: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .luxury-brand-name {
    margin: 0;
    color: var(--invoice-gold-dark);
    font-family: var(--invoice-title-font);
    font-size: 29px;
    line-height: 1;
    font-weight: 900;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  .luxury-brand-subtitle {
    margin: 1.8mm 0 0;
    color: var(--invoice-gold-dark);
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.44em;
    text-transform: uppercase;
  }
  .luxury-brand-en,
  .luxury-brand-ar {
    margin: 1.4mm 0 0;
    color: var(--invoice-muted);
    font-size: 11px;
    font-weight: 700;
    direction: rtl;
    unicode-bidi: isolate;
  }
  .luxury-ornament {
    display: grid;
    grid-template-columns: 1fr 8mm 1fr;
    align-items: center;
    gap: 2.5mm;
    width: min(82mm, 74%);
    margin: 2.3mm auto 2mm;
    color: var(--invoice-gold);
  }
  .luxury-ornament::before,
  .luxury-ornament::after {
    content: "";
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--invoice-gold), transparent);
  }
  .luxury-diamond {
    width: 4mm;
    height: 4mm;
    margin: auto;
    border: 1px solid var(--invoice-gold);
    transform: rotate(45deg);
    background: #fff8e8;
  }
  .luxury-document-title h2,
  .luxury-document-title h3 {
    margin: 0;
    color: var(--invoice-text);
    font-family: var(--invoice-title-font);
  }
  .luxury-document-title h2 {
    font-size: 15px;
    letter-spacing: 0.08em;
  }
  .luxury-document-title h3 {
    margin-top: 0.6mm;
    font-size: 15px;
  }
  .luxury-trn {
    margin: 1.1mm 0 0;
    color: var(--invoice-muted);
    font-size: 10px;
    font-weight: 700;
  }
  .luxury-details-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 5mm;
    margin-top: 1mm;
    direction: ltr;
  }
  .client-box { grid-column: 1; }
  .invoice-box { grid-column: 2; }
  .luxury-box {
    border: 1px solid var(--invoice-gold-line);
    background: rgba(255, 255, 255, 0.82);
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .luxury-box-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin: -1px -1px 0;
    padding: 1.7mm 3mm;
    border: 1px solid var(--invoice-gold);
    background: var(--invoice-gold-soft);
    color: var(--invoice-gold-dark);
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
  }
  .luxury-field {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 3mm;
    min-height: 6.3mm;
    padding: 1.45mm 3mm;
    border-bottom: 1px dotted rgba(175, 132, 47, 0.42);
    font-size: 9.6px;
  }
  .luxury-field:last-child { border-bottom: 0; }
  .luxury-label {
    color: var(--invoice-muted);
    font-weight: 800;
    overflow-wrap: anywhere;
  }
  .luxury-value {
    min-width: 28mm;
    color: var(--invoice-text);
    font-weight: 800;
    text-align: end;
    overflow-wrap: anywhere;
  }
  .luxury-table-wrap { margin-top: 4mm; }
  .luxury-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    background: rgba(255, 255, 255, 0.9);
    font-size: 9.4px;
    direction: ltr;
  }
  .luxury-table thead { display: table-header-group; }
  .luxury-table tr { break-inside: avoid; page-break-inside: avoid; }
  .luxury-table th {
    border: 1px solid var(--invoice-gold-line);
    background: #fbf4e4;
    color: var(--invoice-gold-dark);
    padding: 1.8mm 1mm;
    font-weight: 900;
    text-align: center;
    line-height: 1.28;
  }
  .luxury-table td {
    border-inline: 1px solid rgba(175, 132, 47, 0.28);
    border-bottom: 1px dotted rgba(175, 132, 47, 0.36);
    padding: 1.65mm 1mm;
    vertical-align: middle;
    overflow-wrap: anywhere;
    text-align: center;
    line-height: 1.24;
  }
  .luxury-table .description-cell { text-align: center; }
  .luxury-asset-line {
    margin-top: 0.6mm;
    color: var(--invoice-muted);
    font-size: 9px;
  }
  .luxury-summary-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(70mm, 0.82fr);
    gap: 5mm;
    margin-top: 4mm;
    align-items: start;
    direction: ltr;
  }
  .payment-box { grid-column: 1; }
  .amount-box { grid-column: 2; }
  .luxury-payment-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .luxury-payment-list li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 3mm;
    padding: 1.55mm 3mm;
    border-bottom: 1px dotted rgba(175, 132, 47, 0.42);
    font-size: 9.8px;
  }
  .luxury-payment-list li:last-child { border-bottom: 0; }
  .luxury-total-row {
    background: rgba(246, 237, 215, 0.58);
  }
  .luxury-total-row .luxury-label,
  .luxury-total-row .luxury-value {
    color: var(--invoice-gold-dark);
    font-size: 12px;
    font-weight: 900;
  }
  .luxury-special { margin-top: 3.5mm; }
  .luxury-notes-box { margin-top: 3.5mm; }
  .luxury-tail {
    margin-top: 3.5mm;
  }
  .luxury-notes-lines {
    min-height: 11mm;
    padding: 2.2mm 3mm;
    font-size: 10px;
    white-space: pre-line;
  }
  .luxury-notes-empty {
    height: 5mm;
    border-bottom: 1px solid rgba(175, 132, 47, 0.48);
  }
  .luxury-signatures {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8mm;
    margin-top: 6mm;
    direction: ltr;
  }
  .luxury-signature {
    min-height: 14mm;
    display: flex;
    align-items: end;
    justify-content: center;
    border-bottom: 1px solid var(--invoice-gold-dark);
    color: var(--invoice-muted);
    font-size: 10px;
    font-weight: 900;
    text-align: center;
    padding-bottom: 1.4mm;
  }
  .luxury-footer {
    margin-top: 4mm;
    border: 1px solid var(--invoice-gold-line);
    background: var(--invoice-gold-soft);
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1px;
    color: var(--invoice-gold-dark);
    font-size: 9px;
    font-weight: 800;
    text-align: center;
    direction: ltr;
  }
  .luxury-footer-item {
    min-height: 7mm;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.5mm;
    padding: 1mm;
    background: rgba(255, 255, 255, 0.36);
    overflow-wrap: anywhere;
  }
  .luxury-footer-icon {
    display: inline-grid;
    place-items: center;
    width: 4mm;
    height: 4mm;
    border: 1px solid var(--invoice-gold);
    border-radius: 999px;
    font-size: 8px;
    line-height: 1;
  }
  @media print {
    .luxury-invoice {
      min-height: auto;
      color-adjust: exact;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .luxury-box,
    .luxury-summary-row,
    .luxury-signatures,
    .luxury-notes-box {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  }
`;

export function InvoicePrintTemplate({
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
  // Phase 30.7-Fix — for exchange invoices, render the customer-safe summary and
  // suppress the raw negative item line/totals (never shown to the customer).
  const isExchange = invoice.type === "exchange";
  const settingsConfig = (settings as { printTemplateConfig?: PrintTemplateConfigOverrides } | undefined)?.printTemplateConfig;
  const tpl = resolveInvoicePrintTemplateConfig(templateConfig ?? settingsConfig);
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
    "--invoice-watermark-opacity": String(tpl.theme.watermarkOpacity),
  } as CSSProperties;
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
    templateId: "luxuryGold",
    locale,
    currency,
    getPublicFileUrl,
  });

  const money = (value: number | undefined) => (
    value === undefined ? "—" : formatAppMoney(value, vm.totals.currency ?? currency, precision)
  );
  const text = (value: string | number | undefined | null) => {
    if (value === undefined || value === null || String(value).trim() === "") return "—";
    return toEnglishDigits(String(value));
  };
  const percent = (value: number | undefined) => (value === undefined ? "—" : `${toEnglishDigits(value)}%`);
  const companyNameEn = vm.company.nameEn ?? vm.company.displayName ?? vm.company.nameAr ?? company.name ?? "—";
  const companyNameAr = vm.company.nameAr ?? vm.company.displayName ?? vm.company.nameEn ?? company.name ?? "—";
  const companyInitials = getCompanyInitials(companyNameEn);
  const brand = getBrandDisplay(companyNameEn);
  // Display-only titles: the dialog override wins; ViewModel remains the default.
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
    { icon: "☎", value: tpl.fields.footerPhone ? vm.company.phone : undefined },
    { icon: "⌖", value: tpl.fields.footerAddress ? vm.company.address : undefined },
    { icon: "✉", value: tpl.fields.footerEmail ? vm.company.email : undefined },
  ].filter((item): item is { icon: string; value: string } => Boolean(item.value));
  const customBlocks = tpl.sections.customTextBlocks ? vm.customTextBlocksByPlacement : {};

  return (
    <article className="print-document print-page luxury-invoice" data-print-root style={themeVars}>
      <style>{luxuryInvoiceStyles}</style>
      <span className="luxury-corner luxury-corner-top-start" />
      <span className="luxury-corner luxury-corner-top-end" />
      <span className="luxury-corner luxury-corner-bottom-start" />
      <span className="luxury-corner luxury-corner-bottom-end" />
      {tpl.fields.watermark && vm.company.watermarkUrl && <img className="luxury-watermark" src={vm.company.watermarkUrl} alt="" />}

      <div className="luxury-content">
        {tpl.sections.header && (
        <section className="luxury-brand-header" aria-label="Invoice header">
          <div className="luxury-logo-wrap">
            {tpl.fields.companyLogo && vm.company.logoUrl ? (
              <img className="luxury-logo" src={vm.company.logoUrl} alt={companyNameEn} />
            ) : (
              <span className="luxury-initials">{companyInitials}</span>
            )}
          </div>

          <div className="luxury-brand-center">
            <h1 className="luxury-brand-name">{brand.primary}</h1>
            {brand.secondary && <p className="luxury-brand-subtitle">{brand.secondary}</p>}
            {showEn && companyNameEn !== brand.primary && companyNameEn !== brand.secondary && <p className="luxury-brand-en">{companyNameEn}</p>}
            {showAr && <p className="luxury-brand-ar">{companyNameAr}</p>}
            <div className="luxury-ornament" aria-hidden="true"><span className="luxury-diamond" /></div>
            <div className="luxury-document-title">
              {showAr && <h3 className="luxury-ar">{documentTitleAr}</h3>}
              {showEn && <h2 className="luxury-en">{documentTitleEn}</h2>}
            </div>
            {tpl.fields.companyTrn && <p className="luxury-trn">{trnLabel}: {text(vm.company.trn)}</p>}
          </div>

          <div aria-hidden="true" />
        </section>
        )}

        {tpl.sections.welcomeMessage && vm.messages.welcomeMessage && (
          <p className="luxury-print-message" style={{ textAlign: "center", whiteSpace: "pre-line", margin: "2mm 0 3mm", fontWeight: 600, color: "var(--invoice-gold-dark)" }}>{vm.messages.welcomeMessage}</p>
        )}
        {tpl.sections.headerNote && vm.messages.headerNote && (
          <p className="luxury-print-message" style={{ textAlign: "center", whiteSpace: "pre-line", margin: "0 0 3mm", color: "var(--invoice-muted)" }}>{vm.messages.headerNote}</p>
        )}
        <CustomPrintTextBlocks blocks={customBlocks.afterHeader} />

        {(tpl.sections.clientDetails || tpl.sections.invoiceDetails) && (
        <section className="luxury-details-row">
          {tpl.sections.clientDetails && (
          <div className="luxury-box client-box">
            <BoxTitle en="CLIENT DETAILS" ar="بيانات العميل" showEnglish={showEn} showArabic={showAr} />
            <DetailRow labelAr="اسم العميل" labelEn="Customer Name" value={text(vm.customer.name)} showEnglish={showEn} showArabic={showAr} />
            {tpl.fields.customerPhone && <DetailRow labelAr="رقم الهاتف" labelEn="Mobile Number" value={text(vm.customer.phone)} showEnglish={showEn} showArabic={showAr} />}
            {tpl.fields.customerTrn && <DetailRow labelAr="الرقم الضريبي" labelEn="Customer TRN" value={text(vm.customer.trn)} showEnglish={showEn} showArabic={showAr} />}
            {tpl.fields.customerAddress && <DetailRow labelAr="العنوان" labelEn="Address" value={text(vm.customer.address)} showEnglish={showEn} showArabic={showAr} />}
          </div>
          )}

          {tpl.sections.invoiceDetails && (
          <div className="luxury-box invoice-box">
            <BoxTitle en="INVOICE DETAILS" ar="بيانات الفاتورة" showEnglish={showEn} showArabic={showAr} />
            <DetailRow labelAr="رقم الفاتورة" labelEn="Invoice No." value={text(vm.document.number)} showEnglish={showEn} showArabic={showAr} />
            <DetailRow labelAr="تاريخ الفاتورة" labelEn="Invoice Date" value={text(vm.document.date)} showEnglish={showEn} showArabic={showAr} />
            {tpl.fields.invoiceBranch && vm.document.branch && (
              <DetailRow labelAr="الفرع" labelEn="Branch" value={text(vm.document.branch)} showEnglish={showEn} showArabic={showAr} />
            )}
            <DetailRow labelAr="نوع الفاتورة" labelEn="Invoice Type" value={documentTypeLabel} showEnglish={showEn} showArabic={showAr} />
            <DetailRow labelAr="الحالة" labelEn="Status" value={text(vm.document.status)} showEnglish={showEn} showArabic={showAr} />
            <DetailRow labelAr="حالة الاعتماد" labelEn="Post Status" value={text(vm.document.postingStatus)} showEnglish={showEn} showArabic={showAr} />
            {tpl.fields.originalInvoiceRef && (vm.document.originalInvoiceNumber || vm.document.originalInvoiceId) && (
              <DetailRow
                labelAr="الفاتورة الأصلية"
                labelEn="Original Invoice Ref"
                value={text(vm.document.originalInvoiceNumber ?? vm.document.originalInvoiceId)}
                showEnglish={showEn}
                showArabic={showAr}
              />
            )}
            {cashierName && tpl.fields.salesperson && <DetailRow labelAr="البائع" labelEn="Salesperson" value={text(cashierName)} showEnglish={showEn} showArabic={showAr} />}
          </div>
          )}
        </section>
        )}
        <CustomPrintTextBlocks blocks={customBlocks.afterInvoiceDetails} />
        <CustomPrintTextBlocks blocks={customBlocks.beforeItems} />

        {isExchange && (
          <ExchangePrintSummary exchangeDisplay={exchangeDisplay ?? null} locale={locale} currency={currency} variant="full" />
        )}
        {tpl.sections.itemsTable && !isExchange && (
        <section className="luxury-table-wrap">
          <table className="luxury-table">
            <thead>
              <tr>
                <th style={{ width: "10mm" }}><LocalizedPrintLabel en="Sr No." ar="الرقم" showEnglish={showEn} showArabic={showAr} separator={<br />} englishClassName="luxury-en" arabicClassName="luxury-ar" /></th>
                <th><LocalizedPrintLabel en="Item Description" ar="وصف القطعة" showEnglish={showEn} showArabic={showAr} separator={<br />} englishClassName="luxury-en" arabicClassName="luxury-ar" /></th>
                <th style={{ width: "21mm" }}><LocalizedPrintLabel en="Gold Karat" ar="عيار الذهب" showEnglish={showEn} showArabic={showAr} separator={<br />} englishClassName="luxury-en" arabicClassName="luxury-ar" /></th>
                <th style={{ width: "21mm" }}><LocalizedPrintLabel en="Weight (g)" ar="الوزن (جرام)" showEnglish={showEn} showArabic={showAr} separator={<br />} englishClassName="luxury-en" arabicClassName="luxury-ar" /></th>
                <th style={{ width: "13mm" }}><LocalizedPrintLabel en="Qty" ar="الكمية" showEnglish={showEn} showArabic={showAr} separator={<br />} englishClassName="luxury-en" arabicClassName="luxury-ar" /></th>
                <th style={{ width: "25mm" }}><LocalizedPrintLabel en="Net Amount" ar="المبلغ الصافي" showEnglish={showEn} showArabic={showAr} separator={<br />} englishClassName="luxury-en" arabicClassName="luxury-ar" /></th>
                <th style={{ width: "25mm" }}><LocalizedPrintLabel en="VAT" ar="ضريبة القيمة المضافة" showEnglish={showEn} showArabic={showAr} separator={<br />} englishClassName="luxury-en" arabicClassName="luxury-ar" /></th>
                <th style={{ width: "27mm" }}><LocalizedPrintLabel en="Total Amount" ar="المبلغ الإجمالي" showEnglish={showEn} showArabic={showAr} separator={<br />} englishClassName="luxury-en" arabicClassName="luxury-ar" /></th>
              </tr>
            </thead>
            <tbody>
              {vm.items.map((item) => (
                <tr key={`${item.id ?? item.assetId ?? item.index}-${item.index}`}>
                  <td>{text(item.index)}</td>
                  <td className="description-cell">
                    <strong>{text(item.description)}</strong>
                    {item.assetId && tpl.fields.itemAssetId && <div className="luxury-asset-line">{assetIdLabel}: {text(item.assetId)}</div>}
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

        {tpl.sections.specialSummary && vm.special && !isExchange && <SpecialSections special={vm.special} money={money} text={text} showEnglish={showEn} showArabic={showAr} />}

        {(tpl.sections.paymentMethod || tpl.sections.amountDetails) && !isExchange && (
        <section className="luxury-summary-row">
          {tpl.sections.paymentMethod && (
          <div className="luxury-box payment-box">
            <BoxTitle en="PAYMENT METHOD" ar="طريقة الدفع" showEnglish={showEn} showArabic={showAr} />
            <ul className="luxury-payment-list">
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
          <div className="luxury-box amount-box">
            <BoxTitle en="AMOUNT DETAILS" ar="تفاصيل المبلغ" showEnglish={showEn} showArabic={showAr} />
            <DetailRow labelAr="الصافي" labelEn="Net / Subtotal" value={money(vm.totals.subtotal)} showEnglish={showEn} showArabic={showAr} />
            <DetailRow labelAr="الخصم" labelEn="Discount" value={money(vm.totals.discount)} showEnglish={showEn} showArabic={showAr} />
            <DetailRow labelAr="نسبة الضريبة" labelEn="VAT Rate" value={percent(vm.totals.vatRate)} showEnglish={showEn} showArabic={showAr} />
            <DetailRow labelAr="قيمة الضريبة" labelEn="VAT Amount" value={money(vm.totals.vatAmount)} showEnglish={showEn} showArabic={showAr} />
            <DetailRow labelAr="المبلغ الإجمالي" labelEn="Total Amount" value={money(vm.totals.totalAmount)} isTotal showEnglish={showEn} showArabic={showAr} />
            <DetailRow labelAr="المدفوع" labelEn="Paid Amount" value={money(vm.totals.paidAmount)} showEnglish={showEn} showArabic={showAr} />
            <DetailRow labelAr="المتبقي" labelEn="Remaining Amount" value={money(vm.totals.remainingAmount)} showEnglish={showEn} showArabic={showAr} />
          </div>
          )}
        </section>
        )}
        <CustomPrintTextBlocks blocks={customBlocks.afterTotals} />

        <div className="luxury-tail">
          {tpl.sections.notes && (
          <section className="luxury-box luxury-notes-box">
            <BoxTitle en="NOTES" ar="ملاحظات" showEnglish={showEn} showArabic={showAr} />
            <div className="luxury-notes-lines">
              {vm.notes ? vm.notes : <div className="luxury-notes-empty" />}
            </div>
          </section>
          )}

          {tpl.sections.terms && vm.messages.termsMessage && (
            <section className="luxury-box luxury-notes-box">
              <BoxTitle en="TERMS" ar="الشروط والأحكام" showEnglish={showEn} showArabic={showAr} />
              <div className="luxury-notes-lines" style={{ whiteSpace: "pre-line" }}>{vm.messages.termsMessage}</div>
            </section>
          )}

          <CustomPrintTextBlocks blocks={customBlocks.beforeFooter} />

          {tpl.sections.footerMessage && vm.messages.footerMessage && (
            <p className="luxury-print-message" style={{ textAlign: "center", whiteSpace: "pre-line", margin: "3mm 0 0", color: "var(--invoice-muted)" }}>{vm.messages.footerMessage}</p>
          )}

          <CustomPrintTextBlocks blocks={customBlocks.beforeSignatures} />

          {tpl.sections.signatures && (
          <section className="luxury-signatures">
            <div className="luxury-signature"><LocalizedPrintLabel en="Customer Signature" ar="توقيع العميل" showEnglish={showEn} showArabic={showAr} englishClassName="luxury-en" arabicClassName="luxury-ar" /></div>
            <div className="luxury-signature"><LocalizedPrintLabel en="Company Stamp" ar="ختم الشركة" showEnglish={showEn} showArabic={showAr} englishClassName="luxury-en" arabicClassName="luxury-ar" /></div>
            <div className="luxury-signature"><LocalizedPrintLabel en="Salesperson Signature" ar="توقيع المبيعات" showEnglish={showEn} showArabic={showAr} englishClassName="luxury-en" arabicClassName="luxury-ar" /></div>
          </section>
          )}

          {tpl.sections.footer && footerItems.length > 0 && (
            <footer className="luxury-footer">
              {footerItems.map((item) => (
                <span className="luxury-footer-item" key={`${item.icon}-${item.value}`}>
                  <span className="luxury-footer-icon" aria-hidden="true">{item.icon}</span>
                  {text(item.value)}
                </span>
              ))}
            </footer>
          )}
        </div>
      </div>
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
    <div className="luxury-box-title">
      <LocalizedPrintLabel
        en={en}
        ar={ar}
        showEnglish={showEnglish}
        showArabic={showArabic}
        separator=""
        englishClassName="luxury-en"
        arabicClassName="luxury-ar"
      />
    </div>
  );
}

function DetailRow({
  labelAr,
  labelEn,
  value,
  showEnglish,
  showArabic,
  isTotal = false,
}: {
  labelAr: string;
  labelEn: string;
  value: string;
  showEnglish: boolean;
  showArabic: boolean;
  isTotal?: boolean;
}) {
  return (
    <div className={`luxury-field${isTotal ? " luxury-total-row" : ""}`}>
      <LocalizedPrintLabel
        en={labelEn}
        ar={labelAr}
        showEnglish={showEnglish}
        showArabic={showArabic}
        className="luxury-label"
        englishClassName="luxury-en"
        arabicClassName="luxury-ar"
      />
      <span className="luxury-value">{value}</span>
    </div>
  );
}

function SpecialSections({
  special,
  money,
  text,
  showEnglish,
  showArabic,
}: {
  special: NonNullable<InvoicePrintViewModel["special"]>;
  money: (value: number | undefined) => string;
  text: (value: string | number | undefined | null) => string;
  showEnglish: boolean;
  showArabic: boolean;
}) {
  return (
    <section className="luxury-special">
      {special.exchange && (
        <div className="luxury-box">
          <BoxTitle en="EXCHANGE SUMMARY" ar="ملخص الاستبدال" showEnglish={showEnglish} showArabic={showArabic} />
          <DetailRow labelAr="الفرق" labelEn="Difference" value={money(special.exchange.difference)} showEnglish={showEnglish} showArabic={showArabic} />
        </div>
      )}

      {special.installments && (
        <div className="luxury-box">
          <BoxTitle en="INSTALLMENT SUMMARY" ar="ملخص الأقساط" showEnglish={showEnglish} showArabic={showArabic} />
          <DetailRow labelAr="الدفعة المقدمة" labelEn="Down Payment" value={money(special.installments.downPayment)} showEnglish={showEnglish} showArabic={showArabic} />
          <DetailRow labelAr="الرصيد المتبقي" labelEn="Remaining Balance" value={money(special.installments.remainingBalance)} showEnglish={showEnglish} showArabic={showArabic} />
          <DetailRow labelAr="عدد الأقساط" labelEn="Installment Count" value={text(special.installments.installmentCount)} showEnglish={showEnglish} showArabic={showArabic} />
        </div>
      )}

      {special.deposit && (
        <div className="luxury-box">
          <BoxTitle en="DEPOSIT SUMMARY" ar="ملخص العربون" showEnglish={showEnglish} showArabic={showArabic} />
          <DetailRow labelAr="قيمة العربون" labelEn="Deposit Amount" value={money(special.deposit.depositAmount)} showEnglish={showEnglish} showArabic={showArabic} />
          <DetailRow labelAr="حالة العربون" labelEn="Deposit Status" value={text(special.deposit.depositStatus)} showEnglish={showEnglish} showArabic={showArabic} />
          <DetailRow labelAr={special.deposit.liabilityNoteAr ?? "العربون التزام على الشركة"} labelEn={special.deposit.liabilityNoteEn ?? "Deposit is a customer liability"} value="—" showEnglish={showEnglish} showArabic={showArabic} />
        </div>
      )}

      {special.giftVoucher && (
        <div className="luxury-box">
          <BoxTitle en="GIFT VOUCHER SUMMARY" ar="ملخص قسيمة الهدية" showEnglish={showEnglish} showArabic={showArabic} />
          <DetailRow labelAr="رقم القسيمة" labelEn="Voucher Number" value={text(special.giftVoucher.voucherNumber)} showEnglish={showEnglish} showArabic={showArabic} />
          <DetailRow labelAr="قيمة القسيمة" labelEn="Voucher Value" value={money(special.giftVoucher.voucherValue)} showEnglish={showEnglish} showArabic={showArabic} />
          <DetailRow labelAr="تاريخ الانتهاء" labelEn="Expiry Date" value={text(special.giftVoucher.expiryDate)} showEnglish={showEnglish} showArabic={showArabic} />
          <DetailRow labelAr={special.giftVoucher.redemptionPolicyAr ?? "الاستخدام الكامل فقط"} labelEn={special.giftVoucher.redemptionPolicyEn ?? "Full redemption only"} value="—" showEnglish={showEnglish} showArabic={showArabic} />
        </div>
      )}

      {special.customerGoldPurchase && (
        <div className="luxury-box">
          <BoxTitle en="CUSTOMER GOLD PURCHASE" ar="شراء ذهب من عميل" showEnglish={showEnglish} showArabic={showArabic} />
          <DetailRow labelAr="الوزن" labelEn="Gold Weight" value={text(special.customerGoldPurchase.goldWeight)} showEnglish={showEnglish} showArabic={showArabic} />
          <DetailRow labelAr="العيار" labelEn="Karat" value={text(special.customerGoldPurchase.karat)} showEnglish={showEnglish} showArabic={showArabic} />
          <DetailRow labelAr="سعر الشراء" labelEn="Purchase Rate" value={money(special.customerGoldPurchase.purchaseRate)} showEnglish={showEnglish} showArabic={showArabic} />
          <DetailRow labelAr={special.customerGoldPurchase.reversePurchaseNoteAr ?? "النظام هو المشتري"} labelEn={special.customerGoldPurchase.reversePurchaseNoteEn ?? "The system is the buyer"} value="—" showEnglish={showEnglish} showArabic={showArabic} />
        </div>
      )}
    </section>
  );
}

function getCompanyInitials(name: string) {
  const compact = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return compact || "—";
}

function getBrandDisplay(displayName: string) {
  const source = displayName.trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return { primary: source || displayName || "—", secondary: undefined };
  }

  return {
    primary: parts[0],
    secondary: parts.slice(1).join(" "),
  };
}
