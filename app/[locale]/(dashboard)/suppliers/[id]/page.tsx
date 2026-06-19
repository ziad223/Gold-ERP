"use client";

import { use, useState, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  FileText,
  History,
  ShieldAlert,
  Paperclip,
  Truck,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Award,
  Upload,
  Trash,
  Info,
  Plus,
  Eye,
  Download,
  X,
  File,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSupplier, useSupplierMutations } from "@/hooks/use-suppliers";
import { Link } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useAppSettings } from "@/contexts/settings-context";
import { toast } from "sonner";
import type { SupplierDocument, SupplierConsignment } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default function SupplierProfilePage({ params }: PageProps) {
  const { id } = use(params);
  const t = useTranslations("Suppliers");
  const common = useTranslations("Common");
  const locale = useLocale();
  const rtl = locale === "ar";
  const { company } = useAuth();
  const { settings } = useAppSettings();

  const { supplier, purchaseOrders, consignments, documents, loading, error, refresh } = useSupplier(id);
  const { updateSupplier, uploadDocument, deleteDocument } = useSupplierMutations();
  const [activeTab, setActiveTab] = useState("overview");

  // New mock document form state
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("Tax Certificate");
  const [docExpiry, setDocExpiry] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docFileError, setDocFileError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<SupplierDocument | null>(null);
  const [replacingDocId, setReplacingDocId] = useState<string | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!docFile) {
      setFilePreviewUrl(null);
      return;
    }
    if (docFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(docFile);
      setFilePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFilePreviewUrl(null);
    }
  }, [docFile]);

  // New mock consignment state
  const [consAssetId, setConsAssetId] = useState("");
  const [consAssetName, setConsAssetName] = useState("");
  const [consWeight, setConsWeight] = useState("");
  const [consPrice, setConsPrice] = useState("");

  const currency = company?.currency ?? "AED";
  const money = (val: number) => formatCurrency(val, currency, locale);

  const getExpiryStatus = (dateStr: string) => {
    if (!dateStr) return "active";
    const expiry = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    
    if (expiry < today) return "expired";
    
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 30) return "expiring_soon";
    
    return "active";
  };

  const formatBytes = (bytes?: number, decimals = 1) => {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return "";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const getFileUrl = (doc: SupplierDocument) => {
    if (!doc.url) return "#";
    if (doc.url.startsWith("data:") || doc.url.startsWith("http://") || doc.url.startsWith("https://")) {
      return doc.url;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const baseHost = apiUrl.replace(/\/api\/v1\/?$/, "");
    return `${baseHost}${doc.url}`;
  };

  const validateAndSetFile = (file: File) => {
    setDocFileError("");
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setDocFileError(t("invalidFileType") || (rtl ? "نوع الملف غير مسموح. المسموح فقط PDF, JPG, PNG, WEBP" : "Invalid file type. Only PDF, JPG, PNG, WEBP are allowed."));
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      setDocFileError(t("fileTooLarge") || (rtl ? "حجم الملف كبير جدًا (الحد الأقصى 5 ميجابايت)" : "File is too large (maximum 5MB)."));
      return false;
    }
    setDocFile(file);
    return true;
  };

  const handleAddDocument = async () => {
    if (!supplier) return;
    if (!docName.trim() || !docExpiry) {
      toast.error(rtl ? "يرجى إدخال اسم المستند وتاريخ انتهائه" : "Please fill in all document fields");
      return;
    }
    if (!docFile) {
      toast.error(rtl ? "يرجى اختيار ملف لرفعه" : "Please select a file to upload");
      return;
    }

    setUploading(true);
    try {
      const uploadRes = await uploadDocument(supplier.id, docName.trim(), docType, docExpiry, docFile);
      if (uploadRes.success) {
        if (replacingDocId) {
          const deleteRes = await deleteDocument(supplier.id, replacingDocId);
          if (!deleteRes.success) {
            console.error("Failed to delete old document during replacement:", deleteRes.error);
          }
        }
        toast.success(rtl ? "تم حفظ المستند بنجاح" : "Document saved successfully");
        setDocName("");
        setDocExpiry("");
        setDocFile(null);
        setDocFileError("");
        setReplacingDocId(null);
        refresh();
      } else {
        toast.error(uploadRes.error?.message || (rtl ? "فشل رفع المستند" : "Failed to upload document"));
      }
    } catch (err: any) {
      toast.error(err?.message || (rtl ? "حدث خطأ غير متوقع" : "An unexpected error occurred"));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveDocument = async (docId: string) => {
    if (!supplier) return;
    if (!confirm(rtl ? "هل أنت متأكد من حذف هذا المستند؟" : "Are you sure you want to delete this document?")) {
      return;
    }
    const res = await deleteDocument(supplier.id, docId);
    if (res.success) {
      toast.success(rtl ? "تم حذف المستند بنجاح" : "Document removed successfully");
      refresh();
    } else {
      toast.error(res.error?.message || (rtl ? "فشل حذف المستند" : "Failed to remove document"));
    }
  };

  const handleReplaceClick = (doc: SupplierDocument) => {
    setDocName(doc.name);
    setDocType(doc.type);
    setDocExpiry(doc.expiryDate);
    setReplacingDocId(doc.id);
    setDocFile(null);
    setDocFileError("");
    toast.info(
      rtl
        ? `تم تفعيل وضع الاستبدال للمستند "${doc.name}"`
        : `Replacement mode active for "${doc.name}"`
    );
  };

  const handleCancelReplacement = () => {
    setReplacingDocId(null);
    setDocName("");
    setDocExpiry("");
    setDocFile(null);
    setDocFileError("");
  };

  const handleAddConsignment = async () => {
    if (!supplier) return;
    if (!consAssetId.trim() || !consAssetName.trim() || !consWeight || !consPrice) {
      toast.error(rtl ? "يرجى تعبئة كافة الحقول" : "Please fill in all consignment fields");
      return;
    }

    const newCons: SupplierConsignment = {
      id: `CON-${Date.now()}`,
      assetId: consAssetId.trim(),
      assetName: consAssetName.trim(),
      weight: Number(consWeight) || 0,
      agreedPrice: Number(consPrice) || 0,
      receivedDate: new Date().toISOString().slice(0, 10),
      status: "available",
    };

    const currentCons = supplier.consignments || [];
    const res = await updateSupplier(supplier.id, {
      consignments: [...currentCons, newCons],
    });

    if (res.success) {
      toast.success(rtl ? "تم إضافة بضاعة الأمانة" : "Consignment item added");
      setConsAssetId("");
      setConsAssetName("");
      setConsWeight("");
      setConsPrice("");
    } else {
      toast.error(res.error?.message || "Failed to add consignment");
    }
  };

  const handleRemoveConsignment = async (consId: string) => {
    if (!supplier) return;
    const currentCons = supplier.consignments || [];
    const res = await updateSupplier(supplier.id, {
      consignments: currentCons.filter((c) => c.id !== consId),
    });

    if (res.success) {
      toast.success(rtl ? "تم إزالة بضاعة الأمانة" : "Consignment removed");
    } else {
      toast.error(res.error?.message || "Failed to remove consignment");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">{common("loading")}</div>;
  }

  if (error || !supplier) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldAlert className="h-12 w-12 text-rose-500" />
        <h2 className="mt-4 text-lg font-black text-navy-950 dark:text-white">
          {rtl ? "المورد غير موجود" : "Supplier Not Found"}
        </h2>
        <p className="mt-2 text-xs text-slate-500">
          {rtl
            ? "عذرًا، لم نتمكن من العثور على ملف هذا المورد."
            : "Sorry, we couldn't find this supplier profile."}
        </p>
        <Link href="/suppliers" className="mt-6">
          <Button variant="secondary">
            <ArrowLeft className="mr-2 h-4 w-4" /> {common("back")}
          </Button>
        </Link>
      </div>
    );
  }

  // Calculate RCM VAT Info (if country is outside UAE, e.g. international supplier)
  const isInternational = supplier.country && supplier.country.toUpperCase() !== "AE" && supplier.country.toUpperCase() !== "UAE";
  const rcmEstimatedVat = supplier.due * ((Number(settings.vatRate) || 0) / 100); // VAT under RCM (rate from settings)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/suppliers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </Link>
        <div>
          <span className="text-xs text-slate-400">
            {rtl ? "ملف المورد" : "Supplier Profile"} · {supplier.id}
          </span>
          <h1 className="text-xl font-black text-navy-950 dark:text-white">{supplier.name}</h1>
        </div>
        <div className="ml-auto flex gap-2 rtl:mr-auto rtl:ml-0">
          <Badge tone={supplier.status === "inactive" ? "rose" : "green"}>
            {supplier.status === "inactive" ? common("inactive") : common("active")}
          </Badge>
          <Badge tone="blue">{supplier.category}</Badge>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {[
          { id: "overview", label: rtl ? "نظرة عامة" : "Overview", icon: Truck },
          { id: "purchases", label: rtl ? "أوامر الشراء والاستلام" : "POs & Receipts", icon: History },
          { id: "ledger", label: rtl ? "دفتر الأستاذ المحلي" : "Statement Ledger", icon: FileText },
          { id: "consignments", label: rtl ? "بضائع الأمانة" : "Consignments", icon: Paperclip },
          { id: "rcm", label: rtl ? "ضريبة RCM العكسية" : "Reverse Charge (RCM)", icon: Info },
          { id: "documents", label: rtl ? "المستندات والتراخيص" : "Documents", icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
      {activeTab === "overview" && (
        <Card className="p-5">
          <h3 className="font-black text-navy-950 dark:text-white">
            {rtl ? "تفاصيل المورد الأساسية" : "Basic Supplier Details"}
          </h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 text-xs">
            <div>
              <p className="text-slate-400">{t("phone")}</p>
              <p className="mt-1 font-bold text-navy-900 dark:text-slate-200">{supplier.phone}</p>
            </div>
            <div>
              <p className="text-slate-400">{common("email")}</p>
              <p className="mt-1 font-bold text-navy-900 dark:text-slate-200">{supplier.email || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400">{rtl ? "شروط الدفع" : "Payment Terms"}</p>
              <p className="mt-1 font-bold text-navy-900 dark:text-slate-200">{supplier.paymentTerms || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400">{rtl ? "الدولة" : "Country"}</p>
              <p className="mt-1 font-bold text-navy-900 dark:text-slate-200">{supplier.country || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400">{rtl ? "الرقم الضريبي" : "Tax Registration Number (TRN)"}</p>
              <p className="mt-1 font-bold text-navy-900 dark:text-slate-200">{supplier.taxNumber || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400">{rtl ? "السجل التجاري" : "Commercial Register"}</p>
              <p className="mt-1 font-bold text-navy-900 dark:text-slate-200">{supplier.commercialRegister || "—"}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-slate-400">{rtl ? "ملاحظات" : "Notes"}</p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">{supplier.notes || "—"}</p>
            </div>
          </div>
        </Card>
      )}

      {activeTab === "purchases" && (
        <Card className="p-5">
          <h3 className="font-black text-navy-950 dark:text-white">
            {rtl ? "سجل أوامر الشراء والفواتير المستلمة" : "Purchase Orders & Received Bills"}
          </h3>
          {purchaseOrders && purchaseOrders.length ? (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead className="bg-slate-50 text-slate-500 dark:bg-navy-950">
                  <tr>
                    <th className="px-4 py-3 text-start">{rtl ? "معرّف الطلب" : "PO ID"}</th>
                    <th className="px-4 py-3 text-start">{rtl ? "التاريخ" : "Date"}</th>
                    <th className="px-4 py-3 text-start">{rtl ? "الفرع" : "Branch"}</th>
                    <th className="px-4 py-3 text-start">{rtl ? "الإجمالي" : "Total"}</th>
                    <th className="px-4 py-3 text-start">{common("status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-brand-600">{po.id}</td>
                      <td className="px-4 py-3 text-slate-500">{po.date}</td>
                      <td className="px-4 py-3 text-slate-500">{po.branch}</td>
                      <td className="px-4 py-3 font-bold">{money(po.total)}</td>
                      <td className="px-4 py-3">
                        <Badge
                          tone={
                            po.status === "received"
                              ? "green"
                              : po.status === "sent"
                              ? "blue"
                              : "slate"
                          }
                        >
                          {po.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-5 text-center text-xs text-slate-400 py-10">
              {rtl ? "لا توجد أوامر شراء مسجلة." : "No registered purchase orders."}
            </p>
          )}
        </Card>
      )}

      {activeTab === "ledger" && (
        <Card className="p-5">
          <div className="border-b border-slate-100 pb-4 mb-4 dark:border-slate-800">
            <h3 className="font-black text-navy-950 dark:text-white">
              {rtl ? "دفتر الأستاذ وكشف المورد (معاينة محلية)" : "Supplier Ledger & Statement (Local Preview)"}
            </h3>
            <p className="text-[10px] text-amber-600 font-bold mt-1">
              {rtl
                ? "⚠️ تنبيه: هذه المعاينة تقريبية محاكاة محلياً، ولا تعبر عن السجلات المحاسبية القانونية للشركة."
                : "⚠️ Warning: This is a simulated local preview, not an official legal ledger."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 text-center">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-navy-950">
              <p className="text-[10px] text-slate-400">{rtl ? "الرصيد الافتتاحي" : "Opening Balance"}</p>
              <p className="mt-1 text-sm font-bold">{money(0)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-navy-950">
              <p className="text-[10px] text-slate-400">{rtl ? "إجمالي الفواتير" : "Total Invoiced"}</p>
              <p className="mt-1 text-sm font-bold">
                {money((Array.isArray(purchaseOrders) ? purchaseOrders : []).reduce((sum, po) => sum + (Number(po.total) || 0), 0))}
              </p>
            </div>
            <div className="rounded-2xl bg-rose-50 p-4 dark:bg-navy-950">
              <p className="text-[10px] text-rose-800">{rtl ? "الرصيد المستحق الحالي" : "Current Outstanding Due"}</p>
              <p className="mt-1 text-lg font-black text-rose-700">{money(supplier.due)}</p>
            </div>
          </div>
        </Card>
      )}

      {activeTab === "consignments" && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-5 md:col-span-2">
            <h3 className="font-black text-navy-950 dark:text-white">
              {rtl ? "بضائع الأمانة المستلمة" : "Received Consignments"}
            </h3>
            {consignments && consignments.length ? (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead className="bg-slate-50 text-slate-500 dark:bg-navy-950">
                    <tr>
                      <th className="px-4 py-2 text-start">{rtl ? "معرّف الأصل" : "Asset ID"}</th>
                      <th className="px-4 py-2 text-start">{rtl ? "الاسم" : "Name"}</th>
                      <th className="px-4 py-2 text-start">{rtl ? "الوزن" : "Weight"}</th>
                      <th className="px-4 py-2 text-start">{rtl ? "السعر المتفق عليه" : "Agreed Price"}</th>
                      <th className="px-4 py-2 text-start">{common("status")}</th>
                      <th className="px-4 py-2 text-end">{common("actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {consignments.map((cons) => (
                      <tr key={cons.id}>
                        <td className="px-4 py-3 font-bold text-navy-900 dark:text-white">{cons.assetId}</td>
                        <td className="px-4 py-3 text-slate-500">{cons.assetName}</td>
                        <td className="px-4 py-3 text-slate-500">{cons.weight} g</td>
                        <td className="px-4 py-3 font-bold">{money(cons.agreedPrice)}</td>
                        <td className="px-4 py-3">
                          <Badge tone={cons.status === "available" ? "green" : cons.status === "sold" ? "blue" : "slate"}>
                            {cons.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:bg-rose-50"
                            onClick={() => handleRemoveConsignment(cons.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-5 text-center text-xs text-slate-400 py-10">
                {rtl ? "لا توجد بضائع أمانة مسجلة." : "No recorded consignment assets."}
              </p>
            )}
          </Card>

          <Card className="p-5 h-fit">
            <h3 className="font-black text-navy-950 dark:text-white">
              {rtl ? "إضافة بضاعة أمانة" : "Add Consignment Asset"}
            </h3>
            <div className="mt-5 space-y-4 text-xs">
              <label className="block">
                <span className="label-base">{rtl ? "معرّف الأصل" : "Asset ID"}</span>
                <input
                  required
                  placeholder="AST-2026-0099"
                  className="input-base mt-1"
                  value={consAssetId}
                  onChange={(e) => setConsAssetId(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="label-base">{rtl ? "اسم القطعة" : "Piece Name"}</span>
                <input
                  required
                  placeholder="e.g. Diamond ring"
                  className="input-base mt-1"
                  value={consAssetName}
                  onChange={(e) => setConsAssetName(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="label-base">{rtl ? "الوزن (جرام)" : "Weight (grams)"}</span>
                <input
                  type="number"
                  placeholder="12.5"
                  className="input-base mt-1"
                  value={consWeight}
                  onChange={(e) => setConsWeight(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="label-base">{rtl ? "السعر المتفق عليه" : "Agreed Price"}</span>
                <input
                  type="number"
                  placeholder="3000"
                  className="input-base mt-1"
                  value={consPrice}
                  onChange={(e) => setConsPrice(e.target.value)}
                />
              </label>
              <Button className="w-full mt-2" onClick={handleAddConsignment}>
                <Plus className="h-4 w-4 mr-2" />
                {rtl ? "إضافة البضاعة" : "Add Consignment"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "rcm" && (
        <Card className="p-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4 dark:border-slate-800">
            <Info className="h-6 w-6 text-brand-600" />
            <div>
              <h3 className="font-black text-navy-950 dark:text-white">
                {rtl ? "آلية الاحتساب العكسي لضريبة القيمة المضافة (Informational RCM VAT)" : "Reverse Charge Mechanism VAT Preview"}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                {rtl
                  ? "تُطبق آلية الاحتساب العكسي تلقائياً عند استيراد الذهب أو المجوهرات أو الخدمات من موردين خارج الدولة."
                  : "RCM VAT applies when importing gold or diamonds from international suppliers."}
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-navy-950 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">{rtl ? "استيراد دولي:" : "International Import:"}</span>
                <span className="font-bold">{isInternational ? (rtl ? "نعم" : "Yes") : (rtl ? "لا (محلي)" : "No (Local)")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{rtl ? "الدولة المسجلة للمورد:" : "Supplier Country:"}</span>
                <span className="font-bold">{supplier.country || "—"}</span>
              </div>
              {isInternational && (
                <div className="flex justify-between border-t border-slate-200 pt-2 mt-2 dark:border-slate-800">
                  <span className="font-bold text-navy-900 dark:text-slate-200">
                    {rtl ? "ضريبة RCM التقريبية (5%):" : "Estimated RCM VAT (5%):"}
                  </span>
                  <span className="font-black text-amber-600">{money(rcmEstimatedVat)}</span>
                </div>
              )}
            </div>
            {isInternational && (
              <p className="text-[10px] text-slate-400">
                {rtl
                  ? "* ملاحظة: يجب على المحاسب إقرار هذه الضريبة في الإقرار الضريبي للشركة كضريبة مدخلات ومخرجات مستحقة متزامنة."
                  : "* Note: RCM VAT must be declared on the periodic VAT return form as both input and output tax simultaneously."}
              </p>
            )}
          </div>
        </Card>
      )}

      {activeTab === "documents" && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-5 md:col-span-2">
            <h3 className="font-black text-navy-950 dark:text-white flex items-center justify-between">
              <span>{rtl ? "التراخيص والمستندات القانونية" : "Legal Documents & Registers"}</span>
              <span className="text-xs font-normal text-slate-400">
                {documents ? documents.length : 0} {rtl ? "مستندات" : "documents"}
              </span>
            </h3>
            {documents && documents.length ? (
              <div className="mt-5 space-y-4">
                {documents.map((doc) => {
                  const status = getExpiryStatus(doc.expiryDate);
                  const fileUrl = getFileUrl(doc);
                  const isImage = doc.mimeType?.startsWith("image/") || doc.url?.startsWith("data:image/") || /\.(jpg|jpeg|png|webp)$/i.test(doc.fileName || "");
                  const isPdf = doc.mimeType === "application/pdf" || doc.url?.startsWith("data:application/pdf") || /\.(pdf)$/i.test(doc.fileName || "");

                  return (
                    <div
                      key={doc.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-slate-100 p-4 gap-4 text-xs dark:border-slate-800 hover:shadow-sm transition-shadow duration-150"
                    >
                      <div className="flex items-start gap-3">
                        {/* Thumbnail / Icon preview */}
                        {isImage ? (
                          <div 
                            className="relative h-12 w-12 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800"
                            onClick={() => setPreviewDoc(doc)}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={fileUrl}
                              alt={doc.name}
                              className="h-full w-full object-cover hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        ) : (
                          <div className={`grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl font-bold ${isPdf ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20' : 'bg-slate-50 text-slate-500 dark:bg-navy-950'} text-xs`}>
                            {isPdf ? "PDF" : "DOC"}
                          </div>
                        )}

                        <div className="space-y-1">
                          <p className="font-bold text-navy-900 dark:text-white text-sm">{doc.name}</p>
                          <div className="text-[10px] text-slate-400 space-y-0.5">
                            <p>
                              <span className="font-medium text-slate-500">{doc.type}</span>
                              {doc.expiryDate && (
                                <>
                                  {" · "}
                                  <span className={status === "expired" ? "text-rose-500 font-bold" : status === "expiring_soon" ? "text-amber-500 font-bold" : ""}>
                                    {rtl ? `ينتهي في: ${doc.expiryDate}` : `Expires: ${doc.expiryDate}`}
                                  </span>
                                </>
                              )}
                            </p>
                            {(doc.fileSize || doc.uploadedAt) && (
                              <p className="flex flex-wrap items-center gap-x-2">
                                {doc.fileSize && <span>{formatBytes(doc.fileSize)}</span>}
                                {doc.fileSize && doc.uploadedAt && <span>·</span>}
                                {doc.uploadedAt && (
                                  <span>
                                    {t("uploadedAt")}: {new Date(doc.uploadedAt).toLocaleDateString(locale)}
                                  </span>
                                )}
                                {doc.uploadedBy && (
                                  <>
                                    <span>·</span>
                                    <span>{rtl ? `بواسطة ${doc.uploadedBy}` : `by ${doc.uploadedBy}`}</span>
                                  </>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 border-t pt-3 sm:border-t-0 sm:pt-0 border-slate-50 dark:border-slate-800">
                        {status === "expired" ? (
                          <Badge tone="rose">{rtl ? "منتهي الصلاحية" : "Expired"}</Badge>
                        ) : status === "expiring_soon" ? (
                          <Badge tone="amber">{rtl ? "ينتهي قريباً" : "Expiring soon"}</Badge>
                        ) : (
                          <Badge tone="green">{rtl ? "ساري" : "Active"}</Badge>
                        )}

                        <div className="flex items-center gap-1">
                          {/* Preview Button */}
                          {isImage ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              title={t("preview")}
                              className="h-8 w-8 p-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-950"
                              onClick={() => setPreviewDoc(doc)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          ) : (
                            isPdf && (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={t("preview")}
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-950"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </a>
                            )
                          )}

                          {/* Download Button */}
                          {doc.url && (
                            <a
                              href={fileUrl}
                              download={doc.originalFileName || doc.name}
                              title={t("download")}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-950"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </a>
                          )}

                          {/* Replace Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            title={t("replaceFile")}
                            className="h-8 w-8 p-0 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/20"
                            onClick={() => handleReplaceClick(doc)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>

                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            title={t("deleteDocument")}
                            className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                            onClick={() => handleRemoveDocument(doc.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-5 text-center text-xs text-slate-400 py-12 border border-dashed border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-navy-950/20">
                {rtl ? "لا توجد مستندات مسجلة." : "No registered legal documents."}
              </p>
            )}
          </Card>

          <Card className="p-5 h-fit flex flex-col gap-4">
            <div>
              <h3 className="font-black text-navy-950 dark:text-white">
                {replacingDocId 
                  ? (rtl ? "استبدال المستند" : "Replace Document") 
                  : (rtl ? "إضافة ترخيص/مستند" : "Add Legal Document")
                }
              </h3>
              {replacingDocId && (
                <div className="mt-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-2 text-[10px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />
                  <div className="flex-1">
                    <p className="font-bold">
                      {rtl 
                        ? `وضع الاستبدال نشط للمستند: ${docName}` 
                        : `Replacing document: ${docName}`}
                    </p>
                    <p className="mt-0.5 opacity-80">
                      {rtl 
                        ? "سيتم رفع الملف الجديد وحذف الملف القديم بمجرد الحفظ." 
                        : "Uploading a new file will delete the old one upon saving."}
                    </p>
                    <button
                      onClick={handleCancelReplacement}
                      className="mt-1 font-bold text-brand-600 underline cursor-pointer"
                    >
                      {rtl ? "إلغاء الاستبدال" : "Cancel Replacement"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 text-xs">
              <label className="block">
                <span className="label-base font-medium text-slate-600 dark:text-slate-300">{rtl ? "اسم المستند" : "Document Name"}</span>
                <input
                  required
                  placeholder="e.g. Commercial License"
                  className="input-base mt-1"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                />
              </label>
              
              <label className="block">
                <span className="label-base font-medium text-slate-600 dark:text-slate-300">{rtl ? "نوع المستند" : "Document Type"}</span>
                <select
                  className="input-base mt-1"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                >
                  <option value="Commercial Register">{rtl ? "السجل التجاري" : "Commercial Register"}</option>
                  <option value="Tax Certificate">{rtl ? "الشهادة الضريبية" : "Tax Certificate"}</option>
                  <option value="Assay Compliance">{rtl ? "شهادة مطابقة الفحص" : "Assay Compliance"}</option>
                </select>
              </label>

              <label className="block">
                <span className="label-base font-medium text-slate-600 dark:text-slate-300">{rtl ? "تاريخ الانتهاء" : "Expiry Date"}</span>
                <input
                  type="date"
                  required
                  className="input-base mt-1"
                  value={docExpiry}
                  onChange={(e) => setDocExpiry(e.target.value)}
                />
              </label>

              {/* Drag and Drop Dropzone */}
              <div>
                <span className="label-base font-medium text-slate-600 dark:text-slate-300 mb-1 block">
                  {rtl ? "الملف المرفق" : "Attached File"}
                </span>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) validateAndSetFile(file);
                  }}
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) validateAndSetFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ${
                    isDragOver
                      ? "border-brand-500 bg-brand-50/50 dark:bg-brand-950/10"
                      : docFile
                      ? "border-emerald-300 bg-emerald-50/10 dark:bg-emerald-950/5"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 dark:border-slate-800 dark:bg-navy-950/20"
                  }`}
                >
                  {docFile ? (
                    <div className="w-full flex items-center gap-3">
                      {filePreviewUrl ? (
                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={filePreviewUrl}
                            alt="preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg font-bold text-[10px] ${
                          docFile.type === "application/pdf" ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20' : 'bg-slate-100 text-slate-600 dark:bg-navy-950'
                        }`}>
                          {docFile.type === "application/pdf" ? "PDF" : "FILE"}
                        </div>
                      )}
                      
                      <div className="flex-1 text-start overflow-hidden">
                        <p className="font-bold truncate text-slate-800 dark:text-slate-200 text-xs">{docFile.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{formatBytes(docFile.size)}</p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDocFile(null);
                          setDocFileError("");
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="h-6 w-6 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-950 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-slate-400 mb-2" />
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        {t("dropFileHere")}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {t("allowedFiles")}
                      </p>
                    </>
                  )}
                </div>

                {docFileError && (
                  <p className="text-rose-500 font-bold mt-1 text-[10px] text-start flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                    {docFileError}
                  </p>
                )}
              </div>

              <Button
                className="w-full mt-2"
                onClick={handleAddDocument}
                disabled={uploading || !docName.trim() || !docExpiry || !docFile}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin animate-infinite" />
                    {rtl ? "جاري الرفع..." : "Uploading..."}
                  </>
                ) : (
                  <>
                    {replacingDocId ? <RefreshCw className="h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    {replacingDocId ? t("replaceFile") : t("uploadDocument")}
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Premium Image Preview Modal */}
      {previewDoc && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewDoc(null)}
        >
          <div 
            className="relative max-w-3xl w-full bg-white dark:bg-navy-950 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="font-black text-sm text-navy-950 dark:text-white">{previewDoc.name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {previewDoc.type} · {rtl ? `ينتهي في: ${previewDoc.expiryDate}` : `Expires: ${previewDoc.expiryDate}`}
                </p>
              </div>
              <button 
                onClick={() => setPreviewDoc(null)}
                className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-950 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Image Body */}
            <div className="flex-1 bg-slate-950/5 dark:bg-black/40 flex items-center justify-center p-6 min-h-[300px] max-h-[60vh] overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={getFileUrl(previewDoc)} 
                alt={previewDoc.name} 
                className="max-h-[50vh] max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>
            
            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-navy-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400 font-medium">
                {previewDoc.fileSize && `${t("fileSize")}: ${formatBytes(previewDoc.fileSize)}`}
              </span>
              <div className="flex items-center gap-2">
                {previewDoc.url && (
                  <a 
                    href={getFileUrl(previewDoc)} 
                    download={previewDoc.originalFileName || previewDoc.name}
                  >
                    <Button size="sm" variant="secondary" className="gap-2">
                      <Download className="h-4 w-4" />
                      {t("download")}
                    </Button>
                  </a>
                )}
                <Button size="sm" onClick={() => setPreviewDoc(null)}>
                  {rtl ? "إغلاق" : "Close"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
