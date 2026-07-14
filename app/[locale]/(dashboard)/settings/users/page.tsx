"use client";

import { FormEvent, useMemo, useState } from "react";
import { KeyRound, LockKeyhole, RotateCcw, ShieldCheck, UserPlus } from "lucide-react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useUserManagement } from "@/hooks/use-user-management";
import { usePermissions } from "@/hooks/use-permissions";
import { permissionLabel, permissionMeta, permissionModuleLabel } from "@/lib/permissions/catalog";

export default function UsersManagementPage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const { hasPermission } = usePermissions();
  const { users, systemAccounts, roles, permissions, isLoading, createUser, systemAccountAction, updateRolePermissions, isSaving } = useUserManagement();
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    jobTitle: "",
    roleId: "",
  });

  const canManageUsers = hasPermission("users.create") || hasPermission("users.manage");
  const canManageRoles = hasPermission("roles.manage");
  const selectedRole = roles.find((role) => role.id === selectedRoleId);
  const uiLocale = rtl ? "ar" : "en";

  const permissionsByModule = useMemo(() => {
    return permissions.reduce<Record<string, typeof permissions>>((acc, permission) => {
      acc[permission.module] = acc[permission.module] ?? [];
      acc[permission.module].push(permission);
      return acc;
    }, {});
  }, [permissions]);

  const submitUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!canManageUsers) return toast.error(rtl ? "لا تملك صلاحية إنشاء مستخدمين" : "You do not have permission to create users");
    await createUser({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
      phone: form.phone,
      jobTitle: form.jobTitle,
      roleIds: form.roleId ? [form.roleId] : [],
    });
    setForm({ firstName: "", lastName: "", email: "", password: "", phone: "", jobTitle: "", roleId: "" });
    toast.success(rtl ? "تم إنشاء المستخدم" : "User created");
  };

  const loadRole = (roleId: string) => {
    setSelectedRoleId(roleId);
    const role = roles.find((item) => item.id === roleId);
    setSelectedPermissions((role?.permissions ?? []).map((permission) => permission.name));
  };

  const saveRolePermissions = async () => {
    if (!selectedRoleId || !canManageRoles) return;
    await updateRolePermissions({ roleId: selectedRoleId, permissions: selectedPermissions });
    toast.success(rtl ? "تم تحديث صلاحيات الدور" : "Role permissions updated");
  };

  const doAccountAction = async (id: string, action: string) => {
    await systemAccountAction({ id, action, body: { reason: "UI system account action" } });
    toast.success(rtl ? "تم تنفيذ الإجراء" : "Action completed");
  };

  const accounts = systemAccounts.length ? systemAccounts : users;
  const superAdmins = accounts.filter((user) => user.accountType === "super_admin");
  const branchShells = accounts.filter((user) => user.accountType === "branch_shell");
  const legacyAccounts = accounts.filter((user) => !user.accountType || user.accountType === "legacy");

  if (!hasPermission("users.view") && !hasPermission("roles.manage")) {
    return (
      <div className="space-y-6">
        <PageHeader title={rtl ? "حسابات النظام" : "System Accounts"} description={rtl ? "ليست لديك صلاحية الوصول لهذه الصفحة." : "You do not have permission to access this page."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={rtl ? "حسابات النظام" : "System Accounts"}
        description={rtl
          ? "إدارة حسابات الدخول التقنية وأدوار النظام. صلاحيات الموظفين التشغيلية تدار من ملفات الموظفين ولا يوجد ربط مفترض بين الحساب والموظف."
          : "Manage technical login accounts and system roles. Employee operational identity and permissions are managed from Employee profiles; no User-to-Employee link is implied."}
      />

      <Card className="p-5 text-sm leading-7">
        <h2 className="font-black text-navy-950 dark:text-white">{rtl ? "فصل الهوية التقنية عن المشغل" : "Technical account vs operational employee"}</h2>
        <p className="mt-2 text-slate-500">
          {rtl
            ? "حساب النظام يستخدم لتسجيل الدخول وإدارة الأدوار التقنية. كود الموظف و PIN وصلاحيات التشغيل اليومية تدار فقط من شاشة الموظفين."
            : "A System Account is used for authentication and technical administration. Employee Code, PIN, branch access, grants, denials and effective operational permissions are managed only from Employees."}
        </p>
      </Card>

      <div className="grid gap-5 xl:grid-cols-3">
        <AccountSection
          title={rtl ? "حسابات المدير العام" : "Super Admin Accounts"}
          empty={rtl ? "لا توجد حسابات مدير عام مفعلة بعد." : "No Super Admin accounts yet."}
          accounts={superAdmins}
          rtl={rtl}
          onAction={doAccountAction}
        />
        <AccountSection
          title={rtl ? "حسابات الفرع الثابتة" : "Branch Shell Accounts"}
          empty={rtl ? "لا توجد حسابات فرع ثابتة." : "No Branch Shell accounts."}
          accounts={branchShells}
          rtl={rtl}
          onAction={doAccountAction}
        />
        <AccountSection
          title={rtl ? "الحسابات القديمة" : "Legacy Accounts"}
          empty={rtl ? "لا توجد حسابات قديمة." : "No legacy accounts."}
          accounts={legacyAccounts}
          rtl={rtl}
          onAction={doAccountAction}
          legacy
        />
      </div>

      <Card className="p-5">
        <h2 className="font-black text-navy-950 dark:text-white">{rtl ? "الأمان والاسترجاع" : "Security & Recovery"}</h2>
        <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <SecurityBadge label={rtl ? "تسليم الاسترجاع المحلي" : "Local recovery delivery"} value={rtl ? "متاح للتطوير فقط" : "Development only"} />
          <SecurityBadge label={rtl ? "البريد الإنتاجي" : "Production email"} value={rtl ? "غير جاهز" : "Unavailable"} warning />
          <SecurityBadge label={rtl ? "تغيير كلمة المرور الإجباري" : "Forced password change"} value={String(accounts.filter((user) => user.forcePasswordChange).length)} />
          <SecurityBadge label={rtl ? "الجلسات النشطة" : "Active sessions"} value={String(accounts.reduce((sum, user) => sum + Number(user.activeSessions || 0), 0))} />
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-brand-600" />
            <h2 className="font-black text-navy-950 dark:text-white">{rtl ? "حساب نظام جديد" : "New System Account"}</h2>
          </div>
          <form onSubmit={submitUser} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input-base" placeholder={rtl ? "الاسم الأول" : "First name"} value={form.firstName} onChange={(e) => setForm((c) => ({ ...c, firstName: e.target.value }))} required />
              <input className="input-base" placeholder={rtl ? "اسم العائلة" : "Last name"} value={form.lastName} onChange={(e) => setForm((c) => ({ ...c, lastName: e.target.value }))} required />
            </div>
            <input className="input-base" type="email" placeholder={rtl ? "البريد الإلكتروني" : "Email"} value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} required />
            <input className="input-base" type="password" placeholder={rtl ? "كلمة المرور" : "Password"} value={form.password} onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))} required />
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input-base" placeholder={rtl ? "الهاتف" : "Phone"} value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} />
              <input className="input-base" placeholder={rtl ? "المسمى الوظيفي" : "Job title"} value={form.jobTitle} onChange={(e) => setForm((c) => ({ ...c, jobTitle: e.target.value }))} />
            </div>
            <select className="input-base" value={form.roleId} onChange={(e) => setForm((c) => ({ ...c, roleId: e.target.value }))}>
              <option value="">{rtl ? "اختر الدور" : "Select role"}</option>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
            <Button type="submit" disabled={isSaving || !canManageUsers}>
              {rtl ? "إنشاء المستخدم" : "Create User"}
            </Button>
          </form>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
              <h2 className="font-black text-navy-950 dark:text-white">{rtl ? "كل الحسابات التقنية" : "All Technical Accounts"}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500 dark:bg-navy-950">
                <tr>
                  <th className="px-4 py-3 text-start">{rtl ? "الاسم" : "Name"}</th>
                  <th className="px-4 py-3 text-start">{rtl ? "البريد" : "Email"}</th>
                  <th className="px-4 py-3 text-start">{rtl ? "الأدوار" : "Roles"}</th>
                  <th className="px-4 py-3 text-start">{rtl ? "النوع" : "Type"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr><td colSpan={4} className="p-5 text-center text-slate-400">{rtl ? "جار التحميل..." : "Loading..."}</td></tr>
                ) : users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 font-bold">{user.firstName} {user.lastName}</td>
                    <td className="px-4 py-3 text-slate-500">{user.email}</td>
                    <td className="px-4 py-3">{(user.roles ?? []).map((role) => role.name).join(", ") || user.role}</td>
                    <td className="px-4 py-3">{accountTypeLabel(user.accountType || "legacy", rtl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand-600" />
          <h2 className="font-black text-navy-950 dark:text-white">{rtl ? "أدوار وصلاحيات النظام التقنية" : "Technical Roles and System Permissions"}</h2>
        </div>
        <p className="mb-4 text-xs leading-6 text-slate-500">
          {rtl
            ? "هذه الصلاحيات تخص حسابات الدخول التقنية ولا تمثل صلاحيات الموظف التشغيلية أو التفويض الفعلي داخل جلسة المشغل."
            : "These permissions apply to technical login accounts. They are separate from Employee operational permissions and effective operator authority."}
        </p>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select className="input-base max-w-xs" value={selectedRoleId} onChange={(e) => loadRole(e.target.value)}>
            <option value="">{rtl ? "اختر دورًا" : "Select a role"}</option>
            {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
          </select>
          <Button onClick={saveRolePermissions} disabled={!selectedRole || !canManageRoles || isSaving}>
            {rtl ? "حفظ الصلاحيات" : "Save Permissions"}
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
            <div key={module} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <h3 className="mb-3 text-sm font-black uppercase text-slate-500">{permissionModuleLabel(module, uiLocale)}</h3>
              <div className="space-y-2">
                {modulePermissions.map((permission) => (
                  <label key={permission.name} className="flex items-center gap-2 text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission.name)}
                      disabled={!selectedRole || !canManageRoles}
                      onChange={(e) => {
                        setSelectedPermissions((current) =>
                          e.target.checked ? [...current, permission.name] : current.filter((name) => name !== permission.name),
                        );
                      }}
                    />
                    <span>
                      {permissionLabel(permission.name, uiLocale)}
                      {permissionMeta(permission.name).sensitivity === "level_2" && <span className="ms-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800">{rtl ? "يتطلب المستوى 2" : "Requires Level 2"}</span>}
                      <details className="inline">
                        <summary className="ms-2 inline cursor-pointer text-slate-400">{rtl ? "تفاصيل" : "Details"}</summary>
                        <span className="ms-2 font-mono font-normal text-slate-400">{permission.name}</span>
                      </details>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function accountTypeLabel(type: string, rtl: boolean) {
  if (type === "super_admin") return rtl ? "مدير عام" : "Super Admin";
  if (type === "branch_shell") return rtl ? "حساب فرع ثابت" : "Branch Shell";
  return rtl ? "حساب قديم" : "Legacy";
}

function AccountSection({
  title,
  empty,
  accounts,
  rtl,
  onAction,
  legacy = false,
}: {
  title: string;
  empty: string;
  accounts: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    accountType?: string;
    branchId?: string | null;
    recoveryEmailMasked?: string | null;
    lockedUntil?: string | null;
    lastLoginAt?: string | null;
    activeSessions?: number;
    forcePasswordChange?: boolean;
  }>;
  rtl: boolean;
  onAction: (id: string, action: string) => Promise<void>;
  legacy?: boolean;
}) {
  return (
    <Card className="p-5">
      <h2 className="font-black text-navy-950 dark:text-white">{title}</h2>
      <div className="mt-4 space-y-3">
        {accounts.length ? accounts.map((account) => (
          <div key={account.id} className="rounded border border-slate-200 p-3 text-xs dark:border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-navy-950 dark:text-white">{account.firstName} {account.lastName}</p>
                <p className="text-slate-500">{account.email}</p>
              </div>
              <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800">{accountTypeLabel(account.accountType || "legacy", rtl)}</span>
            </div>
            <div className="mt-3 grid gap-2 text-slate-500">
              <span>{rtl ? "الفرع" : "Branch"}: {account.branchId || (rtl ? "غير محدد" : "Not assigned")}</span>
              <span>{rtl ? "بريد الاسترجاع" : "Recovery email"}: {account.recoveryEmailMasked || (rtl ? "غير مضبوط" : "Not configured")}</span>
              <span>{rtl ? "الحالة" : "Status"}: {account.lockedUntil ? (rtl ? "مقفل" : "Locked") : (rtl ? "نشط" : "Active")}</span>
              <span>{rtl ? "الجلسات" : "Sessions"}: {account.activeSessions || 0}</span>
              {legacy && <span className="text-amber-700">{rtl ? "التحويل يدوي فقط ولا توجد مطابقة تلقائية." : "Manual conversion only. No heuristic mapping."}</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200" title={rtl ? "إعادة تعيين كلمة المرور" : "Reset password"} onClick={() => void onAction(account.id, "reset-password")}><KeyRound className="h-4 w-4" /></button>
              <button className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200" title={rtl ? "فك القفل" : "Unlock"} onClick={() => void onAction(account.id, "unlock")}><LockKeyhole className="h-4 w-4" /></button>
              <button className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200" title={rtl ? "إنهاء الجلسات" : "Revoke sessions"} onClick={() => void onAction(account.id, "revoke-sessions")}><RotateCcw className="h-4 w-4" /></button>
            </div>
          </div>
        )) : <p className="rounded bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-900">{empty}</p>}
      </div>
    </Card>
  );
}

function SecurityBadge({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return (
    <div className={`rounded border p-3 ${warning ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-600"} dark:border-slate-800 dark:bg-slate-900`}>
      <p className="text-[10px] font-bold uppercase">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}
