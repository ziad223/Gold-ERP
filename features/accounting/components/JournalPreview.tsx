"use client";

import { Scale, AlertTriangle, Landmark } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import ux9 from "./AccountingTreasuryUx9.module.css";

export interface ServerJournalPreviewLine {
  account?: { code?: string; name?: string | null } | null;
  debit?: number | string | null;
  credit?: number | string | null;
}

export interface ServerJournalPreview {
  lines?: ServerJournalPreviewLine[] | null;
  totalDebit?: number | string | null;
  totalCredit?: number | string | null;
  balanced?: boolean | null;
}

interface JournalPreviewProps {
  preview: ServerJournalPreview | null;
  currency: string;
  locale?: string;
}

export function JournalPreview({
  preview,
  currency,
  locale = "ar"
}: JournalPreviewProps) {
  const rtl = locale === "ar";
  const entries = Array.isArray(preview?.lines) ? preview.lines : [];
  const isAvailable = preview !== null && typeof preview?.balanced === "boolean";
  const isBalanced = isAvailable && preview?.balanced === true;
  const unavailable = rtl ? "غير متاح" : "Unavailable";

  return (
    <div className={`${ux9.surface} rounded-3xl border border-border bg-panel p-5 space-y-4`}>
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h4 className="text-xs font-black text-foreground flex items-center gap-2">
          <Landmark className="h-4.5 w-4.5 text-brand-600" />
          {rtl ? "معاينة القيد المحاسبي المزدوج التلقائي" : "Automatic Double-Entry Journal Preview"}
        </h4>
        <div className="flex items-center gap-1">
          <Scale className={`h-4 w-4 ${isBalanced ? "text-emerald-500" : "text-rose-500 animate-spin"}`} />
          <span className="text-[10px] font-bold text-muted">
            {isAvailable ? (isBalanced ? (rtl ? "متزن" : "Balanced") : (rtl ? "غير متزن" : "Out of balance")) : unavailable}
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
                <td className="py-2.5 font-semibold text-foreground">
                  {entry.account?.name || unavailable}
                  {entry.account?.code ? <span className="ms-1 text-[10px] text-muted">({entry.account.code})</span> : null}
                </td>
                <td className="py-2.5 text-end font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {entry.debit !== null && entry.debit !== undefined && Number(entry.debit) > 0 ? formatCurrency(Number(entry.debit), currency, locale) : "—"}
                </td>
                <td className="py-2.5 text-end font-mono text-foreground/80 font-bold">
                  {entry.credit !== null && entry.credit !== undefined && Number(entry.credit) > 0 ? formatCurrency(Number(entry.credit), currency, locale) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-border font-black">
            <tr>
              <td className="py-3">{rtl ? "الإجمالي" : "Total"}</td>
              <td className="py-3 text-end font-mono text-emerald-600 dark:text-emerald-400">{preview?.totalDebit !== null && preview?.totalDebit !== undefined ? formatCurrency(Number(preview.totalDebit), currency, locale) : unavailable}</td>
              <td className="py-3 text-end font-mono text-foreground">{preview?.totalCredit !== null && preview?.totalCredit !== undefined ? formatCurrency(Number(preview.totalCredit), currency, locale) : unavailable}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {isAvailable && !isBalanced && (
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
