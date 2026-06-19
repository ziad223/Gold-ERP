import type {
  CustomerRepository,
  SupplierRepository,
  EmployeeRepository,
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

  async create(customer: Customer): Promise<MutationResult<Customer>> {
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

  async create(supplier: Supplier): Promise<MutationResult<Supplier>> {
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

  async revokeSession(employeeId: string, sessionId: string): Promise<MutationResult<void>> {
    return apiClient<MutationResult<void>>(`/employees/${employeeId}/sessions/${sessionId}`, {
      method: "DELETE",
      ...auth(),
    });
  }
}

export class ApiAccountingRepository implements AccountingRepository {
  async listAccounts(): Promise<any[]> {
    const res = await apiClient<any>(`/accounts`, auth());
    return normalizeItems<any>(res);
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
