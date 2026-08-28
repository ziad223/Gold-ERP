const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const drawer = fs.readFileSync("components/ui/drawer.tsx", "utf8");

test("Drawer keeps its public contract and captures the invoking trigger", () => {
  assert.match(drawer, /export interface DrawerProps/);
  for (const prop of ["open", "onClose", "title", "description", "side", "children"]) {
    assert.match(drawer, new RegExp(`\\b${prop}\\b`), `missing ${prop} contract`);
  }
  assert.match(drawer, /invokingTriggerRef/);
  assert.match(drawer, /document\.activeElement/);
  assert.match(drawer, /invokingTrigger\?\.isConnected/);
  assert.match(drawer, /focus\(\{ preventScroll: true \}\)/);
});

test("Drawer focus lifecycle preserves entry focus and restores the exact trigger", () => {
  assert.match(drawer, /closeRef\.current\?\.focus\(\)/);
  assert.match(drawer, /if \(wasOpenRef\.current\)/);
  assert.match(drawer, /invokingTrigger\.focus\(\{ preventScroll: true \}\)/);
  assert.match(drawer, /onClose/);
  assert.doesNotMatch(drawer, /interface DrawerProps[\s\S]*trigger/);
});
