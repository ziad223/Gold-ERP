"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useErp } from "@/contexts/erp-context";
import { apiClient } from "@/lib/api/client";
import { normalizeItems, toFiniteNumber } from "@/lib/api/normalize";
import { DATA_SOURCE } from "@/lib/data-source";
import { useAuth } from "@/contexts/auth-context";
import { useCompanyContext } from "@/contexts/company-context";
import { useBranchContext } from "@/contexts/branch-context";
import { useOptionalOperator } from "@/contexts/operator-context";
import type {
  ApprovalRequest,
  Asset,
  Customer,
  GoldPriceSnapshot,
  Invoice,
  InvoiceItem,
  PurchaseOrder,
  Reservation,
  Supplier,
  Transfer,
  Product,
  StockMovement,
} from "@/lib/types";
import type { KaratPriceSnapshot } from "@/hooks/use-gold";

// Keep unresolved API collections referentially stable for consumers that memoize
// providers from these values. Valid API empty arrays remain distinct query data.
const EMPTY_CUSTOMERS: Customer[] = [];
const EMPTY_SUPPLIERS: Supplier[] = [];
const EMPTY_TRANSFERS: Transfer[] = [];
const EMPTY_RESERVATIONS: Reservation[] = [];
const EMPTY_APPROVALS: ApprovalRequest[] = [];
const EMPTY_PURCHASE_ORDERS: PurchaseOrder[] = [];

function numberAsset(asset: Asset): Asset {
  return {
    ...asset,
    grossWeight: toFiniteNumber(asset.grossWeight),
    netWeight: toFiniteNumber(asset.netWeight),
    goldWeight: toFiniteNumber(asset.goldWeight),
    price: toFiniteNumber(asset.price),
    cost: toFiniteNumber(asset.cost),
    karat: asset.karat === undefined ? undefined : toFiniteNumber(asset.karat),
    purity: asset.purity === undefined ? undefined : toFiniteNumber(asset.purity),
  };
}

function numberInvoiceItem(item: InvoiceItem): InvoiceItem {
  return {
    ...item,
    quantity: toFiniteNumber(item.quantity, 1),
    price: toFiniteNumber(item.price),
    cost: item.cost === undefined ? undefined : toFiniteNumber(item.cost),
    weight: item.weight === undefined ? undefined : toFiniteNumber(item.weight),
    karat: item.karat === undefined ? undefined : toFiniteNumber(item.karat),
    discount: item.discount === undefined ? undefined : toFiniteNumber(item.discount),
    makingCharge: item.makingCharge === undefined ? undefined : toFiniteNumber(item.makingCharge),
    stoneValue: item.stoneValue === undefined ? undefined : toFiniteNumber(item.stoneValue),
  };
}

function numberInvoice(invoice: Invoice): Invoice {
  return {
    ...invoice,
    total: toFiniteNumber(invoice.total),
    tax: toFiniteNumber(invoice.tax),
    subtotal: invoice.subtotal === undefined ? undefined : toFiniteNumber(invoice.subtotal),
    discount: invoice.discount === undefined ? undefined : toFiniteNumber(invoice.discount),
    makingCharge: invoice.makingCharge === undefined ? undefined : toFiniteNumber(invoice.makingCharge),
    stoneValue: invoice.stoneValue === undefined ? undefined : toFiniteNumber(invoice.stoneValue),
    deposit: invoice.deposit === undefined ? undefined : toFiniteNumber(invoice.deposit),
    items: Array.isArray(invoice.items) ? invoice.items.map(numberInvoiceItem) : [],
  };
}

function numberProduct(product: Product): Product {
  return {
    ...product,
    quantityOnHand: toFiniteNumber(product.quantityOnHand),
    quantityAvailable: toFiniteNumber(product.quantityAvailable),
    quantitySold: toFiniteNumber(product.quantitySold),
    quantityReserved: toFiniteNumber(product.quantityReserved),
    totalWeight: toFiniteNumber(product.totalWeight),
    averageUnitWeight: toFiniteNumber(product.averageUnitWeight),
    unitCost: toFiniteNumber(product.unitCost),
    averageCost: toFiniteNumber(product.averageCost),
    salePrice: toFiniteNumber(product.salePrice),
    karat: product.karat === undefined ? undefined : toFiniteNumber(product.karat),
  };
}

function numberStockMovement(m: StockMovement): StockMovement {
  return {
    ...m,
    quantityIn: toFiniteNumber(m.quantityIn),
    quantityOut: toFiniteNumber(m.quantityOut),
    weightIn: toFiniteNumber(m.weightIn),
    weightOut: toFiniteNumber(m.weightOut),
    unitCost: toFiniteNumber(m.unitCost),
    totalCost: toFiniteNumber(m.totalCost),
  };
}

type CoreErpResource =
  | "assets"
  | "customers"
  | "invoices"
  | "suppliers"
  | "transfers"
  | "reservations"
  | "approvals"
  | "purchaseOrders"
  | "products"
  | "stockMovements";

type CoreErpDataOptions = {
  /** Keep background consumers demand-driven instead of prefetching every resource. */
  enabled?: boolean;
  /** Limit a page to the shared resources it actually owns. */
  resources?: readonly CoreErpResource[];
};

const CORE_ERP_RESOURCE_PERMISSIONS: Record<string, string> = {
  assets: "inventory.view",
  customers: "customers.view",
  invoices: "sales.view",
  suppliers: "suppliers.view",
  transfers: "inventory.view",
  reservations: "reservations.view",
  "approval-requests": "approvals.view",
  "purchase-orders": "suppliers.view",
  products: "inventory.view",
  "stock-movements": "inventory.view",
};

function useApiItems<T>(key: string, path: string, skipBranch = false, requested = true) {
  const locale = useLocale();
  const { authReady, isAuthenticated, terminalAuthHandling, user } = useAuth();
  const operator = useOptionalOperator();
  const { isSuperAdmin, isReady: companyReady, companyId, generation } = useCompanyContext();
  const { isReady: branchReady, branchId, generation: branchGeneration } = useBranchContext();
  const branchEmployeeReady = user?.accountType !== "branch_shell" || Boolean(operator?.active);
  const operatorPermissions = operator?.authorization?.effectivePermissionNames
    ?? operator?.authorization?.effectivePermissions
    ?? [];
  const operatorPermissionReady = user?.accountType !== "branch_shell"
    || (Boolean(operator?.active) && operatorPermissions.includes(CORE_ERP_RESOURCE_PERMISSIONS[key]));
  return useQuery<T[]>({
    queryKey: [key, isSuperAdmin ? companyId || "required" : "server-derived", "branch", skipBranch ? "none" : branchId || "required", generation, skipBranch ? "company-only" : branchGeneration],
    queryFn: async ({ signal }) => normalizeItems<T>(await apiClient(path, {
      signal,
      locale,
      skipBranch,
      ...(skipBranch || !branchId ? {} : { branchId }),
      ...(companyId ? { companyId } : {}),
    })),
    enabled: requested && DATA_SOURCE === "api" && authReady && isAuthenticated && !terminalAuthHandling && branchEmployeeReady && operatorPermissionReady && (!isSuperAdmin || companyReady) && (skipBranch || branchReady),
  });
}

export function useCoreErpData(options: CoreErpDataOptions = {}) {
  const local = useErp();
  const isApi = DATA_SOURCE === "api";
  const locale = useLocale();
  const { authReady, isAuthenticated, terminalAuthHandling } = useAuth();
  const { isSuperAdmin, isReady: companyReady, companyId, generation } = useCompanyContext();
  const { isReady: branchReady, branchId, generation: branchGeneration } = useBranchContext();
  const requested = (resource: CoreErpResource) => options.enabled !== false && (!options.resources || options.resources.includes(resource));
  // Gold pricing is a dashboard resource, not a dependency of every shared
  // header consumer.  Demand-driven pages (for example CGP workspaces) must
  // not issue an unrelated karat-price request that can fail independently of
  // the page's authenticated business operation.
  const goldRequested = options.enabled !== false && (!options.resources || options.resources.length === 0);

  const assetsQuery = useApiItems<Asset>("assets", "/assets", false, requested("assets"));
  const customersQuery = useApiItems<Customer>("customers", "/customers", true, requested("customers"));
  const invoicesQuery = useApiItems<Invoice>("invoices", "/invoices", false, requested("invoices"));
  const suppliersQuery = useApiItems<Supplier>("suppliers", "/suppliers", true, requested("suppliers"));
  const transfersQuery = useApiItems<Transfer>("transfers", "/transfers", false, requested("transfers"));
  const reservationsQuery = useApiItems<Reservation>("reservations", "/reservations", false, requested("reservations"));
  const approvalsQuery = useApiItems<ApprovalRequest>("approval-requests", "/approval-requests", false, requested("approvals"));
  const purchaseOrdersQuery = useApiItems<PurchaseOrder>("purchase-orders", "/purchase-orders", true, requested("purchaseOrders"));
  const productsQuery = useApiItems<Product>("products", "/products", false, requested("products"));
  const stockMovementsQuery = useApiItems<StockMovement>("stock-movements", "/stock-movements", false, requested("stockMovements"));
  const goldQuery = useQuery<KaratPriceSnapshot>({
    queryKey: ["dashboard-gold-price", isSuperAdmin ? companyId || "required" : "server-derived", branchId || "required", generation, branchGeneration, locale],
    queryFn: () => apiClient<KaratPriceSnapshot>("/gold/karat-prices?currency=AED", {
      locale,
      ...(companyId ? { companyId } : {}),
      ...(branchId ? { branchId } : {}),
    }),
    enabled: goldRequested && isApi && authReady && isAuthenticated && !terminalAuthHandling && (!isSuperAdmin || companyReady) && branchReady,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const assets = useMemo(
    () => (isApi ? (assetsQuery.data ?? []).map(numberAsset) : local.assets),
    [assetsQuery.data, isApi, local.assets],
  );
  const invoices = useMemo(
    () => (isApi ? (invoicesQuery.data ?? []).map(numberInvoice) : local.invoices),
    [invoicesQuery.data, isApi, local.invoices],
  );
  const products = useMemo(
    () => (isApi ? (productsQuery.data ?? []).map(numberProduct) : []),
    [productsQuery.data, isApi],
  );
  const stockMovements = useMemo(
    () => (isApi ? (stockMovementsQuery.data ?? []).map(numberStockMovement) : []),
    [stockMovementsQuery.data, isApi],
  );
  const goldPrice = useMemo<GoldPriceSnapshot>(() => {
    if (!isApi) return local.goldPrice;
    const snapshot = goldQuery.data;
    if (!snapshot) return { updatedAt: "", updatedBy: "LIVE_PROVIDER", prices: [] };
    return {
      updatedAt: snapshot.updatedAt || "",
      updatedBy: snapshot.provider || "LIVE_PROVIDER",
      status: snapshot.status,
      ageSeconds: snapshot.ageSeconds,
      staleAfterSeconds: snapshot.staleAfterSeconds,
      provider: snapshot.provider,
      quoteType: snapshot.quoteType,
      source: snapshot.source,
      prices: (snapshot.prices || []).map((price) => ({
        karat: Number(price.karat),
        pricePerGram: Number(price.pricePerGram),
        currency: price.currency || snapshot.currency || "AED",
      })),
    };
  }, [goldQuery.data, isApi, local.goldPrice]);

  const queries = [
    assetsQuery,
    customersQuery,
    invoicesQuery,
    suppliersQuery,
    transfersQuery,
    reservationsQuery,
    approvalsQuery,
    purchaseOrdersQuery,
    productsQuery,
    stockMovementsQuery,
  ];

  return {
    assets,
    customers: isApi ? customersQuery.data ?? EMPTY_CUSTOMERS : local.customers,
    invoices,
    suppliers: isApi ? suppliersQuery.data ?? EMPTY_SUPPLIERS : local.suppliers,
    transfers: isApi ? transfersQuery.data ?? EMPTY_TRANSFERS : local.transfers,
    reservations: isApi ? reservationsQuery.data ?? EMPTY_RESERVATIONS : local.reservations,
    approvals: isApi ? approvalsQuery.data ?? EMPTY_APPROVALS : local.approvals,
    purchaseOrders: isApi ? purchaseOrdersQuery.data ?? EMPTY_PURCHASE_ORDERS : local.purchaseOrders,
    products,
    stockMovements,
    goldPrice,
    productsQuery,
    stockMovementsQuery,
    isLoading: isApi ? queries.some((query) => query.isLoading) || goldQuery.isLoading : false,
    error: isApi ? queries.find((query) => query.error)?.error ?? goldQuery.error ?? null : null,
    refetch: () => Promise.all([...queries.map((query) => query.refetch()), goldQuery.refetch()]),
  };
}
