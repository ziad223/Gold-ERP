const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const policy = require(path.join(root, "scripts", "next-env-runtime-policy.cjs"));

test("C2C3R accepts only the supported generated dev/build variants", () => {
  for (const [variant, importPath] of Object.entries(policy.SUPPORTED_NEXT_ENV_VARIANTS)) {
    const result = policy.classifyNextEnv({
      content: policy.NEXT_ENV_TEMPLATE(importPath),
      variant,
    });
    assert.equal(result.status, "SUPPORTED_GENERATED_VARIANT");
    assert.equal(result.generated, true);
  }
});

test("C2C3R classifies the current generated file against the build variant", () => {
  const current = fs.readFileSync(path.join(root, policy.GENERATED_RUNTIME_FILE), "utf8");
  const result = policy.classifyNextEnv({ content: current, variant: "build" });
  assert.equal(result.status, "SUPPORTED_GENERATED_VARIANT");
  assert.equal(result.expectedImport, "./.next/types/routes.d.ts");
});

test("C2C3R rejects unsupported paths and altered generated content", () => {
  const unsupportedPath = policy.NEXT_ENV_TEMPLATE("./.next/other/types/routes.d.ts");
  assert.equal(
    policy.classifyNextEnv({ content: unsupportedPath, variant: "build" }).status,
    "UNSUPPORTED_GENERATED_CONTENT",
  );
  assert.equal(
    policy.classifyNextEnv({ content: policy.NEXT_ENV_TEMPLATE(policy.SUPPORTED_NEXT_ENV_VARIANTS.build), variant: "preview" }).status,
    "UNSUPPORTED_RUNTIME_VARIANT",
  );
  assert.equal(
    policy.classifyNextEnv({ content: policy.NEXT_ENV_TEMPLATE(policy.SUPPORTED_NEXT_ENV_VARIANTS.build), variant: "build", manuallyEdited: true }).status,
    "BLOCKED_MANUAL_EDIT",
  );
});

test("C2C3R accepts only a one-line transition between supported generated variants", () => {
  const dev = '-import "./.next/dev/types/routes.d.ts";';
  const build = '+import "./.next/types/routes.d.ts";';
  assert.equal(policy.isSupportedGeneratedTransition([dev, build]), true);
  assert.equal(policy.isSupportedGeneratedTransition([build, dev]), true);
  assert.equal(policy.isSupportedGeneratedTransition([dev, '+import "./.next/other/types/routes.d.ts";']), false);
  assert.equal(policy.isSupportedGeneratedTransition([dev, build, "+extra"]), false);
});
