"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, ArrowRight, Truck, Plus, CheckCircle2, AlertCircle, ShoppingCart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { invalidateAffectedQueries } from "@/lib/realtime/invalidate-affected-queries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { DateInput } from "@/components/ui/date-input";
import { NativeSelect } from "@/components/ui/native-select";
import { ReverseChargeChecklist } from "@/features/tax/components/ReverseChargeChecklist";
import { useAuth } from "@/contexts/auth-context";
import { useAssets } from "@/features/assets/hooks/use-assets";
import { useSuppliers } from "@/hooks/use-suppliers";
import { Link } from "@/i18n/navigation";
import { apiClient, generateUUID } from "@/lib/api/client";
import { DATA_SOURCE } from "@/lib/data-source";
import { formatCurrency } from "@/lib/utils";
import type { Supplier, Asset, AssetType, Product } from "@/lib/types";
import { normalizeNumberInput, toEnglishDigits } from "@/lib/formatters/numbers";
import { getBranchCurrentDate } from "@/lib/dates/dates";
import { useBarcodeSettings } from "@/features/settings/hooks/use-barcode-settings";

type ReceivePieceDraft = {
  description: string;
  grossWeight: string;
  stoneWeight: string;
  purchaseCost: string;
  purchaseGoldRate: string;
  purchaseRateReference: string;
  purchaseRateReferenceKarat: string;
  purchaseRateOverridden: boolean;
  purchaseRateOverrideReason: string;
  makingPerGram: string;
  currentGoldRate: string;
  currentMakingPerGram: string;
  certificateCost: string;
  currentCertificateCost: string;
  valuationVatRate: string;
  currentValuationVatRate: string;
  additionalCost: string;
  currentValue: string;
  currentVatRate: string;
  markupPercent: string;
  maximumDiscountPercent: string;
  minimumSellingPrice: string;
  sellingPrice: string;
  condition: string;
  goldColor: string;
  brand: string;
  model: string;
  modelNumber: string;
  supplierReference: string;
  locationId: string;
  certificateIssuer: string;
  certificateNumber: string;
  certificateIssueDate: string;
  certificateUrl: string;
  attachment: File | null;
  masterData: Record<string, string>;
  components?: any[];
  stoneName: string; diamondType: string; carat: string; color: string; clarity: string; cut: string; shape: string; treatment: string; tone: string; toneLevel: string; saturation: string; opticalEffect: string; origin: string;
  totalPearlWeight: string; pearlSize: string; pearlType: string; overtone: string; orient: string; luster: string; surfaceQuality: string; nacreQuality: string; looseNotes: string;
};

type InventoryProfileContract = {
  key: string;
  assetType: AssetType;
  family: string;
  required: string[];
  optional: string[];
  condition: "REQUIRED" | "OPTIONAL" | "NOT_APPLICABLE";
  weightApplicable: boolean;
  certificateSupported: boolean;
  rfidAllowed: boolean;
  locationOptional: boolean;
  goldValuation?: {
    enabled: boolean;
    purchaseGoldRateRequired?: boolean;
    currentGoldRateRequired?: boolean;
    makingPerGramSupported?: boolean;
    certificateCostsSupported?: boolean;
    certificateOnlyVat?: boolean;
  };
  looseDetails?: {
    kind: "DIAMOND" | "GEMSTONE" | "PEARL";
    required?: string[];
    measurement?: { unit: string; inputPrecision: number; displayPrecision: number; commercialRounding: string; excessPrecision: string };
    pearlSize?: { unit: string; authority: string; freeTextForNewRecords: boolean; automaticRounding: string };
  } | null;
};

type PearlSizeMasterValue = { id: string; value: string; displayValue: string; label: string; unit: "MM"; isActive: boolean };
type ProfileMasterDataValue = { id: string; category: string; value: string; label: string; isActive: boolean };

const emptyPieceDraft = (): ReceivePieceDraft => ({
  description: "", grossWeight: "", stoneWeight: "0", purchaseCost: "", purchaseGoldRate: "", purchaseRateReference: "", purchaseRateReferenceKarat: "", purchaseRateOverridden: false, purchaseRateOverrideReason: "", makingPerGram: "0", currentGoldRate: "", currentMakingPerGram: "", certificateCost: "0", currentCertificateCost: "", valuationVatRate: "", currentValuationVatRate: "", additionalCost: "0", currentValue: "", currentVatRate: "", markupPercent: "", maximumDiscountPercent: "", minimumSellingPrice: "", sellingPrice: "", condition: "",
  goldColor: "", brand: "", model: "", modelNumber: "", supplierReference: "", locationId: "",
  certificateIssuer: "", certificateNumber: "", certificateIssueDate: "", certificateUrl: "", attachment: null,
  stoneName: "", diamondType: "", carat: "", color: "", clarity: "", cut: "", shape: "", treatment: "", tone: "", toneLevel: "", saturation: "", opticalEffect: "", origin: "", totalPearlWeight: "", pearlSize: "", pearlType: "", overtone: "", orient: "", luster: "", surfaceQuality: "", nacreQuality: "", looseNotes: "", masterData: {},
});

// Labels and order are presentation-only. The server profile contract supplies
// the selectable keys, asset type, requiredness, and all business semantics.
const PROFILE_PRESENTATION: Record<string, { label: string; labelAr: string }> = {
  GOLD_BY_WEIGHT_JEWELLERY: { label: "Gold By Weight Jewellery", labelAr: "مجوهرات ذهب بالوزن" },
  GOLD_BAR_24K: { label: "Gold By Weight 24K / Gold Bar", labelAr: "ذهب 24 / سبيكة" },
  GOLD_BY_PIECE: { label: "Gold By Piece", labelAr: "ذهب بالقطعة" },
  DIAMOND_JEWELLERY: { label: "Diamond Jewellery", labelAr: "مجوهرات ألماس" },
  LOOSE_DIAMOND: { label: "Loose Diamond", labelAr: "ألماس سائب" },
  GEMSTONE_JEWELLERY: { label: "Gemstone Jewellery", labelAr: "مجوهرات أحجار كريمة" },
  LOOSE_GEMSTONE: { label: "Loose Gemstone", labelAr: "أحجار كريمة سائبة" },
  PEARL_JEWELLERY: { label: "Pearl Jewellery", labelAr: "مجوهرات لؤلؤ" },
  LOOSE_PEARL: { label: "Loose Pearl", labelAr: "لؤلؤ سائب" },
  CGP_CUSTOMER_GOLD_PURCHASE: { label: "CGP — Customer Gold Purchase", labelAr: "شراء ذهب العميل CGP" },
};

// Presentation only: category ownership, allowed values and validation come
// from the server-owned Profile Master Data registry.
const LOOSE_MASTER_FIELDS: Record<string, Array<{ field: string; category: string; label: string; labelAr: string; required?: boolean }>> = {
  LOOSE_GEMSTONE: [
    { field: "stoneName", category: "GEMSTONE_NAME", label: "Stone name", labelAr: "اسم الحجر", required: true },
    { field: "stoneType", category: "GEMSTONE_TYPE", label: "Stone type", labelAr: "نوع الحجر" },
    { field: "treatment", category: "GEMSTONE_TREATMENT", label: "Treatment", labelAr: "المعالجة" },
    { field: "shape", category: "GEMSTONE_SHAPE", label: "Shape", labelAr: "الشكل" }, { field: "color", category: "GEMSTONE_COLOR", label: "Color", labelAr: "اللون" },
    { field: "tone", category: "GEMSTONE_TONE", label: "Tone", labelAr: "طابع اللون" }, { field: "toneLevel", category: "GEMSTONE_TONE_LEVEL", label: "Tone level", labelAr: "درجة اللون" },
    { field: "saturation", category: "GEMSTONE_SATURATION", label: "Saturation", labelAr: "التشبع" }, { field: "opticalEffect", category: "GEMSTONE_OPTICAL_EFFECT", label: "Optical effect", labelAr: "التأثير البصري" },
    { field: "origin", category: "GEMSTONE_ORIGIN", label: "Origin", labelAr: "المنشأ" }, { field: "certificateAuthority", category: "CERTIFICATE_AUTHORITY", label: "Certificate authority", labelAr: "جهة الشهادة" },
  ],
  LOOSE_PEARL: [
    { field: "pearlType", category: "PEARL_TYPE", label: "Pearl type", labelAr: "نوع اللؤلؤ" }, { field: "pearlColor", category: "PEARL_COLOR", label: "Pearl color", labelAr: "لون اللؤلؤ" },
    { field: "overtone", category: "PEARL_OVERTONE", label: "Overtone", labelAr: "اللون الثانوي" }, { field: "orient", category: "PEARL_ORIENT", label: "Orient", labelAr: "البريق القزحي" },
    { field: "pearlShape", category: "PEARL_SHAPE", label: "Pearl shape", labelAr: "شكل اللؤلؤ" }, { field: "luster", category: "PEARL_LUSTER", label: "Luster", labelAr: "اللمعان" },
    { field: "surfaceQuality", category: "PEARL_SURFACE_QUALITY", label: "Surface quality", labelAr: "جودة السطح" }, { field: "nacreQuality", category: "PEARL_NACRE_QUALITY", label: "Nacre quality", labelAr: "جودة طبقة اللؤلؤ" },
    { field: "pearlOrigin", category: "PEARL_ORIGIN", label: "Origin", labelAr: "المنشأ" }, { field: "certificateAuthority", category: "CERTIFICATE_AUTHORITY", label: "Certificate authority", labelAr: "جهة الشهادة" },
    { field: "description", category: "PEARL_ITEM_DESCRIPTION", label: "Item description", labelAr: "وصف اللؤلؤ" },
  ],
};
const LOOSE_MASTER_DRAFT_FIELD: Record<string, keyof ReceivePieceDraft> = {
  stoneName: "stoneName", stoneType: "diamondType", treatment: "treatment", shape: "shape", color: "color", tone: "tone", toneLevel: "toneLevel", saturation: "saturation", opticalEffect: "opticalEffect", origin: "origin",
  pearlType: "pearlType", pearlColor: "color", overtone: "overtone", orient: "orient", pearlShape: "shape", luster: "luster", surfaceQuality: "surfaceQuality", nacreQuality: "nacreQuality", pearlOrigin: "origin", description: "description",
};

export default function SupplierPurchasesPage() {
  const t = useTranslations("Suppliers");
  const common = useTranslations("Common");
  const locale = useLocale();
  const rtl = locale === "ar";
  const queryClient = useQueryClient();
  const { company, activeBranch, activeBranchId, user } = useAuth();
  const { items: suppliers, loading: suppliersLoading, error: suppliersError, refresh: refreshSuppliers } = useSuppliers({ page: 1, pageSize: 100 });
  const { createAsset, isCreating } = useAssets({ listEnabled: false });
  const { inventoryCodes: barcodeInventoryCodes, itemCodes: barcodeItemCodes } = useBarcodeSettings();
  const isApi = DATA_SOURCE === "api";

  const [supplierId, setSupplierId] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [useReverseCharge, setUseReverseCharge] = useState(false);
  const [drcVerified, setDrcVerified] = useState(false);

  // Phase 12J — purchase VAT UI. VAT is opt-in (default off) so the existing
  // no-VAT receive path is unchanged. Defaults come from company settings (12E).
  const [applyVat, setApplyVat] = useState(false);
  // No client-side VAT policy default; the backend/settings contract owns it.
  const [vatRate, setVatRate] = useState("");
  const [taxIncluded, setTaxIncluded] = useState(false);
  const [isRecoverable, setIsRecoverable] = useState(true);

  // A serialized receipt is the default. The Product path remains an explicitly
  // labelled legacy compatibility mode; it is never used for physical pieces.
  const [isQuantityBased, setIsQuantityBased] = useState(false);
  const [productCode, setProductCode] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [matchingProduct, setMatchingProduct] = useState<Product | null>(null);

  // Query products list for lookups
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await apiClient<any>("/products", { locale });
      return res.items || res.data?.items || [];
    },
    enabled: isApi,
  });

  // Phase 12J — company settings supply purchase-VAT defaults (12E keys).
  const { data: vatSettings } = useQuery<any>({
    queryKey: ["settings", "purchase-vat"],
    queryFn: async () => {
      const res = await apiClient<any>("/settings", { locale });
      return res.data || res;
    },
    enabled: isApi,
  });
  useEffect(() => {
    if (!vatSettings) return;
    const rate = vatSettings.purchaseVatRate ?? vatSettings.vatRate;
    if (rate !== undefined && rate !== null) setVatRate(String(rate));
    if (typeof vatSettings.purchaseTaxIncludedDefault === "boolean") setTaxIncluded(vatSettings.purchaseTaxIncludedDefault);
    if (typeof vatSettings.purchaseVatRecoverableDefault === "boolean") setIsRecoverable(vatSettings.purchaseVatRecoverableDefault);
  }, [vatSettings]);

  const handleProductCodeChange = (code: string) => {
    const cleanCode = code.toUpperCase();
    setProductCode(cleanCode);
    
    const match = products.find(p => p.productCode.toUpperCase() === cleanCode.trim());
    if (match) {
      setMatchingProduct(match);
      setAssetName(match.productName);
      setAssetType(match.stockType as AssetType);
      setKarat(String(match.karat || 21));
      setCategory(match.description || "");
      setSalePrice(String(match.salePrice || 0));
    } else {
      setMatchingProduct(null);
    }
  };

  // Form states for the new asset being purchased
  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("gold-piece");
  const [category, setCategory] = useState("");
  const [itemCode, setItemCode] = useState("RNG");
  const [karat, setKarat] = useState("21");
  const [inventoryProfile, setInventoryProfile] = useState("GOLD_BY_PIECE");
  const [quantity, setQuantity] = useState("1");
  const [weightPerUnit, setWeightPerUnit] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [pieceDrafts, setPieceDrafts] = useState<ReceivePieceDraft[]>([emptyPieceDraft()]);
  const [paidAmount, setPaidAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("credit");
  const [purchaseDate, setPurchaseDate] = useState(() => getBranchCurrentDate());
  const [notes, setNotes] = useState("");

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [canonicalPreview, setCanonicalPreview] = useState<any>(null);
  const [previewState, setPreviewState] = useState<"idle" | "loading" | "ready" | "unavailable">("idle");
  const [profileTransitionPending, setProfileTransitionPending] = useState(false);
  const [acceptedPreviewKey, setAcceptedPreviewKey] = useState("");
  const [acceptedPreviewGeneration, setAcceptedPreviewGeneration] = useState<number | null>(null);
  const profileGenerationRef = useRef(0);
  const previewSequenceRef = useRef(0);
  const previewAbortRef = useRef<AbortController | null>(null);

  // Profile requiredness is deliberately read from the canonical backend
  // registry.  The local option list below supplies labels only.
  const { data: profileContracts = [], isLoading: profilesLoading } = useQuery<InventoryProfileContract[]>({
    queryKey: ["inventory-v2", "profiles"],
    queryFn: async () => {
      const response = await apiClient<any>("/inventory-v2/profiles", { locale });
      return response?.data?.profiles || [];
    },
    enabled: isApi,
  });
  const { data: pearlSizeMasterValues = [] } = useQuery<PearlSizeMasterValue[]>({
    queryKey: ["pearl-size-master-data"],
    queryFn: async () => {
      const response = await apiClient<any>("/pearl-size-master-data", { locale });
      return response?.data?.values || [];
    },
    enabled: isApi && inventoryProfile === "LOOSE_PEARL",
  });
  const { data: profileMasterDataValues = [] } = useQuery<ProfileMasterDataValue[]>({
    queryKey: ["profile-master-data", inventoryProfile],
    queryFn: async () => {
      const response = await apiClient<any>("/profile-master-data", { locale });
      return response?.data?.values || [];
    },
    enabled: isApi && ["LOOSE_GEMSTONE", "LOOSE_PEARL"].includes(inventoryProfile),
  });

  const currency = company?.currency ?? "AED";
  const selectedInventoryCode = barcodeInventoryCodes.find((code) => code.assetType === assetType && code.isActive);
  const availableItemCodes = barcodeItemCodes.filter((code) => code.isActive && (!code.allowedInventoryCodes.length || (selectedInventoryCode && code.allowedInventoryCodes.includes(selectedInventoryCode.code))));
  useEffect(() => {
    if (!selectedInventoryCode || isQuantityBased) return;
    const preferred = selectedInventoryCode.defaultItemCode;
    if (preferred && availableItemCodes.some((code) => code.code === preferred) && itemCode !== preferred) setItemCode(preferred);
    if (!selectedInventoryCode.requiresKarat) setKarat("");
  }, [selectedInventoryCode, availableItemCodes, itemCode, isQuantityBased]);
  const money = (value: number) => formatCurrency(value, currency, locale);
  const BackIcon = rtl ? ArrowRight : ArrowLeft;
  const parseDecimal = useCallback((value: string) => Number(toEnglishDigits(value).replace(",", ".")) || 0, []);
  const normalizeDecimalValue = (value: string) => normalizeNumberInput(value).replace(",", ".");
  // Client-side guard is presentation-only.  It never rounds or derives a
  // business value; the server policy remains authoritative.
  const decimalInputAtMost = (value: string, places: number) => {
    const normalized = normalizeDecimalValue(value);
    return new RegExp(`^\\d*(?:\\.\\d{0,${places}})?$`).test(normalized) ? normalized : null;
  };
  const quantityNum = parseDecimal(quantity);
  const weightPerUnitNum = parseDecimal(weightPerUnit);
  const unitCostNum = parseDecimal(unitCost);
  const canonicalPieceTotal = pieceDrafts.reduce((sum, piece) => sum + parseDecimal(piece.purchaseCost), 0);
  const canonicalPieceWeight = pieceDrafts.reduce((sum, piece) => sum + parseDecimal(piece.grossWeight), 0);
  const paidAmountNum = parseDecimal(paidAmount);
  const totalWeight = Math.round((isQuantityBased ? quantityNum * weightPerUnitNum : canonicalPieceWeight) * 10000) / 10000;
  const legacyTotalCost = Math.round((isQuantityBased ? quantityNum * unitCostNum : canonicalPieceTotal) * 100) / 100;
  // Phase 12J — purchase VAT preview (display only; the backend recomputes and
  // is the source of truth). The derived values are defined after the canonical
  // preview lifecycle so an old response can never remain visible as current.
  const vatRateNum = parseDecimal(vatRate);
  const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
  const vatRateValid = Number.isFinite(vatRateNum) && vatRateNum >= 0 && vatRateNum <= 100;

  const activeSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => supplier.status !== "inactive");
  }, [suppliers]);

  const selectedSupplier = useMemo(() => {
    return activeSuppliers.find((supplier) => supplier.id === supplierId) || null;
  }, [activeSuppliers, supplierId]);

  // Phase 21.3 — stable Idempotency-Key for the purchase-receive submit:
  // generated once per attempt, reused on retry, reset on success.
  const idempotencyKeyRef = useRef("");

  useEffect(() => {
    if (isQuantityBased || !Number.isInteger(quantityNum) || quantityNum < 1) return;
    setPieceDrafts((current) => {
      const next = current.slice(0, quantityNum);
      while (next.length < quantityNum) {
        next.push({ ...emptyPieceDraft(), grossWeight: weightPerUnit, stoneWeight: "0", purchaseCost: unitCost });
      }
      return next;
    });
  }, [isQuantityBased, quantityNum, weightPerUnit, unitCost]);

  const updatePieceDraft = (index: number, field: keyof ReceivePieceDraft, value: ReceivePieceDraft[keyof ReceivePieceDraft]) => {
    setPieceDrafts((current) => current.map((piece, pieceIndex) => {
      if (pieceIndex !== index) return piece;
      if (field === "purchaseGoldRate") {
        const nextValue = String(value);
        const reference = piece.purchaseRateReference || goldReferenceRate;
        const overridden = Boolean(reference && Number(nextValue) > 0 && Number(nextValue) !== Number(reference));
        return { ...piece, purchaseGoldRate: nextValue, purchaseRateReference: reference, purchaseRateReferenceKarat: effectiveKarat, purchaseRateOverridden: overridden };
      }
      return { ...piece, [field]: value };
    }));
  };
  const updatePieceMasterData = (index: number, field: string, value: string) => {
    const target = LOOSE_MASTER_DRAFT_FIELD[field];
    const selectedLabel = profileMasterDataValues.find((entry) => entry.id === value)?.label || "";
    setPieceDrafts((current) => current.map((piece, pieceIndex) => pieceIndex === index ? {
      ...piece, masterData: { ...piece.masterData, [field]: value },
      ...(target ? { [target]: selectedLabel } : {}),
    } : piece));
  };
  const masterOptions = (category: string) => profileMasterDataValues.filter((entry) => entry.category === category && entry.isActive);

  const selectedProfileContract = profileContracts.find((profile) => profile.key === inventoryProfile);
  const selectedProfilePresentation = PROFILE_PRESENTATION[inventoryProfile] || { label: inventoryProfile, labelAr: inventoryProfile };
  const canonicalAssetType = selectedProfileContract?.assetType || assetType;
  const isCgpProfile = inventoryProfile === "CGP_CUSTOMER_GOLD_PURCHASE";
  const conditionRequired = selectedProfileContract?.condition === "REQUIRED";
  const conditionApplicable = selectedProfileContract?.condition !== "NOT_APPLICABLE";
  const certificateSupported = selectedProfileContract?.certificateSupported ?? inventoryProfile !== "CGP_CUSTOMER_GOLD_PURCHASE";
  const weightApplicable = selectedProfileContract?.weightApplicable ?? true;
  const isGoldProfile = selectedProfileContract?.family === "GOLD";
  const goldValuationContract = selectedProfileContract?.goldValuation;
  const goldValuationApplicable = Boolean(goldValuationContract?.enabled);
  const is24kGoldBar = inventoryProfile === "GOLD_BAR_24K";
  // GOLD_BAR_24K is a server-contract invariant.  Derive the effective
  // karat synchronously from the selected profile so a profile switch cannot
  // render or preview the previous profile's karat for one effect cycle.
  const effectiveKarat = is24kGoldBar ? "24" : karat;
  const isLooseProfile = ["LOOSE_DIAMOND", "LOOSE_GEMSTONE", "LOOSE_PEARL"].includes(inventoryProfile);
  const profileRequires = (field: string) => Boolean(selectedProfileContract?.required.includes(field));
  const goldColorApplicable = isGoldProfile && Boolean(selectedProfileContract?.optional.includes("goldColor"));

  // The preview payload intentionally mirrors the canonical receive payload;
  // it contains operator input only and all valuation/total derivation remains
  // on the server normalizer.
  const previewItems = useMemo(() => [{
    quantity: quantityNum,
    perPiece: pieceDrafts.map((piece, index) => ({
      name: quantityNum > 1 ? `${assetName} ${index + 1}` : assetName,
      description: piece.description.trim() || assetName,
      type: canonicalAssetType,
      category: category.trim() || "Received purchase",
      inventoryProfile,
      profile: inventoryProfile,
      inventoryCode: selectedInventoryCode?.code,
      itemCode,
      karat: selectedProfileContract?.required.includes("karat") ? Number(effectiveKarat) || null : null,
      grossWeight: parseDecimal(piece.grossWeight),
      stoneWeight: parseDecimal(piece.stoneWeight),
      purchaseCost: goldValuationApplicable ? undefined : parseDecimal(piece.purchaseCost),
      goldValue: goldValuationApplicable ? undefined : parseDecimal(piece.purchaseCost),
      ...(goldValuationApplicable ? {
        goldValuation: {
          purchaseGoldRate: parseDecimal(piece.purchaseGoldRate),
          purchaseRateOverrideReason: piece.purchaseRateOverridden ? piece.purchaseRateOverrideReason.trim() : undefined,
          makingPerGram: is24kGoldBar ? undefined : parseDecimal(piece.makingPerGram),
          currentGoldRate: parseDecimal(piece.currentGoldRate),
          currentMakingPerGram: is24kGoldBar ? undefined : parseDecimal(piece.currentMakingPerGram || piece.makingPerGram),
          certificateCost: is24kGoldBar ? parseDecimal(piece.certificateCost) : undefined,
          currentCertificateCost: is24kGoldBar ? parseDecimal(piece.currentCertificateCost || piece.certificateCost) : undefined,
          vatRate: is24kGoldBar && piece.valuationVatRate.trim() ? parseDecimal(piece.valuationVatRate) : undefined,
          currentVatRate: is24kGoldBar && piece.currentValuationVatRate.trim() ? parseDecimal(piece.currentValuationVatRate) : undefined,
        },
      } : {}),
      ...(isLooseProfile ? { looseDetails: {
        stoneName: piece.stoneName.trim() || undefined, diamondType: piece.diamondType.trim() || undefined,
        carat: piece.carat.trim() || undefined, color: piece.color.trim() || undefined, clarity: piece.clarity.trim() || undefined,
        cut: piece.cut.trim() || undefined, shape: piece.shape.trim() || undefined, treatment: piece.treatment.trim() || undefined,
        tone: piece.tone.trim() || undefined, toneLevel: piece.toneLevel.trim() || undefined, saturation: piece.saturation.trim() || undefined,
        opticalEffect: piece.opticalEffect.trim() || undefined, origin: piece.origin.trim() || undefined,
        totalPearlWeight: piece.totalPearlWeight.trim() || undefined, pearlSizeId: piece.pearlSize.trim() || undefined,
        pearlType: piece.pearlType.trim() || undefined, overtone: piece.overtone.trim() || undefined, orient: piece.orient.trim() || undefined,
        luster: piece.luster.trim() || undefined, surfaceQuality: piece.surfaceQuality.trim() || undefined, nacreQuality: piece.nacreQuality.trim() || undefined,
        notes: piece.looseNotes.trim() || undefined, masterData: piece.masterData,
      }} : {}),
      ...(isLooseProfile ? { looseFinancial: {
        purchaseCost: parseDecimal(piece.purchaseCost), additionalCost: parseDecimal(piece.additionalCost) || 0,
        vatRate: applyVat && piece.valuationVatRate.trim() ? parseDecimal(piece.valuationVatRate) : undefined,
      }, looseCurrentValuation: {
        currentValue: parseDecimal(piece.currentValue || piece.purchaseCost),
        currentVatRate: applyVat && piece.currentVatRate.trim() ? parseDecimal(piece.currentVatRate) : undefined,
      }} : {}),
      condition: conditionApplicable ? (piece.condition || null) : null,
      goldColor: piece.goldColor.trim() || null,
      brand: piece.brand.trim() || null,
      model: piece.model.trim() || null,
      modelNumber: piece.modelNumber.trim() || null,
      supplierReference: piece.supplierReference.trim() || null,
      locationId: piece.locationId.trim() || null,
      ...(piece.certificateIssuer || piece.masterData.certificateAuthority || piece.certificateNumber || piece.certificateIssueDate || piece.certificateUrl ? {
        certificate: {
          issuer: piece.certificateIssuer.trim(), issuerId: piece.masterData.certificateAuthority || undefined,
          certificateNumber: piece.certificateNumber.trim(), issueDate: piece.certificateIssueDate, url: piece.certificateUrl.trim() || null,
        },
      } : {}),
      components: Array.isArray(piece.components) && piece.components.length ? piece.components : undefined,
    })),
  }], [quantityNum, pieceDrafts, assetName, canonicalAssetType, category, inventoryProfile, selectedInventoryCode, itemCode, effectiveKarat, selectedProfileContract?.required, goldValuationApplicable, is24kGoldBar, isLooseProfile, conditionApplicable, applyVat, parseDecimal]);

  // The key is the complete operator-input snapshot used for the canonical
  // preview.  A response is displayable/submittable only when this exact key
  // and the current profile generation match the accepted response.
  const previewInputKey = useMemo(() => JSON.stringify({
    items: previewItems,
    paidAmount: paidAmountNum,
    applyVat: useReverseCharge || applyVat,
    vatRate: vatRateNum,
    taxIncluded,
    isRecoverable,
    isRcm: useReverseCharge,
  }), [previewItems, paidAmountNum, useReverseCharge, applyVat, vatRateNum, taxIncluded, isRecoverable]);

  // A preview is meaningful only after the current Profile contract has the
  // minimum operator facts required by the server.  This is a request guard,
  // not a second validation authority: the backend still validates every
  // submitted value.  It prevents transient profile-switch snapshots (empty
  // description/weight/rate or missing Piece condition) from becoming
  // avoidable 4xx preview requests.
  const previewInputReady = useMemo(() => {
    if (!isApi || isQuantityBased || isCgpProfile || !selectedProfileContract || !pieceDrafts.length) return false;
    if (!assetName.trim() || !Number.isInteger(quantityNum) || quantityNum < 1 || pieceDrafts.length !== quantityNum) return false;
    const looseRequired = selectedProfileContract.looseDetails?.required || [];
    return pieceDrafts.every((piece) => {
      if (!piece.description.trim()) return false;
      if (weightApplicable && parseDecimal(piece.grossWeight) <= 0) return false;
      if (selectedProfileContract.required.includes("condition") && !piece.condition) return false;
      if (goldValuationApplicable) {
        if (parseDecimal(piece.purchaseGoldRate) <= 0 || parseDecimal(piece.currentGoldRate) <= 0) return false;
      } else if (selectedProfileContract.required.includes("purchaseCost") && parseDecimal(piece.purchaseCost) <= 0) {
        return false;
      }
      return looseRequired.every((field) => {
        const draftField = field === "stoneType" ? "diamondType" : field as keyof ReceivePieceDraft;
        return Boolean(String(piece[draftField] ?? "").trim());
      });
    });
  }, [assetName, goldValuationApplicable, isApi, isCgpProfile, isQuantityBased, parseDecimal, pieceDrafts, quantityNum, selectedProfileContract, weightApplicable]);

  useEffect(() => {
    const generation = profileGenerationRef.current;
    const sequence = ++previewSequenceRef.current;
    let cancelled = false;
    previewAbortRef.current?.abort();
    previewAbortRef.current = null;

    if (!isApi || isQuantityBased || isCgpProfile || !selectedProfileContract || !pieceDrafts.length || !previewInputReady) {
      setCanonicalPreview(null);
      setPreviewState("idle");
      setAcceptedPreviewKey("");
      setAcceptedPreviewGeneration(null);
      setProfileTransitionPending(false);
      return;
    }

    setProfileTransitionPending(false);
    setPreviewState("loading");
    const controller = new AbortController();
    previewAbortRef.current = controller;
    const timer = window.setTimeout(async () => {
      try {
        const response = await apiClient<any>("/inventory-v2/receive-preview", {
          method: "POST", locale, signal: controller.signal,
          body: JSON.stringify({
            items: previewItems,
            paidAmount: paidAmountNum,
            applyVat: useReverseCharge || applyVat,
            ...(useReverseCharge ? { isRcm: true, isDRC: true, reverseVat: true, useReverseCharge: true, rcmRate: vatRateNum, isRecoverable: true } : { vatRate: vatRateNum, taxIncluded, isRecoverable }),
          }),
        });
        if (cancelled || controller.signal.aborted || sequence !== previewSequenceRef.current || generation !== profileGenerationRef.current) return;
        const data = response?.data || response;
        if (!Number.isFinite(Number(data?.total)) || Number(data.total) <= 0) {
          setCanonicalPreview(null);
          setAcceptedPreviewKey("");
          setAcceptedPreviewGeneration(null);
          setPreviewState("unavailable");
        } else {
          setCanonicalPreview(data);
          setAcceptedPreviewKey(previewInputKey);
          setAcceptedPreviewGeneration(generation);
          setPreviewState("ready");
        }
      } catch (error) {
        const aborted = controller.signal.aborted || (error instanceof Error && error.name === "AbortError");
        if (!aborted && !cancelled && sequence === previewSequenceRef.current && generation === profileGenerationRef.current) {
          setCanonicalPreview(null);
          setAcceptedPreviewKey("");
          setAcceptedPreviewGeneration(null);
          setPreviewState("unavailable");
        }
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
      if (previewAbortRef.current === controller) previewAbortRef.current = null;
    };
  }, [isApi, isQuantityBased, isCgpProfile, selectedProfileContract, pieceDrafts.length, previewInputReady, previewItems, previewInputKey, paidAmountNum, useReverseCharge, applyVat, vatRateNum, taxIncluded, isRecoverable, locale]);

  const previewIsCurrent = Boolean(
    !isQuantityBased && isApi && canonicalPreview && previewState === "ready" &&
    !profileTransitionPending && acceptedPreviewKey === previewInputKey &&
    acceptedPreviewGeneration === profileGenerationRef.current,
  );
  const currentPreview = previewIsCurrent ? canonicalPreview : null;

  // For serialized V2 pieces the server preview is the only total authority.
  // Never present an old result or a fallback zero as the current specialized
  // acquisition total while the latest generation is still recalculating.
  const totalCost = isQuantityBased ? legacyTotalCost : (currentPreview?.total ?? 0);
  const previewPending = isApi && !isQuantityBased && !isCgpProfile && !previewIsCurrent && previewState === "loading";
  const previewUnavailable = isApi && !isQuantityBased && !isCgpProfile && !previewIsCurrent && previewState === "unavailable";
  const remainingAmount = isQuantityBased ? Math.max(0, Math.round((totalCost - paidAmountNum) * 100) / 100) : (currentPreview?.remainingAmount ?? 0);
  const paymentStatus = isQuantityBased
    ? (remainingAmount <= 0 && totalCost > 0 ? "paid" : paidAmountNum > 0 ? "partial" : "unpaid")
    : (currentPreview?.paymentStatus || "unpaid");
  const previewRows = Array.isArray(currentPreview?.items) ? currentPreview.items : [];
  const goldPurchaseValue = previewRows.reduce((sum: number, row: any) => sum + Number(row.purchaseGoldValue || 0), 0);
  const makingTotal = previewRows.reduce((sum: number, row: any) => sum + Number(row.makingTotal || 0), 0);
  const certificateTotal = previewRows.reduce((sum: number, row: any) => sum + Number(row.certificateCost || 0), 0);
  const certificateVatTotal = previewRows.reduce((sum: number, row: any) => sum + Number(row.certificateVat || 0), 0);
  const additionalAuthorizedCost = previewRows.reduce((sum: number, row: any) => sum + Number(row.additionalCost || 0), 0);
  const vatPreview = useMemo(() => {
    const goods = totalCost;
    if (useReverseCharge) {
      const rcmVatAmount = r2(goods * vatRateNum / 100);
      return { mode: "rcm" as const, taxBase: goods, inputVatAmount: 0, rcmVatAmount, payable: goods };
    }
    if (applyVat && vatRateNum > 0) {
      if (taxIncluded) {
        const taxBase = r2(goods / (1 + vatRateNum / 100));
        const inputVatAmount = r2(goods - taxBase);
        return { mode: (isRecoverable ? "inclusive" as const : "nonRecoverable" as const), taxBase, inputVatAmount, rcmVatAmount: 0, payable: goods };
      }
      const inputVatAmount = r2(goods * vatRateNum / 100);
      return { mode: (isRecoverable ? "exclusive" as const : "nonRecoverable" as const), taxBase: goods, inputVatAmount, rcmVatAmount: 0, payable: r2(goods + inputVatAmount) };
    }
    return { mode: "none" as const, taxBase: goods, inputVatAmount: 0, rcmVatAmount: 0, payable: goods };
  }, [totalCost, useReverseCharge, applyVat, vatRateNum, taxIncluded, isRecoverable]);
  const canOverridePurchaseRate = Boolean(
    user && (
      user.accountType === "super_admin" ||
      ["admin", "owner"].includes(String(user.role || "").toLowerCase()) ||
      user.permissions?.includes("inventory.adjust")
    )
  );
  const { data: goldReferenceSnapshot, isLoading: goldReferenceLoading } = useQuery<any>({
    queryKey: ["gold-center-reference-prices", currency, activeBranchId],
    queryFn: async () => {
      const response = await apiClient<any>(`/gold/karat-prices?currency=${encodeURIComponent(currency)}`, { locale });
      return response?.data || response;
    },
    enabled: isApi && isGoldProfile && Boolean(activeBranchId),
    staleTime: 15_000,
  });
  const goldReferenceRate = useMemo(() => {
    const prices = goldReferenceSnapshot?.prices || goldReferenceSnapshot?.data?.prices || [];
    const row = prices.find((entry: any) => Number(entry.karat) === Number(effectiveKarat));
    return row ? String(row.pricePerGram) : "";
  }, [goldReferenceSnapshot, effectiveKarat]);
  const goldReferenceStatus = String(goldReferenceSnapshot?.status || goldReferenceSnapshot?.freshness || "");
  const currentGoldValuePreview = (piece: ReceivePieceDraft) => {
    const net = Math.max(0, parseDecimal(piece.grossWeight) - parseDecimal(piece.stoneWeight));
    const rate = parseDecimal(goldReferenceRate);
    return net > 0 && rate > 0 ? String(net * rate) : "";
  };

  useEffect(() => {
    if (!goldValuationApplicable || !goldReferenceRate) return;
    setPieceDrafts((current) => current.map((piece) => ({
      ...piece,
      purchaseRateReference: piece.purchaseRateOverridden && piece.purchaseRateReferenceKarat === effectiveKarat ? piece.purchaseRateReference : goldReferenceRate,
      purchaseRateReferenceKarat: effectiveKarat,
      purchaseGoldRate: piece.purchaseRateOverridden && piece.purchaseRateReferenceKarat === effectiveKarat ? piece.purchaseGoldRate : goldReferenceRate,
      purchaseRateOverridden: piece.purchaseRateOverridden && piece.purchaseRateReferenceKarat === effectiveKarat,
      purchaseRateOverrideReason: piece.purchaseRateOverridden && piece.purchaseRateReferenceKarat === effectiveKarat ? piece.purchaseRateOverrideReason : "",
      currentGoldRate: goldReferenceRate,
    })));
  }, [goldReferenceRate, goldValuationApplicable, effectiveKarat]);

  useEffect(() => {
    if (!isQuantityBased && selectedProfileContract && assetType !== selectedProfileContract.assetType) {
      setAssetType(selectedProfileContract.assetType);
    }
  }, [assetType, isQuantityBased, selectedProfileContract]);

  useEffect(() => {
    if (!isQuantityBased && is24kGoldBar && karat !== "24") setKarat("24");
  }, [is24kGoldBar, isQuantityBased, karat]);

  const resetProfileOwnedFields = (piece: ReceivePieceDraft): ReceivePieceDraft => ({
    ...piece,
    // Description is cleared because the current form has no separate
    // auto-generated/user-entered marker; retaining it would leak an old
    // profile's description into the newly committed profile.
    description: "",
    purchaseCost: "",
    purchaseGoldRate: "",
    purchaseRateReference: "",
    purchaseRateReferenceKarat: "",
    purchaseRateOverridden: false,
    purchaseRateOverrideReason: "",
    makingPerGram: "0",
    currentGoldRate: "",
    currentMakingPerGram: "",
    certificateCost: "0",
    currentCertificateCost: "",
    valuationVatRate: "",
    currentValuationVatRate: "",
    additionalCost: "0",
    currentValue: "",
    currentVatRate: "",
    markupPercent: "",
    maximumDiscountPercent: "",
    minimumSellingPrice: "",
    sellingPrice: "",
    condition: "",
    goldColor: "",
    certificateIssuer: "",
    certificateNumber: "",
    certificateIssueDate: "",
    certificateUrl: "",
    attachment: null,
    masterData: {},
    components: undefined,
    carat: "",
    totalPearlWeight: "",
    pearlSize: "",
    stoneName: "",
    diamondType: "",
    clarity: "",
    cut: "",
    shape: "",
    treatment: "",
    tone: "",
    toneLevel: "",
    saturation: "",
    opticalEffect: "",
    origin: "",
    pearlType: "",
    overtone: "",
    orient: "",
    luster: "",
    surfaceQuality: "",
    nacreQuality: "",
    looseNotes: "",
  });

  const handleInventoryProfileChange = (nextProfile: string) => {
    if (nextProfile === inventoryProfile) return;
    profileGenerationRef.current += 1;
    previewSequenceRef.current += 1;
    previewAbortRef.current?.abort();
    previewAbortRef.current = null;
    setProfileTransitionPending(true);
    setCanonicalPreview(null);
    setAcceptedPreviewKey("");
    setAcceptedPreviewGeneration(null);
    setPreviewState("loading");
    setErrorMsg("");
    setKarat(nextProfile === "GOLD_BAR_24K" ? "24" : "21");
    const nextContract = profileContracts.find((profile) => profile.key === nextProfile);
    if (nextContract) setAssetType(nextContract.assetType);
    setPieceDrafts((current) => current.map(resetProfileOwnedFields));
    setInventoryProfile(nextProfile);
  };

  const handlePostPurchase = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedSupplier) {
      setErrorMsg(rtl ? "اختر المورد أولًا" : "Please select a supplier first");
      return;
    }

    if (!activeBranchId) {
      setErrorMsg(rtl ? "اختر فرعًا تشغيليًا قبل الاستلام." : "Select an operational Branch before receiving.");
      return;
    }

    if (!isQuantityBased && isApi && (profilesLoading || !selectedProfileContract)) {
      setErrorMsg(rtl ? "يجري تحميل عقد Profile المعتمد؛ أعد المحاولة بعد اكتماله." : "The canonical Profile contract is still loading. Please try again shortly.");
      return;
    }

    // CGP is displayed by the same registry, but its material-pool / piece
    // semantics are intentionally deferred.  Do not turn this receipt form
    // into an invented CGP physical-Asset workflow.
    if (!isQuantityBased && isCgpProfile) {
      setErrorMsg(rtl ? "شراء الذهب من العميل يتم من خلال مسار \"شراء الذهب من العميل (CGP)\" في المبيعات والعملاء. شاشة الموردين مخصصة لاستلام الموردين." : "Customer Gold Purchase is handled from the Customer Gold Purchase (CGP) workflow in Sales & Customers. Supplier Receipt is for supplier intake.");
      return;
    }

    if (isQuantityBased && !productCode.trim()) {
      setErrorMsg(rtl ? "رمز المنتج مطلوب للمنتجات بالكمية." : "Product code is required for quantity-based products.");
      return;
    }

    const salePriceNum = parseDecimal(salePrice);
    if (isQuantityBased && (isNaN(salePriceNum) || salePriceNum < 0)) {
      setErrorMsg(rtl ? "سعر البيع يجب أن يكون أكبر من أو يساوي الصفر." : "Sale price must be greater than or equal to zero.");
      return;
    }

    if (!assetName.trim() || quantityNum <= 0 || !Number.isInteger(quantityNum) || (!isQuantityBased && isApi && !previewIsCurrent) || (isQuantityBased && totalCost <= 0)) {
      setErrorMsg(rtl ? "برجاء استكمال بيانات التوريد بشكل صحيح." : "Please fill in all asset purchase details correctly.");
      return;
    }
    if (isQuantityBased && (weightPerUnitNum <= 0 || unitCostNum < 0)) {
      setErrorMsg(rtl ? "برجاء استكمال بيانات المنتج بالكمية بشكل صحيح." : "Please complete the quantity-product details correctly.");
      return;
    }
    if (!isQuantityBased && (!selectedInventoryCode || !itemCode)) {
      setErrorMsg(rtl ? "يجب اختيار كود مخزون وكود قطعة نشطين." : "Select active inventory and item codes before receiving a serialized asset.");
      return;
    }
    if (!isQuantityBased && (pieceDrafts.length !== quantityNum || pieceDrafts.some((piece) => parseDecimal(piece.grossWeight) <= 0 || (!goldValuationApplicable && parseDecimal(piece.purchaseCost) < 0)))) {
      setErrorMsg(rtl ? "أدخل وزنًا وتكلفة لكل قطعة فعلية. عدد سجلات القطع يجب أن يساوي كمية المستند." : "Enter a weight and cost for every physical piece. Piece records must match the document quantity.");
      return;
    }
    if (!isQuantityBased && goldValuationApplicable && (goldReferenceLoading || !goldReferenceRate || pieceDrafts.some((piece) => parseDecimal(piece.purchaseGoldRate) <= 0 || (piece.purchaseRateOverridden && !piece.purchaseRateOverrideReason.trim()) || (is24kGoldBar && (parseDecimal(piece.certificateCost) < 0 || parseDecimal(piece.currentCertificateCost) < 0))))) {
      setErrorMsg(rtl ? "سعر الذهب المرجعي الحالي غير جاهز أو بيانات سعر الشراء/تكلفة الشهادة غير مكتملة." : "The canonical current gold rate is not ready, or purchase-rate/certificate-cost data is incomplete.");
      return;
    }
    if (!isQuantityBased && conditionRequired && pieceDrafts.some((piece) => !piece.condition)) {
      setErrorMsg(rtl ? "حالة القطعة مطلوبة لهذه Profile." : "Condition is required for this Profile.");
      return;
    }

    if (!isQuantityBased && pieceDrafts.some((piece) => (piece.certificateIssuer || piece.certificateNumber || piece.certificateIssueDate || piece.certificateUrl) && (!piece.certificateIssuer || !piece.certificateNumber || !piece.certificateIssueDate))) {
      setErrorMsg(rtl ? "عند إدخال شهادة، الاسم والرقم وتاريخ الإصدار مطلوبة معًا." : "When entering a certificate, issuer, number, and issue date are required together.");
      return;
    }

    if (!isQuantityBased && isApi && !previewIsCurrent) {
      setErrorMsg(rtl ? "لم يكتمل احتساب الإجمالي الخادمي؛ انتظر قليلًا ثم أعد المحاولة." : "The server acquisition total is not ready yet. Please wait and try again.");
      return;
    }
    if (paidAmountNum < 0 || paidAmountNum > totalCost) {
      setErrorMsg(rtl ? "المبلغ المدفوع يجب ألا يتجاوز إجمالي الشراء." : "Paid amount cannot exceed total cost.");
      return;
    }

    if (useReverseCharge && !drcVerified) {
      setErrorMsg(rtl ? "يجب استيفاء جميع شروط التدقيق الضريبي للاحتساب العكسي." : "Reverse charge checks must be fully compliant.");
      return;
    }

    // Phase 12J — VAT rate must be valid when VAT (or RCM) is applied.
    if ((applyVat || useReverseCharge) && !vatRateValid) {
      setErrorMsg(rtl ? "نسبة الضريبة يجب أن تكون رقماً بين 0 و 100." : "VAT rate must be a number between 0 and 100.");
      return;
    }

    const submitGeneration = profileGenerationRef.current;
    if (!isQuantityBased && isApi && (!previewIsCurrent || acceptedPreviewGeneration !== submitGeneration)) {
      setErrorMsg(rtl ? "تغيرت بيانات Profile قبل اعتماد المعاينة؛ انتظر إعادة الحساب ثم أعد المحاولة." : "The Profile changed before the canonical preview was accepted. Wait for recalculation and try again.");
      return;
    }

    setIsPosting(true);
    try {
      if (!isQuantityBased && isApi && profileGenerationRef.current !== submitGeneration) {
        throw new Error(rtl ? "تغيرت Profile أثناء الإرسال؛ لم يتم تسجيل الاستلام." : "The Profile changed during submit; the receipt was not posted.");
      }
      const timestamp = Date.now();
      const dateStr = purchaseDate || new Date().toISOString().slice(0, 10);
      const purchaseOrderId = `PO-${timestamp}`;

      const localPlaceholderBarcode = `LOCAL-PENDING-${timestamp}`;
      const assetId = `AST-PUR-${timestamp.toString().slice(-6)}`;

      // Local/mock mode keeps the existing client-side repository behavior.
      const newAssetItem: Partial<Asset> = {
        id: assetId,
        name: assetName,
        type: assetType,
        category: category.trim() || (rtl ? "خام" : "Raw material"),
        karat: Number(effectiveKarat) || undefined,
        grossWeight: weightPerUnitNum,
        netWeight: weightPerUnitNum,
        cost: unitCostNum,
        price: isQuantityBased ? salePriceNum : Math.round(unitCostNum * 1.32), // Markup for sales preview
        branch: activeBranch,
        location: "Showroom",
        status: "available",
        barcode: localPlaceholderBarcode,
        inventoryCode: selectedInventoryCode?.code,
        itemCode,
        inventorySubtype: assetType === "watch" ? "watch" : undefined,
        source: `${rtl ? "توريد من: " : "Supplied by: "} ${selectedSupplier.name}`,
        events: [
          {
            id: `EV-PUR-${timestamp}`,
            action: "PURCHASED",
            date: dateStr,
            user: user?.firstName || "System",
            branch: activeBranch,
            note: `${rtl ? "فاتورة توريد من " : "Purchase invoice from "} ${selectedSupplier.name}. ${rtl ? "الاحتساب العكسي: " : "DRC: "} ${useReverseCharge ? (rtl ? "نعم" : "Yes") : (rtl ? "لا" : "No")}`,
          },
        ],
      };

      let createdAssetId = assetId;

      if (isApi) {
        if (!idempotencyKeyRef.current) idempotencyKeyRef.current = generateUUID();
        const receiveIdempotencyKey = idempotencyKeyRef.current;
        const response = await apiClient<any>("/purchase-orders/receive", {
          method: "POST",
          idempotencyKey: receiveIdempotencyKey,
          locale,
          body: JSON.stringify({
            id: purchaseOrderId,
            supplierId: selectedSupplier.id,
            date: dateStr,
            receivedDate: dateStr,
            supplierName: selectedSupplier.name,
            stockType: isQuantityBased ? assetType : canonicalAssetType,
            itemName: assetName,
            description: category.trim(),
            purchaseDate: dateStr,
            branchId: activeBranchId,
            warehouseId: activeBranchId,
            total: totalCost,
            totalCost,
            paidAmount: paidAmountNum,
            remainingAmount,
            paymentStatus,
            paymentMethod,
            // Phase 12J — purchase VAT / RCM. RCM (DRC) takes precedence; else
            // ordinary VAT when applyVat; else no VAT (default path unchanged).
            ...(useReverseCharge
              ? { applyVat: true, isRcm: true, isDRC: true, reverseVat: true, useReverseCharge: true, rcmRate: vatRateNum, taxIncluded: false, isRecoverable: true }
              : applyVat
              ? { applyVat: true, vatRate: vatRateNum, taxIncluded, isRecoverable, isRcm: false }
              : { applyVat: false }),
            notes: [notes.trim(), `${rtl ? "توريد أصل" : "Asset purchase"}: ${assetName}. ${rtl ? "الاحتساب العكسي: " : "DRC: "} ${useReverseCharge ? (rtl ? "نعم" : "Yes") : (rtl ? "لا" : "No")}`].filter(Boolean).join(" | "),
            isConsignment: Boolean(selectedSupplier.isConsignment),
            items: [
              {
                name: assetName,
                type: isQuantityBased ? assetType : canonicalAssetType,
                inventoryCode: selectedInventoryCode?.code,
                itemCode: isQuantityBased ? undefined : itemCode,
                inventorySubtype: assetType === "watch" ? "watch" : undefined,
                category: category.trim() || (rtl ? "خام" : "Raw material"),
                karat: Number(effectiveKarat) || undefined,
                weightPerUnit: isQuantityBased ? weightPerUnitNum : totalWeight / quantityNum,
                grossWeight: isQuantityBased ? weightPerUnitNum : totalWeight / quantityNum,
                netWeight: isQuantityBased ? weightPerUnitNum : totalWeight / quantityNum,
                unitCost: isQuantityBased ? unitCostNum : (goldValuationApplicable ? 0 : totalCost / quantityNum),
                cost: isQuantityBased ? unitCostNum : (goldValuationApplicable ? 0 : totalCost / quantityNum),
                price: isQuantityBased ? salePriceNum : (goldValuationApplicable ? 0 : totalCost / quantityNum),
                quantity: quantityNum,
                unit: rtl ? "قطعة" : "piece",
                location: "Showroom",
                notes: useReverseCharge ? "Domestic reverse charge verified" : "",
                productCode: isQuantityBased ? productCode.trim() : undefined,
                ...(!isQuantityBased ? {
                  perPiece: pieceDrafts.map((piece, index) => ({
                    name: quantityNum > 1 ? `${assetName} ${index + 1}` : assetName,
                    description: piece.description.trim() || assetName,
                    type: canonicalAssetType,
                    category: category.trim() || "Received purchase",
                    inventoryProfile,
                    profile: inventoryProfile,
                    inventoryCode: selectedInventoryCode?.code,
                    itemCode,
                    karat: profileRequires("karat") ? Number(effectiveKarat) || null : null,
                    grossWeight: parseDecimal(piece.grossWeight),
                    stoneWeight: parseDecimal(piece.stoneWeight),
                    purchaseCost: goldValuationApplicable ? undefined : parseDecimal(piece.purchaseCost),
                    goldValue: goldValuationApplicable ? undefined : parseDecimal(piece.purchaseCost),
                    ...(goldValuationApplicable ? {
                      goldValuation: {
                        purchaseGoldRate: parseDecimal(piece.purchaseGoldRate),
                        purchaseRateOverrideReason: piece.purchaseRateOverridden ? piece.purchaseRateOverrideReason.trim() : undefined,
                        makingPerGram: is24kGoldBar ? undefined : parseDecimal(piece.makingPerGram),
                        // The server resolves the canonical current rate from
                        // Gold Center; this value is display evidence only.
                        currentGoldRate: parseDecimal(piece.currentGoldRate),
                        currentMakingPerGram: is24kGoldBar ? undefined : parseDecimal(piece.currentMakingPerGram || piece.makingPerGram),
                        certificateCost: is24kGoldBar ? parseDecimal(piece.certificateCost) : undefined,
                        currentCertificateCost: is24kGoldBar ? parseDecimal(piece.currentCertificateCost || piece.certificateCost) : undefined,
                        vatRate: is24kGoldBar && piece.valuationVatRate.trim() ? parseDecimal(piece.valuationVatRate) : undefined,
                        currentVatRate: is24kGoldBar && piece.currentValuationVatRate.trim() ? parseDecimal(piece.currentValuationVatRate) : undefined,
                      },
                    } : {}),
                    ...(isLooseProfile ? { looseDetails: {
                      stoneName: piece.stoneName.trim() || undefined, diamondType: piece.diamondType.trim() || undefined,
                      carat: piece.carat.trim() || undefined, color: piece.color.trim() || undefined,
                      clarity: piece.clarity.trim() || undefined, cut: piece.cut.trim() || undefined, shape: piece.shape.trim() || undefined,
                      treatment: piece.treatment.trim() || undefined, tone: piece.tone.trim() || undefined, toneLevel: piece.toneLevel.trim() || undefined,
                      saturation: piece.saturation.trim() || undefined, opticalEffect: piece.opticalEffect.trim() || undefined, origin: piece.origin.trim() || undefined,
                      totalPearlWeight: piece.totalPearlWeight.trim() || undefined,
                      pearlSizeId: piece.pearlSize.trim() || undefined, pearlType: piece.pearlType.trim() || undefined,
                      overtone: piece.overtone.trim() || undefined, orient: piece.orient.trim() || undefined, luster: piece.luster.trim() || undefined,
                      surfaceQuality: piece.surfaceQuality.trim() || undefined, nacreQuality: piece.nacreQuality.trim() || undefined, notes: piece.looseNotes.trim() || undefined,
                      masterData: piece.masterData,
                    }} : {}),
                    ...(isLooseProfile ? { looseFinancial: {
                      purchaseCost: parseDecimal(piece.purchaseCost), additionalCost: parseDecimal(piece.additionalCost) || 0,
                      vatRate: applyVat && piece.valuationVatRate.trim() ? parseDecimal(piece.valuationVatRate) : undefined,
                    }, looseCurrentValuation: {
                      currentValue: parseDecimal(piece.currentValue || piece.purchaseCost),
                      currentVatRate: applyVat && piece.currentVatRate.trim() ? parseDecimal(piece.currentVatRate) : undefined,
                    }, pricing: {
                      markupPercent: parseDecimal(piece.markupPercent), maximumDiscountPercent: parseDecimal(piece.maximumDiscountPercent),
                      minimumSellingPrice: parseDecimal(piece.minimumSellingPrice), sellingPrice: parseDecimal(piece.sellingPrice),
                    }} : {}),
                    condition: conditionApplicable ? (piece.condition || null) : null,
                    goldColor: piece.goldColor.trim() || null,
                    brand: piece.brand.trim() || null,
                    model: piece.model.trim() || null,
                    modelNumber: piece.modelNumber.trim() || null,
                    supplierReference: piece.supplierReference.trim() || null,
                    locationId: piece.locationId.trim() || null,
                    ...(piece.certificateIssuer || piece.masterData.certificateAuthority || piece.certificateNumber || piece.certificateIssueDate || piece.certificateUrl ? {
                      certificate: {
                        issuer: piece.certificateIssuer.trim(),
                        issuerId: piece.masterData.certificateAuthority || undefined,
                        certificateNumber: piece.certificateNumber.trim(),
                        issueDate: piece.certificateIssueDate,
                        url: piece.certificateUrl.trim() || null,
                      },
                    } : {}),
                    components: Array.isArray(piece.components) && piece.components.length ? piece.components : undefined,
                  })),
                } : {}),
              },
            ],
            ...(!isQuantityBased ? { inventoryV2: true } : {}),
          }),
        });
        const createdAssets = response?.assets || response?.data?.assets || [];
        if (createdAssets.length !== pieceDrafts.length) throw new Error("The canonical receipt response did not return one Asset per physical piece.");
        for (const [index, piece] of pieceDrafts.entries()) {
          if (!piece.attachment) continue;
          const targetAsset = createdAssets[index];
          if (!targetAsset?.id) throw new Error("The received Asset identity is missing for attachment upload.");
          const formData = new FormData();
          formData.append("file", piece.attachment);
          await apiClient(`/assets/${encodeURIComponent(targetAsset.id)}/attachments`, {
            method: "POST",
            body: formData,
            idempotencyKey: `${receiveIdempotencyKey}:attachment:${index}`,
            locale,
          });
        }
        idempotencyKeyRef.current = ""; // all durable receipt evidence succeeded → next receipt gets a fresh key
        createdAssetId = createdAssets[0]?.id || assetId;
        invalidateAffectedQueries(queryClient, {
          entity: "PurchaseOrder",
          action: "receive",
          id: purchaseOrderId,
          branchId: activeBranchId,
          related: {
            supplierId: selectedSupplier.id,
            purchaseOrderId,
            assetIds: response?.assets?.map((asset: Asset) => asset.id) || response?.data?.assets?.map((asset: Asset) => asset.id) || [createdAssetId],
          },
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
          queryClient.invalidateQueries({ queryKey: ["supplier", selectedSupplier.id] }),
          queryClient.invalidateQueries({ queryKey: ["supplier-purchase-orders", selectedSupplier.id] }),
          queryClient.invalidateQueries({ queryKey: ["purchase-orders"] }),
          queryClient.invalidateQueries({ queryKey: ["assets"] }),
          queryClient.invalidateQueries({ queryKey: ["products"] }),
          queryClient.invalidateQueries({ queryKey: ["inventoryProducts"] }),
          queryClient.invalidateQueries({ queryKey: ["posProducts"] }),
          queryClient.invalidateQueries({ queryKey: ["stock-movements"] }),
          queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
          queryClient.invalidateQueries({ queryKey: ["reports"] }),
          queryClient.invalidateQueries({ queryKey: ["accounting"] }),
          queryClient.invalidateQueries({ queryKey: ["treasury"] }),
          queryClient.invalidateQueries({ queryKey: ["notifications"] }),
          queryClient.invalidateQueries({ queryKey: ["audit-logs"] }),
        ]);
        await refreshSuppliers();
      } else {
        for (let i = 0; i < quantityNum; i++) {
          await createAsset({
            ...newAssetItem,
            id: `${assetId}-${i + 1}`,
            name: quantityNum > 1 ? `${assetName} ${i + 1}` : assetName,
            barcode: `LOCAL-PENDING-${timestamp + i}`,
          });
        }
      }

      setSuccessMsg(
        rtl
          ? `تم استلام الشحنة وحفظ أمر الشراء ${purchaseOrderId} بنجاح.`
          : `Shipment received, purchase order ${purchaseOrderId} saved, and inventory updated successfully.`
      );

      // Reset form
      setProductCode("");
      setSalePrice("");
      setMatchingProduct(null);
      setAssetName("");
      setQuantity("1");
      setWeightPerUnit("");
      setUnitCost("");
      setPaidAmount("0");
      setPaymentMethod("credit");
      setPurchaseDate(new Date().toISOString().slice(0, 10));
      setNotes("");
      setCategory("");
      setItemCode("RNG");
      setUseReverseCharge(false);
      setDrcVerified(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to post purchase.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/suppliers" className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-brand-700">
            <BackIcon className="h-4 w-4" />{common("back")}
          </Link>
          <h1 className="text-2xl font-black text-navy-950 dark:text-white lg:text-3xl">
            {rtl ? "استلام التوريدات وأوامر الشراء" : "Purchase Orders & Receiving"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {rtl ? "شراء أصول جديدة وتسجيلها بالمخزون مع تطبيق ضريبة الاحتساب العكسي" : "Record new asset purchases, manage margins, and apply reverse charge compliance."}
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800 dark:border-rose-950/40 dark:bg-rose-950/10 dark:text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,8fr)_minmax(280px,4fr)]">
        {/* Purchase Form */}
        <Card className="min-w-0 p-4 lg:p-5">
          <form onSubmit={handlePostPurchase} className="space-y-4">
            <h3 className="text-sm font-black text-navy-950 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              {rtl ? "تفاصيل الشحنة والأصل الوارد" : "Incoming Consignment & Asset Details"}
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <span className="label-base font-bold">{rtl ? "نوع الإدخال" : "Inventory Model"}</span>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={isQuantityBased}
                      onChange={() => {
                        setIsQuantityBased(true);
                        setProductCode("");
                        setMatchingProduct(null);
                      }}
                      className="text-brand-600 focus:ring-brand-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-navy-800 dark:text-slate-200">
                      {rtl ? "منتج قديم بالكمية (توافق فقط)" : "Legacy Quantity Product (compatibility only)"}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!isQuantityBased}
                      onChange={() => {
                        setIsQuantityBased(false);
                        setProductCode("");
                        setMatchingProduct(null);
                      }}
                      className="text-brand-600 focus:ring-brand-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-navy-800 dark:text-slate-200">
                      {rtl ? "استلام أصول فعلية منفصلة" : "Serialized Physical Assets"}
                    </span>
                  </label>
                </div>
              </div>

              <label className="block">
                <span className="label-base">{rtl ? "المورد" : "Supplier"}</span>
                <NativeSelect value={supplierId} onChange={(e) => setSupplierId(e.target.value)} disabled={suppliersLoading || Boolean(suppliersError)}>
                  <option value="">{rtl ? "اختر المورد" : "Select supplier"}</option>
                  {activeSuppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}{(supplier as any).code ? ` - ${(supplier as any).code}` : supplier.category ? ` · ${supplier.category}` : ""}
                    </option>
                  ))}
                </NativeSelect>
                {suppliersLoading && <p className="mt-2 text-[11px] font-bold text-slate-400">{rtl ? "جاري تحميل الموردين..." : "Loading suppliers..."}</p>}
                {suppliersError && (
                  <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700 dark:border-rose-950/40 dark:bg-rose-950/10 dark:text-rose-300">
                    <span>{rtl ? "تعذر تحميل الموردين" : "Failed to load suppliers"}</span>
                    <button type="button" onClick={refreshSuppliers} className="underline">{common("refresh")}</button>
                  </div>
                )}
                {!suppliersLoading && !suppliersError && activeSuppliers.length === 0 && (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700 dark:border-amber-900/40 dark:bg-amber-500/10 dark:text-amber-300">
                    <span>{rtl ? "لا يوجد موردون منشأون بعد." : "No suppliers created."}</span>
                    <Link href="/suppliers" className="underline">{rtl ? "إضافة مورد" : "Add supplier"}</Link>
                  </div>
                )}
              </label>

              {isQuantityBased ? (
                <label className="block">
                  <span className="label-base">{rtl ? "رمز المنتج (يدوي)" : "Product Code (Manual)"} <span className="text-rose-500">*</span></span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LULU-001"
                    className="input-base font-mono uppercase"
                    value={productCode}
                    onChange={(e) => handleProductCodeChange(e.target.value)}
                  />
                </label>
              ) : (
                <div />
              )}

              {isQuantityBased && matchingProduct && (
                <div className="sm:col-span-2 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-xs font-bold text-amber-900 dark:border-amber-900/50 dark:bg-amber-500/10 dark:text-amber-300">
                  <p>
                    ⚠️ {rtl 
                      ? `رمز المنتج موجود بالفعل لمنتج: "${matchingProduct.productName}".` 
                      : `Product Code already exists for: "${matchingProduct.productName}".`}
                  </p>
                  <p className="mt-1 font-semibold text-slate-500 dark:text-slate-400">
                    {rtl 
                      ? `استلام هذا التوريد سيقوم بإضافة ${quantityNum} قطعة إلى المخزون (المخزون الحالي: ${matchingProduct.quantityOnHand}) وسيعيد احتساب متوسط التكلفة وتحديث سعر البيع.` 
                      : `Receiving this consignment will add ${quantityNum} unit(s) to stock (current: ${matchingProduct.quantityOnHand}) and recalculate the average unit cost and update the sale price.`}
                  </p>
                </div>
              )}

              <label className="block">
                <span className="label-base">
                  {isQuantityBased ? (rtl ? "اسم المنتج" : "Product Name") : (rtl ? "اسم الأصل الوارد" : "Asset Name")}
                </span>
                <input type="text" required className="input-base" placeholder={rtl ? "خاتم ذهب، سبيكة..." : "Gold ring, bullion..."} value={assetName} onChange={(e) => setAssetName(e.target.value)} />
              </label>

              {isQuantityBased ? (
                <label className="block">
                  <span className="label-base">{rtl ? "نوع المخزون" : "Inventory Type"}</span>
                  <NativeSelect value={assetType} onChange={(e) => setAssetType(e.target.value as AssetType)}>
                    <option value="gold-piece">{rtl ? "ذهب بالقطعة" : "Gold by Piece"}</option>
                    <option value="gold-weight">{rtl ? "ذهب بالوزن" : "Gold by Weight"}</option>
                    <option value="diamond">{rtl ? "ألماس" : "Diamond"}</option>
                    <option value="gemstone">{rtl ? "أحجار كريمة" : "Gemstones"}</option>
                    <option value="pearl">{rtl ? "لؤلؤ" : "Pearl"}</option>
                    <option value="watch">{rtl ? "ساعات" : "Watch"}</option>
                  </NativeSelect>
                </label>
              ) : (
                <label className="block">
                  <span className="label-base">{rtl ? "Profile المخزون" : "Inventory Profile"}</span>
                  <NativeSelect value={inventoryProfile} disabled={profilesLoading || profileContracts.length === 0 || isPosting} onChange={(e) => handleInventoryProfileChange(e.target.value)}>
                    {profileContracts.map((profile) => {
                      const presentation = PROFILE_PRESENTATION[profile.key] || { label: profile.key, labelAr: profile.key };
                      const isCgpOption = profile.key === "CGP_CUSTOMER_GOLD_PURCHASE";
                      return <option key={profile.key} value={profile.key} disabled={isCgpOption}>{isCgpOption ? (rtl ? `${presentation.labelAr} — غير متاح في استلام المورد` : `${presentation.label} — unavailable in Supplier Receive`) : (rtl ? presentation.labelAr : presentation.label)}</option>;
                    })}
                  </NativeSelect>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {profilesLoading ? (rtl ? "جاري تحميل عقد الحقول المعتمد..." : "Loading canonical field contract...") : (rtl ? `Profile الحالي: ${selectedProfilePresentation.labelAr}. الحقول المطلوبة يحسمها الخادم عند الحفظ.` : `Current Profile: ${selectedProfilePresentation.label}. The server is authoritative for required fields on save.`)}
                  </p>
                </label>
              )}

              {!isQuantityBased && <label className="block">
                <span className="label-base">{rtl ? "كود القطعة" : "Item Code"}</span>
                <NativeSelect value={itemCode} onChange={(e) => setItemCode(e.target.value)} disabled={availableItemCodes.length === 0}>
                  <option value="">{rtl ? "اختر كود القطعة" : "Select item code"}</option>
                  {availableItemCodes.map((code) => <option key={code.id} value={code.code}>{code.code} — {code.displayName}</option>)}
                </NativeSelect>
                {availableItemCodes.length === 0 && <p className="mt-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700 dark:border-rose-950/40 dark:bg-rose-950/10 dark:text-rose-300">{rtl ? "لا توجد أكواد قطع نشطة لهذا النوع. أكمل إعداد تصنيف المخزون قبل الاستلام." : "No active item codes exist for this inventory type. Complete inventory taxonomy setup before receiving."}</p>}
              </label>}

              <label className="block">
                <span className="label-base">{rtl ? "التصنيف" : "Category"}</span>
                <input type="text" placeholder={rtl ? "مثال: خواتم، سبائك" : "e.g. rings, bars"} className="input-base" value={category} onChange={(e) => setCategory(e.target.value)} />
              </label>

              {profileRequires("karat") && <label className="block">
                <span className="label-base">{rtl ? "العيار" : "Karat"}</span>
                <NativeSelect disabled={selectedInventoryCode?.requiresKarat === false || is24kGoldBar} value={effectiveKarat} onChange={(e) => setKarat(e.target.value)}>
                  {selectedInventoryCode?.requiresKarat === false && <option value="">{selectedInventoryCode.defaultKaratCode || "00"}</option>}
                  <option value="14">14K</option>
                  <option value="18">18K</option>
                  <option value="21">21K</option>
                  <option value="22">22K</option>
                  <option value="24">24K</option>
                </NativeSelect>
              </label>}

              {!isQuantityBased && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-navy-950/40">
                <p className="font-black text-navy-950 dark:text-white">{rtl ? "الفرع التشغيلي" : "Operational Branch"} <span className="text-rose-500">*</span></p>
                <p className="mt-1 font-semibold text-slate-600 dark:text-slate-300">{activeBranch || (rtl ? "لا يوجد فرع نشط" : "No active Branch")}</p>
                <p className="mt-1 text-[10px] text-slate-500">{rtl ? "الشركة محددة من الجلسة، ولا يوجد اختيار شركة في شاشة الاستلام." : "Company is server-scoped; this intake screen has no Company switcher."}</p>
              </div>}

              <label className="block">
                <span className="label-base">{rtl ? "تاريخ الشراء" : "Purchase Date"}</span>
                <DateInput
                  required
                  className="input-base"
                  value={purchaseDate}
                  onChange={setPurchaseDate}
                />
              </label>

              <label className="block">
                <span className="label-base">{isQuantityBased ? (rtl ? "الكمية" : "Quantity") : (rtl ? "كمية المستند / عدد القطع الفعلية" : "Document quantity / physical pieces")}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  required
                  placeholder="12"
                  className="input-base"
                  value={toEnglishDigits(quantity)}
                  onChange={(e) => setQuantity(normalizeNumberInput(e.target.value).replace(/[.,-]/g, ""))}
                />
              </label>

              {isQuantityBased && <label className="block">
                <span className="label-base">{rtl ? "وزن الوحدة (جم)" : "Weight per Unit (g)"}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  required
                  placeholder="1"
                  className="input-base"
                  value={toEnglishDigits(weightPerUnit)}
                  onChange={(e) => setWeightPerUnit(normalizeDecimalValue(e.target.value))}
                />
              </label>}

              {isQuantityBased && <label className="block">
                <span className="label-base">{rtl ? "سعر تكلفة الوحدة" : "Unit Cost"}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  required
                  placeholder="100"
                  className="input-base"
                  value={toEnglishDigits(unitCost)}
                  onChange={(e) => setUnitCost(normalizeDecimalValue(e.target.value))}
                />
              </label>}

              {isQuantityBased ? (
                <label className="block">
                  <span className="label-base">{rtl ? "سعر بيع الوحدة" : "Unit Sale Price"} <span className="text-rose-500">*</span></span>
                  <input
                    type="text"
                    inputMode="decimal"
                    dir="ltr"
                    required
                    placeholder="251"
                    className="input-base"
                    value={toEnglishDigits(salePrice)}
                    onChange={(e) => setSalePrice(normalizeDecimalValue(e.target.value))}
                  />
                </label>
              ) : (
                <div className="sm:col-span-2 rounded-2xl border border-brand-200 bg-brand-50/60 p-3 text-[11px] font-bold text-brand-800 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-100">
                  {rtl ? "كل سجل قطعة أدناه ينشئ Asset مستقلًا وBarcode مستقلًا. الكمية هنا للمستند فقط." : "Each piece record below creates one distinct Asset and Barcode. The quantity here is document metadata only."}
                </div>
              )}

              <label className="block">
                <span className="label-base">{rtl ? "طريقة الدفع" : "Payment Method"}</span>
                <NativeSelect value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="credit">{rtl ? "آجل / بدون دفع" : "Credit / Unpaid"}</option>
                  <option value="cash">{rtl ? "نقدي" : "Cash"}</option>
                  <option value="bank_transfer">{rtl ? "تحويل بنكي" : "Bank Transfer"}</option>
                  <option value="card">{rtl ? "بطاقة" : "Card"}</option>
                </NativeSelect>
              </label>

              <label className="block">
                <span className="label-base">{rtl ? "المبلغ المدفوع" : "Paid Amount"}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  placeholder="0"
                  className="input-base"
                  value={toEnglishDigits(paidAmount)}
                  onChange={(e) => setPaidAmount(normalizeDecimalValue(e.target.value))}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="label-base">{rtl ? "ملاحظات" : "Notes"}</span>
                <textarea
                  className="input-base min-h-[84px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
            </div>

            {!isQuantityBased && isCgpProfile && (
              <section className="rounded-3xl border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                {rtl ? "شراء الذهب من العميل له مسار مستقل في المبيعات والعملاء؛ لا تستخدم شاشة استلام الموردين لهذه العملية." : "Customer Gold Purchase has a dedicated Sales & Customers workflow; Supplier Receipt must not be used for this operation."}
              </section>
            )}

            {!isQuantityBased && !isCgpProfile && (
              <section className="space-y-3 rounded-3xl border border-brand-200 bg-brand-50/40 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
                <div>
                  <h3 className="text-sm font-black text-navy-950 dark:text-white">{rtl ? "تفاصيل القطع الفعلية" : "Physical piece details"}</h3>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">{rtl ? "لا يتم إنشاء أي Asset من العدد وحده؛ يجب إدخال سجل مستقل لكل قطعة." : "No Asset is created from the count alone; every physical piece needs its own record."}</p>
                </div>
                {pieceDrafts.map((piece, index) => (
                  <div key={index} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-navy-950/40 sm:grid-cols-2 lg:grid-cols-4">
                    <p className="text-xs font-black text-brand-700 dark:text-brand-200 sm:col-span-2 lg:col-span-4">{rtl ? `القطعة ${index + 1}` : `Piece ${index + 1}`}</p>
                    <label className="block sm:col-span-2"><span className="label-base">{rtl ? "وصف القطعة" : "Piece description"}{profileRequires("description") && <span className="text-rose-500"> *</span>}</span><input required={profileRequires("description")} type="text" className="input-base" value={piece.description} placeholder={assetName || (rtl ? "مثال: خاتم ذهب" : "e.g. Gold ring")} onChange={(e) => updatePieceDraft(index, "description", e.target.value)} /></label>
                    {weightApplicable && <><label className="block"><span className="label-base">{rtl ? "الوزن الإجمالي (جم)" : "Gross weight (g)"}{profileRequires("grossWeight") && <span className="text-rose-500"> *</span>}</span><input required={profileRequires("grossWeight")} type="text" inputMode="decimal" dir="ltr" className="input-base" value={toEnglishDigits(piece.grossWeight)} onChange={(e) => updatePieceDraft(index, "grossWeight", normalizeDecimalValue(e.target.value))} /></label>
                    <label className="block"><span className="label-base">{rtl ? "وزن الأحجار (جم)" : "Stone weight (g)"}</span><input type="text" inputMode="decimal" dir="ltr" className="input-base" value={toEnglishDigits(piece.stoneWeight)} onChange={(e) => updatePieceDraft(index, "stoneWeight", normalizeDecimalValue(e.target.value))} /></label></>}
                    {!goldValuationApplicable && !isLooseProfile && <label className="block"><span className="label-base">{rtl ? "تكلفة الشراء للقطعة" : "Piece purchase cost"}{profileRequires("purchaseCost") && <span className="text-rose-500"> *</span>}</span><input required={profileRequires("purchaseCost")} type="text" inputMode="decimal" dir="ltr" className="input-base" value={toEnglishDigits(piece.purchaseCost)} onChange={(e) => updatePieceDraft(index, "purchaseCost", normalizeDecimalValue(e.target.value))} /></label>}
                    {goldValuationApplicable && <div className="grid gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3 sm:col-span-2 lg:col-span-4 dark:border-amber-500/30 dark:bg-amber-500/10 sm:grid-cols-2 lg:grid-cols-2">
                      <p className="text-xs font-black text-amber-800 dark:text-amber-200 sm:col-span-2 lg:col-span-2">{rtl ? "التقييم المرجعي للذهب — Gold Center" : "Gold Center reference valuation"}</p>
                      <label className="block"><span className="label-base">{rtl ? "سعر الذهب وقت الشراء / جم" : "Purchase gold rate / g"} *</span>{canOverridePurchaseRate ? <input required type="text" inputMode="decimal" dir="ltr" className="input-base" value={toEnglishDigits(piece.purchaseGoldRate)} onChange={(e) => updatePieceDraft(index, "purchaseGoldRate", normalizeDecimalValue(e.target.value))} /> : <output className="input-base block bg-slate-100" dir="ltr">{toEnglishDigits(piece.purchaseGoldRate || goldReferenceRate || "—")}</output>}<p className="mt-1 text-[10px] text-slate-500">{rtl ? `المرجع الحالي: ${piece.purchaseRateReference || goldReferenceRate || "غير متاح"}` : `Reference: ${piece.purchaseRateReference || goldReferenceRate || "unavailable"}`}</p></label>
                      {piece.purchaseRateOverridden && <p className="rounded-xl border border-orange-300 bg-orange-50 p-2 text-[11px] font-black text-orange-800 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-100 sm:col-span-2">{rtl ? "تم تعديل سعر الشراء يدويًا — سيُسجل السبب ويُثبت عند الاستلام." : "Purchase rate manually overridden — the reason will be audited and frozen at receipt."}</p>}
                      {canOverridePurchaseRate && piece.purchaseRateOverridden && <label className="block"><span className="label-base">{rtl ? "سبب تعديل سعر الشراء" : "Purchase-rate override reason"} *</span><input required type="text" className="input-base" value={piece.purchaseRateOverrideReason} onChange={(e) => updatePieceDraft(index, "purchaseRateOverrideReason", e.target.value)} /></label>}
                      {!is24kGoldBar && <label className="block"><span className="label-base">{rtl ? "مصنعية الشراء / جم" : "Purchase making / g"}</span><input type="text" inputMode="decimal" dir="ltr" className="input-base" value={toEnglishDigits(piece.makingPerGram)} onChange={(e) => updatePieceDraft(index, "makingPerGram", normalizeDecimalValue(e.target.value))} /></label>}
                      <div className="block rounded-xl border border-emerald-200 bg-emerald-50/70 p-2"><span className="label-base">{rtl ? "سعر الذهب الحالي / جم (مرجع خادمي، للقراءة فقط)" : "Current gold rate / g (server reference, read-only)"}</span><output className="mt-1 block font-mono text-sm font-black" dir="ltr">{toEnglishDigits(piece.currentGoldRate || goldReferenceRate || "—")}</output><span className="label-base mt-2 block">{rtl ? "القيمة الحالية المشتقة (عرض فقط)" : "Derived current value (display only)"}</span><output className="mt-1 block font-mono text-sm font-black" dir="ltr">{toEnglishDigits(currentGoldValuePreview(piece) || "—")}</output><p className="mt-1 text-[10px] text-slate-500">{goldReferenceLoading ? (rtl ? "جارٍ تحديث Gold Center…" : "Refreshing Gold Center…") : (goldReferenceStatus || (rtl ? "غير متاح" : "Unavailable"))}</p></div>
                      {!is24kGoldBar && <label className="block"><span className="label-base">{rtl ? "مصنعية التقييم الحالي / جم" : "Current making / g"}</span><input type="text" inputMode="decimal" dir="ltr" className="input-base" value={toEnglishDigits(piece.currentMakingPerGram)} onChange={(e) => updatePieceDraft(index, "currentMakingPerGram", normalizeDecimalValue(e.target.value))} /></label>}
                      {is24kGoldBar && <><label className="block"><span className="label-base">{rtl ? "تكلفة الشهادة وقت الشراء" : "Purchase certificate cost"} *</span><input required type="text" inputMode="decimal" dir="ltr" className="input-base" value={toEnglishDigits(piece.certificateCost)} onChange={(e) => updatePieceDraft(index, "certificateCost", normalizeDecimalValue(e.target.value))} /></label><label className="block"><span className="label-base">{rtl ? "تكلفة الشهادة الحالية" : "Current certificate cost"} *</span><input required type="text" inputMode="decimal" dir="ltr" className="input-base" value={toEnglishDigits(piece.currentCertificateCost)} onChange={(e) => updatePieceDraft(index, "currentCertificateCost", normalizeDecimalValue(e.target.value))} /></label><label className="block"><span className="label-base">{rtl ? "نسبة VAT للشهادة % (يدوي أو إعدادات)" : "Certificate VAT rate % (manual or Settings)"}</span><input type="text" inputMode="decimal" dir="ltr" className="input-base" value={toEnglishDigits(piece.valuationVatRate)} onChange={(e) => updatePieceDraft(index, "valuationVatRate", normalizeDecimalValue(e.target.value))} /></label><label className="block"><span className="label-base">{rtl ? "نسبة VAT الحالية للشهادة %" : "Current certificate VAT rate %"}</span><input type="text" inputMode="decimal" dir="ltr" className="input-base" value={toEnglishDigits(piece.currentValuationVatRate)} onChange={(e) => updatePieceDraft(index, "currentValuationVatRate", normalizeDecimalValue(e.target.value))} /></label></>}
                      <p className="text-[10px] text-amber-800 dark:text-amber-100 sm:col-span-2 lg:col-span-2">{rtl ? "سعر الشراء قابل للتعديل المصرح فقط مع سبب مدقق؛ السعر الحالي من Gold Center للقراءة فقط. القيم النهائية وVAT يحسبها الخادم، وVAT لسبيكة 24K على الشهادة فقط." : "Purchase rate is editable only for an authorized user with an audited reason; current rate is read-only from Gold Center. The server calculates final values and certificate-only VAT for 24K bars."}</p>
                    </div>}
                    {isLooseProfile && <>
                      <div className="grid gap-3 rounded-xl border border-violet-200 bg-violet-50/40 p-3 sm:col-span-2 lg:col-span-4 dark:border-violet-500/30 dark:bg-violet-500/10 sm:grid-cols-2 lg:grid-cols-4">
                        <p className="text-xs font-black text-violet-900 dark:text-violet-100 sm:col-span-2 lg:col-span-4">{rtl ? "تفاصيل القطعة السائبة — سجل واحد يمثل Asset واحداً" : "Loose-piece details — one record is one Asset"}</p>
                        {inventoryProfile === "LOOSE_GEMSTONE" && <label className="block"><span className="label-base">{rtl ? "وزن الحجر بالقيراط CT" : "Stone weight (CT)"} *</span><input required type="text" inputMode="decimal" className="input-base" value={piece.carat} onChange={(e) => { const value = decimalInputAtMost(e.target.value, 3); if (value !== null) updatePieceDraft(index, "carat", value); }} /><p className="mt-1 text-[10px] text-slate-500">{rtl ? "حتى 3 منازل؛ العرض التجاري يحسبه الخادم إلى منزلتين وفق CIBJO." : "Up to 3 decimals; the server calculates the 2-decimal commercial display using CIBJO."}</p></label>}
                        {inventoryProfile === "LOOSE_PEARL" && <><label className="block"><span className="label-base">{rtl ? "إجمالي وزن اللؤلؤ (CT)" : "Total pearl weight (CT)"} *</span><input required type="text" inputMode="decimal" className="input-base" value={piece.totalPearlWeight} onChange={(e) => { const value = decimalInputAtMost(e.target.value, 2); if (value !== null) updatePieceDraft(index, "totalPearlWeight", value); }} /></label><label className="block"><span className="label-base">{rtl ? "المقاس (mm) — اختياري" : "Size (mm) — optional"}</span><NativeSelect value={piece.pearlSize} onChange={(e) => updatePieceDraft(index, "pearlSize", e.target.value)}><option value="">{rtl ? "غير محدد" : "Not specified"}</option>{pearlSizeMasterValues.map((size) => <option key={size.id} value={size.id}>{size.label}</option>)}</NativeSelect></label></>}
                        {(LOOSE_MASTER_FIELDS[inventoryProfile] || []).map((field) => <label key={field.field} className="block"><span className="label-base">{rtl ? field.labelAr : field.label}{field.required && <span className="text-rose-500"> *</span>}</span><NativeSelect required={Boolean(field.required)} value={piece.masterData[field.field] || ""} onChange={(e) => updatePieceMasterData(index, field.field, e.target.value)}><option value="">{rtl ? "اختر قيمة معتمدة" : "Select an approved value"}</option>{masterOptions(field.category).map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</NativeSelect></label>)}
                      </div>
                      <div className="grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 sm:col-span-2 lg:col-span-4 dark:border-emerald-500/30 dark:bg-emerald-500/10 sm:grid-cols-2 lg:grid-cols-4">
                        <p className="text-xs font-black text-emerald-900 dark:text-emerald-100 sm:col-span-2 lg:col-span-4">{rtl ? "التكلفة والتقييم والتسعير السائب — الحساب الخادمي هو المرجع" : "Loose cost, valuation and pricing — server calculations are authoritative"}</p>
                        <label className="block"><span className="label-base">{rtl ? "تكلفة الشراء الأساسية" : "Purchase base cost"} *</span><input required type="text" inputMode="decimal" className="input-base" value={toEnglishDigits(piece.purchaseCost)} onChange={(e) => updatePieceDraft(index, "purchaseCost", normalizeDecimalValue(e.target.value))} /></label>
                        {inventoryProfile === "LOOSE_GEMSTONE" && <label className="block"><span className="label-base">{rtl ? "تكاليف إضافية" : "Additional cost"}</span><input type="text" inputMode="decimal" className="input-base" value={toEnglishDigits(piece.additionalCost)} onChange={(e) => updatePieceDraft(index, "additionalCost", normalizeDecimalValue(e.target.value))} /></label>}
                        <label className="block"><span className="label-base">{rtl ? "نسبة VAT للشراء % (اختيارية)" : "Purchase VAT rate % (optional)"}</span><input type="text" inputMode="decimal" className="input-base" value={toEnglishDigits(piece.valuationVatRate)} onChange={(e) => updatePieceDraft(index, "valuationVatRate", normalizeDecimalValue(e.target.value))} /></label>
                        <label className="block"><span className="label-base">{rtl ? "القيمة الحالية" : "Current value"} *</span><input required type="text" inputMode="decimal" className="input-base" value={toEnglishDigits(piece.currentValue)} onChange={(e) => updatePieceDraft(index, "currentValue", normalizeDecimalValue(e.target.value))} /></label>
                        <label className="block"><span className="label-base">{rtl ? "نسبة VAT الحالية % (اختيارية)" : "Current VAT rate % (optional)"}</span><input type="text" inputMode="decimal" className="input-base" value={toEnglishDigits(piece.currentVatRate)} onChange={(e) => updatePieceDraft(index, "currentVatRate", normalizeDecimalValue(e.target.value))} /></label>
                        <label className="block"><span className="label-base">{rtl ? "نسبة الربح %" : "Markup %"}</span><input type="text" inputMode="decimal" className="input-base" value={toEnglishDigits(piece.markupPercent)} onChange={(e) => updatePieceDraft(index, "markupPercent", normalizeDecimalValue(e.target.value))} /></label>
                        <label className="block"><span className="label-base">{rtl ? "أقصى خصم %" : "Maximum discount %"}</span><input type="text" inputMode="decimal" className="input-base" value={toEnglishDigits(piece.maximumDiscountPercent)} onChange={(e) => updatePieceDraft(index, "maximumDiscountPercent", normalizeDecimalValue(e.target.value))} /></label>
                        <label className="block"><span className="label-base">{rtl ? "أدنى سعر بيع" : "Minimum selling price"}</span><input type="text" inputMode="decimal" className="input-base" value={toEnglishDigits(piece.minimumSellingPrice)} onChange={(e) => updatePieceDraft(index, "minimumSellingPrice", normalizeDecimalValue(e.target.value))} /></label>
                        <label className="block"><span className="label-base">{rtl ? "سعر البيع اليدوي" : "Manual selling price"}</span><input type="text" inputMode="decimal" className="input-base" value={toEnglishDigits(piece.sellingPrice)} onChange={(e) => updatePieceDraft(index, "sellingPrice", normalizeDecimalValue(e.target.value))} /></label>
                      </div>
                    </>}
                    {conditionApplicable && <label className="block"><span className="label-base">{rtl ? "الحالة الوصفية" : "Condition"}{conditionRequired ? " *" : ""}</span><NativeSelect value={piece.condition} onChange={(e) => updatePieceDraft(index, "condition", e.target.value)}><option value="">{rtl ? "غير محددة" : "Not specified"}</option><option value="NEW">{rtl ? "جديد" : "New"}</option><option value="USED">{rtl ? "مستعمل" : "Used"}</option></NativeSelect></label>}
                    <details className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:col-span-2 lg:col-span-4 dark:border-slate-700 dark:bg-navy-950/30">
                      <summary className="cursor-pointer text-xs font-black text-slate-700 dark:text-slate-200">{rtl ? "بيانات إضافية اختيارية" : "Optional additional metadata"}</summary>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {goldColorApplicable && <label className="block"><span className="label-base">{rtl ? "لون الذهب" : "Gold color"}</span><input type="text" className="input-base" value={piece.goldColor} onChange={(e) => updatePieceDraft(index, "goldColor", e.target.value)} /></label>}
                    <label className="block"><span className="label-base">{rtl ? "العلامة التجارية" : "Brand"}</span><input type="text" className="input-base" value={piece.brand} onChange={(e) => updatePieceDraft(index, "brand", e.target.value)} /></label>
                    <label className="block"><span className="label-base">{rtl ? "الموديل" : "Model"}</span><input type="text" className="input-base" value={piece.model} onChange={(e) => updatePieceDraft(index, "model", e.target.value)} /></label>
                    <label className="block"><span className="label-base">{rtl ? "رقم الموديل" : "Model number"}</span><input type="text" className="input-base" value={piece.modelNumber} onChange={(e) => updatePieceDraft(index, "modelNumber", e.target.value)} /></label>
                    <label className="block"><span className="label-base">{rtl ? "مرجع المورد" : "Supplier reference"}</span><input type="text" className="input-base" value={piece.supplierReference} onChange={(e) => updatePieceDraft(index, "supplierReference", e.target.value)} /></label>
                    <label className="block"><span className="label-base">{rtl ? "الموقع (اختياري)" : "Location (optional)"}</span><input type="text" className="input-base" value={piece.locationId} onChange={(e) => updatePieceDraft(index, "locationId", e.target.value)} /></label>
                    {isGoldProfile && weightApplicable && <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-[10px] dark:border-slate-700 dark:bg-navy-950/40"><p className="font-black text-slate-700 dark:text-slate-200">{rtl ? "الأوزان المشتقة" : "Server-derived weights"}</p><p className="mt-1 text-slate-500">{rtl ? "وزن الذهب الصافي وذهب 999.9 يحسبهما الخادم بعد الحفظ ويظهران من بيانات Asset؛ لا تُرسل هذه الشاشة قيمة مشتقة." : "Net Gold Weight and Pure Gold 999.9 are calculated by the server after save and read from the Asset; this form never submits derived values."}</p></div>}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-[10px] dark:border-slate-700 dark:bg-navy-950/40"><p className="font-black text-slate-700 dark:text-slate-200">{rtl ? "الوسم وRFID والحالة التشغيلية" : "Tag, RFID, and operational status"}</p><p className="mt-1 text-slate-500">{rtl ? "Barcode ينشئه النظام بعد الحفظ؛ RFID اختياري ويُربط من دورة RFID المعتمدة؛ الحالة التشغيلية Available للعرض فقط." : "Barcode is system-generated after save; RFID remains optional and is assigned by the canonical RFID workflow; operational status is read-only Available."}</p></div>

                    {certificateSupported && <div className="grid gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3 sm:col-span-2 lg:col-span-4 dark:border-amber-500/30 dark:bg-amber-500/10 sm:grid-cols-2 lg:grid-cols-4"><p className="text-xs font-black text-amber-800 dark:text-amber-200 sm:col-span-2 lg:col-span-4">{rtl ? "بيانات الشهادة (اختيارية)" : "Certificate data (optional)"}</p><label className="block"><span className="label-base">{rtl ? "الجهة / الاسم" : "Issuer / name"}</span><input type="text" className="input-base" value={piece.certificateIssuer} onChange={(e) => updatePieceDraft(index, "certificateIssuer", e.target.value)} /></label><label className="block"><span className="label-base">{rtl ? "رقم الشهادة" : "Certificate number"}</span><input type="text" className="input-base" value={piece.certificateNumber} onChange={(e) => updatePieceDraft(index, "certificateNumber", e.target.value)} /></label><label className="block"><span className="label-base">{rtl ? "تاريخ الإصدار" : "Issue date"}</span><DateInput className="input-base" value={piece.certificateIssueDate} onChange={(value) => updatePieceDraft(index, "certificateIssueDate", value)} /></label><label className="block"><span className="label-base">{rtl ? "مرجع صورة/ملف الشهادة" : "Certificate image/file reference"}</span><input type="url" className="input-base" value={piece.certificateUrl} onChange={(e) => updatePieceDraft(index, "certificateUrl", e.target.value)} /></label></div>}

                    <label className="block rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs sm:col-span-2 lg:col-span-4 dark:border-slate-700 dark:bg-navy-950/40"><span className="font-black text-navy-950 dark:text-white">{rtl ? "صورة أو مرفق للقطعة (اختياري)" : "Piece image or attachment (optional)"}</span><input type="file" accept="image/*,.pdf" className="mt-2 block w-full text-xs" onChange={(e) => updatePieceDraft(index, "attachment", e.target.files?.[0] || null)} /><p className="mt-1 text-[10px] text-slate-500">{piece.attachment ? piece.attachment.name : (rtl ? "يُرفع بعد إنشاء Asset عبر علاقة المرفقات المعتمدة." : "Uploaded after Asset creation through the canonical attachment relation.")}</p></label>
                      </div>
                    </details>
                  </div>
                ))}
              </section>
            )}

            {/* Phase 12J — Purchase VAT */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3 space-y-3">
              <h4 className="text-xs font-black text-navy-900 dark:text-slate-100">{rtl ? "ضريبة المشتريات" : "Purchase VAT"}</h4>

              <label className={`flex items-center gap-2 ${useReverseCharge ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                <input
                  type="checkbox"
                  checked={applyVat}
                  disabled={useReverseCharge}
                  onChange={(e) => setApplyVat(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-navy-800 dark:text-slate-200">{rtl ? "تطبيق ضريبة على هذا الشراء" : "Apply VAT to this purchase"}</span>
              </label>

              {applyVat && !useReverseCharge && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500">{rtl ? "نسبة الضريبة %" : "VAT rate %"}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={toEnglishDigits(vatRate)}
                      onChange={(e) => setVatRate(normalizeDecimalValue(e.target.value))}
                      className={`rounded-xl border px-3 py-2 text-sm ${vatRateValid ? "border-slate-300 dark:border-slate-700" : "border-rose-400"}`}
                    />
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer pt-5">
                    <input type="checkbox" checked={taxIncluded} onChange={(e) => setTaxIncluded(e.target.checked)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4" />
                    <span className="text-xs font-bold text-navy-800 dark:text-slate-200">{rtl ? "السعر شامل الضريبة" : "Tax-inclusive price"}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer pt-5">
                    <input type="checkbox" checked={isRecoverable} onChange={(e) => setIsRecoverable(e.target.checked)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4" />
                    <span className="text-xs font-bold text-navy-800 dark:text-slate-200">{rtl ? "ضريبة قابلة للخصم" : "Recoverable VAT"}</span>
                  </label>
                </div>
              )}

              {/* Preview (display only — backend is the source of truth) */}
              <div className="rounded-xl bg-slate-50/70 dark:bg-navy-950/30 p-3 text-[11px] space-y-1">
                {previewPending && <p className="font-bold text-amber-600">{rtl ? "جاري إعادة الحساب…" : "Recalculating…"}</p>}
                {previewUnavailable && <p className="font-bold text-amber-600">{rtl ? "ملخص الخادم غير متاح؛ لا يتم عرض صفر افتراضي." : "Server summary unavailable; no fallback zero is shown."}</p>}
                {vatPreview.mode === "none" && (
                  <p className="font-bold text-slate-500">{rtl ? "بدون ضريبة: سيتم تسجيل الشراء كما هو." : "No VAT: the purchase is recorded as-is."}</p>
                )}
                {(vatPreview.mode === "inclusive" || vatPreview.mode === "exclusive") && (
                  <>
                    <div className="flex justify-between"><span className="text-slate-500">{rtl ? "أساس الضريبة" : "Tax base"}</span><span className="font-bold">{money(vatPreview.taxBase)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">{rtl ? "ضريبة المدخلات" : "Input VAT"}</span><span className="font-bold">{money(vatPreview.inputVatAmount)}</span></div>
                    <div className="flex justify-between border-t border-dashed pt-1"><span className="font-bold">{rtl ? "المستحق للمورد" : "Payable to supplier"}</span><span className="font-black">{money(vatPreview.payable)}</span></div>
                  </>
                )}
                {vatPreview.mode === "nonRecoverable" && (
                  <>
                    <div className="flex justify-between"><span className="text-slate-500">{rtl ? "أساس الضريبة" : "Tax base"}</span><span className="font-bold">{money(vatPreview.taxBase)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">{rtl ? "الضريبة" : "VAT"}</span><span className="font-bold">{money(vatPreview.inputVatAmount)}</span></div>
                    <div className="flex justify-between border-t border-dashed pt-1"><span className="font-bold">{rtl ? "المستحق للمورد" : "Payable to supplier"}</span><span className="font-black">{money(vatPreview.payable)}</span></div>
                    <p className="font-bold text-amber-600">{rtl ? "هذه الضريبة غير قابلة للخصم وستدخل ضمن تكلفة المخزون." : "Non-recoverable VAT — capitalised into inventory cost."}</p>
                  </>
                )}
                {vatPreview.mode === "rcm" && (
                  <>
                    <p className="font-bold text-brand-600">{rtl ? "احتساب عكسي (RCM): المورد لا يحصل على الضريبة." : "Reverse charge (RCM): the supplier is not paid VAT."}</p>
                    <div className="flex justify-between"><span className="text-slate-500">{rtl ? "أساس الضريبة" : "Tax base"}</span><span className="font-bold">{money(vatPreview.taxBase)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">{rtl ? "ضريبة RCM" : "RCM VAT"}</span><span className="font-bold">{money(vatPreview.rcmVatAmount)}</span></div>
                    <div className="flex justify-between border-t border-dashed pt-1"><span className="font-bold">{rtl ? "المستحق للمورد" : "Payable to supplier"}</span><span className="font-black">{money(vatPreview.payable)}</span></div>
                  </>
                )}
              </div>
            </div>

            {/* Reverse Charge compliance checkbox */}
            <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-2xl bg-slate-50/50 dark:bg-navy-950/20">
              <input
                type="checkbox"
                checked={useReverseCharge}
                onChange={(e) => setUseReverseCharge(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <span className="text-xs font-bold text-navy-800 dark:text-slate-200">
                {rtl ? "خاضع للاحتساب العكسي لضريبة القيمة المضافة (DRC)" : "Apply Domestic Reverse Charge (DRC)"}
              </span>
            </label>

            {useReverseCharge && selectedSupplier && (
              <ReverseChargeChecklist
                supplierName={selectedSupplier.name}
                trn="100389024000003"
                onVerifyStatusChange={setDrcVerified}
                locale={locale}
              />
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="submit" disabled={isCgpProfile || isPosting || profileTransitionPending || (!isQuantityBased && isApi && !previewIsCurrent) || (!isApi && isCreating) || suppliersLoading || activeSuppliers.length === 0 || (useReverseCharge && !drcVerified)}>
                <Plus className="h-4.5 w-4.5" />
                {isCgpProfile ? (rtl ? "استخدم مسار CGP في المبيعات والعملاء" : "Use the CGP workflow in Sales & Customers") : isPosting || (!isApi && isCreating) ? common("loading") : rtl ? "استلام وتسجيل الأصل" : "Post Purchase & Add Asset"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Financial summary rail */}
        <div className="space-y-4 xl:sticky xl:top-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-sm font-black text-navy-950 dark:text-white">{rtl ? "ملخص الاستلام" : "Receipt summary"}</h3>
              <span className="rounded-full bg-brand-50 px-2 py-1 text-[10px] font-black text-brand-700 dark:bg-brand-500/10 dark:text-brand-200">{rtl ? "قيمة تقديرية" : "Preview"}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div><p className="text-[10px] font-bold text-slate-500">{rtl ? "الوزن" : "Weight"}</p><p className="mt-1 font-black" dir="ltr">{toEnglishDigits(totalWeight.toFixed(2))} g</p></div>
              {(goldValuationApplicable || inventoryProfile === "GOLD_BY_PIECE") && <div><p className="text-[10px] font-bold text-slate-500">{goldValuationApplicable ? (rtl ? "ذهب وقت الشراء" : "Purchase gold") : (rtl ? "تكلفة القطعة" : "Piece cost")}</p><p className="mt-1 font-black" dir="ltr">{goldValuationApplicable && (previewPending || previewUnavailable) ? "—" : money(goldValuationApplicable ? goldPurchaseValue : canonicalPieceTotal)}</p></div>}
              {goldValuationApplicable && !is24kGoldBar && <div><p className="text-[10px] font-bold text-slate-500">{rtl ? "المصنعية" : "Making"}</p><p className="mt-1 font-black" dir="ltr">{previewPending || previewUnavailable ? "—" : money(makingTotal)}</p></div>}
              {is24kGoldBar && <><div><p className="text-[10px] font-bold text-slate-500">{rtl ? "تكلفة الشهادة" : "Certificate cost"}</p><p className="mt-1 font-black" dir="ltr">{previewPending || previewUnavailable ? "—" : money(certificateTotal)}</p></div><div><p className="text-[10px] font-bold text-slate-500">{rtl ? "ضريبة الشهادة" : "Certificate VAT"}</p><p className="mt-1 font-black" dir="ltr">{previewPending || previewUnavailable ? "—" : money(certificateVatTotal)}</p></div></>}
              {isLooseProfile && <div><p className="text-[10px] font-bold text-slate-500">{rtl ? "إضافي معتمد" : "Authorized additional"}</p><p className="mt-1 font-black" dir="ltr">{previewPending || previewUnavailable ? "—" : money(additionalAuthorizedCost)}</p></div>}
              <div><p className="text-[10px] font-bold text-slate-500">{rtl ? "إجمالي التكلفة الخادمي" : "Server acquisition total"}</p><p className="mt-1 font-black text-brand-700 dark:text-brand-200" dir="ltr">{previewPending ? (rtl ? "جاري الحساب…" : "Recalculating…") : previewUnavailable ? (rtl ? "غير متاح" : "Unavailable") : money(totalCost)}</p></div>
              <div><p className="text-[10px] font-bold text-slate-500">{rtl ? "المدفوع" : "Paid"}</p><p className="mt-1 font-black text-emerald-700 dark:text-emerald-300" dir="ltr">{money(paidAmountNum)}</p></div>
              <div><p className="text-[10px] font-bold text-slate-500">{rtl ? "المتبقي للمورد" : "Supplier balance"}</p><p className="mt-1 font-black text-amber-700 dark:text-amber-300" dir="ltr">{previewPending || previewUnavailable ? "—" : money(remainingAmount)}</p><p className="mt-1 text-[10px] font-bold text-slate-500">{previewPending ? (rtl ? "بانتظار إعادة الحساب" : "Waiting for recalculation") : previewUnavailable ? (rtl ? "الملخص غير متاح" : "Summary unavailable") : paymentStatus === "paid" ? (rtl ? "مدفوعة" : "Paid") : paymentStatus === "partial" ? (rtl ? "جزئية" : "Partial") : (rtl ? "غير مدفوعة" : "Unpaid")}</p></div>
            </div>
          </Card>
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-black text-navy-950 dark:text-white">
              {rtl ? "معلومات هامة للتدقيق" : "VAT & DRC Audit Guidelines"}
            </h3>
            <div className="text-xs space-y-3 leading-5 text-slate-500">
              <p>
                {rtl
                  ? "1. بموجب المادة 70 من قانون ضريبة القيمة المضافة، تقع مسؤولية سداد الضريبة على المشتري المسجل في حال كان توريد الذهب بغرض إعادة تصنيعه أو بيعه."
                  : "1. Under UAE VAT Law Executive Regulations, VAT on gold supplied to a registered business for resale or manufacture is accounted for under reverse charge."}
              </p>
              <p>
                {rtl
                  ? "2. يجب الاحتفاظ بملف إقرار DRC وشهادات التسجيل الضريبي كأدلة قانونية صالحة للتدقيق الضريبي."
                  : "2. Written DRC declarations and active TRN records must be kept on file as audit evidence."}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
