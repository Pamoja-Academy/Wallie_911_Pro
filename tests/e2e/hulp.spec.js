/* Hulp-paneel: knoppie maak oop, kortpad navigeer, Esc en agtergrond maak toe. */
const { test, expect } = require("@playwright/test");
const { MockBackend } = require("./mock-backend");
const { boot } = require("./helpers");
/* 28 Okt: die ou teks het hulp "binne ongeveer 10 minute per e-pos" belowe. Daar is geen e-pos-pad
   in hierdie app nie en daar was nooit een nie — die melding het in wallie911.support gaan lê, wat
   niks lees nie. Die nuwe teks sê net wat gebeur, en die vorm stuur nou ook 'n `probleem`-event
   sodat Pa dit werklik sien. Sien docs/SPEK-FOUTVANGER-2026-10-28.md §1 (F1, F2, F4). */
const GESTUUR = "Gestuur. Pa sien dit op sy konsole.";
const GESTUUR_MET_ANTWOORD = "Gestuur — Pa sien dit. Hier is wat jy nou kan doen:";
/* Geen boodskap in die app mag ooit weer hulp per e-pos belowe nie. */
const VERBODE = /e-pos|gmail|epos/i;

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

  /* Bugbot: 'n oop paneel mag nie sleutels vang terwyl 'n .modal oop is nie */
  await page.click("#hulp-fab");
  await expect(page.locator("#hulp-paneel")).toBeVisible();
  await page.evaluate(() => document.getElementById("wallie-survey-modal").classList.remove("hidden"));
  await expect(page.locator("#hulp-paneel")).toBeHidden();
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!(document.activeElement && document.activeElement.closest("#hulp-paneel")))).toBe(false);
  await page.evaluate(() => document.getElementById("wallie-survey-modal").classList.add("hidden"));

  /* Bugbot: die lyf kan krimp en rol (min-height: 0) */
  await page.setViewportSize({ width: 390, height: 480 });
  await page.click("#hulp-fab");
  const rol = await page.evaluate(() => {
    const b = document.querySelector(".hulp-body");
    const s = getComputedStyle(b);
    return { min: s.minHeight, meer: b.scrollHeight > b.clientHeight + 1 };
  });
  expect(rol.min).toBe("0px");
  expect(rol.meer).toBe(true);

  /* Bugbot: die knoppie dek nie #live-dot nie */
  for (const size of [{ width: 1280, height: 860 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size);
    const oor = await page.evaluate(() => {
      const a = document.querySelector("#hulp-fab").getBoundingClientRect();
      const b = document.querySelector("#live-dot").getBoundingClientRect();
      const mis = a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom;
      return !mis;
    });
    expect(oor, `FAB oor #live-dot by ${size.width}`).toBe(false);
  }
});

test("hulp: soek rubriek, en elke vak-skerm wys sy eie inskrywings", async ({ page, context }) => {
  await new MockBackend({ mode: "v1" }).attach(context);
  await boot(page);
  await page.goto("/#leer");
  await page.click('.leer-subject[data-leer="engels"]');
  await page.click("#hulp-fab");
  const paneel = page.locator("#hulp-paneel");
  await expect(paneel).toBeVisible();
  const engels = paneel.locator('.hulp-groep[data-vak="engels"]');
  await expect(engels).toBeVisible();
  await expect(engels).toContainText("My skryfstuk (opstel, brief, dialoog) stoor nie in die app nie.");
  await expect(engels).toContainText("Waar kry ek die rubriek?");
  await expect(paneel.locator('.hulp-groep[data-vak="rtt"]')).toHaveCount(0);

  const ander = [
    ["afrikaans", "Afrikaans Huistaal", "My skryfstuk (opstel, brief, dialoog) stoor nie in die app nie."],
    ["gasvryheid", "Gasvryheidstudie", "ongeveer 1 minuut per punt"],
    ["toerisme", "Toerisme", "ongeveer 1 minuut per punt"],
    ["wiskgelett", "Wiskundige Geletterdheid", "ongeveer 1 minuut per punt"],
    ["rtt", "RTT (CAT)", "Word, Excel of die datalêer maak nie oop nie."]
  ];
  for (const [slug, titel, teks] of ander) {
    await page.keyboard.press("Escape");
    await page.click(`.leer-subject[data-leer="${slug}"]`);
    await page.click("#hulp-fab");
    const groep = paneel.locator(`.hulp-groep[data-vak="${slug}"]`);
    await expect(groep).toBeVisible();
    await expect(groep.locator("h3")).toHaveText(titel);
    await expect(groep).toContainText(teks);
  }

  const na = (view) => page.evaluate((v) => document.querySelector(`.nav-btn[data-view="${v}"]`).click(), view);
  await page.keyboard.press("Escape");
  await na("oefenvrae");
  await page.click("#hulp-fab");
  await expect(paneel.locator('.hulp-groep[data-vak="rtt"]')).toContainText("Die DBE-skakel (vraestel, datalêer of memo) laai nie.");
  await page.keyboard.press("Escape");
  await na("skryfwerk");
  await page.locator(".sw-item").first().click();
  await page.click("#hulp-fab");
  await expect(paneel.locator('.hulp-groep[data-vak="engels"]')).toContainText("Die vraestel of memo maak nie oop nie");
  await page.keyboard.press("Escape");
  await na("sessie");
  await page.locator("#session-subject").selectOption("afrikaans");
  await page.click("#hulp-fab");
  await expect(paneel.locator('.hulp-groep[data-vak="afrikaans"]')).toContainText("Hoeveel tyd het ek per skryfvraag?");

  await page.locator("#hulp-soek").fill("rubriek");
  await expect(paneel.locator(".hulp-qa", { hasText: "Waar kry ek die rubriek?" })).toBeVisible();
  await expect(paneel.locator(".hulp-qa", { hasText: "Waar kry ek die rubriek?" })).toContainText("Wys memo");
});

test("hulp: Stuur probleem skryf na wallie911.support en tou vanlyn", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page);
  await page.goto("/#leer");
  await page.click('.leer-subject[data-leer="engels"]');
  await page.click("#hulp-fab");

  await page.locator("#hulp-vak").selectOption("engels");
  await page.locator("#hulp-gebeur").fill("Die app het my gesluit terwyl ek die memo lees.");
  await expect(page.locator("#hulp-skerm")).toHaveValue("Engels EAT");
  await page.locator("#hulp-stuur").click();
  /* Dit is 'n simptoom wat die fout-RAG sterk ken (les-oortjie-slot, >0.5), dus kom die antwoord-weergawe.
     "Die memo-knoppie reageer nie" is 28 Okt (QC rondte 2) bewus na 'n eerlike null verskuif: vrye teks onder 0.5 is onbetroubaar. */
  await expect(page.locator("#hulp-status")).toHaveText(GESTUUR_MET_ANTWOORD);
  await expect(page.locator("#hulp-antwoord")).toBeVisible();
  await expect(page.locator("#hulp-status")).not.toHaveText(VERBODE);

  const key = await page.evaluate(() => WALLIE.LIVE.key);
  expect(mock.support).toHaveLength(1);
  expect(mock.support[0]).toMatchObject({
    method: "POST",
    apikey: key,
    profile: "wallie911",
    body: {
      vak: "engels", gebeur: "Die app het my gesluit terwyl ek die memo lees.", skerm: "Engels EAT",
      category: "engels", message: "Die app het my gesluit terwyl ek die memo lees.",
      context: { skerm: "Engels EAT", bron: "hulp" }
    }
  });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("w911_support_queue") || "[]"))).toEqual([]);

  mock.mode = "offline";
  await page.locator("#hulp-gebeur").fill("Nou is ek vanlyn.");
  await page.locator("#hulp-stuur").click();
  await expect(page.locator("#hulp-status")).toContainText("op hierdie toestel gestoor");
  const tou = await page.evaluate(() => JSON.parse(localStorage.getItem("w911_support_queue") || "[]"));
  expect(tou).toHaveLength(1);
  expect(tou[0]).toMatchObject({ vak: "engels", gebeur: "Nou is ek vanlyn.", skerm: "Engels EAT" });
  expect(mock.support).toHaveLength(1);

  mock.mode = "v1";
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect.poll(() => mock.support.length).toBe(2);
  expect(mock.support[1].body).toMatchObject({ vak: "engels", gebeur: "Nou is ek vanlyn.", skerm: "Engels EAT" });
  expect(mock.support[1].profile).toBe("wallie911");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("w911_support_queue") || "[]"))).toEqual([]);
  await expect(page.locator("#hulp-status")).toHaveText(GESTUUR);
});

/* F1/F2: die vorm moet ook 'n `probleem`-event stuur, anders sien Pa dit nooit (support word nie gelees).
   `probleem` is 'n soort wat wallie_ingest_v2 reeds ken — geen skemawysiging nie (AGENTS.md §2.2). */
test("hulp: Stuur probleem stuur ook 'n probleem-event sodat Pa dit sien", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v2" });
  await mock.attach(context);
  await boot(page);
  await page.goto("/#leer");
  await page.click("#hulp-fab");
  await page.locator("#hulp-vak").selectOption("rtt");
  await page.locator("#hulp-gebeur").fill("Die datalêer wil nie oopgaan nie.");
  await page.locator("#hulp-skerm").fill("Sessie");
  await page.locator("#hulp-stuur").click();

  await expect.poll(() => mock.byKind("probleem").length).toBe(1);
  const p = mock.byKind("probleem")[0].body.p;
  expect(p.body).toContain("Die datalêer wil nie oopgaan nie.");
  expect(p.body).toContain("Vak: rtt");
  expect(p.data).toMatchObject({ bron: "hulp", vak: "rtt", skerm: "Sessie" });
  /* Geen nuwe event-soort nie: net soorte wat wallie_ingest_v2 reeds ken. */
  const bekend = ["start", "heartbeat", "warn", "lock", "unlock", "memo", "end", "survey",
    "pa-survey", "probleem", "offline", "idle", "active", "visibility", "block", "plan"];
  const soorte = [...new Set(mock.calls.filter((c) => /wallie_ingest/.test(c.name)).map((c) => c.body.p.kind))];
  expect(soorte.filter((k) => !bekend.includes(k))).toEqual([]);
});

const GESTUUR_TEKS = GESTUUR;

test("hulp: liggaam se sleutels == skema-fiksture se kolomme (geen 0-rye meer nie)", async ({ page, context }) => {
  const fx = require("../fixtures/support-schema.json");
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page);
  await page.goto("/#leer");
  await page.click("#hulp-fab");
  await page.locator("#hulp-vak").selectOption("rtt");
  await page.locator("#hulp-gebeur").fill("Skema-toets");
  await page.locator("#hulp-skerm").fill("Sessie");
  await page.locator("#hulp-stuur").click();
  await expect(page.locator("#hulp-status")).toHaveText(GESTUUR_TEKS);
  expect(mock.supportRejected || 0).toBe(0);
  expect(mock.support).toHaveLength(1);
  const keys = Object.keys(mock.support[0].body).sort();
  expect(keys).toEqual([...fx.client_writes].sort());
  for (const k of keys) expect(fx.columns).toContain(k);
  expect(mock.support[0].body.app_version).toBe(await page.evaluate(() => WALLIE.APP_VERSION));
});

test("hulp: ou 'Iets werk nie'-vorm skryf ook na wallie911.support", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "v1" });
  await mock.attach(context);
  await boot(page);
  await page.goto("/#probleem");
  const dialoog = new Promise((r) => page.once("dialog", async (d) => { r(d.message()); await d.accept(); }));
  await page.locator('input[name="bugTipe"][value="proctor"]').check();
  await page.locator("#bug-detail").fill("Die app het my gesluit terwyl ek die memo lees.");
  await page.locator("#bug-form button[type=submit]").click();
  const boodskap1 = await dialoog;
  /* Hierdie toets het vroeër die e-pos-belofte GEËIS ("10 minute per e-pos"). Dit was 'n belofte wat
     die app nooit kon hou. Nou is dit die omgekeerde: die boodskap mag e-pos nooit noem nie. */
  expect(boodskap1).not.toMatch(VERBODE);
  expect(boodskap1).toContain("Pa sien dit onder Verbeter");
  /* Hierdie simptoom ken die fout-RAG sterk: die raad moet saamkom. */
  expect(boodskap1).toContain("Doen dit solank:");
  await expect.poll(() => mock.support.length).toBe(1);
  expect(mock.support[0].profile).toBe("wallie911");
  expect(mock.support[0].body).toMatchObject({
    vak: "algemeen",
    gebeur: "Die app het my gesluit terwyl ek die memo lees.",
    skerm: "Iets werk nie (proctor, irriterend)",
    context: { bron: "iets-werk-nie", extra: { tipe: "proctor", severity: "irriterend" } }
  });
});

test("hulp: 'Iets werk nie' belowe nie e-pos as die tou nie gestoor kon word nie", async ({ page, context }) => {
  const mock = new MockBackend({ mode: "offline" });
  await mock.attach(context);
  await boot(page);
  await page.goto("/#probleem");
  /* Soos privaat modus / vol geheue: net die support-tou kan nie skryf nie */
  await page.evaluate(() => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === "w911_support_queue") throw new Error("QuotaExceededError");
      return orig.call(this, k, v);
    };
  });
  const dialoog = new Promise((r) => page.once("dialog", async (d) => { r(d.message()); await d.accept(); }));
  await page.locator('input[name="bugTipe"][value="proctor"]').check();
  await page.locator("#bug-detail").fill("Geen berging nie.");
  await page.locator("#bug-form button[type=submit]").click();
  const boodskap = await dialoog;
  expect(boodskap).toContain("kon nie gestuur");
  expect(boodskap).not.toMatch(VERBODE);
  expect(mock.support).toHaveLength(0);
});

/* Die hele app mag nooit weer hulp per e-pos belowe nie — 'n hek op die bronkode self, want die
   belofte het 6 dae lank in twee lêers gestaan sonder dat 'n toets dit gevang het. */
test("geen boodskap in die app belowe hulp per e-pos nie", async () => {
  const fs = require("fs");
  const path = require("path");
  const root = path.join(__dirname, "..", "..");
  for (const lêer of ["assets/js/hulp.js", "assets/js/app.js", "assets/js/fout-vanger.js"]) {
    const bron = fs.readFileSync(path.join(root, lêer), "utf8").replace(/\r\n/g, "\n");
    bron.split("\n").forEach((reël, i) => {
      /* kommentaar mag die ou belofte beskryf; teks wat Wallie sien, nooit */
      const kaal = reël.trim();
      if (kaal.startsWith("/*") || kaal.startsWith("*") || kaal.startsWith("//")) return;
      if (/hulp kom|per e-pos|kyk jou gmail/i.test(reël)) {
        throw new Error(`${lêer}:${i + 1} belowe weer hulp per e-pos: ${kaal.slice(0, 120)}`);
      }
    });
  }
});
