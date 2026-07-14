"use client";

import { use, useState, useEffect, useMemo } from "react";
import { isApiDataSource } from "@/lib/data-source";
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
import { useEmployee, useEmployeeAuthorization, useEmployeeMutations } from "@/hooks/use-employees";
import { useErp } from "@/contexts/erp-context";
import { Link } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
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
  const { branchAccess, permissionState, verificationAttempts, resetCredential, updateBranches, updatePermissions } = useEmployeeAuthorization(id);
  const { updateEmployee } = useEmployeeMutations();
  const [activeTab, setActiveTab] = useState("overview");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [branchIds, setBranchIds] = useState("");
  const [roleIds, setRoleIds] = useState("");
  const [grantIds, setGrantIds] = useState("");
  const [denialIds, setDenialIds] = useState("");

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

  const isApi = isApiDataSource();
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
            {rtl ? "ملف الموظف" : "Employee Profile"} · {employee.id} · {employee.employeeCode || "NO-CODE"}
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
              <p className="text-slate-400">{rtl ? "كود الموظف" : "Employee Code"}</p>
              <p className="mt-1 font-mono font-bold text-navy-900 dark:text-slate-200">{employee.employeeCode || "—"}</p>
            </div>
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
        <div className="space-y-5">
          <Card className="p-5">
            <div className="border-b border-slate-100 pb-4 mb-4 dark:border-slate-800">
              <h3 className="font-black text-navy-950 dark:text-white">
                {rtl ? "مؤسسة تفويض الموظف" : "Employee Authorization Foundation"}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                {rtl
                  ? "هذه البيانات من واجهات التفويض الخلفية، وليست حسابات واجهة ثابتة."
                  : "These values come from backend Employee authorization APIs, not static frontend role maps."}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <form
                className="rounded-xl border border-slate-100 p-4 dark:border-slate-800"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!/^\d{6}$/.test(pin) || pin !== pinConfirm) {
                    toast.error(rtl ? "أدخل رمز PIN من 6 أرقام وتأكيد مطابق" : "Enter a matching 6-digit PIN");
                    return;
                  }
                  const result = await resetCredential(pin, false);
                  setPin("");
                  setPinConfirm("");
                  if (result.success) toast.success(rtl ? "تم تحديث PIN" : "PIN updated");
                  else toast.error(result.error?.message || "PIN update failed");
                }}
              >
                <h4 className="font-black">{rtl ? "إعداد PIN" : "PIN Management"}</h4>
                <input className="input-base mt-3" inputMode="numeric" type="password" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" />
                <input className="input-base mt-2" inputMode="numeric" type="password" maxLength={6} value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder={rtl ? "تأكيد PIN" : "Confirm PIN"} />
                <Button className="mt-3" type="submit">{rtl ? "حفظ PIN" : "Save PIN"}</Button>
              </form>
              <form
                className="rounded-xl border border-slate-100 p-4 dark:border-slate-800"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const result = await updateBranches(branchIds.split(",").map((x) => x.trim()).filter(Boolean));
                  if (result.success) toast.success(rtl ? "تم تحديث الفروع" : "Branch access updated");
                  else toast.error(result.error?.message || "Branch update failed");
                }}
              >
                <h4 className="font-black">{rtl ? "فروع الموظف" : "Employee Branch Access"}</h4>
                <p className="mt-2 text-[10px] text-slate-400">{branchAccess.map((b: any) => b.branch?.name || b.branchId).join(", ") || "—"}</p>
                <input className="input-base mt-3" value={branchIds} onChange={(e) => setBranchIds(e.target.value)} placeholder={rtl ? "BR-1, BR-2" : "BR-1, BR-2"} />
                <Button className="mt-3" type="submit">{rtl ? "حفظ الفروع" : "Save Branches"}</Button>
              </form>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-black text-navy-950 dark:text-white">{rtl ? "الأدوار والمنح والمنع" : "Roles, Grants and Denials"}</h3>
            <form
              className="mt-4 grid gap-3 text-xs"
              onSubmit={async (event) => {
                event.preventDefault();
                const result = await updatePermissions({
                  roleIds: roleIds.split(",").map((x) => x.trim()).filter(Boolean),
                  grantPermissionIds: grantIds.split(",").map((x) => x.trim()).filter(Boolean),
                  denialPermissionIds: denialIds.split(",").map((x) => x.trim()).filter(Boolean),
                });
                if (result.success) toast.success(rtl ? "تم تحديث الصلاحيات" : "Permissions updated");
                else toast.error(result.error?.message || "Permission update failed");
              }}
            >
              <input className="input-base" value={roleIds} onChange={(e) => setRoleIds(e.target.value)} placeholder={rtl ? "معرّفات الأدوار مفصولة بفواصل" : "Role IDs, comma-separated"} />
              <input className="input-base" value={grantIds} onChange={(e) => setGrantIds(e.target.value)} placeholder={rtl ? "معرّفات الصلاحيات الممنوحة" : "Grant permission IDs"} />
              <input className="input-base" value={denialIds} onChange={(e) => setDenialIds(e.target.value)} placeholder={rtl ? "معرّفات الصلاحيات الممنوعة — المنع له الأولوية" : "Denial permission IDs — denial wins"} />
              <Button type="submit">{rtl ? "حفظ التفويض" : "Save Authorization"}</Button>
            </form>
            <div className="mt-5 grid gap-3 sm:grid-cols-3 text-[10px]">
              <div><p className="font-black">{rtl ? "صلاحيات الأدوار" : "Role permissions"}</p><p className="mt-2 text-slate-500 break-words">{permissionState?.authorization?.rolePermissionNames?.join(", ") || "—"}</p></div>
              <div><p className="font-black text-emerald-600">{rtl ? "منح مباشرة" : "Direct grants"}</p><p className="mt-2 text-slate-500 break-words">{permissionState?.authorization?.directGrantNames?.join(", ") || "—"}</p></div>
              <div><p className="font-black text-rose-600">{rtl ? "منع مباشر" : "Direct denials"}</p><p className="mt-2 text-slate-500 break-words">{permissionState?.authorization?.directDenialNames?.join(", ") || "—"}</p></div>
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-[10px] dark:bg-navy-950">
              <p className="font-black">{rtl ? "الصلاحيات الفعّالة من الخادم" : "Backend effective permissions"}</p>
              <p className="mt-2 text-slate-500 break-words">{permissionState?.authorization?.effectivePermissionNames?.join(", ") || "—"}</p>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-black text-navy-950 dark:text-white">{rtl ? "محاولات التحقق" : "Verification Attempts"}</h3>
            <div className="mt-4 space-y-2 text-xs">
              {verificationAttempts.length ? verificationAttempts.map((attempt: any) => (
                <div key={attempt.id} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                  <div className="flex justify-between gap-3"><span className={attempt.result === "success" ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>{attempt.result}</span><span className="text-[10px] text-slate-400">{attempt.createdAt}</span></div>
                  <p className="mt-1 text-[10px] text-slate-500">{attempt.requestedPermission || attempt.requestedOperation || "—"} · L{attempt.requestedLevel} · {attempt.failureCode || "OK"}</p>
                </div>
              )) : <p className="text-slate-400">{rtl ? "لا توجد محاولات بعد." : "No attempts yet."}</p>}
            </div>
          </Card>
        </div>
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
