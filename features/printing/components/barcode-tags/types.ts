/**
 * Phase 32.3-Fix — configuration + helpers for the client front/back barcode tag
 * layouts. Presentation only: nothing here changes accounting, cost, pricing, or
 * COGS meaning. The generic BarcodePrintTemplate and Product label flow are not
 * affected by this module.
 */

import type { AssetTagData, AssetTagStone } from "@/lib/print/barcode-label";

export type RfidTagMode = "hidden" | "indicator" | "value";

export interface ClientTagConfig {
  widthMm: number;
  heightMm: number;
  direction: "RTL" | "LTR";
  fontSizePx: number;
  columns: number;
  showCompanyName: boolean;
  showLogo: boolean;
  showBorder: boolean;
  /** Client examples imply a linear barcode; QR stays optional. */
  showQrCode: boolean;
  /** Merge making charge + minimum making charge into one seller-only value. */
  obfuscateMakingCharge: boolean;
  /** RFID default is indicator-only (privacy); value is opt-in. */
  rfidMode: RfidTagMode;
  /** Watch is provisional — mark it and keep its price configurable. */
  showProvisionalWatchMarker: boolean;
  showWatchPrice: boolean;
}

// Conservative defaults. Physical dimensions match the existing 62mm × 28mm tag;
// the physical duplex method is left to the printer and is pending client
// confirmation (see docs).
export const DEFAULT_CLIENT_TAG_CONFIG: ClientTagConfig = {
  widthMm: 62,
  heightMm: 28,
  direction: "LTR",
  fontSizePx: 8,
  columns: 2,
  showCompanyName: true,
  showLogo: false,
  showBorder: true,
  showQrCode: false,
  obfuscateMakingCharge: false,
  rfidMode: "indicator",
  showProvisionalWatchMarker: true,
  showWatchPrice: true,
};

// Price visibility policy (client barcode doc): Gold By Weight hides the selling
// price (gold price is dynamic); every other client type shows it. Watch is
// provisional and configurable.
export function shouldShowPrice(type: string, config: ClientTagConfig): boolean {
  if (type === "gold-weight") return false;
  if (type === "watch") return config.showWatchPrice;
  return true;
}

export function isWatch(item: AssetTagData): boolean {
  return item.type === "watch";
}

const asNumber = (value: any): number | undefined => {
  if (value === "" || value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

export function fmtWeight(value: any): string | null {
  const n = asNumber(value);
  return n === undefined ? null : `${n.toFixed(2)}g`;
}

/**
 * Making-charge display. When obfuscation is ON and BOTH the required and minimum
 * making charges exist, they are concatenated (client "25 + 18 → 2518") — a
 * seller-only presentation. A missing second value is never invented.
 */
export function fmtMakingCharge(makingCharge: any, minimumMakingCharge: any, obfuscate: boolean): string | null {
  const mc = asNumber(makingCharge);
  const min = asNumber(minimumMakingCharge);
  if (obfuscate && mc !== undefined && min !== undefined) {
    return `${mc}${min}`;
  }
  if (mc !== undefined) return String(mc);
  return null;
}

/** DIS row value from metadata.discount (tag/client discount only). */
export function fmtDiscount(discount: any): string | null {
  const n = asNumber(discount);
  return n === undefined ? null : String(n);
}

/** Combine diamond color + clarity into the client "CC" value. */
export function fmtColorClarity(color: any, clarity: any): string | null {
  const parts = [color, clarity].map((p) => (p === "" || p === null || p === undefined ? null : String(p))).filter(Boolean);
  return parts.length ? parts.join(" – ") : null;
}

/**
 * Resolve gemstone stones: prefer the metadata.stones array (Phase 32.3), else
 * fall back to the single stoneType/carat captured earlier. Never invent stones.
 */
export function resolveStones(metadata: Record<string, any>): AssetTagStone[] {
  const arr = metadata.stones;
  if (Array.isArray(arr) && arr.length) {
    return arr
      .filter((s) => s && (s.type || s.carat))
      .map((s) => ({ type: String(s.type || ""), carat: asNumber(s.carat), color: s.color || undefined, shape: s.shape || undefined }));
  }
  if (metadata.stoneType || metadata.carat) {
    return [{ type: String(metadata.stoneType || ""), carat: asNumber(metadata.carat) }];
  }
  return [];
}

/** Karat label for the back face; blank when not applicable (loose/watch). */
export function fmtKaratName(item: AssetTagData): string {
  const karat = item.karat ? `${item.karat}K` : "";
  return [karat, item.name].filter(Boolean).join(" ").trim();
}
