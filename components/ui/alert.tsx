import { cn } from "@/lib/utils";

const toneClasses = {
  info: "border-info/30 bg-info/5 text-info",
  success: "border-success/30 bg-success/5 text-success",
  warning: "border-warning/30 bg-warning/5 text-warning",
  danger: "border-destructive/30 bg-destructive/5 text-destructive",
  neutral: "border-border bg-surface-muted text-muted-foreground",
} as const;

export interface AlertProps {
  tone?: keyof typeof toneClasses;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Alert({ tone = "info", title, children, className }: AlertProps) {
  return <div role={tone === "danger" ? "alert" : "status"} className={cn("rounded-2xl border p-4 text-sm", toneClasses[tone], className)}>{title && <p className="font-bold text-foreground">{title}</p>}<div className="mt-1 text-foreground/80">{children}</div></div>;
}
