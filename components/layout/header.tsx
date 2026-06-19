"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Building2,
  ChevronDown,
  CircleUserRound,
  Command,
  Gem,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/auth/language-switcher";
import { BranchSwitcher } from "@/components/layout/branch-switcher";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { getPublicFileUrl } from "@/lib/api/files";
import { useCoreErpData } from "@/hooks/use-core-erp-data";
import { Link, useRouter } from "@/i18n/navigation";
import { filterData } from "@/hooks/use-data-filters";
import { useNotifications } from "@/hooks/use-notifications";
import { toEnglishDigits } from "@/lib/formatters/numbers";

export function Header({ onOpenSidebar, onOpenCommandPalette }: { onOpenSidebar: () => void; onOpenCommandPalette?: () => void }) {
  const t = useTranslations("Header");
  const { theme, toggleTheme } = useTheme();
  const { user, company, logout } = useAuth();
  const { assets, customers, invoices } = useCoreErpData();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const companyLogoUrl = getPublicFileUrl(company?.logo || "");

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    const assetResults = filterData(assets, query, [(item) => item.id, (item) => item.name, (item) => item.barcode]).slice(0, 3).map((item) => ({ type: "asset", id: item.id, title: item.name, subtitle: item.id, href: `/inventory/${item.id}` }));
    const customerResults = filterData(customers, query, [(item) => item.id, (item) => item.name, (item) => item.phone, (item) => item.email]).slice(0, 2).map((item) => ({ type: "customer", id: item.id, title: item.name, subtitle: item.phone, href: "/customers" }));
    const invoiceResults = filterData(invoices, query, [(item) => item.id, (item) => item.customerName]).slice(0, 2).map((item) => ({ type: "invoice", id: item.id, title: item.id, subtitle: item.customerName, href: "/sales" }));
    return [...assetResults, ...customerResults, ...invoiceResults].slice(0, 6);
  }, [assets, customers, invoices, query]);

  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Admin";
  const initials = `${user?.firstName?.[0] ?? "A"}${user?.lastName?.[0] ?? "D"}`.toUpperCase();
  const companyInitials = (company?.businessName || userName || "DARFUS")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    setLogoFailed(false);
  }, [company?.logo]);

  const signOut = () => {
    logout();
    setProfileOpen(false);
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-3 border-b border-border bg-panel/90 px-4 shadow-sm backdrop-blur-xl lg:px-7" data-app-header="true">
      <button onClick={onOpenSidebar} className="grid h-11 w-11 place-items-center rounded-2xl border border-border text-foreground hover:bg-background bg-panel lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      {/* Command Palette shortcut button (visible on lg+) */}
      {onOpenCommandPalette && (
        <button
          onClick={onOpenCommandPalette}
          className="hidden h-10 items-center gap-2 rounded-2xl border border-border bg-panel px-3 text-xs font-semibold text-muted-foreground transition hover:border-brand-500 hover:text-brand-600 lg:flex"
          aria-label="Open command palette (Ctrl+K)"
          id="header-command-palette"
        >
          <Command className="h-3.5 w-3.5" />
          <span>⌘K</span>
        </button>
      )}

      <div className="relative hidden max-w-2xl flex-1 md:block">
        <Search className="pointer-events-none absolute start-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="input-base ps-11 pe-11"
          placeholder={t("search")}
          id="header-global-search"
        />
        {query && <button onClick={() => setQuery("")} className="absolute end-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"><X className="h-4 w-4" /></button>}

        {query.trim().length >= 2 && (
          <div className="absolute inset-x-0 top-[calc(100%+10px)] overflow-hidden rounded-3xl border border-border bg-panel p-2 shadow-float">
            {results.length ? results.map((result) => (
              <Link key={`${result.type}-${result.id}`} href={result.href} onClick={() => setQuery("")} className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-background">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                  {result.type === "asset" ? <Gem className="h-5 w-5" /> : result.type === "customer" ? <CircleUserRound className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                </span>
                <span className="min-w-0"><span className="block truncate text-xs font-extrabold text-foreground">{toEnglishDigits(result.title)}</span><span className="mt-1 block truncate text-[10px] text-muted">{toEnglishDigits(result.subtitle)}</span></span>
              </Link>
            )) : <p className="p-5 text-center text-xs font-semibold text-muted">{t("noResults")}</p>}
          </div>
        )}
      </div>

      <div className="ms-auto flex items-center gap-2">
        <BranchSwitcher />

        <LanguageSwitcher compact />

        <button onClick={toggleTheme} className="grid h-10 w-10 place-items-center rounded-2xl border border-border bg-panel text-foreground hover:border-brand-500 hover:text-brand-600" aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="relative hidden sm:block">
          <button
            onClick={() => setNotificationsOpen((current) => !current)}
            className="relative grid h-10 w-10 place-items-center rounded-2xl border border-border bg-panel text-foreground hover:border-brand-500 hover:text-brand-600"
            aria-label={t("notifications")}
            id="header-notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-white dark:ring-navy-950">
                {unreadCount > 9 ? "9+" : toEnglishDigits(unreadCount)}
              </span>
            )}
          </button>
          {notificationsOpen && (
            <div className="absolute end-0 top-[calc(100%+10px)] w-80 overflow-hidden rounded-3xl border border-border bg-panel shadow-float">
              <div className="flex items-center justify-between border-b border-border p-4">
                <p className="text-xs font-black">{t("notifications")}</p>
                <button onClick={() => markAllRead()} className="text-[10px] font-bold text-brand-600 hover:underline">
                  {t("markAllRead")}
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto p-2">
                {notifications.length ? notifications.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => markRead(item.id)}
                    className="block w-full rounded-2xl p-3 text-start transition hover:bg-background"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-xs font-black text-foreground">{toEnglishDigits(item.title)}</span>
                      {!item.isRead && <span className="mt-1 h-2 w-2 rounded-full bg-brand-500" />}
                    </span>
                    <span className="mt-1 block text-[11px] leading-5 text-muted-foreground">{toEnglishDigits(item.message)}</span>
                  </button>
                )) : (
                  <p className="p-6 text-center text-xs font-semibold text-muted">{t("noNotifications")}</p>
                )}
              </div>
              <Link href="/notifications" onClick={() => setNotificationsOpen(false)} className="block border-t border-border p-3 text-center text-xs font-black text-brand-600 hover:bg-background">
                {t("viewAll")}
              </Link>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setProfileOpen((current) => !current)}
            className="flex items-center gap-2 rounded-2xl border border-transparent p-1.5 transition hover:border-border hover:bg-panel"
            id="header-profile-menu"
            aria-expanded={profileOpen}
            aria-haspopup="true"
          >
            {companyLogoUrl && !logoFailed ? (
              <img
                src={companyLogoUrl}
                alt={company?.businessName || "Company Logo"}
                className="h-9 w-9 rounded-xl border border-border bg-white object-contain p-1"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 text-xs font-black text-white">{companyInitials || initials}</div>
            )}
            <div className="hidden max-w-36 text-start lg:block">
              <p className="truncate text-xs font-extrabold text-foreground">{toEnglishDigits(userName)}</p>
              <p className="mt-0.5 truncate text-[9px] text-muted">{company?.businessName}</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-muted lg:block" />
          </button>

          {profileOpen && (
            <div className="absolute end-0 top-[calc(100%+10px)] w-60 rounded-3xl border border-border bg-panel p-2 shadow-float">
              <div className="border-b border-border p-3"><p className="truncate text-xs font-extrabold">{toEnglishDigits(userName)}</p><p className="mt-1 truncate text-[10px] text-muted">{toEnglishDigits(user?.email)}</p></div>
              <Link href="/settings" onClick={() => setProfileOpen(false)} className="mt-2 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold text-foreground hover:bg-background"><Settings className="h-4 w-4" />{t("settings")}</Link>
              <button onClick={signOut} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-500/10"><LogOut className="h-4 w-4" />{t("logout")}</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
