"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, KeyRound, LockKeyhole, Power, RotateCcw, ShieldCheck, UserPlus } from "lucide-react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useUserManagement } from "@/hooks/use-user-management";
import { usePermissions } from "@/hooks/use-permissions";
import { permissionLabel, permissionModuleLabel } from "@/lib/permissions/catalog";

function errorMessage(error: unknown, rtl: boolean) {
  if (error instanceof Error && error.message) return error.message;
  return rtl ? "تعذر تنفيذ الإجراء المتوقع. راجع البيانات وحاول مرة أخرى." : "The requested action could not be completed. Check the form and try again.";
}

export default function UsersManagementPage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const { hasPermission } = usePermissions();
  const { users, systemAccounts, roles, permissions, branches, employees, readiness, isLoading, createBranchAccount, updateSystemAccount, systemAccountAction, updateRolePermissions, isSaving } = useUserManagement();
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [form, setForm] = useState({
    email: "",
    temporaryPassword: "",
    branchId: "",
    active: true,
    reason: "",
  });
  const [oneTimePassword, setOneTimePassword] = useState<string | null>(null);

  const canViewSystemAccounts = hasPermission("system_accounts.view") || hasPermission("users.view");
  const canManageSystemAccounts = hasPermission("system_accounts.manage");
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
    if (!canManageSystemAccounts) return toast.error(rtl ? "لا تملك صلاحية إدارة حسابات النظام" : "You do not have permission to manage System Accounts");
    try {
      const result: any = await createBranchAccount({
        branchId: form.branchId,
        email: form.email,
        temporaryPassword: form.temporaryPassword || undefined,
        active: form.active,
        reason: form.reason || "System Accounts UI create",
      });
      const temp = result?.data?.temporaryPassword;
      if (temp) setOneTimePassword(temp);
      setForm({ email: "", temporaryPassword: "", branchId: "", active: true, reason: "" });
      toast.success(rtl ? "تم إنشاء حساب الفرع" : "Branch Account created");
    } catch (error) {
      toast.error(errorMessage(error, rtl));
    }
  };

  const loadRole = (roleId: string) => {
    setSelectedRoleId(roleId);
    const role = roles.find((item) => item.id === roleId);
    setSelectedPermissions((role?.permissions ?? []).map((permission) => permission.name));
  };

  const saveRolePermissions = async () => {
    if (!selectedRoleId || !canManageRoles) return;
    try {
      await updateRolePermissions({ roleId: selectedRoleId, permissions: selectedPermissions });
      toast.success(rtl ? "تم تحديث صلاحيات الدور" : "Role permissions updated");
    } catch (error) {
      toast.error(errorMessage(error, rtl));
    }
  };

  const doAccountAction = async (id: string, action: string) => {
    const reason = window.prompt(rtl ? "سبب الإجراء" : "Action reason", "UI system account action") || "UI system account action";
    try {
      await systemAccountAction({ id, action, body: { reason } });
      toast.success(rtl ? "تم تنفيذ الإجراء" : "Action completed");
    } catch (error) {
      toast.error(errorMessage(error, rtl));
    }
  };

  const changeAccountEmail = async (id: string) => {
    const email = window.prompt(rtl ? "البريد الإلكتروني الجديد" : "New email");
    if (!email) return;
    try {
      await systemAccountAction({ id, action: "change-email", body: { email, reason: "UI email change" } });
      toast.success(rtl ? "تم تغيير البريد" : "Email changed");
    } catch (error) {
      toast.error(errorMessage(error, rtl));
    }
  };

  const patchAccount = async (id: string, body: Record<string, unknown>) => {
    try {
      await updateSystemAccount({ id, body });
      toast.success(rtl ? "تم تحديث الحساب" : "Account updated");
    } catch (error) {
      toast.error(errorMessage(error, rtl));
    }
  };

  const accounts = systemAccounts.length ? systemAccounts : users;
  const superAdmins = accounts.filter((user) => user.accountType === "super_admin");
  const branchShells = accounts.filter((user) => user.accountType === "branch_shell");
  const legacyAccounts = accounts.filter((user) => !user.accountType || user.accountType === "legacy");

  if (!canViewSystemAccounts && !hasPermission("roles.manage")) {
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
          onChangeEmail={changeAccountEmail}
          onPatch={patchAccount}
        />
        <AccountSection
          title={rtl ? "حسابات الفروع" : "Branch Accounts"}
          empty={rtl ? "لا توجد حسابات فروع." : "No Branch Accounts."}
          accounts={branchShells}
          rtl={rtl}
          onAction={doAccountAction}
          onChangeEmail={changeAccountEmail}
          onPatch={patchAccount}
        />
        <AccountSection
          title={rtl ? "الحسابات القديمة" : "Legacy Accounts"}
          empty={rtl ? "لا توجد حسابات قديمة." : "No legacy accounts."}
          accounts={legacyAccounts}
          rtl={rtl}
          onAction={doAccountAction}
          onChangeEmail={changeAccountEmail}
          onPatch={patchAccount}
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
          <SecurityBadge label={rtl ? "جاهزية المدير العام" : "Super Admin readiness"} value={`${readiness?.superAdminsWithRecovery ?? 0}/${readiness?.superAdmins ?? 0}`} warning={!readiness?.superAdminsWithRecovery} />
          <SecurityBadge label={rtl ? "حسابات الفروع" : "Branch Accounts"} value={String(readiness?.branchShells ?? branchShells.length)} />
          <SecurityBadge label={rtl ? "موظفو الإدارة المؤهلون" : "Eligible Admin Employees"} value={String(readiness?.eligibleAdminEmployees ?? employees.length)} />
        </div>
      </Card>

      {oneTimePassword && (
        <Card className="border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
          <h2 className="font-black">{rtl ? "كلمة مرور مؤقتة تظهر مرة واحدة" : "One-time temporary password"}</h2>
          <p className="mt-2 font-mono text-lg">{oneTimePassword}</p>
          <Button className="mt-3" type="button" onClick={() => setOneTimePassword(null)}>{rtl ? "إخفاء ومسح من الشاشة" : "Hide and clear from screen"}</Button>
        </Card>
      )}

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-brand-600" />
            <h2 className="font-black text-navy-950 dark:text-white">{rtl ? "حساب الفرع" : "Branch Account"}</h2>
          </div>
          <form onSubmit={submitUser} className="space-y-3">
            <select className="input-base" value={form.branchId} onChange={(e) => setForm((c) => ({ ...c, branchId: e.target.value }))} required>
              <option value="">{rtl ? "الفرع المرتبط" : "Assigned Branch"}</option>
              {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name || branch.code || branch.id}</option>)}
            </select>
            <input className="input-base" type="email" placeholder={rtl ? "إيميل دخول الفرع" : "Branch Login Email"} value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} required />
            <input className="input-base" type="password" placeholder={rtl ? "كلمة مرور مؤقتة" : "Temporary Password"} value={form.temporaryPassword} onChange={(e) => setForm((c) => ({ ...c, temporaryPassword: e.target.value }))} />
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm((c) => ({ ...c, active: e.target.checked }))} />
              {rtl ? "نشط" : "Active"}
            </label>
            <input className="input-base" placeholder={rtl ? "سبب الإنشاء" : "Creation reason"} value={form.reason} onChange={(e) => setForm((c) => ({ ...c, reason: e.target.value }))} />
            <p className="text-xs text-slate-500">{rtl ? "لا يمكن تغيير فرع هذا الحساب. العمليات تتطلب اختيار موظف." : "This account's branch cannot be changed. Operations require employee selection."}</p>
            <Button type="submit" disabled={isSaving || !canManageSystemAccounts}>
              {rtl ? "إنشاء حساب الفرع" : "Create Branch Account"}
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
  if (type === "branch_shell") return rtl ? "حساب الفرع" : "Branch Account";
  return rtl ? "حساب قديم" : "Legacy";
}

function AccountSection({
  title,
  empty,
  accounts,
  rtl,
  onAction,
  onChangeEmail,
  onPatch,
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
    isActive?: boolean;
  }>;
  rtl: boolean;
  onAction: (id: string, action: string) => Promise<void>;
  onChangeEmail: (id: string) => Promise<void>;
  onPatch: (id: string, body: Record<string, unknown>) => Promise<void>;
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
              <span>{rtl ? "الفرع المرتبط" : "Assigned Branch"}: {account.branchId || (rtl ? "غير محدد" : "Not assigned")}</span>
              <span>{rtl ? "بريد الاسترجاع" : "Recovery email"}: {account.recoveryEmailMasked || (rtl ? "غير مضبوط" : "Not configured")}</span>
              <span>{rtl ? "الحالة" : "Status"}: {account.isActive === false ? (rtl ? "غير نشط" : "Inactive") : account.lockedUntil ? (rtl ? "مقفل" : "Locked") : (rtl ? "نشط" : "Active")}</span>
              <span>{rtl ? "الجلسات" : "Sessions"}: {account.activeSessions || 0}</span>
              <span>{rtl ? "تغيير كلمة المرور الإجباري" : "Force password change"}: {account.forcePasswordChange ? (rtl ? "نعم" : "Yes") : (rtl ? "لا" : "No")}</span>
              {legacy && <span className="text-amber-700">{rtl ? "حساب تقني قديم؛ لا يستخدم كحساب فرع." : "Legacy technical account; not used as a Branch Account."}</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200" title={rtl ? "إعادة تعيين كلمة المرور" : "Reset password"} onClick={() => void onAction(account.id, "reset-password")}><KeyRound className="h-4 w-4" /></button>
              <button className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200" title={rtl ? "فك القفل" : "Unlock"} onClick={() => void onAction(account.id, "unlock")}><LockKeyhole className="h-4 w-4" /></button>
              <button className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200" title={rtl ? "إنهاء الجلسات" : "Revoke sessions"} onClick={() => void onAction(account.id, "revoke-sessions")}><RotateCcw className="h-4 w-4" /></button>
              {account.isActive === false ? (
                <button className="inline-flex h-8 w-8 items-center justify-center rounded border border-emerald-200 text-emerald-700" title={rtl ? "تفعيل" : "Activate"} onClick={() => void onAction(account.id, "activate")}><CheckCircle2 className="h-4 w-4" /></button>
              ) : (
                <button className="inline-flex h-8 w-8 items-center justify-center rounded border border-amber-200 text-amber-700" title={rtl ? "إيقاف" : "Deactivate"} onClick={() => void onAction(account.id, "deactivate")}><Power className="h-4 w-4" /></button>
              )}
              <button className="rounded border border-slate-200 px-2 py-1 text-[10px] font-bold" title={rtl ? "تغيير البريد" : "Change email"} onClick={() => void onChangeEmail(account.id)}>{rtl ? "البريد" : "Email"}</button>
              <button className="rounded border border-slate-200 px-2 py-1 text-[10px] font-bold" title={rtl ? "تحديث بريد الاسترجاع" : "Update recovery email"} onClick={() => {
                const recoveryEmail = window.prompt(rtl ? "بريد الاسترجاع الجديد" : "New recovery email");
                if (recoveryEmail !== null) void onPatch(account.id, { recoveryEmail });
              }}>{rtl ? "استرجاع" : "Recovery"}</button>
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
