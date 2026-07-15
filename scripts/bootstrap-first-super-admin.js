#!/usr/bin/env node

const crypto = require("crypto");

const TARGET_ID = "USR-ADMIN";
const TARGET_EMAIL = "admin@admin.com";
const CONFIRM_FLAG = "BOOTSTRAP_FIRST_SUPER_ADMIN";
const LOCAL_DB = {
  host: "localhost",
  port: "5433",
  name: "darfus_erp",
  user: "postgres",
  password: "postgres"
};

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function fail(message) {
  console.error(`[bootstrap-first-super-admin] ${message}`);
  process.exit(1);
}

function assertLocalOnly() {
  const nodeEnv = String(process.env.NODE_ENV || "development").toLowerCase();
  if (["production", "prod", "staging"].includes(nodeEnv) || process.env.RENDER || process.env.VERCEL) {
    fail("Refusing production, Render, Vercel, or staging execution.");
  }
  if (process.env.DATABASE_URL) {
    fail("Refusing DATABASE_URL. Use the explicit local DB endpoint only.");
  }
  const requested = {
    host: process.env.DB_HOST || LOCAL_DB.host,
    port: String(process.env.DB_PORT || LOCAL_DB.port),
    name: process.env.DB_NAME || LOCAL_DB.name
  };
  if (requested.host !== LOCAL_DB.host || requested.port !== LOCAL_DB.port || requested.name !== LOCAL_DB.name) {
    fail(`Refusing DB ${requested.name}@${requested.host}:${requested.port}; expected ${LOCAL_DB.name}@${LOCAL_DB.host}:${LOCAL_DB.port}.`);
  }
  process.env.NODE_ENV = "test";
  process.env.DB_HOST = LOCAL_DB.host;
  process.env.DB_PORT = LOCAL_DB.port;
  process.env.DB_NAME = LOCAL_DB.name;
  process.env.DB_USER = process.env.DB_USER || LOCAL_DB.user;
  process.env.DB_PASS = process.env.DB_PASS || LOCAL_DB.password;
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
  assertLocalOnly();

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

main().catch((error) => {
  console.error(`[bootstrap-first-super-admin] ${error.message}`);
  process.exit(1);
});
