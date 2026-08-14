"use client";

import { useMemo } from "react";
import { Scale, CheckCircle2, AlertTriangle, Landmark } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface JournalPreviewProps {
  total: number;
  tax: number;
  cost: number;
  paymentMethod: string;
  currency: string;
  locale?: string;
}

export function JournalPreview({
  total,
  tax,
  cost,
  paymentMethod,
  currency,
  locale = "ar"
}: JournalPreviewProps) {
  const rtl = locale === "ar";

  const subtotal = total - tax;

  const entries = useMemo(() => {
    // Resolve the debit-side account from the payment method, mirroring the
    // backend posting engine: cash → Till, card/bank/transfer → Bank,
    // credit/due → Accounts Receivable.
    const method = String(paymentMethod).toLowerCase();
    const isCredit = ["due", "partial", "installment", "credit", "آجل"].some((k) => method.includes(k));
    const isBank = ["card", "bank", "transfer", "شبك", "تحويل", "بطاق"].some((k) => method.includes(k));
    const debitAccount = isCredit
      ? (rtl ? "حساب مدينو المبيعات (العملاء)" : "Accounts Receivable (Customer)")
      : isBank
        ? (rtl ? "الحسابات البنكية" : "Bank Accounts")
        : (rtl ? "نقدية في الصندوق (الخزينة)" : "Cash in Hand (Till)");

    const lines = [
      // 1. Cash / Bank / Accounts Receivable (Debit)
      {
        account: debitAccount,
        debit: total,
        credit: 0
      },
      // 2. Cost of Goods Sold (Debit)
      {
        account: rtl ? "تكلفة المبيعات (أصول ذهب مبيعة)" : "Cost of Goods Sold (Gold)",
        debit: cost,
        credit: 0
      },
      // 3. Gold Inventory (Credit)
      {
        account: rtl ? "مخزون أصول الذهب والمجوهرات" : "Asset Inventory (Gold Stock)",
        debit: 0,
        credit: cost
      },
      // 4. Revenue (Credit)
      {
        account: rtl ? "إيرادات مبيعات المجوهرات" : "Jewellery Sales Revenue",
        debit: 0,
        credit: subtotal
      }
    ];

    // 5. VAT Output Liability (Credit) - only if tax > 0
    if (tax > 0) {
      lines.push({
        account: rtl ? "ضريبة مخرجات مستحقة للهيئة" : "VAT Output Liability (FTA)",
        debit: 0,
        credit: tax
      });
    }

    return lines;
  }, [total, tax, cost, paymentMethod, subtotal, rtl]);

  const totalDebit = useMemo(() => entries.reduce((sum, item) => sum + item.debit, 0), [entries]);
  const totalCredit = useMemo(() => entries.reduce((sum, item) => sum + item.credit, 0), [entries]);
  const isBalanced = totalDebit === totalCredit;

  return (
    <div className="rounded-3xl border border-border bg-panel p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h4 className="text-xs font-black text-foreground flex items-center gap-2">
          <Landmark className="h-4.5 w-4.5 text-brand-600" />
          {rtl ? "معاينة القيد المحاسبي المزدوج التلقائي" : "Automatic Double-Entry Journal Preview"}
        </h4>
        <div className="flex items-center gap-1">
          <Scale className={`h-4 w-4 ${isBalanced ? "text-emerald-500" : "text-rose-500 animate-spin"}`} />
          <span className="text-[10px] font-bold text-muted">
            {isBalanced ? (rtl ? "متزن" : "Balanced") : (rtl ? "غير متزن" : "Out of balance")}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-start text-[11px] leading-5">
          <thead className="text-muted">
            <tr className="border-b border-border">
              <th className="py-2 text-start font-bold">{rtl ? "الحساب الدفتري" : "Ledger Account"}</th>
              <th className="py-2 text-end font-bold w-28">{rtl ? "مدين (Debit)" : "Debit"}</th>
              <th className="py-2 text-end font-bold w-28">{rtl ? "دائن (Credit)" : "Credit"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.map((entry, index) => (
              <tr key={index} className="hover:bg-table-row-hover">
                <td className="py-2.5 font-semibold text-foreground">{entry.account}</td>
                <td className="py-2.5 text-end font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {entry.debit > 0 ? formatCurrency(entry.debit, currency, locale) : "—"}
                </td>
                <td className="py-2.5 text-end font-mono text-foreground/80 font-bold">
                  {entry.credit > 0 ? formatCurrency(entry.credit, currency, locale) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-border font-black">
            <tr>
              <td className="py-3">{rtl ? "الإجمالي" : "Total"}</td>
              <td className="py-3 text-end font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(totalDebit, currency, locale)}</td>
              <td className="py-3 text-end font-mono text-foreground">{formatCurrency(totalCredit, currency, locale)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {!isBalanced && (
        <div className="flex items-center gap-2 text-[10px] text-destructive bg-destructive/10 p-2.5 rounded-xl">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>
            {rtl 
              ? "تحذير: القيد غير متوازن، يرجى مراجعة قيم المدين والدائن للعملية."
              : "Validation error: Journal entry credits do not equal debits."}
          </span>
        </div>
      )}
    </div>
  );
}
