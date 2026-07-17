import type {
  CustomerRepository,
  SupplierRepository,
  EmployeeRepository,
  OperatorRepository,
  AssetRepository,
  InventoryRepository,
  SalesRepository,
  ManufacturingRepository,
  AccountingRepository,
  ReportsRepository,
  AuditRepository,
  SettingsRepository,
  ListQuery,
  PaginatedResult,
  MutationResult,
  ManualJournalDraftInput,
  AccountStatement,
  AccountStatementQuery,
  TrialBalance,
  TrialBalanceQuery,
  LedgerReconciliation,
  LedgerReconciliationQuery,
  AccountBalanceReconciliation,
  AccountingDateLock,
  CustomerStatement,
  CustomerStatementQuery,
  CustomerCreditReconciliationReport,
  CustomerStatementV3Report,
  SupplierStatement,
  SupplierStatementQuery,
  SupplierPaymentInput,
  SupplierPaymentResult,
} from "./interfaces";
import type {
  Customer,
  Supplier,
  Employee,
  Asset,
  Transfer,
  ManufacturingOrder,
  JournalEntry,
  Reservation,
  PurchaseOrder,
  AuditLog,
  SupplierConsignment,
  SupplierDocument,
  EmployeeSession,
  EmployeeOperationalSessionHistory,
  EmployeeBranchAccess,
  EmployeePermissionState,
  EmployeeVerificationAttempt,
  OperatorSessionState,
  OperatorVerifyInput,
  OperatorVerifyResult,
} from "../types";
import { apiClient } from "../api/client";
import { normalizeEntity, normalizeItems, normalizePage } from "../api/normalize";

const TOKEN_KEY = "darfus-token-v1";

function getStoredToken(): string | undefined {
  try {
    return (
      window.localStorage.getItem(TOKEN_KEY) ??
      window.sessionStorage.getItem(TOKEN_KEY) ??
      undefined
    );
  } catch {
    return undefined;
  }
}

function buildQueryString(query: ListQuery): string {
  const params = new URLSearchParams();
  if (query.page) params.append("page", String(query.page));
  if (query.pageSize) params.append("pageSize", String(query.pageSize));
  if (query.search) params.append("search", query.search);
  if (query.sortBy) params.append("sortBy", query.sortBy);
  if (query.sortDirection) params.append("sortDirection", query.sortDirection);
  if (query.filters) params.append("filters", JSON.stringify(query.filters));
  const qStr = params.toString();
  return qStr ? `?${qStr}` : "";
}

function auth() {
  return { token: getStoredToken() };
}

export class ApiCustomerRepository implements CustomerRepository {
  async list(query: ListQuery): Promise<PaginatedResult<Customer>> {
    const res = await apiClient<any>(`/customers${buildQueryString(query)}`, {
      ...auth(),
      skipBranch: true,
    });
    return normalizePage<Customer>(res, { page: query.page, pageSize: query.pageSize });
  }

  async getById(id: string): Promise<Customer | null> {
    return apiClient<any>(`/customers/${id}`, auth())
      .then((res) => normalizeEntity<Customer>(res))
      .catch(() => null);
  }

  async create(customer: Omit<Customer, "id"> & Partial<Pick<Customer, "id">>): Promise<MutationResult<Customer>> {
    return apiClient<MutationResult<Customer>>("/customers", {
      method: "POST",
      body: JSON.stringify(customer),
      ...auth(),
    });
  }

  async update(id: string, updates: Partial<Customer>): Promise<MutationResult<Customer>> {
    return apiClient<MutationResult<Customer>>(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
      ...auth(),
    });
  }

  async deactivate(id: string, reason?: string): Promise<MutationResult<Customer>> {
    return apiClient<MutationResult<Customer>>(`/customers/${id}/deactivate`, {
      method: "POST",
      body: JSON.stringify({ reason }),
      ...auth(),
    });
  }

  async reactivate(id: string): Promise<MutationResult<Customer>> {
    return apiClient<MutationResult<Customer>>(`/customers/${id}/reactivate`, {
      method: "POST",
      ...auth(),
    });
  }

  async delete(id: string): Promise<MutationResult<void>> {
    return apiClient<MutationResult<void>>(`/customers/${id}`, {
      method: "DELETE",
      ...auth(),
    });
  }

  async calculateStatement(id: string): Promise<any> {
    return apiClient<any>(`/customers/${id}/statement`, auth()).then((res) =>
      normalizeEntity<any>(res)
    );
  }
}

export class ApiSupplierRepository implements SupplierRepository {
  async list(query: ListQuery): Promise<PaginatedResult<Supplier>> {
    const res = await apiClient<any>(`/suppliers${buildQueryString(query)}`, {
      ...auth(),
      skipBranch: true,
    });
    return normalizePage<Supplier>(res, { page: query.page, pageSize: query.pageSize });
  }

  async getById(id: string): Promise<Supplier | null> {
    // Endpoint returns the standard { success, data } envelope — unwrap it.
    return apiClient<any>(`/suppliers/${id}`, auth())
      .then((res) => normalizeEntity<Supplier>(res))
      .catch(() => null);
  }

  async create(supplier: Omit<Supplier, "id"> & Partial<Pick<Supplier, "id">>): Promise<MutationResult<Supplier>> {
    return apiClient<MutationResult<Supplier>>("/suppliers", {
      method: "POST",
      body: JSON.stringify(supplier),
      ...auth(),
    });
  }

  async update(id: string, updates: Partial<Supplier>): Promise<MutationResult<Supplier>> {
    return apiClient<MutationResult<Supplier>>(`/suppliers/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
      ...auth(),
    });
  }

  async deactivate(id: string, reason?: string): Promise<MutationResult<Supplier>> {
    return apiClient<MutationResult<Supplier>>(`/suppliers/${id}/deactivate`, {
      method: "POST",
      body: JSON.stringify({ reason }),
      ...auth(),
    });
  }

  async reactivate(id: string): Promise<MutationResult<Supplier>> {
    return apiClient<MutationResult<Supplier>>(`/suppliers/${id}/reactivate`, {
      method: "POST",
      ...auth(),
    });
  }

  async delete(id: string): Promise<MutationResult<void>> {
    return apiClient<MutationResult<void>>(`/suppliers/${id}`, {
      method: "DELETE",
      ...auth(),
    });
  }

  async getPurchaseOrders(supplierId: string): Promise<PurchaseOrder[]> {
    const res = await apiClient<any>(`/suppliers/${supplierId}/purchase-orders`, auth());
    return normalizeItems<PurchaseOrder>(res);
  }

  async getConsignments(supplierId: string): Promise<SupplierConsignment[]> {
    const res = await apiClient<any>(`/suppliers/${supplierId}/consignments`, auth());
    return normalizeItems<SupplierConsignment>(res);
  }

  async getDocuments(supplierId: string): Promise<SupplierDocument[]> {
    const res = await apiClient<any>(`/suppliers/${supplierId}/documents`, auth());
    return normalizeItems<SupplierDocument>(res);
  }

  async uploadDocument(supplierId: string, name: string, type: string, expiryDate: string, file: File): Promise<MutationResult<SupplierDocument>> {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("type", type);
    formData.append("expiryDate", expiryDate);
    formData.append("file", file);

    return apiClient<MutationResult<SupplierDocument>>(`/suppliers/${supplierId}/documents`, {
      method: "POST",
      body: formData,
      skipBranch: true,
      ...auth(),
    });
  }

  async deleteDocument(supplierId: string, docId: string): Promise<MutationResult<void>> {
    return apiClient<MutationResult<void>>(`/suppliers/${supplierId}/documents/${docId}`, {
      method: "DELETE",
      skipBranch: true,
      ...auth(),
    });
  }
}

export class ApiEmployeeRepository implements EmployeeRepository {
  async list(query: ListQuery): Promise<PaginatedResult<Employee>> {
    const res = await apiClient<any>(`/employees${buildQueryString(query)}`, auth());
    return normalizePage<Employee>(res, { page: query.page, pageSize: query.pageSize });
  }

  async getById(id: string): Promise<Employee | null> {
    return apiClient<any>(`/employees/${id}`, auth())
      .then((res) => normalizeEntity<Employee>(res))
      .catch(() => null);
  }

  async create(employee: Employee): Promise<MutationResult<Employee>> {
    return apiClient<MutationResult<Employee>>("/employees", {
      method: "POST",
      body: JSON.stringify(employee),
      ...auth(),
    });
  }

  async update(id: string, updates: Partial<Employee>): Promise<MutationResult<Employee>> {
    return apiClient<MutationResult<Employee>>(`/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
      ...auth(),
    });
  }

  async deactivate(id: string, reason?: string): Promise<MutationResult<Employee>> {
    return apiClient<MutationResult<Employee>>(`/employees/${id}/deactivate`, {
      method: "POST",
      body: JSON.stringify({ reason }),
      ...auth(),
    });
  }

  async reactivate(id: string): Promise<MutationResult<Employee>> {
    return apiClient<MutationResult<Employee>>(`/employees/${id}/reactivate`, {
      method: "POST",
      ...auth(),
    });
  }

  async getSessions(employeeId: string): Promise<EmployeeSession[]> {
    const res = await apiClient<any>(`/employees/${employeeId}/sessions`, auth());
    return normalizeItems<EmployeeSession>(res);
  }

  async getOperatorSessions(employeeId: string, query: { page?: number; pageSize?: number; state?: string; branchId?: string } = {}): Promise<PaginatedResult<EmployeeOperationalSessionHistory>> {
    const params = new URLSearchParams();
    if (query.page) params.append("page", String(query.page));
    if (query.pageSize) params.append("pageSize", String(query.pageSize));
    if (query.state) params.append("state", query.state);
    if (query.branchId) params.append("branchId", query.branchId);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await apiClient<any>(`/employees/${employeeId}/operator-sessions${qs}`, auth());
    const data = res?.data ?? res;
    return {
      items: data.items || [],
      page: data.page || query.page || 1,
      pageSize: data.pageSize || query.pageSize || 25,
      total: data.total || 0,
      totalPages: data.totalPages || 0,
    };
  }

  async revokeSession(employeeId: string, sessionId: string): Promise<MutationResult<void>> {
    return apiClient<MutationResult<void>>(`/employees/${employeeId}/sessions/${sessionId}`, {
      method: "DELETE",
      ...auth(),
    });
  }

  async resetCredential(employeeId: string, pin: string, resetRequired = false): Promise<MutationResult<any>> {
    return apiClient<MutationResult<any>>(`/employees/${employeeId}/credential/reset`, {
      method: "POST",
      body: JSON.stringify({ pin, resetRequired }),
      ...auth(),
    });
  }

  async unlockCredential(employeeId: string, reason = "UI credential unlock"): Promise<MutationResult<any>> {
    return apiClient<MutationResult<any>>(`/employees/${employeeId}/credential/unlock`, {
      method: "POST",
      body: JSON.stringify({ reason }),
      ...auth(),
    });
  }

  async revokeOperatorSessions(employeeId: string, reason = "UI operator session revocation"): Promise<MutationResult<any>> {
    return apiClient<MutationResult<any>>(`/employees/${employeeId}/credential/revoke-sessions`, {
      method: "POST",
      body: JSON.stringify({ reason }),
      ...auth(),
    });
  }

  async changeEmployeeCode(employeeId: string, employeeCode: string, reason: string): Promise<MutationResult<any>> {
    return apiClient<MutationResult<any>>(`/employees/${employeeId}/change-code`, {
      method: "POST",
      body: JSON.stringify({ employeeCode, reason }),
      ...auth(),
    });
  }

  async getEmployeeCodeHistory(employeeId: string): Promise<Array<{ id: string; oldCode?: string | null; newCode?: string | null; reason?: string | null; createdAt?: string | null }>> {
    const res = await apiClient<any>(`/employees/${employeeId}/code-history`, auth());
    return normalizeItems(res);
  }

  async changeOwnPin(input: { currentPin: string; newPin: string; confirmation: string }): Promise<MutationResult<any>> {
    return apiClient<MutationResult<any>>("/operator/change-pin", {
      method: "POST",
      body: JSON.stringify(input),
      ...auth(),
    });
  }

  async getBranchAccess(employeeId: string): Promise<EmployeeBranchAccess[]> {
    const res = await apiClient<any>(`/employees/${employeeId}/branches`, auth());
    return normalizeItems<EmployeeBranchAccess>(res);
  }

  async updateBranchAccess(employeeId: string, branchIds: string[]): Promise<MutationResult<{ items: EmployeeBranchAccess[] }>> {
    return apiClient<MutationResult<{ items: EmployeeBranchAccess[] }>>(`/employees/${employeeId}/branches`, {
      method: "PUT",
      body: JSON.stringify({ branchIds }),
      ...auth(),
    });
  }

  async getPermissionState(employeeId: string): Promise<EmployeePermissionState> {
    const res = await apiClient<any>(`/employees/${employeeId}/permissions`, auth());
    return (res?.data ?? res) as EmployeePermissionState;
  }

  async updatePermissionState(employeeId: string, input: { roleIds: string[]; grantPermissionIds: string[]; denialPermissionIds: string[]; reason?: string }): Promise<MutationResult<{ authorization: EmployeePermissionState["authorization"] }>> {
    return apiClient<MutationResult<{ authorization: EmployeePermissionState["authorization"] }>>(`/employees/${employeeId}/permissions`, {
      method: "PUT",
      body: JSON.stringify(input),
      ...auth(),
    });
  }

  async getVerificationAttempts(employeeId: string, query: { page?: number; pageSize?: number } = {}): Promise<PaginatedResult<EmployeeVerificationAttempt>> {
    const res = await apiClient<any>(`/employees/${employeeId}/verification-attempts${buildQueryString(query)}`, auth());
    const data = res?.data ?? res;
    return {
      items: data.items || [],
      page: data.page || query.page || 1,
      pageSize: data.pageSize || query.pageSize || 25,
      total: data.total || 0,
      totalPages: data.totalPages || 0,
    };
  }
}

export class ApiOperatorRepository implements OperatorRepository {
  async current(): Promise<{ active: boolean; reason?: string | null; operatorSession: OperatorSessionState }> {
    const res = await apiClient<any>("/operator/current", auth());
    return res.data ?? res;
  }

  async verify(input: OperatorVerifyInput): Promise<MutationResult<OperatorVerifyResult>> {
    return apiClient<MutationResult<OperatorVerifyResult>>("/operator/verify", {
      method: "POST",
      body: JSON.stringify(input),
      ...auth(),
    });
  }

  async lock(reason = "manual_lock"): Promise<MutationResult<{ operatorSession: OperatorSessionState }>> {
    return apiClient<MutationResult<{ operatorSession: OperatorSessionState }>>("/operator/lock", {
      method: "POST",
      body: JSON.stringify({ reason }),
      ...auth(),
    });
  }

  async endSession(reason = "operator_session_ended"): Promise<MutationResult<{ operatorSession: OperatorSessionState }>> {
    return apiClient<MutationResult<{ operatorSession: OperatorSessionState }>>("/operator/end-session", {
      method: "POST",
      body: JSON.stringify({ reason }),
      ...auth(),
    });
  }
}

export class ApiAccountingRepository implements AccountingRepository {
  async listAccounts(): Promise<any[]> {
    const res = await apiClient<any>(`/accounts`, auth());
    return normalizeItems<any>(res);
  }

  async getAccountStatement(accountId: string, query: AccountStatementQuery = {}): Promise<AccountStatement> {
    const params = new URLSearchParams();
    if (query.from) params.append("from", query.from);
    if (query.to) params.append("to", query.to);
    if (query.page) params.append("page", String(query.page));
    if (query.pageSize) params.append("pageSize", String(query.pageSize));
    const qs = params.toString();
    const res = await apiClient<any>(
      `/accounts/${encodeURIComponent(accountId)}/statement${qs ? `?${qs}` : ""}`,
      auth(),
    );
    return (res?.data ?? res) as AccountStatement;
  }

  async getTrialBalance(query: TrialBalanceQuery = {}): Promise<TrialBalance> {
    const params = new URLSearchParams();
    if (query.asOf) params.append("asOf", query.asOf);
    if (query.includeZero) params.append("includeZero", String(query.includeZero));
    const qs = params.toString();
    const res = await apiClient<any>(
      `/reports/trial-balance${qs ? `?${qs}` : ""}`,
      auth(),
    );
    return (res?.data ?? res) as TrialBalance;
  }

  async getLedgerReconciliation(query: LedgerReconciliationQuery = {}): Promise<LedgerReconciliation> {
    const params = new URLSearchParams();
    if (query.asOf) params.append("asOf", query.asOf);
    if (query.includeZero !== undefined) params.append("includeZero", String(query.includeZero));
    if (query.onlyDifferences !== undefined) params.append("onlyDifferences", String(query.onlyDifferences));
    const qs = params.toString();
    const res = await apiClient<any>(
      `/reports/ledger-reconciliation${qs ? `?${qs}` : ""}`,
      auth(),
    );
    return (res?.data ?? res) as LedgerReconciliation;
  }

  async getAccountBalanceReconciliation(): Promise<AccountBalanceReconciliation> {
    const res = await apiClient<any>("/reports/account-balances/reconciliation", auth());
    return (res?.data ?? res) as AccountBalanceReconciliation;
  }

  async getAccountingLock(): Promise<AccountingDateLock> {
    const res = await apiClient<any>("/accounting/lock", auth());
    return (res?.data ?? res) as AccountingDateLock;
  }

  async setAccountingLock(input: { lockedThroughDate?: string | null; reason?: string | null }): Promise<MutationResult<AccountingDateLock>> {
    return apiClient<MutationResult<AccountingDateLock>>("/accounting/lock", {
      method: "PUT",
      body: JSON.stringify(input),
      ...auth(),
    });
  }

  async getCustomerStatementV2(customerId: string, query: CustomerStatementQuery = {}): Promise<CustomerStatement> {
    const params = new URLSearchParams();
    if (query.from) params.append("from", query.from);
    if (query.to) params.append("to", query.to);
    if (query.page) params.append("page", String(query.page));
    if (query.pageSize) params.append("pageSize", String(query.pageSize));
    const qs = params.toString();
    const res = await apiClient<any>(
      `/customers/${encodeURIComponent(customerId)}/statement-v2${qs ? `?${qs}` : ""}`,
      auth(),
    );
    return (res?.data ?? res) as CustomerStatement;
  }

  async getCustomerStatementV3(customerId: string, query: CustomerStatementQuery = {}): Promise<CustomerStatementV3Report> {
    const params = new URLSearchParams();
    if (query.from) params.append("from", query.from);
    if (query.to) params.append("to", query.to);
    const qs = params.toString();
    const res = await apiClient<any>(
      `/customers/${encodeURIComponent(customerId)}/statement-v3${qs ? `?${qs}` : ""}`,
      auth(),
    );
    return (res?.data ?? res) as CustomerStatementV3Report;
  }


  async getCustomerCreditReconciliation(customerId: string): Promise<CustomerCreditReconciliationReport> {
    const res = await apiClient<any>(
      `/customers/${encodeURIComponent(customerId)}/credit/reconciliation`,
      auth(),
    );
    return (res?.data ?? res) as CustomerCreditReconciliationReport;
  }

  async getSupplierStatement(supplierId: string, query: SupplierStatementQuery = {}): Promise<SupplierStatement> {
    const params = new URLSearchParams();
    if (query.from) params.append("from", query.from);
    if (query.to) params.append("to", query.to);
    if (query.page) params.append("page", String(query.page));
    if (query.pageSize) params.append("pageSize", String(query.pageSize));
    const qs = params.toString();
    const res = await apiClient<any>(
      `/suppliers/${encodeURIComponent(supplierId)}/statement${qs ? `?${qs}` : ""}`,
      auth(),
    );
    return (res?.data ?? res) as SupplierStatement;
  }

  async payPurchaseOrder(
    purchaseOrderId: string,
    input: SupplierPaymentInput,
    idempotencyKey: string,
  ): Promise<SupplierPaymentResult> {
    return apiClient<SupplierPaymentResult>(
      `/purchase-orders/${encodeURIComponent(purchaseOrderId)}/pay`,
      { method: "POST", body: JSON.stringify(input), idempotencyKey, ...auth() },
    );
  }

  async listJournalEntries(query: ListQuery): Promise<PaginatedResult<JournalEntry>> {
    const res = await apiClient<any>(
      `/journal-entries${buildQueryString(query)}`,
      auth(),
    );
    return normalizePage<JournalEntry>(res, { page: query.page, pageSize: query.pageSize });
  }

  async createJournalEntry(entry: JournalEntry): Promise<MutationResult<JournalEntry>> {
    return apiClient<MutationResult<JournalEntry>>("/journal-entries", {
      method: "POST",
      body: JSON.stringify(entry),
      ...auth(),
    });
  }

  async createManualJournalDraft(
    input: ManualJournalDraftInput,
  ): Promise<MutationResult<JournalEntry>> {
    return apiClient<MutationResult<JournalEntry>>("/journal-entries/manual-draft", {
      method: "POST",
      body: JSON.stringify(input),
      ...auth(),
    });
  }

  async postJournalEntry(id: string): Promise<MutationResult<JournalEntry>> {
    return apiClient<MutationResult<JournalEntry>>(
      `/journal-entries/${encodeURIComponent(id)}/post`,
      { method: "POST", ...auth() },
    );
  }

  async reverseJournalEntry(id: string): Promise<MutationResult<JournalEntry>> {
    return apiClient<MutationResult<JournalEntry>>(
      `/journal-entries/${encodeURIComponent(id)}/reverse`,
      { method: "POST", ...auth() },
    );
  }

  async cancelJournalDraft(id: string): Promise<MutationResult<{ id: string; deleted: boolean }>> {
    return apiClient<MutationResult<{ id: string; deleted: boolean }>>(
      `/journal-entries/${encodeURIComponent(id)}/cancel`,
      { method: "POST", ...auth() },
    );
  }
}

export class ApiAssetRepository implements AssetRepository {
  async list(query: ListQuery): Promise<PaginatedResult<Asset>> {
    const res = await apiClient<any>(`/assets${buildQueryString(query)}`, auth());
    return normalizePage<Asset>(res, { page: query.page, pageSize: query.pageSize });
  }
  async getById(id: string): Promise<Asset | null> {
    return apiClient<any>(`/assets/${id}`, auth())
      .then((res) => normalizeEntity<Asset>(res))
      .catch(() => null);
  }
  async create(asset: Asset): Promise<MutationResult<Asset>> {
    return apiClient<MutationResult<Asset>>("/assets", {
      method: "POST",
      body: JSON.stringify(asset),
      ...auth(),
    });
  }
  async update(id: string, updates: Partial<Asset>): Promise<MutationResult<Asset>> {
    return apiClient<MutationResult<Asset>>(`/assets/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
      ...auth(),
    });
  }
}
