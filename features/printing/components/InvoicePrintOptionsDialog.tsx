"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { NativeSelect } from "@/components/ui/native-select";
import type { Invoice } from "@/lib/types";
import { getInvoicePrintDocumentTitle } from "@/features/printing/lib/invoice-print-view-model";
import type { PrintTemplateLanguageMode } from "@/features/printing/lib/print-template-config";
import {
  getDefaultInvoicePrintOptions,
  printModeMatchesInvoice,
  type InvoicePrintDocumentMode,
  type InvoicePrintOptions,
  type InvoicePrintTemplateId,
} from "@/features/printing/lib/invoice-print-options";

/**
 * Print options dialog — Phase 19F.
 *
 * Collects display-only print choices (document title mode / template /
 * language) then hands them to the existing print flow. Pure UI: no API calls,
 * no persistence (no DB/localStorage/settings save), no data mutation, and no
 * financial computation — the template still renders stored invoice truth via
 * the InvoicePrintViewModel.
 */

interface InvoicePrintOptionsDialogProps {
  open: boolean;
  invoice: Invoice | null;
  locale: string;
  /** Company-saved defaults (Phase 19G); falls back to the 19F defaults. */
  initialOptions?: InvoicePrintOptions;
  onClose: () => void;
  onPrint: (invoice: Invoice, options: InvoicePrintOptions) => void;
}

const DOCUMENT_MODES: Array<{ value: InvoicePrintDocumentMode; labelEn: string; labelAr: string }> = [
  { value: "auto", labelEn: "Auto (from invoice)", labelAr: "تلقائي حسب الفاتورة" },
  { value: "taxInvoice", labelEn: "Tax Invoice", labelAr: "فاتورة ضريبية" },
  { value: "salesInvoice", labelEn: "Sales Invoice", labelAr: "فاتورة مبيعات" },
  { value: "returnInvoice", labelEn: "Return Invoice", labelAr: "فاتورة مرتجع" },
  { value: "exchangeInvoice", labelEn: "Exchange Invoice", labelAr: "فاتورة استبدال" },
  { value: "installmentInvoice", labelEn: "Installment Invoice", labelAr: "فاتورة أقساط" },
  { value: "depositInvoice", labelEn: "Deposit Invoice", labelAr: "فاتورة عربون" },
  { value: "giftVoucher", labelEn: "Gift Voucher", labelAr: "قسيمة هدية" },
  { value: "customerGoldPurchase", labelEn: "Customer Gold Purchase", labelAr: "شراء ذهب من عميل" },
];

const TEMPLATES: Array<{ value: InvoicePrintTemplateId | string; labelEn: string; labelAr: string; disabled?: boolean }> = [
  { value: "luxuryGold", labelEn: "Luxury Gold A4", labelAr: "الذهبي الفاخر A4" },
  { value: "compactA4", labelEn: "Compact A4", labelAr: "مضغوط A4" },
  { value: "minimal", labelEn: "Minimal A4", labelAr: "بسيط A4" },
  { value: "thermal", labelEn: "Thermal Receipt", labelAr: "إيصال حراري" },
];

const LANGUAGE_MODES: Array<{ value: PrintTemplateLanguageMode; labelEn: string; labelAr: string }> = [
  { value: "bilingual", labelEn: "Bilingual (AR + EN)", labelAr: "ثنائي اللغة" },
  { value: "ar", labelEn: "Arabic", labelAr: "العربية" },
  { value: "en", labelEn: "English", labelAr: "الإنجليزية" },
];

export function InvoicePrintOptionsDialog({
  open,
  invoice,
  locale,
  initialOptions,
  onClose,
  onPrint,
}: InvoicePrintOptionsDialogProps) {
  const rtl = locale === "ar";
  const [options, setOptions] = useState<InvoicePrintOptions>(initialOptions ?? getDefaultInvoicePrintOptions());

  // Seed from the company-saved defaults (or the 19F defaults) each time the
  // dialog opens for an invoice.
  useEffect(() => {
    if (open) setOptions(initialOptions ?? getDefaultInvoicePrintOptions());
  }, [open, invoice?.id, initialOptions]);

  if (!invoice) return null;

  const autoTitle = getInvoicePrintDocumentTitle(invoice);
  const mismatch = !printModeMatchesInvoice(options.documentMode, invoice);
  const label = (en: string, ar: string) => (rtl ? ar : en);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={label("Print Options", "خيارات الطباعة")}
      description={label(
        "Display choices only — invoice data and totals stay unchanged.",
        "خيارات عرض فقط — بيانات الفاتورة وقيمها لا تتغير.",
      )}
    >
      <div className="space-y-4">
        <label className="block">
          <span className="label-base">{label("Document Type", "نوع المستند")}</span>
          <NativeSelect
            value={options.documentMode}
            onChange={(e) => setOptions((o) => ({ ...o, documentMode: e.target.value as InvoicePrintDocumentMode }))}
          >
            {DOCUMENT_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {label(mode.labelEn, mode.labelAr)}
                {mode.value === "auto" ? ` — ${rtl ? autoTitle.titleAr : autoTitle.titleEn}` : ""}
              </option>
            ))}
          </NativeSelect>
          {mismatch && (
            <p className="mt-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
              {label(
                "This type may not match the current invoice data. Title changes only.",
                "هذا النوع قد لا يطابق بيانات الفاتورة الحالية. يتغير العنوان المطبوع فقط.",
              )}
            </p>
          )}
        </label>

        <label className="block">
          <span className="label-base">{label("Template", "قالب الطباعة")}</span>
          <NativeSelect
            value={options.templateId}
            onChange={(e) => setOptions((o) => ({ ...o, templateId: e.target.value as InvoicePrintTemplateId }))}
          >
            {TEMPLATES.map((template) => (
              <option key={template.value} value={template.value} disabled={template.disabled}>
                {label(template.labelEn, template.labelAr)}
              </option>
            ))}
          </NativeSelect>
        </label>

        <label className="block">
          <span className="label-base">{label("Language", "اللغة")}</span>
          <NativeSelect
            value={options.languageMode}
            onChange={(e) => setOptions((o) => ({ ...o, languageMode: e.target.value as PrintTemplateLanguageMode }))}
          >
            {LANGUAGE_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {label(mode.labelEn, mode.labelAr)}
              </option>
            ))}
          </NativeSelect>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            {label("Cancel", "إلغاء")}
          </Button>
          <Button onClick={() => onPrint(invoice, options)}>
            <Printer className="h-4 w-4" />
            {label("Print", "طباعة")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
