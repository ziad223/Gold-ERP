// ─────────────────────────────────────────────────────────────────────────────
// DARFUS Jewellery ERP — Domain Types
// Frontend only — No backend, no server code.
// These types define the shared language between UI, mock repositories,
// and future API contracts.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Asset Domain ────────────────────────────────────────────────────────────

export type AssetStatus =
  | "available"
  | "reserved"
  | "sold"
  | "repair"
  | "transferred"
  | "melted"
  | "archived"
  // DARFUS inventory states (additive — legacy values above kept for compat).
  | "pending_transfer"
  | "returned"
  | "in_workshop"
  | "pending_tag";

export type AssetType =
  | "gold-piece"
  | "gold-weight"
  | "diamond"
  | "gemstone"
  | "pearl"
  | "watch";

export type EventSeverity = "info" | "warning" | "critical";

export interface AssetEvent {
  id: string;
  action: string;
  date: string;
  user: string;
  branch: string;
  note: string;
  // Extended fields for rich audit trail
  device?: string;
  reason?: string;
  sourceDocument?: string;
  beforeState?: string;
  afterState?: string;
  correlationId?: string;
  severity?: EventSeverity;
}

export interface Stone {
  type: string; // diamond, emerald, ruby, etc.
  count: number;
  totalCaratWeight?: number;
  color?: string;
  clarity?: string;
  certificateRef?: string;
}

export interface Pearl {
  type: string; // natural, cultured, freshwater
  count: number;
  diameter?: number; // mm
  luster?: string;
  source?: string; // Bahrain, Japan, etc.
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  category: string;
  karat?: number;
  purity?: number; // e.g. 0.750 for 18K
  grossWeight: number;
  netWeight: number;
  goldWeight?: number; // net gold weight after stones
  price: number;
  cost: number;
  branch: string;
  branchId?: string;
  location: string;
  status: AssetStatus;
  barcode: string;
  rfid?: string;
  source?: string;
  parentAssetId?: string;
  childAssetIds?: string[]; // for lineage one-to-many
  stones?: number; // count (backward compat)
  stoneDetails?: Stone[];
  pearls?: number; // count (backward compat)
  pearlDetails?: Pearl[];
  events: AssetEvent[];
  notes?: string;
  certificates?: AssetCertificate[];
  attachments?: AssetAttachment[];
  createdAt?: string;
  updatedAt?: string;
  // Manufacturing lineage
  manufacturingOrderId?: string;
  contributionWeight?: number; // grams used from parent
  processLoss?: number; // grams lost in process
}

export interface AssetCertificate {
  id: string;
  type: string; // GIA, IGI, HRD, etc.
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  certificateNumber: string;
  url?: string; // mock URL
}

export interface AssetAttachment {
  id: string;
  name: string;
  type: string; // invoice, photo, certificate, etc.
  url?: string; // mock
  uploadedAt: string;
  uploadedBy: string;
}

// ─── Customer Domain ──────────────────────────────────────────────────────────

export type CustomerTier = "VIP" | "Gold" | "Standard";
export type KYCStatus = "verified" | "pending" | "flagged" | "not-started";
export type AMLStatus = "clear" | "review" | "flagged";

export interface CustomerAddress {
  line1: string;
  line2?: string;
  city: string;
  country: string;
  postalCode?: string;
}

export interface AttachmentMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  localPreviewRef?: string;
}

export type CustomerAttachment = AttachmentMetadata;

export interface CustomerKycDetails {
  status: KYCStatus;
  amlStatus: AMLStatus;
  identityType?: string;
  identityNumber?: string;
  identityExpiryDate?: string;
  idType?: string;
  idNumber?: string;
  idExpiry?: string;
  nationality?: string;
  dateOfBirth?: string;
  lastCheckedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  tier: CustomerTier;
  balance: number; // outstanding receivable
  purchases: number; // total lifetime purchases value
  lastVisit: string;
  status?: "active" | "inactive";
  // Sub-typed details
  kycDetails?: CustomerKycDetails;
  // Legacy top-level fields for demo compatibility
  dateOfBirth?: string;
  nationality?: string;
  idType?: string;
  idNumber?: string;
  idExpiry?: string;
  kycStatus?: KYCStatus;
  amlStatus?: AMLStatus;
  addresses?: CustomerAddress[];
  notes?: string;
  creditLimit?: number;
  loyaltyPoints?: number;
  attachments?: AttachmentMetadata[];
  createdAt?: string;
}

// ─── Sales Domain ─────────────────────────────────────────────────────────────

export interface InvoiceItem {
  assetId: string;
  name: string;
  quantity: number;
  price: number;
  cost?: number;
  weight?: number;
  karat?: number;
  discount?: number;
  makingCharge?: number;
  stoneValue?: number;
}

export interface PaymentSplit {
  method: string;
  amount: number;
}

export type InvoiceStatus = "paid" | "partial" | "due" | "returned" | "cancelled";
export type InvoiceType =
  | "sale"
  | "return"
  | "exchange"
  | "deposit"
  | "repair"
  | "installment"
  | "giftVoucher";

export interface Invoice {
  id: string;
  type?: InvoiceType;
  customerId: string;
  customerName: string;
  date: string;
  total: number;
  tax: number;
  vatRate?: number; // VAT percentage applied at the time of sale (e.g. 5, 14)
  subtotal?: number;
  discount?: number;
  makingCharge?: number;
  stoneValue?: number;
  deposit?: number;
  downPayment?: number; // installment sales: amount paid upfront
  installmentCount?: number; // installment sales: number of instalments
  paidAmount?: number;
  remainingAmount?: number;
  guarantorName?: string;
  guarantorPhone?: string;
  installmentFrequency?: string;
  installments?: Installment[];
  payments?: any[];
  status: InvoiceStatus;
  /** Lifecycle status (separate from payment `status`). Defaults to "posted". */
  postingStatus?: "draft" | "posted" | "cancelled";
  /** Customer-facing sequential number (e.g. INV-2026-000010); null for drafts. Display as invoiceNumber || id. */
  invoiceNumber?: string | null;
  paymentMethod: string;
  paymentSplits?: PaymentSplit[];
  branch: string;
  items: InvoiceItem[];
  notes?: string;
  relatedInvoiceId?: string; // for returns/exchanges
  idempotencyKey?: string;
  postedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

export interface Installment {
  id: string;
  invoiceId: string;
  customerId: string;
  customerName: string;
  sequence: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: "pending" | "paid" | "overdue" | "partial";
  paidDate?: string;
}

export interface GiftVoucher {
  id: string;
  code: string;
  value: number;
  balance: number;
  customerId?: string;
  customerName?: string;
  status: "active" | "redeemed" | "expired";
  issueDate: string;
  expiryDate?: string;
}

export interface Reservation {
  id: string;
  assetId: string;
  assetName: string;
  customerId: string;
  customerName: string;
  branch: string;
  deposit: number;
  expiresAt: string;
  createdAt: string;
  status: "active" | "expired" | "completed" | "cancelled";
  notes?: string;
}

export interface RepairOrder {
  id: string;
  customerId: string;
  customerName: string;
  assetId?: string;
  assetName?: string;
  description: string;
  estimatedCost: number;
  actualCost?: number;
  status: "intake" | "diagnosed" | "in-repair" | "ready" | "returned";
  receivedAt: string;
  estimatedReadyAt?: string;
  returnedAt?: string;
  branch: string;
}

export interface SupplierDocument {
  id: string;
  name: string;
  type: string;
  expiryDate: string;
  url?: string;
  fileName?: string;
  originalFileName?: string;
  mimeType?: string;
  fileSize?: number;
  uploadedBy?: string;
  uploadedAt?: string;
}

export interface SupplierConsignment {
  id: string;
  assetId: string;
  assetName: string;
  weight: number;
  agreedPrice: number;
  receivedDate: string;
  status: "available" | "sold" | "returned";
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  phone: string;
  email?: string;
  due: number;
  lastOrder: string;
  rating: number;
  status?: "active" | "inactive";
  // Extended
  address?: string;
  country?: string;
  taxNumber?: string;
  commercialRegister?: string;
  paymentTerms?: string; // net-30, etc.
  notes?: string;
  isConsignment?: boolean;
  documents?: SupplierDocument[];
  consignments?: SupplierConsignment[];
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  status: "draft" | "sent" | "partial" | "received" | "cancelled";
  date: string;
  expectedDate?: string;
  receivedDate?: string;
  items: PurchaseOrderItem[];
  total: number;
  branch: string;
  notes?: string;
  isConsignment?: boolean;
}

export interface PurchaseOrderItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  receivedQuantity?: number;
}

// ─── Employee Domain ──────────────────────────────────────────────────────────

export type EmployeeStatus = "present" | "leave" | "inactive";
export type DarfusRole = "admin" | "owner" | "manager" | "accountant" | "sales";

export interface EmployeeApprovalLimits {
  discountLimit: number;
  priceOverrideLimit: number;
  refundLimit: number;
  journalLimit: number;
  adjustmentLimit: number;
  goldPurchaseLimit: number;
}

export interface EmployeeSession {
  id: string;
  deviceName: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export type EmployeeDeviceSession = EmployeeSession;

export interface Employee {
  id: string;
  name: string;
  role: string;
  systemRole?: DarfusRole;
  branch: string;
  status: EmployeeStatus;
  // Extended
  email?: string;
  phone?: string;
  joinDate?: string;
  jobTitle?: string;
  approvalLimit?: number; // max amount they can approve
  assignedDevice?: string;
  lastLogin?: string;
  notes?: string;
  approvalLimitsDetail?: EmployeeApprovalLimits;
  sessions?: EmployeeSession[];
  deactivateReason?: string;
}

// ─── Transfer Domain ──────────────────────────────────────────────────────────

export type TransferStatus = "pending" | "approved" | "in-transit" | "received" | "cancelled";

export interface Transfer {
  id: string;
  assetIds: string[];
  fromBranch: string;
  toBranch: string;
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  receivedBy?: string;
  receivedAt?: string;
  status: TransferStatus;
  notes?: string;
  cancelReason?: string;
}

// ─── Adjustment Domain ────────────────────────────────────────────────────────

export type AdjustmentType = "weight-correction" | "entry-error" | "quality-inspection" | "management-approval" | "other";

export interface InventoryAdjustment {
  id: string;
  assetId: string;
  assetName: string;
  field: string; // which field was adjusted
  beforeValue: string;
  afterValue: string;
  reason: AdjustmentType;
  notes?: string;
  adjustedBy: string;
  adjustedAt: string;
  branch: string;
  approvedBy?: string;
}

// ─── Manufacturing Domain ─────────────────────────────────────────────────────

export type ManufacturingStatus = "draft" | "approved" | "in-process" | "completed" | "cancelled";

export interface ManufacturingInputAsset {
  assetId: string;
  assetName: string;
  grossWeight: number;
  contributionWeight: number; // how much is used from this asset
}

export interface ManufacturingOutputAsset {
  assetId: string;
  assetName: string;
  grossWeight: number;
  isExpected: boolean; // planned vs actual
}

export interface ManufacturingOrder {
  id: string;
  status: ManufacturingStatus;
  type: "melting" | "manufacturing" | "conversion";
  inputAssets: ManufacturingInputAsset[];
  outputAssets: ManufacturingOutputAsset[];
  expectedOutputWeight: number;
  actualOutputWeight?: number;
  processLoss?: number;
  wastage?: number;
  branch: string;
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
}

// ─── Gold Pool Domain ─────────────────────────────────────────────────────────

export type CGPStatus = "pending-assay" | "assayed" | "approved" | "transferred" | "rejected";
export type IGPStatus = "available" | "allocated" | "consumed" | "returned";

export interface CustomerGoldPool {
  id: string;
  customerId: string;
  customerName: string;
  status: CGPStatus;
  grossWeight: number;
  purity: number; // e.g. 0.750
  fineWeight: number; // grossWeight * purity
  assayResult?: number;
  assayDate?: string;
  assayedBy?: string;
  receivedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  notes?: string;
  transferredToIGP?: boolean;
  igpId?: string;
}

export interface InventoryGoldPool {
  id: string;
  source: string; // from CGP or purchase
  cgpId?: string;
  grossWeight: number;
  purity: number;
  fineWeight: number;
  availableWeight: number; // remaining not allocated
  allocatedWeight: number;
  status: IGPStatus;
  createdAt: string;
  allocations?: IGPAllocation[];
}

export interface IGPAllocation {
  id: string;
  igpId: string;
  manufacturingOrderId: string;
  allocatedWeight: number;
  allocatedAt: string;
}

// ─── Accounting Domain ────────────────────────────────────────────────────────

export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";
export type AccountNature = "debit" | "credit";

export interface Account {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  type: AccountType;
  nature: AccountNature;
  parentId?: string;
  balance: number;
  isActive: boolean;
  level: number; // 1=main, 2=sub, 3=detail
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export type JournalStatus = "draft" | "balanced" | "posted" | "pending" | "reversed";

export interface JournalEntry {
  id: string;
  description: string;
  date: string;
  status: JournalStatus;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  amount: number; // for backward compat with old UI
  sourceType?: string; // sale, purchase, adjustment, manual
  sourceId?: string; // reference to invoice/po/etc
  postedBy?: string;
  postedAt?: string;
  reversalOf?: string;
}

// ─── Audit Domain ─────────────────────────────────────────────────────────────

export type AuditAction =
  | "sale"
  | "return"
  | "exchange"
  | "transfer"
  | "adjustment"
  | "permissions"
  | "postEdit"
  | "login"
  | "logout"
  | "settings"
  | "manufacturing"
  | "cgp"
  | "igp"
  | "reservation"
  | "repair"
  | "createCustomer"
  | "updateCustomer"
  | "deactivateCustomer"
  | "reactivateCustomer"
  | "deleteCustomer"
  | "createSupplier"
  | "updateSupplier"
  | "deactivateSupplier"
  | "reactivateSupplier"
  | "deleteSupplier"
  | "createEmployee"
  | "updateEmployee"
  | "deactivateEmployee"
  | "reactivateEmployee"
  | "revokeSession";

export interface AuditLog {
  id: string;
  action: AuditAction;
  description: string;
  user: string;
  userId?: string;
  place: string;
  branch?: string;
  date: string;
  before: string;
  after: string;
  device?: string;
  correlationId?: string;
  sourceDocument?: string;
  severity?: EventSeverity;
}

// ─── Gold Price Domain ────────────────────────────────────────────────────────

export interface GoldPriceEntry {
  karat: number;
  pricePerGram: number;
  currency: string;
}

export interface GoldPriceSnapshot {
  updatedAt: string;
  updatedBy: string;
  prices: GoldPriceEntry[];
}

// ─── Approval Domain ──────────────────────────────────────────────────────────

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";
export type ApprovalType = "discount" | "price-override" | "transfer" | "adjustment" | "cgp" | "period-close" | "reverse-charge";

export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  requestedBy: string;
  requestedAt: string;
  branch: string;
  description: string;
  amount?: number;
  status: ApprovalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reason?: string;
  relatedId?: string; // invoice, asset, etc.
}

// ─── Product & Stock Movement Domain ──────────────────────────────────────────

export interface Product {
  id: string;
  companyId: string;
  productCode: string;
  productName: string;
  description?: string;
  karat?: number;
  stockType?: string;
  branchId?: string;
  branchName?: string;
  warehouseId?: string;
  quantityOnHand: number;
  quantityAvailable: number;
  quantitySold: number;
  quantityReserved: number;
  totalWeight: number;
  averageUnitWeight: number;
  unitCost: number;
  averageCost: number;
  salePrice: number;
  supplierId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type StockMovementType =
  | "purchase_receive"
  | "sale"
  | "return"
  | "exchange_in"
  | "exchange_out"
  | "adjustment_in"
  | "adjustment_out"
  | "transfer_in"
  | "transfer_out"
  | "opening_balance";

export interface StockMovement {
  id: string;
  companyId: string;
  productId: string;
  productCode: string;
  type: StockMovementType;
  quantityIn: number;
  quantityOut: number;
  weightIn: number;
  weightOut: number;
  unitCost: number;
  totalCost: number;
  referenceType?: string;
  referenceId?: string;
  supplierId?: string;
  customerId?: string;
  branchId?: string;
  warehouseId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}
