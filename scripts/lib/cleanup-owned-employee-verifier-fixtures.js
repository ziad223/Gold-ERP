"use strict";

const path = require("node:path");
const { assertAdoptedLocalDatabase } = require("./verify-local-database-guard");

const OWNED_PREFIXES = Object.freeze(["CMP-T34-2-", "CMP-T34-3-"]);

function isOwnedCompanyId(id) {
  return typeof id === "string" && OWNED_PREFIXES.some((prefix) => id.startsWith(prefix));
}

async function listOwnedCompanies(sequelize, transaction = null) {
  const [rows] = await sequelize.query(
    "select id from companies where id like 'CMP-T34-2-%' or id like 'CMP-T34-3-%' order by id",
    { transaction }
  );
  const ids = rows.map((row) => row.id);
  if (!ids.every(isOwnedCompanyId)) throw new Error("OWNED_FIXTURE_NAMESPACE_MISMATCH");
  return ids;
}

async function run({ execute = false } = {}) {
  const target = assertAdoptedLocalDatabase({ riskClass: execute ? "V3_WRITE_CLEANUP" : "V1_LIVE_READ_ONLY" });
  const root = path.resolve(__dirname, "..", "..");
  require(path.join(root, "backend", "node_modules", "dotenv")).config({ path: path.join(root, "backend", ".env") });
  const { resolveDatabaseEnv } = require(path.join(root, "backend", "src", "config", "database-env"));
  const config = resolveDatabaseEnv(process.env);
  const { Sequelize } = require(path.join(root, "backend", "node_modules", "sequelize"));
  const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    port: config.port,
    dialect: "postgres",
    logging: false,
  });
  try {
    const ids = await listOwnedCompanies(sequelize);
    if (!execute) return { mode: "dry-run", target: target.database, companyIds: ids, deleted: 0 };
    const transaction = await sequelize.transaction();
    try {
      for (const id of ids) await sequelize.query("delete from companies where id = :id", { replacements: { id }, transaction });
      const remaining = await listOwnedCompanies(sequelize, transaction);
      if (remaining.length) throw new Error("OWNED_FIXTURE_RESIDUE_DETECTED");
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    return { mode: "execute", target: target.database, companyIds: ids, deleted: ids.length };
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  run({ execute: process.argv.includes("--execute") })
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = { OWNED_PREFIXES, isOwnedCompanyId, listOwnedCompanies, run };
