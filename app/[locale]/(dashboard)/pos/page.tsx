"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { isApiDataSource } from "@/lib/data-source";
import { Barcode, CheckCircle2, CreditCard, Gem, ListChecks, Trash2, UserRound, RefreshCw, AlertTriangle, Printer, FolderOpen, Save } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { DateInput, DateTimeInput } from "@/components/ui/date-input";
import { LoadingState } from "@/components/ui/loading-state";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/contexts/auth-context";
import { usePos } from "@/features/sales/hooks/use-pos";
import { useAppSettings } from "@/contexts/settings-context";
import { apiClient, generateUUID } from "@/lib/api/client";
import { Link } from "@/i18n/navigation";
import { usePermissions } from "@/hooks/use-permissions";
import { filterData } from "@/hooks/use-data-filters";
import type { Asset, AssetType, Invoice, Product } from "@/lib/types";
import { useCoreErpData } from "@/hooks/use-core-erp-data";
import { formatCurrency } from "@/lib/utils";
import { formatEnglishNumber, normalizeNumberInput, toEnglishDigits } from "@/lib/formatters/numbers";
import { NumericInput } from "@/components/ui/numeric-input";
import { NumericToken } from "@/components/ui/numeric-token";
import { formatDateTime, formatTime } from "@/lib/dates/dates";
import { JournalPreview } from "@/features/accounting/components/JournalPreview";
import { toast } from "sonner";
import { InvoiceDocument } from "@/features/printing/components/InvoiceDocument";
import { InvoicePrintOptionsDialog } from "@/features/printing/components/InvoicePrintOptionsDialog";
import { renderPrintDocument } from "@/features/printing/components/render-print-document";
import { printHtmlDocument } from "@/lib/print/print-service";
import {
  buildTemplateConfigFromPrintOptions,
  getPrintDocumentTitleOverride,
  type InvoicePrintOptions,
  type InvoicePrintTemplateId,
} from "@/features/printing/lib/invoice-print-options";

const DEFAULT_POS_PRINT_TEMPLATE: InvoicePrintTemplateId = "thermal";

function sanitizeDefaultPosTemplate(value: unknown): InvoicePrintTemplateId {
  if (value === "thermal" || value === "luxuryGold" || value === "compactA4" || value === "minimal") {
    return value;
  }
  if (value === "luxury") return "luxuryGold";
  if (value === "compact") return "compactA4";
  return DEFAULT_POS_PRINT_TEMPLATE;
}

// Phase 19Y.6 — POS print dialog keeps Auto/Bilingual as fixed display defaults;
// the template comes from settings.receipt.defaultPosTemplate with Thermal fallback.
const POS_PRINT_DEFAULTS = {
  documentMode: "auto",
  languageMode: "bilingual",
} satisfies Pick<InvoicePrintOptions, "documentMode" | "languageMode">;

export default function PosPage() {
  const t = useTranslations("POS");
  const filtersT = useTranslations("Filters");
  const common = useTranslations("Common");
  const inventoryT = useTranslations("Inventory");
  const printT = useTranslations("PrintExport");
  const locale = useLocale();
  const rtl = locale === "ar";
  const { company, activeBranch, activeBranchId, user } = useAuth();
  const { settings, loading: settingsLoading, loaded: settingsLoaded, error: settingsError } = useAppSettings();
  const isApi = isApiDataSource();

  // In API mode we must NOT price/checkout against fallback settings (e.g. VAT=5)
  // before the real company settings have loaded. Block until confirmed loaded.
  const settingsNotReady = isApi && (!settingsLoaded || settingsError || settingsLoading);

  // Custom API hooks
  // API mode uses the bounded /pos/search projection for inventory candidates;
  // do not preload the full Products/Assets collections just to render search.
  const { products, assets, goldPrice, isLoading: isErpLoading } = useCoreErpData({
    resources: isApi ? ["customers"] : undefined,
  });
  const {
    customers, calculatePricing, postInvoice, isPosting,
    isApiMode, createDraftInvoice, updateDraftInvoice, cancelDraftInvoice, postDraftInvoice, fetchDraftInvoices,
  } = usePos();

  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchHighlight, setSearchHighlight] = useState(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchGenerationRef = useRef(0);
  const [cart, setCart] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [method, setMethod] = useState("card");
  const [completed, setCompleted] = useState<string | null>(null);
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);

  // Phase 19Y.3 — POS print dialog. Company data is built from the auth company
  // (Company Profile), same source as the Sales print. Display-only: printing
  // uses the server-returned invoice totals via the ViewModel and never
  // re-submits the order or recalculates anything.
  const printCompany = useMemo(() => ({
    name: company?.businessName ?? settings?.businessName ?? common("appName"),
    logo: company?.logo || settings?.logo,
    branch: company?.branchName,
    trn: company?.taxNumber,
    currency: company?.currency ?? settings?.currency ?? "AED",
    phone: company?.phone,
    email: company?.email,
    website: company?.website,
    country: company?.country,
    city: company?.city,
    region: company?.region,
    address1: company?.address1,
    address2: company?.address2,
    postalCode: company?.postalCode,
  }), [company, settings]);

  const printLabels = {
    invoice: printT("invoice"),
    invoiceNo: t("invoiceNo"),
    uuid: printT("uuid"),
    date: t("date"),
    branch: t("branch"),
    trn: printT("trn"),
    customer: t("customer"),
    cashier: t("cashier"),
    item: t("item"),
    assetId: printT("id"),
    description: t("item"),
    weight: t("weight"),
    karat: printT("karat"),
    qty: t("qty"),
    price: t("rate"),
    makingCharge: t("makingCharge"),
    stoneValue: t("stoneValue"),
    discount: t("discount"),
    subtotal: t("subtotal"),
    vat: t("vatAmount"),
    total: t("total"),
    payment: t("payment"),
    remaining: printT("remaining"),
    notes: printT("notes"),
    qr: printT("qr"),
  };

  const defaultPosTemplate = sanitizeDefaultPosTemplate(settings?.receipt?.defaultPosTemplate);
  const posPrintInitialOptions = useMemo<InvoicePrintOptions>(() => ({
    ...POS_PRINT_DEFAULTS,
    templateId: defaultPosTemplate,
  }), [defaultPosTemplate]);

  const printInvoice = (invoice: Invoice, options: InvoicePrintOptions) => {
    const mappedPaperSize = options.templateId === "thermal" ? "80mm" : "A4";
    const html = renderPrintDocument(
      <InvoiceDocument
        templateId={options.templateId}
        invoice={invoice}
        templateConfig={buildTemplateConfigFromPrintOptions(options)}
        documentTitleOverride={getPrintDocumentTitleOverride(options.documentMode)}
        company={printCompany}
        cashierName={[user?.firstName, user?.lastName].filter(Boolean).join(" ")}
        locale={locale}
        labels={printLabels}
        settings={settings}
      />,
      { documentType: "invoice", paperSize: mappedPaperSize, title: `${printT("printInvoice")} ${invoice.invoiceNumber || invoice.id}`, locale },
    );
    const result = printHtmlDocument(html, { documentType: "invoice", paperSize: mappedPaperSize, title: invoice.invoiceNumber || invoice.id, locale });
    if (!result.ok) {
      toast.error(result.errorCode === "popup-blocked" ? printT("popupBlocked") : printT("printFailed"));
    }
  };

  // Qty selector states
  const [selectedProductForQty, setSelectedProductForQty] = useState<Product | null>(null);
  const [inputQuantity, setInputQuantity] = useState("1");
  const [qtyError, setQtyError] = useState<string | null>(null);
  
  // Idempotency key persistent for the duration of this current draft invoice process
  const [idempotencyKey, setIdempotencyKey] = useState("");
  
  // Pricing breakdown states
  const [provisionalTax, setProvisionalTax] = useState("0");
  const [provisionalTotal, setProvisionalTotal] = useState("0");
  const [provisionalSubtotal, setProvisionalSubtotal] = useState("0");
  const [provisionalMakingCharge, setProvisionalMakingCharge] = useState("0");
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [showJournal, setShowJournal] = useState(false);
  const lastPricingPayloadKeyRef = useRef<string | null>(null);

  // New Pricing Fields
  const [discount, setDiscount] = useState("0");
  const [makingChargePerGram, setMakingChargePerGram] = useState("0");
  const [stoneValue, setStoneValue] = useState("0");
  const [notes, setNotes] = useState("");
  // Phase 32.6-Post-C — POS reservation (deposit) mode.
  const { hasPermission } = usePermissions();
  const [showReservationDialog, setShowReservationDialog] = useState(false);
  const [resInitialPayment, setResInitialPayment] = useState("");
  const [resExpiry, setResExpiry] = useState("");
  const [resMethod, setResMethod] = useState("cash");
  const [resNotes, setResNotes] = useState("");
  const [creatingReservation, setCreatingReservation] = useState(false);
  const [createdReservation, setCreatedReservation] = useState<{ id: string; paidTotal?: string | number; remainingTotal?: string | number; agreedTotal?: string | number; expiresAt?: string } | null>(null);
  const [reservationAccountConfigured, setReservationAccountConfigured] = useState(false);
  const canConfigureSettings = hasPermission("settings.update");
  useEffect(() => {
    let cancelled = false;
    apiClient<{ success: boolean; data: { status: "READY" | "BLOCKED" | "MANUAL_REVIEW" } }>("/readiness/operations")
      .then((result) => { if (!cancelled) setReservationAccountConfigured(result.data.status === "READY"); })
      .catch(() => { if (!cancelled) setReservationAccountConfigured(false); });
    return () => { cancelled = true; };
  }, []);

  // Split payment details
  const [splitCash, setSplitCash] = useState("0");
  const [splitCard, setSplitCard] = useState("0");
  const [splitTransfer, setSplitTransfer] = useState("0");

  // Installment fields
  const [downPayment, setDownPayment] = useState("0");
  const [installmentCount, setInstallmentCount] = useState("6");
  const [installmentFrequency, setInstallmentFrequency] = useState("monthly");
  const [guarantorName, setGuarantorName] = useState("");
  const [guarantorPhone, setGuarantorPhone] = useState("");
  const [firstDueDate, setFirstDueDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Drafts State
  const [draftName, setDraftName] = useState("");
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [showSaveDraftModal, setShowSaveDraftModal] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);
  // API-mode draft lifecycle state.
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [draftBusy, setDraftBusy] = useState(false);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [cancelDraftTarget, setCancelDraftTarget] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [postDraftKey, setPostDraftKey] = useState("");

  // Build the cart/charges payload shared by save-draft & update-draft (API).
  const buildDraftPayload = () => ({
    customerId,
    customerName: customers.find((c) => c.id === customerId)?.name || "",
    branchId: activeBranchId,
    branch: activeBranch,
    paymentMethod: method,
    discount: Number(discount) || 0,
    makingChargePerGram: Number(makingChargePerGram) || 0,
    stoneValue: Number(stoneValue) || 0,
    notes: notes || "",
    items: cart.map((item) => ({
      assetId: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      cost: item.cost,
      weight: item.totalWeight,
      karat: item.karat,
      discount: item.discount,
      makingCharge: item.makingCharge,
      makingChargePerGram: Number(makingChargePerGram) || 0,
      stoneValue: item.stoneValue,
    })),
  });

  const clearCartAndCharges = () => {
    setCart([]);
    setDiscount("0");
    setMakingChargePerGram("0");
    setStoneValue("0");
    setNotes("");
  };

  // Load DRAFT invoices: API-backed in api mode (source of truth), localStorage
  // only in mock mode (kept as a local fallback, never the api-mode truth).
  const loadDrafts = async () => {
    if (isApiMode) {
      try {
        setDrafts(await fetchDraftInvoices());
      } catch (e) {
        console.error("Failed to load API drafts", e);
      }
      return;
    }
    const saved = localStorage.getItem("darfus-pos-drafts");
    if (saved) {
      try { setDrafts(JSON.parse(saved)); } catch (e) { console.error("Failed to parse drafts", e); }
    }
  };

  useEffect(() => {
    loadDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiMode]);

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (isApiMode) {
      setDraftBusy(true);
      setPricingError(null);
      try {
        const res = await createDraftInvoice(buildDraftPayload(), generateUUID());
        const draftId = (res as any)?.id;
        setDraftMessage(rtl ? `تم حفظ المسودة ${draftId}` : `Draft ${draftId} saved`);
        clearCartAndCharges();
        setShowSaveDraftModal(false);
        setDraftName("");
        await loadDrafts();
      } catch (err: any) {
        setPricingError(err.message || (rtl ? "تعذّر حفظ المسودة" : "Failed to save draft"));
      } finally {
        setDraftBusy(false);
      }
      return;
    }

    // mock mode — localStorage draft (fallback only)
    const nameToUse = draftName.trim() || `Draft - ${formatTime(new Date(), "Asia/Dubai", locale)}`;
    const newDraft = {
      id: `draft-${Date.now()}`, name: nameToUse, customerId, cart, discount, makingChargePerGram, stoneValue, notes, method,
      timestamp: formatDateTime(new Date(), "Asia/Dubai", locale),
    };
    const updated = [newDraft, ...drafts];
    setDrafts(updated);
    localStorage.setItem("darfus-pos-drafts", JSON.stringify(updated));
    setDraftName("");
    setShowSaveDraftModal(false);
  };

  const handleLoadDraft = (draft: any) => {
    if (isApiMode) {
      // API draft → hydrate cart from its invoice items.
      setCustomerId(draft.customerId || "");
      setCart((draft.items || []).map((it: any) => ({
        id: it.assetId,
        name: it.name,
        price: Number(it.price) || 0,
        cost: Number(it.cost) || 0,
        quantity: Number(it.quantity) || 1,
        totalWeight: Number(it.weight) || 0,
        karat: it.karat ?? null,
        isProduct: false,
        discount: Number(it.discount) || 0,
        makingCharge: Number(it.makingCharge) || 0,
        stoneValue: Number(it.stoneValue) || 0,
      })));
      setDiscount(String(draft.discount ?? "0"));
      setMakingChargePerGram(String(draft.makingChargePerGram ?? "0"));
      setStoneValue(String(draft.stoneValue ?? "0"));
      setNotes(draft.notes || "");
      setMethod(draft.paymentMethod || "cash");
      setActiveDraftId(draft.id);
      setShowDraftsModal(false);
      return;
    }
    // mock draft
    setCustomerId(draft.customerId);
    setCart(draft.cart);
    setDiscount(draft.discount || "0");
    setMakingChargePerGram(draft.makingChargePerGram || "0");
    setStoneValue(draft.stoneValue || "0");
    setNotes(draft.notes || "");
    setMethod(draft.method || "card");
    setShowDraftsModal(false);
  };

  const handleDeleteDraft = (draftId: string) => {
    // In API mode a draft is cancelled (with a reason), not silently deleted.
    if (isApiMode) {
      setCancelDraftTarget(draftId);
      setCancelReason("");
      return;
    }
    const updated = drafts.filter((d) => d.id !== draftId);
    setDrafts(updated);
    localStorage.setItem("darfus-pos-drafts", JSON.stringify(updated));
  };

  // ── Active-draft actions (API mode) ──
  const handleUpdateDraft = async () => {
    if (!activeDraftId) return;
    setDraftBusy(true);
    setPricingError(null);
    try {
      await updateDraftInvoice(activeDraftId, buildDraftPayload());
      setDraftMessage(rtl ? "تم تحديث المسودة" : "Draft updated");
      await loadDrafts();
    } catch (err: any) {
      setPricingError(err.message || (rtl ? "تعذّر تحديث المسودة" : "Failed to update draft"));
    } finally {
      setDraftBusy(false);
    }
  };

  const handlePostDraft = async () => {
    if (!activeDraftId) return;
    setDraftBusy(true);
    setPricingError(null);
    try {
      const key = postDraftKey || generateUUID();
      setPostDraftKey(key);
      // Persist the current cart/charges first so the posted invoice matches the screen.
      await updateDraftInvoice(activeDraftId, buildDraftPayload());
      const result = await postDraftInvoice(activeDraftId, key);
      setCompletedInvoice(result);
      setCompleted(result.id);
      setActiveDraftId(null);
      setPostDraftKey("");
      clearCartAndCharges();
      await loadDrafts();
    } catch (err: any) {
      setPricingError(err.message || (rtl ? "تعذّر ترحيل المسودة" : "Failed to post draft"));
    } finally {
      setDraftBusy(false);
    }
  };

  const handleExitDraft = () => {
    setActiveDraftId(null);
    clearCartAndCharges();
  };

  const confirmCancelDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelDraftTarget) return;
    if (!cancelReason.trim()) return;
    setDraftBusy(true);
    try {
      await cancelDraftInvoice(cancelDraftTarget, cancelReason.trim());
      if (activeDraftId === cancelDraftTarget) { setActiveDraftId(null); clearCartAndCharges(); }
      setCancelDraftTarget(null);
      setCancelReason("");
      await loadDrafts();
    } catch (err: any) {
      setPricingError(err.message || (rtl ? "تعذّر إلغاء المسودة" : "Failed to cancel draft"));
    } finally {
      setDraftBusy(false);
    }
  };

  // Initialize customer list selection
  useEffect(() => {
    if (customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id);
    }
  }, [customers, customerId]);

  // Compute active payment methods based on settings
  const paymentOptions = useMemo(() => {
    const opts = [
      { value: "cash", label: rtl ? "نقدي / Cash" : "Cash" },
      { value: "card", label: rtl ? "بطاقة / Card" : "Card" },
      { value: "transfer", label: rtl ? "تحويل / Transfer" : "Transfer" },
      { value: "split", label: rtl ? "مجزأ / Split" : "Split" },
      { value: "installment", label: rtl ? "تقسيط / Install" : "Installment" },
      { value: "deposit", label: rtl ? "عربون / Deposit" : "Deposit" }
    ];
    const activeMethods = settings?.paymentMethods || ["cash", "card", "transfer", "installment", "deposit"];
    const installmentEnabled = settings?.installmentEnabled ?? true;
    return opts.filter(opt => {
      // Hide installment when the feature is disabled in Settings.
      if (opt.value === "installment" && !installmentEnabled) return false;
      if (opt.value === "split") {
        const baseMethods = ["cash", "card", "transfer"];
        return baseMethods.filter(bm => activeMethods.includes(bm)).length > 1;
      }
      return activeMethods.includes(opt.value);
    });
  }, [settings, rtl]);

  // Sync selected method with active options
  useEffect(() => {
    if (paymentOptions.length > 0 && !paymentOptions.some(o => o.value === method)) {
      setMethod(paymentOptions[0].value);
    }
  }, [paymentOptions, method]);

  // Generate a fresh idempotency key when checkout begins or cart changes
  useEffect(() => {
    if (cart.length > 0 && !idempotencyKey) {
      setIdempotencyKey(generateUUID());
    } else if (cart.length === 0) {
      setIdempotencyKey("");
    }
  }, [cart, idempotencyKey]);

  // Request pricing breakdown calculation whenever cart, customer, or charges switch
  useEffect(() => {
    if (cart.length === 0) {
      lastPricingPayloadKeyRef.current = null;
      setProvisionalSubtotal("0");
      setProvisionalTax("0");
      setProvisionalTotal("0");
      setProvisionalMakingCharge("0");
      setPricingError(null);
      return;
    }

    const discNum = Number(discount) || 0;
    const mcNum = Number(makingChargePerGram) || 0;
    const svNum = Number(stoneValue) || 0;

    const pricingItems: any[] = [];
    cart.forEach(item => {
      const times = item.isProduct ? item.quantity : 1;
      for (let i = 0; i < times; i++) {
        pricingItems.push({ id: item.id });
      }
    });

    const payloadKey = JSON.stringify({
      customerId,
      assetIds: pricingItems.map((item) => item.id),
      discount: discNum,
      makingChargePerGram: mcNum,
      stoneValue: svNum,
    });

    if (lastPricingPayloadKeyRef.current === payloadKey) {
      return;
    }

    lastPricingPayloadKeyRef.current = payloadKey;

    calculatePricing(customerId, pricingItems, discNum, mcNum, svNum)
      .then((res) => {
        setProvisionalSubtotal(res.subtotal);
        setProvisionalTax(res.tax);
        setProvisionalTotal(res.total);
        setProvisionalMakingCharge(res.totalMakingCharge ?? res.makingCharge ?? "0");
        setPricingError(null);
      })
      .catch((err) => {
        setPricingError(err.message || "Failed to retrieve pricing preview.");
      });
  }, [cart, customerId, discount, makingChargePerGram, stoneValue, calculatePricing]);

  const typeLabels: Record<AssetType, string> = {
    "gold-piece": inventoryT("goldPiece"),
    "gold-weight": inventoryT("goldWeight"),
    diamond: inventoryT("diamond"),
    gemstone: inventoryT("gemstone"),
    pearl: inventoryT("pearl"),
    watch: inventoryT("watch"),
  };

  // Unified PosItem structure for cards mapping
  interface PosItem {
    id: string;
    isProduct: boolean;
    code: string;
    name: string;
    type: string;
    karat?: number;
    grossWeight: number;
    price: number;
    available: number;
    sold: number;
    rawItem: any;
  }

  const activeBranchProducts = useMemo(() => {
    return products.filter((p) => p.isActive && (!activeBranchId || p.branchId === activeBranchId));
  }, [products, activeBranchId]);

  const activeBranchAssets = useMemo(() => {
    return assets.filter((a) => a.status === "available" && !a.parentAssetId && (!activeBranchId || a.branchId === activeBranchId));
  }, [assets, activeBranchId]);

  const currentSellingPriceForAsset = (asset: any) => {
    const profile = asset.inventoryProfile || asset.profile;
    const dynamicGoldProfiles = ["CGP_CUSTOMER_GOLD_PURCHASE", "GOLD_BY_WEIGHT_JEWELLERY", "GOLD_BAR_24K"];
    if (!dynamicGoldProfiles.includes(profile)) return Number(asset.price) || 0;
    const karat = Number(asset.karat);
    const quote = (goldPrice?.prices || []).find((row: any) => Number(row.karat) === karat);
    const rate = Number(quote?.pricePerGram);
    const net = Number(asset.netGoldWeight ?? asset.netWeight ?? asset.grossWeight ?? 0);
    const gross = Number(asset.grossWeight ?? asset.netWeight ?? 0);
    if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(net) || net <= 0) return 0;
    // The server remains the pricing authority. This is a display quote only;
    // checkout re-resolves Gold Center and recomputes the line.
    const making = profile === "GOLD_BY_WEIGHT_JEWELLERY" || profile === "CGP_CUSTOMER_GOLD_PURCHASE"
      ? Number(makingChargePerGram) || 0
      : 0;
    return net * rate + Math.max(0, gross) * making;
  };

  const posItems = useMemo(() => {
    const list: PosItem[] = [];
    
    // Add products
    for (const p of activeBranchProducts) {
      if (p.quantityAvailable > 0) {
        list.push({
          id: p.id,
          isProduct: true,
          code: p.productCode,
          name: p.productName,
          type: p.stockType || "gold-piece",
          karat: p.karat,
          grossWeight: p.totalWeight,
          price: p.salePrice,
          available: p.quantityAvailable,
          sold: p.quantitySold,
          rawItem: p
        });
      }
    }
    
    // Add assets
    for (const a of activeBranchAssets) {
      list.push({
        id: a.id,
        isProduct: false,
        code: a.barcode || a.id,
        name: a.name,
        type: a.type,
        karat: a.karat,
        grossWeight: a.grossWeight,
        price: currentSellingPriceForAsset(a),
        available: 1,
        sold: 0,
        rawItem: a
      });
    }
    
    return list;
  }, [activeBranchProducts, activeBranchAssets, goldPrice, makingChargePerGram]);

  const filtered = useMemo(
    () => filterData(
      posItems,
      query,
      [(item) => item.name, (item) => item.id, (item) => item.code, (item) => item.type],
      [(item) => type === "all" || item.type === type]
    ),
    [posItems, query, type],
  );

  // Phase 2: the visible search is backed by one bounded, branch-scoped
  // read-only endpoint. The existing local list remains only as mock-mode
  // compatibility; the API path never expands into a full catalog dropdown.
  useEffect(() => {
    if (!isApi || !searchOpen) return;
    const generation = ++searchGenerationRef.current;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const params = new URLSearchParams({
          query: query.trim(),
          type,
          limit: "20",
          includeUnavailableExact: "true",
        });
        const response = await apiClient<{ items?: any[]; data?: { items?: any[] } }>(`/pos/search?${params.toString()}`, {
          locale,
          signal: controller.signal,
        });
        if (generation !== searchGenerationRef.current) return;
        setSearchResults(response.items ?? response.data?.items ?? []);
        setSearchHighlight(0);
      } catch (error: any) {
        if (controller.signal.aborted || generation !== searchGenerationRef.current) return;
        setSearchError(error?.message || (rtl ? "تعذر تحميل نتائج البحث" : "Search failed"));
        setSearchResults([]);
      } finally {
        if (generation === searchGenerationRef.current) setSearchLoading(false);
      }
    }, query.trim() ? 250 : 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [activeBranchId, isApi, locale, query, rtl, searchOpen, type]);

  const searchItems: PosItem[] = useMemo(
    () => (isApi ? searchResults : filtered.slice(0, 20)) as PosItem[],
    [filtered, isApi, searchResults],
  );

  const currency = company?.currency ?? "AED";
  const money = (value: number | string) => `\u2068${formatCurrency(Number(value), currency, locale)}\u2069`;
  const numericText = (value: number | string | null | undefined) => formatEnglishNumber(value, { maximumFractionDigits: 8 });
  const selectedCustomer = useMemo(() => customers.find((customer) => customer.id === customerId) ?? null, [customerId, customers]);
  const selectedCustomerAddress = useMemo(() => {
    const address = selectedCustomer?.addresses?.find((item) => item && (item.line1 || item.city || item.country));
    if (!address) return "";
    return [address.line1, address.line2, address.city, address.country, address.postalCode].filter(Boolean).join("، ");
  }, [selectedCustomer]);
  
  const provisionalCost = useMemo(
    () => cart.reduce((sum, item) => sum + item.cost * (item.isProduct ? item.quantity : 1), 0),
    [cart],
  );

  const openQtySelector = (product: Product) => {
    const existing = cart.find(item => item.id === product.id);
    setSelectedProductForQty(product);
    setInputQuantity(existing ? String(existing.quantity) : "1");
    setQtyError(null);
  };

  const handleAddProductToCart = () => {
    if (!selectedProductForQty) return;
    const qty = Number(inputQuantity);
    if (isNaN(qty) || qty <= 0) {
      setQtyError(rtl ? "الرجاء إدخال كمية صحيحة أكبر من الصفر" : "Please enter a valid quantity greater than zero");
      return;
    }
    if (qty > selectedProductForQty.quantityAvailable) {
      setQtyError(rtl ? "الكمية المطلوبة غير متاحة في المخزون" : "Requested quantity is not available in stock");
      return;
    }
    
    const totalWeight = Math.round(qty * (selectedProductForQty.averageUnitWeight || 0) * 10000) / 10000;
    
    setCart((current) => {
      const filteredList = current.filter(item => item.id !== selectedProductForQty.id);
      return [
        ...filteredList,
        {
          id: selectedProductForQty.id,
          isProduct: true,
          code: selectedProductForQty.productCode,
          name: selectedProductForQty.productName,
          quantity: qty,
          price: selectedProductForQty.salePrice,
          totalWeight,
          cost: Number(selectedProductForQty.unitCost || 0),
          karat: selectedProductForQty.karat,
          discount: 0,
          makingCharge: 0,
          stoneValue: 0,
          rawItem: selectedProductForQty,
          branchId: selectedProductForQty.branchId
        }
      ];
    });
    
    setSelectedProductForQty(null);
    setQuery("");
    setSearchOpen(false);
    window.setTimeout(() => {
      searchInputRef.current?.focus();
      setSearchOpen(false);
    }, 0);
  };

  const handleItemClick = (item: PosItem) => {
    setCompleted(null);
    if ((item as any).unavailable) {
      toast.error(rtl ? "هذا الصنف غير متاح للبيع حالياً." : "This item is not currently available for sale.");
      return;
    }
    if (item.isProduct) {
      openQtySelector(item.rawItem);
    } else {
      if (!Number.isFinite(item.price) || item.price <= 0) {
        toast.error(rtl ? "لا يمكن بيع الأصل قبل توفر سعر بيع حالي صالح." : "This asset cannot be sold until a valid current selling price is available.");
        return;
      }
      const asset = item.rawItem;
      setCart((current) => {
        const selected = current.some((ci) => ci.id === asset.id);
        if (selected) {
          return current.filter((ci) => ci.id !== asset.id);
        } else {
          return [
            ...current,
            {
              id: asset.id,
              isProduct: false,
              code: asset.barcode || asset.id,
              name: asset.name,
              quantity: 1,
              price: item.price,
              totalWeight: asset.grossWeight,
              cost: Number(asset.cost || 0),
              karat: asset.karat,
              discount: 0,
              makingCharge: 0,
              stoneValue: 0,
              rawItem: asset,
              branchId: asset.branchId,
              status: asset.status
            }
          ];
        }
      });
      setQuery("");
      setSearchOpen(false);
      window.setTimeout(() => {
        searchInputRef.current?.focus();
        setSearchOpen(false);
      }, 0);
    }
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSearchOpen(true);
      setSearchHighlight((current) => Math.min(current + 1, Math.max(0, searchItems.length - 1)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSearchHighlight((current) => Math.max(0, current - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = searchItems[searchHighlight];
      if (item && !(item as any).unavailable) handleItemClick(item);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setSearchOpen(false);
      setSearchHighlight(0);
      setQuery("");
    }
  };

  const removeFromCart = (id: string) => {
    setCart(current => current.filter(item => item.id !== id));
  };

  const completeSale = async () => {
    // While editing a draft, the immediate-post path is disabled to avoid
    // creating a duplicate invoice — the cart must be posted via the draft.
    if (activeDraftId) {
      setPricingError(rtl ? "أنت تعدّل مسودة — استخدم \"ترحيل المسودة\"." : "You are editing a draft — use \"Post draft\".");
      return;
    }
    if (settingsNotReady) {
      setPricingError(
        settingsError
          ? (rtl ? "تعذّر تحميل إعدادات النظام (الضريبة/العملة). يرجى إعادة المحاولة قبل إتمام البيع." : "Failed to load system settings (VAT/currency). Please retry before completing the sale.")
          : (rtl ? "جارٍ تحميل إعدادات النظام..." : "Loading system settings...")
      );
      return;
    }
    if (!cart.length) {
      setPricingError(rtl ? "لا توجد أصناف في الفاتورة!" : "Invoice has no items!");
      return;
    }
    if (!customerId) {
      setPricingError(rtl ? "العميل مطلوب!" : "Customer is required!");
      return;
    }
    if (!activeBranchId) {
      setPricingError(rtl ? "الفرع النشط مطلوب!" : "Active branch is required!");
      return;
    }
    
    // Validate assets / products branches and availability
    for (const item of cart) {
      if (item.isProduct) {
        const productActive = item.rawItem ? item.rawItem.isActive : true;
        if (!productActive) {
          setPricingError(rtl ? `المنتج ${item.name} غير نشط ولا يمكن بيعه!` : `Product ${item.name} is inactive and cannot be sold!`);
          return;
        }
        const availableQty = item.rawItem ? Number(item.rawItem.quantityAvailable) : 0;
        if (availableQty < item.quantity) {
          setPricingError(rtl ? `الالكمية المطلوبة غير متاحة في المخزون للمنتج ${item.name}. المتاح: ${availableQty}` : `Requested quantity is not available in stock for product ${item.name}. Available: ${availableQty}`);
          return;
        }
        if (item.branchId && item.branchId !== activeBranchId) {
          setPricingError(rtl ? `المنتج ${item.name} لا ينتمي للفرع النشط!` : `Product ${item.name} does not belong to the active branch!`);
          return;
        }
      } else {
        const assetStatus = item.status || (item.rawItem ? item.rawItem.status : undefined);
        if (assetStatus !== "available") {
          setPricingError(rtl ? `المنتج ${item.name} غير متوفر للبيع!` : `Product ${item.name} is not available!`);
          return;
        }
        if (item.branchId && item.branchId !== activeBranchId) {
          setPricingError(rtl ? `المنتج ${item.name} لا ينتمي للفرع النشط!` : `Product ${item.name} does not belong to the active branch!`);
          return;
        }
      }
    }

    const customer = customers.find((item) => item.id === customerId);
    if (!customer) {
      setPricingError(rtl ? "العميل المحدد غير موجود أو لم يتم تحميله!" : "The selected customer was not found or is not loaded!");
      return;
    }

    // Phase 32.6-Post-C — the Deposit / عربون action creates a Reservation, not a
    // sales invoice. Enter reservation mode: open the dedicated dialog and never
    // run the normal invoice/sale posting path from here.
    if (method === "deposit") {
      if (cart.some((item) => item.isProduct)) {
        setPricingError(rtl ? "الحجز يقبل قطع الأصول فقط وليس المنتجات المخزنية." : "Reservations accept serialized assets only, not stock products.");
        return;
      }
      if (!reservationAccountConfigured) {
        setPricingError(rtl ? "لا يمكن تسجيل حجز بعربون قبل تشغيل إعداد حساب الفرع التلقائي." : "A reservation deposit cannot be recorded until automatic branch setup is complete.");
        return;
      }
      setResInitialPayment("");
      setResMethod("cash");
      setResNotes(notes || "");
      const week = new Date();
      week.setDate(week.getDate() + 7);
      setResExpiry(week.toISOString().slice(0, 16));
      setShowReservationDialog(true);
      return;
    }

    if (method === "split") {
      const splitSum = (Number(splitCash) || 0) + (Number(splitCard) || 0) + (Number(splitTransfer) || 0);
      if (Math.abs(splitSum - Number(provisionalTotal)) > 0.01) {
        setPricingError(rtl ? "مجموع المبالغ في الدفع المجزأ يجب أن يساوي الإجمالي" : "Total of split payments must equal invoice total");
        return;
      }
    }

    if (method === "installment") {
      if (settings?.installmentEnabled === false) {
        setPricingError(rtl ? "البيع بالتقسيط غير مفعّل في إعدادات النظام!" : "Installment sales are disabled in system settings!");
        return;
      }
      const dpNum = Number(downPayment) || 0;
      const totalNum = Number(provisionalTotal) || 0;
      const countNum = Number(installmentCount) || 0;

      // Enforce maximum installment count from Settings.
      const maxCount = Number(settings?.installmentMaxCount) || 0;
      if (maxCount > 0 && countNum > maxCount) {
        setPricingError(rtl ? `عدد الأقساط يتجاوز الحد الأقصى المسموح به (${maxCount})!` : `Installment count exceeds the maximum allowed (${maxCount})!`);
        return;
      }

      if (dpNum === 0) {
        const zeroDownPaymentAllowed = settings?.allowZeroDownPayment || false;
        const hasZeroDownPermission = hasPermission("pos.installment.zeroDownPayment") || user?.role === "admin" || user?.role === "owner";
        if (!zeroDownPaymentAllowed && !hasZeroDownPermission) {
          setPricingError(rtl ? "البيع بالتقسيط يتطلب دفعة أولى بناءً على إعدادات النظام وصلاحيات المستخدم!" : "Installment checkout requires a down payment based on system settings and user permissions!");
          return;
        }
      }

      // Enforce minimum down-payment percentage from Settings.
      const minDownPct = Number(settings?.installmentMinDownPaymentPercent) || 0;
      if (minDownPct > 0 && dpNum > 0) {
        const requiredDown = Math.round(totalNum * (minDownPct / 100) * 100) / 100;
        if (dpNum < requiredDown) {
          setPricingError(rtl ? `الدفعة الأولى يجب ألا تقل عن ${minDownPct}% من الإجمالي (${requiredDown})!` : `Down payment must be at least ${minDownPct}% of the total (${requiredDown})!`);
          return;
        }
      }
    }

    try {
      const invoiceData = {
        customerId,
        customerName: customer.name,
        total: Number(provisionalTotal),
        tax: Number(provisionalTax),
        discount: Number(discount) || 0,
        makingChargePerGram: Number(makingChargePerGram) || 0,
        stoneValue: Number(stoneValue) || 0,
        notes: notes || "",
        paymentMethod: method, // raw value cash/card/transfer/split/installment/deposit
        branchId: activeBranchId,
        branch: activeBranch,
        items: cart.map((item) => ({
          assetId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          cost: item.cost,
          totalWeight: item.totalWeight,
          discount: item.discount,
          makingCharge: item.makingCharge,
          makingChargePerGram: Number(makingChargePerGram) || 0,
          stoneValue: item.stoneValue,
        })),
        paymentSplits: method === "split" ? [
          { method: "cash", amount: Number(splitCash) || 0 },
          { method: "card", amount: Number(splitCard) || 0 },
          { method: "transfer", amount: Number(splitTransfer) || 0 }
        ].filter(s => s.amount > 0) : [],
        downPayment: method === "installment" ? Number(downPayment) || 0 : 0,
        installmentCount: method === "installment" ? Number(installmentCount) || 0 : 0,
        installmentFrequency: method === "installment" ? installmentFrequency : "monthly",
        firstDueDate: method === "installment" ? firstDueDate : undefined,
        guarantorName: method === "installment" ? guarantorName : undefined,
        guarantorPhone: method === "installment" ? guarantorPhone : undefined,
      };

      const result = await postInvoice(invoiceData, idempotencyKey);
      setCart([]);
      setDiscount("0");
      setMakingChargePerGram("0");
      setStoneValue("0");
      setNotes("");
      setSplitCash("0");
      setSplitCard("0");
      setSplitTransfer("0");
      setDownPayment("0");
      setGuarantorName("");
      setGuarantorPhone("");
      setCompletedInvoice(result);
      setCompleted(result.id);
      setIdempotencyKey(""); // reset key for next transaction
    } catch (err: any) {
      setPricingError(err.message || "Failed to post invoice checkout.");
    }
  };

  // Phase 32.6-Post-C — create a reservation with a mandatory initial payment
  // from the POS cart. Submits only asset ids and operational fields; totals,
  // VAT, journal lines, and the advances account are all server-derived.
  const createReservationFromPos = async () => {
    setPricingError("");
    const customer = customers.find((item) => item.id === customerId);
    if (!customer) { setPricingError(rtl ? "العميل مطلوب!" : "Customer is required!"); return; }
    const amount = Number(toEnglishDigits(resInitialPayment));
    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (!(amount > 0)) { setPricingError(rtl ? "يجب إدخال دفعة أولى أكبر من صفر." : "An initial payment greater than zero is required."); return; }
    if (amount > cartTotal + 0.0001) { setPricingError(rtl ? "الدفعة الأولى لا يمكن أن تتجاوز إجمالي الحجز." : "The initial payment cannot exceed the reservation total."); return; }
    if (!resExpiry) { setPricingError(rtl ? "تاريخ ووقت انتهاء الحجز مطلوب." : "Reservation expiry date/time is required."); return; }
    const expiryDate = new Date(resExpiry);
    if (Number.isNaN(expiryDate.getTime()) || expiryDate.getTime() <= Date.now()) { setPricingError(rtl ? "يجب أن يكون تاريخ الانتهاء في المستقبل." : "Expiry must be in the future."); return; }
    if (!reservationAccountConfigured) { setPricingError(rtl ? "حساب دفعات الفرع غير مهيأ." : "The branch deposit account is not configured."); return; }

    setCreatingReservation(true);
    try {
      const key = generateUUID();
      const res = await apiClient<{ success: boolean; data: { reservation: any } }>("/reservations", {
        method: "POST",
        locale,
        idempotencyKey: key,
        body: JSON.stringify({
          customerId,
          branchId: activeBranchId,
          expiresAt: expiryDate.toISOString(),
          notes: resNotes || null,
          items: cart.map((item) => ({ assetId: item.id })),
          initialPayment: { amount, paymentMethod: resMethod },
          customerName: customer.name,
          branch: activeBranch,
        }),
      });
      const reservation = (res as any)?.data?.reservation?.reservation || (res as any)?.data?.reservation || (res as any)?.data;
      setShowReservationDialog(false);
      setCart([]);
      setDiscount("0");
      setMakingChargePerGram("0");
      setStoneValue("0");
      setNotes("");
      setResInitialPayment("");
      setResNotes("");
      setIdempotencyKey("");
      setCreatedReservation({
        id: reservation?.id,
        agreedTotal: reservation?.agreedTotal,
        paidTotal: reservation?.paidTotal,
        remainingTotal: reservation?.remainingTotal,
        expiresAt: reservation?.expiresAt,
      });
      toast.success(rtl ? "تم إنشاء الحجز وتسجيل الدفعة الأولى بنجاح." : "Reservation created and initial payment recorded successfully.");
    } catch (err: any) {
      setPricingError(err.message || (rtl ? "تعذّر إنشاء الحجز." : "Failed to create the reservation."));
    } finally {
      setCreatingReservation(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputActive =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT";

      if (e.key === "F2") {
        e.preventDefault();
        const searchInput = document.querySelector('input[class*="ps-11"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      } else if (e.key === "F12") {
        e.preventDefault();
        if (cart.length > 0 && !isPosting) {
          completeSale();
        }
      } else if (e.key === "Escape") {
        if (!isInputActive) {
          e.preventDefault();
          setCart([]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, isPosting, customerId, discount, makingChargePerGram, stoneValue, method, notes, provisionalTotal, provisionalTax, activeBranch]);

  if (isErpLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("description")} />
        <LoadingState variant="skeleton" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-500/10 dark:text-emerald-300">
            ● {t("cashierOpen")} · {activeBranch}
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-panel/80 px-4 py-3 text-xs shadow-sm dark:border-slate-800">
        <div className="flex items-center gap-2 font-bold text-navy-950 dark:text-white">
          <span className="rounded-lg bg-brand-50 px-2 py-1 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">POS</span>
          <span>{rtl ? "فاتورة بيع جديدة" : "New sale invoice"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400">
          <span>{rtl ? "الفرع:" : "Branch:"} <strong className="text-foreground">{activeBranch}</strong></span>
          <span>{rtl ? "الكاشير:" : "Cashier:"} <strong className="text-foreground">{[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "—"}</strong></span>
        </div>
      </div>
      
      {completed && (
        <div className="flex items-center gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
          {t("completed", { id: completed })}
        </div>
      )}

      {pricingError && (
        <div className="flex items-center gap-3 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800 dark:border-rose-950/40 dark:bg-rose-950/10 dark:text-rose-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{pricingError}</span>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(180px,.22fr)_minmax(0,.54fr)_minmax(240px,.28fr)] xl:items-start" style={{ direction: "ltr" }}>
        <div dir={rtl ? "rtl" : "ltr"}>
        <Card className="overflow-hidden xl:sticky xl:top-5">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-black text-navy-950 dark:text-white">{t("customer")}</h2>
                <p className="text-[10px] text-slate-400">{rtl ? "بيانات العميل للفاتورة" : "Invoice customer"}</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <label className="mb-2 block text-xs font-bold">{t("customer")}</label>
            <select
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              className="input-base w-full bg-input text-foreground border-border"
            >
              {customers.filter(c => c.status !== "inactive").map((customer) => (
                <option key={customer.id} value={customer.id} className="bg-panel text-foreground">
                  {customer.name} · {customer.tier}
                </option>
              ))}
            </select>
            {selectedCustomer && (
              <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/50 p-3 text-xs dark:border-brand-500/20 dark:bg-brand-500/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="line-clamp-2 break-words font-black text-navy-950 dark:text-white">{selectedCustomer.name}</p>
                    <p className="mt-1 numeric-token truncate text-slate-600 dark:text-slate-300" dir="ltr">
                      {selectedCustomer.phone || "—"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-brand-700 dark:bg-slate-900 dark:text-brand-300">
                    {selectedCustomer.tier || "—"}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 min-h-8 text-[11px] leading-4 text-slate-600 dark:text-slate-300" title={selectedCustomerAddress || undefined}>
                  {selectedCustomerAddress || (rtl ? "العنوان غير مسجل" : "Address not registered")}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                  <span>{rtl ? "النقاط" : "Points"}: <b className="numeric-token text-slate-800 dark:text-slate-100" dir="ltr">{numericText(selectedCustomer.loyaltyPoints ?? 0)}</b></span>
                  <span>{rtl ? "الرصيد" : "Balance"}: <b className="numeric-token text-slate-800 dark:text-slate-100" dir="ltr">{money(selectedCustomer.balance ?? 0)}</b></span>
                </div>
              </div>
            )}
          </div>
        </Card>
        </div>

        <div className="min-w-0 space-y-3" dir={rtl ? "rtl" : "ltr"}>
        <Card className="overflow-visible">
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 pt-4 dark:border-slate-800">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              <Barcode className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-navy-950 dark:text-white">{rtl ? "بحث عن المنتج" : "Search for product"}</h2>
              <p className="text-[10px] text-slate-400">{rtl ? "استخدم البحث الحالي لاختيار صنف للفاتورة" : "Use the current search to choose an invoice item"}</p>
            </div>
          </div>
          <DataToolbar
            query={query}
            onQueryChange={(value) => {
              setQuery(value);
              setSearchOpen(true);
              setSearchHighlight(0);
            }}
            placeholder={rtl ? "ابحث بالـ ID أو الباركود أو اسم المنتج..." : "Search by ID, barcode, or product name..."}
            inputRef={searchInputRef}
            onInputFocus={() => setSearchOpen(true)}
            onInputKeyDown={handleSearchKeyDown}
            inputAriaExpanded={searchOpen}
            resultCount={searchOpen ? searchItems.length : undefined}
            resultLabel={filtersT("results")}
            resetLabel={filtersT("reset")}
            onReset={() => {
              setQuery("");
              setType("all");
              setSearchOpen(false);
              setSearchHighlight(0);
            }}
            filters={[
              {
                id: "type",
                label: inventoryT("type"),
                value: type,
                onChange: setType,
                options: [
                  { value: "all", label: filtersT("allTypes") },
                  ...Object.entries(typeLabels).map(([value, label]) => ({ value, label })),
                ],
              },
            ]}
          >
            <span className="hidden text-[10px] font-semibold text-slate-400 2xl:inline">F2</span>
          </DataToolbar>

          {searchOpen && searchItems.length ? (
            <div className="max-h-52 space-y-1 overflow-y-auto border-t border-slate-100 p-2 dark:border-slate-800">
              {searchItems.map((item, index) => {
                const selected = cart.some((ci) => ci.id === item.id);
                const unavailable = Boolean((item as any).unavailable);
                const priceUnavailable = unavailable || (!item.isProduct && (!Number.isFinite(item.price) || item.price <= 0));
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    disabled={priceUnavailable}
                    aria-disabled={priceUnavailable}
                    aria-current={searchHighlight === index ? "true" : undefined}
                    className={`relative flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-start transition ${
                      searchHighlight === index
                        ? "border-brand-500 bg-brand-50/70 ring-1 ring-brand-300 dark:bg-brand-500/10"
                        : selected
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                        : priceUnavailable
                          ? "cursor-not-allowed border-slate-200 opacity-60 dark:border-slate-800"
                          : "border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 dark:border-slate-800"
                    }`}
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold-50 text-gold-700 dark:bg-gold-500/10 dark:text-gold-300"><Gem className="h-4 w-4" /></div>
                    <span className="min-w-0 flex-1 truncate text-xs font-black text-navy-950 dark:text-white">{item.name}</span>
                    <span className="numeric-token hidden shrink-0 text-[10px] font-bold text-slate-400 sm:inline" dir="ltr">{item.code}</span>
                    <span className="hidden shrink-0 text-[10px] font-semibold text-slate-500 md:inline">
                      {unavailable
                        ? (rtl ? "غير متاح" : "Unavailable")
                        : item.isProduct
                          ? `${numericText(item.available)} ${rtl ? "متاح" : "available"}`
                          : `${numericText(item.grossWeight)} ${t("gram")} · ${numericText(item.karat)}K`}
                    </span>
                    <span className="numeric-token shrink-0 text-xs font-black text-brand-700 dark:text-brand-300" dir="ltr">{money(item.price)}</span>
                    {selected && <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-700" />}
                    {priceUnavailable && (
                      <span className="shrink-0 text-[10px] font-bold text-rose-600 dark:text-rose-300">
                        {unavailable
                          ? (rtl ? "غير متاح للبيع" : "Not for sale")
                          : (rtl ? "السعر غير متاح" : "Current selling price unavailable")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : searchOpen && searchLoading ? (
            <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800"><p className="text-xs font-semibold text-slate-500">{rtl ? "جاري البحث..." : "Searching..."}</p></div>
          ) : searchOpen && searchError ? (
            <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800"><p className="text-xs font-semibold text-rose-600">{searchError}</p></div>
          ) : searchOpen ? (
            <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800"><p className="text-xs font-semibold text-slate-500">{common("noResults")}</p></div>
          ) : null}
        </Card>

        <Card className="flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                <ListChecks className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-black text-navy-950 dark:text-white">{rtl ? "أصناف الفاتورة" : "Invoice items"}</h2>
                <p className="text-[10px] text-slate-400">
                  {t("pieces", { count: cart.reduce((sum, item) => sum + item.quantity, 0) })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { loadDrafts(); setShowDraftsModal(true); }}
                className="text-[11px] font-bold text-slate-500 transition hover:text-brand-600"
                type="button"
              >
                <FolderOpen className="me-1 inline h-3.5 w-3.5" />
                {t("resumeDraft")}
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                disabled={cart.length === 0}
                onClick={() => setShowSaveDraftModal(true)}
                className="text-[11px] font-bold text-emerald-600 transition hover:text-emerald-700 disabled:opacity-50"
                type="button"
              >
                <Save className="me-1 inline h-3.5 w-3.5" />
                {t("saveDraft")}
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button onClick={() => setCart([])} className="text-[11px] font-bold text-rose-600 transition hover:text-rose-700" type="button">
                {t("clear")}
              </button>
            </div>
          </div>

          <div className="max-h-[390px] min-h-[150px] overflow-y-auto p-3">
            {!cart.length && (
              <div className="grid min-h-[132px] place-items-center rounded-xl border border-dashed border-slate-200 text-center dark:border-slate-800">
                <div>
                  <ListChecks className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-xs font-bold text-slate-500">{t("empty")}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{t("emptySub")}</p>
                </div>
              </div>
            )}
            {!!cart.length && <div className="overflow-x-auto rounded-xl border border-slate-200 xl:overflow-x-visible dark:border-slate-800"><table className="w-full table-fixed text-xs"><colgroup><col style={{ width: "16%" }} /><col style={{ width: "22%" }} /><col style={{ width: "13%" }} /><col style={{ width: "8%" }} /><col style={{ width: "18%" }} /><col style={{ width: "18%" }} /><col style={{ width: "5%" }} /></colgroup><thead className="bg-slate-50 text-[10px] font-bold text-slate-500 dark:bg-slate-900/40"><tr><th className="px-2 py-2 text-start">{rtl ? "المنتج" : "Product"}</th><th className="px-2 py-2 text-start">{rtl ? "الباركود" : "Barcode"}</th><th className="px-2 py-2 text-start">{rtl ? "العيار / الوزن" : "Karat / Weight"}</th><th className="px-2 py-2 text-start">{rtl ? "الكمية" : "Qty"}</th><th className="px-2 py-2 text-end">{rtl ? "السعر" : "Price"}</th><th className="px-2 py-2 text-end">{rtl ? "الإجمالي" : "Total"}</th><th className="px-1 py-2" /></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{cart.map((item) => { const profile = item.rawItem?.inventoryProfile || item.rawItem?.profile || item.rawItem?.type; return <tr key={item.id} className="bg-panel"><td className="min-w-0 overflow-hidden px-2 py-2 font-bold"><div className="min-w-0 truncate" title={item.name}>{item.name}</div>{profile ? <div className="min-w-0 truncate text-[9px] font-semibold text-slate-400" title={String(profile)}>{String(profile).replaceAll("_", " ")}</div> : null}</td><td className="min-w-0 overflow-hidden px-2 py-2 text-[10px] text-slate-500"><bdi dir="ltr" className="numeric-token block min-w-0 truncate" title={item.code}>{item.code}</bdi></td><td className="min-w-0 overflow-hidden px-2 py-2 font-semibold"><div className="flex min-w-0 flex-col leading-tight"><bdi dir="ltr" className="numeric-token">{item.karat ? `${numericText(item.karat)}K` : "—"}</bdi><span className="min-w-0 truncate">{numericText(item.totalWeight)} {t("gram")}</span></div></td><td className="min-w-0 overflow-hidden px-2 py-2 font-semibold"><bdi dir="ltr" className="numeric-token">{numericText(item.quantity)}</bdi></td><td className="min-w-0 overflow-hidden px-2 py-2 text-end font-semibold"><bdi dir="ltr" className="numeric-token">{money(item.price)}</bdi></td><td className="min-w-0 overflow-hidden px-2 py-2 text-end font-black"><bdi dir="ltr" className="numeric-token">{money(item.price * item.quantity)}</bdi></td><td className="min-w-0 overflow-hidden px-1 py-2 text-end"><button onClick={() => removeFromCart(item.id)} className="text-rose-500" aria-label={rtl ? "حذف الصنف" : "Remove item"}><Trash2 className="h-4 w-4" /></button></td></tr>; })}</tbody><tfoot className="bg-brand-50/70 text-[11px] font-black dark:bg-brand-500/10"><tr><td colSpan={3} className="px-2 py-2">{rtl ? "ملخص الفاتورة" : "Invoice summary"}</td><td className="px-2 py-2"><bdi dir="ltr" className="numeric-token">{numericText(cart.reduce((sum, item) => sum + item.quantity, 0))}</bdi></td><td colSpan={2} className="px-2 py-2 text-end"><bdi dir="ltr" className="numeric-token">{money(provisionalTotal)}</bdi></td><td /></tr></tfoot></table></div>}
          </div>

        </Card>
        </div>

        <div dir={rtl ? "rtl" : "ltr"}>
        <Card className="flex min-h-0 flex-col overflow-hidden xl:sticky xl:top-5">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <label className="mb-2 flex items-center gap-2 text-xs font-bold">
              <CreditCard className="h-4 w-4 text-brand-600" />
              {rtl ? "الدفع والإجمالي" : "Payment & totals"}
            </label>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {paymentOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMethod(opt.value)}
                  className={`h-10 rounded-xl border text-[11px] font-bold ${
                    method === opt.value
                      ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                      : "border-slate-200 text-slate-500 dark:border-slate-700"
                  }`}
                  type="button"
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {method === "split" && (
              <div className="mb-4 rounded-2xl border border-slate-200 p-4 space-y-3 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">توزيع الدفع / Split Allocation</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">نقدي / Cash</label>
                    <NumericInput
                      value={splitCash}
                      onChange={(e) => setSplitCash(normalizeNumberInput(e.target.value))}
                      className="input-base text-xs py-1 h-8 bg-input text-foreground border-border"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">بطاقة / Card</label>
                    <NumericInput
                      value={splitCard}
                      onChange={(e) => setSplitCard(normalizeNumberInput(e.target.value))}
                      className="input-base text-xs py-1 h-8 bg-input text-foreground border-border"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">تحويل / Bank</label>
                    <NumericInput
                      value={splitTransfer}
                      onChange={(e) => setSplitTransfer(normalizeNumberInput(e.target.value))}
                      className="input-base text-xs py-1 h-8 bg-input text-foreground border-border"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="text-[11px] font-bold text-slate-500 flex justify-between">
                  <span>المجموع المدفوع:</span>
                  <span className={Math.abs((Number(splitCash)||0) + (Number(splitCard)||0) + (Number(splitTransfer)||0) - Number(provisionalTotal)) > 0.01 ? "text-rose-600 font-extrabold" : "text-emerald-600 font-extrabold"}>
                    {money((Number(splitCash)||0) + (Number(splitCard)||0) + (Number(splitTransfer)||0))} / {money(provisionalTotal)}
                  </span>
                </div>
              </div>
            )}

            {method === "installment" && (
              <div className="mb-4 rounded-2xl border border-slate-200 p-4 space-y-3 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">خطة التقسيط / Installment Plan</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400">الدفعة الأولى / Down Payment</label>
                    <NumericInput
                      value={downPayment}
                      onChange={(e) => setDownPayment(normalizeNumberInput(e.target.value))}
                      className="input-base text-xs py-1 h-8 bg-input text-foreground border-border"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">عدد الأقساط / Count</label>
                    <NumericInput
                      value={installmentCount}
                      onChange={(e) => setInstallmentCount(normalizeNumberInput(e.target.value))}
                      className="input-base text-xs py-1 h-8 bg-input text-foreground border-border"
                      placeholder="6"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">تكرار الدفع / Frequency</label>
                    <select
                      value={installmentFrequency}
                      onChange={(e) => setInstallmentFrequency(e.target.value)}
                      className="input-base text-xs py-1 h-8 bg-input text-foreground border-border"
                    >
                      <option value="monthly">شهري / Monthly</option>
                      <option value="weekly">أسبوعي / Weekly</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">تاريخ أول قسط / First Due Date</label>
                    <DateInput
                      value={firstDueDate}
                      onChange={setFirstDueDate}
                      className="input-base text-xs py-1 h-8 bg-input text-foreground border-border"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">اسم الضامن / Guarantor Name</label>
                    <input
                      type="text"
                      value={guarantorName}
                      onChange={(e) => setGuarantorName(e.target.value)}
                      className="input-base text-xs py-1 h-8 bg-input text-foreground border-border"
                      placeholder={rtl ? "اختياري" : "Optional"}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">هاتف الضامن / Guarantor Phone</label>
                    <input
                      type="text"
                      value={guarantorPhone}
                      onChange={(e) => setGuarantorPhone(e.target.value)}
                      className="input-base text-xs py-1 h-8 bg-input text-foreground border-border"
                      placeholder={rtl ? "اختياري" : "Optional"}
                    />
                  </div>
                </div>
                {Number(installmentCount) > 0 && (
                  <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-xl text-[11px] space-y-1 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span>المبلغ المتبقي للتقسيط:</span>
                      <strong>{money(Math.max(0, Number(provisionalTotal) - (Number(downPayment) || 0)))}</strong>
                    </div>
                    <div className="flex justify-between text-brand-600 dark:text-brand-400 font-bold">
                      <span>قيمة القسط التقريبية:</span>
                      <strong>
                        {money(Math.round(Math.max(0, Number(provisionalTotal) - (Number(downPayment) || 0)) / Number(installmentCount) * 100) / 100)} / القسط
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Price breakdown and notes inputs */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="mb-1 block text-[10px] font-bold text-slate-500">
                  {t("makingChargePerGram")}
                </label>
                <NumericInput
                  min="0"
                  value={makingChargePerGram}
                  onChange={(e) => setMakingChargePerGram(normalizeNumberInput(e.target.value))}
                  className="input-base text-xs py-1.5 h-8 bg-input text-foreground border-border"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold text-slate-500">
                  {t("stoneValue")}
                </label>
                <NumericInput
                  min="0"
                  value={stoneValue}
                  onChange={(e) => setStoneValue(normalizeNumberInput(e.target.value))}
                  className="input-base text-xs py-1.5 h-8 bg-input text-foreground border-border"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold text-slate-500">
                  {t("discount")}
                </label>
                <NumericInput
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(normalizeNumberInput(e.target.value))}
                  className="input-base text-xs py-1.5 h-8 bg-input text-rose-600 dark:text-rose-400 font-bold border-border"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold text-slate-500">
                  {t("notes")}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-base text-xs py-1.5 h-8 bg-input text-foreground border-border"
                  placeholder={t("notesPlaceholder")}
                />
              </div>
            </div>

            <div className="space-y-2 border-t border-dashed border-slate-200 pt-4 text-xs dark:border-slate-700">
              <div className="flex justify-between text-slate-500">
                <span>{t("subtotal")} ({t("pieces", { count: cart.reduce((sum, item) => sum + item.quantity, 0) })})</span>
                <span>{money(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))}</span>
              </div>
              {Number(provisionalMakingCharge) > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>{t("totalMakingCharge")}</span>
                  <span>+{money(Number(provisionalMakingCharge))}</span>
                </div>
              )}
              {Number(stoneValue) > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>{t("stoneValue")}</span>
                  <span>+{money(Number(stoneValue))}</span>
                </div>
              )}
              {Number(discount) > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>{t("discount")}</span>
                  <span>-{money(Number(discount))}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>{t("vatAmount")}{settings?.vatRate ? ` (${Number(settings.vatRate)}%)` : ""}</span>
                <span>{money(provisionalTax)}</span>
              </div>
              <div className="flex justify-between pt-2 text-lg font-black">
                <span>{t("total")}</span>
                <span className="text-brand-700 dark:text-brand-300">{money(provisionalTotal)}</span>
              </div>
            </div>

            {cart.length > 0 && (
              <div className="mt-4 border-t border-dashed border-slate-200 pt-3 dark:border-slate-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-500">{t("doubleEntryPreview")}</span>
                  <button
                    type="button"
                    onClick={() => setShowJournal(!showJournal)}
                    className="text-xs font-black text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    {showJournal ? t("hideJournal") : t("showJournal")}
                  </button>
                </div>
                {showJournal && (
                  <div className="mt-2 text-start">
                    <JournalPreview
                      total={Number(provisionalTotal)}
                      tax={Number(provisionalTax)}
                      cost={provisionalCost}
                      paymentMethod={method}
                      currency={currency}
                      locale={locale}
                    />
                  </div>
                )}
              </div>
            )}

            {settingsNotReady && (
              <div className={`mt-4 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${settingsError ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300"}`}>
                {settingsError ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />}
                <span>
                  {settingsError
                    ? (rtl ? "تعذّر تحميل إعدادات النظام (الضريبة/العملة). إتمام البيع متوقف." : "Failed to load system settings (VAT/currency). Checkout is blocked.")
                    : (rtl ? "جارٍ تحميل إعدادات النظام..." : "Loading system settings...")}
                </span>
              </div>
            )}

            {activeDraftId && isApiMode ? (
              <div className="mt-5 space-y-2">
                <div className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700 dark:border-brand-900/40 dark:bg-brand-950/30 dark:text-brand-300">
                  {rtl ? `تعدّل المسودة: ${activeDraftId}` : `Editing draft: ${activeDraftId}`}
                </div>
                <Button onClick={handlePostDraft} disabled={!cart.length || draftBusy || settingsNotReady} className="w-full">
                  {draftBusy ? <RefreshCw className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                  {t("postDraft")}
                </Button>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="secondary" onClick={handleUpdateDraft} disabled={!cart.length || draftBusy}>{t("updateDraft")}</Button>
                  <Button variant="secondary" className="text-rose-600 hover:text-rose-700" onClick={() => handleDeleteDraft(activeDraftId)} disabled={draftBusy}>{t("cancelDraft")}</Button>
                  <Button variant="secondary" onClick={handleExitDraft} disabled={draftBusy}>{t("exitDraft")}</Button>
                </div>
              </div>
            ) : (
              <>
                {method === "deposit" && !reservationAccountConfigured && (
                  <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                    <p>{rtl ? "لا يمكن تسجيل حجز بعربون قبل تشغيل إعداد حساب الفرع التلقائي." : "A reservation deposit cannot be recorded until automatic branch setup is complete."}</p>
                    {canConfigureSettings ? (
                      <Link href="/settings" className="mt-1 inline-block underline">{rtl ? "فتح حالة الفرع" : "Open branch status"}</Link>
                    ) : (
                      <p className="mt-1">{rtl ? "يرجى التواصل مع مسؤول معتمد." : "Please contact an authorized administrator."}</p>
                    )}
                  </div>
                )}
                <Button
                  onClick={completeSale}
                  disabled={!cart.length || isPosting || settingsNotReady || (method === "deposit" && !reservationAccountConfigured)}
                  className="mt-5 w-full"
                >
                  {isPosting ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5" />
                  )}
                  {method === "deposit" ? (rtl ? "إنشاء الحجز وتسجيل الدفعة الأولى" : "Create Reservation and Record Initial Payment") : t("complete")}
                </Button>
              </>
            )}
            {draftMessage && (
              <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                {draftMessage}
              </div>
            )}
          </div>
        </Card>
        </div>
      </div>

      {/* Phase 19Y.3 — POS post-checkout print dialog: template selector + live
          preview, Thermal by default. Opens only after postInvoice succeeded and
          completedInvoice is set; print/close never re-submit or mutate the order. */}
      {completedInvoice && (
        <InvoicePrintOptionsDialog
          open={!!completedInvoice}
          invoice={completedInvoice}
          locale={locale}
          initialOptions={posPrintInitialOptions}
          onClose={() => setCompletedInvoice(null)}
          onPrint={printInvoice}
          showPreview
          previewCompany={printCompany}
          previewSettings={settings}
          previewLabels={printLabels}
        />
      )}

      {/* Phase 32.6-Post-C — POS reservation deposit dialog */}
      <Modal
        open={showReservationDialog}
        onClose={() => setShowReservationDialog(false)}
        title={rtl ? "إنشاء حجز بعربون" : "Create Reservation Deposit"}
        description={rtl ? "احجز القطع للعميل وسجّل الدفعة الأولى" : "Reserve the invoice items for the customer and record the initial payment"}
      >
        <div className="space-y-4 text-sm">
          <p className="text-xs text-muted">{rtl ? "الإجماليات والقيود المحاسبية تُحتسب على الخادم. لا يتم إنشاء فاتورة بيع." : "Totals and journals are computed on the server. No sales invoice is created."}</p>
          <div className="rounded-2xl border border-border p-3 text-xs space-y-1">
            <p>{rtl ? "العميل" : "Customer"}: <strong>{customers.find((c) => c.id === customerId)?.name || "—"}</strong></p>
            <p>{rtl ? "عدد القطع" : "Items"}: <strong>{cart.length}</strong></p>
            <p>{rtl ? "إجمالي الحجز" : "Reservation total"}: <strong>{money(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))}</strong></p>
            <p>{rtl ? "المتبقي بعد الدفعة" : "Remaining after payment"}: <strong>{money(Math.max(0, cart.reduce((sum, item) => sum + item.price * item.quantity, 0) - (Number(toEnglishDigits(resInitialPayment)) || 0)))}</strong></p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="label-base">{rtl ? "الدفعة الأولى (إلزامية)" : "Initial payment (required)"}</span>
              <NumericInput className="input-base mt-1" placeholder="0" value={resInitialPayment} onChange={(e) => setResInitialPayment(normalizeNumberInput(e.target.value))} />
            </label>
            <label className="block">
              <span className="label-base">{rtl ? "طريقة الدفع" : "Payment method"}</span>
              <select className="input-base mt-1" value={resMethod} onChange={(e) => setResMethod(e.target.value)}>
                <option value="cash">{rtl ? "نقدي" : "Cash"}</option>
                <option value="card">{rtl ? "بطاقة" : "Card"}</option>
                <option value="transfer">{rtl ? "تحويل" : "Transfer"}</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="label-base">{rtl ? "تاريخ ووقت انتهاء الحجز" : "Reservation expiry (date & time)"}</span>
            <DateTimeInput className="input-base mt-1" value={resExpiry} onChange={setResExpiry} />
          </label>
          <label className="block">
            <span className="label-base">{rtl ? "ملاحظات" : "Notes"}</span>
            <input className="input-base mt-1" value={resNotes} onChange={(e) => setResNotes(e.target.value)} />
          </label>
          {!reservationAccountConfigured && (
            <p className="text-xs font-bold text-amber-600">{rtl ? "حساب دفعات الفرع غير مهيأ." : "The automatic branch deposit account is not configured."}</p>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setShowReservationDialog(false)}>{common("cancel")}</Button>
            <Button type="button" disabled={creatingReservation || !reservationAccountConfigured} onClick={createReservationFromPos}>
              {creatingReservation ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
              {rtl ? "إنشاء الحجز وتسجيل الدفعة الأولى" : "Create Reservation and Record Initial Payment"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Phase 32.6-Post-C — reservation success summary */}
      <Modal
        open={Boolean(createdReservation)}
        onClose={() => setCreatedReservation(null)}
        title={rtl ? "تم إنشاء الحجز" : "Reservation Created"}
        description={createdReservation?.id || ""}
      >
        {createdReservation && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span className="font-bold">{rtl ? "تم إنشاء الحجز وتسجيل الدفعة الأولى بنجاح." : "Reservation created and initial payment recorded successfully."}</span>
            </div>
            <div className="rounded-2xl border border-border p-3 text-xs space-y-1">
              <p>{rtl ? "رقم الحجز" : "Reservation"}: <strong>{createdReservation.id}</strong></p>
              <p>{rtl ? "الإجمالي" : "Total"}: <strong>{money(createdReservation.agreedTotal ?? 0)}</strong></p>
              <p>{rtl ? "المدفوع" : "Paid"}: <strong>{money(createdReservation.paidTotal ?? 0)}</strong></p>
              <p>{rtl ? "المتبقي" : "Remaining"}: <strong>{money(createdReservation.remainingTotal ?? 0)}</strong></p>
              <p>{rtl ? "تاريخ الانتهاء" : "Expiry"}: <strong>{formatDateTime(createdReservation.expiresAt, "Asia/Dubai", locale)}</strong></p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Link href="/sales/reservations" className="inline-flex items-center rounded-2xl bg-brand-600 px-4 py-2 text-xs font-bold text-white">{rtl ? "فتح إدارة الحجوزات" : "Open Reservations"}</Link>
              <Button type="button" variant="secondary" onClick={() => setCreatedReservation(null)}>{rtl ? "إغلاق" : "Close"}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Save Draft Modal */}
      <Modal
        open={showSaveDraftModal}
        onClose={() => setShowSaveDraftModal(false)}
        title={t("saveDraft")}
        description=""
      >
        <form onSubmit={handleSaveDraft} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">
              {rtl ? "اسم المسودة" : "Draft Name"}
            </label>
            <input
              type="text"
              required
              className="input-base bg-input text-foreground border-border"
              placeholder={rtl ? "مثال: فاتورة العميل أحمد..." : "e.g., Invoice for client Ahmed..."}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setShowSaveDraftModal(false)}>
              {common("cancel")}
            </Button>
            <Button type="submit">
              {t("saveDraft")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Resume Draft Modal */}
      <Modal
        open={showDraftsModal}
        onClose={() => setShowDraftsModal(false)}
        title={t("draftsTitle")}
        description={t("draftsDesc")}
      >
        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
          {drafts.length === 0 ? (
            <p className="text-xs text-muted text-center py-6">{t("noDrafts")}</p>
          ) : (
            drafts.map((draft) => {
              const itemCount = isApiMode ? (draft.items || []).length : (draft.cart?.length || 0);
              const title = isApiMode ? (draft.customerName || draft.id) : draft.name;
              const subtitle = isApiMode
                ? `${draft.id} · ${toEnglishDigits(draft.date || "")} · ${money(Number(draft.total) || 0)}`
                : draft.timestamp;
              return (
                <div
                  key={draft.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface-muted/30 hover:bg-surface-muted/60 transition text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-900 dark:text-white">{title}</p>
                    <p className="text-[10px] text-muted">
                      {subtitle} · {itemCount} {t("pieces", { count: itemCount })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleLoadDraft(draft)}>
                      {t("load")}
                    </Button>
                    <Button size="sm" variant="secondary" className="text-rose-600 hover:text-rose-700" onClick={() => handleDeleteDraft(draft.id)}>
                      {isApiMode ? t("cancelDraft") : t("delete")}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* Cancel Draft (reason required) Modal */}
      <Modal
        open={!!cancelDraftTarget}
        onClose={() => { setCancelDraftTarget(null); setCancelReason(""); }}
        title={t("cancelDraft")}
        description={t("cancelDraftDesc")}
      >
        <form onSubmit={confirmCancelDraft} className="space-y-4">
          <div>
            <label className="label-base">{t("cancelReason")}</label>
            <input
              className="input-base w-full"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t("cancelReason")}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => { setCancelDraftTarget(null); setCancelReason(""); }}>
              {common("cancel")}
            </Button>
            <Button type="submit" className="text-rose-600" disabled={!cancelReason.trim() || draftBusy}>
              {t("cancelDraft")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Product Quantity Selector Modal */}
      {selectedProductForQty && (
        <Modal
          open={!!selectedProductForQty}
          onClose={() => setSelectedProductForQty(null)}
          title={rtl ? "تحديد الكمية" : "Select Quantity"}
          description={selectedProductForQty.productName}
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 mb-2">
                {rtl ? `الكمية المتاحة: ${selectedProductForQty.quantityAvailable} قطعة` : `Available stock: ${selectedProductForQty.quantityAvailable} units`}
              </p>
              <label className="block text-xs font-bold text-slate-500 mb-2">
                {rtl ? "الكمية المطلوبة للبيع" : "Quantity to Sell"}
              </label>
              <NumericInput
                min="1"
                max={selectedProductForQty.quantityAvailable}
                className="input-base bg-input text-foreground border-border font-extrabold text-lg text-center"
                value={inputQuantity}
                onChange={(e) => {
                  setInputQuantity(normalizeNumberInput(e.target.value));
                  setQtyError(null);
                }}
              />
              {qtyError && (
                <p className="text-xs font-bold text-rose-500 mt-1">{qtyError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button type="button" variant="secondary" onClick={() => setSelectedProductForQty(null)}>
                {common("cancel")}
              </Button>
              <Button type="button" onClick={handleAddProductToCart}>
                {rtl ? "إضافة إلى الفاتورة" : "Add to invoice"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
