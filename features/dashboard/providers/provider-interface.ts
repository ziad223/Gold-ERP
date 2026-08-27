/**
 * DARFUS Dashboard — Data Provider Interface (PRODUCTION / LOCKED)
 * Dashboard Widgets never access ERP context directly.
 * They go through this provider interface.
 *
 * Current implementation: LocalDashboardProvider (uses ErpContext data)
 * Future: ApiDashboardProvider (Backend-ready contract)
 */

import type {
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
  DashboardWidgetResult,
} from "../contracts/data-contracts";
import type { DashboardQueryContext } from "../contracts/data-contracts";

export interface DashboardDataProvider {
  /** Full overview for initial dashboard load */
  getOverview(context: DashboardQueryContext): Promise<DashboardOverview>;

  /** KPI data for Critical KPI Zone */
  getKPIs(context: DashboardQueryContext): Promise<DashboardWidgetResult<DashboardKPIData>>;

  /** Gold market data */
  getGoldPrice(context: DashboardQueryContext): Promise<DashboardWidgetResult<DashboardGoldData>>;

  /** Operational alerts list */
  getAlerts(context: DashboardQueryContext): Promise<DashboardWidgetResult<DashboardAlert[]>>;

  /** Operations zone data */
  getOperations(context: DashboardQueryContext): Promise<DashboardWidgetResult<DashboardOperationsData>>;

  /** Inventory analytics */
  getInventoryStatus(context: DashboardQueryContext): Promise<DashboardWidgetResult<DashboardInventoryData>>;

  /** Sales trend chart data */
  getSalesChart(context: DashboardQueryContext): Promise<DashboardWidgetResult<DashboardSalesChartData>>;

  /** Customer activity */
  getCustomerActivity(context: DashboardQueryContext): Promise<DashboardWidgetResult<DashboardCustomerData>>;

  /** Recent invoices */
  getRecentInvoices(context: DashboardQueryContext): Promise<DashboardWidgetResult<DashboardInvoiceRow[]>>;

  /** Branch performance */
  getBranchPerformance(context: DashboardQueryContext): Promise<DashboardWidgetResult<DashboardBranchData>>;

  /** Generic widget data by intent tag */
  getWidget<T>(
    widgetIntent: string,
    context: DashboardQueryContext
  ): Promise<DashboardWidgetResult<T>>;
}

/** Realtime client abstraction — decoupled from WebSocket implementation */
export interface DashboardRealtimeClient {
  connect(): void;
  disconnect(): void;
  subscribe(handler: (event: DashboardRealtimeEvent) => void): () => void;
  isConnected(): boolean;
}

export interface DashboardRealtimeEvent {
  eventId: string;         // deduplicate by this ID
  type: DashboardEventType;
  widgetIds: string[];     // which widgets to refresh
  payload?: unknown;
  timestamp: number;
}

export type DashboardEventType =
  | "KPI_UPDATE"
  | "GOLD_PRICE_UPDATE"
  | "ALERT_PUSH"
  | "INVENTORY_CHANGE"
  | "TREASURY_CHANGE"
  | "NOTIFICATION_PUSH";

/** Offline snapshot storage contract */
export interface DashboardOfflineStore {
  saveSnapshot(overview: DashboardOverview): void;
  loadSnapshot(): DashboardOverview | null;
  clearSnapshot(): void;
  getSnapshotAge(): number | null; // ms since last save
}
