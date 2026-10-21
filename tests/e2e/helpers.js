const fs = require("fs");
const path = require("path");
const { expect } = require("@playwright/test");

const ARTIFACTS = process.env.WALLIE_ARTIFACTS_DIR ? path.resolve(process.env.WALLIE_ARTIFACTS_DIR) : path.join(__dirname, "..", "..", "test-artifacts");
fs.mkdirSync(ARTIFACTS, { recursive: true });

const CONSENT = "wallie911_remote_consent_v2";

/* Vaste "nou": Vrydag 9 Okt 2026 09:05 SAST (dag-plan het blokke) */
const T0 = new Date("2026-10-09T09:05:00+02:00");

/* Toegang (21 Okt): die toetse is 'n aangemelde toestel. Die hash kom uit assets/js/toegang.js self (geen wagwoord nie). */
const TOEGANG_HASH = (fs.readFileSync(path.join(__dirname, "..", "..", "assets", "js", "toegang.js"), "utf8").match(/var HASH = "([0-9a-f]{64})"/) || [])[1];

async function boot(page, { consent = true, seed = null, time = T0, aangemeld = true } = {}) {
  await page.clock.install({ time });
  await page.addInitScript(
    ([consentKey, give, seedState, hash]) => {
      if (hash) localStorage.setItem("wallie911_toegang_v1", JSON.stringify({ v: 1, h: hash }));
      if (sessionStorage.getItem("__seeded")) return;
      sessionStorage.setItem("__seeded", "1");
      if (give) localStorage.setItem(consentKey, "1");
      if (seedState) Object.entries(seedState).forEach(([k, v]) => localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)));
    },
    [CONSENT, consent, seed, aangemeld ? TOEGANG_HASH : null]
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

/* Eksamenmodus: laat die memo van elke item oop wees (die klok se begin is middernag vandag), sodat ouer toetse
   die memo/selfnasien-skerm kan bereik. Die eie eksamenmodus-toetse gebruik dit NIE. */
async function eksamenOntsluit(page) {
  const ids = [
    ...JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", "vraebank-v3.json"), "utf8")),
    ...JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", "vraebank-rtt-v1.json"), "utf8"))
  ].map((i) => i.id);
  await page.addInitScript((lys) => {
    try {
      if (localStorage.getItem("wallie911_eksamen_v1")) return;
      /* Begin = middernag van (die gevalste) vandag: die klok loop lank, maar dit is nie 'n vroeër dag nie
         (anders begin eksamenmodus outomaties 'n nuwe poging en sluit die memo weer). */
      const middernag = new Date();
      middernag.setHours(0, 0, 0, 0);
      const items = {};
      lys.forEach((id) => (items[id] = { begin: middernag.getTime(), konsep: "", bevestig: false, lêer: "", klaarMin: null }));
      localStorage.setItem("wallie911_eksamen_v1", JSON.stringify({ v: 1, items }));
    } catch (e) {}
  }, ids);
}

module.exports = { eksamenOntsluit, boot, syncLabel, runUntil, hideTab, showTab, queue, shot, expectNoLeaks, T0, ARTIFACTS };
