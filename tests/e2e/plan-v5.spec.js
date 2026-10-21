/* Plan v5 (15-26 Okt): vaste dagplanne vir Do 15 (Engels V3-eksamendag) tot Di 20 Okt (Afrikaans HT V3-eksamendag),
   en die vervolg Wo 21 / Do 22 Okt (Wisk. Gel. V1 is Vr 23 Okt). Geen Gasvryheid/Toerisme/RTT-rotasie nie. Elke studieblok se hooftaak is 'n eksamenvlak-item (`item`)
   of eie eksamenwerk, nooit sy agtergrond-les-kaart nie. Klok vals; alle netwerk onderskep (mock-backend). */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, runUntil, hideTab, showTab, expectNoLeaks } = require("./helpers");

const VERBODE = ["gasvryheid", "toerisme", "rtt"];

const VIEWPORTS = [
  { name: "laptop", label: "1366x768", viewport: { width: 1366, height: 768 } },
  { name: "foon", label: "390x844", viewport: { width: 390, height: 844 } }
];

/* [suffix, start, end, item?]  (item = die eksamenvlak-item wat die hooftaak moet wees) */
const DAE = [
  {
    dag: "2026-10-15",
    tyd: "2026-10-15T07:20:00+02:00",
    blokke: [
      ["opstaan", "06:45", "07:15"],
      ["formaat", "07:15", "07:35"],
      ["tas", "07:35", "08:00"],
      ["eksamen", "09:00", "11:30"],
      ["rus", "11:30", "13:30"],
      ["terugskou", "13:30", "13:50"],
      ["pouse1", "13:50", "14:00"],
      ["afr-b1", "14:00", "14:40", "afr-v3-B1"],
      ["merk-afr-b1", "14:40", "15:00"],
      ["pouse2", "15:00", "15:15"],
      ["afr-b2", "15:15", "15:55", "afr-v3-B2"],
      ["merk-afr-b2", "15:55", "16:15"],
      ["klaar", "16:15", "16:15"]
    ]
  },
  {
    dag: "2026-10-16",
    tyd: "2026-10-16T08:05:00+02:00",
    blokke: [
      ["opstaan", "07:30", "08:00"],
      ["afr-a1", "08:00", "09:40", "afr-v3-A1"],
      ["pouse1", "09:40", "10:00"],
      ["merk-afr-a1", "10:00", "10:30"],
      ["afr-b3", "10:30", "11:10", "afr-v3-B3"],
      ["merk-afr-b3", "11:10", "11:30"],
      ["middag", "11:30", "12:30"],
      ["wg-v1", "12:30", "13:45"],
      ["merk-wg-v1", "13:45", "14:05"],
      ["klaar", "14:05", "14:05"]
    ]
  },
  {
    dag: "2026-10-17",
    tyd: "2026-10-17T08:35:00+02:00",
    blokke: [
      ["opstaan", "08:00", "08:30"],
      ["afr-a2", "08:30", "10:10", "afr-v3-A2"],
      ["pouse1", "10:10", "10:30"],
      ["merk-afr-a2", "10:30", "11:00"],
      ["afr-b4", "11:00", "11:40", "afr-v3-B4"],
      ["merk-afr-b4", "11:40", "12:00"],
      ["middag", "12:00", "13:00"],
      ["wg-v1", "13:00", "14:10"],
      ["merk-wg-v1", "14:10", "14:30"],
      ["klaar", "14:30", "14:30"]
    ]
  },
  {
    dag: "2026-10-18",
    tyd: "2026-10-18T08:50:00+02:00",
    blokke: [
      ["opstaan", "08:00", "08:45"],
      ["afr-b5", "08:45", "09:25", "afr-v3-B5"],
      ["merk-afr-b5", "09:25", "09:45"],
      ["pouse1", "09:45", "10:00"],
      ["foutlog", "10:00", "10:30"],
      ["middag", "10:30", "13:00"],
      ["wg-v1", "13:00", "13:40"],
      ["merk-wg-v1", "13:40", "14:00"],
      ["pouse2", "14:00", "14:20"],
      ["afr-a-nov25", "14:20", "16:00"],
      ["merk-afr-a-nov25", "16:00", "16:30"],
      ["klaar", "16:30", "16:30"]
    ]
  },
  {
    dag: "2026-10-19",
    tyd: "2026-10-19T08:05:00+02:00",
    blokke: [
      ["opstaan", "07:30", "08:00"],
      ["keuse-b", "08:00", "08:20"],
      ["afr-b-1", "08:20", "09:00"],
      ["pouse1", "09:00", "09:15"],
      ["afr-b-2", "09:15", "09:55"],
      ["pouse2", "09:55", "10:15"],
      ["merk-b", "10:15", "10:55"],
      ["foutlog", "10:55", "11:25"],
      ["middag", "11:25", "12:15"],
      ["afr-a-2", "12:15", "13:55"],
      ["pouse3", "13:55", "14:10"],
      ["merk-a-2", "14:10", "14:40"],
      ["formaat", "14:40", "15:10"],
      ["tas", "15:10", "15:40"],
      ["klaar", "15:40", "15:40"]
    ]
  },
  {
    dag: "2026-10-20",
    tyd: "2026-10-20T07:20:00+02:00",
    blokke: [
      ["opstaan", "06:45", "07:15"],
      ["formaat", "07:15", "07:35"],
      ["tas", "07:35", "08:00"],
      ["eksamen", "09:00", "12:00"],
      ["rus", "12:00", "14:00"],
      ["terugskou", "14:00", "14:20"],
      ["pouse1", "14:20", "14:30"],
      ["wg-v1", "14:30", "15:45"],
      ["merk-wg-v1", "15:45", "16:05"],
      ["klaar", "16:05", "16:05"]
    ]
  },
  {
    dag: "2026-10-21",
    tyd: "2026-10-21T07:50:00+02:00",
    blokke: [
      ["opstaan", "07:30", "08:00"],
      ["wg-v1-proef", "08:00", "11:00"],
      ["middag", "11:00", "12:00"],
      ["merk-wg-v1-proef", "12:00", "13:00"],
      ["pouse1", "13:00", "13:15"],
      ["foutlog", "13:15", "13:45"],
      ["klaar", "13:45", "13:45"]
    ]
  },
  {
    dag: "2026-10-22",
    tyd: "2026-10-22T07:50:00+02:00",
    blokke: [
      ["opstaan", "07:30", "08:00"],
      ["wg-v1", "08:00", "09:15"],
      ["merk-wg-v1", "09:15", "09:35"],
      ["pouse1", "09:35", "09:55"],
      ["formules", "09:55", "10:25"],
      ["tas", "10:25", "10:45"],
      ["klaar", "10:45", "10:45"]
    ]
  },
  {
    dag: "2026-10-23",
    tyd: "2026-10-23T07:20:00+02:00",
    blokke: [
      ["opstaan", "06:45", "07:15"],
      ["formules", "07:15", "07:35"],
      ["tas", "07:35", "08:00"],
      ["eksamen", "09:00", "12:00"],
      ["rus", "12:00", "14:00"],
      ["terugskou", "14:00", "14:20"],
      ["pouse1", "14:20", "14:30"],
      ["wg-v2", "14:30", "15:45"],
      ["merk-wg-v2", "15:45", "16:05"],
      ["klaar", "16:05", "16:05"]
    ]
  },
  {
    dag: "2026-10-24",
    tyd: "2026-10-24T08:10:00+02:00",
    blokke: [
      ["opstaan", "08:00", "08:30"],
      ["wg-v2", "08:30", "09:45"],
      ["merk-wg-v2", "09:45", "10:05"],
      ["pouse1", "10:05", "10:25"],
      ["wg-v2-5", "10:25", "11:05"],
      ["merk-wg-v2-5", "11:05", "11:25"],
      ["middag", "11:25", "12:30"],
      ["foutlog", "12:30", "13:00"],
      ["klaar", "13:00", "13:00"]
    ]
  },
  {
    dag: "2026-10-25",
    tyd: "2026-10-25T08:40:00+02:00",
    blokke: [
      ["opstaan", "08:30", "09:00"],
      ["formules", "09:00", "09:40"],
      ["pouse1", "09:40", "10:00"],
      ["foutlog", "10:00", "10:40"],
      ["middag", "10:40", "13:00"],
      ["tas", "13:00", "13:20"],
      ["klaar", "13:20", "13:20"]
    ]
  },
  {
    dag: "2026-10-26",
    tyd: "2026-10-26T07:20:00+02:00",
    blokke: [
      ["opstaan", "06:45", "07:15"],
      ["formules", "07:15", "07:35"],
      ["tas", "07:35", "08:00"],
      ["eksamen", "09:00", "12:00"],
      ["rus", "12:00", "14:00"],
      ["terugskou", "14:00", "14:20"],
      ["klaar", "14:20", "14:20"]
    ]
  }
];

async function openPlan(page, context, iso) {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page, { time: new Date(iso) });
  await page.goto("/#missie");
  await page.clock.runFor(1500);
  return mock;
}

const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

/* Elke studie-kaart (nie pouse nie): hooftaak, hooftaak-soort en die agtergrond-les. */
async function kaarte(page) {
  return page.locator("#block-list .md-card:not(.kind-break)").evaluateAll((els) =>
    els.map((el) => ({
      id: el.dataset.id,
      hoof: el.querySelector(".md-hoof") ? el.querySelector(".md-hoof").textContent : "",
      hoofSoort: el.querySelector(".md-hoof") ? el.querySelector(".md-hoof").dataset.soort : "",
      les: el.querySelector(".md-concept") ? el.querySelector(".md-concept").textContent : ""
    }))
  );
}

for (const vp of VIEWPORTS) {
  test.describe(`plan v5 @ ${vp.label}`, () => {
    test.use({ viewport: vp.viewport });

    for (const { dag, tyd, blokke } of DAE) {
      test(`${dag}: verwagte blokke en tye, hooftaak is eksamenwerk, items maak die regte item oop`, async ({ page, context }) => {
        const mock = await openPlan(page, context, tyd);

        /* Geen Gasvryheid/Toerisme/RTT-blokke nie, en presies die verwagte blokke in volgorde */
        const state = await page.evaluate(() =>
          WALLIE.app.state().blocks.map((b) => ({ id: b.id, slug: b.subjectSlug, start: b.start, end: b.end, item: b.item || null, werk: Boolean(b.werk) }))
        );
        for (const s of VERBODE) expect(state.map((b) => b.slug), `${dag}: geen ${s}`).not.toContain(s);
        expect(state.map((b) => b.id)).toEqual(blokke.map(([suffix]) => `${dag}-${suffix}`));
        const lys = await page.locator("#block-list").innerText();
        expect(lys).not.toMatch(/Gasvryheid|Toerisme|RTT \(CAT\)/);

        /* Elke blok se id en tye is op die Missie-skerm */
        for (const [suffix, start, end, item] of blokke) {
          const kaart = page.locator(`#block-list .md-card[data-id="${dag}-${suffix}"]`);
          await expect(kaart, `${dag}-${suffix} op die skerm`).toHaveCount(1);
          await expect(kaart.locator(".md-time")).toHaveText(`${start}–${end}`);
          const b = state.find((x) => x.id === `${dag}-${suffix}`);
          expect(b.item, `${dag}-${suffix}: item`).toBe(item || null);
        }

        /* Hooftaak is eksamenwerk, nooit die agtergrond-les nie */
        const lyst = await kaarte(page);
        expect(lyst.length, `${dag}: studie-kaarte`).toBeGreaterThan(0);
        for (const k of lyst) {
          expect(k.les, `${k.id}: les gemerk as agtergrond`).toContain("Agtergrond (opsioneel)");
          const titel = k.les.replace("Agtergrond (opsioneel)", "").trim();
          expect(titel.length, `${k.id}: konseptitel`).toBeGreaterThan(3);
          expect(k.hoof, `${k.id}: hooftaak gewys`).toContain("Hooftaak");
          expect(k.hoof, `${k.id}: hooftaak is nie die agtergrondkaart nie`).not.toContain(titel);
          const item = blokke.find(([suffix]) => `${dag}-${suffix}` === k.id)[3];
          /* 'n Blok met 'n DBE-vraestel (werk, sedert 21 Okt ook Wisk. Gel.) se hooftaak is daardie vraestel */
          const metWerk = state.find((x) => x.id === k.id).werk;
          expect(k.hoofSoort, `${k.id}: hooftaak-soort`).toBe(item ? "item" : metWerk ? "werk" : "blok");
        }

        /* Blokke met 'n item: "Maak item oop" open die regte item in Skryfwerk */
        for (const [suffix, , , item] of blokke.filter((b) => b[3])) {
          const kaart = page.locator(`#block-list .md-card[data-id="${dag}-${suffix}"]`);
          const knoppie = kaart.locator(".open-item");
          await expect(knoppie, `${suffix}: Maak item oop`).toHaveText("Maak item oop");
          await expect(knoppie).toHaveAttribute("data-item", item);
          await knoppie.scrollIntoViewIfNeeded();
          await knoppie.click();
          await page.clock.runFor(500);
          await expect(page.locator("#view-skryfwerk")).toHaveClass(/active/);
          await expect(page.locator(".sw-titel"), `${suffix}: regte item oop`).toContainText(item.replace(/^afr-v3-/, ""));
          await page.evaluate(() => WALLIE.app.showView("missie"));
          await page.clock.runFor(500);
        }

        expect(await noOverflow(page), `${dag}: geen horisontale oorloop nie`).toBe(true);
        expectNoLeaks(mock);
      });
    }

    test("16 Okt 08:05: 'Maak item oop' op die Volgende-kaart open die regte item (F1)", async ({ page, context }) => {
      const mock = await openPlan(page, context, "2026-10-16T08:05:00+02:00");
      const knoppie = page.locator("#next-up .open-item");
      await expect(knoppie).toHaveCount(1);
      await expect(knoppie).toHaveAttribute("data-item", "afr-v3-A1");
      await knoppie.scrollIntoViewIfNeeded();
      await knoppie.click();
      await page.clock.runFor(500);
      await expect(page.locator("#view-skryfwerk")).toHaveClass(/active/);
      await expect(page.locator(".sw-titel")).toContainText("A1");
      expectNoLeaks(mock);
    });

    test("F8: 'n gestoorde plan van vandag sonder `item` word vervang (item is deel van die plan-handtekening)", async ({ page, context }) => {
      const mock = await openPlan(page, context, "2026-10-16T08:05:00+02:00");
      const voor = await page.evaluate(() => WALLIE.app.state().blocks.find((b) => b.id === "2026-10-16-afr-a1").item);
      expect(voor).toBe("afr-v3-A1");
      /* Ou berging: dieselfde blokke en tye, maar sonder `item` */
      await page.evaluate(() => {
        const st = WALLIE.app.state();
        st.blocks.forEach((b) => delete b.item);
        WALLIE.app.persist();
      });
      const stoor = await page.evaluate(() => JSON.parse(localStorage.getItem("wallie911_v2_bok")).blocks.some((b) => b.item));
      expect(stoor).toBe(false);
      await page.reload();
      await page.clock.runFor(1500);
      const na = await page.evaluate(() => WALLIE.app.state().blocks.find((b) => b.id === "2026-10-16-afr-a1").item);
      expect(na).toBe("afr-v3-A1");
      expectNoLeaks(mock);
    });

    test("20 Okt 07:20: Afrikaans V3-eksamendag - formaat-blok is voor-eksamen, eksamen 09:00-12:00 is 'n pouse", async ({ page, context }) => {
      const mock = await openPlan(page, context, "2026-10-20T07:20:00+02:00");
      const formaat = page.locator('#block-list .md-card[data-id="2026-10-20-formaat"]');
      await expect(formaat.locator(".md-hoof")).toHaveAttribute("data-soort", "blok");
      await expect(formaat.locator(".md-hoof")).toContainText("Laaste kyk: formaat van transaksionele tekste");
      await expect(formaat.locator(".open-item")).toHaveCount(0);
      const eksamen = page.locator('#block-list .md-card[data-id="2026-10-20-eksamen"]');
      await expect(eksamen).toHaveClass(/kind-break/);
      await expect(eksamen).toContainText("AFRIKAANS HT V3-EKSAMEN (skool) 09:00-12:00");
      await expect(page.locator("#next-up .next-hoof")).toContainText("Laaste kyk: formaat van transaksionele tekste");
      expect(await noOverflow(page)).toBe(true);
      expectNoLeaks(mock);
    });

    for (const [dag, naam] of [["2026-10-23", "V1"], ["2026-10-26", "V2"]]) {
      test(`${dag} 07:20: Wisk. Gel. ${naam}-eksamendag - formules is voor-eksamen, eksamen 09:00-12:00 is 'n pouse (geen oortjie-slot-probleme)`, async ({ page, context }) => {
        const mock = await openPlan(page, context, `${dag}T07:20:00+02:00`);
        const formules = page.locator(`#block-list .md-card[data-id="${dag}-formules"]`);
        await expect(formules.locator(".md-hoof")).toHaveAttribute("data-soort", "blok");
        await expect(formules.locator(".md-hoof")).toContainText("Laaste kyk: formuleblad en eenhede");
        await expect(formules.locator(".open-item")).toHaveCount(0);
        const eksamen = page.locator(`#block-list .md-card[data-id="${dag}-eksamen"]`);
        await expect(eksamen).toHaveClass(/kind-break/);
        await expect(eksamen).toContainText(`WISK. GEL. ${naam}-EKSAMEN (skool) 09:00-12:00`);
        await expect(page.locator("#next-up .next-hoof")).toContainText("Laaste kyk: formuleblad en eenhede");
        /* 'n eksamen-blok (break) gee geen waarskuwing of slot nie */
        expect(mock.byKind("warn")).toHaveLength(0);
        expect(mock.byKind("lock")).toHaveLength(0);
        await expect(page.locator("#lock-box")).toBeHidden();
        expect(await noOverflow(page)).toBe(true);
        expectNoLeaks(mock);
      });
    }

    test("21 Okt: Wisk. Gel. V1 proefeksamen (150 punte, 3 uur) is 'n skrif-blok met sy eie hooftaak en sonder 'n item", async ({ page, context }) => {
      const mock = await openPlan(page, context, "2026-10-21T07:50:00+02:00");
      const proef = page.locator('#block-list .md-card[data-id="2026-10-21-wg-v1-proef"]');
      await expect(proef).toContainText("Wisk. Gel. V1 proefeksamen");
      await expect(proef).toContainText("150 punte, 3 uur");
      /* Die hooftaak is die regte DBE-vraestel (21 Okt: nie meer "Pa gee" nie) */
      await expect(proef.locator(".md-hoof")).toHaveAttribute("data-soort", "werk");
      await expect(proef.locator(".md-hoof")).toContainText("DBE Mei/Junie 2026 V1, volledige vraestel");
      await expect(proef).not.toContainText("Pa gee");
      await expect(proef.locator(".open-item")).toHaveCount(0);
      const b = await page.evaluate(() => WALLIE.app.state().blocks.find((x) => x.id === "2026-10-21-wg-v1-proef"));
      expect(b).toMatchObject({ soort: "skrif", kind: "groen", subjectSlug: "wiskgelett", minutes: 180, werk: { tipe: "vraestel", id: "dbe-2026-jun-wg-v1" } });
      expect(await noOverflow(page)).toBe(true);
      expectNoLeaks(mock);
    });

    test("21 Okt 08:05: die proefeksamen is 'n skrif-blok en die oortjie-slot vuur nie (soos 14 Okt)", async ({ page, context }) => {
      const mock = await openPlan(page, context, "2026-10-21T08:05:00+02:00");
      const blok = page.locator('#block-list .md-card[data-id="2026-10-21-wg-v1-proef"]');
      await expect(blok).toBeVisible();
      await blok.locator(".start-block").click();
      await runUntil(page, async () => mock.byKind("start").length === 1, { label: "proef begin" });
      await expect(page.locator("#session-subject")).toHaveValue("wiskgelett");
      /* Verby die 8 s begin-grasie, dan drie tab-weg — 'n gewone toets sou nou sluit */
      await page.clock.runFor(10000);
      for (let i = 0; i < 3; i++) {
        await hideTab(page);
        await page.clock.runFor(20000);
        await showTab(page);
        await page.clock.runFor(5000);
      }
      expect(mock.byKind("warn")).toHaveLength(0);
      expect(mock.byKind("lock")).toHaveLength(0);
      await expect(page.locator("#lock-box")).toBeHidden();
      await expect(page.locator("#warn-display")).toHaveText("Waarskuwings: 0 / 3");
      expectNoLeaks(mock);
    });

    test("22 Okt 08:05: Wallie kry die DBE Nov 2025 V1-vraestel self in die app; PDF-oortjie gee geen waarskuwing; memo eers ná die tyd", async ({ page, context }) => {
      const mock = await openPlan(page, context, "2026-10-22T08:05:00+02:00");
      const kat = await page.evaluate(() => WALLIE.DBE.KATALOGUS["dbe-2025-nov-wg-v1"]);
      const blok = page.locator('#block-list .md-card[data-id="2026-10-22-wg-v1"]');
      await expect(blok).toBeVisible();
      await expect(blok).not.toContainText("Pa gee");
      await expect(blok.locator(".md-hoof")).toContainText("DBE November 2025 V1, Vraag 1 en 2");
      /* Geen herhaling van die vraestel se naam in die hooftaak nie (AGENTS §2.8) */
      await expect(blok.locator(".md-hoof")).not.toContainText("(Afr)");
      const soort = await page.evaluate(() => WALLIE.app.state().blocks.find((x) => x.id === "2026-10-22-wg-v1").soort);
      expect(soort).toBe("skrif");
      await blok.locator(".start-block").click();
      await runUntil(page, async () => mock.byKind("start").length === 1, { label: "skrif begin" });

      /* Die vraestel-paneel: amptelike vraestel en antwoordeboek, geen RTT-datalêers nie */
      const paneel = page.locator("#session-werk");
      await expect(paneel).toBeVisible();
      const hoof = paneel.locator(".werk-hoof");
      await expect(hoof.locator('[data-werk="vraestel"]')).toHaveText("Vraestel (PDF)");
      await expect(hoof.locator('[data-werk="vraestel"]')).toHaveAttribute("href", kat.vraestel);
      await expect(hoof.locator('[data-werk="antwoordeboek"]')).toHaveText("Antwoordeboek (PDF)");
      await expect(hoof.locator('[data-werk="antwoordeboek"]')).toHaveAttribute("href", kat.antwoordeboek);
      await expect(hoof.locator('[data-werk="data"]')).toHaveCount(0);
      await expect(paneel).not.toContainText("Wagwoordbeskermde .exe");
      /* By Wisk. Gel. is "V1" Vraestel 1: die vrae staan voluit */
      await expect(paneel.locator(".werk-vrae")).toHaveText("Doen: Vraag 1 (30) · Vraag 2 (32) — 62 punte");

      /* Memo toe terwyl die tyd loop */
      const memo = hoof.locator('[data-werk="memo"]');
      await expect(memo).toHaveAttribute("aria-disabled", "true");
      await expect(memo).not.toHaveAttribute("href", /./);
      await expect(paneel).toContainText("Memo sluit oop wanneer die tyd verstreke is");

      /* Hy lees die PDF in 'n ander oortjie: geen waarskuwing of slot nie */
      await page.clock.runFor(10000);
      for (let i = 0; i < 3; i++) {
        await hideTab(page);
        await page.clock.runFor(20000);
        await showTab(page);
        await page.clock.runFor(5000);
      }
      expect(mock.byKind("warn")).toHaveLength(0);
      expect(mock.byKind("lock")).toHaveLength(0);
      await expect(page.locator("#lock-box")).toBeHidden();

      /* 75 min verby: die sessie eindig en die memo sluit oop */
      await page.clock.fastForward(75 * 60 * 1000 + 2000);
      await page.clock.runFor(2000);
      await runUntil(page, async () => mock.byKind("end").length === 1, { label: "skrif klaar" });
      await expect(memo).not.toHaveAttribute("aria-disabled", "true");
      await expect(memo).toHaveAttribute("href", kat.memo);
      expectNoLeaks(mock);
    });

    test("22 Okt 09:20: die merk-blok het die DBE-memo dadelik oop", async ({ page, context }) => {
      const mock = await openPlan(page, context, "2026-10-22T09:20:00+02:00");
      const kat = await page.evaluate(() => WALLIE.DBE.KATALOGUS["dbe-2025-nov-wg-v1"]);
      const merk = page.locator('#block-list .md-card[data-id="2026-10-22-merk-wg-v1"]');
      await expect(merk).toContainText("DBE-memo (November 2025 V1)");
      await merk.locator(".start-block").click();
      await runUntil(page, async () => mock.byKind("start").length === 1, { label: "merk begin" });
      const memo = page.locator("#session-werk .werk-hoof [data-werk='memo']");
      await expect(memo).toHaveAttribute("href", kat.memo);
      await expect(page.locator("#session-werk")).not.toContainText("Memo sluit oop");
      expectNoLeaks(mock);
    });

    test("22 Okt 10:30: tas pak is 'n voor-eksamen-blok en kry nooit 'n waarskuwing nie", async ({ page, context }) => {
      /* blok-gebeure word net in modus v2 afgelewer */
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page, { time: new Date("2026-10-22T10:30:00+02:00") });
      await page.goto("/#missie");
      await page.clock.runFor(1500);
      const tas = page.locator('#block-list .md-card[data-id="2026-10-22-tas"]');
      await expect(tas).toContainText("Kontrolelys en tas pak vir môre");
      await tas.locator(".mark-done").click();
      await expect(page.locator('#block-list .md-card[data-id="2026-10-22-tas"] .vroeg-wenk')).toHaveCount(0);
      await runUntil(page, async () => mock.byKind("block").length === 1, { label: "blok afgelewer" });
      expect(mock.byKind("block")[0].body.p.data).toEqual({ blockId: "2026-10-22-tas", done: true });
      expectNoLeaks(mock);
    });

    test("15 Okt 07:20: die formaat-blok se hooftaak is sy eie titel", async ({ page, context }) => {
      const mock = await openPlan(page, context, "2026-10-15T07:20:00+02:00");
      const kaart = page.locator('#block-list .md-card[data-id="2026-10-15-formaat"]');
      await expect(kaart).toBeVisible();
      await expect(kaart.locator(".md-hoof")).toHaveAttribute("data-soort", "blok");
      await expect(kaart.locator(".md-hoof")).toContainText("Laaste kyk: formaatkaarte (net lees, geen nuwe werk)");
      await expect(kaart.locator(".open-item")).toHaveCount(0);
      /* Die volgende blok op die tuisskerm is dieselfde formaat-blok, met dieselfde hooftaak */
      await expect(page.locator("#next-up .next-hoof")).toHaveAttribute("data-soort", "blok");
      await expect(page.locator("#next-up .next-hoof")).toContainText("Laaste kyk: formaatkaarte");
      expect(await noOverflow(page)).toBe(true);
      expectNoLeaks(mock);
    });
  });
}
