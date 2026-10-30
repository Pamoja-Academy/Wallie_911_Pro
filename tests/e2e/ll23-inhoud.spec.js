/* LL-23 (29 Okt, Wallie se stemnotas): 'n merk- of lees-blok by 'n TEORIE-vraestel het 'n praktiese Excel-les met
   Engelse formules gewys, en die sessie het "Begin praktiese blok (Office)" aangebied. */
const { test, expect } = require("@playwright/test");
const { boot } = require("./helpers");
const { MockBackend } = require("./mock-backend");

test("LL-23: geen agtergrond-les by 'n blok met 'n vraestel, 'n merk- of 'n voor-eksamen-blok — elke dag tot 20 Nov", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page, { time: new Date("2026-10-29T06:00:00+02:00") });
  await page.goto("/#missie");
  await page.waitForTimeout(800);
  const fout = await page.evaluate(() => {
    const uit = [];
    let gesien = 0;
    let tel = 0;
    for (let d = new Date("2026-10-29T12:00:00+02:00"); d <= new Date("2026-11-20T12:00:00+02:00"); d.setDate(d.getDate() + 1)) {
      const dag = d.toISOString().slice(0, 10);
      gesien += 1;
      const blokke = ((WALLIE.buildDayPlan(dag) || {}).blocks || []).filter((b) => b.kind !== "break");
      blokke.forEach((b) => {
        if ((b.soort === "skrif" && b.werk) || b.soort === "merk" || b.soort === "voor-eksamen") {
          tel += 1;
          const html = WALLIE.lessonUI._kaart(Object.assign({ subjectSlug: b.slug }, b));
          if (html && /Agtergrond \(opsioneel\)/i.test(html)) uit.push(dag + " " + b.id);
        }
      });
    }
    return { uit, gesien, tel };
  });
  expect(fout.gesien).toBeGreaterThan(20);
  expect(fout.tel).toBeGreaterThan(10); /* 18 op 30 Okt: die toets moet werklike blokke nagaan, nie leeg slaag nie */
  expect(fout.uit).toEqual([]);
});

test("LL-23: RTT V2-merkblok (29 Okt 09:00) — geen agtergrond-les, geen Office-knoppie", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page, { time: new Date("2026-10-29T08:59:00+02:00") });
  await page.goto("/#missie");
  const kaart = page.locator('.md-card[data-id="2026-10-29-merk-rtt-v2-c"]');
  await expect(kaart).toBeVisible();
  await expect(kaart).not.toContainText("Agtergrond");
  await expect(page.locator('.md-card[data-id="2026-10-29-reels"]')).not.toContainText("Agtergrond");
  await page.locator('.start-block[data-block="2026-10-29-merk-rtt-v2-c"]').click();
  /* Wag deterministies: óf die omruil-vraag, óf die vraestel-skakel moet eers verskyn (nie 'n onmiddellike telling nie). */
  const nee = page.getByText("Nee, dis nuut vir my").first();
  await expect(nee.or(page.getByRole("link", { name: /Vraestel/ }).first())).toBeVisible();
  if (await nee.isVisible()) await nee.click();
  await expect(page.locator("#session-lesson")).not.toContainText("Agtergrond");
  await expect(page.locator("#session-lesson")).not.toContainText("COUNTIF");
  await expect(page.locator("#praktiese-start-row")).toBeHidden();
});

test("LL-23: Toerisme 30 Okt — merk- en laaste-kyk-blok sonder agtergrond-les; skryfblok wys net die DBE-vraestel", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page, { time: new Date("2026-10-30T07:59:00+02:00") });
  await page.goto("/#missie");
  for (const id of ["2026-10-30-toer-a", "2026-10-30-merk-toer-a", "2026-10-30-laaste-kyk"]) {
    await expect(page.locator(`.md-card[data-id="${id}"]`)).not.toContainText("Agtergrond");
  }
  await page.locator('.start-block[data-block="2026-10-30-toer-a"]').click();
  /* Wag deterministies: óf die omruil-vraag, óf die vraestel-skakel moet eers verskyn (nie 'n onmiddellike telling nie). */
  const nee = page.getByText("Nee, dis nuut vir my").first();
  await expect(nee.or(page.getByRole("link", { name: /Vraestel/ }).first())).toBeVisible();
  if (await nee.isVisible()) await nee.click();
  await expect(page.getByRole("link", { name: /Vraestel/ }).first()).toHaveAttribute("href", /education\.gov\.za/);
  await expect(page.locator("#praktiese-start-row")).toBeHidden();
});

/* 30 Okt: die planne 7-20 Nov. Elke letterkunde- en taal-blok wys sy amptelike DBE-vraestel op die skerm. */
for (const [tyd, id, titel] of [
  ["2026-11-07T08:29:00+02:00", "2026-11-07-afr1-a", "Mei/Junie 2026 Afrikaans HT V1 (taal)"],
  ["2026-11-12T07:59:00+02:00", "2026-11-12-eng2-a", "Mei/Junie 2026 English FAL P2 (literature)"],
  ["2026-11-16T07:59:00+02:00", "2026-11-16-afr2-e", "Mei/Junie 2025 Afrikaans HT V2 (letterkunde)"]
]) {
  test(`plan 7-20 Nov: ${id} wys sy DBE-vraestel en geen agtergrond-les nie`, async ({ page, context }) => {
    const mock = new MockBackend({ mode: "v1" });
    await mock.attach(context);
    await boot(page, { time: new Date(tyd) });
    await page.goto("/#missie");
    const kaart = page.locator(`.md-card[data-id="${id}"]`);
    await expect(kaart).toContainText(titel);
    await expect(kaart).not.toContainText("Agtergrond");
    await page.locator(`.start-block[data-block="${id}"]`).click();
    /* Wag deterministies: óf die omruil-vraag, óf die vraestel-skakel moet eers verskyn (nie 'n onmiddellike telling nie). */
    const nee = page.getByText("Nee, dis nuut vir my").first();
    await expect(nee.or(page.getByRole("link", { name: /Vraestel/ }).first())).toBeVisible();
    if (await nee.isVisible()) await nee.click();
    await expect(page.getByRole("link", { name: /Vraestel/ }).first()).toHaveAttribute("href", /education\.gov\.za\/LinkClick/);
    await expect(page.locator("#session-lesson")).not.toContainText("Agtergrond");
  });
}
