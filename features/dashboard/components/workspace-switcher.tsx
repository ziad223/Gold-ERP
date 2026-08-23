"use client";
/**
 * DARFUS Dashboard — Workspace Switcher (PRODUCTION)
 * Allows switching between Executive/Sales/Inventory/Accounting views.
 * Persisted to localStorage via dashboard preferences.
 */
import {
  LayoutDashboard,
  ReceiptText,
  Boxes,
  CircleDollarSign,
  ChevronDown,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { DashboardWorkspace } from "../contracts/widget-types";

interface WorkspaceSwitcherProps {
  current: DashboardWorkspace;
  onChange: (workspace: DashboardWorkspace) => void;
}

interface WorkspaceOption {
  id: DashboardWorkspace;
  labelKey: string;
  icon: React.ElementType;
  color: string;
}

const WORKSPACES: WorkspaceOption[] = [
  {
    id: "EXECUTIVE",
    labelKey: "wsExecutive",
    icon: LayoutDashboard,
    color: "text-brand-600 dark:text-brand-400",
  },
  {
    id: "SALES",
    labelKey: "wsSales",
    icon: ReceiptText,
    color: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "INVENTORY",
    labelKey: "wsInventory",
    icon: Boxes,
    color: "text-gold-600 dark:text-gold-400",
  },
  {
    id: "ACCOUNTING",
    labelKey: "wsAccounting",
    icon: CircleDollarSign,
    color: "text-blue-600 dark:text-blue-400",
  },
];

export function WorkspaceSwitcher({ current, onChange }: WorkspaceSwitcherProps) {
  const t = useTranslations("Dashboard");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentOption = WORKSPACES.find((w) => w.id === current) ?? WORKSPACES[0];
  const CurrentIcon = currentOption.icon;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-2 rounded-2xl border border-border bg-panel px-3 text-foreground transition hover:border-brand-500"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <CurrentIcon className={cn("h-4 w-4", currentOption.color)} />
        <span className="hidden text-xs font-bold sm:block">
          {t(currentOption.labelKey as Parameters<typeof t>[0])}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          className="absolute end-0 top-[calc(100%+8px)] z-30 w-52 overflow-hidden rounded-3xl border border-border bg-panel shadow-float"
          role="listbox"
          aria-label={t("wsLabel")}
        >
          <div className="p-2">
            {WORKSPACES.map((ws) => {
              const Icon = ws.icon;
              const isActive = ws.id === current;
              return (
                <button
                  key={ws.id}
                  role="option"
                  aria-selected={isActive}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-start text-xs font-semibold transition",
                    isActive
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                      : "text-foreground hover:bg-background"
                  )}
                  onClick={() => {
                    onChange(ws.id);
                    setOpen(false);
                  }}
                >
                  <Icon className={cn("h-4 w-4", ws.color)} />
                  {t(ws.labelKey as Parameters<typeof t>[0])}
                  {isActive && (
                    <span className="ms-auto h-2 w-2 rounded-full bg-brand-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
