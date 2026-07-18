"use client";

import { useRef, useState } from "react";
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
import { usePermissions } from "@/hooks/use-permissions";
import { formatCurrency } from "@/lib/utils";
import type { Installment } from "@/lib/types";

export default function InstallmentsPage() {
  const t = useTranslations("Installments");
  const common = useTranslations("Common");
  const locale = useLocale();
  const { company } = useAuth();
  const { accountType, hasPermission } = usePermissions();
  const currency = company?.currency ?? "AED";
  const money = (v: number | string) => formatCurrency(Number(v), currency, locale);

  const rtl = locale === "ar";
  const { items, loading, payInstallment } = useInstallments();
  const canCollectInstallments = accountType === "super_admin"
    || hasPermission("sales.installments.collect");
  const collectPermissionMessage = rtl
    ? "تحصيل الأقساط يحتاج صلاحية تحصيل الأقساط للموظف."
    : "Installment collection requires Employee installment collection permission.";
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  // Phase 21.4 — stable Idempotency-Key per installment. Generated on the first
  // pay attempt for an installment, reused on retry (kept on failure), and
  // cleared on success so a later collection gets a fresh key.
  const idemKeysRef = useRef<Record<string, string>>({});
  const newIdemKey = () => {
    try {
      return window.crypto.randomUUID();
    } catch {
      return `IDEM-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }
  };

  // Remaining = installment amount minus what has been paid (no remaining field
  // on the model). Avoids `||` that would hide a real 0.
  const remainingOf = (inst: Installment) =>
    Math.round((Number(inst.amount) - Number(inst.paidAmount || 0)) * 100) / 100;

  const statusTone: Record<string, "green" | "amber" | "rose" | "blue"> = {
    paid: "green",
    pending: "amber",
    overdue: "rose",
    partial: "blue",
  };

  const handlePay = async (inst: Installment) => {
    if (!canCollectInstallments) {
      setPayError(collectPermissionMessage);
      return;
    }
    const remaining = remainingOf(inst);
    if (!Number.isFinite(remaining) || remaining <= 0) {
      setPayError(rtl ? "لا يوجد مبلغ متبقٍ صالح للتحصيل" : "No valid remaining amount to collect");
      return;
    }
    setPayError(null);
    setPayingId(inst.id);
    // Reuse the same key across retries of THIS installment (replay, not double-charge).
    if (!idemKeysRef.current[inst.id]) idemKeysRef.current[inst.id] = newIdemKey();
    try {
      await payInstallment(inst.id, "Cash", remaining, idemKeysRef.current[inst.id]);
      delete idemKeysRef.current[inst.id]; // success → a later collection gets a fresh key
    } catch (e: any) {
      setPayError(e?.message || (rtl ? "فشل تحصيل القسط" : "Failed to collect installment"));
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

      {payError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-900/40 dark:bg-rose-500/10 dark:text-rose-300">
          {payError}
        </div>
      )}

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
                        <Button size="sm" disabled={payingId === inst.id || remainingOf(inst) <= 0} onClick={() => handlePay(inst)}>
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
