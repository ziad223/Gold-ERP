"use client";
/**
 * DARFUS Dashboard — Inventory Distribution Widget (PRODUCTION)
 * Visual bar chart of inventory by type. Read-only.
 */
import { useTranslations, useLocale } from "next-intl";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { WidgetSkeleton } from "./widget-skeleton";
import type { DashboardInventoryData } from "../contracts/data-contracts";
import { cn } from "@/lib/utils";
import { toEnglishDigits } from "@/lib/formatters/numbers";

interface InventoryDistributionWidgetProps {
  data: DashboardInventoryData | null;
  isLoading: boolean;
}

export function InventoryDistributionWidget({ data, isLoading }: InventoryDistributionWidgetProps) {
  const t = useTranslations("Dashboard");
  const locale = useLocale();

  if (isLoading) {
    return (
      <Card className="p-5">
        <WidgetSkeleton lines={5} />
      </Card>
    );
  }

  const distribution = data?.distribution ?? [];
  const available = data?.availableAssets ?? 0;
  const reserved = data?.reservedAssets ?? 0;
  const netGold = data?.netGoldWeight ?? 0;

  return (
    <Card className="p-5 lg:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="font-black text-navy-950 dark:text-white">{t("inventoryDistribution")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t("byAssetType")}</p>
        </div>
        <Link
          href="/inventory"
          className="rounded-xl border border-border px-3 py-1.5 text-[11px] font-bold text-muted-foreground transition hover:border-brand-500 hover:text-brand-600"
        >
          {t("viewAll")}
        </Link>
      </div>

      {/* Stacked bar */}
      {distribution.length > 0 ? (
        <div className="mb-5 flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          {distribution.map((item) => (
            <div
              key={item.label}
              style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
              title={toEnglishDigits(`${item.label}: ${item.percentage}%`)}
            />
          ))}
        </div>
      ) : (
        <div className="mb-5 h-3 rounded-full bg-slate-100 dark:bg-slate-800" />
      )}

      {/* Legend */}
      <div className="mb-5 space-y-2.5">
        {distribution.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {t(item.labelKey as Parameters<typeof t>[0])}
              </span>
            </div>
            <span className="text-xs font-black text-foreground">{toEnglishDigits(item.percentage)}%</span>
          </div>
        ))}
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-slate-50 p-3 text-center dark:bg-navy-950">
          <p className="text-[10px] text-muted-foreground">{t("availableLabel")}</p>
          <p className="mt-1 text-sm font-black text-foreground">{toEnglishDigits(available)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 text-center dark:bg-navy-950">
          <p className="text-[10px] text-muted-foreground">{t("reservedLabel")}</p>
          <p className="mt-1 text-sm font-black text-foreground">{toEnglishDigits(reserved)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 text-center dark:bg-navy-950">
          <p className="text-[10px] text-muted-foreground">{t("netGold")}</p>
          <p className="mt-1 text-sm font-black text-foreground">
            {toEnglishDigits(netGold.toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : locale, { maximumFractionDigits: 1, numberingSystem: "latn" }))}g
          </p>
        </div>
      </div>
    </Card>
  );
}
