/* Toegang (21 Okt 2026, Hanno): Wallie se app vra 'n gebruiker en wagwoord; 'n vreemde toestel laai die app NIE en
   stuur niks na die bediener nie. Pa se konsole onthou die aanmelding hoogstens 12 uur. */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot } = require("./helpers");

const NOW = new Date("2026-10-22T07:55:00+02:00");

test("sonder aanmelding: net die aanmeld-skerm, die app laai nie en niks gaan na die bediener nie", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  await boot(page, { time: NOW, aangemeld: false });
  await page.goto("/#missie");
  await expect(page.locator("#toegang-vorm")).toBeVisible();
  await page.screenshot({ path: require("path").join(process.env.WALLIE_ARTIFACTS_DIR || require("os").tmpdir(), "toegang-vorm.png") });
  await expect(page.locator("#block-list")).toHaveCount(0);
  await expect(page.locator("#view-sessie")).toHaveCount(0);
  expect(await page.evaluate(() => window.__WALLIE_GESLUIT__)).toBe(true);
  expect(await page.evaluate(() => typeof window.WALLIE === "undefined" || !window.WALLIE.app)).toBe(true);
  /* Verkeerde wagwoord */
  await page.locator("#toegang-gebruiker").fill("wallie");
  await page.locator("#toegang-wagwoord").fill("verkeerd-wagwoord-1");
  await page.locator("#toegang-vorm button").click();
  await expect(page.locator("#toegang-fout")).toHaveText("Verkeerde gebruiker of wagwoord.", { timeout: 15000 });
  expect(await page.evaluate(() => localStorage.getItem("wallie911_toegang_v1"))).toBeNull();
  await page.clock.runFor(5000);
  expect(mock.calls ? mock.calls.length : 0, "geen versoek na Supabase nie").toBe(0);
});

test("aangemelde toestel: die app laai normaal (Missie met die blokke)", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page, { time: NOW });
  await page.goto("/#missie");
  await page.clock.runFor(1500);
  await expect(page.locator("#toegang-vorm")).toHaveCount(0);
  await expect(page.locator('#block-list .md-card[data-id="2026-10-22-wg-v1"]')).toBeVisible();
});

test("Pa-konsole: 'n aanmelding ouer as 12 uur word vergeet en die wagwoord word weer gevra", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  await page.clock.install({ time: NOW });
  await page.addInitScript((t) => {
    localStorage.setItem("wallie911_pa_token", "ou_token");
    localStorage.setItem("wallie911_pa_token_at", String(t - 13 * 3600 * 1000));
  }, NOW.getTime());
  await page.goto("/pa-konsole.html");
  await expect(page.locator("#login-view")).toBeVisible({ timeout: 20000 });
  await expect(page.locator("#login-err")).toContainText("verval");
  expect(await page.evaluate(() => localStorage.getItem("wallie911_pa_token"))).toBeNull();
});

test("pa-afstand: 'n aanmelding ouer as 12 uur word vergeet en die wagwoord word weer gevra", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  await page.clock.install({ time: NOW });
  await page.addInitScript((t) => {
    localStorage.setItem("wallie911_pa_token", "ou_token");
    localStorage.setItem("wallie911_pa_token_at", String(t - 13 * 3600 * 1000));
  }, NOW.getTime());
  await page.goto("/pa-afstand.html");
  await expect(page.locator("#login-card")).toBeVisible({ timeout: 20000 });
  await expect(page.locator("#login-err")).toContainText("verval");
});
