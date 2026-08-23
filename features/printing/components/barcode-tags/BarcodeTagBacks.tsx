/**
 * Phase 32.3-Fix — client tag BACK faces, one per inventory type. Missing
 * optional rows are HIDDEN (never printed as fake zeros). No purchase/internal
 * cost is ever rendered. Watch is owner-approved provisional (not from client
 * docs).
 */

import type { AssetTagData } from "@/lib/print/barcode-label";
import type { ClientTagConfig } from "./types";
import {
  fmtColorClarity,
  fmtDiscount,
  fmtKaratName,
  fmtMakingCharge,
  fmtWeight,
  resolveStones,
} from "./types";

interface BackProps {
  item: AssetTagData;
  config: ClientTagConfig;
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="barcode-tag-row">
      <span className="barcode-tag-row-label">{label}</span>
      <span className="barcode-tag-row-value">{value}</span>
    </div>
  );
}

function BackShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="barcode-tag-face barcode-tag-back" data-tag-face="back">
      {title && <div className="barcode-tag-title">{title}</div>}
      {children}
    </div>
  );
}

// 1) Gold By Weight — GW / ST / NT / MC. NT is the STORED net weight (never
// computed from GW − ST). Price is never shown on this type.
export function GoldWeightTagBack({ item, config }: BackProps) {
  const meta = item.metadata || {};
  return (
    <BackShell title={fmtKaratName(item)}>
      <Row label="GW" value={fmtWeight(item.grossWeight)} />
      <Row label="ST" value={fmtWeight(meta.stoneWeight)} />
      <Row label="NT" value={fmtWeight(item.netWeight)} />
      <Row label="MC" value={fmtMakingCharge(meta.makingCharge, meta.minimumMakingCharge, config.obfuscateMakingCharge)} />
    </BackShell>
  );
}

// 2) Gold By Piece — optional brand / WT (gross) / DIS.
export function GoldPieceTagBack({ item }: BackProps) {
  const meta = item.metadata || {};
  return (
    <BackShell title={fmtKaratName(item)}>
      <Row label="" value={meta.brand ? String(meta.brand) : null} />
      <Row label="WT" value={fmtWeight(item.grossWeight)} />
      <Row label="DIS" value={fmtDiscount(meta.discount)} />
    </BackShell>
  );
}

// 3/4) Diamond (jewellery + loose). Loose never invents a gold karat.
export function DiamondTagBack({ item }: BackProps) {
  const meta = item.metadata || {};
  const loose = /loose/i.test(item.inventorySubtype || "");
  const title = loose ? item.name : fmtKaratName(item);
  return (
    <BackShell title={title}>
      <Row label="Carat" value={meta.carat !== undefined && meta.carat !== "" ? String(meta.carat) : null} />
      <Row label="CC" value={fmtColorClarity(meta.color, meta.clarity)} />
      <Row label="Cut" value={meta.cut ? String(meta.cut) : (meta.shape ? String(meta.shape) : null)} />
      <Row label="DIS" value={fmtDiscount(meta.discount)} />
      <Row label="Cert" value={meta.certificateNumber ? String(meta.certificateNumber) : null} />
    </BackShell>
  );
}

// 5/6) Gem Stone (jewellery + loose). Multiple ST rows via metadata.stones with
// single-stone fallback. Loose never invents a gold karat.
export function GemstoneTagBack({ item }: BackProps) {
  const meta = item.metadata || {};
  const loose = /loose/i.test(item.inventorySubtype || "");
  const title = loose ? item.name : fmtKaratName(item);
  const stones = resolveStones(meta);
  return (
    <BackShell title={title}>
      {stones.map((stone, index) => (
        <Row
          key={`${stone.type}-${index}`}
          label="ST"
          value={[stone.type, stone.carat !== undefined ? stone.carat : null].filter((v) => v !== null && v !== "").join(" – ") || null}
        />
      ))}
      <Row label="DIS" value={fmtDiscount(meta.discount)} />
      <Row label="Cert" value={meta.certificateNumber ? String(meta.certificateNumber) : null} />
    </BackShell>
  );
}

// 7/8) Pearl (jewellery + loose). Loose never invents a gold karat.
export function PearlTagBack({ item }: BackProps) {
  const meta = item.metadata || {};
  const loose = /loose/i.test(item.inventorySubtype || "");
  const title = loose ? item.name : fmtKaratName(item);
  return (
    <BackShell title={title}>
      <Row label="Type" value={meta.pearlType ? String(meta.pearlType) : null} />
      <Row label="Size" value={meta.pearlSize ? String(meta.pearlSize) : null} />
      <Row label="Quality" value={meta.pearlQuality ? String(meta.pearlQuality) : null} />
      <Row label="DIS" value={fmtDiscount(meta.discount)} />
    </BackShell>
  );
}

// 9) Watch — owner-approved provisional (NOT from client documents).
export function WatchTagBack({ item }: BackProps) {
  const meta = item.metadata || {};
  return (
    <BackShell title={item.name}>
      <Row label="Brand" value={meta.brand ? String(meta.brand) : null} />
      <Row label="Model" value={meta.model ? String(meta.model) : null} />
      <Row label="Ref" value={meta.referenceNumber ? String(meta.referenceNumber) : null} />
      <Row label="Movement" value={meta.movementType ? String(meta.movementType) : null} />
      <Row label="Condition" value={meta.condition ? String(meta.condition) : null} />
      <Row label="Serial" value={meta.watchSerial ? String(meta.watchSerial) : null} />
      <Row label="DIS" value={fmtDiscount(meta.discount)} />
    </BackShell>
  );
}

export function BarcodeTagBack({ item, config }: BackProps) {
  switch (item.type) {
    case "gold-weight":
      return <GoldWeightTagBack item={item} config={config} />;
    case "gold-piece":
      return <GoldPieceTagBack item={item} config={config} />;
    case "diamond":
      return <DiamondTagBack item={item} config={config} />;
    case "gemstone":
      return <GemstoneTagBack item={item} config={config} />;
    case "pearl":
      return <PearlTagBack item={item} config={config} />;
    case "watch":
      return <WatchTagBack item={item} config={config} />;
    default:
      return <GoldPieceTagBack item={item} config={config} />;
  }
}
