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
  create(customer: Omit<Customer, "id"> & Partial<Pick<Customer, "id">>): Promise<MutationResult<Customer>>;
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
  create(supplier: Omit<Supplier, "id"> & Partial<Pick<Supplier, "id">>): Promise<MutationResult<Supplier>>;
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

export interface ManualJournalDraftLineInput {
  accountId: string;
  debit: number;
  credit: number;
  memo?: string;
}

export interface ManualJournalDraftInput {
  date: string;
  description: string;
  reference?: string;
  lines: ManualJournalDraftLineInput[];
}

export interface AccountStatementRow {
  journalEntryId: string;
  journalLineId: string;
  date: string;
  description?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  branchId?: string | null;
  debit: number;
  credit: number;
  delta: number;
  runningBalance: number;
}

export interface AccountStatement {
  account: { id: string; code: string; name: string; nameAr?: string; nature: string; balance: number };
  from: string | null;
  to: string | null;
  openingBalance: number;
  closingBalance: number;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: AccountStatementRow[];
}

export interface AccountStatementQuery {
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface TrialBalanceRow {
  accountId: string;
  code: string;
  name: string;
  nameAr?: string;
  type: string;
  nature: string;
  currentBalance: number;
  debitTotal: number;
  creditTotal: number;
  calculatedBalance: number;
  netDebit: number;
  netCredit: number;
  difference: number;
}

export interface TrialBalance {
  asOf: string | null;
  includeZero: boolean;
  accountCount: number;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  totalDifference: number;
  items: TrialBalanceRow[];
}

export interface TrialBalanceQuery {
  asOf?: string;
  includeZero?: boolean;
}

export interface LedgerReconciliationRow {
  accountId: string;
  code: string;
  name: string;
  nameAr?: string;
  type: string;
  nature: string;
  currentBalance: number;
  debitTotal: number;
  creditTotal: number;
  calculatedBalance: number;
  difference: number;
  status: "matched" | "difference";
}

export interface LedgerReconciliation {
  asOf: string | null;
  includeZero: boolean;
  onlyDifferences: boolean;
  accountCount: number;
  differenceCount: number;
  totalAbsoluteDifference: number;
  hasDifferences: boolean;
  items: LedgerReconciliationRow[];
}

export interface LedgerReconciliationQuery {
  asOf?: string;
  includeZero?: boolean;
  onlyDifferences?: boolean;
}

export interface CustomerStatementRow {
  id: string;
  type: string;
  sourceId: string;
  sourceNumber: string;
  date: string;
  description?: string | null;
  debit: number;
  credit: number;
  delta: number;
  runningBalance: number;
}

export interface CustomerStatement {
  customer: { id: string; code: string | null; name: string; phone?: string | null; balance: number };
  from: string | null;
  to: string | null;
  openingBalance: number;
  closingBalance: number;
  customerBalanceReference: number;
  difference: number;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: CustomerStatementRow[];
  meta: { source: string; ledgerBased: boolean; readOnly: boolean };
}

export interface CustomerStatementQuery {
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface SupplierStatementRow {
  id: string;
  type: string;
  sourceId: string;
  sourceNumber: string;
  date: string;
  description?: string | null;
  debit: number;
  credit: number;
  delta: number;
  runningBalance: number;
}

export interface SupplierStatement {
  supplier: { id: string; name: string; phone?: string | null; due: number };
  from: string | null;
  to: string | null;
  openingBalance: number;
  closingBalance: number;
  supplierDueReference: number;
  difference: number;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: SupplierStatementRow[];
  meta: { source: string; ledgerBased: boolean; readOnly: boolean; dueReferenceReliable: boolean };
}

export interface SupplierStatementQuery {
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface AccountingRepository {
  listAccounts(): Promise<any[]>;
  // Phase 9C — read-only GL account statement. Hits GET
  // /accounts/:id/statement. Mock/local mode does not support it.
  getAccountStatement(accountId: string, query?: AccountStatementQuery): Promise<AccountStatement>;
  // Phase 9E — read-only trial balance. Hits GET /reports/trial-balance.
  // Mock/local mode does not support it.
  getTrialBalance(query?: TrialBalanceQuery): Promise<TrialBalance>;
  // Phase 9G — read-only ledger reconciliation. Hits GET
  // /reports/ledger-reconciliation. Mock/local mode does not support it.
  getLedgerReconciliation(query?: LedgerReconciliationQuery): Promise<LedgerReconciliation>;
  // Phase 10C — read-only customer sub-ledger statement. Hits GET
  // /customers/:id/statement-v2. Mock/local mode does not support it.
  getCustomerStatementV2(customerId: string, query?: CustomerStatementQuery): Promise<CustomerStatement>;
  // Phase 10F — read-only supplier sub-ledger statement. Hits GET
  // /suppliers/:id/statement. Mock/local mode does not support it.
  getSupplierStatement(supplierId: string, query?: SupplierStatementQuery): Promise<SupplierStatement>;
  listJournalEntries(query: ListQuery): Promise<PaginatedResult<JournalEntry>>;
  createJournalEntry(entry: JournalEntry): Promise<MutationResult<JournalEntry>>;
  // Phase 8D3 — create a balanced manual journal entry as a DRAFT only.
  // Hits the dedicated POST /journal-entries/manual-draft endpoint (never the
  // rejected generic create). Mock/local mode does not support it.
  createManualJournalDraft(input: ManualJournalDraftInput): Promise<MutationResult<JournalEntry>>;
  // Phase 8D5 — post an existing manual draft (status draft → posted), updating
  // account balances server-side. Hits POST /journal-entries/:id/post. Mock/
  // local mode does not support it.
  postJournalEntry(id: string): Promise<MutationResult<JournalEntry>>;
  // Phase 8D7 — reverse a posted manual entry: creates a new posted reversal
  // entry (swapped lines) and flips the original to "reversed". Hits POST
  // /journal-entries/:id/reverse. Mock/local mode does not support it.
  reverseJournalEntry(id: string): Promise<MutationResult<JournalEntry>>;
  // Phase 8D9 — cancel (hard-delete) an unposted manual draft. Hits POST
  // /journal-entries/:id/cancel. Mock/local mode does not support it.
  cancelJournalDraft(id: string): Promise<MutationResult<{ id: string; deleted: boolean }>>;
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
