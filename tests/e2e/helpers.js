const fs = require("fs");
const path = require("path");
const { expect } = require("@playwright/test");

const ARTIFACTS = path.join(__dirname, "..", "..", "test-artifacts");
fs.mkdirSync(ARTIFACTS, { recursive: true });

const CONSENT = "wallie911_remote_consent_v2";

/* Vaste "nou": Vrydag 9 Okt 2026 09:05 SAST (dag-plan het blokke) */
const T0 = new Date("2026-10-09T09:05:00+02:00");

async function boot(page, { consent = true, seed = null, time = T0 } = {}) {
  await page.clock.install({ time });
  await page.addInitScript(
    ([consentKey, give, seedState]) => {
      if (sessionStorage.getItem("__seeded")) return;
      sessionStorage.setItem("__seeded", "1");
      if (give) localStorage.setItem(consentKey, "1");
      if (seedState) Object.entries(seedState).forEach(([k, v]) => localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)));
    },
    [CONSENT, consent, seed]
  );
  page.on("pageerror", (e) => console.log("[pageerror]", e.message));
}

async function syncLabel(page) {
  return (await page.locator("#sync-label").textContent()).trim();
}

/* Laat die app se timers loop en wag tot ’n voorwaarde waar is */
async function runUntil(page, fn, { step = 1000, max = 120000, label = "voorwaarde" } = {}) {
  for (let t = 0; t <= max; t += step) {
    if (await fn()) return;
    await page.clock.runFor(step);
    await page.waitForTimeout(20);
  }
  throw new Error(`Nie bereik nie: ${label}`);
}

async function hideTab(page) {
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.hasFocus = () => false;
    window.dispatchEvent(new Event("blur"));
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

async function showTab(page) {
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { value: false, configurable: true });
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    document.hasFocus = () => true;
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("focus"));
  });
}

async function queue(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("wallie911_sync_v2") || "{}").queue || []);
}

function shot(name) {
  return path.join(ARTIFACTS, name);
}

function expectNoLeaks(mock) {
  /* Net lettertipes mag probeer het (en is afgekap); niks anders na buite nie */
  const other = mock.external.filter((u) => !/fonts\.(googleapis|gstatic)\.com/.test(u));
  expect(other, "geen onverwagte eksterne versoeke").toEqual([]);
}

module.exports = { boot, syncLabel, runUntil, hideTab, showTab, queue, shot, expectNoLeaks, T0, ARTIFACTS };
