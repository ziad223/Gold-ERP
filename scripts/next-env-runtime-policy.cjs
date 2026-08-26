const fs = require("node:fs");
const path = require("node:path");

const GENERATED_RUNTIME_FILE = "next-env.d.ts";

const SUPPORTED_NEXT_ENV_VARIANTS = Object.freeze({
  dev: "./.next/dev/types/routes.d.ts",
  build: "./.next/types/routes.d.ts",
});

const NEXT_ENV_TEMPLATE = (routeTypesImport) => [
  "/// <reference types=\"next\" />",
  "/// <reference types=\"next/image-types/global\" />",
  `import \"${routeTypesImport}\";`,
  "",
  "// NOTE: This file should not be edited",
  "// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.",
  "",
].join("\n");

function normalize(content) {
  return String(content).replace(/\r\n/g, "\n");
}

function isSupportedVariant(variant) {
  return Object.prototype.hasOwnProperty.call(SUPPORTED_NEXT_ENV_VARIANTS, variant);
}

function classifyNextEnv({ content, variant, manuallyEdited = false }) {
  if (manuallyEdited) {
    return {
      status: "BLOCKED_MANUAL_EDIT",
      generated: false,
      variant,
      expectedImport: isSupportedVariant(variant) ? SUPPORTED_NEXT_ENV_VARIANTS[variant] : null,
    };
  }

  if (!isSupportedVariant(variant)) {
    return {
      status: "UNSUPPORTED_RUNTIME_VARIANT",
      generated: false,
      variant,
      expectedImport: null,
    };
  }

  const expectedImport = SUPPORTED_NEXT_ENV_VARIANTS[variant];
  const exactTemplateMatch = normalize(content) === NEXT_ENV_TEMPLATE(expectedImport);
  return {
    status: exactTemplateMatch ? "SUPPORTED_GENERATED_VARIANT" : "UNSUPPORTED_GENERATED_CONTENT",
    generated: exactTemplateMatch,
    variant,
    expectedImport,
  };
}

function classifyFile({ root, variant, manuallyEdited = false }) {
  const filePath = path.resolve(root, GENERATED_RUNTIME_FILE);
  return {
    filePath,
    ...classifyNextEnv({
      content: fs.readFileSync(filePath, "utf8"),
      variant,
      manuallyEdited,
    }),
  };
}

function isSupportedGeneratedTransition(semanticLines) {
  if (!Array.isArray(semanticLines) || semanticLines.length !== 2) return false;
  const supportedImports = new Set(Object.values(SUPPORTED_NEXT_ENV_VARIANTS));
  const removed = semanticLines.filter((line) => line.startsWith("-")).map((line) => line.slice(1));
  const added = semanticLines.filter((line) => line.startsWith("+")).map((line) => line.slice(1));
  if (removed.length !== 1 || added.length !== 1) return false;
  const importLine = (value) => value.match(/^import \"([^\"]+)\";$/)?.[1] ?? null;
  const removedImport = importLine(removed[0]);
  const addedImport = importLine(added[0]);
  return removedImport !== addedImport
    && supportedImports.has(removedImport)
    && supportedImports.has(addedImport);
}

module.exports = {
  GENERATED_RUNTIME_FILE,
  NEXT_ENV_TEMPLATE,
  SUPPORTED_NEXT_ENV_VARIANTS,
  classifyFile,
  classifyNextEnv,
  isSupportedGeneratedTransition,
  normalize,
};
