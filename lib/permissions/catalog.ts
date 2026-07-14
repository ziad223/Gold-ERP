export type PermissionLocale = "ar" | "en";

type PermissionMeta = {
  moduleKey: string;
  module: Record<PermissionLocale, string>;
  label: Record<PermissionLocale, string>;
  description: Record<PermissionLocale, string>;
  sensitivity: "level_1" | "level_2";
};

const MODULE_LABELS: Record<string, Record<PermissionLocale, string>> = {
  dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
  customers: { ar: "العملاء", en: "Customers" },
  sales: { ar: "المبيعات", en: "Sales" },
  pos: { ar: "نقطة البيع", en: "POS" },
  inventory: { ar: "المخزون", en: "Inventory" },
  suppliers: { ar: "الموردون", en: "Suppliers" },
  accounting: { ar: "المحاسبة", en: "Accounting" },
  treasury: { ar: "الخزينة", en: "Treasury" },
  reports: { ar: "التقارير", en: "Reports" },
  settings: { ar: "الإعدادات", en: "Settings" },
  reservations: { ar: "الحجوزات", en: "Reservations" },
  gold_purchase: { ar: "شراء الذهب", en: "Gold Purchase" },
  "gold_purchase.cgp": { ar: "شراء الذهب من العملاء", en: "Customer Gold Purchase" },
  "gold_purchase.igp": { ar: "شراء الذهب الاستثماري", en: "Investment Gold Purchase" },
  users: { ar: "المستخدمون", en: "Users" },
  employees: { ar: "الموظفون", en: "Employees" },
  roles: { ar: "قوالب الأدوار", en: "Role Templates" },
  permissions: { ar: "الصلاحيات", en: "Permissions" },
  notifications: { ar: "الإشعارات", en: "Notifications" },
  approvals: { ar: "الموافقات", en: "Approvals" },
  audit: { ar: "التدقيق", en: "Audit" },
  gold: { ar: "الذهب", en: "Gold" },
  payroll: { ar: "الرواتب", en: "Payroll" },
  branches: { ar: "الفروع", en: "Branches" },
  system_accounts: { ar: "حسابات النظام", en: "System Accounts" },
  security: { ar: "الاسترجاع والأمان", en: "Security and Recovery" },
  super_admin: { ar: "المدير العام", en: "Super Admin" },
};

const EXACT_LABELS: Record<string, Partial<PermissionMeta>> = {
  "sales.create": { label: { ar: "إنشاء وإدارة عمليات البيع", en: "Create and Manage Sales" } },
  "sales.print": { label: { ar: "طباعة فواتير المبيعات", en: "Print Sales Invoices" } },
  "pos.sell": { label: { ar: "تنفيذ البيع من نقطة البيع", en: "Process POS Sales" } },
  "pos.discount.approve": { label: { ar: "اعتماد الخصم الاستثنائي", en: "Approve Exceptional Discounts" }, sensitivity: "level_2" },
  "employees.credentials.manage": { label: { ar: "إدارة أكواد وبيانات دخول الموظفين", en: "Manage Employee Credentials" }, sensitivity: "level_2" },
  "system_accounts.manage": { label: { ar: "إدارة حسابات النظام", en: "Manage System Accounts" }, sensitivity: "level_2" },
  "system_accounts.view": { label: { ar: "عرض حسابات النظام", en: "View System Accounts" } },
  "system_accounts.credentials.reset": { label: { ar: "إعادة تعيين كلمات مرور حسابات النظام", en: "Reset System Account Passwords" }, sensitivity: "level_2" },
  "system_accounts.sessions.revoke": { label: { ar: "إنهاء جلسات حسابات النظام", en: "Revoke System Account Sessions" }, sensitivity: "level_2" },
  "security.recovery.manage": { label: { ar: "إدارة الاسترجاع والأمان", en: "Manage Security and Recovery" }, sensitivity: "level_2" },
  "super_admin.manage": { label: { ar: "إدارة حسابات المدير العام", en: "Manage Super Admin Accounts" }, sensitivity: "level_2" },
};

const ACTION_LABELS: Record<string, Record<PermissionLocale, string>> = {
  view: { ar: "عرض", en: "View" },
  view_all: { ar: "عرض كل الفروع", en: "View All" },
  view_branch: { ar: "عرض الفرع", en: "View Branch" },
  view_own: { ar: "عرض السجلات الخاصة", en: "View Own" },
  create: { ar: "إنشاء", en: "Create" },
  update: { ar: "تعديل", en: "Update" },
  update_draft: { ar: "تعديل المسودة", en: "Update Draft" },
  delete: { ar: "حذف", en: "Delete" },
  export: { ar: "تصدير", en: "Export" },
  print: { ar: "طباعة", en: "Print" },
  approve: { ar: "اعتماد", en: "Approve" },
  reject: { ar: "رفض", en: "Reject" },
  manage: { ar: "إدارة", en: "Manage" },
  reset: { ar: "إعادة تعيين", en: "Reset" },
  revoke: { ar: "إنهاء الجلسات", en: "Revoke Sessions" },
  configure_account: { ar: "إعداد الحساب", en: "Configure Account" },
  credentials: { ar: "بيانات الدخول", en: "Credentials" },
  sessions: { ar: "الجلسات", en: "Sessions" },
};

export function permissionMeta(code: string): PermissionMeta {
  const parts = code.split(".");
  const action = parts.pop() || code;
  const moduleName = parts.join(".");
  const module = MODULE_LABELS[moduleName] || MODULE_LABELS[parts[0]] || { ar: "صلاحيات", en: "Permissions" };
  const exact = EXACT_LABELS[code];
  const genericAction = ACTION_LABELS[action] || {
    ar: action.replace(/_/g, " "),
    en: action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  };
  const label = exact?.label || {
    ar: `${genericAction.ar} ${module.ar}`,
    en: `${genericAction.en} ${module.en}`,
  };
  return {
    moduleKey: moduleName,
    module,
    label,
    description: exact?.description || label,
    sensitivity: exact?.sensitivity || (/(delete|approve|manage|reset|revoke|post|update|void)/.test(action) ? "level_2" : "level_1"),
  };
}

export function permissionLabel(code: string, locale: PermissionLocale) {
  return permissionMeta(code).label[locale];
}

export function permissionModuleLabel(moduleOrCode: string, locale: PermissionLocale) {
  const moduleName = moduleOrCode.includes(".") ? moduleOrCode.split(".").slice(0, -1).join(".") : moduleOrCode;
  return (MODULE_LABELS[moduleName] || MODULE_LABELS[moduleName.split(".")[0]] || { ar: moduleName, en: moduleName })[locale];
}

export function permissionSourceLabel(source: "role" | "grant" | "denial" | "denial_wins", locale: PermissionLocale, roleName?: string) {
  const labels = {
    role: { ar: `موروثة من دور: ${roleName || ""}`.trim(), en: `Inherited from role: ${roleName || ""}`.trim() },
    grant: { ar: "سماح مباشر", en: "Direct grant" },
    denial: { ar: "منع مباشر", en: "Direct denial" },
    denial_wins: { ar: "المنع المباشر هو المطبق", en: "Direct denial takes precedence" },
  };
  return labels[source][locale];
}
