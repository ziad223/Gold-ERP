"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Info, RefreshCw, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { apiClient } from "@/lib/api/client";
import { DATA_SOURCE } from "@/lib/data-source";
import { formatCurrency } from "@/lib/utils";

interface ValuationGroup {
  karat: string;
  itemCount: number;
  quantity: number;
  totalWeight: number;
  costValue: number;
  marketValue: number;
  unrealizedGainLoss: number;
  pricePerGram: number | null;
  missingCostCount: number;
  missingWeightCount: number;
  missingPriceCount: number;
}
interface ValuationResponse {
  currency: string;
  generatedAt: string;
  groups: ValuationGroup[];
  totals: ValuationGroup;
}

export default function InventoryValuationPage() {
  const t = useTranslations("InventoryValuation");
  const common = useTranslations("Common");
  const locale = useLocale();
  const rtl = locale === "ar";
  const isApi = DATA_SOURCE === "api";

  const [data, setData] = useState<ValuationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!isApi) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient<ValuationResponse>("/reports/inventory-valuation", { locale });
      setData(res);
    } catch (e: any) {
      setError(e?.message || "Failed to load valuation");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const currency = data?.currency || "AED";
  const money = (v: number) => formatCurrency(Number(v) || 0, currency, locale);
  const karatLabel = (k: string) => (k === "other" ? t("other") : `${k}K`);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={<Button variant="secondary" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{common("refresh")}</Button>}
      />

      {/* Informational note — market value posts NO journal entry */}
      <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
        <Info className="h-4 w-4 shrink-0" />
        {t("infoNote")}
      </div>

      {loading ? (
        <LoadingState variant="skeleton" />
      ) : !isApi ? (
        <EmptyState title={t("apiOnlyTitle")} description={t("apiOnlyDesc")} />
      ) : error ? (
        <EmptyState title={common("error")} description={error} />
      ) : !data || data.groups.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDesc")} />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <p className="text-xs font-bold text-muted">{t("costValue")}</p>
              <p className="mt-2 text-2xl font-black text-navy-950 dark:text-white">{money(data.totals.costValue)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-bold text-muted">{t("marketValue")}</p>
              <p className="mt-2 text-2xl font-black text-brand-700 dark:text-brand-300">{money(data.totals.marketValue)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-bold text-muted">{t("unrealizedGainLoss")}</p>
              <p className={`mt-2 flex items-center gap-1 text-2xl font-black ${data.totals.unrealizedGainLoss >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {data.totals.unrealizedGainLoss >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                {money(data.totals.unrealizedGainLoss)}
              </p>
            </Card>
          </div>

          {/* By-karat table */}
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border p-5 font-black"><Scale className="h-4 w-4 text-brand-600" />{t("byKarat")}</div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-start text-xs">
                <thead className="bg-slate-50 text-slate-500 dark:bg-navy-950">
                  <tr>
                    <th className="px-4 py-3 text-start">{t("karat")}</th>
                    <th className="px-4 py-3 text-start">{t("pieces")}</th>
                    <th className="px-4 py-3 text-start">{t("totalWeight")}</th>
                    <th className="px-4 py-3 text-start">{t("pricePerGram")}</th>
                    <th className="px-4 py-3 text-start">{t("costValue")}</th>
                    <th className="px-4 py-3 text-start">{t("marketValue")}</th>
                    <th className="px-4 py-3 text-start">{t("unrealizedGainLoss")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.groups.map((g) => (
                    <tr key={g.karat} className="hover:bg-slate-50/70 dark:hover:bg-navy-950/50">
                      <td className="px-4 py-3 font-extrabold text-navy-900 dark:text-white">{karatLabel(g.karat)}</td>
                      <td className="px-4 py-3">{g.quantity}{g.missingWeightCount > 0 || g.missingPriceCount > 0 || g.missingCostCount > 0 ? <span className="ms-1 text-[10px] text-amber-600" title={t("missingData")}>⚠</span> : null}</td>
                      <td className="px-4 py-3">{g.totalWeight} g</td>
                      <td className="px-4 py-3 text-slate-500">{g.pricePerGram != null ? money(g.pricePerGram) : "—"}</td>
                      <td className="px-4 py-3 font-bold">{money(g.costValue)}</td>
                      <td className="px-4 py-3 font-bold text-brand-700 dark:text-brand-300">{money(g.marketValue)}</td>
                      <td className={`px-4 py-3 font-extrabold ${g.unrealizedGainLoss >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{money(g.unrealizedGainLoss)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-slate-50 font-black dark:bg-navy-950">
                    <td className="px-4 py-3">{common("total")}</td>
                    <td className="px-4 py-3">{data.totals.quantity}</td>
                    <td className="px-4 py-3">{data.totals.totalWeight} g</td>
                    <td className="px-4 py-3">—</td>
                    <td className="px-4 py-3">{money(data.totals.costValue)}</td>
                    <td className="px-4 py-3 text-brand-700 dark:text-brand-300">{money(data.totals.marketValue)}</td>
                    <td className={`px-4 py-3 ${data.totals.unrealizedGainLoss >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{money(data.totals.unrealizedGainLoss)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
          {rtl ? null : null}
        </>
      )}
    </div>
  );
}
