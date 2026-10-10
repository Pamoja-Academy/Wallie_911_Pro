/* Praktiese modus (RTT/CAT): tydens ’n praktiese blok tel oorskakel na Word/Excel/Access NIE as wegkyk nie,
   maar hartklop/sigbaarheid loop onveranderd en elke afwesigheid word plaaslik gelog (wallie911_vraebank_v1).
   Buite die blok: presies die ou proctor-gedrag. Alle netwerk onderskep (mock-backend); geen lewendige bediener nie.
   Loop op 1366×768 en 390×844. */
const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, runUntil, hideTab, showTab, shot, expectNoLeaks, T0 } = require("./helpers");

const FIXTURE = path.join(__dirname, "..", "fixtures", "sync-payload-baseline.json");
const MERK = "Praktiese blok: RTT V1";
const VB_KEY = "wallie911_vraebank_v1";
const MAX_MS = (3 * 60 + 15) * 60 * 1000;

/* Dieselfde vorm-funksies as sync-payload-baseline.spec.js */
function shape(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) {
    const els = [...new Set(v.map((x) => JSON.stringify(shape(x))))].sort().map((s) => JSON.parse(s));
    return { array: els };
  }
  if (typeof v === "object") {
    const out = {};
    Object.keys(v)
      .sort()
      .forEach((k) => (out[k] = shape(v[k])));
    return out;
  }
  return typeof v;
}
function collect(mock) {
  const seen = new Set();
  const out = [];
  const add = (entry) => {
    const key = JSON.stringify(entry);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(entry);
  };
  mock.calls.forEach((c) => add({ channel: `rpc:${c.name}`, kind: c.body && c.body.p ? c.body.p.kind ?? null : null, shape: shape(c.body) }));
  mock.ntfy.forEach((n) => add({ channel: "ntfy", kind: null, shape: shape(n) }));
  return out;
}

/* Alle pogings (ook 404/geparkeer), nie net afgelewer nie: daar mag GEEN warn/lock die toestel verlaat nie */
const attempted = (mock, kind) => mock.calls.filter((c) => c.body?.p?.kind === kind);
const vraebank = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), VB_KEY);

async function startRttBlock(page, mock, { pastGrace = true } = {}) {
  await page.goto("/#missie");
  const btn = page.locator('.start-block[data-slug="rtt"]').first();
  await expect(btn).toHaveCount(1);
  await btn.click();
  await runUntil(page, async () => mock.byKind("start").length === 1, { label: "start afgelewer" });
  /* Verby die bestaande 8 s begin-grasie, sodat elke uitstappie sonder praktiese modus WEL ’n waarskuwing is */
  if (pastGrace) await page.clock.runFor(10000);
}

async function excursion(page, awayMs = 20000) {
  await hideTab(page);
  await page.clock.runFor(awayMs);
  await showTab(page);
  await page.clock.runFor(5000);
}

const VIEWPORTS = [
  { name: "1366x768", viewport: { width: 1366, height: 768 } },
  { name: "390x844", viewport: { width: 390, height: 844 } }
];

for (const vp of VIEWPORTS) {
  test.describe(`praktiese modus @ ${vp.name}`, () => {
    test.use({ viewport: vp.viewport });

    test("1. RTT-blok + praktiese modus: 3× minimiseer → 0 warn, 0 lock; hartklop/sigbaarheid loop; 3 afwesighede", async ({ page, context }) => {
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page);
      await startRttBlock(page, mock);

      expect(await page.evaluate(() => Praktiese.canStart())).toBe(true);
      const r = await page.evaluate(() => Praktiese.start());
      expect(r.ok).toBe(true);
      expect(await page.evaluate(() => Praktiese.active())).toBe(true);
      await expect(page.locator("#session-task")).toHaveValue(MERK);

      const hbBefore = mock.byKind("heartbeat").length;
      const visBefore = mock.byKind("visibility").length;
      for (let i = 0; i < 3; i++) await excursion(page);
      await runUntil(page, async () => mock.byKind("heartbeat").length >= hbBefore + 2, { label: "hartkloppe loop steeds" });
      await runUntil(page, async () => mock.byKind("visibility").length >= visBefore + 6, { label: "sigbaarheid-gebeure (3× weg + 3× terug)" });

      expect(attempted(mock, "warn")).toHaveLength(0);
      expect(attempted(mock, "lock")).toHaveLength(0);
      await expect(page.locator("#warn-display")).toHaveText("Waarskuwings: 0 / 3");
      await expect(page.locator("#lock-box")).toBeHidden();
      const vb = await vraebank(page);
      expect(vb.prakties).toHaveLength(1);
      expect(vb.prakties[0].afwesig).toHaveLength(3);
      expect(vb.prakties[0].afwesig.every((a) => a.van && a.tot)).toBe(true);

      /* Die merk loop deur die BESTAANDE taak-veld in die volgende hartklop */
      const hbs = mock.byKind("heartbeat");
      expect(hbs[hbs.length - 1].body.p.task).toBe(MERK);
      await page.screenshot({ path: shot(`fase1/praktiese-aktief-${vp.name}.png`) });

      await page.locator("#end-session").click();
      await runUntil(page, async () => mock.byKind("end").length === 1, { label: "einde afgelewer" });
      expect(mock.byKind("end")[0].body.p).toMatchObject({ task: MERK, warnings: 0, locks: 0 });
      await page.clock.runFor(5000);
      expectNoLeaks(mock);
    });

    test("2. Dieselfde sonder praktiese modus → ou gedrag: 3 warn + 1 lock", async ({ page, context }) => {
      const mock = new MockBackend({ mode: "v1" });
      await mock.attach(context);
      await boot(page);
      await startRttBlock(page, mock);
      expect(await page.evaluate(() => Praktiese.active())).toBe(false);

      for (let i = 0; i < 3; i++) await excursion(page);
      await runUntil(page, async () => mock.byKind("warn").length === 3 && mock.byKind("lock").length === 1, { label: "3 warn + 1 lock" });
      expect(mock.byKind("warn").map((c) => c.body.p.total_warnings)).toEqual([1, 2, 3]);
      await expect(page.locator("#lock-box")).toBeVisible();
      expect(await vraebank(page)).toBeNull();
      expectNoLeaks(mock);
    });

    test("3. Ná end() gee minimiseer weer die ou waarskuwing", async ({ page, context }) => {
      const mock = new MockBackend({ mode: "v1" });
      await mock.attach(context);
      await boot(page);
      await startRttBlock(page, mock);
      await page.evaluate(() => {
        window.__chg = [];
        Praktiese.onChange((i) => window.__chg.push(i));
        Praktiese.start();
      });
      await excursion(page);
      expect(attempted(mock, "warn")).toHaveLength(0);

      const ended = await page.evaluate(() => Praktiese.end());
      expect(ended.rede_einde).toBe("klaar");
      expect(await page.evaluate(() => window.__chg.map((c) => [c.active, c.rede]))).toEqual([
        [true, null],
        [false, "klaar"]
      ]);
      await excursion(page);
      await runUntil(page, async () => mock.byKind("warn").length === 1, { label: "waarskuwing ná einde" });
      await expect(page.locator("#warn-display")).toHaveText("Waarskuwings: 1 / 3");
      expect((await vraebank(page)).prakties[0].afwesig).toHaveLength(1);
      expectNoLeaks(mock);
    });

    test("4. Maks 3 h 15 min (page.clock) → eindig self met 'maks'; herlaai hervat die blok", async ({ page, context }) => {
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page);
      await page.goto("/#sessie");
      await page.locator("#session-subject").selectOption("rtt");
      expect(await page.evaluate(() => Praktiese.start().ok)).toBe(true);
      const begin = Date.parse((await vraebank(page)).prakties[0].begin);

      /* Herlaai tydens die blok */
      await page.clock.runFor(60000);
      await page.reload();
      expect(await page.evaluate(() => Praktiese.active())).toBe(true);
      await expect(page.locator("#session-task")).toHaveValue(MERK);
      const left = await page.evaluate(() => Praktiese.remainingMs());
      expect(left).toBeLessThanOrEqual(MAX_MS - 60000);
      expect(left).toBeGreaterThan(MAX_MS - 2 * 60000);

      await page.evaluate(() => {
        window.__chg = [];
        Praktiese.onChange((i) => window.__chg.push(i));
      });
      await page.clock.fastForward(left + 5000);
      await page.clock.runFor(1000);
      const rec = (await vraebank(page)).prakties[0];
      expect(rec.rede_einde).toBe("maks");
      expect(Date.parse(rec.einde)).toBe(begin + MAX_MS);
      expect(await page.evaluate(() => Praktiese.active())).toBe(false);
      expect(await page.evaluate(() => window.__chg.map((c) => [c.active, c.rede]))).toEqual([[false, "maks"]]);
      expectNoLeaks(mock);
    });

    test("5. Nie ’n RTT-blok nie → canStart() === false", async ({ page, context }) => {
      const mock = new MockBackend({ mode: "v1" });
      await mock.attach(context);
      await boot(page);
      await page.goto("/#missie");
      const btn = page.locator(".start-block").first();
      expect(await btn.getAttribute("data-slug")).not.toBe("rtt");
      await btn.click();
      await runUntil(page, async () => mock.byKind("start").length === 1, { label: "start afgelewer" });
      expect(await page.evaluate(() => Praktiese.canStart())).toBe(false);
      /* Selfs as die keuselys na RTT verander word: die aktiewe sessie se vak tel */
      await page.evaluate(() => {
        document.getElementById("session-subject").value = "rtt";
      });
      expect(await page.evaluate(() => Praktiese.canStart())).toBe(false);
      const r = await page.evaluate(() => Praktiese.start());
      expect(r.ok).toBe(false);
      expect(await vraebank(page)).toBeNull();
      expectNoLeaks(mock);
    });
  });
}

test.describe("praktiese modus: sinkronisering en berging", () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  /* Basislyn-stappe (sync-payload-baseline.spec.js) op die RTT-blok */
  async function baselineRun(page, context, { practical }) {
    const mock = new MockBackend({ mode: "v1" });
    await mock.attach(context);
    await boot(page);
    await startRttBlock(page, mock, { pastGrace: false });
    if (practical) expect(await page.evaluate(() => Praktiese.start().ok)).toBe(true);
    await runUntil(page, async () => mock.byKind("heartbeat").length >= 2, { label: "2 hartkloppe" });
    await hideTab(page);
    await page.clock.runFor(20000);
    await showTab(page);
    if (!practical) await runUntil(page, async () => mock.byKind("warn").length === 1, { label: "waarskuwing afgelewer" });
    await page.clock.runFor(60000);
    await page.locator("#end-session").click();
    await runUntil(page, async () => mock.byKind("end").length === 1, { label: "einde afgelewer" });
    await page.clock.runFor(5000);
    expectNoLeaks(mock);
    return mock;
  }

  test("6a. Normale sessie: payload-vorms = basislyn, identies", async ({ page, context }) => {
    const mock = await baselineRun(page, context, { practical: false });
    const baseline = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
    expect(collect(mock)).toEqual(baseline.entries);
  });

  test("6b. Praktiese modus: payload-vorms = basislyn sonder warn/lock; geen nuwe soorte of velde", async ({ page, context }) => {
    const mock = await baselineRun(page, context, { practical: true });
    const baseline = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
    const current = collect(mock);
    expect(current.some((e) => e.kind === "warn" || e.kind === "lock")).toBe(false);
    const allowed = new Set(baseline.entries.map((e) => JSON.stringify(e)));
    expect(current.filter((e) => !allowed.has(JSON.stringify(e))), "geen nuwe soorte/velde/kanale").toEqual([]);
    expect(current).toEqual(baseline.entries.filter((e) => e.kind !== "warn" && e.kind !== "lock"));
  });

  /* Realistiese momentopname van ALLE bestaande sleutels (struktuur uit die kode, nie Wallie se data nie) */
  const SEED = {
    wallie911_v2_bok: {
      pin: "2468",
      planDate: "2026-10-08",
      blocks: [],
      completedBlocks: { "2026-10-08-warm": 1791446400000 },
      checklist: { "2026-10-08": { slaap: true } },
      faults: [{ id: "f_1", subjectSlug: "rtt", text: "VLOOKUP absolute verwysing vergeet", at: 1791450000000 }],
      papers: [],
      sessions: [
        {
          id: "s_1791446400000",
          date: "2026-10-08",
          subjectSlug: "rtt",
          task: "Sigblad Vraag 3",
          durationMin: 40,
          actualMin: 40,
          plannedMin: 45,
          startedAt: 1791446400000,
          endedAt: 1791448800000,
          block: null,
          warnings: 1,
          locks: 0,
          memoMin: 5,
          outcome: "voltooi"
        }
      ],
      wallieSurveys: [],
      paSurveys: [],
      bugReports: [],
      pendingSurveySessionId: null,
      live: { status: "off", subject: null, warnings: 0, startedAt: null }
    },
    wallie911_device_id: "d_seedtoestel01",
    wallie911_outbox_v1: {
      queue: [{ id: "end_1_abc", createdAt: 1791449000000, payload: { kind: "end", session_id: "s_ou1", data: { sessionId: "s_ou1" }, client_at: 1791449000000 } }]
    }
  };

  async function snapshotRun(page, context, { practical }) {
    const mock = new MockBackend({ mode: "v1" });
    await mock.attach(context);
    /* Deterministies tussen die twee lopies (sync se tab-id / terugtrek-jitter) */
    await page.addInitScript(() => {
      let s = 7;
      Math.random = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    });
    await boot(page, { seed: SEED });
    /* Gepouseerde klok: tyd skuif net met runFor, dus is tydstempels in albei lopies presies dieselfde */
    await page.clock.pauseAt(new Date(T0.getTime() + 1000));
    await page.goto("/#sessie");
    await page.clock.runFor(30000);
    await page.locator("#session-subject").selectOption("rtt");
    if (practical) expect(await page.evaluate(() => Praktiese.start().ok)).toBe(true);
    for (let i = 0; i < 3; i++) await excursion(page);
    if (practical) expect((await page.evaluate(() => Praktiese.end())).rede_einde).toBe("klaar");
    await page.clock.runFor(30000);
    expectNoLeaks(mock);
    return page.evaluate(() => {
      const out = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        out[k] = localStorage.getItem(k);
      }
      return out;
    });
  }

  test("7. Bestaande sleutels byte-identies ná ’n praktiese blok; wallie911_vraebank_v1 is die enigste nuwe sleutel", async ({ page, context, browser, baseURL }) => {
    /* Tweede, skoon konteks met dieselfde instellings as playwright.config.js */
    const ctxB = await browser.newContext({
      baseURL,
      viewport: { width: 1366, height: 768 },
      locale: "af-ZA",
      timezoneId: "Africa/Johannesburg",
      permissions: ["camera"]
    });
    try {
      const control = await snapshotRun(page, context, { practical: false });
      const prak = await snapshotRun(await ctxB.newPage(), ctxB, { practical: true });

      expect(control[VB_KEY]).toBeUndefined();
      const newKeys = Object.keys(prak).filter((k) => !(k in control));
      expect(newKeys).toEqual([VB_KEY]);
      expect(Object.keys(control).filter((k) => !(k in prak))).toEqual([]);
      /* Sinkronisering se boekhou-sleutels kry ’n tydstempel wanneer die (asinchrone) bediener-antwoord land; dit
         wissel ±1 klok-stap tussen ENIGE twee lopies, ook op master. Net daar word tydstempels ≥ T0 genormaliseer. */
      const SYNC_BOOKKEEPING = ["wallie911_sync_v2", "wallie911_synced_ids_v1", "wallie911_sync_lock"];
      const norm = (v) => v.replace(/\d{13}/g, (n) => (Number(n) >= T0.getTime() ? "<t>" : n));
      for (const k of Object.keys(control)) {
        if (SYNC_BOOKKEEPING.includes(k)) expect(norm(prak[k]), `sleutel ${k} identies (tydstempels genormaliseer)`).toBe(norm(control[k]));
        else expect(prak[k], `sleutel ${k} byte-identies`).toBe(control[k]);
      }
      /* Die saad-sleutels self: bok se saad-sessie en toestel-id onaangeraak */
      expect(prak.wallie911_device_id).toBe(SEED.wallie911_device_id);
      expect(JSON.parse(prak.wallie911_v2_bok).sessions).toEqual(SEED.wallie911_v2_bok.sessions);

      const vb = JSON.parse(prak[VB_KEY]);
      expect(Object.keys(vb).sort()).toEqual(["items", "prakties", "v"]);
      expect(vb.prakties).toHaveLength(1);
      expect(vb.prakties[0]).toMatchObject({ rede_einde: "klaar" });
      expect(vb.prakties[0].afwesig).toHaveLength(3);
    } finally {
      await ctxB.close();
    }
  });
});
