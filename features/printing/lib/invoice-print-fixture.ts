import type { Invoice } from "@/lib/types";
import type { InvoicePrintTemplateProps } from "@/features/printing/components/InvoicePrintTemplate";

export const FIXTURE_INVOICE: Invoice = {
  id: "TEST-INV-001",
  customerId: "cust-001",
  customerName: "Test Customer",
  date: "2026-01-15",
  total: 5250,
  tax: 250,
  vatRate: 5,
  subtotal: 5000,
  discount: 0,
  paidAmount: 5250,
  remainingAmount: 0,
  status: "paid",
  postingStatus: "posted",
  invoiceNumber: "INV-2026-000001",
  paymentMethod: "cash",
  branch: "Main Branch",
  items: [
    {
      id: 1,
      assetId: "AST-001",
      name: "Gold Ring 21K",
      quantity: 1,
      price: 3000,
      weight: 8.5,
      karat: 21,
    },
    {
      id: 2,
      assetId: "AST-002",
      name: "Gold Necklace 18K",
      quantity: 1,
      price: 2000,
      weight: 12.3,
      karat: 18,
    },
  ],
  notes: "Test invoice notes",
};

export const FIXTURE_COMPANY: InvoicePrintTemplateProps["company"] = {
  name: "Test Jewellery Co",
  branch: "Main Branch",
  trn: "123456789012345",
  currency: "AED",
};

export const FIXTURE_LABELS: InvoicePrintTemplateProps["labels"] = {
  invoice: "Invoice",
  invoiceNo: "Invoice No.",
  uuid: "UUID",
  date: "Date",
  branch: "Branch",
  trn: "TRN",
  customer: "Customer",
  cashier: "Cashier",
  item: "Item",
  assetId: "Asset ID",
  description: "Description",
  weight: "Weight",
  karat: "Karat",
  qty: "Qty",
  price: "Price",
  makingCharge: "Making Charge",
  stoneValue: "Stone Value",
  discount: "Discount",
  subtotal: "Subtotal",
  vat: "VAT",
  total: "Total",
  payment: "Payment",
  remaining: "Remaining",
  notes: "Notes",
  qr: "QR",
};

export const FIXTURE_SETTINGS = {
  currency: "AED",
  decimalPrecision: 2,
  // Phase 19X-Fix: display-only company print info (notably the previously
  // unsourced company email) merged into the print ViewModel.
  printCompanyInfo: {
    version: 1,
    email: "print@fixture.example",
    phone: "+971500000000",
    address: "Fixture Street, Dubai",
    taxNumber: "999888777",
  },
};
