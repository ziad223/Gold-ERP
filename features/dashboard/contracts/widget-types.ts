/**
 * DARFUS Dashboard — Widget System Contracts (PRODUCTION / LOCKED)
 * Frontend-only. No business logic. Pure type definitions.
 * DO NOT import or reference database/API internals here.
 */

// ─── Widget Classification ────────────────────────────────────────────────────

export type DashboardWidgetType =
  | "KPI"        // Single big number with trend
  | "STATUS"     // Status indicator (health, connection, etc.)
  | "LIST"       // Short list of items
  | "TABLE"      // Compact table (max 5 rows)
  | "CHART"      // Trend chart
  | "INDICATOR"; // Color/direction indicator

export type DashboardRefreshMode =
  | "REALTIME"   // Immediate on events
  | "INTERVAL"   // Scheduled polling
  | "CACHED"     // Background / on-demand
  | "ON_DEMAND"; // Manual refresh only

export type DashboardWidgetPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type DashboardWidgetSize = "SM" | "MD" | "LG";

// ─── Widget Definition (Catalog Entry) ───────────────────────────────────────

export interface DashboardWidgetDefinition {
  id: string;
  titleKey: string;            // i18n key
  descriptionKey?: string;
  type: DashboardWidgetType;
  intent: string;              // semantic tag, e.g. "SALES_TODAY"
  zone: DashboardZone;
  workspaces: DashboardWorkspace[];
  allowedRoles: string[];
  requiredPermissions?: string[];  // keys from PermissionSet
  refreshMode: DashboardRefreshMode;
  refreshIntervalMs?: number;
  priority: DashboardWidgetPriority;
  navigationTarget?: string;   // href to navigate on click
  defaultSize: DashboardWidgetSize;
  visibleByDefault: boolean;
  maxPerView?: number;         // limit instances
}

// ─── Widget Runtime State ────────────────────────────────────────────────────

export type DashboardWidgetStatus =
  | "IDLE"
  | "LOADING"
  | "READY"
  | "EMPTY"
  | "ERROR"
  | "UPDATING"
  | "CACHED";

export interface DashboardWidgetState<T = unknown> {
  id: string;
  status: DashboardWidgetStatus;
  data: T | null;
  lastUpdated: number | null;  // Unix ms timestamp
  source: "LIVE" | "LOCAL" | "CACHE";
  errorMessage?: string;
  isCached?: boolean;
}

// ─── Dashboard Zones ─────────────────────────────────────────────────────────

export type DashboardZone =
  | "KPI"
  | "GOLD_MARKET"
  | "OPERATIONS"
  | "ALERTS"
  | "INSIGHTS"
  | "QUICK_ACTIONS";

// ─── Workspaces ───────────────────────────────────────────────────────────────

export type DashboardWorkspace =
  | "EXECUTIVE"
  | "SALES"
  | "INVENTORY"
  | "ACCOUNTING";

// ─── Dashboard Mode ───────────────────────────────────────────────────────────

export type DashboardMode = "SIMPLE" | "ADVANCED";

// ─── Dashboard Preferences (persisted per user) ───────────────────────────────

export interface DashboardPreferences {
  workspace: DashboardWorkspace;
  mode: DashboardMode;
  hiddenWidgetIds: string[];
  widgetOrder: string[];       // ordered list of widget IDs
  widgetSizes: Record<string, DashboardWidgetSize>;
  isLightMode: boolean;       // "Light Dashboard" toggle for low-spec devices
}

export const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
  workspace: "EXECUTIVE",
  mode: "SIMPLE",
  hiddenWidgetIds: [],
  widgetOrder: [],
  widgetSizes: {},
  isLightMode: false,
};

// ─── Widget Catalog (all available widget IDs) ────────────────────────────────

export const WIDGET_IDS = {
  SALES_TODAY: "SALES_TODAY",
  SALES_MONTH: "SALES_MONTH",
  INVENTORY_STATUS: "INVENTORY_STATUS",
  LOW_STOCK_ALERT: "LOW_STOCK_ALERT",
  GOLD_PRICE_LIVE: "GOLD_PRICE_LIVE",
  CASH_FLOW: "CASH_FLOW",
  PROFIT_ANALYTICS: "PROFIT_ANALYTICS",
  CUSTOMER_ACTIVITY: "CUSTOMER_ACTIVITY",
  PENDING_INVOICES: "PENDING_INVOICES",
  BRANCH_PERFORMANCE: "BRANCH_PERFORMANCE",
  PENDING_TRANSFERS: "PENDING_TRANSFERS",
  ACTIVE_RESERVATIONS: "ACTIVE_RESERVATIONS",
} as const;

export type WidgetId = (typeof WIDGET_IDS)[keyof typeof WIDGET_IDS];

// ─── Max limits ───────────────────────────────────────────────────────────────

export const DASHBOARD_MAX_VISIBLE_WIDGETS = 12;
export const DASHBOARD_MAX_REALTIME_WIDGETS = 5;
