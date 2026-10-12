/* Pa-konsole v2: die geskiedenis mag Pa nie mislei nie (teen die ECHTE SQL: PGlite + migrations 001/002).

   1) Die ry "Blokke klaar (geen tyd gemeet)" tel NET blokke wat klaar gemerk is sonder dat enige tyd
      gemeet is. 'n Blok wat klaar is omdat gemete tyd >= 75% van hom dek, wys al as minute in sy vak se
      ry en mag dus nie ook die goue ✓ op daardie ry kry nie.

   2) 'n Dag waarvan die oorsig-oproep misluk het is NIE 'n nul nie: hy wys "nie gelaai nie", hy word uit
      die "Sedert 27 Sep"-som en uit die grafieke gehou, niks word vir hom gestoor nie, en die konsole
      probeer hom weer. */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, runUntil, expectNoLeaks } = require("./helpers");

const NOW = new Date("2026-10-11T18:40:00+02:00");
const at = (iso) => Date.parse(iso);
const WISK = "Wiskundige Geletterdheid";
const GAS = "Gasvryheidstudie";

/* 'n Sessie met gemete tyd; block_id koppel die tyd direk aan 'n blok */
async function session(mock, { day, hm, subject, slug, mins, blockId = null }) {
  const t = at(`${day}T${hm}:00+02:00`);
  const id = `s_${slug}_${t}`;
  await mock.sql("select public.wallie_ingest_v2($1::jsonb) r", [
    JSON.stringify({
      kind: "end", event_id: `end:${id}`, session_id: id, subject, subject_slug: slug, status: "off", outcome: "tyd_klaar",
      started_at: t, ended_at: t + mins * 60000, client_at: t + mins * 60000, actual_ms: mins * 60000,
      planned_min: mins, block_id: blockId, device_id: "d_eerlik", app_version: "t"
    })
  ]);
}

/* Twee Wiskunde-blokke van 40 min op 'n dag */
async function plan(mock, day) {
  const blocks = [0, 1].map((i) => ({
    id: `${day}-b${i}`, kind: "geel", subject: WISK, subject_slug: "wiskgelett", minutes: 40,
    title: `Blok ${i + 1}`, start: `${String(8 + i).padStart(2, "0")}:00`, end: `${String(8 + i).padStart(2, "0")}:40`
  }));
  await mock.sql("select public.wallie_ingest_plan($1::jsonb) r", [
    JSON.stringify({ day, plan_hash: `h_${day}`, client_at: at(`${day}T07:00:00+02:00`), blocks })
  ]);
  return blocks;
}

async function markBlock(mock, day, blockId) {
  await mock.sql("select public.wallie_ingest_v2($1::jsonb) r", [
    JSON.stringify({ kind: "block", event_id: `block:${blockId}`, block_id: blockId, client_at: at(`${day}T09:40:00+02:00`), device_id: "d_eerlik", app_version: "t" })
  ]);
}

async function heatTable(page) {
  return page.evaluate(() => [...document.querySelectorAll("#heat-table tr")].map((tr) => [...tr.children].map((c) => c.textContent.trim())));
}
function cell(rows, vak, dag) {
  const head = rows[0];
  if (!head) return null; /* die tabel is nog nie geteken nie */
  const r = rows.find((x) => x[0] === vak);
  const i = head.findIndex((h) => h.startsWith(dag));
  return r && i > 0 ? r[i] : null;
}
const BLK = "Blokke klaar (geen tyd gemeet)";

async function open(page, context, mock) {
  await mock.attach(context);
  await boot(page, { time: NOW, consent: false, seed: { wallie911_pa_token: "tok_test" } });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/pa-konsole.html");
  await expect(page.locator("#console-view")).toBeVisible();
}
const settled = (page) => runUntil(page, async () => !(await page.evaluate(() => PK.ui.lastModel.historyLoading)), { label: "terugvul klaar", max: 60000 });

test('"Blokke klaar (geen tyd gemeet)" tel nie blokke wat deur gemete tyd klaar is nie', async ({ page, context }) => {
  const mock = await new MockBackend({ mode: "full" }).init();
  mock.nowFn = () => NOW.getTime();

  /* 5 Okt: blok 1 is klaar OMDAT 35 van 40 min gemeet is (>= 75%). Niks self gemerk nie. */
  const d5 = await plan(mock, "2026-10-05");
  await session(mock, { day: "2026-10-05", hm: "08:00", subject: WISK, slug: "wiskgelett", mins: 35, blockId: d5[0].id });

  /* 6 Okt: blok 1 is NET self gemerk (geen tyd), blok 2 is klaar deur 35 gemete min. */
  const d6 = await plan(mock, "2026-10-06");
  await markBlock(mock, "2026-10-06", d6[0].id);
  await session(mock, { day: "2026-10-06", hm: "09:00", subject: WISK, slug: "wiskgelett", mins: 35, blockId: d6[1].id });

  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page, context, mock);

  await runUntil(page, async () => cell(await heatTable(page), "Wisk. Gel.", "6 Okt") === "35", { label: "6 Okt gevul", max: 60000 });
  await settled(page);

  const rows = await heatTable(page);
  /* Albei dae wys hul gemete minute; net die self gemerkte blok op 6 Okt kry die "geen tyd gemeet"-telling */
  expect({
    wisk5: cell(rows, "Wisk. Gel.", "5 Okt"), blk5: cell(rows, BLK, "5 Okt"),
    wisk6: cell(rows, "Wisk. Gel.", "6 Okt"), blk6: cell(rows, BLK, "6 Okt")
  }).toEqual({ wisk5: "35", blk5: "0", wisk6: "35", blk6: "1" });

  /* Die som praat van 1 blok, nie 3 nie (5 Okt se blok 1 en 6 Okt se blok 2 is deur tyd klaar) */
  await expect(page.locator("#heat-sub")).toHaveText("Sedert 27 Sep: 70 min gemeet in 2 sessies, 1 blokke klaar gemerk");

  /* Die goue ✓-merker op die hittekaart staan net op 6 Okt */
  const marks = await page.evaluate(() => {
    const c = echarts.getInstanceByDom(document.getElementById("heatChart"));
    const pt = (d) => (d && d.value ? d.value : d);
    return (c.getOption().series[1].data || []).map((d) => pt(d)[2]);
  });
  expect(marks).toEqual([1]);

  /* Die kas hou albei tellings apart: "klaar" en "klaar sonder gemete tyd" */
  const v2 = await page.evaluate(() => JSON.parse(localStorage.getItem("wallie911_pa_hist_v2") || "{}"));
  expect(v2["2026-10-05"]).toMatchObject({ blocksDone: 1, blocksUntimed: 0 });
  expect(v2["2026-10-06"]).toMatchObject({ blocksDone: 2, blocksUntimed: 1 });

  expect(errors).toEqual([]);
  expectNoLeaks(mock);
});

test('n dag waarvan die oorsig misluk het wys "nie gelaai nie" en word weer probeer', async ({ page, context }) => {
  const mock = await new MockBackend({ mode: "full" }).init();
  mock.nowFn = () => NOW.getTime();
  await session(mock, { day: "2026-09-28", hm: "09:00", subject: WISK, slug: "wiskgelett", mins: 30 });
  await session(mock, { day: "2026-09-29", hm: "09:00", subject: GAS, slug: "gasvryheid", mins: 19 });
  await session(mock, { day: "2026-09-30", hm: "09:00", subject: WISK, slug: "wiskgelett", mins: 50 });
  await session(mock, { day: "2026-10-11", hm: "09:00", subject: WISK, slug: "wiskgelett", mins: 13 });

  /* Net hierdie twee dae se oorsig val om; die res van die bediener werk */
  const STUK = new Set(["2026-09-29", "2026-09-30"]);
  mock.failRpc = (name, body) => (name === "wallie_pa_overview" && body && STUK.has(body.p_day) ? "down" : null);

  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page, context, mock);

  await runUntil(page, async () => cell(await heatTable(page), "Wisk. Gel.", "28 Sep") === "30", { label: "28 Sep gevul", max: 60000 });
  await settled(page);

  /* Die twee stukkende dae wys "?" — nie 0 nie — op elke ry, ook die blok-ry */
  const rows = await heatTable(page);
  expect({
    wisk28: cell(rows, "Wisk. Gel.", "28 Sep"),
    gas29: cell(rows, "Gasvryheid", "29 Sep"), wisk29: cell(rows, "Wisk. Gel.", "29 Sep"), blk29: cell(rows, BLK, "29 Sep"),
    wisk30: cell(rows, "Wisk. Gel.", "30 Sep"), blk30: cell(rows, BLK, "30 Sep"),
    wisk1okt: cell(rows, "Wisk. Gel.", "1 Okt")
  }).toEqual({ wisk28: "30", gas29: "?", wisk29: "?", blk29: "?", wisk30: "?", blk30: "?", wisk1okt: "0" });

  /* Die "Sedert 27 Sep"-som laat die stukkende dae uit en sê hoeveel dae nie gelaai is nie */
  await expect(page.locator("#heat-sub")).toHaveText("Sedert 27 Sep: 43 min gemeet in 2 sessies, 0 blokke klaar gemerk · 2 dae nie gelaai nie — probeer weer");

  /* Die hittekaart het vir daardie dae geen nul-selle nie, net 'n grys "?"-merker */
  const chart = await page.evaluate(() => {
    const c = echarts.getInstanceByDom(document.getElementById("heatChart"));
    const o = c.getOption();
    const pt = (d) => (d && d.value ? d.value : d);
    const xl = o.xAxis[0].data;
    const ix = ["29 Sep", "30 Sep"].map((d) => xl.findIndex((x) => x.startsWith(d)));
    return {
      ix,
      waardes: (o.series[0].data || []).map(pt).filter((d) => ix.includes(d[0])).map((d) => d[2]),
      gapings: (o.series[2].data || []).map((d) => pt(d)[0])
    };
  });
  expect(chart.ix.every((i) => i > 0)).toBe(true);
  /* geen 0 vir 'n dag wat nie gelaai is nie: elke vak-ry se sel is leeg */
  expect(chart.waardes.length).toBeGreaterThan(0);
  expect(chart.waardes.every((v) => v === "-")).toBe(true);
  expect(chart.gapings.slice().sort()).toEqual(chart.ix.slice().sort());

  /* Niks word vir 'n mislukte dag gestoor nie: 'n volgende oopmaak begin nie met vals nulle nie */
  const cached = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("wallie911_pa_hist_v2") || "{}")));
  expect(cached).not.toContain("2026-09-29");
  expect(cached).not.toContain("2026-09-30");
  expect(cached).toContain("2026-09-28");

  /* Die bediener kom terug: die konsole probeer die twee dae weer, sonder dat Pa iets doen */
  const voor = mock.calls.filter((c) => c.name === "wallie_pa_overview" && STUK.has(c.body && c.body.p_day)).length;
  expect(voor).toBeGreaterThanOrEqual(2); /* dit is darem al 'n keer of twee probeer */
  mock.failRpc = null;

  await runUntil(page, async () => {
    const r = await heatTable(page);
    return cell(r, "Gasvryheid", "29 Sep") === "19" && cell(r, "Wisk. Gel.", "30 Sep") === "50";
  }, { label: "stukkende dae weer probeer", max: 180000 });
  await settled(page);

  await expect(page.locator("#heat-sub")).toHaveText("Sedert 27 Sep: 112 min gemeet in 4 sessies, 0 blokke klaar gemerk");
  const na = await page.evaluate(() => {
    const c = echarts.getInstanceByDom(document.getElementById("heatChart"));
    return (c.getOption().series[2].data || []).length;
  });
  expect(na).toBe(0);
  expect(await page.evaluate(() => document.querySelectorAll("#heat-table td.na").length)).toBe(0);

  expect(errors).toEqual([]);
  expectNoLeaks(mock);
});
