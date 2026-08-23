"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { formatBranchDateTime } from "@/lib/dates/dates";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { AssetEvent } from "@/lib/types";

interface AssetTimelineProps {
  events: AssetEvent[];
}

export function AssetTimeline({ events }: AssetTimelineProps) {
  const locale = useLocale();
  const t = useTranslations("AssetDetails");
  const isEn = locale === "en";
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});

  const emptyLabel = isEn ? "No timeline events recorded." : "لا توجد أحداث مسجلة في السجل الزمني.";

  if (!events || events.length === 0) {
    return <p className="text-center text-xs text-muted py-6">{emptyLabel}</p>;
  }

  const toggleExpand = (id: string) => {
    setExpandedEvents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Reverse list to show the latest operations first
  const sortedEvents = [...events].reverse();

  const getSeverityTone = (severity?: string) => {
    switch (severity) {
      case "critical":
        return "rose";
      case "warning":
        return "amber";
      case "info":
      default:
        return "green";
    }
  };

  return (
    <div className="relative space-y-6 before:absolute before:bottom-3 before:start-[19px] before:top-3 before:w-px before:bg-border">
      {sortedEvents.map((event, index) => {
        const eventId = event.id || `ev-${index}`;
        const isExpanded = expandedEvents[eventId];
        const hasExtraDetails = Boolean(
          event.reason ||
          event.device ||
          event.sourceDocument ||
          event.beforeState ||
          event.afterState ||
          event.correlationId
        );

        return (
          <div key={eventId} className="relative flex gap-4 text-xs">
            <span
              className={`relative z-10 mt-1 h-10 w-10 shrink-0 rounded-2xl border-4 border-panel ${
                index === 0 ? "bg-brand-600" : "bg-border"
              }`}
            />
            <div className="flex-1 rounded-2xl border border-border p-4 bg-panel">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-black text-foreground">{event.action}</p>
                  {event.severity && (
                    <Badge tone={getSeverityTone(event.severity)} className="text-[9px] px-1 py-0 h-4">
                      {event.severity.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-bold font-mono">
                  {formatBranchDateTime(event.date, "Asia/Dubai", locale)}
                </span>
              </div>

              {event.note && (
                <p className="mt-2 text-[11px] leading-5 text-muted">
                  {event.note}
                </p>
              )}

              {isExpanded && hasExtraDetails && (
                <div className="mt-3 pt-3 border-t border-dashed border-border grid grid-cols-2 gap-2 text-[10px] text-muted-foreground bg-slate-50 dark:bg-navy-950/40 p-2.5 rounded-xl">
                  {event.beforeState && (
                    <div>
                      <span className="font-bold block text-slate-400">{isEn ? "Before State" : "الحالة السابقة"}:</span>
                      <span className="font-mono">{event.beforeState}</span>
                    </div>
                  )}
                  {event.afterState && (
                    <div>
                      <span className="font-bold block text-slate-400">{isEn ? "After State" : "الحالة اللاحقة"}:</span>
                      <span className="font-mono">{event.afterState}</span>
                    </div>
                  )}
                  {event.reason && (
                    <div className="col-span-2">
                      <span className="font-bold block text-slate-400">{isEn ? "Reason" : "السبب"}:</span>
                      <span>{event.reason}</span>
                    </div>
                  )}
                  {event.sourceDocument && (
                    <div>
                      <span className="font-bold block text-slate-400">{isEn ? "Source Document" : "المستند المرجعي"}:</span>
                      <span className="font-mono">{event.sourceDocument}</span>
                    </div>
                  )}
                  {event.device && (
                    <div>
                      <span className="font-bold block text-slate-400">{isEn ? "Device" : "الجهاز"}:</span>
                      <span>{event.device}</span>
                    </div>
                  )}
                  {event.correlationId && (
                    <div className="col-span-2">
                      <span className="font-bold block text-slate-400">{isEn ? "Correlation ID" : "معرف العملية"}:</span>
                      <span className="font-mono">{event.correlationId}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <Badge>{event.user}</Badge>
                  <Badge tone="violet">{event.branch}</Badge>
                </div>
                {hasExtraDetails && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(eventId)}
                    className="flex items-center gap-0.5 text-[10px] font-black text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    {isExpanded ? (
                      <>
                        {isEn ? "Hide Details" : "إخفاء التفاصيل"}
                        <ChevronUp className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        {isEn ? "Show Details" : "عرض التفاصيل"}
                        <ChevronDown className="h-3 w-3" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
