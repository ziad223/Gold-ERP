/**
 * DARFUS Dashboard — Widget Catalog Registry (PRODUCTION / LOCKED)
 * Central registry for all widget definitions.
 * Widgets are filtered by role/workspace at runtime.
 * titleKey values are relative to the "Dashboard" i18n namespace.
 */

import type { DashboardWidgetDefinition } from "../contracts/widget-types";
import { WIDGET_IDS } from "../contracts/widget-types";

export const WIDGET_CATALOG: DashboardWidgetDefinition[] = [
  // ── KPI Zone ──────────────────────────────────────────────────────────────
  {
    id: WIDGET_IDS.SALES_TODAY,
    titleKey: "todaySales",
    type: "KPI",
    intent: "SALES_TODAY",
    zone: "KPI",
    workspaces: ["EXECUTIVE", "SALES"],
    allowedRoles: ["admin", "owner", "manager", "accountant", "sales"],
    refreshMode: "INTERVAL",
    refreshIntervalMs: 60_000,
    priority: "CRITICAL",
    navigationTarget: "/sales",
    defaultSize: "MD",
    visibleByDefault: true,
  },
  {
    id: WIDGET_IDS.SALES_MONTH,
    titleKey: "salesMonth",
    type: "KPI",
    intent: "SALES_MONTH",
    zone: "KPI",
    workspaces: ["EXECUTIVE", "SALES"],
    allowedRoles: ["admin", "owner", "manager", "accountant"],
    requiredPermissions: [],
    refreshMode: "INTERVAL",
    refreshIntervalMs: 300_000,
    priority: "HIGH",
    navigationTarget: "/sales",
    defaultSize: "MD",
    visibleByDefault: true,
  },
  {
    id: WIDGET_IDS.PROFIT_ANALYTICS,
    titleKey: "profitToday",
    type: "KPI",
    intent: "PROFIT_TODAY",
    zone: "KPI",
    workspaces: ["EXECUTIVE", "ACCOUNTING"],
    allowedRoles: ["admin", "owner", "manager", "accountant"],
    requiredPermissions: ["viewMargins"],
    refreshMode: "INTERVAL",
    refreshIntervalMs: 120_000,
    priority: "HIGH",
    navigationTarget: "/accounting",
    defaultSize: "MD",
    visibleByDefault: true,
  },
  {
    id: WIDGET_IDS.INVENTORY_STATUS,
    titleKey: "inventoryStatus",
    type: "KPI",
    intent: "INVENTORY_STATUS",
    zone: "KPI",
    workspaces: ["EXECUTIVE", "INVENTORY"],
    allowedRoles: ["admin", "owner", "manager", "accountant", "sales"],
    requiredPermissions: [],
    refreshMode: "INTERVAL",
    refreshIntervalMs: 300_000,
    priority: "HIGH",
    navigationTarget: "/inventory",
    defaultSize: "MD",
    visibleByDefault: true,
  },

  // ── Gold Market Zone ──────────────────────────────────────────────────────
  {
    id: WIDGET_IDS.GOLD_PRICE_LIVE,
    titleKey: "goldPrice",
    type: "INDICATOR",
    intent: "GOLD_PRICE_LIVE",
    zone: "GOLD_MARKET",
    workspaces: ["EXECUTIVE", "SALES", "INVENTORY", "ACCOUNTING"],
    allowedRoles: ["admin", "owner", "manager", "accountant", "sales"],
    refreshMode: "INTERVAL",
    refreshIntervalMs: 30_000,
    priority: "CRITICAL",
    navigationTarget: "/inventory",
    defaultSize: "LG",
    visibleByDefault: true,
  },

  // ── Alerts Zone ───────────────────────────────────────────────────────────
  {
    id: WIDGET_IDS.LOW_STOCK_ALERT,
    titleKey: "lowStockAlert",
    type: "LIST",
    intent: "LOW_STOCK_ALERT",
    zone: "ALERTS",
    workspaces: ["EXECUTIVE", "INVENTORY", "SALES"],
    allowedRoles: ["admin", "owner", "manager", "sales"],
    refreshMode: "INTERVAL",
    refreshIntervalMs: 120_000,
    priority: "HIGH",
    navigationTarget: "/inventory",
    defaultSize: "MD",
    visibleByDefault: true,
  },

  // ── Operations Zone ────────────────────────────────────────────────────────
  {
    id: WIDGET_IDS.PENDING_TRANSFERS,
    titleKey: "pendingTransfers",
    type: "LIST",
    intent: "PENDING_TRANSFERS",
    zone: "OPERATIONS",
    workspaces: ["EXECUTIVE", "INVENTORY"],
    allowedRoles: ["admin", "owner", "manager"],
    refreshMode: "INTERVAL",
    refreshIntervalMs: 60_000,
    priority: "HIGH",
    navigationTarget: "/inventory",
    defaultSize: "SM",
    visibleByDefault: true,
  },
  {
    id: WIDGET_IDS.ACTIVE_RESERVATIONS,
    titleKey: "activeReservations",
    type: "LIST",
    intent: "ACTIVE_RESERVATIONS",
    zone: "OPERATIONS",
    workspaces: ["EXECUTIVE", "SALES"],
    allowedRoles: ["admin", "owner", "manager", "sales"],
    refreshMode: "INTERVAL",
    refreshIntervalMs: 60_000,
    priority: "MEDIUM",
    navigationTarget: "/sales",
    defaultSize: "SM",
    visibleByDefault: true,
  },
  {
    id: WIDGET_IDS.PENDING_INVOICES,
    titleKey: "latestInvoices",
    type: "TABLE",
    intent: "PENDING_INVOICES",
    zone: "OPERATIONS",
    workspaces: ["EXECUTIVE", "SALES", "ACCOUNTING"],
    allowedRoles: ["admin", "owner", "manager", "accountant", "sales"],
    refreshMode: "INTERVAL",
    refreshIntervalMs: 120_000,
    priority: "HIGH",
    navigationTarget: "/sales",
    defaultSize: "LG",
    visibleByDefault: true,
  },

  // ── Insights Zone ─────────────────────────────────────────────────────────
  {
    id: WIDGET_IDS.CASH_FLOW,
    titleKey: "cashFlow",
    type: "CHART",
    intent: "CASH_FLOW",
    zone: "INSIGHTS",
    workspaces: ["EXECUTIVE", "ACCOUNTING"],
    allowedRoles: ["admin", "owner", "manager", "accountant"],
    requiredPermissions: ["viewMargins"],
    refreshMode: "CACHED",
    refreshIntervalMs: 600_000,
    priority: "MEDIUM",
    navigationTarget: "/accounting",
    defaultSize: "LG",
    visibleByDefault: true,
  },
  {
    id: WIDGET_IDS.CUSTOMER_ACTIVITY,
    titleKey: "customerActivity",
    type: "KPI",
    intent: "CUSTOMER_ACTIVITY",
    zone: "INSIGHTS",
    workspaces: ["EXECUTIVE", "SALES"],
    allowedRoles: ["admin", "owner", "manager", "sales"],
    refreshMode: "INTERVAL",
    refreshIntervalMs: 300_000,
    priority: "MEDIUM",
    navigationTarget: "/customers",
    defaultSize: "SM",
    visibleByDefault: true,
  },
  {
    id: WIDGET_IDS.BRANCH_PERFORMANCE,
    titleKey: "branchPerformance",
    type: "TABLE",
    intent: "BRANCH_PERFORMANCE",
    zone: "INSIGHTS",
    workspaces: ["EXECUTIVE"],
    allowedRoles: ["admin", "owner", "manager"],
    refreshMode: "CACHED",
    refreshIntervalMs: 600_000,
    priority: "LOW",
    navigationTarget: "/reports",
    defaultSize: "LG",
    visibleByDefault: false,
  },
];

/** Look up a widget definition by ID */
export function getWidgetDefinition(id: string): DashboardWidgetDefinition | undefined {
  return WIDGET_CATALOG.find((w) => w.id === id);
}

/** Get all widgets visible for a given role and workspace */
export function getWidgetsForContext(
  role: string,
  workspace: string,
  hiddenIds: string[] = []
): DashboardWidgetDefinition[] {
  return WIDGET_CATALOG.filter((w) => {
    if (hiddenIds.includes(w.id)) return false;
    if (!w.allowedRoles.includes(role)) return false;
    if (!w.workspaces.includes(workspace as never)) return false;
    return true;
  });
}
