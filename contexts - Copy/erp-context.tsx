"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./auth-context";
import { toast } from "sonner";
import {
  demoAssets,
  demoCustomers,
  demoInvoices,
  demoSuppliers,
  demoEmployees,
  demoAuditLogs,
  demoTransfers,
  demoManufacturingOrders,
  demoCGP,
  demoIGP,
  demoJournals,
  demoGoldPrice,
  demoReservations,
  demoApprovals,
  demoPurchaseOrders,
} from "@/lib/demo-data";
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
  GoldPriceSnapshot,
  Reservation,
  ApprovalRequest,
  PurchaseOrder,
  AssetEvent,
  AuditAction,
} from "@/lib/types";
import {
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
} from "@/lib/repositories/interfaces";
import {
  LocalCustomerRepository,
  LocalSupplierRepository,
  LocalEmployeeRepository,
  LocalAssetRepository,
  LocalInventoryRepository,
  LocalSalesRepository,
  LocalManufacturingRepository,
  LocalAccountingRepository,
  LocalReportsRepository,
  LocalAuditRepository,
  LocalSettingsRepository,
  LocalRepoContext,
} from "@/lib/repositories/local-impl";
import {
  ApiCustomerRepository,
  ApiSupplierRepository,
  ApiEmployeeRepository,
  ApiAssetRepository,
  ApiAccountingRepository,
} from "@/lib/repositories/api-impl";
import { DATA_SOURCE } from "@/lib/data-source";

// ─────────────────────────────────────────────────────────────────────────────
// Storage keys & version
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "darfus-demo-state-v4";
const SCHEMA_VERSION = 4;

// ─────────────────────────────────────────────────────────────────────────────
// Context value interface
// ─────────────────────────────────────────────────────────────────────────────

interface ErpContextValue {
  // Data
  assets: Asset[];
  customers: Customer[];
  invoices: Invoice[];
  suppliers: Supplier[];
  employees: Employee[];
  auditLogs: AuditLog[];
  transfers: Transfer[];
  manufacturingOrders: ManufacturingOrder[];
  cgpList: CustomerGoldPool[];
  igpList: InventoryGoldPool[];
  journals: JournalEntry[];
  goldPrice: GoldPriceSnapshot;
  reservations: Reservation[];
  approvals: ApprovalRequest[];
  purchaseOrders: PurchaseOrder[];

  // Repository instances for Backend-Readiness
  customerRepository: CustomerRepository;
  supplierRepository: SupplierRepository;
  employeeRepository: EmployeeRepository;
  assetRepository: AssetRepository;
  inventoryRepository: InventoryRepository;
  salesRepository: SalesRepository;
  manufacturingRepository: ManufacturingRepository;
  accountingRepository: AccountingRepository;
  reportsRepository: ReportsRepository;
  auditRepository: AuditRepository;
  settingsRepository: SettingsRepository;

  // Asset actions
  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  updateAssetWithEvent: (id: string, updates: Partial<Asset>, event: AssetEvent) => void;

  // Customer actions
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;

  // Invoice actions
  addInvoice: (invoice: Invoice) => void;

  // Supplier actions
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;

  // Employee actions
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;

  // Transfer actions
  addTransfer: (transfer: Transfer) => void;
  updateTransfer: (id: string, updates: Partial<Transfer>) => void;

  // Manufacturing actions
  addManufacturingOrder: (order: ManufacturingOrder) => void;
  updateManufacturingOrder: (id: string, updates: Partial<ManufacturingOrder>) => void;

  // CGP/IGP actions
  addCGP: (cgp: CustomerGoldPool) => void;
  updateCGP: (id: string, updates: Partial<CustomerGoldPool>) => void;
  addIGP: (igp: InventoryGoldPool) => void;
  updateIGP: (id: string, updates: Partial<InventoryGoldPool>) => void;

  // Journal actions
  addJournal: (journal: JournalEntry) => void;
  updateJournal: (id: string, updates: Partial<JournalEntry>) => void;

  // Gold price
  updateGoldPrice: (snapshot: GoldPriceSnapshot) => void;

  // Reservation actions
  addReservation: (reservation: Reservation) => void;
  updateReservation: (id: string, updates: Partial<Reservation>) => void;

  // Approval actions
  addApproval: (approval: ApprovalRequest) => void;
  updateApproval: (id: string, updates: Partial<ApprovalRequest>) => void;

  // Purchase order actions
  addPurchaseOrder: (po: PurchaseOrder) => void;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => void;

  // Audit log
  addAuditLog: (log: AuditLog) => void;

  // Data management
  resetDemo: () => void;
  exportLocalData: () => string;
  importLocalData: (json: string) => { ok: boolean; message?: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// Context creation
// ─────────────────────────────────────────────────────────────────────────────

const ErpContext = createContext<ErpContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Helper: immutable update
// ─────────────────────────────────────────────────────────────────────────────

function updateById<T extends { id: string }>(list: T[], id: string, updates: Partial<T>): T[] {
  return list.map((item) => (item.id === id ? { ...item, ...updates } : item));
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function ErpProvider({ children }: { children: React.ReactNode }) {
  const { user, activeBranch, company } = useAuth();
  const apiMode = DATA_SOURCE === "api";
  
  const [assets, setAssets] = useState<Asset[]>(() => apiMode ? [] : demoAssets);
  const [customers, setCustomers] = useState<Customer[]>(() =>
    apiMode ? [] : demoCustomers.map((c) => ({ ...c, status: c.status || "active" }))
  );
  const [invoices, setInvoices] = useState<Invoice[]>(() => apiMode ? [] : demoInvoices);
  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    apiMode ? [] : demoSuppliers.map((s) => ({ ...s, status: s.status || "active" }))
  );
  const [employees, setEmployees] = useState<Employee[]>(() =>
    apiMode ? [] : demoEmployees.map((e) => ({ ...e, status: e.status || "present" }))
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => apiMode ? [] : demoAuditLogs);
  const [transfers, setTransfers] = useState<Transfer[]>(() => apiMode ? [] : demoTransfers);
  const [manufacturingOrders, setManufacturingOrders] = useState<ManufacturingOrder[]>(() => apiMode ? [] : demoManufacturingOrders);
  const [cgpList, setCgpList] = useState<CustomerGoldPool[]>(() => apiMode ? [] : demoCGP);
  const [igpList, setIgpList] = useState<InventoryGoldPool[]>(() => apiMode ? [] : demoIGP);
  const [journals, setJournals] = useState<JournalEntry[]>(() => apiMode ? [] : demoJournals);
  const [goldPrice, setGoldPrice] = useState<GoldPriceSnapshot>(demoGoldPrice);
  const [reservations, setReservations] = useState<Reservation[]>(() => apiMode ? [] : demoReservations);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(() => apiMode ? [] : demoApprovals);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => apiMode ? [] : demoPurchaseOrders);
  const [hydrated, setHydrated] = useState(false);

  // Helper function for local audit logging
  const logEvent = useCallback((
    action: AuditAction,
    entityType: string,
    entityId: string,
    description: string,
    before?: string,
    after?: string,
    reason?: string
  ) => {
    const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
    const actorName = user ? `${user.firstName} ${user.lastName}` : "System";
    const actorId = user ? user.id : "USR-SYSTEM";
    setAuditLogs((current) => [
      {
        id: `AUD-${entityType.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        action,
        description: description + (reason ? ` (${reason})` : ""),
        user: actorName,
        userId: actorId,
        place: company?.branchName || activeBranch,
        branch: activeBranch,
        date: timestamp,
        before: before || "",
        after: after || "",
        device: "Web Browser",
        correlationId: `COR-${entityType.toUpperCase()}-${entityId}`,
        sourceDocument: entityId,
        severity: (action.includes("deactivate") || action.includes("delete") || action.includes("limit")) ? "warning" : "info",
      },
      ...current,
    ]);
  }, [user, activeBranch, company]);

  const localContext = useMemo<LocalRepoContext>(() => ({
    customers,
    setCustomers,
    suppliers,
    setSuppliers,
    employees,
    setEmployees,
    assets,
    setAssets,
    invoices,
    setInvoices,
    purchaseOrders,
    setPurchaseOrders,
    reservations,
    setReservations,
    auditLogs,
    setAuditLogs,
    logEvent
  }), [customers, suppliers, employees, assets, invoices, purchaseOrders, reservations, auditLogs, logEvent]);

  const repos = useMemo(() => {
    if (DATA_SOURCE === "api") {
      return {
        customerRepository: new ApiCustomerRepository(),
        supplierRepository: new ApiSupplierRepository(),
        employeeRepository: new ApiEmployeeRepository(),
        assetRepository: new ApiAssetRepository(),
        inventoryRepository: new LocalInventoryRepository(localContext),
        salesRepository: new LocalSalesRepository(localContext),
        manufacturingRepository: new LocalManufacturingRepository(localContext),
        accountingRepository: new ApiAccountingRepository(),
        reportsRepository: new LocalReportsRepository(localContext),
        auditRepository: new LocalAuditRepository(localContext),
        settingsRepository: new LocalSettingsRepository(localContext),
      };
    } else {
      return {
        customerRepository: new LocalCustomerRepository(localContext),
        supplierRepository: new LocalSupplierRepository(localContext),
        employeeRepository: new LocalEmployeeRepository(localContext),
        assetRepository: new LocalAssetRepository(localContext),
        inventoryRepository: new LocalInventoryRepository(localContext),
        salesRepository: new LocalSalesRepository(localContext),
        manufacturingRepository: new LocalManufacturingRepository(localContext),
        accountingRepository: new LocalAccountingRepository(localContext),
        reportsRepository: new LocalReportsRepository(localContext),
        auditRepository: new LocalAuditRepository(localContext),
        settingsRepository: new LocalSettingsRepository(localContext),
      };
    }
  }, [localContext]);

  // ── Load from localStorage on mount ──────────────────────────────────────
  useEffect(() => {
    if (DATA_SOURCE === "api") {
      window.localStorage.removeItem(STORAGE_KEY);
      setHydrated(true);
      return;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          _version?: number;
          assets?: Asset[];
          customers?: Customer[];
          invoices?: Invoice[];
          suppliers?: Supplier[];
          employees?: Employee[];
          auditLogs?: AuditLog[];
          transfers?: Transfer[];
          manufacturingOrders?: ManufacturingOrder[];
          cgpList?: CustomerGoldPool[];
          igpList?: InventoryGoldPool[];
          journals?: JournalEntry[];
          goldPrice?: GoldPriceSnapshot;
          reservations?: Reservation[];
          approvals?: ApprovalRequest[];
          purchaseOrders?: PurchaseOrder[];
        };

        // Version check — if schema is old, use fresh demo data
        if (parsed._version && parsed._version < SCHEMA_VERSION) {
          window.localStorage.removeItem(STORAGE_KEY);
        } else {
          if (parsed.assets) setAssets(parsed.assets);
          if (parsed.customers) {
            setCustomers(parsed.customers.map((c) => ({ ...c, status: c.status || "active" })));
          }
          if (parsed.invoices) setInvoices(parsed.invoices);
          if (parsed.suppliers) {
            setSuppliers(parsed.suppliers.map((s) => ({ ...s, status: s.status || "active" })));
          }
          if (parsed.employees) {
            setEmployees(parsed.employees.map((e) => ({ ...e, status: e.status || "present" })));
          }
          if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
          if (parsed.transfers) setTransfers(parsed.transfers);
          if (parsed.manufacturingOrders) setManufacturingOrders(parsed.manufacturingOrders);
          if (parsed.cgpList) setCgpList(parsed.cgpList);
          if (parsed.igpList) setIgpList(parsed.igpList);
          if (parsed.journals) setJournals(parsed.journals);
          if (parsed.goldPrice) setGoldPrice(parsed.goldPrice);
          if (parsed.reservations) setReservations(parsed.reservations);
          if (parsed.approvals) setApprovals(parsed.approvals);
          if (parsed.purchaseOrders) setPurchaseOrders(parsed.purchaseOrders);
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  // ── Persist to localStorage whenever state changes ────────────────────────
  useEffect(() => {
    if (DATA_SOURCE === "api") return;
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          _version: SCHEMA_VERSION,
          assets,
          customers,
          invoices,
          suppliers,
          employees,
          auditLogs,
          transfers,
          manufacturingOrders,
          cgpList,
          igpList,
          journals,
          goldPrice,
          reservations,
          approvals,
          purchaseOrders,
        }),
      );
    } catch {
      // Silently fail if localStorage is full
    }
  }, [hydrated, assets, customers, invoices, suppliers, employees, auditLogs, transfers, manufacturingOrders, cgpList, igpList, journals, goldPrice, reservations, approvals, purchaseOrders]);

  // ── Asset actions ─────────────────────────────────────────────────────────

  const addAsset = useCallback((asset: Asset) => {
    setAssets((current) => [asset, ...current]);
  }, []);

  const updateAsset = useCallback((id: string, updates: Partial<Asset>) => {
    setAssets((current) => updateById(current, id, updates));
  }, []);

  /**
   * Update an asset AND append a timeline event — atomically.
   * This is the correct way to trigger asset lifecycle actions in mock mode.
   */
  const updateAssetWithEvent = useCallback((id: string, updates: Partial<Asset>, event: AssetEvent) => {
    setAssets((current) =>
      current.map((asset) => {
        if (asset.id !== id) return asset;
        return {
          ...asset,
          ...updates,
          events: [...asset.events, event],
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }, []);

  // ── Customer actions ──────────────────────────────────────────────────────

  const addCustomer = useCallback((customer: Customer) => {
    setCustomers((current) => [customer, ...current]);
  }, []);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setCustomers((current) => updateById(current, id, updates));
  }, []);

  // ── Invoice actions ───────────────────────────────────────────────────────

  /**
   * Post an invoice and mark all sold assets as "sold" with an audit event.
   * Immutable — no direct mutations.
   */
  const addInvoice = useCallback((invoice: Invoice) => {
    setInvoices((current) => [invoice, ...current]);
    
    // If it's a return credit note, do not mark any items as sold
    if (invoice.type === "return" || invoice.total < 0) return;

    // For other invoices, only mark assets as sold if their line price is positive (not exchange returns)
    const soldIds = new Set(
      invoice.items
        .filter((item) => (item.price ?? 0) > 0)
        .map((item) => item.assetId)
    );

    setAssets((current) =>
      current.map((asset) => {
        if (!soldIds.has(asset.id)) return asset;
        const saleEvent: AssetEvent = {
          id: `event-${invoice.id}-${asset.id}`,
          action: "Sold",
          date: invoice.date,
          user: "Current user",
          branch: invoice.branch,
          note: `Invoice ${invoice.id}`,
          sourceDocument: invoice.id,
          beforeState: `status:${asset.status}`,
          afterState: "status:sold",
          severity: "info",
        };
        return {
          ...asset,
          status: "sold" as const,
          events: [...asset.events, saleEvent],
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }, []);

  // ── Supplier actions ──────────────────────────────────────────────────────

  const addSupplier = useCallback((supplier: Supplier) => {
    setSuppliers((current) => [supplier, ...current]);
  }, []);

  const updateSupplier = useCallback((id: string, updates: Partial<Supplier>) => {
    setSuppliers((current) => updateById(current, id, updates));
  }, []);

  // ── Employee actions ──────────────────────────────────────────────────────

  const addEmployee = useCallback((employee: Employee) => {
    setEmployees((current) => [...current, employee]);
  }, []);

  const updateEmployee = useCallback((id: string, updates: Partial<Employee>) => {
    setEmployees((current) => updateById(current, id, updates));
  }, []);

  // ── Transfer actions ──────────────────────────────────────────────────────

  const addTransfer = useCallback((transfer: Transfer) => {
    setTransfers((current) => [transfer, ...current]);
  }, []);

  const updateTransfer = useCallback((id: string, updates: Partial<Transfer>) => {
    setTransfers((current) => updateById(current, id, updates));
  }, []);

  // ── Manufacturing actions ─────────────────────────────────────────────────

  const addManufacturingOrder = useCallback((order: ManufacturingOrder) => {
    setManufacturingOrders((current) => [order, ...current]);
  }, []);

  const updateManufacturingOrder = useCallback((id: string, updates: Partial<ManufacturingOrder>) => {
    setManufacturingOrders((current) => updateById(current, id, updates));
  }, []);

  // ── CGP/IGP actions ───────────────────────────────────────────────────────

  const addCGP = useCallback((cgp: CustomerGoldPool) => {
    setCgpList((current) => [cgp, ...current]);
  }, []);

  const updateCGP = useCallback((id: string, updates: Partial<CustomerGoldPool>) => {
    setCgpList((current) => updateById(current, id, updates));
  }, []);

  const addIGP = useCallback((igp: InventoryGoldPool) => {
    setIgpList((current) => [igp, ...current]);
  }, []);

  const updateIGP = useCallback((id: string, updates: Partial<InventoryGoldPool>) => {
    setIgpList((current) => updateById(current, id, updates));
  }, []);

  // ── Journal actions ───────────────────────────────────────────────────────

  const addJournal = useCallback((journal: JournalEntry) => {
    setJournals((current) => [journal, ...current]);
  }, []);

  const updateJournal = useCallback((id: string, updates: Partial<JournalEntry>) => {
    setJournals((current) => updateById(current, id, updates));
  }, []);

  // ── Gold price ────────────────────────────────────────────────────────────

  const updateGoldPrice = useCallback((snapshot: GoldPriceSnapshot) => {
    setGoldPrice(snapshot);
  }, []);

  // ── Reservation actions ───────────────────────────────────────────────────

  const addReservation = useCallback((reservation: Reservation) => {
    setReservations((current) => [reservation, ...current]);
  }, []);

  const updateReservation = useCallback((id: string, updates: Partial<Reservation>) => {
    setReservations((current) => updateById(current, id, updates));
  }, []);

  // ── Approval actions ──────────────────────────────────────────────────────

  const addApproval = useCallback((approval: ApprovalRequest) => {
    setApprovals((current) => [approval, ...current]);
  }, []);

  const updateApproval = useCallback((id: string, updates: Partial<ApprovalRequest>) => {
    setApprovals((current) => updateById(current, id, updates));
  }, []);

  // ── Purchase order actions ────────────────────────────────────────────────

  const addPurchaseOrder = useCallback((po: PurchaseOrder) => {
    setPurchaseOrders((current) => [po, ...current]);
  }, []);

  const updatePurchaseOrder = useCallback((id: string, updates: Partial<PurchaseOrder>) => {
    setPurchaseOrders((current) => updateById(current, id, updates));
  }, []);

  // ── Audit log ─────────────────────────────────────────────────────────────

  const addAuditLog = useCallback((log: AuditLog) => {
    setAuditLogs((current) => [log, ...current]);
  }, []);

  // ── Data management ───────────────────────────────────────────────────────

  const resetDemo = useCallback(() => {
    setAssets(demoAssets);
    setCustomers(demoCustomers);
    setInvoices(demoInvoices);
    setSuppliers(demoSuppliers);
    setEmployees(demoEmployees);
    setAuditLogs(demoAuditLogs);
    setTransfers(demoTransfers);
    setManufacturingOrders(demoManufacturingOrders);
    setCgpList(demoCGP);
    setIgpList(demoIGP);
    setJournals(demoJournals);
    setGoldPrice(demoGoldPrice);
    setReservations(demoReservations);
    setApprovals(demoApprovals);
    setPurchaseOrders(demoPurchaseOrders);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const exportLocalData = useCallback((): string => {
    return JSON.stringify({
      _version: SCHEMA_VERSION,
      _exportedAt: new Date().toISOString(),
      assets,
      customers,
      invoices,
      suppliers,
      employees,
      auditLogs,
      transfers,
      manufacturingOrders,
      cgpList,
      igpList,
      journals,
      goldPrice,
      reservations,
      approvals,
      purchaseOrders,
    }, null, 2);
  }, [assets, customers, invoices, suppliers, employees, auditLogs, transfers, manufacturingOrders, cgpList, igpList, journals, goldPrice, reservations, approvals, purchaseOrders]);

  const importLocalData = useCallback((json: string): { ok: boolean; message?: string } => {
    try {
      const parsed = JSON.parse(json);
      if (!parsed._version) return { ok: false, message: "Invalid data format" };
      if (parsed.assets) setAssets(parsed.assets);
      if (parsed.customers) setCustomers(parsed.customers);
      if (parsed.invoices) setInvoices(parsed.invoices);
      if (parsed.suppliers) setSuppliers(parsed.suppliers);
      if (parsed.employees) setEmployees(parsed.employees);
      if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
      if (parsed.transfers) setTransfers(parsed.transfers);
      if (parsed.manufacturingOrders) setManufacturingOrders(parsed.manufacturingOrders);
      if (parsed.cgpList) setCgpList(parsed.cgpList);
      if (parsed.igpList) setIgpList(parsed.igpList);
      if (parsed.journals) setJournals(parsed.journals);
      if (parsed.goldPrice) setGoldPrice(parsed.goldPrice);
      if (parsed.reservations) setReservations(parsed.reservations);
      if (parsed.approvals) setApprovals(parsed.approvals);
      if (parsed.purchaseOrders) setPurchaseOrders(parsed.purchaseOrders);
      return { ok: true };
    } catch {
      return { ok: false, message: "Failed to parse data" };
    }
  }, []);

  // ── Memoized context value ────────────────────────────────────────────────

  const value = useMemo<ErpContextValue>(
    () => ({
      assets,
      customers,
      invoices,
      suppliers,
      employees,
      auditLogs,
      transfers,
      manufacturingOrders,
      cgpList,
      igpList,
      journals,
      goldPrice,
      reservations,
      approvals,
      purchaseOrders,
      ...repos,
      addAsset,
      updateAsset,
      updateAssetWithEvent,
      addCustomer,
      updateCustomer,
      addInvoice,
      addSupplier,
      updateSupplier,
      addEmployee,
      updateEmployee,
      addTransfer,
      updateTransfer,
      addManufacturingOrder,
      updateManufacturingOrder,
      addCGP,
      updateCGP,
      addIGP,
      updateIGP,
      addJournal,
      updateJournal,
      updateGoldPrice,
      addReservation,
      updateReservation,
      addApproval,
      updateApproval,
      addPurchaseOrder,
      updatePurchaseOrder,
      addAuditLog,
      resetDemo,
      exportLocalData,
      importLocalData,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assets, customers, invoices, suppliers, employees, auditLogs, transfers, manufacturingOrders, cgpList, igpList, journals, goldPrice, reservations, approvals, purchaseOrders, repos],
  );

  return <ErpContext.Provider value={value}>{children}</ErpContext.Provider>;
}

export function useErp() {
  const context = useContext(ErpContext);
  if (!context) throw new Error("useErp must be used inside ErpProvider");
  return context;
}
