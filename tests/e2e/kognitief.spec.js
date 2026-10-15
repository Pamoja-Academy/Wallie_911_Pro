/* Kognitiewe ontwerp K1–K12 (docs/ontwerp/kognitief/SPESIFIKASIE.md): aanvaardingskriteria.
   Klok vals, alle netwerk onderskep (mock-backend). Meet net vertoning; geen gedrag van die hek, vroeg-klaar,
   hooftaak-keuse of proctor nie. */
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { MockBackend } = require("./mock-backend");
const { boot, runUntil, expectNoLeaks } = require("./helpers");

const V3 = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", "vraebank-v3.json"), "utf8"));
const BOK = "wallie911_v2_bok";
const DRAF = "wallie911_eksamen_v1";
const VIEWPORTS = [
  { name: "laptop", viewport: { width: 1366, height: 768 } },
  { name: "foon", viewport: { width: 390, height: 844 } }
];
const OGGEND_15 = ["opstaan", "formaat", "tas", "eksamen", "rus", "terugskou", "pouse1"].map((x) => `2026-10-15-${x}`);
const AKSENT = "rgb(200, 168, 75)";
const GEEL = "rgb(242, 201, 76)";
const GEVAAR = "rgb(232, 93, 76)";

async function open15(page, context) {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  const klaar = Object.fromEntries(OGGEND_15.map((id) => [id, 1792000000000]));
  await boot(page, { time: new Date("2026-10-15T14:05:00+02:00"), seed: { [BOK]: { completedBlocks: klaar } } });
  await page.goto("/#missie");
  await page.clock.runFor(1500);
  return mock;
}

/* Sigbare knoppies binne `binne` met die aksent (primêre) agtergrond */
function primere(page, binne) {
  return page.evaluate((binne) => {
    const sigbaar = (e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden";
    };
    return [...document.querySelectorAll(`${binne} button, ${binne} a.btn`)]
      .filter(sigbaar)
      .filter((e) => getComputedStyle(e).backgroundColor === "rgb(200, 168, 75)")
      .map((e) => e.textContent.trim());
  }, binne);
}

/* WCAG-kontras tussen 'n element se teks en die eerste nie-deursigtige agtergrond daaragter */
function kontras(page, sel) {
  return page.evaluate((sel) => {
    const e = document.querySelector(sel);
    const rgb = (c) => c.match(/[\d.]+/g).map(Number);
    const lin = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    let n = e;
    let bg = null;
    while (n && !bg) {
      const c = rgb(getComputedStyle(n).backgroundColor);
      if (c.length < 4 || c[3] > 0.5) bg = c;
      n = n.parentElement;
    }
    const a = L(rgb(getComputedStyle(e).color));
    const b = L(bg || [6, 26, 15]);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }, sel);
}

/* Karakters per reël: inhoudsbreedte / gemiddelde karakterbreedte van 'n Afrikaanse sin in die element se font */
function kpr(page, sel) {
  return page.evaluate((sel) => {
    const e = document.querySelector(sel);
    const s = getComputedStyle(e);
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
    const sin = "Die vinnige bruin jakkals spring oor die lui hond, en dan weer terug.";
    const w = e.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
    return Math.round(w / (ctx.measureText(sin).width / sin.length));
  }, sel);
}

async function beginSessie(page, mock) {
  await page.locator("#next-up .js-start").click();
  await runUntil(page, async () => mock.byKind("start").length === 1, { label: "sessie begin" });
}

for (const vp of VIEWPORTS) {
  test.describe(`kognitief @ ${vp.name}`, () => {
    test.use({ viewport: vp.viewport });

    test("K3/K9/K12 Missie: Volgende-kaart eerste, een kolom, ≤ 2 primêre knoppies", async ({ page, context }) => {
      const mock = await open15(page, context);
      await page.evaluate(() => window.scrollTo(0, 0));
      const begin = await page.locator("#next-up .js-start").boundingBox();
      expect(begin.y + begin.height, "Begin nou in die eerste skerm").toBeLessThanOrEqual(vp.viewport.height);
      const orde = await page.evaluate(() => ({
        voorHero: !!(document.querySelector("#next-up").compareDocumentPosition(document.querySelector(".md-hero")) & Node.DOCUMENT_POSITION_FOLLOWING),
        voorLys: !!(document.querySelector("#next-up").compareDocumentPosition(document.querySelector("#block-list")) & Node.DOCUMENT_POSITION_FOLLOWING),
        vakToe: !!document.querySelector("#vak-aftel").closest("details:not([open])")
      }));
      expect(orde).toEqual({ voorHero: true, voorLys: true, vakToe: true });
      /* Die les bly sigbaar (les-terug), maar ná die hooftaak */
      await expect(page.locator("#next-up .next-img img")).toBeVisible();
      const hoof = await page.locator("#next-up .next-hoof").boundingBox();
      const prent = await page.locator("#next-up .next-img").boundingBox();
      expect(prent.x > hoof.x || prent.y > hoof.y + hoof.height, "prent ná/langs die hooftaak").toBe(true);
      await expect(page.locator("#view-missie .md-actions .open-lesson:visible")).toHaveCount(0);

      /* Een kolom; hooftaak naby die bokant van elke studiekaart; kompakte pouses; klaar onderaan */
      const lys = await page.evaluate(() => {
        const kaarte = [...document.querySelectorAll("#block-list .md-card")];
        const r = (e) => e.getBoundingClientRect();
        return {
          kolomme: new Set(kaarte.map((c) => Math.round(r(c).left))).size,
          hoof: kaarte.filter((c) => !c.classList.contains("kind-break")).map((c) => r(c.querySelector(".md-hoof")).top - r(c).top),
          pouse: kaarte.filter((c) => c.classList.contains("kind-break")).map((c) => r(c).height),
          oopOnder: Math.max(...kaarte.filter((c) => !c.classList.contains("done")).map((c) => r(c).top)),
          klaarBo: Math.min(...kaarte.filter((c) => c.classList.contains("done")).map((c) => r(c).top)),
          nou: document.querySelector('#block-list .md-card[data-id="2026-10-15-afr-b1"]').classList.contains("is-nou"),
          volgende: [...document.querySelectorAll("#block-list .md-card.is-volgende")].map((c) => c.dataset.id)
        };
      });
      expect(lys.kolomme).toBe(1);
      for (const d of lys.hoof) expect(d).toBeLessThanOrEqual(160);
      for (const h of lys.pouse) expect(h).toBeLessThanOrEqual(vp.name === "laptop" ? 130 : 180);
      expect(lys.oopOnder).toBeLessThan(lys.klaarBo);
      expect(lys.nou).toBe(true);
      expect(lys.volgende).toEqual(["2026-10-15-afr-b1"]);
      const p = await primere(page, "#view-missie");
      expect(p.length, p.join(" | ")).toBeLessThanOrEqual(2);
      expectNoLeaks(mock);
    });

    test("K1/K2 fokusmodus en hooftaak op die sessieskerm", async ({ page, context }) => {
      const mock = await open15(page, context);
      await expect(page.locator("#main-nav > .nav-btn:visible")).toHaveCount(4);
      await beginSessie(page, mock);
      await expect(page.locator("body")).toHaveClass(/fokus-sessie/);
      await expect(page.locator("#main-nav .nav-btn:visible")).toHaveCount(2);
      await expect(page.locator(".nav-more")).toBeHidden();
      await expect(page.locator("#countdown")).toBeHidden();
      await expect(page.locator(".brand")).toBeHidden();
      /* Hooftaak bo-aan met een primêre knoppie; klok in die eerste skerm */
      const hoof = page.locator("#sessie-hooftaak");
      await expect(hoof).toBeVisible();
      await expect(hoof).toContainText("Hooftaak");
      await expect(hoof).toContainText("B1");
      expect(await primere(page, "#view-sessie")).toEqual(["Maak hooftaak oop"]);
      await page.evaluate(() => window.scrollTo(0, 0));
      const klok = await page.locator("#timer-display").boundingBox();
      expect(klok.y + klok.height).toBeLessThanOrEqual(vp.viewport.height);
      await expect(page.locator("#session-subject")).toBeVisible();
      await expect(page.locator("#session-lesson .session-lesson-img img")).toBeVisible();
      /* Na die item: Vorige/Volgende weg tydens die sessie */
      await page.locator(".sessie-hoof-knop").click();
      await page.clock.runFor(500);
      await expect(page.locator("#view-skryfwerk")).toHaveClass(/active/);
      await expect(page.locator(".sw-titel")).toContainText("B1");
      await expect(page.locator(".sw-volgende")).toBeHidden();
      await expect(page.locator(".sw-vorige")).toBeHidden();
      await expect(page.locator(".sw-terug")).toBeVisible();
      /* Einde: alles terug */
      await page.evaluate(() => WALLIE.app.showView("sessie"));
      page.on("dialog", (d) => d.accept());
      await page.locator("#end-session").click();
      await page.clock.runFor(1000);
      await expect(page.locator("body")).not.toHaveClass(/fokus-sessie/);
      await expect(page.locator("#sessie-hooftaak")).toBeHidden();
      expectNoLeaks(mock);
    });

    test("K4/K5/K6 eksamenmodus: taai klok, een primêre knoppie, leesmaat", async ({ page, context }) => {
      const item = V3.find((i) => i.id === "afr-v3-B1");
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page, { time: new Date("2026-10-15T14:05:00+02:00") });
      await page.goto("/#skryfwerk");
      await page.locator(`.sw-item[data-id="${item.id}"]`).click();
      const eerste = await page.evaluate(() => document.querySelector("#skryfwerk-root .sw-detail > .panel").firstElementChild.className);
      expect(eerste).toBe("em-klok-balk");
      /* (a) nog nie begin nie: net Begin */
      expect(await primere(page, "#skryfwerk-root")).toEqual(["Begin (klok loop)"]);
      /* (b) klok loop: net "Ek is klaar" */
      await page.locator(".em-antwoord").fill("een twee drie");
      expect(await primere(page, "#skryfwerk-root")).toEqual(["Ek is klaar"]);
      await expect(page.locator(".em-nog")).toHaveText(/^nog \d+ min$/);
      /* Klok bly sigbaar en bo-op as jy afrol */
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
      const bo = await page.evaluate(() => {
        const t = document.querySelector(".em-tyd").getBoundingClientRect();
        const e = document.elementFromPoint(t.left + t.width / 2, t.top + t.height / 2);
        return t.top >= 0 && t.bottom <= innerHeight && !!(e && e.closest(".em-klok-balk"));
      });
      expect(bo, "klok sigbaar en nie bedek nie").toBe(true);
      /* Leesmaat en lettergrootte */
      const vraag = await page.evaluate(() => {
        const s = getComputedStyle(document.querySelector(".sw-vraag"));
        return { px: parseFloat(s.fontSize), lh: parseFloat(s.lineHeight) / parseFloat(s.fontSize) };
      });
      expect(vraag.px).toBeGreaterThanOrEqual(17);
      expect(vraag.lh).toBeGreaterThanOrEqual(1.5);
      if (vp.name === "laptop") {
        const k = await kpr(page, ".sw-vraag");
        expect(k).toBeGreaterThanOrEqual(55);
        expect(k).toBeLessThanOrEqual(78);
      }
      expect(parseFloat(await page.locator(".em-rede").evaluate((e) => getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16);
      /* (c) genoeg werk + klaar: net "Wys memo"; (d) memo oop: net "Stoor my punte" */
      await page.locator(".em-antwoord").fill(Array.from({ length: item.woorde.min }, (_, i) => "w" + i).join(" "));
      await page.locator(".em-klaar").click();
      expect(await primere(page, "#skryfwerk-root")).toEqual(["Wys memo"]);
      await page.locator(".em-memo-knoppie").click();
      expect(await primere(page, "#skryfwerk-root")).toEqual(["Stoor my punte"]);
      if (vp.name === "laptop") expect(await kpr(page, ".sw-teks")).toBeLessThanOrEqual(78);
      /* K11: punte-insette in een kolom, naby hul kriteria */
      const punte = await page.evaluate(() => {
        const p = document.querySelector(".em-punte").getBoundingClientRect().left;
        return [...document.querySelectorAll(".em-punt-inp")].map((i) => Math.round(i.getBoundingClientRect().left - p));
      });
      expect(new Set(punte).size).toBe(1);
      expect(punte[0]).toBeLessThanOrEqual(480);
      /* Tyd om: geel, nie gevaar-rooi nie */
      await page.clock.fastForward((item.tyd_min + 1) * 60 * 1000);
      await page.clock.runFor(1500);
      await expect(page.locator(".em-klok-balk")).toHaveClass(/em-verby/);
      expect(await page.locator(".em-tyd").evaluate((e) => getComputedStyle(e).color)).toBe(GEEL);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expectNoLeaks(mock);
    });

    test("K7/K8/K10 kontras, teikens, beweging, kleursemantiek", async ({ page, context }) => {
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page, { time: new Date("2026-10-16T08:05:00+02:00") });
      await page.goto("/#missie");
      await page.clock.runFor(1500);
      expect(await kontras(page, "#block-list .zone-tag.rooi")).toBeGreaterThanOrEqual(4.5);
      expect(await page.locator("#cd-secs").evaluate((e) => getComputedStyle(e).animationName)).toBe("none");
      /* Teikens ≥ 44 px (merkblokkies ≥ 24 px) op Missie */
      const klein = await page.evaluate(() =>
        [...document.querySelectorAll("#view-missie button, #view-missie summary, .topbar button, .topbar summary")]
          .filter((e) => e.getBoundingClientRect().height > 0)
          .filter((e) => e.getBoundingClientRect().height < 43.9)
          .map((e) => e.className + " " + Math.round(e.getBoundingClientRect().height))
      );
      expect(klein).toEqual([]);
      /* Seker? = let op (geel), en die alternatief (Begin) word uitgelig */
      const knop = page.locator('#block-list .md-card[data-id="2026-10-16-afr-a1"] .mark-done');
      await knop.click();
      const wenk = page.locator('#block-list .md-card[data-id="2026-10-16-afr-a1"] .vroeg-wenk');
      await expect(wenk).toBeVisible();
      expect(await wenk.evaluate((e) => getComputedStyle(e).borderTopColor)).toBe(GEEL);
      expect(await wenk.evaluate((e) => getComputedStyle(e).color)).not.toBe(GEVAAR);
      expect(await kontras(page, '#block-list .md-card[data-id="2026-10-16-afr-a1"] .vroeg-wenk')).toBeGreaterThanOrEqual(4.5);
      const alt = page.locator('#block-list .md-card[data-id="2026-10-16-afr-a1"] .start-block');
      expect(await alt.evaluate((e) => getComputedStyle(e).outlineColor)).toBe(GEEL);
      expect(await alt.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(AKSENT);
      /* Verminderde beweging */
      await page.emulateMedia({ reducedMotion: "reduce" });
      expect(await page.locator("#view-missie").evaluate((e) => parseFloat(getComputedStyle(e).animationDuration))).toBeLessThan(0.001);
      expectNoLeaks(mock);
    });

    test("K13 'Begin nuwe poging': onderaan, klein en sekondêr; een klik stel niks terug nie, twee klikke wel", async ({ page, context }) => {
      const item = V3.find((i) => i.id === "afr-v3-A1");
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page, { time: new Date("2026-10-16T08:35:00+02:00") });
      await page.goto("/#skryfwerk");
      await page.locator(`.sw-item[data-id="${item.id}"]`).click();
      /* Voor die klok loop is die knoppie nie daar nie */
      await expect(page.locator(".em-nuut")).toBeHidden();
      await page.locator(".em-antwoord").fill("my eerste poging");
      const lees = () => page.evaluate(([k, id]) => JSON.parse(localStorage.getItem(k)).items[id], [DRAF, item.id]);
      /* Onderaan die kas, weg van die klok; klein en nie primêr nie */
      const lig = await page.evaluate(() => {
        const r = (s) => document.querySelector(s).getBoundingClientRect();
        const n = document.querySelector(".em-nuut");
        const kas = document.querySelector(".em-kas").getBoundingClientRect();
        const s = getComputedStyle(n);
        return {
          naAntwoord: r(".em-nuut").top >= r(".em-antwoord").bottom,
          naKlaar: r(".em-nuut").top >= r(".em-klaar").bottom,
          naMemoKnoppie: r(".em-nuut").top >= r(".em-memo-knoppie").bottom,
          binneKas: r(".em-nuut").bottom <= kas.bottom + 1,
          grootte: parseFloat(s.fontSize),
          primêr: s.backgroundColor === "rgb(200, 168, 75)"
        };
      });
      expect(lig.naKlaar).toBe(true);
      expect(lig.naMemoKnoppie).toBe(true);
      expect(lig.binneKas).toBe(true);
      expect(lig.naAntwoord).toBe(true);
      expect(lig.grootte).toBeLessThan(16);
      expect(lig.primêr).toBe(false);
      /* Eerste klik: net "Seker?"; niks word teruggestel nie */
      await page.locator(".em-nuut").click();
      await expect(page.locator(".em-nuut-seker-teks")).toHaveText("Seker? Jou huidige poging word bewaar onder Vorige pogings");
      await expect(page.locator(".em-nuut-ja")).toHaveText("Ja, begin nuwe poging");
      await expect(page.locator(".em-antwoord")).toHaveValue("my eerste poging");
      await page.clock.runFor(2000);
      await expect(page.locator(".em-nuut-ja"), "bevestiging bly staan tot Wallie kies").toBeVisible();
      let rec = await lees();
      expect(rec.begin, "klok loop nog").not.toBeNull();
      expect(rec.konsep).toBe("my eerste poging");
      expect(rec.vorige || []).toHaveLength(0);
      await expect(page.locator("details.em-vorige")).toBeHidden();
      /* "Nee" gaan terug sonder om iets te verander */
      await page.locator(".em-nuut-nee").click();
      await expect(page.locator(".em-nuut-seker")).toBeHidden();
      await expect(page.locator(".em-nuut")).toBeVisible();
      await expect(page.locator(".em-antwoord")).toHaveValue("my eerste poging");
      rec = await lees();
      expect(rec.vorige || []).toHaveLength(0);
      /* Tweede klik ("Ja") stel terug en bewaar die poging */
      await page.locator(".em-nuut").click();
      await page.locator(".em-nuut-ja").click();
      await expect(page.locator(".em-antwoord")).toHaveValue("");
      await expect(page.locator(".em-nuut-seker")).toBeHidden();
      await expect(page.locator("details.em-vorige summary")).toHaveText("Vorige pogings (1)");
      rec = await lees();
      expect(rec.begin).toBeNull();
      expect(rec.vorige).toHaveLength(1);
      expect(rec.vorige[0].konsep).toBe("my eerste poging");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expectNoLeaks(mock);
    });

    test("K4 foon: topbalk nie taai nie; K7 sessie-teikens", async ({ page, context }) => {
      const mock = await open15(page, context);
      const pos = await page.locator(".topbar").evaluate((e) => getComputedStyle(e).position);
      expect(pos).toBe(vp.name === "foon" ? "static" : "sticky");
      await beginSessie(page, mock);
      const klein = await page.evaluate(() =>
        [...document.querySelectorAll("#view-sessie button, #view-sessie input:not([type=checkbox]):not([type=file]), #view-sessie select")]
          .filter((e) => e.getBoundingClientRect().height > 0)
          /* 43.9: onderskep onderpixel-afronding van die flex-uitleg (43.99994 px is steeds 44 px) */
          .filter((e) => e.getBoundingClientRect().height < 43.9)
          .map((e) => (e.id || e.className) + " " + Math.round(e.getBoundingClientRect().height))
      );
      expect(klein).toEqual([]);
      expectNoLeaks(mock);
    });
  });
}
