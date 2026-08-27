"use client";

/**
 * Phase 32.2-Fix — read-only viewer for type-specific Asset.metadata. Renders the
 * stored JSONB attributes as labelled key/value pairs. Display only; it never
 * mutates the asset or its barcode.
 */

interface InventoryMetadataViewerProps {
  metadata?: Record<string, unknown> | null;
  inventorySubtype?: string | null;
  metadataSchemaVersion?: number | null;
  rtl: boolean;
}

const LABELS: Record<string, { en: string; ar: string }> = {
  goldColor: { en: "Gold color", ar: "لون الذهب" },
  makingCharge: { en: "Making charge", ar: "المصنعية" },
  minimumMakingCharge: { en: "Minimum making charge", ar: "أقل مصنعية" },
  stoneWeight: { en: "Stone weight (ST)", ar: "وزن الأحجار" },
  discount: { en: "Tag discount (DIS)", ar: "خصم التاج" },
  stones: { en: "Stones", ar: "الأحجار" },
  pieceCount: { en: "Piece count", ar: "عدد القطع" },
  purchaseCost: { en: "Purchase cost", ar: "تكلفة الشراء" },
  carat: { en: "Carat", ar: "القيراط" },
  color: { en: "Color", ar: "اللون" },
  clarity: { en: "Clarity", ar: "النقاء" },
  cut: { en: "Cut", ar: "القطع" },
  shape: { en: "Shape", ar: "الشكل" },
  stoneCount: { en: "Stone count", ar: "عدد الأحجار" },
  stoneType: { en: "Stone type", ar: "نوع الحجر" },
  tone: { en: "Tone", ar: "الدرجة" },
  saturation: { en: "Saturation", ar: "التشبع" },
  opticalEffect: { en: "Optical effect", ar: "التأثير البصري" },
  certificateNumber: { en: "Certificate number", ar: "رقم الشهادة" },
  pearlType: { en: "Pearl type", ar: "نوع اللؤلؤ" },
  pearlSize: { en: "Pearl size", ar: "حجم اللؤلؤ" },
  pearlQuality: { en: "Pearl quality", ar: "جودة اللؤلؤ" },
  pearlColor: { en: "Pearl color", ar: "لون اللؤلؤ" },
  pearlCount: { en: "Pearl count", ar: "عدد اللؤلؤ" },
  overtone: { en: "Overtone", ar: "اللون الثانوي" },
  orient: { en: "Orient", ar: "التوهج" },
  luster: { en: "Luster", ar: "اللمعان" },
  nacreQuality: { en: "Nacre quality", ar: "جودة الطبقة" },
  brand: { en: "Brand", ar: "الماركة" },
  model: { en: "Model", ar: "الموديل" },
  referenceNumber: { en: "Reference number", ar: "الرقم المرجعي" },
  watchSerial: { en: "Watch serial", ar: "الرقم التسلسلي" },
  movementType: { en: "Movement type", ar: "نوع الحركة" },
  caseMaterial: { en: "Case material", ar: "مادة الإطار" },
  strapMaterial: { en: "Strap material", ar: "مادة السوار" },
  condition: { en: "Condition", ar: "الحالة" },
  boxIncluded: { en: "Box included", ar: "العلبة مرفقة" },
  papersIncluded: { en: "Papers included", ar: "الأوراق مرفقة" },
  warrantyCard: { en: "Warranty card", ar: "بطاقة الضمان" },
};

function formatValue(value: unknown, rtl: boolean): string {
  if (typeof value === "boolean") return value ? (rtl ? "نعم" : "Yes") : (rtl ? "لا" : "No");
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (entry && typeof entry === "object") {
          const stone = entry as Record<string, unknown>;
          return [stone.type, stone.carat].filter((part) => part !== undefined && part !== "").join(" – ");
        }
        return String(entry);
      })
      .filter(Boolean)
      .join("، ") || "—";
  }
  return String(value);
}

export function InventoryMetadataViewer({ metadata, inventorySubtype, metadataSchemaVersion, rtl }: InventoryMetadataViewerProps) {
  const entries = Object.entries(metadata || {}).filter(([, value]) => value !== null && value !== undefined && value !== "");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-[11px] font-bold text-slate-500">
        {inventorySubtype && (
          <span className="rounded-lg bg-slate-100 px-2 py-1 dark:bg-navy-950">{rtl ? "النوع الفرعي" : "Subtype"}: {inventorySubtype}</span>
        )}
        {metadataSchemaVersion !== undefined && metadataSchemaVersion !== null && (
          <span className="rounded-lg bg-slate-100 px-2 py-1 dark:bg-navy-950">{rtl ? "إصدار البيانات" : "Schema v"}{metadataSchemaVersion}</span>
        )}
      </div>
      {entries.length === 0 ? (
        <p className="text-xs font-semibold text-slate-400">{rtl ? "لا توجد سمات إضافية." : "No type-specific attributes."}</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {entries.map(([key, value]) => (
            <div key={key} className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-navy-950">
              <p className="text-[10px] font-bold text-slate-400">{rtl ? LABELS[key]?.ar ?? key : LABELS[key]?.en ?? key}</p>
              <p className="text-xs font-extrabold text-navy-900 dark:text-white">{formatValue(value, rtl)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
