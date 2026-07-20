/**
 * Phase 21.1-Fix — verify the generic /invoices CRUD guards.
 *
 * Functionally exercises generic invoice lifecycle guards against a branch-aware
 * model fixture. The supported draft-edit endpoint is separately source-checked
 * for its transactional invoice-and-item behavior. No database, migration, or
 * seed is required.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ErpController = require(path.resolve(__dirname, "..", "backend", "src", "controllers", "erp.controller.js"));

function makeRes() {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}
function makeNext() {
  const errors = [];
  const next = (err) => { errors.push(err); };
  next.errors = errors;
  return next;
}
function invoiceModel(overrides = {}) {
  return {
    name: "Invoice",
    rawAttributes: { id: { type: { constructor: { name: "STRING" } } }, status: {}, branchId: {} },
    associations: {},
    findOne: async () => overrides.item ?? null,
    ...overrides,
  };
}
const baseReq = (extra = {}) => ({
  companyId: "CMP-TEST",
  branchId: "BR-TEST-A",
  effectiveCompanyId: "CMP-TEST",
  effectiveBranchId: "BR-TEST-A",
  user: null,
  headers: {},
  params: {},
  body: {},
  ...extra
});

function branchAwareDraft(overrides = {}) {
  const state = {
    id: "INV-D",
    companyId: "CMP-TEST",
    branchId: "BR-TEST-A",
    customerId: "CUS-TEST-A",
    postingStatus: "draft",
    notes: "before",
    ...overrides
  };
  let updateCount = 0;
  return {
    ...state,
    state,
    get updateCount() { return updateCount; },
    toJSON: () => ({ ...state }),
    update: async (body) => {
      updateCount += 1;
      Object.assign(state, body);
      // Stop after the controller's branch-aware persistence call so this unit
      // verifier does not reach unrelated audit/recalculation infrastructure.
      throw new Error("STOP_AFTER_BRANCH_SAFE_DRAFT_PERSISTENCE");
    }
  };
}

async function run() {
  // 1. Generic CREATE is blocked entirely for invoices (would default to posted).
  {
    const ctrl = new ErpController(invoiceModel(), []);
    const res = makeRes();
    const next = makeNext();
    await ctrl.create(baseReq({ body: { total: 100, customerId: "C", items: [] } }), res, next);
    assert.equal(res.statusCode, 403, "generic invoice create must be blocked (403)");
    assert.equal(res.body.success, false);
  }

  // 2. Generic UPDATE of a POSTED invoice is blocked (409).
  {
    const posted = { postingStatus: "posted", customerId: "C", toJSON: () => ({}), update: async () => {} };
    const ctrl = new ErpController(invoiceModel({ findOne: async () => posted }), []);
    const res = makeRes();
    const next = makeNext();
    await ctrl.update(baseReq({ params: { id: "INV-1" }, body: { total: 999 } }), res, next);
    assert.equal(res.statusCode, 409, "generic update of a posted invoice must be blocked (409)");
  }

  // 3. Generic UPDATE of a CANCELLED invoice is blocked (409).
  {
    const cancelled = { postingStatus: "cancelled", customerId: "C", toJSON: () => ({}), update: async () => {} };
    const ctrl = new ErpController(invoiceModel({ findOne: async () => cancelled }), []);
    const res = makeRes();
    await ctrl.update(baseReq({ params: { id: "INV-2" }, body: { total: 5 } }), res, makeNext());
    assert.equal(res.statusCode, 409, "generic update of a cancelled invoice must be blocked (409)");
  }

  // 4. A branch-valid DRAFT reaches the generic controller's persistence stage.
  //    This verifies the observable branch-scoped state transition rather than
  //    binding the verifier to a particular ORM method name.
  {
    const draft = branchAwareDraft();
    const ctrl = new ErpController(invoiceModel({ findOne: async () => draft }), []);
    const res = makeRes();
    const next = makeNext();
    await ctrl.update(baseReq({ params: { id: "INV-D" }, body: { notes: "x" } }), res, next);
    assert.equal(res.statusCode, null, "branch-valid draft update must not be rejected by lifecycle guards");
    assert.equal(draft.state.notes, "x", "branch-valid draft header change reaches persistence");
    assert.equal(draft.state.branchId, "BR-TEST-A", "effective branch is retained on the draft");
    assert.equal(draft.updateCount, 1, "branch-valid draft mutation has one persistence attempt");
    assert.ok(next.errors.some((e) => e && /STOP_AFTER_BRANCH_SAFE_DRAFT_PERSISTENCE/.test(e.message)), "fixture stops only after branch-safe draft persistence");
  }

  // 5. Generic UPDATE of a DRAFT invoice still blocks lifecycle fields (403).
  {
    const draft = branchAwareDraft();
    const ctrl = new ErpController(invoiceModel({ findOne: async () => draft }), []);
    const res = makeRes();
    await ctrl.update(baseReq({ params: { id: "INV-D" }, body: { postingStatus: "posted" } }), res, makeNext());
    assert.equal(res.statusCode, 403, "lifecycle field on a draft update must be blocked (403)");
    assert.equal(draft.updateCount, 0, "lifecycle rejection has zero write");
  }

  // 6. Missing or forged branch context is rejected before draft persistence.
  {
    const missingBranchDraft = branchAwareDraft();
    const missingBranchCtrl = new ErpController(invoiceModel({ findOne: async () => missingBranchDraft }), []);
    const missingBranchNext = makeNext();
    await missingBranchCtrl.update(baseReq({ branchId: null, effectiveBranchId: null, params: { id: "INV-D" }, body: { notes: "missing branch" } }), makeRes(), missingBranchNext);
    assert.equal(missingBranchDraft.updateCount, 0, "missing branch context has zero write");
    assert.ok(missingBranchNext.errors.some((e) => e && /explicit active branch/i.test(e.message)), "missing branch context is rejected");

    const forgedBranchDraft = branchAwareDraft();
    const forgedBranchCtrl = new ErpController(invoiceModel({ findOne: async () => forgedBranchDraft }), []);
    const forgedBranchNext = makeNext();
    await forgedBranchCtrl.update(baseReq({ params: { id: "INV-D" }, body: { branchId: "BR-TEST-B", notes: "forged branch" } }), makeRes(), forgedBranchNext);
    assert.equal(forgedBranchDraft.updateCount, 0, "forged branch context has zero write");
    assert.ok(forgedBranchNext.errors.some((e) => e && e.errorCode === "BRANCH_SCOPE_FORBIDDEN"), "forged branch context is rejected without leakage");
  }

  // 7. A cross-branch invoice is absent from the scoped lookup and cannot write.
  {
    const crossBranchDraft = branchAwareDraft({ branchId: "BR-TEST-B" });
    const ctrl = new ErpController(invoiceModel({
      findOne: async ({ where }) => (where.branchId === "BR-TEST-A" ? null : crossBranchDraft)
    }), []);
    const next = makeNext();
    await ctrl.update(baseReq({ params: { id: "INV-B" }, body: { notes: "cross branch" } }), makeRes(), next);
    assert.equal(crossBranchDraft.updateCount, 0, "cross-branch draft has zero write");
    assert.ok(next.errors.some((e) => e && /record not found/i.test(e.message)), "cross-branch draft is not resolved outside effective branch");
  }

  // 8. Reversed invoices are immutable just like posted/cancelled invoices.
  {
    let updates = 0;
    const reversed = { postingStatus: "reversed", customerId: "C", branchId: "BR-TEST-A", toJSON: () => ({}), update: async () => { updates += 1; } };
    const ctrl = new ErpController(invoiceModel({ findOne: async () => reversed }), []);
    const res = makeRes();
    await ctrl.update(baseReq({ params: { id: "INV-R" }, body: { notes: "forbidden" } }), res, makeNext());
    assert.equal(res.statusCode, 409, "generic update of a reversed invoice must be blocked (409)");
    assert.equal(updates, 0, "reversed invoice rejection has zero write");
  }

  // 9. Generic DELETE of a POSTED invoice is blocked (409); destroy never runs.
  {
    let destroyed = false;
    const posted = { postingStatus: "posted", customerId: "C", toJSON: () => ({}), destroy: async () => { destroyed = true; } };
    const ctrl = new ErpController(invoiceModel({ findOne: async () => posted }), []);
    const res = makeRes();
    await ctrl.delete(baseReq({ params: { id: "INV-1" } }), res, makeNext());
    assert.equal(res.statusCode, 409, "generic delete of a posted invoice must be blocked (409)");
    assert.equal(destroyed, false, "posted invoice must not be destroyed");
  }

  // 10. Generic DELETE of a DRAFT invoice is allowed (reaches persistence).
  {
    const draft = { postingStatus: "draft", customerId: "C", toJSON: () => ({}), destroy: async () => { throw new Error("REACHED_DESTROY"); } };
    const ctrl = new ErpController(invoiceModel({ findOne: async () => draft }), []);
    const res = makeRes();
    const next = makeNext();
    await ctrl.delete(baseReq({ params: { id: "INV-D" } }), res, next);
    assert.equal(res.statusCode, null, "draft delete must not be blocked by the posted guard");
    assert.ok(next.errors.some((e) => e && /REACHED_DESTROY/.test(e.message)), "draft delete must reach item.destroy()");
  }

  // 11. Generic DEACTIVATE / REACTIVATE are blocked for invoices (409).
  {
    const posted = { postingStatus: "posted", toJSON: () => ({}), update: async () => {} };
    const ctrlA = new ErpController(invoiceModel({ findOne: async () => posted }), []);
    const resA = makeRes();
    await ctrlA.deactivate(baseReq({ params: { id: "INV-1" } }), resA, makeNext());
    assert.equal(resA.statusCode, 409, "generic deactivate of an invoice must be blocked (409)");

    const ctrlB = new ErpController(invoiceModel({ findOne: async () => posted }), []);
    const resB = makeRes();
    await ctrlB.reactivate(baseReq({ params: { id: "INV-1" } }), resB, makeNext());
    assert.equal(resB.statusCode, 409, "generic reactivate of an invoice must be blocked (409)");
  }

  // 12. Guards are scoped to Invoice only — a different model's update is NOT
  //    blocked by the invoice guard (reaches item.update). Sentinel proves it.
  {
    const widget = {
      name: "Widget",
      rawAttributes: { id: { type: { constructor: { name: "STRING" } } } },
      associations: {},
      findOne: async () => ({ postingStatus: "posted", customerId: "C", toJSON: () => ({}), update: async () => { throw new Error("REACHED_WIDGET_UPDATE"); } }),
    };
    const ctrl = new ErpController(widget, []);
    const res = makeRes();
    const next = makeNext();
    await ctrl.update(baseReq({ params: { id: "W-1" }, body: { foo: "bar" } }), res, next);
    assert.equal(res.statusCode, null, "non-invoice update must not be blocked by the invoice guard");
    assert.ok(next.errors.some((e) => e && /REACHED_WIDGET_UPDATE/.test(e.message)), "non-invoice update must reach item.update()");
  }

  // 13. Static: generic invoice mutation is blocked at routing, while the
  // supported draft route retains transactional update/item-replacement,
  // audit, and rollback behavior.
  const routes = fs.readFileSync(path.resolve(__dirname, "..", "backend", "src", "routes", "erp.routes.js"), "utf8");
  for (const route of [
    '"/pos/checkout"',
    '"/sales/invoices/:id/post"',
    '"/sales/invoices/:id/cancel"',
    '"/sales/invoices/:id"',
    '"/sales/invoices/draft"',
    'setupCrud("invoices"',
    "GENERIC_INVOICE_MUTATION_FORBIDDEN",
  ]) {
    assert.ok(routes.includes(route), `lifecycle/route wiring must remain: ${route}`);
  }
  const draftUpdateStart = routes.indexOf('router.patch(\n  "/sales/invoices/:id"');
  const draftUpdateEnd = routes.indexOf('// 3) Cancel a DRAFT invoice', draftUpdateStart);
  const draftUpdateRoute = routes.slice(draftUpdateStart, draftUpdateEnd);
  for (const requirement of [
    'const t = await models.sequelize.transaction()',
    'if (invoice.postingStatus !== "draft")',
    'await invoice.update(updates, { transaction: t })',
    'await models.InvoiceItem.destroy({ where: { invoiceId: invoice.id }, transaction: t })',
    'await models.InvoiceItem.create({ invoiceId: invoice.id, ...r }, { transaction: t })',
    'action: "invoice.draft.update"',
    'await t.commit()',
    'await t.rollback()',
    'action: "draft-update"'
  ]) {
    assert.ok(draftUpdateRoute.includes(requirement), `supported draft update preserves ${requirement}`);
  }

  console.log("verify-invoice-crud-guards: ok");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
