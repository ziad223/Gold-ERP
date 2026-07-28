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

const customerFinancialPaths = new Set([
  "/customers/:id/invoices",
  "/customers/:id/statement-v2",
  "/customers/:id/credit",
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
  const normalized = pathname.replace(/^(\/customers)\/[^/]+(?=\/|$)/, "$1/:id");
  return trackedPaths.has(normalized) || customerFinancialPaths.has(normalized) || dashboardPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
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

function countCategory(items) {
  if (!Array.isArray(items)) return "UNKNOWN";
  if (items.length === 0) return "ZERO";
  if (items.length === 1) return "ONE";
  return "MANY";
}

async function customerListCountCategory(response) {
  try {
    const body = await response.json();
    const items = body?.data?.items ?? body?.items ?? body?.data;
    return countCategory(items);
  } catch {
    return "UNKNOWN";
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
    branchContextStatus: await page.locator('[data-branch-context-status]').getAttribute('data-branch-context-status').catch(() => null),
    branchContextReady: await page.locator('[data-branch-context-status]').getAttribute('data-branch-context-ready').catch(() => null),
    notificationErrorToasts: await notificationErrorToastCount(page),
  };
}

async function boundedCompanyReadinessSnapshot(page, accessibleCompanyCounts) {
  const unavailable = {
    pageAvailable: false,
    companyGateVisible: null,
    companyGateStatus: null,
    companyMessageKey: null,
    companyDisplayVisible: null,
    notificationErrorToasts: null,
    accessibleActiveCompanyCounts: accessibleCompanyCounts,
  };
  let timeoutId;
  try {
    return await Promise.race([
      companyReadinessSnapshot(page, accessibleCompanyCounts).catch(() => unavailable),
      new Promise((resolve) => { timeoutId = setTimeout(() => resolve(unavailable), 1_000); }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
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

function customerFinancialSummary(records) {
  const paths = {
    invoices: "/customers/:id/invoices",
    statement: "/customers/:id/statement-v2",
    credit: "/customers/:id/credit",
  };
  const summarizePath = (path) => {
    const scoped = records.filter((record) => record.path === path);
    return {
      requests: scoped.length,
      successes: scoped.filter((record) => record.status >= 200 && record.status < 300).length,
      statuses: [...new Set(scoped.map((record) => record.status).filter((status) => status !== null))],
      companyHeaderPresent: scoped.length > 0 && scoped.every((record) => record.companyContextPresent),
      branchHeaderPresent: scoped.length > 0 && scoped.every((record) => record.branchContextPresent),
      branchContextRequired: scoped.filter((record) => record.stableErrorCode === "BRANCH_CONTEXT_REQUIRED").length,
    };
  };
  return Object.fromEntries(Object.entries(paths).map(([name, path]) => [name, summarizePath(path)]));
}

async function waitForCustomerProfileLink(page, evidence, customerListCategories) {
  await expect.poll(
    () => evidence.records("/customers").some((record) => record.status !== null),
    { timeout: 30_000 },
  ).toBe(true);
  const profileLink = page.locator('a[href^="/en/customers/"]:not([href="/en/customers/loyalty"])').first();
  const profileAvailable = await profileLink.isVisible({ timeout: 30_000 }).catch(() => false);
  return {
    customerListStatus: evidence.records("/customers").find((record) => record.status !== null)?.status ?? null,
    customerListCountCategory: customerListCategories.at(-1) ?? "UNKNOWN",
    profileAvailable,
    profileLink,
  };
}

async function openCustomerFinancialViews(page, evidence) {
  await expect(page.getByRole("button", { name: "Sales & Invoices" })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Sales & Invoices" }).click();
  await page.getByRole("button", { name: "Customer Statement" }).click();
  await expect.poll(() => evidence.records("/customers/:id/invoices").length, { timeout: 30_000 }).toBeGreaterThan(0);
  await expect.poll(() => evidence.records("/customers/:id/statement-v2").length, { timeout: 30_000 }).toBeGreaterThan(0);
  await expect.poll(() => evidence.records("/customers/:id/credit").length, { timeout: 30_000 }).toBeGreaterThan(0);
}

async function observeBranchTransition(page, activateBranchB) {
  await page.evaluate(() => {
    const target = document.querySelector('[data-branch-context-status]');
    const events = [];
    const capture = () => events.push({
      at: Date.now(),
      status: target?.getAttribute('data-branch-context-status') ?? null,
      ready: target?.getAttribute('data-branch-context-ready') ?? null,
    });
    capture();
    const observer = new MutationObserver(capture);
    if (target) observer.observe(target, {
      attributes: true,
      attributeFilter: ['data-branch-context-status', 'data-branch-context-ready'],
    });
    window.__darfusBranchTransitionObservation = { events, observer };
  });
  const switchClickedAt = Date.now();
  await activateBranchB();
  const branchState = page.locator('[data-branch-context-status]').first();
  await expect.poll(() => branchState.getAttribute('data-branch-context-ready'), { timeout: 30_000 }).toBe('true');
  return page.evaluate((startedAt) => {
    const observation = window.__darfusBranchTransitionObservation;
    observation?.observer?.disconnect();
    const events = (observation?.events ?? []).filter((event) => event.at >= startedAt);
    const readyFalse = events.find((event) => event.ready === 'false' || event.status === 'TRANSITIONING') ?? null;
    const readyTrue = [...events].reverse().find((event) => event.ready === 'true') ?? null;
    delete window.__darfusBranchTransitionObservation;
    return {
      readyFalseObserved: Boolean(readyFalse),
      branchBReadyObserved: Boolean(readyTrue),
      readyFalseAt: readyFalse?.at ?? null,
      branchBReadyAt: readyTrue?.at ?? null,
    };
  }, switchClickedAt);
}

async function waitForLifecycle(page, evidence) {
  await expect(page.locator('[data-company-display="true"]')).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => evidence.records("/auth/accessible-companies").length, { timeout: 30_000 }).toBeGreaterThan(0);
  await expect.poll(() => evidence.records("/notifications").length, { timeout: 30_000 }).toBeGreaterThan(0);
  await expect.poll(() => evidence.records("/notifications/unread-count").length, { timeout: 30_000 }).toBeGreaterThan(0);
  await expect.poll(() => evidence.records("/events/stream").length, { timeout: 30_000 }).toBeGreaterThan(0);
}

async function establishActiveBranch(page, branchTrigger, branchOptionCount) {
  const branchState = page.locator('[data-branch-context-status]').first();
  const ready = await branchState.getAttribute('data-branch-context-ready').catch(() => null);
  if (ready === 'true' || branchOptionCount === 0) return ready === 'true';
  await branchTrigger.click();
  await page.getByRole('option').first().click();
  await expect.poll(() => branchState.getAttribute('data-branch-context-ready'), { timeout: 10_000 }).toBe('true');
  return true;
}

async function waitForTrackedNetworkQuiescence(page, evidence) {
  let previousCount = evidence.snapshot().length;
  let stableSamples = 0;
  for (let sample = 0; sample < 10 && stableSamples < 2; sample += 1) {
    await page.waitForTimeout(250);
    const currentCount = evidence.snapshot().length;
    stableSamples = currentCount === previousCount ? stableSamples + 1 : 0;
    previousCount = currentCount;
  }
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
  let customerFinancial = { outcome: "NOT_OBSERVED" };
  let customerDiscovery = { outcome: "NOT_OBSERVED" };
  let customerRefresh = { outcome: "NOT_OBSERVED" };
  let branchSwitch = { outcome: "NOT_APPLICABLE_FOR_AVAILABLE_IDENTITY" };
  let logout;
  const accessibleCompanyCounts = [];
  const customerListCategories = [];
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
      if (normalized === "/customers") customerListCategories.push(await customerListCountCategory(response));
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

  phase = "BRANCH_SELECTION";
  const activeBranchEstablished = await establishActiveBranch(page, branchTrigger, branchOptionCount);
  expect(activeBranchEstablished).toBe(true);

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

    phase = "N8_BRANCH_READY";
    await expect.poll(() => page.locator('[data-branch-context-status]').first().getAttribute('data-branch-context-ready'), { timeout: 30_000 }).toBe('true');

    // Establish a deterministic Branch A without retaining its identifier.
    if (branchOptionCount >= 2 && branchTriggerVisible) {
      evidence.begin("BRANCH_A_ESTABLISH");
      await branchTrigger.click();
      await page.getByRole("option").first().click();
      await expect.poll(() => page.locator('[data-branch-context-status]').first().getAttribute('data-branch-context-ready'), { timeout: 30_000 }).toBe('true');
      await waitForTrackedNetworkQuiescence(page, evidence);
    }

    evidence.begin("CUSTOMER_DISCOVERY");
    phase = "CUSTOMER_DISCOVERY";
    await page.goto("/en/customers", { waitUntil: "domcontentloaded" });
    const discovery = await waitForCustomerProfileLink(page, evidence, customerListCategories);
    customerDiscovery = {
      outcome: discovery.profileAvailable ? "SAFE_CUSTOMER_FOUND" : "NO_SAFE_EXISTING_CUSTOMER",
      customerListStatus: discovery.customerListStatus,
      customerListCountCategory: discovery.customerListCountCategory,
      safeProfileRouteAvailable: discovery.profileAvailable,
    };
    if (discovery.profileAvailable) {
      evidence.begin("BRANCH_A_FINANCIAL");
      phase = "BRANCH_A_FINANCIAL";
      await discovery.profileLink.click();
      await openCustomerFinancialViews(page, evidence);
      const financialRecords = evidence.snapshot();
      customerFinancial = { outcome: "BRANCH_A_EXECUTED", ...customerFinancialSummary(financialRecords) };
      for (const result of Object.values(customerFinancial)) {
        if (typeof result === "object") {
          expect(result.companyHeaderPresent).toBe(true);
          expect(result.branchHeaderPresent).toBe(true);
          expect(result.branchContextRequired).toBe(0);
          expect(result.successes).toBeGreaterThan(0);
        }
      }
    } else {
      customerFinancial = { outcome: "NOT_APPLICABLE_NO_EXISTING_CUSTOMER" };
    }

    if (branchOptionCount >= 2 && branchTriggerVisible) {
      // Navigation to a safe customer can mount Company-only resources. Let
      // those settle before attributing any request to the Branch transition.
      await waitForTrackedNetworkQuiescence(page, evidence);
      evidence.begin("BRANCH_A_TO_B");
      phase = "BRANCH_A_TO_B";
      const transition = await observeBranchTransition(page, async () => {
        await branchTrigger.click();
        await page.getByRole("option").nth(1).click();
      });
      await waitForTrackedNetworkQuiescence(page, evidence);
      const branchRecords = evidence.snapshot();
      const branchScopedRecords = branchRecords.filter((record) => ["/assets", "/invoices", "/transfers", "/reservations", "/products", "/stock-movements"].includes(record.path));
      expect(branchScopedRecords.some((record) => record.branchContextPresent)).toBe(true);
      expect(branchRecords.filter((record) => record.stableErrorCode === "BRANCH_CONTEXT_REQUIRED")).toHaveLength(0);
      const branchNotifications = summarize(branchRecords, await notificationErrorToastCount(page), false, true, branchOptionCount);
      expect(branchNotifications.notificationListRequests).toBe(0);
      expect(branchNotifications.unreadRequests).toBe(0);
      expect(branchNotifications.sseConnections).toBe(0);
      expect(branchNotifications.notificationErrorToasts).toBe(0);
      const branchFinancial = customerFinancial.outcome === "BRANCH_A_EXECUTED"
        ? customerFinancialSummary(branchRecords)
        : null;
      if (branchFinancial) {
        for (const result of Object.values(branchFinancial)) {
          expect(result.requests).toBe(1);
          expect(result.companyHeaderPresent).toBe(true);
          expect(result.branchHeaderPresent).toBe(true);
          expect(result.branchContextRequired).toBe(0);
        }
      }
      const preReadyFinancialRequests = transition.branchBReadyAt === null
        ? null
        : evidence.records("/customers/:id/invoices").filter((record) => record.observedAt < transition.branchBReadyAt).length
          + evidence.records("/customers/:id/statement-v2").filter((record) => record.observedAt < transition.branchBReadyAt).length
          + evidence.records("/customers/:id/credit").filter((record) => record.observedAt < transition.branchBReadyAt).length;
      expect(transition.readyFalseObserved).toBe(true);
      expect(transition.branchBReadyObserved).toBe(true);
      expect(preReadyFinancialRequests).toBe(0);
      branchSwitch = {
        outcome: "EXECUTED",
        branchOptions: branchOptionCount,
        branchScopedContextPresent: true,
        branchContextRequired: 0,
        notificationListRequests: branchNotifications.notificationListRequests,
        unreadRequests: branchNotifications.unreadRequests,
        sseConnections: branchNotifications.sseConnections,
        notificationErrorToasts: branchNotifications.notificationErrorToasts,
        transition,
        preReadyFinancialRequests,
        financial: branchFinancial || "NOT_OBSERVED_NO_SAFE_CUSTOMER",
      };

      if (customerFinancial.outcome === "BRANCH_A_EXECUTED") {
        evidence.begin("CUSTOMER_FINANCIAL_REFRESH");
        phase = "CUSTOMER_FINANCIAL_REFRESH";
        const session = await page.context().newCDPSession(page);
        await session.send("Network.clearBrowserCache");
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(page.locator('[data-company-display="true"]')).toBeVisible({ timeout: 30_000 });
        await expect.poll(() => page.locator('[data-branch-context-status]').first().getAttribute('data-branch-context-ready'), { timeout: 30_000 }).toBe('true');
        await openCustomerFinancialViews(page, evidence);
        const refreshRecords = evidence.snapshot();
        const refreshFinancial = customerFinancialSummary(refreshRecords);
        for (const result of Object.values(refreshFinancial)) {
          expect(result.companyHeaderPresent).toBe(true);
          expect(result.branchHeaderPresent).toBe(true);
          expect(result.branchContextRequired).toBe(0);
        }
        customerRefresh = {
          outcome: "EXECUTED",
          companyDisplayVisible: await page.locator('[data-company-display="true"]').isVisible(),
          branchReady: await page.locator('[data-branch-context-status]').first().getAttribute('data-branch-context-ready'),
          ...refreshFinancial,
          lifecycle: summarize(refreshRecords, await notificationErrorToastCount(page), false, true, branchOptionCount),
        };
      }
    }

    await waitForTrackedNetworkQuiescence(page, evidence);
    evidence.begin("LOGOUT");
    phase = "LOGOUT_PROFILE_MENU";
    const profileMenu = page.locator("#header-profile-menu");
    await expect(profileMenu).toBeVisible({ timeout: 5_000 });
    phase = "LOGOUT_ACTION";
    await profileMenu.click();
    const logoutAction = page.locator("#header-profile-menu + div button");
    await expect(logoutAction).toBeVisible({ timeout: 5_000 });
    await logoutAction.click({ noWaitAfter: true });
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1_000);
    logout = summarize(evidence.snapshot(), await notificationErrorToastCount(page), false, false, branchOptionCount);
    expect(logout.notificationListRequests).toBe(0);
    expect(logout.unreadRequests).toBe(0);
    expect(logout.sseConnections).toBe(0);
    expect(logout.http401 + logout.http403 + logout.http422).toBe(0);
    expect(logout.notificationErrorToasts).toBe(0);
    phase = "LOGOUT_COMPLETE";
  } finally {
    phase = `${phase}_FINAL_SNAPSHOT`;
    const runtimeState = await boundedCompanyReadinessSnapshot(page, accessibleCompanyCounts);
    if (evidenceDirectory) {
      fs.mkdirSync(evidenceDirectory, { recursive: true });
      fs.writeFileSync(path.join(evidenceDirectory, "single-company-runtime-summary.json"), JSON.stringify({
        n5: n5 || null,
        n8: n8 || null,
        branchSwitch,
        customerFinancial,
        customerDiscovery,
        customerRefresh,
        logout: logout || null,
        phase,
        runtimeState,
        records: {
          n5: evidence.snapshot("N5_SINGLE_COMPANY"),
          n8: evidence.snapshot("N8_HARD_REFRESH"),
          branch: evidence.snapshot("BRANCH_A_TO_B"),
          customerFinancial: evidence.snapshot("CUSTOMER_FINANCIAL"),
          customerDiscovery: evidence.snapshot("CUSTOMER_DISCOVERY"),
          branchAFinancial: evidence.snapshot("BRANCH_A_FINANCIAL"),
          customerRefresh: evidence.snapshot("CUSTOMER_FINANCIAL_REFRESH"),
          logout: evidence.snapshot("LOGOUT"),
        },
      }, null, 2));
    }
    phase = `${phase}_EVIDENCE_WRITTEN`;
  }
});
