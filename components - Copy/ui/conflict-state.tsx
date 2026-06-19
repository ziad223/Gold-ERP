"use client";

import { ShieldAlert, RefreshCw, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ConflictStateProps {
  conflictingId?: string;
  conflictingName?: string;
  onRefresh?: () => void;
  onDiscard?: () => void;
  className?: string;
}

export function ConflictState({
  conflictingId,
  conflictingName,
  onRefresh,
  onDiscard,
  className,
}: ConflictStateProps) {
  const locale = useLocale();
  const isEn = locale === "en";

  const title = isEn ? "Transaction Conflict Detected" : "تم اكتشاف تعارض في العملية";
  const desc = isEn
    ? "The asset you are trying to post has been updated or sold in another session. Please refresh your inventory details."
    : "تم بيع الأصل أو تعديل حالته في جلسة أخرى. يرجى تحديث بيانات الأصل أو إزالته من الفاتورة.";

  return (
    <div
      className={cn(
        "rounded-3xl border border-warning/30 bg-warning/5 p-6",
        className,
      )}
    >
      <div className="flex gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-warning/10 text-warning">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-black text-foreground">{title}</h4>
          <p className="text-[11px] leading-5 text-muted-foreground">{desc}</p>
          
          {(conflictingId || conflictingName) && (
            <div className="mt-3 rounded-2xl border border-warning/20 bg-surface-elevated p-3">
              <p className="text-xs font-extrabold text-foreground">
                {conflictingName || "Asset Item"}
              </p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                ID: {conflictingId}
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {onRefresh && (
              <Button size="sm" onClick={onRefresh} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                {isEn ? "Refresh Item Availability" : "تحديث حالة الأصل"}
              </Button>
            )}
            {onDiscard && (
              <Button size="sm" variant="danger" onClick={onDiscard} className="gap-1.5">
                <Trash2 className="h-3.5 w-3.5" />
                {isEn ? "Remove from Checkout" : "إزالة من الفاتورة"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
