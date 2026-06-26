"use client";
/**
 * DARFUS Dashboard — Sales Chart Widget (PRODUCTION)
 * Simple recharts bar chart. Lazy loaded. Read-only.
 */
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Card } from "@/components/ui/card";
import { WidgetSkeleton } from "./widget-skeleton";
import type { DashboardSalesChartData } from "../contracts/data-contracts";
import { cn } from "@/lib/utils";
import { toEnglishDigits } from "@/lib/formatters/numbers";

interface SalesInsightsWidgetProps {
  data: DashboardSalesChartData | null;
  isLoading: boolean;
  currency: string;
}

const formatCurrencyShort = (value: number, locale: string): string => {
  if (value >= 1_000_000) return toEnglishDigits(`${(value / 1_000_000).toFixed(1)}M`);
  if (value >= 1_000) return toEnglishDigits(`${(value / 1_000).toFixed(0)}K`);
  return toEnglishDigits(value.toFixed(0));
};

export function SalesInsightsWidget({ data, isLoading, currency }: SalesInsightsWidgetProps) {
  const t = useTranslations("Dashboard");
  const locale = useLocale();

  const chartData = useMemo(
    () => (data?.points ?? []).map((p) => ({ name: p.label, value: p.value })),
    [data]
  );

  const trend = data?.trend ?? "FLAT";
  const TrendIcon = trend === "UP" ? TrendingUp : trend === "DOWN" ? TrendingDown : Minus;
  const trendClass =
    trend === "UP"
      ? "text-emerald-500"
      : trend === "DOWN"
        ? "text-rose-500"
        : "text-slate-400";

  if (isLoading) {
    return (
      <Card className="p-5 lg:p-6">
        <WidgetSkeleton lines={4} />
        <div className="mt-4 h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      </Card>
    );
  }

  return (
    <Card className="p-5 lg:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black text-navy-950 dark:text-white">{t("salesTrend")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t("salesTrendSub")}</p>
        </div>
        <div className={cn("flex items-center gap-1 text-xs font-bold", trendClass)}>
          <TrendIcon className="h-4 w-4" />
          <span>{t(`trend${trend}`)}</span>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
          {t("chartEmpty")}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatCurrencyShort(v as number, locale)}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number) =>
                toEnglishDigits(new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : locale, {
                  style: "decimal",
                  maximumFractionDigits: 0,
                  numberingSystem: "latn",
                }).format(value)) + ` ${currency}`
              }
              contentStyle={{
                borderRadius: "16px",
                border: "1px solid var(--border)",
                background: "var(--panel)",
                color: "var(--foreground)",
                fontSize: 12,
              }}
              cursor={{ fill: "var(--border)", radius: 8 }}
            />
            <Bar
              dataKey="value"
              fill="var(--brand-500, #5b21b6)"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      )}

      {data && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 p-3 dark:bg-navy-950">
            <p className="text-[10px] text-muted-foreground">{t("totalPeriod")}</p>
            <p className="mt-1 text-sm font-black">
              {toEnglishDigits(new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : locale, {
                style: "decimal",
                maximumFractionDigits: 0,
                numberingSystem: "latn",
              }).format(data.total))}{" "}
              {currency}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 dark:bg-navy-950">
            <p className="text-[10px] text-muted-foreground">{t("monthlyAvg")}</p>
            <p className="mt-1 text-sm font-black">
              {toEnglishDigits(new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : locale, {
                style: "decimal",
                maximumFractionDigits: 0,
                numberingSystem: "latn",
              }).format(data.average))}{" "}
              {currency}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
