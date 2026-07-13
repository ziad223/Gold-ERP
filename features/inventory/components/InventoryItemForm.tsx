"use client";

/**
 * Phase 32.2-Fix — type-driven inventory item Add/Edit form.
 *
 * Aligns the existing single "Add Asset" flow to the client's item-type model:
 * Gold By Weight, Gold By Piece, Diamond, Gem Stone, Pearl, and Watch (owner-
 * approved provisional). It reuses the Phase 32.1 barcode/inventory foundation:
 *   - asset.type + inventory_subtype (variant)
 *   - metadata + metadata_schema_version for type-specific attributes
 *   - inventory/item code taxonomy from company-scoped barcode settings
 *
 * The final stored barcode is generated ONLY by the backend on save. This form
 * shows a read-only preview and sends the taxonomy choices; it never writes a
 * final stored barcode from the browser. On edit it sends only non-identity
 * fields (the backend rejects type/karat/barcode changes after a barcode exists).
 */

import { useMemo, useState, type ComponentType } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useAssets } from "@/features/assets/hooks/use-assets";
import { useBarcodeSettings } from "@/features/settings/hooks/use-barcode-settings";
import type { Asset, AssetStatus, AssetType } from "@/lib/types";
import {
  INVENTORY_METADATA_SCHEMA_VERSION,
  INVENTORY_TYPE_CONFIGS,
  WATCH_FALLBACK_CODES,
  getTypeConfig,
  isLooseVariant,
} from "./inventory-item-form-config";
import {
  DiamondFields,
  GemstoneFields,
  GoldPieceFields,
  GoldWeightFields,
  NumberField,
  PearlFields,
  SelectField,
  TextField,
  WatchFields,
  type TypeFieldsProps,
} from "./InventoryTypeFields";
import { BarcodeTagPreview } from "./BarcodeTagPreview";

const TYPE_FIELD_GROUPS: Record<AssetType, ComponentType<TypeFieldsProps>> = {
  "gold-weight": GoldWeightFields,
  "gold-piece": GoldPieceFields,
  diamond: DiamondFields,
  gemstone: GemstoneFields,
  pearl: PearlFields,
  watch: WatchFields,
};

const STATUS_OPTIONS: AssetStatus[] = ["available", "reserved", "in_workshop", "pending_tag"];

interface InventoryItemFormProps {
  mode?: "add" | "edit";
  initialAsset?: Asset | null;
  onDone: () => void;
  onCancel?: () => void;
}

function Section({ index, title, children }: { index: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-black text-navy-900 dark:text-white">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-[11px] text-white">{index}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

export function InventoryItemForm({ mode = "add", initialAsset = null, onDone, onCancel }: InventoryItemFormProps) {
  const locale = useLocale();
  const rtl = locale === "ar";
  const { activeBranch } = useAuth();
  const { createAsset, updateAsset, isCreating } = useAssets();
  const { inventoryCodes, itemCodes } = useBarcodeSettings();

  const [type, setType] = useState<AssetType>(initialAsset?.type ?? "gold-weight");
  const config = getTypeConfig(type);

  const [draft, setDraft] = useState<Record<string, any>>(() => ({
    name: initialAsset?.name ?? "",
    category: initialAsset?.category ?? "",
    variant: initialAsset?.inventorySubtype ?? config.variants[0].value,
    itemCode: initialAsset?.itemCode ?? "",
    karat: initialAsset?.karat != null ? String(initialAsset.karat) : "",
    grossWeight: initialAsset?.grossWeight != null ? String(initialAsset.grossWeight) : "",
    netWeight: initialAsset?.netWeight != null ? String(initialAsset.netWeight) : "",
    goldWeight: initialAsset?.goldWeight != null ? String(initialAsset.goldWeight) : "",
    cost: initialAsset?.cost != null ? String(initialAsset.cost) : "",
    price: initialAsset?.price != null ? String(initialAsset.price) : "",
    branch: initialAsset?.branch ?? activeBranch ?? "",
    location: initialAsset?.location ?? "",
    source: initialAsset?.source ?? "",
    rfid: initialAsset?.rfid ?? "",
    status: (initialAsset?.status as AssetStatus) ?? "available",
  }));
  const [meta, setMetaState] = useState<Record<string, any>>(() => ({ ...(initialAsset?.metadata as any) }));

  const setField = (key: string, value: any) => setDraft((current) => ({ ...current, [key]: value }));
  const setMeta = (key: string, value: any) => setMetaState((current) => ({ ...current, [key]: value }));

  // Resolve taxonomy for the barcode preview from company-scoped settings, with a
  // documented fallback for provisional Watch when settings are unavailable.
  const activeInventory = inventoryCodes.find((code) => code.assetType === type && code.isActive);
  const resolvedInventoryCode =
    activeInventory?.code || (type === "watch" ? WATCH_FALLBACK_CODES.inventoryCode : config.defaultInventoryCode);

  const itemOptions = useMemo(
    () =>
      itemCodes.filter(
        (code) =>
          code.isActive &&
          (!code.allowedInventoryCodes.length || code.allowedInventoryCodes.includes(resolvedInventoryCode)),
      ),
    [itemCodes, resolvedInventoryCode],
  );

  const fallbackItemCode = type === "watch"
    ? WATCH_FALLBACK_CODES.itemCode
    : isLooseVariant(config, draft.variant)
      ? "LOS"
      : "RNG";
  const effectiveItemCode = (draft.itemCode || activeInventory?.defaultItemCode || fallbackItemCode).toUpperCase();

  const previewKaratCode = type === "watch"
    ? WATCH_FALLBACK_CODES.karatCode
    : draft.karat
      ? String(Number(draft.karat) || 0).padStart(2, "0")
      : "";

  const changeType = (nextType: AssetType) => {
    const nextConfig = getTypeConfig(nextType);
    setType(nextType);
    setDraft((current) => ({
      ...current,
      variant: nextConfig.variants[0].value,
      itemCode: "",
      karat: nextType === "watch" ? "" : current.karat,
    }));
  };

  const FieldGroup = TYPE_FIELD_GROUPS[type];

  const validate = (): string | null => {
    if (!draft.name || String(draft.name).trim().length < 2) return rtl ? "اسم الصنف مطلوب" : "Item name is required";
    if (!effectiveItemCode) return rtl ? "كود القطعة مطلوب" : "Item code is required";
    if (config.karatRequired && !draft.karat) return rtl ? "العيار مطلوب لهذا النوع" : "Karat is required for this type";
    if (config.weightRequired && !(Number(draft.grossWeight) > 0)) return rtl ? "الوزن مطلوب" : "Weight is required";
    if (type === "watch" && !meta.brand && !meta.model) return rtl ? "الماركة أو الموديل مطلوب للساعة" : "Brand or model is required for a watch";
    if (type === "diamond" && !meta.carat && !meta.stoneCount) return rtl ? "القيراط أو عدد الأحجار مطلوب" : "Carat or stone count is required";
    if (type === "gemstone" && !meta.stoneType) return rtl ? "نوع الحجر مطلوب" : "Stone type is required";
    if (type === "gemstone" && !meta.carat && !meta.stoneCount) return rtl ? "القيراط أو عدد الأحجار مطلوب" : "Carat or stone count is required";
    if (type === "pearl" && !meta.pearlType && !meta.pearlCount) return rtl ? "نوع أو عدد اللؤلؤ مطلوب" : "Pearl type or pearl count is required";
    return null;
  };

  const buildMetadata = () => {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(meta)) {
      if (value === "" || value === null || value === undefined) continue;
      cleaned[key] = value;
    }
    return cleaned;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    try {
      if (mode === "edit" && initialAsset) {
        // Identity fields (type/karat/inventory/item/barcode) are immutable once a
        // barcode exists — send only descriptive/operational fields + metadata.
        await updateAsset(initialAsset.id, {
          name: String(draft.name).trim(),
          category: String(draft.category).trim(),
          price: Number(draft.price) || 0,
          cost: Number(draft.cost) || 0,
          location: String(draft.location).trim() || "Showroom",
          rfid: draft.rfid || undefined,
          status: draft.status as AssetStatus,
          metadataSchemaVersion: INVENTORY_METADATA_SCHEMA_VERSION,
          metadata: buildMetadata(),
        });
        toast.success(rtl ? "تم تحديث الصنف" : "Item updated");
        onDone();
        return;
      }

      const gross = Number(draft.grossWeight) || 0;
      await createAsset({
        name: String(draft.name).trim(),
        type,
        category: String(draft.category).trim() || config.label,
        // Taxonomy only — the backend allocates the final serial + stored barcode.
        inventoryCode: resolvedInventoryCode,
        itemCode: effectiveItemCode,
        karat: draft.karat ? Number(draft.karat) : undefined,
        inventorySubtype: draft.variant,
        metadataSchemaVersion: INVENTORY_METADATA_SCHEMA_VERSION,
        metadata: buildMetadata(),
        grossWeight: gross,
        netWeight: Number(draft.netWeight) || gross,
        goldWeight: draft.goldWeight ? Number(draft.goldWeight) : undefined,
        cost: draft.cost ? Number(draft.cost) : undefined,
        price: Number(draft.price) || 0,
        branch: draft.branch || undefined,
        location: String(draft.location).trim() || "Showroom",
        source: draft.source || undefined,
        rfid: draft.rfid || undefined,
        status: draft.status as AssetStatus,
      });
      toast.success(rtl ? "تم إنشاء الصنف" : "Item created");
      onDone();
    } catch (submitError: any) {
      toast.error(submitError?.message || (rtl ? "تعذر حفظ الصنف" : "Could not save the item"));
    }
  };

  const inputClass = "h-10 rounded-2xl border border-border bg-panel px-3 text-xs font-semibold text-foreground outline-none focus:ring-4 focus:ring-ring/20";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {/* ── 1. Identification ─────────────────────────────────────────────── */}
      <Section index={1} title={rtl ? "التعريف" : "Identification"}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TextField label={rtl ? "اسم الصنف" : "Item name"} value={draft.name} onChange={(v) => setField("name", v)} />
          <SelectField
            label={rtl ? "نوع الصنف" : "Item type"}
            value={type}
            onChange={(v) => changeType(v as AssetType)}
            options={INVENTORY_TYPE_CONFIGS.map((c) => ({ value: c.type, label: rtl ? c.labelAr : c.label }))}
          />
          <SelectField
            label={rtl ? "النوع الفرعي" : "Inventory subtype"}
            value={draft.variant}
            onChange={(v) => setField("variant", v)}
            options={config.variants.map((v) => ({ value: v.value, label: rtl ? v.labelAr : v.label }))}
          />
          <TextField label={rtl ? "التصنيف" : "Category"} value={draft.category} onChange={(v) => setField("category", v)} />
          {itemOptions.length ? (
            <SelectField
              label={rtl ? "كود القطعة" : "Item code"}
              value={effectiveItemCode}
              onChange={(v) => setField("itemCode", v)}
              options={itemOptions.map((c) => ({ value: c.code, label: `${c.code} — ${c.displayName}` }))}
            />
          ) : (
            <TextField label={rtl ? "كود القطعة (احتياطي)" : "Item code (fallback)"} value={effectiveItemCode} onChange={(v) => setField("itemCode", v)} />
          )}
          <NumberField
            label={rtl ? (type === "watch" ? "العيار (اختياري)" : "العيار") : type === "watch" ? "Karat (optional)" : "Karat"}
            value={draft.karat}
            onChange={(v) => setField("karat", v)}
            step="1"
          />
        </div>
      </Section>

      {/* ── 2. Type-specific attributes ───────────────────────────────────── */}
      <Section index={2} title={rtl ? config.section2TitleAr : config.section2Title}>
        <FieldGroup draft={draft} meta={meta} setField={setField} setMeta={setMeta} rtl={rtl} />
      </Section>

      {/* ── 3. Purchase / Source ──────────────────────────────────────────── */}
      <Section index={3} title={rtl ? "الشراء / المصدر" : "Purchase / Source"}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TextField label={rtl ? "المورد / المصدر" : "Supplier / source"} value={draft.source} onChange={(v) => setField("source", v)} />
          <NumberField label={rtl ? "تكلفة الشراء" : "Purchase cost"} value={meta.purchaseCost} onChange={(v) => setMeta("purchaseCost", v)} />
        </div>
      </Section>

      {/* ── 4. Cost ───────────────────────────────────────────────────────── */}
      <Section index={4} title={rtl ? "التكلفة" : "Cost"}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField label={rtl ? "التكلفة الحالية" : "Current cost"} value={draft.cost} onChange={(v) => setField("cost", v)} />
        </div>
      </Section>

      {/* ── 5. Sales Pricing ──────────────────────────────────────────────── */}
      <Section index={5} title={rtl ? "سعر البيع" : "Sales Pricing"}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField label={rtl ? "سعر البيع" : "Selling price"} value={draft.price} onChange={(v) => setField("price", v)} />
          {/* Tag/client discount only (metadata.discount) — never derived from or
              applied to invoice discount calculations. */}
          <NumberField label={rtl ? "خصم التاج (DIS)" : "Tag discount (DIS)"} value={meta.discount} onChange={(v) => setMeta("discount", v)} />
        </div>
      </Section>

      {/* ── 6. Tag / Barcode / RFID ───────────────────────────────────────── */}
      <Section index={6} title={rtl ? "التاج / الباركود / RFID" : "Tag / Barcode / RFID"}>
        <div className="space-y-3">
          <BarcodeTagPreview
            inventoryCode={resolvedInventoryCode}
            itemCode={effectiveItemCode}
            karatCode={previewKaratCode}
            allocatedSerial={initialAsset?.barcodeSerial}
            storedBarcode={initialAsset?.barcode && !String(initialAsset.barcode).startsWith("LOCAL-PENDING") ? initialAsset.barcode : undefined}
            rtl={rtl}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <TextField label={rtl ? "RFID (اختياري)" : "RFID (optional)"} value={draft.rfid} onChange={(v) => setField("rfid", v)} />
          </div>
        </div>
      </Section>

      {/* ── 7. Status / Location ──────────────────────────────────────────── */}
      <Section index={7} title={rtl ? "الحالة / الموقع" : "Status / Location"}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-bold text-slate-500 dark:text-slate-400">{rtl ? "الحالة" : "Status"}</span>
            <select className={inputClass} value={draft.status} onChange={(e) => setField("status", e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <TextField label={rtl ? "الفرع" : "Branch"} value={draft.branch} onChange={(v) => setField("branch", v)} />
          <TextField label={rtl ? "الموقع" : "Location"} value={draft.location} onChange={(v) => setField("location", v)} />
        </div>
      </Section>

      {/* ── 8. Audit / Attachments / History ──────────────────────────────── */}
      <Section index={8} title={rtl ? "التدقيق / المرفقات / السجل" : "Audit / Attachments / History"}>
        <p className="text-[11px] font-semibold text-slate-400">
          {rtl
            ? "يُسجَّل التدقيق وسجل الحركات تلقائيًا. المرفقات والصور والسجل الكامل متاحة في صفحة تفاصيل الصنف بعد الحفظ."
            : "Audit and movement history are recorded automatically. Attachments, images, and the full timeline are available on the item detail page after saving."}
        </p>
      </Section>

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>{rtl ? "إلغاء" : "Cancel"}</Button>
        )}
        <Button type="submit" disabled={isCreating}>
          {mode === "edit" ? (rtl ? "حفظ التعديلات" : "Save changes") : (rtl ? "إنشاء الصنف" : "Create item")}
        </Button>
      </div>
    </form>
  );
}
