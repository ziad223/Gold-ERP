"use client";

import { ExchangeSummary } from "@/components/sales/ExchangeSummary";
import type { ExchangeDisplayResponse, Invoice } from "@/lib/types";

interface InvoiceReadOnlyDetailProps {
  invoice: Invoice;
  exchangeDisplay?: ExchangeDisplayResponse | null;
  exchangeLoading?: boolean;
  exchangeError?: unknown;
  currency: string;
  locale: string;
  itemTitle: string;
  totalLabel: string;
  money: (value: number) => string;
}

export function InvoiceReadOnlyDetail({
  invoice,
  exchangeDisplay,
  exchangeLoading,
  exchangeError,
  currency,
  locale,
  itemTitle,
  totalLabel,
  money,
}: InvoiceReadOnlyDetailProps) {
  const rtl = locale === "ar";
  const isExchange = invoice.type === "exchange";

  if (isExchange && exchangeLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 p-6 text-center text-xs font-semibold text-slate-500 dark:border-slate-800">
        {rtl ? "جارٍ تحميل ملخص الاستبدال…" : "Loading exchange summary…"}
      </div>
    );
  }

  if (isExchange && exchangeDisplay) {
    return <ExchangeSummary invoice={invoice} display={exchangeDisplay} currency={currency} />;
  }

  return (
    <>
      {isExchange && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          {exchangeError
            ? (rtl
                ? "تعذر تحميل ملخص الاستبدال الموثوق. تُعرض التفاصيل المحفوظة كحل احتياطي."
                : "The trusted exchange summary could not be loaded. Stored details are shown as a fallback.")
            : (rtl
                ? "ملخص الاستبدال غير متاح في مصدر البيانات الحالي. تُعرض التفاصيل المحفوظة كحل احتياطي."
                : "Exchange summary is unavailable for the current data source. Stored details are shown as a fallback.")}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="border-b border-slate-200 p-4 text-xs font-extrabold dark:border-slate-800">{itemTitle}</div>
        {invoice.items.map((item, index) => (
          <div
            key={item.id ?? `${item.assetId}-${index}`}
            className="flex items-center justify-between gap-4 border-b border-slate-100 p-4 last:border-0 dark:border-slate-800"
          >
            <div>
              <p className="text-xs font-extrabold">{item.name}</p>
              <p className="mt-1 text-[10px] text-slate-400">{item.assetId}</p>
            </div>
            <p className="text-sm font-black">{money(item.price)}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-2xl bg-brand-50 p-4 text-brand-800 dark:bg-brand-500/10 dark:text-brand-200">
        <span className="text-sm font-bold">{totalLabel}</span>
        <span className="text-xl font-black">{money(invoice.total)}</span>
      </div>
    </>
  );
}
