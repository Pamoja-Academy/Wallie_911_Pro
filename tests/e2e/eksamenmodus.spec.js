/* Eksamenmodus (PR 1): klok, antwoordarea, memo-hek, punte-selfnasien. Geen eksterne netwerk (mock-backend).
   Hier word die hek ECHT getoets (geen eksamenOntsluit-saad nie). */
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { MockBackend } = require("./mock-backend");
const { boot, expectNoLeaks } = require("./helpers");

const V3 = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", "vraebank-v3.json"), "utf8"));
const RTT = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", "vraebank-rtt-v1.json"), "utf8"));
const STORE = "wallie911_vraebank_v1";
const DRAF = "wallie911_eksamen_v1";
const VIEWPORTS = [
  { name: "laptop", viewport: { width: 1366, height: 768 } },
  { name: "foon", viewport: { width: 390, height: 844 } }
];
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const woorde = (n) => Array.from({ length: n }, (_, i) => "woord" + i).join(" ");

for (const vp of VIEWPORTS) {
  test.describe(`eksamenmodus @ ${vp.name}`, () => {
    test.use({ viewport: vp.viewport });

    test("skryf: memo toe, woordtelling leef, konsep gestoor, hek ná minimum + klaar, punte per kriterium", async ({ page, context }) => {
      const item = V3.find((i) => i.id === "eng-v3-B1");
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page);
      await page.goto("/#skryfwerk");
      await page.locator(`.sw-item[data-id="${item.id}"]`).click();

      /* Memo en selfnasien is toe; geen memo-inhoud in die DOM nie */
      await expect(page.locator(".em-tyd")).toContainText(`/ ${item.tyd_min}:00`);
      await expect(page.locator(".em-memo-knoppie")).toBeDisabled();
      await expect(page.locator(".em-memo-knoppie")).toHaveText("Memo gesluit");
      await expect(page.locator(".sw-memo")).toBeHidden();
      await expect(page.locator(".sw-nasien")).toBeHidden();
      expect(await page.locator("#view-skryfwerk").innerText()).not.toContain(item.antwoord.slice(0, 40));

      /* Woordtelling teen item.woorde */
      await page.locator(".em-antwoord").fill(woorde(50));
      await expect(page.locator(".em-woorde")).toHaveText(`50 woorde (doel ${item.woorde.min}–${item.woorde.max})`);
      await expect(page.locator(".em-memo-knoppie")).toBeDisabled();

      /* Klaar gedruk maar te min woorde → bly toe */
      await page.locator(".em-klaar").click();
      await expect(page.locator(".em-memo-knoppie")).toBeDisabled();
      await expect(page.locator(".em-rede")).toContainText(`Skryf nog ${item.woorde.min - 50} woorde`);

      /* Konsep is plaaslik gestoor */
      const draf = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), DRAF);
      expect(draf.items[item.id].konsep.split(" ")).toHaveLength(50);

      /* Genoeg woorde + klaar → oop */
      await page.locator(".em-antwoord").fill(woorde(item.woorde.min));
      await expect(page.locator(".em-memo-knoppie")).toBeEnabled();
      await page.locator(".em-memo-knoppie").click();
      await expect(page.locator(".sw-memo")).toBeVisible();
      await expect(page.locator(".sw-nasien")).toBeVisible();

      /* Punte per rubriekkriterium, totaal /item-punte */
      const inps = page.locator(".em-punt-inp");
      await expect(inps).toHaveCount(item.nasienriglyn.length);
      await inps.nth(0).fill(String(item.nasienriglyn[0].punte));
      await inps.nth(1).fill("5");
      await expect(page.locator(".em-som")).toHaveText(`Totaal: ${item.nasienriglyn[0].punte + 5} / ${item.punte}`);
      await page.locator(".em-stoor-punte").click();
      await expect(page.locator(".em-gestoor")).toContainText("Gestoor");
      const st = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), STORE);
      const p = st.items[item.id].pogings[0];
      expect(p.punte_behaal).toBe(item.nasienriglyn[0].punte + 5);
      expect(p.punte_totaal).toBe(item.punte);
      expect(p.woorde).toBe(item.woorde.min);
      expect(p.tyd_min).toBe(item.tyd_min);
      expect(typeof p.minute_gebruik).toBe("number");
      expect(typeof p.memo_oopgemaak_na_min).toBe("number");

      /* Die ou drie knoppies bly as ekstra */
      await expect(page.locator(".sw-reg")).toBeVisible();
      expect(await noOverflow(page)).toBe(true);
      /* Geen bediener-event solank die soort nie goedgekeur is nie */
      expectNoLeaks(mock);
    });

    test("skryf: tyd verby maak die memo oop sonder werk; die klok sit voort (geen harde afsluit)", async ({ page, context }) => {
      const item = V3.find((i) => i.id === "eng-v3-C1");
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page);
      await page.goto("/#skryfwerk");
      await page.locator(`.sw-item[data-id="${item.id}"]`).click();
      await page.locator(".em-begin").click();
      await expect(page.locator(".em-memo-knoppie")).toBeDisabled();
      await page.clock.fastForward((item.tyd_min * 60 - 5) * 1000);
      await page.clock.runFor(1000);
      await expect(page.locator(".em-memo-knoppie")).toBeDisabled();
      await page.clock.fastForward(10 * 1000);
      await page.clock.runFor(1000);
      await expect(page.locator(".em-memo-knoppie")).toBeEnabled();
      await expect(page.locator(".em-tyd")).toContainText("Tyd om");
      await expect(page.locator(".em-antwoord")).toBeEnabled();
      expectNoLeaks(mock);
    });

    test("prakties (RTT): papier-bevestiging + 60% van die tyd + klaar", async ({ page, context }) => {
      const item = RTT.find((i) => i.id === "rtt-v1-S01");
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page);
      await page.goto("/#oefenvrae");
      await page.locator(".ov-item").first().click();
      const tyd = Math.max(1, Math.round((item.punte * 180) / 150)); /* min */
      await expect(page.locator(".em-memo-knoppie")).toBeDisabled();
      await page.locator(".em-bevestig input").check();
      await page.locator(".em-lêer").fill("sigblad.xlsx");
      await page.locator(".em-klaar").click();
      await expect(page.locator(".em-memo-knoppie")).toBeDisabled();
      await page.clock.fastForward(Math.ceil(0.6 * tyd * 60) * 1000);
      await page.clock.runFor(1000);
      await expect(page.locator(".em-memo-knoppie")).toBeEnabled();
      await page.locator(".em-memo-knoppie").click();
      await expect(page.locator(".oe-memo")).toBeVisible();
      const inps = page.locator(".em-punt-inp");
      await expect(inps).toHaveCount(item.nasienriglyn.length);
      for (let i = 0; i < item.nasienriglyn.length; i++) await inps.nth(i).fill(String(item.nasienriglyn[i].punte));
      await page.locator(".em-stoor-punte").click();
      const st = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), STORE);
      const p = st.items[item.id].pogings[0];
      expect(p.punte_behaal).toBe(item.punte);
      expect(p.uitslag).toBe("reg");
      expect(p.woorde).toBeUndefined();
      expect(await noOverflow(page)).toBe(true);
      expectNoLeaks(mock);
    });
  });
}
