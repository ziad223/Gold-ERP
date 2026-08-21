"use client";

import { CircleDot, Coins, Diamond, Gem, Scale, Sparkles } from "lucide-react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Modal } from "@/components/ui/modal";

type InventoryIntakeChooserProps = {
  open: boolean;
  onClose: () => void;
  supplierId?: string;
};

const profiles = [
  { key: "GOLD_BY_WEIGHT", icon: Scale, enabled: true },
  { key: "GOLD_BY_PIECE", icon: Coins, enabled: true },
  { key: "DIAMOND", icon: Diamond, enabled: true },
  { key: "DIAMOND_LOOSE", icon: Diamond, enabled: true },
  { key: "GEM_STONE", icon: Sparkles, enabled: true },
  { key: "GEM_STONE_LOOSE", icon: Sparkles, enabled: true },
  { key: "PEARL", icon: CircleDot, enabled: false },
] as const;

export function InventoryIntakeChooser({ open, onClose, supplierId }: InventoryIntakeChooserProps) {
  const locale = useLocale();
  const rtl = locale === "ar";
  const gbwHref = supplierId
    ? `/inventory/gold-by-weight?supplierId=${encodeURIComponent(supplierId)}`
    : "/inventory/gold-by-weight";
  const gbpHref = supplierId
    ? `/inventory/gold-by-piece?supplierId=${encodeURIComponent(supplierId)}`
    : "/inventory/gold-by-piece";
  const diamondHref = supplierId
    ? `/inventory/diamond-jewellery?supplierId=${encodeURIComponent(supplierId)}`
    : "/inventory/diamond-jewellery";
  const looseDiamondHref = supplierId
    ? `/inventory/loose-diamond?supplierId=${encodeURIComponent(supplierId)}`
    : "/inventory/loose-diamond";
  const gemStoneHref = supplierId
    ? `/inventory/gem-stone?supplierId=${encodeURIComponent(supplierId)}`
    : "/inventory/gem-stone";
  const looseGemStoneHref = supplierId
    ? `/inventory/loose-gem-stone?supplierId=${encodeURIComponent(supplierId)}`
    : "/inventory/loose-gem-stone";

  const labels = {
    title: rtl ? "إضافة / استلام مخزون" : "Add / Receive Inventory",
    description: rtl ? "اختر ملف المخزون لفتح مسار الاستلام المعتمد." : "Choose an inventory profile to open the canonical receive path.",
    enabled: rtl ? "متاح الآن" : "Available now",
    planned: rtl ? "قريبًا" : "Coming next",
    profiles: {
      GOLD_BY_WEIGHT: rtl ? "ذهب بالوزن" : "Gold By Weight",
      GOLD_BY_PIECE: rtl ? "ذهب بالقطعة" : "Gold By Piece",
      DIAMOND: rtl ? "ألماس مجوهرات" : "Diamond Jewellery",
      DIAMOND_LOOSE: rtl ? "ألماس حر" : "Loose Diamond",
      GEM_STONE: rtl ? "أحجار كريمة" : "Gem Stone",
      GEM_STONE_LOOSE: rtl ? "حجر كريم حر" : "Loose Gem Stone",
      PEARL: rtl ? "لؤلؤ" : "Pearl",
    },
  };

  return (
    <Modal open={open} onClose={onClose} title={labels.title} description={labels.description}>
      <div data-intake-chooser="true" className="grid gap-3 sm:grid-cols-2">
        {profiles.map(({ key, icon: Icon, enabled }) => (
          enabled ? (
            <Link
              key={key}
              href={key === "GOLD_BY_PIECE" ? gbpHref : key === "DIAMOND" ? diamondHref : key === "DIAMOND_LOOSE" ? looseDiamondHref : key === "GEM_STONE" ? gemStoneHref : key === "GEM_STONE_LOOSE" ? looseGemStoneHref : gbwHref}
              onClick={onClose}
              data-intake-profile={key}
              className="group rounded-2xl border border-brand-200 bg-brand-50/70 p-4 text-start transition hover:border-brand-400 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-brand-900 dark:bg-brand-950/20 dark:hover:border-brand-700"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white"><Icon className="h-5 w-5" /></span>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{labels.enabled}</span>
              </div>
              <p className="mt-4 text-sm font-black text-foreground">{labels.profiles[key]}</p>
            </Link>
          ) : (
            <button
              key={key}
              type="button"
              disabled
              data-intake-profile={key}
              data-intake-profile-disabled="true"
              className="cursor-not-allowed rounded-2xl border border-border bg-surface-muted/60 p-4 text-start opacity-70"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-muted text-muted-foreground"><Icon className="h-5 w-5" /></span>
                <span className="rounded-full bg-surface-muted px-2 py-1 text-[10px] font-black text-muted-foreground">{labels.planned}</span>
              </div>
              <p className="mt-4 text-sm font-black text-foreground">{labels.profiles[key]}</p>
            </button>
          )
        ))}
      </div>
    </Modal>
  );
}
