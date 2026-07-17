"use client";

import {
  BarChart3,
  BookOpenCheck,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ContactRound,
  Gem,
  Landmark,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  ReceiptText,
  Settings,
  ShieldCheck,
  Store,
  Truck,
  UsersRound,
  X,
  FileCheck,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { useOperator } from "@/contexts/operator-context";
import { permissionMatches } from "@/lib/permissions/module-access";

const groups = [
  {
    label: "overview",
    items: [
      { href: "/dashboard", label: "dashboard", icon: LayoutDashboard, permission: "dashboard.view", branchBusiness: true },
      { href: "/pos", label: "pos", icon: Store, permission: ["pos.view", "pos.sell"], branchBusiness: true },
    ],
  },
  {
    label: "salesCustomers",
    items: [
      { href: "/sales", label: "sales", icon: ReceiptText, permission: "sales.view", branchBusiness: true },
      { href: "/customers", label: "customers", icon: ContactRound, permission: "customers.view", branchBusiness: true },
    ],
  },
  {
    label: "assetsInventory",
    items: [
      { href: "/inventory", label: "inventory", icon: Boxes, permission: "inventory.view", branchBusiness: true },
      { href: "/gold-center", label: "goldCenter", icon: Gem, permission: "gold.view", branchBusiness: true },
      { href: "/suppliers", label: "suppliers", icon: Truck, permission: "suppliers.view", branchBusiness: true },
    ],
  },
  {
    label: "finance",
    items: [
      { href: "/accounting", label: "accounting", icon: CircleDollarSign, permission: "accounting.view", branchBusiness: true },
      { href: "/accounting/treasury", label: "treasury", icon: Landmark, permission: "treasury.view", branchBusiness: true },
      { href: "/reports", label: "reports", icon: BarChart3, permission: "reports.view", branchBusiness: true },
    ],
  },
  {
    label: "system",
    items: [
      { href: "/employees", label: "employees", icon: UsersRound, permission: ["payroll.view", "employees.credentials.manage", "employees.permissions.manage", "employees.branches.manage", "employees.verification.view"], branchBusiness: false },
      { href: "/settings/users", label: "systemAccounts", icon: BookOpenCheck, permission: "users.view", branchBusiness: false },
      { href: "/audit", label: "audit", icon: ShieldCheck, permission: "audit.view", branchBusiness: false },
      { href: "/approvals", label: "approvals", icon: FileCheck, permission: "approvals.view", branchBusiness: false },
      { href: "/settings", label: "settings", icon: Settings, permission: "settings.view", branchBusiness: false },
    ],
  },
] as const;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ open, onClose, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("Navigation");
  const { hasPermission, accountType } = usePermissions();
  const operator = useOperator();
  const rtl = locale === "ar";
  const CollapseIcon = rtl
    ? collapsed
      ? PanelRightOpen
      : PanelRightClose
    : collapsed
      ? PanelLeftOpen
      : PanelLeftClose;
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        accountType === "branch_shell"
          ? (operator.active && item.branchBusiness && permissionMatches(item.permission, hasPermission))
          : (permissionMatches(item.permission, hasPermission) || (item.href === "/settings" && hasPermission("reservations.configure_account")))
      )
    }))
    .filter((group) => group.items.length > 0);
  const ActiveArrow = rtl ? ChevronLeft : ChevronRight;

  return (
    <>
      {open && (
        <button
          className="fixed inset-0 z-40 bg-navy-950/55 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}
      <aside
        data-app-sidebar="true"
        className={cn(
          "fixed inset-y-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground shadow-float transition-all duration-300 lg:translate-x-0",
          rtl ? "right-0 border-l border-sidebar-border" : "left-0 border-r border-sidebar-border",
          collapsed ? "w-[88px]" : "w-[288px]",
          open ? "translate-x-0" : rtl ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className={cn("relative flex h-20 items-center border-b border-sidebar-border px-4", collapsed ? "justify-center" : "justify-between")}>
          <Logo compact={collapsed} />
          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? t("expand") : t("collapse")}
            aria-label={collapsed ? t("expand") : t("collapse")}
            className={cn(
              "absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-xl border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-lg transition hover:border-sidebar-accent hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:grid",
              rtl ? "-left-4" : "-right-4",
            )}
          >
            <CollapseIcon className="h-4 w-4" />
          </button>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-sidebar-foreground/5 text-sidebar-muted lg:hidden hover:text-sidebar-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          {visibleGroups.map((group) => (
            <div key={group.label} className="mb-6">
              {!collapsed && (
                <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-sidebar-muted">
                  {t(group.label)}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      title={collapsed ? t(item.label) : undefined}
                      className={cn(
                        "group relative flex h-12 items-center rounded-2xl px-3 text-sm font-semibold transition",
                        collapsed ? "justify-center" : "gap-3",
                        active
                          ? "bg-sidebar-active text-sidebar-active-foreground shadow-lg shadow-sidebar/30"
                          : "text-sidebar-muted hover:bg-sidebar-accent/20 hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span className="min-w-0 flex-1 truncate">{t(item.label)}</span>}
                      {!collapsed && active && <ActiveArrow className="h-4 w-4" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {!collapsed && (
          <div className="border-t border-sidebar-border p-3">
            <div className="rounded-3xl border border-sidebar-border bg-sidebar-foreground/[0.03] p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold text-gold-300">
                <BookOpenCheck className="h-4 w-4" /> {t("help")}
              </div>
              <p className="text-[11px] leading-5 text-sidebar-muted">{t("helpText")}</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
