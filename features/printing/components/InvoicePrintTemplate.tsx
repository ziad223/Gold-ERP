import type { Invoice } from "@/lib/types";
import { getPublicFileUrl } from "@/lib/api/files";
import { formatAppMoney } from "@/lib/formatters/currency";
import { toEnglishDigits } from "@/lib/formatters/numbers";

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
}

export function InvoicePrintTemplate({ invoice, company, cashierName, locale, labels, settings }: InvoicePrintTemplateProps) {
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
    <article className="print-document print-page" data-print-root>
      <header className="print-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="print-title">{labels.invoice}</h1>
          {showCompanyName && <p className="print-subtitle">{company.name}</p>}
          {showBranchInfo && <p className="print-subtitle">{labels.branch}: {toEnglishDigits(invoice.branch || company.branch || "-")}</p>}
          {showTaxNumber && company.trn && <p className="print-subtitle">{labels.trn}: {toEnglishDigits(company.trn)}</p>}
          {showAddress && receiptConfig.address && <p className="print-subtitle">{receiptConfig.address}</p>}
          {showPhone && receiptConfig.phone && <p className="print-subtitle">{toEnglishDigits(receiptConfig.phone)}</p>}
        </div>
        {showLogo && company.logo && (
          <img 
            className="print-logo" 
            src={getPublicFileUrl(company.logo)} 
            alt={company.name} 
            style={{ maxHeight: 60, objectFit: "contain" }}
          />
        )}
      </header>

      <section className="print-grid print-section">
        <div className="print-field"><strong>{labels.invoiceNo}</strong><span>{toEnglishDigits(invoice.invoiceNumber || invoice.id)}</span></div>
        <div className="print-field"><strong>{labels.uuid}</strong><span>{toEnglishDigits(invoice.idempotencyKey ?? "-")}</span></div>
        <div className="print-field"><strong>{labels.date}</strong><span>{formattedDate}</span></div>
        {showCustomerInfo && (
          <div className="print-field"><strong>{labels.customer}</strong><span>{invoice.customerName}</span></div>
        )}
        {showCashier && (
          <div className="print-field"><strong>{labels.cashier}</strong><span>{cashierName ?? "-"}</span></div>
        )}
        <div className="print-field"><strong>{labels.payment}</strong><span>{invoice.paymentMethod}</span></div>
      </section>

      <section className="print-section" style={{ marginTop: 14 }}>
        <table className="print-table">
          <thead>
            <tr>
              <th>{labels.assetId}</th>
              <th>{labels.description}</th>
              <th>{labels.weight}</th>
              <th>{labels.karat}</th>
              <th>{labels.qty}</th>
              <th>{labels.price}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.assetId}>
                <td>{toEnglishDigits(item.assetId)}</td>
                <td>{item.name}</td>
                <td>{item.weight ? toEnglishDigits(item.weight) : "-"}</td>
                <td>{item.karat ? `${toEnglishDigits(item.karat)}K` : "-"}</td>
                <td>{toEnglishDigits(item.quantity)}</td>
                <td>{money(item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="print-section" style={{ marginTop: 14, marginInlineStart: "auto", width: "min(100%, 310px)" }}>
        <div className="print-field"><strong>{labels.subtotal}</strong><span>{money(subtotal)}</span></div>
        <div className="print-field"><strong>{labels.makingCharge}</strong><span>{money(invoice.makingCharge)}</span></div>
        <div className="print-field"><strong>{labels.stoneValue}</strong><span>{money(invoice.stoneValue)}</span></div>
        <div className="print-field"><strong>{labels.discount}</strong><span>{money(invoice.discount)}</span></div>
        {showVatBreakdown && (
          <div className="print-field"><strong>{labels.vat}{invoice.vatRate ? ` (${toEnglishDigits(Number(invoice.vatRate))}%)` : ""}</strong><span>{money(invoice.tax)}</span></div>
        )}
        <div className="print-field print-total-row"><strong>{labels.total}</strong><span>{money(invoice.total)}</span></div>
        <div className="print-field"><strong>{labels.remaining}</strong><span>{money(remaining)}</span></div>
      </section>

      {invoice.paymentMethod === "split" && invoice.paymentSplits && invoice.paymentSplits.length > 0 && (
        <section className="print-section" style={{ marginTop: 14 }}>
          <h3 style={{ fontSize: "1.1rem", borderBottom: "1px solid #ddd", paddingBottom: 4 }}>تفاصيل الدفع المجزأ / Split Payment Details</h3>
          <table className="print-table" style={{ width: "100%", marginTop: 4 }}>
            <thead>
              <tr>
                <th>طريقة الدفع / Method</th>
                <th>المبلغ / Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.paymentSplits.map((split, i) => (
                <tr key={i}>
                  <td>{split.method}</td>
                  <td>{money(split.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {invoice.paymentMethod === "installment" && (
        <section className="print-section" style={{ marginTop: 14 }}>
          <h3 style={{ fontSize: "1.1rem", borderBottom: "1px solid #ddd", paddingBottom: 4 }}>جدول الأقساط / Installment Schedule</h3>
          {invoice.guarantorName && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBlock: 8 }}>
              <div><strong>الضامن / Guarantor:</strong> {invoice.guarantorName}</div>
              {invoice.guarantorPhone && <div><strong>هاتف الضامن / Phone:</strong> {toEnglishDigits(invoice.guarantorPhone)}</div>}
            </div>
          )}
          {invoice.installments && invoice.installments.length > 0 && (
            <table className="print-table" style={{ width: "100%", marginTop: 4 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>تاريخ الاستحقاق / Due Date</th>
                  <th>المبلغ / Amount</th>
                  <th>الحالة / Status</th>
                </tr>
              </thead>
              <tbody>
                {invoice.installments.map((inst) => (
                  <tr key={inst.id}>
                    <td>{toEnglishDigits(inst.sequence)}</td>
                    <td>{toEnglishDigits(inst.dueDate)}</td>
                    <td>{money(inst.amount)}</td>
                    <td>{inst.status === "paid" ? "مدفوع / Paid" : "معلق / Pending"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {invoice.notes && (
        <section className="print-section" style={{ marginTop: 14 }}>
          <strong>{labels.notes}</strong>
          <p>{invoice.notes}</p>
        </section>
      )}

      {receiptConfig.footerMessage && (
        <section className="print-section" style={{ marginTop: 14, textAlign: "center" }}>
          <p style={{ fontSize: "0.9rem", fontWeight: "bold" }}>{receiptConfig.footerMessage}</p>
        </section>
      )}

      {receiptConfig.termsMessage && (
        <section className="print-section" style={{ marginTop: 14, fontSize: "0.85rem" }}>
          <strong>الشروط والأحكام / Terms:</strong>
          <p style={{ whiteSpace: "pre-line", marginTop: 4 }}>{receiptConfig.termsMessage}</p>
        </section>
      )}
    </article>
  );
}
