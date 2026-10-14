/* Hooftaak = eksamenwerk; die les is AGTERGROND (opsioneel) en bly op elke kaart, vir ELKE vak
   (klok vals, datums uit die skedule). PR 2 (14 Okt): die les was voorheen die hoofsaak — nou is dit die
   eksamenvlak-item/vraestel, en die les-kaart staan daaronder as "Agtergrond (opsioneel)".
   Steeds vasgevat: die les is sigbaar (nie in 'n toe <details> weggesteek nie).
   Alle netwerk word onderskep (mock-backend). */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, runUntil, shot, expectNoLeaks } = require("./helpers");

/* 9 Okt dek elke vak in een dag (WG, Gasvryheid, Afrikaans, RTT, Engels, Toerisme, foutbank-slot);
   11 Okt is die DBE-werkdag (RTT met vraestelle + Engels). */
const DAE = [
  { dag: "2026-10-09", naam: "alle-vakke", tyd: "2026-10-09T09:05:00+02:00" },
  { dag: "2026-10-11", naam: "dbe-werkdag", tyd: "2026-10-11T11:00:00+02:00" }
];
const VIEWPORTS = [
  { name: "laptop", label: "1366x768", viewport: { width: 1366, height: 768 } },
  { name: "foon", label: "390x844", viewport: { width: 390, height: 844 } }
];

/* Elke studie-kaart (dus nie die pouse-kaarte nie) met sy prent, opskrif en lesreël. */
async function kaarte(page) {
  return page.locator("#block-list .md-card:not(.kind-break)").evaluateAll((els) =>
    els.map((el) => {
      const img = el.querySelector(".md-thumb img");
      const knop = el.querySelector(".start-block");
      return {
        id: el.dataset.id,
        slug: knop ? knop.dataset.slug : "",
        konsep: knop ? knop.dataset.concept || "" : "",
        vak: el.querySelector("h3") ? el.querySelector("h3").textContent : "",
        hoof: el.querySelector(".md-hoof") ? el.querySelector(".md-hoof").textContent : "",
        hoofSoort: el.querySelector(".md-hoof") ? el.querySelector(".md-hoof").dataset.soort : "",
        les: el.querySelector(".md-concept") ? el.querySelector(".md-concept").textContent : "",
        werk: el.querySelector(".md-werk") ? el.querySelector(".md-werk").textContent : "",
        prentGelaai: !!img && img.complete && img.naturalWidth > 0,
        prentBron: img ? img.getAttribute("src") : ""
      };
    })
  );
}

for (const vp of VIEWPORTS) {
  test.describe(`hooftaak + agtergrond-les @ ${vp.label}`, () => {
    test.use({ viewport: vp.viewport });

    for (const { dag, naam, tyd } of DAE) {
      test(`${dag} (${naam}): elke kaart wys 'n hooftaak (eksamenvlak), en die les as agtergrond`, async ({ page, context }) => {
        const mock = new MockBackend({ mode: "v1" });
        await mock.attach(context);
        await boot(page, { time: new Date(tyd) });
        await page.goto("/#missie");
        await page.clock.runFor(1500);
        /* Die prente is loading="lazy": rol elke kaart in sig, net soos Wallie doen, en wag dan dat sy
           prent klaar laai. Die klok is vals, dus moet die wag die klok self aandryf (page.waitForFunction
           se peiling vries saam met die klok). */
        const prente = page.locator("#block-list .md-card:not(.kind-break) .md-thumb img");
        const aantalPrente = await prente.count();
        for (let i = 0; i < aantalPrente; i++) {
          const prent = prente.nth(i);
          await prent.scrollIntoViewIfNeeded();
          await runUntil(page, () => prent.evaluate((el) => el.complete && el.naturalWidth > 0), {
            label: `prent ${i + 1} van ${aantalPrente} gelaai`,
            max: 10000
          });
        }
        await page.evaluate(() => window.scrollTo(0, 0));

        const lys = await kaarte(page);
        expect(lys.length, `${dag}: studie-kaarte op die skerm`).toBeGreaterThan(3);
        for (const k of lys) {
          expect(k.prentGelaai, `${k.id} (${k.vak}): prent gelaai (${k.prentBron})`).toBe(true);
          expect(k.prentBron, `${k.id}: prent kom uit die vak se les-gids`).toMatch(/^assets\/img\/lessons\/[a-z]+\/[a-z0-9-]+\.svg$/);
          expect(k.les, `${k.id} (${k.vak}): les is gemerk as agtergrond`).toContain("Agtergrond (opsioneel)");
          expect(k.konsep, `${k.id}: 'n konsep is gekies`).toBeTruthy();
          const titel = k.les.replace("Agtergrond (opsioneel)", "").trim();
          expect(titel.length, `${k.id}: konseptitel sigbaar`).toBeGreaterThan(3);
          /* Die hooftaak is eksamenwerk, nooit die agtergrondkaart nie */
          expect(k.hoof, `${k.id}: hooftaak is gewys`).toContain("Hooftaak");
          expect(k.hoofSoort, `${k.id}: hooftaak-soort`).toMatch(/^(item|werk|blok|gaping)$/);
          expect(k.hoof.replace("Hooftaak", "").trim().length, `${k.id}: hooftaak het teks`).toBeGreaterThan(3);
          expect(k.hoof, `${k.id}: hooftaak is nie die agtergrondkaart nie`).not.toContain(titel);
          expect(k.les, `${k.id}: geen "Ekstra: kort les" meer nie`).not.toContain("Ekstra");
        }
        /* Al die vakke van die dag kom voor, en nooit LO nie */
        const vakke = [...new Set(lys.map((k) => k.vak))];
        expect(vakke.length, `${dag}: meer as een vak op die skerm`).toBeGreaterThan(1);
        const bladTeks = await page.locator("#view-missie").innerText();
        expect(bladTeks).not.toMatch(/\bLO\b|Lewensori/i);

        /* Volgende-kaart: prent, konseptitel EN die 3 wenke */
        await expect(page.locator("#next-up .next-img img")).toBeVisible();
        await expect(page.locator("#next-up .next-hoof")).toContainText("Hooftaak");
        await expect(page.locator("#next-up .next-agtergrond")).toContainText("Agtergrond (opsioneel)");
        await expect(page.locator("#next-up .next-concept")).toBeVisible();
        await expect(page.locator("#next-up .next-cues > li")).toHaveCount(3);

        await page.screenshot({ path: shot(`les-terug/tuis-${dag}-${vp.name}.png`), fullPage: true });
        expectNoLeaks(mock);
      });
    }

    test("9 Okt: elke vak se blok wys sy les oop op die sessieskerm", async ({ page, context }) => {
      const mock = new MockBackend({ mode: "v1" });
      await mock.attach(context);
      await boot(page, { time: new Date("2026-10-09T09:05:00+02:00") });
      await page.goto("/#missie");
      await page.clock.runFor(1500);

      const lys = await kaarte(page);
      /* Een blok per vak (die eerste van elke vak) om die lopie kort te hou */
      const perVak = [];
      for (const k of lys) if (k.slug && !perVak.some((x) => x.slug === k.slug)) perVak.push(k);
      expect(perVak.length, "meer as drie vakke op 9 Okt").toBeGreaterThan(3);

      let begin = 0;
      for (const k of perVak) {
        await page.locator(`#block-list .md-card[data-id="${k.id}"] .start-block`).click();
        if (k.slug === "foutbank") {
          /* Die foutbank-blok spring na die Foutbank-skerm, nie na ’n sessie nie */
          await expect(page.locator("#view-foutbank")).toHaveClass(/active/);
          await page.evaluate(() => WALLIE.app.showView("missie"));
          await page.clock.runFor(500);
          continue;
        }
        begin += 1;
        await runUntil(page, async () => mock.byKind("start").length === begin, { label: `sessie ${k.slug}` });
        /* Die les is dadelik sigbaar: prent, titel en wenke, sonder om iets oop te klik */
        const les = page.locator("#session-lesson");
        await expect(les.locator(".session-lesson-img img")).toBeVisible();
        await expect(les.locator("h3")).toHaveText(k.les.replace("Agtergrond (opsioneel)", "").trim());
        /* Die sessie-taak is die hooftaak (eksamenvlak), nie die agtergrondkaart nie */
        const taak = await page.locator("#session-task").inputValue();
        expect(taak, `${k.id}: sessie-taak`).not.toContain(k.les.replace("Agtergrond (opsioneel)", "").trim());
        await expect(les.locator(".next-cues > li").first()).toBeVisible();
        await expect(les.locator("details")).toHaveCount(0);
        await expect(les.locator(".panel-head h2")).toHaveText("Agtergrond (opsioneel)");
        await page.locator("#end-session").click();
        await runUntil(page, async () => mock.byKind("end").length === begin, { label: `sessie klaar ${k.slug}` });
        await page.evaluate(() => {
          document.querySelector("#wallie-survey-modal").classList.add("hidden");
          WALLIE.app.showView("missie");
        });
        await page.clock.runFor(500);
      }
      expectNoLeaks(mock);
    });

    test("11 Okt: die vraestel kom BY die les, en die memo bly gesluit tydens die toets", async ({ page, context }) => {
      const mock = new MockBackend({ mode: "v1" });
      await mock.attach(context);
      await boot(page, { time: new Date("2026-10-11T11:00:00+02:00") });
      await page.goto("/#missie");
      await page.clock.runFor(1500);

      /* Die werk-blok se kaart: les bo, vraestel daaronder */
      const kaart = page.locator('#block-list .md-card[data-id="2026-10-11-diagnose"]');
      await expect(kaart.locator(".md-concept")).toContainText("Agtergrond (opsioneel)");
      await expect(kaart.locator(".md-hoof")).toContainText("Hooftaak");
      await expect(kaart.locator(".md-werk")).toContainText("Vraestel");
      await expect(kaart.locator(".md-werk")).toContainText("punte");
      const volgorde = await kaart.evaluate((el) => {
        const kids = [...el.querySelectorAll(".md-body > p")];
        return kids.map((p) => p.className);
      });
      expect(volgorde.indexOf("md-hoof"), "hooftaak staan bo die vraestel").toBeLessThan(volgorde.indexOf("md-werk"));
      expect(volgorde.indexOf("md-werk"), "die agtergrond-les staan onder die vraestel").toBeLessThan(volgorde.indexOf("md-concept"));

      await kaart.locator(".start-block").click();
      await runUntil(page, async () => mock.byKind("start").length === 1, { label: "sessie begin" });

      /* Die les is oop ... */
      await expect(page.locator("#session-lesson .session-lesson-img img")).toBeVisible();
      await expect(page.locator("#session-lesson .next-cues > li").first()).toBeVisible();
      await expect(page.locator("#session-lesson details")).toHaveCount(0);

      /* ... en die vraestel-paneel is onveranderd: drie knoppies, memo gesluit tydens die toets */
      const hoof = page.locator("#session-werk .werk-hoof");
      await expect(hoof.locator('[data-werk="vraestel"]')).toHaveAttribute("href", /^https:\/\/www\.education\.gov\.za\//);
      await expect(hoof.locator('[data-werk="data"]')).toHaveAttribute("href", /^https:\/\/www\.education\.gov\.za\//);
      await expect(hoof.locator('[data-werk="memo"]')).toBeDisabled();
      await expect(page.locator("#session-werk")).toContainText("Memo sluit oop wanneer die tyd verstreke is");

      await page.screenshot({ path: shot(`les-terug/sessie-2026-10-11-${vp.name}.png`), fullPage: true });
      expectNoLeaks(mock);
    });
  });
}
