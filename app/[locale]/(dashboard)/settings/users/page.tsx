"use client";

import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { CheckCircle2, KeyRound, LockKeyhole, Mail, Power, RotateCcw, Save, UserPlus } from "lucide-react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useUserManagement } from "@/hooks/use-user-management";
import type { ManagedUser } from "@/hooks/use-user-management";
import { usePermissions } from "@/hooks/use-permissions";
import { apiClient } from "@/lib/api/client";
import { useRouter } from "@/i18n/navigation";

function errorMessage(error: unknown, rtl: boolean) {
  if (error instanceof Error && error.message) return error.message;
  return rtl ? "تعذر تنفيذ الإجراء المتوقع. راجع البيانات وحاول مرة أخرى." : "The requested action could not be completed. Check the form and try again.";
}

function accountTypeLabel(type: string, rtl: boolean) {
  if (type === "super_admin") return rtl ? "مدير عام" : "Super Admin";
  if (type === "branch_shell") return rtl ? "حساب الفرع" : "Branch Account";
  return rtl ? "حساب تقني آخر" : "Other Technical Account";
}

function statusLabel(account: ManagedUser, rtl: boolean) {
  if (account.isActive === false) return rtl ? "غير نشط" : "Inactive";
  if (account.lockedUntil) return rtl ? "مقفل" : "Locked";
  return rtl ? "نشط" : "Active";
}

export default function UsersManagementPage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const router = useRouter();
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const { systemAccounts, branches, readiness, isLoading, createBranchAccount, updateSystemAccount, systemAccountAction, isSaving } = useUserManagement();
  const [createForm, setCreateForm] = useState({ email: "", password: "", branchId: "", active: true, reason: "" });
  const [selfEmail, setSelfEmail] = useState("");
  const [selfEmailPassword, setSelfEmailPassword] = useState("");
  const [selfPassword, setSelfPassword] = useState({ currentPassword: "", newPassword: "", confirmation: "" });
  const [editId, setEditId] = useState("");
  const [editForm, setEditForm] = useState({ email: "", branchId: "", password: "", reason: "" });

  const canViewSystemAccounts = hasPermission("system_accounts.view") || hasPermission("users.view");
  const canManageSystemAccounts = hasPermission("system_accounts.manage");
  const accounts = systemAccounts;
  const currentAccount = accounts.find((account) => account.id === user?.id);
  const superAdmins = accounts.filter((account) => account.accountType === "super_admin");
  const branchAccounts = accounts.filter((account) => account.accountType === "branch_shell");
  const otherAccounts = accounts.filter((account) => !account.accountType || account.accountType === "legacy");
  const selectedAccount = accounts.find((account) => account.id === editId) || null;

  const activeSessionCount = useMemo(() => accounts.reduce((sum, account) => sum + Number(account.activeSessions || 0), 0), [accounts]);

  const startEdit = (account: ManagedUser) => {
    setEditId(account.id);
    setEditForm({
      email: account.email || "",
      branchId: account.branchId || "",
      password: "",
      reason: "HF6C account center update",
    });
  };

  const submitBranchAccount = async (event: FormEvent) => {
    event.preventDefault();
    if (!canManageSystemAccounts) return toast.error(rtl ? "لا تملك صلاحية إدارة حسابات النظام" : "You do not have permission to manage System Accounts");
    try {
      await createBranchAccount({
        branchId: createForm.branchId,
        email: createForm.email,
        password: createForm.password,
        active: createForm.active,
        reason: createForm.reason || "HF6C Branch Account create",
      });
      setCreateForm({ email: "", password: "", branchId: "", active: true, reason: "" });
      toast.success(rtl ? "تم إنشاء حساب الفرع" : "Branch Account created");
    } catch (error) {
      toast.error(errorMessage(error, rtl));
    }
  };

  const submitSelfEmail = async (event: FormEvent) => {
    event.preventDefault();
    if (!user?.id) return;
    try {
      await systemAccountAction({
        id: user.id,
        action: "change-email",
        body: { email: selfEmail, currentPassword: selfEmailPassword, reason: "HF6C self email change" },
      });
      toast.success(rtl ? "تم تغيير البريد. سجل الدخول من جديد." : "Email changed. Please log in again.");
      logout();
      router.replace("/login");
    } catch (error) {
      toast.error(errorMessage(error, rtl));
    }
  };

  const submitSelfPassword = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await apiClient("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(selfPassword),
        skipBranch: true,
      });
      toast.success(rtl ? "تم تغيير كلمة المرور. سجل الدخول من جديد." : "Password changed. Please log in again.");
      logout();
      router.replace("/login");
    } catch (error) {
      toast.error(errorMessage(error, rtl));
    }
  };

  const saveSelectedAccount = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedAccount) return;
    try {
      if (editForm.email.trim().toLowerCase() !== selectedAccount.email.trim().toLowerCase()) {
        await systemAccountAction({
          id: selectedAccount.id,
          action: "change-email",
          body: { email: editForm.email, reason: editForm.reason || "HF6C account email edit" },
        });
      }
      if (selectedAccount.accountType === "branch_shell" && editForm.branchId && editForm.branchId !== selectedAccount.branchId) {
        await updateSystemAccount({
          id: selectedAccount.id,
          body: { branchId: editForm.branchId, reason: editForm.reason || "HF6C branch account branch edit" },
        });
      }
      if (editForm.password) {
        await systemAccountAction({
          id: selectedAccount.id,
          action: "reset-password",
          body: { password: editForm.password, reason: editForm.reason || "HF6C account password reset" },
        });
      }
      setEditForm((current) => ({ ...current, password: "" }));
      toast.success(rtl ? "تم تحديث الحساب" : "Account updated");
    } catch (error) {
      toast.error(errorMessage(error, rtl));
    }
  };

  const doAccountAction = async (account: ManagedUser, action: string) => {
    try {
      await systemAccountAction({ id: account.id, action, body: { reason: `HF6C ${action}` } });
      toast.success(rtl ? "تم تنفيذ الإجراء" : "Action completed");
    } catch (error) {
      toast.error(errorMessage(error, rtl));
    }
  };

  if (!canViewSystemAccounts) {
    return (
      <div className="space-y-6">
        <PageHeader title={rtl ? "مركز الحسابات" : "Account Center"} description={rtl ? "ليست لديك صلاحية الوصول لهذه الصفحة." : "You do not have permission to access this page."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={rtl ? "مركز الحسابات" : "Account Center"}
        description={rtl
          ? "إدارة حسابات الدخول التقنية فقط. صلاحيات الموظفين التشغيلية وكود الموظف والرقم السري تدار من ملفات الموظفين."
          : "Manage technical login accounts only. Employee Code, PIN and operational permissions are managed from Employee profiles."}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SecurityBadge label={rtl ? "حسابات المدير العام" : "Super Admins"} value={String(superAdmins.length)} />
        <SecurityBadge label={rtl ? "حسابات الفروع" : "Branch Accounts"} value={String(readiness?.branchShells ?? branchAccounts.length)} />
        <SecurityBadge label={rtl ? "الجلسات النشطة" : "Active Sessions"} value={String(activeSessionCount)} />
        <SecurityBadge label={rtl ? "جاهزية الاسترجاع" : "Recovery Readiness"} value={`${readiness?.superAdminsWithRecovery ?? 0}/${readiness?.superAdmins ?? 0}`} warning={!readiness?.superAdminsWithRecovery} />
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-black text-navy-950 dark:text-white">{rtl ? "أمان المدير العام" : "Super Admin Security"}</h2>
            <p className="mt-1 text-sm text-slate-500">{currentAccount?.email || user?.email || (rtl ? "الحساب الحالي" : "Current account")}</p>
          </div>
          <span className="rounded bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{rtl ? "لا يحتاج كود موظف أو PIN" : "No Employee Code or PIN"}</span>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <form onSubmit={submitSelfEmail} className="space-y-3 rounded border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center gap-2 font-black"><Mail className="h-4 w-4 text-brand-600" />{rtl ? "تغيير البريد" : "Change Email"}</div>
            <input className="input-base" type="email" value={selfEmail} onChange={(event) => setSelfEmail(event.target.value)} placeholder={rtl ? "البريد الجديد" : "New email"} required />
            <input className="input-base" type="password" value={selfEmailPassword} onChange={(event) => setSelfEmailPassword(event.target.value)} placeholder={rtl ? "كلمة المرور الحالية للتأكيد" : "Current password confirmation"} required />
            <Button type="submit" disabled={isSaving}>{rtl ? "تغيير البريد" : "Change email"}</Button>
          </form>
          <form onSubmit={submitSelfPassword} className="space-y-3 rounded border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center gap-2 font-black"><KeyRound className="h-4 w-4 text-brand-600" />{rtl ? "تغيير كلمة المرور" : "Change Password"}</div>
            <input className="input-base" type="password" value={selfPassword.currentPassword} onChange={(event) => setSelfPassword((current) => ({ ...current, currentPassword: event.target.value }))} placeholder={rtl ? "كلمة المرور الحالية" : "Current password"} required />
            <input className="input-base" type="password" value={selfPassword.newPassword} onChange={(event) => setSelfPassword((current) => ({ ...current, newPassword: event.target.value }))} placeholder={rtl ? "كلمة المرور الجديدة" : "New password"} required />
            <input className="input-base" type="password" value={selfPassword.confirmation} onChange={(event) => setSelfPassword((current) => ({ ...current, confirmation: event.target.value }))} placeholder={rtl ? "تأكيد كلمة المرور" : "Confirm password"} required />
            <Button type="submit">{rtl ? "تغيير كلمة المرور" : "Change password"}</Button>
          </form>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-brand-600" />
            <h2 className="font-black text-navy-950 dark:text-white">{rtl ? "إنشاء حساب فرع" : "Create Branch Account"}</h2>
          </div>
          <form onSubmit={submitBranchAccount} className="space-y-3">
            <select className="input-base" value={createForm.branchId} onChange={(event) => setCreateForm((current) => ({ ...current, branchId: event.target.value }))} required>
              <option value="">{rtl ? "الفرع الثابت" : "Fixed Branch"}</option>
              {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name || branch.code || branch.id}</option>)}
            </select>
            <input className="input-base" type="email" placeholder={rtl ? "بريد الدخول" : "Login email"} value={createForm.email} onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))} required />
            <input className="input-base" type="password" placeholder={rtl ? "كلمة المرور الجديدة" : "New password"} value={createForm.password} onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))} required />
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <input type="checkbox" checked={createForm.active} onChange={(event) => setCreateForm((current) => ({ ...current, active: event.target.checked }))} />
              {rtl ? "نشط" : "Active"}
            </label>
            <input className="input-base" placeholder={rtl ? "سبب الإنشاء" : "Creation reason"} value={createForm.reason} onChange={(event) => setCreateForm((current) => ({ ...current, reason: event.target.value }))} />
            <p className="text-xs leading-5 text-slate-500">{rtl ? "حساب الفرع لا يحمل صلاحيات تشغيلية. بعد الدخول يجب اختيار موظف بكود الموظف والرقم السري." : "A Branch Account has no business permissions. After login, an Employee Code and PIN are required for protected work."}</p>
            <Button type="submit" disabled={isSaving || !canManageSystemAccounts}>{rtl ? "إنشاء حساب الفرع" : "Create Branch Account"}</Button>
          </form>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Save className="h-5 w-5 text-brand-600" />
            <h2 className="font-black text-navy-950 dark:text-white">{rtl ? "تعديل حساب تقني" : "Edit Technical Account"}</h2>
          </div>
          {selectedAccount ? (
            <form onSubmit={saveSelectedAccount} className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2 rounded bg-slate-50 p-3 text-xs font-bold text-slate-600 dark:bg-slate-900">
                {accountTypeLabel(selectedAccount.accountType || "legacy", rtl)} · {selectedAccount.id}
              </div>
              <input className="input-base" type="email" value={editForm.email} onChange={(event) => setEditForm((current) => ({ ...current, email: event.target.value }))} placeholder={rtl ? "البريد" : "Email"} />
              <input className="input-base" type="password" value={editForm.password} onChange={(event) => setEditForm((current) => ({ ...current, password: event.target.value }))} placeholder={rtl ? "كلمة مرور جديدة" : "New password"} />
              {selectedAccount.accountType === "branch_shell" && (
                <select className="input-base" value={editForm.branchId} onChange={(event) => setEditForm((current) => ({ ...current, branchId: event.target.value }))} required>
                  <option value="">{rtl ? "الفرع الثابت" : "Fixed Branch"}</option>
                  {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name || branch.code || branch.id}</option>)}
                </select>
              )}
              <input className="input-base" value={editForm.reason} onChange={(event) => setEditForm((current) => ({ ...current, reason: event.target.value }))} placeholder={rtl ? "سبب التعديل" : "Change reason"} />
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <Button type="submit" disabled={isSaving || !canManageSystemAccounts}>{rtl ? "حفظ التعديلات" : "Save changes"}</Button>
                <Button type="button" variant="secondary" onClick={() => setEditId("")}>{rtl ? "إلغاء" : "Cancel"}</Button>
              </div>
              <p className="md:col-span-2 text-xs leading-5 text-slate-500">{rtl ? "لا يتم عرض كلمة المرور القديمة أو استرجاعها. إدخال كلمة مرور جديدة يستبدلها فقط." : "The old password is never displayed or recovered. Entering a new password replaces it only."}</p>
            </form>
          ) : (
            <p className="rounded bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-900">{rtl ? "اختر حسابًا من القائمة لتعديله." : "Select an account from the list to edit it."}</p>
          )}
        </Card>
      </div>

      <AccountSection title={rtl ? "حسابات المدير العام" : "Super Admin Accounts"} accounts={superAdmins} empty={rtl ? "لا توجد حسابات مدير عام." : "No Super Admin accounts."} rtl={rtl} onEdit={startEdit} onAction={doAccountAction} />
      <AccountSection title={rtl ? "حسابات الفروع" : "Branch Accounts"} accounts={branchAccounts} empty={rtl ? "لا توجد حسابات فروع." : "No Branch Accounts."} rtl={rtl} onEdit={startEdit} onAction={doAccountAction} />
      {otherAccounts.length > 0 && <AccountSection title={rtl ? "حسابات تقنية أخرى" : "Other Technical Accounts"} accounts={otherAccounts} empty="" rtl={rtl} onEdit={startEdit} onAction={doAccountAction} />}

      <Card className="border-blue-200 bg-blue-50 p-5 text-sm leading-7 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100">
        <h2 className="font-black">{rtl ? "صلاحيات الموظفين ليست هنا" : "Employee permissions are not managed here"}</h2>
        <p className="mt-1">{rtl ? "الأدوار التشغيلية والصلاحيات المباشرة والمنع المباشر والصلاحيات الفعالة موجودة في شاشة الموظف." : "Operational role templates, direct grants, direct denials and effective permissions remain in the Employee detail page."}</p>
      </Card>
    </div>
  );
}

function AccountSection({
  title,
  empty,
  accounts,
  rtl,
  onEdit,
  onAction,
}: {
  title: string;
  empty: string;
  accounts: ManagedUser[];
  rtl: boolean;
  onEdit: (account: ManagedUser) => void;
  onAction: (account: ManagedUser, action: string) => Promise<void>;
}) {
  return (
    <Card className="p-5">
      <h2 className="font-black text-navy-950 dark:text-white">{title}</h2>
      <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {accounts.length ? accounts.map((account) => (
          <div key={account.id} className="rounded border border-slate-200 p-4 text-xs dark:border-slate-800">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-black text-navy-950 dark:text-white">{account.firstName} {account.lastName}</p>
                <p className="break-all text-slate-500">{account.email}</p>
              </div>
              <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800">{accountTypeLabel(account.accountType || "legacy", rtl)}</span>
            </div>
            <div className="mt-3 grid gap-1 text-slate-500">
              <span>{rtl ? "الحالة" : "Status"}: {statusLabel(account, rtl)}</span>
              <span>{rtl ? "الفرع الثابت" : "Fixed Branch"}: {account.branch?.name || account.branch?.code || account.branchId || (rtl ? "لا يوجد" : "None")}</span>
              <span>{rtl ? "الجلسات النشطة" : "Active sessions"}: {account.activeSessions || 0}</span>
              <span>{rtl ? "تغيير كلمة المرور الإجباري" : "Force password change"}: {account.forcePasswordChange ? (rtl ? "نعم" : "Yes") : (rtl ? "لا" : "No")}</span>
              <span>{rtl ? "آخر دخول" : "Last login"}: {account.lastLoginAt ? new Date(account.lastLoginAt).toLocaleString() : (rtl ? "غير متاح" : "Not available")}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => onEdit(account)}>{rtl ? "تعديل" : "Edit"}</Button>
              <IconButton title={rtl ? "فك القفل" : "Unlock"} onClick={() => void onAction(account, "unlock")}><LockKeyhole className="h-4 w-4" /></IconButton>
              <IconButton title={rtl ? "إنهاء الجلسات" : "Revoke sessions"} onClick={() => void onAction(account, "revoke-sessions")}><RotateCcw className="h-4 w-4" /></IconButton>
              {account.isActive === false ? (
                <IconButton title={rtl ? "تفعيل" : "Activate"} onClick={() => void onAction(account, "activate")}><CheckCircle2 className="h-4 w-4 text-emerald-700" /></IconButton>
              ) : (
                <IconButton title={rtl ? "إيقاف" : "Deactivate"} onClick={() => void onAction(account, "deactivate")}><Power className="h-4 w-4 text-amber-700" /></IconButton>
              )}
            </div>
          </div>
        )) : <p className="rounded bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-900">{empty}</p>}
      </div>
    </Card>
  );
}

function IconButton({ title, onClick, children }: { title: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-200 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900" title={title} aria-label={title} onClick={onClick}>
      {children}
    </button>
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
