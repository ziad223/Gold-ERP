/**
 * Canonical barcode-label payload shared by the print template
 * (BarcodePrintTemplate), the on-screen preview (BarcodeLabelPreview) and the
 * inventory batch-print flow — so Product and Asset map to ONE shape and the
 * preview and print can never drift apart.
 *
 * P7.1 is a data-shape unification only: no symbology/QR change, no new fields,
 * no migration. `barcode` always falls back to the record id so a missing
 * barcode never blocks printing, and every inventory type stays printable.
 */
export interface BarcodeLabelData {
  /** Stable record id (asset.id or product.id). */
  assetId: string;
  name: string;
  /** Scan value — falls back to the record id when no barcode is set. */
  barcode: string;
  rfid?: string;
  grossWeight: number;
  karat?: number;
  price: number;
  branch?: string;
  stockType?: string;
  supplierName?: string;
  createdAt?: string;
  /** How many copies to print for this label (batch). */
  copies?: number;
}

/** Map a serialized Asset to the canonical label payload. */
export function assetToLabelData(asset: any, copies = 1): BarcodeLabelData {
  return {
    assetId: asset.id,
    name: asset.name,
    barcode: asset.barcode || asset.id,
    rfid: asset.rfid,
    grossWeight: Number(asset.grossWeight) || 0,
    karat: asset.karat ?? undefined,
    price: Number(asset.price) || 0,
    branch: asset.branch,
    stockType: asset.type,
    supplierName: asset.source,
    createdAt: asset.createdAt,
    copies,
  };
}

/**
 * Clamp label-size config to safe ranges so a bad/empty setting can never break
 * printing (falls back to sensible defaults). Returns a new config object.
 */
export function sanitizeBarcodeConfig<T extends Record<string, any>>(config: T): T {
  const clamp = (v: any, min: number, max: number, dflt: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= min && n <= max ? n : dflt;
  };
  return {
    ...config,
    widthMm: clamp(config.widthMm, 10, 300, 62),
    heightMm: clamp(config.heightMm, 8, 300, 28),
    columns: Math.round(clamp(config.columns, 1, 8, 2)),
    copies: Math.round(clamp(config.copies, 1, 1000, 1)),
    fontSizePx: clamp(config.fontSizePx, 5, 30, 8),
  };
}

/** Map a quantity-based Product to the canonical label payload. */
export function productToLabelData(product: any, copies = 1): BarcodeLabelData {
  return {
    assetId: product.id,
    name: product.productName,
    barcode: product.productCode || product.id,
    rfid: undefined,
    grossWeight: Number(product.averageUnitWeight) || 0,
    karat: product.karat ?? undefined,
    price: Number(product.salePrice) || 0,
    branch: product.branchName,
    stockType: product.stockType,
    supplierName: undefined,
    createdAt: undefined,
    copies,
  };
}
