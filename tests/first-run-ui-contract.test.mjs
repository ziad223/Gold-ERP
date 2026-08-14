import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("first-run UI is setup-state driven, secret-ephemeral, and login has no default account credentials", async () => {
  const [setup, login, client] = await Promise.all([
    readFile(path.join(root, "app", "[locale]", "setup", "page.tsx"), "utf8"),
    readFile(path.join(root, "app", "[locale]", "login", "page.tsx"), "utf8"),
    readFile(path.join(root, "lib", "api", "client.ts"), "utf8")
  ]);
  assert.match(setup, /apiClient<SetupStatus>\("\/setup\/status"/);
  assert.match(setup, /X-First-Run-Setup-Token/);
  assert.match(setup, /setForm\(initialForm\)/);
  assert.match(setup, /idempotencyKey/);
  assert.match(setup, /RECOVERY_REQUIRED/);
  assert.match(login, /response\.data\?\.state === "SETUP_REQUIRED"/);
  assert.match(login, /useState\(""\)/);
  assert.doesNotMatch(login, /admin@admin\.com|123456/);
  assert.match(client, /path\.startsWith\("\/setup\/"\)/);
});
