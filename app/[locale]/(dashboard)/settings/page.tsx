"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
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

  const [activeTab, setActiveTab] = useState<"company" | "branches" | "payments" | "receipt" | "system" | "barcode">("company");
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // --- Company Profile State ---
  const [businessName, setBusinessName] = useState("");
  const [logo, setLogo] = useState("");
  const [logoFailed, setLogoFailed] = useState(false);
  const [currency, setCurrency] = useState("AED");
  const [taxNumber, setTaxNumber] = useState("");
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
    layout: "standard" as "standard" | "compact" | "detailed"
  });
  const [savingReceipt, setSavingReceipt] = useState(false);

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
          vatNumber: toEnglishDigits(settings.receipt?.vatNumber || "")
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
  }, [settings, company]);

  useEffect(() => {
    setLogoFailed(false);
  }, [logo]);

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

    if (process.env.NEXT_PUBLIC_DATA_SOURCE !== "api") {
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
      const success = await updateSettings({
        businessName: businessName.trim(),
        logo,
        currency: normalizeCurrencyCode(currency.trim())
      });

      // Update auth context company info as well
      updateCompany({
        businessName: businessName.trim(),
        logo,
        currency: normalizeCurrencyCode(currency.trim()),
        taxNumber: taxNumber.trim()
      });

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
          { id: "receipt", label: rtl ? "تصميم الفاتورة" : "Receipt Layout", icon: Receipt },
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

      {/* 4. RECEIPT CUSTOMIZATION */}
      {activeTab === "receipt" && (
        <Card className="p-5 lg:p-6 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-navy-950 dark:text-white">{t("receiptTitle")}</h2>
              <p className="text-xs text-slate-500">{t("receiptDesc")}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block">
              <span className="label-base">{t("welcomeMessage")}</span>
              <input
                className="input-base mt-1"
                value={receiptForm.welcomeMessage}
                placeholder={t("welcomeMessagePh")}
                onChange={(e) => setReceiptForm(prev => ({ ...prev, welcomeMessage: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="label-base">{t("headerNote")}</span>
              <input
                className="input-base mt-1"
                value={receiptForm.headerNote}
                placeholder={t("headerNotePh")}
                onChange={(e) => setReceiptForm(prev => ({ ...prev, headerNote: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="label-base">{t("footerMessage")}</span>
              <input
                className="input-base mt-1"
                value={receiptForm.footerMessage}
                placeholder={t("footerMessagePh")}
                onChange={(e) => setReceiptForm(prev => ({ ...prev, footerMessage: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="label-base">{t("termsMessage")}</span>
              <input
                className="input-base mt-1"
                value={receiptForm.termsMessage}
                placeholder={t("termsMessagePh")}
                onChange={(e) => setReceiptForm(prev => ({ ...prev, termsMessage: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="label-base">{t("receiptPhone")}</span>
              <input
                className="input-base mt-1"
                inputMode="tel"
                dir="ltr"
                value={toEnglishDigits(receiptForm.phone)}
                onChange={(e) => setReceiptForm(prev => ({ ...prev, phone: toEnglishDigits(e.target.value) }))}
              />
            </label>
            <label className="block">
              <span className="label-base">{t("vatNumber")}</span>
              <input
                className="input-base mt-1"
                inputMode="numeric"
                dir="ltr"
                value={toEnglishDigits(receiptForm.vatNumber)}
                onChange={(e) => setReceiptForm(prev => ({ ...prev, vatNumber: toEnglishDigits(e.target.value) }))}
              />
            </label>
            <label className="block lg:col-span-2">
              <span className="label-base">{t("receiptAddress")}</span>
              <input
                className="input-base mt-1"
                value={receiptForm.address}
                onChange={(e) => setReceiptForm(prev => ({ ...prev, address: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="label-base">{rtl ? "حجم الورق" : "Paper Size"}</span>
              <select
                className="input-base mt-1 bg-input text-foreground border-border"
                value={receiptForm.paperSize}
                onChange={(e) => setReceiptForm(prev => ({ ...prev, paperSize: e.target.value as any }))}
              >
                <option value="thermal" className="bg-panel text-foreground">{rtl ? "حراري (80مم)" : "Thermal (80mm)"}</option>
                <option value="A4" className="bg-panel text-foreground">A4</option>
                <option value="A5" className="bg-panel text-foreground">A5</option>
              </select>
            </label>
            <label className="block">
              <span className="label-base">{rtl ? "تنسيق الطباعة" : "Print Layout"}</span>
              <select
                className="input-base mt-1 bg-input text-foreground border-border"
                value={receiptForm.layout}
                onChange={(e) => setReceiptForm(prev => ({ ...prev, layout: e.target.value as any }))}
              >
                <option value="standard" className="bg-panel text-foreground">{rtl ? "قياسي" : "Standard"}</option>
                <option value="compact" className="bg-panel text-foreground">{rtl ? "مدمج" : "Compact"}</option>
                <option value="detailed" className="bg-panel text-foreground">{rtl ? "تفصيلي" : "Detailed"}</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {renderToggle(t("showLogo"), receiptForm.showLogo, (v) => setReceiptForm(prev => ({ ...prev, showLogo: v })))}
            {renderToggle(t("showCashier"), receiptForm.showCashier, (v) => setReceiptForm(prev => ({ ...prev, showCashier: v })))}
            {renderToggle(t("showBarcode"), receiptForm.showBarcode, (v) => setReceiptForm(prev => ({ ...prev, showBarcode: v })))}
            {renderToggle(t("showVatNumber"), receiptForm.showVatNumber, (v) => setReceiptForm(prev => ({ ...prev, showVatNumber: v })))}
            {renderToggle(rtl ? "عرض اسم الشركة" : "Show Company Name", receiptForm.showCompanyName ?? true, (v) => setReceiptForm(prev => ({ ...prev, showCompanyName: v })))}
            {renderToggle(rtl ? "عرض الرقم الضريبي" : "Show Tax Number", receiptForm.showTaxNumber ?? true, (v) => setReceiptForm(prev => ({ ...prev, showTaxNumber: v })))}
            {renderToggle(rtl ? "عرض عنوان الشركة" : "Show Company Address", receiptForm.showAddress ?? true, (v) => setReceiptForm(prev => ({ ...prev, showAddress: v })))}
            {renderToggle(rtl ? "عرض هاتف الشركة" : "Show Company Phone", receiptForm.showPhone ?? true, (v) => setReceiptForm(prev => ({ ...prev, showPhone: v })))}
            {renderToggle(rtl ? "عرض رمز الاستجابة السريعة (QR)" : "Show QR Code", receiptForm.showQrCode ?? true, (v) => setReceiptForm(prev => ({ ...prev, showQrCode: v })))}
            {renderToggle(rtl ? "عرض تفصيل الضريبة" : "Show VAT Breakdown", receiptForm.showVatBreakdown ?? true, (v) => setReceiptForm(prev => ({ ...prev, showVatBreakdown: v })))}
            {renderToggle(rtl ? "عرض بيانات العميل" : "Show Customer Info", receiptForm.showCustomerInfo ?? true, (v) => setReceiptForm(prev => ({ ...prev, showCustomerInfo: v })))}
            {renderToggle(rtl ? "عرض بيانات الفرع" : "Show Branch Info", receiptForm.showBranchInfo ?? true, (v) => setReceiptForm(prev => ({ ...prev, showBranchInfo: v })))}
          </div>

          <div className="pt-2">
            <Button onClick={handleSaveReceipt} disabled={savingReceipt}>
              <Save className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {savingReceipt ? common("saving") : t("saveReceipt")}
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
