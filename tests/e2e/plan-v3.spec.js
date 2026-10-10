/* Plan v3 (Hanno, 10 Okt): So 11 en Ma 12 Okt is RTT V1-fokusdae. Geen WG/Gasvryheid/Afrikaans/Toerisme;
   die RTT V1-blokke wys die praktiese-modus-knoppie. */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, expectNoLeaks } = require("./helpers");

for (const [dag, tyd, titel] of [
  ["2026-10-11", "2026-10-11T09:05:00+02:00", "volledig getimed (DBE Junie 2026 V1"],
  ["2026-10-12", "2026-10-12T09:05:00+02:00", "Woordverwerking (V1 en V2)"]
]) {
  test(`plan v3 op ${dag}: RTT V1-fokus, geen WG/Gasvryheid/Afrikaans/Toerisme; praktiese knoppie`, async ({ page, context }) => {
    const mock = new MockBackend({ mode: "v1" });
    await mock.attach(context);
    await boot(page, { time: new Date(tyd) });
    await page.goto("/#missie");
    await page.clock.runFor(1500);
    const lys = await page.locator("#block-list").innerText();
    expect(lys).not.toMatch(/Wiskundige Geletterdheid|Gasvryheid|Afrikaans|Toerisme/);
    const blok = page.locator(`#block-list .md-card[data-id="${dag}-geel"]`);
    await expect(blok).toBeVisible();
    await expect(blok).toContainText(titel);
    await blok.locator(".start-block").click();
    await page.clock.runFor(1500);
    await expect(page.locator("#session-subject")).toHaveValue("rtt");
    await expect(page.locator("#praktiese-start-row")).toBeVisible();
    expectNoLeaks(mock);
  });
}
