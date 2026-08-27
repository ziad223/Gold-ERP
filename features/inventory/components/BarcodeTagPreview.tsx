"use client";

/**
 * Phase 32.2-Fix — read-only barcode/tag preview for the item-type forms.
 *
 * IMPORTANT: this component NEVER generates the final stored barcode. It only
 * composes a human-readable PREVIEW of the taxonomy the user has chosen
 * (inventory code + item code + KT + serial placeholder). The authoritative
 * serial and final stored barcode are allocated by the backend
 * (barcode-identity.service) atomically on save.
 */

interface BarcodeTagPreviewProps {
  inventoryCode?: string;
  itemCode?: string;
  karatCode?: string;
  /** Present only when the backend has already allocated a real serial (edit/view). */
  allocatedSerial?: number;
  /** Full stored barcode when it already exists (edit/view). */
  storedBarcode?: string;
  rtl: boolean;
}

const SERIAL_PLACEHOLDER = "NNNNNN";

export function BarcodeTagPreview({ inventoryCode, itemCode, karatCode, allocatedSerial, storedBarcode, rtl }: BarcodeTagPreviewProps) {
  const inv = (inventoryCode || "··").toUpperCase();
  const item = (itemCode || "···").toUpperCase();
  const kt = (karatCode || "··").padStart(2, "0").slice(0, 2);
  const serial =
    allocatedSerial !== undefined && allocatedSerial !== null
      ? String(allocatedSerial).padStart(6, "0")
      : SERIAL_PLACEHOLDER;

  // Preview string only — not written back to the asset. The stored barcode
  // (when it exists) is shown separately below as the source of truth.
  const previewBarcode = `${inv}${item}${kt}${serial}`;

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-navy-950">
      <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500">
        <span className="rounded-lg bg-white px-2 py-1 font-mono dark:bg-navy-900">{rtl ? "كود المخزون" : "Inventory"}: {inv}</span>
        <span className="rounded-lg bg-white px-2 py-1 font-mono dark:bg-navy-900">{rtl ? "كود القطعة" : "Item"}: {item}</span>
        <span className="rounded-lg bg-white px-2 py-1 font-mono dark:bg-navy-900">KT: {kt}</span>
        <span className="rounded-lg bg-white px-2 py-1 font-mono dark:bg-navy-900">{rtl ? "التسلسل" : "Serial"}: {serial}</span>
      </div>
      <p className="mt-3 font-mono text-lg font-black tracking-wide text-navy-900 dark:text-white">{previewBarcode}</p>
      {storedBarcode ? (
        <p className="mt-1 text-[11px] font-bold text-emerald-600">
          {rtl ? "الباركود المخزَّن" : "Stored barcode"}: <span className="font-mono">{storedBarcode}</span>
        </p>
      ) : (
        <p className="mt-1 text-[11px] font-semibold text-slate-400">
          {rtl
            ? "معاينة فقط — يُنشئ الخادم التسلسل والباركود النهائي عند الحفظ."
            : "Preview only — the backend assigns the serial and final barcode on save."}
        </p>
      )}
    </div>
  );
}
