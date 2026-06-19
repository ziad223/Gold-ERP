"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
  variant?: "full" | "inline" | "skeleton";
}

export function LoadingState({ message, className, variant = "inline" }: LoadingStateProps) {
  const t = useTranslations("Common");
  const displayMessage = message || t("loading");

  if (variant === "full") {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 flex flex-col items-center justify-center bg-foreground/10 backdrop-blur-sm",
          className,
        )}
      >
        <div className="flex flex-col items-center rounded-3xl bg-panel border border-border p-8 shadow-float">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700" />
          <p className="mt-4 text-sm font-extrabold text-foreground">{displayMessage}</p>
        </div>
      </div>
    );
  }

  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-4 p-5 animate-pulse", className)}>
        <div className="h-8 bg-surface-muted rounded-2xl w-1/3" />
        <div className="h-32 bg-surface-muted/60 rounded-3xl" />
        <div className="space-y-2">
          <div className="h-5 bg-surface-muted rounded-xl" />
          <div className="h-5 bg-surface-muted/60 rounded-xl w-5/6" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      <p className="mt-3 text-xs font-bold text-muted-foreground">{displayMessage}</p>
    </div>
  );
}
