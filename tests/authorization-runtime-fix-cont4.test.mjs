import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = path.resolve(import.meta.dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

test("valid operator restoration exposes an authoritative status instead of collapsing null into absence", () => {
  const provider = read("contexts/operator-context.tsx");

  assert.match(provider, /OperatorRestoreStatus/);
  assert.match(provider, /"uninitialized"/);
  assert.match(provider, /"deferred"/);
  assert.match(provider, /"restoring"/);
  assert.match(provider, /"active"/);
  assert.match(provider, /"absent"/);
  assert.match(provider, /"invalid"/);
  assert.match(provider, /"error"/);
  assert.match(provider, /restoreStatus/);
});

test("the protected guard renders verification only for authoritative absence or invalidity", () => {
  const guard = read("components/auth/auth-guard.tsx");

  assert.match(guard, /const showVerification/);
  assert.match(guard, /operator\.restoreStatus === "absent"/);
  assert.match(guard, /operator\.restoreStatus === "invalid"/);
  assert.match(guard, /data-operator-protected-loading="true"/);
  assert.match(guard, /if \(showVerification\)/);
  assert.doesNotMatch(guard, /branchAccountBusinessRoute && !operator\.active/);
});

test("restoration remains deferred until the validated Branch is ready and then has one current-session owner", () => {
  const provider = read("contexts/operator-context.tsx");

  assert.match(provider, /!branchReady \|\| !branchId/);
  assert.match(provider, /setRestoreStatus\("deferred"\)/);
  assert.match(provider, /setRestoreStatus\("restoring"\)/);
  assert.match(provider, /lastRestoreKeyRef/);
});
