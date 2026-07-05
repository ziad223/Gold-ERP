"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Barcode, CheckCircle2, CreditCard, Gem, ShoppingCart, Trash2, UserRound, RefreshCw, AlertTriangle, Printer, FolderOpen, Save } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/contexts/auth-context";
import { usePos } from "@/features/sales/hooks/use-pos";
import { useAppSettings } from "@/contexts/settings-context";
import { generateUUID } from "@/lib/api/client";
import { filterData } from "@/hooks/use-data-filters";
import type { Asset, AssetType, Invoice, Product } from "@/lib/types";
import { useCoreErpData } from "@/hooks/use-core-erp-data";
import { formatCurrency } from "@/lib/utils";
import { toEnglishDigits } from "@/lib/formatters/numbers";
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
  const isApi = (process.env.NEXT_PUBLIC_DATA_SOURCE || "mock") === "api";

  // In API mode we must NOT price/checkout against fallback settings (e.g. VAT=5)
  // before the real company settings have loaded. Block until confirmed loaded.
  const settingsNotReady = isApi && (!settingsLoaded || settingsError || settingsLoading);

  // Custom API hooks
  const { products, assets, isLoading: isErpLoading } = useCoreErpData();
  const {
    customers, calculatePricing, postInvoice, isPosting,
    isApiMode, createDraftInvoice, updateDraftInvoice, cancelDraftInvoice, postDraftInvoice, fetchDraftInvoices,
  } = usePos();

  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
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
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [showJournal, setShowJournal] = useState(false);
  const lastPricingPayloadKeyRef = useRef<string | null>(null);

  // New Pricing Fields
  const [discount, setDiscount] = useState("0");
  const [makingCharge, setMakingCharge] = useState("0");
  const [stoneValue, setStoneValue] = useState("0");
  const [notes, setNotes] = useState("");

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
    makingCharge: Number(makingCharge) || 0,
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
      stoneValue: item.stoneValue,
    })),
  });

  const clearCartAndCharges = () => {
    setCart([]);
    setDiscount("0");
    setMakingCharge("0");
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
    const nameToUse = draftName.trim() || `Draft - ${toEnglishDigits(new Date().toLocaleTimeString(locale === "ar" ? "ar-EG-u-nu-latn" : locale, { numberingSystem: "latn" }))}`;
    const newDraft = {
      id: `draft-${Date.now()}`, name: nameToUse, customerId, cart, discount, makingCharge, stoneValue, notes, method,
      timestamp: toEnglishDigits(new Date().toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : locale, { numberingSystem: "latn" })),
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
      setMakingCharge(String(draft.makingCharge ?? "0"));
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
    setMakingCharge(draft.makingCharge || "0");
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
      setPricingError(null);
      return;
    }

    const discNum = Number(discount) || 0;
    const mcNum = Number(makingCharge) || 0;
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
      makingCharge: mcNum,
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
        setPricingError(null);
      })
      .catch((err) => {
        setPricingError(err.message || "Failed to retrieve pricing preview.");
      });
  }, [cart, customerId, discount, makingCharge, stoneValue, calculatePricing]);

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
        price: a.price,
        available: 1,
        sold: 0,
        rawItem: a
      });
    }
    
    return list;
  }, [activeBranchProducts, activeBranchAssets]);

  const filtered = useMemo(
    () => filterData(
      posItems,
      query,
      [(item) => item.name, (item) => item.id, (item) => item.code, (item) => item.type],
      [(item) => type === "all" || item.type === type]
    ),
    [posItems, query, type],
  );

  const currency = company?.currency ?? "AED";
  const money = (value: number | string) => formatCurrency(Number(value), currency, locale);
  
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
          cost: selectedProductForQty.unitCost,
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
  };

  const handleItemClick = (item: PosItem) => {
    setCompleted(null);
    if (item.isProduct) {
      openQtySelector(item.rawItem);
    } else {
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
              price: asset.price,
              totalWeight: asset.grossWeight,
              cost: asset.cost,
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
      setPricingError(rtl ? "السلة فارغة!" : "Cart is empty!");
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
        const hasZeroDownPermission = user?.permissions?.includes("pos.installment.zeroDownPayment") || user?.role === "admin" || user?.role === "owner";
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
        makingCharge: Number(makingCharge) || 0,
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
      setMakingCharge("0");
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
  }, [cart, isPosting, customerId, discount, makingCharge, stoneValue, method, notes, provisionalTotal, provisionalTax, activeBranch]);

  if (isErpLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("description")} />
        <LoadingState variant="skeleton" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-500/10 dark:text-emerald-300">
            ● {t("cashierOpen")} · {activeBranch}
          </div>
        }
      />
      
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

      <div className="grid gap-5 xl:grid-cols-[1.35fr_.85fr]">
        <Card className="overflow-hidden">
          <DataToolbar
            query={query}
            onQueryChange={setQuery}
            placeholder={t("search")}
            resultCount={filtered.length}
            resultLabel={filtersT("results")}
            resetLabel={filtersT("reset")}
            onReset={() => {
              setQuery("");
              setType("all");
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
            <div className="hidden h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 xl:grid dark:bg-brand-500/10 dark:text-brand-300">
              <Barcode className="h-5 w-5" />
            </div>
          </DataToolbar>

          {filtered.length ? (
            <div className="grid gap-3 p-5 md:grid-cols-2 2xl:grid-cols-3">
              {filtered.map((item) => {
                const selected = cart.some((ci) => ci.id === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`relative rounded-3xl border p-4 text-start transition ${
                      selected
                        ? "border-brand-500 bg-brand-50 ring-4 ring-brand-100 dark:bg-brand-500/10 dark:ring-brand-950"
                        : "border-slate-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-panel dark:border-slate-800"
                    }`}
                  >
                    {selected && (
                      <span className="absolute end-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-brand-700 text-white">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    )}
                    <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-gold-50 to-gold-100 text-gold-700 dark:from-gold-500/10 dark:to-gold-500/5 dark:text-gold-300">
                      <Gem className="h-7 w-7" />
                    </div>
                    <p className="text-sm font-black text-navy-950 dark:text-white">{item.name}</p>
                    <p className="mt-1 text-[10px] font-bold text-slate-400">{item.code}</p>
                    
                    {item.isProduct && (
                      <div className="mt-2 text-[10px] text-slate-500 flex gap-2 font-semibold">
                        <span>{rtl ? "المتاح:" : "Available:"} {item.available}</span>
                        <span>{rtl ? "المباع:" : "Sold:"} {item.sold}</span>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] text-slate-400">{t("weight")}</p>
                        <p className="text-xs font-bold">
                          {item.isProduct 
                            ? `${item.grossWeight} ${t("gram")}`
                            : `${item.grossWeight} ${t("gram")} · ${item.karat}K`
                          }
                        </p>
                      </div>
                      <p className="text-sm font-black text-brand-700 dark:text-brand-300">
                        {money(item.price)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState title={common("noResults")} description={common("noResultsDescription")} />
          )}
        </Card>

        <Card className="flex min-h-[650px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-black text-navy-950 dark:text-white">{t("currentInvoice")}</h2>
                <p className="text-[10px] text-slate-400">
                  {t("pieces", { count: cart.reduce((sum, item) => sum + item.quantity, 0) })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { loadDrafts(); setShowDraftsModal(true); }}
                className="text-xs font-bold text-slate-500 hover:text-brand-600 transition flex items-center gap-1"
                type="button"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                {t("resumeDraft")}
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                disabled={cart.length === 0}
                onClick={() => setShowSaveDraftModal(true)}
                className="text-xs font-bold text-emerald-600 disabled:opacity-50 hover:text-emerald-700 transition flex items-center gap-1"
                type="button"
              >
                <Save className="h-3.5 w-3.5" />
                {t("saveDraft")}
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button onClick={() => setCart([])} className="text-xs font-bold text-rose-600 hover:text-rose-700 transition" type="button">
                {t("clear")}
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {!cart.length && (
              <div className="grid h-64 place-items-center text-center">
                <div>
                  <ShoppingCart className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-bold text-slate-500">{t("empty")}</p>
                  <p className="mt-1 text-xs text-slate-400">{t("emptySub")}</p>
                </div>
              </div>
            )}
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-800"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold-50 text-gold-700 dark:bg-gold-500/10 dark:text-gold-300">
                  <Gem className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">
                    {item.isProduct ? `(${item.quantity}x) ` : ""}{item.name}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {item.isProduct 
                      ? `${item.totalWeight} ${t("gram")}`
                      : `${item.totalWeight} ${t("gram")} · ${item.karat}K`
                    }
                  </p>
                </div>
                <p className="text-xs font-black">{money(item.price * item.quantity)}</p>
                <button onClick={() => removeFromCart(item.id)} className="text-rose-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 p-5 dark:border-slate-800">
            <label className="mb-2 flex items-center gap-2 text-xs font-bold">
              <UserRound className="h-4 w-4 text-brand-600" />
              {t("customer")}
            </label>
            <select
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              className="input-base mb-4 bg-input text-foreground border-border"
            >
              {customers.filter(c => c.status !== "inactive").map((customer) => (
                <option key={customer.id} value={customer.id} className="bg-panel text-foreground">
                  {customer.name} · {customer.tier}
                </option>
              ))}
            </select>
            
            <label className="mb-2 flex items-center gap-2 text-xs font-bold">
              <CreditCard className="h-4 w-4 text-brand-600" />
              {t("paymentMethod")}
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
                    <input
                      type="number"
                      value={splitCash}
                      onChange={(e) => setSplitCash(e.target.value)}
                      className="input-base text-xs py-1 h-8 bg-input text-foreground border-border"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">بطاقة / Card</label>
                    <input
                      type="number"
                      value={splitCard}
                      onChange={(e) => setSplitCard(e.target.value)}
                      className="input-base text-xs py-1 h-8 bg-input text-foreground border-border"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">تحويل / Bank</label>
                    <input
                      type="number"
                      value={splitTransfer}
                      onChange={(e) => setSplitTransfer(e.target.value)}
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
                    <input
                      type="number"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      className="input-base text-xs py-1 h-8 bg-input text-foreground border-border"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">عدد الأقساط / Count</label>
                    <input
                      type="number"
                      value={installmentCount}
                      onChange={(e) => setInstallmentCount(e.target.value)}
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
                    <input
                      type="date"
                      value={firstDueDate}
                      onChange={(e) => setFirstDueDate(e.target.value)}
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
                  {t("makingCharge")}
                </label>
                <input
                  type="number"
                  min="0"
                  value={makingCharge}
                  onChange={(e) => setMakingCharge(e.target.value)}
                  className="input-base text-xs py-1.5 h-8 bg-input text-foreground border-border"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold text-slate-500">
                  {t("stoneValue")}
                </label>
                <input
                  type="number"
                  min="0"
                  value={stoneValue}
                  onChange={(e) => setStoneValue(e.target.value)}
                  className="input-base text-xs py-1.5 h-8 bg-input text-foreground border-border"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold text-slate-500">
                  {t("discount")}
                </label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
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
              {Number(makingCharge) > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>{t("makingCharge")}</span>
                  <span>+{money(Number(makingCharge))}</span>
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
              <Button onClick={completeSale} disabled={!cart.length || isPosting || settingsNotReady} className="mt-5 w-full">
                {isPosting ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                {t("complete")}
              </Button>
            )}
            {draftMessage && (
              <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                {draftMessage}
              </div>
            )}
          </div>
        </Card>
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
              <input
                type="number"
                min="1"
                max={selectedProductForQty.quantityAvailable}
                className="input-base bg-input text-foreground border-border font-extrabold text-lg text-center"
                value={inputQuantity}
                onChange={(e) => {
                  setInputQuantity(e.target.value);
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
                {rtl ? "إضافة إلى السلة" : "Add to Cart"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
