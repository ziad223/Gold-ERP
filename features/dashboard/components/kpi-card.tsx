"use client";
/**
 * DARFUS Dashboard — KPI Card Widget (PRODUCTION)
 * Displays a single business metric with trend indicator.
 * No business logic. Data provided by hook.
 */
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  subValue?: string;
  change?: number;
  hint?: string;
  icon: LucideIcon;
  tone?: "violet" | "gold" | "emerald" | "blue" | "rose" | "slate";
  href?: string;
  isLoading?: boolean;
  isCached?: boolean;
}

const TONE_MAP = {
  violet: {
    icon: "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300",
    badge: "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300",
  },
  gold: {
    icon: "bg-gold-50 text-gold-700 dark:bg-gold-500/10 dark:text-gold-300",
    badge: "bg-gold-50 text-gold-700 dark:bg-gold-500/10 dark:text-gold-300",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  blue: {
    icon: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    badge: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  },
  rose: {
    icon: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    badge: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  },
  slate: {
    icon: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
};

export function KPICard({
  title,
  value,
  subValue,
  change,
  hint,
  icon: Icon,
  tone = "violet",
  href,
  isLoading = false,
  isCached = false,
}: KPICardProps) {
  const colors = TONE_MAP[tone];
  const isPositive = (change ?? 0) >= 0;

  const content = (
    <Card
      className={cn(
        "group relative overflow-hidden p-5 transition-all duration-200",
        href && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
        isCached && "border-dashed opacity-80"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-muted-foreground">{title}</p>
          {isLoading ? (
            <div className="mt-3 h-8 w-32 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
          ) : (
            <p className="mt-3 text-2xl font-black tracking-tight text-foreground">{value}</p>
          )}
          {subValue && !isLoading && (
            <p className="mt-1 truncate text-xs text-muted-foreground">{subValue}</p>
          )}
        </div>
        <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl", colors.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(change !== undefined || hint) && !isLoading && (
        <div className="mt-4 flex items-center gap-2 text-[11px]">
          {change !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-1 font-bold",
                isPositive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(change)}%
            </span>
          )}
          {hint && <span className="truncate text-muted-foreground">{hint}</span>}
        </div>
      )}

      {isCached && (
        <span className="absolute end-3 top-3 h-1.5 w-1.5 rounded-full bg-amber-400" title="Cached" />
      )}
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

// ─── Stat Row variant (smaller, inline) ───────────────────────────────────────

interface StatRowProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "flat";
}

export function StatRow({ label, value, icon: Icon, trend }: StatRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3">
      <div className="flex items-center gap-2">
        {Icon && (
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-500" />}
        {trend === "down" && <TrendingUp className="h-3 w-3 rotate-180 text-rose-500" />}
        <span className="text-sm font-black text-foreground">{value}</span>
      </div>
    </div>
  );
}
