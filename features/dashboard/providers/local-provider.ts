/**
 * DARFUS Dashboard — Local Data Provider (PRODUCTION)
 * Reads from ERP Context data (demo/local mode).
 * This is the active provider until a real backend is available.
 * All computations are precomputed and memoized — NOT inside Widget render.
 *
 * DEMO NOTE (internal only): Data comes from demo-data / LocalStorage state.
 */

import type { DashboardDataProvider } from "./provider-interface";
import type {
  DashboardQueryContext,
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
import type {
  Invoice,
  Asset,
  Customer,
  Transfer,
  Reservation,
  ApprovalRequest,
  PurchaseOrder,
  GoldPriceSnapshot,
} from "@/lib/types";
import { toEnglishDigits } from "@/lib/formatters/numbers";

// ─── Snapshot of ERP state passed into provider ───────────────────────────────

export interface ErpSnapshot {
  invoices: Invoice[];
  assets: Asset[];
  customers: Customer[];
  transfers: Transfer[];
  reservations: Reservation[];
  approvals: ApprovalRequest[];
  purchaseOrders: PurchaseOrder[];
  goldPrice: GoldPriceSnapshot;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeResult<T>(data: T, source: "LOCAL" | "CACHE" = "LOCAL"): DashboardWidgetResult<T> {
  return {
    data,
    source,
    ok: true,
    requestId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    cachedAt: Date.now(),
  };
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Provider Implementation ──────────────────────────────────────────────────

export class LocalDashboardProvider implements DashboardDataProvider {
  private snapshot: ErpSnapshot;
  private canViewCosts: boolean;
  private canViewMargins: boolean;

  constructor(snapshot: ErpSnapshot, canViewCosts: boolean, canViewMargins: boolean) {
    this.snapshot = snapshot;
    this.canViewCosts = canViewCosts;
    this.canViewMargins = canViewMargins;
  }

  // ── KPIs ────────────────────────────────────────────────────────────────────

  async getKPIs(ctx: DashboardQueryContext): Promise<DashboardWidgetResult<DashboardKPIData>> {
    const { invoices, assets, customers } = this.snapshot;
    const today = getToday();

    const todayInvoices = invoices.filter((inv) => {
      const invBranch = ctx.branch === "All" || !ctx.branch || inv.branch === ctx.branch;
      return invBranch && inv.date >= today && inv.status !== "cancelled";
    });

    const salesToday = todayInvoices.reduce((sum, inv) => sum + Math.max(inv.total, 0), 0);
    const vatToday = todayInvoices.reduce((sum, inv) => sum + (inv.tax ?? 0), 0);
    const transactionsToday = todayInvoices.length;

    // Month sales
    const monthStart = today.slice(0, 7) + "-01";
    const monthInvoices = invoices.filter(
      (inv) => inv.date >= monthStart && inv.status !== "cancelled"
    );
    const salesMonth = monthInvoices.reduce((sum, inv) => sum + Math.max(inv.total, 0), 0);

    // Profit (only if permission)
    let profitToday: number | null = null;
    if (this.canViewMargins) {
      profitToday = todayInvoices.reduce((sum, inv) => {
        const costSum = inv.items.reduce((cs, item) => cs + (item.cost ?? 0) * item.quantity, 0);
        return sum + inv.total - costSum;
      }, 0);
    }

    // Inventory value (only if permission)
    let inventoryValue: number | null = null;
    if (this.canViewCosts) {
      inventoryValue = assets
        .filter((a) => a.status !== "sold" && a.status !== "melted")
        .reduce((sum, a) => sum + a.cost, 0);
    }

    const availableAssetCount = assets.filter((a) => a.status === "available").length;
    const activeCustomerCount = customers.filter((c) => !c.status || c.status === "active").length;

    // Treasury: sum of paid invoices minus partial (simplified from journals if available)
    const treasuryBalance: number | null = null; // requires accounting module

    const data: DashboardKPIData = {
      salesToday,
      salesMonth,
      transactionsToday,
      profitToday,
      vatToday: this.canViewMargins ? vatToday : null,
      inventoryValue,
      availableAssetCount,
      activeCustomerCount,
      treasuryBalance,
    };

    return makeResult(data);
  }

  // ── Gold Price ───────────────────────────────────────────────────────────────

  async getGoldPrice(ctx: DashboardQueryContext): Promise<DashboardWidgetResult<DashboardGoldData>> {
    const { goldPrice } = this.snapshot;

    const updatedAt = goldPrice.updatedAt ?? new Date().toISOString();
    const ageMs = Date.now() - new Date(updatedAt).getTime();
    const isStale = ageMs > 30 * 60 * 1000; // 30 min

    const prices = goldPrice.prices.map((p) => ({
      karat: p.karat,
      pricePerGram: p.pricePerGram,
      currency: p.currency ?? ctx.currency,
    }));

    const data: DashboardGoldData = {
      updatedAt,
      updatedBy: goldPrice.updatedBy ?? "System",
      prices,
      trend: "UP", // Demo: static trend; real backend provides direction
      changePercent: 1.2,
      isStale,
    };

    return makeResult(data);
  }

  // ── Alerts ───────────────────────────────────────────────────────────────────

  async getAlerts(ctx: DashboardQueryContext): Promise<DashboardWidgetResult<DashboardAlert[]>> {
    const { assets, reservations, transfers, approvals } = this.snapshot;
    const today = getToday();
    const alerts: DashboardAlert[] = [];
    let alertIdx = 0;

    // Low stock alert
    const availableCount = assets.filter((a) => a.status === "available").length;
    if (availableCount < 10) {
      alerts.push({
        id: `alert-lowstock-${alertIdx++}`,
        category: "STOCK",
        severity: availableCount < 5 ? "critical" : "high",
        titleKey: "alertLowStockTitle",
        messageKey: "alertLowStockMsg",
        messageParams: { count: String(availableCount) },
        navigationTarget: "/inventory",
        createdAt: Date.now(),
        isRead: false,
      });
    }

    // Expiring reservations today
    const expiringToday = reservations.filter(
      (r) => r.status === "active" && r.expiresAt.startsWith(today)
    );
    if (expiringToday.length > 0) {
      alerts.push({
        id: `alert-reservations-${alertIdx++}`,
        category: "RESERVATION",
        severity: "medium",
        titleKey: "alertReservationsTitle",
        messageKey: "alertReservationsMsg",
        messageParams: { count: String(expiringToday.length) },
        navigationTarget: "/sales",
        createdAt: Date.now(),
        isRead: false,
      });
    }

    // Pending transfers
    const pendingTransfers = transfers.filter((t) => t.status === "pending");
    if (pendingTransfers.length > 0) {
      alerts.push({
        id: `alert-transfers-${alertIdx++}`,
        category: "TRANSFER",
        severity: "low",
        titleKey: "alertTransfersTitle",
        messageKey: "alertTransfersMsg",
        messageParams: { count: String(pendingTransfers.length) },
        navigationTarget: "/inventory",
        createdAt: Date.now(),
        isRead: false,
      });
    }

    // Pending approvals
    const pendingApprovals = approvals.filter((a) => a.status === "pending");
    if (pendingApprovals.length > 0) {
      alerts.push({
        id: `alert-approvals-${alertIdx++}`,
        category: "FINANCIAL",
        severity: "medium",
        titleKey: "alertApprovalsTitle",
        messageKey: "alertApprovalsMsg",
        messageParams: { count: String(pendingApprovals.length) },
        navigationTarget: "/approvals",
        createdAt: Date.now(),
        isRead: false,
      });
    }

    void ctx; // ctx used for branch filtering in future backend
    return makeResult(alerts.slice(0, 8)); // max 8 alerts in view
  }

  // ── Operations ───────────────────────────────────────────────────────────────

  async getOperations(ctx: DashboardQueryContext): Promise<DashboardWidgetResult<DashboardOperationsData>> {
    const { transfers, reservations, invoices, approvals, purchaseOrders } = this.snapshot;

    const pendingTransferItems = transfers
      .filter((t) => t.status === "pending")
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        label: `${t.fromBranch} → ${t.toBranch}`,
        count: t.assetIds.length,
        severity: "medium" as const,
        navigationTarget: "/inventory",
      }));

    const activeReservationItems = reservations
      .filter((r) => r.status === "active")
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        label: r.customerName,
        count: 1,
        severity: "low" as const,
        navigationTarget: "/sales",
      }));

    const pendingInvoiceItems = invoices
      .filter((inv) => inv.status === "partial" || inv.status === "due")
      .slice(0, 5)
      .map((inv) => ({
        id: inv.id,
        label: inv.customerName,
        count: 1,
        severity: "medium" as const,
        navigationTarget: "/sales",
      }));

    const pendingApprovalItems = approvals
      .filter((a) => a.status === "pending")
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        label: a.description,
        count: 1,
        severity: "high" as const,
        navigationTarget: "/approvals",
      }));

    const pendingPOItems = purchaseOrders
      .filter((po) => po.status === "draft" || po.status === "sent")
      .slice(0, 5)
      .map((po) => ({
        id: po.id,
        label: po.supplierName,
        count: po.items.length,
        severity: "low" as const,
        navigationTarget: "/suppliers",
      }));

    void ctx;
    return makeResult({
      pendingTransfers: pendingTransferItems,
      activeReservations: activeReservationItems,
      pendingInvoices: pendingInvoiceItems,
      pendingApprovals: pendingApprovalItems,
      pendingPurchaseOrders: pendingPOItems,
    });
  }

  // ── Inventory ────────────────────────────────────────────────────────────────

  async getInventoryStatus(ctx: DashboardQueryContext): Promise<DashboardWidgetResult<DashboardInventoryData>> {
    const { assets } = this.snapshot;

    const total = assets.length;
    const available = assets.filter((a) => a.status === "available").length;
    const reserved = assets.filter((a) => a.status === "reserved").length;
    const lowStock = available < 10 ? 1 : 0;

    // Distribution by type
    const typeCounts: Record<string, number> = {};
    assets.filter((a) => a.status !== "sold" && a.status !== "melted").forEach((a) => {
      typeCounts[a.type] = (typeCounts[a.type] ?? 0) + 1;
    });

    const nonsoldTotal = Object.values(typeCounts).reduce((s, v) => s + v, 0) || 1;
    const typeColors: Record<string, string> = {
      "gold-piece": "#d97706",
      "gold-weight": "#92400e",
      diamond: "#3b82f6",
      gemstone: "#10b981",
      pearl: "#6366f1",
      watch: "#8b5cf6",
    };
    const typeKeys: Record<string, string> = {
      "gold-piece": "goldPiece",
      "gold-weight": "goldWeight",
      diamond: "diamonds",
      gemstone: "gemstones",
      pearl: "pearls",
      watch: "watches",
    };

    const distribution = Object.entries(typeCounts).map(([type, count]) => ({
      label: type,
      labelKey: typeKeys[type] ?? type,
      value: count,
      percentage: Math.round((count / nonsoldTotal) * 100),
      color: typeColors[type] ?? "#94a3b8",
    }));

    const netGoldWeight = assets
      .filter((a) => (a.type === "gold-piece" || a.type === "gold-weight") && a.status === "available")
      .reduce((s, a) => s + (a.goldWeight ?? a.netWeight ?? 0), 0);

    void ctx;
    return makeResult({
      totalAssets: total,
      availableAssets: available,
      reservedAssets: reserved,
      lowStockCount: lowStock,
      distribution,
      netGoldWeight,
    });
  }

  // ── Sales Chart ──────────────────────────────────────────────────────────────

  async getSalesChart(ctx: DashboardQueryContext): Promise<DashboardWidgetResult<DashboardSalesChartData>> {
    const { invoices } = this.snapshot;

    // Last 6 months
    const points: Array<{ label: string; value: number }> = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yearMonth = d.toISOString().slice(0, 7);
      const total = invoices
        .filter((inv) => inv.date.startsWith(yearMonth) && inv.status !== "cancelled")
        .reduce((s, inv) => s + Math.max(inv.total, 0), 0);
      const monthName = toEnglishDigits(d.toLocaleString(ctx.locale === "ar" ? "ar-EG-u-nu-latn" : ctx.locale, {
        month: "short",
        numberingSystem: "latn",
      }));
      points.push({ label: monthName, value: total });
    }

    const total = points.reduce((s, p) => s + p.value, 0);
    const average = points.length ? total / points.length : 0;
    const lastTwo = points.slice(-2);
    const trend =
      lastTwo.length === 2
        ? lastTwo[1].value > lastTwo[0].value
          ? "UP"
          : lastTwo[1].value < lastTwo[0].value
            ? "DOWN"
            : "FLAT"
        : "FLAT";

    return makeResult({ points, total, average, trend });
  }

  // ── Customer Activity ─────────────────────────────────────────────────────────

  async getCustomerActivity(ctx: DashboardQueryContext): Promise<DashboardWidgetResult<DashboardCustomerData>> {
    const { customers, invoices } = this.snapshot;

    const active = customers.filter((c) => !c.status || c.status === "active");
    const vip = active.filter((c) => c.tier === "VIP");
    const withDue = active.filter((c) => c.balance > 0);

    const monthStart = new Date().toISOString().slice(0, 7) + "-01";
    const newThisMonth = customers.filter((c) => c.createdAt && c.createdAt >= monthStart).length;

    const topCustomers = customers
      .slice()
      .sort((a, b) => b.purchases - a.purchases)
      .slice(0, 5)
      .map((c) => ({ id: c.id, name: c.name, totalPurchases: c.purchases }));

    void invoices;
    void ctx;
    return makeResult({
      totalActive: active.length,
      newThisMonth,
      vipCount: vip.length,
      withDueBalance: withDue.length,
      topCustomers,
    });
  }

  // ── Recent Invoices ───────────────────────────────────────────────────────────

  async getRecentInvoices(ctx: DashboardQueryContext): Promise<DashboardWidgetResult<DashboardInvoiceRow[]>> {
    const { invoices } = this.snapshot;
    const recent = invoices.slice(0, 5).map((inv) => ({
      id: inv.id,
      customerName: inv.customerName,
      branch: inv.branch,
      total: inv.total,
      status: inv.status,
      date: inv.date,
    }));
    void ctx;
    return makeResult(recent);
  }

  // ── Branch Performance ────────────────────────────────────────────────────────

  async getBranchPerformance(ctx: DashboardQueryContext): Promise<DashboardWidgetResult<DashboardBranchData>> {
    const { invoices, assets } = this.snapshot;

    const branchMap: Record<string, { sales: number; assetCount: number }> = {};
    invoices
      .filter((inv) => inv.status !== "cancelled")
      .forEach((inv) => {
        if (!branchMap[inv.branch]) branchMap[inv.branch] = { sales: 0, assetCount: 0 };
        branchMap[inv.branch].sales += Math.max(inv.total, 0);
      });
    assets.forEach((a) => {
      if (!branchMap[a.branch]) branchMap[a.branch] = { sales: 0, assetCount: 0 };
      branchMap[a.branch].assetCount += 1;
    });

    const branches = Object.entries(branchMap)
      .map(([name, data]) => ({ name, ...data, change: 0 }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    const topBranch = branches[0]?.name ?? ctx.branch;
    return makeResult({ branches, topBranch });
  }

  // ── Generic Widget ────────────────────────────────────────────────────────────

  async getWidget<T>(widgetIntent: string, ctx: DashboardQueryContext): Promise<DashboardWidgetResult<T>> {
    switch (widgetIntent) {
      case "SALES_TODAY":
      case "SALES_MONTH": {
        const result = await this.getKPIs(ctx);
        return result as unknown as DashboardWidgetResult<T>;
      }
      case "GOLD_PRICE_LIVE":
        return this.getGoldPrice(ctx) as unknown as DashboardWidgetResult<T>;
      case "LOW_STOCK_ALERT":
        return this.getAlerts(ctx) as unknown as DashboardWidgetResult<T>;
      case "PENDING_TRANSFERS":
      case "ACTIVE_RESERVATIONS":
      case "PENDING_INVOICES":
        return this.getOperations(ctx) as unknown as DashboardWidgetResult<T>;
      default:
        return { data: null, source: "LOCAL", ok: false, requestId: "noop", errorCode: "UNKNOWN_INTENT" };
    }
  }

  // ── Overview ──────────────────────────────────────────────────────────────────

  async getOverview(ctx: DashboardQueryContext): Promise<DashboardOverview> {
    const [kpisResult, goldResult, alertsResult, opsResult, invResult, chartResult, custResult, invoicesResult, branchResult] =
      await Promise.all([
        this.getKPIs(ctx),
        this.getGoldPrice(ctx),
        this.getAlerts(ctx),
        this.getOperations(ctx),
        this.getInventoryStatus(ctx),
        this.getSalesChart(ctx),
        this.getCustomerActivity(ctx),
        this.getRecentInvoices(ctx),
        this.getBranchPerformance(ctx),
      ]);

    return {
      kpis: kpisResult.data!,
      gold: goldResult.data!,
      alerts: alertsResult.data ?? [],
      operations: opsResult.data!,
      inventory: invResult.data!,
      salesChart: chartResult.data!,
      customers: custResult.data!,
      recentInvoices: invoicesResult.data ?? [],
      branches: branchResult.data!,
    };
  }
}
