/* Weergawe-kontrole (app.js): 'n oop oortjie met ou JS herlaai self wanneer version.json verskil van WALLIE.APP_VERSION.
   - Geen sessie: herlaai dadelik.
   - Sessie loop: GEEN herlaai nie, net die banier; herlaai eers nadat die sessie (en die opname) klaar is.
   - localStorage is greep-identies voor en na die herlaai (die kontrole raak nooit Wallie se data nie). */
const path = require("path");
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, runUntil, showTab, hideTab, expectNoLeaks, ARTIFACTS } = require("./helpers");

const STALE = "1999-01-01-oud";

/* Tel bladsy-laaie en neem 'n kopie van ALLE localStorage by die begin van elke laai (voor enige app-skrip)
   en net voor die bladsy afgelaai word. */
async function instrument(page) {
  await page.addInitScript(() => {
    if (window.top !== window) return; /* net die hoofbladsy, nie iframes nie */
    const snap = () => {
      const o = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        o[k] = localStorage.getItem(k);
      }
      return JSON.stringify(o, Object.keys(o).sort());
    };
    sessionStorage.setItem("__loads", String(Number(sessionStorage.getItem("__loads") || 0) + 1));
    window.__lsAtStart = snap();
    window.addEventListener("beforeunload", () => sessionStorage.setItem("__lsAtUnload", snap()));
  });
}
const loads = (page) => page.evaluate(() => Number(sessionStorage.getItem("__loads")));
/* Die sinkronisering skryf self na localStorage as 'n versoek klaarkom; vir 'n greep-vergelyking wag ons (in regte tyd,
   sonder om die klok te skuif) tot daar niks onderweg is nie. */
const syncIdle = (page) =>
  page.waitForFunction(() => window.WALLIE && WALLIE.SYNC && !WALLIE.SYNC._flushing && !localStorage.getItem("wallie911_sync_lock"), null, { timeout: 20000 });

/* version.json: 'stale' gee 'n ander weergawe as APP_VERSION; anders die egte version.json */
async function serveVersion(page, ctl) {
  await page.route(/\/version\.json(\?|$)/, async (route) => {
    ctl.requests++;
    if (ctl.stale) {
      ctl.staleServed++;
      if (ctl.once) ctl.stale = false;
      return route.fulfill({ status: 200, contentType: "application/json", headers: { "cache-control": "no-store" }, body: JSON.stringify({ v: STALE }) });
    }
    return route.continue();
  });
}

test("ou weergawe sonder sessie: herlaai dadelik, localStorage greep-identies", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  await boot(page);
  await instrument(page);
  const ctl = { stale: true, once: true, requests: 0, staleServed: 0 };
  await serveVersion(page, ctl);
  await page.goto("/#missie");

  /* 1) Ou weergawe by laai: herlaai dadelik */
  await runUntil(page, async () => (await loads(page).catch(() => 0)) >= 2, { label: "herlaai ná ou weergawe" });
  expect(ctl.staleServed).toBe(1);
  await expect(page.locator("#view-missie")).toBeVisible();

  /* 2) Ou weergawe gesien wanneer die oortjie terugkom (geen sessie): herlaai, en ALLE localStorage bly greep-identies */
  await syncIdle(page);
  ctl.stale = true;
  await hideTab(page);
  await showTab(page);
  await page.waitForFunction(() => Number(sessionStorage.getItem("__loads")) >= 3, null, { timeout: 20000 });
  expect(ctl.staleServed).toBe(2);
  await expect(page.locator("#view-missie")).toBeVisible();
  const ls = await page.evaluate(() => ({ before: sessionStorage.getItem("__lsAtUnload"), after: window.__lsAtStart }));
  expect(ls.before).toBeTruthy();
  expect(ls.after).toBe(ls.before);
  const keys = Object.keys(JSON.parse(ls.after));
  for (const k of ["wallie911_v2_bok", "wallie911_sync_v2", "wallie911_rtt_history"]) expect(keys).toContain(k);

  /* Nou is die weergawe reg: geen verdere herlaai nie, ook nie na 5 min of 'n oortjie-wissel nie */
  await page.clock.runFor(6 * 60000);
  await hideTab(page);
  await showTab(page);
  await page.clock.runFor(2000);
  expect(await loads(page)).toBe(3);
  await expect(page.locator("#weergawe-banier")).toHaveCount(0);

  /* Wallie se tuisskerm lyk onveranderd */
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(ARTIFACTS, "weergawe-pa", "wallie-tuisskerm-1280.png") });
  expectNoLeaks(mock);
});

test("ou weergawe TYDENS 'n sessie: geen herlaai nie, banier; herlaai eers ná die sessie", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  await boot(page);
  await instrument(page);
  const ctl = { stale: false, once: false, requests: 0, staleServed: 0 };
  await serveVersion(page, ctl);
  await page.goto("/#missie");
  await runUntil(page, async () => ctl.requests >= 1, { label: "eerste weergawe-kontrole" });
  expect(await loads(page)).toBe(1);

  await page.evaluate(() => WALLIE.app.startSession({ subjectSlug: "rtt", minutes: 50, task: "Sigblad-oefening" }));
  await expect(page.locator("#end-session")).toBeEnabled();

  /* Nuwe weergawe ontplooi terwyl Wallie werk: 5-min-kontrole en oortjie-terug sien dit albei */
  ctl.stale = true;
  await page.clock.runFor(5 * 60000 + 1000);
  await runUntil(page, async () => ctl.staleServed >= 1, { label: "5-min-kontrole" });
  await hideTab(page);
  await showTab(page);
  await runUntil(page, async () => ctl.staleServed >= 2, { label: "kontrole by oortjie-terug" });
  await expect(page.locator("#weergawe-banier")).toHaveText("Nuwe weergawe - herlaai na die sessie");
  await page.clock.runFor(3 * 60000);
  expect(await loads(page), "geen herlaai tydens 'n sessie nie").toBe(1);
  expect(await page.evaluate(() => WALLIE.app.state().live.status)).not.toBe("off");

  /* Sessie klaar: die opname is oop, dus nog steeds geen herlaai nie (antwoorde sou verlore gaan) */
  await page.locator("#end-session").click();
  await expect(page.locator("#wallie-survey-modal")).toBeVisible();
  await page.clock.runFor(12000);
  expect(await loads(page)).toBe(1);

  await page.locator('[data-scale="wallie-fokus"][data-val="4"]').click();
  await page.locator('input[name="metode"][value="ja"]').check();
  await page.locator('input[name="moeilikheid"][value="reg"]').check();
  await page.locator('input[name="blokkade"][value="moeg"]').check();
  await page.locator('input[name="eerlikheid"][value="meeste"]').check();
  await page.locator('textarea[name="help_more"]').fill("Dankie.");
  ctl.once = true; /* die herlaaide bladsy kry die nuwe (regte) weergawe */
  await page.locator("#wallie-survey-save").click();
  await expect(page.locator("#wallie-survey-modal")).toBeHidden();
  expect(await loads(page)).toBe(1);
  await syncIdle(page);
  await page.clock.runFor(6000); /* die wag-tydhouer (5 s) sien: geen sessie, geen opname oop nie -> herlaai */
  await page.waitForFunction(() => Number(sessionStorage.getItem("__loads")) >= 2, null, { timeout: 20000 });
  await expect(page.locator("#view-missie")).toBeVisible();
  const ls = await page.evaluate(() => ({ before: sessionStorage.getItem("__lsAtUnload"), after: window.__lsAtStart }));
  expect(ls.after).toBe(ls.before);
  const bok = JSON.parse(JSON.parse(ls.after).wallie911_v2_bok);
  expect(bok.sessions.length).toBe(1);
  expect(bok.wallieSurveys.length).toBe(1);
  expect(bok.live.status).toBe("off");
  await expect(page.locator("#weergawe-banier")).toHaveCount(0);
  expectNoLeaks(mock);
});

test("voorskou-modus: geen weergawe-kontrole nie", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  await boot(page);
  await instrument(page);
  const ctl = { stale: true, once: false, requests: 0, staleServed: 0 };
  await serveVersion(page, ctl);
  await page.goto("/?voorskou-toets=1#missie");
  await expect(page.locator("#voorskou-banier")).toBeVisible();
  await page.clock.runFor(6 * 60000);
  expect(ctl.requests).toBe(0);
  expect(await loads(page)).toBe(1);
});

test("lus-wag: bly version.json verskil (CDN nog oud), herlaai hoogstens 2 keer", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  await boot(page);
  await instrument(page);
  const ctl = { stale: true, once: false, requests: 0, staleServed: 0 };
  await serveVersion(page, ctl);
  await page.goto("/#missie");
  await page.waitForFunction(() => Number(sessionStorage.getItem("__loads")) >= 3, null, { timeout: 20000 });
  await page.clock.runFor(6 * 60000);
  await page.waitForTimeout(500);
  expect(await loads(page)).toBe(3);
  await expect(page.locator("#view-missie")).toBeVisible();
  expectNoLeaks(mock);
});
