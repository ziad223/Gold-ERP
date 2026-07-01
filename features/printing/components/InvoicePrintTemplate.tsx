import type { Invoice } from "@/lib/types";
import { getPublicFileUrl } from "@/lib/api/files";
import { formatAppMoney } from "@/lib/formatters/currency";
import { toEnglishDigits } from "@/lib/formatters/numbers";
import {
  buildInvoicePrintViewModel,
  type InvoicePrintViewModel,
} from "@/features/printing/lib/invoice-print-view-model";

export interface PrintCompany {
  name: string;
  logo?: string;
  branch?: string;
  trn?: string;
  currency: string;
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

interface InvoicePrintTemplateProps {
  invoice: Invoice;
  company: PrintCompany;
  cashierName?: string;
  locale: string;
  labels: InvoicePrintLabels;
  settings?: {
    currency: string;
    decimalPrecision: number;
    receipt?: any;
  };
  viewModel?: InvoicePrintViewModel;
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
    height: 297mm;
    max-height: 297mm;
    margin: 0 auto;
    padding: 6mm;
    background:
      linear-gradient(#fffefa, #fffefa) padding-box,
      linear-gradient(135deg, rgba(175, 132, 47, 0.92), rgba(238, 220, 167, 0.9), rgba(175, 132, 47, 0.92)) border-box;
    border: 2px solid transparent;
    color: var(--invoice-text);
    font-family: var(--invoice-font);
    direction: ltr;
    overflow: hidden;
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
    opacity: 0.04;
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
  labels,
  settings,
  viewModel,
}: InvoicePrintTemplateProps) {
  const receiptConfig = settings?.receipt || {};
  const precision = settings?.decimalPrecision ?? 2;
  const currency = settings?.currency ?? company.currency ?? "AED";
  const vm = viewModel ?? buildInvoicePrintViewModel(invoice, {
    company: {
      businessName: company.name,
      logo: company.logo,
      taxNumber: company.trn,
      phone: receiptConfig.phone,
      address: receiptConfig.address,
    },
    settings,
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
  const footerItems = [
    { icon: "☎", value: vm.company.phone },
    { icon: "⌖", value: vm.company.address },
    { icon: "✉", value: vm.company.email },
  ].filter((item): item is { icon: string; value: string } => Boolean(item.value));

  return (
    <article className="print-document print-page luxury-invoice" data-print-root>
      <style>{luxuryInvoiceStyles}</style>
      <span className="luxury-corner luxury-corner-top-start" />
      <span className="luxury-corner luxury-corner-top-end" />
      <span className="luxury-corner luxury-corner-bottom-start" />
      <span className="luxury-corner luxury-corner-bottom-end" />
      {vm.company.watermarkUrl && <img className="luxury-watermark" src={vm.company.watermarkUrl} alt="" />}

      <div className="luxury-content">
        <section className="luxury-brand-header" aria-label="Invoice header">
          <div className="luxury-logo-wrap">
            {vm.company.logoUrl ? (
              <img className="luxury-logo" src={vm.company.logoUrl} alt={companyNameEn} />
            ) : (
              <span className="luxury-initials">{companyInitials}</span>
            )}
          </div>

          <div className="luxury-brand-center">
            <h1 className="luxury-brand-name">{brand.primary}</h1>
            {brand.secondary && <p className="luxury-brand-subtitle">{brand.secondary}</p>}
            {companyNameEn !== brand.primary && companyNameEn !== brand.secondary && <p className="luxury-brand-en">{companyNameEn}</p>}
            <p className="luxury-brand-ar">{companyNameAr}</p>
            <div className="luxury-ornament" aria-hidden="true"><span className="luxury-diamond" /></div>
            <div className="luxury-document-title">
              <h3 className="luxury-ar">{vm.document.titleAr}</h3>
              <h2 className="luxury-en">{vm.document.titleEn}</h2>
            </div>
            <p className="luxury-trn">{labels.trn}: {text(vm.company.trn)}</p>
          </div>

          <div aria-hidden="true" />
        </section>

        <section className="luxury-details-row">
          <div className="luxury-box client-box">
            <BoxTitle en="CLIENT DETAILS" ar="بيانات العميل" />
            <DetailRow labelAr="اسم العميل" labelEn="Customer Name" value={text(vm.customer.name)} />
            <DetailRow labelAr="رقم الهاتف" labelEn="Mobile Number" value={text(vm.customer.phone)} />
            <DetailRow labelAr="الرقم الضريبي" labelEn="Customer TRN" value={text(vm.customer.trn)} />
            <DetailRow labelAr="العنوان" labelEn="Address" value={text(vm.customer.address)} />
          </div>

          <div className="luxury-box invoice-box">
            <BoxTitle en="INVOICE DETAILS" ar="بيانات الفاتورة" />
            <DetailRow labelAr="رقم الفاتورة" labelEn="Invoice No." value={text(vm.document.number)} />
            <DetailRow labelAr="تاريخ الفاتورة" labelEn="Invoice Date" value={text(vm.document.date)} />
            <DetailRow labelAr="نوع الفاتورة" labelEn="Invoice Type" value={`${vm.document.titleEn} / ${vm.document.titleAr}`} />
            <DetailRow labelAr="الحالة" labelEn="Status" value={text(vm.document.status)} />
            <DetailRow labelAr="حالة الاعتماد" labelEn="Post Status" value={text(vm.document.postingStatus)} />
            <DetailRow
              labelAr="الفاتورة الأصلية"
              labelEn="Original Invoice Ref"
              value={text(vm.document.originalInvoiceNumber ?? vm.document.originalInvoiceId)}
            />
            {cashierName && <DetailRow labelAr="البائع" labelEn="Salesperson" value={text(cashierName)} />}
          </div>
        </section>

        <section className="luxury-table-wrap">
          <table className="luxury-table">
            <thead>
              <tr>
                <th style={{ width: "10mm" }}><span className="luxury-en">Sr No.</span><br /><span className="luxury-ar">الرقم</span></th>
                <th><span className="luxury-en">Item Description</span><br /><span className="luxury-ar">وصف القطعة</span></th>
                <th style={{ width: "21mm" }}><span className="luxury-en">Gold Karat</span><br /><span className="luxury-ar">عيار الذهب</span></th>
                <th style={{ width: "21mm" }}><span className="luxury-en">Weight (g)</span><br /><span className="luxury-ar">الوزن (جرام)</span></th>
                <th style={{ width: "13mm" }}><span className="luxury-en">Qty</span><br /><span className="luxury-ar">الكمية</span></th>
                <th style={{ width: "25mm" }}><span className="luxury-en">Net Amount</span><br /><span className="luxury-ar">المبلغ الصافي</span></th>
                <th style={{ width: "25mm" }}><span className="luxury-en">VAT</span><br /><span className="luxury-ar">ضريبة القيمة المضافة</span></th>
                <th style={{ width: "27mm" }}><span className="luxury-en">Total Amount</span><br /><span className="luxury-ar">المبلغ الإجمالي</span></th>
              </tr>
            </thead>
            <tbody>
              {vm.items.map((item) => (
                <tr key={`${item.id ?? item.assetId ?? item.index}-${item.index}`}>
                  <td>{text(item.index)}</td>
                  <td className="description-cell">
                    <strong>{text(item.description)}</strong>
                    {item.assetId && <div className="luxury-asset-line">{labels.assetId}: {text(item.assetId)}</div>}
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

        {vm.special && <SpecialSections special={vm.special} money={money} text={text} />}

        <section className="luxury-summary-row">
          <div className="luxury-box payment-box">
            <BoxTitle en="PAYMENT METHOD" ar="طريقة الدفع" />
            <ul className="luxury-payment-list">
              {vm.payments.map((payment, index) => (
                <li key={`${payment.method}-${index}`}>
                  <span>{payment.methodLabelEn} / {payment.methodLabelAr}</span>
                  <strong>{payment.amount === undefined ? "—" : money(payment.amount)}</strong>
                </li>
              ))}
            </ul>
          </div>

          <div className="luxury-box amount-box">
            <BoxTitle en="AMOUNT DETAILS" ar="تفاصيل المبلغ" />
            <DetailRow labelAr="الصافي" labelEn="Net / Subtotal" value={money(vm.totals.subtotal)} />
            <DetailRow labelAr="الخصم" labelEn="Discount" value={money(vm.totals.discount)} />
            <DetailRow labelAr="نسبة الضريبة" labelEn="VAT Rate" value={percent(vm.totals.vatRate)} />
            <DetailRow labelAr="قيمة الضريبة" labelEn="VAT Amount" value={money(vm.totals.vatAmount)} />
            <DetailRow labelAr="المبلغ الإجمالي" labelEn="Total Amount" value={money(vm.totals.totalAmount)} isTotal />
            <DetailRow labelAr="المدفوع" labelEn="Paid Amount" value={money(vm.totals.paidAmount)} />
            <DetailRow labelAr="المتبقي" labelEn="Remaining Amount" value={money(vm.totals.remainingAmount)} />
          </div>
        </section>

        <div className="luxury-tail">
          <section className="luxury-box luxury-notes-box">
            <BoxTitle en="NOTES" ar="ملاحظات" />
            <div className="luxury-notes-lines">
              {vm.notes ? vm.notes : <div className="luxury-notes-empty" />}
            </div>
          </section>

          {receiptConfig.termsMessage && (
            <section className="luxury-box luxury-notes-box">
              <BoxTitle en="TERMS" ar="الشروط والأحكام" />
              <div className="luxury-notes-lines">{receiptConfig.termsMessage}</div>
            </section>
          )}

          <section className="luxury-signatures">
            <div className="luxury-signature"><span className="luxury-en">Customer Signature</span> | <span className="luxury-ar">توقيع العميل</span></div>
            <div className="luxury-signature"><span className="luxury-en">Company Stamp</span> | <span className="luxury-ar">ختم الشركة</span></div>
            <div className="luxury-signature"><span className="luxury-en">Salesperson Signature</span> | <span className="luxury-ar">توقيع المبيعات</span></div>
          </section>

          {footerItems.length > 0 && (
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

function BoxTitle({ en, ar }: { en: string; ar: string }) {
  return (
    <div className="luxury-box-title">
      <span className="luxury-en">{en}</span>
      <span className="luxury-ar">{ar}</span>
    </div>
  );
}

function DetailRow({
  labelAr,
  labelEn,
  value,
  isTotal = false,
}: {
  labelAr: string;
  labelEn: string;
  value: string;
  isTotal?: boolean;
}) {
  return (
    <div className={`luxury-field${isTotal ? " luxury-total-row" : ""}`}>
      <span className="luxury-label"><span className="luxury-en">{labelEn}</span> | <span className="luxury-ar">{labelAr}</span></span>
      <span className="luxury-value">{value}</span>
    </div>
  );
}

function SpecialSections({
  special,
  money,
  text,
}: {
  special: NonNullable<InvoicePrintViewModel["special"]>;
  money: (value: number | undefined) => string;
  text: (value: string | number | undefined | null) => string;
}) {
  return (
    <section className="luxury-special">
      {special.exchange && (
        <div className="luxury-box">
          <BoxTitle en="EXCHANGE SUMMARY" ar="ملخص الاستبدال" />
          <DetailRow labelAr="الفرق" labelEn="Difference" value={money(special.exchange.difference)} />
        </div>
      )}

      {special.installments && (
        <div className="luxury-box">
          <BoxTitle en="INSTALLMENT SUMMARY" ar="ملخص الأقساط" />
          <DetailRow labelAr="الدفعة المقدمة" labelEn="Down Payment" value={money(special.installments.downPayment)} />
          <DetailRow labelAr="الرصيد المتبقي" labelEn="Remaining Balance" value={money(special.installments.remainingBalance)} />
          <DetailRow labelAr="عدد الأقساط" labelEn="Installment Count" value={text(special.installments.installmentCount)} />
        </div>
      )}

      {special.deposit && (
        <div className="luxury-box">
          <BoxTitle en="DEPOSIT SUMMARY" ar="ملخص العربون" />
          <DetailRow labelAr="قيمة العربون" labelEn="Deposit Amount" value={money(special.deposit.depositAmount)} />
          <DetailRow labelAr="حالة العربون" labelEn="Deposit Status" value={text(special.deposit.depositStatus)} />
          <DetailRow labelAr={special.deposit.liabilityNoteAr ?? "العربون التزام على الشركة"} labelEn={special.deposit.liabilityNoteEn ?? "Deposit is a customer liability"} value="—" />
        </div>
      )}

      {special.giftVoucher && (
        <div className="luxury-box">
          <BoxTitle en="GIFT VOUCHER SUMMARY" ar="ملخص قسيمة الهدية" />
          <DetailRow labelAr="رقم القسيمة" labelEn="Voucher Number" value={text(special.giftVoucher.voucherNumber)} />
          <DetailRow labelAr="قيمة القسيمة" labelEn="Voucher Value" value={money(special.giftVoucher.voucherValue)} />
          <DetailRow labelAr="تاريخ الانتهاء" labelEn="Expiry Date" value={text(special.giftVoucher.expiryDate)} />
          <DetailRow labelAr={special.giftVoucher.redemptionPolicyAr ?? "الاستخدام الكامل فقط"} labelEn={special.giftVoucher.redemptionPolicyEn ?? "Full redemption only"} value="—" />
        </div>
      )}

      {special.customerGoldPurchase && (
        <div className="luxury-box">
          <BoxTitle en="CUSTOMER GOLD PURCHASE" ar="شراء ذهب من عميل" />
          <DetailRow labelAr="الوزن" labelEn="Gold Weight" value={text(special.customerGoldPurchase.goldWeight)} />
          <DetailRow labelAr="العيار" labelEn="Karat" value={text(special.customerGoldPurchase.karat)} />
          <DetailRow labelAr="سعر الشراء" labelEn="Purchase Rate" value={money(special.customerGoldPurchase.purchaseRate)} />
          <DetailRow labelAr={special.customerGoldPurchase.reversePurchaseNoteAr ?? "النظام هو المشتري"} labelEn={special.customerGoldPurchase.reversePurchaseNoteEn ?? "The system is the buyer"} value="—" />
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

function getBrandDisplay(displayName: string, englishName?: string) {
  const source = (englishName || displayName).trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return { primary: source || displayName || "—", secondary: undefined };
  }

  return {
    primary: parts[0],
    secondary: parts.slice(1).join(" "),
  };
}
