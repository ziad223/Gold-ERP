import { test, expect } from "@playwright/test";

/**
 * Invoice print export smoke tests (Phase 19O-Fix).
 *
 * Static render smoke coverage for all four invoice print templates across all
 * three language modes plus invalid template fallback.
 *
 * Strategy:
 *  - Navigate to the test-only fixture page `/test/print-export` which renders
 *    every template × language combination with static fixture data.
 *  - Assert that the output HTML is non-empty, contains template-specific markers,
 *    and respects language mode visibility.
 *  - Does NOT call window.print() or rely on native print preview.
 *  - No backend/DB/API/financial logic.
 */

const FIXTURE_PAGE = "/test/print-export";

test.beforeEach(async () => {
  test.setTimeout(120000);
});

/* ---------- 1. Template render smoke ---------- */

test.describe("Template render smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FIXTURE_PAGE, { waitUntil: "domcontentloaded" });
  });

  test("fixture page loads with root element", async ({ page }) => {
    const root = page.locator('[data-testid="print-export-fixture-root"]');
    await expect(root).toBeVisible({ timeout: 60000 });
  });

  test("luxuryGold template renders non-empty HTML with A4 marker", async ({
    page,
  }) => {
    const section = page.locator(
      '[data-testid="print-fixture-luxuryGold-bilingual"]',
    );
    await expect(section).toBeVisible();
    const html = await section.innerHTML();
    expect(html.length).toBeGreaterThan(100);
    // Luxury Gold uses the class "luxury-invoice" and @page size: A4
    await expect(section.locator(".luxury-invoice")).toHaveCount(1);
    const style = await section.locator("style").first().textContent();
    expect(style).toContain("size: A4");
  });

  test("compactA4 template renders non-empty HTML with A4 marker", async ({
    page,
  }) => {
    const section = page.locator(
      '[data-testid="print-fixture-compactA4-bilingual"]',
    );
    await expect(section).toBeVisible();
    const html = await section.innerHTML();
    expect(html.length).toBeGreaterThan(100);
    // Compact A4 uses "compact-invoice" class
    await expect(section.locator(".compact-invoice")).toHaveCount(1);
    const style = await section.locator("style").first().textContent();
    expect(style).toContain("size: A4");
  });

  test("minimal template renders non-empty HTML with A4 marker", async ({
    page,
  }) => {
    const section = page.locator(
      '[data-testid="print-fixture-minimal-bilingual"]',
    );
    await expect(section).toBeVisible();
    const html = await section.innerHTML();
    expect(html.length).toBeGreaterThan(100);
    // Minimal A4 uses "minimal-invoice" class
    await expect(section.locator(".minimal-invoice")).toHaveCount(1);
    const style = await section.locator("style").first().textContent();
    expect(style).toContain("size: A4");
  });

  test("thermal template renders non-empty HTML with 80mm marker", async ({
    page,
  }) => {
    const section = page.locator(
      '[data-testid="print-fixture-thermal-bilingual"]',
    );
    await expect(section).toBeVisible();
    const html = await section.innerHTML();
    expect(html.length).toBeGreaterThan(100);
    // Thermal uses "thermal-invoice" class and 80mm page size
    await expect(section.locator(".thermal-invoice")).toHaveCount(1);
    const style = await section.locator("style").first().textContent();
    expect(style).toContain("80mm");
  });
});

/* ---------- 2. Language mode smoke ---------- */

test.describe("Language mode smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FIXTURE_PAGE, { waitUntil: "domcontentloaded" });
  });

  test("bilingual output contains English and Arabic label examples", async ({
    page,
  }) => {
    const section = page.locator(
      '[data-testid="print-fixture-luxuryGold-bilingual"]',
    );
    await expect(section).toBeVisible();
    const text = await section.textContent();
    // English labels present in bilingual mode
    expect(text).toContain("Invoice No.");
    expect(text).toContain("Invoice Date");
    // Arabic labels present in bilingual mode
    expect(text).toContain("رقم الفاتورة");
    expect(text).toContain("تاريخ الفاتورة");
  });

  test("Arabic-only output suppresses obvious English label fragments", async ({
    page,
  }) => {
    const section = page.locator(
      '[data-testid="print-fixture-luxuryGold-ar"]',
    );
    await expect(section).toBeVisible();
    const text = await section.textContent();
    // Arabic labels should be present
    expect(text).toContain("رقم الفاتورة");
    expect(text).toContain("تاريخ الفاتورة");
    // English-only labels should be suppressed (note: dynamic data like
    // customer names, company name, invoice numbers are NOT labels)
    expect(text).not.toContain("Invoice No.");
    expect(text).not.toContain("Invoice Date");
    expect(text).not.toContain("CLIENT DETAILS");
    expect(text).not.toContain("INVOICE DETAILS");
  });

  test("English-only output suppresses obvious Arabic label fragments", async ({
    page,
  }) => {
    const section = page.locator(
      '[data-testid="print-fixture-luxuryGold-en"]',
    );
    await expect(section).toBeVisible();
    const text = await section.textContent();
    // English labels should be present
    expect(text).toContain("Invoice No.");
    expect(text).toContain("Invoice Date");
    // Arabic labels should be suppressed
    expect(text).not.toContain("رقم الفاتورة");
    expect(text).not.toContain("تاريخ الفاتورة");
    expect(text).not.toContain("بيانات العميل");
    expect(text).not.toContain("بيانات الفاتورة");
  });

  /* Verify language modes work for other templates too (quick check) */

  test("compactA4 bilingual contains both language labels", async ({
    page,
  }) => {
    const section = page.locator(
      '[data-testid="print-fixture-compactA4-bilingual"]',
    );
    const text = await section.textContent();
    expect(text).toContain("Invoice No.");
    expect(text).toContain("رقم الفاتورة");
  });

  test("minimal ar-only suppresses English labels", async ({ page }) => {
    const section = page.locator(
      '[data-testid="print-fixture-minimal-ar"]',
    );
    const text = await section.textContent();
    expect(text).toContain("رقم الفاتورة");
    expect(text).not.toContain("Invoice No.");
  });

  test("thermal en-only suppresses Arabic labels", async ({ page }) => {
    const section = page.locator(
      '[data-testid="print-fixture-thermal-en"]',
    );
    const text = await section.textContent();
    // Thermal uses abbreviated labels; check a representative English one
    expect(text).toContain("Invoice");
    expect(text).not.toContain("رقم الفاتورة");
  });
});

/* ---------- 3. Invalid template fallback ---------- */

test.describe("Invalid template fallback", () => {
  test("unknown template ID falls back to Luxury Gold", async ({ page }) => {
    await page.goto(FIXTURE_PAGE, { waitUntil: "domcontentloaded" });
    const section = page.locator(
      '[data-testid="print-fixture-invalid-fallback"]',
    );
    await expect(section).toBeVisible();
    const html = await section.innerHTML();
    expect(html.length).toBeGreaterThan(100);
    // Should render Luxury Gold template (has "luxury-invoice" class)
    await expect(section.locator(".luxury-invoice")).toHaveCount(1);
    // Should NOT render other template classes
    await expect(section.locator(".compact-invoice")).toHaveCount(0);
    await expect(section.locator(".minimal-invoice")).toHaveCount(0);
    await expect(section.locator(".thermal-invoice")).toHaveCount(0);
  });

  test("renders modernDark theme preset on luxuryGold without crashing", async ({ page }) => {
    const section = page.locator(
      '[data-testid="print-fixture-theme-preset-modernDark"]',
    );
    await expect(section).toBeVisible();
    const html = await section.innerHTML();
    expect(html.length).toBeGreaterThan(100);
    await expect(section.locator(".luxury-invoice")).toHaveCount(1);
  });
});

/* ---------- 4. No window.print() call ---------- */

test.describe("No native print dialog", () => {
  test("page does not call window.print()", async ({ page }) => {
    let printCalled = false;
    await page.addInitScript(() => {
      window.print = () => {
        (window as any).__printCalled = true;
      };
    });
    await page.goto(FIXTURE_PAGE, { waitUntil: "domcontentloaded" });
    printCalled = await page.evaluate(() => !!(window as any).__printCalled);
    expect(printCalled).toBe(false);
  });
});
