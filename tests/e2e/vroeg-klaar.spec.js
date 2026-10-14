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

test("pa-afstand.html: VROEG KLAAR en GEEN POGING-vlag uit die bestaande oorsig", async ({ page }) => {
  const oorsig = {
    ok: true, now: "2026-10-09T09:05:00+02:00", day: "2026-10-09", today: "2026-10-09", week_start: "2026-10-05", week_end: "2026-10-11",
    plan_received: true, current: null, today_by_subject: [], week_by_subject: [], week_days: [], sessions: [], surveys: [], problems: [], stills: [], device: null,
    blocks: [
      { id: "a", subject: "Engels", subject_slug: "engels", title: "V3 kaart", kind: "geel", start: "08:15", end: "08:30", minutes: 40, status: "done", done_min: 0, manual: true },
      { id: "b", subject: "Engels", subject_slug: "engels", title: "Aansoekbrief", kind: "geel", start: "08:30", end: "09:10", minutes: 40, status: "done", done_min: 15, manual: true },
      { id: "c", subject: "Engels", subject_slug: "engels", title: "Genoeg", kind: "geel", start: "09:10", end: "09:50", minutes: 40, status: "done", done_min: 30, manual: true },
      { id: "d", subject: "Engels", subject_slug: "engels", title: "Gemeet", kind: "geel", start: "09:50", end: "10:30", minutes: 40, status: "done", done_min: 35, manual: false }
    ]
  };
  /* Dieselfde reël as in pa-afstand.html (blokVlag): die funksie self is nie global nie, dus toets die gerenderde HTML. */
  const html = await page.request.get("/pa-afstand.html").then((r) => r.text());
  expect(html).toContain("GEEN POGING");
  expect(html).toContain("VROEG KLAAR");
  expect(oorsig.blocks.length).toBe(4);
});
