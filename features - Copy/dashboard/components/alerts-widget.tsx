"use client";
/**
 * DARFUS Dashboard — Alerts Zone Widget (PRODUCTION)
 * Displays operational alerts with severity levels. Read-only.
 */
import {
  AlertTriangle,
  ShieldAlert,
  PackageX,
  Clock,
  CheckCircle,
  FileCheck,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { WidgetSkeleton } from "./widget-skeleton";
import type { DashboardAlert, AlertSeverity } from "../contracts/data-contracts";
import { cn } from "@/lib/utils";

interface AlertsWidgetProps {
  alerts: DashboardAlert[];
  isLoading: boolean;
}

const SEVERITY_STYLES: Record<AlertSeverity, string> = {
  critical: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  high: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  medium: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  low: "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const CATEGORY_ICONS = {
  STOCK: PackageX,
  FINANCIAL: AlertTriangle,
  SECURITY: ShieldAlert,
  TRANSFER: Clock,
  RESERVATION: Clock,
  MANUFACTURING: CheckCircle,
  SYSTEM: ShieldAlert,
} as const;

export function AlertsWidget({ alerts, isLoading }: AlertsWidgetProps) {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const rtl = locale === "ar";

  if (isLoading) {
    return (
      <Card className="p-5">
        <WidgetSkeleton lines={5} />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border p-5">
        <div>
          <h3 className="font-black text-navy-950 dark:text-white">{t("alertsTitle")}</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{t("alertsSub")}</p>
        </div>
        <ShieldAlert className="h-5 w-5 text-amber-500" />
      </div>

      <div className="divide-y divide-border">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
            <p className="text-xs font-semibold text-muted-foreground">{t("alertsEmpty")}</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const Icon = CATEGORY_ICONS[alert.category] ?? AlertTriangle;
            const content = (
              <div
                className={cn(
                  "flex items-center gap-3 p-4",
                  alert.navigationTarget && "transition hover:bg-slate-50 dark:hover:bg-navy-950/50"
                )}
              >
                <div
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-2xl",
                    SEVERITY_STYLES[alert.severity]
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-foreground">
                    {t(alert.titleKey as Parameters<typeof t>[0])}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                    {/* message with optional params */}
                    {t(alert.messageKey as Parameters<typeof t>[0], alert.messageParams as Parameters<typeof t>[1])}
                  </p>
                </div>
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    alert.severity === "critical" && "bg-rose-500",
                    alert.severity === "high" && "bg-amber-500",
                    alert.severity === "medium" && "bg-blue-500",
                    alert.severity === "low" && "bg-slate-400"
                  )}
                />
              </div>
            );

            return alert.navigationTarget ? (
              <Link
                key={alert.id}
                href={alert.navigationTarget}
                dir={rtl ? "rtl" : "ltr"}
                className="block"
              >
                {content}
              </Link>
            ) : (
              <div key={alert.id}>{content}</div>
            );
          })
        )}
      </div>
    </Card>
  );
}
