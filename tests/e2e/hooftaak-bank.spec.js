/* Hooftaak uit die vraagbank (lesson-ui.js hoofTaak, stap 4): 
   F6 — items van 'n vraestel wat al geskryf is, is nie meer hooftaak nie (Engels V3 ná 15 Okt 13:00);
   F12 — 'n item kom net in 'n blok as sy tyd in die blok se minute pas (anders die blok se eie titel).
   Klok vals; alle netwerk onderskep (mock-backend). */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, expectNoLeaks } = require("./helpers");

async function hoof(page, blok) {
  return page.evaluate((b) => {
    const h = WALLIE.lessonUI.hoofTaak(b, null, 0);
    return { soort: h.soort, itemId: h.itemId || null, tekst: h.tekst };
  }, blok);
}

const ENGELS = { id: "t-engels", subjectSlug: "engels", kind: "geel", title: "Engels — oefen", minutes: 150 };
const AFRIKAANS = { id: "t-afr", subjectSlug: "afrikaans", kind: "geel", title: "Afrikaans — oefen", minutes: 150 };

test("F6: Engels V3-items is hooftaak voor die eksamen, nie ná 13:00 op die eksamendag nie; Afrikaans V3 bly", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  await boot(page, { time: new Date("2026-10-15T08:00:00+02:00") });
  await page.goto("/#missie");
  /* Voor die eksamen en tydens (09:00 + 4 u = 13:00 nog nie verby nie) */
  let h = await hoof(page, ENGELS);
  expect(h.soort).toBe("item");
  expect(h.itemId).toMatch(/^eng-v3-/);

  /* 13:01 op die eksamendag: die Engels V3-items is uit */
  await page.clock.setSystemTime(new Date("2026-10-15T13:01:00+02:00"));
  h = await hoof(page, ENGELS);
  expect(h.soort, "Engels V3 is geskryf").not.toBe("item");
  expect(h.itemId).toBeNull();
  /* Afrikaans V3 skryf eers 20 Okt */
  h = await hoof(page, AFRIKAANS);
  expect(h.soort).toBe("item");
  expect(h.itemId).toMatch(/^afr-v3-/);

  /* Ná Afrikaans V3 (20 Okt 13:01) is ook die Afrikaans V3-items uit */
  await page.clock.setSystemTime(new Date("2026-10-20T13:01:00+02:00"));
  h = await hoof(page, AFRIKAANS);
  expect(h.soort).not.toBe("item");
  expectNoLeaks(mock);
});

test("F6: 'n item wat vas in die rooster staan (blok.item) word nie deur die eksamen-filter geraak nie", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  await boot(page, { time: new Date("2026-10-21T08:00:00+02:00") });
  await page.goto("/#missie");
  const h = await hoof(page, Object.assign({}, AFRIKAANS, { item: "afr-v3-A1" }));
  expect(h.soort).toBe("item");
  expect(h.itemId).toBe("afr-v3-A1");
  expectNoLeaks(mock);
});

test("F12: bank-keuse kies net items wie se tyd in die blok pas; pas geen een nie → die blok se eie titel", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  await boot(page, { time: new Date("2026-10-14T08:00:00+02:00") });
  await page.goto("/#missie");
  /* Die 15-min-blok het nie 'n ±80-min-opstel as hooftaak nie */
  let h = await hoof(page, { id: "t-foutlog", subjectSlug: "engels", kind: "geel", soort: "les", title: "Engels — Foutlog hardop lees", minutes: 15 });
  expect(h.soort).toBe("blok");
  expect(h.itemId).toBeNull();
  expect(h.tekst).toBe("Engels — Foutlog hardop lees");
  /* 'n Blok wat groot genoeg is, kry steeds 'n item wat pas */
  for (const minute of [40, 60, 150]) {
    h = await hoof(page, Object.assign({}, ENGELS, { minutes: minute }));
    expect(h.soort, `${minute} min`).toBe("item");
    const tyd = await page.evaluate((id) => {
      const it = window.VRAEBANK_V3.find((i) => i.id === id);
      return Eksamenmodus.tydMin(it, it.vak) || it.tyd_min;
    }, h.itemId);
    expect(tyd, `${h.itemId} pas in ${minute} min`).toBeLessThanOrEqual(minute);
  }
  /* RTT: ook daar pas die gekose item in die blok (3 min) */
  h = await hoof(page, { id: "t-rtt", subjectSlug: "rtt", kind: "geel", title: "RTT — kort", minutes: 3 });
  if (h.soort === "item") {
    const tyd = await page.evaluate((id) => {
      const it = window.VRAEBANK_RTT_V1.find((i) => i.id === id);
      return Eksamenmodus.tydMin(it, "rtt");
    }, h.itemId);
    expect(tyd).toBeLessThanOrEqual(3);
  } else {
    expect(h.soort).toBe("blok");
  }
  expectNoLeaks(mock);
});

test("F9: Wisk. Gel. sonder bank wys 'n gaping-vraag van ±20 punte (±24 min), 150 punte per 180 min", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  await boot(page, { time: new Date("2026-10-21T08:00:00+02:00") });
  await page.goto("/#missie");
  const h = await hoof(page, { id: "t-wg", subjectSlug: "wiskgelett", kind: "groen", title: "Wisk. Gel. — oefen", minutes: 60 });
  expect(h.soort).toBe("gaping");
  expect(h.tekst).toContain("±20 punte (±24 min)");
  expect(await page.evaluate(() => Eksamenmodus.tydMin({ vak: "wiskgelett", punte: 20 }))).toBe(24);
  expectNoLeaks(mock);
});
