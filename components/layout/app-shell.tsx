"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { CompanyFaviconUpdater } from "./company-favicon-updater";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "darfus-sidebar-collapsed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const rtl = locale === "ar";
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "true");
  }, []);

  const toggle = () => {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(COLLAPSE_KEY, String(next));
      return next;
    });
  };

  return (
    <div className="app-shell min-h-screen bg-background" data-app-shell="true">
      <CompanyFaviconUpdater />
      <Sidebar open={open} onClose={() => setOpen(false)} collapsed={collapsed} onToggle={toggle} />
      <div
        className={cn(
          "min-h-screen transition-[margin] duration-300",
          rtl
            ? collapsed
              ? "lg:mr-[88px]"
              : "lg:mr-[288px]"
            : collapsed
              ? "lg:ml-[88px]"
              : "lg:ml-[288px]",
        )}
      >
        <Header onOpenSidebar={() => setOpen(true)} />
        <main className="mx-auto max-w-[1700px] p-4 sm:p-5 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
