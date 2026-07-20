"use client";

import { FormEvent, useMemo, useState, useEffect } from "react";
import { Barcode, Download, Gem, Plus, Printer, LayoutGrid, List, AlertTriangle, ShieldCheck, History, ArrowRightLeft, Sliders, Save } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { z } from "zod";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { SensitiveValue } from "@/components/permissions/SensitiveValue";
import { useAuth } from "@/contexts/auth-context";
import { useErp } from "@/contexts/erp-context";
import { useAppSettings } from "@/contexts/settings-context";
import { useAssets } from "@/features/assets/hooks/use-assets";
import { usePermissions } from "@/hooks/use-permissions";
import { useProductsList, useAssetsList } from "@/features/inventory/hooks/use-inventory-list";
import { Link, useRouter } from "@/i18n/navigation";
import { BarcodePrintTemplate } from "@/features/printing/components/BarcodePrintTemplate";
import { ClientBarcodeTagTemplate } from "@/features/printing/components/ClientBarcodeTagTemplate";
import { renderPrintDocument } from "@/features/printing/components/render-print-document";
import { exportData } from "@/lib/export/export-service";
import { DEFAULT_BARCODE_LABEL_CONFIG } from "@/lib/print/print-config";
import { printHtmlDocument } from "@/lib/print/print-service";
import { type BarcodeLabelData, productToLabelData, assetToLabelData, assetToTagData } from "@/lib/print/barcode-label";
import { ScannableBarcode } from "@/features/printing/components/ScannableBarcode";
import { getPublicFileUrl } from "@/lib/api/files";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Asset, AssetStatus, AssetType, Product, StockMovement } from "@/lib/types";
import { useCoreErpData } from "@/hooks/use-core-erp-data";
import { apiClient } from "@/lib/api/client";
import { useBarcodeSettings } from "@/features/settings/hooks/use-barcode-settings";

const initialForm = {
  name: "",
  type: "gold-piece" as AssetType,
  category: "",
  itemCode: "RNG",
  karat: "21",
  grossWeight: "",
  price: "",
  branch: "",
  location: "",
};

const assetFormSchema = z.object({
  name: z.string().min(2, { message: "Name is too short" }),
  category: z.string().min(2, { message: "Category is too short" }),
  itemCode: z.string().min(2, { message: "Item code is required" }),
  grossWeight: z.coerce.number().positive({ message: "Weight must be positive" }),
  price: z.coerce.number().positive({ message: "Price must be positive" }),
  location: z.string().optional(),
  branch: z.string().optional(),
  type: z.string(),
  karat: z.string(),
});

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export default function InventoryPage() {
  const t = useTranslations("Inventory");
  const common = useTranslations("Common");
  const filtersT = useTranslations("Filters");
  const printT = useTranslations("PrintExport");
  const locale = useLocale();
  const router = useRouter();
  const rtl = locale === "ar";
  const { company, user } = useAuth();
  const { addAuditLog } = useErp();
  const { isAuthorized } = usePermissions();
  // P7.5a: barcode printing is permission-gated (UI + handler).
  const canPrintBarcode = isAuthorized("printBarcode");
  
  const { products, assets, isLoading: isErpLoading, error: erpError, refetch } = useCoreErpData();
  const { updateAsset } = useAssets();
  const { inventoryCodes: barcodeInventoryCodes, itemCodes: barcodeItemCodes } = useBarcodeSettings();
  
  const [activeTab, setActiveTab] = useState<"products" | "assets">("products");
  
  // Details Modal States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDetailsTab, setProductDetailsTab] = useState<"basic" | "movements" | "sales" | "purchases">("basic");
  const [detailsMovements, setDetailsMovements] = useState<StockMovement[]>([]);
  const [detailsSales, setDetailsSales] = useState<any[]>([]);
  const [detailsPurchases, setDetailsPurchases] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    if (!selectedProduct) return;
    setIsLoadingDetails(true);
    
    Promise.all([
      apiClient(`/products/${selectedProduct.id}/movements`, { locale }).catch(() => ({ items: [] })),
      apiClient(`/products/${selectedProduct.id}/sales`, { locale }).catch(() => ({ items: [] })),
      apiClient(`/products/${selectedProduct.id}/purchases`, { locale }).catch(() => ({ items: [] }))
    ]).then(([movs, sales, purchases]: any[]) => {
      setDetailsMovements(movs.items || movs.data?.items || []);
      setDetailsSales(sales.items || sales.data?.items || []);
      setDetailsPurchases(purchases.items || purchases.data?.items || []);
      setIsLoadingDetails(false);
    }).catch(() => {
      setIsLoadingDetails(false);
    });
  }, [selectedProduct, locale]);

  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branch, setBranch] = useState("all");
  // Phase 4B: per-tab server-side pagination state.
  const [productsPage, setProductsPage] = useState(1);
  const [productsPageSize, setProductsPageSize] = useState(20);
  const [assetsPage, setAssetsPage] = useState(1);
  const [assetsPageSize, setAssetsPageSize] = useState(20);
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const selectedInventoryCode = barcodeInventoryCodes.find((code) => code.assetType === form.type && code.isActive);
  const availableItemCodes = barcodeItemCodes.filter((code) =>
    code.isActive && (!code.allowedInventoryCodes.length || (selectedInventoryCode && code.allowedInventoryCodes.includes(selectedInventoryCode.code)))
  );

  useEffect(() => {
    if (!selectedInventoryCode) return;
    const preferred = selectedInventoryCode.defaultItemCode;
    const currentAllowed = availableItemCodes.some((code) => code.code === form.itemCode);
    if (preferred && availableItemCodes.some((code) => code.code === preferred) && form.itemCode !== preferred) {
      setForm((current) => ({ ...current, itemCode: preferred, karat: selectedInventoryCode.requiresKarat ? current.karat || "21" : "" }));
    } else if (!currentAllowed && availableItemCodes[0]) {
      setForm((current) => ({ ...current, itemCode: availableItemCodes[0].code, karat: selectedInventoryCode.requiresKarat ? current.karat || "21" : "" }));
    }
  }, [selectedInventoryCode, availableItemCodes, form.itemCode]);
  
  // Grid vs Table View
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  
  // Bulk selection
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<AssetStatus>("available");

  // Column Visibility Mappings
  const [productColumns, setProductColumns] = useState<Record<string, boolean>>({
    productCode: true,
    productName: true,
    stockType: true,
    karat: true,
    quantityAvailable: true,
    quantitySold: true,
    quantityReserved: true,
    quantityOnHand: true,
    totalWeight: true,
    salePrice: true,
    branchName: true,
    status: true,
    actions: true,
  });

  const [assetColumns, setAssetColumns] = useState<Record<string, boolean>>({
    selection: true,
    asset: true,
    type: true,
    karat: true,
    weight: true,
    branchLocation: true,
    salePrice: true,
    status: true,
    identifier: true,
  });

  const [showColumnsModal, setShowColumnsModal] = useState(false);

  // Barcode Preview States — canonical shared label payload (P7.1).
  const [printPreviewItems, setPrintPreviewItems] = useState<BarcodeLabelData[]>([]);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [previewConfig, setPreviewConfig] = useState<any>(null);
  // P7.4 batch: scope (selected vs all-filtered) + large-batch acknowledgement.
  const [printScope, setPrintScope] = useState<"selected" | "filtered">("filtered");
  const [largeBatchConfirmed, setLargeBatchConfirmed] = useState(false);

  const { settings } = useAppSettings();
  const barcodeConfig = settings.barcode || DEFAULT_BARCODE_LABEL_CONFIG;

  // Load column preferences on mount
  useEffect(() => {
    const loadColumns = async () => {
      try {
        const local = localStorage.getItem("darfus-inventory-columns-v1");
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.productColumns) setProductColumns(parsed.productColumns);
          if (parsed.assetColumns) setAssetColumns(parsed.assetColumns);
        }

        const res = await apiClient<{ success: boolean; data: any }>("/settings/by-key/inventory-columns", { locale }).catch(() => null);
        if (res?.success && res.data) {
          const val = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
          if (val.productColumns) setProductColumns(val.productColumns);
          if (val.assetColumns) setAssetColumns(val.assetColumns);
        }
      } catch (err) {
        console.error("Failed to load inventory columns configuration", err);
      }
    };
    loadColumns();
  }, [locale]);

  const saveColumnPreferences = async (newProducts: Record<string, boolean>, newAssets: Record<string, boolean>) => {
    const payload = { productColumns: newProducts, assetColumns: newAssets };
    localStorage.setItem("darfus-inventory-columns-v1", JSON.stringify(payload));
    try {
      await apiClient("/settings/by-key/inventory-columns", {
        method: "PUT",
        body: JSON.stringify({ value: payload }),
        locale
      });
    } catch (err) {
      console.error("Failed to persist inventory columns configuration to backend", err);
    }
  };

  const applyPreset = (presetType: "brief" | "detailed" | "sales" | "store") => {
    let newProducts = { ...productColumns };
    let newAssets = { ...assetColumns };

    if (presetType === "detailed") {
      newProducts = {
        productCode: true,
        productName: true,
        stockType: true,
        karat: true,
        quantityAvailable: true,
        quantitySold: true,
        quantityReserved: true,
        quantityOnHand: true,
        totalWeight: true,
        salePrice: true,
        branchName: true,
        status: true,
        actions: true,
      };
      newAssets = {
        selection: true,
        asset: true,
        type: true,
        karat: true,
        weight: true,
        branchLocation: true,
        salePrice: true,
        status: true,
        identifier: true,
      };
    } else if (presetType === "brief") {
      newProducts = {
        productCode: true,
        productName: true,
        stockType: false,
        karat: true,
        quantityAvailable: true,
        quantitySold: false,
        quantityReserved: false,
        quantityOnHand: false,
        totalWeight: true,
        salePrice: true,
        status: true,
        actions: true,
      };
      newAssets = {
        selection: true,
        asset: true,
        type: false,
        karat: true,
        weight: true,
        branchLocation: false,
        salePrice: true,
        status: true,
        identifier: true,
      };
    } else if (presetType === "sales") {
      newProducts = {
        productCode: true,
        productName: true,
        stockType: false,
        karat: true,
        quantityAvailable: true,
        quantitySold: false,
        quantityReserved: false,
        quantityOnHand: false,
        totalWeight: true,
        salePrice: true,
        branchName: false,
        status: true,
        actions: true,
      };
      newAssets = {
        selection: true,
        asset: true,
        type: false,
        karat: true,
        weight: true,
        branchLocation: false,
        salePrice: true,
        status: true,
        identifier: true,
      };
    } else if (presetType === "store") {
      newProducts = {
        productCode: true,
        productName: true,
        stockType: false,
        karat: false,
        quantityAvailable: true,
        quantitySold: true,
        quantityReserved: true,
        quantityOnHand: true,
        totalWeight: false,
        salePrice: false,
        branchName: true,
        status: true,
        actions: true,
      };
      newAssets = {
        selection: true,
        asset: true,
        type: false,
        karat: false,
        weight: true,
        branchLocation: true,
        salePrice: false,
        status: true,
        identifier: true,
      };
    }

    setProductColumns(newProducts);
    setAssetColumns(newAssets);
    saveColumnPreferences(newProducts, newAssets);
  };

  const typeLabels: Record<AssetType, string> = {
    "gold-piece": t("goldPiece"),
    "gold-weight": t("goldWeight"),
    diamond: t("diamond"),
    gemstone: t("gemstone"),
    pearl: t("pearl"),
    watch: t("watch"),
  };

  const statusLabels: Record<AssetStatus, string> = {
    available: t("available"),
    reserved: t("reserved"),
    sold: t("sold"),
    repair: t("repair"),
    transferred: t("transferred"),
    melted: t("melted"),
    archived: t("archived") || "Archived",
    pending_transfer: t("pendingTransfer"),
    returned: t("returned"),
    in_workshop: t("inWorkshop"),
    pending_tag: t("pendingTag"),
  };

  const statusTone: Record<AssetStatus, "green" | "amber" | "rose" | "blue" | "violet" | "slate"> = {
    available: "green",
    reserved: "amber",
    sold: "slate",
    repair: "blue",
    transferred: "violet",
    melted: "rose",
    archived: "slate",
    pending_transfer: "violet",
    returned: "amber",
    in_workshop: "blue",
    pending_tag: "slate",
  };

  const branches = useMemo(() => {
    if (activeTab === "products") {
      return [...new Set(products.map((item) => item.branchName).filter(Boolean))];
    }
    return [...new Set(assets.map((item) => item.branch).filter(Boolean))];
  }, [products, assets, activeTab]);
  
  // Phase 4B: server-side paginated lists. The page slice AND the result total
  // come from the backend (?page&pageSize&search&filters), so the lists are no
  // longer capped at the backend default page size, and the assets list is
  // standalone-only server-side (?standaloneOnly=true) so total/totalPages are
  // correct without client-side removal of child assets.
  const productsList = useProductsList({
    page: productsPage,
    pageSize: productsPageSize,
    search: query,
    filters: { stockType: type, branchName: branch },
  });
  const assetsList = useAssetsList({
    page: assetsPage,
    pageSize: assetsPageSize,
    search: query,
    filters: { type, status: statusFilter, branch },
    standaloneOnly: true,
  });

  // Current-page rows. Names kept so existing render / selection / export /
  // barcode code paths read the ACTIVE PAGE (not the whole dataset).
  const filteredProducts = productsList.items;
  const filteredAssets = assetsList.items;

  const activeList = activeTab === "products" ? productsList : assetsList;
  const activeTotal = activeList.total;
  const activePage = activeList.page;
  const activePageSize = activeList.pageSize;
  const activeTotalPages = Math.max(1, activeList.totalPages);
  const activeListLoading = activeList.isLoading;
  const activeItemsCount = activeTab === "products" ? filteredProducts.length : filteredAssets.length;
  const activeFirstItem = activeTotal === 0 ? 0 : (activePage - 1) * activePageSize + 1;
  const activeLastItem = activeTotal === 0 ? 0 : Math.min(activeTotal, activeFirstItem + activeItemsCount - 1);
  const pageSummaryHint = rtl ? "إجمالي الصفحة الحالية فقط" : "Current page only";

  // Phase 4B: summary cards reflect the CURRENT PAGE only (labelled as such);
  // whole-inventory aggregates would need a backend aggregate endpoint (Phase 4C).
  const stats = useMemo(() => {
    if (activeTab === "products") {
      const pageProducts = filteredProducts;
      const totalCount = pageProducts.length;
      const totalValue = pageProducts.reduce((sum, p) => sum + (Number(p.averageCost) || 0) * (Number(p.quantityOnHand) || 0), 0);
      const totalWeight = pageProducts.reduce((sum, p) => sum + (Number(p.totalWeight) || 0), 0);
      const reservedCount = pageProducts.reduce((sum, p) => sum + (Number(p.quantityReserved) || 0), 0);
      return { totalCount, totalValue, totalWeight, reservedCount };
    } else {
      const pageAssets = filteredAssets;
      const totalCount = pageAssets.length;
      const totalValue = pageAssets.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
      const totalWeight = pageAssets.reduce((sum, item) => sum + (Number(item.netWeight) || 0), 0);
      const reservedCount = pageAssets.filter((item) => item.status === "reserved").length;
      return { totalCount, totalValue, totalWeight, reservedCount };
    }
  }, [filteredProducts, filteredAssets, activeTab]);

  const value = stats.totalValue;
  const weight = stats.totalWeight;
  const currency = company?.currency ?? "AED";
  const money = (amount: number) => formatCurrency(amount, currency, locale);

  const availableCount = useMemo(() => {
    if (activeTab === "products") {
      return products.filter((p) => p.isActive && p.quantityAvailable > 0).length;
    }
    return assets.filter((item) => item.status === "available" && !item.parentAssetId).length;
  }, [products, assets, activeTab]);
  const isLowStock = availableCount < 8;

  // Any search/filter change returns BOTH tabs to page 1 and clears selections
  // (selection is current-page-only and must not survive a filter change).
  useEffect(() => {
    setProductsPage(1);
    setAssetsPage(1);
    setSelectedProductIds([]);
    setSelectedAssetIds([]);
  }, [query, type, statusFilter, branch]);

  // Clamp a page that fell past the last page (e.g. after the total shrank).
  useEffect(() => {
    if (productsList.totalPages > 0 && productsPage > productsList.totalPages) {
      setProductsPage(productsList.totalPages);
    }
  }, [productsPage, productsList.totalPages]);
  useEffect(() => {
    if (assetsList.totalPages > 0 && assetsPage > assetsList.totalPages) {
      setAssetsPage(assetsList.totalPages);
    }
  }, [assetsPage, assetsList.totalPages]);

  const handlePageSizeChange = (nextPageSize: number) => {
    if (activeTab === "products") {
      setProductsPageSize(nextPageSize);
      setProductsPage(1);
      setSelectedProductIds([]);
    } else {
      setAssetsPageSize(nextPageSize);
      setAssetsPage(1);
      setSelectedAssetIds([]);
    }
  };

  const goToPage = (nextPage: number) => {
    const safePage = Math.min(Math.max(nextPage, 1), activeTotalPages);
    if (activeTab === "products") {
      setProductsPage(safePage);
      setSelectedProductIds([]);
    } else {
      setAssetsPage(safePage);
      setSelectedAssetIds([]);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAssetIds(filteredAssets.map((a) => a.id));
    } else {
      setSelectedAssetIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedAssetIds((prev) => [...prev, id]);
    } else {
      setSelectedAssetIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleBulkStatusUpdate = () => {
    if (selectedAssetIds.length === 0) return;

    selectedAssetIds.forEach((id) => {
      const original = assets.find((a) => a.id === id);
      if (!original) return;

      updateAsset(id, { status: bulkStatus });

      // Audit logs
      const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
      addAuditLog({
        id: `AUD-BULK-${Date.now()}-${id}`,
        action: "adjustment",
        description: `Bulk status update for ${id} to ${bulkStatus}`,
        user: user?.firstName || "System",
        place: company?.branchName || "Main Branch",
        branch: original.branch,
        date: timestamp,
        before: `status:${original.status}`,
        after: `status:${bulkStatus}`,
        device: "Web Browser",
        severity: "warning",
      });
    });

    setSelectedAssetIds([]);
  };

  const triggerCsvExport = async () => {
    const columns = activeTab === "products" ? [
      { key: "productCode", header: rtl ? "رمز المنتج" : "Product Code" },
      { key: "productName", header: rtl ? "اسم المنتج" : "Product Name" },
      { key: "stockType", header: rtl ? "نوع المخزون" : "Type", value: (item: Product) => typeLabels[item.stockType as AssetType] || item.stockType },
      { key: "karat", header: t("karat"), value: (item: Product) => item.karat ? `${item.karat}K` : "" },
      { key: "quantityAvailable", header: rtl ? "الكمية المتاحة" : "Available Qty" },
      { key: "quantitySold", header: rtl ? "الكمية المباعة" : "Sold Qty" },
      { key: "quantityReserved", header: rtl ? "الكمية المحجوزة" : "Reserved Qty" },
      { key: "quantityOnHand", header: rtl ? "إجمالي الكمية" : "Total Qty" },
      { key: "totalWeight", header: rtl ? "إجمالي الوزن" : "Total Weight" },
      { key: "salePrice", header: t("salePrice") },
      { key: "branchName", header: t("branch") },
    ] : [
      { key: "id", header: printT("id") },
      { key: "name", header: t("name") },
      { key: "type", header: t("type"), value: (item: Asset) => typeLabels[item.type] },
      { key: "category", header: t("category") },
      { key: "karat", header: t("karat"), value: (item: Asset) => item.karat ? `${item.karat}K` : "" },
      { key: "purity", header: printT("purity"), value: (item: Asset) => item.purity || "" },
      { key: "grossWeight", header: t("grossWeight") },
      { key: "netWeight", header: printT("netWeight") },
      { key: "goldWeight", header: printT("goldWeight"), value: (item: Asset) => item.goldWeight || "" },
      { key: "price", header: t("price") },
      { key: "branch", header: t("branch") },
      { key: "location", header: t("location") },
      { key: "status", header: t("status"), value: (item: Asset) => statusLabels[item.status] },
      { key: "barcode", header: printT("barcode") },
      { key: "rfid", header: printT("rfid"), value: (item: Asset) => item.rfid || "" },
      { key: "source", header: printT("source"), value: (item: Asset) => item.source || "" },
      { key: "parentAssetId", header: printT("parentId"), value: (item: Asset) => item.parentAssetId || "" },
      { key: "createdAt", header: printT("createdAt"), value: (item: Asset) => item.createdAt || "" },
    ];

    if (activeTab === "assets" && isAuthorized("viewCosts")) {
      columns.splice(10, 0, { key: "cost", header: printT("cost") });
    }

    // Export ALL rows matching the active filters (every page), not just the
    // visible page — fetched via the paginated hook's fetchAllMatching.
    if (activeTab === "products") {
      const rows = await productsList.fetchAllMatching();
      const result = exportData<Product>({
        fileName: "products.csv",
        title: rtl ? "مخزون المنتجات" : "Products Inventory",
        format: "csv",
        rows,
        locale,
        columns: columns as any,
      });
      if (result.ok) toast.success(printT("exportReady"));
      else toast.error(result.errorCode === "empty-data" ? printT("noDataToExport") : printT("exportFailed"));
    } else {
      const rows = await assetsList.fetchAllMatching();
      const result = exportData<Asset>({
        fileName: "inventory.csv",
        title: t("title"),
        format: "csv",
        rows,
        locale,
        columns: columns as any,
      });
      if (result.ok) toast.success(printT("exportReady"));
      else toast.error(result.errorCode === "empty-data" ? printT("noDataToExport") : printT("exportFailed"));
    }
  };

  // Per-item copies clamp (mirrors sanitizeBarcodeConfig): invalid → 1, capped.
  const safeCopies = (c: any) => Math.max(1, Math.min(1000, Math.round(Number(c) || 1)));
  // Show a confirmation when a batch would print a very large number of labels.
  const LARGE_BATCH_THRESHOLD = 500;
  // Total physical labels for the current preview (Σ per-item copies).
  const totalLabels = printPreviewItems.reduce((s, it) => s + safeCopies(it.copies), 0);

  const printBarcodeLabels = async () => {
    // Permission gate — never rely on the button alone.
    if (!canPrintBarcode) {
      toast.error(rtl ? "ليس لديك صلاحية طباعة الباركود" : "You don't have barcode print permission");
      return;
    }
    // Unified payload (P7.1): products and assets map to the SAME canonical
    // BarcodeLabelData via the shared mappers (no type is excluded; barcode
    // falls back to the record id). Batch source is the ACTIVE TAB
    // (products OR assets) — selections are per-tab, so cross-tab mixing is not
    // offered here; the unified payload supports it if a combined source is
    // added later.
    const copies = barcodeConfig.copies || 1;
    let rawItems: BarcodeLabelData[] = [];
    let scope: "selected" | "filtered" = "filtered";
    // Selected → print the SELECTED current-page rows only.
    // No selection → print ALL rows matching the active filters (every page),
    // fetched via fetchAllMatching — not just the visible page.
    if (activeTab === "products") {
      const selectedSet = new Set(selectedProductIds);
      scope = selectedProductIds.length ? "selected" : "filtered";
      const targetProds = selectedProductIds.length
        ? filteredProducts.filter((p) => selectedSet.has(p.id))
        : await productsList.fetchAllMatching();
      rawItems = targetProds.map((p) => productToLabelData(p, copies));
    } else {
      const selectedSet = new Set(selectedAssetIds);
      scope = selectedAssetIds.length ? "selected" : "filtered";
      const targetAssets = selectedAssetIds.length
        ? filteredAssets.filter((a) => selectedSet.has(a.id))
        : await assetsList.fetchAllMatching();
      rawItems = targetAssets.map((a) => assetToLabelData(a, copies));
    }

    if (!rawItems.length) {
      toast.error(printT("noDataToExport"));
      return;
    }

    setPrintScope(scope);
    setLargeBatchConfirmed(false);
    setPrintPreviewItems(rawItems);
    setPreviewConfig({ ...barcodeConfig });
    setShowPrintPreview(true);
  };

  // Phase 32.3-Fix — client front/back tag print for serialized ASSETS only.
  // Additive: it does not touch the generic barcode flow above (products +
  // generic asset labels still use BarcodePrintTemplate). The printed barcode is
  // the STORED asset.barcode; no serial/barcode is generated in the browser.
  const printClientAssetTags = async () => {
    if (!canPrintBarcode) {
      toast.error(rtl ? "ليس لديك صلاحية طباعة الباركود" : "You don't have barcode print permission");
      return;
    }
    const copies = barcodeConfig.copies || 1;
    const selectedSet = new Set(selectedAssetIds);
    const targetAssets = selectedAssetIds.length
      ? filteredAssets.filter((a) => selectedSet.has(a.id))
      : await assetsList.fetchAllMatching();
    const items = targetAssets.map((a) => assetToTagData(a, copies));
    if (!items.length) {
      toast.error(printT("noDataToExport"));
      return;
    }

    const html = renderPrintDocument(
      <ClientBarcodeTagTemplate
        items={items}
        config={{
          widthMm: barcodeConfig.widthMm,
          heightMm: barcodeConfig.heightMm,
          columns: barcodeConfig.columns,
          direction: barcodeConfig.direction === "RTL" ? "RTL" : "LTR",
          fontSizePx: barcodeConfig.fontSizePx ?? 8,
          showQrCode: Boolean(barcodeConfig.showQrCode),
          showCompanyName: barcodeConfig.showCompanyName !== false,
          showLogo: Boolean(barcodeConfig.showLogo),
          showBorder: barcodeConfig.showBorder !== false,
        }}
        companyName={company?.businessName || "DARFUS"}
        companyLogo={company?.logo}
        currency={currency}
        locale={locale}
      />,
      { documentType: "barcode", paperSize: "barcode-label", title: printT("printBarcode"), locale },
    );
    const result = printHtmlDocument(html, { documentType: "barcode", paperSize: "barcode-label", title: printT("printBarcode"), locale });
    if (!result.ok) {
      toast.error(result.errorCode === "popup-blocked" ? printT("popupBlocked") : printT("printFailed"));
    } else {
      toast.success(rtl ? "تم إرسال تاج العميل (وجه/ظهر) للطباعة" : "Client front/back tags sent to printer");
    }
  };

  const handleConfirmPrint = () => {
    if (!printPreviewItems.length || !previewConfig) return;
    // Re-check permission at the print boundary (defends the handler, not just the button).
    if (!canPrintBarcode) {
      toast.error(rtl ? "ليس لديك صلاحية طباعة الباركود" : "You don't have barcode print permission");
      return;
    }

    // Large-batch guard: require explicit acknowledgement past the threshold.
    const labelCount = printPreviewItems.reduce((s, it) => s + safeCopies(it.copies), 0);
    if (labelCount > LARGE_BATCH_THRESHOLD && !largeBatchConfirmed) {
      toast.warning(rtl ? `سيتم طباعة ${labelCount} ملصقاً — يرجى تأكيد الكمية الكبيرة.` : `${labelCount} labels will print — please acknowledge the large batch.`);
      return;
    }

    // Expand copies (sanitized); items are the canonical BarcodePrintItem shape.
    const finalItems: BarcodeLabelData[] = [];
    printPreviewItems.forEach((item) => {
      const count = safeCopies(item.copies);
      for (let i = 0; i < count; i++) {
        finalItems.push({ ...item, copies: 1 });
      }
    });

    const html = renderPrintDocument(
      <BarcodePrintTemplate
        items={finalItems}
        config={previewConfig}
        companyAbbreviation={company?.businessName || "DARFUS"}
        companyLogo={company?.logo}
        currency={currency}
        locale={locale}
      />,
      {
        documentType: "barcode",
        paperSize: "barcode-label",
        title: printT("printBarcode"),
        locale,
      },
    );

    const result = printHtmlDocument(html, {
      documentType: "barcode",
      paperSize: "barcode-label",
      title: printT("printBarcode"),
      locale,
    });

    if (!result.ok) {
      toast.error(result.errorCode === "popup-blocked" ? printT("popupBlocked") : printT("printFailed"));
    } else {
      toast.success(rtl ? "تم إرسال مستند الباركود للطباعة" : "Barcode sent to printer");
      setShowPrintPreview(false);
    }
  };

  if (isErpLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("description")} />
        <LoadingState variant="skeleton" />
      </div>
    );
  }

  if (erpError) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("description")} />
        <ErrorState correlationId={(erpError as any).correlationId} onRetry={refetch} />
      </div>
    );
  }

  const totalCountText = activeTab === "products" ? (rtl ? "إجمالي المنتجات" : "Total Products") : t("totalAssets");
  const countUnitText = activeTab === "products" ? (rtl ? "منتج" : "products") : t("assetUnit");

  return (
    <div className="space-y-6 text-xs">
      {isLowStock && (
        <Card className="border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-950/10 p-4 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-black text-amber-900 dark:text-amber-300">
              {rtl ? "تنبيه انخفاض مستوى المخزون" : "Low Stock Alert"}
            </h4>
            <p className="text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              {t("lowStockAlert", { count: availableCount })}
            </p>
          </div>
        </Card>
      )}

      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-navy-950 p-1.5 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === "table" ? "bg-white dark:bg-navy-900 shadow-sm text-brand-600" : "text-slate-400"
                }`}
                title={t("viewTable")}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === "grid" ? "bg-white dark:bg-navy-900 shadow-sm text-brand-600" : "text-slate-400"
                }`}
                title={t("viewGrid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            <Link href="/inventory/manufacturing">
              <Button variant="secondary">{rtl ? "الصهر والتصنيع" : "Manufacturing logs"}</Button>
            </Link>
            <Button variant="secondary" onClick={triggerCsvExport}>
              <Download className="h-4 w-4" />
              {common("export")}
            </Button>
            <Button variant="secondary" onClick={() => setShowColumnsModal(true)}>
              <Sliders className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {rtl ? "تخصيص الأعمدة" : "Column Settings"}
            </Button>
            <Button
              variant="secondary"
              onClick={printBarcodeLabels}
              disabled={!canPrintBarcode}
              title={canPrintBarcode ? undefined : (rtl ? "تحتاج صلاحية طباعة الباركود" : "Barcode print permission required")}
            >
              <Printer className="h-4 w-4" />
              {t("printBarcode")}
            </Button>
            {activeTab === "assets" && (
              <Button
                variant="secondary"
                onClick={printClientAssetTags}
                disabled={!canPrintBarcode}
                title={canPrintBarcode ? undefined : (rtl ? "تحتاج صلاحية طباعة الباركود" : "Barcode print permission required")}
              >
                <Barcode className="h-4 w-4" />
                {rtl ? "تاج العميل (وجه/ظهر)" : "Client Tags"}
              </Button>
            )}
            <Button onClick={() => router.push("/suppliers/purchases")}>
              <Plus className="h-4 w-4" />
              {rtl ? "استلام توريد جديد" : "Receive supplier purchase"}
            </Button>
          </div>
        }
      />

      {/* Tabs selector */}
      <div className="flex border-b border-border gap-4">
        <button
          onClick={() => {
            setActiveTab("products");
            setStatusFilter("all");
            setSelectedAssetIds([]);
            setSelectedProductIds([]);
          }}
          className={`pb-3 text-sm font-black transition relative ${
            activeTab === "products"
              ? "text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          {rtl ? "المخزون الإجمالي (المنتجات)" : "Grouped Products Inventory"}
        </button>
        <button
          onClick={() => {
            setActiveTab("assets");
            setSelectedAssetIds([]);
            setSelectedProductIds([]);
          }}
          className={`pb-3 text-sm font-black transition relative ${
            activeTab === "assets"
              ? "text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          {rtl ? "الأصول الفردية الرقمية" : "Individual Serialized Assets"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-semibold text-slate-500">{totalCountText}</p>
          <p className="mt-2 text-2xl font-black text-navy-950 dark:text-white font-mono font-bold">
            {formatNumber(stats.totalCount, 0, locale)} {countUnitText}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold text-slate-500">{t("stockValue")}</p>
          <p className="mt-2 text-2xl font-black text-navy-950 dark:text-white font-mono font-bold">
            <SensitiveValue permission="viewCosts" value={money(value)} />
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold text-slate-500">{t("netGold")}</p>
          <p className="mt-2 text-2xl font-black text-navy-950 dark:text-white font-mono font-bold">
            {formatNumber(weight, 2, locale)} {t("gram")}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold text-slate-500">
            {activeTab === "products" ? (rtl ? "المنتجات المحجوزة" : "Reserved Products") : t("reservedAssets")}
          </p>
          <p className="mt-2 text-2xl font-black text-navy-950 dark:text-white font-mono font-bold">
            {stats.reservedCount} {countUnitText}
          </p>
        </Card>
      </div>

      <p className="-mt-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
        {pageSummaryHint}
      </p>

      {/* Quick Filter Status Chips (Only for Assets) */}
      {activeTab === "assets" && (
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-full font-bold text-[10px] border transition ${
              statusFilter === "all"
                ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                : "bg-panel text-slate-500 border-border hover:bg-slate-50"
            }`}
          >
            {filtersT("allStatuses")} ({assets.filter(a => !a.parentAssetId).length})
          </button>
          {Object.entries(statusLabels).map(([status, label]) => {
            const count = assets.filter((item) => item.status === status && !item.parentAssetId).length;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-full font-bold text-[10px] border transition ${
                  statusFilter === status
                    ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                    : "bg-panel text-slate-500 border-border hover:bg-slate-50"
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      )}

      <Card className="overflow-hidden">
        <DataToolbar
          query={query}
          onQueryChange={setQuery}
          placeholder={t("search")}
          resultCount={activeTotal}
          resultLabel={filtersT("results")}
          resetLabel={filtersT("reset")}
          onReset={() => {
            setQuery("");
            setType("all");
            setStatusFilter("all");
            setBranch("all");
          }}
          filters={[
            {
              id: "type",
              label: t("type"),
              value: type,
              onChange: setType,
              options: [
                { value: "all", label: filtersT("allTypes") },
                ...Object.entries(typeLabels).map(([value, label]) => ({ value, label })),
              ],
            },
            ...(activeTab === "assets"
              ? [{
                  id: "status",
                  label: t("status"),
                  value: statusFilter,
                  onChange: setStatusFilter,
                  options: [
                    { value: "all", label: filtersT("allStatuses") },
                    ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
                  ],
                }]
              : []),
            {
              id: "branch",
              label: t("branch"),
              value: branch,
              onChange: setBranch,
              options: [{ value: "all", label: filtersT("allBranches") }, ...branches.map((item) => ({ value: item || "", label: item || "" }))],
            },
          ]}
        />

        {activeListLoading ? (
          <LoadingState variant="skeleton" />
        ) : (activeTab === "products" ? filteredProducts : filteredAssets).length ? (
          viewMode === "table" ? (
            activeTab === "products" ? (
              <div className="max-h-[600px] overflow-y-auto overflow-x-auto relative">
                <table className="w-full min-w-[1180px] text-start text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 dark:bg-navy-950 font-bold sticky top-0 z-10 shadow-sm border-b">
                    <tr>
                      <th className="px-5 py-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductIds(filteredProducts.map(p => p.id));
                            } else {
                              setSelectedProductIds([]);
                            }
                          }}
                        />
                      </th>
                      {productColumns.productCode && <th className="px-5 py-4 text-start">{rtl ? "رمز المنتج" : "Product Code"}</th>}
                      {productColumns.productName && <th className="px-5 py-4 text-start">{rtl ? "اسم المنتج" : "Product Name"}</th>}
                      {productColumns.stockType && <th className="px-5 py-4 text-start">{rtl ? "نوع المخزون" : "Type"}</th>}
                      {productColumns.karat && <th className="px-5 py-4 text-start">{rtl ? "العيار" : "Karat"}</th>}
                      {productColumns.quantityAvailable && <th className="px-5 py-4 text-start">{rtl ? "الكمية المتاحة" : "Available Qty"}</th>}
                      {productColumns.quantitySold && <th className="px-5 py-4 text-start">{rtl ? "الكمية المباعة" : "Sold Qty"}</th>}
                      {productColumns.quantityReserved && <th className="px-5 py-4 text-start">{rtl ? "الكمية المحجوزة" : "Reserved Qty"}</th>}
                      {productColumns.quantityOnHand && <th className="px-5 py-4 text-start">{rtl ? "إجمالي الكمية" : "Total Qty"}</th>}
                      {productColumns.totalWeight && <th className="px-5 py-4 text-start">{rtl ? "إجمالي الوزن" : "Total Weight"}</th>}
                      {productColumns.salePrice && <th className="px-5 py-4 text-start">{rtl ? "سعر البيع" : "Sale Price"}</th>}
                      {productColumns.branchName && <th className="px-5 py-4 text-start">{rtl ? "الفرع" : "Branch"}</th>}
                      {productColumns.status && <th className="px-5 py-4 text-start">{rtl ? "الحالة" : "Status"}</th>}
                      {productColumns.actions && <th className="px-5 py-4 text-center">{rtl ? "التفاصيل" : "Details"}</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredProducts.map((prod) => (
                      <tr key={prod.id} className="group transition hover:bg-slate-50/80 dark:hover:bg-navy-950/60">
                        <td className="px-5 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.includes(prod.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProductIds(prev => [...prev, prod.id]);
                              } else {
                                setSelectedProductIds(prev => prev.filter(id => id !== prod.id));
                              }
                            }}
                          />
                        </td>
                        {productColumns.productCode && <td className="px-5 py-4 font-mono font-extrabold text-brand-700 dark:text-brand-300">{prod.productCode}</td>}
                        {productColumns.productName && (
                          <td className="px-5 py-4">
                            <span className="font-extrabold text-navy-900 dark:text-white">{prod.productName}</span>
                            <span className="mt-1 block text-[10px] font-bold text-slate-400 font-mono">{prod.id}</span>
                          </td>
                        )}
                        {productColumns.stockType && <td className="px-5 py-4 text-slate-500">{typeLabels[prod.stockType as AssetType] || prod.stockType}</td>}
                        {productColumns.karat && <td className="px-5 py-4 font-bold">{prod.karat ? `${prod.karat}K` : "—"}</td>}
                        {productColumns.quantityAvailable && <td className="px-5 py-4 text-emerald-600 font-extrabold">{formatNumber(prod.quantityAvailable, 0, locale)}</td>}
                        {productColumns.quantitySold && <td className="px-5 py-4 text-slate-500">{formatNumber(prod.quantitySold, 0, locale)}</td>}
                        {productColumns.quantityReserved && <td className="px-5 py-4 text-amber-600">{formatNumber(prod.quantityReserved, 0, locale)}</td>}
                        {productColumns.quantityOnHand && <td className="px-5 py-4 font-bold">{formatNumber(prod.quantityOnHand, 0, locale)}</td>}
                        {productColumns.totalWeight && <td className="px-5 py-4 font-bold">{formatNumber(prod.totalWeight, 2, locale)} جم</td>}
                        {productColumns.salePrice && <td className="px-5 py-4 font-extrabold">{money(prod.salePrice)}</td>}
                        {productColumns.branchName && <td className="px-5 py-4 text-slate-500">{prod.branchName}</td>}
                        {productColumns.status && (
                          <td className="px-5 py-4">
                            <Badge tone={prod.isActive ? "green" : "slate"}>{prod.isActive ? (rtl ? "نشط" : "Active") : (rtl ? "غير نشط" : "Inactive")}</Badge>
                          </td>
                        )}
                        {productColumns.actions && (
                          <td className="px-5 py-4 text-center">
                            <Button size="sm" onClick={() => setSelectedProduct(prod)}>
                              <History className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto overflow-x-auto relative">
                <table className="w-full min-w-[1180px] text-start text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 dark:bg-navy-950 font-bold sticky top-0 z-10 shadow-sm border-b">
                    <tr>
                      {assetColumns.selection && (
                        <th className="px-5 py-4 w-12">
                          <input
                            type="checkbox"
                            checked={selectedAssetIds.length === filteredAssets.length && filteredAssets.length > 0}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                          />
                        </th>
                      )}
                      {assetColumns.asset && <th className="px-5 py-4 text-start">{t("asset")}</th>}
                      {assetColumns.type && <th className="px-5 py-4 text-start">{t("type")}</th>}
                      {assetColumns.karat && <th className="px-5 py-4 text-start">{t("karat")}</th>}
                      {assetColumns.weight && <th className="px-5 py-4 text-start">{t("weight")}</th>}
                      {assetColumns.branchLocation && <th className="px-5 py-4 text-start">{t("branchLocation")}</th>}
                      {assetColumns.salePrice && <th className="px-5 py-4 text-start">{t("salePrice")}</th>}
                      {assetColumns.status && <th className="px-5 py-4 text-start">{t("status")}</th>}
                      {assetColumns.identifier && <th className="px-5 py-4 text-start">{t("identifier")}</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAssets.map((asset) => (
                      <tr key={asset.id} className="group transition hover:bg-slate-50/80 dark:hover:bg-navy-950/60">
                        {assetColumns.selection && (
                          <td className="px-5 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedAssetIds.includes(asset.id)}
                              onChange={(e) => handleSelectOne(asset.id, e.target.checked)}
                            />
                          </td>
                        )}
                        {assetColumns.asset && (
                          <td className="px-5 py-4">
                            <Link href={`/inventory/${asset.id}`} className="flex items-center gap-3">
                              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gold-50 text-gold-700 dark:bg-gold-500/10 dark:text-gold-300">
                                <Gem className="h-5 w-5" />
                              </span>
                              <div>
                                <span className="block font-extrabold text-navy-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
                                  {asset.name}
                                </span>
                                <span className="mt-1 block text-[10px] font-bold text-slate-400 font-mono">
                                  {asset.id}
                                </span>
                              </div>
                            </Link>
                          </td>
                        )}
                        {assetColumns.type && <td className="px-5 py-4 text-slate-500">{typeLabels[asset.type]}</td>}
                        {assetColumns.karat && <td className="px-5 py-4 font-bold">{asset.karat ? `${asset.karat}K` : "—"}</td>}
                        {assetColumns.weight && (
                          <td className="px-5 py-4">
                            <p className="font-bold">{asset.grossWeight} {t("gram")}</p>
                            <p className="mt-1 text-[10px] text-slate-400 font-mono">{asset.netWeight}</p>
                          </td>
                        )}
                        {assetColumns.branchLocation && (
                          <td className="px-5 py-4">
                            <p className="font-bold text-navy-800 dark:text-slate-200">{asset.branch}</p>
                            <p className="mt-1 text-[10px] text-slate-400">{asset.location}</p>
                          </td>
                        )}
                        {assetColumns.salePrice && <td className="px-5 py-4 font-extrabold">{money(asset.price)}</td>}
                        {assetColumns.status && (
                          <td className="px-5 py-4">
                            <Badge tone={statusTone[asset.status]}>{statusLabels[asset.status]}</Badge>
                          </td>
                        )}
                        {assetColumns.identifier && <td className="px-5 py-4 font-mono text-[10px] text-slate-400">{asset.barcode}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            activeTab === "products" ? (
              <div className="grid gap-4 p-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((prod) => (
                  <div key={prod.id} className="panel p-4 space-y-4 hover:border-brand-500 border border-transparent transition relative cursor-pointer text-xs" onClick={() => setSelectedProduct(prod)}>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="font-mono text-[10px] text-brand-600 dark:text-brand-400 font-extrabold">{prod.productCode}</span>
                        <h3 className="font-black text-navy-950 dark:text-white text-xs line-clamp-1 mt-0.5">
                          {prod.productName}
                        </h3>
                      </div>
                      <Badge tone={prod.isActive ? "green" : "slate"}>{prod.isActive ? (rtl ? "نشط" : "Active") : (rtl ? "غير نشط" : "Inactive")}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 border-t border-b border-dashed border-border py-2">
                      <div>
                        <span className="font-bold block text-slate-400">{t("type")}</span>
                        <span>{typeLabels[prod.stockType as AssetType] || prod.stockType}</span>
                      </div>
                      <div>
                        <span className="font-bold block text-slate-400">{rtl ? "الوزن الإجمالي" : "Total Weight"}</span>
                        <span className="font-bold text-foreground">{formatNumber(prod.totalWeight, 2, locale)} جم</span>
                      </div>
                      <div>
                        <span className="font-bold block text-slate-400">{rtl ? "المتاح / المباع" : "Avail / Sold"}</span>
                        <span className="font-bold text-foreground">{prod.quantityAvailable} / {prod.quantitySold}</span>
                      </div>
                      <div>
                        <span className="font-bold block text-slate-400">{t("branch")}</span>
                        <span className="line-clamp-1">{prod.branchName}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="font-mono text-[10px] text-slate-400">{prod.id}</span>
                      <span className="font-black text-navy-900 dark:text-brand-300">{money(prod.salePrice)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 p-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {filteredAssets.map((asset) => (
                  <Card key={asset.id} className="p-4 space-y-4 hover:border-brand-500 transition relative">
                    <div className="absolute top-4 left-4 z-10">
                      <input
                        type="checkbox"
                        checked={selectedAssetIds.includes(asset.id)}
                        onChange={(e) => handleSelectOne(asset.id, e.target.checked)}
                      />
                    </div>
                    <div className="flex justify-between items-start gap-4">
                      <Link href={`/inventory/${asset.id}`} className="group flex-1">
                        <h3 className="font-black text-navy-950 dark:text-white text-xs group-hover:text-brand-600 line-clamp-1">
                          {asset.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">{asset.id}</p>
                      </Link>
                      <Badge tone={statusTone[asset.status]}>{statusLabels[asset.status]}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 border-t border-b border-dashed border-border py-2">
                      <div>
                        <span className="font-bold block text-slate-400">{t("type")}</span>
                        <span>{typeLabels[asset.type]}</span>
                      </div>
                      <div>
                        <span className="font-bold block text-slate-400">{t("weight")}</span>
                        <span className="font-bold text-foreground">{asset.grossWeight} {t("gram")}</span>
                      </div>
                      <div>
                        <span className="font-bold block text-slate-400">{t("branch")}</span>
                        <span className="line-clamp-1">{asset.branch}</span>
                      </div>
                      <div>
                        <span className="font-bold block text-slate-400">{t("location")}</span>
                        <span>{asset.location}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="font-mono text-[10px] text-slate-400">{asset.barcode}</span>
                      <span className="font-black text-navy-900 dark:text-brand-300">{money(asset.price)}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )
          )
        ) : (
          <EmptyState title={common("noResults")} description={common("noResultsDescription")} />
        )}

        {!activeListLoading && activeTotal > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-xs dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold text-slate-500">
              {rtl
                ? `عرض ${activeFirstItem}-${activeLastItem} من ${activeTotal}`
                : `Showing ${activeFirstItem}-${activeLastItem} of ${activeTotal}`}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={activePageSize}
                onChange={(event) => handlePageSizeChange(Number(event.target.value))}
                className="h-9 rounded-2xl border border-border bg-panel px-3 text-xs font-semibold text-foreground outline-none focus:ring-4 focus:ring-ring/20"
                aria-label={rtl ? "عدد العناصر في الصفحة" : "Rows per page"}
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {rtl ? `${option} لكل صفحة` : `${option} / page`}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={activePage <= 1}
                onClick={() => goToPage(activePage - 1)}
              >
                {rtl ? "السابق" : "Previous"}
              </Button>
              <span className="min-w-20 text-center font-bold text-slate-500">
                {rtl ? `صفحة ${activePage} / ${activeTotalPages}` : `Page ${activePage} / ${activeTotalPages}`}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={activePage >= activeTotalPages}
                onClick={() => goToPage(activePage + 1)}
              >
                {rtl ? "التالي" : "Next"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Bulk status update action drawer */}
      {selectedAssetIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-float rounded-2xl px-6 py-4 flex items-center gap-6 animate-slide-up text-xs font-bold bg-opacity-95 backdrop-blur-md">
          <span className="text-slate-500">{t("selectedItems", { count: selectedAssetIds.length })}</span>
          {isAuthorized("performInventoryAdjustments") ? (
            <div className="flex items-center gap-2">
              <NativeSelect
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as AssetStatus)}
              >
                <option value="available">{t("available")}</option>
                <option value="reserved">{t("reserved")}</option>
                <option value="repair">{t("repair")}</option>
                <option value="archived">{t("archived")}</option>
              </NativeSelect>
              <Button size="sm" onClick={handleBulkStatusUpdate}>
                {t("apply")}
              </Button>
            </div>
          ) : (
            <span className="text-rose-500 font-black">{rtl ? "تعديل الحالة غير مصرح به" : "Unauthorized to update status"}</span>
          )}
          <Button size="sm" variant="secondary" onClick={() => setSelectedAssetIds([])}>
            {common("cancel")}
          </Button>
        </div>
      )}

      {/* Product Details Modal */}
      <Modal 
        open={Boolean(selectedProduct)} 
        onClose={() => {
          setSelectedProduct(null);
          setProductDetailsTab("basic");
        }} 
        title={rtl ? `تفاصيل المنتج: ${selectedProduct?.productName}` : `Product Details: ${selectedProduct?.productName}`} 
        description={rtl ? `كود المنتج: ${selectedProduct?.productCode}` : `Product Code: ${selectedProduct?.productCode}`}
      >
        {selectedProduct && (
          <div className="space-y-6 text-xs text-navy-950 dark:text-white">
            {/* Tab Header */}
            <div className="flex border-b border-border gap-4 pb-2">
              <button
                type="button"
                onClick={() => setProductDetailsTab("basic")}
                className={`pb-2 font-bold transition relative ${
                  productDetailsTab === "basic"
                    ? "text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {rtl ? "البيانات الأساسية" : "Basic Data"}
              </button>
              <button
                type="button"
                onClick={() => setProductDetailsTab("movements")}
                className={`pb-2 font-bold transition relative ${
                  productDetailsTab === "movements"
                    ? "text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {rtl ? "سجل الحركات" : "Stock Movements"}
              </button>
              <button
                type="button"
                onClick={() => setProductDetailsTab("sales")}
                className={`pb-2 font-bold transition relative ${
                  productDetailsTab === "sales"
                    ? "text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {rtl ? "سجل المبيعات" : "Sales History"}
              </button>
              <button
                type="button"
                onClick={() => setProductDetailsTab("purchases")}
                className={`pb-2 font-bold transition relative ${
                  productDetailsTab === "purchases"
                    ? "text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {rtl ? "سجل المشتريات" : "Purchase History"}
              </button>
            </div>

            {isLoadingDetails ? (
              <LoadingState variant="skeleton" />
            ) : (
              <div className="space-y-4">
                {productDetailsTab === "basic" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card className="p-4 space-y-3">
                      <h4 className="font-extrabold border-b pb-1 text-slate-500">{rtl ? "مستويات المخزون" : "Stock Levels"}</h4>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">{rtl ? "الكمية المتاحة" : "Available Qty"}</span>
                          <span className="font-bold">{formatNumber(selectedProduct.quantityAvailable, 0, locale)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{rtl ? "الكمية المباعة" : "Sold Qty"}</span>
                          <span className="font-bold">{formatNumber(selectedProduct.quantitySold, 0, locale)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{rtl ? "الكمية المحجوزة" : "Reserved Qty"}</span>
                          <span className="font-bold">{formatNumber(selectedProduct.quantityReserved, 0, locale)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{rtl ? "إجمالي الكمية" : "Total Qty"}</span>
                          <span className="font-bold">{formatNumber(selectedProduct.quantityOnHand, 0, locale)}</span>
                        </div>
                        <div className="col-span-2 mt-2 pt-2 border-t border-dashed">
                          <span className="text-slate-400 block">{rtl ? "إجمالي الوزن" : "Total Weight"}</span>
                          <span className="font-bold text-sm text-brand-600 dark:text-brand-400">{formatNumber(selectedProduct.totalWeight, 2, locale)} جم</span>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 space-y-3">
                      <h4 className="font-extrabold border-b pb-1 text-slate-500">{rtl ? "التسعير والتكلفة" : "Pricing & Cost"}</h4>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">{rtl ? "سعر التكلفة الأخير" : "Last Cost"}</span>
                          <span className="font-bold"><SensitiveValue permission="viewCosts" value={money(selectedProduct.unitCost)} /></span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{rtl ? "متوسط سعر التكلفة" : "Avg Cost"}</span>
                          <span className="font-bold"><SensitiveValue permission="viewCosts" value={money(selectedProduct.averageCost)} /></span>
                        </div>
                        <div className="col-span-2 mt-2 pt-2 border-t border-dashed">
                          <span className="text-slate-400 block">{rtl ? "سعر البيع المقترح" : "Suggested Sale Price"}</span>
                          <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{money(selectedProduct.salePrice)}</span>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 sm:col-span-2 space-y-3">
                      <h4 className="font-extrabold border-b pb-1 text-slate-500">{rtl ? "بيانات إضافية" : "Additional Properties"}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">{rtl ? "العيار" : "Karat"}</span>
                          <span className="font-bold">{selectedProduct.karat ? `${selectedProduct.karat}K` : "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{rtl ? "نوع المخزون" : "Stock Type"}</span>
                          <span className="font-bold">{typeLabels[selectedProduct.stockType as AssetType] || selectedProduct.stockType}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{rtl ? "الفرع" : "Branch"}</span>
                          <span className="font-bold">{selectedProduct.branchName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{rtl ? "متوسط وزن القطعة" : "Avg Unit Weight"}</span>
                          <span className="font-bold">{formatNumber(selectedProduct.averageUnitWeight, 2, locale)} جم</span>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {productDetailsTab === "movements" && (
                  <div className="max-h-[350px] overflow-y-auto border rounded-xl">
                    <table className="w-full text-start text-[11px]">
                      <thead className="bg-slate-50 dark:bg-navy-950 sticky top-0 font-bold">
                        <tr className="border-b">
                          <th className="p-3 text-start">{rtl ? "نوع الحركة" : "Type"}</th>
                          <th className="p-3 text-start">{rtl ? "المرجع" : "Ref"}</th>
                          <th className="p-3 text-start">{rtl ? "الكمية الداخلة" : "Qty In"}</th>
                          <th className="p-3 text-start">{rtl ? "الكمية الخارجة" : "Qty Out"}</th>
                          <th className="p-3 text-start">{rtl ? "الوزن الداخل" : "Wt In"}</th>
                          <th className="p-3 text-start">{rtl ? "الوزن الخارج" : "Wt Out"}</th>
                          <th className="p-3 text-start">{rtl ? "بواسطة" : "By"}</th>
                          <th className="p-3 text-start">{rtl ? "التاريخ" : "Date"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {detailsMovements.length ? (
                          detailsMovements.map((mov) => (
                            <tr key={mov.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-bold">{rtl ? (mov.type === "purchase_receive" ? "استلام توريد" : mov.type === "sale" ? "مبيعات" : mov.type === "return" ? "مرتجع" : mov.type) : mov.type}</td>
                              <td className="p-3 font-mono text-[10px]">{mov.referenceId}</td>
                              <td className="p-3 text-emerald-600 font-bold">+{mov.quantityIn || 0}</td>
                              <td className="p-3 text-rose-600 font-bold">-{mov.quantityOut || 0}</td>
                              <td className="p-3">{mov.weightIn || 0}g</td>
                              <td className="p-3">{mov.weightOut || 0}g</td>
                              <td className="p-3">{mov.createdBy}</td>
                              <td className="p-3 text-slate-400 font-mono">{mov.createdAt ? new Date(mov.createdAt).toLocaleString(locale) : "—"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="p-4 text-center text-slate-400">{rtl ? "لا توجد حركات مخزنية" : "No stock movements recorded"}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {productDetailsTab === "sales" && (
                  <div className="max-h-[350px] overflow-y-auto border rounded-xl">
                    <table className="w-full text-start text-[11px]">
                      <thead className="bg-slate-50 dark:bg-navy-950 sticky top-0 font-bold">
                        <tr className="border-b">
                          <th className="p-3 text-start">{rtl ? "رقم الفاتورة" : "Invoice ID"}</th>
                          <th className="p-3 text-start">{rtl ? "العميل" : "Customer"}</th>
                          <th className="p-3 text-start">{rtl ? "الكمية" : "Qty"}</th>
                          <th className="p-3 text-start">{rtl ? "الوزن" : "Weight"}</th>
                          <th className="p-3 text-start">{rtl ? "سعر الوحدة" : "Unit Price"}</th>
                          <th className="p-3 text-start">{rtl ? "إجمالي السعر" : "Total Price"}</th>
                          <th className="p-3 text-start">{rtl ? "التاريخ" : "Date"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {detailsSales.length ? (
                          detailsSales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono font-bold">{sale.invoiceId}</td>
                              <td className="p-3">{sale.invoice?.customerName}</td>
                              <td className="p-3 font-bold">{sale.quantity || 1}</td>
                              <td className="p-3">{sale.weight || 0}g</td>
                              <td className="p-3">{money(sale.price)}</td>
                              <td className="p-3 font-bold">{money((sale.price || 0) * (sale.quantity || 1))}</td>
                              <td className="p-3 text-slate-400 font-mono">{sale.invoice?.date}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="p-4 text-center text-slate-400">{rtl ? "لا توجد عمليات بيع" : "No sales history"}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {productDetailsTab === "purchases" && (
                  <div className="max-h-[350px] overflow-y-auto border rounded-xl">
                    <table className="w-full text-start text-[11px]">
                      <thead className="bg-slate-50 dark:bg-navy-950 sticky top-0 font-bold">
                        <tr className="border-b">
                          <th className="p-3 text-start">{rtl ? "رقم الشراء" : "Purchase ID"}</th>
                          <th className="p-3 text-start">{rtl ? "المورد" : "Supplier"}</th>
                          <th className="p-3 text-start">{rtl ? "الكمية" : "Qty"}</th>
                          <th className="p-3 text-start">{rtl ? "سعر التكلفة" : "Cost"}</th>
                          <th className="p-3 text-start">{rtl ? "التاريخ" : "Date"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {detailsPurchases.length ? (
                          detailsPurchases.map((pur) => (
                            <tr key={pur.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono font-bold">{pur.purchaseOrderId}</td>
                              <td className="p-3">{pur.purchaseOrder?.supplierName}</td>
                              <td className="p-3 font-bold">{pur.quantity || 1}</td>
                              <td className="p-3 font-bold"><SensitiveValue permission="viewCosts" value={money(pur.unitPrice)} /></td>
                              <td className="p-3 text-slate-400 font-mono">{pur.purchaseOrder?.date}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-slate-400">{rtl ? "لا توجد عمليات شراء" : "No purchase history"}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  setSelectedProduct(null);
                  setProductDetailsTab("basic");
                }}
              >
                {common("close")}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Column visibility control modal */}
      <Modal
        open={showColumnsModal}
        onClose={() => setShowColumnsModal(false)}
        title={rtl ? "تخصيص أعمدة جدول المخزون" : "Customize Inventory Columns"}
        description={rtl ? "اختر الأعمدة التي تود عرضها في جدول المنتجات والأصول." : "Select which columns to display in products and assets views."}
      >
        <div className="space-y-6 text-xs text-navy-950 dark:text-white">
          {/* Preset Buttons */}
          <div className="space-y-2">
            <span className="font-bold block text-slate-400">{rtl ? "تفضيلات سريعة (Presets):" : "Column Presets:"}</span>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => applyPreset("brief")}>
                {rtl ? "عرض مختصر" : "Brief View"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => applyPreset("detailed")}>
                {rtl ? "عرض تفصيلي" : "Detailed View"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => applyPreset("sales")}>
                {rtl ? "عرض للمبيعات" : "Sales View"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => applyPreset("store")}>
                {rtl ? "عرض للمخزن" : "Inventory View"}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Products Columns */}
            <div className="space-y-3">
              <h4 className="font-extrabold border-b pb-1 text-slate-500">{rtl ? "أعمدة جدول المنتجات" : "Products Columns"}</h4>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {[
                  { key: "productCode", label: rtl ? "رمز المنتج" : "Product Code" },
                  { key: "productName", label: rtl ? "اسم المنتج" : "Product Name" },
                  { key: "stockType", label: rtl ? "نوع المخزون" : "Stock Type" },
                  { key: "karat", label: rtl ? "العيار" : "Karat" },
                  { key: "quantityAvailable", label: rtl ? "الكمية المتاحة" : "Available Qty" },
                  { key: "quantitySold", label: rtl ? "الكمية المباعة" : "Sold Qty" },
                  { key: "quantityReserved", label: rtl ? "الكمية المحجوزة" : "Reserved Qty" },
                  { key: "quantityOnHand", label: rtl ? "إجمالي الكمية" : "Total Qty" },
                  { key: "totalWeight", label: rtl ? "إجمالي الوزن" : "Total Weight" },
                  { key: "salePrice", label: rtl ? "سعر البيع" : "Sale Price" },
                  { key: "branchName", label: rtl ? "الفرع" : "Branch" },
                  { key: "status", label: rtl ? "الحالة" : "Status" },
                  { key: "actions", label: rtl ? "التفاصيل" : "Details" },
                ].map((col) => (
                  <label key={col.key} className="flex items-center gap-2 font-semibold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                      checked={productColumns[col.key] ?? true}
                      onChange={(e) => {
                        const updated = { ...productColumns, [col.key]: e.target.checked };
                        setProductColumns(updated);
                        saveColumnPreferences(updated, assetColumns);
                      }}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Assets Columns */}
            <div className="space-y-3">
              <h4 className="font-extrabold border-b pb-1 text-slate-500">{rtl ? "أعمدة جدول الأصول" : "Assets Columns"}</h4>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {[
                  { key: "selection", label: rtl ? "مربع الاختيار (Bulk)" : "Checkbox Selection" },
                  { key: "asset", label: rtl ? "اسم ومعرف الأصل" : "Asset Name/ID" },
                  { key: "type", label: rtl ? "نوع المخزون" : "Type" },
                  { key: "karat", label: rtl ? "العيار" : "Karat" },
                  { key: "weight", label: rtl ? "الوزن الإجمالي/الصافي" : "Gross/Net Weight" },
                  { key: "branchLocation", label: rtl ? "الفرع والموقع" : "Branch/Location" },
                  { key: "salePrice", label: rtl ? "سعر البيع" : "Sale Price" },
                  { key: "status", label: rtl ? "الحالة" : "Status" },
                  { key: "identifier", label: rtl ? "الرمز والباركود" : "Barcode" },
                ].map((col) => (
                  <label key={col.key} className="flex items-center gap-2 font-semibold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                      checked={assetColumns[col.key] ?? true}
                      onChange={(e) => {
                        const updated = { ...assetColumns, [col.key]: e.target.checked };
                        setAssetColumns(updated);
                        saveColumnPreferences(productColumns, updated);
                      }}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setShowColumnsModal(false)}>{rtl ? "إغلاق وتطبيق" : "Apply & Close"}</Button>
          </div>
        </div>
      </Modal>

      {/* Barcode print preview modal */}
      <Modal
        open={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        title={rtl ? "معاينة طباعة الملصقات والباركود" : "Barcode Label Print Preview"}
        description={rtl ? "قم بتعديل إعدادات التسمية والنسخ قبل إرسال أمر الطباعة." : "Confirm copies count and customize visual layout fields before printing."}
      >
        {previewConfig && (
          <div className="space-y-6 text-xs text-navy-950 dark:text-white">
            <div className="grid gap-6 lg:grid-cols-5">
              {/* Form Settings panel */}
              <div className="lg:col-span-2 space-y-4 border-r pr-4 rtl:border-r-0 rtl:border-l rtl:pl-4">
                <h4 className="font-extrabold border-b pb-1 text-slate-500">{rtl ? "خيارات التسمية" : "Label Preferences"}</h4>
                
                <label className="block">
                  <span className="label-base font-bold">{rtl ? "نص مخصص أسفل الملصق" : "Custom Text"}</span>
                  <input
                    className="input-base mt-1"
                    value={previewConfig.customText || ""}
                    onChange={(e) => setPreviewConfig((prev: any) => ({ ...prev, customText: e.target.value }))}
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="label-base font-bold">{rtl ? "العرض (مم)" : "Width (mm)"}</span>
                    <input
                      type="number"
                      className="input-base mt-1"
                      value={previewConfig.widthMm}
                      onChange={(e) => setPreviewConfig((prev: any) => ({ ...prev, widthMm: Number(e.target.value) }))}
                    />
                  </label>
                  <label className="block">
                    <span className="label-base font-bold">{rtl ? "الارتفاع (مم)" : "Height (mm)"}</span>
                    <input
                      type="number"
                      className="input-base mt-1"
                      value={previewConfig.heightMm}
                      onChange={(e) => setPreviewConfig((prev: any) => ({ ...prev, heightMm: Number(e.target.value) }))}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="label-base font-bold">{rtl ? "حجم الخط (px)" : "Font (px)"}</span>
                    <input
                      type="number"
                      className="input-base mt-1"
                      value={previewConfig.fontSizePx}
                      onChange={(e) => setPreviewConfig((prev: any) => ({ ...prev, fontSizePx: Number(e.target.value) }))}
                    />
                  </label>
                  <label className="block">
                    <span className="label-base font-bold">{rtl ? "الأعمدة" : "Columns"}</span>
                    <input
                      type="number"
                      className="input-base mt-1"
                      value={previewConfig.columns}
                      onChange={(e) => setPreviewConfig((prev: any) => ({ ...prev, columns: Number(e.target.value) }))}
                    />
                  </label>
                </div>

                <div className="space-y-2 pt-2 border-t max-h-[200px] overflow-y-auto pr-1">
                  {[
                    { key: "showBorder", label: rtl ? "إطار الملصق" : "Show Border" },
                    { key: "showCompanyName", label: rtl ? "اسم الشركة" : "Show Company Name" },
                    { key: "showLogo", label: rtl ? "شعار الشركة" : "Show Logo" },
                    { key: "showAssetId", label: rtl ? "رمز المنتج / الباركود" : "Show Code" },
                    { key: "showName", label: rtl ? "اسم المنتج" : "Show Name" },
                    { key: "showKarat", label: rtl ? "عيار الذهب" : "Show Karat" },
                    { key: "showWeight", label: rtl ? "الوزن" : "Show Weight" },
                    { key: "showPrice", label: rtl ? "السعر" : "Show Price" },
                    { key: "showType", label: rtl ? "نوع المخزون" : "Show Stock Type" },
                    { key: "showBranch", label: rtl ? "الفرع" : "Show Branch" },
                    { key: "showSupplier", label: rtl ? "المورد" : "Show Supplier" },
                    { key: "showDate", label: rtl ? "التاريخ" : "Show Date" },
                    { key: "showQrCode", label: rtl ? "QR Code" : "Show QR Code" }
                  ].map((f) => (
                    <label key={f.key} className="flex items-center gap-2 font-semibold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                        checked={previewConfig[f.key] ?? false}
                        onChange={(e) => setPreviewConfig((prev: any) => ({ ...prev, [f.key]: e.target.checked }))}
                      />
                      <span>{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Items Copies & Preview Mockup */}
              <div className="lg:col-span-3 space-y-4">
                <div className="space-y-3">
                  <h4 className="font-extrabold border-b pb-1 text-slate-500">{rtl ? "تحديد عدد النسخ للمنتجات" : "Items list & copies"}</h4>
                  <div className="space-y-2 max-h-[140px] overflow-y-auto border p-2 rounded-xl bg-slate-50 dark:bg-navy-950/40">
                    {printPreviewItems.map((item, idx) => (
                      <div key={`${item.assetId}-${idx}`} className="flex items-center justify-between gap-3 text-[11px] font-bold border-b pb-1.5 last:border-b-0 last:pb-0">
                        <div className="min-w-0">
                          <span className="block truncate text-navy-950 dark:text-white">{item.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.barcode} · {item.karat ? `${item.karat}K` : ""} · {item.grossWeight}g</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-slate-400 text-[10px]">{rtl ? "النسخ:" : "Copies:"}</span>
                          <input
                            type="number"
                            min="1"
                            className="input-base w-16 px-2 py-1 text-center font-bold"
                            value={item.copies}
                            onChange={(e) => {
                              const updated = [...printPreviewItems];
                              updated[idx].copies = Math.max(1, Number(e.target.value));
                              setPrintPreviewItems(updated);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-extrabold border-b pb-1 text-slate-500">{rtl ? "معاينة التصميم الحية" : "Live Design Tag Mockup"}</h4>
                  <div className="flex items-center justify-center p-4 border rounded-2xl bg-slate-100 dark:bg-navy-950/20">
                    {printPreviewItems[0] && (
                      <div
                        className="bg-white text-navy-950 shadow-soft p-3 rounded overflow-hidden"
                        style={{
                          width: `${previewConfig.widthMm * 3.5}px`,
                          height: `${previewConfig.heightMm * 3.5}px`,
                          fontSize: `${previewConfig.fontSizePx * 1.1}px`,
                          border: previewConfig.showBorder ? "1px solid #111827" : "none",
                          direction: previewConfig.direction === "RTL" ? "rtl" : "ltr",
                          display: "grid",
                          gridTemplateColumns: previewConfig.showQrCode ? "1fr 50px" : "1fr 65px",
                          gap: "6px"
                        }}
                      >
                        {/* Tag Left Panel */}
                        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "1px", lineHeight: "1.1" }}>
                          {previewConfig.showLogo && company?.logo && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={getPublicFileUrl(company.logo)} alt="" style={{ maxHeight: "18px", maxWidth: "100%", objectFit: "contain" }} />
                          )}
                          {previewConfig.showCompanyName && (
                            <div style={{ fontWeight: 900, borderBottom: "1px solid #ddd", paddingBottom: "1px", fontSize: "0.95em" }}>
                              {company?.businessName || "DARFUS"}
                            </div>
                          )}
                          {previewConfig.showName && (
                            <strong className="block truncate">{printPreviewItems[0].name}</strong>
                          )}
                          {previewConfig.showAssetId && (
                            <div className="text-slate-400 font-mono text-[0.85em]">{printPreviewItems[0].assetId || printPreviewItems[0].barcode}</div>
                          )}
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", fontSize: "0.9em" }}>
                            {previewConfig.showKarat && printPreviewItems[0].karat && <span>{printPreviewItems[0].karat}K</span>}
                            {previewConfig.showWeight && printPreviewItems[0].grossWeight > 0 && <span>{printPreviewItems[0].grossWeight.toFixed(2)}g</span>}
                          </div>
                          {previewConfig.showType && printPreviewItems[0].stockType && (
                            <div className="text-slate-400 text-[0.8em]">{printPreviewItems[0].stockType}</div>
                          )}
                          {previewConfig.showBranch && printPreviewItems[0].branch && (
                            <div className="text-slate-400 text-[0.8em]">{printPreviewItems[0].branch}</div>
                          )}
                          {previewConfig.showPrice && (
                            <strong className="text-black block" style={{ fontSize: "1.1em" }}>
                              {money(printPreviewItems[0].price)}
                            </strong>
                          )}
                          {previewConfig.customText && (
                            <div className="text-slate-400 italic text-[0.8em] mt-auto truncate">{previewConfig.customText}</div>
                          )}
                        </div>

                        {/* Tag Right Panel (Barcode/QR) */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px" }}>
                          {previewConfig.showQrCode ? (
                            <div style={{ width: "40px", height: "40px" }}>
                              <ScannableBarcode type="qr" value={printPreviewItems[0].barcode} />
                            </div>
                          ) : (
                            <>
                              <div style={{ height: "24px", width: "100%" }}>
                                <ScannableBarcode type="barcode" value={printPreviewItems[0].barcode} />
                              </div>
                              <div className="font-mono text-[0.85em]" style={{ letterSpacing: "0.05em" }}>{printPreviewItems[0].barcode}</div>
                            </>
                          )}
                          {printPreviewItems[0].rfid && <span style={{ fontSize: "0.75em", color: "#64748b" }}>RFID</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Batch print summary (read-only) */}
            <div className="mt-4 rounded-xl bg-surface-muted/40 p-3 text-[11px] font-bold text-slate-600 dark:text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>{rtl ? "العناصر" : "Items"}: <span className="text-navy-900 dark:text-white">{printPreviewItems.length}</span></div>
              <div>{rtl ? "النسخ/عنصر" : "Copies/item"}: <span className="text-navy-900 dark:text-white">{safeCopies(previewConfig.copies)}</span></div>
              <div>{rtl ? "إجمالي الملصقات" : "Total labels"}: <span className="text-brand-700 dark:text-brand-300">{totalLabels}</span></div>
              <div>{rtl ? "النطاق" : "Scope"}: <span className="text-navy-900 dark:text-white">{(printScope === "selected" ? (rtl ? "المحدد" : "selected") : (rtl ? "المُصفّى" : "filtered"))} · {activeTab === "products" ? (rtl ? "منتجات" : "products") : (rtl ? "أصول" : "assets")}</span></div>
            </div>

            {totalLabels > LARGE_BATCH_THRESHOLD && (
              <label className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300 cursor-pointer">
                <input type="checkbox" checked={largeBatchConfirmed} onChange={(e) => setLargeBatchConfirmed(e.target.checked)} />
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {rtl ? `دفعة كبيرة: ${totalLabels} ملصقاً. أؤكد المتابعة.` : `Large batch: ${totalLabels} labels. I confirm.`}
              </label>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="secondary" onClick={() => setShowPrintPreview(false)}>{common("cancel")}</Button>
              <Button type="button" onClick={handleConfirmPrint} disabled={totalLabels > LARGE_BATCH_THRESHOLD && !largeBatchConfirmed}>
                <Printer className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {rtl ? "تأكيد وبدء الطباعة" : "Confirm & Print"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
