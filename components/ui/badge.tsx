import { cn } from "@/lib/utils";

const styles = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-500/10 dark:text-amber-300",
  rose: "bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-500/10 dark:text-rose-300",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-500/10 dark:text-blue-300",
  violet: "bg-brand-50 text-brand-700 ring-brand-600/10 dark:bg-brand-500/10 dark:text-brand-300",
  slate: "bg-slate-100 text-slate-700 ring-slate-600/10 dark:bg-slate-800 dark:text-slate-300",
  default: "bg-slate-100 text-slate-700 ring-slate-600/10 dark:bg-slate-800 dark:text-slate-300",
};

export function Badge({ children, tone = "slate", className }: { children: React.ReactNode; tone?: keyof typeof styles; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset", styles[tone], className)}>{children}</span>;
}
