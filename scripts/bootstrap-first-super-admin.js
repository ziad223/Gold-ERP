#!/usr/bin/env node

const crypto = require("crypto");
const { resolveDatabaseEnv } = require("../backend/src/config/database-env");

const TARGET_ID = "USR-ADMIN";
const TARGET_EMAIL = "admin@admin.com";
const CONFIRM_FLAG = "BOOTSTRAP_FIRST_SUPER_ADMIN";
const ADOPTED_LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const ADOPTED_LOCAL_PORT = 5432;
const ADOPTED_LOCAL_DATABASE = "darfus_erp";

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function fail(message) {
  console.error(`[bootstrap-first-super-admin] ${message}`);
  process.exit(1);
}

function resolveBootstrapDatabaseTarget(env = process.env) {
  const target = resolveDatabaseEnv(env);
  if (target.environment !== "development" || !ADOPTED_LOCAL_HOSTS.has(target.host)
    || target.port !== ADOPTED_LOCAL_PORT || target.database !== ADOPTED_LOCAL_DATABASE) {
    throw new Error("BOOTSTRAP_LOCAL_DATABASE_REQUIRED");
  }
  return Object.freeze({ environment: target.environment, host: target.host, port: target.port, database: target.database, ssl: target.ssl });
}

function fingerprint(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

async function main() {
  const email = String(argValue("--email") || "").trim().toLowerCase();
  const confirm = argValue("--confirm");
  if (!email) fail("--email is required.");
  if (email !== TARGET_EMAIL) fail(`Refusing target email '${email}'. Expected ${TARGET_EMAIL}.`);
  if (confirm !== CONFIRM_FLAG) fail(`--confirm ${CONFIRM_FLAG} is required.`);
  resolveBootstrapDatabaseTarget();

  const models = require("../backend/src/models");
  const auditService = require("../backend/src/services/audit.service");

  let summary = null;
  await models.sequelize.authenticate();
  await models.sequelize.transaction(async (transaction) => {
    const target = await models.User.findOne({
      where: { id: TARGET_ID, email: TARGET_EMAIL },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!target) fail("Target owner account is missing.");
    if (target.deletedAt) fail("Target owner account is deleted/inactive.");
    if ((target.accountType || "legacy") === "branch_shell") fail("Target owner account is a Branch Shell account.");

    const activeSuperAdminCount = await models.User.count({
      where: { accountType: "super_admin", deletedAt: null },
      transaction
    });
    if (activeSuperAdminCount > 0) {
      summary = {
        alreadyBootstrapped: (target.accountType || "legacy") === "super_admin",
        targetUserId: target.id,
        targetEmail: target.email,
        activeSuperAdmins: activeSuperAdminCount,
        changed: false
      };
      return;
    }

    const beforeHash = target.password;
    const beforeFingerprint = fingerprint(beforeHash);
    const beforeSessionVersion = Number(target.sessionVersion || 1);
    const activeSessionsBefore = await models.TechnicalAccountSession.count({
      where: { userId: target.id, revokedAt: null },
      transaction
    });

    await target.update({
      accountType: "super_admin",
      sessionVersion: beforeSessionVersion + 1
    }, { transaction });

    const [revokedSessions] = await models.TechnicalAccountSession.update({
      revokedAt: new Date(),
      revokeReason: "first_super_admin_bootstrap"
    }, {
      where: { userId: target.id, revokedAt: null },
      transaction
    });

    if (target.id !== TARGET_ID || target.email !== TARGET_EMAIL) fail("Target identity changed unexpectedly.");
    if (target.password !== beforeHash || fingerprint(target.password) !== beforeFingerprint) fail("Password hash changed unexpectedly.");

    await auditService.record(target.companyId, {
      action: "system_account.first_super_admin_bootstrapped",
      description: "First Super Admin account bootstrapped locally.",
      user: "Local Bootstrap CLI",
      userId: target.id,
      technicalUserId: target.id,
      employeeId: null,
      operatorSessionId: null,
      place: "System Accounts",
      sourceDocument: target.id,
      severity: "critical",
      before: JSON.stringify({ targetUserId: target.id, accountType: "legacy", emailPreserved: true, role: target.role }),
      after: JSON.stringify({
        targetUserId: target.id,
        accountType: "super_admin",
        sessionVersion: target.sessionVersion,
        revokedSessions,
        activeSessionsBefore,
        passwordHashFingerprint: beforeFingerprint.slice(0, 16)
      })
    }, { transaction });

    summary = {
      changed: true,
      targetUserId: target.id,
      targetEmail: target.email,
      accountType: target.accountType,
      sessionVersion: target.sessionVersion,
      revokedSessions,
      activeSessionsBefore,
      passwordHashPreserved: true
    };
  });

  if (summary?.changed === false) {
    console.log(JSON.stringify({
      success: true,
      changed: false,
      message: summary.alreadyBootstrapped ? "Target account is already bootstrapped." : "An active Super Admin already exists.",
      targetUserId: summary.targetUserId,
      targetEmail: summary.targetEmail,
      activeSuperAdmins: summary.activeSuperAdmins
    }, null, 2));
  } else {
    console.log(JSON.stringify({
      success: true,
      changed: true,
      targetUserId: summary.targetUserId,
      targetEmail: summary.targetEmail,
      accountType: summary.accountType,
      sessionVersion: summary.sessionVersion,
      activeSessionsBefore: summary.activeSessionsBefore,
      revokedSessions: summary.revokedSessions,
      passwordHashPreserved: summary.passwordHashPreserved
    }, null, 2));
  }

  await models.sequelize.close();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[bootstrap-first-super-admin] ${error.message}`);
    process.exit(1);
  });
}

module.exports = { resolveBootstrapDatabaseTarget };
