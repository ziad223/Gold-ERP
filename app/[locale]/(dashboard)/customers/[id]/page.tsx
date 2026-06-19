"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  FileText,
  History,
  ShieldAlert,
  Paperclip,
  User,
  ArrowLeft,
  Calendar,
  DollarSign,
  MapPin,
  Award,
  Upload,
  Trash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCustomer, useCustomerMutations } from "@/hooks/use-customers";
import { Link, useRouter } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import type { AttachmentMetadata, KYCStatus, AMLStatus, CustomerKycDetails } from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { normalizeEntity, normalizeItems } from "@/lib/api/normalize";
import { queryKeys } from "@/lib/query-keys";
import { invalidateAffectedQueries } from "@/lib/realtime/invalidate-affected-queries";
import { DATA_SOURCE } from "@/lib/data-source";
import { toEnglishDigits } from "@/lib/formatters/numbers";
import { getPublicFileUrl } from "@/lib/files";
import { useErp } from "@/contexts/erp-context";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

interface CustomerAttachmentRecord {
  id: string;
  fileName?: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  fileUrl: string;
  category?: string;
  uploadedBy?: string;
  uploadedAt: string;
}

type KycFormState = {
  identityType: string;
  identityNumber: string;
  identityExpiryDate: string;
  kycStatus: KYCStatus;
  amlStatus: AMLStatus;
};

function normalizeKycStatus(value?: string): KYCStatus {
  if (value === "verified" || value === "pending" || value === "flagged" || value === "not-started") return value;
  if (value === "not_started") return "not-started";
  return "not-started";
}

function detectAttachmentLabel(file: CustomerAttachmentRecord | AttachmentMetadata) {
  const category = "category" in file ? file.category : undefined;
  if (category) return category.toUpperCase();
  const mime = "mimeType" in file ? file.mimeType : file.type;
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("image")) return "IMAGE";
  if (mime.includes("sheet") || mime.includes("csv")) return "SHEET";
  if (mime.includes("word")) return "DOC";
  return "FILE";
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function CustomerProfilePage({ params }: PageProps) {
  const { id } = use(params);
  const t = useTranslations("Customers");
  const common = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const { company } = useAuth();
  const queryClient = useQueryClient();

  const { customer, loading, error, calculateStatement, refresh } = useCustomer(id);
  const { updateCustomer } = useCustomerMutations();
  const [activeTab, setActiveTab] = useState("overview");

  // Invoices react-query & local fallback
  const { invoices: erpInvoices } = useErp();
  const localInvoices = useMemo(() => {
    return erpInvoices.filter((inv) => inv.customerId === id);
  }, [erpInvoices, id]);

  const invoicesQuery = useQuery<any[]>({
    queryKey: queryKeys.customerInvoices(id),
    queryFn: async () => {
      const res = await apiClient<any>(`/customers/${id}/invoices`, {
        locale,
        skipBranch: true,
      });
      return normalizeItems<any>(res);
    },
    enabled: !!id && DATA_SOURCE === "api",
  });

  const displayInvoices = DATA_SOURCE === "api" ? (invoicesQuery.data ?? []) : localInvoices;

  // Statement preview state
  const [statement, setStatement] = useState<any>(null);
  const [loadingStatement, setLoadingStatement] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState("");
  const [failedAttachmentUrls, setFailedAttachmentUrls] = useState<Set<string>>(new Set());
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);
  const [kycForm, setKycForm] = useState<KycFormState>({
    identityType: "",
    identityNumber: "",
    identityExpiryDate: "",
    kycStatus: "not-started",
    amlStatus: "clear",
  });
  const [savingKyc, setSavingKyc] = useState(false);

  const currency = company?.currency ?? "AED";
  const money = (val: number) => toEnglishDigits(formatCurrency(val, currency, locale));

  const attachmentsQuery = useQuery<CustomerAttachmentRecord[]>({
    queryKey: queryKeys.customerAttachments(id),
    queryFn: async () => normalizeItems<CustomerAttachmentRecord>(
      await apiClient(`/customers/${encodeURIComponent(id)}/attachments`, {
        locale,
        skipBranch: true,
      })
    ),
    enabled: !!id && DATA_SOURCE === "api",
  });

  useEffect(() => {
    if (!selectedFile || !selectedFile.type.startsWith("image/")) {
      setSelectedPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setSelectedPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  useEffect(() => {
    if (!customer) return;
    const details: Partial<CustomerKycDetails> = customer.kycDetails || {};
    setKycForm({
      identityType: details.identityType || details.idType || customer.idType || "",
      identityNumber: details.identityNumber || details.idNumber || customer.idNumber || "",
      identityExpiryDate: details.identityExpiryDate || details.idExpiry || customer.idExpiry || "",
      kycStatus: normalizeKycStatus(details.status || customer.kycStatus),
      amlStatus: (details.amlStatus || customer.amlStatus || "clear") as AMLStatus,
    });
  }, [customer]);

  const loadStatement = async () => {
    setLoadingStatement(true);
    const data = await calculateStatement();
    setStatement(data);
    setLoadingStatement(false);
  };

  const handleUploadAttachment = async () => {
    if (!customer) return;
    if (!selectedFile) {
      toast.error(locale === "ar" ? "اختر ملفًا أولًا" : "Please select a file first");
      return;
    }
    setUploadingAttachment(true);
    try {
      if (DATA_SOURCE !== "api") {
        const newAttach: AttachmentMetadata = {
          id: `ATT-${Date.now()}`,
          name: selectedFile.name,
          type: selectedFile.type || selectedFile.name.split(".").pop()?.toUpperCase() || "FILE",
          size: selectedFile.size,
          uploadedAt: new Date().toISOString().slice(0, 10),
          localPreviewRef: selectedPreviewUrl,
        };
        const currentAttachments = customer.attachments || [];
        const res = await updateCustomer(customer.id, { attachments: [...currentAttachments, newAttach] });
        if (!res.success) throw new Error(res.error?.message || "Failed to add attachment");
      } else {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const created = normalizeEntity<CustomerAttachmentRecord>(
          await apiClient(`/customers/${encodeURIComponent(customer.id)}/attachments`, {
            method: "POST",
            body: formData,
            locale,
            skipBranch: true,
          })
        );
        if (created) {
          queryClient.setQueryData<CustomerAttachmentRecord[]>(
            queryKeys.customerAttachments(customer.id),
            (old = []) => [created, ...old.filter((item) => item.id !== created.id)]
          );
        }
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.customerAttachments(customer.id) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.customer(customer.id) }),
        ]);
        invalidateAffectedQueries(queryClient, {
          entity: "Attachment",
          action: "upload",
          related: { customerId: customer.id },
        });
      }
      await refresh();
      setSelectedFile(null);
      toast.success(locale === "ar" ? "تم رفع المرفق بنجاح" : "Attachment uploaded");
    } catch (err: any) {
      toast.error(err?.message || (locale === "ar" ? "فشل رفع المرفق" : "Failed to upload attachment"));
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleRemoveAttachment = async (attachId: string) => {
    if (!customer) return;
    setDeletingAttachmentId(attachId);
    try {
      if (DATA_SOURCE !== "api") {
        const currentAttachments = customer.attachments || [];
        const res = await updateCustomer(customer.id, {
          attachments: currentAttachments.filter((a) => a.id !== attachId),
        });
        if (!res.success) throw new Error(res.error?.message || "Failed to remove attachment");
      } else {
        await apiClient(`/customers/${encodeURIComponent(customer.id)}/attachments/${encodeURIComponent(attachId)}`, {
          method: "DELETE",
          locale,
          skipBranch: true,
        });
        queryClient.setQueryData<CustomerAttachmentRecord[]>(
          queryKeys.customerAttachments(customer.id),
          (old = []) => old.filter((item) => item.id !== attachId)
        );
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.customerAttachments(customer.id) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.customer(customer.id) }),
        ]);
        invalidateAffectedQueries(queryClient, {
          entity: "Attachment",
          action: "delete",
          id: attachId,
          related: { customerId: customer.id },
        });
      }
      await refresh();
      toast.success(locale === "ar" ? "تم حذف المرفق" : "Attachment deleted");
    } catch (err: any) {
      toast.error(err?.message || (locale === "ar" ? "فشل حذف المرفق" : "Failed to remove attachment"));
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  const saveKyc = async () => {
    if (!customer) return;
    setSavingKyc(true);
    try {
      if (DATA_SOURCE === "api") {
        const res = await apiClient<any>(`/customers/${encodeURIComponent(customer.id)}/kyc`, {
          method: "PATCH",
          locale,
          skipBranch: true,
          body: JSON.stringify(kycForm),
        });
        const updated = normalizeEntity<any>(res);
        if (updated) {
          queryClient.setQueryData(queryKeys.customer(customer.id), updated);
        }
      } else {
        const res = await updateCustomer(customer.id, {
          idType: kycForm.identityType,
          idNumber: kycForm.identityNumber,
          idExpiry: kycForm.identityExpiryDate,
          kycStatus: kycForm.kycStatus,
          amlStatus: kycForm.amlStatus,
          kycDetails: {
            ...(customer.kycDetails || {}),
            identityType: kycForm.identityType,
            identityNumber: kycForm.identityNumber,
            identityExpiryDate: kycForm.identityExpiryDate,
            idType: kycForm.identityType,
            idNumber: kycForm.identityNumber,
            idExpiry: kycForm.identityExpiryDate,
            status: kycForm.kycStatus,
            amlStatus: kycForm.amlStatus,
            lastCheckedAt: new Date().toISOString().slice(0, 10),
          },
        });
        if (!res.success) throw new Error(res.error?.message || "Failed to save KYC");
      }
      invalidateAffectedQueries(queryClient, {
        entity: "KYC",
        action: "update",
        id: customer.id,
        related: { customerId: customer.id },
      });
      await refresh();
      toast.success(locale === "ar" ? "تم حفظ بيانات التحقق" : "KYC data saved");
    } catch (err: any) {
      toast.error(err?.message || (locale === "ar" ? "فشل حفظ بيانات التحقق" : "Failed to save KYC"));
    } finally {
      setSavingKyc(false);
    }
  };

  const displayAttachments: Array<CustomerAttachmentRecord | AttachmentMetadata> =
    DATA_SOURCE === "api" ? (attachmentsQuery.data ?? []) : (customer?.attachments || []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">{common("loading")}</div>;
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldAlert className="h-12 w-12 text-rose-500" />
        <h2 className="mt-4 text-lg font-black text-navy-950 dark:text-white">
          {locale === "ar" ? "العميل غير موجود" : "Customer Not Found"}
        </h2>
        <p className="mt-2 text-xs text-slate-500">
          {locale === "ar"
            ? "عذرًا، لم نتمكن من العثور على ملف هذا العميل أو تم حذفه."
            : "Sorry, we couldn't find this customer profile. It might have been deleted."}
        </p>
        <Link href="/customers" className="mt-6">
          <Button variant="secondary">
            <ArrowLeft className="mr-2 h-4 w-4" /> {common("back")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </Link>
        <div>
          <span className="text-xs text-slate-400">
            {locale === "ar" ? "ملف العميل" : "Customer Profile"} · {toEnglishDigits(customer.id)}
          </span>
          <h1 className="text-xl font-black text-navy-950 dark:text-white">{customer.name}</h1>
        </div>
        <div className="ml-auto flex gap-2 rtl:mr-auto rtl:ml-0">
          <Badge tone={customer.tier === "VIP" ? "violet" : customer.tier === "Gold" ? "amber" : "slate"}>
            {customer.tier}
          </Badge>
          <Badge tone={customer.status === "inactive" ? "rose" : "green"}>
            {customer.status === "inactive" ? common("inactive") : common("active")}
          </Badge>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {[
          { id: "overview", label: locale === "ar" ? "نظرة عامة" : "Overview", icon: User },
          { id: "sales", label: locale === "ar" ? "المبيعات والفواتير" : "Sales & Invoices", icon: History },
          { id: "statement", label: locale === "ar" ? "كشف حساب تجريبي" : "Statement Preview", icon: FileText },
          { id: "kyc", label: locale === "ar" ? "التحقق والـ KYC" : "KYC & AML Check", icon: ShieldAlert },
          { id: "attachments", label: locale === "ar" ? "المرفقات والملفات" : "Attachments & Metadata", icon: Paperclip },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "statement") loadStatement();
              }}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-all ${
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
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-5 md:col-span-2">
            <h3 className="font-black text-navy-950 dark:text-white">
              {locale === "ar" ? "المعلومات الأساسية" : "Basic Information"}
            </h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 text-xs">
              <div>
                <p className="text-slate-400">{t("phone")}</p>
                <p className="mt-1 font-bold text-navy-900 dark:text-slate-200">{customer.phone}</p>
              </div>
              <div>
                <p className="text-slate-400">{t("email")}</p>
                <p className="mt-1 font-bold text-navy-900 dark:text-slate-200">{customer.email || "—"}</p>
              </div>
              <div>
                <p className="text-slate-400">{locale === "ar" ? "تاريخ الميلاد" : "Date of Birth"}</p>
                <p className="mt-1 font-bold text-navy-900 dark:text-slate-200">{toEnglishDigits(customer.kycDetails?.dateOfBirth || "—")}</p>
              </div>
              <div>
                <p className="text-slate-400">{locale === "ar" ? "الجنسية" : "Nationality"}</p>
                <p className="mt-1 font-bold text-navy-900 dark:text-slate-200">{customer.kycDetails?.nationality || "—"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-slate-400">{locale === "ar" ? "ملاحظات" : "Notes"}</p>
                <p className="mt-1 text-slate-600 dark:text-slate-400">{customer.notes || "—"}</p>
              </div>
            </div>

            {/* Addresses list */}
            <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800">
              <h4 className="flex items-center gap-2 font-black text-navy-950 dark:text-white">
                <MapPin className="h-4 w-4 text-brand-600" />
                {locale === "ar" ? "العناوين المسجلة" : "Registered Addresses"}
              </h4>
              {customer.addresses && customer.addresses.length ? (
                <div className="mt-4 space-y-3">
                  {customer.addresses.map((addr, idx) => (
                    <div key={idx} className="rounded-2xl bg-slate-50 p-4 text-xs dark:bg-navy-950">
                      <p className="font-bold">{addr.line1}</p>
                      {addr.line2 && <p className="mt-1 text-slate-400">{addr.line2}</p>}
                      <p className="mt-1 text-slate-500">
                        {addr.city}, {addr.country} {addr.postalCode && `· ${addr.postalCode}`}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-400">
                  {locale === "ar" ? "لا توجد عناوين مسجلة للعميل." : "No registered addresses."}
                </p>
              )}
            </div>
          </Card>

          <Card className="p-5 h-fit">
            <h3 className="font-black text-navy-950 dark:text-white">
              {locale === "ar" ? "الولاء والائتمان" : "Loyalty & Credit"}
            </h3>
            <div className="mt-5 space-y-4 text-xs">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-navy-950">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-brand-600" />
                  <div>
                    <p className="font-bold">{locale === "ar" ? "نقاط الولاء" : "Loyalty Points"}</p>
                    <p className="text-[10px] text-slate-400">
                      {locale === "ar" ? "نقاط متراكمة من المشتريات" : "Points earned from purchases"}
                    </p>
                  </div>
                </div>
                <span className="text-lg font-black text-brand-700 dark:text-brand-300">
                  {toEnglishDigits(customer.loyaltyPoints || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-navy-950">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-bold">{locale === "ar" ? "الحد الائتماني" : "Credit Limit"}</p>
                    <p className="text-[10px] text-slate-400">
                      {locale === "ar" ? "الحد الأقصى للمبالغ المستحقة" : "Max outstanding allowed"}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                  {customer.creditLimit ? money(customer.creditLimit) : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-navy-950">
                <div>
                  <p className="font-bold text-slate-500">{t("purchases")}</p>
                  <p className="mt-1 text-lg font-black text-navy-950 dark:text-white">
                    {money(customer.purchases)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "sales" && (() => {
        if (DATA_SOURCE === "api" && invoicesQuery.isLoading) {
          return (
            <Card className="p-5">
              <div className="flex justify-center items-center py-12 text-xs text-slate-500">
                {locale === "ar" ? "جاري تحميل سجل المبيعات..." : "Loading sales history..."}
              </div>
            </Card>
          );
        }
        if (DATA_SOURCE === "api" && invoicesQuery.isError) {
          return (
            <Card className="p-5">
              <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-rose-500">
                <ShieldAlert className="h-8 w-8 mb-2 text-rose-500" />
                {locale === "ar" ? "فشل تحميل سجل الفواتير" : "Failed to load invoices history"}
              </div>
            </Card>
          );
        }
        if (displayInvoices.length === 0) {
          return (
            <Card className="p-5">
              <h3 className="font-black text-navy-950 dark:text-white">
                {locale === "ar" ? "سجل المبيعات والفواتير" : "Sales & Invoices History"}
              </h3>
              <p className="mt-5 text-center text-xs text-slate-400 py-10">
                {locale === "ar" ? "لا توجد مبيعات مسجلة لهذا العميل." : "No recorded sales for this customer."}
              </p>
            </Card>
          );
        }
        return (
          <Card className="p-5">
            <h3 className="font-black text-navy-950 dark:text-white">
              {locale === "ar" ? "سجل المبيعات والفواتير" : "Sales & Invoices History"}
            </h3>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead className="bg-slate-50 text-slate-500 dark:bg-navy-950">
                  <tr>
                    <th className="px-4 py-3 text-start">{locale === "ar" ? "رقم الفاتورة" : "Invoice No"}</th>
                    <th className="px-4 py-3 text-start">{locale === "ar" ? "التاريخ" : "Date"}</th>
                    <th className="px-4 py-3 text-start">{locale === "ar" ? "الفرع" : "Branch"}</th>
                    <th className="px-4 py-3 text-start">{locale === "ar" ? "طريقة الدفع" : "Payment Method"}</th>
                    <th className="px-4 py-3 text-start">{locale === "ar" ? "الإجمالي" : "Total"}</th>
                    <th className="px-4 py-3 text-start">{common("status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {displayInvoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-brand-600">{toEnglishDigits(inv.id)}</td>
                      <td className="px-4 py-3 text-slate-500">{toEnglishDigits(inv.date)}</td>
                      <td className="px-4 py-3 text-slate-500">{inv.branch}</td>
                      <td className="px-4 py-3 text-slate-500">{inv.paymentMethod}</td>
                      <td className="px-4 py-3 font-bold">{money(inv.total)}</td>
                      <td className="px-4 py-3">
                        <Badge
                          tone={
                            inv.status === "paid"
                              ? "green"
                              : inv.status === "partial"
                              ? "amber"
                              : "rose"
                          }
                        >
                          {inv.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })()}

      {activeTab === "statement" && (
        <Card className="p-5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4 dark:border-slate-800">
            <div>
              <h3 className="font-black text-navy-950 dark:text-white">
                {locale === "ar" ? "كشف حساب عميل (معاينة محلية)" : "Customer Statement (Local Preview)"}
              </h3>
              <p className="text-[10px] text-amber-600 font-bold mt-1">
                {locale === "ar"
                  ? "⚠️ تنبيه: هذه المعاينة تقريبية محاكاة محلياً، ولا تعبر عن السجلات المحاسبية القانونية للشركة."
                  : "⚠️ Warning: This is a simulated local preview, not an official legal ledger."}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={loadStatement} disabled={loadingStatement}>
              {locale === "ar" ? "تحديث المعاينة" : "Update Preview"}
            </Button>
          </div>

          {statement ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3 text-center">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-navy-950">
                  <p className="text-[10px] text-slate-400">{locale === "ar" ? "الرصيد الافتتاحي" : "Opening Balance"}</p>
                  <p className="mt-1 text-sm font-bold">{money(statement.openingBalance)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-navy-950">
                  <p className="text-[10px] text-slate-400">{locale === "ar" ? "ضريبة القيمة المضافة التقريبية" : "Estimated VAT"}</p>
                  <p className="mt-1 text-sm font-bold text-amber-600">{money(statement.vatDue)}</p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-4 dark:bg-navy-950">
                  <p className="text-[10px] text-rose-800">{locale === "ar" ? "الرصيد الختامي المستحق" : "Closing Outstanding Balance"}</p>
                  <p className="mt-1 text-lg font-black text-rose-700">{money(statement.closingBalance)}</p>
                </div>
              </div>

              {/* Transactions log */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs">{locale === "ar" ? "العمليات وحركة الرصيد" : "Transactions & Ledgers"}</h4>
                {statement.invoices && statement.invoices.length ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-start text-xs">
                      <thead className="bg-slate-50 text-slate-500 dark:bg-navy-950">
                        <tr>
                          <th className="px-4 py-2 text-start">{locale === "ar" ? "العملية" : "Activity"}</th>
                          <th className="px-4 py-2 text-start">{locale === "ar" ? "التاريخ" : "Date"}</th>
                          <th className="px-4 py-2 text-start">{locale === "ar" ? "مدين" : "Debit"}</th>
                          <th className="px-4 py-2 text-start">{locale === "ar" ? "دائن" : "Credit"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {statement.invoices.map((inv: any) => (
                          <tr key={inv.id}>
                            <td className="px-4 py-3">
                              <p className="font-bold">{toEnglishDigits(inv.id)}</p>
                              <p className="text-[9px] text-slate-400">{inv.branch} · {inv.paymentMethod}</p>
                            </td>
                            <td className="px-4 py-3 text-slate-500">{toEnglishDigits(inv.date)}</td>
                            <td className="px-4 py-3 text-rose-600 font-bold">{money(inv.total ?? inv.amount)}</td>
                            <td className="px-4 py-3 text-emerald-600 font-bold">
                              {inv.status === "paid" ? money(inv.total ?? inv.amount) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4">{locale === "ar" ? "لا توجد عمليات على الرصيد." : "No outstanding transactions."}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-xs text-slate-500 py-10">
              {locale === "ar" ? "اضغط على تحديث المعاينة لحساب العمليات." : "Click Update Preview to load statements."}
            </p>
          )}
        </Card>
      )}

      {activeTab === "kyc" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-5">
            <h3 className="font-black text-navy-950 dark:text-white">
              {locale === "ar" ? "تفاصيل الـ KYC والتحقق من الهوية" : "KYC & Identity Verification"}
            </h3>
            <div className="mt-5 space-y-4 text-xs">
              <div>
                <p className="text-slate-400">{locale === "ar" ? "حالة الـ KYC" : "KYC Verification Status"}</p>
                <div className="mt-2 flex gap-2">
                  {(["verified", "pending", "flagged", "not-started"] as KYCStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setKycForm((prev) => ({ ...prev, kycStatus: st }))}
                      className={`px-3 py-1.5 rounded-full border text-[10px] font-bold capitalize transition ${
                        kycForm.kycStatus === st
                          ? "bg-brand-600 border-brand-600 text-white dark:bg-brand-500"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-navy-950 dark:border-slate-800"
                      }`}
                    >
                      {st.replace("-", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                <p className="text-slate-400">{locale === "ar" ? "حالة الـ AML (مكافحة غسيل الأموال)" : "AML Check Status"}</p>
                <div className="mt-2 flex gap-2">
                  {(["clear", "review", "flagged"] as AMLStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setKycForm((prev) => ({ ...prev, amlStatus: st }))}
                      className={`px-3 py-1.5 rounded-full border text-[10px] font-bold capitalize transition ${
                        kycForm.amlStatus === st
                          ? st === "clear"
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : st === "review"
                            ? "bg-amber-600 border-amber-600 text-white"
                            : "bg-rose-600 border-rose-600 text-white"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-navy-950 dark:border-slate-800"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {customer.kycDetails?.lastCheckedAt && (
                <p className="text-[10px] text-slate-400">
                  {locale === "ar" ? `آخر فحص وتحديث: ${toEnglishDigits(customer.kycDetails.lastCheckedAt)}` : `Last checked: ${toEnglishDigits(customer.kycDetails.lastCheckedAt)}`}
                </p>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-black text-navy-950 dark:text-white">
              {locale === "ar" ? "معلومات الهوية والوثائق" : "Identity Documents"}
            </h3>
            <div className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400">{locale === "ar" ? "نوع الهوية" : "ID Type"}</p>
                  <select
                    className="input-base mt-1"
                    value={kycForm.identityType}
                    onChange={(e) => setKycForm((prev) => ({ ...prev, identityType: e.target.value }))}
                  >
                    <option value="">{locale === "ar" ? "اختر نوع الهوية" : "Select ID type"}</option>
                    <option value="national_id">{locale === "ar" ? "هوية وطنية" : "National ID"}</option>
                    <option value="passport">{locale === "ar" ? "جواز سفر" : "Passport"}</option>
                    <option value="driving_license">{locale === "ar" ? "رخصة قيادة" : "Driving License"}</option>
                    <option value="residency_id">{locale === "ar" ? "إقامة" : "Residency ID"}</option>
                    <option value="other">{locale === "ar" ? "أخرى" : "Other"}</option>
                  </select>
                </div>
                <div>
                  <p className="text-slate-400">{locale === "ar" ? "رقم الهوية" : "ID Number"}</p>
                  <input
                    className="input-base mt-1"
                    value={toEnglishDigits(kycForm.identityNumber)}
                    onChange={(e) => setKycForm((prev) => ({ ...prev, identityNumber: toEnglishDigits(e.target.value) }))}
                  />
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400">{locale === "ar" ? "تاريخ انتهاء الهوية" : "ID Expiry Date"}</p>
                  <input
                    type="date"
                    className="input-base mt-1"
                    value={kycForm.identityExpiryDate}
                    onChange={(e) => setKycForm((prev) => ({ ...prev, identityExpiryDate: toEnglishDigits(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
                <Button type="button" onClick={saveKyc} disabled={savingKyc}>
                  {savingKyc ? common("loading") : locale === "ar" ? "حفظ بيانات التحقق" : "Save KYC"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "attachments" && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-5 md:col-span-2">
            <h3 className="font-black text-navy-950 dark:text-white">
              {locale === "ar" ? "الملفات والمرفقات المسجلة" : "Attachments"}
            </h3>
            {DATA_SOURCE === "api" && attachmentsQuery.isLoading ? (
              <p className="mt-5 text-center text-xs text-slate-400 py-10">
                {locale === "ar" ? "جاري تحميل المرفقات..." : "Loading attachments..."}
              </p>
            ) : displayAttachments.length ? (
              <div className="mt-5 space-y-3">
                {displayAttachments.map((file) => {
                  const isApiAttachment = "fileUrl" in file;
                  const name = isApiAttachment ? file.originalFileName : file.name;
                  const size = isApiAttachment ? file.fileSize : file.size;
                  const uploadedAt = isApiAttachment ? file.uploadedAt : file.uploadedAt;
                  const fileUrl = isApiAttachment ? getPublicFileUrl(file.fileUrl) : file.localPreviewRef || "";
                  const mimeType = (isApiAttachment ? file.mimeType : file.type) || "";
                  const isImage = mimeType.startsWith("image/");
                  const isPdf = mimeType === "application/pdf";
                  const imageFailed = !!fileUrl && failedAttachmentUrls.has(fileUrl);
                  const canPreview = !!fileUrl && (isImage || isPdf);

                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 text-xs dark:border-slate-800"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {isImage && fileUrl && !imageFailed ? (
                          <a href={fileUrl} target="_blank" rel="noreferrer" className="shrink-0">
                            <img
                              src={fileUrl}
                              alt={name}
                              className="h-16 w-16 rounded-xl border border-slate-200 bg-white object-cover dark:border-slate-700"
                              onError={() => setFailedAttachmentUrls((current) => new Set(current).add(fileUrl))}
                            />
                          </a>
                        ) : (
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 font-black text-slate-500 dark:bg-navy-950">
                            {isPdf ? "PDF" : detectAttachmentLabel(file)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-navy-900 dark:text-white">{name}</p>
                          <p className="mt-1 text-[10px] text-slate-400">
                            {toEnglishDigits(formatFileSize(size))} · {toEnglishDigits(String(uploadedAt).slice(0, 16).replace("T", " "))}
                          </p>
                          {canPreview && fileUrl && (
                            <a href={fileUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-[10px] font-bold text-brand-600 hover:underline">
                              {locale === "ar" ? "معاينة" : "Preview"}
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {fileUrl && (
                          <a href={fileUrl} download className="rounded-xl px-3 py-2 text-[10px] font-bold text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10">
                            {locale === "ar" ? "تحميل" : "Download"}
                          </a>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:bg-rose-50"
                          disabled={deletingAttachmentId === file.id}
                          onClick={() => handleRemoveAttachment(file.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-5 text-center text-xs text-slate-400 py-10">
                {locale === "ar" ? "لا توجد مرفقات لهذا العميل." : "No attachments registered."}
              </p>
            )}
          </Card>

          <Card className="p-5 h-fit">
            <h3 className="font-black text-navy-950 dark:text-white">
              {locale === "ar" ? "رفع مرفق جديد" : "Upload Attachment"}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              {locale === "ar"
                ? "اختر ملفًا وسيتم اكتشاف نوعه تلقائيًا وحفظه في الخادم."
                : "Choose a file. Type is detected automatically and stored on the backend."}
            </p>
            <div className="mt-5 space-y-4 text-xs">
              <label className="block">
                <span className="label-base">{locale === "ar" ? "الملف" : "File"}</span>
                <input
                  type="file"
                  className="input-base mt-1"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.csv,.doc,.docx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </label>
              {selectedFile && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-navy-950">
                  <p className="font-bold text-navy-900 dark:text-white">{selectedFile.name}</p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {toEnglishDigits(formatFileSize(selectedFile.size))}
                  </p>
                  {selectedPreviewUrl && (
                    <img
                      src={selectedPreviewUrl}
                      alt={selectedFile.name}
                      className="mt-3 h-32 w-full rounded-xl border border-slate-200 bg-white object-contain dark:border-slate-700"
                    />
                  )}
                </div>
              )}
              <Button className="w-full mt-2" onClick={handleUploadAttachment} disabled={!selectedFile || uploadingAttachment}>
                <Upload className="h-4 w-4 mr-2" />
                {uploadingAttachment ? common("loading") : locale === "ar" ? "رفع الملف" : "Upload File"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
