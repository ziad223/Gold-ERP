"use client";

import { GitCommit, GitPullRequest, ArrowDown, GitBranch } from "lucide-react";
import { useLocale } from "next-intl";

interface AssetLineageGraphProps {
  assetId: string;
  assetName: string;
  parentAssetId?: string;
  childAssetIds?: string[];
  contributionWeight?: number;
  processLoss?: number;
  source?: string;
}

export function AssetLineageGraph({
  assetId,
  assetName,
  parentAssetId,
  childAssetIds = [],
  contributionWeight,
  processLoss,
  source,
}: AssetLineageGraphProps) {
  const locale = useLocale();
  const isEn = locale === "en";

  const parentLabel = parentAssetId
    ? (isEn ? `Parent Asset: ${parentAssetId}` : `الأصل الأب: ${parentAssetId}`)
    : (source || (isEn ? "Primary Source" : "مصدر أولي"));

  return (
    <div className="space-y-6">
      {/* Visual Tree Node Representation */}
      <div className="flex flex-col items-center justify-center rounded-3xl bg-background p-8 border border-border">
        <div className="flex flex-col items-center w-full max-w-md">
          {/* Node 1: Parent or Source */}
          <div className="rounded-2xl border border-gold-200 bg-gold-50/70 px-6 py-4 text-center shadow-sm dark:border-gold-900/40 dark:bg-gold-500/10">
            <span className="flex items-center justify-center gap-2 text-xs font-black text-gold-800 dark:text-gold-300">
              <GitPullRequest className="h-4 w-4" />
              {parentLabel}
            </span>
          </div>

          {/* Connect Arrow 1 */}
          <div className="my-2 flex flex-col items-center">
            <div className="h-6 w-px bg-border" />
            {(contributionWeight !== undefined || processLoss !== undefined) && (
              <div className="text-[9px] text-muted-foreground bg-surface-muted px-2 py-0.5 rounded-md border border-border my-1 max-w-xs text-center font-mono">
                {contributionWeight !== undefined && `${isEn ? "Used" : "مستهلك"}: ${contributionWeight}g`}
                {processLoss !== undefined && ` · ${isEn ? "Loss" : "فقد"}: ${processLoss}g`}
              </div>
            )}
            <div className="h-4 w-px bg-border" />
            <ArrowDown className="h-3.5 w-3.5 text-brand-500 animate-pulse" />
          </div>

          {/* Node 2: Current Asset */}
          <div className="rounded-2xl border-2 border-brand-500 bg-brand-50/80 px-6 py-4.5 text-center shadow-md dark:border-brand-500 dark:bg-brand-500/10 z-10">
            <span className="flex items-center justify-center gap-2 text-xs font-black text-brand-800 dark:text-brand-300">
              <GitCommit className="h-4 w-4" />
              {assetName} ({assetId})
            </span>
          </div>

          {/* Node 3: Child Assets (if any) */}
          {childAssetIds.length > 0 && (
            <>
              {/* Connect Arrow 2 */}
              <div className="my-2 flex flex-col items-center">
                <div className="h-6 w-px bg-border" />
                <ArrowDown className="h-3.5 w-3.5 text-slate-400" />
              </div>

              {/* Children Grid */}
              <div className="grid grid-cols-2 gap-3 w-full">
                {childAssetIds.map((childId) => (
                  <div
                    key={childId}
                    className="rounded-xl border border-border bg-slate-50 dark:bg-navy-950 px-4 py-3 text-center shadow-xs"
                  >
                    <span className="flex items-center justify-center gap-1.5 text-[10px] font-black text-slate-700 dark:text-slate-300">
                      <GitBranch className="h-3.5 w-3.5 rotate-180" />
                      {isEn ? `Child: ${childId}` : `الأصل الابن: ${childId}`}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Accessible Tabular Alternate Representation */}
      <div className="overflow-hidden rounded-2xl border border-border bg-panel">
        <table className="w-full text-start text-xs" aria-label={isEn ? "Asset Lineage Data Table" : "جدول تسلسل أصل الذهب"}>
          <thead className="bg-table-header text-muted">
            <tr>
              <th className="px-5 py-3 text-start">{isEn ? "Lineage Hierarchy" : "رتبة التسلسل"}</th>
              <th className="px-5 py-3 text-start">{isEn ? "Entity ID" : "معرف الكيان"}</th>
              <th className="px-5 py-3 text-start">{isEn ? "Type" : "النوع"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr className="hover:bg-table-row-hover">
              <td className="px-5 py-4 font-bold text-foreground">
                1. {isEn ? "Parent Ancestor" : "المصدر الأب"}
              </td>
              <td className="px-5 py-4 font-mono font-bold text-gold-700 dark:text-gold-300">
                {parentAssetId || "—"}
              </td>
              <td className="px-5 py-4 text-muted">
                {parentAssetId ? (isEn ? "Asset Item" : "أصل ذهب") : (source || (isEn ? "Raw Supplier Import" : "مورد خام"))}
              </td>
            </tr>
            <tr className="bg-background/20 hover:bg-table-row-hover">
              <td className="px-5 py-4 font-bold text-brand-700 dark:text-brand-300">
                2. {isEn ? "Current Active Asset" : "الأصل الحالي النشط"}
              </td>
              <td className="px-5 py-4 font-mono font-bold text-brand-700 dark:text-brand-300">
                {assetId}
              </td>
              <td className="px-5 py-4 text-muted">
                {isEn ? "Asset Item" : "أصل ذهب"}
              </td>
            </tr>
            {childAssetIds.map((childId, i) => (
              <tr key={childId} className="hover:bg-table-row-hover">
                <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-300">
                  3.{i + 1} {isEn ? "Child Asset" : "الأصل الابن"}
                </td>
                <td className="px-5 py-4 font-mono font-bold text-slate-600 dark:text-slate-400">
                  {childId}
                </td>
                <td className="px-5 py-4 text-muted">
                  {isEn ? "Melted/Derived Asset" : "أصل مشتق/مصهور"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
