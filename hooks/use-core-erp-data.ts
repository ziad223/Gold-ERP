"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useErp } from "@/contexts/erp-context";
import { apiClient } from "@/lib/api/client";
import { normalizeItems, toFiniteNumber } from "@/lib/api/normalize";
import { DATA_SOURCE } from "@/lib/data-source";
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

function useApiItems<T>(key: string, path: string, skipBranch = false) {
  const locale = useLocale();
  return useQuery<T[]>({
    queryKey: [key],
    queryFn: async () => normalizeItems<T>(await apiClient(path, { locale, skipBranch })),
    enabled: DATA_SOURCE === "api",
  });
}

export function useCoreErpData() {
  const local = useErp();
  const isApi = DATA_SOURCE === "api";

  const assetsQuery = useApiItems<Asset>("assets", "/assets");
  const customersQuery = useApiItems<Customer>("customers", "/customers", true);
  const invoicesQuery = useApiItems<Invoice>("invoices", "/invoices");
  const suppliersQuery = useApiItems<Supplier>("suppliers", "/suppliers", true);
  const transfersQuery = useApiItems<Transfer>("transfers", "/transfers");
  const reservationsQuery = useApiItems<Reservation>("reservations", "/reservations");
  const approvalsQuery = useApiItems<ApprovalRequest>("approval-requests", "/approval-requests");
  const purchaseOrdersQuery = useApiItems<PurchaseOrder>("purchase-orders", "/purchase-orders", true);
  const productsQuery = useApiItems<Product>("products", "/products");
  const stockMovementsQuery = useApiItems<StockMovement>("stock-movements", "/stock-movements");

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
    customers: isApi ? customersQuery.data ?? [] : local.customers,
    invoices,
    suppliers: isApi ? suppliersQuery.data ?? [] : local.suppliers,
    transfers: isApi ? transfersQuery.data ?? [] : local.transfers,
    reservations: isApi ? reservationsQuery.data ?? [] : local.reservations,
    approvals: isApi ? approvalsQuery.data ?? [] : local.approvals,
    purchaseOrders: isApi ? purchaseOrdersQuery.data ?? [] : local.purchaseOrders,
    products,
    stockMovements,
    productsQuery,
    stockMovementsQuery,
    goldPrice: local.goldPrice as GoldPriceSnapshot,
    isLoading: isApi ? queries.some((query) => query.isLoading) : false,
    error: isApi ? queries.find((query) => query.error)?.error ?? null : null,
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  };
}
