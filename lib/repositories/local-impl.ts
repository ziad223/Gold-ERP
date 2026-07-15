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
  AccountStatement,
  TrialBalance,
  LedgerReconciliation,
  CustomerStatement,
  CustomerCreditReconciliationReport,
  CustomerStatementV3Report,
  SupplierStatement,
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
  EmployeeBranchAccess,
  EmployeePermissionState,
  EmployeeVerificationAttempt,
  OperatorSessionState,
  OperatorStepUpInput,
  OperatorVerifyInput,
  OperatorVerifyResult,
  AuditAction,
} from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Phone Normalization Helper
// ─────────────────────────────────────────────────────────────────────────────

export function normalizePhone(phone: string): string {
  if (!phone) return "";
  return phone.replace(/[^\d]/g, "").replace(/^0+/, "");
}

function nextPrefixedId(existingIds: string[], prefix: string, width: number): string {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  const max = existingIds.reduce((currentMax, id) => {
    const match = pattern.exec(id);
    if (!match) return currentMax;
    return Math.max(currentMax, Number(match[1]) || 0);
  }, 0);
  return `${prefix}-${String(max + 1).padStart(width, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context interface for Local persistence
// ─────────────────────────────────────────────────────────────────────────────

export interface LocalRepoContext {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  invoices: any[];
  setInvoices: React.Dispatch<React.SetStateAction<any[]>>;
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  reservations: Reservation[];
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  logEvent: (
    action: AuditAction,
    entityType: string,
    entityId: string,
    description: string,
    before?: string,
    after?: string,
    reason?: string
  ) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers for local list query (Sorting, Pagination, Filtering)
// ─────────────────────────────────────────────────────────────────────────────

function paginateAndSort<T>(
  items: T[],
  query: ListQuery,
  searchFields: (item: T) => string[],
  sortFn?: (a: T, b: T, key: string, direction: "asc" | "desc") => number
): PaginatedResult<T> {
  let filtered = [...items];

  // Search
  if (query.search) {
    const s = query.search.toLowerCase().trim();
    filtered = filtered.filter((item) => {
      const fields = searchFields(item);
      return fields.some((f) => f && f.toLowerCase().includes(s));
    });
  }

  // Filter keys
  if (query.filters) {
    for (const [key, value] of Object.entries(query.filters)) {
      if (value === "all" || value === "" || value === undefined) continue;
      filtered = filtered.filter((item: any) => {
        if (key === "balance") {
          return value === "due" ? item.balance > 0 : item.balance === 0;
        }
        if (key === "due") {
          // A non-positive balance (incl. negatives) counts as "no dues".
          const due = Number(item.due) || 0;
          return value === "due" ? due > 0 : due <= 0;
        }
        return String(item[key]) === String(value);
      });
    }
  }

  // Sort
  if (query.sortBy) {
    const key = query.sortBy;
    const dir = query.sortDirection || "asc";
    if (sortFn) {
      filtered.sort((a, b) => sortFn(a, b, key, dir));
    } else {
      filtered.sort((a: any, b: any) => {
        const valA = a[key];
        const valB = b[key];
        if (typeof valA === "number" && typeof valB === "number") {
          return dir === "asc" ? valA - valB : valB - valA;
        }
        const strA = String(valA || "").toLowerCase();
        const strB = String(valB || "").toLowerCase();
        if (strA < strB) return dir === "asc" ? -1 : 1;
        if (strA > strB) return dir === "asc" ? 1 : -1;
        return 0;
      });
    }
  }

  const page = query.page || 1;
  const pageSize = query.pageSize || 10;
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const offset = (page - 1) * pageSize;
  const paginatedItems = filtered.slice(offset, offset + pageSize);

  return {
    items: paginatedItems,
    page,
    pageSize,
    total,
    totalPages,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Implementations
// ─────────────────────────────────────────────────────────────────────────────

export class LocalCustomerRepository implements CustomerRepository {
  constructor(private ctx: LocalRepoContext) {}

  async list(query: ListQuery): Promise<PaginatedResult<Customer>> {
    return paginateAndSort(
      this.ctx.customers,
      query,
      (c) => [c.id, c.name, c.phone, c.email || ""],
      (a, b, key, dir) => {
        if (key === "purchases" || key === "balance") {
          return dir === "asc" ? a[key] - b[key] : b[key] - a[key];
        }
        const valA = String(a[key as keyof Customer] || "").toLowerCase();
        const valB = String(b[key as keyof Customer] || "").toLowerCase();
        return dir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
    );
  }

  async getById(id: string): Promise<Customer | null> {
    const customer = this.ctx.customers.find((c) => c.id === id);
    return customer ? { ...customer } : null;
  }

  async create(customer: Omit<Customer, "id"> & Partial<Pick<Customer, "id">>): Promise<MutationResult<Customer>> {
    const customerId = customer.id || nextPrefixedId(this.ctx.customers.map((c) => c.id), "CUS", 4);

    // 1. Prevent duplicate ID
    if (this.ctx.customers.some((c) => c.id === customerId)) {
      return {
        success: false,
        error: {
          code: "DUPLICATE_ID",
          message: `المعرف ${customerId} مستخدم بالفعل / ID ${customerId} is already in use`,
        },
      };
    }

    // 2. Phone unique validation (normalized)
    const normNewPhone = normalizePhone(customer.phone);
    if (this.ctx.customers.some((c) => normalizePhone(c.phone) === normNewPhone)) {
      return {
        success: false,
        error: {
          code: "DUPLICATE_PHONE",
          message: "رقم الهاتف مسجل بالفعل لعميل آخر / Phone number is already registered for another customer",
          fieldErrors: { phone: ["رقم الهاتف مسجل بالفعل / Phone number is registered"] },
        },
      };
    }

    // Default status to active if not provided
    const newCustomer = {
      ...customer,
      id: customerId,
      status: customer.status || "active",
      attachments: customer.attachments || [],
      kycDetails: customer.kycDetails || { status: "not-started", amlStatus: "clear" },
    };

    // Immutably append
    this.ctx.setCustomers((current) => [newCustomer, ...current]);

    // Local Audit Log
    this.ctx.logEvent(
      "createCustomer",
      "Customer",
      customerId,
      `تم إنشاء العميل ${customer.name}`,
      undefined,
      JSON.stringify(newCustomer)
    );

    return { success: true, data: newCustomer };
  }

  async update(id: string, updates: Partial<Customer>): Promise<MutationResult<Customer>> {
    const existing = this.ctx.customers.find((c) => c.id === id);
    if (!existing) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "العميل غير موجود / Customer not found" },
      };
    }

    // If phone is updated, check uniqueness
    if (updates.phone) {
      const normNewPhone = normalizePhone(updates.phone);
      if (
        this.ctx.customers.some(
          (c) => c.id !== id && normalizePhone(c.phone) === normNewPhone
        )
      ) {
        return {
          success: false,
          error: {
            code: "DUPLICATE_PHONE",
            message: "رقم الهاتف مسجل بالفعل لعميل آخر / Phone number is already registered for another customer",
            fieldErrors: { phone: ["رقم الهاتف مسجل بالفعل / Phone number is registered"] },
          },
        };
      }
    }

    const beforeState = JSON.stringify(existing);
    let updated: Customer = existing;

    this.ctx.setCustomers((current) =>
      current.map((c) => {
        if (c.id === id) {
          updated = { ...c, ...updates };
          return updated;
        }
        return c;
      })
    );

    // Local Audit Log
    this.ctx.logEvent(
      "updateCustomer",
      "Customer",
      id,
      `تم تحديث بيانات العميل ${existing.name}`,
      beforeState,
      JSON.stringify(updated)
    );

    return { success: true, data: updated };
  }

  async deactivate(id: string, reason?: string): Promise<MutationResult<Customer>> {
    return this.update(id, { status: "inactive", notes: reason || "تم التعطيل" });
  }

  async reactivate(id: string): Promise<MutationResult<Customer>> {
    return this.update(id, { status: "active" });
  }

  async delete(id: string): Promise<MutationResult<void>> {
    const existing = this.ctx.customers.find((c) => c.id === id);
    if (!existing) {
      return { success: false, error: { code: "not_found", message: "Customer not found" } };
    }
    this.ctx.setCustomers((current) => current.filter((c) => c.id !== id));
    this.ctx.logEvent("deleteCustomer", "Customer", id, `تم حذف العميل ${existing.name}`, JSON.stringify(existing), "");
    return { success: true };
  }

  async calculateStatement(id: string): Promise<{
    openingBalance: number;
    closingBalance: number;
    invoices: any[];
    receipts: any[];
    vatDue: number;
  }> {
    // Local preview calculator — not final accounting representation
    const customer = this.ctx.customers.find((c) => c.id === id);
    if (!customer) {
      return { openingBalance: 0, closingBalance: 0, invoices: [], receipts: [], vatDue: 0 };
    }
    const customerInvoices = this.ctx.invoices.filter((inv) => inv.customerId === id);
    
    // Calculate total VAT
    const vatDue = customerInvoices.reduce((sum, inv) => sum + (inv.tax || 0), 0);
    
    return {
      openingBalance: 0,
      closingBalance: customer.balance,
      invoices: customerInvoices,
      receipts: customerInvoices.filter((inv) => inv.status === "paid"),
      vatDue,
    };
  }
}

export class LocalSupplierRepository implements SupplierRepository {
  constructor(private ctx: LocalRepoContext) {}

  async list(query: ListQuery): Promise<PaginatedResult<Supplier>> {
    return paginateAndSort(
      this.ctx.suppliers,
      query,
      (s) => [s.id, s.name, s.category, s.phone],
      (a, b, key, dir) => {
        if (key === "due" || key === "rating") {
          return dir === "asc" ? a[key] - b[key] : b[key] - a[key];
        }
        const valA = String(a[key as keyof Supplier] || "").toLowerCase();
        const valB = String(b[key as keyof Supplier] || "").toLowerCase();
        return dir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
    );
  }

  async getById(id: string): Promise<Supplier | null> {
    const supplier = this.ctx.suppliers.find((s) => s.id === id);
    return supplier ? { ...supplier } : null;
  }

  async create(supplier: Omit<Supplier, "id"> & Partial<Pick<Supplier, "id">>): Promise<MutationResult<Supplier>> {
    const supplierId = supplier.id || nextPrefixedId(this.ctx.suppliers.map((s) => s.id), "SUP", 3);

    if (this.ctx.suppliers.some((s) => s.id === supplierId)) {
      return {
        success: false,
        error: { code: "DUPLICATE_ID", message: `المعرف ${supplierId} مستخدم بالفعل` },
      };
    }

    const normNewPhone = normalizePhone(supplier.phone);
    if (this.ctx.suppliers.some((s) => normalizePhone(s.phone) === normNewPhone)) {
      return {
        success: false,
        error: {
          code: "DUPLICATE_PHONE",
          message: "رقم الهاتف مسجل لمورد آخر / Phone number is already registered for another supplier",
          fieldErrors: { phone: ["رقم الهاتف مسجل بالفعل / Phone number is registered"] },
        },
      };
    }

    const newSupplier: Supplier = {
      ...supplier,
      id: supplierId,
      status: supplier.status || "active",
      consignments: supplier.consignments || [],
      documents: supplier.documents || [],
    };

    this.ctx.setSuppliers((current) => [newSupplier, ...current]);

    this.ctx.logEvent(
      "createSupplier",
      "Supplier",
      supplierId,
      `تم إنشاء المورد ${supplier.name}`,
      undefined,
      JSON.stringify(newSupplier)
    );

    return { success: true, data: newSupplier };
  }

  async update(id: string, updates: Partial<Supplier>): Promise<MutationResult<Supplier>> {
    const existing = this.ctx.suppliers.find((s) => s.id === id);
    if (!existing) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "المورد غير موجود / Supplier not found" },
      };
    }

    if (updates.phone) {
      const normNewPhone = normalizePhone(updates.phone);
      if (
        this.ctx.suppliers.some(
          (s) => s.id !== id && normalizePhone(s.phone) === normNewPhone
        )
      ) {
        return {
          success: false,
          error: {
            code: "DUPLICATE_PHONE",
            message: "رقم الهاتف مسجل لمورد آخر / Phone number is already registered for another supplier",
            fieldErrors: { phone: ["رقم الهاتف مسجل بالفعل / Phone number is registered"] },
          },
        };
      }
    }

    const beforeState = JSON.stringify(existing);
    let updated: Supplier = existing;

    this.ctx.setSuppliers((current) =>
      current.map((s) => {
        if (s.id === id) {
          updated = { ...s, ...updates };
          return updated;
        }
        return s;
      })
    );

    this.ctx.logEvent(
      "updateSupplier",
      "Supplier",
      id,
      `تم تحديث بيانات المورد ${existing.name}`,
      beforeState,
      JSON.stringify(updated)
    );

    return { success: true, data: updated };
  }

  async deactivate(id: string, reason?: string): Promise<MutationResult<Supplier>> {
    return this.update(id, { status: "inactive", notes: reason || "تم التعطيل" });
  }

  async reactivate(id: string): Promise<MutationResult<Supplier>> {
    return this.update(id, { status: "active" });
  }

  async delete(id: string): Promise<MutationResult<void>> {
    const existing = this.ctx.suppliers.find((s) => s.id === id);
    if (!existing) {
      return { success: false, error: { code: "not_found", message: "Supplier not found" } };
    }
    this.ctx.setSuppliers((current) => current.filter((s) => s.id !== id));
    this.ctx.logEvent("deleteSupplier", "Supplier", id, `تم حذف المورد ${existing.name}`, JSON.stringify(existing), "");
    return { success: true };
  }

  async getPurchaseOrders(supplierId: string): Promise<PurchaseOrder[]> {
    return this.ctx.purchaseOrders.filter((po) => po.supplierId === supplierId);
  }

  async getConsignments(supplierId: string): Promise<SupplierConsignment[]> {
    const s = this.ctx.suppliers.find((item) => item.id === supplierId);
    return s?.consignments || [];
  }

  async getDocuments(supplierId: string): Promise<SupplierDocument[]> {
    const s = this.ctx.suppliers.find((item) => item.id === supplierId);
    return s?.documents || [];
  }

  async uploadDocument(supplierId: string, name: string, type: string, expiryDate: string, file: File): Promise<MutationResult<SupplierDocument>> {
    const supplier = this.ctx.suppliers.find((s) => s.id === supplierId);
    if (!supplier) {
      return { success: false, error: { code: "NOT_FOUND", message: "المورد غير موجود / Supplier not found" } };
    }

    try {
      const base64Url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });

      const newDoc: SupplierDocument = {
        id: `DOC-${Date.now()}`,
        name,
        type,
        expiryDate,
        url: base64Url,
        fileName: file.name,
        originalFileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        uploadedBy: "Local User",
        uploadedAt: new Date().toISOString()
      };

      const updatedDocs = [...(supplier.documents || []), newDoc];
      await this.update(supplierId, { documents: updatedDocs });

      return { success: true, data: newDoc };
    } catch (err: any) {
      return { success: false, error: { code: "UPLOAD_FAILED", message: err?.message || "Failed to process file" } };
    }
  }

  async deleteDocument(supplierId: string, docId: string): Promise<MutationResult<void>> {
    const supplier = this.ctx.suppliers.find((s) => s.id === supplierId);
    if (!supplier) {
      return { success: false, error: { code: "NOT_FOUND", message: "المورد غير موجود / Supplier not found" } };
    }

    const updatedDocs = (supplier.documents || []).filter((d) => d.id !== docId);
    await this.update(supplierId, { documents: updatedDocs });

    return { success: true };
  }
}

export class LocalEmployeeRepository implements EmployeeRepository {
  constructor(private ctx: LocalRepoContext) {}

  async list(query: ListQuery): Promise<PaginatedResult<Employee>> {
    return paginateAndSort(
      this.ctx.employees,
      query,
      (e) => [e.id, e.name, e.role, e.branch],
      (a, b, key, dir) => {
        const valA = String(a[key as keyof Employee] || "").toLowerCase();
        const valB = String(b[key as keyof Employee] || "").toLowerCase();
        return dir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
    );
  }

  async getById(id: string): Promise<Employee | null> {
    const employee = this.ctx.employees.find((e) => e.id === id);
    return employee ? { ...employee } : null;
  }

  async create(employee: Employee): Promise<MutationResult<Employee>> {
    if (this.ctx.employees.some((e) => e.id === employee.id)) {
      return {
        success: false,
        error: { code: "DUPLICATE_ID", message: `المعرف ${employee.id} مستخدم بالفعل` },
      };
    }

    if (employee.phone) {
      const normNewPhone = normalizePhone(employee.phone);
      if (this.ctx.employees.some((e) => e.phone && normalizePhone(e.phone) === normNewPhone)) {
        return {
          success: false,
          error: {
            code: "DUPLICATE_PHONE",
            message: "رقم الهاتف مسجل لموظف آخر / Phone number is already registered for another employee",
          },
        };
      }
    }

    const newEmployee: Employee = {
      ...employee,
      status: employee.status || "present", // present is active default
      sessions: employee.sessions || [
        {
          id: `SES-${Date.now()}`,
          deviceName: "Google Chrome / Windows",
          browser: "Chrome",
          location: "Dubai, UAE",
          lastActive: new Date().toISOString().slice(0, 16).replace("T", " "),
          isCurrent: false,
        },
      ],
      approvalLimitsDetail: employee.approvalLimitsDetail || {
        discountLimit: employee.approvalLimit || 5000,
        priceOverrideLimit: 10000,
        refundLimit: 2000,
        journalLimit: 50000,
        adjustmentLimit: 5,
        goldPurchaseLimit: 100000,
      },
    };

    this.ctx.setEmployees((current) => [...current, newEmployee]);

    this.ctx.logEvent(
      "createEmployee",
      "Employee",
      employee.id,
      `تم إنشاء الموظف ${employee.name}`,
      undefined,
      JSON.stringify(newEmployee)
    );

    return { success: true, data: newEmployee };
  }

  async update(id: string, updates: Partial<Employee>): Promise<MutationResult<Employee>> {
    const existing = this.ctx.employees.find((e) => e.id === id);
    if (!existing) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "الموظف غير موجود / Employee not found" },
      };
    }

    if (updates.phone) {
      const normNewPhone = normalizePhone(updates.phone);
      if (
        this.ctx.employees.some(
          (e) => e.id !== id && e.phone && normalizePhone(e.phone) === normNewPhone
        )
      ) {
        return {
          success: false,
          error: {
            code: "DUPLICATE_PHONE",
            message: "رقم الهاتف مسجل لموظف آخر / Phone number is already registered for another employee",
          },
        };
      }
    }

    const beforeState = JSON.stringify(existing);
    let updated: Employee = existing;

    this.ctx.setEmployees((current) =>
      current.map((e) => {
        if (e.id === id) {
          updated = { ...e, ...updates };
          return updated;
        }
        return e;
      })
    );

    this.ctx.logEvent(
      "updateEmployee",
      "Employee",
      id,
      `تم تحديث بيانات الموظف ${existing.name}`,
      beforeState,
      JSON.stringify(updated)
    );

    return { success: true, data: updated };
  }

  async deactivate(id: string, reason?: string): Promise<MutationResult<Employee>> {
    // Excludes deactivated from cashier/active selectors by changing status to inactive
    return this.update(id, { status: "inactive", deactivateReason: reason || "تم التعطيل" });
  }

  async reactivate(id: string): Promise<MutationResult<Employee>> {
    return this.update(id, { status: "present", deactivateReason: undefined });
  }

  async getSessions(employeeId: string): Promise<EmployeeSession[]> {
    const emp = this.ctx.employees.find((e) => e.id === employeeId);
    return emp?.sessions || [];
  }

  async getOperatorSessions(_employeeId: string, query: { page?: number; pageSize?: number } = {}): Promise<PaginatedResult<any>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 25;
    return { items: [], page, pageSize, total: 0, totalPages: 0 };
  }

  async revokeSession(employeeId: string, sessionId: string): Promise<MutationResult<void>> {
    const emp = this.ctx.employees.find((e) => e.id === employeeId);
    if (!emp) {
      return { success: false, error: { code: "NOT_FOUND", message: "الموظف غير موجود" } };
    }

    const beforeState = JSON.stringify(emp);
    const updatedSessions = (emp.sessions || []).filter((s) => s.id !== sessionId);

    this.ctx.setEmployees((current) =>
      current.map((e) => (e.id === employeeId ? { ...e, sessions: updatedSessions } : e))
    );

    this.ctx.logEvent(
      "revokeSession",
      "Employee",
      employeeId,
      `تم إلغاء الجلسة ${sessionId} للموظف ${emp.name}`,
      beforeState,
      JSON.stringify({ ...emp, sessions: updatedSessions })
    );

    return { success: true };
  }

  async resetCredential(employeeId: string, pin: string): Promise<MutationResult<any>> {
    if (!/^\d{6}$/.test(pin)) {
      return { success: false, error: { code: "VALIDATION_FAILED", message: "PIN must be exactly 6 digits" } };
    }
    const employee = this.ctx.employees.find((e) => e.id === employeeId);
    if (!employee) {
      return { success: false, error: { code: "NOT_FOUND", message: "الموظف غير موجود / Employee not found" } };
    }
    return {
      success: true,
      data: {
        employee: {
          id: employeeId,
          employeeCode: employee.employeeCode || employee.id,
          credentialStatus: "active",
        },
      },
    };
  }

  async unlockCredential(_employeeId: string): Promise<MutationResult<any>> {
    return { success: true } as MutationResult<any>;
  }

  async revokeOperatorSessions(_employeeId: string): Promise<MutationResult<any>> {
    return { success: true } as MutationResult<any>;
  }

  async changeEmployeeCode(employeeId: string, employeeCode: string): Promise<MutationResult<any>> {
    const employee = this.ctx.employees.find((item) => item.id === employeeId);
    if (employee) employee.employeeCode = employeeCode;
    return { success: true, data: employee } as MutationResult<any>;
  }

  async getEmployeeCodeHistory(_employeeId: string): Promise<Array<{ id: string; oldCode?: string | null; newCode?: string | null; reason?: string | null; createdAt?: string | null }>> {
    return [];
  }

  async changeOwnPin(_input: { currentPin: string; newPin: string; confirmation: string }): Promise<MutationResult<any>> {
    return { success: true } as MutationResult<any>;
  }

  async getBranchAccess(employeeId: string): Promise<EmployeeBranchAccess[]> {
    const employee = this.ctx.employees.find((e) => e.id === employeeId);
    if (!employee?.branchId) return [];
    return [{
      id: `LOCAL-EBA-${employeeId}-${employee.branchId}`,
      employeeId,
      branchId: employee.branchId,
      active: true,
    }];
  }

  async updateBranchAccess(employeeId: string, branchIds: string[]): Promise<MutationResult<{ items: EmployeeBranchAccess[] }>> {
    const employee = this.ctx.employees.find((e) => e.id === employeeId);
    if (!employee) {
      return { success: false, error: { code: "NOT_FOUND", message: "الموظف غير موجود / Employee not found" } };
    }
    const items = branchIds.map((branchId) => ({
      id: `LOCAL-EBA-${employeeId}-${branchId}`,
      employeeId,
      branchId,
      active: true,
    }));
    return { success: true, data: { items } };
  }

  async getPermissionState(employeeId: string): Promise<EmployeePermissionState> {
    return {
      roles: [],
      grants: [],
      denials: [],
      authorization: {
        rolePermissionNames: [],
        directGrantNames: [],
        directDenialNames: [],
        effectivePermissionNames: [],
      },
    };
  }

  async updatePermissionState(
    employeeId: string,
    payload: { roleIds: string[]; grantPermissionIds: string[]; denialPermissionIds: string[]; reason?: string }
  ): Promise<MutationResult<{ authorization: EmployeePermissionState["authorization"] }>> {
    const grantIds = payload.grantPermissionIds || [];
    const denialIds = payload.denialPermissionIds || [];
    if (grantIds.some((id) => denialIds.includes(id))) {
      return { success: false, error: { code: "VALIDATION_FAILED", message: "Permission cannot be both granted and denied" } };
    }
    return {
      success: true,
      data: {
        authorization: {
          rolePermissionNames: [],
          directGrantNames: grantIds,
          directDenialNames: denialIds,
          effectivePermissionNames: grantIds.filter((id) => !denialIds.includes(id)),
        },
      },
    };
  }

  async getVerificationAttempts(employeeId: string, query: { page?: number; pageSize?: number } = {}): Promise<PaginatedResult<EmployeeVerificationAttempt>> {
    return paginateAndSort(
      [] as EmployeeVerificationAttempt[],
      query,
      (attempt) => [attempt.id, attempt.result, attempt.createdAt || ""]
    );
  }
}

export class LocalOperatorRepository implements OperatorRepository {
  private session: OperatorSessionState = {
    state: "inactive",
    reason: "LOCAL_MODE",
    sessionId: null,
    employee: null,
    verificationLevel: 0,
  };

  async current(): Promise<{ active: boolean; reason?: string | null; operatorSession: OperatorSessionState }> {
    return { active: this.session.state === "active", reason: this.session.reason, operatorSession: this.session };
  }

  async verify(input: OperatorVerifyInput): Promise<MutationResult<OperatorVerifyResult>> {
    const now = new Date().toISOString();
    this.session = {
      state: "active",
      sessionId: `LOCAL-EOS-${Date.now()}`,
      employee: {
        id: input.employeeCode,
        employeeCode: input.employeeCode,
        name: input.employeeCode,
        status: "present",
        branchId: input.branchId,
      },
      verificationLevel: input.requestedLevel || 1,
      verifiedAt: now,
      level2VerifiedAt: input.requestedLevel === 2 ? now : null,
      idleExpiresAt: now,
      absoluteExpiresAt: now,
    };
    return {
      success: true,
      data: {
        employee: this.session.employee!,
        verification: { level: this.session.verificationLevel, verifiedAt: now, expiresAt: now },
        operatorSession: this.session,
      },
    };
  }

  async authorizeAction(_input: OperatorStepUpInput): Promise<MutationResult<{ operatorSession: OperatorSessionState; employee: OperatorVerifyResult["employee"]; verificationAttemptId?: string }>> {
    const now = new Date().toISOString();
    this.session = { ...this.session, state: "active", verificationLevel: 2, level2VerifiedAt: now };
    return { success: true, data: { operatorSession: this.session, employee: this.session.employee! } };
  }

  async lock(reason = "manual_lock"): Promise<MutationResult<{ operatorSession: OperatorSessionState }>> {
    this.session = { ...this.session, state: "locked", reason, lockedAt: new Date().toISOString() };
    return { success: true, data: { operatorSession: this.session } };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeletal Local implementations for remaining repositories
// ─────────────────────────────────────────────────────────────────────────────

export class LocalAssetRepository implements AssetRepository {
  constructor(private ctx: LocalRepoContext) {}
  async list(query: ListQuery): Promise<PaginatedResult<Asset>> {
    return paginateAndSort(this.ctx.assets, query, (a) => [a.id, a.name, a.barcode]);
  }
  async getById(id: string): Promise<Asset | null> {
    return this.ctx.assets.find((a) => a.id === id) || null;
  }
  async create(asset: Asset): Promise<MutationResult<Asset>> {
    this.ctx.setAssets((curr) => [asset, ...curr]);
    return { success: true, data: asset };
  }
  async update(id: string, updates: Partial<Asset>): Promise<MutationResult<Asset>> {
    let updated: Asset | undefined;
    this.ctx.setAssets((curr) =>
      curr.map((a) => {
        if (a.id === id) {
          updated = { ...a, ...updates };
          return updated;
        }
        return a;
      })
    );
    return updated ? { success: true, data: updated } : { success: false, error: { code: "NOT_FOUND", message: "Asset not found" } };
  }
}

export class LocalInventoryRepository implements InventoryRepository {
  constructor(private ctx: LocalRepoContext) {}
  async listTransfers(query: ListQuery): Promise<PaginatedResult<Transfer>> {
    return { items: [], page: 1, pageSize: 10, total: 0, totalPages: 0 };
  }
  async createTransfer(transfer: Transfer): Promise<MutationResult<Transfer>> {
    return { success: true, data: transfer };
  }
  async updateTransfer(id: string, updates: Partial<Transfer>): Promise<MutationResult<Transfer>> {
    return { success: false };
  }
  async listAdjustments(query: ListQuery): Promise<PaginatedResult<any>> {
    return { items: [], page: 1, pageSize: 10, total: 0, totalPages: 0 };
  }
  async createAdjustment(adjustment: any): Promise<MutationResult<any>> {
    return { success: true, data: adjustment };
  }
}

export class LocalSalesRepository implements SalesRepository {
  constructor(private ctx: LocalRepoContext) {}
  async listInvoices(query: ListQuery): Promise<PaginatedResult<any>> {
    return paginateAndSort(this.ctx.invoices, query, (i) => [i.id, i.customerName]);
  }
  async getInvoiceById(id: string): Promise<any | null> {
    return this.ctx.invoices.find((i) => i.id === id) || null;
  }
  async createInvoice(invoice: any): Promise<MutationResult<any>> {
    this.ctx.setInvoices((curr) => [invoice, ...curr]);
    return { success: true, data: invoice };
  }
  async listReservations(query: ListQuery): Promise<PaginatedResult<Reservation>> {
    return paginateAndSort(this.ctx.reservations, query, (r) => [r.id, r.customerName]);
  }
  async createReservation(reservation: Reservation): Promise<MutationResult<Reservation>> {
    this.ctx.setReservations((curr) => [reservation, ...curr]);
    return { success: true, data: reservation };
  }
}

export class LocalManufacturingRepository implements ManufacturingRepository {
  constructor(private ctx: LocalRepoContext) {}
  async listOrders(query: ListQuery): Promise<PaginatedResult<ManufacturingOrder>> {
    return { items: [], page: 1, pageSize: 10, total: 0, totalPages: 0 };
  }
  async createOrder(order: ManufacturingOrder): Promise<MutationResult<ManufacturingOrder>> {
    return { success: true, data: order };
  }
  async updateOrder(id: string, updates: Partial<ManufacturingOrder>): Promise<MutationResult<ManufacturingOrder>> {
    return { success: false };
  }
}

export class LocalAccountingRepository implements AccountingRepository {
  constructor(private ctx: LocalRepoContext) {}
  async listAccounts(): Promise<any[]> {
    return [];
  }
  async getAccountStatement(): Promise<AccountStatement> {
    // GL account statements require the API ledger; unsupported in mock/local.
    throw new Error("Account statement is only available in API mode.");
  }
  async getTrialBalance(): Promise<TrialBalance> {
    // Trial balance requires the API ledger; unsupported in mock/local.
    throw new Error("Trial balance is only available in API mode.");
  }
  async getLedgerReconciliation(): Promise<LedgerReconciliation> {
    // Ledger reconciliation requires the API ledger; unsupported in mock/local.
    throw new Error("Ledger reconciliation is only available in API mode.");
  }
  async getCustomerStatementV2(): Promise<CustomerStatement> {
    // Customer sub-ledger statements require the API; unsupported in mock/local.
    throw new Error("Customer statement is only available in API mode.");
  }
  async getCustomerStatementV3(): Promise<CustomerStatementV3Report> {
    // Customer sub-ledger statements require the API; unsupported in mock/local.
    throw new Error("Customer statement v3 is only available in API mode.");
  }
  async getCustomerCreditReconciliation(): Promise<CustomerCreditReconciliationReport> {
    // Customer credit reconciliation requires the API; unsupported in mock/local.
    throw new Error("Customer credit reconciliation is only available in API mode.");
  }
  async getSupplierStatement(): Promise<SupplierStatement> {
    // Supplier sub-ledger statements require the API; unsupported in mock/local.
    throw new Error("Supplier statement is only available in API mode.");
  }
  async payPurchaseOrder(): Promise<SupplierPaymentResult> {
    // Supplier payments require the API; unsupported in mock/local.
    return {
      success: false,
      error: { code: "not-supported", message: "Supplier payments are only available in API mode." },
    };
  }
  async listJournalEntries(query: ListQuery): Promise<PaginatedResult<JournalEntry>> {
    return { items: [], page: 1, pageSize: 10, total: 0, totalPages: 0 };
  }
  async createJournalEntry(entry: JournalEntry): Promise<MutationResult<JournalEntry>> {
    return { success: true, data: entry };
  }
  async createManualJournalDraft(): Promise<MutationResult<JournalEntry>> {
    // Manual journal drafts are an API-mode feature only. In mock/local mode we
    // do NOT fabricate or persist entries (no darfus-journals-v1) — the caller
    // surfaces a clear "API mode only" message instead.
    return {
      success: false,
      error: {
        code: "not-supported",
        message: "Manual journal drafts are only available in API mode.",
      },
    };
  }
  async postJournalEntry(): Promise<MutationResult<JournalEntry>> {
    // Posting moves real account balances and is an API-mode feature only.
    return {
      success: false,
      error: {
        code: "not-supported",
        message: "Posting journal entries is only available in API mode.",
      },
    };
  }
  async reverseJournalEntry(): Promise<MutationResult<JournalEntry>> {
    // Reversal moves real account balances and is an API-mode feature only.
    return {
      success: false,
      error: {
        code: "not-supported",
        message: "Reversing journal entries is only available in API mode.",
      },
    };
  }
  async cancelJournalDraft(): Promise<MutationResult<{ id: string; deleted: boolean }>> {
    // Cancelling drafts is an API-mode feature only.
    return {
      success: false,
      error: {
        code: "not-supported",
        message: "Cancelling journal drafts is only available in API mode.",
      },
    };
  }
}

export class LocalReportsRepository implements ReportsRepository {
  constructor(private ctx: LocalRepoContext) {}
  async getDashboardStats(): Promise<any> {
    return {};
  }
  async getSalesByCategoryReport(): Promise<any> {
    return {};
  }
}

export class LocalAuditRepository implements AuditRepository {
  constructor(private ctx: LocalRepoContext) {}
  async listLogs(query: ListQuery): Promise<PaginatedResult<AuditLog>> {
    return paginateAndSort(this.ctx.auditLogs, query, (l) => [l.id, l.description, l.user]);
  }
  async logEvent(log: AuditLog): Promise<void> {
    this.ctx.setAuditLogs((curr) => [log, ...curr]);
  }
}

export class LocalSettingsRepository implements SettingsRepository {
  constructor(private ctx: LocalRepoContext) {}
  async getSettings(): Promise<any> {
    return {};
  }
  async updateSettings(settings: any): Promise<MutationResult<any>> {
    return { success: true, data: settings };
  }
}
