"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CalendarCheck,
  Clock3,
  Download,
  Edit2,
  Eye,
  Plus,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { exportData } from "@/lib/export/export-service";
import { useEmployees, useEmployeeMutations } from "@/hooks/use-employees";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import type { Employee, EmployeeStatus, DarfusRole } from "@/lib/types";

const initialForm = {
  id: "",
  employeeCode: "",
  pin: "",
  pinConfirm: "",
  name: "",
  role: "",
  systemRole: "sales" as DarfusRole,
  branch: "",
  status: "present" as EmployeeStatus,
  email: "",
  phone: "",
  jobTitle: "",
  notes: "",
  deactivateReason: "",
};

export default function EmployeesPage() {
  const t = useTranslations("Employees");
  const common = useTranslations("Common");
  const filtersT = useTranslations("Filters");
  const exportT = useTranslations("PrintExport");
  const locale = useLocale();
  const { company } = useAuth();

  const [queryState, setQueryState] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [credentialFilter, setCredentialFilter] = useState("all");
  const [lockedFilter, setLockedFilter] = useState("all");
  const [activeSessionFilter, setActiveSessionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  // Custom Hook for Repository Data
  const { items: employees, loading, error, total, totalPages, query, setQuery } = useEmployees({
    page,
    pageSize,
    search: queryState,
    filters: {
      role: roleFilter,
      status: statusFilter,
      credentialState: credentialFilter,
      locked: lockedFilter,
      activeOperatorSession: activeSessionFilter,
    },
  });

  const { addEmployee, updateEmployee, deactivateEmployee, reactivateEmployee } = useEmployeeMutations();

  // Modals state
  const [formOpen, setFormOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [form, setForm] = useState(initialForm);
  const [isEdit, setIsEdit] = useState(false);

  const roles = useMemo(() => {
    return [...new Set(employees.map((item) => item.role))];
  }, [employees]);

  const stats = [
    { label: t("total"), value: total, icon: UsersRound },
    { label: t("presentToday"), value: employees.filter((item) => item.status === "present").length, icon: UserRoundCheck },
    { label: locale === "ar" ? "جلسات المشغل النشطة" : "Active operator sessions", value: employees.reduce((sum, item) => sum + Number(item.authorizationSummary?.activeOperatorSessionCount || 0), 0), icon: Clock3 },
    { label: t("leaveRequests"), value: employees.filter((item) => item.status === "leave").length, icon: CalendarCheck },
  ];

  const handleOpenAdd = () => {
    setIsEdit(false);
    setForm({
      ...initialForm,
      branch: company?.branchName || "",
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setIsEdit(true);
    setForm({
      id: emp.id,
      employeeCode: emp.employeeCode || emp.id,
      pin: "",
      pinConfirm: "",
      name: emp.name,
      role: emp.role,
      systemRole: emp.systemRole || "sales",
      branch: emp.branch,
      status: emp.status,
      email: emp.email || "",
      phone: emp.phone || "",
      jobTitle: emp.jobTitle || "",
      notes: emp.notes || "",
      deactivateReason: emp.deactivateReason || "",
    });
    setFormOpen(true);
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.role.trim() || !form.branch.trim() || !form.employeeCode.trim()) {
      toast.error(common("required"));
      return;
    }
    if (!isEdit) {
      if (!/^\d{6}$/.test(form.pin)) {
        toast.error(locale === "ar" ? "أدخل رقم PIN للموظف من 6 أرقام" : "Enter a 6-digit Employee PIN");
        return;
      }
      if (form.pin !== form.pinConfirm) {
        toast.error(locale === "ar" ? "تأكيد PIN غير مطابق" : "PIN confirmation does not match");
        return;
      }
    }

    if (isEdit) {
      const res = await updateEmployee(form.id, {
        employeeCode: form.employeeCode.trim(),
        name: form.name.trim(),
        role: form.role.trim(),
        systemRole: form.systemRole,
        branch: form.branch.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        jobTitle: form.jobTitle.trim(),
        notes: form.notes.trim(),
        pin: form.pin,
        pinConfirm: form.pinConfirm,
      });
      if (res.success) {
        toast.success(common("saved"));
        setFormOpen(false);
      } else {
        toast.error(res.error?.message || "Error saving employee");
      }
    } else {
      const res = await addEmployee({
        id: `EMP-${Date.now()}`,
        employeeCode: form.employeeCode.trim(),
        name: form.name.trim(),
        role: form.role.trim(),
        systemRole: form.systemRole,
        branch: form.branch.trim(),
        status: "present",
        email: form.email.trim(),
        phone: form.phone.trim(),
        jobTitle: form.jobTitle.trim(),
        notes: form.notes.trim(),
        pin: form.pin,
        pinConfirm: form.pinConfirm,
      });
      if (res.success) {
        toast.success(common("saved"));
        setFormOpen(false);
      } else {
        toast.error(res.error?.message || "Error saving employee");
      }
    }
  };

  const handleOpenDeactivate = (emp: Employee) => {
    setSelectedEmp(emp);
    setDeactivateReason("");
    setDeactivateOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!selectedEmp) return;
    const res = await deactivateEmployee(selectedEmp.id, deactivateReason.trim());
    if (res.success) {
      toast.success(locale === "ar" ? "تم تعطيل الموظف بنجاح" : "Employee deactivated successfully");
      setDeactivateOpen(false);
      setSelectedEmp(null);
    } else {
      toast.error(res.error?.message || "Failed to deactivate");
    }
  };

  const handleReactivate = async (emp: Employee) => {
    const res = await reactivateEmployee(emp.id);
    if (res.success) {
      toast.success(locale === "ar" ? "تم إعادة تفعيل الموظف" : "Employee reactivated successfully");
    } else {
      toast.error(res.error?.message || "Failed to reactivate");
    }
  };

  const handleExport = () => {
    const result = exportData({
      fileName: "employees.csv",
      title: t("title"),
      format: "csv",
      rows: employees,
      locale,
      columns: [
        { key: "id", header: exportT("id") },
        { key: "employeeCode", header: locale === "ar" ? "كود الموظف" : "Employee Code", value: (item) => item.employeeCode || item.id },
        { key: "name", header: t("name") },
        { key: "role", header: t("role") },
        { key: "systemRole", header: exportT("systemRole"), value: (item) => item.systemRole || "" },
        { key: "branch", header: t("branch") },
        {
          key: "status",
          header: t("status"),
          value: (item) => item.status === "present" ? t("present") : item.status === "leave" ? t("leave") : common("inactive"),
        },
        { key: "email", header: exportT("email"), value: (item) => item.email || "" },
        { key: "phone", header: exportT("phone"), value: (item) => item.phone || "" },
      ],
    });

    if (result.ok) toast.success(exportT("exportReady"));
    else toast.error(result.errorCode === "empty-data" ? exportT("noDataToExport") : exportT("exportFailed"));
  };

  const handleQueryChange = (q: string) => {
    setQueryState(q);
    setPage(1);
    setQuery((prev) => ({ ...prev, search: q }));
  };

  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(role);
    setPage(1);
    setQuery((prev) => ({
      ...prev,
      filters: { ...prev.filters, role },
    }));
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
    setQuery((prev) => ({
      ...prev,
      filters: { ...prev.filters, status },
    }));
  };

  const statusBadge = (status: EmployeeStatus) => {
    if (status === "present") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle className="h-3 w-3" />
          {t("present")}
        </span>
      );
    } else if (status === "leave") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          <Clock3 className="h-3 w-3" />
          {t("leave")}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertTriangle className="h-3 w-3" />
          {locale === "ar" ? "غير نشط" : "Inactive"}
        </span>
      );
    }
  };

  const credentialStateLabel = (state?: string | null) => {
    if (state === "not_configured") return locale === "ar" ? "PIN غير مهيأ" : "PIN not configured";
    if (state === "reset_required") return locale === "ar" ? "يلزم ضبط PIN" : "PIN reset required";
    if (state === "inactive") return locale === "ar" ? "اعتماد غير نشط" : "Credential inactive";
    if (state === "locked") return locale === "ar" ? "اعتماد مقفل" : "Credential locked";
    if (state === "active") return locale === "ar" ? "PIN مهيأ" : "PIN configured";
    return "—";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/employees/payroll"><Button variant="secondary"><Wallet className="h-4 w-4" />{t("payrollAndAttendance")}</Button></Link>
            <Button variant="secondary" onClick={handleExport}>
              <Download className="h-4 w-4" /> {common("export")}
            </Button>
            <Button onClick={handleOpenAdd}>
              <Plus className="h-4 w-4" /> {t("newEmployee")}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-5">
            <Icon className="mb-4 h-5 w-5 text-brand-600" />
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-navy-950 dark:text-white">{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 p-5 font-black dark:border-slate-800">
            {t("directory")}
          </div>
          <DataToolbar
            query={queryState}
            onQueryChange={handleQueryChange}
            placeholder={t("search")}
            resultCount={employees.length}
            resultLabel={filtersT("results")}
            resetLabel={filtersT("reset")}
            onReset={() => {
              setQueryState("");
              handleRoleFilterChange("all");
              handleStatusFilterChange("all");
              setCredentialFilter("all");
              setLockedFilter("all");
              setActiveSessionFilter("all");
            }}
            filters={[
              {
                id: "role",
                label: t("role"),
                value: roleFilter,
                onChange: handleRoleFilterChange,
                options: [
                  { value: "all", label: filtersT("allRoles") },
                  ...roles.map((item) => ({ value: item, label: item })),
                ],
              },
              {
                id: "status",
                label: t("status"),
                value: statusFilter,
                onChange: handleStatusFilterChange,
                options: [
                  { value: "all", label: filtersT("allStatuses") },
                  { value: "present", label: t("present") },
                  { value: "leave", label: t("leave") },
                  { value: "inactive", label: locale === "ar" ? "غير نشط" : "Inactive" },
                ],
              },
              {
                id: "credentialState",
                label: locale === "ar" ? "حالة PIN" : "Credential",
                value: credentialFilter,
                onChange: (value) => {
                  setCredentialFilter(value);
                  setPage(1);
                  setQuery((prev) => ({ ...prev, filters: { ...prev.filters, credentialState: value } }));
                },
                options: [
                  { value: "all", label: common("all") },
                  { value: "not_configured", label: locale === "ar" ? "غير مهيأ" : "Not configured" },
                  { value: "active", label: locale === "ar" ? "نشط" : "Active" },
                  { value: "reset_required", label: locale === "ar" ? "يلزم إعادة ضبط" : "Reset required" },
                  { value: "locked", label: locale === "ar" ? "مقفل" : "Locked" },
                ],
              },
              {
                id: "locked",
                label: locale === "ar" ? "القفل" : "Locked",
                value: lockedFilter,
                onChange: (value) => {
                  setLockedFilter(value);
                  setPage(1);
                  setQuery((prev) => ({ ...prev, filters: { ...prev.filters, locked: value } }));
                },
                options: [
                  { value: "all", label: common("all") },
                  { value: "true", label: locale === "ar" ? "مقفل" : "Locked" },
                  { value: "false", label: locale === "ar" ? "غير مقفل" : "Unlocked" },
                ],
              },
              {
                id: "activeOperatorSession",
                label: locale === "ar" ? "جلسة نشطة" : "Active session",
                value: activeSessionFilter,
                onChange: (value) => {
                  setActiveSessionFilter(value);
                  setPage(1);
                  setQuery((prev) => ({ ...prev, filters: { ...prev.filters, activeOperatorSession: value } }));
                },
                options: [
                  { value: "all", label: common("all") },
                  { value: "true", label: locale === "ar" ? "نعم" : "Yes" },
                  { value: "false", label: locale === "ar" ? "لا" : "No" },
                ],
              },
            ]}
          />
          {employees.length ? (
            <div className="overflow-x-auto">
              <div className="min-w-[1050px] divide-y divide-slate-100 dark:divide-slate-800">
                {employees.map((person) => (
                  <div
                    key={person.id}
                    className="grid grid-cols-[60px_1.3fr_.9fr_1fr_1fr_1fr_1fr_1.2fr_1.2fr] items-center gap-4 p-4 text-xs transition hover:bg-slate-50 dark:hover:bg-navy-950/60"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 font-black text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                      {person.name[0]}
                    </span>
                    <div>
                      <Link
                        href={`/employees/${person.id}`}
                        className="font-extrabold text-navy-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                      >
                        {person.name}
                      </Link>
                      <p className="mt-1 text-[10px] text-slate-400">{person.id}</p>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">{person.employeeCode || "—"}</span>
                    <span className="text-slate-500">{person.role}</span>
                    <span className="text-slate-500">{person.branch}</span>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      {credentialStateLabel(person.authorizationSummary?.credentialState)}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {locale === "ar" ? "فروع" : "Branches"} {person.authorizationSummary?.branchAccessCount ?? 0}
                      {" · "}
                      {locale === "ar" ? "أدوار" : "Roles"} {person.authorizationSummary?.roleTemplateCount ?? 0}
                      {" · "}
                      {locale === "ar" ? "جلسات" : "Sessions"} {person.authorizationSummary?.activeOperatorSessionCount ?? 0}
                    </span>
                    <div>{statusBadge(person.status)}</div>
                    <div className="flex justify-end gap-1">
                      <Link href={`/employees/${person.id}`}>
                        <Button variant="ghost" size="sm" title={common("view")}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(person)}
                        title={common("edit")}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      {person.status !== "inactive" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          onClick={() => handleOpenDeactivate(person)}
                          title={locale === "ar" ? "تعطيل" : "Deactivate"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                          onClick={() => handleReactivate(person)}
                          title={locale === "ar" ? "تفعيل" : "Reactivate"}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState title={common("noResults")} description={common("noResultsDescription")} />
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 text-xs dark:border-slate-800">
            <span className="font-bold text-slate-500">
              {locale === "ar" ? "الصفحة" : "Page"} {page} / {Math.max(totalPages || 1, 1)} · {total} {filtersT("results")}
            </span>
            <div className="flex items-center gap-2">
              <NativeSelect value={String(pageSize)} onChange={(event) => { const next = Number(event.target.value); setPageSize(next); setPage(1); setQuery((prev) => ({ ...prev, page: 1, pageSize: next })); }}>
                {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
              </NativeSelect>
              <Button variant="secondary" disabled={page <= 1} onClick={() => { const next = Math.max(1, page - 1); setPage(next); setQuery((prev) => ({ ...prev, page: next })); }}>{locale === "ar" ? "السابق" : "Previous"}</Button>
              <Button variant="secondary" disabled={page >= Math.max(totalPages || 1, 1)} onClick={() => { const next = page + 1; setPage(next); setQuery((prev) => ({ ...prev, page: next })); }}>{locale === "ar" ? "التالي" : "Next"}</Button>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-black text-navy-950 dark:text-white">
            <ShieldCheck className="h-5 w-5 text-brand-600" />
            {t("rolesPermissions")}
          </h2>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-slate-200 p-4 text-xs leading-6 dark:border-slate-800">
              <p className="font-extrabold">{locale === "ar" ? "تفويض الموظفين" : "Employee operational authorization"}</p>
              <p className="mt-2 text-slate-500">
                {locale === "ar"
                  ? "تدار الأدوار، المنح، المنع، الفروع و PIN من ملف الموظف. حسابات النظام منفصلة عن هوية الموظف التشغيلية."
                  : "Roles, grants, denials, branches and PIN credentials are managed from the employee profile. System Accounts remain separate technical login identities."}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Add / Edit Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={isEdit ? (locale === "ar" ? "تعديل بيانات الموظف" : "Edit Employee Details") : t("addTitle")}
      >
        <form onSubmit={handleSave} className="grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="label-base">{t("name")}</span>
            <input
              required
              className="input-base"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </label>
          <label>
            <span className="label-base">{locale === "ar" ? "كود الموظف" : "Employee Code"}</span>
            <input
              required
              className="input-base font-mono"
              value={form.employeeCode}
              onChange={(event) => setForm((prev) => ({ ...prev, employeeCode: event.target.value }))}
              placeholder="EMP-001"
            />
          </label>
          <label>
            <span className="label-base">{t("role")}</span>
            <input
              required
              className="input-base"
              value={form.role}
              onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
            />
          </label>
          {!isEdit && (
            <>
              <label>
                <span className="label-base">{locale === "ar" ? "PIN الموظف" : "Employee PIN"}</span>
                <input
                  required
                  className="input-base font-mono"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  autoComplete="new-password"
                  value={form.pin}
                  onChange={(event) => setForm((prev) => ({ ...prev, pin: event.target.value.replace(/\D/g, "").slice(0, 6) }))}
                  placeholder={locale === "ar" ? "6 أرقام" : "6 digits"}
                />
              </label>
              <label>
                <span className="label-base">{locale === "ar" ? "تأكيد PIN الموظف" : "Confirm Employee PIN"}</span>
                <input
                  required
                  className="input-base font-mono"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  autoComplete="new-password"
                  value={form.pinConfirm}
                  onChange={(event) => setForm((prev) => ({ ...prev, pinConfirm: event.target.value.replace(/\D/g, "").slice(0, 6) }))}
                  placeholder={locale === "ar" ? "أعد إدخال 6 أرقام" : "Repeat 6 digits"}
                />
              </label>
              <p className="sm:col-span-2 text-[11px] text-slate-500">
                {locale === "ar"
                  ? "يتم حفظ PIN كهاش آمن فقط ولا يظهر بعد إنشاء الموظف."
                  : "The PIN is stored as a secure hash only and is not shown after employee creation."}
              </p>
            </>
          )}
          <label>
            <span className="label-base">{t("branch")}</span>
            <input
              required
              className="input-base"
              value={form.branch}
              onChange={(event) => setForm((prev) => ({ ...prev, branch: event.target.value }))}
            />
          </label>
          <label>
            <span className="label-base">{locale === "ar" ? "الدور الأمني" : "Security Role"}</span>
            <NativeSelect
              value={form.systemRole}
              onChange={(event) => setForm((prev) => ({ ...prev, systemRole: event.target.value as DarfusRole }))}
            >
              <option value="sales">{locale === "ar" ? "مبيعات" : "Sales"}</option>
              <option value="accountant">{locale === "ar" ? "محاسب" : "Accountant"}</option>
              <option value="manager">{locale === "ar" ? "مدير" : "Manager"}</option>
              <option value="admin">{locale === "ar" ? "مسؤول النظام" : "Admin"}</option>
              <option value="owner">{locale === "ar" ? "المالك" : "Owner"}</option>
            </NativeSelect>
          </label>
          <label>
            <span className="label-base">{locale === "ar" ? "المسمى الوظيفي" : "Job Title"}</span>
            <input
              className="input-base"
              value={form.jobTitle}
              onChange={(event) => setForm((prev) => ({ ...prev, jobTitle: event.target.value }))}
            />
          </label>
          <label>
            <span className="label-base">{common("email")}</span>
            <input
              type="email"
              className="input-base"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </label>
          <label>
            <span className="label-base">{t("phone")}</span>
            <input
              className="input-base"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="label-base">{locale === "ar" ? "ملاحظات" : "Notes"}</span>
            <textarea
              className="input-base"
              rows={2}
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              {common("cancel")}
            </Button>
            <Button type="submit">{t("save")}</Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Reason Modal */}
      <Modal
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        title={locale === "ar" ? "تعطيل الموظف" : "Deactivate Employee"}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            {locale === "ar"
              ? `هل أنت متأكد من تعطيل الموظف "${selectedEmp?.name}"؟ سيتم استبعاده من قوائم المبيعات والاعتمادات النشطة.`
              : `Are you sure you want to deactivate employee "${selectedEmp?.name}"? They will be excluded from cashier, approver, and assignee selectors.`}
          </p>
          <label className="block">
            <span className="label-base">{locale === "ar" ? "سبب التعطيل" : "Deactivation Reason"}</span>
            <input
              required
              placeholder={locale === "ar" ? "أدخل سبب التعطيل..." : "Enter reason for deactivation..."}
              className="input-base"
              value={deactivateReason}
              onChange={(event) => setDeactivateReason(event.target.value)}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeactivateOpen(false)}>
              {common("cancel")}
            </Button>
            <Button
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={handleConfirmDeactivate}
              disabled={!deactivateReason.trim()}
            >
              {locale === "ar" ? "تأكيد التعطيل" : "Confirm Deactivate"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
