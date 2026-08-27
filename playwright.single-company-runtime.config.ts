import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { defineConfig } from "@playwright/test";

const candidates = [
  process.env.DARFUS_E2E_BROWSER_PATH,
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].filter((candidate): candidate is string => Boolean(candidate));

const executablePath = candidates.find((candidate) => fs.existsSync(candidate));

if (!executablePath) {
  throw new Error("A local Chrome or Edge executable is required; set DARFUS_E2E_BROWSER_PATH.");
}

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/single-company-runtime.acceptance.spec.mjs",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  reporter: "line",
  outputDir: path.join(os.tmpdir(), "darfus-single-company-browser-output"),
  projects: [
    {
      name: "Local Chrome",
      use: {
        baseURL: process.env.DARFUS_E2E_BASE_URL || "http://127.0.0.1:3300",
        browserName: "chromium",
        headless: process.env.DARFUS_E2E_HEADLESS !== "false",
        screenshot: "off",
        trace: "off",
        video: "off",
        launchOptions: {
          executablePath,
          args: ["--disable-extensions"],
        },
      },
    },
  ],
});
