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
