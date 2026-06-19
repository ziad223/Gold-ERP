"use client";

import { useState } from "react";
import { Crown, Gem, RefreshCw, Star, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/contexts/auth-context";
import { useLoyalty } from "@/hooks/use-loyalty";
import { formatCurrency } from "@/lib/utils";
import { toEnglishDigits } from "@/lib/formatters/numbers";

const TIER_META: Record<string, { icon: typeof Crown; tone: "amber" | "blue" | "slate" }> = {
  VIP: { icon: Crown, tone: "amber" },
  Gold: { icon: Star, tone: "blue" },
  Standard: { icon: User, tone: "slate" },
};

export default function LoyaltyPage() {
  const t = useTranslations("Loyalty");
  const common = useTranslations("Common");
  const locale = useLocale();
  const { company } = useAuth();
  const currency = company?.currency ?? "AED";
  const money = (v: number | string) => formatCurrency(Number(v), currency, locale);

  const { segments, transactions, loading, recalculateSegments } = useLoyalty();
  const [recalcBusy, setRecalcBusy] = useState(false);
  const [recalcMsg, setRecalcMsg] = useState<string | null>(null);

  const handleRecalc = async () => {
    setRecalcBusy(true);
    setRecalcMsg(null);
    try {
      const r = await recalculateSegments();
      setRecalcMsg(t("recalcDone", { updated: (r as any).updated ?? 0 }));
    } finally {
      setRecalcBusy(false);
    }
  };

  const tierTone: Record<string, "amber" | "blue" | "green"> = { earn: "green", redeem: "amber", adjust: "blue" };

  if (loading && !segments) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("description")} />
        <LoadingState variant="skeleton" />
      </div>
    );
  }

  const order = ["VIP", "Gold", "Standard"];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button variant="secondary" disabled={recalcBusy} onClick={handleRecalc}>
            <RefreshCw className="h-4 w-4" />{t("recalculate")}
          </Button>
        }
      />

      {recalcMsg && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{recalcMsg}</div>}

      {/* Segment cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {order.map((tier) => {
          const s = segments?.segments?.[tier] ?? { count: 0, purchases: 0, points: 0 };
          const meta = TIER_META[tier];
          const Icon = meta.icon;
          const threshold = segments?.thresholds?.[tier];
          return (
            <Card key={tier} className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"><Icon className="h-5 w-5" /></div>
                <Badge tone={meta.tone}>{t(`tier_${tier}`)}</Badge>
              </div>
              <p className="text-3xl font-black text-foreground">{s.count}</p>
              <p className="text-xs font-semibold text-muted">{t("customers")}</p>
              <div className="mt-4 space-y-1 border-t border-border pt-3 text-xs text-muted">
                <div className="flex justify-between"><span>{t("totalPurchases")}</span><span className="font-bold text-foreground">{money(s.purchases)}</span></div>
                <div className="flex justify-between"><span>{t("totalPoints")}</span><span className="font-bold text-foreground">{toEnglishDigits(s.points.toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : locale, { numberingSystem: "latn" }))}</span></div>
                {threshold != null && <div className="flex justify-between"><span>{t("threshold")}</span><span>{money(threshold)}</span></div>}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Ledger */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border p-5 font-black"><Gem className="h-4 w-4 text-brand-600" />{t("ledger")}</div>
        {transactions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-start text-xs">
              <thead className="bg-table-header text-muted">
                <tr>
                  <th className="px-5 py-4">{t("date")}</th>
                  <th className="px-5 py-4">{t("customer")}</th>
                  <th className="px-5 py-4">{t("type")}</th>
                  <th className="px-5 py-4">{t("points")}</th>
                  <th className="px-5 py-4">{t("value")}</th>
                  <th className="px-5 py-4">{t("balance")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-table-row-hover">
                    <td className="px-5 py-4 text-muted">{tx.date || "—"}</td>
                    <td className="px-5 py-4 font-bold">{tx.customerName || tx.customerId}</td>
                    <td className="px-5 py-4"><Badge tone={tierTone[tx.type] ?? "blue"}>{t(`txn_${tx.type}`)}</Badge></td>
                    <td className={`px-5 py-4 font-black ${tx.points < 0 ? "text-rose-600" : "text-emerald-600"}`}>{tx.points > 0 ? "+" : ""}{toEnglishDigits(tx.points)}</td>
                    <td className="px-5 py-4">{tx.value ? money(tx.value) : "—"}</td>
                    <td className="px-5 py-4 font-bold">{toEnglishDigits(tx.balanceAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={common("noResults")} description={t("noLedger")} />
        )}
      </Card>
    </div>
  );
}
