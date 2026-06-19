"use client";

import { useLocale, useTranslations } from "next-intl";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ReceiptPrintTemplate } from "@/features/printing/components/ReceiptPrintTemplate";
import { renderPrintDocument } from "@/features/printing/components/render-print-document";
import { printHtmlDocument } from "@/lib/print/print-service";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useReceiptSettings } from "@/hooks/use-receipt-settings";
import { useAppSettings } from "@/contexts/settings-context";
import type { Invoice } from "@/lib/types";
import { getPublicFileUrl } from "@/lib/api/files";

interface ReceiptPreviewProps {
  invoice: Invoice;
  companyName?: string;
  cashierName?: string;
  onClose?: () => void;
}

export function ReceiptPreview({
  invoice,
  companyName = "DARFUS Jewellery",
  cashierName = "Admin Cashier",
  onClose,
}: ReceiptPreviewProps) {
  const t = useTranslations("POS");
  const printT = useTranslations("PrintExport");
  const locale = useLocale();
  const rtl = locale === "ar";
  const { company } = useAuth();
  const { config } = useReceiptSettings();
  const { settings } = useAppSettings();
  const logoUrl = getPublicFileUrl(company?.logo || settings?.logo);

  const currency = company?.currency ?? settings?.currency ?? "AED"; // dynamic — from company settings
  const money = (val: number) => formatCurrency(val, currency, locale);

  const isInstallment = invoice.paymentMethod === "installment" || invoice.type === "installment";

  const handlePrint = () => {
    const rawPaperSize = settings?.receipt?.paperSize || config.paperSize || "thermal";
    const mappedPaperSize = rawPaperSize === "A4" ? "A4" : rawPaperSize === "A5" ? "A5" : "80mm";

    const html = renderPrintDocument(
      <ReceiptPrintTemplate
        invoice={invoice}
        company={{ name: companyName, currency, logo: company?.logo || settings?.logo }}
        cashierName={cashierName}
        locale={locale}
        labels={{
          receipt: printT("receipt"),
          branch: t("branch"),
          date: t("date"),
          invoiceNo: t("invoiceNo"),
          cashier: t("cashier"),
          customer: t("customer"),
          payment: t("payment"),
          item: t("item"),
          qty: t("qty"),
          rate: t("rate"),
          subtotal: t("subtotal"),
          makingCharge: t("makingCharge"),
          stoneValue: t("stoneValue"),
          discount: t("discount"),
          vatAmount: t("vatAmount"),
          total: t("total"),
          footer: t("terms"),
        }}
        settings={settings}
      />,
      {
        documentType: "receipt",
        paperSize: mappedPaperSize,
        title: `${printT("printReceipt")} ${invoice.id}`,
        locale,
      },
    );
    const result = printHtmlDocument(html, {
      documentType: "receipt",
      paperSize: mappedPaperSize,
      title: `${printT("printReceipt")} ${invoice.id}`,
      locale,
    });

    if (!result.ok) {
      toast.error(result.errorCode === "popup-blocked" ? printT("popupBlocked") : printT("printFailed"));
    }
  };

  // Compute base subtotal (sum of items list price)
  const items = invoice.items ?? [];
  const baseSubtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  return (
    <div className="flex flex-col items-center">
      {/* Action Buttons (Hidden during printing) */}
      <div className="no-print mb-6 flex gap-3 w-full justify-end" data-no-print="true">
        {onClose && (
          <Button variant="secondary" onClick={onClose}>
            {t("clear")}
          </Button>
        )}
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          {t("printReceipt")}
        </Button>
      </div>

      {/* Styled Receipt Preview */}
      <div
        id="print-receipt-container"
        className="w-full max-w-[380px] bg-white text-slate-900 border border-slate-200 shadow-md p-6 rounded-2xl font-sans text-sm print:border-0 print:shadow-none print:max-w-none print:p-0 print:w-[80mm] print:mx-auto"
        dir={rtl ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="text-center border-b border-dashed border-slate-300 pb-4 mb-4">
          {config.showLogo && logoUrl && (
            <img src={logoUrl} alt={companyName} className="mx-auto mb-2 h-14 w-14 rounded-xl bg-white object-contain" />
          )}
          <h2 className="text-lg font-black tracking-tight">{companyName}</h2>
          {config.headerNote && <p className="text-[11px] text-slate-500 mt-0.5">{config.headerNote}</p>}
          {config.welcomeMessage && <p className="text-xs font-semibold text-slate-700 mt-1">{config.welcomeMessage}</p>}
          {config.address && <p className="text-[10px] text-slate-400 mt-1">{config.address}</p>}
          {config.phone && <p className="text-[10px] text-slate-400">{config.phone}</p>}
          {config.showVatNumber && config.vatNumber && (
            <p className="text-[10px] text-slate-400">{rtl ? "الرقم الضريبي" : "VAT No."}: {config.vatNumber}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">
            {t("branch")}: {invoice.branch}
          </p>
          <p className="text-[10px] text-slate-400">
            {t("date")}: {invoice.date}
          </p>
        </div>

        {/* Metadata */}
        <div className="space-y-1 text-xs text-slate-600 border-b border-dashed border-slate-300 pb-3 mb-3">
          <div className="flex justify-between">
            <span className="font-semibold">{t("invoiceNo")}:</span>
            <span className="font-mono font-bold text-slate-900">{invoice.id}</span>
          </div>
          {config.showCashier && (
            <div className="flex justify-between">
              <span className="font-semibold">{t("cashier")}:</span>
              <span>{cashierName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="font-semibold">{t("customer")}:</span>
            <span className="font-bold text-slate-900">{invoice.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">{t("payment")}:</span>
            <span>{invoice.paymentMethod}</span>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-left text-xs mb-4 border-b border-dashed border-slate-300" dir={rtl ? "rtl" : "ltr"}>
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className={`pb-2 ${rtl ? "text-right" : "text-left"}`}>{t("item")}</th>
              <th className="pb-2 text-center w-12">{t("qty")}</th>
              <th className={`pb-2 ${rtl ? "text-left" : "text-right"} w-24`}>{t("rate")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className={`py-2 align-top ${rtl ? "text-right" : "text-left"}`}>
                  <span className="font-bold text-slate-900 block">{item.name}</span>
                  {item.weight && (
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {item.weight} {t("gram")} · {item.karat}K
                    </span>
                  )}
                </td>
                <td className="py-2 text-center align-top">{item.quantity}</td>
                <td className={`py-2 align-top ${rtl ? "text-left" : "text-right"} font-bold text-slate-900`}>
                  {money(item.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Financials Breakdown */}
        <div className="space-y-2 text-xs border-b border-dashed border-slate-300 pb-3 mb-4">
          <div className="flex justify-between text-slate-600">
            <span>{t("subtotal")}</span>
            <span>{money(baseSubtotal)}</span>
          </div>
          {Number(invoice.makingCharge) > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>{t("makingCharge")}</span>
              <span>+{money(Number(invoice.makingCharge))}</span>
            </div>
          )}
          {Number(invoice.stoneValue) > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>{t("stoneValue")}</span>
              <span>+{money(Number(invoice.stoneValue))}</span>
            </div>
          )}
          {Number(invoice.discount) > 0 && (
            <div className="flex justify-between text-rose-600 font-medium">
              <span>{t("discount")}</span>
              <span>-{money(Number(invoice.discount))}</span>
            </div>
          )}
          {Number(invoice.tax) > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>{t("vatAmount")}{invoice.vatRate ? ` (${Number(invoice.vatRate)}%)` : ""}</span>
              <span>{money(Number(invoice.tax))}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
            <span>{t("total")}</span>
            <span>{money(invoice.total)}</span>
          </div>
        </div>

        {/* Installment details */}
        {isInstallment && (
          <div className="space-y-2 text-xs border-b border-dashed border-slate-300 pb-3 mb-4">
            <p className="font-bold text-slate-700">{t("installmentDetails")}</p>
            {Number(invoice.downPayment) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>{t("downPayment")}</span>
                <span>{money(Number(invoice.downPayment))}</span>
              </div>
            )}
            {Number(invoice.remainingAmount) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>{t("remainingAmount")}</span>
                <span>{money(Number(invoice.remainingAmount))}</span>
              </div>
            )}
            {Number(invoice.installmentCount) > 0 && (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>{t("installmentCount")}</span>
                  <span>{Number(invoice.installmentCount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{t("installmentAmount")}</span>
                  <span>{money(Math.round((Number(invoice.remainingAmount) / Number(invoice.installmentCount)) * 100) / 100)}</span>
                </div>
              </>
            )}
            {invoice.installments && invoice.installments.length > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>{t("firstDueDate")}</span>
                <span>{invoice.installments[0].dueDate}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer: thank-you message, barcode & terms */}
        <div className="text-center space-y-3">
          {config.footerMessage && (
            <p className="text-xs font-bold text-slate-700">{config.footerMessage}</p>
          )}
          {config.showBarcode && (
            <div className="flex flex-col items-center justify-center">
              {/* Simple barcode placeholder styling */}
              <div className="h-8 bg-slate-900 w-48 flex items-center justify-between px-2 text-white font-mono text-[9px] tracking-[4px] select-none opacity-85">
                |||||I||||||I|||||I||
              </div>
              <span className="text-[9px] font-mono text-slate-400 mt-1">{invoice.id}</span>
            </div>
          )}

          <p className="text-[10px] text-slate-400 px-2 leading-relaxed border-t border-slate-100 pt-2">
            {config.termsMessage || t("terms")}
          </p>
        </div>
      </div>
    </div>
  );
}
