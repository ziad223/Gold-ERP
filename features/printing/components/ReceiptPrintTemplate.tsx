import type { Invoice } from "@/lib/types";
import type { PrintCompany } from "./InvoicePrintTemplate";
import { getPublicFileUrl } from "@/lib/api/files";
import { formatAppMoney } from "@/lib/formatters/currency";
import { toEnglishDigits } from "@/lib/formatters/numbers";

export interface ReceiptPrintLabels {
  receipt: string;
  branch: string;
  date: string;
  invoiceNo: string;
  cashier: string;
  customer: string;
  payment: string;
  item: string;
  qty: string;
  rate: string;
  subtotal: string;
  makingCharge: string;
  stoneValue: string;
  discount: string;
  vatAmount: string;
  total: string;
  footer: string;
}

interface ReceiptPrintTemplateProps {
  invoice: Invoice;
  company: PrintCompany;
  cashierName?: string;
  locale: string;
  labels: ReceiptPrintLabels;
  settings?: {
    currency: string;
    decimalPrecision: number;
    receipt?: any;
  };
}

export function ReceiptPrintTemplate({ invoice, company, cashierName, locale, labels, settings }: ReceiptPrintTemplateProps) {
  const receiptConfig = settings?.receipt || {};
  const showLogo = receiptConfig.showLogo !== false;
  const showCompanyName = receiptConfig.showCompanyName !== false;
  const showTaxNumber = receiptConfig.showTaxNumber !== false;
  const showAddress = receiptConfig.showAddress !== false;
  const showPhone = receiptConfig.showPhone !== false;
  const showCashier = receiptConfig.showCashier !== false;
  const showBarcode = receiptConfig.showBarcode !== false;
  const showVatBreakdown = receiptConfig.showVatBreakdown !== false;
  const showCustomerInfo = receiptConfig.showCustomerInfo !== false;
  const showBranchInfo = receiptConfig.showBranchInfo !== false;

  const precision = settings?.decimalPrecision ?? 2;
  const currency = settings?.currency ?? company.currency ?? "AED";
  const money = (value: number | undefined) => formatAppMoney(Number(value ?? 0), currency, precision);

  const subtotal = invoice.subtotal ?? invoice.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const paid = invoice.paidAmount ?? invoice.paymentSplits?.reduce((sum, payment) => sum + payment.amount, 0) ?? invoice.total;
  const remaining = invoice.remainingAmount ?? Math.max(invoice.total - paid, 0);

  const formattedDate = toEnglishDigits(invoice.postedAt ?? invoice.date);

  return (
    <article className="print-document receipt-print" data-print-root>
      <header style={{ textAlign: "center", borderBottom: "1px dashed #94a3b8", paddingBottom: "3mm", marginBottom: "3mm" }}>
        {showLogo && company.logo && (
          <img 
            src={getPublicFileUrl(company.logo)} 
            alt={company.name} 
            style={{ maxHeight: 40, objectFit: "contain", marginBottom: "2mm", display: "inline-block" }}
          />
        )}
        {showCompanyName && (
          <h1 className="print-title" style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{company.name}</h1>
        )}
        {receiptConfig.welcomeMessage && (
          <p className="print-subtitle" style={{ fontSize: "0.85rem", fontWeight: "bold", marginBlock: "1mm" }}>
            {receiptConfig.welcomeMessage}
          </p>
        )}
        {receiptConfig.headerNote && (
          <p className="print-subtitle" style={{ fontSize: "0.8rem", marginBlock: "0.5mm" }}>
            {receiptConfig.headerNote}
          </p>
        )}
        {showBranchInfo && (
          <p className="print-subtitle">{labels.branch}: {toEnglishDigits(invoice.branch || company.branch || "-")}</p>
        )}
        <p className="print-subtitle">{labels.date}: {formattedDate}</p>
        {showAddress && receiptConfig.address && (
          <p className="print-subtitle" style={{ fontSize: "0.8rem" }}>{receiptConfig.address}</p>
        )}
        {showPhone && receiptConfig.phone && (
          <p className="print-subtitle" style={{ fontSize: "0.8rem" }}>{toEnglishDigits(receiptConfig.phone)}</p>
        )}
        {receiptConfig.showVatNumber && receiptConfig.vatNumber && (
          <p className="print-subtitle" style={{ fontSize: "0.8rem" }}>
            {locale === "ar" ? "الرقم الضريبي" : "VAT No."}: {toEnglishDigits(receiptConfig.vatNumber)}
          </p>
        )}
      </header>

      <section>
        <div className="print-field"><strong>{labels.invoiceNo}</strong><span>{toEnglishDigits(invoice.id)}</span></div>
        {showCashier && (
          <div className="print-field"><strong>{labels.cashier}</strong><span>{cashierName ?? "-"}</span></div>
        )}
        {showCustomerInfo && (
          <div className="print-field"><strong>{labels.customer}</strong><span>{invoice.customerName}</span></div>
        )}
        <div className="print-field"><strong>{labels.payment}</strong><span>{invoice.paymentMethod}</span></div>
      </section>

      <table className="print-table" style={{ marginTop: "3mm", width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px dashed #ccc" }}>
            <th style={{ textAlign: "right" }}>{labels.item}</th>
            <th style={{ textAlign: "center" }}>{labels.qty}</th>
            <th style={{ textAlign: "left" }}>{labels.rate}</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.assetId} style={{ borderBottom: "1px dashed #eee" }}>
              <td style={{ textAlign: "right", padding: "1mm 0" }}>
                <strong>{item.name}</strong>
                <br />
                <span className="print-muted" style={{ fontSize: "0.8rem" }}>
                  {item.weight ? `${toEnglishDigits(item.weight)}g` : ""} {item.karat ? `${toEnglishDigits(item.karat)}K` : ""}
                </span>
              </td>
              <td style={{ textAlign: "center", padding: "1mm 0" }}>{toEnglishDigits(item.quantity)}</td>
              <td style={{ textAlign: "left", padding: "1mm 0" }}>{money(item.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section style={{ marginTop: "3mm" }}>
        <div className="print-field"><strong>{labels.subtotal}</strong><span>{money(subtotal)}</span></div>
        {!!invoice.makingCharge && <div className="print-field"><strong>{labels.makingCharge}</strong><span>{money(invoice.makingCharge)}</span></div>}
        {!!invoice.stoneValue && <div className="print-field"><strong>{labels.stoneValue}</strong><span>{money(invoice.stoneValue)}</span></div>}
        {!!invoice.discount && <div className="print-field"><strong>{labels.discount}</strong><span>{money(invoice.discount)}</span></div>}
        {showVatBreakdown && !!invoice.tax && (
          <div className="print-field">
            <strong>{labels.vatAmount}{invoice.vatRate ? ` (${toEnglishDigits(Number(invoice.vatRate))}%)` : ""}</strong>
            <span>{money(invoice.tax)}</span>
          </div>
        )}
        <div className="print-field print-total-row" style={{ fontWeight: "bold", borderTop: "1px dashed #000", borderBottom: "1px dashed #000", padding: "1mm 0" }}>
          <strong>{labels.total}</strong><span>{money(invoice.total)}</span>
        </div>
        <div className="print-field"><strong>المدفوع / Paid</strong><span>{money(paid)}</span></div>
        <div className="print-field"><strong>المتبقي / Remaining</strong><span>{money(remaining)}</span></div>
      </section>

      {invoice.paymentMethod === "split" && invoice.paymentSplits && invoice.paymentSplits.length > 0 && (
        <section style={{ marginTop: "3mm", borderTop: "1px dashed #ccc", paddingTop: "2mm" }}>
          <strong style={{ fontSize: "0.9rem" }}>تفاصيل الدفع المجزأ / Splits:</strong>
          {invoice.paymentSplits.map((split, i) => (
            <div key={i} className="print-field" style={{ fontSize: "0.85rem" }}>
              <span>{split.method}</span>
              <span>{money(split.amount)}</span>
            </div>
          ))}
        </section>
      )}

      {invoice.paymentMethod === "installment" && (
        <section style={{ marginTop: "3mm", borderTop: "1px dashed #ccc", paddingTop: "2mm" }}>
          <strong style={{ fontSize: "0.9rem" }}>جدول الأقساط / Installments:</strong>
          {invoice.guarantorName && (
            <div style={{ fontSize: "0.8rem", marginBlock: "1mm" }}>
              <div>الضامن: {invoice.guarantorName}</div>
              {invoice.guarantorPhone && <div>هاتف الضامن: {toEnglishDigits(invoice.guarantorPhone)}</div>}
            </div>
          )}
          {invoice.installments && invoice.installments.map((inst) => (
            <div key={inst.id} className="print-field" style={{ fontSize: "0.8rem" }}>
              <span>قسط {toEnglishDigits(inst.sequence)} ({toEnglishDigits(inst.dueDate)})</span>
              <span>{money(inst.amount)} ({inst.status === "paid" ? "مدفوع" : "معلق"})</span>
            </div>
          ))}
        </section>
      )}

      <footer style={{ marginTop: "4mm", textAlign: "center", borderTop: "1px dashed #94a3b8", paddingTop: "2mm" }}>
        {showBarcode && (
          <div className="barcode-text" style={{ letterSpacing: 2, fontSize: "0.9rem", fontWeight: "bold" }}>{toEnglishDigits(invoice.id)}</div>
        )}
        <p className="print-subtitle" style={{ fontSize: "0.8rem", marginTop: "1mm" }}>{receiptConfig.footerMessage || labels.footer}</p>
        {receiptConfig.termsMessage && (
          <p className="print-subtitle" style={{ fontSize: "0.75rem", marginTop: "1mm", whiteSpace: "pre-line" }}>{receiptConfig.termsMessage}</p>
        )}
      </footer>
    </article>
  );
}
