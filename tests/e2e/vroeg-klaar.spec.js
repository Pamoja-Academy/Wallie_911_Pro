/* PR 3: Wallie kry 'n "Seker? Dit is eksamenwerk"-waarskuwing as hy 'n blok te vroeg klaar merk, en Pa sien 'n vlag
   (pa-afstand.html) uit die BESTAANDE oorsig-data. Alle netwerk onderskep (mock-backend). */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, runUntil, expectNoLeaks } = require("./helpers");

const NOU = new Date("2026-10-09T09:05:00+02:00");

test("blok sonder sessie: waarskuwing, tweede klik bevestig, pouse-blok word nie gewaarsku nie", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  await boot(page, { time: NOU });
  await page.goto("/#missie");
  const studie = page.locator("#block-list .md-card:not(.kind-break) .mark-done").first();
  const id = await studie.getAttribute("data-id");
  await studie.click();
  const wenk = page.locator(`#block-list .md-card[data-id="${id}"] .vroeg-wenk`);
  await expect(wenk).toContainText("Seker? Dit is eksamenwerk");
  await expect(wenk).toContainText("nog nie 'n sessie");
  await expect(studie).toHaveText("Seker? Klaar");
  expect(await page.evaluate((i) => WALLIE.app.state().completedBlocks[i] || null, id), "nog nie klaar gemerk nie").toBeNull();
  expect(mock.byKind("block")).toHaveLength(0);
  await studie.click();
  await runUntil(page, async () => mock.byKind("block").length === 1, { label: "blok afgelewer" });
  const p = mock.byKind("block")[0].body.p;
  expect(p.data).toMatchObject({ blockId: id, done: true, vroeg_klaar: "GEEN POGING", minute_gedoen: 0 });
  expectNoLeaks(mock);
});

test("blok met genoeg werk is sonder waarskuwing klaar; te min werk waarsku", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  const at = NOU.getTime();
  await boot(page, { time: NOU });
  await page.goto("/#missie");
  const kaarte = page.locator("#block-list .md-card:not(.kind-break)");
  const a = await kaarte.nth(0).locator(".mark-done").getAttribute("data-id");
  const b = await kaarte.nth(1).locator(".mark-done").getAttribute("data-id");
  const minA = await page.evaluate((i) => WALLIE.app.state().blocks.find((x) => x.id === i).minutes, a);
  const minB = await page.evaluate((i) => WALLIE.app.state().blocks.find((x) => x.id === i).minutes, b);
  await page.evaluate(
    ([ia, ma, ib, mb, t]) => {
      const st = WALLIE.app.state();
      const mk = (id, slug, min) => ({ id: "s_" + id, date: "2026-10-09", subjectSlug: slug, task: "t", durationMin: min, actualMin: min, plannedMin: min, startedAt: t, endedAt: t + min * 60000, warnings: 0, locks: 0, memoMin: 0, outcome: "tyd_klaar", block: { id } });
      const blA = st.blocks.find((x) => x.id === ia);
      const blB = st.blocks.find((x) => x.id === ib);
      st.sessions.unshift(mk(ia, blA.subjectSlug, Math.ceil(ma * 0.7)), mk(ib, blB.subjectSlug, Math.floor(mb * 0.3)));
    },
    [a, minA, b, minB, at]
  );
  /* A: 70% gedoen → direk klaar */
  await kaarte.nth(0).locator(".mark-done").click();
  await expect(page.locator(`#block-list .md-card[data-id="${a}"] .vroeg-wenk`)).toHaveCount(0);
  await runUntil(page, async () => mock.byKind("block").length === 1, { label: "blok A afgelewer" });
  expect(mock.byKind("block")[0].body.p.data).toEqual({ blockId: a, done: true });
  /* B: 30% gedoen → waarsku */
  await page.locator(`#block-list .md-card[data-id="${b}"] .mark-done`).click();
  await expect(page.locator(`#block-list .md-card[data-id="${b}"] .vroeg-wenk`)).toContainText("minder as 60%");
  expectNoLeaks(mock);
});

test("F5: vandag se poging op die blok se item tel as werk (70 van 100 min), gister s'n nie", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  const poging = (t, min) => ({ t, uitslag: "reg", minute_gebruik: min });
  await boot(page, {
    time: new Date("2026-10-16T08:05:00+02:00"),
    seed: {
      wallie911_vraebank_v1: {
        v: 1,
        prakties: [],
        items: { "afr-v3-A1": { pogings: [poging("2026-10-15T09:00:00.000Z", 95), poging("2026-10-16T05:00:00.000Z", 70)] } }
      }
    }
  });
  await page.goto("/#missie");
  const knoppie = page.locator('#block-list .md-card[data-id="2026-10-16-afr-a1"] .mark-done');
  await knoppie.click();
  await expect(page.locator('#block-list .md-card[data-id="2026-10-16-afr-a1"] .vroeg-wenk')).toHaveCount(0);
  await runUntil(page, async () => mock.byKind("block").length === 1, { label: "blok afgelewer" });
  expect(mock.byKind("block")[0].body.p.data).toEqual({ blockId: "2026-10-16-afr-a1", done: true });
  /* Die ander blok se item (afr-v3-B3) het niks → waarsku */
  const b3 = page.locator('#block-list .md-card[data-id="2026-10-16-afr-b3"] .mark-done');
  await b3.click();
  await expect(page.locator('#block-list .md-card[data-id="2026-10-16-afr-b3"] .vroeg-wenk')).toContainText("Seker?");
  expectNoLeaks(mock);
});

test("F5: gister se poging alleen tel nie (GEEN POGING)", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  await boot(page, {
    time: new Date("2026-10-16T08:05:00+02:00"),
    seed: {
      wallie911_vraebank_v1: { v: 1, prakties: [], items: { "afr-v3-A1": { pogings: [{ t: "2026-10-15T09:00:00.000Z", uitslag: "reg", minute_gebruik: 95 }] } } }
    }
  });
  await page.goto("/#missie");
  await page.locator('#block-list .md-card[data-id="2026-10-16-afr-a1"] .mark-done').click();
  await expect(page.locator('#block-list .md-card[data-id="2026-10-16-afr-a1"] .vroeg-wenk')).toContainText("Seker?");
  expectNoLeaks(mock);
});

test("F5: voor-eksamen-blok (formaat) kry nooit 'n waarskuwing nie", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  await boot(page, { time: new Date("2026-10-15T07:20:00+02:00") });
  await page.goto("/#missie");
  const knoppie = page.locator('#block-list .md-card[data-id="2026-10-15-formaat"] .mark-done');
  await knoppie.click();
  await expect(page.locator('#block-list .md-card[data-id="2026-10-15-formaat"] .vroeg-wenk')).toHaveCount(0);
  await runUntil(page, async () => mock.byKind("block").length === 1, { label: "blok afgelewer" });
  expect(mock.byKind("block")[0].body.p.data).toEqual({ blockId: "2026-10-15-formaat", done: true });
  expectNoLeaks(mock);
});

/* O1: eksamenmodus-werk van vandag tel as werk, ook as "Stoor my punte" nog nie gedruk is nie (geen VraebankStore-poging).
   Blok 2026-10-16-afr-b3 = 40 min, item afr-v3-B3 (40 min). Geen sessie op die blok nie. */
const B3 = "2026-10-16-afr-b3";
async function werkOpB3(page, { papier, minute, klaar }) {
  await page.goto("/#skryfwerk");
  await page.locator('.sw-item[data-id="afr-v3-B3"]').click();
  await page.locator(".em-begin").click();
  if (papier) await page.locator(".em-bevestig input").check();
  await page.clock.fastForward(minute * 60 * 1000);
  await page.clock.runFor(1000);
  if (klaar) await page.locator(".em-klaar").click();
}

test("O1: item sonder sessie, papier-boks, 40 min, Ek is klaar, dan blok klaar: geen waarskuwing, geen vroeg_klaar", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  await boot(page, { time: new Date("2026-10-16T10:30:00+02:00") });
  await werkOpB3(page, { papier: true, minute: 40, klaar: true });
  /* Geen sessie en geen gestoorde poging nie: net die eksamenmodus-rekord */
  const toestand = await page.evaluate(() => ({
    sessies: WALLIE.app.state().sessions.length,
    pogings: (JSON.parse(localStorage.getItem("wallie911_vraebank_v1") || "{}").items || {})["afr-v3-B3"] || null,
    rek: JSON.parse(localStorage.getItem("wallie911_eksamen_v1")).items["afr-v3-B3"]
  }));
  expect(toestand.sessies).toBe(0);
  expect(toestand.pogings).toBeNull();
  expect(toestand.rek.bevestig).toBe(true);
  expect(toestand.rek.klaarMin).toBeGreaterThanOrEqual(40);
  await page.goto("/#missie");
  await page.locator(`#block-list .md-card[data-id="${B3}"] .mark-done`).click();
  await expect(page.locator(`#block-list .md-card[data-id="${B3}"] .vroeg-wenk`)).toHaveCount(0);
  await runUntil(page, async () => mock.byKind("block").length === 1, { label: "blok afgelewer" });
  /* Geen vroeg_klaar nie, maar die eksamenmodus-minute gaan as spoor na Pa (LL-01) */
  const data = mock.byKind("block")[0].body.p.data;
  expect(Object.keys(data).sort()).toEqual(["blockId", "done", "eksamen_min"]);
  expect(data).toMatchObject({ blockId: B3, done: true });
  expect(data.eksamen_min).toBeGreaterThanOrEqual(40);
  expectNoLeaks(mock);
});

test("O1: papier-boks maar net 15 van 40 min (en nog nie klaar nie): steeds VROEG KLAAR (60%-reël bly)", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  await boot(page, { time: new Date("2026-10-16T10:30:00+02:00") });
  await werkOpB3(page, { papier: true, minute: 15, klaar: false });
  await page.goto("/#missie");
  await page.locator(`#block-list .md-card[data-id="${B3}"] .mark-done`).click();
  await expect(page.locator(`#block-list .md-card[data-id="${B3}"] .vroeg-wenk`)).toContainText("15 van 40 min");
  expect(mock.byKind("block")).toHaveLength(0);
  expectNoLeaks(mock);
});

test("O1: klok het geloop maar niks gedoen nie (geen boks, geen teks): steeds waarskuwing", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  await boot(page, { time: new Date("2026-10-16T10:30:00+02:00") });
  await werkOpB3(page, { papier: false, minute: 40, klaar: true });
  await page.goto("/#missie");
  await page.locator(`#block-list .md-card[data-id="${B3}"] .mark-done`).click();
  await expect(page.locator(`#block-list .md-card[data-id="${B3}"] .vroeg-wenk`)).toContainText("Seker?");
  expectNoLeaks(mock);
});

test("O1: gister se eksamenmodus-werk tel nie vir vandag se blok nie", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  const gister = new Date("2026-10-15T09:00:00+02:00").getTime();
  await boot(page, {
    time: new Date("2026-10-16T10:30:00+02:00"),
    seed: { wallie911_eksamen_v1: { v: 1, items: { "afr-v3-B3": { begin: gister, konsep: "gister", bevestig: true, lêer: "", klaarMin: 40 } } } }
  });
  await page.goto("/#missie");
  await page.locator(`#block-list .md-card[data-id="${B3}"] .mark-done`).click();
  await expect(page.locator(`#block-list .md-card[data-id="${B3}"] .vroeg-wenk`)).toContainText("Seker?");
  expectNoLeaks(mock);
});

/* Vaste oorsig (wallie_pa_overview) met 5 blokke: a = klaar gemerk sonder minute, b = 15/40 min, c = 30/40 min,
   d = deur die toestel self gemeet (nie handmatig nie), e = opwarm/voor-eksamen-blok (kind "warm") klaar gemerk sonder
   minute. Net a en b kry 'n vlag; 'n warm-blok kry nooit een nie (O2). */
const OORSIG = {
  ok: true, now: "2026-10-09T09:05:00+02:00", day: "2026-10-09", today: "2026-10-09", week_start: "2026-10-05", week_end: "2026-10-11",
  plan_received: true, current: null, today_by_subject: [], week_by_subject: [], week_days: [], sessions: [], surveys: [], problems: [], stills: [], device: null, events: [],
  blocks: [
    { id: "a", subject: "Engels", subject_slug: "engels", title: "V3 kaart", kind: "geel", start: "08:15", end: "08:30", minutes: 40, status: "done", done_min: 0, manual: true },
    { id: "b", subject: "Engels", subject_slug: "engels", title: "Aansoekbrief", kind: "geel", start: "08:30", end: "09:10", minutes: 40, status: "done", done_min: 15, manual: true },
    { id: "c", subject: "Engels", subject_slug: "engels", title: "Genoeg", kind: "geel", start: "09:10", end: "09:50", minutes: 40, status: "done", done_min: 30, manual: true },
    { id: "d", subject: "Engels", subject_slug: "engels", title: "Gemeet", kind: "geel", start: "09:50", end: "10:30", minutes: 40, status: "done", done_min: 35, manual: false },
    { id: "e", subject: "Engels", subject_slug: "engels", title: "Laaste kyk", kind: "warm", start: "10:30", end: "10:50", minutes: 20, status: "done", done_min: 0, manual: true }
  ]
};

test("pa-afstand.html: werklik gerendeer - GEEN POGING, VROEG KLAAR, en geen vlag by genoeg/gemeet", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  mock.overview = OORSIG;
  await mock.attach(context);
  await page.goto("/pa-afstand.html");
  await page.locator("#login-pass").fill("toets-wagwoord");
  await page.locator("#login-form button").first().click();
  const rye = page.locator("#blocks .blk");
  await expect(rye).toHaveCount(5);
  const vlagTekste = async (i) => rye.nth(i).locator(".vlag").allTextContents();
  expect(await vlagTekste(0), "a: klaar gemerk, 0 min").toEqual(["GEEN POGING"]);
  expect(await vlagTekste(1), "b: 15 van 40 min").toEqual(["VROEG KLAAR"]);
  expect(await vlagTekste(2), "c: 30 van 40 min").toEqual([]);
  expect(await vlagTekste(3), "d: deur die toestel gemeet").toEqual([]);
  expect(await vlagTekste(4), "e: warm-blok (opwarm/voor-eksamen), klaar gemerk sonder minute").toEqual([]);
  await expect(page.locator("#blocks .vlag")).toHaveCount(2);
  await expect(rye.nth(0).locator(".vlag")).toHaveAttribute("data-vlag", "GEEN POGING");
  await expect(rye.nth(1).locator(".vlag")).toHaveAttribute("data-vlag", "VROEG KLAAR");
  expectNoLeaks(mock);
});

test("pa-konsole.html: agenda en rooster-tabel dra dieselfde vlae (GEEN POGING, VROEG KLAAR, geen vlag by c, d en die warm-blok)", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  mock.overview = OORSIG;
  await mock.attach(context);
  await page.goto("/pa-konsole.html");
  await page.locator("#login-pass").fill("toets-wagwoord");
  await page.locator("#login-form button").click();
  await expect(page.locator("#console-view")).toBeVisible();
  const agenda = page.locator("#agenda li");
  await expect(agenda).toHaveCount(5);
  expect(await agenda.nth(0).locator(".vlag").allTextContents(), "a").toEqual(["GEEN POGING"]);
  expect(await agenda.nth(1).locator(".vlag").allTextContents(), "b").toEqual(["VROEG KLAAR"]);
  expect(await agenda.nth(2).locator(".vlag").allTextContents(), "c").toEqual([]);
  expect(await agenda.nth(3).locator(".vlag").allTextContents(), "d").toEqual([]);
  expect(await agenda.nth(4).locator(".vlag").allTextContents(), "e: warm-blok").toEqual([]);
  await expect(page.locator("#agenda .vlag")).toHaveCount(2);
  /* Die rooster-tabel (gantt) het dieselfde vlae */
  await expect(page.locator("#gantt-table .vlag")).toHaveCount(2);
  expectNoLeaks(mock);
});
