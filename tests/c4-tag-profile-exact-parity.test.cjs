const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const types = read("features/printing/components/barcode-tags/types.ts");
const backs = read("features/printing/components/barcode-tags/BarcodeTagBacks.tsx");
const front = read("features/printing/components/barcode-tags/BarcodeTagFront.tsx");
const template = read("features/printing/components/ClientBarcodeTagTemplate.tsx");
const preview = read("features/inventory/components/ClientAssetTagPreview.tsx");
const detail = read("app/[locale]/(dashboard)/inventory/[id]/page.tsx");

test("C4 freezes one shared renderer and the exact five profile field orders", () => {
  assert.match(types, /CLIENT_TAG_PROFILE_FIELDS/);
  for (const fieldSet of [
    '"gold-weight": ["barcode", "title", "GW", "ST", "NT", "MC"]',
    '"gold-piece": ["barcode", "price", "title", "brand", "WT", "DIS"]',
    'diamond: ["barcode", "price", "title", "carat", "CC", "DIS"]',
    'gemstone: ["barcode", "price", "title", "ST", "DIS"]',
    'pearl: ["barcode", "price", "title", "type", "DIS"]',
  ]) assert.match(types, new RegExp(fieldSet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(template, /BarcodeTagBack/);
  assert.match(template, /BarcodeTagFront/);
  assert.match(types, /SKU_AUTHORITY|PROFILE_TO_TAG_TYPE/);
});

test("C4 excludes unproven or non-contract tag rows and hides missing values", () => {
  assert.doesNotMatch(backs, /<Row label="Cut"/);
  assert.doesNotMatch(backs, /<Row label="Cert"/);
  assert.doesNotMatch(backs, /<Row label="Size"/);
  assert.doesNotMatch(backs, /<Row label="Quality"/);
  assert.match(backs, /if \(value === null \|\| value === undefined \|\| value === ""\) return null/);
  assert.match(front, /shouldShowPrice/);
  assert.match(types, /showCompanyName: false/);
  assert.match(types, /rfidMode: "hidden"/);
});

test("C4 keeps Barcode and RFID separate and exposes a read-only Asset tag surface", () => {
  assert.match(read("lib/print/barcode-label.ts"), /String\(asset\.barcode \|\| asset\.id\)/);
  assert.doesNotMatch(template, /apiClient|fetch\(|POST|PUT|PATCH|DELETE/);
  assert.match(preview, /assetToTagData/);
  assert.match(preview, /renderPrintDocument/);
  assert.match(preview, /printHtmlDocument/);
  assert.match(preview, /data-c4-tag-preview/);
  assert.match(detail, /ClientAssetTagPreview/);
});

test("C4 does not introduce a tag write endpoint or a Barcode/RFID mutation path", () => {
  const routes = read("backend/src/routes/erp.routes.js");
  assert.doesNotMatch(routes, /router\.(post|put|patch|delete)\("\/inventory-v2\/tag/);
  assert.match(routes, /\/inventory-v2\/assets\/:id\/tags\/print/);
  assert.match(routes, /requireBusinessPermission\("inventory\.print"/);
  assert.match(read("features/printing/components/ClientBarcodeTagTemplate.tsx"), /data-print-root/);
});

console.log("C4_TAG_PROFILE_EXACT_PARITY: source contract checks ready");
