"use client";

import { useAuth } from "@/contexts/auth-context";
import { useOptionalOperator } from "@/contexts/operator-context";
import { hasPermission, PermissionSet } from "@/lib/permissions/permissions";

export function usePermissions() {
  const { user } = useAuth();
  const operator = useOptionalOperator();
  const role = user?.role;
  const accountType = user?.accountType ?? "legacy";
  const operatorPermissionNames = operator?.active
    ? operator.authorization?.effectivePermissionNames ?? operator.authorization?.effectivePermissions ?? []
    : [];

  const has = (permissionName: string): boolean => {
    if (accountType === "super_admin") return true;
    if (accountType === "branch_shell") return operatorPermissionNames.includes(permissionName);
    if (role === "admin" || role === "owner") return true;
    return user?.permissions?.includes(permissionName) ?? false;
  };

  const hasAnyPermission = (permissionNames: readonly string[]): boolean => permissionNames.some((permissionName) => has(permissionName));
  const hasAllPermissions = (permissionNames: readonly string[]): boolean => permissionNames.every((permissionName) => has(permissionName));

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
    hasAnyPermission,
    hasAllPermissions,
    permissions: accountType === "branch_shell" ? operatorPermissionNames : user?.permissions ?? [],
    operatorActive: Boolean(operator?.active),
    operatorAuthorization: operator?.authorization ?? null,
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
