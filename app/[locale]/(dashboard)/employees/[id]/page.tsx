"use client";

import { FormEvent, use, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Calendar,
  CheckCircle,
  History,
  KeyRound,
  Laptop,
  ListChecks,
  Lock,
  MapPin,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  User,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEmployee, useEmployeeAuthorization, useEmployeeMutations } from "@/hooks/use-employees";
import { useAuth } from "@/contexts/auth-context";
import { useErp } from "@/contexts/erp-context";
import { Link } from "@/i18n/navigation";
import { apiClient } from "@/lib/api/client";
import { isApiDataSource } from "@/lib/data-source";
import { permissionLabel, permissionMeta, permissionModuleLabel, permissionSourceLabel } from "@/lib/permissions/catalog";
import { formatCurrency } from "@/lib/utils";
import type {
  AuditLog,
  Employee,
  EmployeeApprovalLimits,
  EmployeeBranchAccess,
  EmployeeOperationalSessionHistory,
  EmployeePermissionState,
  EmployeeVerificationAttempt,
} from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

type TabId =
  | "overview"
  | "operational"
  | "branches"
  | "roles"
  | "direct-permissions"
  | "effective-permissions"
  | "credential"
  | "attempts"
  | "operator-sessions"
  | "audit"
  | "hr";

type BranchOption = { id: string; name?: string | null; code?: string | null };
type PermissionOption = { id: string; name: string; module?: string; action?: string };
type PermissionSourceView = {
  source: "ROLE" | "DIRECT_GRANT" | "ROLE_AND_DIRECT_GRANT" | "DENIED" | "NOT_GRANTED" | string;
  effective: boolean;
  denied: boolean;
  role: boolean;
  directGrant: boolean;
  directDenial: boolean;
};

const TAB_IDS: Array<{ id: TabId; icon: any; en: string; ar: string }> = [
  { id: "overview", icon: User, en: "Overview", ar: "نظرة عامة" },
  { id: "operational", icon: ShieldCheck, en: "Operational Access", ar: "الوصول التشغيلي" },
  { id: "branches", icon: MapPin, en: "Branch Access", ar: "فروع التفويض" },
  { id: "roles", icon: UsersRound, en: "Role Templates", ar: "قوالب الأدوار" },
  { id: "direct-permissions", icon: ListChecks, en: "Direct Permissions", ar: "الصلاحيات المباشرة" },
  { id: "effective-permissions", icon: ShieldCheck, en: "Effective Permissions", ar: "الصلاحيات الفعالة" },
  { id: "credential", icon: KeyRound, en: "Credential & PIN", ar: "الاعتماد والرقم السري الوظيفي" },
  { id: "attempts", icon: History, en: "Verification Attempts", ar: "محاولات التحقق" },
  { id: "operator-sessions", icon: Laptop, en: "Operational Sessions", ar: "جلسات المشغل" },
  { id: "audit", icon: Activity, en: "Audit / Activity", ar: "التدقيق والنشاط" },
  { id: "hr", icon: Sliders, en: "HR / Payroll / Attendance", ar: "الموارد والرواتب والحضور" },
];

function hasPermission(user: ReturnType<typeof useAuth>["user"], permission: string) {
  if ((user?.accountType || "legacy") === "branch_shell") return user?.permissions?.includes(permission) ?? false;
  return Boolean(user?.role === "admin" || user?.roles?.some((role) => role.isAdmin) || user?.permissions?.includes(permission));
}

function normalizeItems<T>(response: any): T[] {
  const data = response?.data ?? response;
  return data?.items ?? response?.items ?? [];
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function groupPermissionName(name: string) {
  return name.includes(".") ? name.split(".")[0] : "general";
}

function toPermissionOptions(permissionState: EmployeePermissionState | null): PermissionOption[] {
  const byName = new Map<string, PermissionOption>();
  for (const permission of [
    ...(permissionState?.assignableCatalog ?? []),
    ...(permissionState?.rolePermissions ?? []),
    ...(permissionState?.effectivePermissions ?? []),
    ...(permissionState?.grants ?? []),
    ...(permissionState?.denials ?? []),
  ]) {
    byName.set(permission.name, permission);
  }
  for (const name of [
    ...(permissionState?.authorization?.rolePermissionNames ?? []),
    ...(permissionState?.authorization?.effectivePermissionNames ?? []),
    ...(permissionState?.authorization?.directGrantNames ?? []),
    ...(permissionState?.authorization?.directDenialNames ?? []),
  ]) {
    if (!byName.has(name)) byName.set(name, { id: name, name, module: groupPermissionName(name), action: name.split(".").slice(1).join(".") });
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function permissionSourceMap(permissionState: EmployeePermissionState | null) {
  const rows = new Map<string, PermissionSourceView>();
  for (const row of permissionState?.effectiveSources ?? []) {
    rows.set(row.name, {
      source: row.source,
      effective: row.effective,
      denied: row.denied,
      role: row.role,
      directGrant: row.directGrant,
      directDenial: row.directDenial,
    });
  }
  for (const name of permissionState?.authorization?.rolePermissionNames ?? []) {
    const existing = rows.get(name);
    rows.set(name, { source: existing?.source || "ROLE", effective: existing?.effective ?? true, denied: existing?.denied ?? false, role: true, directGrant: existing?.directGrant ?? false, directDenial: existing?.directDenial ?? false });
  }
  for (const name of permissionState?.authorization?.directGrantNames ?? []) {
    const existing = rows.get(name);
    rows.set(name, { source: existing?.source === "ROLE" ? "ROLE_AND_DIRECT_GRANT" : existing?.source || "DIRECT_GRANT", effective: existing?.effective ?? true, denied: existing?.denied ?? false, role: existing?.role ?? false, directGrant: true, directDenial: existing?.directDenial ?? false });
  }
  for (const name of permissionState?.authorization?.directDenialNames ?? []) {
    const existing = rows.get(name);
    rows.set(name, { source: "DENIED", effective: false, denied: true, role: existing?.role ?? false, directGrant: existing?.directGrant ?? false, directDenial: true });
  }
  return rows;
}

function sourceBadgeLabel(source: string, rtl: boolean) {
  const labels: Record<string, { ar: string; en: string }> = {
    ROLE: { ar: "من دور", en: "Role" },
    DIRECT_GRANT: { ar: "سماح مباشر", en: "Direct grant" },
    ROLE_AND_DIRECT_GRANT: { ar: "دور وسماح مباشر", en: "Role + direct grant" },
    DENIED: { ar: "منع مباشر", en: "Denied" },
    NOT_GRANTED: { ar: "غير ممنوحة", en: "Not granted" },
  };
  return (labels[source] || labels.NOT_GRANTED)[rtl ? "ar" : "en"];
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-bold text-foreground">
      {children}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label="Remove" className="rounded-full text-muted-foreground hover:text-rose-600">
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="input-base ps-10" />
    </label>
  );
}

export default function EmployeeProfilePage({ params }: PageProps) {
  const { id } = use(params);
  const common = useTranslations("Common");
  const locale = useLocale();
  const rtl = locale === "ar";
  const { company, user } = useAuth();
  const { auditLogs } = useErp();
  const isApi = isApiDataSource();

  const { employee, operatorSessions, loading, error, refresh } = useEmployee(id);
  const {
    branchAccess,
    permissionState,
    verificationAttempts,
    codeHistory,
    loading: authorizationLoading,
    resetCredential,
    revokeOperatorSessions,
    changeEmployeeCode,
    changeOwnPin,
    updateBranches,
    updatePermissions,
    refreshAuthorization,
  } = useEmployeeAuthorization(id);
  const { updateEmployee } = useEmployeeMutations();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [grantPermissionIds, setGrantPermissionIds] = useState<string[]>([]);
  const [denialPermissionIds, setDenialPermissionIds] = useState<string[]>([]);
  const [permissionReason, setPermissionReason] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [selfNewPin, setSelfNewPin] = useState("");
  const [selfPinConfirm, setSelfPinConfirm] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [employeeCodeReason, setEmployeeCodeReason] = useState("");
  const [limits, setLimits] = useState<EmployeeApprovalLimits>({
    discountLimit: 0,
    priceOverrideLimit: 0,
    refundLimit: 0,
    journalLimit: 0,
    adjustmentLimit: 0,
    goldPurchaseLimit: 0,
  });

  const canManageCredentials = hasPermission(user, "employees.credentials.manage");
  const canManageBranches = hasPermission(user, "employees.branches.manage");
  const canManagePermissions = hasPermission(user, "employees.permissions.manage");

  const { data: branchOptions = [] } = useQuery<BranchOption[]>({
    queryKey: ["employee-branch-selector-options"],
    queryFn: async () => normalizeItems<BranchOption>(await apiClient("/branches?page=1&pageSize=100")),
    enabled: isApi && canManageBranches,
  });

  const { data: apiLogs = [] } = useQuery<AuditLog[]>({
    queryKey: ["employee-audit-logs", id],
    queryFn: async () => {
      const res = await apiClient<{ items?: AuditLog[]; data?: { items?: AuditLog[] } }>(
        `/audit-logs?filters=${encodeURIComponent(JSON.stringify({ employeeId: id }))}`,
        { locale },
      );
      return res.data?.items || res.items || [];
    },
    enabled: isApi && !!id,
  });

  useEffect(() => {
    setSelectedBranchIds(branchAccess.map((row) => row.branchId));
  }, [branchAccess]);

  useEffect(() => {
    setSelectedRoleIds(permissionState?.roles?.map((role: { id: string }) => role.id) ?? []);
    setGrantPermissionIds(permissionState?.grants?.map((permission: { id: string }) => permission.id) ?? []);
    setDenialPermissionIds(permissionState?.denials?.map((permission: { id: string }) => permission.id) ?? []);
  }, [permissionState]);

  useEffect(() => {
    if (employee?.approvalLimitsDetail) setLimits(employee.approvalLimitsDetail);
    else if (employee) {
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

  const employeeLogs = useMemo(() => {
    if (isApi) return apiLogs;
    return auditLogs.filter((log) => log.userId === id || log.user === employee?.name);
  }, [apiLogs, auditLogs, employee?.name, id, isApi]);

  const currency = company?.currency ?? "AED";
  const money = (val: number) => formatCurrency(val, currency, locale);

  const clearCredentialForm = () => {
    setPin("");
    setPinConfirm("");
    setCurrentPin("");
    setSelfNewPin("");
    setSelfPinConfirm("");
  };

  const saveCredential = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (!/^\d{6}$/.test(pin) || pin !== pinConfirm) {
        toast.error(rtl ? "أدخل الرقم السري الوظيفي من 6 أرقام وتأكيد مطابق" : "Enter a matching 6-digit PIN");
        return;
      }
      const result = await resetCredential(pin, false);
      if (result.success) toast.success(rtl ? "تمت إعادة تعيين الرقم السري الوظيفي" : "PIN reset");
      else toast.error(result.error?.message || "PIN update failed");
    } finally {
      clearCredentialForm();
      refresh();
    }
  };

  const saveOwnPin = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (!/^\d{6}$/.test(currentPin) || !/^\d{6}$/.test(selfNewPin) || selfNewPin !== selfPinConfirm) {
        toast.error(rtl ? "أدخل الأرقام السرية الوظيفية من 6 أرقام مع تأكيد مطابق" : "Enter matching 6-digit PIN values");
        return;
      }
      const result = await changeOwnPin({ currentPin, newPin: selfNewPin, confirmation: selfPinConfirm });
      if (result.success) toast.success(rtl ? "تم تغيير الرقم السري الوظيفي، يلزم التحقق من جديد" : "PIN changed; re-verification is required");
      else toast.error(result.error?.message || "PIN change failed");
    } finally {
      clearCredentialForm();
      refresh();
    }
  };

  const saveEmployeeCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!employeeCode.trim() || !employeeCodeReason.trim()) {
      toast.error(rtl ? "الكود الجديد وسبب التغيير مطلوبان" : "New code and change reason are required");
      return;
    }
    const result = await changeEmployeeCode(employeeCode.trim(), employeeCodeReason.trim());
    if (result.success) {
      toast.success(rtl ? "تم تغيير كود الموظف" : "Employee Code changed");
      setEmployeeCode("");
      setEmployeeCodeReason("");
      refresh();
    } else toast.error(result.error?.message || "Employee Code change failed");
  };

  const revokeOperatorSessionsAction = async () => {
    const reason = window.prompt(rtl ? "سبب إنهاء جلسات المشغل" : "Revocation reason", "UI operator session revocation") || "UI operator session revocation";
    const result = await revokeOperatorSessions(reason);
    if (result.success) toast.success(rtl ? "تم إنهاء جلسات المشغل" : "Operator sessions revoked");
    else toast.error(result.error?.message || "Operator session revocation failed");
    refresh();
  };

  const saveBranches = async () => {
    const result = await updateBranches(selectedBranchIds);
    if (result.success) {
      toast.success(rtl ? "تم تحديث الفروع" : "Branch access updated");
      refresh();
    } else toast.error(result.error?.message || "Branch update failed");
  };

  const savePermissions = async () => {
    const result = await updatePermissions({ roleIds: selectedRoleIds, grantPermissionIds, denialPermissionIds, reason: permissionReason || "UI permission change" });
    if (result.success) {
      toast.success(rtl ? "تم تحديث التفويض" : "Authorization updated");
      setPermissionReason("");
      refreshAuthorization();
    } else toast.error(result.error?.message || "Permission update failed");
  };

  const handleUpdateLimits = async (event: FormEvent) => {
    event.preventDefault();
    if (!employee) return;
    const res = await updateEmployee(employee.id, {
      approvalLimitsDetail: limits,
      approvalLimit: limits.discountLimit,
    });
    if (res.success) {
      toast.success(rtl ? "تم تحديث حدود الصلاحيات بنجاح" : "Approval limits updated successfully");
      refresh();
    } else {
      toast.error(res.error?.message || "Failed to update limits");
    }
  };

  if (loading) return <div className="p-8 text-center text-xs text-slate-500">{common("loading")}</div>;

  if (error || !employee) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldAlert className="h-12 w-12 text-rose-500" />
        <h2 className="mt-4 text-lg font-black text-navy-950 dark:text-white">{rtl ? "الموظف غير موجود" : "Employee Not Found"}</h2>
        <p className="mt-2 text-xs text-slate-500">{rtl ? "عذرًا، لم نتمكن من العثور على ملف هذا الموظف." : "Sorry, we couldn't find this employee profile."}</p>
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
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <span className="break-all text-xs text-slate-400">
            {rtl ? "ملف الموظف" : "Employee Profile"} · {employee.id} · {employee.employeeCode || (rtl ? "بدون كود" : "NO-CODE")}
          </span>
          <h1 className="text-xl font-black text-navy-950 dark:text-white">{employee.name}</h1>
        </div>
        <div className="ms-auto flex flex-wrap justify-end gap-2">
          <Badge tone={employee.status === "inactive" ? "rose" : "green"}>{employee.status === "inactive" ? (rtl ? "غير نشط" : "Inactive") : employee.status}</Badge>
          <Badge tone="blue">{employee.role}</Badge>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800" role="tablist" aria-label={rtl ? "أقسام ملف الموظف" : "Employee detail sections"}>
        {TAB_IDS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-3 text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {rtl ? tab.ar : tab.en}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && <EmployeeOverviewTab employee={employee} rtl={rtl} />}
      {activeTab === "operational" && <EmployeeOperationalAccessTab employee={employee} branchAccess={branchAccess} permissionState={permissionState} operatorSessions={operatorSessions} rtl={rtl} />}
      {activeTab === "branches" && (
        <EmployeeBranchAccessTab
          employee={employee}
          branchAccess={branchAccess}
          branchOptions={branchOptions}
          selectedBranchIds={selectedBranchIds}
          setSelectedBranchIds={setSelectedBranchIds}
          canManage={canManageBranches}
          onSave={saveBranches}
          loading={authorizationLoading}
          rtl={rtl}
        />
      )}
      {activeTab === "roles" && (
        <EmployeeRoleTemplatesTab
          permissionState={permissionState}
          selectedRoleIds={selectedRoleIds}
          setSelectedRoleIds={setSelectedRoleIds}
          canManage={canManagePermissions}
          onSave={savePermissions}
          loading={authorizationLoading}
          rtl={rtl}
          permissionReason={permissionReason}
          setPermissionReason={setPermissionReason}
        />
      )}
      {activeTab === "direct-permissions" && (
        <EmployeeDirectPermissionsTab
          permissionState={permissionState}
          grantPermissionIds={grantPermissionIds}
          denialPermissionIds={denialPermissionIds}
          setGrantPermissionIds={setGrantPermissionIds}
          setDenialPermissionIds={setDenialPermissionIds}
          canManage={canManagePermissions}
          onSave={savePermissions}
          loading={authorizationLoading}
          rtl={rtl}
          permissionReason={permissionReason}
          setPermissionReason={setPermissionReason}
        />
      )}
      {activeTab === "effective-permissions" && <EmployeeEffectivePermissionsTab permissionState={permissionState} rtl={rtl} />}
      {activeTab === "credential" && (
        <EmployeeCredentialTab
          employee={employee}
          canManage={canManageCredentials}
          pin={pin}
          pinConfirm={pinConfirm}
          currentPin={currentPin}
          selfNewPin={selfNewPin}
          selfPinConfirm={selfPinConfirm}
          employeeCode={employeeCode}
          employeeCodeReason={employeeCodeReason}
          codeHistory={codeHistory}
          setPin={setPin}
          setPinConfirm={setPinConfirm}
          setCurrentPin={setCurrentPin}
          setSelfNewPin={setSelfNewPin}
          setSelfPinConfirm={setSelfPinConfirm}
          setEmployeeCode={setEmployeeCode}
          setEmployeeCodeReason={setEmployeeCodeReason}
          onSubmit={saveCredential}
          onSelfPinSubmit={saveOwnPin}
          onEmployeeCodeSubmit={saveEmployeeCode}
          onRevokeSessions={revokeOperatorSessionsAction}
          onCancel={clearCredentialForm}
          rtl={rtl}
        />
      )}
      {activeTab === "attempts" && <EmployeeVerificationAttemptsTab attempts={verificationAttempts} rtl={rtl} />}
      {activeTab === "operator-sessions" && <EmployeeOperationalSessionsTab sessions={operatorSessions} rtl={rtl} />}
      {activeTab === "audit" && <EmployeeAuditActivityTab logs={employeeLogs} rtl={rtl} />}
      {activeTab === "hr" && <EmployeeHrPayrollAttendanceTab limits={limits} setLimits={setLimits} onSubmit={handleUpdateLimits} money={money} rtl={rtl} />}
    </div>
  );
}

function EmployeeOverviewTab({ employee, rtl }: { employee: Employee; rtl: boolean }) {
  return (
    <Card className="p-5">
      <h3 className="font-black text-navy-950 dark:text-white">{rtl ? "بيانات الموظف والتوظيف" : "Employee & Work Details"}</h3>
      <div className="mt-5 grid gap-4 text-xs sm:grid-cols-2">
        <Info label={rtl ? "كود الموظف" : "Employee Code"} value={employee.employeeCode || "—"} mono />
        <Info label={rtl ? "الدور الوظيفي" : "Work Role"} value={`${employee.role} / ${employee.jobTitle || "—"}`} />
        <Info label={rtl ? "الفرع الأساسي" : "Primary Branch"} value={employee.branch || "—"} />
        <Info label={rtl ? "البريد الإلكتروني" : "Email"} value={employee.email || "—"} />
        <Info label={rtl ? "الهاتف" : "Phone"} value={employee.phone || "—"} />
        <Info label={rtl ? "تاريخ الانضمام" : "Join Date"} value={employee.joinDate || "—"} />
        <Info label={rtl ? "الدور التقني في النظام" : "System Security Role"} value={employee.systemRole || "sales"} />
        <div className="sm:col-span-2 rounded-xl border border-amber-100 bg-amber-50 p-4 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          {rtl
            ? "الفرع الأساسي للموظف معلومة تعريفية فقط. التفويض الفعلي يعتمد على خريطة فروع التفويض في تبويب فروع التفويض."
            : "The primary branch is identity metadata only. Actual authorization is controlled by the Branch Access tab."}
        </div>
        <div className="sm:col-span-2">
          <p className="text-slate-400">{rtl ? "ملاحظات" : "Notes"}</p>
          <p className="mt-1 text-slate-600 dark:text-slate-400">{employee.notes || "—"}</p>
        </div>
      </div>
    </Card>
  );
}

function EmployeeOperationalAccessTab({
  employee,
  branchAccess,
  permissionState,
  operatorSessions,
  rtl,
}: {
  employee: Employee;
  branchAccess: EmployeeBranchAccess[];
  permissionState: EmployeePermissionState | null;
  operatorSessions: EmployeeOperationalSessionHistory[];
  rtl: boolean;
}) {
  const summary = employee.authorizationSummary;
  return (
    <Card className="p-5">
      <h3 className="font-black text-navy-950 dark:text-white">{rtl ? "ملخص الوصول التشغيلي" : "Operational Access Summary"}</h3>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {rtl ? "ملخص خادمي للهوية التشغيلية دون عرض إصدارات الاعتماد أو بصمات الجلسة." : "Server-backed operational identity summary. Credential versions and fingerprints are not editable or displayed."}
      </p>
      <div className="mt-5 grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-3">
        <Metric label={rtl ? "حالة الاعتماد" : "Credential state"} value={summary?.credentialState || "not_configured"} />
        <Metric label={rtl ? "فروع التفويض" : "Allowed branches"} value={String(summary?.branchAccessCount ?? branchAccess.length)} />
        <Metric label={rtl ? "قوالب الأدوار" : "Role templates"} value={String(summary?.roleTemplateCount ?? permissionState?.roles?.length ?? 0)} />
        <Metric label={rtl ? "الصلاحيات الفعالة" : "Effective permissions"} value={String(permissionState?.authorization?.effectivePermissionNames?.length ?? 0)} />
        <Metric label={rtl ? "الجلسات النشطة" : "Active operator sessions"} value={String(summary?.activeOperatorSessionCount ?? operatorSessions.filter((session) => session.state?.startsWith("active")).length)} />
        <Metric label={rtl ? "آخر تحقق" : "Last verified"} value={summary?.lastVerifiedAt ? formatDate(summary.lastVerifiedAt) : "—"} />
      </div>
    </Card>
  );
}

function EmployeeBranchAccessTab({
  employee,
  branchAccess,
  branchOptions,
  selectedBranchIds,
  setSelectedBranchIds,
  canManage,
  onSave,
  loading,
  rtl,
}: {
  employee: Employee;
  branchAccess: EmployeeBranchAccess[];
  branchOptions: BranchOption[];
  selectedBranchIds: string[];
  setSelectedBranchIds: (ids: string[]) => void;
  canManage: boolean;
  onSave: () => Promise<void>;
  loading: boolean;
  rtl: boolean;
}) {
  const [search, setSearch] = useState("");
  const selectedSet = new Set(selectedBranchIds);
  const visibleBranches = branchOptions.filter((branch) => `${branch.name || ""} ${branch.code || ""} ${branch.id}`.toLowerCase().includes(search.toLowerCase()));
  const labelFor = (id: string) => {
    const option = branchOptions.find((branch) => branch.id === id) || branchAccess.find((row) => row.branchId === id)?.branch;
    return option?.name || option?.code || id;
  };
  return (
    <Card className="p-5">
      <h3 className="font-black text-navy-950 dark:text-white">{rtl ? "فروع تفويض الموظف" : "Employee Branch Access"}</h3>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {rtl ? "اختر الفروع من قائمة بحث خاضعة للشركة. الفرع الأساسي لا يمنح التفويض وحده." : "Use the same-company searchable branch selector. Primary branch does not grant authorization by itself."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Chip>{rtl ? "الفرع الأساسي" : "Primary branch"}: {employee.branch || employee.branchId || "—"}</Chip>
        {selectedBranchIds.map((branchId) => (
          <Chip key={branchId} onRemove={canManage ? () => setSelectedBranchIds(selectedBranchIds.filter((id) => id !== branchId)) : undefined}>
            {labelFor(branchId)}
          </Chip>
        ))}
      </div>
      {canManage ? (
        <div className="mt-5 space-y-4">
          <SearchBox value={search} onChange={setSearch} placeholder={rtl ? "ابحث عن فرع بالاسم أو الكود" : "Search branch by name or code"} />
          <div className="max-h-72 space-y-2 overflow-auto rounded-2xl border border-border p-3">
            {visibleBranches.length ? visibleBranches.map((branch) => (
              <label key={branch.id} className="flex cursor-pointer items-center gap-3 rounded-xl p-2 text-xs hover:bg-background">
                <input
                  type="checkbox"
                  checked={selectedSet.has(branch.id)}
                  onChange={(event) => {
                    if (event.target.checked) setSelectedBranchIds([...selectedBranchIds, branch.id]);
                    else setSelectedBranchIds(selectedBranchIds.filter((id) => id !== branch.id));
                  }}
                />
                <span className="font-bold">{branch.name || branch.id}</span>
                <span className="text-muted-foreground">{branch.code || branch.id}</span>
              </label>
            )) : <p className="p-4 text-center text-xs text-muted-foreground">{rtl ? "لا توجد فروع مطابقة." : "No matching branches."}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setSelectedBranchIds(branchAccess.map((row) => row.branchId))}>{rtl ? "إلغاء" : "Cancel"}</Button>
            <Button type="button" disabled={loading} onClick={() => void onSave()}>{rtl ? "حفظ الفروع" : "Save Branches"}</Button>
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-2xl bg-background p-4 text-xs text-muted-foreground">{rtl ? "لا تملك صلاحية إدارة الفروع." : "You do not have branch-management permission."}</p>
      )}
    </Card>
  );
}

function EmployeeRoleTemplatesTab({
  permissionState,
  selectedRoleIds,
  setSelectedRoleIds,
  canManage,
  onSave,
  loading,
  rtl,
  permissionReason,
  setPermissionReason,
}: {
  permissionState: EmployeePermissionState | null;
  selectedRoleIds: string[];
  setSelectedRoleIds: (ids: string[]) => void;
  canManage: boolean;
  onSave: () => Promise<void>;
  loading: boolean;
  rtl: boolean;
  permissionReason: string;
  setPermissionReason: (value: string) => void;
}) {
  const [search, setSearch] = useState("");
  const roleOptions = permissionState?.roles ?? [];
  const visibleRoles = roleOptions.filter((role) => `${role.name} ${role.slug}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <Card className="p-5">
      <h3 className="font-black text-navy-950 dark:text-white">{rtl ? "قوالب أدوار الموظف" : "Employee Role Templates"}</h3>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {rtl ? "هذه قوالب تفويض للموظف، وليست أدوار الحساب التقني في صفحة حسابات النظام." : "These are Employee authorization templates, not technical User roles from System Accounts."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {roleOptions.map((role) => <Chip key={role.id}>{role.name} · {role.slug}</Chip>)}
        {!roleOptions.length && <Chip>{rtl ? "لا توجد أدوار حالية" : "No assigned role templates"}</Chip>}
      </div>
      {canManage ? (
        <div className="mt-5 space-y-4">
          <SearchBox value={search} onChange={setSearch} placeholder={rtl ? "ابحث في الأدوار الحالية" : "Search current role templates"} />
          <input className="input-base" value={permissionReason} onChange={(event) => setPermissionReason(event.target.value)} placeholder={rtl ? "سبب تغيير الصلاحيات" : "Permission change reason"} />
          <div className="rounded-2xl border border-border p-3">
            {visibleRoles.length ? visibleRoles.map((role) => (
              <label key={role.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl p-2 text-xs hover:bg-background">
                <span><strong>{role.name}</strong><span className="ms-2 text-muted-foreground">{role.slug}</span></span>
                <input
                  type="checkbox"
                  checked={selectedRoleIds.includes(role.id)}
                  onChange={(event) => {
                    if (event.target.checked) setSelectedRoleIds([...selectedRoleIds, role.id]);
                    else setSelectedRoleIds(selectedRoleIds.filter((id) => id !== role.id));
                  }}
                />
              </label>
            )) : <p className="p-4 text-center text-xs text-muted-foreground">{rtl ? "لا توجد قوالب أدوار مطابقة." : "No matching role templates."}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setSelectedRoleIds(roleOptions.map((role) => role.id))}>{rtl ? "إلغاء" : "Cancel"}</Button>
            <Button type="button" disabled={loading} onClick={() => void onSave()}>{rtl ? "حفظ الأدوار" : "Save Roles"}</Button>
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-2xl bg-background p-4 text-xs text-muted-foreground">{rtl ? "لا تملك صلاحية إدارة أدوار الموظف." : "You do not have Employee permission-management access."}</p>
      )}
    </Card>
  );
}

function EmployeeDirectPermissionsTab({
  permissionState,
  grantPermissionIds,
  denialPermissionIds,
  setGrantPermissionIds,
  setDenialPermissionIds,
  canManage,
  onSave,
  loading,
  rtl,
  permissionReason,
  setPermissionReason,
}: {
  permissionState: EmployeePermissionState | null;
  grantPermissionIds: string[];
  denialPermissionIds: string[];
  setGrantPermissionIds: (ids: string[]) => void;
  setDenialPermissionIds: (ids: string[]) => void;
  canManage: boolean;
  onSave: () => Promise<void>;
  loading: boolean;
  rtl: boolean;
  permissionReason: string;
  setPermissionReason: (value: string) => void;
}) {
  const [search, setSearch] = useState("");
  const options = toPermissionOptions(permissionState);
  const sources = permissionSourceMap(permissionState);
  const uiLocale = rtl ? "ar" : "en";
  const filtered = options.filter((permission) => {
    const meta = permissionMeta(permission.name);
    return `${permission.name} ${meta.label[uiLocale]} ${meta.description[uiLocale]} ${meta.module[uiLocale]}`.toLowerCase().includes(search.toLowerCase());
  });
  const grouped = filtered.reduce<Record<string, PermissionOption[]>>((acc, permission) => {
    const group = permission.module || groupPermissionName(permission.name);
    acc[group] = [...(acc[group] || []), permission];
    return acc;
  }, {});
  const toggleGrant = (permission: PermissionOption, checked: boolean) => {
    if (checked) {
      setGrantPermissionIds([...grantPermissionIds.filter((id) => id !== permission.id), permission.id]);
      setDenialPermissionIds(denialPermissionIds.filter((id) => id !== permission.id));
    } else setGrantPermissionIds(grantPermissionIds.filter((id) => id !== permission.id));
  };
  const toggleDenial = (permission: PermissionOption, checked: boolean) => {
    if (checked) {
      setDenialPermissionIds([...denialPermissionIds.filter((id) => id !== permission.id), permission.id]);
      setGrantPermissionIds(grantPermissionIds.filter((id) => id !== permission.id));
    } else setDenialPermissionIds(denialPermissionIds.filter((id) => id !== permission.id));
  };
  return (
    <Card className="p-5">
      <h3 className="font-black text-navy-950 dark:text-white">{rtl ? "المنح والمنع المباشر" : "Direct Grants and Denials"}</h3>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {rtl ? "المنع المباشر يتجاوز الدور والسماح المباشر. اختيار السماح أو المنع هنا يضبط الحالة المباشرة لهذه الصلاحية." : "Direct denial overrides role and direct grant. Selecting grant or denial here adjusts the direct state for that permission."}
      </p>
      <div className="mt-5 space-y-4">
        <SearchBox value={search} onChange={setSearch} placeholder={rtl ? "ابحث باسم الصلاحية أو الوحدة" : "Search permission name or module"} />
        <input className="input-base" value={permissionReason} onChange={(event) => setPermissionReason(event.target.value)} placeholder={rtl ? "سبب تغيير الصلاحيات" : "Permission change reason"} />
        <div className="space-y-4">
          {Object.entries(grouped).map(([module, permissions]) => (
            <div key={module} className="rounded-2xl border border-border p-3">
              <p className="text-xs font-black uppercase text-muted-foreground">{permissionModuleLabel(module, uiLocale)}</p>
              <div className="mt-3 space-y-2">
                {permissions.map((permission) => (
                  <div key={permission.id} className="grid gap-2 rounded-xl p-2 text-xs hover:bg-background sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                    <span className="min-w-0">
                      <span className="block font-bold">{permissionLabel(permission.name, uiLocale)}</span>
                      <span className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        <span className="font-mono">{permission.name}</span>
                        <span>{sourceBadgeLabel(sources.get(permission.name)?.source || "NOT_GRANTED", rtl)}</span>
                        {sources.get(permission.name)?.effective && <span className="text-emerald-700">{rtl ? "فعال" : "Effective"}</span>}
                        {sources.get(permission.name)?.denied && <span className="text-rose-700">{rtl ? "ممنوع" : "Denied"}</span>}
                      </span>
                    </span>
                    <label className="inline-flex items-center gap-2 text-emerald-700"><input disabled={!canManage} type="checkbox" checked={grantPermissionIds.includes(permission.id)} onChange={(event) => toggleGrant(permission, event.target.checked)} /> {rtl ? "سماح مباشر" : "Direct grant"}</label>
                    <label className="inline-flex items-center gap-2 text-rose-700"><input disabled={!canManage} type="checkbox" checked={denialPermissionIds.includes(permission.id)} onChange={(event) => toggleDenial(permission, event.target.checked)} /> {rtl ? "منع مباشر" : "Direct denial"}</label>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!options.length && <p className="rounded-2xl bg-background p-4 text-xs text-muted-foreground">{rtl ? "كتالوج الصلاحيات المركزي فارغ." : "The central assignable permission catalog is empty."}</p>}
          {options.length > 0 && !filtered.length && <p className="rounded-2xl bg-background p-4 text-xs text-muted-foreground">{rtl ? "لا توجد صلاحيات مطابقة للبحث." : "No permissions match the search."}</p>}
        </div>
        {canManage ? (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => {
              setGrantPermissionIds(permissionState?.grants?.map((permission) => permission.id) ?? []);
              setDenialPermissionIds(permissionState?.denials?.map((permission) => permission.id) ?? []);
            }}>{rtl ? "إلغاء" : "Cancel"}</Button>
            <Button type="button" disabled={loading} onClick={() => void onSave()}>{rtl ? "حفظ الصلاحيات" : "Save Permissions"}</Button>
          </div>
        ) : (
          <p className="rounded-2xl bg-background p-4 text-xs text-muted-foreground">{rtl ? "لا تملك صلاحية إدارة الصلاحيات." : "You do not have permission-management access."}</p>
        )}
      </div>
    </Card>
  );
}

function EmployeeEffectivePermissionsTab({ permissionState, rtl }: { permissionState: EmployeePermissionState | null; rtl: boolean }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "allowed" | "denied" | "inherited" | "direct" | "not-granted">("all");
  const uiLocale = rtl ? "ar" : "en";
  const effective = permissionState?.authorization?.effectivePermissionNames ?? [];
  const sourceRows = permissionSourceMap(permissionState);
  const options = toPermissionOptions(permissionState);
  const rows = options.map((permission) => {
    const state = sourceRows.get(permission.name) || { source: "NOT_GRANTED", effective: false, denied: false, role: false, directGrant: false, directDenial: false };
    const source = state.source === "DENIED"
      ? `${permissionSourceLabel("denial", uiLocale)} · ${permissionSourceLabel("denial_wins", uiLocale)}`
      : sourceBadgeLabel(state.source, rtl);
    return { name: permission.name, isDenied: state.denied, isGrant: state.directGrant, isRole: state.role, isEffective: state.effective, source, meta: permissionMeta(permission.name) };
  }).filter((row) => {
    const haystack = `${row.name} ${row.meta.label[uiLocale]} ${row.meta.description[uiLocale]} ${row.meta.module[uiLocale]} ${row.source}`.toLowerCase();
    const matchesSearch = !search.trim() || haystack.includes(search.trim().toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "allowed" && effective.includes(row.name) && !row.isDenied) ||
      (filter === "denied" && row.isDenied) ||
      (filter === "inherited" && row.isRole) ||
      (filter === "direct" && (row.isGrant || row.isDenied)) ||
      (filter === "not-granted" && !row.isEffective && !row.isDenied);
    return matchesSearch && matchesFilter;
  });
  return (
    <Card className="p-5">
      <h3 className="font-black text-navy-950 dark:text-white">{rtl ? "الصلاحيات الفعالة من الخادم" : "Backend-Resolved Effective Permissions"}</h3>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {rtl ? "لا تقوم الواجهة بحساب الصلاحيات. يتم عرض نتيجة الخادم فقط." : "The frontend does not calculate authority. This tab displays the backend-resolved result only."}
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_240px]">
        <SearchBox value={search} onChange={setSearch} placeholder={rtl ? "ابحث في الصلاحيات أو المصادر" : "Search permissions or sources"} />
        <select className="input-base" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
          <option value="all">{rtl ? "كل الصلاحيات" : "All permissions"}</option>
          <option value="allowed">{rtl ? "المسموح" : "Allowed"}</option>
          <option value="denied">{rtl ? "الممنوع" : "Denied"}</option>
          <option value="inherited">{rtl ? "الموروث" : "Inherited"}</option>
          <option value="direct">{rtl ? "المباشر" : "Direct"}</option>
          <option value="not-granted">{rtl ? "غير ممنوحة" : "Not granted"}</option>
        </select>
      </div>
      <div className="mt-3 text-xs font-bold text-muted-foreground">
        {rtl ? "الصلاحيات الفعالة" : "Effective permissions"}: {effective.length} · {rtl ? "المعروض" : "Shown"}: {rows.length}
      </div>
      <div className="mt-5 space-y-2">
        {rows.length ? rows.map((row) => (
          <div key={row.name} className={`rounded-2xl border p-3 text-xs ${row.isDenied ? "border-rose-200 bg-rose-50 text-rose-900" : row.isEffective ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-background text-muted-foreground"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-black">{row.meta.label[uiLocale]}</span>
              <span>{row.meta.module[uiLocale]}</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
              <span>{row.source}</span>
              <span>{row.meta.description[uiLocale]}</span>
            </div>
          </div>
        )) : <p className="rounded-2xl bg-background p-4 text-xs text-muted-foreground">{rtl ? "لا توجد صلاحيات مطابقة." : "No matching permissions found."}</p>}
      </div>
    </Card>
  );
}

function EmployeeCredentialTab({
  employee,
  canManage,
  pin,
  pinConfirm,
  currentPin,
  selfNewPin,
  selfPinConfirm,
  employeeCode,
  employeeCodeReason,
  codeHistory,
  setPin,
  setPinConfirm,
  setCurrentPin,
  setSelfNewPin,
  setSelfPinConfirm,
  setEmployeeCode,
  setEmployeeCodeReason,
  onSubmit,
  onSelfPinSubmit,
  onEmployeeCodeSubmit,
  onRevokeSessions,
  onCancel,
  rtl,
}: {
  employee: Employee;
  canManage: boolean;
  pin: string;
  pinConfirm: string;
  currentPin: string;
  selfNewPin: string;
  selfPinConfirm: string;
  employeeCode: string;
  employeeCodeReason: string;
  codeHistory: Array<{ id: string; oldCode?: string | null; newCode?: string | null; reason?: string | null; createdAt?: string | null }>;
  setPin: (value: string) => void;
  setPinConfirm: (value: string) => void;
  setCurrentPin: (value: string) => void;
  setSelfNewPin: (value: string) => void;
  setSelfPinConfirm: (value: string) => void;
  setEmployeeCode: (value: string) => void;
  setEmployeeCodeReason: (value: string) => void;
  onSubmit: (event: FormEvent) => Promise<void>;
  onSelfPinSubmit: (event: FormEvent) => Promise<void>;
  onEmployeeCodeSubmit: (event: FormEvent) => Promise<void>;
  onRevokeSessions: () => Promise<void>;
  onCancel: () => void;
  rtl: boolean;
}) {
  const credentialState = employee.authorizationSummary?.credentialState || "not_configured";
  const credentialStateLabel = credentialState === "not_configured"
    ? (rtl ? "PIN غير مهيأ" : "PIN not configured")
    : credentialState === "reset_required"
      ? (rtl ? "يلزم ضبط PIN" : "PIN reset required")
      : credentialState === "active"
        ? (rtl ? "PIN مهيأ" : "PIN configured")
        : credentialState === "inactive"
          ? (rtl ? "اعتماد غير نشط" : "Credential inactive")
          : credentialState;
  const pinActionLabel = credentialState === "not_configured"
    ? (rtl ? "ضبط PIN" : "Set PIN")
    : (rtl ? "إعادة تعيين PIN" : "Reset PIN");
  return (
    <Card className="p-5">
      <h3 className="font-black text-navy-950 dark:text-white">{rtl ? "إدارة الاعتماد والرقم السري الوظيفي" : "Credential & PIN Management"}</h3>
      <div className="mt-4 grid gap-4 text-xs sm:grid-cols-3">
        <Metric label={rtl ? "حالة PIN" : "PIN status"} value={credentialStateLabel} />
        <Metric label={rtl ? "آخر نجاح" : "Last success"} value={employee.authorizationSummary?.lastVerifiedAt ? formatDate(employee.authorizationSummary.lastVerifiedAt) : "—"} />
        <Metric label={rtl ? "جلسات مشغل نشطة" : "Active operator sessions"} value={String(employee.authorizationSummary?.activeOperatorSessionCount ?? 0)} />
      </div>
      <form onSubmit={(event) => void onSelfPinSubmit(event)} className="mt-5 max-w-lg space-y-3 rounded-2xl border border-border p-4">
        <h4 className="text-sm font-black">{rtl ? "تغيير الرقم السري الوظيفي ذاتيًا" : "Self-change PIN"}</h4>
        <input className="input-base" inputMode="numeric" type="password" maxLength={6} value={currentPin} autoComplete="current-password" onChange={(event) => setCurrentPin(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder={rtl ? "الرقم السري الوظيفي الحالي" : "Current PIN"} />
        <input className="input-base" inputMode="numeric" type="password" maxLength={6} value={selfNewPin} autoComplete="new-password" onChange={(event) => setSelfNewPin(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder={rtl ? "الرقم السري الوظيفي الجديد · 6 أرقام" : "New PIN · 6 digits"} />
        <input className="input-base" inputMode="numeric" type="password" maxLength={6} value={selfPinConfirm} autoComplete="new-password" onChange={(event) => setSelfPinConfirm(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder={rtl ? "تأكيد الرقم السري الوظيفي" : "Confirm PIN"} />
        <p className="text-[11px] text-muted-foreground">{rtl ? "يتطلب جلسة موظف حالية. بعد النجاح يلزم التحقق من جديد." : "Requires a current Employee session. Re-verification is required after success."}</p>
        <div className="flex gap-2">
          <Button type="submit">{rtl ? "تغيير الرقم السري الوظيفي" : "Change PIN"}</Button>
          <Button type="button" variant="secondary" onClick={onCancel}>{rtl ? "إلغاء" : "Cancel"}</Button>
        </div>
      </form>
      {canManage ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <form onSubmit={(event) => void onSubmit(event)} className="space-y-3 rounded-2xl border border-border p-4">
            <h4 className="text-sm font-black">{pinActionLabel}</h4>
            <input className="input-base" inputMode="numeric" type="password" maxLength={6} value={pin} autoComplete="new-password" onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder={rtl ? "PIN الموظف · 6 أرقام" : "Employee PIN · 6 digits"} />
            <input className="input-base" inputMode="numeric" type="password" maxLength={6} value={pinConfirm} autoComplete="new-password" onChange={(event) => setPinConfirm(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder={rtl ? "تأكيد الرقم السري الوظيفي" : "Confirm PIN"} />
            <p className="text-[11px] text-muted-foreground">{rtl ? "لا يتم عرض أو حفظ الرقم السري الوظيفي في المتصفح بعد الإرسال." : "PIN values are never revealed and are cleared after every submit outcome."}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{pinActionLabel}</Button>
              <Button type="button" variant="secondary" onClick={onCancel}>{rtl ? "إلغاء" : "Cancel"}</Button>
              <Button type="button" variant="secondary" onClick={() => void onRevokeSessions()}>{rtl ? "إنهاء جلسات المشغل" : "Revoke sessions"}</Button>
            </div>
          </form>
          <form onSubmit={(event) => void onEmployeeCodeSubmit(event)} className="space-y-3 rounded-2xl border border-border p-4">
            <h4 className="text-sm font-black">{rtl ? "تغيير كود الموظف" : "Change Employee Code"}</h4>
            <input className="input-base" value={employeeCode} onChange={(event) => setEmployeeCode(event.target.value)} placeholder={rtl ? "كود الموظف الجديد" : "New Employee Code"} />
            <input className="input-base" value={employeeCodeReason} onChange={(event) => setEmployeeCodeReason(event.target.value)} placeholder={rtl ? "سبب التغيير" : "Change reason"} />
            <Button type="submit">{rtl ? "تغيير الكود" : "Change Code"}</Button>
            <div className="max-h-40 space-y-2 overflow-y-auto text-[11px] text-muted-foreground">
              {codeHistory.length ? codeHistory.map((row) => (
                <div key={row.id} className="rounded border border-border p-2">
                  {row.oldCode || "—"} → {row.newCode || "—"} · {row.reason || "—"} · {formatDate(row.createdAt)}
                </div>
              )) : <p>{rtl ? "لا يوجد سجل تغيير كود بعد." : "No code-change history yet."}</p>}
            </div>
          </form>
        </div>
      ) : (
        <p className="mt-5 rounded-2xl bg-background p-4 text-xs text-muted-foreground">{rtl ? "لا تملك صلاحية إدارة الاعتماد." : "You do not have credential-management access."}</p>
      )}
    </Card>
  );
}

function EmployeeVerificationAttemptsTab({ attempts, rtl }: { attempts: EmployeeVerificationAttempt[]; rtl: boolean }) {
  return (
    <Card className="p-5">
      <h3 className="font-black text-navy-950 dark:text-white">{rtl ? "محاولات التحقق" : "Verification Attempts"}</h3>
      <div className="mt-4 space-y-2 text-xs">
        {attempts.length ? attempts.map((attempt) => (
          <div key={attempt.id} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
            <div className="flex justify-between gap-3">
              <span className={attempt.result === "success" ? "font-bold text-emerald-600" : "font-bold text-rose-600"}>{attempt.result}</span>
              <span className="text-[10px] text-slate-400">{formatDate(attempt.createdAt)}</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              {attempt.requestedPermission || attempt.requestedOperation || "—"} · {attempt.failureCode || (rtl ? "نجاح" : "OK")}
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              {rtl ? "الفرع" : "Branch"}: {attempt.branchId || "—"} · {rtl ? "المستخدم التقني" : "Technical User"}: {attempt.technicalUserId || "—"} · {rtl ? "عنوان الشبكة" : "IP"}: {attempt.ipAddress || (rtl ? "مخفي" : "masked")} · {rtl ? "المتصفح" : "UA"}: {attempt.userAgent || (rtl ? "ملخص" : "summarized")}
            </p>
          </div>
        )) : <p className="py-10 text-center text-xs text-slate-400">{rtl ? "لا توجد محاولات بعد." : "No attempts yet."}</p>}
      </div>
    </Card>
  );
}

function EmployeeOperationalSessionsTab({ sessions, rtl }: { sessions: EmployeeOperationalSessionHistory[]; rtl: boolean }) {
  return (
    <Card className="p-5">
      <div className="mb-4 border-b border-slate-100 pb-4 dark:border-slate-800">
        <h3 className="font-black text-navy-950 dark:text-white">{rtl ? "سجل جلسات المشغل التشغيلية" : "Operational Operator Session History"}</h3>
        <p className="mt-1 text-[10px] text-slate-400">
          {rtl ? "قراءة فقط من جلسات المشغل المخزنة في الخادم. لا يتم عرض معرف الجهاز الخام." : "Read-only server-backed operator sessions. Raw device identifiers are not displayed."}
        </p>
      </div>
      {sessions.length ? (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="rounded-2xl border border-slate-100 p-4 text-xs dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 font-black text-slate-500 dark:bg-navy-950">{rtl ? "جهاز" : "PC"}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-navy-900 dark:text-white">{session.maskedDeviceLabel || "device-••••"}</p>
                    <Badge tone={session.state?.startsWith("active") ? "green" : "slate"}>{session.state}</Badge>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">{session.branch?.name || session.branch?.id || "—"} · {session.technicalUser?.name || session.technicalUser?.email || "—"}</p>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-[10px] text-slate-500 sm:grid-cols-3">
                <span>{rtl ? "تحقق" : "Verified"}: {formatDate(session.verifiedAt)}</span>
                <span>{rtl ? "آخر نشاط" : "Last activity"}: {formatDate(session.lastActivityAt)}</span>
                <span>{rtl ? "انتهاء الخمول" : "Idle expiry"}: {formatDate(session.idleExpiresAt)}</span>
                <span>{rtl ? "قفل" : "Locked"}: {formatDate(session.lockedAt)}</span>
                <span>{rtl ? "إلغاء" : "Revoked"}: {formatDate(session.revokedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : <p className="py-10 text-center text-xs text-slate-400">{rtl ? "لا توجد جلسات حالياً." : "No sessions."}</p>}
    </Card>
  );
}

function EmployeeAuditActivityTab({ logs, rtl }: { logs: AuditLog[]; rtl: boolean }) {
  return (
    <Card className="p-5">
      <h3 className="font-black text-navy-950 dark:text-white">{rtl ? "سجل العمليات والنشاط الأمني" : "Operational Activity Audit Logs"}</h3>
      <p className="mt-1 text-[11px] text-muted-foreground">{rtl ? "يستخدم هذا العرض حقل هوية الموظف التشغيلي عند توفره ويعرض المستخدم التقني منفصلاً." : "This view filters by Employee audit identity when available and keeps technical User identity distinct."}</p>
      {logs.length ? (
        <div className="mt-5 space-y-4 text-xs">
          {logs.map((log: any) => (
            <div key={log.id} className="space-y-1 border-l-2 border-brand-500 py-1 pl-4 dark:border-brand-400">
              <div className="flex justify-between"><span className="font-bold capitalize text-navy-900 dark:text-white">{log.action}</span><span className="text-[10px] text-slate-400">{log.date || log.createdAt}</span></div>
              <p className="text-slate-600 dark:text-slate-300">{log.description}</p>
              <p className="text-[9px] text-slate-400">
                {rtl ? "المستخدم التقني" : "Technical User"}: {log.technicalUserId || log.userId || log.user || "—"} · {rtl ? "الموظف" : "Employee"}: {log.employeeId || log.employeeCodeSnapshot || (rtl ? "حساب قديم فقط" : "legacy/user-only")}
              </p>
            </div>
          ))}
        </div>
      ) : <p className="py-10 text-center text-xs text-slate-400">{rtl ? "لا توجد نشاطات مسجلة لهذا الموظف." : "No recorded audit activity logs."}</p>}
    </Card>
  );
}

function EmployeeHrPayrollAttendanceTab({
  limits,
  setLimits,
  onSubmit,
  money,
  rtl,
}: {
  limits: EmployeeApprovalLimits;
  setLimits: React.Dispatch<React.SetStateAction<EmployeeApprovalLimits>>;
  onSubmit: (event: FormEvent) => Promise<void>;
  money: (value: number) => string;
  rtl: boolean;
}) {
  return (
    <Card className="p-5">
      <h3 className="font-black text-navy-950 dark:text-white">{rtl ? "الموارد والرواتب والحضور" : "HR / Payroll / Attendance"}</h3>
      <p className="mt-1 text-[11px] text-muted-foreground">{rtl ? "تم الاحتفاظ بحدود الاعتماد الحالية هنا كقسم موارد/تشغيل لاحق." : "Existing approval limits are retained here as the HR/payroll/attendance adjacent section."}</p>
      <form onSubmit={(event) => void onSubmit(event)} className="mt-5 grid gap-5 text-xs sm:grid-cols-2">
        {[
          ["discountLimit", rtl ? "حد خصم المبيعات الفردي" : "Sales Discount Limit"],
          ["priceOverrideLimit", rtl ? "حد تعديل السعر اليدوي" : "Price Override Limit"],
          ["refundLimit", rtl ? "حد المرتجعات الفوري" : "Instant Refund Limit"],
          ["journalLimit", rtl ? "حد القيود اليومية الأقصى" : "Journal Entry Limit"],
          ["adjustmentLimit", rtl ? "حد الفروق/تعديل المخزن المسموح" : "Max Inventory Adjustments Count"],
          ["goldPurchaseLimit", rtl ? "حد شراء الذهب" : "Gold Purchase Limit"],
        ].map(([key, label]) => (
          <label key={key} className="block">
            <span className="label-base">{label}</span>
            <input type="number" className="input-base mt-1" value={limits[key as keyof EmployeeApprovalLimits]} onChange={(event) => setLimits((prev) => ({ ...prev, [key]: Number(event.target.value) || 0 }))} />
            {key !== "adjustmentLimit" && <span className="mt-1 block text-[10px] text-muted-foreground">{money(Number(limits[key as keyof EmployeeApprovalLimits] || 0))}</span>}
          </label>
        ))}
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="submit">{rtl ? "تحديث حدود الصلاحيات" : "Update Limits"}</Button>
        </div>
      </form>
    </Card>
  );
}

function PermissionNameList({ title, names, tone, empty, rtl }: { title: string; names: string[]; tone: "green" | "rose"; empty: string; rtl: boolean }) {
  const uiLocale = rtl ? "ar" : "en";
  return (
    <div className="rounded-2xl border border-border p-4">
      <p className="text-xs font-black">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {names.length ? names.map((name) => <Badge key={name} tone={tone}>{permissionLabel(name, uiLocale)}</Badge>) : <p className="text-xs text-muted-foreground">{empty}</p>}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-foreground">{value}</p>
    </div>
  );
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-slate-400">{label}</p>
      <p className={`mt-1 font-bold text-navy-900 dark:text-slate-200 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
