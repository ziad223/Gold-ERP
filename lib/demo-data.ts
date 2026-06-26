import type {
  Asset,
  Customer,
  Invoice,
  Supplier,
  Employee,
  AuditLog,
  Transfer,
  ManufacturingOrder,
  CustomerGoldPool,
  InventoryGoldPool,
  JournalEntry,
  Account,
  PurchaseOrder,
  Reservation,
  ApprovalRequest,
  GoldPriceSnapshot,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// ASSETS
// ─────────────────────────────────────────────────────────────────────────────

export const demoAssets: Asset[] = [
  {
    id: "AST-2026-00184",
    name: "خاتم ألماس سوليتير",
    type: "diamond",
    category: "خواتم",
    karat: 18,
    purity: 0.75,
    grossWeight: 6.42,
    netWeight: 5.91,
    goldWeight: 2.91,
    price: 12800,
    cost: 8450,
    branch: "فرع دبي مول",
    location: "خزنة A · رف 04",
    status: "available",
    barcode: "6291001840138",
    rfid: "E280-1160-6000-0209-1840",
    source: "مورد: Emirates Diamonds",
    stones: 1,
    stoneDetails: [
      { type: "diamond", count: 1, totalCaratWeight: 1.2, color: "D", clarity: "VVS1", certificateRef: "GIA-1234567890" },
    ],
    events: [
      { id: "e1", action: "تم إنشاء الأصل", date: "2026-06-10 09:20", user: "سارة أحمد", branch: "المستودع الرئيسي", note: "إدخال فاتورة شراء PO-381", sourceDocument: "PO-381", severity: "info" },
      { id: "e2", action: "فحص الجودة", date: "2026-06-10 11:45", user: "محمد سالم", branch: "المستودع الرئيسي", note: "تم اعتماد الوزن والحجر", severity: "info" },
      { id: "e3", action: "نقل إلى الفرع", date: "2026-06-11 14:10", user: "أحمد يوسف", branch: "فرع دبي مول", note: "Transfer TR-0901", sourceDocument: "TR-0901", beforeState: "branch:المستودع الرئيسي", afterState: "branch:فرع دبي مول", severity: "info" },
    ],
    createdAt: "2026-06-10 09:20",
  },
  {
    id: "AST-2026-00179",
    name: "سوار ذهب إيطالي",
    type: "gold-piece",
    category: "أساور",
    karat: 21,
    purity: 0.875,
    grossWeight: 18.75,
    netWeight: 18.75,
    goldWeight: 16.41,
    price: 7350,
    cost: 5620,
    branch: "فرع أبوظبي",
    location: "معرض B · درج 07",
    status: "reserved",
    barcode: "6291001790136",
    source: "تصنيع داخلي MO-122",
    parentAssetId: "BAR-24K-00018",
    manufacturingOrderId: "MO-122",
    contributionWeight: 19.5,
    processLoss: 0.75,
    events: [
      { id: "e1", action: "تحويل من سبيكة", date: "2026-06-07 08:35", user: "قسم التصنيع", branch: "المصنع", note: "ناتج أمر تصنيع MO-122", sourceDocument: "MO-122", severity: "info" },
      { id: "e2", action: "حجز", date: "2026-06-12 17:05", user: "ليلى عادل", branch: "فرع أبوظبي", note: "حجز للعميلة مريم سالم حتى 15 يونيو", beforeState: "status:available", afterState: "status:reserved", severity: "info" },
    ],
    createdAt: "2026-06-07 08:35",
  },
  {
    id: "AST-2026-00173",
    name: "عقد زمرد كولومبي",
    type: "gemstone",
    category: "عقود",
    karat: 18,
    purity: 0.75,
    grossWeight: 31.2,
    netWeight: 26.4,
    goldWeight: 8.1,
    price: 22400,
    cost: 15900,
    branch: "فرع دبي مول",
    location: "خزنة VIP · رف 01",
    status: "available",
    barcode: "6291001730101",
    rfid: "E280-1160-6000-0209-1730",
    source: "مورد: Colombia Gems",
    stones: 14,
    stoneDetails: [
      { type: "emerald", count: 1, totalCaratWeight: 8.5, color: "Vivid Green", clarity: "VS", certificateRef: "GIA-9876543210" },
      { type: "diamond", count: 13, totalCaratWeight: 1.8, color: "G", clarity: "VS1" },
    ],
    events: [
      { id: "e1", action: "تم إنشاء الأصل", date: "2026-06-04 10:40", user: "سارة أحمد", branch: "المستودع الرئيسي", note: "شهادة فحص مرفقة", severity: "info" },
      { id: "e2", action: "نقل إلى الفرع", date: "2026-06-08 13:30", user: "أحمد يوسف", branch: "فرع دبي مول", note: "عرض VIP", beforeState: "branch:المستودع الرئيسي", afterState: "branch:فرع دبي مول", severity: "info" },
    ],
    certificates: [
      { id: "cert-1", type: "GIA", issuer: "GIA International", issueDate: "2026-05-20", certificateNumber: "GIA-9876543210" },
    ],
    createdAt: "2026-06-04 10:40",
  },
  {
    id: "AST-2026-00166",
    name: "طقم لؤلؤ بحريني",
    type: "pearl",
    category: "أطقم",
    karat: 18,
    purity: 0.75,
    grossWeight: 42.8,
    netWeight: 14.1,
    goldWeight: 10.575,
    price: 9800,
    cost: 6700,
    branch: "فرع الشارقة",
    location: "معرض A · رف 12",
    status: "repair",
    barcode: "6291001660117",
    source: "مورد: Gulf Pearls",
    pearls: 28,
    pearlDetails: [
      { type: "natural", count: 28, diameter: 9.5, luster: "Excellent", source: "Bahrain" },
    ],
    events: [
      { id: "e1", action: "تم إنشاء الأصل", date: "2026-05-27 12:00", user: "سارة أحمد", branch: "المستودع الرئيسي", note: "دفعة GP-77", sourceDocument: "PO-GP77", severity: "info" },
      { id: "e2", action: "إرسال للتصليح", date: "2026-06-12 10:15", user: "نور خالد", branch: "فرع الشارقة", note: "تغيير القفل وإعادة الربط", beforeState: "status:available", afterState: "status:repair", severity: "warning" },
    ],
    createdAt: "2026-05-27 12:00",
  },
  {
    id: "AST-2026-00152",
    name: "ساعة ذهب كلاسيكية",
    type: "watch",
    category: "ساعات",
    karat: 18,
    purity: 0.75,
    grossWeight: 88.4,
    netWeight: 54.7,
    goldWeight: 41.025,
    price: 18600,
    cost: 13200,
    branch: "فرع دبي مول",
    location: "واجهة W · 03",
    status: "available",
    barcode: "6291001520107",
    source: "مورد: Swiss Time ME",
    events: [
      { id: "e1", action: "تم إنشاء الأصل", date: "2026-05-19 15:20", user: "سارة أحمد", branch: "المستودع الرئيسي", note: "ضمان دولي سنتان", sourceDocument: "PO-STM-089", severity: "info" },
    ],
    certificates: [
      { id: "cert-w1", type: "Manufacturer", issuer: "Swiss Time ME", issueDate: "2026-05-15", certificateNumber: "STM-2026-0152", expiryDate: "2028-05-15" },
    ],
    createdAt: "2026-05-19 15:20",
  },
  {
    id: "AST-2026-00144",
    name: "خاتم ذهب عيار 22",
    type: "gold-piece",
    category: "خواتم",
    karat: 22,
    purity: 0.916,
    grossWeight: 9.85,
    netWeight: 9.85,
    goldWeight: 9.022,
    price: 4290,
    cost: 3350,
    branch: "فرع أبوظبي",
    location: "معرض A · درج 03",
    status: "sold",
    barcode: "6291001440139",
    source: "ذهب مستعمل IGP-050",
    parentAssetId: "CGP-2026-0050",
    events: [
      { id: "e1", action: "تحويل من ذهب مستعمل", date: "2026-05-15 09:00", user: "قسم التصنيع", branch: "المصنع", note: "Conversion CV-220", sourceDocument: "CV-220", severity: "info" },
      { id: "e2", action: "تم البيع", date: "2026-06-12 19:22", user: "عمر حسن", branch: "فرع أبوظبي", note: "فاتورة INV-10486", sourceDocument: "INV-10486", beforeState: "status:available", afterState: "status:sold", severity: "info" },
    ],
    createdAt: "2026-05-15 09:00",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────────────────────────────────────

export const demoCustomers: Customer[] = [
  {
    id: "CUS-0012",
    name: "مريم سالم",
    phone: "+971 50 123 8890",
    email: "mariam@example.com",
    tier: "VIP",
    balance: 0,
    purchases: 68400,
    lastVisit: "2026-06-12",
    nationality: "UAE",
    idType: "national-id",
    idNumber: "784-1985-1234567-1",
    kycStatus: "verified",
    amlStatus: "clear",
    creditLimit: 100000,
    loyaltyPoints: 6840,
    addresses: [
      { line1: "Villa 12, Al Barsha", city: "Dubai", country: "AE" },
    ],
    createdAt: "2024-01-15",
  },
  {
    id: "CUS-0026",
    name: "خالد المنصوري",
    phone: "+971 55 740 2211",
    email: "khaled@example.com",
    tier: "Gold",
    balance: 4200,
    purchases: 38150,
    lastVisit: "2026-06-11",
    nationality: "UAE",
    kycStatus: "verified",
    amlStatus: "clear",
    creditLimit: 50000,
    loyaltyPoints: 3815,
    createdAt: "2024-03-20",
  },
  {
    id: "CUS-0034",
    name: "دانة العتيبي",
    phone: "+971 52 668 0091",
    email: "dana@example.com",
    tier: "Gold",
    balance: 0,
    purchases: 29700,
    lastVisit: "2026-06-10",
    nationality: "KW",
    kycStatus: "verified",
    amlStatus: "clear",
    creditLimit: 40000,
    loyaltyPoints: 2970,
    createdAt: "2024-06-01",
  },
  {
    id: "CUS-0041",
    name: "يوسف إبراهيم",
    phone: "+971 56 411 2033",
    email: "yousef@example.com",
    tier: "Standard",
    balance: 1550,
    purchases: 12600,
    lastVisit: "2026-06-08",
    nationality: "SA",
    kycStatus: "pending",
    amlStatus: "clear",
    creditLimit: 20000,
    loyaltyPoints: 1260,
    createdAt: "2025-01-10",
  },
  {
    id: "CUS-0058",
    name: "نورا الهاشمي",
    phone: "+971 54 980 7712",
    email: "noura@example.com",
    tier: "VIP",
    balance: 0,
    purchases: 91200,
    lastVisit: "2026-06-12",
    nationality: "AE",
    kycStatus: "verified",
    amlStatus: "clear",
    creditLimit: 150000,
    loyaltyPoints: 9120,
    createdAt: "2023-11-05",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// INVOICES
// ─────────────────────────────────────────────────────────────────────────────

export const demoInvoices: Invoice[] = [
  {
    id: "INV-10486",
    type: "sale",
    customerId: "CUS-0012",
    customerName: "مريم سالم",
    date: "2026-06-12 19:22",
    subtotal: 4086,
    total: 4290,
    tax: 204,
    discount: 0,
    status: "paid",
    paymentMethod: "بطاقة",
    branch: "فرع أبوظبي",
    items: [{ assetId: "AST-2026-00144", name: "خاتم ذهب عيار 22", quantity: 1, price: 4290, cost: 3350, weight: 9.85, karat: 22 }],
    postedAt: "2026-06-12 19:22",
  },
  {
    id: "INV-10485",
    type: "sale",
    customerId: "CUS-0058",
    customerName: "نورا الهاشمي",
    date: "2026-06-12 18:45",
    subtotal: 16000,
    total: 16800,
    tax: 800,
    status: "paid",
    paymentMethod: "تحويل بنكي",
    branch: "فرع دبي مول",
    items: [{ assetId: "AST-2026-00120", name: "عقد ألماس", quantity: 1, price: 16800 }],
    postedAt: "2026-06-12 18:45",
  },
  {
    id: "INV-10484",
    type: "sale",
    customerId: "CUS-0026",
    customerName: "خالد المنصوري",
    date: "2026-06-12 16:18",
    subtotal: 10714,
    total: 11250,
    tax: 536,
    status: "partial",
    paymentMethod: "تقسيط",
    branch: "فرع الشارقة",
    items: [{ assetId: "AST-2026-00121", name: "سوار ذهب", quantity: 1, price: 11250 }],
  },
  {
    id: "INV-10483",
    type: "sale",
    customerId: "CUS-0034",
    customerName: "دانة العتيبي",
    date: "2026-06-12 13:05",
    subtotal: 7524,
    total: 7900,
    tax: 376,
    status: "paid",
    paymentMethod: "نقدي",
    branch: "فرع دبي مول",
    items: [{ assetId: "AST-2026-00122", name: "حلق زمرد", quantity: 1, price: 7900 }],
    postedAt: "2026-06-12 13:05",
  },
  {
    id: "INV-10482",
    type: "sale",
    customerId: "CUS-0041",
    customerName: "يوسف إبراهيم",
    date: "2026-06-11 20:40",
    subtotal: 6000,
    total: 6300,
    tax: 300,
    status: "due",
    paymentMethod: "عربون",
    branch: "فرع أبوظبي",
    items: [{ assetId: "AST-2026-00123", name: "خاتم رجالي", quantity: 1, price: 6300 }],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SUPPLIERS
// ─────────────────────────────────────────────────────────────────────────────

export const demoSuppliers: Supplier[] = [
  { id: "SUP-011", name: "Emirates Diamonds", category: "ألماس", phone: "+971 4 555 8011", email: "sales@emiratesdiamonds.ae", due: 154000, lastOrder: "2026-06-10", rating: 4.9, country: "AE", paymentTerms: "net-30" },
  { id: "SUP-017", name: "Gulf Pearls", category: "لؤلؤ", phone: "+973 17 448 910", email: "info@gulfpearls.bh", due: 28600, lastOrder: "2026-05-27", rating: 4.7, country: "BH", paymentTerms: "net-60" },
  { id: "SUP-023", name: "Swiss Time ME", category: "ساعات", phone: "+971 4 338 9022", email: "me@swisstime.com", due: 72000, lastOrder: "2026-05-19", rating: 4.8, country: "CH", paymentTerms: "net-30" },
  { id: "SUP-031", name: "Colombia Gems", category: "أحجار كريمة", phone: "+57 601 440 118", email: "export@colombiagems.co", due: 46800, lastOrder: "2026-06-04", rating: 4.6, country: "CO", paymentTerms: "net-45" },
];

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEES
// ─────────────────────────────────────────────────────────────────────────────

export const demoEmployees: Employee[] = [
  { id: "EMP-001", name: "عمر حسن", role: "Sales", systemRole: "sales", branch: "فرع دبي مول", status: "present", email: "omar@darfus.com", phone: "+971 55 001 0001", joinDate: "2024-03-01", jobTitle: "مسؤول مبيعات", approvalLimit: 5000 },
  { id: "EMP-002", name: "ليلى عادل", role: "Cashier", systemRole: "sales", branch: "فرع أبوظبي", status: "present", email: "laila@darfus.com", phone: "+971 55 002 0002", joinDate: "2024-05-15", jobTitle: "كاشير", approvalLimit: 2000 },
  { id: "EMP-003", name: "سارة أحمد", role: "Inventory", systemRole: "manager", branch: "المستودع الرئيسي", status: "present", email: "sara@darfus.com", phone: "+971 55 003 0003", joinDate: "2023-11-01", jobTitle: "مديرة مخزون", approvalLimit: 20000 },
  { id: "EMP-004", name: "محمد سالم", role: "Quality", systemRole: "manager", branch: "المصنع", status: "leave", email: "mohammed@darfus.com", phone: "+971 55 004 0004", joinDate: "2024-01-10", jobTitle: "مدير الجودة", approvalLimit: 15000 },
  { id: "EMP-005", name: "نور خالد", role: "Branch Manager", systemRole: "manager", branch: "فرع الشارقة", status: "present", email: "nour@darfus.com", phone: "+971 55 005 0005", joinDate: "2023-08-01", jobTitle: "مدير فرع", approvalLimit: 50000 },
  { id: "EMP-006", name: "أحمد يوسف", role: "Logistics", systemRole: "sales", branch: "المستودع الرئيسي", status: "present", email: "ahmed@darfus.com", phone: "+971 55 006 0006", joinDate: "2025-01-20", jobTitle: "مسؤول لوجستيك", approvalLimit: 3000 },
];

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOGS
// ─────────────────────────────────────────────────────────────────────────────

export const demoAuditLogs: AuditLog[] = [
  { id: "AUD-1001", action: "sale", description: "INV-10486 · AST-2026-00144", user: "عمر حسن", userId: "EMP-001", place: "فرع أبوظبي", branch: "فرع أبوظبي", date: "2026-06-12 19:22", before: "Asset: available", after: "Asset: sold", device: "POS-ABD-01", correlationId: "COR-INV-10486", sourceDocument: "INV-10486", severity: "info" },
  { id: "AUD-1002", action: "permissions", description: "Role: Branch Manager", user: "Admin DARFUS", userId: "USR-ADMIN", place: "Head Office", branch: "المركز الرئيسي", date: "2026-06-12 17:14", before: "74 permissions", after: "76 permissions", device: "ADMIN-PC-01", severity: "warning" },
  { id: "AUD-1003", action: "transfer", description: "TR-0901 · to Dubai Mall", user: "أحمد يوسف", userId: "EMP-006", place: "المستودع الرئيسي", branch: "المستودع الرئيسي", date: "2026-06-11 14:10", before: "Branch: Main Warehouse", after: "Branch: Dubai Mall", sourceDocument: "TR-0901", severity: "info" },
  { id: "AUD-1004", action: "postEdit", description: "Exception request INV-10470", user: "ليلى عادل", userId: "EMP-002", place: "فرع أبوظبي", branch: "فرع أبوظبي", date: "2026-06-08 11:06", before: "Total: 9,800", after: "Total: 9,650", severity: "critical", sourceDocument: "INV-10470" },
  { id: "AUD-1005", action: "login", description: "New device · Chrome/Windows", user: "سارة أحمد", userId: "EMP-003", place: "Dubai", date: "2026-05-29 08:33", before: "Unknown device", after: "Trusted after verification", device: "PC-NEW-01", severity: "warning" },
  { id: "AUD-1006", action: "reservation", description: "RES-0045 · AST-2026-00179", user: "ليلى عادل", userId: "EMP-002", place: "فرع أبوظبي", branch: "فرع أبوظبي", date: "2026-06-12 17:05", before: "status:available", after: "status:reserved", sourceDocument: "RES-0045", severity: "info" },
];

// ─────────────────────────────────────────────────────────────────────────────
// TRANSFERS
// ─────────────────────────────────────────────────────────────────────────────

export const demoTransfers: Transfer[] = [
  { id: "TR-0901", assetIds: ["AST-2026-00184"], fromBranch: "المستودع الرئيسي", toBranch: "فرع دبي مول", requestedBy: "سارة أحمد", requestedAt: "2026-06-11 12:00", approvedBy: "نور خالد", approvedAt: "2026-06-11 13:30", receivedBy: "عمر حسن", receivedAt: "2026-06-11 14:10", status: "received", notes: "لعرض VIP" },
  { id: "TR-0900", assetIds: ["AST-2026-00173"], fromBranch: "المستودع الرئيسي", toBranch: "فرع دبي مول", requestedBy: "سارة أحمد", requestedAt: "2026-06-08 10:00", approvedBy: "نور خالد", approvedAt: "2026-06-08 11:00", receivedBy: "عمر حسن", receivedAt: "2026-06-08 13:30", status: "received" },
  { id: "TR-0905", assetIds: ["AST-2026-00152"], fromBranch: "فرع دبي مول", toBranch: "فرع الشارقة", requestedBy: "عمر حسن", requestedAt: "2026-06-14 09:00", status: "pending", notes: "طلب عميل" },
];

// ─────────────────────────────────────────────────────────────────────────────
// MANUFACTURING ORDERS
// ─────────────────────────────────────────────────────────────────────────────

export const demoManufacturingOrders: ManufacturingOrder[] = [
  {
    id: "MO-122",
    status: "completed",
    type: "manufacturing",
    inputAssets: [{ assetId: "BAR-24K-00018", assetName: "سبيكة ذهب 24K", grossWeight: 19.5, contributionWeight: 19.5 }],
    outputAssets: [{ assetId: "AST-2026-00179", assetName: "سوار ذهب إيطالي", grossWeight: 18.75, isExpected: true }],
    expectedOutputWeight: 18.75,
    actualOutputWeight: 18.75,
    processLoss: 0.75,
    wastage: 0,
    branch: "المصنع",
    startedAt: "2026-06-05 08:00",
    completedAt: "2026-06-07 08:35",
    createdBy: "محمد سالم",
    createdAt: "2026-06-04 14:00",
    approvedBy: "Admin DARFUS",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER GOLD POOL
// ─────────────────────────────────────────────────────────────────────────────

export const demoCGP: CustomerGoldPool[] = [
  {
    id: "CGP-2026-0050",
    customerId: "CUS-0012",
    customerName: "مريم سالم",
    status: "approved",
    grossWeight: 48.0,
    purity: 0.75,
    fineWeight: 36.0,
    assayResult: 0.752,
    assayDate: "2026-05-12",
    assayedBy: "محمد سالم",
    receivedAt: "2026-05-10 10:30",
    approvedAt: "2026-05-13 14:00",
    approvedBy: "Admin DARFUS",
    notes: "ذهب مستعمل من ميراث عائلي",
    transferredToIGP: true,
    igpId: "IGP-2026-050",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// INVENTORY GOLD POOL
// ─────────────────────────────────────────────────────────────────────────────

export const demoIGP: InventoryGoldPool[] = [
  {
    id: "IGP-2026-050",
    source: "CGP-2026-0050",
    cgpId: "CGP-2026-0050",
    grossWeight: 48.0,
    purity: 0.752,
    fineWeight: 36.096,
    availableWeight: 28.5,
    allocatedWeight: 19.5,
    status: "available",
    createdAt: "2026-05-13 14:00",
    allocations: [
      { id: "ALLOC-001", igpId: "IGP-2026-050", manufacturingOrderId: "MO-122", allocatedWeight: 19.5, allocatedAt: "2026-06-04 14:00" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CHART OF ACCOUNTS
// ─────────────────────────────────────────────────────────────────────────────

export const demoAccounts: Account[] = [
  { id: "ACC-1000", code: "1000", name: "Assets", nameAr: "الأصول", type: "asset", nature: "debit", balance: 4286250, isActive: true, level: 1 },
  { id: "ACC-1100", code: "1100", name: "Cash & Bank", nameAr: "النقد والبنوك", type: "asset", nature: "debit", parentId: "ACC-1000", balance: 486250, isActive: true, level: 2 },
  { id: "ACC-1110", code: "1110", name: "Cash on Hand", nameAr: "نقد في الخزنة", type: "asset", nature: "debit", parentId: "ACC-1100", balance: 186250, isActive: true, level: 3 },
  { id: "ACC-1120", code: "1120", name: "Bank Accounts", nameAr: "الحسابات البنكية", type: "asset", nature: "debit", parentId: "ACC-1100", balance: 300000, isActive: true, level: 3 },
  { id: "ACC-1200", code: "1200", name: "Inventory", nameAr: "المخزون", type: "asset", nature: "debit", parentId: "ACC-1000", balance: 3800000, isActive: true, level: 2 },
  { id: "ACC-2000", code: "2000", name: "Liabilities", nameAr: "الخصوم", type: "liability", nature: "credit", balance: 301400, isActive: true, level: 1 },
  { id: "ACC-2100", code: "2100", name: "Accounts Payable", nameAr: "ذمم الموردين", type: "liability", nature: "credit", parentId: "ACC-2000", balance: 301400, isActive: true, level: 2 },
  { id: "ACC-3000", code: "3000", name: "Equity", nameAr: "حقوق الملكية", type: "equity", nature: "credit", balance: 2000000, isActive: true, level: 1 },
  { id: "ACC-4000", code: "4000", name: "Revenue", nameAr: "الإيرادات", type: "revenue", nature: "credit", balance: 1284540, isActive: true, level: 1 },
  { id: "ACC-4100", code: "4100", name: "Jewelry Sales", nameAr: "مبيعات المجوهرات", type: "revenue", nature: "credit", parentId: "ACC-4000", balance: 1284540, isActive: true, level: 2 },
  { id: "ACC-5000", code: "5000", name: "Cost of Goods Sold", nameAr: "تكلفة البضاعة المباعة", type: "expense", nature: "debit", balance: 825000, isActive: true, level: 1 },
];

// ─────────────────────────────────────────────────────────────────────────────
// JOURNAL ENTRIES
// ─────────────────────────────────────────────────────────────────────────────

export const demoJournals: JournalEntry[] = [
  {
    id: "JE-260612-091",
    description: "مبيعات فرع دبي مول",
    date: "2026-06-12",
    status: "balanced",
    amount: 52780,
    totalDebit: 52780,
    totalCredit: 52780,
    sourceType: "sale",
    postedAt: "2026-06-12 20:00",
    postedBy: "Admin DARFUS",
    lines: [
      { id: "jl-001-1", accountId: "ACC-1110", accountCode: "1110", accountName: "نقد في الخزنة", debit: 52780, credit: 0 },
      { id: "jl-001-2", accountId: "ACC-4100", accountCode: "4100", accountName: "مبيعات المجوهرات", debit: 0, credit: 50267 },
      { id: "jl-001-3", accountId: "ACC-2000", accountCode: "2000", accountName: "ضريبة القيمة المضافة", debit: 0, credit: 2513 },
    ],
  },
  {
    id: "JE-260612-087",
    description: "استلام دفعة من عميل",
    date: "2026-06-12",
    status: "balanced",
    amount: 18000,
    totalDebit: 18000,
    totalCredit: 18000,
    sourceType: "manual",
    postedAt: "2026-06-12 18:00",
    postedBy: "محمد سالم",
    lines: [
      { id: "jl-002-1", accountId: "ACC-1120", accountCode: "1120", accountName: "الحسابات البنكية", debit: 18000, credit: 0 },
      { id: "jl-002-2", accountId: "ACC-1200", accountCode: "1200", accountName: "ذمم العملاء", debit: 0, credit: 18000 },
    ],
  },
  {
    id: "JE-260611-102",
    description: "فاتورة شراء ألماس",
    date: "2026-06-11",
    status: "balanced",
    amount: 84500,
    totalDebit: 84500,
    totalCredit: 84500,
    sourceType: "purchase",
    sourceId: "PO-381",
    postedAt: "2026-06-11 16:00",
    postedBy: "Admin DARFUS",
    lines: [
      { id: "jl-003-1", accountId: "ACC-1200", accountCode: "1200", accountName: "المخزون", debit: 84500, credit: 0 },
      { id: "jl-003-2", accountId: "ACC-2100", accountCode: "2100", accountName: "ذمم الموردين", debit: 0, credit: 84500 },
    ],
  },
  {
    id: "JE-260611-078",
    description: "مصروفات صيانة الفرع",
    date: "2026-06-11",
    status: "pending",
    amount: 2350,
    totalDebit: 2350,
    totalCredit: 2350,
    sourceType: "manual",
    lines: [
      { id: "jl-004-1", accountId: "ACC-5000", accountCode: "5000", accountName: "مصروفات تشغيلية", debit: 2350, credit: 0 },
      { id: "jl-004-2", accountId: "ACC-1110", accountCode: "1110", accountName: "نقد في الخزنة", debit: 0, credit: 2350 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// GOLD PRICE SNAPSHOT
// ─────────────────────────────────────────────────────────────────────────────

export const demoGoldPrice: GoldPriceSnapshot = {
  updatedAt: "2026-06-14 08:00",
  updatedBy: "Admin DARFUS",
  prices: [
    { karat: 24, pricePerGram: 476.80, currency: "AED" },
    { karat: 22, pricePerGram: 437.07, currency: "AED" },
    { karat: 21, pricePerGram: 417.20, currency: "AED" },
    { karat: 18, pricePerGram: 357.60, currency: "AED" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// PURCHASE ORDERS
// ─────────────────────────────────────────────────────────────────────────────

export const demoPurchaseOrders: PurchaseOrder[] = [
  {
    id: "PO-381",
    supplierId: "SUP-011",
    supplierName: "Emirates Diamonds",
    status: "received",
    date: "2026-06-08",
    expectedDate: "2026-06-10",
    receivedDate: "2026-06-10",
    total: 84500,
    branch: "المستودع الرئيسي",
    items: [
      { id: "poi-1", description: "خاتم ألماس سوليتير 1.2 قيراط", quantity: 1, unit: "قطعة", unitPrice: 84500, total: 84500, receivedQuantity: 1 },
    ],
  },
  {
    id: "PO-GP77",
    supplierId: "SUP-017",
    supplierName: "Gulf Pearls",
    status: "received",
    date: "2026-05-25",
    receivedDate: "2026-05-27",
    total: 28600,
    branch: "المستودع الرئيسي",
    items: [
      { id: "poi-2", description: "طقم لؤلؤ بحريني طبيعي", quantity: 1, unit: "طقم", unitPrice: 28600, total: 28600, receivedQuantity: 1 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// RESERVATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const demoReservations: Reservation[] = [
  {
    id: "RES-0045",
    assetId: "AST-2026-00179",
    assetName: "سوار ذهب إيطالي",
    customerId: "CUS-0012",
    customerName: "مريم سالم",
    branch: "فرع أبوظبي",
    deposit: 1000,
    expiresAt: "2026-06-15",
    createdAt: "2026-06-12 17:05",
    status: "active",
    notes: "العميلة ستتواصل لاستكمال الشراء",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// APPROVALS
// ─────────────────────────────────────────────────────────────────────────────

export const demoApprovals: ApprovalRequest[] = [
  { id: "APR-001", type: "discount", requestedBy: "عمر حسن", requestedAt: "2026-06-14 09:30", branch: "فرع دبي مول", description: "خصم 15% على طقم لؤلؤ لعميلة VIP", amount: 1470, status: "pending", relatedId: "AST-2026-00166" },
  { id: "APR-002", type: "price-override", requestedBy: "ليلى عادل", requestedAt: "2026-06-13 16:00", branch: "فرع أبوظبي", description: "تعديل سعر خاتم ذهب 22 عيار", amount: 4200, status: "approved", reviewedBy: "نور خالد", reviewedAt: "2026-06-13 17:30", relatedId: "AST-2026-00144" },
  { id: "APR-003", type: "transfer", requestedBy: "عمر حسن", requestedAt: "2026-06-14 09:00", branch: "فرع دبي مول", description: "نقل ساعة ذهب إلى فرع الشارقة", status: "pending", relatedId: "TR-0905" },
];
