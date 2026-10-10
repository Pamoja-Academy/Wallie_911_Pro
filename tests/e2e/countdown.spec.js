/* Doelwit 4: die aftelling is tot die EERSTE EGTE VRAESTEL — RTT/CAT praktiese, Di 13 Okt 2026 09:00.
   Ma 12 Okt is die laaste voorbereidingsdag en mag nie as eksamenbegin tel nie. Plus: toestemming word nie weer gevra nie. */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, shot } = require("./helpers");

async function openAt(page, context, iso) {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page, { time: new Date(iso) });
  await page.goto("/#missie");
  await page.clock.runFor(1500);
  return mock;
}

test("Ma 12 Okt 09:00 (laaste voorbereidingsdag): nog ’n volle dag tot die CAT-praktiese", async ({ page, context }) => {
  await openAt(page, context, "2026-10-12T09:00:00+02:00");
  /* 09:00:01,5 -> nog 23:59:58 tot Di 09:00 */
  await expect(page.locator("#cd-days")).toHaveText("00");
  await expect(page.locator("#cd-hours")).toHaveText("23");
  await expect(page.locator("#cd-mins")).toHaveText("59");
  await expect(page.locator("#cd-status")).toContainText("tot RTT/CAT-praktiese (Di 13 Okt)");
  await expect(page.locator("#cd-status")).toContainText("Ma 12 Okt is die laaste voorbereidingsdag");
  await expect(page.locator("#countdown-clock .stadium-eyebrow")).toContainText("Di 13 Okt · 09:00");
  await page.screenshot({ path: shot("13-aftelling-12-okt-voorbereiding.png") });
});

test("Di 13 Okt 08:59:30 en 09:00:01: aftelling eindig by die eerste vraestel", async ({ page, context }) => {
  await openAt(page, context, "2026-10-13T08:59:30+02:00");
  await expect(page.locator("#cd-days")).toHaveText("00");
  await expect(page.locator("#cd-hours")).toHaveText("00");
  await expect(page.locator("#cd-mins")).toHaveText("00");
  await page.clock.runFor(31000);
  await expect(page.locator("#cd-status")).toContainText("Kickoff — die eerste vraestel is hier");
  await expect(page.locator("#cd-secs")).toHaveText("00");
});

test("Vandag (9 Okt 09:00): 3 dae 23 uur 59 min tot Di 13 Okt 09:00", async ({ page, context }) => {
  await openAt(page, context, "2026-10-09T09:00:00+02:00");
  await expect(page.locator("#cd-days")).toHaveText("03");
  await expect(page.locator("#cd-hours")).toHaveText("23");
});

test("toestemming: bestaande sleutel geld, Wallie kry nie weer die toestemming-skerm nie", async ({ page, context }) => {
  const mock = await openAt(page, context, "2026-10-09T09:05:00+02:00");
  expect(await page.evaluate(() => WALLIE.REMOTE.consentKey)).toBe("wallie911_remote_consent_v2");
  expect(await page.evaluate(() => localStorage.getItem("wallie911_remote_consent_v2"))).toBe("1");
  await page.evaluate(() => WALLIE.app.startSession({ subjectSlug: "rtt", minutes: 20, task: "toets" }));
  await expect(page.locator("#remote-consent-modal")).toBeHidden();
  await page.clock.runFor(2000);
  expect(mock.calls.some((c) => c.body?.p?.kind === "start")).toBe(true);
});

test("toestemming: heeltemal nuwe toestel word steeds eenmalig gevra (gedrag onveranderd)", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page, { consent: false, time: new Date("2026-10-09T09:05:00+02:00") });
  await page.goto("/#sessie");
  page.on("dialog", (d) => d.dismiss());
  await page.locator("#start-session").click();
  await expect(page.locator("#remote-consent-modal")).toBeVisible();
});
