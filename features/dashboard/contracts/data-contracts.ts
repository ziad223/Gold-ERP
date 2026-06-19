/**
 * DARFUS Dashboard — Data Contracts (PRODUCTION / LOCKED)
 * Shapes for data flowing from Provider → Widgets.
 * These are read-only aggregated views; never mutated by Dashboard.
 */

// ─── Query Context ────────────────────────────────────────────────────────────

export interface DashboardQueryContext {
  branch: string;      // active branch name
  userId: string;
  role: string;
  workspace: string;
  locale: string;
  currency: string;
  dateRange?: {
    from: string;      // ISO date string
    to: string;
  };
}

// ─── KPI Overview ─────────────────────────────────────────────────────────────

export interface DashboardKPIData {
  salesToday: number;
  salesMonth: number;
  transactionsToday: number;
  profitToday: number | null;      // null if no viewMargins permission
  vatToday: number | null;
  inventoryValue: number | null;   // null if no viewCosts permission
  availableAssetCount: number;
  activeCustomerCount: number;
  treasuryBalance: number | null;
}

// ─── Gold Market ──────────────────────────────────────────────────────────────

export interface GoldKaratPrice {
  karat: number;
  pricePerGram: number;
  currency: string;
}

export interface DashboardGoldData {
  updatedAt: string;
  updatedBy: string;
  prices: GoldKaratPrice[];
  trend: "UP" | "DOWN" | "FLAT";
  changePercent: number;
  isStale: boolean;  // true if > 30 min old
}

// ─── Operations ───────────────────────────────────────────────────────────────

export interface PendingItem {
  id: string;
  label: string;
  count: number;
  severity: "critical" | "high" | "medium" | "low";
  navigationTarget?: string;
}

export interface DashboardOperationsData {
  pendingTransfers: PendingItem[];
  activeReservations: PendingItem[];
  pendingApprovals: PendingItem[];
  pendingInvoices: PendingItem[];
  pendingPurchaseOrders: PendingItem[];
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export type AlertSeverity = "critical" | "high" | "medium" | "low";
export type AlertCategory =
  | "STOCK"
  | "FINANCIAL"
  | "SECURITY"
  | "TRANSFER"
  | "RESERVATION"
  | "MANUFACTURING"
  | "SYSTEM";

export interface DashboardAlert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  titleKey: string;
  messageKey: string;
  messageParams?: Record<string, string | number>;
  navigationTarget?: string;
  createdAt: number;
  isRead: boolean;
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export interface InventoryDistribution {
  label: string;
  labelKey: string;
  value: number;
  percentage: number;
  color: string;
}

export interface DashboardInventoryData {
  totalAssets: number;
  availableAssets: number;
  reservedAssets: number;
  lowStockCount: number;
  distribution: InventoryDistribution[];
  netGoldWeight: number;
}

// ─── Branch Performance ───────────────────────────────────────────────────────

export interface BranchKPI {
  name: string;
  sales: number;
  assetCount: number;
  change: number;
}

export interface DashboardBranchData {
  branches: BranchKPI[];
  topBranch: string;
}

// ─── Sales Chart ─────────────────────────────────────────────────────────────

export interface SalesChartPoint {
  label: string;
  value: number;
}

export interface DashboardSalesChartData {
  points: SalesChartPoint[];
  total: number;
  average: number;
  trend: "UP" | "DOWN" | "FLAT";
}

// ─── Customer Activity ────────────────────────────────────────────────────────

export interface DashboardCustomerData {
  totalActive: number;
  newThisMonth: number;
  vipCount: number;
  withDueBalance: number;
  topCustomers: Array<{
    id: string;
    name: string;
    totalPurchases: number;
  }>;
}

// ─── Recent Invoices ──────────────────────────────────────────────────────────

export interface DashboardInvoiceRow {
  id: string;
  customerName: string;
  branch: string;
  total: number;
  status: string;
  date: string;
}

// ─── Widget Result Envelope ───────────────────────────────────────────────────

export interface DashboardWidgetResult<T> {
  data: T | null;
  source: "LIVE" | "LOCAL" | "CACHE";
  cachedAt?: number;
  requestId: string;
  ok: boolean;
  errorCode?: string;
}

// ─── Overview (combined) ──────────────────────────────────────────────────────

export interface DashboardOverview {
  kpis: DashboardKPIData;
  gold: DashboardGoldData;
  alerts: DashboardAlert[];
  operations: DashboardOperationsData;
  inventory: DashboardInventoryData;
  salesChart: DashboardSalesChartData;
  customers: DashboardCustomerData;
  recentInvoices: DashboardInvoiceRow[];
  branches: DashboardBranchData;
}
