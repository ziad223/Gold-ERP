"use client";

import { AlertOctagon, RotateCw } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  correlationId?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title, message, correlationId, onRetry, className }: ErrorStateProps) {
  const locale = useLocale();
  const isEn = locale === "en";

  const defaultTitle = title || (isEn ? "An error occurred" : "حدث خطأ في العملية");
  const defaultMessage = message || (isEn ? "Failed to execute request. Please try again." : "فشل تنفيذ الطلب. يرجى المحاولة مرة أخرى.");
  const retryLabel = isEn ? "Retry Connection" : "إعادة المحاولة";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center",
        className,
      )}
    >
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertOctagon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-black text-foreground">{defaultTitle}</h3>
      <p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">{defaultMessage}</p>
      
      {correlationId && (
        <div className="mt-4 select-all rounded-xl bg-surface-muted px-3 py-1.5 font-mono text-[10px] text-muted-foreground">
          ID: {correlationId}
        </div>
      )}

      {onRetry && (
        <Button onClick={onRetry} variant="secondary" className="mt-5 gap-2">
          <RotateCw className="h-4 w-4" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
