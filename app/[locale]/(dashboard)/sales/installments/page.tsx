"use client";

import { useState } from "react";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/contexts/auth-context";
import { useInstallments } from "@/hooks/use-installments";
import { formatCurrency } from "@/lib/utils";

export default function InstallmentsPage() {
  const t = useTranslations("Installments");
  const common = useTranslations("Common");
  const locale = useLocale();
  const { company } = useAuth();
  const currency = company?.currency ?? "AED";
  const money = (v: number | string) => formatCurrency(Number(v), currency, locale);

  const { items, loading, payInstallment } = useInstallments();
  const [payingId, setPayingId] = useState<string | null>(null);

  const statusTone: Record<string, "green" | "amber" | "rose" | "blue"> = {
    paid: "green",
    pending: "amber",
    overdue: "rose",
    partial: "blue",
  };

  const handlePay = async (id: string) => {
    setPayingId(id);
    try {
      await payInstallment(id, "Cash");
    } finally {
      setPayingId(null);
    }
  };

  const totalDue = items
    .filter((i) => i.status !== "paid")
    .reduce((s, i) => s + (Number(i.amount) - Number(i.paidAmount || 0)), 0);
  const totalCollected = items.reduce((s, i) => s + Number(i.paidAmount || 0), 0);

  if (loading && items.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("description")} />
        <LoadingState variant="skeleton" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"><CalendarClock className="h-5 w-5" /></div>
          <p className="text-xs font-semibold text-muted">{t("totalDue")}</p>
          <p className="mt-2 text-2xl font-black text-foreground">{money(totalDue)}</p>
        </Card>
        <Card className="p-5">
          <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><CheckCircle2 className="h-5 w-5" /></div>
          <p className="text-xs font-semibold text-muted">{t("totalCollected")}</p>
          <p className="mt-2 text-2xl font-black text-foreground">{money(totalCollected)}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-5 font-black">{t("schedule")}</div>
        {items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-start text-xs">
              <thead className="bg-table-header text-muted">
                <tr>
                  <th className="px-5 py-4">{t("invoice")}</th>
                  <th className="px-5 py-4">{t("customer")}</th>
                  <th className="px-5 py-4">{t("sequence")}</th>
                  <th className="px-5 py-4">{t("dueDate")}</th>
                  <th className="px-5 py-4">{t("amount")}</th>
                  <th className="px-5 py-4">{t("status")}</th>
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((inst) => (
                  <tr key={inst.id} className="hover:bg-table-row-hover">
                    <td className="px-5 py-4 font-mono font-bold text-brand-700 dark:text-brand-300">{inst.invoiceId}</td>
                    <td className="px-5 py-4 font-bold">{inst.customerName || "—"}</td>
                    <td className="px-5 py-4">#{inst.sequence}</td>
                    <td className="px-5 py-4 text-muted">{inst.dueDate}</td>
                    <td className="px-5 py-4 font-black">{money(inst.amount)}</td>
                    <td className="px-5 py-4"><Badge tone={statusTone[inst.status] ?? "amber"}>{t(inst.status)}</Badge></td>
                    <td className="px-5 py-4 text-end">
                      {inst.status !== "paid" && (
                        <Button size="sm" disabled={payingId === inst.id} onClick={() => handlePay(inst.id)}>
                          {payingId === inst.id ? common("loading") : t("collect")}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={common("noResults")} description={t("noInstallments")} />
        )}
      </Card>
    </div>
  );
}
