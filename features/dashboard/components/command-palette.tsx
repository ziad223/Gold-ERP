"use client";
/**
 * DARFUS Dashboard — Command Palette (PRODUCTION)
 * Activated by Ctrl+K / Cmd+K. Keyboard accessible.
 * Navigation only — no business transactions.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutDashboard, ReceiptText, Boxes, ContactRound, Truck,
  CircleDollarSign, UsersRound, BarChart3, ShieldCheck,
  Settings, Store, FileCheck, Command, Search, ArrowLeft, ArrowRight,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  labelKey: string;
  icon: React.ElementType;
  href: string;
  group: string;
}

const COMMAND_ITEMS: CommandItem[] = [
  { id: "dashboard", labelKey: "Navigation.dashboard", icon: LayoutDashboard, href: "/dashboard", group: "nav" },
  { id: "pos", labelKey: "Navigation.pos", icon: Store, href: "/pos", group: "nav" },
  { id: "sales", labelKey: "Navigation.sales", icon: ReceiptText, href: "/sales", group: "nav" },
  { id: "inventory", labelKey: "Navigation.inventory", icon: Boxes, href: "/inventory", group: "nav" },
  { id: "customers", labelKey: "Navigation.customers", icon: ContactRound, href: "/customers", group: "nav" },
  { id: "suppliers", labelKey: "Navigation.suppliers", icon: Truck, href: "/suppliers", group: "nav" },
  { id: "accounting", labelKey: "Navigation.accounting", icon: CircleDollarSign, href: "/accounting", group: "nav" },
  { id: "employees", labelKey: "Navigation.employees", icon: UsersRound, href: "/employees", group: "nav" },
  { id: "reports", labelKey: "Navigation.reports", icon: BarChart3, href: "/reports", group: "nav" },
  { id: "audit", labelKey: "Navigation.audit", icon: ShieldCheck, href: "/audit", group: "nav" },
  { id: "approvals", labelKey: "Navigation.approvals", icon: FileCheck, href: "/approvals", group: "system" },
  { id: "settings", labelKey: "Navigation.settings", icon: Settings, href: "/settings", group: "system" },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const t = useTranslations();
  const locale = useLocale();
  const rtl = locale === "ar";
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = COMMAND_ITEMS.filter((item) =>
    query.trim().length === 0
      ? true
      : t(item.labelKey as Parameters<typeof t>[0]).toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const navigate = useCallback(
    (item: CommandItem) => {
      router.push(item.href);
      onClose();
    },
    [router, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && filtered[selectedIndex]) {
        navigate(filtered[selectedIndex]);
      }
    },
    [filtered, selectedIndex, navigate, onClose]
  );

  if (!isOpen) return null;

  const Arrow = rtl ? ArrowLeft : ArrowRight;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette */}
      <div
        className="fixed start-1/2 top-[15vh] z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-3xl border border-border bg-panel shadow-float focus-within:ring-2 focus-within:ring-brand-500"
        role="dialog"
        aria-label={t("Dashboard.commandPalette")}
        onKeyDown={handleKeyDown}
        dir={rtl ? "rtl" : "ltr"}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border p-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
            placeholder={t("Dashboard.commandSearch")}
          />
          <kbd className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[10px] font-mono font-bold text-muted-foreground">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">
              {t("Dashboard.commandNoResults")}
            </p>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-start transition",
                    isSelected
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                      : "text-foreground hover:bg-background"
                  )}
                  onClick={() => navigate(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-xl",
                      isSelected
                        ? "bg-brand-100 dark:bg-brand-500/20"
                        : "bg-slate-100 dark:bg-slate-800"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 truncate font-semibold">
                    {t(item.labelKey as Parameters<typeof t>[0])}
                  </span>
                  {isSelected && <Arrow className="h-4 w-4 text-muted-foreground" />}
                </button>
              );
            })
          )}
        </div>

        <div className="border-t border-border px-4 py-2.5">
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono">↑↓</kbd>
              {t("Dashboard.cmdNav")}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono">↵</kbd>
              {t("Dashboard.cmdSelect")}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono">Esc</kbd>
              {t("Dashboard.cmdClose")}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Hook to open command palette via Ctrl+K ─────────────────────────────────

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) };
}
