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
  "sales.returns.execute": {
    label: { ar: "تنفيذ مرتجعات المبيعات", en: "Execute Sales Returns" },
    description: { ar: "تنفيذ مرتجعات المبيعات مع تأثيرات المخزون والمحاسبة", en: "Execute sales returns with inventory and accounting effects" },
    sensitivity: "level_2"
  },
  "sales.exchanges.execute": {
    label: { ar: "تنفيذ استبدال المبيعات", en: "Execute Sales Exchanges" },
    description: { ar: "تنفيذ استبدال المبيعات مع تأثيرات المخزون والمحاسبة", en: "Execute sales exchanges with inventory and accounting effects" },
    sensitivity: "level_2"
  },
  "sales.installments.collect": {
    label: { ar: "تحصيل الأقساط", en: "Collect Installments" },
    description: { ar: "تحصيل أقساط العملاء وتسجيل الدفعات", en: "Collect customer installments and record payments" },
    sensitivity: "level_2"
  },
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
  adjust: { ar: "تعديل المخزون", en: "Adjust Inventory" },
  export: { ar: "تصدير", en: "Export" },
  print: { ar: "طباعة", en: "Print" },
  post: { ar: "ترحيل", en: "Post" },
  approve: { ar: "اعتماد", en: "Approve" },
  reject: { ar: "رفض", en: "Reject" },
  manage: { ar: "إدارة", en: "Manage" },
  reset: { ar: "إعادة تعيين", en: "Reset" },
  revoke: { ar: "إنهاء الجلسات", en: "Revoke Sessions" },
  record_payment: { ar: "تسجيل دفعة", en: "Record Payment" },
  view_payments: { ar: "عرض الدفعات", en: "View Payments" },
  view_receipts: { ar: "عرض الإيصالات", en: "View Receipts" },
  complete_sale: { ar: "إتمام البيع", en: "Complete Sale" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  amend_items: { ar: "تعديل بنود الحجز", en: "Amend Reservation Items" },
  reprice_items: { ar: "إعادة تسعير بنود الحجز", en: "Reprice Reservation Items" },
  extend_expiry: { ar: "تمديد الصلاحية", en: "Extend Expiry" },
  renew: { ar: "تجديد", en: "Renew" },
  view_renewal_transfers: { ar: "عرض تحويلات التجديد", en: "View Renewal Transfers" },
  refund_request: { ar: "طلب استرداد", en: "Request Refund" },
  refund_approve: { ar: "اعتماد الاسترداد", en: "Approve Refund" },
  refund_reject: { ar: "رفض الاسترداد", en: "Reject Refund" },
  refund_execute: { ar: "تنفيذ الاسترداد", en: "Execute Refund" },
  refund_method_override: { ar: "تجاوز طريقة الاسترداد", en: "Override Refund Method" },
  audit_view: { ar: "عرض التدقيق", en: "View Audit" },
  reports_view: { ar: "عرض التقارير", en: "View Reports" },
  reports_export: { ar: "تصدير التقارير", en: "Export Reports" },
  statement_view: { ar: "عرض كشف الحساب", en: "View Statement" },
  configure_account: { ar: "إعداد الحساب", en: "Configure Account" },
  credentials: { ar: "بيانات الدخول", en: "Credentials" },
  sessions: { ar: "الجلسات", en: "Sessions" },
  permissions: { ar: "صلاحيات الموظفين", en: "Employee Permissions" },
  branches: { ar: "فروع الموظفين", en: "Employee Branches" },
  verification: { ar: "تحقق الموظفين", en: "Employee Verification" },
  validate: { ar: "تحقق واعتماد مبدئي", en: "Validate" },
  submit: { ar: "إرسال للمراجعة", en: "Submit" },
  self_approve: { ar: "اعتماد ذاتي مضبوط", en: "Controlled Self Approval" },
  void: { ar: "إبطال", en: "Void" },
};

export const KNOWN_PERMISSION_CODES = [
  "dashboard.view",
  "customers.view", "customers.create", "customers.update", "customers.delete", "customers.export",
  "sales.view", "sales.create", "sales.approve", "sales.export", "sales.print",
  "sales.returns.execute", "sales.exchanges.execute", "sales.installments.collect",
  "pos.view", "pos.sell", "pos.discount.approve",
  "inventory.view", "inventory.create", "inventory.update", "inventory.delete", "inventory.adjust", "inventory.export", "inventory.print",
  "suppliers.view", "suppliers.create", "suppliers.update", "suppliers.delete", "suppliers.export",
  "accounting.view", "accounting.post", "accounting.export", "treasury.view", "treasury.update",
  "reports.view", "reports.export", "settings.view", "settings.update",
  "reservations.view", "reservations.view_all", "reservations.view_branch", "reservations.view_own",
  "reservations.create", "reservations.record_payment", "reservations.view_payments", "reservations.view_receipts",
  "reservations.complete_sale", "reservations.cancel", "reservations.amend_items", "reservations.reprice_items",
  "reservations.extend_expiry", "reservations.renew", "reservations.view_renewal_transfers",
  "reservations.refund_request", "reservations.refund_approve", "reservations.refund_reject", "reservations.refund_execute",
  "reservations.refund_method_override", "reservations.audit_view", "reservations.reports_view", "reservations.reports_export",
  "reservations.statement_view", "reservations.configure_account",
  "gold_purchase.cgp.view", "gold_purchase.cgp.view_all", "gold_purchase.cgp.view_branch", "gold_purchase.cgp.view_own",
  "gold_purchase.cgp.create", "gold_purchase.cgp.update_draft", "gold_purchase.cgp.validate", "gold_purchase.cgp.submit",
  "gold_purchase.cgp.approve", "gold_purchase.cgp.reject", "gold_purchase.cgp.self_approve", "gold_purchase.cgp.void",
  "gold_purchase.igp.view", "gold_purchase.igp.view_all", "gold_purchase.igp.view_branch", "gold_purchase.igp.view_own",
  "gold_purchase.igp.create", "gold_purchase.igp.update_draft", "gold_purchase.igp.validate", "gold_purchase.igp.submit",
  "gold_purchase.igp.approve", "gold_purchase.igp.reject", "gold_purchase.igp.self_approve", "gold_purchase.igp.void",
  "users.view", "users.create", "users.update", "users.delete", "users.manage",
  "system_accounts.view", "system_accounts.manage", "system_accounts.credentials.reset",
  "system_accounts.sessions.revoke", "security.recovery.manage", "super_admin.manage",
  "employees.credentials.manage", "employees.permissions.manage", "employees.branches.manage", "employees.verification.view",
  "roles.view", "roles.manage", "permissions.manage",
  "notifications.view", "notifications.manage", "approvals.view", "approvals.manage",
  "audit.view", "gold.view", "gold.update", "payroll.view", "payroll.manage"
] as const;

export function permissionMeta(code: string): PermissionMeta {
  const parts = code.split(".");
  const action = parts.pop() || code;
  const moduleName = parts.join(".");
  const moduleLabels = MODULE_LABELS[moduleName] || MODULE_LABELS[parts[0]] || { ar: "صلاحيات", en: "Permissions" };
  const exact = EXACT_LABELS[code];
  const genericAction = ACTION_LABELS[action] || {
    ar: "صلاحية غير مترجمة",
    en: "Missing Permission Translation",
  };
  const label = exact?.label || {
    ar: `${genericAction.ar} ${moduleLabels.ar}`,
    en: `${genericAction.en} ${moduleLabels.en}`,
  };
  return {
    moduleKey: moduleName,
    module: moduleLabels,
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
