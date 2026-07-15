/**
 * Phase 21.4-Fix / 21.5-Fix — verify secondary + edge financial idempotency and
 * the TTL cleanup script.
 *
 * Static source checks (no DB, no live requests) that:
 *  (A) The secondary/edge financial endpoints wire the central race-safe
 *      idempotency service with the right scopes, require a key (400 when
 *      missing), fold req.params into the request hash, and no longer use the
 *      old optional-key lookup-only pattern.
 *  (B) The frontend callers send a stable Idempotency-Key (ref-based, reset on
 *      success) for treasury, installments, purchase payment and payslip pay;
 *      the customer gold payout has no invented caller.
 *  (C) The TTL cleanup script (relocated to backend/scripts) deletes ONLY expired
 *      rows (expires_at < now), resolves its backend deps, and never truncates /
 *      resets / deletes all.
 *  (D) Regression: the four Phase 21.3 scopes are still wired; no print coupling.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
function readRepo(rel) {
  return fs.readFileSync(path.resolve(ROOT, rel), "utf8");
}

const routes = readRepo("backend/src/routes/erp.routes.js");

// ── (A) Backend coverage ────────────────────────────────────────────────────
function backend() {
  // 21.4 secondary + 21.5 edge scopes.
  for (const scope of [
    "treasury.cash_transaction",
    "purchase.payment",
    "installment.payment",
    "payroll.payslip_payment",
    "customer.gold_payout",
  ]) {
    assert.ok(routes.includes(`const idemScope = "${scope}"`), `route wires scope ${scope}`);
  }

  // req.params folded into the request hash for every converted endpoint.
  // Installment payment now also folds in the server-side operator actor for
  // Phase 34.5B replay consistency.
  assert.ok(
    routes.includes("idempotencyBodyWithActor(req, req.body, commandActor)") &&
      /idempotencyService\.hashRequest\(\s*idemScope,\s*idempotencyBodyWithActor\(req,\s*req\.body,\s*commandActor\),\s*req\.params\s*\)/s.test(routes),
    "installment hashes req.params and operator actor",
  );
  // Payslip still uses (idemScope, req.body, req.params).
  assert.ok(
    (routes.match(/idempotencyService\.hashRequest\(idemScope,\s*req\.body,\s*req\.params\)/g) || []).length >= 1,
    "payslip hashes req.params",
  );
  // treasury + purchase pay use (idemScope, b, req.params).
  assert.ok(
    (routes.match(/idempotencyService\.hashRequest\(idemScope,\s*b,\s*req\.params\)/g) || []).length >= 2,
    "treasury + purchase pay hash req.params",
  );
  // gold payout uses (idemScope, req.body || {}, req.params).
  assert.ok(
    routes.includes("idempotencyService.hashRequest(idemScope, req.body || {}, req.params)"),
    "gold payout hashes req.params",
  );

  // Missing-key → 400 (require the key on each converted endpoint).
  assert.ok(routes.includes("مطلوب لتحصيل القسط"), "installment pay requires the key (400)");
  assert.ok(routes.includes("مطلوب لعملية الخزينة"), "treasury transaction requires the key (400)");
  assert.ok(routes.includes("Idempotency-Key header is required for supplier payments."), "purchase pay requires the key");
  assert.ok(routes.includes("مطلوب لصرف الراتب"), "payslip pay requires the key (400)");
  assert.ok(routes.includes("مطلوب لصرف رصيد الذهب"), "gold payout requires the key (400)");

  // Old optional-key / lookup-only patterns are gone from these endpoints.
  assert.ok(!routes.includes("inst.idempotencyKey === idempotencyKey"), "installment lookup-only pattern removed");
  assert.ok(!routes.includes("No unique index yet"), "treasury race-window lookup removed");
  assert.ok(!routes.includes("const sameOperation ="), "purchase pay sameOperation lookup removed");
  assert.ok(!routes.includes("slip.idempotencyKey === idempotencyKey"), "payslip lookup-only pattern removed");

  // Central claim/succeed/resolve now cover 4 (21.3) + 3 (21.4) + 2 (21.5) = 9.
  const claim = (routes.match(/idempotencyService\.claim\(/g) || []).length;
  const succeed = (routes.match(/idempotencyService\.succeed\(/g) || []).length;
  const resolve = (routes.match(/idempotencyService\.resolveExisting\(/g) || []).length;
  assert.ok(claim >= 9, `>=9 endpoints claim idempotency (found ${claim})`);
  assert.ok(succeed >= 9, `>=9 endpoints persist the response (found ${succeed})`);
  assert.ok(resolve >= 9, `>=9 endpoints resolve replay/conflict (found ${resolve})`);

  // Treasury closing must remain UNtouched by central idempotency (strong
  // per-account-per-day uniqueness; deferred).
  assert.ok(!routes.includes('const idemScope = "treasury.closing"'), "treasury closing NOT centralized (deferred)");
}

// ── (B) Frontend coverage ───────────────────────────────────────────────────
function frontend() {
  // Hooks forward the optional key to apiClient.
  const treHook = readRepo("hooks/use-treasury.ts");
  assert.ok(treHook.includes("idempotencyKey ? { idempotencyKey }"), "treasury hook passes key through");
  const instHook = readRepo("hooks/use-installments.ts");
  assert.ok(instHook.includes("idempotencyKey ? { idempotencyKey }"), "installments hook passes key through");
  const payHook = readRepo("hooks/use-payroll.ts");
  assert.ok(/payPayslip[\s\S]{0,500}idempotencyKey/.test(payHook), "usePayroll.payPayslip forwards the key");
  assert.ok(payHook.includes("idempotencyKey ? { idempotencyKey }"), "payroll hook passes key through");

  // Treasury page: ref-based stable key, sent, reset on success.
  const trePage = readRepo("app/[locale]/(dashboard)/accounting/treasury/page.tsx");
  assert.ok(trePage.includes("useRef"), "treasury page uses a ref for the key");
  assert.ok(trePage.includes("addTransaction(payload, idemKeyRef.current)"), "treasury page sends the stable key");
  assert.ok(trePage.includes('idemKeyRef.current = ""'), "treasury page resets the key on success");

  // Installments page: per-installment ref map, sent, cleared on success.
  const instPage = readRepo("app/[locale]/(dashboard)/sales/installments/page.tsx");
  assert.ok(instPage.includes("useRef"), "installments page uses a ref for the keys");
  assert.ok(
    instPage.includes('payInstallment(inst.id, "Cash", remaining, idemKeysRef.current[inst.id])'),
    "installments page sends the stable key",
  );
  assert.ok(instPage.includes("delete idemKeysRef.current[inst.id]"), "installments page clears the key on success");

  // Payroll page: per-payslip ref map, sent, cleared on success.
  const payPage = readRepo("app/[locale]/(dashboard)/employees/payroll/page.tsx");
  assert.ok(payPage.includes("useRef"), "payroll page uses a ref for the keys");
  assert.ok(payPage.includes('payPayslip(id, "Bank", idemKeysRef.current[id])'), "payroll page sends the stable key");
  assert.ok(payPage.includes("idemKeysRef.current[id] = newIdemKey()"), "payroll page generates the key");
  assert.ok(payPage.includes("delete idemKeysRef.current[id]"), "payroll page clears the key on success");

  // Purchase payment caller already exists → must send a stable key.
  const apiImpl = readRepo("lib/repositories/api-impl.ts");
  assert.ok(/payPurchaseOrder[\s\S]{0,300}idempotencyKey/.test(apiImpl), "payPurchaseOrder sends the key to apiClient");
  const supPage = readRepo("app/[locale]/(dashboard)/suppliers/[id]/page.tsx");
  assert.ok(supPage.includes("newIdemKey()") && supPage.includes("payKey"), "supplier page uses a stable pay key");

  // Customer gold payout: NO frontend caller was invented (endpoint is API-only).
  const hits = grepTree(["app", "hooks", "lib", "features"], /gold\/payout/);
  assert.equal(hits.length, 0, `no frontend caller for /customers/:id/gold/payout (found: ${hits.join(", ")})`);
}

// ── (C) Cleanup script (relocated to backend/scripts) ───────────────────────
function cleanup() {
  const rel = "backend/scripts/idempotency-cleanup.js";
  assert.ok(fs.existsSync(path.resolve(ROOT, rel)), "cleanup script exists at backend/scripts");
  // The broken root copy must be gone (relocation, not duplication).
  assert.ok(!fs.existsSync(path.resolve(ROOT, "scripts/idempotency-cleanup.js")), "old root cleanup script removed");

  const src = readRepo(rel);
  // Resolves backend deps/env natively (the root copy failed on dotenv).
  assert.ok(src.includes('path.resolve(__dirname, "../.env")'), "cleanup loads backend/.env explicitly");
  assert.ok(src.includes('require("../src/models")'), "cleanup loads models from backend/src");
  assert.ok(src.includes('require("sequelize")'), "cleanup resolves sequelize (backend Op)");

  assert.ok(src.includes("IdempotencyRequest.destroy"), "cleanup uses IdempotencyRequest.destroy");
  assert.ok(src.includes("expiresAt") && src.includes("Op.lt"), "cleanup deletes only expiresAt < now");
  assert.ok(src.includes("{ expiresAt: { [Op.lt]: now } }"), "cleanup where is the expiry predicate only");
  assert.ok(src.includes("destroy({ where })"), "cleanup destroy is bounded by the WHERE predicate");
  assert.ok(src.includes("--dry-run"), "cleanup supports --dry-run");
  assert.ok(src.includes("sequelize.close"), "cleanup closes the DB connection");

  // No delete-all / truncate / reset (match real calls, not the safety comment).
  assert.ok(!/\.truncate\s*\(/i.test(src) && !/truncate\s+table/i.test(src), "cleanup never truncates");
  assert.ok(!/destroy\(\{\s*\}\)/.test(src), "cleanup never deletes without a WHERE");
  assert.ok(!/destroy\(\{\s*truncate/i.test(src), "cleanup destroy has no truncate option");
  assert.ok(!/where:\s*\{\s*\}/.test(src), "cleanup never uses an empty WHERE");

  // package.json points at the relocated script.
  const pkg = readRepo("package.json");
  assert.ok(pkg.includes('"idempotency:cleanup": "node backend/scripts/idempotency-cleanup.js"'), "package script uses the relocated path");
}

// ── (D) Regression ──────────────────────────────────────────────────────────
function regression() {
  for (const scope of ["pos.checkout", "sales.return", "sales.exchange", "purchase.receive"]) {
    assert.ok(routes.includes(`const idemScope = "${scope}"`), `Phase 21.3 scope ${scope} still wired`);
  }
  // No print coupling introduced by the idempotency files.
  assert.ok(!/print/i.test(readRepo("backend/scripts/idempotency-cleanup.js")), "cleanup script has no print coupling");
  assert.ok(!/print/i.test(readRepo("hooks/use-payroll.ts")), "payroll hook has no print coupling");
}

// Minimal recursive grep for a string/regex over a few source dirs.
function grepTree(dirs, re) {
  const out = [];
  const exts = new Set([".ts", ".tsx", ".js", ".jsx"]);
  const walk = (abs) => {
    let entries;
    try { entries = fs.readdirSync(abs, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name === "node_modules" || e.name === ".next") continue;
      const p = path.join(abs, e.name);
      if (e.isDirectory()) walk(p);
      else if (exts.has(path.extname(e.name))) {
        let src;
        try { src = fs.readFileSync(p, "utf8"); } catch { continue; }
        if (re.test(src)) out.push(path.relative(ROOT, p));
      }
    }
  };
  for (const d of dirs) walk(path.resolve(ROOT, d));
  return out;
}

(function main() {
  backend();
  frontend();
  cleanup();
  regression();
  console.log("verify-secondary-idempotency: ok");
})();
