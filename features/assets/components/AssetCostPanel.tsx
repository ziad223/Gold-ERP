"use client";

import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils";
import { SensitiveValue } from "@/components/permissions/SensitiveValue";

interface AssetCostPanelProps {
  cost: number;
  price: number;
  currency: string;
  locale: string;
}

export function AssetCostPanel({ cost, price, currency, locale }: AssetCostPanelProps) {
  const t = useTranslations("AssetDetails");

  const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
  const markup = cost > 0 ? ((price - cost) / cost) * 100 : 0;

  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-navy-950/40 border border-slate-100 dark:border-slate-800 space-y-3">
      <h3 className="text-xs font-black text-navy-900 dark:text-slate-200">{t("costTitle")}</h3>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-[10px] text-slate-400">{t("costLabel")}</p>
          <p className="mt-1 font-black text-navy-800 dark:text-slate-100 font-mono">
            <SensitiveValue permission="viewCosts" value={formatCurrency(cost, currency, locale)} />
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400">{t("margin")}</p>
          <p className="mt-1 font-black text-emerald-600 dark:text-emerald-400 font-mono">
            <SensitiveValue permission="viewMargins" value={`${margin.toFixed(1)}%`} />
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400">{t("markup")}</p>
          <p className="mt-1 font-black text-brand-600 dark:text-brand-400 font-mono">
            <SensitiveValue permission="viewCosts" value={`${markup.toFixed(1)}%`} />
          </p>
        </div>
      </div>
    </div>
  );
}
