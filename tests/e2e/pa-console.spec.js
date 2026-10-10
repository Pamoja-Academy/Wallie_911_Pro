/* Pa se kant (doelwit 3): wat Hanno sien ná login. Die bediener-nabootsing is hier ’n ECHTE Postgres (PGlite) met
   migrations/001 + 002; alles (status, rooster teenoor werklikheid, surveys, foto's, toestel-sinkronisering) word
   deur die werklike wallie_pa_overview-SQL bereken uit gebeure wat Wallie se app self gestuur het. */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, runUntil, shot, expectNoLeaks } = require("./helpers");

const at = (iso) => Date.parse(iso);
/* Woensdag 7 Okt 2026, 09:05 SAST */
const NOW = new Date("2026-10-07T09:05:00+02:00");

const MON_ENG = at("2026-10-05T09:00:00+02:00"); // Engels 45 min (geen blok -> tel vir engels-lit)
const MON_WISK = at("2026-10-05T10:00:00+02:00"); // Wisk. Gelett. 40 min (geen blok -> warm 30 klaar, groen 10 gedeeltelik)
const TUE_RTT = at("2026-10-06T09:00:00+02:00"); // RTT 70 min direk aan blok gekoppel
const TUE_AFR = at("2026-10-06T11:00:00+02:00"); // Afrikaans 40 van 80 min (gedeeltelik)
const WED_WISK = at("2026-10-07T07:00:00+02:00"); // Wisk. Gelett. 30 min vanoggend (warm klaar)

const sess = (start, subjectSlug, mins, extra = {}) => ({
  id: `s_${start}`, date: new Date(start + 2 * 3600000).toISOString().slice(0, 10), subjectSlug, task: "Oefening",
  durationMin: mins, actualMin: mins, plannedMin: mins, startedAt: start, endedAt: start + mins * 60000, warnings: 0, locks: 0, memoMin: 0,
  outcome: "tyd_klaar", ...extra
});

const STATE = {
  sessions: [
    sess(WED_WISK, "wiskgelett", 30),
    sess(TUE_AFR, "afrikaans", 40, { warnings: 2, outcome: "handmatig" }),
    sess(TUE_RTT, "rtt", 70, { block: { id: "2026-10-06-rtt-or-third", title: "RTT — diep werk" } }),
    sess(MON_WISK, "wiskgelett", 40),
    sess(MON_ENG, "engels", 45)
  ],
  wallieSurveys: [
    {
      id: `ws_${MON_ENG + 46 * 60000}`, sessionId: `s_${MON_ENG}`, subjectSlug: "engels", date: "2026-10-05", at: MON_ENG + 46 * 60000,
      answers: { fokus: "4", metode: "ja", moeilikheid: "reg", blokkade: "niks", eerlikheid: "100", help_more: "Meer ou vraestelle asseblief, Pa." }
    },
    {
      id: `ws_${TUE_AFR + 41 * 60000}`, sessionId: `s_${TUE_AFR}`, subjectSlug: "afrikaans", date: "2026-10-06", at: TUE_AFR + 41 * 60000,
      answers: { fokus: "2", metode: "nee", moeilikheid: "te_swaar", blokkade: "moeg", eerlikheid: "half", help_more: "Ek was moeg en het die opdragwoorde nie verstaan nie." }
    }
  ],
  paSurveys: [],
  bugReports: [{ id: `bug_${TUE_RTT - 3600000}`, date: "2026-10-06", at: TUE_RTT - 3600000, tipe: "kamera", severity: "irriterend", subjectSlug: "", detail: "Kamera vries soms.", code: "" }]
};

const flat = (t) => t.replace(/\s+/g, " ").trim();

async function loginToConsole(context, mock, page, vp = { width: 900, height: 1300 }) {
  const pa = await context.newPage();
  mock._pageNow = await page.evaluate(() => Date.now());
  await pa.clock.install({ time: mock._pageNow });
  await pa.setViewportSize(vp);
  await pa.goto("/pa-afstand.html");
  await pa.locator("#login-pass").fill("toets-wagwoord");
  await pa.locator("#login-form button").first().click();
  return pa;
}

test("Pa-konsole: lewendige status, rooster teenoor werklikheid, surveys woordeliks, foto's en toestel-sinkronisering", async ({ page, context }) => {
  const mock = await new MockBackend({ mode: "full" }).init();
  mock._pageNow = NOW.getTime();
  mock.nowFn = () => mock._pageNow;
  const sync = async () => (mock._pageNow = await page.evaluate(() => Date.now()));
  await mock.attach(context);
  await boot(page, { time: NOW, seed: { wallie911_v2_bok: STATE } });
  await page.goto("/#missie");
  await sync();

  /* Terugvul + rooster-sinkronisering deur die werklike SQL */
  await runUntil(page, async () => (await sync(), (await mock.sql("select count(*)::int n from wallie911.plan"))[0].n >= 21), { label: "rooster ontvang" });
  await runUntil(page, async () => (await sync(), (await mock.sql("select count(*)::int n from wallie911.events where kind in ('end','survey','probleem')"))[0].n >= 8), { label: "historie ontvang" });

  /* Vandag: Toerisme-blok handmatig as klaar merk, dan ’n lewendige Engels-sessie op sy blok */
  await page.locator('.mark-done[data-id="2026-10-07-toerisme"]').click();
  await page.evaluate(() =>
    WALLIE.app.startSession({ subjectSlug: "engels", minutes: 50, task: "Opstel — PEEL-paragrawe", blockId: "2026-10-07-engels-lit" })
  );
  for (let i = 0; i < 7; i++) {
    await page.clock.runFor(10000);
    await sync();
  }
  await runUntil(page, async () => (await sync(), mock.stills.length >= 2), { step: 10000, label: "2 kamera-foto's" });
  await runUntil(page, async () => (await sync(), (await mock.sql("select count(*)::int n from wallie911.presence"))[0].n >= 1), { label: "hartklop in db" });
  await page.screenshot({ path: shot("07-wallie-in-sessie-gesinkroniseer.png") });

  /* Pa se foon/rekenaar */
  const pa = await loginToConsole(context, mock, page);
  await expect(pa.locator("#status-text")).toHaveText("IN SESSIE", { timeout: 20000 });
  await expect(pa.locator("#s-vak")).toHaveText("Engels EAT");
  await expect(pa.locator("#detail")).toContainText("Taak: Opstel — PEEL-paragrawe");
  await expect(pa.locator("#detail")).toContainText("Begin 09:05");
  await expect(pa.locator("#presence")).toContainText("oortjie sigbaar");
  await expect(pa.locator("#syncline")).toContainText("Toestel laas suksesvol gesinkroniseer");
  await expect(pa.locator("#syncline")).not.toHaveClass(/bad/);
  await expect(pa.locator("#legacy-banner")).toBeHidden();

  /* Vandag: rooster teenoor werklikheid. 8 studie-blokke (pouse/foutlog-slot uitgesluit):
     klaar = Wisk. Gelett. opwarm (30 min vanoggend) + Toerisme (handmatig); gedeeltelik = Engels (lewendig); 5 nog te doen */
  await expect(pa.locator("#plan-title")).toHaveText("Vandag — rooster teenoor werklikheid");
  expect(flat(await pa.locator("#today-table tr:last-child").innerText())).toMatch(/^Totaal 8 2 1 0 5 /);
  const blocks = flat(await pa.locator("#blocks").innerText());
  expect(blocks).toMatch(/✓ klaar Wiskundige Geletterdheid — opwarm · 30\/30 min/);
  expect(blocks).toMatch(/✓ klaar Toerisme — vraag-lees protokol · 0\/25 min · deur Wallie as klaar gemerk/);
  expect(blocks).toMatch(/◐ gedeeltelik Engels EAT — Engels — letterkunde/);
  expect(blocks).toMatch(/○ gepland Gasvryheidstudie/);

  /* Week (Ma 5 – So 11 Okt): 7 dae × 8 blokke. Wisk. Gelett.: 14 gepland, 2 klaar (Ma + Wo opwarm), 1 gedeeltelik (Ma groen 10/50),
     2 gemis (Di), 9 nog te doen; 70 van 560 min; 70 sessie-minute. */
  await expect(pa.locator("#week-title")).toContainText("Week");
  const week = flat(await pa.locator("#week-table").innerText());
  expect(week).toMatch(/Wiskundige Geletterdheid 14 2 1 2 9 70 \/ 560 70/);
  /* Engels: 7 gepland; Ma klaar (45), Di gemis, Wo gedeeltelik (lewendig), 4 nog te doen */
  expect(week).toMatch(/Engels EAT 7 1 1 1 4 /);
  /* RTT: 14 gepland (7 rtt-or-third + 7 RTT V1-oefenblokke wat die ou geel-blok vervang het); Di klaar via blok-koppeling (70/70),
     3 gemis (Ma + Di se oefenblok, Ma se diep werk), 10 nog te doen */
  expect(week).toMatch(/RTT \(CAT\) 14 1 0 3 10 70 \/ 980 70/);
  /* Afrikaans: Di gedeeltelik (40/80), Ma gemis */
  expect(week).toMatch(/Afrikaans Huistaal 7 0 1 1 5 40 \/ 560 40/);
  const days = flat(await pa.locator("#week-days").innerText());
  expect(days).toMatch(/Ma. 5 Okt. 8 2 1 5/);
  expect(days).toMatch(/Di. 6 Okt. 8 1 1 6/);
  expect(days).toMatch(/Wo. 7 Okt. 8 2 1 0/);

  /* Surveys woordeliks met datum en tyd (nuutste eerste), plus probleem en toestel-sinkronisering */
  const fb = flat(await pa.locator("#feedback").innerText());
  expect(fb).toContain("2026-10-06 11:41");
  expect(fb).toContain("Help: Ek was moeg en het die opdragwoorde nie verstaan nie.");
  expect(fb).toContain("2026-10-05 09:46");
  expect(fb).toContain("Help: Meer ou vraestelle asseblief, Pa.");
  expect(fb).toContain("moeilikheid: te_swaar");
  expect(fb.indexOf("2026-10-06 11:41")).toBeLessThan(fb.indexOf("2026-10-05 09:46"));
  await expect(pa.locator("#problems")).toContainText("Kamera vries soms.");

  /* Foto's: werklike beelde (laai via wallie_pa_still) */
  await expect(pa.locator("#gallery img").first()).toBeVisible({ timeout: 20000 });
  expect(await pa.locator("#gallery img").count()).toBeGreaterThanOrEqual(2);
  await expect(pa.locator("#still-card")).toBeVisible();

  await pa.screenshot({ path: shot("08-pa-konsole-volledig.png"), fullPage: true });
  await pa.setViewportSize({ width: 430, height: 900 });
  await pa.evaluate(() => window.scrollTo(0, 0));
  await pa.screenshot({ path: shot("09-pa-konsole-foon.png") });

  /* Ander dag kies: Maandag (verby) — blokke wat niks gedoen het is "gemis" */
  await pa.setViewportSize({ width: 900, height: 1300 });
  await pa.locator("#day-pick").fill("2026-10-05");
  await pa.locator("#day-pick").dispatchEvent("change");
  await expect(pa.locator("#plan-title")).toContainText("Ma");
  await expect(pa.locator("#blocks")).toContainText("✗ gemis");
  expect(flat(await pa.locator("#today-table tr:last-child").innerText())).toMatch(/^Totaal 8 2 1 5 0 /);
  await pa.screenshot({ path: shot("10-pa-konsole-maandag-gemis.png"), fullPage: true });

  /* Wallie se eie #pa-blad wys steeds sy sinkronisering */
  await page.goto("/#pa");
  await expect(page.locator("#view-pa .js-durable-status")).toContainText("gesinkroniseer");
  await page.screenshot({ path: shot("11-toestel-pa-blad.png"), fullPage: true });
  expectNoLeaks(mock);
});

test("Pa-konsole sonder migrasie 002: basiese weergawe + duidelike boodskap (geen breuk nie)", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  mock._pageNow = NOW.getTime();
  mock.nowFn = () => mock._pageNow;
  await mock.attach(context);
  await boot(page, { time: NOW, seed: { wallie911_v2_bok: { sessions: [sess(WED_WISK, "wiskgelett", 30)], wallieSurveys: [] } } });
  await page.goto("/#missie");
  await runUntil(page, async () => mock.byKind("end").length === 1, { label: "terugvul" });
  mock._pageNow = await page.evaluate(() => Date.now());
  /* Plan-RPC bestaan nie op ’n bediener sonder 002 nie */
  const pa = await loginToConsole(context, mock, page, { width: 900, height: 900 });
  await expect(pa.locator("#legacy-banner")).toBeVisible({ timeout: 20000 });
  await expect(pa.locator("#sessions")).toContainText("Wiskundige Geletterdheid");
  await expect(pa.locator("#plan-note")).toContainText("migrations/002");
  expect(mock.calls.some((c) => c.name === "wallie_pa_overview")).toBe(true);
  expect(mock.calls.some((c) => c.name === "wallie_pa_live")).toBe(true);
  await pa.screenshot({ path: shot("12-pa-konsole-sonder-002.png"), fullPage: true });
});
