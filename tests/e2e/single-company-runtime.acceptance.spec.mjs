import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { createEvidenceCollector } from "./helpers/runtime-evidence.mjs";

const email = process.env.DARFUS_E2E_EMAIL;
const password = process.env.DARFUS_E2E_PASSWORD;
const evidenceDirectory = process.env.DARFUS_E2E_EVIDENCE_DIR;

const trackedPaths = new Set([
  "/auth/login",
  "/auth/me",
  "/auth/accessible-companies",
  "/notifications",
  "/notifications/unread-count",
  "/events/stream",
  "/branches",
  "/operator/current",
  "/auth/logout",
]);

const dashboardPathPrefixes = [
  "/current",
  "/customers",
  "/assets",
  "/invoices",
  "/suppliers",
  "/transfers",
  "/approval-requests",
  "/reservations",
  "/purchase-orders",
  "/stock-movements",
  "/products",
];

function isTracked(pathname) {
  return trackedPaths.has(pathname) || dashboardPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

async function stableErrorCode(response) {
  if (response.status() < 400 || !String(response.headers()["content-type"] || "").includes("application/json")) return null;
  try {
    const body = await response.json();
    const code = body?.error?.code;
    return typeof code === "string" && /^[A-Z0-9_]{3,96}$/.test(code) ? code : null;
  } catch {
    return null;
  }
}

async function accessibleCompanyCount(response) {
  try {
    const body = await response.json();
    const items = body?.data?.items ?? body?.items;
    return Array.isArray(items) ? items.length : null;
  } catch {
    return null;
  }
}

async function companyReadinessSnapshot(page, accessibleCompanyCounts) {
  const gate = page.locator('[data-company-context-gate="true"]');
  const gateVisible = await gate.isVisible().catch(() => false);
  return {
    accessibleActiveCompanyCounts: accessibleCompanyCounts,
    companyGateVisible: gateVisible,
    companyGateStatus: gateVisible ? await gate.getAttribute("data-company-status") : null,
    companyMessageKey: gateVisible ? await gate.locator('[data-company-message-key]').getAttribute("data-company-message-key").catch(() => null) : null,
    companyDisplayVisible: await page.locator('[data-company-display="true"]').isVisible().catch(() => false),
    notificationErrorToasts: await notificationErrorToastCount(page),
  };
}

function notificationErrorToastCount(page) {
  return page.locator('[data-sonner-toast][data-type="error"], [role="alert"][data-sonner-toast]').count();
}

function summarize(records, toastCount, companyGateVisible, companyDisplayVisible, branchOptionCount) {
  const byPath = (path) => records.filter((record) => record.path === path);
  const statuses = records.reduce((all, record) => {
    if (record.status !== null) all[record.status] = (all[record.status] || 0) + 1;
    return all;
  }, {});
  return {
    bootstrapRequests: byPath("/auth/accessible-companies").length,
    notificationListRequests: byPath("/notifications").length,
    unreadRequests: byPath("/notifications/unread-count").length,
    sseConnections: byPath("/events/stream").length,
    sseReconnects: Math.max(0, byPath("/events/stream").length - 1),
    branchBootstrapRequests: byPath("/branches").length,
    http401: statuses[401] || 0,
    http403: statuses[403] || 0,
    http422: statuses[422] || 0,
    superAdminCompanyContextRequired: records.filter((record) => record.stableErrorCode === "SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED").length,
    notificationErrorToasts: toastCount,
    companySelectionGateVisible: companyGateVisible,
    companyDisplayVisible,
    branchOptionCount,
  };
}

async function waitForLifecycle(page, evidence) {
  await expect(page.locator('[data-company-display="true"]')).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => evidence.records("/auth/accessible-companies").length, { timeout: 30_000 }).toBeGreaterThan(0);
  await expect.poll(() => evidence.records("/notifications").length, { timeout: 30_000 }).toBeGreaterThan(0);
  await expect.poll(() => evidence.records("/notifications/unread-count").length, { timeout: 30_000 }).toBeGreaterThan(0);
  await expect.poll(() => evidence.records("/events/stream").length, { timeout: 30_000 }).toBeGreaterThan(0);
}

async function normalLogin(page) {
  await page.goto("/en/login", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('form button[type="submit"]').click();
}

test.describe.configure({ mode: "serial" });
test.skip(!email || !password, "DARFUS_E2E_EMAIL and DARFUS_E2E_PASSWORD are required; no login is attempted.");

test("captures sanitized N5/N8 single-Company browser acceptance evidence", async ({ page }) => {
  const evidence = createEvidenceCollector();
  let phase = "N5_LOGIN";
  let n5;
  let n8;
  let branchSwitch = { outcome: "NOT_APPLICABLE_FOR_AVAILABLE_IDENTITY" };
  let logout;
  const accessibleCompanyCounts = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    const normalized = url.pathname.replace(/^\/api\/v1/, "") || "/";
    if (isTracked(normalized)) evidence.request({ method: request.method(), url: request.url(), headers: request.headers() });
  });
  page.on("response", async (response) => {
    const request = response.request();
    const normalized = new URL(response.url()).pathname.replace(/^\/api\/v1/, "") || "/";
    if (isTracked(normalized)) {
      if (normalized === "/auth/accessible-companies") {
        const count = await accessibleCompanyCount(response);
        if (count !== null) accessibleCompanyCounts.push(count);
      }
      evidence.response({ method: request.method(), url: response.url(), status: response.status(), stableErrorCode: await stableErrorCode(response) });
    }
  });

  try {
    evidence.begin("N5_SINGLE_COMPANY");
    await normalLogin(page);
    phase = "N5_WAIT_FOR_LIFECYCLE";
    await waitForLifecycle(page, evidence);
    phase = "N5_SUMMARIZE";
    const n5CompanyGateVisible = await page.locator('[data-company-context-gate="true"]').isVisible().catch(() => false);
    const n5CompanyDisplayVisible = await page.locator('[data-company-display="true"]').isVisible();
    const branchTrigger = page.locator('[aria-haspopup="listbox"]').first();
    const branchTriggerVisible = await branchTrigger.isVisible().catch(() => false);
    let branchOptionCount = 0;
    if (branchTriggerVisible) {
      await branchTrigger.click();
      branchOptionCount = await page.getByRole("option").count();
      await page.keyboard.press("Escape");
    }
    n5 = summarize(evidence.snapshot(), await notificationErrorToastCount(page), n5CompanyGateVisible, n5CompanyDisplayVisible, branchOptionCount);

  expect(n5.bootstrapRequests).toBe(1);
  expect(evidence.records("/auth/accessible-companies")[0]?.companyContextPresent).toBe(false);
  expect(n5.companySelectionGateVisible).toBe(false);
  expect(n5.companyDisplayVisible).toBe(true);
  expect(n5.notificationListRequests).toBe(1);
  expect(n5.unreadRequests).toBe(1);
  expect(n5.sseConnections).toBe(1);
  expect(n5.sseReconnects).toBe(0);
  expect(evidence.records("/notifications")[0]?.companyContextPresent).toBe(true);
  expect(evidence.records("/notifications/unread-count")[0]?.companyContextPresent).toBe(true);
  expect(evidence.records("/events/stream")[0]?.companyContextPresent).toBe(true);
  expect(n5.http401 + n5.http403 + n5.http422).toBe(0);
  expect(n5.notificationErrorToasts).toBe(0);

  evidence.begin("N8_HARD_REFRESH");
  phase = "N8_HARD_REFRESH";
  const session = await page.context().newCDPSession(page);
  await session.send("Network.clearBrowserCache");
  await page.reload({ waitUntil: "domcontentloaded" });
  phase = "N8_WAIT_FOR_LIFECYCLE";
  await waitForLifecycle(page, evidence);
  phase = "N8_SUMMARIZE";
  const n8CompanyGateVisible = await page.locator('[data-company-context-gate="true"]').isVisible().catch(() => false);
  const n8CompanyDisplayVisible = await page.locator('[data-company-display="true"]').isVisible();
  n8 = summarize(evidence.snapshot(), await notificationErrorToastCount(page), n8CompanyGateVisible, n8CompanyDisplayVisible, branchOptionCount);

  expect(n8.bootstrapRequests).toBe(1);
  expect(n8.companySelectionGateVisible).toBe(false);
  expect(n8.companyDisplayVisible).toBe(true);
  expect(n8.notificationListRequests).toBe(1);
  expect(n8.unreadRequests).toBe(1);
  expect(n8.sseConnections).toBe(1);
  expect(n8.sseReconnects).toBe(0);
  expect(n8.http401 + n8.http403 + n8.http422).toBe(0);
  expect(n8.notificationErrorToasts).toBe(0);

    if (branchOptionCount >= 2 && branchTriggerVisible) {
      evidence.begin("BRANCH_A_TO_B");
      phase = "BRANCH_A_TO_B";
      await branchTrigger.click();
      await page.getByRole("option").nth(1).click();
      await page.waitForTimeout(500);
      branchSwitch = { outcome: "EXECUTED", branchOptions: branchOptionCount, records: evidence.snapshot() };
    }

    evidence.begin("LOGOUT");
    phase = "LOGOUT_PROFILE_MENU";
    const profileMenu = page.locator("#header-profile-menu");
    await expect(profileMenu).toBeVisible({ timeout: 5_000 });
    phase = "LOGOUT_ACTION";
    await profileMenu.click();
    const logoutAction = page.locator("#header-profile-menu + div button");
    await expect(logoutAction).toBeVisible({ timeout: 5_000 });
    await logoutAction.click();
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1_000);
    logout = summarize(evidence.snapshot(), await notificationErrorToastCount(page), false, false, branchOptionCount);
    expect(logout.notificationListRequests).toBe(0);
    expect(logout.unreadRequests).toBe(0);
    expect(logout.sseConnections).toBe(0);
    expect(logout.http401 + logout.http403 + logout.http422).toBe(0);
    expect(logout.notificationErrorToasts).toBe(0);
  } finally {
    const runtimeState = await companyReadinessSnapshot(page, accessibleCompanyCounts).catch(() => ({
      pageAvailable: false,
      companyGateVisible: null,
      companyGateStatus: null,
      companyMessageKey: null,
      companyDisplayVisible: null,
      notificationErrorToasts: null,
      accessibleActiveCompanyCounts: accessibleCompanyCounts,
    }));
    if (evidenceDirectory) {
      fs.mkdirSync(evidenceDirectory, { recursive: true });
      fs.writeFileSync(path.join(evidenceDirectory, "single-company-runtime-summary.json"), JSON.stringify({
        n5: n5 || null,
        n8: n8 || null,
        branchSwitch,
        logout: logout || null,
        phase,
        runtimeState,
        records: {
          n5: evidence.snapshot("N5_SINGLE_COMPANY"),
          n8: evidence.snapshot("N8_HARD_REFRESH"),
          branch: evidence.snapshot("BRANCH_A_TO_B"),
          logout: evidence.snapshot("LOGOUT"),
        },
      }, null, 2));
    }
  }
});
