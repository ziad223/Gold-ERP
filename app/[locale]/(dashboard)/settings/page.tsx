"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { isApiDataSource } from "@/lib/data-source";
import {
  Building2,
  CreditCard,
  Database,
  ImagePlus,
  Plus,
  Receipt,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  Tag,
  Trash2,
  UsersRound,
  Edit2,
  ToggleLeft,
  Percent,
  Coins,
  Warehouse,
  Factory,
  Globe,
  Sliders,
  Check
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useErp } from "@/contexts/erp-context";
import { useAppSettings, type Branch, type AppSettings } from "@/contexts/settings-context";
import { usePrintTemplateDefaults } from "@/hooks/use-print-template-defaults";
import { useInvoicePrintBuilderConfig } from "@/hooks/use-invoice-print-builder-config";
import { useInvoicePrintCustomBlocks } from "@/hooks/use-invoice-print-custom-blocks";
import { usePrintCompanyInfo } from "@/hooks/use-print-company-info";
import type { InvoicePrintOptions, InvoicePrintTemplateId } from "@/features/printing/lib/invoice-print-options";
import type { InvoicePrintBuilderConfig } from "@/features/printing/lib/print-builder-config";
import {
  CUSTOM_PRINT_BLOCK_CONTENT_MAX,
  CUSTOM_PRINT_BLOCK_MAX_BLOCKS,
  CUSTOM_PRINT_BLOCK_TITLE_MAX,
  DEFAULT_CUSTOM_PRINT_BLOCK_STYLE,
  sanitizeInvoicePrintCustomBlocksConfig,
  type CustomPrintBlockAlignment,
  type CustomPrintBlockFontSize,
  type CustomPrintBlockPlacement,
  type InvoicePrintCustomBlock,
  type InvoicePrintCustomBlocksConfig,
} from "@/features/printing/lib/invoice-print-custom-blocks-config";
import { InvoiceDocument } from "@/features/printing/components/InvoiceDocument";
import {
  FIXTURE_INVOICE,
  FIXTURE_COMPANY,
  FIXTURE_LABELS,
  FIXTURE_SETTINGS,
} from "@/features/printing/lib/invoice-print-fixture";
import { usePermissions } from "@/hooks/use-permissions";
import { toast } from "sonner";
import { getPublicFileUrl } from "@/lib/api/files";
import { queryKeys } from "@/lib/query-keys";
import { normalizeNumberInput, toEnglishDigits } from "@/lib/formatters/numbers";
import { normalizeCurrencyCode } from "@/lib/utils";

const currencyOptions = [
  { code: "AED", ar: "درهم إماراتي", en: "UAE Dirham" },
  { code: "EGP", ar: "جنيه مصري", en: "Egyptian Pound" },
  { code: "SAR", ar: "ريال سعودي", en: "Saudi Riyal" },
  { code: "USD", ar: "دولار أمريكي", en: "US Dollar" },
  { code: "EUR", ar: "يورو", en: "Euro" },
  { code: "KWD", ar: "دينار كويتي", en: "Kuwaiti Dinar" },
  { code: "QAR", ar: "ريال قطري", en: "Qatari Riyal" },
  { code: "BHD", ar: "دينار بحريني", en: "Bahraini Dinar" },
  { code: "OMR", ar: "ريال عماني", en: "Omani Rial" }
];

const DEFAULT_POS_PRINT_TEMPLATE: InvoicePrintTemplateId = "thermal";

const POS_PRINT_TEMPLATE_OPTIONS: Array<{ value: InvoicePrintTemplateId; labelEn: string; labelAr: string }> = [
  { value: "thermal", labelEn: "Thermal", labelAr: "حراري" },
  { value: "luxuryGold", labelEn: "Luxury Gold", labelAr: "الذهبي الفاخر" },
  { value: "compactA4", labelEn: "Compact A4", labelAr: "مضغوط A4" },
  { value: "minimal", labelEn: "Minimal A4", labelAr: "بسيط A4" },
];

const CUSTOM_PRINT_BLOCK_PLACEMENT_OPTIONS: Array<{ value: CustomPrintBlockPlacement; labelEn: string; labelAr: string }> = [
  { value: "afterHeader", labelEn: "After header", labelAr: "بعد الهيدر" },
  { value: "afterInvoiceDetails", labelEn: "After invoice details", labelAr: "بعد بيانات الفاتورة" },
  { value: "beforeItems", labelEn: "Before items", labelAr: "قبل جدول الأصناف" },
  { value: "afterItems", labelEn: "After items", labelAr: "بعد جدول الأصناف" },
  { value: "afterTotals", labelEn: "After totals", labelAr: "بعد الإجماليات" },
  { value: "beforeSignatures", labelEn: "Before signatures", labelAr: "قبل التوقيعات" },
  { value: "beforeFooter", labelEn: "Before footer", labelAr: "قبل الفوتر" },
];

const CUSTOM_PRINT_BLOCK_FONT_SIZE_OPTIONS: Array<{ value: CustomPrintBlockFontSize; labelEn: string; labelAr: string }> = [
  { value: "xs", labelEn: "XS", labelAr: "صغير جدًا" },
  { value: "sm", labelEn: "SM", labelAr: "صغير" },
  { value: "base", labelEn: "Base", labelAr: "عادي" },
  { value: "lg", labelEn: "LG", labelAr: "كبير" },
  { value: "xl", labelEn: "XL", labelAr: "كبير جدًا" },
];

const CUSTOM_PRINT_BLOCK_ALIGNMENT_OPTIONS: Array<{ value: CustomPrintBlockAlignment; labelEn: string; labelAr: string }> = [
  { value: "left", labelEn: "Left", labelAr: "شمال" },
  { value: "center", labelEn: "Center", labelAr: "وسط" },
  { value: "right", labelEn: "Right", labelAr: "يمين" },
];

function sanitizeDefaultPosTemplate(value: unknown): InvoicePrintTemplateId {
  if (value === "thermal" || value === "luxuryGold" || value === "compactA4" || value === "minimal") {
    return value;
  }
  if (value === "luxury") return "luxuryGold";
  if (value === "compact") return "compactA4";
  return DEFAULT_POS_PRINT_TEMPLATE;
}

export default function SettingsPage() {
  const t = useTranslations("Settings");
  const common = useTranslations("Common");
  const locale = useLocale();
  const rtl = locale === "ar";
  const queryClient = useQueryClient();

  const { company, updateCompany } = useAuth();
  const { hasPermission } = usePermissions();
  const { resetDemo } = useErp();
  const {
    settings,
    branches,
    loading: settingsLoading,
    refreshSettings,
    refreshBranches,
    updateSettings,
    saveBranch,
    deleteBranch,
    deactivateBranch,
    reactivateBranch
  } = useAppSettings();
  const canUpdateBranches = hasPermission("branches.update");
  const canDeleteBranches = hasPermission("branches.delete");
  const canDeactivateBranches = hasPermission("branches.deactivate");
  const canReactivateBranches = hasPermission("branches.reactivate");

  const [activeTab, setActiveTab] = useState<"company" | "branches" | "payments" | "printDesign" | "system" | "barcode">("company");
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // --- Company Profile State ---
  const [businessName, setBusinessName] = useState("");
  const [logo, setLogo] = useState("");
  const [logoFailed, setLogoFailed] = useState(false);
  const [currency, setCurrency] = useState("AED");
  const [taxNumber, setTaxNumber] = useState("");
  // Phase 19X.2-C — DB-backed company contact fields.
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  // Phase 19X.2-F — official company address fields (existing DB columns).
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [commercialRegister, setCommercialRegister] = useState("");
  const [savingCompany, setSavingCompany] = useState(false);

  // --- System Settings State ---
  const [vatRate, setVatRate] = useState("5");
  const [decimalPrecision, setDecimalPrecision] = useState("2");
  const [lowStockThreshold, setLowStockThreshold] = useState("3");
  const [invoicePrefix, setInvoicePrefix] = useState("INV-2026");
  const [allowZeroDownPayment, setAllowZeroDownPayment] = useState(false);
  const [installmentEnabled, setInstallmentEnabled] = useState(true);
  const [installmentDefaultFrequency, setInstallmentDefaultFrequency] = useState("monthly");
  const [installmentMaxCount, setInstallmentMaxCount] = useState("24");
  const [installmentMinDownPaymentPercent, setInstallmentMinDownPaymentPercent] = useState("0");
  const [savingSystem, setSavingSystem] = useState(false);

  // --- Barcode Settings State ---
  const [barcodeForm, setBarcodeForm] = useState({
    showCompanyName: true,
    showLogo: true,
    showAssetId: true,
    showName: true,
    showKarat: true,
    showWeight: true,
    showPrice: true,
    showType: true,
    showBranch: true,
    showSupplier: false,
    showDate: false,
    customText: "",
    showQrCode: false,
    widthMm: 62,
    heightMm: 28,
    fontSizePx: 8,
    direction: "RTL" as "RTL" | "LTR",
    columns: 2,
    copies: 1,
    showBorder: true,
    template: "detailed" as "compact" | "detailed" | "price-hidden" | "custom"
  });
  const [savingBarcode, setSavingBarcode] = useState(false);

  // --- Payment Methods State ---
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [savingPayments, setSavingPayments] = useState(false);

  // --- Receipt Settings State ---
  const [receiptForm, setReceiptForm] = useState({
    showLogo: true,
    welcomeMessage: "",
    headerNote: "",
    footerMessage: "",
    termsMessage: "",
    phone: "",
    address: "",
    showCashier: true,
    showBarcode: true,
    showVatNumber: false,
    vatNumber: "",
    showCompanyName: true,
    showTaxNumber: true,
    showAddress: true,
    showPhone: true,
    showQrCode: true,
    showVatBreakdown: true,
    showCustomerInfo: true,
    showBranchInfo: true,
    paperSize: "thermal" as "thermal" | "A4" | "A5",
    layout: "standard" as "standard" | "compact" | "detailed",
    defaultPosTemplate: DEFAULT_POS_PRINT_TEMPLATE
  });
  const [savingReceipt, setSavingReceipt] = useState(false);

  // Phase 19G — company default invoice print options (display-only).
  const { defaults: savedPrintDefaults, save: savePrintTemplateDefaults } = usePrintTemplateDefaults();
  const [printDefaultsForm, setPrintDefaultsForm] = useState<InvoicePrintOptions>(savedPrintDefaults);
  const [savingPrintDefaults, setSavingPrintDefaults] = useState(false);

  // Phase 19X.2-C — company contact fields now live on the company master (DB).
  // printCompanyInfo is read only as a legacy prefill fallback (see load effect).
  const { config: savedCompanyInfo } = usePrintCompanyInfo();

  // Phase 19R — Print Builder MVP UI toggles and hooks
  const { config: savedBuilderConfig, save: saveBuilderConfig } = useInvoicePrintBuilderConfig();
  const [selectedTemplateId, setSelectedTemplateId] = useState<InvoicePrintTemplateId>("luxuryGold");
  const [builderForm, setBuilderForm] = useState<InvoicePrintBuilderConfig>(savedBuilderConfig);
  const [savingBuilder, setSavingBuilder] = useState(false);
  const [previewLanguage, setPreviewLanguage] = useState<"bilingual" | "ar" | "en">("bilingual");

  // Phase 20.2 — custom plain-text print blocks, stored outside receipt.
  const { config: savedCustomBlocksConfig, save: saveCustomBlocksConfig } = useInvoicePrintCustomBlocks();
  const [customBlocksForm, setCustomBlocksForm] = useState<InvoicePrintCustomBlocksConfig>(savedCustomBlocksConfig);
  const [savingCustomBlocks, setSavingCustomBlocks] = useState(false);

  // Rehydrate the local builder form from the saved config. Guard against
  // redundant updates (compare by content signature) so an unstable
  // `savedBuilderConfig` reference can never cause an update loop.
  const savedBuilderConfigSignature = useMemo(() => JSON.stringify(savedBuilderConfig), [savedBuilderConfig]);
  useEffect(() => {
    setBuilderForm((prev) => (JSON.stringify(prev) === savedBuilderConfigSignature ? prev : savedBuilderConfig));
  }, [savedBuilderConfig, savedBuilderConfigSignature]);

  const savedCustomBlocksConfigSignature = useMemo(() => JSON.stringify(savedCustomBlocksConfig), [savedCustomBlocksConfig]);
  useEffect(() => {
    setCustomBlocksForm((prev) => (
      JSON.stringify(prev) === savedCustomBlocksConfigSignature ? prev : savedCustomBlocksConfig
    ));
  }, [savedCustomBlocksConfig, savedCustomBlocksConfigSignature]);

  // Phase 19X.2-G — LIVE company data for the print preview. Precedence:
  // Company Profile form state (user may be editing) > auth company/session >
  // static fixture (demo fallback only). Derived via useMemo (no setState) so the
  // preview reflects the current company without stale fixture data or render loops.
  // The demo invoice/items/customer/totals stay from FIXTURE_INVOICE.
  const livePreviewCompany = useMemo(() => ({
    ...FIXTURE_COMPANY,
    name: businessName || company?.businessName || FIXTURE_COMPANY.name,
    logo: logo || company?.logo || FIXTURE_COMPANY.logo,
    branch: company?.branchName || FIXTURE_COMPANY.branch,
    currency: currency || company?.currency || FIXTURE_COMPANY.currency,
    trn: taxNumber || company?.taxNumber || FIXTURE_COMPANY.trn,
    phone: phone || company?.phone || undefined,
    email: email || company?.email || undefined,
    website: website || company?.website || undefined,
    country: country || company?.country || undefined,
    city: city || company?.city || undefined,
    region: region || company?.region || undefined,
    address1: address1 || company?.address1 || undefined,
    address2: address2 || company?.address2 || undefined,
    postalCode: postalCode || company?.postalCode || undefined,
  }), [
    businessName, logo, currency, taxNumber, phone, email, website,
    country, city, region, address1, address2, postalCode, company,
  ]);

  const handleToggleSection = (sectionKey: string, checked: boolean) => {
    setBuilderForm(prev => {
      const templates = { ...prev.templates };
      const currentTemplate = templates[selectedTemplateId] || {};
      const sections = { ...currentTemplate.sections, [sectionKey]: checked };
      templates[selectedTemplateId] = { ...currentTemplate, sections };
      return { ...prev, templates };
    });
  };

  const handleToggleField = (fieldKey: string, checked: boolean) => {
    setBuilderForm(prev => {
      const templates = { ...prev.templates };
      const currentTemplate = templates[selectedTemplateId] || {};
      const fields = { ...currentTemplate.fields, [fieldKey]: checked };
      templates[selectedTemplateId] = { ...currentTemplate, fields };
      return { ...prev, templates };
    });
  };

  const handleThemePresetChange = (preset: string) => {
    setBuilderForm(prev => {
      const templates = { ...prev.templates };
      const currentTemplate = templates[selectedTemplateId] || {};
      templates[selectedTemplateId] = {
        ...currentTemplate,
        themePreset: (preset || undefined) as any,
      };
      return { ...prev, templates };
    });
  };

  const handleSaveBuilder = async () => {
    setSavingBuilder(true);
    try {
      const ok = await saveBuilderConfig(builderForm);
      if (ok) {
        toast.success(rtl ? "تم حفظ إعدادات مصمم الطباعة بنجاح" : "Print Builder settings saved successfully");
      } else {
        toast.error(rtl ? "فشل حفظ إعدادات مصمم الطباعة" : "Failed to save Print Builder settings");
      }
    } catch (err: any) {
      toast.error(err.message || "Error saving Print Builder settings");
    } finally {
      setSavingBuilder(false);
    }
  };

  const handleResetTemplateBuilder = () => {
    if (!window.confirm(rtl ? "هل أنت متأكد من إعادة تعيين خيارات هذا القالب إلى الافتراضي؟" : "Are you sure you want to reset this template customization to default?")) {
      return;
    }
    setBuilderForm(prev => {
      const templates = { ...prev.templates };
      delete templates[selectedTemplateId];
      return { ...prev, templates };
    });
    toast.success(rtl ? "تمت إعادة التعيين للوضع الافتراضي (يرجى حفظ التغييرات)" : "Customization reset to default (please save changes)");
  };

  const updateCustomBlock = (id: string, patch: Partial<InvoicePrintCustomBlock>) => {
    setCustomBlocksForm((prev) => ({
      version: 1,
      blocks: prev.blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)),
    }));
  };

  const updateCustomBlockStyle = (
    block: InvoicePrintCustomBlock,
    patch: Partial<InvoicePrintCustomBlock["style"]>,
  ) => {
    updateCustomBlock(block.id, {
      style: {
        ...DEFAULT_CUSTOM_PRINT_BLOCK_STYLE,
        ...(block.style ?? {}),
        ...patch,
      },
    });
  };

  const handleAddCustomBlock = () => {
    setCustomBlocksForm((prev) => {
      if (prev.blocks.length >= CUSTOM_PRINT_BLOCK_MAX_BLOCKS) return prev;
      const nextSortOrder = prev.blocks.reduce((max, block) => Math.max(max, Number(block.sortOrder) || 0), 0) + 10;
      return {
        version: 1,
        blocks: [
          ...prev.blocks,
          {
            id: `custom-block-${Date.now()}`,
            enabled: true,
            title: "",
            content: "",
            placement: "afterTotals",
            sortOrder: nextSortOrder,
            style: DEFAULT_CUSTOM_PRINT_BLOCK_STYLE,
          },
        ],
      };
    });
  };

  const handleRemoveCustomBlock = (id: string) => {
    if (!window.confirm(rtl ? "حذف هذا النص المخصص؟" : "Delete this custom text block?")) return;
    setCustomBlocksForm((prev) => ({
      version: 1,
      blocks: prev.blocks.filter((block) => block.id !== id),
    }));
  };

  const handleToggleCustomBlockTemplate = (block: InvoicePrintCustomBlock, templateId: InvoicePrintTemplateId, checked: boolean) => {
    const allTemplateIds = POS_PRINT_TEMPLATE_OPTIONS.map((option) => option.value);
    const currentTemplates = block.templates ?? allTemplateIds;
    const nextTemplates = checked
      ? [...currentTemplates, templateId].filter((value, index, arr) => arr.indexOf(value) === index)
      : currentTemplates.filter((value) => value !== templateId);

    updateCustomBlock(block.id, {
      templates: nextTemplates.length === 0 || nextTemplates.length === allTemplateIds.length ? undefined : nextTemplates,
    });
  };

  const handleSaveCustomBlocks = async () => {
    setSavingCustomBlocks(true);
    try {
      const value = sanitizeInvoicePrintCustomBlocksConfig(customBlocksForm);
      const ok = await saveCustomBlocksConfig(value);
      if (ok) {
        setCustomBlocksForm(value);
        toast.success(rtl ? "تم حفظ النصوص المخصصة للطباعة" : "Custom print text blocks saved");
      } else {
        toast.error(rtl ? "فشل حفظ النصوص المخصصة" : "Failed to save custom print text blocks");
      }
    } catch (err: any) {
      toast.error(err.message || "Error saving custom print text blocks");
    } finally {
      setSavingCustomBlocks(false);
    }
  };

  // --- Branches CRUD State ---
  const [branchQuery, setBranchQuery] = useState("");
  const [editingBranch, setEditingBranch] = useState<Partial<Branch> | null>(null);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [branchForm, setBranchForm] = useState<Partial<Branch>>({
    name: "",
    code: "",
    type: "store",
    address: "",
    phone: "",
    isActive: true
  });
  const [savingBranchLoading, setSavingBranchLoading] = useState(false);

  // Load settings into local form states
  useEffect(() => {
    if (settings) {
      setBusinessName(settings.businessName || company?.businessName || "");
      setLogo(settings.logo || company?.logo || "");
      setCurrency(normalizeCurrencyCode(settings.currency || company?.currency || "AED"));
      setTaxNumber(toEnglishDigits(company?.taxNumber || ""));
      // Contact fields: DB company master first; prefill from legacy printCompanyInfo
      // when the DB field is empty (frontend-assisted migration — no DB backfill).
      setPhone(toEnglishDigits(company?.phone || savedCompanyInfo.phone || ""));
      setEmail(company?.email || savedCompanyInfo.email || "");
      setWebsite(company?.website || savedCompanyInfo.website || "");
      // Official address fields (existing DB columns via the auth company).
      setCountry(company?.country || "");
      setCity(company?.city || "");
      setRegion(company?.region || "");
      setAddress1(company?.address1 || "");
      setAddress2(company?.address2 || "");
      setPostalCode(toEnglishDigits(company?.postalCode || ""));
      setCommercialRegister(toEnglishDigits(company?.commercialRegister || ""));
      setVatRate(toEnglishDigits(settings.vatRate ?? 5));
      setDecimalPrecision(toEnglishDigits(settings.decimalPrecision ?? 2));
      setLowStockThreshold(toEnglishDigits(settings.lowStockThreshold ?? 3));
      setInvoicePrefix(toEnglishDigits(settings.invoicePrefix || "INV-2026"));
      setAllowZeroDownPayment(!!settings.allowZeroDownPayment);
      setInstallmentEnabled(settings.installmentEnabled ?? true);
      setInstallmentDefaultFrequency(settings.installmentDefaultFrequency || "monthly");
      setInstallmentMaxCount(toEnglishDigits(settings.installmentMaxCount ?? 24));
      setInstallmentMinDownPaymentPercent(toEnglishDigits(settings.installmentMinDownPaymentPercent ?? 0));
      setPaymentMethods(settings.paymentMethods || ["cash", "card", "transfer", "installment", "deposit"]);
      if (settings.receipt) {
        setReceiptForm(prev => ({
          ...prev,
          ...settings.receipt,
          phone: toEnglishDigits(settings.receipt?.phone || ""),
          vatNumber: toEnglishDigits(settings.receipt?.vatNumber || ""),
          defaultPosTemplate: sanitizeDefaultPosTemplate(settings.receipt?.defaultPosTemplate)
        }));
      }
      if (settings.barcode) {
        setBarcodeForm(prev => ({
          ...prev,
          ...settings.barcode,
          customText: settings.barcode.customText || "",
          widthMm: Number(settings.barcode.widthMm ?? 62),
          heightMm: Number(settings.barcode.heightMm ?? 28),
          fontSizePx: Number(settings.barcode.fontSizePx ?? 8),
          columns: Number(settings.barcode.columns ?? 2),
          copies: Number(settings.barcode.copies ?? 1)
        }));
      }
    }
  }, [settings, company, savedCompanyInfo]);

  useEffect(() => {
    setLogoFailed(false);
  }, [logo]);

  // Keep the print-defaults form in sync with the company-saved value.
  useEffect(() => {
    setPrintDefaultsForm({
      documentMode: savedPrintDefaults.documentMode,
      templateId: savedPrintDefaults.templateId,
      languageMode: savedPrintDefaults.languageMode,
    });
  }, [savedPrintDefaults.documentMode, savedPrintDefaults.templateId, savedPrintDefaults.languageMode]);

  const handleSavePrintDefaults = async () => {
    setSavingPrintDefaults(true);
    try {
      const ok = await savePrintTemplateDefaults(printDefaultsForm);
      if (ok) toast.success(rtl ? "تم حفظ إعدادات طباعة الفاتورة الافتراضية" : "Invoice print defaults saved");
      else toast.error(rtl ? "فشل حفظ إعدادات الطباعة" : "Failed to save print defaults");
    } catch {
      toast.error(rtl ? "فشل حفظ إعدادات الطباعة" : "Failed to save print defaults");
    } finally {
      setSavingPrintDefaults(false);
    }
  };

  // Handle logo upload
  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(rtl ? "الملف المختار يجب أن يكون صورة" : "Selected file must be an image");
      return;
    }

    if (file.size > 1024 * 1024) {
      toast.error(rtl ? "حجم الصورة يجب أن يكون أقل من 1 ميجابايت" : "Image size must be less than 1MB");
      return;
    }

    if (!isApiDataSource()) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = String(reader.result ?? "");
        setLogo(base64);
        updateCompany({ logo: base64 });
        toast.success(rtl ? "تم تجهيز الشعار محلياً" : "Logo prepared locally");
      };
      reader.readAsDataURL(file);
    } else {
      const loadingToast = toast.loading(rtl ? "جاري رفع الشعار..." : "Uploading logo...");
      try {
        const token = localStorage.getItem("darfus-token-v1") || sessionStorage.getItem("darfus-token-v1");
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const fd = new FormData();
        fd.append("logo", file);
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
        const response = await fetch(`${apiBaseUrl}/uploads/logo`, {
          method: "POST",
          headers,
          body: fd
        });
        const resJson = await response.json();
        toast.dismiss(loadingToast);

        if (resJson.success && resJson.url) {
          const uploadedLogo = resJson.url;
          setLogo(uploadedLogo);
          setLogoFailed(false);
          updateCompany({
            ...(resJson.data?.company || {}),
            logo: uploadedLogo
          });
          queryClient.setQueryData(queryKeys.settings, (old: any) => {
            if (!old) return old;
            return {
              ...old,
              data: {
                ...old.data,
                company: {
                  ...(old.data?.company || {}),
                  ...(resJson.data?.company || {}),
                  logo: uploadedLogo
                }
              }
            };
          });
          await queryClient.invalidateQueries({ queryKey: queryKeys.settings });
          await refreshSettings();
          toast.success(rtl ? "تم رفع الشعار بنجاح" : "Logo uploaded successfully");
        } else {
          toast.error(resJson.message || (rtl ? "فشل رفع الشعار" : "Failed to upload logo"));
        }
      } catch (err: any) {
        toast.dismiss(loadingToast);
        toast.error(err.message || "Network error uploading logo");
      }
    }
  };

  // Save company profile
  const handleSaveCompany = async () => {
    setSavingCompany(true);
    try {
      // taxNumber/phone/email/website + address fields are DB-backed company
      // columns; send them through PATCH /settings (backend whitelist —
      // Phase 19X.2-B/F).
      const companyFields = {
        businessName: businessName.trim(),
        logo,
        currency: normalizeCurrencyCode(currency.trim()),
        taxNumber: taxNumber.trim(),
        phone: phone.trim(),
        email: email.trim(),
        website: website.trim(),
        country: country.trim(),
        city: city.trim(),
        region: region.trim(),
        address1: address1.trim(),
        address2: address2.trim(),
        postalCode: postalCode.trim(),
        commercialRegister: commercialRegister.trim()
      };
      const success = await updateSettings(companyFields);

      // Update auth context company info as well (immediate session refresh).
      updateCompany(companyFields);

      if (success) {
        toast.success(rtl ? "تم حفظ بيانات الشركة بنجاح" : "Company profile saved successfully");
      } else {
        toast.error(rtl ? "حدث خطأ أثناء حفظ الإعدادات" : "Failed to save company profile");
      }
    } catch (err: any) {
      toast.error(err.message || "Error saving company profile");
    } finally {
      setSavingCompany(false);
    }
  };

  // Save payment methods settings
  const handleSavePayments = async () => {
    setSavingPayments(true);
    try {
      const success = await updateSettings({
        paymentMethods
      });
      if (success) {
        toast.success(rtl ? "تم حفظ طرق الدفع بنجاح" : "Payment methods saved successfully");
      } else {
        toast.error(rtl ? "فشل حفظ طرق الدفع" : "Failed to save payment methods");
      }
    } catch (err: any) {
      toast.error(err.message || "Error saving payment methods");
    } finally {
      setSavingPayments(false);
    }
  };

  // Save receipt template settings
  const handleSaveReceipt = async () => {
    setSavingReceipt(true);
    try {
      const success = await updateSettings({
        receipt: receiptForm
      });
      if (success) {
        toast.success(rtl ? "تم حفظ إعدادات الإيصال بنجاح" : "Receipt template settings saved successfully");
      } else {
        toast.error(rtl ? "فشل حفظ إعدادات الإيصال" : "Failed to save receipt settings");
      }
    } catch (err: any) {
      toast.error(err.message || "Error saving receipt settings");
    } finally {
      setSavingReceipt(false);
    }
  };

  // Save system configuration parameters
  const handleSaveSystem = async () => {
    setSavingSystem(true);
    try {
      const success = await updateSettings({
        vatRate: Number(toEnglishDigits(vatRate)),
        decimalPrecision: Number(toEnglishDigits(decimalPrecision)),
        lowStockThreshold: Number(toEnglishDigits(lowStockThreshold)),
        invoicePrefix: toEnglishDigits(invoicePrefix.trim()),
        allowZeroDownPayment,
        installmentEnabled,
        installmentDefaultFrequency,
        installmentMaxCount: Number(toEnglishDigits(installmentMaxCount)),
        installmentMinDownPaymentPercent: Number(toEnglishDigits(installmentMinDownPaymentPercent))
      });
      if (success) {
        toast.success(rtl ? "تم حفظ إعدادات النظام بنجاح" : "System settings saved successfully");
      } else {
        toast.error(rtl ? "فشل حفظ إعدادات النظام" : "Failed to save system settings");
      }
    } catch (err: any) {
      toast.error(err.message || "Error saving system settings");
    } finally {
      setSavingSystem(false);
    }
  };

  // Save barcode settings
  const handleSaveBarcode = async () => {
    setSavingBarcode(true);
    try {
      const success = await updateSettings({
        barcode: barcodeForm
      });
      if (success) {
        toast.success(rtl ? "تم حفظ إعدادات الباركود بنجاح" : "Barcode settings saved successfully");
      } else {
        toast.error(rtl ? "فشل حفظ إعدادات الباركود" : "Failed to save barcode settings");
      }
    } catch (err: any) {
      toast.error(err.message || "Error saving barcode settings");
    } finally {
      setSavingBarcode(false);
    }
  };

  const handleBarcodeTemplateChange = (tmpl: "compact" | "detailed" | "price-hidden" | "custom") => {
    if (tmpl === "compact") {
      setBarcodeForm(prev => ({
        ...prev,
        template: "compact",
        showCompanyName: true,
        showLogo: false,
        showAssetId: true,
        showName: true,
        showKarat: true,
        showWeight: true,
        showPrice: true,
        showType: false,
        showBranch: false,
        showSupplier: false,
        showDate: false,
        showQrCode: false
      }));
    } else if (tmpl === "detailed") {
      setBarcodeForm(prev => ({
        ...prev,
        template: "detailed",
        showCompanyName: true,
        showLogo: true,
        showAssetId: true,
        showName: true,
        showKarat: true,
        showWeight: true,
        showPrice: true,
        showType: true,
        showBranch: true,
        showSupplier: false,
        showDate: false,
        showQrCode: false
      }));
    } else if (tmpl === "price-hidden") {
      setBarcodeForm(prev => ({
        ...prev,
        template: "price-hidden",
        showCompanyName: true,
        showLogo: true,
        showAssetId: true,
        showName: true,
        showKarat: true,
        showWeight: true,
        showPrice: false,
        showType: true,
        showBranch: true,
        showSupplier: false,
        showDate: false,
        showQrCode: false
      }));
    } else {
      setBarcodeForm(prev => ({ ...prev, template: "custom" }));
    }
  };

  // Handle toggling of a payment method
  const togglePaymentMethod = (method: string) => {
    setPaymentMethods(prev =>
      prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
    );
  };

  // --- Branches CRUD Actions ---
  const filteredBranches = useMemo(() => {
    return branches.filter(b =>
      b.name.toLowerCase().includes(branchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(branchQuery.toLowerCase()) ||
      b.type.toLowerCase().includes(branchQuery.toLowerCase())
    );
  }, [branches, branchQuery]);

  const handleEditBranchClick = (branch: Branch) => {
    setEditingBranch(branch);
    setBranchForm({
      name: branch.name,
      code: branch.code,
      type: branch.type,
      address: branch.address || "",
      phone: branch.phone || "",
      isActive: branch.isActive
    });
    setShowBranchForm(true);
  };

  const handleCreateBranchClick = () => {
    setEditingBranch(null);
    setBranchForm({
      name: "",
      code: "",
      type: "store",
      address: "",
      phone: "",
      isActive: true
    });
    setShowBranchForm(true);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.name?.trim() || !branchForm.code?.trim()) {
      toast.error(rtl ? "الاسم والكود مطلوبان" : "Name and code are required");
      return;
    }

    setSavingBranchLoading(true);
    try {
      const payload: Partial<Branch> = {
        ...branchForm,
        name: branchForm.name.trim(),
        code: branchForm.code.trim().toUpperCase()
      };
      if (editingBranch?.id) {
        payload.id = editingBranch.id;
      }

      const success = await saveBranch(payload);
      if (success) {
        toast.success(editingBranch ? (rtl ? "تم تحديث الفرع" : "Branch updated") : (rtl ? "تم إضافة الفرع بنجاح" : "Branch added successfully"));
        setShowBranchForm(false);
      } else {
        toast.error(rtl ? "فشل حفظ بيانات الفرع" : "Failed to save branch");
      }
    } catch (err: any) {
      toast.error(err.message || "Error saving branch");
    } finally {
      setSavingBranchLoading(false);
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!window.confirm(common("deleteConfirm"))) {
      return;
    }
    try {
      const success = await deleteBranch(id);
      if (success) {
        toast.success(rtl ? "تم حذف الفرع بنجاح" : "Branch deleted successfully");
      } else {
        toast.error(rtl ? "فشل حذف الفرع" : "Failed to delete branch");
      }
    } catch (err: any) {
      toast.error(err.message || "Error deleting branch");
    }
  };

  const handleDeactivateBranch = async (id: string) => {
    if (!window.confirm(common("deactivateConfirm"))) {
      return;
    }
    try {
      const success = await deactivateBranch(id);
      if (success) {
        toast.success(rtl ? "تم تعطيل الفرع بنجاح" : "Branch deactivated successfully");
      } else {
        toast.error(rtl ? "فشل تعطيل الفرع" : "Failed to deactivate branch");
      }
    } catch (err: any) {
      toast.error(err.message || (rtl ? "فشل تعطيل الفرع" : "Failed to deactivate branch"));
    }
  };

  const handleReactivateBranch = async (id: string) => {
    try {
      const success = await reactivateBranch(id);
      if (success) {
        toast.success(rtl ? "تم تنشيط الفرع بنجاح" : "Branch reactivated successfully");
      } else {
        toast.error(rtl ? "فشل تنشيط الفرع" : "Failed to reactivate branch");
      }
    } catch (err: any) {
      toast.error(err.message || (rtl ? "فشل تنشيط الفرع" : "Failed to reactivate branch"));
    }
  };

  if (settingsLoading) {
    return <div className="p-8 text-center text-xs text-slate-500">{common("loading")}</div>;
  }

  const renderToggle = (label: string, checked: boolean, onChange: (v: boolean) => void) => (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold dark:border-slate-800">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-700"}`}
        aria-pressed={checked}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? (rtl ? "right-0.5" : "left-0.5") : (rtl ? "right-[22px]" : "left-[22px]")}`} />
      </button>
    </label>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button variant="secondary" onClick={resetDemo}>
            <RotateCcw className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {t("resetDemo")}
          </Button>
        }
      />

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {[
          { id: "company", label: rtl ? "بيانات الشركة" : "Company Profile", icon: Building2 },
          { id: "branches", label: rtl ? "إدارة الفروع" : "Branches Manager", icon: Warehouse },
          { id: "payments", label: rtl ? "طرق الدفع" : "Payment Methods", icon: CreditCard },
          { id: "printDesign", label: rtl ? "تصميم الطباعة والفواتير" : "Print & Invoice Design", icon: Receipt },
          { id: "system", label: rtl ? "إعدادات النظام" : "System Settings", icon: Sliders },
          { id: "barcode", label: rtl ? "إعدادات الباركود" : "Barcode Settings", icon: Tag }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      
      {/* 1. COMPANY PROFILE */}
      {activeTab === "company" && (
        <Card className="p-5 lg:p-6 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-navy-950 dark:text-white">{t("companyProfile")}</h2>
              <p className="text-xs text-slate-500">{t("companyProfileDesc")}</p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <span className="label-base">{t("logo")}</span>
              {(() => {
                const logoUrl = getPublicFileUrl(logo);
                const companyInitials = (businessName || company?.businessName || "DARFUS")
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase();
                return (
                  <>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="grid h-24 w-24 place-items-center overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 hover:border-brand-400 dark:border-slate-700 dark:bg-navy-950 transition"
                    >
                      {logoUrl && !logoFailed ? (
                        <img
                          src={logoUrl}
                          alt={businessName || company?.businessName || "Company logo"}
                          className="h-full w-full bg-white object-contain p-2 animate-in zoom-in-50"
                          onError={() => setLogoFailed(true)}
                        />
                      ) : (
                        <span className="text-xs font-black text-slate-500">{logo ? companyInitials : <ImagePlus className="h-6 w-6" />}</span>
                      )}
                    </button>
                  </>
                );
              })()}
            </div>

            <label className="block">
              <span className="label-base">{t("businessName")}</span>
              <input
                className="input-base mt-1"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="label-base">{rtl ? "الرقم الضريبي (TRN)" : "Tax Registration Number (TRN)"}</span>
              <input
                className="input-base mt-1"
                dir="ltr"
                value={toEnglishDigits(taxNumber)}
                onChange={(e) => setTaxNumber(toEnglishDigits(e.target.value))}
              />
            </label>

            <label className="block">
              <span className="label-base">{rtl ? "العملة الافتراضية" : "Default Currency"}</span>
              <select
                className="input-base mt-1"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {currencyOptions.map((item) => (
                  <option key={item.code} value={item.code}>
                    {locale === "ar"
                      ? `${item.ar} - ${item.code}`
                      : `${item.en} - ${item.code}`}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="label-base">{rtl ? "رقم الهاتف" : "Phone"}</span>
              <input
                className="input-base mt-1"
                dir="ltr"
                inputMode="tel"
                value={toEnglishDigits(phone)}
                onChange={(e) => setPhone(toEnglishDigits(e.target.value))}
              />
            </label>

            <label className="block">
              <span className="label-base">{rtl ? "البريد الإلكتروني" : "Email"}</span>
              <input
                className="input-base mt-1"
                dir="ltr"
                type="email"
                value={email}
                placeholder="name@company.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="label-base">{rtl ? "الموقع الإلكتروني" : "Website"}</span>
              <input
                className="input-base mt-1"
                dir="ltr"
                value={website}
                placeholder="https://example.com"
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950/40 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-500">
            {rtl
              ? "💡 بيانات الشركة هذه تُستخدم في طباعة الفواتير والعرض. لا تؤثر على أي مبالغ أو حسابات مالية."
              : "💡 These company details are used for invoice printing and display. They do not affect any totals or financial data."}
          </div>

          {/* Phase 19X.2-F — official company address (existing DB columns) */}
          <div className="border-t border-slate-100 dark:border-white/5 pt-4">
            <h3 className="text-xs font-black text-navy-950 dark:text-white">{rtl ? "العنوان الرسمي للشركة" : "Official Company Address"}</h3>
            <p className="mt-1 text-[10px] text-slate-400">
              {rtl
                ? "هذه البيانات هي العنوان الرسمي للشركة وتظهر في الطباعة والفواتير."
                : "These fields are the official company address and appear in invoice/print output."}
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <label className="block">
              <span className="label-base">{rtl ? "الدولة" : "Country"}</span>
              <input
                className="input-base mt-1"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="label-base">{rtl ? "المدينة" : "City"}</span>
              <input
                className="input-base mt-1"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="label-base">{rtl ? "المنطقة" : "Region"}</span>
              <input
                className="input-base mt-1"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="label-base">{rtl ? "الرمز البريدي" : "Postal Code"}</span>
              <input
                className="input-base mt-1"
                dir="ltr"
                value={toEnglishDigits(postalCode)}
                onChange={(e) => setPostalCode(toEnglishDigits(e.target.value))}
              />
            </label>
            <label className="block lg:col-span-2">
              <span className="label-base">{rtl ? "العنوان الأول" : "Address Line 1"}</span>
              <input
                className="input-base mt-1"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
              />
            </label>
            <label className="block lg:col-span-2">
              <span className="label-base">{rtl ? "العنوان الثاني" : "Address Line 2"}</span>
              <input
                className="input-base mt-1"
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="label-base">{rtl ? "السجل التجاري" : "Commercial Register"}</span>
              <input
                className="input-base mt-1"
                dir="ltr"
                value={toEnglishDigits(commercialRegister)}
                onChange={(e) => setCommercialRegister(toEnglishDigits(e.target.value))}
              />
            </label>
          </div>

          <div className="pt-2">
            <Button onClick={handleSaveCompany} disabled={savingCompany}>
              <Save className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {savingCompany ? common("saving") : t("saveCompany")}
            </Button>
          </div>
        </Card>
      )}

      {/* 2. BRANCHES MANAGER CRUD */}
      {activeTab === "branches" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <Card className="p-5 lg:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-black text-navy-950 dark:text-white">
                  {rtl ? "إدارة الفروع والمستودعات" : "Branches & Warehouses"}
                </h2>
                <p className="text-xs text-slate-500">
                  {rtl ? "إضافة فروع بيع جديدة، مصانع، أو مستودعات مركزية وربط العمليات بها." : "Manage store locations, warehouses, gold factories and bind users or stocks."}
                </p>
              </div>
              <Button onClick={handleCreateBranchClick} disabled={showBranchForm}>
                <Plus className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {rtl ? "إضافة فرع جديد" : "Add Branch"}
              </Button>
            </div>

            {/* Inline Add/Edit Form */}
            {showBranchForm && (
              <form onSubmit={handleSaveBranch} className="p-5 rounded-3xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-navy-950/20 space-y-4 animate-in slide-in-from-top-4 duration-300">
                <h3 className="font-bold text-xs text-navy-950 dark:text-white">
                  {editingBranch ? (rtl ? "تعديل الفرع" : "Edit Branch") : (rtl ? "إضافة فرع جديد" : "New Branch Details")}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="block">
                    <span className="label-base">{rtl ? "اسم الفرع" : "Branch Name"}</span>
                    <input
                      required
                      placeholder={rtl ? "مثال: فرع دبي مول" : "e.g. Dubai Mall Branch"}
                      className="input-base mt-1"
                      value={branchForm.name}
                      onChange={(e) => setBranchForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className="label-base">{rtl ? "رمز الفرع (Code)" : "Branch Code"}</span>
                    <input
                      required
                      placeholder="e.g. DXB-MALL"
                      className="input-base mt-1"
                      value={branchForm.code}
                      onChange={(e) => setBranchForm(prev => ({ ...prev, code: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className="label-base">{rtl ? "نوع الفرع" : "Branch Type"}</span>
                    <select
                      className="input-base mt-1"
                      value={branchForm.type}
                      onChange={(e) => setBranchForm(prev => ({ ...prev, type: e.target.value as any }))}
                    >
                      <option value="store">{rtl ? "معرض مبيعات (Store)" : "Retail Store"}</option>
                      <option value="warehouse">{rtl ? "مستودع رئيسي (Warehouse)" : "Warehouse"}</option>
                      <option value="factory">{rtl ? "ورشة / مصنع (Factory)" : "Factory/Workshop"}</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="label-base">{rtl ? "رقم الهاتف" : "Phone"}</span>
                    <input
                      placeholder="+971..."
                      className="input-base mt-1"
                      inputMode="tel"
                      dir="ltr"
                      value={toEnglishDigits(branchForm.phone)}
                      onChange={(e) => setBranchForm(prev => ({ ...prev, phone: toEnglishDigits(e.target.value) }))}
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="label-base">{rtl ? "العنوان بالتفصيل" : "Address"}</span>
                    <input
                      placeholder="Dubai, UAE"
                      className="input-base mt-1"
                      value={branchForm.address}
                      onChange={(e) => setBranchForm(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </label>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 font-bold text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      checked={branchForm.isActive}
                      onChange={(e) => setBranchForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                    <span>{rtl ? "فرع نشط" : "Active Branch"}</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={savingBranchLoading}>
                    <Check className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {savingBranchLoading ? common("saving") : (rtl ? "حفظ الفرع" : "Save Branch")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowBranchForm(false)}
                    disabled={savingBranchLoading}
                  >
                    {rtl ? "إلغاء" : "Cancel"}
                  </Button>
                </div>
              </form>
            )}

            {/* Filter Bar */}
            <div className="flex items-center gap-2">
              <input
                className="input-base max-w-sm"
                placeholder={rtl ? "ابحث عن الفروع..." : "Search branches..."}
                value={branchQuery}
                onChange={(e) => setBranchQuery(e.target.value)}
              />
            </div>

            {/* Branches List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredBranches.map((b) => {
                const isStore = b.type === "store";
                const isWarehouse = b.type === "warehouse";
                const Icon = isStore ? Building2 : isWarehouse ? Warehouse : Factory;

                return (
                  <Card key={b.id} className="p-4 border border-slate-200 hover:shadow-soft dark:border-slate-800 transition flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3 items-center">
                          <div className={`grid h-9 w-9 place-items-center rounded-xl font-bold ${b.isActive ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-black text-xs text-navy-950 dark:text-white">{b.name}</h4>
                            <p className="text-[10px] text-slate-400">{b.code} · {b.type.toUpperCase()}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${b.isActive ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"}`}>
                          {b.isActive ? (rtl ? "نشط" : "Active") : (rtl ? "غير نشط" : "Inactive")}
                        </span>
                      </div>

                      <div className="mt-4 text-[11px] space-y-1 text-slate-500 leading-relaxed">
                        {b.phone && <p>📞 {toEnglishDigits(b.phone)}</p>}
                        {b.address && <p>📍 {b.address}</p>}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex justify-end gap-1">
                      {canUpdateBranches && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs hover:bg-slate-100 dark:hover:bg-navy-900"
                          onClick={() => handleEditBranchClick(b)}
                        >
                          <Edit2 className="h-3 w-3 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                          {common("edit")}
                        </Button>
                      )}
                      {b.isActive ? (
                        canDeactivateBranches && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                            onClick={() => handleDeactivateBranch(b.id)}
                          >
                            <ToggleLeft className="h-3 w-3 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                            {common("deactivate")}
                          </Button>
                        )
                      ) : (
                        canReactivateBranches && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                            onClick={() => handleReactivateBranch(b.id)}
                          >
                            <Check className="h-3 w-3 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                            {common("reactivate")}
                          </Button>
                        )
                      )}
                      {canDeleteBranches && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          onClick={() => handleDeleteBranch(b.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                          {common("delete")}
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}

              {!filteredBranches.length && (
                <div className="col-span-full py-10 text-center text-xs text-slate-400">
                  {rtl ? "لا توجد فروع مطابقة للبحث" : "No matching branches found"}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* 3. PAYMENT METHODS */}
      {activeTab === "payments" && (
        <Card className="p-5 lg:p-6 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-navy-950 dark:text-white">{t("paymentMethods")}</h2>
              <p className="text-xs text-slate-500">
                {rtl ? "تمكين أو تعطيل وسائل السداد المتاحة في نقطة البيع POS." : "Configure available payment options inside your point of sale."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 max-w-2xl">
            {[
              { id: "cash", label: rtl ? "نقدي (Cash)" : "Cash" },
              { id: "card", label: rtl ? "بطاقة / شبكة (Card)" : "Debit/Credit Card" },
              { id: "transfer", label: rtl ? "تحويل بنكي (Bank Transfer)" : "Bank Transfer" },
              { id: "installment", label: rtl ? "تقسيط (Installment)" : "Installment sales" },
              { id: "deposit", label: rtl ? "عربون (Deposit)" : "Deposit booking" }
            ].map(m => {
              const isChecked = paymentMethods.includes(m.id);
              return (
                <label key={m.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-4 text-xs font-bold dark:border-slate-800 hover:border-brand-500 transition-all select-none">
                  <span>{m.label}</span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                    onChange={() => togglePaymentMethod(m.id)}
                  />
                </label>
              );
            })}
          </div>

          <div className="pt-2">
            <Button onClick={handleSavePayments} disabled={savingPayments}>
              <Save className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {savingPayments ? common("saving") : (rtl ? "حفظ طرق الدفع" : "Save Payments")}
            </Button>
          </div>
        </Card>
      )}

      {/* 4a. POS / RECEIPT PRINT OPTIONS (receipt key) — Phase 19W */}
      {activeTab === "printDesign" && (
        <Card className="p-5 lg:p-6 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-navy-950 dark:text-white">{rtl ? "إعدادات إيصال البيع / الكاشير" : "POS / Receipt Print Options"}</h2>
              <p className="text-xs text-slate-500">{rtl ? "رسائل مشتركة تظهر في الفواتير وإيصالات البيع، بالإضافة إلى خيارات إيصال نقطة البيع الحراري." : "Shared messages (shown on invoices and POS receipts) plus POS/thermal receipt-specific options."}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black text-navy-950 dark:text-white">{rtl ? "رسائل الفواتير والإيصالات" : "Invoice & Receipt Messages"}</h3>
            <p className="mt-1 text-[10px] text-slate-400">{rtl ? "تظهر هذه الرسائل في طباعة الفواتير وإيصالات البيع. نص عادي فقط ولا تؤثر على الإجماليات." : "These messages appear on printed invoices and POS receipts. Plain text only; they do not affect totals."}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block" htmlFor="receipt-welcome-message">
              <span className="label-base">{t("welcomeMessage")}</span>
              <input
                id="receipt-welcome-message"
                name="receipt-welcome-message"
                className="input-base mt-1"
                value={receiptForm.welcomeMessage}
                placeholder={t("welcomeMessagePh")}
                onChange={(e) => setReceiptForm(prev => ({ ...prev, welcomeMessage: e.target.value }))}
              />
            </label>
            <label className="block" htmlFor="receipt-header-note">
              <span className="label-base">{t("headerNote")}</span>
              <input
                id="receipt-header-note"
                name="receipt-header-note"
                className="input-base mt-1"
                value={receiptForm.headerNote}
                placeholder={t("headerNotePh")}
                onChange={(e) => setReceiptForm(prev => ({ ...prev, headerNote: e.target.value }))}
              />
            </label>
            <label className="block" htmlFor="receipt-footer-message">
              <span className="label-base">{t("footerMessage")}</span>
              <input
                id="receipt-footer-message"
                name="receipt-footer-message"
                className="input-base mt-1"
                value={receiptForm.footerMessage}
                placeholder={t("footerMessagePh")}
                onChange={(e) => setReceiptForm(prev => ({ ...prev, footerMessage: e.target.value }))}
              />
            </label>
            <label className="block" htmlFor="receipt-terms-message">
              <span className="label-base">{t("termsMessage")}</span>
              <input
                id="receipt-terms-message"
                name="receipt-terms-message"
                className="input-base mt-1"
                value={receiptForm.termsMessage}
                placeholder={t("termsMessagePh")}
                onChange={(e) => setReceiptForm(prev => ({ ...prev, termsMessage: e.target.value }))}
              />
            </label>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.02]">
            <h3 className="text-xs font-black text-navy-950 dark:text-white">{rtl ? "سلوك طباعة نقطة البيع" : "POS Print Behavior"}</h3>
            <p className="mt-1 text-[10px] text-slate-400">
              {rtl
                ? "يُستخدم كقالب افتراضي بعد إتمام بيع من نقطة البيع، ويمكن تغييره من نافذة الطباعة."
                : "Used as the default template after completing a POS sale. You can still change the template in the print dialog."}
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              {rtl
                ? "التحكم في إظهار وإخفاء الحقول يتم من مصمم طباعة الفاتورة بالأسفل."
                : "Field visibility is controlled from Invoice Print Builder below."}
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              {rtl
                ? "يتم الاحتفاظ بإعدادات الإيصال القديمة داخليًا للتوافق فقط."
                : "Legacy POS receipt options are preserved internally for backward compatibility."}
            </p>
            <label className="mt-3 block" htmlFor="receipt-default-pos-template">
              <span className="label-base">{rtl ? "قالب الطباعة الافتراضي لنقطة البيع" : "Default POS template"}</span>
              <select
                id="receipt-default-pos-template"
                name="receipt-default-pos-template"
                className="input-base mt-1 bg-input text-foreground border-border"
                value={receiptForm.defaultPosTemplate}
                onChange={(e) => setReceiptForm(prev => ({ ...prev, defaultPosTemplate: sanitizeDefaultPosTemplate(e.target.value) }))}
              >
                {POS_PRINT_TEMPLATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-panel text-foreground">
                    {rtl ? option.labelAr : option.labelEn}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="pt-2">
            <Button onClick={handleSaveReceipt} disabled={savingReceipt}>
              <Save className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {savingReceipt ? common("saving") : t("saveReceipt")}
            </Button>
          </div>
        </Card>
      )}

      {/* 4b. CUSTOM PRINT TEXT BLOCKS (Phase 20.2) */}
      {activeTab === "printDesign" && (
        <Card className="p-5 lg:p-6 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                <Edit2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-black text-navy-950 dark:text-white">
                  {rtl ? "نصوص طباعة مخصصة" : "Custom Print Text Blocks"}
                </h2>
                <p className="text-xs text-slate-500">
                  {rtl
                    ? "نصوص عادية فقط. تظهر في طباعة فواتير البيع/الكاشير ولا تؤثر على الإجماليات أو الحسابات."
                    : "Plain text only. These blocks appear on printed Sales/POS invoices and do not affect totals or accounting."}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddCustomBlock}
              disabled={customBlocksForm.blocks.length >= CUSTOM_PRINT_BLOCK_MAX_BLOCKS}
            >
              <Plus className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {rtl ? "إضافة نص" : "Add Block"}
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-[10px] text-slate-500 dark:border-white/10 dark:bg-white/[0.02]">
            {rtl
              ? `الحد الأقصى ${CUSTOM_PRINT_BLOCK_MAX_BLOCKS} نصوص. العنوان حتى ${CUSTOM_PRINT_BLOCK_TITLE_MAX} حرفاً والمحتوى حتى ${CUSTOM_PRINT_BLOCK_CONTENT_MAX} حرفاً. تنسيق النص محدود بخيارات آمنة للطباعة فقط. النص يظل عاديًا ولا يشغّل HTML أو scripts.`
              : `Maximum ${CUSTOM_PRINT_BLOCK_MAX_BLOCKS} blocks. Title up to ${CUSTOM_PRINT_BLOCK_TITLE_MAX} characters and content up to ${CUSTOM_PRINT_BLOCK_CONTENT_MAX} characters. Styling is limited to safe print options only. Text remains plain text and cannot run HTML or scripts.`}
          </div>

          {customBlocksForm.blocks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-500 dark:border-slate-800">
              {rtl ? "لا توجد نصوص مخصصة للطباعة حتى الآن." : "No custom print text blocks yet."}
            </div>
          ) : (
            <div className="space-y-4">
              {customBlocksForm.blocks.map((block, index) => {
                const activeTemplates = block.templates ?? POS_PRINT_TEMPLATE_OPTIONS.map((option) => option.value);
                return (
                  <div key={block.id} className="rounded-2xl border border-slate-100 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.02]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {renderToggle(
                        rtl ? "تفعيل النص" : "Enabled",
                        block.enabled,
                        (checked) => updateCustomBlock(block.id, { enabled: checked }),
                      )}
                      <Button type="button" variant="secondary" onClick={() => handleRemoveCustomBlock(block.id)}>
                        <Trash2 className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                        {rtl ? "حذف" : "Delete"}
                      </Button>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <label className="block" htmlFor={`custom-print-block-title-${block.id}`}>
                        <span className="label-base">{rtl ? "العنوان (اختياري)" : "Title (optional)"}</span>
                        <input
                          id={`custom-print-block-title-${block.id}`}
                          name={`custom-print-block-title-${index}`}
                          className="input-base mt-1"
                          maxLength={CUSTOM_PRINT_BLOCK_TITLE_MAX}
                          value={block.title ?? ""}
                          onChange={(e) => updateCustomBlock(block.id, { title: e.target.value })}
                        />
                      </label>

                      <label className="block" htmlFor={`custom-print-block-placement-${block.id}`}>
                        <span className="label-base">{rtl ? "الموضع" : "Placement"}</span>
                        <select
                          id={`custom-print-block-placement-${block.id}`}
                          name={`custom-print-block-placement-${index}`}
                          className="input-base mt-1 bg-input text-foreground border-border"
                          value={block.placement}
                          onChange={(e) => updateCustomBlock(block.id, { placement: e.target.value as CustomPrintBlockPlacement })}
                        >
                          {CUSTOM_PRINT_BLOCK_PLACEMENT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value} className="bg-panel text-foreground">
                              {rtl ? option.labelAr : option.labelEn}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block lg:col-span-2" htmlFor={`custom-print-block-content-${block.id}`}>
                        <span className="label-base">{rtl ? "المحتوى" : "Content"}</span>
                        <textarea
                          id={`custom-print-block-content-${block.id}`}
                          name={`custom-print-block-content-${index}`}
                          className="input-base mt-1 min-h-[96px]"
                          maxLength={CUSTOM_PRINT_BLOCK_CONTENT_MAX}
                          value={block.content}
                          onChange={(e) => updateCustomBlock(block.id, { content: e.target.value })}
                        />
                      </label>

                      <label className="block" htmlFor={`custom-print-block-sort-${block.id}`}>
                        <span className="label-base">{rtl ? "ترتيب العرض" : "Sort order"}</span>
                        <input
                          id={`custom-print-block-sort-${block.id}`}
                          name={`custom-print-block-sort-${index}`}
                          type="number"
                          className="input-base mt-1"
                          value={block.sortOrder}
                          onChange={(e) => updateCustomBlock(block.id, { sortOrder: Number(e.target.value) })}
                        />
                      </label>

                      <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 dark:border-white/10 dark:bg-white/[0.02]">
                        <p className="label-base">{rtl ? "تنسيق الطباعة" : "Print styling"}</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <label className="block" htmlFor={`custom-print-block-font-size-${block.id}`}>
                            <span className="label-base">{rtl ? "حجم الخط" : "Font size"}</span>
                            <select
                              id={`custom-print-block-font-size-${block.id}`}
                              name={`custom-print-block-font-size-${index}`}
                              className="input-base mt-1 bg-input text-foreground border-border"
                              value={(block.style ?? DEFAULT_CUSTOM_PRINT_BLOCK_STYLE).fontSize}
                              onChange={(e) => updateCustomBlockStyle(block, { fontSize: e.target.value as CustomPrintBlockFontSize })}
                            >
                              {CUSTOM_PRINT_BLOCK_FONT_SIZE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value} className="bg-panel text-foreground">
                                  {rtl ? option.labelAr : option.labelEn}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="block" htmlFor={`custom-print-block-align-${block.id}`}>
                            <span className="label-base">{rtl ? "المحاذاة" : "Alignment"}</span>
                            <select
                              id={`custom-print-block-align-${block.id}`}
                              name={`custom-print-block-align-${index}`}
                              className="input-base mt-1 bg-input text-foreground border-border"
                              value={(block.style ?? DEFAULT_CUSTOM_PRINT_BLOCK_STYLE).align}
                              onChange={(e) => updateCustomBlockStyle(block, { align: e.target.value as CustomPrintBlockAlignment })}
                            >
                              {CUSTOM_PRINT_BLOCK_ALIGNMENT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value} className="bg-panel text-foreground">
                                  {rtl ? option.labelAr : option.labelEn}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          {renderToggle(
                            rtl ? "تقيل" : "Bold",
                            (block.style ?? DEFAULT_CUSTOM_PRINT_BLOCK_STYLE).bold,
                            (checked) => updateCustomBlockStyle(block, { bold: checked }),
                          )}
                          {renderToggle(
                            rtl ? "مائل" : "Italic",
                            (block.style ?? DEFAULT_CUSTOM_PRINT_BLOCK_STYLE).italic,
                            (checked) => updateCustomBlockStyle(block, { italic: checked }),
                          )}
                          {renderToggle(
                            rtl ? "تحته خط" : "Underline",
                            (block.style ?? DEFAULT_CUSTOM_PRINT_BLOCK_STYLE).underline,
                            (checked) => updateCustomBlockStyle(block, { underline: checked }),
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="label-base">{rtl ? "القوالب" : "Templates"}</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {POS_PRINT_TEMPLATE_OPTIONS.map((option) => (
                            <label key={option.value} className="flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-2 text-xs dark:border-white/10">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                checked={activeTemplates.includes(option.value)}
                                onChange={(e) => handleToggleCustomBlockTemplate(block, option.value, e.target.checked)}
                              />
                              <span>{rtl ? option.labelAr : option.labelEn}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2">
            <Button onClick={handleSaveCustomBlocks} disabled={savingCustomBlocks}>
              <Save className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {savingCustomBlocks ? common("saving") : (rtl ? "حفظ النصوص المخصصة" : "Save Custom Blocks")}
            </Button>
          </div>
        </Card>
      )}

      {/* 4c. INVOICE PRINT DEFAULTS (Phase 19G) */}
      {activeTab === "printDesign" && (
        <Card className="p-5 lg:p-6 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-navy-950 dark:text-white">{rtl ? "طباعة الفاتورة الافتراضية" : "Invoice Print Defaults"}</h2>
              <p className="text-xs text-slate-500">
                {rtl
                  ? "الخيارات الافتراضية لنافذة طباعة الفاتورة. للعرض فقط ولا تغيّر بيانات الفاتورة."
                  : "Defaults for the invoice print dialog. Display-only — they never change invoice data."}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <label className="block">
              <span className="label-base">{rtl ? "نوع المستند" : "Document Type"}</span>
              <select
                className="input-base mt-1 bg-input text-foreground border-border"
                value={printDefaultsForm.documentMode}
                onChange={(e) => setPrintDefaultsForm(prev => ({ ...prev, documentMode: e.target.value as InvoicePrintOptions["documentMode"] }))}
              >
                <option value="auto" className="bg-panel text-foreground">{rtl ? "تلقائي حسب الفاتورة" : "Auto (from invoice)"}</option>
                <option value="taxInvoice" className="bg-panel text-foreground">{rtl ? "فاتورة ضريبية" : "Tax Invoice"}</option>
                <option value="salesInvoice" className="bg-panel text-foreground">{rtl ? "فاتورة مبيعات" : "Sales Invoice"}</option>
                <option value="returnInvoice" className="bg-panel text-foreground">{rtl ? "فاتورة مرتجع" : "Return Invoice"}</option>
                <option value="exchangeInvoice" className="bg-panel text-foreground">{rtl ? "فاتورة استبدال" : "Exchange Invoice"}</option>
                <option value="installmentInvoice" className="bg-panel text-foreground">{rtl ? "فاتورة أقساط" : "Installment Invoice"}</option>
                <option value="depositInvoice" className="bg-panel text-foreground">{rtl ? "فاتورة عربون" : "Deposit Invoice"}</option>
                <option value="giftVoucher" className="bg-panel text-foreground">{rtl ? "قسيمة هدية" : "Gift Voucher"}</option>
                <option value="customerGoldPurchase" className="bg-panel text-foreground">{rtl ? "شراء ذهب من عميل" : "Customer Gold Purchase"}</option>
              </select>
            </label>

            <label className="block">
              <span className="label-base">{rtl ? "قالب الطباعة" : "Template"}</span>
              <select
                className="input-base mt-1 bg-input text-foreground border-border"
                value={printDefaultsForm.templateId}
                onChange={(e) => setPrintDefaultsForm(prev => ({ ...prev, templateId: e.target.value as InvoicePrintOptions["templateId"] }))}
              >
                <option value="luxuryGold" className="bg-panel text-foreground">{rtl ? "الذهبي الفاخر A4" : "Luxury Gold A4"}</option>
                <option value="compactA4" className="bg-panel text-foreground">{rtl ? "مضغوط A4" : "Compact A4"}</option>
                <option value="minimal" className="bg-panel text-foreground">{rtl ? "بسيط A4" : "Minimal A4"}</option>
                <option value="thermal" className="bg-panel text-foreground">{rtl ? "إيصال حراري" : "Thermal Receipt"}</option>
              </select>
            </label>

            <label className="block">
              <span className="label-base">{rtl ? "اللغة" : "Language"}</span>
              <select
                className="input-base mt-1 bg-input text-foreground border-border"
                value={printDefaultsForm.languageMode}
                onChange={(e) => setPrintDefaultsForm(prev => ({ ...prev, languageMode: e.target.value as InvoicePrintOptions["languageMode"] }))}
              >
                <option value="bilingual" className="bg-panel text-foreground">{rtl ? "ثنائي اللغة" : "Bilingual (AR + EN)"}</option>
                <option value="ar" className="bg-panel text-foreground">{rtl ? "العربية" : "Arabic"}</option>
                <option value="en" className="bg-panel text-foreground">{rtl ? "الإنجليزية" : "English"}</option>
              </select>
            </label>
          </div>

          <div className="pt-2">
            <Button onClick={handleSavePrintDefaults} disabled={savingPrintDefaults}>
              <Save className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {savingPrintDefaults ? common("saving") : (rtl ? "حفظ إعدادات الطباعة" : "Save Print Defaults")}
            </Button>
          </div>
        </Card>
      )}

      {/* 4d. INVOICE PRINT BUILDER (Phase 19R) */}
      {activeTab === "printDesign" && (
        <Card className="p-5 lg:p-6 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-navy-950 dark:text-white">
                {rtl ? "مُصمّم طباعة الفاتورة" : "Invoice Print Builder"}
              </h2>
              <p className="text-xs text-slate-500">
                {rtl
                  ? "تخصيص ظهور الأقسام والحقول المطبوعة في كل قالب. للعرض فقط ولا تغيّر بيانات الفاتورة الحسابية."
                  : "Customize sections and fields visibility on print outputs per template. Display-only — does not affect financial data."}
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 max-w-3xl">
            <label className="block">
              <span className="label-base">{rtl ? "قالب الطباعة النشط للتعديل" : "Active Template to Customize"}</span>
              <select
                className="input-base mt-1 bg-input text-foreground border-border animate-none"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value as InvoicePrintTemplateId)}
              >
                <option value="luxuryGold" className="bg-panel text-foreground">{rtl ? "الذهبي الفاخر A4" : "Luxury Gold A4"}</option>
                <option value="compactA4" className="bg-panel text-foreground">{rtl ? "مضغوط A4" : "Compact A4"}</option>
                <option value="minimal" className="bg-panel text-foreground">{rtl ? "بسيط A4" : "Minimal A4"}</option>
                <option value="thermal" className="bg-panel text-foreground">{rtl ? "إيصال حراري" : "Thermal Receipt"}</option>
              </select>
            </label>

            <label className="block">
              <span className="label-base">{rtl ? "نمط السمة (اللون)" : "Theme Preset"}</span>
              <select
                className="input-base mt-1 bg-input text-foreground border-border animate-none"
                value={builderForm.templates[selectedTemplateId]?.themePreset || "classicGold"}
                onChange={(e) => handleThemePresetChange(e.target.value)}
              >
                <option value="classicGold" className="bg-panel text-foreground">{rtl ? "ذهبي كلاسيكي" : "Classic Gold"}</option>
                <option value="modernDark" className="bg-panel text-foreground">{rtl ? "داكن حديث" : "Modern Dark"}</option>
                <option value="softGold" className="bg-panel text-foreground">{rtl ? "ذهبي ناعم" : "Soft Gold"}</option>
                <option value="minimalGray" className="bg-panel text-foreground">{rtl ? "رمادي بسيط" : "Minimal Gray"}</option>
                <option value="thermalMono" className="bg-panel text-foreground">{rtl ? "حراري أحادي اللون" : "Thermal Mono"}</option>
              </select>
            </label>

            <label className="block">
              <span className="label-base">{rtl ? "لغة المعاينة" : "Preview Language"}</span>
              <select
                className="input-base mt-1 bg-input text-foreground border-border animate-none"
                value={previewLanguage}
                onChange={(e) => setPreviewLanguage(e.target.value as "bilingual" | "ar" | "en")}
              >
                <option value="bilingual" className="bg-panel text-foreground">{rtl ? "ثنائي اللغة (AR + EN)" : "Bilingual (AR + EN)"}</option>
                <option value="ar" className="bg-panel text-foreground">{rtl ? "العربية فقط" : "Arabic Only"}</option>
                <option value="en" className="bg-panel text-foreground">{rtl ? "الإنجليزية فقط" : "English Only"}</option>
              </select>
            </label>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950/40 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 max-w-3xl">
            {rtl
              ? "💡 أنماط السمات تؤثر على مظهر الطباعة فقط، ولا تغيّر قيم الفاتورة، أو الضرائب، أو القيود الحسابية في النظام."
              : "💡 Theme presets affect print appearance only. They do not change invoice data, totals, VAT, or accounting entries."}
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Responsive Layout Grid: Left Toggles (lg:col-span-5), Right Live Preview (lg:col-span-7) */}
          <div className="grid gap-6 lg:grid-cols-12">
            
            {/* Toggles Column */}
            <div className="lg:col-span-5 space-y-6">
              {/* Sections Toggles */}
              <div className="space-y-4">
                <h3 className="font-bold text-navy-950 dark:text-white text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                  {rtl ? "ظهور الأقسام" : "Section Visibility"}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { key: "header", labelAr: "ترويسة الشركة", labelEn: "Company Header" },
                    { key: "clientDetails", labelAr: "بيانات العميل", labelEn: "Customer Details" },
                    { key: "invoiceDetails", labelAr: "بيانات الفاتورة", labelEn: "Invoice Metadata" },
                    { key: "itemsTable", labelAr: "جدول الأصناف", labelEn: "Items Table" },
                    { key: "specialSummary", labelAr: "بيانات الاستبدال والأقساط", labelEn: "Special Summary Blocks" },
                    { key: "paymentMethod", labelAr: "طريقة الدفع", labelEn: "Payment Method List" },
                    { key: "amountDetails", labelAr: "تفاصيل المبالغ والإجماليات", labelEn: "Amount Details / Totals", warning: true },
                    { key: "notes", labelAr: "ملاحظات الفاتورة", labelEn: "Invoice Notes" },
                    { key: "welcomeMessage", labelAr: "رسالة الترحيب", labelEn: "Welcome Message" },
                    { key: "headerNote", labelAr: "ملاحظة أعلى الفاتورة", labelEn: "Header Note" },
                    { key: "footerMessage", labelAr: "رسالة أسفل الفاتورة", labelEn: "Footer Message" },
                    { key: "customTextBlocks", labelAr: "نصوص مخصصة", labelEn: "Custom text blocks" },
                    { key: "terms", labelAr: "الشروط والأحكام", labelEn: "Terms & Conditions" },
                    { key: "signatures", labelAr: "حقول التوقيع والختم", labelEn: "Signature Boxes" },
                    { key: "footer", labelAr: "تذييل الاتصال", labelEn: "Footer Contact Info" },
                  ].map((sec) => (
                    <div key={sec.key} className="space-y-1">
                      {renderToggle(
                        rtl ? sec.labelAr : sec.labelEn,
                        (builderForm.templates[selectedTemplateId]?.sections as any)?.[sec.key] ?? true,
                        (v) => handleToggleSection(sec.key, v)
                      )}
                      {sec.warning && !((builderForm.templates[selectedTemplateId]?.sections as any)?.[sec.key] ?? true) && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold px-2">
                          {rtl
                            ? "⚠️ إخفاء الإجماليات قد يجعل الفاتورة غير مستوفية للشروط النظامية."
                            : "⚠️ Hiding totals breakdown may make the invoice invalid for formal use."}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Fields Toggles */}
              <div className="space-y-4">
                <h3 className="font-bold text-navy-950 dark:text-white text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                  {rtl ? "ظهور الحقول الفردية" : "Field Visibility"}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { key: "companyLogo", labelAr: "شعار الشركة", labelEn: "Company Logo" },
                    { key: "companyTrn", labelAr: "الرقم الضريبي للشركة", labelEn: "Company TRN", warning: true },
                    { key: "watermark", labelAr: "العلامة المائية الخلفية", labelEn: "Watermark Background" },
                    { key: "customerPhone", labelAr: "هاتف العميل", labelEn: "Customer Phone" },
                    { key: "customerTrn", labelAr: "الرقم الضريبي للعميل", labelEn: "Customer TRN", warning: true },
                    { key: "customerAddress", labelAr: "عنوان العميل", labelEn: "Customer Address" },
                    { key: "invoiceBranch", labelAr: "فرع الفاتورة", labelEn: "Invoice branch" },
                    { key: "itemKarat", labelAr: "عيار الذهب", labelEn: "Karat Column" },
                    { key: "itemWeight", labelAr: "وزن الأصناف", labelEn: "Weight Column" },
                    { key: "itemAssetId", labelAr: "رقم القطعة (الباركود)", labelEn: "Asset ID / Barcode" },
                    { key: "salesperson", labelAr: "اسم البائع", labelEn: "Salesperson Name" },
                    { key: "originalInvoiceRef", labelAr: "مرجع الفاتورة الأصلية", labelEn: "Original Invoice Ref" },
                    { key: "footerPhone", labelAr: "هاتف الشركة بالتذييل", labelEn: "Footer Phone" },
                    { key: "footerEmail", labelAr: "بريد الشركة بالتذييل", labelEn: "Footer Email" },
                    { key: "footerAddress", labelAr: "عنوان الشركة بالتذييل", labelEn: "Footer Address" },
                  ].map((fld) => (
                    <div key={fld.key} className="space-y-1">
                      {renderToggle(
                        rtl ? fld.labelAr : fld.labelEn,
                        (builderForm.templates[selectedTemplateId]?.fields as any)?.[fld.key] ?? true,
                        (v) => handleToggleField(fld.key, v)
                      )}
                      {fld.warning && !((builderForm.templates[selectedTemplateId]?.fields as any)?.[fld.key] ?? true) && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold px-2">
                          {rtl
                            ? "⚠️ إخفاء الأرقام الضريبية قد يؤثر على الفواتير الضريبية."
                            : "⚠️ Hiding tax registration details may affect compliance."}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Preview Column */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-bold text-navy-950 dark:text-white text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                {rtl ? "معاينة مباشرة للفاتورة" : "Live Print Preview"}
              </h3>
              
              <div className="relative w-full overflow-hidden border border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-100 dark:bg-slate-900/50 shadow-inner h-[620px] flex flex-col animate-in fade-in duration-300">
                {/* Header bar indicating it is a mock sample */}
                <div className="bg-slate-200/50 dark:bg-navy-950/80 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                  <span>{rtl ? "معاينة مباشرة — فاتورة افتراضية" : "Live Preview — Sample Invoice Data"}</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-brand-500 text-white">
                    {rtl ? "تجريبي" : "Mock"}
                  </span>
                </div>

                {/* Main Scrollable Canvas */}
                <div className="flex-grow overflow-auto p-4 flex justify-center items-start">
                  {selectedTemplateId === "thermal" ? (
                    <div className="w-[80mm] min-w-[80mm] max-w-[80mm] bg-white text-black p-4 shadow-xl border border-slate-300 rounded-xl print-preview-content">
                      <InvoiceDocument
                        templateId={selectedTemplateId}
                        invoice={FIXTURE_INVOICE}
                        company={livePreviewCompany}
                        labels={FIXTURE_LABELS}
                        settings={{
                          ...settings,
                          invoicePrintBuilderConfig: builderForm,
                          invoicePrintCustomBlocks: customBlocksForm,
                        } as any}
                        locale={locale}
                        templateConfig={{
                          languageMode: previewLanguage,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="origin-top scale-[0.55] sm:scale-[0.6] md:scale-[0.65] lg:scale-[0.55] xl:scale-[0.62] shadow-xl border border-slate-300 bg-white text-black p-6 rounded-xl w-[210mm] min-w-[210mm] max-w-[210mm] mb-[-250px] print-preview-content">
                      <InvoiceDocument
                        templateId={selectedTemplateId}
                        invoice={FIXTURE_INVOICE}
                        company={livePreviewCompany}
                        labels={FIXTURE_LABELS}
                        settings={{
                          ...settings,
                          invoicePrintBuilderConfig: builderForm,
                          invoicePrintCustomBlocks: customBlocksForm,
                        } as any}
                        locale={locale}
                        templateConfig={{
                          languageMode: previewLanguage,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {selectedTemplateId === "thermal" ? (
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  {rtl
                    ? "💡 معاينة القالب الحراري تظهر بعرض 80 مم لتمثيل شريط الطابعة الحرارية."
                    : "💡 Thermal layout preview is constrained to 80mm width to represent physical receipt rolls."}
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  {rtl
                    ? "💡 معاينة قوالب A4 تظهر مصغرة لتناسب الشاشة. وتتسق تلقائياً كصفحة كاملة عند الطباعة."
                    : "💡 A4 layout previews are scaled down to fit your view. They render at full 210mm width when printed."}
                </p>
              )}
            </div>

          </div>

          <div className="flex flex-wrap justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={handleResetTemplateBuilder}>
              {rtl ? "إعادة تعيين القالب الحالي" : "Reset Current Template"}
            </Button>
            <Button onClick={handleSaveBuilder} disabled={savingBuilder}>
              <Save className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {savingBuilder ? common("saving") : (rtl ? "حفظ التغييرات" : "Save Changes")}
            </Button>
          </div>
        </Card>
      )}

      {/* 5. SYSTEM SETTINGS */}
      {activeTab === "system" && (
        <Card className="p-5 lg:p-6 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-navy-950 dark:text-white">{rtl ? "تكوين إعدادات النظام" : "System Configurations"}</h2>
              <p className="text-xs text-slate-500">
                {rtl ? "التحكم في نسبة الضريبة، وبادئة تسلسل الفواتير، ودقة الأرقام العشرية للمبالغ والوزن." : "Manage VAT taxes, numbering sequences, decimals and zero down payment policy."}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label-base">{rtl ? "نسبة ضريبة القيمة المضافة (%)" : "VAT Rate (%)"}</span>
              <input
                type="text"
                inputMode="decimal"
                dir="ltr"
                className="input-base mt-1"
                value={toEnglishDigits(vatRate)}
                onChange={(e) => setVatRate(normalizeNumberInput(e.target.value))}
              />
            </label>

            <label className="block">
              <span className="label-base">{rtl ? "دقة الأرقام العشرية (Decimal Precision)" : "Decimal Precision"}</span>
              <select
                className="input-base mt-1"
                dir="ltr"
                value={toEnglishDigits(decimalPrecision)}
                onChange={(e) => setDecimalPrecision(normalizeNumberInput(e.target.value))}
              >
                <option value="0">0 (e.g. 100)</option>
                <option value="1">1 (e.g. 100.1)</option>
                <option value="2">2 (e.g. 100.12)</option>
                <option value="3">3 (e.g. 100.123)</option>
                <option value="4">4 (e.g. 100.1234)</option>
              </select>
            </label>

            <label className="block">
              <span className="label-base">{rtl ? "حد تنبيه انخفاض المخزون" : "Low Stock Threshold Alert"}</span>
              <input
                type="text"
                inputMode="decimal"
                dir="ltr"
                className="input-base mt-1"
                value={toEnglishDigits(lowStockThreshold)}
                onChange={(e) => setLowStockThreshold(normalizeNumberInput(e.target.value))}
              />
            </label>

            <label className="block">
              <span className="label-base">{rtl ? "بادئة ترقيم الفواتير" : "Invoice Prefix Sequence"}</span>
              <input
                className="input-base mt-1"
                dir="ltr"
                value={toEnglishDigits(invoicePrefix)}
                placeholder="e.g. INV-2026"
                onChange={(e) => setInvoicePrefix(toEnglishDigits(e.target.value))}
              />
            </label>

            <div className="sm:col-span-2 border-t border-slate-100 dark:border-white/5 pt-4">
              <h3 className="text-xs font-black text-navy-950 dark:text-white mb-3">
                {rtl ? "قواعد البيع بالتقسيط" : "Installment Rules"}
              </h3>
            </div>

            <div className="sm:col-span-2">
              {renderToggle(
                rtl ? "تفعيل البيع بالتقسيط" : "Enable Installment Sales",
                installmentEnabled,
                setInstallmentEnabled
              )}
              <p className="mt-1.5 text-[10px] text-slate-400">
                {rtl
                  ? "عند الإيقاف، يختفي خيار التقسيط في نقطة البيع."
                  : "When disabled, the installment option is hidden in POS."}
              </p>
            </div>

            <label className="block">
              <span className="label-base">{rtl ? "تكرار الأقساط الافتراضي" : "Default Installment Frequency"}</span>
              <select
                className="input-base mt-1"
                value={installmentDefaultFrequency}
                onChange={(e) => setInstallmentDefaultFrequency(e.target.value)}
              >
                <option value="monthly">{rtl ? "شهري" : "Monthly"}</option>
                <option value="weekly">{rtl ? "أسبوعي" : "Weekly"}</option>
                <option value="custom">{rtl ? "مخصص" : "Custom"}</option>
              </select>
            </label>

            <label className="block">
              <span className="label-base">{rtl ? "الحد الأقصى لعدد الأقساط" : "Max Installment Count"}</span>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                className="input-base mt-1"
                value={toEnglishDigits(installmentMaxCount)}
                onChange={(e) => setInstallmentMaxCount(normalizeNumberInput(e.target.value))}
              />
            </label>

            <label className="block">
              <span className="label-base">{rtl ? "أدنى نسبة دفعة أولى (%)" : "Minimum Down Payment (%)"}</span>
              <input
                type="text"
                inputMode="decimal"
                dir="ltr"
                className="input-base mt-1"
                value={toEnglishDigits(installmentMinDownPaymentPercent)}
                onChange={(e) => setInstallmentMinDownPaymentPercent(normalizeNumberInput(e.target.value))}
              />
              <p className="mt-1.5 text-[10px] text-slate-400">
                {rtl ? "0 = لا يوجد حد أدنى." : "0 = no minimum."}
              </p>
            </label>

            <div className="sm:col-span-2">
              {renderToggle(
                rtl ? "السماح بالتقسيط بدون دفعة أولى (Zero Down Payment)" : "Allow Zero Down Payment Installments",
                allowZeroDownPayment,
                setAllowZeroDownPayment
              )}
              <p className="mt-1.5 text-[10px] text-slate-400">
                {rtl
                  ? "عند التفعيل، يمكن لمسؤول نقطة البيع إتمام البيع بالتقسيط بدون طلب دفعة أولى، وإلا فسيتم إجبار الكاشير على إدخال دفعة أولى إلا لو كان يمتلك صلاحية التجاوز."
                  : "If active, checkout for installments with $0 down payment is permitted without dedicated override permissions."}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={handleSaveSystem} disabled={savingSystem}>
              <Save className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {savingSystem ? common("saving") : (rtl ? "حفظ إعدادات النظام" : "Save Settings")}
            </Button>
          </div>
        </Card>
      )}

      {/* 6. BARCODE PRINT SETTINGS */}
      {activeTab === "barcode" && (
        <Card className="p-5 lg:p-6 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-navy-950 dark:text-white">{rtl ? "إعدادات قالب الباركود المطبوع" : "Barcode Template Settings"}</h2>
              <p className="text-xs text-slate-500">
                {rtl ? "تخصيص شكل وحقول الملصق المطبوع للأصول والمنتجات." : "Configure fields and sizes printed on the barcode labels."}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block">
              <span className="label-base">{rtl ? "قالب التصميم جاهز" : "Design Template"}</span>
              <select
                className="input-base mt-1"
                value={barcodeForm.template}
                onChange={(e) => handleBarcodeTemplateChange(e.target.value as any)}
              >
                <option value="detailed">{rtl ? "تفصيلي (شعار، اسم، عيار، وزن، سعر، باركود)" : "Detailed (Logo, Karat, Weight, Price)"}</option>
                <option value="compact">{rtl ? "مدمج (مختصر، بدون شعار وتفاصيل إضافية)" : "Compact (No logo or extra types)"}</option>
                <option value="price-hidden">{rtl ? "إخفاء السعر (كل البيانات عدا سعر البيع)" : "Price Hidden"}</option>
                <option value="custom">{rtl ? "مخصص (اختيار يدوي للحقول)" : "Custom Configuration"}</option>
              </select>
            </label>

            <label className="block">
              <span className="label-base">{rtl ? "نص مخصص أسفل الملصق" : "Custom Bottom Text"}</span>
              <input
                className="input-base mt-1"
                value={barcodeForm.customText}
                placeholder={rtl ? "مثال: صنع في الإمارات" : "e.g. Made in UAE"}
                onChange={(e) => setBarcodeForm(prev => ({ ...prev, customText: e.target.value, template: "custom" }))}
              />
            </label>

            <label className="block">
              <span className="label-base">{rtl ? "عرض الملصق (مم)" : "Label Width (mm)"}</span>
              <input
                type="number"
                className="input-base mt-1"
                value={barcodeForm.widthMm}
                onChange={(e) => setBarcodeForm(prev => ({ ...prev, widthMm: Number(e.target.value) }))}
              />
            </label>

            <label className="block">
              <span className="label-base">{rtl ? "ارتفاع الملصق (مم)" : "Label Height (mm)"}</span>
              <input
                type="number"
                className="input-base mt-1"
                value={barcodeForm.heightMm}
                onChange={(e) => setBarcodeForm(prev => ({ ...prev, heightMm: Number(e.target.value) }))}
              />
            </label>

            <label className="block">
              <span className="label-base">{rtl ? "حجم الخط (بكسل)" : "Font Size (px)"}</span>
              <input
                type="number"
                className="input-base mt-1"
                value={barcodeForm.fontSizePx}
                onChange={(e) => setBarcodeForm(prev => ({ ...prev, fontSizePx: Number(e.target.value) }))}
              />
            </label>

            <label className="block">
              <span className="label-base">{rtl ? "عدد الأعمدة في صفحة الطباعة" : "Columns per Print Row"}</span>
              <input
                type="number"
                className="input-base mt-1"
                value={barcodeForm.columns}
                onChange={(e) => setBarcodeForm(prev => ({ ...prev, columns: Number(e.target.value) }))}
              />
            </label>

            <label className="block">
              <span className="label-base">{rtl ? "اتجاه النص" : "Text Direction"}</span>
              <select
                className="input-base mt-1"
                value={barcodeForm.direction}
                onChange={(e) => setBarcodeForm(prev => ({ ...prev, direction: e.target.value as "RTL" | "LTR" }))}
              >
                <option value="RTL">{rtl ? "من اليمين لليسار (RTL)" : "Right to Left"}</option>
                <option value="LTR">{rtl ? "من اليسار لليمين (LTR)" : "Left to Right"}</option>
              </select>
            </label>

            <label className="block">
              <span className="label-base">{rtl ? "عدد النسخ الافتراضي" : "Default Copies"}</span>
              <input
                type="number"
                className="input-base mt-1"
                value={barcodeForm.copies}
                onChange={(e) => setBarcodeForm(prev => ({ ...prev, copies: Math.max(1, Number(e.target.value)) }))}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {renderToggle(rtl ? "إطار خارجي للملصق" : "Show Label Border", barcodeForm.showBorder, (v) => setBarcodeForm(prev => ({ ...prev, showBorder: v })))}
            {renderToggle(rtl ? "شعار الشركة" : "Show Logo", barcodeForm.showLogo, (v) => setBarcodeForm(prev => ({ ...prev, showLogo: v, template: "custom" })))}
            {renderToggle(rtl ? "اسم الشركة" : "Show Company Name", barcodeForm.showCompanyName, (v) => setBarcodeForm(prev => ({ ...prev, showCompanyName: v, template: "custom" })))}
            {renderToggle(rtl ? "رمز المنتج / الباركود" : "Show Product/Asset Code", barcodeForm.showAssetId, (v) => setBarcodeForm(prev => ({ ...prev, showAssetId: v, template: "custom" })))}
            {renderToggle(rtl ? "اسم المنتج" : "Show Product Name", barcodeForm.showName, (v) => setBarcodeForm(prev => ({ ...prev, showName: v, template: "custom" })))}
            {renderToggle(rtl ? "عيار الذهب" : "Show Gold Karat", barcodeForm.showKarat, (v) => setBarcodeForm(prev => ({ ...prev, showKarat: v, template: "custom" })))}
            {renderToggle(rtl ? "وزن المنتج" : "Show Weight", barcodeForm.showWeight, (v) => setBarcodeForm(prev => ({ ...prev, showWeight: v, template: "custom" })))}
            {renderToggle(rtl ? "سعر البيع" : "Show Retail Price", barcodeForm.showPrice, (v) => setBarcodeForm(prev => ({ ...prev, showPrice: v, template: "custom" })))}
            {renderToggle(rtl ? "نوع المخزون" : "Show Stock Type", barcodeForm.showType, (v) => setBarcodeForm(prev => ({ ...prev, showType: v, template: "custom" })))}
            {renderToggle(rtl ? "فرع المنتج" : "Show Branch", barcodeForm.showBranch, (v) => setBarcodeForm(prev => ({ ...prev, showBranch: v, template: "custom" })))}
            {renderToggle(rtl ? "اسم المورد" : "Show Supplier", barcodeForm.showSupplier, (v) => setBarcodeForm(prev => ({ ...prev, showSupplier: v, template: "custom" })))}
            {renderToggle(rtl ? "تاريخ الإضافة" : "Show Creation Date", barcodeForm.showDate, (v) => setBarcodeForm(prev => ({ ...prev, showDate: v, template: "custom" })))}
            {renderToggle(rtl ? "رمز الاستجابة السريعة QR" : "Show QR Code", barcodeForm.showQrCode, (v) => setBarcodeForm(prev => ({ ...prev, showQrCode: v, template: "custom" })))}
          </div>

          <div className="pt-2">
            <Button onClick={handleSaveBarcode} disabled={savingBarcode}>
              <Save className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {savingBarcode ? common("saving") : (rtl ? "حفظ إعدادات الباركود" : "Save Barcode Settings")}
            </Button>
          </div>
        </Card>
      )}

      {/* Card link for users management */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/settings/users">
          <Card className="p-5 transition hover:border-brand-300 hover:shadow-soft flex items-center justify-between group">
            <div className="flex gap-4 items-center">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                <UsersRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-xs text-navy-950 dark:text-white group-hover:text-brand-600 transition">
                  {t("usersManagement")}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{t("usersManagementDesc")}</p>
              </div>
            </div>
            <span className="text-slate-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">→</span>
          </Card>
        </Link>

        <Card className="p-5 flex items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-xs text-navy-950 dark:text-white">
                {rtl ? "صلاحيات وحماية دقيقة" : "Granular Permissions Guard"}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {rtl ? "جميع صلاحيات المستخدمين تُفرز وتُطابق في الواجهة والخلفية لحماية البيانات." : "Granular authorization gates protect front-end screens and back-end endpoints."}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
