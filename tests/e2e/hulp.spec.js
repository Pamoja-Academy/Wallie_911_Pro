/* Hulp-paneel: knoppie maak oop, kortpad navigeer, Esc en agtergrond maak toe. */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot } = require("./helpers");

test("hulp-paneel: oop, navigeer, toe", async ({ page, context }) => {
  await new MockBackend({ mode: "v1" }).attach(context);
  await boot(page);
  await page.goto("/#missie");

  const paneel = page.locator("#hulp-paneel");
  await expect(paneel).toBeHidden();

  await page.click("#hulp-fab");
  await expect(paneel).toBeVisible();
  await expect(page.locator("#hulp-fab")).toHaveAttribute("aria-expanded", "true");

  await page.keyboard.press("Escape");
  await expect(paneel).toBeHidden();

  await page.click("#hulp-fab");
  await page.click('[data-hulp-view="probleem"]');
  await expect(paneel).toBeHidden();
  await expect(page.locator("#view-probleem")).toHaveClass(/active/);
});

test("hulp-knoppie lê nie bo dialoë of die les-kyker nie", async ({ page, context }) => {
  await new MockBackend({ mode: "v1" }).attach(context);
  await boot(page);
  await page.goto("/#missie");
  const fab = page.locator("#hulp-fab");
  await expect(fab).toBeVisible();

  await page.evaluate(() => document.getElementById("remote-consent-modal").classList.remove("hidden"));
  await expect(fab).toBeHidden();
  await page.evaluate(() => document.getElementById("remote-consent-modal").classList.add("hidden"));
  await expect(fab).toBeVisible();

  await page.evaluate(() => document.body.classList.add("les-open"));
  await expect(fab).toBeHidden();
  await page.evaluate(() => document.body.classList.remove("les-open"));

  const z = await page.evaluate(() => {
    const zi = (s) => +getComputedStyle(document.querySelector(s)).zIndex;
    return { fab: zi("#hulp-fab"), paneel: zi("#hulp-paneel"), modal: zi("#wallie-survey-modal"), les: zi(".les-viewer") || 60 };
  });
  expect(z.fab).toBeLessThan(z.modal);
  expect(z.paneel).toBeLessThan(z.modal);
  expect(z.paneel).toBeLessThan(z.les);
});
