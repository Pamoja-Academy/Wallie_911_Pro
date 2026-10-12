/* Pa-konsole v2: volle geskiedenis sedert 27 Sep (PK.HIST_START) teen die ECHTE SQL (PGlite + migrations 001/002).
   Bewys: 'n vergiftigde v1-kas ({} vir elke dag) word geignoreer en verwyder; elke dag 27 Sep..11 Okt kom uit
   wallie_pa_overview; dae met net "blok klaar"-merke (1 Okt) wys 'n aparte merker; die week-grafiek werk vir enige
   week terug tot 27 Sep; en 'n warm kas haal nie weer ou dae binne 6 h nie. */
const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, runUntil, expectNoLeaks, ARTIFACTS } = require("./helpers");

const NOW = new Date("2026-10-11T18:40:00+02:00");
const at = (iso) => Date.parse(iso);
const SHOTS = path.join(ARTIFACTS, "weergawe-pa");
fs.mkdirSync(SHOTS, { recursive: true });

const SUBJ = {
  gasvryheid: "Gasvryheidstudie",
  wiskgelett: "Wiskundige Geletterdheid",
  rtt: "RTT (CAT)",
  afrikaans: "Afrikaans HT"
};
/* [SAST-begin, vak, minute] */
const SESSIONS = [
  ["2026-09-27T10:00", "gasvryheid", 39],
  ["2026-09-28T09:00", "wiskgelett", 30],
  ["2026-09-28T11:00", "rtt", 7],
  ["2026-09-28T14:00", "afrikaans", 1],
  ["2026-09-29T09:00", "gasvryheid", 19],
  ["2026-09-30T09:00", "wiskgelett", 50],
  ["2026-10-10T09:00", "rtt", 7],
  ["2026-10-11T09:00", "rtt", 13]
];

async function seed(mock) {
  const v2 = (p) => mock.sql("select public.wallie_ingest_v2($1::jsonb) r", [JSON.stringify(p)]);
  for (const [start, slug, mins] of SESSIONS) {
    const t = at(`${start}:00+02:00`);
    const id = `s_${slug}_${t}`;
    await v2({
      kind: "end", event_id: `end:${id}`, session_id: id, subject: SUBJ[slug], subject_slug: slug, status: "off", outcome: "tyd_klaar",
      started_at: t, ended_at: t + mins * 60000, client_at: t + mins * 60000, actual_ms: mins * 60000,
      planned_min: mins, block_id: null, device_id: "d_hist", app_version: "t"
    });
  }
  /* 1 Okt: 'n rooster van 6 blokke, almal net self as klaar gemerk (geen sessie, geen gemete tyd) */
  const blocks = Array.from({ length: 6 }, (_, i) => ({
    id: `2026-10-01-b${i}`, kind: "geel", subject: "Wiskundige Geletterdheid", subject_slug: "wiskgelett", minutes: 40,
    title: `Blok ${i + 1}`, start: `${String(8 + i).padStart(2, "0")}:00`, end: `${String(8 + i).padStart(2, "0")}:40`
  }));
  await mock.sql("select public.wallie_ingest_plan($1::jsonb) r", [
    JSON.stringify({ day: "2026-10-01", plan_hash: "h_1okt", client_at: at("2026-10-01T07:00:00+02:00"), blocks })
  ]);
  for (const b of blocks) {
    await v2({ kind: "block", event_id: `block:${b.id}`, block_id: b.id, client_at: at(`2026-10-01T${b.end}:00+02:00`), device_id: "d_hist", app_version: "t" });
  }
}

/* Vergiftigde v1-kas: {} vir elke verlede dag */
function poisonedV1() {
  const out = {};
  for (let t = at("2026-09-27T12:00:00+02:00"); t < at("2026-10-11T00:00:00+02:00"); t += 86400000) {
    out[new Date(t).toISOString().slice(0, 10)] = {};
  }
  return out;
}

async function heatTable(page) {
  return page.evaluate(() => [...document.querySelectorAll("#heat-table tr")].map((tr) => [...tr.children].map((c) => c.textContent.trim())));
}
function cell(rows, vak, dag) {
  const head = rows[0];
  const r = rows.find((x) => x[0] === vak);
  const i = head.findIndex((h) => h.startsWith(dag));
  return r && i > 0 ? r[i] : null;
}
async function weekSums(page) {
  return page.evaluate(() => {
    const c = echarts.getInstanceByDom(document.getElementById("weekChart"));
    const series = c ? c.getOption().series : [];
    const out = [0, 0, 0, 0, 0, 0, 0];
    series.forEach((s) => (s.data || []).forEach((v, i) => (out[i] += Number(v) || 0)));
    return out;
  });
}
async function pickDay(page, day) {
  await page.locator("#day-pick").fill(day);
  await page.locator("#day-pick").dispatchEvent("change");
}
async function chartsShot(page, name) {
  await page.clock.runFor(3000);
  const style = "header.top{position:static !important}"; /* taai kop bedek nie die kaart nie */
  await page.locator("#heatmap").screenshot({ path: path.join(SHOTS, `${name}-heatmap.png`), style });
  await page.locator("#week").screenshot({ path: path.join(SHOTS, `${name}-week.png`), style });
}

test("Pa-konsole: volle geskiedenis sedert 27 Sep, blok-merkers, enige week, warm kas", async ({ page, context }) => {
  const mock = await new MockBackend({ mode: "full" }).init();
  mock.nowFn = () => NOW.getTime();
  await mock.attach(context);
  await seed(mock);

  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await boot(page, { time: NOW, consent: false, seed: { wallie911_pa_token: "tok_test", wallie911_pa_hist_v1: poisonedV1() } });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" }); /* geen in-gly nie: kaarte is dadelik sigbaar vir die skermskote */
  await page.goto("/pa-konsole.html");
  await expect(page.locator("#console-view")).toBeVisible();

  /* Wag tot die terugvul klaar is (7 Okt is die laaste ou dag wat gehaal word) en die tabel gevul is */
  await runUntil(page, async () => {
    const rows = await heatTable(page);
    return rows.length > 1 && cell(rows, "Wisk. Gel.", "30 Sep") === "50" && cell(rows, "Gasvryheid", "27 Sep") === "39" &&
      cell(rows, "Blokke klaar (geen tyd gemeet)", "1 Okt") === "6";
  }, { label: "hittekaart vanaf 27 Sep gevul", max: 60000 });
  await runUntil(page, async () => !(await page.evaluate(() => PK.ui.lastModel.historyLoading)), { label: "terugvul klaar" });

  const rows = await heatTable(page);
  expect(rows[0].length).toBe(16); /* "Vak" + 15 dae */
  expect(rows[0][1]).toMatch(/^27 Sep/);
  expect(rows[0][15]).toMatch(/^11 Okt/);
  expect({
    gas27: cell(rows, "Gasvryheid", "27 Sep"), gas29: cell(rows, "Gasvryheid", "29 Sep"),
    wisk28: cell(rows, "Wisk. Gel.", "28 Sep"), wisk30: cell(rows, "Wisk. Gel.", "30 Sep"),
    rtt28: cell(rows, "RTT (CAT)", "28 Sep"), rtt10: cell(rows, "RTT (CAT)", "10 Okt"), rtt11: cell(rows, "RTT (CAT)", "11 Okt"),
    afr28: cell(rows, "Afrikaans", "28 Sep"), blk1: cell(rows, "Blokke klaar (geen tyd gemeet)", "1 Okt"),
    blk2: cell(rows, "Blokke klaar (geen tyd gemeet)", "2 Okt")
  }).toEqual({ gas27: "39", gas29: "19", wisk28: "30", wisk30: "50", rtt28: "7", rtt10: "7", rtt11: "13", afr28: "1", blk1: "6", blk2: "0" });
  await expect(page.locator("#heat-sub")).toHaveText("Sedert 27 Sep: 166 min gemeet in 8 sessies, 6 blokke klaar gemerk");
  await expect(page.locator("#day-pick")).toHaveAttribute("min", "2026-09-27");

  /* Die vergiftigde v1-kas is weg; v2 het elke ou dag met 'at' */
  const ls = await page.evaluate(() => ({ v1: localStorage.getItem("wallie911_pa_hist_v1"), v2: JSON.parse(localStorage.getItem("wallie911_pa_hist_v2") || "{}") }));
  expect(ls.v1).toBeNull();
  expect(Object.keys(ls.v2).sort()[0]).toBe("2026-09-27");
  expect(ls.v2["2026-10-01"]).toMatchObject({ blocksDone: 6, by: {} });
  expect(typeof ls.v2["2026-10-01"].at).toBe("number");

  /* Elke ou dag is met wallie_pa_overview gehaal */
  const ovDays = new Set(mock.calls.filter((c) => c.name === "wallie_pa_overview" && c.body.p_day).map((c) => c.body.p_day));
  for (const d of ["2026-09-27", "2026-09-28", "2026-10-01", "2026-10-10"]) expect(ovDays.has(d), d).toBe(true);

  /* Foon: die hittekaart wys die nuutste dae met 'n dataZoom (sleep vir vroeer dae); die bladsy rol nie sywaarts nie */
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(1000);
  await runUntil(page, async () => page.evaluate(() => {
    const c = echarts.getInstanceByDom(document.getElementById("heatChart"));
    const z = c && c.getOption().dataZoom;
    return !!(z && z.length && z[0].endValue === 14 && z[0].startValue > 0);
  }), { label: "dataZoom op foon" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await chartsShot(page, "vandag-390");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.clock.runFor(1000);
  await chartsShot(page, "vandag-1280");

  /* 28 Sep: KPI's en die week Ma 28 Sep - So 4 Okt */
  await pickDay(page, "2026-09-28");
  await runUntil(page, async () => (await page.locator("#k-min").textContent()) === "38" && (await page.locator("#k-sess").textContent()) === "3", { label: "KPI 28 Sep" });
  await expect(page.locator("#week-title")).toHaveText("Week 28 Sep. – 4 Okt.");
  await runUntil(page, async () => (await weekSums(page)).slice(0, 3).join() === "38,19,50", { label: "week 28 Sep" });
  expect(await weekSums(page)).toEqual([38, 19, 50, 0, 0, 0, 0]);
  await chartsShot(page, "28-sep-1280");

  /* 27 Sep (Sondag): die week 21-27 Sep wys 39 op So */
  await pickDay(page, "2026-09-27");
  await runUntil(page, async () => (await weekSums(page))[6] === 39, { label: "week 27 Sep" });
  expect(await weekSums(page)).toEqual([0, 0, 0, 0, 0, 0, 39]);

  /* Net lees-RPC's */
  for (const c of mock.calls) {
    expect(["wallie_pa_overview", "wallie_pa_live", "wallie_pa_still", "wallie_pa_login"]).toContain(c.name);
  }

  /* Warm kas: herlaai binne 6 h haal geen dag ouer as gister weer nie */
  await page.clock.runFor(10 * 60000); /* (die gekose dag 27 Sep word intussen elke 60 s gepeil) */
  const before = mock.calls.length;
  await page.reload();
  await expect(page.locator("#console-view")).toBeVisible();
  await runUntil(page, async () => {
    const r = await heatTable(page);
    return r.length > 1 && cell(r, "Gasvryheid", "27 Sep") === "39";
  }, { label: "warm hittekaart" });
  await page.clock.runFor(15000);
  const after = mock.calls.slice(before).filter((c) => c.body && c.body.p_day);
  expect(after.map((c) => c.body.p_day).filter((d) => d < "2026-10-10")).toEqual([]);
  const warmRows = await heatTable(page);
  expect(cell(warmRows, "Blokke klaar (geen tyd gemeet)", "1 Okt")).toBe("6");

  expect(errors).toEqual([]);
  expectNoLeaks(mock);
});
