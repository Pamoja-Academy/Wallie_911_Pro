/* Pa se kant: wat Hanno sien nadat die toestel gesinkroniseer het (teen nagemaakte antwoorde).
   Fase 1 verander nie die konsole se uitleg nie — dit bewys dat die data nou daar aankom. */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, syncLabel, runUntil, shot, expectNoLeaks } = require("./helpers");

test("Pa-konsole (pa-afstand.html + #pa) wys gesinkroniseerde sessies, surveys en lewendige sessie", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  const day = Date.parse("2026-10-09T07:00:00+02:00");
  await boot(page, {
    seed: {
      wallie911_v2_bok: {
        sessions: [
          { id: `s_${day + 3600000}`, date: "2026-10-09", subjectSlug: "wiskgelett", task: "Rente", durationMin: 45, actualMin: 45, plannedMin: 45, startedAt: day, endedAt: day + 45 * 60000, warnings: 0, locks: 0, memoMin: 0, outcome: "tyd_klaar" }
        ],
        wallieSurveys: [
          { id: `ws_${day + 46 * 60000}`, sessionId: `s_${day + 3600000}`, subjectSlug: "wiskgelett", date: "2026-10-09", at: day + 46 * 60000, answers: { fokus: "4", metode: "ja", moeilikheid: "reg", blokkade: "niks", eerlikheid: "100", help_more: "Rente-somme gaan nou beter." } }
        ]
      }
    }
  });
  await page.goto("/#missie");
  let pageNow = await page.evaluate(() => Date.now());
  mock.nowFn = () => pageNow;
  const syncClock = async () => (pageNow = await page.evaluate(() => Date.now()));
  await runUntil(page, async () => mock.deliveredIds().length >= 2, { label: "terugvul" });

  /* ’n Lewendige sessie sodat Pa "IN SESSIE" sien */
  await page.evaluate(() => WALLIE.app.startSession({ subjectSlug: "engels", minutes: 50, task: "Opstel — PEEL-paragrawe" }));
  await runUntil(page, async () => (await syncClock(), mock.byKind("heartbeat").length >= 1), { label: "hartklop" });
  await page.clock.runFor(30000);
  await syncClock();
  await runUntil(page, async () => (await syncLabel(page)) === "Gesinkroniseer", { label: "groen" });
  await page.screenshot({ path: shot("07-wallie-in-sessie-gesinkroniseer.png") });

  /* Pa se foon: pa-afstand.html */
  const pa = await context.newPage();
  await pa.clock.install({ time: await syncClock() });
  await pa.setViewportSize({ width: 430, height: 1100 });
  await pa.goto("/pa-afstand.html");
  await pa.locator("#login-pass").fill("toets-wagwoord");
  await pa.locator('#login-form button[type="submit"], #login-form button').first().click();
  await expect(pa.locator("#sessions")).toContainText("Engels", { timeout: 15000 });
  await expect(pa.locator("body")).toContainText("IN SESSIE");
  await expect(pa.locator("#sessions")).toContainText("Wiskundige Geletterdheid");
  expect(await pa.locator("body").textContent()).toContain("Rente-somme gaan nou beter.");
  await pa.screenshot({ path: shot("08-pa-afstand-konsole.png"), fullPage: true });

  /* Wallie se toestel, #pa-blad (sinkroniseer-status vir Pa as hy by die skootrekenaar is) */
  await page.goto("/#pa");
  await expect(page.locator("#view-pa .js-durable-status")).toContainText("gesinkroniseer");
  await page.screenshot({ path: shot("09-toestel-pa-blad.png"), fullPage: true });

  /* Aanwyser bly sigbaar op ’n smal skerm */
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#missie");
  await expect(page.locator("#sync-pill")).toBeInViewport();
  await page.screenshot({ path: shot("10-mobiel-aanwyser.png") });

  expect(mock.calls.some((c) => c.name === "wallie_pa_live" && c.body.p_token === "tok_test")).toBe(true);
  expectNoLeaks(mock);
});
