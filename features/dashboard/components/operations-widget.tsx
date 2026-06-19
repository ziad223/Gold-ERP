"use client";
/**
 * DARFUS Dashboard — Operations Zone Widget (PRODUCTION)
 * Displays pending operational items. Read-only, click navigates to module.
 */
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { WidgetSkeleton } from "./widget-skeleton";
import type { DashboardOperationsData, PendingItem } from "../contracts/data-contracts";
import { cn } from "@/lib/utils";

interface OperationsWidgetProps {
  data: DashboardOperationsData | null;
  isLoading: boolean;
}

function OperationSection({
  title,
  items,
  emptyKey,
}: {
  title: string;
  items: PendingItem[];
  emptyKey: string;
}) {
  const locale = useLocale();
  const rtl = locale === "ar";
  const Arrow = rtl ? ArrowLeft : ArrowRight;

  return (
    <div>
      <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-muted-foreground dark:bg-navy-950">
          {emptyKey}
        </p>
      ) : (
        <div className="space-y-1.5">
          {items.slice(0, 4).map((item) => {
            const row = (
              <div
                className={cn(
                  "flex items-center gap-3 rounded-2xl border border-border p-3 text-xs",
                  item.navigationTarget && "transition hover:bg-slate-50 dark:hover:bg-navy-950/50"
                )}
              >
                <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate font-semibold text-foreground">{item.label}</span>
                <Badge
                  tone={
                    item.severity === "critical" || item.severity === "high"
                      ? "rose"
                      : item.severity === "medium"
                        ? "amber"
                        : "default"
                  }
                >
                  {item.count}
                </Badge>
                {item.navigationTarget && (
                  <Arrow className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
              </div>
            );

            return item.navigationTarget ? (
              <Link key={item.id} href={item.navigationTarget} className="block">
                {row}
              </Link>
            ) : (
              <div key={item.id}>{row}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function OperationsWidget({ data, isLoading }: OperationsWidgetProps) {
  const t = useTranslations("Dashboard");

  if (isLoading) {
    return (
      <Card className="p-5">
        <WidgetSkeleton lines={6} />
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="mb-5">
        <h3 className="font-black text-navy-950 dark:text-white">{t("operationsTitle")}</h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{t("operationsSub")}</p>
      </div>

      <div className="space-y-5">
        <OperationSection
          title={t("pendingTransfers")}
          items={data?.pendingTransfers ?? []}
          emptyKey={t("noTransfers")}
        />
        <OperationSection
          title={t("activeReservations")}
          items={data?.activeReservations ?? []}
          emptyKey={t("noReservations")}
        />
        <OperationSection
          title={t("pendingApprovals")}
          items={data?.pendingApprovals ?? []}
          emptyKey={t("noApprovals")}
        />
      </div>
    </Card>
  );
}
