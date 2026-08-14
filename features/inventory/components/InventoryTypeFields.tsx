"use client";

/**
 * Phase 32.2-Fix — type-specific "Section 2" field groups for the inventory
 * item-type Add/Edit forms. Each group is a thin, read/write view over the
 * shared form draft:
 *   - top-level Asset fields (weight / quantity / karat) via `setField`
 *   - type-specific attributes stored in Asset.metadata via `setMeta`
 *
 * These components NEVER generate the final stored barcode. The backend
 * (barcode-identity.service) remains the single source of truth; the form only
 * shows a read-only preview (see BarcodeTagPreview).
 */

import type { ReactNode } from "react";

export interface TypeFieldsProps {
  draft: Record<string, any>;
  meta: Record<string, any>;
  setField: (key: string, value: any) => void;
  setMeta: (key: string, value: any) => void;
  rtl: boolean;
}

// ── Small labelled input primitives (kept local to avoid bloating shared UI) ──

function FieldShell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-bold text-slate-500 dark:text-slate-400">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "h-10 rounded-2xl border border-border bg-panel px-3 text-xs font-semibold text-foreground outline-none focus:ring-4 focus:ring-ring/20";

export function TextField({ label, value, onChange, placeholder }: { label: string; value: any; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <FieldShell label={label}>
      <input className={inputClass} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </FieldShell>
  );
}

export function NumberField({ label, value, onChange, step }: { label: string; value: any; onChange: (v: string) => void; step?: string }) {
  return (
    <FieldShell label={label}>
      <input type="number" step={step ?? "any"} className={inputClass} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </FieldShell>
  );
}

export function SelectField({ label, value, onChange, options }: { label: string; value: any; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <FieldShell label={label}>
      <select className={inputClass} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </FieldShell>
  );
}

export function BoolField({ label, value, onChange }: { label: string; value: any; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
      <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

// ── Gold By Weight (jewellery + 24K / gold bar) ──────────────────────────────

export function GoldWeightFields({ draft, meta, setField, setMeta, rtl }: TypeFieldsProps) {
  return (
    <Grid>
      <SelectField
        label={rtl ? "لون الذهب" : "Gold color"}
        value={meta.goldColor}
        onChange={(v) => setMeta("goldColor", v)}
        options={[
          { value: "yellow", label: rtl ? "أصفر" : "Yellow" },
          { value: "white", label: rtl ? "أبيض" : "White" },
          { value: "rose", label: rtl ? "وردي" : "Rose" },
        ]}
      />
      <NumberField label={rtl ? "الوزن القائم (جم)" : "Gross weight (g)"} value={draft.grossWeight} onChange={(v) => setField("grossWeight", v)} />
      <NumberField label={rtl ? "وزن الأحجار ST (جم)" : "Stone weight ST (g)"} value={meta.stoneWeight} onChange={(v) => setMeta("stoneWeight", v)} />
      <NumberField label={rtl ? "الوزن الصافي (جم)" : "Net weight (g)"} value={draft.netWeight} onChange={(v) => setField("netWeight", v)} />
      <NumberField label={rtl ? "وزن الذهب (جم)" : "Gold weight (g)"} value={draft.goldWeight} onChange={(v) => setField("goldWeight", v)} />
      <NumberField label={rtl ? "المصنعية" : "Making charge"} value={meta.makingCharge} onChange={(v) => setMeta("makingCharge", v)} />
      <NumberField label={rtl ? "أقل مصنعية (للتاج)" : "Minimum making charge (tag)"} value={meta.minimumMakingCharge} onChange={(v) => setMeta("minimumMakingCharge", v)} />
    </Grid>
  );
}

// ── Gold By Piece ────────────────────────────────────────────────────────────

export function GoldPieceFields({ draft, meta, setField, setMeta, rtl }: TypeFieldsProps) {
  return (
    <Grid>
      <NumberField label={rtl ? "عدد القطع / الكمية" : "Piece count / quantity"} value={meta.pieceCount} onChange={(v) => setMeta("pieceCount", v)} step="1" />
      <NumberField label={rtl ? "الوزن القائم (جم)" : "Gross weight (g)"} value={draft.grossWeight} onChange={(v) => setField("grossWeight", v)} />
      <NumberField label={rtl ? "وزن الذهب (جم)" : "Gold weight (g)"} value={draft.goldWeight} onChange={(v) => setField("goldWeight", v)} />
      <NumberField label={rtl ? "المصنعية" : "Making charge"} value={meta.makingCharge} onChange={(v) => setMeta("makingCharge", v)} />
    </Grid>
  );
}

// ── Diamond (jewellery + loose stone) ────────────────────────────────────────

export function DiamondFields({ draft, meta, setField, setMeta, rtl }: TypeFieldsProps) {
  return (
    <Grid>
      <NumberField label={rtl ? "القيراط (Carat)" : "Carat"} value={meta.carat} onChange={(v) => setMeta("carat", v)} />
      <TextField label={rtl ? "اللون (Color)" : "Color"} value={meta.color} onChange={(v) => setMeta("color", v)} />
      <TextField label={rtl ? "النقاء (Clarity)" : "Clarity"} value={meta.clarity} onChange={(v) => setMeta("clarity", v)} />
      <TextField label={rtl ? "القطع (Cut)" : "Cut"} value={meta.cut} onChange={(v) => setMeta("cut", v)} />
      <TextField label={rtl ? "الشكل (Shape)" : "Shape"} value={meta.shape} onChange={(v) => setMeta("shape", v)} />
      <NumberField label={rtl ? "عدد الأحجار" : "Stone count"} value={meta.stoneCount} onChange={(v) => setMeta("stoneCount", v)} step="1" />
      <TextField label={rtl ? "رقم الشهادة" : "Certificate number"} value={meta.certificateNumber} onChange={(v) => setMeta("certificateNumber", v)} />
      <NumberField label={rtl ? "الوزن القائم (جم)" : "Gross weight (g)"} value={draft.grossWeight} onChange={(v) => setField("grossWeight", v)} />
    </Grid>
  );
}

// ── Gem Stone (jewellery + loose stone) ──────────────────────────────────────

// Multi-stone repeater (Phase 32.3). Optional: when empty, the single stoneType/
// carat above is used as the tag fallback. Stored in metadata.stones.
function StonesRepeater({ meta, setMeta, rtl }: Pick<TypeFieldsProps, "meta" | "setMeta" | "rtl">) {
  const stones: any[] = Array.isArray(meta.stones) ? meta.stones : [];
  const update = (index: number, key: string, value: any) =>
    setMeta("stones", stones.map((stone, i) => (i === index ? { ...stone, [key]: value } : stone)));
  const add = () => setMeta("stones", [...stones, { type: "", carat: "" }]);
  const remove = (index: number) => setMeta("stones", stones.filter((_, i) => i !== index));

  return (
    <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500">{rtl ? "أحجار متعددة (اختياري — للتاج)" : "Multiple stones (optional — for tag)"}</span>
        <button type="button" onClick={add} className="text-[11px] font-extrabold text-brand-600 hover:underline">+ {rtl ? "إضافة حجر" : "Add stone"}</button>
      </div>
      {stones.length === 0 ? (
        <p className="text-[10px] font-semibold text-slate-400">
          {rtl ? "إن تُركت فارغة، يُستخدم نوع الحجر والقيراط بالأعلى في التاج." : "If empty, the single stone type/carat above is used on the tag."}
        </p>
      ) : (
        stones.map((stone, index) => (
          <div key={index} className="mb-2 grid gap-2 sm:grid-cols-5">
            <input className={inputClass} placeholder={rtl ? "النوع" : "Type"} value={stone.type ?? ""} onChange={(e) => update(index, "type", e.target.value)} />
            <input className={inputClass} type="number" step="any" placeholder="Carat" value={stone.carat ?? ""} onChange={(e) => update(index, "carat", e.target.value)} />
            <input className={inputClass} placeholder={rtl ? "اللون" : "Color"} value={stone.color ?? ""} onChange={(e) => update(index, "color", e.target.value)} />
            <input className={inputClass} placeholder={rtl ? "الشكل" : "Shape"} value={stone.shape ?? ""} onChange={(e) => update(index, "shape", e.target.value)} />
            <button type="button" onClick={() => remove(index)} className="text-[11px] font-extrabold text-rose-500 hover:underline">{rtl ? "حذف" : "Remove"}</button>
          </div>
        ))
      )}
    </div>
  );
}

export function GemstoneFields({ draft, meta, setField, setMeta, rtl }: TypeFieldsProps) {
  return (
    <div className="space-y-3">
      <Grid>
        <TextField label={rtl ? "نوع الحجر" : "Stone type"} value={meta.stoneType} onChange={(v) => setMeta("stoneType", v)} />
        <NumberField label={rtl ? "القيراط (Carat)" : "Carat"} value={meta.carat} onChange={(v) => setMeta("carat", v)} />
        <TextField label={rtl ? "اللون (Color)" : "Color"} value={meta.color} onChange={(v) => setMeta("color", v)} />
        <TextField label={rtl ? "الشكل (Shape)" : "Shape"} value={meta.shape} onChange={(v) => setMeta("shape", v)} />
        <TextField label={rtl ? "الدرجة (Tone)" : "Tone"} value={meta.tone} onChange={(v) => setMeta("tone", v)} />
        <TextField label={rtl ? "التشبع (Saturation)" : "Saturation"} value={meta.saturation} onChange={(v) => setMeta("saturation", v)} />
        <TextField label={rtl ? "التأثير البصري" : "Optical effect"} value={meta.opticalEffect} onChange={(v) => setMeta("opticalEffect", v)} />
        <NumberField label={rtl ? "عدد الأحجار" : "Stone count"} value={meta.stoneCount} onChange={(v) => setMeta("stoneCount", v)} step="1" />
        <TextField label={rtl ? "رقم الشهادة" : "Certificate number"} value={meta.certificateNumber} onChange={(v) => setMeta("certificateNumber", v)} />
        <NumberField label={rtl ? "الوزن القائم (جم)" : "Gross weight (g)"} value={draft.grossWeight} onChange={(v) => setField("grossWeight", v)} />
      </Grid>
      <StonesRepeater meta={meta} setMeta={setMeta} rtl={rtl} />
    </div>
  );
}

// ── Pearl (jewellery + loose pearl) ──────────────────────────────────────────

export function PearlFields({ draft, meta, setField, setMeta, rtl }: TypeFieldsProps) {
  return (
    <Grid>
      <TextField label={rtl ? "نوع اللؤلؤ" : "Pearl type"} value={meta.pearlType} onChange={(v) => setMeta("pearlType", v)} />
      <TextField label={rtl ? "حجم اللؤلؤ" : "Pearl size"} value={meta.pearlSize} onChange={(v) => setMeta("pearlSize", v)} />
      <TextField label={rtl ? "جودة اللؤلؤ" : "Pearl quality"} value={meta.pearlQuality} onChange={(v) => setMeta("pearlQuality", v)} />
      <TextField label={rtl ? "لون اللؤلؤ" : "Pearl color"} value={meta.pearlColor} onChange={(v) => setMeta("pearlColor", v)} />
      <NumberField label={rtl ? "عدد اللؤلؤ" : "Pearl count"} value={meta.pearlCount} onChange={(v) => setMeta("pearlCount", v)} step="1" />
      <TextField label={rtl ? "اللون الثانوي (Overtone)" : "Overtone"} value={meta.overtone} onChange={(v) => setMeta("overtone", v)} />
      <TextField label={rtl ? "التوهج (Orient)" : "Orient"} value={meta.orient} onChange={(v) => setMeta("orient", v)} />
      <TextField label={rtl ? "اللمعان (Luster)" : "Luster"} value={meta.luster} onChange={(v) => setMeta("luster", v)} />
      <TextField label={rtl ? "جودة الطبقة (Nacre)" : "Nacre quality"} value={meta.nacreQuality} onChange={(v) => setMeta("nacreQuality", v)} />
      <NumberField label={rtl ? "الوزن القائم (جم)" : "Gross weight (g)"} value={draft.grossWeight} onChange={(v) => setField("grossWeight", v)} />
    </Grid>
  );
}

// ── Watch — owner-approved provisional type (WT / WCH / 00) ───────────────────

export function WatchFields({ draft, meta, setField, setMeta, rtl }: TypeFieldsProps) {
  return (
    <div className="space-y-3">
      <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-bold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
        {rtl
          ? "الساعات: نوع نظامي مبدئي بموافقة المالك بانتظار تأكيد العميل. العيار اختياري (KT = 00)."
          : "Watch: owner-approved provisional type pending client confirmation. Karat optional (KT = 00)."}
      </p>
      <Grid>
        <TextField label={rtl ? "الماركة (Brand)" : "Brand"} value={meta.brand} onChange={(v) => setMeta("brand", v)} />
        <TextField label={rtl ? "الموديل (Model)" : "Model"} value={meta.model} onChange={(v) => setMeta("model", v)} />
        <TextField label={rtl ? "الرقم المرجعي" : "Reference number"} value={meta.referenceNumber} onChange={(v) => setMeta("referenceNumber", v)} />
        <TextField label={rtl ? "الرقم التسلسلي للساعة" : "Watch serial number"} value={meta.watchSerial} onChange={(v) => setMeta("watchSerial", v)} />
        <TextField label={rtl ? "نوع الحركة" : "Movement type"} value={meta.movementType} onChange={(v) => setMeta("movementType", v)} />
        <TextField label={rtl ? "مادة الإطار" : "Case material"} value={meta.caseMaterial} onChange={(v) => setMeta("caseMaterial", v)} />
        <TextField label={rtl ? "مادة السوار" : "Strap material"} value={meta.strapMaterial} onChange={(v) => setMeta("strapMaterial", v)} />
        <TextField label={rtl ? "الحالة" : "Condition"} value={meta.condition} onChange={(v) => setMeta("condition", v)} />
        <TextField label={rtl ? "رقم الشهادة" : "Certificate number"} value={meta.certificateNumber} onChange={(v) => setMeta("certificateNumber", v)} />
        <NumberField label={rtl ? "الوزن القائم (جم)" : "Gross weight (g)"} value={draft.grossWeight} onChange={(v) => setField("grossWeight", v)} />
      </Grid>
      <div className="flex flex-wrap gap-4 pt-1">
        <BoolField label={rtl ? "العلبة مرفقة" : "Box included"} value={meta.boxIncluded} onChange={(v) => setMeta("boxIncluded", v)} />
        <BoolField label={rtl ? "الأوراق مرفقة" : "Papers included"} value={meta.papersIncluded} onChange={(v) => setMeta("papersIncluded", v)} />
        <BoolField label={rtl ? "بطاقة الضمان" : "Warranty card"} value={meta.warrantyCard} onChange={(v) => setMeta("warrantyCard", v)} />
      </div>
    </div>
  );
}
