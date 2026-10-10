/* Fase 1 — finale weergawe-toetse op 1366×768 en 390×844. Skermkiekies GEFOKUS op die element
   (locator.screenshot of scrollIntoViewIfNeeded + clip) na ARTIFACTS/fase1/finaal-*.png.
   Per element: sigbaar, ná scroll binne die venster, geen horisontale oorloop (bladsy én element). Alle netwerk onderskep. */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, runUntil, shot, expectNoLeaks } = require("./helpers");

const VIEWPORTS = [
  { name: "laptop", label: "1366x768", viewport: { width: 1366, height: 768 } },
  { name: "foon", label: "390x844", viewport: { width: 390, height: 844 } }
];
const HINT_PRAKTIES = "Praktiese blok: oorskakel na Word, Excel, Access of Notepad tel nie as 'n waarskuwing nie. Die tyd tel steeds.";

async function expectRendered(page, loc, label) {
  await expect(loc, `${label} sigbaar`).toBeVisible();
  await loc.scrollIntoViewIfNeeded();
  const box = await loc.boundingBox();
  const vp = page.viewportSize();
  expect(box, `${label} het ’n boks`).not.toBeNull();
  expect(box.x, `${label} links binne venster`).toBeGreaterThanOrEqual(0);
  expect(box.y, `${label} bo binne venster`).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width, `${label} regs binne venster`).toBeLessThanOrEqual(vp.width + 0.5);
  expect(box.y + box.height, `${label} onder binne venster`).toBeLessThanOrEqual(vp.height + 0.5);
  const ov = await loc.evaluate((el) => ({
    doc: document.documentElement.scrollWidth <= window.innerWidth,
    el: el.scrollWidth <= el.clientWidth + 1
  }));
  expect(ov.doc, `${label}: geen horisontale oorloop op die bladsy`).toBe(true);
  expect(ov.el, `${label}: geen horisontale oorloop in die element`).toBe(true);
  return box;
}

async function startRtt(page, mock) {
  await page.goto("/#missie");
  await page.locator('.start-block[data-slug="rtt"]').first().click();
  await runUntil(page, async () => mock.byKind("start").length === 1, { label: "start afgelewer" });
}

for (const vp of VIEWPORTS) {
  test.describe(`fase 1 weergawe @ ${vp.label}`, () => {
    test.use({ viewport: vp.viewport });

    test("praktiese knoppie-ry en aktiewe banier (met tyd, klaar-knoppie en veranderde wenk)", async ({ page, context }) => {
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page);
      await startRtt(page, mock);

      const row = page.locator("#praktiese-start-row");
      await expectRendered(page, row, "knoppie-ry");
      await expectRendered(page, page.locator("#praktiese-start"), "knoppie");
      await expectRendered(page, row.locator(".praktiese-sub"), "sub-reël");
      await expect(row.locator(".praktiese-sub")).toHaveText("Jy mag nou na Word, Excel, Access of Notepad oorskakel. Die tyd tel steeds.");
      await row.scrollIntoViewIfNeeded();
      /* Clip met 8 px rand: die 'J' van die sub-reël hang ’n pixel oor die ry se linkerrand (glief-oorhang, die paneel se padding wys dit) */
      const rb = await row.boundingBox();
      const vw = page.viewportSize().width;
      const x0 = Math.max(0, rb.x - 8);
      await page.screenshot({
        path: shot(`fase1/finaal-praktiese-knoppie-${vp.name}.png`),
        clip: { x: x0, y: Math.max(0, rb.y - 8), width: Math.min(vw, rb.x + rb.width + 8) - x0, height: rb.height + 16 }
      });

      await page.locator("#praktiese-start").click();
      const banier = page.locator(".praktiese-banner");
      await expectRendered(page, banier, "banier");
      await expect(banier).toContainText("Praktiese blok aktief – RTT V1");
      await expectRendered(page, page.locator("#praktiese-tyd"), "tyd");
      await expect(page.locator("#praktiese-tyd")).toContainText("3:15");
      await expectRendered(page, page.locator("#praktiese-klaar"), "klaar-knoppie");
      await expect(page.locator("#praktiese-klaar")).toHaveText("Klaar met prakties");
      const hint = page.locator("#wegkyk-hint");
      const hBox = await expectRendered(page, hint, "veranderde wenk");
      expect(await hint.textContent()).toBe(HINT_PRAKTIES);

      /* Een fokus-kiekie: van die banier tot by die wenk (bladsy-koördinate) */
      const wrap = page.locator("#praktiese-banner");
      await wrap.scrollIntoViewIfNeeded();
      const clip = await page.evaluate(() => {
        const a = document.getElementById("praktiese-banner").getBoundingClientRect();
        const b = document.getElementById("wegkyk-hint").getBoundingClientRect();
        const top = Math.min(a.top, b.top) + window.scrollY;
        const bottom = Math.max(a.bottom, b.bottom) + window.scrollY;
        const left = Math.min(a.left, b.left) + window.scrollX;
        const right = Math.max(a.right, b.right) + window.scrollX;
        return { x: Math.max(0, left - 4), y: Math.max(0, top - 4), width: right - left + 8, height: bottom - top + 8 };
      });
      expect(hBox.height).toBeGreaterThan(0);
      await page.screenshot({ path: shot(`fase1/finaal-praktiese-banier-${vp.name}.png`), fullPage: true, clip });
      expectNoLeaks(mock);
    });

    test("oefenvrae: lys en item met memo oop en bron sigbaar", async ({ page, context }) => {
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page);
      await page.goto("/#oefenvrae");
      await expect(page.locator(".ov-item")).toHaveCount(30);
      /* ’n Hele groep is hoër as die venster; toets die eerste groep-opskrif en lys-item */
      await expectRendered(page, page.locator(".ov-groep h2").first(), "eerste groep-opskrif");
      await expectRendered(page, page.locator(".ov-item").first(), "eerste lys-item");
      await expectRendered(page, page.locator("#oefenvrae-root h1"), "lys-opskrif");
      const root = page.locator("#oefenvrae-root");
      /* Bo-aan die bladsy, sodat die klewerige .topbar nie die opskrif bedek nie */
      await page.evaluate(() => window.scrollTo(0, 0));
      const rootBox = await root.boundingBox();
      const vps = page.viewportSize();
      await page.screenshot({
        path: shot(`fase1/finaal-vraebank-lys-${vp.name}.png`),
        clip: { x: Math.max(0, rootBox.x), y: Math.max(0, rootBox.y), width: Math.min(rootBox.width, vps.width), height: Math.min(rootBox.height, vps.height - Math.max(0, rootBox.y)) }
      });

      await page.locator(".ov-item").first().click();
      await page.locator(".oe-memo-knoppie").click();
      await expectRendered(page, page.locator(".oe-titel"), "item-titel");
      await expectRendered(page, page.locator(".oe-bron"), "bron");
      await expect(page.locator(".oe-bron")).toHaveText(/^Bron: DBE \S+ 20\d\d V1 V[\d.]+, bl\. \d+ \(memo bl\. \d+\)$/);
      const memo = page.locator(".oe-memo");
      await expect(memo).toBeVisible();
      await memo.scrollIntoViewIfNeeded();
      const ov = await memo.evaluate((el) => ({ doc: document.documentElement.scrollWidth <= window.innerWidth, el: el.scrollWidth <= el.clientWidth + 1 }));
      expect(ov).toEqual({ doc: true, el: true });
      /* Item-kiekie: die hele item (bron + oop memo), element-fokus */
      const item = page.locator("#oefenvrae-root");
      await item.screenshot({ path: shot(`fase1/finaal-vraebank-item-${vp.name}.png`) });
      expectNoLeaks(mock);
    });

    test("voorskou-banier (?voorskou-toets=1)", async ({ page, context }) => {
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page);
      await page.goto("/index.html?voorskou-toets=1#missie");
      const ban = page.locator("#voorskou-banier");
      await expectRendered(page, ban, "voorskou-banier");
      await expect(ban).toHaveText("VOORSKOU — niks word na die bediener gestuur nie.");
      await ban.screenshot({ path: shot(`fase1/finaal-voorskou-banier-${vp.name}.png`) });
      expect(mock.calls).toEqual([]);
      expect(mock.ntfy).toEqual([]);
      expectNoLeaks(mock);
    });
  });
}
