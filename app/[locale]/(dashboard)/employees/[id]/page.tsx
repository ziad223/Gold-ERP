"use client";

import { use, useState, useEffect, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  FileText,
  History,
  ShieldAlert,
  Laptop,
  User,
  ArrowLeft,
  Calendar,
  Lock,
  CheckCircle,
  XCircle,
  Sliders,
  Power,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEmployee, useEmployeeMutations } from "@/hooks/use-employees";
import { useErp } from "@/contexts/erp-context";
import { Link } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { ROLE_PERMISSIONS, DarfusRole } from "@/lib/permissions/permissions";
import type { AuditLog, EmployeeApprovalLimits } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default function EmployeeProfilePage({ params }: PageProps) {
  const { id } = use(params);
  const t = useTranslations("Employees");
  const common = useTranslations("Common");
  const locale = useLocale();
  const rtl = locale === "ar";
  const { company } = useAuth();
  const { auditLogs } = useErp();

  const { employee, sessions, loading, error, revokeSession, refresh } = useEmployee(id);
  const { updateEmployee } = useEmployeeMutations();
  const [activeTab, setActiveTab] = useState("overview");

  // Approval Limits form state
  const [limits, setLimits] = useState<EmployeeApprovalLimits>({
    discountLimit: 0,
    priceOverrideLimit: 0,
    refundLimit: 0,
    journalLimit: 0,
    adjustmentLimit: 0,
    goldPurchaseLimit: 0,
  });

  // Load limits state when employee is fetched
  useEffect(() => {
    if (employee?.approvalLimitsDetail) {
      setLimits(employee.approvalLimitsDetail);
    } else if (employee) {
      setLimits({
        discountLimit: employee.approvalLimit || 5000,
        priceOverrideLimit: 10000,
        refundLimit: 2000,
        journalLimit: 50000,
        adjustmentLimit: 5,
        goldPurchaseLimit: 100000,
      });
    }
  }, [employee]);

  const currency = company?.currency ?? "AED";
  const money = (val: number) => formatCurrency(val, currency, locale);

  const isApi = process.env.NEXT_PUBLIC_DATA_SOURCE === "api";
  const { data: apiLogs } = useQuery<AuditLog[]>({
    queryKey: ["employee-audit-logs", id],
    queryFn: async () => {
      const res = await apiClient<{ items: AuditLog[] }>(
        `/audit-logs?filters=${encodeURIComponent(JSON.stringify({ userId: id }))}`,
        { locale }
      );
      return res.items || [];
    },
    enabled: isApi && !!id,
  });

  // Filter audit logs for this employee
  const employeeLogs = useMemo(() => {
    if (isApi) return apiLogs || [];
    return auditLogs.filter(
      (log) => log.userId === id || log.user === employee?.name
    );
  }, [isApi, apiLogs, auditLogs, id, employee?.name]);

  const handleUpdateLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    const res = await updateEmployee(employee.id, {
      approvalLimitsDetail: limits,
      approvalLimit: limits.discountLimit, // update deprecated top-level field for compat
    });

    if (res.success) {
      toast.success(rtl ? "تم تحديث حدود الصلاحيات بنجاح" : "Approval limits updated successfully");
      refresh();
    } else {
      toast.error(res.error?.message || "Failed to update limits");
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    const res = await revokeSession(sessionId);
    if (res.success) {
      toast.success(rtl ? "تم إلغاء الجلسة بنجاح" : "Session revoked successfully");
    } else {
      toast.error(res.error?.message || "Failed to revoke session");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">{common("loading")}</div>;
  }

  if (error || !employee) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldAlert className="h-12 w-12 text-rose-500" />
        <h2 className="mt-4 text-lg font-black text-navy-950 dark:text-white">
          {rtl ? "الموظف غير موجود" : "Employee Not Found"}
        </h2>
        <p className="mt-2 text-xs text-slate-500">
          {rtl
            ? "عذرًا، لم نتمكن من العثور على ملف هذا الموظف."
            : "Sorry, we couldn't find this employee profile."}
        </p>
        <Link href="/employees" className="mt-6">
          <Button variant="secondary">
            <ArrowLeft className="mr-2 h-4 w-4" /> {common("back")}
          </Button>
        </Link>
      </div>
    );
  }

  // Get permissions for current system role
  const sysRole = employee.systemRole || ("sales" as DarfusRole);
  const permissions = ROLE_PERMISSIONS[sysRole] || ROLE_PERMISSIONS.sales;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </Link>
        <div>
          <span className="text-xs text-slate-400">
            {rtl ? "ملف الموظف" : "Employee Profile"} · {employee.id}
          </span>
          <h1 className="text-xl font-black text-navy-950 dark:text-white">{employee.name}</h1>
        </div>
        <div className="ml-auto flex gap-2 rtl:mr-auto rtl:ml-0">
          <Badge tone={employee.status === "inactive" ? "rose" : "green"}>
            {employee.status === "inactive"
              ? (rtl ? "غير نشط" : "Inactive")
              : t(employee.status)}
          </Badge>
          <Badge tone="blue">{employee.role}</Badge>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {[
          { id: "overview", label: rtl ? "نظرة عامة" : "Overview", icon: User },
          { id: "permissions", label: rtl ? "الصلاحيات الأمنية" : "Security Permissions", icon: Lock },
          { id: "limits", label: rtl ? "حدود الاعتماد" : "Approval Limits", icon: Sliders },
          { id: "activity", label: rtl ? "سجل النشاط" : "Activity History", icon: History },
          { id: "sessions", label: rtl ? "الأجهزة والجلسات" : "Sessions & Devices", icon: Laptop },
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
            {rtl ? "بيانات الموظف والتوظيف" : "Employee & Work Details"}
          </h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 text-xs">
            <div>
              <p className="text-slate-400">{t("role")}</p>
              <p className="mt-1 font-bold text-navy-900 dark:text-slate-200">{employee.role} / {employee.jobTitle || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400">{t("branch")}</p>
              <p className="mt-1 font-bold text-navy-900 dark:text-slate-200">{employee.branch}</p>
            </div>
            <div>
              <p className="text-slate-400">{common("email")}</p>
              <p className="mt-1 font-bold text-navy-900 dark:text-slate-200">{employee.email || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400">{t("phone")}</p>
              <p className="mt-1 font-bold text-navy-900 dark:text-slate-200">{employee.phone || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400">{rtl ? "تاريخ الانضمام" : "Join Date"}</p>
              <p className="mt-1 font-bold text-navy-900 dark:text-slate-200">{employee.joinDate || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400">{rtl ? "الدور في النظام" : "System Security Role"}</p>
              <p className="mt-1 font-bold text-navy-900 dark:text-slate-200 capitalize">{employee.systemRole || "sales"}</p>
            </div>
            {employee.status === "inactive" && (
              <div className="sm:col-span-2 rounded-xl bg-rose-50 p-4 border border-rose-100 text-rose-800">
                <p className="font-bold">{rtl ? "سبب التعطيل:" : "Deactivation Reason:"}</p>
                <p className="mt-1">{employee.deactivateReason || "—"}</p>
              </div>
            )}
            <div className="sm:col-span-2">
              <p className="text-slate-400">{rtl ? "ملاحظات" : "Notes"}</p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">{employee.notes || "—"}</p>
            </div>
          </div>
        </Card>
      )}

      {activeTab === "permissions" && (
        <Card className="p-5">
          <div className="border-b border-slate-100 pb-4 mb-4 dark:border-slate-800">
            <h3 className="font-black text-navy-950 dark:text-white">
              {rtl ? `الصلاحيات الأمنية للدور: ${employee.systemRole || "sales"}` : `Security Permissions for: ${employee.systemRole || "sales"}`}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              {rtl
                ? "تتحدد هذه الصلاحيات تلقائياً بناءً على الدور الأمني الموكل للموظف في النظام."
                : "These permission sets are derived from the system security role."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            {Object.entries(permissions).map(([key, val]) => {
              const permTranslations: Record<string, { ar: string; en: string }> = {
                viewCosts: { ar: "عرض التكاليف", en: "View Costs" },
                viewMargins: { ar: "عرض هوامش الربح", en: "View Margins" },
                overrideGoldRate: { ar: "تجاوز سعر الذهب اليومي", en: "Override Gold Rate" },
                overrideManualPrice: { ar: "تجاوز تسعير القطع اليدوي", en: "Override Manual Price" },
                applyLargeDiscount: { ar: "تطبيق خصومات كبرى", en: "Apply Large Discount" },
                approveReverseCharge: { ar: "اعتماد الاحتساب العكسي للضريبة", en: "Approve Reverse Charge" },
                reopenAccountingPeriod: { ar: "إعادة فتح فترة محاسبية", en: "Reopen Accounting Period" },
                postJournalEntries: { ar: "ترحيل القيود المحاسبية", en: "Post Journal Entries" },
                manageSettings: { ar: "إدارة إعدادات النظام", en: "Manage Settings" },
                performInventoryAdjustments: { ar: "إجراء تسويات جرد المخزون", en: "Perform Inventory Adjustments" },
                viewAuditLogs: { ar: "عرض سجل التدقيق", en: "View Audit Logs" },
              };
              const permName = permTranslations[key] ? (rtl ? permTranslations[key].ar : permTranslations[key].en) : key.replace(/([A-Z])/g, " $1");
              
              return (
              <div
                key={key}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-4 dark:border-slate-800"
              >
                <span className="font-bold text-navy-950 dark:text-white capitalize">
                  {permName}
                </span>
                {val ? (
                  <span className="flex items-center gap-1 font-bold text-emerald-600">
                    <CheckCircle className="h-4 w-4" />
                    {rtl ? "مسموح" : "Allowed"}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-bold text-rose-600">
                    <XCircle className="h-4 w-4" />
                    {rtl ? "مرفوض" : "Denied"}
                  </span>
                )}
              </div>
              );
            })}
          </div>
        </Card>
      )}

      {activeTab === "limits" && (
        <Card className="p-5">
          <div className="border-b border-slate-100 pb-4 mb-4 dark:border-slate-800">
            <h3 className="font-black text-navy-950 dark:text-white">
              {rtl ? "تعديل حدود اعتمادات العمليات" : "Configure Transaction Approval Limits"}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              {rtl
                ? "حدد الحد المالي أو الكمي الأقصى للموظف قبل أن يتطلب الإجراء اعتماداً من المدير."
                : "Set maximum threshold limits for transactions before requiring manager approvals."}
            </p>
          </div>

          <form onSubmit={handleUpdateLimits} className="grid gap-5 sm:grid-cols-2 text-xs">
            <label className="block">
              <span className="label-base">
                {rtl ? "حد خصم المبيعات الفردي" : "Sales Discount Limit"}
              </span>
              <input
                type="number"
                className="input-base mt-1"
                value={limits.discountLimit}
                onChange={(e) => setLimits((prev) => ({ ...prev, discountLimit: Number(e.target.value) || 0 }))}
              />
            </label>
            <label className="block">
              <span className="label-base">
                {rtl ? "حد تعديل السعر اليدوي" : "Price Override Limit"}
              </span>
              <input
                type="number"
                className="input-base mt-1"
                value={limits.priceOverrideLimit}
                onChange={(e) => setLimits((prev) => ({ ...prev, priceOverrideLimit: Number(e.target.value) || 0 }))}
              />
            </label>
            <label className="block">
              <span className="label-base">
                {rtl ? "حد المرتجعات الفوري" : "Instant Refund Limit"}
              </span>
              <input
                type="number"
                className="input-base mt-1"
                value={limits.refundLimit}
                onChange={(e) => setLimits((prev) => ({ ...prev, refundLimit: Number(e.target.value) || 0 }))}
              />
            </label>
            <label className="block">
              <span className="label-base">
                {rtl ? "حد القيود اليومية الأقصى" : "Journal Entry Limit"}
              </span>
              <input
                type="number"
                className="input-base mt-1"
                value={limits.journalLimit}
                onChange={(e) => setLimits((prev) => ({ ...prev, journalLimit: Number(e.target.value) || 0 }))}
              />
            </label>
            <label className="block">
              <span className="label-base">
                {rtl ? "حد الفروق/تعديل المخزن المسموح" : "Max Inventory Adjustments Count"}
              </span>
              <input
                type="number"
                className="input-base mt-1"
                value={limits.adjustmentLimit}
                onChange={(e) => setLimits((prev) => ({ ...prev, adjustmentLimit: Number(e.target.value) || 0 }))}
              />
            </label>
            <label className="block">
              <span className="label-base">
                {rtl ? "حد شراء الذهب من العملاء" : "Gold Purchase Limit"}
              </span>
              <input
                type="number"
                className="input-base mt-1"
                value={limits.goldPurchaseLimit}
                onChange={(e) => setLimits((prev) => ({ ...prev, goldPurchaseLimit: Number(e.target.value) || 0 }))}
              />
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="submit">{rtl ? "تحديث حدود الصلاحيات" : "Update Limits"}</Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === "activity" && (
        <Card className="p-5">
          <h3 className="font-black text-navy-950 dark:text-white">
            {rtl ? "سجل العمليات والنشاط الأمني" : "Operational Activity Audit Logs"}
          </h3>
          {employeeLogs.length ? (
            <div className="mt-5 space-y-4 text-xs">
              {employeeLogs.map((log) => (
                <div
                  key={log.id}
                  className="border-l-2 border-brand-500 pl-4 py-1 space-y-1 dark:border-brand-400"
                >
                  <div className="flex justify-between">
                    <span className="font-bold text-navy-900 dark:text-white capitalize">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400">{log.date}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{log.description}</p>
                  <p className="text-[9px] text-slate-400">
                    {log.place} {log.device && `· Device: ${log.device}`}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-center text-xs text-slate-400 py-10">
              {rtl ? "لا توجد نشاطات مسجلة لهذا الموظف." : "No recorded audit activity logs."}
            </p>
          )}
        </Card>
      )}

      {activeTab === "sessions" && (
        <Card className="p-5">
          <div className="border-b border-slate-100 pb-4 mb-4 dark:border-slate-800">
            <h3 className="font-black text-navy-950 dark:text-white">
              {rtl ? "الأجهزة والجلسات النشطة (محاكاة محلية)" : "Devices & Active Sessions (Local Simulation)"}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              {rtl
                ? "⚠️ تنبيه: هذه الجلسات هي محاكاة محلية فقط، ولا تؤثر على الاتصال الفعلي بالخادم."
                : "⚠️ Note: Revoking simulated sessions performs a local cleanup, it does not revoke real server authentication."}
            </p>
          </div>

          {sessions && sessions.length ? (
            <div className="space-y-3">
              {sessions.map((ses) => (
                <div
                  key={ses.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 text-xs dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 font-black text-slate-500 dark:bg-navy-950">
                      PC
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-navy-900 dark:text-white">{ses.deviceName}</p>
                        {ses.isCurrent && (
                          <Badge tone="green">{rtl ? "الحالية" : "Current"}</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {ses.browser} · {ses.location} · {rtl ? `نشط: ${ses.lastActive}` : `Active: ${ses.lastActive}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50"
                    title={rtl ? "إلغاء الجلسة" : "Revoke Session"}
                    onClick={() => handleRevokeSession(ses.id)}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-slate-400 py-10">
              {rtl ? "لا توجد جلسات نشطة حالياً." : "No active sessions."}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
