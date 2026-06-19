"use client";
/**
 * DARFUS Dashboard — Gold Market Zone Widget (PRODUCTION)
 * Displays gold prices from GoldPriceSnapshot. Read-only.
 */
import { TrendingDown, TrendingUp, Minus, RefreshCw } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Card } from "@/components/ui/card";
import { WidgetSkeleton } from "./widget-skeleton";
import type { DashboardGoldData } from "../contracts/data-contracts";
import { cn } from "@/lib/utils";
import { toEnglishDigits } from "@/lib/formatters/numbers";

interface GoldMarketWidgetProps {
  data: DashboardGoldData | null;
  isLoading: boolean;
  isCached: boolean;
  currency: string;
  onRefresh?: () => void;
}

export function GoldMarketWidget({
  data,
  isLoading,
  isCached,
  currency,
  onRefresh,
}: GoldMarketWidgetProps) {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const rtl = locale === "ar";

  const fmt = (n: number) =>
    toEnglishDigits(new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : locale, {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      numberingSystem: "latn",
    }).format(n));

  if (isLoading) {
    return (
      <Card className="p-5 lg:p-6">
        <WidgetSkeleton lines={5} />
      </Card>
    );
  }

  const prices = data?.prices ?? [];
  const primary = prices.find((p) => p.karat === 24) ?? prices[0];
  const trend = data?.trend ?? "FLAT";

  const TrendIcon = trend === "UP" ? TrendingUp : trend === "DOWN" ? TrendingDown : Minus;
  const trendColor =
    trend === "UP"
      ? "text-emerald-500"
      : trend === "DOWN"
        ? "text-rose-500"
        : "text-slate-400";

  // Format update time
  const updatedLabel = data?.isStale
    ? t("goldPriceStale")
    : data?.updatedAt
      ? t("goldLastUpdate", {
          time: toEnglishDigits(new Date(data.updatedAt).toLocaleTimeString(locale === "ar" ? "ar-EG-u-nu-latn" : locale, {
            hour: "2-digit",
            minute: "2-digit",
            numberingSystem: "latn",
          })),
        })
      : t("goldLastUpdateNow");

  const karat24Price = prices.find((p) => p.karat === 24)?.pricePerGram ?? 0;

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-navy-950 via-navy-900 to-brand-900 p-5 text-white shadow-soft lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-brand-200">{t("goldReference")}</p>
          {karat24Price > 0 ? (
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black">{fmt(karat24Price)}</span>
              <span className="text-xs text-slate-300">{currency}/{t("goldPerGram")}</span>
              <span className={cn("flex items-center gap-1 text-xs font-bold", trendColor)}>
                <TrendIcon className="h-4 w-4" />
                {data?.changePercent ? toEnglishDigits(`${data.changePercent > 0 ? "+" : ""}${data.changePercent.toFixed(2)}%`) : ""}
              </span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-400">{t("goldPriceEmpty")}</p>
          )}
          <p className={cn("mt-1 text-[10px] text-slate-400", data?.isStale && "text-amber-400")}>
            {updatedLabel}
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-white/[0.07] text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label={t("refreshGold")}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Karat grid */}
      {prices.length > 0 && (
        <div
          className={cn(
            "mt-5 grid gap-2",
            prices.length >= 4 ? "grid-cols-4" : prices.length === 3 ? "grid-cols-3" : "grid-cols-2"
          )}
          dir={rtl ? "rtl" : "ltr"}
        >
          {prices
            .filter((p) => p.karat !== 24)
            .slice(0, 4)
            .map((entry) => (
              <div
                key={entry.karat}
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3 text-center"
              >
                <p className="text-[10px] font-semibold text-brand-200">{toEnglishDigits(entry.karat)}K</p>
                <p className="mt-1 text-sm font-black">{fmt(entry.pricePerGram)}</p>
                <p className="mt-0.5 text-[9px] text-slate-500">{entry.currency ?? currency}</p>
              </div>
            ))}
        </div>
      )}

      {isCached && (
        <p className="mt-3 text-center text-[10px] text-amber-400">{t("goldCachedNote")}</p>
      )}
    </Card>
  );
}
