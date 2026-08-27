"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const draft = require("../backend/src/services/gold-purchase-draft.service");
const measurement = require("../backend/src/services/gold-purchase-measurement.service");
const pricingSnapshots = require("../backend/src/services/cgp-pricing-snapshot.service");

const header = Object.freeze({ id: "CGPD:test", companyId: "COMP:test", branchId: "BR:test", currency: "AED" });
const item = Object.freeze({
  id: "CGPD:test:L1", companyId: "COMP:test", documentId: "CGPD:test",
  karat: "21.000000", purityFactor: "0.875000",
  grossWeight: "10.000000", stoneWeight: "0.000000", netWeight: "10.000000",
});
const pricing = Object.freeze({
  priceSource: "GOLD_CENTER_APPROVED_PRICE_SNAPSHOT",
  priceVersion: "test-v1",
  priceTimestamp: "2026-08-09T00:00:00.000Z",
  approvedPriceId: 1,
  approvedPriceStatus: "APPROVED",
  approvedPriceAt: "2026-08-09T00:00:00.000Z",
  approvedPriceBy: "USR:test",
  approvedPriceSource: "ACCEPTANCE_TEST",
  approvedKaratRate: "50.0000",
});

test("CGP legacy status compatibility maps business and governance facts without Posting", () => {
  assert.deepEqual(draft.CGP_BUSINESS_STATUSES, ["DRAFT", "VALIDATED", "POSTED", "REVERSED"]);
  assert.deepEqual(draft.CGP_GOVERNANCE_STATUSES, ["NONE", "PENDING", "APPROVED", "REJECTED"]);
  assert.deepEqual(draft.cgpLifecycleForLegacyStatus("draft"), { businessStatus: "DRAFT", governanceStatus: "NONE" });
  assert.deepEqual(draft.cgpLifecycleForLegacyStatus("validated"), { businessStatus: "VALIDATED", governanceStatus: "NONE" });
  assert.deepEqual(draft.cgpLifecycleForLegacyStatus("submitted"), { businessStatus: "VALIDATED", governanceStatus: "PENDING" });
  assert.deepEqual(draft.cgpLifecycleForLegacyStatus("approved"), { businessStatus: "VALIDATED", governanceStatus: "APPROVED" });
  assert.throws(() => draft.cgpLifecycleForLegacyStatus("posted"), /Unsupported legacy CGP status/);
});

test("CGP measurement uses Decimal evidence for net and pure gold", () => {
  const result = measurement.calculate({ karat: "21", fineness: "0.875", grossWeight: "10.000000", stoneWeight: "1.250000" });
  assert.equal(result.netWeight, "8.750000");
  assert.equal(result.pureGoldWeight, "7.656250");
  assert.throws(() => measurement.calculate({ karat: "21", fineness: "0.875", grossWeight: "1", stoneWeight: "1" }), /Stone weight must be less than gross weight/);
});

test("CGP pricing snapshot uses the karat-specific rate exactly once and rounds money HALF_UP", () => {
  const snapshot = pricingSnapshots.buildSnapshot({ document: header, item, pricing: { ...pricing, lineGoldValue: "0.0000" } });
  assert.equal(snapshot.rateBasis, "KARAT_SPECIFIC");
  assert.equal(snapshot.pureGoldWeight, "8.750000");
  assert.equal(snapshot.lineGoldValue, "500.0000");
  assert.notEqual(snapshot.lineGoldValue, "437.5000", "pure gold must not be used as a second monetary multiplier");

  const edge = pricingSnapshots.buildSnapshot({
    document: header,
    item: { ...item, grossWeight: "1.000000", netWeight: "1.000000", purityFactor: "1.000000" },
    pricing: { ...pricing, approvedKaratRate: "1.23445" },
  });
  assert.equal(edge.approvedKaratRate, "1.2345");
  assert.equal(edge.lineGoldValue, "1.2345");
});

test("CGP pricing snapshot rejects noncanonical basis and requires a caller transaction", async () => {
  assert.throws(() => pricingSnapshots.buildSnapshot({ document: header, item, pricing: { ...pricing, rateBasis: "FINE_GOLD" } }), /rate basis must be KARAT_SPECIFIC/);
  await assert.rejects(() => pricingSnapshots.createSnapshot({ document: header, item, pricing }), /caller transaction/);
});

test("CGP draft APIs keep client status and final value out of their write authority", () => {
  const source = fs.readFileSync(path.join(__dirname, "../backend/src/services/gold-purchase-draft.service.js"), "utf8");
  const governance = fs.readFileSync(path.join(__dirname, "../backend/src/services/gold-purchase-governance.service.js"), "utf8");
  assert.match(source, /status: "draft"/);
  assert.match(source, /cgpLifecycleForLegacyStatus\("validated"\)/);
  assert.match(governance, /cgpLifecycleForLegacyStatus\("submitted"\)/);
  assert.match(governance, /businessStatus: "VALIDATED", governanceStatus: "REJECTED"/);
  assert.doesNotMatch(source, /lineGoldValue/);
  assert.doesNotMatch(source, /businessStatus:\s*body\.businessStatus/);
});
