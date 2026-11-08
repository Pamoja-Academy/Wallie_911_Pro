/* LL-25 (8 Nov): Afrikaans V1-voorbereiding is slim spotting, nie net vraestelle nie. Wallie SIEN die regte teorie-kaart
   by elke les-blok (nie die rotasie nie), en die dril-blok wys die presiese subvrae met hul punte. */
const { test, expect } = require("@playwright/test");
const { boot } = require("./helpers");
const { MockBackend } = require("./mock-backend");

test("LL-25: elke Afr V1 les-blok wys sy eie kaart; drils wys subvrae en punte", async ({ page, context }) => {
  await new MockBackend({ mode: "v1" }).attach(context);
  await boot(page, { time: new Date("2026-11-08T15:31:00+02:00") });
  await page.goto("/#missie");
  await page.waitForTimeout(800);
  const uit = await page.evaluate(() => {
    const r = [];
    for (const dag of ["2026-11-08", "2026-11-09", "2026-11-10"]) {
      for (const b of WALLIE.buildDayPlan(dag).blocks) {
        if (b.soort === "les" && b.kaart) {
          const html = WALLIE.lessonUI._kaart(Object.assign({ subjectSlug: b.slug }, b));
          const c = WALLIE.LESSONS.afrikaans.concepts.find((x) => x.id === b.kaart);
          r.push({ id: b.id, ok: Boolean(html && c && html.includes(c.titel)), titel: c && c.titel });
        }
      }
    }
    return r;
  });
  expect(uit.length).toBeGreaterThanOrEqual(7);
  expect(uit.filter((x) => !x.ok)).toEqual([]);

  /* Die spotting-kaart is die blok wat nou (15:31) aan die beurt is */
  await expect(page.locator('.md-card[data-id="2026-11-08-kaart-spot"]')).toContainText("V1: slim spotting");

  /* Die dril sê presies watter subvrae, met nagegaande punte (7) */
  const dril = await page.evaluate(() => {
    const b = WALLIE.buildDayPlan("2026-11-08").blocks.find((x) => x.id === "2026-11-08-dril-sins");
    return { punte: WALLIE.DBE.punte(b.werk, null), etikette: WALLIE.DBE.vraagLabels(b.werk).join(" | ") };
  });
  expect(dril.punte).toBe(7);
  expect(dril.etikette).toContain("4.2.2");
  expect(dril.etikette).toContain("5.3");
});
