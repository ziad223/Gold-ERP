export type DarfusRole = "admin" | "owner" | "manager" | "accountant" | "sales";

export interface PermissionSet {
  /** Print barcode / price labels (barcode.print). */
  printBarcode: boolean;
  viewCosts: boolean;
  viewMargins: boolean;
  overrideGoldRate: boolean;
  overrideManualPrice: boolean;
  applyLargeDiscount: boolean;
  approveReverseCharge: boolean;
  reopenAccountingPeriod: boolean;
  postJournalEntries: boolean;
  manageSettings: boolean;
  performInventoryAdjustments: boolean;
  viewAuditLogs: boolean;
}

export const ROLE_PERMISSIONS: Record<DarfusRole, PermissionSet> = {
  admin: {
    printBarcode: true,
    viewCosts: true,
    viewMargins: true,
    overrideGoldRate: true,
    overrideManualPrice: true,
    applyLargeDiscount: true,
    approveReverseCharge: true,
    reopenAccountingPeriod: true,
    postJournalEntries: true,
    manageSettings: true,
    performInventoryAdjustments: true,
    viewAuditLogs: true,
  },
  owner: {
    printBarcode: true,
    viewCosts: true,
    viewMargins: true,
    overrideGoldRate: true,
    overrideManualPrice: true,
    applyLargeDiscount: true,
    approveReverseCharge: true,
    reopenAccountingPeriod: true,
    postJournalEntries: true,
    manageSettings: true,
    performInventoryAdjustments: true,
    viewAuditLogs: true,
  },
  manager: {
    printBarcode: true,
    viewCosts: true,
    viewMargins: true,
    overrideGoldRate: true,
    overrideManualPrice: true,
    applyLargeDiscount: true,
    approveReverseCharge: true,
    reopenAccountingPeriod: false,
    postJournalEntries: false,
    manageSettings: true,
    performInventoryAdjustments: true,
    viewAuditLogs: true,
  },
  accountant: {
    printBarcode: false,
    viewCosts: true,
    viewMargins: true,
    overrideGoldRate: false,
    overrideManualPrice: false,
    applyLargeDiscount: false,
    approveReverseCharge: true,
    reopenAccountingPeriod: true,
    postJournalEntries: true,
    manageSettings: false,
    performInventoryAdjustments: false,
    viewAuditLogs: true,
  },
  sales: {
    printBarcode: true,
    viewCosts: false, // strictly hidden
    viewMargins: false, // strictly hidden
    overrideGoldRate: false,
    overrideManualPrice: false,
    applyLargeDiscount: false,
    approveReverseCharge: false,
    reopenAccountingPeriod: false,
    postJournalEntries: false,
    manageSettings: false,
    performInventoryAdjustments: false,
    viewAuditLogs: false,
  },
};

// Evaluates whether a role can perform a specific operational permission
export function hasPermission(role: DarfusRole | undefined, permission: keyof PermissionSet): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}
