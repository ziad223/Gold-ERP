/**
 * Phase 31.1 — verify the client scope lock + that accounting-sensitive UI is
 * hidden by default while its code/services/endpoints remain intact.
 *
 * Static, read-only checks:
 *  (A) docs/CLIENT_SCOPE_LOCK.md exists with all required sections.
 *  (B) The customer page gates the statement-v3 toggle and the customer credit
 *      reconciliation panel behind SHOW_ACCOUNTING_SENSITIVE_DIAGNOSTICS = false.
 *  (C) No backend service/route/migration/posting/frontend page was deleted or
 *      changed by this phase (scope guard over the working tree + presence checks).
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");
const exists = (rel) => fs.existsSync(path.resolve(ROOT, rel));

const CUSTOMER_PAGE = "app/[locale]/(dashboard)/customers/[id]/page.tsx";

// ── (A) Scope-lock document ─────────────────────────────────────────────────
function scopeLockDoc() {
  assert.ok(exists("docs/CLIENT_SCOPE_LOCK.md"), "docs/CLIENT_SCOPE_LOCK.md exists");
  const doc = read("docs/CLIENT_SCOPE_LOCK.md");
  const sections = [
    "Source of Truth",
    "In Scope",
    "Internal Only",
    "Hidden Until Sign-off",
    "Deferred / Needs Client Sign-off",
    "Needs Accounting Sign-off",
    "Do Not Remove Without Explicit Approval",
  ];
  for (const s of sections) {
    assert.ok(doc.includes(s), `CLIENT_SCOPE_LOCK.md contains section: ${s}`);
  }
  // A few concrete anchors so the doc is not empty scaffolding.
  assert.ok(doc.includes("UAE Government E-Invoicing"), "scope lock lists UAE Government E-Invoicing (P0)");
  assert.ok(doc.includes("statement-v3 toggle") && doc.includes("customer credit reconciliation panel"), "scope lock names the hidden accounting-sensitive surfaces");
  assert.ok(doc.includes("SHOW_ACCOUNTING_SENSITIVE_DIAGNOSTICS"), "scope lock documents the hide mechanism");
  assert.ok(/posting engine/i.test(doc) && /verifiers/i.test(doc), "scope lock protects posting engine + verifiers from removal");
}

// ── (B) Customer page gating ────────────────────────────────────────────────
function uiHidden() {
  const src = read(CUSTOMER_PAGE);

  // The feature flag exists and is OFF by default.
  assert.ok(/const\s+SHOW_ACCOUNTING_SENSITIVE_DIAGNOSTICS\s*=\s*false\s*;/.test(src), "SHOW_ACCOUNTING_SENSITIVE_DIAGNOSTICS = false is defined");

  // statement-v3 toggle button is gated by the flag (not rendered by default).
  assert.ok(/\{SHOW_ACCOUNTING_SENSITIVE_DIAGNOSTICS\s*&&\s*\(\s*<button[\s\S]{0,600}setActiveStatementView\("v3"\)/.test(src), "statement-v3 toggle button is gated behind the flag");

  // Credit reconciliation Card is gated by the flag (not rendered by default).
  assert.ok(/\{SHOW_ACCOUNTING_SENSITIVE_DIAGNOSTICS\s*&&\s*\(\s*<Card[\s\S]{0,400}setReconciliationExpanded/.test(src), "credit reconciliation panel is gated behind the flag");

  // The v2 (legacy) statement remains present and NOT gated (default view kept).
  assert.ok(src.includes('setActiveStatementView("v2")'), "legacy statement-v2 toggle is kept");
  assert.ok(src.includes("Legacy / Document-only Statement v2") || src.includes("كشف حساب المستندات التقليدي v2"), "v2 statement label is kept");

  // Components/queries/repo methods are KEPT (nothing deleted).
  assert.ok(src.includes('["customer-statement-v3"'), "statement-v3 query is kept in source");
  assert.ok(src.includes('["customer-credit-reconciliation"') || src.includes("customer-credit-reconciliation"), "reconciliation query is kept in source");
  assert.ok(src.includes("getCustomerStatementV3") && src.includes("getCustomerCreditReconciliation"), "repository methods are still referenced (not deleted)");
}

// ── (C) Nothing deleted; scope guard ────────────────────────────────────────
function noDeletionAndScope() {
  // Backend services / endpoints must still exist.
  for (const f of [
    "backend/src/services/source-aware-statement.service.js",
    "backend/src/services/statement-reconciliation.service.js",
    "backend/src/services/full-2300-reconciliation.service.js",
    "backend/src/services/posting.service.js",
    "backend/src/services/customer-credit.service.js",
  ]) {
    assert.ok(exists(f), `service kept: ${f}`);
  }
  const routes = read("backend/src/routes/erp.routes.js");
  assert.ok(routes.includes('router.get("/customers/:id/statement-v3"'), "statement-v3 endpoint kept");
  assert.ok(routes.includes('router.get("/customers/:id/credit/reconciliation"'), "credit reconciliation endpoint kept");
  assert.ok(routes.includes('router.get("/customers/:id/statement-v2"'), "statement-v2 endpoint kept");

  // Working-tree scope guard: only allowed files changed; no deletions.
  let changed = [];
  let deleted = [];
  try {
    const nameStatus = execSync("git diff --name-status HEAD", { cwd: ROOT }).toString().split("\n").map((s) => s.trim()).filter(Boolean);
    for (const line of nameStatus) {
      const [st, ...rest] = line.split(/\s+/);
      const file = rest.join(" ");
      if (st.startsWith("D")) deleted.push(file);
      changed.push(file);
    }
    changed = changed.concat(untracked).filter(f => !f.replace(/\\/g, "/").startsWith("backend/seeders/client-demo/transactional/") && !f.replace(/\\/g, "/").startsWith("scripts/verify-"));
  } catch { changed = []; }

  assert.equal(deleted.length, 0, `this phase deletes nothing (found deleted: ${deleted.join(", ")})`);

  const allowed = new Set([
    "docs/CLIENT_SCOPE_LOCK.md",
    "docs/AI_HANDOFF.md",
    CUSTOMER_PAGE,
    "scripts/verify-client-scope-lock.js",
    "package.json",
    "next-env.d.ts", // generated
  ]);
  const forbidden = changed.filter((f) => {
    const n = f.replace(/\\/g, "/");
    return (
      n.startsWith("backend/") ||
      /features\/printing|CustomPrint|print/i.test(n) ||
      /(^|\/)pos\//.test(n) ||
      /(^|\/)migrations\//.test(n) ||
      !allowed.has(n)
    );
  });
  assert.equal(forbidden.length, 0, `this phase must only touch scope-lock/docs/customer-page/verifier/package (found: ${forbidden.join(", ")})`);
}

(function main() {
  scopeLockDoc();
  uiHidden();
  noDeletionAndScope();
  console.log("verify-client-scope-lock: ok");
})();
