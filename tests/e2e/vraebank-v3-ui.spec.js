/* Skryfwerk (V3): lys en itemskerms op 1366×768 en 390×844. Alle netwerk onderskep (mock-backend).
   Die self-nasien mag NET wallie911_vraebank_v1 verander; elke ander sleutel bly greep-identies. */
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { MockBackend } = require("./mock-backend");
const { boot, shot, expectNoLeaks } = require("./helpers");

const ITEMS = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", "vraebank-v3.json"), "utf8"));
const RUBRIEKE = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", "vraebank-v3-rubrieke.json"), "utf8"));
const KEY = "wallie911_vraebank_v1";
const VIEWPORTS = [
  { name: "laptop", label: "1366x768", viewport: { width: 1366, height: 768 } },
  { name: "foon", label: "390x844", viewport: { width: 390, height: 844 } }
];
const GROEPE = ["Engels EAT V3 · Do 15 Okt", "Afrikaans HT V3 · Di 20 Okt"];
const AFDELINGS = [
  "Afdeling A Essay",
  "Afdeling B Longer transactional",
  "Afdeling C Shorter transactional",
  "Afdeling A Opstel",
  "Afdeling B Transaksionele tekste"
];

const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const otherKeys = (page) =>
  page.evaluate(
    (k) => Object.fromEntries(Object.keys(localStorage).filter((x) => x !== k).map((x) => [x, localStorage.getItem(x)])),
    KEY
  );

/* Dieselfde woordtelling-reël as die app en tests/vraebank-v3.test.js */
function woordtelling(item) {
  const norm = (s) =>
    String(s).replace(/[’‘ꞌ]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim().toLowerCase();
  const a = norm(item.antwoord);
  const v = norm(item.toets.woordtelling.van);
  const t = norm(item.toets.woordtelling.tot);
  return a.slice(a.indexOf(v), a.lastIndexOf(t) + t.length).split(" ").filter(Boolean).length;
}

for (const vp of VIEWPORTS) {
  test.describe(`skryfwerk @ ${vp.label}`, () => {
    test.use({ viewport: vp.viewport });

    test("lys met 14 items in die regte groepe, elke item open, memo wys woordtelling en rubriek", async ({ page, context }) => {
      expect(ITEMS.length).toBe(14);
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      const buite = [];
      page.on("request", (r) => {
        const u = r.url();
        /* supabase/ntfy van die app se eie sinkronisering word deur die mock onderskep (expectNoLeaks) */
        if (!/^(http:\/\/localhost|data:|blob:)/.test(u) && !/fonts\.(googleapis|gstatic)\.com|supabase\.co|ntfy\.sh/.test(u)) buite.push(u);
      });
      await boot(page);
      await page.goto("/#skryfwerk");

      await expect(page.locator("#view-skryfwerk")).toHaveClass(/active/);
      await expect(page.locator("#skryfwerk-root h1")).toHaveText("Skryfwerk (V3)");
      await expect(page.locator("#skryfwerk-root .hint").first()).toHaveText(
        "Beplan, skryf op papier onder tyd, tel jou woorde, en kyk dan na die memo."
      );
      await expect(page.locator(".sw-item")).toHaveCount(14);
      expect(await page.locator(".sw-groep h2").allTextContents()).toEqual(GROEPE);
      expect(await page.locator(".sw-afdeling").allTextContents()).toEqual(AFDELINGS);

      /* Elke ry: kort id, teksoort, punte · woorde · tyd */
      for (const item of ITEMS) {
        const ry = page.locator(`.sw-item[data-id="${item.id}"]`);
        await expect(ry).toHaveCount(1);
        await expect(ry.locator(".sw-id")).toHaveText(item.id.replace(/^(eng|afr)-v3-/, ""));
        await expect(ry.locator(".sw-teksoort")).toHaveText(item.teksoort);
        await expect(ry.locator(".sw-opsomming")).toHaveText(
          `${item.punte} punte · ${item.woorde.min}–${item.woorde.max} woorde · ±${item.tyd_min} min`
        );
      }
      expect(await noOverflow(page)).toBe(true);
      await page.screenshot({ path: shot(`fase2/skryfwerk-lys-${vp.name}.png`), fullPage: true });

      /* Elke item open en wys sy vraag, beplanning en bron */
      for (const item of ITEMS) {
        await page.locator(`.sw-item[data-id="${item.id}"]`).click();
        await expect(page.locator(".sw-titel")).toContainText(item.teksoort);
        await expect(page.locator(".sw-vraag")).toHaveText(item.vraag);
        await expect(page.locator(".sw-blok .sw-punte > li")).toHaveCount(item.beplanning.length);
        await expect(page.locator(".sw-bron")).toHaveText(
          `Bron: ${item.bron.verwysing}, bl. ${item.bron.bladsy} (memo bl. ${item.bron.memo_bladsy})`
        );
        /* Die memo is toe tot Wallie dit oopmaak */
        await expect(page.locator(".sw-memo")).toBeHidden();
        await expect(page.locator(".sw-memo-knoppie")).toHaveAttribute("aria-expanded", "false");
        await page.locator(".sw-memo-knoppie").click();
        await expect(page.locator(".sw-memo")).toBeVisible();
        await expect(page.locator(".sw-memo-knoppie")).toHaveAttribute("aria-expanded", "true");
        await expect(page.locator(".sw-kontrolelys > li")).toHaveCount(item.formaat.length);
        await expect(page.locator(".sw-woordtelling")).toHaveText(`${woordtelling(item)} woorde`);
        await expect(page.locator(".sw-teks").first()).toHaveText(item.antwoord);
        const kriteria = RUBRIEKE[item.rubriek].kriteria;
        await expect(page.locator(".sw-kriterium")).toHaveCount(kriteria.length);
        await expect(page.locator(".sw-kriterium h4").first()).toHaveText(`${kriteria[0].kriterium} · ${kriteria[0].punte}`);
        await expect(page.locator(".sw-bande > li").first()).toContainText(kriteria[0].bande[0].vlak);
        expect(await noOverflow(page), `${item.id}: geen horisontale oorloop`).toBe(true);
        /* Weer toemaak en terug na die lys */
        await page.locator(".sw-memo-knoppie").click();
        await expect(page.locator(".sw-memo")).toBeHidden();
        await page.locator(".sw-terug").click();
        await expect(page.locator(".sw-item")).toHaveCount(14);
      }

      /* Geen persentasie of telling oor Wallie op hierdie skerm nie */
      await page.locator('.sw-item[data-id="eng-v3-A1"]').click();
      await page.locator(".sw-memo-knoppie").click();
      expect(await page.locator("#view-skryfwerk").innerText()).not.toContain("%");
      await page.screenshot({ path: shot(`fase2/skryfwerk-item-eng-${vp.name}.png`), fullPage: true });
      await page.locator(".sw-terug").click();
      await page.locator('.sw-item[data-id="afr-v3-B3"]').click();
      await page.locator(".sw-memo-knoppie").click();
      expect(await page.locator("#view-skryfwerk").innerText()).not.toContain("%");
      await page.screenshot({ path: shot(`fase2/skryfwerk-item-afr-${vp.name}.png`), fullPage: true });

      expect(buite, "geen eksterne versoeke").toEqual([]);
      expectNoLeaks(mock);
    });

    test("vorige/volgende loop deur die bank; self-nasien raak net wallie911_vraebank_v1", async ({ page, context }) => {
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page);
      await page.goto("/#skryfwerk");
      await expect(page.locator(".sw-item")).toHaveCount(14);

      /* Eerste item: Vorige is af, Volgende loop na item 2 */
      await page.locator(`.sw-item[data-id="${ITEMS[0].id}"]`).click();
      await expect(page.locator(".sw-vorige")).toBeDisabled();
      await page.locator(".sw-volgende").click();
      await expect(page.locator(".sw-titel")).toContainText(ITEMS[1].teksoort);
      await page.locator(".sw-vorige").click();
      await expect(page.locator(".sw-titel")).toContainText(ITEMS[0].teksoort);
      await page.locator(".sw-terug").click();

      /* Laaste item: Volgende is af */
      await page.locator(`.sw-item[data-id="${ITEMS[ITEMS.length - 1].id}"]`).click();
      await expect(page.locator(".sw-volgende")).toBeDisabled();
      await page.locator(".sw-terug").click();

      /* Self-nasien stoor net in die bestaande vraebank-sleutel */
      const voor = await otherKeys(page);
      await page.locator(`.sw-item[data-id="${ITEMS[0].id}"]`).click();
      await page.locator(".sw-reg").click();
      await expect(page.locator(".sw-gestoor")).toHaveText("Gestoor.");
      const store = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
      expect(store.v).toBe(1);
      expect(store.items[ITEMS[0].id].pogings).toHaveLength(1);
      expect(store.items[ITEMS[0].id].pogings[0].uitslag).toBe("reg");
      expect(await otherKeys(page), "geen ander localStorage-sleutel verander").toEqual(voor);

      /* Die lys wys die merk, sonder enige telling */
      await page.locator(".sw-terug").click();
      await expect(page.locator(`.sw-item[data-id="${ITEMS[0].id}"] .sw-merk`)).toHaveText("✓");
      expect(await page.locator("#view-skryfwerk").innerText()).not.toContain("%");

      /* "Gedeeltelik" en "Moet oordoen" stoor die ander twee uitslae */
      await page.locator(`.sw-item[data-id="${ITEMS[1].id}"]`).click();
      await page.locator(".sw-gedeeltelik").click();
      await expect(page.locator(".sw-gestoor")).toHaveText("Gestoor.");
      await page.locator(".sw-terug").click();
      await page.locator(`.sw-item[data-id="${ITEMS[2].id}"]`).click();
      await page.locator(".sw-fout").click();
      await expect(page.locator(".sw-gestoor")).toHaveText("Gestoor.");
      await page.locator(".sw-terug").click();
      await expect(page.locator(`.sw-item[data-id="${ITEMS[1].id}"] .sw-merk`)).toHaveText("½");
      await expect(page.locator(`.sw-item[data-id="${ITEMS[2].id}"] .sw-merk`)).toHaveText("✗");

      /* Die RTT-oefenvrae werk steeds, met hul eie items in dieselfde sleutel */
      await page.goto("/#oefenvrae");
      await expect(page.locator(".ov-item")).toHaveCount(30);
      await page.locator(".ov-item").first().click();
      await page.locator(".oe-memo-knoppie").click();
      await expect(page.locator(".oe-memo")).toBeVisible();
      const na = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
      expect(Object.keys(na.items).sort()).toEqual([ITEMS[0].id, ITEMS[1].id, ITEMS[2].id].sort());
      expect(await noOverflow(page)).toBe(true);
      expectNoLeaks(mock);
    });

    test("bereikbaar via Meer-kieslys", async ({ page, context }) => {
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page);
      await page.goto("/#missie");
      await page.locator(".nav-more summary").click();
      await page.locator('.nav-btn[data-view="skryfwerk"]').click();
      await expect(page.locator("#view-skryfwerk")).toHaveClass(/active/);
      await expect(page.locator(".sw-item")).toHaveCount(14);
      expect(await noOverflow(page)).toBe(true);
      expectNoLeaks(mock);
    });
  });
}
