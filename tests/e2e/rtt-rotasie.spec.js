/* RTT-werk sonder herhaling + die egte DBE-vraestelle op die sessieskerm (klok vals: 8–12 Okt 2026).
   Die foute wat hierdie toetse vasvat (en wat op master faal):
     1. Die eerste RTT-blok van ELKE dag het konsep [0] gewys — Wallie het 10 en 11 Okt dieselfde kaart gekry.
     2. "RTT V1 — volledig getimed (DBE Junie 2026 V1)" was net teks: geen vraestel, geen datalêers, geen memo.
     3. Die praktiese blok het ná die sessie bly loop en die volgende taak met die kaal merk oorskryf.
   Alle netwerk word onderskep (mock-backend): geen versoek na education.gov.za of enige bediener. */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, runUntil, expectNoLeaks } = require("./helpers");

const MERK = "Praktiese blok: RTT V1";
const HIST = "wallie911_rtt_history";
const BOK = "wallie911_v2_bok";
const VB = "wallie911_vraebank_v1";
const DAE = ["2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12"];
const tyd = (dag, hm = "09:05") => new Date(`${dag}T${hm}:00+02:00`);

/* Die RTT-kaarte van ’n dag, in rooster-orde: hooftaak + watter les-kaart gewys word. */
async function rttKaarte(page) {
  return page.locator("#block-list .md-card").evaluateAll((els) =>
    els
      .map((el) => {
        const knop = el.querySelector(".start-block");
        return {
          id: el.dataset.id,
          slug: knop ? knop.dataset.slug : "",
          taak: knop ? decodeURIComponent(knop.dataset.title || "") : "",
          konsep: knop ? knop.dataset.concept || "" : "",
          teks: el.innerText
        };
      })
      .filter((k) => k.slug === "rtt")
  );
}

async function dagOpen(context, dag, { eerste = null, hm = "09:05" } = {}) {
  const p = eerste || (await context.newPage());
  await boot(p, { time: tyd(dag, hm) });
  await p.goto("/#missie");
  await p.clock.runFor(1500);
  return p;
}

test("1. opeenvolgende RTT-blokke wys nooit dieselfde werk of dieselfde les-kaart nie (8–12 Okt)", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);

  const alles = [];
  const eersteVanDag = [];
  for (const dag of DAE) {
    const p = await dagOpen(context, dag, { eerste: dag === DAE[0] ? page : null });
    const kaarte = (await rttKaarte(p)).map((k) => ({ ...k, dag }));
    expect(kaarte.length, `${dag}: RTT-blokke op die skerm`).toBeGreaterThan(0);
    eersteVanDag.push(kaarte[0]);
    alles.push(...kaarte);
    if (p !== page) await p.close();
  }

  /* (a) Twee RTT-blokke langs mekaar — ook oor ’n dag-grens — is nooit dieselfde werk of dieselfde kaart nie. */
  for (let i = 1; i < alles.length; i++) {
    const a = alles[i - 1];
    const b = alles[i];
    expect(b.taak, `${b.dag}/${b.id} se taak = ${a.dag}/${a.id} se taak`).not.toBe(a.taak);
    expect(b.konsep, `${b.dag}/${b.id} se les-kaart = ${a.dag}/${a.id} se les-kaart`).not.toBe(a.konsep);
  }

  /* (b) Die eerste blok van ’n nuwe dag herhaal nooit gister se eerste les-kaart nie (die 10/11 Okt-fout). */
  for (let i = 1; i < eersteVanDag.length; i++) {
    expect(eersteVanDag[i].konsep, `${eersteVanDag[i].dag}: eerste les-kaart = ${eersteVanDag[i - 1].dag} se eerste kaart`).not.toBe(
      eersteVanDag[i - 1].konsep
    );
  }

  /* (c) Geen enkele hooftaak kom twee keer voor oor die vyf dae nie. */
  const take = alles.map((k) => k.taak);
  const dubbel = take.filter((t, i) => take.indexOf(t) !== i);
  expect(dubbel, "geen herhaalde hooftaak").toEqual([]);

  expectNoLeaks(mock);
});

test("2. elke getimede DBE-blok het werk wat na die katalogus wys (vraestel, data en memo)", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  for (const dag of ["2026-10-11", "2026-10-12"]) {
    const p = await dagOpen(context, dag, { eerste: dag === "2026-10-11" ? page : null });
    const uitslag = await p.evaluate((d) => {
      const blocks = WALLIE.buildDayPlan(d).blocks;
      const patroon = /volledig getimed|DBE\s+\S+\s+20\d\d/;
      const moetWerkHê = blocks
        .filter((b) => b.subjectSlug === "rtt" && patroon.test(b.title))
        .map((b) => ({ id: b.id, titel: b.title, hetWerk: !!(b.werk && b.werk.id) }));
      const metWerk = blocks
        .filter((b) => b.werk)
        .map((b) => {
          const sk = WALLIE.DBE.skakels(b.werk);
          return { id: b.id, sk: sk ? [sk.vraestel, sk.data, sk.memo] : null, titel: sk ? sk.titel : null };
        });
      return { moetWerkHê, metWerk, aantal: blocks.filter((b) => b.werk).length };
    }, dag);
    for (const b of uitslag.moetWerkHê) expect(b.hetWerk, `${b.id}: "${b.titel}" moet ’n vraestel hê`).toBe(true);
    expect(uitslag.aantal, `${dag}: blokke met werk`).toBeGreaterThan(5);
    for (const b of uitslag.metWerk) {
      expect(b.sk, `${b.id}: werk wys na ’n katalogus-vraestel`).not.toBeNull();
      expect(b.titel, `${b.id}: vraestel het ’n naam`).toBeTruthy();
      for (const url of b.sk) expect(url, `${b.id}: amptelike https-skakel`).toMatch(/^https:\/\/(www\.education\.gov\.za|education\.gov\.za|wcedeportal\.westerncape\.gov\.za)\//);
      expect(new Set(b.sk).size, `${b.id}: drie verskillende skakels`).toBe(3);
    }
    if (p !== page) await p.close();
  }
  expectNoLeaks(mock);
});

test("3. So 11 Okt: eerste toets-blok wys drie knoppies, memo bly toe tot die tyd om is; merk-blok se memo is oop", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page, { time: tyd("2026-10-11", "11:00") });
  await page.goto("/#missie");
  await page.clock.runFor(1500);

  const kat = await page.evaluate(() => WALLIE.DBE.KATALOGUS["dbe-2025-jun-v1"]);
  const blok = page.locator('#block-list .md-card[data-id="2026-10-11-diagnose"]');
  await expect(blok).toBeVisible();
  await blok.locator(".start-block").click();
  await runUntil(page, async () => mock.byKind("start").length === 1, { label: "sessie begin" });

  const paneel = page.locator("#session-werk");
  await expect(paneel).toBeVisible();
  const hoof = paneel.locator(".werk-hoof");
  await expect(hoof.locator('[data-werk="vraestel"]')).toHaveText("Vraestel (PDF)");
  await expect(hoof.locator('[data-werk="vraestel"]')).toHaveAttribute("href", kat.vraestel);
  await expect(hoof.locator('[data-werk="data"]')).toHaveText("Datalêers");
  await expect(hoof.locator('[data-werk="data"]')).toHaveAttribute("href", kat.data);
  /* Albei maak in ’n nuwe oortjie oop */
  await expect(hoof.locator('[data-werk="vraestel"]')).toHaveAttribute("target", "_blank");
  await expect(hoof.locator('[data-werk="data"]')).toHaveAttribute("target", "_blank");

  /* Watter vrae en hoeveel punte */
  await expect(paneel).toContainText("V6.1");
  await expect(paneel).toContainText("V5.1");
  await expect(paneel).toContainText("18 punte");
  await expect(paneel).toContainText("Wagwoordbeskermde .exe");

  /* Memo bly toe terwyl die tyd loop */
  const memo = hoof.locator('[data-werk="memo"]');
  await expect(memo).toBeDisabled();
  await expect(memo).not.toHaveAttribute("href", /./);
  await expect(paneel).toContainText("Memo sluit oop wanneer die tyd verstreke is");

  /* Die les staan oop langs die vraestel — nie toegevou nie (sien tests/e2e/les-terug.spec.js) */
  await expect(page.locator("#session-lesson .session-lesson-img")).toBeVisible();
  await expect(page.locator("#session-lesson .next-cues > li").first()).toBeVisible();
  await expect(page.locator("#session-lesson details")).toHaveCount(0);

  /* 20 min verby → die sessie eindig en die memo sluit oop */
  await page.clock.fastForward(20 * 60 * 1000 + 2000);
  await page.clock.runFor(2000);
  await runUntil(page, async () => mock.byKind("end").length === 1, { label: "sessie klaar" });
  await expect(memo).toBeEnabled();
  await expect(memo).toHaveAttribute("href", kat.memo);
  await expect(memo).toHaveAttribute("target", "_blank");

  /* ’n Merk-blok: die memo is dadelik oop */
  await page.evaluate(() => {
    document.querySelector("#wallie-survey-modal").classList.add("hidden");
    WALLIE.app.showView("missie");
  });
  await page.clock.runFor(1500);
  const merkBlok = page.locator('#block-list .md-card[data-id="2026-10-11-merk-diagnose"]');
  await merkBlok.locator(".start-block").click();
  await runUntil(page, async () => mock.byKind("start").length === 2, { label: "merk-sessie begin" });
  const merkMemo = page.locator("#session-werk .werk-hoof [data-werk='memo']");
  await expect(merkMemo).toBeEnabled();
  await expect(merkMemo).toHaveAttribute("href", kat.memo);
  await expect(page.locator("#session-werk")).not.toContainText("Memo sluit oop");
  expectNoLeaks(mock);
});

test("4. ’n herbegin wys nooit net die kaal merk 'Praktiese blok: RTT V1' nie", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page, { time: tyd("2026-10-11", "11:00") });
  await page.goto("/#missie");
  await page.clock.runFor(1500);

  await page.locator('#block-list .md-card[data-id="2026-10-11-diagnose"] .start-block').click();
  await runUntil(page, async () => mock.byKind("start").length === 1, { label: "sessie 1 begin" });
  expect(await page.evaluate(() => Praktiese.start().ok)).toBe(true);
  /* Die merk sê nou ook WATTER werk dit is */
  await expect(page.locator("#session-task")).toHaveValue(`${MERK} · dbe-2025-jun-v1 V6.1, V5.1`);

  /* Sessie klaar → die praktiese blok is ook klaar (dit het voorheen bly loop) */
  await page.locator("#end-session").click();
  await runUntil(page, async () => mock.byKind("end").length === 1, { label: "sessie 1 klaar" });
  expect(await page.evaluate(() => Praktiese.active())).toBe(false);
  const rec = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).prakties, VB);
  expect(rec).toHaveLength(1);
  expect(rec[0].rede_einde).toBe("klaar");

  /* Volgende blok begin: die taak is die nuwe werk, nie die kaal merk nie */
  await page.evaluate(() => {
    document.querySelector("#wallie-survey-modal").classList.add("hidden");
    WALLIE.app.showView("missie");
  });
  await page.clock.runFor(1500);
  await page.locator('#block-list .md-card[data-id="2026-10-11-jun-v5"] .start-block').click();
  await runUntil(page, async () => mock.byKind("start").length === 2, { label: "sessie 2 begin" });
  const taak = await page.locator("#session-task").inputValue();
  expect(taak).not.toBe(MERK);
  expect(taak).toContain("Jun 2026 V5 Databasis");
  expect(taak).toContain("DBE Mei/Junie 2026 V1");
  expect(mock.byKind("start")[1].body.p.task).toBe(taak);
  expectNoLeaks(mock);
});

/* Realistiese momentopname van Wallie se gestoorde data (struktuur uit die kode, nie sy egte inhoud nie). */
function saad(planDate, blocks) {
  return {
    [BOK]: {
      pin: "9110",
      planDate,
      blocks,
      completedBlocks: { "2026-10-11-geel": 1791700000000 },
      checklist: { "2026-10-11": { slaap: true } },
      faults: [{ id: "f_1", subjectSlug: "rtt", text: "VLOOKUP absolute verwysing vergeet", createdAt: 1791700000000, dueAt: 1791700000000, resolved: false }],
      papers: [],
      sessions: [
        {
          id: "s_1791690000000",
          date: "2026-10-11",
          subjectSlug: "rtt",
          task: "RTT V1 — volledig getimed · Sigblad-funksies wat altyd kom",
          durationMin: 40,
          actualMin: 40,
          plannedMin: 45,
          startedAt: 1791690000000,
          endedAt: 1791692400000,
          block: null,
          warnings: 1,
          locks: 0,
          memoMin: 5,
          outcome: "voltooi"
        }
      ],
      wallieSurveys: [{ id: "svy_1", date: "2026-10-11", subjectSlug: "rtt", sessionId: "s_1791690000000", answers: { fokus: 3, metode: "ja", blokkade: "te maklik", eerlikheid: "ja" } }],
      paSurveys: [],
      bugReports: [],
      pendingSurveySessionId: null,
      lessonProgress: { "rtt:sigblad-funksies": { status: "reg", at: 1791692000000, tries: 1 } },
      live: { status: "off", subject: null, warnings: 0, startedAt: null }
    },
    [VB]: { v: 1, items: { "rtt-v1-S01": { pogings: [{ t: "2026-10-11T07:00:00.000Z", uitslag: "reg" }] } }, prakties: [] },
    wallie911_device_id: "d_seedtoestel01"
  };
}

const sleutels = (page) =>
  page.evaluate(() => {
    const uit = {};
    for (let i = 0; i < localStorage.length; i++) uit[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
    return uit;
  });

test("5a. ’n dag waarvan die plan nie verander het nie: wallie911_v2_bok bly greep-identies", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  const plan = await (async () => {
    const vm = require("vm");
    const fs = require("fs");
    const path = require("path");
    const SB = {};
    SB.window = SB;
    vm.createContext(SB);
    for (const f of ["assets/js/data.js", "assets/js/schedule.js"]) {
      vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "..", f), "utf8"), SB);
    }
    return SB.WALLIE.buildDayPlan("2026-10-09").blocks;
  })();
  const seed = saad("2026-10-09", plan);
  const voor = JSON.stringify(seed[BOK]);
  await boot(page, { time: tyd("2026-10-09"), seed });
  for (const view of ["missie", "sessie", "leer", "vakke", "foutbank"]) {
    await page.goto(`/#${view}`);
    await page.clock.runFor(1500);
  }
  const na = await sleutels(page);
  expect(na[BOK], "wallie911_v2_bok onaangeraak").toBe(voor);
  expect(na[VB], "wallie911_vraebank_v1 onaangeraak").toBe(JSON.stringify(seed[VB]));
  expect(na.wallie911_device_id).toBe(seed.wallie911_device_id);
  expect(na[HIST], "die nuwe sleutel bestaan").toBeTruthy();
  expectNoLeaks(mock);
});

test("5b. So 11 Okt: die nuwe plan kom deur, maar elke gestoorde rekord bly greep-identies", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  /* Die ou (teks-only) plan van 11 Okt soos dit in Wallie se berging gelê het */
  const ouPlan = [
    { id: "2026-10-11-geel", kind: "rooi", subjectSlug: "rtt", minutes: 180, start: "09:00", end: "12:00", title: "RTT V1 — volledig getimed (DBE Junie 2026 V1, met datalêers)", detail: "Eksamentoestande." },
    { id: "2026-10-11-middag", kind: "break", subjectSlug: "break", minutes: 60, start: "12:00", end: "13:00", title: "Middagete en rus", detail: "Weg van die skerm." }
  ];
  const seed = saad("2026-10-11", ouPlan);
  const voor = seed[BOK];
  await boot(page, { time: tyd("2026-10-11", "11:00"), seed });
  await page.goto("/#missie");
  await page.clock.runFor(1500);

  const na = await sleutels(page);
  const bok = JSON.parse(na[BOK]);
  /* Elke rekord-veld greep-identies */
  for (const veld of ["pin", "completedBlocks", "checklist", "faults", "papers", "sessions", "wallieSurveys", "paSurveys", "bugReports", "lessonProgress", "pendingSurveySessionId", "live"]) {
    expect(JSON.stringify(bok[veld]), `${veld} onaangeraak`).toBe(JSON.stringify(voor[veld]));
  }
  expect(na[VB], "wallie911_vraebank_v1 onaangeraak").toBe(JSON.stringify(seed[VB]));
  /* Die nuwe plan is wel in plek (anders sien Wallie vandag nog gister se weergawe van vandag) */
  expect(bok.planDate).toBe("2026-10-11");
  expect(bok.blocks.length).toBeGreaterThan(20);
  expect(bok.blocks.some((b) => b.werk && b.werk.id === "dbe-2026-jun-v1")).toBe(true);
  /* Net een nuwe sleutel */
  const nuwe = Object.keys(na).filter((k) => !(k in seed) && !/^wallie911_(sync|synced|outbox|remote|device)/.test(k));
  expect(nuwe).toEqual([HIST]);
  expectNoLeaks(mock);
});

test("6. So 11 en Ma 12 Okt: elke werk-blok wys sy vrae en punte; geen vrae-stel twee keer nie", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  for (const dag of ["2026-10-11", "2026-10-12"]) {
    const p = await dagOpen(context, dag, { eerste: dag === "2026-10-11" ? page : null });
    await p.goto("/#sessie");
    await p.clock.runFor(500);
    const uit = await p.evaluate(() => {
      const st = WALLIE.app.state();
      const el = document.querySelector("#session-werk");
      return st.blocks
        .filter((b) => b.werk)
        .map((b) => {
          WALLIE.lessonUI.renderSessionWerk(b.id);
          const sk = WALLIE.DBE.skakels(b.werk);
          const knop = (naam) => {
            const a = el.querySelector(`.werk-hoof [data-werk="${naam}"]`);
            return a ? a.getAttribute("href") : null;
          };
          return {
            id: b.id,
            soort: b.soort,
            sleutel: `${b.werk.tipe}:${b.werk.id}:${(b.werk.nrs || []).join(",")}`,
            teks: el.innerText,
            labels: WALLIE.DBE.vraagLabels(b.werk),
            punte: WALLIE.DBE.punte(b.werk, b),
            vraestel: knop("vraestel"),
            data: knop("data"),
            memo: knop("memo"),
            verwag: { vraestel: sk.vraestel, data: sk.data, memo: sk.memo }
          };
        });
    });
    expect(uit.length, `${dag}: blokke met werk`).toBeGreaterThan(5);
    for (const b of uit) {
      expect(b.vraestel, `${b.id}: vraestel-skakel`).toBe(b.verwag.vraestel);
      expect(b.data, `${b.id}: data-skakel`).toBe(b.verwag.data);
      if (b.soort === "toets") expect(b.memo, `${b.id}: memo bly toe tydens ’n toets`).toBeNull();
      else expect(b.memo, `${b.id}: memo-skakel`).toBe(b.verwag.memo);
      for (const lbl of b.labels) expect(b.teks, `${b.id}: wys ${lbl}`).toContain(lbl);
      if (b.punte != null) expect(b.teks, `${b.id}: wys die punte`).toContain(`${b.punte} punte`);
    }
    /* Geen toets-blok herhaal ’n ander toets-blok se vrae nie; merk/herdoen dóén dieselfde werk weer. */
    const toetse = uit.filter((b) => b.soort === "toets").map((b) => b.sleutel);
    expect(toetse.filter((s, i) => toetse.indexOf(s) !== i), `${dag}: geen herhaalde vrae-stel`).toEqual([]);
    if (p !== page) await p.close();
  }
  expectNoLeaks(mock);
});

test("7. drie herlaaie verander niks: elke blok hou sy les-kaart en sy werk", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page, { time: tyd("2026-10-11", "11:00") });
  await page.goto("/#missie");
  await page.clock.runFor(1500);

  const eerste = await rttKaarte(page);
  expect(eerste.length).toBeGreaterThan(10);
  expect(eerste.every((k) => k.konsep), "elke kaart het ’n les-kaart").toBe(true);

  for (let i = 1; i <= 3; i++) {
    await page.reload();
    await page.clock.runFor(1500);
    const nou = await rttKaarte(page);
    expect(nou.map((k) => `${k.id}|${k.konsep}|${k.taak}`), `herlaai ${i}: dieselfde kaarte en werk`).toEqual(
      eerste.map((k) => `${k.id}|${k.konsep}|${k.taak}`)
    );
  }

  /* Ook die sessieskerm se les is dieselfde kaart as die blok se kaart. */
  const blok = eerste.find((k) => k.id === "2026-10-11-diagnose");
  await page.locator('#block-list .md-card[data-id="2026-10-11-diagnose"] .start-block').click();
  await runUntil(page, async () => mock.byKind("start").length === 1, { label: "sessie begin" });
  await expect(page.locator("#session-lesson .session-lesson-img")).toHaveAttribute("data-concept", blok.konsep);
  expectNoLeaks(mock);
});
