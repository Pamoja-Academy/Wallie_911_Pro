/* Chunk C7: LO is nie meer deel van die app nie. Ou LO-data (localStorage) mag nie ineenstort nie, bly onaangeraak
   in die berging, maar is nêrens sigbaar nie. Plus: die voorblad en Pa-briefing noem LO nie meer nie. */
const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, expectNoLeaks } = require("./helpers");

const ROOT = path.join(__dirname, "..", "..");
const LO_PATROON = /\bLO\b|Lewensori/;
const LO_SIGBAAR = /\blo\b|Lewensori/i;

const OU_SESSIE = {
  id: "ou-lo-sessie",
  subjectSlug: "lo",
  date: "2026-10-09",
  durationMin: 35,
  warnings: 1,
  outcome: "klaar",
  task: "Antwoord-oefening"
};
const OU_FOUT = {
  id: "ou-lo-fout",
  subjectSlug: "lo",
  text: "Antwoord te breed",
  resolved: false,
  dueAt: "2026-10-09T08:00:00.000Z"
};
const OU_BLOK = {
  id: "2026-10-09-geel",
  kind: "geel",
  subjectSlug: "lo",
  minutes: 70,
  title: "Lewensoriëntering — geel-sone",
  detail: "Antwoorde te breed"
};
const OU_BUG = { id: "ou-lo-bug", date: "2026-10-09", tipe: "vreemd", severity: "klein", subjectSlug: "lo", detail: "ou lo-rekord", at: "2026-10-09T07:00:00.000Z" };
const OU_PAPIER = { id: "ou-lo-papier", subjectSlug: "lo", title: "Ou opname", fileName: "ou.pdf" };

/* Realistiese ou plan vir 9 Okt: die volle dagplan soos die app dit bou, met die ou LO-geel-blok in plek van die nuwe RTT V1-blok. */
const vm = require("vm");
const SB = {}; SB.window = SB; vm.createContext(SB);
for (const f of ["assets/js/data.js", "assets/js/schedule.js"]) vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), SB);
const OU_PLAN = SB.WALLIE.buildDayPlan("2026-10-09").blocks.map((b) => (b.id === OU_BLOK.id ? OU_BLOK : b));

test("ou lo-data: app laai sonder foute, niks is sigbaar nie en die gestoorde rekords bly greep-identies", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  const foute = [];
  page.on("pageerror", (e) => foute.push(e.message));
  /* Netwerk-"Failed to load resource" kom van die mock (v1-modus gee 404 vir v2-RPC's en blokkeer ntfy) — nie van LO nie */
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && foute.push(m.text()));

  const seed = {
    wallie911_v2_bok: {
      pin: "9110",
      planDate: "2026-10-09",
      blocks: OU_PLAN,
      completedBlocks: {},
      checklist: {},
      faults: [OU_FOUT],
      papers: [OU_PAPIER],
      sessions: [OU_SESSIE],
      wallieSurveys: [{ id: "ou-lo-svy", date: "2026-10-09", subjectSlug: "lo", sessionId: OU_SESSIE.id, answers: { fokus: 3, metode: "ja", blokkade: "geen", eerlikheid: "ja" } }],
      paSurveys: [],
      bugReports: [OU_BUG],
      pendingSurveySessionId: null,
      live: { status: "off", subject: null, warnings: 0, startedAt: null }
    }
  };
  await boot(page, { seed });

  for (const view of ["missie", "leer", "sessie", "foutbank", "oplaai", "vakke", "pa", "verbeter", "probleem", "docs"]) {
    await page.goto(`/#${view}`);
    await page.clock.runFor(1500);
    const tekst = await page.evaluate(() => document.body.innerText);
    expect(tekst, `${view}: geen LO sigbaar nie`).not.toMatch(LO_SIGBAAR);
    const opsies = await page.evaluate(() => [...document.querySelectorAll("select option")].map((o) => `${o.value}|${o.textContent}`).join("\n"));
    expect(opsies, `${view}: geen LO in keuselyste nie`).not.toMatch(LO_SIGBAAR);
  }

  /* Vandag se gestoorde plan word NIE herskryf nie (Hanno: gestoorde data onaangeraak); die ou blok word net by vertoning versteek. Môre bou die plan normaal met die RTT V1-blok. */
  const blokke = await page.evaluate(() => JSON.parse(localStorage.getItem("wallie911_v2_bok")).blocks);
  expect(blokke).toEqual(OU_PLAN);

  /* Die gestoorde LO-rekords is nie aangeraak nie */
  const gestoor = await page.evaluate(() => JSON.parse(localStorage.getItem("wallie911_v2_bok")));
  expect(gestoor.sessions).toEqual([OU_SESSIE]);
  expect(gestoor.faults).toEqual([OU_FOUT]);
  expect(gestoor.papers).toEqual([OU_PAPIER]);
  expect(gestoor.bugReports).toEqual([OU_BUG]);
  expect(gestoor.wallieSurveys).toHaveLength(1);
  expect(gestoor.wallieSurveys[0].subjectSlug).toBe("lo");

  expect(foute, "geen konsolefoute").toEqual([]);
  expectNoLeaks(mock);
});

test("RTT V1-blok op 10 Okt: die praktiese-modus-knoppie verskyn wanneer die blok begin word", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page, { time: new Date("2026-10-10T09:05:00+02:00") });
  await page.goto("/#missie");
  await page.clock.runFor(1500);
  const blok = page.locator('#block-list .md-card[data-id="2026-10-10-geel"]');
  await expect(blok).toBeVisible();
  await expect(blok).toContainText("praktiese oefening (Oefenvrae)");
  await blok.locator(".start-block").click();
  await page.clock.runFor(1500);
  await expect(page.locator("#session-subject")).toHaveValue("rtt");
  await expect(page.locator("#praktiese-start-row")).toBeVisible();
});

test("index.html en pa-briefing.html noem LO nie", async () => {
  for (const f of ["index.html", "pa-briefing.html", "principal-briefing.html", "principal-briefing-en.html"]) {
    expect(fs.readFileSync(path.join(ROOT, f), "utf8"), f).not.toMatch(LO_PATROON);
  }
});
