import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("shared client parses canonical fields, code, request ID, and network failures without message branching", async () => {
  const client = await readFile(path.join(root, "lib", "api", "client.ts"), "utf8");
  assert.match(client, /error\?\.fields \|\| payload\?\.errors/);
  assert.match(client, /error\?\.code \|\| payload\?\.errorCode \|\| payload\?\.code/);
  assert.match(client, /error\?\.requestId \|\| payload\?\.correlationId/);
  assert.match(client, /"NETWORK_ERROR"/);
  assert.match(client, /isValidationError/);
});

test("setup maps validation fields inline and global query or mutation toast ownership excludes validation", async () => {
  const [setup, providers, realtime] = await Promise.all([
    readFile(path.join(root, "app", "[locale]", "setup", "page.tsx"), "utf8"),
    readFile(path.join(root, "app", "providers.tsx"), "utf8"),
    readFile(path.join(root, "components", "realtime-provider.tsx"), "utf8"),
  ]);
  assert.match(setup, /setFieldErrors\(caught\.errors\)/);
  assert.match(setup, /aria-invalid/);
  assert.match(providers, /if \(error\.isValidationError\) return;/);
  assert.match(realtime, /payload\?\.error\?\.code/);
});
