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
import { apiClient, generateUUID } from "@/lib/api/client";
import { normalizeEntity, normalizeItems } from "@/lib/api/normalize";
import { queryKeys } from "@/lib/query-keys";
import { invalidateAffectedQueries } from "@/lib/realtime/invalidate-affected-queries";
import { DATA_SOURCE } from "@/lib/data-source";
import { toEnglishDigits } from "@/lib/formatters/numbers";
import { getPublicFileUrl } from "@/lib/files";
import { useErp } from "@/contexts/erp-context";
import type { CustomerStatement } from "@/lib/repositories/interfaces";

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

  const { customer, loading, error, refresh } = useCustomer(id);
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
          { id: "statement", label: locale === "ar" ? "كشف الحساب" : "Customer Statement", icon: FileText },
          { id: "kyc", label: locale === "ar" ? "التحقق والـ KYC" : "KYC & AML Check", icon: ShieldAlert },
          { id: "attachments", label: locale === "ar" ? "المرفقات والملفات" : "Attachments & Metadata", icon: Paperclip },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
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
                      <td className="px-4 py-3 font-bold text-brand-600">{toEnglishDigits(inv.invoiceNumber || inv.id)}</td>
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
        <CustomerStatementPanel customerId={id} money={money} />
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

// ── Customer sub-ledger statement (Phase 10C) — read-only view over GET
// /customers/:id/statement-v2. Every figure (opening / running / closing /
// difference) comes straight from the server; nothing is computed here, and
// there is no fix/reconcile/write action.
const STATEMENT_PAGE_SIZES = [20, 50, 100] as const;

type CustomerDepositForm = {
  amount: string;
  paymentMethod: "cash" | "bank";
  date: string;
  description: string;
  reference: string;
};

const getTodayYmd = () => new Date().toISOString().slice(0, 10);

const getCustomerDepositSignature = (form: CustomerDepositForm, customerId: string) =>
  JSON.stringify({
    customerId,
    amount: form.amount.trim(),
    paymentMethod: form.paymentMethod,
    accountCode: form.paymentMethod === "bank" ? "1120" : "1110",
    date: form.date,
    description: form.description.trim(),
    reference: form.reference.trim(),
  });

function CustomerStatementPanel({ customerId, money }: { customerId: string; money: (value: number) => string }) {
  const locale = useLocale();
  const rtl = locale === "ar";
  const { accountingRepository } = useErp();
  const queryClient = useQueryClient();
  const isApi = DATA_SOURCE === "api";

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositForm, setDepositForm] = useState<CustomerDepositForm>({
    amount: "",
    paymentMethod: "cash",
    date: getTodayYmd(),
    description: "",
    reference: "",
  });
  const [depositIdempotency, setDepositIdempotency] = useState<{ key: string; signature: string } | null>(null);
  const [depositSubmitting, setDepositSubmitting] = useState(false);

  const dateError = from && to && from > to;

  const { data, isLoading, error } = useQuery<CustomerStatement>({
    queryKey: ["customer-statement-v2", customerId, from, to, page, pageSize],
    queryFn: () =>
      accountingRepository.getCustomerStatementV2(customerId, {
        from: from || undefined,
        to: to || undefined,
        page,
        pageSize,
      }),
    enabled: isApi && !!customerId && !dateError,
  });

  const creditQuery = useQuery<{ data: { availableCredit: number; currency: string } }>({
    queryKey: ["customer-credit", customerId],
    queryFn: () => apiClient(`/customers/${encodeURIComponent(customerId)}/credit`, { locale }),
    enabled: isApi && !!customerId,
  });
  const availableCredit = creditQuery.data?.data?.availableCredit ?? 0;

  const updateDepositForm = (patch: Partial<CustomerDepositForm>) => {
    setDepositForm((current) => ({ ...current, ...patch }));
    setDepositIdempotency(null);
  };

  const openDepositModal = () => {
    setDepositForm({
      amount: "",
      paymentMethod: "cash",
      date: getTodayYmd(),
      description: rtl ? "إيداع رصيد دائن للعميل" : "Customer credit deposit",
      reference: "",
    });
    setDepositIdempotency(null);
    setDepositOpen(true);
  };

  const submitDeposit = async () => {
    const amount = Number(depositForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(rtl ? "مبلغ الإيداع يجب أن يكون أكبر من صفر" : "Deposit amount must be greater than zero");
      return;
    }
    const signature = getCustomerDepositSignature(depositForm, customerId);
    const idem = depositIdempotency?.signature === signature
      ? depositIdempotency
      : { key: generateUUID(), signature };
    setDepositIdempotency(idem);
    setDepositSubmitting(true);
    try {
      await apiClient(`/customers/${encodeURIComponent(customerId)}/credit/deposit`, {
        method: "POST",
        locale,
        idempotencyKey: idem.key,
        body: JSON.stringify({
          amount,
          paymentMethod: depositForm.paymentMethod,
          accountCode: depositForm.paymentMethod === "bank" ? "1120" : "1110",
          date: depositForm.date,
          description: depositForm.description.trim() || (rtl ? "إيداع رصيد دائن للعميل" : "Customer credit deposit"),
          reference: depositForm.reference.trim() || undefined,
        }),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["customer-credit", customerId] }),
        queryClient.invalidateQueries({ queryKey: ["customer-statement-v2", customerId] }),
      ]);
      setDepositOpen(false);
      setDepositIdempotency(null);
      toast.success(rtl ? "تم تسجيل إيداع العميل" : "Customer deposit recorded");
    } catch (err: any) {
      toast.error(err?.message || (rtl ? "فشل تسجيل الإيداع" : "Failed to record deposit"));
    } finally {
      setDepositSubmitting(false);
    }
  };

  if (!isApi) {
    return (
      <Card className="p-8 text-center text-sm font-bold text-slate-500">
        {rtl ? "كشف حساب العميل متاح في وضع API فقط." : "Customer statement is available in API mode only."}
      </Card>
    );
  }

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = total === 0 ? 0 : Math.min(total, first + (data?.items.length ?? 0) - 1);

  const onFrom = (v: string) => { setFrom(v); setPage(1); };
  const onTo = (v: string) => { setTo(v); setPage(1); };
  const onPageSize = (v: string) => { setPageSize(Number(v)); setPage(1); };

  const typeLabel = (type: string) => {
    if (type === "invoice") return rtl ? "فاتورة" : "Invoice";
    if (type === "payment") return rtl ? "دفعة" : "Payment";
    if (type === "return") return rtl ? "مرتجع" : "Return";
    return type;
  };

  return (
    <div className="space-y-5">
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] text-slate-400">{rtl ? "الرصيد الدائن المتاح" : "Available Credit"}</p>
          <p className="mt-1 text-lg font-black text-emerald-600 dark:text-emerald-400">{money(availableCredit)}</p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <p className="max-w-xs text-start text-[10px] text-slate-400 sm:text-end">
            {rtl
              ? "رصيد دائن للعميل. لا يخصم من الفواتير إلا عند تطبيق الرصيد في مرحلة لاحقة."
              : "Customer store credit. It does not reduce invoices until credit application is added later."}
          </p>
          <Button type="button" size="sm" onClick={openDepositModal}>
            <DollarSign className="h-4 w-4" />
            {rtl ? "إضافة إيداع" : "Add Deposit"}
          </Button>
        </div>
      </Card>

      {depositOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl dark:bg-navy-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-navy-950 dark:text-white">
                  {rtl ? "إيداع رصيد دائن للعميل" : "Customer Credit Deposit"}
                </h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  {rtl
                    ? "هذا التزام على الشركة وليس دفعة على فاتورة. لن يغيّر رصيد العميل المستحق أو الفواتير."
                    : "This is a company liability, not an invoice payment. It will not change AR balance or invoices."}
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setDepositOpen(false)} disabled={depositSubmitting}>
                {rtl ? "إغلاق" : "Close"}
              </Button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                <span className="mb-1 block">{rtl ? "المبلغ" : "Amount"}</span>
                <input
                  className="input-base w-full"
                  inputMode="decimal"
                  value={depositForm.amount}
                  onChange={(e) => updateDepositForm({ amount: toEnglishDigits(e.target.value) })}
                  placeholder="0.00"
                />
              </label>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                <span className="mb-1 block">{rtl ? "طريقة الدفع" : "Payment Method"}</span>
                <select
                  className="input-base w-full"
                  value={depositForm.paymentMethod}
                  onChange={(e) => updateDepositForm({ paymentMethod: e.target.value as "cash" | "bank" })}
                >
                  <option value="cash">{rtl ? "نقدي — 1110" : "Cash — 1110"}</option>
                  <option value="bank">{rtl ? "بنك — 1120" : "Bank — 1120"}</option>
                </select>
              </label>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                <span className="mb-1 block">{rtl ? "التاريخ" : "Date"}</span>
                <input
                  type="date"
                  className="input-base w-full"
                  value={depositForm.date}
                  onChange={(e) => updateDepositForm({ date: e.target.value })}
                />
              </label>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                <span className="mb-1 block">{rtl ? "مرجع" : "Reference"}</span>
                <input
                  className="input-base w-full"
                  maxLength={120}
                  value={depositForm.reference}
                  onChange={(e) => updateDepositForm({ reference: e.target.value })}
                />
              </label>
              <label className="sm:col-span-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <span className="mb-1 block">{rtl ? "الوصف" : "Description"}</span>
                <textarea
                  className="input-base min-h-24 w-full resize-y"
                  maxLength={255}
                  value={depositForm.description}
                  onChange={(e) => updateDepositForm({ description: e.target.value })}
                />
              </label>
            </div>

            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] font-bold text-amber-700 dark:border-amber-900/50 dark:bg-amber-500/10 dark:text-amber-300">
              {rtl
                ? "تنبيه: هذا الإيداع يزيد الرصيد الدائن فقط، ولا يسدد أي فاتورة حتى يتم تنفيذ تطبيق الرصيد لاحقاً."
                : "Warning: this increases available credit only. It does not settle any invoice until credit application is implemented later."}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setDepositOpen(false)} disabled={depositSubmitting}>
                {rtl ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="button" onClick={submitDeposit} disabled={depositSubmitting}>
                {depositSubmitting ? (rtl ? "جارٍ الحفظ..." : "Saving...") : (rtl ? "حفظ الإيداع" : "Save Deposit")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="p-5">
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="mb-1 block">{rtl ? "من تاريخ" : "From"}</span>
            <input type="date" className="input-base" value={from} onChange={(e) => onFrom(e.target.value)} />
          </label>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="mb-1 block">{rtl ? "إلى تاريخ" : "To"}</span>
            <input type="date" className="input-base" value={to} onChange={(e) => onTo(e.target.value)} />
          </label>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="mb-1 block">{rtl ? "عدد الصفوف" : "Rows per page"}</span>
            <select className="input-base" value={pageSize} onChange={(e) => onPageSize(e.target.value)}>
              {STATEMENT_PAGE_SIZES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
        {dateError && (
          <p className="mt-3 text-xs font-bold text-rose-600">{rtl ? "تاريخ البداية يجب ألا يتجاوز تاريخ النهاية." : "'From' must not be after 'To'."}</p>
        )}
      </Card>

      {error ? (
        <Card className="p-8 text-center text-sm font-bold text-rose-600">
          {(error as any)?.message || (rtl ? "تعذّر تحميل كشف الحساب" : "Failed to load the statement")}
        </Card>
      ) : isLoading && !data ? (
        <Card className="p-10 text-center text-sm text-slate-500">{rtl ? "جارٍ التحميل..." : "Loading..."}</Card>
      ) : data ? (
        <>
          {/* Summary — server values only */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-navy-950">
              <p className="text-[10px] text-slate-400">{rtl ? "الرصيد الافتتاحي" : "Opening Balance"}</p>
              <p className="mt-1 text-lg font-black">{money(data.openingBalance)}</p>
              <p className="mt-1 text-[10px] text-slate-400">{(data.from || "—")} → {(data.to || "—")}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-navy-950">
              <p className="text-[10px] text-slate-400">{rtl ? "الرصيد الختامي (محسوب)" : "Closing Balance (computed)"}</p>
              <p className="mt-1 text-lg font-black text-brand-700 dark:text-brand-300">{money(data.closingBalance)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-navy-950">
              <p className="text-[10px] text-slate-400">{rtl ? "رصيد العميل (مرجعي)" : "Customer Balance (reference)"}</p>
              <p className="mt-1 text-lg font-black text-slate-600 dark:text-slate-300">{money(data.customerBalanceReference)}</p>
              <p className="mt-1 text-[10px] text-slate-400">{rtl ? "للمقارنة فقط — ليس الرصيد الختامي" : "Reference only — not the closing balance"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-navy-950">
              <p className="text-[10px] text-slate-400">{rtl ? "الفرق" : "Difference"}</p>
              <p className={`mt-1 text-lg font-black ${data.difference !== 0 ? "text-amber-600" : ""}`}>{money(data.difference)}</p>
              <p className="mt-1 text-[10px] text-slate-400">{rtl ? `${data.total} حركة` : `${data.total} rows`}</p>
            </div>
          </div>

          {data.difference !== 0 && (
            <Card className="border-amber-300 bg-amber-50 p-4 text-xs font-bold text-amber-700 dark:border-amber-900/50 dark:bg-amber-500/10 dark:text-amber-300">
              {rtl
                ? "يوجد فرق بين رصيد العميل المرجعي والرصيد المحسوب من المستندات. هذه شاشة عرض فقط — لا يوجد إجراء تصحيح."
                : "There is a difference between the reference customer balance and the document-computed balance. This is a read-only view — no fix action."}
            </Card>
          )}

          {/* Transactions table — server rows only */}
          <Card className="overflow-hidden">
            {data.items.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-start text-xs">
                  <thead className="bg-slate-50 text-slate-500 dark:bg-navy-950">
                    <tr>
                      <th className="px-4 py-3 text-start">{rtl ? "التاريخ" : "Date"}</th>
                      <th className="px-4 py-3 text-start">{rtl ? "النوع" : "Type"}</th>
                      <th className="px-4 py-3 text-start">{rtl ? "المرجع" : "Reference"}</th>
                      <th className="px-4 py-3 text-start">{rtl ? "الوصف" : "Description"}</th>
                      <th className="px-4 py-3 text-end">{rtl ? "مدين" : "Debit"}</th>
                      <th className="px-4 py-3 text-end">{rtl ? "دائن" : "Credit"}</th>
                      <th className="px-4 py-3 text-end">{rtl ? "الحركة" : "Delta"}</th>
                      <th className="px-4 py-3 text-end">{rtl ? "الرصيد الجاري" : "Running Balance"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.items.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-navy-950/40">
                        <td className="px-4 py-3 text-slate-500">{toEnglishDigits((row.date || "").slice(0, 10))}</td>
                        <td className="px-4 py-3"><Badge tone={row.type === "payment" ? "green" : row.type === "return" ? "amber" : "blue"}>{typeLabel(row.type)}</Badge></td>
                        <td className="px-4 py-3 font-mono font-bold text-brand-700 dark:text-brand-300">{toEnglishDigits(row.sourceNumber)}</td>
                        <td className="px-4 py-3">{row.description || "—"}</td>
                        <td className="px-4 py-3 text-end font-bold text-rose-600">{row.debit ? money(row.debit) : "—"}</td>
                        <td className="px-4 py-3 text-end font-bold text-emerald-600">{row.credit ? money(row.credit) : "—"}</td>
                        <td className="px-4 py-3 text-end">{money(row.delta)}</td>
                        <td className="px-4 py-3 text-end font-black">{money(row.runningBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-10 text-center text-xs text-slate-500">{rtl ? "لا توجد حركات ضمن المعايير المحددة." : "No transactions for the selected criteria."}</p>
            )}
            {total > 0 && (
              <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-xs dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-slate-500">
                  {rtl ? `عرض ${first}-${last} من ${total}` : `Showing ${first}-${last} of ${total}`}
                </p>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="secondary" size="sm" disabled={isLoading || page <= 1} onClick={() => setPage(Math.max(page - 1, 1))}>
                    {rtl ? "السابق" : "Previous"}
                  </Button>
                  <span className="min-w-20 text-center font-bold text-slate-500">
                    {rtl ? `صفحة ${page} / ${totalPages}` : `Page ${page} / ${totalPages}`}
                  </span>
                  <Button type="button" variant="secondary" size="sm" disabled={isLoading || page >= totalPages} onClick={() => setPage(Math.min(page + 1, totalPages))}>
                    {rtl ? "التالي" : "Next"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}
