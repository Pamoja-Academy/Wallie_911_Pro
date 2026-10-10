/* Oefenvrae (RTT V1): lys en itemskerms op 1366×768 en 390×844. Alle netwerk onderskep (mock-backend). */
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { MockBackend } = require("./mock-backend");
const { boot, shot, expectNoLeaks } = require("./helpers");

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", "vraebank-rtt-v1.json"), "utf8"));
const LIST = Array.isArray(DATA) ? DATA : DATA.items;
const KEY = "wallie911_vraebank_v1";
const VIEWPORTS = [
  { name: "laptop", label: "1366x768", viewport: { width: 1366, height: 768 } },
  { name: "foon", label: "390x844", viewport: { width: 390, height: 844 } }
];
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const otherKeys = (page) =>
  page.evaluate(
    (k) => Object.fromEntries(Object.keys(localStorage).filter((x) => x !== k).map((x) => [x, localStorage.getItem(x)])),
    KEY
  );

for (const vp of VIEWPORTS) {
  test.describe(`oefenvrae @ ${vp.label}`, () => {
    test.use({ viewport: vp.viewport });

    test("lys, 30 items, bron, memo, self-nasien, geen oorloop, geen eksterne versoeke", async ({ page, context }) => {
      expect(LIST.length).toBe(30);
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      const buite = [];
      page.on("request", (r) => {
        const u = r.url();
        /* supabase/ntfy-versoeke van die app se eie sinkronisering word deur die mock onderskep (expectNoLeaks) */
        if (!/^(http:\/\/localhost|data:|blob:)/.test(u) && !/fonts\.(googleapis|gstatic)\.com|supabase\.co|ntfy\.sh/.test(u)) buite.push(u);
      });
      await boot(page);
      await page.goto("/#oefenvrae");
      await expect(page.locator("#view-oefenvrae")).toHaveClass(/active/);
      await expect(page.locator("#oefenvrae-root h1")).toHaveText("Oefenvrae (RTT V1)");
      await expect(page.locator(".ov-item")).toHaveCount(30);
      for (const g of ["Sigblad", "Woordverwerking", "Databasis", "HTML", "Algemeen"]) {
        await expect(page.locator(".ov-groep h2", { hasText: g })).toBeVisible();
      }
      expect(await noOverflow(page)).toBe(true);
      expect(await page.locator("#oefenvrae-root").innerText()).not.toMatch(/%/);
      await page.screenshot({ path: shot(`fase1/vraebank-lys-${vp.name}.png`) });

      const eersteHtml = LIST.findIndex((x) => x.onderwerp === "html");
      await page.locator(".ov-item").first().click();
      for (let i = 0; i < LIST.length; i++) {
        const it = LIST[i];
        const kort = it.id.replace(/^rtt-v1-/, "");
        await expect(page.locator(".oe-titel")).toContainText(kort);
        await expect(page.locator(".oe-titel")).toContainText(`(${it.punte} punt`);
        const bron = page.locator(".oe-bron");
        await expect(bron).toBeVisible();
        await expect(bron).toHaveText(`Bron: ${it.bron.verwysing}, bl. ${it.bron.bladsy} (memo bl. ${it.bron.memo_bladsy})`);
        await expect(page.locator(".oe-opdrag")).toHaveText("Doen dit in Excel/Word/Access of op papier, en kyk dan na die memo.");
        const wys = page.locator(".oe-memo-knoppie");
        await expect(page.locator(".oe-memo")).toBeHidden();
        await wys.click();
        await expect(page.locator(".oe-memo")).toBeVisible();
        await expect(wys).toHaveText("Steek memo weg");
        if (i === eersteHtml) await page.screenshot({ path: shot(`fase1/vraebank-item-memo-${vp.name}.png`) });
        expect(await noOverflow(page), `oorloop by ${it.id}`).toBe(true);
        await wys.click();
        await expect(page.locator(".oe-memo")).toBeHidden();
        await expect(wys).toHaveText("Wys memo");
        for (const t of ["Reg", "Gedeeltelik", "Fout"]) {
          expect((await page.getByRole("button", { name: t, exact: true }).boundingBox()).height).toBeGreaterThanOrEqual(44);
        }
        if (i < LIST.length - 1) await page.locator(".oe-volgende").click();
      }
      await expect(page.locator(".oe-volgende")).toBeDisabled();

      /* Self-nasien: net wallie911_vraebank_v1 verander */
      await page.locator(".oe-terug").click();
      await page.locator(".ov-item").first().click();
      const voor = await otherKeys(page);
      expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBeNull();
      await page.getByRole("button", { name: "Reg", exact: true }).click();
      await expect(page.locator(".oe-gestoor")).toHaveText("Gestoor.");
      const store = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
      expect(store.v).toBe(1);
      expect(store.items[LIST[0].id].pogings).toHaveLength(1);
      expect(store.items[LIST[0].id].pogings[0].uitslag).toBe("reg");
      expect(await otherKeys(page)).toEqual(voor);

      /* Lys wys ’n neutrale merk, geen totale */
      await page.locator(".oe-terug").click();
      await expect(page.locator(".ov-item").first().locator(".ov-merk")).toHaveText("✓");
      expect(await noOverflow(page)).toBe(true);

      expect(buite, "geen eksterne versoeke").toEqual([]);
      expectNoLeaks(mock);
    });

    test("bereikbaar via Meer-kieslys", async ({ page, context }) => {
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page);
      await page.goto("/#missie");
      await page.locator(".nav-more summary").click();
      await page.locator('.nav-btn[data-view="oefenvrae"]').click();
      await expect(page.locator(".ov-item")).toHaveCount(30);
      expectNoLeaks(mock);
    });
  });
}
