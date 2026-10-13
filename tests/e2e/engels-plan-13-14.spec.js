/* Engels V3 vaste dagplan (Hanno, 13 Okt): Di 13 en Wo 14 wys die Engels-blokke,
   nie die verstek Gasvryheid/Afrikaans/RTT-rotasie nie.
   Die proefeksamen is soort "skrif" (papier): tab weg sluit nie die oortjie nie. */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, runUntil, hideTab, showTab, expectNoLeaks } = require("./helpers");

const VERBODE = ["gasvryheid", "afrikaans", "rtt", "toerisme", "wiskgelett"];

async function openPlan(page, context, iso) {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page, { time: new Date(iso) });
  await page.goto("/#missie");
  await page.clock.runFor(1500);
  return mock;
}

test("13 Okt 14:05 wys C1 Dagboekinskrywings en geen Gasvryheid/Afrikaans/RTT-rotasie", async ({ page, context }) => {
  const mock = await openPlan(page, context, "2026-10-13T14:05:00+02:00");
  const slugs = await page.evaluate(() => WALLIE.app.state().blocks.map((b) => b.subjectSlug));
  for (const s of VERBODE) expect(slugs, `geen ${s}`).not.toContain(s);
  const lys = await page.locator("#block-list").innerText();
  expect(lys).not.toMatch(/Gasvryheid|Afrikaans|Toerisme|Wiskundige Geletterdheid/);
  expect(lys).not.toMatch(/RTT \(CAT\)/);
  const blok = page.locator('#block-list .md-card[data-id="2026-10-13-c1"]');
  await expect(blok).toBeVisible();
  await expect(blok).toContainText("Dagboekinskrywings");
  await expect(blok).toContainText("14:00");
  await expect(blok).toContainText("14:30");
  expectNoLeaks(mock);
});

test("14 Okt 13:05 wys die proefeksamen en die oortjie-slot vuur nie", async ({ page, context }) => {
  const mock = await openPlan(page, context, "2026-10-14T13:05:00+02:00");
  const slugs = await page.evaluate(() => WALLIE.app.state().blocks.map((b) => b.subjectSlug));
  for (const s of VERBODE) expect(slugs, `geen ${s}`).not.toContain(s);
  const blok = page.locator('#block-list .md-card[data-id="2026-10-14-proef"]');
  await expect(blok).toBeVisible();
  await expect(blok).toContainText("Engels V3 proefeksamen - Pa gee die vraestel");
  await expect(blok).toContainText("13:00");
  const soort = await page.evaluate(() => WALLIE.app.state().blocks.find((b) => b.id === "2026-10-14-proef").soort);
  expect(soort).toBe("skrif");

  await blok.locator(".start-block").click();
  await runUntil(page, async () => mock.byKind("start").length === 1, { label: "proef begin" });
  await expect(page.locator("#session-subject")).toHaveValue("engels");
  await expect(page.locator("#praktiese-start-row")).toBeHidden();
  /* Verby die 8 s begin-grasie, dan drie tab-weg — 'n gewone toets sou nou sluit */
  await page.clock.runFor(10000);
  for (let i = 0; i < 3; i++) {
    await hideTab(page);
    await page.clock.runFor(20000);
    await showTab(page);
    await page.clock.runFor(5000);
  }
  expect(mock.byKind("warn")).toHaveLength(0);
  expect(mock.byKind("lock")).toHaveLength(0);
  await expect(page.locator("#lock-box")).toBeHidden();
  await expect(page.locator("#warn-display")).toHaveText("Waarskuwings: 0 / 3");
  expectNoLeaks(mock);
});

test("14 Okt 08:35 wys B1 Aansoekbrief 08:30-09:10, C1 11:00-11:30 en geen A1/A3", async ({ page, context }) => {
  const mock = await openPlan(page, context, "2026-10-14T08:35:00+02:00");
  const slugs = await page.evaluate(() => WALLIE.app.state().blocks.map((b) => b.subjectSlug));
  for (const s of VERBODE) expect(slugs, `geen ${s}`).not.toContain(s);
  const b1 = page.locator('#block-list .md-card[data-id="2026-10-14-b1"]');
  await expect(b1).toBeVisible();
  await expect(b1).toContainText("Aansoekbrief");
  await expect(b1).toContainText("08:30");
  await expect(b1).toContainText("09:10");
  const c1 = page.locator('#block-list .md-card[data-id="2026-10-14-c1"]');
  await expect(c1).toContainText("11:00");
  await expect(c1).toContainText("11:30");
  await expect(page.locator('#block-list .md-card[data-id="2026-10-14-a1"]')).toHaveCount(0);
  await expect(page.locator('#block-list .md-card[data-id="2026-10-14-a3"]')).toHaveCount(0);
  expectNoLeaks(mock);
});
