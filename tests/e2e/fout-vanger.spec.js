/* Foutvanger (28 Okt 2026): 'n egte fout in die blad → Wallie sien dadelik 'n kort strokie, Pa kry 'n
   "probleem"-gebeurtenis (die bestaande soort) en 'n support-ry (bron "outo"). Tydens 'n sessie bly die klok
   loop, niks vat fokus nie en niks tel as wegkyk nie.
   Spesifikasie: docs/SPEK-FOUTVANGER-2026-10-28.md §2.3 en §5. Die FOUTRAG-antwoord self word in
   tests/fout-rag.test.js getoets; hier is dit óf die antwoord óf "Onbekende fout." (albei is reg). */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot, runUntil } = require("./helpers");

const STROKIE = ".foutvanger-strokie";

/* 'n Egte, ongevangde JS-fout: 'n inlyn-skrif wat gooi (window "error", geen mikpunt nie). */
async function gooiEgteFout(page, teks) {
  await page.evaluate((t) => {
    const s = document.createElement("script");
    s.textContent = `throw new TypeError(${JSON.stringify(t)});`;
    document.body.appendChild(s);
    s.remove();
  }, teks);
}

/* Wat die strokie behoort te sê: die FOUTRAG-antwoord as die app een het, anders die eerlike teks. */
async function verwagTeks(page, navraag) {
  return page.evaluate((q) => {
    try {
      const t = window.WALLIE.FOUTRAG && window.WALLIE.FOUTRAG.soek(q, {});
      return t && t.antwoord ? t.antwoord : null;
    } catch (e) {
      return null;
    }
  }, navraag);
}

test("egte JS-fout: strokie, probleem-gebeurtenis en support-ry; dieselfde fout 'n 2de keer is stil", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page);
  await page.goto("/#missie");
  await expect(page.locator("#sync-pill")).toBeVisible();

  const hash = await page.evaluate(() => location.hash);
  await gooiEgteFout(page, "e2e_kaart is not a function");

  const strokie = page.locator(STROKIE);
  await expect(strokie).toBeVisible();
  await expect(strokie).toHaveAttribute("role", "status");
  const antwoord = await verwagTeks(page, "TypeError: e2e_kaart is not a function");
  const teks = ((await strokie.locator("p").textContent()) || "").trim();
  expect(teks).toContain("Pa kry dit sodra daar internet is.");
  expect(teks).toContain(antwoord || "Onbekende fout.");
  /* Wallie sien nooit 'n stack trace of 'n lêerpad met reëlnommer nie */
  expect(teks).not.toMatch(/\bat\s+\S+\s*\(|:\d+:\d+|\.js:\d+/);
  await expect(strokie.locator("button")).toHaveCount(1);

  /* Pa kry dit deur die bestaande pad: kind "probleem" (geen nuwe soort nie) */
  await runUntil(page, async () => mock.byKind("probleem").length === 1, { label: "probleem afgelewer" });
  const p = mock.byKind("probleem")[0].body.p;
  expect(p.kind).toBe("probleem");
  expect(p.title).toBe("PROBLEEM");
  expect(p.body).toContain("OUTOMATIESE FOUT");
  expect(p.body).toContain("e2e_kaart is not a function");
  expect(p.data).toMatchObject({ bron: "outo", soort: "js", insessie: false });
  expect(new Set(mock.delivered().map((c) => c.body.p.kind))).toEqual(new Set(["probleem"]));
  expect(p.body).not.toMatch(/\bat\s+\S+\s*\(/);

  /* ... en in wallie911.support met bron "outo" */
  await runUntil(page, async () => mock.support.length === 1, { label: "support-ry afgelewer" });
  expect(mock.support[0].profile).toBe("wallie911");
  expect(mock.support[0].body.context).toMatchObject({ bron: "outo", skerm: "#missie" });
  expect(mock.support[0].body.skerm).toBe(hash || "outo");
  expect(mock.supportRejected || 0).toBe(0);

  /* Toe-knoppie werk buite 'n sessie */
  await strokie.locator("button").click();
  await expect(strokie).toHaveCount(0);

  /* Dieselfde fout (ander reëlnommer maak nie saak nie) binne 10 min: stil */
  await gooiEgteFout(page, "e2e_kaart is not a function");
  await page.waitForTimeout(200);
  await expect(strokie).toHaveCount(0);
  expect(mock.byKind("probleem")).toHaveLength(1);

  /* Die ontdubbel-register is die enigste nuwe sleutel */
  const reg = await page.evaluate(() => JSON.parse(localStorage.getItem("w911_fout_seine") || "null"));
  expect(reg && reg.v).toBe(1);
  expect(Object.keys(reg.s)).toHaveLength(1);
});

test("gebreekte belofte en skrif wat nie laai nie word ook gevang", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page);
  await page.goto("/#missie");
  await expect(page.locator("#sync-pill")).toBeVisible();

  await page.evaluate(() => { Promise.reject(new TypeError("e2e_belofte het gebreek")); });
  await expect(page.locator(STROKIE)).toBeVisible();
  await runUntil(page, async () => mock.byKind("probleem").length === 1, { label: "belofte-probleem afgelewer" });
  expect(mock.byKind("probleem")[0].body.p.data.soort).toBe("belofte");

  await page.evaluate(() => {
    const s = document.createElement("script");
    s.src = "assets/js/bestaan-nie-e2e.js";
    document.body.appendChild(s);
  });
  await runUntil(page, async () => mock.byKind("probleem").length === 2, { label: "hulpbron-probleem afgelewer" });
  const h = mock.byKind("probleem")[1].body.p;
  expect(h.data).toMatchObject({ soort: "hulpbron", bron: "outo" });
  expect(h.data.sein).toBe("hulpbron|script|assets/js/bestaan-nie-e2e.js");

  /* 'n Lettertipe/CDN-bron buite ons bediener is nie ons fout nie */
  await page.evaluate(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Bestaan+Nie";
    document.head.appendChild(l);
  });
  await page.waitForTimeout(300);
  expect(mock.byKind("probleem")).toHaveLength(2);
});

test("hand-pad en limiet: meld() ontdubbel, en nooit meer as 20 per sessie nie", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page);
  await page.goto("/#missie");
  await expect(page.locator("#sync-pill")).toBeVisible();

  const uitslae = await page.evaluate(() => {
    const FV = window.WALLIE.FOUTVANGER;
    const r = [FV.meld(new Error("e2e_hand een"), { bron: "e2e" }), FV.meld(new Error("e2e_hand een"), { bron: "e2e" })];
    for (let i = 0; i < 30; i += 1) r.push(FV.meld("e2e_unieke " + "abcdefghijklmnopqrstuvwxyz".charAt(i % 26) + "-" + "xyz".charAt(Math.floor(i / 26)), { wys: false }));
    return { eerste: r.slice(0, 2), gemeld: FV.gemeld(), laaste: r[r.length - 1] };
  });
  expect(uitslae.eerste).toEqual(["gemeld", "dubbel"]);
  expect(uitslae.gemeld).toBe(20);
  expect(uitslae.laaste).toBe("limiet");
});

test("tydens 'n sessie: klok loop aan, geen fokus-steel, geen wegkyk-waarskuwing, niks geblokkeer", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page);
  await page.goto("/#missie");
  await expect(page.locator("#sync-pill")).toBeVisible();

  const btn = page.locator(".start-block").first();
  await btn.click();
  await runUntil(page, async () => mock.byKind("start").length === 1, { label: "start afgelewer" });
  expect(await page.evaluate(() => window.WALLIE.proctor.active)).toBe(true);

  /* Laat die begin-genade verby gaan, dan 'n basislyn */
  await page.clock.runFor(10000);
  const voor = await page.evaluate(() => ({
    left: window.WALLIE.proctor.timeLeft(),
    warnings: window.WALLIE.proctor.warnings,
    total: window.WALLIE.proctor.totalWarnings,
    locks: window.WALLIE.proctor.locks,
    fokus: document.activeElement ? document.activeElement.tagName + "#" + document.activeElement.id : ""
  }));

  await gooiEgteFout(page, "e2e_sessie is not a function");
  const strokie = page.locator(STROKIE);
  await expect(strokie).toBeVisible();
  await expect(strokie).toContainText("Pa kry dit sodra daar internet is.");

  /* Niks geblokkeer: geen knoppie, tikke gaan deur */
  await expect(strokie.locator("button")).toHaveCount(0);
  expect(await strokie.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none");
  /* Geen modal oop wat die sessie bedek nie */
  expect(await page.evaluate(() => document.querySelectorAll(".modal:not(.hidden)").length)).toBe(0);

  /* Fokus staan waar dit was */
  expect(await page.evaluate(() => (document.activeElement ? document.activeElement.tagName + "#" + document.activeElement.id : ""))).toBe(voor.fokus);
  expect(await page.evaluate(() => !!(document.activeElement && document.activeElement.closest(".foutvanger-strokie")))).toBe(false);

  /* Die klok loop aan; geen waarskuwing, geen slot; die blaai-tik op die sessie werk */
  await page.clock.runFor(5000);
  const na = await page.evaluate(() => ({
    active: window.WALLIE.proctor.active,
    left: window.WALLIE.proctor.timeLeft(),
    warnings: window.WALLIE.proctor.warnings,
    total: window.WALLIE.proctor.totalWarnings,
    locks: window.WALLIE.proctor.locks,
    locked: window.WALLIE.proctor.locked,
    away: window.WALLIE.proctor.away
  }));
  expect(na.active).toBe(true);
  expect(na.locked).toBe(false);
  expect(na.warnings).toBe(voor.warnings);
  expect(na.total).toBe(voor.total);
  expect(na.locks).toBe(voor.locks);
  expect(na.away).toBe(false);
  expect(voor.left - na.left).toBeGreaterThanOrEqual(4000);
  expect(voor.left - na.left).toBeLessThanOrEqual(6500);

  await runUntil(page, async () => mock.byKind("probleem").length === 1, { label: "sessie-probleem afgelewer" });
  expect(mock.byKind("probleem")[0].body.p.data.insessie).toBe(true);
  expect(mock.byKind("warn")).toHaveLength(0);
  expect(mock.byKind("lock")).toHaveLength(0);

  /* Die strokie verdwyn self (12 s) en die sessie bly aan */
  await page.clock.runFor(13000);
  await expect(strokie).toHaveCount(0);
  expect(await page.evaluate(() => window.WALLIE.proctor.active)).toBe(true);

  /* Die sessie kan nog gewoon eindig */
  await page.locator("#end-session").click();
  await runUntil(page, async () => mock.byKind("end").length === 1, { label: "einde afgelewer" });
});
