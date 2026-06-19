/**
 * DARFUS Dashboard Feature — Public API
 * Only import from this file in external modules.
 * Internal sub-modules should import directly from their paths.
 */

// Contracts
export type {
  DashboardWidgetDefinition,
  DashboardWidgetType,
  DashboardRefreshMode,
  DashboardWidgetPriority,
  DashboardWidgetSize,
  DashboardWidgetState,
  DashboardWidgetStatus,
  DashboardZone,
  DashboardWorkspace,
  DashboardMode,
  DashboardPreferences,
  WidgetId,
} from "./contracts/widget-types";

export {
  WIDGET_IDS,
  DEFAULT_DASHBOARD_PREFERENCES,
  DASHBOARD_MAX_VISIBLE_WIDGETS,
} from "./contracts/widget-types";

// Data Contracts
export type {
  DashboardOverview,
  DashboardKPIData,
  DashboardGoldData,
  DashboardAlert,
  DashboardOperationsData,
  DashboardInventoryData,
  DashboardSalesChartData,
  DashboardCustomerData,
  DashboardInvoiceRow,
  DashboardBranchData,
  DashboardQueryContext,
  DashboardWidgetResult,
} from "./contracts/data-contracts";

// Registry
export { WIDGET_CATALOG, getWidgetDefinition, getWidgetsForContext } from "./registry/widget-catalog";

// State Hook
export { useDashboardState } from "./hooks/use-dashboard-state";
export type { UseDashboardStateReturn } from "./hooks/use-dashboard-state";

// Components
export { KPICard, StatRow } from "./components/kpi-card";
export { GoldMarketWidget } from "./components/gold-market-widget";
export { AlertsWidget } from "./components/alerts-widget";
export { OperationsWidget } from "./components/operations-widget";
export { QuickActionsPanel } from "./components/quick-actions";
export { SalesInsightsWidget } from "./components/sales-insights-widget";
export { RecentInvoicesWidget } from "./components/recent-invoices-widget";
export { InventoryDistributionWidget } from "./components/inventory-distribution-widget";
export { OfflineBanner } from "./components/offline-banner";
export { WorkspaceSwitcher } from "./components/workspace-switcher";
export { CommandPalette, useCommandPalette } from "./components/command-palette";
export { CustomizationDrawer } from "./components/customization-drawer";
export { WidgetSkeleton } from "./components/widget-skeleton";
