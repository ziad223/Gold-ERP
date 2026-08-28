import { cn } from "@/lib/utils";
import type { AlertProps } from "./alert";

export function Toast({ tone = "info", title, children, className }: AlertProps) {
  return <div role="status" aria-live="polite" className={cn("pointer-events-auto w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-border bg-popover p-4 text-sm text-popover-foreground shadow-float", className)}><div className="flex items-start gap-3"><span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", tone === "success" && "bg-success", tone === "warning" && "bg-warning", tone === "danger" && "bg-destructive", tone === "info" && "bg-info", tone === "neutral" && "bg-muted")} aria-hidden="true" /><div>{title && <p className="font-bold">{title}</p>}<div className="mt-1 text-muted-foreground">{children}</div></div></div></div>;
}
