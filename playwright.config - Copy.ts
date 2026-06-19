import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Desktop Large",
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: "Desktop Medium",
      use: { viewport: { width: 1280, height: 800 } },
    },
    {
      name: "Tablet Landscape",
      use: { viewport: { width: 1024, height: 768 } },
    },
    {
      name: "Tablet Portrait",
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: "Mobile Portrait",
      use: { viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
