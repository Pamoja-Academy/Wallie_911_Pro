/* Praktiese blok: skerms (knoppie, banier, eindboodskap) op 1366×768 en 390×844. Alle netwerk onderskep (mock-backend). */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, runUntil, shot, expectNoLeaks } = require("./helpers");

const VIEWPORTS = [
  { name: "laptop", label: "1366x768", viewport: { width: 1366, height: 768 } },
  { name: "foon", label: "390x844", viewport: { width: 390, height: 844 } }
];

const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

async function startBlock(page, mock, rtt) {
  await page.goto("/#missie");
  const btn = rtt ? page.locator('.start-block[data-slug="rtt"]').first() : page.locator(".start-block:not([data-slug='rtt'])").first();
  await btn.click();
  await runUntil(page, async () => mock.byKind("start").length === 1, { label: "start afgelewer" });
}

for (const vp of VIEWPORTS) {
  test.describe(`praktiese skerms @ ${vp.label}`, () => {
    test.use({ viewport: vp.viewport });

    test("knoppie net by ’n RTT-blok; banier, tyd, klaar-boodskap; geen horisontale oorloop", async ({ page, context }) => {
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page);
      await startBlock(page, mock, true);

      const start = page.locator("#praktiese-start");
      await expect(start).toBeVisible();
      await expect(start).toHaveText("Begin praktiese blok (Office)");
      await expect(page.locator(".praktiese-sub")).toHaveText("Jy mag nou na Word, Excel, Access of Notepad oorskakel. Die tyd tel steeds.");
      expect((await start.boundingBox()).height).toBeGreaterThanOrEqual(44);
      expect(await noOverflow(page)).toBe(true);
      await page.screenshot({ path: shot(`fase1/praktiese-${vp.name}-knoppie.png`) });

      await start.click();
      const banier = page.locator(".praktiese-banner");
      await expect(banier).toBeVisible();
      await expect(banier).toContainText("Praktiese blok aktief – RTT V1");
      await expect(page.locator("#praktiese-tyd")).toContainText("3:15");
      await expect(start).toBeHidden();
      /* Banier verberg nie bestaande kontroles nie */
      await expect(page.locator("#end-session")).toBeVisible();
      await expect(page.locator("#session-subject")).toBeVisible();
      const klaar = page.locator("#praktiese-klaar");
      await expect(klaar).toHaveText("Klaar met prakties");
      expect((await klaar.boundingBox()).height).toBeGreaterThanOrEqual(44);
      expect(await noOverflow(page)).toBe(true);
      await page.screenshot({ path: shot(`fase1/praktiese-${vp.name}-aktief.png`) });

      /* Tyd werk elke minuut by */
      await page.clock.runFor(61 * 1000);
      await expect(page.locator("#praktiese-tyd")).toContainText("3:14");

      let vraag = "";
      page.once("dialog", (d) => {
        vraag = d.message();
        d.accept();
      });
      await klaar.click();
      expect(vraag).toBe("Is jy klaar met die praktiese blok?");
      const msg = page.locator("#praktiese-boodskap");
      await expect(msg).toHaveText("Praktiese blok klaar. Die gewone toesig geld weer.");
      await expect(banier).toHaveCount(0);
      expect(await noOverflow(page)).toBe(true);
      await page.screenshot({ path: shot(`fase1/praktiese-${vp.name}-klaar.png`) });
      expectNoLeaks(mock);
    });

    test("maks-boodskap ná 3 h 15 min", async ({ page, context }) => {
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page);
      await startBlock(page, mock, true);
      await page.locator("#praktiese-start").click();
      await expect(page.locator(".praktiese-banner")).toBeVisible();
      await page.clock.fastForward((3 * 60 + 15) * 60 * 1000 + 1000);
      await expect(page.locator("#praktiese-boodskap")).toContainText("Die maksimum tyd van 3 h 15 min is verby.");
      await expect(page.locator(".praktiese-banner")).toHaveCount(0);
      expect(await noOverflow(page)).toBe(true);
      expectNoLeaks(mock);
    });

    test("wegkyk-wenk: praktiese teks tydens blok, oorspronklike (byte-identies) daarbuite", async ({ page, context }) => {
      const HINT_ORIG = "Memo hier in die app tel nie as wegkyk nie (maks 15 min, Pa kry ’n sein). Tab-wissel of ’n ander program tel steeds.";
      const HINT_PRAKTIES = "Praktiese blok: oorskakel na Word, Excel, Access of Notepad tel nie as 'n waarskuwing nie. Die tyd tel steeds.";
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page);
      await startBlock(page, mock, true);
      const hint = page.locator("#wegkyk-hint");
      expect(await hint.textContent()).toBe(HINT_ORIG);
      await page.locator("#praktiese-start").click();
      await expect(page.locator(".praktiese-banner")).toBeVisible();
      expect(await hint.textContent()).toBe(HINT_PRAKTIES);
      page.once("dialog", (d) => d.accept());
      await page.locator("#praktiese-klaar").click();
      await expect(page.locator("#praktiese-boodskap")).toBeVisible();
      expect(await hint.textContent()).toBe(HINT_ORIG);
      expectNoLeaks(mock);
    });

    test("nie ’n RTT-blok nie → geen knoppie", async ({ page, context }) => {
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page);
      await startBlock(page, mock, false);
      await expect(page.locator("#end-session")).toBeVisible();
      await expect(page.locator("#praktiese-start")).toBeHidden();
      await expect(page.locator(".praktiese-banner")).toHaveCount(0);
      expect(await noOverflow(page)).toBe(true);
      expectNoLeaks(mock);
    });
  });
}
