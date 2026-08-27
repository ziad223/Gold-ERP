"use client";

import { useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { ExchangeDisplayItem, ExchangeDisplayResponse, Invoice } from "@/lib/types";

interface ExchangeSummaryProps {
  invoice: Invoice;
  display: ExchangeDisplayResponse;
  currency?: string;
}

export function ExchangeSummary({ invoice, display, currency }: ExchangeSummaryProps) {
  const locale = useLocale();
  const rtl = locale === "ar";
  const resolvedCurrency = currency || display.currency;
  const money = (value: number | null | undefined) =>
    formatCurrency(Math.max(0, Number(value) || 0), resolvedCurrency, locale);
  const targetPolicy = display.policyStatus === "target_policy";
  const legacyPolicy = display.policyStatus === "legacy_or_unknown";
  const settlement = display.settlementSummary;
  const amountDue = Math.max(0, display.figures.amountDueFromCustomer || 0);
  const balanceDue = Math.max(0, display.figures.excessDueToCustomer || 0);

  return (
    <section className="space-y-4" data-invoice-id={invoice.id} aria-label={rtl ? "ملخص الاستبدال" : "Exchange summary"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-black text-navy-950 dark:text-white">
          {rtl ? "ملخص الاستبدال" : "Exchange summary"}
        </h3>
        {legacyPolicy && (
          <Badge tone="amber">{rtl ? "سياسة استبدال تاريخية / غير معروفة" : "Historical / unknown exchange policy"}</Badge>
        )}
      </div>

      {legacyPolicy && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          {display.legacyFallback.message || (rtl
            ? "تُعرض القيم التاريخية المحفوظة دون إعادة احتساب الضريبة."
            : "Stored historical values are shown without recalculating tax.")}
        </div>
      )}

      <ItemSection
        title={rtl ? "القطع البديلة" : "Replacement items"}
        items={display.customerFacing.replacementSection}
        money={money}
        emptyLabel={rtl ? "لا توجد قطع بديلة مسجلة." : "No replacement items recorded."}
      />

      {targetPolicy && (
        <div className="grid gap-2 rounded-2xl border border-slate-200 p-4 text-xs dark:border-slate-800">
          <SummaryRow label={rtl ? "إجمالي القطع البديلة" : "Replacement items subtotal"} value={money(display.figures.newSubtotal)} />
          <SummaryRow label={rtl ? "ضريبة القيمة المضافة على القطع البديلة" : "VAT on replacement items"} value={money(display.figures.newTax)} />
          <SummaryRow label={rtl ? "إجمالي الاستبدال" : "Replacement total"} value={money(display.figures.newGross)} strong />
        </div>
      )}

      <ItemSection
        title={rtl ? "رصيد الاستبدال / قيمة القطع المرتجعة" : "Exchange credit / Returned item value"}
        items={display.customerFacing.returnedCreditSection}
        money={money}
        emptyLabel={rtl ? "لا يوجد رصيد استبدال مسجل." : "No exchange credit recorded."}
      />

      <div className="rounded-2xl bg-brand-50 p-4 text-brand-900 dark:bg-brand-500/10 dark:text-brand-100">
        <p className="text-xs font-bold">
          {amountDue > 0
            ? (rtl ? "المبلغ المستحق من العميل" : "Amount due from customer")
            : balanceDue > 0
              ? (rtl ? "الرصيد المستحق للعميل" : "Balance due to customer")
              : (rtl ? "استبدال متعادل — لا يوجد مبلغ مستحق" : "Even exchange — no amount due")}
        </p>
        <p className="mt-1 text-xl font-black">{money(amountDue || balanceDue)}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-black">{rtl ? "تسوية الاستبدال" : "Exchange settlement"}</h4>
          {settlement.source === "linked_records" && <Badge tone="green">{rtl ? "مؤكدة" : "Confirmed"}</Badge>}
          {settlement.source === "best_effort" && <Badge tone="amber">{rtl ? "تسوية تقديرية / غير مكتملة" : "Estimated settlement / incomplete"}</Badge>}
        </div>
        {settlement.source === "unavailable" ? (
          <p className="text-xs font-semibold text-slate-500">
            {rtl ? "تفاصيل التسوية غير متاحة." : "Settlement details unavailable."}
          </p>
        ) : (
          <div className="space-y-2 text-xs">
            {settlement.cashAmount > 0 && <SummaryRow label={rtl ? "استرداد نقدي" : "Cash refund"} value={money(settlement.cashAmount)} />}
            {settlement.bankAmount > 0 && <SummaryRow label={rtl ? "استرداد بنكي" : "Bank refund"} value={money(settlement.bankAmount)} />}
            {settlement.creditAmount > 0 && <SummaryRow label={rtl ? "رصيد العميل" : "Customer credit"} value={money(settlement.creditAmount)} />}
          </div>
        )}
      </div>

      {targetPolicy && (
        <p className="rounded-2xl bg-slate-50 p-4 text-xs font-semibold text-slate-600 dark:bg-navy-950 dark:text-slate-300">
          {display.customerFacing.policyNote}
        </p>
      )}
    </section>
  );
}

function ItemSection({
  title,
  items,
  money,
  emptyLabel,
}: {
  title: string;
  items: ExchangeDisplayItem[];
  money: (value: number) => string;
  emptyLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="border-b border-slate-200 p-4 text-xs font-extrabold dark:border-slate-800">{title}</div>
      {items.length ? items.map((item, index) => (
        <div key={item.invoiceItemId ?? `${item.assetId || "line"}-${index}`} className="flex items-center justify-between gap-4 border-b border-slate-100 p-4 last:border-0 dark:border-slate-800">
          <div>
            <p className="text-xs font-extrabold">{item.name || item.assetId || "—"}</p>
            {item.quantity > 1 && <p className="mt-1 text-[10px] text-slate-400">× {item.quantity}</p>}
          </div>
          <p className="text-sm font-black">{money(item.amount)}</p>
        </div>
      )) : <p className="p-4 text-xs font-semibold text-slate-500">{emptyLabel}</p>}
    </div>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${strong ? "font-black" : "font-semibold"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
