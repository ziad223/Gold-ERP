import type { LucideIcon } from "lucide-react";
import { ArrowDownLeft, ArrowUpLeft } from "lucide-react";
import { Card } from "@/components/ui/card";

export function StatCard({ title, value, change, hint, icon: Icon, tone = "violet" }: { title: string; value: string; change: number; hint: string; icon: LucideIcon; tone?: "violet" | "gold" | "emerald" | "blue" }) {
  const map = {
    violet: "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300",
    gold: "bg-gold-50 text-gold-700 dark:bg-gold-500/10 dark:text-gold-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{title}</p>
          <p className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">{value}</p>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-2xl ${map[tone]}`}><Icon className="h-5 w-5" /></div>
      </div>
      <div className="mt-5 flex items-center gap-2 text-[11px]">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-bold ${change >= 0 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"}`}>
          {change >= 0 ? <ArrowUpLeft className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
          {Math.abs(change)}%
        </span>
        <span className="text-muted-foreground">{hint}</span>
      </div>
    </Card>
  );
}
