import type { Invoice, InvoiceItem, PaymentSplit } from "@/lib/types";

export type InvoicePrintDocumentType =
  | "sales"
  | "tax"
  | "return"
  | "creditNote"
  | "exchange"
  | "installment"
  | "deposit"
  | "giftVoucher"
  | "customerGoldPurchase"
  | "unknown";

export type InvoicePrintWarning =
  | "company_logo_missing"
  | "company_trn_missing"
  | "customer_phone_missing"
  | "customer_address_missing"
  | "customer_trn_missing"
  | "payment_rows_not_included_in_invoice_detail"
  | "line_vat_missing"
  | "line_total_missing"
  | "installment_schedule_not_included"
  | "exchange_old_new_sections_not_available_from_flat_items"
  | "gift_voucher_fields_missing"
  | "customer_gold_purchase_fields_missing";

export type InvoicePrintViewModel = {
  document: {
    titleAr: string;
    titleEn: string;
    type: InvoicePrintDocumentType;
    rawType?: string;
    number: string;
    date: string;
    status?: string;
    postingStatus?: string;
    originalInvoiceNumber?: string;
    originalInvoiceId?: string;
  };
  company: {
    nameAr?: string;
    nameEn?: string;
    displayName?: string;
    logoUrl?: string;
    watermarkUrl?: string;
    phone?: string;
    email?: string;
    address?: string;
    trn?: string;
  };
  customer: {
    name?: string;
    phone?: string;
    trn?: string;
    address?: string;
  };
  invoiceDetails: Array<{
    labelAr: string;
    labelEn: string;
    value: string;
  }>;
  items: Array<{
    index: number;
    id?: number | string;
    assetId?: string;
    description: string;
    karat?: string;
    weight?: number;
    quantity?: number;
    unitPrice?: number;
    netAmount?: number;
    vatAmount?: number;
    totalAmount?: number;
    warnings?: InvoicePrintWarning[];
  }>;
  payments: Array<{
    method: string;
    methodLabelAr: string;
    methodLabelEn: string;
    amount?: number;
    currency?: string;
  }>;
  totals: {
    subtotal?: number;
    discount?: number;
    vatRate?: number;
    vatAmount?: number;
    totalAmount?: number;
    paidAmount?: number;
    remainingAmount?: number;
    currency?: string;
  };
  notes?: string;
  warnings: InvoicePrintWarning[];
  special?: {
    exchange?: {
      returnedItems?: unknown[];
      newItems?: unknown[];
      difference?: number;
    };
    installments?: {
      downPayment?: number;
      remainingBalance?: number;
      installmentCount?: number;
      scheduleSummary?: unknown[];
    };
    deposit?: {
      depositAmount?: number;
      depositStatus?: string;
      liabilityNoteAr?: string;
      liabilityNoteEn?: string;
    };
    giftVoucher?: {
      voucherNumber?: string;
      voucherValue?: number;
      expiryDate?: string;
      redemptionPolicyAr?: string;
      redemptionPolicyEn?: string;
    };
    customerGoldPurchase?: {
      goldWeight?: number;
      karat?: string;
      purchaseRate?: number;
      reversePurchaseNoteAr?: string;
      reversePurchaseNoteEn?: string;
    };
  };
};

export type InvoicePrintViewModelOptions = {
  company?: {
    businessName?: string;
    nameAr?: string;
    nameEn?: string;
    logo?: string | null;
    taxNumber?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  };
  settings?: unknown;
  locale?: string;
  currency?: string;
  getPublicFileUrl?: (path?: string | null) => string | undefined;
};

type AnyRecord = Record<string, unknown>;

const hasValue = (value: unknown): value is string | number =>
  value !== undefined && value !== null && String(value).trim() !== "";

const asRecord = (value: unknown): AnyRecord => (value && typeof value === "object" ? value as AnyRecord : {});

const asNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const asString = (value: unknown): string | undefined => (hasValue(value) ? String(value) : undefined);

const addWarning = (warnings: InvoicePrintWarning[], warning: InvoicePrintWarning) => {
  if (!warnings.includes(warning)) warnings.push(warning);
};

export function getInvoicePrintDocumentTitle(invoice: Invoice): {
  type: InvoicePrintDocumentType;
  titleAr: string;
  titleEn: string;
} {
  const rawType = String((invoice as Invoice & { type?: string }).type || "sale");
  const taxAmount = asNumber(invoice.tax) ?? 0;
  const vatRate = asNumber(invoice.vatRate) ?? 0;

  if (rawType === "sale") {
    return taxAmount > 0 || vatRate > 0
      ? { type: "tax", titleAr: "فاتورة ضريبية", titleEn: "TAX INVOICE" }
      : { type: "sales", titleAr: "فاتورة مبيعات", titleEn: "SALES INVOICE" };
  }

  if (rawType === "return") return { type: "return", titleAr: "فاتورة مرتجع", titleEn: "RETURN INVOICE" };
  if (rawType === "exchange") return { type: "exchange", titleAr: "فاتورة استبدال", titleEn: "EXCHANGE INVOICE" };
  if (rawType === "installment") return { type: "installment", titleAr: "فاتورة أقساط", titleEn: "INSTALLMENT INVOICE" };
  if (rawType === "deposit") return { type: "deposit", titleAr: "فاتورة عربون", titleEn: "DEPOSIT INVOICE" };
  if (rawType === "giftVoucher") return { type: "giftVoucher", titleAr: "فاتورة قسيمة هدية", titleEn: "GIFT VOUCHER INVOICE" };
  if (rawType === "customerGoldPurchase") {
    return { type: "customerGoldPurchase", titleAr: "فاتورة شراء ذهب من عميل", titleEn: "CUSTOMER GOLD PURCHASE INVOICE" };
  }

  return { type: "unknown", titleAr: "فاتورة", titleEn: "INVOICE" };
}

export function buildInvoicePrintViewModel(
  invoice: Invoice,
  options: InvoicePrintViewModelOptions = {},
): InvoicePrintViewModel {
  const warnings: InvoicePrintWarning[] = [];
  const rawType = String((invoice as Invoice & { type?: string }).type || "");
  const documentTitle = getInvoicePrintDocumentTitle(invoice);
  const settings = asRecord(options.settings);
  const receiptSettings = asRecord(settings.receipt);
  const company = options.company ?? {};
  const logoUrl = company.logo && options.getPublicFileUrl ? options.getPublicFileUrl(company.logo) : asString(company.logo);
  const trn = asString(company.taxNumber) ?? asString(receiptSettings.vatNumber);
  const address = asString(company.address) ?? asString(receiptSettings.address);
  const phone = asString(company.phone) ?? asString(receiptSettings.phone);
  const displayName = asString(company.businessName) ?? asString(company.nameEn) ?? asString(company.nameAr);
  const currency = options.currency ?? asString(settings.currency);

  if (!logoUrl) addWarning(warnings, "company_logo_missing");
  if (!trn) addWarning(warnings, "company_trn_missing");

  addWarning(warnings, "customer_phone_missing");
  addWarning(warnings, "customer_address_missing");
  addWarning(warnings, "customer_trn_missing");

  const items = (Array.isArray(invoice.items) ? invoice.items : []).map((item, index) =>
    mapInvoiceItem(item, index, warnings),
  );

  const payments = mapPayments(invoice.paymentMethod, invoice.paymentSplits, invoice.paidAmount, currency, warnings);
  const special = buildSpecialSections(invoice, documentTitle.type, warnings);

  return {
    document: {
      titleAr: documentTitle.titleAr,
      titleEn: documentTitle.titleEn,
      type: documentTitle.type,
      rawType,
      number: invoice.invoiceNumber || invoice.id,
      date: invoice.postedAt || invoice.date,
      status: invoice.status,
      postingStatus: invoice.postingStatus,
      originalInvoiceId: invoice.relatedInvoiceId,
    },
    company: {
      nameAr: company.nameAr,
      nameEn: company.nameEn,
      displayName,
      logoUrl,
      watermarkUrl: logoUrl,
      phone,
      email: asString(company.email),
      address,
      trn,
    },
    customer: {
      name: invoice.customerName,
    },
    invoiceDetails: buildInvoiceDetails(invoice),
    items,
    payments,
    totals: {
      subtotal: asNumber(invoice.subtotal),
      discount: asNumber(invoice.discount),
      vatRate: asNumber(invoice.vatRate),
      vatAmount: asNumber(invoice.tax),
      totalAmount: asNumber(invoice.total),
      paidAmount: asNumber(invoice.paidAmount),
      remainingAmount: asNumber(invoice.remainingAmount),
      currency,
    },
    notes: invoice.notes,
    warnings,
    special,
  };
}

function mapInvoiceItem(
  item: InvoiceItem,
  index: number,
  globalWarnings: InvoicePrintWarning[],
): InvoicePrintViewModel["items"][number] {
  const itemWarnings: InvoicePrintWarning[] = [];
  addWarning(itemWarnings, "line_vat_missing");
  addWarning(itemWarnings, "line_total_missing");
  addWarning(globalWarnings, "line_vat_missing");
  addWarning(globalWarnings, "line_total_missing");

  return {
    index: index + 1,
    id: item.id,
    assetId: item.assetId,
    description: item.name,
    karat: item.karat !== undefined ? `${item.karat}K` : undefined,
    weight: asNumber(item.weight),
    quantity: asNumber(item.quantity),
    unitPrice: asNumber(item.price),
    netAmount: undefined,
    vatAmount: undefined,
    totalAmount: undefined,
    warnings: itemWarnings,
  };
}

function mapPayments(
  paymentMethod: string,
  paymentSplits: PaymentSplit[] | undefined,
  paidAmount: number | undefined,
  currency: string | undefined,
  warnings: InvoicePrintWarning[],
): InvoicePrintViewModel["payments"] {
  if (Array.isArray(paymentSplits) && paymentSplits.length > 0) {
    return paymentSplits.map((split) => ({
      method: split.method,
      methodLabelAr: split.method,
      methodLabelEn: split.method,
      amount: asNumber(split.amount),
      currency,
    }));
  }

  addWarning(warnings, "payment_rows_not_included_in_invoice_detail");

  return [{
    method: paymentMethod,
    methodLabelAr: paymentMethod,
    methodLabelEn: paymentMethod,
    amount: asNumber(paidAmount),
    currency,
  }];
}

function buildInvoiceDetails(invoice: Invoice): InvoicePrintViewModel["invoiceDetails"] {
  const details: InvoicePrintViewModel["invoiceDetails"] = [
    { labelAr: "رقم الفاتورة", labelEn: "Invoice No.", value: invoice.invoiceNumber || invoice.id },
    { labelAr: "تاريخ الفاتورة", labelEn: "Invoice Date", value: invoice.postedAt || invoice.date },
    { labelAr: "طريقة الدفع", labelEn: "Payment Method", value: invoice.paymentMethod },
  ];

  if (invoice.status) details.push({ labelAr: "الحالة", labelEn: "Status", value: invoice.status });
  if (invoice.postingStatus) details.push({ labelAr: "حالة الاعتماد", labelEn: "Posting Status", value: invoice.postingStatus });
  if (invoice.relatedInvoiceId) details.push({ labelAr: "الفاتورة الأصلية", labelEn: "Original Invoice", value: invoice.relatedInvoiceId });

  return details;
}

function buildSpecialSections(
  invoice: Invoice,
  type: InvoicePrintDocumentType,
  warnings: InvoicePrintWarning[],
): InvoicePrintViewModel["special"] | undefined {
  if (type === "exchange") {
    addWarning(warnings, "exchange_old_new_sections_not_available_from_flat_items");
    return {
      exchange: {
        returnedItems: undefined,
        newItems: undefined,
        difference: asNumber(invoice.remainingAmount),
      },
    };
  }

  if (type === "installment") {
    if (!Array.isArray(invoice.installments) || invoice.installments.length === 0) {
      addWarning(warnings, "installment_schedule_not_included");
    }
    return {
      installments: {
        downPayment: asNumber(invoice.downPayment),
        remainingBalance: asNumber(invoice.remainingAmount),
        installmentCount: asNumber(invoice.installmentCount),
        scheduleSummary: invoice.installments,
      },
    };
  }

  if (type === "deposit") {
    return {
      deposit: {
        depositAmount: asNumber(invoice.deposit) ?? asNumber(invoice.total),
        depositStatus: invoice.status,
        liabilityNoteAr: "العربون التزام على الشركة وليس إيراد بيع.",
        liabilityNoteEn: "Deposit is a customer liability, not sales revenue.",
      },
    };
  }

  if (type === "giftVoucher") {
    addWarning(warnings, "gift_voucher_fields_missing");
    return {
      giftVoucher: {
        voucherNumber: invoice.invoiceNumber || invoice.id,
        voucherValue: asNumber(invoice.total),
        redemptionPolicyAr: "الاستخدام الكامل فقط.",
        redemptionPolicyEn: "Full redemption only.",
      },
    };
  }

  if (type === "customerGoldPurchase") {
    addWarning(warnings, "customer_gold_purchase_fields_missing");
    return {
      customerGoldPurchase: {
        reversePurchaseNoteAr: "شراء ذهب من العميل: النظام هو المشتري.",
        reversePurchaseNoteEn: "Customer gold purchase: the system is the buyer.",
      },
    };
  }

  return undefined;
}
