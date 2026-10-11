/* Plan v4 (Hanno, 11 Okt): So 11 en Ma 12 Okt is RTT V1-fokusdae met EGTE DBE-vraestelle.
   Geen WG/Gasvryheid/Afrikaans/Toerisme; die RTT-werkblokke wys die praktiese-modus-knoppie EN die
   vraestel-paneel (vraestel, datalêers, memo). (Was plan v3: dieselfde kontrole, nuwe blokke.) */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, runUntil, expectNoLeaks } = require("./helpers");

for (const [dag, tyd, blokId, titel] of [
  ["2026-10-11", "2026-10-11T11:05:00+02:00", "2026-10-11-diagnose", "Diagnose (20 min, getimed)"],
  ["2026-10-12", "2026-10-12T08:20:00+02:00", "2026-10-12-proef-nov24", "Volledige proef: Nov 2024 V1"]
]) {
  test(`plan v4 op ${dag}: RTT V1-fokus, geen WG/Gasvryheid/Afrikaans/Toerisme; praktiese knoppie + vraestel`, async ({ page, context }) => {
    const mock = new MockBackend({ mode: "v1" });
    await mock.attach(context);
    await boot(page, { time: new Date(tyd) });
    await page.goto("/#missie");
    await page.clock.runFor(1500);
    const lys = await page.locator("#block-list").innerText();
    expect(lys).not.toMatch(/Wiskundige Geletterdheid|Gasvryheid|Afrikaans|Toerisme/);
    const blok = page.locator(`#block-list .md-card[data-id="${blokId}"]`);
    await expect(blok).toBeVisible();
    await expect(blok).toContainText(titel);
    /* Die kaart sê watter vraestel en hoeveel punte, nie net ’n les-konsep nie */
    await expect(blok).toContainText("punte");
    await blok.locator(".start-block").click();
    await runUntil(page, async () => mock.byKind("start").length === 1, { label: "sessie begin" });
    await expect(page.locator("#session-subject")).toHaveValue("rtt");
    await expect(page.locator("#praktiese-start-row")).toBeVisible();
    /* Die blok gee vir Wallie die regte lêers */
    const paneel = page.locator("#session-werk");
    await expect(paneel).toBeVisible();
    await expect(paneel.locator('.werk-hoof [data-werk="vraestel"]')).toHaveAttribute("href", /^https:\/\/www\.education\.gov\.za\//);
    await expect(paneel.locator('.werk-hoof [data-werk="data"]')).toHaveAttribute("href", /^https:\/\/www\.education\.gov\.za\//);
    expectNoLeaks(mock);
  });
}
