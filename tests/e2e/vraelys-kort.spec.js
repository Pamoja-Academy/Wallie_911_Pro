/* Korter ná-sessie-vraelys (v2026-10-17a): "baie herhalende vrae".
   (a) eerste/middel-blok = KORT vorm (fokus + moeilikheid; blokkade net by fokus <= 3 of moeilikheid anders as "reg");
   (b) laaste studieblok van die dag (of ná 16:00 sonder volledige vorm vandag) = volle vorm met al 6 velde;
   (c) "Seker? Dit is eksamenwerk": opsionele papier-minute -> papier_min in die bestaande block-event (Pa se vlag verander nie);
   (d) OU gestoorde surveys (alle ses velde) en kort surveys gaan sonder foute deur Wallie se Verbeter-skerm en Pa se lyste.
   Die plan van 17 Okt 2026 is 'n vaste plan (VASTE_PLANNE): eerste studieblok afr-a2, laaste studieblok merk-wg-v1.
   Alle netwerk onderskep (mock-backend). Laptop 1366x768 en foon 390x844. */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, runUntil, shot, expectNoLeaks } = require("./helpers");

const DAG = "2026-10-17";
const NOU_OG = new Date(`${DAG}T09:00:00+02:00`);
const A2 = `${DAG}-afr-a2`; /* eerste studieblok */
const B4 = `${DAG}-afr-b4`; /* middel-blok */
const LAASTE = `${DAG}-merk-wg-v1`; /* laaste studieblok (die "klaar"-pouse ná dit tel nie) */

const SKERMS = [
  { naam: "laptop", viewport: { width: 1366, height: 768 } },
  { naam: "foon", viewport: { width: 390, height: 844 } }
];

const sigbaar = (page) => page.locator("#wallie-survey-form .survey-q:visible");
const sigbareVelde = (page) => page.$$eval("#wallie-survey-form .survey-q", (els) => els.filter((e) => e.offsetParent !== null).map((e) => e.dataset.field));

/* Begin 'n sessie op 'n vaste-plan-blok, laat dit 1 minuut loop en eindig dit: die survey-modal open */
async function werkEnEindig(page, blockId, slug, minutes) {
  await page.evaluate(([b, s, m]) => WALLIE.app.startSession({ subjectSlug: s, minutes: m, task: "Toets-taak", blockId: b }), [blockId, slug, minutes]);
  await expect(page.locator("#end-session")).toBeEnabled();
  await page.clock.runFor(60000);
  await page.locator("#end-session").click();
  await expect(page.locator("#wallie-survey-modal")).toBeVisible();
}

async function geenOorloop(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), "geen horisontale rol").toBeLessThanOrEqual(1);
}

for (const skerm of SKERMS) {
  test.describe(`vraelys ${skerm.naam} ${skerm.viewport.width}x${skerm.viewport.height}`, () => {
    test.use({ viewport: skerm.viewport });

    test(`(a) eerste blok: net 2 vrae; blokkade verskyn en verdwyn; stoor net die gewysde velde [${skerm.naam}]`, async ({ page, context }) => {
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page, { time: NOU_OG });
      await page.goto("/#missie");
      await werkEnEindig(page, A2, "afrikaans", 100);

      await expect(page.locator("#wallie-survey-kop")).toHaveText("Kort vraelys (2 vrae)");
      await expect(page.locator("#wallie-survey-nota")).toContainText("Afrikaans V3 A2 opstel");
      await expect(page.locator("#wallie-survey-nota")).toContainText("±15 sekondes");
      expect(await sigbareVelde(page)).toEqual(["fokus", "moeilikheid"]);
      await expect(sigbaar(page)).toHaveCount(2);
      await geenOorloop(page);
      await page.screenshot({ path: shot(`vraelys-kort-${skerm.naam}-1-twee-vrae.png`) });

      /* Blokkade: fokus 2 -> verskyn; fokus 5 -> weg; te_swaar -> verskyn; te_maklik -> verskyn; reg -> weg */
      await page.locator('[data-scale="wallie-fokus"][data-val="2"]').click();
      expect(await sigbareVelde(page)).toEqual(["fokus", "moeilikheid", "blokkade"]);
      await page.locator('[data-scale="wallie-fokus"][data-val="5"]').click();
      expect(await sigbareVelde(page)).toEqual(["fokus", "moeilikheid"]);
      await page.locator('input[name="moeilikheid"][value="te_swaar"]').check();
      expect(await sigbareVelde(page)).toEqual(["fokus", "moeilikheid", "blokkade"]);
      await page.locator('input[name="moeilikheid"][value="te_maklik"]').check();
      expect(await sigbareVelde(page)).toEqual(["fokus", "moeilikheid", "blokkade"]);
      await page.locator('input[name="moeilikheid"][value="reg"]').check();
      expect(await sigbareVelde(page)).toEqual(["fokus", "moeilikheid"]);
      await page.locator('[data-scale="wallie-fokus"][data-val="3"]').click();
      expect(await sigbareVelde(page)).toEqual(["fokus", "moeilikheid", "blokkade"]);
      await page.screenshot({ path: shot(`vraelys-kort-${skerm.naam}-2-blokkade.png`) });

      /* 'n Blokkade-antwoord wat weer weggesteek word, word NIE gestoor nie */
      await page.locator('input[name="blokkade"][value="verward"]').check();
      await page.locator('[data-scale="wallie-fokus"][data-val="5"]').click();
      expect(await sigbareVelde(page)).toEqual(["fokus", "moeilikheid"]);

      /* Verborge velde tel nie as "ontbreek" nie en 'n ontbrekende sigbare veld word steeds gevang */
      const dialoë = [];
      page.on("dialog", async (d) => {
        dialoë.push(d.message());
        await d.dismiss();
      });
      await page.locator('input[name="moeilikheid"][value="reg"]').check();
      await page.locator("#wallie-survey-save").click();
      expect(dialoë).toEqual([]);
      await runUntil(page, async () => mock.byKind("survey").length === 1, { label: "survey afgelewer" });
      const p = mock.byKind("survey")[0].body.p;
      expect(p.data.answers).toEqual({ fokus: "5", moeilikheid: "reg" });
      expect(p.body).toBe(["Vak: Afrikaans Huistaal", "Fokus: 5/5", "moeilikheid: reg"].join("\n"));
      const gestoor = await page.evaluate(() => WALLIE.app.state().wallieSurveys[0].answers);
      expect(gestoor).toEqual({ fokus: "5", moeilikheid: "reg" });
      await expect(page.locator("#wallie-survey-modal")).toBeHidden();
      expectNoLeaks(mock);
    });

    test(`(a2) blok ontbreek nog 'n sigbare antwoord: waarskuwing, niks gestoor [${skerm.naam}]`, async ({ page, context }) => {
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page, { time: NOU_OG });
      await page.goto("/#missie");
      await werkEnEindig(page, B4, "afrikaans", 40);
      const dialoë = [];
      page.on("dialog", async (d) => {
        dialoë.push(d.message());
        await d.dismiss();
      });
      await page.locator('[data-scale="wallie-fokus"][data-val="4"]').click();
      await page.locator("#wallie-survey-save").click();
      expect(dialoë).toHaveLength(1);
      expect(dialoë[0]).toContain("Hoe moeilik was die blok?");
      expect(await page.evaluate(() => WALLIE.app.state().wallieSurveys.length)).toBe(0);
      expect(mock.byKind("survey")).toHaveLength(0);
    });

    test(`(b) laaste studieblok: volle vorm met al 6 velde [${skerm.naam}]`, async ({ page, context }) => {
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page, { time: NOU_OG });
      await page.goto("/#missie");
      await werkEnEindig(page, LAASTE, "wiskgelett", 20);

      await expect(page.locator("#wallie-survey-kop")).toHaveText("Dagvraelys (einde van die dag)");
      await expect(page.locator("#wallie-survey-nota")).toContainText("Merk Wisk. Gel. Vraag 3 en 4");
      expect(await sigbareVelde(page)).toEqual(["fokus", "metode", "moeilikheid", "eerlikheid", "help_more"]);
      await page.locator('[data-scale="wallie-fokus"][data-val="2"]').click();
      expect(await sigbareVelde(page)).toEqual(["fokus", "metode", "moeilikheid", "blokkade", "eerlikheid", "help_more"]);
      await geenOorloop(page);
      await page.screenshot({ path: shot(`vraelys-kort-${skerm.naam}-3-dagvraelys.png`) });
      await page.locator('input[name="metode"][value="ja"]').check();
      await page.locator('input[name="moeilikheid"][value="reg"]').check();
      await page.locator('input[name="blokkade"][value="moeg"]').check();
      await page.locator('input[name="eerlikheid"][value="meeste"]').check();
      await page.locator('textarea[name="help_more"]').fill("Meer ou vraestelle asseblief.");
      await page.locator("#wallie-survey-save").click();
      await runUntil(page, async () => mock.byKind("survey").length === 1, { label: "survey afgelewer" });
      const p = mock.byKind("survey")[0].body.p;
      expect(p.data.answers).toEqual({
        fokus: "2",
        metode: "ja",
        moeilikheid: "reg",
        blokkade: "moeg",
        eerlikheid: "meeste",
        help_more: "Meer ou vraestelle asseblief."
      });
      expect(p.body).toBe(
        ["Vak: Wiskundige Geletterdheid", "Fokus: 2/5", "Metode: ja", "Blokkade: moeg", "Eerlikheid: meeste", "Help: Meer ou vraestelle asseblief.", "moeilikheid: reg"].join("\n")
      );
      expectNoLeaks(mock);
    });

    test(`(b2) middel-blok ná 16:00 sonder volledige vorm = volledig; ná 'n volledige vorm vandag weer kort [${skerm.naam}]`, async ({ page, context }) => {
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page, { time: new Date(`${DAG}T16:30:00+02:00`) });
      await page.goto("/#missie");
      await werkEnEindig(page, B4, "afrikaans", 40);
      await expect(page.locator("#wallie-survey-kop")).toHaveText("Dagvraelys (einde van die dag)");
      await page.locator('[data-scale="wallie-fokus"][data-val="5"]').click();
      await page.locator('input[name="metode"][value="nee"]').check();
      await page.locator('input[name="moeilikheid"][value="reg"]').check();
      await page.locator('input[name="eerlikheid"][value="100"]').check();
      await page.locator("#wallie-survey-save").click();
      await expect(page.locator("#wallie-survey-modal")).toBeHidden();
      const eerste = await page.evaluate(() => WALLIE.app.state().wallieSurveys[0].answers);
      expect(Object.keys(eerste).sort()).toEqual(["eerlikheid", "fokus", "help_more", "metode", "moeilikheid"]);

      /* Nog 'n middel-blok ná 16:00: die volledige vorm is vandag reeds gestoor -> kort */
      await werkEnEindig(page, A2, "afrikaans", 100);
      await expect(page.locator("#wallie-survey-kop")).toHaveText("Kort vraelys (2 vrae)");
      expect(await sigbareVelde(page)).toEqual(["fokus", "moeilikheid"]);
    });
  });
}

/* ---------- (c) papier-minute in die "Seker?"-boks ---------- */
for (const skerm of SKERMS) {
  test.describe(`papier-minute ${skerm.naam}`, () => {
    test.use({ viewport: skerm.viewport });

    test(`(c) opsionele papier-minute gaan saam in die block-event; Pa se vlag verander nie [${skerm.naam}]`, async ({ page, context }) => {
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page, { time: NOU_OG });
      await page.goto("/#missie");
      const kaart = (id) => page.locator(`#block-list .md-card[data-id="${id}"]`);
      await expect(kaart(A2)).toBeVisible();

      /* Voor die waarskuwing: geen papier-veld nie */
      await expect(page.locator(".papier-min")).toHaveCount(0);

      /* A2: waarskuwing -> veld verskyn (label gekoppel, 0-600, numeries, >= 44 px) -> 45 -> bevestig */
      await kaart(A2).locator(".mark-done").click();
      await expect(kaart(A2).locator(".vroeg-wenk")).toContainText("Seker? Dit is eksamenwerk");
      const veld = kaart(A2).locator(".papier-min-veld");
      await expect(veld).toBeVisible();
      await expect(kaart(A2).getByLabel("Hoeveel minute het jy op papier gewerk? (opsioneel)")).toHaveCount(1);
      await expect(veld).toHaveAttribute("min", "0");
      await expect(veld).toHaveAttribute("max", "600");
      await expect(veld).toHaveAttribute("inputmode", "numeric");
      expect((await veld.boundingBox()).height).toBeGreaterThanOrEqual(44);
      expect(mock.byKind("block")).toHaveLength(0);
      await page.screenshot({ path: shot(`vraelys-kort-${skerm.naam}-4-papier-minute.png`) });
      await veld.fill("45");
      await kaart(A2).locator(".mark-done").click();
      await runUntil(page, async () => mock.byKind("block").length === 1, { label: "blok A2 afgelewer" });
      let p = mock.byKind("block")[0].body.p;
      expect(p.data).toEqual({ blockId: A2, done: true, vroeg_klaar: "GEEN POGING", minute_gedoen: 0, minute_beplan: expect.any(Number), papier_min: 45 });
      expect(p.body).toContain("(Wallie sê: 45 min op papier)");
      expect(p.title).toBe("BLOK KLAAR GEMERK");

      /* B4: leeg gelaat -> geen papier_min nie */
      await kaart(B4).locator(".mark-done").click();
      await expect(kaart(B4).locator(".papier-min-veld")).toBeVisible();
      await kaart(B4).locator(".mark-done").click();
      await runUntil(page, async () => mock.byKind("block").length === 2, { label: "blok B4 afgelewer" });
      p = mock.byKind("block")[1].body.p;
      expect(p.data).toEqual({ blockId: B4, done: true, vroeg_klaar: "GEEN POGING", minute_gedoen: 0, minute_beplan: expect.any(Number) });
      expect(p.body).not.toContain("Wallie sê");

      /* Ongeldig (buite 0-600) word nie gestuur nie; 0 is geldig */
      await kaart(LAASTE).locator(".mark-done").click();
      await kaart(LAASTE).locator(".papier-min-veld").fill("700");
      await kaart(LAASTE).locator(".mark-done").click();
      await runUntil(page, async () => mock.byKind("block").length === 3, { label: "laaste blok afgelewer" });
      expect(mock.byKind("block")[2].body.p.data).not.toHaveProperty("papier_min");
      const WG = `${DAG}-wg-v1`;
      await kaart(WG).locator(".mark-done").click();
      await kaart(WG).locator(".papier-min-veld").fill("0");
      await kaart(WG).locator(".mark-done").click();
      await runUntil(page, async () => mock.byKind("block").length === 4, { label: "wg-blok afgelewer" });
      expect(mock.byKind("block")[3].body.p.data).toMatchObject({ blockId: WG, vroeg_klaar: "GEEN POGING", papier_min: 0 });
      expectNoLeaks(mock);
    });
  });
}

test("(c2) blok met genoeg werk: geen waarskuwing en dus geen papier-veld nie", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  await boot(page, { time: NOU_OG });
  await page.goto("/#missie");
  await page.evaluate(
    ([id, t]) => {
      const st = WALLIE.app.state();
      st.sessions.unshift({ id: "s_" + id, date: "2026-10-17", subjectSlug: "afrikaans", task: "t", durationMin: 100, actualMin: 100, plannedMin: 100, startedAt: t, endedAt: t + 6000000, warnings: 0, locks: 0, memoMin: 0, outcome: "tyd_klaar", block: { id } });
    },
    [A2, NOU_OG.getTime()]
  );
  await page.locator(`#block-list .md-card[data-id="${A2}"] .mark-done`).click();
  await expect(page.locator(".papier-min")).toHaveCount(0);
  await expect(page.locator(`#block-list .md-card[data-id="${A2}"] .vroeg-wenk`)).toHaveCount(0);
  await runUntil(page, async () => mock.byKind("block").length === 1, { label: "blok afgelewer" });
  expect(mock.byKind("block")[0].body.p.data).toEqual({ blockId: A2, done: true });
});

/* ---------- Pa se kant (regte SQL-nabootsing): P4 + (d) ---------- */
const at = (iso) => Date.parse(iso);
const flat = (t) => t.replace(/\s+/g, " ").trim();
const OU_SURVEY = {
  id: `ws_${at(`${DAG}T07:50:00+02:00`)}`,
  sessionId: "s_ou",
  subjectSlug: "engels",
  date: DAG,
  at: at(`${DAG}T07:50:00+02:00`),
  answers: { fokus: "4", metode: "ja", moeilikheid: "reg", blokkade: "moeg", eerlikheid: "meeste", help_more: "Meer ou vraestelle asseblief." }
};
const KORT_SURVEY = {
  id: `ws_${at(`${DAG}T07:55:00+02:00`)}`,
  sessionId: "s_kort",
  subjectSlug: "rtt",
  date: DAG,
  at: at(`${DAG}T07:55:00+02:00`),
  answers: { fokus: "4", moeilikheid: "reg" }
};
const KORT_SURVEY_B = {
  id: `ws_${at(`${DAG}T07:58:00+02:00`)}`,
  sessionId: "s_kort_b",
  subjectSlug: "afrikaans",
  date: DAG,
  at: at(`${DAG}T07:58:00+02:00`),
  answers: { fokus: "2", moeilikheid: "te_swaar", blokkade: "verward" }
};
const GEEN_ANTWOORDE = {
  id: `ws_${at(`${DAG}T07:59:00+02:00`)}`,
  sessionId: "s_leeg",
  subjectSlug: "engels",
  date: DAG,
  at: at(`${DAG}T07:59:00+02:00`)
};
const sess = (id, slug, startIso, mins) => {
  const start = at(startIso);
  return { id, date: DAG, subjectSlug: slug, task: "Oefening", durationMin: mins, actualMin: mins, plannedMin: mins, startedAt: start, endedAt: start + mins * 60000, warnings: 0, locks: 0, memoMin: 0, outcome: "tyd_klaar" };
};

test("(d) ou en kort surveys: Verbeter-skerm, Pa se lyste (pa-afstand + pa-konsole) en terugvul sonder foute of 'undefined'", async ({ page, context }) => {
  const mock = await new MockBackend({ mode: "full" }).init();
  const nou = new Date(`${DAG}T09:00:00+02:00`);
  mock._pageNow = nou.getTime();
  mock.nowFn = () => mock._pageNow;
  const sync = async () => (mock._pageNow = await page.evaluate(() => Date.now()));
  await mock.attach(context);
  const fouteWallie = [];
  page.on("pageerror", (e) => fouteWallie.push(e.message));
  await boot(page, {
    time: nou,
    seed: {
      wallie911_v2_bok: {
        sessions: [sess("s_ou", "engels", `${DAG}T07:00:00+02:00`, 45), sess("s_kort", "rtt", `${DAG}T07:30:00+02:00`, 20), sess("s_kort_b", "afrikaans", `${DAG}T07:40:00+02:00`, 15)],
        wallieSurveys: [OU_SURVEY, KORT_SURVEY, KORT_SURVEY_B, GEEN_ANTWOORDE],
        paSurveys: [],
        bugReports: []
      }
    }
  });
  await page.goto("/#missie");
  await sync();
  /* Wallie se eie Verbeter-skerm: ou survey onveranderd; kort surveys met "—" */
  await page.goto("/#verbeter");
  await page.evaluate(() => (location.hash = "#verbeter"));
  await expect(page.locator("#view-verbeter")).toBeVisible();
  const raw = flat(await page.locator("#verbeter-raw").innerText());
  expect(raw).toContain("Wallie Engels EAT: fokus 4/5 · metode ja · blokkade moeg · eerlikheid meeste · “Meer ou vraestelle asseblief.”");
  expect(raw).toContain("fokus 4/5 · metode — · blokkade — · eerlikheid —");
  expect(raw).toContain("fokus 2/5 · metode — · blokkade verward · eerlikheid —");
  expect(raw).toContain("fokus — · metode — · blokkade — · eerlikheid —");
  const verbeter = await page.locator("#view-verbeter").innerText();
  expect(verbeter).not.toMatch(/undefined|NaN|\bnull\b/);

  /* Terugvul na die (PGlite) bediener */
  await runUntil(page, async () => (await sync(), (await mock.sql("select count(*)::int n from wallie911.events where kind = 'survey'"))[0].n >= 4), { label: "surveys terugvul" });
  await runUntil(page, async () => (await sync(), (await mock.sql("select count(*)::int n from wallie911.plan"))[0].n >= 1), { label: "rooster ontvang" });

  const pa = await context.newPage();
  const fouteSkerm = [];
  pa.on("pageerror", (e) => fouteSkerm.push(e.message));
  await pa.clock.install({ time: await page.evaluate(() => Date.now()) });
  await pa.setViewportSize({ width: 900, height: 1300 });
  await pa.goto("/pa-afstand.html");
  await pa.locator("#login-pass").fill("toets-wagwoord");
  await pa.locator("#login-form button").first().click();
  await expect(pa.locator("#feedback .fb").first()).toBeVisible({ timeout: 20000 });
  const fb = flat(await pa.locator("#feedback").innerText());
  /* Ou survey woordeliks, al ses velde */
  expect(fb).toContain("Fokus: 4/5 Metode: ja Blokkade: moeg Eerlikheid: meeste Help: Meer ou vraestelle asseblief. moeilikheid: reg");
  /* Kort surveys */
  expect(fb).toContain("Fokus: 4/5 moeilikheid: reg");
  expect(fb).toContain("Fokus: 2/5 Blokkade: verward moeilikheid: te_swaar");
  expect(fb).not.toMatch(/undefined|NaN|\bnull\b/);
  const reports = flat(await pa.locator("#reports").innerText());
  expect(reports).not.toMatch(/undefined|NaN|\bnull\b/);

  /* pa-konsole.html (v2) laai dieselfde data sonder foute */
  const pk = await context.newPage();
  const fouteKonsole = [];
  pk.on("pageerror", (e) => fouteKonsole.push(e.message));
  await pk.clock.install({ time: await page.evaluate(() => Date.now()) });
  await pk.setViewportSize({ width: 1280, height: 900 });
  await pk.goto("/pa-konsole.html");
  /* Die token van pa-afstand.html (selfde oorsprong) kan reeds geldig wees */
  if (await pk.locator("#login-view").isVisible()) {
    await pk.locator("#login-pass").fill("toets-wagwoord");
    await pk.locator("#login-form button").click();
  }
  await expect(pk.locator("#console-view")).toBeVisible();
  await pk.clock.runFor(5000);
  const konsole = await pk.locator("body").innerText();
  expect(konsole).not.toMatch(/undefined|NaN|\bnull\b/);

  expect(fouteWallie).toEqual([]);
  expect(fouteSkerm).toEqual([]);
  expect(fouteKonsole).toEqual([]);
  expectNoLeaks(mock);
});

test("(P4) papier-minute: Pa se vlag bly, en die gebeure-lys wys '(Wallie sê: N min op papier)'", async ({ page, context }) => {
  const mock = await new MockBackend({ mode: "full" }).init();
  const nou = new Date(`${DAG}T09:00:00+02:00`);
  mock._pageNow = nou.getTime();
  mock.nowFn = () => mock._pageNow;
  const sync = async () => (mock._pageNow = await page.evaluate(() => Date.now()));
  await mock.attach(context);
  await boot(page, { time: nou });
  await page.goto("/#missie");
  await sync();
  await runUntil(page, async () => (await sync(), (await mock.sql("select count(*)::int n from wallie911.plan"))[0].n >= 1), { label: "rooster ontvang" });
  const knoppie = page.locator(`#block-list .md-card[data-id="${A2}"] .mark-done`);
  await knoppie.click();
  await page.locator(`#block-list .md-card[data-id="${A2}"] .papier-min-veld`).fill("45");
  await knoppie.click();
  await runUntil(page, async () => (await sync(), (await mock.sql("select count(*)::int n from wallie911.events where kind = 'block'"))[0].n >= 1), { label: "block-event in db" });
  const ev = (await mock.sql("select data, body from wallie911.events where kind = 'block'"))[0];
  expect(ev.data.papier_min).toBe(45);

  const pa = await context.newPage();
  await pa.clock.install({ time: await page.evaluate(() => Date.now()) });
  await pa.setViewportSize({ width: 900, height: 1300 });
  await pa.goto("/pa-afstand.html");
  await pa.locator("#login-pass").fill("toets-wagwoord");
  await pa.locator("#login-form button").first().click();
  /* Die vlag word steeds uit die gemete minute afgelei (GEEN POGING), nie uit Wallie se self-gerapporteerde papier-minute nie */
  await expect(pa.locator(`#blocks .vlag[data-vlag="GEEN POGING"]`).first()).toBeVisible({ timeout: 20000 });
  await expect(pa.locator("#reports")).toContainText("(Wallie sê: 45 min op papier)");
  expect(flat(await pa.locator("#blocks").innerText())).not.toContain("Wallie sê");
  expectNoLeaks(mock);
});
