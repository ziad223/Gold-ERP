"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");
const baseline = require(path.join(ROOT, "backend", "src", "bootstrap", "permission-baseline-v1"));

const sorted = (values) => [...values].sort();

async function assertCanonicalPermissionBaseline(models) {
  const permissions = await models.Permission.findAll({ attributes: ["name"] });
  const actual = sorted(permissions.map((permission) => permission.name));
  const expected = sorted(baseline.PERMISSIONS);
  assert.equal(new Set(actual).size, actual.length, "permission table has no duplicate slugs");
  assert.deepEqual(actual, expected, "permission table matches the exact v1.0.0 canonical slug set");

  const [[migrationCount]] = await models.sequelize.query('select count(*)::int as count from "SequelizeMeta"');
  const migrationsDir = path.join(ROOT, "backend", "migrations");
  const expectedMigrationCount = require("node:fs")
    .readdirSync(migrationsDir)
    .filter((file) => /\.js$/i.test(file))
    .length;
  assert.equal(
    Number(migrationCount.count),
    expectedMigrationCount,
    "migration count matches the current source migration set"
  );
}

module.exports = { baseline, assertCanonicalPermissionBaseline };
