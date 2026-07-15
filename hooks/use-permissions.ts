"use client";

import { useAuth } from "@/contexts/auth-context";
import { hasPermission, PermissionSet } from "@/lib/permissions/permissions";

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role;
  const accountType = user?.accountType ?? "legacy";

  const has = (permissionName: string): boolean => {
    if (accountType === "super_admin") return true;
    if (accountType === "branch_shell") return user?.permissions?.includes(permissionName) ?? false;
    if (role === "admin" || role === "owner") return true;
    return user?.permissions?.includes(permissionName) ?? false;
  };

  const check = (permission: keyof PermissionSet): boolean => {
    const legacyToGranular: Partial<Record<keyof PermissionSet, string>> = {
      manageSettings: "settings.update",
      postJournalEntries: "accounting.post",
      performInventoryAdjustments: "inventory.adjust",
      viewAuditLogs: "audit.view",
      approveReverseCharge: "approvals.manage",
    };
    const granular = legacyToGranular[permission];
    if (granular && user?.permissions) return has(granular);
    if (accountType === "super_admin") return true;
    if (accountType === "branch_shell") return false;
    return hasPermission(role, permission);
  };

  return {
    role,
    accountType,
    hasPermission: has,
    permissions: user?.permissions ?? [],
    isAuthorized: check,
    viewCosts: check("viewCosts"),
    viewMargins: check("viewMargins"),
    overrideGoldRate: check("overrideGoldRate"),
    overrideManualPrice: check("overrideManualPrice"),
    applyLargeDiscount: check("applyLargeDiscount"),
    approveReverseCharge: check("approveReverseCharge"),
    reopenAccountingPeriod: check("reopenAccountingPeriod"),
    postJournalEntries: check("postJournalEntries"),
    manageSettings: check("manageSettings"),
    performInventoryAdjustments: check("performInventoryAdjustments"),
    viewAuditLogs: check("viewAuditLogs"),
  };
}
