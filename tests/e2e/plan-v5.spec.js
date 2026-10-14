/* Plan v5 (15-19 Okt): vaste dagplanne vir Do 15 (Engels V3-eksamendag) tot Ma 19 Okt (dag voor Afrikaans V3).
   Geen Gasvryheid/Toerisme/RTT-rotasie nie. Elke studieblok se hooftaak is 'n eksamenvlak-item (`item`)
   of eie eksamenwerk, nooit sy agtergrond-les-kaart nie. Klok vals; alle netwerk onderskep (mock-backend). */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, expectNoLeaks } = require("./helpers");

const VERBODE = ["gasvryheid", "toerisme", "rtt"];

const VIEWPORTS = [
  { name: "laptop", label: "1366x768", viewport: { width: 1366, height: 768 } },
  { name: "foon", label: "390x844", viewport: { width: 390, height: 844 } }
];

/* [suffix, start, end, item?]  (item = die eksamenvlak-item wat die hooftaak moet wees) */
const DAE = [
  {
    dag: "2026-10-15",
    tyd: "2026-10-15T07:20:00+02:00",
    blokke: [
      ["opstaan", "06:45", "07:15"],
      ["formaat", "07:15", "07:35"],
      ["tas", "07:35", "08:00"],
      ["eksamen", "09:00", "11:30"],
      ["rus", "11:30", "13:30"],
      ["terugskou", "13:30", "13:50"],
      ["pouse1", "13:50", "14:00"],
      ["afr-b1", "14:00", "14:40", "afr-v3-B1"],
      ["merk-afr-b1", "14:40", "15:00"],
      ["pouse2", "15:00", "15:15"],
      ["afr-b2", "15:15", "15:55", "afr-v3-B2"],
      ["merk-afr-b2", "15:55", "16:15"],
      ["klaar", "16:15", "16:15"]
    ]
  },
  {
    dag: "2026-10-16",
    tyd: "2026-10-16T08:05:00+02:00",
    blokke: [
      ["opstaan", "07:30", "08:00"],
      ["afr-a1", "08:00", "09:40", "afr-v3-A1"],
      ["pouse1", "09:40", "10:00"],
      ["merk-afr-a1", "10:00", "10:30"],
      ["afr-b3", "10:30", "11:10", "afr-v3-B3"],
      ["merk-afr-b3", "11:10", "11:30"],
      ["middag", "11:30", "12:30"],
      ["wg-v1", "12:30", "13:30"],
      ["merk-wg-v1", "13:30", "13:50"],
      ["klaar", "13:50", "13:50"]
    ]
  },
  {
    dag: "2026-10-17",
    tyd: "2026-10-17T08:35:00+02:00",
    blokke: [
      ["opstaan", "08:00", "08:30"],
      ["afr-a2", "08:30", "10:10", "afr-v3-A2"],
      ["pouse1", "10:10", "10:30"],
      ["merk-afr-a2", "10:30", "11:00"],
      ["afr-b4", "11:00", "11:40", "afr-v3-B4"],
      ["merk-afr-b4", "11:40", "12:00"],
      ["middag", "12:00", "13:00"],
      ["wg-v1", "13:00", "14:00"],
      ["merk-wg-v1", "14:00", "14:20"],
      ["klaar", "14:20", "14:20"]
    ]
  },
  {
    dag: "2026-10-18",
    tyd: "2026-10-18T08:50:00+02:00",
    blokke: [
      ["opstaan", "08:00", "08:45"],
      ["afr-b5", "08:45", "09:25", "afr-v3-B5"],
      ["merk-afr-b5", "09:25", "09:45"],
      ["pouse1", "09:45", "10:00"],
      ["foutlog", "10:00", "10:30"],
      ["middag", "10:30", "13:00"],
      ["wg-v1", "13:00", "14:00"],
      ["merk-wg-v1", "14:00", "14:20"],
      ["klaar", "14:20", "14:20"]
    ]
  },
  {
    dag: "2026-10-19",
    tyd: "2026-10-19T08:05:00+02:00",
    blokke: [
      ["opstaan", "07:30", "08:00"],
      ["afr-a1-weer", "08:00", "09:40", "afr-v3-A1"],
      ["pouse1", "09:40", "10:00"],
      ["merk-afr-a1-weer", "10:00", "10:30"],
      ["formaat", "10:30", "11:00"],
      ["middag", "11:00", "12:00"],
      ["tas", "12:00", "12:30"],
      ["klaar", "12:30", "12:30"]
    ]
  }
];

async function openPlan(page, context, iso) {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page, { time: new Date(iso) });
  await page.goto("/#missie");
  await page.clock.runFor(1500);
  return mock;
}

const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

/* Elke studie-kaart (nie pouse nie): hooftaak, hooftaak-soort en die agtergrond-les. */
async function kaarte(page) {
  return page.locator("#block-list .md-card:not(.kind-break)").evaluateAll((els) =>
    els.map((el) => ({
      id: el.dataset.id,
      hoof: el.querySelector(".md-hoof") ? el.querySelector(".md-hoof").textContent : "",
      hoofSoort: el.querySelector(".md-hoof") ? el.querySelector(".md-hoof").dataset.soort : "",
      les: el.querySelector(".md-concept") ? el.querySelector(".md-concept").textContent : ""
    }))
  );
}

for (const vp of VIEWPORTS) {
  test.describe(`plan v5 @ ${vp.label}`, () => {
    test.use({ viewport: vp.viewport });

    for (const { dag, tyd, blokke } of DAE) {
      test(`${dag}: verwagte blokke en tye, hooftaak is eksamenwerk, items maak die regte item oop`, async ({ page, context }) => {
        const mock = await openPlan(page, context, tyd);

        /* Geen Gasvryheid/Toerisme/RTT-blokke nie, en presies die verwagte blokke in volgorde */
        const state = await page.evaluate(() =>
          WALLIE.app.state().blocks.map((b) => ({ id: b.id, slug: b.subjectSlug, start: b.start, end: b.end, item: b.item || null }))
        );
        for (const s of VERBODE) expect(state.map((b) => b.slug), `${dag}: geen ${s}`).not.toContain(s);
        expect(state.map((b) => b.id)).toEqual(blokke.map(([suffix]) => `${dag}-${suffix}`));
        const lys = await page.locator("#block-list").innerText();
        expect(lys).not.toMatch(/Gasvryheid|Toerisme|RTT \(CAT\)/);

        /* Elke blok se id en tye is op die Missie-skerm */
        for (const [suffix, start, end, item] of blokke) {
          const kaart = page.locator(`#block-list .md-card[data-id="${dag}-${suffix}"]`);
          await expect(kaart, `${dag}-${suffix} op die skerm`).toHaveCount(1);
          await expect(kaart.locator(".md-time")).toHaveText(`${start}–${end}`);
          const b = state.find((x) => x.id === `${dag}-${suffix}`);
          expect(b.item, `${dag}-${suffix}: item`).toBe(item || null);
        }

        /* Hooftaak is eksamenwerk, nooit die agtergrond-les nie */
        const lyst = await kaarte(page);
        expect(lyst.length, `${dag}: studie-kaarte`).toBeGreaterThan(0);
        for (const k of lyst) {
          expect(k.les, `${k.id}: les gemerk as agtergrond`).toContain("Agtergrond (opsioneel)");
          const titel = k.les.replace("Agtergrond (opsioneel)", "").trim();
          expect(titel.length, `${k.id}: konseptitel`).toBeGreaterThan(3);
          expect(k.hoof, `${k.id}: hooftaak gewys`).toContain("Hooftaak");
          expect(k.hoof, `${k.id}: hooftaak is nie die agtergrondkaart nie`).not.toContain(titel);
          const item = blokke.find(([suffix]) => `${dag}-${suffix}` === k.id)[3];
          expect(k.hoofSoort, `${k.id}: hooftaak-soort`).toBe(item ? "item" : "blok");
        }

        /* Blokke met 'n item: "Maak item oop" open die regte item in Skryfwerk */
        for (const [suffix, , , item] of blokke.filter((b) => b[3])) {
          const kaart = page.locator(`#block-list .md-card[data-id="${dag}-${suffix}"]`);
          const knoppie = kaart.locator(".open-item");
          await expect(knoppie, `${suffix}: Maak item oop`).toHaveText("Maak item oop");
          await expect(knoppie).toHaveAttribute("data-item", item);
          await knoppie.scrollIntoViewIfNeeded();
          await knoppie.click();
          await page.clock.runFor(500);
          await expect(page.locator("#view-skryfwerk")).toHaveClass(/active/);
          await expect(page.locator(".sw-titel"), `${suffix}: regte item oop`).toContainText(item.replace(/^afr-v3-/, ""));
          await page.evaluate(() => WALLIE.app.showView("missie"));
          await page.clock.runFor(500);
        }

        expect(await noOverflow(page), `${dag}: geen horisontale oorloop nie`).toBe(true);
        expectNoLeaks(mock);
      });
    }

    test("16 Okt 08:05: 'Maak item oop' op die Volgende-kaart open die regte item (F1)", async ({ page, context }) => {
      const mock = await openPlan(page, context, "2026-10-16T08:05:00+02:00");
      const knoppie = page.locator("#next-up .open-item");
      await expect(knoppie).toHaveCount(1);
      await expect(knoppie).toHaveAttribute("data-item", "afr-v3-A1");
      await knoppie.scrollIntoViewIfNeeded();
      await knoppie.click();
      await page.clock.runFor(500);
      await expect(page.locator("#view-skryfwerk")).toHaveClass(/active/);
      await expect(page.locator(".sw-titel")).toContainText("A1");
      expectNoLeaks(mock);
    });

    test("15 Okt 07:20: die formaat-blok se hooftaak is sy eie titel", async ({ page, context }) => {
      const mock = await openPlan(page, context, "2026-10-15T07:20:00+02:00");
      const kaart = page.locator('#block-list .md-card[data-id="2026-10-15-formaat"]');
      await expect(kaart).toBeVisible();
      await expect(kaart.locator(".md-hoof")).toHaveAttribute("data-soort", "blok");
      await expect(kaart.locator(".md-hoof")).toContainText("Laaste kyk: formaatkaarte (net lees, geen nuwe werk)");
      await expect(kaart.locator(".open-item")).toHaveCount(0);
      /* Die volgende blok op die tuisskerm is dieselfde formaat-blok, met dieselfde hooftaak */
      await expect(page.locator("#next-up .next-hoof")).toHaveAttribute("data-soort", "blok");
      await expect(page.locator("#next-up .next-hoof")).toContainText("Laaste kyk: formaatkaarte");
      expect(await noOverflow(page)).toBe(true);
      expectNoLeaks(mock);
    });
  });
}
