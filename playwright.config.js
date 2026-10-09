/* Playwright: bedien die statiese webwerf plaaslik en toets in koplose Chromium.
   Supabase en ntfy word ALTYD onderskep (tests/e2e/mock-backend.js) — geen toetsdata in die lewendige databasis nie. */
const { defineConfig } = require("@playwright/test");

const PORT = 9123;

module.exports = defineConfig({
  testDir: "tests/e2e",
  timeout: 120000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "test-artifacts/playwright-results.json" }]],
  outputDir: "test-artifacts/playwright-output",
  use: {
    baseURL: `http://localhost:${PORT}`,
    browserName: "chromium",
    headless: true,
    viewport: { width: 1280, height: 860 },
    locale: "af-ZA",
    timezoneId: "Africa/Johannesburg",
    permissions: ["camera"],
    launchOptions: {
      args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"]
    },
    trace: "retain-on-failure"
  },
  webServer: {
    command: `node tests/static-server.js ${PORT}`,
    url: `http://localhost:${PORT}/index.html`,
    reuseExistingServer: true
  }
});
