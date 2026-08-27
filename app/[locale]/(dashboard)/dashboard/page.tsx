"use client";

/**
 * DARFUS Dashboard Page — CALM EXECUTIVE COCKPIT (PRODUCTION / LOCKED)
 *
 * Architecture:
 *  - Reads data ONLY via useDashboardState → LocalDashboardProvider → ErpContext
 *  - No direct useErp() calls inside this page
 *  - No business logic here — display + navigation only
 *  - Role-based widget visibility enforced before render
 *  - Offline snapshot fallback handled transparently
 *
 * Widget Load Order (performance):
 *  1. Critical KPIs (immediate)
 *  2. Alerts + Gold
 *  3. Operations
 *  4. Insights / Analytics (lazy)
 */

import { Suspense, lazy, useMemo, useState } from "react";
import {
  CircleDollarSign,
  Boxes,
  PackageCheck,
  UsersRound,
  TrendingUp,
  Settings2,
  RefreshCw,
  Zap,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/use-permissions";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";

// Dashboard feature imports
import { useDashboardState } from "@/features/dashboard/hooks/use-dashboard-state";
import { KPICard } from "@/features/dashboard/components/kpi-card";
import { GoldMarketWidget } from "@/features/dashboard/components/gold-market-widget";
import { AlertsWidget } from "@/features/dashboard/components/alerts-widget";
import { OperationsWidget } from "@/features/dashboard/components/operations-widget";
import { QuickActionsPanel } from "@/features/dashboard/components/quick-actions";
import { OfflineBanner } from "@/features/dashboard/components/offline-banner";
import { WorkspaceSwitcher } from "@/features/dashboard/components/workspace-switcher";
import { CommandPalette, useCommandPalette } from "@/features/dashboard/components/command-palette";
import { CustomizationDrawer } from "@/features/dashboard/components/customization-drawer";
import { RecentInvoicesWidget } from "@/features/dashboard/components/recent-invoices-widget";
import { InventoryDistributionWidget } from "@/features/dashboard/components/inventory-distribution-widget";
import { WidgetSkeleton } from "@/features/dashboard/components/widget-skeleton";
import { WIDGET_CATALOG } from "@/features/dashboard";

// Lazy-loaded heavy widgets
const SalesInsightsWidget = lazy(
  () => import("@/features/dashboard/components/sales-insights-widget").then((m) => ({ default: m.SalesInsightsWidget }))
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const { company, user } = useAuth();
  const { role, viewCosts, viewMargins } = usePermissions();
  const currency = company?.currency ?? "AED";
  const money = (v: number) => formatCurrency(v, currency, locale);

  const {
    overview,
    isLoading,
    isOffline,
    isCached,
    snapshotAgeMs,
    preferences,
    setWorkspace,
    setMode,
    toggleWidgetVisibility,
    resetPreferences,
    refresh,
  } = useDashboardState();

  const { isOpen: cmdOpen, close: cmdClose, open: cmdOpen_ } = useCommandPalette();
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const kpis = overview?.kpis;
  const isWidgetHidden = (id: string) => preferences.hiddenWidgetIds.includes(id);
  const isWidgetVisible = (id: string) => {
    if (isWidgetHidden(id)) return false;
    const def = WIDGET_CATALOG.find((w) => w.id === id);
    if (!def) return true;
    if (role && !def.allowedRoles.includes(role)) return false;
    if (!def.workspaces.includes(preferences.workspace)) return false;
    if (def.requiredPermissions) {
      for (const p of def.requiredPermissions) {
        if (p === "viewCosts" && !viewCosts) return false;
        if (p === "viewMargins" && !viewMargins) return false;
      }
    }
    return true;
  };
  const isSimple = preferences.mode === "SIMPLE";

  // ── Greeting ────────────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greetingKey =
    hour < 12 ? "greetingMorning" : hour < 17 ? "greetingAfternoon" : "greetingEvening";

  return (
    <>
      {/* Command Palette */}
      <CommandPalette isOpen={cmdOpen} onClose={cmdClose} />

      {/* Customization Drawer */}
      <CustomizationDrawer
        isOpen={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        preferences={preferences}
        onToggleWidget={toggleWidgetVisibility}
        onSetMode={setMode}
        onReset={resetPreferences}
        userRole={role ?? "sales"}
      />

      {/* Page */}
      <div className="space-y-6">
        {/* ── Page Header ───────────────────────────────────────────────────── */}
        <PageHeader
          title={t(greetingKey, { name: user?.firstName ?? "Admin" })}
          description={t("description", { company: company?.businessName ?? "DARFUS" })}
          actions={
            <>
              {/* Workspace Switcher */}
              <WorkspaceSwitcher
                current={preferences.workspace}
                onChange={setWorkspace}
              />

              {/* Mode Toggle */}
              <button
                onClick={() => setMode(isSimple ? "ADVANCED" : "SIMPLE")}
                className="hidden h-10 items-center gap-2 rounded-2xl border border-border bg-panel px-3 text-xs font-bold text-foreground transition hover:border-brand-500 sm:flex"
              >
                <Zap className="h-4 w-4 text-gold-500" />
                {isSimple ? t("switchAdvanced") : t("switchSimple")}
              </button>

              {/* Command Palette shortcut */}
              <button
                onClick={cmdOpen_}
                className="hidden h-10 items-center gap-2 rounded-2xl border border-border bg-panel px-3 text-xs font-semibold text-muted-foreground transition hover:border-brand-500 lg:flex"
              >
                <span>⌘K</span>
                <span>{t("searchAll")}</span>
              </button>

              {/* Refresh */}
              <button
                onClick={refresh}
                className="grid h-10 w-10 place-items-center rounded-2xl border border-border bg-panel text-muted-foreground transition hover:text-foreground"
                aria-label={t("refreshData")}
              >
                <RefreshCw className="h-4 w-4" />
              </button>

              {/* Customize */}
              <button
                onClick={() => setCustomizeOpen(true)}
                className="grid h-10 w-10 place-items-center rounded-2xl border border-border bg-panel text-muted-foreground transition hover:border-brand-500 hover:text-brand-600"
                aria-label={t("customizeTitle")}
              >
                <Settings2 className="h-4 w-4" />
              </button>

              {/* New Sale CTA */}
              <Link href="/pos">
                <Button>
                  <TrendingUp className="h-4 w-4" />
                  {t("newSale")}
                </Button>
              </Link>
            </>
          }
        />

        {/* ── Offline / Cache Banner ─────────────────────────────────────── */}
        <OfflineBanner
          isOffline={isOffline}
          isCached={isCached}
          snapshotAgeMs={snapshotAgeMs}
          onRefresh={refresh}
        />

        {/* ── ZONE 1: Critical KPIs ──────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Today's Sales — always visible */}
          {isWidgetVisible("SALES_TODAY") && (
            <KPICard
              title={t("todaySales")}
              value={isLoading ? "—" : money(kpis?.salesToday ?? 0)}
              change={12.8}
              hint={t("comparedYesterday")}
              icon={CircleDollarSign}
              tone="violet"
              href="/sales"
              isLoading={isLoading}
              isCached={isCached}
            />
          )}

          {/* Stock Value — only if viewCosts */}
          {isWidgetVisible("INVENTORY_STATUS") && viewCosts && (
            <KPICard
              title={t("stockValue")}
              value={isLoading ? "—" : kpis?.inventoryValue != null ? money(kpis.inventoryValue) : t("permissionHidden")}
              change={3.4}
              hint={t("monthStart")}
              icon={Boxes}
              tone="gold"
              href="/inventory"
              isLoading={isLoading}
              isCached={isCached}
            />
          )}

          {/* Available Assets */}
          {isWidgetVisible("INVENTORY_STATUS") && (
            <KPICard
              title={t("availableAssets")}
              value={isLoading ? "—" : `${kpis?.availableAssetCount ?? 0} ${t("asset")}`}
              change={-2.1}
              hint={t("afterReservations")}
              icon={PackageCheck}
              tone="emerald"
              href="/inventory"
              isLoading={isLoading}
              isCached={isCached}
            />
          )}

          {/* Active Customers */}
          {isWidgetVisible("CUSTOMER_ACTIVITY") && (
            <KPICard
              title={t("activeCustomers")}
              value={isLoading ? "—" : `${kpis?.activeCustomerCount ?? 0}`}
              change={8.7}
              hint={t("last30")}
              icon={UsersRound}
              tone="blue"
              href="/customers"
              isLoading={isLoading}
              isCached={isCached}
            />
          )}
        </div>

        {/* Today Profit + Month Sales (Advanced mode only) */}
        {!isSimple && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis?.profitToday != null && isWidgetVisible("PROFIT_ANALYTICS") && (
              <KPICard
                title={t("profitToday")}
                value={isLoading ? "—" : money(kpis.profitToday)}
                change={5.2}
                hint={t("vs30DayAvg")}
                icon={TrendingUp}
                tone="emerald"
                href="/accounting"
                isLoading={isLoading}
                isCached={isCached}
              />
            )}
            {isWidgetVisible("SALES_MONTH") && (
              <KPICard
                title={t("salesMonth")}
                value={isLoading ? "—" : money(kpis?.salesMonth ?? 0)}
                change={9.1}
                hint={t("monthToDate")}
                icon={CircleDollarSign}
                tone="violet"
                href="/sales"
                isLoading={isLoading}
                isCached={isCached}
              />
            )}
          </div>
        )}

        {/* ── ZONE 2: Gold Market ────────────────────────────────────────── */}
        {isWidgetVisible("GOLD_PRICE_LIVE") && (
          <GoldMarketWidget
            data={overview?.gold ?? null}
            isLoading={isLoading}
            isCached={isCached}
            currency={currency}
            onRefresh={refresh}
          />
        )}

        {/* ── ZONE 3: Operations + Alerts (side by side) ────────────────── */}
        <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
          {isWidgetVisible("PENDING_INVOICES") && (
            <RecentInvoicesWidget
              invoices={overview?.recentInvoices ?? []}
              isLoading={isLoading}
              currency={currency}
            />
          )}
          {isWidgetVisible("LOW_STOCK_ALERT") && (
            <AlertsWidget
              alerts={overview?.alerts ?? []}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* ── ZONE 4: Insights + Inventory ──────────────────────────────── */}
        {!isSimple && (
          <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
            {/* Sales Chart */}
            {isWidgetVisible("SALES_MONTH") && (
              <Suspense
                fallback={
                  <div className="rounded-3xl border border-border bg-panel p-5">
                    <WidgetSkeleton lines={4} />
                  </div>
                }
              >
                <SalesInsightsWidget
                  data={overview?.salesChart ?? null}
                  isLoading={isLoading}
                  currency={currency}
                />
              </Suspense>
            )}

            {/* Inventory Distribution */}
            {isWidgetVisible("INVENTORY_STATUS") && (
              <InventoryDistributionWidget
                data={overview?.inventory ?? null}
                isLoading={isLoading}
              />
            )}
          </div>
        )}

        {/* ── ZONE 5: Operations ────────────────────────────────────────── */}
        {!isSimple && isWidgetVisible("PENDING_TRANSFERS") && (
          <OperationsWidget
            data={overview?.operations ?? null}
            isLoading={isLoading}
          />
        )}

        {/* ── ZONE 6: Quick Actions ──────────────────────────────────────── */}
        <QuickActionsPanel />
      </div>
    </>
  );
}
