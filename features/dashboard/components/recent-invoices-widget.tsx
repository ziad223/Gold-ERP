"use client";
/**
 * DARFUS Dashboard — Recent Invoices Widget (PRODUCTION)
 * Compact table showing last 5 invoices. Click rows navigate to /sales.
 */
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { WidgetSkeleton } from "./widget-skeleton";
import type { DashboardInvoiceRow } from "../contracts/data-contracts";
import { formatCurrency } from "@/lib/utils";

interface RecentInvoicesWidgetProps {
  invoices: DashboardInvoiceRow[];
  isLoading: boolean;
  currency: string;
}

export function RecentInvoicesWidget({ invoices, isLoading, currency }: RecentInvoicesWidgetProps) {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const rtl = locale === "ar";
  const Arrow = rtl ? ArrowLeft : ArrowRight;

  const statusLabel = (s: string) => {
    if (s === "paid") return t("paid");
    if (s === "partial") return t("partial");
    if (s === "returned") return t("returned");
    return t("due");
  };

  const statusTone = (s: string): "green" | "amber" | "rose" | "default" => {
    if (s === "paid") return "green";
    if (s === "partial") return "amber";
    if (s === "due" || s === "returned") return "rose";
    return "default";
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="p-5">
          <WidgetSkeleton lines={4} />
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border p-5">
        <div>
          <h3 className="font-black text-navy-950 dark:text-white">{t("latestInvoices")}</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{t("latestInvoicesSub")}</p>
        </div>
        <Link
          href="/sales"
          className="flex items-center gap-1 text-xs font-bold text-brand-700 dark:text-brand-300"
        >
          {t("viewAll")}
          <Arrow className="h-3.5 w-3.5" />
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="flex items-center justify-center p-8 text-xs text-muted-foreground">
          {t("invoicesEmpty")}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-xs">
            <thead className="bg-slate-50 text-muted-foreground dark:bg-navy-950">
              <tr>
                <th className="px-5 py-3 text-start font-semibold">{t("invoice")}</th>
                <th className="px-5 py-3 text-start font-semibold">{t("customer")}</th>
                <th className="px-5 py-3 text-start font-semibold">{t("total")}</th>
                <th className="px-5 py-3 text-start font-semibold">{t("status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="transition hover:bg-slate-50 dark:hover:bg-navy-950/50"
                >
                  <td className="px-5 py-3.5 font-bold text-brand-700 dark:text-brand-300">
                    {inv.id}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-foreground">{inv.customerName}</td>
                  <td className="px-5 py-3.5 font-black text-foreground">
                    {formatCurrency(inv.total, currency, locale)}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge tone={statusTone(inv.status)}>{statusLabel(inv.status)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
