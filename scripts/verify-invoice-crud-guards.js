/**
 * Phase 21.1-Fix — verify the generic /invoices CRUD guards.
 *
 * Functionally exercises ErpController.create/update/delete/deactivate/reactivate
 * against a mock Invoice model. The guards return BEFORE any DB call, so no
 * database, migration, or seed is required. Also statically confirms the
 * lifecycle-safe routes are still registered (not blocked) in erp.routes.js.
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
    rawAttributes: { id: { type: { constructor: { name: "STRING" } } }, status: {} },
    associations: {},
    findOne: async () => overrides.item ?? null,
    ...overrides,
  };
}
const baseReq = (extra = {}) => ({ companyId: "CMP-TEST", user: null, headers: {}, params: {}, body: {}, ...extra });

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

  // 4. Generic UPDATE of a DRAFT invoice is allowed (guard does not early-return;
  //    execution reaches item.update). Sentinel throw proves the guard passed.
  {
    const draft = { postingStatus: "draft", customerId: "C", toJSON: () => ({}), update: async () => { throw new Error("REACHED_UPDATE"); } };
    const ctrl = new ErpController(invoiceModel({ findOne: async () => draft }), []);
    const res = makeRes();
    const next = makeNext();
    await ctrl.update(baseReq({ params: { id: "INV-D" }, body: { notes: "x" } }), res, next);
    assert.equal(res.statusCode, null, "draft update must not be blocked by the posted guard");
    assert.ok(next.errors.some((e) => e && /REACHED_UPDATE/.test(e.message)), "draft update must reach item.update()");
  }

  // 5. Generic UPDATE of a DRAFT invoice still blocks lifecycle fields (403).
  {
    const draft = { postingStatus: "draft", customerId: "C", toJSON: () => ({}), update: async () => { throw new Error("REACHED_UPDATE"); } };
    const ctrl = new ErpController(invoiceModel({ findOne: async () => draft }), []);
    const res = makeRes();
    await ctrl.update(baseReq({ params: { id: "INV-D" }, body: { postingStatus: "posted" } }), res, makeNext());
    assert.equal(res.statusCode, 403, "lifecycle field on a draft update must be blocked (403)");
  }

  // 6. Generic DELETE of a POSTED invoice is blocked (409); destroy never runs.
  {
    let destroyed = false;
    const posted = { postingStatus: "posted", customerId: "C", toJSON: () => ({}), destroy: async () => { destroyed = true; } };
    const ctrl = new ErpController(invoiceModel({ findOne: async () => posted }), []);
    const res = makeRes();
    await ctrl.delete(baseReq({ params: { id: "INV-1" } }), res, makeNext());
    assert.equal(res.statusCode, 409, "generic delete of a posted invoice must be blocked (409)");
    assert.equal(destroyed, false, "posted invoice must not be destroyed");
  }

  // 7. Generic DELETE of a DRAFT invoice is allowed (reaches item.destroy).
  {
    const draft = { postingStatus: "draft", customerId: "C", toJSON: () => ({}), destroy: async () => { throw new Error("REACHED_DESTROY"); } };
    const ctrl = new ErpController(invoiceModel({ findOne: async () => draft }), []);
    const res = makeRes();
    const next = makeNext();
    await ctrl.delete(baseReq({ params: { id: "INV-D" } }), res, next);
    assert.equal(res.statusCode, null, "draft delete must not be blocked by the posted guard");
    assert.ok(next.errors.some((e) => e && /REACHED_DESTROY/.test(e.message)), "draft delete must reach item.destroy()");
  }

  // 8. Generic DEACTIVATE / REACTIVATE are blocked for invoices (409).
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

  // 9. Guards are scoped to Invoice only — a different model's update is NOT
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

  // 10. Static: lifecycle-safe routes are still registered (not blocked) and the
  //     generic /invoices CRUD is still wired (now guarded, not removed).
  const routes = fs.readFileSync(path.resolve(__dirname, "..", "backend", "src", "routes", "erp.routes.js"), "utf8");
  for (const route of [
    '"/pos/checkout"',
    '"/sales/invoices/:id/post"',
    '"/sales/invoices/:id/cancel"',
    '"/sales/invoices/:id"',
    '"/sales/invoices/draft"',
    'setupCrud("invoices"',
  ]) {
    assert.ok(routes.includes(route), `lifecycle/route wiring must remain: ${route}`);
  }

  console.log("verify-invoice-crud-guards: ok");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
