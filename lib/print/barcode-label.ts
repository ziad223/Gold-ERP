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
