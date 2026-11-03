/* Hulp nou (3 Nov 2026): die klets bo-aan die Hulp-paneel. Die lewendige bot word NOOIT geroep nie:
   page.route beantwoord die klets-URL, of die mock-backend kap dit af (terugval). Elke vraag moet by Pa uitkom (ntfy). */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, runUntil } = require("./helpers");

const URL_KLETS = "https://wallie-hulp.vercel.app/api/klets";

async function maakOop(page) {
  await expect(page.locator("#hulp-fab")).toHaveText("💬 Hulp nou");
  await page.click("#hulp-fab");
  await expect(page.locator("#klets")).toBeVisible();
}

test("klets: vraag → antwoord met aksie; konteks gaan saam; Pa kry 'n kopie", async ({ page, context }) => {
  const backend = new MockBackend({ mode: "v1" });
  await backend.attach(context);
  let liggaam = null;
  await page.route(URL_KLETS, async (route) => {
    liggaam = JSON.parse(route.request().postData() || "{}");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ antwoord: "1. Druk die knoppie hieronder.\n2. Begin die volgende blok.", aksies: ["missie", "onbekend"], ernstig: false, bron: "claude" })
    });
  });
  await boot(page);
  await page.goto("/#sessie");
  await maakOop(page);

  await page.fill("#klets-invoer", "die memo maak nie oop nie");
  await page.click("#klets-stuur");
  const antwoord = page.locator(".klets-hulp").last();
  await expect(antwoord).toContainText("Druk die knoppie hieronder.");
  await expect(antwoord.locator(".klets-aksie")).toHaveCount(1);

  expect(liggaam.vraag).toBe("die memo maak nie oop nie");
  expect(liggaam.konteks.weergawe).toBeTruthy();
  expect(Array.isArray(liggaam.konteks.vandag)).toBe(true);

  await runUntil(page, async () => backend.ntfy.some((n) => /Wallie vra \(Hulp nou\): die memo/.test(n.body)), { label: "Pa se push" });
  await runUntil(page, async () => JSON.stringify(backend.calls).includes("klets_"), { label: "probleem-event in die tou na Pa se konsole" });

  await antwoord.locator(".klets-aksie").click();
  await expect(page.locator("#hulp-paneel")).toBeHidden();
  await expect(page.locator("#view-missie")).toHaveClass(/active/);
});

test("klets: bot onbereikbaar → terugval-antwoord, Pa dringend ingelig", async ({ page, context }) => {
  const backend = new MockBackend({ mode: "v1" });
  await backend.attach(context);
  await boot(page);
  await page.goto("/#missie");
  await maakOop(page);
  await page.fill("#klets-invoer", "die app hang");
  await page.press("#klets-invoer", "Enter");
  /* Eerlik (LL-22): die vraag word gestuur; ons beweer nie dat Pa dit al het nie. */
  await expect(page.locator(".klets-hulp").last()).toContainText(/word (dringend )?aan Pa gestuur/);
  await expect(page.locator(".klets-hulp").last()).not.toContainText(/Pa het/);
  await runUntil(page, async () => backend.ntfy.some((n) => /die app hang/.test(n.body) && n.priority === "4"), { label: "dringende push" });
});

test("klets: model faal (503, bron fout) → vaste kennisbank, nie 'n leë troos nie", async ({ page, context }) => {
  await new MockBackend({ mode: "v1" }).attach(context);
  await page.route(URL_KLETS, (route) =>
    route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ antwoord: "BEDIENER-TROOS", aksies: [], ernstig: true, bron: "fout" }) })
  );
  await boot(page);
  await page.goto("/#missie");
  await maakOop(page);
  await page.fill("#klets-invoer", "die memo maak nie oop nie");
  await page.click("#klets-stuur");
  const a = page.locator(".klets-hulp").last();
  await expect(a).toContainText(/aan Pa gestuur/);
  await expect(a).not.toContainText("BEDIENER-TROOS");
});

test("klets: Foutbank se knoppie maak die klets oop; sigbaar in fokusmodus en op 'n foon", async ({ page, context }) => {
  await new MockBackend({ mode: "v1" }).attach(context);
  await boot(page);
  await page.goto("/#foutbank");
  await page.click("[data-klets-oop]");
  await expect(page.locator("#klets")).toBeVisible();
  await expect(page.locator("#klets-invoer")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#hulp-paneel")).toBeHidden();

  await page.evaluate(() => document.body.classList.add("fokus-sessie"));
  await expect(page.locator("#hulp-fab")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("#hulp-fab")).toBeVisible();
  await page.click("#hulp-fab");
  await expect(page.locator("#klets-invoer")).toBeVisible();
});
