import type {
  Asset,
  Customer,
  Supplier,
  Employee,
  AuditLog,
  Transfer,
  ManufacturingOrder,
  CustomerGoldPool,
  InventoryGoldPool,
  JournalEntry,
  GoldPriceSnapshot,
  Reservation,
  ApprovalRequest,
  PurchaseOrder,
  AttachmentMetadata,
  SupplierConsignment,
  SupplierDocument,
} from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Unified Envelope & Queries
// ─────────────────────────────────────────────────────────────────────────────

export type ListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  filters?: Record<string, unknown>;
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type DomainError = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type MutationResult<T> = {
  success: boolean;
  data?: T;
  error?: DomainError;
};

// ─────────────────────────────────────────────────────────────────────────────
// Domain Repository Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface CustomerRepository {
  list(query: ListQuery): Promise<PaginatedResult<Customer>>;
  getById(id: string): Promise<Customer | null>;
  create(customer: Customer): Promise<MutationResult<Customer>>;
  update(id: string, updates: Partial<Customer>): Promise<MutationResult<Customer>>;
  deactivate(id: string, reason?: string): Promise<MutationResult<Customer>>;
  reactivate(id: string): Promise<MutationResult<Customer>>;
  delete(id: string): Promise<MutationResult<void>>;
  calculateStatement(id: string): Promise<{
    openingBalance: number;
    closingBalance: number;
    invoices: any[];
    receipts: any[];
    vatDue: number;
  }>;
}

export interface SupplierRepository {
  list(query: ListQuery): Promise<PaginatedResult<Supplier>>;
  getById(id: string): Promise<Supplier | null>;
  create(supplier: Supplier): Promise<MutationResult<Supplier>>;
  update(id: string, updates: Partial<Supplier>): Promise<MutationResult<Supplier>>;
  deactivate(id: string, reason?: string): Promise<MutationResult<Supplier>>;
  reactivate(id: string): Promise<MutationResult<Supplier>>;
  delete(id: string): Promise<MutationResult<void>>;
  getPurchaseOrders(supplierId: string): Promise<PurchaseOrder[]>;
  getConsignments(supplierId: string): Promise<SupplierConsignment[]>;
  getDocuments(supplierId: string): Promise<SupplierDocument[]>;
  uploadDocument(supplierId: string, name: string, type: string, expiryDate: string, file: File): Promise<MutationResult<SupplierDocument>>;
  deleteDocument(supplierId: string, docId: string): Promise<MutationResult<void>>;
}

export interface EmployeeRepository {
  list(query: ListQuery): Promise<PaginatedResult<Employee>>;
  getById(id: string): Promise<Employee | null>;
  create(employee: Employee): Promise<MutationResult<Employee>>;
  update(id: string, updates: Partial<Employee>): Promise<MutationResult<Employee>>;
  deactivate(id: string, reason?: string): Promise<MutationResult<Employee>>;
  reactivate(id: string): Promise<MutationResult<Employee>>;
  getSessions(employeeId: string): Promise<any[]>;
  revokeSession(employeeId: string, sessionId: string): Promise<MutationResult<void>>;
}

export interface AssetRepository {
  list(query: ListQuery): Promise<PaginatedResult<Asset>>;
  getById(id: string): Promise<Asset | null>;
  create(asset: Asset): Promise<MutationResult<Asset>>;
  update(id: string, updates: Partial<Asset>): Promise<MutationResult<Asset>>;
}

export interface InventoryRepository {
  listTransfers(query: ListQuery): Promise<PaginatedResult<Transfer>>;
  createTransfer(transfer: Transfer): Promise<MutationResult<Transfer>>;
  updateTransfer(id: string, updates: Partial<Transfer>): Promise<MutationResult<Transfer>>;
  
  listAdjustments(query: ListQuery): Promise<PaginatedResult<any>>;
  createAdjustment(adjustment: any): Promise<MutationResult<any>>;
}

export interface SalesRepository {
  listInvoices(query: ListQuery): Promise<PaginatedResult<any>>;
  getInvoiceById(id: string): Promise<any | null>;
  createInvoice(invoice: any): Promise<MutationResult<any>>;
  listReservations(query: ListQuery): Promise<PaginatedResult<Reservation>>;
  createReservation(reservation: Reservation): Promise<MutationResult<Reservation>>;
}

export interface ManufacturingRepository {
  listOrders(query: ListQuery): Promise<PaginatedResult<ManufacturingOrder>>;
  createOrder(order: ManufacturingOrder): Promise<MutationResult<ManufacturingOrder>>;
  updateOrder(id: string, updates: Partial<ManufacturingOrder>): Promise<MutationResult<ManufacturingOrder>>;
}

export interface AccountingRepository {
  listAccounts(): Promise<any[]>;
  listJournalEntries(query: ListQuery): Promise<PaginatedResult<JournalEntry>>;
  createJournalEntry(entry: JournalEntry): Promise<MutationResult<JournalEntry>>;
}

export interface ReportsRepository {
  getDashboardStats(): Promise<any>;
  getSalesByCategoryReport(): Promise<any>;
}

export interface AuditRepository {
  listLogs(query: ListQuery): Promise<PaginatedResult<AuditLog>>;
  logEvent(log: AuditLog): Promise<void>;
}

export interface SettingsRepository {
  getSettings(): Promise<any>;
  updateSettings(settings: any): Promise<MutationResult<any>>;
}

export interface UploadContext {
  userId: string;
  purpose: string;
  branch: string;
}

export interface FileStorageRepository {
  upload(file: File, context: UploadContext): Promise<AttachmentMetadata>;
  remove(id: string): Promise<void>;
  getDownloadUrl(id: string): Promise<string>;
}
