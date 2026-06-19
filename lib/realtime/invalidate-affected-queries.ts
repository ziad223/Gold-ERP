import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

export type EntityName =
  | "Customer"
  | "Invoice"
  | "Asset"
  | "Supplier"
  | "PurchaseOrder"
  | "Transfer"
  | "Settings"
  | "Branch"
  | "Notification"
  | "AuditLog"
  | "Employee"
  | "Attachment"
  | "KYC"
  | "User"
  | "Role"
  | "Permission"
  | string;

export type EntityChangedEvent = {
  type?: string;
  entity: EntityName;
  action: string;
  id?: string | null;
  companyId?: string;
  branchId?: string | null;
  related?: {
    customerId?: string;
    supplierId?: string;
    invoiceId?: string;
    assetId?: string;
    assetIds?: string[];
    purchaseOrderId?: string;
    transferId?: string;
    userId?: string;
    branchId?: string;
  };
};

function invalidateNotifications(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
  queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnreadCount });
  queryClient.invalidateQueries({ queryKey: queryKeys.legacyNotificationUnreadCount });
}

function invalidateCommonOperationalViews(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  queryClient.invalidateQueries({ queryKey: queryKeys.reports });
  queryClient.invalidateQueries({ queryKey: queryKeys.coreErpData });
  queryClient.invalidateQueries({ queryKey: queryKeys.globalSearch });
}

export function invalidateAffectedQueries(queryClient: QueryClient, event: EntityChangedEvent) {
  const related = event.related || {};
  const id = event.id || undefined;

  switch (event.entity) {
    case "Customer":
    case "KYC":
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
      if (id) queryClient.invalidateQueries({ queryKey: queryKeys.customer(id) });
      if (related.customerId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.customer(related.customerId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.customerInvoices(related.customerId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.customerStatement(related.customerId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.customerAttachments(related.customerId) });
      }
      invalidateCommonOperationalViews(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs });
      invalidateNotifications(queryClient);
      break;

    case "Invoice":
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
      if (id) queryClient.invalidateQueries({ queryKey: queryKeys.invoice(id) });
      if (related.invoiceId) queryClient.invalidateQueries({ queryKey: queryKeys.invoice(related.invoiceId) });
      if (related.customerId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.customers });
        queryClient.invalidateQueries({ queryKey: queryKeys.customer(related.customerId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.customerInvoices(related.customerId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.customerStatement(related.customerId) });
      }
      if (Array.isArray(related.assetIds)) {
        related.assetIds.forEach((assetId) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.asset(assetId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.assetTimeline(assetId) });
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.assets() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockMovements });
      queryClient.invalidateQueries({ queryKey: queryKeys.treasury });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting });
      invalidateCommonOperationalViews(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs });
      invalidateNotifications(queryClient);
      break;

    case "Supplier":
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers });
      if (id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.supplier(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.supplierPurchaseOrders(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.supplierDocuments(id) });
      }
      invalidateCommonOperationalViews(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs });
      invalidateNotifications(queryClient);
      break;

    case "PurchaseOrder":
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders() });
      if (related.supplierId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.supplier(related.supplierId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.supplierPurchaseOrders(related.supplierId) });
      }
      if (Array.isArray(related.assetIds)) {
        related.assetIds.forEach((assetId) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.asset(assetId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.assetTimeline(assetId) });
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.assets() });
      queryClient.invalidateQueries({ queryKey: queryKeys.treasury });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting });
      invalidateCommonOperationalViews(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs });
      invalidateNotifications(queryClient);
      break;

    case "Asset":
    case "Attachment":
      queryClient.invalidateQueries({ queryKey: queryKeys.assets() });
      if (id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.asset(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.assetTimeline(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.assetAttachments(id) });
      }
      if (related.assetId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.asset(related.assetId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.assetTimeline(related.assetId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.assetAttachments(related.assetId) });
      }
      if (Array.isArray(related.assetIds)) {
        related.assetIds.forEach((assetId) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.asset(assetId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.assetTimeline(assetId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.assetAttachments(assetId) });
        });
      }
      if (related.customerId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.customer(related.customerId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.customerAttachments(related.customerId) });
      }
      if (related.supplierId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.supplier(related.supplierId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.supplierDocuments(related.supplierId) });
      }
      invalidateCommonOperationalViews(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs });
      invalidateNotifications(queryClient);
      break;

    case "Transfer":
      queryClient.invalidateQueries({ queryKey: queryKeys.transfers });
      queryClient.invalidateQueries({ queryKey: queryKeys.assets() });
      if (Array.isArray(related.assetIds)) {
        related.assetIds.forEach((assetId) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.asset(assetId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.assetTimeline(assetId) });
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.branches });
      invalidateCommonOperationalViews(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs });
      invalidateNotifications(queryClient);
      break;

    case "Settings":
    case "Branch":
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
      queryClient.invalidateQueries({ queryKey: queryKeys.branches });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
      invalidateCommonOperationalViews(queryClient);
      invalidateNotifications(queryClient);
      break;

    case "Notification":
      invalidateNotifications(queryClient);
      break;

    case "AuditLog":
      queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs });
      break;

    case "Employee":
      queryClient.invalidateQueries({ queryKey: queryKeys.employees });
      if (id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.employee(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.employeeAuditLogs(id) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs });
      invalidateNotifications(queryClient);
      break;

    case "User":
    case "Role":
    case "Permission":
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles });
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions });
      queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs });
      invalidateNotifications(queryClient);
      break;

    default:
      invalidateCommonOperationalViews(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs });
      invalidateNotifications(queryClient);
      break;
  }
}
