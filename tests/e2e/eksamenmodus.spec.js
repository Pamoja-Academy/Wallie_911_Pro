/* Eksamenmodus (PR 1): klok, antwoordarea, memo-hek, punte-selfnasien. Geen eksterne netwerk (mock-backend).
   Hier word die hek ECHT getoets (geen eksamenOntsluit-saad nie). */
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { MockBackend } = require("./mock-backend");
const { boot, expectNoLeaks, queue } = require("./helpers");

const V3 = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", "vraebank-v3.json"), "utf8"));
const RTT = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", "vraebank-rtt-v1.json"), "utf8"));
const STORE = "wallie911_vraebank_v1";
const DRAF = "wallie911_eksamen_v1";
const VIEWPORTS = [
  { name: "laptop", viewport: { width: 1366, height: 768 } },
  { name: "foon", viewport: { width: 390, height: 844 } }
];
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
/* K13: "Begin nuwe poging" vra 'n tweede klik; hierdie helper doen albei (die eerste klik alleen stel niks terug nie) */
const nuwePoging = async (page) => {
  await page.locator(".em-nuut").click();
  await page.locator(".em-nuut-ja").click();
};
const ACHT_VELDE = ["item_id", "memo_oopgemaak_na_min", "minute_gebruik", "punte_behaal", "punte_totaal", "tyd_min", "vak", "woorde"];
/* Doen een volledige skryf-poging (min. woorde → klaar → memo → punte) en druk "Stoor my punte"; gee die verwagte punte terug */
async function doenSkryfPoging(page, item) {
  await page.goto("/#skryfwerk");
  await page.locator(`.sw-item[data-id="${item.id}"]`).click();
  await page.locator(".em-antwoord").fill(woorde(item.woorde.min));
  await page.locator(".em-klaar").click();
  await expect(page.locator(".em-memo-knoppie")).toBeEnabled();
  await page.locator(".em-memo-knoppie").click();
  const inps = page.locator(".em-punt-inp");
  await inps.nth(0).fill(String(item.nasienriglyn[0].punte));
  await inps.nth(1).fill("5");
  await page.locator(".em-stoor-punte").click();
  await expect(page.locator(".em-gestoor")).toContainText("Gestoor");
  return item.nasienriglyn[0].punte + 5;
}
const woorde = (n) => Array.from({ length: n }, (_, i) => "woord" + i).join(" ");

for (const vp of VIEWPORTS) {
  test.describe(`eksamenmodus @ ${vp.name}`, () => {
    test.use({ viewport: vp.viewport });

    test("skryf: memo toe, woordtelling leef, konsep gestoor, hek ná minimum + klaar, punte per kriterium", async ({ page, context }) => {
      const item = V3.find((i) => i.id === "eng-v3-B1");
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page);
      await page.goto("/#skryfwerk");
      await page.locator(`.sw-item[data-id="${item.id}"]`).click();

      /* Memo en selfnasien is toe; geen memo-inhoud in die DOM nie */
      await expect(page.locator(".em-tyd")).toContainText(`/ ${item.tyd_min}:00`);
      await expect(page.locator(".em-memo-knoppie")).toBeDisabled();
      await expect(page.locator(".em-memo-knoppie")).toHaveText("Memo gesluit");
      await expect(page.locator(".sw-memo")).toBeHidden();
      await expect(page.locator(".sw-nasien")).toBeHidden();
      expect(await page.locator("#view-skryfwerk").innerText()).not.toContain(item.antwoord.slice(0, 40));

      /* Woordtelling teen item.woorde */
      await page.locator(".em-antwoord").fill(woorde(50));
      await expect(page.locator(".em-woorde")).toHaveText(`50 woorde (doel ${item.woorde.min}–${item.woorde.max})`);
      await expect(page.locator(".em-memo-knoppie")).toBeDisabled();

      /* Klaar gedruk maar te min woorde → bly toe */
      await page.locator(".em-klaar").click();
      await expect(page.locator(".em-memo-knoppie")).toBeDisabled();
      await expect(page.locator(".em-rede")).toContainText(`Skryf nog ${item.woorde.min - 50} woorde`);

      /* Konsep is plaaslik gestoor */
      const draf = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), DRAF);
      expect(draf.items[item.id].konsep.split(" ")).toHaveLength(50);

      /* Genoeg woorde + klaar → oop */
      await page.locator(".em-antwoord").fill(woorde(item.woorde.min));
      await expect(page.locator(".em-memo-knoppie")).toBeEnabled();
      await page.locator(".em-memo-knoppie").click();
      await expect(page.locator(".sw-memo")).toBeVisible();
      await expect(page.locator(".sw-nasien")).toBeVisible();

      /* Punte per rubriekkriterium, totaal /item-punte */
      const inps = page.locator(".em-punt-inp");
      await expect(inps).toHaveCount(item.nasienriglyn.length);
      await inps.nth(0).fill(String(item.nasienriglyn[0].punte));
      await inps.nth(1).fill("5");
      await expect(page.locator(".em-som")).toHaveText(`Totaal: ${item.nasienriglyn[0].punte + 5} / ${item.punte}`);
      await page.locator(".em-stoor-punte").click();
      await expect(page.locator(".em-gestoor")).toContainText("Gestoor");
      const st = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), STORE);
      const p = st.items[item.id].pogings[0];
      expect(p.punte_behaal).toBe(item.nasienriglyn[0].punte + 5);
      expect(p.punte_totaal).toBe(item.punte);
      expect(p.woorde).toBe(item.woorde.min);
      expect(p.tyd_min).toBe(item.tyd_min);
      expect(typeof p.minute_gebruik).toBe("number");
      expect(typeof p.memo_oopgemaak_na_min).toBe("number");

      /* Die ou drie knoppies bly as ekstra */
      await expect(page.locator(".sw-reg")).toBeVisible();
      expect(await noOverflow(page)).toBe(true);
      /* Die bediener-event (v3_poging) word in die volgende toets nagegaan; hier net: niks lek na buite nie */
      expectNoLeaks(mock);
    });

    test("v3_poging: ná 'Stoor my punte' presies EEN event met die 8 velde (sync-tou/mock v2)", async ({ page, context }) => {
      const item = V3.find((i) => i.id === "eng-v3-B1");
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page);
      const behaal = await doenSkryfPoging(page, item);
      await expect.poll(() => mock.byKind("v3_poging").length, { timeout: 10000 }).toBe(1);
      /* 'n bykomende wag: geen tweede stuur nie */
      await page.clock.runFor(2000);
      expect(mock.ingests().filter((c) => c.body.p.kind === "v3_poging")).toHaveLength(1);
      const e = mock.byKind("v3_poging")[0].body.p;
      expect(e.kind).toBe("v3_poging");
      expect(e.event_id).toMatch(/^v3_poging:eng-v3-B1:\d+$/);
      expect(Object.keys(e.data).sort()).toEqual(ACHT_VELDE);
      expect(e.data.item_id).toBe(item.id);
      expect(e.data.vak).toBe("engels");
      expect(e.data.punte_behaal).toBe(behaal);
      expect(e.data.punte_totaal).toBe(item.punte);
      expect(e.data.woorde).toBe(item.woorde.min);
      expect(e.data.minute_gebruik).toBeGreaterThanOrEqual(0);
      expect(e.data.tyd_min).toBe(item.tyd_min);
      expect(typeof e.data.memo_oopgemaak_na_min).toBe("number");
      /* Geen konsep-teks of ander persoonlike data in die payload nie */
      expect(JSON.stringify(e)).not.toContain("woord10");
      /* Aflewering klaar: tou leeg, en die mock het presies een v3_poging-ry */
      expect(await queue(page)).toEqual([]);
      expect(mock.events.filter((x) => x.kind === "v3_poging")).toHaveLength(1);
      expectNoLeaks(mock);
      expect(mock.external.filter((u) => !/fonts\.(googleapis|gstatic)\.com/.test(u))).toEqual([]);
    });

    test("v3_poging: bediener ken die soort nog nie ('bad kind') → geparkeer, aanwyser normaal, res lewer af, later vanself", async ({ page, context }) => {
      const item = V3.find((i) => i.id === "eng-v3-B1");
      /* "visibility" is 'n ou soort wat hier ook onbekend is: bad kind bly "dead" vir ander soorte (ongewysigde gedrag) */
      const mock = new MockBackend({ mode: "v2", unknownKinds: ["v3_poging", "visibility"] });
      await mock.attach(context);
      await boot(page);
      await doenSkryfPoging(page, item);
      await expect.poll(() => mock.calls.filter((c) => c.body?.p?.kind === "v3_poging").length, { timeout: 10000 }).toBe(1);
      await expect.poll(async () => (await queue(page)).find((q) => q.kind === "v3_poging")?.state, { timeout: 10000 }).toBe("parked");
      expect(mock.byKind("v3_poging")).toHaveLength(0);
      const parked = (await queue(page)).find((q) => q.kind === "v3_poging");
      expect(parked.lastError).toContain("004");

      /* Wallie se aanwyser: groen/normaal, geen rooi, geen "wag vir Pa se bediener-opgradering" nie */
      const pil = page.locator("#sync-pill");
      await expect(pil).toHaveAttribute("data-level", "ok");
      await expect(page.locator("#sync-label")).toHaveText("Gesinkroniseer");
      expect(await pil.getAttribute("title")).not.toContain("bediener-opgradering");
      const st = await page.evaluate(() => WALLIE.SYNC.status());
      expect(st).toMatchObject({ level: "ok", pending: 0, parked: 0, dead: 0 });

      /* Die res van die tou lewer steeds af; 'n ander soort met 'bad kind' bly "dead" */
      await page.evaluate(() => {
        WALLIE.SYNC.enqueue("probleem:v3p-1", { kind: "probleem", title: "PROBLEEM", body: "toets" });
        WALLIE.SYNC.enqueue("visibility:v3p-1", { kind: "visibility", title: "sigbaarheid", body: "toets" });
      });
      await expect.poll(() => mock.byKind("probleem").length, { timeout: 10000 }).toBe(1);
      await expect.poll(async () => (await queue(page)).find((q) => q.kind === "visibility")?.state, { timeout: 10000 }).toBe("dead");
      expect((await queue(page)).find((q) => q.kind === "v3_poging").state).toBe("parked");

      /* Herlaai: die geparkeerde item oorleef en bly 'n stil, normale aanwyser */
      await page.reload();
      await expect.poll(async () => (await queue(page)).find((q) => q.kind === "v3_poging")?.state).toBe("parked");
      await expect(page.locator("#sync-pill")).toHaveAttribute("data-level", "ok");
      expect(await page.evaluate(() => WALLIE.SYNC.status().parked)).toBe(0);

      /* Hanno pas 004 toe: die volgende herpoging-venster (v2RecheckMs = 30 min) lewer dit vanself af */
      mock.unknownKinds = ["visibility"];
      await page.clock.fastForward(31 * 60 * 1000);
      await page.clock.runFor(25000);
      await expect.poll(() => mock.byKind("v3_poging").length, { timeout: 10000 }).toBe(1);
      await expect.poll(async () => (await queue(page)).some((q) => q.kind === "v3_poging"), { timeout: 10000 }).toBe(false);
      expect(mock.byKind("v3_poging")[0].body.p.data.item_id).toBe(item.id);
      expectNoLeaks(mock);
    });

    test("skryf: tyd verby maak die memo oop sonder werk; die klok sit voort (geen harde afsluit)", async ({ page, context }) => {
      const item = V3.find((i) => i.id === "eng-v3-C1");
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page);
      await page.goto("/#skryfwerk");
      await page.locator(`.sw-item[data-id="${item.id}"]`).click();
      await page.locator(".em-begin").click();
      await expect(page.locator(".em-memo-knoppie")).toBeDisabled();
      await page.clock.fastForward((item.tyd_min * 60 - 5) * 1000);
      await page.clock.runFor(1000);
      await expect(page.locator(".em-memo-knoppie")).toBeDisabled();
      await page.clock.fastForward(10 * 1000);
      await page.clock.runFor(1000);
      await expect(page.locator(".em-memo-knoppie")).toBeEnabled();
      await expect(page.locator(".em-tyd")).toContainText("Tyd om");
      await expect(page.locator(".em-antwoord")).toBeEnabled();
      expectNoLeaks(mock);
    });

    test("skryf op papier: bevestiging + klaar + 60% van die tyd maak die memo oop (F2)", async ({ page, context }) => {
      const item = V3.find((i) => i.id === "eng-v3-B1");
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page);
      await page.goto("/#skryfwerk");
      await page.locator(`.sw-item[data-id="${item.id}"]`).click();
      await expect(page.locator(".em-bevestig")).toContainText("Ek het dit op papier geskryf");
      /* O5: die plekhouer verwys na die blokkie en sê nie meer "tik dit oor" nie */
      await expect(page.locator(".em-antwoord")).toHaveAttribute("placeholder", "Skryf jou antwoord hier — of skryf op papier en merk die blokkie hieronder.");
      expect(await page.locator(".em-antwoord").evaluate((e) => e.compareDocumentPosition(document.querySelector(".em-bevestig")) & Node.DOCUMENT_POSITION_FOLLOWING), "die blokkie is ONDER die antwoordarea").toBeTruthy();
      await page.locator(".em-bevestig input").check();
      await page.locator(".em-klaar").click();
      /* Bevestig + klaar, maar nog nie 60% van die tyd nie */
      await expect(page.locator(".em-memo-knoppie")).toBeDisabled();
      await expect(page.locator(".em-rede")).toContainText("Nog ±");
      await page.clock.fastForward(Math.ceil(0.6 * item.tyd_min * 60) * 1000);
      await page.clock.runFor(1000);
      await expect(page.locator(".em-memo-knoppie")).toBeEnabled();
      /* Die bevestiging is plaaslik gestoor */
      const draf = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), DRAF);
      expect(draf.items[item.id].bevestig).toBe(true);
      expect(await noOverflow(page)).toBe(true);
      expectNoLeaks(mock);
    });

    test("sessie-gekoppelde klok: die klok loop sedert vandag se sessie op die item se blok (F3)", async ({ page, context }) => {
      const item = V3.find((i) => i.id === "afr-v3-A1");
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      const sessieBegin = new Date("2026-10-16T08:00:00+02:00").getTime();
      await boot(page, {
        time: new Date("2026-10-16T08:35:00+02:00"),
        seed: {
          wallie911_v2_bok: {
            sessions: [
              { id: "s_1", date: "2026-10-16", subjectSlug: "afrikaans", startedAt: sessieBegin, endedAt: sessieBegin + 1800000, block: { id: "2026-10-16-afr-a1" } },
              /* ’n sessie op ’n ander blok tel nie */
              { id: "s_2", date: "2026-10-16", subjectSlug: "afrikaans", startedAt: sessieBegin - 3600000, block: { id: "2026-10-16-afr-b3" } }
            ]
          }
        }
      });
      await page.goto("/#skryfwerk");
      await page.locator(`.sw-item[data-id="${item.id}"]`).click();
      await expect(page.locator(".em-sessie-wenk")).toHaveText("Klok loop sedert jou sessie om 08:00 begin het.");
      await expect(page.locator(".em-tyd")).toContainText(`/ ${item.tyd_min}:00`);
      await expect(page.locator(".em-tyd")).toContainText(/^35:/);
      await expect(page.locator(".em-begin")).toBeHidden();
      /* Die effektiewe begin is plaaslik gestoor */
      const draf = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), DRAF);
      expect(draf.items[item.id].begin).toBe(sessieBegin);
      expect(await noOverflow(page)).toBe(true);
      expectNoLeaks(mock);
    });

    test("sessie-gekoppelde klok: geen sessie → geen wenk, klok begin by Begin (F3)", async ({ page, context }) => {
      const item = V3.find((i) => i.id === "afr-v3-A1");
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page, { time: new Date("2026-10-16T08:35:00+02:00") });
      await page.goto("/#skryfwerk");
      await page.locator(`.sw-item[data-id="${item.id}"]`).click();
      await expect(page.locator(".em-sessie-wenk")).toBeHidden();
      await expect(page.locator(".em-begin")).toBeVisible();
      await expect(page.locator(".em-tyd")).toContainText(/^00:00/);
      expectNoLeaks(mock);
    });

    test("nuwe poging: begin van 'n vroeër dag word geargiveer en die item begin skoon (F4)", async ({ page, context }) => {
      const item = V3.find((i) => i.id === "afr-v3-A1");
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      const gister = new Date("2026-10-15T09:00:00+02:00").getTime();
      await boot(page, {
        time: new Date("2026-10-16T08:35:00+02:00"),
        seed: {
          [DRAF]: { v: 1, items: { [item.id]: { begin: gister, konsep: "gister se opstel", bevestig: true, lêer: "gister.jpg", klaarMin: 90 } } }
        }
      });
      await page.goto("/#skryfwerk");
      await page.locator(`.sw-item[data-id="${item.id}"]`).click();
      await expect(page.locator(".em-antwoord")).toHaveValue("");
      await expect(page.locator(".em-tyd")).toContainText(/^00:00/);
      await expect(page.locator(".em-memo-knoppie")).toBeDisabled();
      await expect(page.locator(".em-nuut-meld")).toContainText("veilig bewaar");
      const rec = await page.evaluate(([k, id]) => JSON.parse(localStorage.getItem(k)).items[id], [DRAF, item.id]);
      expect(rec.begin).toBeNull();
      expect(rec.konsep).toBe("");
      expect(rec.vorige).toHaveLength(1);
      expect(rec.vorige[0]).toMatchObject({ begin: gister, konsep: "gister se opstel", bevestig: true, lêer: "gister.jpg", klaarMin: 90 });
      expectNoLeaks(mock);
    });

    test("nuwe poging op aanvraag: knoppie sigbaar sodra die klok loop; argiveer en sit alles terug (F4)", async ({ page, context }) => {
      const item = V3.find((i) => i.id === "afr-v3-A1");
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      const sessieBegin = new Date("2026-10-16T08:00:00+02:00").getTime();
      await boot(page, {
        time: new Date("2026-10-16T08:35:00+02:00"),
        seed: {
          wallie911_v2_bok: { sessions: [{ id: "s_1", date: "2026-10-16", subjectSlug: "afrikaans", startedAt: sessieBegin, block: { id: "2026-10-16-afr-a1" } }] }
        }
      });
      await page.goto("/#skryfwerk");
      await page.locator(`.sw-item[data-id="${item.id}"]`).click();
      /* Klok loop reeds (sessie) → knoppie sigbaar */
      await expect(page.locator(".em-nuut")).toBeVisible();
      await page.locator(".em-antwoord").fill("eerste poging");
      await page.locator(".em-klaar").click();
      await nuwePoging(page);
      await expect(page.locator(".em-antwoord")).toHaveValue("");
      await expect(page.locator(".em-tyd")).toContainText(/^00:00/);
      await expect(page.locator(".em-begin")).toBeVisible();
      await expect(page.locator(".em-nuut")).toBeHidden();
      await expect(page.locator(".em-memo-knoppie")).toBeDisabled();
      await expect(page.locator(".em-sessie-wenk")).toBeHidden();
      let rec = await page.evaluate(([k, id]) => JSON.parse(localStorage.getItem(k)).items[id], [DRAF, item.id]);
      expect(rec.begin).toBeNull();
      expect(rec.vorige).toHaveLength(1);
      expect(rec.vorige[0]).toMatchObject({ begin: sessieBegin, konsep: "eerste poging" });
      expect(typeof rec.sedert).toBe("number");
      /* Weer oopmaak: vandag se (ou) sessie sleep die nuwe klok nie terug nie */
      await page.reload();
      await page.goto("/#skryfwerk");
      await page.locator(`.sw-item[data-id="${item.id}"]`).click();
      await expect(page.locator(".em-tyd")).toContainText(/^00:00/);
      await expect(page.locator(".em-sessie-wenk")).toBeHidden();
      /* Nuwe poging begin: klok loop en die knoppie kom terug */
      await page.locator(".em-antwoord").fill("tweede poging");
      await expect(page.locator(".em-nuut")).toBeVisible();
      rec = await page.evaluate(([k, id]) => JSON.parse(localStorage.getItem(k)).items[id], [DRAF, item.id]);
      expect(rec.konsep).toBe("tweede poging");
      expect(rec.vorige).toHaveLength(1);
      expectNoLeaks(mock);
    });

    test("O4: 'n vroeër sessie-begin vervang die eie begin; die eie begin word bewaar (begin_eie)", async ({ page, context }) => {
      const item = V3.find((i) => i.id === "afr-v3-A1");
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      const sessieBegin = new Date("2026-10-16T08:00:00+02:00").getTime();
      const eieBegin = new Date("2026-10-16T08:20:00+02:00").getTime();
      await boot(page, {
        time: new Date("2026-10-16T08:35:00+02:00"),
        seed: {
          wallie911_v2_bok: { sessions: [{ id: "s_1", date: "2026-10-16", subjectSlug: "afrikaans", startedAt: sessieBegin, block: { id: "2026-10-16-afr-a1" } }] },
          [DRAF]: { v: 1, items: { [item.id]: { begin: eieBegin, konsep: "my begin", bevestig: false, lêer: "", klaarMin: null } } }
        }
      });
      await page.goto("/#skryfwerk");
      await page.locator(`.sw-item[data-id="${item.id}"]`).click();
      await expect(page.locator(".em-sessie-wenk")).toHaveText("Klok loop sedert jou sessie om 08:00 begin het.");
      let rec = await page.evaluate(([k, id]) => JSON.parse(localStorage.getItem(k)).items[id], [DRAF, item.id]);
      expect(rec.begin).toBe(sessieBegin);
      expect(rec.begin_eie).toBe(eieBegin);
      expect(rec.konsep).toBe("my begin");
      /* Tweede keer oopmaak: niks verander nie, begin_eie bly die eerste waarde */
      await page.reload();
      await page.goto("/#skryfwerk");
      await page.locator(`.sw-item[data-id="${item.id}"]`).click();
      rec = await page.evaluate(([k, id]) => JSON.parse(localStorage.getItem(k)).items[id], [DRAF, item.id]);
      expect(rec.begin).toBe(sessieBegin);
      expect(rec.begin_eie).toBe(eieBegin);
      expectNoLeaks(mock);
    });

    test("O4: 'n sessie sonder eie begin laat geen begin_eie na nie; nuwe poging twee keer bewaar die eerste sedert", async ({ page, context }) => {
      const item = V3.find((i) => i.id === "afr-v3-A1");
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      const sessieBegin = new Date("2026-10-16T08:00:00+02:00").getTime();
      await boot(page, {
        time: new Date("2026-10-16T08:35:00+02:00"),
        seed: {
          wallie911_v2_bok: { sessions: [{ id: "s_1", date: "2026-10-16", subjectSlug: "afrikaans", startedAt: sessieBegin, block: { id: "2026-10-16-afr-a1" } }] }
        }
      });
      await page.goto("/#skryfwerk");
      await page.locator(`.sw-item[data-id="${item.id}"]`).click();
      const lees = () => page.evaluate(([k, id]) => JSON.parse(localStorage.getItem(k)).items[id], [DRAF, item.id]);
      let rec = await lees();
      expect(rec.begin).toBe(sessieBegin);
      expect(rec.begin_eie, "geen eie begin om te bewaar nie").toBeUndefined();
      /* Eerste 'nuwe poging': geen ou sedert nie */
      await nuwePoging(page);
      rec = await lees();
      const sedert1 = rec.sedert;
      expect(typeof sedert1).toBe("number");
      expect(rec.sedert_vorige).toBeUndefined();
      /* Tweede 'nuwe poging': die eerste sedert word bewaar */
      await page.locator(".em-antwoord").fill("tweede");
      await page.clock.fastForward(60 * 1000);
      await nuwePoging(page);
      rec = await lees();
      expect(rec.sedert).toBeGreaterThan(sedert1);
      expect(rec.sedert_vorige).toBe(sedert1);
      /* Derde: sedert_vorige bly die EERSTE waarde */
      await page.locator(".em-antwoord").fill("derde");
      await page.clock.fastForward(60 * 1000);
      await nuwePoging(page);
      const rec3 = await lees();
      expect(rec3.sedert).toBeGreaterThan(rec.sedert);
      expect(rec3.sedert_vorige).toBe(sedert1);
      expect(rec3.vorige.map((v) => v.konsep), "alle pogings geargiveer").toEqual(["", "tweede", "derde"]);
      expectNoLeaks(mock);
    });

    test("O3: vorige pogings sigbaar (lees-net): datum, konsep as gewone teks, lêer; die memo bly toe", async ({ page, context }) => {
      const item = V3.find((i) => i.id === "afr-v3-A1");
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      const g1 = new Date("2026-10-15T09:00:00+02:00").getTime();
      const g2 = new Date("2026-10-15T14:30:00+02:00").getTime();
      await boot(page, {
        time: new Date("2026-10-16T08:35:00+02:00"),
        seed: {
          [DRAF]: {
            v: 1,
            items: {
              [item.id]: {
                begin: null, konsep: "", bevestig: false, lêer: "", klaarMin: null,
                vorige: [
                  { begin: g1, konsep: "Eerste reël\n<b>nie vet nie</b>\nTweede reël", bevestig: false, lêer: "", klaarMin: 50, geargiveerOp: g1 + 3000000 },
                  { begin: g2, konsep: "", bevestig: true, lêer: "opstel-foto.jpg", klaarMin: 90, geargiveerOp: g2 + 5400000 }
                ]
              }
            }
          }
        }
      });
      await page.goto("/#skryfwerk");
      await page.locator(`.sw-item[data-id="${item.id}"]`).click();
      const vorige = page.locator("details.em-vorige");
      await expect(vorige).toBeVisible();
      await expect(vorige.locator("summary")).toHaveText("Vorige pogings (2)");
      /* Toe tot Wallie dit oopmaak; dan die inhoud */
      expect(await vorige.evaluate((d) => d.open)).toBe(false);
      await vorige.locator("summary").click();
      const pogings = vorige.locator(".em-vorige-poging");
      await expect(pogings).toHaveCount(2);
      await expect(pogings.nth(0).locator(".em-vorige-datum")).toHaveText("Poging 1 · 2026-10-15 09:00");
      await expect(pogings.nth(1).locator(".em-vorige-datum")).toHaveText("Poging 2 · 2026-10-15 14:30");
      const konsep = pogings.nth(0).locator(".em-vorige-konsep");
      await expect(konsep).toHaveText("Eerste reël\n<b>nie vet nie</b>\nTweede reël");
      expect(await konsep.evaluate((e) => getComputedStyle(e).whiteSpace)).toBe("pre-wrap");
      expect(await konsep.evaluate((e) => e.children.length), "teks, nie opmaak nie (textContent)").toBe(0);
      await expect(pogings.nth(0).locator(".em-vorige-lêer")).toHaveCount(0);
      await expect(pogings.nth(1).locator(".em-vorige-konsep")).toHaveText("(geen teks bewaar nie)");
      await expect(pogings.nth(1).locator(".em-vorige-lêer")).toHaveText("Lêer: opstel-foto.jpg");
      /* Lees-net: die huidige poging is steeds skoon en die memo bly gesluit */
      await expect(page.locator(".em-antwoord")).toHaveValue("");
      await expect(page.locator(".em-memo-knoppie")).toBeDisabled();
      await expect(page.locator(".em-memo-knoppie")).toHaveText("Memo gesluit");
      await expect(page.locator(".sw-memo")).toBeHidden();
      const rec = await page.evaluate(([k, id]) => JSON.parse(localStorage.getItem(k)).items[id], [DRAF, item.id]);
      expect(rec.vorige).toHaveLength(2);
      expect(rec.vorige[1]).toMatchObject({ konsep: "", lêer: "opstel-foto.jpg", klaarMin: 90 });
      expect(await noOverflow(page)).toBe(true);
      expectNoLeaks(mock);
    });

    test("O3: geen vorige pogings → geen blok; 'Begin nuwe poging' laat dit verskyn (1) en dit groei", async ({ page, context }) => {
      const item = V3.find((i) => i.id === "afr-v3-A1");
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page, { time: new Date("2026-10-16T08:35:00+02:00") });
      await page.goto("/#skryfwerk");
      await page.locator(`.sw-item[data-id="${item.id}"]`).click();
      await expect(page.locator("details.em-vorige")).toBeHidden();
      await page.locator(".em-antwoord").fill("eerste poging");
      await nuwePoging(page);
      await expect(page.locator("details.em-vorige summary")).toHaveText("Vorige pogings (1)");
      await page.locator("details.em-vorige summary").click();
      await expect(page.locator(".em-vorige-konsep")).toHaveText("eerste poging");
      await page.locator(".em-antwoord").fill("tweede poging");
      await nuwePoging(page);
      await expect(page.locator("details.em-vorige summary")).toHaveText("Vorige pogings (2)");
      await expect(page.locator(".em-vorige-konsep")).toHaveText(["eerste poging", "tweede poging"]);
      await expect(page.locator(".em-memo-knoppie")).toBeDisabled();
      expectNoLeaks(mock);
    });

    test("prakties (RTT): papier-bevestiging + 60% van die tyd + klaar", async ({ page, context }) => {
      const item = RTT.find((i) => i.id === "rtt-v1-S01");
      const mock = new MockBackend({ mode: "v2" });
      await mock.attach(context);
      await boot(page);
      await page.goto("/#oefenvrae");
      await page.locator(".ov-item").first().click();
      const tyd = Math.max(1, Math.round((item.punte * 180) / 150)); /* min */
      await expect(page.locator(".em-memo-knoppie")).toBeDisabled();
      await page.locator(".em-bevestig input").check();
      await page.locator(".em-lêer").fill("sigblad.xlsx");
      await page.locator(".em-klaar").click();
      await expect(page.locator(".em-memo-knoppie")).toBeDisabled();
      await page.clock.fastForward(Math.ceil(0.6 * tyd * 60) * 1000);
      await page.clock.runFor(1000);
      await expect(page.locator(".em-memo-knoppie")).toBeEnabled();
      await page.locator(".em-memo-knoppie").click();
      await expect(page.locator(".oe-memo")).toBeVisible();
      const inps = page.locator(".em-punt-inp");
      await expect(inps).toHaveCount(item.nasienriglyn.length);
      for (let i = 0; i < item.nasienriglyn.length; i++) await inps.nth(i).fill(String(item.nasienriglyn[i].punte));
      await page.locator(".em-stoor-punte").click();
      const st = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), STORE);
      const p = st.items[item.id].pogings[0];
      expect(p.punte_behaal).toBe(item.punte);
      expect(p.uitslag).toBe("reg");
      expect(p.woorde).toBeUndefined();
      /* Een v3_poging-event: woorde = null vir 'n praktiese item, punte volgens die rubriek */
      await expect.poll(() => mock.byKind("v3_poging").length, { timeout: 10000 }).toBe(1);
      const ev = mock.byKind("v3_poging")[0].body.p;
      expect(Object.keys(ev.data).sort()).toEqual(ACHT_VELDE);
      expect(ev.data).toMatchObject({ item_id: item.id, vak: "rtt", punte_behaal: item.punte, punte_totaal: item.punte, woorde: null });
      expect(await noOverflow(page)).toBe(true);
      expectNoLeaks(mock);
    });
  });
}
