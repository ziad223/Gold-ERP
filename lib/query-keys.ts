export const queryKeys = {
  settings: ["settings"] as const,
  branches: ["branches"] as const,

  customers: ["customers"] as const,
  customer: (id: string) => ["customer", id] as const,
  customerInvoices: (id: string) => ["customer-invoices", id] as const,
  customerStatement: (id: string) => ["customer-statement", id] as const,
  customerAttachments: (id: string) => ["customer-attachments", id] as const,

  suppliers: ["suppliers"] as const,
  supplier: (id: string) => ["supplier", id] as const,
  supplierPurchaseOrders: (id: string) => ["supplier-purchase-orders", id] as const,
  supplierDocuments: (id: string) => ["supplier-documents", id] as const,
  purchaseOrders: () => ["purchase-orders"] as const,

  invoices: ["invoices"] as const,
  invoice: (id: string) => ["invoice", id] as const,

  assets: (branchId?: string) => (branchId ? (["assets", branchId] as const) : (["assets"] as const)),
  asset: (id: string) => ["asset", id] as const,
  assetTimeline: (id: string) => ["asset-timeline", id] as const,
  assetAttachments: (id: string) => ["asset-attachments", id] as const,

  transfers: ["transfers"] as const,
  reservations: ["reservations"] as const,

  dashboard: ["dashboard"] as const,
  reports: ["reports"] as const,
  coreErpData: ["core-erp-data"] as const,
  globalSearch: ["global-search"] as const,

  treasury: ["treasury"] as const,
  accounting: ["accounting"] as const,

  notifications: ["notifications"] as const,
  notificationUnreadCount: ["notifications", "unread-count"] as const,
  legacyNotificationUnreadCount: ["notifications-unread-count"] as const,

  auditLogs: ["audit-logs"] as const,

  employees: ["employees"] as const,
  employee: (id: string) => ["employee", id] as const,
  employeeAuditLogs: (id: string) => ["employee-audit-logs", id] as const,
  sessions: ["sessions"] as const,

  users: ["users"] as const,
  roles: ["roles"] as const,
  permissions: ["permissions"] as const,

  products: ["products"] as const,
  stockMovements: ["stock-movements"] as const,
};
