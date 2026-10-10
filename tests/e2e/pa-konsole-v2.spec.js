/* Pa-konsole v2 (pa-konsole.html): dieselfde ECHTE Postgres-nabootsing (PGlite + migrations 001/002) as pa-console.spec.js.
   Bewys: lewendige status, rooster teenoor werklikheid, 14-dae-geskiedenis KLIËNT-KANT afgelei uit wallie_pa_live (geen migrasie),
   geen punte/persentasies, data.js word nooit gelaai nie, en voorskou-modus stuur NIKS na buite nie. */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, runUntil, shot, expectNoLeaks } = require("./helpers");

const root = path.join(__dirname, "..", "..");
const at = (iso) => Date.parse(iso);
const NOW = new Date("2026-10-07T09:05:00+02:00");
const MON_ENG = at("2026-10-05T09:00:00+02:00");
const MON_WISK = at("2026-10-05T10:00:00+02:00");
const TUE_RTT = at("2026-10-06T09:00:00+02:00");
const TUE_AFR = at("2026-10-06T11:00:00+02:00");
const WED_WISK = at("2026-10-07T07:00:00+02:00");
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
  wallieSurveys: [],
  paSurveys: [],
  bugReports: []
};
const flat = (t) => t.replace(/\s+/g, " ").trim();

test("integrity: ge-vendor-de ECharts en Motion stem ooreen met pa-konsole.html se SHA-384", async () => {
  const html = fs.readFileSync(path.join(root, "pa-konsole.html"), "utf8");
  const tags = [...html.matchAll(/<script (?:id="[^"]+" )?src="(assets\/vendor\/[^"]+)" integrity="(sha384-[^"]+)"/g)];
  expect(tags.length).toBe(2);
  for (const [, src, sri] of tags) {
    const h = "sha384-" + crypto.createHash("sha384").update(fs.readFileSync(path.join(root, src))).digest("base64");
    expect(h, src).toBe(sri);
  }
  expect(html).not.toContain("assets/js/data.js");
  expect(html).toContain('<script src="assets/js/preview-guard.js"></script>');
});

test("Pa-konsole v2: status, blokke, kliënt-kant geskiedenis, geen persentasies, geen data.js", async ({ page, context }) => {
  const mock = await new MockBackend({ mode: "full" }).init();
  mock._pageNow = NOW.getTime();
  mock.nowFn = () => mock._pageNow;
  const sync = async () => (mock._pageNow = await page.evaluate(() => Date.now()));
  await mock.attach(context);
  await boot(page, { time: NOW, seed: { wallie911_v2_bok: STATE } });
  await page.goto("/#missie");
  await sync();
  await runUntil(page, async () => (await sync(), (await mock.sql("select count(*)::int n from wallie911.plan"))[0].n >= 21), { label: "rooster ontvang" });
  await runUntil(page, async () => (await sync(), (await mock.sql("select count(*)::int n from wallie911.events where kind = 'end'"))[0].n >= 5), { label: "historie ontvang" });
  await page.evaluate(() =>
    WALLIE.app.startSession({ subjectSlug: "engels", minutes: 50, task: "Opstel — PEEL-paragrawe", blockId: "2026-10-07-engels-lit" })
  );
  for (let i = 0; i < 7; i++) {
    await page.clock.runFor(10000);
    await sync();
  }
  await runUntil(page, async () => (await sync(), (await mock.sql("select count(*)::int n from wallie911.presence"))[0].n >= 1), { label: "hartklop in db" });

  const pa = await context.newPage();
  const requested = [];
  pa.on("request", (r) => requested.push(r.url()));
  const errors = [];
  pa.on("pageerror", (e) => errors.push(e.message));
  mock._pageNow = await page.evaluate(() => Date.now());
  await pa.clock.install({ time: mock._pageNow });
  await pa.setViewportSize({ width: 1280, height: 900 });
  await pa.goto("/pa-konsole.html");
  await expect(pa.locator("#login-view")).toBeVisible();
  await expect(pa.locator("#demo-badge")).toBeHidden();
  await pa.locator("#login-pass").fill("verkeerd");
  await pa.locator("#login-form button").click();
  await expect(pa.locator("#login-err")).toHaveText("Verkeerde wagwoord.");
  await pa.locator("#login-pass").fill("toets-wagwoord");
  await pa.locator("#login-form button").click();
  await expect(pa.locator("#console-view")).toBeVisible();

  await expect(pa.locator("#status-text")).toHaveText("IN SESSIE", { timeout: 20000 });
  await expect(pa.locator("#hero")).toHaveAttribute("data-s", "on");
  await expect(pa.locator("#what-text")).toContainText("Engels");
  await expect(pa.locator("#plan-title")).toHaveText("Vandag — rooster teenoor werklikheid");
  const table = flat(await pa.locator("#gantt-table").textContent());
  expect(table).toContain("Wiskundige Geletterdheid");
  expect(table).toMatch(/klaar/);
  await expect(pa.locator("#k-sess")).not.toHaveText("0");

  /* Geskiedenis: Ma 5 Okt en Di 6 Okt kom uit wallie_pa_live per dag (geen nuwe RPC/migrasie nie) */
  await runUntil(pa, async () => /70/.test(await pa.locator("#heat-table").textContent()), { label: "hittekaart gevul" });
  const heat = await pa.evaluate(() => {
    const rows = [...document.querySelectorAll("#heat-table tr")].map((tr) => [...tr.children].map((c) => c.textContent.trim()));
    const head = rows[0];
    const cell = (vak, dag) => { const r = rows.find((x) => x[0] === vak); return r ? r[head.findIndex((h) => h.startsWith(dag))] : null; };
    return { rtt6: cell("RTT (CAT)", "6 Okt"), eng5: cell("Engels", "5 Okt"), wisk5: cell("Wisk. Gel.", "5 Okt"), wisk7: cell("Wisk. Gel.", "7 Okt") };
  });
  expect(heat).toEqual({ rtt6: "70", eng5: "45", wisk5: "40", wisk7: "30" });
  const liveDays = mock.calls.filter((c) => c.name === "wallie_pa_live" && c.body.p_day).map((c) => c.body.p_day);
  expect(liveDays).toContain("2026-10-05");
  expect(liveDays).toContain("2026-10-06");
  const cache = await pa.evaluate(() => JSON.parse(localStorage.getItem("wallie911_pa_hist_v1") || "{}"));
  expect(Object.keys(cache)).toContain("2026-10-06");
  /* Alleen bekende RPC's */
  const names = new Set(mock.calls.filter((c) => c.name.startsWith("wallie_pa")).map((c) => c.name));
  for (const n of names) expect(["wallie_pa_login", "wallie_pa_overview", "wallie_pa_live", "wallie_pa_still"]).toContain(n);

  /* Reëls: geen persentasies, geen LO, geen data.js */
  const body = await pa.locator("body").innerText();
  expect(body).not.toContain("%");
  expect(body).not.toMatch(/\bLO\b|Lewensori/);
  expect(requested.some((u) => /assets\/js\/data\.js/.test(u))).toBe(false);
  expect(errors).toEqual([]);

  await pa.clock.runFor(3000); /* nep-klok: laat die in-gly-animasies klaarmaak voor die skermskoot */
  await pa.screenshot({ path: shot("pk2-01-konsole-1280.png"), fullPage: true });
  await pa.setViewportSize({ width: 390, height: 844 });
  await pa.evaluate(() => window.scrollTo(0, 0));
  await pa.clock.runFor(3000);
  await pa.screenshot({ path: shot("pk2-02-konsole-390.png") });
  const overflow = await pa.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  /* Verlede dag */
  await pa.setViewportSize({ width: 1280, height: 900 });
  await pa.locator("#day-pick").fill("2026-10-05");
  await pa.locator("#day-pick").dispatchEvent("change");
  await expect(pa.locator("#plan-title")).toContainText("5");
  await expect(pa.locator("#status-text")).toContainText("Geskiedenis");

  /* Uitteken */
  await pa.locator("#logout").click();
  await expect(pa.locator("#login-view")).toBeVisible();
  expect(await pa.evaluate(() => localStorage.getItem("wallie911_pa_token"))).toBeNull();
  expectNoLeaks(mock);
});

test("Pa-konsole v2: sessie verval -> terug na aanmelding", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  mock.nowFn = () => NOW.getTime();
  await mock.attach(context);
  await page.clock.install({ time: NOW });
  await page.addInitScript(() => localStorage.setItem("wallie911_pa_token", "ou_token"));
  await page.goto("/pa-konsole.html");
  await expect(page.locator("#login-view")).toBeVisible({ timeout: 20000 });
  await expect(page.locator("#login-err")).toContainText("verval");
});

test("Voorskou (raw.githack-modus): voorbeelddata, banier, en NUL versoeke na Supabase", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/pa-konsole.html?voorskou-toets=1");
  await expect(page.locator("#voorskou-banier")).toBeVisible();
  await expect(page.locator("#console-view")).toBeVisible();
  await expect(page.locator("#demo-badge")).toBeVisible();
  await expect(page.locator("#status-text")).toHaveText("IN SESSIE");
  expect(await page.evaluate(() => window.__VOORSKOU__ && window.__VOORSKOU__.aktief)).toBe(true);
  await page.locator('#state-btns button[data-s="lost"]').click();
  await expect(page.locator("#status-text")).toHaveText("SEIN WEG");
  await page.locator('#state-btns button[data-s="off"]').click();
  await expect(page.locator("#hero")).toHaveAttribute("data-s", "off");
  await page.locator("#show-change").click();
  await page.locator("#new-pass").fill("nuwe-wagwoord-123");
  await page.locator("#change-form button").click();
  await expect(page.locator("#change-err")).toContainText("Voorskou");
  await page.waitForTimeout(2000);
  expect(mock.calls, "geen RPC in voorskou").toEqual([]);
  expectNoLeaks(mock);
  const body = await page.locator("body").innerText();
  expect(body).not.toContain("%");
  expect(body).not.toMatch(/\bLO\b/);
  expect(errors).toEqual([]);
  await page.screenshot({ path: shot("pk2-03-voorskou-390.png"), fullPage: true });
});
