"use client";
/**
 * DARFUS Dashboard — Quick Actions Panel (PRODUCTION)
 * Navigation only — does NOT execute any business transaction.
 * Links are validated against existing routes.
 */
import {
  Plus,
  UserPlus,
  PackagePlus,
  ShoppingCart,
  ArrowLeftRight,
  BarChart3,
  CircleDollarSign,
  Gem,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuickAction {
  titleKey: string;
  icon: React.ElementType;
  href: string;
  tone: "violet" | "gold" | "emerald" | "blue" | "rose" | "slate";
  disabled?: boolean;
  disabledKey?: string;
}

// All routes validated against existing app routes
const QUICK_ACTIONS: QuickAction[] = [
  {
    titleKey: "qaNewSale",
    icon: Plus,
    href: "/pos",
    tone: "violet",
  },
  {
    titleKey: "qaAddCustomer",
    icon: UserPlus,
    href: "/customers",
    tone: "blue",
  },
  {
    titleKey: "qaAddItem",
    icon: PackagePlus,
    href: "/inventory",
    tone: "gold",
  },
  {
    titleKey: "qaNewPurchase",
    icon: ShoppingCart,
    href: "/suppliers",
    tone: "emerald",
  },
  {
    titleKey: "qaOpenAccounting",
    icon: CircleDollarSign,
    href: "/accounting",
    tone: "slate",
  },
  {
    titleKey: "qaCreateReport",
    icon: BarChart3,
    href: "/reports",
    tone: "rose",
  },
  {
    titleKey: "qaApprovals",
    icon: FileCheck,
    href: "/approvals",
    tone: "slate",
  },
  {
    titleKey: "qaInventory",
    icon: Gem,
    href: "/inventory",
    tone: "gold",
  },
];

// Import FileCheck separately (lucide alias fix)
import { FileCheck } from "lucide-react";

const TONE_STYLES = {
  violet: "bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20",
  gold: "bg-gold-50 text-gold-700 hover:bg-gold-100 dark:bg-gold-500/10 dark:text-gold-300 dark:hover:bg-gold-500/20",
  emerald: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20",
  blue: "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20",
  rose: "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20",
  slate: "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
};

interface QuickActionsProps {
  className?: string;
  compact?: boolean;
}

export function QuickActionsPanel({ className, compact = false }: QuickActionsProps) {
  const t = useTranslations("Dashboard");

  const actions = compact ? QUICK_ACTIONS.slice(0, 4) : QUICK_ACTIONS;

  return (
    <Card className={cn("p-5", className)}>
      <h3 className="mb-4 font-black text-navy-950 dark:text-white">{t("quickActions")}</h3>
      <div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4")}>
        {actions.map((action) => {
          const Icon = action.icon;
          const tile = (
            <div
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition",
                action.disabled
                  ? "cursor-not-allowed opacity-50"
                  : TONE_STYLES[action.tone]
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-bold leading-tight">
                {t(action.titleKey as Parameters<typeof t>[0])}
              </span>
            </div>
          );

          if (action.disabled) {
            return (
              <div
                key={action.titleKey}
                title={action.disabledKey ? t(action.disabledKey as Parameters<typeof t>[0]) : undefined}
              >
                {tile}
              </div>
            );
          }

          return (
            <Link key={action.titleKey} href={action.href}>
              {tile}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
