"use client";

import { FormEvent, useMemo, useState } from "react";
import { ShieldCheck, UserPlus } from "lucide-react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useUserManagement } from "@/hooks/use-user-management";
import { usePermissions } from "@/hooks/use-permissions";

export default function UsersManagementPage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const { hasPermission } = usePermissions();
  const { users, roles, permissions, isLoading, createUser, updateRolePermissions, isSaving } = useUserManagement();
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
  const moduleLabel = (module: string) => module === "gold_purchase.cgp"
    ? (rtl ? "شراء الذهب من العملاء (CGP)" : "Customer Gold Purchase (CGP)")
    : module === "gold_purchase.igp"
      ? (rtl ? "شراء الذهب الاستثماري (IGP)" : "Investment Gold Purchase (IGP)")
      : module;
  const permissionLabel = (name: string) => {
    if (!name.startsWith("gold_purchase.")) return name;
    const action = name.split(".").at(-1) || name;
    const labels: Record<string, [string, string]> = {
      view: ["عرض الوحدة", "View module"], view_all: ["عرض كل الفروع", "View all branches"],
      view_branch: ["عرض الفرع", "View branch"], view_own: ["عرض السجلات الخاصة", "View own"],
      create: ["إنشاء", "Create"], update_draft: ["تعديل المسودة", "Update draft"],
      validate: ["تحقق", "Validate"], submit: ["إرسال للموافقة", "Submit"],
      approve: ["اعتماد", "Approve"], reject: ["رفض", "Reject"], self_approve: ["تجاوز الموافقة الذاتية المنضبط", "Controlled self-review override"], void: ["إلغاء المسودة", "Void"],
    };
    return labels[action]?.[rtl ? 0 : 1] || name;
  };

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
            <h2 className="font-black text-navy-950 dark:text-white">{rtl ? "الحسابات التقنية" : "Technical Accounts"}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500 dark:bg-navy-950">
                <tr>
                  <th className="px-4 py-3 text-start">{rtl ? "الاسم" : "Name"}</th>
                  <th className="px-4 py-3 text-start">{rtl ? "البريد" : "Email"}</th>
                  <th className="px-4 py-3 text-start">{rtl ? "الأدوار" : "Roles"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr><td colSpan={3} className="p-5 text-center text-slate-400">{rtl ? "جار التحميل..." : "Loading..."}</td></tr>
                ) : users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 font-bold">{user.firstName} {user.lastName}</td>
                    <td className="px-4 py-3 text-slate-500">{user.email}</td>
                    <td className="px-4 py-3">{(user.roles ?? []).map((role) => role.name).join(", ") || user.role}</td>
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
              <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">{moduleLabel(module)}</h3>
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
                    <span>{permissionLabel(permission.name)} <span className="font-mono font-normal text-slate-400">({permission.name})</span></span>
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
