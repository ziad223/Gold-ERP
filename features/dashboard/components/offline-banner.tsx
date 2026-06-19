"use client";
/**
 * DARFUS Dashboard — Offline/Cache Banner (PRODUCTION)
 * Shows a human-friendly message when data is stale or offline.
 * Does NOT show technical terms to users.
 */
import { WifiOff, Clock, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface OfflineBannerProps {
  isOffline: boolean;
  isCached: boolean;
  snapshotAgeMs: number | null;
  onRefresh: () => void;
}

function formatAge(ms: number): string {
  if (ms < 60_000) return "< 1 دقيقة";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} دقيقة`;
  return `${Math.floor(ms / 3_600_000)} ساعة`;
}

export function OfflineBanner({ isOffline, isCached, snapshotAgeMs, onRefresh }: OfflineBannerProps) {
  const t = useTranslations("Dashboard");

  if (!isOffline && !isCached) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs font-semibold",
        isOffline
          ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
          : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
      )}
    >
      {isOffline ? (
        <WifiOff className="h-4 w-4 shrink-0" />
      ) : (
        <Clock className="h-4 w-4 shrink-0" />
      )}

      <span className="flex-1">
        {isOffline
          ? t("offlineMessage")
          : snapshotAgeMs !== null
            ? t("cachedMessage", { age: formatAge(snapshotAgeMs) })
            : t("cachedMessageDefault")}
      </span>

      {!isOffline && (
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 rounded-xl border border-current/30 px-2.5 py-1 transition hover:bg-current/10"
          aria-label={t("refreshData")}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t("refreshNow")}
        </button>
      )}
    </div>
  );
}
